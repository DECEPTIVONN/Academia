/**
 * motion-presets.ts — Springs compartilhados (Motion v12 / Framer Motion)
 *
 * Motor de física do Motion: cada animação é um sistema massa-mola-damping.
 * Propriedade-chave (pedido premium v4.8.0): INTERRUPÇÃO NATURA — quando uma
 * nova animação/alvo assuming um MotionValue em voo, ela parte da posição E da
 * velocidade atuais (absorve o gesto) em vez de resetar.
 *
 * Ajuste (ζ = damping / 2√(stiffness·mass)):
 *   SETTLE  ζ≈0.95 — quase crítico, assenta sem overshoot (overshoot do strip
 *           de 50vw exporia a borda da fita; por isso ~criticodamped).
 *   EXIT    ζ≈1.05 — firme e curto, "empurra" o slide antigo para fora.
 */

import type { Transition } from 'motion/react';

/** Assentamento padrão de seções/abas — suave, sem overshoot visível. */
export const SPRING_SETTLE: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 36,
  mass: 0.9,
};

/** Saída de slide — mais firme/curta que o assentamento. */
export const SPRING_EXIT: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 42,
  mass: 0.9,
};

/** Micro-interações (botões, dots, painéis). */
export const SPRING_SOFT: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.85,
};
