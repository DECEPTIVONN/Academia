/**
 * league-window.ts — janelas oficiais das ligas (v4.65.0)
 *
 * Regras de produto (definidas pelo usuário em 2026-11-01):
 *   • SEMANAL — 7 dias, começa **domingo 19:00** e termina **domingo 18:59**.
 *     Entra quem treinou ao menos uma vez na semana; 10 participantes por liga;
 *     os 3 primeiros sobem, os 3 últimos caem. Pontuação = XP da semana.
 *   • MENSAL — começa às **06:00 do dia 1º** e termina às **21:00 do último
 *     dia do mês**; progresso mensal (mesma lógica de subida/queda).
 *
 * Este módulo é a FONTE ÚNICA dessas datas: hoje ele alimenta o aviso de fim
 * de liga (notificações) e fica pronto para a implementação real das ligas
 * (`ligas-data.ts` ainda é demonstrativo — ver RELATORIO-PENDENCIAS.md).
 */

export type LeagueCycle = 'weekly' | 'monthly';

export interface LeagueWindow {
  cycle: LeagueCycle;
  /** Início inclusivo. */
  start: Date;
  /** Fim inclusivo (18:59:59.999 na semanal; 21:00:00.000 na mensal). */
  end: Date;
}

const WEEKLY_START_HOUR = 19;
const WEEKLY_DAYS = 7;

const MONTHLY_START_HOUR = 6;
const MONTHLY_END_HOUR = 21;

/** Domingo 19:00 → domingo seguinte 18:59:59.999 que contém `now`. */
export function weeklyLeagueWindow(now: Date = new Date()): LeagueWindow {
  const start = new Date(now);
  start.setHours(WEEKLY_START_HOUR, 0, 0, 0);
  /* getDay(): 0 = domingo — volta para o domingo desta semana. */
  start.setDate(start.getDate() - start.getDay());
  if (start.getTime() > now.getTime()) start.setDate(start.getDate() - WEEKLY_DAYS);

  const end = new Date(start);
  end.setDate(end.getDate() + WEEKLY_DAYS);
  end.setMilliseconds(-1); // → domingo 18:59:59.999

  return { cycle: 'weekly', start, end };
}

/** Dia 1º às 06:00 → último dia do mês às 21:00 que contém `now`. */
export function monthlyLeagueWindow(now: Date = new Date()): LeagueWindow {
  const year = now.getFullYear();
  const month = now.getMonth();

  let start = new Date(year, month, 1, MONTHLY_START_HOUR, 0, 0, 0);
  if (start.getTime() > now.getTime()) {
    start = new Date(year, month - 1, 1, MONTHLY_START_HOUR, 0, 0, 0);
  }
  /* Último dia do mês do início, às 21:00. */
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, MONTHLY_END_HOUR, 0, 0, 0);

  return { cycle: 'monthly', start, end };
}

export function leagueWindow(cycle: LeagueCycle, now: Date = new Date()): LeagueWindow {
  return cycle === 'weekly' ? weeklyLeagueWindow(now) : monthlyLeagueWindow(now);
}

/** `true` quando `now` está dentro da janela (início e fim inclusivos). */
export function isInsideWindow(window: LeagueWindow, now: Date = new Date()): boolean {
  return now.getTime() >= window.start.getTime() && now.getTime() <= window.end.getTime();
}

/** Próxima janela (a que começa depois de `now`). */
export function nextLeagueWindow(cycle: LeagueCycle, now: Date = new Date()): LeagueWindow {
  const base = new Date(now.getTime());
  if (cycle === 'weekly') base.setDate(base.getDate() + WEEKLY_DAYS);
  else base.setMonth(base.getMonth() + 1);
  return leagueWindow(cycle, base);
}

/** Quanto falta para o fim da janela (0 quando já terminou). */
export function msUntilEnd(window: LeagueWindow, now: Date = new Date()): number {
  return Math.max(0, window.end.getTime() - now.getTime());
}

/** "dom, 18:59" / "31 de nov., 21:00" (pt-BR). */
export function formatWindowEnd(window: LeagueWindow): string {
  const isSameDay = window.start.getMonth() === window.end.getMonth()
    && window.start.getDate() === window.end.getDate();
  return window.cycle === 'weekly' || isSameDay
    ? window.end.toLocaleString('pt-BR', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : window.end.toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
}

/** "Falta 1 h 20 min" / "Faltam 12 min" — texto do aviso de fim de liga. */
export function formatTimeLeft(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0 && rest > 0) return `Falta ${hours} h ${rest} min`;
  if (hours > 0) return `Falta ${hours} h`;
  return `Faltam ${rest} min`;
}

/** Rótulo curto do ciclo. */
export function leagueCycleLabel(cycle: LeagueCycle): string {
  return cycle === 'weekly' ? 'Liga semanal' : 'Liga mensal';
}
