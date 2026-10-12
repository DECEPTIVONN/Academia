/**
 * LockScreen.tsx — Tela de Bloqueio do App (v4.6.0-shell)
 *
 * Port do lock do NavigationShellStandalone.tsx, com o visual do Academia:
 *   • wallpaper conforme orientação (prefs lockWallVertical/lockWallHorizontal,
 *     presets de lock-wallpapers.ts) + shade escuro;
 *   • relógio ao vivo + marca ACADEMIA;
 *   • PIN 4–6 dígitos via teclado numérico (e teclado físico) com auto-envio
 *     quando atinge o tamanho salvo; erro → shake + mensagem;
 *   • biometria "fake": botão de digital → 1s verificando → destrava
 *     (pref appLockBiometric);
 *   • fundo do app fica inalcançável: overlay fixed z-index 1200.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PREF_KEYS, readLS } from '@/features/profile/profile-data';
import { resolveWallpaper } from './lock-wallpapers';
import {
  getPinLength,
  isBiometricEnabled,
  useLockStore,
  verifyPin,
} from './lock-store';
import './lock.css';

/* ── Ícones stroke (Diretrizes/Ícones.md) ── */
const SvgShield = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SvgFinger = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="34" height="34">
    <path d="M12 10a2 2 0 00-2 2c0 1.02-.1 2.51-.26 4" />
    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
    <path d="M2 12a10 10 0 0118-6" />
    <path d="M2 16h.01" />
    <path d="M21.8 16c.2-2 .13-5.354 0-6" />
    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 01.34-2" />
    <path d="M8.65 22c.21-.66.45-1.32.57-2" />
    <path d="M9 6.8a6 6 0 019 5.2v2" />
  </svg>
);

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

/* v4.9.0-sync — imagem personalizada da tela de bloqueio
   (Configurações → Telas Personalizadas; usa a da orientação atual com
   fallback para a outra) */
function readCustomLockBg(portrait: boolean): string {
  try {
    const main = localStorage.getItem(portrait ? 'mbc_lock_mobile' : 'mbc_lock_desktop') || '';
    if (main) return main;
    return localStorage.getItem(portrait ? 'mbc_lock_desktop' : 'mbc_lock_mobile') || '';
  } catch {
    return '';
  }
}

function useOrientationPortrait(): boolean {
  const [portrait, setPortrait] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const on = (e: MediaQueryListEvent) => setPortrait(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return portrait;
}

export const LockScreen: React.FC = () => {
  const locked = useLockStore((s) => s.locked);
  const unlock = useLockStore((s) => s.unlock);
  const portrait = useOrientationPortrait();

  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [now, setNow] = useState(() => new Date());

  /* Prefs de wallpaper (reagem a mudanças em sessão) */
  const [wallId, setWallId] = useState<string>(() =>
    portrait
      ? readLS(PREF_KEYS.lockWallVertical) || 'neon'
      : readLS(PREF_KEYS.lockWallHorizontal) || 'grafite'
  );
  /* v4.9.0-sync — imagem personalizada (mbc_lock_desktop/mobile) */
  const [customBg, setCustomBg] = useState<string>(() => readCustomLockBg(portrait));
  useEffect(() => {
    const sync = () => {
      setWallId(
        portrait
          ? readLS(PREF_KEYS.lockWallVertical) || 'neon'
          : readLS(PREF_KEYS.lockWallHorizontal) || 'grafite'
      );
      setCustomBg(readCustomLockBg(portrait));
    };
    sync();
    window.addEventListener('academia:lock-prefs-changed', sync);
    return () => window.removeEventListener('academia:lock-prefs-changed', sync);
  }, [portrait]);

  const wall = useMemo(() => resolveWallpaper(wallId), [wallId]);
  const biometric = isBiometricEnabled();

  /* Relógio */
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const shake = useCallback(() => {
    setErr(true);
    if (readLS(PREF_KEYS.vibration) !== 'false') navigator.vibrate?.(140);
    window.setTimeout(() => {
      setErr(false);
      setPin('');
    }, 450);
  }, []);

  const tryPin = useCallback(
    (value: string) => {
      if (verifyPin(value)) {
        setPin(''); // limpa para o próximo lock (o componente fica montado)
        unlock();
      } else shake();
    },
    [unlock, shake]
  );

  const pushDigit = useCallback(
    (d: string) => {
      if (err || scanning) return;
      setPin((prev) => {
        if (prev.length >= 6) return prev;
        const next = prev + d;
        if (next.length >= 4 && next.length === getPinLength()) {
          window.setTimeout(() => tryPin(next), 60);
        }
        return next;
      });
    },
    [err, scanning, tryPin]
  );

  const backspace = useCallback(() => {
    if (err || scanning) return;
    setPin((p) => p.slice(0, -1));
  }, [err, scanning]);

  /* Teclado físico: dígitos + Backspace + Enter */
  useEffect(() => {
    if (!locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9' && e.key.length === 1) pushDigit(e.key);
      else if (e.key === 'Backspace') backspace();
      else if (e.key === 'Enter' && pin.length >= 4) tryPin(pin);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [locked, pin, pushDigit, backspace, tryPin]);

  /* Biometria fake: 1s "verificando" → destrava */
  const onBiometric = useCallback(() => {
    if (scanning || err) return;
    setScanning(true);
    window.setTimeout(() => {
      setScanning(false);
      setPin('');
      unlock();
    }, 1000);
  }, [scanning, err, unlock]);

  if (!locked) return null;

  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <div className="lock" id="appLockScreen" role="dialog" aria-modal="true" aria-label="App bloqueado">
      <div
        className="lock__wall"
        style={
          customBg
            ? {
                backgroundImage: `url("${customBg}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.78) saturate(1.05)',
              }
            : { background: wall.bg }
        }
      />
      <div className="lock__shade" />

      <div className="lock__card">
        <div className="lock__brand">
          <span className="lock__brand-icon" aria-hidden="true">
            {SvgShield}
          </span>
          <span className="lock__brand-main">Academia</span>
          <span className="lock__brand-sub">Bloqueado</span>
        </div>

        <div className="lock__time">{time}</div>
        <div className="lock__date">{date}</div>

        <div className={err ? 'lock__pin lock__pin--err' : 'lock__pin'}>
          <div className="lock__dots" aria-label={`PIN com ${pin.length} dígito(s)`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className={
                  i < pin.length
                    ? 'lock__dot lock__dot--filled'
                    : i < getPinLength()
                      ? 'lock__dot'
                      : 'lock__dot lock__dot--ghost'
                }
              />
            ))}
          </div>
          <div className={err ? 'lock__err lock__err--show' : 'lock__err'}>
            PIN incorreto. Tente novamente.
          </div>
        </div>

        <div className="lock__pad" role="group" aria-label="Teclado numérico">
          {KEYS.map((k, i) =>
            k === '' ? (
              <span key={`sp-${i}`} className="lock__key lock__key--spacer" aria-hidden="true" />
            ) : k === 'del' ? (
              <button key="del" type="button" className="lock__key lock__key--fn" onClick={backspace} aria-label="Apagar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
            ) : (
              <button key={k} type="button" className="lock__key" onClick={() => pushDigit(k)}>
                {k}
              </button>
            )
          )}
        </div>

        {biometric && (
          <button
            type="button"
            className={scanning ? 'lock__bio lock__bio--scan' : 'lock__bio'}
            onClick={onBiometric}
            disabled={scanning}
            aria-label="Desbloquear com impressão digital"
          >
            {SvgFinger}
            <span className="lock__bio-label">
              {scanning ? 'Verificando…' : 'Usar impressão digital'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default LockScreen;
