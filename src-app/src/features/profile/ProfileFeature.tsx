/**
 * ProfileFeature.tsx — Conteúdo do overlay do Perfil (Fase 2)
 * Port 1:1 de componentes/secoes/perfil.html + initPerfilTabs (secao-perfil.js)
 * + renderProgresso (secao-progresso.js) + applyProfileCustomization/initPersonalizarTab
 * (secao-customizacao.js). O shell do overlay (header + X) fica no App.tsx.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocalData } from '@/hooks/useLocalData';
import { fadeIn, fadeSwap } from '@/lib/animations';
import { useProfileState } from '@/features/profile/useProfileState';
import {
  FRASES_PRESET,
  IDENTITY_EMBLEMS,
  SHOWCASE_STATS,
  SPRITESHEET_URL,
  TITULOS,
  applyCustomizationGlobals,
  emblemForSlot,
  getBadgeDefinitions,
  getProfileStats,
  handleText,
  isDevMode,
  isUnlocked,
  readLS,
  revertLockedCustomizations,
  tituloNome,
  unlockHint,
  writeLS,
} from '@/features/profile/profile-data';
import { showToast } from '@/lib/toast';
import { SettingsFeature } from '@/features/settings/SettingsFeature';
import { computeRadarStats, getArchetypeBadge } from '@/features/gamification/radar';
import { useRadarMode } from '@/features/gamification/useRadarFit';
import { useShareStore } from '@/features/gamification/share-store';
import { useMaestriaUi } from '@/features/gamification/maestria-ui';
import { DEFAULT_PROFILE_CUSTOMIZATION, type ProfileConquista } from '@/core/db/schema';

type MainTab = 'perfil' | 'progressao' | 'personalizar' | 'prefs';
type ProgSub = 'visao-geral' | 'nivel-xp' | 'conquistas';
type PersSub = 'identidade' | 'frase' | 'destaque' | 'titulo';

function initialTab(): MainTab {
  let saved = readLS('academia_perfil_tab');
  if (saved === 'config') {
    saved = 'prefs';
    writeLS('academia_perfil_tab', 'prefs');
  }
  return (['perfil', 'progressao', 'personalizar', 'prefs'] as MainTab[]).includes(
    saved as MainTab
  )
    ? (saved as MainTab)
    : 'perfil';
}

/* ── SVGs idênticos ao perfil.html ── */

const SvgUser = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SvgActivity = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const SvgEdit = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const SvgSliders = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const FlameSvg = (size: number, color = '#f97316') => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} style={{ color }}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

