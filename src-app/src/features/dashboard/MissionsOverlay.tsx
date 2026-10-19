/**
 * MissionsOverlay.tsx — Overlay de Missões (redesenhado)
 *
 * Reutiliza `MissoesRecompensasModal` (design de MissoesRecompensasStandalone.tsx),
 * com animação de entrada/saída via AnimatePresence.
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import MissoesRecompensasStandalone from './MissoesRecompensasModal';

const toBody = (node: React.ReactNode) => createPortal(node, document.body);

interface MissionsOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function MissionsOverlay({ open, onClose }: MissionsOverlayProps) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return toBody(
    <AnimatePresence>
      {open && (
        <motion.div
          key="missions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <MissoesRecompensasStandalone isOpen={open} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MissionsOverlay;