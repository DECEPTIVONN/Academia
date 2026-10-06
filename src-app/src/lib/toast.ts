/**
 * toast.ts — Notificações flutuantes (espelha `showToast` de JS/treino/db.js)
 * Usa o container #toastContainer (adicionado no App) e as classes .toast.* do CSS legado.
 */

export type ToastType = 'success' | 'error' | 'info';

export function showToast(msg: string, type: ToastType = 'success'): void {
  const tc = document.getElementById('toastContainer');
  if (!tc) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => {
    t.classList.add('fade-out');
    setTimeout(() => t.remove(), 350);
  }, 3000);
}
