/**
 * AuthScreen.tsx — Tela de login standalone full-screen (v4.15.0-auth)
 *
 * Port do LoginAuthStandalone.tsx (StandaloneAuthModal) com as imagens de
 * referência como guia visual e autenticação REAL via Supabase (useAuth):
 *   • welcome → Google OAuth (redirect real Supabase) / e-mail / criar conta;
 *     atalhos "Entrar por QR Code" e "Vincular Chave" (gaveta colapsável);
 *   • login   → signInWithPassword (Supabase exige e-mail — @usuário orienta);
 *   • signup  → signUp com display_name (@usuário) + senha mín. 6;
 *   • forgot  → resetPasswordForEmail (link real de redefinição);
 *   • qrcode  → QR real (lib qrcode) + contagem 5 min + código de pareamento.
 *
 * Diferenças vs referência (deliberadas, guia = imagens):
 *   • marca "Evo Fit" / "Cuidando da sua Saúde" (substitui Planner);
 *   • atalhos secundários como links com marcador "•" (não grid de botões);
 *   • sem modal de docs Google (dev-only) e sem simulação de perfil;
 *   • login/cadastro/reset reais (Supabase), não localStorage.
 *
 * z-index 1150 — abaixo do LockScreen (1200), contrato do App.tsx mantido.
 */

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import {
  Mail,
  Lock,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Check,
  Link2,
  QrCode,
  RefreshCw,
  Clock,
  User,
  UserPlus,
  Eye,
  EyeOff,
  X,
  FlaskConical,
} from 'lucide-react';
import { useAuth } from '@/core/auth/use-auth';
import { isSupabaseConfigured } from '@/core/supabase';
import { isUsernameAvailable } from '@/core/auth/profiles';
import { setSyncKey } from '@/core/sync/supabase-client';
import { showToast } from '@/lib/toast';
import { useAuthModalStore } from './auth-modal-store';
import './auth-screen.css';

type Mode = 'welcome' | 'login' | 'signup' | 'forgot' | 'qrcode';
type Legal = 'terms' | 'privacy' | null;

const REMEMBER_KEY = 'mbc_remember_me';
const CONFIG_MSG = 'Configure o Supabase em Configurações → Nuvem e Sincronização antes de entrar.';
const QR_TTL_SECONDS = 300; // 5 minutos, como no reference

/* ── Ícone oficial do Google (SVG multicolor, sem dependência) ── */

const GoogleGIcon = (
  <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
    />
    <path
      fill="#4285F4"
      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
    />
    <path
      fill="#FBBC05"
      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
    />
    <path
      fill="#34A853"
      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
    />
  </svg>
);

/* ── Fundo "Curzed Perspective Horizon Grid" (port direto do reference) ── */

function CurvedPerspectiveBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0 bg-black">
      {/* Luz difusa central do horizonte */}
      <div
        className="absolute top-[28%] sm:top-[22%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[320px] rounded-full blur-[130px] opacity-25"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.45) 0%, rgba(140, 140, 150, 0.15) 45%, rgba(0, 0, 0, 0) 75%)',
        }}
      />

      {/* Grid curvado e linhas de perspectiva em SVG */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40">
        <svg
          className="w-full h-full min-w-[1000px]"
          viewBox="0 0 1400 800"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <defs>
            <linearGradient id="evoHorizonLineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="evoGridFadeY" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Linha mestra curvada de horizonte iluminado */}
          <path d="M -100 240 Q 700 130 1500 240" stroke="url(#evoHorizonLineGlow)" strokeWidth="1.6" fill="none" />

          {/* Anéis horizontais curvados com compressão de perspectiva */}
          <path d="M -80 255 Q 700 155 1480 255" stroke="url(#evoGridFadeY)" strokeWidth="0.8" />
          <path d="M -60 274 Q 700 185 1460 274" stroke="url(#evoGridFadeY)" strokeWidth="0.75" />
          <path d="M -40 298 Q 700 220 1440 298" stroke="url(#evoGridFadeY)" strokeWidth="0.7" />
          <path d="M -20 327 Q 700 260 1420 327" stroke="url(#evoGridFadeY)" strokeWidth="0.65" />
          <path d="M 0 362 Q 700 305 1400 362" stroke="url(#evoGridFadeY)" strokeWidth="0.6" />
          <path d="M 20 405 Q 700 358 1380 405" stroke="url(#evoGridFadeY)" strokeWidth="0.55" />
          <path d="M 40 455 Q 700 418 1360 455" stroke="url(#evoGridFadeY)" strokeWidth="0.5" />

          {/* Linhas radiais de fuga em perspectiva */}
          {Array.from({ length: 41 }).map((_, i) => {
            const xStart = 700 + (i - 20) * 32;
            const xEnd = 700 + (i - 20) * 68;
            return (
              <path
                key={i}
                d={`M ${xStart} 160 L ${xEnd} 480`}
                stroke="url(#evoGridFadeY)"
                strokeWidth="0.6"
                opacity={1 - Math.abs(i - 20) * 0.035}
              />
            );
          })}
        </svg>
      </div>

      {/* Degradê superior de fusão escura */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none" />
      {/* Degradê inferior suave */}
      <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none" />
    </div>
  );
}

