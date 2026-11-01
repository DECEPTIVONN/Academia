/**
 * qr-pairing.ts — pareamento de sessão entre aparelhos (login por QR Code)
 *
 * Fluxo real (v4.65.0):
 *   1. o aparelho SEM sessão abre "Entrar por QR Code" → gera um código
 *      `PLN-XXXX-XXXX`, desenha o QR com a URL `…/#qr=CODIGO` e **escuta**
 *      o canal Realtime `evofit-login-pair:CODIGO`;
 *   2. o aparelho JÁ conectado abre o link do QR (ou Configurações →
 *      Segurança → Autorizar outro aparelho), confirma o código e publica
 *      no mesmo canal os tokens da sessão atual;
 *   3. o primeiro recebe os tokens, chama `supabase.auth.setSession()` e
 *      entra — sem digitar senha.
 *
 * REVOGAÇÃO DE USO ÚNICO (v4.67.0): o canal Realtime continua sendo o
 * transporte dos tokens, mas agora o código é REGISTRADO no servidor
 * (`pairing_codes`, RPC `pairing_create`) e CONSUMIDO de forma atômica
 * (`pairing_claim`) antes de qualquer token sair. Quem receber o link depois
 * do primeiro uso recebe `used` — o código está revogado mesmo dentro dos 5
 * minutos. O canal deixa de ser a credencial: o código é válido uma vez só.
 *
 * MODO DEGRADADO: sem rede no aparelho que exibe o QR, o código não é
 * registrado (`pairing_create` falha) e o pareamento volta ao comportamento
 * antigo — o claim responde `unknown` e o envio acontece com um aviso na UI.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSyncSupabaseClient, isSyncConfigured } from '@/core/sync/supabase-client';
import { supabase, isSupabaseConfigured } from '@/core/supabase';

/** Validade do código exibido no QR (5 minutos, igual à UI). */
export const PAIRING_TTL_MS = 5 * 60 * 1000;

const CHANNEL_PREFIX = 'evofit-login-pair';
const CODE_RE = /^PLN-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
/* Sem 0/O/1/I para não confundir na digitação manual. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TOKENS_EVENT = 'tokens';

export interface PairingTokens {
  access_token: string;
  refresh_token: string;
  /** epoch ms — validade declarada do pareamento (o receptor recusa expirado). */
  expiresAt: number;
  /** Só para exibir no aparelho que autoriza (nunca é usado para autenticar). */
  account?: string;
}

/** O pareamento exige Supabase configurado (usa o canal Realtime). */
export function isPairingSupported(): boolean {
  return isSyncConfigured();
}

function randomChunk(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Código novo no formato PLN-XXXX-XXXX (não ambíguo ao digitar). */
export function createPairingCode(): string {
  return `PLN-${randomChunk(4)}-${randomChunk(4)}`;
}

/** URL que o QR carrega (o código vai no fragmento: não é enviado ao servidor). */
export function buildPairingUrl(code: string): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/#qr=${code}`;
}

/**
 * Extrai o código de um texto qualquer: URL com `#qr=`/`?qr=`, link colado
 * ou o próprio código digitado. Devolve `null` quando não é um código válido.
 */
export function normalizePairingCode(input: string): string | null {
  if (!input) return null;
  let raw = String(input).trim();

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const fromHash = url.hash
        .replace(/^#/, '')
        .split('&')
        .map((part) => part.split('='))
        .find(([key]) => key === 'qr')?.[1];
      raw = fromHash || url.searchParams.get('qr') || '';
    } catch {
      return null;
    }
  }

  raw = decodeURIComponent(raw)
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');

  if (!raw.startsWith('PLN-')) raw = `PLN-${raw.replace(/^-/, '')}`;
  return CODE_RE.test(raw) ? raw : null;
}

/** Código presente na URL atual (fragmento tem prioridade sobre a query). */
export function readPairingCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const { hash, search } = window.location;
  const fromHash = hash.replace(/^#/, '').split('&').find((p) => p.startsWith('qr='));
  if (fromHash) return normalizePairingCode(fromHash);
  const param = new URLSearchParams(search).get('qr');
  return param ? normalizePairingCode(param) : null;
}

/** Remove o código da URL (não deixa o link com o código no histórico). */
export function clearPairingCodeFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.hash = '';
    url.searchParams.delete('qr');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* histórico indisponível: mantém como está */
  }
}

function channelName(code: string): string {
  return `${CHANNEL_PREFIX}:${code}`;
}

