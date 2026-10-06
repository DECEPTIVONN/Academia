/**
 * SheetSelectorModal.tsx — Modal seletor de fichas (#modalSeletorFichas)
 * Port 1:1 de componentes/secoes/modais.html (L253-348) + renderDashboardSheet()
 * (JS/treino/secao-dashboard.js): abas Royale A–J, grid 4 colunas de deck-cards,
 * row de aeróbico e footer de métricas (volume / maestria / cardio).
 *
 * Nota de paridade: no legado, clicar numa aba regrava a sugestão do dia
 * (db.dashboard.suggestedWorkout + setTodayTreino); aqui a troca é informada
 * via onLetterChange e aplicada pelo DashboardFeature.
 */

import React, { useMemo } from 'react';
import type { Exercise, SheetKey, WorkoutSheet } from '@/core/db/schema';
import { SHEET_ORDER, type LegacyRaw } from '@/core/db/queries';

interface SheetSelectorModalProps {
  open: boolean;
  onClose: () => void;
  sheets: WorkoutSheet[];
  exercises: Exercise[];
  legacy: LegacyRaw | null;
  /** Ficha ativa (controlada pelo DashboardFeature, que deriva a sugestão do dia). */
  letter: SheetKey;
  onLetterChange?: (letter: SheetKey) => void;
}

/** Cartão de exercício no grid Royale (mesmo HTML do legado). */
const DeckCard: React.FC<{ exercise: Exercise; index: number }> = ({ exercise, index }) => (
  <div
    className={`deck-card card-${exercise.muscleGroup} stagger-item`}
    data-id={exercise.id}
    style={{ ['--item-index' as string]: index }}
  >
    <div className="deck-card-header">{exercise.muscleGroup}</div>
    <div className="deck-card-img" style={exercise.imageUrl ? undefined : { background: 'transparent' }}>
      {exercise.imageUrl ? (
        <img
          src={exercise.imageUrl}
          alt={exercise.name}
          onError={(e) => {
            // Fallback idêntico ao legado: premium-placeholder
            const parent = e.currentTarget.parentElement;
            if (!parent) return;
            e.currentTarget.remove();
            const ph = document.createElement('div');
            ph.className = 'premium-placeholder';
            ph.innerHTML = '<i className="fas fa-dumbbell"></i><span>EXERCÍCIO</span>';
            parent.appendChild(ph);
          }}
        />
      ) : (
        <div className="premium-placeholder">
          <i className="fas fa-dumbbell" />
          <span>EXERCÍCIO</span>
        </div>
      )}
    </div>
    <div className="deck-card-info">
      <div className="deck-card-name">{exercise.name}</div>
      <div className="deck-card-level">
        Séries: {exercise.sets} × {exercise.reps}
      </div>
    </div>
  </div>
);

