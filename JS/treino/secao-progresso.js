import { loadDB, saveDB, today, todayLabel, formatSeconds, getExById, getStreak, fadeIn } from './db.js';
import { openModal } from './secao-ficha.js';
import { calendarViewDate } from './secao-treinos.js';
import { QUOTES } from './secao-perfil.js';

// ---- MIGRAÇÃO DO HISTÓRICO LEGADO ----
// Garante que entradas com concluido:true mas sem treinos[] tenham o campo populado.
// Isso corrige dados gravados por versões anteriores do app antes do fix atômico.
function migrarHistoricoLegado(db) {
  let needsSave = false;
  Object.keys(db.historico).forEach(date => {
    const entry = db.historico[date];
    if (entry.concluido && (!entry.treinos || entry.treinos.length === 0)) {
      // Usar entry.treino (campo legado) como fallback
      const treinoLegado = entry.treino;
      if (treinoLegado) {
        entry.treinos = [treinoLegado];
        needsSave = true;
      }
    }
  });
  return needsSave;
}

// ---- PROGRESSO / GAMIFICATION ----
export function renderProgresso(db) {
  const el = id => document.getElementById(id);

  // Migrar dados legados silenciosamente (execução rápida, só salva se necessário)
  if (migrarHistoricoLegado(db)) {
    saveDB(db);
  }

  const streak = getStreak(db);
  const hist = db.historico || {};

  // XP & Total
  const completedDates = Object.keys(hist).filter(d => hist[d].concluido);
  const totalWorkouts = completedDates.length;
  const xp = totalWorkouts * 10;

  const xpPerLevel = 50;
  const currentLevel = Math.floor(xp / xpPerLevel) + 1;
  const xpIntoLevel = xp % xpPerLevel;
  const xpPct = (xpIntoLevel / xpPerLevel) * 100;

  let nivelName = 'Iniciante';
  if (currentLevel >= 50) nivelName = 'Mr. Olympia';
  else if (currentLevel >= 20) nivelName = 'Bodybuilder';
  else if (currentLevel >= 10) nivelName = 'Marombeiro';
  else if (currentLevel >= 5) nivelName = 'Amador';
  else if (currentLevel === 1) nivelName = 'Frango';

  // Atualizar TODOS os elementos de streak de forma unificada (fonte única de verdade)
  // statStreak    → Hero da seção Ficha (com ícone de fogo)
  // progStreakVal → Card "Ofensiva" na seção Progresso
  // profStreak    → Visão Geral na seção Perfil
  if (el('statStreak')) {
    if (streak) {
      el('statStreak').innerHTML = `${streak}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="color:#f97316; margin-left: 2px; display: inline-block; vertical-align: middle;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
    } else {
      el('statStreak').innerHTML = '0';
    }
  }
  if (el('progStreakVal')) el('progStreakVal').textContent = streak;
  if (el('profStreak')) el('profStreak').textContent = streak + (streak === 1 ? ' dia' : ' dias');

  if (el('progNivelName')) el('progNivelName').textContent = nivelName;
  if (el('progNivelVal')) el('progNivelVal').textContent = currentLevel;
  if (el('progXpFill')) el('progXpFill').style.width = xpPct + '%';
  if (el('progXpAtual')) el('progXpAtual').textContent = xp;
  if (el('progXpNext')) el('progXpNext').textContent = (currentLevel * xpPerLevel);
  if (el('profXp')) el('profXp').textContent = xp + ' XP';
  if (el('progTotalTreinos')) el('progTotalTreinos').textContent = totalWorkouts;

  const currMonth = new Date().toISOString().slice(0, 7);
  const mesTreinos = completedDates.filter(d => d.startsWith(currMonth)).length;
  if (el('progMesTreinos')) el('progMesTreinos').textContent = mesTreinos;

  // Sua Semana Progress (Novo)
  const weekDaysGrid = el('weekDaysGrid');
  const weekTrainedCount = el('weekTrainedCount');
  if (weekDaysGrid && weekTrainedCount) {
    const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Dom, 1 = Seg...

    // Calcular o início da semana (Segunda-feira)
    const startOfWeek = new Date(now);
    const diff = (currentDay === 0 ? 6 : currentDay - 1);
    startOfWeek.setDate(now.getDate() - diff);

    let trainedInWeek = 0;
    let daysHtml = '';

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dStr = d.toISOString().slice(0, 10);
      const isDone = hist[dStr] && hist[dStr].concluido;
      if (isDone) trainedInWeek++;

      daysHtml += `
            <div class="ws-day-item">
                <span class="ws-day-label">${labels[i]}</span>
                <div class="ws-day-circle ${isDone ? 'completed' : ''}">
                    <span class="check">✓</span>
                </div>
            </div>
        `;
    }

    weekDaysGrid.innerHTML = daysHtml;
    weekTrainedCount.textContent = trainedInWeek;
    fadeIn(weekDaysGrid);
  }

  // Ciclo de Treino — sempre recalculado do histórico real (fonte única de verdade)
  const startDate = db.currentCycleStartDate || today();
  const cycleWorkouts = Object.keys(db.historico)
    .filter(d => db.historico[d].concluido && d >= startDate);
  const cycleCount = cycleWorkouts.length;

  // Sincronizar currentFichaWorkouts e recalcular breakdown a partir do histórico
  // (corrige divergências causadas por incrementos manuais obsoletos)
  const freshBreakdown = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 };
  cycleWorkouts.forEach(date => {
    const h = db.historico[date];
    const treinosNoDia = h.treinos && h.treinos.length > 0 ? h.treinos : (h.treino ? [h.treino] : []);
    treinosNoDia.forEach(letra => {
      if (freshBreakdown[letra] !== undefined) freshBreakdown[letra]++;
    });
  });

  // Salvar apenas se houver divergência real (evita writes desnecessários)
  const breakdownChanged = JSON.stringify(db.currentCycleBreakdown) !== JSON.stringify(freshBreakdown);
  const countChanged = db.currentFichaWorkouts !== cycleCount;
  if (countChanged || breakdownChanged) {
    db.currentFichaWorkouts = cycleCount;
    db.currentCycleBreakdown = freshBreakdown;
    saveDB(db);
  }

  const cycleDoneEl = el('cycleDone');
  const cycleFillEl = el('cycleFill');
  const cycleStatusEl = el('cycleStatus');

  if (cycleDoneEl) cycleDoneEl.textContent = cycleCount;
  if (cycleFillEl) {
    const cyclePct = Math.min((cycleCount / 30) * 100, 100);
    cycleFillEl.style.width = cyclePct + '%';

    // Mudança de status/cor baseada no progresso
    if (cycleStatusEl) {
      if (cyclePct >= 100) {
        cycleStatusEl.textContent = 'CICLO COMPLETO';
        cycleStatusEl.style.color = '#fff';
        cycleStatusEl.style.background = 'var(--gym-green)';
      } else if (cyclePct >= 70) {
        cycleStatusEl.textContent = 'RETA FINAL';
        cycleStatusEl.style.color = '#fff';
        cycleStatusEl.style.background = '#8b5cf6';
      } else {
        cycleStatusEl.textContent = 'EM ANDAMENTO';
      }
    }
  }

  // Renderizar breakdown (A, B, C...)
  const breakdownEl = el('cycleBreakdown');
  if (breakdownEl) {
    const bd = db.currentCycleBreakdown || { A: 0, B: 0, C: 0, D: 0, E: 0 };
    const html = Object.keys(bd)
      .filter(letra => {
        const hasEx = db.fichas[letra] && db.fichas[letra].filter(Boolean).length > 0;
        const hasCardio = db.aerobicos && db.aerobicos[letra] && db.aerobicos[letra].tipo;
        return bd[letra] > 0 || hasEx || hasCardio;
      })
      .map(letra => `
            <div class="cb-item">
                <span class="cb-label">TREINO ${letra}:</span>
                <span class="cb-val">${bd[letra] || 0}</span>
            </div>
        `).join('');
    breakdownEl.innerHTML = html || '<p style="font-size:0.8rem; color:var(--text-tertiary)">Nenhum treino iniciado neste ciclo.</p>';
  }

  // Monthly Calendar
  const now = calendarViewDate;
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const monthNames = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
  el('calendarMonthName').textContent = `${monthNames[month]} ${year}`;

  const btnPrev = el('prevMonth');
  const btnNext = el('nextMonth');
  if (btnPrev) btnPrev.disabled = (year === 2026 && month === 0);

  let gridHtml = '';
  let emptySlots = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < emptySlots; i++) {
    gridHtml += `<div class="month-day empty"></div>`;
  }

  // Calculate streaks history for color intensity
  let currentStreak = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = d.toISOString().slice(0, 10);
    const isToday = dateStr === today();
    const isDone = hist[dateStr] && hist[dateStr].concluido;
    const isSunday = d.getDay() === 0;

    // Streak logic
    if (isDone) {
      currentStreak++;
    } else {
      if (!isSunday && dateStr < today()) {
        currentStreak = 0; // Missed day breaks streak
      }
      // If sunday or future, streak remains same (doesn't grow, doesn't break)
    }

    let levelCls = '';
    let timeLabel = '';
    if (isDone) {
      if (currentStreak >= 10) levelCls = 'level-5';
      else if (currentStreak >= 7) levelCls = 'level-4';
      else if (currentStreak >= 4) levelCls = 'level-3';
      else if (currentStreak >= 2) levelCls = 'level-2';
      else levelCls = 'level-1';

      const dur = hist[dateStr].duracaoTotal;
      if (dur) {
        const m = Math.floor(dur / 60);
        timeLabel = `<div class="day-duration-chip">${m} min</div>`;
      }
    } else if (dateStr < today() && !isSunday) {
      levelCls = 'missed';
    }

    const cycleEvent = db.cycleEvents ? db.cycleEvents[dateStr] : null;
    const eventHtml = cycleEvent ? `<div class="day-event-dot" title="${cycleEvent}"></div>` : '';

    gridHtml += `<div class="month-day ${levelCls} ${isToday ? 'today' : ''}" 
      data-date="${dateStr}">
      <span class="day-num">${day}</span>
      ${eventHtml}
      ${timeLabel}
    </div>`;
  }

  el('monthCalendar').innerHTML = gridHtml;
  fadeIn(el('monthCalendar'));

  renderWeeklyPlanner(db);
  renderVolumeSemanal(db);
  renderRadarChart(db);
  renderBadges(db);
  renderSelectedEmblems(db);

  // Click events for month calendar
  el('monthCalendar').querySelectorAll('.month-day').forEach(cell => {
    cell.addEventListener('click', () => {
      const dateStr = cell.dataset.date;
      const histDia = db.historico[dateStr];
      if (!histDia || (!histDia.concluido && (!histDia.treinos || histDia.treinos.length === 0))) return;

      const treinosRealizados = histDia.treinos || [histDia.treino];

      // Update UI selection
      el('monthCalendar').querySelectorAll('.month-day').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');

      const parts = dateStr.split('-');
      el('dayHistTitle').textContent = `Treinos do Dia ${parts[2]}/${parts[1]}`;

      let allExHtml = '';
      const durTotal = histDia.duracaoTotal;
      if (durTotal) {
        allExHtml += `<div class="day-hist-duration">⏱️ DURAÇÃO TOTAL: ${formatSeconds(durTotal)}</div>`;
      }

      treinosRealizados.forEach(tLetra => {
        const fichaIds = db.fichas[tLetra] || [];
        const exListHtml = fichaIds.map(id => {
          const ex = getExById(db, id);
          if (!ex) return '';
          return `<div><strong style="color:var(--primary-light)">•</strong> ${ex.nome} <span style="font-size:0.8rem">(${ex.series}×${ex.repeticoes})</span></div>`;
        }).join('');

        allExHtml += `
            <div style="margin-bottom:16px;">
                <div style="margin-bottom:8px; font-weight:800; color:var(--primary-light); font-size:0.8rem; letter-spacing:1px;">TREINO ${tLetra}</div>
                <div style="padding:12px; background:rgba(255,255,255,0.05); border-radius:8px; display:flex; flex-direction:column; gap:8px;">
                  ${exListHtml || 'Nenhum detalhe salvo.'}
                </div>
            </div>
          `;
      });

      el('dayHistContent').innerHTML = allExHtml;
      openModal('modalDayHist');
    });
  });
}

export function renderWeeklyPlanner(db) {
  const el = id => document.getElementById(id);
  const container = el('weeklyPlanner');
  if (!container) return;

  const viewDate = calendarViewDate;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
  el('plannerMonthName').textContent = `${monthNames[month]} ${year}`;

  // Atualizar estado dos botões de navegação
  const btnPrev = el('prevWeekMonth');
  const btnNext = el('nextWeekMonth');
  if (btnPrev) btnPrev.disabled = (year === 2026 && month === 0);

  // Agrupar dias do mês por semanas (segunda a domingo)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let currentWeek = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay(); // 0 = Dom, 1 = Seg...

    currentWeek.push({
      day,
      dateStr: d.toISOString().slice(0, 10),
      weekday: d.toLocaleDateString('pt-BR', { weekday: 'long' }),
      dateLabel: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      dayOfWeek
    });

    if (dayOfWeek === 0 || day === daysInMonth) { // Fim da semana (Domingo) ou fim do mês
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  }

  container.innerHTML = weeks.map((week, idx) => {
    const weekStart = week[0].dateLabel;
    const weekEnd = week[week.length - 1].dateLabel;

    const daysHtml = week.map(d => {
      // Pular domingos se o usuário quiser focar de segunda a sábado (como pedido: "segunda a sábado")
      // Mas vamos mostrar todos e destacar os treinos
      const isSunday = d.dayOfWeek === 0;
      if (isSunday && !db.historico[d.dateStr]) return ''; // Oculta domingo se não houver treino

      const hist = db.historico[d.dateStr];
      const treinos = (hist && hist.treinos) ? hist.treinos : (hist && hist.concluido ? [hist.treino] : []);
      const isToday = d.dateStr === today();

      let workoutsHtml = '';
      let timeHtml = '';
      if (treinos.length > 0) {
        workoutsHtml = treinos.map(t => `<span class="planner-workout-badge">${t}</span>`).join('');
        const dur = (hist && hist.duracaoTotal) ? formatSeconds(hist.duracaoTotal) : '';
        if (dur) timeHtml = `<span class="planner-time"><i class="fas fa-stopwatch"></i> ${dur}</span>`;
      } else {
        workoutsHtml = `<span class="planner-workout-badge empty">Descanso</span>`;
      }

      return `
        <div class="planner-day-row ${isToday ? 'is-today' : ''}">
          <div class="planner-date-box">
            <span class="planner-weekday">${d.weekday}</span>
            <span class="planner-daynum">${d.dateLabel}</span>
          </div>
          <div class="planner-workouts">
            ${workoutsHtml}
            ${timeHtml}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="planner-week">
        <div class="planner-week-title">
            <span>SEMANA ${idx + 1}</span>
            <span>${weekStart} - ${weekEnd}</span>
        </div>
        <div class="planner-week-content">
          ${daysHtml}
        </div>
      </div>
    `;
  }).join('');
  fadeIn(container);
}



// ---- CALCULADORA 1RM ----
export function initCalculator() {
  const wInput = document.getElementById('calcWeight');
  const rInput = document.getElementById('calcReps');
  const resVal = document.querySelector('#calcResult .res-val');

  if (!wInput || !rInput || !resVal) return;

  const update = () => {
    const w = parseFloat(wInput.value);
    const r = parseFloat(rInput.value);

    if (w > 0 && r > 0) {
      // Fórmula de Brzycki: 1RM = peso / (1.0278 - 0.0278 * reps)
      const rm = w / (1.0278 - (0.0278 * r));
      resVal.textContent = Math.round(rm);
    } else {
      resVal.textContent = '--';
    }
  };

  wInput.addEventListener('input', update);
  rInput.addEventListener('input', update);
}



// ---- VOLUME DE CARGA ----
export let currentVolumeData = {};

export function renderVolumeSemanal(db) {
  const chartEl = document.getElementById('volumeChart');
  const filterEl = document.getElementById('filterVolume');
  if (!chartEl) return;

  if (filterEl && !filterEl.dataset.bound) {
    filterEl.addEventListener('change', () => renderVolumeSemanal(db));
    filterEl.dataset.bound = 'true';
  }

  const mode = filterEl ? filterEl.value : '7';
  let validDates = [];
  let prevDates = [];

  if (mode !== 'all') {
    const days = parseInt(mode);
    for (let i = 0; i < days; i++) {
      let d = new Date(); d.setDate(d.getDate() - i);
      validDates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);

      let p = new Date(); p.setDate(p.getDate() - i - days);
      prevDates.push(`${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, '0')}-${String(p.getDate()).padStart(2, '0')}`);
    }
  } else {
    validDates = Object.keys(db.historico);
  }

  const volumePorGrupo = {};
  const prevVolumePorGrupo = {};
  const breakdownPorEx = {};

  const parseWorkout = (date, isPrev) => {
    if (!db.historico[date] || !db.historico[date].concluido) return;
    const treinos = db.historico[date].treinos || [db.historico[date].treino];
    treinos.forEach(treino => {
      const ids = db.fichas[treino] || [];
      ids.forEach(id => {
        const ex = getExById(db, id);
        if (ex) {
          const s = parseInt(ex.series) || 0;
          const r = parseInt(ex.repeticoes) || 0;
          const c = parseFloat(String(ex.carga).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          const multi = ex.porLado ? 2 : 1;
          const vol = s * r * c * multi;
          if (vol <= 0) return;

          if (isPrev) {
            prevVolumePorGrupo[ex.grupoMuscular] = (prevVolumePorGrupo[ex.grupoMuscular] || 0) + vol;
          } else {
            volumePorGrupo[ex.grupoMuscular] = (volumePorGrupo[ex.grupoMuscular] || 0) + vol;
            if (!breakdownPorEx[ex.grupoMuscular]) breakdownPorEx[ex.grupoMuscular] = {};
            breakdownPorEx[ex.grupoMuscular][ex.nome] = (breakdownPorEx[ex.grupoMuscular][ex.nome] || 0) + vol;
          }
        }
      });
    });
  };

  validDates.forEach(d => parseWorkout(d, false));
  prevDates.forEach(d => parseWorkout(d, true));

  // Assegurar grupos base na lista, mesmo com volume zero
  const baseGroups = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'];
  baseGroups.forEach(g => {
    if (volumePorGrupo[g] === undefined) volumePorGrupo[g] = 0;
  });

  const grupos = Object.keys(volumePorGrupo).sort((a, b) => volumePorGrupo[b] - volumePorGrupo[a]);

  let totalVol = 0;
  grupos.forEach(g => totalVol += volumePorGrupo[g]);



  const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#eab308', '#06b6d4', '#ef4444'];
  let conicStops = [];
  let currentPct = 0;
  let colorIdx = 0;

  const formatT = (kg) => kg >= 1000 ? (kg / 1000).toFixed(1).replace('.0', '') + 'T' : Math.round(kg) + 'kg';

  let legendHtml = '<div style="display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 150px; max-height: 250px; overflow-y: auto; padding-right: 5px;" class="custom-scroll">';

  currentVolumeData = {};

  grupos.forEach((g, i) => {
    const vol = volumePorGrupo[g];
    const prevVol = prevVolumePorGrupo[g] || 0;
    let trendStr = '';
    let trendColor = '';

    if (mode !== 'all') {
      const upIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="display:inline-block; vertical-align:middle; margin-right:2px;"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`;
      const downIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="display:inline-block; vertical-align:middle; margin-right:2px;"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>`;
      
      if (prevVol === 0 && vol > 0) {
        trendStr = `${upIcon} +100%`; trendColor = '#4ade80';
      } else if (prevVol > 0) {
        const pct = ((vol - prevVol) / prevVol) * 100;
        if (pct >= 0) { trendStr = `${upIcon} +${Math.round(pct)}%`; trendColor = '#4ade80'; }
        else { trendStr = `${downIcon} ${Math.round(pct)}%`; trendColor = '#f87171'; }
      }
    }

    currentVolumeData[g] = { vol, prevVol, trendStr, trendColor, breakdown: breakdownPorEx[g] };

    let color = 'rgba(255,255,255,0.2)'; // Cor cinza/vazia para grupos zerados
    if (vol > 0 && totalVol > 0) {
      const slicePct = (vol / totalVol) * 100;
      color = colors[colorIdx % colors.length];
      conicStops.push(`${color} ${currentPct}% ${currentPct + slicePct}%`);
      currentPct += slicePct;
      colorIdx++;
    }

    legendHtml += `
      <div onclick="openVolumeDetails('${g}')" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 8px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: ${color};"></div>
          <span style="font-weight: 600; font-size: 0.9rem; ${vol === 0 ? 'color: var(--text-tertiary);' : ''}">${g}</span>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: bold; ${vol === 0 ? 'color: var(--text-tertiary); opacity: 0.5;' : ''}">${formatT(vol)}</div>
          <div style="font-size: 0.65rem; color: ${trendColor || 'var(--text-tertiary)'};">${trendStr || (vol === 0 ? '-' : 'Total')}</div>
        </div>
      </div>
    `;
  });
  legendHtml += '</div>';

  const gradientBg = conicStops.length > 0 ? `conic-gradient(${conicStops.join(', ')})` : 'rgba(255,255,255,0.1)';

  const donutHtml = `
    <div style="display: flex; justify-content: center; align-items: center; padding: 10px;">
      <div style="position: relative; width: 160px; height: 160px; border-radius: 50%; background: ${gradientBg};">
        <div style="position: absolute; top: 25px; left: 25px; right: 25px; bottom: 25px; background: #1e293b; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
          <span style="font-size: 1.5rem; font-weight: 800; font-family: 'Rajdhani', sans-serif;">${formatT(totalVol)}</span>
          <span style="font-size: 0.65rem; color: var(--text-tertiary);">TOTAL</span>
        </div>
      </div>
    </div>
  `;

  chartEl.innerHTML = `
    <div style="display: flex; flex-wrap: wrap; gap: 15px; align-items: center; justify-content: center; width: 100%;">
      ${donutHtml}
      ${legendHtml}
    </div>
  `;
  fadeIn(chartEl);
}

export function openVolumeDetails(group) {
  const db = loadDB();
  const data = currentVolumeData[group];
  if (!data) return;

  document.getElementById('volDetGroup').textContent = group;

  const formatT = (kg) => kg >= 1000 ? (kg / 1000).toFixed(1).replace('.0', '') + 'T' : Math.round(kg) + 'kg';
  document.getElementById('volDetTotal').textContent = formatT(data.vol);

  const trendEl = document.getElementById('volDetTrend');
  if (data.trendStr) {
    trendEl.innerHTML = data.trendStr;
    trendEl.style.color = data.trendColor;
    trendEl.style.display = 'inline-block';
  } else {
    trendEl.style.display = 'none';
  }

  

// ---- CÁLCULO DE EVOLUÇÃO PARA O GRÁFICO ----
  const filterEl = document.getElementById('filterVolume');
  const mode = filterEl ? filterEl.value : '7';
  let historyDays = [];

  if (mode === 'all') {
    // Para 'Total', pegamos os últimos 15 treinos que tiveram esse grupo
    const allDates = Object.keys(db.historico).filter(d => db.historico[d].concluido).sort();
    historyDays = allDates.slice(-15);
  } else {
    const days = parseInt(mode);
    for (let i = days - 1; i >= 0; i--) {
      let d = new Date(); d.setDate(d.getDate() - i);
      historyDays.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  }

  const dailyHistory = historyDays.map(date => {
    let dayVol = 0;
    if (db.historico[date] && db.historico[date].concluido) {
      const treinos = db.historico[date].treinos || [db.historico[date].treino];
      treinos.forEach(t => {
        (db.fichas[t] || []).forEach(id => {
          const ex = getExById(db, id);
          if (ex && ex.grupoMuscular === group) {
            const s = parseInt(ex.series) || 0;
            const r = parseInt(ex.repeticoes) || 0;
            const c = parseFloat(String(ex.carga).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            const multi = ex.porLado ? 2 : 1;
            dayVol += (s * r * c * multi);
          }
        });
      });
    }
    return { data: date, valor: dayVol };
  });

  // Só renderiza pontos com volume > 0 para o gráfico de 'Total' ficar mais limpo
  const chartData = mode === 'all' ? dailyHistory.filter(h => h.valor > 0) : dailyHistory;

  const avgVol = chartData.length > 0 ? chartData.reduce((acc, h) => acc + h.valor, 0) / chartData.length : 0;
  document.getElementById('volDetAvg').textContent = `Média: ${formatT(avgVol)}`;

  renderVolumeLineChart('volDetChartContainer', chartData);

  const listEl = document.getElementById('volDetList');
  const exNames = data.breakdown ? Object.keys(data.breakdown).sort((a, b) => data.breakdown[b] - data.breakdown[a]) : [];

  if (exNames.length === 0) {
    listEl.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-tertiary); font-size: 0.85rem;">Nenhum exercício registrado neste período.</p>';
  } else {
    listEl.innerHTML = exNames.map(name => {
      const exVol = data.breakdown[name];
      const pct = ((exVol / data.vol) * 100).toFixed(0);
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 6px;">
          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 0.9rem; font-weight: 600;">${name}</span>
            <span style="font-size: 0.7rem; color: var(--text-tertiary);">${pct}% do grupo</span>
          </div>
          <span style="font-weight: bold; color: var(--primary-light);">${formatT(exVol)}</span>
        </div>
      `;
    }).join('');
  }

  openModal('modalVolumeDetails');
}

