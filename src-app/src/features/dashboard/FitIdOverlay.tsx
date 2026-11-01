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
  avatarFrame?: string | null;
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
  avatarFrame,
  xp,
  streak,
  history,
}) => {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* v4.66.0 — só números reais: XP, nível (mesma curva do perfil) e
     quantidade de dias com treino registrado. */
  const workouts = history && typeof history === 'object' ? Object.keys(history).length : 0;
  const profile = {
    username: name || 'Atleta',
    xp: xp ?? 0,
    level: Math.max(1, Math.floor((xp ?? 0) / 100) + 1),
    streak: streak ?? 0,
    workouts,
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
          <SupercellIdStandalone isOpen={open} onClose={onClose} profile={profile} avatarUrl={avatarUrl} avatarFrame={avatarFrame} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FitIdOverlay;