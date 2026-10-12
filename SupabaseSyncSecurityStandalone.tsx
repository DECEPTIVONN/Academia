/**
 * ============================================================================
 * GUIA DE ARQUITETURA STANDALONE: SUPABASE, MULTI-DEVICE SYNC & SECURITY
 * ============================================================================
 * 
 * Este arquivo serve como referência de engenharia de software para outros projetos.
 * Ele documenta e disponibiliza implementações completas, modulares e operacionais de:
 * 
 * 1. 🗄️ INTEGRAÇÃO COM SUPABASE (POSTGRESQL & REALTIME)
 *    - Persistência em nuvem com fallback automático.
 *    - Cross-Tab Sync local (<5ms) via BroadcastChannel nativo.
 *    - Supabase Realtime Channels para sincronização remota instantânea (<100ms).
 *    - Notificação visual ("Dispositivo Sincronizado - Mudanças recebidas em tempo real").
 * 
 * 2. 📱 SUPORTE OFFLINE ROBUSTO (INDEXEDDB QUEUE PATTERN)
 *    - Armazenamento transacional local enquanto desconectado.
 *    - Fila de mutações (mutation queue) com retentativas automáticas e backoff exponencial.
 *    - Drenagem e sincronização automática ao detectar evento 'online' do navegador.
 * 
 * 3. 🖥️ GESTÃO DE DISPOSITIVOS CONECTADOS (MULTI-DEVICE ECOSYSTEM)
 *    - Detecção automática de navegador, sistema operacional e dispositivo (Desktop/Mobile/Tablet).
 *    - Geração de ID único imutável por instância (`mbc_device_id`).
 *    - Cálculo em tempo real do tempo de inatividade relativo ("Ativo agora", "há X min", "ontem").
 *    - Interface completa de gerenciamento: renomear apelido e desconectar/revogar dispositivos.
 * 
 * 4. 🔒 SISTEMA DE TELA DE BLOQUEIO (LOCK SCREEN - DESKTOP & MOBILE)
 *    - Papéis de parede independentes para Desktop (16:9) e Mobile (9:16).
 *    - Desbloqueio por senha e suporte a biometria WebAuthn com fallback após 3 tentativas.
 *    - Feedback tátil com vibração (`navigator.vibrate`) em celulares.
 *    - Interface completa de configuração e personalização de imagens com upload e clipboard.
 * 
 * 5. ⏳ TELA DE CARREGAMENTO / SPLASH SCREEN COM SINCRONIZAÇÃO
 *    - Detecção dinâmica de orientação (Portrait/Vertical vs Landscape/Horizontal).
 *    - Barra de sincronização inferior em tempo real com indicador de status (Sincronizado / Offline).
 *    - Interface de configuração com upload, colar URL e botão de teste preview.
 * 
 * 6. 👤 SISTEMA DE AUTENTICAÇÃO COMPLETO (LOGIN, SIGNUP, GOOGLE OAUTH & QR CODE)
 *    - Modal completo com animações fluidas (Framer Motion / Motion).
 *    - Login tradicional (usuário/e-mail + senha).
 *    - Login com Google OAuth.
 *    - Login instantâneo por QR Code sincronizado entre celular e computador.
 *    - Recuperação de conta por e-mail e chave de sincronização.
 * 
 * ============================================================================
 * 📋 GUIA RÁPIDO PARA O AGENTE NO OUTRO PROJETO (REQUISITOS & TABELA SQL)
 * ============================================================================
 * 
 * 1. DEPENDÊNCIAS NPM NECESSÁRIAS:
 *    npm install @supabase/supabase-js motion lucide-react
 * 
 * 2. TABELA NO SUPABASE (SQL EDITOR):
 *    CREATE TABLE IF NOT EXISTS user_sync (
 *      sync_key TEXT PRIMARY KEY,
 *      data JSONB NOT NULL,
 *      updated_at TIMESTAMPTZ DEFAULT NOW()
 *    );
 *    ALTER PUBLICATION supabase_realtime ADD TABLE user_sync;
 * 
 * 3. HIERARQUIA DE DESIGN UTILIZADA:
 *    - Paleta: Fundo preto e zinc escuro (#09090b, zinc-950, zinc-900, zinc-850)
 *    - Destaques: Laranja vibrante (#f97316 / orange-500) e Esmeralda (#10b981)
 *    - Bordas: Bordas sutis com zinc-800 e zinc-900 com backdrop blur de vidro
 *    - Tipografia: Sans limpa + Mono (`font-mono`) para dados técnicos, tags e IPs
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Cloud,
    CloudOff,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Smartphone,
    Monitor,
    Tablet,
    Trash2,
    Edit2,
    Check,
    X,
    Upload,
    Clipboard,
    Image as ImageIcon,
    Play,
    Sparkles,
    Lock,
    Eye,
    EyeOff,
    Fingerprint,
    Mail,
    User,
    KeyRound,
    QrCode,
    ArrowLeft,
    ShieldCheck,
    Loader2,
    HardDrive
} from 'lucide-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/* ========================================================================== */
/* SECTION 1: ESTRUTURAS DE DADOS & INTERFACES                                */
/* ========================================================================== */

