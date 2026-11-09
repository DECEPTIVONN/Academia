/**
 * ProgressoFeature.tsx — Seção Progresso (port 1:1 de `componentes/secoes/progresso.html`
 * + `JS/treino/secao-progresso.js`)
 *
 * Mantém o DOM/classes legados dos cartões preservados — stats e calculadora 1RM
 * — e acrescenta (v4.55.0) o cabeçalho "Progresso", a Pontuação de Força, os
 * cards de Atividade (ofensiva + mês atual), o heatmap anual de séries,
 * Tendências, Corpo (métricas corporais) e Conquistas.
 *
 * v4.56.3: o calendário (Mensal/Semanal) e o Ciclo de Treino saíram do fluxo da
 * aba e vivem no overlay `calendarOpen`; os cards Treinos/Volume das Tendências
 * abrem, respectivamente, o Radar Fit em tela cheia (TrendRadarOverlay) e o
 * modal de volume de carga.
 *
 * v4.56.4: os cards fixos de Volume de Carga e Atributos de Performance saíram
 * da aba (só existem nas telas de Tendências) e todas as telas da aba entram e
 * saem com animação (`useModalPresence` + `.is-closing`).
 *
 * Calcula tudo a partir de `useLocalData` + `legacyState` (ciclo, cycleEvents);
 * as derivações novas vivem em `progress-stats.ts`.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocalData } from '@/hooks/useLocalData';
import { fadeIn } from '@/lib/animations';
import {
  SHEET_ORDER,
  compactIds,
  formatSeconds,
  getCycleTimeline,
  getExerciseMap,
  getStreak,
  pickExercises,
  today,
  type CycleTimelineItem,
  type LocalData,
  type SheetKey,
} from '@/core/db/queries';
import { useModalPresence } from '@/hooks/useModalPresence';
import { buildVolumeLineChartSvg } from './volume-line-chart';
import {
  convertKgToDisplay,
  getFirstDayOfWeek,
  getWeekDayLabels,
  getWeightUnit,
  type FirstDayOfWeek,
  type WeightUnit,
} from '@/lib/app-prefs';
import { Award, ArrowLeft, ChevronRight, Dumbbell, Flame, Layers, Weight, X, Zap } from 'lucide-react';
import { getBadgeDefinitions, getProfileStats } from '@/features/profile/profile-data';
import { shareFriendInvite } from '@/features/social/share-invite';
import { BodyMetricsOverlay } from './BodyMetricsOverlay';
import { EstandartesOverlay } from './EstandartesOverlay';
import { OfensivasOverlay } from './OfensivasOverlay';
import { TrendRadarOverlay } from './TrendRadarOverlay';
import { latestMeasurementDate, latestValues, useBodyMetrics } from './body-metrics';
import {
  exerciseVolume,
  fmtDateLocal as fmtDate,
  formatVolume,
  getSeriesHeatmap,
  getStrengthScore,
  getTrends,
  getWeekSummary,
  keysOfDay,
  weeklyTarget,
  type TrendKey,
  type TrendMetric,
  type TrendPeriod,
} from './progress-stats';
import './progresso.css';
import './volume-details.css';
import './calendar-overlay.css';
import './rm-calculator.css';

type CalView = 'monthly' | 'weekly';

/* Portal para document.body (padrão de TreinosModals/ExercicioFormModal/Social):
   o .section-strip tem `will-change: transform` e passa a ser o containing
   block do `position: fixed` — sem o portal o .modal-overlay é posicionado
   dentro da fita de 500vw e some fora da viewport. */
const toBody = (node: React.ReactNode) => createPortal(node, document.body);

const MONTH_NAMES = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
];

/* v4.44.0 — o primeiro dia da semana vem de Preferências do App. */

/** "Hoje" único do módulo (evita `new Date()` impuro dentro do render — oxlint purity). */
const TODAY_BASE = new Date();

/* `fmtDate` (progress-stats: `fmtDateLocal`), `keysOfDay`, `formatSeconds` e
   `exerciseVolume` são compartilhados com a Central de Ofensivas e vivem em
   `progress-stats.ts` / `core/db/queries.ts` — sem cópias locais. */

interface MonthCell {
  dateStr: string;
  day: number;
  levelCls: string;
  isToday: boolean;
  durationMin: number | null;
  eventLabel: string | undefined;
  hasHistory: boolean;
}

interface PlannerDay {
  dateStr: string;
  weekday: string;
  dateLabel: string;
  dayOfWeek: number;
  treinos: string[];
  durationMin: number | null;
  isToday: boolean;
}

interface VolumeEntry {
  group: string;
  vol: number;
  prevVol: number;
  /** Volume por exercício no período atual (breakdownPorEx L466/L487–488). */
  breakdown: Record<string, number>;
}

const VOLUME_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f97316',
  '#a855f7',
  '#ec4899',
  '#eab308',
  '#06b6d4',
  '#ef4444',
];

/** Volumes são somados em kg; a exibição respeita a unidade escolhida. */
function formatT(kg: number): string {
  return formatVolume(kg, getWeightUnit());
}

/** Ícones das tendências (lucide, SVG stroke com `currentColor`). */
const TREND_ICONS: Record<TrendKey, React.ReactNode> = {
  treinos: <Dumbbell size={18} />,
  volume: <Weight size={18} />,
  energia: <Zap size={18} />,
  series: <Layers size={18} />,
};

/* Ícones de tendência (renderVolumeSemanal L529–530) */
const UP_TREND_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="display:inline-block; vertical-align:middle; margin-right:2px;"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>';
const DOWN_TREND_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="display:inline-block; vertical-align:middle; margin-right:2px;"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>';

/** Espelha trendStr/trendColor (renderVolumeSemanal L525–539 + fallback da legenda L560). */
function trendInfo(entry: VolumeEntry, mode: string): { label: string; color: string } {
  if (mode !== 'all') {
    if (entry.prevVol === 0 && entry.vol > 0) {
      return { label: `${UP_TREND_ICON} +100%`, color: '#4ade80' };
    }
    if (entry.prevVol > 0) {
      const pct = ((entry.vol - entry.prevVol) / entry.prevVol) * 100;
      return pct >= 0
        ? { label: `${UP_TREND_ICON} +${Math.round(pct)}%`, color: '#4ade80' }
        : { label: `${DOWN_TREND_ICON} ${Math.round(pct)}%`, color: '#f87171' };
    }
  }
  return { label: entry.vol === 0 ? '-' : 'Total', color: 'var(--text-tertiary)' };
}

/* ── Donut + legenda de volume (reaproveitado pelo card e pelo modal) ── */

interface VolumeBreakdownProps {
  entries: VolumeEntry[];
  total: number;
  mode: string;
  onOpenGroup: (group: string) => void;
}

