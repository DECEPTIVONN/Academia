/**
 * audio-engine.ts — Motor de áudio multi-contexto (v4.19.0-music)
 *
 * Contextos de música do site (Assets/Sounds/):
 *  • main      → MAIN.mp3 (loop) — ambiente padrão;
 *  • workout   → Black Panther — War For Wakanda (loop) — durante o treino;
 *  • result    → RESULT.mp3 (1x) — ao concluir o treino; ao terminar (ou no
 *                clique do botão INCRÍVEL) volta para main;
 *  • missions  → Revenger Phoenix (loop) — overlay de Missões aberto;
 *  • user      → playlist do usuário durante o treino (uploads via blob URL
 *                + itens YouTube via IFrame API; itens Spotify são pulados no
 *                treino — embed não permite autoplay forçado).
 *
 * Regras de precedência (treino):
 *  1. Playlist ativa do usuário com itens → ela toca (músicas do site de
 *     treino NÃO tocam);
 *  2. senão, se a pref "músicas do site durante o treino" estiver ligada →
 *     faixa de treino do site;
 *  3. senão → silêncio durante o treino (main pausa).
 *
 * Chaves:
 *  • academia_pref_music_enabled/volume  (master — background-music.ts);
 *  • academia_pref_workout_music          (novo — site no treino, padrão on).
 *
 * Eventos:
 *  • 'academia:music-state' → { context, playing, title, artist } p/ UI.
 *  • escuta 'academia:music-changed' (volume/master vindos do Settings).
 *
 * v4.22.0 — Media Session seletiva: MAIN, RESULT e Revenger Phoenix NÃO
 * aparecem no player de notificação do Android/Windows; uploads, YouTube e
 * Black Panther continuam aparecendo normalmente. Reproduções de uploads
 * contam playCount (Biblioteca → ordenar "Mais tocado").
 *
 * Autoplay: os contextos são acionados por gestos do usuário (abrir treino,
 * concluir treino, abrir missões) — play() direto; falha → re-arm por gesto.
 */

import { PREF_KEYS, readLS } from '@/features/profile/profile-data';
import { isMusicEnabled, getMusicVolume, claimMusicPlayback } from '@/lib/background-music';
import {
  loadAudioBlob,
  useLibraryStore,
  type PlaylistItem,
  type SiteTrackId,
} from '@/features/music/media-store';

export type MusicContext = 'main' | 'workout' | 'workout-user' | 'result' | 'missions';

export interface MusicState {
  context: MusicContext;
  playing: boolean;
  title: string;
  artist: string;
}

const SITE_TRACKS = {
  main: {
    src: '/assets/sounds/MAIN.mp3',
    loop: true,
    title: 'MAIN',
    artist: 'Trilha Evo Fit',
  },
  workout: {
    src: "/assets/sounds/Black Panther_ War For Wakanda Expansion Menu Theme (Marvel_s Avengers Game)(MP3_160K).mp3",
    loop: true,
    title: 'Black Panther: War For Wakanda',
    artist: "Marvel's Avengers Game",
  },
  result: {
    src: '/assets/sounds/RESULT.mp3',
    loop: false,
    title: 'RESULT',
    artist: 'Trilha Evo Fit',
  },
  missions: {
    src: '/assets/sounds/Revenger Phoenix(MP3_160K).mp3',
    loop: true,
    title: 'Revenger Phoenix',
    artist: 'Trilha Evo Fit',
  },
} as const;

let siteAudio: HTMLAudioElement | null = null;
let userAudio: HTMLAudioElement | null = null;
let inited = false;
let gestureArmed = false;
let gestureHandler: EventListener | null = null;

let context: MusicContext = 'main';
let playing = false;
let title = '';
let artist = '';

/* v4.22.0 — faixa do site tocando agora (ambiente ou dentro da fila).
   MAIN, RESULT e Revenger Phoenix NÃO aparecem no player de notificação. */
let currentSiteId: SiteTrackId | null = null;
const MS_HIDDEN_SITES: ReadonlySet<SiteTrackId> = new Set<SiteTrackId>(['main', 'missions', 'result']);

/* Fila do usuário (treino) */
let queue: PlaylistItem[] = [];
let queueIndex = 0;
let currentObjectUrl: string | null = null;

/* YouTube IFrame API (lazy) */
let ytReady: Promise<void> | null = null;
let ytPlayer: YTPlayerLike | null = null;
let ytPendingRef: string | null = null;

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: Record<string, unknown>,
      ) => YTPlayerLike;
      PlayerState?: { ENDED: number; PLAYING: number; PAUSED: number };
    };
  }
}

