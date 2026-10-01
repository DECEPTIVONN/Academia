/**
 * workout.store.ts — Estado global da aplicação (Zustand)
 * Leve, sem boilerplate, compatível com React 19.
 * Persiste estado crítico (tema, seção ativa) no localStorage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Exercise,
  WorkoutSheet,
  WorkoutHistory,
  ExerciseMastery,
  UserProfile,
  SheetKey,
  ActiveWorkout,
  MasteryTier,
} from '@/core/db/schema';

/* ── Tipos dos slices ── */
interface ThemeSlice {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

interface NavigationSlice {
  activeSection: SectionId;
  setActiveSection: (section: SectionId) => void;
  isProfileOverlayOpen: boolean;
  isWorkoutOverlayOpen: boolean;
  openProfileOverlay:  () => void;
  closeProfileOverlay: () => void;
  openWorkoutOverlay:  () => void;
  closeWorkoutOverlay: () => void;
}

interface DataSlice {
  exercises:      Exercise[];
  sheets:         WorkoutSheet[];
  history:        WorkoutHistory[];
  mastery:        Record<string, ExerciseMastery>;
  profile:        UserProfile | null;
  setExercises:   (exercises: Exercise[]) => void;
  setSheets:      (sheets: WorkoutSheet[]) => void;
  setHistory:     (history: WorkoutHistory[]) => void;
  setMastery:     (mastery: ExerciseMastery[]) => void;
  setProfile:     (profile: UserProfile | null) => void;
  updateMasteryXP: (exerciseId: string, xp: number, tier: MasteryTier) => void;
}

interface WorkoutSlice {
  activeWorkout: ActiveWorkout | null;
  startWorkout:  (sheetKey: SheetKey) => void;
  checkExercise: (exerciseId: string) => void;
  endWorkout:    () => void;
}

interface UISlice {
  isLoading:    boolean;
  toast:        Toast | null;
  setLoading:   (loading: boolean) => void;
  showToast:    (toast: Toast) => void;
  dismissToast: () => void;
}

/* ── Tipos auxiliares ── */
export type SectionId = 'progresso' | 'treinos' | 'dashboard' | 'social' | 'loja';

export type ThemeName =
  | 'roxo'
  | 'turquesa'
  | 'carmesim'
  | 'verde'
  | 'azul'
  | 'ouro'
  | 'marrom'
  | 'laranja'
  | 'cinza';

export interface Toast {
  message: string;
  type:    'success' | 'error' | 'info';
  duration?: number;
}

/* ── Store combinado ── */
type AppStore = ThemeSlice & NavigationSlice & DataSlice & WorkoutSlice & UISlice;

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      /* ── Theme ── */
      theme: 'roxo',
      setTheme: (theme) => set({ theme }),

      /* ── Navigation ── */
      activeSection:        'dashboard',
      isProfileOverlayOpen: false,
      isWorkoutOverlayOpen: false,

      setActiveSection: (activeSection) => set({ activeSection }),

      openProfileOverlay:  () => set({ isProfileOverlayOpen: true }),
      closeProfileOverlay: () => set({ isProfileOverlayOpen: false }),
      openWorkoutOverlay:  () => set({ isWorkoutOverlayOpen: true }),
      closeWorkoutOverlay: () => set({ isWorkoutOverlayOpen: false }),

      /* ── Data ── */
      exercises: [],
      sheets:    [],
      history:   [],
      mastery:   {},
      profile:   null,

      setExercises: (exercises) => set({ exercises }),
      setSheets:    (sheets)    => set({ sheets }),
      setHistory:   (history)   => set({ history }),
      setProfile:   (profile)   => set({ profile }),

      setMastery: (masteryArray) => {
        const mastery = Object.fromEntries(
          masteryArray.map(m => [m.exerciseId, m])
        );
        set({ mastery });
      },

      updateMasteryXP: (exerciseId, xp, tier) => {
        const { mastery } = get();
        const existing = mastery[exerciseId];
        if (!existing) return;
        set({
          mastery: {
            ...mastery,
            [exerciseId]: { ...existing, xp, tier },
          },
        });
      },

      /* ── Workout ── */
      activeWorkout: null,

      startWorkout: (sheetKey) => set({
        activeWorkout: {
          sheetKey,
          startTime: Date.now(),
          date: new Date().toISOString().split('T')[0],
          checks: new Set(),
        },
      }),

      checkExercise: (exerciseId) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;
        const checks = new Set(activeWorkout.checks);
        checks.add(exerciseId);
        set({ activeWorkout: { ...activeWorkout, checks } });
      },

      endWorkout: () => set({ activeWorkout: null }),

      /* ── UI ── */
      isLoading: false,
      toast:     null,

      setLoading:   (isLoading) => set({ isLoading }),
      showToast:    (toast)     => set({ toast }),
      dismissToast: ()          => set({ toast: null }),
    }),
    {
      name: 'academia-ui-state',   // chave no localStorage
      // Persiste apenas o que não é reconstituível do Supabase
      partialize: (state) => ({
        theme:         state.theme,
        activeSection: state.activeSection,
      }),
    }
  )
);

/* ── Selectors (evitam re-renders desnecessários) ── */
export const selectTheme           = (s: AppStore) => s.theme;
export const selectActiveSection   = (s: AppStore) => s.activeSection;
export const selectActiveWorkout   = (s: AppStore) => s.activeWorkout;
export const selectIsLoading       = (s: AppStore) => s.isLoading;
export const selectToast           = (s: AppStore) => s.toast;
export const selectExercises       = (s: AppStore) => s.exercises;
export const selectSheets          = (s: AppStore) => s.sheets;
export const selectHistory         = (s: AppStore) => s.history;
export const selectMastery         = (s: AppStore) => s.mastery;
export const selectProfile         = (s: AppStore) => s.profile;
export const selectOverlays        = (s: AppStore) => ({
  profile: s.isProfileOverlayOpen,
  workout: s.isWorkoutOverlayOpen,
});
