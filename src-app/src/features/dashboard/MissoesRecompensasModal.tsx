import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import '@/features/auth/auth-screen.css';
import {
    X,
    Calendar,
    Layers,
    Award,
    CheckCircle2,
    Zap,
    Coins,
    Gem,
    Trophy,
    Shield,
    Crown,
    Info
} from 'lucide-react';

// ============================================================================
// 1. TIPOS & MODELOS DE DADOS
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
}

export interface Mission {
    id: string;
    title: string;
    subtitle: string;
    type: 'daily' | 'weekly';
    target: number;
    current: number;
    claimed: boolean;
    xpReward: number;
    goldReward: number;
    gemsReward: number;
    pointsReward: number; // Passe Royale points
    chestName: string;
    chestImage: string;
    chestColor: string;
}

export interface PasseReward {
    rewardName: string;
    rewardType: 'gold' | 'gems' | 'chest' | 'cards';
    rewardValue: number;
    claimed: boolean;
    image: string;
}

export interface PasseTier {
    id: number;
    pointsRequired: number;
    freeReward: PasseReward;
    goldReward: PasseReward;
}

export interface MissionsModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    profile?: PlayerProfile;
    onUpdateProfile?: (updated: Partial<PlayerProfile>) => void;
}

// ============================================================================
// 2. SISTEMA DE ÁUDIO WEB AUDIO API STANDALONE (ZERO ARQUIVOS EXTERNOS)
// ============================================================================

class SoundManagerStandalone {
    private ctx: AudioContext | null = null;

    private initCtx() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
        }
    }

    playMove() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.05);
        } catch { }
    }

    playHold() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
        } catch { }
    }

    playLevelUp() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            [440, 554.37, 659.25, 880].forEach((freq, idx) => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                gain.gain.setValueAtTime(0.15, now + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.22);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.25);
            });
        } catch { }
    }

    playLineClear() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99].forEach((freq, idx) => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                gain.gain.setValueAtTime(0.12, now + idx * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.2);
            });
        } catch { }
    }

    playTetris() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now + idx * 0.07);
                gain.gain.setValueAtTime(0.15, now + idx * 0.07);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.07);
                osc.stop(now + idx * 0.07 + 0.28);
            });
        } catch { }
    }

    playScoreSaved() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.1);
        } catch { }
    }

    playRotate() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(540, this.ctx.currentTime + 0.04);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.04);
        } catch { }
    }
}

const soundManager = new SoundManagerStandalone();

// ============================================================================
// 3. DADOS INICIAIS 100% IDENTICOS AO SITE
// ============================================================================

const DEFAULT_PROFILE: PlayerProfile = {
    username: 'DearGabrielGS',
    clanName: 'GABRIEL GS',
    trophies: 1385,
    gold: 50739,
    gems: 4165,
    xp: 850,
    level: 7
};

// ============================================================================
// 4. COMPONENTE STANDALONE (EXATAMENTE IGUAL A src/components/MissionsModal.tsx)
// ============================================================================

