/**
 * social-cloud.ts — ranking global e amigos na nuvem (v4.66.0)
 *
 * Regra de produto: o RANKING GLOBAL usa a MESMA janela da liga mensal
 * (`league-window.ts`) e mostra, globalmente, quem ganhou mais XP no mês —
 * nada é gerado aleatoriamente. O XP de cada conta vem do histórico real de
 * treinos do aparelho, publicado no próprio perfil (`publish_monthly_xp`).
 *
 * Amigos também são reais: a amizade fica em `public.friendships` (convite →
 * aceite) e a lista vem de `friends_overview()`. Sem servidor configurado o
 * app continua funcionando com a lista local (QR/link), apenas sem ranking.
 */

import { supabase, isSupabaseConfigured } from '@/core/supabase';
import { getLevel, getStreak, getXp } from '@/core/db/queries';
import type { WorkoutHistory } from '@/core/db/schema';
import { monthlyLeagueWindow, weeklyLeagueWindow } from './league-window';

/* ── Janela do ranking (mensal) ── */

/** Período (`YYYY-MM`) da janela mensal que contém `now`. */
export function rankingPeriod(now: Date = new Date()): string {
  const { start } = monthlyLeagueWindow(now);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
}

/** Data (YYYY-MM-DD local) de uma entrada do histórico. */
function entryDate(entry: WorkoutHistory): Date | null {
  if (!entry.date) return null;
  const [year, month, day] = entry.date.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

const XP_PER_COMPLETED_DAY = 10;

/** XP conquistado dentro da janela mensal da liga (mesma pontuação do app). */
export function monthlyXpFromHistory(history: WorkoutHistory[], now: Date = new Date()): number {
  const { start, end } = monthlyLeagueWindow(now);
  return history.filter((entry) => {
    if (!entry.completed) return false;
    const date = entryDate(entry);
    if (!date) return false;
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
  }).length * XP_PER_COMPLETED_DAY;
}

/** XP conquistado dentro da janela semanal da liga (10 XP por treino). */
export function weeklyXpFromHistory(history: WorkoutHistory[], now: Date = new Date()): number {
  const { start, end } = weeklyLeagueWindow(now);
  return history.filter((entry) => {
    if (!entry.completed) return false;
    const date = entryDate(entry);
    if (!date) return false;
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
  }).length * XP_PER_COMPLETED_DAY;
}

export interface LocalXpSummary {
  period: string;
  monthlyXp: number;
  totalXp: number;
  streak: number;
  level: number;
}

export function localXpSummary(history: WorkoutHistory[], now: Date = new Date()): LocalXpSummary {
  const totalXp = getXp(history);
  return {
    period: rankingPeriod(now),
    monthlyXp: monthlyXpFromHistory(history, now),
    totalXp,
    streak: getStreak(history),
    level: getLevel(totalXp),
  };
}

/* ── Estados de disponibilidade ── */

export class SocialCloudOfflineError extends Error {
  constructor() {
    super('offline');
    this.name = 'SocialCloudOfflineError';
  }
}

export class SocialCloudAuthError extends Error {
  constructor() {
    super('unauthenticated');
    this.name = 'SocialCloudAuthError';
  }
}

export const isSocialCloudAvailable = isSupabaseConfigured;

async function currentUserId(): Promise<string> {
  if (!isSupabaseConfigured) throw new SocialCloudOfflineError();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const id = session?.user.id;
  if (!id) throw new SocialCloudAuthError();
  return id;
}

export async function currentSocialUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user.id ?? null;
  } catch {
    return null;
  }
}

/* ── Publicação do XP ── */

/**
 * Publica o resumo de XP da conta. Silencioso por desenho: chamado em telas
 * que já funcionam offline, então falha de rede/servidor não pode quebrar UI.
 */
