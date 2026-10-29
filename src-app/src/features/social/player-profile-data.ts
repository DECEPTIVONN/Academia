/**
 * player-profile-data.ts — dados do modal de perfil do jogador (aba Social)
 *
 * O perfil é a versão "Clash Royale" do atleta, com o vocabulário do app:
 * trófeus = XP de treinos, vitórias = treinos concluídos, série atual =
 * ofensiva, cartas encontradas = exercícios feitos, custo médio de elixir =
 * custo médio de carga do último treino e ligas = liga MENSAL.
 *
 * Jogador local (`isSelf`): todos os números saem dos dados reais
 * (`LocalData` + perfil/liga mensal). Demais jogadores (amigos/membros da
 * guilda): valores determinísticos derivados do id/nome — o Social é
 * demonstrativo e não tem perfil remoto (ver contexto em guild-data.ts).
 */

import type { LocalData } from '@/core/db/queries';
import type { Exercise, ProfileState } from '@/core/db/schema';
import type { Guild, GuildMember } from './guild-data';
import { EMBLEMAS, IDENTITY_EMBLEMS, getProfileStats } from '@/features/profile/profile-data';
import { averageLoadKg } from '@/lib/suggested-load';
import {
  getMonthlyLeagueState,
  LEAGUE_DIVISIONS,
  type AvatarGlyphKey,
  type FlagKey,
  type LeagueDivision,
} from './ligas-data';

/* ── Entrada (o que o popover/lista já sabe do jogador) ── */

export type PlayerKind = 'amigo' | 'membro';

export interface PlayerSummaryInput {
  id: string;
  name: string;
  kind: PlayerKind;
  isSelf?: boolean;
  /** Função na guilda (Líder/Ancião/Membro); ausente em amigos. */
  role?: string;
  clan?: string | null;
  clanEmblemId?: string;
  trophies: number;
  level?: number;
  flag?: FlagKey;
  glyph?: AvatarGlyphKey;
  online?: boolean;
  /** Horas desde o último acesso (0 = agora). */
  lastSeenHours?: number;
  streak?: number;
}

/* ── Saída (o que o modal desenha) ── */

export interface PlayerEmblemView {
  id: string;
  nome: string;
  icon: string;
}