/* ── Campo de formulário com ícone esquerdo / slot direito ── */

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  labelExtra?: ReactNode;
  icon: ReactNode;
  right?: ReactNode;
  mono?: boolean;
}

function AuthField({ id, label, labelExtra, icon, right, mono, className, ...props }: AuthFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="block text-xs text-zinc-400 font-medium">
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 flex text-zinc-500 pointer-events-none">
          {icon}
        </span>
        <input
          id={id}
          {...props}
          className={`w-full h-11 ${right ? 'pr-10 ' : 'pr-3.5 '}pl-10 bg-[#09090b] border border-zinc-800 rounded-xl text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors ${
            mono ? 'font-mono ' : ''
          }${className ?? ''}`}
        />
        {right && <div className="absolute right-2.5 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
    </div>
  );
}

/* ── Banners de erro / informação ── */

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="mb-4 p-3 bg-red-950/70 border border-red-900/60 rounded-2xl flex items-center gap-2 text-red-200 text-xs">
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      <span className="leading-tight text-left">{msg}</span>
    </div>
  );
}

function InfoBanner({ msg }: { msg: string }) {
  return (
    <div className="mb-4 p-3 bg-emerald-950/70 border border-emerald-900/60 rounded-2xl flex items-center gap-2 text-emerald-200 text-xs">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span className="leading-tight text-left">{msg}</span>
    </div>
  );
}

/* ── Modal legal (Termos / Política) ── */

