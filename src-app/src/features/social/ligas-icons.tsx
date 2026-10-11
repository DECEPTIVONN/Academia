/**
 * ligas-icons.tsx — Glifos SVG de dados da aba Social (port de Ligas.tsx)
 *
 * Substitui emojis de dados (avatar, bandeira, troféu de divisão) por SVG
 * stroke, conforme `Diretrizes/Ícones.md`. Cores via `currentColor`/classes
 * do pai; nada de hex hardcoded nos paths de UI.
 */

import type { SVGProps } from 'react';
import type { AvatarGlyphKey, DivisionIconKind, FlagKey } from './ligas-data';

export interface LigasIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function Icon({ size = 16, children, ...rest }: LigasIconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ── Avatares (substituem emoji de animal/personagem) ── */

const AVATAR_PATHS: Record<AvatarGlyphKey, React.ReactNode> = {
  crown: (
    <>
      <path d="M3 18h18" />
      <path d="M4 18 3 8l5 4 4-8 4 8 5-4-1 10" />
    </>
  ),
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  flame: (
    <>
      <path d="M12 22c4 0 7-2.5 7-6.5 0-3-2-5.5-3.5-7C14 6.5 13 4 13 2c-2.5 1.5-4 4.5-4 7 0 1.5-1 2-1.5 2S6 11 6 12.5C6 16 8.5 22 12 22z" />
      <path d="M12 22c1.5 0 3-1.5 3-3.5 0-1.5-1-2.5-1.5-3-.5 1-1.5 1.5-2 1.5s-1.5-.5-2-1.5c-.5.5-1.5 1.5-1.5 3 0 2 1.5 3.5 3 3.5z" />
    </>
  ),
  bolt: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  skull: (
    <>
      <circle cx="12" cy="10" r="7" />
      <path d="M8 17v3a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-3" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M12 13v2" />
    </>
  ),
  ghost: (
    <>
      <path d="M12 2a7 7 0 0 0-7 7v11l3-2 2 2 2-2 2 2 2-2 3 2V9a7 7 0 0 0-7-7z" />
      <circle cx="9.5" cy="10" r="1" fill="currentColor" />
      <circle cx="14.5" cy="10" r="1" fill="currentColor" />
    </>
  ),
  robot: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M12 4v4" />
      <circle cx="12" cy="3" r="1" />
      <circle cx="9" cy="13" r="1.5" fill="currentColor" />
      <circle cx="15" cy="13" r="1.5" fill="currentColor" />
      <path d="M9 17h6" />
      <path d="M2 13h2" />
      <path d="M20 13h2" />
    </>
  ),
  rocket: (
    <>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </>
  ),
  paw: (
    <>
      <circle cx="11" cy="4" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="20" cy="16" r="2" />
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
    </>
  ),
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </>
  ),
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  sword: (
    <>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
    </>
  ),
  gem: (
    <>
      <path d="M6 3h12l4 6-10 13L2 9Z" />
      <path d="M11 3 8 9l4 13 4-13-3-6" />
      <path d="M2 9h20" />
    </>
  ),
  wolf: (
    <>
      <path d="M12 3 8 6l-2-2-1 5 2 2v3l1 5h8l1-5v-3l2-2-1-5-2 2-4-3z" />
      <circle cx="9.5" cy="11" r="0.8" fill="currentColor" />
      <circle cx="14.5" cy="11" r="0.8" fill="currentColor" />
      <path d="M12 14v2" />
    </>
  ),
  frog: (
    <>
      <circle cx="8" cy="7" r="2.5" />
      <circle cx="16" cy="7" r="2.5" />
      <ellipse cx="12" cy="14" rx="8" ry="6" />
      <circle cx="8" cy="7" r="1" fill="currentColor" />
      <circle cx="16" cy="7" r="1" fill="currentColor" />
      <path d="M9 15c1 1 5 1 6 0" />
    </>
  ),
  alien: (
    <>
      <ellipse cx="12" cy="10" rx="7" ry="8" />
      <ellipse cx="9" cy="10" rx="1.5" ry="2" fill="currentColor" />
      <ellipse cx="15" cy="10" rx="1.5" ry="2" fill="currentColor" />
      <path d="M10 15c1 1 3 1 4 0" />
      <path d="M8 22c1-2 2-3 4-3s3 1 4 3" />
    </>
  ),
  panda: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="7.5" cy="6.5" rx="2.5" ry="3" fill="currentColor" opacity="0.85" />
      <ellipse cx="16.5" cy="6.5" rx="2.5" ry="3" fill="currentColor" opacity="0.85" />
      <ellipse cx="8.5" cy="11.5" rx="2" ry="2.5" fill="currentColor" opacity="0.7" />
      <ellipse cx="15.5" cy="11.5" rx="2" ry="2.5" fill="currentColor" opacity="0.7" />
      <ellipse cx="12" cy="15.5" rx="1.5" ry="1" fill="currentColor" opacity="0.6" />
    </>
  ),
  lion: (
    <>
      <circle cx="12" cy="12" r="6" />
      <path d="M12 2c1 2 1 3 0 4-1-1-1-2 0-4z" />
      <path d="M12 18c1 2 1 3 0 4-1-1-1-2 0-4z" />
      <path d="M2 12c2-1 3-1 4 0-1 1-2 1-4 0z" />
      <path d="M18 12c2-1 3-1 4 0-1 1-2 1-4 0z" />
      <path d="M4.9 4.9c1.8.8 2.5 1.5 2.9 2.9-1.4-.4-2.1-1.1-2.9-2.9z" />
      <path d="M19.1 4.9c-1.8.8-2.5 1.5-2.9 2.9 1.4-.4 2.1-1.1 2.9-2.9z" />
      <path d="M4.9 19.1c1.8-.8 2.5-1.5 2.9-2.9-1.4.4-2.1 1.1-2.9 2.9z" />
      <path d="M19.1 19.1c-1.8-.8-2.5-1.5-2.9-2.9 1.4.4 2.1 1.1 2.9 2.9z" />
      <circle cx="10" cy="11" r="0.8" fill="currentColor" />
      <circle cx="14" cy="11" r="0.8" fill="currentColor" />
      <path d="M11 14h2" />
    </>
  ),
};