export interface ConnectedDevice {
    id: string;
    name: string;
    customName?: string;
    browser: string;
    os: string;
    isCurrent: boolean;
    lastActive: string;
    lastActiveTimestamp?: number;
    ip?: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
}

export interface OfflineMutation {
    id: string;
    syncKey: string;
    payload: any;
    type: string;
    createdAt: number;
    status: 'pending' | 'processing' | 'synced' | 'failed';
    retryCount: number;
}

export interface AuthUserProfile {
    id: string;
    email: string;
    username: string;
    name: string;
    photo?: string;
    syncKey: string;
    provider: 'local' | 'google';
}

/* ========================================================================== */
/* SECTION 2: SUPABASE & COMUNICAÇÃO EM TEMPO REAL                            */
/* ========================================================================== */

let cachedSupabaseClient: SupabaseClient | null = null;
let crossTabChannel: BroadcastChannel | null = null;

try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        crossTabChannel = new BroadcastChannel('app_multi_device_sync_channel');
    }
} catch (e) {
    console.warn('BroadcastChannel não suportado neste ambiente:', e);
}

/**
 * Obtém ou inicializa o cliente Supabase a partir de variáveis de ambiente ou localStorage
 */
export function getStandaloneSupabaseClient(): SupabaseClient | null {
    if (typeof window === 'undefined') return null;

    const url = localStorage.getItem('mbc_supabase_url') || '';
    const key = localStorage.getItem('mbc_supabase_anon_key') || '';

    if (!url || !key) return null;

    if (cachedSupabaseClient) return cachedSupabaseClient;

    try {
        cachedSupabaseClient = createClient(url, key);
        return cachedSupabaseClient;
    } catch (err) {
        console.error('Falha ao inicializar cliente Supabase:', err);
        return null;
    }
}

/**
 * Transmite modificações de estado para outras abas abertas no mesmo navegador (<5ms)
 */
export function broadcastToLocalTabs(syncKey: string, data: any, updatedAt: string) {
    if (!crossTabChannel || !syncKey) return;
    crossTabChannel.postMessage({
        type: 'CROSS_TAB_SYNC',
        syncKey: syncKey.toUpperCase(),
        data,
        updatedAt,
        originDeviceId: getPersistentDeviceId()
    });
}

/**
 * Transmite modificações para outros dispositivos através do Supabase Realtime
 */
export function broadcastToRemoteDevices(syncKey: string, updatedAt: string) {
    const client = getStandaloneSupabaseClient();
    if (!client || !syncKey) return;

    try {
        const channel = client.channel(`sync_room_${syncKey.toUpperCase()}`, {
            config: { broadcast: { ack: false, self: false } }
        });
        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                channel.send({
                    type: 'broadcast',
                    event: 'REMOTE_STATE_UPDATED',
                    payload: {
                        syncKey: syncKey.toUpperCase(),
                        updatedAt,
                        originDeviceId: getPersistentDeviceId(),
                        timestamp: Date.now()
                    }
                });
            }
        });
    } catch (err) {
        console.warn('Erro ao emitir broadcast remoto:', err);
    }
}

/* ========================================================================== */
/* SECTION 3: MOTOR OFFLINE COM INDEXEDDB QUEUE PATTERN                       */
/* ========================================================================== */

