/**
 * offline-queue.ts — Fila de mutações offline (IndexedDB)
 *
 * Adaptação da Section 4 do STANDALONE_OFFLINE_SYNC_GUIDE.md
 * (IndexedDB Mutation Queue Pattern):
 *   • fila transacional persistida no IndexedDB (sobrevive a reloads);
 *   • store `offline_snapshots` com o último estado completo por sync key;
 *   • coalescência (state folding): várias alterações da mesma chave viram
 *     um único upsert com o payload mais recente;
 *   • retry com contador, `lastError` e `syncedAt` por mutação;
 *   • limpeza automática de mutações sincronizadas há mais de 48 h;
 *   • status reativo para o banner (`getQueueStatus`/`subscribeToMutationQueue`);
 *   • backup de emergência no localStorage se o IndexedDB falhar.
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
  description?: string;
  createdAt: number;
  status: 'pending' | 'processing' | 'synced' | 'failed';
  retryCount: number;
  lastError?: string;
  syncedAt?: number;
}

export interface QueueStatus {
  /** Mutações aguardando envio (pending + failed). */
  pendingCount: number;
  isProcessing: boolean;
  lastSyncAttempt?: number;
  lastSuccessfulSync?: number;
  isOnline: boolean;
}

interface OfflineSnapshot {
  key: string;
  data: unknown;
  updatedAt: string;
}

const IDB_NAME = 'academia_offline_resilience_db';
const IDB_VERSION = 2;
const IDB_STORE = 'mutation_queue';
const IDB_SNAPSHOTS = 'offline_snapshots';
const SNAPSHOT_PREFIX = 'latest_';
const LAST_ATTEMPT_KEY = 'academia_last_queue_attempt';
const LAST_SUCCESS_KEY = 'academia_last_queue_success';
const FALLBACK_KEY = 'academia_offline_pending_backup';
const CLEANUP_AGE_MS = 48 * 60 * 60 * 1000;

let dbInstance: IDBDatabase | null = null;
let isProcessingQueue = false;
let lastSyncAttempt: number | undefined;
let lastSuccessfulSync: number | undefined;

type QueueListener = (status: QueueStatus) => void;
const listeners = new Set<QueueListener>();

/* ── Abertura/atualização do banco ── */

/** Abre/cria o banco transacional da fila offline. */
export function openOfflineDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado'));
    }
    if (dbInstance) return resolve(dbInstance);

    const req = indexedDB.open(IDB_NAME, IDB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      /* 1. Tabela da fila de mutações */
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        const store = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('syncKey', 'syncKey', { unique: false });
      } else if (e.target) {
        /* Banco v1 já existente: adiciona o índice que faltava. */
        const store = (e.target as IDBOpenDBRequest).transaction?.objectStore(IDB_STORE);
        if (store && !store.indexNames.contains('syncKey')) {
          store.createIndex('syncKey', 'syncKey', { unique: false });
        }
      }

      /* 2. Tabela de snapshots completos (último estado por sync key) */
      if (!db.objectStoreNames.contains(IDB_SNAPSHOTS)) {
        db.createObjectStore(IDB_SNAPSHOTS, { keyPath: 'key' });
      }
    };

    req.onsuccess = () => {
      dbInstance = req.result;
      dbInstance.onclose = () => {
        dbInstance = null;
      };
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };
      resolve(dbInstance);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB bloqueado por outra aba'));
  });
}

/* ── Helpers ── */

function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
}

function readTimestamp(key: string): number | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = Number(localStorage.getItem(key) || '0');
    return Number.isFinite(raw) && raw > 0 ? raw : undefined;
  } catch {
    return undefined;
  }
}

function writeTimestamp(key: string, ts: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, String(ts));
  } catch {
    /* cota cheia — best-effort */
  }
}

