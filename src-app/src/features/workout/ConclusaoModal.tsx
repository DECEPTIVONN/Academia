/**
 * ConclusaoModal.tsx — Modal "TREINO CONCLUÍDO!" + confete (Fase 3)
 * Port 1:1 de `showConclusao` (JS/treino/secao-ficha.js L421–495) e do DOM
 * `componentes/secoes/modais.html` L1–37.
 *
 * Ordem do legado ao abrir (reproduzida num efeito com guarda de re-entrada,
 * porque `academia:db-ready` dispara re-render dos dados):
 *   1. stopGlobalTimer → grava duração do dia e para o cronômetro
 *   2. monta submensagem + stats (Exercícios / Séries / Vol. Médio / Tempo / Grupos)
 *   3. trackMaestriaSessoes(checks) ANTES de limpar
 *   4. limpa checks + seriesDone (desmarca a tabela)
 *   5. launchConfetti + openModal
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalData } from '@/hooks/useLocalData';
import {
  formatSeconds,
  getExerciseMap,
  getStreak,
  getTodayTreino,
  pickExercises,
} from '@/core/db/queries';
import { useTodayEntryStore } from '@/store/today-entry-store';
import { useWorkoutStore } from '@/store/workout-store';
import { trackMaestriaSessoes } from '@/features/gamification/maestria';
import { useShareStore } from '@/features/gamification/share-store';

/** Espelha `launchConfetti` (secao-ficha.js L539–557). */
function launchConfetti(): void {
  const container = document.getElementById('confettiContainer');
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#8b5cf6', '#22c55e', '#f9ca24', '#fd79a8', '#4ecdc4', '#a29bfe'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const size = 6 + Math.random() * 8;
    piece.style.cssText = [
      `left:${Math.random() * 100}%`,
      `background:${colors[Math.floor(Math.random() * colors.length)]}`,
      `animation-duration:${1.5 + Math.random() * 2}s`,
      `animation-delay:${Math.random() * 0.8}s`,
      `width:${size}px`,
      `height:${size}px`,
      `border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`,
    ].join(';');
    container.appendChild(piece);
  }
}

interface ConclusaoModalProps {
  open: boolean;
  /** btnFecharConclusao (app.js L272–292): fecha + navega ao dashboard. */
  onClose: () => void;
  onShare?: () => void;
}

