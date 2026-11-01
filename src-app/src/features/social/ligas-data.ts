/**
 * ligas-data.ts — tipos e utilidades da aba Social (v4.66.0)
 *
 * Depois da limpeza de dados fictícios, este módulo guarda apenas:
 *   • tipos compartilhados (amigo, glifos, bandeiras);
 *   • as divisões históricas usadas pelos glifos SVG (`ligas-icons.tsx`);
 *   • os efeitos sonoros sintetizados da UI.
 *
 * Nada aqui gera jogadores, pontuações ou ligas: o ranking e os amigos vêm da
 * nuvem (`social-cloud.ts`) e o XP vem do histórico real de treinos.
 */

/* ── Tipos ── */

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

export type LeagueDivision = 'Bronze' | 'Prata' | 'Ouro' | 'Safira' | 'Rubi';

export type DivisionIconKind =
  | 'trophy-bronze'
  | 'trophy-silver'
  | 'trophy-gold'
  | 'gem-cyan'
  | 'gem-rose';

export const LEAGUE_DIVISIONS: LeagueDivision[] = ['Bronze', 'Prata', 'Ouro', 'Safira', 'Rubi'];

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

/** Linha de jogador exibida nas listas (amigos, ranking, popover). */
export interface FriendItem {
  id: string;
  name: string;
  trophies: number;
  /** XP da janela mensal (ranking global). */
  monthlyXp?: number;
  online: boolean;
  avatarColor: string;
  avatarInitial: string;
  rank: number;
  avatarGlyph?: AvatarGlyphKey;
  flag?: FlagKey;
  level?: number;
  /** Foto de perfil real do jogador (customization.photo / OAuth). */
  photo?: string;
  /** Emblema de identidade equipado (vira a imagem de perfil sem foto). */
  avatarEmblemId?: string;
  /** Código permanente do convite (amigos adicionados por QR/link). */
  friendCode?: string;
  /** Timestamp de quando o amigo foi adicionado por QR/link. */
  addedAt?: number;
  /** Horas desde o último acesso (0 = agora) — alimenta o popover do jogador. */
  lastSeenHours?: number;
  /** Dias consecutivos de treino (ofensiva) — alimenta o popover do jogador. */
  streak?: number;
}

/** Abas da interface Social. */
export type SubTab = 'amigos' | 'ranking';

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
