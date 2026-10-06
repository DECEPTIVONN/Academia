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
  APP_THEMES,
  FRASES_PRESET,
  IDENTITY_EMBLEMS,
  SHOWCASE_STATS,
  SPRITESHEET_URL,
  THEME_TITLES,
  TITULOS,
  applyAppTheme,
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
  PREF_KEYS,
} from '@/features/profile/profile-data';
import { exportBackupData, importBackupFile } from '@/features/profile/backup';
import { showToast } from '@/lib/toast';
import { computeRadarStats, getArchetypeBadge } from '@/features/gamification/radar';
import { useRadarMode } from '@/features/gamification/useRadarFit';
import { useShareStore } from '@/features/gamification/share-store';
import { useMaestriaUi } from '@/features/gamification/maestria-ui';
import { DEFAULT_PROFILE_CUSTOMIZATION, type ProfileConquista } from '@/core/db/schema';

type MainTab = 'perfil' | 'progressao' | 'personalizar' | 'prefs';
type ProgSub = 'visao-geral' | 'nivel-xp' | 'conquistas';
type PrefsSub = 'config' | 'geral' | 'assinatura' | 'seguranca';
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
  const [prefsSub, setPrefsSub] = useState<PrefsSub>('config');
  const [persSub, setPersSub] = useState<PersSub>('identidade');

  const [theme, setTheme] = useState(() => readLS('academia_theme') || 'purple');
  const [devMode, setDevMode] = useState(() => isDevMode());
  const [timerStyle, setTimerStyle] = useState(() => readLS('timerStyle') || 'radar');
  const [prefs, setPrefs] = useState(() => ({
    sounds: readLS(PREF_KEYS.sounds) !== 'false',
    vibration: readLS(PREF_KEYS.vibration) !== 'false',
    messages: readLS(PREF_KEYS.messages) !== 'false',
    online: readLS(PREF_KEYS.online) === 'true',
  }));

  // Rascunhos da aba Personalizar / campos de Segurança (init único, idem legado)
  const [draft, setDraft] = useState({
    nome: '',
    handle: '',
    assinatura: '',
    showcaseStat: 'streak',
    titulo: null as string | null,
  });
  const [sec, setSec] = useState({ nome: '', handle: '', email: '', senha: '' });
  const initedRef = useRef(false);

  // Importação de backup
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

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
    setSec({ nome: p.nome || '', handle: p.handle || '', email: p.email || '', senha: '' });
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

  const saveSecurityField = async (
    field: 'nome' | 'handle' | 'email' | 'senha',
    value: string,
    successMsg: string
  ) => {
    await update((d) => {
      d.customization = { ...d.customization, [field]: value };
    });
    showToast(successMsg, 'success');
    if (field === 'senha') setSec((s) => ({ ...s, senha: '' }));
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

  const handleExport = async () => {
    try {
      const result = await exportBackupData();
      showToast(
        result === 'shared' ? 'Backup compartilhado!' : 'Dados exportados com sucesso!',
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Erro ao exportar dados.', 'error');
    }
  };

  const handleImportFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      showToast('Arquivo muito grande (máx. 20MB).', 'error');
      return;
    }
    setPendingFile(file);
    setConfirmOpen(true);
  };

  const confirmImport = async () => {
    const file = pendingFile;
    setConfirmOpen(false);
    setPendingFile(null);
    if (!file) return;
    try {
      await importBackupFile(file);
      showToast('Importação bem-sucedida! Atualizando interface...', 'success');
      document.dispatchEvent(new CustomEvent('academia:db-ready'));
    } catch (err) {
      console.error('[importData]', err);
      showToast(`Erro ao importar: ${(err as Error).message || 'arquivo inválido.'}`, 'error');
    }
  };

  const cancelImport = () => {
    setConfirmOpen(false);
    setPendingFile(null);
    showToast('Importação cancelada.', 'info');
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

            {/* ========== ABA 4: PREFERÊNCIAS (L218–472) ========== */}
            {mainTab === 'prefs' && (
              <div id="perf-tab-prefs" className="perf-tab-content active">
                <div className="sub-navbar" id="perfPrefsSubNav">
                  {(
                    [
                      {
                        key: 'config' as PrefsSub,
                        title: 'Configurações',
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M4.93 4.93A10 10 0 0 1 19.07 19.07" />
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        ),
                      },
                      {
                        key: 'geral' as PrefsSub,
                        title: 'Geral',
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                            <line x1="4" y1="6" x2="20" y2="6" />
                            <line x1="4" y1="12" x2="20" y2="12" />
                            <line x1="4" y1="18" x2="20" y2="18" />
                          </svg>
                        ),
                      },
                      {
                        key: 'assinatura' as PrefsSub,
                        title: 'Assinatura',
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ),
                      },
                      {
                        key: 'seguranca' as PrefsSub,
                        title: 'Segurança',
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        ),
                      },
                    ]
                  ).map((btn) => (
                    <button
                      key={btn.key}
                      className={`sub-nav-btn ${prefsSub === btn.key ? 'active' : ''}`}
                      data-perfsubtab2={btn.key}
                      title={btn.title}
                      onClick={() => swapFade('.perf-sub-content', btn.key !== prefsSub, () => setPrefsSub(btn.key))}
                    >
                      {btn.icon}
                    </button>
                  ))}
                </div>

                {/* Sub-aba: Configurações */}
                {prefsSub === 'config' && (
                  <div id="perf-subtab2-config" className="perf-sub-content active">
                    <div className="theme-section theme-cinza-castelo">
                      <div className="theme-bg" />
                      <div className="theme-content">
                        <div className="profile-section-title">CONFIGURAÇÕES</div>
                        <div className="timer-settings">
                          <h3>Configurações do Cronômetro</h3>
                          <div className="timer-options">
                            <label className="timer-option">
                              <input
                                type="radio"
                                name="timerStyle"
                                value="radar"
                                checked={timerStyle === 'radar'}
                                onChange={() => {
                                  writeLS('timerStyle', 'radar');
                                  setTimerStyle('radar');
                                }}
                              />
                              <span className="to-card">
                                <span className="to-icon" style={{ display: 'flex', alignItems: 'center' }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                </span>
                                <span className="to-lbl">Radar</span>
                              </span>
                            </label>
                            <label className="timer-option">
                              <input
                                type="radio"
                                name="timerStyle"
                                value="hourglass"
                                checked={timerStyle === 'hourglass'}
                                onChange={() => {
                                  writeLS('timerStyle', 'hourglass');
                                  setTimerStyle('hourglass');
                                }}
                              />
                              <span className="to-card">
                                <span className="to-icon" style={{ display: 'flex', alignItems: 'center' }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                    <path d="M5 2h14" />
                                    <path d="M5 22h14" />
                                    <path d="M17 2v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V2" />
                                    <path d="M17 22v-4a5 5 0 0 0-5-5 5 5 0 0 0-5 5v4" />
                                  </svg>
                                </span>
                                <span className="to-lbl">Ampulheta</span>
                              </span>
                            </label>
                          </div>
                        </div>
                        <div className="timer-settings">
                          <h3>Cor de Energia (Tema)</h3>
                          <p style={{ fontSize: '.85rem', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                            Personalize a cor principal do seu aplicativo.
                          </p>
                          <div className="theme-colors" id="themeColors">
                            {Object.keys(APP_THEMES).map((key) => (
                              <button
                                key={key}
                                className={`t-color ${theme === key ? 'active' : ''}`}
                                data-theme={key}
                                style={{ ['--c' as string]: APP_THEMES[key].p }}
                                title={THEME_TITLES[key] ?? key}
                                onClick={() => {
                                  applyAppTheme(key);
                                  setTheme(key);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="timer-settings">
                          <h3>Backup e Dados</h3>
                          <p style={{ fontSize: '.85rem', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                            Exporte seus treinos e histórico para um arquivo ou importe dados de outro
                            dispositivo.
                          </p>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-secondary"
                              data-action="export-data"
                              style={{
                                flex: 1,
                                minWidth: '160px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                              }}
                              onClick={() => void handleExport()}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                <polyline points="16 6 12 2 8 6" />
                                <line x1="12" y1="2" x2="12" y2="15" />
                              </svg>{' '}
                              EXPORTAR DADOS
                            </button>
                            <button
                              className="btn btn-secondary"
                              data-action="import-data"
                              style={{
                                flex: 1,
                                minWidth: '160px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                              }}
                              onClick={() => fileRef.current?.click()}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>{' '}
                              IMPORTAR DADOS
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-aba: Geral */}
                {prefsSub === 'geral' && (
                  <div className="perf-sub-content active" id="perf-subtab2-geral">
                    <div className="theme-section theme-cinza-castelo">
                      <div className="theme-bg" />
                      <div className="theme-content">
                        <div className="profile-section-title">PREFERÊNCIAS GERAIS</div>
                        <div className="timer-settings">
                          <div className="pref-toggle-list">
                            {(
                              [
                                {
                                  id: 'prefSounds',
                                  key: 'sounds' as const,
                                  label: 'Efeitos Sonoros',
                                  desc: 'Sons ao marcar exercícios e conquistas',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'prefVibration',
                                  key: 'vibration' as const,
                                  label: 'Vibração',
                                  desc: 'Feedback háptico ao interagir',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                                      <path d="M12 2a10 10 0 1 0 10 10" />
                                      <path d="M12 6v6l4 2" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'prefMessages',
                                  key: 'messages' as const,
                                  label: 'Mensagens Motivacionais',
                                  desc: 'Frases de incentivo ao concluir treinos',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'prefOnlineStatus',
                                  key: 'online' as const,
                                  label: 'Status Online',
                                  desc: 'Mostrar sua atividade para amigos',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                                      <circle cx="12" cy="12" r="10" />
                                      <line x1="2" y1="12" x2="22" y2="12" />
                                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                    </svg>
                                  ),
                                },
                              ]
                            ).map((item) => (
                              <div className="pref-toggle-item" key={item.id}>
                                <div className="pref-toggle-info">
                                  {item.icon}
                                  <div>
                                    <span className="pref-toggle-label">{item.label}</span>
                                    <span className="pref-toggle-desc">{item.desc}</span>
                                  </div>
                                </div>
                                <label className="pref-switch">
                                  <input
                                    type="checkbox"
                                    id={item.id}
                                    checked={prefs[item.key]}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setPrefs((p) => ({ ...p, [item.key]: checked }));
                                      writeLS(PREF_KEYS[item.key], String(checked));
                                    }}
                                  />
                                  <span className="pref-slider" />
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-aba: Assinatura */}
                {prefsSub === 'assinatura' && (
                  <div className="perf-sub-content active" id="perf-subtab2-assinatura">
                    <div className="theme-section theme-ouro">
                      <div className="theme-bg" />
                      <div className="theme-content">
                        <div className="profile-section-title">ASSINATURA</div>
                        <div className="timer-settings">
                          <div className="subscription-plans">
                            <div className="plan-card plan-free active-plan">
                              <div className="plan-badge">ATUAL</div>
                              <div className="plan-name">Gratuito</div>
                              <div className="plan-price">
                                R$ 0<span>/mês</span>
                              </div>
                              <ul className="plan-features">
                                <li>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>{' '}
                                  Fichas de treino ilimitadas
                                </li>
                                <li>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>{' '}
                                  Calendário de progresso
                                </li>
                                <li>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>{' '}
                                  Conquistas e badges
                                </li>
                                <li style={{ opacity: 0.4 }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>{' '}
                                  Radar Fit avançado
                                </li>
                                <li style={{ opacity: 0.4 }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>{' '}
                                  Exportação de dados
                                </li>
                              </ul>
                            </div>
                            <div className="plan-card plan-pro">
                              <div className="plan-badge plan-badge--pro">PRO</div>
                              <div className="plan-name">Academia PRO</div>
                              <div className="plan-price">
                                R$ 9<span>/mês</span>
                              </div>
                              <ul className="plan-features">
                                <li>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>{' '}
                                  Tudo do gratuito
                                </li>
                                <li>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>{' '}
                                  Radar Fit avançado
                                </li>
                                <li>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>{' '}
                                  Exportação de relatórios
                                </li>
                                <li>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>{' '}
                                  Banners e emblemas exclusivos
                                </li>
                                <li>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>{' '}
                                  Suporte prioritário
                                </li>
                              </ul>
                              <button
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '12px', fontWeight: 800, letterSpacing: '1px' }}
                              >
                                EM BREVE
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-aba: Segurança */}
                {prefsSub === 'seguranca' && (
                  <div className="perf-sub-content active" id="perf-subtab2-seguranca">
                    <div className="theme-section theme-cinza-castelo">
                      <div className="theme-bg" />
                      <div className="theme-content">
                        <div className="profile-section-title">SEGURANÇA E CONTA</div>
                        <div className="timer-settings">
                          <div className="security-form">
                            {(
                              [
                                {
                                  id: 'secNome',
                                  btnId: 'btnSaveNome',
                                  field: 'nome' as const,
                                  label: 'Nome de Exibição',
                                  type: 'text',
                                  placeholder: 'Seu nome...',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                      <circle cx="12" cy="7" r="4" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'secHandle',
                                  btnId: 'btnSaveHandle',
                                  field: 'handle' as const,
                                  label: 'Nome de Usuário (@handle)',
                                  type: 'text',
                                  placeholder: '@usuario...',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                      <circle cx="12" cy="7" r="4" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'secEmail',
                                  btnId: 'btnSaveEmail',
                                  field: 'email' as const,
                                  label: 'E-mail',
                                  type: 'email',
                                  placeholder: 'seu@email.com',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                      <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'secSenha',
                                  btnId: 'btnSaveSenha',
                                  field: 'senha' as const,
                                  label: 'Senha',
                                  type: 'password',
                                  placeholder: 'Nova senha...',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                  ),
                                },
                              ]
                            ).map((f) => (
                              <div className="sec-field-group" key={f.id}>
                                <label className="sec-label" htmlFor={f.id}>
                                  {f.icon}
                                  {f.label}
                                </label>
                                <div className="sec-input-row">
                                  <input
                                    type={f.type}
                                    className="sec-input"
                                    id={f.id}
                                    placeholder={f.placeholder}
                                    value={sec[f.field]}
                                    onChange={(e) => setSec((s) => ({ ...s, [f.field]: e.target.value }))}
                                  />
                                  <button
                                    className="sec-save-btn"
                                    id={f.btnId}
                                    title={`Salvar ${f.label}`}
                                    onClick={() =>
                                      void saveSecurityField(f.field, sec[f.field], 'Campo atualizado!')
                                    }
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  </button>
                                </div>
                                {f.field === 'senha' && (
                                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '6px', opacity: 0.7 }}>
                                    🔒 Armazenado localmente no dispositivo.
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

      {/* MODAL CONFIRM IMPORT */}
      {confirmOpen && (
        <div className="modal-overlay" id="modalConfirm" style={{ display: 'flex' }}>
          <div className="modal-confirm">
            <div className="confirm-icon">⚠️</div>
            <h3 id="confirmTitle">⚠️ Importar backup?</h3>
            <p id="confirmMsg">
              Esta ação irá SUBSTITUIR todos os seus dados atuais (exercícios, histórico,
              conquistas, fichas e personalização) pelos dados do arquivo selecionado. Esta ação
              não pode ser desfeita.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" id="btnConfirmNo" onClick={cancelImport}>
                Cancelar
              </button>
              <button className="btn btn-danger" id="btnConfirmYes" onClick={() => void confirmImport()}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileRef}
        id="inputImportarJSON"
        style={{ display: 'none' }}
        accept=".json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) handleImportFile(file);
        }}
      />
    </div>
  );
}
