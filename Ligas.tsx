import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  MessageSquare,
  Shield,
  Trophy,
  Plus,
  Smile,
  ArrowUpDown,
  SlidersHorizontal,
  Camera,
  UserPlus,
  X,
  Swords,
  Calendar,
  ArrowUp,
  ArrowDown,
  Lock,
  Share2,
} from 'lucide-react';

// ============================================================================
// 1. TIPOS & INTERFACES (Standalone)
// ============================================================================

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L' | 'X';

export interface PlayerProfile {
  username: string;
  clanName: string;
  trophies: number;
  gold: number;
  gems: number;
  xp: number;
  level: number;
  cardLevels?: Record<TetrominoType, number>;
  selectedSkin?: string;
  unlockedSkins?: string[];
  selectedBoardStyle?: string;
  selectedCallingCard?: string;
  unlockedCallingCards?: string[];
  selectedEmblem?: string;
  unlockedEmblems?: string[];
}

export interface ClanMessage {
  id: string;
  sender: string;
  role: 'Líder' | 'Co-líder' | 'Ancião' | 'Membro';
  trophies: number;
  text: string;
  time: string;
  isSelf?: boolean;
}

export type LeagueDivision = 'Bronze' | 'Prata' | 'Ouro' | 'Safira' | 'Rubi';

export interface LeagueParticipant {
  id: string;
  name: string;
  xp: number;
  flag: string;
  avatarColor: string;
  avatarEmoji: string;
  isPlayer: boolean;
  level: number;
}

export interface LeagueState {
  division: LeagueDivision;
  joined: boolean;
  playerXp: number;
  daysRemaining: number;
  opponents: LeagueParticipant[];
  lastResult?: {
    type: 'promotion' | 'demotion' | 'stay';
    oldDivision: LeagueDivision;
    newDivision: LeagueDivision;
    rank: number;
    participants?: LeagueParticipant[];
  } | null;
}

export interface FriendItem {
  id: string;
  name: string;
  trophies: number;
  clan: string | null;
  online: boolean;
  avatarColor: string;
  avatarInitial: string;
  rank: number;
  avatarEmoji?: string;
  flag?: string;
  level?: number;
}

export interface LigasStandaloneProps {
  profile?: PlayerProfile;
  messages?: ClanMessage[];
  onSendMessage?: (text: string) => void;
  activeSubTabProp?: 'amigos' | 'bate-papo' | 'guerra-de-clas';
  onChangeSubTab?: (tab: 'amigos' | 'bate-papo' | 'guerra-de-clas') => void;
  soundEnabled?: boolean;
}

// ============================================================================
// 2. SISTEMA DE ÁUDIO SINTETIZADO EMBUTIDO (Zero dependências externas)
// ============================================================================

class StandaloneSoundEffects {
  private audioCtx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => { });
    }
    return this.audioCtx;
  }

  public playMove() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignora caso o navegador bloqueie áudio sem interação prévia
    }
  }

  public playHold() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Ignora
    }
  }

  public playLevelUp() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const baseTime = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, baseTime + idx * 0.08);

        gain.gain.setValueAtTime(0.12, baseTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, baseTime + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(baseTime + idx * 0.08);
        osc.stop(baseTime + idx * 0.08 + 0.35);
      });
    } catch {
      // Ignora
    }
  }
}

const standaloneSound = new StandaloneSoundEffects();

// ============================================================================
// 3. LÓGICA E PERSISTÊNCIA DAS LIGAS (Semanal & Mensal)
// ============================================================================

export const LEAGUE_DIVISIONS: LeagueDivision[] = ['Bronze', 'Prata', 'Ouro', 'Safira', 'Rubi'];

export const DIVISION_COLORS: Record<
  LeagueDivision,
  { bg: string; text: string; border: string; trophy: string }
> = {
  Bronze: { bg: 'bg-amber-850', text: 'text-amber-400', border: 'border-amber-800', trophy: '🏆' },
  Prata: { bg: 'bg-slate-400/20', text: 'text-slate-300', border: 'border-slate-400/30', trophy: '🥈' },
  Ouro: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', trophy: '🥇' },
  Safira: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', trophy: '💎' },
  Rubi: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30', trophy: '❤️' },
};

const NPC_NAMES = [
  'Lionel Pinto Flores',
  'Erick Hernández',
  'Agustina Lopez',
  'Geovana Poças',
  'Japonês Heitor',
  'elRanch TM',
  'lacucaracha4444',
  'andre vinicius',
  'Jacquelin Perez',
  'Julizbeth',
  "Cunégonde D'Aramitz",
  'wendy Arce',
  'Margelis Bastos',
  'Alana Soares',
  'João Augusto',
  'Pedro Henrique',
  'Gabriel Barbos',
  'Mariana Alv',
  'Clara Souz',
  'Guilherme Silva',
  'Renata Vascon',
  'Bruno Olive',
  'Vitor Gome',
  'Camila Cost',
  'Letícia Carv',
];

const COUNTRY_FLAGS = ['🇧🇷', '🇺🇸', '🇲🇽', '🇫🇷', '🇯🇵', '🇦🇷', '🇪🇸', '🇮🇹', '🇨🇦', '🇩🇪', '🇬🇧', '🇨🇱'];

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-teal-600',
  'bg-cyan-600',
  'bg-indigo-600',
  'bg-pink-600',
  'bg-yellow-600',
];

