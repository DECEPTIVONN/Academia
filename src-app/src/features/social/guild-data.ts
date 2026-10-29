/**
 * guild-data.ts — Estado e regras do sistema de guildas (aba Social)
 *
 * Modelo inspirado nos clãs de Clash Royale: o jogador começa SEM guilda e
 * pode entrar em uma existente ou criar a sua. O que NÃO existe aqui (pedido
 * explícito): doações semanais e pontuação do clã — a guilda não acumula
 * score próprio; cada membro tem os seus troféus.
 *
 * Persistência local (localStorage `academia_guilds_v1`), no mesmo padrão das
 * ligas (ligas-data.ts). O estado é lido/escrito por funções puras e a UI
 * reage ao evento `academia:guild-changed` via `useGuildState`.
 */

import { useEffect, useState } from 'react';
import type { AvatarGlyphKey, FlagKey } from './ligas-data';

/* ── Tipos ── */

export type GuildRole = 'Líder' | 'Ancião' | 'Membro';
export type GuildType = 'Aberto' | 'Fechado';
export type GuildFilterType = GuildType | 'Todos';

export interface GuildMember {
  id: string;
  name: string;
  role: GuildRole;
  trophies: number;
  level: number;
  glyph: AvatarGlyphKey;
  flag: FlagKey;
  isSelf?: boolean;
  /** Horas desde o último acesso (0 = agora). Usado no popover do membro. */
  lastSeenHours?: number;
  /** Dias consecutivos de treino (ofensiva). Usado no popover do membro. */
  streak?: number;
}

export interface Guild {
  id: string;
  tag: string;
  name: string;
  description: string;
  emblemId: string;
  type: GuildType;
  requiredTrophies: number;
  location: string;
  members: GuildMember[];
  createdAt: number;
  /** Guilda criada pelo jogador (some ao sair, se ele era o único membro). */
  createdBySelf?: boolean;
}

export interface GuildState {
  guilds: Guild[];
  joinedId: string | null;
}

/** Dados do jogador usados na guilda (troféus = XP de treinos do app). */
export interface GuildPlayer {
  name: string;
  trophies: number;
  level: number;
  glyph: AvatarGlyphKey;
  flag: FlagKey;
}

export interface GuildFilters {
  minMembers: number;
  maxMembers: number;
  maxRequired: number;
  type: GuildFilterType;
  location: string;
  joinableOnly: boolean;
}

/** Motivo pelo qual o jogador não pode entrar numa guilda. */
export type GuildBlockReason = 'joined' | 'closed' | 'full' | 'trophies' | null;

export interface GuildJoinResult {
  ok: boolean;
  reason?: GuildBlockReason;
  guild?: Guild;
}

/* ── Constantes ── */

export const GUILD_MAX_MEMBERS = 50;
export const GUILD_STORAGE_KEY = 'academia_guilds_v1';
export const GUILD_EVENT = 'academia:guild-changed';

export const GUILD_LOCATIONS = [
  'Internacional',
  'Brasil',
  'América do Sul',
  'América do Norte',
  'Europa',
];

/** Opções do seletor "Troféus necessários" (passo fixo, sem digitação livre). */
export const GUILD_TROPHY_STEPS = [0, 100, 250, 500, 1000, 2000, 4000];

export const DEFAULT_GUILD_FILTERS: GuildFilters = {
  minMembers: 1,
  maxMembers: GUILD_MAX_MEMBERS,
  maxRequired: 4000,
  type: 'Todos',
  location: 'Qualquer',
  joinableOnly: false,
};

export const GUILD_BLOCK_LABEL: Record<Exclude<GuildBlockReason, null>, string> = {
  joined: 'Você já está em uma guilda.',
  closed: 'Esta guilda está fechada para novos membros.',
  full: 'Esta guilda está cheia.',
  trophies: 'Você ainda não tem os troféus necessários.',
};

