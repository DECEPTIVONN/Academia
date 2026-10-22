/**
 * useProfileState.ts — Estado de perfil/customização (tabela profileState)
 * Recarrega no bootstrap ('academia:db-ready') e após escritas locais
 * ('academia:profile-updated'), para Dashboard e ProfileFeature verem o mesmo dado.
 */

import { useCallback, useEffect, useState } from 'react';
import { getProfileState, saveProfileState } from '@/core/db/idb';
import type { ProfileState } from '@/core/db/schema';

export const PROFILE_UPDATED_EVENT = 'academia:profile-updated';

export interface UseProfileStateResult {
  state: ProfileState | null;
  loading: boolean;
  /** Aplica uma mutação sobre o estado fresco e persiste (upsert + evento). */
  update: (mut: (draft: ProfileState) => void) => Promise<void>;
}

export function useProfileState(userId: string = 'local'): UseProfileStateResult {
  const [state, setState] = useState<ProfileState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const load = () => {
      getProfileState(userId)
        .then((next) => {
          if (!alive) return;
          setState(next ?? null);
          setLoading(false);
        })
        .catch((err) => {
          console.warn('[useProfileState] falha ao carregar:', err);
          if (alive) setLoading(false);
        });
    };

    load();
    document.addEventListener('academia:db-ready', load);
    document.addEventListener(PROFILE_UPDATED_EVENT, load);
    return () => {
      alive = false;
      document.removeEventListener('academia:db-ready', load);
      document.removeEventListener(PROFILE_UPDATED_EVENT, load);
    };
  }, [userId]);

  const update = useCallback(async (mut: (draft: ProfileState) => void) => {
    try {
      const fresh = await getProfileState(userId);
      if (!fresh) return;
      // Campos são JSON-safe; clone via JSON evita compartilhar referências
      const draft: ProfileState = JSON.parse(JSON.stringify(fresh));
      mut(draft);
      await saveProfileState(draft, userId);
      setState(draft);
      document.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT));
    } catch (err) {
      console.warn('[useProfileState] falha ao salvar:', err);
    }
  }, [userId]);

  return { state, loading, update };
}