function LegalModal({ kind, onClose }: { kind: 'terms' | 'privacy'; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-md bg-[#121216] border border-zinc-800 rounded-3xl p-6 shadow-2xl text-left max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <span>{kind === 'terms' ? 'Termos de Uso' : 'Política de Privacidade'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 text-xs text-zinc-400 space-y-3 overflow-y-auto leading-relaxed">
          {kind === 'terms' ? (
            <>
              <p>
                Bem-vindo ao Evo Fit. Ao acessar e utilizar este aplicativo, você concorda em cumprir e vincular-se aos
                seguintes termos e condições de uso.
              </p>
              <p className="font-semibold text-zinc-300">1. Privacidade e Dados Locais</p>
              <p>
                Seus dados pessoais, rotinas, notas e informações financeiras pertencem exclusivamente a você. O
                aplicativo prioriza a persistência local com sincronização segura ponta a ponta.
              </p>
              <p className="font-semibold text-zinc-300">2. Segurança de Acesso</p>
              <p>
                Você é responsável por manter a confidencialidade de sua senha e por gerenciar os aparelhos conectados
                através do painel de segurança.
              </p>
            </>
          ) : (
            <>
              <p>
                A sua privacidade é prioritária. Nós respeitamos o sigilo total de suas informações de agenda, tarefas e
                registros diários.
              </p>
              <p className="font-semibold text-zinc-300">1. Coleta de Informações</p>
              <p>
                Coletamos unicamente o endereço de e-mail e identificadores técnicos necessários para viabilizar a
                sincronização entre seus próprios dispositivos autorizados.
              </p>
              <p className="font-semibold text-zinc-300">2. Criptografia e Autenticação</p>
              <p>
                Senhas são processadas com criptografia e sessões por QR Code possuem validade restrita de 5 minutos com
                revogação imediata.
              </p>
            </>
          )}
        </div>

        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white text-black text-xs font-semibold rounded-full hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Tela principal ── */

export function AuthScreen() {
  const { user, signIn, signUp, signInWithGoogle, resetPassword, signInAsTest } = useAuth();
  const close = useAuthModalStore((s) => s.closeModal);

  const [mode, setMode] = useState<Mode>('welcome');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_KEY) !== 'false';
    } catch {
      return true;
    }
  });

  const [linkKey, setLinkKey] = useState('');
  const [showLinkSection, setShowLinkSection] = useState(false);

  const [qrSession, setQrSession] = useState<{ pin: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrTimer, setQrTimer] = useState(QR_TTL_SECONDS);

  const [legalModal, setLegalModal] = useState<Legal>(null);
  const [loading, setLoading] = useState<'google' | 'login' | 'signup' | 'reset' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);

  const busy = loading !== null;

  /* Auto-fecha quando a sessão chega (login, retorno do Google ou cadastro
     com confirmação de e-mail desligada no Supabase). */
  useEffect(() => {
    if (user) close();
  }, [user, close]);

  /* ESC fecha a tela (mesmo contrato do AuthModal anterior). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  /* Cronômetro regressivo da sessão QR (5 minutos). */
  useEffect(() => {
    if (mode !== 'qrcode' || !qrSession) return;
    const timer = setInterval(() => {
      setQrTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, qrSession]);

  /* Cadastro com confirmação de e-mail: sem sessão em ~900ms → orienta e
     volta para o login. Se a sessão chegar (auto-confirm), o efeito acima
     fecha a tela antes. */
  useEffect(() => {
    if (!pendingConfirm) return;
    const t = setTimeout(() => {
      setPendingConfirm(false);
      if (!user) {
        setInfoMsg('Conta criada! Confirme seu e-mail para entrar.');
        setMode('login');
      }
    }, 900);
    return () => clearTimeout(t);
  }, [pendingConfirm, user]);

  function persistRemember() {
    try {
      localStorage.setItem(REMEMBER_KEY, String(remember));
    } catch {
      /* modo privado: preferência descartável */
    }
  }

  /* Vincular Chave: aplica a chave como namespace do sync (mbc_sync_key)
     antes do login — dados da chave passam a se conectar à conta. */
  function applyLinkKey() {
    const k = linkKey.trim();
    if (!k) return;
    try {
      setSyncKey(k);
    } catch {
      /* localStorage indisponível */
    }
  }

  function goWelcome() {
    setMode('welcome');
    setErrorMsg(null);
    setInfoMsg(null);
  }

  async function handleGoogle() {
    if (!isSupabaseConfigured) {
      setErrorMsg(CONFIG_MSG);
      return;
    }
    setErrorMsg(null);
    setLoading('google');
    persistRemember();
    applyLinkKey();
    try {
      await signInWithGoogle();
      showToast('Redirecionando para o Google...', 'info');
      close();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao conectar com o Google.');
    } finally {
      setLoading(null);
    }
  }

  /* Modo teste (somente desenvolvimento): conta fictícia local, sem Supabase
     e sem sincronização. O AuthProvider guarda a flag e restaura no reload. */
  function handleTestLogin() {
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      signInAsTest();
      showToast('Modo teste ativado — sessão local, sem nuvem.', 'info');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Não foi possível entrar em modo teste.');
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    if (!isSupabaseConfigured) {
      setErrorMsg(CONFIG_MSG);
      return;
    }
    const identifier = email.trim();
    /* Supabase Auth autentica por e-mail; @usuário identifica o perfil. */
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      setErrorMsg('Entre com o e-mail da conta — o acesso é feito pelo e-mail cadastrado.');
      return;
    }
    setLoading('login');
    persistRemember();
    applyLinkKey();
    try {
      await signIn(identifier, password);
      showToast('Bem-vindo de volta! Sessão conectada.', 'success');
      close();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha na autenticação.');
    } finally {
      setLoading(null);
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    if (!isSupabaseConfigured) {
      setErrorMsg(CONFIG_MSG);
      return;
    }
    const clean = username.trim().replace(/^@/, '').toLowerCase();
    if (clean.length < 3 || clean.length > 20 || !/^[a-z0-9_]+$/.test(clean)) {
      setErrorMsg('Nome de usuário: de 3 a 20 caracteres (letras, números ou _).');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    const available = await isUsernameAvailable(clean);
    if (!available) {
      setErrorMsg('Este nome de usuário já está em uso.');
      return;
    }
    setLoading('signup');
    persistRemember();
    applyLinkKey();
    // Por padrão, cada usuário recebe uma chave de sincronização única
    // (a menos que tenha vinculado uma chave existente).
    if (!linkKey.trim()) {
      try {
        setSyncKey(`MBC-${clean.toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
      } catch {
        /* storage indisponível */
      }
    }
    try {
      await signUp(email.trim(), password, clean);
      setPendingConfirm(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao criar conta.');
    } finally {
      setLoading(null);
    }
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    if (!isSupabaseConfigured) {
      setErrorMsg(CONFIG_MSG);
      return;
    }
    setLoading('reset');
    try {
      await resetPassword(email.trim());
      showToast('Link de redefinição enviado! Verifique seu e-mail.', 'info');
      setMode('login');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao processar recuperação.');
    } finally {
      setLoading(null);
    }
  }

  async function startQrLogin() {
    setMode('qrcode');
    setErrorMsg(null);
    setInfoMsg(null);
    const pin = `PLN-${Math.floor(100000 + Math.random() * 900000)}`;
    setQrSession({ pin });
    setQrTimer(QR_TTL_SECONDS);
    setQrDataUrl('');
    try {
      const payload = `${window.location.origin}/?qr=${pin}&exp=${Date.now() + QR_TTL_SECONDS * 1000}`;
      const url = await QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: { dark: '#09090b', light: '#ffffff' },
      });
      setQrDataUrl(url);
    } catch {
      setErrorMsg('Não foi possível gerar o código QR. Tente novamente.');
    }
  }

  const mmss = `${Math.floor(qrTimer / 60)}:${(qrTimer % 60).toString().padStart(2, '0')}`;

  const eyeBtn = (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  const rememberBtn = (
    <button
      type="button"
      onClick={() => setRemember(!remember)}
      className="flex items-center gap-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-300 transition-colors cursor-pointer select-none"
      aria-pressed={remember}
    >
      <span
        className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
          remember ? 'bg-white text-black' : 'border border-zinc-700 bg-[#09090b]'
        }`}
      >
        {remember && <Check className="w-3 h-3" strokeWidth={3} />}
      </span>
      <span>Manter conectado</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[1150] w-full h-full flex flex-col bg-black overflow-y-auto no-scrollbar select-none text-white">
      <CurvedPerspectiveBackground />

      <div className="relative z-10 w-full flex-1 flex flex-col justify-between px-6 py-10 max-w-lg mx-auto">
        {/* Cabeçalho da Marca */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="pt-8 sm:pt-14 pb-4 flex flex-col items-center text-center"
        >
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-sm">Evo Fit</h1>
          <p className="text-sm sm:text-[15px] text-zinc-400 font-mono tracking-wider mt-3 font-normal">
            Cuidando da sua Saúde
          </p>
        </motion.div>

        {/* Vistas dinâmicas */}
        <div className="w-full my-auto py-4 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {/* ===== VISTA 1: WELCOME ===== */}
            {mode === 'welcome' && (
              <motion.div
                key="welcome-view"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex flex-col items-center gap-3.5 max-w-sm mx-auto"
              >
                {errorMsg && <ErrorBanner msg={errorMsg} />}
                {infoMsg && <InfoBanner msg={infoMsg} />}

                {/* PÍLULA 1: Continuar com Google */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={busy}
                  className="w-full h-13 sm:h-14 bg-[#18181c]/90 hover:bg-[#222228] active:bg-[#121215] border border-[#2b2b36] hover:border-[#3f3f4e] rounded-full text-white font-medium text-[15px] sm:text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.985] cursor-pointer disabled:opacity-60"
                >
                  {loading === 'google' ? (
                    <Loader2 className="w-[18px] h-[18px] animate-spin" />
                  ) : (
                    GoogleGIcon
                  )}
                  <span className="font-normal text-zinc-100">Continuar com Google</span>
                </button>

                {/* PÍLULA 2: Continuar com e-mail */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setInfoMsg(null);
                  }}
                  disabled={busy}
                  className="w-full h-13 sm:h-14 bg-[#18181c]/90 hover:bg-[#222228] active:bg-[#121215] border border-[#2b2b36] hover:border-[#3f3f4e] rounded-full text-white font-medium text-[15px] sm:text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.985] cursor-pointer disabled:opacity-60"
                >
                  <span className="text-base font-bold text-zinc-200 font-mono">@</span>
                  <span className="font-normal text-zinc-100">Continuar com e-mail</span>
                </button>

                {/* PÍLULA 3: Criar conta */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                    setInfoMsg(null);
                  }}
                  disabled={busy}
                  className="w-full h-13 sm:h-14 bg-[#18181c]/90 hover:bg-[#222228] active:bg-[#121215] border border-[#2b2b36] hover:border-[#3f3f4e] rounded-full text-white font-medium text-[15px] sm:text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.985] cursor-pointer disabled:opacity-60"
                >
                  <UserPlus className="w-[18px] h-[18px] text-zinc-300" />
                  <span className="font-normal text-zinc-100">Criar conta</span>
                </button>

                {/* PÍLULA 4 (só em dev): conta local de teste */}
                {import.meta.env.DEV && (
                  <button
                    type="button"
                    onClick={handleTestLogin}
                    disabled={busy}
                    className="w-full h-12 bg-emerald-500/[0.07] hover:bg-emerald-500/[0.13] active:bg-emerald-500/[0.05] border border-dashed border-emerald-500/45 hover:border-emerald-400/70 rounded-full text-emerald-300 font-medium text-sm flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.985] cursor-pointer disabled:opacity-60"
                  >
                    <FlaskConical className="w-[17px] h-[17px]" />
                    <span className="font-normal">Entrar em modo teste</span>
                  </button>
                )}

                {/* Ações secundárias (links com marcador, conforme imagens) */}
                <div className="w-full flex items-center justify-center gap-3 text-xs text-zinc-400 mt-1">
                  <button
                    type="button"
                    onClick={() => void startQrLogin()}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Entrar por QR Code</span>
                  </button>
                  <span className="text-zinc-700">•</span>
                  <button
                    type="button"
                    onClick={() => setShowLinkSection(!showLinkSection)}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Vincular Chave</span>
                  </button>
                </div>

                {/* Gaveta de vinculação de chave */}
                <AnimatePresence>
                  {showLinkSection && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full overflow-hidden"
                    >
                      <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-2.5 mt-1 text-left">
                        <label htmlFor="auth-link-key" className="block text-xs font-medium text-zinc-300">
                          Chave de Sincronização ou Usuário:
                        </label>
                        <input
                          id="auth-link-key"
                          type="text"
                          value={linkKey}
                          onChange={(e) => setLinkKey(e.target.value)}
                          placeholder="Ex: @usuario ou MBC-..."
                          className="w-full h-10 px-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                        />
                        <p className="text-[11px] text-zinc-500 leading-tight">
                          Ao entrar com o Google, os dados associados a esta chave serão conectados à sua conta.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ===== VISTA 2: LOGIN POR E-MAIL ===== */}
            {mode === 'login' && (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm mx-auto bg-[#121216]/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <button
                    type="button"
                    onClick={goWelcome}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>
                  <span className="text-[13px] font-semibold text-white">Entrar</span>
                </div>

                {errorMsg && <ErrorBanner msg={errorMsg} />}

                <form onSubmit={handleLogin} className="space-y-3.5">
                  <AuthField
                    id="auth-login-email"
                    label="E-mail ou Usuário"
                    icon={<Mail className="w-4 h-4" />}
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com ou @usuario"
                    autoComplete="username"
                    required
                  />

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="auth-login-pwd" className="block text-xs text-zinc-400 font-medium">
                        Senha
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMsg(null);
                          setInfoMsg(null);
                        }}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        Esqueceu?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 flex text-zinc-500 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="auth-login-pwd"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha"
                        autoComplete="current-password"
                        required
                        className="w-full h-11 pl-10 pr-10 bg-[#09090b] border border-zinc-800 rounded-xl text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">{eyeBtn}</div>
                    </div>
                  </div>

                  {rememberBtn}

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full h-12 mt-2 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-semibold text-sm rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.985] disabled:opacity-50 cursor-pointer"
                  >
                    {loading === 'login' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Entrar</span>
                    )}
                  </button>
                </form>

                <div className="mt-5 text-center text-xs text-zinc-500">
                  <span>Não tem uma conta? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className="text-white hover:underline font-medium cursor-pointer"
                  >
                    Criar conta
                  </button>
                </div>
              </motion.div>
            )}

            {/* ===== VISTA 3: CRIAR CONTA ===== */}
            {mode === 'signup' && (
              <motion.div
                key="signup-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm mx-auto bg-[#121216]/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <button
                    type="button"
                    onClick={goWelcome}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>
                  <span className="text-[13px] font-semibold text-white">Criar Conta</span>
                </div>

                {errorMsg && <ErrorBanner msg={errorMsg} />}
                {infoMsg && <InfoBanner msg={infoMsg} />}

                <form onSubmit={handleSignup} className="space-y-3">
                  <AuthField
                    id="auth-signup-user"
                    label="Nome de usuário"
                    icon={<User className="w-4 h-4" />}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ex: nando"
                    autoComplete="username"
                    mono
                    required
                  />

                  <AuthField
                    id="auth-signup-email"
                    label="E-mail"
                    icon={<Mail className="w-4 h-4" />}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                  />

                  <AuthField
                    id="auth-signup-pwd"
                    label="Senha"
                    labelExtra={<span className="text-[11px] text-zinc-500">Mínimo 6 caracteres</span>}
                    icon={<Lock className="w-4 h-4" />}
                    right={eyeBtn}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Crie uma senha forte"
                    autoComplete="new-password"
                    required
                  />

                  {rememberBtn}

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full h-12 mt-3 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-semibold text-sm rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.985] disabled:opacity-50 cursor-pointer"
                  >
                    {loading === 'signup' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Criar Conta e Começar</span>
                    )}
                  </button>
                </form>

                <div className="mt-5 text-center text-xs text-zinc-500">
                  <span>Já possui uma conta? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className="text-white hover:underline font-medium cursor-pointer"
                  >
                    Entrar
                  </button>
                </div>
              </motion.div>
            )}

            {/* ===== VISTA 4: RECUPERAR SENHA ===== */}
            {mode === 'forgot' && (
              <motion.div
                key="forgot-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm mx-auto bg-[#121216]/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>
                  <span className="text-[13px] font-semibold text-white">Recuperar</span>
                </div>

                {errorMsg && <ErrorBanner msg={errorMsg} />}
                {infoMsg && <InfoBanner msg={infoMsg} />}

                <form onSubmit={handleForgot} className="space-y-3.5">
                  <AuthField
                    id="auth-forgot-email"
                    label="E-mail Cadastrado"
                    icon={<Mail className="w-4 h-4" />}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                  />

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full h-12 mt-2 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-semibold text-sm rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.985] disabled:opacity-50 cursor-pointer"
                  >
                    {loading === 'reset' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Enviar link de redefinição</span>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ===== VISTA 5: ENTRAR POR QR CODE ===== */}
            {mode === 'qrcode' && (
              <motion.div
                key="qrcode-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm mx-auto bg-[#121216]/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-center"
              >
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={goWelcome}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/85 border border-zinc-800 rounded-full font-mono text-[13px] text-zinc-200">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{mmss}</span>
                  </span>
                </div>

                {errorMsg && <ErrorBanner msg={errorMsg} />}

                <h3 className="text-lg font-bold text-white mb-1">Escanear para entrar</h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto mb-4">
                  Aponte a câmera ou use o Evo Fit conectado no seu celular.
                </p>

                {/* Container do QR Code */}
                <div className="relative w-60 h-60 mx-auto bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Code de Login"
                      className={`w-full h-full object-contain transition-opacity duration-300 ${
                        qrTimer <= 0 ? 'opacity-20 blur-sm' : 'opacity-100'
                      }`}
                    />
                  ) : (
                    <Loader2 className="w-8 h-8 text-zinc-800 animate-spin" />
                  )}

                  {/* Overlay quando o código expira (5 minutos) */}
                  {qrTimer <= 0 && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4">
                      <Clock className="w-8 h-8 text-amber-400 mb-2 animate-bounce" />
                      <span className="text-xs font-bold text-white mb-3">Código Expirado</span>
                      <button
                        type="button"
                        onClick={() => void startQrLogin()}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Renovar</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Código de pareamento (alternativa ao QR) */}
                <div className="mt-4 flex items-center justify-between px-3.5 py-2.5 bg-[#09090b] border border-zinc-800 rounded-xl text-xs">
                  <span className="text-zinc-400">Código de Pareamento:</span>
                  <span className="font-mono text-[13px] font-bold tracking-wider bg-zinc-800 px-2.5 py-1 rounded-lg text-white">
                    {qrSession?.pin ?? '—'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Rodapé legal */}
        <div className="pt-6 pb-2 text-center">
          <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
            Ao continuar, você concorda com os{' '}
            <button
              type="button"
              onClick={() => setLegalModal('terms')}
              className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Termos
            </button>{' '}
            e com a{' '}
            <button
              type="button"
              onClick={() => setLegalModal('privacy')}
              className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Política de privacidade
            </button>
          </p>
        </div>
      </div>

      {/* Modais legais */}
      <AnimatePresence>
        {legalModal && <LegalModal kind={legalModal} onClose={() => setLegalModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
