/**
 * ColecaoModals.tsx — #modalColecaoExercicios + #modalMaestriaEx (Fase 3)
 * Ports 1:1 de `openColecaoExercicios` (secao-treinos.js L877–931),
 * `openMaestriaExercicio` (L933–1021), `showRoyaleTooltip` (L1023–1068) e do
 * DOM `componentes/secoes/modais.html` L791–827 e L857–911.
 *
 * Obs.: `#modalMaestriaGeral` (openMaestriaGeral) não é portado aqui — sua
 * única entrada legada é o footer da tela Treinos (`#btnMaestriaGeral` em
 * treinos.html:263), cujo footer ainda não existe no SheetsFeature (Fase 4).
 */

import { useMemo, useRef } from 'react';
import { useLocalData } from '@/hooks/useLocalData';
import {
  MAESTRIA_CHALLENGES,
  computeMasteryTotals,
  getMaestriaState,
} from './maestria';
import { useMaestriaUi } from './maestria-ui';

/* Classe CSS por grupo muscular (secao-treinos.js L886–894) */
const GROUP_CLASS: Record<string, string> = {
  Peito: 'peito',
  Costas: 'costas',
  Ombros: 'ombros',
  Pernas: 'pernas',
  Bíceps: 'biceps',
  Tríceps: 'triceps',
  Core: 'core',
};

const PLACEHOLDER_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11"/><circle cx="4" cy="12" r="1.5"/><circle cx="20" cy="12" r="1.5"/></svg>`;

const REWARD_STAR_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

/** showRoyaleTooltip (secao-treinos.js L1023–1068) — tooltip imperativo no body. */
function showRoyaleTooltip(
  event: React.MouseEvent<HTMLElement>,
  _title: string,
  desc: string,
  progress: string
): void {
  event.stopPropagation();
  document.querySelector('.royale-tooltip')?.remove();

  const row = event.currentTarget;
  const tooltip = document.createElement('div');
  tooltip.className = 'royale-tooltip';

  const currentStep = parseInt(progress.split('/')[0], 10) || 1;
  tooltip.innerHTML = `
    <div class="rt-progress">Progresso da tarefa: ${progress}</div>
    <div class="rt-desc">${desc}</div>
    <div class="rt-reward-box" style="display:flex; align-items:center; gap:4px;">
      <span class="rt-gem" style="display:inline-flex; align-items:center; color:#06b6d4;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <path d="M6 3h12l4 6-10 12L2 9z"/>
              <path d="M11 3 8 9l4 12 4-12-3-6"/>
              <path d="M2 9h20"/>
          </svg>
      </span>
      <span class="rt-val">+${currentStep * 5} PTS</span>
    </div>
    <div class="rt-arrow"></div>
  `;

  document.body.appendChild(tooltip);

  const rect = row.getBoundingClientRect();
  tooltip.style.left = `${rect.left + rect.width / 2}px`;
  tooltip.style.top = `${rect.top - 5}px`;

  const closeTip = (e: MouseEvent) => {
    if (!tooltip.contains(e.target as Node)) {
      tooltip.remove();
      document.removeEventListener('mousedown', closeTip);
    }
  };
  window.setTimeout(() => document.addEventListener('mousedown', closeTip), 10);
}