/** Shape mínimo do player do YouTube IFrame API (sem @types/youtube no projeto). */
interface YTPlayerLike {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  loadVideoById(id: string): void;
  loadPlaylist(opts: { list: string; listType: 'playlist'; index: number }): void;
  setVolume(v: number): void;
}

type YTStateEvent = { data: number };

function workoutMusicEnabled(): boolean {
  return readLS(PREF_KEYS.workoutMusic) !== 'false';
}

function emitState(): void {
  window.dispatchEvent(
    new CustomEvent('academia:music-state', {
      detail: { context, playing, title, artist } satisfies MusicState,
    }),
  );
  updateMediaSession();
}

/* ──────────────── Media Session API (notificação Android) ────────────────
   Sem metadata, o Chrome mostra só "Fichas de Treino — Academia" + a URL e
   SEM botões de avançar/retroceder. Com Metadata + action handlers, a
   notificação ganha nome, arte, duração/barra de progresso e prev/next. */

const MS_ARTWORK = [
  { src: '/assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
  { src: '/assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
];

function mediaSession(): MediaSession | null {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return null;
  return navigator.mediaSession;
}

/** v4.22.0 — MAIN/RESULT/Revenger Phoenix ficam FORA da notificação. */
function msHidden(): boolean {
  return currentSiteId !== null && MS_HIDDEN_SITES.has(currentSiteId);
}

function updateMediaSession(): void {
  const ms = mediaSession();
  if (!ms) return;
  try {
    if (!title || msHidden()) {
      ms.metadata = null;
      return;
    }
    ms.metadata = new MediaMetadata({
      title,
      artist: artist || 'Evo Fit',
      album: 'Academia Evo Fit',
      artwork: MS_ARTWORK,
    });
  } catch {
    /* MediaMetadata indisponível */
  }
}

/** Posição/duração na barra de progresso da notificação (áudio HTML). */
function updatePositionState(el: HTMLAudioElement): void {
  const ms = mediaSession();
  if (!ms?.setPositionState || msHidden()) return;
  try {
    if (Number.isFinite(el.duration) && el.duration > 0) {
      ms.setPositionState({
        duration: el.duration,
        position: Math.min(el.currentTime, el.duration),
        playbackRate: el.playbackRate || 1,
      });
    }
  } catch {
    /* estado inválido (ex.: duração NaN) */
  }
}

function seekBy(delta: number): void {
  const el =
    context === 'workout-user'
      ? queue[queueIndex]?.kind === 'site'
        ? getSiteAudio()
        : getUserAudio()
      : getSiteAudio();
  try {
    if (Number.isFinite(el.duration) && el.duration > 0) {
      el.currentTime = Math.min(el.duration - 0.1, Math.max(0, el.currentTime + delta));
    }
  } catch {
    /* seek indisponível */
  }
}

/** Liga os handlers da notificação (play/pause/prev/next/seek). */
function setupMediaSessionHandlers(): void {
  const ms = mediaSession();
  if (!ms) return;
  const safe = (action: MediaSessionAction, fn: () => void) => {
    try {
      ms.setActionHandler(action, fn);
    } catch {
      /* ação não suportada nesta plataforma */
    }
  };
  safe('play', () => {
    if (!playing) resumeCurrent();
  });
  safe('pause', () => {
    if (playing) togglePlayback();
  });
  safe('previoustrack', () => prevTrack());
  safe('nexttrack', () => nextTrack());
  safe('seekbackward', () => seekBy(-10));
  safe('seekforward', () => seekBy(10));
}

function getSiteAudio(): HTMLAudioElement {
  if (!siteAudio) {
    siteAudio = new Audio();
    siteAudio.preload = 'auto';
    siteAudio.addEventListener('ended', () => {
      // Faixa do site dentro da playlist do usuário → avança a fila.
      if (context === 'workout-user') {
        advanceUserQueue();
        return;
      }
      // RESULT terminou → volta o ambiente (main).
      if (context === 'result') void playSite('main');
    });
    // Barra de progresso da notificação (duração/posição reais)
    siteAudio.addEventListener('loadedmetadata', () => updatePositionState(siteAudio!));
    siteAudio.addEventListener('timeupdate', () => updatePositionState(siteAudio!));
  }
  return siteAudio;
}

function getUserAudio(): HTMLAudioElement {
  if (!userAudio) {
    userAudio = new Audio();
    userAudio.preload = 'auto';
    userAudio.addEventListener('ended', () => {
      if (context === 'workout-user') advanceUserQueue();
    });
    userAudio.addEventListener('loadedmetadata', () => updatePositionState(userAudio!));
    userAudio.addEventListener('timeupdate', () => updatePositionState(userAudio!));
  }
  return userAudio;
}

function applyVolume(el: HTMLAudioElement): void {
  try {
    el.volume = Math.min(1, Math.max(0, getMusicVolume() / 100));
  } catch {
    /* iOS: volume read-only */
  }
}

function armGestures(): void {
  if (gestureArmed) return;
  gestureArmed = true;
  gestureHandler = () => {
    resumeCurrent();
    if (playing) disarmGestures();
  };
  document.addEventListener('pointerdown', gestureHandler, true);
  document.addEventListener('keydown', gestureHandler, true);
}

function disarmGestures(): void {
  if (!gestureArmed) return;
  if (gestureHandler) {
    document.removeEventListener('pointerdown', gestureHandler, true);
    document.removeEventListener('keydown', gestureHandler, true);
    gestureHandler = null;
  }
  gestureArmed = false;
}

/* ─────────────────────────── Contextos do site ────────────────────────── */

async function playSite(next: Exclude<MusicContext, 'workout-user'>): Promise<void> {
  const conf = SITE_TRACKS[next];
  const el = getSiteAudio();
  context = next;
  title = conf.title;
  artist = conf.artist;
  currentSiteId = next; // v4.22.0 — identifica a faixa p/ notificação

  if (!isMusicEnabled()) {
    // Master desligado → nada do site toca.
    el.pause();
    playing = false;
    emitState();
    return;
  }

  if (!el.src.endsWith(encodeURI(conf.src)) && !el.src.endsWith(conf.src)) {
    el.src = conf.src;
  }
  el.loop = conf.loop;
  applyVolume(el);
  try {
    await el.play();
    playing = true;
    disarmGestures();
  } catch {
    playing = false;
    armGestures(); // autoplay recusado — tenta no próximo gesto
  }
  emitState();
}

function pauseSite(): void {
  getSiteAudio().pause();
  if (context !== 'workout-user') playing = false;
}

/** Toca a trilha de treino do site ou silencia (regras de precedência). */
function startWorkoutContext(): void {
  const lib = useLibraryStore.getState();
  const active = lib.playlists.find((p) => p.id === lib.activePlaylistId);
  if (active && active.items.length > 0) {
    void startUserQueue(active.items);
    return;
  }
  if (workoutMusicEnabled()) {
    void playSite('workout');
  } else {
    // Músicas do site desabilitadas no treino → silêncio.
    pauseSite();
    context = 'workout';
    playing = false;
    title = '';
    artist = '';
    emitState();
  }
}

/* ─────────────────────── Fila do usuário (treino) ─────────────────────── */

function isPlayableItem(it: PlaylistItem): boolean {
  return it.kind === 'upload' || it.kind === 'youtube' || it.kind === 'site';
}

async function startUserQueue(items: PlaylistItem[]): Promise<void> {
  queue = items.filter(isPlayableItem);
  if (queue.length === 0) {
    // Playlist só com Spotify (ou vazia) → cai na regra do site.
    if (workoutMusicEnabled()) void playSite('workout');
    return;
  }
  queueIndex = 0;
  context = 'workout-user';
  await playQueueIndex(queueIndex);
}

async function playQueueIndex(index: number): Promise<void> {
  const item = queue[index];
  if (!item) return;
  context = 'workout-user';
  title = item.title;
  artist = item.kind === 'upload' ? 'Sua playlist' : item.kind === 'site' ? 'Trilha do app' : 'YouTube';
  /* v4.22.0 — uploads/YouTube aparecem na notificação; a faixa do site só
     se não for MAIN/RESULT/Revenger Phoenix. */
  currentSiteId = item.kind === 'site' ? item.siteId : null;
  if (item.kind === 'upload') useLibraryStore.getState().registerPlay(item.trackId); // v4.22.0 — "mais tocado"
  pauseSite();

  if (item.kind === 'upload') {
    stopYt();
    const blob = await loadAudioBlob(item.trackId);
    if (!blob) {
      // Arquivo sumiu → próximo.
      advanceUserQueue();
      return;
    }
    const el = getUserAudio();
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = URL.createObjectURL(blob);
    el.src = currentObjectUrl;
    el.loop = false;
    applyVolume(el);
    try {
      await el.play();
      playing = true;
      disarmGestures();
    } catch {
      playing = false;
      armGestures();
    }
    emitState();
    return;
  }

  /* v4.21.0 — faixa fixa do site dentro de uma playlist (Evo Fit):
     toca no siteAudio mas SEM loop, para a fila avançar no `ended`. */
  if (item.kind === 'site') {
    stopYt();
    const conf = SITE_TRACKS[item.siteId];
    const el = getSiteAudio();
    getUserAudio().pause();
    if (!el.src.endsWith(encodeURI(conf.src)) && !el.src.endsWith(conf.src)) {
      el.src = conf.src;
    }
    el.loop = false;
    applyVolume(el);
    try {
      await el.play();
      playing = true;
      disarmGestures();
    } catch {
      playing = false;
      armGestures();
    }
    emitState();
    return;
  }

  // YouTube
  getUserAudio().pause();
  await playYouTube(item.refId, item.refId.startsWith('PL') || item.refId.startsWith('UL'));
}

function advanceUserQueue(): void {
  if (queue.length === 0) return;
  queueIndex = (queueIndex + 1) % queue.length; // loop da fila durante o treino
  void playQueueIndex(queueIndex);
}

function stopUserQueue(): void {
  getUserAudio().pause();
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
  stopYt();
  // A fila pode estar tocando uma faixa do site no siteAudio → pausa ela.
  if (queue[queueIndex]?.kind === 'site') getSiteAudio().pause();
  queue = [];
  queueIndex = 0;
}

/* ─────────────────────────── YouTube IFrame ───────────────────────────── */

function loadYtApi(): Promise<void> {
  if (ytReady) return ytReady;
  ytReady = new Promise((resolve) => {
    if (typeof window.YT !== 'undefined' && window.YT.Player) {
      resolve();
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });
  return ytReady;
}

async function playYouTube(refId: string, isPlaylist: boolean): Promise<void> {
  ytPendingRef = refId;
  await loadYtApi();
  if (ytPendingRef !== refId) return; // contexto trocou durante o load

  if (!ytPlayer) {
    const host = document.createElement('div');
    host.style.cssText =
      'position:fixed;width:1px;height:1px;opacity:0.01;pointer-events:none;left:-10px;bottom:-10px;z-index:-1;';
    host.id = 'academia-yt-host';
    document.body.appendChild(host);
    await new Promise<void>((resolve) => {
      ytPlayer = new window.YT!.Player(host, {
        height: '1',
        width: '1',
        playerVars: { autoplay: 1, controls: 0, playsinline: 1 },
        events: {
          onReady: () => resolve(),
          onStateChange: (e: YTStateEvent) => {
            if (e.data === window.YT?.PlayerState?.ENDED && context === 'workout-user') {
              advanceUserQueue();
            }
          },
        },
      });
    });
  }

  const p = ytPlayer as YTPlayerLike;
  if (isPlaylist) p.loadPlaylist({ list: refId, listType: 'playlist', index: 0 });
  else p.loadVideoById(refId);
  p.setVolume(Math.round(getMusicVolume()));
  playing = true;
  disarmGestures();
  emitState();
}

function stopYt(): void {
  ytPendingRef = null;
  try {
    ytPlayer?.stopVideo();
  } catch {
    /* player ainda não pronto */
  }
}

/* ────────────────────────────── API pública ───────────────────────────── */

/** Retoma o que deveria tocar no contexto atual (após gesto ou un-pause). */
function resumeCurrent(): void {
  if (context === 'workout-user') {
    if (queue.length > 0) void playQueueIndex(queueIndex);
    return;
  }
  void playSite(context);
}

/** Boot (main.tsx) — idempotente. */
export function initAudioEngine(): void {
  if (inited) return;
  inited = true;

  // v4.19.0 — assume a reprodução global (módulo v4.18 fica só com prefs).
  claimMusicPlayback();

  // v4.21.0 — botões avançar/retroceder/toque/pausa na notificação do Android.
  setupMediaSessionHandlers();

  // Hidrata a biblioteca (tracks/playlists/ativa) para que a playlist de
  // treino valha mesmo sem o usuário abrir a interface de Músicas antes.
  useLibraryStore.getState().hydrate();

  // Estado inicial: ambiente main (pausa imediata se master off).
  context = 'main';
  const el = getSiteAudio();
  applyVolume(el);

  // Volume/master vindos do Settings em tempo real.
  window.addEventListener('academia:music-changed', () => {
    applyVolume(getSiteAudio());
    if (userAudio) applyVolume(userAudio);
    try {
      ytPlayer?.setVolume(Math.round(getMusicVolume()));
    } catch {
      /* player inexistente */
    }
    if (!isMusicEnabled()) {
      pauseSite();
      stopUserQueue();
      playing = false;
      emitState();
    } else if (!playing) {
      // Master religado → retoma o contexto atual (main/treino/etc).
      resumeCurrent();
    }
  });

  // Início de treino (PRÓXIMO PASSO / StartWorkout) → contexto de treino.
  window.addEventListener('academia:workout-started', startWorkoutContext);

  // Conclusão (abertura do ConclusaoModal) → faixa RESULT.
  window.addEventListener('academia:workout-completed', () => {
    stopUserQueue();
    void playSite('result');
  });

  // Fechamento do modal (botão INCRÍVEL) → volta MAIN.
  window.addEventListener('academia:workout-closed', () => {
    stopUserQueue();
    void playSite('main');
  });

  // Encerramento sem conclusão (cancelar) → volta MAIN.
  window.addEventListener('academia:workout-cancelled', () => {
    stopUserQueue();
    void playSite('main');
  });

  // Missões → pausa o atual e toca a faixa; fechar → retoma o anterior.
  let missionsPrev: MusicContext = 'main';
  window.addEventListener('academia:missions-open', () => {
    missionsPrev = context === 'missions' ? 'main' : context;
    pauseSite();
    stopUserQueue();
    void playSite('missions');
  });
  window.addEventListener('academia:missions-close', () => {
    if (context !== 'missions') return;
    if (missionsPrev === 'workout-user' || missionsPrev === 'workout') {
      startWorkoutContext();
    } else {
      void playSite('main');
    }
  });

  // Autoplay do ambiente: tenta direto (pode ser permitido); senão, gesto.
  if (isMusicEnabled()) void playSite('main');
}

/** Pausa/retoma manual (mini-player da interface de Músicas). */
export function togglePlayback(): void {
  const el =
    context === 'workout-user'
      ? queue[queueIndex]?.kind === 'site'
        ? getSiteAudio()
        : getUserAudio()
      : getSiteAudio();
  if (playing) {
    el.pause();
    try {
      ytPlayer?.pauseVideo();
    } catch {
      /* sem player */
    }
    playing = false;
    disarmGestures();
    emitState();
  } else {
    resumeCurrent();
  }
}

export function getMusicState(): MusicState {
  return { context, playing, title, artist };
}

/** Toca uma playlist específica na interface (não mexe no contexto do treino). */
export async function playPlaylistFromUi(items: PlaylistItem[]): Promise<void> {
  const playable = items.filter(isPlayableItem);
  if (playable.length === 0) return;
  queue = playable;
  queueIndex = 0;
  await playQueueIndex(0);
}

/** Toca uma faixa do site pela interface de Músicas (mini-player/home). */
export function playSiteTrackFromUi(id: 'main' | 'workout' | 'result' | 'missions'): void {
  stopUserQueue();
  void playSite(id);
}

/* ─────────────── Avançar/Retroceder (miniplayer flutuante) ─────────────── */

/** Ordem das faixas do site para navegação prev/next. */
const SITE_ORDER: Array<'main' | 'workout' | 'missions' | 'result'> = [
  'main',
  'workout',
  'missions',
  'result',
];

/** Próxima faixa: fila do usuário (playlist) ou ciclo das faixas do site. */
export function nextTrack(): void {
  if (context === 'workout-user' && queue.length > 0) {
    queueIndex = (queueIndex + 1) % queue.length;
    void playQueueIndex(queueIndex);
    return;
  }
  const i = SITE_ORDER.indexOf(context as (typeof SITE_ORDER)[number]);
  const next = SITE_ORDER[(i + 1) % SITE_ORDER.length] ?? 'main';
  void playSite(next);
}

/** Faixa anterior: fila do usuário ou ciclo reverso das faixas do site. */
export function prevTrack(): void {
  if (context === 'workout-user' && queue.length > 0) {
    queueIndex = (queueIndex - 1 + queue.length) % queue.length;
    void playQueueIndex(queueIndex);
    return;
  }
  const i = SITE_ORDER.indexOf(context as (typeof SITE_ORDER)[number]);
  const prev = SITE_ORDER[(i - 1 + SITE_ORDER.length) % SITE_ORDER.length] ?? 'main';
  void playSite(prev);
}
