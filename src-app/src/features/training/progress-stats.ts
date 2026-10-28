/**
 * progress-stats.ts — derivações da aba Progresso
 *
 * Concentra os cálculos que nasceram junto com a Central de Ofensivas e com as
 * seções novas da aba Progresso (sequência de SEMANAS, constância em DIAS,
 * resumo da semana, heatmap anual de séries, tendências e pontuação de força)
 * para que `ProgressoFeature` e `OfensivasOverlay` consumam o mesmo contrato —
 * nenhuma regra duplicada entre eles.
 *
 * Módulo puro (só leitura de dados): recebe `LocalData` e devolve números/datas.
 * A formatação (unidades, cores, rótulos longos) fica nas features.
 */

import { pickExercises, today, type LegacyRaw, type LocalData } from '@/core/db/queries';
import { computeRadarStats } from '@/features/gamification/radar';
import { getSuggestedLoad, parseLoadKg } from '@/lib/suggested-load';
import type { Exercise, WorkoutHistory, WorkoutSheet } from '@/core/db/schema';
import { convertKgToDisplay, getWeekDayLabels, type FirstDayOfWeek, type WeightUnit } from '@/lib/app-prefs';

export type SheetMap = Map<string, WorkoutSheet>;
export type ExerciseMap = Map<string, Exercise>;

/** Meses abreviados do heatmap (colunas de referência). */
export const MONTH_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

/* ── Datas ── */

/** Data local YYYY-MM-DD (`toISOString` fica em UTC e pode cair no dia seguinte). */
export function fmtDateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDateLocal(dateStr);
  d.setDate(d.getDate() + days);
  return fmtDateLocal(d);
}

/** Início da semana da data (respeita o primeiro dia configurado nas preferências). */
export function startOfWeek(dateStr: string, firstDay: FirstDayOfWeek): string {
  const d = parseDateLocal(dateStr);
  const shift = firstDay === 'sunday' ? d.getDay() : d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - shift);
  return fmtDateLocal(d);
}

/* ── Dia de treino ── */

/** Letras concluídas do dia (`treinos[]`; fallback `treino`/`sheetKey`). */
export function keysOfDay(row: WorkoutHistory | undefined): string[] {
  if (!row) return [];
  if (row.completedKeys?.length) return row.completedKeys;
  if (row.completed && row.sheetKey) return [row.sheetKey];
  return [];
}

/** Volume de um exercício (séries × reps × carga × por-lado).
 *
 * v4.56.3 — a carga considerada é a EFETIVA: a salva em `load` e, quando o
 * campo ainda está vazio, a SUGERIDA por nome/grupo (lib/suggested-load.ts).
 * Sem isso o volume ficava em 0 no seed (que nunca grava `load`), mesmo com a
 * sugestão aparecendo na ficha e no "volume médio de carga".
 *
 * A carga salva mantém o parse antigo (dígitos crus) para não alterar números
 * já gravados; a sugerida usa `parseLoadKg`, que já dobra "cada lado" — nesse
 * caso o multiplicador `porLado` não entra de novo.
 */