export function ColecaoModals() {
  const { exercises, legacy } = useLocalData();
  const {
    colecaoOpen,
    maestriaExId,
    search,
    closeColecao,
    openMaestriaEx,
    closeMaestriaEx,
    backToColecao,
    setSearch,
  } = useMaestriaUi();

  const totals = useMemo(
    () => computeMasteryTotals(exercises, legacy),
    [exercises, legacy]
  );

  const term = search.trim().toLowerCase();
  const visible = term
    ? exercises.filter((ex) => ex.name.toLowerCase().includes(term))
    : exercises;

  /* Mantém o último id/ex/state para permitir transição de saída suave. */
  const lastIdRef = useRef(maestriaExId);
  if (maestriaExId) lastIdRef.current = maestriaExId;
  const displayId = maestriaExId ?? lastIdRef.current;

  const exRaw = displayId ? exercises.find((e) => e.id === displayId) : undefined;
  const stateRaw = displayId ? getMaestriaState(legacy, displayId) : null;

  const lastExRef = useRef(exRaw);
  const lastStateRef = useRef(stateRaw);
  if (exRaw) lastExRef.current = exRaw;
  if (stateRaw) lastStateRef.current = stateRaw;
  const ex = (exRaw ?? lastExRef.current)!;
  const state = (stateRaw ?? lastStateRef.current)!;

  const isOpen = maestriaExId !== null;
  const tiers = ['none', 'bronze', 'prata', 'ouro'] as const;

  return (
    <>
      {/* ===== MODAL: COLEÇÃO DE EXERCÍCIOS (modais.html L791–827) ===== */}
      <div
        className="modal-overlay"
        id="modalColecaoExercicios"
        style={{
          display: 'flex',
          opacity: colecaoOpen ? 1 : 0,
          visibility: colecaoOpen ? 'visible' : 'hidden',
          pointerEvents: colecaoOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s ease, visibility 0.2s ease',
        }}
      >
          <div className="colecao-full-container">
            <div className="colecao-header-main">
              <div className="colecao-title-side">
                <h2>MINHA COLEÇÃO</h2>
              </div>
              <div className="colecao-actions-side">
                <div className="colecao-search-box">
                  <input
                    type="text"
                    id="colecaoSearch"
                    placeholder="Filtrar exercícios..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="colecao-count-box" id="colecaoCount">
                  {exercises.length}/{exercises.length}
                </div>
                <button
                  type="button"
                  className="colecao-close-btn"
                  id="btnFecharColecao"
                  aria-label="Fechar"
                  onClick={closeColecao}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* updateGlobalMasteryUI (secao-treinos.js L794–822) */}
            <div className="colecao-athletic-stats">
              <div className="athletic-level-info">
                <span className="athletic-rank-label" id="athleticRank">
                  {totals.rank.title}
                </span>
                <span className="athletic-level-val" id="athleticLevel">
                  Maestria Nível {totals.rank.level}
                </span>
              </div>
              <div className="athletic-progress-container">
                <div className="athletic-progress-bar">
                  <div
                    className="athletic-progress-fill"
                    id="athleticProgress"
                    style={{ width: `${totals.pct}%` }}
                  />
                  <div className="athletic-shine" />
                </div>
                <span className="athletic-xp-text" id="athleticXP">
                  {totals.totalXP} / {totals.rank.next} PTS
                </span>
              </div>
            </div>

            <div className="colecao-grid-scroll">
              <div className="colecao-grid-fidelity" id="colecaoGrid">
                {visible.map((e) => {
                  const groupClass = GROUP_CLASS[e.muscleGroup] ?? 'default';
                  return (
                    <div
                      key={e.id}
                      className={`colecao-card group-${groupClass}`}
                      data-id={e.id}
                      data-name={e.name}
                      onClick={() => openMaestriaEx(e.id)}
                    >
                      <div className="card-group-header">
                        <span>{e.muscleGroup}</span>
                      </div>
                      <div className="card-media-box">
                        {e.imageUrl ? (
                          <img src={e.imageUrl} alt={e.name} />
                        ) : (
                          <div
                            className="colecao-item-ph"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            dangerouslySetInnerHTML={{ __html: PLACEHOLDER_SVG }}
                          />
                        )}
                      </div>
                      <div className="card-footer-box">
                        <h4 className="card-name">{e.name}</h4>
                        <span className="card-series">{e.sets || 3} séries</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      {/* ===== MODAL: MAESTRIA INDIVIDUAL (modais.html L857–911) ===== */}
      {displayId && ex && state && (
        <div
          className="modal-overlay"
          id="modalMaestriaEx"
          style={{
            display: 'flex',
            opacity: isOpen ? 1 : 0,
            visibility: isOpen ? 'visible' : 'hidden',
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'opacity 0.2s ease, visibility 0.2s ease',
          }}
        >
          <div className="maestria-ex-container">
            {/* Decoração superior (Ícone Elite Premium) */}
            <div className="maestria-ex-top-decor">
              <div className="royale-mastery-icon">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L4 5V11C4 16.19 7.41 21.05 12 22.5C16.59 21.05 20 16.19 20 11V5L12 2Z"
                    fill="url(#gradGold)"
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                  />
                  <path d="M12 7L13.25 9.75L16 11L13.25 12.25L12 15L10.75 12.25L8 11L10.75 9.75L12 7Z" fill="white">
                    <animateTransform
                      attributeName="transform"
                      type="scale"
                      values="1;1.2;1"
                      dur="2s"
                      repeatCount="indefinite"
                      additive="sum"
                    />
                  </path>
                  <defs>
                    <linearGradient
                      id="gradGold"
                      x1="4"
                      y1="2"
                      x2="20"
                      y2="22.5"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Banner Principal */}
            <div className="maestria-ex-header">
              <h2>Maestria de Exercícios</h2>
              <button
                type="button"
                className="modal-close-btn-royale"
                id="btnFecharMaestriaEx"
                aria-label="Fechar"
                onClick={closeMaestriaEx}
              >
                ✕
              </button>
            </div>

            <div className="maestria-ex-body">
              {/* Badge e Estrelas (L938–960) */}
              <div className="maestria-ex-badge-area" id="maestriaExBadgeArea">
                <div className={`royale-badge-shield badge-tier-${tiers[state.badgeLevel]}`}>
                  <div className="shield-inner">
                    {ex.imageUrl ? (
                      <img src={ex.imageUrl} alt={ex.name} />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        width={32}
                        height={32}
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11" />
                        <circle cx="4" cy="12" r="1.5" />
                        <circle cx="20" cy="12" r="1.5" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="mx-badge-stars">
                  {[0, 1, 2].map((i) => {
                    const lit = i < state.badgeLevel;
                    return (
                      <span
                        className={`mx-star ${lit ? 'lit' : ''}`}
                        key={i}
                        style={{ display: 'inline-flex' }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill={lit ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          width={18}
                          height={18}
                          style={{ color: lit ? '#fbbf24' : 'var(--text-tertiary)' }}
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Desafios (L962–1019) */}
              <div className="maestria-ex-challenges" id="maestriaExChallenges">
                {MAESTRIA_CHALLENGES.map((ch, tierIdx) => {
                  const prevTierDone = tierIdx === 0 || state.challenges[tierIdx - 1].completed;
                  const isLocked = !prevTierDone;
                  const isCompleted = state.challenges[tierIdx].completed;
                  const tierClass = `tier-${ch.badge}`;

                  if (isCompleted) {
                    return (
                      <div className={`royale-task-row ${tierClass} completed`} key={ch.id}>
                        <div className="task-icon" dangerouslySetInnerHTML={{ __html: ch.icon }} />
                        <div className="task-info">
                          <div className="task-status-text">Concluído</div>
                        </div>
                        <div className="task-check">✓</div>
                      </div>
                    );
                  }

                  if (isLocked) {
                    return (
                      <div className="royale-task-row locked" key={ch.id}>
                        <div
                          className="task-lock-icon"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            width={16}
                            height={16}
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </div>
                      </div>
                    );
                  }

                  const currentSub =
                    ch.subDesafios.find((s) => state.totalSessoes < s.target) ??
                    ch.subDesafios[2];
                  const pct = Math.min(100, (state.totalSessoes / currentSub.target) * 100);
                  const subIndex = ch.subDesafios.indexOf(currentSub);
                  const nextLevel = subIndex + 1;

                  return (
                    <div
                      className={`royale-task-row ${tierClass} active`}
                      key={ch.id}
                      onClick={(e) =>
                        showRoyaleTooltip(e, currentSub.label, currentSub.desc, `${nextLevel}/3`)
                      }
                    >
                      <div className="task-icon" dangerouslySetInnerHTML={{ __html: ch.icon }} />
                      <div className="task-info">
                        <div className="task-title">{currentSub.label}</div>
                        <div className="task-progress-wrap">
                          <div className="task-progress-bar">
                            <div className="task-progress-fill" style={{ width: `${pct}%` }} />
                            <div className="task-progress-text">
                              {state.totalSessoes}/{currentSub.target}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        className="task-reward"
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      >
                        <div
                          className="reward-icon"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fbbf24',
                          }}
                          dangerouslySetInnerHTML={{ __html: REWARD_STAR_SVG }}
                        />
                        <div className="reward-val">{nextLevel}</div>
                      </div>
                      <div className="task-level-tabs">
                        <div className={`level-tab ${nextLevel >= 3 ? 'active' : ''}`}>3</div>
                        <div className={`level-tab ${nextLevel >= 2 ? 'active' : ''}`}>2</div>
                        <div className={`level-tab ${nextLevel >= 1 ? 'active' : ''}`}>1</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer (modais.html L894–909) */}
            <div className="maestria-ex-footer">
              <button
                type="button"
                className="footer-shield-arrow"
                title="Ver Coleção"
                onClick={backToColecao}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4ade80',
                  transition: 'transform .25s ease',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="5" width="14" height="17" rx="2" />
                  <path d="M6 2h12a2 2 0 0 1 2 2v14" />
                </svg>
              </button>
              <p>
                Cada tarefa de domínio completada garante uma melhoria no emblema de domínio!
              </p>
              <div
                className="footer-info-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width={16}
                  height={16}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
