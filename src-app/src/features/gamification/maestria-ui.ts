/**
 * maestria-ui.ts — Estado dos modais de maestria (Fase 3)
 * Espelha as transições imperativas do legado:
 *  - openColecaoExercicios (secao-treinos.js L877–931) → #modalColecaoExercicios
 *  - card da coleção → closeModal(coleção) + openMaestriaExercicio → #modalMaestriaEx
 *  - footer da maestria (modais.html L895) → closeModal(maestriaEx) + openColecao
 */

import { create } from 'zustand';

interface MaestriaUiState {
  colecaoOpen: boolean;
  /** id do exercício no modal de maestria individual, ou null. */
  maestriaExId: string | null;
  /** Termo do #colecaoSearch (no legado o valor persiste no DOM entre aberturas). */
  search: string;
  openColecao: () => void;
  closeColecao: () => void;
  openMaestriaEx: (exId: string) => void;
  closeMaestriaEx: () => void;
  backToColecao: () => void;
  setSearch: (value: string) => void;
}

export const useMaestriaUi = create<MaestriaUiState>((set) => ({
  colecaoOpen: false,
  maestriaExId: null,
  search: '',
  openColecao: () => set({ colecaoOpen: true }),
  closeColecao: () => set({ colecaoOpen: false }),
  openMaestriaEx: (exId) => set({ maestriaExId: exId, colecaoOpen: false }),
  closeMaestriaEx: () => set({ maestriaExId: null }),
  backToColecao: () => set({ maestriaExId: null, colecaoOpen: true }),
  setSearch: (value) => set({ search: value }),
}));