export function exerciseVolume(ex: Exercise): number {
  const s = parseInt(String(ex.sets), 10) || 0;
  const r = parseInt(String(ex.reps), 10) || 0;
  const saved = parseFloat(String(ex.load).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  const suggested = saved > 0 ? 0 : parseLoadKg(getSuggestedLoad(ex));
  const loadKg = saved > 0 ? saved : suggested;
  const multi = saved > 0 && ex.porLado ? 2 : 1;
  return s * r * loadKg * multi;
}

/** Séries efetivamente concluídas no dia (fallback: séries das fichas concluídas). */
export function seriesOfDay(
  row: WorkoutHistory | undefined,
  exMap: ExerciseMap,
  sheetMap: SheetMap
): number {
  if (!row) return 0;
  let total = 0;
  let tracked = false;
  for (const arr of Object.values(row.seriesDone ?? {})) {
    if (!arr?.length) continue;
    tracked = true;
    total += arr.filter(Boolean).length;
  }
  if (tracked) return total;
  if (!row.completed) return 0;
  for (const key of keysOfDay(row)) {
    const sheet = sheetMap.get(key);
    for (const ex of pickExercises(sheet?.exerciseIds ?? [], exMap)) {
      total += Number(ex.sets) || 0;
    }
  }
  return total;
}

/** Volume do dia (só faz sentido em dias com treino concluído). */
export function volumeOfDay(
  row: WorkoutHistory | undefined,
  exMap: ExerciseMap,
  sheetMap: SheetMap
): number {
  if (!row) return 0;
  let total = 0;
  for (const key of keysOfDay(row)) {
    const sheet = sheetMap.get(key);
    for (const ex of pickExercises(sheet?.exerciseIds ?? [], exMap)) {
      total += exerciseVolume(ex);
    }
  }
  return total;
}

/** Datas com treino (concluído ou com letras registradas). */
export function trainedDays(history: WorkoutHistory[]): Set<string> {
  const set = new Set<string>();
  for (const row of history) {
    if (row.completed || keysOfDay(row).length > 0) set.add(row.date);
  }
  return set;
}

/* ── Meta semanal ── */

/** Meta de dias por semana (onboarding → `trainingFrequencyDays`; padrão 3). */
export function weeklyTarget(legacy: LegacyRaw | null): number {
  const raw = legacy?.profileCustomization?.trainingFrequencyDays;
  const value = typeof raw === 'number' && raw > 0 ? raw : 3;
  return Math.min(7, Math.max(1, Math.round(value)));
}

/* ── Resumo da semana (atual) ── */

export interface WeekDay {
  label: string;
  dateStr: string;
  done: boolean;
  isToday: boolean;
  series: number;
}

export interface WeekSummary {
  days: WeekDay[];
  done: number;
  target: number;
  startDate: string;
}

export function getWeekSummary(
  history: WorkoutHistory[],
  firstDay: FirstDayOfWeek,
  target: number,
  exMap: ExerciseMap,
  sheetMap: SheetMap,
  todayStr: string = today()
): WeekSummary {
  const histMap = new Map(history.map((h) => [h.date, h]));
  const start = startOfWeek(todayStr, firstDay);
  const labels = getWeekDayLabels(firstDay);
  const days: WeekDay[] = labels.map((label, i) => {
    const dateStr = addDays(start, i);
    const row = histMap.get(dateStr);
    return {
      label,
      dateStr,
      done: Boolean(row && (row.completed || keysOfDay(row).length > 0)),
      isToday: dateStr === todayStr,
      series: seriesOfDay(row, exMap, sheetMap),
    };
  });
  return { days, done: days.filter((d) => d.done).length, target, startDate: start };
}

/* ── Sequência de semanas (ofensiva) ── */

export interface WeekProgress {
  startDate: string;
  done: number;
  hit: boolean;
}

export interface WeekStreak {
  /** Semanas consecutivas que bateram a meta (a semana em curso só conta quando bate). */
  current: number;
  best: number;
  /** Mais recente primeiro. */
  weeks: WeekProgress[];
}

export function getWeekStreak(
  days: Set<string>,
  firstDay: FirstDayOfWeek,
  target: number,
  todayStr: string = today(),
  limit = 260
): WeekStreak {
  const goal = Math.max(1, Math.round(target));
  const currentStart = startOfWeek(todayStr, firstDay);
  const earliest = [...days].sort()[0] ?? todayStr;
  const oldestStart = startOfWeek(earliest, firstDay);

  const weeks: WeekProgress[] = [];
  let cursor = currentStart;
  for (let guard = 0; guard < limit; guard += 1) {
    let done = 0;
    for (let i = 0; i < 7; i += 1) if (days.has(addDays(cursor, i))) done += 1;
    weeks.push({ startDate: cursor, done, hit: done >= goal });
    if (cursor <= oldestStart) break;
    cursor = addDays(cursor, -7);
  }

  /* Semana em curso ainda incompleta não interrompe a ofensiva (mesma regra do
     dia de hoje no `getStreak`). */
  let idx = weeks.length > 0 && !weeks[0].hit ? 1 : 0;
  let current = 0;
  while (idx < weeks.length && weeks[idx].hit) {
    current += 1;
    idx += 1;
  }

  let best = 0;
  let run = 0;
  for (let i = weeks.length - 1; i >= 0; i -= 1) {
    if (weeks[i].hit) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }

  return { current, best, weeks };
}

/* ── Constância (dias consecutivos) ── */

/** Maior sequência de dias consecutivos treinados do histórico. */
export function getMaxDayStreak(days: Set<string>): number {
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const date of [...days].sort()) {
    if (prev && addDays(prev, 1) === date) run += 1;
    else run = 1;
    if (run > best) best = run;
    prev = date;
  }
  return best;
}

