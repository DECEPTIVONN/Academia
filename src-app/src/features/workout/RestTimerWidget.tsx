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
 *   • visuais radar / hourglass movidos pela fração restante (os mesmos
 *     componentes desenham as prévias da customização);
 *   • ao zerar: bipe + vibração + toast "Tempo de descanso encerrado!".
 *
 * O estilo vem de `localStorage.timerStyle` (radar é o padrão no legado).
 */

import React, { useEffect, useState } from 'react';
import { useWorkoutStore } from '@/store/workout-store';
import { TimerVisual, type TimerStyle } from './timer-visuals';

function readTimerStyle(): TimerStyle {
  try {
    const raw = localStorage.getItem('timerStyle');
    if (raw === 'hourglass') return raw;
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
        <TimerVisual style={style} pct={pct} />
      </div>
      <div className="rt-time" id="rtTime">
        {formatRest(remaining)}
      </div>
    </div>
  );
}

export default RestTimerWidget;
