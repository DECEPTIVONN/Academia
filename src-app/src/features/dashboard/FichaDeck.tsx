/**
 * FichaDeck.tsx — Corpo compartilhado do "deck" Royale de uma ficha.
 *
 * Extraído do SheetSelectorModal (v4.30.0) para ser reutilizado na PRÉVIA DA
 * FICHA DO DIA no Início, garantindo que as duas telas mostrem exatamente o
 * mesmo desenho: grid de 4 colunas (deck-card) + linha de aeróbico + rodapé de
 * métricas (volume médio / maestria / cardio).
 *
 * A prévia do Início esconde o widget MAESTRIA/EMBLEMAS via `showMaestria` e,
 * via `bodyRow='sheet'` (v4.31.1), troca a linha verde de cardio pelo NOME da
 * ficha do dia ("TREINO A · FICHA DO DIA") — desde a v4.32.0 essa linha fica
 * ACIMA do grid (nome do treino no topo da prévia, pedido do usuário).
 * O rodapé segue idêntico ao do modal: volume médio de carga + cardio.
 */

import React, { useMemo } from 'react';
import type { Exercise, WorkoutSheet } from '@/core/db/schema';
import { effectiveAerobic } from '@/core/db/schema';
import type { LegacyRaw } from '@/core/db/queries';
import { averageLoadKg } from '@/lib/suggested-load';
import { VolumeKgIcon } from '@/components/VolumeKgIcon';

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
  /** Linha do CORPO abaixo do grid: `cardio` (padrão, modal seletor) ou
   *  `sheet` (nome do treino — "TREINO A" — usado na prévia do Início,
   *  v4.31.1: o antigo destaque verde de cardio dá lugar ao nome do treino). */
  bodyRow?: 'cardio' | 'sheet';
  emptyMessage?: React.ReactNode;
}

export const FichaDeck: React.FC<FichaDeckProps> = ({
  sheet,
  exercises,
  legacy,
  showMaestria = true,
  bodyRow = 'cardio',
  emptyMessage,
}) => {
  /* v4.31.0 — todo treino tem cardio POR PADRÃO (10 min de esteira a 3 km/h):
     quando a ficha não tem aeróbico configurado usamos `DEFAULT_AEROBIC`. Uma
     ficha sem nenhum exercício continua exibindo o estado vazio. */
  const cardio = effectiveAerobic(sheet?.aerobic);
  const hasCardio = exercises.length > 0 || Boolean(sheet?.aerobic?.tipo);
  const total = exercises.length + (hasCardio ? 1 : 0);

  /* Rodapé: VOLUME MÉDIO DE CARGA (v4.32.0) — média das cargas EFETIVAS dos
     exercícios: a carga SALVA no campo `load` e, quando ele ainda está vazio,
     a carga SUGERIDA pelo nome/grupo muscular (v4.31.0). Antes o cálculo lia
     só o campo salvo — que o seed nunca preenche — e o widget mostrava 0.0.
     Mesma métrica/formatação do rodapé do "Minha Ficha" (computeDeckStats). */
  const volumeAvg = useMemo(() => {
    if (exercises.length === 0) return '0.0';
    return averageLoadKg(exercises).toFixed(1);
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
            {bodyRow === 'sheet' && (
              /* v4.31.1 — na PRÉVIA do Início a linha do cardio vira a
                 identificação da ficha do dia ("TREINO A · FICHA DO DIA"), no
                 acento do tema. v4.32.0: essa linha subiu para ANTES do grid —
                 o nome do treino abre a prévia (pedido do usuário). */
              <div className="dash-mini-deck__sheet-row dash-mini-deck__sheet-row--head">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  width={16}
                  height={16}
                >
                  <path d="M12 2l8 3v6c0 5-3.4 8.4-8 11-4.6-2.6-8-6-8-11V5l8-3z" />
                  <path d="M12 6.5v10" strokeWidth="1.6" />
                </svg>
                <span>TREINO {sheet?.sheetKey ?? '—'}</span>
                <span className="dash-mini-deck__sheet-row-tag">FICHA DO DIA</span>
              </div>
            )}
            <div className="dash-mini-deck__grid">
              {exercises.map((ex, index) => (
                <DeckCard key={ex.id} exercise={ex} index={index} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer: volume médio / maestria / cardio */}
      <div className="dash-mini-deck__footer">
        <div className="dash-mini-deck__stat-container">
          <div className="dash-mini-deck__stat-widget">
            {/* v4.32.0 — ícone "prato de peso KG" (imagem de referência do
                usuário) no lugar do elixir rosa. */}
            <VolumeKgIcon className="dash-mini-deck__stat-icon kg" size={22} />
            <span className="dash-mini-deck__stat-val">{volumeAvg}</span>
          </div>
          <span className="dash-mini-deck__stat-label">VOLUME MÉDIO DE CARGA</span>
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
              stroke="currentColor"
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
                {hasCardio ? cardio.tipo.toUpperCase() : '--'}
              </span>
              <span className="dash-mini-deck__stat-sub">
                {hasCardio
                  ? `${cardio.vel || '--'} km/h · ${cardio.tempo || '--'} min`
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
