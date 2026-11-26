/**
 * personal-engine.ts — Inteligência do painel do personal
 *
 * Transforma sessões/fichas em métricas, avisos e na SUGESTÃO DE PRÓXIMA FICHA
 * de cada aluno. Tudo determinístico e offline (nenhuma chamada de rede).
 *
 * Regras da sugestão (progressão dupla):
 *   • exercício concluído nas últimas 2 semanas → +2,5 kg se for
 *     multiarticular/máquina, ou +1 repetição se for isolado;
 *   • exercício não concluído → mantém a carga e reduz uma série (deload);
 *   • entra 1 exercício novo do grupo muscular menos treinado nos últimos
 *     21 dias;
 *   • a letra é a próxima não usada (A → B → C …), com explicação do porquê.
 */

import { DEFAULT_EXERCISES } from '@/core/db/default-data';
import type { Exercise, MuscleGroup } from '@/core/db/schema';
import type {
  PtNextSheet,
  PtNextSheetItem,
  PtSession,
  PtSheet,
  PtSheetItem,
  PtStudent,
  PtStudentMetrics,
} from './personal-types';

/* ── Datas ── */

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T12:00:00`).getTime();
  const db = new Date(`${b}T12:00:00`).getTime();
  return Math.round((db - da) / 86400000);
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/* ── Métricas ── */

export function computeMetrics(
  student: PtStudent,
  sessions: PtSession[],
  reference = todayKey()
): PtStudentMetrics {
  const mine = sessions.filter((s) => s.studentId === student.id);
  const sessions30 = mine.filter((s) => daysBetween(s.date, reference) < 30 && s.date <= reference);
  const sessions7 = mine.filter((s) => daysBetween(s.date, reference) < 7 && s.date <= reference);
  const completed = mine.filter((s) => s.completed);

  const lastSession = mine
    .filter((s) => s.date <= reference)
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;

  const daysSinceLast = lastSession ? Math.max(0, daysBetween(lastSession.date, reference)) : null;

  /* Ofensiva: dias consecutivos (na semana) com treino — conta a partir do
     último treino, tolerando 1 dia de descanso. */
  const dates = new Set(completed.map((s) => s.date));
  let streak = 0;
  const cursor = new Date(`${reference}T12:00:00`);
  if (!dates.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const expected = Math.max(1, student.weeklyGoal * 4);
  const adherence = Math.min(100, Math.round((sessions30.length / expected) * 100));
  const completionRate = mine.length
    ? Math.round((completed.length / mine.length) * 100)
    : 0;

  const weekly = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${reference}T12:00:00`);
    d.setDate(d.getDate() - (6 - i));
    const key = dayKey(d);
    return {
      label: WEEKDAYS[d.getDay()],
      date: key,
      count: mine.filter((s) => s.date === key).length,
    };
  });

  return {
    sessions30: sessions30.length,
    sessions7: sessions7.length,
    streak,
    adherence,
    lastSession,
    daysSinceLast,
    totalMinutes: mine.reduce((acc, s) => acc + (s.durationMin || 0), 0),
    completionRate,
    weekly,
  };
}

export function estimatedRevenue(students: PtStudent[]): number {
  return students
    .filter((s) => !s.archived && s.status !== 'pausado')
    .reduce((acc, s) => acc + (s.monthlyFee || 0), 0);
}

/* ── Biblioteca ── */

export function exerciseMap(exercises: Exercise[]): Map<string, Exercise> {
  return new Map(exercises.map((ex) => [ex.id, ex]));
}

function libraryOf(exercises: Exercise[]): Exercise[] {
  return exercises.length ? exercises : DEFAULT_EXERCISES;
}

export function sheetVolume(sheet: PtSheet, map: Map<string, Exercise>): number {
  return sheet.items.reduce((acc, item) => {
    const load = parseFloat(String(item.load).replace(',', '.')) || 0;
    const reps = parseInt(item.reps, 10) || 10;
    return acc + load * reps * (item.sets || 0);
  }, 0);
}

export function focusOf(items: PtSheetItem[], map: Map<string, Exercise>): string {
  const counts = new Map<string, number>();
  for (const item of items) {
    const group = map.get(item.exerciseId)?.muscleGroup;
    if (!group) continue;
    counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([g]) => g);
  return top.length ? top.join(' e ') : 'Corpo inteiro';
}

/* ── Próxima ficha ── */

