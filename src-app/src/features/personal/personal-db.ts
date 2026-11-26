/**
 * personal-db.ts — Acesso às tabelas `pt*` (painel do personal)
 *
 * Usa o MESMO banco Dexie do app (`academia-v4`), com as tabelas `pt*`
 * adicionadas na versão 5 (core/db/idb.ts). Nada aqui toca nas tabelas do
 * aluno: a ponte é feita explicitamente em personal-bridge.ts.
 */

import { idb, localToday } from '@/core/db/idb';
import { DEFAULT_EXERCISES } from '@/core/db/default-data';
import type { Exercise } from '@/core/db/schema';
import type {
  PtAlert,
  PtMessage,
  PtNote,
  PtProfile,
  PtSession,
  PtSheet,
  PtSheetItem,
  PtStudent,
} from './personal-types';

/* ── Identificadores ── */

export function ptId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function isoToday(): string {
  return localToday();
}

export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ── Biblioteca de exercícios (compartilhada com o app do aluno) ── */

export async function ensureExerciseLibrary(): Promise<Exercise[]> {
  const count = await idb.exercises.count();
  if (count === 0) {
    await idb.exercises.bulkPut(DEFAULT_EXERCISES);
  }
  return idb.exercises.toArray();
}

/* ── Leitura ── */

export async function getPtProfile(): Promise<PtProfile | undefined> {
  return idb.ptProfiles.get('default');
}

