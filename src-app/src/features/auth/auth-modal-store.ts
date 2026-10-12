/**
 * auth-modal-store.ts — Estado global do modal de autenticação (v4.9.0-sync)
 *
 * O modal abre pelos tiles/linhas das Configurações (rootExtra "Entrar")
 * e fecha sozinho após login/cadastro com sucesso.
 */

import { create } from 'zustand';

interface AuthModalState {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  open: false,
  openModal: () => set({ open: true }),
  closeModal: () => set({ open: false }),
}));
