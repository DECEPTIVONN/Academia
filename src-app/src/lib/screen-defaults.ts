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
 * v4.56.20 — a arte padrão é uma ilustração com fundo PRETO e recorte próprio:
 * exibi-la com `background-size: cover` cortava o personagem (e no retrato
 * chegava a ampliar ~3× em telas 20:9). O padrão da arte usa `contain` sobre
 * fundo preto — nada é cortado nem ampliado em nenhuma proporção. Imagens
 * personalizadas pelo usuário (mbc_loading_*) continuam em `cover`, por serem
 * fotos/wallpapers de tela cheia.
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
 * `custom` = imagem personalizada do usuário (cover, tela cheia).
 * Sem imagem personalizada, a arte padrão usa `contain` sobre preto para não
 * cortar/ampliar o personagem — o fundo da própria arte já é preto, então as
 * faixas laterais/superiores se fundem com a imagem.
 */
export function screenBackgroundStyle(image: string | null | undefined, custom: boolean) {
  if (!image) return undefined;
  return {
    backgroundImage: `url("${image}")`,
    backgroundSize: custom ? 'cover' : 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#000',
  } as const;
}
