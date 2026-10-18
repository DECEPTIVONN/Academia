import { determineTreinoDoDia, getExById, loadDB, saveDB, setTodayTreino, showToast, today } from './db.js';
import { openModal, closeModal, renderFicha, startInterval, initGlobalTimer } from './secao-ficha.js';
import { applyProfileCustomization } from './secao-customizacao.js';
import { renderRadarChart } from './secao-progresso.js';

function getAvailableWorkouts(db) {
  return Object.keys(db.fichas || {}).filter((letter) => {
    const hasExercises = (db.fichas[letter] || []).filter(Boolean).length > 0;
    const hasCardio = Boolean(db.aerobicos?.[letter]?.tipo);
    return hasExercises || hasCardio;
  });
}

function normalizeWorkoutSuggestion(db, treino) {
  const available = getAvailableWorkouts(db);
  if (!available.length) return treino || 'A';
  return available.includes(treino) ? treino : available[0];
}

function getWorkoutSummary(db, treino) {
  const exerciseIds = db.fichas?.[treino] || [];
  const exercicios = exerciseIds.map((id) => getExById(db, id)).filter(Boolean);
  const hasCardio = Boolean(db.aerobicos?.[treino]?.tipo);
  return {
    treino,
    exercicios,
    total: exercicios.length + (hasCardio ? 1 : 0),
    hasCardio,
  };
}

function getDashboardXp(db) {
  return Object.keys(db.historico || {}).filter((date) => db.historico[date]?.concluido).length * 10;
}

function getDashboardLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

function getDashboardLeague(level) {
  if (level >= 10) return 'Lenda de Elite';
  if (level >= 7) return 'Liga Titânica';
  if (level >= 4) return 'Forja Mestre';
  return 'Forja Arcana';
}

function getCycleProgress(db) {
  const breakdown = db.currentCycleBreakdown || {};
  const total = Object.values(breakdown).reduce((sum, value) => sum + (Number(value) || 0), 0);
  return total || db.currentFichaWorkouts || 0;
}

export function getDashboardSuggestion(db) {
  const t = today();
  if (db.dashboard?.suggestedWorkout && db.dashboard.lastSuggestionDate === t) {
    return normalizeWorkoutSuggestion(db, db.dashboard.suggestedWorkout);
  }
  const activeToday = db.historico[t]?.treino;
  return normalizeWorkoutSuggestion(db, activeToday || determineTreinoDoDia(db));
}

function ensureProgressSegments() {
  const container = document.getElementById('dashProgressSegments');
  if (!container || container.children.length) return;
  container.innerHTML = Array.from({ length: 14 }, () => '<span></span>').join('');
}

