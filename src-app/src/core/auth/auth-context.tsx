/**
 * auth-context.tsx — AuthProvider (o hook useAuth vive em use-auth.ts)
 * Gerencia o ciclo de vida da sessão Supabase / Modo Offline gracioso.
 */

import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/core/supabase';
import { clearLocalDB } from '@/core/db/idb';

export interface AuthContextValue {
  user:    User    | null;
  session: Session | null;
  loading: boolean;

  signIn:          (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp:          (email: string, password: string, displayName?: string) => Promise<void>;
  /** Define/troca a senha da conta (usada após login com Google). */
  updatePassword:  (password: string) => Promise<void>;
  signOut:         () => Promise<void>;
  resetPassword:   (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User    | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /* "Manter conectado" (v4.15.0-auth): quando desmarcado no AuthScreen
     (mbc_remember_me === 'false'), a persistência termina ao sair da página —
     as chaves de sessão do Supabase são removidas sincronamente no pagehide
     (também ocorre em reload: sem persistência, sem sessão na próxima visita). */
  useEffect(() => {
    if (!user) return;
    const onLeave = () => {
      try {
        if (localStorage.getItem('mbc_remember_me') === 'false') {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && k.startsWith('sb-') && k.includes('auth-token')) {
              localStorage.removeItem(k);
            }
          }
        }
      } catch {
        /* modo privado / storage indisponível */
      }
    };
    window.addEventListener('pagehide', onLeave);
    return () => window.removeEventListener('pagehide', onLeave);
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw formatAuthError(error);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        // select_account: mostra o seletor de contas Google (UX amigável);
        // access_type=offline continua pedindo o refresh_token ao provider.
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    });
    if (error) throw formatAuthError(error);
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado.');
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

  const updatePassword = useCallback(async (password: string) => {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw formatAuthError(error);
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    await clearLocalDB();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw formatAuthError(error);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      signIn, signInWithGoogle, signUp, updatePassword, signOut, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

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
