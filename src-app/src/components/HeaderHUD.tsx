/**
 * HeaderHUD.tsx — Barra de status gamificada do topo (HUD)
 * Exibe Nível, Barra de XP estilo Clash Royale, Streak de Dias, Ícone de Sincronização e Perfil.
 */

import React from 'react';
import { motion } from 'motion/react';
import { Flame, Wifi, WifiOff, RefreshCw, User as UserIcon, Shield } from 'lucide-react';
import { useUserStore } from '@/store/user-store';
import { useAuth } from '@/core/auth/use-auth';

interface HeaderHUDProps {
  isOnline?: boolean;
  isSyncing?: boolean;
  onOpenProfile?: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  isOnline = true,
  isSyncing = false,
  onOpenProfile,
}) => {
  const { name, xp, level, streakDays, avatarUrl } = useUserStore();
  const { user } = useAuth();

  // Cálculo de XP relativo ao nível atual (0 a 100)
  const xpInCurrentLevel = xp % 100;
  const progressPercent = Math.min(100, Math.max(0, xpInCurrentLevel));

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[var(--color-hud-bg)] border-b border-[var(--color-hud-border)] shadow-lg px-4 py-2 text-white">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        
        {/* Nível e Progresso de XP */}
        <div className="flex items-center gap-3 flex-1">
          {/* Badge de Nível (Inspirado no Clash Royale) */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 border-2 border-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] font-extrabold text-amber-950 font-mono text-lg"
          >
            <Shield className="absolute w-8 h-8 text-amber-300/30" />
            <span className="relative z-10">{level}</span>
          </motion.div>

          {/* Barra de XP */}
          <div className="flex-1 max-w-[200px]">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-300 mb-1 font-mono">
              <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">Nível {level}</span>
              <span>{xpInCurrentLevel}/100 XP</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-gray-800/80 border border-gray-700/50 overflow-hidden relative p-[1px]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
          </div>
        </div>

        {/* Informações da Direita: Streak, Online Status e Avatar */}
        <div className="flex items-center gap-3">
          {/* Streak Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono font-bold text-xs">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
            <span>{streakDays}d</span>
          </div>

          {/* Status de Conexão / Sync */}
          <div className="flex items-center text-xs font-mono">
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
            ) : isOnline ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-rose-400" />
            )}
          </div>

          {/* Avatar do Usuário */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenProfile}
            className="relative w-9 h-9 rounded-full border-2 border-purple-500/50 overflow-hidden bg-purple-900/40 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {avatarUrl || user?.user_metadata?.avatar_url ? (
              <img
                src={avatarUrl || user?.user_metadata?.avatar_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-5 h-5 text-purple-300" />
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
};
