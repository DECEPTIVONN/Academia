/**
 * ScreensCustomizationPanel.tsx — Telas Personalizadas (v4.9.0-sync)
 *
 * Port da Section 10 do SupabaseSyncSecurityStandalone.tsx
 * (CustomScreenSettingsPanel): upload/colar de imagens para
 *   • tela de bloqueio — desktop (16:9) e mobile (9:16)  → mbc_lock_desktop/mobile;
 *   • splash/carregamento — vertical e horizontal         → mbc_loading_*;
 * com previews interativos: "Testar Bloqueio" reusa as classes reais do
 * LockScreen (lock__*) — pill, avatar, digital, senha+olho e notas — e
 * "Testar Splash" abre o AppLoadingScreen com progresso.
 */

import { useEffect, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { showToast } from '@/lib/toast';
import { useProfileState } from '@/features/profile/useProfileState';
import { PREF_KEYS, readLS } from '@/features/profile/profile-data';
import { ProfileEmblem } from '@/components/ProfileEmblem';
import { isBiometricEnabled } from '@/features/lock/lock-store';
import { resolveWallpaper } from '@/features/lock/lock-wallpapers';
import { AppLoadingScreen } from './AppLoadingScreen';
import '@/features/lock/lock.css';
import './sync.css';

const IMG_MAX_BYTES = 2 * 1024 * 1024;

type PreviewMode = 'lock' | 'loading' | null;

/* ── Ícones SVG stroke (Diretrizes/Ícones.md) ── */

const SvgLock = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SvgSparkles = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z" />
  </svg>
);

const SvgPlay = (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="13" height="13">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

const SvgUpload = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const SvgClipboard = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const SvgTrash = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const SvgFingerPill = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <path d="M12 10a2 2 0 00-2 2c0 1.02-.1 2.51-.26 4" />
    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
    <path d="M2 12a10 10 0 0118-6" />
    <path d="M2 16h.01" />
    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 01.34-2" />
    <path d="M9 6.8a6 6 0 019 5.2v2" />
  </svg>
);

