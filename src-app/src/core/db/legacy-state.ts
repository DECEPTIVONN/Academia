/**
 * legacy-state.ts — Escrita na cópia bruta legada (tabela legacyState)
 * A cópia bruta é gravada uma única vez pelo migrator; este helper é o ÚNICO
 * caminho de escrita pós-migração (radarTier, maestrias, etc.) — um merge
 * parcial que dispara `academia:db-ready` para as UIs recarregarem.
 */

import { idb } from '@/core/db/idb';
import { LEGACY_DB_KEY, type LegacyRaw } from '@/core/db/queries';

export async function patchLegacyState(patch: Partial<LegacyRaw>): Promise<void> {
  const row = await idb.legacyState.get(LEGACY_DB_KEY);
  const current = (row?.value ?? {}) as LegacyRaw;
  await idb.legacyState.put({
    key: LEGACY_DB_KEY,
    value: { ...current, ...patch },
    updatedAt: new Date().toISOString(),
  });
  document.dispatchEvent(new CustomEvent('academia:db-ready'));
}
