/**
 * radar.ts — Radar Fit (port 1:1 de JS/treino/secao-progresso.js L770–1092)
 *
 * Fase 3 (gamificação). Fórmulas literais do legado:
 *   computeRadarStats → buildRadarSvgHtml → applyRadarSideEffects → getArchetypeBadge.
 * O modo compartilhado ('mensal'|'total') vive em useRadarFit.ts (store zustand),
 * espelhando `currentRadarMode` + `rerenderAllRadarInstances` do legado (a troca
 * de modo re-arma os efeitos colaterais, como no flag `radarSideEffectsApplied`).
 */

import { getProfileState, saveProfileState } from '@/core/db/idb';
import { patchLegacyState } from '@/core/db/legacy-state';
import { todayLabel } from '@/core/db/queries';
import type { LocalData } from '@/core/db/queries';
import type { ProfileConquista, SheetKey } from '@/core/db/schema';

export type RadarMode = 'mensal' | 'total';

export interface RadarStats {
  forca: number;
  resistencia: number;
  velocidade: number;
  flexibilidade: number;
  equilibrio: number;
  potencia: number;
}

export interface ArchetypeBadge {
  icon: string;
  name: string;
  color: string;
}

/** Entrada de `legacy.historico` (cópia bruta; espelha o shape da v3.5.7). */
interface LegacyHistEntry {
  concluido?: boolean;
  treino?: string;
  treinos?: string[];
  duracaoFoco?: number;
}

/** Letras treinadas no dia (`treinos[]`; fallback `treino`/`sheetKey`). */
function treinosDoDia(
  completedKeys: string[] | undefined,
  sheetKey: SheetKey | null
): string[] {
  return completedKeys ?? (sheetKey ? [sheetKey] : []);
}

/* ── 1. Cálculo dos atributos (secao-progresso.js L839–946) ── */

