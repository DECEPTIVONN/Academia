/**
 * animations.ts — Utilitários de transição de seção
 * fadeIn: re-dispara a classe `ui-fade-in` (280ms) + reinicia stagger dos filhos.
 * fadeSwap: fade-out (120ms) → callback → fade-in (cross-fade de conteúdo).
 * slideSwap (v4.6.0-shell): transição DIRECional via Web Animations API —
 *   sai p/ esquerda e a nova entra da direita (ou o espelho, conforme a ordem
 *   progresso → treinos → dashboard → social → loja).
 *
 * Divergência consciente em relação ao legado (CHANGELOG v4.6.0-shell):
 * o legado troca seções com fadeSwap (120ms + fadeIn). Aqui usamos slide
 * direcional com easing "spring" no mobile (quint-out: pegada de spring SEM
 * overshoot — overshoot negativo vaza o fundo pela borda da fita de 500vw) e
 * cúbica padrão no desktop. O commit do React é forçado com flushSync para
 * que a animação de entrada sobreponha a de saída SEM frame de "pulo".
 */

import { flushSync } from 'react-dom';

export type SlideDirection = 'forward' | 'backward';

/** Distância do slide (limitada para não "afastar" demais o conteúdo). */
function slideDistance(): number {
  return Math.min(96, Math.round(window.innerWidth * 0.08));
}

function isDesktopShell(): boolean {
  return window.matchMedia?.('(min-width: 1024px)').matches ?? false;
}

export function slideSwap(
  strip: HTMLElement | null | undefined,
  updateCallback: () => void,
  direction: SlideDirection
): void {
  if (!strip) {
    updateCallback();
    return;
  }

  // Cancela qualquer animação anterior (evita overlaps em trocas rápidas)
  const running = strip.getAnimations?.();
  running?.forEach((a) => a.cancel());

  const dist = slideDistance();
  const sign = direction === 'forward' ? 1 : -1;
  const desktop = isDesktopShell();

  // Mobile: spring-ish (quint-out). Desktop: cúbica padrão de shell.
  const inEasing = desktop
    ? 'cubic-bezier(0.4, 0, 0.2, 1)'
    : 'cubic-bezier(0.22, 1, 0.36, 1)';
  const outEasing = 'cubic-bezier(0.4, 0, 0.9, 0.4)';
  const outDur = desktop ? 200 : 220;
  const inDur = desktop ? 320 : 340;

  const out = strip.animate(
    [
      { transform: 'translateX(0)', opacity: 1 },
      { transform: `translateX(${-sign * dist}px)`, opacity: 0.15 },
    ],
    { duration: outDur, easing: outEasing, fill: 'forwards' }
  );

  out.onfinish = () => {
    // Commit síncrono: o DOM já entrega a nova seção antes do próximo paint
    flushSync(updateCallback);

    // Entrada criada ANTES de cancelar a saída: sem frame de "pulo" no centro
    const enter = strip.animate(
      [
        { transform: `translateX(${sign * dist}px)`, opacity: 0.15 },
        { transform: 'translateX(0)', opacity: 1 },
      ],
      { duration: inDur, easing: inEasing, fill: 'backwards' }
    );
    out.cancel();

    enter.onfinish = () => {
      enter.cancel(); // estilo base volta (sem resíduo de transform/opacity)
    };
  };
}

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
