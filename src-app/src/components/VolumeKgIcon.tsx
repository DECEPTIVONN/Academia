/**
 * VolumeKgIcon.tsx — ícone do widget "VOLUME MÉDIO DE CARGA" (v4.32.0)
 *
 * Recriação do ícone da imagem de referência enviada pelo usuário: um PRATO DE
 * PESO (anilha) com a ALÇA no topo.
 *
 * Exceção consciente ao guia de ícones (Diretrizes/Ícones.md §8): aqui a forma
 * é SILHUETA preenchida, não stroke — a imagem de referência é um pictograma
 * sólido e um contorno não reproduziria o desenho. A referência é preta sobre
 * branco; no app o fundo do widget é escuro, então o prato usa `currentColor`
 * (branco) — mesma silhueta, sem perder a leitura.
 *
 * Histórico das letras "KG":
 *   • v4.32.0/v4.33.0 — as letras eram desenhadas em paths de traço e VAZADAS
 *     por <mask> (o fundo do widget aparecia no lugar delas). Em 22px os dois
 *     desenhos seguiam ilegíveis (o G virava borrão/"C com um risco").
 *   • v4.34.0 — as letras foram REMOVIDAS a pedido do usuário: o ícone é só o
 *     prato com a alça (sem <mask> e sem depender de fonte).
 *
 * Usado no rodapé do deck (prévia do Início, seletor de fichas e "Minha Ficha").
 */

import React from 'react';

/* Geo no grid 512×512: alça no topo + prato trapezoidal (com cantos
   arredondados) ocupando quase toda a largura, como na referência. */
const PLATE_PATH =
  'M 186 176 H 326 C 340 176 350 182 354 192 L 496 448 C 502 462 494 470 480 470 ' +
  'H 32 C 18 470 10 462 16 448 L 158 192 C 162 182 172 176 186 176 Z';
const HANDLE_PATH = 'M 218 84 H 294 A 12 12 0 0 1 306 96 V 190 H 206 V 96 A 12 12 0 0 1 218 84 Z';

interface VolumeKgIconProps {
  /** Lado do ícone em px (padrão 22 — rodapé do deck, guia §3). */
  size?: number;
  className?: string;
}

export const VolumeKgIcon: React.FC<VolumeKgIconProps> = ({ size = 22, className }) => (
  <svg
    className={className}
    viewBox="0 0 512 512"
    width={size}
    height={size}
    aria-hidden="true"
    focusable="false"
  >
    {/* v4.34.0 — sem as letras: uma única silhueta preenchida (prato + alça). */}
    <path d={`${PLATE_PATH} ${HANDLE_PATH}`} fill="currentColor" />
  </svg>
);

export default VolumeKgIcon;
