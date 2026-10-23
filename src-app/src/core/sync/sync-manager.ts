/**
 * sync-manager.ts — Motor de sincronização multi-dispositivo (v4.9.0-sync)
 *
 * Adapta as Sections 2–4 do SupabaseSyncSecurityStandalone.tsx ao banco local
 * do Academia (Dexie 'academia-v4'):
 *   • snapshot JSONB dos dados essenciais (exercícios, fichas, histórico,
 *     maestria, perfil e cópia legada) na tabela user_sync;
 *   • sync ultra-rápido entre abas locais via BroadcastChannel (<5 ms);
 *   • realtime multi-dispositivos via canal WebSocket do Supabase;
 *   • fila offline (IndexedDB) com auto-flush ao voltar a conexão;
 *   • registry de dispositivos com heartbeat, rename e revogação remota;
 *   • last-write-wins por updated_at (ISO) ao puxar snapshots remotos.
 */

import { create } from 'zustand';
import { type RealtimeChannel } from '@supabase/supabase-js';
import { idb, emitDbReady } from '@/core/db/idb';
import { LOCAL_USER_ID } from '@/core/db/schema';
import type {
  Exercise,
  WorkoutSheet,
  WorkoutHistory,
  ExerciseMastery,
  ProfileState,
} from '@/core/db/schema';
import {
  getSyncSupabaseClient,
  getSyncKey,
  dataSyncKey,
  devicesSyncKey,
  isSyncConfigured,
  isSyncRevoked,
  setSyncRevoked,
  setLastSyncedAt,
  lastSyncedAt,
} from './supabase-client';
import {
  getPersistentDeviceId,
  buildCurrentDeviceRecord,
  toConnectedDevice,
  type ConnectedDevice,
  type DeviceRecord,
} from './device';
import { queueOfflineMutation, flushOfflineQueue, getOfflinePendingCount } from './offline-queue';
import { safeStringify } from '@/lib/canonical';
import { applySavedTheme } from '@/features/settings/theme-colors';

/* ── Snapshot sincronizado (payload JSONB de user_sync.data) ── */

export interface AppSnapshot {
  v: 1;
  exercises: Exercise[];
  sheets: WorkoutSheet[];
  history: WorkoutHistory[];
  mastery: ExerciseMastery[];
  profileState?: ProfileState;
  legacy?: Record<string, unknown>;
  /** Biblioteca de músicas (playlists/metadados), sem blobs de áudio. */
  musicLibrary?: unknown;
  /** Amigos adicionados (lista local-first), sincronizada com a nuvem. */
  friends?: unknown;
  /** Preferências de UI sincronizadas (tema, player, sidebar, lock, navbar, etc.). */
  prefs?: Record<string, string>;
  updatedAt: string;
  originDeviceId: string;
}

interface DevicesPayload {
  devices: DeviceRecord[];
}

/* ── Verificação automática de novidades (egress baixo) ──
   Consulta apenas updated_at; o snapshot completo só é baixado se mudou.
   O Realtime continua sendo o caminho rápido; isto é o fallback para
   app em background, broadcast perdido ou reconexão. */
const REMOTE_CHECK_PERIOD_MS = 60_000;
const REMOTE_CHECK_MIN_INTERVAL_MS = 10_000;

/* ── BroadcastChannel entre abas do mesmo navegador ── */

const CROSS_TAB_CHANNEL = 'academia_multi_device_sync_channel';
let crossTabChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    crossTabChannel = new BroadcastChannel(CROSS_TAB_CHANNEL);
  }
} catch {
  crossTabChannel = null;
}

/* ── Store da UI de dispositivos (gerenciador nas Configurações) ── */

interface DevicesUiState {
  devices: ConnectedDevice[];
  loading: boolean;
  setDevices: (d: ConnectedDevice[]) => void;
  setLoading: (v: boolean) => void;
}

export const useDevicesStore = create<DevicesUiState>((set) => ({
  devices: [],
  loading: false,
  setDevices: (devices) => set({ devices }),
  setLoading: (loading) => set({ loading }),
}));

/* ── Estado do motor ── */

