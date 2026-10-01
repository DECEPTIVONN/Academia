/**
 * workout-store.ts — Estado global do treino ativo
 * Controla o temporizador de treino, timer de descanso, exercícios concluídos e notas.
 */

import { create } from 'zustand';
import type { SheetKey, Exercise } from '@/core/db/schema';

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
  isActive: false,
  sheetKey: null,
  sheetTitle: '',
  startTime: null,
  completedExerciseIds: [],
  currentExerciseIndex: 0,

  isResting: false,
  restTimeRemaining: 0,
  restTotalDuration: 0,

  startWorkout: (sheetKey, title) => {
    set({
      isActive: true,
      sheetKey,
      sheetTitle: title,
      startTime: Date.now(),
      completedExerciseIds: [],
      currentExerciseIndex: 0,
      isResting: false,
      restTimeRemaining: 0,
    });
  },

  finishWorkout: () => {
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
    set({
      isResting: true,
      restTimeRemaining: seconds,
      restTotalDuration: seconds,
    });
  },

  tickRestTimer: () => {
    const remaining = get().restTimeRemaining - 1;
    if (remaining <= 0) {
      set({ isResting: false, restTimeRemaining: 0 });
    } else {
      set({ restTimeRemaining: remaining });
    }
  },

  skipRestTimer: () => {
    set({ isResting: false, restTimeRemaining: 0 });
  },
}));
