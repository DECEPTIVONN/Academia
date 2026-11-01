/**
 * messages.ts — textos das notificações (v4.65.0)
 *
 * Reaproveita as frases motivacionais do app (`FRASES_PRESET`, as mesmas do
 * cartão de compartilhar treino / frase de assinatura), girando uma por dia
 * de forma determinística — o mesmo dia sempre mostra a mesma frase, mesmo
 * depois de recarregar.
 */

import { FRASES_PRESET } from '@/features/profile/profile-data';
import { formatTimeLeft, leagueCycleLabel, type LeagueCycle } from '@/features/social/league-window';

export interface NotificationCopy {
  title: string;
  body: string;
  /** Tag estável (substitui o aviso anterior do mesmo tipo na bandeja). */
  tag: string;
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

/** Frase do dia (YYYY-MM-DD → uma das frases do app). */
export function phraseOfDay(dateKey: string): string {
  return FRASES_PRESET[hash(dateKey) % FRASES_PRESET.length];
}

/**
 * Mensagem diária. Sem treino no dia ela cobra a ofensiva (estilo Duolingo);
 * com treino já feito, agradece e reforça a consistência.
 */
export function buildMotivation(input: {
  dateKey: string;
  streak: number;
  trainedToday: boolean;
}): NotificationCopy {
  const { dateKey, streak, trainedToday } = input;
  const phrase = phraseOfDay(dateKey);

  if (trainedToday) {
    return {
      title: streak > 1 ? `Ofensiva de ${streak} dias mantida 🔥` : 'Treino do dia concluído',
      body: phrase,
      tag: 'evofit-motivation',
    };
  }

  return {
    title: streak > 0 ? `Não perca sua ofensiva de ${streak} dias` : 'Um treino muda o seu dia',
    body: `${phrase} Que tal treinar agora?`,
    tag: 'evofit-motivation',
  };
}

/** Lembrete no horário escolhido pelo usuário (Configurações → Notificações). */
export function buildWorkoutReminder(input: {
  time: string;
  streak: number;
  dateKey: string;
}): NotificationCopy {
  const { time, streak, dateKey } = input;
  return {
    title: streak > 1 ? `Seu treino das ${time} está esperando` : `Hora do treino (${time})`,
    body:
      streak > 1
        ? `${streak} dias seguidos. Mantenha a sequência — ${phraseOfDay(dateKey)}`
        : `${phraseOfDay(dateKey)} Bora começar?`,
    tag: 'evofit-reminder',
  };
}

/** Aviso de fim de liga (semanal ou mensal). */
export function buildLeagueEnd(input: {
  cycle: LeagueCycle;
  msLeft: number;
  rank?: number | null;
}): NotificationCopy {
  const { cycle, msLeft, rank } = input;
  const label = leagueCycleLabel(cycle);
  const time = formatTimeLeft(msLeft);

  const position =
    typeof rank === 'number' && rank > 0
      ? ` Você está em ${rank}º lugar no ranking global.`
      : ' Garanta seus pontos antes do fechamento.';

  return {
    title: `${label} termina em breve`,
    body: `${time}.${position}`,
    tag: `evofit-league-${cycle}`,
  };
}
