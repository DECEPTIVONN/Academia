/**
 * streak-invites.ts — convites reais de ofensiva entre amigos (v4.74.0)
 *
 * Um convite só existe entre amizades confirmadas. O amigo recebe uma
 * mensagem nas Mensagens do Início e pode aceitar/recusar; o convite aceito
 * aparece na lista "Ofensivas dos amigos" com a sequência atual.
 *
 * Offline o app não inventa convites: as funções lançam os mesmos erros de
 * `social-cloud` e a UI mostra o estado vazio com aviso de conexão.
 */

import { supabase } from '@/core/supabase';
import {
  SocialCloudAuthError,
  SocialCloudOfflineError,
  currentSocialUserId,
  isSocialCloudAvailable,
} from './social-cloud';
import { patchMessageByKey, pushMessage } from '@/features/notifications/inbox';

export const STREAK_INVITES_EVENT = 'academia:streak-invites-changed';

export type StreakInviteDirection = 'incoming' | 'outgoing';
export type StreakInviteStatus = 'pending' | 'accepted' | 'declined';

export interface StreakInvite {
  id: string;
  inviter: string;
  invitee: string;
  direction: StreakInviteDirection;
  status: StreakInviteStatus;
  userId: string;
  username: string;
  name: string;
  level: number;
  streak: number;
  emblemId?: string;
  photo?: string;
  createdAt: number;
  respondedAt: number;
}

async function requireUser(): Promise<string> {
  if (!isSocialCloudAvailable) throw new SocialCloudOfflineError();
  const me = await currentSocialUserId();
  if (!me) throw new SocialCloudAuthError();
  return me;
}

function notifyChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STREAK_INVITES_EVENT));
  }
}

export async function fetchStreakInvites(): Promise<StreakInvite[]> {
  await requireUser();
  const { data, error } = await (supabase as any).rpc('streak_invites_overview');
  if (error) throw new Error(error.message || 'streak-invites-failed');

  return (Array.isArray(data) ? data : []).map((row: any) => ({
    id: String(row.id),
    inviter: String(row.inviter),
    invitee: String(row.invitee),
    direction: row.direction === 'outgoing' ? 'outgoing' : 'incoming',
    status:
      row.status === 'accepted' || row.status === 'declined' ? row.status : 'pending',
    userId: String(row.user_id),
    username: typeof row.username === 'string' ? row.username : '',
    name:
      (typeof row.display_name === 'string' && row.display_name.trim()) ||
      row.username ||
      'Atleta',
    level: Number(row.level) || 1,
    streak: Number(row.streak) || 0,
    emblemId: typeof row.avatar_emblem === 'string' ? row.avatar_emblem : undefined,
    photo: typeof row.photo === 'string' ? row.photo : undefined,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
    respondedAt: row.responded_at ? new Date(row.responded_at).getTime() : 0,
  }));
}

export async function sendStreakInvite(userId: string): Promise<string> {
  const me = await requireUser();
  if (!userId || userId === me) throw new Error('self');
  const { data, error } = await (supabase as any).rpc('send_streak_invite', {
    p_invitee: userId,
  });
  if (error) throw new Error(error.message || 'streak-invite-send-failed');
  notifyChange();
  return String(data ?? '');
}

export async function respondStreakInvite(
  inviteId: string,
  accept: boolean,
): Promise<void> {
  await requireUser();
  const { error } = await (supabase as any).rpc('respond_streak_invite', {
    p_invite_id: inviteId,
    p_accept: accept,
  });
  if (error) throw new Error(error.message || 'streak-invite-respond-failed');
  notifyChange();
}

export async function cancelStreakInvite(inviteId: string): Promise<void> {
  await requireUser();
  const { error } = await (supabase as any).rpc('cancel_streak_invite', {
    p_invite_id: inviteId,
  });
  if (error) throw new Error(error.message || 'streak-invite-cancel-failed');
  notifyChange();
}

/* ── Mensagens do Início ── */

/**
 * Converte convites em mensagens acionáveis. É idempotente: a chave estável
 * evita duplicar, e convites que já foram respondidos atualizam o cartão em
 * vez de criar outro.
 */
export function syncStreakInviteMessages(invites: StreakInvite[]): void {
  for (const invite of invites) {
    const key = `streak-invite:${invite.id}`;

    if (invite.direction === 'incoming' && invite.status === 'pending') {
      pushMessage({
        kind: 'streak',
        key,
        title: `${invite.name} te convidou para uma ofensiva`,
        body: 'Aceite para manter a sequência junto com esse amigo. O convite fica disponível aqui nas Mensagens.',
        action: 'streak-invite',
        inviteId: invite.id,
        inviteStatus: 'pending',
        fromName: invite.name,
      });
      continue;
    }

    if (invite.direction === 'incoming') {
      patchMessageByKey(key, {
        read: true,
        title:
          invite.status === 'accepted'
            ? `Ofensiva com ${invite.name} ativa`
            : `Convite de ${invite.name} recusado`,
        body:
          invite.status === 'accepted'
            ? 'Vocês agora aparecem juntos em Ofensivas dos amigos. Mantenha a sequência treinando todos os dias.'
            : 'Você recusou este convite. Pode enviar outro quando quiser pelo Perfil → Ofensivas dos Amigos.',
        inviteStatus: invite.status,
      });
      continue;
    }

    if (invite.direction === 'outgoing' && invite.status === 'accepted') {
      pushMessage({
        kind: 'streak',
        key: `streak-invite-accepted:${invite.id}`,
        title: `${invite.name} aceitou sua ofensiva`,
        body: 'O convite foi aceito. A sequência de vocês já aparece em Ofensivas dos amigos.',
        at: invite.respondedAt || invite.createdAt || undefined,
      });
    }
  }
}
