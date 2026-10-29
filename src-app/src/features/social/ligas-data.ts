/**
 * ligas-data.ts — Tipos, lógica de ligas e dados demo do port de `Ligas.tsx`
 *
 * Substitui os emojis de dados (avatar/bandeira/divisão) por chaves de glifo
 * SVG — ver `ligas-icons.tsx` e `Diretrizes/Ícones.md` (sem emoji de UI).
 */

/* ── Tipos ── */

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

export type AvatarGlyphKey =
  | 'crown'
  | 'star'
  | 'flame'
  | 'bolt'
  | 'skull'
  | 'ghost'
  | 'robot'
  | 'rocket'
  | 'paw'
  | 'leaf'
  | 'moon'
  | 'sun'
  | 'shield'
  | 'sword'
  | 'gem'
  | 'wolf'
  | 'frog'
  | 'alien'
  | 'panda'
  | 'lion';

export type FlagKey = 'BR' | 'US' | 'MX' | 'FR' | 'JP' | 'AR' | 'ES' | 'IT' | 'CA' | 'DE' | 'GB' | 'CL';

export interface LeagueParticipant {
  id: string;
  name: string;
  xp: number;
  flag: FlagKey;
  avatarColor: string;
  avatarGlyph: AvatarGlyphKey;
  isPlayer: boolean;
  level: number;
}

export interface LeagueState {
  division: LeagueDivision;
  joined: boolean;
  playerXp: number;
  daysRemaining: number;
  opponents: LeagueParticipant[];
  /** Melhor divisão já alcançada (usado nas ligas do perfil do jogador). */
  bestDivision?: LeagueDivision;
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
  avatarGlyph?: AvatarGlyphKey;
  flag?: FlagKey;
  level?: number;
  /** Código permanente do convite (preenchido nos amigos adicionados por QR/link). */
  friendCode?: string;
  /** Timestamp de quando o amigo foi adicionado por QR/link. */
  addedAt?: number;
  /** Função na guilda (só nas linhas de "Membros da Guilda"). */
  role?: string;
  /** Horas desde o último acesso (0 = agora) — alimenta o popover do jogador. */
  lastSeenHours?: number;
  /** Dias consecutivos de treino (ofensiva) — alimenta o popover do jogador. */
  streak?: number;
}

export type SubTab = 'amigos' | 'bate-papo' | 'guerra-de-clas';

export interface LigasFeatureProps {
  profile?: PlayerProfile;
  messages?: ClanMessage[];
  onSendMessage?: (text: string) => void;
  activeSubTabProp?: SubTab;
  onChangeSubTab?: (tab: SubTab) => void;
  soundEnabled?: boolean;
}

/* ── Divisões (troféus como glifo SVG, não emoji) ── */

export const LEAGUE_DIVISIONS: LeagueDivision[] = ['Bronze', 'Prata', 'Ouro', 'Safira', 'Rubi'];

export type DivisionIconKind = 'trophy-bronze' | 'trophy-silver' | 'trophy-gold' | 'gem-cyan' | 'gem-rose';

export const DIVISION_COLORS: Record<
  LeagueDivision,
  { bg: string; text: string; border: string; icon: DivisionIconKind; iconClass: string }
> = {
  Bronze: {
    bg: 'bg-amber-850',
    text: 'text-amber-400',
    border: 'border-amber-800',
    icon: 'trophy-bronze',
    iconClass: 'text-amber-600',
  },
  Prata: {
    bg: 'bg-slate-400/20',
    text: 'text-slate-300',
    border: 'border-slate-400/30',
    icon: 'trophy-silver',
    iconClass: 'text-slate-300',
  },
  Ouro: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    icon: 'trophy-gold',
    iconClass: 'text-yellow-400',
  },
  Safira: {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    icon: 'gem-cyan',
    iconClass: 'text-cyan-400',
  },
  Rubi: {
    bg: 'bg-rose-500/20',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    icon: 'gem-rose',
    iconClass: 'text-rose-400',
  },
};

/* ── Áudio sintetizado (zero dependências) ── */

class StandaloneSoundEffects {
  private audioCtx: AudioContext | null = null;
  public enabled = true;

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
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
      /* navegador pode bloquear áudio sem interação */
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
      /* noop */
    }
  }

  public playLevelUp() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
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
      /* noop */
    }
  }
}

export const standaloneSound = new StandaloneSoundEffects();

