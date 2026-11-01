/**
 * scheduler.ts — agendador de notificações (v4.65.0)
 *
 * Verifica a cada minuto (e ao voltar para a aba, reconectar ou mudar uma
 * preferência) se algum aviso está vencido:
 *
 *   1. MOTIVACIONAL — 1× por dia a partir das 12:00 (`PREF_KEYS.messages`),
 *      com a frase do dia (`messages.ts` / `FRASES_PRESET`);
 *   2. LEMBRETE DE TREINO — no horário escolhido (`workoutReminderTime`),
 *      apenas se ainda não houver treino concluído hoje;
 *   3. FIM DE LIGA — 45 min antes do fim da semanal e 60 min antes do fim da
 *      mensal (`notifyLeagues`), só para quem está participando (`joined`).
 *
 * O mestre é `PREF_KEYS.notifications` (o toggle de permissão nas
 * Configurações). Sem permissão do navegador, nada é enviado.
 *
 * LIMITAÇÃO: entrega com o app fechado exigiria push de servidor. Aqui os
 * avisos aparecem com o app aberto/em segundo plano; ao reabrir, o tick
 * recupera o que estava vencido (respeitando o dedupe por dia/janela).
 */

import { getStreak, loadLocalData, today } from '@/core/db/queries';
import type { WorkoutHistory } from '@/core/db/schema';
import { PREF_KEYS, readLS } from '@/features/profile/profile-data';
import {
  monthlyLeagueWindow,
  weeklyLeagueWindow,
  type LeagueWindow,
} from '@/features/social/league-window';
import { buildLeagueEnd, buildMotivation, buildWorkoutReminder } from './messages';
import {
  markNotificationSent,
  notificationsGranted,
  showAppNotification,
  wasNotificationSent,
} from './notification-center';

const TICK_MS = 60 * 1000;
/** Antecedência do aviso de fim de liga. */
const WEEKLY_WARNING_MS = 45 * 60 * 1000;
const MONTHLY_WARNING_MS = 60 * 60 * 1000;
/** Hora do empurrão diário (frase do dia). */
const MOTIVATION_HOUR = 12;

/** O usuário participa da liga quando concluiu ao menos um treino na janela. */
function trainedInWindow(history: WorkoutHistory[], window: LeagueWindow): boolean {
  return history.some((entry) => {
    if (!entry.completed || !entry.date) return false;
    const [year, month, day] = entry.date.split('-').map(Number);
    if (!year || !month || !day) return false;
    const time = new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
    return time >= window.start.getTime() && time <= window.end.getTime();
  });
}

export interface UpcomingNotice {
  at: Date;
  label: string;
}

function parseTime(value: string | null): { hour: number; minute: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value ?? '').trim());
  if (!match) return { hour: 18, minute: 0 };
  const hour = Math.min(23, Number(match[1]));
  const minute = Math.min(59, Number(match[2]));
  return { hour, minute };
}

