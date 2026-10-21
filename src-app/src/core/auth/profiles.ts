import { isSupabaseConfigured, supabase } from '@/core/supabase';

/**
 * Verifica se o username já existe na tabela public.profiles.
 * Se a tabela/Supabase não estiver disponível, retorna true (fail-open)
 * para não bloquear o cadastro em ambientes sem migration aplicada.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('username', username)
      .limit(1);
    if (error) return true;
    return !data || data.length === 0;
  } catch {
    return true;
  }
}
