/**
 * DashboardFeature.tsx — Tela Inicial Gamificada (Início / Dashboard)
 *
 * Port 1:1 do fragmento legado `componentes/secoes/dashboard.html` (v3.5.7):
 * header calling-card (#dashProfileCard) com avatar, botões de topo, saudação
 * e pílula de missões; card central com a PRÉVIA DA FICHA DO DIA + barra de
 * progresso do ciclo (30 divisões); card da ficha sugerida com CTA "TREINAR"
 * e card de ciclo.
 *
 * Dados ligados ao IndexedDB (useLocalData) com as fórmulas do legado:
 *   XP = dias concluídos × 10 · nível = floor(xp/100)+1
 *   sugestão = db.historico[today].treino || determineTreinoDoDia()
 *   ciclo = currentCycleStartDate/currentCycleBreakdown (cópia bruta legacyState)
 *
 * v4.30.0: o Radar Fit saiu do Início (segue só na Progresso) e o card central
 * passou a mostrar a ficha do dia no MESMO desenho do seletor de treino
 * (<FichaDeck/>, sem o widget MAESTRIA/EMBLEMAS). A saudação virou contextual
 * e o botão social deu lugar ao de ofensiva (dias de sequência).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useLocalData } from '@/hooks/useLocalData';
import {
  getCycleStats,
  getCycleTimeline,
  getExerciseMap,
  getStreak,
  getTodayTreino,
  getXp,
  pickExercises,
  today,
  type SheetKey,
} from '@/core/db/queries';
import { SheetSelectorModal } from '@/features/dashboard/SheetSelectorModal';
import { CycleModal } from '@/features/dashboard/CycleModal';
import { FichaDeck } from '@/features/dashboard/FichaDeck';
import { MissionsOverlay } from '@/features/dashboard/MissionsOverlay';
import { InicioMenuModal } from '@/features/dashboard/InicioMenuModal';
import { FitIdOverlay } from '@/features/dashboard/FitIdOverlay';
import { RankingsOverlay } from '@/features/social/RankingsOverlay';
import { RankingsSimulator } from '@/features/social/RankingsSimulator';
import { MessagesModal } from '@/features/dashboard/MessagesModal';
import { NewsOverlay } from '@/features/news/NewsOverlay';
import { useProfileState } from '@/features/profile/useProfileState';
import { IDENTITY_EMBLEMS, SPRITESHEET_URL, isDevMode, tituloNome } from '@/features/profile/profile-data';

interface DashboardFeatureProps {
  onOpenFicha: (letter: SheetKey) => void;
  onOpenPerfil: () => void;
  /** Hub de configurações do Perfil (usado pelo menu e pelo Fit ID). */
  onOpenSettings: () => void;
  /** Central de Ajuda (mesmo hub, na tela de FAQ/tutoriais). */
  onOpenHelp: () => void;
  /* v4.8.3-navbars: estado dos overlays Missões/Notícias liftado para o App
     (a drawer mobile consegue abri-los de qualquer seção) */
  overlay: 'missions' | 'news' | null;
  onOverlayChange: (v: 'missions' | 'news' | null) => void;
}

