/**
 * FloatingMiniPlayer.tsx — miniplayer flutuante global (v4.20.0-music)
 *
 * Widget fixo sobre o app (inclusive DURANTE O TREINO), inspirado na
 * referência fixada (arte + título + controles):
 *  • arrastável  — segure na área da arte/título e mova;
 *  • redimensionável — puxe a alça do canto inferior direito;
 *  • retroceder / pausar / avançar — next/prev do audio-engine (fila da
 *    playlist ativa ou ciclo das faixas do site);
 *  • posição e tamanho persistem em localStorage;
 *  • "×" oculta até a próxima faixa começar.
 *
 * v4.22.0 — DOIS MODOS (Configurações → Áudio e Música):
 *  • Flexível (padrão) — o painel acima, inalterado;
 *  • Fixo — pastilha MINIMIZADA no estilo do contador de duração do treino
 *    (.global-timer), na posição escolhida nas prefs, sempre visível ou só
 *    N segundos (padrão 7, configurável) após trocar de música.
 *
 * Fica abaixo do MusicOverlay (z-index maior) e acima das telas comuns.
 */

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Music2, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { getMusicState, nextTrack, prevTrack, togglePlayback, type MusicState } from './audio-engine';
import {
  getPlayerHideSecs,
  getPlayerMode,
  getPlayerPersist,
  getPlayerPos,
  PLAYER_PREFS_EVENT,
} from './player-prefs';
import './music.css';

const STORE_KEY = 'academia_floating_player_rect_v1';

const MIN_W = 230;
const MAX_W = 520;
const MIN_H = 116;
const MAX_H = 300;
const EDGE = 8;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Encaixa o retângulo na viewport: limita largura/altura ao espaço disponível
 * e reposiciona x/y para o painel nunca sair da tela (também usado ao
 * redimensionar, para o crescimento empurrar o canto em vez de estourar).
 */
function fit(r: Rect): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = clamp(r.w, MIN_W, Math.max(MIN_W, Math.min(MAX_W, vw - 2 * EDGE)));
  const h = clamp(r.h, MIN_H, Math.max(MIN_H, Math.min(MAX_H, vh - 2 * EDGE)));
  return {
    w,
    h,
    x: clamp(r.x, EDGE, Math.max(EDGE, vw - w - EDGE)),
    y: clamp(r.y, EDGE, Math.max(EDGE, vh - h - EDGE)),
  };
}

function defaultRect(): Rect {
  const w = clamp(Math.round(window.innerWidth * 0.62), MIN_W, MAX_W);
  const h = 132;
  return fit({
    x: window.innerWidth - w - EDGE,
    y: window.innerHeight - h - 110,
    w,
    h,
  });
}

function loadRect(): Rect {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultRect();
    const p = JSON.parse(raw) as Partial<Rect>;
    if (typeof p.x !== 'number' || typeof p.y !== 'number' || typeof p.w !== 'number' || typeof p.h !== 'number') {
      return defaultRect();
    }
    return fit({ x: p.x, y: p.y, w: p.w, h: p.h });
  } catch {
    return defaultRect();
  }
}

