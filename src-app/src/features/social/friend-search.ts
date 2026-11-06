/**
 * friend-search.ts — busca de usuários pelo nome/tag (tabela public.profiles).
 *
 * A lista de amigos do app é local-first, mas o cadastro (username/display_name)
 * fica no Supabase. A busca só é usada para preencher o convite com o `id` da
 * conta; a amizade continua sendo gravada localmente por `acceptFriendInvite`.
 *
 * A "tag" do jogador é o `@username`; a busca aceita o prefixo `@`/`#` e procura
 * tanto no username quanto no display_name.
 */

import { isSupabaseConfigured, supabase } from '@/core/supabase';

export interface PlayerSearchResult {
  /** `id` da conta (mesmo código permanente do QR de amizade). */
  id: string;
  username: string;
  displayName: string;
}

const MAX_QUERY = 32;
const MIN_QUERY = 2;

/**
 * Remove caracteres que quebram a sintaxe do filtro `.or()` do PostgREST e
 * aceita a tag digitada no formato do jogo (`@username` / `#username`): o
 * prefixo é descartado e a busca continua por username/display_name.
 */
export function sanitizeSearchQuery(raw: string): string {
  return raw
    .replace(/[%_,()*\\"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[@#]+/, '')
    .trim()
    .slice(0, MAX_QUERY);
}

export function isSearchableQuery(raw: string): boolean {
  return sanitizeSearchQuery(raw).length >= MIN_QUERY;
}

export class PlayerSearchOfflineError extends Error {
  constructor() {
    super('offline');
    this.name = 'PlayerSearchOfflineError';
  }
}

export async function searchPlayers(
  rawQuery: string,
  options: { excludeId?: string | null; limit?: number } = {},
): Promise<PlayerSearchResult[]> {
  const term = sanitizeSearchQuery(rawQuery);
  if (term.length < MIN_QUERY) return [];
  if (!isSupabaseConfigured) throw new PlayerSearchOfflineError();

  const limit = Math.min(Math.max(options.limit ?? 12, 1), 25);
  const pattern = `%${term}%`;

  try {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('id, username, display_name')
      .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
      .order('username', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data ?? [])
      .filter((row: any) => row && typeof row.id === 'string' && row.id !== options.excludeId)
      .map((row: any) => {
        const username = typeof row.username === 'string' ? row.username.trim() : '';
        const displayName = typeof row.display_name === 'string' ? row.display_name.trim() : '';
        return {
          id: row.id as string,
          username,
          displayName: displayName || username || 'Usuário',
        };
      })
      .filter((player: PlayerSearchResult) => Boolean(player.username || player.displayName));
  } catch (error) {
    if (error instanceof PlayerSearchOfflineError) throw error;
    throw new Error('search-failed');
  }
}
