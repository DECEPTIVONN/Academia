import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Settings,
    X,
    Globe,
    Users,
    Award,
    Shield,
    Mail,
    Plus,
    ChevronRight,
    ArrowLeft,
    Check,
    Lock,
    Gamepad2,
    MessageSquare,
    Tv,
    Heart,
    Info,
    HelpCircle,
    LogOut,
    RefreshCw,
    ExternalLink,
    Smile,
    Star,
    Flame,
    User,
    Zap,
    CheckCircle,
    Bell,
    Sliders,
    Play
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

export interface SupercellIdModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    profile?: PlayerProfile;
    onUpdateProfile?: (newProfile: PlayerProfile) => void;
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

// Preset accounts to switch between
export const PRESET_ACCOUNTS = [
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
}

const soundManager = new SoundManagerStandalone();

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
// 3. COMPONENTE STANDALONE (EXATAMENTE IGUAL A src/components/SupercellIdModal.tsx)
// ============================================================================

export default function SupercellIdStandalone({
    isOpen = true,
    onClose = () => { },
    profile: propProfile,
    onUpdateProfile: propUpdateProfile
}: SupercellIdModalProps) {
    // Local fallback profile
    const [localProfile, setLocalProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);
    const profile = propProfile || localProfile;
    const onUpdateProfile = (newProfile: PlayerProfile) => {
        if (propUpdateProfile) {
            propUpdateProfile(newProfile);
        } else {
            setLocalProfile(newProfile);
        }
    };

    const [activeTab, setActiveTab] = useState<'rewards' | 'friends' | 'games'>('rewards');
    const [isSettingsMode, setIsSettingsMode] = useState<boolean>(false);
    const [statusOnline, setStatusOnline] = useState<boolean>(true);
    const [receiveFriendRequests, setReceiveFriendRequests] = useState<boolean>(true);
    const [receiveNews, setReceiveNews] = useState<boolean>(true);
    const [betaTester, setBetaTester] = useState<boolean>(false);

    // Custom states that update profile or local storage
    const [connectedEmail, setConnectedEmail] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(`sc_email_${profile.username}`) || 'deargabriel@gmail.com';
        }
        return 'deargabriel@gmail.com';
    });

    const [friendsList, setFriendsList] = useState<Friend[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`sc_friends_${profile.username}`);
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { console.error(e); }
            }
        }
        return [
            { name: 'EnjoyedStableMaju', clan: 'RETR', trophies: 1720, level: 8, emoji: '👩‍🎤', avatarBg: 'from-pink-500 to-rose-600', online: true },
            { name: 'EVIONTECH', clan: 'ELITE', trophies: 5410, level: 12, emoji: '🧔', avatarBg: 'from-yellow-500 to-amber-600', online: true },
            { name: 'LyricalSkyron', clan: 'CYBER', trophies: 3120, level: 9, emoji: '🤴', avatarBg: 'from-blue-500 to-indigo-600', online: false },
            { name: 'HANNEMANN', clan: 'T-SPN', trophies: 840, level: 4, emoji: '🥷', avatarBg: 'from-slate-700 to-slate-900', online: true },
            { name: 'JEFERSON-PR', clan: 'ELITE', trophies: 4100, level: 10, emoji: '🧙‍♂️', avatarBg: 'from-purple-500 to-fuchsia-600', online: false },
            { name: 'magomaju', clan: 'CYBER', trophies: 2950, level: 7, emoji: '🌵', avatarBg: 'from-green-500 to-emerald-600', online: true }
        ];
    });

    // Action panels / drawers inside modal
    const [editingField, setEditingField] = useState<'username' | 'email' | 'addFriend' | 'faq' | 'about' | 'switch' | null>(null);
    const [inputVal, setInputVal] = useState<string>('');
    const [faqTitle, setFaqTitle] = useState<string>('');
    const [faqText, setFaqText] = useState<string>('');
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

    // Sync email when profile changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setConnectedEmail(localStorage.getItem(`sc_email_${profile.username}`) || 'deargabriel@gmail.com');
        }
    }, [profile.username]);

    // Save friends to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(`sc_friends_${profile.username}`, JSON.stringify(friendsList));
        }
    }, [friendsList, profile.username]);

    if (!isOpen) return null;

    const handleOpenEdit = (field: 'username' | 'email' | 'addFriend') => {
        soundManager.playMove();
        setEditingField(field);
        if (field === 'username') {
            setInputVal(profile.username);
        } else if (field === 'email') {
            setInputVal(connectedEmail);
        } else {
            setInputVal('');
        }
    };

    const handleSaveEdit = () => {
        if (!inputVal.trim()) return;
        soundManager.playLevelUp();

        if (editingField === 'username') {
            const nextProfile = {
                ...profile,
                username: inputVal.trim()
            };
            onUpdateProfile(nextProfile);
            if (typeof window !== 'undefined') {
                localStorage.setItem(`sc_email_${inputVal.trim()}`, connectedEmail);
            }
        } else if (editingField === 'email') {
            setConnectedEmail(inputVal.trim());
            if (typeof window !== 'undefined') {
                localStorage.setItem(`sc_email_${profile.username}`, inputVal.trim());
            }
        } else if (editingField === 'addFriend') {
            const randLevel = Math.floor(Math.random() * 10) + 3;
            const randTrophies = Math.floor(Math.random() * 4000) + 500;
            const emojis = ['🕵️', '🧟', '🧑‍🚀', '👸', '🧙', '🦸', '🦹', '🐱', '🐼', '🤖'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            const gradientBgs = [
                'from-teal-500 to-emerald-600',
                'from-indigo-500 to-purple-600',
                'from-orange-500 to-red-600',
                'from-pink-500 to-rose-600',
                'from-sky-500 to-blue-600'
            ];
            const randomBg = gradientBgs[Math.floor(Math.random() * gradientBgs.length)];

            const newFriend: Friend = {
                name: inputVal.trim(),
                clan: 'RETR',
                trophies: randTrophies,
                level: randLevel,
                emoji: randomEmoji,
                avatarBg: randomBg,
                online: Math.random() > 0.3
            };

            setFriendsList([newFriend, ...friendsList]);
        }

        setEditingField(null);
        setInputVal('');
    };

    const handleSwitchAccount = (preset: typeof PRESET_ACCOUNTS[0]) => {
        soundManager.playLevelUp();

        const updatedProfile: PlayerProfile = {
            ...profile,
            username: preset.username,
            clanName: preset.clanName,
            trophies: preset.trophies,
            gold: preset.gold,
            gems: preset.gems,
            level: preset.level,
            xp: preset.xp
        };

        onUpdateProfile(updatedProfile);

        if (typeof window !== 'undefined') {
            localStorage.setItem(`sc_email_${preset.username}`, preset.email);
        }
        setConnectedEmail(preset.email);

        setEditingField(null);
        setIsSettingsMode(false);
    };

    const handleLogOut = () => {
        if (typeof window !== 'undefined' && window.confirm('Deseja realmente sair do Supercell ID? Seu perfil local será mantido, mas você voltará para a conta padrão.')) {
            soundManager.playScoreSaved();
            handleSwitchAccount(PRESET_ACCOUNTS[0]);
        }
    };

    const openFaq = (title: string, text: string) => {
        soundManager.playMove();
        setFaqTitle(title);
        setFaqText(text);
        setEditingField('faq');
    };

    const handleRemoveFriend = (name: string) => {
        if (typeof window !== 'undefined' && window.confirm(`Tem certeza que deseja remover ${name} da sua lista de amigos?`)) {
            soundManager.playHold();
            setFriendsList(friendsList.filter(f => f.name !== name));
            setSelectedFriend(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm select-none" id="supercell-id-container">
            {/* Background click to close */}
            <div className="absolute inset-0 cursor-default" onClick={onClose} />

            {/* Main Supercell ID Modal Frame */}
            <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="relative bg-[#f4f6f8] text-slate-800 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[92vh]"
            >
                {/* Dynamic header background based on screen context */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

                {/* ================= HEADER AREA ================= */}
                <div className="p-5 flex items-center justify-between border-b border-slate-200 bg-white relative z-10 shrink-0">
                    {/* Left Button (Gear Settings or Back button) */}
                    {isSettingsMode ? (
                        <button
                            onClick={() => { soundManager.playMove(); setIsSettingsMode(false); }}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-90"
                            id="sc-settings-back-btn"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={() => { soundManager.playMove(); setIsSettingsMode(true); }}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-90"
                            id="sc-settings-gear-btn"
                            title="Configurações do Supercell ID"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    )}

                    {/* Center Header: Avatar (Main Menu) or Title (Settings Mode) */}
                    {!isSettingsMode ? (
                        <div className="flex flex-col items-center">
                            {/* Profile Barbarian Ring Avatar */}
                            <div className="relative group">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 p-1 shadow-[0_4px_15px_rgba(245,158,11,0.25)] relative">
                                    <div className="w-full h-full rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-4xl overflow-hidden">
                                        👑
                                    </div>
                                </div>
                                {statusOnline && (
                                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-md animate-pulse" />
                                )}
                            </div>

                            {/* ID Name */}
                            <div className="mt-2.5 flex items-center gap-1.5 bg-slate-100 px-3.5 py-1 rounded-full border border-slate-200">
                                <div className="bg-slate-900 text-white font-extrabold text-[8px] px-1 py-0.2 rounded tracking-tighter uppercase font-sans border border-slate-700">
                                    ID
                                </div>
                                <span className="text-xs font-black tracking-tight text-slate-900 uppercase">
                                    {profile.username}
                                </span>
                            </div>

                            {/* Clan Name or Email */}
                            <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">
                                🏆 {profile.clanName || 'SEM CLÃ'}
                            </span>
                        </div>
                    ) : (
                        <div className="flex-1 text-center">
                            <span className="text-sm font-black uppercase text-slate-900 tracking-wider">
                                Configurações
                            </span>
                        </div>
                    )}

                    {/* Right Button (Close Modal) */}
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-90"
                        id="sc-modal-close-btn"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ================= MAIN CONTENT BODY ================= */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 relative z-10 no-scrollbar">

                    {/* ========== A. MENU TABS VIEW (NORMAL MODE) ========== */}
                    {!isSettingsMode ? (
                        <>
                            {/* Three Tab Controls */}
                            <div className="grid grid-cols-3 gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                <button
                                    onClick={() => { soundManager.playMove(); setActiveTab('rewards'); }}
                                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${activeTab === 'rewards'
                                            ? 'bg-slate-100 text-indigo-600 font-black shadow-inner'
                                            : 'text-slate-500 hover:text-slate-900 font-bold'
                                        }`}
                                >
                                    <Award className="w-5 h-5" />
                                    <span className="text-[9px] uppercase tracking-wider">ID Rewards</span>
                                </button>

                                <button
                                    onClick={() => { soundManager.playMove(); setActiveTab('friends'); }}
                                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all relative ${activeTab === 'friends'
                                            ? 'bg-slate-100 text-indigo-600 font-black shadow-inner'
                                            : 'text-slate-500 hover:text-slate-900 font-bold'
                                        }`}
                                >
                                    <Users className="w-5 h-5" />
                                    <span className="text-[9px] uppercase tracking-wider">Amigos</span>
                                    {/* Micro indicator badge for online friends */}
                                    <span className="absolute top-1 right-4 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                                </button>

                                <button
                                    onClick={() => { soundManager.playMove(); setActiveTab('games'); }}
                                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${activeTab === 'games'
                                            ? 'bg-slate-100 text-indigo-600 font-black shadow-inner'
                                            : 'text-slate-500 hover:text-slate-900 font-bold'
                                        }`}
                                >
                                    <Gamepad2 className="w-5 h-5" />
                                    <span className="text-[9px] uppercase tracking-wider">Meus Jogos</span>
                                </button>
                            </div>

                            {/* TAB CONTENT: 1. REWARDS */}
                            {activeTab === 'rewards' && (
                                <div className="space-y-4">
                                    {/* Holographic Points/Trophy Card */}
                                    <div className="relative p-6 rounded-3xl border border-indigo-400 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white shadow-xl overflow-hidden flex flex-col justify-between aspect-[16/10] select-none">
                                        {/* Visual glowing grid lines */}
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_70%)] pointer-events-none" />
                                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:12px_12px]" />

                                        {/* Logo & ID Shield */}
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-1.5">
                                                <div className="bg-white text-slate-900 font-black text-[9px] px-1.5 py-0.5 rounded tracking-tighter leading-none border border-indigo-300">
                                                    SUPER<br />CELL
                                                </div>
                                                <span className="text-xs font-black tracking-widest text-indigo-300">ID</span>
                                            </div>
                                            <Shield className="w-6 h-6 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                                        </div>

                                        {/* Score / Trophies PTS */}
                                        <div className="my-2 relative z-10">
                                            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-300">Pontuação do Império</span>
                                            <div className="flex items-baseline gap-1 mt-0.5">
                                                <span className="text-4xl font-black font-sans tracking-tight text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]">
                                                    {profile.trophies * 3 + 125}
                                                </span>
                                                <span className="text-base font-black text-indigo-400">PTS</span>
                                            </div>
                                        </div>

                                        {/* Account card bottom banner */}
                                        <div className="flex items-center justify-between border-t border-indigo-500/20 pt-3 relative z-10 mt-1">
                                            <span className="text-xs font-black tracking-wide text-indigo-200 uppercase truncate">
                                                {profile.username}
                                            </span>
                                            <div className="bg-indigo-600/30 text-indigo-300 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-indigo-500/20">
                                                CONECTADO
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informative Promotion Banner */}
                                    <div
                                        onClick={() => {
                                            soundManager.playLevelUp();
                                            if (typeof window !== 'undefined') {
                                                window.alert("Promoção Especial: Complete missões no Retro Tetris para ganhar XP e resgatar bônus de moedas e gemas na estrada de Copas!");
                                            }
                                        }}
                                        className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-400 transition-all active:scale-98 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
                                                🎁
                                            </div>
                                            <div className="text-left">
                                                <h4 className="text-xs font-black text-slate-900 uppercase">Junte pontos e ganhe prêmios</h4>
                                                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                                                    Complete conquistas de Tetris para desbloquear itens exclusivos.
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                                    </div>
                                </div>
                            )}

                            {/* TAB CONTENT: 2. AMIGOS (FRIENDS) */}
                            {activeTab === 'friends' && (
                                <div className="space-y-3">
                                    {/* Subtitle count */}
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase px-1">
                                        <span>Lista de Amigos ({friendsList.length})</span>
                                        <span className="text-emerald-500">
                                            ● {friendsList.filter(f => f.online).length} online
                                        </span>
                                    </div>

                                    {/* Friends List Container */}
                                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                                        {friendsList.map((friend) => (
                                            <div
                                                key={friend.name}
                                                onClick={() => { soundManager.playMove(); setSelectedFriend(friend); }}
                                                className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Circular Avatar */}
                                                    <div className="relative shrink-0">
                                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${friend.avatarBg} flex items-center justify-center text-xl shadow-inner border-2 border-white`}>
                                                            {friend.emoji}
                                                        </div>
                                                        {friend.online && (
                                                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                                                        )}
                                                    </div>

                                                    <div className="text-left">
                                                        <h4 className="text-xs font-black text-slate-900 tracking-wide uppercase group-hover:text-indigo-600 transition-colors">
                                                            {friend.name}
                                                        </h4>
                                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                                                            🏆 {friend.clan} | LVL {friend.level}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right trophies stat */}
                                                <div className="text-right flex items-center gap-2">
                                                    <div className="text-right">
                                                        <span className="text-xs font-black text-amber-600 font-mono tracking-tight block leading-none">
                                                            {friend.trophies}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">
                                                            copas
                                                        </span>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Friend Floating Button */}
                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={() => handleOpenEdit('addFriend')}
                                            className="px-4 py-2.5 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-xl shadow-md border border-indigo-400 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" /> Adicionar Amigos
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB CONTENT: 3. MEUS JOGOS */}
                            {activeTab === 'games' && (
                                <div className="space-y-3">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase px-1 block">
                                        Conexão de Jogos Supercell
                                    </span>

                                    {/* List of Mock games */}
                                    <div className="space-y-2.5">
                                        {/* Retro Tetris */}
                                        <div className="p-4 bg-white border-2 border-indigo-500/40 rounded-2xl shadow-md flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl text-white shadow">
                                                    👾
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="text-xs font-black text-slate-900 uppercase">Retro Tetris</h4>
                                                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded uppercase">
                                                        Conectado
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-black text-amber-600 font-mono tracking-tight block leading-none">
                                                    {profile.trophies}
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase">copas</span>
                                            </div>
                                        </div>

                                        {/* Clash Royale */}
                                        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between opacity-85 hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center text-2xl text-white shadow">
                                                    👑
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="text-xs font-black text-slate-900 uppercase">Clash Royale</h4>
                                                    <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                                                        Supercell ID Conectado
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-black text-slate-600 font-mono tracking-tight block leading-none">
                                                    5.340
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase">troféus</span>
                                            </div>
                                        </div>

                                        {/* Brawl Stars */}
                                        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between opacity-85 hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-2xl text-white shadow">
                                                    ⭐
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="text-xs font-black text-slate-900 uppercase">Brawl Stars</h4>
                                                    <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                                                        Supercell ID Conectado
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-black text-slate-600 font-mono tracking-tight block leading-none">
                                                    24.150
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase">troféus</span>
                                            </div>
                                        </div>

                                        {/* Clash of Clans */}
                                        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between opacity-85 hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-amber-700 rounded-xl flex items-center justify-center text-2xl text-white shadow">
                                                    🏰
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="text-xs font-black text-slate-900 uppercase">Clash of Clans</h4>
                                                    <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                                                        Supercell ID Conectado
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-black text-slate-600 font-mono tracking-tight block leading-none">
                                                    CV 14
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase">centro</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // ========== B. SETTINGS MODE (CONFIGURAÇÕES) ==========
                        <div className="space-y-4 text-left">
                            {/* Toggles Container */}
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
                                {/* Mostrar status on-line */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-black text-slate-900 uppercase">Mostrar status on-line</h4>
                                        <p className="text-[9px] text-slate-500">Seus amigos podem ver quando você está ativo.</p>
                                    </div>
                                    <button
                                        onClick={() => { soundManager.playMove(); setStatusOnline(!statusOnline); }}
                                        className={`w-12 h-6.5 rounded-full p-1 transition-all ${statusOnline ? 'bg-emerald-500 flex justify-end' : 'bg-slate-300 flex justify-start'}`}
                                    >
                                        <span className="w-4.5 h-4.5 rounded-full bg-white shadow-md" />
                                    </button>
                                </div>

                                {/* Receber pedidos de amizade */}
                                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                    <div>
                                        <h4 className="text-xs font-black text-slate-900 uppercase">Receber pedidos de amizade</h4>
                                        <p className="text-[9px] text-slate-500">Permitir que outros jogadores enviem solicitações.</p>
                                    </div>
                                    <button
                                        onClick={() => { soundManager.playMove(); setReceiveFriendRequests(!receiveFriendRequests); }}
                                        className={`w-12 h-6.5 rounded-full p-1 transition-all ${receiveFriendRequests ? 'bg-emerald-500 flex justify-end' : 'bg-slate-300 flex justify-start'}`}
                                    >
                                        <span className="w-4.5 h-4.5 rounded-full bg-white shadow-md" />
                                    </button>
                                </div>
                            </div>

                            {/* Account Box Container (Player ID, Email change, Account Switch, LogOut) */}
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
                                {/* ID de jogador */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block leading-none">ID de jogador</span>
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{profile.username}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleOpenEdit('username')}
                                        className="px-2.5 py-1 text-[10px] font-black text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-all"
                                    >
                                        ALTERAR
                                    </button>
                                </div>

                                {/* Email address */}
                                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 max-w-[180px]">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Conectou-se com</span>
                                            <span className="text-xs font-bold text-slate-800 truncate block">{connectedEmail}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleOpenEdit('email')}
                                        className="px-2.5 py-1 text-[10px] font-black text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-all"
                                    >
                                        ALTERAR
                                    </button>
                                </div>

                                {/* Alternar conta button */}
                                <div
                                    onClick={() => { soundManager.playMove(); setEditingField('switch'); }}
                                    className="flex items-center justify-between border-t border-slate-100 pt-4 cursor-pointer hover:bg-slate-50 -mx-4 px-4 py-2 transition-all group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-indigo-600 shrink-0">
                                            <RefreshCw className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 uppercase">Alternar conta</h4>
                                            <p className="text-[9px] text-slate-500">Mudar para outra conta salva do Supercell ID.</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                </div>

                                {/* Sair button */}
                                <div
                                    onClick={handleLogOut}
                                    className="flex items-center gap-2.5 border-t border-slate-100 pt-4 cursor-pointer hover:bg-red-50 -mx-4 px-4 py-2 text-red-600 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                                        <LogOut className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-xs font-black uppercase">Sair</h4>
                                        <p className="text-[9px] text-red-500/70">Desconectar temporariamente do Supercell ID.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Protection Banner */}
                            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-start gap-3 relative">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-lg text-orange-500 shrink-0">
                                    🛡️
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xs font-black text-slate-900 uppercase">Proteção da conta</h4>
                                    <p className="text-[9.5px] text-slate-500 leading-normal mt-0.5">
                                        Proteja sua conta Supercell ID com uma medida extra de segurança por celular ou chaves de segurança.
                                    </p>
                                    <button
                                        onClick={() => {
                                            soundManager.playLevelUp();
                                            if (typeof window !== 'undefined') {
                                                window.alert("Proteção de conta Ativada com sucesso!");
                                            }
                                        }}
                                        className="mt-2 px-3 py-1 bg-slate-900 text-white font-black text-[9px] uppercase tracking-wider rounded shadow hover:bg-slate-800 transition-all"
                                    >
                                        ATIVAR
                                    </button>
                                </div>
                            </div>

                            {/* Email subscription details */}
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">ASSINATURAS DO EMAIL</span>

                                {/* Receber notícias e atualizações */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-black text-slate-900 uppercase">Notícias e atualizações</h4>
                                        <p className="text-[9px] text-slate-500">Receba boletins semanais das arenas Supercell.</p>
                                    </div>
                                    <button
                                        onClick={() => { soundManager.playMove(); setReceiveNews(!receiveNews); }}
                                        className={`w-12 h-6.5 rounded-full p-1 transition-all ${receiveNews ? 'bg-emerald-500 flex justify-end' : 'bg-slate-300 flex justify-start'}`}
                                    >
                                        <span className="w-4.5 h-4.5 rounded-full bg-white shadow-md" />
                                    </button>
                                </div>

                                {/* Lançamentos em beta */}
                                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                    <div>
                                        <h4 className="text-xs font-black text-slate-900 uppercase">Lançamentos em beta</h4>
                                        <p className="text-[9px] text-slate-500">Convites para testar novos recursos em primeira mão.</p>
                                    </div>
                                    <button
                                        onClick={() => { soundManager.playMove(); setBetaTester(!betaTester); }}
                                        className={`w-12 h-6.5 rounded-full p-1 transition-all ${betaTester ? 'bg-emerald-500 flex justify-end' : 'bg-slate-300 flex justify-start'}`}
                                    >
                                        <span className="w-4.5 h-4.5 rounded-full bg-white shadow-md" />
                                    </button>
                                </div>
                            </div>

                            {/* Informações list links */}
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
                                <div className="p-3 bg-slate-50/50">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">INFORMAÇÕES</span>
                                </div>

                                <div
                                    onClick={() => openFaq('O que é o Supercell ID?', 'O Supercell ID é uma ferramenta de login segura criada pela Supercell para salvar e resgatar o progresso de todos os seus jogos mobile em qualquer dispositivo, protegendo de perdas e facilitando a transição de contas de forma instantânea.')}
                                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-all text-xs font-bold text-slate-800"
                                >
                                    <span>O que é o Supercell ID?</span>
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                </div>

                                <div
                                    onClick={() => openFaq('FAQs de Ajuda', '1. Como mudo meu e-mail?\nBasta clicar no botão ALTERAR ao lado do seu e-mail nas configurações e seguir os passos de autenticação rápida.\n\n2. Como posso salvar minha conta?\nContanto que você tenha associado um e-mail válido, seus recordes de blocos e Copas do Retro Tetris serão salvos automaticamente na nuvem.')}
                                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-all text-xs font-bold text-slate-800"
                                >
                                    <span>FAQs</span>
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                </div>

                                <div
                                    onClick={() => openFaq('Vídeo de tutorial', 'Tutoriais de vídeo em breve! Nossa equipe está preparando guias interativos para você aproveitar todas as recompensas de clã e arena vinculadas à sua conta de empilhar blocos.')}
                                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-all text-xs font-bold text-slate-800"
                                >
                                    <span>Vídeo de tutorial</span>
                                    <ExternalLink className="w-4 h-4 text-slate-400" />
                                </div>

                                <div
                                    onClick={() => openFaq('Termos de Uso', 'Ao criar e conectar um Supercell ID, você concorda com nossos termos de licença de usuário final, comprometendo-se com o jogo justo, respeito nas salas de chat de clã, e proteção dos seus dados pessoais.')}
                                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-all text-xs font-bold text-slate-800"
                                >
                                    <span>Termos de Uso</span>
                                    <ExternalLink className="w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ================= EXTRA ACTION SHEETS / DETAILED MODAL VIEWS ================= */}
                <AnimatePresence>
                    {editingField !== null && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            className="absolute inset-0 bg-white z-50 flex flex-col p-6"
                            id="sc-subpanel-drawer"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                                <button
                                    onClick={() => { soundManager.playMove(); setEditingField(null); }}
                                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center active:scale-90 transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                                    {editingField === 'username' && 'Alterar Nome de Usuário'}
                                    {editingField === 'email' && 'Trocar E-mail Conectado'}
                                    {editingField === 'addFriend' && 'Adicionar Amigo por Tag'}
                                    {editingField === 'faq' && faqTitle}
                                    {editingField === 'switch' && 'Selecionar Conta Supercell ID'}
                                </span>
                                <div className="w-8 h-8" /> {/* Balance placeholder */}
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-grow overflow-y-auto py-5 text-left no-scrollbar">

                                {/* 1. EDIT NICKNAME / EMAIL / ADD FRIEND INPUT */}
                                {(editingField === 'username' || editingField === 'email' || editingField === 'addFriend') && (
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                            {editingField === 'username' && 'Novo apelido de jogador'}
                                            {editingField === 'email' && 'Novo endereço de e-mail'}
                                            {editingField === 'addFriend' && 'Digite o nome do amigo'}
                                        </label>

                                        <input
                                            type="text"
                                            value={inputVal}
                                            onChange={(e) => setInputVal(e.target.value)}
                                            placeholder={editingField === 'addFriend' ? 'Ex: BarbarianMaster' : ''}
                                            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />

                                        <p className="text-[9.5px] text-slate-500 leading-normal">
                                            {editingField === 'username' && 'Seu novo apelido será atualizado imediatamente nos recordes locais, no chat do clã e na estrada competitiva.'}
                                            {editingField === 'email' && 'Enviaremos um código de autenticação rápida de 6 dígitos para o novo e-mail para validar a alteração.'}
                                            {editingField === 'addFriend' && 'O jogador receberá um convite para o clã e aparecerá online na sua lista de amigos.'}
                                        </p>

                                        <button
                                            onClick={handleSaveEdit}
                                            disabled={!inputVal.trim()}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                                        >
                                            {editingField === 'addFriend' ? 'Enviar Convite' : 'Confirmar Alteração'}
                                        </button>
                                    </div>
                                )}

                                {/* 2. FAQ DISPLAY CONTAINER */}
                                {editingField === 'faq' && (
                                    <div className="space-y-4 text-slate-600 text-xs font-semibold leading-relaxed whitespace-pre-line">
                                        {faqText}
                                    </div>
                                )}

                                {/* 3. SWITCH ACCOUNT LIST DISPLAY */}
                                {editingField === 'switch' && (
                                    <div className="space-y-3.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Contas Salvas</span>

                                        <div className="space-y-2">
                                            {PRESET_ACCOUNTS.map((preset) => {
                                                const isCurrent = profile.username === preset.username;

                                                return (
                                                    <div
                                                        key={preset.username}
                                                        onClick={() => !isCurrent && handleSwitchAccount(preset)}
                                                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${isCurrent
                                                                ? 'bg-indigo-50 border-indigo-300 pointer-events-none'
                                                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer active:scale-98'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-xl shadow">
                                                                👑
                                                            </div>
                                                            <div className="text-left">
                                                                <h4 className="text-xs font-black text-slate-900 uppercase">
                                                                    {preset.username}
                                                                </h4>
                                                                <span className="text-[9px] text-slate-500 font-bold block mt-0.5">
                                                                    {preset.email}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            {isCurrent ? (
                                                                <span className="flex items-center gap-0.5 text-[9px] font-black text-indigo-600 uppercase bg-white border border-indigo-200 px-2.5 py-0.8 rounded-full">
                                                                    <Check className="w-3 h-3 text-indigo-600 inline" /> ATIVA
                                                                </span>
                                                            ) : (
                                                                <div className="text-right">
                                                                    <span className="text-xs font-black text-amber-600 font-mono tracking-tight block leading-none">
                                                                        {preset.trophies}
                                                                    </span>
                                                                    <span className="text-[8px] font-bold text-slate-400 uppercase block">
                                                                        copas
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ================= FRIEND INTERACTION DRAWER OVERLAY ================= */}
                <AnimatePresence>
                    {selectedFriend !== null && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            className="absolute inset-x-0 bottom-0 bg-white rounded-t-[2.5rem] p-5 shadow-[0_-15px_40px_rgba(0,0,0,0.25)] border-t border-slate-200 z-[60] text-center"
                            id="friend-action-drawer"
                        >
                            {/* Close mini line */}
                            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

                            <div className="flex flex-col items-center gap-2 mb-5">
                                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${selectedFriend.avatarBg} flex items-center justify-center text-3xl shadow-md border-2 border-slate-100`}>
                                    {selectedFriend.emoji}
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide leading-none mt-1">
                                    {selectedFriend.name}
                                </h3>
                                <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-widest">
                                    🏆 {selectedFriend.clan} | Nível {selectedFriend.level} | {selectedFriend.trophies} Copas
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${selectedFriend.online ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                    {selectedFriend.online ? '● ONLINE AGORA' : '○ OFFLINE'}
                                </span>
                            </div>

                            {/* Interaction Buttons Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <button
                                    onClick={() => {
                                        soundManager.playLevelUp();
                                        if (typeof window !== 'undefined') {
                                            window.alert(`Desafio de batalha enviado para ${selectedFriend.name}! Aguardando resposta...`);
                                        }
                                        setSelectedFriend(null);
                                    }}
                                    className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow border border-indigo-400 transition-all active:scale-95 cursor-pointer"
                                >
                                    Friendly Battle ⚔️
                                </button>

                                <button
                                    onClick={() => handleRemoveFriend(selectedFriend.name)}
                                    className="py-3 bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs uppercase tracking-widest rounded-xl border border-red-100 transition-all active:scale-95 cursor-pointer"
                                >
                                    Remover Amigo 🗑️
                                </button>
                            </div>

                            <button
                                onClick={() => setSelectedFriend(null)}
                                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase rounded-xl transition-all active:scale-95 mt-1 cursor-pointer"
                            >
                                Voltar
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
        </div>
    );
}
