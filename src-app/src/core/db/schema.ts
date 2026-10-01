/**
 * schema.ts — Tipos TypeScript do banco de dados
 * Espelha o schema SQL do Supabase + o schema do localStorage legado (README.md)
 * FONTE ÚNICA DA VERDADE para tipagem de dados em todo o app.
 */

/* ── Exercício ── */
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
  | 'Máquina'
  | 'Livre'
  | 'Cabo'
  | 'Peso Corporal'
  | 'Haltere'
  | 'Barra'
  | 'Funcional';

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

/* ── Histórico de Treino ── */
export interface WorkoutHistory {
  id?: string;
  userId: string;
  date: string;              // YYYY-MM-DD
  sheetKey: SheetKey | null;
  completed: boolean;
  checks: string[];          // IDs de exercícios concluídos
  durationMin: number | null;
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
