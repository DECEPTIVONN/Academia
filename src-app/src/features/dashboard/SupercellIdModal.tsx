import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import '@/features/auth/auth-screen.css';
import {
    Settings,
    X,
    Users,
    Award,
    Shield,
    Info,
    Plus,
    ArrowLeft,
    Check,
    Lock,
    Gamepad2,
    HelpCircle,
    LogOut,
    RefreshCw,
    Zap,
    CheckCircle,
    QrCode,
    Smartphone,
    Monitor,
    RotateCcw,
    Sparkles,
    Search,
    ChevronRight
} from 'lucide-react';

// ============================================================================
// 1. TIPOS & MODELOS DE DADOS (SUPERCELL ID STANDALONE)
// ============================================================================

export interface PlayerProfile {
    username: string;
    clanName: string;
    trophies: number;
    gold: number;
    gems: number;
    xp: number;
    level: number;
    email?: string;
}

export interface Friend {
    name: string;
    clan: string;
    trophies: number;
    level: number;
    emoji: string;
    avatarBg: string;
    online: boolean;
}

export interface SupercellGame {
    id: string;
    name: string;
    tagline: string;
    icon: string;
    bannerColor: string;
    stats: string;
    connected: boolean;
}

// Preset accounts to switch between
const PRESET_ACCOUNTS: PlayerProfile[] = [
    {
        username: 'DearGabrielGS',
        clanName: 'GABRIEL GS',
        trophies: 1385,
        gold: 50739,
        gems: 4165,
        xp: 850,
        level: 7,
        email: 'deargabriel@gmail.com'
    },
    {
        username: 'ClashKing99',
        clanName: 'ELITE CLAN',
        trophies: 5320,
        gold: 124500,
        gems: 890,
        xp: 2200,
        level: 12,
        email: 'clashking@gmail.com'
    },
    {
        username: 'TetrisGod',
        clanName: 'CYBER T-SPN',
        trophies: 9800,
        gold: 450000,
        gems: 15400,
        xp: 4800,
        level: 15,
        email: 'tetrisgod@gmail.com'
    }
];

const INITIAL_FRIENDS: Friend[] = [
    { name: 'EnjoyedStableMaju', clan: 'RETR', trophies: 1720, level: 8, emoji: '👩‍🎤', avatarBg: 'from-pink-500 to-rose-600', online: true },
    { name: 'EVIONTECH', clan: 'ELITE', trophies: 5410, level: 12, emoji: '🧔', avatarBg: 'from-yellow-500 to-amber-600', online: true },
    { name: 'LyricalSkyron', clan: 'CYBER', trophies: 3120, level: 9, emoji: '🤴', avatarBg: 'from-blue-500 to-indigo-600', online: false },
    { name: 'HANNEMANN', clan: 'T-SPN', trophies: 840, level: 4, emoji: '🥷', avatarBg: 'from-slate-700 to-slate-900', online: true },
    { name: 'JEFERSON-PR', clan: 'ELITE', trophies: 4100, level: 10, emoji: '🧙‍♂️', avatarBg: 'from-purple-500 to-fuchsia-600', online: false },
    { name: 'magomaju', clan: 'CYBER', trophies: 2950, level: 7, emoji: '🌵', avatarBg: 'from-green-500 to-emerald-600', online: true }
];

