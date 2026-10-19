/**
 * MissionsOverlay.tsx — Overlay de Missões (redesenhado)
 *
 * Agora reutiliza o componente `MissoesRecompensasModal` (portado de
 * `MissoesRecompensasStandalone.tsx`), que contém o design/estilo completo
 * (Passe Royale, missões diárias/semanais com baús, etc.), mantendo o padrão
 * de portal para document.body e o lock de scroll do body do app.
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import MissoesRecompensasStandalone from './MissoesRecompensasModal';

const toBody = (node: React.ReactNode) => createPortal(node, document.body);

interface MissionsOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function MissionsOverlay({ open, onClose }: MissionsOverlayProps) {
  /* Lock de scroll do body enquanto aberto (padrão dos overlays do app). */
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return toBody(<MissoesRecompensasStandalone isOpen={open} onClose={onClose} />);
}

export default MissionsOverlay;