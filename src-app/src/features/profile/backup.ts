/**
 * backup.ts — Exportação de dados no formato legado (Fase 2)
 * Espelha `exportData()` de JS/treino/secao-perfil.js: monta o JSON no shape
 * `academia_treino` (exercicios/fichas/historico/…) a partir das tabelas do
 * IndexedDB + cópia bruta, tenta navigator.share e cai para download.
 */

import { idb } from '@/core/db/idb';
import { loadLocalData, today, type LocalData } from '@/core/db/queries';
import { LOCAL_USER_ID, type ProfileState } from '@/core/db/schema';

function reverseImagePath(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  return imageUrl.replace(/^\/assets\//i, './Assets/');
}

/** Monta o objeto backup no formato do `academia_treino` legado. */
export function buildLegacyBackup(data: LocalData, profile: ProfileState | null): unknown {
  const base = JSON.parse(JSON.stringify(data.legacy ?? {})) as Record<string, unknown>;

  const fichas: Record<string, string[]> = {};
  const aerobicos: Record<string, unknown> = {};
  for (const sheet of data.sheets) {
    fichas[sheet.sheetKey] = sheet.exerciseIds;
    if (sheet.aerobic) {
      aerobicos[sheet.sheetKey] = {
        tipo: sheet.aerobic.tipo,
        vel: sheet.aerobic.vel,
        tempo: sheet.aerobic.tempo,
      };
    }
  }

  const historico: Record<string, unknown> = {};
  for (const row of data.history) {
    historico[row.date] = {
      treino: row.sheetKey ?? undefined,
      checks: row.checks,
      concluido: row.completed,
      treinos: row.completedKeys,
      seriesDone: row.seriesDone,
      duracaoTotal:
        typeof row.durationMin === 'number' && row.durationMin > 0
          ? row.durationMin * 60
          : undefined,
    };
  }

  return {
    ...base,
    exercicios: data.exercises.map((ex) => ({
      id: ex.id,
      nome: ex.name,
      grupoMuscular: ex.muscleGroup,
      series: ex.sets,
      repeticoes: ex.reps,
      carga: ex.load,
      descanso: ex.rest,
      imagem: reverseImagePath(ex.imageUrl),
      tags: ex.tags,
      porLado: ex.porLado || undefined,
      anotacoes: ex.notes || undefined,
    })),
    fichas,
    aerobicos,
    historico,
    profileCustomization: profile?.customization ?? base.profileCustomization ?? {},
    selectedEmblems: profile?.selectedEmblems ?? base.selectedEmblems ?? [],
    conquistas: profile?.conquistas ?? base.conquistas ?? [],
  };
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Exporta o backup (share quando suportado; senão download). */
export async function exportBackupData(): Promise<'shared' | 'downloaded'> {
  const [data, profileRow] = await Promise.all([
    loadLocalData(),
    idb.profileState.get('local'),
  ]);

  const dataStr = JSON.stringify(buildLegacyBackup(data, profileRow ?? null), null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const fileName = `academia_backup_${today()}.json`;

  if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
    try {
      const file = new File([blob], fileName, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Backup EVO FIT',
          text: 'Meu backup do EVO FIT Workout Tracker',
        });
        return 'shared';
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'shared';
      console.warn('[exportBackupData] navigator.share falhou, usando download:', err);
    }
  }

  downloadBlob(blob, fileName);
  return 'downloaded';
}

/** Importa um backup legado (valida + replace completo + evento de reload). */
export async function importBackupFile(file: File): Promise<void> {
  const content = await file.text();
  const parsed = JSON.parse(content) as unknown;
  const { importLegacyBackup } = await import('@/core/db/legacy-migrator');
  await importLegacyBackup(LOCAL_USER_ID, parsed);
}