export default function MissoesRecompensasStandalone({
    isOpen = true,
    onClose = () => { },
    profile: propProfile,
    onUpdateProfile: propUpdateProfile
}: MissionsModalProps) {
    // Local fallback profile if running purely standalone
    const [localProfile, setLocalProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);
    const profile = propProfile || localProfile;
    const onUpdateProfile = (patch: Partial<PlayerProfile>) => {
        if (propUpdateProfile) {
            propUpdateProfile(patch);
        } else {
            setLocalProfile(prev => ({ ...prev, ...patch }));
        }
    };

    const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'passe'>('daily');

    // State for toggling secondary rewards visibility per mission card
    const [visibleRewards, setVisibleRewards] = useState<Record<string, boolean>>({});

    const toggleRewardsVisibility = (missionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        soundManager.playMove();
        setVisibleRewards(prev => ({
            ...prev,
            [missionId]: !prev[missionId]
        }));
    };

    // Chest open simulation state
    const [openingChest, setOpeningChest] = useState<{
        name: string;
        color: string;
        image: string;
        xp: number;
        gold: number;
        gems: number;
        badge?: string;
    } | null>(null);

    // Completed daily missions counter (cumulative for monthly / weekly)
    const [completedDailiesThisWeek, setCompletedDailiesThisWeek] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('arena_royale_dailies_week_v2');
            return saved ? parseInt(saved, 10) : 4;
        }
        return 4;
    });

    const [completedDailiesMonthly, setCompletedDailiesMonthly] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('arena_royale_dailies_month_v2');
            return saved ? parseInt(saved, 10) : 26; // Default to 26 out of 40 so they are close
        }
        return 26;
    });

    const [monthlyClaimed, setMonthlyClaimed] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('arena_royale_monthly_claimed_v2') === 'true';
        }
        return false;
    });

    // Initialize missions - EXACTLY 3 Daily, EXACTLY 3 Weekly (1 Fixed, 2 Other)
    const [missions, setMissions] = useState<Mission[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('arena_royale_missions_v4');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error(e);
                }
            }
        }
        return [
            // Daily Missions (EXACTLY 3)
            {
                id: 'd1',
                title: 'Esmagador de Linhas',
                subtitle: 'Destrua 15 linhas de Tetromino em batalhas.',
                type: 'daily',
                target: 15,
                current: 6,
                claimed: false,
                xpReward: 30,
                goldReward: 80,
                gemsReward: 3,
                pointsReward: 5,
                chestName: 'Baú de Madeira',
                chestImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQfvz7YRq1Pu-y_-Pkj3RgPbJtjcRMIfSCdcbyFBzDQAC_MRbG-qGR8z83B0Rm0oiYyIh_IvBsFC6lytRpzs1_I0mf7WQLu9wAEuU2dFx3e4DxRR3mmgbr_32REcQuGE7dfm-ua1U86LaLTf0m_E2_GQPNqvviq1_MnqV0W29fIH6n46q44dQ5zsft3RJ2Bvn9jpPyF0C4pYzyzZ6vDREHeVRw2CT-9oHAgGHwR7xFa7tm7flqIC293K6Ba4WjULs0Hu52aAagaZY',
                chestColor: 'from-amber-700 to-amber-900 border-amber-600 shadow-[0_0_15px_rgba(180,83,9,0.5)]'
            },
            {
                id: 'd2',
                title: 'Investimento Real',
                subtitle: 'Gaste 200 moedas de Ouro na Coleção ou Loja.',
                type: 'daily',
                target: 200,
                current: 0,
                claimed: false,
                xpReward: 40,
                goldReward: 100,
                gemsReward: 5,
                pointsReward: 6,
                chestName: 'Baú de Prata',
                chestImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBheFuszoYTkx6-rRViLmMV_k2cROw-tUFnDQUHf6IHKZ4Dx6OZVHOCJh9SNnphRxZOgh5264v6QoNEfnucKmBvI2-u3tNRIUuRqKGu2S0SwuV5DuUug71Jqy0e8M3MByOeUjnAvC1_yw0DbX-CDDA2K-0eI38hxh4zVO9zoO2xN8lV1mWZRaIJXd9x3xczNOPms3pIJ6ys50z755S8bQelorywBXrvQv80vSTPfZmCtnD9rTMoi8s4YWv_8D5oa8Rsby--QdA13sU',
                chestColor: 'from-slate-400 to-slate-600 border-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.5)]'
            },
            {
                id: 'd3',
                title: 'Duelo de Gladiador',
                subtitle: 'Vença 1 duelo em qualquer arena competitiva.',
                type: 'daily',
                target: 1,
                current: 0,
                claimed: false,
                xpReward: 120,
                goldReward: 250,
                gemsReward: 15,
                pointsReward: 10,
                chestName: 'Baú de Ouro',
                chestImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEleKpzjcs79tHlpUlyz8zFtNvoJUAdf3eaa8TAlfAiDfhHmYJ45DuX4fk5nm3YHEq75TeCaLKMouuJJ7xjJrto9uj_uPUd-PHM1sMQ8pviBFxV190UK4QnOeRggbySANWT1Q6kBGq5mpPZXdiTgVFYenMJUk1QgJ943FLMx4pjPeay8v0T3prZ8tc6hhBSi32dZGU9TiShS5q9fdiVpeoDGVu4aItmFDnIsWiIJ4963jMoWOYlZhB3tOPTHiuPVRzskzoK0VSnsk',
                chestColor: 'from-yellow-500 to-amber-600 border-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
            },

            // Weekly Missions (1 Fixed, 2 Other)
            {
                id: 'w_fixed',
                title: 'Determinação Diária',
                subtitle: 'Conclua 7 missões diárias para ganhar esta recompensa super especial.',
                type: 'weekly',
                target: 7,
                current: 4, // Tracked dynamically by completedDailiesThisWeek
                claimed: false,
                xpReward: 300,
                goldReward: 600,
                gemsReward: 30,
                pointsReward: 20,
                chestName: 'Baú Gigante',
                chestImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBa22ST1pIkzOB2NguN_mHVDtHvBFancpO8bQ8FCkRkmAkaQE7imYTU7MNj1DPbJJmSntcHDrGCQmRjVarJjAZ95UNfUxiGa-aLbP3749K0Un0KD3qpm2qZiYRVwJwbxDd7MFjeuLJBsjsKRRj_7l5YKNjf4wKxMMgF5jblInmrqjsvfzERMnqxpSR9osfoHV2EvDml9ckMIPmYw7tOqYEnD8FPGCz6CBwkipfKoknAiiizwbsUyspm3XcHzhIQUZComYzFBJcs84w',
                chestColor: 'from-emerald-600 to-emerald-800 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
            },
            {
                id: 'w2',
                title: 'Tsunami de Tetrominos',
                subtitle: 'Destrua um total de 80 linhas em batalhas competitivas.',
                type: 'weekly',
                target: 80,
                current: 24,
                claimed: false,
                xpReward: 400,
                goldReward: 800,
                gemsReward: 40,
                pointsReward: 25,
                chestName: 'Baú Mágico',
                chestImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfeU_eT2-MFQUDgjJIBLdIiqaZ1VB8l9RfcsQ-ufKTsknf2CjKeX8r1YlHtr4nFAuNoUHbdcPeKkk8uGm8J1SVUIPPP-7oXmI4qCkXYbgCxU6EQjI3tPNXBWPJGhU_5BBya488ZbIHfGkoOr3PTuK5QaTp4be5iGNpPhJFbb-5bPRZMAjVcB1GkngBiYDUwCfZDpZNkJRD4PI_A8xl5kR2tIpi-PzDkseERk3Af6XKuT2sQTRKgsbULffu-7r9GLvD9ipIrNYNdCc',
                chestColor: 'from-indigo-600 to-purple-800 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.6)]'
            },
            {
                id: 'w3',
                title: 'Mestre Evolutivo',
                subtitle: 'Efetue 3 upgrades de cartas na aba de Coleção.',
                type: 'weekly',
                target: 3,
                current: 1,
                claimed: false,
                xpReward: 350,
                goldReward: 700,
                gemsReward: 25,
                pointsReward: 15,
                chestName: 'Baú Lendário',
                chestImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCE0GENrPbQakwsSnuGsmyPsXZmykwkMYgnVqAEmf_9yqs7axhPx0VV4a8qVBAvr7uZsxIcDXxgx2XgO0y0Ok-glifYaeQZL69ZWiCevQzj17EyibAxjJlBCde4Rfp5QdZAa4ewuC-_VCZELDvIrRDsESgWNCrRbckXyFOsPd4wcRjD58FmZhd6GlDvNg93vkGrRD8FLqkuRlfpOW2iAnptvbME91sk2MXHGpHd2XP0_sid1fAJgx3vu0Yf0JE-9wsCg7AKzIFXmr0',
                chestColor: 'from-amber-400 via-rose-500 to-indigo-600 border-yellow-300 shadow-[0_0_25px_rgba(245,158,11,0.75)]'
            }
        ];
    });

    // Passe Royale progression
    const [seasonProgress, setSeasonProgress] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('arena_royale_season_progress_v3');
            return saved ? parseInt(saved, 10) : 18;
        }
        return 18;
    });
    const seasonTarget = 60;

    const [isPasseDouradoAdquirido, setIsPasseDouradoAdquirido] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('arena_royale_passe_dourado_v3') === 'true';
        }
        return false;
    });

    const [passeTiers, setPasseTiers] = useState<PasseTier[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('arena_royale_passe_tiers_v4');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) { }
            }
        }
        return [
            {
                id: 1,
                pointsRequired: 10,
                freeReward: { rewardName: 'Moedas Iniciais', rewardType: 'gold', rewardValue: 200, claimed: false, image: '💰' },
                goldReward: { rewardName: 'Cartas Ronin x15', rewardType: 'cards', rewardValue: 15, claimed: false, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQfvz7YRq1Pu-y_-Pkj3RgPbJtjcRMIfSCdcbyFBzDQAC_MRbG-qGR8z83B0Rm0oiYyIh_IvBsFC6lytRpzs1_I0mf7WQLu9wAEuU2dFx3e4DxRR3mmgbr_32REcQuGE7dfm-ua1U86LaLTf0m_E2_GQPNqvviq1_MnqV0W29fIH6n46q44dQ5zsft3RJ2Bvn9jpPyF0C4pYzyzZ6vDREHeVRw2CT-9oHAgGHwR7xFa7tm7flqIC293K6Ba4WjULs0Hu52aAagaZY' }
            },
            {
                id: 2,
                pointsRequired: 20,
                freeReward: { rewardName: 'Baú de Madeira', rewardType: 'chest', rewardValue: 1, claimed: false, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQfvz7YRq1Pu-y_-Pkj3RgPbJtjcRMIfSCdcbyFBzDQAC_MRbG-qGR8z83B0Rm0oiYyIh_IvBsFC6lytRpzs1_I0mf7WQLu9wAEuU2dFx3e4DxRR3mmgbr_32REcQuGE7dfm-ua1U86LaLTf0m_E2_GQPNqvviq1_MnqV0W29fIH6n46q44dQ5zsft3RJ2Bvn9jpPyF0C4pYzyzZ6vDREHeVRw2CT-9oHAgGHwR7xFa7tm7flqIC293K6Ba4WjULs0Hu52aAagaZY' },
                goldReward: { rewardName: 'Balde de Ouro', rewardType: 'gold', rewardValue: 25000, claimed: false, image: '💰' }
            },
            {
                id: 3,
                pointsRequired: 30,
                freeReward: { rewardName: 'Gemas Verdes', rewardType: 'gems', rewardValue: 15, claimed: false, image: '💎' },
                goldReward: { rewardName: 'Baú Mágico', rewardType: 'chest', rewardValue: 1, claimed: false, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfeU_eT2-MFQUDgjJIBLdIiqaZ1VB8l9RfcsQ-ufKTsknf2CjKeX8r1YlHtr4nFAuNoUHbdcPeKkk8uGm8J1SVUIPPP-7oXmI4qCkXYbgCxU6EQjI3tPNXBWPJGhU_5BBya488ZbIHfGkoOr3PTuK5QaTp4be5iGNpPhJFbb-5bPRZMAjVcB1GkngBiYDUwCfZDpZNkJRD4PI_A8xl5kR2tIpi-PzDkseERk3Af6XKuT2sQTRKgsbULffu-7r9GLvD9ipIrNYNdCc' }
            },
            {
                id: 4,
                pointsRequired: 40,
                freeReward: { rewardName: 'Pilha de Ouro', rewardType: 'gold', rewardValue: 500, claimed: false, image: '💰' },
                goldReward: { rewardName: 'Fragmento Curinga x6', rewardType: 'gems', rewardValue: 30, claimed: false, image: '⚡' }
            },
            {
                id: 5,
                pointsRequired: 50,
                freeReward: { rewardName: 'Baú de Prata', rewardType: 'chest', rewardValue: 1, claimed: false, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBheFuszoYTkx6-rRViLmMV_k2cROw-tUFnDQUHf6IHKZ4Dx6OZVHOCJh9SNnphRxZOgh5264v6QoNEfnucKmBvI2-u3tNRIUuRqKGu2S0SwuV5DuUug71Jqy0e8M3MByOeUjnAvC1_yw0DbX-CDDA2K-0eI38hxh4zVO9zoO2xN8lV1mWZRaIJXd9x3xczNOPms3pIJ6ys50z755S8bQelorywBXrvQv80vSTPfZmCtnD9rTMoi8s4YWv_8D5oa8Rsby--QdA13sU' },
                goldReward: { rewardName: 'Curinga Raro x1500', rewardType: 'gold', rewardValue: 1500, claimed: false, image: '🃏' }
            },
            {
                id: 6,
                pointsRequired: 60,
                freeReward: { rewardName: 'Super Pack Gemas', rewardType: 'gems', rewardValue: 50, claimed: false, image: '💎' },
                goldReward: { rewardName: 'Baú Lendário', rewardType: 'chest', rewardValue: 1, claimed: false, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCE0GENrPbQakwsSnuGsmyPsXZmykwkMYgnVqAEmf_9yqs7axhPx0VV4a8qVBAvr7uZsxIcDXxgx2XgO0y0Ok-glifYaeQZL69ZWiCevQzj17EyibAxjJlBCde4Rfp5QdZAa4ewuC-_VCZELDvIrRDsESgWNCrRbckXyFOsPd4wcRjD58FmZhd6GlDvNg93vkGrRD8FLqkuRlfpOW2iAnptvbME91sk2MXHGpHd2XP0_sid1fAJgx3vu0Yf0JE-9wsCg7AKzIFXmr0' }
            }
        ];
    });

    // Ensure fixed weekly mission always matches completed dailies count
    useEffect(() => {
        setMissions(prev => prev.map(m => {
            if (m.id === 'w_fixed') {
                return { ...m, current: Math.min(m.target, completedDailiesThisWeek) };
            }
            return m;
        }));
    }, [completedDailiesThisWeek]);

    // Persist state
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('arena_royale_missions_v4', JSON.stringify(missions));
        }
    }, [missions]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('arena_royale_season_progress_v3', seasonProgress.toString());
        }
    }, [seasonProgress]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('arena_royale_passe_tiers_v4', JSON.stringify(passeTiers));
        }
    }, [passeTiers]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('arena_royale_passe_dourado_v3', isPasseDouradoAdquirido.toString());
        }
    }, [isPasseDouradoAdquirido]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('arena_royale_dailies_week_v2', completedDailiesThisWeek.toString());
        }
    }, [completedDailiesThisWeek]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('arena_royale_dailies_month_v2', completedDailiesMonthly.toString());
        }
    }, [completedDailiesMonthly]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('arena_royale_monthly_claimed_v2', monthlyClaimed.toString());
        }
    }, [monthlyClaimed]);

    // Handle Tab changes
    const handleTabClick = (tab: 'daily' | 'weekly' | 'passe') => {
        soundManager.playMove();
        setActiveTab(tab);
    };

    // Simulate advancing mission progress manually
    const handleProgressMission = (missionId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        soundManager.playMove();
        setMissions(prev => prev.map(m => {
            if (m.id === missionId && m.current < m.target && !m.claimed) {
                let step = 1;
                if (m.target >= 10) step = Math.ceil(m.target / 5);
                const nextVal = Math.min(m.target, m.current + step);
                if (nextVal === m.target) {
                    soundManager.playLineClear();
                }
                return { ...m, current: nextVal };
            }
            return m;
        }));
    };

    // Skip or Auto-Complete a mission for quick testing
    const handleCompleteMission = (missionId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        soundManager.playTetris();
        setMissions(prev => prev.map(m => {
            if (m.id === missionId && !m.claimed) {
                return { ...m, current: m.target };
            }
            return m;
        }));
    };

    // Claim a completed mission's chest/rewards
    const handleClaimReward = (m: Mission, e: React.MouseEvent) => {
        e.stopPropagation();
        soundManager.playHold();

        // Trigger chest award presentation
        setOpeningChest({
            name: m.chestName,
            color: m.chestColor,
            image: m.chestImage,
            xp: m.xpReward,
            gold: m.goldReward,
            gems: m.gemsReward
        });

        // Mark mission as claimed
        setMissions(prev => prev.map(item => {
            if (item.id === m.id) {
                return { ...item, claimed: true };
            }
            return item;
        }));

        // Update global profile
        onUpdateProfile({
            xp: profile.xp + m.xpReward,
            gold: profile.gold + m.goldReward,
            gems: profile.gems + m.gemsReward
        });

        // Advance Passe Royale Points
        setSeasonProgress(prev => Math.min(seasonTarget, prev + m.pointsReward));

        // If it was a daily mission, increment our completed daily counters!
        if (m.type === 'daily') {
            setCompletedDailiesThisWeek(prev => Math.min(7, prev + 1));
            setCompletedDailiesMonthly(prev => Math.min(40, prev + 1));
        }
    };

    // Claim Passe Royale Tier Reward
    const handleClaimTierReward = (tierId: number, track: 'free' | 'gold', e: React.MouseEvent) => {
        e.stopPropagation();
        const tier = passeTiers.find(t => t.id === tierId);
        if (!tier) return;

        const reward = track === 'free' ? tier.freeReward : tier.goldReward;
        const isUnlocked = seasonProgress >= tier.pointsRequired;
        const isClaimed = reward.claimed;

        if (!isUnlocked || isClaimed) return;
        if (track === 'gold' && !isPasseDouradoAdquirido) return;

        soundManager.playLevelUp();

        let goldAdd = 0;
        let gemsAdd = 0;
        let xpAdd = 50;

        if (reward.rewardType === 'gold') goldAdd = reward.rewardValue;
        if (reward.rewardType === 'gems') gemsAdd = reward.rewardValue;
        if (reward.rewardType === 'chest') {
            goldAdd = tier.id === 6 ? 1000 : 300;
            gemsAdd = tier.id === 6 ? 50 : 15;
            xpAdd = tier.id === 6 ? 250 : 100;
        }
        if (reward.rewardType === 'cards') {
            goldAdd = 200;
            xpAdd = 150;
        }

        // Set opening chest popup
        setOpeningChest({
            name: reward.rewardName,
            color: track === 'gold' ? 'from-amber-400 via-orange-500 to-amber-700' : 'from-indigo-600 to-purple-800',
            image: reward.rewardType === 'chest' ? reward.image : 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEleKpzjcs79tHlpUlyz8zFtNvoJUAdf3eaa8TAlfAiDfhHmYJ45DuX4fk5nm3YHEq75TeCaLKMouuJJ7xjJrto9uj_uPUd-PHM1sMQ8pviBFxV190UK4QnOeRggbySANWT1Q6kBGq5mpPZXdiTgVFYenMJUk1QgJ943FLMx4pjPeay8v0T3prZ8tc6hhBSi32dZGU9TiShS5q9fdiVpeoDGVu4aItmFDnIsWiIJ4963jMoWOYlZhB3tOPTHiuPVRzskzoK0VSnsk',
            xp: xpAdd,
            gold: goldAdd,
            gems: gemsAdd,
            badge: tier.id === 6 && track === 'gold' ? 'Pioneiro Real' : undefined
        });

        // Mark tier as claimed
        setPasseTiers(prev => prev.map(t => {
            if (t.id === tierId) {
                if (track === 'free') {
                    return { ...t, freeReward: { ...t.freeReward, claimed: true } };
                } else {
                    return { ...t, goldReward: { ...t.goldReward, claimed: true } };
                }
            }
            return t;
        }));

        // Update profile
        onUpdateProfile({
            xp: profile.xp + xpAdd,
            gold: profile.gold + goldAdd,
            gems: profile.gems + gemsAdd
        });
    };

    // Claim Monthly Grand Reward (40 completed daily missions)
    const handleClaimMonthlyReward = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (completedDailiesMonthly < 40 || monthlyClaimed) return;

        soundManager.playTetris();

        setOpeningChest({
            name: 'Baú Lendário Mensal',
            color: 'from-amber-400 via-rose-500 to-indigo-600 border-yellow-300 shadow-[0_0_25px_rgba(245,158,11,0.75)]',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCE0GENrPbQakwsSnuGsmyPsXZmykwkMYgnVqAEmf_9yqs7axhPx0VV4a8qVBAvr7uZsxIcDXxgx2XgO0y0Ok-glifYaeQZL69ZWiCevQzj17EyibAxjJlBCde4Rfp5QdZAa4ewuC-_VCZELDvIrRDsESgWNCrRbckXyFOsPd4wcRjD58FmZhd6GlDvNg93vkGrRD8FLqkuRlfpOW2iAnptvbME91sk2MXHGpHd2XP0_sid1fAJgx3vu0Yf0JE-9wsCg7AKzIFXmr0',
            xp: 500,
            gold: 1500,
            gems: 100,
            badge: 'Campeão da Temporada'
        });

        setMonthlyClaimed(true);

        onUpdateProfile({
            xp: profile.xp + 500,
            gold: profile.gold + 1500,
            gems: profile.gems + 100
        });
    };

    // Helper button to simulate completing a daily for easy testing
    const handleSimulateDailyCompletion = (e: React.MouseEvent) => {
        e.stopPropagation();
        soundManager.playMove();
        setCompletedDailiesThisWeek(prev => Math.min(7, prev + 1));
        setCompletedDailiesMonthly(prev => Math.min(40, prev + 1));
    };

    const resetAllMissionsSim = () => {
        soundManager.playRotate();
        setMissions(prev => prev.map(m => ({ ...m, current: 0, claimed: false })));
        setSeasonProgress(5);
        setCompletedDailiesThisWeek(0);
        setCompletedDailiesMonthly(0);
        setMonthlyClaimed(false);
        setIsPasseDouradoAdquirido(false);
        setPasseTiers(prev => prev.map(t => ({
            ...t,
            freeReward: { ...t.freeReward, claimed: false },
            goldReward: { ...t.goldReward, claimed: false }
        })));
    };

    const handleCloseChestAward = () => {
        soundManager.playScoreSaved();
        setOpeningChest(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] bg-slate-950/95 md:bg-slate-950/85 md:backdrop-blur-sm flex items-center justify-center font-sans overflow-hidden p-0 md:p-6 select-none" id="missions-modal-container">

            {/* Background Graphic Pattern */}
            <div
                className="absolute inset-0 z-0 opacity-15 pointer-events-none md:rounded-[2rem]"
                style={{
                    backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAKNhRMaQRBLOVDBSB6Y9zT6KeBJWTqJPEV8J2oYo-rVytUTbwYxpbDvv-oFgvbcL0s3HZbx1u2-zE3dDusALTGWv-XHMJdBgB0kiQwjuObalYwkuGE9k0A3vWLlVUrOE67rOuoNJdIB9eVlCueLZKfBEj3IpCPqqMP0o5L0gZ_19_XyZExy3782vyuqY73W9URvgrTuhkjTY38O8rbMIf4kAWswYgRs_pn8sxUNv-yo-1VEGJcSTiCeoved-e8aoZjOr84kvHd7gY')",
                    backgroundRepeat: 'repeat',
                }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#1b0a3c]/35 via-slate-950/90 to-slate-950 pointer-events-none md:rounded-[2rem]" />

            {/* Main Constraint Modal Panel styled as an epic Clash Royale-style UI - FULLSCREEN */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full md:max-w-4xl md:h-[85vh] md:rounded-[2rem] md:border-4 md:border-purple-600 bg-gradient-to-b from-[#181135] to-[#090514] overflow-hidden flex flex-col relative z-10 md:shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            >

                {/* Decorative Golden Top Arc Trim */}
                <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 w-full relative z-30" />

                {/* Custom Header with dynamic, visually rich Tabs row */}
                <header className="relative z-20 flex flex-col pt-4 pb-0 bg-[#251a4b]/80 backdrop-blur-xl border-b border-purple-500/25 shadow-[0_4px_25px_rgba(0,0,0,0.5)] w-full">
                    <div className="w-full max-w-xl md:max-w-4xl mx-auto px-4 flex flex-col">

                        {/* Top Title & Close Button Row */}
                        <div className="flex justify-between items-center mb-4 px-1">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-md">
                                    <Trophy className="w-5 h-5 fill-slate-950/20" />
                                </span>
                                <div>
                                    <h1 className="font-serif font-black text-[17px] text-white tracking-wide leading-none uppercase">
                                        MISSÕES & RECOMPENSAS
                                    </h1>
                                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mt-0.5">
                                        Temporada de Maio
                                    </p>
                                </div>
                            </div>

                            {/* Close button */}
                            <button
                                onClick={() => {
                                    soundManager.playMove();
                                    onClose();
                                }}
                                className="w-9 h-9 bg-red-500/15 hover:bg-red-500/30 text-red-400 flex items-center justify-center rounded-xl hover:text-white transition-all backdrop-blur-md border border-red-500/35 active:scale-90 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Nav Tabs - EXACTLY 3 Tabs (daily, weekly, passe) */}
                        <div className="flex gap-1.5">
                            {/* Tab: Diárias */}
                            <button
                                onClick={() => handleTabClick('daily')}
                                className={`flex-1 py-3.5 rounded-t-xl text-[10px] font-black tracking-widest flex flex-col items-center gap-1 transition-all relative ${activeTab === 'daily'
                                        ? 'bg-purple-600 text-white shadow-[0_-3px_15px_rgba(168,85,247,0.35)]'
                                        : 'text-slate-400 hover:text-purple-300 hover:bg-purple-950/20'
                                    }`}
                            >
                                <Calendar className="w-4 h-4" />
                                DIÁRIAS
                                {activeTab === 'daily' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber-400" />
                                )}
                            </button>

                            {/* Tab: Semanais */}
                            <button
                                onClick={() => handleTabClick('weekly')}
                                className={`flex-1 py-3.5 rounded-t-xl text-[10px] font-black tracking-widest flex flex-col items-center gap-1 transition-all relative ${activeTab === 'weekly'
                                        ? 'bg-purple-600 text-white shadow-[0_-3px_15px_rgba(168,85,247,0.35)]'
                                        : 'text-slate-400 hover:text-purple-300 hover:bg-purple-950/20'
                                    }`}
                            >
                                <Layers className="w-4 h-4" />
                                SEMANAIS
                                {activeTab === 'weekly' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber-400" />
                                )}
                            </button>

                            {/* Tab: Passe Royale */}
                            <button
                                onClick={() => handleTabClick('passe')}
                                className={`flex-1 py-3.5 rounded-t-xl text-[10px] font-black tracking-widest flex flex-col items-center gap-1 transition-all relative ${activeTab === 'passe'
                                        ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-slate-950 shadow-[0_-3px_15px_rgba(245,158,11,0.3)] font-black'
                                        : 'text-slate-400 hover:text-amber-400 hover:bg-amber-950/10'
                                    }`}
                            >
                                <Award className="w-4 h-4" />
                                PASSE ROYALE
                                {activeTab === 'passe' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white" />
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Scrollable Main Content Container */}
                <main className="flex-1 overflow-y-auto pb-24 md:pb-8 pt-4 px-4 flex flex-col gap-4 scrollbar-thin w-full max-w-xl md:max-w-4xl mx-auto">

                    {/* Active Views */}
                    <div className="flex flex-col gap-3">

                        {/* ====== DAILY MISSIONS (EXACTLY 3) ====== */}
                        {activeTab === 'daily' && (
                            <div className="flex flex-col md:grid md:grid-cols-12 md:gap-5 animate-fade-in">

                                {/* Daily Rewards Promo Header */}
                                <div className="md:col-span-4 bg-purple-950/20 border border-purple-500/15 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden flex-col text-center justify-center min-h-[220px]">
                                    <div className="flex flex-col gap-0.5 items-center">
                                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Desafio Diário</span>
                                        <h4 className="font-serif font-black text-[15px] text-white uppercase">RECOMPENSA COMPLETA</h4>
                                        <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Conclua as 3 missões hoje para pontuar muito!</p>
                                    </div>
                                    <div className="shrink-0 mt-3 text-center">
                                        <button
                                            onClick={handleSimulateDailyCompletion}
                                            className="bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 font-extrabold text-[9px] border border-purple-500/20 px-2.5 py-1.5 rounded-lg uppercase tracking-tight transition-all active:scale-95 cursor-pointer"
                                        >
                                            +1 Simulação
                                        </button>
                                    </div>
                                </div>

                                <div className="md:col-span-8 flex flex-col gap-3">
                                    <div className="flex justify-between items-center pl-1">
                                        <h3 className="font-serif font-black text-[13px] text-white uppercase tracking-wider">
                                            MISSÕES DO DIA (3 ATIVAS)
                                        </h3>
                                        <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                                            Dailies concluídas hoje: {missions.filter(m => m.type === 'daily' && m.claimed).length}/3
                                        </span>
                                    </div>

                                    {missions.filter(m => m.type === 'daily').map((m) => {
                                        const isCompleted = m.current >= m.target;
                                        const pct = Math.min(100, (m.current / m.target) * 100);

                                        return (
                                            <article
                                                key={m.id}
                                                onClick={(e) => handleProgressMission(m.id, e)}
                                                className={`relative overflow-hidden rounded-2xl p-4 border transition-all duration-300 cursor-pointer flex flex-col gap-3 group ${m.claimed
                                                        ? 'bg-slate-950/40 border-slate-900 opacity-60'
                                                        : isCompleted
                                                            ? 'bg-purple-950/30 border-purple-500/40 shadow-[0_4px_15px_rgba(168,85,247,0.15)] hover:border-purple-400'
                                                            : 'bg-slate-900/80 border-purple-500/10 hover:border-purple-500/25 hover:translate-y-[-2px]'
                                                    }`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1">
                                                        <h4 className={`text-[13.5px] font-bold tracking-wide transition-colors ${m.claimed ? 'text-slate-500 line-through' : isCompleted ? 'text-amber-400' : 'text-slate-100 group-hover:text-white'
                                                            }`}>
                                                            {m.title}
                                                        </h4>
                                                        <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">
                                                            {m.subtitle}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    {m.claimed ? (
                                                        <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold uppercase tracking-wider text-[10px]">
                                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                            Recompensa Resgatada! (+ XP de Passe)
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-purple-500/10 p-[1px]">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all duration-300"
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[11px] font-black text-slate-300 font-mono tracking-wider shrink-0">
                                                                {m.current} / {m.target}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Rewards footer inside card */}
                                                <div className="flex justify-between items-center pt-2.5 border-t border-purple-500/10 min-h-[36px]">
                                                    <div className="flex items-center gap-2">
                                                        {visibleRewards[m.id] ? (
                                                            <div className="flex items-center gap-1.5 animate-fade-in">
                                                                <div className="flex items-center gap-0.5 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-500/15">
                                                                    <Zap className="w-3 h-3 text-indigo-400" />
                                                                    <span className="text-[9px] font-black text-indigo-300">+{m.xpReward} XP</span>
                                                                </div>
                                                                <div className="flex items-center gap-0.5 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/15">
                                                                    <Coins className="w-3 h-3 text-amber-400" />
                                                                    <span className="text-[9px] font-black text-amber-300">+{m.goldReward}</span>
                                                                </div>
                                                                {m.gemsReward > 0 && (
                                                                    <div className="flex items-center gap-0.5 bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-500/15">
                                                                        <Gem className="w-3 h-3 text-teal-400" />
                                                                        <span className="text-[9px] font-black text-teal-300">+{m.gemsReward}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-0.5 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-500/15">
                                                                    <Award className="w-3 h-3 text-purple-400" />
                                                                    <span className="text-[9px] font-black text-purple-300">+{m.pointsReward} PTS</span>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => toggleRewardsVisibility(m.id, e)}
                                                                    className="p-1 rounded bg-slate-950/40 hover:bg-slate-950/80 border border-purple-500/10 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                                                                    title="Ocultar detalhes"
                                                                >
                                                                    <Info className="w-3 h-3 text-amber-400" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => toggleRewardsVisibility(m.id, e)}
                                                                className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 hover:text-amber-400 bg-slate-950/40 hover:bg-slate-950/80 px-2.5 py-1 rounded-lg border border-purple-500/10 hover:border-amber-500/25 transition-all cursor-pointer"
                                                                title="Ver recompensas secundárias"
                                                            >
                                                                <Info className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                                                                <span>RECOMPENSAS</span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        {isCompleted && !m.claimed ? (
                                                            <button
                                                                onClick={(e) => handleClaimReward(m, e)}
                                                                className="bg-green-500 hover:bg-green-400 text-slate-950 text-[10px] font-black px-3.5 py-2 rounded-xl border border-white/20 uppercase tracking-wider shadow-[0_3px_0_#15803d] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer animate-bounce"
                                                            >
                                                                Resgatar
                                                            </button>
                                                        ) : !m.claimed ? (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={(e) => handleCompleteMission(m.id, e)}
                                                                    className="text-[8.5px] font-black bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/20 text-purple-300 px-2 py-1 rounded-lg uppercase tracking-tight transition-all"
                                                                >
                                                                    Completar
                                                                </button>
                                                                <img
                                                                    src={m.chestImage}
                                                                    alt={m.chestName}
                                                                    className="w-8 h-8 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-8 flex items-center justify-center bg-slate-950/40 border border-slate-900 rounded-xl opacity-40">
                                                                <CheckCircle2 className="w-5 h-5 text-slate-600" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ====== WEEKLY & MONTHLY TAB ====== */}
                        {activeTab === 'weekly' && (
                            <div className="flex flex-col md:grid md:grid-cols-12 md:gap-5 animate-fade-in">

                                {/* PERSISTENT MONTHLY MISSION COUNTER CARD */}
                                <section className="md:col-span-4 bg-gradient-to-r from-[#2c134d] via-[#1f0d36] to-[#120721] border-2 border-amber-500/40 rounded-2xl p-4.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)] relative overflow-hidden group flex flex-col justify-between min-h-[300px]">
                                    <div className="absolute top-[-50%] right-[-20%] w-60 h-60 bg-amber-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-amber-500/15 transition-all duration-700" />

                                    <div className="flex justify-between items-start mb-3 relative z-10 flex-col gap-2">
                                        <div>
                                            <div className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-500/20 w-fit px-2 py-0.5 rounded-full mb-1">
                                                <Trophy className="w-3 h-3 text-amber-400" />
                                                <span className="font-sans font-black text-[8px] text-amber-300 tracking-wider">MISSÃO MENSAL</span>
                                            </div>
                                            <h2 className="font-serif font-black text-[16px] text-white uppercase tracking-wide leading-none">
                                                GLÓRIA DA TEMPORADA
                                            </h2>
                                            <p className="text-[10.5px] text-slate-300 mt-1 leading-normal">
                                                Conclua <span className="text-amber-400 font-bold">40 missões diárias</span> para completar a missão mensal de Maio.
                                            </p>
                                        </div>

                                        <div className="shrink-0 flex flex-col items-center gap-1 self-start">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded-md border border-purple-500/10">
                                                3 DIAS RESTANTES
                                            </span>
                                        </div>
                                    </div>

                                    {/* Slider Progress counter */}
                                    <div className="flex flex-col gap-1 relative z-10 my-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-3 bg-slate-950 rounded-full overflow-hidden border border-purple-500/10 p-[1px]">
                                                <div
                                                    className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)] transition-all duration-500 rounded-full"
                                                    style={{ width: `${(completedDailiesMonthly / 40) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-black text-amber-300 font-serif whitespace-nowrap tracking-wider">
                                                {completedDailiesMonthly} / 40
                                            </span>
                                        </div>
                                    </div>

                                    {/* Reward claim indicators / actions */}
                                    <div className="flex justify-between items-center pt-2.5 border-t border-purple-500/15 relative z-10 flex-col gap-3 items-stretch text-center">
                                        <div className="flex items-center gap-2 justify-center">
                                            <div className="flex items-center gap-1 bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-500/20">
                                                <Coins className="w-3.5 h-3.5 text-amber-400" />
                                                <span className="text-[11px] font-black text-amber-300">+1.500</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-teal-950/60 px-2.5 py-1 rounded-xl border border-teal-500/20">
                                                <Gem className="w-3.5 h-3.5 text-teal-400" />
                                                <span className="text-[11px] font-black text-teal-300">+100</span>
                                            </div>
                                        </div>

                                        <div className="text-center flex justify-center">
                                            {monthlyClaimed ? (
                                                <div className="flex items-center gap-1 text-xs text-green-400 font-bold uppercase tracking-widest text-[9px] bg-green-950/30 px-2.5 py-1.5 rounded-xl border border-green-500/20">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                    CONCLUÍDO!
                                                </div>
                                            ) : completedDailiesMonthly >= 40 ? (
                                                <button
                                                    onClick={handleClaimMonthlyReward}
                                                    className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-[10px] font-black px-4 py-2 rounded-xl border border-slate-950 uppercase tracking-widest shadow-[0_3px_0_#9a3412] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer animate-bounce"
                                                >
                                                    RESGATAR BAÚ EMPREGADO
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-1.5 justify-center">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recompensa:</span>
                                                    <img
                                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCE0GENrPbQakwsSnuGsmyPsXZmykwkMYgnVqAEmf_9yqs7axhPx0VV4a8qVBAvr7uZsxIcDXxgx2XgO0y0Ok-glifYaeQZL69ZWiCevQzj17EyibAxjJlBCde4Rfp5QdZAa4ewuC-_VCZELDvIrRDsESgWNCrRbckXyFOsPd4wcRjD58FmZhd6GlDvNg93vkGrRD8FLqkuRlfpOW2iAnptvbME91sk2MXHGpHd2XP0_sid1fAJgx3vu0Yf0JE-9wsCg7AKzIFXmr0"
                                                        alt="Baú Lendário"
                                                        className="w-10 h-10 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] cursor-help hover:scale-110 transition-transform"
                                                        title="Baú Lendário de Fim de Mês"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <div className="md:col-span-8 flex flex-col gap-3">
                                    <div className="flex justify-between items-center pl-1">
                                        <h3 className="font-serif font-black text-[13px] text-white uppercase tracking-wider">
                                            MISSÕES SEMANAIS (1 FIXA + 2 VARIADAS)
                                        </h3>
                                    </div>

                                    {/* List of Weekly Missions */}
                                    {missions.filter(m => m.type === 'weekly').map((m) => {
                                        const isCompleted = m.current >= m.target;
                                        const pct = Math.min(100, (m.current / m.target) * 100);

                                        // Fixed mission label
                                        const isFixed = m.id === 'w_fixed';

                                        return (
                                            <article
                                                key={m.id}
                                                onClick={(e) => {
                                                    // For the fixed mission, we can simulate daily completion to increase this!
                                                    if (isFixed) {
                                                        handleSimulateDailyCompletion(e);
                                                    } else {
                                                        handleProgressMission(m.id, e);
                                                    }
                                                }}
                                                className={`relative overflow-hidden rounded-2xl p-4 border transition-all duration-300 cursor-pointer flex flex-col gap-3 group ${m.claimed
                                                        ? 'bg-slate-950/40 border-slate-900 opacity-60'
                                                        : isCompleted
                                                            ? 'bg-purple-950/30 border-purple-500/40 shadow-[0_4px_15px_rgba(168,85,247,0.15)] hover:border-purple-400'
                                                            : isFixed
                                                                ? 'bg-gradient-to-b from-[#1c1240]/60 to-[#100a2b]/80 border-purple-500/25 hover:border-purple-500/45'
                                                                : 'bg-slate-900/80 border-purple-500/10 hover:border-purple-500/25 hover:translate-y-[-2px]'
                                                    }`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                                {isFixed && (
                                                    <div className="absolute top-2 right-2 bg-purple-500/15 text-purple-300 font-extrabold text-[8px] border border-purple-500/35 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                        Missão Fixa Semanal
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1">
                                                        <h4 className={`text-[13.5px] font-bold tracking-wide transition-colors ${m.claimed ? 'text-slate-500 line-through' : isCompleted ? 'text-amber-400' : 'text-slate-100 group-hover:text-white'
                                                            }`}>
                                                            {m.title}
                                                        </h4>
                                                        <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">
                                                            {m.subtitle}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    {m.claimed ? (
                                                        <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold uppercase tracking-wider text-[10px]">
                                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                            Recompensa Resgatada!
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-purple-500/10 p-[1px]">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[11px] font-black text-slate-300 font-mono tracking-wider shrink-0">
                                                                {m.current} / {m.target}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Reward description & actions */}
                                                <div className="flex justify-between items-center pt-2.5 border-t border-purple-500/10 min-h-[36px]">
                                                    <div className="flex items-center gap-1.5">
                                                        {visibleRewards[m.id] ? (
                                                            <div className="flex items-center gap-1.5 animate-fade-in">
                                                                <div className="flex items-center gap-0.5 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-500/15">
                                                                    <Zap className="w-3 h-3 text-indigo-400" />
                                                                    <span className="text-[9px] font-black text-indigo-300">+{m.xpReward} XP</span>
                                                                </div>
                                                                <div className="flex items-center gap-0.5 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/15">
                                                                    <Coins className="w-3 h-3 text-amber-400" />
                                                                    <span className="text-[9px] font-black text-amber-300">+{m.goldReward}</span>
                                                                </div>
                                                                <div className="flex items-center gap-0.5 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-500/15">
                                                                    <Award className="w-3 h-3 text-purple-400" />
                                                                    <span className="text-[9px] font-black text-purple-300">+{m.pointsReward} PTS</span>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => toggleRewardsVisibility(m.id, e)}
                                                                    className="p-1 rounded bg-slate-950/40 hover:bg-slate-950/80 border border-purple-500/10 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                                                                    title="Ocultar detalhes"
                                                                >
                                                                    <Info className="w-3 h-3 text-amber-400" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => toggleRewardsVisibility(m.id, e)}
                                                                className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 hover:text-amber-400 bg-slate-950/40 hover:bg-slate-950/80 px-2.5 py-1 rounded-lg border border-purple-500/10 hover:border-amber-500/25 transition-all cursor-pointer"
                                                                title="Ver recompensas secundárias"
                                                            >
                                                                <Info className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                                                                <span>RECOMPENSAS</span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        {isCompleted && !m.claimed ? (
                                                            <button
                                                                onClick={(e) => handleClaimReward(m, e)}
                                                                className="bg-green-500 hover:bg-green-400 text-slate-950 text-[10px] font-black px-3.5 py-2 rounded-xl border border-white/20 uppercase tracking-wider shadow-[0_3px_0_#15803d] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer animate-bounce"
                                                            >
                                                                Resgatar
                                                            </button>
                                                        ) : !m.claimed ? (
                                                            <div className="flex items-center gap-1">
                                                                {isFixed ? (
                                                                    <button
                                                                        onClick={handleSimulateDailyCompletion}
                                                                        className="text-[8.5px] font-black bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/20 text-purple-300 px-2 py-1 rounded-lg uppercase tracking-tight transition-all"
                                                                    >
                                                                        +1 Diária
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={(e) => handleCompleteMission(m.id, e)}
                                                                        className="text-[8.5px] font-black bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/20 text-purple-300 px-2 py-1 rounded-lg uppercase tracking-tight transition-all"
                                                                    >
                                                                        Completar
                                                                    </button>
                                                                )}
                                                                <img
                                                                    src={m.chestImage}
                                                                    alt={m.chestName}
                                                                    className="w-8 h-8 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-8 flex items-center justify-center bg-slate-950/40 border border-slate-900 rounded-xl opacity-40">
                                                                <CheckCircle2 className="w-5 h-5 text-slate-600" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ====== PASSE ROYALE TAB ====== */}
                        {activeTab === 'passe' && (
                            <div className="flex flex-col gap-3 animate-fade-in flex-1 min-h-0">

                                {/* Clash Royale Style Header Banner */}
                                <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-[#451254] to-red-900 rounded-2xl p-3 border-2 border-yellow-500/40 shadow-[0_8px_20px_rgba(0,0,0,0.5)] select-none">
                                    <div
                                        className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-overlay"
                                        style={{
                                            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAKNhRMaQRBLOVDBSB6Y9zT6KeBJWTqJPEV8J2oYo-rVytUTbwYxpbDvv-oFgvbcL0s3HZbx1u2-zE3dDusALTGWv-XHMJdBgB0kiQwjuObalYwkuGE9k0A3vWLlVUrOE67rOuoNJdIB9eVlCueLZKfBEj3IpCPqqMP0o5L0gZ_19_XyZExy3782vyuqY73W9URvgrTuhkjTY38O8rbMIf4kAWswYgRs_pn8sxUNv-yo-1VEGJcSTiCeoved-e8aoZjOr84kvHd7gY')",
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}
                                    />
                                    {/* Rays overlay */}
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(253,224,71,0.2),transparent_70%)] pointer-events-none" />

                                    <div className="relative z-10 flex justify-between items-center gap-2">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1 mb-0.5">
                                                <Trophy className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/20" />
                                                <span className="font-sans font-black text-[9px] text-yellow-400 tracking-wider uppercase text-shadow">PASSE ROYALE</span>
                                            </div>
                                            <h3 className="font-serif font-black text-sm text-white tracking-wide uppercase leading-tight text-shadow-lg">
                                                TEMPORADA 1: HONRA E EXÍLIO
                                            </h3>
                                            <div className="flex items-center gap-1 text-[9px] text-purple-200 mt-0.5">
                                                <Calendar className="w-3 h-3 text-purple-300" />
                                                <span>Termina em: <strong className="text-yellow-400">27d 11h</strong></span>
                                            </div>
                                        </div>

                                        {/* UPGRADE BUTTON (MELHORAR) */}
                                        <div className="shrink-0">
                                            {isPasseDouradoAdquirido ? (
                                                <div className="bg-gradient-to-b from-yellow-300 to-amber-500 text-slate-950 font-black text-[9px] px-3 py-1.5 rounded-xl border border-yellow-200 uppercase tracking-widest shadow-md flex items-center gap-1 animate-pulse">
                                                    <Crown className="w-3.5 h-3.5 fill-slate-950/20" />
                                                    <span>DOURADO ATIVO</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        soundManager.playLevelUp();
                                                        setIsPasseDouradoAdquirido(true);
                                                    }}
                                                    className="bg-gradient-to-b from-green-400 to-emerald-600 hover:from-green-300 hover:to-emerald-500 text-white font-serif font-black text-[11px] px-4 py-2.5 rounded-xl border-2 border-white/20 uppercase tracking-wide shadow-[0_4px_0_#065f46] hover:shadow-[0_5px_0_#065f46] active:translate-y-1 active:shadow-none transition-all cursor-pointer relative"
                                                >
                                                    <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10 rounded-t-xl pointer-events-none" />
                                                    MELHORAR
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Crown progress bar widget */}
                                <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-2.5 rounded-xl border border-purple-500/10 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        {/* Level shield */}
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 border border-yellow-200 flex items-center justify-center font-serif font-black text-slate-950 text-xs shadow-md shrink-0">
                                            {Math.min(6, Math.floor(seasonProgress / 10))}
                                        </div>
                                        {/* Crown capsule */}
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">RECOMPENSA SEGUINTE</span>
                                            <span className="text-[11px] font-bold text-white mt-0.5">
                                                Tier {Math.min(6, Math.floor(seasonProgress / 10) + 1)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* High contrast yellow/orange progress bar */}
                                    <div className="flex-1 max-w-[140px] flex flex-col gap-1">
                                        <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-wider">
                                            <span>Coroas</span>
                                            <span className="text-amber-400 font-mono font-bold">{seasonProgress % 10}/10</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-purple-500/10 p-[1px] relative">
                                            <div
                                                className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                                style={{ width: `${(seasonProgress % 10) * 10}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Total Progress Status */}
                                    <div className="text-right shrink-0">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">TOTAL ACUMULADO</span>
                                        <span className="font-serif font-black text-[13px] text-amber-400 tracking-wider">
                                            {seasonProgress} <span className="text-[9px] font-sans font-bold text-slate-400 uppercase">/ 60 PTS</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Columns titles splitting Free vs Gold tracks */}
                                <div className="grid grid-cols-11 px-2.5 text-center font-black uppercase tracking-widest text-[9px] leading-none mb-1">
                                    <span className="col-span-5 text-emerald-400">Passe Grátis</span>
                                    <span className="col-span-1 text-slate-500 font-serif">Tier</span>
                                    <span className="col-span-5 text-amber-400 flex items-center justify-center gap-1">
                                        Passe Dourado
                                        {!isPasseDouradoAdquirido && <Shield className="w-2.5 h-2.5 text-amber-500 fill-amber-500/10" />}
                                    </span>
                                </div>

                                {/* Double Track Arena / Pass Road Scrollable Body */}
                                <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col md:grid md:grid-cols-2 gap-2.5 md:gap-4 relative custom-scrollbar">

                                    {/* Vertical chain rope down the center of column 6 */}
                                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[4px] bg-slate-950/60 border-l border-r border-yellow-600/30 z-0 pointer-events-none md:hidden" />

                                    {passeTiers.map((tier) => {
                                        const isUnlocked = seasonProgress >= tier.pointsRequired;

                                        // Free Track State
                                        const isFreeClaimed = tier.freeReward.claimed;
                                        const canFreeClaim = isUnlocked && !isFreeClaimed;

                                        // Gold Track State
                                        const isGoldClaimed = tier.goldReward.claimed;
                                        const canGoldClaim = isUnlocked && isPasseDouradoAdquirido && !isGoldClaimed;

                                        return (
                                            <div key={tier.id} className="grid grid-cols-11 md:grid-cols-2 items-center md:items-stretch gap-1.5 md:gap-3.5 relative z-10 bg-transparent md:bg-[#120a27]/90 md:border md:border-purple-500/15 md:rounded-3xl md:p-4 md:shadow-lg">

                                                {/* Desktop Only Tier Header */}
                                                <div className="hidden md:flex col-span-11 md:col-span-2 justify-between items-center pb-2 border-b border-purple-500/10 mb-1 select-none">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full border font-serif font-black text-[10px] flex items-center justify-center shadow-md ${isUnlocked
                                                                ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 border-yellow-200 text-slate-950'
                                                                : 'bg-slate-950 border-purple-500/20 text-slate-500'
                                                            }`}>
                                                            {tier.id}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">Tier {tier.id}</span>
                                                    </div>
                                                    <span className="text-[8px] font-mono text-purple-300 font-bold bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/10">
                                                        {tier.pointsRequired} PTS REQUERIDOS
                                                    </span>
                                                </div>

                                                {/* ================= LEFT: FREE REWARD CARD ================= */}
                                                <div className="col-span-5 md:col-span-1">
                                                    <div
                                                        className={`p-2 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col items-center text-center h-full justify-between ${isFreeClaimed
                                                                ? 'bg-slate-950/40 border-slate-900/60 opacity-55'
                                                                : canFreeClaim
                                                                    ? 'bg-[#122e23] border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:scale-[1.02] cursor-pointer'
                                                                    : 'bg-[#181a24]/80 border-slate-800'
                                                            }`}
                                                        onClick={(e) => {
                                                            if (canFreeClaim) handleClaimTierReward(tier.id, 'free', e);
                                                        }}
                                                    >
                                                        {/* Reward Value Indicator */}
                                                        <span className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isFreeClaimed ? 'text-slate-500 line-through' : 'text-emerald-300'
                                                            }`}>
                                                            {tier.freeReward.rewardName}
                                                        </span>

                                                        {/* Reward Image representation */}
                                                        <div className="relative w-11 h-11 flex items-center justify-center mb-1.5">
                                                            {tier.freeReward.rewardType === 'chest' ? (
                                                                <img
                                                                    src={tier.freeReward.image}
                                                                    alt="Chest"
                                                                    className={`w-10 h-10 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] ${isFreeClaimed ? 'filter brightness-[0.4]' : canFreeClaim ? 'animate-bounce' : 'filter brightness-75'
                                                                        }`}
                                                                />
                                                            ) : (
                                                                <span className={`text-2xl drop-shadow-md ${isFreeClaimed ? 'opacity-30' : ''}`}>
                                                                    {tier.freeReward.image}
                                                                </span>
                                                            )}

                                                            {isFreeClaimed && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 bg-slate-950 rounded-full p-[1px]" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Free Track Button */}
                                                        {canFreeClaim ? (
                                                            <button
                                                                onClick={(e) => handleClaimTierReward(tier.id, 'free', e)}
                                                                className="w-full bg-gradient-to-b from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 text-slate-950 text-[8px] font-extrabold py-1 rounded-lg border border-white/20 uppercase tracking-tight shadow-md cursor-pointer animate-bounce"
                                                            >
                                                                Coletar
                                                            </button>
                                                        ) : (
                                                            <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-500 leading-none">
                                                                {isFreeClaimed ? 'COLETADO' : isUnlocked ? 'LIVRE' : `REQ ${tier.pointsRequired} PTS`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* ================= MIDDLE: TIER BADGE ================= */}
                                                <div className="col-span-1 md:hidden flex flex-col items-center justify-center z-20 relative">
                                                    <div className={`w-8 h-8 rounded-full border-2 font-serif font-black text-xs flex items-center justify-center shadow-lg transition-all ${isUnlocked
                                                            ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 border-yellow-200 text-slate-950 animate-pulse'
                                                            : 'bg-slate-950 border-purple-500/20 text-slate-500'
                                                        }`}>
                                                        {tier.id}
                                                    </div>
                                                </div>

                                                {/* ================= RIGHT: GOLD REWARD CARD ================= */}
                                                <div className="col-span-5 md:col-span-1">
                                                    <div
                                                        className={`p-2 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col items-center text-center h-full justify-between ${isGoldClaimed
                                                                ? 'bg-slate-950/40 border-slate-900/60 opacity-55'
                                                                : !isPasseDouradoAdquirido
                                                                    ? 'bg-[#2a1d1b]/60 border-amber-950/50 opacity-70 filter brightness-[0.85]'
                                                                    : canGoldClaim
                                                                        ? 'bg-gradient-to-b from-[#6b1e06] to-[#450e02] border-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:scale-[1.02] cursor-pointer'
                                                                        : 'bg-[#2b170e]/80 border-amber-500/10'
                                                            }`}
                                                        onClick={(e) => {
                                                            if (canGoldClaim) handleClaimTierReward(tier.id, 'gold', e);
                                                        }}
                                                    >
                                                        {/* Padlock status indicator for non-upgraded pass */}
                                                        {!isPasseDouradoAdquirido && (
                                                            <div className="absolute top-1 right-1 bg-black/60 p-0.5 rounded-md border border-amber-500/25">
                                                                <Shield className="w-2.5 h-2.5 text-amber-500 fill-amber-500/15" />
                                                            </div>
                                                        )}

                                                        {/* Reward Value Indicator */}
                                                        <span className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isGoldClaimed ? 'text-slate-500 line-through' : 'text-amber-400 text-shadow-sm'
                                                            }`}>
                                                            {tier.goldReward.rewardName}
                                                        </span>

                                                        {/* Reward Image representation */}
                                                        <div className="relative w-11 h-11 flex items-center justify-center mb-1.5">
                                                            {tier.goldReward.rewardType === 'chest' ? (
                                                                <img
                                                                    src={tier.goldReward.image}
                                                                    alt="Chest"
                                                                    className={`w-10 h-10 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] ${isGoldClaimed ? 'filter brightness-[0.4]' : canGoldClaim ? 'animate-bounce' : 'filter brightness-75'
                                                                        }`}
                                                                />
                                                            ) : tier.goldReward.rewardType === 'cards' ? (
                                                                <img
                                                                    src={tier.goldReward.image}
                                                                    alt="Cards"
                                                                    className={`w-9 h-9 object-contain drop-shadow-md ${isGoldClaimed ? 'filter brightness-[0.4]' : ''
                                                                        }`}
                                                                />
                                                            ) : (
                                                                <span className={`text-2xl drop-shadow-md ${isGoldClaimed ? 'opacity-30' : ''}`}>
                                                                    {tier.goldReward.image}
                                                                </span>
                                                            )}

                                                            {isGoldClaimed && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <CheckCircle2 className="w-5 h-5 text-amber-500 bg-slate-950 rounded-full p-[1px]" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Gold Track Action Button */}
                                                        {canGoldClaim ? (
                                                            <button
                                                                onClick={(e) => handleClaimTierReward(tier.id, 'gold', e)}
                                                                className="w-full bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 text-[8px] font-extrabold py-1 rounded-lg border border-white/20 uppercase tracking-tight shadow-md cursor-pointer animate-bounce"
                                                            >
                                                                Coletar
                                                            </button>
                                                        ) : !isPasseDouradoAdquirido ? (
                                                            <span className="text-[7.5px] font-bold uppercase tracking-wider text-amber-500/60 leading-none">
                                                                BLOQUEADO
                                                            </span>
                                                        ) : (
                                                            <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-500 leading-none">
                                                                {isGoldClaimed ? 'COLETADO' : isUnlocked ? 'LIBERADO' : `REQ ${tier.pointsRequired} PTS`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
                                        );
                                    })}

                                </div>

                                {/* TESTER CONTROLS ROW inside modal */}
                                <div className="bg-slate-900/40 p-2 rounded-xl border border-purple-500/10 flex items-center justify-between gap-2">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">SIMULADOR:</span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                soundManager.playMove();
                                                setSeasonProgress(prev => Math.min(60, prev + 10));
                                            }}
                                            className="text-[8px] font-black bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/25 text-amber-400 px-2 py-1 rounded-md uppercase tracking-tight transition-all cursor-pointer"
                                        >
                                            +10 Coroas
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                soundManager.playScoreSaved();
                                                setSeasonProgress(60);
                                            }}
                                            className="text-[8px] font-black bg-green-500/15 hover:bg-green-500/30 border border-green-500/25 text-green-400 px-2 py-1 rounded-md uppercase tracking-tight transition-all cursor-pointer"
                                        >
                                            Max
                                        </button>
                                        <button
                                            onClick={resetAllMissionsSim}
                                            className="text-[8px] font-black bg-red-500/15 hover:bg-red-500/30 border border-red-500/25 text-red-400 px-2 py-1 rounded-md uppercase tracking-tight transition-all cursor-pointer"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )}

                    </div>

                </main>
            </motion.div>

            {/* CHEST OPEN REWARD DIALOG POPUP */}
            <AnimatePresence>
                {openingChest && (
                    <div className="fixed inset-0 z-[140] bg-black/90 flex items-center justify-center p-4">

                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                            className="w-full max-w-sm bg-gradient-to-b from-[#1c1236] to-[#0b0518] border-4 border-amber-400/80 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center text-center shadow-[0_0_50px_rgba(245,158,11,0.5)] select-none"
                        >
                            <div className="absolute -inset-10 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.2),transparent_60%)] animate-pulse pointer-events-none" />

                            <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                            <div className="absolute bottom-12 right-12 w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" style={{ animationDelay: '0.5s' }} />
                            <div className="absolute top-1/2 right-10 w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" style={{ animationDelay: '1s' }} />

                            <h2 className="font-serif font-black text-[22px] text-amber-400 uppercase tracking-widest text-shadow mb-1.5">
                                RECOMPENSA!
                            </h2>

                            <p className="text-xs text-purple-200 font-bold uppercase tracking-wider mb-5">
                                Você abriu: <span className="text-white">{openingChest.name}</span>
                            </p>

                            {/* Floating Chest / Badge Image */}
                            <div className="relative w-36 h-36 flex items-center justify-center mb-6">
                                <div className="absolute inset-0 bg-yellow-500/15 blur-2xl rounded-full animate-pulse" />
                                <motion.img
                                    initial={{ y: 0 }}
                                    animate={{ y: [-6, 6, -6] }}
                                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                    src={openingChest.image}
                                    alt={openingChest.name}
                                    className="w-28 h-28 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] relative z-10"
                                />
                            </div>

                            {/* Optional Special Badge Awarded */}
                            {openingChest.badge && (
                                <div className="bg-amber-400/10 border border-amber-500/30 rounded-2xl px-3 py-1.5 mb-4 relative z-10 text-amber-300 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                    🏆 EMBLEMA DESBLOQUEADO: "{openingChest.badge}"
                                </div>
                            )}

                            {/* Loot Items display */}
                            <div className="grid grid-cols-3 gap-2.5 w-full mb-6">

                                {/* Reward: XP */}
                                <div className="bg-slate-900/80 border border-purple-500/20 rounded-2xl p-2.5 flex flex-col items-center gap-1 shadow-inner">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
                                    </div>
                                    <span className="text-[13px] font-black text-indigo-300 font-serif leading-none mt-1">
                                        +{openingChest.xp}
                                    </span>
                                    <span className="text-[7.5px] font-black text-indigo-400 uppercase tracking-widest leading-none">XP</span>
                                </div>

                                {/* Reward: Ouro */}
                                <div className="bg-slate-900/80 border border-purple-500/20 rounded-2xl p-2.5 flex flex-col items-center gap-1 shadow-inner">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                                        <Coins className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                                    </div>
                                    <span className="text-[13px] font-black text-amber-300 font-serif leading-none mt-1">
                                        +{openingChest.gold}
                                    </span>
                                    <span className="text-[7.5px] font-black text-amber-400 uppercase tracking-widest leading-none">Ouro</span>
                                </div>

                                {/* Reward: Gemas */}
                                <div className="bg-slate-900/80 border border-purple-500/20 rounded-2xl p-2.5 flex flex-col items-center gap-1 shadow-inner">
                                    <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/25 flex items-center justify-center">
                                        <Gem className="w-4 h-4 text-teal-400 fill-teal-400/20" />
                                    </div>
                                    <span className="text-[13px] font-black text-teal-300 font-serif leading-none mt-1">
                                        +{openingChest.gems}
                                    </span>
                                    <span className="text-[7.5px] font-black text-teal-400 uppercase tracking-widest leading-none">Gemas</span>
                                </div>

                            </div>

                            {/* Confirm / Continue Button */}
                            <button
                                onClick={handleCloseChestAward}
                                className="w-full bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black py-3 rounded-2xl text-xs tracking-widest uppercase border-2 border-slate-950/80 active:translate-y-1 active:shadow-none shadow-[0_4px_0_#9a3412] hover:shadow-[0_5px_0_#9a3412] transition-all cursor-pointer relative"
                            >
                                <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10 rounded-t-2xl pointer-events-none" />
                                COLETAR RECOMPENSAS
                            </button>

                        </motion.div>

                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
