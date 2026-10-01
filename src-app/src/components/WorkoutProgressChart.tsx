/**
 * WorkoutProgressChart.tsx — Gráfico de Evolução de Carga / Volume
 * Renderizado com Recharts — Suporta Volume Total e Carga Máxima por Exercício.
 */

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export interface ChartDataPoint {
  date: string;
  volume: number;
  maxWeight?: number;
}

interface WorkoutProgressChartProps {
  data: ChartDataPoint[];
  title?: string;
  metricLabel?: string;
}

export const WorkoutProgressChart: React.FC<WorkoutProgressChartProps> = ({
  data,
  title = 'Evolução de Volume Total (kg)',
  metricLabel = 'Volume (kg)',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-900/40 rounded-2xl border border-gray-800 text-gray-500 font-mono text-xs text-center">
        <p>Nenhum histórico registrado ainda.</p>
        <p className="mt-1 text-gray-600">Conclua treinos para visualizar seu progresso em gráficos.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gray-900/60 border border-purple-500/20 p-4 backdrop-blur-md shadow-xl">
      <h3 className="text-sm font-bold text-gray-200 mb-4 font-sans tracking-wide flex items-center justify-between">
        <span>{title}</span>
        <span className="text-xs font-mono text-purple-400 font-normal">
          Últimos {data.length} treinos
        </span>
      </h3>

      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />

            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#4b5563' }}
            />

            <YAxis
              stroke="#9ca3af"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#4b5563' }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                borderColor: '#6b21a8',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              }}
              formatter={(value: any) => [`${value} kg`, metricLabel]}
              labelFormatter={(label) => `Data: ${label}`}
            />

            <Area
              type="monotone"
              dataKey="volume"
              stroke="#a855f7"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorVolume)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
