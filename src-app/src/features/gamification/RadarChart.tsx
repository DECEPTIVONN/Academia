/**
 * RadarChart.tsx — Container do Radar Fit (Fase 3)
 * Emite exatamente o DOM legado: `#<containerId>` com o HTML de
 * `buildRadarSvgHtml` (radar-wrapper + svg) e dispara `fadeIn` a cada troca,
 * como `renderRadarChart` (secao-progresso.js L803–837).
 */

import { useEffect, useRef, type CSSProperties } from 'react';
import { useLocalData } from '@/hooks/useLocalData';
import { fadeIn } from '@/lib/animations';
import { useRadarFit } from './useRadarFit';

interface RadarChartProps {
  containerId: string;
  gradientId: string;
  className?: string;
  style?: CSSProperties;
}

export function RadarChart({ containerId, gradientId, className, style }: RadarChartProps) {
  const data = useLocalData();
  const { html } = useRadarFit(data, gradientId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fadeIn(ref.current);
  }, [html]);

  return (
    <div
      id={containerId}
      className={className}
      style={style}
      ref={ref}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
