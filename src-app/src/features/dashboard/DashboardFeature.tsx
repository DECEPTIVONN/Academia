/**
 * DashboardFeature.tsx — Tela Inicial Gamificada (Início / Dashboard)
 *
 * Port 1:1 do fragmento legado `componentes/secoes/dashboard.html` (v3.5.7):
 * header calling-card (#dashProfileCard) com avatar, botões de topo, saudação
 * e pílula de missões; arena card com radar + barra de XP; card da ficha
 * sugerida com CTA "PRÓXIMO PASSO" e card de ciclo.
 *
 * Dados ligados ao IndexedDB (useLocalData) com as fórmulas do legado:
 *   XP = dias concluídos × 10 · nível = floor(xp/100)+1
 *   sugestão = db.historico[today].treino || determineTreinoDoDia()
 *   ciclo = currentCycleStartDate/currentCycleBreakdown (cópia bruta legacyState)
 *
 * O radar é o Radar Fit real (Fase 3): buildRadarSvgHtml + side effects via
 * <RadarChart/>, modo MENSAL/TOTAL compartilhado com a Progresso (useRadarMode).
 */

import React, { useMemo, useState } from 'react';
import { useLocalData } from '@/hooks/useLocalData';
import {
  getCycleStats,
  getExerciseMap,
  getTodayTreino,
  getXp,
  pickExercises,
  type SheetKey,
} from '@/core/db/queries';
import { SheetSelectorModal } from '@/features/dashboard/SheetSelectorModal';
import { MissionsOverlay } from '@/features/dashboard/MissionsOverlay';
import { NewsOverlay } from '@/features/news/NewsOverlay';
import { useProfileState } from '@/features/profile/useProfileState';
import { IDENTITY_EMBLEMS, SPRITESHEET_URL } from '@/features/profile/profile-data';
import { RadarChart } from '@/features/gamification/RadarChart';
import { useRadarMode } from '@/features/gamification/useRadarFit';

interface DashboardFeatureProps {
  onNavigate: (section: string) => void;
  onOpenFicha: (letter: SheetKey) => void;
  onOpenPerfil: () => void;
}

