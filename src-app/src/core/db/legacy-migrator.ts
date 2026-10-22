/**
 * legacy-migrator.ts — Migrador dos dados da versão offline v3.5.7 → v4 (React)
 *
 * A fonte da verdade do legado é UMA única chave do localStorage:
 *   `academia_treino`  (JS/treino/db.js → loadDB/saveDB)
 *
 * Estratégia:
 *   1. Guarda uma CÓPIA BRUTA do JSON em `legacyState` (IndexedDB) — as
 *      features ainda não portadas (maestria, conquistas, ciclo 30 dias,
 *      personalização/perfil, calendário…) leem daqui sem perda de dados.
 *   2. Deriva as tabelas que o app React já consome:
 *      `exercises`, `workoutSheets`, `workoutHistory`.
 *   3. Marca `academia_v4_migrated` no localStorage (idempotente).
 *
 * Ordem de execução (ver bootstrap.ts): SEED primeiro, migração depois.
 * Assim os valores digitados pelo usuário no legado (carga, fichas,
 * aeróbicos, histórico) sobrescrevem os dados padrão via `put`.
 *
 * O que NÃO é derivado (e permanece só em `legacyState`, portado nas fases
 * seguintes): `maestrias`, `conquistas`, `perfilCustom`, `cycleEvents`,
 * `currentCycleStartDate`, `dashboard`, `fichasArquivadas` (ciclos antigos).
 */

import { idb } from '@/core/db/idb';
import type { LegacyRaw } from '@/core/db/queries';
import {
  DEFAULT_PROFILE_CUSTOMIZATION,
  type WorkoutSheet,
  type WorkoutHistory,
  type Exercise,
  type SheetKey,
  type AerobicConfig,
} from '@/core/db/schema';

const LEGACY_DB_KEY = 'academia_treino';
const MIGRATION_MARKER = 'academia_v4_migrated';

export interface MigrationSummary {
  alreadyMigrated: boolean;
  legacyFound: boolean;
  exercisesMigrated: number;
  sheetsMigrated: number;
  logsMigrated: number;
  rawSaved: boolean;
  errors: string[];
}

/* ── Tipos do legado (parciais — o restante vive na cópia bruta) ── */

interface LegacyExercise {
  id: string;
  nome: string;
  grupoMuscular: string;
  series: number;
  repeticoes: string | number;
  carga: string;
  descanso: number;
  imagem: string | null;
  tags?: string[];
  porLado?: boolean;
  anotacoes?: string;
  historicoCargas?: { data: string; valor: number; label: string }[];
}

interface LegacyAerobic {
  tipo?: string;
  vel?: string;
  tempo?: string;
}

interface LegacyHistoryEntry {
  treino?: string;
  treinos?: string[];
  concluido?: boolean;
  checks?: string[];
  seriesDone?: Record<string, boolean[]>;
  duracaoTotal?: number;
  duracaoFoco?: number;
}

interface LegacyDB {
  exercicios?: LegacyExercise[];
  fichas?: Partial<Record<SheetKey, string[]>>;
  aerobicos?: Partial<Record<SheetKey, LegacyAerobic | null>>;
  historico?: Record<string, LegacyHistoryEntry>;
  [other: string]: unknown;
}

/* ── Helpers ── */

export function isLegacyMigrated(): boolean {
  try {
    return localStorage.getItem(MIGRATION_MARKER) === 'true';
  } catch {
    return true; // sem localStorage (ambiente bloqueado) → não tenta migrar
  }
}

function markMigrated(): void {
  try {
    localStorage.setItem(MIGRATION_MARKER, 'true');
  } catch {
    /* ignora */
  }
}

