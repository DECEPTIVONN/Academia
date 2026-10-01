/**
 * supabase.ts — Cliente Supabase (singleton)
 * Lê as variáveis de ambiente via Vite (VITE_SUPABASE_*)
 * Tipado com o Database interface de schema.ts
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/core/db/schema';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '[supabase] VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. ' +
    'Crie o arquivo src-app/.env com as chaves do seu projeto Supabase.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage:          localStorage,
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: true,    // Suporta OAuth redirect
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/* ── Helper: retorna o user_id do usuário atual ou lança ── */
export async function requireUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user.id) {
    throw new Error('Usuário não autenticado');
  }
  return session.user.id;
}
