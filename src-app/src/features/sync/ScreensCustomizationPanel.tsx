/**
 * ScreensCustomizationPanel.tsx — Telas Personalizadas (v4.9.0-sync)
 *
 * Port da Section 10 do SupabaseSyncSecurityStandalone.tsx
 * (CustomScreenSettingsPanel): upload/colar de imagens para
 *   • tela de bloqueio — desktop (16:9) e mobile (9:16)  → mbc_lock_desktop/mobile;
 *   • splash/carregamento — vertical e horizontal         → mbc_loading_*;
 * com previews interativos (bloqueio fake + splash com progresso).
 */

import { useState, type ChangeEvent } from 'react';
import { showToast } from '@/lib/toast';
import { useProfileState } from '@/features/profile/useProfileState';
import { AppLoadingScreen } from './AppLoadingScreen';
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

const SvgShield = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="30" height="30">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

interface ImageCardProps {
  title: string;
  tag: string;
  storageKey: string;
  value: string;
  onChange: (v: string) => void;
}

function ImageCard({ title, tag, storageKey, value, onChange }: ImageCardProps) {
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
    onChange('');
    localStorage.removeItem(storageKey);
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

  const update = (setter: (v: string) => void, key: string) => (v: string) => {
    setter(v);
    if (v) localStorage.setItem(key, v);
    else localStorage.removeItem(key);
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
          <button type="button" className="sy-btn sy-btn--sm" onClick={() => setPreview('lock')}>
            {SvgPlay}
            Testar Bloqueio
          </button>
        </div>

        <div className="sy-grid-2">
          <ImageCard
            title="Papel de Parede Desktop (16:9)"
            tag="Computador"
            storageKey="mbc_lock_desktop"
            value={lockDesktop}
            onChange={update(setLockDesktop, 'mbc_lock_desktop')}
          />
          <ImageCard
            title="Papel de Parede Mobile (9:16)"
            tag="Smartphone"
            storageKey="mbc_lock_mobile"
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
            storageKey="mbc_loading_vertical"
            value={loadVertical}
            onChange={update(setLoadVertical, 'mbc_loading_vertical')}
          />
          <ImageCard
            title="Splash Horizontal (Desktop / 16:9)"
            tag="Horizontal"
            storageKey="mbc_loading_horizontal"
            value={loadHorizontal}
            onChange={update(setLoadHorizontal, 'mbc_loading_horizontal')}
          />
        </div>
      </section>

      {/* ══ Previews interativos ══ */}
      {preview === 'lock' && (
        <div className="sy-lock-preview" role="dialog" aria-modal="true" aria-label="Prévia da tela de bloqueio">
          <div
            className="sy-lock-preview__bg"
            style={
              lockDesktop || lockMobile
                ? { backgroundImage: `url("${lockDesktop || lockMobile}")` }
                : { background: 'linear-gradient(160deg, #f97316 0%, #0a0a10 70%)' }
            }
          />
          <div className="sy-lock-preview__shade" />
          <div className="sy-lock-preview__card">
            <div className="sy-lock-preview__avatar">
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'rgba(249,115,22,0.12)',
                  border: '2px solid #f97316',
                  color: '#f97316',
                }}
              >
                {SvgShield}
              </span>
              <span className="sy-lock-preview__avatar-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" width="11" height="11">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
            </div>
            <div>
              <div className="sy-lock-preview__name">{profile?.customization.nome || 'Atleta'}</div>
              <div className="sy-lock-preview__sub">APLICATIVO BLOQUEADO</div>
            </div>
            <div className="sy-lock-preview__input-wrap">
              <input
                type="password"
                className="sy-lock-preview__input"
                placeholder="••••"
                aria-label="PIN de demonstração"
                maxLength={6}
              />
            </div>
            <button
              type="button"
              className="sy-btn sy-btn--primary sy-lock-preview__unlock"
              onClick={() => setPreview(null)}
            >
              Desbloquear Sessão
            </button>
          </div>
        </div>
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
