/**
 * maestria.ts — Maestria de exercícios (port 1:1 de JS/treino/secao-treinos.js
 * L698–822 + MAESTRIA_CHALLENGES de JS/treino/db.js L13–38)
 *
 * Fonte de verdade: `legacy.maestrias[exId].totalSessoes` (cópia bruta em
 * legacyState), escrita via patchLegacyState. O modal `modalLevelUp` do legado
 * não existe no DOM (showLevelUpModal é um no-op) — port apenas o contador.
 */

import { patchLegacyState } from '@/core/db/legacy-state';
import type { LegacyRaw } from '@/core/db/queries';
import type { Exercise } from '@/core/db/schema';

/* ── Desafios (db.js L13–38, literais) ── */

interface MaestriaSub {
  id: number;
  label: string;
  desc: string;
  target: number;
}

interface MaestriaChallengeDef {
  id: number;
  badge: 'bronze' | 'prata' | 'ouro';
  label: string;
  icon: string;
  subDesafios: MaestriaSub[];
}

const ICON_FLAME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:#f97316;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
const ICON_SWORDS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:#94a3b8;"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19 19 13"/><path d="M9.5 17.5 21 6V3h-3L6.5 14.5"/><path d="M11 19 5 13"/></svg>`;
const ICON_CROWN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:#fbbf24;"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/></svg>`;

export const MAESTRIA_CHALLENGES: MaestriaChallengeDef[] = [
  {
    id: 1,
    badge: 'bronze',
    label: 'Desafio de Bronze',
    icon: ICON_FLAME,
    subDesafios: [
      { id: 1, label: 'Primeiros Passos', desc: 'Complete este exercício 5 vezes', target: 5 },
      { id: 2, label: 'Desenvolvendo Força', desc: 'Complete este exercício 15 vezes', target: 15 },
      { id: 3, label: 'Consistência', desc: 'Complete este exercício 30 vezes', target: 30 },
    ],
  },
  {
    id: 2,
    badge: 'prata',
    label: 'Desafio de Prata',
    icon: ICON_SWORDS,
    subDesafios: [
      { id: 1, label: 'Dedicado', desc: 'Complete este exercício 50 vezes', target: 50 },
      { id: 2, label: 'Veterano', desc: 'Complete este exercício 75 vezes', target: 75 },
      { id: 3, label: 'Especialista', desc: 'Complete este exercício 100 vezes', target: 100 },
    ],
  },
  {
    id: 3,
    badge: 'ouro',
    label: 'Desafio de Ouro',
    icon: ICON_CROWN,
    subDesafios: [
      { id: 1, label: 'Elite', desc: 'Complete este exercício 150 vezes', target: 150 },
      { id: 2, label: 'Lendário', desc: 'Complete este exercício 200 vezes', target: 200 },
      { id: 3, label: 'Maestria Plena', desc: 'Complete este exercício 300 vezes', target: 300 },
    ],
  },
];

/* ── Estado (getMaestriaState L698–725) ── */

export interface MaestriaState {
  totalSessoes: number;
  badgeLevel: number; // 0 nenhum · 1 bronze · 2 prata · 3 ouro
  challenges: Array<
    MaestriaChallengeDef & {
      locked: boolean;
      completed: boolean;
      subDesafios: Array<MaestriaSub & { current: number; completed: boolean }>;
    }
  >;
}

function readDevMode(): boolean {
  try {
    return localStorage.getItem('academia_dev_mode') === 'true';
  } catch {
    return false;
  }
}

export function getMaestriaState(legacy: LegacyRaw | null, exId: string): MaestriaState {
  let sessoes = legacy?.maestrias?.[exId]?.totalSessoes ?? 0;

  if (readDevMode()) {
    sessoes = Math.max(sessoes, MAESTRIA_CHALLENGES[2].subDesafios[2].target);
  }

  const challenges = MAESTRIA_CHALLENGES.map((ch, i) => {
    const prevTarget = i === 0 ? 0 : MAESTRIA_CHALLENGES[i - 1].subDesafios[2].target;
    const locked = sessoes < prevTarget;
    const subDesafios = ch.subDesafios.map((sub) => ({
      ...sub,
      current: Math.min(sessoes, sub.target),
      completed: sessoes >= sub.target,
    }));
    const completed = subDesafios.every((s) => s.completed);
    return { ...ch, locked, completed, subDesafios };
  });

  let badgeLevel = 0;
  if (sessoes >= MAESTRIA_CHALLENGES[0].subDesafios[2].target) badgeLevel = 1;
  if (sessoes >= MAESTRIA_CHALLENGES[1].subDesafios[2].target) badgeLevel = 2;
  if (sessoes >= MAESTRIA_CHALLENGES[2].subDesafios[2].target) badgeLevel = 3;

  return { totalSessoes: sessoes, badgeLevel, challenges };
}

/* ── Registro de sessões (trackMaestriaSessoes L727–750) ── */

/**
 * Incrementa `totalSessoes` de cada exercício (sem `ae-*`) e persiste.
 * O legado também dispara `showLevelUpModal`, mas o DOM `#modalLevelUp` não
 * existe no HTML legado — efeito visual inexistente, mantido de fora.
 */
export async function trackMaestriaSessoes(
  legacy: LegacyRaw | null,
  exIds: string[]
): Promise<void> {
  const alvos = exIds.filter((id) => !id.startsWith('ae-'));
  if (alvos.length === 0) return;

  const maestrias: NonNullable<LegacyRaw['maestrias']> = {
    ...(legacy?.maestrias ?? {}),
  };
  let changed = false;
  for (const exId of alvos) {
    const atual = maestrias[exId] ?? { totalSessoes: 0 };
    maestrias[exId] = { ...atual, totalSessoes: (atual.totalSessoes ?? 0) + 1 };
    changed = true;
  }
  if (changed) await patchLegacyState({ maestrias });
}

/* ── Ranking global (updateGlobalMasteryUI L794–822) ── */

export interface MasteryRank {
  level: number;
  title: string;
  next: number;
}

function getRank(xp: number): MasteryRank {
  if (xp < 10) return { level: 1, title: 'PRATICANTE', next: 10 };
  if (xp < 30) return { level: 2, title: 'ESPECIALISTA EM TREINO', next: 30 };
  if (xp < 60) return { level: 3, title: 'MESTRE DE EXECUÇÃO', next: 60 };
  if (xp < 100) return { level: 4, title: 'GRÃO-MESTRE DE FORÇA', next: 100 };
  const lvl = Math.floor(xp / 25) + 1;
  return { level: lvl, title: 'LENDA DA MAESTRIA', next: lvl * 25 };
}

export interface MasteryTotals {
  totalXP: number;
  rank: MasteryRank;
  pct: number;
}

/** XP global = soma dos níveis de badge (ouro/prata/bronze) de todos os exercícios. */
export function computeMasteryTotals(
  exercises: Exercise[],
  legacy: LegacyRaw | null
): MasteryTotals {
  let totalXP = 0;
  exercises.forEach((ex) => {
    totalXP += getMaestriaState(legacy, ex.id).badgeLevel;
  });
  const rank = getRank(totalXP);
  const pct = Math.min(100, (totalXP / rank.next) * 100);
  return { totalXP, rank, pct };
}
