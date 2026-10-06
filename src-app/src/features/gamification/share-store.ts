/**
 * share-store.ts — Estado do modal de compartilhamento `#modalShare` (Fase 3)
 * Port de `openShareCard` (secao-perfil.js L702–762), `openShareBadge`
 * (secao-progresso.js L1261–1276) e `shareRadar` (secao-perfil.js L888–911):
 * o modal tem 3 cards alternados (treino / conquista / radar).
 */

import { create } from 'zustand';
import { QUOTES } from './share-quotes';

export type ShareKind = 'treino' | 'conquista' | 'radar';

export interface ShareBadge {
  icon: string;
  name: string;
  desc: string;
}

interface ShareState {
  show: boolean;
  kind: ShareKind;
  badge: ShareBadge | null;
  /** Frase aleatória escolhida na abertura (L754/L1266/L889). */
  quote: string;
  openTreino: () => void;
  openBadge: (badge: ShareBadge) => void;
  openRadar: () => void;
  close: () => void;
}

function randomQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

export const useShareStore = create<ShareState>((set) => ({
  show: false,
  kind: 'treino',
  badge: null,
  quote: randomQuote(),
  openTreino: () => set({ show: true, kind: 'treino', badge: null, quote: randomQuote() }),
  openBadge: (badge) => set({ show: true, kind: 'conquista', badge, quote: randomQuote() }),
  openRadar: () => set({ show: true, kind: 'radar', badge: null, quote: randomQuote() }),
  close: () => set({ show: false }),
}));