export const DashboardFeature: React.FC<DashboardFeatureProps> = ({
  onNavigate,
  onOpenFicha,
  onOpenPerfil,
}) => {
  const { exercises, sheets, history, legacy } = useLocalData();
  /* Identidade vem do profileState (fonte única pós-edição no Perfil);
     fallback ao cópia bruta do legado na primeira carga */
  const { state: profile } = useProfileState();
  const pc = profile?.customization;

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  /* Modo do radar global (legado: currentRadarMode compartilhado) */
  const radarMode = useRadarMode((s) => s.mode);
  const setRadarMode = useRadarMode((s) => s.setMode);
  /* Sugestão escolhida manualmente no modal; descartada quando os dados mudam */
  const [override, setOverride] = useState<{ key: string; letter: SheetKey } | null>(null);
  const [failedThumb, setFailedThumb] = useState<string | null>(null);

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
    return { suggestion, sheet, sheetExercises, xp, cycle };
  }, [exercises, sheets, history, legacy, override, dataKey]);

  const { suggestion, sheet, sheetExercises, xp, cycle } = derived;
  const hasCardio = Boolean(sheet?.aerobic?.tipo);
  const totalItems = sheetExercises.length + (hasCardio ? 1 : 0);
  const levelProgress = xp % 100;
  const thumb = sheetExercises.find((ex) => ex.imageUrl)?.imageUrl ?? null;
  const thumbFailed = thumb !== null && failedThumb === thumb;

  const userName = pc?.nome || legacy?.profileCustomization?.nome || 'ATLETA';

  /* Emblema do avatar (#dashAvatar) — port de `applyProfileCustomization`
     (secao-customizacao.js L371-396): wrapper com blend screen (+ pulse),
     sprite ou imagem, fallback dicebear e `data-frame`. */
  const emblemPc = pc ?? legacy?.profileCustomization;
  const emblem = IDENTITY_EMBLEMS.find((e) => e.id === (emblemPc?.mainEmblem || 'prestigio-1'));
  const emblemPulsing = emblemPc?.mainEmblemPulse !== false;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="section-slide" data-section="dashboard">
      <div className="dash-container">

        {/* ── HEADER CALLING CARD (#dashProfileCard) ── */}
        <header
          className="profile-banner dash-header-calling-card dash-profile-banner-card"
          id="dashProfileCard"
          data-banner={pc?.banner || legacy?.profileCustomization?.banner || 'roxo-neon'}
          role="button"
          tabIndex={0}
          aria-label="Abrir perfil do usuário"
          onClick={onOpenPerfil}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onOpenPerfil();
          }}
        >
          <div
            className="dash-header-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(19, 19, 19, 0.1) 0%, rgba(19, 19, 19, 0.85) 100%)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />

          {/* Avatar + botões de topo */}
          <div className="flex justify-between items-start z-20 w-full mb-6">
            <div className="relative -mt-2">
              <div
                className="profile-avatar dash-profile-avatar w-28 h-28 border-2 border-prestige-gold p-1 shadow-[0_0_20px_rgba(253,224,71,0.5)] bg-surface-container-low overflow-hidden rounded-2xl"
                id="dashAvatar"
                data-frame={emblemPc?.avatarFrame || ''}
              >
                {emblem ? (
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
            </div>

            <div className="flex flex-col items-end gap-3 mt-1">
              <div className="flex items-center gap-2">
                <button
                  className="dash-header-btn w-12 h-12 rounded-xl bg-surface-container-high/80 backdrop-blur border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-electric-purple/20 transition-all"
                  id="dashBtnSocial"
                  aria-label="Social"
                  onClick={(e) => {
                    stop(e);
                    onNavigate('social');
                  }}
                >
                  <span className="material-symbols-outlined text-[24px]">person</span>
                </button>
                <button
                  className="dash-header-btn w-12 h-12 rounded-xl bg-surface-container-high/80 backdrop-blur border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-electric-purple/20 transition-all relative"
                  id="dashBtnNoticias"
                  aria-label="Notícias"
                  onClick={(e) => {
                    stop(e);
                    setNewsOpen(true);
                  }}
                >
                  <span className="material-symbols-outlined text-[24px]">calendar_today</span>
                  <span className="notification-dot absolute top-3 right-3 w-2 h-2 bg-chest-red rounded-full" />
                </button>
                <button
                  className="dash-header-btn w-12 h-12 rounded-xl bg-surface-container-high/80 backdrop-blur border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-electric-purple/20 transition-all"
                  id="dashBtnMenu"
                  aria-label="Menu"
                  onClick={stop}
                >
                  <span className="material-symbols-outlined text-[24px]">menu</span>
                </button>
              </div>
            </div>
          </div>

          {/* Saudação + pílula de missões (progresso do ciclo) */}
          <div className="flex justify-between items-end z-20 w-full mt-auto">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-label-caps text-on-surface-variant text-xs tracking-widest uppercase">
                  Bem vindo de volta,
                </span>
              </div>
              <h1
                className="font-['Rajdhani'] font-bold text-3xl text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
                id="dashUserName"
              >
                {userName}
              </h1>
            </div>

            <div
              className="flex flex-col items-end gap-1 ml-4"
              id="dashBtnMissoes"
              role="button"
              onClick={(e) => {
                stop(e);
                setMissionsOpen(true);
              }}
            >
              <div className="font-label-caps text-[9px] bg-black/70 px-2 py-0.5 rounded text-white/90 uppercase whitespace-nowrap mb-0.5 mr-0">
                Missões
              </div>
              <div className="dash-missions-pill flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full py-2 pr-5 pl-2 border border-prestige-gold/40">
                <div className="dash-missions-hexagon w-8 h-8 bg-[#d97706] hexagon flex items-center justify-center shadow-[0_0_10px_rgba(217,119,6,0.6)]">
                  <span className="material-symbols-outlined text-white text-[18px]">crown</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="dash-missions-val font-data-mono text-white text-sm" id="dashEmblemsValue">
                      {cycle.done}/{cycle.total}
                    </span>
                    <div className="dash-missions-progress-bar w-32 h-3 bg-surface-variant rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-prestige-gold to-[#d97706] w-0 rounded-full shadow-[0_0_8px_rgba(253,224,71,0.5)] progress-fill"
                        id="dashMissionsProgressFill"
                        style={{ width: `${cycle.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── ARENA CARD (radar + barra de XP) ── */}
        <div className="dash-arena-card">
          <div className="dash-arena-content">
            <div className="dash-radar-header">
              <h3>Atributos de Performance</h3>
              <div className="dash-radar-toggle">
                <button
                  className={`btn btn-sm ${radarMode === 'mensal' ? 'active' : ''}`}
                  id="btnDashRadarMensal"
                  onClick={() => setRadarMode('mensal')}
                  style={{
                    padding: '4px 12px',
                    fontSize: '.7rem',
                    borderRadius: '6px',
                    background: radarMode === 'mensal' ? 'var(--primary)' : 'transparent',
                    color: radarMode === 'mensal' ? '#000' : 'var(--text-secondary)',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: '.3s',
                  }}
                >
                  MENSAL
                </button>
                <button
                  className={`btn btn-sm ${radarMode === 'total' ? 'active' : ''}`}
                  id="btnDashRadarTotal"
                  onClick={() => setRadarMode('total')}
                  style={{
                    padding: '4px 12px',
                    fontSize: '.7rem',
                    borderRadius: '6px',
                    background: radarMode === 'total' ? 'var(--primary)' : 'transparent',
                    color: radarMode === 'total' ? '#000' : 'var(--text-secondary)',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: '.3s',
                  }}
                >
                  TOTAL
                </button>
              </div>
            </div>

            <RadarChart
              containerId="dashRadarChartContainer"
              gradientId="dashRadarGrad"
              className="dash-radar-container"
            />
          </div>

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
              <div className="dash-arena-progress-track">
                <div className="dash-arena-progress-fill progress-fill" id="dashProgressFill" style={{ width: `${Math.min(levelProgress, 100)}%` }}>
                  <div className="dash-progress-shimmer" />
                </div>
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
                <div className="dash-workout-letter-badge">
                  <span id="dashWorkoutLetter">{suggestion}</span>
                </div>
              </div>
              <div className="dash-workout-card-details">
                <span className="dash-workout-label">TREINO</span>
                <span className="dash-workout-ex-count" id="dashWkDetail">
                  {totalItems} ex
                </span>
              </div>
              <span id="dashWorkoutName" style={{ display: 'none' }} />
              <span id="dashWkBadge" style={{ display: 'none' }} />
            </button>

            {/* startWorkoutFromDashboard (secao-dashboard.js L276-304): o PRÓXIMO
                PASSO inicia o cronômetro (localStorage workout_start_time) e só
                depois abre a Ficha — ver App.handleOpenFicha */}
            <button
              className="dash-next-step-btn"
              id="dashBtnIniciar"
              onClick={() => onOpenFicha(suggestion)}
            >
              <span className="btn-text" id="dashBtnStartText">PRÓXIMO PASSO</span>
              <span className="neon-glow-left-pill" />
              <span className="neon-glow-right-pill" />
            </button>

            <div className="dash-cycle-progress-card" onClick={() => onNavigate('progresso')}>
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
      <MissionsOverlay open={missionsOpen} onClose={() => setMissionsOpen(false)} />

      {/* Overlay de Notícias (treino.html L303-427) — acionado pelo #dashBtnNoticias */}
      <NewsOverlay open={newsOpen} onClose={() => setNewsOpen(false)} />
    </div>
  );
};