/* ── Persistência e simulação de ligas ── */

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
    if (data) return JSON.parse(data) as LeagueState;
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
    if (data) return JSON.parse(data) as LeagueState;
  } catch (e) {
    console.error('Erro ao carregar estado da liga mensal:', e);
  }
  return DEFAULT_MONTHLY_LEAGUE_STATE;
}

export function saveMonthlyLeagueState(state: LeagueState): void {
  if (typeof window === 'undefined') return;
  /* `bestDivision` guarda a melhor liga mensal alcançada (perfil do jogador). */
  const reached = [state.bestDivision, state.division, state.lastResult?.newDivision];
  const bestDivision = reached.reduce<LeagueDivision>(
    (best, item) =>
      item && LEAGUE_DIVISIONS.indexOf(item) > LEAGUE_DIVISIONS.indexOf(best) ? item : best,
    'Bronze',
  );
  const next: LeagueState = { ...state, bestDivision };
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_MONTHLY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('tetris-clash-monthly-league-update', { detail: next }));
  } catch (e) {
    console.error('Erro ao salvar estado da liga mensal:', e);
  }
}

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

const COUNTRY_FLAGS: FlagKey[] = ['BR', 'US', 'MX', 'FR', 'JP', 'AR', 'ES', 'IT', 'CA', 'DE', 'GB', 'CL'];

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