/* ── Heatmap anual de séries ── */

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatCell {
  dateStr: string;
  day: number;
  series: number;
  level: HeatLevel;
  inYear: boolean;
  isToday: boolean;
}

export interface HeatWeek {
  startDate: string;
  cells: HeatCell[];
}

export interface HeatmapData {
  weeks: HeatWeek[];
  monthLabels: { label: string; weekIndex: number }[];
  totalSeries: number;
  years: number[];
}

function heatLevel(series: number): HeatLevel {
  if (series <= 0) return 0;
  if (series < 8) return 1;
  if (series < 16) return 2;
  if (series < 26) return 3;
  return 4;
}

export function getSeriesHeatmap(
  history: WorkoutHistory[],
  year: number,
  firstDay: FirstDayOfWeek,
  exMap: ExerciseMap,
  sheetMap: SheetMap,
  todayStr: string = today()
): HeatmapData {
  const histMap = new Map(history.map((h) => [h.date, h]));
  const currentYear = parseDateLocal(todayStr).getFullYear();

  const years = [...new Set(history.map((h) => parseDateLocal(h.date).getFullYear()))]
    .filter((y) => Number.isFinite(y))
    .sort((a, b) => b - a);
  if (!years.includes(currentYear)) years.unshift(currentYear);

  const first = `${year}-01-01`;
  const last = `${year}-12-31`;
  const startCursor = startOfWeek(first, firstDay);
  const endCursor = startOfWeek(year >= currentYear ? todayStr : last, firstDay);

  const weeks: HeatWeek[] = [];
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let totalSeries = 0;
  let cursor = startCursor;
  let lastMonth = -1;

  for (let guard = 0; guard < 60 && cursor <= endCursor; guard += 1) {
    const cells: HeatCell[] = [];
    for (let i = 0; i < 7; i += 1) {
      const dateStr = addDays(cursor, i);
      const d = parseDateLocal(dateStr);
      const inYear = dateStr.startsWith(String(year));
      const series = inYear ? seriesOfDay(histMap.get(dateStr), exMap, sheetMap) : 0;
      if (inYear) totalSeries += series;
      cells.push({
        dateStr,
        day: d.getDate(),
        series,
        level: heatLevel(series),
        inYear,
        isToday: dateStr === todayStr,
      });
    }
    const firstInYear = cells.find((c) => c.inYear);
    if (firstInYear) {
      const month = parseDateLocal(firstInYear.dateStr).getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ label: MONTH_SHORT[month], weekIndex: weeks.length });
        lastMonth = month;
      }
    }
    weeks.push({ startDate: cursor, cells });
    cursor = addDays(cursor, 7);
  }

  return { weeks, monthLabels, totalSeries, years };
}

/* ── Tendências ── */

