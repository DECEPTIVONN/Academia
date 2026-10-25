/**
 * workout-store.ts — Estado global do treino ativo
 * Controla o temporizador de treino, timer de descanso, exercícios concluídos e notas.
 */

import { create } from 'zustand';
import type { SheetKey } from '@/core/db/schema';
import { playRestTimerSound } from '@/lib/app-prefs';
import { showToast } from '@/lib/toast';

/** Chaves legadas (JS/treino/secao-ficha.js → initGlobalTimer) — persistem o
 *  treino em andamento entre recarregamentos da página. */
const START_KEY = 'workout_start_time';
const SHEET_KEY = 'workout_sheet_key';

function readStart(): number | null {
  try {
    const raw = localStorage.getItem(START_KEY);
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function readSheet(): SheetKey | null {
  try {
    const raw = localStorage.getItem(SHEET_KEY);
    return raw && raw.length === 1 ? (raw as SheetKey) : null;
  } catch {
    return null;
  }
}

function writeStart(start: number | null, sheet: SheetKey | null): void {
  try {
    if (start !== null) {
      localStorage.setItem(START_KEY, String(start));
      if (sheet) localStorage.setItem(SHEET_KEY, sheet);
    } else {
      localStorage.removeItem(START_KEY);
      localStorage.removeItem(SHEET_KEY);
    }
  } catch {
    /* ignora */
  }
}

const restoredStart = readStart();
const restoredSheet = readSheet();

interface ActiveWorkoutState {
  isActive: boolean;
  sheetKey: SheetKey | null;
  sheetTitle: string;
  startTime: number | null;
  completedExerciseIds: string[];
  currentExerciseIndex: number;
  
  // Timer de descanso
  isResting: boolean;
  restTimeRemaining: number;
  restTotalDuration: number;
  /** Incrementa a cada startRestTimer — reinicia o intervalo no widget (como o
   *  clearInterval/setInterval do legado ao reiniciar o cronômetro). */
  restRunId: number;

  // Ações
  startWorkout: (sheetKey: SheetKey, title: string) => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;

  toggleExerciseCheck: (exerciseId: string) => void;
  startRestTimer: (seconds: number) => void;
  tickRestTimer: () => void;
  skipRestTimer: () => void;
}

export const useWorkoutStore = create<ActiveWorkoutState>((set, get) => ({
  isActive: restoredStart !== null,
  sheetKey: restoredSheet,
  sheetTitle: restoredSheet ? `Treino ${restoredSheet}` : '',
  startTime: restoredStart,
  completedExerciseIds: [],
  currentExerciseIndex: 0,

  isResting: false,
  restTimeRemaining: 0,
  restTotalDuration: 0,
  restRunId: 0,

  startWorkout: (sheetKey, title) => {
    const start = Date.now();
    writeStart(start, sheetKey);
    set({
      isActive: true,
      sheetKey,
      sheetTitle: title,
      startTime: start,
      completedExerciseIds: [],
      currentExerciseIndex: 0,
      isResting: false,
      restTimeRemaining: 0,
    });
  },

  finishWorkout: () => {
    writeStart(null, null);
    set({
      isActive: false,
      sheetKey: null,
      sheetTitle: '',
      startTime: null,
      completedExerciseIds: [],
      isResting: false,
      restTimeRemaining: 0,
    });
  },

  cancelWorkout: () => {
    writeStart(null, null);
    set({
      isActive: false,
      sheetKey: null,
      sheetTitle: '',
      startTime: null,
      completedExerciseIds: [],
      isResting: false,
      restTimeRemaining: 0,
    });
  },

  toggleExerciseCheck: (exerciseId) => {
    const current = get().completedExerciseIds;
    const exists = current.includes(exerciseId);
    const updated = exists
      ? current.filter((id) => id !== exerciseId)
      : [...current, exerciseId];

    set({ completedExerciseIds: updated });
  },

  startRestTimer: (seconds) => {
    /* startRestTimer (secao-ficha.js L581–593): valor inválido/<= 0 vira 60 s. */
    const parsed = parseInt(String(seconds), 10);
    const secs = Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
    set({
      isResting: true,
      restTimeRemaining: secs,
      restTotalDuration: secs,
      restRunId: get().restRunId + 1,
    });
  },

  tickRestTimer: () => {
    /* Só decrementa enquanto o descanso está ativo — evita intervalos órfãos
       (duplo mount) acelerando o cronômetro. */
    const state = get();
    if (!state.isResting || state.restTimeRemaining <= 0) return;

    const remaining = state.restTimeRemaining - 1;
    if (remaining <= 0) {
      set({ isResting: false, restTimeRemaining: 0 });
      /* Paridade com `playBeep()` + toast do legado (secao-ficha.js L666–676) */
      playRestTimerSound();
      showToast('Tempo de descanso encerrado! Bora pro próximo!', 'info');
    } else {
      set({ restTimeRemaining: remaining });
    }
  },

  skipRestTimer: () => {
    set({ isResting: false, restTimeRemaining: 0 });
  },
}));
