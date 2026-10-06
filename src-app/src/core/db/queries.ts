/**
 * queries.ts — Consultas e helpers compartilhados sobre o banco local (offline-first)
 *
 * Concentra a leitura de exercises/sheets/history/cópia bruta legada e os
 * helpers de derivação que espelham as funções do legado (JS/treino/db.js e
 * secao-dashboard.js), para as features (Dashboard, Ficha, Progresso)
 * consumirem o mesmo contrato.
 */

import { idb, getUserSheets } from '@/core/db/idb';
import { LOCAL_USER_ID } from '@/core/db/schema';
import type {
  Exercise,
  WorkoutSheet,
  WorkoutHistory,
  SheetKey,
  ProfileCustomization,
  ProfileConquista,
} from '@/core/db/schema';

export const SHEET_ORDER: SheetKey[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const LEGACY_DB_KEY = 'academia_treino';

/** Estado bruto da v3.5.7 (mesmo shape do localStorage `academia_treino`). */
export interface LegacyRaw {
  /** Maestria por exercício (legado: `db.maestrias[exId].totalSessoes`). */
  maestrias?: Record<
    string,
    { totalSessoes?: number; nivel?: number; challenges?: unknown[] }
  >;
  currentCycleStartDate?: string;
  currentCycleBreakdown?: Record<string, number>;
  currentFichaWorkouts?: number;
  /** Exercícios brutos legados (fallback de `historicoCargas` na edição). */
  exercicios?: {
    id: string;
    historicoCargas?: { data: string; valor: number; label: string }[];
    [other: string]: unknown;
  }[];
  /** Fichas/aeróbicos brutos legados (snapshot do `startNewCycle` dos templates). */
  fichas?: Record<string, unknown>;
  aerobicos?: Record<string, unknown>;
  fichasArquivadas?: unknown[];
  profileCustomization?: Partial<ProfileCustomization>;
  selectedEmblems?: string[];
  conquistas?: ProfileConquista[];
  prestige?: number;
  radarTier?: number;
  dashboard?: { suggestedWorkout?: string; lastSuggestionDate?: string };
  cycleEvents?: Record<string, string>;
  [other: string]: unknown;
}

export interface LocalData {
  exercises: Exercise[];
  sheets: WorkoutSheet[];
  history: WorkoutHistory[];
  legacy: LegacyRaw | null;
}

export const EMPTY_LOCAL_DATA: LocalData = {
  exercises: [],
  sheets: [],
  history: [],
  legacy: null,
};

/* ── Carregamento ── */

export async function loadLocalData(): Promise<LocalData> {
  const [exercises, sheets, history, legacyRow] = await Promise.all([
    idb.exercises.toArray(),
    getUserSheets(LOCAL_USER_ID),
    idb.workoutHistory.where('userId').equals(LOCAL_USER_ID).toArray(),
    idb.legacyState.get(LEGACY_DB_KEY),
  ]);

  return {
    exercises,
    sheets,
    history,
    legacy: (legacyRow?.value as LegacyRaw | undefined) ?? null,
  };
}

/* ── Derivações (espelham o legado) ── */

export function getExerciseMap(exercises: Exercise[]): Map<string, Exercise> {
  return new Map(exercises.map((e) => [e.id, e]));
}

/** Espelha `getExById` do legado. */
export function pickExercises(ids: string[], map: Map<string, Exercise>): Exercise[] {
  return ids.map((id) => map.get(id)).filter((e): e is Exercise => Boolean(e));
}

/** `today()` do legado — data LOCAL (YYYY-MM-DD), não UTC. */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Espelha `grupoBadgeClass` (db.js L551-553). */
const GRUPO_BADGE_MAP: Record<string, string> = {
  í: 'i',
  é: 'e',
  ó: 'o',
  á: 'a',
  ã: 'o',
  â: 'e',
};
export function grupoBadgeClass(grupo?: string): string {
  return 'grupo-badge badge-' + (grupo || '').replace(/[íéóáãâ]/g, (c) => GRUPO_BADGE_MAP[c] ?? c);
}

/** Espelha `formatCarga` (db.js). */
export function formatCarga(ex: Pick<Exercise, 'load' | 'porLado' | 'tags'>): string {
  if (ex.tags?.includes('Peso do Corpo')) return 'Peso do Corpo';
  if (!ex.load) return '';
  const c = String(ex.load).trim();
  const label = c.toLowerCase().endsWith('kg') ? c : `${c}kg`;
  return ex.porLado ? `${label} cada lado` : label;
}

/** Espelha `formatSeconds` (db.js L395). */
export function formatSeconds(seconds: number): string {
  if (!seconds) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Espelha `getStreak` — sequência de dias consecutivos concluídos (termina hoje ou ontem). */
export function getStreak(history: WorkoutHistory[]): number {
  const done = new Set(history.filter((h) => h.completed).map((h) => h.date));
  let streak = 0;
  const cursor = new Date();
  if (!done.has(fmtDate(cursor))) cursor.setDate(cursor.getDate() - 1); // ontem ainda conta
  while (done.has(fmtDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** XP do Dashboard legado: nº de dias concluídos × 10. */
export function getXp(history: WorkoutHistory[]): number {
  return history.filter((h) => h.completed).length * 10;
}

export function getLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

/** Espelha `determineTreinoDoDia` — próxima ficha não-vazia após o último treino CONCLUÍDO. */
export function determineNextTreino(data: LocalData): SheetKey {
  const hist = [...data.history].sort((a, b) => b.date.localeCompare(a.date));

  for (const entry of hist) {
    const keys =
      entry.completedKeys && entry.completedKeys.length
        ? entry.completedKeys
        : entry.completed && entry.sheetKey
          ? [entry.sheetKey]
          : [];
    if (keys.length > 0) {
      const lastTreino = keys[keys.length - 1];
      const currentIdx = SHEET_ORDER.indexOf(lastTreino as SheetKey);
      if (currentIdx === -1) continue;
      for (let i = 1; i <= SHEET_ORDER.length; i++) {
        const next = SHEET_ORDER[(currentIdx + i) % SHEET_ORDER.length];
        const sheet = data.sheets.find((s) => s.sheetKey === next);
        const temExercicios = (sheet?.exerciseIds?.length ?? 0) > 0;
        const temCardio = Boolean(sheet?.aerobic?.tipo);
        if (temExercicios || temCardio) return next;
      }
      return lastTreino as SheetKey;
    }
  }
  return 'A';
}

/** Espelha `getTodayTreino`: treino gravado hoje, senão `determineTreinoDoDia`. */
export function getTodayTreino(data: LocalData): SheetKey {
  const activeToday = data.history.find((h) => h.date === today())?.sheetKey;
  if (activeToday) return activeToday;
  return determineNextTreino(data);
}

/** Progresso do Ciclo (30 treinos) — espelha o recálculo fresco de `renderProgresso`
 *  (secao-progresso.js): contagem de DIAS concluídos desde `currentCycleStartDate`
 *  e breakdown por letra recalculado do histórico (fonte única de verdade). */
export function getCycleStats(data: LocalData): {
  done: number;
  total: number;
  percent: number;
  breakdown: Record<string, number>;
  startDate: string;
} {
  const total = 30;
  const startDate = data.legacy?.currentCycleStartDate ?? today();

  const doneRows = data.history.filter((h) => h.completed && h.date >= startDate);
  const done = doneRows.length;

  const breakdown: Record<string, number> = {};
  for (const key of SHEET_ORDER) breakdown[key] = 0;
  for (const row of doneRows) {
    const keys =
      row.completedKeys?.length ? row.completedKeys : row.sheetKey ? [row.sheetKey] : [];
    for (const key of keys) {
      if (key in breakdown) breakdown[key] += 1;
    }
  }

  const capped = Math.min(done, total);
  return {
    done,
    total,
    percent: Math.round((capped / total) * 100),
    breakdown,
    startDate,
  };
}

/** Volume médio de carga de uma ficha (usado no footer do seletor do Dashboard). */
export function getAverageLoad(ids: string[], map: Map<string, Exercise>): number | null {
  const values = pickExercises(ids, map)
    .map((ex) => parseFloat(String(ex.load).replace(',', '.')))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/** Nº de exercícios "mastered" (nível ≥ 3 na maestria legada). */
export function getMasteredCount(legacy: LegacyRaw | null): number {
  if (!legacy?.maestrias) return 0;
  return Object.values(legacy.maestrias).filter((m) => (m?.nivel ?? 0) >= 3).length;
}

/** Data por extenso em pt-BR (espelha `todayLabel`). */
export function todayLabel(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/* ── Entrada de hoje (checks / séries / conclusão) — espelham JS/treino/db.js ── */

/** Entrada do histórico de HOJE; cria uma vazia se ainda não existe (offline-first). */
export function getTodayEntry(data: LocalData): WorkoutHistory {
  const t = today();
  return (
    data.history.find((h) => h.date === t) ?? {
      userId: LOCAL_USER_ID,
      date: t,
      sheetKey: null,
      completed: false,
      checks: [],
      seriesDone: {},
      completedKeys: [],
      durationMin: null,
    }
  );
}

export interface FichaMutation {
  entry: WorkoutHistory;
  /** Timer de descanso sugerido (s), 'stop' para parar, ou undefined (não mexer). */
  rest?: number | 'stop';
}

function cloneEntry(e: WorkoutHistory): WorkoutHistory {
  const seriesDone: Record<string, boolean[]> = {};
  for (const [id, arr] of Object.entries(e.seriesDone ?? {})) seriesDone[id] = [...arr];
  return {
    ...e,
    checks: [...e.checks],
    seriesDone,
    completedKeys: e.completedKeys ? [...e.completedKeys] : [],
  };
}

/** Espelha `toggleCheck` (db.js): marcar/desmarcar exercício concluído. */
export function toggleCheckEntry(
  base: WorkoutHistory,
  exId: string,
  exercise?: Pick<Exercise, 'sets'>
): FichaMutation {
  const e = cloneEntry(base);
  const idx = e.checks.indexOf(exId);

  if (idx === -1) {
    e.checks.push(exId);
    if (!exId.startsWith('ae-') && exercise) {
      e.seriesDone![exId] = new Array(exercise.sets || 0).fill(true);
    }
    return { entry: e, rest: 60 };
  }

  e.checks.splice(idx, 1);
  if (!exId.startsWith('ae-') && e.seriesDone![exId]) {
    e.seriesDone![exId] = e.seriesDone![exId].map(() => false);
  }
  return { entry: e, rest: 'stop' };
}

/** Espelha `toggleSeriesSet` (db.js): marcar/desmarcar uma série. */
export function toggleSetEntry(
  base: WorkoutHistory,
  exId: string,
  setIdx: number,
  exercise: Pick<Exercise, 'sets' | 'rest'>
): FichaMutation {
  const e = cloneEntry(base);
  const sd = e.seriesDone!;
  if (!sd[exId]) sd[exId] = new Array(exercise.sets || 0).fill(false);
  sd[exId][setIdx] = !sd[exId][setIdx];

  const allSetsDone = sd[exId].every(Boolean);
  const idx = e.checks.indexOf(exId);

  if (allSetsDone) {
    if (idx === -1) e.checks.push(exId);
    return { entry: e, rest: 60 };
  }

  if (idx !== -1) e.checks.splice(idx, 1);
  if (sd[exId][setIdx]) {
    const secs = exercise.rest !== undefined && exercise.rest !== null
      ? parseInt(String(exercise.rest), 10)
      : 30;
    if (secs > 0) return { entry: e, rest: secs };
  }
  return { entry: e };
}

/** Espelha `setTodayTreino` (db.js): trocar a ficha ativa de hoje. */
export function selectSheetEntry(base: WorkoutHistory, letter: SheetKey): WorkoutHistory {
  const e = cloneEntry(base);
  e.sheetKey = letter;
  e.completed = (e.completedKeys ?? []).includes(letter);
  return e;
}

/** Espelha o bloco de conclusão de secao-ficha.js: concluido + treinos[] atômicos. */
export function applyFichaCompletion(
  base: WorkoutHistory,
  letter: SheetKey,
  fichaIds: string[],
  hasAerobic: boolean
): WorkoutHistory {
  const e = cloneEntry(base);
  const aeId = `ae-${letter}`;
  const allDone =
    fichaIds.length > 0 &&
    fichaIds.every((id) => e.checks.includes(id)) &&
    (!hasAerobic || e.checks.includes(aeId));

  if (allDone) {
    const keys = e.completedKeys ?? [];
    if (!keys.includes(letter)) keys.push(letter);
    e.completedKeys = keys;
    e.completed = true;
  } else {
    e.completed = false;
  }
  return e;
}

export type { SheetKey };