function getAllMutations(db: IDBDatabase): Promise<OfflineMutation[]> {
  return new Promise((resolve) => {
    try {
      const req = db.transaction([IDB_STORE], 'readonly').objectStore(IDB_STORE).getAll();
      req.onsuccess = () => resolve((req.result || []) as OfflineMutation[]);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

function isUnsynced(mutation: OfflineMutation): boolean {
  return mutation.status === 'pending' || mutation.status === 'failed';
}

/* ── Status reativo (banner) ── */

/** Status consolidado da fila (contagem, processamento e conexão). */
export async function getQueueStatus(): Promise<QueueStatus> {
  const base: QueueStatus = {
    pendingCount: 0,
    isProcessing: isProcessingQueue,
    lastSyncAttempt: lastSyncAttempt ?? readTimestamp(LAST_ATTEMPT_KEY),
    lastSuccessfulSync: lastSuccessfulSync ?? readTimestamp(LAST_SUCCESS_KEY),
    isOnline: isOnline(),
  };

  try {
    const db = await openOfflineDatabase();
    const all = await getAllMutations(db);
    return { ...base, pendingCount: all.filter(isUnsynced).length };
  } catch {
    return base;
  }
}

async function notifyQueueListeners(): Promise<void> {
  if (listeners.size === 0) return;
  const status = await getQueueStatus();
  listeners.forEach((listener) => {
    try {
      listener(status);
    } catch {
      /* listener isolado */
    }
  });
}

function notifyQueueListenersSoon(): void {
  void notifyQueueListeners();
}

/**
 * Inscreve um listener nas mudanças da fila. O callback também é chamado
 * imediatamente com o status atual. Retorna a função de unsubscribe.
 */
export function subscribeToMutationQueue(listener: QueueListener): () => void {
  listeners.add(listener);
  void getQueueStatus().then((status) => {
    if (listeners.has(listener)) listener(status);
  });
  return () => {
    listeners.delete(listener);
  };
}

/* ── Enfileiramento ── */

/** Enfileira uma mutação com coalescência por `syncKey`. */
export async function enqueueMutation(options: {
  syncKey: string;
  payload: unknown;
  type?: string;
  description?: string;
  /** `false` evita reprocessar na hora (ex.: push que acabou de falhar). */
  immediate?: boolean;
}): Promise<string> {
  const now = Date.now();
  const mutationId = `mut_${now}_${Math.random().toString(36).substring(2, 9)}`;
  const mutation: OfflineMutation = {
    id: mutationId,
    syncKey: options.syncKey,
    payload: options.payload,
    type: options.type || 'full_state_sync',
    description: options.description || 'Atualização de dados da aplicação',
    createdAt: now,
    status: 'pending',
    retryCount: 0,
  };

  try {
    const db = await openOfflineDatabase();
    const all = await getAllMutations(db);
    const existing = all.find((m) => m.syncKey === options.syncKey && isUnsynced(m));

    /* Coalescência no enfileiramento: reutiliza a entrada pendente para a
       mesma sync key em vez de acumular dezenas de registros. */
    const record: OfflineMutation = existing
      ? {
          ...existing,
          payload: mutation.payload,
          type: mutation.type,
          description: mutation.description,
          createdAt: now,
          status: 'pending',
          retryCount: 0,
          lastError: undefined,
          syncedAt: undefined,
        }
      : mutation;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const tx = db.transaction([IDB_STORE, IDB_SNAPSHOTS], 'readwrite');
      tx.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      tx.onerror = () => {
        if (settled) return;
        settled = true;
        reject(tx.error);
      };
      tx.onabort = () => {
        if (settled) return;
        settled = true;
        reject(tx.error);
      };

      tx.objectStore(IDB_STORE).put(record);
      tx.objectStore(IDB_SNAPSHOTS).put({
        key: `${SNAPSHOT_PREFIX}${options.syncKey}`,
        data: mutation.payload,
        updatedAt: new Date(now).toISOString(),
      } satisfies OfflineSnapshot);
    });

    notifyQueueListenersSoon();

    /* Se estiver online, tenta enviar em segundo plano (evita loop quando
       o chamador acabou de receber erro de rede). */
    if (options.immediate !== false && isOnline()) {
      void processMutationQueue();
    }
    return record.id;
  } catch (err) {
    console.warn('[offline-queue] Erro ao enfileirar; salvando backup local:', err);
    try {
      localStorage.setItem(
        FALLBACK_KEY,
        JSON.stringify({ mutation, timestamp: Date.now() })
      );
    } catch {
      /* storage indisponível — sem backup */
    }
    notifyQueueListenersSoon();
    return mutationId;
  }
}

/** Enfileira o snapshot completo do app para a chave de dados ativa. */
export async function queueOfflineMutation(
  payload: unknown,
  options: { immediate?: boolean; description?: string } = {}
): Promise<void> {
  await enqueueMutation({
    syncKey: dataSyncKey(),
    payload,
    type: 'user_state_upsert',
    description: options.description,
    immediate: options.immediate,
  });
}

/* ── Processamento (coalescência + retry) ── */

async function saveToRemoteServer(syncKey: string, payload: unknown): Promise<boolean> {
  const client = getSyncSupabaseClient();
  if (!client) return false;
  const { error } = await client
    .from('user_sync')
    .upsert(
      {
        sync_key: syncKey,
        data: payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'sync_key' }
    );
  return !error;
}

/** Descarta mutações sincronizadas há mais de 48 h. */
async function cleanupOldMutations(db: IDBDatabase): Promise<void> {
  try {
    const cutoff = Date.now() - CLEANUP_AGE_MS;
    const all = await getAllMutations(db);
    const stale = all.filter(
      (m) => m.status === 'synced' && (m.syncedAt ?? m.createdAt) < cutoff
    );
    if (stale.length === 0) return;

    await new Promise<void>((resolve) => {
      const tx = db.transaction([IDB_STORE], 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      for (const mutation of stale) store.delete(mutation.id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    /* limpeza é best-effort */
  }
}

/**
 * Processa a fila com coalescência: agrupa por `syncKey`, envia apenas o
 * payload mais recente de cada grupo e marca todas as mutações do grupo.
 */
export async function processMutationQueue(
  customSaveFn?: (syncKey: string, payload: unknown) => Promise<boolean>
): Promise<{ processed: number; failed: number }> {
  if (isProcessingQueue) return { processed: 0, failed: 0 };
  if (!isOnline()) {
    notifyQueueListenersSoon();
    return { processed: 0, failed: 0 };
  }

  const saveFn = customSaveFn ?? saveToRemoteServer;
  let db: IDBDatabase;
  try {
    db = await openOfflineDatabase();
  } catch {
    return { processed: 0, failed: 0 };
  }

  const all = await getAllMutations(db);
  const pending = all
    .filter(isUnsynced)
    .sort((a, b) => a.createdAt - b.createdAt);
  if (pending.length === 0) {
    notifyQueueListenersSoon();
    return { processed: 0, failed: 0 };
  }

  isProcessingQueue = true;
  lastSyncAttempt = Date.now();
  writeTimestamp(LAST_ATTEMPT_KEY, lastSyncAttempt);
  notifyQueueListenersSoon();

  let processed = 0;
  let failed = 0;

  try {
    /* 1. Agrupa por chave de sincronização (coalescência). */
    const byKey = new Map<string, OfflineMutation[]>();
    for (const item of pending) {
      const list = byKey.get(item.syncKey) || [];
      list.push(item);
      byKey.set(item.syncKey, list);
    }

    /* 2. Envia somente a mutação mais recente de cada grupo. */
    for (const [key, group] of byKey.entries()) {
      const latest = group[group.length - 1];
      let success = false;
      let errorMessage = '';

      try {
        success = await saveFn(key, latest.payload);
        if (!success) {
          errorMessage = 'Falha de comunicação com servidor ou rede instável';
        }
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : String(err);
      }

      const tx = db.transaction([IDB_STORE], 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      for (const mutation of group) {
        if (success) {
          mutation.status = 'synced';
          mutation.syncedAt = Date.now();
          delete mutation.lastError;
          processed++;
        } else {
          mutation.status = 'failed';
          mutation.retryCount = (mutation.retryCount || 0) + 1;
          mutation.lastError = errorMessage || 'Falha ao sincronizar';
          failed++;
        }
        store.put(mutation);
      }
      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      });

      if (success) {
        lastSuccessfulSync = Date.now();
        writeTimestamp(LAST_SUCCESS_KEY, lastSuccessfulSync);
      }
    }

    /* 3. Limpeza de histórico sincronizado (> 48 h). */
    await cleanupOldMutations(db);
  } catch (err) {
    console.warn('[offline-queue] Falha ao processar fila:', err);
  } finally {
    isProcessingQueue = false;
    notifyQueueListenersSoon();
  }

  return { processed, failed };
}

/** Descarrega a fila acumulada assim que a rede volta. Retorna nº sincronizado. */
export async function flushOfflineQueue(): Promise<number> {
  const result = await processMutationQueue();
  return result.processed;
}

/** Quantas mutações aguardam conexão (pending + failed). */
export async function getOfflinePendingCount(): Promise<number> {
  try {
    const db = await openOfflineDatabase();
    const all = await getAllMutations(db);
    return all.filter(isUnsynced).length;
  } catch {
    return 0;
  }
}

/* Auto-flush quando a conexão é restabelecida */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void flushOfflineQueue();
    notifyQueueListenersSoon();
  });
  window.addEventListener('offline', () => {
    notifyQueueListenersSoon();
  });
}