export function ConclusaoModal({ open, onClose, onShare }: ConclusaoModalProps) {
  const { exercises, sheets, history, legacy } = useLocalData();
  const entry = useTodayEntryStore((s) => s.entry);
  const [duracaoSec, setDuracaoSec] = useState(0);
  const processedRef = useRef(false);

  const data = useMemo(
    () => ({ exercises, sheets, history, legacy }),
    [exercises, sheets, history, legacy]
  );

  /* Stats/mensagem (showConclusao L423–457) */
  const view = useMemo(() => {
    const treino = entry.sheetKey ?? getTodayTreino(data);
    const fichaIds = sheets.find((s) => s.sheetKey === treino)?.exerciseIds ?? [];
    const exercicios = pickExercises(fichaIds, getExerciseMap(exercises));
    const grupos = [...new Set(exercicios.map((e) => e.muscleGroup))];
    const totalSeries = exercicios.reduce((sum, e) => sum + (Number(e.sets) || 0), 0);
    const totalCarga = exercicios.reduce(
      (sum, ex) =>
        sum + (parseFloat(String(ex.load).replace(/[^\d.,]/g, '').replace(',', '.')) || 0),
      0
    );
    const avgVol = exercicios.length ? (totalCarga / exercicios.length).toFixed(1) : '0.0';

    const totalWorkouts = history.filter((h) => h.completed).length;
    const streak = getStreak(history);

    let msg = `Você completou todos os ${exercicios.length} exercícios do Treino ${treino}!`;
    if (streak % 7 === 0 && streak > 0) {
      msg += `<br><br><span style="color:var(--gym-green); font-weight:700;">🔥 INCRÍVEL! Você atingiu uma ofensiva de ${streak} dias (Semana Perfeita)!</span>`;
    } else if (totalWorkouts % 5 === 0 && totalWorkouts > 0) {
      msg += `<br><br><span style="color:#a29bfe; font-weight:700;">💪 PARABÉNS! Você já completou ${totalWorkouts} treinos totais no app! Continue firme.</span>`;
    }

    return { treino, exercicios, grupos, totalSeries, avgVol, msg };
  }, [entry.sheetKey, sheets, exercises, history, data]);

  /* Efeito de abertura (guarda: só processa uma vez por `open`;
     o lock de body.overflow é do App, que também abre modalEncerrarTreino) */
  useEffect(() => {
    if (!open) {
      processedRef.current = false;
      return;
    }
    if (processedRef.current) return;
    processedRef.current = true;

    const entryStore = useTodayEntryStore.getState();
    const ws = useWorkoutStore.getState();

    // 1. stopGlobalTimer (L1061–1073): duração + para cronômetro
    let sec = 0;
    if (ws.startTime) {
      sec = Math.floor((Date.now() - ws.startTime) / 1000);
      ws.finishWorkout();
    }
    if (sec <= 0 && entryStore.entry.durationMin) sec = entryStore.entry.durationMin * 60;
    setDuracaoSec(sec);

    // 5. confete (launchConfetti L539–557)
    launchConfetti();

    // 2–4. escritas assíncronas na ordem do legado
    void (async () => {
      if (sec > 0) {
        const minutos = Math.max(1, Math.round(sec / 60));
        await useTodayEntryStore.getState().update((e) => ({ ...e, durationMin: minutos }));
      }
      const atual = useTodayEntryStore.getState().entry;
      const treino = atual.sheetKey ?? getTodayTreino(data);
      const fichaIds = sheets.find((s) => s.sheetKey === treino)?.exerciseIds ?? [];
      const fichaExIds = atual.checks.filter(
        (id) => !id.startsWith('ae-') && fichaIds.includes(id)
      );
      if (fichaExIds.length > 0) await trackMaestriaSessoes(legacy, fichaExIds);
      // Limpa checks/séries (L476–477) — a tabela volta a exibir desmarcada,
      // mantendo o estado "concluído" via entry.completed (treinos[]).
      await useTodayEntryStore.getState().update((e) => ({ ...e, checks: [], seriesDone: {} }));
    })();
  }, [open, data, sheets, legacy]);

  return (
    <div
      className="modal-overlay"
      id="modalConclusao"
      style={{ display: open ? 'flex' : 'none' }}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
    >
      {open && (
        <div className="modal-conclusao">
          <div className="conclusao-confetti" id="confettiContainer" />
          <div
            className="conclusao-trophy"
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, color: 'var(--primary)' }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              width={56}
              height={56}
            >
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
            </svg>
          </div>
          <h2 className="conclusao-title">TREINO CONCLUÍDO!</h2>
          <p
            className="conclusao-sub"
            id="conclusaoSub"
            dangerouslySetInnerHTML={{ __html: view.msg }}
          />
          <div className="conclusao-stats" id="conclusaoStats">
            <div className="c-stat">
              <div className="c-stat-val">{view.exercicios.length}</div>
              <div className="c-stat-lbl">Exercícios</div>
            </div>
            <div className="c-stat">
              <div className="c-stat-val">{view.totalSeries}</div>
              <div className="c-stat-lbl">Séries Totais</div>
            </div>
            <div className="c-stat">
              <div className="c-stat-val">{view.avgVol}</div>
              <div className="c-stat-lbl">Vol. Médio</div>
            </div>
            {duracaoSec > 0 && (
              <div className="c-stat">
                <div className="c-stat-val">{formatSeconds(duracaoSec)}</div>
                <div className="c-stat-lbl">Tempo Total</div>
              </div>
            )}
            <div className="c-stat">
              <div className="c-stat-val">{view.grupos.length}</div>
              <div className="c-stat-lbl">Grupos</div>
            </div>
          </div>
          <div
            className="conclusao-actions"
            style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20, width: '100%' }}
          >
            <button
              type="button"
              className="btn btn-primary conclusao-btn"
              id="btnShareWorkoutModal"
              onClick={() => {
                if (onShare) onShare();
                else useShareStore.getState().openTreino();
              }}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width={16}
                height={16}
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>{' '}
              COMPARTILHAR TREINO
            </button>
            <button
              type="button"
              className="btn btn-secondary conclusao-btn"
              id="btnFecharConclusao"
              onClick={onClose}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                width={16}
                height={16}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>{' '}
              INCRÍVEL!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
