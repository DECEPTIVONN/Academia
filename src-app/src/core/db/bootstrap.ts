/**
 * bootstrap.ts — Inicialização offline-first do banco local
 *
 * Ordem (uma única vez por carregamento):
 *   1. ensureSeed()            → popula exercises/sheets se o banco estiver vazio
 *   2. backfillExerciseImages()→ preenche imageUrl de exercícios cujo GIF chegou
 *                                depois do seed original (idempotente; espelha a
 *                                sincronização de imagens do loadDB() legado)
 *   3. migrateLegacyData()     → importa o localStorage da v3.5.7 (`academia_treino`)
 *                                 por cima do seed, preservando os dados do usuário
 *   4. flushQueue()            → tenta enviar mutações pendentes do Supabase
 *
 * Idempotente e tolerante a falhas: um erro aqui nunca impede o app de renderizar
 * (seeds e migração guardam as próprias marcas; reexecuções são seguras).
 */

import { idb } from '@/core/db/idb';
import { DEFAULT_EXERCISES, DEFAULT_SHEETS } from '@/core/db/default-data';
import { LOCAL_USER_ID } from '@/core/db/schema';
import {
  migrateLegacyData,
  isLegacyMigrated,
  ensureProfileState,
} from '@/core/db/legacy-migrator';
import { flushQueue } from '@/core/db/sync-queue';

let started = false;

/** Popula o banco na primeira execução (banco vazio). */
async function ensureSeed(): Promise<void> {
  const exerciseCount = await idb.exercises.count();
  if (exerciseCount === 0) {
    await idb.exercises.bulkPut(DEFAULT_EXERCISES);
    console.log(`[bootstrap] seed: ${DEFAULT_EXERCISES.length} exercícios`);
  }

  const sheetCount = await idb.workoutSheets.count();
  if (sheetCount === 0) {
    await idb.workoutSheets.bulkPut(
      DEFAULT_SHEETS.map((sheet) => ({ ...sheet, userId: LOCAL_USER_ID }))
    );
    console.log(`[bootstrap] seed: ${DEFAULT_SHEETS.length} fichas`);
  }
}

/**
 * Preenche `imageUrl` de exercícios pré-cadastrados cujo GIF só foi entregue
 * depois do seed original (ex.: `ex-extensao-lombar`). Idempotente — só toca em
 * registros com `imageUrl` nulo; espelha a sincronização automática de imagens
 * do `loadDB()` legado (`JS/treino/db.js`).
 */
async function backfillExerciseImages(): Promise<void> {
  const withImage = DEFAULT_EXERCISES.filter((ex) => ex.imageUrl);
  for (const def of withImage) {
    const existing = await idb.exercises.get(def.id);
    if (existing && !existing.imageUrl) {
      await idb.exercises.update(def.id, { imageUrl: def.imageUrl });
    }
  }
}

/** Executa seed → backfill → migração → flush. Seguro de chamar várias vezes. */
export async function bootstrap(userId: string = LOCAL_USER_ID): Promise<void> {
  if (started) return Promise.resolve();
  started = true;

  try {
    await ensureSeed();
    await backfillExerciseImages();
  } catch (err) {
    console.warn('[bootstrap] falha no seed:', err);
  }

  try {
    if (!isLegacyMigrated()) {
      const summary = await migrateLegacyData(userId);
      console.log('[bootstrap] migração v3 →', summary);
      if (summary.errors.length > 0) {
        console.warn('[bootstrap] erros na migração:', summary.errors);
      }
    }
  } catch (err) {
    console.warn('[bootstrap] falha na migração legada:', err);
  }

  // Fase 2: deriva o estado de perfil/customização da cópia bruta (se ausente)
  try {
    await ensureProfileState();
  } catch (err) {
    console.warn('[bootstrap] falha ao derivar profileState:', err);
  }

  try {
    if (navigator.onLine) await flushQueue();
  } catch (err) {
    console.warn('[bootstrap] falha no flush da fila:', err);
  }

  // Avisa a UI que o banco local está pronto (seed + migração concluídos)
  document.dispatchEvent(new CustomEvent('academia:db-ready'));
}
