/**
 * FloatingMiniPlayer.tsx — miniplayer flutuante global (v4.20.0-music)
 *
 * Widget fixo sobre o app (inclusive DURANTE O TREINO), inspirado na
 * referência fixada (arte + título + controles).
 *
 * MODOS (Configurações → Áudio e Música):
 *  • Flexível (padrão) — pastilha ARRASTÁVEL com botão "×" (oculta até a
 *    próxima faixa). v4.24.0: usa o MESMO design do Fixo (unificação).
 *  • Fixo — pastilha MINIMIZADA fixa na posição escolhida, sempre visível ou
 *    só N segundos (padrão 7) após trocar de música. INALTERADO (v4.22.0).
 *
 * v4.24.0 — GAVETA (convive com Flexível/Fixo, que só definem a POSIÇÃO):
 *  • Barra accent na borda da tela (esquerda/direita conforme a âncora).
 *  • Deslizar a barra pra dentro (ou clicar) abre o player — mesmo visual do
 *    Fixo — ancorado à barra; no Flexível o painel fica livre após abrir.
 *  • Clicar fora do painel recolhe a gaveta.
 *
 * v4.25.x — POSIÇÃO da barra: no Flexível ela nasce na extremidade MAIS
 *  PRÓXIMA da última posição do player (lado + altura); no Fixo respeita a
 *  âncora completa (topo/base + esquerda/direita).
 *
 * Retroceder só aparece da 2ª música em diante (canPrev do audio-engine).
 *
 * Fica abaixo do MusicOverlay (z-index maior) e acima das telas comuns.
 */

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { getMusicState, nextTrack, prevTrack, togglePlayback, type MusicState } from './audio-engine';
import {
  getDrawerThickness,
  getDrawerVpHeight,
  getPlayerDrawer,
  getPlayerHideSecs,
  getPlayerMode,
  getPlayerPersist,
  getPlayerPos,
  PLAYER_PREFS_EVENT,
} from './player-prefs';
import './music.css';

const DRAWER_KEY = 'academia_floating_drawer_open_v1';

type Anchor = 'tl' | 'tc' | 'tr' | 'bl' | 'bc' | 'br';

/** Lado da barra da gaveta conforme a âncora (esquerda/direita da tela).
 *  v4.27 — tc/bc passaram a ser as âncoras VERTICALMENTE centradas à
 *  esquerda/direita (antes topo/base centro): tc → esquerda, bc → direita. */
function anchorSide(pos: Anchor): 'left' | 'right' {
  return pos === 'tr' || pos === 'bc' || pos === 'br' ? 'right' : 'left';
}

/** Posição da pastilha fixa a partir da âncora (padding igual ao contador). */
function pillStyleFor(pos: Anchor): Record<string, string> {
  switch (pos) {
    case 'tl':
      return { top: 'calc(85px + env(safe-area-inset-top, 0px))', left: '12px' };
    case 'tc':
      return { top: '50%', left: '12px', transform: 'translateY(-50%)' };
    case 'tr':
      return { top: 'calc(85px + env(safe-area-inset-top, 0px))', right: '12px' };
    case 'bl':
      return { bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))', left: '12px' };
    case 'bc':
      return { top: '50%', right: '12px', transform: 'translateY(-50%)' };
    default:
      return { bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))', right: '12px' };
  }
}

interface Pos { x: number; y: number }
const clampPos = (x: number, y: number): Pos => {
  const w = 240;
  const h = 46;
  return {
    x: Math.min(window.innerWidth - w - 8, Math.max(8, x)),
    y: Math.min(window.innerHeight - h - 8, Math.max(8, y)),
  };
};

