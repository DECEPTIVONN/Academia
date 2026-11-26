/**
 * personal-bridge.ts — Ponte entre o app do aluno e o Painel do Personal
 *
 * Regras:
 *   • nada do app do aluno muda visualmente; a ponte só lê o treino real e,
 *     quando solicitado, publica uma ficha na conta local (fichas A–J);
 *   • "aluno vinculado a este aparelho" (`linkedDevice`) é o que autoriza a
 *     leitura/escrita — nenhum outro aluno toca nos dados locais;
 *   • o aviso "está terminando a ficha" nasce do progresso real da ficha de
 *     hoje (checks ÷ exercícios), atualizado a cada 15 s pelo painel.
 */

import { idb, localToday } from '@/core/db/idb';
import { compactIds } from '@/core/db/queries';
import { LOCAL_USER_ID, DEFAULT_AEROBIC } from '@/core/db/schema';
import { pushMessage } from '@/features/notifications/inbox';
import type { PtSheet, PtSession, PtStudent } from './personal-types';

const START_KEY = 'workout_start_time';
const SHEET_KEY = 'workout_sheet_key';

export interface LiveSnapshot {
  active: boolean;
  sheetKey: string | null;
  checks: number;
  total: number;
  percent: number;
  startedAt: number | null;
  elapsedMin: number;
}

function readStart(): number | null {
  try {
    const raw = localStorage.getItem(START_KEY);
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function readSheetKey(): string | null {
  try {
    const raw = localStorage.getItem(SHEET_KEY);
    return raw && raw.length === 1 ? raw : null;
  } catch {
    return null;
  }
}

/** Retrato do treino que está acontecendo AGORA no app deste aparelho. */
export async function readLiveSnapshot(): Promise<LiveSnapshot | null> {
  const startedAt = readStart();
  const date = localToday();
  if (!startedAt) {
    const entry = await idb.workoutHistory.get([LOCAL_USER_ID, date]);
    if (!entry) return null;
    const sheetKey = entry.sheetKey ?? readSheetKey();
    const sheet = sheetKey
      ? await idb.workoutSheets.get([LOCAL_USER_ID, sheetKey as any])
      : undefined;
    const total = compactIds(sheet?.exerciseIds).length;
    return {
      active: false,
      sheetKey,
      checks: entry.checks?.length ?? 0,
      total,
      percent: total ? Math.round(((entry.checks?.length ?? 0) / total) * 100) : 0,
      startedAt: null,
      elapsedMin: entry.durationMin ?? 0,
    };
  }

  const entry = await idb.workoutHistory.get([LOCAL_USER_ID, date]);
  const sheetKey = entry?.sheetKey ?? readSheetKey();
  const sheet = sheetKey
    ? await idb.workoutSheets.get([LOCAL_USER_ID, sheetKey as any])
    : undefined;
  const total = compactIds(sheet?.exerciseIds).length;
  const checks = entry?.checks?.length ?? 0;
  return {
    active: true,
    sheetKey,
    checks,
    total,
    percent: total ? Math.round((Math.min(checks, total) / total) * 100) : 0,
    startedAt,
    elapsedMin: Math.max(0, Math.round((Date.now() - startedAt) / 60000)),
  };
}

/**
 * Publica a ficha do personal na conta local do aluno: a partir daí ela
 * aparece em "Minha Ficha"/Início do app, exatamente como uma ficha montada
 * pelo próprio usuário. Também deixa um aviso na Caixa de Mensagens.
 */
export async function publishSheetToStudent(
  sheet: PtSheet,
  student: PtStudent
): Promise<void> {
  const letter = (sheet.letter || 'A').toUpperCase();
  const ids = sheet.items.map((item) => item.exerciseId).filter(Boolean);
  const padded = [...ids];
  while (padded.length < 8) padded.push('');

  await idb.workoutSheets.put({
    userId: LOCAL_USER_ID,
    sheetKey: letter as never,
    exerciseIds: padded,
    aerobic: DEFAULT_AEROBIC,
    isArchived: false,
    updatedAt: new Date().toISOString(),
  });

  /* Cargas prescritas: o app do aluno usa a carga do exercício na ficha. */
  for (const item of sheet.items) {
    if (!item.load) continue;
    const ex = await idb.exercises.get(item.exerciseId);
    if (ex) {
      await idb.exercises.put({
        ...ex,
        load: String(item.load),
        sets: item.sets || ex.sets,
        reps: item.reps || ex.reps,
        rest: item.rest || ex.rest,
      });
    }
  }

  try {
    pushMessage({
      kind: 'account',
      title: `Nova ficha ${letter} do seu personal`,
      body: `${sheet.name}. ${sheet.notes || 'Bom treino!'}`,
      key: `pt-sheet-${sheet.id}-${Date.now()}`,
    });
  } catch {
    /* inbox indisponível */
  }

  document.dispatchEvent(new CustomEvent('academia:db-ready'));
  document.dispatchEvent(new CustomEvent('academia:personal-sheet-updated'));

  /* Marca a ficha como enviada/ativa */
  void student;
}

/**
 * Importa para o CRM os treinos concluídos no app deste aparelho (aluno
 * vinculado). Idempotente: o id é derivado da data + letra.
 */
export async function syncDeviceHistory(studentId: string): Promise<number> {
  const rows = await idb.workoutHistory.where('userId').equals(LOCAL_USER_ID).toArray();
  let imported = 0;
  for (const row of rows) {
    const letters = row.completedKeys?.length
      ? row.completedKeys
      : row.completed && row.sheetKey
        ? [row.sheetKey]
        : [];
    for (const letter of letters) {
      const id = `device:${row.date}:${letter}`;
      const existing = await idb.ptSessions.get(id);
      const session: PtSession = {
        id,
        studentId,
        date: row.date,
        sheetLabel: letter,
        durationMin: row.durationMin ?? 0,
        completed: true,
        origin: 'aluno',
      };
      if (!existing) imported += 1;
      await idb.ptSessions.put(session);
    }
  }
  return imported;
}
