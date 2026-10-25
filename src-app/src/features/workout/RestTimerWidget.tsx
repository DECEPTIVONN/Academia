/**
 * RestTimerWidget.tsx — Cronômetro flutuante de descanso (paridade legacy)
 *
 * Port fiel de `startRestTimer`/`updateTimerDisplay`/`stopRestTimer` de
 * Legacy/JS/treino/secao-ficha.js L572–750 e do markup de treino.html L1684–1691:
 *   • widget fixo (`.rest-timer`) visível globalmente, acima da Ficha (z 600) e
 *     abaixo dos modais (z 1000) — igual ao legado (z 990);
 *   • contagem regressiva de 1 s conduzida AQUI (um único intervalo), mesmo que
 *     a Ficha/Modo Foco estejam fechados;
 *   • clique no widget reinicia em 60 s; ✕ encerra sem bipe;
 *   • visuais radar / hourglass / cyber / arcade movidos pela fração restante;
 *   • ao zerar: bipe + vibração + toast "Tempo de descanso encerrado!".
 *
 * O estilo vem de `localStorage.timerStyle` (radar é o padrão no legado).
 */

import React, { useEffect, useState } from 'react';
import { useWorkoutStore } from '@/store/workout-store';

type TimerStyle = 'radar' | 'hourglass' | 'cyber' | 'arcade';

function readTimerStyle(): TimerStyle {
  try {
    const raw = localStorage.getItem('timerStyle');
    if (raw === 'hourglass' || raw === 'cyber' || raw === 'arcade') return raw;
  } catch {
    /* storage indisponível */
  }
  return 'radar';
}

function formatRest(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60)
    .toString()
    .padStart(2, '0');
  const s = (Math.max(0, seconds) % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ── Visuais (idênticos ao innerHTML do legado) ── */

function RadarVisual({ pct }: { pct: number }) {
  return (
    <div
      className="timer-radar"
      id="timerRadar"
      style={{ '--progress': `${pct}%` } as React.CSSProperties}
    >
      <div className="radar-crosshair ch-v" />
      <div className="radar-crosshair ch-h" />
      <div className="radar-fill" />
    </div>
  );
}

function HourglassVisual({ pct }: { pct: number }) {
  const drainTop = 100 - pct;
  return (
    <div className="timer-hourglass">
      <svg viewBox="0 0 100 120">
        <defs>
          <filter id="rt-red-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="rt-fluid-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        </defs>
        <line x1="5" y1="8" x2="95" y2="8" stroke="#ef4444" strokeWidth="2" filter="url(#rt-red-glow)" />
        <line x1="5" y1="112" x2="95" y2="112" stroke="#ef4444" strokeWidth="2" filter="url(#rt-red-glow)" />
        <polygon
          points="15,8 85,8 53,55 53,65 85,112 15,112 47,65 47,55"
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.5"
          filter="url(#rt-red-glow)"
        />
        <g style={{ clipPath: `inset(${drainTop}% 0 0 0)`, transition: 'clip-path 1s linear' }}>
          <polygon
            points="15,8 85,8 53,55 47,55"
            fill="url(#rt-fluid-grad)"
            opacity="0.9"
            filter="url(#rt-red-glow)"
          />
        </g>
        <g style={{ clipPath: `inset(${pct}% 0 0 0)`, transition: 'clip-path 1s linear' }}>
          <polygon
            points="53,65 85,112 15,112 47,65"
            fill="url(#rt-fluid-grad)"
            opacity="0.9"
            filter="url(#rt-red-glow)"
          />
        </g>
        <line x1="50" y1="55" x2="50" y2="112" stroke="#ef4444" strokeWidth="1" opacity="0.6" filter="url(#rt-red-glow)" />
      </svg>
    </div>
  );
}

function CyberVisual({ pct }: { pct: number }) {
  const dashoffset = 283 - 283 * (pct / 100);
  return (
    <div
      className="timer-cyber"
      style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg viewBox="0 0 100 100" style={{ width: '120%', height: '120%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="rt-cyber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <filter id="rt-cyber-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(6,182,212,0.2)" strokeWidth="2" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#rt-cyber-grad)"
          strokeWidth="4"
          strokeDasharray="283"
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s linear',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            filter: 'url(#rt-cyber-glow)',
          }}
        />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#7c3aed" strokeWidth="1" strokeDasharray="4 8" opacity="0.5" />
      </svg>
    </div>
  );
}

function ArcadeVisual({ pct }: { pct: number }) {
  const danger = pct < 25;
  return (
    <div
      className="timer-arcade"
      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px' }}
    >
      <div
        style={{
          width: '100%',
          height: 24,
          background: '#1e1e24',
          border: `3px solid ${danger ? '#ef4444' : '#facc15'}`,
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: danger ? '0 0 10px rgba(239,68,68,0.4)' : '0 0 10px rgba(250,204,21,0.3)',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: danger ? '#ef4444' : '#facc15',
            transition: 'width 1s linear, background-color 0.5s',
          }}
        />
      </div>
    </div>
  );
}

export function RestTimerWidget() {
  const isResting = useWorkoutStore((s) => s.isResting);
  const remaining = useWorkoutStore((s) => s.restTimeRemaining);
  const total = useWorkoutStore((s) => s.restTotalDuration);
  const runId = useWorkoutStore((s) => s.restRunId);
  const tickRestTimer = useWorkoutStore((s) => s.tickRestTimer);
  const startRestTimer = useWorkoutStore((s) => s.startRestTimer);
  const skipRestTimer = useWorkoutStore((s) => s.skipRestTimer);

  const [style, setStyle] = useState<TimerStyle>(readTimerStyle);

  /* Assinatura única de 1 s (legado: restTimerInterval). `runId` remonta o
     intervalo quando o descanso é reiniciado (clique no widget ou nova série). */
  useEffect(() => {
    if (!isResting) return undefined;
    const id = window.setInterval(() => tickRestTimer(), 1000);
    return () => window.clearInterval(id);
  }, [isResting, runId, tickRestTimer]);

  /* Relê o estilo quando as Configurações/customização mudam (evento + storage). */
  useEffect(() => {
    const sync = () => setStyle(readTimerStyle());
    document.addEventListener('academia:timer-style-changed', sync);
    document.addEventListener('academia:prefs-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      document.removeEventListener('academia:timer-style-changed', sync);
      document.removeEventListener('academia:prefs-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (!isResting) return null;

  const pct = total > 0 ? (remaining / total) * 100 : 0;

  return (
    <div
      className="rest-timer rt-running"
      id="restTimer"
      role="button"
      tabIndex={0}
      aria-label="Cronômetro de descanso — clique para reiniciar em 60 segundos"
      onClick={() => startRestTimer(60)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startRestTimer(60);
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <button
        type="button"
        className="rt-close"
        aria-label="Fechar Cronômetro"
        onClick={(e) => {
          e.stopPropagation();
          skipRestTimer();
        }}
      >
        ✕
      </button>
      <div className="rt-visuals" id="rtVisuals">
        {style === 'radar' && <RadarVisual pct={pct} />}
        {style === 'hourglass' && <HourglassVisual pct={pct} />}
        {style === 'cyber' && <CyberVisual pct={pct} />}
        {style === 'arcade' && <ArcadeVisual pct={pct} />}
      </div>
      <div className="rt-time" id="rtTime">
        {formatRest(remaining)}
      </div>
    </div>
  );
}

export default RestTimerWidget;
