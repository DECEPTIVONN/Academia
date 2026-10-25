/**
 * schema.ts — Tipos TypeScript do banco de dados
 * Espelha o schema SQL do Supabase + o schema do localStorage legado (README.md)
 * FONTE ÚNICA DA VERDADE para tipagem de dados em todo o app.
 */

/* ── Exercício ── */

/** Usuário local (offline) — usado quando o Supabase Auth não está em uso.
 *  Substitui os IDs divergentes que existiam antes ('default' / 'user-local'). */
export const LOCAL_USER_ID = 'local';

export interface Exercise {
  id: string;                  // ex: "ex-a1" (IDs legados preservados)
  name: string;
  muscleGroup: MuscleGroup;
  sets: number;
  reps: string;
  load: string;
  rest: number;                // segundos
  imageUrl: string | null;
  tags: ExerciseTag[];
  /** Legado: exercício executado "por lado" (ex: Crucifixo) */
  porLado?: boolean;
  /** Legado: `anotacoes` — nota rápida do usuário no exercício */
  notes?: string;
  /** Legado: `historicoCargas` — evolução de carga (máx. 15 entradas). */
  historicoCargas?: { data: string; valor: number; label: string }[];
  createdAt?: string;
}

export type MuscleGroup =
  | 'Peito'
  | 'Costas'
  | 'Pernas'
  | 'Ombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Core'
  | 'Cardio'
  | 'Glúteos'
  | 'Antebraços';

export type ExerciseTag =
  | 'Multiarticular'
  | 'Isolado'
  | 'Isolador'          // variante usada pelo legado (db.js)
  | 'Máquina'
  | 'Livre'
  | 'Cabo'
  | 'Peso Corporal'
  | 'Peso do Corpo'     // variante usada pelo legado (db.js)
  | 'Haltere'
  | 'Barra'
  | 'Funcional'
  | 'Unilateral'        // chips do form legado (modais.html L145–160)
  | 'Explosão'
  | 'Mobilidade';

/* ── Ficha de Treino (A–J) ── */
export type SheetKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';

export interface WorkoutSheet {
  id?: string;
  userId: string;
  sheetKey: SheetKey;
  exerciseIds: string[];
  aerobic: AerobicConfig | null;
  isArchived: boolean;
  updatedAt?: string;
}

export interface AerobicConfig {
  tipo: string;
  vel: string;
  tempo: string;    // minutos
}

/**
 * Cardio padrão de TODO treino (v4.31.0): 10 minutos de esteira a 3 km/h de
 * velocidade média. Usado como fallback de leitura quando a ficha não tem
 * aeróbico configurado (`aerobic: null`) — vale para fichas já existentes e
 * para as novas, sem precisar migrar dados.
 */
export const DEFAULT_AEROBIC: AerobicConfig = {
  tipo: 'Esteira',
  vel: '3',
  tempo: '10',
};

/** Cardio efetivo de uma ficha: o configurado ou o padrão (`DEFAULT_AEROBIC`). */
export function effectiveAerobic(
  aerobic: AerobicConfig | null | undefined
): AerobicConfig | null {
  if (aerobic?.tipo === 'Nenhum') return null;
  return aerobic?.tipo ? aerobic : DEFAULT_AEROBIC;
}

/* ── Histórico de Treino ── */
export interface WorkoutHistory {
  id?: string;
  userId: string;
  date: string;              // YYYY-MM-DD
  sheetKey: SheetKey | null;
  completed: boolean;
  checks: string[];          // IDs de exercícios concluídos
  /** Série a série de cada exercício no dia (legado: `historico[data].seriesDone`). */
  seriesDone?: Record<string, boolean[]>;
  /** Letras concluídas no dia (legado: `historico[data].treinos`). */
  completedKeys?: string[];
  durationMin: number | null;
  /** Minutos no Modo Foco (legado: `historico[data].duracaoFoco`). */
  focusMin?: number;
  createdAt?: string;
}