export function FloatingMiniPlayer() {
  const [state, setState] = useState<MusicState>(() => getMusicState());
  const [rect, setRect] = useState<Rect>(() => loadRect());
  const [hidden, setHidden] = useState(false);

  /* v4.22.0 — modo/pos/visibilidade do player (prefs). Derivadas no render;
     o evento de prefs só pulsa o re-render (setPrefsTick). */
  const [, setPrefsTick] = useState(0);
  const mode = getPlayerMode();
  const pos = getPlayerPos();
  const persist = getPlayerPersist();
  const hideSecs = getPlayerHideSecs();
  const [timedOut, setTimedOut] = useState(false);

  /* Estado do motor */
  useEffect(() => {
    const onState = (e: Event) => setState((e as CustomEvent<MusicState>).detail);
    window.addEventListener('academia:music-state', onState);
    return () => window.removeEventListener('academia:music-state', onState);
  }, []);

  /* Prefs mudaram em Settings → re-leitura + reinício do contador */
  useEffect(() => {
    const onPrefs = () => {
      setPrefsTick((t) => t + 1);
      setTimedOut(false);
    };
    window.addEventListener(PLAYER_PREFS_EVENT, onPrefs);
    return () => window.removeEventListener(PLAYER_PREFS_EVENT, onPrefs);
  }, []);

  /* Volta a aparecer quando uma faixa nova começa */
  const lastTitle = useRef(state.title);
  useEffect(() => {
    if (state.title !== lastTitle.current) {
      lastTitle.current = state.title;
      setHidden(false);
      setTimedOut(false); // v4.22.0 — modo fixo "timed" reinicia o contador
    }
  }, [state.title]);

  /* v4.22.0 — modo fixo + "timed": some N segundos após a última troca.
     O reset (false) acontece nos EVENTOS (troca de faixa / prefs), nunca
     sincronizado dentro do effect (regra do lint). */
  useEffect(() => {
    if (mode !== 'fixed' || persist !== 'timed' || timedOut) return undefined;
    const t = window.setTimeout(() => setTimedOut(true), hideSecs * 1000);
    return () => window.clearTimeout(t);
  }, [mode, persist, hideSecs, timedOut, state.title, state.playing]);

  /* Mantém dentro da viewport ao girar/redimensionar a janela */
  useEffect(() => {
    const onResize = () => {
      setRect((r) => fit(r));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* Persiste posição/tamanho */
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(rect));
      } catch {
        /* storage indisponível — segue sem persistir */
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [rect]);

  const startDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    const el = e.currentTarget;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ponteiro pode já ter sido liberado — segue sem captura */
    }
    const sx = e.clientX;
    const sy = e.clientY;
    const orig = rect;
    const onMove = (ev: PointerEvent) => {
      setRect(() =>
        fit({
          ...orig,
          x: orig.x + (ev.clientX - sx),
          y: orig.y + (ev.clientY - sy),
        }),
      );
    };
    const onUp = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
  };

  const startResize = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ponteiro pode já ter sido liberado — segue sem captura */
    }
    const sx = e.clientX;
    const sy = e.clientY;
    const orig = rect;
    const onMove = (ev: PointerEvent) => {
      setRect(() =>
        fit({
          ...orig,
          w: orig.w + (ev.clientX - sx),
          h: orig.h + (ev.clientY - sy),
        }),
      );
    };
    const onUp = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
  };

  const visible = !hidden && (state.title !== '' || state.playing);
  if (!visible) return null;

  /* ── v4.22.0 — MODO FIXO: pastilha no estilo do contador de treino ── */
  if (mode === 'fixed') {
    if (timedOut) return null;
    return (
      <div
        className={`fmp-pill fmp-pill--${pos}`}
        role="region"
        aria-label="Reprodutor"
      >
        <div className="fmp-pill__icon">
          <Music2 size={16} />
        </div>
        <div className="fmp-pill__content">
          <span className="fmp-pill__label">Tocando agora</span>
          <span className="fmp-pill__title">{state.title}</span>
        </div>
        <div className="fmp-pill__controls">
          <button type="button" className="fmp-pill__btn" onClick={prevTrack} aria-label="Retroceder">
            <SkipBack size={13} fill="currentColor" />
          </button>
          <button
            type="button"
            className="fmp-pill__btn fmp-pill__btn--play"
            onClick={togglePlayback}
            aria-label={state.playing ? 'Pausar' : 'Tocar'}
          >
            {state.playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
          </button>
          <button type="button" className="fmp-pill__btn" onClick={nextTrack} aria-label="Avançar">
            <SkipForward size={13} fill="currentColor" />
          </button>
        </div>
      </div>
    );
  }

  /* ── Modo FLEXÍVEL (padrão, inalterado) ── */

  /* Escala visual derivada da altura (controles/arte crescem ao redimensionar) */
  const scale = clamp(rect.h / 150, 1, 1.6);
  const art = Math.round(46 * scale);
  const btn = Math.round(38 * scale);

  return (
    <div
      className="fmp"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
      role="region"
      aria-label="Reprodutor"
    >
      {/* Zona de arrasto: arte + título */}
      <div className="fmp__top" onPointerDown={startDrag}>
        <div className="fmp__art" style={{ width: art, height: art }}>
          <Music2 size={Math.round(art * 0.42)} />
        </div>
        <div className="fmp__meta">
          <span className="fmp__title">{state.title}</span>
          <span className="fmp__artist">{state.artist || 'Evo Fit'}</span>
        </div>
        <button
          type="button"
          className="fmp__close"
          aria-label="Ocultar reprodutor"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setHidden(true)}
        >
          <X size={Math.round(15 * scale)} />
        </button>
      </div>

      {/* Controles */}
      <div className="fmp__controls" style={{ gap: Math.round(16 * scale) }}>
        <button
          type="button"
          className="fmp__btn"
          style={{ width: btn, height: btn }}
          onClick={prevTrack}
          aria-label="Retroceder"
        >
          <SkipBack size={Math.round(19 * scale)} fill="currentColor" />
        </button>
        <button
          type="button"
          className="fmp__btn fmp__btn--play"
          style={{ width: btn, height: btn }}
          onClick={togglePlayback}
          aria-label={state.playing ? 'Pausar' : 'Tocar'}
        >
          {state.playing ? (
            <Pause size={Math.round(19 * scale)} fill="currentColor" />
          ) : (
            <Play size={Math.round(19 * scale)} fill="currentColor" />
          )}
        </button>
        <button
          type="button"
          className="fmp__btn"
          style={{ width: btn, height: btn }}
          onClick={nextTrack}
          aria-label="Avançar"
        >
          <SkipForward size={Math.round(19 * scale)} fill="currentColor" />
        </button>
      </div>

      {/* Alça de redimensionamento (canto inferior direito) */}
      <div className="fmp__grip" onPointerDown={startResize} aria-hidden="true" />
    </div>
  );
}
