/**
 * lock-store.ts — Sistema de Bloqueio do App (v4.6.0-shell / v4.9.0-sync)
 *
 * Store + utilitários do lock (port funcional do lock do
 * NavigationShellStandalone.tsx, adaptado às prefs do Academia):
 *   • prefs em localStorage via PREF_KEYS (appLockEnabled/Biometric/Timeout);
 *   • senha local alfanumérica (4–32 caracteres) persistida como hash djb2 —
 *     nunca a senha crua;
 *   • `useLockStore` (zustand) é a fonte de verdade do estado `locked`;
 *   • `isLockUsable()` = toggle ligado + senha definida (condição do lock);
 *   • timeout de inatividade (-1 = sempre logado) lido por useAppLock.
 */

import { create } from 'zustand';
import { PREF_KEYS, readLS, writeLS } from '@/features/profile/profile-data';

export const PIN_STORAGE_KEY = 'academia_pref_app_pin';

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
