/**
 * theme-colors.ts — Sistema de cores global (v4.1.0-settings)
 *
 * Amplia `applyAppTheme` (profile-data.ts) com presets + cor personalizada
 * (hex), mantendo paridade EXATA das 6 variáveis legadas:
 *   --primary, --primary-light, --primary-dark, --primary-rgb,
 *   --gradient, --shadow
 *
 * - Preset  → tons exatos de APP_THEMES (p/pl/pd), sem derivar nada;
 * - Custom  → tons pl/pd derivados via HSL do hex escolhido;
 * - Persistência: `academia_theme` (id do preset | 'custom') e
 *   `academia_theme_custom_hex` (hex do tom personalizado).
 */

import {
  APP_THEMES,
  THEME_TITLES,
  hexToRgb,
  readLS,
  writeLS,
} from '@/features/profile/profile-data';

export const CUSTOM_THEME_ID = 'custom';
export const THEME_HEX_KEY = 'academia_theme_custom_hex';
export const DEFAULT_HEX = '#8b5cf6';

export interface ThemePreset {
  id: string;
  name: string;
  p: string;
  pl: string;
  pd: string;
}

/** Os 12 temas do app viram os presets da grade de cores. */
export const THEME_PRESETS: ThemePreset[] = Object.keys(APP_THEMES).map((id) => ({
  id,
  name: THEME_TITLES[id] ?? id,
  p: APP_THEMES[id].p,
  pl: APP_THEMES[id].pl,
  pd: APP_THEMES[id].pd,
}));

/* ── Conversões hex ── */

/** `#abc` / `#aabbcc` (com ou sem #) → `#aabbcc` minúsculo; inválido → null. */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return null;
}

function hexToRgbTuple(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h *= 60;
  }
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Tons claro/escuro derivados de um hex (só para cor personalizada). */
export function deriveTones(hex: string): { pl: string; pd: string } {
  const { r, g, b } = hexToRgbTuple(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  return {
    pl: hslToHex(h, s * 0.88, Math.min(l + 0.14, 0.84)),
    pd: hslToHex(h, s * 0.86, Math.max(l - 0.16, 0.22)),
  };
}

/* ── Conversões HSV (seletor avançado) ── */

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const { r, g, b } = hexToRgbTuple(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6;
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rn = 0;
  let gn = 0;
  let bn = 0;
  if (h < 60) [rn, gn] = [c, x];
  else if (h < 120) [rn, gn] = [x, c];
  else if (h < 180) [gn, bn] = [c, x];
  else if (h < 240) [gn, bn] = [x, c];
  else if (h < 300) [rn, bn] = [x, c];
  else [rn, bn] = [c, x];
  const to = (n: number) =>
    Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${to(rn)}${to(gn)}${to(bn)}`;
}

/* ── Aplicação das variáveis globais ── */

function setThemeVars(p: string, pl: string, pd: string): void {
  const root = document.documentElement;
  root.style.setProperty('--primary', p);
  root.style.setProperty('--primary-light', pl);
  root.style.setProperty('--primary-dark', pd);
  root.style.setProperty('--primary-rgb', hexToRgb(p));
  root.style.setProperty('--gradient', `linear-gradient(135deg, ${p}, ${pd})`);
  root.style.setProperty('--shadow', `rgba(${hexToRgb(p)}, 0.3)`);
}

/** Aplica um hex como cor ativa (sem persistir). */
export function applyThemeColor(hex: string): void {
  const n = normalizeHex(hex);
  if (!n) return;
  const { pl, pd } = deriveTones(n);
  setThemeVars(n, pl, pd);
}

/** Aplica as cores EXATAS de um preset (sem persistir). */
export function applyPresetColors(id: string): void {
  const preset = THEME_PRESETS.find((x) => x.id === id);
  if (!preset) {
    const fallback = APP_THEMES.purple;
    setThemeVars(fallback.p, fallback.pl, fallback.pd);
    return;
  }
  setThemeVars(preset.p, preset.pl, preset.pd);
}

/** Aplica um preset e grava `academia_theme`. */
export function applyThemePreset(id: string): void {
  const preset = THEME_PRESETS.find((x) => x.id === id);
  applyPresetColors(id);
  writeLS('academia_theme', preset ? preset.id : 'purple');
}

/** Aplica um hex personalizado e grava as duas chaves de persistência. */
export function applyCustomTheme(hex: string): void {
  const n = normalizeHex(hex);
  if (!n) return;
  applyThemeColor(n);
  writeLS('academia_theme', CUSTOM_THEME_ID);
  writeLS(THEME_HEX_KEY, n);
}

/** Boot do app (App.tsx): restaura a última cor aplicada. */
export function applySavedTheme(): void {
  const key = readLS('academia_theme') || 'purple';
  if (key === CUSTOM_THEME_ID) {
    const hex = normalizeHex(readLS(THEME_HEX_KEY) || '') || DEFAULT_HEX;
    applyThemeColor(hex);
    return;
  }
  applyPresetColors(key);
}

/** Hex da cor ativa hoje (preset → p; custom → hex salvo). */
export function activeThemeHex(themeKey: string, customHex: string): string {
  if (themeKey === CUSTOM_THEME_ID) return normalizeHex(customHex) || DEFAULT_HEX;
  const preset = THEME_PRESETS.find((x) => x.id === themeKey);
  return preset ? preset.p : DEFAULT_HEX;
}

/** Nome exibido no badge (preset → nome; custom → 'Customizado'). */
export function themeDisplayName(themeKey: string): string {
  if (themeKey === CUSTOM_THEME_ID) return 'Customizado';
  const preset = THEME_PRESETS.find((x) => x.id === themeKey);
  return preset ? preset.name : 'Roxo';
}
