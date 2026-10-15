/**
 * useAppLock.ts — Hook de inatividade + sincronização do bloqueio (v4.6.0-shell)
 *
 * Regras (referência NavigationShellStandalone.tsx, adaptadas):
 *   • enquanto DESTRAVADO, um timeout reinicia a cada interação
 *     (pointerdown/keydown/touchstart/wheel); ao estourar → lock();
 *   • timeout -1 ("Desativado") ou lock não utilizável → sem timer;
 *   • o efeito re-arma quando o lock liga/desliga em sessão (evento
 *     `academia:lock-prefs-changed` do SettingsFeature) e quando o usuário
 *     destrava (estado `locked` do store).
 *
 * v4.22.0 — EXCEÇÃO DO TREINO: enquanto houver treino ativo o timer de
 * inatividade NÃO trava o app (o usuário está exercitando sem tocar o
 * celular — não deve ficar colando senha a cada intervalo). A exceção vale
 * só nesse caso: encerrado o treino, o lock volta a valer normalmente.
 */

import { useEffect, useState } from 'react';
import {
  getLockTimeoutSec,
  isLockUsable,
  isWorkoutActive,
  useLockStore,
} from './lock-store';

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'pointerdown',
  'keydown',
  'touchstart',
  'wheel',
];

export function useAppLock(): void {
  const locked = useLockStore((s) => s.locked);
  const [tick, setTick] = useState(0);

  /* Re-arma quando as prefs mudam em sessão */
  useEffect(() => {
    const onPrefs = () => setTick((t) => t + 1);
    window.addEventListener('academia:lock-prefs-changed', onPrefs);
    return () => window.removeEventListener('academia:lock-prefs-changed', onPrefs);
  }, []);

  /* v4.22.0 — re-arma quando o treino começa/termina (exceção do treino) */
  useEffect(() => {
    const onWorkout = () => setTick((t) => t + 1);
    window.addEventListener('academia:workout-started', onWorkout);
    window.addEventListener('academia:workout-cancelled', onWorkout);
    window.addEventListener('academia:workout-closed', onWorkout);
    window.addEventListener('academia:workout-completed', onWorkout);
    return () => {
      window.removeEventListener('academia:workout-started', onWorkout);
      window.removeEventListener('academia:workout-cancelled', onWorkout);
      window.removeEventListener('academia:workout-closed', onWorkout);
      window.removeEventListener('academia:workout-completed', onWorkout);
    };
  }, []);

  useEffect(() => {
    if (locked) return;
    if (!isLockUsable()) return;
    /* v4.22.0 — treino ativo → sem trava automática */
    if (isWorkoutActive()) return;
    const sec = getLockTimeoutSec();
    if (sec === -1) return;

    let timer: number | null = null;
    const reset = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        useLockStore.getState().lock();
      }, sec * 1000);
    };

    reset();
    for (const evt of ACTIVITY_EVENTS) window.addEventListener(evt, reset, { passive: true });
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      for (const evt of ACTIVITY_EVENTS) window.removeEventListener(evt, reset);
    };
  }, [locked, tick]);
}
