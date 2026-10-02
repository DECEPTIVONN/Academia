/**
 * supabase.ts — Cliente Supabase (singleton)
 * Suporta fallback gracioso quando as variáveis de ambiente VITE_SUPABASE_* não estiverem configuradas.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/core/db/schema';

const supabaseUrl  = (import.meta.env.VITE_SUPABASE_URL  as string) || 'https://placeholder.supabase.co';
const supabaseKey  = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage:          localStorage,
    autoRefreshToken: isSupabaseConfigured,
    persistSession:   isSupabaseConfigured,
    detectSessionInUrl: isSupabaseConfigured,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/* ── Helper: retorna o user_id do usuário atual ou lança ── */
export async function requireUserId(): Promise<string> {
  if (!isSupabaseConfigured) {
    return 'local-user';
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user.id) {
    throw new Error('Usuário não autenticado');
  }
  return session.user.id;
}
