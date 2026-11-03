/**
 * useSocialCloud.ts — estado da aba Social vindo da nuvem (v4.66.0)
 *
 * Junta as duas fontes reais:
 *   • ranking global mensal (`global_monthly_ranking`), na mesma janela da
 *     liga mensal;
 *   • amigos (`friends_overview`), com convites recebidos/enviados.
 *
 * Também PUBLICA o XP do usuário a partir do histórico local sempre que os
 * dados mudam — é isso que coloca a conta no ranking. Offline (ou sem conta)
 * o hook devolve `ready: false` e as telas mostram o estado vazio honesto.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/core/auth/use-auth';
import { useLocalData } from '@/hooks/useLocalData';
import type { FriendItem } from './ligas-data';
import type { AvatarGlyphKey, FlagKey } from './ligas-data';
import {
  isSocialCloudAvailable,
  publishXp,
  fetchGlobalRanking,
  fetchFriends,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  type CloudFriend,
  type GlobalRankRow,
} from './social-cloud';

export type SocialCloudError = 'offline' | 'auth' | 'failed' | null;

export interface SocialCloudState {
  /** Configurado + autenticado: dá para confiar na lista/ranking. */
  ready: boolean;
  loading: boolean;
  error: SocialCloudError;
  ranking: GlobalRankRow[];
  friends: CloudFriend[];
  accepted: CloudFriend[];
  incoming: CloudFriend[];
  outgoing: CloudFriend[];
  /** Linha do próprio usuário no ranking (quando publicada). */
  self: GlobalRankRow | null;
  refresh: () => Promise<void>;
  request: (userId: string) => Promise<'sent' | 'exists'>;
  accept: (userId: string) => Promise<void>;
  remove: (userId: string) => Promise<void>;
}

const AVATAR_COLORS = [
  'from-emerald-500 to-teal-700',
  'from-blue-500 to-indigo-700',
  'from-amber-500 to-orange-700',
  'from-rose-500 to-pink-700',
  'from-violet-500 to-fuchsia-700',
  'from-cyan-500 to-sky-700',
  'from-lime-500 to-green-700',
] as const;

const AVATAR_GLYPHS: AvatarGlyphKey[] = [
  'crown',
  'star',
  'flame',
  'bolt',
  'wolf',
  'frog',
  'alien',
  'panda',
  'lion',
  'rocket',
];

const FLAGS: FlagKey[] = ['BR', 'US', 'MX', 'JP', 'AR', 'CA', 'DE', 'GB', 'CL'];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

/** Amigo da nuvem → linha das listas da aba Social. */
export function cloudFriendToItem(friend: CloudFriend): FriendItem {
  const seed = hashString(friend.id || friend.name);
  return {
    id: friend.id,
    name: friend.name,
    clan: null,
    trophies: friend.totalXp,
    monthlyXp: friend.monthlyXp,
    online: false,
    avatarColor: AVATAR_COLORS[seed % AVATAR_COLORS.length],
    avatarInitial: friend.name.charAt(0).toUpperCase() || 'A',
    rank: 0,
    avatarGlyph: AVATAR_GLYPHS[seed % AVATAR_GLYPHS.length],
    flag: FLAGS[seed % FLAGS.length],
    level: friend.level,
    photo: friend.photo,
    avatarEmblemId: friend.emblemId,
    streak: friend.streak,
  };
}

/** Linha do ranking global → linha das listas da aba Social. */
export function rankRowToItem(row: GlobalRankRow): FriendItem {
  const seed = hashString(row.id || row.name);
  return {
    id: row.id,
    name: row.name,
    clan: null,
    trophies: row.monthlyXp,
    monthlyXp: row.monthlyXp,
    online: false,
    avatarColor: AVATAR_COLORS[seed % AVATAR_COLORS.length],
    avatarInitial: row.name.charAt(0).toUpperCase() || 'A',
    rank: row.position,
    avatarGlyph: AVATAR_GLYPHS[seed % AVATAR_GLYPHS.length],
    flag: FLAGS[seed % FLAGS.length],
    level: row.level,
    photo: row.photo,
    avatarEmblemId: row.emblemId,
    streak: row.streak,
  };
}

export function useSocialCloud(): SocialCloudState {
  const { user } = useAuth();
  const { history } = useLocalData();
  const [ranking, setRanking] = useState<GlobalRankRow[]>([]);
  const [friends, setFriends] = useState<CloudFriend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SocialCloudError>(null);
  const runningRef = useRef(false);

  const refresh = useCallback(async () => {
    if (runningRef.current) return;
    if (!isSocialCloudAvailable) {
      setError('offline');
      return;
    }
    if (!user?.id) {
      setError('auth');
      setRanking([]);
      setFriends([]);
      return;
    }

    runningRef.current = true;
    setLoading(true);
    try {
      /* Publica o XP da conta antes de ler: o ranking precisa da linha nova. */
      await publishXp(history);
      const [rankingRows, friendRows] = await Promise.all([
        fetchGlobalRanking(50).catch(() => null),
        fetchFriends().catch(() => null),
      ]);
      if (rankingRows) setRanking(rankingRows);
      if (friendRows) setFriends(friendRows);
      setError(rankingRows && friendRows ? null : 'failed');
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      setError(name === 'SocialCloudOfflineError' ? 'offline' : name === 'SocialCloudAuthError' ? 'auth' : 'failed');
    } finally {
      runningRef.current = false;
      setLoading(false);
    }
  }, [history, user?.id]);

  /* Primeira carga + mudanças de dados/histórico (treino concluído, sync). */
  useEffect(() => {
    // Sincronização com um sistema externo (nuvem): o estado vem da resposta.
    // eslint-disable-next-line react/set-state-in-effect
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onRefresh = () => void refresh();
    const events = [
      'academia:db-ready',
      'academia:friends-changed',
      'academia:friends-updated',
      'academia:sync-applied',
    ];
    for (const event of events) window.addEventListener(event, onRefresh);
    const onVisible = () => {
      if (document.visibilityState === 'visible') onRefresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      for (const event of events) window.removeEventListener(event, onRefresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const request = useCallback(
    async (userId: string) => {
      const result = await sendFriendRequest(userId);
      await refresh();
      return result;
    },
    [refresh],
  );

  const accept = useCallback(
    async (userId: string) => {
      await acceptFriendRequest(userId);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (userId: string) => {
      await removeFriend(userId);
      await refresh();
    },
    [refresh],
  );

  const accepted = useMemo(() => friends.filter((f) => f.state === 'accepted'), [friends]);
  const incoming = useMemo(() => friends.filter((f) => f.state === 'incoming'), [friends]);
  const outgoing = useMemo(() => friends.filter((f) => f.state === 'outgoing'), [friends]);
  const self = useMemo(() => ranking.find((row) => row.isSelf) ?? null, [ranking]);

  return {
    ready: Boolean(user?.id) && isSocialCloudAvailable,
    loading,
    error,
    ranking,
    friends,
    accepted,
    incoming,
    outgoing,
    self,
    refresh,
    request,
    accept,
    remove,
  };
}
