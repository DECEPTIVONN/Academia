/**
 * ProfileFeature.tsx — Overlay do Perfil como hub fullscreen (v4.3.0)
 * Port 1:1 de componentes/secoes/perfil.html + initPerfilTabs (secao-perfil.js)
 * + renderProgresso (secao-progresso.js) + applyProfileCustomization/initPersonalizarTab
 * (secao-customizacao.js). O shell do overlay (header + X) fica no App.tsx.
 *
 * v4.2.0: as abas PERFIL, PROGRESSÃO e PERSONALIZAR viraram hubs com busca +
 * tiles + telas no estilo das Configurações, reutilizando HubShell.
 * v4.3.0: o overlay perdeu as 4 sub-abas (#perfTabNav) e virou um hub
 * fullscreen de profundidade 2 (raiz → grupo → leaf) no estilo do
 * SettingsStandalone: a raiz mostra 4 tiles de grupo (Perfil, Progressão,
 * Personalizar, Configurações); cada grupo abre seus filhos; cada leaf abre
 * o conteúdo atual. O HubShell gerencia a pilha de navegação; a busca fica
 * só na raiz (keywords dos leaves agregadas nos tiles de grupo).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalData } from '@/hooks/useLocalData';
import { useAuth } from '@/core/auth/use-auth';
import { loadAddedFriends } from '@/features/social/friend-invites';
import { fadeIn } from '@/lib/animations';
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
  revertLockedCustomizations,
  tituloNome,
  unlockHint,
  writeLS,
} from '@/features/profile/profile-data';
import { showToast } from '@/lib/toast';
import { useSettingsGroup } from '@/features/settings/SettingsFeature';
import { HubShell, type HubScreen, type HubTile } from '@/features/settings/HubShell';
import { computeRadarStats, getArchetypeBadge } from '@/features/gamification/radar';
import { useRadarMode } from '@/features/gamification/useRadarFit';
import { useShareStore } from '@/features/gamification/share-store';
import { useMaestriaUi } from '@/features/gamification/maestria-ui';
import { DEFAULT_PROFILE_CUSTOMIZATION, type ProfileConquista } from '@/core/db/schema';

type ProgSub = 'visao-geral' | 'nivel-xp' | 'conquistas';
type PersSub = 'identidade' | 'frase' | 'destaque' | 'titulo';

/* ── SVGs idênticos ao perfil.html ── */

const FlameSvg = (size: number, color = '#f97316') => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} style={{ color }}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

/* ── Ícones de tile (20px) para os hubs (v4.2.0) ── */

const SvgUser20 = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SvgAward20 = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const SvgGrid20 = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const SvgBolt20 = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const SvgStar20 = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 6.91 8.26 12 2" />
  </svg>
);

const SvgChat20 = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SvgTrending20 = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const SvgType20 = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

/** Agrega keywords dos tiles filhos para a busca na raiz do hub. */
const groupKeywords = (tiles: HubTile[], extra: string[] = []): string[] => [
  ...extra,
  ...tiles.flatMap((t) => [t.title.toLowerCase(), ...(t.keywords ?? [])]),
];

