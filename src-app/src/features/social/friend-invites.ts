/**
 * friend-invites.ts — identidade permanente e convites de amizade
 *
 * O QR/link de amizade NÃO expira: o código vem da conta Supabase quando o
 * usuário está logado (`user.id`) ou de um código local persistente no
 * localStorage quando o app está em modo offline. O nome vai no payload para
 * que o outro aparelho consiga exibir o amigo mesmo sem consultar o servidor
 * (a lista de amigos do app é local-first e replica entre os dispositivos do
 * mesmo usuário pelo snapshot de sync; a relação bilateral de contas reais usa
 * a tabela `friendships` + `friends_overview`).
 *
 * Formato do convite:
 *   https://<origem>/?amigo=<codigo>&nome=<nome>
 *   academia-friend:<codigo>|<nome>   (fallback para QR manual/testes)
 */

import { IDENTITY_EMBLEMS } from '@/features/profile/profile-data';
import type { AvatarGlyphKey, FlagKey, FriendItem } from './ligas-data';

const CODE_KEY = 'academia_friend_code_v1';
const ADDED_FRIENDS_KEY = 'academia_added_friends_v1';
const CODE_RE = /^[A-Za-z0-9_-]{6,80}$/;
const MAX_NAME = 24;
const MAX_STORED_FRIENDS = 200;

/** Fallback em memória para navegadores onde o localStorage é bloqueado. */
let memoryFriendCode: string | null = null;

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

export interface FriendInvite {
  code: string;
  name: string;
}

export type FriendAcceptStatus = 'added' | 'duplicate' | 'self' | 'invalid';

export interface FriendAcceptResult {
  status: FriendAcceptStatus;
  friend?: FriendItem;
}

/* ── localStorage seguro ── */

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/* ── Código permanente ── */

function generateLocalCode(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  const random = () => Math.random().toString(36).slice(2, 12);
  return `ac-${Date.now().toString(36)}-${random()}${random()}`;
}

/**
 * Código permanente do usuário.
 * Logado: usa o ID da conta (estável entre aparelhos) e o guarda localmente.
 * Offline: usa/gera um UUID local que nunca muda neste aparelho.
 */
export function getFriendCode(authUserId?: string | null): string {
  const accountId = authUserId?.trim();
  if (accountId && CODE_RE.test(accountId)) {
    memoryFriendCode = accountId;
    writeStorage(CODE_KEY, accountId);
    return accountId;
  }

  const stored = readStorage(CODE_KEY)?.trim();
  if (stored && CODE_RE.test(stored)) {
    memoryFriendCode = stored;
    return stored;
  }
  if (memoryFriendCode) return memoryFriendCode;

  const created = generateLocalCode();
  memoryFriendCode = created;
  writeStorage(CODE_KEY, created);
  return created;
}

/* ── Payload ── */

function normalizeName(value: string | null | undefined): string {
  const clean = (value || '')
    // eslint-disable-next-line no-control-regex -- remove controles do nome vindo do QR
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.slice(0, MAX_NAME) || 'Amigo';
}

function makeInvite(code: string | null | undefined, name: string | null | undefined): FriendInvite | null {
  const normalizedCode = code?.trim() || '';
  if (!CODE_RE.test(normalizedCode)) return null;
  return { code: normalizedCode, name: normalizeName(name) };
}

/** URL fixa de convite (não expira). */
export function buildFriendInviteUrl(code: string, name: string): string {
  const url = new URL(`${window.location.origin}${window.location.pathname}`);
  url.searchParams.set('amigo', code);
  url.searchParams.set('nome', normalizeName(name));
  return url.toString();
}

/** Aceita o formato de URL gerado pelo app e o formato compacto de fallback. */
export function parseFriendInvite(raw: string): FriendInvite | null {
  const text = raw.trim();
  if (!text) return null;

  if (text.toLowerCase().startsWith('academia-friend:')) {
    const payload = text.slice('academia-friend:'.length);
    const separator = payload.indexOf('|');
    if (separator < 0) return makeInvite(payload, 'Amigo');
    return makeInvite(payload.slice(0, separator), payload.slice(separator + 1));
  }

  try {
    const url = new URL(text, window.location.origin);
    const code = url.searchParams.get('amigo') ?? url.searchParams.get('friend');
    if (!code) return null;
    return makeInvite(
      code,
      url.searchParams.get('nome') ?? url.searchParams.get('name'),
    );
  } catch {
    return null;
  }
}

/** Lê o convite da URL atual (sem limpar). */
export function readFriendInviteFromUrl(): FriendInvite | null {
  try {
    return parseFriendInvite(window.location.href);
  } catch {
    return null;
  }
}

/** Remove os parâmetros de convite da URL, preservando os demais. */
export function clearFriendInviteFromUrl(): void {
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of ['amigo', 'nome', 'friend', 'name']) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (!changed) return;
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* sem histórico/URL: ignora */
  }
}

