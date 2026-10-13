/**
 * native-share.ts — Compartilhamento nativo do sistema (Web Share API) (v4.14.0)
 *
 * Contexto: na versão legacy o app rodava localmente via HTTP e
 * `navigator.share` NÃO EXISTIA fora de contexto seguro (HTTPS/localhost) —
 * por isso os compartilhamentos "não funcionavam" e caíam sempre no
 * clipboard. Agora o app está hospedado na Vercel (HTTPS), então a folha de
 * compartilhamento NATIVA da plataforma (Android/Windows/iOS) passa a ser
 * usada automaticamente, conforme o sistema do usuário.
 *
 * Regras:
 *  • `shareNative()` tenta a folha nativa, com `canShare` de guarda (ex.:
 *    desktop Windows não aceita `files`; Chrome desktop sem Web Share não tem
 *    a API) — quem chama decide o fallback (clipboard/download + toast);
 *  • 'cancelled' (AbortError) = o usuário FECHOU a folha — NÃO é erro e não
 *    deve disparar fallback (senão o clipboard dispara em cima do sheet);
 *  • API sempre chamada dentro de gesto do usuário (requisito do navegador).
 */

export type NativeShareResult = 'shared' | 'cancelled' | 'unsupported' | 'error';

export interface NativeSharePayload {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

/** true quando a plataforma expõe a Web Share API (contexto seguro + browser). */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Abre a folha de compartilhamento nativa do SO.
 * Retorna o desfecho para o chamador decidir o fallback.
 */
export async function shareNative(data: NativeSharePayload): Promise<NativeShareResult> {
  if (!canNativeShare()) return 'unsupported';
  const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };
  try {
    // canShare recusa combos inválidos (ex.: files no desktop) → fallback.
    if (nav.canShare && !nav.canShare(data)) return 'unsupported';
    await navigator.share(data);
    return 'shared';
  } catch (err) {
    const e = err as { name?: string };
    if (e?.name === 'AbortError') return 'cancelled';
    console.warn('[shareNative]', err);
    return 'error';
  }
}
