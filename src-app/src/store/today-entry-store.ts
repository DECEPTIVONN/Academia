/**
 * today-entry-store.ts — Entrada do histórico de HOJE (checks, séries, conclusão)
 *
 * Espelha o `db.historico[today()]` do legado: fonte de verdade em memória para
 * a Ficha, persistida em `idb.workoutHistory` ([userId+date]) e compartilhada
 * com as demais features via evento `academia:db-ready`.
 *
 * Guardas de concorrência:
 *  - `pending` contém escritas em voo; um `load()` disparado no meio é enfileirado
 *    (`reloadQueued`) e só se aplica quando a fila zera, evitando regredir a UI
 *    para um estado anterior ao toggle do usuário.
 */

import { create } from 'zustand';
import { idb, upsertHistory, localToday } from '@/core/db/idb';
import { LOCAL_USER_ID, type WorkoutHistory } from '@/core/db/schema';

interface TodayEntryState {
  entry: WorkoutHistory;
  loaded: boolean;
  load: () => Promise<void>;
  /** Aplica uma mutação pura, persiste e propaga `academia:db-ready`. */
  update: (mut: (e: WorkoutHistory) => WorkoutHistory) => Promise<void>;
}

function blankEntry(): WorkoutHistory {
  return {
    userId: LOCAL_USER_ID,
    date: localToday(),
    sheetKey: null,
    completed: false,
    checks: [],
    seriesDone: {},
    completedKeys: [],
    durationMin: null,
  };
}

let pending = 0;
let reloadQueued = false;

export const useTodayEntryStore = create<TodayEntryState>((set, get) => ({
  entry: blankEntry(),
  loaded: false,

  load: async () => {
    if (pending > 0) {
      reloadQueued = true;
      return;
    }
    try {
      const row = await idb.workoutHistory.get([LOCAL_USER_ID, localToday()]);
      set({ entry: row ?? blankEntry(), loaded: true });
    } catch (err) {
      console.warn('[today-entry-store] falha ao carregar entrada de hoje:', err);
      set({ loaded: true });
    }
  },

  update: async (mut) => {
    const next = mut(get().entry);
    set({ entry: next, loaded: true });

    pending++;
    try {
      await upsertHistory(next);
    } catch (err) {
      console.warn('[today-entry-store] falha ao persistir entrada de hoje:', err);
    } finally {
      pending--;
      if (pending === 0) {
        // Propaga para useLocalData (Dashboard/Progresso) recarregarem.
        document.dispatchEvent(new Event('academia:db-ready'));
        if (reloadQueued) {
          reloadQueued = false;
          await get().load();
        }
      }
    }
  },
}));

/* Recarrega quando o bootstrap/migração ou outras features alteram o banco. */
if (typeof document !== 'undefined') {
  document.addEventListener('academia:db-ready', () => {
    void useTodayEntryStore.getState().load();
  });
}