function renderDashboardSheet(db, activeWorkout) {
  const tabs = document.getElementById('dashSheetTabs');
  const body = document.getElementById('dashSheetBody');
  if (!tabs || !body) return;

  const workouts = getAvailableWorkouts(db);

  tabs.innerHTML = workouts.map((letter) => {
    if (letter === activeWorkout) {
      return `
        <button class="dash-mini-deck__tab active" data-workout="${letter}">
          <svg class="dash-mini-deck__tab-shield" viewBox="0 0 100 115">
            <path d="M 15 8 L 85 8 L 85 62 L 50 105 L 15 62 Z" fill="rgba(139, 92, 246, 0.18)" stroke="#8b5cf6" stroke-width="6" stroke-linejoin="round" />
          </svg>
          <span class="dash-mini-deck__tab-letter">${letter}</span>
        </button>
      `;
    } else {
      return `<button class="dash-mini-deck__tab" data-workout="${letter}">${letter}</button>`;
    }
  }).join('');

  tabs.querySelectorAll('.dash-mini-deck__tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const liveDb = loadDB();
      liveDb.dashboard.suggestedWorkout = tab.dataset.workout;
      liveDb.dashboard.lastSuggestionDate = today();
      setTodayTreino(liveDb, tab.dataset.workout);
      saveDB(liveDb);
      renderDashboard(liveDb);
      renderDashboardSheet(liveDb, tab.dataset.workout);
      renderFicha(liveDb);
    });
  });

  const summary = getWorkoutSummary(db, activeWorkout);

  if (!summary.total) {
    body.innerHTML = '<div class="dash-mini-deck__empty">Nenhuma ficha pronta ainda.<br>Monte um treino na aba <b>Treinos</b>.</div>';
    return;
  }

  // Build Royale 4-column grid — matching Montar Ficha visual
  body.innerHTML = `
    <div class="dash-mini-deck__grid">
      ${summary.exercicios.map((ex, index) => {
        const imgHtml = ex.imagem
          ? `<img src="${ex.imagem}" alt="${ex.nome}" onerror="this.onerror=null; this.parentElement.style.background='transparent'; this.outerHTML='<div class=&quot;premium-placeholder&quot;><i class=&quot;fas fa-dumbbell&quot;></i><span>EXERCÍCIO</span></div>';">`
          : '<div class="premium-placeholder"><i class="fas fa-dumbbell"></i><span>EXERCÍCIO</span></div>';
        return `
          <div class="deck-card card-${ex.grupoMuscular} stagger-item" data-id="${ex.id}" style="--item-index: ${index}">
            <div class="deck-card-header">${ex.grupoMuscular}</div>
            <div class="deck-card-img" ${ex.imagem ? '' : 'style="background: transparent;"'}>${imgHtml}</div>
            <div class="deck-card-info">
              <div class="deck-card-name">${ex.nome}</div>
              <div class="deck-card-level">Séries: ${ex.series} × ${ex.repeticoes}</div>
            </div>
          </div>`;
      }).join('')}
    </div>
  `;

  // Update footer stats
  const volumeEl = document.getElementById('dashMiniVolume');
  const maestriaEl = document.getElementById('dashMiniMaestria');
  const cardioEl = document.getElementById('dashMiniCardio');

  if (volumeEl) {
    const totalVol = summary.exercicios.reduce((sum, ex) => {
      const carga = parseFloat(ex.carga) || 0;
      const series = parseInt(ex.series) || 0;
      const reps = parseInt(ex.repeticoes) || 0;
      return sum + (carga * series * reps);
    }, 0);
    const avgVol = summary.exercicios.length ? (totalVol / summary.exercicios.length / 1000).toFixed(1) : '0.0';
    volumeEl.textContent = avgVol;
  }

  if (maestriaEl) {
    const maestrias = db.maestrias || {};
    const total = summary.exercicios.length;
    const mastered = summary.exercicios.filter(ex => {
      const m = maestrias[ex.id];
      return m && m.nivel >= 3;
    }).length;
    maestriaEl.textContent = `${mastered}/${total}`;
  }

  if (cardioEl) {
    const ae = db.aerobicos?.[activeWorkout];
    const subEl = document.getElementById('dashMiniCardioSub');
    if (ae?.tipo) {
      cardioEl.textContent = ae.tipo.toUpperCase();
      if (subEl) subEl.textContent = `${ae.vel || '--'} km/h · ${ae.tempo || '--'} min`;
    } else {
      cardioEl.textContent = '--';
      if (subEl) subEl.textContent = 'Configurar Cardio';
    }
  }
}

