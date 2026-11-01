/**
 * push.ts — assinatura de Push no navegador (v4.67.0)
 *
 * O agendador local (`scheduler.ts`) cobre o app aberto. Para o aviso chegar
 * com o app FECHADO existe o push do servidor:
 *
 *   1. `enablePush()` assina o `PushManager` do Service Worker com a chave
 *      pública VAPID servida por `/api/push-dispatch?action=key`;
 *   2. a assinatura (endpoint + p256dh + auth) vai para `push_subscriptions`
 *      junto com o FUSO do aparelho, o horário do lembrete e o que o usuário
 *      quer receber (motivacional, lembrete, ligas);
 *   3. o endpoint `/api/push-dispatch?action=cron` decide o que está vencido e
 *      envia — sem o app aberto.
 *
 * Sem conta na nuvem não há como enviar (o servidor precisa saber de quem é a
 * assinatura): nesse caso o app segue com o agendador local e a UI informa.
 */

import { supabase, isSupabaseConfigured } from '@/core/supabase';
import { PREF_KEYS, readLS } from '@/features/profile/profile-data';
import { ensureNotificationPermission } from './notification-center';

export type PushState =
  | 'unsupported' // navegador sem Service Worker/PushManager
  | 'unconfigured' // servidor sem chaves VAPID
  | 'no-account' // sem sessão na nuvem
  | 'denied' // permissão negada pelo usuário
  | 'off' // tudo pronto, sem assinatura
  | 'on'; // assinatura ativa no servidor

export interface PushStatus {
  state: PushState;
  /** `true` quando a assinatura existe neste aparelho. */
  subscribed: boolean;
}

const VAPID_CACHE_KEY = 'academia_vapid_public_key_v1';
const ENDPOINT_KEY = 'academia_push_endpoint_v1';

export function pushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/* ── Chave pública VAPID ── */

let cachedKey: string | null | undefined;

export async function vapidPublicKey(force = false): Promise<string | null> {
  if (!force && cachedKey !== undefined) return cachedKey;

  try {
    const stored = localStorage.getItem(VAPID_CACHE_KEY);
    if (!force && stored) {
      cachedKey = stored;
      return stored;
    }
  } catch {
    /* storage indisponível */
  }

  try {
    const response = await fetch('/api/push-dispatch?action=key', { cache: 'no-store' });
    if (!response.ok) {
      cachedKey = null;
      return null;
    }
    const data = (await response.json()) as { configured?: boolean; key?: string | null };
    const key = data.configured && data.key ? data.key : null;
    cachedKey = key;
    try {
      if (key) localStorage.setItem(VAPID_CACHE_KEY, key);
      else localStorage.removeItem(VAPID_CACHE_KEY);
    } catch {
      /* storage indisponível */
    }
    return key;
  } catch {
    cachedKey = null;
    return null;
  }
}

/* ── Base64url → Uint8Array (applicationServerKey) ── */

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padded = `${value}${'='.repeat((4 - (value.length % 4)) % 4)}`;
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/* ── Service Worker ── */

async function swRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 5000)),
    ]);
  } catch {
    return null;
  }
}

export async function currentPushSubscription(): Promise<PushSubscription | null> {
  const registration = await swRegistration();
  if (!registration?.pushManager) return null;
  try {
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/* ── Preferências que o servidor precisa conhecer ── */

function pushPreferences() {
  return {
    /* Minutos a LESTE de UTC (Brasília = -180). */
    timezone_offset: -new Date().getTimezoneOffset(),
    reminder_time: (readLS(PREF_KEYS.workoutReminderTime) || '18:00').slice(0, 5),
    notify_motivation: readLS(PREF_KEYS.messages) !== 'false',
    notify_reminder: readLS(PREF_KEYS.workoutReminder) === 'true',
    notify_leagues: readLS(PREF_KEYS.notifyLeagues) === 'true',
  };
}

async function sessionUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user.id ?? null;
  } catch {
    return null;
  }
}

async function saveSubscription(subscription: PushSubscription, userId: string): Promise<boolean> {
  const json = subscription.toJSON();
  const keys = json.keys ?? {};
  if (!json.endpoint || !keys.p256dh || !keys.auth) return false;

  /* `supabase` tipado só com as tabelas declaradas → cast pontual. */
  const { error } = await (supabase as any).from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      ...pushPreferences(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  );

  if (error) return false;
  try {
    localStorage.setItem(ENDPOINT_KEY, json.endpoint);
  } catch {
    /* storage indisponível */
  }
  return true;
}

/* ── API pública ── */

export async function pushStatus(): Promise<PushStatus> {
  if (!pushSupported()) return { state: 'unsupported', subscribed: false };

  const subscription = await currentPushSubscription();
  const subscribed = Boolean(subscription);

  if (Notification.permission === 'denied') return { state: 'denied', subscribed };
  if (!(await vapidPublicKey())) return { state: 'unconfigured', subscribed };
  if (!(await sessionUserId())) return { state: 'no-account', subscribed };
  return { state: subscribed ? 'on' : 'off', subscribed };
}