export const SheetSelectorModal: React.FC<SheetSelectorModalProps> = ({
  open,
  onClose,
  sheets,
  exercises,
  legacy,
  letter,
  onLetterChange,
}) => {
  const activeLetter = letter;

  const exerciseMap = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises]
  );

  /** Espelha getAvailableWorkouts: fichas com exercícios OU aeróbico. */
  const available = useMemo(
    () =>
      SHEET_ORDER.filter((letter) => {
        const sheet = sheets.find((s) => s.sheetKey === letter);
        return (sheet?.exerciseIds?.length ?? 0) > 0 || Boolean(sheet?.aerobic?.tipo);
      }),
    [sheets]
  );

  const sheet = sheets.find((s) => s.sheetKey === activeLetter);
  const sheetExercises = useMemo(
    () =>
      (sheet?.exerciseIds ?? [])
        .map((id) => exerciseMap.get(id))
        .filter((e): e is Exercise => Boolean(e)),
    [sheet, exerciseMap]
  );
  const hasCardio = Boolean(sheet?.aerobic?.tipo);
  const total = sheetExercises.length + (hasCardio ? 1 : 0);

  /* Footer: volume médio (carga × séries × reps ÷ 1000) — igual ao legado */
  const volumeAvg = useMemo(() => {
    if (sheetExercises.length === 0) return '0.0';
    const totalVol = sheetExercises.reduce((sum, ex) => {
      const carga = parseFloat(String(ex.load).replace(',', '.')) || 0;
      return sum + carga * ex.sets * (parseInt(ex.reps, 10) || 0);
    }, 0);
    return (totalVol / sheetExercises.length / 1000).toFixed(1);
  }, [sheetExercises]);

  /* Footer: maestria (nível ≥ 3 na maestria legada) */
  const mastered = useMemo(() => {
    const maestrias = legacy?.maestrias ?? {};
    return sheetExercises.filter((ex) => (maestrias[ex.id]?.nivel ?? 0) >= 3).length;
  }, [sheetExercises, legacy]);

  const selectTab = (next: SheetKey) => {
    onLetterChange?.(next);
  };

  const cycleWorkout = () => {
    if (available.length === 0) return;
    const idx = available.indexOf(activeLetter);
    const next = available[(idx + 1) % available.length];
    selectTab(next);
  };

  return (
    <div
      className="modal-overlay"
      id="modalSeletorFichas"
      style={{ display: open ? 'flex' : 'none' }}
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('modal-overlay')) onClose();
      }}
      aria-hidden={!open}
    >
      <div className="dash-mini-deck">
        <button className="modal-close-btn dash-mini-deck__close" id="btnFecharSeletorFichas" aria-label="Fechar" onClick={onClose}>
          ✕
        </button>

        {/* Header: menu + abas A–J + swap + view toggle */}
        <div className="dash-mini-deck__header">
          <button className="dash-mini-deck__menu-btn" id="dashMiniMenuBtn" title="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width={18} height={18}>
              <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
              <line x1="4" y1="6" x2="20" y2="6" strokeLinecap="round" />
              <line x1="4" y1="18" x2="20" y2="18" strokeLinecap="round" />
            </svg>
          </button>

          <div className="dash-mini-deck__tabs" id="dashSheetTabs">
            {available.map((letter) =>
              letter === activeLetter ? (
                <button key={letter} className="dash-mini-deck__tab active" data-workout={letter} onClick={() => selectTab(letter)}>
                  <svg className="dash-mini-deck__tab-shield" viewBox="0 0 100 115">
                    <path
                      d="M 15 8 L 85 8 L 85 62 L 50 105 L 15 62 Z"
                      fill="rgba(139, 92, 246, 0.18)"
                      stroke="#8b5cf6"
                      strokeWidth="6"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="dash-mini-deck__tab-letter">{letter}</span>
                </button>
              ) : (
                <button key={letter} className="dash-mini-deck__tab" data-workout={letter} onClick={() => selectTab(letter)}>
                  {letter}
                </button>
              )
            )}
          </div>

          <button className="dash-mini-deck__swap-btn" id="dashMiniSwapBtn" title="Alternar Ficha" onClick={cycleWorkout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width={18} height={18}>
              <path d="M4 8h16M16 4l4 4-4 4M20 16H4M8 12l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="dash-mini-deck__view-toggle">
            <button className="dash-mini-deck__view-btn active" id="dashMiniViewGrid" title="Grid View">
              <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </button>
            <button className="dash-mini-deck__view-btn" id="dashMiniViewList" title="List View">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width={18} height={18}>
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body: grid Royale de 4 colunas */}
        <div className="dash-mini-deck__body" id="dashSheetBody">
          {total === 0 ? (
            <div className="dash-mini-deck__empty">
              Nenhuma ficha pronta ainda.
              <br />
              Monte um treino na aba <b>Treinos</b>.
            </div>
          ) : (
            <>
              <div className="dash-mini-deck__grid">
                {sheetExercises.map((ex, index) => (
                  <DeckCard key={ex.id} exercise={ex} index={index} />
                ))}
              </div>
              {hasCardio && (
                <div className="dash-mini-deck__cardio-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <span>{sheet?.aerobic?.tipo || 'Aeróbico'} configurado</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer: volume / maestria / cardio */}
        <div className="dash-mini-deck__footer" id="dashSheetFooter">
          <div className="dash-mini-deck__stat-container">
            <div className="dash-mini-deck__stat-widget">
              <svg className="dash-mini-deck__stat-icon elixir" viewBox="0 0 24 24" fill="url(#elixirGrad)" width={22} height={22}>
                <defs>
                  <linearGradient id="elixirGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <path d="M12 21a6 6 0 006-6c0-4-6-11-6-11s-6 7-6 11a6 6 0 006 6z" />
              </svg>
              <span className="dash-mini-deck__stat-val" id="dashMiniVolume">
                {volumeAvg}
              </span>
            </div>
            <span className="dash-mini-deck__stat-label">VOLUME MÉDIO DE CARGA</span>
          </div>

          <div className="dash-mini-deck__stat-container">
            <div className="dash-mini-deck__stat-widget">
              <svg className="dash-mini-deck__stat-icon star" viewBox="0 0 24 24" fill="#fbbf24" width={22} height={22}>
                <path d="M12 2l3.09 6.26 6.91.97-5 4.89 1.18 6.88L12 17.77l-6.18 3.25L7 14.12 2 9.23l6.91-.97L12 2z" />
              </svg>
              <div className="dash-mini-deck__widget-text">
                <span className="dash-mini-deck__stat-val" style={{ color: '#fbbf24' }} id="dashMiniMaestria">
                  {mastered}/{sheetExercises.length}
                </span>
                <span className="dash-mini-deck__stat-sub">EMBLEMAS</span>
              </div>
            </div>
            <span className="dash-mini-deck__stat-label">MAESTRIA</span>
          </div>

          <div className="dash-mini-deck__stat-container">
            <div className="dash-mini-deck__stat-widget">
              <svg
                className="dash-mini-deck__stat-icon pulse"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a855f7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                width={22}
                height={22}
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <div className="dash-mini-deck__widget-text">
                <span className="dash-mini-deck__stat-val" id="dashMiniCardio">
                  {hasCardio ? sheet!.aerobic!.tipo.toUpperCase() : '--'}
                </span>
                <span className="dash-mini-deck__stat-sub" id="dashMiniCardioSub">
                  {hasCardio
                    ? `${sheet!.aerobic!.vel || '--'} km/h · ${sheet!.aerobic!.tempo || '--'} min`
                    : 'Configurar Cardio'}
                </span>
              </div>
            </div>
            <span className="dash-mini-deck__stat-label">CARDIO CONFIGURADO</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetSelectorModal;
