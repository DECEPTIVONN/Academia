/**
 * animations.ts — Utilitários de fade (port 1:1 de JS/treino/db.js L603–644)
 * fadeIn: re-dispara a classe `ui-fade-in` (280ms) + reinicia stagger dos filhos.
 * fadeSwap: fade-out (120ms) → callback → fade-in (cross-fade de conteúdo).
 */

export function fadeIn(...elements: (HTMLElement | null | undefined)[]): void {
  elements.forEach((el) => {
    if (!el) return;
    el.classList.remove('ui-fade-in');
    el.classList.remove('ui-fade-out');
    void el.offsetWidth; // Força reflow no navegador
    el.classList.add('ui-fade-in');

    // Reinicia também a animação dos filhos com entrada escalonada (stagger)
    el.querySelectorAll('.stagger-item').forEach((child) => {
      const c = child as HTMLElement;
      c.style.animation = 'none';
      void c.offsetWidth;
      c.style.animation = '';
    });
  });
}

export function fadeSwap(
  element: HTMLElement | null | undefined,
  updateCallback: () => void
): void {
  if (!element) {
    updateCallback();
    return;
  }
  element.classList.remove('ui-fade-in');
  element.classList.add('ui-fade-out');

  // O fade-out dura 0.12s (120ms), aguardamos esse período para trocar o conteúdo
  window.setTimeout(() => {
    updateCallback();
    element.classList.remove('ui-fade-out');
    fadeIn(element);
  }, 120);
}
