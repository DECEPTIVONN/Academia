'use strict';
// =============================================
// ACADEMIA — TREINO.JS
// Fichas de treino com localStorage
// =============================================

const DB_KEY = 'academia_treino';

// Dados padrão
const DEFAULT_EXERCISES = [
  {id:'ex-a1',nome:'Supino Articulado',grupoMuscular:'Peito',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Supino Articulado.gif'},
  {id:'ex-a2',nome:'Fly',grupoMuscular:'Peito',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Fly.webp'},
  {id:'ex-a3',nome:'Supino Vertical',grupoMuscular:'Ombros',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Supino Vertical.gif'},
  {id:'ex-a4',nome:'Crucifixo',grupoMuscular:'Peito',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Crucifixo.gif'},
  {id:'ex-a5',nome:'Leg Press 180° + Banco Extenso',grupoMuscular:'Pernas',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Leg Press 180° + Banco Extenso.gif'},
  {id:'ex-a6',nome:'Desenvolvimento Máquina',grupoMuscular:'Ombros',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Desenvolvimento Máquina.gif'},
  {id:'ex-a7',nome:'Tríceps Testa + Pull Over',grupoMuscular:'Tríceps',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Tríceps Testa + Pull Over.gif'},
  {id:'ex-a8',nome:'Supra Prancha',grupoMuscular:'Core',series:3,repeticoes:'15',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Supra Prancha.gif'},
  {id:'ex-b1',nome:'Puxada Frente',grupoMuscular:'Costas',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Puxada Frente.gif'},
  {id:'ex-b2',nome:'Remada Baixa',grupoMuscular:'Costas',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Remada Baixa.gif'},
  {id:'ex-b3',nome:'Puxada Articulada',grupoMuscular:'Costas',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Puxada Articulada.gif'},
  {id:'ex-b4',nome:'Elevação Lateral',grupoMuscular:'Ombros',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Elevação Lateral.gif'},
  {id:'ex-b5',nome:'Banco Flexor',grupoMuscular:'Pernas',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Banco Flexor.gif'},
  {id:'ex-b6',nome:'Remada Alta',grupoMuscular:'Costas',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Remada Alta.gif'},
  {id:'ex-b7',nome:'Rosca Scoott',grupoMuscular:'Bíceps',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Rosca Scott.gif'},
  {id:'ex-b8',nome:'Infra Paralelo',grupoMuscular:'Peito',series:3,repeticoes:'15',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Infra Paralelo.gif'},
  {id:'ex-supra-solo',nome:'Supra solo',grupoMuscular:'Core',series:3,repeticoes:'15',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Supra solo.gif'},
  {id:'ex-burrinho',nome:'Burrinho',grupoMuscular:'Pernas',series:3,repeticoes:'12',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Burrinho.gif'},
  {id:'ex-tric-pulley',nome:'Tric Pulley',grupoMuscular:'Tríceps',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Tric Pulley.gif'},
  {id:'ex-banco-abdutor',nome:'Banco Abdutor',grupoMuscular:'Pernas',series:3,repeticoes:'10',carga:'',descanso:30,imagem:'./Assets/exerciciosgif/Banco Abdutor.gif'},
];

const DEFAULT_FICHAS = {
  A: ['ex-a1', 'ex-a2', 'ex-a5', 'ex-a6', 'ex-a8'],
  B: ['ex-b1', 'ex-b2', 'ex-b5', 'ex-b4', 'ex-b7'],
  C: [],
  D: [],
  E: []
};

// ---- DB ----
function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return initDB();
    const db = JSON.parse(raw);

    // Sincronizar imagens padrão caso estejam ausentes ou diferentes
    let updated = false;
    if (db.exercicios) {
      db.exercicios.forEach(ex => {
        const defaultEx = DEFAULT_EXERCISES.find(d => d.id === ex.id);
        if (defaultEx && defaultEx.imagem && ex.imagem !== defaultEx.imagem) {
          ex.imagem = defaultEx.imagem;
          updated = true;
        }
        if (ex.descanso === undefined) {
          ex.descanso = (defaultEx && defaultEx.descanso !== undefined) ? defaultEx.descanso : 30;
          updated = true;
        }
      });
    }

    // Adicionar novos exercícios padrão que não existam no banco
    DEFAULT_EXERCISES.forEach(def => {
      const exists = db.exercicios.some(ex => ex.id === def.id);
      if (!exists) {
        db.exercicios.push({...def});
        updated = true;
      }
    });

    if (!db.aerobicos) {
      db.aerobicos = { A:null, B:null, C:null, D:null, E:null };
      updated = true;
    }

    if (!db.conquistas) {
      db.conquistas = [];
      updated = true;
    }

    if (db.currentFichaWorkouts === undefined) {
      db.currentFichaWorkouts = 0;
      updated = true;
    }

    if (!db.fichasArquivadas) {
      db.fichasArquivadas = [];
      updated = true;
    }

    if (!db.currentCycleBreakdown) {
      db.currentCycleBreakdown = { A: 0, B: 0, C: 0, D: 0, E: 0 };
      updated = true;
    }

    if (!db.currentCycleStartDate) {
      db.currentCycleStartDate = today();
      updated = true;
    }

    if (!db.cycleEvents) {
      db.cycleEvents = {}; // { 'YYYY-MM-DD': 'Início do Ciclo' }
      updated = true;
    }

    if (updated) {
      saveDB(db);
    }

    return db;
  } catch(e) { return initDB(); }
}

function initDB() {
  const db = { 
    exercicios: DEFAULT_EXERCISES, 
    fichas: DEFAULT_FICHAS, 
    aerobicos: { A:null, B:null, C:null, D:null, E:null },
    historico: {}, 
    conquistas: [],
    currentFichaWorkouts: 0,
    currentCycleBreakdown: { A: 0, B: 0, C: 0, D: 0, E: 0 },
    currentCycleStartDate: today(),
    cycleEvents: { [today()]: 'Início do Ciclo' },
    fichasArquivadas: []
  };
  saveDB(db);
  return db;
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// ---- UTILS ----
function uid() { return 'ex-' + Date.now() + '-' + Math.random().toString(36).slice(2,7); }

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayLabel() {
  return new Date().toLocaleDateString('pt-BR', {weekday:'long', day:'2-digit', month:'long', year:'numeric'});
}

function formatCarga(carga) {
  if (!carga) return '';
  const c = String(carga).trim();
  if (c.toLowerCase().endsWith('kg')) return c;
  return c + 'kg';
}

function determineTreinoDoDia(db) {
  const hist = db.historico;
  const dates = Object.keys(hist).sort().reverse(); // Do mais recente para o mais antigo
  
  for (const date of dates) {
    const entry = hist[date];
    const treinos = entry.treinos || (entry.concluido ? [entry.treino] : []);
    
    if (treinos.length > 0) {
      const lastTreino = treinos[treinos.length - 1];
      const order = ['A', 'B', 'C', 'D', 'E'];
      const currentIdx = order.indexOf(lastTreino);
      
      // Encontra a próxima ficha que NÃO esteja vazia
      for (let i = 1; i <= 5; i++) {
        const nextIdx = (currentIdx + i) % 5;
        const nextLetra = order[nextIdx];
        if (db.fichas[nextLetra] && db.fichas[nextLetra].length > 0) {
          return nextLetra;
        }
      }
      return lastTreino;
    }
  }
  return 'A';
}

function getTodayTreino(db) {
  const t = today();
  if (db.historico[t] && db.historico[t].treino) return db.historico[t].treino;
  return determineTreinoDoDia(db);
}

function setTodayTreino(db, letra) {
  if (!db.historico[today()]) {
    db.historico[today()] = { treino: letra, treinos: [], concluido: false, checks: [] };
  } else {
    db.historico[today()].treino = letra;
    // Se o treino que acabamos de selecionar já foi concluído hoje, mantemos concluido:true
    // Se não, deixamos false para que o usuário possa fazer este novo treino
    const treinosConcluidos = db.historico[today()].treinos || [];
    db.historico[today()].concluido = treinosConcluidos.includes(letra);
  }
  saveDB(db);
}

function getChecks(db) {
  const t = today();
  return (db.historico[t] && db.historico[t].checks) ? db.historico[t].checks : [];
}

function getSeriesDone(db, exId) {
  const t = today();
  if (!db.historico[t]) return [];
  if (!db.historico[t].seriesDone) db.historico[t].seriesDone = {};
  return db.historico[t].seriesDone[exId] || [];
}

function toggleSeriesSet(db, exId, setIdx) {
  const t = today();
  if (!db.historico[t]) db.historico[t] = { treino: getTodayTreino(db), concluido: false, checks: [], seriesDone: {} };
  if (!db.historico[t].seriesDone) db.historico[t].seriesDone = {};
  
  const ex = getExById(db, exId);
  if (!db.historico[t].seriesDone[exId]) {
    db.historico[t].seriesDone[exId] = new Array(ex.series || 0).fill(false);
  }
  
  db.historico[t].seriesDone[exId][setIdx] = !db.historico[t].seriesDone[exId][setIdx];
  
  // Se todos os sets forem concluídos, marca o exercício como concluído
  const allSetsDone = db.historico[t].seriesDone[exId].every(v => v === true);
  const checks = db.historico[t].checks || [];
  const idx = checks.indexOf(exId);
  
  if (allSetsDone) {
    if (idx === -1) checks.push(exId);
    startRestTimer(60); // 60s ao concluir o exercício
  } else {
    if (idx !== -1) checks.splice(idx, 1);
    
    // Se a série atual foi marcada como feita, inicia o descanso
    if (db.historico[t].seriesDone[exId][setIdx]) {
      const dTime = (ex.descanso !== undefined && ex.descanso !== null) ? parseInt(ex.descanso) : 30;
      if (dTime > 0) {
        startRestTimer(dTime);
      }
    }
  }
  
  db.historico[t].checks = checks;
  saveDB(db);
  return db.historico[t].seriesDone[exId];
}

function toggleCheck(db, exId) {
  const t = today();
  if (!db.historico[t]) db.historico[t] = { treino: getTodayTreino(db), concluido: false, checks: [], seriesDone: {} };
  const checks = db.historico[t].checks;
  const idx = checks.indexOf(exId);
  
  if (idx === -1) {
    checks.push(exId);
    if (!exId.startsWith('ae-')) {
      const ex = getExById(db, exId);
      if (ex) {
        if (!db.historico[t].seriesDone) db.historico[t].seriesDone = {};
        db.historico[t].seriesDone[exId] = new Array(ex.series || 0).fill(true);
      }
    }
    startRestTimer(60); 
  } else {
    checks.splice(idx, 1);
    if (!exId.startsWith('ae-')) {
      if (db.historico[t].seriesDone && db.historico[t].seriesDone[exId]) {
        db.historico[t].seriesDone[exId] = db.historico[t].seriesDone[exId].map(() => false);
      }
    }
    stopRestTimer();
  }
  
  saveDB(db);
  return checks;
}

function getExById(db, id) { return db.exercicios.find(e => e.id === id); }

function getStreak(db) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;
    if (db.historico[key] && db.historico[key].concluido) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
    if (streak > 365) break;
  }
  return streak;
}

function grupoBadgeClass(grupo) {
  return 'grupo-badge badge-' + (grupo || '').replace(/[íéóãõê]/g, c => ({'í':'i','é':'e','ó':'o','ã':'a','õ':'o','ê':'e'}[c]||c));
}

function showToast(msg, type='info') {
  const tc = document.getElementById('toastContainer');
  if (!tc) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 350); }, 3000);
}

// ---- RENDER HERO STATS ----
let currentViewMode = localStorage.getItem('academia_view_mode') || 'table'; // table ou grid
function renderHeroStats(db) {
  const el = id => document.getElementById(id);
  el('statTotalEx') && (el('statTotalEx').textContent = db.exercicios.length);
  const streak = getStreak(db);
  el('statStreak') && (el('statStreak').textContent = streak + (streak ? '🔥' : ''));
}

// ---- TAB NAVIGATION ----
function initTabs() {
  document.querySelectorAll('.t-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.t-tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      document.querySelectorAll('.t-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected','true');
      const tab = document.getElementById('tab-' + btn.dataset.tab);
      if (tab) tab.classList.add('active');
    });
  });
}

// ---- FICHA DO DIA ----
function renderFicha(db) {
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

  // Selector buttons
  document.querySelectorAll('.sel-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.treino === treino);
  });

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
  const emptyEl = document.getElementById('tableEmpty');

  if (!exercicios.length) {
    if (tbody) tbody.innerHTML = '';
    if (gridContainer) gridContainer.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    if (tableWrap) tableWrap.style.display = 'none';
    if (gridContainer) gridContainer.style.display = 'none';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  // Mostrar ações de conclusão se estiver tudo pronto
  const historicoHoje = db.historico[today()] || { treinos: [] };
  const treinosConcluidosHoje = historicoHoje.treinos || [];
  const currentIsDone = treinosConcluidosHoje.includes(treino);
  const isDone = (total > 0 && done === total) || currentIsDone;
  
  const doneActions = document.getElementById('fichaDoneActions');
  if (doneActions) {
    doneActions.style.display = isDone ? 'block' : 'none';
  }

  // Toggle visibility based on mode
  if (currentViewMode === 'grid') {
    if (tableWrap) tableWrap.style.display = 'none';
    if (gridContainer) {
      gridContainer.style.display = 'grid';
      gridContainer.innerHTML = exercicios.map((ex, i) => {
        const checked = checks.includes(ex.id);
        const badgeCls = grupoBadgeClass(ex.grupoMuscular);
        const imgHtml = ex.imagem
          ? `<img src="${ex.imagem}" alt="${ex.nome}">`
          : `<div class="ex-card-img-placeholder"><span>🏋️</span><small>SEM FOTO</small></div>`;
        
        const seriesDone = getSeriesDone(db, ex.id);
        const seriesButtons = [];
        for (let s = 0; s < (ex.series || 0); s++) {
          const isSetDone = seriesDone[s] || false;
          seriesButtons.push(`<button class="btn-set ${isSetDone ? 'done' : ''}" data-id="${ex.id}" data-idx="${s}" title="Série ${s+1}">${s+1}</button>`);
        }

        return `<div class="ex-card ${checked ? 'row-done' : ''}" data-id="${ex.id}">
          <div class="ex-card-num">${i + 1}</div>
          <div class="ex-card-img">${imgHtml}</div>
          <div class="ex-card-body">
            <div class="ex-card-name">${ex.nome}</div>
            <div class="ex-card-meta">
              <span class="${badgeCls}">${ex.grupoMuscular}</span>
              <span class="ex-card-vol">${ex.series}×${ex.repeticoes}${ex.carga ? ' | Carga: ' + formatCarga(ex.carga) : ''}</span>
            </div>
            
            <div class="series-wrap">
              ${seriesButtons.join('')}
            </div>

            <div class="ex-card-note-wrap">
              <button class="btn-note-toggle ${ex.anotacoes ? 'has-note' : ''}" data-id="${ex.id}" title="${ex.anotacoes || 'Adicionar nota'}">
                <span>📝</span> ${ex.anotacoes ? 'Ver Nota' : 'Nota'}
              </button>
            </div>
            <div class="check-wrap" style="margin-top:15px; justify-content: flex-start;">
              <input type="checkbox" class="check-input" id="chk-grid-${ex.id}" data-id="${ex.id}" ${checked?'checked':''}>
              <label class="check-label" for="chk-grid-${ex.id}"><span class="check-mark">✓</span></label>
              <span style="margin-left:10px; font-weight:700; font-size:0.8rem; color:var(--text-secondary);">CONCLUÍDO</span>
            </div>
          </div>
        </div>`;
      }).join('');

      if (hasAe) {
        const checked = checks.includes(aeId);
        gridContainer.innerHTML += `
          <div class="ex-card ex-card-aerobico ${checked ? 'row-done' : ''}" data-id="${aeId}">
            <div class="ex-card-num">🏃</div>
            <div class="ae-card-header">
                <div class="ae-icon">🏃</div>
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
                <input type="checkbox" class="check-input" id="chk-grid-${aeId}" data-id="${aeId}" ${checked?'checked':''}>
                <label class="check-label" for="chk-grid-${aeId}"><span class="check-mark">✓</span></label>
                <span class="ae-check-text">CONCLUIR CARDIO</span>
              </div>
            </div>
          </div>
        `;
      }
    }
  } else {
    if (gridContainer) gridContainer.style.display = 'none';
    if (tableWrap) tableWrap.style.display = 'block';
    if (tbody) {
      tbody.innerHTML = exercicios.map((ex, i) => {
        const checked = checks.includes(ex.id);
        const imgHtml = ex.imagem
          ? `<div class="img-placeholder"><img src="${ex.imagem}" alt="${ex.nome}"></div>`
          : `<div class="img-placeholder">🏋️</div>`;
        const badgeCls = grupoBadgeClass(ex.grupoMuscular);
        
        const seriesDone = getSeriesDone(db, ex.id);
        const seriesButtons = [];
        for (let s = 0; s < (ex.series || 0); s++) {
          const isSetDone = seriesDone[s] || false;
          seriesButtons.push(`<button class="btn-set ${isSetDone ? 'done' : ''}" data-id="${ex.id}" data-idx="${s}" title="Série ${s+1}">${s+1}</button>`);
        }

        return `<tr class="${checked ? 'row-done' : ''}" data-id="${ex.id}">
          <td><div class="row-num">${i+1}</div></td>
          <td><span class="ex-name">${ex.nome}</span></td>
          <td>${imgHtml}</td>
          <td><span class="${badgeCls}">${ex.grupoMuscular}</span></td>
          <td>
            <div class="vol-text">${ex.series}×${ex.repeticoes}<span>REPS</span>${ex.carga ? ' · ' + formatCarga(ex.carga) : ''}</div>
            <div class="series-wrap-table">
              ${seriesButtons.join('')}
            </div>
            <button class="btn-note-toggle-table ${ex.anotacoes ? 'has-note' : ''}" data-id="${ex.id}" title="${ex.anotacoes || 'Adicionar nota'}">
                <span>📝</span>
            </button>
          </td>
          <td>
            <div class="check-wrap">
              <input type="checkbox" class="check-input" id="chk-${ex.id}" data-id="${ex.id}" ${checked?'checked':''}>
              <label class="check-label" for="chk-${ex.id}"><span class="check-mark">✓</span></label>
            </div>
          </td>
        </tr>`;
      }).join('');

      if (hasAe) {
        const checked = checks.includes(aeId);
        tbody.innerHTML += `
          <tr class="row-aerobico ${checked ? 'row-done' : ''}" data-id="${aeId}">
            <td><div class="row-num" style="background: var(--gym-green)">🏃</div></td>
            <td>
                <span class="ae-table-type">${ae.tipo}</span>
                <span class="ae-table-label">AERÓBICO</span>
            </td>
            <td colspan="2">
                <div class="ae-table-stats">
                    <div class="ae-t-stat"><span>Vel:</span> <strong>${ae.vel || '--'} km/h</strong></div>
                    <div class="ae-t-stat"><span>Tempo:</span> <strong>${ae.tempo || '--'} min</strong></div>
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
                <input type="checkbox" class="check-input" id="chk-${aeId}" data-id="${aeId}" ${checked?'checked':''}>
                <label class="check-label" for="chk-${aeId}"><span class="check-mark">✓</span></label>
              </div>
            </td>
          </tr>
        `;
      }
    }
  }

  // Attach checkbox events to both view modes
  const allChecks = document.querySelectorAll('.t-tab.active .check-input');
  allChecks.forEach(chk => {
    chk.addEventListener('change', () => {
      const isChecked = chk.checked;
      const newChecks = toggleCheck(db, chk.dataset.id);
      
      const currentTreino = getTodayTreino(db);
      const fichaIds2 = db.fichas[currentTreino] || [];
      const hasAe2 = db.aerobicos[currentTreino]?.tipo;
      const aeId2 = 'ae-' + currentTreino;
      
      const allDone = fichaIds2.length > 0 && 
                      fichaIds2.every(id => newChecks.includes(id)) && 
                      (!hasAe2 || newChecks.includes(aeId2));
      
      renderFicha(db);
      if (allDone) {
        db.historico[today()].concluido = true;
        saveDB(db);
        setTimeout(() => {
          renderFicha(db);
          renderHeroStats(db);
          renderProgresso(db);
          showConclusao(db);
        }, 400);
      } else {
        if (db.historico[today()].concluido) {
          db.historico[today()].concluido = false;
          saveDB(db);
          renderHeroStats(db);
          renderProgresso(db);
        }
      }
    });
  });

  // Attach set button events
  document.querySelectorAll('.btn-set').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const exId = btn.dataset.id;
      const setIdx = parseInt(btn.dataset.idx);
      
      const newSets = toggleSeriesSet(db, exId, setIdx);
      
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
        db.historico[today()].concluido = true;
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

function renderFichaSuggestion(db) {
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
function showConclusao(db) {
  const treino = getTodayTreino(db);
  const fichaIds = db.fichas[treino] || [];
  const exercicios = fichaIds.map(id => getExById(db, id)).filter(Boolean);
  const grupos = [...new Set(exercicios.map(e => e.grupoMuscular))];
  const totalSeries = exercicios.reduce((s,e) => s + (e.series||0), 0);

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
  if (stats) stats.innerHTML = `
    <div class="c-stat"><div class="c-stat-val">${exercicios.length}</div><div class="c-stat-lbl">Exercícios</div></div>
    <div class="c-stat"><div class="c-stat-val">${totalSeries}</div><div class="c-stat-lbl">Séries Totais</div></div>
    <div class="c-stat"><div class="c-stat-val">${grupos.length}</div><div class="c-stat-lbl">Grupos Musculares</div></div>`;

  // Limpar checks automaticamente para facilitar o próximo treino
  if (db.historico[today()]) {
    if (!db.historico[today()].treinos) db.historico[today()].treinos = [];
    if (!db.historico[today()].treinos.includes(treino)) {
      db.historico[today()].treinos.push(treino);
    }
    db.historico[today()].checks = [];
    db.historico[today()].seriesDone = {}; // Desmarcar todas as séries
    saveDB(db);
    renderFicha(db); // Atualiza a tabela para mostrar os exercícios e séries desmarcados
  }

  db.currentFichaWorkouts = (db.currentFichaWorkouts || 0) + 1;
  
  const letra = getTodayTreino(db);
  if (!db.currentCycleBreakdown) db.currentCycleBreakdown = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  db.currentCycleBreakdown[letra]++;
  
  saveDB(db);

  if (db.currentFichaWorkouts >= 30) {
    handleCicloCompleto(db);
  }

  launchConfetti();
  openModal('modalConclusao');
}

function handleCicloCompleto(db) {
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

function startNewCycle(db, reason) {
    // Arquivar ficha atual
    const archive = {
        data: today(),
        reason: reason,
        fichas: JSON.parse(JSON.stringify(db.fichas)),
        aerobicos: JSON.parse(JSON.stringify(db.aerobicos)),
        workoutsDone: db.currentFichaWorkouts || 0,
        breakdown: {...db.currentCycleBreakdown}
    };
    db.fichasArquivadas.push(archive);
    
    // Resetar contadores e definir nova data de início
    db.currentFichaWorkouts = 0;
    db.currentCycleBreakdown = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    db.currentCycleStartDate = today();
    
    if (!db.cycleEvents) db.cycleEvents = {};
    db.cycleEvents[today()] = reason === 'Ciclo Concluído' ? 'Novo Ciclo' : 'Ciclo Alterado Manualmente';
    
    saveDB(db);
    
    setTimeout(() => {
        showToast(`🔱 ${reason.toUpperCase()}! Iniciando nova contagem.`, 'success');
    }, 1000);
}

function launchConfetti() {
  const container = document.getElementById('confettiContainer');
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#8b5cf6','#22c55e','#f9ca24','#fd79a8','#4ecdc4','#a29bfe'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${1.5+Math.random()*2}s;
      animation-delay:${Math.random()*.8}s;
      width:${6+Math.random()*8}px;
      height:${6+Math.random()*8}px;
      border-radius:${Math.random()>0.5?'50%':'2px'};`;
    container.appendChild(piece);
  }
}

// ---- MODAL HELPERS ----
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.style.display = 'none'; document.body.style.overflow = ''; }
}

// ---- EXERCÍCIOS GRID ----
let currentFilter = 'all';
let currentSearch = '';
let calendarViewDate = new Date();

function renderExercicios(db) {
  const grid = document.getElementById('exerciciosGrid');
  const emptyEl = document.getElementById('exEmpty');
  if (!grid) return;

  let list = db.exercicios;
  if (currentFilter !== 'all') list = list.filter(e => e.grupoMuscular === currentFilter);
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    list = list.filter(e => e.nome.toLowerCase().includes(q) || e.grupoMuscular.toLowerCase().includes(q));
  }

  if (!list.length) {
    grid.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  grid.innerHTML = list.map(ex => {
    const badgeCls = grupoBadgeClass(ex.grupoMuscular);
    const imgHtml = ex.imagem
      ? `<img src="${ex.imagem}" alt="${ex.nome}">`
      : `<div class="ex-card-img-placeholder"><span>🏋️</span><small>SEM FOTO</small></div>`;
    return `<div class="ex-card" data-id="${ex.id}">
      <div class="ex-card-img">${imgHtml}</div>
      <div class="ex-card-body">
        <div class="ex-card-name">${ex.nome}</div>
        <div class="ex-card-meta">
          <span class="${badgeCls}">${ex.grupoMuscular}</span>
          <span class="ex-card-vol">${ex.series}×${ex.repeticoes}${ex.carga ? ' | Carga: ' + formatCarga(ex.carga) : ''}</span>
        </div>
        <div class="ex-card-actions">
          <button class="btn-ex-edit" data-id="${ex.id}">✏️ Editar</button>
          <button class="btn-ex-del" data-id="${ex.id}">🗑️ Excluir</button>
        </div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.btn-ex-edit').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openEditExercicio(db, btn.dataset.id); });
  });
  grid.querySelectorAll('.btn-ex-del').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); confirmDeleteExercicio(db, btn.dataset.id); });
  });
}

// ---- FORM EXERCÍCIO ----
let editingExId = null;

function openNewExercicio() {
  editingExId = null;
  document.getElementById('modalExTitulo').textContent = 'Novo Exercício';
  document.getElementById('formExercicio').reset();
  resetUpload();
  document.getElementById('exChartContainer').style.display = 'none';
  openModal('modalExercicio');
}

function openEditExercicio(db, id) {
  const ex = getExById(db, id);
  if (!ex) return;
  editingExId = id;
  document.getElementById('modalExTitulo').textContent = 'Editar Exercício';
  document.getElementById('inputNome').value = ex.nome;
  document.getElementById('inputGrupo').value = ex.grupoMuscular;
  document.getElementById('inputSeries').value = ex.series;
  document.getElementById('inputReps').value = ex.repeticoes;
  document.getElementById('inputCarga').value = ex.carga || '';
  document.getElementById('inputDescanso').value = ex.descanso !== undefined ? ex.descanso : 30;
  document.getElementById('inputAnotacoes').value = ex.anotacoes || '';
  if (ex.imagem) setUploadPreview(ex.imagem);
  else resetUpload();
  renderExChart(ex);
  openModal('modalExercicio');
}

function resetUpload() {
  document.getElementById('uploadPlaceholder').style.display = 'block';
  document.getElementById('uploadPreview').style.display = 'none';
  document.getElementById('uploadPreview').src = '';
  document.getElementById('btnRemoveImg').style.display = 'none';
  document.getElementById('uploadInput').value = '';
}

function setUploadPreview(src) {
  document.getElementById('uploadPlaceholder').style.display = 'none';
  document.getElementById('uploadPreview').src = src;
  document.getElementById('uploadPreview').style.display = 'block';
  document.getElementById('btnRemoveImg').style.display = 'inline-block';
}

function renderExChart(ex) {
  const container = document.getElementById('exChartContainer');
  const chartEl = document.getElementById('exChart');
  
  if (!ex || !ex.historicoCargas || ex.historicoCargas.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  const history = ex.historicoCargas;
  const maxValor = Math.max(...history.map(h => h.valor));
  
  chartEl.innerHTML = history.map(h => {
    const heightPct = maxValor > 0 ? (h.valor / maxValor) * 100 : 0;
    const dateObj = new Date(h.data + 'T12:00:00');
    const dateLbl = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    return `<div class="chart-bar-wrap">
      <div class="chart-val">${h.label}</div>
      <div class="chart-bar" style="height: ${heightPct}%" title="${h.label} em ${dateLbl}"></div>
      <div class="chart-date">${dateLbl}</div>
    </div>`;
  }).join('');
}

function saveExercicio(db) {
  const nome = document.getElementById('inputNome').value.trim();
  const grupo = document.getElementById('inputGrupo').value;
  const series = parseInt(document.getElementById('inputSeries').value) || 3;
  const reps = document.getElementById('inputReps').value.trim() || '10';
  const carga = document.getElementById('inputCarga').value.trim();
  const descanso = parseInt(document.getElementById('inputDescanso').value) || 0;
  const anotacoes = document.getElementById('inputAnotacoes').value.trim();
  const preview = document.getElementById('uploadPreview');
  const imagem = (preview.style.display !== 'none' && preview.src && preview.src !== window.location.href) ? preview.src : null;

  if (!nome || !grupo) { showToast('Preencha nome e grupo muscular.','error'); return; }

  if (editingExId) {
    const ex = getExById(db, editingExId);
    let toastMsg = 'Exercício atualizado!';
    if (ex) { 
      let isNewLoad = carga && (carga !== ex.carga);
      if (isNewLoad) {
         if (!ex.historicoCargas) ex.historicoCargas = [];
         const numCarga = parseFloat(carga.replace(/[^\d.,]/g, '').replace(',', '.'));
         if (!isNaN(numCarga)) {
           const lastVal = ex.historicoCargas.length > 0 ? ex.historicoCargas[ex.historicoCargas.length - 1].valor : 0;
           if (numCarga > lastVal && lastVal > 0) {
             toastMsg = `📈 RECORDE! Nova carga máxima: ${carga}! O monstro tá saindo da jaula!`;
           }
           ex.historicoCargas.push({ data: today(), valor: numCarga, label: carga });
           if (ex.historicoCargas.length > 15) ex.historicoCargas.shift(); // Manter apenas as últimas 15
         }
      }
      Object.assign(ex, {nome, grupoMuscular:grupo, series, repeticoes:reps, carga, imagem, descanso, anotacoes}); 
    }
    showToast(toastMsg,'success');
  } else {
    let hist = [];
    if (carga) {
      const numCarga = parseFloat(carga.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(numCarga)) hist.push({ data: today(), valor: numCarga, label: carga });
    }
    db.exercicios.push({id:uid(), nome, grupoMuscular:grupo, series, repeticoes:reps, carga, imagem, descanso, historicoCargas: hist, anotacoes});
    showToast('Exercício cadastrado!','success');
  }
  saveDB(db);
  closeModal('modalExercicio');
  renderExercicios(db);
  renderHeroStats(db);
}

function confirmDeleteExercicio(db, id) {
  const ex = getExById(db, id);
  if (!ex) return;
  document.getElementById('confirmTitle').textContent = 'Excluir exercício?';
  document.getElementById('confirmMsg').textContent = `"${ex.nome}" será removido permanentemente.`;
  openModal('modalConfirm');
  document.getElementById('btnConfirmYes').onclick = () => {
    db.exercicios = db.exercicios.filter(e => e.id !== id);
    db.fichas.A = db.fichas.A.filter(i => i !== id);
    db.fichas.B = db.fichas.B.filter(i => i !== id);
    saveDB(db);
    closeModal('modalConfirm');
    renderExercicios(db);
    renderMontar(db);
    renderFicha(db);
    renderHeroStats(db);
    showToast('Exercício excluído.','info');
  };
  document.getElementById('btnConfirmNo').onclick = () => closeModal('modalConfirm');
}

// ---- MONTAR FICHA ----
function renderMontar(db) {
  ['A','B','C','D','E'].forEach(letra => {
    const listEl = document.getElementById('montarList'+letra);
    const countEl = document.getElementById('count'+letra);
    if (!listEl) return;
    const ids = db.fichas[letra] || [];
    if (countEl) countEl.textContent = ids.length + ' exercício' + (ids.length !== 1 ? 's' : '');
    listEl.innerHTML = ids.map(id => {
      const ex = getExById(db, id);
      if (!ex) return '';
      const badgeCls = grupoBadgeClass(ex.grupoMuscular);
      return `<div class="montar-item" data-id="${ex.id}" data-treino="${letra}">
        <div style="flex:1">
          <div class="montar-item-name">${ex.nome}</div>
          <div style="font-size:0.75rem; color:var(--text-tertiary); margin-top:2px;">${ex.series}×${ex.repeticoes}${ex.carga ? ' | Carga: ' + formatCarga(ex.carga) : ''}</div>
        </div>
        <span class="${badgeCls} montar-item-grupo">${ex.grupoMuscular}</span>
        <button class="btn-remove-item" data-id="${ex.id}" data-treino="${letra}" title="Remover">✕</button>
      </div>`;
    }).join('');

    // Preencher Aeróbico
    const ae = db.aerobicos[letra];
    const tipoInp = document.querySelector(`.ae-tipo[data-treino="${letra}"]`);
    const velInp = document.querySelector(`.ae-vel[data-treino="${letra}"]`);
    const tempoInp = document.querySelector(`.ae-tempo[data-treino="${letra}"]`);
    
    if (ae && tipoInp) {
        tipoInp.value = ae.tipo || '';
        velInp.value = ae.vel || '';
        tempoInp.value = ae.tempo || '';
    }

    listEl.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const l = btn.dataset.treino;
        db.fichas[l] = db.fichas[l].filter(i => i !== btn.dataset.id);
        saveDB(db);
        renderMontar(db);
        renderFicha(db);
        showToast('Removido da ficha.','info');
      });
    });
  });
}

// ---- PICKER MODAL ----
let pickerTreinoAtivo = 'A';
let pickerSearch = '';

function openPicker(db, letra) {
  pickerTreinoAtivo = letra;
  pickerSearch = '';
  document.getElementById('pickerLabel').textContent = letra;
  document.getElementById('pickerSearch').value = '';
  renderPickerList(db);
  openModal('modalPicker');
}

function renderPickerList(db) {
  const listEl = document.getElementById('pickerList');
  if (!listEl) return;
  const already = db.fichas[pickerTreinoAtivo] || [];
  let list = db.exercicios;
  if (pickerSearch) {
    const q = pickerSearch.toLowerCase();
    list = list.filter(e => e.nome.toLowerCase().includes(q) || e.grupoMuscular.toLowerCase().includes(q));
  }
  listEl.innerHTML = list.map(ex => {
    const isAlready = already.includes(ex.id);
    const badgeCls = grupoBadgeClass(ex.grupoMuscular);
    const imgHtml = ex.imagem
      ? `<img src="${ex.imagem}" alt="${ex.nome}">`
      : '🏋️';
    return `<div class="picker-item ${isAlready?'picker-already':''}" data-id="${ex.id}">
      <div class="picker-item-img">${imgHtml}</div>
      <div class="picker-item-info">
        <div class="picker-item-name">${ex.nome}</div>
        <div class="picker-item-grp" style="display:flex; gap:8px; align-items:center; margin-top:4px;">
          <span class="${badgeCls}">${ex.grupoMuscular}</span>
          <span>${ex.series}×${ex.repeticoes}${ex.carga ? ' | Carga: ' + formatCarga(ex.carga) : ''}</span>
        </div>
      </div>
    </div>`;
  }).join('');

  listEl.querySelectorAll('.picker-item:not(.picker-already)').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      if (!db.fichas[pickerTreinoAtivo]) db.fichas[pickerTreinoAtivo] = [];
      if (!db.fichas[pickerTreinoAtivo].includes(id)) {
        db.fichas[pickerTreinoAtivo].push(id);
        saveDB(db);
        renderMontar(db);
        renderFicha(db);
        showToast('Adicionado ao Treino ' + pickerTreinoAtivo + '!','success');
      }
      renderPickerList(db);
    });
  });
}

