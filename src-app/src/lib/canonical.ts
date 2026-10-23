/**
 * canonical.ts — Comparação canônica profunda (dados.md §4.4)
 *
 * Normaliza recursivamente as chaves de um objeto (ordenação alfabética)
 * e descarta valores `undefined` antes de serializar em JSON. Usado para:
 *   • detectar se o estado mudou de verdade (evita pushs redundantes);
 *   • prevenir loops de sincronização (ping-pong) entre dispositivos;
 *   • comparar snapshots remotos com o último salvo.
 *
 * Espelha `cleanAndSortObject` + `safeStringify` do documento de referência.
 */

export function cleanAndSortObject(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(cleanAndSortObject);
  if (typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    Object.keys(value as Record<string, unknown>)
      .sort()
      .forEach((key) => {
        const v = (value as Record<string, unknown>)[key];
        if (v !== undefined) sorted[key] = cleanAndSortObject(v);
      });
    return sorted;
  }
  return value;
}

export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(cleanAndSortObject(value));
  } catch {
    return '';
  }
}

/** Compara duas estruturas por igualdade canônica profunda. */
export function canonicalEqual(a: unknown, b: unknown): boolean {
  return safeStringify(a) === safeStringify(b);
}