/* ── Helpers ── */

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Normaliza para busca: sem acento, minúsculo (mesmo padrão da Busca Geral). */
export function normalizeGuildQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function makeTag(seed: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let n = hashString(seed);
  let tag = '';
  for (let i = 0; i < 6; i++) {
    tag += alphabet[n % alphabet.length];
    n = Math.floor(n / alphabet.length);
  }
  return tag;
}

const MEMBER_NAMES = [
  'Gabriel Santos',
  'Lucas Ferreira',
  'Beatriz Lima',
  'Renato Alves',
  'Marina Costa',
  'Diego Ramos',
  'Camila Souza',
  'Felipe Braga',
  'Ana Clara',
  'Vitor Hugo',
  'Rafael Moura',
  'Juliana Reis',
  'Bruno Tavares',
  'Larissa Nunes',
  'Thiago Barros',
  'Patrícia Melo',
  'Eduardo Pires',
  'Carolina Dias',
  'Murilo Castro',
  'Sofia Andrade',
  'Gustavo Leal',
  'Isabela Rocha',
  'Henrique Farias',
  'Natália Prado',
  'André Matos',
  'Lívia Campos',
  'Fábio Teixeira',
  'Renata Borges',
  'Caio Mendes',
  'Helena Duarte',
  'Otávio Vieira',
  'Bianca Freitas',
  'Sérgio Lopes',
  'Aline Moreira',
  'Pedro Sales',
  'Jéssica Amaral',
  'Igor Bastos',
  'Manuela Rios',
  'Leandro Cunha',
  'Tainá Correia',
  'Rodrigo Neves',
  'Vanessa Rangel',
  'Alan Peixoto',
  'Cristina Maia',
  'Wesley Fonseca',
  'Priscila Guedes',
  'Marcelo Teles',
  'Débora Farias',
  'Yuri Cordeiro',
  'Elisa Pacheco',
  'Samuel Aguiar',
  'Cláudia Ferraz',
];

const MEMBER_GLYPHS: AvatarGlyphKey[] = [
  'crown',
  'star',
  'flame',
  'bolt',
  'skull',
  'ghost',
  'robot',
  'rocket',
  'paw',
  'leaf',
  'moon',
  'sun',
  'shield',
  'sword',
  'gem',
  'wolf',
  'frog',
  'alien',
  'panda',
  'lion',
];

const MEMBER_FLAGS: FlagKey[] = ['BR', 'BR', 'BR', 'AR', 'CL', 'US', 'MX', 'ES'];

/* ── Guildas iniciais (elenco fixo, roster determinístico) ── */

interface SeedGuild {
  name: string;
  tag: string;
  description: string;
  emblemId: string;
  type: GuildType;
  requiredTrophies: number;
  location: string;
  members: number;
  offset: number;
}

const SEED_GUILDS: SeedGuild[] = [
  {
    name: 'Academia Masters BR',
    tag: 'G8CQV2',
    description: 'Treino pesado, cabeça no lugar. Entra, monta sua ficha e bora crescer junto.',
    emblemId: 'prestigio-1',
    type: 'Aberto',
    requiredTrophies: 0,
    location: 'Brasil',
    members: 48,
    offset: 0,
  },
  {
    name: 'Iron Forge SP',
    tag: 'R2J09',
    description: 'Guilda da forja: progressão de carga acima de tudo. Foco, constância e respeito.',
    emblemId: 'escudo-aguia',
    type: 'Aberto',
    requiredTrophies: 0,
    location: 'Brasil',
    members: 46,
    offset: 7,
  },
  {
    name: 'Titan Fitness',
    tag: 'T1T4N5',
    description: 'Só treino sério. Ficha completa, descanso cronometrado e zero desculpa.',
    emblemId: 'estrela-honra',
    type: 'Aberto',
    requiredTrophies: 100,
    location: 'Internacional',
    members: 29,
    offset: 13,
  },
  {
    name: 'Academia Prime',
    tag: 'PR1M3',
    description: 'Seleção dos veteranos. Entrada fechada, foco em performance e técnica.',
    emblemId: 'lobo-alfa',
    type: 'Fechado',
    requiredTrophies: 250,
    location: 'Brasil',
    members: 49,
    offset: 21,
  },
  {
    name: 'Red Star Lift',
    tag: 'R3DST4',
    description: 'Do iniciante ao avançado — aqui todo mundo puxa ferro junto.',
    emblemId: 'estrela-honra',
    type: 'Aberto',
    requiredTrophies: 500,
    location: 'Internacional',
    members: 31,
    offset: 33,
  },
  {
    name: 'Nordic Kings',
    tag: 'N0RD1C',
    description: 'Time fechado de alto volume. Só entra quem já tem estrada na academia.',
    emblemId: 'escudo-aguia',
    type: 'Fechado',
    requiredTrophies: 1000,
    location: 'Europa',
    members: 22,
    offset: 41,
  },
];

