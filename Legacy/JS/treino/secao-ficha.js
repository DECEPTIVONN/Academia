import { fichaDeckCard, fichaGridCard, fichaTableRow, cardioDeckCard } from './templates.js';
import { loadDB, saveDB, today, todayLabel, formatCarga, formatSeconds, determineTreinoDoDia, getTodayTreino, getChecks, getSeriesDone, toggleSeriesSet, toggleCheck, getExById, getStreak, grupoBadgeClass, showToast, currentViewMode, setCurrentViewMode, renderHeroStats, fadeIn, fadeSwap } from './db.js';
import { openEditExercicio, getMaestriaState, trackMaestriaSessoes, openMaestriaExercicio, openAerobicoModal } from './secao-treinos.js';
import { renderProgresso } from './secao-progresso.js';
import { updateEmptyWorkoutButtons } from './nav.js';

// ---- FICHA DO DIA ----
export function renderFicha(db) {
  const treino = getTodayTreino(db);
  const checks = getChecks(db);
  const fichaIds = db.fichas[treino] || [];
  const exercicios = fichaIds.map(id => getExById(db, id)).filter(Boolean);

  // Suggestion banner
  renderFichaSuggestion(db);

  // Header
  const badge = document.getElementById('fichaTreinoBadge');
  const dateEl = document.getElementById('fichaDate');
  if (badge) badge.textContent = 'TREINO ' + treino;
  if (dateEl) dateEl.textContent = todayLabel();

  // Selector buttons (A, B, C...)
  document.querySelectorAll('#tab-ficha .sel-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.treino === treino);
  });

  // View buttons (Table/Grid/Deck)
  const btnTable = document.getElementById('viewBtnTable');
  const btnGrid = document.getElementById('viewBtnGrid');
  const btnDeck = document.getElementById('viewBtnDeck');

  if (btnTable && btnGrid && btnDeck) {
    // Atualiza classes explicitamente
    btnTable.classList.remove('active');
    btnGrid.classList.remove('active');
    btnDeck.classList.remove('active');

    if (currentViewMode === 'table') btnTable.classList.add('active');
    else if (currentViewMode === 'grid') btnGrid.classList.add('active');
    else if (currentViewMode === 'deck') btnDeck.classList.add('active');

    btnTable.onclick = (e) => {
      e.preventDefault();
      const activeContainer = currentViewMode === 'table' ? document.querySelector('.table-scroll-wrap') : (currentViewMode === 'grid' ? document.getElementById('workoutGrid') : document.getElementById('workoutDeck'));
      fadeSwap(activeContainer, () => {
        setCurrentViewMode('table');
        localStorage.setItem('academia_view_mode', 'table');
        renderFicha(db);
      });
    };
    btnGrid.onclick = (e) => {
      e.preventDefault();
      const activeContainer = currentViewMode === 'table' ? document.querySelector('.table-scroll-wrap') : (currentViewMode === 'grid' ? document.getElementById('workoutGrid') : document.getElementById('workoutDeck'));
      fadeSwap(activeContainer, () => {
        setCurrentViewMode('grid');
        localStorage.setItem('academia_view_mode', 'grid');
        renderFicha(db);
      });
    };
    btnDeck.onclick = (e) => {
      e.preventDefault();
      const activeContainer = currentViewMode === 'table' ? document.querySelector('.table-scroll-wrap') : (currentViewMode === 'grid' ? document.getElementById('workoutGrid') : document.getElementById('workoutDeck'));
      fadeSwap(activeContainer, () => {
        setCurrentViewMode('deck');
        localStorage.setItem('academia_view_mode', 'deck');
        renderFicha(db);
      });
    };
  }

  // Atualizar visibilidade dos botões de treinos vazios
  updateEmptyWorkoutButtons(db);

  // Progress
  const ae = db.aerobicos[treino];
  const hasAe = ae && ae.tipo;
  const aeId = 'ae-' + treino;

  const done = checks.filter(c => fichaIds.includes(c)).length + (hasAe && checks.includes(aeId) ? 1 : 0);
  const total = exercicios.length + (hasAe ? 1 : 0);
  document.getElementById('progressDone') && (document.getElementById('progressDone').textContent = done);
  document.getElementById('progressTotal') && (document.getElementById('progressTotal').textContent = total);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const fill = document.getElementById('progressFill');
  if (fill) fill.style.width = pct + '%';

  // Table & Grid containers
  const tbody = document.getElementById('workoutTableBody');
  const tableWrap = document.querySelector('.table-scroll-wrap');
  const gridContainer = document.getElementById('workoutGrid');
  const deckContainer = document.getElementById('workoutDeck');
  const emptyEl = document.getElementById('tableEmpty');

  const hasAnyContent = exercicios.length > 0 || hasAe;

  if (!hasAnyContent) {
    if (tbody) tbody.innerHTML = '';
    if (gridContainer) gridContainer.innerHTML = '';
    if (deckContainer) deckContainer.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    if (tableWrap) tableWrap.style.display = 'none';
    if (gridContainer) gridContainer.style.display = 'none';
    if (deckContainer) deckContainer.style.display = 'none';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  // Visibilidade baseada no modo
  if (tableWrap) tableWrap.style.display = currentViewMode === 'table' ? 'block' : 'none';
  if (gridContainer) gridContainer.style.display = currentViewMode === 'grid' ? 'grid' : 'none';
  if (deckContainer) deckContainer.style.display = currentViewMode === 'deck' ? 'grid' : 'none';

  // Mostrar ações de conclusão se estiver tudo pronto
  const historicoHoje = db.historico[today()] || { treinos: [] };
  const treinosConcluidosHoje = historicoHoje.treinos || [];
  const currentIsDone = treinosConcluidosHoje.includes(treino);
  const isDone = (total > 0 && done === total) || currentIsDone;

  const doneActions = document.getElementById('fichaDoneActions');
  if (doneActions) {
    doneActions.style.display = isDone ? 'block' : 'none';
  }

  // Renderização baseada no modo
  if (currentViewMode === 'deck') {
    if (tableWrap) tableWrap.style.display = 'none';
    if (gridContainer) gridContainer.style.display = 'none';
    if (deckContainer) {
      deckContainer.style.display = 'grid';
      deckContainer.innerHTML = exercicios.map((ex, i) => {
        const checked = checks.includes(ex.id);
        const badgeCls = grupoBadgeClass(ex.grupoMuscular);
        const imgHtml = ex.imagem
          ? `<img src="${ex.imagem}" alt="${ex.nome}" draggable="false" onerror="this.onerror=null; this.outerHTML='<div class=&quot;premium-placeholder&quot;><i class=&quot;fas fa-dumbbell&quot;></i><span>EXERCÍCIO</span></div>';">`
          : `<div class="premium-placeholder"><i class="fas fa-dumbbell"></i><span>EXERCÍCIO</span></div>`;

        const seriesDone = getSeriesDone(db, ex.id);
        const seriesButtons = [];
        for (let s = 0; s < (ex.series || 0); s++) {
          const isSetDone = seriesDone[s] || false;
          seriesButtons.push(`<button class="btn-set ${isSetDone ? 'done' : ''}" data-id="${ex.id}" data-idx="${s}">${s + 1}</button>`);
        }

        return fichaDeckCard(ex, i, checked, badgeCls, imgHtml, seriesButtons);
      }).join('');

      // Adicionar Cardio se existir
      if (hasAe) {
        const checked = checks.includes(aeId);
        deckContainer.innerHTML += cardioDeckCard(ae, aeId, checked, exercicios.length);
      }
      fadeIn(deckContainer);
    }
  } else if (currentViewMode === 'grid') {
    if (tableWrap) tableWrap.style.display = 'none';
    if (deckContainer) deckContainer.style.display = 'none';
    if (gridContainer) {
      gridContainer.style.display = 'grid';
      gridContainer.innerHTML = exercicios.map((ex, i) => {
        const checked = checks.includes(ex.id);
        const badgeCls = grupoBadgeClass(ex.grupoMuscular);
        const imgHtml = ex.imagem
          ? `<img src="${ex.imagem}" alt="${ex.nome}" onerror="this.onerror=null; this.outerHTML='<div class=&quot;premium-placeholder&quot;><i class=&quot;fas fa-dumbbell&quot;></i><span>EXERCÍCIO</span></div>';">`
          : `<div class="premium-placeholder"><i class="fas fa-dumbbell"></i><span>EXERCÍCIO</span></div>`;

        const seriesDone = getSeriesDone(db, ex.id);
        const seriesButtons = [];
        for (let s = 0; s < (ex.series || 0); s++) {
          const isSetDone = seriesDone[s] || false;
          seriesButtons.push(`<button class="btn-set ${isSetDone ? 'done' : ''}" data-id="${ex.id}" data-idx="${s}" title="Série ${s + 1}">${s + 1}</button>`);
        }

        const cargaHtml = ex.carga || (ex.tags && ex.tags.includes('Peso do Corpo')) ? ' | Carga: ' + formatCarga(ex.carga, ex.porLado, ex.tags) : '';
        return fichaGridCard(ex, i, checked, badgeCls, imgHtml, seriesButtons, cargaHtml);
      }).join('');

      if (hasAe) {
        const checked = checks.includes(aeId);
        gridContainer.innerHTML += `
          <div class="ex-card ex-card-aerobico stagger-item ${checked ? 'row-done' : ''}" data-id="${aeId}" style="--item-index: ${exercicios.length}">
            <div class="ae-card-header">
                <div class="ae-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                </div>
                <div class="ae-label">CARDIO</div>
            </div>
            <div class="ex-card-body">
              <div class="ae-card-type">${ae.tipo}</div>
              <div class="ae-card-stats">
                <div class="ae-stat-box">
                    <span class="ae-stat-val">${ae.vel || '--'}</span>
                    <span class="ae-stat-unit">KM/H</span>
                </div>
                <div class="ae-stat-divider"></div>
                <div class="ae-stat-box">
                    <span class="ae-stat-val">${ae.tempo || '--'}</span>
                    <span class="ae-stat-unit">MIN</span>
                </div>
              </div>
              <div class="check-wrap ae-check-wrap">
                <input type="checkbox" class="check-input" id="chk-grid-${aeId}" data-id="${aeId}" ${checked ? 'checked' : ''}>
                <label class="check-label" for="chk-grid-${aeId}"><span class="check-mark">✓</span></label>
                <span class="ae-check-text">CONCLUIR CARDIO</span>
              </div>
            </div>
          </div>
        `;
      }
      fadeIn(gridContainer);
    }
  } else {
    // Modo Tabela
    if (gridContainer) gridContainer.style.display = 'none';
    if (deckContainer) deckContainer.style.display = 'none';
    if (tableWrap) tableWrap.style.display = 'block';
    if (tbody) {
      tbody.innerHTML = exercicios.map((ex, i) => {
        const checked = checks.includes(ex.id);
        const imgHtml = ex.imagem
          ? `<div class="img-placeholder"><img src="${ex.imagem}" alt="${ex.nome}" onerror="this.onerror=null; this.outerHTML='<div class=&quot;premium-placeholder&quot;><i class=&quot;fas fa-dumbbell&quot;></i><span>EXERCÍCIO</span></div>';"></div>`
          : `<div class="img-placeholder"><div class="premium-placeholder"><i class="fas fa-dumbbell"></i><span>EXERCÍCIO</span></div></div>`;
        const badgeCls = grupoBadgeClass(ex.grupoMuscular);

        const seriesDone = getSeriesDone(db, ex.id);
        const seriesButtons = [];
        for (let s = 0; s < (ex.series || 0); s++) {
          const isSetDone = seriesDone[s] || false;
          seriesButtons.push(`<button class="btn-set ${isSetDone ? 'done' : ''}" data-id="${ex.id}" data-idx="${s}" title="Série ${s + 1}">${s + 1}</button>`);
        }

        const cargaHtml = ex.carga || (ex.tags && ex.tags.includes('Peso do Corpo')) ? ' · ' + formatCarga(ex.carga, ex.porLado, ex.tags) : '';
        return fichaTableRow(ex, i, checked, badgeCls, imgHtml, seriesButtons, cargaHtml);
      }).join('');

      if (hasAe) {
        const checked = checks.includes(aeId);
        tbody.innerHTML += `
          <tr class="row-aerobico stagger-item ${checked ? 'row-done' : ''}" data-id="${aeId}" style="--item-index: ${exercicios.length}">
            <td><div class="row-num" style="background: var(--gym-green)">🏃</div></td>
            <td>
                <span class="ae-table-type">${ae.tipo}</span>
                <span class="ae-table-label">AERÓBICO</span>
            </td>
            <td colspan="2">
                <div class="ae-table-stats">
                    <div class="ae-t-stat"><span>Vel:</span> <strong>${ae.vel || '--'} km/h</strong></div>
                    <div class="ae-t-stat"><span>Tempo:</span> <strong>${ae.tempo || '--'} min</strong></div>
                    <button class="btn-edit-ae-ficha" data-treino="${treino}" title="Editar Cardio" style="margin-left: auto; background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 4px;">
                      <span>⚙️</span>
                    </button>
                </div>
            </td>
            <td>
              <div class="ae-progress-pill">
                <div class="ae-progress-fill" style="width: ${checked ? '100%' : '0%'}"></div>
                <span class="ae-progress-text">${checked ? 'CONCLUÍDO' : 'PENDENTE'}</span>
              </div>
            </td>
            <td>
              <div class="check-wrap">
                <input type="checkbox" class="check-input" id="chk-${aeId}" data-id="${aeId}" ${checked ? 'checked' : ''}>
                <label class="check-label" for="chk-${aeId}"><span class="check-mark">✓</span></label>
              </div>
            </td>
          </tr>
        `;
      }
      fadeIn(tableWrap);
    }
  }

  // Attach checkbox events — escopo restrito ao #tab-ficha para evitar colisão
  // com checkboxes de outras abas que também possuem a classe .t-tab.active
  const fichaTab = document.getElementById('tab-ficha');
  const allChecks = fichaTab ? fichaTab.querySelectorAll('.check-input') : [];
  allChecks.forEach(chk => {
    chk.addEventListener('change', () => {
      const currentTreino = getTodayTreino(db);
      const fichaIds2 = db.fichas[currentTreino] || [];
      const hasAe2 = db.aerobicos[currentTreino]?.tipo;
      const aeId2 = 'ae-' + currentTreino;

      // toggleCheck salva no localStorage e retorna o array atualizado
      toggleCheck(db, chk.dataset.id);

      // Captura snapshot imutável dos checks DEPOIS de toggleCheck e ANTES de renderFicha
      // para evitar que re-render modifique a referência antes da comparação
      const currentChecks = [...(getChecks(db))];

      const allDone = fichaIds2.length > 0 &&
        fichaIds2.every(id => currentChecks.includes(id)) &&
        (!hasAe2 || currentChecks.includes(aeId2));

      if (allDone) {
        // Registrar conclusão de forma atômica: concluido + treinos[] juntos
        const t = today();
        if (!db.historico[t]) db.historico[t] = { treino: currentTreino, treinos: [], concluido: false, checks: [] };
        if (!db.historico[t].treinos) db.historico[t].treinos = [];
        if (!db.historico[t].treinos.includes(currentTreino)) {
          db.historico[t].treinos.push(currentTreino);
        }
        db.historico[t].concluido = true;
        saveDB(db);
        renderFicha(db);
        setTimeout(() => {
          renderFicha(db);
          renderHeroStats(db);
          renderProgresso(db);
          showConclusao(db);
        }, 400);
      } else {
        if (db.historico[today()]?.concluido) {
          db.historico[today()].concluido = false;
          saveDB(db);
          renderHeroStats(db);
          renderProgresso(db);
        }
        renderFicha(db);
      }
    });
  });

  // Attach cardio edit events
  document.querySelectorAll('.btn-edit-ae-ficha').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openAerobicoModal(db, btn.dataset.treino);
    };
  });

  // Attach set button events
  document.querySelectorAll('.btn-set').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const exId = btn.dataset.id;
      const setIdx = parseInt(btn.dataset.idx);

      toggleSeriesSet(db, exId, setIdx);

      const currentTreino = getTodayTreino(db);
      const fichaIds2 = db.fichas[currentTreino] || [];
      const hasAe2 = db.aerobicos[currentTreino]?.tipo;
      const aeId2 = 'ae-' + currentTreino;

      const currentChecks = getChecks(db);
      const allDone = fichaIds2.length > 0 &&
        fichaIds2.every(id => currentChecks.includes(id)) &&
        (!hasAe2 || currentChecks.includes(aeId2));

      renderFicha(db);

      if (allDone) {
        // Registrar conclusão de forma atômica: concluido + treinos[] juntos
        const t = today();
        if (!db.historico[t].treinos) db.historico[t].treinos = [];
        if (!db.historico[t].treinos.includes(currentTreino)) {
          db.historico[t].treinos.push(currentTreino);
        }
        db.historico[t].concluido = true;
        saveDB(db);
        setTimeout(() => {
          renderFicha(db);
          renderHeroStats(db);
          renderProgresso(db);
          showConclusao(db);
        }, 400);
      }
    });
  });

  // Eventos para as anotações rápidas
  document.querySelectorAll('.quick-note-input, .quick-note-input-table').forEach(input => {
    input.addEventListener('change', () => {
      const ex = getExById(db, input.dataset.id);
      if (ex) {
        ex.anotacoes = input.value.trim();
        saveDB(db);
      }
    });
  });
}