export function renderVolumeLineChart(containerId, history) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = container.clientWidth || 400;
  const height = container.clientHeight || 160;
  const padding = 20;

  if (!history || history.length < 2) {
    container.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-tertiary); font-size: 0.8rem; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; padding: 20px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" style="margin-bottom: 8px; color: var(--text-tertiary);">
          <path d="M3 3v18h18"/>
          <path d="m19 9-5 5-4-4-3 3"/>
      </svg>
      <span>Dados insuficientes para evolução.</span>
    </div>`;
    return;
  }

  const formatT = (kg) => kg >= 1000 ? (kg / 1000).toFixed(1).replace('.0', '') + 'T' : Math.round(kg) + 'kg';
  const vals = history.map(h => h.valor);
  const maxVal = Math.max(...vals, 1);
  const minVal = 0;

  const points = history.map((h, i) => {
    const x = padding + (i / (history.length - 1)) * (width - padding * 2);
    const y = height - padding - (h.valor / maxVal) * (height - padding * 2);
    return { x, y, valor: h.valor };
  });

  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const avgY = height - padding - (avg / maxVal) * (height - padding * 2);

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; overflow:visible;">
      <defs>
        <linearGradient id="volAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3" />
          <stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
        </linearGradient>
      </defs>
      
      <!-- Grid Horizontal -->
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.1)" />
      <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="4" />
      
      <!-- Grid Vertical para cada ponto -->
      ${points.map(p => `
        <line x1="${p.x}" y1="${padding}" x2="${p.x}" y2="${height - padding}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2" />
      `).join('')}
      
      <!-- Linha de Média -->
      <line x1="${padding}" y1="${avgY}" x2="${width - padding}" y2="${avgY}" stroke="var(--primary-light)" stroke-dasharray="4" stroke-opacity="0.3" />
      <text x="${width - padding + 5}" y="${avgY + 3}" fill="var(--primary-light)" font-size="10" opacity="0.5">Média</text>

      <!-- Área -->
      <path d="${areaD}" fill="url(#volAreaGrad)" />
      
      <!-- Linha Principal -->
      <path d="${pathD}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Pontos e Tooltips -->
      ${points.map((p, i) => {
        const isPeak = p.valor === maxVal;
        const isLast = i === points.length - 1;
        const radius = (isPeak || isLast) ? 4.5 : 3;
        const dateObj = new Date(history[i].data + 'T12:00:00');
        const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
        const showDate = i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2);
        
        return `
          <g>
            <circle cx="${p.x}" cy="${p.y}" r="${radius}" fill="${isPeak ? 'var(--primary)' : '#111827'}" stroke="var(--primary)" stroke-width="1.5" style="cursor:pointer;">
              <title>${formatT(p.valor)} em ${history[i].data}</title>
            </circle>
            ${(isPeak || isLast) ? `
              <text x="${p.x}" y="${p.y - 10}" fill="var(--text-secondary)" font-size="10" text-anchor="middle" font-weight="bold">${formatT(p.valor)}</text>
            ` : ''}
            ${showDate ? `
              <text x="${p.x}" y="${height - padding + 15}" fill="var(--text-tertiary)" font-size="9" text-anchor="middle">${dateStr}</text>
            ` : ''}
          </g>
        `;
      }).join('')}
    </svg>
  `;
}

