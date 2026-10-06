/**
 * treinos-store.ts — Estado persistente da seção Treinos (Fase 4)
 * Espelha as variáveis de módulo do legado (db.js L41–47):
 *   currentDeckLetter, currentDeckPage, currentDeckView, currentExView
 * + currentFilter/currentSearch (secao-treinos.js L15–18).
 * Zustand garante que o estado sobreviva ao unmount da seção (nav entre seções),
 * como no legado (módulos vivem durante toda a sessão).
 */

import { create } from 'zustand';
import type { SheetKey } from '@/core/db/schema';

export type ExView = 'grid' | 'colecao';
export type DeckView = 'grid' | 'list' | 'royale';
export type MainTab = 'exercicios' | 'montar';

/** Sub-abas da tab Exercícios (treinos.html L22–39). */
export type SubTab =
  | 'exercicios-lista'
  | 'itens-magicos'
  | 'emotes'
  | 'torres'
  | 'estandartes'
  | 'maestrias';

interface TreinosState {
  mainTab: MainTab;
  subTab: SubTab;
  deckLetter: SheetKey;
  deckPage: 1 | 2;
  deckView: DeckView;
  exView: ExView;
  filter: string;
  search: string;
  deckSearch: string;
  setMainTab: (t: MainTab) => void;
  setSubTab: (t: SubTab) => void;
  setDeckLetter: (l: SheetKey) => void;
  setDeckPage: (p: 1 | 2) => void;
  setDeckView: (v: DeckView) => void;
  setExView: (v: ExView) => void;
  setFilter: (f: string) => void;
  setSearch: (s: string) => void;
  setDeckSearch: (s: string) => void;
}

export const useTreinosStore = create<TreinosState>((set) => ({
  mainTab: 'exercicios',
  subTab: 'exercicios-lista',
  deckLetter: 'A',
  deckPage: 1,
  deckView: 'royale', // db.js L45: default 'royale'
  exView: 'colecao', // db.js L47: default 'colecao'
  filter: 'all',
  search: '',
  deckSearch: '',
  setMainTab: (mainTab) => set({ mainTab }),
  setSubTab: (subTab) => set({ subTab }),
  setDeckLetter: (deckLetter) => set({ deckLetter }),
  setDeckPage: (deckPage) => set({ deckPage }),
  setDeckView: (deckView) => set({ deckView }),
  setExView: (exView) => set({ exView }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  setDeckSearch: (deckSearch) => set({ deckSearch }),
}));
