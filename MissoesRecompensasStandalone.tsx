import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    X,
    Calendar,
    Layers,
    Award,
    CheckCircle2,
    Sparkles,
    Zap,
    Coins,
    Gem,
    Trophy,
    Shield,
    Crown,
    Info,
    Clock,
    ChevronRight,
    ChevronDown,
    Gift,
    Flame,
    Check,
    Smartphone,
    Monitor,
    RotateCcw
} from 'lucide-react';

// ============================================================================
// 1. TIPOS & MODELOS DE DADOS (STANDALONE)
// ============================================================================

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

// ============================================================================
// 2. SISTEMA DE ÁUDIO WEB AUDIO API STANDALONE (ZERO ARQUIVOS EXTERNOS)
// ============================================================================

class StandaloneSoundEffects {
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

    playClick() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
        } catch {
            // Audio fallback
        }
    }

    playClaim() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            freqs.forEach((freq, idx) => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.07);
                gain.gain.setValueAtTime(0, now + idx * 0.07);
                gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.07 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.07);
                osc.stop(now + idx * 0.07 + 0.25);
            });
        } catch {
            // Audio fallback
        }
    }

    playChestOpen() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            // Rumble base
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.5);

            // Shimmer arpeggio
            [659.25, 830.61, 987.77, 1318.51].forEach((freq, i) => {
                if (!this.ctx) return;
                const sh = this.ctx.createOscillator();
                const shGain = this.ctx.createGain();
                sh.type = 'sine';
                sh.frequency.setValueAtTime(freq, now + 0.25 + i * 0.06);
                shGain.gain.setValueAtTime(0.18, now + 0.25 + i * 0.06);
                shGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + i * 0.06);
                sh.connect(shGain);
                shGain.connect(this.ctx.destination);
                sh.start(now + 0.25 + i * 0.06);
                sh.stop(now + 0.7 + i * 0.06);
            });
        } catch {
            // Audio fallback
        }
    }
}

const sfx = new StandaloneSoundEffects();

// ============================================================================
// 3. DADOS INICIAIS MOCK PARA REFERÊNCIA COMPLETA
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

const CHEST_IMAGES = {
    wood: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQfvz7YRq1Pu-y_-Pkj3RgPbJtjcRMIfSCdcbyFBzDQAC_MRbG-qGR8z83B0Rm0oiYyIh_IvBsFC6lytRpzs1_I0mf7WQLu9wAEuU2dFx3e4DxRR3mmgbr_32REcQuGE7dfm-ua1U86LaLTf0m_E2_GQPNqvviq1_MnqV0W29fIH6n46q44dQ5zsft3RJ2Bvn9jpPyF0C4pYzyzZ6vDREHeVRw2CT-9oHAgGHwR7xFa7tm7flqIC293K6Ba4WjULs0Hu52aAagaZY',
    silver: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBheFuszoYTkx6-rRViLmMV_k2cROw-tUFnDQUHf6IHKZ4Dx6OZVHOCJh9SNnphRxZOgh5264v6QoNEfnucKmBvI2-u3tNRIUuRqKGu2S0SwuV5DuUug71Jqy0e8M3MByOeUjnAvC1_yw0DbX-CDDA2K-0eI38hxh4zVO9zoO2xN8lV1mWZRaIJXd9x3xczNOPms3pIJ6ys50z755S8bQelorywBXrvQv80vSTPfZmCtnD9rTMoi8s4YWv_8D5oa8Rsby--QdA13sU',
    gold: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEleKpzjcs79tHlpUlyz8zFtNvoJUAdf3eaa8TAlfAiDfhHmYJ45DuX4fk5nm3YHEq75TeCaLKMouuJJ7xjJrto9uj_uPUd-PHM1sMQ8pviBFxV190UK4QnOeRggbySANWT1Q6kBGq5mpPZXdiTgVFYenMJUk1QgJ943FLMx4pjPeay8v0T3prZ8tc6hhBSi32dZGU9TiShS5q9fdiVpeoDGVu4aItmFDnIsWiIJ4963jMoWOYlZhB3tOPTHiuPVRzskzoK0VSnsk',
    giant: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBa22ST1pIkzOB2NguN_mHVDtHvBFancpO8bQ8FCkRkmAkaQE7imYTU7MNj1DPbJJmSntcHDrGCQmRjVarJjAZ95UNfUxiGa-aLbP3749K0Un0KD3qpm2qZiYRVwJwbxDd7MFjeuLJBsjsKRRj_7l5YKNjf4wKxMMgF5jblInmrqjsvfzERMnqxpSR9osfoHV2EvDml9ckMIPmYw7tOqYEnD8FPGCz6CBwkipfKoknAiiizwbsUyspm3XcHzhIQUZComYzFBJcs84w',
    magic: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfeU_eT2-MFQUDgjJIBLdIiqaZ1VB8l9RfcsQ-ufKTsknf2CjKeX8r1YlHtr4nFAuNoUHbdcPeKkk8uGm8J1SVUIPPP-7oXmI4qCkXYbgCxU6EQjI3tPNXBWPJGhU_5BBya488ZbIHfGkoOr3PTuK5QaTp4be5iGNpPhJFbb-5bPRZMAjVcB1GkngBiYDUwCfZDpZNkJRD4PI_A8xl5kR2tIpi-PzDkseERk3Af6XKuT2sQTRKgsbULffu-7r9GLvD9ipIrNYNdCc',
    legendary: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCE0GENrPbQakwsSnuGsmyPsXZmykwkMYgnVqAEmf_9yqs7axhPx0VV4a8qVBAvr7uZsxIcDXxgx2XgO0y0Ok-glifYaeQZL69ZWiCevQzj17EyibAxjJlBCde4Rfp5QdZAa4ewuC-_VCZELDvIrRDsESgWNCrRbckXyFOsPd4wcRjD58FmZhd6GlDvNg93vkGrRD8FLqkuRlfpOW2iAnptvbME91sk2MXHGpHd2XP0_sid1fAJgx3vu0Yf0JE-9wsCg7AKzIFXmr0'
};

