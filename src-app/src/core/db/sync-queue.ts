/**
 * sync-queue.ts — Fila de mutações offline
 * Pattern offline-first:
 *   1. Escreve no IndexedDB imediatamente (update otimista)
 *   2. Enfileira a mutação
 *   3. Quando online → flush para o Supabase
 *
 * A fila preserva a ORDEM das operações (FIFO).
 * Em caso de falha de rede, para na primeira falha e retenta depois.
 */

import { idb } from './idb';
import type { PendingMutation } from './schema';

/* ── Referência ao cliente Supabase (import lazy para evitar circular) ── */
async function getSupabase() {
  const { supabase } = await import('@/core/supabase');
  return supabase;
}

/* ── Enfileirar mutação ── */
export async function enqueue(
  table: string,
  operation: PendingMutation['operation'],
  payload: Record<string, unknown>
): Promise<void> {
  await idb.pendingMutations.add({
    table,
    operation,
    payload,
    timestamp: Date.now(),
    retries: 0,
  });

  // Tentar flush imediato se online
  if (navigator.onLine) {
    void flushQueue();
  }
}

/* ── Flush da fila para o Supabase ── */
export async function flushQueue(): Promise<void> {
  const pending = await idb.pendingMutations
    .orderBy('timestamp')
    .toArray();

  if (pending.length === 0) return;

  const supabase = await getSupabase();

  for (const mutation of pending) {
    try {
      await applyMutation(supabase, mutation);
      await idb.pendingMutations.delete(mutation.id!);
    } catch (error) {
      // Incrementa retries e para (preserva ordem FIFO)
      await idb.pendingMutations.update(mutation.id!, {
        retries: mutation.retries + 1,
      });
      console.warn('[sync-queue] Falha ao sincronizar, tentativa', mutation.retries + 1, error);
      break;
    }
  }
}

/* ── Aplica uma mutação no Supabase ── */
async function applyMutation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  mutation: PendingMutation
): Promise<void> {
  const { table, operation, payload } = mutation;

  if (operation === 'upsert') {
    const { error } = await supabase
      .from(table)
      .upsert(payload, { onConflict: resolveConflictKey(table) });

    if (error) throw error;
  } else if (operation === 'delete') {
    const { error } = await supabase
      .from(table)
      .delete()
      .match(payload);  // payload deve conter as keys de identificação

    if (error) throw error;
  }
}

/* ── Resolve a coluna de conflito por tabela ── */
function resolveConflictKey(table: string): string {
  const conflictKeys: Record<string, string> = {
    workout_sheets:   'user_id,sheet_key',
    workout_history:  'user_id,date',
    exercise_mastery: 'user_id,exercise_id',
    user_profiles:    'user_id',
  };
  return conflictKeys[table] ?? 'id';
}

/* ── Listeners de conectividade ── */
window.addEventListener('online', () => {
  console.log('[sync-queue] Online — iniciando sync');
  void flushQueue();
});

// Background Sync API (quando disponível via Service Worker)
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.ready.then(registration => {
    // @ts-expect-error SyncManager ainda não tem tipos completos no TS
    // v4.9.0-sync: `.catch` explícito — em headless/incognito o Chrome rejeita
    // com "Background Sync is disabled." e a rejeição flutuante virava erro
    // de console/unhandled rejection no probe.
    registration.sync.register('sync-mutations').catch(() => {});
  }).catch(console.warn);
}

/* ── Utilitário: quantas mutações pendentes ── */
export async function getPendingCount(): Promise<number> {
  return idb.pendingMutations.count();
}
