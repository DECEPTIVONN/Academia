/**
 * LockScreen.tsx — Tela de Bloqueio do App (v4.6.0-shell / v4.9.0-sync / v4.9.3-lock)
 *
 * Port fiel do LockScreenStandalone.tsx com as 17 imagens de referência:
 *   • wallpaper conforme orientação (prefs lockWallVertical/lockWallHorizontal,
 *     presets de lock-wallpapers.ts) + imagem custom (mbc_lock_*) + shade;
 *   • REGRA DE OURO UX: modo biometria-only até 3 falhas (esconde senha,
 *     auto-trigger 400ms, contador "Tentativa X de 3", botão "Tentar novamente");
 *   • pill badge dinâmico (fingerprint vs shield) — "DESBLOQUEIO BIOMÉTRICO ATIVO"
 *     ou "TELA DE BLOQUEIO DO SISTEMA";
 *   • avatar com aura giratória neon (accent→purple, 10s) — sem badge de cadeado;
 *   • input senha com KeyRound + glow gradient + olho show/hide + "Entrar com Senha";
 *   • "Esqueceu a senha?" → modal "Recuperar Acesso" com "Limpar Senha Local"
 *     (limpa pin + disable lock + reload);
 *   • decor: micro-mesh radial, glow rings, side rails (SECURE SHELL / LOCK ACTIVE /
 *     DATA SHIELDED / v2.4.0-PROT) desktop-only, watermark de cadeado;
 *   • shake + vibração [100, 50, 100], textos de erro com ⚠️;
 *   • fundo do app fica inalcançável: overlay fixed z-index 1200.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PREF_KEYS, readLS } from '@/features/profile/profile-data';
import { useProfileState } from '@/features/profile/useProfileState';
import { ProfileEmblem } from '@/components/ProfileEmblem';
import { resolveWallpaper } from './lock-wallpapers';
import { clearPin, isBiometricEnabled, useLockStore, verifyBiometric, verifyPin } from './lock-store';
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

const SvgShield = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const SvgLockWatermark = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" width="320" height="320">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SvgKey = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
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

const SvgRefresh = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
    <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const SvgShieldAlert = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);

const SvgInfo = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
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
  const [errMsg, setErrMsg] = useState('');
  const [scanning, setScanning] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [bioFailedAttempts, setBioFailedAttempts] = useState(0);
  const hasTriggeredBioRef = useRef(false);

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

  /* REGRA DE OURO UX: modo biometria-only até 3 falhas */
  const isBiometricOnlyMode = biometric && bioFailedAttempts < 3;

  const shake = useCallback(() => {
    setPw('');
    if (readLS(PREF_KEYS.vibration) !== 'false') navigator.vibrate?.([100, 50, 100]);
    window.setTimeout(() => setErrMsg(''), 1400);
  }, []);

  const tryUnlock = useCallback(
    (value: string) => {
      if (!value) return;
      if (verifyPin(value)) {
        setPw('');
        setErrMsg('');
        setForgotOpen(false);
        setBioFailedAttempts(0);
        unlock();
      } else {
        setErrMsg('Senha incorreta! Tente novamente.');
        shake();
      }
    },
    [unlock, shake]
  );

  /* Formulário da senha: Enter (nativo) ou botão "Entrar com Senha" */
  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (scanning) return;
      tryUnlock(pw.trim());
    },
    [pw, scanning, tryUnlock]
  );

  /* Biometria REAL via WebAuthn (platform authenticator) */
  const onBiometric = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setErrMsg('');
    try {
      const ok = await verifyBiometric();
      setScanning(false);
      if (ok) {
        setPw('');
        setErrMsg('');
        setForgotOpen(false);
        setBioFailedAttempts(0);
        unlock();
      } else {
        setBioFailedAttempts((n) => n + 1);
        setErrMsg('Falha na biometria. Tente novamente ou use a senha.');
        if (readLS(PREF_KEYS.vibration) !== 'false') navigator.vibrate?.([100, 50, 100]);
      }
    } catch {
      setScanning(false);
      setBioFailedAttempts((n) => n + 1);
      setErrMsg('Erro na biometria. Use a senha de bloqueio.');
    }
  }, [scanning, unlock]);

  /* Auto-trigger biometria 400ms após montar (modo biometria-only) */
  useEffect(() => {
    if (biometric && !hasTriggeredBioRef.current && bioFailedAttempts < 3) {
      hasTriggeredBioRef.current = true;
      const t = window.setTimeout(() => onBiometric(), 400);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [biometric, bioFailedAttempts, onBiometric]);

  /* Limpar senha local (modal "Recuperar Acesso") */
  const onClearLocalData = useCallback(() => {
    clearPin();
    localStorage.setItem(PREF_KEYS.appLockEnabled, 'false');
    localStorage.setItem(PREF_KEYS.appLockBiometric, 'false');
    window.location.reload();
  }, []);

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

      {/* Micro-mesh radial grid (decor) */}
      <div className="lock__mesh" aria-hidden="true" />

      {/* Glow rings (decor) */}
      <div className="lock__glow lock__glow--top" aria-hidden="true" />
      <div className="lock__glow lock__glow--bottom" aria-hidden="true" />

      {/* Side rails (desktop only) */}
      <div className="lock__rail lock__rail--left" aria-hidden="true">
        <span className="lock__rail-text">SECURE SHELL</span>
        <span className="lock__rail-dot" />
        <span className="lock__rail-text">LOCK ACTIVE</span>
      </div>
      <div className="lock__rail lock__rail--right" aria-hidden="true">
        <span className="lock__rail-text">DATA SHIELDED</span>
        <span className="lock__rail-dot lock__rail-dot--green" />
        <span className="lock__rail-text">v2.4.0-PROT</span>
      </div>

      <div className={errMsg ? 'lock__card lock__card--err' : 'lock__card'}>
        {/* Watermark de cadeado (decor) */}
        <div className="lock__watermark" aria-hidden="true">
          {SvgLockWatermark}
        </div>

        {/* Badge dinâmico — fingerprint (biometria-only) ou shield (senha) */}
        <span className="lock__badge">
          {isBiometricOnlyMode ? SvgFingerSmall : SvgShield}
          {isBiometricOnlyMode ? 'Desbloqueio Biométrico Ativo' : 'Tela de Bloqueio do Sistema'}
        </span>

        {/* Avatar com aura giratória neon (accent→purple) */}
        <div className="lock__avatar">
          <div className="lock__avatar-aura" aria-hidden="true" />
          <div className="lock__avatar-img">
            <ProfileEmblem customization={profile?.customization} />
          </div>
        </div>

        <h2 className="lock__name">{nome || 'Academia'}</h2>
        <p className="lock__hint">
          {isBiometricOnlyMode ? (
            <>
              Entrada preferencial com <strong>Impressão Digital</strong>. Toque no sensor
              biométrico para prosseguir.
            </>
          ) : bioFailedAttempts >= 3 ? (
            <>
              <span className="lock__hint-warn">3 tentativas com digital esgotadas.</span> Digite
              sua senha de bloqueio.
            </>
          ) : (
            <>
              O bloqueio do sistema está ativado. Digite sua <strong>Senha de Bloqueio</strong> para
              acessar a aplicação.
            </>
          )}
        </p>

        {/* MODO A: biometria preferencial exclusiva (até 3 falhas) */}
        {isBiometricOnlyMode ? (
          <div className="lock__bio-only">
            <button
              type="button"
              className={scanning ? 'lock__bio lock__bio--scan' : 'lock__bio'}
              onClick={onBiometric}
              disabled={scanning}
              aria-label="Desbloquear com impressão digital"
            >
              <div className="lock__bio-sensor">
                {SvgFinger}
              </div>
              <span className="lock__bio-title">
                {scanning ? 'Validando Biometria…' : 'Desbloquear com Digital'}
              </span>
              <span className="lock__bio-sub">Toque no sensor para autenticar</span>
            </button>

            {/* Contador de tentativas falhas */}
            {bioFailedAttempts > 0 && (
              <div className="lock__bio-counter">
                Tentativa {bioFailedAttempts} de 3
              </div>
            )}

            {/* Feedback de erro */}
            {errMsg && (
              <div className="lock__err lock__err--show" role="alert">
                ⚠️ {errMsg}
              </div>
            )}
          </div>
        ) : (
          /* MODO B: entrada de senha (fallback ou sem biometria) */
          <div className="lock__pw-mode">
            {/* Botão "Tentar biometria novamente" (após 3 falhas) */}
            {biometric && (
              <div className="lock__bio-retry-wrap">
                <button
                  type="button"
                  className="lock__bio-retry"
                  onClick={() => {
                    setBioFailedAttempts(0);
                    setErrMsg('');
                    onBiometric();
                  }}
                >
                  {SvgRefresh}
                  Tentar biometria novamente
                </button>
              </div>
            )}

            {/* Campo de senha com KeyRound + glow */}
            <form className="lock__form" onSubmit={onSubmit} autoComplete="off">
              <div className="lock__pw">
                <span className="lock__pw-icon" aria-hidden="true">
                  {SvgKey}
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pw}
                  onChange={(e) => {
                    setPw(e.target.value);
                    setErrMsg('');
                  }}
                  placeholder="••••••••"
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

              {/* Mensagem de erro */}
              {errMsg && (
                <div className="lock__err lock__err--show" role="alert">
                  ⚠️ {errMsg}
                </div>
              )}

              <button type="submit" className="lock__submit" disabled={scanning || !pw}>
                Entrar com Senha
              </button>
            </form>
          </div>
        )}

        <button type="button" className="lock__forgot" onClick={() => setForgotOpen(true)}>
          Esqueceu a senha?
        </button>

        <p className="lock__note">
          Seus dados locais de performance permanecem criptografados e blindados neste dispositivo.
        </p>
      </div>

      {/* MODAL: Recuperar Acesso (esqueceu a senha) */}
      {forgotOpen && (
        <div className="lock__modal-overlay" role="dialog" aria-modal="true" aria-label="Recuperar Acesso">
          <div className="lock__modal">
            <div className="lock__modal-body">
              <div className="lock__modal-header">
                <div className="lock__modal-icon">
                  {SvgShieldAlert}
                </div>
                <div>
                  <h3 className="lock__modal-title">Recuperar Acesso</h3>
                  <p className="lock__modal-sub">Informações de segurança local</p>
                </div>
              </div>

              <div className="lock__modal-text">
                <p>
                  Por motivos de <strong>segurança e privacidade local</strong>, as senhas de
                  bloqueio são armazenadas de forma segura e exclusiva neste navegador.
                </p>
                <p>
                  Caso você possua a <span className="lock__modal-em">Sincronização em Nuvem
                  (Cloud Sync)</span> ativa, você poderá redefinir as chaves locais sem perder seu
                  histórico.
                </p>
                <p className="lock__modal-info">
                  {SvgInfo}
                  <span>
                    Limpando as credenciais locais, o bloqueio do app será desarmado até ser
                    reconfigurado.
                  </span>
                </p>
              </div>
            </div>

            <div className="lock__modal-footer">
              <button
                type="button"
                className="lock__modal-btn lock__modal-btn--back"
                onClick={() => setForgotOpen(false)}
              >
                Voltar
              </button>
              <button
                type="button"
                className="lock__modal-btn lock__modal-btn--danger"
                onClick={onClearLocalData}
              >
                Limpar Senha Local
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LockScreen;