export async function publishXp(
  history: WorkoutHistory[],
  now: Date = new Date(),
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    await currentUserId();
    const summary = localXpSummary(history, now);
    const { error } = await (supabase as any).rpc('publish_monthly_xp', {
      p_period: summary.period,
      p_monthly_xp: summary.monthlyXp,
      p_total_xp: summary.totalXp,
      p_streak: summary.streak,
      p_level: summary.level,
    });
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

/* ── Ranking global mensal ── */

export interface GlobalRankRow {
  position: number;
  id: string;
  username: string;
  name: string;
  monthlyXp: number;
  level: number;
  streak: number;
  emblemId?: string;
  photo?: string;
  isSelf: boolean;
}

export async function fetchGlobalRanking(
  limit = 50,
  now: Date = new Date(),
): Promise<GlobalRankRow[]> {
  await currentUserId();
  const { data, error } = await (supabase as any).rpc('global_monthly_ranking', {
    p_period: rankingPeriod(now),
    p_limit: limit,
  });
  if (error) throw new Error(error.message || 'ranking-failed');

  return (Array.isArray(data) ? data : []).map((row: any, index: number) => ({
    position: Number(row.position) || index + 1,
    id: String(row.id),
    username: typeof row.username === 'string' ? row.username : '',
    name:
      (typeof row.display_name === 'string' && row.display_name.trim()) ||
      row.username ||
      'Atleta',
    monthlyXp: Number(row.monthly_xp) || 0,
    level: Number(row.level) || 1,
    streak: Number(row.streak) || 0,
    emblemId: typeof row.avatar_emblem === 'string' ? row.avatar_emblem : undefined,
    photo: typeof row.photo === 'string' ? row.photo : undefined,
    isSelf: Boolean(row.is_self),
  }));
}

/* ── Amigos ── */

export type FriendLinkState = 'accepted' | 'incoming' | 'outgoing';

export interface CloudFriend {
  id: string;
  username: string;
  name: string;
  monthlyXp: number;
  totalXp: number;
  level: number;
  streak: number;
  emblemId?: string;
  photo?: string;
  state: FriendLinkState;
  since: number;
}

export async function fetchFriends(): Promise<CloudFriend[]> {
  await currentUserId();
  const { data, error } = await (supabase as any).rpc('friends_overview');
  if (error) throw new Error(error.message || 'friends-failed');

  return (Array.isArray(data) ? data : []).map((row: any) => {
    const state: FriendLinkState =
      row.state === 'accepted' || row.state === 'incoming' ? row.state : 'outgoing';
    return {
      id: String(row.user_id),
      username: typeof row.username === 'string' ? row.username : '',
      name:
        (typeof row.display_name === 'string' && row.display_name.trim()) ||
        row.username ||
        'Atleta',
      monthlyXp: Number(row.monthly_xp) || 0,
      totalXp: Number(row.total_xp) || 0,
      level: Number(row.level) || 1,
      streak: Number(row.streak) || 0,
      emblemId: typeof row.avatar_emblem === 'string' ? row.avatar_emblem : undefined,
      photo: typeof row.photo === 'string' ? row.photo : undefined,
      state,
      since: row.since ? new Date(row.since).getTime() : 0,
    };
  });
}

/** Envia convite de amizade para uma conta (id de `profiles`). */
export async function sendFriendRequest(userId: string): Promise<'sent' | 'exists'> {
  const me = await currentUserId();
  if (!userId || userId === me) throw new Error('self');

  const { error } = await (supabase as any)
    .from('friendships')
    .insert({ requester: me, addressee: userId, status: 'pending' });

  if (error) {
    if (error.code === '23505' || /duplicate key/i.test(error.message || '')) return 'exists';
    throw new Error(error.message || 'friend-request-failed');
  }
  return 'sent';
}

/** Aceita um convite recebido. */
export async function acceptFriendRequest(userId: string): Promise<void> {
  const me = await currentUserId();
  const { error } = await (supabase as any)
    .from('friendships')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('requester', userId)
    .eq('addressee', me);
  if (error) throw new Error(error.message || 'friend-accept-failed');
}

/** Remove amizade/convite (funciona para os dois lados). */
export async function removeFriend(userId: string): Promise<void> {
  const me = await currentUserId();
  const { error } = await (supabase as any)
    .from('friendships')
    .delete()
    .or(
      `and(requester.eq.${me},addressee.eq.${userId}),and(requester.eq.${userId},addressee.eq.${me})`,
    );
  if (error) throw new Error(error.message || 'friend-remove-failed');
}