export async function listStudents(): Promise<PtStudent[]> {
  const rows = await idb.ptStudents.toArray();
  return rows.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export async function listSheets(): Promise<PtSheet[]> {
  const rows = await idb.ptSheets.toArray();
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listSessions(): Promise<PtSession[]> {
  const rows = await idb.ptSessions.toArray();
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

export async function listAlerts(): Promise<PtAlert[]> {
  const rows = await idb.ptAlerts.toArray();
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

export async function listNotes(): Promise<PtNote[]> {
  const rows = await idb.ptNotes.toArray();
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

export async function listMessages(): Promise<PtMessage[]> {
  const rows = await idb.ptMessages.toArray();
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

/* ── Escrita ── */

export async function saveProfile(profile: PtProfile): Promise<void> {
  await idb.ptProfiles.put(profile);
}

export async function saveStudent(student: PtStudent): Promise<void> {
  await idb.ptStudents.put(student);
}

export async function removeStudent(studentId: string): Promise<void> {
  await idb.transaction(
    'rw',
    [idb.ptStudents, idb.ptSheets, idb.ptSessions, idb.ptAlerts, idb.ptNotes, idb.ptMessages],
    async () => {
      await idb.ptStudents.delete(studentId);
      await idb.ptSheets.where('studentId').equals(studentId).delete();
      await idb.ptSessions.where('studentId').equals(studentId).delete();
      await idb.ptAlerts.where('studentId').equals(studentId).delete();
      await idb.ptNotes.where('studentId').equals(studentId).delete();
      await idb.ptMessages.where('studentId').equals(studentId).delete();
    }
  );
}

export async function saveSheet(sheet: PtSheet): Promise<void> {
  await idb.ptSheets.put(sheet);
}

export async function deleteSheet(sheetId: string): Promise<void> {
  await idb.ptSheets.delete(sheetId);
}

export async function saveSession(session: PtSession): Promise<void> {
  await idb.ptSessions.put(session);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await idb.ptSessions.delete(sessionId);
}

export async function saveNote(note: PtNote): Promise<void> {
  await idb.ptNotes.put(note);
}

export async function deleteNote(noteId: string): Promise<void> {
  await idb.ptNotes.delete(noteId);
}

export async function saveMessage(message: PtMessage): Promise<void> {
  await idb.ptMessages.put(message);
}

/** Insere um alerta somente se a `dedupeKey` ainda não existir. */
export async function upsertAlert(alert: PtAlert): Promise<boolean> {
  const existing = await idb.ptAlerts.where('dedupeKey').equals(alert.dedupeKey).first();
  if (existing) return false;
  await idb.ptAlerts.put(alert);
  return true;
}

export async function markAlertRead(alertId: string, read = true): Promise<void> {
  await idb.ptAlerts.update(alertId, { read });
}

export async function markAllAlertsRead(): Promise<void> {
  const rows = await idb.ptAlerts.toArray();
  await idb.ptAlerts.bulkPut(rows.map((row) => ({ ...row, read: true })));
}

export async function clearAlerts(): Promise<void> {
  await idb.ptAlerts.clear();
}

/* ── Reset / seed ── */

export async function clearPtData(): Promise<void> {
  await idb.transaction(
    'rw',
    [idb.ptStudents, idb.ptSheets, idb.ptSessions, idb.ptAlerts, idb.ptNotes, idb.ptMessages],
    async () => {
      await idb.ptStudents.clear();
      await idb.ptSheets.clear();
      await idb.ptSessions.clear();
      await idb.ptAlerts.clear();
      await idb.ptNotes.clear();
      await idb.ptMessages.clear();
    }
  );
}

/* ── Seed de demonstração ──
   Cria uma carteira plausível para o painel não abrir vazio: 6 alunos, 3
   fichas cada e um histórico de ~5 semanas. Os dados são claramente marcados
   como demonstração (`origin: 'demo'`) e podem ser apagados em Configurações. */

interface DemoStudent {
  name: string;
  goal: string;
  level: PtStudent['level'];
  plan: PtStudent['plan'];
  fee: number;
  weeklyGoal: number;
  hue: number;
  /** dias atrás do último treino (define quem está em risco) */
  lastActiveDaysAgo: number;
  /** nº de semanas de histórico simulado */
  weeks: number;
  startAgo: number;
}

const DEMO_STUDENTS: DemoStudent[] = [
  { name: 'Marina Alves', goal: 'Hipertrofia', level: 'Intermediário', plan: 'Mensal', fee: 290, weeklyGoal: 4, hue: 268, lastActiveDaysAgo: 0, weeks: 6, startAgo: 120 },
  { name: 'Rafael Souza', goal: 'Emagrecimento', level: 'Iniciante', plan: 'Mensal', fee: 250, weeklyGoal: 3, hue: 162, lastActiveDaysAgo: 1, weeks: 5, startAgo: 190 },
  { name: 'Camila Ribeiro', goal: 'Força', level: 'Avançado', plan: 'Trimestral', fee: 320, weeklyGoal: 5, hue: 24, lastActiveDaysAgo: 0, weeks: 7, startAgo: 240 },
  { name: 'Diego Martins', goal: 'Hipertrofia', level: 'Intermediário', plan: 'Online', fee: 190, weeklyGoal: 4, hue: 206, lastActiveDaysAgo: 3, weeks: 4, startAgo: 300 },
  { name: 'Júlia Nogueira', goal: 'Definição', level: 'Intermediário', plan: 'Mensal', fee: 270, weeklyGoal: 3, hue: 330, lastActiveDaysAgo: 9, weeks: 4, startAgo: 60 },
  { name: 'André Lima', goal: 'Saúde geral', level: 'Iniciante', plan: 'Mensal', fee: 230, weeklyGoal: 2, hue: 92, lastActiveDaysAgo: 14, weeks: 3, startAgo: 30 },
];

const DEMO_PLANS: { letter: string; name: string; focus: string; groups: string[] }[] = [
  { letter: 'A', name: 'Empurrar · Peito, Ombro e Tríceps', focus: 'Peito e Ombros', groups: ['Peito', 'Ombros', 'Tríceps'] },
  { letter: 'B', name: 'Puxar · Costas e Bíceps', focus: 'Costas e Bíceps', groups: ['Costas', 'Bíceps', 'Antebraços'] },
  { letter: 'C', name: 'Pernas e Core', focus: 'Pernas e Core', groups: ['Pernas', 'Glúteos', 'Core'] },
];

function demoStudentStatus(s: DemoStudent): PtStudent['status'] {
  if (s.lastActiveDaysAgo >= 10) return 'inativo';
  if (s.lastActiveDaysAgo >= 6) return 'atencao';
  return 'ativo';
}

export async function seedDemoData(): Promise<void> {
  const exercises = await ensureExerciseLibrary();
  if ((await idb.ptStudents.count()) > 0) return;

  const pick = (groups: string[], take: number): Exercise[] => {
    const pool = exercises.filter((ex) => groups.includes(ex.muscleGroup));
    const fallback = exercises.length ? exercises : DEFAULT_EXERCISES;
    return (pool.length ? pool : fallback).slice(0, take);
  };

  const now = Date.now();

  for (let index = 0; index < DEMO_STUDENTS.length; index += 1) {
    const demo = DEMO_STUDENTS[index];
    const studentId = `ptdemo_student_${index}`;
    const student: PtStudent = {
      id: studentId,
      name: demo.name,
      email: `${demo.name.split(' ')[0].toLowerCase()}@email.com`,
      phone: `(11) 9${String(80000000 + index * 111111).slice(0, 8)}`,
      goal: demo.goal,
      level: demo.level,
      plan: demo.plan,
      monthlyFee: demo.fee,
      status: demoStudentStatus(demo),
      weeklyGoal: demo.weeklyGoal,
      joinedAt: isoDaysAgo(demo.startAgo),
      avatarHue: demo.hue,
      bio: '',
    };
    await idb.ptStudents.put(student);

    const sheets: PtSheet[] = [];
    for (let p = 0; p < DEMO_PLANS.length; p += 1) {
      const plan = DEMO_PLANS[p];
      const chosen = pick(plan.groups, demo.level === 'Iniciante' ? 5 : 6);
      const items: PtSheetItem[] = chosen.map((ex, i) => ({
        exerciseId: ex.id,
        sets: demo.level === 'Avançado' ? 4 : 3,
        reps: demo.goal === 'Força' ? '6' : demo.goal === 'Emagrecimento' ? '15' : '10',
        load: String(20 + ((index + i + p) % 6) * 5),
        rest: 45,
      }));
      const createdAt = isoDaysAgo(demo.startAgo);
      const sheet: PtSheet = {
        id: `ptdemo_sheet_${index}_${plan.letter}`,
        studentId,
        letter: plan.letter,
        name: `Ficha ${plan.letter} · ${plan.name}`,
        focus: plan.focus,
        items,
        notes: 'Progressão de carga a cada 2 semanas. Manter a técnica.',
        status: 'enviada',
        createdAt,
        updatedAt: createdAt,
        sentAt: createdAt,
      };
      sheets.push(sheet);
      await idb.ptSheets.put(sheet);
    }

    /* Histórico: distribui os treinos das últimas `weeks` semanas, deixando o
       último treino exatamente `lastActiveDaysAgo` atrás (isso controla o
       estado "em risco"/inativo mostrado no painel). */
    const perWeek = demo.weeklyGoal;
    const totalSessions = demo.weeks * perWeek;
    for (let s = 0; s < totalSessions; s += 1) {
      const offset =
        demo.lastActiveDaysAgo + Math.floor((s * 7) / Math.max(1, perWeek));
      if (offset > demo.startAgo) continue;
      const sheet = sheets[s % sheets.length];
      await idb.ptSessions.put({
        id: `ptdemo_session_${index}_${s}`,
        studentId,
        date: isoDaysAgo(offset),
        sheetId: sheet.id,
        sheetLabel: sheet.letter,
        durationMin: 42 + ((index * 7 + s * 3) % 26),
        completed: s % 9 !== 4,
        rpe: 6 + ((index + s) % 4),
        origin: 'demo',
      });
    }

    await idb.ptNotes.put({
      id: `ptdemo_note_${index}`,
      studentId,
      body:
        index % 3 === 0
          ? 'Ajustar cadência no supino. Ombro esquerdo sensível: evitar pegada muito aberta.'
          : index % 3 === 1
            ? 'Boa evolução na carga do leg press. Vamos subir 5 kg na próxima semana.'
            : 'Faltou 2 treinos este mês. Cobrar presença e reforçar mobilidade.',
      createdAt: now - index * 86400000 * 2,
      pinned: index === 0,
    });
  }
}