const SUPERCELL_GAMES: SupercellGame[] = [
    {
        id: 'clash_royale',
        name: 'Clash Royale',
        tagline: 'Estratégia e Duelos de Cartas',
        icon: '👑',
        bannerColor: 'from-blue-600 to-indigo-900',
        stats: 'Arena 5 · 1.385 Troféus',
        connected: true
    },
    {
        id: 'brawl_stars',
        name: 'Brawl Stars',
        tagline: 'Ação 3v3 e Battle Royale',
        icon: '⭐',
        bannerColor: 'from-amber-500 to-yellow-600',
        stats: 'Ranque Mítico · 22.400 Troféus',
        connected: true
    },
    {
        id: 'clash_of_clans',
        name: 'Clash of Clans',
        tagline: 'Construa, Batalhe e Evolua a Vila',
        icon: '⚔️',
        bannerColor: 'from-red-600 to-orange-700',
        stats: 'Centro de Vila 14 · Liga Titã',
        connected: true
    },
    {
        id: 'squad_busters',
        name: 'Squad Busters',
        tagline: 'Batalhas Épicas em Grupo',
        icon: '💥',
        bannerColor: 'from-emerald-600 to-green-800',
        stats: 'Mundo Verde · Nível de Esquadrão 42',
        connected: true
    },
    {
        id: 'hay_day',
        name: 'Hay Day',
        tagline: 'A Fazenda Mais Famosa do Mundo',
        icon: '🌽',
        bannerColor: 'from-lime-600 to-emerald-800',
        stats: 'Fazenda Nível 38',
        connected: false
    },
    {
        id: 'boom_beach',
        name: 'Boom Beach',
        tagline: 'Invada Bases e Salve os Ilhéus',
        icon: '💣',
        bannerColor: 'from-cyan-600 to-blue-800',
        stats: 'Quartel General Nível 18',
        connected: false
    }
];

// ============================================================================
// 2. SISTEMA DE ÁUDIO WEB AUDIO API STANDALONE (ZERO ARQUIVOS EXTERNOS)
// ============================================================================

class SupercellIdSoundEffects {
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
            osc.frequency.setValueAtTime(520, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(780, this.ctx.currentTime + 0.06);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.06);
        } catch {
            // Audio fallback
        }
    }

    playSuccess() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            [587.33, 739.99, 880.00].forEach((freq, idx) => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                gain.gain.setValueAtTime(0.15, now + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.25);
            });
        } catch {
            // Audio fallback
        }
    }

    playSwitch() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(640, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.12);
        } catch {
            // Audio fallback
        }
    }
}

const scAudio = new SupercellIdSoundEffects();

// ============================================================================
// 3. COMPONENTE PRINCIPAL SUPERCELL ID MODAL
// ============================================================================

export interface SupercellIdProps {
    isOpen?: boolean;
    onClose?: () => void;
    profile?: PlayerProfile;
    onUpdateProfile?: (newProfile: PlayerProfile) => void;
}

