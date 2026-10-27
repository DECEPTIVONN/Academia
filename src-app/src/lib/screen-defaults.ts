/**
 * screen-defaults.ts — imagens padrão das telas de carregamento e de bloqueio.
 *
 * Regra do produto (2026-10-27):
 *   • mobile / retrato  → LoagingVertical.png;
 *   • desktop / paisagem → LoadingHorizontal.png.
 *
 * As imagens vivem em `src-app/src/assets/` e entram no bundle via import
 * (Vite gera a URL final). A splash do `index.html` usa as mesmas imagens por
 * meio de `<img>` ocultos (ver o script inline de boot).
 */

import loadingVertical from '@/assets/LoagingVertical.png';
import loadingHorizontal from '@/assets/LoagingHorizontal.png';

export const DEFAULT_LOADING_VERTICAL = loadingVertical;
export const DEFAULT_LOADING_HORIZONTAL = loadingHorizontal;

/** URL da imagem padrão conforme a orientação atual. */
export function defaultScreenImage(portrait: boolean): string {
  return portrait ? DEFAULT_LOADING_VERTICAL : DEFAULT_LOADING_HORIZONTAL;
}
