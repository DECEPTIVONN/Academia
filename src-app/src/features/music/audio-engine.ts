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
 * v4.25.x — essas 3 faixas são tocadas por Web Audio API (AudioBufferSourceNode)
 * em vez de <audio>: um elemento de mídia audível sempre gera a notificação
 * do Chrome (o metadata nulo só esconde título/arte). Sem elemento de mídia,
 * não há notificação. A faixa de treino (Black Panther) segue no <audio> e
 * aparece normalmente.
 *
 * v4.27 — LATÊNCIA: as faixas ocultas passaram a ser PRÉ-DECODIFICADAS
 * (main/missions no boot; result ao iniciar o treino) e o decode começa
 * ANTES do resume do AudioContext (o decode não exige gesto). Assim o 1º play
 * não espera fetch + decode completos — antes elas "demoravam para aparecer".
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
  /** v4.24.0 — posição atual na fila (só quando há fila do usuário; -1 = sem fila). */
  queueIndex: number;
  /** v4.24.0 — total de faixas na fila (0 = sem fila / faixa do site). */
  queueLength: number;
  /** v4.24.0 — há faixa anterior? Só 2ª música em diante mostra "Retroceder". */
  canPrev: boolean;
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
   MAIN, RESULT e Revenger Phoenix NÃO aparecem no player de notificação.
   v4.25.x — essas 3 faixas tocam por Web Audio (sem <audio>) → sem notificação. */
let currentSiteId: SiteTrackId | null = null;
const MS_HIDDEN_SITES: ReadonlySet<SiteTrackId> = new Set<SiteTrackId>(['main', 'missions', 'result']);

/* ═══════════ v4.25.x — Faixas OCULTAS via Web Audio API ═══════════
   Um <audio> audível por >5s SEMPRE gera a notificação de mídia do Chrome
   (o metadata nulo só remove título/arte). Para MAIN/Revenger Phoenix/RESULT
   usamos AudioBufferSourceNode sobre um AudioContext — sem elemento de mídia
   não há notificação. A faixa de treino (Black Panther) continua no <audio>.
   Fallback: se o AudioContext não existir/falhar, cai no <audio> (melhor
   esforço: metadata nulo). */
type HiddenSite = 'main' | 'missions' | 'result';
function isHiddenSite(id: string): id is HiddenSite {
  return MS_HIDDEN_SITES.has(id as SiteTrackId);
}

let audioCtx: AudioContext | null = null;
let waGain: GainNode | null = null;
let waSource: AudioBufferSourceNode | null = null;
/** Fonte oculta "atual" (mantida ao pausar, p/ retomar do ponto) + offset (s). */
let waCurrentSrc: string | null = null;
let waOffset = 0;
let waStartedAt = 0;
let waDuration = 0;
/** Guarda de reentrada: só o start mais recente aplica (gestos rápidos). */
let waStartSeq = 0;
const waBuffers = new Map<string, AudioBuffer>();
const waDecoding = new Map<string, Promise<AudioBuffer | null>>();

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioCtx) return audioCtx;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    audioCtx = new Ctor();
    waGain = audioCtx.createGain();
    waGain.connect(audioCtx.destination);
  } catch {
    audioCtx = null;
    waGain = null;
  }
  return audioCtx;
}

function applyGain(): void {
  if (!waGain) return;
  try {
    waGain.gain.value = Math.min(1, Math.max(0, getMusicVolume() / 100));
  } catch {
    /* gain indisponível */
  }
}

/** Decodifica (uma vez) a faixa em um AudioBuffer, com cache em memória. */
async function loadHiddenBuffer(src: string): Promise<AudioBuffer | null> {
  const cached = waBuffers.get(src);
  if (cached) return cached;
  const pending = waDecoding.get(src);
  if (pending) return pending;
  const ctx = getAudioCtx();
  if (!ctx) return null;
  const p = (async () => {
    try {
      const res = await fetch(src, { cache: 'force-cache' });
      const arr = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr);
      waBuffers.set(src, buf);
      return buf;
    } catch {
      return null;
    } finally {
      waDecoding.delete(src);
    }
  })();
  waDecoding.set(src, p);
  return p;
}