function buildSeedMembers(guild: SeedGuild): GuildMember[] {
  const base = hashString(`${guild.name}-${guild.tag}`);
  const members: GuildMember[] = [];
  for (let i = 0; i < guild.members; i++) {
    const nameIndex = (guild.offset + i) % MEMBER_NAMES.length;
    members.push({
      id: `${guild.tag}-${i}`,
      name: MEMBER_NAMES[nameIndex],
      role: i === 0 ? 'Líder' : i <= 4 ? 'Ancião' : 'Membro',
      trophies: 60 + ((base + i * 137) % 1450),
      level: 3 + ((i * 5) % 17),
      glyph: MEMBER_GLYPHS[(nameIndex + i) % MEMBER_GLYPHS.length],
      flag: MEMBER_FLAGS[(base + i) % MEMBER_FLAGS.length],
      lastSeenHours: i === 0 ? 0 : 1 + ((base + i * 11) % 95),
      streak: 1 + ((base + i * 7) % 30),
    });
  }
  return members;
}

function buildSeedGuild(seed: SeedGuild, createdAt: number): Guild {
  return {
    id: `guild-${seed.tag.toLowerCase()}`,
    tag: seed.tag,
    name: seed.name,
    description: seed.description,
    emblemId: seed.emblemId,
    type: seed.type,
    requiredTrophies: seed.requiredTrophies,
    location: seed.location,
    members: buildSeedMembers(seed),
    createdAt,
  };
}

function seedState(): GuildState {
  const createdAt = 1760000000000;
  return { guilds: SEED_GUILDS.map((seed) => buildSeedGuild(seed, createdAt)), joinedId: null };
}

/* ── Persistência ── */

function isValidGuild(value: unknown): value is Guild {
  if (!value || typeof value !== 'object') return false;
  const g = value as Partial<Guild>;
  return (
    typeof g.id === 'string' &&
    typeof g.name === 'string' &&
    typeof g.tag === 'string' &&
    Array.isArray(g.members)
  );
}

function normalizeGuild(guild: Guild): Guild {
  return {
    ...guild,
    description: typeof guild.description === 'string' ? guild.description : '',
    emblemId: typeof guild.emblemId === 'string' ? guild.emblemId : 'prestigio-1',
    type: guild.type === 'Fechado' ? 'Fechado' : 'Aberto',
    requiredTrophies: Number.isFinite(guild.requiredTrophies) ? Math.max(0, guild.requiredTrophies) : 0,
    location: typeof guild.location === 'string' ? guild.location : 'Internacional',
    createdAt: Number.isFinite(guild.createdAt) ? guild.createdAt : Date.now(),
    members: guild.members
      .filter((m) => m && typeof m.name === 'string')
      .map((m, index) => ({
        id: typeof m.id === 'string' ? m.id : `member-${index}`,
        name: m.name,
        role: m.role === 'Líder' || m.role === 'Ancião' ? m.role : 'Membro',
        trophies: Number.isFinite(m.trophies) ? Math.max(0, Math.floor(m.trophies)) : 0,
        level: Number.isFinite(m.level) ? Math.max(1, Math.floor(m.level)) : 1,
        glyph: m.glyph || 'crown',
        flag: m.flag || 'BR',
        isSelf: m.isSelf === true,
        lastSeenHours: Number.isFinite(m.lastSeenHours)
          ? Math.max(0, Math.floor(m.lastSeenHours as number))
          : 0,
        streak: Number.isFinite(m.streak) ? Math.max(0, Math.floor(m.streak as number)) : 0,
      })),
  };
}

