/**
 * idb.ts — IndexedDB com Dexie.js
 * Camada de persistência local offline-first.
 * Espelha as tabelas do Supabase para operação sem conexão.
 */

import Dexie, { type Table } from 'dexie';
import type {
  WorkoutSheet,
  WorkoutHistory,
  ExerciseMastery,
  UserProfile,
  PendingMutation,
  TrainingCycle,
  Exercise,
  MasteryTier,
  LegacyState,
  ProfileState,
  BodyMeasurement,
  BodyPhoto,
} from './schema';
import type {
  PtAlert,
  PtMessage,
  PtNote,
  PtProfile,
  PtSession,
  PtSheet,
  PtStudent,
} from '@/features/personal/personal-types';

class AcademiaDB extends Dexie {
  exercises!:        Table<Exercise>;
  workoutSheets!:    Table<WorkoutSheet>;
  workoutHistory!:   Table<WorkoutHistory>;
  exerciseMastery!:  Table<ExerciseMastery>;
  userProfiles!:     Table<UserProfile>;
  trainingCycles!:   Table<TrainingCycle>;
  pendingMutations!: Table<PendingMutation>;
  legacyState!:      Table<LegacyState>;
  profileState!:     Table<ProfileState>;
  bodyMeasurements!: Table<BodyMeasurement>;
  bodyPhotos!:       Table<BodyPhoto>;
  /* v4.82.0 — Painel do Personal (CRM do treinador). Tabelas próprias: nenhum
     dado do aluno é alterado por elas; a ponte é explícita (personal-bridge). */
  ptProfiles!:       Table<PtProfile>;
  ptStudents!:       Table<PtStudent>;
  ptSheets!:         Table<PtSheet>;
  ptSessions!:       Table<PtSession>;
  ptAlerts!:         Table<PtAlert>;
  ptNotes!:          Table<PtNote>;
  ptMessages!:       Table<PtMessage>;

  constructor() {
    super('academia-v4');

    this.version(1).stores({
      exercises:        'id, muscleGroup',
      workoutSheets:    '[userId+sheetKey], userId',
      workoutHistory:   '[userId+date], userId, date',
      exerciseMastery:  '[userId+exerciseId], userId',
      userProfiles:     'userId',
      trainingCycles:   '++id, userId, isActive',
      pendingMutations: '++id, table, timestamp',
    });

    // v4.0.1-phase0: cópia bruta do estado legado (`localStorage.academia_treino`)
    this.version(2).stores({
      legacyState: 'key',
    });

    // v4.0.4-phase2: perfil/customização derivado da cópia bruta (Fase 2)
    this.version(3).stores({
      profileState: 'key',
    });

    // v4.56.0 — métricas corporais (peso/gordura/cintura + fotos de progresso)
    // saem do localStorage e passam a viver no banco (e no snapshot de sync).
    this.version(4).stores({
      bodyMeasurements: 'date',
      bodyPhotos: 'slot',
    });

    // v4.82.0 — Painel do Personal (CRM): perfil do treinador, alunos, fichas,
    // sessões, avisos, notas e mensagens. Mesmo banco, namespaces separados.
    this.version(5).stores({
      ptProfiles: 'id',
      ptStudents: 'id, name, status, plan, linkedDevice',
      ptSheets: 'id, studentId, status, letter, createdAt',
      ptSessions: 'id, studentId, date',
      ptAlerts: 'id, studentId, type, dedupeKey, createdAt, read',
      ptNotes: 'id, studentId, createdAt',
      ptMessages: 'id, studentId, createdAt',
    });
  }
}

export const idb = new AcademiaDB();
export const db = idb;

/** Dispara `academia:db-ready` — as UIs (useLocalData etc.) recarregam. */
export function emitDbReady(): void {
  document.dispatchEvent(new CustomEvent('academia:db-ready'));
}

/* ── Helpers de Maestria ── */

export interface TierInfo {
  tier: MasteryTier;
  name: string;
  color: string;
}

export function getTierForXP(xp: number): TierInfo {
  if (xp >= 2000) return { tier: 'elite',  name: 'Elite',  color: '#e0a96d' };
  if (xp >= 500)  return { tier: 'ouro',   name: 'Ouro',   color: '#f59e0b' };
  if (xp >= 100)  return { tier: 'prata',  name: 'Prata',  color: '#94a3b8' };
  if (xp >= 1)    return { tier: 'bronze', name: 'Bronze', color: '#b45309' };
  return { tier: 'none', name: 'Novo', color: '#6b7280' };
}

/* ── Helpers de Acesso ao Banco Local ── */