export function computeRadarStats(data: LocalData, mode: RadarMode): RadarStats {
  const stats: RadarStats = {
    forca: 0,
    resistencia: 0,
    velocidade: 0,
    flexibilidade: 0,
    equilibrio: 0,
    potencia: 0,
  };

  const exMap = new Map(data.exercises.map((ex) => [ex.id, ex]));
  const sheetMap = new Map(data.sheets.map((s) => [s.sheetKey, s]));
  const histMap = new Map(data.history.map((h) => [h.date, h]));
  const legacyHist = (data.legacy?.historico ?? {}) as Record<string, LegacyHistEntry>;

  const allCompleted = data.history
    .filter((h) => h.completed)
    .map((h) => h.date)
    .sort()
    .reverse();
  const completedDates = mode === 'mensal' ? allCompleted.slice(0, 30) : allCompleted;

  let totalVol = 0;
  let totalReps = 0;
  let totalExCount = 0;
  const gruposVistos = new Set<string>();
  let equilibrioCount = 0;
  let potenciaCount = 0;
  let cardioMins = 0;

  completedDates.forEach((date) => {
    const hist = histMap.get(date);
    if (!hist) return;

    treinosDoDia(hist.completedKeys, hist.sheetKey).forEach((treino) => {
      const sheet = sheetMap.get(treino as SheetKey);
      const tempo = sheet?.aerobic?.tempo;
      if (tempo) cardioMins += parseInt(tempo) || 0;

      const ids = sheet?.exerciseIds ?? [];
      ids.forEach((id) => {
        const ex = exMap.get(id);
        if (!ex) return;
        totalExCount++;
        const s = parseInt(String(ex.sets)) || 0;
        const r = parseInt(String(ex.reps)) || 0;
        const c =
          parseFloat(String(ex.load).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

        totalVol += s * r * c * (ex.porLado ? 2 : 1);
        totalReps += s * r;
        gruposVistos.add(ex.muscleGroup);

        const tags = (ex.tags ?? []) as string[];
        if (tags.includes('Unilateral') || tags.includes('Livre') || tags.includes('Mobilidade'))
          equilibrioCount++;
        if (
          tags.includes('Explosão') ||
          (tags.includes('Multiarticular') && ex.muscleGroup === 'Pernas')
        )
          potenciaCount++;
      });
    });
  });

  const cargaMediaPerRep = totalReps > 0 ? totalVol / totalReps : 0;
  stats.forca = Math.min(100, (cargaMediaPerRep / 25) * 100);

  const repsMedia = totalExCount > 0 ? totalReps / totalExCount : 0;
  const cardioBonus = (cardioMins / (completedDates.length || 1)) * 2;
  stats.resistencia = Math.min(100, (repsMedia / 35) * 100 + cardioBonus);

  stats.flexibilidade = Math.min(100, (gruposVistos.size / 7) * 100);

  stats.equilibrio = Math.min(100, (equilibrioCount / (totalExCount || 1)) * 2 * 100);

  stats.potencia = Math.min(100, (potenciaCount / (totalExCount || 1)) * 2.5 * 100);

  // Constância (INTENSIDADE): mensal = treinos nos últimos 30 dias; total = média/mês
  let constanciaScore = 0;
  if (mode === 'mensal') {
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    const treinosUltimos30Dias = allCompleted.filter(
      (d) => new Date(d + 'T12:00:00') >= trintaDiasAtras
    ).length;
    constanciaScore = Math.min(50, (treinosUltimos30Dias / 20) * 50);
  } else if (allCompleted.length > 0) {
    const start = new Date(allCompleted[allCompleted.length - 1] + 'T12:00:00');
    const end = new Date(allCompleted[0] + 'T12:00:00');
    const monthsActive = Math.max(
      1,
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const avgWorkoutsPerMonth = allCompleted.length / monthsActive;
    constanciaScore = Math.min(50, (avgWorkoutsPerMonth / 20) * 50);
  }

  // Intensidade no Modo Foco (legado: `historico[date].duracaoFoco`;
  // React novo: `focusMin` em WorkoutHistory)
  let totalSeriesFoco = 0;
  let totalTempoFoco = 0;
  completedDates.forEach((date) => {
    const hist = histMap.get(date);
    if (!hist) return;
    const focoMin = hist.focusMin ?? legacyHist[date]?.duracaoFoco;
    if (focoMin) {
      totalTempoFoco += focoMin;
      treinosDoDia(hist.completedKeys, hist.sheetKey).forEach((t) => {
        const sheet = sheetMap.get(t as SheetKey);
        for (const id of sheet?.exerciseIds ?? []) {
          const ex = exMap.get(id);
          if (ex) totalSeriesFoco += parseInt(String(ex.sets)) || 0;
        }
      });
    }
  });

  let intensidadeFoco = 0;
  if (totalSeriesFoco > 0 && totalTempoFoco > 0) {
    const minPorSerie = totalTempoFoco / totalSeriesFoco;
    intensidadeFoco = Math.max(0, Math.min(50, ((3.0 - minPorSerie) / 1.5) * 50));
  } else {
    intensidadeFoco = 25;
  }

  stats.velocidade = constanciaScore + intensidadeFoco;

  return stats;
}

/* ── 2. Efeitos colaterais: conquistas r_* + tier (L948–977) ── */

let sideEffectsArmed = true;

/** Re-arma os efeitos (legado: `rerenderAllRadarInstances` zera o flag). */
export function armRadarSideEffects(): void {
  sideEffectsArmed = true;
}

/** Consome o flag (legado: `if (!radarSideEffectsApplied)`). */
export function consumeRadarSideEffects(): boolean {
  if (!sideEffectsArmed) return false;
  sideEffectsArmed = false;
  return true;
}

export async function applyRadarSideEffects(
  data: LocalData,
  stats: RadarStats
): Promise<void> {
  try {
    const profile = await getProfileState();
    if (!profile) return;

    const conquistas: ProfileConquista[] = [...(profile.conquistas ?? [])];
    let conquistasChanged = false;

    const checkAchievement = (id: string, icon: string, titulo: string, desc: string) => {
      if (!conquistas.find((c) => (typeof c === 'object' && c ? c.id === id : c === id))) {
        conquistas.push({ id, icon, titulo, desc, data: todayLabel() });
        conquistasChanged = true;
      }
    };

    if (stats.forca >= 90)
      checkAchievement('r_ogro', '🦍', 'Força de Ogro', 'Atingiu 90+ de Força no Radar Fit.');
    if (stats.resistencia >= 90)
      checkAchievement('r_pulmao', '🫁', 'Pulmão de Aço', 'Atingiu 90+ de Resistência no Radar Fit.');
    if (stats.flexibilidade >= 90)
      checkAchievement('r_davinci', '🎨', 'O Simétrico', 'Atingiu 90+ de Simetria no Radar Fit.');
    if (stats.equilibrio >= 90)
      checkAchievement('r_ninja', '🥷', 'Mestre Ninja', 'Atingiu 90+ de Equilíbrio no Radar Fit.');
    if (stats.potencia >= 90)
      checkAchievement('r_foguete', '🚀', 'Modo Foguete', 'Atingiu 90+ de Potência no Radar Fit.');
    if (stats.velocidade >= 90)
      checkAchievement('r_maquina', '⚙️', 'A Máquina', 'Atingiu 90+ de Intensidade no Radar Fit.');

    const allStats = [
      stats.forca,
      stats.resistencia,
      stats.velocidade,
      stats.flexibilidade,
      stats.equilibrio,
      stats.potencia,
    ];
    const tierAtual = data.legacy?.radarTier ?? 1;
    let tierNovo = tierAtual;

    if (allStats.every((s) => s >= 95) && tierAtual < 5) {
      tierNovo = tierAtual + 1;
      const tierNames = ['', '', 'Prata', 'Ouro', 'Diamante', 'Ametista'];
      checkAchievement(
        `r_tier${tierNovo}`,
        '🌟',
        `Radar ${tierNames[tierNovo]}`,
        `Alcançou o Tier ${tierNovo} do Radar Fit.`
      );
    }

    if (conquistasChanged) {
      await saveProfileState({ ...profile, conquistas });
      document.dispatchEvent(new CustomEvent('academia:profile-updated'));
    }
    if (tierNovo !== tierAtual) {
      await patchLegacyState({ radarTier: tierNovo });
    }
  } catch (err) {
    console.warn('[radar] falha ao aplicar efeitos colaterais:', err);
  }
}

/* ── 3. SVG do radar (L979–1049) ── */

export function buildRadarSvgHtml(stats: RadarStats, tier: number, gradientId: string): string {
  const keys: (keyof RadarStats)[] = [
    'forca',
    'resistencia',
    'velocidade',
    'flexibilidade',
    'equilibrio',
    'potencia',
  ];

  const adjustedStats: Record<keyof RadarStats, number> = {
    forca: 0,
    resistencia: 0,
    velocidade: 0,
    flexibilidade: 0,
    equilibrio: 0,
    potencia: 0,
  };
  keys.forEach((k) => {
    adjustedStats[k] = Math.min(100, stats[k] / (tier || 1));
  });

  const size = 300;
  const center = size / 2;
  const radius = size * 0.35;
  const labels = ['FORÇA', 'RESISTÊNCIA', 'INTENSIDADE', 'SIMETRIA', 'EQUILÍBRIO', 'POTÊNCIA'];
  const points: string[] = [];

  keys.forEach((key, i) => {
    const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
    const val = Math.max(10, adjustedStats[key]);
    const x = center + radius * (val / 100) * Math.cos(angle);
    const y = center + radius * (val / 100) * Math.sin(angle);
    points.push(`${x},${y}`);
  });

  let grids = '';
  [0.2, 0.4, 0.6, 0.8, 1].forEach((level) => {
    const gridPoints = keys
      .map((_, i) => {
        const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
        return `${center + radius * level * Math.cos(angle)},${
          center + radius * level * Math.sin(angle)
        }`;
      })
      .join(' ');
    grids += `<polygon points="${gridPoints}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />`;
  });

  let labelsHtml = '';
  keys.forEach((key, i) => {
    const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
    const x = center + (radius + 25) * Math.cos(angle);
    const y = center + (radius + 20) * Math.sin(angle);
    const anchor = x > center ? 'start' : x < center ? 'end' : 'middle';
    labelsHtml += `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="var(--text-tertiary)" font-size="10" font-weight="700" style="letter-spacing:1px;">${labels[i]}</text>`;
    labelsHtml += `<text x="${x}" y="${y + 12}" text-anchor="${anchor}" fill="var(--primary-light)" font-size="12" font-weight="900">${Math.round(adjustedStats[key])}</text>`;
  });

  const tierColors: Record<number, { stroke: string; fill: string; name: string }> = {
    1: { stroke: 'var(--primary-light)', fill: 'var(--primary)', name: 'BRONZE' },
    2: { stroke: '#cbd5e1', fill: '#94a3b8', name: 'PRATA' },
    3: { stroke: '#fde047', fill: '#fbbf24', name: 'OURO' },
    4: { stroke: '#67e8f9', fill: '#06b6d4', name: 'DIAMANTE' },
    5: { stroke: '#d8b4fe', fill: '#a855f7', name: 'AMETISTA' },
  };
  const tierTheme = tierColors[tier] || tierColors[1];

  return `
    <div class="radar-wrapper" style="position:relative;">
      ${
        tier > 1
          ? `<div style="position:absolute; top: -10px; right: 0; background: ${tierTheme.fill}; color: #000; font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; font-weight: 800; letter-spacing: 1px;">TIER ${tier}: ${tierTheme.name}</div>`
          : ''
      }
      <svg viewBox="0 0 ${size} ${size}" style="width:100%; height:auto; overflow:visible;">
        <defs>
          <radialGradient id="${gradientId}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${tierTheme.fill}" stop-opacity="0.2" />
            <stop offset="100%" stop-color="${tierTheme.fill}" stop-opacity="0.6" />
          </radialGradient>
        </defs>
        ${grids}
        ${keys
          .map((_, i) => {
            const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
            return `<line x1="${center}" y1="${center}" x2="${
              center + radius * Math.cos(angle)
            }" y2="${center + radius * Math.sin(angle)}" stroke="rgba(255,255,255,0.05)" stroke-width="1" />`;
          })
          .join('')}
        <polygon points="${points.join(' ')}" fill="url(#${gradientId})" stroke="${
          tierTheme.stroke
        }" stroke-width="2" style="filter: drop-shadow(0 0 8px ${tierTheme.fill}40);" />
        ${labelsHtml}
      </svg>
    </div>
  `;
}

/* ── 4. Badge de arquétipo do Perfil (L1051–1092) ── */

export function getArchetypeBadge(stats: RadarStats, tier: number): ArchetypeBadge {
  const classNames: Record<keyof RadarStats, ArchetypeBadge> = {
    forca: { name: 'Bárbaro', icon: '🪓', color: '#ef4444' },
    resistencia: { name: 'Maratonista', icon: '🫁', color: '#10b981' },
    flexibilidade: { name: 'Monge', icon: '🧘', color: '#0ea5e9' },
    equilibrio: { name: 'Ninja', icon: '🥷', color: '#a855f7' },
    potencia: { name: 'Foguete', icon: '🚀', color: '#f59e0b' },
    velocidade: { name: 'Máquina', icon: '⚙️', color: '#64748b' },
  };

  let maxStat: keyof RadarStats = 'forca';
  let maxVal = -1;
  let minVal = 101;

  const rawStats: RadarStats = {
    forca: stats.forca * tier,
    resistencia: stats.resistencia * tier,
    flexibilidade: stats.flexibilidade * tier,
    equilibrio: stats.equilibrio * tier,
    potencia: stats.potencia * tier,
    velocidade: stats.velocidade * tier,
  };

  (Object.keys(rawStats) as (keyof RadarStats)[]).forEach((k) => {
    if (rawStats[k] > maxVal) {
      maxVal = rawStats[k];
      maxStat = k;
    }
    if (rawStats[k] < minVal) minVal = rawStats[k];
  });

  let archetype = classNames[maxStat];
  if (maxVal - minVal <= 20 && maxVal > 40) {
    archetype = { name: 'Versátil', icon: '⚖️', color: '#8b5cf6' };
  } else if (maxVal < 20) {
    archetype = { name: 'Novato', icon: '🌱', color: '#22c55e' };
  }
  return archetype;
}
