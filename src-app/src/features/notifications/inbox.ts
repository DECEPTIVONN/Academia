/**
 * inbox.ts — Caixa de Mensagens alimentada por eventos reais (v4.67.0)
 *
 * Antes a tela de Mensagens era uma lista fixa de placeholders. Agora ela é um
 * registro local (`localStorage`, 60 itens) preenchido por eventos de verdade:
 *
 *   • amizade aceita / convite recebido  → `syncFriendMessages`
 *   • conquista desbloqueada             → `syncAchievementMessages`
 *   • fim de liga com treinos na janela  → `syncLeagueMessages`
 *   • conta reativada nos 30 dias        → `pushMessage` (chamado no login)
 *
 * Tudo offline-first: nenhum evento depende de rede para ser gravado. Quando
 * não há nada, a UI mostra o estado vazio em vez de histórias inventadas.
 */

import type { CloudFriend } from '@/features/social/social-cloud';
import { monthlyXpFromHistory } from '@/features/social/social-cloud';
import { monthlyLeagueWindow, weeklyLeagueWindow } from '@/features/social/league-window';
import type { ProfileConquista, WorkoutHistory } from '@/core/db/schema';

export const INBOX_KEY = 'academia_inbox_v1';
export const INBOX_EVENT = 'academia:inbox-changed';

const MAX_MESSAGES = 60;

export type InboxKind = 'friend' | 'achievement' | 'league' | 'account' | 'streak';

export interface InboxMessage {
  id: string;
  kind: InboxKind;
  title: string;
  body: string;
  /** epoch ms */
  at: number;
  read: boolean;
}

export interface InboxInput {
  kind: InboxKind;
  title: string;
  body: string;
  /** Chave estável — evita repetir o mesmo evento entre recarregamentos. */
  key?: string;
  at?: number;
}

/* ── Leitura/escrita ── */

function readInbox(): InboxMessage[] {
  try {
    const raw = localStorage.getItem(INBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InboxMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item && typeof item.id === 'string' && typeof item.title === 'string',
    );
  } catch {
    return [];
  }
}

function writeInbox(list: InboxMessage[]): void {
  try {
    localStorage.setItem(INBOX_KEY, JSON.stringify(list.slice(0, MAX_MESSAGES)));
  } catch {
    /* storage cheio/privado: a lista vale só para esta sessão */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(INBOX_EVENT));
  }
}

/* ── API ── */

/** Mensagens mais recentes primeiro. */
export function listMessages(): InboxMessage[] {
  return readInbox().sort((a, b) => b.at - a.at);
}

export function unreadCount(): number {
  return readInbox().filter((message) => !message.read).length;
}