export interface EnablePushResult {
  ok: boolean;
  status: PushStatus;
  message: string;
}

/**
 * Assina o push e registra no servidor. Devolve a mensagem pronta para o toast
 * (a UI não precisa traduzir os estados).
 */
export async function enablePush(): Promise<EnablePushResult> {
  const empty: PushStatus = { state: 'off', subscribed: false };

  if (!pushSupported()) {
    return {
      ok: false,
      status: { state: 'unsupported', subscribed: false },
      message: 'Este navegador não aceita notificações em segundo plano.',
    };
  }

  const granted = await ensureNotificationPermission();
  if (!granted) {
    return {
      ok: false,
      status: { state: 'denied', subscribed: false },
      message: 'Permissão negada — libere as notificações nas preferências do navegador.',
    };
  }

  const key = await vapidPublicKey();
  if (!key) {
    return {
      ok: false,
      status: { state: 'unconfigured', subscribed: false },
      message: 'Servidor de push sem chaves VAPID configuradas. Os avisos seguem só com o app aberto.',
    };
  }

  const userId = await sessionUserId();
  if (!userId) {
    return {
      ok: false,
      status: { state: 'no-account', subscribed: false },
      message: 'Entre na sua conta para receber avisos com o app fechado.',
    };
  }

  const registration = await swRegistration();
  if (!registration?.pushManager) {
    return {
      ok: false,
      status: { state: 'unsupported', subscribed: false },
      message: 'O Service Worker ainda não está pronto. Recarregue a página e tente de novo.',
    };
  }

  try {
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      }));

    const saved = await saveSubscription(subscription, userId);
    if (!saved) {
      return {
        ok: false,
        status: { state: 'off', subscribed: true },
        message: 'Assinatura criada, mas não foi possível salvar na nuvem. Tente novamente.',
      };
    }

    return {
      ok: true,
      status: { state: 'on', subscribed: true },
      message: 'Push ativado! Os avisos chegam mesmo com o app fechado.',
    };
  } catch (err) {
    return {
      ok: false,
      status: empty,
      message:
        err instanceof Error
          ? `Falha ao ativar o push: ${err.message}`
          : 'Falha ao ativar o push neste aparelho.',
    };
  }
}

/** Cancela a assinatura neste aparelho e apaga a linha no servidor. */
export async function disablePush(): Promise<void> {
  const subscription = await currentPushSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  try {
    await subscription.unsubscribe();
  } catch {
    /* segue para a remoção no servidor */
  }

  if (isSupabaseConfigured) {
    try {
      await (supabase as any).from('push_subscriptions').delete().eq('endpoint', endpoint);
    } catch {
      /* offline: o endpoint passa a falhar e o servidor remove na próxima */
    }
  }

  try {
    localStorage.removeItem(ENDPOINT_KEY);
  } catch {
    /* storage indisponível */
  }
}

let syncing = false;

/**
 * Reenvia as preferências (horário do lembrete, fuso, o que receber) para o
 * servidor quando algo muda no app. Silencioso: chamado por eventos.
 */
export async function syncPushPreferences(): Promise<void> {
  if (syncing || !pushSupported() || !isSupabaseConfigured) return;
  const subscription = await currentPushSubscription();
  if (!subscription) return;

  const userId = await sessionUserId();
  if (!userId) return;

  syncing = true;
  try {
    await saveSubscription(subscription, userId);
  } finally {
    syncing = false;
  }
}

/**
 * Liga a sincronização automática: mudanças de preferência, volta da conexão,
 * aba visível e pedido de reassinatura vindo do Service Worker.
 * Devolve a função de limpeza.
 */
export function startPushSync(): () => void {
  if (typeof window === 'undefined') return () => {};

  const onPrefs = () => void syncPushPreferences();
  const onVisible = () => {
    if (document.visibilityState === 'visible') void syncPushPreferences();
  };
  const onMessage = (event: MessageEvent) => {
    if (event.data?.type === 'academia:push-resubscribe') {
      void syncPushPreferences();
    }
    if (event.data?.type === 'academia:notification-click') {
      window.dispatchEvent(
        new CustomEvent('academia:notification-click', { detail: event.data.url ?? '/' }),
      );
    }
  };

  window.addEventListener('academia:prefs-changed', onPrefs);
  window.addEventListener('online', onPrefs);
  document.addEventListener('visibilitychange', onVisible);
  navigator.serviceWorker?.addEventListener('message', onMessage);

  /* Valida a assinatura no boot (pode ter sido trocada pelo navegador). */
  const boot = window.setTimeout(() => void syncPushPreferences(), 6000);

  return () => {
    window.clearTimeout(boot);
    window.removeEventListener('academia:prefs-changed', onPrefs);
    window.removeEventListener('online', onPrefs);
    document.removeEventListener('visibilitychange', onVisible);
    navigator.serviceWorker?.removeEventListener('message', onMessage);
  };
}
