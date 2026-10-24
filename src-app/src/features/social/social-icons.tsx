/**
 * social-icons.tsx — Biblioteca de ícones SVG inline da aba Social
 *
 * Segue `Diretrizes/Ícones.md`: viewBox 0 0 24 24, fill="none",
 * stroke="currentColor", stroke-linecap/linejoin="round", sem cores
 * hardcoded (a cor vem do CSS pai) e SEM emojis de UI (o mockup
 * `Ligas.html` usava 🏆👥🛡️⚔️🎁 — todos substituídos aqui).
 * Paths do guia (troféu, chat, raio, check, cadeado, +, X, lupa);
 * demais no padrão Lucide/Feather indicado no arquivo.
 */

import type { ReactNode, SVGProps } from 'react';

export interface SocialIconProps extends SVGProps<SVGSVGElement> {
  /** Tamanho em px (width/height). Padrão 16 (contexto de botão). */
  size?: number;
}

function Icon({ size = 16, children, ...rest }: SocialIconProps & { children: ReactNode }) {
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

/** Troféu / copo (Ícones.md §7 — mesmo path do mockup). */
export function TrophyIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </Icon>
  );
}

/** Pessoas (Amigos). */
export function UsersIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

/** Escudo (Guilda). */
export function ShieldIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Icon>
  );
}

/** Presente (bônus diário / presentear amigos). */
export function GiftIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </Icon>
  );
}

/** Moedas (Ouro). */
export function CoinsIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </Icon>
  );
}

/** Gema (fragmentos / recompensas). */
export function GemIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3h12l4 6-10 13L2 9Z" />
      <path d="M11 3 8 9l4 13 4-13-3-6" />
      <path d="M2 9h20" />
    </Icon>
  );
}

/** Raio (XP / ação rápida). */
export function ZapIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </Icon>
  );
}

/** Coroa (topo do Caminho das Ligas). */
export function CrownIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <path d="M3 18h18" />
      <path d="M4 18 3 8l5 4 4-8 4 8 5-4-1 10" />
    </Icon>
  );
}

/** Baú (recompensa). */
export function BoxIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <path d="M12 22.08V12" />
    </Icon>
  );
}

/** Espadas (desafiar). */
export function SwordsIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
    </Icon>
  );
}

/** Olho (assistir / espectar). */
export function EyeIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

/** Adicionar (+). */
export function PlusIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </Icon>
  );
}

/** Enviar (chat). */
export function SendIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </Icon>
  );
}

/** Pacote (doação de itens). */
export function PackageIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <path d="M16.5 9.4 7.5 4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </Icon>
  );
}

/** Informações (detalhes da guilda). */
export function InfoIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </Icon>
  );
}

/** Localização (região da guilda). */
export function MapPinIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </Icon>
  );
}

/** Lupa (buscar jogador) — Ícones.md §7. */
export function SearchIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Icon>
  );
}

/** QR Code (convite por código) — Ícones.md §7. */
export function QrCodeIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3z" />
      <path d="M21 14v3" />
      <path d="M14 21h3" />
      <path d="M21 21h.01" />
    </Icon>
  );
}

/** Check (resgatado / concluído) — Ícones.md §7. */
export function CheckIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <polyline points="20 6 9 17 4 12" />
    </Icon>
  );
}

/** Cadeado (bloqueado) — Ícones.md §7. */
export function LockIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Icon>
  );
}

/** Fechar (X) — Ícones.md §7. */
export function XIcon(props: SocialIconProps) {
  return (
    <Icon {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Icon>
  );
}