export function renderFichaSuggestion(db) {
  const el = id => document.getElementById(id);
  const suggestionEl = el('fichaSuggestion');
  const suggestionText = el('suggestionText');
  if (!suggestionEl || !suggestionText) return;

  const hist = db.historico;
  const dates = Object.keys(hist).sort().reverse();

  let lastDate = null;
  let lastTreino = null;

  for (const date of dates) {
    const entry = hist[date];
    const treinos = entry.treinos || (entry.concluido ? [entry.treino] : []);
    if (treinos.length > 0) {
      lastDate = date;
      lastTreino = treinos[treinos.length - 1];
      break;
    }
  }

  if (lastTreino) {
    const d = new Date(lastDate + 'T12:00:00');
    const dateLabel = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const suggestion = determineTreinoDoDia(db);

    suggestionEl.style.display = 'block';
    suggestionText.innerHTML = `Último treino: <strong>${lastTreino}</strong> (${dateLabel}). Hoje sugerimos o <strong>Treino ${suggestion}</strong>.`;
  } else {
    suggestionEl.style.display = 'none';
  }
}

// ---- MODAL CONCLUSÃO ----
export function showConclusao(db) {
  stopGlobalTimer(db);
  const treino = getTodayTreino(db);
  const fichaIds = db.fichas[treino] || [];
  const exercicios = fichaIds.map(id => getExById(db, id)).filter(Boolean);
  const grupos = [...new Set(exercicios.map(e => e.grupoMuscular))];
  const totalSeries = exercicios.reduce((s, e) => s + (e.series || 0), 0);

  // Calcular totais
  const completedDates = Object.keys(db.historico).filter(d => db.historico[d].concluido);
  const totalWorkouts = completedDates.length;
  const streak = getStreak(db);

  let msg = `Você completou todos os ${exercicios.length} exercícios do Treino ${treino}!`;

  if (streak % 7 === 0 && streak > 0) {
    msg += `<br><br><span style="color:var(--gym-green); font-weight:700;">🔥 INCRÍVEL! Você atingiu uma ofensiva de ${streak} dias (Semana Perfeita)!</span>`;
  } else if (totalWorkouts % 5 === 0 && totalWorkouts > 0) {
    msg += `<br><br><span style="color:#a29bfe; font-weight:700;">💪 PARABÉNS! Você já completou ${totalWorkouts} treinos totais no app! Continue firme.</span>`;
  }

  const sub = document.getElementById('conclusaoSub');
  if (sub) sub.innerHTML = msg;

  const stats = document.getElementById('conclusaoStats');
  const duracaoTotal = db.historico[today()]?.duracaoTotal;
  const duracaoHtml = duracaoTotal ? `<div class="c-stat"><div class="c-stat-val">${formatSeconds(duracaoTotal)}</div><div class="c-stat-lbl">Tempo Total</div></div>` : '';

  const totalCarga = exercicios.reduce((sum, ex) => sum + (parseFloat(String(ex.carga).replace(/[^\d.,]/g, '').replace(',', '.')) || 0), 0);
  const avgVol = exercicios.length ? (totalCarga / exercicios.length).toFixed(1) : '0.0';

  if (stats) stats.innerHTML = `
    <div class="c-stat"><div class="c-stat-val">${exercicios.length}</div><div class="c-stat-lbl">Exercícios</div></div>
    <div class="c-stat"><div class="c-stat-val">${totalSeries}</div><div class="c-stat-lbl">Séries Totais</div></div>
    <div class="c-stat"><div class="c-stat-val">${avgVol}</div><div class="c-stat-lbl">Vol. Médio</div></div>
    ${duracaoHtml}
    <div class="c-stat"><div class="c-stat-val">${grupos.length}</div><div class="c-stat-lbl">Grupos</div></div>`;

  // Rastrear sessões de maestria ANTES de limpar os checks
  const checksParaMaestria = (db.historico[today()] && db.historico[today()].checks) ? [...db.historico[today()].checks] : [];
  const fichaExIds = checksParaMaestria.filter(id => !id.startsWith('ae-') && fichaIds.includes(id));
  if (fichaExIds.length > 0) {
    trackMaestriaSessoes(db, fichaExIds);
  }

  // Garantir registro atômico no histórico: treinos[] + concluido + limpar checks
  const t = today();
  if (!db.historico[t]) {
    db.historico[t] = { treino: treino, treinos: [], concluido: true, checks: [], seriesDone: {} };
  }
  if (!db.historico[t].treinos) db.historico[t].treinos = [];
  if (!db.historico[t].treinos.includes(treino)) {
    db.historico[t].treinos.push(treino);
  }
  db.historico[t].concluido = true;
  db.historico[t].checks = [];
  db.historico[t].seriesDone = {}; // Desmarcar todas as séries
  saveDB(db);
  renderFicha(db); // Atualiza a tabela para mostrar os exercícios e séries desmarcados

  // NÃO incrementar currentFichaWorkouts/currentCycleBreakdown manualmente aqui.
  // renderProgresso() os recalcula a partir do histórico real, evitando dupla contagem.
  // Apenas verificar se atingiu 30 treinos no ciclo atual:
  const startDate = db.currentCycleStartDate || today();
  const cycleCount = Object.keys(db.historico)
    .filter(d => db.historico[d].concluido && d >= startDate)
    .length;

  if (cycleCount >= 30) {
    handleCicloCompleto(db);
  }

  launchConfetti();
  openModal('modalConclusao');
}

