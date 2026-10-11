/**
 * animations.ts — Utilitários de transição de seção
 *
 * v4.8.3.2-parity-slide: as 5 seções ficam PRÉ-MONTADAS na fita
 * (.section-strip 500vw, paridade com o legado 7-nav-icons.css) — a troca
 * de seção no mobile é um slide lateral puro de translateX entre índices de
 * viewport (sem remount/flushSync no meio da animação, sem dip de opacidade).
 * O commit do estado (activeSection) acontece NO INÍCIO do slide (o destaque
 * da nav acompanha o gesto, como no legado).
 *
 * Desktop (≥1024px): a fita fica estática (x=0, slides inativos display:none
 * via shell.css) e a troca usa verticalSwap — o conteúdo da aba entra de
 * baixo para cima (transitionguide.md: 300ms, ease suave).
 *
 * Interrupção natural preservada: um novo toque/clique no meio do slide
 * retargeta a mesma mola a partir da posição E velocidade atuais.
 */

import { animate, type AnimationPlaybackControls, type MotionValue } from 'motion/react';
import { flushSync } from 'react-dom';
import { SPRING_SLIDE } from '@/lib/motion-presets';

/* Época do swap: cancela commits/finish handlers de swaps superseded. */
let swapEpoch = 0;
let running: AnimationPlaybackControls[] = [];

function stopRunning(): void {
  running.forEach((c) => c.stop());
  running = [];
}

/**
 * Assenta a fita em repouso (snap para a seção base).
 * Usado pelo arrasto cancelado e pelo clique na seção ativa.
 */
export function snapSlideHome(x: MotionValue<number>, targetX: number): void {
  const epoch = ++swapEpoch;
  stopRunning();
  const a = animate(x, targetX, SPRING_SLIDE);
  running = [a];
  a.finished.then(() => {
    if (epoch !== swapEpoch) return;
    running = [];
  });
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
 * Slide lateral até targetX (índice de destino × -innerWidth).
 * O conteúdo já está montado — o commit é imediato (flushSync no início)
 * e a mola move a fita sem trava de reflow no meio do caminho.
 */
export function slideSwap(
  x: MotionValue<number>,
  targetX: number,
  updateCallback: () => void
): void {
  const epoch = ++swapEpoch;
  stopRunning();

  // Commit no início: activeSection/destaque da nav atualizam junto ao slide
  flushSync(updateCallback);

  const a = animate(x, targetX, SPRING_SLIDE);
  running = [a];
  a.finished.then(() => {
    if (epoch !== swapEpoch) return;
    running = [];
  });
}

/**
 * Desktop: o conteúdo da aba entra de baixo para cima (transitionguide.md).
 * Só o slide ativo está visível (display:none dos inativos via shell.css),
 * então não há sobreposição — o antigo some e o novo sobe com fade.
 */
export function verticalSwap(el: HTMLElement | null): void {
  if (!el) return;
  el.animate(
    [
      { opacity: 0, transform: 'translateY(18px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { duration: 300, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }
  );
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
