/**
 * screen-defaults.ts — imagens padrão das telas de carregamento e de bloqueio.
 *
 * Regra do produto (2026-10-27):
 *   • mobile / retrato  → LoadingVertical.png (art 1024×1536);
 *   • desktop / paisagem → LoadingHorizontal.png (art 1536×1024).
 *
 * As imagens vivem em `src-app/src/assets/` e entram no bundle via import
 * (Vite gera a URL final). A splash do `index.html` usa as mesmas imagens por
 * meio de `<img>` ocultos (ver o script inline de boot).
 *
 * v4.70.0 — a personalização de imagens saiu do produto: as telas de bloqueio
 * e de carregamento usam SEMPRE esta arte padrão (`contain` sobre fundo preto,
 * sem cortar nem ampliar o personagem). Valores antigos de `mbc_*` são
 * ignorados e não há mais upload/URL/preset de fundo.
 */

import loadingVertical from '@/assets/LoadingVertical.png';
import loadingHorizontal from '@/assets/LoadingHorizontal.png';

export const DEFAULT_LOADING_VERTICAL = loadingVertical;
export const DEFAULT_LOADING_HORIZONTAL = loadingHorizontal;

/** URL da imagem padrão conforme a orientação atual. */
export function defaultScreenImage(portrait: boolean): string {
  return portrait ? DEFAULT_LOADING_VERTICAL : DEFAULT_LOADING_HORIZONTAL;
}

/**
 * Estilo de fundo para uma tela de carregamento/bloqueio.
 *
 * A arte padrão usa `contain` sobre preto para não cortar/ampliar o personagem
 * — o fundo da própria arte já é preto, então as faixas se fundem com a imagem.
 */
export function screenBackgroundStyle(image: string | null | undefined) {
  if (!image) return undefined;
  return {
    backgroundImage: `url("${image}")`,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#000',
  } as const;
}