export function handleCicloCompleto(db) {
  db.cycleEvents[today()] = 'Ciclo Concluído (30 Treinos)';

  const conquistaId = 'conq-ciclo-' + Date.now();
  db.conquistas.push({
    id: conquistaId,
    titulo: 'Mestre da Constância',
    desc: 'Completou um ciclo inteiro de 30 treinos!',
    data: today(),
    icon: '🔱'
  });

  startNewCycle(db, 'Ciclo Concluído');
}

export function startNewCycle(db, reason) {
  // Arquivar ficha atual
  const archive = {
    data: today(),
    reason: reason,
    fichas: JSON.parse(JSON.stringify(db.fichas)),
    aerobicos: JSON.parse(JSON.stringify(db.aerobicos)),
    workoutsDone: db.currentFichaWorkouts || 0,
    breakdown: { ...db.currentCycleBreakdown }
  };
  db.fichasArquivadas.push(archive);

  // Resetar contadores e definir nova data de início
  db.currentFichaWorkouts = 0;
  db.currentCycleBreakdown = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 };
  db.currentCycleStartDate = today();

  if (!db.cycleEvents) db.cycleEvents = {};
  db.cycleEvents[today()] = reason === 'Ciclo Concluído' ? 'Novo Ciclo' : 'Ciclo Alterado Manualmente';

  saveDB(db);

  setTimeout(() => {
    showToast(`🔱 ${reason.toUpperCase()}! Iniciando nova contagem.`, 'success');
  }, 1000);
}

