/**
 * VolumeKgIcon.tsx — ícone do widget "VOLUME MÉDIO DE CARGA" (v4.32.0)
 *
 * Recriação do ícone da imagem de referência enviada pelo usuário: um PRATO DE
 * PESO (anilha) preto com a alça no topo e o texto "KG" vazado no meio.
 *
 * Exceção consciente ao guia de ícones (Diretrizes/Ícones.md §8): aqui a forma
 * é SILHUETA preenchida, não stroke — a imagem de referência é um pictograma
 * sólido e um contorno não reproduziria o desenho. Duas adaptações:
 *   • a referência é preta sobre branco; no app o fundo do widget é escuro,
 *     então o prato usa `currentColor` (branco) e as letras são VAZADAS via
 *     <mask> (aparece o fundo do widget no lugar das letras — mesmo efeito de
 *     silhueta do original);
 *   • "KG" é desenhado com paths (traço), não <text>: o desenho não depende de
 *     fonte carregada e escala igual em qualquer tamanho.
 *
 * Usado no rodapé do deck (prévia do Início, seletor de fichas e "Minha Ficha").
 */

import React, { useId } from 'react';

/* Geo no grid 512×512: alça no topo + prato trapezoidal (com cantos
   arredondados) ocupando quase toda a largura, como na referência. */
const PLATE_PATH =
  'M 186 176 H 326 C 340 176 350 182 354 192 L 496 448 C 502 462 494 470 480 470 ' +
  'H 32 C 18 470 10 462 16 448 L 158 192 C 162 182 172 176 186 176 Z';
const HANDLE_PATH = 'M 218 84 H 294 A 12 12 0 0 1 306 96 V 190 H 206 V 96 A 12 12 0 0 1 218 84 Z';

/* "KG" em traço (38) com pontas arredondadas — o vazado do prato. Espaçamento
   entre K e G proposital: em 22px (rodapé) duas letras coladas viram um borrão
   (ver o zoom do rodapé em verify/probe da v4.32.0). */
const LETTER_STROKE = 38;
const LETTER_PATHS = [
  'M 150 250 V 400', // K · haste
  'M 150 325 L 198 250', // K · braço superior
  'M 150 325 L 198 400', // K · braço inferior
  'M 360.1 303 A 44 44 0 1 0 360.1 347', // G · arco (boca à direita)
  'M 360.1 347 H 305', // G · barra central entrando na boca
];

interface VolumeKgIconProps {
  /** Lado do ícone em px (padrão 22 — rodapé do deck, guia §3). */
  size?: number;
  className?: string;
}

export const VolumeKgIcon: React.FC<VolumeKgIconProps> = ({ size = 22, className }) => {
  /* id único: o ícone aparece 2× na página (prévia + modal seletor) */
  const maskId = `volumeKg-${useId().replace(/:/g, '')}`;

  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
          {/* branco = prato visível · preto = letras vazadas */}
          <path d={PLATE_PATH} fill="#fff" />
          <path d={HANDLE_PATH} fill="#fff" />
          <g fill="none" stroke="#000" strokeWidth={LETTER_STROKE} strokeLinecap="round" strokeLinejoin="round">
            {LETTER_PATHS.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </mask>
      </defs>

      <path d={`${PLATE_PATH} ${HANDLE_PATH}`} fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
};

export default VolumeKgIcon;
