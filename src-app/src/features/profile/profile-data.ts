/**
 * profile-data.ts — Catálogos e helpers da tela Perfil (Fase 2)
 *
 * Réplicas literais de JS/treino/secao-customizacao.js, secao-perfil.js e
 * secao-progresso.js usadas pelo ProfileFeature. Catálogos em texto puro;
 * UI permanece no ProfileFeature emitindo as classes legadas.
 */

import { getStreak } from '@/core/db/queries';
import type { LocalData } from '@/core/db/queries';
import type {
  ProfileConquista,
  ProfileCustomization,
} from '@/core/db/schema';

/* ── Tipos ── */

export type UnlockTipo = 'treinos' | 'streak' | 'xp' | 'maestria';
export interface Unlock {
  tipo: UnlockTipo;
  val: number | string;
}

export interface ProfileStats {
  totalTreinos: number;
  xp: number;
  nivel: number;
  nivelName: string;
  xpIntoLevel: number;
  xpPct: number;
  xpNext: number;
  streak: number;
  maxStreak: number;
  maestriasN1: number;
  ciclos: number;
}

export interface BadgeDef {
  id: string;
  icon: string;
  name: string;
  desc: string;
  check: boolean;
  naturalCheck: boolean;
  special?: boolean;
}

/* ── Temas de cor (secao-perfil.js L6–50) ── */

export const APP_THEMES: Record<string, { p: string; pl: string; pd: string }> = {
  purple: { p: '#8b5cf6', pl: '#c084fc', pd: '#6d28d9' },
  green: { p: '#22c55e', pl: '#4ade80', pd: '#16a34a' },
  blue: { p: '#3b82f6', pl: '#60a5fa', pd: '#2563eb' },
  orange: { p: '#f97316', pl: '#fb923c', pd: '#ea580c' },
  red: { p: '#ef4444', pl: '#f87171', pd: '#dc2626' },
  cyan: { p: '#06b6d4', pl: '#22d3ee', pd: '#0891b2' },
  pink: { p: '#ec4899', pl: '#f472b6', pd: '#db2777' },
  amarelo: { p: '#facc15', pl: '#fde68a', pd: '#ca8a04' },
  cinza: { p: '#64748b', pl: '#94a3b8', pd: '#475569' },
  branco: { p: '#ffffff', pl: '#ffffff', pd: '#d1d5db' },
  prata: { p: '#94a3b8', pl: '#cbd5e1', pd: '#64748b' },
  dourado: { p: '#fbbf24', pl: '#fde68a', pd: '#d97706' },
};

export const THEME_TITLES: Record<string, string> = {
  purple: 'Roxo',
  green: 'Verde',
  blue: 'Azul',
  orange: 'Laranja',
  red: 'Vermelho',
  cyan: 'Ciano',
  pink: 'Rosa',
  amarelo: 'Amarelo',
  cinza: 'Cinza',
  branco: 'Branco',
  prata: 'Prata',
  dourado: 'Dourado',
};

export function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

/** Espelha `applyAppTheme` (secao-perfil.js L21): vars no :root + localStorage.
 *  A UI (.t-color.active) é derivada do estado React. */
export function applyAppTheme(themeKey: string): void {
  const theme = APP_THEMES[themeKey];
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.p);
  root.style.setProperty('--primary-light', theme.pl);
  root.style.setProperty('--primary-dark', theme.pd);
  root.style.setProperty('--primary-rgb', hexToRgb(theme.p));
  root.style.setProperty('--gradient', `linear-gradient(135deg, ${theme.p}, ${theme.pd})`);
  root.style.setProperty('--shadow', `rgba(${hexToRgb(theme.p)}, 0.3)`);
  localStorage.setItem('academia_theme', themeKey);
}

/* ── Preferências soltas (localStorage — secao-perfil.js L1107–1134) ── */

export const PREF_KEYS = {
  sounds: 'academia_pref_sounds',
  vibration: 'academia_pref_vibration',
  messages: 'academia_pref_messages',
  online: 'academia_pref_online',
  navbarMode: 'academia_pref_navbar_mode',
  autoFullscreen: 'academia_pref_auto_fullscreen',
  /* v4.5.0 — placeholders de Segurança/Notificações (salvos, sem efeito real) */
  appLockEnabled: 'academia_pref_app_lock_enabled',
  appLockBiometric: 'academia_pref_app_lock_biometric',
  appLockTimeout: 'academia_pref_app_lock_timeout',
  lockWallVertical: 'academia_pref_lock_wall_vertical',
  lockWallHorizontal: 'academia_pref_lock_wall_horizontal',
  workoutReminder: 'academia_pref_workout_reminder',
  workoutReminderTime: 'academia_pref_workout_reminder_time',
} as const;

export function isDevMode(): boolean {
  try {
    return localStorage.getItem('academia_dev_mode') === 'true';
  } catch {
    return false;
  }
}

export function readLS(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLS(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignora */
  }
}

/* ── Estatísticas de perfil (secao-progresso.js L34–52 + SHOWCASE computes) ── */

export function getProfileStats(data: LocalData): ProfileStats {
  const hist = data.history;
  const completed = hist.filter((h) => h.completed);
  const totalTreinos = completed.length;
  const xp = totalTreinos * 10;

  const xpPerLevel = 50;
  const nivel = Math.floor(xp / xpPerLevel) + 1;
  const xpIntoLevel = xp % xpPerLevel;
  const xpPct = (xpIntoLevel / xpPerLevel) * 100;

  let nivelName = 'Iniciante';
  if (nivel >= 50) nivelName = 'Mr. Olympia';
  else if (nivel >= 20) nivelName = 'Bodybuilder';
  else if (nivel >= 10) nivelName = 'Marombeiro';
  else if (nivel >= 5) nivelName = 'Amador';
  else if (nivel === 1) nivelName = 'Frango';

  // Maior sequência (SHOWCASE streak — secao-customizacao.js L184–195)
  const byDate = new Map(hist.map((h) => [h.date, h]));
  const days = hist.map((h) => h.date).sort();
  let maxStreak = 0;
  let cur = 0;
  for (let i = 0; i < days.length; i++) {
    if (byDate.get(days[i])?.completed) {
      if (i > 0 && byDate.get(days[i - 1])?.completed) cur++;
      else cur = 1;
      if (cur > maxStreak) maxStreak = cur;
    }
  }

  const maestrias = (data.legacy?.maestrias ?? {}) as Record<string, { nivel?: number }>;
  const maestriasN1 = Object.values(maestrias).filter((m) => (m.nivel || 1) > 1).length;

  return {
    totalTreinos,
    xp,
    nivel,
    nivelName,
    xpIntoLevel,
    xpPct,
    xpNext: nivel * xpPerLevel,
    streak: getStreak(hist),
    maxStreak,
    maestriasN1,
    ciclos: data.legacy?.prestige ?? 0,
  };
}

