/**
 * offline-queue.ts — Fila de mutações offline (IndexedDB) (v4.9.0-sync)
 *
 * Port da Section 3 do SupabaseSyncSecurityStandalone.tsx
 * (IndexedDB Mutation Queue Pattern):
 *   • fila transacional persistida no IndexedDB (sobrevive a reloads);
 *   • backup de emergência no localStorage por sync key;
 *   • flush automático ao voltar a conexão (window 'online');
 *   • contagem de pendências para o card visual das Configurações.
 */

import {
  getSyncSupabaseClient,
  dataSyncKey,
} from './supabase-client';

export interface OfflineMutation {
  id: string;
  syncKey: string;
  payload: unknown;
  type: string;
  createdAt: number;
  status: 'pending' | 'processing' | 'synced' | 'failed';
  retryCount: number;
}

const IDB_NAME = 'academia_offline_resilience_db';
const IDB_STORE = 'mutation_queue';

/** Abre/cria o banco transacional da fila offline. */
export function openOfflineDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado'));
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        const store = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Enfileira uma mutação pendente (chamado quando offline ou com falha de rede). */
export async function queueOfflineMutation(payload: unknown): Promise<void> {
  try {
    const db = await openOfflineDatabase();
    const syncKey = dataSyncKey();
    const mutation: OfflineMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      syncKey,
      payload,
      type: 'user_state_upsert',
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    const tx = db.transaction([IDB_STORE], 'readwrite');
    tx.objectStore(IDB_STORE).add(mutation);
    await new Promise((res) => {
      tx.oncomplete = res;
    });

    try {
      localStorage.setItem(`offline_snapshot_${syncKey}`, JSON.stringify(payload));
    } catch {
      /* cota cheia — o backup é best-effort */
    }
  } catch (err) {
    console.warn('[offline-queue] Erro ao salvar mutação:', err);
  }
}

/** Descarrega a fila acumulada assim que a rede volta. Retorna nº sincronizado. */
export async function flushOfflineQueue(): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;
  const client = getSyncSupabaseClient();
  if (!client) return 0;

  try {
    const db = await openOfflineDatabase();
    const tx = db.transaction([IDB_STORE], 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const getAllReq = store.getAll();

    const mutations: OfflineMutation[] = await new Promise((res) => {
      getAllReq.onsuccess = () => res(getAllReq.result || []);
    });

    const pending = mutations
      .filter((m) => m.status === 'pending')
      .sort((a, b) => a.createdAt - b.createdAt);
    if (pending.length === 0) return 0;

    let syncedCount = 0;
    for (const item of pending) {
      try {
        const { error } = await client
          .from('user_sync')
          .upsert(
            {
              sync_key: item.syncKey,
              data: item.payload,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'sync_key' }
          );

        if (!error) {
          const delTx = db.transaction([IDB_STORE], 'readwrite');
          delTx.objectStore(IDB_STORE).delete(item.id);
          syncedCount++;
        }
      } catch (e) {
        console.warn('[offline-queue] Falha ao processar item:', e);
      }
    }
    return syncedCount;
  } catch {
    return 0;
  }
}

/** Quantas mutações aguardam conexão. */
export async function getOfflinePendingCount(): Promise<number> {
  try {
    const db = await openOfflineDatabase();
    return await new Promise((resolve) => {
      const tx = db.transaction([IDB_STORE], 'readonly');
      const req = tx.objectStore(IDB_STORE).count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

/* Auto-flush quando a conexão é restabelecida */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void flushOfflineQueue();
  });
}
