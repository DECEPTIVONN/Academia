/**
 * OfensivasOverlay.tsx — Central de Ofensivas ("Sequências")
 *
 * Tela cheia aberta pela aba Progresso (card de ofensiva): mostra a sequência
 * em SEMANAS que bateram a meta, o resumo da semana atual, a constância em
 * DIAS e a classificação (sequência semana a semana ou treinos do mês).
 *
 * Ícones: SVG `stroke="currentColor"` via lucide-react (Diretrizes/Ícones.md).
 * Monta por `createPortal(document.body)` (o `.section-strip` tem
 * `will-change: transform` e vira containing block do `position: fixed`).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Flame,
  Info,
  Users,
} from 'lucide-react';
import { useModalPresence, usePresenceValue } from '@/hooks/useModalPresence';
import { getStreak, today, type LocalData } from '@/core/db/queries';
import { getFirstDayOfWeek, getWeekDayLabels } from '@/lib/app-prefs';
import {
  getMaxDayStreak,
  getWeekStreak,
  getWeekSummary,
  keysOfDay,
  fmtDateLocal,
  parseDateLocal,
  seriesOfDay,
  trainedDays,
  type SheetMap,
  type ExerciseMap,
} from './progress-stats';
import './ofensivas.css';

const toBody = (node: React.ReactNode) => createPortal(node, document.body);

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

type SheetId = 'week' | 'bestStreak' | 'consistency' | 'bestConsistency';

interface OfensivasOverlayProps {
  open: boolean;
  onClose: () => void;
  data: LocalData;
  /** Meta de dias por semana (onboarding/estatísticas). */
  target: number;
  /** Abre o calendário da aba Progresso (Mensal/Semanal, inalterado). */
  onOpenCalendar: () => void;
  /** Compartilhar convite de amigo (fluxo do Social). */
  onInvite: () => void;
}

