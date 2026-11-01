/**
 * RealEventsFeed.tsx — alimenta a Caixa de Mensagens com eventos reais (v4.67.0)
 *
 * Componente sem UI: monta no App e, quando os dados locais (ou a nuvem)
 * mudam, grava as mensagens correspondentes em `inbox.ts`:
 *
 *   • fim de liga (semanal/mensal) em que o usuário treinou;
 *   • ofensiva em risco no dia;
 *   • conquistas novas;
 *   • amizade aceita / convite recebido (comparando com o último snapshot).
 *
 * Nada aqui bloqueia a UI: falha de rede na checagem de amigos é silenciosa.
 */

import { useEffect, useRef } from 'react';
import { getStreak, today } from '@/core/db/queries';
import { ACCOUNT_RESTORED_EVENT } from '@/core/auth/account-deletion';
import { useLocalData } from '@/hooks/useLocalData';
import { useProfileState } from '@/features/profile/useProfileState';
import { fetchFriends, isSocialCloudAvailable } from '@/features/social/social-cloud';
import {
  pushMessage,
  noteStreakRisk,
  syncAchievementMessages,
  syncFriendMessages,
  syncLeagueMessages,
} from './inbox';

/** Intervalo mínimo entre checagens de amigos (a nuvem não precisa ser batida sempre). */
const FRIENDS_REFRESH_MS = 60 * 1000;

export function RealEventsFeed() {
  const { history, loading } = useLocalData();
  const { state: profile } = useProfileState();
  const lastFriendsCheck = useRef(0);

  /* Ligas + ofensiva: dependem só dos dados locais. */
  useEffect(() => {
    if (loading || history.length === 0) return;

    syncLeagueMessages(history);
    const trainedToday = history.some(
      (entry) => entry.date === today() && (entry.completed || entry.checks.length > 0),
    );
    noteStreakRisk(getStreak(history), trainedToday);
  }, [history, loading]);

  /* Conquistas: compara com o último snapshot visto. */
  useEffect(() => {
    syncAchievementMessages(profile?.conquistas);
  }, [profile?.conquistas]);

  /* Conta reativada: o login dentro dos 30 dias cancelou a desativação. */
  useEffect(() => {
    const onRestored = (event: Event) => {
      const daysLeft = Number((event as CustomEvent<{ daysLeft?: number }>).detail?.daysLeft ?? 0);
      pushMessage({
        kind: 'account',
        key: `account-restored:${new Date().toISOString().slice(0, 10)}`,
        title: 'Conta reativada',
        body:
          daysLeft > 0
            ? `Você entrou antes do prazo de ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} e a desativação foi cancelada. Seus dados continuam aqui.`
            : 'Sua desativação foi cancelada. Seus dados continuam aqui.',
      });
    };

    window.addEventListener(ACCOUNT_RESTORED_EVENT, onRestored);
    return () => window.removeEventListener(ACCOUNT_RESTORED_EVENT, onRestored);
  }, []);

  /* Amizades: transições vindas da nuvem. */
  useEffect(() => {
    if (!isSocialCloudAvailable) return undefined;

    let alive = true;

    const run = async () => {
      if (Date.now() - lastFriendsCheck.current < FRIENDS_REFRESH_MS) return;
      lastFriendsCheck.current = Date.now();
      try {
        const friends = await fetchFriends();
        if (alive) syncFriendMessages(friends);
      } catch {
        /* offline ou sem sessão: tenta na próxima */
      }
    };

    void run();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void run();
    };
    const onOnline = () => {
      lastFriendsCheck.current = 0;
      void run();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    window.addEventListener('academia:prefs-changed', onVisible);

    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('academia:prefs-changed', onVisible);
    };
  }, []);

  return null;
}

export default RealEventsFeed;
