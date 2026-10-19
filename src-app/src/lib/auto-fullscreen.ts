/**
 * auto-fullscreen.ts — Tela cheia automática com persistência (v4.4.0 → v4.8.3.1)
 *
 * Com a pref `academia_pref_auto_fullscreen` ativa, QUALQUER toque/clique
 * em qualquer lugar da tela entra (ou RETORNA) ao modo de tela cheia.
 *
 * Regras:
 *  • permanece armado enquanto a pref estiver ligada — se o usuário sair
 *    da tela cheia por qualquer motivo (ESC do navegador, botão "Sair da
 *    tela cheia", gesto do sistema), o PRÓXIMO toque/clique reativa;
 *  • quando a pref muda em sessão, o evento
 *    `academia:auto-fullscreen-changed` (dispatchado pelo SettingsFeature)
 *    arma/desarma em tempo real;
 *  • em PWA instalado (`display-mode: standalone`) a pref TAMBÉM funciona:
 *    standalone não é tela cheia (a barra de status do sistema continua
 *    visível) e a Fullscreen API é permitida mediante gesto — antes o
 *    `!isStandalone()` desarmava tudo e a opção não fazia nada no app
 *    instalado. Onde a API não existe (iOS Safari, que só a implementa em
 *    `<video>`), nada é armado.
 */

import { PREF_KEYS, readLS } from '@/features/profile/profile-data';

/** Eventos de gesto (pointer + touch + clique), em capture. */
const GESTURE_EVENTS = ['pointerdown', 'touchstart', 'click'] as const;

let armed = false;
let attemptInFlight = false;

function canUseFullscreen(): boolean {
  // iOS só implementa requestFullscreen em elementos <video>.
  return typeof document.documentElement.requestFullscreen === 'function';
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
          // Permanece armado: sair da tela cheia (ESC/botão/gesto) e tocar
          // de novo reativa automaticamente (v4.8.3.1).
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

function arm(): void {
  if (armed) return;
  if (readLS(PREF_KEYS.autoFullscreen) !== 'true') return;
  if (!canUseFullscreen()) return;
  armed = true;
  for (const ev of GESTURE_EVENTS) {
    document.addEventListener(ev, onGesture, true);
  }
}

function disarm(): void {
  if (!armed) return;
  armed = false;
  for (const ev of GESTURE_EVENTS) {
    document.removeEventListener(ev, onGesture, true);
  }
}

/** Reavalia a pref (usado quando ela muda em sessão). */
export function syncAutoFullscreen(): void {
  disarm();
  arm();
}

/**
 * Inicializa no boot da página (chamar uma vez, ex.: main.tsx).
 * Recarregar a página rearma o gesto; com a pref ligada, o listener
 * permanece ativo até o desarm explícito (pref desligada).
 */
export function initAutoFullscreen(): void {
  window.addEventListener('academia:auto-fullscreen-changed', syncAutoFullscreen);
  arm();
}
