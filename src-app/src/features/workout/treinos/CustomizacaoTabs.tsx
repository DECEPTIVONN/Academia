/**
 * CustomizacaoTabs.tsx — Sub-abas de customização dentro da seção Treinos (Fase 4)
 * Port 1:1 de `initExerciciosCustomSubTabs` (secao-treinos.js L1237–1412) +
 * render helpers de secao-customizacao.js (`_renderBanners` L611, `_renderEmblemas`
 * L687, `_renderBarSkins` L819, `_renderTimerSkins` L843, `_renderCardSkins` L877,
 * `_renderFrames` L799, `_renderIdentityEmblems` L739, `_renderIdentityEmblemPreview`
 * L763, `_updatePulseToggleUI` L712) + DOM de treinos.html L118–174.
 * Persistência: `useProfileState().update` (profileState) + `applyCustomizationGlobals`.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PROFILE_CUSTOMIZATION } from '@/core/db/schema';
import { useLocalData } from '@/hooks/useLocalData';
import { useProfileState } from '@/features/profile/useProfileState';
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
} from '@/features/profile/profile-data';
import { showToast } from '@/lib/toast';

export type CustomSubTab = 'itens-magicos' | 'emotes' | 'torres' | 'estandartes' | 'maestrias';

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
  active: boolean;
  onClick: () => void;
}> = ({ e, active, onClick }) => (
  <div className={`emblem-card${active ? ' active' : ''}`} data-identity-emblem={e.id} onClick={onClick}>
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
  const [activeEmblemId, setActiveEmblemId] = useState(() => pc.mainEmblem || 'prestigio-1');
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
    setActiveEmblemId(pc.mainEmblem || 'prestigio-1');
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

  /* Grupos de banner (idem L613–615) */
  const classicos = BANNERS.filter((b) => !EXTRA_KEYS.test(b.key));
  const extras = BANNERS.filter((b) => !b.master && EXTRA_KEYS.test(b.key));
  const masters = BANNERS.filter((b) => b.master);

  const pulseSwitchStyle = pulse
    ? { backgroundColor: 'rgba(139, 92, 246, 0.3)', borderColor: 'var(--primary)' }
    : { backgroundColor: 'var(--background-alt)', borderColor: 'rgba(255, 255, 255, 0.15)' };

  const previewEmblem = IDENTITY_EMBLEMS.find((e) => e.id === activeEmblemId);

  return (
    <>
      {/* ── Itens Mágicos ── */}
      <SubTabContent id="itens-magicos" active={subtab === 'itens-magicos'}>
        <div className="theme-section theme-roxo">
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
          </div>
        </div>
      </SubTabContent>

      {/* ── Emotes: barras de progresso + cronômetro ── */}
      <SubTabContent id="emotes" active={subtab === 'emotes'}>
        <div className="theme-section theme-cinza-castelo">
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
                return (
                  <div
                    key={s.key}
                    className={`bar-skin-option bar-skin-option--${s.key}${s.key === (pc.timerSkin || 'radar') ? ' bar-skin-option--active' : ''}${!unlocked ? ' bar-skin-option--locked' : ''}`}
                    data-timer-skin={s.key}
                    data-locked={!unlocked ? 'true' : undefined}
                    onClick={() => pickTimerSkin(s.key, unlocked)}
                  >
                    {!unlocked && LOCK_SVG_SM}
                    <div className={`timer-skin-preview timer-skin-preview--${s.key}`} aria-hidden="true">
                      {s.key === 'radar' && <div className="timer-radar" style={{ width: 44, height: 44 }} />}
                      {s.key === 'hourglass' && (
                        <div className="timer-hourglass" style={{ width: 44, height: 44 }}>
                          <span>0:30</span>
                        </div>
                      )}
                      {(s.key === 'cyber' || s.key === 'arcade') && (
                        <div className="timer-skin-preview__fallback">{s.key === 'cyber' ? '00:30' : '0:30'}</div>
                      )}
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

      {/* ── Skins de Torre: card skin ── */}
      <SubTabContent id="torres" active={subtab === 'torres'}>
        <div className="theme-section theme-cinza-castelo">
          <div className="theme-bg" />
          <div className="theme-content">
            <div className="profile-section-title">Skin dos Cards</div>
            <div className="card-skin-grid" id="cardSkinGrid">
              {CARD_SKINS.map((s) => {
                const unlocked = isUnlocked(s.unlock, stats, devMode, maestrias);
                return (
                  <div
                    key={s.key}
                    className={`card-skin-option card-skin-option--${s.key}${s.key === pc.cardSkin ? ' card-skin-option--active' : ''}${!unlocked ? ' card-skin-option--locked' : ''}`}
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

      {/* ── Estandartes (emblemas do perfil) ── */}
      <SubTabContent id="estandartes" active={subtab === 'estandartes'}>
        <div className="theme-section theme-ouro">
          <div className="theme-bg" />
          <div className="theme-content">
            <div className="profile-section-title">Estandartes do Perfil</div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 12 }}>
              Selecione até 3 emblemas para exibir no seu cartão.
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
                    <div className={`emblem-gallery__icon${animClass}`}>{e.icon}</div>
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

      {/* ── Maestrias: identidade + moldura ── */}
      <SubTabContent id="maestrias" active={subtab === 'maestrias'}>
        <div className="theme-section theme-cinza-castelo">
          <div className="theme-bg" />
          <div className="theme-content">
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
                  <div
                    className="emblem-picker__grid-controls"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}
                  >
                    <label className="pulse-toggle-label" style={{ marginBottom: 0 }}>
                      <span>Pulsar</span>
                      <div className="pulse-toggle-switch" id="pulseToggleBg" style={pulseSwitchStyle}>
                        <input
                          type="checkbox"
                          id="pulseToggle"
                          checked={pulse}
                          onChange={(e) => onPulseChange(e.target.checked)}
                        />
                        <span
                          className="pulse-toggle-dot"
                          id="pulseToggleDot"
                          style={{ transform: pulse ? 'translateX(16px)' : 'translateX(0)' }}
                        />
                      </div>
                    </label>
                    <span
                      className="emblem-filter-text"
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: 'var(--text-tertiary)',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Filtra: <span style={{ color: '#c084fc', cursor: 'pointer' }}>Todas</span>
                    </span>
                  </div>
                </div>
                <div className="identity-emblems-grid" id="identityEmblemGrid">
                  {IDENTITY_EMBLEMS.map((e) => (
                    <IdentityEmblemCard
                      key={e.id}
                      e={e}
                      active={e.id === activeEmblemId}
                      onClick={() => setActiveEmblemId(e.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="profile-section-title" style={{ marginTop: 24 }}>
              Moldura de Avatar
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
                    <span className="frame-option__label">{f.nome}</span>
                    {!unlocked && (
                      <span className="frame-option__hint" style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', display: 'block' }}>
                        {unlockHint(f.unlock)}
                      </span>
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