// ---- PROGRESSO / GAMIFICATION ----
function renderProgresso(db) {
  const el = id => document.getElementById(id);
  if (!el('progStreakVal')) return;

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
  
  el('progStreakVal').textContent = getStreak(db);
  el('progNivelName').textContent = nivelName;
  el('progNivelVal').textContent = currentLevel;
  el('progXpFill').style.width = xpPct + '%';
  el('progXpAtual').textContent = xp;
  el('progXpNext').textContent = (currentLevel * xpPerLevel);
  el('progTotalTreinos').textContent = totalWorkouts;
  
  const currMonth = new Date().toISOString().slice(0,7);
  const mesTreinos = completedDates.filter(d => d.startsWith(currMonth)).length;
  el('progMesTreinos').textContent = mesTreinos;
  
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
  }

  // Ciclo de Treino
  const startDate = db.currentCycleStartDate || today();
  const completedHistory = Object.keys(db.historico).filter(d => db.historico[d].concluido);
  const cycleWorkouts = completedHistory.filter(d => d >= startDate);
  const cycleCount = cycleWorkouts.length;
  
  // Atualizar db.currentFichaWorkouts para manter sincronizado
  if (db.currentFichaWorkouts !== cycleCount) {
    db.currentFichaWorkouts = cycleCount;
    // Recalcular breakdown com base no histórico real do ciclo
    db.currentCycleBreakdown = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    cycleWorkouts.forEach(date => {
        const h = db.historico[date];
        const treinosNoDia = h.treinos || [h.treino];
        treinosNoDia.forEach(letra => {
            if (db.currentCycleBreakdown[letra] !== undefined) db.currentCycleBreakdown[letra]++;
        });
    });
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
    const bd = db.currentCycleBreakdown || { A:0, B:0, C:0, D:0, E:0 };
    const html = Object.keys(bd)
        .filter(letra => bd[letra] > 0 || (db.fichas[letra] && db.fichas[letra].length > 0))
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
    const dateStr = d.toISOString().slice(0,10);
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
    if (isDone) {
      if (currentStreak >= 10) levelCls = 'level-5';
      else if (currentStreak >= 7) levelCls = 'level-4';
      else if (currentStreak >= 4) levelCls = 'level-3';
      else if (currentStreak >= 2) levelCls = 'level-2';
      else levelCls = 'level-1';
    }
    
    const treinosDia = (hist[dateStr] && hist[dateStr].treinos && hist[dateStr].treinos.length > 0) 
      ? hist[dateStr].treinos.join('|') 
      : (isDone ? hist[dateStr].treino : '');

    const cycleEvent = db.cycleEvents ? db.cycleEvents[dateStr] : null;

    gridHtml += `<div class="month-day ${isDone ? 'completed' : ''} ${isToday ? 'today' : ''} ${levelCls} ${cycleEvent ? 'has-event' : ''}" 
      data-date="${dateStr}" 
      data-treino="${treinosDia}">
      <span class="day-num">${day < 10 ? '0'+day : day}</span>
      ${treinosDia ? `<span class="day-treino-label">${treinosDia}</span>` : ''}
      ${cycleEvent ? `<div class="day-event-icon" title="${cycleEvent}">${cycleEvent.includes('Concluído') ? '🔱' : '⚙️'}</div>` : ''}
    </div>`;
  }
  
  el('monthCalendar').innerHTML = gridHtml;
  
  renderWeeklyPlanner(db);
  renderVolumeSemanal(db);
  renderBadges(db);

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