export function ProfileFeature() {
  const data = useLocalData();
  const { state: profile, update } = useProfileState();

  const [mainTab, setMainTab] = useState<MainTab>(initialTab);
  const [progSub, setProgSub] = useState<ProgSub>('visao-geral');
  const [persSub, setPersSub] = useState<PersSub>('identidade');

  const [devMode, setDevMode] = useState(() => isDevMode());

  // Rascunhos da aba Personalizar (init único, idem legado)
  const [draft, setDraft] = useState({
    nome: '',
    handle: '',
    assinatura: '',
    showcaseStat: 'streak',
    titulo: null as string | null,
  });
  const initedRef = useRef(false);

  const pc = profile?.customization ?? DEFAULT_PROFILE_CUSTOMIZATION;
  const maestrias = (data.legacy?.maestrias ?? {}) as Record<string, { nivel?: number }>;

  const stats = useMemo(() => getProfileStats(data), [data]);
  const conquistas: ProfileConquista[] = useMemo(
    () => profile?.conquistas ?? [],
    [profile?.conquistas]
  );
  const badges = useMemo(
    () => getBadgeDefinitions(data, stats, conquistas, devMode),
    [data, stats, conquistas, devMode]
  );

  /* renderBadges (secao-progresso.js L1248): fadeIn no grid a cada re-render
     (inclusive quando uma conquista é desbloqueada naturalmente) */
  const badgesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fadeIn(badgesRef.current);
  }, [badges]);

  /* Badge de arquétipo do Radar Fit (updateProfileArchetypeBadge L1051–1092) */
  const radarMode = useRadarMode((s) => s.mode);
  const radarTier = data.legacy?.radarTier ?? 1;
  const archetype = useMemo(
    () => getArchetypeBadge(computeRadarStats(data, radarMode), radarTier),
    [data, radarMode, radarTier]
  );

  /* Aplica atributos globais (body data-bar/card-skin + banner do Dashboard) */
  useEffect(() => {
    applyCustomizationGlobals(pc);
  }, [pc]);

  /* Persiste as conquistas naturalmente desbloqueadas e abre o share card
     (renderBadges L1226–1248: saveDB + setTimeout(openShareBadge, 1000)) */
  useEffect(() => {
    if (!profile) return;
    const newly = badges.filter(
      (b) => !b.special && b.naturalCheck && !profile.conquistas.includes(b.id)
    );
    if (newly.length > 0) {
      const last = newly[newly.length - 1];
      void update((d) => {
        newly.forEach((b) => d.conquistas.push(b.id));
      });
      window.setTimeout(() => {
        useShareStore.getState().openBadge({
          icon: last.icon,
          name: last.name,
          desc: last.desc,
        });
      }, 1000);
    }
  }, [profile, badges, update]);

  /* Inicializa rascunos uma única vez quando o estado carrega */
  useEffect(() => {
    if (!profile || initedRef.current) return;
    initedRef.current = true;
    const p = profile.customization;
    setDraft({
      nome: (p.nome || 'DECEPTIVON').toUpperCase(),
      handle: p.handle || '@deceptivon',
      assinatura: p.assinatura || '',
      showcaseStat: p.showcaseStat || 'streak',
      titulo: p.titulo ?? null,
    });
  }, [profile]);

  /* ── Handlers ── */

  /* initPerfilTabs (secao-perfil.js L915-945/976-1001/1007-1026/1038-1063):
     fadeSwap no conteúdo ativo (120ms) → troca → fadeIn no novo (280ms).
     O nó legado alvo é o conteúdo da aba selecionada; no React o nó ativo é o
     único `.perf-*` montado (render condicional), então o swap usa flushSync. */
  const swapFade = (selector: string, changed: boolean, update: () => void) => {
    const active = document.querySelector<HTMLElement>(selector);
    if (!active) {
      update();
      return;
    }
    if (!changed) {
      update();
      fadeIn(active); // legado: performSwap sem fade-out quando já ativa
      return;
    }
    fadeSwap(active, () => {
      flushSync(update);
      const target = document.querySelector<HTMLElement>(selector);
      if (target) fadeIn(target);
    });
  };

  const selectMainTab = (tab: MainTab) => {
    swapFade('.perf-tab-content', tab !== mainTab, () => {
      writeLS('academia_perfil_tab', tab);
      setMainTab(tab);
    });
  };

  const saveIdentity = async () => {
    const nome = draft.nome.trim().toUpperCase() || 'DECEPTIVON';
    const handle = draft.handle.trim() || '@deceptivon';
    const assinatura = draft.assinatura.trim();
    const showcaseStat = draft.showcaseStat || 'streak';
    const titulo = draft.titulo ?? null;
    await update((d) => {
      d.customization = { ...d.customization, nome, handle, assinatura, showcaseStat, titulo };
    });
    showToast('Identidade atualizada!', 'success');
  };

  const toggleDevMode = async (checked: boolean) => {
    writeLS('academia_dev_mode', String(checked));
    setDevMode(checked);

    if (!checked && profile) {
      const reverted = revertLockedCustomizations(
        profile.customization,
        profile.selectedEmblems,
        stats,
        maestrias
      );
      await update((d) => {
        d.customization = reverted.customization;
        d.selectedEmblems = reverted.selectedEmblems;
      });
      applyCustomizationGlobals(reverted.customization);
    }
    showToast(
      checked ? 'Modo desenvolvedor ativado!' : 'Modo desenvolvedor desativado!',
      'success'
    );
  };

  /* ── Derivados de UI ── */

  const tituloAtivo = tituloNome(pc.titulo);
  const showcaseDef = SHOWCASE_STATS.find((s) => s.key === (pc.showcaseStat || 'streak'));
  const showcaseVal = showcaseDef ? showcaseDef.compute(stats) : 0;

  const AvatarNode = (() => {
    const emblem = IDENTITY_EMBLEMS.find((e) => e.id === (pc.mainEmblem || 'prestigio-1'));
    const pulsing = pc.mainEmblemPulse !== false;
    if (emblem) {
      const inner =
        emblem.type === 'sprite' ? (
          <img
            src={SPRITESHEET_URL}
            style={{
              position: 'absolute',
              maxWidth: 'none',
              width: '300%',
              height: '300%',
              left: emblem.x,
              top: emblem.y,
            }}
          />
        ) : (
          <img src={emblem.url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        );
      return (
        <div
          className={`profile-avatar__emblem-wrapper ${pulsing ? 'animate-pulse' : ''}`}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mixBlendMode: 'screen',
          }}
        >
          {inner}
        </div>
      );
    }
    return (
      <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${pc.avatarSeed || 'Deceptivon'}`}
        alt="Avatar"
      />
    );
  })();

  const mainTabs: { key: MainTab; label: string; icon: typeof SvgUser }[] = [
    { key: 'perfil', label: 'PERFIL', icon: SvgUser },
    { key: 'progressao', label: 'PROGRESSÃO', icon: SvgActivity },
    { key: 'personalizar', label: 'PERSONALIZAR', icon: SvgEdit },
    { key: 'prefs', label: 'PREFERÊNCIAS', icon: SvgSliders },
  ];

  return (
    <div className="treino-container">
      <div id="section-perfil" className="main-section" role="tabpanel">
        <div id="tab-perfil" className="t-tab active" role="tabpanel" style={{ padding: 0 }}>
          {/* ========== CABEÇALHO DO PERFIL (perfil.html L1–55) ========== */}
          <div className="theme-section theme-roxo">
            <div className="theme-bg" />
            <div className="theme-content">
              <div className="profile-header" style={{ position: 'relative' }}>
                <button
                  className="profile-edit-btn"
                  id="btnEditarPerfil"
                  title="Personalizar Perfil"
                  onClick={() => selectMainTab('personalizar')}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="16"
                    height="16"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <div className="profile-banner" data-banner={pc.banner || 'roxo-neon'} />
                <div className="profile-avatar-wrap">
                  <div className="profile-avatar" data-frame={pc.avatarFrame || ''}>
                    {AvatarNode}
                  </div>
                  <div className="profile-user-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 className="profile-name">{pc.nome || 'DECEPTIVON'}</h2>
                      <span
                        className="profile-archetype-badge"
                        id="profileArchetype"
                        style={{
                          display: 'inline-flex',
                          color: archetype.color,
                          borderColor: `${archetype.color}40`,
                          fontSize: '0.6rem',
                          padding: '3px 6px',
                          borderRadius: '12px',
                          background: 'rgba(255,255,255,0.1)',
                          fontWeight: 800,
                          letterSpacing: '0.5px',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        {`${archetype.icon} ${archetype.name}`}
                      </span>
                    </div>
                    <div
                      className="profile-titulo"
                      style={{ display: tituloAtivo ? '' : 'none' }}
                    >
                      {tituloAtivo ?? ''}
                    </div>
                    <span className="profile-handle">{handleText(pc)}</span>
                    <span
                      className="profile-assinatura"
                      style={{ display: pc.assinatura ? '' : 'none' }}
                    >
                      {pc.assinatura ? `\u201c${pc.assinatura}\u201d` : ''}
                    </span>
                  </div>
                </div>
                <div className="profile-stats-mini">
                  <div className="p-mini-stat">
                    <span className="p-mini-val">5</span>
                    <span className="p-mini-lbl">Segue</span>
                  </div>
                  <div className="p-mini-stat">
                    <span className="p-mini-val">5</span>
                    <span className="p-mini-lbl">Seguidores</span>
                  </div>
                </div>
                <div className="profile-emblems" id="profileEmblems">
                  {[0, 1, 2].map((i) => {
                    const emb = emblemForSlot(profile?.selectedEmblems ?? [], i);
                    if (!emb) {
                      return <div className="emblem-slot empty" data-slot={i} key={i} />;
                    }
                    const animClass = emb.animated
                      ? `emblem-gallery__icon--${emb.animationType}`
                      : '';
                    return (
                      <div
                        className="emblem-slot"
                        data-slot={i}
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                        }}
                        title={emb.nome}
                      >
                        <div className={`emblem-gallery__icon ${animClass}`}>{emb.icon}</div>
                      </div>
                    );
                  })}
                </div>
                <div
                  className="showcase-card"
                  id="profileShowcase"
                  style={{ display: showcaseDef ? 'flex' : 'none' }}
                >
                  {showcaseDef && (
                    <>
                      <div
                        className="showcase-card__icon"
                        dangerouslySetInnerHTML={{ __html: showcaseDef.icon }}
                      />
                      <div className="showcase-card__info">
                        <div className="showcase-card__label">{showcaseDef.label}</div>
                        <div className="showcase-card__value">
                          {showcaseVal}
                          <span className="showcase-card__unit">{showcaseDef.unit}</span>
                        </div>
                      </div>
                      <div className="showcase-card__badge">{showcaseDef.badge}</div>
                    </>
                  )}
                </div>
                <div className="profile-actions">
                  <button
                    className="profile-action-btn profile-action-btn--add"
                    id="btnAdicionarAmigos"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width="16"
                      height="16"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    ADICIONAR AMIGOS
                  </button>
                  <button
                    className="profile-action-btn profile-action-btn--add"
            id="btnVerColecao"
            onClick={() => useMaestriaUi.getState().openColecao()}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width="16"
                      height="16"
                    >
                      <rect x="2" y="5" width="14" height="17" rx="2" />
                      <path d="M6 2h12a2 2 0 0 1 2 2v14" />
                    </svg>
                    VER COLEÇÃO
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SISTEMA DE ABAS DO PERFIL (L57–77) ===== */}
          <div
            className="treino-tabs-section section-subtabs"
            style={{ position: 'sticky', top: 0, zIndex: 50 }}
          >
            <nav className="treino-tab-nav" role="tablist" id="perfTabNav">
              {mainTabs.map((t) => (
                <button
                  key={t.key}
                  className={`t-tab-btn ${mainTab === t.key ? 'active' : ''}`}
                  data-perftab={t.key}
                  role="tab"
                  aria-selected={mainTab === t.key}
                  onClick={() => selectMainTab(t.key)}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="perf-tab-content-wrapper">
            {/* ========== ABA 1: PERFIL (L81–113) ========== */}
            {mainTab === 'perfil' && (
              <div id="perf-tab-perfil" className="perf-tab-content active">
                <div className="theme-section theme-turquesa">
                  <div className="theme-bg" />
                  <div className="theme-content">
                    <div className="profile-section-title">OFENSIVAS DOS AMIGOS</div>
                    <div className="friends-streaks">
                      <div className="friend-avatar">
                        👨‍💻
                        <span
                          className="friend-streak-badge"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '2px 6px',
                          }}
                        >
                          {FlameSvg(10)} 616
                        </span>
                      </div>
                      <div className="friend-avatar">
                        👳
                        <span
                          className="friend-streak-badge"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '2px 6px',
                          }}
                        >
                          {FlameSvg(10)} 82
                        </span>
                      </div>
                      <div className="friend-avatar">
                        👵
                        <span
                          className="friend-streak-badge"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '2px 6px',
                          }}
                        >
                          {FlameSvg(10)} 12
                        </span>
                      </div>
                      <div
                        className="friend-add-slot"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          width="14"
                          height="14"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="theme-section theme-ouro">
                  <div className="theme-bg" />
                  <div className="theme-content">
                    <div
                      className="profile-section-title"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      MEDALHAS
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        width="12"
                        height="12"
                        style={{ opacity: 0.6 }}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                    <div className="medals-preview">
                      <div className="medal-item">
                        <div className="medal-circle">🥇</div>
                        <span className="medal-name">Veterano</span>
                      </div>
                      <div className="medal-item">
                        <div className="medal-circle">🥈</div>
                        <span className="medal-name">Foco Total</span>
                      </div>
                      <div className="medal-item">
                        <div className="medal-circle">🥉</div>
                        <span className="medal-name">Madrugador</span>
                      </div>
                      <div className="medal-item">
                        <div className="medal-circle" style={{ opacity: 0.3, filter: 'grayscale(1)' }}>
                          🔒
                        </div>
                        <span className="medal-name">Lendário</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== ABA 2: PROGRESSÃO (L116–215) ========== */}
            {mainTab === 'progressao' && (
              <div id="perf-tab-progressao" className="perf-tab-content">
                {/* Modo Desenvolvedor */}
                <div
                  className="pref-row"
                  style={{
                    margin: '0 0 16px 0',
                    background: 'rgba(139, 92, 246, 0.08)',
                    border: '1px dashed var(--primary-light)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 0 4px var(--primary-light))' }}>
                      🛠️
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span
                        className="pref-label"
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 700,
                          color: '#fff',
                          letterSpacing: '1px',
                          fontSize: '0.95rem',
                        }}
                      >
                        MODO DESENVOLVEDOR
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        Libera personalizações, conquistas e maestrias
                      </span>
                    </div>
                  </div>
                  <label
                    className="pref-switch"
                    style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px', marginBottom: 0 }}
                  >
                    <input
                      type="checkbox"
                      id="devModeToggle"
                      checked={devMode}
                      onChange={(e) => void toggleDevMode(e.target.checked)}
                    />
                    <span className="pref-slider" />
                  </label>
                </div>

                {/* Sub-navbar (L134–144) */}
                <div className="sub-navbar" id="perfProgressaoSubNav">
                  {(
                    [
                      {
                        key: 'visao-geral' as ProgSub,
                        title: 'Visão Geral',
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                          </svg>
                        ),
                      },
                      {
                        key: 'nivel-xp' as ProgSub,
                        title: 'Nível e XP',
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                        ),
                      },
                      {
                        key: 'conquistas' as ProgSub,
                        title: 'Conquistas',
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ),
                      },
                    ]
                  ).map((btn) => (
                    <button
                      key={btn.key}
                      className={`sub-nav-btn ${progSub === btn.key ? 'active' : ''}`}
                      data-perfsubtab={btn.key}
                      title={btn.title}
                      onClick={() => swapFade('.perf-sub-content', btn.key !== progSub, () => setProgSub(btn.key))}
                    >
                      {btn.icon}
                    </button>
                  ))}
                </div>

                {/* Sub-aba: Visão Geral (L147–190) */}
                {progSub === 'visao-geral' && (
                  <div className="perf-sub-content active" id="perf-subtab-visao-geral">
                    <div className="theme-section theme-roxo">
                      <div className="theme-bg" />
                      <div className="theme-content">
                        <div className="profile-section-title">VISÃO GERAL</div>
                        <div className="overview-grid">
                          <div className="overview-item">
                            <span
                              className="ov-icon"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {FlameSvg(20)}
                            </span>
                            <div className="ov-content">
                              <span className="ov-val" id="profStreak">
                                {stats.streak + (stats.streak === 1 ? ' dia' : ' dias')}
                              </span>
                              <span className="ov-lbl">Ofensiva</span>
                            </div>
                          </div>
                          <div className="overview-item">
                            <span
                              className="ov-icon"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" style={{ color: '#eab308' }}>
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                              </svg>
                            </span>
                            <div className="ov-content">
                              <span className="ov-val" id="profXp">
                                {stats.xp} XP
                              </span>
                              <span className="ov-lbl">Total XP</span>
                            </div>
                          </div>
                          <div className="overview-item">
                            <span
                              className="ov-icon"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" style={{ color: '#94a3b8' }}>
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              </svg>
                            </span>
                            <div className="ov-content">
                              <span className="ov-val">Prata</span>
                              <span className="ov-lbl">Liga Atual</span>
                            </div>
                          </div>
                          <div className="overview-item">
                            <span
                              className="ov-icon"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" style={{ color: '#fbbf24' }}>
                                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                <path d="M4 22h16" />
                                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                              </svg>
                            </span>
                            <div className="ov-content">
                              <span className="ov-val">13 pódios</span>
                              <span className="ov-lbl">Conquistas</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-aba: Nível e XP (L193–205) */}
                {progSub === 'nivel-xp' && (
                  <div className="perf-sub-content" id="perf-subtab-nivel-xp">
                    <div className="theme-section theme-azul-pico">
                      <div className="theme-bg" />
                      <div className="theme-content">
                        <div className="profile-section-title">SEU NÍVEL</div>
                        <div className="p-card xp-card">
                          <div className="p-card-header">
                            <h3>
                              Seu Nível:{' '}
                              <span className="gradient-text" id="progNivelName">
                                {stats.nivelName}
                              </span>
                            </h3>
                            <span className="p-card-meta">
                              Nível <span id="progNivelVal">{stats.nivel}</span>
                            </span>
                          </div>
                          <div className="xp-bar-wrap">
                            <div
                              className="xp-bar-fill"
                              id="progXpFill"
                              style={{ width: `${stats.xpPct}%` }}
                            />
                          </div>
                          <div className="xp-details">
                            <span>
                              <span id="progXpAtual">{stats.xp}</span> XP
                            </span>
                            <span>
                              Próximo Nível: <span id="progXpNext">{stats.xpNext}</span> XP
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-aba: Conquistas (L208–213) */}
                {progSub === 'conquistas' && (
                  <div className="perf-sub-content" id="perf-subtab-conquistas">
                    <div className="theme-section theme-ouro">
                      <div className="theme-bg" />
                      <div className="theme-content">
                        <div className="profile-section-title">
                          SUAS CONQUISTAS{' '}
                          <i className="fas fa-chevron-right" />
                        </div>
                        <div className="p-card achievements-card">
                          <div className="badges-grid" id="badgesGrid" ref={badgesRef}>
                            {badges.map((b) => {
                              const unlocked = b.check || conquistas.includes(b.id);
                              return (
                                <div
                                  key={b.id}
                                  className={`badge-item ${unlocked ? 'unlocked' : 'locked'} ${b.special ? 'special' : ''}`}
                                  title={b.desc}
                                  data-id={b.id}
                                  onClick={() => {
                                    if (unlocked) {
                                      useShareStore.getState().openBadge({
                                        icon: b.icon,
                                        name: b.name,
                                        desc: b.desc,
                                      });
                                    }
                                  }}
                                >
                                  <div className="badge-icon">{b.icon}</div>
                                  <div className="badge-name">{b.name}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========== ABA 4: PREFERÊNCIAS (L218–472) ==========
                Interface dedicada de Configurações (v4.1.0): hub com busca/tiles
                + telas navegáveis (cores, geral, segurança, assinatura). */}
            {mainTab === 'prefs' && (
              <div id="perf-tab-prefs" className="perf-tab-content active">
                <SettingsFeature devMode={devMode} onToggleDevMode={(v) => void toggleDevMode(v)} />
              </div>
            )}

            {/* ========== ABA 3: PERSONALIZAR (L475–540) ========== */}
            {mainTab === 'personalizar' && (
              <div id="perf-tab-personalizar" className="perf-tab-content active">
                <div className="sub-navbar" id="perfPersonalizarSubNav">
                  {(
                    [
                      { key: 'identidade' as PersSub, title: 'Identidade' },
                      { key: 'frase' as PersSub, title: 'Frase de Assinatura' },
                      { key: 'destaque' as PersSub, title: 'Em Destaque' },
                      { key: 'titulo' as PersSub, title: 'Título' },
                    ]
                  ).map((btn) => (
                    <button
                      key={btn.key}
                      className={`sub-nav-btn ${persSub === btn.key ? 'active' : ''}`}
                      data-perfsubtab3={btn.key}
                      title={btn.title}
                      onClick={() => swapFade('.perf-sub-content3', btn.key !== persSub, () => setPersSub(btn.key))}
                    >
                      {btn.title === 'Identidade'
                        ? 'Identidade'
                        : btn.title === 'Frase de Assinatura'
                          ? 'Frase'
                          : btn.title === 'Em Destaque'
                            ? 'Destaque'
                            : 'Título'}
                    </button>
                  ))}
                </div>

                {/* Sub-aba: Identidade */}
                {persSub === 'identidade' && (
                  <div className="perf-sub-content3 active" id="perf-subtab3-identidade">
                    <div className="theme-section theme-roxo">
                      <div className="theme-bg" />
                      <div className="theme-content">
                        <div className="profile-section-title">Identidade</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <label
                              style={{
                                fontSize: '0.65rem',
                                letterSpacing: '1.5px',
                                color: 'var(--text-secondary)',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                display: 'block',
                                marginBottom: '6px',
                              }}
                            >
                              Nome de Exibição
                            </label>
                            <input
                              id="inputCustomNome"
                              className="profile-name-input"
                              type="text"
                              maxLength={18}
                              placeholder="SEU NOME"
                              style={{ width: '100%', maxWidth: '100%' }}
                              value={draft.nome}
                              onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label
                              style={{
                                fontSize: '0.65rem',
                                letterSpacing: '1.5px',
                                color: 'var(--text-secondary)',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                display: 'block',
                                marginBottom: '6px',
                              }}
                            >
                              Handle (@usuário)
                            </label>
                            <input
                              id="inputCustomHandle"
                              className="profile-name-input"
                              type="text"
                              maxLength={20}
                              placeholder="@handle"
                              style={{ width: '100%', maxWidth: '100%' }}
                              value={draft.handle}
                              onChange={(e) => setDraft((d) => ({ ...d, handle: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-aba: Frase de Assinatura */}
                {persSub === 'frase' && (
                  <div className="perf-sub-content3 active" id="perf-subtab3-frase">
                    <div className="theme-section theme-roxo">
                      <div className="theme-bg" />
                      <div className="theme-content">
                        <div className="profile-section-title">Frase de Assinatura</div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                          Exibida no seu Share Card e cartão de perfil.
                        </p>
                        <input
                          id="inputCustomAssinatura"
                          className="profile-name-input"
                          type="text"
                          maxLength={60}
                          placeholder="Sua frase motivacional..."
                          style={{
                            width: '100%',
                            maxWidth: '100%',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                            textTransform: 'none',
                          }}
                          value={draft.assinatura}
                          onChange={(e) => setDraft((d) => ({ ...d, assinatura: e.target.value }))}
                        />
                        <div
                          className="frases-preset"
                          id="frasesPreset"
                          style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}
                        >
                          {FRASES_PRESET.map((f) => (
                            <button
                              key={f}
                              className="frase-preset-btn"
                              data-frase={f}
                              type="button"
                              onClick={() => setDraft((d) => ({ ...d, assinatura: f }))}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-aba: Em Destaque */}
                {persSub === 'destaque' && (
                  <div className="perf-sub-content3 active" id="perf-subtab3-destaque">
                    <div className="theme-section theme-ouro">
                      <div className="theme-bg" />
                      <div className="theme-content">
                        <div className="profile-section-title">Em Destaque no Perfil</div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                          Escolha 1 conquista para exibir no seu cartão.
                        </p>
                        <div className="showcase-stat-list" id="showcaseStatList">
                          {SHOWCASE_STATS.map((s) => (
                            <div
                              key={s.key}
                              className={`showcase-stat-option ${
                                (draft.showcaseStat || 'streak') === s.key
                                  ? 'showcase-stat-option--active'
                                  : ''
                              }`}
                              data-showcase={s.key}
                              onClick={() => setDraft((d) => ({ ...d, showcaseStat: s.key }))}
                            >
                              <div
                                className="showcase-stat-option__icon"
                                dangerouslySetInnerHTML={{ __html: s.icon }}
                              />
                              <span className="showcase-stat-option__label">{s.label}</span>
                              <span className="showcase-stat-option__value">
                                {s.compute(stats)} {s.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-aba: Título */}
                {persSub === 'titulo' && (
                  <div className="perf-sub-content3 active" id="perf-subtab3-titulo">
                    <div className="theme-section theme-ouro">
                      <div className="theme-bg" />
                      <div className="theme-content">
                        <div className="profile-section-title">Título</div>
                        <div className="titulo-list" id="tituloList">
                          {TITULOS.map((t) => {
                            const unlocked = isUnlocked(t.unlock, stats, devMode, maestrias);
                            const active = t.id === draft.titulo ? 'titulo-option--active' : '';
                            const locked = !unlocked ? 'titulo-option--locked' : '';
                            return (
                              <div
                                key={t.id ?? 'sem-titulo'}
                                className={`titulo-option ${active} ${locked}`}
                                data-titulo={t.id ?? ''}
                                data-locked={!unlocked ? 'true' : undefined}
                                onClick={() => {
                                  if (!unlocked) {
                                    showToast('Título bloqueado!', 'info');
                                    return;
                                  }
                                  setDraft((d) => ({ ...d, titulo: t.id ?? null }));
                                }}
                              >
                                <span className="titulo-option__name">{t.nome}</span>
                                {!unlocked && t.unlock && (
                                  <span className="titulo-option__hint">{unlockHint(t.unlock)}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  className="customizacao-modal__save-btn"
                  id="btnSalvarCustomizacaoTab"
                  style={{ width: '100%', marginTop: '20px' }}
                  onClick={() => void saveIdentity()}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  SALVAR ALTERAÇÕES
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