/* ── Lista persistida ── */

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function friendIdForCode(code: string): string {
  return `friend:${code}`;
}

function createFriendItem(invite: FriendInvite): FriendItem {
  const hash = hashString(invite.code);
  return {
    id: friendIdForCode(invite.code),
    name: invite.name,
    clan: null,
    trophies: 0,
    online: false,
    avatarColor: AVATAR_COLORS[hash % AVATAR_COLORS.length],
    avatarInitial: invite.name.charAt(0).toUpperCase() || 'A',
    rank: 0,
    avatarGlyph: AVATAR_GLYPHS[hash % AVATAR_GLYPHS.length],
    flag: FLAGS[hash % FLAGS.length],
    level: 1,
    avatarEmblemId: IDENTITY_EMBLEMS[hash % IDENTITY_EMBLEMS.length]?.id,
    friendCode: invite.code,
    addedAt: Date.now(),
  };
}

function sanitizeStoredFriend(value: unknown): FriendItem | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<FriendItem>;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, MAX_NAME) : '';
  if (!id || !name) return null;

  const glyph = typeof raw.avatarGlyph === 'string' && AVATAR_GLYPHS.includes(raw.avatarGlyph as AvatarGlyphKey)
    ? (raw.avatarGlyph as AvatarGlyphKey)
    : 'crown';
  const flag = typeof raw.flag === 'string' && FLAGS.includes(raw.flag as FlagKey)
    ? (raw.flag as FlagKey)
    : 'BR';

  return {
    id,
    name,
    clan: null,
    trophies: Number.isFinite(raw.trophies) ? Math.max(0, Math.floor(raw.trophies as number)) : 0,
    online: Boolean(raw.online),
    avatarColor: typeof raw.avatarColor === 'string' && raw.avatarColor
      ? raw.avatarColor
      : AVATAR_COLORS[0],
    avatarInitial: typeof raw.avatarInitial === 'string' && raw.avatarInitial
      ? raw.avatarInitial.slice(0, 1).toUpperCase()
      : name.charAt(0).toUpperCase(),
    rank: Number.isFinite(raw.rank) ? Math.max(0, Math.floor(raw.rank as number)) : 0,
    avatarGlyph: glyph,
    flag,
    level: Number.isFinite(raw.level) ? Math.max(1, Math.floor(raw.level as number)) : 1,
    photo: typeof raw.photo === 'string' && raw.photo ? raw.photo : undefined,
    avatarEmblemId:
      typeof raw.avatarEmblemId === 'string' && raw.avatarEmblemId ? raw.avatarEmblemId : undefined,
    friendCode: typeof raw.friendCode === 'string' ? raw.friendCode : undefined,
    addedAt: Number.isFinite(raw.addedAt) ? Math.floor(raw.addedAt as number) : undefined,
  };
}

export function loadAddedFriends(): FriendItem[] {
  try {
    const parsed = JSON.parse(readStorage(ADDED_FRIENDS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizeStoredFriend)
      .filter((friend): friend is FriendItem => friend !== null)
      .slice(0, MAX_STORED_FRIENDS);
  } catch {
    return [];
  }
}

function saveAddedFriends(friends: FriendItem[]): boolean {
  const ok = writeStorage(ADDED_FRIENDS_KEY, JSON.stringify(friends.slice(0, MAX_STORED_FRIENDS)));
  if (ok && typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('academia:friends-changed'));
  }
  return ok;
}

/** Junta os amigos adicionados (primeiro) com a lista base, sem duplicar IDs. */
export function mergeFriends(added: FriendItem[], base: FriendItem[]): FriendItem[] {
  const seen = new Set<string>();
  return [...added, ...base].filter((friend) => {
    if (seen.has(friend.id)) return false;
    seen.add(friend.id);
    return true;
  });
}

/**
 * Adiciona o convite à lista persistida.
 * A amizade é local-first e unilateral: quem escaneia recebe o outro na lista.
 */
export function acceptFriendInvite(invite: FriendInvite, selfCode: string): FriendAcceptResult {
  if (!invite || !CODE_RE.test(invite.code)) return { status: 'invalid' };
  if (invite.code === selfCode) return { status: 'self' };

  const current = loadAddedFriends();
  const id = friendIdForCode(invite.code);
  const existing = current.find((friend) => friend.id === id || friend.friendCode === invite.code);

  if (existing) {
    if (existing.name !== invite.name) {
      const renamed: FriendItem = {
        ...existing,
        name: invite.name,
        avatarInitial: invite.name.charAt(0).toUpperCase() || 'A',
      };
      saveAddedFriends(current.map((friend) => (friend.id === existing.id ? renamed : friend)));
      return { status: 'duplicate', friend: renamed };
    }
    return { status: 'duplicate', friend: existing };
  }

  const friend = createFriendItem(invite);
  saveAddedFriends([friend, ...current]);
  return { status: 'added', friend };
}
