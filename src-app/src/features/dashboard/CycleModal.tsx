/**
 * CycleModal.tsx — modal do card CICLO do Início.
 *
 * Exibe TODOS os ciclos de treino da ficha ativa no ciclo atual (0 a 30):
 *   • 0     → abertura do ciclo;
 *   • 1..30 → cada treino concluído (letra + data + duração);
 *   • vazios → treinos ainda por realizar.
 *
 * Ao clicar em um item, o modal troca para o CICLO INDIVIDUAL selecionado
 * (data, ficha, duração e exercícios concluídos). A lista e o detalhe são o
 * mesmo painel; a troca usa a animação `cycle-view-in`.
 *
 * Entrada/saída: `useModalPresence` mantém o modal montado durante o fade de
 * saída (`is-closing`), com a mesma duração do modal-motion.css.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Exercise, WorkoutSheet } from '@/core/db/schema';
import type { CycleTimelineItem } from '@/core/db/queries';
import { MODAL_EXIT_MS, useModalPresence } from '@/hooks/useModalPresence';
import './cycle-modal.css';

interface CycleStats {
  done: number;
  total: number;
  percent: number;
  breakdown: Record<string, number>;
  startDate: string;
}

interface CycleModalProps {
  open: boolean;
  onClose: () => void;
  cycle: CycleStats;
  timeline: CycleTimelineItem[];
  exercises: Exercise[];
  sheets: WorkoutSheet[];
}

const ChevronLeft = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const CloseIco = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="17" height="17" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CalendarIco = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIco = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 14" />
  </svg>
);

const CheckIco = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TrophyIco = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

function toDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

function shortDate(date: string | null): string {
  if (!date) return 'Sem data';
  return toDate(date).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function longDate(date: string | null): string {
  if (!date) return 'Ainda não realizado';
  return toDate(date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export const CycleModal: React.FC<CycleModalProps> = ({
  open,
  onClose,
  cycle,
  timeline,
  exercises,
  sheets,
}) => {
  const { mounted, closing } = useModalPresence(open);
  const [selected, setSelected] = useState<number | null>(null);

  /* Fecha mantendo o detalhe na tela durante a animação e só volta para a
     lista quando o modal termina de sair (reabrir sempre cai na lista). */
  const handleClose = useCallback(() => {
    const detailOpen = selected !== null;
    onClose();
    if (detailOpen) {
      window.setTimeout(() => setSelected(null), MODAL_EXIT_MS);
    }
  }, [onClose, selected]);

  /* Bloqueia o scroll do body e fecha com Esc. */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selected !== null) setSelected(null);
      else handleClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, selected, handleClose]);

  const exerciseMap = useMemo(
    () => new Map(exercises.map((ex) => [ex.id, ex])),
    [exercises]
  );
  const sheetMap = useMemo(
    () => new Map(sheets.map((sheet) => [sheet.sheetKey, sheet])),
    [sheets]
  );

  if (!mounted) return null;

  const item = selected !== null ? timeline.find((i) => i.index === selected) ?? null : null;
  const detailExercises = item
    ? (item.checks.length > 0
        ? item.checks
        : item.sheetKey
          ? (sheetMap.get(item.sheetKey)?.exerciseIds ?? [])
          : []
      )
        .map((id) => exerciseMap.get(id))
        .filter((ex): ex is Exercise => Boolean(ex))
    : [];
  const detailChecks = new Set(item?.checks ?? []);

  return createPortal(
    <div
      className={`cycle-modal${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Ciclos de treino"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="cycle-modal__panel">
        <header className="cycle-modal__head">
          {item ? (
            <button
              type="button"
              className="cycle-modal__icon-btn"
              onClick={() => setSelected(null)}
              aria-label="Voltar para todos os ciclos"
            >
              {ChevronLeft}
            </button>
          ) : (
            <span className="cycle-modal__head-icon" aria-hidden="true">
              {TrophyIco}
            </span>
          )}

          <div className="cycle-modal__head-copy">
            <h2 className="cycle-modal__title">
              {item
                ? item.status === 'start'
                  ? 'Início do Ciclo'
                  : `Ciclo ${String(item.index).padStart(2, '0')}`
                : 'Ciclos de Treino'}
            </h2>
            <p className="cycle-modal__subtitle">
              {item ? longDate(item.date) : `${cycle.done} de ${cycle.total} treinos concluídos`}
            </p>
          </div>

          <button
            type="button"
            className="cycle-modal__icon-btn"
            onClick={handleClose}
            aria-label="Fechar"
          >
            {CloseIco}
          </button>
        </header>

        {item ? (
          <div className="cycle-modal__view cycle-modal__detail" key={`detail-${item.index}`}>
            <div className={`cycle-modal__hero cycle-modal__hero--${item.status}`}>
              <span className="cycle-modal__hero-index">
                {item.status === 'start' ? '0' : String(item.index).padStart(2, '0')}
              </span>
              <span className="cycle-modal__hero-label">
                {item.status === 'start'
                  ? 'ABERTURA DO CICLO'
                  : item.status === 'done'
                    ? 'TREINO CONCLUÍDO'
                    : 'TREINO A REALIZAR'}
              </span>
            </div>

            <div className="cycle-modal__meta">
              <div className="cycle-modal__meta-card">
                <span className="cycle-modal__meta-label">{CalendarIco} DATA</span>
                <strong>{shortDate(item.date)}</strong>
              </div>
              <div className="cycle-modal__meta-card">
                <span className="cycle-modal__meta-label">{TrophyIco} FICHA</span>
                <strong>{item.sheetKey ? `TREINO ${item.sheetKey}` : '—'}</strong>
              </div>
              <div className="cycle-modal__meta-card">
                <span className="cycle-modal__meta-label">{ClockIco} DURAÇÃO</span>
                <strong>{item.durationMin ? `${item.durationMin} min` : '—'}</strong>
              </div>
              <div className="cycle-modal__meta-card">
                <span className="cycle-modal__meta-label">{CheckIco} EXERCÍCIOS</span>
                <strong>{detailExercises.length || '—'}</strong>
              </div>
            </div>

            {item.status === 'start' ? (
              <p className="cycle-modal__empty">
                Este é o marco zero do ciclo atual. A partir daqui contam os 30 treinos
                que completam a barra de progresso do Início.
              </p>
            ) : item.status === 'pending' ? (
              <p className="cycle-modal__empty">
                Este treino do ciclo ainda não foi concluído. Ele será preenchido
                automaticamente quando você finalizar a próxima ficha.
              </p>
            ) : detailExercises.length > 0 ? (
              <ul className="cycle-modal__exercises">
                {detailExercises.map((ex) => (
                  <li
                    className={`cycle-modal__exercise${detailChecks.has(ex.id) ? ' is-done' : ''}`}
                    key={ex.id}
                  >
                    <span className="cycle-modal__exercise-check">
                      {detailChecks.has(ex.id) ? CheckIco : null}
                    </span>
                    <span className="cycle-modal__exercise-name">{ex.name}</span>
                    <span className="cycle-modal__exercise-meta">
                      {ex.sets} × {ex.reps}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cycle-modal__empty">
                Nenhum exercício registrado neste treino.
              </p>
            )}
          </div>
        ) : (
          <div className="cycle-modal__view cycle-modal__list" key="list">
            <div className="cycle-modal__progress">
              <div className="cycle-modal__progress-head">
                <span>CICLO ATUAL</span>
                <strong>
                  {cycle.done}/{cycle.total}
                </strong>
              </div>
              <div className="cycle-modal__progress-track">
                <div
                  className="cycle-modal__progress-fill"
                  style={{ width: `${cycle.percent}%` }}
                />
              </div>
              <div className="cycle-modal__breakdown">
                {Object.entries(cycle.breakdown)
                  .filter(([, count]) => count > 0)
                  .map(([key, count]) => (
                    <span className="cycle-modal__breakdown-pill" key={key}>
                      {key} · {count}
                    </span>
                  ))}
              </div>
            </div>

            <ul className="cycle-modal__items">
              {timeline.map((entry) => (
                <li key={entry.index}>
                  <button
                    type="button"
                    className={`cycle-modal__item cycle-modal__item--${entry.status}`}
                    onClick={() => setSelected(entry.index)}
                    aria-label={`Abrir ciclo ${entry.index}`}
                  >
                    <span className="cycle-modal__item-index">
                      {entry.status === 'start' ? '0' : String(entry.index).padStart(2, '0')}
                    </span>
                    <span className="cycle-modal__item-copy">
                      <strong>
                        {entry.status === 'start'
                          ? 'Início do Ciclo'
                          : entry.status === 'done'
                            ? `Treino ${entry.sheetKey}`
                            : 'Treino a realizar'}
                      </strong>
                      <span>{shortDate(entry.date)}</span>
                    </span>
                    {entry.status === 'done' && (
                      <span className="cycle-modal__item-tag is-done">{CheckIco}</span>
                    )}
                    {entry.status === 'start' && (
                      <span className="cycle-modal__item-tag is-start">INÍCIO</span>
                    )}
                    {entry.status === 'pending' && (
                      <span className="cycle-modal__item-tag is-pending">—</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default CycleModal;
