/**
 * legacy-migrator.ts — Leitor e migrador de dados do localStorage legado (v3.5.7)
 * Lê os dados das chaves legadas e importa para o Dexie IndexedDB / Supabase.
 */

import { saveWorkoutSheet, saveWorkoutLog, saveCustomExercise } from '@/core/db/idb';
import type { WorkoutSheet, WorkoutHistory, Exercise, SheetKey } from '@/core/db/schema';

export interface MigrationSummary {
  sheetsMigrated: number;
  logsMigrated: number;
  customExercisesMigrated: number;
  alreadyMigrated: boolean;
  errors: string[];
}

const MIGRATION_MARKER = 'academia_v4_migrated';

/**
 * Verifica se a migração legada já foi executada neste navegador.
 */
export function isLegacyMigrated(): boolean {
  return localStorage.getItem(MIGRATION_MARKER) === 'true';
}

/**
 * Executa a migração do localStorage legado para o IndexedDB Dexie.
 */
export async function migrateLegacyData(userId: string): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    sheetsMigrated: 0,
    logsMigrated: 0,
    customExercisesMigrated: 0,
    alreadyMigrated: false,
    errors: [],
  };

  if (isLegacyMigrated()) {
    summary.alreadyMigrated = true;
    return summary;
  }

  try {
    /* 1. Migrar Fichas de Treino (treinosSalvos / treinoAtual) */
    const rawSheets = localStorage.getItem('treinosSalvos') || localStorage.getItem('treinoAtual');
    if (rawSheets) {
      try {
        const parsed = JSON.parse(rawSheets);
        const sheetsArray = Array.isArray(parsed) ? parsed : [parsed];

        for (const sheet of sheetsArray) {
          if (!sheet || typeof sheet !== 'object') continue;

          const migratedSheet: WorkoutSheet = {
            id: sheet.id || `sheet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            userId: userId,
            sheetKey: (sheet.sheetKey || sheet.letra || 'A') as SheetKey,
            exerciseIds: (sheet.exercicios || sheet.exerciseIds || []).map((ex: any) =>
              typeof ex === 'string' ? ex : ex.id || `ex-${Math.random().toString(36).substring(2, 7)}`
            ),
            aerobic: sheet.aerobico ? {
              tipo: sheet.aerobico.tipo || 'Esteira',
              vel: sheet.aerobico.vel || '8km/h',
              tempo: sheet.aerobico.tempo || '20min',
            } : null,
            isArchived: false,
            updatedAt: new Date().toISOString(),
          };

          await saveWorkoutSheet(migratedSheet);
          summary.sheetsMigrated++;
        }
      } catch (err: any) {
        summary.errors.push(`Erro ao migrar fichas: ${err.message}`);
      }
    }

    /* 2. Migrar Histórico de Treinos (historicoTreinos) */
    const rawHistory = localStorage.getItem('historicoTreinos');
    if (rawHistory) {
      try {
        const historyArray = JSON.parse(rawHistory);
        if (Array.isArray(historyArray)) {
          for (const log of historyArray) {
            if (!log) continue;

            const migratedLog: WorkoutHistory = {
              id: log.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              userId: userId,
              date: log.data || log.date || new Date().toISOString().split('T')[0],
              sheetKey: (log.treinoId || log.sheetKey || 'A') as SheetKey,
              completed: log.concluido ?? true,
              checks: log.exerciciosConcluidos || log.checks || [],
              durationMin: log.duracaoMin || log.durationMin || null,
              createdAt: log.dataInicio || new Date().toISOString(),
            };

            await saveWorkoutLog(migratedLog);
            summary.logsMigrated++;
          }
        }
      } catch (err: any) {
        summary.errors.push(`Erro ao migrar histórico: ${err.message}`);
      }
    }

    /* 3. Migrar Exercícios Customizados (exerciciosCustomizados) */
    const rawCustom = localStorage.getItem('exerciciosCustomizados');
    if (rawCustom) {
      try {
        const customArray = JSON.parse(rawCustom);
        if (Array.isArray(customArray)) {
          for (const ex of customArray) {
            if (!ex) continue;

            const migratedCustom: Exercise = {
              id: ex.id || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name: ex.nome || ex.name || 'Exercício Personalizado',
              muscleGroup: ex.grupoMuscular || ex.muscleGroup || 'Geral',
              sets: Number(ex.series || ex.sets || 3),
              reps: String(ex.repeticoes || ex.reps || '10-12'),
              load: String(ex.carga || ex.load || '0kg'),
              rest: Number(ex.descanso || ex.rest || 60),
              imageUrl: ex.gif || ex.imageUrl || null,
              tags: ex.tags || ['Personalizado'],
              createdAt: new Date().toISOString(),
            };

            await saveCustomExercise(migratedCustom);
            summary.customExercisesMigrated++;
          }
        }
      } catch (err: any) {
        summary.errors.push(`Erro ao migrar exercícios customizados: ${err.message}`);
      }
    }

    localStorage.setItem(MIGRATION_MARKER, 'true');
  } catch (err: any) {
    summary.errors.push(`Erro crítico na migração: ${err.message}`);
  }

  return summary;
}
