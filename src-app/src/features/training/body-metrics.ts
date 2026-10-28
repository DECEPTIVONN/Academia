/**
 * body-metrics.ts — métricas corporais (peso, gordura, cintura e fotos)
 *
 * Persistência local (offline-first) em `localStorage`, na mesma linha de
 * `lib/app-prefs.ts`: leitura síncrona no primeiro render, gravação disparando
 * `academia:body-metrics-changed` para as telas se atualizarem sem prop drilling.
 *
 * Regras de dados adotadas (ver CHANGELOG):
 *   • peso é SEMPRE guardado em kg (a unidade exibida vem de `getWeightUnit()`);
 *   • uma medição por dia — registrar de novo no mesmo dia faz merge;
 *   • fotos de progresso são reduzidas a 720 px no lado maior (JPEG) antes de
 *     serem gravadas, para não estourar a cota do armazenamento.
 */

import type { WeightUnit } from '@/lib/app-prefs';
import { convertKgToDisplay } from '@/lib/app-prefs';

export type PhotoSlot = 'front' | 'side' | 'back';

export const PHOTO_SLOTS: { key: PhotoSlot; label: string }[] = [
  { key: 'front', label: 'Frente' },
  { key: 'side', label: 'Lado' },
  { key: 'back', label: 'Costas' },
];

export interface BodyMeasurement {
  date: string;
  weightKg?: number;
  bodyFat?: number;
  waistCm?: number;
}

export interface BodyPhoto {
  url: string;
  date: string;
}

export interface BodyMetricsState {
  measurements: BodyMeasurement[];
  photos: Partial<Record<PhotoSlot, BodyPhoto>>;
}

export type BodyMetricKey = 'weightKg' | 'bodyFat' | 'waistCm';

export const BODY_METRIC_LABELS: Record<BodyMetricKey, string> = {
  weightKg: 'Peso',
  bodyFat: 'Gordura corporal',
  waistCm: 'Cintura',
};

const STORAGE_KEY = 'academia_body_metrics_v1';

export const BODY_METRICS_EVENT = 'academia:body-metrics-changed';

export const EMPTY_BODY_METRICS: BodyMetricsState = { measurements: [], photos: {} };

let memoryFallback: BodyMetricsState | null = null;

function parseNumber(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function sanitize(raw: unknown): BodyMetricsState {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_BODY_METRICS };
  const source = raw as Partial<BodyMetricsState>;
  const measurements: BodyMeasurement[] = [];

  for (const item of source.measurements ?? []) {
    if (!item || typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) continue;
    const entry: BodyMeasurement = { date: item.date };
    const weight = parseNumber(item.weightKg);
    const fat = parseNumber(item.bodyFat);
    const waist = parseNumber(item.waistCm);
    if (weight !== undefined) entry.weightKg = weight;
    if (fat !== undefined) entry.bodyFat = fat;
    if (waist !== undefined) entry.waistCm = waist;
    if (entry.weightKg === undefined && entry.bodyFat === undefined && entry.waistCm === undefined) {
      continue;
    }
    measurements.push(entry);
  }
  measurements.sort((a, b) => a.date.localeCompare(b.date));

  const photos: Partial<Record<PhotoSlot, BodyPhoto>> = {};
  for (const slot of PHOTO_SLOTS) {
    const photo = source.photos?.[slot.key];
    if (photo && typeof photo.url === 'string' && photo.url) {
      photos[slot.key] = { url: photo.url, date: typeof photo.date === 'string' ? photo.date : '' };
    }
  }

  return { measurements, photos };
}

export function getBodyMetrics(): BodyMetricsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_BODY_METRICS, photos: {} };
    return sanitize(JSON.parse(raw));
  } catch {
    return memoryFallback ? sanitize(memoryFallback) : { ...EMPTY_BODY_METRICS, photos: {} };
  }
}

export function saveBodyMetrics(next: BodyMetricsState): BodyMetricsState {
  const clean = sanitize(next);
  memoryFallback = clean;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch {
    /* cota/armazenamento indisponível — segue em memória na sessão */
  }
  try {
    window.dispatchEvent(new CustomEvent(BODY_METRICS_EVENT));
  } catch {
    /* SSR/testes */
  }
  return clean;
}

/** Registra (ou completa) a medição de uma data — merge por dia. */
export function upsertMeasurement(input: BodyMeasurement): BodyMetricsState {
  const state = getBodyMetrics();
  const entry: BodyMeasurement = { date: input.date };
  const weight = parseNumber(input.weightKg);
  const fat = parseNumber(input.bodyFat);
  const waist = parseNumber(input.waistCm);
  if (weight !== undefined) entry.weightKg = weight;
  if (fat !== undefined) entry.bodyFat = fat;
  if (waist !== undefined) entry.waistCm = waist;

  const others = state.measurements.filter((m) => m.date !== entry.date);
  const existing = state.measurements.find((m) => m.date === entry.date);
  const merged: BodyMeasurement = { ...existing, ...entry };
  return saveBodyMetrics({
    measurements: [...others, merged].sort((a, b) => a.date.localeCompare(b.date)),
    photos: state.photos,
  });
}

export function setPhoto(slot: PhotoSlot, url: string, date: string): BodyMetricsState {
  const state = getBodyMetrics();
  return saveBodyMetrics({ ...state, photos: { ...state.photos, [slot]: { url, date } } });
}

