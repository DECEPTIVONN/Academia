/**
 * player-profile-data.ts — dados do modal de perfil do jogador (aba Social)
 *
 * v4.66.0 — sem dados fictícios: o perfil mostra apenas o que existe de fato.
 *   • Jogador local: tudo sai do histórico local (`LocalData`) + perfil salvo;
 *   • Outros jogadores (amigos reais da nuvem): nome, nível, XP total, XP do
 *     mês e ofensiva vêm do que a conta publicou (`profiles`); estatísticas
 *     detalhadas de treino são PRIVADAS do aparelho de cada um, então não são
 *     exibidas nem inventadas.
 */

import { getLevel, getXp, type LocalData } from '@/core/db/queries';
import type { Exercise, ProfileState } from '@/core/db/schema';
import { EMBLEMAS, getProfileStats } from '@/features/profile/profile-data';
import { averageLoadKg } from '@/lib/suggested-load';
import type { AvatarGlyphKey, FlagKey } from './ligas-data';

/* ── Entrada (o que a lista/popover já sabe do jogador) ── */

export type PlayerKind = 'amigo';

export interface PlayerSummaryInput {
  id: string;
  name: string;
  kind: PlayerKind;
  isSelf?: boolean;
  /** XP total (todas as temporadas). */
  trophies: number;
  /** XP conquistado na janela mensal da liga (ranking global). */
  monthlyXp?: number;
  /** Posição no ranking global mensal, quando conhecida. */
  rank?: number | null;
  level?: number;
  flag?: FlagKey;
  glyph?: AvatarGlyphKey;
  /** Foto de perfil real (customization.photo / OAuth), quando houver. */
  photo?: string;
  /** Emblema de identidade equipado — vira a imagem de perfil sem foto. */
  avatarEmblemId?: string;
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

export interface PlayerLastWorkoutView {
  sheetKey: string;
  date: string;
  /** Exercícios COMPLETOS, para o mesmo deck da prévia do Início. */
  exercises: Exercise[];
  /** Custo médio de carga em kg. */
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
  avatarEmblemId?: string;
  avatarFrame?: string | null;
  glyph: AvatarGlyphKey;
  flag: FlagKey;
  level: number;
  trophies: number;
  monthlyXp: number;
  rank: number | null;
  /** Emblemas equipados (somente o próprio jogador expõe isso). */
  emblems: PlayerEmblemView[];
  /** `null` quando os números de treino não estão disponíveis (outros jogadores). */
  lastWorkout: PlayerLastWorkoutView | null;
  stats: PlayerStatsView | null;
}

/**
 * Resumo do JOGADOR LOCAL — usado pelo banner do Início, que abre direto o
 * perfil completo (v4.56.14) em vez do hub de configurações.
 */
export function selfPlayerSummary(
  data: LocalData,
  profileState?: ProfileState | null,
): PlayerSummaryInput {
  const name = profileState?.customization?.nome?.trim() || 'Atleta';
  const trophies = getXp(data.history);
  return {
    id: 'self',
    name,
    kind: 'amigo',
    isSelf: true,
    trophies,
    level: getLevel(trophies),
    online: true,
    lastSeenHours: 0,
    streak: 0,
    flag: 'BR',
    glyph: 'crown',
    photo: profileState?.customization?.photo,
    avatarEmblemId: profileState?.customization?.mainEmblem,
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

const TAG_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Tag curta estável por jogador (#RL88YRJL), derivada do id/nome. */
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
 * Último acesso estimado de quem não tem horário próprio (lista local de
 * amigos por QR): on-line = 0 (agora); fora do ar = 1–95 h.
 */
export function fallbackLastSeenHours(seed: string, online?: boolean): number {
  if (online) return 0;
  return 1 + (hashString(seed) % 95);
}

/** Ofensiva estimada de quem não publicou sequência (amigos só locais). */
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
    exercises: deck,
    averageLoad: Math.round(averageLoadKg(deck) * 10) / 10,
  };
}

/** Treino feito mais vezes nos últimos 7 dias. */
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
  const pc = isSelf ? profileState?.customization : undefined;
  const selfStats = isSelf ? getProfileStats(data) : null;

  let stats: PlayerStatsView | null = null;
  let lastWorkout: PlayerLastWorkoutView | null = null;
  let emblems: PlayerEmblemView[] = [];

  if (isSelf) {
    const completed = data.history.filter((entry) => entry.completed);
    const minutes = completed.reduce((sum, entry) => sum + (entry.durationMin ?? 0), 0);
    const doneIds = new Set<string>();
    for (const entry of completed) for (const id of entry.checks ?? []) doneIds.add(id);

    stats = {
      workouts: selfStats?.totalTreinos ?? completed.length,
      hours: Math.round((minutes / 60) * 10) / 10,
      exercisesDone: doneIds.size,
      catalogSize: data.exercises.length,
      favoriteWorkout: favoriteWorkout(data),
    };
    lastWorkout = selfLastWorkout(data);
    emblems = selfEmblems(profileState);
  }

  return {
    id: input.id,
    name: input.name,
    tag: playerTag(isSelf ? `self:${input.name}` : input.id || input.name),
    kind: input.kind,
    subtitle: isSelf ? 'Você' : 'Amigo',
    isSelf,
    online: input.online === true,
    lastSeenHours: Math.max(0, Math.floor(input.lastSeenHours ?? 0)),
    streak: Math.max(0, Math.floor(input.streak ?? 0)),
    banner: pc?.banner || BANNER_KEYS[seed % BANNER_KEYS.length],
    photo: pc?.photo ?? input.photo,
    avatarSeed: pc?.avatarSeed,
    avatarEmblemId: input.avatarEmblemId ?? (isSelf ? pc?.mainEmblem : undefined),
    avatarFrame: pc?.avatarFrame ?? null,
    glyph: input.glyph ?? 'crown',
    flag: input.flag ?? 'BR',
    level: input.level ?? selfStats?.nivel ?? 1,
    trophies: input.trophies,
    monthlyXp: input.monthlyXp ?? 0,
    rank: typeof input.rank === 'number' && input.rank > 0 ? input.rank : null,
    emblems,
    lastWorkout,
    stats,
  };
}
