/**
 * ExerciseCard.tsx — Card de Exercício Gamificado
 * Apresenta GIF do exercício, séries, repetições, descanso, carga recente e badge de maestria.
 */

import React from 'react';
import { motion } from 'motion/react';
import { Play, Dumbbell, Timer, CheckCircle, Info } from 'lucide-react';
import type { Exercise } from '@/core/db/schema';
import { getTierForXP } from '@/core/db/idb';

interface ExerciseCardProps {
  exercise: Exercise;
  exerciseXP?: number;
  onSelect?: () => void;
  onOpenDetails?: () => void;
  isCompleted?: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  exerciseXP = 0,
  onSelect,
  onOpenDetails,
  isCompleted = false,
}) => {
  const tier = getTierForXP(exerciseXP);

  return (
    <motion.div
      whileHover={{ scale: 1.02, translateY: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative rounded-2xl border p-4 backdrop-blur-md transition-all ${
        isCompleted
          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
          : 'bg-gray-900/60 border-purple-500/20 hover:border-purple-500/50 shadow-lg'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* GIF / Imagem com fallback e badge de maestria */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-800 border border-gray-700/80 flex-shrink-0 flex items-center justify-center">
          {exercise.imageUrl ? (
            <img
              src={exercise.imageUrl}
              alt={exercise.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Dumbbell className="w-8 h-8 text-purple-400/60" />
          )}

          {/* Badge de Nível de Maestria */}
          <div
            className="absolute bottom-0 right-0 px-1 py-0.2 text-[9px] font-bold font-mono rounded-tl-md text-black"
            style={{ backgroundColor: tier.color }}
            title={`Maestria: ${tier.name}`}
          >
            {tier.tier}
          </div>
        </div>

        {/* Informações do Exercício */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-sm text-white truncate font-sans tracking-wide">
              {exercise.name}
            </h4>
            {isCompleted && (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            )}
          </div>

          <p className="text-xs text-purple-300/80 font-medium mb-2">{exercise.muscleGroup}</p>

          {/* Tags de Séries, Reps e Descanso */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-gray-300 font-mono">
            <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/30 text-purple-300">
              {exercise.sets}x
            </span>
            <span className="px-2 py-0.5 rounded-md bg-gray-800/80 border border-gray-700/60 text-gray-200">
              {exercise.reps} reps
            </span>
            <span className="px-2 py-0.5 rounded-md bg-gray-800/80 border border-gray-700/60 text-gray-400 flex items-center gap-1">
              <Timer className="w-3 h-3 text-amber-400" />
              {exercise.rest}s
            </span>
          </div>
        </div>

        {/* Botão de Ação / Detalhes */}
        <div className="flex flex-col gap-1.5">
          {onOpenDetails && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails();
              }}
              className="p-2 rounded-xl bg-gray-800/80 border border-gray-700/60 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              title="Detalhes do Exercício"
            >
              <Info className="w-4 h-4" />
            </button>
          )}

          {onSelect && (
            <button
              onClick={onSelect}
              className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-purple-600/30 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