export interface LastWorkoutExerciseView {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface PlayerLastWorkoutView {
  sheetKey: string;
  date: string;
  exercises: LastWorkoutExerciseView[];
  /** Custo médio de carga em kg (equivalente ao custo médio de elixir). */
  averageLoad: number;
}

export interface PlayerStatsView {
  workouts: number;
  hours: number;
  exercisesDone: number;
  catalogSize: number;
  favoriteWorkout: string | null;
}

export interface PlayerProfileView {
  id: string;
  name: string;
  tag: string;
  kind: PlayerKind;
  subtitle: string;
  isSelf: boolean;
  online: boolean;
  lastSeenHours: number;
  streak: number;
  banner: string;
  photo?: string;
  avatarSeed?: string;
  avatarEmblemUrl?: string;
  avatarFrame?: string | null;
  glyph: AvatarGlyphKey;
  flag: FlagKey;
  level: number;
  role?: string;
  clan: { name: string; emblemId: string } | null;
  trophies: number;
  totalWorkouts: number;
  arena: string;
  emblems: PlayerEmblemView[];
  leagues: { current: LeagueDivision; previous: LeagueDivision; best: LeagueDivision };
  lastWorkout: PlayerLastWorkoutView | null;
  stats: PlayerStatsView;
}

/** Converte um membro da guilda no resumo usado pelo popover do jogador. */
export function memberToPlayer(
  member: GuildMember,
  guild?: Pick<Guild, 'name' | 'emblemId'> | null,
): PlayerSummaryInput {
  return {
    id: member.id,
    name: member.name,
    kind: 'membro',
    isSelf: member.isSelf,
    role: member.role,
    clan: guild?.name ?? null,
    clanEmblemId: guild?.emblemId,
    trophies: member.trophies,
    level: member.level,
    flag: member.flag,
    glyph: member.glyph,
    online: (member.lastSeenHours ?? 0) <= 0,
    lastSeenHours: member.lastSeenHours,
    streak: member.streak,
  };
}

/* ── Utilidades determinísticas ── */

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** PRNG pequeno e determinístico (mulberry32) — mesmo jogador, mesmos números. */
function seededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAG_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Tag curta no formato do jogo (#RL88YRJL), estável por jogador. */
export function playerTag(seed: string): string {
  let n = hashString(seed);
  let tag = '';
  for (let i = 0; i < 8; i++) {
    tag += TAG_ALPHABET[n % TAG_ALPHABET.length];
    n = Math.floor(n / TAG_ALPHABET.length) + hashString(`${seed}:${i}`);
  }
  return `#${tag}`;
}

/**
 * Último acesso estimado de quem não tem horário próprio (amigos da lista):
 * on-line = 0 (agora); fora do ar = 1–95 h, determinístico pelo id/nome.
 */
export function fallbackLastSeenHours(seed: string, online?: boolean): number {
  if (online) return 0;
  return 1 + (hashString(seed) % 95);
}

/** Ofensiva estimada de quem não tem sequência própria (amigos da lista). */
export function fallbackStreak(seed: string): number {
  return hashString(seed) % 30;
}

/** Último acesso: on-line tem prioridade (pedido do usuário). */
export function formatLastSeen(hours: number | undefined, online?: boolean): string {
  if (online) return 'On-line';
  const value = Number.isFinite(hours) ? Math.max(0, Math.floor(hours as number)) : 0;
  if (value <= 0) return 'Agora';
  if (value < 24) return `Há ${value} h`;
  const days = Math.floor(value / 24);
  return days === 1 ? 'Há 1 dia' : `Há ${days} dias`;
}

const BANNER_KEYS = ['roxo-neon', 'aurora', 'aco-frio', 'ciberespaco', 'ouro-elite'];

function leagueRank(division: LeagueDivision | undefined): number {
  return division ? LEAGUE_DIVISIONS.indexOf(division) : -1;
}

function bestDivision(list: Array<LeagueDivision | undefined>): LeagueDivision {
  let best: LeagueDivision = LEAGUE_DIVISIONS[0];
  for (const item of list) {
    if (item && leagueRank(item) > leagueRank(best)) best = item;
  }
  return best;
}

/* ── Estatísticas do jogador local ── */

function selfLastWorkout(data: LocalData): PlayerLastWorkoutView | null {
  const latest = data.history
    .filter((entry) => entry.completed && entry.sheetKey)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!latest || !latest.sheetKey) return null;

  const map = new Map(data.exercises.map((ex) => [ex.id, ex]));
  const sheet = data.sheets.find((s) => s.sheetKey === latest.sheetKey && !s.isArchived);
  const ids = sheet?.exerciseIds ?? latest.checks ?? [];
  const deck = ids
    .map((id) => map.get(id))
    .filter((ex): ex is Exercise => Boolean(ex))
    .slice(0, 8);

  return {
    sheetKey: latest.sheetKey,
    date: latest.date,
    exercises: deck.map((ex) => ({ id: ex.id, name: ex.name, imageUrl: ex.imageUrl })),
    averageLoad: Math.round(averageLoadKg(deck) * 10) / 10,
  };
}

/** Treino feito mais vezes nos últimos 7 dias (carta favorita atual). */
function favoriteWorkout(data: LocalData): string | null {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  const from = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;

  const counts = new Map<string, number>();
  for (const entry of data.history) {
    if (!entry.completed || !entry.sheetKey || entry.date < from) continue;
    counts.set(entry.sheetKey, (counts.get(entry.sheetKey) ?? 0) + 1);
  }

  let best: { key: string; count: number } | null = null;
  for (const [key, count] of counts) {
    if (!best || count > best.count) best = { key, count };
  }
  return best ? `Ficha ${best.key}` : null;
}

function selfEmblems(profileState: ProfileState | null | undefined): PlayerEmblemView[] {
  const selected = profileState?.selectedEmblems ?? [];
  return selected
    .map((id) => EMBLEMAS.find((emblem) => emblem.id === id))
    .filter((emblem): emblem is (typeof EMBLEMAS)[number] => Boolean(emblem))
    .slice(0, 8)
    .map((emblem) => ({ id: emblem.id, nome: emblem.nome, icon: emblem.icon }));
}

/* ── Montagem ── */

export function buildPlayerProfile(
  input: PlayerSummaryInput,
  data: LocalData,
  profileState?: ProfileState | null,
): PlayerProfileView {
  const isSelf = input.isSelf === true;
  const seed = hashString(`${input.id}:${input.name}`);
  const rnd = seededRandom(seed);
  const pc = isSelf ? profileState?.customization : undefined;

  const selfStats = isSelf ? getProfileStats(data) : null;
  const totalWorkouts = selfStats
    ? selfStats.totalTreinos
    : Math.max(1, Math.round(input.trophies / 10));
  const streak = selfStats
    ? selfStats.streak
    : Math.max(0, Math.round(input.streak ?? Math.floor(rnd() * 30)));

  const catalogSize = data.exercises.length;
  const centerEmblem = pc?.mainEmblem
    ? IDENTITY_EMBLEMS.find((emblem) => emblem.id === pc.mainEmblem)
    : undefined;

  let stats: PlayerStatsView;
  let emblems: PlayerEmblemView[];
  let lastWorkout: PlayerLastWorkoutView | null;
  let leagues: PlayerProfileView['leagues'];

  if (isSelf) {
    const completed = data.history.filter((entry) => entry.completed);
    const minutes = completed.reduce((sum, entry) => sum + (entry.durationMin ?? 0), 0);
    const doneIds = new Set<string>();
    for (const entry of completed) for (const id of entry.checks ?? []) doneIds.add(id);

    stats = {
      workouts: totalWorkouts,
      hours: Math.round((minutes / 60) * 10) / 10,
      exercisesDone: doneIds.size,
      catalogSize,
      favoriteWorkout: favoriteWorkout(data),
    };
    emblems = selfEmblems(profileState);
    lastWorkout = selfLastWorkout(data);

    const monthly = getMonthlyLeagueState();
    leagues = {
      current: monthly.division,
      previous: monthly.lastResult?.oldDivision ?? monthly.division,
      best: bestDivision([
        monthly.bestDivision,
        monthly.division,
        monthly.lastResult?.oldDivision,
        monthly.lastResult?.newDivision,
      ]),
    };
  } else {
    const hoursFactor = 0.6 + rnd() * 0.8;
    const done = Math.min(
      catalogSize,
      Math.max(6, Math.round(catalogSize * (0.35 + rnd() * 0.6))),
    );
    const sheetKeys = data.sheets.length
      ? data.sheets.map((sheet) => sheet.sheetKey)
      : (['A', 'B', 'C'] as const);
    const favoriteKey = sheetKeys[Math.floor(rnd() * sheetKeys.length)];

    stats = {
      workouts: totalWorkouts,
      hours: Math.round(totalWorkouts * hoursFactor),
      exercisesDone: done,
      catalogSize,
      favoriteWorkout: `Ficha ${favoriteKey}`,
    };

    const startIndex = Math.floor(rnd() * EMBLEMAS.length);
    emblems = Array.from({ length: 8 }, (_, index) => {
      const emblem = EMBLEMAS[(startIndex + index * 3) % EMBLEMAS.length];
      return { id: `${emblem.id}-${index}`, nome: emblem.nome, icon: emblem.icon };
    });

    const deckSize = Math.min(6, catalogSize);
    const offset = catalogSize ? Math.floor(rnd() * catalogSize) : 0;
    const deck = Array.from({ length: deckSize }, (_, index) =>
      data.exercises[(offset + index) % Math.max(catalogSize, 1)],
    ).filter((ex): ex is Exercise => Boolean(ex));

    lastWorkout =
      deck.length > 0
        ? {
            sheetKey: favoriteKey,
            date: new Date(Date.now() - Math.floor(rnd() * 5) * 86400000)
              .toISOString()
              .slice(0, 10),
            exercises: deck.map((ex) => ({ id: ex.id, name: ex.name, imageUrl: ex.imageUrl })),
            averageLoad: Math.round(averageLoadKg(deck) * 10) / 10,
          }
        : null;

    const current = LEAGUE_DIVISIONS[Math.floor(rnd() * LEAGUE_DIVISIONS.length)];
    const previous = LEAGUE_DIVISIONS[Math.floor(rnd() * LEAGUE_DIVISIONS.length)];
    leagues = { current, previous, best: bestDivision([current, previous]) };
  }

  const level = input.level ?? selfStats?.nivel ?? 1;
  const arenaNumber = Math.min(25, 1 + Math.floor(input.trophies / 500));

  return {
    id: input.id,
    name: input.name,
    tag: playerTag(isSelf ? `self:${input.name}` : input.id || input.name),
    kind: input.kind,
    subtitle: input.role ?? (input.kind === 'membro' ? 'Membro' : 'Amigo'),
    isSelf,
    online: input.online === true,
    lastSeenHours: Math.max(0, Math.floor(input.lastSeenHours ?? 0)),
    streak,
    banner: pc?.banner || BANNER_KEYS[seed % BANNER_KEYS.length],
    photo: pc?.photo,
    avatarSeed: pc?.avatarSeed,
    avatarEmblemUrl: centerEmblem?.url,
    avatarFrame: pc?.avatarFrame ?? null,
    glyph: input.glyph ?? 'crown',
    flag: input.flag ?? 'BR',
    level,
    role: input.role,
    clan: input.clan
      ? { name: input.clan, emblemId: input.clanEmblemId ?? 'prestigio-1' }
      : null,
    trophies: input.trophies,
    totalWorkouts,
    arena: `Arena ${arenaNumber}`,
    emblems,
    leagues,
    lastWorkout,
    stats,
  };
}
