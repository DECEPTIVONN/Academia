/**
 * SheetSelectorModal.tsx — Modal seletor de fichas (#modalSeletorFichas)
 * Port 1:1 de componentes/secoes/modais.html (L253-348) + renderDashboardSheet()
 * (JS/treino/secao-dashboard.js): abas Royale A–J, grid 4 colunas de deck-cards,
 * row de aeróbico e footer de métricas (volume / maestria / cardio).
 *
 * v4.30.0: o corpo (grid + aeróbico + rodapé de métricas) saiu para o
 * componente compartilhado `FichaDeck`, reutilizado pela prévia do Início.
 *
 * Nota de paridade: no legado, clicar numa aba regrava a sugestão do dia
 * (db.dashboard.suggestedWorkout + setTodayTreino); aqui a troca é informada
 * via onLetterChange e aplicada pelo DashboardFeature.
 */

import React, { useMemo } from 'react';
import type { Exercise, SheetKey, WorkoutSheet } from '@/core/db/schema';
import { compactIds, SHEET_ORDER, type LegacyRaw } from '@/core/db/queries';
import { FichaDeck } from '@/features/dashboard/FichaDeck';
import { useModalPresence } from '@/hooks/useModalPresence';

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
  /* v4.53.0 — mantém o modal montado durante o fade de saída. */
  const { mounted, closing } = useModalPresence(open);

  const exerciseMap = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises]
  );

  /** Espelha getAvailableWorkouts: fichas com exercícios OU aeróbico. */
  const available = useMemo(
    () =>
      SHEET_ORDER.filter((letter) => {
        const sheet = sheets.find((s) => s.sheetKey === letter);
        return compactIds(sheet?.exerciseIds).length > 0 || Boolean(sheet?.aerobic?.tipo);
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

  const selectTab = (next: SheetKey) => {
    onLetterChange?.(next);
  };

  const cycleWorkout = () => {
    if (available.length === 0) return;
    const idx = available.indexOf(activeLetter);
    const next = available[(idx + 1) % available.length];
    selectTab(next);
  };

  if (!mounted) return null;

  return (
    <div
      className={`modal-overlay${closing ? ' is-closing' : ''}`}
      id="modalSeletorFichas"
      style={{ display: 'flex' }}
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('modal-overlay')) onClose();
      }}
      aria-hidden={closing}
    >
      <div className="dash-mini-deck">
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

        {/* Corpo + rodapé de métricas (grid Royale, linha de aeróbico, stats) */}
        <FichaDeck sheet={sheet} exercises={sheetExercises} legacy={legacy} />
      </div>
    </div>
  );
};

export default SheetSelectorModal;
