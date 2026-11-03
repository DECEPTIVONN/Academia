/**
 * social-data.ts — Dados de demonstração da aba Social (placeholder)
 *
 * Port do mock `Ligas.html` (raiz do repo) adaptado ao contexto Academia:
 * a estrutura (3 sub-abas Liga/Amigos/Guilda, Caminho das Ligas, ranking,
 * amigos, guilda com chat/membros/doações/guerra) é fiel ao arquivo de
 * referência; os textos específicos do "Tetris Royale" foram renomeados
 * para o vocabulário do app (pedido do usuário em 2026-10-08).
 *
 * Tudo aqui é ESTÁTICO/DEMONSTRATIVO — as funcionalidades reais
 * (convites, doações persistentes, chat online, ranking global) serão
 * implementadas numa fase futura.
 */

export type SocialTab = 'liga' | 'amigos' | 'guilda';
export type GuildTab = 'chat' | 'membros' | 'doacoes' | 'guerra';
export type LeaderboardFilter = 'global' | 'local' | 'amigos';

/** Ícone do passo do Caminho das Ligas (ver social-icons.tsx). */
export type StepIcon = 'crown' | 'gem' | 'box';

export interface TrophyStep {
  id: string;
  trophies: number;
  name: string;
  reward: string;
  icon: StepIcon;
  reached: boolean;
}

/** Mockup: mock TROPHY_STEPS do Ligas.html (ordem decrescente de troféus). */
export const TROPHY_STEPS: TrophyStep[] = [
  {
    id: 'step_6000',
    trophies: 6000,
    name: 'Arena dos Mestres',
    reward: 'Moldura Lendária + 500 Gemas',
    icon: 'crown',
    reached: false,
  },
  {
    id: 'step_5500',
    trophies: 5500,
    name: 'Santuário Diamante III',
    reward: '50 Fragmentos Raros de Treino',
    icon: 'gem',
    reached: false,
  },
  {
    id: 'step_5000',
    trophies: 5000,
    name: 'Santuário Diamante I',
    reward: '10.000 Moedas de Ouro',
    icon: 'gem',
    reached: true,
  },
  {
    id: 'step_4500',
    trophies: 4500,
    name: 'Vale Dourado II',
    reward: 'Baú Mágico de Suplementos',
    icon: 'box',
    reached: true,
  },
  {
    id: 'step_4000',
    trophies: 4000,
    name: 'Vale Dourado I',
    reward: 'Emote Exclusivo de Vitória',
    icon: 'crown',
    reached: true,
  },
];

export interface RankEntry {
  rank: number;
  name: string;
  clan: string;
  trophies: number;
  initials: string;
  isMe?: boolean;
}

/** Mockup: LEADERBOARD_DATA (global / local / amigos). */
export const LEADERBOARD: Record<LeaderboardFilter, RankEntry[]> = {
  global: [
    { rank: 1, name: 'Victor_Aço', clan: 'Academia Prime', trophies: 7450, initials: 'VA' },
    { rank: 2, name: 'Alexandre_BR', clan: 'Academia Masters BR', trophies: 7210, initials: 'AB' },
    { rank: 3, name: 'Dmitri_Força', clan: 'Red Star Lift', trophies: 7080, initials: 'DF' },
    { rank: 4, name: 'Helena_Cardio', clan: 'Nordic Kings', trophies: 6940, initials: 'HC' },
    { rank: 28, name: 'Você', clan: 'Academia Masters BR', trophies: 5420, initials: 'VC', isMe: true },
  ],
  local: [
    { rank: 1, name: 'Alexandre_BR', clan: 'Academia Masters BR', trophies: 7210, initials: 'AB' },
    { rank: 2, name: 'Lucas_PullUp', clan: 'Academia Masters BR', trophies: 5680, initials: 'LP' },
    { rank: 3, name: 'Você', clan: 'Academia Masters BR', trophies: 5420, initials: 'VC', isMe: true },
    { rank: 4, name: 'Beatriz_Squat', clan: 'Academia Masters BR', trophies: 5310, initials: 'BS' },
  ],
  amigos: [
    { rank: 1, name: 'Lucas_PullUp', clan: 'Academia Masters BR', trophies: 5680, initials: 'LP' },
    { rank: 2, name: 'Você', clan: 'Academia Masters BR', trophies: 5420, initials: 'VC', isMe: true },
    { rank: 3, name: 'Beatriz_Squat', clan: 'Academia Masters BR', trophies: 5310, initials: 'BS' },
    { rank: 4, name: 'Renato_Core', clan: 'Amigos BR', trophies: 5100, initials: 'RC' },
  ],
};

