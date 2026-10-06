/**
 * useRadarFit.ts — Store do modo do Radar + hook de render (Fase 3)
 * Espelha `currentRadarMode` + `rerenderAllRadarInstances` (secao-progresso.js
 * L770–801): a troca MENSAL/TOTAL é global (Dashboard e Progresso mostram o
 * mesmo modo) e re-arma os efeitos colaterais (conquistas/tier).
 */

import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import type { LocalData } from '@/core/db/queries';
import {
  applyRadarSideEffects,
  armRadarSideEffects,
  buildRadarSvgHtml,
  computeRadarStats,
  consumeRadarSideEffects,
  type RadarMode,
} from './radar';

interface RadarModeState {
  mode: RadarMode;
  setMode: (mode: RadarMode) => void;
}

export const useRadarMode = create<RadarModeState>((set, get) => ({
  mode: 'mensal',
  setMode: (mode) => {
    if (get().mode === mode) return;
    armRadarSideEffects(); // legado: rerenderAllRadarInstances zera o flag
    set({ mode });
  },
}));

export interface UseRadarFitResult {
  mode: RadarMode;
  setMode: (mode: RadarMode) => void;
  html: string;
  tier: number;
}

/** Stats + HTML do radar + aplicação única dos efeitos colaterais por modo. */
export function useRadarFit(data: LocalData, gradientId: string): UseRadarFitResult {
  const mode = useRadarMode((s) => s.mode);
  const setMode = useRadarMode((s) => s.setMode);
  const tier = data.legacy?.radarTier ?? 1;

  const stats = useMemo(() => computeRadarStats(data, mode), [data, mode]);
  const html = useMemo(
    () => buildRadarSvgHtml(stats, tier, gradientId),
    [stats, tier, gradientId]
  );

  useEffect(() => {
    if (!consumeRadarSideEffects()) return;
    void applyRadarSideEffects(data, stats);
  }, [data, stats, mode]);

  return { mode, setMode, html, tier };
}
