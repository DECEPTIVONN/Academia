/**
 * timer-visuals.tsx — Visuais do cronômetro de descanso (compartilhados).
 *
 * Os mesmos componentes desenham o cronômetro flutuante (`RestTimerWidget`) e
 * as prévias da sub-aba Emotes, para que a prévia seja idêntica ao timer real.
 * `pct` é a fração RESTANTE (1 = cheio, 0 = encerrado).
 */

import React from 'react';

export type TimerStyle = 'radar' | 'hourglass';

interface VisualProps {
  /** Fração restante, 0–100. */
  pct: number;
  /** Prefixo dos ids de SVG (evita colisão entre widget e prévia). */
  idPrefix?: string;
}

export function RadarVisual({ pct }: VisualProps) {
  return (
    <div
      className="timer-radar"
      style={{ '--progress': `${pct}%` } as React.CSSProperties}
    >
      <div className="radar-crosshair ch-v" />
      <div className="radar-crosshair ch-h" />
      <div className="radar-fill" />
    </div>
  );
}

export function HourglassVisual({ pct, idPrefix = 'rt' }: VisualProps) {
  const drainTop = 100 - pct;
  const glowId = `${idPrefix}-red-glow`;
  const fluidId = `${idPrefix}-fluid-grad`;
  return (
    <div className="timer-hourglass">
      <svg viewBox="0 0 100 120">
        <defs>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id={fluidId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        </defs>
        <line x1="5" y1="8" x2="95" y2="8" stroke="#ef4444" strokeWidth="2" filter={`url(#${glowId})`} />
        <line x1="5" y1="112" x2="95" y2="112" stroke="#ef4444" strokeWidth="2" filter={`url(#${glowId})`} />
        <polygon
          points="15,8 85,8 53,55 53,65 85,112 15,112 47,65 47,55"
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.5"
          filter={`url(#${glowId})`}
        />
        <g style={{ clipPath: `inset(${drainTop}% 0 0 0)`, transition: 'clip-path 1s linear' }}>
          <polygon
            points="15,8 85,8 53,55 47,55"
            fill={`url(#${fluidId})`}
            opacity="0.9"
            filter={`url(#${glowId})`}
          />
        </g>
        <g style={{ clipPath: `inset(${pct}% 0 0 0)`, transition: 'clip-path 1s linear' }}>
          <polygon
            points="53,65 85,112 15,112 47,65"
            fill={`url(#${fluidId})`}
            opacity="0.9"
            filter={`url(#${glowId})`}
          />
        </g>
        <line x1="50" y1="55" x2="50" y2="112" stroke="#ef4444" strokeWidth="1" opacity="0.6" filter={`url(#${glowId})`} />
      </svg>
    </div>
  );
}

export function TimerVisual({ style, pct, idPrefix }: VisualProps & { style: TimerStyle }) {
  if (style === 'hourglass') return <HourglassVisual pct={pct} idPrefix={idPrefix} />;
  return <RadarVisual pct={pct} idPrefix={idPrefix} />;
}
