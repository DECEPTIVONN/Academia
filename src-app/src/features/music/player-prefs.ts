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
 *
 * v4.24.0 — GAVETA (convive com flex/fixed, que só definem a POSIÇÃO):
 *  • academia_pref_player_drawer       'on' | 'off' (padrão off)
 *  • academia_pref_player_drawer_thick espessura da barra em px (3–14, padrão 5)
 *  • academia_pref_player_drawer_vp    altura da barra em % da viewport (0,5–100, passo 0,5, padrão 0,5)
 */

export type PlayerMode = 'flex' | 'fixed';
export type PlayerPos = 'tl' | 'tc' | 'tr' | 'bl' | 'bc' | 'br';
export type PlayerPersist = 'always' | 'timed';
/** v4.24.0 — barra deslizante (gaveta). 'off' = desligada; 'on' = ligada. */
export type PlayerDrawer = 'off' | 'on';

const K_MODE = 'academia_pref_player_mode';
const K_POS = 'academia_pref_player_pos';
const K_PERSIST = 'academia_pref_player_persist';
const K_SECS = 'academia_pref_player_secs';
/* v4.24.0 — gaveta (barra deslizante que abre o player minimizado) */
const K_DRAWER = 'academia_pref_player_drawer';
const K_DRAWER_THICK = 'academia_pref_player_drawer_thick';
const K_DRAWER_VPERSIST = 'academia_pref_player_drawer_vp';

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

/* ═══════════ v4.24.0 — GAVETA (barra deslizante) ═══════════
   A gaveta é um modo de APRESENTAÇÃO que convive com Flexível/Fixo (eles só
   definem a posição de onde a barra nasce). Ao deslizar a barra pra dentro
   abre o mesmo player do modo Fixo; clicar fora recolhe. */

/** Espessura da barra, em px (3–14; padrão 5). */
export function getDrawerThickness(): number {
  const n = Number(read(K_DRAWER_THICK));
  return Number.isFinite(n) ? Math.min(14, Math.max(3, Math.round(n))) : 5;
}

export function setDrawerThickness(px: number): void {
  write(K_DRAWER_THICK, String(Math.min(14, Math.max(3, Math.round(px)))));
  emitPrefsChanged();
}

/** Altura da barra como % da viewport (0,5–100; passo 0,5; padrão 0,5 = discreta). */
const clampVp = (pct: number) => Math.min(100, Math.max(0.5, Math.round(pct * 2) / 2));
export function getDrawerVpHeight(): number {
  const n = Number(read(K_DRAWER_VPERSIST));
  return Number.isFinite(n) ? clampVp(n) : 0.5;
}

export function setDrawerVpHeight(pct: number): void {
  write(K_DRAWER_VPERSIST, String(clampVp(pct)));
  emitPrefsChanged();
}

export function getPlayerDrawer(): PlayerDrawer {
  return read(K_DRAWER) === 'on' ? 'on' : 'off';
}

export function setPlayerDrawer(v: PlayerDrawer): void {
  write(K_DRAWER, v);
  emitPrefsChanged();
}

/** Componentes reativos escutam este evento para relerem as prefs. */
export const PLAYER_PREFS_EVENT = 'academia:player-prefs-changed';

function emitPrefsChanged(): void {
  window.dispatchEvent(new Event(PLAYER_PREFS_EVENT));
}