let engineRunning = false;
let realtimeChannel: RealtimeChannel | null = null;
let heartbeatTimer: number | null = null;
let remoteCheckTimer: number | null = null;
let lastRemoteCheckAt = 0;
let remoteCheckInFlight = false;
let applyingRemote = false;
let pushDebounce: number | null = null;
/* Último snapshot efetivamente salvo (JSON canônico) — evita pushs redundantes
   e loops de sincronização (dados.md §4.4). */
let lastSavedSnapshotJson = '';

function emitStatus(): void {
  document.dispatchEvent(new CustomEvent('academia:sync-status-changed'));
}

function emitRemoteUpdate(deviceName: string): void {
  document.dispatchEvent(
    new CustomEvent('academia:sync-remote-update', { detail: { deviceName } })
  );
}

function emitDevicesUpdated(): void {
  document.dispatchEvent(new CustomEvent('academia:devices-updated'));
}

/* ── Construção e aplicação de snapshots ── */

export async function buildSnapshot(): Promise<AppSnapshot> {
  const [exercises, sheets, history, mastery, profileState, legacyRow] =
    await Promise.all([
      idb.exercises.toArray(),
      idb.workoutSheets.where('userId').equals(LOCAL_USER_ID).toArray(),
      idb.workoutHistory.where('userId').equals(LOCAL_USER_ID).toArray(),
      idb.exerciseMastery.where('userId').equals(LOCAL_USER_ID).toArray(),
      idb.profileState.get('local'),
      idb.legacyState.get('academia_treino'),
    ]);

  let musicLibrary: unknown;
  let friends: unknown;
  try {
    const rawMusic = localStorage.getItem('academia_music_library_v1');
    if (rawMusic) musicLibrary = JSON.parse(rawMusic);
  } catch {
    musicLibrary = undefined;
  }
  try {
    const rawFriends = localStorage.getItem('academia_added_friends_v1');
    if (rawFriends) friends = JSON.parse(rawFriends);
  } catch {
    friends = undefined;
  }

  /* Preferências de UI (tema, player, sidebar, lock, navbar, auto-fullscreen). */
  const PREF_KEYS_TO_SYNC = [
    'academia_theme',
    'academia_theme_custom_hex',
    'academia_view_mode',
    'academia_calendar_view',
    'timerStyle',
    'academia_pref_sidebar_pinned',
    'academia_pref_player_mode',
    'academia_pref_player_pos',
    'academia_pref_player_persist',
    'academia_pref_player_secs',
    'academia_pref_music_enabled',
    'academia_pref_music_volume',
    'academia_pref_navbar_mode',
    'academia_pref_navbar_shape',
    'academia_pref_auto_fullscreen',
    'academia_pref_sounds',
    'academia_pref_vibration',
    'academia_pref_messages',
    'academia_pref_online',
    'academia_pref_app_lock_enabled',
    'academia_pref_app_lock_biometric',
  ];
  const prefs: Record<string, string> = {};
  for (const k of PREF_KEYS_TO_SYNC) {
    const v = localStorage.getItem(k);
    if (v !== null) prefs[k] = v;
  }

  return {
    v: 1,
    exercises,
    sheets,
    history,
    mastery,
    profileState,
    legacy: (legacyRow?.value as Record<string, unknown>) ?? undefined,
    musicLibrary,
    friends,
    prefs,
    updatedAt: new Date().toISOString(),
    originDeviceId: getPersistentDeviceId(),
  };
}