const INITIAL_MISSIONS: Mission[] = [
    {
        id: 'd1',
        title: 'Esmagador de Linhas',
        subtitle: 'Destrua 15 linhas de Tetromino em batalhas.',
        type: 'daily',
        target: 15,
        current: 15, // Pronto para resgate de exemplo
        claimed: false,
        xpReward: 30,
        goldReward: 80,
        gemsReward: 3,
        pointsReward: 5,
        chestName: 'Baú de Madeira',
        chestImage: CHEST_IMAGES.wood,
        chestColor: 'from-amber-700 to-amber-900 border-amber-600 shadow-[0_0_15px_rgba(180,83,9,0.5)]'
    },
    {
        id: 'd2',
        title: 'Investimento Real',
        subtitle: 'Gaste 200 moedas de Ouro na Coleção ou Loja.',
        type: 'daily',
        target: 200,
        current: 140,
        claimed: false,
        xpReward: 40,
        goldReward: 100,
        gemsReward: 5,
        pointsReward: 6,
        chestName: 'Baú de Prata',
        chestImage: CHEST_IMAGES.silver,
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
        chestImage: CHEST_IMAGES.gold,
        chestColor: 'from-yellow-500 to-amber-600 border-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
    },
    {
        id: 'w_fixed',
        title: 'Determinação Diária',
        subtitle: 'Conclua 7 missões diárias para ganhar esta recompensa super especial.',
        type: 'weekly',
        target: 7,
        current: 5,
        claimed: false,
        xpReward: 300,
        goldReward: 600,
        gemsReward: 30,
        pointsReward: 20,
        chestName: 'Baú Gigante',
        chestImage: CHEST_IMAGES.giant,
        chestColor: 'from-emerald-600 to-emerald-800 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
    },
    {
        id: 'w2',
        title: 'Tsunami de Tetrominos',
        subtitle: 'Destrua um total de 80 linhas em batalhas competitivas.',
        type: 'weekly',
        target: 80,
        current: 52,
        claimed: false,
        xpReward: 400,
        goldReward: 800,
        gemsReward: 40,
        pointsReward: 25,
        chestName: 'Baú Mágico',
        chestImage: CHEST_IMAGES.magic,
        chestColor: 'from-indigo-600 to-purple-800 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.6)]'
    },
    {
        id: 'w3',
        title: 'Mestre Evolutivo',
        subtitle: 'Efetue 3 upgrades de cartas na aba de Coleção.',
        type: 'weekly',
        target: 3,
        current: 3, // Pronto para resgatar
        claimed: false,
        xpReward: 350,
        goldReward: 700,
        gemsReward: 25,
        pointsReward: 15,
        chestName: 'Baú Lendário',
        chestImage: CHEST_IMAGES.legendary,
        chestColor: 'from-amber-400 via-rose-500 to-indigo-600 border-yellow-300 shadow-[0_0_25px_rgba(245,158,11,0.75)]'
    }
];