export function SupercellIdModal({
    isOpen = true,
    onClose,
    profile: externalProfile,
    onUpdateProfile: externalUpdateProfile
}: SupercellIdProps) {
    const [profile, setProfile] = useState<PlayerProfile>(externalProfile || PRESET_ACCOUNTS[0]);
    const [activeTab, setActiveTab] = useState<'rewards' | 'friends' | 'games'>('rewards');
    const [isSettingsMode, setIsSettingsMode] = useState<boolean>(false);

    // Settings toggles
    const [statusOnline, setStatusOnline] = useState<boolean>(true);
    const [receiveFriendRequests, setReceiveFriendRequests] = useState<boolean>(true);
    const [receiveNews, setReceiveNews] = useState<boolean>(true);
    const [betaTester, setBetaTester] = useState<boolean>(false);

    // Friends state
    const [friendsList, setFriendsList] = useState<Friend[]>(INITIAL_FRIENDS);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [friendSearchQuery, setFriendSearchQuery] = useState<string>('');

    // Drawers & Modals
    const [editingField, setEditingField] = useState<'username' | 'email' | 'addFriend' | 'faq' | 'about' | 'switch' | 'qrcode' | null>(null);
    const [inputVal, setInputVal] = useState<string>('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2800);
    };

    const handleOpenEdit = (field: 'username' | 'email' | 'addFriend' | 'faq' | 'about' | 'switch' | 'qrcode') => {
        scAudio.playClick();
        setEditingField(field);
        if (field === 'username') {
            setInputVal(profile.username);
        } else if (field === 'email') {
            setInputVal(profile.email || 'deargabriel@gmail.com');
        } else {
            setInputVal('');
        }
    };

    const handleSaveEdit = () => {
        if (!inputVal.trim()) return;
        scAudio.playSuccess();

        if (editingField === 'username') {
            const next = { ...profile, username: inputVal.trim() };
            setProfile(next);
            if (externalUpdateProfile) externalUpdateProfile(next);
            showToast('Nome atualizado no Supercell ID!');
        } else if (editingField === 'email') {
            const next = { ...profile, email: inputVal.trim() };
            setProfile(next);
            if (externalUpdateProfile) externalUpdateProfile(next);
            showToast('E-mail do Supercell ID atualizado!');
        } else if (editingField === 'addFriend') {
            const emojis = ['🥷', '🧙', '🦸', '👸', '🤖', '🦊', '🦁', '🐉'];
            const gradients = [
                'from-purple-500 to-indigo-600',
                'from-blue-500 to-cyan-600',
                'from-amber-500 to-orange-600',
                'from-emerald-500 to-teal-600',
                'from-pink-500 to-rose-600'
            ];
            const newFriend: Friend = {
                name: inputVal.trim(),
                clan: 'BRASIL',
                trophies: Math.floor(Math.random() * 3000) + 1000,
                level: Math.floor(Math.random() * 8) + 4,
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
                avatarBg: gradients[Math.floor(Math.random() * gradients.length)],
                online: true
            };
            setFriendsList(prev => [newFriend, ...prev]);
            showToast(`Pedido de amizade enviado para ${newFriend.name}!`);
        }

        setEditingField(null);
    };

    const handleSwitchAccount = (acc: PlayerProfile) => {
        scAudio.playSwitch();
        setProfile(acc);
        if (externalUpdateProfile) externalUpdateProfile(acc);
        setEditingField(null);
        setIsSettingsMode(false);
        showToast(`Conectado à conta: ${acc.username}`);
    };

    const handleRemoveFriend = (friendName: string) => {
        scAudio.playClick();
        setFriendsList(prev => prev.filter(f => f.name !== friendName));
        setSelectedFriend(null);
        showToast(`${friendName} removido da lista de amigos.`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md select-none">
            <div className="absolute inset-0" onClick={onClose} />

            {/* Main Supercell ID Container */}
            <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-xl bg-gradient-to-b from-[#0c1833] via-[#091226] to-[#040813] border-2 border-blue-500/50 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.3)] flex flex-col max-h-[92vh] overflow-hidden text-slate-100"
                onClick={e => e.stopPropagation()}
            >
                {/* ==================================================================== */}
                {/* TOP SUPERCELL ID BRANDED HEADER */}
                {/* ==================================================================== */}
                <div className="px-5 py-4 border-b border-blue-500/20 bg-blue-950/40 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Supercell ID Logo Badge */}
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center justify-center">
                            <span className="font-black text-white text-xs tracking-tighter">SC ID</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm sm:text-base font-black tracking-wide text-white uppercase drop-shadow">
                                    SUPERCELL ID
                                </h2>
                                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    CONECTADO
                                </span>
                            </div>
                            <p className="text-[11px] text-blue-300 font-medium">
                                Sua conta global protegida e sincronizada na nuvem
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Settings Mode Toggle */}
                        <button
                            onClick={() => {
                                scAudio.playClick();
                                setIsSettingsMode(prev => !prev);
                            }}
                            title="Configurações do Supercell ID"
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center cursor-pointer transition-all active:scale-95 ${isSettingsMode
                                    ? 'bg-blue-600 border-blue-400 text-white'
                                    : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
                                }`}
                        >
                            <Settings className="w-4 h-4" />
                        </button>

                        {onClose && (
                            <button
                                onClick={() => {
                                    scAudio.playClick();
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
                {/* USER PROFILE MINI-CARD & ONLINE STATUS */}
                {/* ==================================================================== */}
                <div className="px-5 py-3.5 bg-slate-950/40 border-b border-blue-900/30 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        {/* User Avatar with Status Dot */}
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 border-2 border-blue-400/80 flex items-center justify-center text-2xl shadow-md">
                                🧙‍♂️
                            </div>
                            <div
                                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${statusOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-500'
                                    }`}
                            />
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-white text-sm tracking-wide">
                                    {profile.username}
                                </span>
                                <button
                                    onClick={() => handleOpenEdit('username')}
                                    className="text-slate-400 hover:text-blue-300 text-xs cursor-pointer"
                                    title="Editar nome"
                                >
                                    ✎
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">
                                {profile.email || 'deargabriel@gmail.com'}
                            </p>
                        </div>
                    </div>

                    {/* Online status switch */}
                    <button
                        onClick={() => {
                            scAudio.playClick();
                            setStatusOnline(prev => !prev);
                            showToast(statusOnline ? 'Status alterado para Offline' : 'Status alterado para Online');
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${statusOnline
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                                : 'bg-slate-900 border-slate-700 text-slate-400'
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${statusOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span>{statusOnline ? 'Online' : 'Inativo'}</span>
                    </button>
                </div>

                {/* ==================================================================== */}
                {/* TABS NAVIGATION */}
                {/* ==================================================================== */}
                {!isSettingsMode && (
                    <div className="px-4 pt-3 pb-2 bg-slate-950/20 border-b border-blue-900/20 flex gap-2 shrink-0">
                        <button
                            onClick={() => {
                                scAudio.playClick();
                                setActiveTab('rewards');
                            }}
                            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${activeTab === 'rewards'
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.35)]'
                                    : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-400'
                                }`}
                        >
                            <Award className="w-4 h-4 text-amber-400" />
                            <span>Vantagens</span>
                        </button>

                        <button
                            onClick={() => {
                                scAudio.playClick();
                                setActiveTab('friends');
                            }}
                            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${activeTab === 'friends'
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.35)]'
                                    : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-400'
                                }`}
                        >
                            <Users className="w-4 h-4 text-emerald-400" />
                            <span>Amigos ({friendsList.length})</span>
                        </button>

                        <button
                            onClick={() => {
                                scAudio.playClick();
                                setActiveTab('games');
                            }}
                            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${activeTab === 'games'
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.35)]'
                                    : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-400'
                                }`}
                        >
                            <Gamepad2 className="w-4 h-4 text-purple-400" />
                            <span>Meus Jogos</span>
                        </button>
                    </div>
                )}

                {/* ==================================================================== */}
                {/* MAIN BODY CONTENT */}
                {/* ==================================================================== */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
                    {/* SETTINGS VIEW */}
                    {isSettingsMode ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => setIsSettingsMode(false)}
                                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Voltar ao Perfil</span>
                                </button>
                                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                                    Configurações Supercell ID
                                </span>
                            </div>

                            {/* Toggles Card */}
                            <div className="p-4 rounded-2xl bg-slate-900/80 border border-blue-900/40 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-black text-white uppercase">Visível para amigos</h4>
                                        <p className="text-[10px] text-slate-400">Seus amigos podem ver quando você está online</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={statusOnline}
                                        onChange={e => setStatusOnline(e.target.checked)}
                                        className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                                    />
                                </div>

                                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-black text-white uppercase">Receber solicitações de amizade</h4>
                                        <p className="text-[10px] text-slate-400">Permitir que outros jogadores enviem convites</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={receiveFriendRequests}
                                        onChange={e => setReceiveFriendRequests(e.target.checked)}
                                        className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                                    />
                                </div>

                                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-black text-white uppercase">Notícias e ofertas especiais</h4>
                                        <p className="text-[10px] text-slate-400">Receba emotes exclusivos e atualizações por e-mail</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={receiveNews}
                                        onChange={e => setReceiveNews(e.target.checked)}
                                        className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                                    />
                                </div>

                                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-black text-white uppercase">Programa Beta Tester</h4>
                                        <p className="text-[10px] text-slate-400">Acesso antecipado a novos recursos e modos</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={betaTester}
                                        onChange={e => setBetaTester(e.target.checked)}
                                        className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Account Management & Switcher */}
                            <div className="p-4 rounded-2xl bg-slate-900/80 border border-blue-900/40 space-y-3">
                                <h4 className="text-xs font-black text-white uppercase flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 text-blue-400" /> Alternar de Conta
                                </h4>
                                <div className="space-y-2">
                                    {PRESET_ACCOUNTS.map(acc => {
                                        const isCurrent = acc.username === profile.username;
                                        return (
                                            <div
                                                key={acc.username}
                                                onClick={() => handleSwitchAccount(acc)}
                                                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isCurrent
                                                        ? 'bg-blue-600/20 border-blue-500 text-white'
                                                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                                                    }`}
                                            >
                                                <div>
                                                    <p className="text-xs font-black">{acc.username}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">
                                                        {acc.trophies} Troféus · Nível {acc.level}
                                                    </p>
                                                </div>
                                                {isCurrent ? (
                                                    <span className="text-[9px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40 px-2 py-0.5 rounded-full">
                                                        Conta Ativa
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 font-bold hover:text-white">
                                                        Trocar →
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* FAQ & Support Buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleOpenEdit('faq')}
                                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <HelpCircle className="w-4 h-4 text-blue-400" />
                                    <span>Dúvidas Frequentes</span>
                                </button>
                                <button
                                    onClick={() => handleOpenEdit('about')}
                                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <Info className="w-4 h-4 text-cyan-400" />
                                    <span>Termos & Sobre</span>
                                </button>
                            </div>

                            {/* Logout Action */}
                            <button
                                onClick={() => {
                                    scAudio.playClick();
                                    showToast('Sessão encerrada com segurança.');
                                    if (onClose) onClose();
                                }}
                                className="w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Encerrar Sessão do Supercell ID</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* TAB 1: RECOMPENSAS & VANTAGENS */}
                            {activeTab === 'rewards' && (
                                <div className="space-y-4">
                                    {/* Hero Connected Banner */}
                                    <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-900/60 via-indigo-950/70 to-slate-950 border-2 border-blue-500/50 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 p-0.5 flex items-center justify-center text-3xl shadow-md shrink-0">
                                                🧙‍♂️
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                                                    VANTAGEM EXCLUSIVA ATIVADA
                                                </span>
                                                <h3 className="text-base font-black text-white uppercase">
                                                    Emote Exclusivo do Mago
                                                </h3>
                                                <p className="text-[11px] text-slate-300 leading-snug">
                                                    Vinculação com Supercell ID desbloqueia este emote e salva seu progresso para sempre.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-2">
                                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase flex items-center gap-1">
                                                <Check className="w-3.5 h-3.5" /> Resgatado
                                            </span>
                                        </div>
                                    </div>

                                    {/* 4 Supercell ID Pillars */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-blue-900/40 flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase">Backup Seguro na Nuvem</h4>
                                                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                                                    Troque de aparelho ou reinstale o jogo sem perder uma única carta ou troféu.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-blue-900/40 flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase">+250 Gemas Grátis</h4>
                                                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                                                    Bônus direto entregue ao vincular seu e-mail pela primeira vez.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-blue-900/40 flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                                                <Gamepad2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase">Todos os Jogos Integrados</h4>
                                                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                                                    Amigos conectados no Clash Royale aparecem no Brawl Stars e vice-versa.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-blue-900/40 flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase">Proteção 2FA</h4>
                                                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                                                    Códigos de verificação seguros enviados por e-mail para cada novo login.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Share QR Code Button */}
                                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 text-xs text-slate-300">
                                            <QrCode className="w-5 h-5 text-blue-400" />
                                            <span>Compartilhe seu perfil usando seu Código QR único</span>
                                        </div>
                                        <button
                                            onClick={() => handleOpenEdit('qrcode')}
                                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase cursor-pointer"
                                        >
                                            Ver QR Code
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: AMIGOS */}
                            {activeTab === 'friends' && (
                                <div className="space-y-4">
                                    {/* Top Bar with Add Friend button */}
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="relative flex-1">
                                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                placeholder="Buscar amigo por nome..."
                                                value={friendSearchQuery}
                                                onChange={e => setFriendSearchQuery(e.target.value)}
                                                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                            />
                                        </div>

                                        <button
                                            onClick={() => handleOpenEdit('addFriend')}
                                            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Adicionar</span>
                                        </button>
                                    </div>

                                    {/* Friends List */}
                                    <div className="space-y-2.5">
                                        {friendsList
                                            .filter(f => f.name.toLowerCase().includes(friendSearchQuery.toLowerCase()))
                                            .map(friend => (
                                                <div
                                                    key={friend.name}
                                                    onClick={() => {
                                                        scAudio.playClick();
                                                        setSelectedFriend(friend);
                                                    }}
                                                    className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-blue-900/30 hover:border-blue-500/50 flex items-center justify-between gap-3 transition-all cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${friend.avatarBg} flex items-center justify-center text-xl shadow-md`}>
                                                                {friend.emoji}
                                                            </div>
                                                            <span
                                                                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${friend.online ? 'bg-emerald-400' : 'bg-slate-600'
                                                                    }`}
                                                            />
                                                        </div>

                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-white text-xs">{friend.name}</span>
                                                                <span className="text-[9px] font-bold text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">
                                                                    {friend.clan}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                                                <span>🏆 {friend.trophies}</span>
                                                                <span>·</span>
                                                                <span>Nível {friend.level}</span>
                                                                <span>·</span>
                                                                <span className={friend.online ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                                                                    {friend.online ? 'Online' : 'Offline'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: MEUS JOGOS */}
                            {activeTab === 'games' && (
                                <div className="space-y-3">
                                    <p className="text-xs text-slate-400 px-1">
                                        Jogos da Supercell vinculados à mesma conta do Supercell ID:
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {SUPERCELL_GAMES.map(game => (
                                            <div
                                                key={game.id}
                                                className="p-3.5 rounded-2xl bg-slate-900/80 border border-blue-900/30 flex flex-col justify-between gap-3 hover:border-blue-500/40 transition-all"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${game.bannerColor} flex items-center justify-center text-2xl shadow-md shrink-0`}>
                                                        {game.icon}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs font-black text-white uppercase tracking-wide truncate">
                                                            {game.name}
                                                        </h4>
                                                        <p className="text-[10px] text-slate-400 truncate">{game.tagline}</p>
                                                        <p className="text-[10px] text-amber-400 font-mono font-bold mt-1">
                                                            {game.stats}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px]">
                                                    {game.connected ? (
                                                        <span className="text-emerald-400 font-black uppercase flex items-center gap-1">
                                                            <CheckCircle className="w-3.5 h-3.5" /> Conectado
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-500 font-bold">Não instalado</span>
                                                    )}

                                                    <button
                                                        onClick={() => {
                                                            scAudio.playClick();
                                                            showToast(`Abrindo ${game.name}...`);
                                                        }}
                                                        className="px-3 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white font-black uppercase tracking-wider transition-colors cursor-pointer"
                                                    >
                                                        Jogar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ==================================================================== */}
                {/* FOOTER BAR */}
                {/* ==================================================================== */}
                <div className="px-5 py-3 border-t border-blue-500/20 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 shrink-0">
                    <div className="flex items-center gap-1.5 text-[11px]">
                        <Shield className="w-3.5 h-3.5 text-blue-400" />
                        <span>Supercell ID Seguro · v4.12</span>
                    </div>

                    <button
                        onClick={() => handleOpenEdit('switch')}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                        <span>Trocar Conta</span>
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </motion.div>

            {/* ==================================================================== */}
            {/* FRIEND INSPECTION MODAL */}
            {/* ==================================================================== */}
            <AnimatePresence>
                {selectedFriend && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-sm w-full bg-slate-900 border-2 border-blue-500/60 rounded-3xl p-5 text-center flex flex-col items-center shadow-2xl"
                        >
                            <button
                                onClick={() => setSelectedFriend(null)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${selectedFriend.avatarBg} flex items-center justify-center text-3xl shadow-lg my-2`}>
                                {selectedFriend.emoji}
                            </div>

                            <h3 className="text-base font-black text-white uppercase">{selectedFriend.name}</h3>
                            <p className="text-xs text-blue-400 font-bold">Clã: {selectedFriend.clan}</p>

                            <div className="grid grid-cols-2 gap-2 w-full my-4">
                                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                    <span className="text-[10px] text-slate-400 uppercase font-black block">Troféus</span>
                                    <span className="font-mono font-black text-sm text-amber-300">
                                        🏆 {selectedFriend.trophies}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                    <span className="text-[10px] text-slate-400 uppercase font-black block">Status</span>
                                    <span className={`font-black text-xs ${selectedFriend.online ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {selectedFriend.online ? 'Online Agora' : 'Offline'}
                                    </span>
                                </div>
                            </div>

                            <div className="w-full space-y-2">
                                <button
                                    onClick={() => {
                                        scAudio.playSuccess();
                                        showToast(`Convite de duelo enviado para ${selectedFriend.name}!`);
                                        setSelectedFriend(null);
                                    }}
                                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-md"
                                >
                                    Convidar para Duelo Amistoso
                                </button>

                                <button
                                    onClick={() => handleRemoveFriend(selectedFriend.name)}
                                    className="w-full py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-bold text-xs uppercase tracking-wider cursor-pointer"
                                >
                                    Remover Amigo
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ==================================================================== */}
            {/* EDIT MODAL / DRAWER */}
            {/* ==================================================================== */}
            <AnimatePresence>
                {editingField && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-sm w-full bg-slate-900 border-2 border-blue-500 rounded-3xl p-5 text-left flex flex-col shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-black text-white uppercase">
                                    {editingField === 'username' && 'Alterar Nome de Usuário'}
                                    {editingField === 'email' && 'Alterar E-mail do SC ID'}
                                    {editingField === 'addFriend' && 'Adicionar Amigo por ID'}
                                    {editingField === 'switch' && 'Alternar Conta'}
                                    {editingField === 'qrcode' && 'Seu Código QR Supercell ID'}
                                    {editingField === 'faq' && 'Perguntas Frequentes'}
                                    {editingField === 'about' && 'Sobre o Supercell ID'}
                                </h3>
                                <button
                                    onClick={() => setEditingField(null)}
                                    className="text-slate-400 hover:text-white cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Text Input for edits */}
                            {(editingField === 'username' || editingField === 'email' || editingField === 'addFriend') && (
                                <div className="space-y-3">
                                    <input
                                        type={editingField === 'email' ? 'email' : 'text'}
                                        value={inputVal}
                                        onChange={e => setInputVal(e.target.value)}
                                        placeholder={
                                            editingField === 'username'
                                                ? 'Digite seu novo apelido...'
                                                : editingField === 'email'
                                                    ? 'nome@provedor.com'
                                                    : 'Digite a tag ou nome do amigo...'
                                        }
                                        className="w-full bg-slate-950 border border-blue-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                    />

                                    <button
                                        onClick={handleSaveEdit}
                                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-md"
                                    >
                                        Salvar & Confirmar
                                    </button>
                                </div>
                            )}

                            {/* QR Code view */}
                            {editingField === 'qrcode' && (
                                <div className="flex flex-col items-center py-3 space-y-3">
                                    <div className="w-44 h-44 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
                                        <div className="w-full h-full border-4 border-slate-900 rounded-lg flex flex-col items-center justify-center text-slate-900">
                                            <QrCode className="w-28 h-28" />
                                            <span className="text-[9px] font-mono font-bold mt-1">#SCID-{profile.username}</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 text-center">
                                        Aponte a câmera de outro jogador para conectar instantaneamente como amigos.
                                    </p>
                                </div>
                            )}

                            {/* FAQ Accordion */}
                            {editingField === 'faq' && (
                                <div className="space-y-2 text-xs text-slate-300 max-h-60 overflow-y-auto no-scrollbar">
                                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                                        <h5 className="font-bold text-white mb-1">Como resgato minhas gemas grátis?</h5>
                                        <p className="text-[11px] text-slate-400">Ao vincular seu e-mail no Supercell ID pela primeira vez, as 250 gemas são adicionadas imediatamente ao seu saldo.</p>
                                    </div>
                                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                                        <h5 className="font-bold text-white mb-1">Posso jogar em múltiplos aparelhos?</h5>
                                        <p className="text-[11px] text-slate-400">Sim! Basta fazer login com seu Supercell ID em qualquer dispositivo para continuar de onde parou.</p>
                                    </div>
                                </div>
                            )}

                            {/* About Text */}
                            {editingField === 'about' && (
                                <div className="text-xs text-slate-400 space-y-2">
                                    <p>O Supercell ID é um serviço oficial da Supercell que protege suas contas de jogos e permite que você jogue em múltiplos aparelhos com total segurança.</p>
                                    <p className="text-[10px] text-slate-500">Versão: 4.12.0 · Termos de Serviço e Política de Privacidade aplicáveis.</p>
                                </div>
                            )}

                            {/* Switch Account Quick List */}
                            {editingField === 'switch' && (
                                <div className="space-y-2">
                                    {PRESET_ACCOUNTS.map(acc => (
                                        <div
                                            key={acc.username}
                                            onClick={() => handleSwitchAccount(acc)}
                                            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500 cursor-pointer flex items-center justify-between"
                                        >
                                            <span className="text-xs font-black text-white">{acc.username}</span>
                                            <span className="text-[10px] font-mono text-amber-400">{acc.trophies} 🏆</span>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-70 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-wide flex items-center gap-2 border border-blue-300"
                    >
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// 4. WRAPPER STANDALONE COM CONTROLES DE PREVIEW (DESKTOP / MOBILE SWITCHER)
// ============================================================================

export default function SupercellIdStandalone() {
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
    const [profile, setProfile] = useState<PlayerProfile>(PRESET_ACCOUNTS[0]);

    const handleReset = () => {
        scAudio.playClick();
        setProfile(PRESET_ACCOUNTS[0]);
    };

    return (
        <div className="min-h-screen bg-[#040813] text-slate-100 flex flex-col font-sans select-none">
            {/* Top Standalone Bar */}
            <header className="bg-slate-950 border-b border-blue-950 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-black text-xs">
                        SC
                    </div>
                    <div>
                        <h1 className="text-sm font-black uppercase text-white tracking-wider">
                            Interface Standalone: Supercell ID
                        </h1>
                        <p className="text-[11px] text-blue-300">
                            Referência Autêntica com Amigos, Jogos, Alternador de Contas e Suporte Desktop / Mobile
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Viewport switch */}
                    <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
                        <button
                            onClick={() => setViewportMode('desktop')}
                            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${viewportMode === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Monitor className="w-3.5 h-3.5" />
                            <span>Desktop</span>
                        </button>
                        <button
                            onClick={() => setViewportMode('mobile')}
                            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${viewportMode === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Mobile</span>
                        </button>
                    </div>

                    <button
                        onClick={handleReset}
                        title="Resetar dados"
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setIsOpen(prev => !prev)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer transition-transform active:scale-95"
                    >
                        {isOpen ? 'Fechar Modal' : 'Abrir Modal'}
                    </button>
                </div>
            </header>

            {/* Main Preview Container */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />

                {viewportMode === 'mobile' ? (
                    // Mobile Mockup Frame
                    <div className="w-[390px] h-[780px] bg-slate-950 border-4 border-slate-800 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-full z-50 flex items-center justify-center">
                            <div className="w-10 h-1 bg-slate-700 rounded-full" />
                        </div>

                        <div className="flex-1 w-full h-full relative overflow-hidden pt-6">
                            {isOpen && (
                                <SupercellIdModal
                                    isOpen={isOpen}
                                    onClose={() => setIsOpen(false)}
                                    profile={profile}
                                    onUpdateProfile={setProfile}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    // Desktop View
                    <div className="w-full h-full flex items-center justify-center">
                        {isOpen ? (
                            <SupercellIdModal
                                isOpen={isOpen}
                                onClose={() => setIsOpen(false)}
                                profile={profile}
                                onUpdateProfile={setProfile}
                            />
                        ) : (
                            <div className="text-center p-8 bg-slate-900/60 border border-blue-950 rounded-3xl max-w-md">
                                <Shield className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                                <h3 className="text-lg font-black uppercase text-white mb-1">
                                    Supercell ID Fechado
                                </h3>
                                <p className="text-xs text-slate-400 mb-4">
                                    Clique no botão para reabrir a interface de conexões e amigos.
                                </p>
                                <button
                                    onClick={() => setIsOpen(true)}
                                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer"
                                >
                                    Abrir Supercell ID
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