async function applySnapshot(snapshot: AppSnapshot, remoteUpdatedAt?: string): Promise<void> {
  applyingRemote = true;
  try {
    await idb.transaction(
      'rw',
      [idb.exercises, idb.workoutSheets, idb.workoutHistory, idb.exerciseMastery, idb.profileState, idb.legacyState],
      async () => {
        if (snapshot.exercises?.length) {
          await idb.exercises.bulkPut(snapshot.exercises);
        }
        await idb.workoutSheets.where('userId').equals(LOCAL_USER_ID).delete();
        if (snapshot.sheets?.length) await idb.workoutSheets.bulkPut(snapshot.sheets);

        await idb.workoutHistory.where('userId').equals(LOCAL_USER_ID).delete();
        if (snapshot.history?.length) await idb.workoutHistory.bulkPut(snapshot.history);

        await idb.exerciseMastery.where('userId').equals(LOCAL_USER_ID).delete();
        if (snapshot.mastery?.length) await idb.exerciseMastery.bulkPut(snapshot.mastery);

        if (snapshot.profileState) {
          await idb.profileState.put({ ...snapshot.profileState, key: 'local' });
        }
        if (snapshot.legacy) {
          await idb.legacyState.put({
            key: 'academia_treino',
            value: snapshot.legacy,
            updatedAt: snapshot.updatedAt,
          });
          /* Mantém o localStorage legado alinhado (splash/banner no próximo boot) */
          try {
            localStorage.setItem('academia_treino', JSON.stringify(snapshot.legacy));
          } catch {
            /* best-effort */
          }
        }
      }
    );

    /* Sincroniza biblioteca de músicas (metadados/playlists), sem blobs de áudio. */
    if (snapshot.musicLibrary && typeof snapshot.musicLibrary === 'object') {
      try {
        localStorage.setItem('academia_music_library_v1', JSON.stringify(snapshot.musicLibrary));
      } catch {
        /* best-effort */
      }
    }
    /* Sincroniza lista de amigos (local-first). */
    if (Array.isArray(snapshot.friends)) {
      try {
        localStorage.setItem('academia_added_friends_v1', JSON.stringify(snapshot.friends));
        document.dispatchEvent(new CustomEvent('academia:friends-updated'));
      } catch {
        /* best-effort */
      }
    }
    /* Sincroniza preferências de UI (tema, player, sidebar, lock, navbar, ...). */
    if (snapshot.prefs && typeof snapshot.prefs === 'object') {
      try {
        for (const [k, v] of Object.entries(snapshot.prefs)) {
          if (typeof v === 'string') localStorage.setItem(k, v);
        }
        applySavedTheme();
        document.dispatchEvent(new CustomEvent('academia:prefs-changed'));
        document.dispatchEvent(new CustomEvent('academia:player-prefs-changed'));
        document.dispatchEvent(new CustomEvent('academia:lock-prefs-changed'));
      } catch {
        /* best-effort */
      }
    }

    /* Se a entrada de hoje não existir no snapshot, o today-entry-store
       recarrega sozinho no db-ready; se existir, o merge é automático. */
    setLastSyncedAt(Date.parse(remoteUpdatedAt || snapshot.updatedAt));
    /* Marca o snapshot recebido como "último salvo" para não re-enviar idêntico
       (evita loop ping-pong — dados.md §4.4). */
    try {
      lastSavedSnapshotJson = safeStringify(snapshot);
    } catch {
      /* best-effort */
    }
    emitDbReady();
    document.dispatchEvent(new CustomEvent('academia:profile-updated'));
  } finally {
    applyingRemote = false;
  }
}

/* ── Push ── */

export async function pushSnapshot(): Promise<boolean> {
  if (!isSyncConfigured() || isSyncRevoked()) return false;
  const client = getSyncSupabaseClient();
  if (!client) return false;

  const snapshot = await buildSnapshot();
  const updatedAt = snapshot.updatedAt;

  /* Comparação canônica profunda: se nada mudou em relação ao último salvo,
     cancela o push (evita tráfego redundante e loops — dados.md §4.4). */
  const canonicalJson = safeStringify(snapshot);
  if (lastSavedSnapshotJson && canonicalJson === lastSavedSnapshotJson) {
    /* Nada a fazer — estado idêntico ao último push. */
    return true;
  }

  /* Transmite para outras abas locais (<5 ms) com o dado completo */
  if (crossTabChannel) {
    try {
      crossTabChannel.postMessage({
        type: 'CROSS_TAB_SYNC',
        syncKey: dataSyncKey(),
        data: snapshot,
        updatedAt,
        originDeviceId: getPersistentDeviceId(),
      });
    } catch {
      /* Canal fechado */
    }
  }

  const { error } = await client
    .from('user_sync')
    .upsert(
      { sync_key: dataSyncKey(), data: snapshot, updated_at: updatedAt },
      { onConflict: 'sync_key' }
    );

  if (error) {
    console.warn('[sync] Push falhou, enfileirando offline:', error.message);
    await queueOfflineMutation(snapshot);
    return false;
  }

  lastSavedSnapshotJson = canonicalJson;
  setLastSyncedAt(Date.parse(updatedAt));
  broadcastToRemoteDevices(dataSyncKey(), updatedAt);
  emitStatus();
  return true;
}

