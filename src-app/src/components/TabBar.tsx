/**
 * TabBar.tsx — Barra de navegação inferior estilo Mobile App
 * Permite alternar entre Fichas de Treino, Modo Execução de Treino, Histórico e Perfil.
 */

import React from 'react';
import { motion } from 'motion/react';
import { Dumbbell, PlayCircle, History, Trophy, User } from 'lucide-react';

export type TabType = 'sheets' | 'workout' | 'history' | 'mastery' | 'profile';

interface TabBarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isWorkoutActive?: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onSelectTab,
  isWorkoutActive = false,
}) => {
  const tabs = [
    { id: 'sheets', label: 'Fichas', icon: Dumbbell },
    {
      id: 'workout',
      label: isWorkoutActive ? 'Em Treino' : 'Treinar',
      icon: PlayCircle,
      highlight: isWorkoutActive,
    },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'mastery', label: 'Maestria', icon: Trophy },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-hud-bg)]/95 backdrop-blur-lg border-t border-[var(--color-hud-border)] px-2 py-1.5 text-white">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as TabType)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
                isActive ? 'text-purple-400 font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {/* Highlight animado para tab ativa */}
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-purple-500/15 rounded-xl border border-purple-500/30"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              {/* Botão de treino ativo pulsante */}
              {tab.highlight ? (
                <div className="relative">
                  <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping" />
                  <Icon className="w-6 h-6 text-emerald-400 relative z-10" />
                </div>
              ) : (
                <Icon className="w-5 h-5 mb-0.5 relative z-10" />
              )}

              <span className="text-[10px] font-medium tracking-tight relative z-10">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