export type TrendPeriod = 'week' | 'month' | 'all';
export type TrendKey = 'treinos' | 'volume' | 'energia' | 'series';

export interface TrendMetric {
  key: TrendKey;
  label: string;
  value: number;
  prev: number;
  /** Variação % vs. período anterior; `null` quando não há base de comparação. */
  deltaPct: number | null;
}

interface RangeTotals {
  treinos: number;
  volume: number;
  energia: number;
  series: number;
}

export function lastDays(count: number, todayStr: string = today()): string[] {
  const dates: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) dates.push(addDays(todayStr, -i));
  return dates;
}

export function getTrends(
  data: LocalData,
  period: TrendPeriod,
  exMap: ExerciseMap,
  sheetMap: SheetMap,
  todayStr: string = today()
): TrendMetric[] {
  const histMap = new Map(data.history.map((h) => [h.date, h]));
  const totals = (dates: string[]): RangeTotals => {
    const acc: RangeTotals = { treinos: 0, volume: 0, energia: 0, series: 0 };
    for (const date of dates) {
      const row = histMap.get(date);
      if (!row) continue;
      acc.treinos += keysOfDay(row).length;
      acc.volume += volumeOfDay(row, exMap, sheetMap);
      acc.energia += row.durationMin ?? 0;
      acc.series += seriesOfDay(row, exMap, sheetMap);
    }
    return acc;
  };

  const span = period === 'week' ? 7 : 30;
  let cur: RangeTotals;
  let prev: RangeTotals | null;
  if (period === 'all') {
    cur = totals([...histMap.keys()]);
    prev = null;
  } else {
    const current = lastDays(span, todayStr);
    const previous: string[] = [];
    for (let i = span; i < span * 2; i += 1) previous.push(addDays(todayStr, -i));
    cur = totals(current);
    prev = totals(previous);
  }

  const build = (key: TrendKey, label: string): TrendMetric => {
    const value = cur[key];
    const before = prev ? prev[key] : 0;
    const deltaPct =
      prev && before > 0 ? ((value - before) / before) * 100 : null;
    return { key, label, value, prev: before, deltaPct };
  };

  return [
    build('treinos', 'Treinos'),
    build('volume', 'Volume'),
    build('energia', 'Energia'),
    build('series', 'Séries'),
  ];
}

/* ── Pontuação de força ── */

export interface StrengthScore {
  /** `false` enquanto não houver treinos suficientes para pontuar. */
  ready: boolean;
  value: number;
  label: string;
  workouts: number;
  remaining: number;
}

const MIN_WORKOUTS_FOR_SCORE = 3;

export function getStrengthScore(
  data: LocalData,
  minWorkouts = MIN_WORKOUTS_FOR_SCORE
): StrengthScore {
  const workouts = data.history.filter((h) => h.completed).length;
  if (workouts < minWorkouts) {
    return {
      ready: false,
      value: 0,
      label: 'Sem dados',
      workouts,
      remaining: minWorkouts - workouts,
    };
  }

  const s = computeRadarStats(data, 'total');
  const value = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        s.forca * 0.34 +
          s.resistencia * 0.16 +
          s.potencia * 0.16 +
          s.velocidade * 0.12 +
          s.equilibrio * 0.11 +
          s.flexibilidade * 0.11
      )
    )
  );
  const label =
    value >= 85
      ? 'Elite'
      : value >= 70
        ? 'Avançado'
        : value >= 50
          ? 'Intermediário'
          : value >= 30
            ? 'Iniciante'
            : 'Novato';

  return { ready: true, value, label, workouts, remaining: 0 };
}

/* ── Formatação compartilhada ── */

/** Volume em kg → texto curto na unidade escolhida ("1,2T", "850kg"). */
export function formatVolume(kg: number, unit: WeightUnit): string {
  const value = convertKgToDisplay(kg, unit);
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}T`;
  return `${Math.round(value)}${unit}`;
}