/** Push com debounce (disparado pelos eventos de mudança do banco local). */
export function schedulePush(delayMs = 1500): void {
  if (!engineRunning || applyingRemote || !isSyncConfigured() || isSyncRevoked()) return;
  if (pushDebounce) window.clearTimeout(pushDebounce);
  pushDebounce = window.setTimeout(() => {
    pushDebounce = null;
    void pushSnapshot().catch((e) => console.warn('[sync] push:', e));
  }, delayMs);
}

/* ── Pull (last-write-wins por updated_at) ── */

export async function pullSnapshot(force = false): Promise<boolean> {
  if (!isSyncConfigured() || isSyncRevoked()) return false;
  const client = getSyncSupabaseClient();
  if (!client) return false;

  const { data, error } = await client
    .from('user_sync')
    .select('data, updated_at')
    .eq('sync_key', dataSyncKey())
    .maybeSingle();

  if (error || !data?.data) return false;

  const remoteAt = Date.parse(data.updated_at || (data.data as AppSnapshot).updatedAt || '');
  if (!force && Number.isFinite(remoteAt) && remoteAt <= lastSyncedAt()) return false;

  await applySnapshot(data.data as AppSnapshot, data.updated_at);
  return true;
}

/**
 * Verificação barata de atualização remota.
 *
 * Faz apenas `select updated_at` (uma linha pequena). O snapshot completo
 * só é baixado quando o updated_at remoto é mais novo que o último sync.
 * É usada no fallback periódico e ao voltar o foco/visibilidade/online.
 */
export async function checkRemoteUpdate(
  minIntervalMs = REMOTE_CHECK_MIN_INTERVAL_MS
): Promise<boolean> {
  if (!isSyncConfigured() || isSyncRevoked() || applyingRemote) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;

  const now = Date.now();
  if (now - lastRemoteCheckAt < minIntervalMs) return false;
  if (remoteCheckInFlight) return false;

  remoteCheckInFlight = true;
  lastRemoteCheckAt = now;
  try {
    const client = getSyncSupabaseClient();
    if (!client) return false;

    const { data, error } = await client
      .from('user_sync')
      .select('updated_at')
      .eq('sync_key', dataSyncKey())
      .maybeSingle();

    if (error || !data?.updated_at) return false;
    const remoteAt = Date.parse(data.updated_at);
    if (!Number.isFinite(remoteAt) || remoteAt <= lastSyncedAt()) return false;

    /* Só aqui baixamos o snapshot inteiro. */
    return await pullSnapshot();
  } catch (e) {
    console.warn('[sync] check remoto:', e);
    return false;
  } finally {
    remoteCheckInFlight = false;
  }
}

/* ── Broadcast em tempo real (Supabase Realtime) ── */

export function broadcastToLocalTabs(syncKey: string, data: unknown, updatedAt: string): void {
  if (!crossTabChannel || !syncKey) return;
  crossTabChannel.postMessage({
    type: 'CROSS_TAB_SYNC',
    syncKey: syncKey.toUpperCase(),
    data,
    updatedAt,
    originDeviceId: getPersistentDeviceId(),
  });
}

export function broadcastToRemoteDevices(syncKey: string, updatedAt: string): void {
  const client = getSyncSupabaseClient();
  if (!client || !syncKey) return;
  try {
    const channel = client.channel(`sync_room_${syncKey.toUpperCase()}`, {
      config: { broadcast: { ack: false, self: false } },
    });
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'REMOTE_STATE_UPDATED',
          payload: {
            syncKey: syncKey.toUpperCase(),
            updatedAt,
            originDeviceId: getPersistentDeviceId(),
            timestamp: Date.now(),
          },
        });
        /* Encerra o canal efêmero após o envio */
        window.setTimeout(() => {
          void client.removeChannel(channel);
        }, 2000);
      }
    });
  } catch (err) {
    console.warn('[sync] Erro ao disparar broadcast remoto:', err);
  }
}