/** Pastilha compacta compartilhada (Flexível / Fixo / painel da gaveta). */
function Pill({
  state,
  onDrag,
  onPrev,
  onClose,
}: {
  state: MusicState;
  onDrag?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPrev?: () => void;
  onClose?: () => void;
}) {
  const canPrev = state.canPrev;
  return (
    <>
      <div className="fmp__drag" onPointerDown={onDrag}>
        <div className="fmp__content">
          <span className="fmp__label">Tocando agora</span>
          <span className="fmp__title">{state.title}</span>
        </div>
      </div>
      <div className="fmp__controls">
        {canPrev && (
          <button type="button" className="fmp__btn" onClick={onPrev ?? prevTrack} aria-label="Retroceder">
            <SkipBack size={13} fill="currentColor" />
          </button>
        )}
        <button
          type="button"
          className="fmp__btn fmp__btn--play"
          onClick={togglePlayback}
          aria-label={state.playing ? 'Pausar' : 'Tocar'}
        >
          {state.playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
        </button>
        <button type="button" className="fmp__btn" onClick={nextTrack} aria-label="Avançar">
          <SkipForward size={13} fill="currentColor" />
        </button>
        {onClose && (
          <button type="button" className="fmp__close" onClick={onClose} aria-label="Ocultar reprodutor">
            <X size={13} />
          </button>
        )}
      </div>
    </>
  );
}

export function FloatingMiniPlayer() {
  const [state, setState] = useState<MusicState>(() => getMusicState());

  /* Prefs (derivadas no render; evento só pulsa re-render) */
  const [, setPrefsTick] = useState(0);
  const mode = getPlayerMode();
  const pos = getPlayerPos() as Anchor;
  const persist = getPlayerPersist();
  const hideSecs = getPlayerHideSecs();
  const drawerOn = getPlayerDrawer() === 'on';

  /* Modo Fixo: some Ns após troca (reset nos eventos, nunca no effect) */
  const [timedOut, setTimedOut] = useState(false);
  /* Flexível: posição arrastável persistida; "×" oculta até a próxima faixa */
  const [hidden, setHidden] = useState(false);
  const [dragPos, setDragPos] = useState<Pos | null>(() => {
    try {
      const raw = localStorage.getItem('academia_floating_player_pos_v1');
      if (!raw) return null;
      const p = JSON.parse(raw) as Partial<Pos>;
      if (typeof p.x !== 'number' || typeof p.y !== 'number') return null;
      return clampPos(p.x, p.y);
    } catch {
      return null;
    }
  });

  /* Gaveta: aberto/fechado + posição livre do painel expandido */
  const [drawerOpen, setDrawerOpen] = useState(() => {
    try { return localStorage.getItem(DRAWER_KEY) === '1'; } catch { return false; }
  });
  const [drawerPanelPos, setDrawerPanelPos] = useState<Pos | null>(null);
  /* v4.27 — ref espelhando o painel: o handler de clique-fora é registrado
     quando a gaveta abre e ficaria com drawerPanelPos obsoleto (null) no
     fechamento, então a barra nunca nascia na posição mais próxima. */
  const drawerPanelPosRef = useRef<Pos | null>(null);

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

  /* Persiste a posição arrastada do Flexível */
  useEffect(() => {
    if (!dragPos) return;
    try { localStorage.setItem('academia_floating_player_pos_v1', JSON.stringify(dragPos)); } catch { /* storage off */ }
  }, [dragPos]);

  /* v4.27 — mantém a ref do painel da gaveta em sincronia com o state
     (lida pelo clique-fora ao minimizar para lembrar a última posição). */
  useEffect(() => {
    drawerPanelPosRef.current = drawerPanelPos;
  }, [drawerPanelPos]);

  /* Volta a aparecer quando uma faixa nova começa */
  const lastTitle = useRef(state.title);
  useEffect(() => {
    if (state.title !== lastTitle.current) {
      lastTitle.current = state.title;
      setHidden(false);
      setTimedOut(false);
    }
  }, [state.title]);

  /* "timed": some N segundos após a última troca (Fixo, Flexível e Gaveta) */
  useEffect(() => {
    if (persist !== 'timed' || timedOut) return undefined;
    const t = window.setTimeout(() => setTimedOut(true), hideSecs * 1000);
    return () => window.clearTimeout(t);
  }, [mode, persist, hideSecs, timedOut, drawerOn, state.title, state.playing]);

  const setDrawer = (v: boolean) => {
    setDrawerOpen(v);
    if (!v) {
      /* v4.25.x — lembra onde o player estava ANTES de minimizar para a
         barra nascer na extremidade mais próxima dele.
         v4.27 — lê da REF (não do state capturado no registro do listener). */
      const last = drawerPanelPosRef.current;
      if (last) setDragPos(last);
      setDrawerPanelPos(null);
    }
    try { localStorage.setItem(DRAWER_KEY, v ? '1' : '0'); } catch { /* storage off */ }
  };

  /* Gaveta: clique fora do painel/barra recolhe */
  useEffect(() => {
    if (!drawerOn || !drawerOpen) return undefined;
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest('.fmp') || t.closest('.fmp-drawer-bar')) return;
      setDrawer(false);
    };
    window.addEventListener('pointerdown', onDown, true);
    return () => window.removeEventListener('pointerdown', onDown, true);
  }, [drawerOn, drawerOpen]);

  /* Arrasto da BARRA da gaveta (deslizar pra dentro abre).
     Listeners no window (não no el) — o pointer pode sair da barra estreita
     antes do threshold; sem setPointerCapture o el nunca receberia move/up. */
  const startBarDrag = (side: 'left' | 'right') => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();
    const start = e.clientX;
    const THRESHOLD = 36;
    let opened = false;
    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start;
      const inward = side === 'left' ? dx > 0 : dx < 0;
      if (!opened && inward && Math.abs(dx) >= THRESHOLD) {
        opened = true;
        setDrawer(true);
        cleanup();
      }
    };
    const onUp = () => { cleanup(); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  /* Arrasto do painel (Flexível livre / gaveta ancorada quando livre) */
  const startDrag = (setPos: (p: Pos) => void, orig: Pos) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    try { el.setPointerCapture(e.pointerId); } catch { /* sem captura */ }
    const sx = e.clientX;
    const sy = e.clientY;
    const cleanup = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
    const onMove = (ev: PointerEvent) => setPos(clampPos(orig.x + (ev.clientX - sx), orig.y + (ev.clientY - sy)));
    const onUp = () => cleanup();
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
  };

  /* Visibilidade base: "timed" (timedOut) oculta qualquer modo; Flexível
     ainda respeta o "×" (hidden). */
  const baseVisible = state.title !== '' || state.playing;
  const flexVisible = mode === 'flex' && !hidden && !timedOut;
  if (!baseVisible) return null;

  /* ─────────── GAVETA ligada: barra + (opcional) painel expandido ───────────
     A gaveta substitui a pastilha; ela usa a POSIÇÃO (pos) como âncora. */
  if (drawerOn) {
    /* "Só após tocar": barra e painel desaparecem juntos após N s. */
    if (timedOut && !drawerOpen) return null;
    const thickness = getDrawerThickness();
    const barH = Math.round((window.innerHeight * getDrawerVpHeight()) / 100);
    const inset = 16;

    /* v4.25.x — de onde a barra nasce:
       • Flexível: extremidade MAIS PRÓXIMA da última posição do player
         (dragPos — salva ao arrastar/soltar/minimizar) → alinha o LADO e a
         ALTURA com o player. Sem arrasto ainda → usa a âncora escolhida.
       • Fixo: respeita a âncora COMPLETA — 1ª letra (t/b) dá a altura
         (topo/base) e a 2ª (l/r) dá o lado (esquerda/direita). */
    let side: 'left' | 'right';
    let barTop: number;
    if (mode === 'flex' && dragPos) {
      side = dragPos.x + 120 <= window.innerWidth / 2 ? 'left' : 'right';
      barTop = Math.round(
        Math.min(
          window.innerHeight - barH - inset,
          Math.max(inset, dragPos.y + 23 - barH / 2),
        ),
      );
    } else if (mode === 'flex') {
      side = anchorSide(pos);
      barTop = Math.round((window.innerHeight - barH) / 2);
    } else {
      /* v4.27 — âncoras: tl/tr topo; tc (esquerda centro) e bc (direita
         centro) ficam verticalmente centradas; bl/br base. */
      const isTop = pos === 'tl' || pos === 'tr';
      const isMiddle = pos === 'tc' || pos === 'bc';
      side = anchorSide(pos);
      barTop = Math.round(
        isMiddle
          ? (window.innerHeight - barH) / 2
          : isTop
            ? inset
            : window.innerHeight - barH - inset,
      );
    }

    const anchored: Pos = drawerPanelPos ?? (side === 'left'
      ? { x: 16, y: barTop }
      : { x: window.innerWidth - 256, y: barTop });

    return (
      <>
        <div
          className={`fmp-drawer-bar fmp-drawer-bar--${side}`}
          style={{ width: thickness, height: barH, top: barTop }}
          role="button"
          tabIndex={0}
          aria-label="Abrir reprodutor"
          onPointerDown={startBarDrag(side)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDrawer(true); }}
        />
        {drawerOpen && (
          <div
            className={`fmp fmp--drawer${side === 'right' ? ' fmp--from-right' : ''}`}
            style={{ left: anchored.x, top: anchored.y }}
            role="region"
            aria-label="Reprodutor"
          >
            <Pill
              state={state}
              onDrag={mode === 'flex' ? startDrag(setDrawerPanelPos, anchored) : undefined}
            />
          </div>
        )}
      </>
    );
  }

  /* ─────────── SEM gaveta: Fixo (inalterado) | Flexível (pastilha arrastável) ─────────── */
  if (mode === 'fixed') {
    if (timedOut) return null;
    return (
      <div
        className="fmp fmp--fixed"
        style={pillStyleFor(pos)}
        role="region"
        aria-label="Reprodutor"
      >
        <Pill state={state} />
      </div>
    );
  }

  /* Posição inicial do Flexível quando ainda não foi arrastado: a âncora escolhida */
  const flexStart: Pos = dragPos ?? (() => {
    const anchor = pillStyleFor(pos);
    const x = anchor.right !== undefined ? window.innerWidth - 256 : 16;
    const y = anchor.top === '50%'
      ? Math.round(window.innerHeight / 2 - 23)
      : anchor.bottom !== undefined
        ? window.innerHeight - 150
        : 96;
    return clampPos(x, y);
  })();

  /* Flexível (padrão) */
  if (!flexVisible) return null;
  return (
    <div className="fmp" style={{ left: flexStart.x, top: flexStart.y }} role="region" aria-label="Reprodutor">
      <Pill state={state} onDrag={startDrag(setDragPos, flexStart)} onClose={() => setHidden(true)} />
    </div>
  );
}
