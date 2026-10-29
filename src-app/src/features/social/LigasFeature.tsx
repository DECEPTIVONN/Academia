/**
 * LigasFeature.tsx — aba SOCIAL com conteúdo de `Ligas.tsx` (Amigos/Guilda/Liga)
 *
 * Port completo do mock standalone, adaptado ao app:
 *  - Background: superfícies glass translúcidas (cr-bg-container continua
 *    visível atrás — nada opaco);
 *  - Tipografia: Rajdhani + tokens var(*) (sem @import de fontes);
 *  - Ícones de dados (avatar/bandeira/divisão): SVG stroke
 *    (ligas-icons.tsx), nunca emoji;
 *  - UI: lucide-react (Send, Shield, Trophy…);
 *  - Liga semanal/mensal com localStorage + portais de fim de temporada.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  MessageSquare,
  Shield,
  Trophy,
  Plus,
  ArrowUpDown,
  SlidersHorizontal,
  Camera,
  X,
  Swords,
  Calendar,
  ArrowUp,
  ArrowDown,
  Lock,
  Share2,
  Clock,
  Rocket,
  Users,
  ChevronRight,
} from 'lucide-react';
import {
  AvatarGlyph,
  DivisionIcon,
  FlagIcon,
} from './ligas-icons';
/* v4.14.0 — folha de compartilhamento nativa do SO (Web Share API) */
import { shareNative } from '@/lib/native-share';
import { showToast } from '@/lib/toast';
import {
  addPlayerLeagueXp,
  addPlayerMonthlyLeagueXp,
  buildPlayerParticipant,
  computeSeasonOutcome,
  DEFAULT_PROFILE,
  DIVISION_COLORS,
  getLeagueState,
  getMonthlyLeagueState,
  INITIAL_CLAN_MESSAGES,
  INITIAL_FRIENDS,
  LEAGUE_DIVISIONS,
  saveLeagueState,
  saveMonthlyLeagueState,
  standaloneSound,
  type ClanMessage,
  type FriendItem,
  type LeagueDivision,
  type LeagueParticipant,
  type LeagueState,
  type LigasFeatureProps,
  type SubTab,
} from './ligas-data';
import { IDENTITY_EMBLEMS } from '@/features/profile/profile-data';
import { useAuth } from '@/core/auth/use-auth';
import { useProfileState } from '@/features/profile/useProfileState';
import { FriendQrModal } from './FriendQrModal';
import { QrScannerModal } from './QrScannerModal';
import { GuildEmblem, GuildPanel } from './GuildPanel';
import { MemberPopover } from './MemberPopover';
import { getGuild, useGuildState, type GuildPlayer } from './guild-data';
import { getLevel, getXp } from '@/core/db/queries';
import { useLocalData } from '@/hooks/useLocalData';
import {
  fallbackLastSeenHours,
  fallbackStreak,
  type PlayerKind,
  type PlayerSummaryInput,
} from './player-profile-data';
import {
  acceptFriendInvite,
  buildFriendInviteUrl,
  clearFriendInviteFromUrl,
  getFriendCode,
  loadAddedFriends,
  mergeFriends,
  readFriendInviteFromUrl,
  type FriendInvite,
} from './friend-invites';
import './social.css';

/* Emblema de identificação "Prestígio 1" (mesmo formato do emblema de
   maestria — escudo clip-path) usado como símbolo do clã e avatar. */
const PRESTIGIO_1 = IDENTITY_EMBLEMS.find((e) => e.id === 'prestigio-1');

/* ── LeagueCup (SVG 5-lobed, portado fiel) ── */

interface LeagueCupProps {
  division: LeagueDivision | 'Locked';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  active?: boolean;
}

