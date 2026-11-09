/**
 * EvolucaoCargaPanel.tsx — Aba "Evolução de Força (Carga)" do detalhe do exercício.
 *
 * v4.73.0 — mesmo padrão visual dos Detalhes de Volume da aba Progresso:
 * cards de resumo (atual / recorde / variação), gráfico de linha em SVG
 * (`buildVolumeLineChartSvg`) e histórico em lista com barras. Quando ainda
 * não há nenhuma carga, mostra o campo para registrar a primeira sem sair
 * do detalhe.
 */

import React, { useMemo, useState } from 'react';
import type { Exercise } from '@/core/db/schema';
import { buildVolumeLineChartSvg } from '@/features/training/volume-line-chart';

interface EvolucaoCargaPanelProps {
  exercise: Exercise | null;
  /** Carga sugerida (sem unidade) usada como placeholder. */
  sugestaoNum: string;
  onSaveLoad?: (ex: Exercise, carga: string) => void | Promise<void>;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

export const EvolucaoCargaPanel: React.FC<EvolucaoCargaPanelProps> = ({
  exercise,
  sugestaoNum,
  onSaveLoad,
}) => {
  /* Lista estável: o fallback `[]` criado a cada render invalidaria as memos. */
  const hist = useMemo(() => exercise?.historicoCargas ?? [], [exercise]);
  const [loadDraft, setLoadDraft] = useState('');
  const [savingLoad, setSavingLoad] = useState(false);

  const stats = useMemo(() => {
    if (hist.length === 0) return null;
    const first = hist[0];
    const last = hist[hist.length - 1];
    const peak = hist.reduce((best, h) => (h.valor > best.valor ? h : best), hist[0]);
    const variation =
      first.valor > 0 ? Math.round(((last.valor - first.valor) / first.valor) * 100) : null;
    return { first, last, peak, variation };
  }, [hist]);

  const chartHtml = useMemo(
    () =>
      buildVolumeLineChartSvg(
        hist.map((h) => ({ data: h.data, valor: h.valor })),
        460,
        150
      ),
    [hist]
  );

  const rows = useMemo(
    () =>
      hist
        .map((h, i) => ({
          ...h,
          i,
          delta: i > 0 ? h.valor - hist[i - 1].valor : null,
        }))
        .reverse(),
    [hist]
  );

  const handleSaveLoad = async () => {
    if (!exercise || !onSaveLoad) return;
    const value = loadDraft.trim();
    if (!value) return;
    setSavingLoad(true);
    try {
      await onSaveLoad(exercise, `${value} kg`);
      setLoadDraft('');
    } finally {
      setSavingLoad(false);
    }
  };

  if (!stats) {
    return (
      <div className="exevo exevo--empty">
        <div className="exevo__head">
          <div>
            <span className="exevo__eyebrow">Progressão de carga</span>
            <h4 className="exevo__title">Evolução de Força</h4>
          </div>
          <span className="exevo__badge">Sem registros</span>
        </div>

        <div className="exevo__empty-card">
          <span className="exevo__empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m7 15 4-5 3 3 5-6" />
            </svg>
          </span>
          <div>
            <strong className="exevo__empty-title">Nenhuma carga registrada ainda</strong>
            <p className="exevo__empty-text">
              Registre a carga da sua primeira série para começar a acompanhar a evolução.
            </p>
          </div>
        </div>

        {exercise && onSaveLoad && (
          <form
            className="exevo__form"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSaveLoad();
            }}
          >
            <label htmlFor="detalhesCarga" className="exevo__form-label">
              Carga
            </label>
            <div className="exevo__form-row">
              <div className="exevo__input-wrap">
                <input
                  id="detalhesCarga"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={sugestaoNum ? `Sugerido: ${sugestaoNum}` : 'Ex: 40'}
                  value={loadDraft}
                  onChange={(e) => setLoadDraft(e.target.value.replace(/[^\d.,]/g, ''))}
                  className="exevo__input"
                />
                <span className="exevo__input-unit">kg</span>
              </div>
              <button
                type="submit"
                disabled={!loadDraft.trim() || savingLoad}
                className="exevo__save"
              >
                {savingLoad ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  const variationUp = stats.variation !== null && stats.variation > 0;
  const variationDown = stats.variation !== null && stats.variation < 0;

  return (
    <div className="exevo">
      <div className="exevo__head">
        <div>
          <span className="exevo__eyebrow">Progressão de carga</span>
          <h4 className="exevo__title">Evolução de Força</h4>
        </div>
        <span className="exevo__badge">
          {hist.length} {hist.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      <div className="exevo__stats">
        <div className="exevo__stat">
          <span className="exevo__stat-label">Carga atual</span>
          <span className="exevo__stat-value">{stats.last.label}</span>
        </div>
        <div className="exevo__stat">
          <span className="exevo__stat-label">Recorde</span>
          <span className="exevo__stat-value exevo__stat-value--peak">{stats.peak.label}</span>
        </div>
        <div className="exevo__stat">
          <span className="exevo__stat-label">Variação</span>
          <span
            className={`exevo__stat-value exevo__stat-value--trend${
              variationUp ? ' is-up' : variationDown ? ' is-down' : ''
            }`}
          >
            {stats.variation === null ? '—' : `${stats.variation > 0 ? '+' : ''}${stats.variation}%`}
          </span>
        </div>
      </div>

      <section className="exevo__chart-card">
        <div className="exevo__chart-head">
          <span className="exevo__chart-title">Histórico de carga</span>
          <span className="exevo__avg">
            Máx. {stats.peak.label}
          </span>
        </div>
        <div className="exevo__chart" dangerouslySetInnerHTML={{ __html: chartHtml }} />
      </section>

      <div className="exevo__list">
        {rows.map((row) => {
          const pct = stats.peak.valor > 0 ? Math.round((row.valor / stats.peak.valor) * 100) : 0;
          const deltaUp = row.delta !== null && row.delta > 0;
          const deltaDown = row.delta !== null && row.delta < 0;
          return (
            <div className="exevo__row" key={`${row.data}-${row.i}`}>
              <span className="exevo__row-date">{formatDate(row.data)}</span>
              <span className="exevo__row-bar" aria-hidden="true">
                <span className="exevo__row-fill" style={{ width: `${pct}%` }} />
              </span>
              <span className="exevo__row-load">{row.label}</span>
              {row.delta !== null && row.delta !== 0 ? (
                <span
                  className={`exevo__row-delta${deltaUp ? ' is-up' : deltaDown ? ' is-down' : ''}`}
                >
                  {row.delta > 0 ? '+' : ''}
                  {row.delta} kg
                </span>
              ) : (
                <span className="exevo__row-delta is-flat">inicial</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EvolucaoCargaPanel;
