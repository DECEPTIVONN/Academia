/**
 * player-prefs.ts — Preferências do miniplayer (v4.22.0-music)
 *
 * v4.28.0 — o widget é OPT-IN: fica OCULTO por padrão
 * (academia_pref_player_enabled = 'off'). Ao ligar, os padrões seguem a
 * referência fixada pelo usuário: Fixo • Esquerda centro • Só após tocar •
 * 5s • Gaveta Ligada • 3px • 5,5%.
 *
 * O player tem DOIS modos:
 *  • 'flex' — painel flutuante arrastável/redimensionável;
 *  • 'fixed' (padrão) — pastilha MINIMIZADA no estilo do contador de duração do
 *    treino (.global-timer), numa posição escolhida nas Configurações, que
 *    fica sempre visível ou só N segundos (padrão 5) após trocar de música.
 *
 * Chaves (localStorage):
 *  • academia_pref_player_enabled 'on' | 'off' (padrão 'off' — widget oculto)
 *  • academia_pref_player_mode   'flex' | 'fixed' (padrão 'fixed')
 *  • academia_pref_player_pos    'tl'|'tc'|'tr'|'bl'|'bc'|'br' (padrão 'tc')
 *  • academia_pref_player_persist 'always' | 'timed' (padrão 'timed')
 *  • academia_pref_player_secs   segundos (3–60, padrão 5)
 *
 * v4.24.0 — GAVETA (convive com flex/fixed, que só definem a POSIÇÃO):
 *  • academia_pref_player_drawer       'on' | 'off' (padrão on)
 *  • academia_pref_player_drawer_thick espessura da barra em px (3–14, padrão 3)
 *  • academia_pref_player_drawer_vp    altura da barra em % da viewport (0,5–100, passo 0,5, padrão 5,5)
 */

export type PlayerMode = 'flex' | 'fixed';
export type PlayerPos = 'tl' | 'tc' | 'tr' | 'bl' | 'bc' | 'br';
export type PlayerPersist = 'always' | 'timed';
/** v4.24.0 — barra deslizante (gaveta). 'off' = desligada; 'on' = ligada. */
export type PlayerDrawer = 'off' | 'on';

/* v4.28.0 — interruptor mestre do WIDGET do player (padrão desligado). */
const K_ENABLED = 'academia_pref_player_enabled';
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
  { id: 'tc', label: 'Esquerda centro' },
  { id: 'tr', label: 'Topo direita' },
  { id: 'bl', label: 'Base esquerda' },
  { id: 'bc', label: 'Direita centro' },
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

/** v4.28.0 — o widget do player fica OCULTO por padrão; só aparece se ligado. */
export function getPlayerEnabled(): boolean {
  return read(K_ENABLED) === 'on';
}

export function setPlayerEnabled(on: boolean): void {
  write(K_ENABLED, on ? 'on' : 'off');
  emitPrefsChanged();
}

export function getPlayerMode(): PlayerMode {
  return read(K_MODE) === 'flex' ? 'flex' : 'fixed';
}

export function setPlayerMode(mode: PlayerMode): void {
  write(K_MODE, mode);
  emitPrefsChanged();
}

export function getPlayerPos(): PlayerPos {
  const v = read(K_POS);
  return v === 'tl' || v === 'tc' || v === 'tr' || v === 'bl' || v === 'bc' || v === 'br'
    ? v
    : 'tc';
}

export function setPlayerPos(pos: PlayerPos): void {
  write(K_POS, pos);
  emitPrefsChanged();
}

export function getPlayerPersist(): PlayerPersist {
  return read(K_PERSIST) === 'always' ? 'always' : 'timed';
}

export function setPlayerPersist(p: PlayerPersist): void {
  write(K_PERSIST, p);
  emitPrefsChanged();
}

/** Segundos que a pastilha fixa fica visível após trocar de música (3–60). */
export function getPlayerHideSecs(): number {
  const raw = read(K_SECS);
  if (raw === null || raw === '') return 5; // padrão (Number(null) === 0 → nunca parsear cego)
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(60, Math.max(3, Math.round(n))) : 5;
}

export function setPlayerHideSecs(secs: number): void {
  write(K_SECS, String(Math.min(60, Math.max(3, Math.round(secs)))));
  emitPrefsChanged();
}

/* ═══════════ v4.24.0 — GAVETA (barra deslizante) ═══════════
   A gaveta é um modo de APRESENTAÇÃO que convive com Flexível/Fixo (eles só
   definem a posição de onde a barra nasce). Ao deslizar a barra pra dentro
   abre o mesmo player do modo Fixo; clicar fora recolhe. */

/** Espessura da barra, em px (3–14; padrão 3). */
export function getDrawerThickness(): number {
  const raw = read(K_DRAWER_THICK);
  if (raw === null || raw === '') return 3; // Number(null)===0 → nunca parsear cego
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(14, Math.max(3, Math.round(n))) : 3;
}

export function setDrawerThickness(px: number): void {
  write(K_DRAWER_THICK, String(Math.min(14, Math.max(3, Math.round(px)))));
  emitPrefsChanged();
}

/** Altura da barra como % da viewport (0,5–100; passo 0,5; padrão 5,5). */
const clampVp = (pct: number) => Math.min(100, Math.max(0.5, Math.round(pct * 2) / 2));
export function getDrawerVpHeight(): number {
  const raw = read(K_DRAWER_VPERSIST);
  if (raw === null || raw === '') return 5.5; // Number(null)===0 → nunca parsear cego
  const n = Number(raw);
  return Number.isFinite(n) ? clampVp(n) : 5.5;
}

export function setDrawerVpHeight(pct: number): void {
  write(K_DRAWER_VPERSIST, String(clampVp(pct)));
  emitPrefsChanged();
}

export function getPlayerDrawer(): PlayerDrawer {
  return read(K_DRAWER) === 'off' ? 'off' : 'on';
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
