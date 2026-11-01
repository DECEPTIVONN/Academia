/**
 * motion-presets.ts — Springs compartilhados (Motion v12 / Framer Motion)
 *
 * Motor de física do Motion: cada animação é um sistema massa-mola-damping.
 * Propriedade-chave (pedido premium v4.8.0): INTERRUPÇÃO NATURA — quando uma
 * nova animação/alvo assuming um MotionValue em voo, ela parte da posição E da
 * velocidade atuais (absorve o gesto) em vez de resetar.
 *
 * Ajuste (ζ = damping / 2√(stiffness·mass)) — calibrados contra o
 * transitionguide.md (duração-alvo ~300ms, easeInOut suave):
 *   SETTLE  ζ≈0.87 — quase crítico com micro-overshoot (<1 px na fita);
 *           período natural ~390 ms → assentamento fluido, sem "travar".
 *   EXIT    ζ≈0.85 — firme e curto, empurra o slide antigo com leve resiliência.
 *   SOFT    ζ≈0.85 — micro-interações com toque macio.
 */

import type { Transition } from 'motion/react';

/** Assentamento padrão de seções/abas — fluido, overshoot imperceptível. */
export const SPRING_SETTLE: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 28,
  mass: 1,
};

/** Saída de slide — mais firme/curta que o assentamento, com leve resiliência. */
export const SPRING_EXIT: Transition = {
  type: 'spring',
  stiffness: 340,
  damping: 32,
  mass: 1,
};

/** Micro-interações (botões, dots, painéis). */
export const SPRING_SOFT: Transition = {
  type: 'spring',
  stiffness: 220,
  damping: 24,
  mass: 0.9,
};

/** Slide lateral da fita mobile (1 viewport) — glide de ~430 ms, crítico.
 *  v4.8.3.2: a fita pré-monta as 5 seções (paridade legado) e o x move
 *  entre índices de viewport.
 *
 *  v4.63.0 — troca de aba mais suave/profissional: a mola antiga
 *  (380/38, ωn≈19.5 rad/s) completava em ~340 ms e, num toque na barra
 *  inferior, partia e parava quase secas. A nova (230/30, ζ≈0.99,
 *  ωn≈15.2 rad/s) parte mais macia, desacelera por mais tempo e continua
 *  sendo criticamente amortecida (sem quique/overshoot, o que dava
 *  impressão de "borracha" no meio da tela). */
export const SPRING_SLIDE: Transition = {
  type: 'spring',
  stiffness: 230,
  damping: 30,
  mass: 1,
};
