/**
 * share-invite.ts — compartilhamento do convite de amigo.
 *
 * Extraído do card "Compartilhar Atividade" da Central de Ofensivas porque a
 * mesma tela passou a ser aberta por dois lugares (aba Progresso e o botão de
 * ofensiva do Início). Usa o Web Share do sistema, cai para a área de
 * transferência e avisa por toast — mesmo comportamento do fluxo antigo.
 */

import { buildFriendInviteUrl, getFriendCode } from './friend-invites';
import { shareNative } from '@/lib/native-share';
import { showToast } from '@/lib/toast';

export async function shareFriendInvite(name?: string): Promise<void> {
  const code = getFriendCode();
  const url = buildFriendInviteUrl(code, name || 'Seu amigo');
  const result = await shareNative({
    title: 'Academia',
    text: 'Treine comigo no Academia — use meu convite de amigo:',
    url,
  });
  if (result === 'shared' || result === 'cancelled') return;
  try {
    await navigator.clipboard.writeText(url);
    showToast('Convite copiado para a área de transferência');
  } catch {
    showToast('Não foi possível compartilhar o convite', 'error');
  }
}