function atHour(now: Date, hour: number, minute = 0): Date {
  const date = new Date(now);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function readingPrefs() {
  return {
    master: readLS(PREF_KEYS.notifications) === 'true',
    messages: readLS(PREF_KEYS.messages) !== 'false',
    leagues: readLS(PREF_KEYS.notifyLeagues) === 'true',
    reminder: readLS(PREF_KEYS.workoutReminder) === 'true',
    reminderTime: readLS(PREF_KEYS.workoutReminderTime) || '18:00',
  };
}

/** Próximos avisos previstos (para a prévia nas Configurações). */
export function upcomingNotices(now: Date = new Date()): UpcomingNotice[] {
  const prefs = readingPrefs();
  const list: UpcomingNotice[] = [];
  const push = (date: Date, label: string) => {
    if (date.getTime() > now.getTime()) list.push({ at: date, label });
  };

  if (prefs.messages) {
    const todayAt = atHour(now, MOTIVATION_HOUR);
    push(todayAt, 'Mensagem motivacional');
    const tomorrow = new Date(todayAt);
    tomorrow.setDate(tomorrow.getDate() + 1);
    push(tomorrow, 'Mensagem motivacional');
  }

  if (prefs.reminder) {
    const { hour, minute } = parseTime(prefs.reminderTime);
    const todayAt = atHour(now, hour, minute);
    push(todayAt, `Lembrete de treino (${prefs.reminderTime})`);
    const tomorrow = new Date(todayAt);
    tomorrow.setDate(tomorrow.getDate() + 1);
    push(tomorrow, `Lembrete de treino (${prefs.reminderTime})`);
  }

  if (prefs.leagues) {
    const weekly = weeklyLeagueWindow(now);
    push(new Date(weekly.end.getTime() - WEEKLY_WARNING_MS), 'Fim da liga semanal');
    const monthly = monthlyLeagueWindow(now);
    push(new Date(monthly.end.getTime() - MONTHLY_WARNING_MS), 'Fim da liga mensal');
  }

  return list.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** Texto curto do próximo aviso: "hoje às 18:00 · Lembrete de treino". */
export function describeNextNotice(now: Date = new Date()): string {
  const [next] = upcomingNotices(now);
  if (!next) return 'Nenhum aviso programado (ative um dos controles acima).';

  const sameDay = next.at.toDateString() === now.toDateString();
  const when = sameDay
    ? `hoje às ${next.at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : `${next.at.toLocaleDateString('pt-BR', { weekday: 'short' })} às ${next.at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  return `Próximo aviso: ${when} · ${next.label}`;
}

let running = false;

/**
 * Verifica os avisos vencidos e envia o que for devido.
 * Devolve as chaves enviadas (útil para depurar/testar).
 */
export async function runNotificationTick(now: Date = new Date()): Promise<string[]> {
  if (running || typeof window === 'undefined') return [];
  running = true;
  try {
    const prefs = readingPrefs();
    if (!prefs.master || !notificationsGranted()) return [];

    const dateKey = today();
    const sent: string[] = [];

    const { hour, minute } = parseTime(prefs.reminderTime);
    const reminderDue =
      prefs.reminder &&
      now.getTime() >= atHour(now, hour, minute).getTime() &&
      !wasNotificationSent(`reminder:${dateKey}`);

    const motivationDue =
      prefs.messages &&
      now.getHours() >= MOTIVATION_HOUR &&
      !wasNotificationSent(`motivation:${dateKey}`);

    const weekly = weeklyLeagueWindow(now);
    const weeklyLeft = weekly.end.getTime() - now.getTime();
    const weeklyDue =
      prefs.leagues &&
      weeklyLeft > 0 &&
      weeklyLeft <= WEEKLY_WARNING_MS &&
      !wasNotificationSent(`league-weekly:${weekly.end.toISOString()}`);

    const monthly = monthlyLeagueWindow(now);
    const monthlyLeft = monthly.end.getTime() - now.getTime();
    const monthlyDue =
      prefs.leagues &&
      monthlyLeft > 0 &&
      monthlyLeft <= MONTHLY_WARNING_MS &&
      !wasNotificationSent(`league-monthly:${monthly.end.toISOString()}`);

    if (!reminderDue && !motivationDue && !weeklyDue && !monthlyDue) return [];

    /* Só agora tocamos no banco (histórico/streak). */
    let trainedToday = false;
    let streak = 0;
    let history: WorkoutHistory[] = [];
    try {
      const data = await loadLocalData();
      history = data.history ?? [];
      trainedToday = history.some(
        (entry) => entry.date === dateKey && (entry.completed || entry.checks.length > 0)
      );
      streak = getStreak(history);
    } catch {
      /* banco indisponível: segue com os padrões */
    }

    /* 1) Frase do dia (1× ao dia, a partir do meio-dia). */
    if (motivationDue) {
      const copy = buildMotivation({ dateKey, streak, trainedToday });
      await showAppNotification(copy);
      markNotificationSent(`motivation:${dateKey}`);
      sent.push(`motivation:${dateKey}`);
    }

    /* 2) Lembrete do treino no horário escolhido (1× ao dia e só sem treino
       concluído hoje — quem já treinou não recebe cobrança). */
    if (reminderDue && !trainedToday) {
      const copy = buildWorkoutReminder({ time: prefs.reminderTime, streak, dateKey });
      await showAppNotification(copy);
      markNotificationSent(`reminder:${dateKey}`);
      sent.push(`reminder:${dateKey}`);
    }

    /* 3) Fim das ligas. */
    if (weeklyDue && trainedInWindow(history, weekly)) {
      const copy = buildLeagueEnd({ cycle: 'weekly', msLeft: weeklyLeft });
      await showAppNotification(copy);
      markNotificationSent(`league-weekly:${weekly.end.toISOString()}`);
      sent.push('league-weekly');
    }

    if (monthlyDue && trainedInWindow(history, monthly)) {
      const copy = buildLeagueEnd({ cycle: 'monthly', msLeft: monthlyLeft });
      await showAppNotification(copy);
      markNotificationSent(`league-monthly:${monthly.end.toISOString()}`);
      sent.push('league-monthly');
    }

    return sent;
  } finally {
    running = false;
  }
}

let stopScheduler: (() => void) | null = null;

/**
 * Liga o agendador (idempotente). Devolve a função que desliga — usada no
 * unmount do App.
 */
export function startNotificationScheduler(): () => void {
  if (typeof window === 'undefined') return () => {};
  if (stopScheduler) return stopScheduler;

  const timer = window.setInterval(() => {
    void runNotificationTick();
  }, TICK_MS);

  const onVisible = () => {
    if (document.visibilityState === 'visible') void runNotificationTick();
  };
  const onPrefs = () => void runNotificationTick();

  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', onVisible);
  window.addEventListener('focus', onVisible);
  window.addEventListener('academia:prefs-changed', onPrefs);
  /* Primeira checagem depois do boot (deixa o banco carregar). */
  const bootTimer = window.setTimeout(() => void runNotificationTick(), 5000);

  stopScheduler = () => {
    window.clearInterval(timer);
    window.clearTimeout(bootTimer);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('online', onVisible);
    window.removeEventListener('focus', onVisible);
    window.removeEventListener('academia:prefs-changed', onPrefs);
    stopScheduler = null;
  };

  return stopScheduler;
}