function LeagueCup({ division, size = 'md', active = false }: LeagueCupProps) {
  const widthHeight = { sm: 56, md: 100, lg: 130, xl: 180 }[size];

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

  const idPrefix = `ligas-${division.toLowerCase()}-${size}`;

  return (
    <div className="relative flex items-center justify-center transition-all duration-300">
      <svg
        width={widthHeight}
        height={widthHeight}
        viewBox="0 0 100 100"
        className={`filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] ${active ? 'animate-bounce' : 'scale-95 opacity-70'}`}
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
        <path d="M 22 32 C 10 26 10 46 22 48 Z" fill={`url(#${idPrefix}-wing)`} />
        <path d="M 78 32 C 90 26 90 46 78 48 Z" fill={`url(#${idPrefix}-wing)`} />
        <ellipse cx="50" cy="85" rx="28" ry="8" fill={`url(#${idPrefix}-base)`} />
        <ellipse cx="50" cy="80" rx="22" ry="5" fill={`url(#${idPrefix}-bowl)`} />
        <path d="M 45 80 Q 50 72 50 64 Q 50 72 55 80 Z" fill={`url(#${idPrefix}-base)`} />
        <circle cx="50" cy="65" r="7" fill={`url(#${idPrefix}-gem)`} />
        <path
          d="M 50 62 C 32 58 20 45 20 30 C 20 18 30 18 35 25 C 40 15 48 15 50 25 C 52 15 60 15 65 25 C 70 18 80 18 80 30 C 80 45 68 58 50 62 Z"
          fill={`url(#${idPrefix}-bowl)`}
        />
        <path
          d="M 50 56 C 36 52 26 42 26 31 C 26 23 32 23 36 28 C 40 20 47 20 50 28 C 53 20 60 20 64 28 C 68 23 74 23 74 31 C 74 42 64 52 50 56 Z"
          fill={`url(#${idPrefix}-gem)`}
          opacity="0.85"
        />
        <path d="M 24 30 Q 30 25 34 28 Q 28 36 24 30 Z" fill="#ffffff" opacity="0.3" />
        {spec.hasLock && (
          <g transform="translate(42, 33)">
            <path d="M 4 8 A 4 4 0 0 1 12 8 L 12 12 L 4 12 Z" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
            <rect x="2" y="10" width="12" height="10" rx="2" fill="#64748b" />
            <circle cx="8" cy="14" r="1.5" fill="#1e293b" />
            <path d="M 7.5 15 L 8.5 15 L 9 18 L 7 18 Z" fill="#1e293b" />
          </g>
        )}
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

/* ── Helper de ranking (badge de posição) ── */

function formatNow(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) return 'text-yellow-950 bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(234,179,8,0.4)]';
  if (rank === 2) return 'text-slate-900 bg-slate-300 border-slate-200';
  if (rank === 3) return 'text-amber-900 bg-amber-600 border-amber-500';
  return 'text-slate-400 bg-slate-900 border-slate-700';
}

function rowTone(isSelf: boolean, isTop3: boolean, isBot3: boolean): string {
  if (isSelf)
    return 'ligas-self-row bg-gradient-to-r from-[rgba(var(--primary-rgb,139,92,246),0.35)] via-slate-900/90 to-[rgba(var(--primary-rgb,139,92,246),0.2)] ligas-border-accent-strong ligas-glow ring-1 ring-[rgba(var(--primary-rgb,139,92,246),0.12)]';
  if (isTop3) return 'bg-emerald-950/5 border-emerald-900/15 hover:bg-slate-900/30';
  if (isBot3) return 'bg-rose-950/5 border-rose-900/15 hover:bg-slate-900/30';
  return 'bg-transparent border-transparent hover:bg-slate-900/20';
}

/* ── Linha de participante (Amigos, Liga, Portais) ── */

function ParticipantRow({
  item,
  rank,
  showXpLabel = false,
  scaleSelf = false,
}: {
  item: LeagueParticipant;
  rank: number;
  showXpLabel?: boolean;
  scaleSelf?: boolean;
}) {
  const isTop3 = rank <= 3;
  const isBot3 = rank >= 8;
  const isSelf = item.isPlayer;
  const glyph = item.avatarGlyph || 'crown';
  const flag = item.flag || 'BR';
  const level = item.level || 1;

  return (
    <div
      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${rowTone(isSelf, isTop3, isBot3)} ${isSelf && scaleSelf ? 'scale-[1.02]' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-6 h-6 rounded-full border-2 font-mono font-black text-xs flex items-center justify-center shrink-0 ${rankBadgeClass(rank)}`}
        >
          {rank}
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-950/40 shadow-inner relative overflow-hidden bg-slate-900"
        >
          {PRESTIGIO_1?.type === 'image' && PRESTIGIO_1.url ? (
            <img src={PRESTIGIO_1.url} alt={PRESTIGIO_1.nome} className="w-full h-full object-cover" />
          ) : (
            <AvatarGlyph glyph={glyph} size={16} className="text-white" />
          )}
          {isSelf && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border border-slate-950 rounded-full animate-pulse" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-black ${isSelf ? 'ligas-text-accent' : 'text-white'}`}>{item.name}</span>
            <span title="País">
              <FlagIcon flag={flag} size={12} className="text-slate-400" />
            </span>
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono mt-0.5">
            Nível {level} {isSelf && '• VOCÊ'}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span
          className={`text-xs font-black font-mono tracking-tight ${isSelf ? 'ligas-text-accent' : 'text-slate-300'}`}
        >
          {showXpLabel ? `${item.xp} XP` : item.xp}
        </span>
      </div>
    </div>
  );
}

/* ── Separador zona promoção/rebaixamento ── */

function ZoneSeparator({ kind }: { kind: 'up' | 'down' }) {
  const up = kind === 'up';
  return (
    <div className="py-1 flex items-center gap-2 select-none">
      <div className={`flex-1 h-[1px] ${up ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`} />
      <span
        className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 leading-none shrink-0 ${up ? 'text-emerald-400' : 'text-rose-400'}`}
      >
        {up ? <ArrowUp className="w-3 h-3 animate-bounce" /> : <ArrowDown className="w-3 h-3 animate-bounce" />}
        {up ? 'Zona de Promoção (Top 3)' : 'Zona de Rebaixamento (Bot 3)'}
      </span>
      <div className={`flex-1 h-[1px] ${up ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`} />
    </div>
  );
}

/* ── Caminho de divisões (Semanal / Mensal) ── */

function DivisionPath({
  currentDivision,
  variant,
}: {
  currentDivision: LeagueDivision;
  variant: 'weekly' | 'monthly';
}) {
  return (
    <div
      className={`p-4 rounded-2xl select-none ${variant === 'weekly' ? 'bg-slate-950/30 border border-slate-900/60' : 'bg-slate-950/60 border border-slate-900'}`}
    >
      {variant === 'monthly' && (
        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
          <span className="flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            CAMINHO DAS LIGAS MENSAL
          </span>
          <span className="font-mono text-amber-400">27 DIAS RESTANTES</span>
        </div>
      )}
      <div
        className={
          variant === 'weekly'
            ? 'flex items-center justify-between relative px-2'
            : 'flex items-center justify-between gap-1 bg-slate-900/40 p-2 rounded-xl border border-slate-900/50 relative'
        }
      >
        {variant === 'weekly' && (
          <div className="absolute left-6 right-6 top-1/2 h-[3px] bg-slate-800 -translate-y-1/2 z-0" />
        )}
        {LEAGUE_DIVISIONS.map((div) => {
          const colors = DIVISION_COLORS[div];
          const currentIdx = LEAGUE_DIVISIONS.indexOf(currentDivision);
          const divIdx = LEAGUE_DIVISIONS.indexOf(div);
          const isActive = div === currentDivision;
          const isCompleted = divIdx < currentIdx;
          const isLocked = divIdx > currentIdx;
          const sizeCls = variant === 'weekly' ? 'w-11 h-11' : 'w-10 h-10';
          const activeRing =
            variant === 'weekly'
              ? 'scale-115 ring-4 ring-[rgba(var(--primary-rgb,139,92,246),0.25)] ligas-glow-strong'
              : 'ring-2 ring-[rgba(var(--primary-rgb,139,92,246),0.5)] scale-110 shadow-lg';
          const activeBorder = variant === 'weekly' ? 'border-[rgba(var(--primary-rgb,139,92,246),0.45)]' : '';

          return (
            <div key={div} className="flex flex-col items-center gap-1.5 relative z-10">
              <div
                className={`${sizeCls} rounded-full flex items-center justify-center transition-all duration-300 border-2 relative ${isActive ? `${colors.bg} ${colors.border} ${activeRing} ${activeBorder}` : isCompleted ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-slate-900/80 border-slate-800 text-slate-600'}`}
              >
                <span className={isLocked ? 'grayscale opacity-30' : ''}>
                  <DivisionIcon kind={colors.icon} size={18} />
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
              <span className={`text-[9px] font-black uppercase tracking-wide ${isActive ? colors.text : 'text-slate-500'}`}>
                {div}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Tela de entrada (não inscrito) ── */

function JoinPrompt({
  division,
  title,
  desc,
  ctaLabel,
  onCta,
  accent,
}: {
  division: LeagueDivision;
  title: string;
  desc: string;
  ctaLabel: string;
  onCta: () => void;
  accent: 'indigo' | 'amber';
}) {
  const colors = DIVISION_COLORS[division];
  const btn =
    accent === 'amber'
      ? 'from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_4px_0_#92400e]'
      : 'ligas-btn-primary';
  const ring = accent === 'amber' ? 'border-amber-500/20' : 'ligas-border-accent';
  const glow = accent === 'amber' ? 'from-amber-500/5' : 'from-[rgba(var(--primary-rgb,139,92,246),0.06)]';

  return (
    <div className="p-6 border border-slate-900 bg-slate-950/20 rounded-[2rem] text-center space-y-5 shadow-2xl relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${glow} to-transparent pointer-events-none`} />
      <div className={`relative w-20 h-20 mx-auto flex items-center justify-center bg-slate-900/60 border-2 ${ring} rounded-full shadow-inner`}>
        <span className="animate-pulse">
          <DivisionIcon kind={colors.icon} size={36} />
        </span>
        <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 border-2 border-slate-950 text-slate-950">
          <Plus className="w-3.5 h-3.5 stroke-[3px]" />
        </div>
      </div>
      <div className="space-y-1.5 max-w-[280px] mx-auto">
        <h5 className="text-sm font-black text-white uppercase tracking-wider">{title}</h5>
        <p className="text-[11px] text-slate-400 leading-relaxed">{desc}</p>
      </div>
      <div className="pt-2 flex flex-col gap-2 max-w-[240px] mx-auto">
        <button
          onClick={onCta}
          className={`w-full py-3 rounded-2xl bg-gradient-to-b ${btn} font-black text-xs uppercase tracking-wider transition-all active:translate-y-1 active:shadow-none cursor-pointer`}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

/* ── Controles de teste da liga ── */

function LeagueTestControls({
  onSimulate,
  onEnd,
  endLabel,
}: {
  onSimulate: () => void;
  onEnd: () => void;
  endLabel: string;
}) {
  return (
    <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-2xl flex items-center gap-2.5 select-none justify-center">
      <button
        onClick={onSimulate}
        className="flex-1 py-2.5 rounded-xl ligas-bg-soft-strong border border-[rgba(var(--primary-rgb,139,92,246),0.3)] ligas-text-accent font-black text-[11px] uppercase tracking-wide transition-all cursor-pointer block text-center active:scale-95"
      >
        Simular Partida (+XP)
      </button>
      <button
        onClick={onEnd}
        className="flex-1 py-2.5 rounded-xl bg-rose-600/15 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-black text-[11px] uppercase tracking-wide transition-all cursor-pointer block text-center active:scale-95 flex items-center justify-center gap-1"
      >
        <Clock size={12} />
        {endLabel}
      </button>
    </div>
  );
}

/* ── Classificação da liga (lista de participantes) ── */

function LeagueStandings({
  playerXp,
  opponents,
  profile,
  scaleSelf,
}: {
  playerXp: number;
  opponents: LeagueParticipant[];
  profile: { username: string; level: number };
  scaleSelf?: boolean;
}) {
  const playerItem = buildPlayerParticipant(
    { ...DEFAULT_PROFILE, username: profile.username, level: profile.level },
    playerXp
  );
  const all = [playerItem, ...opponents].sort((a, b) => b.xp - a.xp);

  return (
    <div className="border border-slate-900 bg-slate-950/40 rounded-2xl p-3 space-y-2 select-none overflow-hidden">
      {all.map((participant, index) => {
        const rank = index + 1;
        return (
          <React.Fragment key={participant.id}>
            {rank === 4 && <ZoneSeparator kind="up" />}
            {rank === 8 && <ZoneSeparator kind="down" />}
            <ParticipantRow item={participant} rank={rank} showXpLabel scaleSelf={scaleSelf} />
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── Portais de fim de temporada ── */

function SeasonEndPortal({
  result,
  step,
  onNext,
  onClear,
  monthly,
}: {
  result: NonNullable<LeagueState['lastResult']>;
  step: number;
  onNext: () => void;
  onClear: () => void;
  monthly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { oldDivision, newDivision, type, rank, participants = [] } = result;
  const oldIdx = LEAGUE_DIVISIONS.indexOf(oldDivision);
  const prevDiv = oldIdx > 0 ? LEAGUE_DIVISIONS[oldIdx - 1] : null;
  const newIdx = LEAGUE_DIVISIONS.indexOf(newDivision);
  const newPrevDiv = newIdx > 0 ? LEAGUE_DIVISIONS[newIdx - 1] : null;

  const handleShare = () => {
    standaloneSound.playLevelUp();
    const shareText = monthly
      ? `Subi para a Divisão ${newDivision} Mensal no EVO FIT! Meu brilho ofusca tudo e todos!`
      : `Subi para a Divisão ${newDivision} no EVO FIT! Meu brilho ofusca tudo e todos!`;
    /* v4.14.0 — HTTPS (Vercel) habilita a Web Share API: abre a folha
       NATIVA do Android/Windows/iOS com o link do app. Sem suporte ou
       cancelada → clipboard + feedback como antes. */
    void (async () => {
      const r = await shareNative({ text: shareText, url: window.location.origin });
      if (r === 'shared' || r === 'cancelled') return;
      navigator.clipboard.writeText(shareText).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    })();
  };

  if (step === 3) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-[rgba(10,5,20,0.92)] backdrop-blur-sm p-6 text-white flex flex-col justify-between overflow-hidden select-none shadow-2xl overflow-y-auto animate-fade-in">
        <div
          className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none"
          style={{ clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none animate-pulse" />
        <button
          onClick={onClear}
          className="absolute top-6 left-6 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer z-20"
        >
          <X size={22} />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 pt-12 relative z-10 max-w-md mx-auto w-full">
          <div className="relative scale-110 drop-shadow-[0_0_20px_rgba(245,158,11,0.35)]">
            <LeagueCup division={newDivision} size="xl" active />
          </div>
          <div className="space-y-4 px-4 max-w-[320px]">
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight uppercase">
              Você subiu para a{' '}
              <span className="text-amber-400 underline decoration-wavy underline-offset-4">Divisão {newDivision}</span>!
            </h2>
            <p className="text-sm text-slate-300 font-medium max-w-[280px] mx-auto leading-relaxed">
              Seu brilho ofusca tudo e todos! Parabéns pela sua dedicação nas arenas!
            </p>
          </div>
        </div>
        <div className="space-y-4 relative z-10 w-full max-w-[320px] mx-auto pt-6 pb-4">
          <button
            onClick={handleShare}
            className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider transition-all duration-150 rounded-2xl shadow-[0_4px_0_#b45309] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            <Share2 size={16} className="text-slate-950" />
            Compartilhar Recompensa
          </button>
          <button
            onClick={onClear}
            className="w-full py-3 text-slate-400 hover:text-white font-black text-xs uppercase tracking-wider transition-all text-center cursor-pointer select-none flex items-center justify-center gap-1"
          >
            <Rocket size={14} />
            {monthly ? 'Começar Novo Mês' : 'Começar Nova Semana'}
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
              <span>Copiado para a área de transferência!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[rgba(10,5,20,0.92)] backdrop-blur-sm p-6 text-white flex flex-col justify-between overflow-hidden select-none shadow-2xl animate-fade-in overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(var(--primary-rgb,139,92,246),0.12)] via-transparent to-slate-950/90 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb,139,92,246),0.06),transparent_80%)] pointer-events-none" />

      {step === 1 && (
        <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full py-4 relative z-10">
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 py-4">
              <LeagueCup division={prevDiv || 'Locked'} size="sm" />
              <div className="scale-125 transition-transform duration-500">
                <LeagueCup division={oldDivision} size="lg" active />
              </div>
              <LeagueCup division="Locked" size="sm" />
            </div>
            <div className="text-center px-4 space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full select-none">
                <span className="inline-block w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none">
                  {monthly ? 'Temporada Mensal Encerrada' : 'Temporada Encerrada'}
                </span>
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
                Você ficou em <span className="text-yellow-400 font-black text-3xl">{rank}º</span> Lugar
              </h3>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Placar Final {monthly ? 'Mensal - ' : ''}Divisão {oldDivision}
              </p>
            </div>
            <div className="border border-[rgba(var(--primary-rgb,139,92,246),0.25)] bg-slate-950/45 rounded-3xl p-3.5 max-h-[calc(100vh-420px)] overflow-y-auto space-y-2 shadow-xl">
              {participants.length > 0 ? (
                participants.map((item, index) => {
                  const rankNum = index + 1;
                  return (
                    <React.Fragment key={item.id}>
                      <ParticipantRow item={item} rank={rankNum} showXpLabel scaleSelf />
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
              onClick={onNext}
              className="w-full py-4 ligas-btn-primary font-black text-xs uppercase tracking-wider transition-all duration-150 rounded-2xl active:translate-y-[2px] active:shadow-none cursor-pointer block text-center select-none"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full py-4 relative z-10">
          <div className="space-y-8 flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="flex items-center justify-center gap-2 py-4">
              <LeagueCup division={newPrevDiv || 'Locked'} size="sm" />
              <div className="scale-[1.3] transition-transform duration-500 relative">
                <LeagueCup division={newDivision} size="lg" active />
              </div>
              <LeagueCup division="Locked" size="sm" />
            </div>
            <div className="space-y-4 px-4 max-w-[320px] mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 ligas-bg-soft border border-[rgba(var(--primary-rgb,139,92,246),0.2)] rounded-full mb-2">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[9px] font-black ligas-text-accent uppercase tracking-widest leading-none">
                  {monthly ? 'Novo Mês Ativo' : 'Nova Semana Ativa'}
                </span>
              </div>
              <h3 className="text-xl font-black text-white leading-relaxed uppercase tracking-wide">
                {type === 'promotion' ? (
                  <>
                    Você vai competir na{' '}
                    <span className="text-yellow-400 underline decoration-[var(--primary)]">Divisão {newDivision}</span>{' '}
                    {monthly ? 'este mês' : 'essa semana'}!
                  </>
                ) : type === 'demotion' ? (
                  <>
                    Você vai competir na <span className="text-rose-400 underline">Divisão {newDivision}</span>{' '}
                    {monthly ? 'este mês' : 'essa semana'}.
                  </>
                ) : (
                  <>
                    Você vai competir na{' '}
                    <span className="text-slate-300 underline decoration-sky-500">Divisão {newDivision}</span> de novo{' '}
                    {monthly ? 'este mês' : 'essa semana'}!
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold uppercase tracking-widest px-2">
                {type === 'promotion'
                  ? 'Subiu de liga! Continue mandando bala nas arenas para alcançar o topo!'
                  : type === 'demotion'
                    ? 'Não desanime! Com batalhas dedicadas você vai reaver o seu lugar!'
                    : 'A batalha continua acirrada! Faça mais partidas para subir de nível!'}
              </p>
            </div>
          </div>
          <div className="pt-8 w-full">
            <button
              onClick={onNext}
              className="w-full py-4 ligas-btn-primary font-black text-xs uppercase tracking-wider transition-all duration-150 rounded-2xl active:translate-y-[2px] active:shadow-none cursor-pointer block text-center select-none"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

/* ── Menu de filtros (popover) ── */

function FilterMenu({
  sortBy,
  onSort,
  onClose,
}: {
  sortBy: string;
  onSort: (s: 'posicao' | 'trofeus' | 'nome') => void;
  onClose: () => void;
}) {
  const renderBtn = (
    label: string,
    active: boolean,
    onClick: () => void,
    theme: 'blue' | 'gold' | 'purple'
  ) => {
    let bg = '';
    if (active) {
      if (theme === 'blue') bg = 'ligas-filter-active';
      else if (theme === 'gold') bg = 'from-amber-400 to-amber-500 shadow-[0_4px_0_#b45309]';
      else bg = 'from-slate-700 to-slate-800 shadow-[0_4px_0_#1e293b] border-slate-800';
    } else {
      bg = 'from-slate-700 to-slate-800 shadow-[0_4px_0_#1e293b] border-slate-800';
    }
    return (
      <button
        onClick={onClick}
        type="button"
        className={`w-full relative bg-gradient-to-b ${bg} border-2 border-slate-950 rounded-2xl active:translate-y-1 active:shadow-none text-white font-black py-2 px-3 text-[10px] tracking-wider uppercase flex items-center justify-center transition-all cursor-pointer`}
      >
        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10 rounded-t-2xl pointer-events-none" />
        <span className="truncate drop-shadow-[0_1.5px_0_rgba(0,0,0,0.8)]">{label}</span>
      </button>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-40 cursor-default" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 top-[44px] z-50 w-52 bg-slate-950/95 backdrop-blur border-4 border-slate-900 rounded-[2rem] p-4 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col gap-2.5 select-none"
      >
        <div className="absolute right-[16px] -top-[12px] w-5 h-5 bg-slate-950 border-t-4 border-l-4 border-slate-900 rotate-45 rounded-tl z-50 pointer-events-none" />
        <div className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest pb-1 border-b border-slate-900">
          Ordenar por
        </div>
        {renderBtn('Posição', sortBy === 'posicao', () => onSort('posicao'), 'blue')}
        {renderBtn('Troféus', sortBy === 'trofeus', () => onSort('trofeus'), 'gold')}
        {renderBtn('Nome', sortBy === 'nome', () => onSort('nome'), 'purple')}
      </motion.div>
    </>
  );
}

/* ── Linha da lista Amigos/Membros ── */

function FriendRow({
  item,
  rank,
  isSelf,
  showRank = true,
  onSelect,
}: {
  item: FriendItem;
  rank: number;
  isSelf: boolean;
  showRank?: boolean;
  /** Abre o popover do jogador (último acesso/ofensiva + Ver perfil). */
  onSelect?: (item: FriendItem) => void;
}) {
  const isTop3 = showRank && rank <= 3;
  const isBot3 = showRank && rank >= 8;
  const glyph = item.avatarGlyph || 'crown';
  const flag = item.flag || 'BR';
  const level = item.level || 1;
  const className = `w-full items-center justify-between p-2.5 rounded-xl border transition-all text-left ${rowTone(isSelf, isTop3, isBot3)}${onSelect ? ' cursor-pointer hover:border-[var(--primary-light)] active:scale-[0.99]' : ''}`;

  const row = (
    <>
      <div className="flex items-center gap-3">
        {showRank ? (
          <div
            className={`w-6 h-6 rounded-full border-2 font-mono font-black text-xs flex items-center justify-center shrink-0 ${rankBadgeClass(rank)}`}
          >
            {rank}
          </div>
        ) : (
          <div
            className="w-6 h-6 rounded-full border border-emerald-500/40 bg-emerald-500/15 flex items-center justify-center shrink-0"
            title="On-line"
            aria-label="On-line"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          </div>
        )}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-950/40 shadow-inner relative overflow-hidden bg-slate-900"
        >
          {PRESTIGIO_1?.type === 'image' && PRESTIGIO_1.url ? (
            <img src={PRESTIGIO_1.url} alt={PRESTIGIO_1.nome} className="w-full h-full object-cover" />
          ) : (
            <AvatarGlyph glyph={glyph} size={16} className="text-white" />
          )}
          {item.online && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border border-slate-950 rounded-full animate-pulse" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-black ${isSelf ? 'ligas-text-accent' : 'text-white'}`}>{item.name}</span>
            <span title="País">
              <FlagIcon flag={flag} size={12} className="text-slate-400" />
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
                  <Shield size={9} className="text-emerald-500" />
                  {item.clan}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0 flex items-center gap-1">
        <Trophy className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
        <span className={`text-xs font-black font-mono tracking-tight ${isSelf ? 'ligas-text-accent' : 'text-slate-300'}`}>
          {item.trophies.toLocaleString()}
        </span>
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button type="button" className={`flex ${className}`} onClick={() => onSelect(item)}>
        {row}
      </button>
    );
  }

  return <div className={`flex ${className}`}>{row}</div>;
}

/* ── Diamantes de navegação (Amigos / Guilda / Liga) ── */

function DiamondNav({ active, onGo }: { active: SubTab; onGo: (t: SubTab) => void }) {
  const [pressed, setPressed] = useState<SubTab | null>(null);

  useEffect(() => {
    if (pressed === null) return;
    const timer = window.setTimeout(() => setPressed(null), 360);
    return () => window.clearTimeout(timer);
  }, [pressed]);

  const items: { tab: SubTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { tab: 'amigos', label: 'Amigos', icon: <Shield size={20} /> },
    { tab: 'bate-papo', label: 'Guilda', icon: <MessageSquare size={18} /> },
    { tab: 'guerra-de-clas', label: 'Liga', icon: <Swords size={20} /> },
  ];

  return (
    <div className="flex justify-center items-center gap-8 py-3 select-none">
      {items.map((it) => {
        const isActive = active === it.tab;
        return (
          <div key={it.tab} className="flex flex-col items-center gap-2">
            <button
              onClick={() => {
                standaloneSound.playMove();
                setPressed(it.tab);
                onGo(it.tab);
              }}
              className={`relative w-14 h-14 rotate-45 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer ligas-nav-btn ${
                isActive
                  ? 'ligas-gradient border-[var(--primary-light)] ligas-glow-strong scale-110'
                  : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-500'
              }`}
            >
              {it.badge !== undefined && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 rounded-full flex items-center justify-center text-[9px] font-black text-white border-2 border-slate-950 -rotate-45">
                  {it.badge}
                </span>
              )}
              <div className="-rotate-45 text-white">
                <span
                  className={
                    pressed === it.tab
                      ? it.tab === 'amigos'
                        ? 'ligas-nav-icon--tap-amigos'
                        : it.tab === 'bate-papo'
                          ? 'ligas-nav-icon--tap-guilda'
                          : 'ligas-nav-icon--tap-liga'
                      : ''
                  }
                >
                  {isActive && it.tab === 'amigos' ? (
                    <Shield size={20} className="animate-pulse" />
                  ) : (
                    it.icon
                  )}
                </span>
              </div>
            </button>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Componente principal ── */

export function LigasFeature({
  profile = DEFAULT_PROFILE,
  messages: externalMessages,
  onSendMessage,
  activeSubTabProp,
  onChangeSubTab,
  soundEnabled = true,
}: LigasFeatureProps) {
  useEffect(() => {
    standaloneSound.enabled = soundEnabled;
  }, [soundEnabled]);

  const [localSubTab, setLocalSubTab] = useState<SubTab>('amigos');
  const activeSubTab = activeSubTabProp !== undefined ? activeSubTabProp : localSubTab;
  const setActiveSubTab = onChangeSubTab !== undefined ? onChangeSubTab : setLocalSubTab;

  const [communityTab, setCommunityTab] = useState<'amigos' | 'membros'>('amigos');
  const [sortBy, setSortBy] = useState<'posicao' | 'trofeus' | 'nome'>('posicao');
  const [showFilters, setShowFilters] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>(() =>
    mergeFriends(loadAddedFriends(), INITIAL_FRIENDS),
  );
  useEffect(() => {
    const reload = () => setFriends(mergeFriends(loadAddedFriends(), INITIAL_FRIENDS));
    document.addEventListener('academia:db-ready', reload);
    document.addEventListener('academia:friends-updated', reload);
    document.addEventListener('academia:friends-changed', reload);
    return () => {
      document.removeEventListener('academia:db-ready', reload);
      document.removeEventListener('academia:friends-updated', reload);
      document.removeEventListener('academia:friends-changed', reload);
    };
  }, []);
  const [internalMessages, setInternalMessages] = useState<ClanMessage[]>(INITIAL_CLAN_MESSAGES);

  /* Fichas compartilhadas na guilda (enviadas pela aba Minha Ficha). */
  const readShared = () => {
    try {
      const raw = localStorage.getItem('academia_guild_shared');
      return raw ? (JSON.parse(raw) as { id: string; sheetKey: string; exerciseIds: string[]; author: string; timestamp: number }[]) : [];
    } catch {
      return [];
    }
  };
  const [sharedSheets, setSharedSheets] = useState(readShared);
  useEffect(() => {
    const onUpdate = () => setSharedSheets(readShared());
    window.addEventListener('academia:guild-shared-updated', onUpdate);
    return () => window.removeEventListener('academia:guild-shared-updated', onUpdate);
  }, []);
  const messages = externalMessages !== undefined ? externalMessages : internalMessages;
  const [typedMessage, setTypedMessage] = useState('');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  /* Jogador do popover (amigos e membros da guilda usam o mesmo desenho). */
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSummaryInput | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [leagueViewType, setLeagueViewType] = useState<'semanal' | 'mensal'>('semanal');

  const { user, loading: authLoading } = useAuth();
  const { state: profileState } = useProfileState();

  const displayName = useMemo(() => {
    const name = profileState?.customization?.nome?.trim() || profile.username || 'Atleta';
    return name.slice(0, 24) || 'Atleta';
  }, [profileState?.customization?.nome, profile.username]);

  /* ── Guilda (sistema real, ver guild-data.ts) ──
     Os "troféus" do jogador são o XP de treinos do app (mesma pontuação do
     Fit ID); a guilda NÃO tem pontuação própria nem doações semanais. */
  const { history } = useLocalData();
  const playerTrophies = useMemo(() => getXp(history), [history]);
  const playerLevel = useMemo(() => getLevel(playerTrophies), [playerTrophies]);
  const guildPlayer = useMemo<GuildPlayer>(
    () => ({
      name: displayName,
      trophies: playerTrophies,
      level: playerLevel,
      glyph: 'crown',
      flag: 'BR',
    }),
    [displayName, playerTrophies, playerLevel],
  );
  const guildState = useGuildState(guildPlayer);
  const myGuild = getGuild(guildState);
  /* O detalhe da guilda (localização, troféus, tipo e membros) abre no modal
     do banner do cabeçalho — a sub-aba Guilda mostra o chat. */
  const [guildDetailsOpen, setGuildDetailsOpen] = useState(false);

  /* Trocar de sub-aba fecha o modal de detalhes, para ele não reabrir sozinho. */
  const goSubTab = useCallback(
    (tab: SubTab) => {
      setGuildDetailsOpen(false);
      setSelectedPlayer(null);
      setActiveSubTab(tab);
    },
    [setActiveSubTab],
  );

  /* Lista de "Membros da Guilda" da sub-aba Amigos = membros reais da guilda. */
  const guildMembers = useMemo<FriendItem[]>(() => {
    if (!myGuild) return [];
    return [...myGuild.members]
      .sort((a, b) => b.trophies - a.trophies)
      .map((member, index) => ({
        id: member.id,
        name: member.name,
        trophies: member.trophies,
        clan: myGuild.name,
        online: (member.lastSeenHours ?? 0) <= 0,
        avatarColor: 'from-slate-600 to-slate-800',
        avatarInitial: member.name.charAt(0).toUpperCase(),
        rank: index + 1,
        avatarGlyph: member.glyph,
        flag: member.flag,
        level: member.level,
        role: member.role,
        lastSeenHours: member.lastSeenHours,
        streak: member.streak,
      }));
  }, [myGuild]);
  const friendCode = useMemo(() => getFriendCode(user?.id ?? null), [user?.id]);
  const inviteUrl = useMemo(
    () => buildFriendInviteUrl(friendCode, displayName),
    [friendCode, displayName],
  );
  const inviteFromUrlHandled = useRef(false);

  const chatScrollerRef = useRef<HTMLDivElement>(null);

  const [leagueState, setLeagueState] = useState<LeagueState>(getLeagueState);
  const [seasonEndStep, setSeasonEndStep] = useState<number | null>(() =>
    getLeagueState().lastResult ? 1 : null
  );

  const [monthlyLeagueState, setMonthlyLeagueState] = useState<LeagueState>(getMonthlyLeagueState);
  const [monthlySeasonEndStep, setMonthlySeasonEndStep] = useState<number | null>(() =>
    getMonthlyLeagueState().lastResult ? 1 : null
  );

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const ce = e as CustomEvent<LeagueState>;
      if (ce.detail) setLeagueState(ce.detail);
    };
    window.addEventListener('tetris-clash-league-update', handleUpdate);
    return () => window.removeEventListener('tetris-clash-league-update', handleUpdate);
  }, []);

  useEffect(() => {
    const handleMonthlyUpdate = (e: Event) => {
      const ce = e as CustomEvent<LeagueState>;
      if (ce.detail) setMonthlyLeagueState(ce.detail);
    };
    window.addEventListener('tetris-clash-monthly-league-update', handleMonthlyUpdate);
    return () => window.removeEventListener('tetris-clash-monthly-league-update', handleMonthlyUpdate);
  }, []);

  useEffect(() => {
    if (chatScrollerRef.current && activeSubTab === 'bate-papo') {
      chatScrollerRef.current.scrollTop = chatScrollerRef.current.scrollHeight;
    }
  }, [messages, activeSubTab]);

  /* ── Ações liga semanal ── */

  const handleSimulateMatchXp = () => {
    standaloneSound.playMove();
    addPlayerLeagueXp(Math.floor(Math.random() * 50) + 35);
  };

  const handleEndWeek = () => {
    standaloneSound.playLevelUp();
    const state = getLeagueState();
    if (!state.joined) return;
    const outcome = computeSeasonOutcome(state, profile);
    const nextState: LeagueState = {
      division: outcome!.newDivision,
      joined: false,
      playerXp: 0,
      daysRemaining: 6,
      opponents: [],
      lastResult: outcome,
    };
    saveLeagueState(nextState);
    setLeagueState(nextState);
    setSeasonEndStep(1);
  };

  const handleClearLastResult = () => {
    standaloneSound.playMove();
    const state = getLeagueState();
    const nextState: LeagueState = { ...state, lastResult: null };
    saveLeagueState(nextState);
    setLeagueState(nextState);
    setSeasonEndStep(null);
  };

  /* ── Ações liga mensal ── */

  const handleSimulateMonthlyMatchXp = () => {
    standaloneSound.playMove();
    addPlayerMonthlyLeagueXp(Math.floor(Math.random() * 50) + 35);
  };

  const handleEndMonth = () => {
    standaloneSound.playLevelUp();
    const state = getMonthlyLeagueState();
    if (!state.joined) return;
    const outcome = computeSeasonOutcome(state, profile);
    const nextState: LeagueState = {
      division: outcome!.newDivision,
      joined: false,
      playerXp: 0,
      daysRemaining: 27,
      opponents: [],
      lastResult: outcome,
    };
    saveMonthlyLeagueState(nextState);
    setMonthlyLeagueState(nextState);
    setMonthlySeasonEndStep(1);
  };

  const handleClearLastMonthlyResult = () => {
    standaloneSound.playMove();
    const state = getMonthlyLeagueState();
    const nextState: LeagueState = { ...state, lastResult: null };
    saveMonthlyLeagueState(nextState);
    setMonthlyLeagueState(nextState);
    setMonthlySeasonEndStep(null);
  };

  /* ── Chat ── */

  const dispatchChatMessage = (text: string) => {
    if (onSendMessage) {
      onSendMessage(text);
      return;
    }
    const timeStr = formatNow();
    setInternalMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: profile.username || 'GABRIEL GS',
        role: 'Líder',
        trophies: profile.trophies || 12710,
        text,
        time: timeStr,
        isSelf: true,
      },
    ]);
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    dispatchChatMessage(typedMessage.trim());
    setTypedMessage('');
    standaloneSound.playHold();
  };

  /* ── Amigos ── */

  const applyInvite = useCallback(
    (invite: FriendInvite) => {
      const result = acceptFriendInvite(invite, friendCode);

      if (result.friend) {
        const accepted = result.friend;
        setFriends((prev) => mergeFriends([accepted], prev));
      }

      if (result.status === 'added') {
        standaloneSound.playLevelUp();
        showToast(`${result.friend?.name ?? 'Amigo'} foi adicionado aos seus amigos!`, 'success');
      } else if (result.status === 'duplicate') {
        showToast(`${result.friend?.name ?? 'Esse amigo'} já está na sua lista de amigos.`, 'info');
      } else if (result.status === 'self') {
        showToast('Esse é o seu próprio QR Code de amigo.', 'info');
      } else {
        showToast('Convite de amizade inválido.', 'error');
      }

      return result;
    },
    [friendCode],
  );

  /* Convite vindo de link (?amigo=...): aceita uma única vez, depois limpa a URL. */
  useEffect(() => {
    if (authLoading || inviteFromUrlHandled.current) return;
    inviteFromUrlHandled.current = true;

    const invite = readFriendInviteFromUrl();
    if (!invite) return;

    // A URL é uma fonte externa: o convite precisa hidratar o estado uma vez.
    // eslint-disable-next-line react/set-state-in-effect
    applyInvite(invite);
    clearFriendInviteFromUrl();
  }, [authLoading, applyInvite]);

  const handleCameraClick = () => {
    standaloneSound.playMove();
    setShowScanner(true);
  };

  const handleScannedInvite = (invite: FriendInvite) => {
    applyInvite(invite);
    setShowScanner(false);
  };

  const getSortedList = (list: FriendItem[]) => {
    const copy = [...list];
    if (sortBy === 'nome') return copy.sort((a, b) => a.name.localeCompare(b.name));
    return copy.sort((a, b) => b.trophies - a.trophies);
  };

  const sortedFriends = getSortedList(friends);
  const sortedMembers = getSortedList(guildMembers);
  const onlineFriends = useMemo(
    () => [...friends].filter((friend) => friend.online).sort((a, b) => b.trophies - a.trophies),
    [friends],
  );
  const isSelfFriend = (item: FriendItem) =>
    item.id === 'self' ||
    (item.friendCode ? item.friendCode === friendCode : item.name === profile.username);

  /* Abre o popover do jogador (último acesso/ofensiva + Ver perfil). */
  const openPlayer = (item: FriendItem, kind: PlayerKind) => {
    standaloneSound.playMove();
    setSelectedPlayer({
      id: item.id,
      name: item.name,
      kind,
      isSelf: isSelfFriend(item),
      role: kind === 'membro' ? item.role : undefined,
      clan: kind === 'membro' ? myGuild?.name ?? item.clan : item.clan,
      clanEmblemId: myGuild?.emblemId,
      trophies: item.trophies,
      level: item.level,
      flag: item.flag,
      glyph: item.avatarGlyph,
      online: item.online,
      lastSeenHours:
        item.lastSeenHours ?? fallbackLastSeenHours(`${item.id}:${item.name}`, item.online),
      streak: item.streak ?? fallbackStreak(`${item.id}:${item.name}`),
    });
  };

  /* ── Portais ── */

  const renderSeasonEndPortal = () => {
    if (seasonEndStep === null || !leagueState.lastResult) return null;
    return (
      <SeasonEndPortal
        result={leagueState.lastResult}
        step={seasonEndStep}
        onNext={() => {
          standaloneSound.playMove();
          if (seasonEndStep === 1) setSeasonEndStep(2);
          else if (seasonEndStep === 2 && leagueState.lastResult?.type === 'promotion') setSeasonEndStep(3);
          else handleClearLastResult();
        }}
        onClear={handleClearLastResult}
      />
    );
  };

  const renderMonthlySeasonEndPortal = () => {
    if (monthlySeasonEndStep === null || !monthlyLeagueState.lastResult) return null;
    return (
      <SeasonEndPortal
        result={monthlyLeagueState.lastResult}
        step={monthlySeasonEndStep}
        monthly
        onNext={() => {
          standaloneSound.playMove();
          if (monthlySeasonEndStep === 1) setMonthlySeasonEndStep(2);
          else if (monthlySeasonEndStep === 2 && monthlyLeagueState.lastResult?.type === 'promotion')
            setMonthlySeasonEndStep(3);
          else handleClearLastMonthlyResult();
        }}
        onClear={handleClearLastMonthlyResult}
      />
    );
  };

  /* ── Header banner / toggle liga ── */

  const bannerOrToggle = (
    <div className="flex items-center gap-2.5 w-full">
      {activeSubTab === 'guerra-de-clas' ? (
        <div className="flex-1 p-1.5 bg-[rgba(20,16,36,0.75)] backdrop-blur border border-[rgba(var(--primary-rgb,139,92,246),0.2)] rounded-2xl flex items-center select-none shadow-lg">
          <div className="grid grid-cols-2 gap-1.5 w-full">
            <button
              onClick={() => {
                standaloneSound.playMove();
                setLeagueViewType('semanal');
              }}
              className={`py-2 px-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer select-none flex items-center justify-center gap-1 ${
                leagueViewType === 'semanal'
                  ? 'ligas-gradient text-white shadow-md border border-[rgba(var(--primary-rgb,139,92,246),0.4)]'
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
              className={`py-2 px-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer select-none flex items-center justify-center gap-1 ${
                leagueViewType === 'mensal'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md border border-amber-300'
                  : 'bg-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy size={12} className="text-amber-400" />
              Liga Mensal
            </button>
          </div>
        </div>
      ) : activeSubTab === 'bate-papo' ? (
        myGuild ? (
          <button
            type="button"
            onClick={() => {
              standaloneSound.playMove();
              setGuildDetailsOpen(true);
            }}
            className="flex-1 min-w-0 p-3 bg-gradient-to-r from-[rgba(var(--primary-rgb,139,92,246),0.25)] via-slate-900/60 to-slate-950/70 backdrop-blur border border-[rgba(var(--primary-rgb,139,92,246),0.3)] rounded-2xl flex items-center gap-3 select-none shadow-md cursor-pointer transition-transform active:scale-[0.99]"
            title="Ver detalhes da guilda"
            aria-label={`Ver detalhes da guilda ${myGuild.name}`}
          >
            <GuildEmblem emblemId={myGuild.emblemId} size={44} />
            <div className="min-w-0 flex-1 text-left">
              <h4 className="text-base font-black text-white uppercase tracking-tight leading-none truncate">
                {myGuild.name}
              </h4>
              <p className="text-[10px] ligas-text-accent font-semibold mt-1 uppercase tracking-wide flex items-center gap-1">
                <Users size={10} />
                {myGuild.members.length}/50 Membros
              </p>
            </div>
            <ChevronRight size={16} className="text-slate-500 shrink-0" />
          </button>
        ) : (
          <div className="flex-1 min-w-0 p-4 bg-gradient-to-r from-[rgba(var(--primary-rgb,139,92,246),0.18)] via-slate-900/60 to-slate-950/70 backdrop-blur border border-[rgba(var(--primary-rgb,139,92,246),0.24)] rounded-2xl flex items-center gap-3 select-none shadow-md">
            <div className="w-11 h-11 rounded-2xl border border-slate-700 bg-slate-900/70 flex items-center justify-center shrink-0 text-slate-500">
              <Shield size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="text-base font-black text-white uppercase tracking-tight leading-none">
                Sem guilda
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wide">
                Nenhuma guilda ainda
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="flex-1 p-4 bg-gradient-to-r from-[rgba(var(--primary-rgb,139,92,246),0.25)] via-slate-900/60 to-slate-950/70 backdrop-blur border border-[rgba(var(--primary-rgb,139,92,246),0.3)] rounded-2xl flex items-center justify-between select-none shadow-md">
          {myGuild ? (
            <>
              <div className="flex items-center gap-3">
                <GuildEmblem emblemId={myGuild.emblemId} size={48} />
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-tight leading-none">
                    {myGuild.name}
                  </h4>
                  <p className="text-[10px] ligas-text-accent font-semibold mt-1 uppercase tracking-wide">
                    {myGuild.members.length}/50 membros · {myGuild.type}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-slate-500 font-bold uppercase leading-none">
                  Troféus necessários
                </div>
                <div className="text-xs font-black text-yellow-400 leading-none mt-1 font-mono flex items-center justify-end gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  {myGuild.requiredTrophies.toLocaleString('pt-BR')}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl border border-slate-700 bg-slate-900/70 flex items-center justify-center shrink-0 text-slate-500">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-tight leading-none">
                    Sem guilda
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wide">
                    Entre ou crie a sua para treinar com o time
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  standaloneSound.playMove();
                  goSubTab('bate-papo');
                }}
                className="px-3.5 py-2 ligas-btn-primary rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer shrink-0"
              >
                Guilda
              </button>
            </>
          )}
        </div>
      )}

      {activeSubTab !== 'amigos' && (
        <button
          onClick={() => {
            standaloneSound.playMove();
            goSubTab('amigos');
          }}
          className="soc-close-btn p-3.5 bg-slate-900 hover:bg-rose-950/40 border-2 border-slate-700 hover:border-rose-900/45 text-slate-400 hover:text-rose-400 rounded-2xl transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0"
          style={{ outline: 'none', boxShadow: 'none', border: '2px solid #1e293b' }}
          title="Voltar para Amigos"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );

  /* ── Sub-aba Amigos ── */

  const amigosContent = (
    <div className="space-y-4">
      <DiamondNav active={activeSubTab} onGo={goSubTab} />

      <div className="w-full bg-[rgba(24,20,40,0.65)] backdrop-blur border border-[rgba(var(--primary-rgb,139,92,246),0.18)] rounded-[2rem] p-5 shadow-2xl relative overflow-hidden flex flex-col gap-4">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(var(--primary-rgb,139,92,246),0.06)] to-transparent pointer-events-none" />

        <div className="flex items-center justify-between select-none z-20 relative">
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">Aliança</h3>
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
              className={`p-2.5 rounded-xl transition-all cursor-pointer shadow-md border-b-2 active:border-b-0 active:translate-y-[2px] ${
                showFilters ? 'ligas-bg-accent border-[var(--primary-dark)] text-white' : 'bg-amber-400 hover:bg-amber-300 border-yellow-600 text-slate-950'
              }`}
              title="Filtro Avançado"
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
          <AnimatePresence>
            {showFilters && (
              <FilterMenu
                sortBy={sortBy}
                onSort={(s) => {
                  standaloneSound.playMove();
                  setSortBy(s);
                  setShowFilters(false);
                }}
                onClose={() => setShowFilters(false)}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-center border-b border-[rgba(var(--primary-rgb,139,92,246),0.2)] select-none z-10 pb-1">
          <div className="flex gap-6 text-xs font-black uppercase tracking-wider">
            <button
              onClick={() => {
                standaloneSound.playMove();
                setSelectedPlayer(null);
                setCommunityTab('amigos');
              }}
              className={`pb-2 transition-all relative cursor-pointer ${communityTab === 'amigos' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Amigos
              {communityTab === 'amigos' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] rounded-full" />
              )}
            </button>
            <button
              onClick={() => {
                standaloneSound.playMove();
                setSelectedPlayer(null);
                setCommunityTab('membros');
              }}
              className={`pb-2 transition-all relative cursor-pointer ${communityTab === 'membros' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Membros da Guilda
              {communityTab === 'membros' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] rounded-full" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[calc(100vh-420px)] overflow-y-auto pr-1 z-10">
          {communityTab === 'membros' ? (
            !myGuild ? (
              <div className="flex flex-col items-center gap-3 py-8 px-4 text-center rounded-2xl border border-dashed border-slate-700/70">
                <Shield size={22} className="text-slate-500" />
                <p className="text-xs font-bold text-slate-400 leading-relaxed">
                  Você ainda não faz parte de uma guilda. Entre ou crie a sua para ver os membros
                  do time aqui.
                </p>
                <button
                  onClick={() => {
                    standaloneSound.playMove();
                    goSubTab('bate-papo');
                  }}
                  className="px-4 py-2 ligas-btn-primary rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer active:scale-95"
                >
                  Ir para Guilda
                </button>
              </div>
            ) : (
              sortedMembers.map((item, index) => (
                <FriendRow
                  key={item.id}
                  item={item}
                  rank={index + 1}
                  isSelf={isSelfFriend(item)}
                  onSelect={(selected) => openPlayer(selected, 'membro')}
                />
              ))
            )
          ) : (
            <>
              <section className="soc-friend-group" aria-label="Amigos on-line">
                <div className="soc-friend-group__head">
                  <span className="soc-friend-group__title">
                    <span className="soc-friend-group__pulse" aria-hidden="true" />
                    Amigos on-line
                  </span>
                  <span className="soc-friend-group__count">{onlineFriends.length}</span>
                </div>
                {onlineFriends.length > 0 ? (
                  onlineFriends.map((item) => (
                    <FriendRow
                      key={`online-${item.id}`}
                      item={item}
                      rank={0}
                      isSelf={isSelfFriend(item)}
                      showRank={false}
                      onSelect={(selected) => openPlayer(selected, 'amigo')}
                    />
                  ))
                ) : (
                  <p className="soc-friend-group__empty">Nenhum amigo on-line agora.</p>
                )}
              </section>

              <section className="soc-friend-group" aria-label="Classificação dos amigos">
                <div className="soc-friend-group__head">
                  <span className="soc-friend-group__title">
                    <Trophy size={12} className="text-amber-400" aria-hidden="true" />
                    Classificação
                  </span>
                  <span className="soc-friend-group__count">{sortedFriends.length}</span>
                </div>
                {sortedFriends.map((item, index) => (
                  <FriendRow
                    key={item.id}
                    item={item}
                    rank={index + 1}
                    isSelf={isSelfFriend(item)}
                    onSelect={(selected) => openPlayer(selected, 'amigo')}
                  />
                ))}
              </section>
            </>
          )}
        </div>

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
            className="p-3 ligas-btn-primary rounded-2xl flex items-center justify-center transition-all cursor-pointer border-b-4 border-[var(--primary-dark)] active:border-b-0 active:translate-y-[2px]"
            title="Escanear QR Code"
            aria-label="Escanear QR Code de amigo"
          >
            <Camera size={16} />
          </button>
        </div>
      </div>

      {selectedPlayer && (
        <MemberPopover player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}

      {showAddFriendModal && (
        <FriendQrModal
          inviteUrl={inviteUrl}
          name={displayName}
          selfId={user?.id ?? null}
          onAddPlayer={(invite) => {
            applyInvite(invite);
          }}
          onClose={() => setShowAddFriendModal(false)}
          onScan={() => {
            setShowAddFriendModal(false);
            setShowScanner(true);
          }}
        />
      )}

      {showScanner && (
        <QrScannerModal
          onClose={() => setShowScanner(false)}
          onInvite={handleScannedInvite}
        />
      )}
    </div>
  );

  /* ── Sub-aba Bate-papo ── */

  const batePapoContent = (
    <div className="flex flex-col gap-4">
      {sharedSheets.length > 0 && (
        <div className="bg-[rgba(24,20,40,0.65)] backdrop-blur border border-[rgba(var(--primary-rgb,139,92,246),0.18)] rounded-2xl p-4 space-y-2">
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Fichas Compartilhadas na Guilda</h3>
          <div className="space-y-2">
            {sharedSheets.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-[rgba(var(--primary-rgb,139,92,246),0.2)] bg-slate-950/40"
              >
                <div>
                  <span className="text-xs font-black text-white">Ficha {s.sheetKey}</span>
                  <span className="text-[9px] text-slate-500 ml-2">{s.exerciseIds.length} ex.</span>
                </div>
                <button
                  onClick={() => {
                    try {
                      localStorage.setItem('academia_clipboard_sheet', JSON.stringify(s.exerciseIds));
                      showToast('Ficha copiada! Cole na aba Minha Ficha.', 'success');
                    } catch {
                      showToast('Erro ao copiar ficha.', 'error');
                    }
                  }}
                  className="px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white font-black text-[10px] uppercase rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  Copiar Ficha
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div
        ref={chatScrollerRef}
        className="h-[calc(100vh-420px)] sm:h-[calc(100vh-400px)] min-h-[320px] overflow-y-auto space-y-4 px-1 pb-28 scroll-smooth"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1 max-w-[85%] ${msg.isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`}
          >
            <div className="flex items-center gap-1.5 select-none text-[11px] font-bold">
              <span className={msg.isSelf ? 'ligas-text-accent' : 'text-slate-300'}>{msg.sender}</span>
              <span className="px-1 py-0.5 rounded text-[9px] ligas-role-pill font-black">
                {msg.role}
              </span>
            </div>
            <div
              className={`px-3.5 py-2.5 rounded-2xl text-[15px] font-medium leading-relaxed ${
                msg.isSelf
                  ? 'ligas-bubble-self text-white rounded-tr-none'
                  : 'bg-slate-900/80 text-slate-100 rounded-tl-none border border-slate-800'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-slate-500 select-none font-medium">{msg.time}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendSubmit} className="flex gap-2.5">
        <input
          type="text"
          maxLength={60}
          placeholder="Digite sua mensagem para a guilda..."
          value={typedMessage}
          onChange={(e) => setTypedMessage(e.target.value)}
          className="ligas-input flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[15px] text-white placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!typedMessage.trim()}
          className="px-4 py-2.5 ligas-btn-primary rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  /* ── Sub-aba Liga ── */

  const ligaContent = (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={leagueViewType}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {leagueViewType === 'semanal' ? (
        <>
          <div className="p-4 bg-gradient-to-br from-[rgba(var(--primary-rgb,139,92,246),0.22)] via-slate-900/70 to-slate-950/80 backdrop-blur border border-[rgba(var(--primary-rgb,139,92,246),0.28)] rounded-2xl flex flex-col sm:flex-row items-center justify-between select-none gap-3 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--primary-rgb,139,92,246),0.1),transparent_50%)] pointer-events-none" />
            <div className="flex items-center gap-3">
              <DivisionIcon kind={DIVISION_COLORS[leagueState.division].icon} size={36} />
              <div>
                <h4 className="text-lg font-black text-white uppercase tracking-tight leading-none">
                  Divisão {leagueState.division}
                </h4>
                <p className="text-[10px] ligas-text-accent font-bold mt-1.5 uppercase tracking-wider flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Liga Semanal Ativa
                </p>
              </div>
            </div>
            <div className="px-3.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-full flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 ligas-text-accent" />
              <span className="text-xs font-black ligas-text-accent font-mono">
                {leagueState.joined ? `${leagueState.daysRemaining} DIAS` : '1 SEMANA'}
              </span>
            </div>
          </div>

          <DivisionPath currentDivision={leagueState.division} variant="weekly" />

          {!leagueState.joined ? (
            <JoinPrompt
              division={leagueState.division}
              title="JOGUE E DISPUTE!"
              desc="Jogue e seus pontos ganhos em batalhas somam pontuação para subir posições e chegar ao pódio! Os três primeiros colocados ganham as melhores recompensas."
              ctaLabel="Simular Partida (+50 XP)"
              onCta={handleSimulateMatchXp}
              accent="indigo"
            />
          ) : (
            <div className="space-y-3">
              <LeagueStandings
                playerXp={leagueState.playerXp}
                opponents={leagueState.opponents}
                profile={{ username: profile.username, level: profile.level }}
              />
              <LeagueTestControls onSimulate={handleSimulateMatchXp} onEnd={handleEndWeek} endLabel="Finalizar Semana" />
            </div>
          )}
        </>
      ) : (
        <>
          <DivisionPath currentDivision={monthlyLeagueState.division} variant="monthly" />
          {!monthlyLeagueState.joined ? (
            <JoinPrompt
              division={monthlyLeagueState.division}
              title="LIGA MENSAL SUPREMA!"
              desc="Participe automaticamente jogando Tetris! Seus pontos também valem para as ligas mensais. Sem pré-inscrição: basta jogar para competir!"
              ctaLabel="Simular Partida Mensal (+50 XP)"
              onCta={handleSimulateMonthlyMatchXp}
              accent="amber"
            />
          ) : (
            <div className="space-y-3">
              <LeagueStandings
                playerXp={monthlyLeagueState.playerXp}
                opponents={monthlyLeagueState.opponents}
                profile={{ username: profile.username, level: profile.level }}
                scaleSelf
              />
              <LeagueTestControls
                onSimulate={handleSimulateMonthlyMatchXp}
                onEnd={handleEndMonth}
                endLabel="Finalizar Mês"
              />
            </div>
          )}
        </>
      )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  /* ── Render ── */

  return (
    <div className="treino-container soc-root">
      <div id="section-social" className="main-section soc ligas-root" role="tabpanel" aria-label="Social">
        {bannerOrToggle}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="min-h-0"
          >
            {activeSubTab === 'amigos' ? (
              amigosContent
            ) : activeSubTab === 'bate-papo' ? (
              <GuildPanel
                player={guildPlayer}
                chat={batePapoContent}
                detailsOpen={guildDetailsOpen}
                onCloseDetails={() => setGuildDetailsOpen(false)}
              />
            ) : (
              ligaContent
            )}
          </motion.div>
        </AnimatePresence>

        {renderSeasonEndPortal()}
        {renderMonthlySeasonEndPortal()}
      </div>
    </div>
  );
}

export default LigasFeature;
