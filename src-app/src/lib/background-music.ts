/**
 * background-music.ts — Música de fundo do app (v4.18.0-music)
 *
 * Toca `Assets/Sounds/MAIN.mp3` em loop enquanto o app está aberto.
 * Preferências (localStorage):
 *  • `academia_pref_music_enabled` — 'true' (padrão) | 'false';
 *  • `academia_pref_music_volume`  — inteiro 0–100 (padrão 70).
 *
 * Regras:
 *  • navegadores bloqueiam autoplay com som — o play é adiado até o
 *    PRIMEIRO gesto do usuário (pointerdown/keydown, capture) e re-tentado
 *    a cada gesto enquanto a música estiver ligada e pausada;
 *  • ligar a música nas Configurações já dispara play() de imediato (o
 *    clique é um gesto válido);
 *  • o elemento é criado uma única vez (singleton) e mantido em memória;
 *    pausar não recarrega o arquivo no próximo play;
 *  • mudanças feitas aqui disparam `academia:music-changed` (detail:
 *    { enabled, volume }) para a UI de Configurações se atualizar;
 *  • volume 0 = mudo (a música continua "ligada" — usuário pode subir);
 *    no iOS Safari `audio.volume` é read-only, o controle degrada
 *    gracioso (o switch de ligar/desligar continua funcional).
 */

import { PREF_KEYS, readLS } from '@/features/profile/profile-data';

const MUSIC_SRC = '/assets/sounds/MAIN.mp3';
const GESTURE_EVENTS = ['pointerdown', 'keydown'] as const;
const DEFAULT_VOLUME = 70;

let audio: HTMLAudioElement | null = null;
let gestureArmed = false;
let inited = false;
/* v4.48.0 — a página ficou oculta com o loop tocando? (retoma ao voltar) */
let legacyWasPlaying = false;
/** v4.19.0-music — quando true, a reprodução é do audio-engine (motor
 *  multi-contexto); este módulo fica só com prefs + evento academia:music-changed. */
let playbackClaimed = false;

/** audio-engine assume a reprodução (evita dois players de MAIN.mp3). */
export function claimMusicPlayback(): void {
  try {
    audio?.pause(); // pausa o player legado ANTES de marcar a posse
  } catch {
    /* sem player */
  }
  playbackClaimed = true;
}

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_VOLUME;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function isMusicEnabled(): boolean {
  return readLS(PREF_KEYS.musicEnabled) !== 'false';
}

export function getMusicVolume(): number {
  return clampVolume(Number(readLS(PREF_KEYS.musicVolume) ?? DEFAULT_VOLUME));
}

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.preload = 'auto';
  }
  return audio;
}

function emitChange(): void {
  window.dispatchEvent(
    new CustomEvent('academia:music-changed', {
      detail: { enabled: isMusicEnabled(), volume: getMusicVolume() },
    }),
  );
}

function onGesture(): void {
  const el = getAudio();
  if (el.paused) {
    el.play().then(disarmGestures).catch(() => {
      /* recusado (ex.: iOS sem play em gesto não-trusted) — rearmado no próximo gesto */
    });
  } else {
    disarmGestures();
  }
}

function armGestures(): void {
  if (gestureArmed) return;
  gestureArmed = true;
  for (const ev of GESTURE_EVENTS) {
    document.addEventListener(ev, onGesture, true);
  }
}

function disarmGestures(): void {
  if (!gestureArmed) return;
  gestureArmed = false;
  for (const ev of GESTURE_EVENTS) {
    document.removeEventListener(ev, onGesture, true);
  }
}

/** Toca imediatamente (o chamador deve estar dentro de um gesto do usuário). */
export function playMusicNow(): void {
  if (playbackClaimed) return; // v4.19.0 — reprodução é do audio-engine
  const el = getAudio();
  el.play().then(disarmGestures).catch(() => armGestures());
}

export function pauseMusicNow(): void {
  if (playbackClaimed) return; // v4.19.0 — reprodução é do audio-engine
  getAudio().pause();
  disarmGestures();
}

/** Liga/desliga a música e persiste a pref. */
export function setMusicEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(PREF_KEYS.musicEnabled, String(enabled));
  } catch {
    /* storage indisponível — segue em memória */
  }
  if (enabled) {
    playMusicNow();
  } else {
    pauseMusicNow();
  }
  emitChange();
}

/** Ajusta o volume (0–100) e persiste a pref. */
export function setMusicVolume(volume: number): void {
  const v = clampVolume(volume);
  try {
    localStorage.setItem(PREF_KEYS.musicVolume, String(v));
  } catch {
    /* storage indisponível — segue em memória */
  }
  // v4.28 — com a posse no audio-engine não há elemento legado a ajustar
  // (evita criar o <audio preload="auto"> e baixar MAIN.mp3 à toa).
  if (!playbackClaimed) {
    const el = getAudio();
    el.volume = v / 100;
    // Subir de 0 com a música ligada e pausada: tenta retomar.
    if (v > 0 && isMusicEnabled() && el.paused) {
      playMusicNow();
    }
  }
  emitChange();
}

/**
 * Inicializa no boot da página (chamar uma vez, ex.: main.tsx).
 * Aplica volume/pref salvos e arma o gesto de autoplay se a música
 * estiver ligada. Idempotente (StrictMode-safe).
 */
export function initBackgroundMusic(): void {
  if (inited) return;
  inited = true;

  // v4.19.0 — se o audio-engine assumiu a reprodução, só as prefs valem.
  // v4.28 — este early-return vem ANTES de getAudio(): criar aqui o
  // <audio preload="auto"> disparava um 2º download de MAIN.mp3 (7 MB)
  // concorrendo com o fetch/decode do audio-engine no boot, atrasando o 1º
  // play. Com a posse do motor, o elemento legado nem precisa existir.
  if (playbackClaimed) return;

  const el = getAudio();
  el.volume = getMusicVolume() / 100;

  if (isMusicEnabled()) {
    // Tenta direto (funciona em contexts com autoplay permitido —
    // ex.: app instalado com permissão); se recusado, arma o gesto.
    el.play().then(disarmGestures).catch(() => armGestures());
  }

  /* v4.48.0 — fechar ou ocultar o site não pode deixar o loop tocando
     "sozinha" no computador. pagehide = aba/janela/navegação fechando;
     visibilitychange = o site sumiu da vista (no desktop, fechar o painel
     nem sempre destrói a página). Com a posse no audio-engine (sempre desde
     o boot), este módulo só garante o próprio elemento — o motor cuida do resto. */
  const pauseLegacy = () => {
    if (playbackClaimed || !audio) return;
    if (!audio.paused) legacyWasPlaying = true;
    audio.pause();
    disarmGestures();
  };
  window.addEventListener('pagehide', pauseLegacy);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      pauseLegacy();
      return;
    }
    if (!legacyWasPlaying) return;
    legacyWasPlaying = false;
    if (isMusicEnabled() && !playbackClaimed) playMusicNow();
  });
}
