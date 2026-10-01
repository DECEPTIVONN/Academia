/**
 * user-store.ts — Estado global do usuário e progressão gamificada
 * Gerencia XP, Nível, Nível de Maestria, Streak (dias consecutivos) e Avatar.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getTierForXP } from '@/core/db/idb';

interface UserProfile {
  name: string;
  avatarUrl: string;
  xp: number;
  level: number;
  streakDays: number;
  lastWorkoutDate: string | null;
}

interface UserStore extends UserProfile {
  addXP: (amount: number) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  recordWorkout: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      name: 'Atleta',
      avatarUrl: '',
      xp: 0,
      level: 1,
      streakDays: 0,
      lastWorkoutDate: null,

      addXP: (amount: number) => {
        const newXP = get().xp + amount;
        // 100 XP por nível
        const newLevel = Math.floor(newXP / 100) + 1;
        set({ xp: newXP, level: newLevel });
      },

      updateProfile: (data) => set((state) => ({ ...state, ...data })),

      recordWorkout: () => {
        const today = new Date().toISOString().split('T')[0];
        const last = get().lastWorkoutDate;

        if (!last) {
          set({ streakDays: 1, lastWorkoutDate: today });
          return;
        }

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (last === yesterday) {
          set((state) => ({ streakDays: state.streakDays + 1, lastWorkoutDate: today }));
        } else if (last !== today) {
          set({ streakDays: 1, lastWorkoutDate: today });
        }
      },
    }),
    { name: 'academia_user_profile' }
  )
);