export function launchConfetti() {
  const container = document.getElementById('confettiContainer');
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#8b5cf6', '#22c55e', '#f9ca24', '#fd79a8', '#4ecdc4', '#a29bfe'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left:${Math.random() * 100}%;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration:${1.5 + Math.random() * 2}s;
      animation-delay:${Math.random() * .8}s;
      width:${6 + Math.random() * 8}px;
      height:${6 + Math.random() * 8}px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};`;
    container.appendChild(piece);
  }
}

// ---- MODAL HELPERS ----
export function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
}

export function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.style.display = 'none'; document.body.style.overflow = ''; }
}



// ---- CRONÔMETRO DE DESCANSO ----
export let restTimerInterval = null;
export let restTimeLeft = 0;
export let totalRestTime = 60;

export function getTimerStyle() {
  return localStorage.getItem('timerStyle') || 'radar';
}

export function startRestTimer(seconds) {
  const timerEl = document.getElementById('restTimer');
  const timeDisplay = document.getElementById('rtTime');
  const visualsEl = document.getElementById('rtVisuals');
  if (!timerEl || !timeDisplay || !visualsEl) return;

  // Garantir que seconds seja um número válido
  let s = parseInt(seconds);
  if (isNaN(s) || s <= 0) s = 60;

  clearInterval(restTimerInterval);
  restTimeLeft = s;
  totalRestTime = s;

  const style = getTimerStyle();
  if (style === 'radar') {
    visualsEl.innerHTML = `
      <div class="timer-radar" id="timerRadar">
        <div class="radar-crosshair ch-v"></div>
        <div class="radar-crosshair ch-h"></div>
        <div class="radar-fill"></div>
      </div>`;
  } else if (style === 'hourglass') {
    visualsEl.innerHTML = `
      <div class="timer-hourglass">
        <svg viewBox="0 0 100 120">
          <defs>
            <filter id="red-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="fluid-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ef4444"/>
              <stop offset="100%" stop-color="#b91c1c"/>
            </linearGradient>
          </defs>
          <!-- Caps -->
          <line x1="5" y1="8" x2="95" y2="8" stroke="#ef4444" stroke-width="2" filter="url(#red-glow)" />
          <line x1="5" y1="112" x2="95" y2="112" stroke="#ef4444" stroke-width="2" filter="url(#red-glow)" />
          <!-- Wireframe -->
          <polygon points="15,8 85,8 53,55 53,65 85,112 15,112 47,65 47,55" fill="none" stroke="#ef4444" stroke-width="1.5" filter="url(#red-glow)"/>
          <!-- Fills -->
          <g style="clip-path: inset(0% 0 0 0); transition: clip-path 1s linear;" id="hgTopClip">
            <polygon points="15,8 85,8 53,55 47,55" fill="url(#fluid-grad)" opacity="0.9" filter="url(#red-glow)"/>
          </g>
          <g style="clip-path: inset(100% 0 0 0); transition: clip-path 1s linear;" id="hgBotClip">
            <polygon points="53,65 85,112 15,112 47,65" fill="url(#fluid-grad)" opacity="0.9" filter="url(#red-glow)"/>
          </g>
          <!-- Falling sand -->
          <line x1="50" y1="55" x2="50" y2="112" stroke="#ef4444" stroke-width="1" opacity="0.6" filter="url(#red-glow)"/>
        </svg>
      </div>`;
  } else if (style === 'cyber') {
    visualsEl.innerHTML = `
      <div class="timer-cyber" style="width:100%;height:100%;position:relative;display:flex;align-items:center;justify-content:center;">
        <svg viewBox="0 0 100 100" style="width:120%;height:120%;overflow:visible;">
          <defs>
            <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#06b6d4" />
              <stop offset="100%" stop-color="#7c3aed" />
            </linearGradient>
            <filter id="cyberGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(6,182,212,0.2)" stroke-width="2" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#cyberGrad)" stroke-width="4" stroke-dasharray="283" stroke-dashoffset="0" id="cyberRing" style="transition: stroke-dashoffset 1s linear; transform: rotate(-90deg); transform-origin: 50% 50%; filter: url(#cyberGlow);" stroke-linecap="round"/>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#7c3aed" stroke-width="1" stroke-dasharray="4 8" opacity="0.5" />
        </svg>
      </div>`;
  } else if (style === 'arcade') {
    visualsEl.innerHTML = `
      <div class="timer-arcade" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:0 10px;">
        <div style="width:100%;height:24px;background:#1e1e24;border:3px solid #facc15;border-radius:4px;overflow:hidden;box-shadow:0 0 10px rgba(250,204,21,0.3);position:relative;">
          <div id="arcadeBar" style="width:100%;height:100%;background:#facc15;transition:width 1s linear, background-color 0.5s;"></div>
        </div>
      </div>`;
  }

  timerEl.style.display = 'flex';
  timerEl.classList.add('rt-running');

  updateTimerDisplay(timeDisplay);

  restTimerInterval = setInterval(() => {
    restTimeLeft--;
    if (restTimeLeft <= 0) {
      updateTimerDisplay(timeDisplay); // Update one last time to zero
      stopRestTimer();
      playBeep();
      showToast('Tempo de descanso encerrado! Bora pro próximo!', 'info');
    } else {
      updateTimerDisplay(timeDisplay);
    }
  }, 1000);
}

export function updateTimerDisplay(el) {
  const m = Math.floor(restTimeLeft / 60).toString().padStart(2, '0');
  const s = (restTimeLeft % 60).toString().padStart(2, '0');
  const timeText = `${m}:${s}`;
  el.textContent = timeText;

  // Sincronizar com o Modo Foco
  const focusTimer = document.getElementById('focusTimerVal');
  if (focusTimer) {
    focusTimer.textContent = restTimeLeft > 0 ? timeText : 'DESCANSAR';
  }

  const progressPct = totalRestTime > 0 ? (restTimeLeft / totalRestTime) * 100 : 0;

  const radar = document.getElementById('timerRadar');
  if (radar) {
    radar.style.setProperty('--progress', `${progressPct}%`);
  }

  const topClip = document.getElementById('hgTopClip');
  const botClip = document.getElementById('hgBotClip');
  if (topClip && botClip) {
    const drainTop = 100 - progressPct;
    topClip.style.clipPath = `inset(${drainTop}% 0 0 0)`;
    botClip.style.clipPath = `inset(${progressPct}% 0 0 0)`;
  }

  const cyberRing = document.getElementById('cyberRing');
  if (cyberRing) {
    const dashoffset = 283 - (283 * (progressPct / 100));
    cyberRing.style.strokeDashoffset = dashoffset;
  }

  const arcadeBar = document.getElementById('arcadeBar');
  if (arcadeBar) {
    arcadeBar.style.width = `${progressPct}%`;
    if (progressPct < 25) {
      arcadeBar.style.backgroundColor = '#ef4444';
      arcadeBar.parentElement.style.borderColor = '#ef4444';
      arcadeBar.parentElement.style.boxShadow = '0 0 10px rgba(239,68,68,0.4)';
    }
  }
}

export function stopRestTimer() {
  clearInterval(restTimerInterval);
  const timerEl = document.getElementById('restTimer');
  if (timerEl) {
    timerEl.classList.remove('rt-running');
    timerEl.style.display = 'none';
  }
}

export function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);

    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch (e) { console.warn('Bip de áudio bloqueado ou não suportado.'); }
}



// ---- MODO FOCO ----
export let focusIndex = 0;
export function setFocusIndex(val) { focusIndex = val; }
export let focusFicha = [];

export function startFocusMode(db) {
  const treino = getTodayTreino(db);
  const ids = db.fichas[treino] || [];
  if (ids.length === 0) {
    showToast('Adicione exercícios à ficha antes de iniciar o Modo Foco!', 'error');
    return;
  }

  if (!sessionStorage.getItem('focusStartTime')) {
    sessionStorage.setItem('focusStartTime', Date.now());
  }

  focusFicha = ids.map(id => getExById(db, id)).filter(Boolean);
  focusIndex = 0;

  updateFocusUI(db);
  openModal('modalFocus');
}

export function updateFocusUI(db) {
  const ex = focusFicha[focusIndex];
  if (!ex) return;

  const checks = getChecks(db);
  const isChecked = checks.includes(ex.id);

  document.getElementById('focusStep').textContent = `EXERCÍCIO ${focusIndex + 1} / ${focusFicha.length}`;
  document.getElementById('focusExName').textContent = ex.nome;
  document.getElementById('focusExBadge').textContent = ex.grupoMuscular.toUpperCase();
  document.getElementById('focusExBadge').className = 'focus-ex-badge ' + grupoBadgeClass(ex.grupoMuscular);

  const img = document.getElementById('focusImg');
  if (ex.imagem) {
    img.src = ex.imagem;
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
  }

  document.getElementById('focusSeries').textContent = ex.series;
  document.getElementById('focusReps').textContent = ex.repeticoes;
  document.getElementById('focusCarga').textContent = formatCarga(ex.carga, ex.porLado, ex.tags) || '--';

  // Animação de transição
  const main = document.querySelector('.focus-main');
  main.classList.remove('focus-anim');
  void main.offsetWidth; // Trigger reflow
  main.classList.add('focus-anim');

  const notesEl = document.getElementById('focusNotes');
  if (ex.anotacoes) {
    notesEl.innerHTML = `<div class="f-note-card"><strong>💡 Lembrete:</strong><br>${ex.anotacoes}</div>`;
  } else {
    notesEl.innerHTML = '';
  }

  const btnCheck = document.getElementById('btnFocusCheck');
  if (isChecked) {
    btnCheck.textContent = 'CONCLUÍDO ✓';
    btnCheck.classList.add('f-btn-done');
  } else {
    btnCheck.textContent = 'CONCLUIR EXERCÍCIO';
    btnCheck.classList.remove('f-btn-done');
  }

  // Set buttons in Focus Mode
  const focusTimerArea = document.querySelector('.focus-timer-area');
  // Remove existing series wrap if any
  const existingWrap = focusTimerArea.querySelector('.focus-series-wrap');
  if (existingWrap) existingWrap.remove();

  const seriesWrap = document.createElement('div');
  seriesWrap.className = 'focus-series-wrap';

  const seriesDone = getSeriesDone(db, ex.id);
  for (let s = 0; s < (ex.series || 0); s++) {
    const isSetDone = seriesDone[s] || false;
    const sBtn = document.createElement('button');
    sBtn.className = `btn-set-focus ${isSetDone ? 'done' : ''}`;
    sBtn.textContent = s + 1;
    sBtn.onclick = () => {
      const newSets = toggleSeriesSet(db, ex.id, s);
      updateFocusUI(db);
      renderFicha(db);
    };
    seriesWrap.appendChild(sBtn);
  }
  focusTimerArea.insertBefore(seriesWrap, document.getElementById('focusTimerVal'));

  const nextEx = focusFicha[focusIndex + 1];
  if (nextEx) {
    document.getElementById('focusNextName').textContent = nextEx.nome;
    document.querySelector('.focus-next-info').style.opacity = '1';
  } else {
    document.getElementById('focusNextName').textContent = '--';
    document.querySelector('.focus-next-info').style.opacity = '0';
  }
}

export function focusCheck(db) {
  const ex = focusFicha[focusIndex];
  const checks = toggleCheck(db, ex.id);
  const isDone = checks.includes(ex.id);

  if (isDone) {
    startRestTimer(60);

    // Auto-avançar (Funcionalidade aprimorada)
    if (focusIndex < focusFicha.length - 1) {
      showToast('Excelente! Descansando e indo para o próximo...', 'success');
      setTimeout(() => {
        // Verifica se ainda estamos no mesmo exercício (evita bugs se o usuário navegar manualmente)
        if (focusIndex < focusFicha.length - 1) {
          focusIndex++;
          updateFocusUI(db);
        }
      }, 1500); // 1.5s para o usuário ver o check verde antes de mudar
    }
  } else {
    stopRestTimer();
  }

  renderFicha(db);
  updateFocusUI(db);

  // Verificar se terminou tudo
  const fichaIds = db.fichas[getTodayTreino(db)] || [];
  const allDone = fichaIds.length > 0 && fichaIds.every(id => checks.includes(id));
  if (allDone) {
    // Registrar conclusão de forma atômica: treinos[] + concluido juntos
    const currentTreino = getTodayTreino(db);
    const tKey = today();
    if (!db.historico[tKey].treinos) db.historico[tKey].treinos = [];
    if (!db.historico[tKey].treinos.includes(currentTreino)) {
      db.historico[tKey].treinos.push(currentTreino);
    }
    db.historico[tKey].concluido = true;

    // Salva duração do Modo Foco
    const startStr = sessionStorage.getItem('focusStartTime');
    if (startStr) {
      const durMins = Math.max(1, Math.floor((Date.now() - parseInt(startStr)) / 60000));
      db.historico[tKey].duracaoFoco = durMins;
      sessionStorage.removeItem('focusStartTime');
    }

    saveDB(db);
    renderHeroStats(db);
    renderProgresso(db);

    // Pequeno delay para fechar se for o último e mostrar a conclusão
    setTimeout(() => {
      if (document.getElementById('modalFocus').style.display === 'flex') {
        closeModal('modalFocus');
        showConclusao(db);
      }
    }, 1500);
  } else {
    // Se desmarcar algo no modo foco, remove o status de concluído
    if (db.historico[today()].concluido) {
      db.historico[today()].concluido = false;
      saveDB(db);
    }
  }
}



// ---- POPOVER DE NOTA ----
export function showNotePopover(ex, triggerEl) {
  const old = document.querySelector('.note-popover');
  if (old) old.remove();

  const popover = document.createElement('div');
  popover.className = 'note-popover';
  popover.innerHTML = `
    <div class="popover-header">
      <strong style="display:inline-flex; align-items:center; gap:6px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
            <line x1="9" y1="17" x2="12" y2="17"/>
        </svg>
        Notas: ${ex.nome}
      </strong>
      <button class="popover-close">✕</button>
    </div>
    <div class="popover-body">
      ${ex.anotacoes ? ex.anotacoes.replace(/\n/g, '<br>') : '<i style="color:var(--text-tertiary)">Nenhuma anotação...</i>'}
    </div>
    <div class="popover-footer">
      <button class="btn-popover-edit" data-id="${ex.id}" style="display:inline-flex; align-items:center; gap:6px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
        Editar Detalhes
      </button>
    </div>
  `;

  document.body.appendChild(popover);

  const rect = triggerEl.getBoundingClientRect();
  popover.style.top = (rect.bottom + window.scrollY + 8) + 'px';
  popover.style.left = Math.min(rect.left + window.scrollX, window.innerWidth - 300) + 'px';

  popover.querySelector('.popover-close').onclick = () => popover.remove();
  popover.querySelector('.btn-popover-edit').onclick = () => {
    popover.remove();
    openEditExercicio(loadDB(), ex.id);
  };

  setTimeout(() => {
    const closeOut = (e) => {
      if (!popover.contains(e.target) && e.target !== triggerEl) {
        popover.remove();
        document.removeEventListener('click', closeOut);
      }
    };
    document.addEventListener('click', closeOut);
  }, 10);
}



// ---- CRONÔMETRO GLOBAL DE TREINO ----
export let globalWorkoutInterval = null;

export function initGlobalTimer(db) {
  const startTime = localStorage.getItem('workout_start_time');
  const btn = document.getElementById('btnStartWorkout');
  const display = document.getElementById('globalWorkoutTimer');

  if (startTime) {
    if (btn) {
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="margin-right: 6px;">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
        </svg>
        ENCERRAR TREINO
      `;
      btn.classList.add('active');
    }
    if (display) display.style.display = 'flex';
    startInterval();
  }

  if (btn) {
    btn.onclick = () => {
      const isRunning = localStorage.getItem('workout_start_time');
      if (!isRunning) {
        localStorage.setItem('workout_start_time', Date.now());
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="margin-right: 6px;">
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
          </svg>
          ENCERRAR TREINO
        `;
        btn.classList.add('active');
        if (display) display.style.display = 'flex';
        startInterval();
        showToast('Treino iniciado! Foco total!', 'success');
      } else {
        // Em vez de encerrar imediatamente, abre o modal de confirmação.
        // A lógica de parar o cronômetro e navegar para o Dashboard é feita
        // no listener de #btnEncerrarConfirmar em app.js.
        openModal('modalEncerrarTreino');
      }
    };
  }
}

export function startInterval() {
  if (globalWorkoutInterval) clearInterval(globalWorkoutInterval);
  globalWorkoutInterval = setInterval(updateGlobalTimerUI, 1000);
  updateGlobalTimerUI();
}

export function updateGlobalTimerUI() {
  const startTime = localStorage.getItem('workout_start_time');
  const display = document.getElementById('globalWorkoutTimer');

  if (!startTime) {
    if (globalWorkoutInterval) clearInterval(globalWorkoutInterval);
    if (display) display.style.display = 'none';
    return;
  }

  const diff = Date.now() - parseInt(startTime);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const hStr = hours > 0 ? String(hours).padStart(2, '0') + ':' : '';
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  const timeEl = document.getElementById('gtTime');
  if (timeEl) timeEl.textContent = `${hStr}${mStr}:${sStr}`;
}

export function stopGlobalTimer(db) {
  const startTime = localStorage.getItem('workout_start_time');
  if (!startTime) return false;

  const diff = Date.now() - parseInt(startTime);
  const totalSeconds = Math.floor(diff / 1000);

  const t = today();
  if (!db.historico[t]) db.historico[t] = { treino: getTodayTreino(db), concluido: false, checks: [] };
  db.historico[t].duracaoTotal = totalSeconds;

  localStorage.removeItem('workout_start_time');
  saveDB(db);

  const btn = document.getElementById('btnStartWorkout');
  const display = document.getElementById('globalWorkoutTimer');
  if (btn) {
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="margin-right: 6px;">
          <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/>
      </svg>
      INICIAR TREINO
    `;
    btn.classList.remove('active');
  }
  if (display) display.style.display = 'none';
  if (globalWorkoutInterval) clearInterval(globalWorkoutInterval);

  renderProgresso(db);
  return true;
}

export function encerrarTreinoGlobal(db) {
  if (stopGlobalTimer(db)) {
    showToast('Treino finalizado! Ótimo trabalho.', 'success');

    const t = today();
    const currentTreino = getTodayTreino(db);
    const checks = db.historico[t]?.checks || [];
    const fichaIds = db.fichas[currentTreino] || [];
    if (fichaIds.length > 0 && fichaIds.every(id => checks.includes(id))) {
      showConclusao(db);
    }
  }
}
// ====== CLASH ROYALE STYLE DETAILS MODAL ======
export function openCRDetails(db, exId) {
  const ex = getExById(db, exId);
  if (!ex) return;

  const m = document.getElementById('modalCRDetails');
  
  // Header Info
  const state = getMaestriaState(db, exId);
  const level = Math.floor(state.totalSessoes / 5) + 1;

  document.getElementById('crExName').textContent = ex.nome;
  document.getElementById('crExLevel').textContent = level;
  document.getElementById('crExLevelLabel').textContent = level;
  document.getElementById('crExGrupo').textContent = ex.grupoMuscular;
  document.getElementById('crExClasse').textContent = ex.tags && ex.tags.includes('Aparelho') ? 'Aparelho' : 'Peso Livre';
  
  const imgUrl = ex.imagem || '';
  document.getElementById('crExCardImg').src = imgUrl;
  document.getElementById('crExIllustration').src = imgUrl;
  document.getElementById('crExDescription').textContent = ex.anotacoes || "Um exercício focado em fortalecer o " + ex.grupoMuscular + ". Mantenha a postura correta para melhores resultados!";

  // Maestria Shortcut (Trophy Icon)
  const mBtn = document.getElementById('crExMaestriaIcon');
  mBtn.innerHTML = '';
  // state já foi declarado acima
  const bc = ['none', 'bronze', 'prata', 'ouro'][state.badgeLevel];
  
  if (state.badgeLevel > 0) {
    mBtn.innerHTML = `
      <div class="cr-mastery-mini-shield cr-mini-tier-${bc}">
           ${ex.imagem ? `<img src="${ex.imagem}" alt="${ex.nome}">` : '<span style="font-size:12px;">🏋️</span>'}
      </div>
    `;
  } else {
    mBtn.innerHTML = '<span style="font-size: 24px;">🏆</span>';
  }

  // Click shortcut
  mBtn.onclick = () => {
    closeModal('modalCRDetails');
    openMaestriaExercicio(db, exId);
  };

  // Stats Grid (Tab 2)
  const statsGrid = document.getElementById('crStatsGrid');
  statsGrid.innerHTML = `
    <div class="cr-stat-item">
        <div class="cr-stat-icon" style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color: var(--primary-light);">
                <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11"/>
                <circle cx="4" cy="12" r="1.5"/>
                <circle cx="20" cy="12" r="1.5"/>
            </svg>
        </div>
        <div class="cr-stat-info">
            <span class="cr-stat-label">Séries</span>
            <span class="cr-stat-val">${ex.series}</span>
        </div>
    </div>
    <div class="cr-stat-item">
        <div class="cr-stat-icon" style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color: var(--primary-light);">
                <path d="m17 2 4 4-4 4"/>
                <path d="M3 11v-1a4 4 0 0 1 4-4h14"/>
                <path d="m7 22-4-4 4-4"/>
                <path d="M21 13v1a4 4 0 0 1-4 4H3"/>
            </svg>
        </div>
        <div class="cr-stat-info">
            <span class="cr-stat-label">Reps</span>
            <span class="cr-stat-val">${ex.repeticoes}</span>
        </div>
    </div>
    <div class="cr-stat-item">
        <div class="cr-stat-icon" style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color: var(--primary-light);">
                <path d="M16 16 20 6M8 16l-4-10M12 3v18M3 21h18M12 7l4 2M12 7l-4 2"/>
            </svg>
        </div>
        <div class="cr-stat-info">
            <span class="cr-stat-label">Carga</span>
            <span class="cr-stat-val">${ex.carga || '--'} kg</span>
        </div>
    </div>
    <div class="cr-stat-item">
        <div class="cr-stat-icon" style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color: var(--primary-light);">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
            </svg>
        </div>
        <div class="cr-stat-info">
            <span class="cr-stat-label">Grupo</span>
            <span class="cr-stat-val">${ex.grupoMuscular}</span>
        </div>
    </div>
  `;

  // Tabs logic (Swipe & Dots)
  const dots = m.querySelectorAll('.cr-dot');
  const tabPanes = m.querySelectorAll('.cr-tab-pane');
  const tabsContainer = m.querySelector('.cr-tabs-container');
  let currentTabIndex = 0;

  function goToTab(index) {
    if (index < 0 || index >= dots.length) return;
    currentTabIndex = index;
    dots.forEach(d => d.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));
    dots[currentTabIndex].classList.add('active');
    tabPanes[currentTabIndex].classList.add('active');
  }

  dots.forEach((dot, idx) => {
    dot.onclick = () => goToTab(idx);
  });

  // Swipe logic
  let touchStartX = 0;
  let touchEndX = 0;

  tabsContainer.ontouchstart = (e) => {
    touchStartX = e.changedTouches[0].screenX;
  };

  tabsContainer.ontouchend = (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  };

  function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
      // Swipe Left -> Next Tab
      goToTab(currentTabIndex + 1);
    }
    if (touchEndX > touchStartX + swipeThreshold) {
      // Swipe Right -> Prev Tab
      goToTab(currentTabIndex - 1);
    }
  }

  // Default tab
  goToTab(0);

  // Edit Button shortcut inside CR Details Modal
  const editBtn = document.getElementById('crExEditBtn');
  if (editBtn) {
    editBtn.onclick = () => {
      closeModal('modalCRDetails');
      openEditExercicio(db, exId);
    };
  }

  openModal('modalCRDetails');
}


