/**
 * lock-wallpapers.ts — Presets de wallpaper da tela de bloqueio (v4.6.0-shell)
 *
 * Fonte única dos 4 presets (id/nome/gradiente) usados por:
 *   • SettingsFeature (cards V/H da tela Segurança);
 *   • LockScreen (fundo real da tela de bloqueio, escolhido conforme a
 *     orientação — pref `lockWallVertical`/`lockWallHorizontal`).
 * Gradientes usam `--primary-rgb` com fallback (tokens do Academia).
 */

export interface LockWallpaper {
  id: string;
  name: string;
  bg: string;
}

export const WALL_PRESETS: LockWallpaper[] = [
  { id: 'neon', name: 'Neon', bg: 'linear-gradient(160deg, rgba(var(--primary-rgb, 139, 92, 246), 0.65), #0a0a10 70%)' },
  { id: 'grafite', name: 'Grafite', bg: 'linear-gradient(160deg, #3f3f46, #0a0a10 70%)' },
  { id: 'violeta', name: 'Violeta', bg: 'linear-gradient(160deg, #8b5cf6, #0a0a10 70%)' },
  { id: 'magenta', name: 'Magenta', bg: 'linear-gradient(160deg, #d946ef, #0a0a10 70%)' },
];

export function resolveWallpaper(id: string | null | undefined): LockWallpaper {
  return WALL_PRESETS.find((p) => p.id === id) ?? WALL_PRESETS[0];
}