export function renderDashboard(db) {
  const suggestion = getDashboardSuggestion(db);
  const summary = getWorkoutSummary(db, suggestion);
  const xp = getDashboardXp(db);
  const level = getDashboardLevel(xp);
  const levelProgress = xp % 100;
  const profile = db.profileCustomization || {};

  ensureProgressSegments();

  const avatarImg = document.getElementById('dashAvatarImg');
  const userName = document.getElementById('dashUserName');
  const userXp = document.getElementById('dashUserXp');
  const userLiga = document.getElementById('dashLiga');
  const levelEl = document.getElementById('dashLevel');
  const progressFill = document.getElementById('dashProgressFill');
  const wkBadge = document.getElementById('dashWkBadge');
  const wkDetail = document.getElementById('dashWkDetail');
  const cycleVal = document.getElementById('dashCycleVal');
  const trophiesEl = document.getElementById('dashProfileTrophies');
  const emblemsValue = document.getElementById('dashEmblemsValue');
  const missionsProgressFill = document.getElementById('dashMissionsProgressFill');
  const workoutThumb = document.getElementById('dashWorkoutThumb');

  if (avatarImg) {
    const seed = encodeURIComponent(profile.avatarSeed || profile.nome || 'Academia');
    avatarImg.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  }
  if (userName) userName.textContent = profile.nome || 'ATLETA';
  if (userLiga) userLiga.textContent = getDashboardLeague(level);
  if (userXp) userXp.textContent = `${xp} XP`;
  if (levelEl) levelEl.textContent = String(level);
  if (progressFill) progressFill.style.width = `${Math.min(levelProgress, 100)}%`;
  
  const workoutLetterEl = document.getElementById('dashWorkoutLetter');
  if (workoutLetterEl) {
    workoutLetterEl.textContent = suggestion;
  }
  
  const firstEx = summary.exercicios[0];
  if (wkBadge) {
    const exLevel = firstEx ? (db.maestrias?.[firstEx.id]?.nivel || 1) : 1;
    wkBadge.textContent = String(exLevel);
  }
  
  const workoutName = document.getElementById('dashWorkoutName');
  if (workoutName) {
    const rawName = firstEx ? firstEx.nome : 'NENHUM';
    workoutName.textContent = rawName.length > 15 ? rawName.slice(0, 13) + '.' : rawName;
  }

  if (wkDetail) wkDetail.textContent = `${summary.total} ex`;
  const cycleProgress = getCycleProgress(db);
  const cycleTotal = 30;
  const cyclePercent = Math.min((cycleProgress / cycleTotal) * 100, 100);

  if (cycleVal) cycleVal.textContent = `${cycleProgress}/${cycleTotal}`;
  if (trophiesEl) trophiesEl.textContent = String(Object.keys(db.historico || {}).filter((date) => db.historico[date]?.concluido).length * 10);
  if (emblemsValue) emblemsValue.textContent = `${cycleProgress}/${cycleTotal}`;
  if (missionsProgressFill) {
    // Delay slightly so CSS transition is visible on first render
    requestAnimationFrame(() => {
      missionsProgressFill.style.width = `${cyclePercent}%`;
    });
  }
  const imgContainer = document.querySelector('.dash-workout-img-container');
  if (imgContainer) {
    const badgeHtml = `
      <div class="dash-workout-letter-badge">
          <span id="dashWorkoutLetter">${suggestion}</span>
      </div>`;
    
    if (firstEx && firstEx.imagem) {
      imgContainer.style.background = '';
      imgContainer.innerHTML = `
        <img id="dashWorkoutThumb" src="${firstEx.imagem}" alt="${firstEx.nome}" onerror="this.onerror=null; this.parentElement.style.background='transparent'; this.outerHTML='<div class=&quot;premium-placeholder&quot;><i class=&quot;fas fa-dumbbell&quot;></i><span>EXERCÍCIO</span></div>';">
        ${badgeHtml}
      `;
    } else {
      imgContainer.style.background = 'transparent';
      imgContainer.innerHTML = `
        <div class="premium-placeholder"><i class="fas fa-dumbbell"></i><span>EXERCÍCIO</span></div>
        ${badgeHtml}
      `;
    }
  }

  // Renderizar Radar Tático no widget central (substituiu a imagem da Forja)
  if (document.getElementById('dashRadarChartContainer')) {
    renderRadarChart(db, {
      containerId: 'dashRadarChartContainer',
      mensalBtnId: 'btnDashRadarMensal',
      totalBtnId: 'btnDashRadarTotal',
      gradientId: 'dashRadarGrad',
    });
  }

  // Sincronizar banner e customizações de perfil
  applyProfileCustomization(db);
}