/** Grava um evento. Com `key` repetida, a mensagem anterior é substituída. */
export function pushMessage(input: InboxInput): InboxMessage | null {
  const list = readInbox();
  const id = input.key ? `k:${input.key}` : `m:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  if (list.some((message) => message.id === id)) return null;

  const message: InboxMessage = {
    id,
    kind: input.kind,
    title: input.title,
    body: input.body,
    at: input.at ?? Date.now(),
    read: false,
  };

  writeInbox([message, ...list]);
  return message;
}

export function markRead(id: string): void {
  const list = readInbox();
  const next = list.map((message) => (message.id === id ? { ...message, read: true } : message));
  writeInbox(next);
}

export function markAllRead(): void {
  writeInbox(readInbox().map((message) => ({ ...message, read: true })));
}

export function clearInbox(): void {
  writeInbox([]);
  /* Também esquece os snapshots: sem mensagens, o próximo evento é novidade. */
  try {
    localStorage.removeItem(FRIEND_STATE_KEY);
    localStorage.removeItem(LEAGUE_STATE_KEY);
    localStorage.removeItem(ACHIEVEMENT_KEY);
  } catch {
    /* storage indisponível */
  }
}

/* ── Amizades ── */

const FRIEND_STATE_KEY = 'academia_friend_state_v1';

type FriendStateMap = Record<string, { state: string; name: string }>;

/**
 * Compara a lista de amigos da nuvem com a última vista e registra o que
 * mudou. Na PRIMEIRA execução só grava o snapshot (não inunda a caixa com
 * amizades antigas).
 */
export function syncFriendMessages(friends: CloudFriend[]): void {
  let previous: FriendStateMap | null = null;
  try {
    const raw = localStorage.getItem(FRIEND_STATE_KEY);
    if (raw) previous = JSON.parse(raw) as FriendStateMap;
  } catch {
    previous = null;
  }

  const current: FriendStateMap = {};
  for (const friend of friends) current[friend.id] = { state: friend.state, name: friend.name };

  if (previous) {
    for (const friend of friends) {
      if (friend.state === 'accepted' && previous[friend.id]?.state !== 'accepted') {
        pushMessage({
          kind: 'friend',
          key: `friend-accepted:${friend.id}`,
          title: 'Amizade confirmada',
          body: `${friend.name} aceitou seu convite. Vocês agora aparecem no ranking de amigos.`,
        });
      }
      if (friend.state === 'incoming' && previous[friend.id]?.state !== 'incoming') {
        pushMessage({
          kind: 'friend',
          key: `friend-incoming:${friend.id}`,
          title: 'Novo convite de amizade',
          body: `${friend.name} quer treinar com você. Abra o Social → Amigos para aceitar.`,
        });
      }
    }
  }

  try {
    localStorage.setItem(FRIEND_STATE_KEY, JSON.stringify(current));
  } catch {
    /* storage indisponível: sem comparação na próxima vez */
  }
}

/* ── Conquistas ── */

const ACHIEVEMENT_KEY = 'academia_achievement_seen_v1';

function conquistaId(item: ProfileConquista): string | null {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object' && typeof item.id === 'string') return item.id;
  return null;
}

function conquistaLabel(item: ProfileConquista): string {
  if (typeof item === 'object' && item) {
    const label = item.titulo || item.name || item.id;
    return String(label).replace(/[-_]+/g, ' ');
  }
  return String(item).replace(/[-_]+/g, ' ');
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Conquistas novas viram mensagem. Primeira execução só marca como vistas. */
export function syncAchievementMessages(conquistas: ProfileConquista[] | undefined): void {
  if (!Array.isArray(conquistas) || conquistas.length === 0) return;

  let seen: string[] | null = null;
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_KEY);
    if (raw) seen = JSON.parse(raw) as string[];
  } catch {
    seen = null;
  }

  const ids = conquistas.map(conquistaId).filter((id): id is string => Boolean(id));

  if (seen) {
    for (const item of conquistas) {
      const id = conquistaId(item);
      if (!id || seen.includes(id)) continue;
      pushMessage({
        kind: 'achievement',
        key: `achievement:${id}`,
        title: 'Conquista desbloqueada',
        body: `${capitalize(conquistaLabel(item))} — confira na sua coleção do Perfil.`,
      });
    }
  }

  try {
    localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    /* storage indisponível */
  }
}

/* ── Ligas ── */

const LEAGUE_STATE_KEY = 'academia_league_state_v1';

type LeagueStateMap = Record<string, string>;

function trainedInside(history: WorkoutHistory[], start: Date, end: Date): number {
  return history.filter((entry) => {
    if (!entry.completed || !entry.date) return false;
    const [year, month, day] = entry.date.split('-').map(Number);
    if (!year || !month || !day) return false;
    const time = new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
    return time >= start.getTime() && time <= end.getTime();
  }).length;
}

/**
 * Registra o fim de uma liga (semanal/mensal) em que o usuário participou —
 * entrou quem treinou pelo menos uma vez na janela. A mensagem é criada quando
 * a janela ANTERIOR terminou desde a última checagem.
 */
export function syncLeagueMessages(history: WorkoutHistory[], now: Date = new Date()): void {
  let state: LeagueStateMap | null = null;
  try {
    const raw = localStorage.getItem(LEAGUE_STATE_KEY);
    if (raw) state = JSON.parse(raw) as LeagueStateMap;
  } catch {
    state = null;
  }

  const windows = [
    { cycle: 'weekly' as const, window: weeklyLeagueWindow(now) },
    { cycle: 'monthly' as const, window: monthlyLeagueWindow(now) },
  ];

  const nextState: LeagueStateMap = { ...(state ?? {}) };

  for (const { cycle, window } of windows) {
    const endIso = window.end.toISOString();
    const lastSeen = state?.[cycle];

    /* Já contabilizamos esta janela? */
    if (lastSeen !== endIso) {
      /* Na primeira execução apenas memoriza (sem mensagem retroativa). */
      if (lastSeen) {
        const previousEnd = new Date(lastSeen);
        const previousStart = new Date(previousEnd.getTime() - (cycle === 'weekly' ? 7 : 31) * 86400000);
        const trained = trainedInside(history, previousStart, previousEnd);
        if (trained > 0) {
          const xp = trained * 10;
          pushMessage({
            kind: 'league',
            key: `league-end:${cycle}:${lastSeen}`,
            title: cycle === 'weekly' ? 'Liga semanal encerrada' : 'Liga mensal encerrada',
            body: `Você treinou ${trained} ${trained === 1 ? 'dia' : 'dias'} e somou ${xp} XP na temporada. Confira sua posição no Ranking.`,
            at: previousEnd.getTime(),
          });
        }
      }
      nextState[cycle] = endIso;
    }
  }

  try {
    localStorage.setItem(LEAGUE_STATE_KEY, JSON.stringify(nextState));
  } catch {
    /* storage indisponível */
  }
}

/* ── Aviso local de ofensiva (reforço do lembrete) ── */

export function noteStreakRisk(streak: number, trainedToday: boolean): void {
  if (trainedToday || streak < 2) return;
  pushMessage({
    kind: 'streak',
    key: `streak:${new Date().toISOString().slice(0, 10)}`,
    title: 'Ofensiva em risco',
    body: `${streak} dias seguidos. Um treino hoje mantém a sequência viva.`,
  });
}

/* ── Resumo de XP mensal (usado nas mensagens de liga) ── */

export function monthXp(history: WorkoutHistory[], now: Date = new Date()): number {
  return monthlyXpFromHistory(history, now);
}
