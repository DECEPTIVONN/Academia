/**
 * AuthModal.tsx — Modal de autenticação (v4.9.0-sync)
 *
 * Port da Section 11 do SupabaseSyncSecurityStandalone.tsx com o Supabase REAL:
 *   • boas-vindas → Google OAuth / e-mail / QR Code (mock visual com contador);
 *   • login       → supabase.auth.signInWithPassword (useAuth);
 *   • cadastro    → supabase.auth.signUp (feedback de confirmação por e-mail);
 *   • QR Code     → mock visual (contador 5:00), como no reference.
 * Visual: paleta zinc/laranja do reference, tipografia Rajdhani do app.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/core/auth/use-auth';
import { isSupabaseConfigured } from '@/core/supabase';
import { showToast } from '@/lib/toast';
import { useAuthModalStore } from './auth-modal-store';
import '../sync/sync.css';

type Mode = 'welcome' | 'login' | 'signup' | 'qrcode';

/* ── Ícones SVG stroke (Diretrizes/Ícones.md) ── */

const SvgShieldCheck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const SvgMail = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const SvgQr = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <line x1="14" y1="14" x2="17" y2="14" />
    <line x1="21" y1="14" x2="21" y2="17" />
    <line x1="14" y1="21" x2="17" y2="21" />
    <line x1="21" y1="21" x2="21" y2="21" />
  </svg>
);

const SvgQrBig = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width="112" height="112">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <path d="M14 14h3v3h-3z" />
    <path d="M21 14v3" />
    <path d="M14 21h3" />
    <path d="M21 21h-1" />
  </svg>
);

const SvgArrowLeft = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const SvgEye = ({ off }: { off: boolean }) =>
  off ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

const SvgX = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SvgLoader = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16" style={{ animation: 'syPulse 0.8s ease-in-out infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.22-8.56" />
  </svg>
);

