/**
 * supabase-client.ts — Cliente Supabase configurável pelo painel (v4.9.0-sync)
 *
 * Port do getStandaloneSupabaseClient() do SupabaseSyncSecurityStandalone.tsx:
 *   • URL + Anon Key salvas no localStorage (mbc_supabase_url / mbc_supabase_anon_key)
 *     pelo painel de Configurações → Nuvem;
 *   • fallback seguro para VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (.env);
 *   • cache da instância (resetado quando as credenciais mudam);
 *   • chave de sincronização (mbc_sync_key) usada como namespace dos dados.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL_KEY = 'mbc_supabase_url';
export const SUPABASE_ANON_KEY = 'mbc_supabase_anon_key';
export const SYNC_KEY_STORAGE = 'mbc_sync_key';
export const SYNC_REVOKED_KEY = 'mbc_sync_revoked';
export const LAST_SYNC_AT_KEY = 'mbc_last_sync_at';

export const DEFAULT_SYNC_KEY = 'ACADEMIA_SYNC';

let cachedClient: SupabaseClient | null = null;
let cachedSignature = '';

function readCredentials(): { url: string; key: string } {
  if (typeof window === 'undefined') return { url: '', key: '' };
  const url =
    localStorage.getItem(SUPABASE_URL_KEY) ||
    (import.meta.env.VITE_SUPABASE_URL as string) ||
    '';
  const key =
    localStorage.getItem(SUPABASE_ANON_KEY) ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
    '';
  return { url: url.trim(), key: key.trim() };
}

/** Credenciais preenchidas (painel ou .env)? */
export function isSyncConfigured(): boolean {
  const { url, key } = readCredentials();
  return Boolean(url && key && !url.includes('placeholder'));
}

/** Instância do cliente Supabase para sync (null quando não configurado). */
export function getSyncSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  const { url, key } = readCredentials();
  if (!url || !key || url.includes('placeholder')) return null;

  const signature = `${url}|${key}`;
  if (cachedClient && cachedSignature === signature) return cachedClient;

  try {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
    cachedSignature = signature;
    return cachedClient;
  } catch (err) {
    console.error('[sync] Falha ao instanciar Supabase:', err);
    cachedClient = null;
    cachedSignature = '';
    return null;
  }
}

/** Persiste credenciais editadas no painel e invalida o cache do cliente. */
export function saveSupabaseCredentials(url: string, anonKey: string): void {
  localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
  /* Projeto/credenciais diferentes = histórico de sync anterior não vale.
     Sem isso, o LWW poderia ignorar o snapshot do novo projeto. */
  localStorage.removeItem(LAST_SYNC_AT_KEY);
  cachedClient = null;
  cachedSignature = '';
}

/** Testa a conexão selecionando a tabela user_sync (SQL do reference). */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  const client = getSyncSupabaseClient();
  if (!client) {
    return { ok: false, message: 'Preencha a URL e a Anon Key do Supabase!' };
  }
  const { error } = await client.from('user_sync').select('sync_key').limit(1);
  if (error) {
    if (/relation .* does not exist|schema cache/i.test(error.message)) {
      return {
        ok: false,
        message:
          'Conectado, mas a tabela user_sync não existe. Execute o SQL CREATE TABLE da documentação no SQL Editor do Supabase.',
      };
    }
    return { ok: false, message: `Falha na conexão: ${error.message}` };
  }
  return { ok: true, message: 'Conexão validada com sucesso! Realtime ativo na tabela user_sync.' };
}

/* ── Chave de sincronização (namespace dos dados entre dispositivos) ── */

export function getSyncKey(): string {
  if (typeof window === 'undefined') return DEFAULT_SYNC_KEY;
  const stored = (localStorage.getItem(SYNC_KEY_STORAGE) || '').trim();
  if (stored) return stored.toUpperCase();
  // Por padrão cada usuário (dispositivo) recebe uma chave única, evitando
  // que dados de usuários distintos compartilhem o namespace padrão.
  const generated = `ACADEMIA-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  try {
    localStorage.setItem(SYNC_KEY_STORAGE, generated);
  } catch {
    /* storage indisponível — retorna a chave gerada mesmo assim */
  }
  return generated;
}

export function setSyncKey(key: string): void {
  localStorage.setItem(SYNC_KEY_STORAGE, key.trim().toUpperCase());
  /* Namespace novo/alterado = cutoff de LWW antigo não vale.
     Sem isso, o primeiro pull da chave nova pode ser ignorado. */
  localStorage.removeItem(LAST_SYNC_AT_KEY);
}

/**
 * Deriva uma chave de sincronização estável a partir da identidade da conta
 * autenticada (Supabase Auth). Garante que dispositivos logados com a mesma
 * conta Google/e-mail compartilhem automaticamente os mesmos dados
 * (dados.md §3 — isolamento/particionamento por syncKey).
 */
export function deriveSyncKeyForUser(userId: string, email?: string | null): string {
  const base = (userId || email || '').trim();
  if (!base) return getSyncKey();
  // Chave determinística, estável entre dispositivos da mesma conta.
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  }
  return `ACADEMIA-${hash.toString(36).toUpperCase().padStart(8, '0')}`;
}

/** Dispositivo teve a sessão de sync revogada por outro dispositivo? */
export function isSyncRevoked(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(SYNC_REVOKED_KEY) === 'true';
}

export function setSyncRevoked(revoked: boolean): void {
  if (revoked) localStorage.setItem(SYNC_REVOKED_KEY, 'true');
  else localStorage.removeItem(SYNC_REVOKED_KEY);
}

/**
 * Marca o instante da última sincronização (usado como corte do
 * last-write-wins: só aplica snapshot remoto mais novo que isto).
 */
export function setLastSyncedAt(ts: number): void {
  if (Number.isFinite(ts) && ts > 0) {
    localStorage.setItem(LAST_SYNC_AT_KEY, String(ts));
  }
}

export function lastSyncedAt(): number {
  const raw = Number(localStorage.getItem(LAST_SYNC_AT_KEY) || '0');
  return Number.isFinite(raw) ? raw : 0;
}

/** Chaves lógicas gravadas na tabela user_sync (sync_key TEXT PRIMARY KEY). */
export function dataSyncKey(): string {
  return `${getSyncKey()}:DATA`;
}

export function devicesSyncKey(): string {
  return `${getSyncKey()}:DEVICES`;
}