function renderWeeklyPlanner(db) {
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
      if (treinos.length > 0) {
        workoutsHtml = treinos.map(t => `<span class="planner-workout-badge">${t}</span>`).join('');
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
}

// ---- CRONÔMETRO DE DESCANSO ----
let restTimerInterval = null;
let restTimeLeft = 0;
let totalRestTime = 60;

function getTimerStyle() {
  return localStorage.getItem('timerStyle') || 'radar';
}

function startRestTimer(seconds) {
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
  } else {
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

function updateTimerDisplay(el) {
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
}

function stopRestTimer() {
  clearInterval(restTimerInterval);
  const timerEl = document.getElementById('restTimer');
  if (timerEl) {
    timerEl.classList.remove('rt-running');
    timerEl.style.display = 'none';
  }
}

function playBeep() {
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
  } catch(e) { console.warn('Bip de áudio bloqueado ou não suportado.'); }
}

// ---- CALCULADORA 1RM ----
function initCalculator() {
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

// ---- VOLUME SEMANAL ----
function renderVolumeSemanal(db) {
  const chartEl = document.getElementById('volumeChart');
  if (!chartEl) return;

  const last7Days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    last7Days.push(`${y}-${m}-${day}`);
  }

  const volumePorGrupo = {};
  
  // Analisar histórico para calcular volume
  Object.keys(db.historico).forEach(date => {
    if (last7Days.includes(date) && db.historico[date].concluido) {
      const treino = db.historico[date].treino;
      const ids = db.fichas[treino] || [];
      ids.forEach(id => {
        const ex = getExById(db, id);
        if (ex) {
          const s = parseInt(ex.series) || 0;
          const r = parseInt(ex.repeticoes) || 0;
          const c = parseFloat(String(ex.carga).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          const vol = s * r * c;
          
          if (!volumePorGrupo[ex.grupoMuscular]) volumePorGrupo[ex.grupoMuscular] = 0;
          volumePorGrupo[ex.grupoMuscular] += vol;
        }
      });
    }
  });

  const grupos = Object.keys(volumePorGrupo);
  if (grupos.length === 0) {
    chartEl.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--text-tertiary);">Nenhum dado de volume nos últimos 7 dias.</p>';
    return;
  }

  const maxVol = Math.max(...Object.values(volumePorGrupo));
  
  // Atualizar também o radar chart
  renderRadarChart(db);

  chartEl.innerHTML = grupos.map(g => {
    const vol = volumePorGrupo[g];
    const pct = (vol / maxVol) * 100;
    const badgeCls = grupoBadgeClass(g);
    return `
      <div class="vol-bar-item">
        <div class="vol-bar-info">
          <span class="${badgeCls}">${g}</span>
          <span class="vol-bar-val">${vol.toLocaleString('pt-BR')} kg</span>
        </div>
        <div class="vol-bar-track">
          <div class="vol-bar-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ---- RADAR CHART ATRIBUTOS ----
function renderRadarChart(db) {
  const container = document.getElementById('radarChartContainer');
  if (!container) return;

  // Atributos baseados no histórico e exercícios
  const stats = {
    forca: 0,
    resistencia: 0,
    velocidade: 0,
    flexibilidade: 0,
    equilibrio: 0,
    potencia: 0
  };

  const completedDates = Object.keys(db.historico).filter(d => db.historico[d].concluido);
  
  if (completedDates.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:40px; color:var(--text-tertiary); font-size:0.9rem;">Treine para gerar seu gráfico de atributos.</p>';
    return;
  }

  // Lógica de cálculo (0 a 100)
  let totalVol = 0;
  let totalReps = 0;
  let gruposVistos = new Set();
  let unilateralCount = 0;
  let explosiveCount = 0;

  completedDates.forEach(date => {
    const treino = db.historico[date].treino;
    const ids = db.fichas[treino] || [];
    ids.forEach(id => {
      const ex = getExById(db, id);
      if (ex) {
        const s = parseInt(ex.series) || 0;
        const r = parseInt(ex.repeticoes) || 0;
        const c = parseFloat(String(ex.carga).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        totalVol += (s * r * c);
        totalReps += (s * r);
        gruposVistos.add(ex.grupoMuscular);
        
        // Detecção simples de tipos
        const n = ex.nome.toLowerCase();
        if (n.includes('unilateral') || n.includes('halter') || n.includes('livre')) unilateralCount++;
        if (ex.grupoMuscular === 'Pernas' || n.includes('explosão') || n.includes('salto')) explosiveCount++;
      }
    });
  });

  stats.forca = Math.min(100, (totalVol / (completedDates.length * 2000)) * 50); 
  stats.resistencia = Math.min(100, (totalReps / (completedDates.length * 50)) * 50);
  stats.flexibilidade = Math.min(100, (gruposVistos.size / 7) * 100);
  stats.equilibrio = Math.min(100, (unilateralCount / (totalReps/10 || 1)) * 100);
  stats.potencia = Math.min(100, (explosiveCount / (completedDates.length * 2)) * 100);
  stats.velocidade = Math.min(100, (completedDates.length / 4) * 50 + (stats.resistencia * 0.3));

  // Desenhar SVG
  const size = 300;
  const center = size / 2;
  const radius = size * 0.35;
  const labels = ['FORÇA', 'RESISTÊNCIA', 'VELOCIDADE', 'FLEXIBILIDADE', 'EQUILÍBRIO', 'POTÊNCIA'];
  const keys = ['forca', 'resistencia', 'velocidade', 'flexibilidade', 'equilibrio', 'potencia'];
  const points = [];

  // Ângulos para cada atributo (Hexágono)
  keys.forEach((key, i) => {
    const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
    const val = Math.max(10, stats[key]); // Valor mínimo para o gráfico não sumir
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
    labelsHtml += `<text x="${x}" y="${y + 12}" text-anchor="${anchor}" fill="var(--primary-light)" font-size="12" font-weight="900">${Math.round(stats[key])}</text>`;
  });

  container.innerHTML = `
    <div class="radar-wrapper">
      <svg viewBox="0 0 ${size} ${size}" style="width:100%; height:auto; overflow:visible;">
        <defs>
          <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.2" />
            <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.6" />
          </radialGradient>
        </defs>
        ${grids}
        ${keys.map((_, i) => {
          const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
          return `<line x1="${center}" y1="${center}" x2="${center + radius * Math.cos(angle)}" y2="${center + radius * Math.sin(angle)}" stroke="rgba(255,255,255,0.05)" stroke-width="1" />`;
        }).join('')}
        <polygon points="${points.join(' ')}" fill="url(#radarGrad)" stroke="var(--primary-light)" stroke-width="2" style="filter: drop-shadow(0 0 8px var(--shadow));" />
        ${labelsHtml}
      </svg>
    </div>
  `;
}

// ---- CONQUISTAS (BADGES) ----
function renderBadges(db) {
  const grid = document.getElementById('badgesGrid');
  if (!grid) return;

  const completedDates = Object.keys(db.historico).filter(d => db.historico[d].concluido);
  const totalWorkouts = completedDates.length;
  const streak = getStreak(db);
  
  // Calcular Volume Máximo em um dia
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
          dayVol += (s * r * c);
        }
      });
      if (dayVol > maxDayVol) maxDayVol = dayVol;
    }
  });

  const xp = totalWorkouts * 10;
  const currentLevel = Math.floor(xp / 50) + 1;

  const badges = [
    { id: 'b1', icon: '🆕', name: 'Primeiro Passo', desc: 'Concluiu o primeiro treino.', check: totalWorkouts >= 1 },
    { id: 'b2', icon: '🔥', name: 'Constância', desc: '7 dias de ofensiva.', check: streak >= 7 },
    { id: 'b3', icon: '🏆', name: 'Veterano', desc: '30 treinos concluídos.', check: totalWorkouts >= 30 },
    { id: 'b4', icon: '🏋️', name: 'Força Bruta', desc: 'Volume > 5.000kg num dia.', check: maxDayVol >= 5000 },
    { id: 'b5', icon: '💎', name: 'Elite', desc: 'Chegou ao Nível 10.', check: currentLevel >= 10 },
    { id: 'b6', icon: '⚡', name: 'Relâmpago', desc: '15 treinos no mês.', check: totalWorkouts >= 15 }
  ];

  // Adicionar as conquistas especiais do banco (como Ciclos Completos)
  const specialBadges = db.conquistas.filter(c => typeof c === 'object').map(c => ({
    id: c.id,
    icon: c.icon || '🔱',
    name: c.titulo || c.name,
    desc: `${c.desc} (${c.data})`,
    check: true,
    special: true
  }));

  const allBadges = [...badges, ...specialBadges];

  // Detectar novas conquistas (apenas para as fixas b1-b6)
  let newlyUnlocked = false;
  badges.forEach(b => {
    if (b.check && !db.conquistas.includes(b.id)) {
      db.conquistas.push(b.id);
      newlyUnlocked = b;
    }
  });

  if (newlyUnlocked) {
    saveDB(db);
    setTimeout(() => openShareBadge(newlyUnlocked), 1000);
  }

  grid.innerHTML = allBadges.map(b => `
    <div class="badge-item ${b.check ? 'unlocked' : 'locked'} ${b.special ? 'special' : ''}" title="${b.desc}" data-id="${b.id}">
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-name">${b.name}</div>
    </div>
  `).join('');

  // Permitir compartilhar clicando na conquista já desbloqueada
  grid.querySelectorAll('.badge-item.unlocked').forEach(item => {
    item.addEventListener('click', () => {
      const badge = allBadges.find(b => b.id === item.dataset.id);
      if (badge) openShareBadge(badge);
    });
  });
}

function openShareBadge(badge) {
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

// ---- MODO FOCO ----
let focusIndex = 0;
let focusFicha = [];

function startFocusMode(db) {
  const treino = getTodayTreino(db);
  const ids = db.fichas[treino] || [];
  if (ids.length === 0) {
    showToast('Adicione exercícios à ficha antes de iniciar o Modo Foco!', 'error');
    return;
  }
  
  focusFicha = ids.map(id => getExById(db, id)).filter(Boolean);
  focusIndex = 0;
  
  updateFocusUI(db);
  openModal('modalFocus');
}

function updateFocusUI(db) {
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
  document.getElementById('focusCarga').textContent = formatCarga(ex.carga) || '--';
  
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

function focusCheck(db) {
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
    db.historico[today()].concluido = true;
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

// ---- COMPARTILHAMENTO ----
const QUOTES = [
  "O único treino ruim é aquele que não aconteceu.",
  "A disciplina é a ponte entre metas e realizações.",
  "Suor é o choro da gordura. Continue!",
  "Sua única competição é quem você foi ontem.",
  "A dor é temporária, o orgulho é para sempre.",
  "Feito é melhor que perfeito, mas bem feito é elite.",
  "A força não provém da capacidade física, mas de uma vontade indomável. -Mahatma Gandhi",
  "Que desonra é envelhecer sem ver a beleza e a força de que seu corpo é capaz. -Sócrates",
  "O que não me mata, me torna mais forte. -Friedrich Nietzsche",
  "Nós somos o que fazemos repetidamente. A excelência não é um ato, mas um hábito. -Aristóteles",
  "Eu odiava cada minuto do treinamento, mas dizia: 'Não pare'. -Muhammad Ali",
  "Se você tem medo de falhar, você provavelmente vai falhar. -Kobe Bryant",
  "Eu falhei repetidamente em minha vida. E é por isso que eu tenho sucesso. -Michael Jordan",
  "A motivação é o que te faz começar. O hábito é o que te mantém indo. -Jim Ryun",
  "Daqui a um ano, você desejará ter começado hoje. -Karen Lamb",
  "O sucesso é a soma de pequenos esforços repetidos dia após dia. -Robert Collier",
  "Energia e persistência conquistam todas as coisas. -Benjamin Franklin",
  "Sempre parece impossível até que seja feito. -Nelson Mandela",
  "Tudo o que você sempre quis está do outro lado do medo. -George Addair",
  "A mente é o limite. Se a mente puder visualizar, você consegue fazer. -Arnold Schwarzenegger",
  "Se você está atravessando o inferno, continue indo. -Winston Churchill",
  "Não conte os dias, faça os dias contarem. -Muhammad Ali",
  "Obstáculos são as coisas que você vê quando tira os olhos do objetivo. -Henry Ford",
  "Para ser o melhor, você deve fazer o que os outros não estão dispostos a fazer. -Michael Phelps",
  "Se você quer algo que nunca teve, precisa fazer algo que nunca fez. -Thomas Jefferson",
  "Onde não há esforço, não há progresso. -Frederick Douglass",
  "A saúde é o resultado de não apenas o que você come, mas também do que você pensa.",
  "O corpo alcança o que a mente acredita.",
  "Se você cansar, aprenda a descansar, não a desistir. -Banksy",
  "A força de vontade é um músculo que precisa de exercício.",
  "Não é a carga que o quebra, mas a maneira como você a carrega. -Lou Holtz",
  "O segredo de seguir em frente é começar. -Mark Twain",
  "Seja mais forte que sua melhor desculpa.",
  "Grandes coisas nunca vêm de zonas de conforto.",
  "O fracasso é apenas a oportunidade de começar de novo, desta vez com mais inteligência. -Henry Ford",
  "A única maneira de definir seus limites é indo além deles. -Arthur Clarke",
  "O suor de hoje é o sorriso de amanhã.",
  "Dificuldades preparam pessoas comuns para destinos extraordinários. -C.S. Lewis",
  "Vá firme na direção das suas metas, porque o pensamento cria e o desejo atrai.",
  "Quem não encontra tempo para o exercício, terá que encontrar tempo para a doença. -Edward Derby",
  "Transforme suas desculpas em vontade de vencer.",
  "Para ganhar o que você nunca ganhou, você deve fazer o que nunca fez.",
  "Coragem é a resistência ao medo, o domínio do medo, e não a ausência dele. -Mark Twain",
  "Não deixe que o que você não pode fazer interfira no que você pode fazer. -John Wooden",
  "O destino não é uma questão de sorte, é uma questão de escolha. -William Bryan",
  "O que você faz hoje pode melhorar todos os seus amanhãs. -Ralph Marston",
  "Se você não acredita em si mesmo, ninguém o fará. -Kobe Bryant",
  "Persistência é o caminho do êxito. -Charles Chaplin",
  "Sua mente deve ser mais forte que seus sentimentos.",
  "Nada é impossível para aquele que persiste. -Alexandre, o Grande",
  "O treino não termina quando você está cansado, termina quando você acaba.",
  "Não pare quando estiver doendo, pare quando estiver feito. -David Goggins",
  "Se não houver luta, não haverá progresso. -Frederick Douglass",
  "A dor é apenas a fraqueza saindo do corpo. -Mantra Militar",
  "Tudo o que você precisa já está dentro de você.",
  "Seja a sua própria motivação.",
  "O sucesso não é o final, o fracasso não é fatal: o que conta é a coragem de continuar. -Winston Churchill",
  "Quanto mais difícil a vitória, maior a felicidade em ganhar. -Pelé",
  "A paciência é um elemento fundamental do sucesso. -Bill Gates",
  "O trabalho duro vence o talento quando o talento não trabalha duro. -Tim Notke",
  "Não importa quão devagar você vá, desde que não pare. -Confúcio",
  "Sua vida não melhora por acaso, melhora por mudança. -Jim Rohn",
  "Pense como um campeão. Um campeão não tem medo de falhar. -Billie Jean King",
  "A disciplina é fazer o que precisa ser feito, mesmo quando você não quer.",
  "Não deseje que fosse mais fácil, deseje que você fosse melhor. -Jim Rohn",
  "A consistência é o que transforma o comum em extraordinário.",
  "Uma jornada de mil milhas começa com um único passo. -Lao Tzu",
  "Ganhar não é tudo, mas querer ganhar é. -Vince Lombardi",
  "Acredite que você pode e você estará no meio do caminho. -Theodore Roosevelt",
  "Você perde 100% das chances que não aproveita. -Wayne Gretzky",
  "Esforce-se para progredir, não para ser perfeito.",
  "Foco é dizer não para mil coisas boas. -Steve Jobs",
  "O que você faz consistentemente importa mais do que o que você faz ocasionalmente.",
  "Seja a mudança que você deseja ver no mundo. -Mahatma Gandhi",
  "Sucesso é caminhar de fracasso em fracasso sem perder o entusiasmo. -Winston Churchill",
  "Não conte às pessoas seus planos. Mostre a elas seus resultados.",
  "A melhor vingança é um sucesso estrondoso. -Frank Sinatra",
  "Você é o que você faz, não o que você diz que vai fazer. -C.G. Jung",
  "A única pessoa que você deve tentar ser melhor do que, é a pessoa que você era ontem.",
  "Mantenha seus olhos nas estrelas e seus pés no chão. -Theodore Roosevelt",
  "Não tenha medo de desistir do bom para ir atrás do ótimo. -John D. Rockefeller",
  "A vida começa onde termina sua zona de conforto. -Neale Donald Walsch",
  "Se você quer ser o melhor, aprenda a lidar com o pior.",
  "A diferença entre o impossível e o possível reside na determinação de um homem. -Tommy Lasorda",
  "Tente mover o mundo – o primeiro passo será mover a si mesmo. -Platão",
  "Vencer a si próprio é a maior das vitórias. -Platão",
  "O caráter é aquilo que você é quando não há ninguém olhando. -William Wooden",
  "Seja tão bom que eles não possam te ignorar. -Steve Martin",
  "O entusiasmo é a maior força da alma. -Napoleão Bonaparte",
  "Sonhe grande e ouse falhar. -Norman Vaughan",
  "A determinação de hoje é o sucesso de amanhã.",
  "Somente aqueles que ousam falhar grandemente podem realizar grandemente. -Robert F. Kennedy",
  "A excelência é o resultado gradual de sempre querer fazer melhor. -Pat Riley",
  "Nunca é tarde demais para ser o que você poderia ter sido. -George Eliot",
  "Nada grande jamais foi alcançado sem entusiasmo. -Ralph Waldo Emerson",
  "O único lugar onde o sucesso vem antes do trabalho é no dicionário. -Vidal Sassoon",
  "Você nunca saberá seus limites a menos que se force a alcançá-los.",
  "A cada treino, você está construindo uma versão melhor de si mesmo.",
  "Respeite o processo, colha os resultados.",
  "O corpo é o templo do espírito.",
  "Treine sua mente para ver o bom em cada situação.",
  "Firmeza no propósito e suavidade nos meios. -Claudio Aquaviva",
  "Comece onde você está. Use o que você tem. Faça o que você pode. -Arthur Ashe",
  "Seu corpo pode aguentar quase tudo. É a sua mente que você precisa convencer.",
  "Não diminua a meta, aumente o esforço.",
  "O segredo para vencer é nunca desistir.",
  "A disciplina é a alma do exército. Ela torna grandes as pequenas multidões. -George Washington",
  "O entusiasmo é a eletricidade da vida. Como você o consegue? Você o cria agindo com entusiasmo.",
  "O que importa não é o tamanho do cachorro na briga, mas o tamanho da briga no cachorro. -Magic Johnson",
  "Não pare até se orgulhar de quem você se tornou.",
  "Para ser um campeão, você tem que acreditar em si mesmo quando ninguém mais acredita. -Sugar Ray Robinson",
  "O sucesso não é para os que querem, é para os que fazem por merecer.",
  "Dificuldades reais podem ser superadas; apenas as imaginárias são invencíveis. -Theodore Vail",
  "A dor é o combustível da mudança.",
  "Se você quer chegar onde a maioria não chega, precisa fazer o que a maioria não faz.",
  "A vida começa no final da sua zona de conforto. -Neale Donald Walsch",
  "A força não vem das vitórias. Seus esforços desenvolvem suas forças. -Arnold Schwarzenegger",
  "Não procure por erros, procure por soluções. -Henry Ford",
  "Sua determinação é o seu maior pré-treino.",
  "Onde há vontade, há um caminho.",
  "Acreditar é o primeiro passo para realizar.",
  "O segredo da força está na vontade. -Victor Hugo",
  "Você é capaz de muito mais do que imagina.",
  "Quem tem um porquê suporta quase qualquer como. -Friedrich Nietzsche",
  "Grandes vitórias exigem grandes sacrifícios.",
  "O suor limpa a alma e fortalece o corpo.",
  "A diferença entre o possível e o impossível está na sua dedicação.",
  "Desculpas não queimam calorias.",
  "O hoje é a sua melhor chance de superar o ontem.",
  "A resiliência é a arte de transformar dor em poder.",
  "O corpo é o reflexo da sua mente.",
  "Foco é a capacidade de dizer não para as distrações.",
  "A pressa é inimiga da perfeição, mas a estagnação é inimiga do resultado.",
  "Não conte os dias, faça os dias valerem a pena.",
  "A verdadeira motivação vem de dentro.",
  "O fracasso é apenas um degrau para o sucesso.",
  "Vá além, mesmo quando as pernas pedirem para parar.",
  "Transforme o 'eu não consigo' em 'eu vou tentar até conseguir'.",
  "Sua saúde é o seu maior investimento.",
  "Ninguém pode fazer por você o que só você pode fazer.",
  "A persistência é o que separa o sucesso do fracasso.",
  "Não espere por motivação, construa disciplina.",
  "O segredo é não parar nunca.",
  "Cada repetição conta uma nova história.",
  "Seja a inspiração que você procura.",
  "O limite é uma fronteira criada pela mente.",
  "Não é sobre ter tempo, é sobre priorizar.",
  "Você está a um treino de distância de um humor melhor.",
  "A gratidão gera felicidade, e a felicidade gera energia.",
  "Treine para viver, não viva para treinar.",
  "A constância vence o talento todos os dias.",
  "Seu corpo é sua única casa. Cuide bem dele.",
  "O progresso é lento, mas desistir não o acelera.",
  "Pequenas vitórias diárias levam a grandes conquistas.",
  "O impossível é apenas uma opinião.",
  "Seja sua melhor versão, não a cópia de ninguém.",
  "A vontade de vencer deve ser maior que a vontade de descansar.",
  "Não é apenas exercício, é terapia.",
  "Sua mente é seu mestre, ou seu escravo. Você escolhe.",
  "A excelência é um hábito que se cultiva no dia a dia.",
  "Honre o seu esforço, respeite o seu corpo.",
  "Mude o plano, mas nunca a meta.",
  "O cansaço passa, o resultado fica.",
  "Cada gota de suor é um passo rumo ao objetivo.",
  "Não se compare aos outros, compare-se a quem você era ontem.",
  "A força de vontade não tem limites.",
  "O treino de hoje é a saúde de amanhã.",
  "Supere seus medos e encontrará sua força.",
  "Nada substitui o trabalho duro.",
  "A vitória pertence àqueles que acreditam nela por mais tempo. -Napoleão Bonaparte",
  "Otimismo é a fé que leva à realização. -Helen Keller",
  "Seja a mudança que você quer ver no seu corpo.",
  "O sucesso começa quando a desculpa termina.",
  "Treinar é um ato de amor próprio.",
  "Domine a sua mente e você dominará o seu mundo.",
  "O poder está na sua escolha de continuar.",
  "Sua evolução é constante, basta não desistir.",
  "O esforço de hoje é a conquista de amanhã.",
  "Você é o arquiteto do seu próprio corpo.",
  "Desafie-se todos os dias.",
  "A disciplina te leva onde a motivação não consegue.",
  "O resultado é proporcional ao esforço.",
  "Sinta o orgulho de cada etapa vencida.",
  "A jornada é tão importante quanto o destino.",
  "Acredite no processo.",
  "Você é mais forte do que imagina.",
  "Não pare até atingir sua meta.",
  "O foco determina a realidade.",
  "A cada dia, um novo desafio, uma nova vitória.",
  "A saúde mental e a física caminham juntas.",
  "O suor é a prova de que você está lutando.",
  "Não deixe para amanhã o treino que você pode fazer hoje.",
  "O sucesso é construído com suor e dedicação.",
  "A força está na mente, o corpo apenas obedece.",
  "Seja persistente, os resultados virão.",
  "O treino é a base de uma vida saudável.",
  "Supere-se a cada repetição.",
  "A motivação te põe no caminho, o hábito te leva adiante.",
  "Não existe elevador para o sucesso, você tem que subir as escadas.",
  "Cada desafio é uma oportunidade de crescer.",
  "O esforço nunca é em vão.",
  "Mantenha o foco, a meta está logo ali.",
  "Acredite na sua força interior.",
  "O segredo do sucesso é a constância no propósito. -Benjamin Disraeli",
  "Não olhe para o relógio, faça o que ele faz: continue andando. -Sam Levenson",
  "O corpo é a ferramenta, a mente é o motor."
];


function openShareCard(db) {
  const treino = getTodayTreino(db);
  const fichaIds = db.fichas[treino] || [];
  const exercicios = fichaIds.map(id => getExById(db, id)).filter(Boolean);
  const streak = getStreak(db);
  
  // Calcular Volume e Destaques
  let totalVol = 0;
  const exStats = exercicios.map(ex => {
    const s = parseInt(ex.series) || 0;
    const r = parseInt(ex.repeticoes) || 0;
    const c = parseFloat(String(ex.carga).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const vol = s * r * c;
    totalVol += vol;
    return { name: ex.nome, vol, carga: ex.carga };
  });

  // Ordenar por volume para pegar os 3 destaques
  const highlights = [...exStats].sort((a,b) => b.vol - a.vol).slice(0, 3);

  document.getElementById('shareDate').textContent = todayLabel().toUpperCase();
  document.getElementById('shareTitle').textContent = `TREINO ${treino}: ${exercicios.length} EXERCÍCIOS`;
  document.getElementById('shareExCount').textContent = exercicios.length;
  document.getElementById('shareVol').textContent = totalVol.toLocaleString('pt-BR');
  document.getElementById('shareStreak').textContent = streak + (streak ? '🔥' : '');
  
  // Lista de Destaques
  document.getElementById('shareHighlightsList').innerHTML = highlights.map(h => `
    <div class="sh-item">
      <span class="sh-name">${h.name}</span>
      <span class="sh-val">${h.carga || h.vol + 'kg total'}</span>
    </div>
  `).join('');

  // Frase Aleatória
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.querySelector('.share-quote').textContent = `"${quote}"`;
  
  // Mostrar apenas o card de treino
  document.getElementById('shareCardBadge').style.display = 'none';
  document.getElementById('shareCard').style.display = 'flex';
  
  openModal('modalShare');
}

function downloadShareImage() {
  const isBadge = document.getElementById('shareCardBadge').style.display !== 'none';
  const card = isBadge ? document.getElementById('shareCardBadge') : document.getElementById('shareCard');
  const btn = document.getElementById('btnDownloadImage');
  const originalBtnText = btn.innerHTML;
  
  btn.innerHTML = '<span>⏳</span> GERANDO...';
  btn.disabled = true;

  // html2canvas options for high quality
  html2canvas(card, {
    scale: 2, // Double resolution
    backgroundColor: '#000000',
    useCORS: true,
    logging: false
  }).then(canvas => {
    const link = document.createElement('a');
    const name = isBadge ? 'conquista' : 'treino';
    link.download = `meu-${name}-${today()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
    
    btn.innerHTML = originalBtnText;
    btn.disabled = false;
    showToast('Imagem gerada com sucesso! Confira seus downloads.', 'success');
  }).catch(err => {
    console.error(err);
    btn.innerHTML = originalBtnText;
    btn.disabled = false;
    showToast('Erro ao gerar imagem. Tente tirar um print.', 'error');
  });
}

function copyShareText(db) {
  const treino = getTodayTreino(db);
  const streak = getStreak(db);
  const text = `🔥 Treino ${treino} concluído na AcademiaPRO!\n🚀 Ofensiva: ${streak} dias\n💪 Bora pra cima!`;
  
  navigator.clipboard.writeText(text).then(() => {
    showToast('Resumo copiado para a área de transferência!', 'success');
  });

  if (navigator.share) {
    navigator.share({
      title: 'Meu Treino na AcademiaPRO',
      text: text,
      url: window.location.href
    }).catch(() => {});
  }
}

// ---- TEMAS ----
const APP_THEMES = {
  purple: { p: '#8b5cf6', pl: '#c084fc', pd: '#6d28d9' },
  green: { p: '#22c55e', pl: '#4ade80', pd: '#16a34a' },
  blue: { p: '#3b82f6', pl: '#60a5fa', pd: '#2563eb' },
  orange: { p: '#f97316', pl: '#fb923c', pd: '#ea580c' },
  red: { p: '#ef4444', pl: '#f87171', pd: '#dc2626' },
  cyan: { p: '#06b6d4', pl: '#22d3ee', pd: '#0891b2' }
};

function applyAppTheme(themeKey) {
  const theme = APP_THEMES[themeKey];
  if (!theme) return;
  
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.p);
  root.style.setProperty('--primary-light', theme.pl);
  root.style.setProperty('--primary-dark', theme.pd);
  root.style.setProperty('--gradient', `linear-gradient(135deg, ${theme.p}, ${theme.pd})`);
  root.style.setProperty('--shadow', `rgba(${hexToRgb(theme.p)}, 0.3)`);
  
  localStorage.setItem('academia_theme', themeKey);
  
  // Atualiza UI
  document.querySelectorAll('.t-color').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === themeKey);
  });
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