const GoogleLogo = (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export function AuthModal() {
  const open = useAuthModalStore((s) => s.open);
  const close = useAuthModalStore((s) => s.closeModal);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<Mode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [qrTimer, setQrTimer] = useState(300);

  /* Reset do modal a cada abertura — ajuste de estado durante o render
     (recomendado pelo React para sincronizar com uma prop) */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setMode('welcome');
      setEmail('');
      setPassword('');
      setConfirm('');
      setError('');
      setInfo('');
      setQrTimer(300);
    }
  }

  /* Contador do QR Code */
  useEffect(() => {
    if (!open || mode !== 'qrcode') return;
    const t = window.setInterval(() => setQrTimer((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => window.clearInterval(t);
  }, [open, mode]);

  /* ESC fecha o modal */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;

  const guardConfig = (): boolean => {
    if (isSupabaseConfigured) return true;
    setError('Configure o Supabase em Configurações → Nuvem e Sincronização antes de entrar.');
    return false;
  };

  const handleGoogle = async () => {
    if (!guardConfig()) return;
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      showToast('Redirecionando para o Google…', 'info');
      close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!guardConfig()) return;
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      showToast('Login realizado com sucesso!', 'success');
      close();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!guardConfig()) return;
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUp(email.trim(), password);
      setInfo('Conta criada! Confirme seu e-mail para ativar o acesso.');
      showToast('Conta criada! Verifique seu e-mail.', 'success');
      window.setTimeout(close, 2200);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const qrMins = Math.floor(qrTimer / 60);
  const qrSecs = String(qrTimer % 60).padStart(2, '0');

  return (
    <div className="sy-modal" role="dialog" aria-modal="true" aria-label="Entrar ou criar conta">
      <div className="sy-modal__panel">
        <button type="button" className="sy-modal__close" aria-label="Fechar" onClick={close}>
          {SvgX}
        </button>

        {/* ── BOAS-VINDAS ── */}
        {mode === 'welcome' && (
          <div className="sy-modal__head" style={{ gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span className="sy-modal__icon">{SvgShieldCheck}</span>
              <h2 className="sy-modal__title">Entrar ou Criar Conta</h2>
              <p className="sy-modal__desc">
                Sincronize exercícios, fichas e configurações em todos os seus
                aparelhos em tempo real.
              </p>
            </div>

            <div className="sy-modal__stack" style={{ width: '100%' }}>
              <button
                type="button"
                className="sy-btn sy-btn--google"
                disabled={loading}
                onClick={() => void handleGoogle()}
              >
                {GoogleLogo}
                Continuar com Google
              </button>
              <button type="button" className="sy-btn" onClick={() => { setMode('login'); setError(''); }}>
                {SvgMail}
                Entrar com E-mail
              </button>
              <button type="button" className="sy-btn" onClick={() => { setMode('signup'); setError(''); }}>
                {SvgShieldCheck}
                Criar Conta
              </button>
              <button type="button" className="sy-btn" onClick={() => { setMode('qrcode'); setError(''); }}>
                {SvgQr}
                Entrar com QR Code (pelo celular)
              </button>
            </div>

            {error && <div className="sy-feedback sy-feedback--bad">{error}</div>}
          </div>
        )}

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={(e) => void handleLogin(e)} className="sy-modal__stack">
            <button type="button" className="sy-modal__back" onClick={() => setMode('welcome')}>
              {SvgArrowLeft} Voltar
            </button>
            <div>
              <h3 className="sy-modal__title" style={{ textAlign: 'left' }}>Login por E-mail</h3>
              <p className="sy-modal__desc" style={{ textAlign: 'left', marginTop: 4 }}>
                Digite suas credenciais registradas.
              </p>
            </div>
            <div>
              <label className="sy-label" htmlFor="syAuthEmail">E-mail</label>
              <input
                id="syAuthEmail"
                type="email"
                required
                autoComplete="email"
                className="sy-input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="sy-label" htmlFor="syAuthPass">Senha</label>
              <div className="sy-input-wrap">
                <input
                  id="syAuthPass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="sy-input sy-input--pass"
                  placeholder="Sua senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="sy-input-eye"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <SvgEye off={showPassword} />
                </button>
              </div>
            </div>
            {error && <div className="sy-feedback sy-feedback--bad">{error}</div>}
            <button type="submit" className="sy-btn sy-btn--primary sy-btn--block" disabled={loading}>
              {loading ? SvgLoader : 'Entrar no Sistema'}
            </button>
          </form>
        )}

        {/* ── CADASTRO ── */}
        {mode === 'signup' && (
          <form onSubmit={(e) => void handleSignup(e)} className="sy-modal__stack">
            <button type="button" className="sy-modal__back" onClick={() => setMode('welcome')}>
              {SvgArrowLeft} Voltar
            </button>
            <div>
              <h3 className="sy-modal__title" style={{ textAlign: 'left' }}>Criar Conta</h3>
              <p className="sy-modal__desc" style={{ textAlign: 'left', marginTop: 4 }}>
                Cadastre-se para sincronizar seus dados na nuvem.
              </p>
            </div>
            <div>
              <label className="sy-label" htmlFor="sySignUpEmail">E-mail</label>
              <input
                id="sySignUpEmail"
                type="email"
                required
                autoComplete="email"
                className="sy-input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="sy-label" htmlFor="sySignUpPass">Senha</label>
              <div className="sy-input-wrap">
                <input
                  id="sySignUpPass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className="sy-input sy-input--pass"
                  placeholder="Mínimo de 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="sy-input-eye"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <SvgEye off={showPassword} />
                </button>
              </div>
            </div>
            <div>
              <label className="sy-label" htmlFor="sySignUpConfirm">Confirmar senha</label>
              <input
                id="sySignUpConfirm"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                className="sy-input"
                placeholder="Repita a senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error && <div className="sy-feedback sy-feedback--bad">{error}</div>}
            {info && <div className="sy-feedback sy-feedback--ok">{info}</div>}
            <button type="submit" className="sy-btn sy-btn--primary sy-btn--block" disabled={loading}>
              {loading ? SvgLoader : 'Criar Conta'}
            </button>
          </form>
        )}

        {/* ── QR CODE (mock visual com contador) ── */}
        {mode === 'qrcode' && (
          <div className="sy-qr">
            <button type="button" className="sy-modal__back" onClick={() => setMode('welcome')}>
              {SvgArrowLeft} Voltar
            </button>
            <div>
              <h3 className="sy-modal__title">Login por QR Code</h3>
              <p className="sy-modal__desc" style={{ marginTop: 6 }}>
                Aponte a câmera do seu celular já autenticado para este código.
              </p>
            </div>
            <div className="sy-qr__frame">
              <div className="sy-qr__inner">
                {SvgQrBig}
                <span>SESSION: SYNC-QR-LIVE</span>
              </div>
            </div>
            <div className="sy-qr__timer">
              Expira em: <b>{qrMins}:{qrSecs}</b>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