const SvgLockBadge = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SvgFingerBig = (
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

const SvgKeyRound = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

interface ImageCardProps {
  title: string;
  tag: string;
  value: string;
  onChange: (v: string) => void;
}

function ImageCard({ title, tag, value, onChange }: ImageCardProps) {
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > IMG_MAX_BYTES) {
      showToast('Imagem muito grande (máx. 2 MB). Use uma menor ou comprima.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        onChange(result);
        showToast('Imagem aplicada!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard?.readText?.();
      if (text && (text.startsWith('http') || text.startsWith('data:image/'))) {
        onChange(text.trim());
        showToast('Imagem colada!', 'success');
      } else {
        showToast('Área de transferência sem imagem válida.', 'info');
      }
    } catch {
      showToast('Não foi possível ler a área de transferência.', 'error');
    }
  };

  const handleClear = () => {
    /* v4.45.0 — onChange('') grava o marcador vazio (a remoção precisa
       chegar aos outros dispositivos; apagar a chave a tornaria "nunca
       definida" e o valor antigo continuaria valendo na nuvem). */
    onChange('');
    showToast('Imagem removida — voltando ao padrão.', 'info');
  };

  return (
    <div className="sy-img-card">
      <div className="sy-img-card__head">
        <span className="sy-img-card__title">{title}</span>
        <span className="sy-img-card__tag">{tag}</span>
      </div>
      <div className="sy-img-preview">
        {value ? (
          <img src={value} alt={title} />
        ) : (
          <span className="sy-img-preview__empty">Imagem padrão</span>
        )}
      </div>
      <div className="sy-img-card__actions">
        <label className="sy-btn sy-btn--sm" style={{ flex: 1, cursor: 'pointer' }}>
          <input type="file" accept="image/*" className="sy-hidden-input" onChange={handleFile} />
          {SvgUpload}
          Upload
        </label>
        <button type="button" className="sy-btn sy-btn--sm" onClick={() => void handlePaste()}>
          {SvgClipboard}
          Colar
        </button>
        {value && (
          <button type="button" className="sy-btn sy-btn--sm sy-btn--danger" onClick={handleClear} title="Remover imagem">
            {SvgTrash}
          </button>
        )}
      </div>
    </div>
  );
}

export function ScreensCustomizationPanel() {
  const { state: profile } = useProfileState();

  const [lockDesktop, setLockDesktop] = useState(() => localStorage.getItem('mbc_lock_desktop') || '');
  const [lockMobile, setLockMobile] = useState(() => localStorage.getItem('mbc_lock_mobile') || '');
  const [loadVertical, setLoadVertical] = useState(() => localStorage.getItem('mbc_loading_vertical') || '');
  const [loadHorizontal, setLoadHorizontal] = useState(() => localStorage.getItem('mbc_loading_horizontal') || '');
  const [preview, setPreview] = useState<PreviewMode>(null);

  /* ── Estados da prévia de bloqueio (espelham o LockScreen real) ── */
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [portrait, setPortrait] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const on = (e: MediaQueryListEvent) => setPortrait(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  /* v4.45.0 — imagens que chegam da nuvem (ou de outra aba) também atualizam
     os cards/previews com o painel aberto. */
  useEffect(() => {
    const sync = () => {
      setLockDesktop(localStorage.getItem('mbc_lock_desktop') || '');
      setLockMobile(localStorage.getItem('mbc_lock_mobile') || '');
      setLoadVertical(localStorage.getItem('mbc_loading_vertical') || '');
      setLoadHorizontal(localStorage.getItem('mbc_loading_horizontal') || '');
    };
    window.addEventListener('academia:lock-prefs-changed', sync);
    return () => window.removeEventListener('academia:lock-prefs-changed', sync);
  }, []);

  /* ESC fecha a prévia */
  useEffect(() => {
    if (preview !== 'lock') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [preview]);

  const openLockPreview = () => {
    setPw('');
    setShowPw(false);
    setScanning(false);
    setForgot(false);
    setPreview('lock');
  };

  const biometric = isBiometricEnabled();
  const customBg = portrait ? lockMobile || lockDesktop : lockDesktop || lockMobile;
  const wall = resolveWallpaper(
    readLS(portrait ? PREF_KEYS.lockWallVertical : PREF_KEYS.lockWallHorizontal) ||
      (portrait ? 'neon' : 'grafite')
  );
  const nome = (profile?.customization?.nome || '').trim();

  /* Biometria fake da prévia: 1s "verificando" → fecha */
  const onBiometric = () => {
    if (scanning) return;
    setScanning(true);
    window.setTimeout(() => setPreview(null), 1000);
  };

  const update = (setter: (v: string) => void, key: string) => (v: string) => {
    setter(v);
    /* v4.45.0 — sempre grava (mesmo vazio): a string vazia é o marcador de
       "removida" e precisa entrar no snapshot da nuvem. */
    localStorage.setItem(key, v);
    /* LockScreen reage a este evento ao reavaliar o wallpaper */
    window.dispatchEvent(new Event('academia:lock-prefs-changed'));
  };

  return (
    <div className="sy-root">
      {/* ══ 1. Tela de Bloqueio ══ */}
      <section className="sy-card">
        <div className="sy-card__head" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="sy-card__head-left">
            <span className="sy-card__icon">{SvgLock}</span>
            <div>
              <h3 className="sy-card__title">Imagens da Tela de Bloqueio</h3>
              <p className="sy-card__desc">
                Defina planos de fundo separados para a versão Desktop (16:9) e
                Mobile (9:16). Quando vazios, valem os presets de gradiente.
              </p>
            </div>
          </div>
          <button type="button" className="sy-btn sy-btn--sm" onClick={openLockPreview}>
            {SvgPlay}
            Testar Bloqueio
          </button>
        </div>

        <div className="sy-grid-2">
          <ImageCard
            title="Papel de Parede Desktop (16:9)"
            tag="Computador"
            value={lockDesktop}
            onChange={update(setLockDesktop, 'mbc_lock_desktop')}
          />
          <ImageCard
            title="Papel de Parede Mobile (9:16)"
            tag="Smartphone"
            value={lockMobile}
            onChange={update(setLockMobile, 'mbc_lock_mobile')}
          />
        </div>
      </section>

      {/* ══ 2. Tela de Carregamento / Splash ══ */}
      <section className="sy-card">
        <div className="sy-card__head" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="sy-card__head-left">
            <span className="sy-card__icon">{SvgSparkles}</span>
            <div>
              <h3 className="sy-card__title">Tela de Carregamento &amp; Splash</h3>
              <p className="sy-card__desc">
                Personalize a imagem exibida ao abrir o app e enquanto os dados
                sincronizam com a nuvem.
              </p>
            </div>
          </div>
          <button type="button" className="sy-btn sy-btn--sm" onClick={() => setPreview('loading')}>
            {SvgPlay}
            Testar Splash
          </button>
        </div>

        <div className="sy-grid-2">
          <ImageCard
            title="Splash Vertical (Celular / 9:16)"
            tag="Vertical"
            value={loadVertical}
            onChange={update(setLoadVertical, 'mbc_loading_vertical')}
          />
          <ImageCard
            title="Splash Horizontal (Desktop / 16:9)"
            tag="Horizontal"
            value={loadHorizontal}
            onChange={update(setLoadHorizontal, 'mbc_loading_horizontal')}
          />
        </div>
      </section>

      {/* ══ Prévia de bloqueio — classes reais do LockScreen (v4.9.2-telas / v4.9.3-lock) ══ */}
      {preview === 'lock' &&
        createPortal(
          <div className="lock" role="dialog" aria-modal="true" aria-label="Prévia da tela de bloqueio">
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

            <div className="lock__card">
              {/* Watermark de cadeado (decor) */}
              <div className="lock__watermark" aria-hidden="true">
                {SvgLockBadge}
              </div>

              {/* Badge dinâmico (fingerprint vs shield) */}
              <span className="lock__badge">
                {SvgFingerPill}
                Desbloqueio • EVO FIT
              </span>

              {/* Avatar com aura giratória neon */}
              <div className="lock__avatar">
                <div className="lock__avatar-aura" aria-hidden="true" />
                <div className="lock__avatar-img">
                  <ProfileEmblem customization={profile?.customization} />
                </div>
              </div>

              <h2 className="lock__name">{nome || 'EVO FIT'}</h2>
              <p className="lock__hint">
                {biometric ? (
                  <>
                    Entrada preferencial com <strong>Impressão Digital</strong>. Toque no sensor
                    biométrico para desbloquear o EVO FIT.
                  </>
                ) : (
                  <>
                    Este app está protegido. Digite sua <strong>senha de bloqueio</strong> para
                    desbloquear o EVO FIT.
                  </>
                )}
              </p>

              {biometric && (
                <button
                  type="button"
                  className={scanning ? 'lock__bio lock__bio--scan' : 'lock__bio'}
                  onClick={onBiometric}
                  disabled={scanning}
                  aria-label="Desbloquear com impressão digital (prévia)"
                >
                  <div className="lock__bio-sensor">
                    {SvgFingerBig}
                  </div>
                  <span className="lock__bio-title">
                    {scanning ? 'Verificando…' : 'Desbloquear com Digital'}
                  </span>
                  <span className="lock__bio-sub">Toque no sensor para autenticar</span>
                </button>
              )}

              <form
                className="lock__form"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPreview(null);
                }}
              >
                <div className="lock__pw">
                  <span className="lock__pw-icon" aria-hidden="true">
                    {SvgKeyRound}
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="off"
                    maxLength={32}
                    aria-label="Senha de bloqueio (prévia)"
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
                  Entrar com Senha
                </button>
              </form>

              <button type="button" className="lock__forgot" onClick={() => setForgot((v) => !v)}>
                Esqueceu a senha?
              </button>

              {forgot ? (
                <p className="lock__note lock__note--warn">
                  Prévia: na tela real a senha existe apenas neste dispositivo — não há
                  recuperação na nuvem.
                </p>
              ) : (
                <p className="lock__note">
                  Prévia da tela de bloqueio — desbloqueie ou pressione ESC para voltar às
                  configurações.
                </p>
              )}

              <button
                type="button"
                className="sy-btn sy-btn--sm"
                style={{ width: '100%', marginTop: 4 }}
                onClick={() => setPreview(null)}
              >
                Fechar prévia
              </button>
            </div>
          </div>,
          document.body
        )}

      {preview === 'loading' && (
        <AppLoadingScreen
          verticalImage={loadVertical}
          horizontalImage={loadHorizontal}
          onComplete={() => setPreview(null)}
        />
      )}
    </div>
  );
}

export default ScreensCustomizationPanel;
