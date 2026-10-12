/**
 * LockScreen.tsx — Tela de Bloqueio do App (v4.6.0-shell / v4.9.0-sync)
 *
 * Port do lock do NavigationShellStandalone.tsx com o visual do reference
 * Life Organizer (imagem 1 das capturas):
 *   • wallpaper conforme orientação (prefs lockWallVertical/lockWallHorizontal,
 *     presets de lock-wallpapers.ts) + imagem custom (mbc_lock_*) + shade;
 *   • pill "DESBLOQUEIO • ACADEMIA" com ícone de digital;
 *   • avatar do perfil (ProfileEmblem) com glow + nome + subtítulo;
 *   • card "DESBLOQUEAR COM DIGITAL" (pref appLockBiometric) → biometria
 *     fake (1s verificando → destrava);
 *   • senha de bloqueio alfanumérica (4–32, hash djb2 em lock-store) com
 *     olho show/hide — antes era PIN numérico e letras eram descartadas;
 *   • "ESQUECEU A SENHA?" explica a recuperação local + nota de dados;
 *   • fundo do app fica inalcançável: overlay fixed z-index 1200.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PREF_KEYS, readLS } from '@/features/profile/profile-data';
import { useProfileState } from '@/features/profile/useProfileState';
import { ProfileEmblem } from '@/components/ProfileEmblem';
import { resolveWallpaper } from './lock-wallpapers';
import { isBiometricEnabled, useLockStore, verifyPin } from './lock-store';
import './lock.css';

/* ── Ícones stroke (Diretrizes/Ícones.md) ── */
const SvgFinger = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
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

const SvgFingerSmall = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <path d="M12 10a2 2 0 00-2 2c0 1.02-.1 2.51-.26 4" />
    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
    <path d="M2 12a10 10 0 0118-6" />
    <path d="M2 16h.01" />
    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 01.34-2" />
    <path d="M9 6.8a6 6 0 019 5.2v2" />
  </svg>
);

const SvgLock = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SvgEye = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SvgEyeOff = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

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
  const { state: profile } = useProfileState();

  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [forgot, setForgot] = useState(false);

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

  const shake = useCallback(() => {
    setErr(true);
    setPw('');
    if (readLS(PREF_KEYS.vibration) !== 'false') navigator.vibrate?.(140);
    window.setTimeout(() => setErr(false), 1400);
  }, []);

  const tryUnlock = useCallback(
    (value: string) => {
      if (!value) return;
      if (verifyPin(value)) {
        setPw(''); // limpa para o próximo lock (o componente fica montado)
        setErr(false);
        setForgot(false);
        unlock();
      } else shake();
    },
    [unlock, shake]
  );

  /* Formulário da senha: Enter (nativo) ou botão "Desbloquear" */
  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (scanning) return;
      tryUnlock(pw.trim());
    },
    [pw, scanning, tryUnlock]
  );

  /* Biometria fake: 1s "verificando" → destrava */
  const onBiometric = useCallback(() => {
    if (scanning || err) return;
    setScanning(true);
    window.setTimeout(() => {
      setScanning(false);
      setPw('');
      setErr(false);
      setForgot(false);
      unlock();
    }, 1000);
  }, [scanning, err, unlock]);

  if (!locked) return null;

  const nome = (profile?.customization?.nome || '').trim();

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

      <div className={err ? 'lock__card lock__card--err' : 'lock__card'}>
        {/* Pill — imagem 1 do reference */}
        <span className="lock__badge">
          {SvgFingerSmall}
          Desbloqueio • Academia
        </span>

        {/* Avatar do perfil com glow + badge de cadeado */}
        <div className="lock__avatar">
          <div className="lock__avatar-img">
            <ProfileEmblem customization={profile?.customization} />
          </div>
          <span className="lock__avatar-lock" aria-hidden="true">
            {SvgLock}
          </span>
        </div>

        <h2 className="lock__name">{nome || 'Academia'}</h2>
        <p className="lock__hint">
          {biometric ? (
            <>
              Entrada preferencial com <strong>Impressão Digital</strong>. Toque no sensor
              biométrico para desbloquear o Academia.
            </>
          ) : (
            <>
              Este app está protegido. Digite sua <strong>senha de bloqueio</strong> para
              desbloquear o Academia.
            </>
          )}
        </p>

        {/* Card de digital (quando a biometria está ligada) */}
        {biometric && (
          <button
            type="button"
            className={scanning ? 'lock__bio lock__bio--scan' : 'lock__bio'}
            onClick={onBiometric}
            disabled={scanning}
            aria-label="Desbloquear com impressão digital"
          >
            {SvgFinger}
            <span className="lock__bio-title">
              {scanning ? 'Verificando…' : 'Desbloquear com Digital'}
            </span>
            <span className="lock__bio-sub">Toque no sensor para autenticar</span>
          </button>
        )}

        {/* Senha alfanumérica (v4.9.0-sync — antes só aceitava dígitos) */}
        <form className="lock__form" onSubmit={onSubmit} autoComplete="off">
          <div className="lock__pw">
            <input
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              maxLength={32}
              autoFocus
              disabled={scanning}
              aria-label="Senha de bloqueio"
            />
            <button
              type="button"
              className="lock__pw-eye"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
              tabIndex={-1}
            >
              {showPw ? SvgEyeOff : SvgEye}
            </button>
          </div>
          <button type="submit" className="lock__submit" disabled={scanning || !pw}>
            Desbloquear
          </button>
        </form>

        <div className={err ? 'lock__err lock__err--show' : 'lock__err'} role="alert">
          Senha incorreta. Tente novamente.
        </div>

        <button type="button" className="lock__forgot" onClick={() => setForgot((v) => !v)}>
          Esqueceu a senha?
        </button>

        {forgot ? (
          <p className="lock__note lock__note--warn">
            Sem recuperação na nuvem: a senha existe apenas neste dispositivo. Se esqueceu,
            limpe os dados do app no navegador para redefini-lo (os treinos locais serão
            perdidos).
          </p>
        ) : (
          <p className="lock__note">
            Seus dados locais de performance permanecem armazenados de forma blindada neste
            dispositivo.
          </p>
        )}
      </div>
    </div>
  );
};

export default LockScreen;