const SHEET_KEYS: SheetKey[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

function toSheetKey(value: unknown): SheetKey | null {
  const k = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return (SHEET_KEYS as string[]).includes(k) ? (k as SheetKey) : null;
}

/** Legado: imagem `./Assets/exerciciosgif/x.gif` → app: `/assets/exerciciosgif/x.gif` */
function mapImageUrl(imagem: string | null | undefined): string | null {
  if (!imagem) return null;
  return imagem
    .replace(/^\.\//, '/')
    .replace(/^\/?Assets\//i, '/assets/')
    .replace(/^\/assets\/exerciciosgif\//i, '/assets/exerciciosgif/');
}

function mapLegacyExercise(ex: LegacyExercise): Exercise {
  const mapped: Exercise = {
    id: ex.id,
    name: ex.nome,
    muscleGroup: ex.grupoMuscular as Exercise['muscleGroup'],
    sets: Number(ex.series) || 3,
    reps: String(ex.repeticoes ?? '10'),
    load: String(ex.carga ?? ''),
    rest: Number(ex.descanso) || 30,
    imageUrl: mapImageUrl(ex.imagem),
    tags: (ex.tags ?? []) as Exercise['tags'],
  };
  if (ex.porLado) mapped.porLado = true;
  if (ex.anotacoes) mapped.notes = ex.anotacoes;
  if (Array.isArray(ex.historicoCargas) && ex.historicoCargas.length > 0) {
    mapped.historicoCargas = ex.historicoCargas.slice(-15);
  }
  return mapped;
}

function mapLegacyAerobic(ae: LegacyAerobic | null | undefined): AerobicConfig | null {
  if (!ae || !ae.tipo) return null;
  return {
    tipo: ae.tipo || '',
    vel: ae.vel || '',
    tempo: ae.tempo || '',
  };
}

/* ── Migração ── */

/** Deriva as tabelas do React a partir de um objeto legado já parseado.
 *  Usado pela migração inicial (localStorage) e pela importação de backup.
 *  O userId é inserido em todas as linhas para sincronização per-user no Supabase. */
async function migrateLegacyObject(
  legacy: LegacyDB,
  userId: string,
  summary: MigrationSummary
): Promise<void> {
  // 2. Cópia bruta → IndexedDB (backup + dados das features não portadas)
  try {
    await idb.legacyState.put({
      key: LEGACY_DB_KEY,
      value: legacy,
      updatedAt: new Date().toISOString(),
    });
    summary.rawSaved = true;
  } catch (err) {
    summary.errors.push(`Falha ao salvar cópia bruta: ${(err as Error).message}`);
  }

  // 3. Exercícios (padrão + customizados do usuário; `put` sobrescreve o seed)
  if (Array.isArray(legacy.exercicios)) {
    try {
      const exercises = legacy.exercicios
        .filter((e) => e && e.id && e.nome)
        .map((e) => ({ ...mapLegacyExercise(e), userId }));

      await idb.exercises.bulkPut(exercises);
      summary.exercisesMigrated = exercises.length;
    } catch (err) {
      summary.errors.push(`Erro ao migrar exercícios: ${(err as Error).message}`);
    }
  }

  // 4. Fichas A–J (com aeróbico configurado no legado)
  if (legacy.fichas && typeof legacy.fichas === 'object') {
    try {
      const sheets: WorkoutSheet[] = SHEET_KEYS
        .filter((key) => legacy.fichas![key] !== undefined)
        .map((key) => ({
          id: `sheet-${key.toLowerCase()}`,
          userId,
          sheetKey: key,
          exerciseIds: (legacy.fichas![key] ?? []).filter((id) => typeof id === 'string'),
          aerobic: mapLegacyAerobic(legacy.aerobicos?.[key]),
          // `fichasArquivadas` guarda snapshots de ciclos inteiros (não letras):
          // a ficha ATIVA nunca está arquivada; os ciclos antigos ficam no raw.
          isArchived: false,
          updatedAt: new Date().toISOString(),
        }));

      await idb.workoutSheets.bulkPut(sheets);
      summary.sheetsMigrated = sheets.length;
    } catch (err) {
      summary.errors.push(`Erro ao migrar fichas: ${(err as Error).message}`);
    }
  }

  // 5. Histórico (uma linha por dia)
  if (legacy.historico && typeof legacy.historico === 'object') {
    try {
      const entries: WorkoutHistory[] = Object.entries(legacy.historico)
        .filter(([, entry]) => entry && typeof entry === 'object')
        .map(([date, entry]) => {
          // Espelha `migrarHistoricoLegado` (secao-progresso.js): entradas com
          // concluido:true mas sem treinos[] ganham a letra de `treino`.
          const treinos =
            Array.isArray(entry.treinos) && entry.treinos.length
              ? entry.treinos
              : entry.concluido && entry.treino
                ? [entry.treino]
                : [];
          const sheetKey =
            toSheetKey(entry.treino) ??
            (treinos.length ? toSheetKey(treinos[treinos.length - 1]) : null);

          return {
            userId,
            date,
            sheetKey,
            completed: entry.concluido === true,
            checks: Array.isArray(entry.checks) ? entry.checks : [],
            seriesDone:
              entry.seriesDone && typeof entry.seriesDone === 'object'
                ? entry.seriesDone
                : undefined,
            completedKeys: treinos.length ? treinos : undefined,
            durationMin:
              typeof entry.duracaoTotal === 'number' && entry.duracaoTotal > 0
                ? Math.max(1, Math.round(entry.duracaoTotal / 60))
                : null,
            focusMin:
              typeof entry.duracaoFoco === 'number' && entry.duracaoFoco > 0
                ? entry.duracaoFoco
                : undefined,
          } as WorkoutHistory;
        })
        .filter((row) => row.sheetKey !== null || row.completed || row.checks.length > 0);

      if (entries.length > 0) {
        await idb.workoutHistory.bulkPut(entries);
        summary.logsMigrated = entries.length;
      }
    } catch (err) {
      summary.errors.push(`Erro ao migrar histórico: ${(err as Error).message}`);
    }
  }
}

export async function migrateLegacyData(userId: string): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    alreadyMigrated: false,
    legacyFound: false,
    exercisesMigrated: 0,
    sheetsMigrated: 0,
    logsMigrated: 0,
    rawSaved: false,
    errors: [],
  };

  if (isLegacyMigrated()) {
    summary.alreadyMigrated = true;
    return summary;
  }

  // 1. Lê o JSON legado
  const raw = localStorage.getItem(LEGACY_DB_KEY);
  if (!raw) {
    markMigrated();
    return summary;
  }

  let legacy: LegacyDB;
  try {
    legacy = JSON.parse(raw) as LegacyDB;
  } catch (err) {
    summary.errors.push(`JSON legado inválido: ${(err as Error).message}`);
    markMigrated(); // não tenta de novo a cada carregamento
    return summary;
  }

  summary.legacyFound = true;

  await migrateLegacyObject(legacy, userId, summary);

  // 6. Só marca como migrado se a cópia bruta foi guardada
  if (summary.rawSaved) {
    markMigrated();
  } else {
    summary.errors.push(
      'Migração NÃO marcada como concluída (cópia bruta não pôde ser salva) — tentará de novo.'
    );
  }

  return summary;
}

/* ── Perfil (Fase 2) ── */

/** Deriva `profileState` da cópia bruta legada (idempotente: só grava se ausente). */
export async function ensureProfileState(): Promise<void> {
  const existing = await idb.profileState.get('local');
  if (existing) return;

  const row = await idb.legacyState.get(LEGACY_DB_KEY);
  const raw = (row?.value ?? null) as LegacyRaw | null;

  await idb.profileState.put({
    key: 'local',
    customization: {
      ...DEFAULT_PROFILE_CUSTOMIZATION,
      ...(raw?.profileCustomization ?? {}),
    },
    selectedEmblems: Array.isArray(raw?.selectedEmblems) ? raw.selectedEmblems : [],
    conquistas: Array.isArray(raw?.conquistas) ? raw.conquistas : [],
  });
}

/* ── Backup (exportação/importação — espelha secao-perfil.js) ── */

function isNonEmptyString(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

function isStringOrNull(v: unknown): boolean {
  return v === null || typeof v === 'string';
}

/** Réplica de `validateBackup` (JS/treino/secao-perfil.js L62–157). */
export function validateBackup(obj: unknown): true {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('Arquivo inválido: raiz deve ser um objeto JSON.');
  }
  const dbObj = obj as Record<string, any>;

  if (!Array.isArray(dbObj.exercicios)) {
    throw new Error('Arquivo inválido: "exercicios" deve ser um array.');
  }
  dbObj.exercicios.forEach((ex: any, i: number) => {
    if (!ex || typeof ex !== 'object') {
      throw new Error(`Exercício #${i + 1} inválido.`);
    }
    if (!isNonEmptyString(ex.id)) throw new Error(`Exercício #${i + 1}: "id" ausente ou vazio.`);
    if (!isNonEmptyString(ex.nome)) throw new Error(`Exercício #${i + 1}: "nome" ausente ou vazio.`);
    if (!isNonEmptyString(ex.grupoMuscular)) {
      throw new Error(`Exercício #${i + 1}: "grupoMuscular" ausente ou vazio.`);
    }
    if (ex.series !== undefined && typeof ex.series !== 'number') {
      throw new Error(`Exercício #${i + 1}: "series" deve ser número.`);
    }
    if (
      ex.repeticoes !== undefined &&
      !isStringOrNull(ex.repeticoes) &&
      typeof ex.repeticoes !== 'number'
    ) {
      throw new Error(`Exercício #${i + 1}: "repeticoes" inválido.`);
    }
    if (ex.carga !== undefined && !isStringOrNull(ex.carga)) {
      throw new Error(`Exercício #${i + 1}: "carga" inválido.`);
    }
    if (ex.imagem !== undefined && !isStringOrNull(ex.imagem)) {
      throw new Error(`Exercício #${i + 1}: "imagem" inválida.`);
    }
  });

  if (!dbObj.fichas || typeof dbObj.fichas !== 'object' || Array.isArray(dbObj.fichas)) {
    throw new Error('Arquivo inválido: "fichas" deve ser um objeto.');
  }
  Object.keys(dbObj.fichas).forEach((letra) => {
    if (!Array.isArray(dbObj.fichas[letra])) {
      throw new Error(`Ficha "${letra}" deve ser um array de IDs.`);
    }
    dbObj.fichas[letra].forEach((id: unknown, j: number) => {
      if (!isNonEmptyString(id)) {
        throw new Error(`Ficha "${letra}" posição ${j + 1}: ID inválido.`);
      }
    });
  });

  if (!dbObj.historico || typeof dbObj.historico !== 'object' || Array.isArray(dbObj.historico)) {
    throw new Error('Arquivo inválido: "historico" deve ser um objeto indexado por data.');
  }
  Object.entries(dbObj.historico).forEach(([date, entry]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Histórico: data "${date}" fora do formato YYYY-MM-DD.`);
    }
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Histórico ${date}: entrada inválida.`);
    }
    const he = entry as Record<string, unknown>;
    if (he.treino !== undefined && !isStringOrNull(he.treino)) {
      throw new Error(`Histórico ${date}: "treino" inválido.`);
    }
    if (he.checks !== undefined && !Array.isArray(he.checks)) {
      throw new Error(`Histórico ${date}: "checks" deve ser array.`);
    }
    if (Array.isArray(he.checks)) {
      he.checks.forEach((id, j) => {
        if (!isNonEmptyString(id)) throw new Error(`Histórico ${date}: check #${j + 1} inválido.`);
      });
    }
    if (he.concluido !== undefined && typeof he.concluido !== 'boolean') {
      throw new Error(`Histórico ${date}: "concluido" deve ser booleano.`);
    }
  });

  if (
    dbObj.aerobicos !== undefined &&
    (typeof dbObj.aerobicos !== 'object' || Array.isArray(dbObj.aerobicos))
  ) {
    throw new Error('Arquivo inválido: "aerobicos" deve ser um objeto.');
  }

  if (dbObj.conquistas !== undefined && !Array.isArray(dbObj.conquistas)) {
    throw new Error('Arquivo inválido: "conquistas" deve ser um array.');
  }

  if (
    dbObj.maestrias !== undefined &&
    (typeof dbObj.maestrias !== 'object' || Array.isArray(dbObj.maestrias))
  ) {
    throw new Error('Arquivo inválido: "maestrias" deve ser um objeto.');
  }

  if (dbObj.profileCustomization !== undefined) {
    const pc = dbObj.profileCustomization;
    if (!pc || typeof pc !== 'object' || Array.isArray(pc)) {
      throw new Error('Arquivo inválido: "profileCustomization" deve ser um objeto.');
    }
    if (pc.nome !== undefined && typeof pc.nome !== 'string') {
      throw new Error('"profileCustomization.nome" deve ser string.');
    }
    if (pc.handle !== undefined && typeof pc.handle !== 'string') {
      throw new Error('"profileCustomization.handle" deve ser string.');
    }
  }

  return true;
}

/** Importa um backup no formato legado, SUBSTITUINDO os dados atuais
 *  (espelha `importData()` de secao-perfil.js: replace completo + evento). */
export async function importLegacyBackup(
  userId: string,
  parsed: unknown
): Promise<MigrationSummary> {
  validateBackup(parsed);
  const legacy = parsed as LegacyDB;

  const summary: MigrationSummary = {
    alreadyMigrated: false,
    legacyFound: true,
    exercisesMigrated: 0,
    sheetsMigrated: 0,
    logsMigrated: 0,
    rawSaved: false,
    errors: [],
  };

  // Replace completo (o arquivo é a nova verdade) — idem `localStorage[DB_KEY] = …`
  await idb.exercises.clear();
  await idb.workoutSheets.clear();
  await idb.workoutHistory.clear();
  await idb.profileState.delete('local');

  await migrateLegacyObject(legacy, userId, summary);
  markMigrated();
  await ensureProfileState();

  return summary;
}
