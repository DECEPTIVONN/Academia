/**
 * supabase.ts — Cliente Supabase (singleton)
 * Suporta fallback gracioso quando as variáveis de ambiente VITE_SUPABASE_* não estiverem configuradas.
 *
 * v4.9.0-sync: as credenciais salvas no painel (Configurações → Nuvem,
 * localStorage mbc_supabase_url / mbc_supabase_anon_key) também alimentam
 * este cliente — o .env continua tendo prioridade. As credenciais são lidas
 * na inicialização do módulo; salvas em sessão, valem após o reload.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/core/db/schema';

const PANEL_URL_KEY = 'mbc_supabase_url';
const PANEL_KEY_KEY = 'mbc_supabase_anon_key';

function panelValue(key: string): string {
  try {
    return localStorage.getItem(key)?.trim() || '';
  } catch {
    return '';
  }
}

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

const supabaseUrl  = envUrl  || panelValue(PANEL_URL_KEY) || 'https://placeholder.supabase.co';
const supabaseKey  = envKey  || panelValue(PANEL_KEY_KEY) || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  (envUrl || panelValue(PANEL_URL_KEY)) && (envKey || panelValue(PANEL_KEY_KEY))
);

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseKey, {
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
