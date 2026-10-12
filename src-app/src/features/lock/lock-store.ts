/**
 * lock-store.ts — Sistema de Bloqueio do App (v4.6.0-shell / v4.9.0-sync / v4.10.0)
 *
 * Store + utilitários do lock (port funcional do lock do
 * NavigationShellStandalone.tsx, adaptado às prefs do Academia):
 *   • prefs em localStorage via PREF_KEYS (appLockEnabled/Biometric/Timeout);
 *   • senha local alfanumérica (4–32 caracteres) persistida como hash djb2 —
 *     nunca a senha crua;
 *   • `useLockStore` (zustand) é a fonte de verdade do estado `locked`;
 *   • `isLockUsable()` = toggle ligado + senha definida (condição do lock);
 *   • timeout de inatividade (-1 = sempre logado) lido por useAppLock;
 *   • v4.10.0: biometria REAL via WebAuthn (platform authenticator —
 *     Windows Hello, Touch ID, fingerprint do Android/iOS).
 */

import { create } from 'zustand';
import { PREF_KEYS, readLS, writeLS } from '@/features/profile/profile-data';

export const PIN_STORAGE_KEY = 'academia_pref_app_pin';
const WEBAUTHN_CRED_KEY = 'academia_webauthn_credential_id';

/* ── Hash leve da senha (evita a senha crua no localStorage; app local-only)
     Formato: djb2:<hex>:<tamanho> — o tamanho identifica a credencial salva
     (ex.: exibir "Senha de N caracteres" nas Configurações). ── */
function hashPin(pin: string): string {
  let h = 5381;
  for (let i = 0; i < pin.length; i++) h = ((h << 5) + h + pin.charCodeAt(i)) >>> 0;
  return `djb2:${h.toString(16)}:${pin.length}`;
}

export function readPinHash(): string | null {
  const v = readLS(PIN_STORAGE_KEY);
  return v && /^djb2:[0-9a-f]+:[0-9]+$/.test(v) ? v : null;
}

/** Tamanho (4–32) da senha salva; 0 quando não há senha. */
export function getPinLength(): number {
  const stored = readPinHash();
  if (!stored) return 0;
  const len = Number(stored.split(':')[2]);
  return Number.isFinite(len) && len >= 4 && len <= 32 ? len : 0;
}

export function savePin(pin: string): void {
  writeLS(PIN_STORAGE_KEY, hashPin(pin));
}

export function clearPin(): void {
  writeLS(PIN_STORAGE_KEY, '');
}

export function verifyPin(pin: string): boolean {
  const stored = readPinHash();
  return !!stored && stored === hashPin(pin);
}

/** Lock utilizável: toggle ativo E senha definida. */
export function isLockUsable(): boolean {
  return readLS(PREF_KEYS.appLockEnabled) === 'true' && !!readPinHash();
}

export function isBiometricEnabled(): boolean {
  return readLS(PREF_KEYS.appLockBiometric) === 'true';
}

/** Segundos de inatividade antes de travar (-1 = desativado). */
export function getLockTimeoutSec(): number {
  const raw = Number(readLS(PREF_KEYS.appLockTimeout) ?? '300');
  if (raw === -1) return -1;
  if (!Number.isFinite(raw) || raw <= 0) return 300;
  return Math.round(raw);
}

export function lockPrefsChanged(): void {
  window.dispatchEvent(new CustomEvent('academia:lock-prefs-changed'));
}

/* ── WebAuthn (biometria REAL) ── */

function bufToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

/** Verifica se o navegador suporta WebAuthn com platform authenticator. */
export function isWebAuthnAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential;
}

/**
 * Registra uma credencial WebAuthn (platform authenticator — biometria do SO).
 * Retorna true se o registro foi bem-sucedido.
 */
export async function registerBiometric(): Promise<boolean> {
  if (!isWebAuthnAvailable()) return false;
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Academia', id: window.location.hostname },
        user: {
          id: userId,
          name: 'academia-user',
          displayName: 'Academia User',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    });
    if (!cred) return false;
    const pkCred = cred as PublicKeyCredential;
    writeLS(WEBAUTHN_CRED_KEY, bufToB64(pkCred.rawId));
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica biometria via WebAuthn (assertion).
 * Retorna true se a autenticação foi bem-sucedida.
 */
export async function verifyBiometric(): Promise<boolean> {
  if (!isWebAuthnAvailable()) return false;
  const credIdB64 = readLS(WEBAUTHN_CRED_KEY);
  if (!credIdB64) return false;
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          { type: 'public-key', id: b64ToBuf(credIdB64) },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}

/** Remove a credencial WebAuthn salva. */
export function clearBiometric(): void {
  writeLS(WEBAUTHN_CRED_KEY, '');
}

/** Verifica se já há credencial WebAuthn registrada. */
export function hasBiometricCredential(): boolean {
  return !!readLS(WEBAUTHN_CRED_KEY);
}

/* ── Estado global do lock ── */

interface LockScreenState {
  locked: boolean;
  lock: () => void;
  unlock: () => void;
}

export const useLockStore = create<LockScreenState>((set) => ({
  // Boot: se o lock está utilizável, o app já abre travado
  locked: isLockUsable(),
  lock: () => {
    if (isLockUsable()) set({ locked: true });
  },
  unlock: () => set({ locked: false }),
}));

/** Atalho para componentes (botão "Trancar Agora", etc.). */
export function lockApp(): void {
  useLockStore.getState().lock();
}