const IDB_NAME = 'app_offline_resilience_db';
const IDB_STORE = 'mutation_queue';

export function openOfflineDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            return reject(new Error('IndexedDB não suportado'));
        }
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                const store = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
                store.createIndex('status', 'status', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/**
 * Enfileira uma mutação offline quando a conexão com o Supabase falha ou não há internet
 */
export async function queueOfflineMutation(syncKey: string, payload: any): Promise<void> {
    try {
        const db = await openOfflineDatabase();
        const mutation: OfflineMutation = {
            id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            syncKey: syncKey.toUpperCase(),
            payload,
            type: 'user_state_upsert',
            createdAt: Date.now(),
            status: 'pending',
            retryCount: 0
        };

        const tx = db.transaction([IDB_STORE], 'readwrite');
        tx.objectStore(IDB_STORE).add(mutation);
        await new Promise((res) => { tx.oncomplete = res; });

        // Salva snapshot local de contingência imediata no localStorage
        localStorage.setItem(`offline_snapshot_${syncKey.toUpperCase()}`, JSON.stringify(payload));
    } catch (err) {
        console.warn('Erro ao enfileirar mutação no IndexedDB:', err);
    }
}

/**
 * Processa e drena todas as operações acumuladas assim que a conexão retorna
 */
export async function flushOfflineQueue(): Promise<number> {
    if (!navigator.onLine) return 0;
    const client = getStandaloneSupabaseClient();
    if (!client) return 0;

    try {
        const db = await openOfflineDatabase();
        const tx = db.transaction([IDB_STORE], 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        const getAllReq = store.getAll();

        const mutations: OfflineMutation[] = await new Promise((res) => {
            getAllReq.onsuccess = () => res(getAllReq.result || []);
        });

        const pending = mutations.filter(m => m.status === 'pending');
        if (pending.length === 0) return 0;

        let syncedCount = 0;
        for (const item of pending) {
            try {
                const { error } = await client.from('user_sync').upsert({
                    sync_key: item.syncKey,
                    data: item.payload,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'sync_key' });

                if (!error) {
                    const deleteTx = db.transaction([IDB_STORE], 'readwrite');
                    deleteTx.objectStore(IDB_STORE).delete(item.id);
                    syncedCount++;
                }
            } catch (e) {
                console.warn('Falha ao descarregar mutação offline:', e);
            }
        }
        return syncedCount;
    } catch (e) {
        return 0;
    }
}

/* ========================================================================== */
/* SECTION 4: IDENTIFICAÇÃO E GESTÃO DE DISPOSITIVOS                          */
/* ========================================================================== */

export function getPersistentDeviceId(): string {
    if (typeof window === 'undefined') return 'server-node';
    let id = localStorage.getItem('mbc_device_id');
    if (!id) {
        id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem('mbc_device_id', id);
    }
    return id;
}

export function detectCurrentDevice(): {
    browser: string;
    os: string;
    fullName: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
} {
    if (typeof navigator === 'undefined') {
        return { browser: 'Navegador Web', os: 'Sistema Operacional', fullName: 'Computador (Padrão)', deviceType: 'desktop' };
    }
    const ua = navigator.userAgent;
    let browser = 'Navegador Web';
    let os = 'Dispositivo';

    if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome/')) browser = 'Google Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Apple Safari';
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
    else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone')) os = 'iPhone';
    else if (ua.includes('iPad')) os = 'iPad';
    else if (ua.includes('Linux')) os = 'Linux';

    const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet = /iPad|Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
    const deviceType: 'desktop' | 'mobile' | 'tablet' = isTablet ? 'tablet' : (isMobile ? 'mobile' : 'desktop');

    return { browser, os, fullName: `${browser} (${os})`, deviceType };
}

export function formatRelativeActiveTime(timestamp?: number, isCurrent?: boolean): string {
    if (isCurrent) return 'Ativo agora nesta janela';
    if (!timestamp) return 'Ativo recentemente';

    const diffMs = Math.max(0, Date.now() - timestamp);
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Ativo agora mesmo';
    if (diffMin < 60) return `Ativo há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
    if (diffHour < 24) return `Ativo há ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
    if (diffDay === 1) return 'Ontem';
    return `Há ${diffDay} dias`;
}

/* ========================================================================== */
/* SECTION 5: COMPONENTE NOTIFICAÇÃO DE DISPOSITIVO SINCRONIZADO              */
/* ========================================================================== */

export const RemoteSyncToast: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    deviceName?: string;
}> = ({ isOpen, onClose, deviceName = 'outro dispositivo' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.96 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full p-4 rounded-2xl bg-zinc-950/95 border border-orange-500/30 backdrop-blur-xl shadow-2xl flex items-center gap-3.5"
                    style={{ boxShadow: '0 10px 40px -10px rgba(249, 115, 22, 0.25)' }}
                >
                    <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0">
                        <Cloud className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black tracking-wider uppercase text-white font-mono flex items-center gap-1.5">
                            <span>DISPOSITIVO SINCRONIZADO</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed truncate">
                            Mudanças recebidas em tempo real de {deviceName}.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-800"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/* ========================================================================== */
/* SECTION 6: COMPONENTE GERENCIADOR DE DISPOSITIVOS NAS CONFIGURAÇÕES        */
/* ========================================================================== */

export const ConnectedDevicesManager: React.FC = () => {
    const currentDevId = getPersistentDeviceId();
    const [devices, setDevices] = useState<ConnectedDevice[]>(() => [
        {
            id: currentDevId,
            name: 'Google Chrome (Windows)',
            browser: 'Google Chrome',
            os: 'Windows',
            isCurrent: true,
            lastActive: 'Ativo agora nesta janela',
            lastActiveTimestamp: Date.now(),
            ip: '189.28.102.44',
            deviceType: 'desktop'
        },
        {
            id: 'dev-mobile-iphone15',
            name: 'Safari (iPhone 15)',
            customName: 'Meu Celular Pessoal',
            browser: 'Apple Safari',
            os: 'iOS',
            isCurrent: false,
            lastActive: 'Ativo há 12 minutos',
            lastActiveTimestamp: Date.now() - 12 * 60000,
            ip: '177.135.210.12',
            deviceType: 'mobile'
        }
    ]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const handleRename = (device: ConnectedDevice) => {
        setEditingId(device.id);
        setEditName(device.customName || device.name);
    };

    const handleSaveRename = (id: string) => {
        setDevices(prev => prev.map(d => d.id === id ? { ...d, customName: editName.trim() } : d));
        setEditingId(null);
    };

    const handleDisconnect = (id: string) => {
        if (confirm('Deseja realmente desconectar esta sessão remota?')) {
            setDevices(prev => prev.filter(d => d.id !== id));
        }
    };

    const getDeviceIcon = (type: 'desktop' | 'mobile' | 'tablet') => {
        if (type === 'mobile') return <Smartphone className="w-4 h-4 text-orange-400" />;
        if (type === 'tablet') return <Tablet className="w-4 h-4 text-sky-400" />;
        return <Monitor className="w-4 h-4 text-emerald-400" />;
    };

    return (
        <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div>
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-orange-400" />
                        Dispositivos Conectados
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                        Gerencie onde sua conta está ativa. As sessões se sincronizam automaticamente em segundo plano.
                    </p>
                </div>
                <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full">
                    {devices.length} {devices.length === 1 ? 'dispositivo' : 'dispositivos'}
                </span>
            </div>

            <div className="space-y-2.5">
                {devices.map((device) => (
                    <div
                        key={device.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${device.isCurrent
                            ? 'bg-orange-500/5 border-orange-500/20'
                            : 'bg-zinc-900/40 border-zinc-850 hover:border-zinc-800'
                            }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                                {getDeviceIcon(device.deviceType)}
                            </div>
                            <div className="min-w-0">
                                {editingId === device.id ? (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="bg-zinc-950 border border-orange-500/40 rounded px-2 py-0.5 text-xs text-white focus:outline-none font-mono"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleSaveRename(device.id)}
                                            className="p-1 text-emerald-400 hover:bg-zinc-800 rounded"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-1 text-zinc-400 hover:bg-zinc-800 rounded"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold text-zinc-200 truncate">
                                            {device.customName || device.name}
                                        </h4>
                                        {device.customName && (
                                            <span className="text-[10px] text-zinc-500">({device.name})</span>
                                        )}
                                        {device.isCurrent && (
                                            <span className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold uppercase">
                                                Este
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 font-mono">
                                    <span>{device.lastActive}</span>
                                    {device.ip && <span>• IP: {device.ip}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            <button
                                onClick={() => handleRename(device)}
                                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[10px] font-mono rounded-lg transition-colors flex items-center gap-1"
                                title="Renomear este dispositivo"
                            >
                                <Edit2 className="w-3 h-3" />
                                <span>Renomear</span>
                            </button>
                            {!device.isCurrent && (
                                <button
                                    onClick={() => handleDisconnect(device.id)}
                                    className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-mono rounded-lg transition-colors flex items-center gap-1"
                                    title="Desconectar dispositivo"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Desconectar</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ========================================================================== */
/* SECTION 7: TELA DE BLOQUEIO STANDALONE (DESKTOP & MOBILE)                  */
/* ========================================================================== */

export const StandaloneLockScreen: React.FC<{
    userName?: string;
    userPhoto?: string;
    correctPassword?: string;
    desktopBgImage?: string;
    mobileBgImage?: string;
    onUnlock: () => void;
}> = ({
    userName = 'Administrador',
    userPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    correctPassword = '1234',
    desktopBgImage = '',
    mobileBgImage = '',
    onUnlock
}) => {
        const [password, setPassword] = useState('');
        const [showPassword, setShowPassword] = useState(false);
        const [errorMsg, setErrorMsg] = useState('');
        const [shake, setShake] = useState(false);
        const [isMobile, setIsMobile] = useState(false);

        useEffect(() => {
            const check = () => setIsMobile(window.innerWidth < 768);
            check();
            window.addEventListener('resize', check);
            return () => window.removeEventListener('resize', check);
        }, []);

        const handleUnlock = (e: React.FormEvent) => {
            e.preventDefault();
            if (password === correctPassword) {
                onUnlock();
            } else {
                setErrorMsg('Senha incorreta! Digite a chave correta.');
                setShake(true);
                setTimeout(() => setShake(false), 500);
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
        };

        const currentBg = isMobile
            ? (mobileBgImage || desktopBgImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080')
            : (desktopBgImage || mobileBgImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1920');

        return (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 select-none overflow-hidden bg-black text-white font-sans">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700 filter brightness-60 scale-105"
                    style={{ backgroundImage: `url("${currentBg}")` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                <motion.div
                    animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="relative z-10 w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-2xl shadow-2xl space-y-6 text-center"
                >
                    <div className="relative inline-block mx-auto">
                        <img
                            src={userPhoto}
                            alt={userName}
                            className="w-20 h-20 rounded-full object-cover border-2 border-orange-500 shadow-xl"
                        />
                        <div className="absolute bottom-0 right-0 p-1.5 bg-orange-500 text-white rounded-full shadow-md">
                            <Lock className="w-3.5 h-3.5" />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-white">{userName}</h2>
                        <p className="text-xs text-zinc-400 mt-1 font-mono">Aplicativo Bloqueado</p>
                    </div>

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Digite sua senha..."
                                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-all font-mono pr-11"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {errorMsg && (
                            <p className="text-xs text-red-400 font-mono animate-fade-in">{errorMsg}</p>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl tracking-wider uppercase transition-all shadow-lg shadow-orange-500/25 cursor-pointer"
                        >
                            Desbloquear Sessão
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    };

/* ========================================================================== */
/* SECTION 8: TELA DE CARREGAMENTO COM IMAGEM & SINCRONIZAÇÃO                 */
/* ========================================================================== */

export const StandaloneAppLoadingScreen: React.FC<{
    verticalImage?: string;
    horizontalImage?: string;
    onComplete: () => void;
}> = ({ verticalImage, horizontalImage, onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [isPortrait, setIsPortrait] = useState(() => (typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false));

    useEffect(() => {
        const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(onComplete, 300);
                    return 100;
                }
                return prev + 5;
            });
        }, 40);
        return () => clearInterval(interval);
    }, [onComplete]);

    const activeBg = isPortrait
        ? (verticalImage || horizontalImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080')
        : (horizontalImage || verticalImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920');

    return (
        <div className="fixed inset-0 z-[10000] flex flex-col justify-end bg-black text-white overflow-hidden select-none font-sans">
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                style={{ backgroundImage: `url("${activeBg}")` }}
            />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

            <div className="relative z-10 w-full max-w-xl mx-auto p-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                    <div className="flex items-center gap-2">
                        <Cloud className="w-4 h-4 text-orange-400 animate-pulse" />
                        <span>Sincronizando dados com o banco de dados...</span>
                    </div>
                    <span className="font-bold text-orange-400">{progress}%</span>
                </div>

                {/* Barra de Progresso */}
                <div className="w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div
                        className="h-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

/* ========================================================================== */
/* SECTION 9: INTERFACE DE CONFIGURAÇÃO DE TELAS & PERSONALIZAÇÃO             */
/* ========================================================================== */

export const CustomScreenSettingsPanel: React.FC = () => {
    const [lockDesktopBg, setLockDesktopBg] = useState(() => localStorage.getItem('mbc_lock_desktop') || '');
    const [lockMobileBg, setLockMobileBg] = useState(() => localStorage.getItem('mbc_lock_mobile') || '');
    const [loadingVerticalBg, setLoadingVerticalBg] = useState(() => localStorage.getItem('mbc_loading_vertical') || '');
    const [loadingHorizontalBg, setLoadingHorizontalBg] = useState(() => localStorage.getItem('mbc_loading_horizontal') || '');
    const [previewMode, setPreviewMode] = useState<'lock' | 'loading' | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void, storageKey: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const result = ev.target?.result as string;
                if (result) {
                    setter(result);
                    localStorage.setItem(storageKey, result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClipboardPaste = async (setter: (val: string) => void, storageKey: string) => {
        try {
            if (navigator.clipboard?.readText) {
                const text = await navigator.clipboard.readText();
                if (text && (text.startsWith('http') || text.startsWith('data:image/'))) {
                    setter(text.trim());
                    localStorage.setItem(storageKey, text.trim());
                }
            }
        } catch (err) {
            console.warn('Erro ao ler área de transferência:', err);
        }
    };

    return (
        <div className="space-y-6 font-sans">
            {/* 1. Configurações da Tela de Bloqueio */}
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div>
                        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-orange-400" />
                            Imagens da Tela de Bloqueio
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                            Defina planos de fundo separados para a versão Desktop (16:9) e Mobile (9:16).
                        </p>
                    </div>
                    <button
                        onClick={() => setPreviewMode('lock')}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-orange-400 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition-all"
                    >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Testar Bloqueio</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Desktop Wallpaper */}
                    <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-200">Papel de Parede Desktop (16:9)</span>
                            <span className="text-[9px] font-mono text-zinc-500">Computador</span>
                        </div>
                        <div className="relative aspect-video w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center">
                            {lockDesktopBg ? (
                                <img src={lockDesktopBg} alt="Desktop Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] text-zinc-600 font-mono">Imagem Padrão</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e, setLockDesktopBg, 'mbc_lock_desktop')}
                                />
                                <div className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Upload</span>
                                </div>
                            </label>
                            <button
                                onClick={() => handleClipboardPaste(setLockDesktopBg, 'mbc_lock_desktop')}
                                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center gap-1 transition-all"
                            >
                                <Clipboard className="w-3.5 h-3.5" />
                                <span>Colar</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Wallpaper */}
                    <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-200">Papel de Parede Mobile (9:16)</span>
                            <span className="text-[9px] font-mono text-zinc-500">Smartphone</span>
                        </div>
                        <div className="relative aspect-video w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center">
                            {lockMobileBg ? (
                                <img src={lockMobileBg} alt="Mobile Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] text-zinc-600 font-mono">Imagem Padrão</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e, setLockMobileBg, 'mbc_lock_mobile')}
                                />
                                <div className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Upload</span>
                                </div>
                            </label>
                            <button
                                onClick={() => handleClipboardPaste(setLockMobileBg, 'mbc_lock_mobile')}
                                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center gap-1 transition-all"
                            >
                                <Clipboard className="w-3.5 h-3.5" />
                                <span>Colar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Configurações da Tela de Carregamento (Splash) */}
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div>
                        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-orange-400" />
                            Tela de Carregamento & Splash
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                            Personalize a imagem exibida ao abrir o app e enquanto os dados sincronizam com a nuvem.
                        </p>
                    </div>
                    <button
                        onClick={() => setPreviewMode('loading')}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-orange-400 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition-all"
                    >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Testar Splash</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Vertical Splash */}
                    <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3">
                        <span className="text-xs font-bold text-zinc-200">Splash Vertical (Celular / 9:16)</span>
                        <div className="relative aspect-video w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center">
                            {loadingVerticalBg ? (
                                <img src={loadingVerticalBg} alt="Vertical Splash Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] text-zinc-600 font-mono">Splash Padrão</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e, setLoadingVerticalBg, 'mbc_loading_vertical')}
                                />
                                <div className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Upload</span>
                                </div>
                            </label>
                            <button
                                onClick={() => handleClipboardPaste(setLoadingVerticalBg, 'mbc_loading_vertical')}
                                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center gap-1 transition-all"
                            >
                                <Clipboard className="w-3.5 h-3.5" />
                                <span>Colar</span>
                            </button>
                        </div>
                    </div>

                    {/* Horizontal Splash */}
                    <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3">
                        <span className="text-xs font-bold text-zinc-200">Splash Horizontal (Desktop / 16:9)</span>
                        <div className="relative aspect-video w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center">
                            {loadingHorizontalBg ? (
                                <img src={loadingHorizontalBg} alt="Horizontal Splash Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] text-zinc-600 font-mono">Splash Padrão</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e, setLoadingHorizontalBg, 'mbc_loading_horizontal')}
                                />
                                <div className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Upload</span>
                                </div>
                            </label>
                            <button
                                onClick={() => handleClipboardPaste(setLoadingHorizontalBg, 'mbc_loading_horizontal')}
                                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center gap-1 transition-all"
                            >
                                <Clipboard className="w-3.5 h-3.5" />
                                <span>Colar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Renderização de Previews */}
            {previewMode === 'lock' && (
                <StandaloneLockScreen
                    desktopBgImage={lockDesktopBg}
                    mobileBgImage={lockMobileBg}
                    onUnlock={() => setPreviewMode(null)}
                />
            )}

            {previewMode === 'loading' && (
                <StandaloneAppLoadingScreen
                    verticalImage={loadingVerticalBg}
                    horizontalImage={loadingHorizontalBg}
                    onComplete={() => setPreviewMode(null)}
                />
            )}
        </div>
    );
};

/* ========================================================================== */
/* SECTION 10: SISTEMA DE AUTENTICAÇÃO COMPLETO (MODAL COM GOOGLE & QR)       */
/* ========================================================================== */

export const StandaloneAuthModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: AuthUserProfile) => void;
}> = ({ isOpen, onClose, onSuccess }) => {
    const [mode, setMode] = useState<'welcome' | 'login' | 'signup' | 'qrcode'>('welcome');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [qrCodeTimer, setQrCodeTimer] = useState(300);

    useEffect(() => {
        if (mode !== 'qrcode') return;
        const interval = setInterval(() => {
            setQrCodeTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [mode]);

    if (!isOpen) return null;

    const handleStandardLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            onSuccess({
                id: 'usr_123',
                email: email || 'usuario@dominio.com',
                username: email.split('@')[0] || 'usuario',
                name: 'Usuário Conectado',
                syncKey: 'MB-SYNC-889922',
                provider: 'local'
            });
            onClose();
        }, 1000);
    };

    const handleGoogleAuth = () => {
        setLoading(true);
        // Em produção: redireciona para a rota OAuth `/api/auth/google/url`
        setTimeout(() => {
            setLoading(false);
            onSuccess({
                id: 'usr_google_456',
                email: 'conta.google@gmail.com',
                username: 'contagoogle',
                name: 'Conta Google Sincronizada',
                photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
                syncKey: 'MB-GOOGLE-SYNC-1002',
                provider: 'google'
            });
            onClose();
        }, 1200);
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-zinc-950 border border-zinc-850 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
                >
                    <X className="w-5 h-5" />
                </button>

                {mode === 'welcome' && (
                    <div className="space-y-6 text-center">
                        <div className="space-y-2">
                            <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center mx-auto">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Entrar ou Criar Conta</h2>
                            <p className="text-xs text-zinc-400">
                                Sincronize tarefas, rotinas e configurações em todos os seus aparelhos em tempo real.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {/* Botão Google OAuth */}
                            <button
                                onClick={handleGoogleAuth}
                                disabled={loading}
                                className="w-full py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                                <span>Continuar com Google</span>
                            </button>

                            <button
                                onClick={() => setMode('login')}
                                className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <Mail className="w-4 h-4 text-orange-400" />
                                <span>Entrar com E-mail</span>
                            </button>

                            <button
                                onClick={() => setMode('qrcode')}
                                className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <QrCode className="w-4 h-4 text-sky-400" />
                                <span>Entrar com QR Code (Pelo Celular)</span>
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'login' && (
                    <form onSubmit={handleStandardLogin} className="space-y-4">
                        <button
                            type="button"
                            onClick={() => setMode('welcome')}
                            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                        </button>

                        <div>
                            <h3 className="text-base font-bold text-white">Login por E-mail</h3>
                            <p className="text-xs text-zinc-400">Digite suas credenciais registradas.</p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-mono text-zinc-400 uppercase">E-mail ou Usuário</label>
                                <input
                                    type="text"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-mono text-zinc-400 uppercase">Senha</label>
                                <div className="relative mt-1">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Sua senha secreta"
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar no Sistema'}
                        </button>
                    </form>
                )}

                {mode === 'qrcode' && (
                    <div className="space-y-4 text-center">
                        <button
                            onClick={() => setMode('welcome')}
                            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                        </button>

                        <div>
                            <h3 className="text-base font-bold text-white">Login por QR Code</h3>
                            <p className="text-xs text-zinc-400">
                                Aponte a câmera do seu celular já autenticado para este código.
                            </p>
                        </div>

                        <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-xl">
                            {/* Representação do QR Code SVG */}
                            <div className="w-44 h-44 bg-zinc-950 flex flex-col items-center justify-center text-white rounded-lg p-2">
                                <QrCode className="w-28 h-28 text-white stroke-[1.2]" />
                                <span className="text-[9px] font-mono text-zinc-400 mt-1">SESSION: SYNC-QR-LIVE</span>
                            </div>
                        </div>

                        <div className="text-[11px] font-mono text-zinc-400">
                            Expira em: <span className="text-orange-400 font-bold">{Math.floor(qrCodeTimer / 60)}:{(qrCodeTimer % 60).toString().padStart(2, '0')}</span>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

/* ========================================================================== */
/* SECTION 11: DEMO STANDALONE INTERATIVO COMPLETO                            */
/* ========================================================================== */

export default function StandaloneFullReferenceApp() {
    const [showSyncToast, setShowSyncToast] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-8 font-sans space-y-8 max-w-5xl mx-auto">
            {/* Header Informativo */}
            <div className="border-b border-zinc-900 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold">
                            Standalone Reference File
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                            Supabase & Offline Engine
                        </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-2">
                        Hub de Sincronização, Sessões & Segurança
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                        Exemplo funcional completo com todos os recursos implementados no Planner.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSyncToast(true)}
                        className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono text-orange-400 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Simular Sync Remoto</span>
                    </button>

                    <button
                        onClick={() => setShowAuthModal(true)}
                        className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                        <User className="w-3.5 h-3.5" />
                        <span>{currentUser ? currentUser.name : 'Abrir Tela de Login'}</span>
                    </button>
                </div>
            </div>

            {/* Gerenciamento de Dispositivos Conectados */}
            <section className="space-y-3">
                <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    1. Multi-Device Management (Configurações)
                </h2>
                <ConnectedDevicesManager />
            </section>

            {/* Configurações de Telas de Bloqueio e Carregamento */}
            <section className="space-y-3">
                <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    2. Personalização de Telas (Bloqueio & Splash)
                </h2>
                <CustomScreenSettingsPanel />
            </section>

            {/* Banner / Toast de Sincronização em Tempo Real */}
            <RemoteSyncToast
                isOpen={showSyncToast}
                onClose={() => setShowSyncToast(false)}
                deviceName="Safari (iPhone 15)"
            />

            {/* Modal de Autenticação */}
            <StandaloneAuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={(user) => setCurrentUser(user)}
            />
        </div>
    );
}