// ---- TEMPLATES ----
const TEMPLATES_PRONTOS = {
  hipertrofia_iniciante: {
    A: ['ex-a1', 'ex-a2', 'ex-a5', 'ex-a6', 'ex-a8'],
    B: ['ex-b1', 'ex-b2', 'ex-b5', 'ex-b4', 'ex-b7']
  },
  perda_ponderal: {
    A: ['ex-a1', 'ex-a2', 'ex-a3', 'ex-a4', 'ex-a5', 'ex-a6', 'ex-tric-pulley', 'ex-supra-solo'],
    B: ['ex-b1', 'ex-b2', 'ex-b3', 'ex-b4', 'ex-b5', 'ex-burrinho', 'ex-b7', 'ex-supra-solo'],
    ae: { tipo: 'Esteira', vel: '5.0', tempo: '20' }
  },
  sup_inf: {
    A: ['ex-a1', 'ex-a2', 'ex-b1', 'ex-b2', 'ex-a6'],
    B: ['ex-a5', 'ex-b5', 'ex-a8', 'ex-b8']
  },
  push_pull: {
    A: ['ex-a1', 'ex-a2', 'ex-a6', 'ex-a7'],
    B: ['ex-b1', 'ex-b2', 'ex-b7', 'ex-b8']
  }
};

