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
        <path d="M12 2.4l7.2 2.7v6c0 4.6-3 8-7.2 10.4-4.2-2.4-7.2-5.8-7.2-10.4v-6z" />
        <circle cx="12" cy="11.1" r="1.5" />
        <path d="M9.2 16.7a2.8 2.8 0 015.6 0" />
        <circle cx="7.6" cy="10" r="1.15" />
        <path d="M5.9 15.5a1.7 1.7 0 013.4 0" />
        <circle cx="16.4" cy="10" r="1.15" />
        <path d="M14.7 15.5a1.7 1.7 0 013.4 0" />
      </svg>
    ),
  },
  {
    id: 'treinos',
    label: 'Treinos',
    desc: 'Exercícios e montar ficha',
    icon: (
      <svg {...svgProps}>
        <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11" />
        <circle cx="4" cy="12" r="1.5" />
        <circle cx="20" cy="12" r="1.5" />
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
