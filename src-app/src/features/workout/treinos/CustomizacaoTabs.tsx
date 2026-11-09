/**
 * CustomizacaoTabs.tsx — Sub-abas de customização dentro da seção Treinos (Fase 4)
 * Port 1:1 de `initExerciciosCustomSubTabs` (secao-treinos.js L1237–1412) +
 * render helpers de secao-customizacao.js (`_renderBanners` L611, `_renderEmblemas`
 * L687, `_renderBarSkins` L819, `_renderTimerSkins` L843, `_renderCardSkins` L877,
 * `_renderFrames` L799, `_renderIdentityEmblems` L739, `_renderIdentityEmblemPreview`
 * L763, `_updatePulseToggleUI` L712) + DOM de treinos.html L118–174.
 * Persistência: `useProfileState().update` (profileState) + `applyCustomizationGlobals`.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_PROFILE_CUSTOMIZATION } from '@/core/db/schema';
import { useLocalData } from '@/hooks/useLocalData';
import { useProfileState } from '@/features/profile/useProfileState';
import { ProfileEmblem } from '@/components/ProfileEmblem';
import { fileToDataUrl } from '@/lib/image';
import {
  AVATAR_FRAMES,
  BANNERS,
  BAR_SKINS,
  CARD_SKINS,
  EMBLEMAS,
  IDENTITY_EMBLEMS,
  SPRITESHEET_URL,
  TIMER_SKINS,
  applyCustomizationGlobals,
  barSkinPreviewStyle,
  getProfileStats,
  isDevMode,
  isUnlocked,
  unlockHint,
  writeLS,
} from '@/features/profile/profile-data';
import { showToast } from '@/lib/toast';
import { TimerVisual } from '@/features/workout/timer-visuals';
import './emblema-tab.css';

export type CustomSubTab = 'itens-magicos' | 'emotes' | 'estandartes' | 'maestrias';

const LOCK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const LOCK_SVG_SM = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    width={10}
    height={10}
    style={{ position: 'absolute', top: 6, right: 6, opacity: 0.6 }}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/* Regra de grupos de banner idêntica a `_renderBanners` (L613–615) */
const EXTRA_KEYS =
  /^(lava-vulcao|matrix-grid|glacial|gold-rush|titan-core|nebulosa-galatica|stealth-ops-v2|cyber-pulse-v2|solar-flare|deep-void|biohazard|bloodline-v2|starlight|inferno-engine|quantum-weaver|stormbringer|void-reaver|emerald-dragon)$/;

interface Unlocks {
  stats: ReturnType<typeof getProfileStats>;
  devMode: boolean;
  maestrias: Record<string, { nivel?: number }>;
}

/* ══════════ Sub-aba 1: Itens Mágicos (banner) ══════════ */

const BannerCard: React.FC<{
  b: (typeof BANNERS)[number];
  active: boolean;
  u: Unlocks;
  onClick: () => void;
}> = ({ b, active, u, onClick }) => {
  const unlocked = isUnlocked(b.unlock, u.stats, u.devMode, u.maestrias);
  return (
    <div
      className={`banner-option${active ? ' banner-option--active' : ''}${!unlocked ? ' banner-option--locked' : ''}`}
      data-banner={b.key}
      data-locked={!unlocked ? 'true' : undefined}
      onClick={onClick}
    >
      <div className="banner-option__label">{b.nome}</div>
      {b.animated && !b.master && <span className="banner-option__anim-badge">ANIMADO</span>}
      {b.master && <span className="banner-option__master-badge">MASTER</span>}
      {!unlocked && (
        <>
          <span className="banner-option__lock-icon">{LOCK_SVG}</span>
          <div className="banner-option__unlock-hint">{b.hint}</div>
        </>
      )}
    </div>
  );
};