function startWorkoutFromDashboard(db) {
  const treino = getDashboardSuggestion(db);

  // IMPORTANTE: marca a Ficha como "em andamento" ANTES de qualquer outra
  // operação que possa chamar saveDB() (ex: setTodayTreino abaixo). Isso
  // garante que o save final contenha a flag, mesmo que algum save
  // intermediário aconteça no meio do caminho.
  db.fichaEmAndamento = true;
  db.fichaEmAndamentoDate = today();

  setTodayTreino(db, treino);
  renderFicha(db);

  if (!localStorage.getItem('workout_start_time')) {
    localStorage.setItem('workout_start_time', Date.now());
    initGlobalTimer(db);
  }

  // Garante persistência final (caso algum save intermediário tenha
  // sobrescrito o flag).
  db.fichaEmAndamento = true;
  db.fichaEmAndamentoDate = today();
  saveDB(db);

  // v3.2.0+: a Ficha virou overlay fullscreen. Abre o overlay
  // diretamente (com fade-in suave) em vez de navegar no strip.
  // O overlay já é full-bleed e abre no topo, então não precisamos
  // mais do scrollIntoView.
  if (typeof window.openFichaOverlay === 'function') {
    window.openFichaOverlay();
  } else {
    // Fallback enquanto o módulo da ficha-overlay não terminou de carregar.
    window._transitionTo('ficha');
  }
}

export function initDashboard(db) {
  if (!document.getElementById('dashBtnIniciar')) return;

  renderDashboard(db);
  renderDashboardSheet(db, getDashboardSuggestion(db));

  document.getElementById('dashWorkoutCard')?.addEventListener('click', () => {
    const liveDb = loadDB();
    renderDashboardSheet(liveDb, getDashboardSuggestion(liveDb));
    openModal('modalSeletorFichas');
  });

  document.getElementById('dashBtnSeletorCrown')?.addEventListener('click', () => {
    const liveDb = loadDB();
    renderDashboardSheet(liveDb, getDashboardSuggestion(liveDb));
    openModal('modalSeletorFichas');
  });

  document.getElementById('dashBtnIniciar')?.addEventListener('click', () => startWorkoutFromDashboard(loadDB()));


  document.getElementById('dashMiniSwapBtn')?.addEventListener('click', () => {
    const liveDb = loadDB();
    const workouts = getAvailableWorkouts(liveDb);
    if (workouts.length <= 1) return;
    const current = getDashboardSuggestion(liveDb);
    const currentIndex = workouts.indexOf(current);
    const nextIndex = (currentIndex + 1) % workouts.length;
    const nextWorkout = workouts[nextIndex];
    
    liveDb.dashboard.suggestedWorkout = nextWorkout;
    liveDb.dashboard.lastSuggestionDate = today();
    setTodayTreino(liveDb, nextWorkout);
    saveDB(liveDb);
    renderDashboard(liveDb);
    renderDashboardSheet(liveDb, nextWorkout);
    renderFicha(liveDb);
    showToast('Ficha alternada para Treino ' + nextWorkout, 'info');
  });

  // Close modal on backdrop click
  document.getElementById('modalSeletorFichas')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) closeModal('modalSeletorFichas');
  });

  document.getElementById('dashBtnMissoes')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof window.openMissionsOverlay === 'function') {
      window.openMissionsOverlay();
    }
  });
  document.getElementById('dashBtnNoticias')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof window.openNewsOverlay === 'function') {
      window.openNewsOverlay();
    }
  });
  document.getElementById('dashBtnMenu')?.addEventListener('click', (e) => {
    e.stopPropagation();
    // Botão Menu do header do dashboard: agora é decorativo.
    // O Perfil é acessado apenas pelo cartão de visitas (#dashProfileCard).
    // Mantemos o handler para não propagar o clique ao cartão (event.stopPropagation).
  });

  document.addEventListener('sectionchange', (event) => {
    if (event.detail?.section === 'dashboard') {
      const liveDb = loadDB();
      renderDashboard(liveDb);
      renderDashboardSheet(liveDb, getDashboardSuggestion(liveDb));
    }
  });
}