const AVATAR_GLYPHS: AvatarGlyphKey[] = [
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
    while (usedNames.has(name)) name = getRandomItem(NPC_NAMES);
    usedNames.add(name);
    opponents.push({
      id: `npc-${i}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      xp: Math.floor(Math.random() * (maxXp - minXp) + minXp),
      flag: getRandomItem(COUNTRY_FLAGS),
      avatarColor: getRandomItem(AVATAR_COLORS),
      avatarGlyph: getRandomItem(AVATAR_GLYPHS),
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
  const numPlaying = Math.floor(Math.random() * 3) + 2;
  const nextOpponents = [...opponents];
  let maxGain = 30;
  if (division === 'Prata') maxGain = 50;
  else if (division === 'Ouro') maxGain = 80;
  else if (division === 'Safira') maxGain = 120;
  else if (division === 'Rubi') maxGain = 180;

  for (let k = 0; k < numPlaying; k++) {
    const idx = Math.floor(Math.random() * nextOpponents.length);
    const gain = Math.floor(Math.random() * (maxGain - 10) + 10);
    nextOpponents[idx] = { ...nextOpponents[idx], xp: nextOpponents[idx].xp + gain };
  }
  return nextOpponents;
}

export function addPlayerMonthlyLeagueXp(amount: number): LeagueState {
  const state = getMonthlyLeagueState();
  let updatedState: LeagueState;
  if (!state.joined) {
    updatedState = {
      ...state,
      joined: true,
      playerXp: amount,
      opponents: generateOpponents(state.division),
      daysRemaining: 27,
    };
  } else {
    updatedState = {
      ...state,
      playerXp: state.playerXp + amount,
      opponents: simulateOpponentActivity(state.opponents, state.division),
    };
  }
  saveMonthlyLeagueState(updatedState);
  return updatedState;
}

export function addPlayerLeagueXp(amount: number): LeagueState {
  const state = getLeagueState();
  let updatedState: LeagueState;
  if (!state.joined) {
    updatedState = {
      ...state,
      joined: true,
      playerXp: amount,
      opponents: generateOpponents(state.division),
      daysRemaining: Math.random() > 0.5 ? 6 : 5,
    };
  } else {
    updatedState = {
      ...state,
      playerXp: state.playerXp + amount,
      opponents: simulateOpponentActivity(state.opponents, state.division),
    };
  }
  saveLeagueState(updatedState);
  addPlayerMonthlyLeagueXp(amount);
  return updatedState;
}

/* ── Dados de demonstração ── */

export const DEFAULT_PROFILE: PlayerProfile = {
  username: 'GABRIEL GS',
  clanName: 'Great Warriors',
  trophies: 12710,
  gold: 5800,
  gems: 150,
  xp: 350,
  level: 15,
};

export const INITIAL_FRIENDS: FriendItem[] = [
  { id: '1', name: 'GABRIEL GS', trophies: 12710, clan: null, online: true, avatarColor: 'from-emerald-500 to-teal-700', avatarInitial: 'G', rank: 1, avatarGlyph: 'crown', flag: 'BR', level: 15 },
  { id: '2', name: 'Basti', trophies: 10851, clan: null, online: false, avatarColor: 'from-blue-500 to-indigo-700', avatarInitial: 'B', rank: 2, avatarGlyph: 'wolf', flag: 'DE', level: 12 },
  { id: '3', name: 'leventopsalis', trophies: 9185, clan: null, online: true, avatarColor: 'from-amber-500 to-orange-700', avatarInitial: 'L', rank: 3, avatarGlyph: 'frog', flag: 'GB', level: 10 },
  { id: '4', name: 'jooo_vitalc', trophies: 9177, clan: 'milicas', online: false, avatarColor: 'from-rose-500 to-pink-700', avatarInitial: 'J', rank: 4, avatarGlyph: 'alien', flag: 'BR', level: 9 },
  { id: '5', name: 'Douvis', trophies: 8601, clan: 'milicas', online: true, avatarColor: 'from-violet-500 to-fuchsia-700', avatarInitial: 'D', rank: 5, avatarGlyph: 'panda', flag: 'CL', level: 8 },
];

export const INITIAL_MEMBERS: FriendItem[] = [
  { id: 'm1', name: 'zTetrisGod', trophies: 13400, clan: 'Great Warriors', online: true, avatarColor: 'from-purple-500 to-indigo-700', avatarInitial: 'Z', rank: 1, avatarGlyph: 'alien', flag: 'US', level: 18 },
  { id: 'm2', name: 'GABRIEL GS', trophies: 12710, clan: 'Great Warriors', online: true, avatarColor: 'from-emerald-500 to-teal-700', avatarInitial: 'G', rank: 2, avatarGlyph: 'crown', flag: 'BR', level: 15 },
  { id: 'm3', name: 'Basti', trophies: 10851, clan: 'Great Warriors', online: false, avatarColor: 'from-blue-500 to-indigo-700', avatarInitial: 'B', rank: 3, avatarGlyph: 'wolf', flag: 'DE', level: 12 },
  { id: 'm4', name: 'ClashMaster', trophies: 9420, clan: 'Great Warriors', online: false, avatarColor: 'from-yellow-500 to-amber-700', avatarInitial: 'C', rank: 4, avatarGlyph: 'lion', flag: 'CA', level: 11 },
  { id: 'm5', name: 'Douvis', trophies: 8601, clan: 'Great Warriors', online: true, avatarColor: 'from-violet-500 to-fuchsia-700', avatarInitial: 'D', rank: 5, avatarGlyph: 'panda', flag: 'CL', level: 8 },
];

export const INITIAL_CLAN_MESSAGES: ClanMessage[] = [
  { id: 'msg1', sender: 'Jhow Maquem', role: 'Co-líder', trophies: 14000, text: 'Galera, a guerra de clãs termina em 3 horas! Quem ainda tem partidas pendentes, joguem logo!', time: '12:44' },
  { id: 'msg2', sender: 'ZEUS', role: 'Ancião', trophies: 11644, text: 'Peguei nível 11 no Baralho "I"! O multiplicador de pontos subiu pra x122%, tá sensacional.', time: '12:47' },
  { id: 'msg3', sender: 'Murilo', role: 'Membro', trophies: 11489, text: 'Quase bati meu recorde de 15.000 pontuações ontem! Caiu o bloco red Z na hora errada haha', time: '12:50' },
  { id: 'msg4', sender: 'Lucas H.', role: 'Líder', trophies: 14000, text: 'Mandei ver! Fiz mais de 10.000 pontos no modo turbo e contribuí com troféus para o clã.', time: '13:01' },
];

export const QUICK_REPLIES = [
  'Boa jogada!',
  'Tetris na lata!',
  'Modo Turbo é insano!',
  'Bati meu recorde!',
  'Que sorte grande!',
];

export function buildPlayerParticipant(profile: PlayerProfile, xp: number): LeagueParticipant {
  return {
    id: 'player',
    name: profile.username || 'Você',
    xp,
    flag: 'BR',
    avatarColor: 'bg-purple-600',
    avatarGlyph: 'crown',
    isPlayer: true,
    level: profile.level,
  };
}

export function computeSeasonOutcome(
  state: LeagueState,
  profile: PlayerProfile
): LeagueState['lastResult'] {
  const playerItem = buildPlayerParticipant(profile, state.playerXp);
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

  return { type, oldDivision: state.division, newDivision, rank, participants: allParticipants };
}