export let currentRadarMode = 'mensal';



// ---- RADAR CHART ATRIBUTOS ----
let radarSideEffectsApplied = false;

function syncRadarButtons(mensalId, totalId, activeMode) {
  const mensal = document.getElementById(mensalId);
  const total = document.getElementById(totalId);
  if (mensal) {
    mensal.style.background = activeMode === 'mensal' ? 'var(--primary)' : 'transparent';
    mensal.style.color = activeMode === 'mensal' ? '#000' : 'var(--text-secondary)';
  }
  if (total) {
    total.style.background = activeMode === 'total' ? 'var(--primary)' : 'transparent';
    total.style.color = activeMode === 'total' ? '#000' : 'var(--text-secondary)';
  }
}

function rerenderAllRadarInstances(db) {
  radarSideEffectsApplied = false;
  renderRadarChart(db);
  if (document.getElementById('dashRadarChartContainer')) {
    renderRadarChart(db, {
      containerId: 'dashRadarChartContainer',
      mensalBtnId: 'btnDashRadarMensal',
      totalBtnId: 'btnDashRadarTotal',
      gradientId: 'dashRadarGrad',
    });
  }
}

export function renderRadarChart(db, options = {}) {
  const opts = Object.assign({
    containerId: 'radarChartContainer',
    mensalBtnId: 'btnRadarMensal',
    totalBtnId: 'btnRadarTotal',
    gradientId: 'radarGrad',
  }, options);

  const container = document.getElementById(opts.containerId);
  if (!container) return;

  if (!container.dataset.eventsSet) {
    document.getElementById(opts.mensalBtnId)?.addEventListener('click', () => {
      currentRadarMode = 'mensal';
      rerenderAllRadarInstances(db);
    });
    document.getElementById(opts.totalBtnId)?.addEventListener('click', () => {
      currentRadarMode = 'total';
      rerenderAllRadarInstances(db);
    });
    container.dataset.eventsSet = "true";
  }

  syncRadarButtons(opts.mensalBtnId, opts.totalBtnId, currentRadarMode);

  const stats = computeRadarStats(db);
  if (!radarSideEffectsApplied) {
    applyRadarSideEffects(db, stats);
    radarSideEffectsApplied = true;
  }

  container.innerHTML = buildRadarSvgHtml(stats, db, opts.gradientId);
  updateProfileArchetypeBadge(stats, db);
  fadeIn(container);
}