/* ── Maestria de Exercício ── */
export type MasteryTier = 'none' | 'bronze' | 'prata' | 'ouro' | 'elite';

export interface ExerciseMastery {
  id?: string;
  userId: string;
  exerciseId: string;
  xp: number;
  tier: MasteryTier;
  updatedAt?: string;
}

/* ── Conquistas ── */
export interface Achievement {
  id?: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export type AchievementId =
  | 'monstro-de-forca'
  | 'mestre-do-cardio'
  | 'equilibrista'
  | 'resistencia-de-ferro'
  | 'guerreiro-do-core'
  | 'primeiro-treino'
  | 'semana-perfeita'
  | 'ciclo-completo'
  | string;   // extensível

/* ── Perfil do Usuário ── */
export interface UserProfile {
  userId: string;
  displayName: string;
  handle: string;
  bannerSkin: BannerSkin;
  barSkin: BarSkin;
  avatarFrame: AvatarFrame;
  title: string | null;
  archetype: Archetype | null;
  selectedEmblems: string[];
  pushSubscription: PushSubscriptionJSON | null;
  updatedAt?: string;
}

export type BannerSkin =
  | 'roxo-neon'
  | 'aurora'
  | 'fogo-eterno'
  | 'ouro-elite'
  | 'ciberespaco'
  | 'shadow-ops'
  | 'aco-frio'
  | 'dragao-ouro'
  | 'plasma'
  | 'aurora-viva'
  | 'vulcao'
  | 'matrix'
  | 'nebulosa';

export type BarSkin = 'default' | 'radar' | 'hourglass';

export type AvatarFrame = 'none' | 'bronze' | 'prata' | 'ouro' | 'elite';

export type Archetype =
  | 'Guerreiro'
  | 'Atleta'
  | 'Especialista'
  | 'Mestre'
  | 'Lenda';

/* ── Ciclo de 30 Dias ── */
export interface TrainingCycle {
  id?: string;
  userId: string;
  startDate: string;          // YYYY-MM-DD
  workoutsCount: number;
  cycleEvents: Record<string, CycleEvent>;
  currentBreakdown: Record<SheetKey, number>;
  isActive: boolean;
  createdAt?: string;
}

export interface CycleEvent {
  type: 'treino' | 'descanso' | 'falta';
  sheetKey?: SheetKey;
}

/* ── Radar de Atributos ── */
export interface RadarStats {
  forca: number;       // 0–100
  resistencia: number;
  equilibrio: number;
  cardio: number;
  core: number;
}

/* ── Fila de Mutações Offline ── */
export type MutationOperation = 'upsert' | 'delete';

export interface PendingMutation {
  id?: number;           // auto-increment IndexedDB
  table: string;         // nome da tabela Supabase
  operation: MutationOperation;
  payload: Record<string, unknown>;
  timestamp: number;     // Date.now()
  retries: number;
}

/* ── Estado do Treino Ativo ── */
export interface ActiveWorkout {
  sheetKey: SheetKey;
  startTime: number;     // timestamp ms
  date: string;          // YYYY-MM-DD
  checks: Set<string>;   // IDs de exercícios concluídos
}

/* ── Migração v3 (offline) → v4 (React) ── */

/**
 * Cópia bruta do estado da versão offline.
 * A chave é a chave do `localStorage` legado (ex.: `academia_treino`);
 * `value` guarda o JSON original parseado, para que as features ainda não
 * portadas (maestria, conquistas, ciclo, personalização…) possam ler os dados
 * sem perda. Protegida de `clearLocalDB()`.
 */
export interface LegacyState {
  key: string;
  value: unknown;
  updatedAt: string;
}

/* ── Perfil / Personalização (Fase 2 — espelha `db.profileCustomization` do legado) ── */

export interface ProfileCustomization {
  nome: string;
  handle: string;
  avatarSeed: string;
  banner: string | null;
  titulo: string | null;
  avatarFrame: string | null;
  assinatura: string;
  barSkin: string;
  cardSkin: string;
  showcaseStat: string;
  mainEmblem: string;
  mainEmblemPulse: boolean;
  timerSkin?: string;
  email?: string;
  senha?: string;
  /** Ano de "AQUI DESDE" (legado usa '2024' como fallback) */
  since?: string;
  /** v4.9.3-settings — URL ou data-URL da foto de perfil customizada */
  photo?: string;
  /** v4.41.x — onboarding opcional */
  age?: number;
  weightKg?: number;
  activityDurationValue?: number;
  activityDurationUnit?: 'weeks' | 'months' | 'years';
  onboarded?: boolean;
  onboardingObjective?: string;
  /** v4.47.0 — perguntas pós-login (onboarding em etapas) */
  /** Motivo de usar o app (v4.47 — escolha única, legado; v4.49 usa appReasons) */
  appReason?: string;
  /** Principais objetivos fitness */
  mainGoals?: string;
  /** Tempo de experiência com musculação */
  experienceLevel?: string;
  /** Sexo */
  gender?: string;
  /** Frequência de treino (dias por semana, 7 = todos os dias) */
  trainingFrequencyDays?: number;
  /** Local de treino */
  trainingPlace?: string;
  /** v4.49.0 — 2º lote de perguntas pós-login */
  /** Altura (cm) */
  heightCm?: number;
  /** Motivos de usar o app de fitness (múltipla escolha, máx. 3) */
  appReasons?: string[];
  /** Como o usuário conheceu o app */
  referralSource?: string;
  /** Notificações ativadas no onboarding */
  notificationsEnabled?: boolean;
}

/** Conquista gravada em `db.conquistas` — string (id fixo) ou objeto datado. */
export type ProfileConquista =
  | string
  | { id: string; icon?: string; titulo?: string; name?: string; desc?: string; data?: string };

/**
 * Estado do perfil derivado da cópia bruta legada.
 * Chave única `local`; gravado na tabela `profileState` (store v3 do Dexie).
 */
export interface ProfileState {
  key: string;
  customization: ProfileCustomization;
  selectedEmblems: string[];
  conquistas: ProfileConquista[];
}

/** Defaults idem `initDB()`/`loadDB()` de JS/treino/db.js (L265–309). */
export const DEFAULT_PROFILE_CUSTOMIZATION: ProfileCustomization = {
  nome: 'DECEPTIVON',
  handle: '@deceptivon',
  avatarSeed: 'Deceptivon',
  banner: 'roxo-neon',
  titulo: null,
  avatarFrame: null,
  assinatura: '',
  barSkin: 'default',
  cardSkin: 'default',
  showcaseStat: 'streak',
  mainEmblem: 'prestigio-1',
  mainEmblemPulse: true,
};

/* ── Supabase Database Types (gerado manualmente — rodar supabase gen types para atualizar) ── */
export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string;
          name: string;
          muscle_group: string;
          sets: number;
          reps: string;
          load: string;
          rest: number;
          image_url: string | null;
          tags: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exercises']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>;
      };
      workout_sheets: {
        Row: {
          id: string;
          user_id: string;
          sheet_key: string;
          exercise_ids: string[];
          aerobic: AerobicConfig | null;
          is_archived: boolean;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_sheets']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['workout_sheets']['Insert']>;
      };
      workout_history: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          sheet_key: string | null;
          completed: boolean;
          checks: string[];
          duration_min: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_history']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['workout_history']['Insert']>;
      };
      exercise_mastery: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          xp: number;
          tier: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exercise_mastery']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['exercise_mastery']['Insert']>;
      };
      user_profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          handle: string | null;
          banner_skin: string;
          bar_skin: string;
          avatar_frame: string;
          title: string | null;
          archetype: string | null;
          selected_emblems: string[];
          push_subscription: PushSubscriptionJSON | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
    };
  };
}
