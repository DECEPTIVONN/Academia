/**
 * FocusModal.tsx — Modo Foco fullscreen (Fase 3)
 *
 * Port 1:1 do DOM `componentes/secoes/modais.html` L410-462 e da lógica
 * `startFocusMode`/`updateFocusUI`/`focusCheck` (`JS/treino/secao-ficha.js`
 * L754-923): snapshot da ficha ao abrir, navegação por exercício, botões de
 * série, descanso de 60s, auto-avanço com 1.5s e conclusão atômica do dia
 * (treinos[] + concluido + duracaoFoco) fechando o modal + showConclusao.
 *
 * O início (`sessionStorage['focusStartTime']` + validação de ficha vazia) é
 * feito no FAB `#btnStartFocus` de FichaFeature (legado: startFocusMode L759).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalData } from '@/hooks/useLocalData';
import { useWorkoutStore } from '@/store/workout-store';
import { useTodayEntryStore } from '@/store/today-entry-store';
import type { Exercise, WorkoutHistory } from '@/core/db/schema';
import { getSuggestedLoadIfMissing } from '@/lib/suggested-load';
import {
  formatCarga,
  getExerciseMap,
  getTodayTreino,
  grupoBadgeClass,
  toggleCheckEntry,
  toggleSetEntry,
  type FichaMutation,
} from '@/core/db/queries';
import { showToast } from '@/lib/toast';

interface FocusModalProps {
  open: boolean;
  /** btnCloseFocus (app.js L162): closeModal('modalFocus'). */
  onClose: () => void;
  /** Fecha o modal + showConclusao após 1.5s (focusCheck L910-915). */
  onCompleted: () => void;
}

function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, '0');
}