export function readGuildState(): GuildState {
  if (typeof window === 'undefined') return seedState();
  try {
    const raw = localStorage.getItem(GUILD_STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as Partial<GuildState>;
    if (!parsed || !Array.isArray(parsed.guilds)) return seedState();
    const guilds = parsed.guilds.filter(isValidGuild).map(normalizeGuild);
    if (guilds.length === 0) return seedState();
    const joinedId =
      typeof parsed.joinedId === 'string' && guilds.some((g) => g.id === parsed.joinedId)
        ? parsed.joinedId
        : null;
    return { guilds, joinedId };
  } catch (error) {
    console.error('Erro ao carregar as guildas:', error);
    return seedState();
  }
}

function writeGuildState(state: GuildState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUILD_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Erro ao salvar as guildas:', error);
  }
  window.dispatchEvent(new CustomEvent<GuildState>(GUILD_EVENT, { detail: state }));
}

function selfMember(player: GuildPlayer, role: GuildRole): GuildMember {
  return {
    id: 'self',
    name: player.name,
    role,
    trophies: player.trophies,
    level: player.level,
    glyph: player.glyph,
    flag: player.flag,
    isSelf: true,
    lastSeenHours: 0,
    streak: 1,
  };
}

/** Mantém o membro do jogador (nome/troféus/nível) em dia com o perfil local. */
function syncSelf(state: GuildState, player: GuildPlayer): GuildState | null {
  if (!state.joinedId) return null;
  const guild = state.guilds.find((g) => g.id === state.joinedId);
  const self = guild?.members.find((m) => m.isSelf);
  if (!guild || !self) return null;
  if (self.name === player.name && self.trophies === player.trophies && self.level === player.level) {
    return null;
  }
  return {
    ...state,
    guilds: state.guilds.map((g) =>
      g.id !== guild.id
        ? g
        : {
            ...g,
            members: g.members.map((m) =>
              m.isSelf
                ? { ...m, name: player.name, trophies: player.trophies, level: player.level }
                : m,
            ),
          },
    ),
  };
}

function persistSelfSync(player: GuildPlayer): void {
  const state = readGuildState();
  const next = syncSelf(state, player);
  if (next) writeGuildState(next);
}

/* ── Regras ── */

export function getGuild(state: GuildState): Guild | null {
  return state.guilds.find((g) => g.id === state.joinedId) ?? null;
}

export function canJoinGuild(
  guild: Guild,
  state: GuildState,
  player: GuildPlayer,
): GuildBlockReason {
  if (state.joinedId) return 'joined';
  if (guild.type === 'Fechado') return 'closed';
  if (guild.members.length >= GUILD_MAX_MEMBERS) return 'full';
  if (player.trophies < guild.requiredTrophies) return 'trophies';
  return null;
}

export function joinGuild(guildId: string, player: GuildPlayer): GuildJoinResult {
  const state = readGuildState();
  const guild = state.guilds.find((g) => g.id === guildId);
  if (!guild) return { ok: false };
  const reason = canJoinGuild(guild, state, player);
  if (reason) return { ok: false, reason };

  const joined: Guild = {
    ...guild,
    members: [...guild.members, selfMember(player, 'Membro')],
  };
  const next: GuildState = {
    joinedId: joined.id,
    guilds: state.guilds.map((g) => (g.id === joined.id ? joined : g)),
  };
  writeGuildState(next);
  return { ok: true, guild: joined };
}

