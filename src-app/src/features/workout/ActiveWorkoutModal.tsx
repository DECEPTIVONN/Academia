/**
 * ActiveWorkoutModal.tsx — Interface de Treino em Andamento
 * Permite marcar séries/exercícios concluídos, acionar timer de descanso com bip/vibração,
 * acumular XP de maestria e salvar a sessão no IndexedDB / Supabase.
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, X, Trophy, Timer, SkipForward } from 'lucide-react';
import { useWorkoutStore } from '@/store/workout-store';
import { useUserStore } from '@/store/user-store';
import { DEFAULT_EXERCISES } from '@/core/db/default-data';
import { upsertHistory } from '@/core/db/idb';

interface ActiveWorkoutModalProps {
  onClose: () => void;
}

export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({ onClose }) => {
  const {
    isActive,
    sheetKey,
    startTime,
    completedExerciseIds,
    toggleExerciseCheck,
    isResting,
    restTimeRemaining,
    startRestTimer,
    tickRestTimer,
    skipRestTimer,
    finishWorkout,
  } = useWorkoutStore();

  const { addXP, recordWorkout } = useUserStore();

  // Decrementar timer de descanso
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isResting && restTimeRemaining > 0) {
      interval = setInterval(() => {
        tickRestTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimeRemaining, tickRestTimer]);

  if (!isActive || !sheetKey) return null;

  const exercises = DEFAULT_EXERCISES;
  const progressPercent = Math.round((completedExerciseIds.length / exercises.length) * 100);

  const handleFinish = async () => {
    const durationMin = startTime ? Math.max(1, Math.round((Date.now() - startTime) / 60000)) : 30;
    const xpGained = completedExerciseIds.length * 20 + 50;

    // Salva no banco de dados offline
    await upsertHistory({
      userId: 'user-local',
      date: new Date().toISOString().split('T')[0],
      sheetKey: sheetKey,
      completed: true,
      checks: completedExerciseIds,
      durationMin: durationMin,
      createdAt: new Date().toISOString(),
    });

    // Atualiza estado global do usuário (XP e Streak)
    addXP(xpGained);
    recordWorkout();

    finishWorkout();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col justify-between p-4 max-w-md mx-auto text-white overflow-hidden"
      >
        {/* Header da Sessão */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
              EM EXECUÇÃO
            </span>
            <h2 className="text-xl font-black text-white mt-1">Treino {sheetKey}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progresso do Treino */}
        <div className="my-2">
          <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
            <span>Progresso do Treino</span>
            <span className="text-emerald-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Modal de Timer de Descanso (Overlay flutuante) */}
        {isResting && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-4 my-2 rounded-2xl bg-gradient-to-br from-purple-950 to-indigo-950 border border-purple-500/40 flex items-center justify-between shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-600/30 border border-purple-400/30 text-purple-300">
                <Timer className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-mono text-purple-300 uppercase">Descanso em Andamento</div>
                <div className="text-2xl font-mono font-black text-white">{restTimeRemaining}s</div>
              </div>
            </div>

            <button
              onClick={skipRestTimer}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 text-xs font-mono font-bold text-white border border-purple-400/40"
            >
              <SkipForward className="w-4 h-4" />
              Pular
            </button>
          </motion.div>
        )}

        {/* Lista de Exercícios para Check */}
        <div className="flex-1 overflow-y-auto no-scrollbar my-2 flex flex-col gap-2.5">
          {exercises.map((exercise) => {
            const isChecked = completedExerciseIds.includes(exercise.id);

            return (
              <div
                key={exercise.id}
                onClick={() => {
                  toggleExerciseCheck(exercise.id);
                  if (!isChecked) {
                    startRestTimer(exercise.rest);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isChecked
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-gray-300'
                    : 'bg-gray-900/60 border-gray-800 text-white hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isChecked ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-600 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className={`font-bold text-sm ${isChecked ? 'line-through text-emerald-300/70' : 'text-white'}`}>
                      {exercise.name}
                    </h4>
                    <span className="text-xs font-mono text-gray-400">
                      {exercise.sets}x {exercise.reps} • {exercise.load}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono text-purple-400 bg-purple-950/50 px-2 py-1 rounded-md border border-purple-800/40">
                  {exercise.rest}s
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer com Ação de Conclusão */}
        <div className="pt-3 border-t border-gray-800 flex gap-3">
          <button
            onClick={handleFinish}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Trophy className="w-5 h-5 fill-emerald-950" />
            Concluir Treino
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