/** Data local no formato YYYY-MM-DD (espelha `today()` do legado — JS/treino/db.js).
 *  Usar em vez de `toISOString().slice(0,10)`, que fica em UTC e pode cair no dia seguinte. */
export function localToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Retorna as fichas do usuário ordenadas por sheet key */
export async function getUserSheets(userId: string): Promise<WorkoutSheet[]> {
  return idb.workoutSheets
    .where('userId').equals(userId)
    .toArray()
    .then(sheets => sheets.sort((a, b) => a.sheetKey.localeCompare(b.sheetKey)));
}

/** Retorna o histórico dos últimos N dias */
export async function getRecentHistory(userId: string, days = 30): Promise<WorkoutHistory[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  return idb.workoutHistory
    .where('[userId+date]')
    .between([userId, cutoffStr], [userId, '9999-99-99'], true, true)
    .reverse()
    .toArray();
}

/** Upsert atômico de uma ficha */
export async function upsertSheet(sheet: WorkoutSheet): Promise<void> {
  await idb.workoutSheets.put(sheet);
}

export async function saveWorkoutSheet(sheet: WorkoutSheet): Promise<void> {
  await upsertSheet(sheet);
}

/** Upsert atômico do histórico de um dia */
export async function upsertHistory(entry: WorkoutHistory): Promise<void> {
  await idb.workoutHistory.put(entry);
}

export async function saveWorkoutLog(entry: WorkoutHistory): Promise<void> {
  await upsertHistory(entry);
}

/** Salvar exercício customizado */
export async function saveCustomExercise(exercise: Exercise): Promise<void> {
  await idb.exercises.put(exercise);
}

/* ── Helpers de Perfil (Fase 2) ── */

/**
 * Chave primária do estado de perfil.
 *
 * IMPORTANTE: a tabela `profileState` tem `keyPath: 'key'` (chave inline), e o
 * Dexie ignora o argumento `key` do `put()` nesse caso — a gravação usa o
 * `key` do próprio objeto. Por isso a chave do usuário local precisa ser
 * exatamente `local` (a mesma usada por `ensureProfileState`, pelo bootstrap e
 * pelo snapshot de sync). Antes retornávamos `profile_state_local`, o que fazia
 * a leitura nunca encontrar o perfil salvo e o onboarding reaparecer a cada
 * acesso.
 */
export const PROFILE_STATE_KEY = (userId: string = 'local') =>
  userId === 'local' ? 'local' : `profile_state_${userId}`;

/** Lê o estado de perfil/customização (derivado da cópia bruta legada). */
export async function getProfileState(userId: string = 'local'): Promise<ProfileState | undefined> {
  return idb.profileState.get(PROFILE_STATE_KEY(userId));
}

/** Grava o estado de perfil inteiro (upsert na chave canônica do usuário). */
export async function saveProfileState(state: ProfileState, userId: string = 'local'): Promise<void> {
  const key = PROFILE_STATE_KEY(userId);
  await idb.profileState.put({ ...state, key });
}

/** Retorna a maestria de todos os exercícios do usuário */
export async function getUserMastery(userId: string): Promise<ExerciseMastery[]> {
  return idb.exerciseMastery.where('userId').equals(userId).toArray();
}

/** Adiciona XP a um exercício e atualiza o tier */
export async function addMasteryXP(
  userId: string,
  exerciseId: string,
  xpDelta: number
): Promise<ExerciseMastery> {
  const existing = await idb.exerciseMastery.get([userId, exerciseId]);
  const currentXP = (existing?.xp ?? 0) + xpDelta;
  const tier = computeTier(currentXP);

  const updated: ExerciseMastery = {
    ...(existing ?? { userId, exerciseId }),
    xp: currentXP,
    tier,
    updatedAt: new Date().toISOString(),
  };

  await idb.exerciseMastery.put(updated);
  return updated;
}

function computeTier(xp: number): MasteryTier {
  return getTierForXP(xp).tier;
}

/** Limpa todo o banco local (usado em logout) */
export async function clearLocalDB(): Promise<void> {
  await Promise.all([
    idb.workoutSheets.clear(),
    idb.workoutHistory.clear(),
    idb.exerciseMastery.clear(),
    idb.userProfiles.clear(),
    idb.trainingCycles.clear(),
    idb.pendingMutations.clear(),
    idb.bodyMeasurements.clear(),
    idb.bodyPhotos.clear(),
    // legacyState (cópia bruta do localStorage legado) é mantida de propósito:
    // é a cópia de segurança dos dados da versão offline.
    // idb.exercises também é mantida (seed/exercícios do usuário).
  ]);
}