const SectionHeader: React.FC<{ label: string; sublabel?: string }> = ({ label, sublabel }) => (
  <div
    style={{
      gridColumn: '1 / -1',
      margin: '8px 0 4px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}
  >
    <span
      style={{
        fontSize: '0.6rem',
        fontWeight: 900,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: 'var(--primary-light)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
    {sublabel && (
      <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{sublabel}</span>
    )}
    <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(139,92,246,0.3),transparent)' }} />
  </div>
);

const MasterHeader: React.FC = () => (
  <div
    style={{
      gridColumn: '1 / -1',
      margin: '12px 0 4px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}
  >
    <span
      style={{
        fontSize: '0.6rem',
        fontWeight: 900,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        background: 'linear-gradient(90deg,#f59e0b,#d97706)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        whiteSpace: 'nowrap',
      }}
    >
      ★ MASTER
    </span>
    <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(245,158,11,0.5),transparent)' }} />
  </div>
);

/* ══════════ Emblema de identidade: card + preview ══════════ */

const IdentityEmblemCard: React.FC<{
  e: (typeof IDENTITY_EMBLEMS)[number];
  onClick: () => void;
}> = ({ e, onClick }) => (
  <div className="emblem-card" data-identity-emblem={e.id} onClick={onClick}>
    <div className="holoShine" />
    <div style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 2, background: 'rgba(255,255,255,0.15)', zIndex: 20 }} />
    <div style={{ position: 'absolute', bottom: 4, right: 4, display: 'flex', gap: 2, zIndex: 20, opacity: 0.4 }}>
      <div style={{ width: 2, height: 6, background: '#958ea0' }} />
      <div style={{ width: 2, height: 6, background: '#958ea0' }} />
      <div style={{ width: 2, height: 6, background: '#958ea0' }} />
    </div>
    <div className="emblem-card__icon" style={{ mixBlendMode: 'screen' }}>
      {e.type === 'sprite' ? (
        <img
          src={SPRITESHEET_URL}
          alt=""
          style={{ position: 'absolute', maxWidth: 'none', width: '300%', height: '300%', top: e.y, left: e.x }}
        />
      ) : (
        <img src={e.url} alt="" style={{ maxWidth: 'none', width: '100%', height: '100%', objectFit: 'contain' }} />
      )}
    </div>
  </div>
);

/* v4.74.0 — a foto de perfil é a ÚLTIMA opção do Ícone Legado do Prestígio.
   Ao tocar, abre as ações de usar a imagem atual, enviar/trocar a imagem. */
const IdentityPhotoCard: React.FC<{
  photo?: string;
  active: boolean;
  onClick: () => void;
}> = ({ photo, active, onClick }) => (
  <button
    type="button"
    className={`emblem-card emblem-card--photo${active ? ' is-open' : ''}`}
    data-identity-photo="true"
    onClick={onClick}
    aria-label="Foto de perfil"
    aria-expanded={active}
  >
    {photo ? (
      <img src={photo} alt="Foto de perfil atual" className="emblem-card__photo" />
    ) : (
      <span className="emblem-card__photo-empty" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={26} height={26}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Sem foto</span>
      </span>
    )}
    <span className="emblem-card__photo-badge" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={12} height={12}>
        <path d="M14.5 4h-5L8 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
    </span>
    <span className="emblem-card__photo-label">Foto de perfil</span>
  </button>
);

const IdentityPreview: React.FC<{
  emblem: (typeof IDENTITY_EMBLEMS)[number] | undefined;
  isPulsing: boolean;
  onEquip: () => void;
}> = ({ emblem, isPulsing, onEquip }) => {
  if (!emblem) return null;
  return (
    <>
      <div className="emblem-preview-bento__glow" />
      <div className="emblem-preview-bento__inner">
        <div
          className={`emblem-display${isPulsing ? ' animate-pulse-emblem' : ''}`}
          id="previewImageWrapper"
          style={{ mixBlendMode: 'screen' }}
        >
          {emblem.type === 'sprite' ? (
            <img
              alt="Emblema Selecionado"
              id="previewImage"
              src={SPRITESHEET_URL}
              style={{ position: 'absolute', maxWidth: 'none', width: '300%', height: '300%', left: emblem.x, top: emblem.y }}
            />
          ) : (
            <img
              alt="Emblema Selecionado"
              id="previewImage"
              src={emblem.url}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
        </div>
      </div>
      <div className="emblem-preview-bento__info">
        <h3 className="emblem-preview-bento__title" id="previewTitle">
          {emblem.nome}
        </h3>
        <p className="emblem-preview-bento__desc" id="previewDesc">
          {emblem.desc}
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            padding: '10px 14px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              letterSpacing: '1px',
            }}
          >
            Raridade
          </span>
          <span
            id="previewRarity"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: emblem.corRaridade,
              fontWeight: 700,
              letterSpacing: '1px',
            }}
          >
            {emblem.raridade}
          </span>
        </div>
        <button className="emblem-preview-bento__equip-btn" id="btnEquiparEmblema" type="button" onClick={onEquip}>
          Equipar
        </button>
      </div>
    </>
  );
};

