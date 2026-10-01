/**
 * HistoryFeature.tsx — Visualizador de Histórico e Gráficos de Treino
 * Exibe lista de treinos concluídos, métricas e o gráfico Recharts de volume/frequência.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { History as HistoryIcon, Calendar, Trophy, Flame } from 'lucide-react';
import { WorkoutProgressChart, type ChartDataPoint } from '@/components/WorkoutProgressChart';
import { getRecentHistory } from '@/core/db/idb';
import type { WorkoutHistory } from '@/core/db/schema';

export const HistoryFeature: React.FC = () => {
  const [historyLogs, setHistoryLogs] = useState<WorkoutHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carrega histórico dos últimos 30 dias
    getRecentHistory('user-local', 30).then((logs) => {
      setHistoryLogs(logs);
      setLoading(false);
    });
  }, []);

  // Dados mockados para o gráfico caso não haja logs suficientes ainda
  const chartData: ChartDataPoint[] = historyLogs.length > 0
    ? historyLogs.map((log) => ({
        date: log.date.substring(5), // MM-DD
        volume: (log.checks?.length || 1) * 120, // Estimativa de volume kg
      })).reverse()
    : [
        { date: '25/09', volume: 1200 },
        { date: '26/09', volume: 1450 },
        { date: '28/09', volume: 1600 },
        { date: '29/09', volume: 1500 },
        { date: '01/10', volume: 1850 },
      ];

  return (
    <div className="flex flex-col gap-6 pb-24 max-w-4xl mx-auto px-4 pt-4 text-white">
      {/* Header do Histórico */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-purple-400" />
            Histórico & Evolução
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Acompanhe seu volume de treino e frequência
          </p>
        </div>
      </div>

      {/* Gráfico de Evolução Recharts */}
      <WorkoutProgressChart data={chartData} title="Volume Total Estimado (kg)" />

      {/* Lista de Sessões Concluídas */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider font-mono px-1">
          Últimos Treinos Concluídos
        </h3>

        {historyLogs.length > 0 ? (
          historyLogs.map((log) => (
            <motion.div
              key={log.id || log.date}
              whileHover={{ scale: 1.01 }}
              className="p-4 rounded-2xl bg-gray-900/60 border border-purple-500/20 backdrop-blur-md flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-purple-300">
                  {log.sheetKey || 'A'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Treino {log.sheetKey || 'Concluído'}</h4>
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-purple-400" />
                      {log.date}
                    </span>
                    <span>•</span>
                    <span>{log.durationMin || 45} min</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                <Trophy className="w-3.5 h-3.5" />
                <span>+{(log.checks?.length || 1) * 20 + 50} XP</span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-gray-800 text-center text-gray-500 text-sm font-mono">
            Nenhum treino concluído registrado no histórico local.
          </div>
        )}
      </div>
    </div>
  );
};
