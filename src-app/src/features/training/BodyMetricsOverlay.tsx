/**
 * BodyMetricsOverlay.tsx — Métricas corporais (+ Comparar métricas)
 *
 * Tela cheia aberta pela aba Progresso (card Corpo / header): registra peso,
 * gordura corporal e cintura, guarda as fotos de progresso (frente/lado/costas)
 * e compara duas datas por janela (7D…1Y).
 *
 * Dados em `features/training/body-metrics.ts` (banco local IndexedDB + evento
 * `academia:body-metrics-changed`, que o hook `useBodyMetrics()` escuta;
 * unidade exibida vem de `lib/app-prefs.ts`). Monta por
 * `createPortal(document.body)` — o `.section-strip` tem
 * `will-change: transform` e vira containing block do `position: fixed`.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ChevronRight,
  Info,
  LineChart,
  Plus,
  Settings2,
  X,
} from 'lucide-react';
import { useModalPresence } from '@/hooks/useModalPresence';
import { today } from '@/core/db/queries';
import { showToast } from '@/lib/toast';
import { fileToDataUrl } from '@/lib/image';
import {
  convertKgToDisplay,
  getWeightUnit,
  setWeightUnit,
  type WeightUnit,
} from '@/lib/app-prefs';
import {
  BODY_PHOTO_MAX_SIDE,
  COMPARE_RANGES,
  displayToKg,
  formatDelta,
  latestMeasurementDate,
  latestValues,
  metricUnitLabel,
  compareMetrics,
  removePhoto,
  setPhoto,
  upsertMeasurement,
  useBodyMetrics,
  type BodyMetricKey,
  type PhotoSlot,
} from './body-metrics';
import './metricas-corporais.css';

const toBody = (node: React.ReactNode) => createPortal(node, document.body);

type SheetId = 'add' | 'settings' | 'info';

interface BodyMetricsOverlayProps {
  open: boolean;
  onClose: () => void;
  /** Peso informado no onboarding — usado enquanto não houver medição. */
  initialWeightKg?: number | null;
}

/** "14 de out. de 2026" (pt-BR, mesma convenção das demais telas). */
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return dateStr;
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatMeasure(key: BodyMetricKey, value: number, unit: WeightUnit): string {
  const display = key === 'weightKg' ? convertKgToDisplay(value, unit) : value;
  return `${display.toFixed(1).replace('.', ',').replace(/,0$/, '')} ${metricUnitLabel(key, unit)}`;
}