function computeRadarStats(db) {
  const stats = {
    forca: 0,
    resistencia: 0,
    velocidade: 0,
    flexibilidade: 0,
    equilibrio: 0,
    potencia: 0
  };

  const allCompleted = Object.keys(db.historico).filter(d => db.historico[d].concluido).sort().reverse();
  const completedDates = currentRadarMode === 'mensal' ? allCompleted.slice(0, 30) : allCompleted;

  let totalVol = 0;
  let totalReps = 0;
  let totalExCount = 0;
  let gruposVistos = new Set();
  let equilibrioCount = 0;
  let potenciaCount = 0;
  let cardioMins = 0;

  completedDates.forEach(date => {
    const hist = db.historico[date];
    const treinos = hist.treinos || [hist.treino];

    treinos.forEach(treino => {
      if (db.aerobicos && db.aerobicos[treino] && db.aerobicos[treino].tempo) {
        cardioMins += parseInt(db.aerobicos[treino].tempo) || 0;
      }

      const ids = db.fichas[treino] || [];
      ids.forEach(id => {
        const ex = getExById(db, id);
        if (ex) {
          totalExCount++;
          const s = parseInt(ex.series) || 0;
          const r = parseInt(ex.repeticoes) || 0;
          const c = parseFloat(String(ex.carga).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

          totalVol += (s * r * c * (ex.porLado ? 2 : 1));
          totalReps += (s * r);
          gruposVistos.add(ex.grupoMuscular);

          const tags = ex.tags || [];
          if (tags.includes('Unilateral') || tags.includes('Livre') || tags.includes('Mobilidade')) equilibrioCount++;
          if (tags.includes('Explosão') || (tags.includes('Multiarticular') && ex.grupoMuscular === 'Pernas')) potenciaCount++;
        }
      });
    });
  });

  const cargaMediaPerRep = totalReps > 0 ? (totalVol / totalReps) : 0;
  stats.forca = Math.min(100, (cargaMediaPerRep / 25) * 100);

  const repsMedia = totalExCount > 0 ? (totalReps / totalExCount) : 0;
  const cardioBonus = (cardioMins / (completedDates.length || 1)) * 2;
  stats.resistencia = Math.min(100, ((repsMedia / 35) * 100) + cardioBonus);

  stats.flexibilidade = Math.min(100, (gruposVistos.size / 7) * 100);

  stats.equilibrio = Math.min(100, ((equilibrioCount / (totalExCount || 1)) * 2) * 100);

  stats.potencia = Math.min(100, ((potenciaCount / (totalExCount || 1)) * 2.5) * 100);

  let constanciaScore = 0;
  if (currentRadarMode === 'mensal') {
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    const treinosUltimos30Dias = allCompleted.filter(d => new Date(d + 'T12:00:00') >= trintaDiasAtras).length;
    constanciaScore = Math.min(50, (treinosUltimos30Dias / 20) * 50);
  } else {
    if (allCompleted.length > 0) {
      const start = new Date(allCompleted[allCompleted.length - 1] + 'T12:00:00');
      const end = new Date(allCompleted[0] + 'T12:00:00');
      const monthsActive = Math.max(1, (end - start) / (1000 * 60 * 60 * 24 * 30));
      const avgWorkoutsPerMonth = allCompleted.length / monthsActive;
      constanciaScore = Math.min(50, (avgWorkoutsPerMonth / 20) * 50);
    }
  }

  let totalSeriesFoco = 0;
  let totalTempoFoco = 0;
  completedDates.forEach(date => {
    const hist = db.historico[date];
    if (hist.duracaoFoco) {
      totalTempoFoco += hist.duracaoFoco;
      const treinos = hist.treinos || [hist.treino];
      treinos.forEach(t => {
        (db.fichas[t] || []).forEach(id => {
          const ex = getExById(db, id);
          if (ex) totalSeriesFoco += (parseInt(ex.series) || 0);
        });
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

function applyRadarSideEffects(db, stats) {
  if (!db.conquistas) db.conquistas = [];
  let saveNeeded = false;

  const checkAchievement = (id, icon, name, desc) => {
    if (!db.conquistas.find(c => (typeof c === 'object' ? c.id === id : c === id))) {
      db.conquistas.push({ id, icon, titulo: name, desc, data: todayLabel() });
      saveNeeded = true;
    }
  };

  if (stats.forca >= 90) checkAchievement('r_ogro', '🦍', 'Força de Ogro', 'Atingiu 90+ de Força no Radar Fit.');
  if (stats.resistencia >= 90) checkAchievement('r_pulmao', '🫁', 'Pulmão de Aço', 'Atingiu 90+ de Resistência no Radar Fit.');
  if (stats.flexibilidade >= 90) checkAchievement('r_davinci', '🎨', 'O Simétrico', 'Atingiu 90+ de Simetria no Radar Fit.');
  if (stats.equilibrio >= 90) checkAchievement('r_ninja', '🥷', 'Mestre Ninja', 'Atingiu 90+ de Equilíbrio no Radar Fit.');
  if (stats.potencia >= 90) checkAchievement('r_foguete', '🚀', 'Modo Foguete', 'Atingiu 90+ de Potência no Radar Fit.');
  if (stats.velocidade >= 90) checkAchievement('r_maquina', '⚙️', 'A Máquina', 'Atingiu 90+ de Intensidade no Radar Fit.');

  const allStats = [stats.forca, stats.resistencia, stats.velocidade, stats.flexibilidade, stats.equilibrio, stats.potencia];
  if (!db.radarTier) db.radarTier = 1;

  if (allStats.every(s => s >= 95) && db.radarTier < 5) {
    db.radarTier++;
    const tierNames = ['', '', 'Prata', 'Ouro', 'Diamante', 'Ametista'];
    checkAchievement('r_tier' + db.radarTier, '🌟', `Radar ${tierNames[db.radarTier]}`, `Alcançou o Tier ${db.radarTier} do Radar Fit.`);
    saveNeeded = true;
  }

  if (saveNeeded) saveDB(db);
}

function buildRadarSvgHtml(stats, db, gradientId) {
  const keys = ['forca', 'resistencia', 'velocidade', 'flexibilidade', 'equilibrio', 'potencia'];

  const adjustedStats = {};
  keys.forEach(k => {
    adjustedStats[k] = Math.min(100, stats[k] / db.radarTier);
  });

  const size = 300;
  const center = size / 2;
  const radius = size * 0.35;
  const labels = ['FORÇA', 'RESISTÊNCIA', 'INTENSIDADE', 'SIMETRIA', 'EQUILÍBRIO', 'POTÊNCIA'];
  const points = [];

  keys.forEach((key, i) => {
    const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
    const val = Math.max(10, adjustedStats[key]);
    const x = center + radius * (val / 100) * Math.cos(angle);
    const y = center + radius * (val / 100) * Math.sin(angle);
    points.push(`${x},${y}`);
  });

  let grids = '';
  [0.2, 0.4, 0.6, 0.8, 1].forEach(level => {
    const gridPoints = keys.map((_, i) => {
      const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
      return `${center + radius * level * Math.cos(angle)},${center + radius * level * Math.sin(angle)}`;
    }).join(' ');
    grids += `<polygon points="${gridPoints}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />`;
  });

  let labelsHtml = '';
  keys.forEach((key, i) => {
    const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
    const x = center + (radius + 25) * Math.cos(angle);
    const y = center + (radius + 20) * Math.sin(angle);
    const anchor = x > center ? 'start' : (x < center ? 'end' : 'middle');
    labelsHtml += `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="var(--text-tertiary)" font-size="10" font-weight="700" style="letter-spacing:1px;">${labels[i]}</text>`;
    labelsHtml += `<text x="${x}" y="${y + 12}" text-anchor="${anchor}" fill="var(--primary-light)" font-size="12" font-weight="900">${Math.round(adjustedStats[key])}</text>`;
  });

  const tierColors = {
    1: { stroke: 'var(--primary-light)', fill: 'var(--primary)', name: 'BRONZE' },
    2: { stroke: '#cbd5e1', fill: '#94a3b8', name: 'PRATA' },
    3: { stroke: '#fde047', fill: '#fbbf24', name: 'OURO' },
    4: { stroke: '#67e8f9', fill: '#06b6d4', name: 'DIAMANTE' },
    5: { stroke: '#d8b4fe', fill: '#a855f7', name: 'AMETISTA' }
  };
  const tierTheme = tierColors[db.radarTier] || tierColors[1];

  return `
    <div class="radar-wrapper" style="position:relative;">
      ${db.radarTier > 1 ? `<div style="position:absolute; top: -10px; right: 0; background: ${tierTheme.fill}; color: #000; font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; font-weight: 800; letter-spacing: 1px;">TIER ${db.radarTier}: ${tierTheme.name}</div>` : ''}
      <svg viewBox="0 0 ${size} ${size}" style="width:100%; height:auto; overflow:visible;">
        <defs>
          <radialGradient id="${gradientId}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${tierTheme.fill}" stop-opacity="0.2" />
            <stop offset="100%" stop-color="${tierTheme.fill}" stop-opacity="0.6" />
          </radialGradient>
        </defs>
        ${grids}
        ${keys.map((_, i) => {
    const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
    return `<line x1="${center}" y1="${center}" x2="${center + radius * Math.cos(angle)}" y2="${center + radius * Math.sin(angle)}" stroke="rgba(255,255,255,0.05)" stroke-width="1" />`;
  }).join('')}
        <polygon points="${points.join(' ')}" fill="url(#${gradientId})" stroke="${tierTheme.stroke}" stroke-width="2" style="filter: drop-shadow(0 0 8px ${tierTheme.fill}40);" />
        ${labelsHtml}
      </svg>
    </div>
  `;
}

function updateProfileArchetypeBadge(stats, db) {
  const classNames = {
    forca: { name: 'Bárbaro', icon: '🪓', color: '#ef4444' },
    resistencia: { name: 'Maratonista', icon: '🫁', color: '#10b981' },
    flexibilidade: { name: 'Monge', icon: '🧘', color: '#0ea5e9' },
    equilibrio: { name: 'Ninja', icon: '🥷', color: '#a855f7' },
    potencia: { name: 'Foguete', icon: '🚀', color: '#f59e0b' },
    velocidade: { name: 'Máquina', icon: '⚙️', color: '#64748b' }
  };
  let maxStat = '';
  let maxVal = -1;
  let minVal = 101;

  const rawStats = {
    forca: stats.forca * db.radarTier,
    resistencia: stats.resistencia * db.radarTier,
    flexibilidade: stats.flexibilidade * db.radarTier,
    equilibrio: stats.equilibrio * db.radarTier,
    potencia: stats.potencia * db.radarTier,
    velocidade: stats.velocidade * db.radarTier
  };

  Object.keys(rawStats).forEach(k => {
    if (rawStats[k] > maxVal) { maxVal = rawStats[k]; maxStat = k; }
    if (rawStats[k] < minVal) { minVal = rawStats[k]; }
  });

  let archetype = classNames[maxStat];
  if (maxVal - minVal <= 20 && maxVal > 40) {
    archetype = { name: 'Versátil', icon: '⚖️', color: '#8b5cf6' };
  } else if (maxVal < 20) {
    archetype = { name: 'Novato', icon: '🌱', color: '#22c55e' };
  }

  const badgeEl = document.getElementById('profileArchetype');
  if (badgeEl) {
    badgeEl.innerHTML = `${archetype.icon} ${archetype.name}`;
    badgeEl.style.color = archetype.color;
    badgeEl.style.borderColor = `${archetype.color}40`;
    badgeEl.style.display = 'inline-flex';
  }
}

export function getBadgeDefinitions(db) {
  const completedDates = Object.keys(db.historico).filter(d => db.historico[d].concluido);
  const totalWorkouts = completedDates.length;
  const streak = getStreak(db);

  let maxDayVol = 0;
  Object.keys(db.historico).forEach(date => {
    if (db.historico[date].concluido) {
      const ids = db.fichas[db.historico[date].treino] || [];
      let dayVol = 0;
      ids.forEach(id => {
        const ex = getExById(db, id);
        if (ex) {
          const s = parseInt(ex.series) || 0;
          const r = parseInt(ex.repeticoes) || 0;
          const c = parseFloat(String(ex.carga).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          dayVol += (s * r * c * (ex.porLado ? 2 : 1));
        }
      });
      if (dayVol > maxDayVol) maxDayVol = dayVol;
    }
  });

  const xp = totalWorkouts * 10;
  const currentLevel = Math.floor(xp / 50) + 1;

  const isDevMode = localStorage.getItem('academia_dev_mode') === 'true';

  const badges = [
    { id: 'b1', icon: '🆕', name: 'Primeiro Passo', desc: 'Concluiu o primeiro treino.', check: isDevMode ? true : (totalWorkouts >= 1), naturalCheck: totalWorkouts >= 1 },
    { id: 'b2', icon: '🔥', name: 'Constância', desc: '7 dias de ofensiva.', check: isDevMode ? true : (streak >= 7), naturalCheck: streak >= 7 },
    { id: 'b3', icon: '🏆', name: 'Veterano', desc: '30 treinos concluídos.', check: isDevMode ? true : (totalWorkouts >= 30), naturalCheck: totalWorkouts >= 30 },
    { id: 'b4', icon: '🏋️', name: 'Força Bruta', desc: 'Volume > 5.000kg num dia.', check: isDevMode ? true : (maxDayVol >= 5000), naturalCheck: maxDayVol >= 5000 },
    { id: 'b5', icon: '💎', name: 'Elite', desc: 'Chegou ao Nível 10.', check: isDevMode ? true : (currentLevel >= 10), naturalCheck: currentLevel >= 10 },
    { id: 'b6', icon: '⚡', name: 'Relâmpago', desc: '15 treinos no mês.', check: isDevMode ? true : (totalWorkouts >= 15), naturalCheck: totalWorkouts >= 15 }
  ];

  const specialBadges = [];
  const specList = [
    { id: 'r_ogro', icon: '🦍', name: 'Força de Ogro', desc: 'Atingiu 90+ de Força no Radar Fit.' },
    { id: 'r_pulmao', icon: '🫁', name: 'Pulmão de Aço', desc: 'Atingiu 90+ de Resistência no Radar Fit.' },
    { id: 'r_davinci', icon: '🎨', name: 'O Simétrico', desc: 'Atingiu 90+ de Simetria no Radar Fit.' },
    { id: 'r_ninja', icon: '🥷', name: 'Mestre Ninja', desc: 'Atingiu 90+ de Equilíbrio no Radar Fit.' },
    { id: 'r_foguete', icon: '🚀', name: 'Modo Foguete', desc: 'Atingiu 90+ de Potência no Radar Fit.' },
    { id: 'r_maquina', icon: '⚙️', name: 'A Máquina', desc: 'Atingiu 90+ de Intensidade no Radar Fit.' },
    { id: 'r_tier2', icon: '🌟', name: 'Radar Prata', desc: 'Alcançou o Tier 2 do Radar Fit.' },
    { id: 'r_tier3', icon: '🌟', name: 'Radar Ouro', desc: 'Alcançou o Tier 3 do Radar Fit.' },
    { id: 'r_tier4', icon: '🌟', name: 'Radar Diamante', desc: 'Alcançou o Tier 4 do Radar Fit.' },
    { id: 'r_tier5', icon: '🌟', name: 'Radar Ametista', desc: 'Alcançou o Tier 5 do Radar Fit.' },
  ];

  // Add actual conquests
  (db.conquistas || []).forEach(c => {
    if (typeof c === 'object') {
      specialBadges.push({
        id: c.id,
        icon: c.icon || '🔱',
        name: c.titulo || c.name,
        desc: `${c.desc} (${c.data})`,
        check: true,
        naturalCheck: true,
        special: true
      });
    } else if (typeof c === 'string') {
      const spec = specList.find(s => s.id === c);
      if (spec && !specialBadges.some(sb => sb.id === c)) {
        specialBadges.push({
          id: spec.id,
          icon: spec.icon,
          name: spec.name,
          desc: spec.desc,
          check: true,
          naturalCheck: true,
          special: true
        });
      }
    }
  });

  if (isDevMode) {
    // In dev mode, ensure all special badges are present and checked
    specList.forEach(s => {
      if (!specialBadges.some(sb => sb.id === s.id)) {
        specialBadges.push({
          id: s.id,
          icon: s.icon,
          name: s.name,
          desc: s.desc,
          check: true,
          naturalCheck: false,
          special: true
        });
      }
    });
  }

  return [...badges, ...specialBadges];
}

export function renderSelectedEmblems(db) {
  const slots = document.querySelectorAll('.emblem-slot');
  if (!slots.length) return;

  const allBadges = getBadgeDefinitions(db);
  const selected = db.selectedEmblems || [];

  slots.forEach((slot, index) => {
    const id = selected[index];
    const badge = allBadges.find(b => b.id === id);
    if (badge && badge.check) {
      slot.innerHTML = badge.icon;
      slot.classList.remove('empty');
      slot.title = `Conquista: ${badge.name}`;
    } else {
      slot.innerHTML = '';
      slot.classList.add('empty');
      slot.title = 'Slot de Emblema (Disponível em breve)';
    }

    // Parte funcional (fixar/remover) desativada conforme pedido
    slot.onclick = null;
  });
}

export function renderBadges(db) {
  const grid = document.getElementById('badgesGrid');
  if (!grid) return;

  const allBadges = getBadgeDefinitions(db);

  // Detectar novas conquistas (apenas para as fixas b1-b6)
  let newlyUnlocked = false;
  allBadges.forEach(b => {
    if (!b.special && b.naturalCheck && !db.conquistas.includes(b.id)) {
      db.conquistas.push(b.id);
      newlyUnlocked = b;
    }
  });

  if (newlyUnlocked) {
    saveDB(db);
    setTimeout(() => openShareBadge(newlyUnlocked), 1000);
  }

  grid.innerHTML = allBadges.map(b => {
    const isUnlocked = b.check || db.conquistas.includes(b.id);
    return `
      <div class="badge-item ${isUnlocked ? 'unlocked' : 'locked'} ${b.special ? 'special' : ''}" 
           title="${b.desc}" data-id="${b.id}">
        <div class="badge-icon">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
      </div>
    `;
  }).join('');
  fadeIn(grid);

  grid.querySelectorAll('.badge-item.unlocked').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      const badge = allBadges.find(b => b.id === id);
      if (badge) {
        openShareBadge(badge);
      }
    });
  });
}

export function openShareBadge(badge) {
  document.getElementById('shareBadgeDate').textContent = todayLabel().toUpperCase();
  document.getElementById('shareBadgeIcon').textContent = badge.icon;
  document.getElementById('shareBadgeName').textContent = badge.name.toUpperCase();
  document.getElementById('shareBadgeDesc').textContent = badge.desc;

  // Frase Aleatória
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.querySelectorAll('.share-quote').forEach(q => q.textContent = `"${quote}"`);

  // Mostrar apenas o card de conquista
  document.getElementById('shareCard').style.display = 'none';
  document.getElementById('shareCardBadge').style.display = 'flex';

  openModal('modalShare');
}

// Expor para o escopo global para uso em inline onclicks
window.openVolumeDetails = openVolumeDetails;