const NEXT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export function nextLetter(sheets: PtSheet[]): string {
  const used = new Set(sheets.map((s) => s.letter.toUpperCase()));
  for (const letter of NEXT_LETTERS) {
    if (!used.has(letter)) return letter;
  }
  return 'A';
}

function isCompound(ex: Exercise | undefined): boolean {
  return Boolean(ex?.tags?.some((t) => t === 'Multiarticular' || t === 'Máquina' || t === 'Barra'));
}

function leastTrainedGroups(
  sessions: PtSession[],
  sheets: PtSheet[],
  map: Map<string, Exercise>,
  days = 21
): string[] {
  const sheetById = new Map(sheets.map((s) => [s.id, s]));
  const counts = new Map<string, number>();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffKey = dayKey(cutoff);

  for (const session of sessions) {
    if (session.date < cutoffKey) continue;
    const sheet = session.sheetId ? sheetById.get(session.sheetId) : sheets.find((s) => s.letter === session.sheetLabel);
    if (!sheet) continue;
    for (const item of sheet.items) {
      const group = map.get(item.exerciseId)?.muscleGroup;
      if (!group) continue;
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
  }

  const all: MuscleGroup[] = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Core', 'Glúteos'];
  return all
    .filter((g) => (counts.get(g) ?? 0) === 0 || (counts.get(g) ?? 0) <= 5)
    .sort((a, b) => (counts.get(a) ?? 0) - (counts.get(b) ?? 0));
}

function templateItems(student: PtStudent, exercises: Exercise[]): PtSheetItem[] {
  const lib = libraryOf(exercises);
  const goals: Record<string, string[]> = {
    Força: ['Peito', 'Costas', 'Pernas', 'Ombros'],
    Hipertrofia: ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps'],
    Emagrecimento: ['Pernas', 'Peito', 'Costas', 'Core', 'Glúteos', 'Ombros'],
    Definição: ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps'],
  };
  const groups = goals[student.goal] ?? ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps'];
  const chosen: Exercise[] = [];
  for (const group of groups) {
    const found = lib.find((ex) => ex.muscleGroup === group && !chosen.includes(ex));
    if (found) chosen.push(found);
  }
  return chosen.map((ex) => ({
    exerciseId: ex.id,
    sets: student.level === 'Avançado' ? 4 : 3,
    reps: student.goal === 'Força' ? '6' : student.goal === 'Emagrecimento' ? '15' : '10',
    load: '',
    rest: 45,
  }));
}

/**
 * Gera a sugestão de próxima ficha do aluno.
 *
 * @param student     aluno alvo
 * @param sheets      fichas dele
 * @param sessions    sessões dele
 * @param exercises   biblioteca de exercícios
 */
export function suggestNextSheet(
  student: PtStudent,
  sheets: PtSheet[],
  sessions: PtSession[],
  exercises: Exercise[]
): PtNextSheet {
  const map = new Map(libraryOf(exercises).map((ex) => [ex.id, ex]));
  const ordered = [...sheets].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const last = ordered[ordered.length - 1];

  const letter = last ? nextLetter(sheets) : 'A';

  if (!last) {
    const items = templateItems(student, exercises);
    return {
      letter,
      name: `Ficha ${letter} · ${focusOf(items, map)}`,
      focus: focusOf(items, map),
      reason:
        'Primeira ficha do aluno: montamos um treino equilibrado para o objetivo ' +
        `${student.goal.toLowerCase()}, com ${items.length} exercícios e descanso de 45 s.`,
      items: items.map((item) => ({
        ...item,
        name: map.get(item.exerciseId)?.name ?? 'Exercício',
        muscleGroup: map.get(item.exerciseId)?.muscleGroup ?? '',
      })),
    };
  }

  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - 14);
  const recentKeys = new Set(
    sessions
      .filter((s) => s.date >= dayKey(recentCutoff) && s.sheetId === last.id)
      .map((s) => s.date)
  );
  const completedRecent = sessions.filter(
    (s) => s.completed && s.date >= dayKey(recentCutoff)
  ).length;

  const items: PtNextSheetItem[] = last.items.map((item) => {
    const ex = map.get(item.exerciseId);
    const load = parseFloat(String(item.load).replace(',', '.')) || 0;
    const reps = parseInt(item.reps, 10) || 10;
    const progressed = recentKeys.size >= 2 || completedRecent >= 3;
    let nextLoad = item.load;
    let nextReps = String(reps);
    let nextSets = item.sets;

    if (progressed) {
      if (isCompound(ex) || load > 0) {
        nextLoad = load > 0 ? String(Math.round((load + 2.5) * 10) / 10) : item.load;
        if (!nextLoad) nextLoad = item.load;
        if (reps < 8) nextReps = '8';
      } else if (reps < 15) {
        nextReps = String(reps + 1);
      }
    } else if (completedRecent <= 1) {
      nextSets = Math.max(2, item.sets - 1);
    }

    return {
      ...item,
      sets: nextSets,
      reps: nextReps,
      load: nextLoad,
      name: ex?.name ?? 'Exercício',
      muscleGroup: ex?.muscleGroup ?? '',
    };
  });

  /* Um exercício novo do grupo menos treinado (se ainda houver espaço). */
  const gaps = leastTrainedGroups(sessions, sheets, map);
  const already = new Set(items.map((i) => i.exerciseId));
  const newEx = gaps
    .flatMap((group) => libraryOf(exercises).filter((ex) => ex.muscleGroup === group))
    .find((ex) => !already.has(ex.id));

  let added = '';
  if (newEx && items.length < 8) {
    items.push({
      exerciseId: newEx.id,
      sets: 3,
      reps: student.goal === 'Força' ? '8' : '12',
      load: '',
      rest: 45,
      name: newEx.name,
      muscleGroup: newEx.muscleGroup,
    });
    added = newEx.muscleGroup;
  }

  const focus = focusOf(items, map);
  const loadNote = items.some((i, idx) => i.load !== last.items[idx]?.load)
    ? ' Aumentamos 2,5 kg nos principais compostos.'
    : '';
  const gapNote = added ? ` Incluímos ${added.toLowerCase()} para equilibrar o volume.` : '';
  const reason =
    `${recentKeys.size >= 2 ? `O aluno já treinou a ficha ${last.letter} ${recentKeys.size}x nas últimas 2 semanas.` : 'Volume recente ainda é baixo nesta ficha.'}` +
    `${loadNote}${gapNote}`.trim();

  return {
    letter,
    name: `Ficha ${letter} · ${focus}`,
    focus,
    reason: reason || 'Progressão sugerida a partir do histórico recente.',
    items,
  };
}

