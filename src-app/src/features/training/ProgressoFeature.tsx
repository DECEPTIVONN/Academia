/**
 * ProgressoFeature.tsx — Seção Progresso (port 1:1 de `componentes/secoes/progresso.html`
 * + `JS/treino/secao-progresso.js`)
 *
 * Emite o DOM/classes legados (.p-card, cycle-card, streak, semana, calendário
 * mensal/semanal, stats, volume donut, radar real (Fase 3), calculadora 1RM) e
 * calcula tudo a partir de `useLocalData` + `legacyState` (ciclo, cycleEvents).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocalData } from '@/hooks/useLocalData';
import { fadeIn } from '@/lib/animations';
import {
  SHEET_ORDER,
  getExerciseMap,
  getStreak,
  pickExercises,
  today,
  type SheetKey,
} from '@/core/db/queries';
import type { Exercise, WorkoutHistory } from '@/core/db/schema';
import { RadarChart } from '@/features/gamification/RadarChart';
import { useRadarMode } from '@/features/gamification/useRadarFit';
import { useShareStore } from '@/features/gamification/share-store';
import { buildVolumeLineChartSvg } from './volume-line-chart';
import {
  convertKgToDisplay,
  getFirstDayOfWeek,
  getWeekDayLabels,
  getWeightUnit,
  type FirstDayOfWeek,
  type WeightUnit,
} from '@/lib/app-prefs';

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

/** Data local YYYY-MM-DD (legado usa toISOString — equivalente no fuso BR). */
function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