function applyTemplate(db, templateKey) {
  const tpl = TEMPLATES_PRONTOS[templateKey];
  if (!tpl) return;

  if (!confirm("Isso irá substituir suas fichas A e B atuais. Deseja continuar?")) return;

  db.fichas.A = [...tpl.A];
  db.fichas.B = [...tpl.B];
  
  if (tpl.ae) {
    db.aerobicos.A = {...tpl.ae};
    db.aerobicos.B = {...tpl.ae};
  } else {
    db.aerobicos.A = null;
    db.aerobicos.B = null;
  }
  
  startNewCycle(db, 'Template Aplicado');
  
  saveDB(db);
  renderMontar(db);
  renderFicha(db);
  showToast('Template aplicado com sucesso!', 'success');
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  const db = loadDB();

  renderHeroStats(db);
  initTabs();
  renderFicha(db);
  renderExercicios(db);
  renderMontar(db);
  renderProgresso(db);
  initCalculator();

  // Treino selector (A/B)
  document.querySelectorAll('.sel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setTodayTreino(db, btn.dataset.treino);
      renderFicha(db);
      showToast('Treino ' + btn.dataset.treino + ' selecionado!','info');
    });
  });

  // Calendar View Toggle
  const btnMonthly = document.getElementById('btnMonthlyView');
  const btnWeekly = document.getElementById('btnWeeklyView');
  const cardMonthly = document.getElementById('monthlyCalendarCard');
  const cardWeekly = document.getElementById('weeklyPlannerCard');

  if (btnMonthly && btnWeekly) {
    btnMonthly.addEventListener('click', () => {
        btnMonthly.classList.add('active');
        btnWeekly.classList.remove('active');
        if (cardMonthly) cardMonthly.style.display = 'block';
        if (cardWeekly) cardWeekly.style.display = 'none';
        localStorage.setItem('academia_calendar_view', 'monthly');
    });

    btnWeekly.addEventListener('click', () => {
        btnWeekly.classList.add('active');
        btnMonthly.classList.remove('active');
        if (cardMonthly) cardMonthly.style.display = 'none';
        if (cardWeekly) cardWeekly.style.display = 'block';
        localStorage.setItem('academia_calendar_view', 'weekly');
        renderWeeklyPlanner(db);
    });

    // Restore preference
    const pref = localStorage.getItem('academia_calendar_view');
    if (pref === 'weekly') btnWeekly.click();

    // Calendar Navigation Listeners
    const changeMonth = (delta) => {
        calendarViewDate.setMonth(calendarViewDate.getMonth() + delta);
        renderProgresso(db);
        renderWeeklyPlanner(db);
    };

    document.getElementById('prevMonth')?.addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth')?.addEventListener('click', () => changeMonth(1));
    document.getElementById('prevWeekMonth')?.addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextWeekMonth')?.addEventListener('click', () => changeMonth(1));
  }

  // View selector (Table/Grid)
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentViewMode = btn.dataset.view;
      localStorage.setItem('academia_view_mode', currentViewMode);
      document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderFicha(db);
      showToast('Visualização em ' + (currentViewMode === 'grid' ? 'Grid' : 'Tabela') + ' ativada!','info');
    });
  });

  // Novo exercício
  document.getElementById('btnNovoExercicio')?.addEventListener('click', openNewExercicio);

  // View selector init
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === currentViewMode);
  });

  // Iniciar Modo Foco
  document.getElementById('btnStartFocus')?.addEventListener('click', () => startFocusMode(db));
  document.getElementById('btnCloseFocus')?.addEventListener('click', () => closeModal('modalFocus'));
  document.getElementById('btnFocusPrev')?.addEventListener('click', () => {
    if (focusIndex > 0) { focusIndex--; updateFocusUI(db); }
  });
  document.getElementById('btnFocusNext')?.addEventListener('click', () => {
    if (focusIndex < focusFicha.length - 1) { focusIndex++; updateFocusUI(db); }
  });
  document.getElementById('btnFocusCheck')?.addEventListener('click', () => focusCheck(db));

  // Compartilhamento
  document.getElementById('btnShareWorkout')?.addEventListener('click', () => openShareCard(db));
  document.getElementById('btnFecharShare')?.addEventListener('click', () => closeModal('modalShare'));
  document.getElementById('btnCopyShare')?.addEventListener('click', () => copyShareText(db));
  document.getElementById('btnDownloadImage')?.addEventListener('click', () => downloadShareImage());

  // Upload
  document.getElementById('uploadArea')?.addEventListener('click', () => document.getElementById('uploadInput').click());
  document.getElementById('uploadInput')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { showToast('Imagem muito grande (máx. 2MB).','error'); return; }
    const reader = new FileReader();
    reader.onload = ev => setUploadPreview(ev.target.result);
    reader.readAsDataURL(file);
  });
  document.getElementById('btnRemoveImg')?.addEventListener('click', e => { e.stopPropagation(); resetUpload(); });

  // Form exercício submit
  document.getElementById('formExercicio')?.addEventListener('submit', e => { e.preventDefault(); saveExercicio(db); });
  document.getElementById('btnFecharExercicio')?.addEventListener('click', () => closeModal('modalExercicio'));
  document.getElementById('btnCancelarEx')?.addEventListener('click', () => closeModal('modalExercicio'));

  // Search exercícios
  document.getElementById('searchInput')?.addEventListener('input', e => {
    currentSearch = e.target.value;
    renderExercicios(db);
  });

  // Filtros de grupo
  document.querySelectorAll('.g-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.g-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.grupo;
      renderExercicios(db);
    });
  });

  // Montar ficha — botões de adicionar
  document.querySelectorAll('.btn-add-to-ficha').forEach(btn => {
    btn.addEventListener('click', () => openPicker(db, btn.dataset.treino));
  });
  document.getElementById('btnFecharPicker')?.addEventListener('click', () => closeModal('modalPicker'));
  document.getElementById('pickerSearch')?.addEventListener('input', e => {
    pickerSearch = e.target.value;
    renderPickerList(db);
  });

  // Salvar fichas
  document.getElementById('btnSalvarFicha')?.addEventListener('click', () => {
    ['A','B','C','D','E'].forEach(letra => {
       const tipo = document.querySelector(`.ae-tipo[data-treino="${letra}"]`).value;
       const vel = document.querySelector(`.ae-vel[data-treino="${letra}"]`).value;
       const tempo = document.querySelector(`.ae-tempo[data-treino="${letra}"]`).value;
       db.aerobicos[letra] = tipo ? { tipo, vel, tempo } : null;
    });
    saveDB(db);
    startNewCycle(db, 'Fichas Alteradas');
    showToast('Fichas salvas com sucesso!','success');
    renderFicha(db);
    renderHeroStats(db);
  });

  // Modal conclusão
  document.getElementById('btnFecharConclusao')?.addEventListener('click', () => closeModal('modalConclusao'));

  // Modal Histórico do Dia
  document.getElementById('btnFecharDayHist')?.addEventListener('click', () => closeModal('modalDayHist'));

  // Modal Imagem Ampliada
  document.addEventListener('click', e => {
    if (e.target.tagName === 'IMG' && (e.target.closest('.img-placeholder') || e.target.closest('.ex-card-img'))) {
      const src = e.target.src;
      document.getElementById('enlargedImage').src = src;
      openModal('modalImage');
    }
  });
  document.getElementById('btnFecharImage')?.addEventListener('click', () => closeModal('modalImage'));

  // Fechar modais clicando fora
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // ESC fecha modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => {
        if (m.style.display === 'flex') closeModal(m.id);
      });
    }
  });

  // Cronômetro (interações do widget)
  document.getElementById('rtClose')?.addEventListener('click', (e) => {
    e.stopPropagation();
    stopRestTimer();
  });
  document.getElementById('restTimer')?.addEventListener('click', () => {
    startRestTimer(60); // Clicar no cronômetro o reinicia
  });

  // Cronômetro (Configurações)
  const styleRadios = document.querySelectorAll('input[name="timerStyle"]');
  const savedStyle = getTimerStyle();
  styleRadios.forEach(r => {
    if (r.value === savedStyle) r.checked = true;
    r.addEventListener('change', (e) => {
      localStorage.setItem('timerStyle', e.target.value);
    });
  });

  // Templates listeners
  document.querySelectorAll('.btn-template').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTemplate(db, btn.dataset.template);
    });
  });

  // Themes listeners
  const savedTheme = localStorage.getItem('academia_theme') || 'purple';
  applyAppTheme(savedTheme);
  
  document.querySelectorAll('.t-color').forEach(btn => {
    btn.addEventListener('click', () => {
      applyAppTheme(btn.dataset.theme);
      showToast('Tema atualizado!', 'info');
    });
  });

  // Delegar eventos para botões de nota dinâmicos
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-note-toggle, .btn-note-toggle-table');
    if (btn) {
      const ex = getExById(db, btn.dataset.id);
      if (ex) showNotePopover(ex, btn);
    }
  });

  // Quick Tags no Modal
  document.querySelectorAll('.q-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const txt = document.getElementById('inputAnotacoes');
      const tag = btn.dataset.tag;
      txt.value += (txt.value && !txt.value.endsWith('\n') ? '\n' : '') + tag;
      txt.focus();
    });
  });

  // Backup e Dados
  const btnExport = document.getElementById('btnExportarDados');
  const btnImport = document.getElementById('btnImportarDados');
  if (btnExport) btnExport.onclick = () => exportData(db);
  if (btnImport) btnImport.onclick = () => importData(db);

  // Versão do Aplicativo — voltar para a versão mais recente (React)
  const btnVoltarVersaoAtual = document.getElementById('btnVoltarVersaoAtual');
  if (btnVoltarVersaoAtual) btnVoltarVersaoAtual.onclick = () => {
    // A pasta desta versão fica um nível abaixo da raiz do app.
    window.location.href = '../';
  };

});