/** Para a fonte oculta e esquece o ponto (troca de contexto). */
function stopHiddenSource(): void {
  if (waSource) {
    try { waSource.onended = null; waSource.stop(); } catch { /* já parado */ }
    try { waSource.disconnect(); } catch { /* ok */ }
    waSource = null;
  }
  waCurrentSrc = null;
  waOffset = 0;
}

/** Pausa a fonte oculta PRESERVANDO o ponto (retoma depois). */
function pauseHidden(): void {
  if (waSource && audioCtx) {
    let off = waOffset + (audioCtx.currentTime - waStartedAt);
    if (waDuration > 0) off = ((off % waDuration) + waDuration) % waDuration;
    waOffset = Math.max(0, off);
    try { waSource.onended = null; waSource.stop(); } catch { /* ok */ }
    try { waSource.disconnect(); } catch { /* ok */ }
    waSource = null;
  }
}

/** Fim natural de uma faixa oculta (RESULT volta ao ambiente; fila avança). */
function hiddenEnded(src: string): void {
  if (waCurrentSrc !== src) return;
  if (context === 'result') void playSite('main');
  else if (context === 'workout-user') advanceUserQueue();
}

/**
 * Toca uma faixa oculta via Web Audio.
 *  • `true`  = tocando; `false` = não deu (retenta no gesto); `null` = outra
 *    reprodução assumiu (o caller não deve mexer no estado).
 */
async function startHidden(next: HiddenSite, loop: boolean, offset: number): Promise<boolean | null> {
  const seq = ++waStartSeq;
  const conf = SITE_TRACKS[next];
  const ctx = getAudioCtx();
  if (!ctx) return startHiddenViaElement(conf.src, loop);

  /* v4.27 — começa a DECODIFICAR já, mesmo com o contexto suspenso (o decode
     não exige gesto). Antes o decode só iniciava após o resume, então o 1º
     play esperava fetch + decode completos → silêncio longo. Agora o buffer
     fica pronto enquanto o app espera o 1º gesto. */
  const bufPromise = loadHiddenBuffer(conf.src);

  if (ctx.state !== 'running') {
    try { await ctx.resume(); } catch { /* precisa de gesto */ }
    if ((ctx.state as string) !== 'running') {
      void bufPromise; // segue decodificando p/ o próximo gesto
      return false; // retoma no próximo gesto
    }
  }
  const buf = await bufPromise;
  if (seq !== waStartSeq) return null; // outro start assumiu
  if (!buf) return startHiddenViaElement(conf.src, loop);

  stopHiddenSource();
  const node = ctx.createBufferSource();
  node.buffer = buf;
  node.loop = loop;
  if (waGain) node.connect(waGain);
  applyGain();
  node.onended = () => hiddenEnded(conf.src);
  const startAt = Math.max(0, Math.min(offset, Math.max(0, buf.duration - 0.05)));
  node.start(0, startAt);
  waSource = node;
  waCurrentSrc = conf.src;
  waDuration = buf.duration;
  waStartedAt = ctx.currentTime;
  waOffset = startAt;
  return true;
}

/** Fallback (sem Web Audio): toca via <audio> — metadata já fica nulo. */
async function startHiddenViaElement(src: string, loop: boolean): Promise<boolean> {
  stopHiddenSource();
  const el = getSiteAudio();
  if (!el.src.endsWith(encodeURI(src)) && !el.src.endsWith(src)) el.src = src;
  el.loop = loop;
  applyVolume(el);
  try {
    await el.play();
    return true;
  } catch {
    return false;
  }
}

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
  /* v4.24.0 — expõe a posição na fila p/ o player esconder "Retroceder" na 1ª
     música. Fila do usuário: há anterior da 2ª em diante. Faixa do site
     (contexto main/workout/result/missions): sempre dá pra voltar no ciclo. */
  const inUserQueue = context === 'workout-user' && queue.length > 0;
  const qIdx = inUserQueue ? queueIndex : -1;
  const qLen = inUserQueue ? queue.length : 0;
  // Só a fila do usuário tem "anterior". Faixa do site (playSite) toca isolada
  // com loop e não é parte de uma navegável → sem Retroceder.
  const canPrev = inUserQueue && qLen > 1 && qIdx > 0;
  window.dispatchEvent(
    new CustomEvent('academia:music-state', {
      detail: {
        context,
        playing,
        title,
        artist,
        queueIndex: qIdx,
        queueLength: qLen,
        canPrev,
      } satisfies MusicState,
    }),
  );
  updateMediaSession();
}