function VolumeBreakdown({ entries, total, mode, onOpenGroup }: VolumeBreakdownProps) {
  return (
    <div className="volume-chart__inner">
      <div className="volume-chart__donut-wrap">
        <div
          className="volume-chart__donut"
          style={{
            background: entries.some((e) => e.vol > 0)
              ? buildConicGradient(entries, total)
              : 'rgba(255,255,255,0.1)',
          }}
        >
          <div className="volume-chart__center">
            <span className="volume-chart__total">{formatT(total)}</span>
            <span className="volume-chart__caption">TOTAL</span>
          </div>
        </div>
      </div>
      <div className="volume-chart__legend custom-scroll">
        {entries.map((entry, i) => {
          const zero = entry.vol === 0;
          const color = zero ? 'rgba(255,255,255,0.2)' : VOLUME_COLORS[i % VOLUME_COLORS.length];
          const trend = trendInfo(entry, mode);
          return (
            <button
              type="button"
              key={entry.group}
              className={`volume-chart__row ${zero ? 'is-zero' : ''}`}
              onClick={() => onOpenGroup(entry.group)}
              aria-label={`Ver detalhes de volume de ${entry.group}`}
            >
              <span className="volume-chart__row-name">
                <span className="volume-chart__dot" style={{ background: color }} />
                <span>{entry.group}</span>
              </span>
              <span className="volume-chart__row-values">
                <span className="volume-chart__row-vol">{formatT(entry.vol)}</span>
                <span
                  className="volume-chart__row-trend"
                  style={{ color: trend.color }}
                  dangerouslySetInnerHTML={{ __html: trend.label }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Feature ── */

export const ProgressoFeature: React.FC = () => {
  const { exercises, sheets, history, legacy } = useLocalData();

  const [calView, setCalView] = useState<CalView>('monthly');
  const [viewDate, setViewDate] = useState(() => new Date());
  const [volumeMode, setVolumeMode] = useState('7');
  const [calcWeight, setCalcWeight] = useState('');
  const [calcReps, setCalcReps] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showRadarGuide, setShowRadarGuide] = useState(false);
  const [volumeDetailGroup, setVolumeDetailGroup] = useState<string | null>(null);
  /* v4.56.4 — último grupo aberto: o painel continua preenchido durante a
     animação de saída, quando `volumeDetailGroup` já voltou a null. */
  const [volumeDetailGroupLast, setVolumeDetailGroupLast] = useState<string | null>(null);
  const [firstDay, setFirstDay] = useState<FirstDayOfWeek>(() => getFirstDayOfWeek());
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => getWeightUnit());
  /* v4.55.0 — telas cheias abertas pela aba e filtros das seções novas */
  const [ofensivasOpen, setOfensivasOpen] = useState(false);
  const [emblemasOpen, setEmblemasOpen] = useState(false);
  const [bodyMetricsOpen, setBodyMetricsOpen] = useState(false);
  /* v4.56.3 — novas interfaces abertas pelos cards (calendário+ciclo,
     volume geral e Radar Fit/Tendências) */
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [volumeOverviewOpen, setVolumeOverviewOpen] = useState(false);
  const [trendRadarOpen, setTrendRadarOpen] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('week');
  const [heatYear, setHeatYear] = useState(() => new Date().getFullYear());
  /* v4.56.0 — métricas/fotos vêm do banco (IndexedDB) via hook */
  const { metrics: bodyMetrics } = useBodyMetrics();

  /* v4.56.4 — saída suave das telas da aba: o modal continua montado durante a
     animação e recebe `.is-closing` (mesmo padrão de CycleModal/Ofensivas). */
  const calendarPresence = useModalPresence(calendarOpen);
  const volumeOverviewPresence = useModalPresence(volumeOverviewOpen);
  const volumeDetailPresence = useModalPresence(Boolean(volumeDetailGroup));

  useEffect(() => {
    const syncPrefs = () => {
      setFirstDay(getFirstDayOfWeek());
      setWeightUnit(getWeightUnit());
    };
    window.addEventListener('academia:prefs-changed', syncPrefs);
    return () => window.removeEventListener('academia:prefs-changed', syncPrefs);
  }, []);

  /* Containers animados com fadeIn (secao-progresso.js L115/L258/L402/L586) */
  const monthCalRef = useRef<HTMLDivElement>(null);
  const plannerRef = useRef<HTMLDivElement>(null);
  const monthlyCardRef = useRef<HTMLDivElement>(null);
  const weeklyCardRef = useRef<HTMLDivElement>(null);
  /* v4.56.5 — scroller do overlay e bloco do calendário, usados para
     reposicionar a rolagem quando se alterna Mensal ⇄ Semanal. */
  const calScrollRef = useRef<HTMLDivElement>(null);
  const calendarBlockRef = useRef<HTMLDivElement>(null);
  const prevCalViewRef = useRef<CalView>(calView);

  const histMap = useMemo(() => new Map(history.map((h) => [h.date, h])), [history]);
  const exMap = useMemo(() => getExerciseMap(exercises), [exercises]);
  const sheetMap = useMemo(
    () => new Map(sheets.map((s) => [s.sheetKey, s])),
    [sheets]
  );
  const t = today();
  const streak = getStreak(history);
  const completedDates = useMemo(
    () => history.filter((h) => h.completed).map((h) => h.date),
    [history]
  );

  /* ===== Ciclo de Treino (recálculo fresco de renderProgresso) ===== */
  const cycleStartDate = legacy?.currentCycleStartDate ?? t;
  const cycleRows = useMemo(
    () => history.filter((h) => h.completed && h.date >= cycleStartDate),
    [history, cycleStartDate]
  );
  const cycleDone = cycleRows.length;
  const cyclePct = Math.min((cycleDone / 30) * 100, 100);
  const cycleBreakdown = useMemo(() => {
    const bd: Record<string, number> = {};
    for (const key of SHEET_ORDER) bd[key] = 0;
    for (const row of cycleRows) {
      for (const key of keysOfDay(row)) {
        if (key in bd) bd[key] += 1;
      }
    }
    return bd;
  }, [cycleRows]);
  const breakdownItems = SHEET_ORDER.filter((key) => {
    const sheet = sheetMap.get(key);
    const temEx = compactIds(sheet?.exerciseIds).length > 0;
    const temCardio = Boolean(sheet?.aerobic?.tipo);
    return cycleBreakdown[key] > 0 || temEx || temCardio;
  });
  const cycleStatus =
    cyclePct >= 100
      ? { text: 'CICLO COMPLETO', color: '#fff', background: 'var(--gym-green)' }
      : cyclePct >= 70
        ? { text: 'RETA FINAL', color: '#fff', background: '#8b5cf6' }
        : { text: 'EM ANDAMENTO', color: undefined, background: undefined };

  /* ===== Seções novas (v4.55.0) =====
     Os cálculos de ofensiva, heatmap, tendências e pontuação vivem em
     `progress-stats.ts`; aqui só se monta o `LocalData` e a exibição. */
  const localData = useMemo<LocalData>(
    () => ({ exercises, sheets, history, legacy }),
    [exercises, sheets, history, legacy]
  );
  /* Linha do tempo 0–30 do ciclo atual (mesma do modal "Ciclos" do Início),
     exibida na nova interface de calendário. */
  const cycleTimeline = useMemo<CycleTimelineItem[]>(
    () => getCycleTimeline(localData),
    [localData]
  );
  const weekTarget = weeklyTarget(legacy);
  const weekSummary = useMemo(
    () => getWeekSummary(history, firstDay, weekTarget, exMap, sheetMap, t),
    [history, firstDay, weekTarget, exMap, sheetMap, t]
  );
  const heatmap = useMemo(
    () => getSeriesHeatmap(history, heatYear, firstDay, exMap, sheetMap, t),
    [history, heatYear, firstDay, exMap, sheetMap, t]
  );
  const heatWorkouts = useMemo(
    () =>
      history
        .filter((h) => h.date.startsWith(String(heatYear)))
        .reduce((sum, h) => sum + keysOfDay(h).length, 0),
    [history, heatYear]
  );
  /* Rótulos de mês do heatmap: cada um ocupa as colunas até o próximo. */
  const heatMonths = useMemo(
    () =>
      heatmap.monthLabels.map((month, i) => {
        const next = heatmap.monthLabels[i + 1];
        return {
          label: month.label,
          weekIndex: month.weekIndex,
          span: Math.max(1, (next ? next.weekIndex : heatmap.weeks.length) - month.weekIndex),
        };
      }),
    [heatmap]
  );

  const trends = useMemo(
    () => getTrends(localData, trendPeriod, exMap, sheetMap, t),
    [localData, trendPeriod, exMap, sheetMap, t]
  );
  const strength = useMemo(() => getStrengthScore(localData), [localData]);
  const monthWorkouts = useMemo(
    () =>
      history
        .filter((h) => h.date.startsWith(t.slice(0, 7)))
        .reduce((sum, h) => sum + keysOfDay(h).length, 0),
    [history, t]
  );
  const badgesEarned = useMemo(
    () =>
      getBadgeDefinitions(localData, getProfileStats(localData), legacy?.conquistas ?? [], false)
        .filter((badge) => badge.naturalCheck).length,
    [localData, legacy]
  );

  /* Mês atual em Title Case (o card do mês acompanha a data de hoje). */
  const currentMonthName =
    MONTH_NAMES[TODAY_BASE.getMonth()].charAt(0) +
    MONTH_NAMES[TODAY_BASE.getMonth()].slice(1).toLowerCase();
  const currentDay = TODAY_BASE.getDate();

  const bodyLatest = latestValues(bodyMetrics);
  const bodyWeightKg = bodyLatest.weightKg ?? legacy?.profileCustomization?.weightKg ?? null;
  const bodyLastDate = latestMeasurementDate(bodyMetrics);
  const bodyWeightLabel =
    bodyWeightKg !== null
      ? `${convertKgToDisplay(bodyWeightKg, weightUnit).toFixed(1).replace('.', ',')} ${weightUnit}`
      : '—';
  const bodyHint =
    Object.keys(bodyMetrics.photos).length > 0 || bodyLastDate
      ? 'Toque para ver suas fotos de progresso'
      : 'Toque para adicionar sua primeira foto';

  const trendDisplay = (metric: TrendMetric): string => {
    if (metric.value <= 0) return '—';
    if (metric.key === 'volume') return formatT(metric.value);
    if (metric.key === 'energia') return `${Math.round(metric.value)} min`;
    return String(metric.value);
  };

  /* ===== Calendário mensal ===== */
  const monthCells = useMemo<MonthCell[]>(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();
    const cells: MonthCell[] = [];

    /* v4.44.0 — as células vazias seguem o primeiro dia configurado. */
    const emptySlots =
      firstDay === 'sunday'
        ? firstWeekday
        : firstWeekday === 0
          ? 6
          : firstWeekday - 1;
    for (let i = 0; i < emptySlots; i++) {
      cells.push({
        dateStr: '',
        day: 0,
        levelCls: 'empty',
        isToday: false,
        durationMin: null,
        eventLabel: undefined,
        hasHistory: false,
      });
    }

    let currentStreak = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = fmtDate(d);
      const isToday = dateStr === t;
      const row = histMap.get(dateStr);
      const isDone = Boolean(row?.completed);
      const isSunday = d.getDay() === 0;

      if (isDone) {
        currentStreak += 1;
      } else if (!isSunday && dateStr < t) {
        currentStreak = 0;
      }

      let levelCls = '';
      if (isDone) {
        if (currentStreak >= 10) levelCls = 'level-5';
        else if (currentStreak >= 7) levelCls = 'level-4';
        else if (currentStreak >= 4) levelCls = 'level-3';
        else if (currentStreak >= 2) levelCls = 'level-2';
        else levelCls = 'level-1';
      } else if (dateStr < t && !isSunday) {
        levelCls = 'missed';
      }

      cells.push({
        dateStr,
        day,
        levelCls,
        isToday,
        durationMin: isDone ? (row?.durationMin ?? null) : null,
        eventLabel: legacy?.cycleEvents?.[dateStr],
        hasHistory: Boolean(row && (row.completed || keysOfDay(row).length > 0)),
      });
    }
    return cells;
  }, [viewDate, histMap, legacy, t, firstDay]);

  /* ===== Planner semanal ===== */
  const plannerWeeks = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks: PlannerDay[][] = [];
    let current: PlannerDay[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = fmtDate(d);
      const row = histMap.get(dateStr);
      current.push({
        dateStr,
        weekday: d.toLocaleDateString('pt-BR', { weekday: 'long' }),
        dateLabel: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        dayOfWeek: d.getDay(),
        treinos: keysOfDay(row),
        durationMin: row?.durationMin ?? null,
        isToday: dateStr === t,
      });
      if (d.getDay() === 0 || day === daysInMonth) {
        weeks.push(current);
        current = [];
      }
    }
    return weeks;
  }, [viewDate, histMap, t]);

  /* ===== Volume de Carga (donut + legenda) ===== */
  const volume = useMemo(() => {
    const validDates: string[] = [];
    const prevDates: string[] = [];

    if (volumeMode !== 'all') {
      const days = parseInt(volumeMode, 10);
      for (let i = 0; i < days; i++) {
        const d = new Date(TODAY_BASE);
        d.setDate(d.getDate() - i);
        validDates.push(fmtDate(d));
        const p = new Date(TODAY_BASE);
        p.setDate(p.getDate() - i - days);
        prevDates.push(fmtDate(p));
      }
    } else {
      validDates.push(...histMap.keys());
    }

    const cur = new Map<string, number>();
    const prev = new Map<string, number>();
    const breakdowns = new Map<string, Map<string, number>>();
    const accumulate = (
      dates: string[],
      target: Map<string, number>,
      trackBreakdown = false
    ) => {
      for (const date of dates) {
        const row = histMap.get(date);
        if (!row?.completed) continue;
        for (const key of keysOfDay(row)) {
          const sheet = sheetMap.get(key as SheetKey);
          for (const ex of pickExercises(sheet?.exerciseIds ?? [], exMap)) {
            const vol = exerciseVolume(ex);
            if (vol <= 0) continue;
            target.set(ex.muscleGroup, (target.get(ex.muscleGroup) ?? 0) + vol);
            if (trackBreakdown) {
              let bd = breakdowns.get(ex.muscleGroup);
              if (!bd) {
                bd = new Map<string, number>();
                breakdowns.set(ex.muscleGroup, bd);
              }
              bd.set(ex.name, (bd.get(ex.name) ?? 0) + vol);
            }
          }
        }
      }
    };
    accumulate(validDates, cur, true);
    accumulate(prevDates, prev);

    const baseGroups = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'];
    for (const g of baseGroups) if (!cur.has(g)) cur.set(g, 0);

    const entries: VolumeEntry[] = [...cur.entries()]
      .map(([group, vol]) => {
        const bd = breakdowns.get(group);
        return {
          group,
          vol,
          prevVol: prev.get(group) ?? 0,
          breakdown: bd ? Object.fromEntries(bd) : {},
        };
      })
      .sort((a, b) => b.vol - a.vol);
    const total = entries.reduce((sum, e) => sum + e.vol, 0);
    return { entries, total };
  }, [histMap, sheetMap, exMap, volumeMode]);

  /* ===== Detalhes de Volume (openVolumeDetails L589–677) ===== */
  const volumeDetailGroupToRender = volumeDetailGroupLast;

  const volumeDetail = useMemo(() => {
    if (!volumeDetailGroupToRender) return null;
    const entry = volume.entries.find((e) => e.group === volumeDetailGroupToRender);
    if (!entry) return null;

    const historyDays: string[] = [];
    if (volumeMode === 'all') {
      const allDates = [...histMap.keys()]
        .filter((d) => histMap.get(d)?.completed)
        .sort();
      historyDays.push(...allDates.slice(-15));
    } else {
      const days = parseInt(volumeMode, 10);
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(TODAY_BASE);
        d.setDate(d.getDate() - i);
        historyDays.push(fmtDate(d));
      }
    }

    const dailyHistory = historyDays.map((date) => {
      let dayVol = 0;
      const row = histMap.get(date);
      if (row?.completed) {
        for (const key of keysOfDay(row)) {
          const sheet = sheetMap.get(key as SheetKey);
          for (const ex of pickExercises(sheet?.exerciseIds ?? [], exMap)) {
            if (ex.muscleGroup === volumeDetailGroupToRender) dayVol += exerciseVolume(ex);
          }
        }
      }
      return { data: date, valor: dayVol };
    });

    const chartData =
      volumeMode === 'all' ? dailyHistory.filter((h) => h.valor > 0) : dailyHistory;
    const avgVol = chartData.length
      ? chartData.reduce((acc, h) => acc + h.valor, 0) / chartData.length
      : 0;
    const trend = trendInfo(entry, volumeMode);
    const showTrend = volumeMode !== 'all' && (entry.vol > 0 || entry.prevVol > 0);
    const exNames = Object.keys(entry.breakdown).sort(
      (a, b) => entry.breakdown[b] - entry.breakdown[a]
    );
    return { entry, chartData, avgVol, trend, showTrend, exNames };
  }, [volumeDetailGroupToRender, volumeMode, volume, histMap, sheetMap, exMap]);

  /* renderVolumeLineChart (L653): mede o container na abertura do modal */
  useEffect(() => {
    if (!volumeDetail) return;
    const container = document.getElementById('volDetChartContainer');
    if (!container) return;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 160;
    container.innerHTML = buildVolumeLineChartSvg(volumeDetail.chartData, width, height);
  }, [volumeDetail]);

  /* Fades "de render" do legado: cada renderização do bloco reaplica
     ui-fade-in (renderCalendario L258, renderWeeklyPlanner L115/L402,
     renderVolume L586) */
  useEffect(() => {
    fadeIn(monthCalRef.current);
  }, [monthCells, calendarOpen]);

  useEffect(() => {
    fadeIn(plannerRef.current);
  }, [plannerWeeks, calendarOpen]);

  /* app.js L108-130: alternar mensal/semanal mostra o card com fadeIn
     (e o toggle semanal também re-renderiza o planner) */
  useEffect(() => {
    fadeIn(calView === 'monthly' ? monthlyCardRef.current : weeklyCardRef.current);
    if (calView === 'weekly') {
      fadeIn(plannerRef.current);
    }
  }, [calView, calendarOpen]);

  /* v4.56.5 — ao alternar Mensal ⇄ Semanal, reposiciona a rolagem do overlay no
     topo do bloco "Calendário" (descontando o cabeçalho sticky). Sem isso a
     rolagem ficava onde estava (o corpo já vinha rolado até o toggle) e o
     planner longo aparecia "no meio", com o título e o toggle fora da vista. */
  useEffect(() => {
    if (!calendarOpen) {
      prevCalViewRef.current = calView;
      return;
    }
    if (prevCalViewRef.current === calView) return;
    prevCalViewRef.current = calView;

    const scroller = calScrollRef.current;
    const block = calendarBlockRef.current;
    if (!scroller || !block) return;
    const head = scroller.querySelector<HTMLElement>('.cal-ov__head');
    const offset = (head?.offsetHeight ?? 0) + 10;
    const top =
      block.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop -
      offset;
    scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, [calView, calendarOpen]);

  /* ===== Calculadora 1RM (Brzycki) =====
     A fórmula só é confiável numa faixa curta de repetições e fica negativa a
     partir de ~37 reps — por isso a validação explícita em vez de confiar no
     parseFloat. A tabela de percentuais mostra as cargas de trabalho. */
  const rmWeight = parseFloat(calcWeight.replace(',', '.'));
  const rmReps = parseFloat(calcReps);
  const rmValid =
    Number.isFinite(rmWeight) &&
    rmWeight > 0 &&
    Number.isFinite(rmReps) &&
    rmReps >= 1 &&
    rmReps <= 30;
  const rmValue = rmValid
    ? Math.round(rmWeight / (1.0278 - 0.0278 * rmReps))
    : null;
  const rmResult = rmValue ?? '--';
  const rmHighReps = Number.isFinite(rmReps) && rmReps > 12;
  const RM_PERCENTS = [100, 95, 90, 85, 80, 75, 70];
  const RM_REP_CHIPS = [1, 3, 5, 10, 15, 20, 30];

  /* ===== Modal do dia ===== */
  const dayRow = selectedDate ? histMap.get(selectedDate) : undefined;
  const dayKeys = keysOfDay(dayRow);

  /* openModal legado (secao-ficha.js L560–568): trava o scroll do body enquanto
   um modal da seção está aberto e restaura o valor anterior no fechamento. */
  const anyProgressModalOpen =
    Boolean(selectedDate && dayRow) ||
    Boolean(volumeDetailGroup) ||
    volumeOverviewOpen ||
    calendarOpen ||
    showRadarGuide;
  useEffect(() => {
    if (!anyProgressModalOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [anyProgressModalOpen]);

  /* Esc fecha as camadas na ordem em que foram abertas: dia do calendário →
     grupo do volume → volume geral → calendário. */
  useEffect(() => {
    if (!calendarOpen && !volumeOverviewOpen && !volumeDetailGroup && !selectedDate) {
      return undefined;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selectedDate) {
        setSelectedDate(null);
        return;
      }
      if (volumeDetailGroup) {
        setVolumeDetailGroup(null);
        return;
      }
      if (volumeOverviewOpen) {
        setVolumeOverviewOpen(false);
        return;
      }
      setSelectedDate(null);
      setCalendarOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [calendarOpen, volumeOverviewOpen, volumeDetailGroup, selectedDate]);

  /* Esc fecha o guia do Radar (aberto pela tela de Tendências). */
  useEffect(() => {
    if (!showRadarGuide) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowRadarGuide(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showRadarGuide]);

  /* v4.56.3 — o card do mês e o card "Treinos no Mês" abrem a nova interface
     de Calendário (Mensal grid / Semanal planner) + Ciclo de Treino Atual. O
     calendário saiu do fluxo da aba e vive nessa tela cheia. */
  const openCalendar = () => {
    setOfensivasOpen(false);
    setBodyMetricsOpen(false);
    setViewDate(new Date());
    setCalendarOpen(true);
  };

  /* v4.72.1 — a Central de Ofensivas também é aberta pelo Início; o link
     "Abrir calendário completo" de lá navega para esta aba e pede o calendário
     por evento (a seção já está montada, então basta abrir a tela). */
  useEffect(() => {
    const onOpenCal = () => {
      setOfensivasOpen(false);
      setViewDate(new Date());
      setCalendarOpen(true);
    };
    window.addEventListener('academia:open-progresso-calendar', onOpenCal);
    return () => window.removeEventListener('academia:open-progresso-calendar', onOpenCal);
  }, []);

  /* Fecha o calendário junto com o modal do dia (a célula selecionada não pode
     ficar aberta sozinha depois que a tela sai). */
  const closeCalendar = () => {
    setSelectedDate(null);
    setCalendarOpen(false);
  };

  /* v4.56.4 — abre o detalhe de um grupo muscular do volume. O último grupo
     fica gravado para o painel não esvaziar durante a animação de saída. */
  const openVolumeDetail = (group: string) => {
    setVolumeDetailGroupLast(group);
    setVolumeDetailGroup(group);
  };

  const closeVolumeDetail = () => setVolumeDetailGroup(null);

  /* Convite de amigo (fluxo do Social) reaproveitado pelo card de compartilhar
     — helper compartilhado com o botão de ofensiva do Início. */
  const inviteFriend = () => shareFriendInvite(legacy?.profileCustomization?.nome);

  const shiftMonth = (delta: number) =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  const prevDisabled = viewDate.getFullYear() === 2026 && viewDate.getMonth() === 0;

  const monthName = MONTH_NAMES[viewDate.getMonth()];
  const monthYear = viewDate.getFullYear();

  const monthNameCell = `${monthName} ${monthYear}`;

  return (
    <div className="treino-container">
      <div id="section-progresso" className="main-section" role="tabpanel">
        <div id="tab-progresso" className="t-tab active" role="tabpanel">
          <div className="progresso-grid">
            {/* ===== Cabeçalho da aba (v4.55.0) ===== */}
            <div className="prog-head">
              <h2 className="prog-head__title">Progresso</h2>
            </div>

            {/* ===== Pontuação de Força (v4.55.0) ===== */}
            <h3 className="prog-section__title">Pontuação de Força</h3>
            <div className="prog-score">
              <span className="prog-score__icon" aria-hidden="true">
                <Zap size={22} />
              </span>
              {strength.ready ? (
                <div className="prog-score__body">
                  <span className="prog-score__value">
                    {strength.value}
                    <small>/100</small>
                  </span>
                  <div className="prog-score__bar">
                    <div className="prog-score__fill" style={{ width: `${strength.value}%` }} />
                  </div>
                  <span className="prog-score__label">{strength.label}</span>
                </div>
              ) : (
                <p className="prog-score__text">
                  Você precisa completar alguns treinos antes de poder ver sua pontuação.
                </p>
              )}
            </div>

            {/* ===== Atividade (v4.55.0) ===== */}
            <h3 className="prog-section__title">Atividade</h3>
            <div className="prog-activity">
              {/* Ofensiva — abre a Central de Ofensivas (sequência e constância) */}
              <button
                type="button"
                className={`prog-act ${streak > 0 ? 'prog-act--hot' : ''}`}
                onClick={() => setOfensivasOpen(true)}
                aria-label="Abrir a Central de Ofensivas"
              >
                <span className="prog-act__icon" aria-hidden="true">
                  <Flame size={20} />
                </span>
                <ChevronRight className="prog-act__chev" size={16} aria-hidden="true" />
                <span className="prog-act__texts">
                  <span className="prog-act__title">
                    {streak > 0 ? `${streak} dia${streak > 1 ? 's' : ''}` : 'Sem sequência'}
                  </span>
                  <span className="prog-act__sub">
                    {weekSummary.done} / {weekTarget} dias
                  </span>
                </span>
              </button>

              {/* Mês atual — abre a interface de Calendário + Ciclo */}
              <button
                type="button"
                className="prog-act"
                onClick={openCalendar}
                aria-label={`Treinos de ${currentMonthName} — abrir o calendário`}
              >
                <span
                  className={`prog-act__badge ${monthWorkouts > 0 ? 'prog-act__badge--ghost' : ''}`}
                >
                  {monthWorkouts > 0 ? `${monthWorkouts} treinos` : 'NOVO'}
                </span>
                <ChevronRight className="prog-act__chev" size={16} aria-hidden="true" />
                <span className="prog-act__texts">
                  <span className="prog-act__title">{currentMonthName}</span>
                  <span className="prog-act__sub">
                    {monthWorkouts} treino{monthWorkouts === 1 ? '' : 's'}
                  </span>
                </span>
                <span className="prog-act__watermark" aria-hidden="true">
                  {currentDay}
                </span>
              </button>
            </div>
            {/* O calendário (Mensal/Semanal) e o Ciclo agora abrem na interface
                dedicada `calendarOpen` — ver overlay no fim do componente. */}

            {/* ===== Séries — heatmap anual (v4.55.0) ===== */}
            <h3 className="prog-section__title">Séries</h3>
            <div className="prog-heat">
              <div className="prog-heat__head">
                <span className="prog-heat__count">
                  {heatWorkouts} treino{heatWorkouts === 1 ? '' : 's'}
                </span>
                <select
                  className="prog-select"
                  aria-label="Ano do heatmap de séries"
                  value={heatYear}
                  onChange={(e) => setHeatYear(parseInt(e.target.value, 10))}
                >
                  {heatmap.years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="prog-heat__scroll">
                <div className="prog-heat__body">
                  <div className="prog-heat__days" aria-hidden="true">
                    {getWeekDayLabels(firstDay).map((label) => (
                      <span className="prog-heat__day" key={label}>
                        {label[0]}
                      </span>
                    ))}
                  </div>
                  <div className="prog-heat__grid">
                    <div className="prog-heat__months" aria-hidden="true">
                      {heatMonths.map((month) => (
                        <span
                          className="prog-heat__month"
                          key={`${month.label}-${month.weekIndex}`}
                          style={{ gridColumn: `span ${month.span}` }}
                        >
                          {month.label}
                        </span>
                      ))}
                    </div>
                    <div className="prog-heat__weeks">
                      {heatmap.weeks.map((week) => (
                        <div className="prog-heat__week" key={week.startDate}>
                          {week.cells.map((cell) => (
                            <span
                              key={cell.dateStr}
                              className={`prog-heat__cell ${
                                cell.inYear
                                  ? `prog-heat__cell--l${cell.level}`
                                  : 'prog-heat__cell--out'
                              } ${cell.isToday ? 'prog-heat__cell--today' : ''}`}
                              title={`${cell.dateStr} · ${cell.series} série(s)`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="prog-heat__legend">
                <span>Menos</span>
                <span className="prog-heat__scale" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <span key={level} className={`prog-heat__cell--l${level}`} />
                  ))}
                </span>
                <span>Mais</span>
              </div>
            </div>

            {/* ===== Tendências (v4.55.0) ===== */}
            <div className="prog-trends__head">
              <h3 className="prog-section__title">Tendências</h3>
              <select
                className="prog-select"
                aria-label="Período das tendências"
                value={trendPeriod}
                onChange={(e) => setTrendPeriod(e.target.value as TrendPeriod)}
              >
                <option value="week">Semana passada</option>
                <option value="month">Último mês</option>
                <option value="all">Total</option>
              </select>
            </div>
            <div className="prog-trends">
              {trends.map((metric) => {
                /* v4.56.3 — Treinos abre o Radar Fit/Tendências; Volume abre o
                   modal do volume de carga. Energia/Séries seguem informativos. */
                const action =
                  metric.key === 'treinos'
                    ? () => setTrendRadarOpen(true)
                    : metric.key === 'volume'
                      ? () => setVolumeOverviewOpen(true)
                      : null;
                const content = (
                  <>
                    <span className="prog-trend__icon" aria-hidden="true">
                      {TREND_ICONS[metric.key]}
                    </span>
                    <div className="prog-trend__row">
                      <span className="prog-trend__value">{trendDisplay(metric)}</span>
                      {metric.deltaPct !== null && metric.value > 0 ? (
                        <span
                          className={`prog-trend__delta ${
                            metric.deltaPct >= 0 ? 'is-up' : 'is-down'
                          }`}
                        >
                          {metric.deltaPct >= 0 ? '+' : '−'}
                          {Math.abs(Math.round(metric.deltaPct))}%
                        </span>
                      ) : null}
                    </div>
                    <span className="prog-trend__label">{metric.label}</span>
                    {action ? (
                      <ChevronRight className="prog-trend__chev" size={15} aria-hidden="true" />
                    ) : null}
                  </>
                );
                return action ? (
                  <button
                    type="button"
                    className="prog-trend prog-trend--btn"
                    key={metric.key}
                    onClick={action}
                    aria-label={
                      metric.key === 'treinos'
                        ? 'Abrir tendências de treino (Radar Fit)'
                        : 'Abrir o volume de carga'
                    }
                  >
                    {content}
                  </button>
                ) : (
                  <div className="prog-trend" key={metric.key}>
                    {content}
                  </div>
                );
              })}
            </div>

            {/* ===== Corpo — métricas corporais (v4.55.0) ===== */}
            <h3 className="prog-section__title">Corpo</h3>
            <button
              type="button"
              className="p-card prog-body"
              onClick={() => setBodyMetricsOpen(true)}
            >
              <span className="prog-body__value">{bodyWeightLabel}</span>
              <span className="prog-body__hint">{bodyHint}</span>
              <ChevronRight className="prog-body__chev" size={18} aria-hidden="true" />
            </button>

            {/* ===== Conquistas (v4.55.0) ===== */}
            <h3 className="prog-section__title">Conquistas</h3>
            <div className="prog-badges">
              <button type="button" className="prog-badges__row" onClick={() => setEmblemasOpen(true)}>
                <span className="prog-badges__title">Conquistas</span>
                <ChevronRight className="prog-badges__chev" size={18} aria-hidden="true" />
              </button>
              <div className="prog-badges__body">
                <span className="prog-badges__medal" aria-hidden="true">
                  <Award size={24} />
                </span>
                <span className="prog-badges__text">
                  {badgesEarned > 0
                    ? `${badgesEarned} conquista${badgesEarned > 1 ? 's' : ''} desbloqueada${
                        badgesEarned > 1 ? 's' : ''
                      }`
                    : 'Nenhuma conquista desbloqueada ainda'}
                </span>
              </div>
            </div>

            {/* Volume de Carga e Radar Fit saíram da aba: agora abrem pelas
                Tendências (cards Volume e Treinos). */}

            {/* ===== Calculadora 1RM ===== */}
            <div className="p-card calculator-card rm-calc">
              <div className="p-card-header">
                <h3>Calculadora de Carga</h3>
                <span className="p-card-meta">Brzycki</span>
              </div>
              <p className="rm-calc__sub">
                Informe uma série que você já consegue fazer para estimar a carga máxima
                de <strong>1 repetição</strong>.
              </p>

              <div className="rm-fields">
                <label className="rm-field" htmlFor="calcWeight">
                  <span className="rm-field__label">Carga levantada</span>
                  <span className="rm-field__control">
                    <input
                      type="number"
                      id="calcWeight"
                      className="rm-field__input"
                      inputMode="decimal"
                      min="0"
                      step="0.5"
                      placeholder="80"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(e.target.value)}
                    />
                    <span className="rm-field__unit">{weightUnit}</span>
                  </span>
                </label>

                <label className="rm-field" htmlFor="calcReps">
                  <span className="rm-field__label">Repetições</span>
                  <span className="rm-field__control">
                    <input
                      type="number"
                      id="calcReps"
                      className="rm-field__input"
                      inputMode="numeric"
                      min="1"
                      max="30"
                      placeholder="10"
                      value={calcReps}
                      onChange={(e) => setCalcReps(e.target.value)}
                    />
                    <span className="rm-field__unit">reps</span>
                  </span>
                </label>
              </div>

              <div className="rm-chips" role="group" aria-label="Sugestões de repetições">
                {RM_REP_CHIPS.map((reps) => (
                  <button
                    type="button"
                    key={reps}
                    className={`rm-chip${rmReps === reps ? ' is-active' : ''}`}
                    aria-pressed={rmReps === reps}
                    onClick={() => setCalcReps(String(reps))}
                  >
                    {reps}
                  </button>
                ))}
              </div>

              <div
                className={`calc-result rm-result${rmValue !== null ? ' rm-result--ready' : ''}`}
                id="calcResult"
                aria-live="polite"
              >
                <span className="rm-result__label">Carga máxima estimada (1RM)</span>
                <span className="rm-result__value">
                  {rmResult}
                  <small>{weightUnit}</small>
                </span>
                <span className="rm-result__hint">
                  {rmValue !== null
                    ? `${rmWeight} ${weightUnit} × ${rmReps} repetições`
                    : 'Preencha a carga e as repetições'}
                </span>
              </div>

              {rmValue !== null && (
                <div className="rm-table">
                  <h4 className="rm-table__title">Cargas de trabalho</h4>
                  <ul className="rm-table__list">
                    {RM_PERCENTS.map((pct) => (
                      <li className="rm-row" key={pct}>
                        <span className="rm-row__pct">{pct}%</span>
                        <span className="rm-row__bar" aria-hidden="true">
                          <span className="rm-row__fill" style={{ width: `${pct}%` }} />
                        </span>
                        <span className="rm-row__val">
                          {Math.round((rmValue * pct) / 100)} {weightUnit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="rm-note">
                Fórmula de Brzycki
                {rmHighReps
                  ? ' — acima de 12 repetições a estimativa tende a superestimar o 1RM.'
                  : ' — mais precisa entre 1 e 12 repetições.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Modal: Histórico do Dia ===== */}
      {dayRow && selectedDate && toBody(
        <div className="modal-overlay" id="modalDayHist" style={{ display: 'flex' }}>
          <div className="modal-form" style={{ maxWidth: 400, padding: 24 }}>
            <div className="modal-form-header" style={{ marginBottom: 16 }}>
              <h3 id="dayHistTitle">
                Treinos do Dia {selectedDate.slice(8, 10)}/{selectedDate.slice(5, 7)}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                id="btnFecharDayHist"
                aria-label="Fechar"
                onClick={() => setSelectedDate(null)}
              >
                ✕
              </button>
            </div>
            <div
              id="dayHistContent"
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                maxHeight: '50vh',
                overflowY: 'auto',
              }}
            >
              {dayRow.durationMin ? (
                <div className="day-hist-duration">
                  {'⏱️'} DURAÇÃO TOTAL: {formatSeconds(dayRow.durationMin * 60)}
                </div>
              ) : null}
              {dayKeys.map((letter) => {
                const sheet = sheetMap.get(letter as SheetKey);
                const list = pickExercises(sheet?.exerciseIds ?? [], exMap);
                return (
                  <div style={{ marginBottom: 16 }} key={letter}>
                    <div
                      style={{
                        marginBottom: 8,
                        fontWeight: 800,
                        color: 'var(--primary-light)',
                        fontSize: '0.8rem',
                        letterSpacing: '1px',
                      }}
                    >
                      TREINO {letter}
                    </div>
                    <div
                      style={{
                        padding: 12,
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      {list.length > 0
                        ? list.map((ex) => (
                            <div key={ex.id}>
                              <strong style={{ color: 'var(--primary-light)' }}>•</strong>{' '}
                              {ex.name}{' '}
                              <span style={{ fontSize: '0.8rem' }}>
                                ({ex.sets}×{ex.reps})
                              </span>
                            </div>
                          ))
                        : 'Nenhum detalhe salvo.'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: DETALHES DE VOLUME (modais.html L829–855) ===== */}
      {volumeDetailPresence.mounted &&
        toBody(
        <div
          className={`modal-overlay ${volumeDetailPresence.closing ? 'is-closing' : ''}`}
          id="modalVolumeDetails"
          role="dialog"
          aria-modal="true"
          aria-labelledby="volDetGroup"
          onClick={() => closeVolumeDetail()}
        >
          <div className="vol-detail" onClick={(e) => e.stopPropagation()}>
            <header className="vol-detail__header">
              <div>
                <span className="vol-detail__eyebrow">Detalhes de volume</span>
                <h2 className="vol-detail__title" id="volDetGroup">
                  {volumeDetail?.entry.group ?? ''}
                </h2>
              </div>
              <button
                type="button"
                className="vol-detail__close"
                id="btnFecharVolumeDetails"
                aria-label="Fechar detalhes de volume"
                onClick={() => closeVolumeDetail()}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </header>

            <div className="vol-detail__body">
              <div className="vol-detail__stats">
                <div className="vol-detail__stat">
                  <span className="vol-detail__stat-label">Volume total</span>
                  <span className="vol-detail__stat-value" id="volDetTotal">
                    {volumeDetail ? formatT(volumeDetail.entry.vol) : `0${weightUnit}`}
                  </span>
                </div>
                <div className="vol-detail__stat">
                  <span className="vol-detail__stat-label">Tendência</span>
                  {volumeDetail?.showTrend ? (
                    <span
                      id="volDetTrend"
                      className="vol-detail__stat-trend"
                      style={{ color: volumeDetail.trend.color }}
                      dangerouslySetInnerHTML={{ __html: volumeDetail.trend.label }}
                    />
                  ) : (
                    <span id="volDetTrend" className="vol-detail__stat-empty">
                      —
                    </span>
                  )}
                </div>
              </div>

              {/* Container do Gráfico (buildVolumeLineChartSvg injeta o SVG) */}
              <section className="vol-detail__chart-card">
                <div className="vol-detail__chart-head">
                  <h3 className="vol-detail__chart-title">Evolução de carga</h3>
                  <span className="vol-detail__avg" id="volDetAvg">
                    Média: {volumeDetail ? formatT(volumeDetail.avgVol) : `0${weightUnit}`}
                  </span>
                </div>
                <div id="volDetChartContainer" className="vol-detail__chart" />
              </section>

              {/* Lista de Exercícios */}
              <h3 className="vol-detail__section-title">Distribuição por exercício</h3>
              <div id="volDetList" className="vol-detail__list custom-scroll">
                {volumeDetail && volumeDetail.exNames.length > 0 ? (
                  volumeDetail.exNames.map((name) => {
                    const exVol = volumeDetail.entry.breakdown[name];
                    const pct =
                      volumeDetail.entry.vol > 0
                        ? Math.round((exVol / volumeDetail.entry.vol) * 100)
                        : 0;
                    return (
                      <div className="vol-detail__ex" key={name}>
                        <div className="vol-detail__ex-head">
                          <span className="vol-detail__ex-name">{name}</span>
                          <span className="vol-detail__ex-value">{formatT(exVol)}</span>
                        </div>
                        <div className="vol-detail__ex-bar">
                          <span
                            className="vol-detail__ex-fill"
                            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                          />
                        </div>
                        <span className="vol-detail__ex-share">{pct}% do grupo</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="vol-detail__empty">
                    Nenhum exercício registrado neste período.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: GUIA DO RADAR (modais.html L649–737) ===== */}
      {toBody(<div
        className="modal-overlay"
        id="modalRadarGuide"
        style={{ display: showRadarGuide ? 'flex' : 'none' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowRadarGuide(false);
        }}
      >
        <div
          className="modal-content"
          style={{
            maxWidth: 450,
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: 0,
            overflow: 'hidden',
          }}
        >
          <div
            className="modal-header"
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.4rem', letterSpacing: '1px' }}>
              COMO SÃO CALCULADOS?
            </h3>
            <button
              className="btn-close"
              onClick={() => setShowRadarGuide(false)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: '#fff',
                width: 30,
                height: 30,
                borderRadius: '50%',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
          <div
            className="modal-body"
            style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 15 }}
          >
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              O <b>Radar Fit</b> analisa seus treinos do período escolhido em Tendências de
              Treino (Semana, Mês, Ano ou Todo o período) para gerar seu perfil de atleta:
            </p>

            <div
              className="guide-item"
              style={{
                display: 'flex',
                gap: 12,
                background: 'rgba(255,255,255,0.02)',
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>🏋️</div>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-light)', marginBottom: 4 }}>
                  FORÇA
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Baseada na carga média por repetição em todos os exercícios. Quanto mais peso
                  você levanta por repetição, maior sua pontuação.
                </p>
              </div>
            </div>

            <div
              className="guide-item"
              style={{
                display: 'flex',
                gap: 12,
                background: 'rgba(255,255,255,0.02)',
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>🔋</div>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-light)', marginBottom: 4 }}>
                  RESISTÊNCIA
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Calculada pelo volume total de repetições + tempo acumulado em exercícios
                  aeróbicos. Treinos volumosos e cardio são a chave.
                </p>
              </div>
            </div>

            <div
              className="guide-item"
              style={{
                display: 'flex',
                gap: 12,
                background: 'rgba(255,255,255,0.02)',
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.05)',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  color: '#f97316',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width={24}
                  height={24}
                >
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-light)', marginBottom: 4 }}>
                  INTENSIDADE
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Mede sua dedicação e constância. É baseada no XP total acumulado no período.
                  Não falte aos treinos para manter 100%.
                </p>
              </div>
            </div>

            <div
              className="guide-item"
              style={{
                display: 'flex',
                gap: 12,
                background: 'rgba(255,255,255,0.02)',
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>⚖️</div>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-light)', marginBottom: 4 }}>
                  SIMETRIA
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Avalia se você treina todos os 7 grupos musculares de forma equilibrada. Evite
                  focar apenas em um músculo.
                </p>
              </div>
            </div>

            <div
              className="guide-item"
              style={{
                display: 'flex',
                gap: 12,
                background: 'rgba(255,255,255,0.02)',
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>🧘</div>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-light)', marginBottom: 4 }}>
                  EQUILÍBRIO
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Mede a variedade técnica. Exercícios unilaterais, livres ou de mobilidade
                  aumentam este atributo.
                </p>
              </div>
            </div>

            <div
              className="guide-item"
              style={{
                display: 'flex',
                gap: 12,
                background: 'rgba(255,255,255,0.02)',
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>⚡</div>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-light)', marginBottom: 4 }}>
                  POTÊNCIA
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Calculada por exercícios de explosão, saltos ou exercícios multiarticulares
                  pesados de pernas.
                </p>
              </div>
            </div>

            <div
              style={{
                background: 'var(--primary)',
                color: '#000',
                padding: 12,
                borderRadius: 12,
                textAlign: 'center',
                fontWeight: 800,
                fontSize: '0.7rem',
                letterSpacing: '1px',
                marginTop: 10,
              }}
            >
              DICA: Ao atingir 95+ em todos os atributos, você sobe de TIER (Bronze, Prata,
              Ouro...) e a dificuldade aumenta!
            </div>
          </div>
        </div>
      </div>)}
      {/* ===== Conquistas: Estandartes do Perfil (v4.73.1) ===== */}
      <EstandartesOverlay
        open={emblemasOpen}
        onClose={() => setEmblemasOpen(false)}
        data={localData}
      />

      {/* ===== Central de Ofensivas (v4.55.0) ===== */}
      <OfensivasOverlay
        open={ofensivasOpen}
        onClose={() => setOfensivasOpen(false)}
        data={localData}
        target={weekTarget}
        onOpenCalendar={openCalendar}
        onInvite={() => void inviteFriend()}
      />

      {/* ===== Métricas corporais (v4.55.0) ===== */}
      <BodyMetricsOverlay
        open={bodyMetricsOpen}
        onClose={() => setBodyMetricsOpen(false)}
        initialWeightKg={legacy?.profileCustomization?.weightKg ?? null}
      />

      {/* ===== Calendário + Ciclo (v4.56.3) ===== */}
      {calendarPresence.mounted &&
        toBody(
          <div
            className={`cal-ov ${calendarPresence.closing ? 'is-closing' : ''}`}
            id="calendarOverlay"
            ref={calScrollRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="calOvTitle"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeCalendar();
            }}
          >
            <div className="cal-ov__panel">
              <header className="cal-ov__head">
                <button
                  type="button"
                  className="cal-ov__back"
                  onClick={closeCalendar}
                  aria-label="Voltar"
                >
                  <ArrowLeft size={22} strokeWidth={2.4} />
                </button>
                <div className="cal-ov__head-copy">
                  <h2 className="cal-ov__title" id="calOvTitle">
                    Calendário de Treinos
                  </h2>
                  <p className="cal-ov__subtitle">Ciclo atual, calendário e histórico de treinos</p>
                </div>
                <span className="cal-ov__spacer" aria-hidden="true" />
              </header>

              <div className="cal-ov__body">
                {/* Resumo movido da aba Progresso: total de treinos e treinos do mês */}
                <div className="p-card stats-card cal-ov__stats">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        width={20}
                        height={20}
                      >
                        <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11" />
                        <circle cx={4} cy={12} r={1.5} />
                        <circle cx={20} cy={12} r={1.5} />
                      </svg>
                    </div>
                    <div className="stat-texts">
                      <h4>Total de Treinos</h4>
                      <span id="progTotalTreinos">{completedDates.length}</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        width={20}
                        height={20}
                      >
                        <rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
                        <line x1={16} y1={2} x2={16} y2={6} />
                        <line x1={8} y1={2} x2={8} y2={6} />
                        <line x1={3} y1={10} x2={21} y2={10} />
                      </svg>
                    </div>
                    <div className="stat-texts">
                      <h4>Treinos no Mês</h4>
                      <span id="progMesTreinos">
                        {completedDates.filter((d) => d.startsWith(t.slice(0, 7))).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ciclo de Treino Atual (mesmo painel do modal "Ciclos" do Início) */}
                <section className="cal-ov__cycle">
                  <div className="p-card cycle-card">
                    <div className="p-card-header">
                      <h3>Ciclo de Treino Atual</h3>
                      <span className="p-card-meta">Objetivo: 30 Treinos</span>
                    </div>
                    <div className="cycle-progress-wrap">
                      <div className="cycle-info">
                        <div className="cycle-count">
                          <span id="cycleDone">{cycleDone}</span>
                          <small>/30</small>
                        </div>
                        <div
                          className="cycle-status"
                          id="cycleStatus"
                          style={{
                            color: cycleStatus.color,
                            background: cycleStatus.background,
                          }}
                        >
                          {cycleStatus.text}
                        </div>
                      </div>
                      <div className="cycle-xp-bar">
                        <div
                          className="cycle-xp-fill"
                          id="cycleFill"
                          style={{ width: `${cyclePct}%` }}
                        />
                        <div className="cycle-xp-glow" />
                      </div>
                      <div className="cycle-breakdown" id="cycleBreakdown">
                        {breakdownItems.length > 0 ? (
                          breakdownItems.map((letter) => (
                            <div className="cb-item" key={letter}>
                              <span className="cb-label">TREINO {letter}:</span>
                              <span className="cb-val">{cycleBreakdown[letter] || 0}</span>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                            Nenhum treino iniciado neste ciclo.
                          </p>
                        )}
                      </div>
                      <p className="cycle-msg">
                        Complete 30 treinos para finalizar este ciclo, arquivar sua ficha atual e
                        ganhar uma insígnia de mestre.
                      </p>
                    </div>
                  </div>

                  <div className="cal-ov__timeline">
                    <div className="cal-ov__tl-head">
                      <h3 className="cal-ov__section-title">Linha do ciclo</h3>
                      <div className="cal-ov__tl-legend" aria-hidden="true">
                        <span className="cal-ov__tl-legend-item">
                          <span className="cal-ov__tl-dot cal-ov__tl-dot--done" />
                          Feito
                        </span>
                        <span className="cal-ov__tl-legend-item">
                          <span className="cal-ov__tl-dot cal-ov__tl-dot--pending" />
                          Pendente
                        </span>
                      </div>
                    </div>

                    {/* Abertura do ciclo (posição 0) — mesmo dado da lista 1..30 */}
                    {cycleTimeline
                      .filter((item) => item.status === 'start')
                      .map((item) => (
                        <div className="cal-ov__tl-start" key={item.index}>
                          <span className="cal-ov__tl-start-badge">INÍCIO</span>
                          <span className="cal-ov__tl-start-date">
                            {item.date
                              ? new Date(`${item.date}T12:00:00`).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </span>
                        </div>
                      ))}

                    {/* Todos os 30 treinos do ciclo de uma vez: grade compacta
                        (antes eram 31 linhas altas que empurravam o calendário
                        para fora da tela). */}
                    <ol className="cal-ov__tl-grid">
                      {cycleTimeline
                        .filter((item) => item.status !== 'start')
                        .map((item) => {
                          const dateLabel = item.date
                            ? new Date(`${item.date}T12:00:00`).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                              })
                            : null;
                          const title =
                            item.status === 'done'
                              ? `Treino ${item.sheetKey ?? ''} · ${dateLabel ?? ''}${
                                  item.durationMin
                                    ? ` · ${formatSeconds(item.durationMin * 60)}`
                                    : ''
                                }`
                              : 'Ainda não realizado';
                          return (
                            <li key={item.index}>
                              <button
                                type="button"
                                className={`cal-ov__tl-cell cal-ov__tl-cell--${item.status}`}
                                title={title}
                                aria-label={`Treino ${String(item.index).padStart(2, '0')}: ${title}`}
                                disabled={!item.date}
                                onClick={() => {
                                  if (item.date) setSelectedDate(item.date);
                                }}
                              >
                                <span className="cal-ov__tl-num">
                                  {String(item.index).padStart(2, '0')}
                                </span>
                                <span className="cal-ov__tl-letter">
                                  {item.status === 'done' ? (item.sheetKey ?? '✓') : '—'}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                    </ol>

                    <p className="cal-ov__tl-summary">
                      {cycleDone} de 30 treinos concluídos · {Math.max(0, 30 - cycleDone)}{' '}
                      restantes
                      {cycleDone > 0 ? ' · toque num dia verde para ver o registro' : ''}
                    </p>
                  </div>
                </section>

                {/* Calendário (Mensal grid / Semanal planner) */}
                <div className="cal-ov__calendar" ref={calendarBlockRef}>
                  <h3 className="cal-ov__section-title">Calendário</h3>
                  <div className="calendar-view-toggle">
                    <button
                      type="button"
                      className={`cal-toggle-btn ${calView === 'monthly' ? 'active' : ''}`}
                      data-view="monthly"
                      id="btnMonthlyView"
                      onClick={() => setCalView('monthly')}
                    >
                      Mensal (Grid)
                    </button>
                    <button
                      type="button"
                      className={`cal-toggle-btn ${calView === 'weekly' ? 'active' : ''}`}
                      data-view="weekly"
                      id="btnWeeklyView"
                      onClick={() => setCalView('weekly')}
                    >
                      Semanal (Planner)
                    </button>
                  </div>
                </div>

                <div
                  className="p-card month-calendar-card"
                  ref={monthlyCardRef}
                  id="monthlyCalendarCard"
                  style={{ display: calView === 'monthly' ? 'block' : 'none' }}
                >
                  <div className="month-header">
                    <button
                      type="button"
                      className="cal-nav-btn"
                      id="prevMonth"
                      aria-label="Mês anterior"
                      disabled={prevDisabled}
                      onClick={() => shiftMonth(-1)}
                    >
                      ❮
                    </button>
                    <h3 id="calendarMonthName">{monthNameCell}</h3>
                    <button
                      type="button"
                      className="cal-nav-btn"
                      id="nextMonth"
                      aria-label="Próximo mês"
                      onClick={() => shiftMonth(1)}
                    >
                      ❯
                    </button>
                  </div>
                  <div className="month-grid-header">
                    {getWeekDayLabels(firstDay).map((label, i) => (
                      <span key={i}>{label[0]}</span>
                    ))}
                  </div>
                  <div className="month-grid" id="monthCalendar" ref={monthCalRef}>
                    {monthCells.map((cell, i) =>
                      cell.levelCls === 'empty' ? (
                        <div className="month-day empty" key={`e${i}`} />
                      ) : (
                        <div
                          key={cell.dateStr}
                          className={`month-day ${cell.levelCls} ${
                            cell.isToday ? 'today' : ''
                          } ${selectedDate === cell.dateStr ? 'selected' : ''}`}
                          data-date={cell.dateStr}
                          style={{ cursor: cell.hasHistory ? 'pointer' : undefined }}
                          onClick={() => {
                            if (cell.hasHistory) setSelectedDate(cell.dateStr);
                          }}
                        >
                          <span className="day-num">{cell.day}</span>
                          {cell.eventLabel && (
                            <div className="day-event-dot" title={cell.eventLabel} />
                          )}
                          {cell.durationMin ? (
                            <div className="day-duration-chip">{cell.durationMin} min</div>
                          ) : null}
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div
                  className="p-card weekly-planner-card"
                  ref={weeklyCardRef}
                  id="weeklyPlannerCard"
                  style={{ display: calView === 'weekly' ? 'block' : 'none' }}
                >
                  <div className="planner-header">
                    <button
                      type="button"
                      className="cal-nav-btn"
                      id="prevWeekMonth"
                      aria-label="Mês anterior"
                      disabled={prevDisabled}
                      onClick={() => shiftMonth(-1)}
                    >
                      ❮
                    </button>
                    <h3 id="plannerMonthName">{monthNameCell}</h3>
                    <button
                      type="button"
                      className="cal-nav-btn"
                      id="nextWeekMonth"
                      aria-label="Próximo mês"
                      onClick={() => shiftMonth(1)}
                    >
                      ❯
                    </button>
                  </div>
                  <div className="planner-weeks" id="weeklyPlanner" ref={plannerRef}>
                    {plannerWeeks.map((week, idx) => (
                      <div className="planner-week" key={idx}>
                        <div className="planner-week-title">
                          <span>SEMANA {idx + 1}</span>
                          <span>
                            {week[0].dateLabel} - {week[week.length - 1].dateLabel}
                          </span>
                        </div>
                        <div className="planner-week-content">
                          {week
                            .filter((d) => d.dayOfWeek !== 0 || d.treinos.length > 0)
                            .map((d) => (
                              <div
                                className={`planner-day-row ${d.isToday ? 'is-today' : ''}`}
                                key={d.dateStr}
                              >
                                <div className="planner-date-box">
                                  <span className="planner-weekday">{d.weekday}</span>
                                  <span className="planner-daynum">{d.dateLabel}</span>
                                </div>
                                <div className="planner-workouts">
                                  {d.treinos.length > 0 ? (
                                    d.treinos.map((letter) => (
                                      <span className="planner-workout-badge" key={letter}>
                                        {letter}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="planner-workout-badge empty">Descanso</span>
                                  )}
                                  {d.treinos.length > 0 && d.durationMin ? (
                                    <span className="planner-time">
                                      <i className="fas fa-stopwatch" />{' '}
                                      {formatSeconds(d.durationMin * 60)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ===== Volume de carga geral (v4.56.3) ===== */}
      {volumeOverviewPresence.mounted &&
        toBody(
          <div
            className={`modal-overlay ${volumeOverviewPresence.closing ? 'is-closing' : ''}`}
            id="modalVolumeOverview"
            role="dialog"
            aria-modal="true"
            aria-labelledby="volOverviewTitle"
            onClick={() => setVolumeOverviewOpen(false)}
          >
            <div className="vol-detail vol-detail--overview" onClick={(e) => e.stopPropagation()}>
              <header className="vol-detail__header">
                <div>
                  <span className="vol-detail__eyebrow">Detalhes</span>
                  <h2 className="vol-detail__title" id="volOverviewTitle">
                    Volume de Carga
                  </h2>
                </div>
                <button
                  type="button"
                  className="vol-detail__close"
                  onClick={() => setVolumeOverviewOpen(false)}
                  aria-label="Fechar volume de carga"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </header>
              <div className="vol-detail__body">
                <div className="vol-detail__chart-head">
                  <h3 className="vol-detail__chart-title">Distribuição por grupo muscular</h3>
                  <select
                    className="prog-select"
                    aria-label="Período do volume de carga"
                    value={volumeMode}
                    onChange={(e) => setVolumeMode(e.target.value)}
                  >
                    <option value="7">Últimos 7 dias</option>
                    <option value="30">Últimos 30 dias</option>
                    <option value="all">Total da vida</option>
                  </select>
                </div>
                <VolumeBreakdown
                  entries={volume.entries}
                  total={volume.total}
                  mode={volumeMode}
                  onOpenGroup={(group) => {
                    setVolumeOverviewOpen(false);
                    openVolumeDetail(group);
                  }}
                />
                <p className="vol-overview__hint">
                  Toque em um grupo muscular para ver a evolução de carga e os exercícios.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* ===== Tendências de Treino / Radar Fit (v4.56.3) ===== */}
      <TrendRadarOverlay
        open={trendRadarOpen}
        onClose={() => setTrendRadarOpen(false)}
        onOpenGuide={() => setShowRadarGuide(true)}
        guideOpen={showRadarGuide}
      />
    </div>
  );
};

/** Gradiente cônico do donut de volume (espelha renderVolumeSemanal). */
function buildConicGradient(entries: VolumeEntry[], total: number): string {
  const stops: string[] = [];
  let pct = 0;
  let idx = 0;
  for (const entry of entries) {
    if (entry.vol <= 0 || total <= 0) continue;
    const slice = (entry.vol / total) * 100;
    const color = VOLUME_COLORS[idx % VOLUME_COLORS.length];
    stops.push(`${color} ${pct}% ${pct + slice}%`);
    pct += slice;
    idx += 1;
  }
  return stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : 'rgba(255,255,255,0.1)';
}
