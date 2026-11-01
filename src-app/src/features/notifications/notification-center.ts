/**
 * notification-center.ts — permissão, envio e deduplicação (v4.65.0)
 *
 * Camada única usada pelo agendador (`scheduler.ts`) e pelas Configurações:
 *   • pede/consulta permissão;
 *   • mostra a notificação pelo Service Worker quando existe (obrigatório no
 *     Chrome Android, onde `new Notification()` na página lança erro) e cai
 *     para a API da página no desktop;
 *   • guarda um log local (`academia_notification_log_v1`) por chave, para não
 *     repetir o mesmo aviso (ex.: lembrete de hoje, fim da liga desta semana).
 *
 * LIMITAÇÃO: sem um servidor de push, nada é entregue com o app totalmente
 * fechado. O agendador roda com o app aberto (ou na aba em segundo plano) e
 * recupera avisos perdidos ao voltar para a aba.
 */

export const NOTIFICATION_LOG_KEY = 'academia_notification_log_v1';
/** Um aviso por chave dentro de 7 dias, no máximo. */
const DEFAULT_GAP_MS = 7 * 24 * 60 * 60 * 1000;
const LOG_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const LOG_MAX_ENTRIES = 200;

export type NotificationSupport = 'unsupported' | 'default' | 'granted' | 'denied';

type LogMap = Record<string, number>;

function readLog(): LogMap {
  try {
    const raw = localStorage.getItem(NOTIFICATION_LOG_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LogMap;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeLog(log: LogMap): void {
  try {
    localStorage.setItem(NOTIFICATION_LOG_KEY, JSON.stringify(log));
  } catch {
    /* storage cheio/privado: segue sem dedupe persistido */
  }
}

export function notificationSupport(): NotificationSupport {
  if (typeof window === 'undefined') return 'unsupported';
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission as NotificationSupport;
}

export function notificationsGranted(): boolean {
  return notificationSupport() === 'granted';
}

/** Pede permissão (só quando ainda não decidida). Devolve `true` se concedida. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch {
    return false;
  }
}

/** `true` quando já enviamos essa chave dentro da janela informada. */
export function wasNotificationSent(key: string, withinMs: number = DEFAULT_GAP_MS): boolean {
  const at = readLog()[key];
  if (!at) return false;
  return Date.now() - at < withinMs;
}

/** Registra o envio (e poda o log antigo). */
export function markNotificationSent(key: string, at: number = Date.now()): void {
  const log = readLog();
  log[key] = at;

  const cutoff = Date.now() - LOG_TTL_MS;
  const entries = Object.entries(log).filter(([, value]) => value >= cutoff);
  entries.sort((a, b) => b[1] - a[1]);
  writeLog(Object.fromEntries(entries.slice(0, LOG_MAX_ENTRIES)));
}

/** Existe algum aviso registrado com o prefixo informado (ex.: `day:`)? */
export function hasSentWithPrefix(prefix: string, withinMs: number = DEFAULT_GAP_MS): boolean {
  const cutoff = Date.now() - withinMs;
  return Object.entries(readLog()).some(([key, at]) => key.startsWith(prefix) && at >= cutoff);
}

async function serviceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
    /* `ready` resolve quando o SW do PWA termina de instalar. */
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 4000)),
    ]);
  } catch {
    return null;
  }
}

export interface ShowNotificationInput {
  title: string;
  body: string;
  tag: string;
  /** Ícone (padrão: logo do PWA). */
  icon?: string;
}

/**
 * Mostra a notificação pelo melhor caminho disponível.
 * Devolve `false` quando não há permissão/suporte (o agendador ainda assim
 * registra o envio para não repetir em loop).
 */
export async function showAppNotification(input: ShowNotificationInput): Promise<boolean> {
  if (!notificationsGranted()) return false;

  const icon = input.icon ?? '/assets/icons/logo-192.png';
  const options: NotificationOptions = {
    body: input.body,
    tag: input.tag,
    icon,
    badge: icon,
    data: { url: typeof window === 'undefined' ? '/' : window.location.origin },
  };

  /* 1) Service Worker — único caminho no Chrome Android. */
  const registration = await serviceWorkerRegistration();
  if (registration?.showNotification) {
    try {
      await registration.showNotification(input.title, options);
      return true;
    } catch {
      /* segue para o fallback */
    }
  }

  /* 2) API da página (desktop). */
  try {
    const notification = new Notification(input.title, options);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}
