/**
 * body-metrics.ts — métricas corporais (peso, gordura, cintura e fotos)
 *
 * Persistência no BANCO local (IndexedDB/Dexie: tabelas `bodyMeasurements` e
 * `bodyPhotos`, schema v4) — as telas leem pelo hook `useBodyMetrics()` e as
 * gravações disparam `academia:body-metrics-changed`, que recarrega o hook e
 * entra no snapshot de sync (`core/sync/sync-manager.ts`). O dado antigo em
 * `localStorage.academia_body_metrics_v1` é migrado na primeira leitura.
 *
 * Regras de dados adotadas (ver CHANGELOG):
 *   • peso é SEMPRE guardado em kg (a unidade exibida vem de `getWeightUnit()`);
 *   • uma medição por dia — registrar de novo no mesmo dia faz merge;
 *   • fotos de progresso são reduzidas a 720 px no lado maior (JPEG — helper
 *     `lib/image.ts`) antes de serem gravadas, para manter o banco e o
 *     snapshot de sincronização num tamanho aceitável.
 */

import { useEffect, useState } from 'react';
import { idb } from '@/core/db/idb';
import type { BodyMeasurement, BodyPhoto, BodyPhotoSlot } from '@/core/db/schema';
import type { WeightUnit } from '@/lib/app-prefs';
import { convertKgToDisplay } from '@/lib/app-prefs';

export type { BodyMeasurement, BodyPhoto };
export type PhotoSlot = BodyPhotoSlot;

export const PHOTO_SLOTS: { key: PhotoSlot; label: string }[] = [
  { key: 'front', label: 'Frente' },
  { key: 'side', label: 'Lado' },
  { key: 'back', label: 'Costas' },
];

export interface BodyMetricsState {
  measurements: BodyMeasurement[];
  photos: Partial<Record<BodyPhotoSlot, BodyPhoto>>;
}

/** Limite de resolução das fotos de progresso gravadas no banco. */
export const BODY_PHOTO_MAX_SIDE = 720;

export type BodyMetricKey = 'weightKg' | 'bodyFat' | 'waistCm';

export const BODY_METRIC_LABELS: Record<BodyMetricKey, string> = {
  weightKg: 'Peso',
  bodyFat: 'Gordura corporal',
  waistCm: 'Cintura',
};

/** Chave antiga (localStorage) — lida uma vez na migração para o banco. */
const LEGACY_STORAGE_KEY = 'academia_body_metrics_v1';

export const BODY_METRICS_EVENT = 'academia:body-metrics-changed';

export const EMPTY_BODY_METRICS: BodyMetricsState = { measurements: [], photos: {} };

function parseNumber(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Normaliza/organiza o estado (datas válidas, uma entrada por dia, sem lixo). */
function sanitize(raw: unknown): BodyMetricsState {
  if (!raw || typeof raw !== 'object') return { measurements: [], photos: {} };
  const source = raw as Partial<BodyMetricsState>;
  const byDate = new Map<string, BodyMeasurement>();

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
    byDate.set(entry.date, { ...byDate.get(entry.date), ...entry });
  }
  const measurements = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  const photos: Partial<Record<BodyPhotoSlot, BodyPhoto>> = {};
  for (const slot of PHOTO_SLOTS) {
    const photo = source.photos?.[slot.key];
    if (photo && typeof photo.url === 'string' && photo.url) {
      photos[slot.key] = {
        slot: slot.key,
        url: photo.url,
        date: typeof photo.date === 'string' ? photo.date : '',
      };
    }
  }

  return { measurements, photos };
}

/* ── Migração do localStorage (uma vez) ── */

let legacyMigrated = false;

function migrateLegacyStorage(): void {
  if (legacyMigrated) return;
  legacyMigrated = true;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return;
  }
  if (!raw) return;
  let parsed: BodyMetricsState;
  try {
    parsed = sanitize(JSON.parse(raw));
  } catch {
    /* JSON inválido: a chave fica para inspeção manual */
    return;
  }
  const photos = Object.values(parsed.photos);
  if (parsed.measurements.length === 0 && photos.length === 0) {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* best-effort */
    }
    return;
  }
  void idb
    .transaction('rw', [idb.bodyMeasurements, idb.bodyPhotos], async () => {
      await idb.bodyMeasurements.bulkPut(parsed.measurements);
      await idb.bodyPhotos.bulkPut(photos);
    })
    .then(() => {
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        /* best-effort */
      }
      emitChange();
    })
    .catch((err) => {
      /* falhou: a chave permanece e a próxima sessão tenta de novo */
      legacyMigrated = false;
      console.warn('[body-metrics] migração do localStorage:', err);
    });
}

