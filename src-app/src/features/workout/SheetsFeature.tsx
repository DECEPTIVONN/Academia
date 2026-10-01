/**
 * SheetsFeature.tsx — Visualizador & Selecionador de Fichas de Treino (A–J)
 * Permite trocar de ficha, visualizar exercícios, ver métricas do treino e iniciar o treino ativo.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Plus, Flame, Timer, Activity, Dumbbell } from 'lucide-react';
import type { WorkoutSheet, SheetKey, Exercise } from '@/core/db/schema';
import { DEFAULT_SHEETS, DEFAULT_EXERCISES } from '@/core/db/default-data';
import { ExerciseCard } from '@/components/ExerciseCard';
import { useWorkoutStore } from '@/store/workout-store';

interface SheetsFeatureProps {
  onStartWorkout: (sheetKey: SheetKey) => void;
}

const SHEET_KEYS: SheetKey[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export const SheetsFeature: React.FC<SheetsFeatureProps> = ({ onStartWorkout }) => {
  const [selectedKey, setSelectedKey] = useState<SheetKey>('A');
  const [sheets, setSheets] = useState<WorkoutSheet[]>(DEFAULT_SHEETS);
  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES);

  const activeSheet = sheets.find((s) => s.sheetKey === selectedKey);
  const sheetExercises = exercises.filter((ex) => activeSheet?.exerciseIds.includes(ex.id));

  return (
    <div className="flex flex-col gap-6 pb-24 max-w-4xl mx-auto px-4 pt-4 text-white">
      {/* Seletor de Fichas A–J estilo Tabs Neumórficas / Glassmorphism */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
        {SHEET_KEYS.map((key) => {
          const hasSheet = sheets.some((s) => s.sheetKey === key);
          const isSelected = selectedKey === key;

          return (
            <motion.button
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedKey(key)}
              className={`relative flex-shrink-0 w-12 h-12 rounded-2xl font-mono font-extrabold text-lg flex items-center justify-center border transition-all ${
                isSelected
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                  : hasSheet
                  ? 'bg-gray-900/80 border-gray-700 text-purple-300 hover:border-purple-500/50'
                  : 'bg-gray-900/30 border-gray-800 text-gray-600 hover:text-gray-400'
              }`}
            >
              <span>{key}</span>
              {hasSheet && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-purple-400" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Conteúdo da Ficha Selecionada */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedKey}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-5"
        >
          {/* Header da Ficha */}
          <div className="flex items-center justify-between bg-gray-900/60 border border-purple-500/20 rounded-3xl p-5 backdrop-blur-md shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 font-mono font-bold text-xs uppercase">
                  Ficha {selectedKey}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {sheetExercises.length} exercícios
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1 tracking-tight">
                Treino {selectedKey}
              </h2>
            </div>

            {/* Botão de Iniciar Treino */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStartWorkout(selectedKey)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-emerald-950 font-extrabold shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
            >
              <Play className="w-5 h-5 fill-emerald-950" />
              <span className="font-sans text-sm tracking-wide uppercase">Iniciar</span>
            </motion.button>
          </div>

          {/* Configuração Aeróbica da Ficha */}
          {activeSheet?.aerobic && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span className="font-bold">Aeróbico:</span>
                <span>{activeSheet.aerobic.tipo} ({activeSheet.aerobic.vel})</span>
              </div>
              <div className="flex items-center gap-1 text-indigo-300">
                <Timer className="w-3.5 h-3.5" />
                <span>{activeSheet.aerobic.tempo}</span>
              </div>
            </div>
          )}

          {/* Lista de Exercícios da Ficha */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider font-mono flex items-center justify-between px-1">
              <span>Exercícios</span>
              <span className="text-xs text-purple-400 font-normal">
                Toque no card para ver detalhes
              </span>
            </h3>

            {sheetExercises.length > 0 ? (
              sheetExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onSelect={() => onStartWorkout(selectedKey)}
                />
              ))
            ) : (
              <div className="p-8 rounded-2xl border border-dashed border-gray-800 text-center text-gray-500 text-sm">
                Nenhum exercício cadastrado nesta ficha.
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
