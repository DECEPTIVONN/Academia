/**
 * personal-types.ts — Tipos do Painel do Personal (CRM do treinador)
 *
 * O painel do personal é um aplicativo separado dentro do mesmo bundle: ele
 * tem login próprio (ver personal-auth.ts) e dados próprios no mesmo IndexedDB
 * (tabelas `pt*`, criadas na versão 5 do banco em core/db/idb.ts).
 *
 * A ponte com o app do aluno acontece pelo aparelho: um aluno pode ser
 * "vinculado a este aparelho" (`linkedDevice`), e nesse caso o painel lê o
 * treino real do app (histórico/ficha ativa) e pode publicar fichas direto na
 * conta local do aluno (ver personal-bridge.ts).
 */

export type PtPlan = 'Mensal' | 'Trimestral' | 'Online' | 'Avulso';
export type PtStudentStatus = 'ativo' | 'atencao' | 'inativo' | 'pausado';
export type PtLevel = 'Iniciante' | 'Intermediário' | 'Avançado';
export type PtSheetStatus = 'rascunho' | 'enviada' | 'ativa';
export type PtAlertType =
  | 'finishing'
  | 'completed'
  | 'inactive'
  | 'suggestion'
  | 'payment'
  | 'note';

export interface PtProfile {
  id: 'default';
  name: string;
  email: string;
  /** SHA-256 de `salt:senha` (nunca guardamos a senha em texto). */
  passwordHash: string;
  salt: string;
  cref?: string;
  specialty?: string;
  phone?: string;
  bio?: string;
  /** Mensalidade padrão por plano — usada no financeiro do painel. */
  planPrices: Record<PtPlan, number>;
  seeded?: boolean;
  createdAt: string;
}

export interface PtStudent {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  goal: string;
  level: PtLevel;
  plan: PtPlan;
  monthlyFee: number;
  status: PtStudentStatus;
  weeklyGoal: number;
  joinedAt: string;
  /** Matiz do avatar (0–360) para a identidade visual do card. */
  avatarHue: number;
  /** Aluno que usa o Evo Fit NESTE aparelho: recebe fichas e envia atividade. */
  linkedDevice?: boolean;
  archived?: boolean;
  bio?: string;
  restrictions?: string;
}

export interface PtSheetItem {
  exerciseId: string;
  sets: number;
  reps: string;
  load: string;
  rest: number;
  note?: string;
}

export interface PtSheet {
  id: string;
  studentId: string;
  /** Letra no app do aluno (A–J). */
  letter: string;
  name: string;
  focus: string;
  items: PtSheetItem[];
  notes: string;
  status: PtSheetStatus;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  /** Ficha criada a partir de uma sugestão do motor de progressão. */
  fromSuggestion?: boolean;
}

export interface PtSession {
  id: string;
  studentId: string;
  /** YYYY-MM-DD */
  date: string;
  sheetId?: string;
  sheetLabel: string;
  durationMin: number;
  completed: boolean;
  rpe?: number;
  note?: string;
  origin?: 'aluno' | 'personal' | 'demo';
}

export interface PtAlert {
  id: string;
  type: PtAlertType;
  studentId: string;
  title: string;
  body: string;
  /** Chave estável para nunca duplicar o mesmo aviso. */
  dedupeKey: string;
  createdAt: number;
  read: boolean;
}

export interface PtNote {
  id: string;
  studentId: string;
  body: string;
  createdAt: number;
  pinned?: boolean;
}

export interface PtMessage {
  id: string;
  studentId: string;
  direction: 'coach' | 'student';
  body: string;
  createdAt: number;
  read?: boolean;
}

export interface PtStudentMetrics {
  sessions30: number;
  sessions7: number;
  streak: number;
  adherence: number;
  lastSession: PtSession | null;
  daysSinceLast: number | null;
  totalMinutes: number;
  completionRate: number;
  weekly: { label: string; date: string; count: number }[];
}

export interface PtNextSheetItem extends PtSheetItem {
  name: string;
  muscleGroup: string;
}

export interface PtNextSheet {
  letter: string;
  name: string;
  focus: string;
  reason: string;
  items: PtNextSheetItem[];
}