export function removePhoto(slot: PhotoSlot): BodyMetricsState {
  const state = getBodyMetrics();
  const photos = { ...state.photos };
  delete photos[slot];
  return saveBodyMetrics({ ...state, photos });
}

/* ── Leituras derivadas ── */

/** Valor mais recente de cada métrica (independente da data ser a mesma). */
export function latestValues(state: BodyMetricsState): Partial<Record<BodyMetricKey, number>> {
  const out: Partial<Record<BodyMetricKey, number>> = {};
  for (const m of state.measurements) {
    if (m.weightKg !== undefined) out.weightKg = m.weightKg;
    if (m.bodyFat !== undefined) out.bodyFat = m.bodyFat;
    if (m.waistCm !== undefined) out.waistCm = m.waistCm;
  }
  return out;
}

/** Data da medição mais recente que trouxe alguma métrica. */
export function latestMeasurementDate(state: BodyMetricsState): string | null {
  return state.measurements.length > 0 ? state.measurements[state.measurements.length - 1].date : null;
}

/** Medição mais recente de uma métrica até a data limite (inclusive). */
export function valueAtOrBefore(
  state: BodyMetricsState,
  key: BodyMetricKey,
  date: string
): { date: string; value: number } | null {
  let found: { date: string; value: number } | null = null;
  for (const m of state.measurements) {
    if (m.date > date) break;
    const value = m[key];
    if (value !== undefined) found = { date: m.date, value };
  }
  return found;
}

/** Medição mais recente (qualquer data) de uma métrica. */
export function valueAtOrAfter(
  state: BodyMetricsState,
  key: BodyMetricKey,
  date: string
): { date: string; value: number } | null {
  for (const m of state.measurements) {
    const value = m[key];
    if (m.date >= date && value !== undefined) return { date: m.date, value };
  }
  return null;
}

/* ── Comparação entre datas ── */

export interface CompareRange {
  key: string;
  label: string;
  days: number;
}

export const COMPARE_RANGES: CompareRange[] = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
  { key: '6m', label: '6M', days: 182 },
  { key: '1y', label: '1Y', days: 365 },
];

export interface CompareRow {
  key: BodyMetricKey;
  label: string;
  from: { date: string; value: number } | null;
  to: { date: string; value: number } | null;
  /** Diferença (`to - from`); `null` quando falta uma das pontas. */
  delta: number | null;
}

export interface CompareResult {
  from: string;
  to: string;
  rows: CompareRow[];
  /** Há pelo menos uma métrica medida em DUAS datas distintas? */
  enough: boolean;
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

/**
 * Compara as métricas de duas datas: `to` = hoje, `from` = hoje − janela.
 * Cada ponta é a medição mais próxima daquela data (a mais recente até `from`,
 * a mais recente até `to`).
 */
export function compareMetrics(
  state: BodyMetricsState,
  days: number,
  todayStr: string
): CompareResult {
  const to = todayStr;
  const from = shiftDate(todayStr, days);
  const rows: CompareRow[] = (Object.keys(BODY_METRIC_LABELS) as BodyMetricKey[]).map((key) => {
    const a = valueAtOrBefore(state, key, from);
    const b = valueAtOrBefore(state, key, to);
    const delta = a && b ? b.value - a.value : null;
    return { key, label: BODY_METRIC_LABELS[key], from: a, to: b, delta };
  });

  const enough = rows.some(
    (r) => r.from && r.to && r.from.date !== r.to.date && r.delta !== null
  );
  return { from, to, rows, enough };
}

/* ── Unidades de exibição ── */

/** Fator kg→lb (mesmo de `lib/app-prefs.ts`). */
const KG_TO_LB = 2.2046226218;

/** Converte o valor digitado (na unidade escolhida) de volta para kg. */
export function displayToKg(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value / KG_TO_LB : value;
}

/** Valor de exibição de uma métrica na unidade escolhida. */
export function displayValue(key: BodyMetricKey, value: number, unit: WeightUnit): number {
  return key === 'weightKg' ? convertKgToDisplay(value, unit) : value;
}

export function metricUnitLabel(key: BodyMetricKey, unit: WeightUnit): string {
  if (key === 'weightKg') return unit;
  return key === 'bodyFat' ? '%' : 'cm';
}

/** Texto curto de uma variação ("+1,2 kg", "−0,8 %"). */
export function formatDelta(
  key: BodyMetricKey,
  delta: number,
  unit: WeightUnit,
  digits = 1
): string {
  const value = key === 'weightKg' ? convertKgToDisplay(delta, unit) : delta;
  const abs = Math.abs(value).toFixed(digits).replace('.', ',');
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${abs} ${metricUnitLabel(key, unit)}`;
}

/* ── Fotos ── */

/**
 * Lê o arquivo escolhido e devolve um data URL JPEG reduzido (720 px no lado
 * maior por padrão) — mesma abordagem das fotos de exercício do app, mas com
 * limite de resolução para caber no armazenamento local.
 */
export function fileToPhotoDataUrl(
  file: File,
  maxSide = 720,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('sem DOM'));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas 2d indisponível');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('imagem inválida'));
    };
    img.src = objectUrl;
  });
}