/* ── Registry de dispositivos ── */

function deviceNameOf(record: DeviceRecord): string {
  return record.customName || record.name;
}

async function readDeviceRecords(): Promise<DeviceRecord[]> {
  const client = getSyncSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from('user_sync')
    .select('data, updated_at')
    .eq('sync_key', devicesSyncKey())
    .maybeSingle();
  if (error || !data?.data) return [];
  const payload = data.data as DevicesPayload;
  return Array.isArray(payload?.devices) ? payload.devices : [];
}

async function writeDeviceRecords(records: DeviceRecord[]): Promise<void> {
  const client = getSyncSupabaseClient();
  if (!client) return;
  await client
    .from('user_sync')
    .upsert(
      {
        sync_key: devicesSyncKey(),
        data: { devices: records } satisfies DevicesPayload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'sync_key' }
    );
}

/** Heartbeat: registra/atualiza este dispositivo no registry remoto. */
export async function heartbeatDevices(): Promise<void> {
  if (!isSyncConfigured() || isSyncRevoked()) return;
  try {
    const current = buildCurrentDeviceRecord();
    const records = await readDeviceRecords();
    const others = records.filter((r) => r.id !== current.id);
    /* Remove órfãos inativos há mais de 30 dias */
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const alive = others.filter((r) => (r.lastActive || 0) > cutoff);
    await writeDeviceRecords([...alive, current]);
    refreshDevicesUi(alive, current);
  } catch (e) {
    console.warn('[sync] heartbeat:', e);
  }
}

function refreshDevicesUi(others: DeviceRecord[], current: DeviceRecord): void {
  const list = [...others.map(toConnectedDevice), toConnectedDevice(current)].sort(
    (a, b) => Number(b.isCurrent) - Number(a.isCurrent) || (b.lastActiveTimestamp || 0) - (a.lastActiveTimestamp || 0)
  );
  const store = useDevicesStore.getState();
  /* Só notifica quando a lista muda de verdade (evita loop de listeners) */
  if (JSON.stringify(store.devices) === JSON.stringify(list)) return;
  store.setDevices(list);
  emitDevicesUpdated();
}

/** Recarrega a lista de dispositivos (pull do registry). */
export async function loadDevices(): Promise<void> {
  useDevicesStore.getState().setLoading(true);
  try {
    if (!isSyncConfigured() || isSyncRevoked()) {
      /* Sem nuvem: mostra só o dispositivo atual (paridade com o placeholder) */
      refreshDevicesUi([], buildCurrentDeviceRecord());
      return;
    }
    const records = await readDeviceRecords();
    const current = buildCurrentDeviceRecord();
    const others = records.filter((r) => r.id !== current.id);
    /* Garante que este dispositivo sempre apareça */
    await writeDeviceRecords([...others, current]);
    refreshDevicesUi(others, current);
  } catch (e) {
    console.warn('[sync] loadDevices:', e);
    refreshDevicesUi([], buildCurrentDeviceRecord());
  } finally {
    useDevicesStore.getState().setLoading(false);
  }
}

/** Renomeia um dispositivo (apelido personalizado). */
export async function renameDevice(id: string, customName: string): Promise<void> {
  const records = await readDeviceRecords();
  const next = records.map((r) =>
    r.id === id ? { ...r, customName: customName.trim() || undefined } : r
  );
  await writeDeviceRecords(next);
  const current = buildCurrentDeviceRecord(
    next.find((r) => r.id === getPersistentDeviceId())?.customName
  );
  refreshDevicesUi(next.filter((r) => r.id !== current.id), current);
}

/** Desconecta um dispositivo remoto (revogação) — broadcast de kick. */
export async function disconnectDevice(id: string): Promise<void> {
  const records = await readDeviceRecords();
  const next = records.filter((r) => r.id !== id);
  await writeDeviceRecords(next);

  const current = buildCurrentDeviceRecord();
  refreshDevicesUi(next.filter((r) => r.id !== current.id), current);

  /* Avisa o dispositivo revogado (realtime + abas locais) */
  const client = getSyncSupabaseClient();
  if (client) {
    try {
      const channel = client.channel(`sync_room_${getSyncKey().toUpperCase()}`, {
        config: { broadcast: { ack: false, self: false } },
      });
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'DEVICE_KICKED',
            payload: { deviceId: id, originDeviceId: getPersistentDeviceId() },
          });
          window.setTimeout(() => {
            void client.removeChannel(channel);
          }, 2000);
        }
      });
    } catch {
      /* best-effort */
    }
  }
  if (crossTabChannel) {
    crossTabChannel.postMessage({ type: 'DEVICE_KICKED', deviceId: id });
  }
  if (id === getPersistentDeviceId()) handleRevoked();
}

