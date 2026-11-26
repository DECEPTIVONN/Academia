import React, { useEffect, useState } from 'react';
import { Dumbbell, Eye, EyeOff, Loader2, LogIn, UserPlus } from 'lucide-react';
import {
  createPersonalAccount,
  signInPersonal,
  hasPersonalAccount,
} from './personal-auth';

export function PersonalLoginPanel({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cref, setCref] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);

  useEffect(() => {
    void hasPersonalAccount().then(setHasAccount);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        await createPersonalAccount({ name, email, password, cref });
        setInfo('Painel criado! Entrando…');
      } else {
        await signInPersonal(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(1200px 600px at 50% -10%, rgba(200,245,96,0.12), transparent 60%), #06070a',
        color: '#f3f5ef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'Inter, system-ui, sans-serif',
        zIndex: 1150,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 22,
          padding: 28,
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 42,
              height: 42,
              borderRadius: 13,
              background: 'linear-gradient(150deg, #c8f560, #6fe3c4)',
              color: '#0b1206',
            }}
          >
            <Dumbbell size={20} />
          </span>
          <div>
            <strong style={{ display: 'block', fontFamily: 'Rajdhani, Inter, sans-serif', fontSize: '1.25rem' }}>
              Painel Personal
            </strong>
            <span style={{ fontSize: '0.7rem', color: '#8f958a', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              CRM do treinador
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: 10,
              border: 0,
              background: mode === 'login' ? '#c8f560' : 'rgba(255,255,255,0.06)',
              color: mode === 'login' ? '#0b1206' : '#f3f5ef',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogIn size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: 10,
              border: 0,
              background: mode === 'signup' ? '#c8f560' : 'rgba(255,255,255,0.06)',
              color: mode === 'signup' ? '#0b1206' : '#f3f5ef',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <UserPlus size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Criar conta
          </button>
        </div>

        {hasAccount === false && mode === 'login' && (
          <div style={{ fontSize: '0.78rem', color: '#ffb45c', marginBottom: 12 }}>
            Nenhum painel criado neste aparelho. Crie sua conta primeiro.
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.78rem', color: '#8f958a' }}>
                Nome completo
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Seu nome"
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.78rem', color: '#8f958a' }}>
                CREF (opcional)
                <input
                  value={cref}
                  onChange={(e) => setCref(e.target.value)}
                  style={inputStyle}
                  placeholder="000000-G/SP"
                />
              </label>
            </>
          )}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.78rem', color: '#8f958a' }}>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="personal@email.com"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.78rem', color: '#8f958a' }}>
            Senha
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ ...inputStyle, paddingRight: 40 }}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 0,
                  color: '#8f958a',
                  cursor: 'pointer',
                }}
                aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {error && (
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(255,122,122,0.1)', color: '#ffb3b3', fontSize: '0.8rem' }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(200,245,96,0.1)', color: '#c8f560', fontSize: '0.8rem' }}>
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              padding: '12px 16px',
              borderRadius: 12,
              border: 0,
              background: 'linear-gradient(120deg, #c8f560, #a8e047)',
              color: '#0b1206',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : mode === 'signup' ? 'Criar painel' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <button
            type="button"
            onClick={onBack}
            style={{ background: 'transparent', border: 0, color: '#8f958a', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            ← Voltar para o login do aluno
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(0,0,0,0.3)',
  color: '#f3f5ef',
  fontSize: '0.9rem',
  outline: 'none',
};

