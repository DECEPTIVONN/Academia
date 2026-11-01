/**
 * push-sw.js — handler de Push no Service Worker (v4.67.0)
 *
 * Este arquivo é INJETADO no Service Worker gerado pelo `vite-plugin-pwa`
 * (`workbox.importScripts` em `vite.config.ts`), então o SW que já garante o
 * modo offline passa a também receber push com o app fechado.
 *
 * O envio vem de `/api/push-dispatch` (VAPID + aes128gcm). O corpo chega como
 * JSON já pronto: `{ kind, title, body, tag, url }` — o texto é montado no
 * servidor para o Service Worker não precisar carregar o bundle do app.
 */

/* eslint-env serviceworker */

const DEFAULT_ICON = '/assets/icons/logo-192.png';
const DEFAULT_URL = '/';

/** Lê o payload do push (JSON) sem deixar erro estourar o handler. */
function readPayload(event) {
  if (!event.data) return {};
  try {
    return event.data.json() ?? {};
  } catch {
    try {
      const text = event.data.text();
      return text ? { body: text } : {};
    } catch {
      return {};
    }
  }
}

self.addEventListener('push', (event) => {
  const payload = readPayload(event);

  const title = payload.title || 'EVO FIT';
  const options = {
    body: payload.body || '',
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_ICON,
    tag: payload.tag || `evofit-${payload.kind || 'notice'}`,
    renotify: Boolean(payload.tag),
    data: {
      url: payload.url || DEFAULT_URL,
      kind: payload.kind || 'notice',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const target = event.notification.data?.url || DEFAULT_URL;
  const absolute = new URL(target, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        if (client.url.startsWith(self.location.origin)) {
          /* Aba já aberta: foca e avisa o app para navegar. */
          await client.focus();
          client.postMessage({ type: 'academia:notification-click', url: target });
          return;
        }
      }
      await self.clients.openWindow(absolute);
    })(),
  );
});

/**
 * A assinatura pode ser trocada pelo navegador (ex.: após limpar dados).
 * Avisamos a página aberta para reassinar; sem página aberta, a próxima
 * abertura do app revalida a assinatura (`features/notifications/push.ts`).
 */
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        client.postMessage({ type: 'academia:push-resubscribe' });
      }
    })(),
  );
});
