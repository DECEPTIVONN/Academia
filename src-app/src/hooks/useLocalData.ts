/**
 * useLocalData.ts — Hook de dados locais (exercises/sheets/history/legacy)
 * Recarrega quando o bootstrap terminar (evento 'academia:db-ready'),
 * garantindo que a UI veja o seed e a migração da v3.5.7.
 */

import { useEffect, useState } from 'react';
import { loadLocalData, EMPTY_LOCAL_DATA, type LocalData } from '@/core/db/queries';

export interface UseLocalDataResult extends LocalData {
  loading: boolean;
}

export function useLocalData(): UseLocalDataResult {
  const [data, setData] = useState<LocalData>(EMPTY_LOCAL_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const load = () => {
      loadLocalData()
        .then((next) => {
          if (!alive) return;
          setData(next);
          setLoading(false);
        })
        .catch((err) => {
          console.warn('[useLocalData] falha ao carregar dados locais:', err);
          if (alive) setLoading(false);
        });
    };

    load();
    document.addEventListener('academia:db-ready', load);
    return () => {
      alive = false;
      document.removeEventListener('academia:db-ready', load);
    };
  }, []);

  return { ...data, loading };
}