export function FocusModal({ open, onClose, onCompleted }: FocusModalProps) {
  const { exercises, sheets, history, legacy } = useLocalData();
  const entry = useTodayEntryStore((s) => s.entry);
  const restTimeRemaining = useWorkoutStore((s) => s.restTimeRemaining);
  const isResting = useWorkoutStore((s) => s.isResting);
  const tickRestTimer = useWorkoutStore((s) => s.tickRestTimer);

  const [focusIds, setFocusIds] = useState<string[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);

  const mainRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const openRef = useRef(open);
  const indexRef = useRef(focusIndex);
  const idsRef = useRef(focusIds);
  const advanceTimerRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;

  const data = useMemo(
    () => ({ exercises, sheets, history, legacy }),
    [exercises, sheets, history, legacy]
  );
  const exMap = useMemo(() => getExerciseMap(exercises), [exercises]);

  openRef.current = open;
  indexRef.current = focusIndex;
  idsRef.current = focusIds;

  const treino = entry.sheetKey ?? getTodayTreino(data);
  const fichaIds = useMemo(
    () => sheets.find((s) => s.sheetKey === treino)?.exerciseIds ?? [],
    [sheets, treino]
  );

  const clearTimers = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (completeTimerRef.current !== null) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
  };

  /* startFocusMode (L759-776): snapshot da ficha + índice 0 ao abrir */
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const t = useTodayEntryStore.getState().entry.sheetKey ?? getTodayTreino(data);
      const ids = sheets.find((s) => s.sheetKey === t)?.exerciseIds ?? [];
      setFocusIds(ids);
      setFocusIndex(0);
    }
    if (!open && wasOpenRef.current) clearTimers();
    wasOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- efeito só na transição open
  }, [open, data, sheets]);

  /* Sincronia com o timer de descanso (updateTimerDisplay L686-689):
     o tique global só roda no ActiveWorkoutModal; aqui replicamos o intervalo */
  useEffect(() => {
    if (!open || !isResting || restTimeRemaining <= 0) return undefined;
    const id = window.setInterval(() => useWorkoutStore.getState().tickRestTimer(), 1000);
    return () => window.clearInterval(id);
  }, [open, isResting, restTimeRemaining, tickRestTimer]);

  /* Lock de body (openModal/closeModal legado abre/fecha este modal também) */
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const focusFicha = useMemo(
    () => focusIds.map((id) => exMap.get(id)).filter((e): e is Exercise => Boolean(e)),
    [focusIds, exMap]
  );
  const ex = focusFicha[focusIndex];
  const nextEx = focusFicha[focusIndex + 1];
  const isChecked = Boolean(ex && entry.checks.includes(ex.id));
  const seriesDone = ex ? entry.seriesDone?.[ex.id] ?? [] : [];

  /* Animação focus-anim (updateFocusUI L803-806: remove → reflow → add) */
  const seriesKey = ex ? seriesDone.join(',') : '';
  useEffect(() => {
    if (!open || !ex) return;
    const main = mainRef.current;
    if (!main) return;
    main.classList.remove('focus-anim');
    void main.offsetWidth;
    main.classList.add('focus-anim');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reframe a cada troca de exercício/marcações
  }, [open, focusIndex, isChecked, seriesKey]);

  useEffect(() => clearTimers, []);

  /* Mutações do Modo Foco: igual ao applyMutation da FichaFeature, mas com
     snapshot `treino` do contexto da ficha (entry.sheetKey ?? getToday) */
  const applyFocus = (fn: (base: WorkoutHistory) => FichaMutation) => {
    const store = useTodayEntryStore.getState();
    const { entry: next, rest } = fn(store.entry);
    if (!next.sheetKey) next.sheetKey = treino;
    void store.update(() => next);
    const ws = useWorkoutStore.getState();
    if (rest === 'stop') ws.skipRestTimer();
    else if (rest) ws.startRestTimer(rest);
  };

  const onCheck = () => {
    if (!ex) return;
    let newChecks: string[] = [];

    applyFocus((base) => {
      const mut = toggleCheckEntry(base, ex.id, ex);
      let next = mut.entry;

      /* Conclusão atômica do Modo Foco (L885-915) — espelha o bloco legado
         literalmente (só ficha, sem cardio; ao contrário de applyFichaCompletion) */
      const allDone = fichaIds.length > 0 && fichaIds.every((id) => next.checks.includes(id));
      if (allDone) {
        const keys = next.completedKeys ?? [];
        if (!keys.includes(treino)) keys.push(treino);
        next = { ...next, completedKeys: keys, completed: true };

        /* duracaoFoco (L898-903): alimenta "intensidadeFoco" do Radar */
        const startStr = sessionStorage.getItem('focusStartTime');
        if (startStr) {
          const mins = Math.max(1, Math.floor((Date.now() - parseInt(startStr, 10)) / 60000));
          next = { ...next, focusMin: mins };
          sessionStorage.removeItem('focusStartTime');
        }
      } else if (next.completed) {
        next = { ...next, completed: false }; // L916-921
      }

      newChecks = next.checks;
      return { entry: next, rest: mut.rest };
    });

    const nowChecked = newChecks.includes(ex.id);

    if (nowChecked) {
      /* startRestTimer(60) já veio de toggleCheckEntry (rest: 60) */
      if (focusIndex < focusIds.length - 1) {
        showToast('Excelente! Descansando e indo para o próximo...', 'success');
        if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = window.setTimeout(() => {
          /* Guarda do legado: só avança se ainda não está no último (L871-873) */
          if (indexRef.current < idsRef.current.length - 1) {
            setFocusIndex((i) => i + 1);
          }
          advanceTimerRef.current = null;
        }, 1500);
      }
    } else if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    /* Tudo concluído → fecha após 1.5s e mostra a conclusão (L909-915) */
    const allDone = fichaIds.length > 0 && fichaIds.every((id) => newChecks.includes(id));
    if (allDone) {
      if (completeTimerRef.current !== null) window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = window.setTimeout(() => {
        completeTimerRef.current = null;
        if (openRef.current) {
          onClose();
          onCompletedRef.current();
        }
      }, 1500);
    } else if (completeTimerRef.current !== null) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
  };

  /* Botões de série (L839-843): toggle + updateFocusUI + renderFicha — sem
     timer de descanso (o legado não passa o rest por aqui) */
  const onSetToggle = (setIdx: number) => {
    if (!ex) return;
    const store = useTodayEntryStore.getState();
    const { entry: next } = toggleSetEntry(store.entry, ex.id, setIdx, ex);
    if (!next.sheetKey) next.sheetKey = treino;
    void store.update(() => next);
  };

  const timerText = restTimeRemaining > 0
    ? `${pad2(Math.floor(restTimeRemaining / 60))}:${pad2(restTimeRemaining % 60)}`
    : 'DESCANSAR';

  /* v4.31.0 — exercício ainda sem carga definida: dica do peso inicial. */
  const sugestaoCarga = ex ? getSuggestedLoadIfMissing(ex) : null;

  return (
    <div
      className="modal-overlay"
      id="modalFocus"
      style={{
        display: 'flex',
        opacity: open ? 1 : 0,
        visibility: open ? 'visible' : 'hidden',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.2s ease, visibility 0.2s ease',
      }}
      role="dialog"
      aria-modal={open}
      aria-hidden={!open}
    >
      {open && ex && (
        <div className="focus-container">
          <button
            type="button"
            className="focus-close-btn"
            id="btnCloseFocus"
            onClick={onClose}
          >
            ✕ Sair do Modo Foco
          </button>

          <div className="focus-header">
            <div className="focus-progress-step" id="focusStep">
              EXERCÍCIO {focusIndex + 1} / {focusFicha.length}
            </div>
            <h2 className="focus-ex-name" id="focusExName">
              {ex.name}
            </h2>
            <div
              className={`focus-ex-badge ${grupoBadgeClass(ex.muscleGroup)}`}
              id="focusExBadge"
            >
              {ex.muscleGroup.toUpperCase()}
            </div>
          </div>

          <div className="focus-main" ref={mainRef}>
            <div className="focus-visual">
              <img
                id="focusImg"
                src={ex.imageUrl ?? ''}
                alt="Execução"
                style={{ display: ex.imageUrl ? 'block' : 'none' }}
              />
            </div>

            <div className="focus-info">
              <div className="focus-vol">
                <div className="f-vol-item">
                  <span className="f-vol-val" id="focusSeries">
                    {ex.sets}
                  </span>
                  <span className="f-vol-lbl">SÉRIES</span>
                </div>
                <div className="f-vol-item">
                  <span className="f-vol-val" id="focusReps">
                    {ex.reps}
                  </span>
                  <span className="f-vol-lbl">REPS</span>
                </div>
                <div className="f-vol-item">
                  <span className="f-vol-val" id="focusCarga">
                    {formatCarga(ex) || '--'}
                  </span>
                  <span className="f-vol-lbl">CARGA</span>
                </div>
              </div>

              {sugestaoCarga && (
                <div className="focus-carga-sugerida">
                  <span className="carga-sugerida">Peso inicial sugerido: {sugestaoCarga}</span>
                </div>
              )}

              <div className="focus-notes" id="focusNotes">
                {ex.notes && (
                  <div className="f-note-card">
                    <strong>💡 Lembrete:</strong>
                    <br />
                    {ex.notes}
                  </div>
                )}
              </div>

              <div className="focus-timer-area">
                <div className="focus-series-wrap">
                  {Array.from({ length: ex.sets || 0 }, (_, s) => (
                    <button
                      key={s}
                      type="button"
                      className={`btn-set-focus ${seriesDone[s] ? 'done' : ''}`}
                      onClick={() => onSetToggle(s)}
                    >
                      {s + 1}
                    </button>
                  ))}
                </div>
                <div className="f-timer-display" id="focusTimerVal">
                  {timerText}
                </div>
                <button
                  type="button"
                  className={`btn btn-primary f-btn-check ${isChecked ? 'f-btn-done' : ''}`}
                  id="btnFocusCheck"
                  onClick={onCheck}
                >
                  {isChecked ? 'CONCLUÍDO ✓' : 'CONCLUIR EXERCÍCIO'}
                </button>
              </div>
            </div>
          </div>

          <div className="focus-footer">
            <button
              type="button"
              className="f-nav-btn"
              id="btnFocusPrev"
              onClick={() => setFocusIndex((i) => (i > 0 ? i - 1 : i))}
            >
              ⬅ Anterior
            </button>
            <div className="focus-next-info" style={{ opacity: nextEx ? 1 : 0 }}>
              <span className="f-next-lbl">PRÓXIMO:</span>
              <span className="f-next-name" id="focusNextName">
                {nextEx ? nextEx.name : '--'}
              </span>
            </div>
            <button
              type="button"
              className="f-nav-btn"
              id="btnFocusNext"
              onClick={() =>
                setFocusIndex((i) => (i < focusFicha.length - 1 ? i + 1 : i))
              }
            >
              Próximo ➡
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
