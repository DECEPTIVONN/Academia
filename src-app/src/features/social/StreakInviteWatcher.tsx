/**
 * StreakInviteWatcher.tsx — mantém as Mensagens do Início atualizadas (v4.74.0)
 *
 * O app não tem push dedicado para convites de ofensiva; este observador
 * leve consulta os convites ao abrir, ao voltar para a aba e a cada 45 s.
 * A gravação é idempotente (`syncStreakInviteMessages`), então não duplica
 * cartões e também atualiza aceites/recusas feitos no outro aparelho.
 */

import { useEffect } from 'react';
import { isSocialCloudAvailable } from './social-cloud';
import { fetchStreakInvites, syncStreakInviteMessages, STREAK_INVITES_EVENT } from './streak-invites';

export function StreakInviteWatcher() {
  useEffect(() => {
    if (!isSocialCloudAvailable) return undefined;
    let cancelled = false;

    const run = async () => {
      try {
        const invites = await fetchStreakInvites();
        if (!cancelled) syncStreakInviteMessages(invites);
      } catch {
        /* offline/sem sessão: o painel e as Mensagens seguem com o estado local */
      }
    };

    void run();
    const timer = window.setInterval(() => void run(), 45_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void run();
    };
    window.addEventListener(STREAK_INVITES_EVENT, run);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(STREAK_INVITES_EVENT, run);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}

export default StreakInviteWatcher;