export const BodyMetricsOverlay: React.FC<BodyMetricsOverlayProps> = ({
  open,
  onClose,
  initialWeightKg = null,
}) => {
  const { mounted, closing } = useModalPresence(open);
  const [screen, setScreen] = useState<'metrics' | 'compare'>('metrics');
  /* v4.56.4 — a troca métricas ⇄ comparar entra/sai com fade+slide (o conteúdo
     fica montado 180 ms na saída antes de trocar de tela). */
  const [screenLeaving, setScreenLeaving] = useState(false);
  const screenTimerRef = useRef<number | null>(null);
  const { metrics: state } = useBodyMetrics();
  const [unit, setUnit] = useState<WeightUnit>(() => getWeightUnit());
  const [rangeKey, setRangeKey] = useState('7d');
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [form, setForm] = useState({
    date: today(),
    weight: '',
    bodyFat: '',
    waist: '',
  });

  const fileRefs = useRef<Record<PhotoSlot, HTMLInputElement | null>>({
    front: null,
    side: null,
    back: null,
  });

  /* Sempre volta para a tela principal ao reabrir. */
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setScreen('metrics');
      setScreenLeaving(false);
      setSheet(null);
    }
  }

  useEffect(
    () => () => {
      if (screenTimerRef.current !== null) window.clearTimeout(screenTimerRef.current);
    },
    []
  );

  const openCompare = () => {
    if (screenTimerRef.current !== null) window.clearTimeout(screenTimerRef.current);
    screenTimerRef.current = null;
    setScreenLeaving(false);
    setScreen('compare');
  };

  const backToMetrics = () => {
    if (screenLeaving) return;
    setScreenLeaving(true);
    screenTimerRef.current = window.setTimeout(() => {
      screenTimerRef.current = null;
      setScreen('metrics');
      setScreenLeaving(false);
    }, 180);
  };

  useEffect(() => {
    const syncPrefs = () => setUnit(getWeightUnit());
    window.addEventListener('academia:prefs-changed', syncPrefs);
    return () => {
      window.removeEventListener('academia:prefs-changed', syncPrefs);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const latest = latestValues(state);
  const weightKg = latest.weightKg ?? initialWeightKg ?? null;
  const lastDate = latestMeasurementDate(state);
  const hasPhotos = Object.keys(state.photos).length > 0;

  const range = COMPARE_RANGES.find((r) => r.key === rangeKey) ?? COMPARE_RANGES[0];
  const comparison = useMemo(
    () => compareMetrics(state, range.days, today()),
    [state, range.days]
  );

  const pickPhoto = (slot: PhotoSlot) => fileRefs.current[slot]?.click();

  const handleFile = async (slot: PhotoSlot, file: File | null | undefined) => {
    if (!file) return;
    try {
      const url = await fileToDataUrl(file, { maxSide: BODY_PHOTO_MAX_SIDE });
      await setPhoto(slot, url, today());
      showToast('Foto de progresso atualizada');
    } catch {
      showToast('Não foi possível carregar essa imagem', 'error');
    }
  };

  const saveForm = () => {
    const parse = (v: string) => {
      const n = parseFloat(v.replace(',', '.'));
      return Number.isFinite(n) && n > 0 ? n : undefined;
    };
    const weight = parse(form.weight);
    const fat = parse(form.bodyFat);
    const waist = parse(form.waist);
    if (weight === undefined && fat === undefined && waist === undefined) {
      showToast('Informe ao menos uma medida', 'error');
      return;
    }
    void upsertMeasurement({
      date: form.date || today(),
      weightKg: weight !== undefined ? displayToKg(weight, unit) : undefined,
      bodyFat: fat,
      waistCm: waist,
    });
    setForm({ date: today(), weight: '', bodyFat: '', waist: '' });
    setSheet(null);
    showToast('Medidas registradas');
  };

  if (!mounted) return null;

  return toBody(
    <div
      className={`bm-root ${closing ? 'is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={screen === 'compare' ? 'Comparar métricas' : 'Métricas corporais'}
    >
      <header className="bm-head">
        <button
          type="button"
          className="bm-icon-btn"
          onClick={screen === 'compare' ? backToMetrics : onClose}
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="bm-head__title">
          {screen === 'compare' ? 'Comparar métricas' : 'Métricas corporais'}
        </h2>
        {screen === 'metrics' ? (
          <div className="bm-actions">
            <button
              type="button"
              className="bm-icon-btn"
              aria-label="Unidade de medida"
              onClick={() => setSheet('settings')}
            >
              <Settings2 size={17} />
            </button>
            <button
              type="button"
              className="bm-icon-btn"
              aria-label="Como registrar medidas"
              onClick={() => setSheet('info')}
            >
              <Info size={17} />
            </button>
            <button
              type="button"
              className="bm-icon-btn"
              aria-label="Adicionar medidas"
              onClick={() => setSheet('add')}
            >
              <Plus size={19} />
            </button>
          </div>
        ) : (
          <span className="bm-head__spacer" />
        )}
      </header>

      <div
        className={`bm-scroll ${screenLeaving ? 'is-leaving' : ''}`}
        key={screen}
        aria-busy={screenLeaving || undefined}
      >
        {screen === 'metrics' ? (
          <>
            {/* ── Peso ── */}
            <button
              type="button"
              className="bm-card bm-card--btn"
              onClick={() => setSheet('add')}
            >
              <span className="bm-card__label">Peso</span>
              <span className="bm-card__value">
                {weightKg !== null
                  ? `${convertKgToDisplay(weightKg, unit).toFixed(1).replace('.', ',')} ${unit}`
                  : '—'}
              </span>
              <span className="bm-card__meta">
                {lastDate
                  ? `Última medição: ${formatDate(lastDate)}`
                  : 'Toque para registrar seu peso'}
              </span>
            </button>

            {/* ── Fotos de progresso ── */}
            <div className="bm-card">
              <div className="bm-photos__head">
                <div>
                  <span className="bm-card__label">Fotos de progresso</span>
                  <p className="bm-photos__hint">
                    {hasPhotos
                      ? 'Toque para atualizar suas fotos'
                      : 'Toque para adicionar sua primeira foto'}
                  </p>
                </div>
                <ChevronRight size={16} className="bm-chev" aria-hidden="true" />
              </div>

              <div className="bm-photos__strip">
                {(
                  [
                    { key: 'front' as PhotoSlot, label: 'Frente' },
                    { key: 'side' as PhotoSlot, label: 'Lado' },
                    { key: 'back' as PhotoSlot, label: 'Costas' },
                  ] as const
                ).map((slot) => {
                  const photo = state.photos[slot.key];
                  return (
                    <div className="bm-photo" key={slot.key}>
                      <button
                        type="button"
                        className="bm-photo__frame"
                        onClick={() => pickPhoto(slot.key)}
                        aria-label={`Foto ${slot.label}`}
                      >
                        {photo ? (
                          <img className="bm-photo__img" src={photo.url} alt={`Foto ${slot.label}`} />
                        ) : (
                          <Camera size={20} aria-hidden="true" />
                        )}
                      </button>
                      {photo && (
                        <button
                          type="button"
                          className="bm-photo__remove"
                          aria-label={`Remover foto ${slot.label}`}
                          onClick={() => void removePhoto(slot.key)}
                        >
                          <X size={12} />
                        </button>
                      )}
                      <span className="bm-photo__label">{slot.label}</span>
                      <input
                        ref={(el) => {
                          fileRefs.current[slot.key] = el;
                        }}
                        className="bm-photo__input"
                        type="file"
                        accept="image/*"
                        aria-hidden="true"
                        tabIndex={-1}
                        onChange={(e) => {
                          void handleFile(slot.key, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Gordura / Cintura ── */}
            <div className="bm-grid2">
              <button type="button" className="bm-card bm-card--btn" onClick={() => setSheet('add')}>
                <span className="bm-card__label">Gordura corporal</span>
                <span className="bm-card__value bm-card__value--sm">
                  {latest.bodyFat !== undefined
                    ? `${String(latest.bodyFat).replace('.', ',')} ${metricUnitLabel('bodyFat', unit)}`
                    : '—'}
                </span>
              </button>
              <button type="button" className="bm-card bm-card--btn" onClick={() => setSheet('add')}>
                <span className="bm-card__label">Cintura</span>
                <span className="bm-card__value bm-card__value--sm">
                  {latest.waistCm !== undefined
                    ? `${String(latest.waistCm).replace('.', ',')} ${metricUnitLabel('waistCm', unit)}`
                    : '—'}
                </span>
              </button>
            </div>

            {/* ── Comparar métricas ── */}
            <button type="button" className="bm-compare" onClick={openCompare}>
              <span className="bm-compare__icon" aria-hidden="true">
                <LineChart size={18} />
              </span>
              <span className="bm-compare__body">
                <span className="bm-compare__title">Comparar métricas</span>
                <span className="bm-compare__desc">Veja as mudanças entre duas datas.</span>
              </span>
              <ChevronRight size={16} className="bm-chev" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <div className="bm-cmp__head">
              <span className="bm-cmp__eyebrow">A comparar</span>
              <span className="bm-cmp__dates">
                {formatDate(comparison.from)}
                <ArrowRight size={14} aria-hidden="true" />
                {formatDate(comparison.to)}
              </span>
            </div>

            <div className="bm-cmp__range">
              {COMPARE_RANGES.map((r) => (
                <button
                  type="button"
                  key={r.key}
                  className={`bm-cmp__tab ${r.key === rangeKey ? 'is-active' : ''}`}
                  onClick={() => setRangeKey(r.key)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {comparison.enough ? (
              <div className="bm-cmp__rows">
                {comparison.rows.map((row) => (
                  <div className="bm-cmp__row" key={row.key}>
                    <span className="bm-cmp__label">{row.label}</span>
                    <span className="bm-cmp__values">
                      <span>{row.from ? formatMeasure(row.key, row.from.value, unit) : '—'}</span>
                      <ArrowRight size={12} aria-hidden="true" />
                      <span>{row.to ? formatMeasure(row.key, row.to.value, unit) : '—'}</span>
                    </span>
                    <span
                      className={`bm-cmp__delta ${
                        row.delta === null || row.delta === 0
                          ? ''
                          : row.delta > 0
                            ? 'is-up'
                            : 'is-down'
                      }`}
                    >
                      {row.delta !== null ? formatDelta(row.key, row.delta, unit) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bm-cmp__empty">
                <strong>Ainda não há dados suficientes para comparar</strong>
                <span>Registre medidas em duas datas diferentes para as comparar.</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Folhas inferiores ── */}
      {sheet && (
        <div className="bm-sheet" onClick={() => setSheet(null)}>
          <div
            className="bm-sheet__panel"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="bm-sheet__bar" aria-hidden="true" />

            {sheet === 'add' && (
              <>
                <h3 className="bm-sheet__title">Registrar medidas</h3>
                <div className="bm-form">
                  <label className="bm-field">
                    <span>Data</span>
                    <input
                      type="date"
                      value={form.date}
                      max={today()}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </label>
                  <label className="bm-field">
                    <span>Peso ({unit})</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex: 75"
                      value={form.weight}
                      onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    />
                  </label>
                  <label className="bm-field">
                    <span>Gordura corporal (%)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex: 18"
                      value={form.bodyFat}
                      onChange={(e) => setForm({ ...form, bodyFat: e.target.value })}
                    />
                  </label>
                  <label className="bm-field">
                    <span>Cintura (cm)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex: 82"
                      value={form.waist}
                      onChange={(e) => setForm({ ...form, waist: e.target.value })}
                    />
                  </label>
                </div>
                <button type="button" className="bm-btn" onClick={saveForm}>
                  Salvar medidas
                </button>
              </>
            )}

            {sheet === 'settings' && (
              <>
                <h3 className="bm-sheet__title">Unidade de peso</h3>
                <p className="bm-sheet__text">
                  Vale para todo o app (medidas, carga dos exercícios e gráficos).
                </p>
                <div className="bm-seg">
                  {(['kg', 'lb'] as WeightUnit[]).map((u) => (
                    <button
                      type="button"
                      key={u}
                      className={`bm-seg__opt ${unit === u ? 'is-active' : ''}`}
                      onClick={() => {
                        setWeightUnit(u);
                        setUnit(u);
                      }}
                    >
                      {u.toUpperCase()}
                    </button>
                  ))}
                </div>
              </>
            )}

            {sheet === 'info' && (
              <>
                <h3 className="bm-sheet__title">Como usar</h3>
                <p className="bm-sheet__text">
                  Registre peso, gordura corporal e cintura com o botão <strong>+</strong>. Uma
                  medição por dia — registrar de novo no mesmo dia atualiza os valores.
                </p>
                <p className="bm-sheet__text">
                  As fotos de progresso ficam salvas no seu banco local e entram na
                  sincronização da conta (reduzidas para economizar espaço). Use{' '}
                  <strong>Comparar métricas</strong> para ver a diferença entre duas datas.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BodyMetricsOverlay;
