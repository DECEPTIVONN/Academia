/**
 * nav-section-items.tsx — Itens das 5 seções da navegação (desktop)
 *
 * Separado de nav-items.tsx de propósito: os ícones/constantes utilitárias
 * ficam naquele arquivo e este exporta APENAS a lista de seções, mantendo
 * o Fast Refresh e o lint (react/only-export-components) limpos.
 * Mesmos paths SVG da BottomNav para manter a paridade visual.
 */

import type { ReactNode } from 'react';
import type { SectionType } from '@/components/BottomNav';

export interface NavSectionItem {
  id: SectionType;
  label: string;
  desc: string;
  icon: ReactNode;
}

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: 20,
  height: 20,
} as const;

/* Ordem das abas no desktop (v4.8.2-desktop-nav-grid), de cima para baixo:
   Início → Social → Treinos → Progresso → Loja (Buscar fica como primeiro
   item da nav no DesktopSidebar; a ordem de SWIPE continua SECTIONS_ORDER). */
export const NavSectionItems: NavSectionItem[] = [
  {
    id: 'dashboard',
    label: 'Início',
    desc: 'Dashboard e ficha do dia',
    icon: (
      <svg {...svgProps}>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    id: 'social',
    label: 'Social',
    desc: 'Ligas, amigos e guilda',
    icon: (
      <svg {...svgProps}>
        {/* v4.28.0 — mesmo ícone de "Liga" na aba Social (Swords/Lucide) */}
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
        <line x1="13" y1="19" x2="19" y2="13" />
        <line x1="16" y1="16" x2="20" y2="20" />
        <line x1="19" y1="21" x2="21" y2="19" />
        <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
        <line x1="5" y1="14" x2="9" y2="18" />
        <line x1="7" y1="17" x2="4" y2="20" />
        <line x1="3" y1="19" x2="5" y2="21" />
      </svg>
    ),
  },
  {
    id: 'treinos',
    label: 'Treinos',
    desc: 'Exercícios e minha ficha',
    /* v4.34.0 — mesmos halteres da BottomNav (paridade visual): silhueta
       PREENCHIDA do Font Awesome (solid/dumbbell), cor/estado vêm do `fill`
       (classe side-hud-icon--fill, shell.css). */
    icon: (
      <svg
        {...svgProps}
        viewBox="0 0 640 512"
        fill="currentColor"
        stroke="none"
        strokeWidth={0}
        className="side-hud-icon--fill"
      >
        <path d="M96 64c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32l0 160 0 64 0 160c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-64-32 0c-17.7 0-32-14.3-32-32l0-64c-17.7 0-32-14.3-32-32s14.3-32 32-32l0-64c0-17.7 14.3-32 32-32l32 0 0-64zm448 0l0 64 32 0c17.7 0 32 14.3 32 32l0 64c17.7 0 32 14.3 32 32s-14.3 32-32 32l0 64c0 17.7-14.3 32-32 32l-32 0 0 64c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-160 0-64 0-160c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32zM416 224l0 64-192 0 0-64 192 0z" />
      </svg>
    ),
  },
  {
    id: 'progresso',
    label: 'Progresso',
    desc: 'Histórico, radar e 1RM',
    icon: (
      <svg {...svgProps}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: 'loja',
    label: 'Loja',
    desc: 'Itens, skins e upgrades',
    icon: (
      <svg {...svgProps}>
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
];