/* ──────────────── Media Session API (notificação Android) ────────────────
   Sem metadata, o Chrome mostra só "Fichas de Treino — EVO FIT" + a URL e
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
      album: 'Evo Fit',
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
    // v4.25.x — o AudioContext só retoma dentro de um gesto; depois a
    // reprodução oculta (Web Audio) segue sozinha (não precisa re-armar).
    const ctx = getAudioCtx();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
    resumeCurrent();
    const hiddenReady = context !== 'workout-user' && isHiddenSite(context) && !!ctx;
    if (playing || hiddenReady) disarmGestures();
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
  context = next;
  title = conf.title;
  artist = conf.artist;
  currentSiteId = next; // v4.22.0 — identifica a faixa p/ notificação

  if (!isMusicEnabled()) {
    // Master desligado → nada do site toca.
    stopHiddenSource();
    getSiteAudio().pause();
    playing = false;
    emitState();
    return;
  }

  if (isHiddenSite(next)) {
    // MAIN/RESULT/Revenger Phoenix → Web Audio (sem notificação de mídia).
    getSiteAudio().pause();
    const offset = waCurrentSrc === conf.src ? waOffset : 0;
    const ok = await startHidden(next, conf.loop, offset);
    if (ok === null) return; // outra reprodução assumiu o estado
    playing = ok;
    if (ok) disarmGestures();
    else armGestures();
  } else {
    // Faixa de TREINO (Black Panther) → <audio> normal (aparece na notificação).
    stopHiddenSource();
    const el = getSiteAudio();
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
  }
  emitState();
}

function pauseSite(): void {
  pauseHidden();
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
     toca SEM loop, para a fila avançar no `ended`.
     v4.25.x — se for oculta (main/missions/result), usa Web Audio (sem
     notificação); senão, o <audio> de sempre. */
  if (item.kind === 'site') {
    stopYt();
    const conf = SITE_TRACKS[item.siteId];
    getUserAudio().pause();
    if (isHiddenSite(item.siteId)) {
      getSiteAudio().pause();
      const ok = await startHidden(item.siteId, false, 0);
      if (ok === null) return; // outra reprodução assumiu o estado
      playing = ok;
      if (ok) disarmGestures();
      else armGestures();
    } else {
      stopHiddenSource();
      const el = getSiteAudio();
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
  // A fila pode estar tocando uma faixa do site (no <audio> OU via Web Audio).
  if (queue[queueIndex]?.kind === 'site') {
    getSiteAudio().pause();
    stopHiddenSource();
  }
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
    applyGain();
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

  // Início de treino (TREINAR / StartWorkout) → contexto de treino.
  window.addEventListener('academia:workout-started', () => {
    // v4.27 — pré-decodifica RESULT durante o treino (só toca na conclusão).
    void loadHiddenBuffer(SITE_TRACKS.result.src);
    startWorkoutContext();
  });

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
  if (isMusicEnabled()) {
    void playSite('main');
    // v4.27 — pré-decodifica Missões (faixa leve) em 2º plano: abrir o overlay
    // de Missões não espera o fetch + decode.
    void loadHiddenBuffer(SITE_TRACKS.missions.src);
  }
}

/** Pausa/retoma manual (mini-player da interface de Músicas). */
export function togglePlayback(): void {
  if (playing) {
    if (waSource) {
      // Faixa oculta (Web Audio): pausa preservando o ponto.
      pauseHidden();
    } else {
      const el =
        context === 'workout-user'
          ? queue[queueIndex]?.kind === 'site'
            ? getSiteAudio()
            : getUserAudio()
          : getSiteAudio();
      el.pause();
      try {
        ytPlayer?.pauseVideo();
      } catch {
        /* sem player */
      }
    }
    playing = false;
    disarmGestures();
    emitState();
  } else {
    resumeCurrent();
  }
}

export function getMusicState(): MusicState {
  const inUserQueue = context === 'workout-user' && queue.length > 0;
  return {
    context,
    playing,
    title,
    artist,
    queueIndex: inUserQueue ? queueIndex : -1,
    queueLength: inUserQueue ? queue.length : 0,
    canPrev: inUserQueue && queue.length > 1 && queueIndex > 0,
  };
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