/* ── Desbloqueio (secao-customizacao.js L252–284) ── */

/** `isUnlocked` com acesso a `maestrias` (unlock.tipo='maestria'). */
export function isUnlocked(
  unlock: Unlock | null | undefined,
  stats: ProfileStats,
  devMode: boolean,
  maestrias: Record<string, { nivel?: number }> = {}
): boolean {
  if (devMode) return true;
  if (!unlock) return true;
  switch (unlock.tipo) {
    case 'treinos':
      return stats.totalTreinos >= (unlock.val as number);
    case 'streak':
      return stats.streak >= (unlock.val as number);
    case 'xp':
      return stats.xp >= (unlock.val as number);
    case 'maestria': {
      const NIVEL_MAP: Record<string, number> = { bronze: 1, prata: 2, ouro: 3 };
      const nivelReq = NIVEL_MAP[String(unlock.val)] || 1;
      return Object.values(maestrias).some((m) => (m.nivel || 1) >= nivelReq);
    }
    default:
      return false;
  }
}

/** Espelha `_unlockHint` (secao-customizacao.js L893–902). */
export function unlockHint(unlock: Unlock | null | undefined): string {
  if (!unlock) return '';
  switch (unlock.tipo) {
    case 'treinos':
      return `${unlock.val} treinos`;
    case 'streak':
      return `${unlock.val} dias`;
    case 'xp':
      return `${unlock.val} XP`;
    case 'maestria':
      return `Maestria ${unlock.val}`;
    default:
      return '';
  }
}

/* ── Conquistas / badges (secao-progresso.js L1094–1191) ── */

const SPECIAL_BADGES: BadgeDef[] = [
  { id: 'r_ogro', icon: '🦍', name: 'Força de Ogro', desc: 'Atingiu 90+ de Força no Radar Fit.', check: true, naturalCheck: true, special: true },
  { id: 'r_pulmao', icon: '🫁', name: 'Pulmão de Aço', desc: 'Atingiu 90+ de Resistência no Radar Fit.', check: true, naturalCheck: true, special: true },
  { id: 'r_davinci', icon: '🎨', name: 'O Simétrico', desc: 'Atingiu 90+ de Simetria no Radar Fit.', check: true, naturalCheck: true, special: true },
  { id: 'r_ninja', icon: '🥷', name: 'Mestre Ninja', desc: 'Atingiu 90+ de Equilíbrio no Radar Fit.', check: true, naturalCheck: true, special: true },
  { id: 'r_foguete', icon: '🚀', name: 'Modo Foguete', desc: 'Atingiu 90+ de Potência no Radar Fit.', check: true, naturalCheck: true, special: true },
  { id: 'r_maquina', icon: '⚙️', name: 'A Máquina', desc: 'Atingiu 90+ de Intensidade no Radar Fit.', check: true, naturalCheck: true, special: true },
  { id: 'r_tier2', icon: '🌟', name: 'Radar Prata', desc: 'Alcançou o Tier 2 do Radar Fit.', check: true, naturalCheck: true, special: true },
  { id: 'r_tier3', icon: '🌟', name: 'Radar Ouro', desc: 'Alcançou o Tier 3 do Radar Fit.', check: true, naturalCheck: true, special: true },
  { id: 'r_tier4', icon: '🌟', name: 'Radar Diamante', desc: 'Alcançou o Tier 4 do Radar Fit.', check: true, naturalCheck: true, special: true },
  { id: 'r_tier5', icon: '🌟', name: 'Radar Ametista', desc: 'Alcançou o Tier 5 do Radar Fit.', check: true, naturalCheck: true, special: true },
];

