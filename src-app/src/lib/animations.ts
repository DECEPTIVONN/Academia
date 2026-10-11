/**
 * animations.ts — Utilitários de transição de seção
 *
 * v4.8.0-premium-motion: slideSwap passa a usar o motor de física do Motion
 * (Framer Motion, springs) sobre MotionValues ligados ao .section-strip.
 * Diferenças em relação à versão WAAPI (v4.6.0-shell):
 *   • springs reais no lugar de cubic-beziers fixos (desktop e mobile);
 *   • INTERRUPÇÃO NATURA: um novo toque/clique no meio da animação retargeta
 *     a mesma mola a partir da posição E velocidade atuais — nada reseta;
 *   • o swipe virou arrasto contínuo (o dedo move a fita em tempo real) e o
 *     release decide por posição + velocidade (fling), com snap em mola.
 *
 * fadeIn/fadeSwap seguem CSS (paridade com as micro-animações legadas).
 */

import { animate, type AnimationPlaybackControls, type MotionValue } from 'motion/react';
import { flushSync } from 'react-dom';
import { SPRING_EXIT, SPRING_SETTLE } from '@/lib/motion-presets';

export type SlideDirection = 'forward' | 'backward';

/* Época do swap: cancela commits/finish handlers de swaps superseded. */
let swapEpoch = 0;
let running: AnimationPlaybackControls[] = [];

/** Distância do slide (limitada para não "afastar" demais o conteúdo). */
function slideDistance(): number {
  return Math.min(120, Math.round(window.innerWidth * 0.1));
}

function stopRunning(): void {
  running.forEach((c) => c.stop());
  running = [];
}

/**
 * Interrompe qualquer swap em voo (sem commit pendente) e assenta em repouso.
 * Usado pelo arrasto ao assumir o gesto e pelo clique na seção ativa.
 */
export function snapSlideHome(x: MotionValue<number>, opacity: MotionValue<number>): void {
  swapEpoch += 1;
  stopRunning();
  animate(x, 0, SPRING_SETTLE);
  animate(opacity, 1, SPRING_SETTLE);
}

/**
 * Interrompe animações em voo MANTENDO o valor atual (o gesto assume o
 * controle da fita — sem snap para casa). Commits pendentes são invalidados.
 */
export function holdSlide(): void {
  swapEpoch += 1;
  stopRunning();
}

/**
 * Transição direcional em mola: saída em SPRING_EXIT → commit síncrono do
 * conteúdo → entrada em SPRING_SETTLE a partir de +sign·dist (o novo slide
 * entra pelo lado "correto", como um pager).
 */
export function slideSwap(
  x: MotionValue<number>,
  opacity: MotionValue<number>,
  updateCallback: () => void,
  direction: SlideDirection
): void {
  const epoch = ++swapEpoch;
  stopRunning();

  const dist = slideDistance();
  const sign = direction === 'forward' ? 1 : -1;
  const outDir = -sign;
  const current = x.get();

  /* Se o arrasto já levou a fita além da borda, NÃO puxa de volta —
     sai do ponto em que o dedo largou (continuidade do gesto). */
  const alreadyOut = Math.sign(current) === outDir && Math.abs(current) >= dist;
  const outTarget = alreadyOut ? current : outDir * dist;

  const outX = animate(x, outTarget, SPRING_EXIT);
  const outO = animate(opacity, 0.28, SPRING_EXIT);
  running = [outX, outO];

  outX.finished.then(() => {
    if (epoch !== swapEpoch) return; // superseded por outro swap/arrasto
    running = [];

    // Commit síncrono: o DOM entrega a nova seção antes do próximo paint
    flushSync(updateCallback);

    // Entra pelo lado oposto (teleporte com opacity baixa — metáfora pager)
    x.jump(sign * dist);
    const inX = animate(x, 0, SPRING_SETTLE);
    const inO = animate(opacity, 1, SPRING_SETTLE);
    running = [inX, inO];

    inX.finished.then(() => {
      if (epoch !== swapEpoch) return;
      running = [];
    });
  });
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