const INITIAL_PASSE_TIERS: PasseTier[] = [
    {
        id: 1,
        pointsRequired: 10,
        freeReward: { rewardName: '200 Moedas de Ouro', rewardType: 'gold', rewardValue: 200, claimed: true, image: '💰' },
        goldReward: { rewardName: '15x Cartas Ronin', rewardType: 'cards', rewardValue: 15, claimed: false, image: CHEST_IMAGES.wood }
    },
    {
        id: 2,
        pointsRequired: 20,
        freeReward: { rewardName: 'Baú de Madeira', rewardType: 'chest', rewardValue: 1, claimed: false, image: CHEST_IMAGES.wood },
        goldReward: { rewardName: '2.500 Moedas de Ouro', rewardType: 'gold', rewardValue: 2500, claimed: false, image: '💰' }
    },
    {
        id: 3,
        pointsRequired: 30,
        freeReward: { rewardName: '15 Gemas Verdes', rewardType: 'gems', rewardValue: 15, claimed: false, image: '💎' },
        goldReward: { rewardName: 'Baú Mágico Especial', rewardType: 'chest', rewardValue: 1, claimed: false, image: CHEST_IMAGES.magic }
    },
    {
        id: 4,
        pointsRequired: 40,
        freeReward: { rewardName: '500 Moedas de Ouro', rewardType: 'gold', rewardValue: 500, claimed: false, image: '💰' },
        goldReward: { rewardName: 'Emote Exclusivo Coroa', rewardType: 'cards', rewardValue: 1, claimed: false, image: '👑' }
    },
    {
        id: 5,
        pointsRequired: 50,
        freeReward: { rewardName: 'Baú de Ouro', rewardType: 'chest', rewardValue: 1, claimed: false, image: CHEST_IMAGES.gold },
        goldReward: { rewardName: 'Baú Lendário Dourado', rewardType: 'chest', rewardValue: 1, claimed: false, image: CHEST_IMAGES.legendary }
    }
];

// ============================================================================
// 4. COMPONENTE PRINCIPAL STANDALONE
// ============================================================================

export interface MissoesRecompensasProps {
    isOpen?: boolean;
    onClose?: () => void;
    profile?: PlayerProfile;
    onUpdateProfile?: (updated: Partial<PlayerProfile>) => void;
}

