/**
 * FitIdOverlay.tsx — Tela de identidade "Fit ID"
 *
 * Redesenhada para usar o design de SupercellIdStandalone.tsx, com
 * animação de entrada/saída via AnimatePresence.
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import SupercellIdStandalone from './SupercellIdModal';

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
  avatarUrl,
  xp,
  streak,
}) => {
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
    <AnimatePresence>
      {open && (
        <motion.div
          key="fitid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <SupercellIdStandalone isOpen={open} onClose={onClose} profile={profile} avatarUrl={avatarUrl} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FitIdOverlay;