/**
 * auth-context.tsx — AuthProvider + useAuth hook
 * Gerencia o ciclo de vida da sessão Supabase:
 * login com email/senha, Google OAuth, WebAuthn 2FA e logout.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/core/supabase';
import { clearLocalDB } from '@/core/db/idb';

/* ── Tipos ── */
interface AuthContextValue {
  user:    User    | null;
  session: Session | null;
  loading: boolean;

  signIn:          (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp:          (email: string, password: string, displayName?: string) => Promise<void>;
  signOut:         () => Promise<void>;
  resetPassword:   (email: string) => Promise<void>;
}

/* ── Context ── */
const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Provider ── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User    | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  /* Inicializar sessão na montagem */
  useEffect(() => {
    // Recupera sessão existente do localStorage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças de auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /* ── Ações ── */

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw formatAuthError(error);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) throw formatAuthError(error);
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName ?? '' },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw formatAuthError(error);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await clearLocalDB();   // Limpa dados locais no logout
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw formatAuthError(error);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      signIn, signInWithGoogle, signUp, signOut, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ── Hook ── */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

/* ── Formata mensagens de erro Supabase para pt-BR ── */
function formatAuthError(error: AuthError): Error {
  const messages: Record<string, string> = {
    'Invalid login credentials':              'Email ou senha incorretos.',
    'Email not confirmed':                    'Confirme seu email antes de fazer login.',
    'User already registered':               'Este email já está cadastrado.',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
    'Email rate limit exceeded':             'Muitas tentativas. Aguarde alguns minutos.',
  };

  const friendly = messages[error.message] ?? error.message;
  return new Error(friendly);
}