export function MissoesRecompensasModal({
    isOpen = true,
    onClose,
    profile: externalProfile,
    onUpdateProfile: externalUpdateProfile
}: MissoesRecompensasProps) {
    // Local profile fallback if running standalone
    const [localProfile, setLocalProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);
    const currentProfile = externalProfile || localProfile;
    const updateProfile = (patch: Partial<PlayerProfile>) => {
        if (externalUpdateProfile) {
            externalUpdateProfile(patch);
        } else {
            setLocalProfile(prev => ({ ...prev, ...patch }));
        }
    };

    const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'passe'>('daily');
    const [visibleRewards, setVisibleRewards] = useState<Record<string, boolean>>({});
    const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);

    // Counters
    const [completedDailiesThisWeek, setCompletedDailiesThisWeek] = useState<number>(5);
    const [completedDailiesMonthly, setCompletedDailiesMonthly] = useState<number>(27);
    const [monthlyClaimed, setMonthlyClaimed] = useState<boolean>(false);

    // Passe Royale state
    const [seasonProgress, setSeasonProgress] = useState<number>(25);
    const seasonTarget = 60;
    const [isPasseDouradoAdquirido, setIsPasseDouradoAdquirido] = useState<boolean>(false);
    const [passeTiers, setPasseTiers] = useState<PasseTier[]>(INITIAL_PASSE_TIERS);

    // Chest Open simulation state
    const [openingChest, setOpeningChest] = useState<{
        name: string;
        color: string;
        image: string;
        xp: number;
        gold: number;
        gems: number;
        cards?: number;
    } | null>(null);

    // Toast feedback
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2800);
    };

    const toggleRewardsVisibility = (missionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        sfx.playClick();
        setVisibleRewards(prev => ({
            ...prev,
            [missionId]: !prev[missionId]
        }));
    };

    const handleClaimMission = (m: Mission) => {
        if (m.claimed || m.current < m.target) return;
        sfx.playChestOpen();

        // Mark as claimed
        setMissions(prev =>
            prev.map(item => (item.id === m.id ? { ...item, claimed: true } : item))
        );

        // Give rewards
        updateProfile({
            gold: currentProfile.gold + m.goldReward,
            gems: currentProfile.gems + m.gemsReward,
            xp: currentProfile.xp + m.xpReward
        });

        // Advance Passe points
        setSeasonProgress(prev => Math.min(seasonTarget, prev + m.pointsReward));

        if (m.type === 'daily') {
            setCompletedDailiesThisWeek(prev => prev + 1);
            setCompletedDailiesMonthly(prev => prev + 1);
        }

        // Open reward animation
        setOpeningChest({
            name: m.chestName,
            color: m.chestColor,
            image: m.chestImage,
            xp: m.xpReward,
            gold: m.goldReward,
            gems: m.gemsReward
        });
    };

    const handleClaimMonthly = () => {
        if (completedDailiesMonthly < 40 || monthlyClaimed) return;
        sfx.playChestOpen();
        setMonthlyClaimed(true);
        updateProfile({
            gold: currentProfile.gold + 5000,
            gems: currentProfile.gems + 150,
            xp: currentProfile.xp + 1000
        });
        setOpeningChest({
            name: 'Super Baú Mítico Mensal',
            color: 'from-amber-400 via-rose-500 to-indigo-600 border-yellow-300',
            image: CHEST_IMAGES.legendary,
            xp: 1000,
            gold: 5000,
            gems: 150,
            cards: 50
        });
    };

    const handleClaimPasseReward = (tierId: number, isGold: boolean) => {
        const tier = passeTiers.find(t => t.id === tierId);
        if (!tier) return;
        const reward = isGold ? tier.goldReward : tier.freeReward;
        if (reward.claimed || seasonProgress < tier.pointsRequired) return;

        if (isGold && !isPasseDouradoAdquirido) {
            triggerToast('Requer aquisição do Passe Dourado!');
            sfx.playClick();
            return;
        }

        sfx.playClaim();
        setPasseTiers(prev =>
            prev.map(t => {
                if (t.id === tierId) {
                    return {
                        ...t,
                        [isGold ? 'goldReward' : 'freeReward']: {
                            ...reward,
                            claimed: true
                        }
                    };
                }
                return t;
            })
        );

        if (reward.rewardType === 'gold') {
            updateProfile({ gold: currentProfile.gold + reward.rewardValue });
        } else if (reward.rewardType === 'gems') {
            updateProfile({ gems: currentProfile.gems + reward.rewardValue });
        }

        triggerToast(`Resgatou: ${reward.rewardName}!`);
    };

    const handleBuyPasseDourado = () => {
        if (isPasseDouradoAdquirido) return;
        if (currentProfile.gems >= 250) {
            sfx.playClaim();
            updateProfile({ gems: currentProfile.gems - 250 });
            setIsPasseDouradoAdquirido(true);
            triggerToast('Passe Dourado Ativado com Sucesso! 👑');
        } else {
            triggerToast('Gemas insuficientes para o Passe Dourado (Requer 250 💎)');
            sfx.playClick();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md select-none">
            {/* Background overlay click */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Main Dialog Window */}
            <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-2xl bg-gradient-to-b from-[#1b1035] via-[#100924] to-[#080415] border-2 border-indigo-500/50 rounded-3xl shadow-[0_0_50px_rgba(129,140,248,0.25)] flex flex-col max-h-[92vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* ==================================================================== */}
                {/* HEADER */}
                {/* ==================================================================== */}
                <div className="px-5 py-4 border-b border-indigo-500/20 bg-slate-950/40 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center">
                            <Award className="w-6 h-6 text-slate-950" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black tracking-wider text-white uppercase drop-shadow">
                                Missões & Recompensas
                            </h2>
                            <p className="text-[11px] text-indigo-300 font-medium">
                                Cumpra objetivos para desbloquear baús e pontos do Passe
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Quick Balance Status */}
                        <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 border border-indigo-500/30 px-3 py-1.5 rounded-xl font-mono text-xs font-bold">
                            <span className="flex items-center gap-1 text-amber-300">
                                <Coins className="w-3.5 h-3.5 text-amber-400" />
                                {currentProfile.gold.toLocaleString()}
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className="flex items-center gap-1 text-emerald-400">
                                <Gem className="w-3.5 h-3.5 text-emerald-400" />
                                {currentProfile.gems.toLocaleString()}
                            </span>
                        </div>

                        {onClose && (
                            <button
                                onClick={() => {
                                    sfx.playClick();
                                    onClose();
                                }}
                                className="w-8 h-8 rounded-xl bg-slate-900/80 hover:bg-rose-500/30 border border-slate-700 hover:border-rose-400 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ==================================================================== */}
                {/* TABS SELECTOR */}
                {/* ==================================================================== */}
                <div className="px-4 pt-3 pb-2 bg-slate-950/20 border-b border-indigo-500/15 flex gap-2 shrink-0">
                    <button
                        onClick={() => {
                            sfx.playClick();
                            setActiveTab('daily');
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${activeTab === 'daily'
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)]'
                                : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                    >
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <span>Diárias</span>
                    </button>

                    <button
                        onClick={() => {
                            sfx.playClick();
                            setActiveTab('weekly');
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${activeTab === 'weekly'
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)]'
                                : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                    >
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span>Semanais</span>
                    </button>

                    <button
                        onClick={() => {
                            sfx.playClick();
                            setActiveTab('passe');
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${activeTab === 'passe'
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 border-yellow-300 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                                : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                    >
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span>Passe Royale</span>
                    </button>
                </div>

                {/* ==================================================================== */}
                {/* BODY CONTENT SCROLLER */}
                {/* ==================================================================== */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
                    {/* TAB 1: DIÁRIAS */}
                    {activeTab === 'daily' && (
                        <div className="space-y-4">
                            {/* Daily Timer & Summary Bar */}
                            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-indigo-200">
                                    <Clock className="w-4 h-4 text-indigo-400" />
                                    <span>Reinicia em: <strong className="text-white font-mono">14h 22m</strong></span>
                                </div>
                                <div className="text-[11px] font-bold text-amber-400">
                                    {missions.filter(m => m.type === 'daily' && m.claimed).length} / 3 Concluídas
                                </div>
                            </div>

                            {/* Daily Missions Cards */}
                            <div className="space-y-3">
                                {missions
                                    .filter(m => m.type === 'daily')
                                    .map(m => {
                                        const isComplete = m.current >= m.target;
                                        const progressPct = Math.min(100, (m.current / m.target) * 100);
                                        const isExpanded = !!visibleRewards[m.id];

                                        return (
                                            <div
                                                key={m.id}
                                                className={`rounded-2xl border p-3.5 transition-all relative overflow-hidden ${m.claimed
                                                        ? 'bg-slate-950/40 border-slate-800 opacity-60'
                                                        : isComplete
                                                            ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900/90 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                                            : 'bg-slate-900/70 border-indigo-950/70 hover:border-indigo-800'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    {/* Chest Icon */}
                                                    <div className="relative shrink-0">
                                                        <div className="w-14 h-14 rounded-2xl bg-[#0d0722] border border-indigo-500/30 flex items-center justify-center p-1 shadow-inner">
                                                            <img
                                                                src={m.chestImage}
                                                                alt={m.chestName}
                                                                className="w-11 h-11 object-contain drop-shadow"
                                                            />
                                                        </div>
                                                        <span className="absolute -bottom-1.5 -right-1.5 bg-yellow-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-yellow-600 shadow-sm">
                                                            +{m.pointsReward} pts
                                                        </span>
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="text-xs font-black text-white uppercase tracking-wide truncate">
                                                                {m.title}
                                                            </h4>
                                                            <button
                                                                onClick={e => toggleRewardsVisibility(m.id, e)}
                                                                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-bold cursor-pointer"
                                                            >
                                                                Recompensas
                                                                <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                            </button>
                                                        </div>

                                                        <p className="text-[11px] text-slate-300 line-clamp-1 mb-2">
                                                            {m.subtitle}
                                                        </p>

                                                        {/* Progress bar */}
                                                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                                                            <div
                                                                className={`h-full transition-all duration-500 ${isComplete
                                                                        ? 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                                                                        : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                                                                    }`}
                                                                style={{ width: `${progressPct}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400 font-mono">
                                                            <span>Progresso</span>
                                                            <span className="font-bold text-white">
                                                                {m.current} / {m.target}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Action Button */}
                                                    <div className="shrink-0 pl-2">
                                                        {m.claimed ? (
                                                            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                                                                <Check className="w-3.5 h-3.5" />
                                                                <span>Coletado</span>
                                                            </div>
                                                        ) : isComplete ? (
                                                            <button
                                                                onClick={() => handleClaimMission(m)}
                                                                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_3px_0_#065f46] hover:shadow-[0_4px_12px_rgba(16,185,129,0.4)] active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                                                            >
                                                                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                                                                <span>Abrir</span>
                                                            </button>
                                                        ) : (
                                                            <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-500 text-[10px] font-bold font-mono">
                                                                Em andamento
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Collapsible Secondary Rewards Dropdown */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="mt-3 pt-2.5 border-t border-indigo-950/60 flex items-center justify-around text-xs bg-slate-950/40 rounded-xl p-2"
                                                        >
                                                            <div className="flex items-center gap-1 font-bold text-amber-400">
                                                                <Coins className="w-3.5 h-3.5" />
                                                                <span>+{m.goldReward} Ouro</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 font-bold text-emerald-400">
                                                                <Gem className="w-3.5 h-3.5" />
                                                                <span>+{m.gemsReward} Gemas</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 font-bold text-indigo-400">
                                                                <Zap className="w-3.5 h-3.5" />
                                                                <span>+{m.xpReward} XP</span>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                            </div>

                            {/* Monthly Mega-Mission Bonus Card */}
                            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border-2 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-400 p-1 flex items-center justify-center shrink-0">
                                        <img
                                            src={CHEST_IMAGES.legendary}
                                            alt="Baú Lendário Mensal"
                                            className="w-11 h-11 object-contain drop-shadow"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                                            ★ BÔNUS DE DEDICAÇÃO MENSAL
                                        </span>
                                        <h4 className="text-sm font-black text-white uppercase">
                                            Conclua 40 Missões Diárias
                                        </h4>
                                        <p className="text-[11px] text-slate-300">
                                            Recompensa exclusiva: Baú Lendário + 5.000 Ouro + 150 Gemas
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full sm:w-auto flex flex-col items-center sm:items-end gap-1.5 shrink-0">
                                    <div className="text-xs font-mono font-bold text-amber-300">
                                        {completedDailiesMonthly} / 40 Concluídas
                                    </div>
                                    {monthlyClaimed ? (
                                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
                                            Recompensa Coletada ✓
                                        </span>
                                    ) : (
                                        <button
                                            onClick={handleClaimMonthly}
                                            disabled={completedDailiesMonthly < 40}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${completedDailiesMonthly >= 40
                                                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95'
                                                    : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                                                }`}
                                        >
                                            Resgatar Baú Mítico
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: SEMANAIS */}
                    {activeTab === 'weekly' && (
                        <div className="space-y-4">
                            {/* Weekly Header Banner */}
                            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-emerald-200">
                                    <Calendar className="w-4 h-4 text-emerald-400" />
                                    <span>Encerra em: <strong className="text-white font-mono">4d 09h</strong></span>
                                </div>
                                <div className="text-[11px] font-bold text-amber-400">
                                    {missions.filter(m => m.type === 'weekly' && m.claimed).length} / 3 Coletadas
                                </div>
                            </div>

                            {/* Weekly Missions List */}
                            <div className="space-y-3">
                                {missions
                                    .filter(m => m.type === 'weekly')
                                    .map(m => {
                                        const isComplete = m.current >= m.target;
                                        const progressPct = Math.min(100, (m.current / m.target) * 100);

                                        return (
                                            <div
                                                key={m.id}
                                                className={`rounded-2xl border p-4 transition-all relative overflow-hidden ${m.claimed
                                                        ? 'bg-slate-950/40 border-slate-800 opacity-60'
                                                        : isComplete
                                                            ? 'bg-gradient-to-r from-emerald-950/50 to-slate-900 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                                                            : 'bg-slate-900/80 border-indigo-950/80'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="w-16 h-16 rounded-2xl bg-[#0b061c] border-2 border-indigo-500/40 flex items-center justify-center p-1 shrink-0">
                                                        <img
                                                            src={m.chestImage}
                                                            alt={m.chestName}
                                                            className="w-13 h-13 object-contain drop-shadow"
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                                                                {m.id === 'w_fixed' ? 'FIXA SEMANAL' : 'SEMANAL'}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-indigo-300 font-bold">
                                                                +{m.pointsReward} Pontos
                                                            </span>
                                                        </div>

                                                        <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide truncate">
                                                            {m.title}
                                                        </h4>
                                                        <p className="text-[11px] text-slate-300 line-clamp-1 mb-2">
                                                            {m.subtitle}
                                                        </p>

                                                        {/* Progress bar */}
                                                        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
                                                                style={{ width: `${progressPct}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400 font-mono">
                                                            <span>Progresso Semanal</span>
                                                            <span className="font-bold text-white">
                                                                {m.current} / {m.target}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 pl-2">
                                                        {m.claimed ? (
                                                            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-[10px] font-bold">
                                                                Concluído
                                                            </div>
                                                        ) : isComplete ? (
                                                            <button
                                                                onClick={() => handleClaimMission(m)}
                                                                className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_3px_0_#065f46] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                                            >
                                                                Abrir Baú
                                                            </button>
                                                        ) : (
                                                            <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-500 text-[10px] font-bold font-mono">
                                                                Bloqueado
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Direct Rewards list */}
                                                <div className="mt-3 pt-2 border-t border-indigo-950/50 flex items-center justify-around text-xs text-slate-300 font-bold">
                                                    <span className="text-amber-400">+{m.goldReward} Ouro</span>
                                                    <span className="text-emerald-400">+{m.gemsReward} Gemas</span>
                                                    <span className="text-indigo-400">+{m.xpReward} XP</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: PASSE ROYALE */}
                    {activeTab === 'passe' && (
                        <div className="space-y-4">
                            {/* Passe Banner with Golden Pass upgrade */}
                            <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-950/60 via-[#1e1338] to-slate-950 border-2 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.25)] flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md">
                                        <Crown className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                                            TEMPORADA ATIVA
                                        </span>
                                        <h3 className="text-base font-black text-white uppercase">
                                            Passe Royale: Gladiadores
                                        </h3>
                                        <p className="text-[11px] text-slate-300">
                                            Pontos acumulados: <strong className="text-amber-400 font-mono">{seasonProgress} / {seasonTarget}</strong>
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full sm:w-auto">
                                    {isPasseDouradoAdquirido ? (
                                        <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                                            <Sparkles className="w-4 h-4 text-white" />
                                            <span>Passe Dourado Ativo</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleBuyPasseDourado}
                                            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_3px_0_#b45309] hover:shadow-[0_4px_15px_rgba(245,158,11,0.4)] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <Crown className="w-4 h-4 text-slate-950" />
                                            <span>Ativar Dourado (250 💎)</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Tiers Ladder */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-12 gap-2 text-[10px] font-black uppercase text-slate-400 px-3">
                                    <div className="col-span-5 text-left">Trilha Gratuita</div>
                                    <div className="col-span-2 text-center">Nível / Meta</div>
                                    <div className="col-span-5 text-right text-amber-400">Trilha Dourada 👑</div>
                                </div>

                                {passeTiers.map(tier => {
                                    const unlocked = seasonProgress >= tier.pointsRequired;

                                    return (
                                        <div
                                            key={tier.id}
                                            className={`grid grid-cols-12 gap-2 p-3 rounded-2xl border transition-all items-center ${unlocked
                                                    ? 'bg-slate-900/90 border-indigo-500/40 shadow-sm'
                                                    : 'bg-slate-950/60 border-slate-800/80 opacity-70'
                                                }`}
                                        >
                                            {/* Free Track Reward */}
                                            <div className="col-span-5 flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-lg shrink-0">
                                                    {tier.freeReward.image.startsWith('http') ? (
                                                        <img src={tier.freeReward.image} alt="" className="w-7 h-7 object-contain" />
                                                    ) : (
                                                        tier.freeReward.image
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-bold text-white truncate">
                                                        {tier.freeReward.rewardName}
                                                    </p>
                                                    {tier.freeReward.claimed ? (
                                                        <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                                                            <Check className="w-3 h-3" /> Coletado
                                                        </span>
                                                    ) : unlocked ? (
                                                        <button
                                                            onClick={() => handleClaimPasseReward(tier.id, false)}
                                                            className="text-[9px] font-black uppercase bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-500/40 cursor-pointer"
                                                        >
                                                            Coletar
                                                        </button>
                                                    ) : (
                                                        <span className="text-[9px] text-slate-500">Bloqueado</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Tier Step Indicator */}
                                            <div className="col-span-2 flex flex-col items-center justify-center">
                                                <div
                                                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-xs ${unlocked
                                                            ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                                                            : 'bg-slate-800 text-slate-400'
                                                        }`}
                                                >
                                                    {tier.id}
                                                </div>
                                                <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                                                    {tier.pointsRequired} pts
                                                </span>
                                            </div>

                                            {/* Gold Track Reward */}
                                            <div className="col-span-5 flex items-center justify-end gap-2 text-right">
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-bold text-amber-200 truncate">
                                                        {tier.goldReward.rewardName}
                                                    </p>
                                                    {tier.goldReward.claimed ? (
                                                        <span className="text-[9px] font-bold text-emerald-400 flex items-center justify-end gap-0.5">
                                                            <Check className="w-3 h-3" /> Coletado
                                                        </span>
                                                    ) : unlocked && isPasseDouradoAdquirido ? (
                                                        <button
                                                            onClick={() => handleClaimPasseReward(tier.id, true)}
                                                            className="text-[9px] font-black uppercase bg-amber-400 text-slate-950 px-2 py-0.5 rounded-lg shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                                                        >
                                                            Coletar Ouro
                                                        </button>
                                                    ) : (
                                                        <span className="text-[9px] text-amber-400/60 flex items-center justify-end gap-0.5">
                                                            <Crown className="w-2.5 h-2.5" /> Requer Dourado
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-center text-lg shrink-0">
                                                    {tier.goldReward.image.startsWith('http') ? (
                                                        <img src={tier.goldReward.image} alt="" className="w-7 h-7 object-contain" />
                                                    ) : (
                                                        tier.goldReward.image
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ==================================================================== */}
                {/* FOOTER BAR */}
                {/* ==================================================================== */}
                <div className="px-5 py-3 border-t border-indigo-500/20 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 shrink-0">
                    <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Progresso salvo automaticamente
                    </span>
                    {onClose && (
                        <button
                            onClick={() => {
                                sfx.playClick();
                                onClose();
                            }}
                            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold uppercase text-[11px] cursor-pointer"
                        >
                            Fechar
                        </button>
                    )}
                </div>
            </motion.div>

            {/* ==================================================================== */}
            {/* CHEST OPENING CINEMATIC MODAL */}
            {/* ==================================================================== */}
            <AnimatePresence>
                {openingChest && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="relative max-w-sm w-full bg-gradient-to-b from-[#1c0f38] via-[#0f0724] to-[#080415] border-2 border-yellow-400 rounded-3xl p-6 text-center shadow-[0_0_60px_rgba(250,204,21,0.4)] flex flex-col items-center"
                        >
                            {/* Rotating rays background effect */}
                            <div className="w-28 h-28 relative my-3 flex items-center justify-center">
                                <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl animate-pulse" />
                                <motion.img
                                    initial={{ y: -20, rotate: -5 }}
                                    animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
                                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                                    src={openingChest.image}
                                    alt={openingChest.name}
                                    className="w-24 h-24 object-contain relative z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                                />
                            </div>

                            <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest mt-2">
                                RECOMPENSA DESBLOQUEADA!
                            </span>
                            <h3 className="text-xl font-black text-white uppercase drop-shadow">
                                {openingChest.name}
                            </h3>

                            {/* Loot cards grid */}
                            <div className="grid grid-cols-3 gap-2 w-full my-5">
                                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/40 flex flex-col items-center">
                                    <Coins className="w-5 h-5 text-amber-400 mb-1" />
                                    <span className="text-[10px] text-slate-400 uppercase font-black">Ouro</span>
                                    <span className="font-mono font-black text-sm text-amber-300">
                                        +{openingChest.gold}
                                    </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/40 flex flex-col items-center">
                                    <Gem className="w-5 h-5 text-emerald-400 mb-1" />
                                    <span className="text-[10px] text-slate-400 uppercase font-black">Gemas</span>
                                    <span className="font-mono font-black text-sm text-emerald-300">
                                        +{openingChest.gems}
                                    </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-indigo-500/40 flex flex-col items-center">
                                    <Zap className="w-5 h-5 text-indigo-400 mb-1" />
                                    <span className="text-[10px] text-slate-400 uppercase font-black">XP</span>
                                    <span className="font-mono font-black text-sm text-indigo-300">
                                        +{openingChest.xp}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    sfx.playClaim();
                                    setOpeningChest(null);
                                }}
                                className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_4px_0_#b45309] active:translate-y-1 transition-all cursor-pointer"
                            >
                                Continuar
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-70 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-4 py-2 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-wide flex items-center gap-2 border border-yellow-300"
                    >
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// 5. WRAPPER STANDALONE COM CONTROLES DE PREVIEW (DESKTOP / MOBILE SWITCHER)
// ============================================================================

export default function MissoesRecompensasStandalone() {
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
    const [profile, setProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);

    const handleResetData = () => {
        sfx.playClick();
        setProfile(DEFAULT_PROFILE);
    };

    return (
        <div className="min-h-screen bg-[#07040d] text-slate-100 flex flex-col font-sans select-none">
            {/* Top Standalone Bar */}
            <header className="bg-slate-950 border-b border-indigo-950 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black">
                        M
                    </div>
                    <div>
                        <h1 className="text-sm font-black uppercase text-white tracking-wider">
                            Interface Standalone: Missões & Recompensas
                        </h1>
                        <p className="text-[11px] text-slate-400">
                            Referência com Design, Lógica, Efeitos Sonoros e Variações Desktop / Mobile
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Viewport switch */}
                    <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
                        <button
                            onClick={() => setViewportMode('desktop')}
                            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${viewportMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Monitor className="w-3.5 h-3.5" />
                            <span>Desktop</span>
                        </button>
                        <button
                            onClick={() => setViewportMode('mobile')}
                            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${viewportMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Mobile</span>
                        </button>
                    </div>

                    <button
                        onClick={handleResetData}
                        title="Resetar dados para valores padrão"
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setIsOpen(prev => !prev)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md cursor-pointer transition-transform active:scale-95"
                    >
                        {isOpen ? 'Fechar Modal' : 'Abrir Modal'}
                    </button>
                </div>
            </header>

            {/* Main Preview Container */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
                {/* Dynamic decorative backdrop */}
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px]" />

                {viewportMode === 'mobile' ? (
                    // Mobile Mockup Frame
                    <div className="w-[390px] h-[780px] bg-slate-950 border-4 border-slate-800 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">
                        {/* Phone Speaker Notch */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-full z-50 flex items-center justify-center">
                            <div className="w-10 h-1 bg-slate-700 rounded-full" />
                        </div>

                        {/* Inner Content */}
                        <div className="flex-1 w-full h-full relative overflow-hidden pt-6">
                            {isOpen && (
                                <MissoesRecompensasModal
                                    isOpen={isOpen}
                                    onClose={() => setIsOpen(false)}
                                    profile={profile}
                                    onUpdateProfile={patch => setProfile(prev => ({ ...prev, ...patch }))}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    // Desktop View
                    <div className="w-full h-full flex items-center justify-center">
                        {isOpen ? (
                            <MissoesRecompensasModal
                                isOpen={isOpen}
                                onClose={() => setIsOpen(false)}
                                profile={profile}
                                onUpdateProfile={patch => setProfile(prev => ({ ...prev, ...patch }))}
                            />
                        ) : (
                            <div className="text-center p-8 bg-slate-900/60 border border-indigo-950 rounded-3xl max-w-md">
                                <Award className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                                <h3 className="text-lg font-black uppercase text-white mb-1">
                                    Modal de Missões Fechado
                                </h3>
                                <p className="text-xs text-slate-400 mb-4">
                                    Clique no botão abaixo para reabrir a interface de Missões e Recompensas.
                                </p>
                                <button
                                    onClick={() => setIsOpen(true)}
                                    className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer"
                                >
                                    Abrir Missões
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