const AVATAR_EMOJIS = ['🐱', '🐶', '🦊', '🐨', '🦁', '🐸', '🐼', '🐯', '🐒', '🦉', '🦖', '🦄', '🐝', '👾', '🚀'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateOpponents(division: LeagueDivision): LeagueParticipant[] {
  const opponents: LeagueParticipant[] = [];
  const usedNames = new Set<string>();

  let minXp = 10;
  let maxXp = 80;

  if (division === 'Prata') {
    minXp = 30;
    maxXp = 150;
  } else if (division === 'Ouro') {
    minXp = 60;
    maxXp = 300;
  } else if (division === 'Safira') {
    minXp = 120;
    maxXp = 500;
  } else if (division === 'Rubi') {
    minXp = 200;
    maxXp = 800;
  }

  for (let i = 0; i < 9; i++) {
    let name = getRandomItem(NPC_NAMES);
    while (usedNames.has(name)) {
      name = getRandomItem(NPC_NAMES);
    }
    usedNames.add(name);

    opponents.push({
      id: `npc-${i}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      xp: Math.floor(Math.random() * (maxXp - minXp) + minXp),
      flag: getRandomItem(COUNTRY_FLAGS),
      avatarColor: getRandomItem(AVATAR_COLORS),
      avatarEmoji: getRandomItem(AVATAR_EMOJIS),
      isPlayer: false,
      level: Math.floor(Math.random() * 20) + 1,
    });
  }

  return opponents;
}

export function simulateOpponentActivity(
  opponents: LeagueParticipant[],
  division: LeagueDivision
): LeagueParticipant[] {
  const numPlaying = Math.floor(Math.random() * 3) + 2; // 2 a 4 oponentes
  const nextOpponents = [...opponents];

  let maxGain = 30;
  if (division === 'Prata') maxGain = 50;
  else if (division === 'Ouro') maxGain = 80;
  else if (division === 'Safira') maxGain = 120;
  else if (division === 'Rubi') maxGain = 180;

  for (let k = 0; k < numPlaying; k++) {
    const idx = Math.floor(Math.random() * nextOpponents.length);
    const gain = Math.floor(Math.random() * (maxGain - 10) + 10);
    nextOpponents[idx] = {
      ...nextOpponents[idx],
      xp: nextOpponents[idx].xp + gain,
    };
  }

  return nextOpponents;
}

const LOCAL_STORAGE_KEY_WEEKLY = 'tetris_clash_leagues';
const LOCAL_STORAGE_KEY_MONTHLY = 'tetris_clash_leagues_monthly';

export const DEFAULT_LEAGUE_STATE: LeagueState = {
  division: 'Bronze',
  joined: false,
  playerXp: 0,
  daysRemaining: 6,
  opponents: [],
  lastResult: null,
};

export const DEFAULT_MONTHLY_LEAGUE_STATE: LeagueState = {
  division: 'Bronze',
  joined: false,
  playerXp: 0,
  daysRemaining: 27,
  opponents: [],
  lastResult: null,
};

export function getLeagueState(): LeagueState {
  if (typeof window === 'undefined') return DEFAULT_LEAGUE_STATE;
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_WEEKLY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Erro ao carregar estado da liga semanal:', e);
  }
  return DEFAULT_LEAGUE_STATE;
}

export function saveLeagueState(state: LeagueState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_WEEKLY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('tetris-clash-league-update', { detail: state }));
  } catch (e) {
    console.error('Erro ao salvar estado da liga semanal:', e);
  }
}

export function getMonthlyLeagueState(): LeagueState {
  if (typeof window === 'undefined') return DEFAULT_MONTHLY_LEAGUE_STATE;
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_MONTHLY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Erro ao carregar estado da liga mensal:', e);
  }
  return DEFAULT_MONTHLY_LEAGUE_STATE;
}

export function saveMonthlyLeagueState(state: LeagueState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_MONTHLY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('tetris-clash-monthly-league-update', { detail: state }));
  } catch (e) {
    console.error('Erro ao salvar estado da liga mensal:', e);
  }
}

export function addPlayerMonthlyLeagueXp(amount: number): LeagueState {
  const state = getMonthlyLeagueState();
  let updatedState: LeagueState;

  if (!state.joined) {
    const opponents = generateOpponents(state.division);
    updatedState = {
      ...state,
      joined: true,
      playerXp: amount,
      opponents,
      daysRemaining: 27,
    };
  } else {
    const newOpponents = simulateOpponentActivity(state.opponents, state.division);
    updatedState = {
      ...state,
      playerXp: state.playerXp + amount,
      opponents: newOpponents,
    };
  }

  saveMonthlyLeagueState(updatedState);
  return updatedState;
}

export function addPlayerLeagueXp(amount: number): LeagueState {
  const state = getLeagueState();
  let updatedState: LeagueState;

  if (!state.joined) {
    const opponents = generateOpponents(state.division);
    updatedState = {
      ...state,
      joined: true,
      playerXp: amount,
      opponents,
      daysRemaining: Math.random() > 0.5 ? 6 : 5,
    };
  } else {
    const newOpponents = simulateOpponentActivity(state.opponents, state.division);
    updatedState = {
      ...state,
      playerXp: state.playerXp + amount,
      opponents: newOpponents,
    };
  }

  saveLeagueState(updatedState);
  addPlayerMonthlyLeagueXp(amount);
  return updatedState;
}

// ============================================================================
// 4. DADOS INICIAIS DE DEMONSTRAÇÃO (Amigos, Membros da Guilda, Chat, Perfil)
// ============================================================================

const DEFAULT_PROFILE: PlayerProfile = {
  username: 'GABRIEL GS',
  clanName: 'Great Warriors',
  trophies: 12710,
  gold: 5800,
  gems: 150,
  xp: 350,
  level: 15,
};

const INITIAL_FRIENDS: FriendItem[] = [
  { id: '1', name: 'GABRIEL GS', trophies: 12710, clan: null, online: true, avatarColor: 'from-emerald-500 to-teal-700', avatarInitial: 'G', rank: 1, avatarEmoji: '👑', flag: '🇧🇷', level: 15 },
  { id: '2', name: 'Basti', trophies: 10851, clan: null, online: false, avatarColor: 'from-blue-500 to-indigo-700', avatarInitial: 'B', rank: 2, avatarEmoji: '🐺', flag: '🇩🇪', level: 12 },
  { id: '3', name: 'leventopsalis', trophies: 9185, clan: null, online: true, avatarColor: 'from-amber-500 to-orange-700', avatarInitial: 'L', rank: 3, avatarEmoji: '🐸', flag: '🇬🇷', level: 10 },
  { id: '4', name: 'jooo_vitalc', trophies: 9177, clan: 'milicas', online: false, avatarColor: 'from-rose-500 to-pink-700', avatarInitial: 'J', rank: 4, avatarEmoji: '👾', flag: '🇧🇷', level: 9 },
  { id: '5', name: 'Douvis', trophies: 8601, clan: 'milicas', online: true, avatarColor: 'from-violet-500 to-fuchsia-700', avatarInitial: 'D', rank: 5, avatarEmoji: '🐼', flag: '🇨🇱', level: 8 },
];

const INITIAL_MEMBERS: FriendItem[] = [
  { id: 'm1', name: 'zTetrisGod', trophies: 13400, clan: 'Great Warriors', online: true, avatarColor: 'from-purple-500 to-indigo-700', avatarInitial: 'Z', rank: 1, avatarEmoji: '👾', flag: '🇺🇸', level: 18 },
  { id: 'm2', name: 'GABRIEL GS', trophies: 12710, clan: 'Great Warriors', online: true, avatarColor: 'from-emerald-500 to-teal-700', avatarInitial: 'G', rank: 2, avatarEmoji: '👑', flag: '🇧🇷', level: 15 },
  { id: 'm3', name: 'Basti', trophies: 10851, clan: 'Great Warriors', online: false, avatarColor: 'from-blue-500 to-indigo-700', avatarInitial: 'B', rank: 3, avatarEmoji: '🐺', flag: '🇩🇪', level: 12 },
  { id: 'm4', name: 'ClashMaster', trophies: 9420, clan: 'Great Warriors', online: false, avatarColor: 'from-yellow-500 to-amber-700', avatarInitial: 'C', rank: 4, avatarEmoji: '🦁', flag: '🇨🇦', level: 11 },
  { id: 'm5', name: 'Douvis', trophies: 8601, clan: 'Great Warriors', online: true, avatarColor: 'from-violet-500 to-fuchsia-700', avatarInitial: 'D', rank: 5, avatarEmoji: '🐼', flag: '🇨🇱', level: 8 },
];

const INITIAL_CLAN_MESSAGES: ClanMessage[] = [
  { id: 'msg1', sender: 'Jhow Maquem', role: 'Co-líder', trophies: 14000, text: 'Galera, a guerra de clãs termina em 3 horas! Quem ainda tem partidas pendentes, joguem logo! 👍', time: '12:44' },
  { id: 'msg2', sender: 'ZEUS', role: 'Ancião', trophies: 11644, text: 'Peguei nível 11 no Baralho "I"! O multiplicador de pontos subiu pra x122%, tá sensacional.', time: '12:47' },
  { id: 'msg3', sender: 'Murilo', role: 'Membro', trophies: 11489, text: 'Quase bati meu recorde de 15.000 pontuações ontem! Caiu o bloco red Z na hora errada haha', time: '12:50' },
  { id: 'msg4', sender: 'Lucas H.', role: 'Líder', trophies: 14000, text: 'Mandei ver! Fiz mais de 10.000 pontos no modo turbo e contribuí com troféus para o clã.', time: '13:01' },
];

// ============================================================================
// 5. COMPONENTE VISUAL DE TAÇA DA LIGA (SVG 5-Lobed Duolingo/Clash Cup)
// ============================================================================

interface LeagueCupProps {
  division: LeagueDivision | 'Locked';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  active?: boolean;
}

export function LeagueCup({ division, size = 'md', active = false }: LeagueCupProps) {
  const widthHeight = {
    sm: 56,
    md: 100,
    lg: 130,
    xl: 180,
  }[size];

  const spec = {
    Locked: {
      bowlGrad: ['#475569', '#1e293b'],
      gemGrad: ['#334155', '#0f172a'],
      baseGrad: ['#1e293b', '#334155', '#0f172a'],
      wingGrad: ['#334155', '#1e293b'],
      hasLock: true,
    },
    Bronze: {
      bowlGrad: ['#d97706', '#78350f'],
      gemGrad: ['#fbbf24', '#92400e'],
      baseGrad: ['#78350f', '#d97706', '#451a03'],
      wingGrad: ['#d97706', '#92400e'],
      hasLock: false,
    },
    Prata: {
      bowlGrad: ['#cbd5e1', '#475569'],
      gemGrad: ['#f8fafc', '#64748b'],
      baseGrad: ['#475569', '#cbd5e1', '#1e293b'],
      wingGrad: ['#cbd5e1', '#64748b'],
      hasLock: false,
    },
    Ouro: {
      bowlGrad: ['#facc15', '#854d0e'],
      gemGrad: ['#fef08a', '#a16207'],
      baseGrad: ['#854d0e', '#facc15', '#422006'],
      wingGrad: ['#fef08a', '#ca8a04'],
      hasLock: false,
    },
    Safira: {
      bowlGrad: ['#06b6d4', '#1e3a8a'],
      gemGrad: ['#67e8f9', '#0369a1'],
      baseGrad: ['#1e3a8a', '#06b6d4', '#0f172a'],
      wingGrad: ['#06b6d4', '#0284c7'],
      hasLock: false,
    },
    Rubi: {
      bowlGrad: ['#f43f5e', '#881337'],
      gemGrad: ['#fda4af', '#be123c'],
      baseGrad: ['#4c0519', '#f43f5e', '#1e1b4b'],
      wingGrad: ['#f43f5e', '#be123c'],
      hasLock: false,
    },
  }[division];

  const idPrefix = `standalone-${division.toLowerCase()}-${size}`;

  return (
    <div className="relative flex items-center justify-center transition-all duration-300">
      <svg
        width={widthHeight}
        height={widthHeight}
        viewBox="0 0 100 100"
        className={`filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] ${active ? 'animate-bounce' : 'scale-95 opacity-70'
          }`}
      >
        <defs>
          <linearGradient id={`${idPrefix}-bowl`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={spec.bowlGrad[0]} />
            <stop offset="100%" stopColor={spec.bowlGrad[1]} />
          </linearGradient>
          <linearGradient id={`${idPrefix}-gem`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={spec.gemGrad[0]} />
            <stop offset="100%" stopColor={spec.gemGrad[1]} />
          </linearGradient>
          <linearGradient id={`${idPrefix}-base`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={spec.baseGrad[0]} />
            <stop offset="50%" stopColor={spec.baseGrad[1]} />
            <stop offset="100%" stopColor={spec.baseGrad[2]} />
          </linearGradient>
          <linearGradient id={`${idPrefix}-wing`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={spec.wingGrad[0]} />
            <stop offset="100%" stopColor={spec.wingGrad[1]} />
          </linearGradient>
        </defs>

        {/* Alças / Asas */}
        <path d="M 22 32 C 10 26 10 46 22 48 Z" fill={`url(#${idPrefix}-wing)`} />
        <path d="M 78 32 C 90 26 90 46 78 48 Z" fill={`url(#${idPrefix}-wing)`} />

        {/* Pedestal Base */}
        <ellipse cx="50" cy="85" rx="28" ry="8" fill={`url(#${idPrefix}-base)`} />
        <ellipse cx="50" cy="80" rx="22" ry="5" fill={`url(#${idPrefix}-bowl)`} />

        {/* Haste de Suporte */}
        <path d="M 45 80 Q 50 72 50 64 Q 50 72 55 80 Z" fill={`url(#${idPrefix}-base)`} />
        <circle cx="50" cy="65" r="7" fill={`url(#${idPrefix}-gem)`} />

        {/* Cálice da Taça */}
        <path
          d="M 50 62 C 32 58 20 45 20 30 C 20 18 30 18 35 25 C 40 15 48 15 50 25 C 52 15 60 15 65 25 C 70 18 80 18 80 30 C 80 45 68 58 50 62 Z"
          fill={`url(#${idPrefix}-bowl)`}
        />

        {/* Brilho Interno / Brasão */}
        <path
          d="M 50 56 C 36 52 26 42 26 31 C 26 23 32 23 36 28 C 40 20 47 20 50 28 C 53 20 60 20 64 28 C 68 23 74 23 74 31 C 74 42 64 52 50 56 Z"
          fill={`url(#${idPrefix}-gem)`}
          opacity="0.85"
        />

        {/* Reflexo na Asa Esquerda */}
        <path d="M 24 30 Q 30 25 34 28 Q 28 36 24 30 Z" fill="#ffffff" opacity="0.3" />

        {/* Cadeado se bloqueado */}
        {spec.hasLock && (
          <g transform="translate(42, 33)">
            <path d="M 4 8 A 4 4 0 0 1 12 8 L 12 12 L 4 12 Z" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
            <rect x="2" y="10" width="12" height="10" rx="2" fill="#64748b" />
            <circle cx="8" cy="14" r="1.5" fill="#1e293b" />
            <path d="M 7.5 15 L 8.5 15 L 9 18 L 7 18 Z" fill="#1e293b" />
          </g>
        )}

        {/* Estrelas de brilho se ativa */}
        {active && !spec.hasLock && (
          <g>
            <path d="M 50 15 Q 50 5 50 15 Q 60 15 50 15 Q 50 25 50 15 Q 40 15 50 15" fill="#ffffff" opacity="0.95" />
            <path d="M 72 54 Q 72 48 72 54 Q 78 54 72 54 Q 72 60 72 54 Q 66 54 72 54" fill="#ffffff" opacity="0.9" />
            <path d="M 28 22 Q 28 17 28 22 Q 33 22 28 22 Q 28 27 28 22 Q 23 22 28 22" fill="#ffffff" opacity="0.9" />
          </g>
        )}
      </svg>

      {active && (
        <div className="absolute -z-10 w-[120%] h-[120%] rounded-full animate-pulse opacity-20 bg-radial from-white to-transparent pointer-events-none filter blur-xl" />
      )}
    </div>
  );
}

// ============================================================================
// 6. COMPONENTE PRINCIPAL STANDALONE (Amigos, Guilda e Liga)
// ============================================================================

export default function LigasStandalone({
  profile = DEFAULT_PROFILE,
  messages: externalMessages,
  onSendMessage,
  activeSubTabProp,
  onChangeSubTab,
  soundEnabled = true,
}: LigasStandaloneProps) {
  useEffect(() => {
    standaloneSound.enabled = soundEnabled;
  }, [soundEnabled]);

  // Controle das 3 sub-abas principais:
  // 'amigos' -> Aba Amigos / Aliança
  // 'bate-papo' -> Aba Guilda (Chat do Clã)
  // 'guerra-de-clas' -> Aba Liga (Semanal & Mensal)
  const [localSubTab, setLocalSubTab] = useState<'amigos' | 'bate-papo' | 'guerra-de-clas'>('amigos');
  const activeSubTab = activeSubTabProp !== undefined ? activeSubTabProp : localSubTab;
  const setActiveSubTab = onChangeSubTab !== undefined ? onChangeSubTab : setLocalSubTab;

  // Sub-seletor dentro de Amigos: 'amigos' ou 'membros' (Membros do Clã)
  const [communityTab, setCommunityTab] = useState<'amigos' | 'membros'>('amigos');

  // Ordenação da lista: 'posicao' | 'trofeus' | 'nome'
  const [sortBy, setSortBy] = useState<'posicao' | 'trofeus' | 'nome'>('posicao');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Estados de Amigos, Membros e Mensagens da Guilda
  const [friends, setFriends] = useState<FriendItem[]>(INITIAL_FRIENDS);
  const [members] = useState<FriendItem[]>(INITIAL_MEMBERS);
  const [internalMessages, setInternalMessages] = useState<ClanMessage[]>(INITIAL_CLAN_MESSAGES);
  const messages = externalMessages !== undefined ? externalMessages : internalMessages;

  const [typedMessage, setTypedMessage] = useState<string>('');
  const [showAddFriendModal, setShowAddFriendModal] = useState<boolean>(false);
  const [newFriendName, setNewFriendName] = useState<string>('');
  const [showCameraFlash, setShowCameraFlash] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Alternador da aba Liga: 'semanal' | 'mensal'
  const [leagueViewType, setLeagueViewType] = useState<'semanal' | 'mensal'>('semanal');

  const chatScrollerRef = useRef<HTMLDivElement>(null);

  // Estado da Liga Semanal
  const [leagueState, setLeagueState] = useState<LeagueState>(getLeagueState());
  const [seasonEndStep, setSeasonEndStep] = useState<number | null>(leagueState.lastResult ? 1 : null);

  useEffect(() => {
    if (leagueState.lastResult) {
      setSeasonEndStep(1);
    } else {
      setSeasonEndStep(null);
    }
  }, [leagueState.lastResult]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<LeagueState>;
      if (customEvent.detail) {
        setLeagueState(customEvent.detail);
      }
    };
    window.addEventListener('tetris-clash-league-update', handleUpdate);
    return () => window.removeEventListener('tetris-clash-league-update', handleUpdate);
  }, []);

  // Estado da Liga Mensal
  const [monthlyLeagueState, setMonthlyLeagueState] = useState<LeagueState>(getMonthlyLeagueState());
  const [monthlySeasonEndStep, setMonthlySeasonEndStep] = useState<number | null>(
    monthlyLeagueState.lastResult ? 1 : null
  );

  useEffect(() => {
    if (monthlyLeagueState.lastResult) {
      setMonthlySeasonEndStep(1);
    } else {
      setMonthlySeasonEndStep(null);
    }
  }, [monthlyLeagueState.lastResult]);

  useEffect(() => {
    const handleMonthlyUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<LeagueState>;
      if (customEvent.detail) {
        setMonthlyLeagueState(customEvent.detail);
      }
    };
    window.addEventListener('tetris-clash-monthly-league-update', handleMonthlyUpdate);
    return () => window.removeEventListener('tetris-clash-monthly-league-update', handleMonthlyUpdate);
  }, []);

  // Ações de simulação da Liga Semanal
  const handleSimulateMatchXp = () => {
    standaloneSound.playMove();
    const xpGain = Math.floor(Math.random() * 50) + 35; // 35 a 85 XP
    addPlayerLeagueXp(xpGain);
  };

  const handleEndWeek = () => {
    standaloneSound.playLevelUp();
    const state = getLeagueState();
    if (!state.joined) return;

    const playerItem: LeagueParticipant = {
      id: 'player',
      name: profile.username || 'Você',
      xp: state.playerXp,
      flag: '🇧🇷',
      avatarColor: 'bg-purple-600',
      avatarEmoji: '👑',
      isPlayer: true,
      level: profile.level,
    };

    const allParticipants = [playerItem, ...state.opponents].sort((a, b) => b.xp - a.xp);
    const rank = allParticipants.findIndex((p) => p.isPlayer) + 1;

    let type: 'promotion' | 'demotion' | 'stay' = 'stay';
    let newDivision = state.division;
    const divIndex = LEAGUE_DIVISIONS.indexOf(state.division);

    if (rank <= 3) {
      if (divIndex < LEAGUE_DIVISIONS.length - 1) {
        newDivision = LEAGUE_DIVISIONS[divIndex + 1];
        type = 'promotion';
      }
    } else if (rank >= 8) {
      if (divIndex > 0) {
        newDivision = LEAGUE_DIVISIONS[divIndex - 1];
        type = 'demotion';
      }
    }

    const nextState: LeagueState = {
      division: newDivision,
      joined: false,
      playerXp: 0,
      daysRemaining: 6,
      opponents: [],
      lastResult: {
        type,
        oldDivision: state.division,
        newDivision,
        rank,
        participants: allParticipants,
      },
    };

    saveLeagueState(nextState);
    setLeagueState(nextState);
  };

  const handleClearLastResult = () => {
    standaloneSound.playMove();
    const state = getLeagueState();
    const nextState: LeagueState = {
      ...state,
      lastResult: null,
    };
    saveLeagueState(nextState);
    setLeagueState(nextState);
  };

  // Ações de simulação da Liga Mensal
  const handleSimulateMonthlyMatchXp = () => {
    standaloneSound.playMove();
    const xpGain = Math.floor(Math.random() * 50) + 35;
    addPlayerMonthlyLeagueXp(xpGain);
  };

  const handleEndMonth = () => {
    standaloneSound.playLevelUp();
    const state = getMonthlyLeagueState();
    if (!state.joined) return;

    const playerItem: LeagueParticipant = {
      id: 'player',
      name: profile.username || 'Você',
      xp: state.playerXp,
      flag: '🇧🇷',
      avatarColor: 'bg-purple-600',
      avatarEmoji: '👑',
      isPlayer: true,
      level: profile.level,
    };

    const allParticipants = [playerItem, ...state.opponents].sort((a, b) => b.xp - a.xp);
    const rank = allParticipants.findIndex((p) => p.isPlayer) + 1;

    let type: 'promotion' | 'demotion' | 'stay' = 'stay';
    let newDivision = state.division;
    const divIndex = LEAGUE_DIVISIONS.indexOf(state.division);

    if (rank <= 3) {
      if (divIndex < LEAGUE_DIVISIONS.length - 1) {
        newDivision = LEAGUE_DIVISIONS[divIndex + 1];
        type = 'promotion';
      }
    } else if (rank >= 8) {
      if (divIndex > 0) {
        newDivision = LEAGUE_DIVISIONS[divIndex - 1];
        type = 'demotion';
      }
    }

    const nextState: LeagueState = {
      division: newDivision,
      joined: false,
      playerXp: 0,
      daysRemaining: 27,
      opponents: [],
      lastResult: {
        type,
        oldDivision: state.division,
        newDivision,
        rank,
        participants: allParticipants,
      },
    };

    saveMonthlyLeagueState(nextState);
    setMonthlyLeagueState(nextState);
  };

  const handleClearLastMonthlyResult = () => {
    standaloneSound.playMove();
    const state = getMonthlyLeagueState();
    const nextState: LeagueState = {
      ...state,
      lastResult: null,
    };
    saveMonthlyLeagueState(nextState);
    setMonthlyLeagueState(nextState);
  };

  // Expressões rápidas de chat da Guilda
  const QUICK_REPLIES = [
    'Boa jogada! 👍',
    'Tetris na lata! 🔥',
    'Modo Turbo é insano! ⚡',
    'Bati meu recorde! 🎉',
    'Que sorte grande! 🍀',
  ];

  useEffect(() => {
    if (chatScrollerRef.current && activeSubTab === 'bate-papo') {
      chatScrollerRef.current.scrollTop = chatScrollerRef.current.scrollHeight;
    }
  }, [messages, activeSubTab]);

  const dispatchChatMessage = (text: string) => {
    if (onSendMessage) {
      onSendMessage(text);
    } else {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newMsg: ClanMessage = {
        id: `msg-${Date.now()}`,
        sender: profile.username || 'GABRIEL GS',
        role: 'Líder',
        trophies: profile.trophies || 12710,
        text,
        time: timeStr,
        isSelf: true,
      };
      setInternalMessages((prev) => [...prev, newMsg]);
    }
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    dispatchChatMessage(typedMessage.trim());
    setTypedMessage('');
    standaloneSound.playHold();
  };

  const handleQuickReplyClick = (reply: string) => {
    dispatchChatMessage(reply);
    standaloneSound.playHold();
  };

  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;

    const newFriend: FriendItem = {
      id: Date.now().toString(),
      name: newFriendName.trim(),
      trophies: Math.floor(Math.random() * 5000) + 4000,
      clan: Math.random() > 0.4 ? 'milicas' : null,
      online: true,
      avatarColor: 'from-indigo-500 to-purple-700',
      avatarInitial: newFriendName.charAt(0).toUpperCase(),
      rank: friends.length + 1,
      avatarEmoji: ['🦖', '🐼', '🦊', '🐨', '🦁', '👾', '🚀', '🦄'][Math.floor(Math.random() * 8)],
      flag: ['🇧🇷', '🇺🇸', '🇲🇽', '🇯🇵', '🇦🇷', '🇨🇦'][Math.floor(Math.random() * 6)],
      level: Math.floor(Math.random() * 12) + 4,
    };

    setFriends((prev) => [newFriend, ...prev]);
    setNewFriendName('');
    setShowAddFriendModal(false);
    standaloneSound.playLevelUp();
  };

  const handleCameraClick = () => {
    standaloneSound.playMove();
    setShowCameraFlash(true);
    setTimeout(() => {
      setShowCameraFlash(false);
    }, 400);
  };

  const renderFilterButton = (
    label: string,
    active: boolean,
    onClick: () => void,
    activeTheme: 'blue' | 'gold' | 'purple' = 'blue'
  ) => {
    let bgClasses = '';
    if (active) {
      if (activeTheme === 'blue') {
        bgClasses =
          'from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 shadow-[0_4px_0_#1d4ed8] hover:shadow-[0_5px_0_#1d4ed8]';
      } else if (activeTheme === 'gold') {
        bgClasses =
          'from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_4px_0_#b45309] hover:shadow-[0_5px_0_#b45309]';
      } else {
        bgClasses =
          'from-indigo-400 to-indigo-600 hover:from-indigo-300 hover:to-indigo-500 shadow-[0_4px_0_#4338ca] hover:shadow-[0_5px_0_#4338ca]';
      }
    } else {
      bgClasses =
        'from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 shadow-[0_4px_0_#1e293b] hover:shadow-[0_5px_0_#1e293b] border-slate-800';
    }

    return (
      <button
        onClick={onClick}
        type="button"
        className={`w-full relative bg-gradient-to-b ${bgClasses} border-2 border-slate-950 rounded-2xl active:translate-y-1 active:shadow-none text-white font-black py-2 px-3 text-[10px] tracking-wider uppercase flex items-center justify-center transition-all cursor-pointer font-sans`}
      >
        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10 rounded-t-2xl pointer-events-none" />
        <span className="truncate drop-shadow-[0_1.5px_0_rgba(0,0,0,0.8)]">{label}</span>
      </button>
    );
  };

  const getSortedList = (list: FriendItem[]) => {
    const listCopy = [...list];
    if (sortBy === 'nome') {
      return listCopy.sort((a, b) => a.name.localeCompare(b.name));
    }
    return listCopy.sort((a, b) => b.trophies - a.trophies);
  };

  const currentList = communityTab === 'amigos' ? friends : members;
  const sortedList = getSortedList(currentList);

  // ============================================================================
  // 7. PORTAIS DE ENCERRAMENTO DE TEMPORADA (Semanal e Mensal)
  // ============================================================================

  const renderSeasonEndPortal = () => {
    if (seasonEndStep === null || !leagueState.lastResult) return null;

    const res = leagueState.lastResult;
    const oldDiv = res.oldDivision;
    const newDiv = res.newDivision;
    const type = res.type;
    const rank = res.rank;
    const participants = res.participants || [];

    const oldIdx = LEAGUE_DIVISIONS.indexOf(oldDiv);
    const prevDiv = oldIdx > 0 ? LEAGUE_DIVISIONS[oldIdx - 1] : null;

    const newIdx = LEAGUE_DIVISIONS.indexOf(newDiv);
    const newPrevDiv = newIdx > 0 ? LEAGUE_DIVISIONS[newIdx - 1] : null;

    const handleNextStep = () => {
      standaloneSound.playMove();
      if (seasonEndStep === 1) {
        setSeasonEndStep(2);
      } else if (seasonEndStep === 2) {
        if (type === 'promotion') {
          setSeasonEndStep(3);
        } else {
          handleClearLastResult();
        }
      } else {
        handleClearLastResult();
      }
    };

    const handleShare = () => {
      standaloneSound.playLevelUp();
      const shareText = `Subi para a Divisão ${newDiv} no Tetris Clash! 🏆 Meu brilho ofusca tudo e todos!`;
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    if (seasonEndStep === 3) {
      return createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#0a0518] p-6 text-white flex flex-col justify-between overflow-hidden select-none shadow-2xl overflow-y-auto animate-fade-in">
          <div
            className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none"
            style={{ clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)' }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none animate-pulse" />

          <button
            onClick={handleClearLastResult}
            className="absolute top-6 left-6 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer z-20"
          >
            <X size={22} />
          </button>

          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 pt-12 relative z-10 max-w-md mx-auto w-full">
            <div className="relative scale-110 drop-shadow-[0_0_20px_rgba(245,158,11,0.35)]">
              <LeagueCup division={newDiv} size="xl" active={true} />
            </div>

            <div className="space-y-4 px-4 max-w-[320px]">
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight uppercase font-serif">
                Você subiu para a{' '}
                <span className="text-amber-400 underline decoration-wavy underline-offset-4">
                  Divisão {newDiv}
                </span>
                !
              </h2>
              <p className="text-sm text-slate-300 font-medium max-w-[280px] mx-auto leading-relaxed">
                Seu brilho ofusca tudo e todos! Parabéns pela sua dedicação nas arenas! ✨
              </p>
            </div>
          </div>

          <div className="space-y-4 relative z-10 w-full max-w-[320px] mx-auto pt-6 pb-4">
            <button
              onClick={handleShare}
              className="w-full py-4.5 bg-[#ffd23f] hover:bg-[#e6bd35] text-slate-950 font-black text-sm uppercase tracking-wider transition-all duration-150 rounded-2xl shadow-[0_4px_0_#b45309] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              <Share2 size={16} className="text-slate-950" />
              Compartilhar Recompensa
            </button>
            <button
              onClick={handleClearLastResult}
              className="w-full py-3 text-slate-400 hover:text-white font-black text-xs uppercase tracking-wider transition-all text-center cursor-pointer select-none"
            >
              Começar Nova Semana 🚀
            </button>
          </div>

          <AnimatePresence>
            {copied && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-28 left-1/2 transform -translate-x-1/2 bg-slate-950 border border-slate-800 text-xs text-white px-4 py-2.5 rounded-xl shadow-lg z-50 flex items-center gap-1.5 font-bold"
              >
                <span>Copiado para a área de transferência!</span> 📋
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        document.body
      );
    }

    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-[#0a0518] p-6 text-white flex flex-col justify-between overflow-hidden select-none shadow-2xl animate-fade-in overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-transparent to-slate-950/90 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06),transparent_80%)] pointer-events-none" />

        {seasonEndStep === 1 && (
          <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full py-4 relative z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-2 py-4">
                <LeagueCup division={prevDiv || 'Locked'} size="sm" />
                <div className="scale-125 transition-transform duration-500 hover:scale-130">
                  <LeagueCup division={oldDiv} size="lg" active={true} />
                </div>
                <LeagueCup division="Locked" size="sm" />
              </div>

              <div className="text-center px-4 space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full select-none">
                  <span className="inline-block w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none">
                    Temporada Encerrada
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
                  Você ficou em <span className="text-yellow-400 font-serif font-black text-3xl">{rank}º</span> Lugar
                </h3>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Placar Final da Divisão {oldDiv}
                </p>
              </div>

              <div className="border border-indigo-950/80 bg-slate-950/45 rounded-3xl p-3.5 max-h-[340px] overflow-y-auto space-y-2 shadow-xl scrollbar-thin">
                {participants.length > 0 ? (
                  participants.map((item, index) => {
                    const isSelf = item.isPlayer;
                    const rankNum = index + 1;
                    const isTop3 = rankNum <= 3;
                    const isBot3 = rankNum >= 8;

                    let rankBadgeClass = 'text-slate-400 bg-slate-900 border-slate-850';
                    if (rankNum === 1)
                      rankBadgeClass =
                        'text-yellow-950 bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(234,179,8,0.4)]';
                    else if (rankNum === 2) rankBadgeClass = 'text-slate-900 bg-slate-300 border-slate-200';
                    else if (rankNum === 3) rankBadgeClass = 'text-amber-900 bg-amber-600 border-amber-500';

                    return (
                      <React.Fragment key={item.id}>
                        <div
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isSelf
                              ? 'bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-indigo-950/60 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/10 scale-[1.02]'
                              : isTop3
                                ? 'bg-[#1a2e26]/30 border-emerald-500/15 hover:bg-slate-900/30'
                                : isBot3
                                  ? 'bg-[#2e1a21]/30 border-rose-500/15 hover:bg-slate-900/30'
                                  : 'bg-slate-900/40 border-slate-900/30 hover:bg-slate-900/60'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full border-2 font-mono font-black text-xs flex items-center justify-center shrink-0 ${rankBadgeClass}`}
                            >
                              {rankNum}
                            </div>

                            <div
                              className={`w-8 h-8 rounded-full ${item.avatarColor} flex items-center justify-center text-base shrink-0 border border-slate-950/40 shadow-inner relative`}
                            >
                              {item.avatarEmoji}
                              {isSelf && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border border-slate-950 rounded-full animate-pulse" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-xs font-black ${isSelf ? 'text-purple-300 font-serif' : 'text-white'
                                    }`}
                                >
                                  {item.name}
                                </span>
                                <span className="text-xs" title="País">
                                  {item.flag}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono mt-0.5">
                                Nível {item.level || 1} {isSelf && '• VOCÊ'}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`text-xs font-black font-mono tracking-tight ${isSelf ? 'text-purple-400' : 'text-slate-300'
                                }`}
                            >
                              {item.xp} XP
                            </span>
                          </div>
                        </div>

                        {rankNum === 3 && (
                          <div className="py-1.5 flex items-center gap-2 select-none my-1">
                            <div className="flex-1 h-[1px] bg-emerald-500/25" />
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 leading-none shrink-0">
                              <ArrowUp className="w-3 h-3 animate-bounce" /> Zona de Promoção (Top 3)
                            </span>
                            <div className="flex-1 h-[1px] bg-emerald-500/25" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">Nenhum competidor registrado.</div>
                )}
              </div>
            </div>

            <div className="pt-8 w-full">
              <button
                onClick={handleNextStep}
                className="w-full py-4 bg-[#1cb0f6] hover:bg-[#189ecc] text-white font-black text-xs uppercase tracking-wider transition-all duration-150 rounded-2xl shadow-[0_4px_0_#1482ab] active:translate-y-[2px] active:shadow-none cursor-pointer block text-center select-none animate-pulse"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {seasonEndStep === 2 && (
          <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full py-4 relative z-10">
            <div className="space-y-8 flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="flex items-center justify-center gap-2 py-4">
                <LeagueCup division={newPrevDiv || 'Locked'} size="sm" />
                <div className="scale-130 transition-transform duration-500 hover:scale-135 relative">
                  <LeagueCup division={newDiv} size="lg" active={true} />
                </div>
                <LeagueCup division="Locked" size="sm" />
              </div>

              <div className="space-y-4 px-4 max-w-[320px] mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-2">
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest leading-none">
                    Nova Semana Ativa
                  </span>
                </div>

                <h3 className="text-xl font-black text-white leading-relaxed uppercase tracking-wide">
                  {type === 'promotion' ? (
                    <>
                      Você vai competir na{' '}
                      <span className="text-yellow-400 underline decoration-indigo-500 font-serif">
                        Divisão {newDiv}
                      </span>{' '}
                      essa semana!
                    </>
                  ) : type === 'demotion' ? (
                    <>
                      Você vai competir na{' '}
                      <span className="text-rose-400 underline font-serif">Divisão {newDiv}</span> essa semana.
                    </>
                  ) : (
                    <>
                      Você vai competir na{' '}
                      <span className="text-slate-300 underline decoration-sky-500 font-serif">
                        Divisão {newDiv}
                      </span>{' '}
                      de novo essa semana!
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold uppercase tracking-widest px-2">
                  {type === 'promotion'
                    ? 'Subiu de liga! Continue mandando bala nas arenas para alcançar o topo! 🚀'
                    : type === 'demotion'
                      ? 'Não desanime! Com batalhas dedicadas você vai reaver o seu lugar! 💪'
                      : 'A batalha continua acirrada! Faça mais partidas para subir de nível! 🔥'}
                </p>
              </div>
            </div>

            <div className="pt-8 w-full">
              <button
                onClick={handleNextStep}
                className="w-full py-4 bg-[#1cb0f6] hover:bg-[#189ecc] text-white font-black text-xs uppercase tracking-wider transition-all duration-150 rounded-2xl shadow-[0_4px_0_#1482ab] active:translate-y-[2px] active:shadow-none cursor-pointer block text-center select-none"
              >
                Continuar
              </button>
            </div>
          </div>
        )}
      </div>,
      document.body
    );
  };

  const renderMonthlySeasonEndPortal = () => {
    if (monthlySeasonEndStep === null || !monthlyLeagueState.lastResult) return null;

    const res = monthlyLeagueState.lastResult;
    const oldDiv = res.oldDivision;
    const newDiv = res.newDivision;
    const type = res.type;
    const rank = res.rank;
    const participants = res.participants || [];

    const oldIdx = LEAGUE_DIVISIONS.indexOf(oldDiv);
    const prevDiv = oldIdx > 0 ? LEAGUE_DIVISIONS[oldIdx - 1] : null;

    const newIdx = LEAGUE_DIVISIONS.indexOf(newDiv);
    const newPrevDiv = newIdx > 0 ? LEAGUE_DIVISIONS[newIdx - 1] : null;

    const handleNextStep = () => {
      standaloneSound.playMove();
      if (monthlySeasonEndStep === 1) {
        setMonthlySeasonEndStep(2);
      } else if (monthlySeasonEndStep === 2) {
        if (type === 'promotion') {
          setMonthlySeasonEndStep(3);
        } else {
          handleClearLastMonthlyResult();
        }
      } else {
        handleClearLastMonthlyResult();
      }
    };

    const handleShare = () => {
      standaloneSound.playLevelUp();
      const shareText = `Subi para a Divisão ${newDiv} Mensal no Tetris Clash! 🏆 Meu brilho ofusca tudo e todos!`;
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    if (monthlySeasonEndStep === 3) {
      return createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#0a0518] p-6 text-white flex flex-col justify-between overflow-hidden select-none shadow-2xl overflow-y-auto animate-fade-in">
          <div
            className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none"
            style={{ clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)' }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none animate-pulse" />

          <button
            onClick={handleClearLastMonthlyResult}
            className="absolute top-6 left-6 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer z-20"
          >
            <X size={22} />
          </button>

          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 pt-12 relative z-10 max-w-md mx-auto w-full">
            <div className="relative scale-110 drop-shadow-[0_0_20px_rgba(245,158,11,0.35)]">
              <LeagueCup division={newDiv} size="xl" active={true} />
            </div>

            <div className="space-y-4 px-4 max-w-[320px]">
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight uppercase font-serif">
                Você subiu para a{' '}
                <span className="text-amber-400 underline decoration-wavy underline-offset-4">
                  Divisão {newDiv}
                </span>{' '}
                Mensal!
              </h2>
              <p className="text-sm text-slate-300 font-medium max-w-[280px] mx-auto leading-relaxed">
                Seu brilho ofusca tudo e todos! Parabéns pela sua dedicação nas arenas mensais! ✨
              </p>
            </div>
          </div>

          <div className="space-y-4 relative z-10 w-full max-w-[320px] mx-auto pt-6 pb-4">
            <button
              onClick={handleShare}
              className="w-full py-4.5 bg-[#ffd23f] hover:bg-[#e6bd35] text-slate-950 font-black text-sm uppercase tracking-wider transition-all duration-150 rounded-2xl shadow-[0_4px_0_#b45309] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              <Share2 size={16} className="text-slate-950" />
              Compartilhar Recompensa
            </button>
            <button
              onClick={handleClearLastMonthlyResult}
              className="w-full py-3 text-slate-400 hover:text-white font-black text-xs uppercase tracking-wider transition-all text-center cursor-pointer select-none"
            >
              Começar Novo Mês 🚀
            </button>
          </div>

          <AnimatePresence>
            {copied && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-28 left-1/2 transform -translate-x-1/2 bg-slate-950 border border-slate-800 text-xs text-white px-4 py-2.5 rounded-xl shadow-lg z-50 flex items-center gap-1.5 font-bold"
              >
                <span>Copiado para a área de transferência!</span> 📋
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        document.body
      );
    }

    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-[#0a0518] p-6 text-white flex flex-col justify-between overflow-hidden select-none shadow-2xl animate-fade-in overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-transparent to-slate-950/90 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06),transparent_80%)] pointer-events-none" />

        {monthlySeasonEndStep === 1 && (
          <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full py-4 relative z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-2 py-4">
                <LeagueCup division={prevDiv || 'Locked'} size="sm" />
                <div className="scale-125 transition-transform duration-500 hover:scale-130">
                  <LeagueCup division={oldDiv} size="lg" active={true} />
                </div>
                <LeagueCup division="Locked" size="sm" />
              </div>

              <div className="text-center px-4 space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full select-none">
                  <span className="inline-block w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none">
                    Temporada Mensal Encerrada
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
                  Você ficou em <span className="text-yellow-400 font-serif font-black text-3xl">{rank}º</span> Lugar
                </h3>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Placar Final Mensal - Divisão {oldDiv}
                </p>
              </div>

              <div className="border border-indigo-950/80 bg-slate-950/45 rounded-3xl p-3.5 max-h-[340px] overflow-y-auto space-y-2 shadow-xl scrollbar-thin">
                {participants.length > 0 ? (
                  participants.map((item, index) => {
                    const isSelf = item.isPlayer;
                    const rankNum = index + 1;
                    const isTop3 = rankNum <= 3;
                    const isBot3 = rankNum >= 8;

                    let rankBadgeClass = 'text-slate-400 bg-slate-900 border-slate-850';
                    if (rankNum === 1)
                      rankBadgeClass =
                        'text-yellow-950 bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(234,179,8,0.4)]';
                    else if (rankNum === 2) rankBadgeClass = 'text-slate-900 bg-slate-300 border-slate-200';
                    else if (rankNum === 3) rankBadgeClass = 'text-amber-900 bg-amber-600 border-amber-500';

                    return (
                      <React.Fragment key={item.id}>
                        <div
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isSelf
                              ? 'bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-indigo-950/60 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/10 scale-[1.02]'
                              : isTop3
                                ? 'bg-[#1a2e26]/30 border-emerald-500/15 hover:bg-slate-900/30'
                                : isBot3
                                  ? 'bg-[#2e1a21]/30 border-rose-500/15 hover:bg-slate-900/30'
                                  : 'bg-slate-900/40 border-slate-900/30 hover:bg-slate-900/60'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full border-2 font-mono font-black text-xs flex items-center justify-center shrink-0 ${rankBadgeClass}`}
                            >
                              {rankNum}
                            </div>

                            <div
                              className={`w-8 h-8 rounded-full ${item.avatarColor} flex items-center justify-center text-base shrink-0 border border-slate-950/40 shadow-inner relative`}
                            >
                              {item.avatarEmoji}
                              {isSelf && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border border-slate-950 rounded-full animate-pulse" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-xs font-black ${isSelf ? 'text-purple-300 font-serif' : 'text-white'
                                    }`}
                                >
                                  {item.name}
                                </span>
                                <span className="text-xs" title="País">
                                  {item.flag}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono mt-0.5">
                                Nível {item.level || 1} {isSelf && '• VOCÊ'}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`text-xs font-black font-mono tracking-tight ${isSelf ? 'text-purple-400' : 'text-slate-300'
                                }`}
                            >
                              {item.xp} XP
                            </span>
                          </div>
                        </div>

                        {rankNum === 3 && (
                          <div className="py-1.5 flex items-center gap-2 select-none my-1">
                            <div className="flex-1 h-[1px] bg-emerald-500/25" />
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 leading-none shrink-0">
                              <ArrowUp className="w-3 h-3 animate-bounce" /> Zona de Promoção (Top 3)
                            </span>
                            <div className="flex-1 h-[1px] bg-emerald-500/25" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">Nenhum competidor registrado.</div>
                )}
              </div>
            </div>

            <div className="pt-8 w-full">
              <button
                onClick={handleNextStep}
                className="w-full py-4 bg-[#1cb0f6] hover:bg-[#189ecc] text-white font-black text-xs uppercase tracking-wider transition-all duration-150 rounded-2xl shadow-[0_4px_0_#1482ab] active:translate-y-[2px] active:shadow-none cursor-pointer block text-center select-none animate-pulse"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {monthlySeasonEndStep === 2 && (
          <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full py-4 relative z-10">
            <div className="space-y-8 flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="flex items-center justify-center gap-2 py-4">
                <LeagueCup division={newPrevDiv || 'Locked'} size="sm" />
                <div className="scale-130 transition-transform duration-500 hover:scale-135 relative">
                  <LeagueCup division={newDiv} size="lg" active={true} />
                </div>
                <LeagueCup division="Locked" size="sm" />
              </div>

              <div className="space-y-4 px-4 max-w-[320px] mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-2">
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest leading-none">
                    Novo Mês Ativo
                  </span>
                </div>

                <h3 className="text-xl font-black text-white leading-relaxed uppercase tracking-wide">
                  {type === 'promotion' ? (
                    <>
                      Você vai competir na{' '}
                      <span className="text-yellow-400 underline decoration-indigo-500 font-serif">
                        Divisão {newDiv}
                      </span>{' '}
                      este mês!
                    </>
                  ) : type === 'demotion' ? (
                    <>
                      Você vai competir na{' '}
                      <span className="text-rose-400 underline font-serif">Divisão {newDiv}</span> este mês.
                    </>
                  ) : (
                    <>
                      Você vai competir na{' '}
                      <span className="text-slate-300 underline decoration-sky-500 font-serif">
                        Divisão {newDiv}
                      </span>{' '}
                      de novo este mês!
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold uppercase tracking-widest px-2">
                  {type === 'promotion'
                    ? 'Subiu de liga! Continue mandando bala nas arenas para alcançar o topo! 🚀'
                    : type === 'demotion'
                      ? 'Não desanime! Com batalhas dedicadas você vai reaver o seu lugar! 💪'
                      : 'A batalha continua acirrada! Faça mais partidas para subir de nível! 🔥'}
                </p>
              </div>
            </div>

            <div className="pt-8 w-full">
              <button
                onClick={handleNextStep}
                className="w-full py-4 bg-[#1cb0f6] hover:bg-[#189ecc] text-white font-black text-xs uppercase tracking-wider transition-all duration-150 rounded-2xl shadow-[0_4px_0_#1482ab] active:translate-y-[2px] active:shadow-none cursor-pointer block text-center select-none"
              >
                Continuar
              </button>
            </div>
          </div>
        )}
      </div>,
      document.body
    );
  };

  // ============================================================================
  // 8. RENDERIZAÇÃO PRINCIPAL DO COMPONENTE
  // ============================================================================

  return (
    <div id="tab-social-panel" className="w-full space-y-4 relative font-sans text-white">
      {/* Estilos Auxiliares Standalone (Fontes, Scrollbars e Animações) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;600;800&family=Rajdhani:wght@500;600;700;950&family=Space+Grotesk:wght@500;700&family=Montserrat:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;700&display=swap');

        @keyframes flash-effect {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-flash-effect {
          animation: flash-effect 0.4s ease-out forwards;
        }
        #tab-social-panel ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        #tab-social-panel ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
        }
        #tab-social-panel ::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 4px;
        }
        #tab-social-panel ::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>

      {/* Flash de captura da câmera */}
      {showCameraFlash && (
        <div className="fixed inset-0 bg-white z-[99999] pointer-events-none animate-flash-effect" />
      )}

      {/* BANNER DO CLÃ OU ALTERNADOR DE LIGA (Semanal / Mensal) */}
      <div className="flex items-center gap-2.5 w-full">
        {activeSubTab === 'guerra-de-clas' ? (
          <div className="flex-1 p-1.5 bg-[#141024]/90 border border-purple-500/20 rounded-2xl flex items-center select-none shadow-lg">
            <div className="grid grid-cols-2 gap-1.5 w-full">
              <button
                onClick={() => {
                  standaloneSound.playMove();
                  setLeagueViewType('semanal');
                }}
                className={`py-2 px-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer select-none flex items-center justify-center gap-1 ${leagueViewType === 'semanal'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border border-indigo-400/40'
                    : 'bg-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Calendar size={12} />
                Liga Semanal
              </button>
              <button
                onClick={() => {
                  standaloneSound.playMove();
                  setLeagueViewType('mensal');
                }}
                className={`py-2 px-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer select-none flex items-center justify-center gap-1 ${leagueViewType === 'mensal'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md border border-amber-300'
                    : 'bg-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Trophy size={12} className="text-amber-400" />
                Liga Mensal
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 border border-purple-900/30 rounded-2xl flex items-center justify-between select-none shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 bg-emerald-600 rounded-xl transform rotate-12 border border-yellow-500 shadow-inner" />
                <div className="absolute w-8 h-8 bg-blue-600 rounded-full border border-yellow-400" />
                <span className="relative z-10 text-xs font-black text-white">BR</span>
              </div>
              <div>
                <h4 className="text-base font-black text-white uppercase tracking-tight font-serif leading-none">
                  {profile.clanName || 'Great Warriors'}
                </h4>
                <p className="text-[10px] text-purple-400 font-semibold mt-1 uppercase tracking-wide">
                  Clã de Elite • 18/50 Membros
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[9px] text-slate-500 font-bold uppercase leading-none">Min. Copas</div>
              <div className="text-xs font-black text-yellow-400 leading-none mt-1 font-mono flex items-center justify-end gap-1">
                <Trophy className="w-3.5 h-3.5" /> 4.000
              </div>
            </div>
          </div>
        )}

        {/* Botão Fechar (visível quando está em Guilda ou Liga para voltar a Amigos) */}
        {activeSubTab !== 'amigos' && (
          <button
            onClick={() => {
              standaloneSound.playMove();
              setActiveSubTab('amigos');
            }}
            className="p-3.5 bg-slate-900 hover:bg-rose-950/40 border-2 border-slate-850 hover:border-rose-900/45 text-slate-400 hover:text-rose-400 rounded-2xl transition-all cursor-pointer flex items-center justify-center shadow-md shrink-0 active:scale-95"
            title="Voltar para Amigos"
          >
            <X size={18} className="font-bold" />
          </button>
        )}
      </div>

      {/* CONTEÚDO PRINCIPAL DAS SUB-ABAS */}
      {activeSubTab === 'amigos' ? (
        /* ====================================================================
           SUB-ABA 1: AMIGOS & ALIANÇA
           ==================================================================== */
        <div className="space-y-4">
          {/* NAVEGAÇÃO DOS 3 DIAMANTES NO TOPO (Amigos, Guilda, Liga) */}
          <div className="flex justify-center items-center gap-8 py-3 select-none">
            {/* DIAMANTE 1: AMIGOS */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  standaloneSound.playMove();
                  setActiveSubTab('amigos');
                }}
                className={`relative w-14 h-14 rotate-45 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer ${activeSubTab === 'amigos'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 shadow-[0_0_20px_rgba(139,92,246,0.6)] scale-110'
                    : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-500'
                  }`}
              >
                <div className="-rotate-45 text-white">
                  <Shield size={20} className={activeSubTab === 'amigos' ? 'animate-pulse' : ''} />
                </div>
              </button>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Amigos</span>
            </div>

            {/* DIAMANTE 2: GUILDA (Bate-papo do Clã) */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  standaloneSound.playMove();
                  setActiveSubTab('bate-papo');
                }}
                className="relative w-14 h-14 rotate-45 rounded-2xl border-2 bg-slate-900/80 border-slate-700/80 hover:border-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 rounded-full flex items-center justify-center text-[9px] font-black text-white border-2 border-slate-950 -rotate-45">
                  11
                </span>
                <div className="-rotate-45 text-white">
                  <MessageSquare size={18} />
                </div>
              </button>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Guilda</span>
            </div>

            {/* DIAMANTE 3: LIGA (Semanal & Mensal) */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  standaloneSound.playMove();
                  setActiveSubTab('guerra-de-clas');
                }}
                className="relative w-14 h-14 rotate-45 rounded-2xl border-2 bg-slate-900/80 border-slate-700/80 hover:border-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <div className="-rotate-45 text-white">
                  <Swords size={20} />
                </div>
              </button>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Liga</span>
            </div>
          </div>

          {/* CONTAINER ALIANÇA */}
          <div className="w-full bg-[#181428] border border-indigo-950 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden flex flex-col gap-4">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

            {/* Cabeçalho: Aliança + Botões de Ordenação/Filtro */}
            <div className="flex items-center justify-between select-none z-20 relative">
              <h3 className="text-lg font-black text-white uppercase tracking-tight font-serif flex items-center gap-2">
                Aliança
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    standaloneSound.playMove();
                    setSortBy((prev) => (prev === 'nome' ? 'trofeus' : 'nome'));
                  }}
                  className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white p-2.5 rounded-xl transition-all cursor-pointer active:scale-95"
                  title="Inverter Ordem"
                >
                  <ArrowUpDown size={14} />
                </button>
                <button
                  onClick={() => {
                    standaloneSound.playMove();
                    setShowFilters(!showFilters);
                  }}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer shadow-md border-b-2 active:border-b-0 active:translate-y-[2px] ${showFilters
                      ? 'bg-purple-600 border-purple-800 text-white hover:bg-purple-500'
                      : 'bg-[#ffd23f] hover:bg-[#e6bd35] border-yellow-600 text-slate-950'
                    }`}
                  title="Filtro Avançado"
                >
                  <SlidersHorizontal size={14} />
                </button>
              </div>

              {/* Menu Popover de Filtros */}
              <AnimatePresence>
                {showFilters && (
                  <>
                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowFilters(false)} />

                    <motion.div
                      key="filters-menu-popover"
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-[44px] z-50 w-52 bg-slate-950 border-4 border-slate-900 rounded-[2rem] p-4 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col gap-2.5 select-none"
                      id="alliance-filters-popover-menu"
                    >
                      <div className="absolute right-[16px] -top-[12px] w-5 h-5 bg-slate-950 border-t-4 border-l-4 border-slate-900 rotate-45 rounded-tl z-50 pointer-events-none" />

                      <div className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest pb-1 border-b border-slate-900">
                        Ordenar por
                      </div>

                      {renderFilterButton(
                        'Posição',
                        sortBy === 'posicao',
                        () => {
                          standaloneSound.playMove();
                          setSortBy('posicao');
                          setShowFilters(false);
                        },
                        'blue'
                      )}

                      {renderFilterButton(
                        'Troféus',
                        sortBy === 'trofeus',
                        () => {
                          standaloneSound.playMove();
                          setSortBy('trofeus');
                          setShowFilters(false);
                        },
                        'gold'
                      )}

                      {renderFilterButton(
                        'Nome',
                        sortBy === 'nome',
                        () => {
                          standaloneSound.playMove();
                          setSortBy('nome');
                          setShowFilters(false);
                        },
                        'purple'
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Seletor: AMIGOS / MEMBROS DO CLÃ */}
            <div className="flex justify-center border-b border-indigo-950/40 select-none z-10 pb-1">
              <div className="flex gap-6 text-xs font-black uppercase tracking-wider">
                <button
                  onClick={() => {
                    standaloneSound.playMove();
                    setCommunityTab('amigos');
                  }}
                  className={`pb-2 transition-all relative cursor-pointer ${communityTab === 'amigos' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  Amigos
                  {communityTab === 'amigos' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => {
                    standaloneSound.playMove();
                    setCommunityTab('membros');
                  }}
                  className={`pb-2 transition-all relative cursor-pointer ${communityTab === 'membros' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  Membros do Clã
                  {communityTab === 'membros' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                  )}
                </button>
              </div>
            </div>

            {/* Lista de Amigos / Membros */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 z-10" id="community-list-scroller">
              {sortedList.map((item, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                const isBot3 = rank >= 8;
                const isSelf = item.name === 'GABRIEL GS' || item.name === profile.username;

                let rankBadgeClass = 'text-slate-400 bg-slate-900 border-slate-850';
                if (rank === 1)
                  rankBadgeClass =
                    'text-yellow-950 bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(234,179,8,0.4)]';
                else if (rank === 2) rankBadgeClass = 'text-slate-900 bg-slate-300 border-slate-200';
                else if (rank === 3) rankBadgeClass = 'text-amber-900 bg-amber-600 border-amber-500';

                const avatarEmoji = item.avatarEmoji || '👤';
                const flag = item.flag || '🇧🇷';
                const level = item.level || 1;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isSelf
                        ? 'bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-indigo-950/60 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/10'
                        : isTop3
                          ? 'bg-emerald-950/5 border-emerald-900/15 hover:bg-slate-900/30'
                          : isBot3
                            ? 'bg-rose-950/5 border-rose-900/15 hover:bg-slate-900/30'
                            : 'bg-transparent border-transparent hover:bg-slate-900/20'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 font-mono font-black text-xs flex items-center justify-center shrink-0 ${rankBadgeClass}`}
                      >
                        {rank}
                      </div>

                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${item.avatarColor} flex items-center justify-center text-base shrink-0 border border-slate-950/40 shadow-inner relative`}
                      >
                        {avatarEmoji}
                        {item.online && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border border-slate-950 rounded-full animate-pulse" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-black ${isSelf ? 'text-purple-300 font-serif' : 'text-white'
                              }`}
                          >
                            {item.name}
                          </span>
                          <span className="text-xs" title="País">
                            {flag}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                            Nível {level} {isSelf && '• VOCÊ'}
                          </p>
                          {item.clan && (
                            <>
                              <span className="text-[9px] text-slate-600">•</span>
                              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider flex items-center gap-0.5">
                                <Shield size={9} className="text-emerald-500 fill-emerald-500/10" />
                                {item.clan}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                      <span
                        className={`text-xs font-black font-mono tracking-tight ${isSelf ? 'text-purple-400' : 'text-slate-300'
                          }`}
                      >
                        {item.trophies.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botões Inferiores: Adicionar Amigos + Capturar Arena */}
            <div className="flex gap-2.5 mt-2 z-10 shrink-0">
              <button
                onClick={() => {
                  standaloneSound.playMove();
                  setShowAddFriendModal(true);
                }}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md border-b-4 border-emerald-700 active:border-b-0 active:translate-y-[2px]"
              >
                <Plus size={14} />
                Adicione Amigos!
              </button>

              <button
                onClick={handleCameraClick}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md border-b-4 border-indigo-800 active:border-b-0 active:translate-y-[2px]"
                title="Capturar Arena"
              >
                <Camera size={16} />
              </button>
            </div>
          </div>

          {/* MODAL DE ADICIONAR AMIGO */}
          {showAddFriendModal && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-[#181428] border-2 border-indigo-500/40 rounded-3xl p-6 w-full max-w-sm shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <UserPlus size={16} className="text-indigo-400" />
                    Adicionar Amigo
                  </h4>
                  <button
                    onClick={() => {
                      standaloneSound.playMove();
                      setShowAddFriendModal(false);
                    }}
                    className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleAddFriendSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Nome do Jogador
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      required
                      placeholder="Ex: TetrisPro"
                      value={newFriendName}
                      onChange={(e) => setNewFriendName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md border-b-2 border-indigo-800 active:border-b-0 active:translate-y-[1px]"
                  >
                    Confirmar Envio ⚡
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : activeSubTab === 'bate-papo' ? (
        /* ====================================================================
           SUB-ABA 2: GUILDA (Bate-papo do Clã)
           ==================================================================== */
        <div className="flex flex-col gap-4">
          {/* Lista de Mensagens */}
          <div
            ref={chatScrollerRef}
            className="h-[calc(100vh-320px)] sm:h-[calc(100vh-300px)] min-h-[440px] overflow-y-auto space-y-4 px-1 scrollbar-thin scroll-smooth"
            id="clan-chat-scroller"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 max-w-[85%] ${msg.isSelf ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
              >
                <div className="flex items-center gap-1.5 select-none text-[10px] font-bold">
                  <span className={msg.isSelf ? 'text-indigo-400' : 'text-slate-300'}>{msg.sender}</span>
                  <span className="px-1 py-0.2 rounded text-[8px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 font-black">
                    {msg.role}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">({msg.trophies} 🏆)</span>
                </div>

                <div
                  className={`px-3 py-2 rounded-2xl text-xs font-medium ${msg.isSelf
                      ? 'bg-purple-600/20 text-white rounded-tr-none border border-purple-500/30'
                      : 'bg-slate-900 text-slate-200 rounded-tl-none border border-slate-800'
                    }`}
                >
                  {msg.text}
                </div>

                <span className="text-[9px] text-slate-600 select-none font-medium">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Respostas Rápidas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none" id="quick-chat-chips">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-0.5">
              <Smile className="w-3.5 h-3.5 text-indigo-500" /> Rápido:
            </span>
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                onClick={() => handleQuickReplyClick(reply)}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-xs text-slate-300 rounded-full transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input de Envio de Mensagem */}
          <form onSubmit={handleSendSubmit} className="flex gap-2.5">
            <input
              type="text"
              maxLength={60}
              placeholder="Digite sua mensagem para o clã..."
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
              id="clan-chat-input-text-field"
            />
            <button
              type="submit"
              disabled={!typedMessage.trim()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              id="clan-chat-send-submit-btn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* ====================================================================
           SUB-ABA 3: LIGA (Semanal & Mensal)
           ==================================================================== */
        <div className="space-y-4">
          {leagueViewType === 'semanal' ? (
            <>
              {/* CABEÇALHO DA LIGA SEMANAL */}
              <div className="p-4 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/25 rounded-2xl flex flex-col sm:flex-row items-center justify-between select-none gap-3 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent_50%)] pointer-events-none" />

                <div className="flex items-center gap-3">
                  <span className="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    {DIVISION_COLORS[leagueState.division]?.trophy || '🏆'}
                  </span>
                  <div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight font-serif leading-none">
                      Divisão {leagueState.division}
                    </h4>
                    <p className="text-[10px] text-indigo-400 font-bold mt-1.5 uppercase tracking-wider flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      Liga Semanal Ativa
                    </p>
                  </div>
                </div>

                <div className="px-3.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-full flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-black text-indigo-300 font-mono">
                    {leagueState.joined ? `${leagueState.daysRemaining} DIAS` : '1 SEMANA'}
                  </span>
                </div>
              </div>

              {/* CAMINHO DE TROFÉUS SEMANAL */}
              <div className="p-4 bg-slate-950/30 border border-slate-900/60 rounded-2xl select-none">
                <div className="flex items-center justify-between relative px-2">
                  <div className="absolute left-6 right-6 top-1/2 h-[3px] bg-slate-800 -translate-y-1/2 z-0" />

                  {LEAGUE_DIVISIONS.map((div, idx) => {
                    const currentIdx = LEAGUE_DIVISIONS.indexOf(leagueState.division);
                    const isCompleted = idx < currentIdx;
                    const isActive = idx === currentIdx;
                    const isLocked = idx > currentIdx;
                    const colors = DIVISION_COLORS[div];

                    return (
                      <div key={div} className="flex flex-col items-center gap-1.5 relative z-10">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border-2 relative ${isActive
                              ? `${colors.bg} ${colors.border} scale-115 ring-4 ring-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]`
                              : isCompleted
                                ? 'bg-emerald-950/40 border-emerald-500/50'
                                : 'bg-slate-900/80 border-slate-800 text-slate-600'
                            }`}
                        >
                          <span className={`text-lg ${isLocked ? 'grayscale opacity-30' : ''}`}>
                            {colors.trophy}
                          </span>

                          {isCompleted && (
                            <span className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border border-slate-950 text-[8px] text-white font-bold leading-none">
                              ✓
                            </span>
                          )}
                          {isLocked && (
                            <span className="absolute -bottom-1 -right-1 bg-slate-950 border border-slate-800 rounded-full p-0.5 text-slate-500">
                              <Lock size={8} />
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase tracking-wide ${isActive ? colors.text : 'text-slate-500'
                            }`}
                        >
                          {div}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CLASSIFICAÇÃO SEMANAL OU TELA DE ENTRADA */}
              {!leagueState.joined ? (
                <div className="p-6 border border-slate-900 bg-slate-950/20 rounded-[2rem] text-center space-y-5 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-slate-900/60 border-2 border-indigo-500/20 rounded-full shadow-inner">
                    <span className="text-4xl animate-pulse">
                      {DIVISION_COLORS[leagueState.division]?.trophy || '🏆'}
                    </span>
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 border-2 border-slate-950 text-slate-950">
                      <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                  </div>

                  <div className="space-y-1.5 max-w-[280px] mx-auto">
                    <h5 className="text-sm font-black text-white uppercase tracking-wider font-serif">
                      JOGUE E DISPUTE!
                    </h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Jogue e seus pontos ganhos em batalhas somam pontuação para subir posições e chegar ao pódio! Os
                      três primeiros colocados ganham as melhores recompensas.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2 max-w-[240px] mx-auto">
                    <button
                      onClick={handleSimulateMatchXp}
                      className="w-full py-3 rounded-2xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-[0_4px_0_#3730a3] active:translate-y-1 active:shadow-none cursor-pointer"
                    >
                      Simular Partida (+50 XP)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border border-slate-900 bg-slate-950/40 rounded-2xl p-3 space-y-2 select-none overflow-hidden">
                    {(() => {
                      const playerItem: LeagueParticipant = {
                        id: 'player',
                        name: profile.username || 'Você',
                        xp: leagueState.playerXp,
                        flag: '🇧🇷',
                        avatarColor: 'bg-purple-600',
                        avatarEmoji: '👑',
                        isPlayer: true,
                        level: profile.level,
                      };

                      const allParticipants = [playerItem, ...leagueState.opponents].sort((a, b) => b.xp - a.xp);

                      return allParticipants.map((participant, index) => {
                        const rank = index + 1;
                        const isTop3 = rank <= 3;
                        const isBot3 = rank >= 8;
                        const isSelf = participant.isPlayer;

                        let rankBadgeClass = 'text-slate-400 bg-slate-900 border-slate-850';
                        if (rank === 1)
                          rankBadgeClass =
                            'text-yellow-950 bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(234,179,8,0.4)]';
                        else if (rank === 2) rankBadgeClass = 'text-slate-900 bg-slate-300 border-slate-200';
                        else if (rank === 3) rankBadgeClass = 'text-amber-900 bg-amber-600 border-amber-500';

                        return (
                          <React.Fragment key={participant.id}>
                            {rank === 4 && (
                              <div className="py-1 flex items-center gap-2 select-none">
                                <div className="flex-1 h-[1px] bg-emerald-500/20" />
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 leading-none shrink-0">
                                  <ArrowUp className="w-3 h-3 animate-bounce" /> Zona de Promoção (Top 3)
                                </span>
                                <div className="flex-1 h-[1px] bg-emerald-500/20" />
                              </div>
                            )}

                            {rank === 8 && (
                              <div className="py-1 flex items-center gap-2 select-none">
                                <div className="flex-1 h-[1px] bg-rose-500/20" />
                                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1 leading-none shrink-0">
                                  <ArrowDown className="w-3 h-3 animate-bounce" /> Zona de Rebaixamento (Bot 3)
                                </span>
                                <div className="flex-1 h-[1px] bg-rose-500/20" />
                              </div>
                            )}

                            <div
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isSelf
                                  ? 'bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-indigo-950/60 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/10'
                                  : isTop3
                                    ? 'bg-emerald-950/5 border-emerald-900/15 hover:bg-slate-900/30'
                                    : isBot3
                                      ? 'bg-rose-950/5 border-rose-900/15 hover:bg-slate-900/30'
                                      : 'bg-transparent border-transparent hover:bg-slate-900/20'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-6 h-6 rounded-full border-2 font-mono font-black text-xs flex items-center justify-center shrink-0 ${rankBadgeClass}`}
                                >
                                  {rank}
                                </div>

                                <div
                                  className={`w-8 h-8 rounded-full ${participant.avatarColor} flex items-center justify-center text-base shrink-0 border border-slate-950/40 shadow-inner relative`}
                                >
                                  {participant.avatarEmoji}
                                  {isSelf && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border border-slate-950 rounded-full animate-pulse" />
                                  )}
                                </div>

                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-xs font-black ${isSelf ? 'text-purple-300 font-serif' : 'text-white'
                                        }`}
                                    >
                                      {participant.name}
                                    </span>
                                    <span className="text-xs" title="País">
                                      {participant.flag}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono mt-0.5">
                                    Nível {participant.level} {isSelf && '• VOCÊ'}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span
                                  className={`text-xs font-black font-mono tracking-tight ${isSelf ? 'text-purple-400' : 'text-slate-300'
                                    }`}
                                >
                                  {participant.xp} XP
                                </span>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      });
                    })()}
                  </div>

                  {/* Controles de Teste da Liga Semanal */}
                  <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-2xl flex items-center gap-2.5 select-none justify-center">
                    <button
                      onClick={handleSimulateMatchXp}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-black text-[11px] uppercase tracking-wide transition-all cursor-pointer block text-center active:scale-95"
                    >
                      Simular Partida (+XP)
                    </button>
                    <button
                      onClick={handleEndWeek}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600/15 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-black text-[11px] uppercase tracking-wide transition-all cursor-pointer block text-center active:scale-95"
                    >
                      Finalizar Semana 🕒
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* LIGA MENSAL */
            <>
              <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl select-none space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                    CAMINHO DAS LIGAS MENSAL
                  </span>
                  <span className="font-mono text-amber-400">{monthlyLeagueState.daysRemaining} DIAS RESTANTES</span>
                </div>

                <div className="flex items-center justify-between gap-1 bg-slate-900/40 p-2 rounded-xl border border-slate-900/50 relative">
                  {LEAGUE_DIVISIONS.map((div) => {
                    const colors = DIVISION_COLORS[div] || {
                      text: 'text-slate-400',
                      trophy: '🏆',
                      bg: 'bg-slate-900',
                      border: 'border-slate-800',
                    };
                    const currentIdx = LEAGUE_DIVISIONS.indexOf(monthlyLeagueState.division);
                    const divIdx = LEAGUE_DIVISIONS.indexOf(div);

                    const isActive = div === monthlyLeagueState.division;
                    const isCompleted = divIdx < currentIdx;
                    const isLocked = divIdx > currentIdx;

                    return (
                      <div key={div} className="flex flex-col items-center gap-1 z-10">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all relative ${isActive
                              ? `${colors.bg} ${colors.border} ring-2 ring-purple-500/50 scale-110 shadow-lg`
                              : isCompleted
                                ? 'bg-emerald-950/20 border-emerald-500/40'
                                : 'bg-slate-900/80 border-slate-950/80'
                            }`}
                        >
                          <span className={`text-lg ${isLocked ? 'grayscale opacity-30' : ''}`}>
                            {colors.trophy}
                          </span>

                          {isCompleted && (
                            <span className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border border-slate-950 text-[8px] text-white font-bold leading-none">
                              ✓
                            </span>
                          )}
                          {isLocked && (
                            <span className="absolute -bottom-1 -right-1 bg-slate-950 border border-slate-800 rounded-full p-0.5 text-slate-500">
                              <Lock size={8} />
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase tracking-wide ${isActive ? colors.text : 'text-slate-500'
                            }`}
                        >
                          {div}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {!monthlyLeagueState.joined ? (
                <div className="p-6 border border-slate-900 bg-slate-950/20 rounded-[2rem] text-center space-y-5 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-slate-900/60 border-2 border-amber-500/20 rounded-full shadow-inner">
                    <span className="text-4xl animate-pulse">
                      {DIVISION_COLORS[monthlyLeagueState.division]?.trophy || '🏆'}
                    </span>
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 border-2 border-slate-950 text-slate-950">
                      <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                  </div>

                  <div className="space-y-1.5 max-w-[280px] mx-auto">
                    <h5 className="text-sm font-black text-white uppercase tracking-wider font-serif">
                      LIGA MENSAL SUPREMA!
                    </h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Participe automaticamente jogando Tetris! Seus pontos também valem para as ligas mensais. Sem
                      pré-inscrição: basta jogar para competir!
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2 max-w-[240px] mx-auto">
                    <button
                      onClick={handleSimulateMonthlyMatchXp}
                      className="w-full py-3 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-[0_4px_0_#92400e] active:translate-y-1 active:shadow-none cursor-pointer"
                    >
                      Simular Partida Mensal (+50 XP)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border border-slate-900 bg-slate-950/40 rounded-2xl p-3 space-y-2 select-none overflow-hidden">
                    {(() => {
                      const playerItem: LeagueParticipant = {
                        id: 'player',
                        name: profile.username || 'Você',
                        xp: monthlyLeagueState.playerXp,
                        flag: '🇧🇷',
                        avatarColor: 'bg-purple-600',
                        avatarEmoji: '👑',
                        isPlayer: true,
                        level: profile.level,
                      };

                      const allParticipants = [playerItem, ...monthlyLeagueState.opponents].sort(
                        (a, b) => b.xp - a.xp
                      );

                      return allParticipants.map((participant, index) => {
                        const rank = index + 1;
                        const isTop3 = rank <= 3;
                        const isBot3 = rank >= 8;
                        const isSelf = participant.isPlayer;

                        let rankBadgeClass = 'text-slate-400 bg-slate-900 border-slate-850';
                        if (rank === 1)
                          rankBadgeClass =
                            'text-yellow-950 bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(234,179,8,0.4)]';
                        else if (rank === 2) rankBadgeClass = 'text-slate-900 bg-slate-300 border-slate-200';
                        else if (rank === 3) rankBadgeClass = 'text-amber-900 bg-amber-600 border-amber-500';

                        return (
                          <React.Fragment key={participant.id}>
                            {rank === 4 && (
                              <div className="py-1 flex items-center gap-2 select-none">
                                <div className="flex-1 h-[1px] bg-emerald-500/20" />
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 leading-none shrink-0">
                                  <ArrowUp className="w-3 h-3 animate-bounce" /> Zona de Promoção (Top 3)
                                </span>
                                <div className="flex-1 h-[1px] bg-emerald-500/20" />
                              </div>
                            )}

                            {rank === 8 && (
                              <div className="py-1 flex items-center gap-2 select-none">
                                <div className="flex-1 h-[1px] bg-rose-500/20" />
                                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1 leading-none shrink-0">
                                  <ArrowDown className="w-3 h-3 animate-bounce" /> Zona de Rebaixamento (Bot 3)
                                </span>
                                <div className="flex-1 h-[1px] bg-rose-500/20" />
                              </div>
                            )}

                            <div
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isSelf
                                  ? 'bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-indigo-950/60 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/10 scale-[1.02]'
                                  : isTop3
                                    ? 'bg-emerald-950/5 border-emerald-900/15 hover:bg-slate-900/30'
                                    : isBot3
                                      ? 'bg-rose-950/5 border-rose-900/15 hover:bg-slate-900/30'
                                      : 'bg-transparent border-transparent hover:bg-slate-900/20'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-6 h-6 rounded-full border-2 font-mono font-black text-xs flex items-center justify-center shrink-0 ${rankBadgeClass}`}
                                >
                                  {rank}
                                </div>

                                <div
                                  className={`w-8 h-8 rounded-full ${participant.avatarColor} flex items-center justify-center text-base shrink-0 border border-slate-950/40 shadow-inner relative`}
                                >
                                  {participant.avatarEmoji}
                                  {isSelf && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border border-slate-950 rounded-full animate-pulse" />
                                  )}
                                </div>

                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-xs font-black ${isSelf ? 'text-purple-300 font-serif' : 'text-white'
                                        }`}
                                    >
                                      {participant.name}
                                    </span>
                                    <span className="text-xs" title="País">
                                      {participant.flag}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono mt-0.5">
                                    Nível {participant.level} {isSelf && '• VOCÊ'}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span
                                  className={`text-xs font-black font-mono tracking-tight ${isSelf ? 'text-purple-400' : 'text-slate-300'
                                    }`}
                                >
                                  {participant.xp} XP
                                </span>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      });
                    })()}
                  </div>

                  {/* Controles de Teste da Liga Mensal */}
                  <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-2xl flex items-center gap-2.5 select-none justify-center">
                    <button
                      onClick={handleSimulateMonthlyMatchXp}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-black text-[11px] uppercase tracking-wide transition-all cursor-pointer block text-center active:scale-95"
                    >
                      Simular Partida (+XP)
                    </button>
                    <button
                      onClick={handleEndMonth}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600/15 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-black text-[11px] uppercase tracking-wide transition-all cursor-pointer block text-center active:scale-95"
                    >
                      Finalizar Mês 🕒
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Portais de Encerramento da Temporada */}
      {renderSeasonEndPortal()}
      {renderMonthlySeasonEndPortal()}
    </div>
  );
}
