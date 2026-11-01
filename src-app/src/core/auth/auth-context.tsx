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
import {
  cancelDeletionIfPending,
  resetDeletionCheck,
} from '@/core/auth/account-deletion';

export interface AuthContextValue {
  user:    User    | null;
  session: Session | null;
  loading: boolean;
  /** Sessão local de desenvolvimento (sem Supabase, sem sincronização). */
  isTestMode: boolean;

  signIn:          (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp:          (email: string, password: string, displayName?: string) => Promise<void>;
  /** Define/troca a senha da conta (usada após login com Google). */
  updatePassword:  (password: string) => Promise<void>;
  signOut:         () => Promise<void>;
  resetPassword:   (email: string) => Promise<void>;
  /** Entra com uma conta fictícia local (somente em desenvolvimento). */
  signInAsTest:    () => void;
}

/* ── Modo teste (dev) ───────────────────────────────────────────────────────
   Conta fictícia que vive só no navegador: não chama o Supabase, não inicia o
   motor de sync e desaparece no build de produção (`import.meta.env.DEV`).
   A flag em localStorage mantém a sessão entre reloads durante o dev. */
const TEST_SESSION_KEY = 'mbc_test_session';
const TEST_USER_ID = 'local-test-user';

function hasTestSession(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    return localStorage.getItem(TEST_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function createTestUser(): User {
  const now = new Date().toISOString();
  return {
    id: TEST_USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'teste@local.dev',
    email_confirmed_at: now,
    phone: '',
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: { provider: 'test', providers: ['test'] },
    user_metadata: { display_name: 'Teste', full_name: 'Usuário Teste' },
    identities: [],
    created_at: now,
    updated_at: now,
    is_anonymous: false,
  } as unknown as User;
}

/* ── Sessão offline (v4.56.21) ─────────────────────────────────────────────
   O app é offline-first, mas o login não: sem internet o refresh do token
   falha, o Supabase emite SIGNED_OUT e a AuthScreen (que exige rede) toma a
   tela — o PWA instalado ficava inutilizável sem sinal. Guardamos um snapshot
   mínimo da última conta autenticada e, quando o navegador está offline (ou a
   checagem de sessão falha por falta de rede), mantemos essa conta ativa:
   os dados locais (IndexedDB) continuam acessíveis e a fila de sync envia o
   que ficou pendente quando a conexão volta. Sair da conta de propósito limpa
   o snapshot. */
const OFFLINE_USER_KEY = 'mbc_offline_user';

function readOfflineUser(): User | null {
  try {
    const raw = localStorage.getItem(OFFLINE_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User | null;
    return parsed && typeof parsed.id === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function storeOfflineUser(u: User | null): void {
  try {
    if (u) localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(OFFLINE_USER_KEY);
  } catch {
    /* storage indisponível */
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);
export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const bootTest = hasTestSession();
  const [user,    setUser]    = useState<User    | null>(() => (bootTest ? createTestUser() : null));
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(bootTest ? false : isSupabaseConfigured);
  const [isTestMode, setIsTestMode] = useState(bootTest);

  useEffect(() => {
    if (isTestMode) return;
    if (!isSupabaseConfigured) return;

    const applySession = (s: Session | null) => {
      if (s?.user) storeOfflineUser(s.user);
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      /* v4.67.0 — entrar de novo em até 30 dias CANCELA a desativação da conta
         (a RPC roda uma vez por carregamento; o aviso aparece na Caixa de
         Mensagens via evento `academia:account-restored`). */
      if (s?.user) void cancelDeletionIfPending();
    };

    /* Sem sessão válida: offline, cai para o snapshot da última conta em vez
       de mandar o usuário para a tela de login (que precisa de rede).

       `navigator.onLine` sozinho não basta: ele continua `true` em rede sem
       rota (Wi-Fi de hotel/captive portal). Por isso, com conta em cache,
       sonda a própria origem por uma URL que o service worker NUNCA responde
       de cache (query única, fora do precache e das rotas de runtime) e só
       desiste do snapshot quando a rede responde de verdade. */
    const reachable = async (): Promise<boolean> => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
      try {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`${window.location.origin}/index.html?ping=${Date.now()}`, {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        window.clearTimeout(timer);
        return res.ok;
      } catch {
        return false;
      }
    };

    const fallbackWhenOffline = async (): Promise<boolean> => {
      const cached = readOfflineUser();
      if (!cached) return false;
      if (await reachable()) return false;
      setSession(null);
      setUser(cached);
      setLoading(false);
      return true;
    };

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          applySession(session);
          return;
        }
        if (await fallbackWhenOffline()) return;
        applySession(null);
      })
      .catch(async () => {
        if (await fallbackWhenOffline()) return;
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        /* Falha de refresh sem rede também emite SIGNED_OUT: não expulsa. */
        if (event === 'SIGNED_OUT') {
          void fallbackWhenOffline().then((usedCache) => {
            if (usedCache) return;
            storeOfflineUser(null);
            applySession(null);
          });
          return;
        }
        applySession(session);
      }
    );

    /* Voltou a internet: troca a sessão offline pela sessão real. */
    const onOnline = () => {
      void supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          if (session?.user) applySession(session);
        })
        .catch(() => {
          /* segue com a sessão local */
        });
    };
    window.addEventListener('online', onOnline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', onOnline);
    };
  }, [isTestMode]);

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

  const signInAsTest = useCallback(() => {
    if (!import.meta.env.DEV) {
      throw new Error('O modo teste só existe em desenvolvimento.');
    }
    try {
      localStorage.setItem(TEST_SESSION_KEY, '1');
    } catch {
      /* storage indisponível: a sessão vale só para esta aba */
    }
    setIsTestMode(true);
    setSession(null);
    setUser(createTestUser());
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    resetDeletionCheck();
    const wasTest = isTestMode;
    if (wasTest) {
      try {
        localStorage.removeItem(TEST_SESSION_KEY);
      } catch {
        /* storage indisponível */
      }
      setIsTestMode(false);
      setSession(null);
      setUser(null);
    }
    storeOfflineUser(null);
    if (isSupabaseConfigured && !wasTest) {
      await supabase.auth.signOut();
    }
    await clearLocalDB();
  }, [isTestMode]);

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw formatAuthError(error);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, loading, isTestMode,
      signIn, signInWithGoogle, signUp, updatePassword, signOut, resetPassword, signInAsTest,
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
