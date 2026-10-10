/**
 * lock-store.ts — Sistema de Bloqueio do App (v4.6.0-shell)
 *
 * Store + utilitários do lock (port funcional do lock do
 * NavigationShellStandalone.tsx, adaptado às prefs do Academia):
 *   • prefs em localStorage via PREF_KEYS (appLockEnabled/Biometric/Timeout);
 *   • PIN local (4–6 dígitos) persistido como hash djb2 — nunca o PIN cru;
 *   • `useLockStore` (zustand) é a fonte de verdade do estado `locked`;
 *   • `isLockUsable()` = toggle ligado + PIN definido (condição do lock);
 *   • timeout de inatividade (-1 = desativado) lido por useAppLock.
 */

import { create } from 'zustand';
import { PREF_KEYS, readLS, writeLS } from '@/features/profile/profile-data';

export const PIN_STORAGE_KEY = 'academia_pref_app_pin';

/* ── Hash leve do PIN (evita o PIN cru no localStorage; app local-only)
     Formato: djb2:<hex>:<tamanho> — o tamanho deixa a tela de lock
     auto-enviar o PIN ao completar os dígitos. ── */
function hashPin(pin: string): string {
  let h = 5381;
  for (let i = 0; i < pin.length; i++) h = ((h << 5) + h + pin.charCodeAt(i)) >>> 0;
  return `djb2:${h.toString(16)}:${pin.length}`;
}

export function readPinHash(): string | null {
  const v = readLS(PIN_STORAGE_KEY);
  return v && /^djb2:[0-9a-f]+:[0-9]+$/.test(v) ? v : null;
}

/** Tamanho (4–6) do PIN salvo; 0 quando não há PIN. */
export function getPinLength(): number {
  const stored = readPinHash();
  if (!stored) return 0;
  const len = Number(stored.split(':')[2]);
  return Number.isFinite(len) && len >= 4 && len <= 6 ? len : 0;
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

/** Lock utilizável: toggle ativo E PIN definido. */
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
