/**
 * volume-line-chart.ts — Port de `renderVolumeLineChart` (secao-progresso.js L679–768)
 * SVG manual de evolução de volume: gradiente `#volAreaGrad`, linha de média,
 * pontos (pico/último destacados), labels de valor/data e estado vazio.
 * Gerado como string de HTML e injetado no `#volDetChartContainer` (como o legado).
 */

export interface VolumePoint {
  /** YYYY-MM-DD */
  data: string;
  valor: number;
}

function formatT(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace('.0', '')}T`;
  return `${Math.round(kg)}kg`;
}

export function buildVolumeLineChartSvg(
  history: VolumePoint[],
  width: number,
  height: number
): string {
  const padding = 20;

  if (!history || history.length < 2) {
    return `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-tertiary); font-size: 0.8rem; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; padding: 20px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" style="margin-bottom: 8px; color: var(--text-tertiary);">
          <path d="M3 3v18h18"/>
          <path d="m19 9-5 5-4-4-3 3"/>
      </svg>
      <span>Dados insuficientes para evolução.</span>
    </div>`;
  }

  const vals = history.map((h) => h.valor);
  const maxVal = Math.max(...vals, 1);

  const points = history.map((h, i) => {
    const x = padding + (i / (history.length - 1)) * (width - padding * 2);
    const y = height - padding - (h.valor / maxVal) * (height - padding * 2);
    return { x, y, valor: h.valor };
  });

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${
    points[0].x
  } ${height - padding} Z`;

  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const avgY = height - padding - (avg / maxVal) * (height - padding * 2);

  return `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; overflow:visible;">
      <defs>
        <linearGradient id="volAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3" />
          <stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Grid Horizontal -->
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${
        height - padding
      }" stroke="rgba(255,255,255,0.1)" />
      <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="4" />

      <!-- Grid Vertical para cada ponto -->
      ${points
        .map(
          (p) => `
        <line x1="${p.x}" y1="${padding}" x2="${p.x}" y2="${
            height - padding
          }" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2" />
      `
        )
        .join('')}

      <!-- Linha de Média -->
      <line x1="${padding}" y1="${avgY}" x2="${width - padding}" y2="${avgY}" stroke="var(--primary-light)" stroke-dasharray="4" stroke-opacity="0.3" />
      <text x="${width - padding + 5}" y="${
        avgY + 3
      }" fill="var(--primary-light)" font-size="10" opacity="0.5">Média</text>

      <!-- Área -->
      <path d="${areaD}" fill="url(#volAreaGrad)" />

      <!-- Linha Principal -->
      <path d="${pathD}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Pontos e Tooltips -->
      ${points
        .map((p, i) => {
          const isPeak = p.valor === maxVal;
          const isLast = i === points.length - 1;
          const radius = isPeak || isLast ? 4.5 : 3;
          const dateObj = new Date(`${history[i].data}T12:00:00`);
          const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
          const showDate =
            i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2);

          return `
          <g>
            <circle cx="${p.x}" cy="${p.y}" r="${radius}" fill="${
              isPeak ? 'var(--primary)' : '#111827'
            }" stroke="var(--primary)" stroke-width="1.5" style="cursor:pointer;">
              <title>${formatT(p.valor)} em ${history[i].data}</title>
            </circle>
            ${
              isPeak || isLast
                ? `
              <text x="${p.x}" y="${p.y - 10}" fill="var(--text-secondary)" font-size="10" text-anchor="middle" font-weight="bold">${formatT(
                    p.valor
                  )}</text>
            `
                : ''
            }
            ${
              showDate
                ? `
              <text x="${p.x}" y="${
                    height - padding + 15
                  }" fill="var(--text-tertiary)" font-size="9" text-anchor="middle">${dateStr}</text>
            `
                : ''
            }
          </g>
        `;
        })
        .join('')}
    </svg>
  `;
}
