/**
 * player-prefs.ts — Preferências do miniplayer (v4.22.0-music)
 *
 * O player tem DOIS modos:
 *  • 'flex' (padrão, como era) — painel flutuante arrastável/redimensionável;
 *  • 'fixed' — pastilha MINIMIZADA no estilo do contador de duração do
 *    treino (.global-timer), numa posição escolhida nas Configurações, que
 *    fica sempre visível ou só N segundos (padrão 7) após trocar de música.
 *
 * Chaves (localStorage):
 *  • academia_pref_player_mode   'flex' | 'fixed'
 *  • academia_pref_player_pos    'tl'|'tc'|'tr'|'bl'|'bc'|'br'
 *  • academia_pref_player_persist 'always' | 'timed'
 *  • academia_pref_player_secs   segundos (3–60, padrão 7)
 */

export type PlayerMode = 'flex' | 'fixed';
export type PlayerPos = 'tl' | 'tc' | 'tr' | 'bl' | 'bc' | 'br';
export type PlayerPersist = 'always' | 'timed';

const K_MODE = 'academia_pref_player_mode';
const K_POS = 'academia_pref_player_pos';
const K_PERSIST = 'academia_pref_player_persist';
const K_SECS = 'academia_pref_player_secs';

export const PLAYER_POSITIONS: Array<{ id: PlayerPos; label: string }> = [
  { id: 'tl', label: 'Topo esquerda' },
  { id: 'tc', label: 'Topo centro' },
  { id: 'tr', label: 'Topo direita' },
  { id: 'bl', label: 'Base esquerda' },
  { id: 'bc', label: 'Base centro' },
  { id: 'br', label: 'Base direita' },
];

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage indisponível */
  }
}

export function getPlayerMode(): PlayerMode {
  return read(K_MODE) === 'fixed' ? 'fixed' : 'flex';
}

export function setPlayerMode(mode: PlayerMode): void {
  write(K_MODE, mode);
  emitPrefsChanged();
}

export function getPlayerPos(): PlayerPos {
  const v = read(K_POS);
  return v === 'tl' || v === 'tc' || v === 'tr' || v === 'bl' || v === 'bc' || v === 'br'
    ? v
    : 'tr';
}

export function setPlayerPos(pos: PlayerPos): void {
  write(K_POS, pos);
  emitPrefsChanged();
}

export function getPlayerPersist(): PlayerPersist {
  return read(K_PERSIST) === 'timed' ? 'timed' : 'always';
}

export function setPlayerPersist(p: PlayerPersist): void {
  write(K_PERSIST, p);
  emitPrefsChanged();
}

/** Segundos que a pastilha fixa fica visível após trocar de música (3–60). */
export function getPlayerHideSecs(): number {
  const raw = read(K_SECS);
  if (raw === null || raw === '') return 7; // padrão (Number(null) === 0 → nunca parsear cego)
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(60, Math.max(3, Math.round(n))) : 7;
}

export function setPlayerHideSecs(secs: number): void {
  write(K_SECS, String(Math.min(60, Math.max(3, Math.round(secs)))));
  emitPrefsChanged();
}

/** Componentes reativos escutam este evento para relerem as prefs. */
export const PLAYER_PREFS_EVENT = 'academia:player-prefs-changed';

function emitPrefsChanged(): void {
  window.dispatchEvent(new Event(PLAYER_PREFS_EVENT));
}