export function leaveGuild(): void {
  const state = readGuildState();
  const guild = getGuild(state);
  if (!guild) return;
  const keepGuild = !guild.createdBySelf;
  const next: GuildState = {
    joinedId: null,
    guilds: state.guilds
      .filter((g) => keepGuild || g.id !== guild.id)
      .map((g) =>
        g.id === guild.id ? { ...g, members: g.members.filter((m) => !m.isSelf) } : g,
      ),
  };
  writeGuildState(next);
}

export interface GuildDraft {
  name: string;
  description: string;
  emblemId: string;
  type: GuildType;
  requiredTrophies: number;
  location: string;
}

export type GuildDraftError = 'joined' | 'name' | 'exists' | null;

export function validateGuildDraft(draft: GuildDraft, state: GuildState): GuildDraftError {
  if (state.joinedId) return 'joined';
  const name = draft.name.trim();
  if (name.length < 2 || name.length > 20) return 'name';
  const normalized = normalizeGuildQuery(name);
  if (state.guilds.some((g) => normalizeGuildQuery(g.name) === normalized)) return 'exists';
  return null;
}

export function createGuild(
  draft: GuildDraft,
  player: GuildPlayer,
): { ok: boolean; reason?: GuildDraftError | 'storage' } {
  const state = readGuildState();
  const reason = validateGuildDraft(draft, state);
  if (reason) return { ok: false, reason };

  const name = draft.name.trim();
  const idSeed = `${name}-${Date.now()}-${hashString(player.name)}`;
  const id = `guild-custom-${hashString(idSeed).toString(36)}`;
  const guild: Guild = {
    id,
    tag: makeTag(idSeed),
    name,
    description: draft.description.trim().slice(0, 80),
    emblemId: draft.emblemId,
    type: draft.type,
    requiredTrophies: Math.max(0, Math.round(draft.requiredTrophies)),
    location: draft.location,
    members: [selfMember(player, 'Líder')],
    createdAt: Date.now(),
    createdBySelf: true,
  };
  writeGuildState({ guilds: [...state.guilds, guild], joinedId: guild.id });
  return { ok: true };
}

/* ── Busca ── */

export function filterGuilds(
  state: GuildState,
  query: string,
  filters: GuildFilters,
  player: GuildPlayer,
): Guild[] {
  const q = normalizeGuildQuery(query);
  return state.guilds
    .filter((guild) => {
      if (q) {
        const haystack = normalizeGuildQuery(`${guild.name} ${guild.tag}`);
        if (!haystack.includes(q)) return false;
      }
      if (guild.members.length < filters.minMembers) return false;
      if (guild.members.length > filters.maxMembers) return false;
      if (guild.requiredTrophies > filters.maxRequired) return false;
      if (filters.type !== 'Todos' && guild.type !== filters.type) return false;
      if (filters.location !== 'Qualquer' && guild.location !== filters.location) return false;
      if (filters.joinableOnly && canJoinGuild(guild, state, player) !== null) return false;
      return true;
    })
    .sort((a, b) => b.members.length - a.members.length || a.name.localeCompare(b.name));
}

/* ── Hook ── */

export function useGuildState(player: GuildPlayer): GuildState {
  const [state, setState] = useState<GuildState>(readGuildState);

  useEffect(() => {
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<GuildState>).detail;
      setState(detail ?? readGuildState());
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === GUILD_STORAGE_KEY) setState(readGuildState());
    };
    window.addEventListener(GUILD_EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(GUILD_EVENT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  /* Nome/troféus/nível do jogador mudam com o uso do app: reflete na guilda. */
  useEffect(() => {
    persistSelfSync(player);
  }, [player]);

  return state;
}