function handleRevoked(): void {
  setSyncRevoked(true);
  stopSyncEngine();
  emitStatus();
  document.dispatchEvent(
    new CustomEvent('academia:sync-revoked', {
      detail: { deviceName: deviceNameOf(buildCurrentDeviceRecord()) },
    })
  );
}

/* ── Entrada de mensagens (abas locais + realtime) ── */

function onCrossTabMessage(ev: MessageEvent): void {
  const msg = ev.data as {
    type?: string;
    syncKey?: string;
    data?: AppSnapshot;
    updatedAt?: string;
    deviceId?: string;
    originDeviceId?: string;
  };
  if (!msg) return;

  if (msg.type === 'DEVICE_KICKED') {
    if (msg.deviceId === getPersistentDeviceId()) handleRevoked();
    return;
  }
  if (msg.type !== 'CROSS_TAB_SYNC' || msg.syncKey !== dataSyncKey()) return;
  if (msg.originDeviceId === getPersistentDeviceId()) return;
  if (!msg.data || applyingRemote) return;

  const remoteAt = Date.parse(msg.updatedAt || msg.data.updatedAt || '');
  if (Number.isFinite(remoteAt) && remoteAt <= lastSyncedAt()) return;

  void applySnapshot(msg.data, msg.updatedAt).then(() => {
    emitRemoteUpdate('outra aba');
  });
}

function onRemoteBroadcast(payload: {
  originDeviceId?: string;
  updatedAt?: string;
}): void {
  if (payload.originDeviceId === getPersistentDeviceId()) return;
  if (applyingRemote) return;

  /* Broadcast repetido/atrasado não justifica baixar o snapshot inteiro. */
  const broadcastAt = Date.parse(payload.updatedAt || '');
  if (Number.isFinite(broadcastAt) && broadcastAt <= lastSyncedAt()) return;

  const origin = useDevicesStore
    .getState()
    .devices.find((d) => d.id === payload.originDeviceId);
  const name = origin ? origin.customName || origin.name : 'outro dispositivo';

  void pullSnapshot().then((applied) => {
    if (applied) emitRemoteUpdate(name);
  });
}

/* ── Start / Stop do motor ── */

export function startSyncEngine(): void {
  if (engineRunning) return;
  engineRunning = true;

  if (crossTabChannel) {
    crossTabChannel.onmessage = onCrossTabMessage;
  }

  const client = getSyncSupabaseClient();
  if (client && isSyncConfigured() && !isSyncRevoked()) {
    try {
      const channel = client.channel(`sync_room_${getSyncKey().toUpperCase()}`, {
        config: { broadcast: { ack: false, self: false } },
      });
      channel.on('broadcast', { event: 'REMOTE_STATE_UPDATED' }, ({ payload }) =>
        onRemoteBroadcast(payload as { originDeviceId?: string; updatedAt?: string })
      );
      channel.on('broadcast', { event: 'DEVICE_KICKED' }, ({ payload }) => {
        if ((payload as { deviceId?: string }).deviceId === getPersistentDeviceId()) {
          handleRevoked();
        }
      });
      channel.subscribe();
      realtimeChannel = channel;
    } catch (e) {
      console.warn('[sync] realtime subscribe:', e);
    }
  }

  /* Heartbeat de presença a cada 5 min (egress baixo). O painel de
     dispositivos atualiza na hora ao abrir; o sync de dados não depende disto. */
  heartbeatTimer = window.setInterval(() => {
    void heartbeatDevices();
  }, 5 * 60_000);

  /* Auto-push das mudanças locais (debounce) */
  document.addEventListener('academia:db-ready', onLocalDataChanged);
  document.addEventListener('academia:music-changed', onLocalDataChanged);
  document.addEventListener('academia:friends-changed', onLocalDataChanged);
  document.addEventListener('academia:player-prefs-changed', onLocalDataChanged);
  document.addEventListener('academia:lock-prefs-changed', onLocalDataChanged);
  document.addEventListener('academia:navbar-mode-changed', onLocalDataChanged);
  document.addEventListener('academia:navbar-shape-changed', onLocalDataChanged);
  document.addEventListener('academia:auto-fullscreen-changed', onLocalDataChanged);
  document.addEventListener('academia:prefs-changed', onLocalDataChanged);

  /* Flush da fila offline ao voltar a conexão */
  window.addEventListener('online', onOnline);

  /* Fallback automático: checagem barata de updated_at a cada 60 s,
     só com a aba visível. O Realtime continua sendo o caminho instantâneo. */
  remoteCheckTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') void checkRemoteUpdate(0);
  }, REMOTE_CHECK_PERIOD_MS);

  /* Ao voltar para o app/foco, busca novidades imediatamente. */
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('focus', onWindowFocus);

  /* Pull inicial + registro no registry.
     Usa a checagem barata: se o dispositivo já está em dia, não baixa o
     snapshot inteiro; só a linha de updated_at. */
  void (async () => {
    await flushOfflineQueue();
    await checkRemoteUpdate(0);
    await heartbeatDevices();
    emitStatus();
  })();
}