/* ══════════ Sub-abas: wrapper ══════════ */

const SubTabContent: React.FC<{
  id: string;
  active: boolean;
  children: React.ReactNode;
}> = ({ id, active, children }) => (
  <div
    className={`sub-tab-content${active ? ' active' : ''}`}
    id={`subtab-${id}`}
    style={active ? undefined : { display: 'none' }}
  >
    {children}
  </div>
);

export const CustomizacaoSubTabs: React.FC<{ subtab: CustomSubTab | 'exercicios-lista' }> = ({ subtab }) => {
  const data = useLocalData();
  const { state, update } = useProfileState();
  const pc = state?.customization ?? DEFAULT_PROFILE_CUSTOMIZATION;
  const selectedEmblems = state?.selectedEmblems ?? [];

  const stats = useMemo(() => getProfileStats(data), [data]);
  const devMode = isDevMode();
  const maestrias = (data.legacy?.maestrias ?? {}) as Record<string, { nivel?: number }>;
  const u: Unlocks = { stats, devMode, maestrias };

  /* Identidade: seleção local (preview) + pulso (persistido) */
  const [activeEmblemId, setActiveEmblemId] = useState(() => (IDENTITY_EMBLEMS.some((e) => e.id === pc.mainEmblem) ? pc.mainEmblem : 'prestigio-1') || 'prestigio-1');
  const [pulse, setPulse] = useState(() => pc.mainEmblemPulse !== false);

  /* Aplica atributos globais assim que o estado recarrega (ProfileFeature L162) */
  useEffect(() => {
    applyCustomizationGlobals(pc);
  }, [pc]);

  /* Sincroniza preview/pulso com o estado persistido (padrão "adjust state on
     prop change" do React — sem set-state-in-effect) */
  const [prevMain, setPrevMain] = useState(pc.mainEmblem);
  const [prevPulse, setPrevPulse] = useState(pc.mainEmblemPulse);
  if (prevMain !== pc.mainEmblem) {
    setPrevMain(pc.mainEmblem);
    setActiveEmblemId(IDENTITY_EMBLEMS.some((e) => e.id === pc.mainEmblem) ? (pc.mainEmblem as string) : 'prestigio-1');
  }
  if (prevPulse !== pc.mainEmblemPulse) {
    setPrevPulse(pc.mainEmblemPulse);
    setPulse(pc.mainEmblemPulse !== false);
  }

  /* ── Itens Mágicos: banner (`_initItensMagicos` L1256–1274) ── */
  const pickBanner = (b: (typeof BANNERS)[number]) => {
    if (!isUnlocked(b.unlock, stats, devMode, maestrias)) {
      showToast('Desbloqueie este banner primeiro!', 'info');
      return;
    }
    void update((d) => {
      d.customization = { ...d.customization, banner: b.key };
    });
    showToast('Banner atualizado!', 'success');
  };

  /* ── Emotes: barras + cronômetro (`_initEmotes` L1277–1317) ── */
  const pickBarSkin = (key: string, unlocked: boolean) => {
    if (!unlocked) {
      showToast('Desbloqueie este estilo primeiro!', 'info');
      return;
    }
    void update((d) => {
      d.customization = { ...d.customization, barSkin: key };
    });
    showToast('Estilo de barra atualizado!', 'success');
  };

  const pickTimerSkin = (key: string, unlocked: boolean) => {
    if (!unlocked) {
      /* legado usa 'warning'; CSS só tem success/error/info → mapeia p/ info */
      showToast('Skin de cronômetro bloqueada!', 'info');
      return;
    }
    void update((d) => {
      d.customization = { ...d.customization, timerSkin: key };
    });
    writeLS('timerStyle', key);
    window.dispatchEvent(new CustomEvent('academia:timer-style-changed'));
    showToast('Estilo de cronômetro atualizado!', 'success');
  };

  /* ── Skins de Torre: card skin (`_initSkinsTorre` L1320–1339) ── */
  const pickCardSkin = (key: string, unlocked: boolean) => {
    if (!unlocked) {
      showToast('Desbloqueie este skin primeiro!', 'info');
      return;
    }
    void update((d) => {
      d.customization = { ...d.customization, cardSkin: key };
    });
    showToast('Skin de card atualizada!', 'success');
  };

  /* ── Estandartes (`_initEstandartes` L1342–1365): máx. 3 ── */
  const toggleEstandarte = (id: string, unlocked: boolean) => {
    if (!unlocked) {
      showToast('Emblema bloqueado!', 'info');
      return;
    }
    const isSelected = selectedEmblems.includes(id);
    if (!isSelected && selectedEmblems.length >= 3) {
      showToast('Máximo de 3 estandartes!', 'info');
      return;
    }
    const next = isSelected ? selectedEmblems.filter((x) => x !== id) : [...selectedEmblems, id];
    void update((d) => {
      d.selectedEmblems = next;
    });
    showToast('Estandartes atualizados!', 'success');
  };

  /* ── Maestrias: identidade + moldura (`_initMaestriasCustomizacao` L1368–1412) ── */
  const onPulseChange = (checked: boolean) => {
    setPulse(checked);
    void update((d) => {
      d.customization = { ...d.customization, mainEmblemPulse: checked };
    });
  };

  const equipEmblem = () => {
    void update((d) => {
      d.customization = { ...d.customization, mainEmblem: activeEmblemId, mainEmblemPulse: pulse };
    });
    showToast('Emblema de identificação equipado!', 'success');
  };

  const pickFrame = (f: (typeof AVATAR_FRAMES)[number]) => {
    if (!isUnlocked(f.unlock, stats, devMode, maestrias)) {
      showToast('Moldura bloqueada!', 'info');
      return;
    }
    void update((d) => {
      d.customization = { ...d.customization, avatarFrame: f.key };
    });
    showToast('Moldura atualizada!', 'success');
  };

  /* ── Emblema: foto de perfil customizada (v4.56.0) ──
     É o mesmo campo `customization.photo` usado pelo avatar do Início, da
     sidebar e do Fit ID — aqui o usuário escolhe a imagem no lugar de depender
     só do avatar do Google ou do emblema equipado. */
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoPanelOpen, setPhotoPanelOpen] = useState(false);

  const pickProfilePhoto = async (file: File | null | undefined) => {
    if (!file) return;
    setPhotoBusy(true);
    try {
      const url = await fileToDataUrl(file, { maxSide: 480, quality: 0.85 });
      await update((d) => {
        d.customization = { ...d.customization, photo: url };
      });
      showToast('Foto de perfil atualizada!', 'success');
    } catch {
      showToast('Não foi possível carregar essa imagem', 'error');
    } finally {
      setPhotoBusy(false);
    }
  };

  const removeProfilePhoto = () => {
    void update((d) => {
      d.customization = { ...d.customization, photo: '' };
    });
    showToast('Foto de perfil removida — voltando ao emblema', 'info');
  };

  /* Grupos de banner (idem L613–615) */
  const classicos = BANNERS.filter((b) => !EXTRA_KEYS.test(b.key));
  const extras = BANNERS.filter((b) => !b.master && EXTRA_KEYS.test(b.key));
  const masters = BANNERS.filter((b) => b.master);

  const pulseSwitchStyle = pulse
    ? { backgroundColor: 'rgba(139, 92, 246, 0.3)', borderColor: 'var(--primary)' }
    : { backgroundColor: 'var(--background-alt)', borderColor: 'rgba(255, 255, 255, 0.15)' };

  const previewEmblem = IDENTITY_EMBLEMS.find((e) => e.id === activeEmblemId);
  /* v4.73.1 — 'Nenhum' substituiu "Padrão"; o valor antigo ainda pode estar
     salvo em contas existentes. */
  const activeCardSkin =
    !pc.cardSkin || pc.cardSkin === 'default' ? 'none' : pc.cardSkin;

  return (
    <>
      {/* ── Itens Mágicos ── */}
      <SubTabContent id="itens-magicos" active={subtab === 'itens-magicos'}>
        {/* v4.72.5 — Cartões usa o mesmo fundo da sub-aba Estilo das Barras
            de Progresso (theme-cinza-castelo), antes era theme-roxo. */}
        <div className="theme-section theme-cinza-castelo customization-surface">
          <div className="theme-bg" />
          <div className="theme-content">
            <div className="profile-section-title">Cartões</div>
            <div className="banner-grid" id="bannerGrid">
              {classicos.map((b) => (
                <BannerCard key={b.key} b={b} u={u} active={b.key === pc.banner} onClick={() => pickBanner(b)} />
              ))}
              {extras.length > 0 && (
                <SectionHeader label="Coleção Extra" sublabel={`${extras.length} novos banners`} />
              )}
              {extras.map((b) => (
                <BannerCard key={b.key} b={b} u={u} active={b.key === pc.banner} onClick={() => pickBanner(b)} />
              ))}
              {masters.length > 0 && <MasterHeader />}
              {masters.map((b) => (
                <BannerCard key={b.key} b={b} u={u} active={b.key === pc.banner} onClick={() => pickBanner(b)} />
              ))}
            </div>

            {/* v4.73.1 — Skin dos Cards saiu de "Skins de Torre" e passou a
                viver junto dos Cartões, que é onde ela de fato aparece. */}
            <div className="profile-section-title" style={{ marginTop: 24 }}>
              Skin dos Cards
            </div>
            <p className="card-skin-sub">
              Aplica o acabamento aos cards do treino, da coleção e do perfil.
            </p>
            <div className="card-skin-grid" id="cardSkinGrid">
              {CARD_SKINS.map((s) => {
                const unlocked = isUnlocked(s.unlock, stats, devMode, maestrias);
                return (
                  <div
                    key={s.key}
                    className={`card-skin-option card-skin-option--${s.key}${s.key === activeCardSkin ? ' card-skin-option--active' : ''}${!unlocked ? ' card-skin-option--locked' : ''}`}
                    data-card-skin={s.key}
                    data-locked={!unlocked ? 'true' : undefined}
                    onClick={() => pickCardSkin(s.key, unlocked)}
                  >
                    {!unlocked && LOCK_SVG_SM}
                    <div className="card-skin-option__preview" />
                    <span className="card-skin-option__label">{s.nome}</span>
                    {!unlocked && <span className="card-skin-option__hint">{s.hint}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SubTabContent>

      {/* ── Emotes: barras de progresso + cronômetro ── */}
      <SubTabContent id="emotes" active={subtab === 'emotes'}>
        <div className="theme-section theme-cinza-castelo customization-surface">
          <div className="theme-bg" />
          <div className="theme-content">
            <div className="profile-section-title">Estilo das Barras de Progresso</div>
            <div className="bar-skin-grid" id="barSkinGrid">
              {BAR_SKINS.map((s) => {
                const unlocked = isUnlocked(s.unlock, stats, devMode, maestrias);
                return (
                  <div
                    key={s.key}
                    className={`bar-skin-option bar-skin-option--${s.key}${s.key === pc.barSkin ? ' bar-skin-option--active' : ''}${!unlocked ? ' bar-skin-option--locked' : ''}`}
                    data-bar-skin={s.key}
                    data-locked={!unlocked ? 'true' : undefined}
                    onClick={() => pickBarSkin(s.key, unlocked)}
                  >
                    {!unlocked && LOCK_SVG_SM}
                    <div className="bar-skin-option__preview">
                      <div className="bar-skin-option__fill-wrapper">
                        <div className="bar-skin-option__fill" style={barSkinPreviewStyle(s.key)} />
                      </div>
                    </div>
                    <span className="bar-skin-option__label">{s.nome}</span>
                    {!unlocked && <span className="bar-skin-option__hint">{s.hint}</span>}
                  </div>
                );
              })}
            </div>

            <div className="profile-section-title" style={{ marginTop: 24 }}>
              Estilo do Cronômetro
            </div>
            <div className="bar-skin-grid" id="timerSkinGrid">
              {TIMER_SKINS.map((s) => {
                const unlocked = isUnlocked(s.unlock, stats, devMode, maestrias);
                /* v4.73.0 — só Radar/Ampulheta existem; valor antigo cai no radar. */
                const activeTimer = pc.timerSkin === 'hourglass' ? 'hourglass' : 'radar';
                return (
                  <div
                    key={s.key}
                    className={`bar-skin-option bar-skin-option--${s.key}${s.key === activeTimer ? ' bar-skin-option--active' : ''}${!unlocked ? ' bar-skin-option--locked' : ''}`}
                    data-timer-skin={s.key}
                    data-locked={!unlocked ? 'true' : undefined}
                    onClick={() => pickTimerSkin(s.key, unlocked)}
                  >
                    {!unlocked && LOCK_SVG_SM}
                    <div className={`timer-skin-preview timer-skin-preview--${s.key}`} aria-hidden="true">
                      <div className="timer-skin-preview__visual">
                        <TimerVisual
                          style={s.key === 'hourglass' ? 'hourglass' : 'radar'}
                          pct={68}
                          idPrefix={`preview-${s.key}`}
                        />
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', textAlign: 'center' }}>{s.nome}</div>
                    {!unlocked && <span className="bar-skin-option__hint">{s.hint}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SubTabContent>

      {/* ── Estandartes (emblemas do perfil) ── */}
      <SubTabContent id="estandartes" active={subtab === 'estandartes'}>
        <div className="theme-section theme-ouro">
          <div className="theme-bg" />
          <div className="theme-content">
            <div className="profile-section-title">Conquistas do Perfil</div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 12 }}>
              Selecione até 3 conquistas para exibir no seu cartão.
            </p>
            <div className="emblem-gallery" id="emblemGallery">
              {EMBLEMAS.map((e) => {
                const unlocked = isUnlocked(e.unlock, stats, devMode, maestrias);
                const active = selectedEmblems.includes(e.id);
                const animClass = e.animated ? ` emblem-gallery__icon--${e.animationType}` : '';
                return (
                  <div
                    key={e.id}
                    className={`emblem-gallery__item${active ? ' emblem-gallery__item--active' : ''}${!unlocked ? ' emblem-gallery__item--locked' : ''}`}
                    data-emblem={e.id}
                    data-locked={!unlocked ? 'true' : undefined}
                    onClick={() => toggleEstandarte(e.id, unlocked)}
                  >
                    <div
                      className={`emblem-gallery__icon${animClass}`}
                      dangerouslySetInnerHTML={{ __html: e.icon }}
                    />
                    <div className="emblem-gallery__name">{e.nome}</div>
                    {!unlocked && (
                      <span className="emblem-gallery__lock">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={14} height={14}>
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SubTabContent>

      {/* ── Emblema: foto de perfil + emblema de identificação + moldura ── */}
      <SubTabContent id="maestrias" active={subtab === 'maestrias'}>
        <div className="theme-section theme-cinza-castelo customization-surface">
          <div className="theme-bg" />
          <div className="theme-content">
            {/* v4.73.0 — cabeçalho da aba Emblema (antes ela começava direto na
                foto de perfil, sem contexto visual). */}
            <div className="identity-hero">
              <div className="identity-hero__text">
                <span className="identity-hero__eyebrow">Sua identidade</span>
                <h3 className="identity-hero__title">Avatar, emblema e moldura</h3>
                <p className="identity-hero__desc">
                  O que você escolher aqui aparece no seu cartão de perfil, na sidebar e no Fit ID.
                </p>
              </div>
              <div className="identity-hero__preview">
                <ProfileEmblem customization={pc} />
              </div>
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                void pickProfilePhoto(e.target.files?.[0]);
                e.target.value = '';
              }}
            />

            <div className="profile-section-title">Emblema de Identificação</div>

            <div className="emblem-picker-container">
              <div className="emblem-picker__preview-panel">
                <div className="emblem-preview-bento" id="identityEmblemPreview">
                  <IdentityPreview emblem={previewEmblem} isPulsing={pulse} onEquip={equipEmblem} />
                </div>
              </div>

              <div className="emblem-picker__grid-panel">
                <div className="emblem-picker__grid-header">
                  <h3 className="emblem-picker__grid-title" style={{ margin: 0 }}>
                    Ícone Legado do Prestígio
                  </h3>
                  <div className="emblem-pulse">
                    <span className="emblem-pulse__spark" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
                        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
                      </svg>
                    </span>
                    <span className="emblem-pulse__copy">
                      <span className="emblem-pulse__title">Pulsar emblema</span>
                      <span className="emblem-pulse__desc">Brilho suave no avatar</span>
                    </span>
                    <label className="pulse-toggle-label emblem-pulse__control" style={{ marginBottom: 0 }}>
                      <span className="sr-only">Pulsar emblema</span>
                      <div className="pulse-toggle-switch" id="pulseToggleBg" style={pulseSwitchStyle}>
                        <input
                          type="checkbox"
                          id="pulseToggle"
                          checked={pulse}
                          onChange={(e) => onPulseChange(e.target.checked)}
                        />
                        <span className="pulse-toggle-dot" id="pulseToggleDot" />
                      </div>
                    </label>
                  </div>
                </div>
                <div className="identity-emblems-grid" id="identityEmblemGrid">
                  {IDENTITY_EMBLEMS.map((e) => (
                    <IdentityEmblemCard
                      key={e.id}
                      e={e}
                      onClick={() => setActiveEmblemId(e.id)}
                    />
                  ))}
                  <IdentityPhotoCard
                    photo={pc.photo || undefined}
                    active={photoPanelOpen}
                    onClick={() => setPhotoPanelOpen((value) => !value)}
                  />
                </div>

                {photoPanelOpen && (
                  <div className="identity-photo-sheet" id="identityPhotoSheet">
                    <div className="identity-photo-sheet__preview">
                      <ProfileEmblem customization={pc} />
                    </div>
                    <div className="identity-photo-sheet__body">
                      <span className={`identity-photo-sheet__status${pc.photo ? ' is-custom' : ''}`}>
                        {pc.photo ? 'Foto personalizada em uso' : 'Nenhuma foto enviada'}
                      </span>
                      <p className="identity-photo-sheet__hint">
                        A foto substitui o emblema no avatar do Início, da sidebar e do Fit ID.
                      </p>
                      <div className="identity-photo-sheet__actions">
                        <button
                          type="button"
                          className="identity-photo-action"
                          disabled={!pc.photo}
                          onClick={() => {
                            setPhotoPanelOpen(false);
                            showToast('Imagem atual mantida no perfil.', 'success');
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={15} height={15}>
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          Usar imagem atual
                        </button>
                        <button
                          type="button"
                          className="identity-photo-action identity-photo-action--primary"
                          disabled={photoBusy}
                          onClick={() => photoInputRef.current?.click()}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={15} height={15}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          {photoBusy ? 'Carregando…' : pc.photo ? 'Alterar imagem' : 'Fazer upload'}
                        </button>
                        {pc.photo && (
                          <button
                            type="button"
                            className="identity-photo-action identity-photo-action--danger"
                            onClick={() => {
                              removeProfilePhoto();
                              setPhotoPanelOpen(false);
                            }}
                          >
                            Remover foto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="identity-section-head" style={{ marginTop: 24 }}>
              <div className="profile-section-title" style={{ marginBottom: 0 }}>
                Moldura de Avatar
              </div>
              <span className="identity-section-meta">{AVATAR_FRAMES.length} estilos</span>
            </div>
            <div className="frame-grid" id="frameGrid">
              {AVATAR_FRAMES.map((f) => {
                const unlocked = isUnlocked(f.unlock, stats, devMode, maestrias);
                const active = f.key === (pc.avatarFrame ?? null);
                return (
                  <div
                    key={f.key ?? 'none'}
                    className={`frame-option ${f.classe}${active ? ' frame-option--active' : ''}${!unlocked ? ' frame-option--locked' : ''}`}
                    data-frame={f.key ?? ''}
                    data-locked={!unlocked ? 'true' : undefined}
                    onClick={() => pickFrame(f)}
                  >
                    <span className="frame-option__ring">
                      <span className="frame-option__avatar">
                        <ProfileEmblem customization={pc} />
                      </span>
                    </span>
                    <span className="frame-option__label">{f.nome}</span>
                    {active && (
                      <span className="frame-option__check" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                    )}
                    {!unlocked && (
                      <>
                        {LOCK_SVG_SM}
                        <span className="frame-option__hint" style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', display: 'block' }}>
                          {unlockHint(f.unlock)}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SubTabContent>
    </>
  );
};

