/**
 * auto-fullscreen.ts — Tela cheia automática no primeiro gesto (v4.4.0)
 *
 * Com a pref `academia_pref_auto_fullscreen` ativa, QUALQUER primeiro clique
 * do mouse ou toque (touch) em qualquer lugar da tela, logo após o
 * carregamento/recarga da página, aciona imediatamente o modo de tela cheia
 * do navegador (Fullscreen API no <html>).
 *
 * Regras:
 *  • O armamento acontece a cada carregamento de página (recarregar = rearma);
 *  • quando a pref muda em sessão, o evento
 *    `academia:auto-fullscreen-changed` (dispatchado pelo SettingsFeature)
 *    arma/desarma em tempo real;
 *  • em display-mode standalone (app instalado) ou onde a Fullscreen API não
 *    existe (ex.: iOS Safari fora de <video>), nada é armado — já é "app".
 */

import { PREF_KEYS, readLS } from '@/features/profile/profile-data';

/** Eventos de "primeiro gesto" (pointer + touch + clique), em capture. */
const GESTURE_EVENTS = ['pointerdown', 'touchstart', 'click'] as const;

let armed = false;
let attemptInFlight = false;

function isStandalone(): boolean {
  try {
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
    // iOS Safari (PWA adicionada à tela inicial)
    return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

function canUseFullscreen(): boolean {
  // iOS só implementa requestFullscreen em elementos <video>.
  return typeof document.documentElement.requestFullscreen === 'function' && !isStandalone();
}

function onGesture(): void {
  if (attemptInFlight) return;
  // Já em fullscreen (ex.: player de vídeo) ou API indisponível — nada a fazer.
  if (document.fullscreenElement) return;
  const el = document.documentElement;
  if (typeof el.requestFullscreen !== 'function') return;

  attemptInFlight = true;
  try {
    const result = el.requestFullscreen();
    if (result && typeof result.then === 'function') {
      result.then(
        () => {
          attemptInFlight = false;
          disarm();
        },
        () => {
          // Navegador recusou (ex.: iOS Safari, política de permissão).
          // Permanece armado — a próxima tentativa pode funcionar.
          attemptInFlight = false;
        },
      );
    } else {
      attemptInFlight = false;
    }
  } catch {
    attemptInFlight = false;
  }
}

function onFullscreenChange(): void {
  if (document.fullscreenElement === document.documentElement) disarm();
}

function arm(): void {
  if (armed) return;
  if (readLS(PREF_KEYS.autoFullscreen) !== 'true') return;
  if (!canUseFullscreen()) return;
  armed = true;
  for (const ev of GESTURE_EVENTS) {
    document.addEventListener(ev, onGesture, true);
  }
  document.addEventListener('fullscreenchange', onFullscreenChange);
}

function disarm(): void {
  if (!armed) return;
  armed = false;
  for (const ev of GESTURE_EVENTS) {
    document.removeEventListener(ev, onGesture, true);
  }
  document.removeEventListener('fullscreenchange', onFullscreenChange);
}

/** Reavalia a pref (usado quando ela muda em sessão). */
export function syncAutoFullscreen(): void {
  disarm();
  arm();
}

/**
 * Inicializa no boot da página (chamar uma vez, ex.: main.tsx).
 * Recarregar a página sempre rearma o "primeiro gesto".
 */
export function initAutoFullscreen(): void {
  window.addEventListener('academia:auto-fullscreen-changed', syncAutoFullscreen);
  arm();
}
