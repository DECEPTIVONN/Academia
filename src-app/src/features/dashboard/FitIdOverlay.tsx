/**
 * FitIdOverlay.tsx — Tela de identidade "Fit ID"
 *
 * Redesenhada para usar o design/estilo de `SupercellIdStandalone.tsx`
 * (portado em `SupercellIdModal.tsx`), mantendo a mesma interface de props
 * para não quebrar o DashboardFeature.
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SupercellIdModal } from './SupercellIdModal';

const toBody = (node: React.ReactNode) => createPortal(node, document.body);

interface FitIdOverlayProps {
  open: boolean;
  onClose: () => void;
  name: string;
  avatarUrl: string;
  title?: string | null;
  xp: number;
  streak: number;
  sheets: any[];
  exercises: any[];
  history: any;
  onOpenSettings?: () => void;
}

export const FitIdOverlay: React.FC<FitIdOverlayProps> = ({
  open,
  onClose,
  name,
  xp,
  streak,
}) => {
  /* Lock de scroll do body enquanto aberto (padrão dos overlays do app). */
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const profile = {
    username: name || 'Jogador',
    clanName: 'Great Warriors',
    trophies: streak ?? 0,
    gold: 0,
    gems: 0,
    xp: xp ?? 0,
    level: Math.max(1, Math.floor((xp ?? 0) / 100) + 1),
  };

  return toBody(
    <SupercellIdModal isOpen={open} onClose={onClose} profile={profile} />
  );
};

export default FitIdOverlay;