export const OfensivasOverlay: React.FC<OfensivasOverlayProps> = ({
  open,
  onClose,
  data,
  target,
  onOpenCalendar,
  onInvite,
}) => {
  const { mounted, closing } = useModalPresence(open);
  const [tab, setTab] = useState<'streak' | 'workouts'>('streak');
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [monthPicker, setMonthPicker] = useState(false);
  const [sheetId, setSheetId] = useState<SheetId | null>(null);
  const [firstDay, setFirstDay] = useState(() => getFirstDayOfWeek());

  /* v4.72.1 — troca de aba em duas fases: o painel atual sai (fade + subida
     curta) e só depois o novo entra, evitando o corte seco entre Sequência
     Atual e Treinos. */
  const [tabLeaving, setTabLeaving] = useState(false);
  const tabTimer = useRef<number | null>(null);
  const changeTab = (next: 'streak' | 'workouts') => {
    if (next === tab || tabLeaving) return;
    setTabLeaving(true);
    tabTimer.current = window.setTimeout(() => {
      tabTimer.current = null;
      setTab(next);
      setTabLeaving(false);
    }, 150);
  };
  useEffect(
    () => () => {
      if (tabTimer.current !== null) window.clearTimeout(tabTimer.current);
    },
    []
  );

  /* Folha de informações: mantém o conteúdo na tela durante a saída animada
     (`usePresenceValue` guarda o último id durante MODAL_EXIT_MS). */
  const sheetPresence = usePresenceValue(sheetId);

  useEffect(() => {
    const sync = () => setFirstDay(getFirstDayOfWeek());
    window.addEventListener('academia:prefs-changed', sync);
    return () => window.removeEventListener('academia:prefs-changed', sync);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const t = today();
  const exMap: ExerciseMap = useMemo(
    () => new Map(data.exercises.map((ex) => [ex.id, ex])),
    [data.exercises]
  );
  const sheetMap: SheetMap = useMemo(
    () => new Map(data.sheets.map((s) => [s.sheetKey, s])),
    [data.sheets]
  );
  const histMap = useMemo(() => new Map(data.history.map((h) => [h.date, h])), [data.history]);
  const days = useMemo(() => trainedDays(data.history), [data.history]);

  const weeks = useMemo(
    () => getWeekStreak(days, firstDay, target, t),
    [days, firstDay, target, t]
  );
  const week = useMemo(
    () => getWeekSummary(data.history, firstDay, target, exMap, sheetMap, t),
    [data.history, firstDay, target, exMap, sheetMap, t]
  );
  const dayStreak = useMemo(() => getStreak(data.history), [data.history]);
  const bestConsistency = useMemo(() => getMaxDayStreak(days), [days]);

  const recentWeeks = weeks.weeks.slice(0, 8).slice().reverse();

  const month = useMemo(() => {
    const year = monthCursor.getFullYear();
    const m = monthCursor.getMonth();
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const firstWeekday = new Date(year, m, 1).getDay();
    const emptySlots = firstDay === 'sunday' ? firstWeekday : firstWeekday === 0 ? 6 : firstWeekday - 1;
    const labels = getWeekDayLabels(firstDay).map((l) => l[0]);

    const cells: {
      dateStr: string;
      day: number;
      trained: boolean;
      series: number;
      workouts: number;
      isToday: boolean;
      future: boolean;
    }[] = [];
    let trainedCount = 0;
    let seriesTotal = 0;
    let workoutsTotal = 0;

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = fmtDateLocal(new Date(year, m, day));
      const row = histMap.get(dateStr);
      const trained = Boolean(row && (row.completed || keysOfDay(row).length > 0));
      const series = seriesOfDay(row, exMap, sheetMap);
      const workouts = keysOfDay(row).length;
      if (trained) trainedCount += 1;
      seriesTotal += series;
      workoutsTotal += workouts;
      cells.push({
        dateStr,
        day,
        trained,
        series,
        workouts,
        isToday: dateStr === t,
        future: dateStr > t,
      });
    }

    return {
      year,
      month: m,
      name: MONTH_NAMES[m],
      emptySlots,
      labels,
      cells,
      trainedCount,
      seriesTotal,
      workoutsTotal,
    };
  }, [monthCursor, firstDay, histMap, exMap, sheetMap, t]);

  const shiftMonth = (delta: number) =>
    setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));

  const weekLabel = (dateStr: string) => {
    const d = parseDateLocal(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const sheet = (() => {
    switch (sheetPresence.value) {
      case 'week':
        return {
          title: 'Treinos esta semana',
          value: `${week.done} / ${target}`,
          text: `Você treinou ${week.done} de ${target} dias nesta semana. A meta semanal mantém a ofensiva viva.`,
        };
      case 'bestStreak':
        return {
          title: 'Melhor sequência',
          value: String(weeks.best),
          text: 'Maior número de semanas seguidas em que a meta de dias foi batida.',
        };
      case 'consistency':
        return {
          title: 'Sequência de consistência',
          value: String(dayStreak),
          text: 'Dias consecutivos com treino registrado (a ofensiva de dias).',
        };
      case 'bestConsistency':
        return {
          title: 'Melhor consistência',
          value: String(bestConsistency),
          text: 'Maior sequência de dias consecutivos treinados do seu histórico.',
        };
      default:
        return null;
    }
  })();

  if (!mounted) return null;

  return toBody(
    <div
      className={`of-root ${closing ? 'is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Central de Ofensivas"
    >
      <header className="of-head">
        <button type="button" className="of-icon-btn" onClick={onClose} aria-label="Voltar">
          <ArrowLeft size={18} />
        </button>
        <h2 className="of-head__title">Sequências</h2>
        <span className="of-chip" title={`Ofensiva de ${dayStreak} dia(s)`}>
          <Flame size={14} />
          {dayStreak}
        </span>
      </header>

      <div className="of-scroll">
        {/* ── Hero: semanas de sequência ── */}
        <div className="of-hero">
          <span className="of-hero__flame" aria-hidden="true">
            <Flame size={44} strokeWidth={1.6} />
          </span>
          <span className="of-hero__value">{weeks.current}</span>
          <span className="of-hero__title">Semanas De Sequência</span>
          <span className="of-hero__sub">{target} dias / semana</span>
        </div>

        {/* ── Estatísticas ── */}
        <div className="of-stats">
          <div className="of-stat">
            <span className="of-stat__label">Treinos esta semana</span>
            <div className="of-stat__row">
              <span className="of-stat__value">
                {week.done} / {target}
              </span>
              <button
                type="button"
                className="of-stat__info"
                aria-label="O que é treinos esta semana"
                onClick={() => setSheetId('week')}
              >
                <Info size={14} />
              </button>
            </div>
          </div>

          <div className="of-stat">
            <span className="of-stat__label">Melhor sequência</span>
            <div className="of-stat__row">
              <span className="of-stat__value">{weeks.best}</span>
              <button
                type="button"
                className="of-stat__info"
                aria-label="O que é melhor sequência"
                onClick={() => setSheetId('bestStreak')}
              >
                <Info size={14} />
              </button>
            </div>
          </div>

          <div className="of-stat">
            <span className="of-stat__label">Sequência de consistência</span>
            <div className="of-stat__row">
              <span className="of-stat__value">{dayStreak}</span>
              <button
                type="button"
                className="of-stat__info"
                aria-label="O que é sequência de consistência"
                onClick={() => setSheetId('consistency')}
              >
                <Info size={14} />
              </button>
            </div>
          </div>

          <div className="of-stat">
            <span className="of-stat__label">Melhor consistência</span>
            <div className="of-stat__row">
              <span className="of-stat__value">{bestConsistency}</span>
              <button
                type="button"
                className="of-stat__info"
                aria-label="O que é melhor consistência"
                onClick={() => setSheetId('bestConsistency')}
              >
                <Info size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Classificação ── */}
        <h3 className="of-section__title">Classificação</h3>
        <div className="of-tabs">
          <button
            type="button"
            className={`of-tab ${tab === 'streak' ? 'is-active' : ''}`}
            aria-pressed={tab === 'streak'}
            onClick={() => changeTab('streak')}
          >
            Sequência Atual
          </button>
          <button
            type="button"
            className={`of-tab ${tab === 'workouts' ? 'is-active' : ''}`}
            aria-pressed={tab === 'workouts'}
            onClick={() => changeTab('workouts')}
          >
            Treinos
          </button>
        </div>

        {tab === 'streak' ? (
          <div key="streak" className={`of-panel${tabLeaving ? ' is-leaving' : ''}`}>
            <div className="of-weeks">
              {recentWeeks.map((w) => {
                const isCurrent = w.startDate === weeks.weeks[0]?.startDate;
                const pct = Math.min(100, Math.round((w.done / target) * 100));
                return (
                  <div className={`of-week ${w.hit ? 'of-week--hit' : ''}`} key={w.startDate}>
                    <span className="of-week__label">
                      {weekLabel(w.startDate)}
                      {isCurrent ? ' · atual' : ''}
                    </span>
                    <div className="of-week__bar">
                      <div className="of-week__fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="of-week__count">
                      {w.done}/{target}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="of-hint">
              Semanas que batem a meta de {target} dias mantêm a ofensiva viva.
            </p>
          </div>
        ) : (
          <div key="workouts" className={`of-panel${tabLeaving ? ' is-leaving' : ''}`}>
            <div className="of-month__head">
              <button
                type="button"
                className="of-month__btn"
                aria-expanded={monthPicker}
                onClick={() => setMonthPicker((v) => !v)}
              >
                <CalendarDays size={16} />
                {month.name}
                <ChevronDown size={14} />
              </button>
              <div className="of-month__nav">
                <button
                  type="button"
                  className="of-icon-btn of-icon-btn--sm"
                  aria-label="Mês anterior"
                  onClick={() => shiftMonth(-1)}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="of-icon-btn of-icon-btn--sm"
                  aria-label="Próximo mês"
                  onClick={() => shiftMonth(1)}
                >
                  ›
                </button>
              </div>
            </div>

            {monthPicker && (
              <div className="of-month__list">
                {MONTH_NAMES.map((name, index) => (
                  <button
                    type="button"
                    key={name}
                    className={`of-month__opt ${index === month.month ? 'is-active' : ''}`}
                    onClick={() => {
                      setMonthCursor(new Date(month.year, index, 1));
                      setMonthPicker(false);
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            <div className="of-month__summary">
              <div>
                <strong>{month.workoutsTotal}</strong>
                <span>treinos</span>
              </div>
              <div>
                <strong>{month.trainedCount}</strong>
                <span>dias treinados</span>
              </div>
              <div>
                <strong>{month.seriesTotal}</strong>
                <span>séries</span>
              </div>
            </div>

            <div className="of-month__grid">
              {month.labels.map((label, i) => (
                <span className="of-month__dow" key={`d${i}`}>
                  {label}
                </span>
              ))}
              {Array.from({ length: month.emptySlots }).map((_, i) => (
                <span className="of-day is-empty" key={`e${i}`} />
              ))}
              {month.cells.map((cell) => (
                <span
                  key={cell.dateStr}
                  className={`of-day ${cell.trained ? 'is-done' : ''} ${
                    cell.isToday ? 'is-today' : ''
                  } ${cell.future ? 'is-future' : ''}`}
                  title={`${cell.day} · ${cell.workouts} treino(s) · ${cell.series} série(s)`}
                >
                  {cell.day}
                </span>
              ))}
            </div>

            <button type="button" className="of-link" onClick={onOpenCalendar}>
              Abrir calendário completo
            </button>
          </div>
        )}

        {/* ── Compartilhar atividade ── */}
        <div className="of-share">
          <span className="of-share__icon" aria-hidden="true">
            <Users size={22} />
          </span>
          <h3 className="of-share__title">Compartilhar Atividade</h3>
          <p className="of-share__text">
            Convide amigos para compartilhar treinos, se inspirar e se manter motivado.
          </p>
          <button type="button" className="of-btn" onClick={onInvite}>
            Convidar um amigo
          </button>
        </div>
      </div>

      {/* ── Folha inferior (explicação das métricas / semana atual) ── */}
      {sheet && (
        <div
          className={`of-sheet${sheetPresence.closing ? ' is-closing' : ''}`}
          onClick={() => setSheetId(null)}
        >
          <div
            className="of-sheet__panel"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="of-sheet__bar" aria-hidden="true" />
            <h3 className="of-sheet__title">{sheet.title}</h3>
            <div className="of-sheet__value">{sheet.value}</div>

            {sheetPresence.value === 'week' && (
              <div className="of-weekrow">
                {week.days.map((d) => (
                  <div className="of-weekrow__item" key={d.dateStr}>
                    <span className="of-weekrow__dow">{d.label[0]}</span>
                    <span
                      className={`of-weekrow__day ${d.done ? 'is-done' : ''} ${
                        d.isToday ? 'is-today' : ''
                      }`}
                    >
                      {parseDateLocal(d.dateStr).getDate()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="of-sheet__text">{sheet.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfensivasOverlay;