/** Volume máximo de um dia concluído (L1099–1115): ficha do dia × séries×reps×carga×porLado. */
function computeMaxDayVol(data: LocalData): number {
  const exMap = new Map(data.exercises.map((e) => [e.id, e]));
  const sheetMap = new Map(data.sheets.map((s) => [s.sheetKey, s]));
  let maxDayVol = 0;

  for (const row of data.history) {
    if (!row.completed || !row.sheetKey) continue;
    const ids = sheetMap.get(row.sheetKey)?.exerciseIds ?? [];
    let dayVol = 0;
    for (const id of ids) {
      const ex = exMap.get(id);
      if (!ex) continue;
      const s = Number(ex.sets) || 0;
      const r = parseInt(ex.reps) || 0;
      const c =
        parseFloat(String(ex.load).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      dayVol += s * r * c * (ex.porLado ? 2 : 1);
    }
    if (dayVol > maxDayVol) maxDayVol = dayVol;
  }
  return maxDayVol;
}

export function getBadgeDefinitions(
  data: LocalData,
  stats: ProfileStats,
  conquistas: ProfileConquista[],
  devMode: boolean
): BadgeDef[] {
  const maxDayVol = computeMaxDayVol(data);

  const badges: BadgeDef[] = [
    { id: 'b1', icon: '🆕', name: 'Primeiro Passo', desc: 'Concluiu o primeiro treino.', check: devMode ? true : stats.totalTreinos >= 1, naturalCheck: stats.totalTreinos >= 1 },
    { id: 'b2', icon: '🔥', name: 'Constância', desc: '7 dias de ofensiva.', check: devMode ? true : stats.streak >= 7, naturalCheck: stats.streak >= 7 },
    { id: 'b3', icon: '🏆', name: 'Veterano', desc: '30 treinos concluídos.', check: devMode ? true : stats.totalTreinos >= 30, naturalCheck: stats.totalTreinos >= 30 },
    { id: 'b4', icon: '🏋️', name: 'Força Bruta', desc: 'Volume > 5.000kg num dia.', check: devMode ? true : maxDayVol >= 5000, naturalCheck: maxDayVol >= 5000 },
    { id: 'b5', icon: '💎', name: 'Elite', desc: 'Chegou ao Nível 10.', check: devMode ? true : stats.nivel >= 10, naturalCheck: stats.nivel >= 10 },
    { id: 'b6', icon: '⚡', name: 'Relâmpago', desc: '15 treinos no mês.', check: devMode ? true : stats.totalTreinos >= 15, naturalCheck: stats.totalTreinos >= 15 },
  ];

  const specialBadges: BadgeDef[] = [];

  conquistas.forEach((c) => {
    if (typeof c === 'object' && c) {
      specialBadges.push({
        id: c.id,
        icon: c.icon || '🔱',
        name: c.titulo || c.name || c.id,
        desc: `${c.desc ?? ''} (${c.data ?? ''})`,
        check: true,
        naturalCheck: true,
        special: true,
      });
    } else if (typeof c === 'string') {
      const spec = SPECIAL_BADGES.find((s) => s.id === c);
      if (spec && !specialBadges.some((sb) => sb.id === c)) {
        specialBadges.push({ ...spec });
      }
    }
  });

  if (devMode) {
    SPECIAL_BADGES.forEach((s) => {
      if (!specialBadges.some((sb) => sb.id === s.id)) {
        specialBadges.push({ ...s, naturalCheck: false });
      }
    });
  }

  return [...badges, ...specialBadges];
}

/* ── Vitrine (SHOWCASE_STATS — secao-customizacao.js L177–232) ── */

export interface ShowcaseStat {
  key: string;
  label: string;
  unit: string;
  badge: string;
  icon: string;
  compute: (stats: ProfileStats) => number;
}

const ICON_FLASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>';
const ICON_REPS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M6 4v16M18 4v16M2 9h4M18 9h4M2 15h4M18 15h4M6 9h12M6 15h12"/></svg>';
const ICON_STAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
const ICON_MEDAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>';
const ICON_CUBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>';

export const SHOWCASE_STATS: ShowcaseStat[] = [
  { key: 'streak', label: 'Maior Sequência', unit: 'dias', badge: 'OFENSIVA', icon: ICON_FLASH, compute: (s) => s.maxStreak },
  { key: 'treinos', label: 'Total de Treinos', unit: 'sessões', badge: 'PROGRESSÃO', icon: ICON_REPS, compute: (s) => s.totalTreinos },
  { key: 'xp', label: 'Total de XP', unit: 'XP', badge: 'EXPERIÊNCIA', icon: ICON_STAR, compute: (s) => s.xp },
  { key: 'maestrias', label: 'Maestrias', unit: 'conquistas', badge: 'MAESTRIA', icon: ICON_MEDAL, compute: (s) => s.maestriasN1 },
  { key: 'ciclos', label: 'Ciclos Completos', unit: 'ciclos', badge: 'PRESTÍGIO', icon: ICON_CUBE, compute: (s) => s.ciclos },
];

/* ── Frases de assinatura preset (L235–246) ── */

export const FRASES_PRESET = [
  'O suor de hoje é a força de amanhã.',
  'Sem desculpa, sem limite.',
  'Forjado no ferro, temperado na dor.',
  'A consistência vence o talento todos os dias.',
  'Progresso diário > Perfeição eventual.',
  'Não existe elevador para o sucesso.',
  'O corpo aguenta. É a mente que fraqueja.',
  'Cada rep conta uma nova história.',
  'Seja mais forte que sua melhor desculpa.',
  'A jornada é tão importante quanto o destino.',
];

/* ── Títulos (L79–88) ── */

export const TITULOS: { id: string | null; nome: string; unlock: Unlock | null }[] = [
  { id: null, nome: 'Sem Título', unlock: null },
  { id: 'iniciante', nome: 'Iniciante', unlock: null },
  { id: 'forjado', nome: 'Forjado no Ferro', unlock: { tipo: 'treinos', val: 10 } },
  { id: 'especialista', nome: 'Especialista', unlock: { tipo: 'treinos', val: 30 } },
  { id: 'atleta-elite', nome: 'Atleta de Elite', unlock: { tipo: 'treinos', val: 50 } },
  { id: 'lendario-titulo', nome: 'O Lendário', unlock: { tipo: 'treinos', val: 100 } },
  { id: 'chama-viva', nome: 'Chama Viva', unlock: { tipo: 'streak', val: 7 } },
  { id: 'imortal', nome: 'Imortal', unlock: { tipo: 'streak', val: 30 } },
];

/* ── Emblemas de slot do cartão (EMBLEMAS — L59–77) ── */

export const EMBLEMAS: {
  id: string;
  nome: string;
  icon: string;
  unlock: Unlock | null;
  animated?: boolean;
  animationType?: string;
}[] = [
  { id: 'novato', nome: 'Novato', icon: '🥋', unlock: null },
  { id: 'dedicado', nome: 'Dedicado', icon: '💪', unlock: { tipo: 'treinos', val: 10 } },
  { id: 'veterano', nome: 'Veterano', icon: '🎖️', unlock: { tipo: 'treinos', val: 30 } },
  { id: 'lendario', nome: 'Lendário', icon: '👑', unlock: { tipo: 'treinos', val: 100 } },
  { id: 'chama7', nome: 'Chama 7', icon: '🔥', unlock: { tipo: 'streak', val: 7 } },
  { id: 'chama30', nome: 'Chama Eterna', icon: '⚡', unlock: { tipo: 'streak', val: 30 } },
  { id: 'forca', nome: 'Força', icon: '🏋️', unlock: { tipo: 'xp', val: 100 } },
  { id: 'cardio', nome: 'Cardio', icon: '🏃', unlock: { tipo: 'xp', val: 250 } },
  { id: 'bronze', nome: 'Elite Bronze', icon: '🥉', unlock: { tipo: 'maestria', val: 'bronze' } },
  { id: 'prata', nome: 'Elite Prata', icon: '🥈', unlock: { tipo: 'maestria', val: 'prata' } },
  { id: 'ouro', nome: 'Elite Ouro', icon: '🥇', unlock: { tipo: 'maestria', val: 'ouro' } },
  { id: 'academia', nome: 'Academia PRO', icon: '🏆', unlock: { tipo: 'treinos', val: 50 } },
  { id: 'chama-eterna-anim', nome: 'Chama Eterna', icon: '🔥', unlock: { tipo: 'streak', val: 30 }, animated: true, animationType: 'flicker' },
  { id: 'lendario-anim', nome: 'O Lendário', icon: '👑', unlock: { tipo: 'treinos', val: 100 }, animated: true, animationType: 'pulse-glow' },
  { id: 'elite-ouro-anim', nome: 'Maestria Máxima', icon: '🥇', unlock: { tipo: 'maestria', val: 'ouro' }, animated: true, animationType: 'spin-slow' },
  { id: 'prestige-anim', nome: 'Prestígio', icon: '⭐', unlock: { tipo: 'treinos', val: 100 }, animated: true, animationType: 'pulse-glow' },
];

/* ── Molduras de avatar (AVATAR_FRAMES — L95–101) ── */

export const AVATAR_FRAMES: {
  key: string | null;
  nome: string;
  classe: string;
  unlock: Unlock | null;
}[] = [
  { key: null, nome: 'Nenhuma', classe: 'frame-option--none', unlock: null },
  { key: 'bronze', nome: 'Bronze', classe: 'frame-option--bronze', unlock: { tipo: 'maestria', val: 'bronze' } },
  { key: 'prata', nome: 'Prata', classe: 'frame-option--prata', unlock: { tipo: 'maestria', val: 'prata' } },
  { key: 'ouro', nome: 'Ouro', classe: 'frame-option--ouro', unlock: { tipo: 'maestria', val: 'ouro' } },
  { key: 'elite', nome: 'Elite', classe: 'frame-option--elite', unlock: { tipo: 'treinos', val: 100 } },
];

/* ── Emblemas de identidade do avatar (IDENTITY_EMBLEMS — L105–120) ── */

export const SPRITESHEET_URL =
  'https://lh3.googleusercontent.com/aida/ADBb0ugGBb35O8U8cMn1B6kYQLBaKBsK4WP23L9L0J9_vFIlALkA6Sb7sYb0ntM_Y9y8EFImawkGmtFCVTlHv6ugJ57ECYBdBF59WbuW7A9TcRTXj43AbjvMerA9WxLjh0YxH2SzjWnLo4O1o-Tm6sp7ipGhutyUY9ycCkGyFXw_-FSqjjRWkJ89ecPxDqafgZWzLm1tLhEW6D8t9XX9TtBcPfMFhvK1IiKSQTWKqZ2YvaK-aSwb1Crysi5nWtk';

export interface IdentityEmblem {
  id: string;
  nome: string;
  desc: string;
  type: 'sprite' | 'image';
  x?: string;
  y?: string;
  url?: string;
  raridade: string;
  corRaridade: string;
}

export const IDENTITY_EMBLEMS: IdentityEmblem[] = [
  { id: 'estrela-alada', nome: 'Estrela Alada', desc: 'Glória celestial reservada aos comandantes aéreos.', type: 'sprite', x: '0%', y: '0%', raridade: 'Raro', corRaridade: '#60a5fa' },
  { id: 'escudo-caveira', nome: 'Escudo Caveira', desc: 'A defesa impenetrável dos imortais.', type: 'sprite', x: '-100%', y: '0%', raridade: 'Raro', corRaridade: '#60a5fa' },
  { id: 'coracao-leao', nome: 'Coração de Leão', desc: 'A bravura indomável dos reis da arena.', type: 'sprite', x: '-200%', y: '0%', raridade: 'Raro', corRaridade: '#60a5fa' },
  { id: 'aguia-dourada', nome: 'Águia Dourada', desc: 'Visão suprema e ataques precisos.', type: 'sprite', x: '0%', y: '-100%', raridade: 'Épico', corRaridade: '#c084fc' },
  { id: 'legado-alpha', nome: 'Legado Alpha', desc: 'O símbolo original dos veteranos do prestígio.', type: 'sprite', x: '-100%', y: '-100%', raridade: 'Épico', corRaridade: '#c084fc' },
  { id: 'vetor-v', nome: 'Vetor V', desc: 'Velocidade e agressividade em estado puro.', type: 'sprite', x: '-200%', y: '-100%', raridade: 'Épico', corRaridade: '#c084fc' },
  { id: 'anjo-morte', nome: 'Anjo da Morte', desc: 'O prenúncio do fim para seus oponentes.', type: 'sprite', x: '0%', y: '-200%', raridade: 'Lendário', corRaridade: '#4ae176' },
  { id: 'estrela-nova', nome: 'Estrela Nova', desc: 'A explosão de poder de um supernova.', type: 'sprite', x: '-100%', y: '-200%', raridade: 'Lendário', corRaridade: '#4ae176' },
  { id: 'lobo-prata', nome: 'Lobo de Prata', desc: 'O caçador solitário que domina a noite.', type: 'sprite', x: '-200%', y: '-200%', raridade: 'Lendário', corRaridade: '#4ae176' },
  {
    id: 'prestigio-1',
    nome: 'Prestígio 1',
    desc: 'Ícone de Prestígio do Multijogador de Legado da Temporada Alpha.',
    type: 'image',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAVjktoPOvZQLcKfppmWEIL0NdjKHru7-mrq2BO1Y86l2JxMILgtLA9c654mDhxwYINxkBvFl7xtjCrzV2sHvlvm99LJEQD6_RPIZpClicP1pp59LaHAOrD4jBNj6WNd_-SlgP0QS7qSWJHcdAuvShSUadK3RDm2QG8B3OJkKfGIZey-z2VIGF2z1_HAcCoeQODDXSoLj9T5QGvwPt0XCBVZq8-jRPMCnYfdqKFhfBJc_rvKEWRmuPaCpu1xPuoo5L7pYkSNYcqno',
    raridade: 'Lendário',
    corRaridade: '#4ae176',
  },
  {
    id: 'escudo-aguia',
    nome: 'Escudo de Águia',
    desc: 'Protetor dos céus, concedido aos melhores defensores da arena.',
    type: 'image',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtf4jTKYAGYXPJ7Z-wE30fF314-Pwbrg7gJrf18BMSaK79hGIN7Qi2J0lq0cf-nW0cSu1z8nAq7Z-e6jjThEKvL_GHHCmDTWEbEv82n7EcsdoS72gMu_lViMvG7XShJ_1Bu-ZHKf58G8cDbACWyZhYwVdogGFbl7DCD750toV_NO-of2GB94cXxp_8XBk9Fwp6DicKM_tu2TUCV0sd8doEaRDpY6gs21eZbnT0nemZFIlFugTdAocFWJtoj0k57ppaECNRX4r65gk',
    raridade: 'Lendário',
    corRaridade: '#4ae176',
  },
  {
    id: 'estrela-honra',
    nome: 'Estrela de Honra',
    desc: 'Concedido aos veteranos das primeiras batalhas simuladas.',
    type: 'image',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHEAJfpIZWgH1umKlvbg59Pp41BdGLOOe8lhKRNj-nnsD5DkIIy30D-nA5-Re98xlGobzOdLU2PGI22xdmLpofZp3teQL8o3CI4-VQs9wI334uxnX1huYBwUjTZerVJMzq43mEbyoBw9iM74jIojuIanroPUzwIQ5o1a-GrUP1aCMQXlhDHNUjawn0lp-fMJfknNsy709tjjqt0amLPIQmYozpE3F_Hja775x3Bf5MuXNhWI_ch75gobs38rKjtdwqRCov1Uxk7ko',
    raridade: 'Lendário',
    corRaridade: '#4ae176',
  },
  {
    id: 'caveira-alada',
    nome: 'Caveira Alada',
    desc: 'Ceifador aéreo, terror dos oponentes na arena.',
    type: 'image',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSDob9FO6LAhjuTYsBXjQp_NNC5RRdCYF5osBDe6eTVdRVXglK8ZCa84lQuXK_xmU_6-oMymbv-TGIB4GVgKnf86Dyd9rsszFo3dKKnmp4Q_VKxBtlfJgmskM92m-V_nSPycm0LR_N294VjBhRhbBiYmr5zVFd6-waOW1R_qpUwWLA9upBq1aUg3e_Cl7goSdAzQq59zzaYltXvjRAQv5u3b6TXtDKrl4U1R5_5BDx-ubUcd59WEwtoDB89Sn8SZge5uhE_ttHkA',
    raridade: 'Lendário',
    corRaridade: '#4ae176',
  },
  {
    id: 'lobo-alfa',
    nome: 'Lobo Alfa',
    desc: 'Marca daqueles que lideram o bando na Arena.',
    type: 'image',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpQe6fST2xan76hsAPfRQ71DBmXwqoiKRsK57U4O77vji8ec6HJgpoIyqat85I-It_9xysZ-iBwhTNYR3gpVoRQPvsIrKccGgw21m_SaMZc-jxBLtksqbM2HfHeK9RzsF4cj2bCrkNZ01rASFJwJdnOPGYWLhwFLCNU0akcyhkXAAOQY8xvtIHDZ5wB3dIAYfDM-GSJV8Lnt1Df4M4Qb-SjVUajRBCiVmGv-tFVMIuREVoI1uAMzJEWn5yhaXIth-dvcWmSub5_Cc',
    raridade: 'Lendário',
    corRaridade: '#4ae176',
  },
];

/* ── Banners (BANNERS — L8–56) ── */

export const BANNERS: {
  key: string;
  nome: string;
  unlock: Unlock | null;
  hint: string;
  animated?: boolean;
  master?: boolean;
}[] = [
  { key: 'roxo-neon', nome: 'Roxo Neon', unlock: null, hint: 'Padrão' },
  { key: 'aurora', nome: 'Aurora', unlock: null, hint: 'Padrão' },
  { key: 'fogo-eterno', nome: 'Fogo Eterno', unlock: { tipo: 'streak', val: 7 }, hint: '7 dias seguidos' },
  { key: 'ouro-elite', nome: 'Ouro Elite', unlock: { tipo: 'treinos', val: 30 }, hint: '30 treinos' },
  { key: 'ciberespaco', nome: 'Ciberespaço', unlock: { tipo: 'treinos', val: 50 }, hint: '50 treinos' },
  { key: 'shadow-ops', nome: 'Shadow Ops', unlock: { tipo: 'treinos', val: 100 }, hint: '100 treinos' },
  { key: 'aco-frio', nome: 'Aço Frio', unlock: { tipo: 'maestria', val: 'prata' }, hint: 'Maestria Prata' },
  { key: 'dragao-ouro', nome: 'Dragão de Ouro', unlock: { tipo: 'maestria', val: 'ouro' }, hint: 'Maestria Ouro' },
  { key: 'plasma', nome: 'Plasma Elétrico', unlock: { tipo: 'treinos', val: 50 }, hint: '50 treinos', animated: true },
  { key: 'aurora-viva', nome: 'Aurora Viva', unlock: { tipo: 'streak', val: 7 }, hint: '7 dias seguidos', animated: true },
  { key: 'vulcao', nome: 'Vulcão', unlock: { tipo: 'streak', val: 30 }, hint: '30 dias', animated: true },
  { key: 'matrix', nome: 'Matrix', unlock: { tipo: 'treinos', val: 100 }, hint: '100 treinos', animated: true },
  { key: 'nebulosa', nome: 'Nebulosa', unlock: { tipo: 'treinos', val: 100 }, hint: '100 treinos', animated: true },
  { key: 'lava-vulcao', nome: 'Lava Vulcão', unlock: { tipo: 'streak', val: 5 }, hint: '5 dias seguidos', animated: true },
  { key: 'matrix-grid', nome: 'Matrix Grid', unlock: { tipo: 'treinos', val: 20 }, hint: '20 treinos', animated: true },
  { key: 'glacial', nome: 'Glacial', unlock: { tipo: 'treinos', val: 15 }, hint: '15 treinos' },
  { key: 'gold-rush', nome: 'Gold Rush', unlock: { tipo: 'treinos', val: 30 }, hint: '30 treinos', animated: true },
  { key: 'titan-core', nome: 'Titan Core', unlock: { tipo: 'treinos', val: 10 }, hint: '10 treinos' },
  { key: 'nebulosa-galatica', nome: 'Nebulosa Galáctica', unlock: { tipo: 'treinos', val: 40 }, hint: '40 treinos', animated: true },
  { key: 'stealth-ops-v2', nome: 'Stealth Ops II', unlock: { tipo: 'treinos', val: 25 }, hint: '25 treinos', animated: true },
  { key: 'cyber-pulse-v2', nome: 'Cyber Pulse', unlock: { tipo: 'treinos', val: 45 }, hint: '45 treinos', animated: true },
  { key: 'solar-flare', nome: 'Solar Flare', unlock: { tipo: 'streak', val: 14 }, hint: '14 dias seguidos', animated: true },
  { key: 'deep-void', nome: 'Deep Void', unlock: { tipo: 'treinos', val: 60 }, hint: '60 treinos', animated: true },
  { key: 'biohazard', nome: 'Biohazard', unlock: { tipo: 'treinos', val: 55 }, hint: '55 treinos', animated: true },
  { key: 'bloodline-v2', nome: 'Bloodline', unlock: { tipo: 'streak', val: 21 }, hint: '21 dias seguidos', animated: true },
  { key: 'starlight', nome: 'Starlight', unlock: { tipo: 'treinos', val: 70 }, hint: '70 treinos', animated: true },
  { key: 'inferno-engine', nome: 'Inferno Engine', unlock: { tipo: 'streak', val: 30 }, hint: '30 dias seguidos', animated: true },
  { key: 'quantum-weaver', nome: 'Quantum Weaver', unlock: { tipo: 'treinos', val: 80 }, hint: '80 treinos', animated: true },
  { key: 'stormbringer', nome: 'Stormbringer', unlock: { tipo: 'treinos', val: 75 }, hint: '75 treinos', animated: true },
  { key: 'void-reaver', nome: 'Void Reaver', unlock: { tipo: 'maestria', val: 'prata' }, hint: 'Maestria Prata', animated: true },
  { key: 'emerald-dragon', nome: 'Emerald Dragon', unlock: { tipo: 'treinos', val: 90 }, hint: '90 treinos', animated: true },
  { key: 'dragon-breath', nome: 'Dragon Breath', unlock: { tipo: 'treinos', val: 150 }, hint: '150 treinos', animated: true, master: true },
  { key: 'neon-samurai', nome: 'Neon Samurai', unlock: { tipo: 'streak', val: 60 }, hint: '60 dias seguidos', animated: true, master: true },
  { key: 'ghost-protocol', nome: 'Ghost Protocol', unlock: { tipo: 'treinos', val: 200 }, hint: '200 treinos', animated: true, master: true },
  { key: 'bloodline-pulse', nome: 'Bloodline Pulse', unlock: { tipo: 'streak', val: 90 }, hint: '90 dias seguidos', animated: true, master: true },
  { key: 'solar-eclipse', nome: 'Solar Eclipse', unlock: { tipo: 'maestria', val: 'ouro' }, hint: 'Maestria Ouro', animated: true, master: true },
  { key: 'cyber-iris', nome: 'Cyber Iris', unlock: { tipo: 'treinos', val: 250 }, hint: '250 treinos', animated: true, master: true },
  { key: 'frozen-throne', nome: 'Frozen Throne', unlock: { tipo: 'treinos', val: 175 }, hint: '175 treinos', animated: true, master: true },
  { key: 'nuclear-winter', nome: 'Nuclear Winter', unlock: { tipo: 'streak', val: 45 }, hint: '45 dias seguidos', animated: true, master: true },
  { key: 'dimension-warp', nome: 'Dimension Warp', unlock: { tipo: 'treinos', val: 300 }, hint: '300 treinos', animated: true, master: true },
  { key: 'ancient-rune', nome: 'Ancient Rune', unlock: { tipo: 'maestria', val: 'ouro' }, hint: 'Maestria Ouro', animated: true, master: true },
  { key: 'plasma-conico', nome: 'Plasma Cônico', unlock: { tipo: 'treinos', val: 120 }, hint: '120 treinos', animated: true, master: true },
];

/* ── Skins de barra (BAR_SKINS — L123–156) ── */

export const BAR_SKINS: { key: string; nome: string; unlock: Unlock | null; hint: string }[] = [
  { key: 'default', nome: 'Padrão', unlock: null, hint: 'Padrão' },
  { key: 'fire', nome: 'Chama', unlock: { tipo: 'streak', val: 7 }, hint: '7 dias seguidos' },
  { key: 'ice', nome: 'Gelo', unlock: { tipo: 'treinos', val: 20 }, hint: '20 treinos' },
  { key: 'gold', nome: 'Ouro Elite', unlock: { tipo: 'treinos', val: 30 }, hint: '30 treinos' },
  { key: 'military', nome: 'Segmentado', unlock: { tipo: 'treinos', val: 40 }, hint: '40 treinos' },
  { key: 'neon', nome: 'Neon Cyber', unlock: { tipo: 'treinos', val: 35 }, hint: '35 treinos' },
  { key: 'plasma', nome: 'Plasma', unlock: { tipo: 'treinos', val: 50 }, hint: '50 treinos' },
  { key: 'biohazard', nome: 'Biohazard', unlock: { tipo: 'treinos', val: 60 }, hint: '60 treinos' },
  { key: 'solar', nome: 'Solar', unlock: { tipo: 'treinos', val: 70 }, hint: '70 treinos' },
  { key: 'carbono', nome: 'Carbono', unlock: { tipo: 'treinos', val: 80 }, hint: '80 treinos' },
  { key: 'galaxia', nome: 'Galáxia', unlock: { tipo: 'treinos', val: 90 }, hint: '90 treinos' },
  { key: 'elixir', nome: 'Elixir', unlock: { tipo: 'treinos', val: 25 }, hint: '25 treinos' },
  { key: 'mercurio', nome: 'Mercúrio', unlock: { tipo: 'treinos', val: 45 }, hint: '45 treinos' },
  { key: 'radar', nome: 'Radar', unlock: { tipo: 'treinos', val: 15 }, hint: '15 treinos' },
  { key: 'matrix', nome: 'Matrix', unlock: { tipo: 'treinos', val: 100 }, hint: '100 treinos' },
  { key: 'sobrecarga', nome: 'Sobrecarga', unlock: { tipo: 'streak', val: 15 }, hint: '15 dias seguidos' },
  { key: 'supernova', nome: 'Supernova', unlock: { tipo: 'streak', val: 30 }, hint: '30 dias seguidos' },
  { key: 'deepvoid', nome: 'Deep Void', unlock: { tipo: 'maestria', val: 'ouro' }, hint: 'Maestria Ouro' },
  { key: 'cyberhunter', nome: 'Cyber Hunter', unlock: { tipo: 'treinos', val: 55 }, hint: '55 treinos' },
  { key: 'bloodline', nome: 'Bloodline', unlock: { tipo: 'streak', val: 20 }, hint: '20 dias seguidos' },
  { key: 'bananil', nome: 'Bananil', unlock: { tipo: 'treinos', val: 12 }, hint: '12 treinos' },
  { key: 'glacialpeak', nome: 'Glacial Peak', unlock: { tipo: 'treinos', val: 22 }, hint: '22 treinos' },
  { key: 'acidflow', nome: 'Acid Flow', unlock: { tipo: 'treinos', val: 32 }, hint: '32 treinos' },
  { key: 'starlight', nome: 'Starlight', unlock: { tipo: 'treinos', val: 42 }, hint: '42 treinos' },
  { key: 'magma', nome: 'Magma', unlock: { tipo: 'treinos', val: 65 }, hint: '65 treinos' },
  { key: 'onyxshield', nome: 'Onyx Shield', unlock: { tipo: 'treinos', val: 75 }, hint: '75 treinos' },
  { key: 'mercurioliquido', nome: 'Mercúrio Líquido', unlock: { tipo: 'treinos', val: 85 }, hint: '85 treinos' },
  { key: 'neutronpulse', nome: 'Nêutron Pulse', unlock: { tipo: 'treinos', val: 95 }, hint: '95 treinos' },
  { key: 'prismacristalino', nome: 'Prisma Cristalino', unlock: { tipo: 'treinos', val: 105 }, hint: '105 treinos' },
  { key: 'vorticedovazio', nome: 'Vórtice do Vazio', unlock: { tipo: 'maestria', val: 'prata' }, hint: 'Maestria Prata' },
  { key: 'dourado-elite', nome: 'Dourado Elite', unlock: { tipo: 'treinos', val: 110 }, hint: '110 treinos' },
  { key: 'roxo-elite', nome: 'Roxo Elite', unlock: { tipo: 'streak', val: 45 }, hint: '45 dias seguidos' },
  { key: 'diamante-elite', nome: 'Diamante Elite', unlock: { tipo: 'treinos', val: 120 }, hint: '120 treinos' },
];

/* ── Skins de card (CARD_SKINS — L160–167) ── */

export const CARD_SKINS: { key: string; nome: string; unlock: Unlock | null; hint: string }[] = [
  { key: 'default', nome: 'Padrão', unlock: null, hint: 'Padrão' },
  { key: 'neon', nome: 'Neon Cyber', unlock: { tipo: 'treinos', val: 20 }, hint: '20 treinos' },
  { key: 'militar', nome: 'Militar', unlock: { tipo: 'treinos', val: 40 }, hint: '40 treinos' },
  { key: 'ouro', nome: 'Ouro Elite', unlock: { tipo: 'maestria', val: 'ouro' }, hint: 'Maestria Ouro' },
  { key: 'gelo', nome: 'Aço Glacial', unlock: { tipo: 'treinos', val: 30 }, hint: '30 treinos' },
  { key: 'sombra', nome: 'Shadow', unlock: { tipo: 'treinos', val: 50 }, hint: '50 treinos' },
];

/* ── Skins de timer (TIMER_SKINS — L169–174) ── */

export const TIMER_SKINS: { key: string; nome: string; unlock: Unlock | null; hint: string }[] = [
  { key: 'radar', nome: 'Radar Tático', unlock: null, hint: 'Padrão' },
  { key: 'hourglass', nome: 'Ampulheta', unlock: { tipo: 'treinos', val: 10 }, hint: '10 treinos' },
  { key: 'cyber', nome: 'Cyber Relógio', unlock: { tipo: 'treinos', val: 20 }, hint: '20 treinos' },
  { key: 'arcade', nome: 'Arcade Bit', unlock: { tipo: 'treinos', val: 30 }, hint: '30 treinos' },
];

/* ── Aplicação imperativa (paridade com applyProfileCustomization) ── */

/** BAR_SKIN_STYLES (secao-customizacao.js L287–321) — override inline das barras. */
const BAR_SKIN_STYLES: Record<string, { background: string; boxShadow: string }> = {
  'default': { background: 'linear-gradient(90deg, #dbfcff, #00dbe9)', boxShadow: '0 0 10px rgba(0,219,233,0.3)' },
  'fire': { background: 'linear-gradient(90deg, #FF4D00, #FFD000)', boxShadow: '0 0 15px #FF4D00' },
  'ice': { background: 'rgba(0, 240, 255, 0.8)', boxShadow: 'inset 0 0 10px rgba(255,255,255,0.5)' },
  'gold': { background: 'linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)', boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)' },
  'military': { background: 'repeating-linear-gradient(90deg, #5b8c5a 0px, #5b8c5a 8px, transparent 8px, transparent 10px)', boxShadow: '' },
  'neon': { background: 'linear-gradient(90deg, #00f0ff, #a855f7)', boxShadow: '0 0 15px #00f0ff' },
  'plasma': { background: 'linear-gradient(270deg, #ff506e, #a855f7, #00dbe9)', boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)' },
  'biohazard': { background: '#39FF14', boxShadow: '0 0 12px #39FF14' },
  'solar': { background: 'radial-gradient(circle, #FFF 0%, #FF8C00 60%)', boxShadow: '0 0 20px #FF8C00' },
  'carbono': { background: 'linear-gradient(90deg, #1b1b1b, #1b1b1b)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)' },
  'galaxia': { background: 'linear-gradient(90deg, #050014, #1a0b2e, #0f0026)', boxShadow: '0 0 15px rgba(75, 0, 130, 0.6)' },
  'elixir': { background: '#FF00E5', boxShadow: '0 0 15px #FF00E5' },
  'mercurio': { background: 'linear-gradient(180deg, #E0E0E0 0%, #9E9E9E 40%, #424242 50%, #9E9E9E 60%, #F5F5F5 100%)', boxShadow: '0 2px 5px rgba(0,0,0,0.5)' },
  'radar': { background: 'rgba(0, 255, 0, 0.3)', boxShadow: '0 0 10px rgba(0,255,0,0.5)' },
  'matrix': { background: '#000', boxShadow: '0 0 15px rgba(0,255,65,0.8), inset 0 0 10px rgba(0,255,65,0.5)' },
  'sobrecarga': { background: '#E0FFFF', boxShadow: '0 0 20px #E0FFFF' },
  'supernova': { background: 'linear-gradient(90deg, #ff8c00, #ffffff, #ff8c00)', boxShadow: '0 0 20px #ff8c00' },
  'deepvoid': { background: 'linear-gradient(90deg, #020014, #0a0f30)', boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)' },
  'cyberhunter': { background: '#00ff7f', boxShadow: '0 0 10px #00ff7f' },
  'bloodline': { background: 'linear-gradient(180deg, #4a0000 0%, #8b0000 50%, #3a0000 100%)', boxShadow: 'inset 0 0 15px #2a0000, 0 0 20px rgba(139, 0, 0, 0.6)' },
  'bananil': { background: 'linear-gradient(90deg, #009739, #FEDD00, #009739)', boxShadow: '0 0 15px rgba(0, 151, 57, 0.6)' },
  'glacialpeak': { background: 'linear-gradient(90deg, #add8e6, #e0ffff, #add8e6)', boxShadow: '0 0 10px #add8e6' },
  'acidflow': { background: 'linear-gradient(90deg, #adff2f, #7fff00)', boxShadow: '0 0 10px #adff2f' },
  'starlight': { background: 'linear-gradient(90deg, #e6e6fa, #ffffff, #e6e6fa)', boxShadow: '0 0 12px #fff' },
  'magma': { background: 'linear-gradient(90deg, #8b0000, #ff4500, #8b0000)', boxShadow: '0 0 15px #ff4500' },
  'onyxshield': { background: 'linear-gradient(135deg, #2a2a2a 0%, #050505 40%, #111 60%, #000 100%)', boxShadow: '0 0 10px rgba(0,0,0,0.8)' },
  'mercurioliquido': { background: 'linear-gradient(90deg, #d3d7cf, #eeeeec, #babdb6, #eeeeec, #d3d7cf)', boxShadow: '0 0 10px rgba(200,200,200,0.5)' },
  'neutronpulse': { background: '#4b0082', boxShadow: '0 0 15px #4b0082' },
  'prismacristalino': { background: 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)', boxShadow: '0 0 15px rgba(255,255,255,0.3)' },
  'vorticedovazio': { background: '#000', boxShadow: '0 0 20px #8a2be2, inset 0 0 15px #8a2be2' },
  'dourado-elite': { background: 'linear-gradient(135deg, #e6c27a 0%, #ffd700 25%, #b8860b 50%, #ffd700 75%, #e6c27a 100%)', boxShadow: '0 0 12px rgba(255, 215, 0, 0.5)' },
  'roxo-elite': { background: '#4b0082', boxShadow: '0 0 20px #8a2be2' },
  'diamante-elite': { background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(220,240,255,0.8) 25%, rgba(255,255,255,1) 50%, rgba(200,230,255,0.9) 75%, rgba(255,255,255,0.9) 100%)', boxShadow: '0 0 15px rgba(255, 255, 255, 0.8)' },
};

/** Espelha `_applyBarSkinToDOM` (L323–335): override inline nas barras de XP. */
export function applyBarSkinToDOM(skinKey: string): void {
  const style = BAR_SKIN_STYLES[skinKey] || BAR_SKIN_STYLES['default'];
  document
    .querySelectorAll<HTMLElement>('.progress-fill, .xp-bar-fill, .cycle-xp-fill')
    .forEach((el) => {
      el.style.setProperty('background', style.background, 'important');
      el.style.setProperty('box-shadow', style.boxShadow || 'none', 'important');
    });
}

/** Espelha `_getPreviewStyle` (secao-customizacao.js L810–817) — preview inline das barras. */
export function barSkinPreviewStyle(skinKey: string): { background?: string; boxShadow?: string } {
  const style = BAR_SKIN_STYLES[skinKey];
  if (!style || !style.background) return {};
  const out: { background?: string; boxShadow?: string } = { background: style.background };
  if (style.boxShadow) out.boxShadow = style.boxShadow;
  return out;
}

/** Aplica atributos globais da customização (body + banners) — idem L341–411. */
export function applyCustomizationGlobals(pc: ProfileCustomization): void {
  document.body.setAttribute('data-bar-skin', pc.barSkin || 'default');
  document.body.setAttribute('data-card-skin', pc.cardSkin || 'default');
  document.querySelectorAll<HTMLElement>('.dash-profile-banner-card').forEach((b) => {
    b.setAttribute('data-banner', pc.banner || 'roxo-neon');
  });
  applyBarSkinToDOM(pc.barSkin || 'default');
}

/** Reverte customizações não desbloqueadas (checkAndRevert — L1175–1243).
 *  Chamado ao desativar o Modo Desenvolvedor, com devMode=false. */
export function revertLockedCustomizations(
  pcIn: ProfileCustomization,
  selectedIn: string[],
  stats: ProfileStats,
  maestrias: Record<string, { nivel?: number }>
): { customization: ProfileCustomization; selectedEmblems: string[] } {
  const pc = { ...pcIn };
  let selectedEmblems = [...selectedIn];
  const locked = (u: Unlock | null) => !isUnlocked(u, stats, false, maestrias);

  const banner = BANNERS.find((x) => x.key === pc.banner);
  if (banner && locked(banner.unlock)) pc.banner = 'roxo-neon';

  const titulo = TITULOS.find((x) => x.id === pc.titulo);
  if (titulo && locked(titulo.unlock)) pc.titulo = null;

  const frame = AVATAR_FRAMES.find((x) => x.key === pc.avatarFrame);
  if (frame && locked(frame.unlock)) pc.avatarFrame = null;

  const bar = BAR_SKINS.find((x) => x.key === pc.barSkin);
  if (bar && locked(bar.unlock)) pc.barSkin = 'default';

  const card = CARD_SKINS.find((x) => x.key === pc.cardSkin);
  if (card && locked(card.unlock)) pc.cardSkin = 'default';

  const timer = TIMER_SKINS.find((x) => x.key === pc.timerSkin);
  if (timer && locked(timer.unlock)) {
    pc.timerSkin = 'radar';
    writeLS('timerStyle', 'radar');
  }

  selectedEmblems = selectedEmblems.filter((embId) => {
    const e = EMBLEMAS.find((x) => x.id === embId);
    return !e || isUnlocked(e.unlock, stats, false, maestrias);
  });

  return { customization: pc, selectedEmblems };
}

/* ── Perfil: derivados do cabeçalho ── */

/** Texto do handle (`@x • AQUI DESDE yyyy`) — idem L357–361. */
export function handleText(pc: ProfileCustomization): string {
  const sinceYear = pc.since || '2024';
  return `${pc.handle || '@deceptivon'} \u2022 AQUI DESDE ${sinceYear}`;
}

/** Nome do título ativo (ou null) — idem L364–368. */
export function tituloNome(tituloId: string | null | undefined): string | null {
  const t = TITULOS.find((x) => x.id === tituloId);
  return t && t.id ? t.nome.toUpperCase() : null;
}

/** Fragmento de conquistas para o slot de emblemas (`_renderProfileEmblems` L1127). */
export function emblemForSlot(
  selected: string[],
  index: number
): { icon: string; nome: string; animated?: boolean; animationType?: string } | null {
  const embId = selected[index];
  if (!embId) return null;
  const emb = EMBLEMAS.find((e) => e.id === embId);
  return emb ?? null;
}