export const DashboardFeature: React.FC<DashboardFeatureProps> = ({
  onOpenFicha,
  onOpenPerfil,
  onOpenSettings,
  onOpenHelp,
  overlay,
  onOverlayChange,
}) => {
  const { exercises, sheets, history, legacy } = useLocalData();
  /* Identidade vem do profileState (fonte única pós-edição no Perfil);
     fallback ao cópia bruta do legado na primeira carga */
  const { state: profile } = useProfileState();
  const pc = profile?.customization;

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [cycleModalOpen, setCycleModalOpen] = useState(false);
  /* v4.31.1 — menu popup do Início + tela de identidade Fit ID */
  const [menuOpen, setMenuOpen] = useState(false);
  const [fitIdOpen, setFitIdOpen] = useState(false);
  /* v4.56.19 — Rankings e Mensagens abertos pelo menu do Início. */
  const [rankingsOpen, setRankingsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  /* v4.8.3-navbars: overlays Missões/Notícias controlados pelo App */
  const missionsOpen = overlay === 'missions';
  const newsOpen = overlay === 'news';
  /* Sugestão escolhida manualmente no modal; descartada quando os dados mudam */
  const [override, setOverride] = useState<{ key: string; letter: SheetKey } | null>(null);
  const [failedThumb, setFailedThumb] = useState<string | null>(null);

  /* ── Saudação contextual (v4.30.0) ────────────────────────────────
     "Bem vindo de volta," é a saudação de entrada e aparece só no 1º
     acesso do dia ao site (data marcada em localStorage). Ao sair do Início
     e voltar, o texto passa a ser o treino do dia ("Treino de hoje: FICHA X");
     se o treino de hoje já foi concluído, "Treino de hoje concluído ✓". */
  const [firstAccessToday] = useState(() => {
    try {
      return localStorage.getItem('academia_dash_greeting_date') !== today();
    } catch {
      return false;
    }
  });
  const [leftDashboard, setLeftDashboard] = useState(false);

  /* Marca o dia (escrita idempotente, fora do render). */
  useEffect(() => {
    try {
      localStorage.setItem('academia_dash_greeting_date', today());
    } catch {
      /* localStorage indisponível — segue sem marcar */
    }
  }, []);

  /* Sair do Início converte a saudação para o contexto do dia. */
  useEffect(() => {
    const onSection = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== 'dashboard') setLeftDashboard(true);
    };
    document.addEventListener('sectionchange', onSection);
    return () => document.removeEventListener('sectionchange', onSection);
  }, []);

  const dataKey = useMemo(
    () => `${history.length}|${sheets.length}|${history[0]?.date ?? ''}`,
    [history, sheets]
  );

  const derived = useMemo(() => {
    const data = { exercises, sheets, history, legacy };
    const auto = getTodayTreino(data);
    const suggestion =
      override && override.key === dataKey ? override.letter : auto;
    const sheet = sheets.find((s) => s.sheetKey === suggestion);
    const sheetExercises = pickExercises(sheet?.exerciseIds ?? [], getExerciseMap(exercises));
    const xp = getXp(history);
    const cycle = getCycleStats(data);
    const streak = getStreak(history);
    const completedToday = history.some((h) => h.date === today() && h.completed);
    return { suggestion, sheet, sheetExercises, xp, cycle, streak, completedToday };
  }, [exercises, sheets, history, legacy, override, dataKey]);

  const { suggestion, sheet, sheetExercises, xp, cycle, streak, completedToday } = derived;
  /* Linha do tempo 0–30 do ciclo atual (modal do card CICLO). */
  const cycleTimeline = useMemo(
    () => getCycleTimeline({ exercises, sheets, history, legacy }),
    [exercises, sheets, history, legacy]
  );
  const hasCardio = Boolean(sheet?.aerobic?.tipo);
  const totalItems = sheetExercises.length + (hasCardio ? 1 : 0);
  const thumb = sheetExercises.find((ex) => ex.imageUrl)?.imageUrl ?? null;
  const thumbFailed = thumb !== null && failedThumb === thumb;

  /* Texto do topo (v4.30.0): conclusão > saudação de entrada > treino do dia */
  const greetingText = completedToday
    ? 'Treino de hoje concluído ✓'
    : firstAccessToday && !leftDashboard
      ? 'Bem vindo de volta,'
      : `Treino de hoje: FICHA ${suggestion}`;
  const cycleDone = Math.min(cycle.done, cycle.total);

  const userName = pc?.nome || legacy?.profileCustomization?.nome || 'ATLETA';

  /* Emblema do avatar (#dashAvatar) — port de `applyProfileCustomization`
     (secao-customizacao.js L371-396): wrapper com blend screen (+ pulse),
     sprite ou imagem, fallback dicebear e `data-frame`. */
  const emblemPc = pc ?? legacy?.profileCustomization;
  const emblem = IDENTITY_EMBLEMS.find((e) => e.id === (emblemPc?.mainEmblem || 'prestigio-1'));
  const emblemPulsing = emblemPc?.mainEmblemPulse !== false;

  /* v4.31.1 — avatar do Fit ID: usa a imagem do emblema quando existe; sprites
     exigem recorte/crop, então caem no dicebear — igual ao card do Perfil. */
  const avatarUrl =
    emblemPc?.photo ||
    (emblem && emblem.type === 'image' && emblem.url
      ? emblem.url
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${emblemPc?.avatarSeed || 'Deceptivon'}`);
  const titulo = tituloNome(pc?.titulo ?? legacy?.profileCustomization?.titulo);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="section-slide" data-section="dashboard">
      <div className="dash-container">

        {/* ── TOPO estilo Clash Royale (v4.29.0): identidade à esquerda
            (60%) e ações + MISSÕES à direita (40%), bases alinhadas.
            A coluna esquerda inteira abre o Perfil (banner + nome/clã). ── */}
        <div className="dash-top-row">
          <div
            className="dash-top-left"
            role="button"
            tabIndex={0}
            aria-label="Abrir perfil do usuário"
            onClick={onOpenPerfil}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onOpenPerfil();
            }}
          >
            <header
              className="profile-banner dash-profile-banner-card"
              id="dashProfileCard"
              data-banner={pc?.banner || legacy?.profileCustomization?.banner || 'roxo-neon'}
            >
              <div
                className="dash-header-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, rgba(19, 19, 19, 0.05) 0%, rgba(19, 19, 19, 0.45) 100%)',
                  zIndex: 1,
                  pointerEvents: 'none',
                }}
              />

              {/* Banner do perfil (avatar/emblema) */}
              <div
                className="profile-avatar dash-profile-avatar"
                id="dashAvatar"
                data-frame={emblemPc?.avatarFrame || ''}
              >
                {emblemPc?.photo ? (
                <img
                  src={emblemPc.photo}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  referrerPolicy="no-referrer"
                />
              ) : emblem ? (
                  <div
                    className={`profile-avatar__emblem-wrapper${emblemPulsing ? ' animate-pulse' : ''}`}
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
                    {emblem.type === 'sprite' ? (
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
                        alt=""
                      />
                    ) : (
                      <img
                        src={emblem.url}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        alt=""
                      />
                    )}
                  </div>
                ) : (
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emblemPc?.avatarSeed || 'Deceptivon'}`}
                    alt="Avatar"
                  />
                )}
              </div>
            </header>

            {/* Nome colado no pé da coluna, alinhado à base da MISSÕES.
                v4.30.1: usuário sem clã não exibe nada (não há campo de clã no
                perfil ainda) — a linha "SEM CLÃ" saiu do markup. */}
            <div className="dash-identity">
              <span className="dash-identity__welcome" id="dashGreeting">
                {greetingText}
              </span>
              <h1 className="dash-identity__name" id="dashUserName">
                {userName}
              </h1>
            </div>
          </div>

          {/* Coluna direita: botões (ofensiva/notícias/menu) + MISSÕES */}
          <div className="dash-top-right">
            <div className="dash-top-btns">
              <div className="flex items-center gap-2">
                {/* v4.30.0 — substitui o antigo botão Social: mostra a OFENSIVA
                    (dias de sequência) como na referência (chama + valor). */}
                <button
                  className={`dash-header-btn dash-streak-btn${(streak === 0 || (streak > 1 && !completedToday)) ? ' dash-streak-btn--off' : ''} w-12 h-12 rounded-xl bg-surface-container-high/80 backdrop-blur border border-outline-variant/30 flex items-center justify-center transition-all`}
                  id="dashBtnOfensiva"
                  aria-label={`Ofensiva: ${streak} ${streak === 1 ? 'dia' : 'dias'}`}
                  title={`Ofensiva: ${streak} ${streak === 1 ? 'dia' : 'dias'}`}
                  onClick={stop}
                >
                  <span className="material-symbols-outlined dash-streak-btn__icon">
                    local_fire_department
                  </span>
                  <span className="dash-streak-btn__val" id="dashStreakValue">
                    {streak}
                  </span>
                </button>
                {/* Notícias — desenho de "jornal" (ícone + badge) */}
                <button
                  className="dash-header-btn dash-news-btn w-12 h-12 rounded-xl bg-surface-container-high/80 backdrop-blur border border-outline-variant/30 flex items-center justify-center transition-all relative"
                  id="dashBtnNoticias"
                  aria-label="Notícias"
                  onClick={(e) => {
                    stop(e);
                    onOverlayChange('news');
                  }}
                >
                  <span className="material-symbols-outlined">newspaper</span>
                  <span className="notification-dot absolute top-3 right-3 w-2 h-2 bg-chest-red rounded-full" />
                </button>
                <button
                  className="dash-header-btn dash-menu-btn w-12 h-12 rounded-xl bg-surface-container-high/80 backdrop-blur border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-electric-purple/20 transition-all"
                  id="dashBtnMenu"
                  aria-label="Menu"
                  onClick={(e) => {
                    stop(e);
                    setMenuOpen(true);
                  }}
                >
                  <span className="material-symbols-outlined text-[24px]">menu</span>
                </button>
              </div>
            </div>
            {/* v4.66.0 — Missões DEMO: o módulo é um jogo à parte (baús,
                moedas e coroas) sem dados reais de treino. Fica parqueado,
                acessível só no modo desenvolvedor, até ser reescrito como
                metas reais (ver RELATORIO-PENDENCIAS.md). */}
            {isDevMode() && (
              <div
                className="dash-missions"
                id="dashBtnMissoes"
                role="button"
                onClick={(e) => {
                  stop(e);
                  onOverlayChange('missions');
                }}
              >
                <div className="dash-missions-pill flex items-center bg-black/60 backdrop-blur-md rounded-full">
                  <div className="dash-missions-hexagon bg-[#d97706] hexagon flex items-center justify-center shadow-[0_0_10px_rgba(217,119,6,0.6)]">
                    <span className="material-symbols-outlined text-white">crown</span>
                  </div>
                  <div className="dash-missions-body">
                    <span className="dash-missions-val font-data-mono text-white" id="dashEmblemsValue">
                      {cycle.done}/{cycle.total}
                    </span>
                    <div className="dash-missions-progress-bar bg-surface-variant rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-prestige-gold to-[#d97706] rounded-full shadow-[0_0_8px_rgba(253,224,71,0.5)] progress-fill"
                        id="dashMissionsProgressFill"
                        style={{ width: `${cycle.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── PRÉVIA DA FICHA DO DIA (substitui o radar — v4.30.0) ──
            Mesmo desenho do seletor de treino: grid Royale 4 colunas + linha
            de aeróbico + métricas (sem o widget MAESTRIA/EMBLEMAS). Logo
            abaixo, a barra de progresso do CICLO em 30 divisões — cada treino
            concluído preenche uma. ── */}
        <div className="dash-arena-card dash-ficha-card">
          <FichaDeck
            sheet={sheet}
            exercises={sheetExercises}
            legacy={legacy}
            showMaestria={false}
            bodyRow="sheet"
          />

          <div className="dash-arena-footer">
            <button
              className="dash-arena-trophy-btn"
              id="dashBtnSeletorCrown"
              aria-label="Selecionar Ficha"
              onClick={() => setSelectorOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
              </svg>
            </button>

            <div className="dash-arena-progress-container">
              <div
                className="dash-arena-progress-track dash-cycle-segments"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={cycle.total}
                aria-valuenow={cycleDone}
                aria-label={`Ciclo: ${cycleDone} de ${cycle.total} treinos`}
                id="dashCycleSegments"
              >
                {Array.from({ length: cycle.total }, (_, i) => (
                  <span key={i} className={i < cycleDone ? 'filled' : undefined} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD DA FICHA SUGERIDA ── */}
        <div className="dash-suggested-workout-wrapper">
          <div className="dash-suggested-workout-card">
            <button className="dash-workout-exercise-card" id="dashWorkoutCard" onClick={() => setSelectorOpen(true)}>
              <div className="dash-workout-img-container">
                {thumb && !thumbFailed ? (
                  <img
                    id="dashWorkoutThumb"
                    src={thumb}
                    alt="Exercício"
                    onError={() => setFailedThumb(thumb)}
                  />
                ) : (
                  <div className="premium-placeholder">
                    <i className="fas fa-dumbbell" />
                    <span>EXERCÍCIO</span>
                  </div>
                )}
              </div>
              <div className="dash-workout-card-details">
                <span className="dash-workout-label">TREINO</span>
                <span className="dash-workout-ex-count" id="dashWkDetail">
                  {/* v4.34.0 — a LETRA do treino (A/B) mora aqui agora, na
                      mesma linha do "N ex", em cinza (era um selo roxo sobre a
                      miniatura). */}
                  <span className="dash-workout-ex-letter" id="dashWorkoutLetter">{suggestion}</span>
                  {totalItems} ex
                </span>
              </div>
              <span id="dashWorkoutName" style={{ display: 'none' }} />
              <span id="dashWkBadge" style={{ display: 'none' }} />
            </button>

            {/* startWorkoutFromDashboard (secao-dashboard.js L276-304): o botão
                TREINAR inicia o cronômetro (localStorage workout_start_time) e só
                depois abre a Ficha — ver App.handleOpenFicha */}
            <button
              className="dash-next-step-btn"
              id="dashBtnIniciar"
              onClick={() => onOpenFicha(suggestion)}
            >
              <span className="btn-text" id="dashBtnStartText">TREINAR</span>
              <span className="neon-glow-left-pill" />
              <span className="neon-glow-right-pill" />
            </button>

            <div className="dash-cycle-progress-card" onClick={() => setCycleModalOpen(true)}>
              <div className="dash-cycle-trophy-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                </svg>
              </div>
              <span className="dash-cycle-value" id="dashCycleVal">
                {cycle.done}/{cycle.total}
              </span>
              <span className="dash-cycle-label">CICLO</span>
            </div>
          </div>
        </div>

        {/* Elementos ocultos de compatibilidade (mesmos IDs do legado) */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <img id="dashAvatarImg" src="" alt="Avatar" />
          <span id="dashLiga" />
          <span id="dashUserXp">{xp}</span>
          <span id="dashLevel" />
          <div id="dashProgressSegments" />
        </div>
      </div>

      {/* Modal seletor de fichas */}
      <SheetSelectorModal
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        sheets={sheets}
        exercises={exercises}
        legacy={legacy}
        letter={suggestion}
        onLetterChange={(letter) => {
          setOverride({ key: dataKey, letter });
          setFailedThumb(null);
        }}
      />

      {/* Overlay de Missões (treino.html L903-1254) */}
      <MissionsOverlay open={missionsOpen} onClose={() => onOverlayChange(null)} />

      {/* Overlay de Notícias (treino.html L303-427) — acionado pelo #dashBtnNoticias */}
      <NewsOverlay open={newsOpen} onClose={() => onOverlayChange(null)} />

      {/* v4.31.1 — Menu popup do Início (estilo Clash Royale) + Fit ID */}
      <InicioMenuModal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenRankings={() => setRankingsOpen(true)}
        onOpenMessages={() => setMessagesOpen(true)}
        onOpenHelp={onOpenHelp}
        onOpenSettings={onOpenSettings}
        onOpenFitId={() => setFitIdOpen(true)}
        onOpenCycles={() => setCycleModalOpen(true)}
      />
      {/* v4.56.19 — interface de Rankings (menu do Início). No modo
          desenvolvedor os rankings são só o simulador; fora dele, dados reais. */}
      {isDevMode() ? (
        <RankingsSimulator open={rankingsOpen} onClose={() => setRankingsOpen(false)} />
      ) : (
        <RankingsOverlay open={rankingsOpen} onClose={() => setRankingsOpen(false)} />
      )}
      {/* v4.56.19 — caixa de Mensagens (menu do Início) */}
      <MessagesModal open={messagesOpen} onClose={() => setMessagesOpen(false)} />
      <FitIdOverlay
        open={fitIdOpen}
        onClose={() => setFitIdOpen(false)}
        name={userName}
        avatarUrl={avatarUrl}
        avatarFrame={emblemPc?.avatarFrame || ''}
        title={titulo}
        xp={xp}
        streak={streak}
        sheets={sheets}
        exercises={exercises}
        history={history}
        onOpenSettings={onOpenSettings}
      />
      {/* v4.53.0 — modal dos ciclos: lista 0–30 do ciclo atual e detalhe
          individual do treino selecionado. */}
      <CycleModal
        open={cycleModalOpen}
        onClose={() => setCycleModalOpen(false)}
        cycle={cycle}
        timeline={cycleTimeline}
        exercises={exercises}
        sheets={sheets}
      />

    </div>
  );
};