export function stopSyncEngine(): void {
  engineRunning = false;
  if (heartbeatTimer) {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (remoteCheckTimer) {
    window.clearInterval(remoteCheckTimer);
    remoteCheckTimer = null;
  }
  if (pushDebounce) {
    window.clearTimeout(pushDebounce);
    pushDebounce = null;
  }
  document.removeEventListener('academia:db-ready', onLocalDataChanged);
  document.removeEventListener('academia:music-changed', onLocalDataChanged);
  document.removeEventListener('academia:friends-changed', onLocalDataChanged);
  document.removeEventListener('academia:player-prefs-changed', onLocalDataChanged);
  document.removeEventListener('academia:lock-prefs-changed', onLocalDataChanged);
  document.removeEventListener('academia:navbar-mode-changed', onLocalDataChanged);
  document.removeEventListener('academia:navbar-shape-changed', onLocalDataChanged);
  document.removeEventListener('academia:auto-fullscreen-changed', onLocalDataChanged);
  document.removeEventListener('academia:prefs-changed', onLocalDataChanged);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('focus', onWindowFocus);
  window.removeEventListener('online', onOnline);
  if (realtimeChannel) {
    void realtimeChannel.unsubscribe().catch(() => undefined);
    realtimeChannel = null;
  }
  if (crossTabChannel) crossTabChannel.onmessage = null;
  emitStatus();
}

function onLocalDataChanged(): void {
  schedulePush();
}

function onVisibilityChange(): void {
  if (document.visibilityState !== 'visible') return;
  void checkRemoteUpdate(5_000);
  void heartbeatDevices();
}

function onWindowFocus(): void {
  void checkRemoteUpdate(5_000);
}

function onOnline(): void {
  void flushOfflineQueue().then((n) => {
    if (n > 0) schedulePush(500);
    void checkRemoteUpdate(0);
  });
}

export function isEngineRunning(): boolean {
  return engineRunning;
}

/** Chamado após trocar a chave de sync nas Configurações. */
export function restartSyncEngine(): void {
  stopSyncEngine();
  if (!isSyncRevoked()) startSyncEngine();
}

/** Sincronização forçada manual (botão "Sincronizar Agora"). */
export async function syncNow(): Promise<{ ok: boolean; pending: number }> {
  const flushed = await flushOfflineQueue();
  const ok = await pushSnapshot();
  const pending = await getOfflinePendingCount();
  return { ok: ok || flushed > 0, pending };
}

/** Desbloqueia um dispositivo revogado (reconexão manual). */
export function reconnectAfterRevocation(): void {
  setSyncRevoked(false);
  restartSyncEngine();
  void heartbeatDevices();
}

export async function getPendingOfflineCount(): Promise<number> {
  return getOfflinePendingCount();
}