/* ── Leitura / gravação (banco) ── */

function emitChange(): void {
  try {
    window.dispatchEvent(new CustomEvent(BODY_METRICS_EVENT));
  } catch {
    /* SSR/testes */
  }
}

/** Estado completo lido do banco (ordena as datas na leitura). */
export async function readBodyMetrics(): Promise<BodyMetricsState> {
  migrateLegacyStorage();
  const [measurements, photoRows] = await Promise.all([
    idb.bodyMeasurements.toArray(),
    idb.bodyPhotos.toArray(),
  ]);
  const photos: Partial<Record<BodyPhotoSlot, BodyPhoto>> = {};
  for (const row of photoRows) photos[row.slot] = row;
  return {
    measurements: measurements.sort((a, b) => a.date.localeCompare(b.date)),
    photos,
  };
}

/** Regrava o estado inteiro (conjunto pequeno: ≤ 3 fotos + medições por dia). */
async function writeAll(next: BodyMetricsState): Promise<BodyMetricsState> {
  const clean = sanitize(next);
  const photos = Object.values(clean.photos);
  await idb.transaction('rw', [idb.bodyMeasurements, idb.bodyPhotos], async () => {
    await idb.bodyMeasurements.clear();
    if (clean.measurements.length) await idb.bodyMeasurements.bulkPut(clean.measurements);
    await idb.bodyPhotos.clear();
    if (photos.length) await idb.bodyPhotos.bulkPut(photos);
  });
  emitChange();
  return clean;
}

/** Registra (ou completa) a medição de uma data — merge por dia. */
export async function upsertMeasurement(input: BodyMeasurement): Promise<BodyMetricsState> {
  const state = await readBodyMetrics();
  const entry: BodyMeasurement = { date: input.date };
  const weight = parseNumber(input.weightKg);
  const fat = parseNumber(input.bodyFat);
  const waist = parseNumber(input.waistCm);
  if (weight !== undefined) entry.weightKg = weight;
  if (fat !== undefined) entry.bodyFat = fat;
  if (waist !== undefined) entry.waistCm = waist;

  const others = state.measurements.filter((m) => m.date !== entry.date);
  const existing = state.measurements.find((m) => m.date === entry.date);
  return writeAll({
    measurements: [...others, { ...existing, ...entry }],
    photos: state.photos,
  });
}

export async function setPhoto(slot: PhotoSlot, url: string, date: string): Promise<BodyMetricsState> {
  const state = await readBodyMetrics();
  return writeAll({ ...state, photos: { ...state.photos, [slot]: { slot, url, date } } });
}

export async function removePhoto(slot: PhotoSlot): Promise<BodyMetricsState> {
  const state = await readBodyMetrics();
  const photos = { ...state.photos };
  delete photos[slot];
  return writeAll({ ...state, photos });
}

/**
 * Hook das telas: lê o banco, recarrega quando uma gravação dispara
 * `academia:body-metrics-changed` e quando o bootstrap/sync termina
 * (`academia:db-ready` — inclusive após um pull da nuvem).
 */
export function useBodyMetrics(): { metrics: BodyMetricsState; loading: boolean } {
  const [metrics, setMetrics] = useState<BodyMetricsState>(EMPTY_BODY_METRICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const load = () => {
      readBodyMetrics()
        .then((next) => {
          if (!alive) return;
          setMetrics(next);
          setLoading(false);
        })
        .catch((err) => {
          console.warn('[useBodyMetrics] falha ao carregar métricas corporais:', err);
          if (alive) setLoading(false);
        });
    };

    load();
    window.addEventListener(BODY_METRICS_EVENT, load);
    document.addEventListener('academia:db-ready', load);
    return () => {
      alive = false;
      window.removeEventListener(BODY_METRICS_EVENT, load);
      document.removeEventListener('academia:db-ready', load);
    };
  }, []);

  return { metrics, loading };
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

/** Medição mais recente (qualquer data) de uma métrica a partir da data dada. */
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