// ---- BACKUP E DADOS ----
function exportData(db) {
  try {
    const dataStr = JSON.stringify(db, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const exportFileDefaultName = 'academia_backup_' + today() + '.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    URL.revokeObjectURL(url);
    
    showToast('Dados exportados com sucesso!', 'success');
  } catch (err) {
    showToast('Erro ao exportar dados.', 'error');
    console.error(err);
  }
}

function importData(db) {
  const input = document.getElementById('inputImportarJSON');
  if (!input) return;
  input.click();

  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    if (confirm('⚠️ AVISO CRÍTICO: Esta ação irá APAGAR todos os seus dados atuais (exercícios, histórico, conquistas e fichas) e substituí-los pelos dados do arquivo.\n\nVocê tem certeza absoluta que deseja continuar?')) {
      const reader = new FileReader();
      reader.onload = readerEvent => {
        try {
          const content = readerEvent.target.result;
          const newDb = JSON.parse(content);
          
          // Validação básica da estrutura
          if (!newDb.exercicios || !newDb.fichas || !newDb.historico) {
            throw new Error('O arquivo não parece ser um backup válido da Academia.');
          }

          localStorage.setItem(DB_KEY, JSON.stringify(newDb));
          showToast('Importação bem-sucedida! Reiniciando...', 'success');
          setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
          showToast('Erro ao importar: ' + err.message, 'error');
          console.error(err);
        }
      };
      reader.readAsText(file);
    }
    input.value = '';
  };
}

// ---- POPOVER DE NOTA ----
function showNotePopover(ex, triggerEl) {
  const old = document.querySelector('.note-popover');
  if (old) old.remove();

  const popover = document.createElement('div');
  popover.className = 'note-popover';
  popover.innerHTML = `
    <div class="popover-header">
      <strong>📝 Notas: ${ex.nome}</strong>
      <button class="popover-close">✕</button>
    </div>
    <div class="popover-body">
      ${ex.anotacoes ? ex.anotacoes.replace(/\n/g, '<br>') : '<i style="color:var(--text-tertiary)">Nenhuma anotação...</i>'}
    </div>
    <div class="popover-footer">
      <button class="btn-popover-edit" data-id="${ex.id}">✏️ Editar Detalhes</button>
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