export function ProfileFeature() {
  const data = useLocalData();
  const { user } = useAuth();
  const { state: profile, update } = useProfileState();

  const [addedFriends, setAddedFriends] = useState(() => loadAddedFriends());
  useEffect(() => {
    const refresh = () => setAddedFriends(loadAddedFriends());
    document.addEventListener('academia:friends-changed', refresh);
    return () => document.removeEventListener('academia:friends-changed', refresh);
  }, []);

  const [devMode, setDevMode] = useState(() => isDevMode());

  /* Pilha de navegação do hub raiz (raiz → grupo → leaf) */
  const [navStack, setNavStack] = useState<string[]>([]);

  /* v4.6.0-shell: navegação profunda vinda da Busca Geral unificada —
     o App abre o overlay do Perfil e despacha 'academia:profile-nav'
     com a pilha de screens do HubShell (ex.: ['seguranca']). */
  useEffect(() => {
    const onProfileNav = (e: Event) => {
      const stack = (e as CustomEvent<string[] | undefined>).detail;
      if (Array.isArray(stack)) setNavStack(stack);
    };
    document.addEventListener('academia:profile-nav', onProfileNav);
    return () => document.removeEventListener('academia:profile-nav', onProfileNav);
  }, []);

  // Rascunhos do Personalizar (init único, idem legado)
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

  /* Aplica atributos globais (body data-bar/card-skin + banner do Dashboard).
     Só com o estado real carregado: sem perfil ainda, os defaults fariam a
     splash (index.html) preencher a barra com a skin errada — ela espera
     `body[data-bar-skin]`, que aqui passa a significar "skin real aplicada". */
  useEffect(() => {
    if (!profile) return;
    applyCustomizationGlobals(pc);
  }, [pc, profile]);

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
    // "Aqui desde (ano de ingresso na plataforma)" — preenche o ano de
    // ingresso quando ainda não definido, a partir da conta (Supabase) ou
    // do ano atual (modo offline).
    let since = p.since;
    if (!since) {
      const joinYear = user?.created_at
        ? new Date(user.created_at).getFullYear()
        : new Date().getFullYear();
      since = String(joinYear);
      void update((d) => {
        d.customization = { ...d.customization, since };
      });
    }
    setDraft({
      nome: (p.nome || p.handle?.replace(/^@/, '').toUpperCase() || 'DECEPTIVON').toUpperCase(),
      handle: p.handle || '@deceptivon',
      assinatura: p.assinatura || '',
      showcaseStat: p.showcaseStat || 'streak',
      titulo: p.titulo ?? null,
    });
  }, [profile, user, update]);

  /* ── Handlers ── */

  const saveIdentity = async () => {
    const handle = draft.handle.trim() || '@deceptivon';
    // Por padrão o nome de exibição é o próprio handle (sem opção separada).
    const nome = handle.replace(/^@/, '').toUpperCase() || 'DECEPTIVON';
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

  /* ── Grupo Configurações (v4.3.0: embutido no hub raiz) ── */

  const settings = useSettingsGroup({
    devMode,
    onToggleDevMode: (v) => void toggleDevMode(v),
  });

  /* ── Derivados de UI ── */

  const tituloAtivo = tituloNome(pc.titulo);
  const showcaseDef = SHOWCASE_STATS.find((s) => s.key === (pc.showcaseStat || 'streak'));
  const showcaseVal = showcaseDef ? showcaseDef.compute(stats) : 0;

  const AvatarNode = (() => {
    if (pc.photo) {
      return (
        <img
          src={pc.photo}
          alt="Avatar"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          referrerPolicy="no-referrer"
        />
      );
    }
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

  /* ── Telas de grupo: Perfil ── */

  const perfilTiles: HubTile[] = [
    {
      id: 'cartao',
      title: 'Cartão do Perfil',
      desc: 'Banner, avatar, estatísticas e ações',
      icon: SvgUser20,
      badge: pc.nome || 'DECEPTIVON',
      keywords: ['perfil', 'cartao', 'avatar', 'banner', 'nome', 'acoes', 'amigos', 'colecao'],
    },
    {
      id: 'ofensivas',
      title: 'Ofensivas dos Amigos',
      desc: 'Sequências de treino dos seus amigos',
      icon: FlameSvg(20, 'currentColor'),
      badge: '3 amigos',
      keywords: ['ofensivas', 'amigos', 'streak', 'sequencia'],
    },
    {
      id: 'medalhas',
      title: 'Medalhas',
      desc: 'Prévia das medalhas conquistadas',
      icon: SvgAward20,
      badge: '3 de 4',
      keywords: ['medalhas', 'premios', 'ouro', 'prata', 'bronze'],
    },
  ];

  const perfilScreens: Record<string, HubScreen> = {
    /* Cabeçalho do perfil (perfil.html L1–55) — a tela "Cartão do Perfil" */
    cartao: {
      title: 'Cartão do Perfil',
      content: (
        <div className="perf-sub-content active" id="perf-subtab-cartao">
          <div className="theme-section theme-roxo">
            <div className="theme-bg" />
            <div className="theme-content">
              <div className="profile-header" style={{ position: 'relative' }}>
                <button
                  className="profile-edit-btn"
                  id="btnEditarPerfil"
                  title="Personalizar Perfil"
                  onClick={() => setNavStack(['personalizar', 'identidade'])}
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
        </div>
      ),
    },
    ofensivas: {
      title: 'Ofensivas dos Amigos',
      content: (
        <div className="perf-sub-content" id="perf-subtab-ofensivas">
          <div className="theme-section theme-turquesa">
            <div className="theme-bg" />
            <div className="theme-content">
              <div className="profile-section-title">OFENSIVAS DOS AMIGOS</div>
                <div className="friends-streaks">
                  {addedFriends.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      Nenhum amigo adicionado ainda.
                    </span>
                  )}
                  {addedFriends.map((f) => (
                    <div className="friend-avatar" key={f.id}>
                      {f.avatarInitial}
                      <span
                        className="friend-streak-badge"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '2px 6px',
                        }}
                      >
                        {FlameSvg(10)} 0
                      </span>
                    </div>
                  ))}
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
        </div>
      ),
    },
    medalhas: {
      title: 'Medalhas',
      content: (
        <div className="perf-sub-content" id="perf-subtab-medalhas">
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
      ),
    },
  };

  /* ── Telas de grupo: Progressão ── */

  const progTiles: HubTile[] = [
    {
      id: 'visao-geral',
      title: 'Visão Geral',
      desc: 'Ofensiva, XP, liga e pódios',
      icon: SvgGrid20,
      badge: `${stats.streak} dias`,
      keywords: ['visao', 'geral', 'ofensiva', 'streak', 'xp', 'liga', 'podios'],
    },
    {
      id: 'nivel-xp',
      title: 'Nível e XP',
      desc: 'Barra de progresso do nível atual',
      icon: SvgBolt20,
      badge: `Nível ${stats.nivel}`,
      keywords: ['nivel', 'xp', 'progresso', 'barra', 'proximo'],
    },
    {
      id: 'conquistas',
      title: 'Conquistas',
      desc: 'Badges desbloqueados e bloqueados',
      icon: SvgStar20,
      badge: `${badges.filter((b) => b.check || conquistas.includes(b.id)).length} de ${badges.length}`,
      keywords: ['conquistas', 'badges', 'medalhas', 'premios'],
    },
  ];

  const progScreens: Record<ProgSub, HubScreen> = {
    'visao-geral': {
      title: 'Visão Geral',
      content: (
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
      ),
    },
    'nivel-xp': {
      title: 'Nível e XP',
      content: (
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
      ),
    },
    conquistas: {
      title: 'Conquistas',
      content: (
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
      ),
    },
  };

  /* ── Telas de grupo: Personalizar ── */

  const persTiles: HubTile[] = [
    {
      id: 'identidade',
      title: 'Identidade',
      desc: 'Nome de exibição e @handle',
      icon: SvgUser20,
      badge: handleText(pc),
      keywords: ['identidade', 'nome', 'handle', 'usuario', 'exibicao'],
    },
    {
      id: 'frase',
      title: 'Frase de Assinatura',
      desc: 'Mensagem no cartão e no share card',
      icon: SvgChat20,
      badge: draft.assinatura ? 'Com frase' : 'Sem frase',
      keywords: ['frase', 'assinatura', 'motivacao', 'share', 'citacao'],
    },
    {
      id: 'destaque',
      title: 'Em Destaque',
      desc: 'Estatística em destaque no cartão',
      icon: SvgTrending20,
      badge: showcaseDef?.label ?? 'Streak',
      keywords: ['destaque', 'showcase', 'stat', 'estatistica', 'streak'],
    },
    {
      id: 'titulo',
      title: 'Título',
      desc: 'Título exibido sob o seu nome',
      icon: SvgType20,
      badge: tituloAtivo ?? 'Sem título',
      keywords: ['titulo', 'rank', 'nome'],
    },
  ];

  const persScreens: Record<PersSub, HubScreen> = {
    identidade: {
      title: 'Identidade',
      content: (
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
                    Nome / Handle (@usuário)
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
              {/* v4.11.0 — botão Salvar na tela Identidade */}
              <button
                type="button"
                className="set-btn set-btn--primary"
                style={{ width: '100%', marginTop: 16 }}
                onClick={() => void saveIdentity()}
              >
                Salvar Identidade
              </button>
            </div>
          </div>
        </div>
      ),
    },
    frase: {
      title: 'Frase de Assinatura',
      content: (
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
      ),
    },
    destaque: {
      title: 'Em Destaque',
      content: (
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
                    onClick={() => {
                      setDraft((d) => ({ ...d, showcaseStat: s.key }));
                      void update((d) => {
                        d.customization = { ...d.customization, showcaseStat: s.key };
                      });
                      showToast('Destaque atualizado!', 'success');
                    }}                  >
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
      ),
    },
    titulo: {
      title: 'Título',
      content: (
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
      ),
    },
  };

  /* ── Hub raiz (v4.10.0: Sua Conta 1º, Progressão dentro de Perfil,
       Nuvem dentro de Sua Conta, Telas dentro de Cores) ── */

  /* v4.10.0 — Progressão movida para dentro de Perfil */
  /* v4.11.0 — Personalizar movido para dentro de Perfil (sem submenu separado) */
  const perfilTilesV2: HubTile[] = [
    ...perfilTiles,
    {
      id: 'progressao',
      title: 'Progressão',
      desc: 'Visão geral, nível/XP e conquistas',
      icon: SvgTrending20,
      badge: `Nível ${stats.nivel}`,
      keywords: groupKeywords(progTiles, ['progressao', 'gamificacao']),
    },
    ...persTiles,
  ];

  /* v4.10.0 — Nuvem movida para dentro de Sua Conta */
  const contaTilesV2: HubTile[] = [
    ...(settings.screens.conta?.tiles ?? []),
    {
      id: 'nuvem',
      title: 'Nuvem e Sincronização',
      desc: 'Supabase, chave de sync, status e dispositivos',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
      ),
      badge: 'Nuvem',
      keywords: [
        'nuvem', 'sync', 'sincronizar', 'sincronizacao', 'supabase', 'online',
        'backup nuvem', 'chave', 'dispositivos', 'conectados', 'sessao',
        'remoto', 'tempo real',
      ],
    },
  ];

  const rootTiles: HubTile[] = [
    /* v4.10.0 — Sua Conta é a primeira opção */
    {
      id: 'conta',
      title: 'Sua Conta',
      desc: 'Informações da conta, senha, backup, nuvem e desativação',
      icon: SvgUser20,
      badge: handleText(pc) || 'Local',
      keywords: [
        'conta', 'perfil', 'usuario', 'nome', 'handle', 'email', 'senha',
        'backup', 'exportar', 'importar', 'json', 'desativar', 'sair', 'dados',
        'nuvem', 'sync', 'sincronizar', 'supabase',
      ],
    },
    {
      id: 'perfil',
      title: 'Perfil',
      desc: 'Cartão, ofensivas, medalhas, progressão e personalização',
      icon: SvgUser20,
      badge: pc.nome || 'DECEPTIVON',
      keywords: groupKeywords(perfilTilesV2, ['perfil', 'progressao', 'personalizar']),
    },
    /* Configurações restantes (Segurança, Dispositivos, Notificações, Cores, Exibição) */
    ...settings.tiles.filter((t) => !['conta', 'nuvem'].includes(t.id)),
  ];

  const rootScreens: Record<string, HubScreen> = {
    perfil: {
      eyebrow: 'ACADEMIA • PERFIL',
      title: 'Perfil',
      tiles: perfilTilesV2,
      screens: { ...perfilScreens, ...progScreens, ...persScreens },
    },
    /* v4.10.0 — Sua Conta com Nuvem aninhada */
    conta: {
      ...settings.screens.conta,
      tiles: contaTilesV2,
      screens: {
        ...settings.screens.conta.screens,
        nuvem: settings.screens.nuvem,
      },
    },
    /* Telas restantes de Configurações (sem conta/nuvem que foram movidos) */
    ...Object.fromEntries(
      Object.entries(settings.screens).filter(([k]) => k !== 'conta')
    ),
  };

  return (
    <div className="treino-container">
      <HubShell
        eyebrow="ACADEMIA"
        title="Meu Perfil"
        sub="Personalize sua jornada"
        searchPlaceholder="Buscar (perfil, progressão, cores, segurança...)"
        emptyText="Nenhuma seção encontrada."
        tiles={rootTiles}
        screens={rootScreens}
        hubExtra={settings.rootExtra}
        navStack={navStack}
        onNavStackChange={setNavStack}
      />
      {settings.modals}
    </div>
  );
}