/* ── Avisos automáticos ── */

export interface AlertDraft {
  type: 'inactive' | 'suggestion' | 'completed' | 'payment';
  studentId: string;
  title: string;
  body: string;
  dedupeKey: string;
}

/** Avisos derivados do estado atual da carteira (sem depender de rede). */
export function buildAlerts(
  students: PtStudent[],
  sheets: PtSheet[],
  sessions: PtSession[],
  exercises: Exercise[]
): AlertDraft[] {
  const out: AlertDraft[] = [];
  const today = todayKey();

  for (const student of students) {
    if (student.archived) continue;
    const mine = sessions.filter((s) => s.studentId === student.id);
    const metrics = computeMetrics(student, mine, today);

    if (metrics.daysSinceLast !== null && metrics.daysSinceLast >= 7) {
      out.push({
        type: 'inactive',
        studentId: student.id,
        title: `${student.name} está há ${metrics.daysSinceLast} dias sem treinar`,
        body:
          metrics.daysSinceLast >= 12
            ? 'Risco de evasão. Envie uma mensagem e proponha um treino curto para retomar.'
            : 'Um empurrãozinho resolve: envie a próxima ficha e pergunte como está a rotina.',
        dedupeKey: `inactive:${student.id}:${today}`,
      });
    }

    if (metrics.daysSinceLast !== null && metrics.daysSinceLast <= 1) {
      const suggestion = suggestNextSheet(student, sheets.filter((s) => s.studentId === student.id), mine, exercises);
      out.push({
        type: 'suggestion',
        studentId: student.id,
        title: `Próxima ficha de ${student.name.split(' ')[0]} pronta`,
        body: `${suggestion.name} — ${suggestion.reason}`,
        dedupeKey: `suggestion:${student.id}:${today}`,
      });
    }

    if (student.plan !== 'Avulso' && student.status === 'ativo' && metrics.sessions30 === 0) {
      out.push({
        type: 'payment',
        studentId: student.id,
        title: `Renovação de ${student.name.split(' ')[0]}`,
        body: `Plano ${student.plan} sem treinos nos últimos 30 dias. Vale conferir a renovação (R$ ${student.monthlyFee}).`,
        dedupeKey: `payment:${student.id}:${today.slice(0, 7)}`,
      });
    }
  }

  return out;
}