export function AvatarGlyph({ glyph, size = 16, className, ...rest }: LigasIconProps & { glyph: AvatarGlyphKey }) {
  return (
    <Icon size={size} className={className} {...rest}>
      {AVATAR_PATHS[glyph]}
    </Icon>
  );
}

/* ── Bandeiras (simplificadas, stroke) ── */

const FLAG_PATHS: Record<FlagKey, React.ReactNode> = {
  BR: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M12 7 6 12l6 5 6-5-6-5z" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  US: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 9h20" />
      <path d="M2 13h20" />
      <path d="M2 17h20" />
      <rect x="2" y="5" width="8" height="6" />
    </>
  ),
  MX: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M9 5v14" />
      <path d="M15 5v14" />
    </>
  ),
  FR: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M9 5v14" />
      <path d="M15 5v14" />
    </>
  ),
  JP: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  AR: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 9.5h20" />
      <path d="M2 14.5h20" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  ES: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M2 15h20" />
    </>
  ),
  IT: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M9 5v14" />
      <path d="M15 5v14" />
    </>
  ),
  CA: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M7 5v14" />
      <path d="M17 5v14" />
      <path d="M12 8l-1 3h2l-1 3 3-4h-2l1-2h-2l1-2-1 2z" fill="currentColor" stroke="none" />
    </>
  ),
  DE: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 9.67h20" />
      <path d="M2 14.33h20" />
    </>
  ),
  GB: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M3 6l18 12" />
      <path d="M21 6 3 18" />
      <path d="M12 5v14" />
      <path d="M2 12h20" />
    </>
  ),
  CL: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 12h20" />
      <rect x="2" y="5" width="8" height="7" />
      <path d="M6 7.5l.5 1.5h1.5l-1 1 .5 1.5-1.5-1-1.5 1 .5-1.5-1-1H5.5L6 7.5z" fill="currentColor" stroke="none" />
    </>
  ),
};

export function FlagIcon({ flag, size = 14, className, ...rest }: LigasIconProps & { flag: FlagKey }) {
  return (
    <Icon size={size} className={className} {...rest}>
      {FLAG_PATHS[flag]}
    </Icon>
  );
}

/* ── Troféus / gemas de divisão (substituem 🏆🥈🥇💎❤️) ── */

const TROPHY_BODY = (
  <>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </>
);

const GEM_BODY = (
  <>
    <path d="M6 3h12l4 6-10 13L2 9Z" />
    <path d="M11 3 8 9l4 13 4-13-3-6" />
    <path d="M2 9h20" />
  </>
);

export function DivisionIcon({
  kind,
  size = 18,
  className,
  ...rest
}: LigasIconProps & { kind: DivisionIconKind }) {
  const isGem = kind.startsWith('gem');
  const tone =
    kind === 'trophy-bronze'
      ? 'text-amber-600'
      : kind === 'trophy-silver'
        ? 'text-slate-300'
        : kind === 'trophy-gold'
          ? 'text-yellow-400'
          : kind === 'gem-cyan'
            ? 'text-cyan-400'
            : 'text-rose-400';
  return (
    <Icon size={size} className={`${tone} ${className ?? ''}`.trim()} {...rest}>
      {isGem ? GEM_BODY : TROPHY_BODY}
    </Icon>
  );
}

/** Wrappers de conveniência usados nos blocos de divisão (tamanho/texto). */
export function DivisionTrophy({ kind, size, className }: { kind: DivisionIconKind; size?: number; className?: string }) {
  return <DivisionIcon kind={kind} size={size} className={className} />;
}