export type FriendStatus = 'online' | 'battle' | 'offline';

export interface Friend {
  id: number;
  name: string;
  tag: string;
  trophies: number;
  status: FriendStatus;
  statusText: string;
  initials: string;
}

/** Mockup: STATE.friends. */
export const FRIENDS: Friend[] = [
  { id: 1, name: 'Lucas_PullUp', tag: '#99XQ11', trophies: 5680, status: 'online', statusText: 'Online na academia', initials: 'LP' },
  { id: 2, name: 'Beatriz_Squat', tag: '#77BB44', trophies: 5310, status: 'battle', statusText: 'Em treino 1v1 (A2)', initials: 'BS' },
  { id: 3, name: 'Felipe_Lift', tag: '#22FK99', trophies: 4950, status: 'online', statusText: 'Montando ficha', initials: 'FL' },
  { id: 4, name: 'Carol_Fit', tag: '#44CD88', trophies: 4720, status: 'offline', statusText: 'Vista há 3 horas', initials: 'CF' },
  { id: 5, name: 'Renato_Core', tag: '#11RS33', trophies: 5100, status: 'offline', statusText: 'Visto ontem', initials: 'RC' },
];

export interface GuildMember {
  name: string;
  role: string;
  trophies: number;
  donations: number;
  initials: string;
  isMe?: boolean;
}

/** Mockup: STATE.clanMembers. */
export const GUILD_MEMBERS: GuildMember[] = [
  { name: 'Gabriel_Force', role: 'Líder', trophies: 6420, donations: 680, initials: 'GF' },
  { name: 'Você', role: 'Colíder', trophies: 5420, donations: 450, initials: 'VC', isMe: true },
  { name: 'Lucas_PullUp', role: 'Veterano', trophies: 5680, donations: 390, initials: 'LP' },
  { name: 'Beatriz_Squat', role: 'Veterano', trophies: 5310, donations: 320, initials: 'BS' },
  { name: 'Marcio_Bench', role: 'Membro', trophies: 4890, donations: 190, initials: 'MB' },
];

export interface DonationRequest {
  id: number;
  member: string;
  item: string;
  count: number;
  max: number;
}

/** Mockup: STATE.donations (itens do jogo → suplementos da academia). */
export const DONATIONS: DonationRequest[] = [
  { id: 101, member: 'Marcio_Bench', item: 'Whey Protein (Raro)', count: 2, max: 4 },
  { id: 102, member: 'Beatriz_Squat', item: 'Creatina (Comum)', count: 18, max: 20 },
];

export interface ChatMessage {
  author: string;
  role: string;
  text: string;
  time: string;
  mine?: boolean;
}

/** Mockup: STATE.chatMessages. */
export const CHAT_MESSAGES: ChatMessage[] = [
  { author: 'Gabriel_Force', role: 'Líder', text: 'Galera, não esqueçam de registrar os treinos da Guerra hoje!', time: '14:20' },
  { author: 'Lucas_PullUp', role: 'Veterano', text: 'Acabei de fechar 3 treinos seguidos! Estamos quase ultrapassando a Iron Forge!', time: '14:35' },
  { author: 'Você', role: 'Colíder', text: 'Boa! Vou doar os itens que faltam agora.', time: '14:40', mine: true },
];

export interface RaceRow {
  label: string;
  points: string;
  pct: number;
  mine: boolean;
}

/** Mockup: blocos do "Corrida dos Barcos" (Guerra Semanal da guilda). */
export const RACE_ROWS: RaceRow[] = [
  { label: '1º Academia Masters BR (Sua Equipe)', points: '24.500 / 30.000 pts', pct: 82, mine: true },
  { label: '2º Iron Forge SP', points: '21.800 pts', pct: 72, mine: false },
  { label: '3º Titan Fitness', points: '17.400 pts', pct: 58, mine: false },
];

/** Modal de duelo (mockup: duelModeSelect). */
export const DUEL_MODES = [
  { value: 'classic', label: 'Clássico 1v1 (Melhor de 3)' },
  { value: 'turbo', label: 'Treino Turbo (Intensidade 2x)' },
  { value: 'superset', label: 'Mestre do Superset (Só supersets)' },
];

/** Header da aba (mockup: player-stats-bar) — valores iniciais do estado. */
export const PLAYER_STATS = { trophies: 5420, gold: 14850, xp: 3800 };

/** Sua tag pessoal (mockup: #TETRIS-7749). */
export const PLAYER_TAG = '#ACAD-7749';
