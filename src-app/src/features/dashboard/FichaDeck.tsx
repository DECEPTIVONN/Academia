/**
 * FichaDeck.tsx — Corpo compartilhado do "deck" Royale de uma ficha.
 *
 * Extraído do SheetSelectorModal (v4.30.0) para ser reutilizado na PRÉVIA DA
 * FICHA DO DIA no Início, garantindo que as duas telas mostrem exatamente o
 * mesmo desenho: grid de 4 colunas (deck-card) + linha de aeróbico + rodapé de
 * métricas (volume médio / maestria / cardio).
 *
 * A prévia do Início esconde o widget MAESTRIA/EMBLEMAS via `showMaestria`.
 */

import React, { useId, useMemo } from 'react';
import type { Exercise, WorkoutSheet } from '@/core/db/schema';
import type { LegacyRaw } from '@/core/db/queries';

/** Cartão de exercício no grid Royale (mesmo HTML do legado). */
export const DeckCard: React.FC<{ exercise: Exercise; index: number }> = ({ exercise, index }) => (
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

interface FichaDeckProps {
  /** Ficha renderizada (define o aeróbico). */
  sheet?: WorkoutSheet;
  /** Exercícios já resolvidos (na ordem da ficha). */
  exercises: Exercise[];
  legacy: LegacyRaw | null;
  /** `false` esconde o widget MAESTRIA/EMBLEMAS (usado na prévia do Início). */
  showMaestria?: boolean;
  /** 1º widget do rodapé: `volume` (padrão, modal) ou `sheet` (letra da
   *  ficha — "TREINO A" — usado na prévia do Início, v4.30.1). */
  firstStat?: 'volume' | 'sheet';
  emptyMessage?: React.ReactNode;
}

export const FichaDeck: React.FC<FichaDeckProps> = ({
  sheet,
  exercises,
  legacy,
  showMaestria = true,
  firstStat = 'volume',
  emptyMessage,
}) => {
  /* ids de gradiente únicos: o mesmo componente pode estar montado 2x na
     página (modal + prévia) — ids duplicados no SVG são inválidos. */
  const uid = useId().replace(/:/g, '');
  const elixirId = `elixirGrad-${uid}`;

  const hasCardio = Boolean(sheet?.aerobic?.tipo);
  const total = exercises.length + (hasCardio ? 1 : 0);

  /* Rodapé: volume médio (carga × séries × reps ÷ 1000) — igual ao legado */
  const volumeAvg = useMemo(() => {
    if (exercises.length === 0) return '0.0';
    const totalVol = exercises.reduce((sum, ex) => {
      const carga = parseFloat(String(ex.load).replace(',', '.')) || 0;
      return sum + carga * ex.sets * (parseInt(ex.reps, 10) || 0);
    }, 0);
    return (totalVol / exercises.length / 1000).toFixed(1);
  }, [exercises]);

  /* Rodapé: maestria (nível ≥ 3 na maestria legada) */
  const mastered = useMemo(() => {
    const maestrias = legacy?.maestrias ?? {};
    return exercises.filter((ex) => (maestrias[ex.id]?.nivel ?? 0) >= 3).length;
  }, [exercises, legacy]);

  return (
    <>
      {/* Body: grid Royale de 4 colunas */}
      <div className="dash-mini-deck__body">
        {total === 0 ? (
          <div className="dash-mini-deck__empty">
            {emptyMessage ?? (
              <>
                Nenhuma ficha pronta ainda.
                <br />
                Monte um treino na aba <b>Treinos</b>.
              </>
            )}
          </div>
        ) : (
          <>
            <div className="dash-mini-deck__grid">
              {exercises.map((ex, index) => (
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

      {/* Footer: ficha (ou volume) / maestria / cardio */}
      <div className="dash-mini-deck__footer">
        <div className="dash-mini-deck__stat-container">
          <div className="dash-mini-deck__stat-widget">
            {firstStat === 'sheet' ? (
              <>
                {/* v4.30.1 — na prévia do Início o 1º widget mostra a LETRA da
                    ficha do dia em vez do volume médio de carga. */}
                <svg
                  className="dash-mini-deck__stat-icon sheet"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                  width={22}
                  height={22}
                >
                  <path d="M12 2l8 3v6c0 5-3.4 8.4-8 11-4.6-2.6-8-6-8-11V5l8-3z" />
                  <path d="M12 6.5v10" strokeWidth="1.6" />
                </svg>
                <span className="dash-mini-deck__stat-val">TREINO {sheet?.sheetKey ?? '—'}</span>
              </>
            ) : (
              <>
                <svg className="dash-mini-deck__stat-icon elixir" viewBox="0 0 24 24" fill={`url(#${elixirId})`} width={22} height={22}>
                  <defs>
                    <linearGradient id={elixirId} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <path d="M12 21a6 6 0 006-6c0-4-6-11-6-11s-6 7-6 11a6 6 0 006 6z" />
                </svg>
                <span className="dash-mini-deck__stat-val">{volumeAvg}</span>
              </>
            )}
          </div>
          <span className="dash-mini-deck__stat-label">
            {firstStat === 'sheet' ? 'FICHA DO DIA' : 'VOLUME MÉDIO DE CARGA'}
          </span>
        </div>

        {showMaestria && (
          <div className="dash-mini-deck__stat-container">
            <div className="dash-mini-deck__stat-widget">
              <svg className="dash-mini-deck__stat-icon star" viewBox="0 0 24 24" fill="#fbbf24" width={22} height={22}>
                <path d="M12 2l3.09 6.26 6.91.97-5 4.89 1.18 6.88L12 17.77l-6.18 3.25L7 14.12 2 9.23l6.91-.97L12 2z" />
              </svg>
              <div className="dash-mini-deck__widget-text">
                <span className="dash-mini-deck__stat-val" style={{ color: '#fbbf24' }}>
                  {mastered}/{exercises.length}
                </span>
                <span className="dash-mini-deck__stat-sub">EMBLEMAS</span>
              </div>
            </div>
            <span className="dash-mini-deck__stat-label">MAESTRIA</span>
          </div>
        )}

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
              <span className="dash-mini-deck__stat-val">
                {hasCardio ? sheet!.aerobic!.tipo.toUpperCase() : '--'}
              </span>
              <span className="dash-mini-deck__stat-sub">
                {hasCardio
                  ? `${sheet!.aerobic!.vel || '--'} km/h · ${sheet!.aerobic!.tempo || '--'} min`
                  : 'Configurar Cardio'}
              </span>
            </div>
          </div>
          <span className="dash-mini-deck__stat-label">CARDIO CONFIGURADO</span>
        </div>
      </div>
    </>
  );
};

export default FichaDeck;
