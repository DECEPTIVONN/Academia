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
import { useModalPresence } from '@/hooks/useModalPresence';
import { useWorkoutStore } from '@/store/workout-store';
import { useTodayEntryStore } from '@/store/today-entry-store';
import { effectiveAerobic, type Exercise, type WorkoutHistory } from '@/core/db/schema';
import { getSuggestedLoadIfMissing } from '@/lib/suggested-load';
import {
  compactIds,
  formatCarga,
  getExerciseMap,
  getTodayTreino,
  grupoBadgeClass,
  toggleCheckEntry,
  toggleSeriesUpToEntry,
  type FichaMutation,
} from '@/core/db/queries';
import { showToast } from '@/lib/toast';
import { formatSpeed } from '@/lib/app-prefs';

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
  const { mounted, closing } = useModalPresence(open);

  const { exercises, sheets, history, legacy } = useLocalData();
  const entry = useTodayEntryStore((s) => s.entry);
  const restTimeRemaining = useWorkoutStore((s) => s.restTimeRemaining);

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
    /* v4.58.0 — o Modo Foco navega só pelos exercícios (sem slots vazios). */
    () => compactIds(sheets.find((s) => s.sheetKey === treino)?.exerciseIds),
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
      const ids = compactIds(sheets.find((s) => s.sheetKey === t)?.exerciseIds);
      setFocusIds(ids);
      setFocusIndex(0);
    }
    if (!open && wasOpenRef.current) clearTimers();
    wasOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- efeito só na transição open
  }, [open, data, sheets]);

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

  /* v4.56.14 — CARDIO como última etapa do foco, no MESMO desenho do card de
     cardio do grid (rótulo + tipo + velocidade/tempo + concluir). A ficha
     padrão sempre tem cardio (`effectiveAerobic`), como na aba Ficha. */
  const focusSheet = sheets.find((s) => s.sheetKey === treino);
  const hasAe =
    (focusFicha.length > 0 || Boolean(focusSheet?.aerobic?.tipo)) &&
    focusSheet?.aerobic?.tipo !== 'Nenhum';
  const ae = effectiveAerobic(focusSheet?.aerobic);
  const aeId = `ae-${treino}`;
  const cardioIndex = focusFicha.length;
  const isCardioStep = hasAe && focusIndex === cardioIndex;
  const cardioChecked = entry.checks.includes(aeId);
  /** Ids que fecham o treino (exercícios + cardio configurado). */
  const allStepIds = useMemo(
    () =>
      hasAe && focusSheet?.aerobic?.tipo && focusSheet.aerobic.tipo !== 'Nenhum'
        ? [...fichaIds, aeId]
        : fichaIds,
    [hasAe, focusSheet?.aerobic?.tipo, fichaIds, aeId],
  );
  const lastStep = hasAe ? cardioIndex : focusFicha.length - 1;

  const ex = isCardioStep ? undefined : focusFicha[focusIndex];
  const nextEx = isCardioStep ? undefined : focusFicha[focusIndex + 1];
  /** Rótulo do rodapé: próximo exercício ou o cardio no fim da ficha. */
  const nextLabel = isCardioStep ? '--' : nextEx ? nextEx.name : hasAe && ex ? (ae?.tipo ?? '--') : '--';
  const isChecked = Boolean(ex && entry.checks.includes(ex.id));
  const seriesDone = ex ? entry.seriesDone?.[ex.id] ?? [] : [];

  /* v4.56.21 — TROCA SUAVE entre exercícios (sem remount/refresh): a classe
     `.focus-swap` é reaplicada a cada mudança de conteúdo e anima um fade +
     deslize curto do bloco (prefers-reduced-motion respeitado no CSS). */
  const [swapping, setSwapping] = useState(false);
  const swapRafRef = useRef<number | null>(null);
  const swapTimerRef = useRef<number | null>(null);
  const currentId = isCardioStep ? 'cardio' : ex?.id ?? '';
  useEffect(() => {
    if (!open) return undefined;
    if (swapRafRef.current !== null) cancelAnimationFrame(swapRafRef.current);
    if (swapTimerRef.current !== null) window.clearTimeout(swapTimerRef.current);
    setSwapping(false);
    swapRafRef.current = requestAnimationFrame(() => {
      setSwapping(true);
      swapTimerRef.current = window.setTimeout(() => {
        setSwapping(false);
        swapTimerRef.current = null;
      }, 340);
    });
    return () => {
      if (swapRafRef.current !== null) cancelAnimationFrame(swapRafRef.current);
      if (swapTimerRef.current !== null) window.clearTimeout(swapTimerRef.current);
    };
    /* Só a TROCA de exercício/etapa anima: marcar série ou concluir o
       exercício não reaplica o fade (evita a sensação de refresh). */
  }, [open, focusIndex, currentId]);

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

  /**
   * Aplica uma mutação de check/série do Modo Foco e roda o pós-processamento
   * comum: conclusão atômica da ficha, **timer de descanso**, auto-avanço e
   * fechamento com a tela de conclusão.
   *
   * v4.60.0 — as SÉRIES passam por aqui também: antes `onSetToggle` chamava
   * `toggleSetEntry` direto e descartava o `rest` devolvido, então tocar nos
   * botões de série não iniciava o descanso (o timer só funcionava no botão
   * CONCLUIR) e a conclusão da ficha só era reavaliada por esse botão.
   */
  const runFocusMutation = (
    exId: string,
    mutate: (base: WorkoutHistory) => FichaMutation
  ) => {
    let newChecks: string[] = [];

    applyFocus((base) => {
      const mut = mutate(base);
      let next = mut.entry;

      /* Conclusão atômica do Modo Foco (L885-915) — agora inclui o cardio
         CONFIGURADO, igual à aba Ficha (v4.56.2). */
      const allDone = allStepIds.length > 0 && allStepIds.every((id) => next.checks.includes(id));
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

    const nowChecked = newChecks.includes(exId);

    /* Auto-avanço só entre EXERCÍCIOS (o cardio é a última etapa). */
    if (nowChecked && !exId.startsWith('ae-') && focusIndex < focusIds.length - 1) {
      showToast('Excelente! Descansando e indo para o próximo...', 'success');
      if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = window.setTimeout(() => {
        /* Guarda do legado: só avança se ainda não está no último (L871-873) */
        if (indexRef.current < idsRef.current.length - 1) {
          setFocusIndex((i) => i + 1);
        }
        advanceTimerRef.current = null;
      }, 1500);
    } else if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    /* Tudo concluído → fecha após 1.5s e mostra a conclusão (L909-915) */
    const allDone = allStepIds.length > 0 && allStepIds.every((id) => newChecks.includes(id));
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

  /** Marca/desmarca uma etapa (exercício ou cardio). */
  const toggleDone = (exId: string, exercise?: Exercise) =>
    runFocusMutation(exId, (base) => toggleCheckEntry(base, exId, exercise));

  const onCheck = () => {
    if (!ex) return;
    toggleDone(ex.id, ex);
  };

  /* v4.56.21 — CARDIO é opcional no Modo Foco: "Concluir treino sem o cardio"
     fecha o treino do dia na hora (marca a ficha como concluída e alimenta o
     duracaoFoco), sem exigir a marcação do cardio. */
  const finishWithoutCardio = () => {
    if (completeTimerRef.current !== null) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
    applyFocus((base) => {
      let next = { ...base };
      const keys = [...(next.completedKeys ?? [])];
      if (!keys.includes(treino)) keys.push(treino);
      next = { ...next, completedKeys: keys, completed: true };
      const startStr = sessionStorage.getItem('focusStartTime');
      if (startStr) {
        const mins = Math.max(1, Math.floor((Date.now() - parseInt(startStr, 10)) / 60000));
        next = { ...next, focusMin: mins };
        sessionStorage.removeItem('focusStartTime');
      }
      return { entry: next };
    });
    showToast('Treino concluído sem o cardio. Bom treino!', 'success');
    completeTimerRef.current = window.setTimeout(() => {
      completeTimerRef.current = null;
      if (openRef.current) {
        onClose();
        onCompletedRef.current();
      }
    }, 600);
  };

  /* Botões de série (L839-843): toggle + updateFocusUI + renderFicha.
     v4.60.0 — passa pelo MESMO fluxo do check: inicia o descanso com o tempo
     do exercício (ou 60 s na última série) e avalia conclusão/avanço.
     v4.61.0 — tocar na série N preenche 1..N (séries contíguas); ao completar
     todas, o exercício é marcado e o auto-avanço leva ao próximo. */
  const onSetToggle = (setIdx: number) => {
    if (!ex) return;
    runFocusMutation(ex.id, (base) => toggleSeriesUpToEntry(base, ex.id, setIdx, ex));
  };

  const timerText = restTimeRemaining > 0
    ? `${pad2(Math.floor(restTimeRemaining / 60))}:${pad2(restTimeRemaining % 60)}`
    : '00:00';

  /* v4.31.0 — exercício ainda sem carga definida: dica do peso inicial. */
  const sugestaoCarga = ex ? getSuggestedLoadIfMissing(ex) : null;

  if (!mounted) return null;

  return (
    <div
      className={`modal-overlay${closing ? ' is-closing' : ''}`}
      id="modalFocus"
      role="dialog"
      aria-modal={open}
      aria-hidden={!open}
    >
      {/* v4.56.21 — SEM `key={focusIndex}`: remontar o container inteiro a
          cada troca de exercício era o "refresh" que piscava a tela (e
          recarregava o GIF). Agora o container é estável; a troca suave vem
          da classe .focus-swap reaplicada pelo efeito. */}
      {(ex || isCardioStep) && (
        <div className={`focus-container${swapping ? ' focus-swap' : ''}`}>
          <button
            type="button"
            className="focus-close-btn"
            id="btnCloseFocus"
            onClick={onClose}
          >
            ✕ Sair do Modo Foco
          </button>

          {isCardioStep ? (
            <div className="focus-header">
              <div className="focus-progress-step" id="focusStep">
                CARDIO · ETAPA FINAL
              </div>
              <h2 className="focus-ex-name" id="focusExName">
                {ae?.tipo}
              </h2>
              <div className="focus-ex-badge focus-ex-badge--cardio" id="focusExBadge">
                CARDIO
              </div>
            </div>
          ) : (
            ex && (
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
            )
          )}

          <div className={`focus-main${isCardioStep ? ' focus-main--cardio' : ''}`} ref={mainRef}>
            <div className="focus-stage">
            {isCardioStep ? (
              <div className="focus-visual focus-visual--cardio">
                <span className="focus-cardio-icon" aria-hidden="true">
                  {/* v4.56.14 — mesmo ECG de traço do padrão de ícones do site
                      (guia Diretrizes/Ícones.md); emoji é proibido como ícone. */}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="64"
                    height="64"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </span>
              </div>
            ) : (
              <div className="focus-visual">
                <img
                  id="focusImg"
                  src={ex?.imageUrl ?? ''}
                  alt="Execução"
                  style={{ display: ex?.imageUrl ? 'block' : 'none' }}
                />
              </div>
            )}

              {/* v4.56.21 — TIMER entre o GIF e a linha de séries/reps/carga
                  (pedido do usuário): antes ficava abaixo dos botões de série
                  e passava despercebido.
                  v4.72.2 — só aparece com o descanso RODANDO (depois de marcar
                  uma série); parado em 00:00 ele poluía a tela em todo
                  exercício. */}
              {restTimeRemaining > 0 && (
                <div className="f-timer-display is-running" id="focusTimerVal">
                  <span className="f-timer-val">{timerText}</span>
                  <span className="f-timer-lbl">DESCANSO</span>
                </div>
              )}
            </div>

            <div className="focus-info">
              {isCardioStep ? (
                /* Mesmo desenho do card de cardio do grid: tipo + velocidade/tempo */
                <div className="focus-vol">
                  <div className="f-vol-item">
                    <span className="f-vol-val">{formatSpeed(ae!.vel)}</span>
                    <span className="f-vol-lbl">VELOCIDADE</span>
                  </div>
                  <div className="f-vol-item">
                    <span className="f-vol-val">{ae!.tempo || '--'}</span>
                    <span className="f-vol-lbl">MINUTOS</span>
                  </div>
                </div>
              ) : (
                ex && (
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
                      {/* v4.56.14 — sem carga salva, mostra a SUGERIDA (o peso
                          inicial do exercício), como no grid/tabela. */}
                      <span className="f-vol-val" id="focusCarga">
                        {formatCarga(ex) || sugestaoCarga || '--'}
                      </span>
                      <span className="f-vol-lbl">
                        CARGA{!formatCarga(ex) && sugestaoCarga ? ' SUGERIDA' : ''}
                      </span>
                    </div>
                  </div>
                )
              )}

              {!isCardioStep && ex && (
                <div className="focus-notes" id="focusNotes">
                  {ex.notes && (
                    <div className="f-note-card">
                      <strong>💡 Lembrete:</strong>
                      <br />
                      {ex.notes}
                    </div>
                  )}
                </div>
              )}

              <div className="focus-timer-area">
                {!isCardioStep && ex && (
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
                )}
                <button
                  type="button"
                  className={`btn btn-primary f-btn-check ${(isCardioStep ? cardioChecked : isChecked) ? 'f-btn-done' : ''}`}
                  id="btnFocusCheck"
                  onClick={() => (isCardioStep ? toggleDone(aeId) : onCheck())}
                >
                  {isCardioStep
                    ? cardioChecked
                      ? 'CARDIO CONCLUÍDO ✓'
                      : 'CONCLUIR CARDIO'
                    : isChecked
                      ? 'CONCLUÍDO ✓'
                      : 'CONCLUIR EXERCÍCIO'}
                </button>

                {/* v4.56.21 — o cardio é opcional: fecha o treino do dia
                    pulando a etapa (só no Modo Foco). */}
                {isCardioStep && (
                  <button
                    type="button"
                    className="f-btn-skip-cardio"
                    id="btnFocusSkipCardio"
                    onClick={finishWithoutCardio}
                  >
                    Concluir treino sem o cardio
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* v4.61.0 — navegação condicional: sem “Anterior” no primeiro
              exercício e sem “Próximo” no último (o placeholder invisível
              mantém o rótulo PRÓXIMO centralizado). */}
          <div className="focus-footer">
            {focusIndex > 0 ? (
              <button
                type="button"
                className="f-nav-btn"
                id="btnFocusPrev"
                onClick={() => setFocusIndex((i) => (i > 0 ? i - 1 : i))}
              >
                ⬅ Anterior
              </button>
            ) : (
              <span className="f-nav-btn f-nav-btn--placeholder" aria-hidden="true" />
            )}
            <div className="focus-next-info" style={{ opacity: nextLabel === '--' ? 0 : 1 }}>
              <span className="f-next-lbl">PRÓXIMO:</span>
              <span className="f-next-name" id="focusNextName">
                {nextLabel}
              </span>
            </div>
            {focusIndex < lastStep ? (
              <button
                type="button"
                className="f-nav-btn"
                id="btnFocusNext"
                onClick={() => setFocusIndex((i) => (i < lastStep ? i + 1 : i))}
              >
                Próximo ➡
              </button>
            ) : (
              <span className="f-nav-btn f-nav-btn--placeholder" aria-hidden="true" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