/** Espelha `formatSeconds` (db.js). */
function formatSeconds(seconds: number): string {
  if (!seconds) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Letras concluídas de um dia (legado: `treinos[]` com fallback em `treino`). */
function keysOfDay(row: WorkoutHistory | undefined): string[] {
  if (!row) return [];
  if (row.completedKeys?.length) return row.completedKeys;
  if (row.completed && row.sheetKey) return [row.sheetKey];
  return [];
}

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
  const unit = getWeightUnit();
  const value = convertKgToDisplay(kg, unit);
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}T`;
  return `${Math.round(value)}${unit}`;
}

/** Volume de um exercício (espelha `renderVolumeSemanal`). */
function exerciseVolume(ex: Exercise): number {
  const s = parseInt(String(ex.sets), 10) || 0;
  const r = parseInt(String(ex.reps), 10) || 0;
  const c =
    parseFloat(String(ex.load).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  const multi = ex.porLado ? 2 : 1;
  return s * r * c * multi;
}

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

/* ── Feature ── */

export const ProgressoFeature: React.FC = () => {
  const { exercises, sheets, history, legacy } = useLocalData();

  const [calView, setCalView] = useState<CalView>('monthly');
  const [viewDate, setViewDate] = useState(() => new Date());
  const [volumeMode, setVolumeMode] = useState('7');
  const [calcWeight, setCalcWeight] = useState('');
  const [calcReps, setCalcReps] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  /* Modo do radar global (legado: currentRadarMode compartilhado) */
  const radarMode = useRadarMode((s) => s.mode);
  const setRadarMode = useRadarMode((s) => s.setMode);
  const [showRadarGuide, setShowRadarGuide] = useState(false);
  const [firstDay, setFirstDay] = useState<FirstDayOfWeek>(() => getFirstDayOfWeek());
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => getWeightUnit());

  useEffect(() => {
    const syncPrefs = () => {
      setFirstDay(getFirstDayOfWeek());
      setWeightUnit(getWeightUnit());
    };
    window.addEventListener('academia:prefs-changed', syncPrefs);
    return () => window.removeEventListener('academia:prefs-changed', syncPrefs);
  }, []);

  /* Containers animados com fadeIn (secao-progresso.js L115/L258/L402/L586) */
  const weekDaysRef = useRef<HTMLDivElement>(null);
  const monthCalRef = useRef<HTMLDivElement>(null);
  const plannerRef = useRef<HTMLDivElement>(null);
  const volumeChartRef = useRef<HTMLDivElement>(null);
  const monthlyCardRef = useRef<HTMLDivElement>(null);
  const weeklyCardRef = useRef<HTMLDivElement>(null);

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
    const temEx = (sheet?.exerciseIds?.length ?? 0) > 0;
    const temCardio = Boolean(sheet?.aerobic?.tipo);
    return cycleBreakdown[key] > 0 || temEx || temCardio;
  });
  const cycleStatus =
    cyclePct >= 100
      ? { text: 'CICLO COMPLETO', color: '#fff', background: 'var(--gym-green)' }
      : cyclePct >= 70
        ? { text: 'RETA FINAL', color: '#fff', background: '#8b5cf6' }
        : { text: 'EM ANDAMENTO', color: undefined, background: undefined };

  /* ===== Sua Semana (respeita o primeiro dia configurado) ===== */
  const weekDays = useMemo(() => {
    const now = TODAY_BASE;
    const start = new Date(now);
    if (firstDay === 'sunday') {
      start.setDate(now.getDate() - now.getDay());
    } else {
      start.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    }
    return getWeekDayLabels(firstDay).map((label, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = fmtDate(d);
      return { label, dateStr, done: Boolean(histMap.get(dateStr)?.completed) };
    });
  }, [histMap, firstDay]);
  const weekTrainedCount = weekDays.filter((d) => d.done).length;

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
  const [volumeDetailGroup, setVolumeDetailGroup] = useState<string | null>(null);

  const volumeDetail = useMemo(() => {
    if (!volumeDetailGroup) return null;
    const entry = volume.entries.find((e) => e.group === volumeDetailGroup);
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
            if (ex.muscleGroup === volumeDetailGroup) dayVol += exerciseVolume(ex);
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
  }, [volumeDetailGroup, volumeMode, volume, histMap, sheetMap, exMap]);

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
  }, [monthCells]);

  useEffect(() => {
    fadeIn(plannerRef.current);
    fadeIn(weekDaysRef.current);
  }, [plannerWeeks]);

  useEffect(() => {
    fadeIn(volumeChartRef.current);
  }, [volume]);

  /* app.js L108-130: alternar mensal/semanal mostra o card com fadeIn
     (e o toggle semanal também re-renderiza o planner) */
  useEffect(() => {
    fadeIn(calView === 'monthly' ? monthlyCardRef.current : weeklyCardRef.current);
    if (calView === 'weekly') {
      fadeIn(plannerRef.current);
      fadeIn(weekDaysRef.current);
    }
  }, [calView]);

  /* ===== Calculadora 1RM (Brzycki) ===== */
  const rmWeight = parseFloat(calcWeight);
  const rmReps = parseFloat(calcReps);
  const rmResult =
    rmWeight > 0 && rmReps > 0
      ? Math.round(rmWeight / (1.0278 - 0.0278 * rmReps))
      : '--';

  /* ===== Modal do dia ===== */
  const dayRow = selectedDate ? histMap.get(selectedDate) : undefined;
  const dayKeys = keysOfDay(dayRow);

  /* openModal legado (secao-ficha.js L560–568): trava o scroll do body enquanto
   um modal da seção está aberto e restaura o valor anterior no fechamento. */
  const anyProgressModalOpen =
    Boolean(selectedDate && dayRow) || Boolean(volumeDetailGroup) || showRadarGuide;
  useEffect(() => {
    if (!anyProgressModalOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [anyProgressModalOpen]);

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
          {/* ===== Ciclo de Treino ===== */}
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
                <div className="cycle-xp-fill" id="cycleFill" style={{ width: `${cyclePct}%` }} />
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
                Complete 30 treinos para finalizar este ciclo, arquivar sua ficha atual e ganhar
                uma insígnia de mestre.
              </p>
            </div>
          </div>

          <div className="progresso-grid">
            {/* ===== Ofensiva ===== */}
            <div className="p-card streak-card">
              <div
                className="streak-icon"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(249,115,22,0.1)',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  color: '#f97316',
                }}
              >
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
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              </div>
              <div className="streak-info">
                <h3>
                  <span id="progStreakVal">{streak}</span> Dias Seguidos!
                </h3>
                <p>Continue treinando para não perder sua ofensiva.</p>
              </div>
            </div>

            {/* ===== Sua Semana ===== */}
            <div className="p-card weekly-summary-card">
              <div className="ws-header">
                <h3>Sua Semana</h3>
                <div className="ws-badge">
                  <span id="weekTrainedCount">{weekTrainedCount}</span> dias treinados
                </div>
              </div>
              <div className="ws-days" id="weekDaysGrid" ref={weekDaysRef}>
                {weekDays.map((d) => (
                  <div className="ws-day-item" key={d.dateStr}>
                    <span className="ws-day-label">{d.label}</span>
                    <div className={`ws-day-circle ${d.done ? 'completed' : ''}`}>
                      <span className="check">✓</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ===== Toggle calendário ===== */}
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

            {/* ===== Calendário mensal ===== */}
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
                      className={`month-day ${cell.levelCls} ${cell.isToday ? 'today' : ''} ${
                        selectedDate === cell.dateStr ? 'selected' : ''
                      }`}
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

            {/* ===== Planner semanal ===== */}
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
                                  <i className="fas fa-stopwatch" /> {formatSeconds(d.durationMin * 60)}
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

            {/* ===== Stats ===== */}
            <div className="p-card stats-card">
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

            {/* ===== Volume de Carga ===== */}
            <div className="p-card volume-card">
              <div
                className="p-card-header"
                style={{
                  flexWrap: 'wrap',
                  gap: 10,
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width={18}
                    height={18}
                    style={{ color: 'var(--primary)' }}
                  >
                    <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11" />
                    <circle cx={4} cy={12} r={1.5} />
                    <circle cx={20} cy={12} r={1.5} />
                  </svg>
                  Volume de Carga
                </h3>
                <select
                  id="filterVolume"
                  value={volumeMode}
                  onChange={(e) => setVolumeMode(e.target.value)}
                  style={{
                    padding: '4px 28px 4px 12px',
                    fontSize: '.75rem',
                    borderRadius: 12,
                    backgroundColor: '#111',
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '12px',
                    color: '#ffffff',
                    border: '1px solid var(--card-border)',
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                >
                  <option value="7" style={{ background: '#1a1a1a', color: '#ffffff' }}>
                    Últimos 7 dias
                  </option>
                  <option value="30" style={{ background: '#1a1a1a', color: '#ffffff' }}>
                    Últimos 30 dias
                  </option>
                  <option value="all" style={{ background: '#1a1a1a', color: '#ffffff' }}>
                    Total da Vida
                  </option>
                </select>
              </div>
              <div className="volume-chart" id="volumeChart" ref={volumeChartRef}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: 160,
                        height: 160,
                        borderRadius: '50%',
                        background:
                          volume.entries.some((e) => e.vol > 0)
                            ? buildConicGradient(volume.entries, volume.total)
                            : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 25,
                          left: 25,
                          right: 25,
                          bottom: 25,
                          background: '#1e293b',
                          borderRadius: '50%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            fontFamily: "'Rajdhani', sans-serif",
                          }}
                        >
                          {formatT(volume.total)}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                          TOTAL
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      flex: 1,
                      minWidth: 150,
                      maxHeight: 250,
                      overflowY: 'auto',
                      paddingRight: 5,
                    }}
                    className="custom-scroll"
                  >
                    {volume.entries.map((entry, i) => {
                      const zero = entry.vol === 0;
                      const color = zero
                        ? 'rgba(255,255,255,0.2)'
                        : VOLUME_COLORS[i % VOLUME_COLORS.length];
                      const trend = trendInfo(entry, volumeMode);
                      return (
                        <div
                          key={entry.group}
                          role="button"
                          tabIndex={0}
                          onClick={() => setVolumeDetailGroup(entry.group)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setVolumeDetailGroup(entry.group);
                            }
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: '0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                background: color,
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                ...(zero ? { color: 'var(--text-tertiary)' } : {}),
                              }}
                            >
                              {entry.group}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontWeight: 'bold',
                                ...(zero
                                  ? { color: 'var(--text-tertiary)', opacity: 0.5 }
                                  : {}),
                              }}
                            >
                              {formatT(entry.vol)}
                            </div>
                            <div
                              style={{
                                fontSize: '0.65rem',
                                color: trend.color,
                              }}
                              dangerouslySetInnerHTML={{ __html: trend.label }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <p
                style={{
                  fontSize: '.75rem',
                  color: 'var(--text-tertiary)',
                  marginTop: 15,
                  textAlign: 'center',
                }}
              >
                Total {weightUnit} levantados por grupo muscular.
              </p>
            </div>

            {/* ===== Radar Fit (real — Fase 3) ===== */}
            <div className="p-card radar-card">
              <div className="p-card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3>Atributos de Performance</h3>
                  <button
                    type="button"
                    onClick={() => setShowRadarGuide(true)}
                    style={{
                      background: 'rgba(255,255,255,.1)',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '.7rem',
                      cursor: 'pointer',
                      transition: '.3s',
                      fontWeight: 'bold',
                    }}
                  >
                    ?
                  </button>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 5,
                    background: 'rgba(255,255,255,.05)',
                    padding: 4,
                    borderRadius: 8,
                  }}
                >
                  <button
                    type="button"
                    className={`btn btn-sm ${radarMode === 'mensal' ? 'active' : ''}`}
                    id="btnRadarMensal"
                    onClick={() => setRadarMode('mensal')}
                    style={{
                      padding: '4px 12px',
                      fontSize: '.7rem',
                      borderRadius: 6,
                      background: radarMode === 'mensal' ? 'var(--primary)' : 'transparent',
                      color: radarMode === 'mensal' ? '#000' : 'var(--text-secondary)',
                      border: 'none',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: '.3s',
                    }}
                  >
                    MENSAL
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${radarMode === 'total' ? 'active' : ''}`}
                    id="btnRadarTotal"
                    onClick={() => setRadarMode('total')}
                    style={{
                      padding: '4px 12px',
                      fontSize: '.7rem',
                      borderRadius: 6,
                      background: radarMode === 'total' ? 'var(--primary)' : 'transparent',
                      color: radarMode === 'total' ? '#000' : 'var(--text-secondary)',
                      border: 'none',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: '.3s',
                    }}
                  >
                    TOTAL
                  </button>
                </div>
              </div>
              <RadarChart
                containerId="radarChartContainer"
                gradientId="radarGrad"
                style={{
                  width: '100%',
                  minHeight: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 20,
                }}
              />
              <p
                style={{
                  fontSize: '.75rem',
                  color: 'var(--text-tertiary)',
                  marginTop: 15,
                  textAlign: 'center',
                }}
              >
                Baseado na variedade, intensidade e consistência do seu treino.
              </p>
              <div id="radarShareBtnContainer" style={{ textAlign: 'center', marginTop: 15 }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => useShareStore.getState().openRadar()}
                  style={{
                    border: '1px solid var(--primary)',
                    color: 'var(--primary-light)',
                    background: 'rgba(255,255,255,.05)',
                    padding: '6px 16px',
                    borderRadius: 20,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: '.8rem',
                    transition: '.3s',
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width={14}
                    height={14}
                    style={{ marginRight: 4 }}
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1={12} y1={2} x2={12} y2={15} />
                  </svg>{' '}
                  COMPARTILHAR RADAR
                </button>
              </div>
            </div>

            {/* ===== Calculadora 1RM ===== */}
            <div className="p-card calculator-card">
              <div className="p-card-header">
                <h3>Calculadora de 1RM</h3>
                <span className="p-card-meta">Estimativa</span>
              </div>
              <p style={{ fontSize: '.85rem', marginBottom: 15 }}>
                Calcule o peso máximo que você conseguiria levantar para 1 repetição.
              </p>
              <div className="calc-row">
                <div className="form-group">
                  <label>Carga ({weightUnit})</label>
                  <input
                    type="number"
                    id="calcWeight"
                    placeholder="Ex: 80"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Reps</label>
                  <input
                    type="number"
                    id="calcReps"
                    placeholder="Ex: 10"
                    value={calcReps}
                    onChange={(e) => setCalcReps(e.target.value)}
                  />
                </div>
              </div>
              <div className="calc-result" id="calcResult">
                <div className="res-val">{rmResult}</div>
                <div className="res-lbl">{weightUnit} Estimados</div>
              </div>
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
      {toBody(<div
        className="modal-overlay"
        id="modalVolumeDetails"
        style={{ display: volumeDetail ? 'flex' : 'none' }}
        role="dialog"
        aria-modal="true"
        aria-hidden={!volumeDetail}
      >
        <div className="modal-content" style={{ maxWidth: 500 }}>
          <div className="modal-header">
            <h2>
              Volume: <span id="volDetGroup">{volumeDetail?.entry.group ?? ''}</span>
            </h2>
            <button
              type="button"
              className="close-modal"
              id="btnFecharVolumeDetails"
              aria-label="Fechar"
              onClick={() => setVolumeDetailGroup(null)}
            >
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 15,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    fontFamily: "'Rajdhani', sans-serif",
                  }}
                  id="volDetTotal"
                >
                  {volumeDetail ? formatT(volumeDetail.entry.vol) : `0${weightUnit}`}
                </div>
                <div
                  style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}
                  id="volDetAvg"
                >
                  Média: {volumeDetail ? formatT(volumeDetail.avgVol) : `0${weightUnit}`}
                </div>
              </div>
              <div
                id="volDetTrend"
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: 4,
                  display: volumeDetail?.showTrend ? 'inline-block' : 'none',
                  color: volumeDetail?.trend.color,
                }}
                dangerouslySetInnerHTML={{ __html: volumeDetail?.trend.label ?? '' }}
              />
            </div>

            {/* Container do Gráfico (renderVolumeLineChart injeta o SVG) */}
            <div id="volDetChartContainer" style={{ height: 160, marginBottom: 20 }} />

            {/* Lista de Exercícios */}
            <h3
              style={{
                marginBottom: 10,
                fontSize: '1rem',
                color: 'var(--text-secondary)',
              }}
            >
              Exercícios do Grupo
            </h3>
            <div
              id="volDetList"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                maxHeight: 200,
                overflowY: 'auto',
                paddingRight: 5,
              }}
              className="custom-scroll"
            >
              {volumeDetail && volumeDetail.exNames.length > 0 ? (
                volumeDetail.exNames.map((name) => {
                  const exVol = volumeDetail.entry.breakdown[name];
                  const pct = ((exVol / volumeDetail.entry.vol) * 100).toFixed(0);
                  return (
                    <div
                      key={name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 10,
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 6,
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                          {pct}% do grupo
                        </span>
                      </div>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary-light)' }}>
                        {formatT(exVol)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p
                  style={{
                    textAlign: 'center',
                    padding: 20,
                    color: 'var(--text-tertiary)',
                    fontSize: '0.85rem',
                  }}
                >
                  Nenhum exercício registrado neste período.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>)}

      {/* ===== MODAL: GUIA DO RADAR (modais.html L649–737) ===== */}
      {toBody(<div
        className="modal-overlay"
        id="modalRadarGuide"
        style={{ display: showRadarGuide ? 'flex' : 'none' }}
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
              O <b>Radar Fit</b> analisa seus treinos dos últimos 30 dias (Mensal) ou todo o
              histórico (Total) para gerar seu perfil de atleta:
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
