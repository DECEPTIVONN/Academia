/**
 * account-deletion.ts — desativação de conta com 30 dias de carência (v4.67.0)
 *
 * Fluxo (espelha as RPCs da migração `20261102_push_pairing_account.sql`):
 *
 *   1. `requestAccountDeletion()` marca a exclusão para daqui a 30 dias e
 *      devolve a data efetiva. O app então sai da conta e apaga os dados
 *      locais (quem faz isso é a tela de Configurações, via `signOut`);
 *   2. se o usuário entrar de novo ANTES dos 30 dias, `cancelDeletionIfPending()`
 *      (chamada pelo AuthProvider ao abrir sessão) reativa a conta, e o app
 *      registra o aviso na Caixa de Mensagens;
 *   3. passados os 30 dias, `/api/account-purge?action=cron` apaga a conta de
 *      verdade no servidor (`auth.admin.deleteUser` + cascata).
 *
 * Tudo degrada bem sem nuvem: sem Supabase, a conta é local e a exclusão é só
 * o logout com limpeza do banco do aparelho.
 */

import { supabase, isSupabaseConfigured } from '@/core/supabase';

/** Disparado quando o login reativa uma conta marcada para exclusão. */
export const ACCOUNT_RESTORED_EVENT = 'academia:account-restored';

export interface DeletionRequest {
  /** Data efetiva da exclusão (ISO). */
  effectiveAt: string;
  daysLeft: number;
}

export interface DeletionStatus {
  requestedAt: string | null;
  effectiveAt: string | null;
  daysLeft: number | null;
  expired: boolean;
  /** `true` quando a nuvem está configurada (senão a conta é local). */
  cloud: boolean;
}

/** Marca a exclusão da conta. Lança quando não há nuvem/sessão. */
export async function requestAccountDeletion(reason?: string): Promise<DeletionRequest> {
  if (!isSupabaseConfigured) {
    throw new Error('Sem nuvem configurada: a conta é local.');
  }

  const { data, error } = await (supabase as any).rpc('request_account_deletion', {
    p_reason: reason ?? null,
  });
  if (error) throw new Error(error.message || 'deletion-request-failed');

  const effectiveAt = typeof data === 'string' ? data : new Date().toISOString();
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(effectiveAt).getTime() - Date.now()) / 86400000),
  );
  return { effectiveAt, daysLeft };
}

/** Status atual (para a tela em Configurações → Sua Conta). */
export async function deletionStatus(): Promise<DeletionStatus> {
  const local: DeletionStatus = {
    requestedAt: null,
    effectiveAt: null,
    daysLeft: null,
    expired: false,
    cloud: isSupabaseConfigured,
  };
  if (!isSupabaseConfigured) return local;

  try {
    const { data, error } = await (supabase as any).rpc('account_deletion_status');
    if (error) return local;
    const row = Array.isArray(data) ? data[0] : null;
    if (!row) return local;
    return {
      requestedAt: row.requested_at ?? null,
      effectiveAt: row.effective_at ?? null,
      daysLeft: typeof row.days_left === 'number' ? row.days_left : null,
      expired: Boolean(row.expired),
      cloud: true,
    };
  } catch {
    return local;
  }
}

let cancelChecked = false;

/**
 * Cancela a exclusão pendente ao abrir uma sessão (chamado pelo AuthProvider).
 * Roda uma vez por carregamento da página. Devolve os dias restantes quando
 * reativou — o aviso vai para a Caixa de Mensagens.
 */
export async function cancelDeletionIfPending(): Promise<{ daysLeft: number } | null> {
  if (cancelChecked || !isSupabaseConfigured) return null;
  cancelChecked = true;

  try {
    const { data, error } = await (supabase as any).rpc('cancel_account_deletion');
    if (error) return null;
    const row = Array.isArray(data) ? data[0] : null;
    if (!row?.cancelled) return null;

    const effectiveAt = row.effective_at ? new Date(row.effective_at).getTime() : Date.now();
    const daysLeft = Math.max(0, Math.ceil((effectiveAt - Date.now()) / 86400000));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(ACCOUNT_RESTORED_EVENT, { detail: { daysLeft } }),
      );
    }
    return { daysLeft };
  } catch {
    return null;
  }
}

/**
 * Cancela explicitamente a desativação (botão “Cancelar desativação”).
 * Diferente de `cancelDeletionIfPending`, não depende do flag de uma vez por
 * carregamento e informa o motivo quando não é possível.
 */
export async function cancelAccountDeletion(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { data, error } = await (supabase as any).rpc('cancel_account_deletion');
    if (error) return false;
    const row = Array.isArray(data) ? data[0] : null;
    return Boolean(row?.cancelled);
  } catch {
    return false;
  }
}

/** Permite reavaliar depois de sair/entrar sem recarregar a página. */
export function resetDeletionCheck(): void {
  cancelChecked = false;
}
