/**
 * TrendRadarOverlay.tsx — "Tendências de Treino" (nova interface do card
 * Treinos, nas Tendências da aba Progresso).
 *
 * Mostra o Radar Fit em tela cheia com o alternador de período em formato de
 * segmented control (Semana / Mês / Ano / Todo o período), como na referência
 * visual enviada, além do resumo Treinos · Séries · Volume do recorte.
 *
 * O Radar Fit em si NÃO muda: o SVG continua saindo de `buildRadarSvgHtml`
 * (features/gamification/radar.ts) com as mesmas fórmulas de
 * `computeRadarStats` — só o recorte de histórico do período escolhido muda.
 */

import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import { useLocalData } from '@/hooks/useLocalData';
import { today, type LocalData } from '@/core/db/queries';
import { getWeightUnit } from '@/lib/app-prefs';
import { computeRadarStats, buildRadarSvgHtml } from '@/features/gamification/radar';
import {
  addDays,
  formatVolume,
  keysOfDay,
  seriesOfDay,
  volumeOfDay,
  type ExerciseMap,
  type SheetMap,
} from './progress-stats';
import './trend-radar.css';

export type TrendRadarPeriod = 'week' | 'month' | 'year' | 'all';

interface TrendRadarOverlayProps {
  open: boolean;
  onClose: () => void;
}

const PERIODS: Array<{ id: TrendRadarPeriod; label: string; days: number | null }> = [
  { id: 'week', label: 'Semana', days: 7 },
  { id: 'month', label: 'Mês', days: 30 },
  { id: 'year', label: 'Ano', days: 365 },
  { id: 'all', label: 'Todo o período', days: null },
];

export const TrendRadarOverlay: React.FC<TrendRadarOverlayProps> = ({ open, onClose }) => {
  const localData = useLocalData();
  const [period, setPeriod] = React.useState<TrendRadarPeriod>('month');

  /* Esc fecha; body travado enquanto a tela está aberta. */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const view = useMemo(() => {
    const t = today();
    const config = PERIODS.find((p) => p.id === period) ?? PERIODS[1];
    const startDate = config.days ? addDays(t, -(config.days - 1)) : null;
    const rows = startDate
      ? localData.history.filter((h) => h.date >= startDate && h.date <= t)
      : localData.history;

    const exMap: ExerciseMap = new Map(localData.exercises.map((ex) => [ex.id, ex]));
    const sheetMap: SheetMap = new Map(localData.sheets.map((s) => [s.sheetKey, s]));

    let treinos = 0;
    let series = 0;
    let volume = 0;
    for (const row of rows) {
      treinos += keysOfDay(row).length;
      series += seriesOfDay(row, exMap, sheetMap);
      volume += volumeOfDay(row, exMap, sheetMap);
    }

    /* Mês usa o modo 'mensal' original (últimos 30 treinos concluídos); os
       demais recortes usam o modo 'total' sobre o histórico filtrado, sem
       tocar nas fórmulas do Radar Fit. */
    const radarData: LocalData =
      period === 'month' || period === 'all' ? localData : { ...localData, history: rows };
    const stats = computeRadarStats(radarData, period === 'month' ? 'mensal' : 'total');
    const html = buildRadarSvgHtml(stats, localData.legacy?.radarTier ?? 1, 'trendRadarGrad');

    return { treinos, series, volume, html, unit: getWeightUnit() };
  }, [localData, period]);

  if (!open) return null;

  return createPortal(
    <div
      className="tr-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="tr-panel">
        <header className="tr-head">
          <button type="button" className="tr-back" onClick={onClose} aria-label="Voltar">
            <ArrowLeft size={22} strokeWidth={2.4} />
          </button>
          <h2 className="tr-title" id="trTitle">
            Tendências de Treino
          </h2>
          <span className="tr-head__spacer" aria-hidden="true" />
        </header>

        <div className="tr-body">
          <p className="tr-desc">
            As tendências estarão disponíveis 2 semanas após seu primeiro treino.
          </p>

          <h3 className="tr-subtitle">Distribuição Muscular</h3>

          <div className="tr-seg" role="tablist" aria-label="Período das tendências">
            {PERIODS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={period === item.id}
                className={`tr-seg__btn ${period === item.id ? 'is-active' : ''}`}
                onClick={() => setPeriod(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="tr-stats">
            <div className="tr-stat">
              <span className="tr-stat__label">Treinos</span>
              <span className="tr-stat__value">{view.treinos}</span>
            </div>
            <div className="tr-stat">
              <span className="tr-stat__label">Séries</span>
              <span className="tr-stat__value">{view.series}</span>
            </div>
            <div className="tr-stat">
              <span className="tr-stat__label">Volume</span>
              <span className="tr-stat__value">{formatVolume(view.volume, view.unit)}</span>
            </div>
          </div>

          <div className="tr-radar" dangerouslySetInnerHTML={{ __html: view.html }} />

          <p className="tr-foot">
            As tendências estarão disponíveis 2 semanas após seu primeiro treino.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};