/** Espera o canal ficar SUBSCRIBED (Realtime é assíncrono). */
function waitForSubscribed(channel: RealtimeChannel, timeoutMs = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    const timer = window.setTimeout(() => finish(false), timeoutMs);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        window.clearTimeout(timer);
        finish(true);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        window.clearTimeout(timer);
        finish(false);
      }
    });
  });
}

export interface PairingListener {
  /** Canal pronto para receber o pareamento. */
  onReady?: () => void;
  /** Tokens recebidos e ainda válidos. */
  onTokens: (tokens: PairingTokens) => void;
  /** Código expirado no momento em que os tokens chegaram. */
  onExpired?: () => void;
  /** Sem Supabase configurado ou falha de canal. */
  onUnavailable?: () => void;
}

/**
 * Escuta o canal do código (aparelho que quer entrar). Devolve a função de
 * cancelamento — chame ao fechar a tela ou ao expirar o código.
 */
export function listenForPairingTokens(code: string, listener: PairingListener): () => void {
  const client = getSyncSupabaseClient();
  if (!client) {
    listener.onUnavailable?.();
    return () => {};
  }

  const channel = client.channel(channelName(code));
  channel.on('broadcast', { event: TOKENS_EVENT }, (message) => {
    const payload = message.payload as PairingTokens | undefined;
    if (!payload?.access_token || !payload?.refresh_token) return;
    if (typeof payload.expiresAt === 'number' && Date.now() > payload.expiresAt) {
      listener.onExpired?.();
      return;
    }
    listener.onTokens(payload);
  });

  void waitForSubscribed(channel).then((ok) => {
    if (ok) listener.onReady?.();
    else listener.onUnavailable?.();
  });

  return () => {
    void client.removeChannel(channel);
  };
}

/* ── Uso único no servidor (v4.67.0) ── */

export type PairingClaim = 'ok' | 'used' | 'expired' | 'unknown' | 'error';

/**
 * Registra o código no servidor (aparelho que exibe o QR). `false` = sem
 * rede/Supabase: o pareamento segue em modo degradado (sem revogação).
 */
export async function registerPairingCode(code: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await (supabase as any).rpc('pairing_create', { p_code: code });
    return !error;
  } catch {
    return false;
  }
}

/** Consome o código (aparelho conectado). Ver `PairingClaim`. */
export async function claimPairingCode(code: string): Promise<PairingClaim> {
  if (!isSupabaseConfigured) return 'unknown';
  try {
    const { data, error } = await (supabase as any).rpc('pairing_claim', { p_code: code });
    if (error) return 'error';
    if (data === 'ok' || data === 'used' || data === 'expired' || data === 'unknown') return data;
    return 'error';
  } catch {
    return 'error';
  }
}

/** Status do código (opcional, para a tela do QR detectar revogação cedo). */
export async function fetchPairingStatus(code: string): Promise<PairingClaim> {
  if (!isSupabaseConfigured) return 'unknown';
  try {
    const { data, error } = await (supabase as any).rpc('pairing_status', { p_code: code });
    if (error) return 'error';
    if (data === 'claimed') return 'used';
    if (data === 'pending') return 'ok';
    if (data === 'expired') return 'expired';
    return 'unknown';
  } catch {
    return 'error';
  }
}

export interface PairingSendResult {
  ok: boolean;
  reason: 'sent' | 'used' | 'expired' | 'unavailable' | 'degraded';
}

/**
 * Consome o código e publica os tokens no canal (aparelho já conectado).
 * O claim acontece ANTES do broadcast: sem ele nada é enviado, então o código
 * vale uma única vez.
 */
export async function sendPairingTokens(
  code: string,
  tokens: PairingTokens,
): Promise<PairingSendResult> {
  const claim = await claimPairingCode(code);
  if (claim === 'used') return { ok: false, reason: 'used' };
  if (claim === 'expired') return { ok: false, reason: 'expired' };
  if (claim === 'error') return { ok: false, reason: 'unavailable' };

  const client = getSyncSupabaseClient();
  if (!client) return { ok: false, reason: 'unavailable' };

  const channel = client.channel(channelName(code));
  const ready = await waitForSubscribed(channel);
  if (!ready) {
    void client.removeChannel(channel);
    return { ok: false, reason: 'unavailable' };
  }

  const result = await channel.send({ type: 'broadcast', event: TOKENS_EVENT, payload: tokens });
  /* Dá tempo do frame sair antes de derrubar o canal. */
  window.setTimeout(() => {
    void client.removeChannel(channel);
  }, 1500);

  return result === 'ok'
    ? { ok: true, reason: claim === 'unknown' ? 'degraded' : 'sent' }
    : { ok: false, reason: 'unavailable' };
}
