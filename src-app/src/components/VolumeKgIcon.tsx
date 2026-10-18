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
 * v4.33.0 — as letras "KG" foram REFEITAS: no tamanho do widget (22px) o
 * desenho antigo virava um borrão (o anel do G tinha contra-forma menor que
 * 1px). Agora têm corpo maior, traço mais pesado e contra-forma aberta.
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

/* "KG" em traço — o vazado do prato. v4.33.0: as letras estavam ilegíveis em
   22px (o arco do G tinha contra-forma de ~0,5px e virava um borrão). Foram
   refeitas maiores e mais pesadas, dentro do trapézio do prato:
     • corpo da letra 135 (y 290→425) e traço 42 (≈1,9px renderizado);
     • G geométrico clássico (o do logo do Google): anel de raio 52 (≈6,3px de
       diâmetro) ABERTO no alto à direita (arco de 46° a -6°) com barra
       horizontal no meio indo do anel até o centro — a versão anterior (boca
       larga a ±32° + barra baixa) virava um "C com um risco" no tamanho real;
     • K com haste centrada e dois braços simétricos;
     • folga de 26 entre as letras (K 124→216 · G 242→388) e o conjunto
       centralizado no eixo do prato (centro 256). */
const LETTER_STROKE = 42;
const LETTER_PATHS = [
  'M 145 290 V 425', // K · haste
  'M 145 357 L 195 290', // K · braço superior
  'M 145 357 L 195 425', // K · braço inferior
  'M 351.1 319.6 A 52 52 0 1 0 366.7 362.4', // G · anel (aberto no alto à direita)
  'M 366.7 357 H 315', // G · barra horizontal do anel até o centro
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
