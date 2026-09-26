'use strict';
// =============================================
// ACADEMIA — TREINO.JS
// Fichas de treino com localStorage
// =============================================

const DB_KEY = 'academia_treino';

// ---- MAESTRIA: Definição dos Desafios (Clash Royale Style) ----
const MAESTRIA_CHALLENGES = [
  {
    id: 1, badge: 'bronze', label: 'Desafio de Bronze', icon: '🔥',
    subDesafios: [
      { id: 1, label: 'Primeiros Passos',   desc: 'Complete este exercício 5 vezes',   target: 5  },
      { id: 2, label: 'Desenvolvendo Força',desc: 'Complete este exercício 15 vezes',  target: 15 },
      { id: 3, label: 'Consistência',       desc: 'Complete este exercício 30 vezes',  target: 30 }
    ]
  },
  {
    id: 2, badge: 'prata', label: 'Desafio de Prata', icon: '⚔️',
    subDesafios: [
      { id: 1, label: 'Dedicado',    desc: 'Complete este exercício 50 vezes',  target: 50  },
      { id: 2, label: 'Veterano',    desc: 'Complete este exercício 75 vezes',  target: 75  },
      { id: 3, label: 'Especialista',desc: 'Complete este exercício 100 vezes', target: 100 }
    ]
  },
  {
    id: 3, badge: 'ouro', label: 'Desafio de Ouro', icon: '👑',
    subDesafios: [
      { id: 1, label: 'Elite',         desc: 'Complete este exercício 150 vezes', target: 150 },
      { id: 2, label: 'Lendário',      desc: 'Complete este exercício 200 vezes', target: 200 },
      { id: 3, label: 'Maestria Plena',desc: 'Complete este exercício 300 vezes', target: 300 }
    ]
  }
];

// Estado do Deck Builder (Clash Royale Style)
let currentDeckLetter = 'A';
let currentDeckPage = 1;
let currentDeckView = 'royale'; // 'royale', 'grid' ou 'list'
let currentExView = 'colecao'; // 'grid' ou 'colecao'

// Dados padrão
const DEFAULT_EXERCISES = [
  { id: 'ex-a1', nome: 'Supino Articulado', grupoMuscular: 'Peito', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Supino Articulado.gif', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-a2', nome: 'Voador', grupoMuscular: 'Peito', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Fly.webp', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-a3', nome: 'Supino Vertical', grupoMuscular: 'Ombros', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Supino Vertical.gif', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-a4', nome: 'Crucifixo', grupoMuscular: 'Peito', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Crucifixo.gif', tags: ['Isolador', 'Máquina'], porLado: true },
  { id: 'ex-a5', nome: 'Leg Press 45° + Banco Extenso', grupoMuscular: 'Pernas', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Leg Press 180° + Banco Extenso.gif', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-a6', nome: 'Desenvolvimento Máquina', grupoMuscular: 'Ombros', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Desenvolvimento Máquina.gif', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-a7', nome: 'Tríceps Testa + Pull Over', grupoMuscular: 'Tríceps', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Tríceps Testa + Pull Over.gif', tags: ['Isolador', 'Livre'] },
  { id: 'ex-a8', nome: 'Supra Prancha', grupoMuscular: 'Core', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Supra Prancha.gif', tags: ['Isolador', 'Livre', 'Peso do Corpo'] },
  { id: 'ex-b1', nome: 'Puxada Frente', grupoMuscular: 'Costas', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Puxada Frente.gif', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-b2', nome: 'Remada Baixa', grupoMuscular: 'Costas', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Remada Baixa.gif', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-b3', nome: 'Puxada Articulada', grupoMuscular: 'Costas', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Puxada Articulada.gif', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-b4', nome: 'Elevação Lateral', grupoMuscular: 'Ombros', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Elevação Lateral.gif', tags: ['Isolador', 'Livre'], porLado: true },
  { id: 'ex-b5', nome: 'Banco Flexor', grupoMuscular: 'Pernas', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Banco Flexor.gif', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-b6', nome: 'Remada Alta', grupoMuscular: 'Costas', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Remada Alta.gif', tags: ['Multiarticular', 'Livre'] },
  { id: 'ex-b7', nome: 'Rosca Scoott', grupoMuscular: 'Bíceps', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Rosca Scott.gif', tags: ['Isolador', 'Máquina'], porLado: true },
  { id: 'ex-b8', nome: 'Infra Paralelo', grupoMuscular: 'Peito', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Infra Paralelo.gif', tags: ['Isolador', 'Livre', 'Peso do Corpo'] },
  { id: 'ex-supra-solo', nome: 'Supra solo', grupoMuscular: 'Core', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Supra solo.gif', tags: ['Isolador', 'Livre', 'Peso do Corpo'] },
  { id: 'ex-burrinho', nome: 'Burrinho', grupoMuscular: 'Pernas', series: 3, repeticoes: '12', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Burrinho.gif', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-tric-pulley', nome: 'Tric Pulley + Palmar', grupoMuscular: 'Tríceps', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Tric Pulley.gif', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-banco-abdutor', nome: 'Banco Abdutor', grupoMuscular: 'Pernas', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Banco Abdutor.gif', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-agachamento', nome: 'Agachamento Livre', grupoMuscular: 'Pernas', series: 3, repeticoes: '10', carga: '', descanso: 60, imagem: './Assets/exerciciosgif/Agachamento.gif', tags: ['Multiarticular', 'Livre'] },
  { id: 'ex-flexao', nome: 'Flexão de Braços', grupoMuscular: 'Peito', series: 3, repeticoes: 'Máx', carga: '', descanso: 45, imagem: './Assets/exerciciosgif/Flexao.gif', tags: ['Multiarticular', 'Peso do Corpo'] },
  { id: 'ex-panturrilha', nome: 'Panturrilha em Pé', grupoMuscular: 'Pernas', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Panturrilha.gif', tags: ['Isolador', 'Máquina'] },
  // Novos para Tonificar
  { id: 'ex-gluteo-3a', nome: 'Glúteo 3 Apoio', grupoMuscular: 'Pernas', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Gluteo 3 Apoios.gif', tags: ['Isolador', 'Peso do Corpo'] },
  { id: 'ex-abducao-solo', nome: 'Abdução Solo', grupoMuscular: 'Pernas', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Abducao Solo.gif', tags: ['Isolador', 'Peso do Corpo'] },
  { id: 'ex-supra-ponte', nome: 'Supra Solo + Ponte Ventral', grupoMuscular: 'Core', series: 3, repeticoes: '15 + 20"', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Prancha.gif', tags: ['Multiarticular', 'Peso do Corpo'] },
  { id: 'ex-extensor', nome: 'Banco Extensor', grupoMuscular: 'Pernas', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Banco Extensor.gif', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-leg-180', nome: 'Leg Press 180°', grupoMuscular: 'Pernas', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Leg Press 180.gif', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-banco-adutor', nome: 'Banco Adutor', grupoMuscular: 'Pernas', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Banco Adutor.gif', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-infra-solo', nome: 'Infra Solo', grupoMuscular: 'Core', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Infra solo.gif', tags: ['Isolador', 'Peso do Corpo'] },
  // Novos para Hipertrofia Médio
  { id: 'ex-elev-frontal', nome: 'Elevação Frontal', grupoMuscular: 'Ombros', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Elevação Frontal.webp', tags: ['Isolador', 'Livre'], porLado: true },
  { id: 'ex-tric-puller', nome: 'Tríceps Puller', grupoMuscular: 'Tríceps', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Triceps Puller.gif', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-agach-gaiola', nome: 'Agachamento Gaiola', grupoMuscular: 'Pernas', series: 3, repeticoes: '10', carga: '', descanso: 60, imagem: './Assets/exerciciosgif/Agachamento Terra Gaiola.gif', tags: ['Multiarticular', 'Livre'] },
  { id: 'ex-voo-45', nome: 'Voo 45°', grupoMuscular: 'Peito', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Voador 45.gif', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-infra-prancha', nome: 'Infra Prancha', grupoMuscular: 'Core', series: 3, repeticoes: '20', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Infra Prancha.gif', tags: ['Isolador', 'Peso do Corpo'] },
  { id: 'ex-roscamartelo', nome: 'Rosca Martelo', grupoMuscular: 'Bíceps', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Rosca martelo.gif', tags: ['Isolador', 'Livre'] },
  { id: 'ex-ponteventral', nome: 'Ponte Ventral', grupoMuscular: 'Core', series: 3, repeticoes: '20"', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Ponte ventral.gif', tags: ['Isolador', 'Peso do Corpo'] },
  { id: 'ex-remad-artic', nome: 'Remada Articulada', grupoMuscular: 'Costas', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Remada articulada.gif', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-leg-45', nome: 'Leg 45°', grupoMuscular: 'Pernas', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/LEG 45.gif', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-roscamartelo-90', nome: 'Rosca 90°', grupoMuscular: 'Bíceps', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Rosca 90.gif', tags: ['Isolador', 'Máquina'] },
];

const DEFAULT_FICHAS = {
  A: ['ex-a1', 'ex-a2', 'ex-a5', 'ex-a6', 'ex-a8'],
  B: ['ex-b1', 'ex-b2', 'ex-b5', 'ex-b4', 'ex-b7'],
  C: [], D: [], E: [], F: [], G: [], H: [], I: [], J: []
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
        db.exercicios.push({ ...def });
        updated = true;
      }
    });

    if (!db.aerobicos) {
      db.aerobicos = { A: null, B: null, C: null, D: null, E: null, F: null, G: null, H: null, I: null, J: null };
      updated = true;
    } else {
      // Ensure all J letters exist
      ['F', 'G', 'H', 'I', 'J'].forEach(l => {
        if (db.aerobicos[l] === undefined) { db.aerobicos[l] = null; updated = true; }
        if (db.fichas[l] === undefined) { db.fichas[l] = []; updated = true; }
      });
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
      db.currentCycleBreakdown = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 };
      updated = true;
    } else {
      ['F', 'G', 'H', 'I', 'J'].forEach(l => {
        if (db.currentCycleBreakdown[l] === undefined) { db.currentCycleBreakdown[l] = 0; updated = true; }
      });
    }

    if (!db.currentCycleStartDate) {
      db.currentCycleStartDate = today();
      updated = true;
    }

    if (!db.maestrias) {
      db.maestrias = {};
      updated = true;
    }

    // Garantir maestria para todos os exercícios
    db.exercicios.forEach(ex => {
      if (!db.maestrias[ex.id]) {
        db.maestrias[ex.id] = {
          nivel: 1,
          challenges: [
            { id: 1, stage: 1, current: 0, completed: false, locked: false },
            { id: 2, stage: 1, current: 0, completed: false, locked: true },
            { id: 3, stage: 1, current: 0, completed: false, locked: true }
          ]
        };
        updated = true;
      }
    });

    if (!db.selectedEmblems) {
      db.selectedEmblems = [];
      updated = true;
    }

    if (updated) {
      saveDB(db);
    }

    return db;
  } catch (e) { return initDB(); }
}

function initDB() {
  const db = {
    exercicios: [...DEFAULT_EXERCISES],
    fichas: { ...DEFAULT_FICHAS },
    aerobicos: { A: null, B: null, C: null, D: null, E: null, F: null, G: null, H: null, I: null, J: null },
    historico: {},
    conquistas: [],
    currentFichaWorkouts: 0,
    currentCycleBreakdown: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
    currentCycleStartDate: today(),
    cycleEvents: { [today()]: 'Início do Ciclo' },
    fichasArquivadas: [],
    selectedEmblems: [],
    maestrias: {}
  };

  db.exercicios.forEach(ex => {
    db.maestrias[ex.id] = {
      nivel: 1,
      challenges: [
        { id: 1, stage: 1, current: 0, completed: false, locked: false },
        { id: 2, stage: 1, current: 0, completed: false, locked: true },
        { id: 3, stage: 1, current: 0, completed: false, locked: true }
      ]
    };
  });

  saveDB(db);
  return db;
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// ---- UTILS ----
function uid() { return 'ex-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7); }

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayLabel() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function formatCarga(carga, porLado = false, tags = []) {
  if (tags && tags.includes('Peso do Corpo')) return 'Peso do Corpo';
  if (!carga) return '';
  const c = String(carga).trim();
  const label = c.toLowerCase().endsWith('kg') ? c : c + 'kg';
  return porLado ? `${label} cada lado` : label;
}

function formatSeconds(seconds) {
  if (!seconds) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function determineTreinoDoDia(db) {
  const hist = db.historico;
  const dates = Object.keys(hist).sort().reverse(); // Do mais recente para o mais antigo

  for (const date of dates) {
    const entry = hist[date];
    const treinos = entry.treinos || (entry.concluido ? [entry.treino] : []);

    if (treinos.length > 0) {
      const lastTreino = treinos[treinos.length - 1];
      const order = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const currentIdx = order.indexOf(lastTreino);

      // Encontra a próxima ficha que NÃO esteja vazia
      for (let i = 1; i <= 10; i++) {
        const nextIdx = (currentIdx + i) % 10;
        const nextLetra = order[nextIdx];
        const temExercicios = db.fichas[nextLetra] && db.fichas[nextLetra].filter(Boolean).length > 0;
        const temCardio = db.aerobicos && db.aerobicos[nextLetra] && db.aerobicos[nextLetra].tipo;
        if (temExercicios || temCardio) {
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
  return 'grupo-badge badge-' + (grupo || '').replace(/[íéóãõê]/g, c => ({ 'í': 'i', 'é': 'e', 'ó': 'o', 'ã': 'a', 'õ': 'o', 'ê': 'e' }[c] || c));
}

function showToast(msg, type = 'info') {
  const tc = document.getElementById('toastContainer');
  if (!tc) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 350); }, 3000);
}

// ---- RENDER HERO STATS ----
let currentViewMode = localStorage.getItem('academia_view_mode') || 'grid'; // table ou grid
function renderHeroStats(db) {
  const el = id => document.getElementById(id);
  el('statTotalEx') && (el('statTotalEx').textContent = db.exercicios.length);
  const streak = getStreak(db);
  if (el('statStreak')) {
    if (streak) {
      el('statStreak').innerHTML = `${streak}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="color:#f97316; margin-left: 2px; display: inline-block; vertical-align: middle;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
    } else {
      el('statStreak').innerHTML = '0';
    }
  }

  // Stats do Perfil
  const hist = db.historico || {};
  const completedDates = Object.keys(hist).filter(d => hist[d].concluido);
  const xp = completedDates.length * 10;

  el('profStreak') && (el('profStreak').textContent = streak + (streak === 1 ? ' dia' : ' dias'));
  el('profXp') && (el('profXp').textContent = xp + ' XP');
  renderSelectedEmblems(db);
}

// ---- BOTTOM NAV + SUB-TAB NAVIGATION ----
function initTabs(db) {
  // ---- 1. BOTTOM NAV: alterna as main-sections ----
  const bnavBtns = document.querySelectorAll('.bnav-btn');
  const mainSections = document.querySelectorAll('.main-section');

  let isAnimating = false;

  function switchSection(sectionId, direction = 'none') {
    if (isAnimating) return;
    
    let currentSection = null;
    mainSections.forEach(s => {
      if (s.classList.contains('active')) currentSection = s;
    });
    
    const target = document.getElementById('section-' + sectionId);
    if (!target || target === currentSection) return;
    
    bnavBtns.forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.bnav-btn[data-section="${sectionId}"]`);
    if (btn) btn.classList.add('active');

    // Limpa quaisquer classes residuais
    mainSections.forEach(s => {
      s.classList.remove('slide-in-right', 'slide-in-left', 'slide-out-left', 'slide-out-right', 'soft-fade');
      if (s !== currentSection) s.classList.remove('active');
    });

    if (currentSection && direction !== 'none') {
      isAnimating = true;
      
      if (direction === 'left') {
        currentSection.classList.add('slide-out-left');
        target.classList.add('slide-in-right', 'active');
      } else {
        currentSection.classList.add('slide-out-right');
        target.classList.add('slide-in-left', 'active');
      }
      
      // Cleanup após a animação
      setTimeout(() => {
        if (currentSection) {
          currentSection.classList.remove('active', 'slide-out-left', 'slide-out-right');
        }
        target.classList.remove('slide-in-right', 'slide-in-left');
        isAnimating = false;
      }, 400); // 400ms = duração do CSS
      
    } else {
      if (currentSection) currentSection.classList.remove('active');
      target.classList.add('soft-fade', 'active');
    }
    // Renderiza conteúdo da seção ao entrar
    if (sectionId === 'montar' || sectionId === 'treinos') {
      currentDeckPage = ['F','G','H','I','J'].includes(currentDeckLetter) ? 2 : 1;
      renderMontar(db);
    }
  }

  bnavBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      // Find current active index to determine slide direction on tap as well
      let currentIndex = 0;
      bnavBtns.forEach((b, i) => { if (b.classList.contains('active')) currentIndex = i; });
      const targetIndex = index;
      
      let direction = 'none';
      if (targetIndex > currentIndex) direction = 'left';
      else if (targetIndex < currentIndex) direction = 'right';
      
      switchSection(btn.dataset.section, direction);
    });
  });

  // ---- 2. SUB-TABS: dentro da section-treinos (exercicios / montar) ----
  const subTabSection = document.querySelector('#section-treinos');
  if (subTabSection) {
    subTabSection.querySelectorAll('.t-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        subTabSection.querySelectorAll('.t-tab-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        subTabSection.querySelectorAll('.t-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const tabId = btn.dataset.tab;
        const tab = document.getElementById('tab-' + tabId);
        if (tab) {
          tab.classList.add('active');
          if (tabId === 'montar') {
            currentDeckPage = ['F','G','H','I','J'].includes(currentDeckLetter) ? 2 : 1;
            renderMontar(db);
          }
        }
      });
    });
  }

  // ---- 3. SWIPE GESTURES: alternar main-sections com deslize horizontal ----
  const sectionsOrder = ['ficha', 'progresso', 'treinos', 'perfil', 'social', 'loja'];
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;

  document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe(e.target);
  }, { passive: true });

  function handleSwipe(target) {
    // Ignorar swipe em elementos que possuem rolagem horizontal nativa
    if (target.closest('.table-scroll-wrap') || 
        target.closest('.month-grid') || 
        target.closest('.theme-colors') ||
        target.tagName.toLowerCase() === 'input') {
      return;
    }

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Detectar apenas se for um swipe horizontal significativo (> 60px de distância e mais horizontal que vertical)
    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY)) {
      // Descobrir qual é a seção atual ativa
      let currentSectionId = 'ficha';
      bnavBtns.forEach(btn => {
        if (btn.classList.contains('active')) {
          currentSectionId = btn.dataset.section;
        }
      });

      const currentIndex = sectionsOrder.indexOf(currentSectionId);

      if (diffX < 0) {
        // Swipe para a esquerda (próxima aba -> animação vindo da direita)
        if (currentIndex >= 0 && currentIndex < sectionsOrder.length - 1) {
          switchSection(sectionsOrder[currentIndex + 1], 'left');
        }
      } else {
        // Swipe para a direita (aba anterior -> animação vindo da esquerda)
        if (currentIndex > 0) {
          switchSection(sectionsOrder[currentIndex - 1], 'right');
        }
      }
    }
  }
}


// ---- ATUALIZAR BOTÕES DE TREINOS VAZIOS ----
function updateEmptyWorkoutButtons(db) {
  document.querySelectorAll('.ficha-header-bar .sel-btn').forEach(btn => {
    const treino = btn.dataset.treino;
    if (!treino) return;
    const fichaIds = db.fichas[treino] || [];
    const temExercicios = fichaIds.length > 0;
    const temCardio = db.aerobicos && db.aerobicos[treino] && db.aerobicos[treino].tipo;
    btn.style.display = (temExercicios || temCardio) ? 'flex' : 'none';
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
      currentViewMode = 'table';
      localStorage.setItem('academia_view_mode', 'table');
      renderFicha(db);
    };
    btnGrid.onclick = (e) => {
      e.preventDefault();
      currentViewMode = 'grid';
      localStorage.setItem('academia_view_mode', 'grid');
      renderFicha(db);
    };
    btnDeck.onclick = (e) => {
      e.preventDefault();
      currentViewMode = 'deck';
      localStorage.setItem('academia_view_mode', 'deck');
      renderFicha(db);
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

        return `
        <div class="deck-card ${checked ? 'row-done' : ''}" data-id="${ex.id}" draggable="false">
          <div class="deck-card-img">${imgHtml}</div>
          <div class="deck-card-info">
            <div class="deck-card-name">${ex.nome}</div>
            <div class="deck-card-meta">
              <span class="${badgeCls}">${ex.grupoMuscular}</span>
              <span class="deck-card-vol">${ex.series}×${ex.repeticoes}</span>
            </div>
          </div>
          <div class="deck-card-actions">
            <div class="series-wrap-deck">${seriesButtons.join('')}</div>
            <div class="deck-card-footer-actions">
              <button class="btn-note-toggle-deck ${ex.anotacoes ? 'has-note' : ''}" data-id="${ex.id}" title="${ex.anotacoes || 'Adicionar nota'}">
                <span>📝</span>
              </button>
              <div class="deck-check-wrap">
                <input type="checkbox" class="check-input" id="chk-deck-${ex.id}" data-id="${ex.id}" ${checked ? 'checked' : ''}>
                <label class="check-label" for="chk-deck-${ex.id}"><span class="check-mark">✓</span></label>
              </div>
            </div>
          </div>
        </div>`;
      }).join('');

      // Adicionar Cardio se existir
      if (hasAe) {
        const checked = checks.includes(aeId);
        deckContainer.innerHTML += `
        <div class="deck-card deck-card-aerobico ${checked ? 'row-done' : ''}" data-id="${aeId}" draggable="false">
          <div class="deck-card-img"><div class="ae-icon" draggable="false">🏃</div></div>
          <div class="deck-card-info">
            <div class="deck-card-name">${ae.tipo}</div>
            <div class="deck-card-meta">
              <span class="badge-core">CARDIO</span>
              <span class="deck-card-vol">${ae.tempo} MIN | ${ae.vel} KM/H</span>
            </div>
          </div>
          <div class="deck-card-actions">
            <div class="deck-card-footer-actions">
              <button class="btn-edit-ae-ficha" data-treino="${treino}" title="Editar Cardio">
                <span>⚙️</span>
              </button>
              <div class="deck-check-wrap">
                <input type="checkbox" class="check-input" id="chk-deck-${aeId}" data-id="${aeId}" ${checked ? 'checked' : ''}>
                <label class="check-label" for="chk-deck-${aeId}"><span class="check-mark">✓</span></label>
              </div>
            </div>
          </div>
        </div>`;
      }
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

        return `<div class="ex-card ${checked ? 'row-done' : ''}" data-id="${ex.id}">
          <div class="ex-card-num">${i + 1}</div>
          <div class="ex-card-img">${imgHtml}</div>
          <div class="ex-card-body">
            <div class="ex-card-name">${ex.nome}</div>
            <div class="ex-card-meta">
              <span class="${badgeCls}">${ex.grupoMuscular}</span>
              <span class="ex-card-vol">${ex.series}×${ex.repeticoes}${ex.carga || (ex.tags && ex.tags.includes('Peso do Corpo')) ? ' | Carga: ' + formatCarga(ex.carga, ex.porLado, ex.tags) : ''}</span>
            </div>
            
            <div class="series-wrap-grid">
              ${seriesButtons.join('')}
            </div>

            <div class="ex-card-footer">
              <button class="btn-note-toggle ${ex.anotacoes ? 'has-note' : ''}" data-id="${ex.id}">
                <span>📝</span> NOTAS
              </button>
              <div class="check-wrap">
                <input type="checkbox" class="check-input" id="chk-grid-${ex.id}" data-id="${ex.id}" ${checked ? 'checked' : ''}>
                <label class="check-label" for="chk-grid-${ex.id}"><span class="check-mark">✓</span></label>
              </div>
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
                <button class="btn-edit-ae-ficha" data-treino="${treino}" title="Editar Cardio" style="margin-left: auto; background: none; border: none; cursor: pointer; color: var(--text-secondary);">
                  <span>⚙️</span>
                </button>
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

        return `<tr class="${checked ? 'row-done' : ''}" data-id="${ex.id}">
          <td><div class="row-num">${i + 1}</div></td>
          <td><span class="ex-name">${ex.nome}</span></td>
          <td>${imgHtml}</td>
          <td><span class="${badgeCls}">${ex.grupoMuscular}</span></td>
          <td>
            <div class="vol-text">${ex.series}×${ex.repeticoes}<span>REPS</span>${ex.carga || (ex.tags && ex.tags.includes('Peso do Corpo')) ? ' · ' + formatCarga(ex.carga, ex.porLado, ex.tags) : ''}</div>
            <div class="series-wrap-table">
              ${seriesButtons.join('')}
            </div>
            <button class="btn-note-toggle-table ${ex.anotacoes ? 'has-note' : ''}" data-id="${ex.id}" title="${ex.anotacoes || 'Adicionar nota'}">
                <span>📝</span>
            </button>
          </td>
          <td>
            <div class="check-wrap">
              <input type="checkbox" class="check-input" id="chk-${ex.id}" data-id="${ex.id}" ${checked ? 'checked' : ''}>
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
  if (!db.currentCycleBreakdown) db.currentCycleBreakdown = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 };
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

function launchConfetti() {
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
  const btnGrid = document.getElementById('btnExViewGrid');
  const btnColecao = document.getElementById('btnExViewColecao');

  if (!grid) return;

  // Atualizar botões de vista (Grid / Coleção)
  if (btnGrid && btnColecao) {
    if (currentExView === 'grid') {
      btnGrid.classList.add('active');
      btnColecao.classList.remove('active');
    } else {
      btnColecao.classList.add('active');
      btnGrid.classList.remove('active');
    }

    btnGrid.onclick = (e) => {
      e.preventDefault();
      currentExView = 'grid';
      renderExercicios(db);
    };
    btnColecao.onclick = (e) => {
      e.preventDefault();
      currentExView = 'colecao';
      renderExercicios(db);
    };
  }

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

  if (currentExView === 'grid') {
    grid.classList.remove('collection-grid'); 
    grid.innerHTML = list.map(ex => {
      const badgeCls = grupoBadgeClass(ex.grupoMuscular);
      const imgHtml = ex.imagem
        ? `<img src="${ex.imagem}" alt="${ex.nome}" onerror="this.onerror=null; this.outerHTML='<div class=&quot;premium-placeholder&quot;><i class=&quot;fas fa-dumbbell&quot;></i><span>EXERCÍCIO</span></div>';">`
        : `<div class="premium-placeholder"><i class="fas fa-dumbbell"></i><span>EXERCÍCIO</span></div>`;
      return `<div class="ex-card" data-id="${ex.id}">
        <div class="ex-card-img">${imgHtml}</div>
        <div class="ex-card-body">
          <div class="ex-card-name">${ex.nome}</div>
          <div class="ex-card-meta">
            <span class="${badgeCls}">${ex.grupoMuscular}</span>
            <span class="ex-card-vol">${ex.series}×${ex.repeticoes}${ex.carga || (ex.tags && ex.tags.includes('Peso do Corpo')) ? ' | Carga: ' + formatCarga(ex.carga, ex.porLado, ex.tags) : ''}</span>
          </div>
          <div class="ex-card-actions">
            <button class="btn-ex-edit" data-id="${ex.id}">✏️ Editar</button>
            <button class="btn-ex-del" data-id="${ex.id}">🗑️ Excluir</button>
          </div>
        </div>
      </div>`;
    }).join('');
  } else {
    // MODO COLEÇÃO (Royale Style Fidelity)
    grid.classList.add('collection-grid');
    grid.innerHTML = list.map(ex => {
      return `
        <div class="deck-card collection-card card-${ex.grupoMuscular}" data-id="${ex.id}">
            <div class="deck-card-header">${ex.grupoMuscular}</div>
            <div class="deck-card-img">
                ${ex.imagem ? `<img src="${ex.imagem}" alt="${ex.nome}" onerror="this.onerror=null; this.outerHTML='<div class=&quot;premium-placeholder&quot;><i class=&quot;fas fa-dumbbell&quot;></i><span>EXERCÍCIO</span></div>';">` : `<div class="premium-placeholder"><i class="fas fa-dumbbell"></i><span>EXERCÍCIO</span></div>`}
            </div>
            <div class="deck-card-info">
                <div class="deck-card-name">${ex.nome}</div>
                <div class="deck-card-level">${ex.series} séries</div>
            </div>
            <div class="deck-card-menu">
                <div class="menu-actions-wrap">
                  <button class="btn-card-action btn-ex-edit" data-id="${ex.id}"><span>✏️</span> Editar</button>
                  <button class="btn-card-action btn-ex-del" data-id="${ex.id}"><span>🗑️</span> Excluir</button>
                </div>
            </div>
        </div>`;
    }).join('');

    // Toggle menu ao clicar no card
    grid.querySelectorAll('.deck-card').forEach(card => {
      card.onclick = (e) => {
        if (e.target.closest('.btn-card-action')) return;
        card.classList.toggle('menu-active');
        grid.querySelectorAll('.deck-card').forEach(c => { if (c !== card) c.classList.remove('menu-active'); });
      };
    });
  }

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
  
  // Limpa os chips (radios) e o input oculto
  document.querySelectorAll('input[name="grupoMuscularRadio"]').forEach(r => r.checked = false);
  document.getElementById('inputGrupo').value = '';

  document.getElementById('inputPorLado').checked = false;
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
  
  // Marca o chip (radio) correto
  const radio = document.querySelector(`input[name="grupoMuscularRadio"][value="${ex.grupoMuscular}"]`);
  if (radio) radio.checked = true;

  document.getElementById('inputSeries').value = ex.series;
  document.getElementById('inputReps').value = ex.repeticoes;
  document.getElementById('inputCarga').value = ex.carga || '';
  document.getElementById('inputDescanso').value = ex.descanso !== undefined ? ex.descanso : 30;
  document.getElementById('inputAnotacoes').value = ex.anotacoes || '';
  document.getElementById('inputPorLado').checked = !!ex.porLado;

  const tagsChecks = document.querySelectorAll('#inputTags input[type="checkbox"]');
  tagsChecks.forEach(cb => {
    cb.checked = (ex.tags || []).includes(cb.value);
  });

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

  const tagsChecks = document.querySelectorAll('#inputTags input[type="checkbox"]:checked');
  const tags = Array.from(tagsChecks).map(cb => cb.value);
  const porLado = document.getElementById('inputPorLado').checked;

  const preview = document.getElementById('uploadPreview');
  const imagem = (preview.style.display !== 'none' && preview.src && preview.src !== window.location.href) ? preview.src : null;

  if (!nome || !grupo) { showToast('Preencha nome e grupo muscular.', 'error'); return; }

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
      Object.assign(ex, { nome, grupoMuscular: grupo, series, repeticoes: reps, carga, imagem, descanso, anotacoes, tags, porLado });
    }
    showToast(toastMsg, 'success');
  } else {
    let hist = [];
    if (carga) {
      const numCarga = parseFloat(carga.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(numCarga)) hist.push({ data: today(), valor: numCarga, label: carga });
    }
    db.exercicios.push({ id: uid(), nome, grupoMuscular: grupo, series, repeticoes: reps, carga, imagem, descanso, historicoCargas: hist, anotacoes, tags, porLado });
    showToast('Exercício cadastrado!', 'success');
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
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(letra => {
      db.fichas[letra] = db.fichas[letra].filter(i => i !== id);
    });
    saveDB(db);
    closeModal('modalConfirm');
    renderExercicios(db);
    renderMontar(db);
    renderFicha(db);
    renderHeroStats(db);
    showToast('Exercício excluído.', 'info');
  };
  document.getElementById('btnConfirmNo').onclick = () => closeModal('modalConfirm');
}


// ---- MONTAR TREINO (REFINED STYLE) ----
function renderMontar(db) {
  const activeGrid = document.getElementById('deckActiveGrid');
  const letterTabs = document.querySelectorAll('#deckLetterTabs .sel-btn');
  const btnGridView = document.getElementById('btnDeckGridView');
  const btnListView = document.getElementById('btnDeckListView');

  if (!activeGrid) return;

  // 1. Atualizar Seletor de Letras (A-J) com Paginação
  const btnSwitch = document.getElementById('btnSwitchDeckPage');
  if (btnSwitch) {
    btnSwitch.onclick = () => {
      currentDeckPage = currentDeckPage === 1 ? 2 : 1;
      renderMontar(db);
    };
  }

  letterTabs.forEach(btn => {
    const letra = btn.dataset.letra;
    const isPage1 = ['A', 'B', 'C', 'D', 'E'].includes(letra);
    
    // Controle de Visibilidade por Página
    if (currentDeckPage === 1) {
      btn.style.display = isPage1 ? 'flex' : 'none';
    } else {
      btn.style.display = !isPage1 ? 'flex' : 'none';
    }

    btn.classList.toggle('active', letra === currentDeckLetter);
    btn.onclick = () => {
      currentDeckLetter = letra;
      renderMontar(db);
    };
  });

  // 2. Atualizar Botões de Vista (Grid/Lista)
  if (btnGridView && btnListView) {
    if (currentDeckView === 'grid') {
      btnGridView.classList.add('active');
      btnListView.classList.remove('active');
    } else {
      btnListView.classList.add('active');
      btnGridView.classList.remove('active');
    }

    btnGridView.onclick = (e) => {
      e.preventDefault();
      currentDeckView = 'grid';
      renderMontar(db);
    };
    btnListView.onclick = (e) => {
      e.preventDefault();
      currentDeckView = 'list';
      renderMontar(db);
    };
  }



  // 2. Atualizar Seletor de Vista (Grid vs List)
  if (btnGridView && btnListView) {
    btnGridView.classList.toggle('active', currentDeckView === 'grid');
    btnListView.classList.toggle('active', currentDeckView === 'list');

    btnGridView.onclick = () => { currentDeckView = 'grid'; renderDeckCollection(db); renderMontar(db); };
    btnListView.onclick = () => { currentDeckView = 'list'; renderDeckCollection(db); renderMontar(db); };
  }

  // 3. Renderizar Grid Ativo e Coleção
  renderDeckGrid(db);
  renderDeckCollection(db);

  // 4. Atualizar Volume Médio
  updateDeckStats(db);
}

function renderDeckGrid(db) {
  const grid = document.getElementById('deckActiveGrid');
  const ids = db.fichas[currentDeckLetter] || [];

  // Toggle List View Class on the Active Grid
  grid.classList.toggle('list-view', currentDeckView === 'list');

  let html = '';
  // 8 Slots fixos
  for (let i = 0; i < 8; i++) {
    const id = ids[i];
    if (id) {
      const ex = getExById(db, id);
      if (ex) {
        if (currentDeckView === 'list') {
          // LIST VIEW (Old Standard style)
          html += `
                    <div class="deck-slot list-slot" data-index="${i}">
                        <div class="deck-list-item card-${ex.grupoMuscular}" data-id="${ex.id}" draggable="true" ondragstart="event.dataTransfer.setData('sourceIndex', '${i}')">
                            <div class="dli-img">${ex.imagem ? `<img src="${ex.imagem}" onerror="this.onerror=null; this.outerHTML='<div class=&quot;premium-placeholder&quot;><i class=&quot;fas fa-dumbbell&quot;></i><span>EXERCÍCIO</span></div>';">` : `<div class="premium-placeholder"><i class="fas fa-dumbbell"></i><span>EXERCÍCIO</span></div>`}</div>
                            <div class="dli-info">
                                <div class="dli-name">${ex.nome}</div>
                                <div class="dli-meta">${ex.grupoMuscular} • ${ex.series}×${ex.repeticoes}</div>
                            </div>
                            <div class="dli-actions">
                                <button class="btn-card-action btn-card-details" data-id="${ex.id}">✏️</button>
                                <button class="btn-card-action btn-card-remove" data-id="${ex.id}">✕</button>
                            </div>
                        </div>
                    </div>`;
        } else {
          // GRID VIEW (Clash Style)
          html += `
                    <div class="deck-slot" data-index="${i}">
                        <div class="deck-card card-${ex.grupoMuscular}" data-id="${ex.id}" draggable="true" ondragstart="event.dataTransfer.setData('sourceIndex', '${i}')">
                            <div class="deck-card-header">${ex.grupoMuscular}</div>
                            <div class="deck-card-img">
                                ${ex.imagem ? `<img src="${ex.imagem}" alt="${ex.nome}" onerror="this.onerror=null; this.outerHTML='<div class=&quot;premium-placeholder&quot;><i class=&quot;fas fa-dumbbell&quot;></i><span>EXERCÍCIO</span></div>';">` : `<div class="premium-placeholder"><i class="fas fa-dumbbell"></i><span>EXERCÍCIO</span></div>`}
                            </div>
                            <div class="deck-card-info">
                                <div class="deck-card-name">${ex.nome}</div>
                                <div class="deck-card-level">Séries: ${ex.series} × ${ex.repeticoes}</div>
                            </div>
                            <div class="deck-card-menu">
                                <button class="btn-card-action btn-card-details-cr" data-id="${ex.id}"><span>🔍</span> Detalhes</button>
                                <button class="btn-card-action btn-card-details" data-id="${ex.id}"><span>✏️</span> Edição</button>
                                <button class="btn-card-action btn-card-maestria-mini" data-id="${ex.id}"><span>🏆</span> Maestria</button>
                                <button class="btn-card-action btn-card-remove" data-id="${ex.id}"><span>✕</span> Remover</button>
                            </div>
                        </div>
                    </div>`;
        }
      } else {
        const roman0 = ['I','II','III','IV','V','VI','VII','VIII','IX','X'][i] || (i+1);
        html += `<div class="deck-slot" data-index="${i}"><div class="deck-slot-empty-ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11"/><circle cx="4" cy="12" r="1.5"/><circle cx="20" cy="12" r="1.5"/></svg><span class="deck-slot-roman">${roman0}</span></div></div>`;
      }
    } else {
      const roman1 = ['I','II','III','IV','V','VI','VII','VIII','IX','X'][i] || (i+1);
      html += `
            <div class="deck-slot ${currentDeckView === 'list' ? 'list-slot' : ''}" data-index="${i}">
                <div class="deck-slot-empty-ph">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="28" height="28">
                        <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11"/>
                        <circle cx="4" cy="12" r="1.5"/>
                        <circle cx="20" cy="12" r="1.5"/>
                    </svg>
                    <span class="deck-slot-roman">${roman1}</span>
                </div>
            </div>`;
    }
  }
  grid.innerHTML = html;

  // Eventos de Drag & Drop (Desktop)
  grid.querySelectorAll('.deck-slot').forEach(slot => {
    const targetIndex = parseInt(slot.dataset.index);

    slot.ondragover = (e) => {
      e.preventDefault();
      slot.classList.add('drag-over');
    };
    slot.ondragleave = () => slot.classList.remove('drag-over');
    slot.ondrop = (e) => {
      e.preventDefault();
      slot.classList.remove('drag-over');

      const sourceIndex = e.dataTransfer.getData('sourceIndex');
      const exerciseId = e.dataTransfer.getData('text/plain');

      let ficha = db.fichas[currentDeckLetter] || [];
      // Garantir que a ficha tenha 8 espaços
      while (ficha.length < 8) ficha.push(null);

      if (sourceIndex !== "") {
        // REORDENAR (Grid para Grid)
        const sIdx = parseInt(sourceIndex);
        const temp = ficha[targetIndex];
        ficha[targetIndex] = ficha[sIdx];
        ficha[sIdx] = temp;
      } else if (exerciseId) {
        // ADICIONAR/SUBSTITUIR (Coleção para Grid)
        // Se já estiver na ficha em outra posição, removemos de lá para não duplicar
        const existingIdx = ficha.indexOf(exerciseId);
        if (existingIdx !== -1) {
          ficha[existingIdx] = null;
        }
        ficha[targetIndex] = exerciseId;
      }

      // Limpar nulos do final para manter compatibilidade, mas manter nulos entre exercícios se necessário?
      // O usuário quer "posições", então vamos manter os nulls para preservar a ordem visual se houver buracos.
      db.fichas[currentDeckLetter] = ficha;
      saveDB(db);
      renderMontar(db);
      renderFicha(db);
      showToast('Treino atualizado!', 'success');
    };
  });

  // Eventos (apenas para o grid view card toggle)
  if (currentDeckView === 'grid') {
    grid.querySelectorAll('.deck-card').forEach(card => {
      card.onclick = (e) => {
        if (e.target.closest('.btn-card-action')) return;
        card.classList.toggle('menu-active');
        grid.querySelectorAll('.deck-card').forEach(c => { if (c !== card) c.classList.remove('menu-active'); });
      };
    });
  }

  grid.querySelectorAll('.btn-card-details-cr').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); openCRDetails(db, btn.dataset.id); };
  });

  grid.querySelectorAll('.btn-card-details').forEach(btn => {
    btn.onclick = () => openEditExercicio(db, btn.dataset.id);
  });

  grid.querySelectorAll('.btn-card-maestria-mini').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openMaestriaExercicio(db, btn.dataset.id);
    };
  });

  grid.querySelectorAll('.btn-card-remove').forEach(btn => {
    btn.onclick = () => {
      let ficha = db.fichas[currentDeckLetter] || [];
      const idToRemove = btn.dataset.id;

      // Substituir o ID específico por null para manter a posição dos outros
      const idx = ficha.indexOf(idToRemove);
      if (idx !== -1) {
        ficha[idx] = null;
      }

      db.fichas[currentDeckLetter] = ficha;
      saveDB(db);
      renderMontar(db);
      renderFicha(db);
      showToast('Removido do treino!', 'info');
    };
  });
}

function renderDeckCollection(db) {
  const grid = document.getElementById('deckCollectionGrid');
  const searchInp = document.getElementById('deckCollectionSearch');
  const countEl = document.getElementById('deckCollectionCount');
  if (!grid) return;

  const query = (searchInp.value || '').toLowerCase();
  const inDeck = db.fichas[currentDeckLetter] || [];

  let list = db.exercicios;
  if (query) {
    list = list.filter(e => e.nome.toLowerCase().includes(query) || e.grupoMuscular.toLowerCase().includes(query));
  }

  countEl.textContent = `${list.length}/${db.exercicios.length}`;

  // Collection ALWAYS remains as a Grid
  grid.classList.remove('list-view');

  grid.innerHTML = list.map(ex => {
    const already = inDeck.includes(ex.id);
    return `
        <div class="deck-card collection-card card-${ex.grupoMuscular} ${already ? 'in-deck' : ''}" 
             data-id="${ex.id}" 
             draggable="${!already}"
             ondragstart="event.dataTransfer.setData('text/plain', '${ex.id}')">
            <div class="deck-card-header">${ex.grupoMuscular}</div>
            <div class="deck-card-img">
                ${ex.imagem ? `<img src="${ex.imagem}" alt="${ex.nome}" onerror="this.onerror=null; this.outerHTML='<div class=&quot;premium-placeholder&quot;><i class=&quot;fas fa-dumbbell&quot;></i><span>EXERCÍCIO</span></div>';">` : `<div class="premium-placeholder"><i class="fas fa-dumbbell"></i><span>EXERCÍCIO</span></div>`}
            </div>
            <div class="deck-card-info">
                <div class="deck-card-name">${ex.nome}</div>
                <div class="deck-card-level">${ex.series} séries</div>
            </div>
        </div>`;
  }).join('');

  // Eventos de Clique e Drag (Mobile)
  grid.querySelectorAll('.collection-card:not(.in-deck)').forEach(card => {
    // Clique tradicional
    card.onclick = () => {
      let ficha = db.fichas[currentDeckLetter] || [];
      if (ficha.filter(Boolean).length >= 8) {
        showToast('Máximo de 8 exercícios atingido!', 'error');
        return;
      }

      // Tentar preencher o primeiro slot vazio (null)
      let added = false;
      for (let i = 0; i < 8; i++) {
        if (!ficha[i]) {
          ficha[i] = card.dataset.id;
          added = true;
          break;
        }
      }
      if (!added && ficha.length < 8) {
        ficha.push(card.dataset.id);
      }

      db.fichas[currentDeckLetter] = ficha;
      saveDB(db);
      renderMontar(db);
      renderFicha(db);
      showToast('Adicionado ao treino!', 'success');
    };

    // Suporte para Touch (Arrastar no Mobile) - Delay para diferenciar de Clique
    let ghost = null;
    let pressTimer = null;
    let isDragging = false;

    card.ontouchstart = (e) => {
      if (inDeck.length >= 8) return;
      const touch = e.touches[0];
      
      pressTimer = setTimeout(() => {
        isDragging = true;
        ghost = card.cloneNode(true);
        ghost.style.position = 'fixed';
        ghost.style.width = card.offsetWidth + 'px';
        ghost.style.height = card.offsetHeight + 'px';
        ghost.style.opacity = '0.8';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '9999';
        ghost.style.left = (touch.clientX - card.offsetWidth / 2) + 'px';
        ghost.style.top = (touch.clientY - card.offsetHeight / 2) + 'px';
        document.body.appendChild(ghost);
        card.classList.add('dragging');
        if (navigator.vibrate) navigator.vibrate(50);
      }, 250);
    };

    card.ontouchmove = (e) => {
      if (!isDragging) {
        clearTimeout(pressTimer);
        return;
      }
      e.preventDefault();
      const touch = e.touches[0];
      ghost.style.left = (touch.clientX - ghost.offsetWidth / 2) + 'px';
      ghost.style.top = (touch.clientY - ghost.offsetHeight / 2) + 'px';

      // Highlight potential drop targets
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const slot = target ? target.closest('.deck-slot:empty, .deck-slot:not(:has(.deck-card))') : null;
      document.querySelectorAll('.deck-slot').forEach(s => s.classList.remove('drag-over'));
      if (slot) slot.classList.add('drag-over');
    };

    card.ontouchend = (e) => {
      clearTimeout(pressTimer);
      if (!isDragging) return;
      isDragging = false;
      
      card.classList.remove('dragging');
      const touch = e.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const slot = target ? target.closest('.deck-slot') : null;

      if (slot) {
        const targetIndex = parseInt(slot.dataset.index);
        let ficha = db.fichas[currentDeckLetter] || [];
        while (ficha.length < 8) ficha.push(null);

        const exerciseId = card.dataset.id;
        const existingIdx = ficha.indexOf(exerciseId);
        if (existingIdx !== -1) {
          ficha[existingIdx] = null;
        }
        ficha[targetIndex] = exerciseId;

        db.fichas[currentDeckLetter] = ficha;
        saveDB(db);
        renderMontar(db);
        renderFicha(db);
        showToast('Adicionado ao treino!', 'success');
      }

      ghost.remove();
      ghost = null;
      document.querySelectorAll('.deck-slot').forEach(s => s.classList.remove('drag-over'));
    };
  });

  // REORDERING TOUCH EVENTS (Active Grid - Deck Builder Only)
  document.querySelectorAll('#deckActiveGrid .deck-card, #deckActiveGrid .deck-list-item').forEach((card, sIdx) => {
    let ghost = null;
    let pressTimer = null;
    let isDragging = false;

    card.ontouchstart = (e) => {
      const touch = e.touches[0];
      
      pressTimer = setTimeout(() => {
        isDragging = true;
        ghost = card.cloneNode(true);
        ghost.style.position = 'fixed';
        ghost.style.width = card.offsetWidth + 'px';
        ghost.style.height = card.offsetHeight + 'px';
        ghost.style.opacity = '0.8';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '9999';
        ghost.style.left = (touch.clientX - card.offsetWidth / 2) + 'px';
        ghost.style.top = (touch.clientY - card.offsetHeight / 2) + 'px';
        document.body.appendChild(ghost);
        card.classList.add('dragging');
        if (navigator.vibrate) navigator.vibrate(50);
      }, 250);
    };

    card.ontouchmove = (e) => {
      if (!isDragging) {
        clearTimeout(pressTimer);
        return;
      }
      e.preventDefault();
      const touch = e.touches[0];
      ghost.style.left = (touch.clientX - ghost.offsetWidth / 2) + 'px';
      ghost.style.top = (touch.clientY - ghost.offsetHeight / 2) + 'px';

      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const slot = target ? target.closest('.deck-slot') : null;
      document.querySelectorAll('.deck-slot').forEach(s => s.classList.remove('drag-over'));
      if (slot) slot.classList.add('drag-over');
    };

    card.ontouchend = (e) => {
      clearTimeout(pressTimer);
      if (!isDragging) return;
      isDragging = false;
      
      card.classList.remove('dragging');
      const touch = e.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const slot = target ? target.closest('.deck-slot') : null;

      if (slot) {
        const targetIndex = parseInt(slot.dataset.index);
        const sourceIndex = parseInt(card.closest('.deck-slot').dataset.index);

        let ficha = db.fichas[currentDeckLetter] || [];
        while (ficha.length < 8) ficha.push(null);

        const temp = ficha[targetIndex];
        ficha[targetIndex] = ficha[sourceIndex];
        ficha[sourceIndex] = temp;

        db.fichas[currentDeckLetter] = ficha;
        saveDB(db);
        renderMontar(db);
        renderFicha(db);
        showToast('Ordem alterada!', 'success');
      }

      ghost.remove();
      ghost = null;
      document.querySelectorAll('.deck-slot').forEach(s => s.classList.remove('drag-over'));
    };
  });

  searchInp.oninput = () => renderDeckCollection(db);
}


function updateDeckStats(db) {
  const ids = db.fichas[currentDeckLetter] || [];
  const exercicios = ids.map(id => getExById(db, id)).filter(Boolean);

  // 1. Volume Stats
  let totalCarga = 0;
  exercicios.forEach(ex => {
    const val = parseFloat(ex.carga) || 0;
    totalCarga += val;
  });
  const avg = exercicios.length ? (totalCarga / exercicios.length).toFixed(1) : '0.0';
  const avgEl = document.getElementById('deckAvgVolume');
  if (avgEl) avgEl.textContent = avg;

  // 2. Cardio Stats
  const ae = db.aerobicos[currentDeckLetter];
  const cardioMain = document.getElementById('deckCardioMain');
  const cardioSub = document.getElementById('deckCardioSub');

  if (ae && ae.tipo) {
    if (cardioMain) cardioMain.textContent = ae.tempo ? `${ae.tempo}min` : '--';
    if (cardioSub) cardioSub.textContent = `${ae.tipo}${ae.vel ? ' • ' + ae.vel + 'km/h' : ''}`;
  } else {
    if (cardioMain) cardioMain.textContent = '--';
    if (cardioSub) cardioSub.textContent = 'Configurar Cardio';
  }
}
// ======================================================
// ---- MAESTRIA ----
// ======================================================

function getMaestriaState(db, exId) {
  if (!db.maestrias) db.maestrias = {};
  const m = db.maestrias[exId];
  const sessoes = (m && m.totalSessoes) ? m.totalSessoes : 0;

  const challenges = MAESTRIA_CHALLENGES.map((ch, i) => {
    const prevTarget = i === 0 ? 0 : MAESTRIA_CHALLENGES[i - 1].subDesafios[2].target;
    const locked = sessoes < prevTarget;
    const subDesafios = ch.subDesafios.map(sub => ({
      ...sub,
      current: Math.min(sessoes, sub.target),
      completed: sessoes >= sub.target
    }));
    const completed = subDesafios.every(s => s.completed);
    return { ...ch, locked, completed, subDesafios };
  });

  let badgeLevel = 0;
  if (sessoes >= MAESTRIA_CHALLENGES[0].subDesafios[2].target) badgeLevel = 1; // bronze
  if (sessoes >= MAESTRIA_CHALLENGES[1].subDesafios[2].target) badgeLevel = 2; // prata
  if (sessoes >= MAESTRIA_CHALLENGES[2].subDesafios[2].target) badgeLevel = 3; // ouro

  return { totalSessoes: sessoes, badgeLevel, challenges };
}

function trackMaestriaSessoes(db, exIds) {
  if (!db.maestrias) db.maestrias = {};
  exIds.forEach(exId => {
    if (exId.startsWith('ae-')) return;
    if (!db.maestrias[exId]) db.maestrias[exId] = { totalSessoes: 0 };
    
    // Nível antes
    const stateBefore = getMaestriaState(db, exId);
    const levelBefore = stateBefore.badgeLevel;

    db.maestrias[exId].totalSessoes = (db.maestrias[exId].totalSessoes || 0) + 1;

    // Nível depois
    const stateAfter = getMaestriaState(db, exId);
    const levelAfter = stateAfter.badgeLevel;

    if (levelAfter > levelBefore && levelAfter > 0) {
      setTimeout(() => {
        showLevelUpModal(db, exId, levelAfter);
      }, 1500); // Pequeno delay após o confete da conclusão
    }
  });
  saveDB(db);
}

function showLevelUpModal(db, exId, level) {
  const ex = getExById(db, exId);
  if (!ex) return;

  const tierNames = ['', 'BRONZE', 'PRATA', 'OURO'];
  const tierName = tierNames[level];

  document.getElementById('levelUpExName').textContent = ex.nome.toUpperCase();
  document.getElementById('levelUpTierName').textContent = tierName;

  const slot = document.getElementById('levelUpBadgeSlot');
  if (slot) {
    const bc = ['none', 'bronze', 'prata', 'ouro'][level];
    slot.innerHTML = `
      <div class="cr-mastery-mini-shield cr-mini-tier-${bc}">
        ${ex.imagem ? `<img src="${ex.imagem}" alt="${ex.nome}">` : '🏋️'}
      </div>
    `;
  }

  openModal('modalLevelUp');
}

// Inicializar listener do botão fechar
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnFecharLevelUp')?.addEventListener('click', () => {
        closeModal('modalLevelUp');
    });
});

function getMaestriaIconHtml(state, small = false) {
  const sz = small ? 'small' : '';
  if (state.badgeLevel === 3) return `<span class="m-badge-pip ouro ${sz}">★★★</span>`;
  if (state.badgeLevel === 2) return `<span class="m-badge-pip prata ${sz}">★★</span>`;
  if (state.badgeLevel === 1) return `<span class="m-badge-pip bronze ${sz}">★</span>`;
  return `<span class="m-badge-pip none ${sz}">🏆</span>`;
}

function updateGlobalMasteryUI(db, suffix = '') {
  let totalXP = 0;
  db.exercicios.forEach(ex => {
    const state = getMaestriaState(db, ex.id);
    totalXP += state.badgeLevel;
  });

  const getRank = (xp) => {
    if (xp < 10) return { level: 1, title: 'PRATICANTE', next: 10 };
    if (xp < 30) return { level: 2, title: 'ESPECIALISTA EM TREINO', next: 30 };
    if (xp < 60) return { level: 3, title: 'MESTRE DE EXECUÇÃO', next: 60 };
    if (xp < 100) return { level: 4, title: 'GRÃO-MESTRE DE FORÇA', next: 100 };
    const lvl = Math.floor(xp / 25) + 1;
    return { level: lvl, title: 'LENDA DA MAESTRIA', next: (lvl) * 25 };
  };

  const rank = getRank(totalXP);
  const pct = Math.min(100, (totalXP / rank.next) * 100);

  const elRank = document.getElementById('athleticRank' + suffix);
  const elLevel = document.getElementById('athleticLevel' + suffix);
  const elXP = document.getElementById('athleticXP' + suffix);
  const elProgress = document.getElementById('athleticProgress' + suffix);

  if (elRank) elRank.textContent = rank.title;
  if (elLevel) elLevel.textContent = `Maestria Nível ${rank.level}`;
  if (elXP) elXP.textContent = `${totalXP} / ${rank.next} PTS`;
  if (elProgress) elProgress.style.width = pct + '%';
}

function updateDeckMaestriaWidget(db) {
  const el = document.getElementById('deckMaestriaCount');
  if (!el) return;
  let full = 0;
  db.exercicios.forEach(ex => {
    if (getMaestriaState(db, ex.id).badgeLevel > 0) full++;
  });
  el.textContent = full + '/' + db.exercicios.length;
}

function openMaestriaGeral(db) {
  const grid = document.getElementById('maestriaGeralGrid');
  if (!grid) return;

  updateGlobalMasteryUI(db, 'MG');

  grid.innerHTML = db.exercicios.map(ex => {
    const state = getMaestriaState(db, ex.id);
    const bc = ['none','bronze','prata','ouro'][state.badgeLevel];
    const imgHtml = ex.imagem
      ? `<img src="${ex.imagem}" alt="${ex.nome}">`
      : `<div class="m-card-img-ph">🏋️</div>`;
    
    return `
    <div class="royale-card frame-${bc}" data-id="${ex.id}">
      <div class="royale-card-inner">
        ${state.badgeLevel > 0 ? `<div class="royale-diamond"></div>` : ''}
        <div class="royale-img-container">
          ${imgHtml}
          <div class="royale-level-pill pill-${bc}">
            <span class="pill-text">${ex.nome}</span>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.royale-card').forEach(card => {
    card.onclick = () => {
      closeModal('modalMaestriaGeral');
      openMaestriaExercicio(db, card.dataset.id);
    };
  });

  openModal('modalMaestriaGeral');
}

function openColecaoExercicios(db) {
  const grid = document.getElementById('colecaoGrid');
  const countEl = document.getElementById('colecaoCount');
  if (!grid) return;

  updateGlobalMasteryUI(db);

  if (countEl) countEl.textContent = `${db.exercicios.length}/${db.exercicios.length}`;

  const groupColors = {
    'Peito': 'peito',
    'Costas': 'costas',
    'Ombros': 'ombros',
    'Pernas': 'pernas',
    'Bíceps': 'biceps',
    'Tríceps': 'triceps',
    'Core': 'core'
  };

  grid.innerHTML = db.exercicios.map(ex => {
    const imgHtml = ex.imagem 
      ? `<img src="${ex.imagem}" alt="${ex.nome}">` 
      : `<div class="colecao-item-ph">🏋️</div>`;
    
    const groupClass = groupColors[ex.grupoMuscular] || 'default';
      
    return `
      <div class="colecao-card group-${groupClass}" data-id="${ex.id}" data-name="${ex.nome}">
        <div class="card-group-header"><span>${ex.grupoMuscular}</span></div>
        <div class="card-media-box">
          ${imgHtml}
        </div>
        <div class="card-footer-box">
          <h4 class="card-name">${ex.nome}</h4>
          <span class="card-series">${ex.series || 3} séries</span>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.colecao-card').forEach(item => {
    item.onclick = () => {
      closeModal('modalColecaoExercicios');
      openMaestriaExercicio(db, item.dataset.id);
    };
  });

  openModal('modalColecaoExercicios');
}

function openMaestriaExercicio(db, exId) {
  const ex = getExById(db, exId);
  if (!ex) return;
  const state = getMaestriaState(db, exId);

  const badgeArea = document.getElementById('maestriaExBadgeArea');
  if (badgeArea) {
    const imgHtml = ex.imagem ? `<img src="${ex.imagem}" alt="${ex.nome}">` : '🏋️';
    const stars = state.badgeLevel;
    const starsHtml = Array(3).fill(0).map((_,i)=>`<span class="mx-star ${i<stars?'lit':''}">★</span>`).join('');
    badgeArea.innerHTML = `
      <div class="royale-badge-shield badge-tier-${['none','bronze','prata','ouro'][state.badgeLevel]}">
        <div class="shield-inner">${imgHtml}</div>
      </div>
      <div class="mx-badge-stars">${starsHtml}</div>`;
  }

  const challengesEl = document.getElementById('maestriaExChallenges');
  if (challengesEl) {
    challengesEl.innerHTML = MAESTRIA_CHALLENGES.map((ch, tierIdx) => {
      const prevTierDone = tierIdx === 0 || state.challenges[tierIdx-1].completed;
      const isLocked = !prevTierDone;
      const isCompleted = state.challenges[tierIdx].completed;
      const tierClass = `tier-${ch.badge}`;

      if (isCompleted) {
        return `<div class="royale-task-row ${tierClass} completed">
          <div class="task-icon">${ch.icon}</div>
          <div class="task-info"><div class="task-status-text">Concluído</div></div>
          <div class="task-check">✓</div>
        </div>`;
      } else if (isLocked) {
        return `<div class="royale-task-row locked">
          <div class="task-lock-icon">🔒</div>
        </div>`;
      } else {
        const currentSub = ch.subDesafios.find(s => state.totalSessoes < s.target) || ch.subDesafios[2];
        const pct = Math.min(100, (state.totalSessoes / currentSub.target) * 100);
        const subIndex = ch.subDesafios.indexOf(currentSub);
        const nextLevel = subIndex + 1;
        
        return `<div class="royale-task-row ${tierClass} active" 
                     onclick="showRoyaleTooltip(event, '${currentSub.label}', '${currentSub.desc}', '${nextLevel}/3')">
          <div class="task-icon">${ch.icon}</div>
          <div class="task-info">
            <div class="task-title">${currentSub.label}</div>
            <div class="task-progress-wrap">
              <div class="task-progress-bar">
                <div class="task-progress-fill" style="width: ${pct}%"></div>
                <div class="task-progress-text">${state.totalSessoes}/${currentSub.target}</div>
              </div>
            </div>
          </div>
          <div class="task-reward">
            <div class="reward-icon">🏆</div>
            <div class="reward-val">${nextLevel}</div>
          </div>
          <div class="task-level-tabs">
            <div class="level-tab ${nextLevel>=3?'active':''}">3</div>
            <div class="level-tab ${nextLevel>=2?'active':''}">2</div>
            <div class="level-tab ${nextLevel>=1?'active':''}">1</div>
          </div>
        </div>`;
      }
    }).join('');
  }
  openModal('modalMaestriaEx');
}

function showRoyaleTooltip(event, title, desc, progress) {
  event.stopPropagation();
  
  // Remover tooltip existente se houver
  const old = document.querySelector('.royale-tooltip');
  if (old) old.remove();

  const row = event.currentTarget;
  const tooltip = document.createElement('div');
  tooltip.className = 'royale-tooltip';
  
  // Extrair o nível atual do progresso (ex: "2/3")
  const currentStep = progress.split('/')[0];

  tooltip.innerHTML = `
    <div class="rt-progress">Progresso da tarefa: ${progress}</div>
    <div class="rt-desc">${desc}</div>
    <div class="rt-reward-box">
      <span class="rt-gem">💎</span> 
      <span class="rt-val">+${currentStep * 5} PTS</span>
    </div>
    <div class="rt-arrow"></div>
  `;

  document.body.appendChild(tooltip);

  // Posicionamento Tático (Baseado no row clicado)
  const rect = row.getBoundingClientRect();
  tooltip.style.left = (rect.left + rect.width / 2) + 'px';
  tooltip.style.top = (rect.top - 5) + 'px';

  // Fechar ao clicar fora
  const closeTip = (e) => {
    if (!tooltip.contains(e.target)) {
      tooltip.remove();
      document.removeEventListener('mousedown', closeTip);
    }
  };
  setTimeout(() => document.addEventListener('mousedown', closeTip), 10);
}

function openAerobicoModal(db, letra) {
  const targetLetra = letra || currentDeckLetter;
  const ae = db.aerobicos[targetLetra] || { tipo: '', vel: '', tempo: '' };
  const modalTitle = document.getElementById('modalAeTitulo');
  if (modalTitle) modalTitle.textContent = `Configurar Cardio - Treino ${targetLetra}`;

  document.getElementById('inputAeTipo').value = ae.tipo || '';
  document.getElementById('inputAeVel').value = ae.vel || '';
  document.getElementById('inputAeTempo').value = ae.tempo || '';

  openModal('modalAerobico');

  document.getElementById('btnSalvarAerobico').onclick = () => {
    db.aerobicos[targetLetra] = {
      tipo: document.getElementById('inputAeTipo').value,
      vel: document.getElementById('inputAeVel').value,
      tempo: document.getElementById('inputAeTempo').value
    };
    saveDB(db);
    closeModal('modalAerobico');
    showToast('Cardio salvo!', 'success');
    
    // Atualizar as duas possíveis visualizações
    renderMontar(db);
    renderFicha(db);
  };
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
    return `<div class="picker-item ${isAlready ? 'picker-already' : ''}" data-id="${ex.id}">
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
        showToast('Adicionado ao Treino ' + pickerTreinoAtivo + '!', 'success');
      }
      renderPickerList(db);
    });
  });
}

// ---- PROGRESSO / GAMIFICATION ----
function renderProgresso(db) {
  const el = id => document.getElementById(id);
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

  if (el('progStreakVal')) el('progStreakVal').textContent = streak;
  if (el('profStreak')) el('profStreak').textContent = streak + (streak === 1 ? ' dia' : ' dias');

  if (el('progNivelName')) el('progNivelName').textContent = nivelName;
  if (el('progNivelVal')) el('progNivelVal').textContent = currentLevel;
  el('progXpFill').style.width = xpPct + '%';
  if (el('progXpAtual')) el('progXpAtual').textContent = xp;
  if (el('progXpNext')) el('progXpNext').textContent = (currentLevel * xpPerLevel);
  if (el('profXp')) el('profXp').textContent = xp + ' XP';
  el('progTotalTreinos').textContent = totalWorkouts;

  const currMonth = new Date().toISOString().slice(0, 7);
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
    db.currentCycleBreakdown = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 };
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
  } catch (e) { console.warn('Bip de áudio bloqueado ou não suportado.'); }
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

// ---- VOLUME DE CARGA ----
let currentVolumeData = {};

function renderVolumeSemanal(db) {
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
}

function openVolumeDetails(group) {
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

function renderVolumeLineChart(containerId, history) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = container.clientWidth || 400;
  const height = container.clientHeight || 160;
  const padding = 20;

  if (!history || history.length < 2) {
    container.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-tertiary); font-size: 0.8rem; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;">
      <span>📉</span>
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

let currentRadarMode = 'mensal';

// ---- RADAR CHART ATRIBUTOS ----
function renderRadarChart(db) {
  const container = document.getElementById('radarChartContainer');
  if (!container) return;

  // Set up events once
  if (!container.dataset.eventsSet) {
    document.getElementById('btnRadarMensal')?.addEventListener('click', () => {
      currentRadarMode = 'mensal';
      document.getElementById('btnRadarMensal').style.background = 'var(--primary)';
      document.getElementById('btnRadarMensal').style.color = '#000';
      document.getElementById('btnRadarTotal').style.background = 'transparent';
      document.getElementById('btnRadarTotal').style.color = 'var(--text-secondary)';
      renderRadarChart(db);
    });
    document.getElementById('btnRadarTotal')?.addEventListener('click', () => {
      currentRadarMode = 'total';
      document.getElementById('btnRadarTotal').style.background = 'var(--primary)';
      document.getElementById('btnRadarTotal').style.color = '#000';
      document.getElementById('btnRadarMensal').style.background = 'transparent';
      document.getElementById('btnRadarMensal').style.color = 'var(--text-secondary)';
      renderRadarChart(db);
    });
    container.dataset.eventsSet = "true";
  }

  const stats = {
    forca: 0,
    resistencia: 0,
    velocidade: 0, // Agora Constância
    flexibilidade: 0, // Agora Simetria
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

  // Analisar os treinos recentes
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

  // Novos Cálculos (Média do Ciclo Atual)
  // Força: Carga média por repetição (ex: média de 25kg/rep já é alta considerando o corpo todo)
  const cargaMediaPerRep = totalReps > 0 ? (totalVol / totalReps) : 0;
  stats.forca = Math.min(100, (cargaMediaPerRep / 25) * 100);

  // Resistência: Repetições médias + bônus de cardio
  const repsMedia = totalExCount > 0 ? (totalReps / totalExCount) : 0;
  const cardioBonus = (cardioMins / (completedDates.length || 1)) * 2; // 2 pts por min médio
  stats.resistencia = Math.min(100, ((repsMedia / 35) * 100) + cardioBonus);

  // Simetria (Antiga Flexibilidade): Cobertura de grupos musculares
  stats.flexibilidade = Math.min(100, (gruposVistos.size / 7) * 100);

  // Equilíbrio: % de exercícios que exigem estabilização
  stats.equilibrio = Math.min(100, ((equilibrioCount / (totalExCount || 1)) * 2) * 100);

  // Potência: % de exercícios explosivos ou pernas pesadas
  stats.potencia = Math.min(100, ((potenciaCount / (totalExCount || 1)) * 2.5) * 100);

  // Intensidade (Antiga Velocidade): Frequência nos últimos 30 dias + Tempo do Modo Foco
  let constanciaScore = 0;
  if (currentRadarMode === 'mensal') {
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    const treinosUltimos30Dias = allCompleted.filter(d => new Date(d + 'T12:00:00') >= trintaDiasAtras).length;
    constanciaScore = Math.min(50, (treinosUltimos30Dias / 20) * 50); // Metade da nota vem da consistência
  } else {
    if (allCompleted.length > 0) {
      const start = new Date(allCompleted[allCompleted.length - 1] + 'T12:00:00');
      const end = new Date(allCompleted[0] + 'T12:00:00');
      const monthsActive = Math.max(1, (end - start) / (1000 * 60 * 60 * 24 * 30));
      const avgWorkoutsPerMonth = allCompleted.length / monthsActive;
      constanciaScore = Math.min(50, (avgWorkoutsPerMonth / 20) * 50);
    }
  }

  // Calcular média de tempo do Modo Foco vs Séries
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
    // Ex: 25 séries em 45 min = 1.8 min por série. 
    // Intenso = <= 1.5 min por série. Lento = >= 3.0 min.
    const minPorSerie = totalTempoFoco / totalSeriesFoco;
    intensidadeFoco = Math.max(0, Math.min(50, ((3.0 - minPorSerie) / 1.5) * 50));
  } else {
    intensidadeFoco = 25; // Nota média (25/50) se não usar o Modo Foco
  }

  stats.velocidade = constanciaScore + intensidadeFoco;

  // --- CONQUISTAS (BADGES) BASEADAS NO RADAR ---
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

  // --- SISTEMA DE TIERS (PRESTÍGIO) ---
  const allStats = [stats.forca, stats.resistencia, stats.velocidade, stats.flexibilidade, stats.equilibrio, stats.potencia];
  if (!db.radarTier) db.radarTier = 1;

  // Se todos passarem de 95 (margem de prestígio), avança de tier
  if (allStats.every(s => s >= 95) && db.radarTier < 5) {
    db.radarTier++;
    const tierNames = ['', '', 'Prata', 'Ouro', 'Diamante', 'Ametista'];
    checkAchievement('r_tier' + db.radarTier, '🌟', `Radar ${tierNames[db.radarTier]}`, `Alcançou o Tier ${db.radarTier} do Radar Fit.`);
    saveNeeded = true;
  }

  if (saveNeeded) saveDB(db);

  const keys = ['forca', 'resistencia', 'velocidade', 'flexibilidade', 'equilibrio', 'potencia'];
  // Aplica o divisor de Tier (aumenta a dificuldade)
  keys.forEach(k => {
    stats[k] = Math.min(100, stats[k] / db.radarTier);
  });

  // Desenhar SVG
  const size = 300;
  const center = size / 2;
  const radius = size * 0.35;
  const labels = ['FORÇA', 'RESISTÊNCIA', 'INTENSIDADE', 'SIMETRIA', 'EQUILÍBRIO', 'POTÊNCIA'];
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

  const tierColors = {
    1: { stroke: 'var(--primary-light)', fill: 'var(--primary)', name: 'BRONZE' },
    2: { stroke: '#cbd5e1', fill: '#94a3b8', name: 'PRATA' },
    3: { stroke: '#fde047', fill: '#fbbf24', name: 'OURO' },
    4: { stroke: '#67e8f9', fill: '#06b6d4', name: 'DIAMANTE' },
    5: { stroke: '#d8b4fe', fill: '#a855f7', name: 'AMETISTA' }
  };
  const tierTheme = tierColors[db.radarTier] || tierColors[1];

  container.innerHTML = `
    <div class="radar-wrapper" style="position:relative;">
      ${db.radarTier > 1 ? `<div style="position:absolute; top: -10px; right: 0; background: ${tierTheme.fill}; color: #000; font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; font-weight: 800; letter-spacing: 1px;">TIER ${db.radarTier}: ${tierTheme.name}</div>` : ''}
      <svg viewBox="0 0 ${size} ${size}" style="width:100%; height:auto; overflow:visible;">
        <defs>
          <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${tierTheme.fill}" stop-opacity="0.2" />
            <stop offset="100%" stop-color="${tierTheme.fill}" stop-opacity="0.6" />
          </radialGradient>
        </defs>
        ${grids}
        ${keys.map((_, i) => {
    const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
    return `<line x1="${center}" y1="${center}" x2="${center + radius * Math.cos(angle)}" y2="${center + radius * Math.sin(angle)}" stroke="rgba(255,255,255,0.05)" stroke-width="1" />`;
  }).join('')}
        <polygon points="${points.join(' ')}" fill="url(#radarGrad)" stroke="${tierTheme.stroke}" stroke-width="2" style="filter: drop-shadow(0 0 8px ${tierTheme.fill}40);" />
        ${labelsHtml}
      </svg>
    </div>
  `;
}

function getBadgeDefinitions(db) {
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

  const badges = [
    { id: 'b1', icon: '🆕', name: 'Primeiro Passo', desc: 'Concluiu o primeiro treino.', check: totalWorkouts >= 1 },
    { id: 'b2', icon: '🔥', name: 'Constância', desc: '7 dias de ofensiva.', check: streak >= 7 },
    { id: 'b3', icon: '🏆', name: 'Veterano', desc: '30 treinos concluídos.', check: totalWorkouts >= 30 },
    { id: 'b4', icon: '🏋️', name: 'Força Bruta', desc: 'Volume > 5.000kg num dia.', check: maxDayVol >= 5000 },
    { id: 'b5', icon: '💎', name: 'Elite', desc: 'Chegou ao Nível 10.', check: currentLevel >= 10 },
    { id: 'b6', icon: '⚡', name: 'Relâmpago', desc: '15 treinos no mês.', check: totalWorkouts >= 15 }
  ];

  const specialBadges = (db.conquistas || []).filter(c => typeof c === 'object').map(c => ({
    id: c.id,
    icon: c.icon || '🔱',
    name: c.titulo || c.name,
    desc: `${c.desc} (${c.data})`,
    check: true,
    special: true
  }));

  return [...badges, ...specialBadges];
}

function renderSelectedEmblems(db) {
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

function renderBadges(db) {
  const grid = document.getElementById('badgesGrid');
  if (!grid) return;

  const allBadges = getBadgeDefinitions(db);

  // Detectar novas conquistas (apenas para as fixas b1-b6)
  let newlyUnlocked = false;
  allBadges.forEach(b => {
    if (!b.special && b.check && !db.conquistas.includes(b.id)) {
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

  if (!sessionStorage.getItem('focusStartTime')) {
    sessionStorage.setItem('focusStartTime', Date.now());
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

    // Salva duração do Modo Foco
    const startStr = sessionStorage.getItem('focusStartTime');
    if (startStr) {
      const durMins = Math.max(1, Math.floor((Date.now() - parseInt(startStr)) / 60000));
      db.historico[today()].duracaoFoco = durMins;
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
  "O corpo é a ferramenta, a mente é o motor.",
  "A vida é como andar de bicicleta. Para manter o equilíbrio, você deve continuar em movimento. -Albert Einstein",
  "O homem que move montanhas começa carregando pequenas pedras. -Confúcio",
  "Aquele que tem saúde tem esperança; e aquele que tem esperança tem tudo. -Provérbio Árabe",
  "A maior riqueza é a saúde. -Virgílio",
  "A felicidade reside na alegria da realização e no entusiasmo do esforço criativo. -Franklin D. Roosevelt",
  "O conhecimento é poder. -Francis Bacon",
  "O que fazemos em vida ecoa na eternidade. -Marco Aurélio",
  "A coragem é a primeira das qualidades humanas porque é a qualidade que garante as outras. -Aristóteles",
  "Agir, eis a inteligência verdadeira. Serei o que quiser. Mas tenho que querer o que for. -Fernando Pessoa",
  "A arte de vencer se aprende nas derrotas. -Simón Bolívar",
  "Não há nada como o retorno para um lugar que permanece inalterado para encontrar as maneiras pelas quais você mesmo se alterou. -Nelson Mandela",
  "A vida não examinada não vale a pena ser vivida. -Sócrates",
  "O sábio nunca diz tudo o que pensa, mas pensa sempre tudo o que diz. -Aristóteles",
  "O homem é o que ele acredita. -Anton Tchekhov",
  "Não espere por circunstâncias ideais, nem por chances favoráveis; elas nunca virão. -Janet Erskine Stuart",
  "Somos o que pensamos. Tudo o que somos surge com nossos pensamentos. -Buda",
  "A paciência é amarga, mas seu fruto é doce. -Jean-Jacques Rousseau",
  "O segredo da mudança é focar toda a sua energia não em lutar contra o velho, mas em construir o novo. -Sócrates",
  "Aquele que não é suficientemente corajoso para correr riscos não realizará nada na vida. -Muhammad Ali",
  "O insucesso é apenas uma oportunidade para recomeçar com mais inteligência. -Henry Ford",
  "A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original. -Albert Einstein",
  "O homem não é nada além do que ele faz de si mesmo. -Jean-Paul Sartre",
  "Não é a morte que um homem deve temer, mas ele deve temer nunca começar a viver. -Marco Aurélio",
  "Tudo o que somos é resultado do que pensamos. -Buda",
  "Conhece-te a ti mesmo e conhecerás o universo e os deuses. -Sócrates",
  "A vontade de preparar deve ser maior do que a vontade de vencer. -Bob Knight",
  "Para ser um mestre, você deve ser um eterno aprendiz. -Lao Tzu",
  "A suprema arte da guerra é derrotar o inimigo sem lutar. -Sun Tzu",
  "Se você conhece o inimigo e conhece a si mesmo, não precisa temer o resultado de cem batalhas. -Sun Tzu",
  "Nós somos os nossos próprios demônios e fazemos deste mundo o nosso próprio inferno. -Oscar Wilde",
  "A verdadeira liberdade é um ato de autodisciplina. -Sêneca",
  "Viver é a coisa mais rara do mundo. A maioria das pessoas apenas existe. -Oscar Wilde",
  "Não erramos por desejar demais, mas por realizar de menos. -Sêneca",
  "O caminho para a sabedoria é pavimentado com humildade. -Confúcio",
  "Nada de grande se cria de repente. -Epiteto",
  "Aquele que conquista a si mesmo é o guerreiro mais poderoso. -Lao Tzu",
  "A maior glória de viver não está em nunca cair, mas em nos levantar toda vez que caímos. -Nelson Mandela",
  "A educação é a arma mais poderosa que você pode usar para mudar o mundo. -Nelson Mandela",
  "O gênio é 1% inspiração e 99% transpiração. -Thomas Edison",
  "Muitas das falhas da vida ocorrem porque não perceberam o quão perto estavam do sucesso quando desistiram. -Thomas Edison",
  "A força não vem da capacidade física, mas de uma vontade férrea. -Mahatma Gandhi",
  "Você deve ser a mudança que deseja ver no mundo. -Mahatma Gandhi",
  "A vida é o que acontece enquanto você está ocupado fazendo outros planos. -John Lennon",
  "Não importa quão devagar você vá, desde que você não pare. -Confúcio",
  "A felicidade não é algo pronto. Ela vem de suas próprias ações. -Dalai Lama",
  "Dê a quem você ama: asas para voar, raízes para voltar e motivos para ficar. -Dalai Lama",
  "O homem livre é aquele que não tem medo de ir até o fim de seu pensamento. -Albert Camus",
  "No meio da dificuldade encontra-se a oportunidade. -Albert Einstein",
  "É melhor ser odiado pelo que você é do que ser amado pelo que você não é. -André Gide",
  "Aquilo que não nos mata nos fortalece. -Friedrich Nietzsche",
  "A dúvida é o princípio da sabedoria. -Aristóteles",
  "Não se pode ensinar nada a um homem; pode-se apenas ajudá-lo a encontrar a resposta dentro de si mesmo. -Galileu Galilei",
  "A persistência é o caminho do êxito. -Charles Chaplin",
  "A vida é uma peça de teatro que não permite ensaios. -Charles Chaplin",
  "Saber não é suficiente; devemos aplicar. Querer não é suficiente; devemos fazer. -Johann Wolfgang von Goethe",
  "Onde há amor pela arte da medicina, há também amor pela humanidade. -Hipócrates",
  "Que o teu alimento seja o teu remédio e que o teu remédio seja o teu alimento. -Hipócrates",
  "A amizade é uma alma que habita em dois corpos. -Aristóteles",
  "A música é a linguagem universal da humanidade. -Henry Wadsworth Longfellow",
  "A verdadeira viagem de descoberta não consiste em procurar novas paisagens, mas em ter novos olhos. -Marcel Proust",
  "Sempre que você se encontrar do lado da maioria, é hora de parar e refletir. -Mark Twain",
  "Nunca discuta com pessoas estúpidas. Elas vão te arrastar ao nível delas e te vencer pela experiência. -Mark Twain",
  "Os dois dias mais importantes da sua vida são o dia em que você nasce e o dia em que você descobre o porquê. -Mark Twain",
  "É mais fácil enganar as pessoas do que convencê-las de que foram enganadas. -Mark Twain",
  "O homem que não lê não tem vantagem sobre o homem que não sabe ler. -Mark Twain",
  "Mantenha-se afastado de pessoas que tentam depreciar suas ambições. -Mark Twain",
  "Se você diz a verdade, não precisa se lembrar de nada. -Mark Twain",
  "O sucesso consiste em ir de fracasso em fracasso sem perda de entusiasmo. -Winston Churchill",
  "Um pessimista vê a dificuldade em cada oportunidade; um otimista vê a oportunidade em cada dificuldade. -Winston Churchill",
  "Nunca, nunca, nunca desista. -Winston Churchill",
  "O preço da grandeza é a responsabilidade. -Winston Churchill",
  "A história será generosa comigo, pois pretendo escrevê-la. -Winston Churchill",
  "Coragem é o que é preciso para levantar-se e falar; coragem é também o que é preciso para sentar-se e ouvir. -Winston Churchill",
  "Melhorar é mudar; ser perfeito é mudar com frequência. -Winston Churchill",
  "O sucesso não é definitivo, o fracasso não é fatal: é a coragem de continuar que conta. -Winston Churchill",
  "Dificuldades dominadas são oportunidades ganhas. -Winston Churchill",
  "Você tem inimigos? Bom. Isso significa que você defendeu algo em algum momento de sua vida. -Winston Churchill",
  "Política é a habilidade de prever o que vai acontecer amanhã, na semana que vem, no mês que vem e no ano que vem. -Winston Churchill",
  "Não tenho nada a oferecer senão sangue, fadiga, lágrimas e suor. -Winston Churchill",
  "A imaginação é mais importante que o conhecimento. -Albert Einstein",
  "Tente não se tornar um homem de sucesso, mas sim um homem de valor. -Albert Einstein",
  "A lógica leva você de A a B. A imaginação leva você a qualquer lugar. -Albert Einstein",
  "A medida da inteligência é a capacidade de mudar. -Albert Einstein",
  "Grandes mentes sempre encontraram oposição violenta de mentes medíocres. -Albert Einstein",
  "O mundo é um lugar perigoso de se viver, não por causa daqueles que fazem o mal, mas por causa daqueles que observam e deixam o mal acontecer. -Albert Einstein",
  "Pense em toda a beleza que ainda resta ao seu redor e seja feliz. -Anne Frank",
  "Quem é feliz fará os outros felizes também. -Anne Frank",
  "A longo prazo, a arma mais afiada de todas é um espírito amável e gentil. -Anne Frank",
  "Só se vê bem com o coração. O essencial é invisível aos olhos. -Antoine de Saint-Exupéry",
  "Tu te tornas eternamente responsável por aquilo que cativas. -Antoine de Saint-Exupéry",
  "O futuro pertence àqueles que acreditam na beleza de seus sonhos. -Eleanor Roosevelt",
  "Ninguém pode fazer você se sentir inferior sem o seu consentimento. -Eleanor Roosevelt",
  "Onde não há visão, o povo perece. -Provérbio Bíblico",
  "Se você quer um amigo, seja um. -Ralph Waldo Emerson",
  "O único herói é aquele que faz o que pode. O resto não faz. -Romain Rolland",
  "A vida é curta, a arte é longa. -Sêneca",
  "Enquanto vivemos, aprendemos. -Sêneca",
  "A sorte é o que acontece quando a preparação encontra a oportunidade. -Sêneca",
  "Não é que tenhamos pouco tempo, é que perdemos muito. -Sêneca",
  "Nada é tão terrível quanto o medo em si. -Francis Bacon",
  "A verdadeira felicidade é desfrutar o presente, sem depender ansiosamente do futuro. -Sêneca",
  "Aquele que move montanhas começou carregando pequenas pedras. -Confúcio",
  "O que não nos mata, nos torna mais fortes. -Friedrich Nietzsche",
  "A excelência não é um ato, mas um hábito. -Aristóteles",
  "A paciência é amarga, mas seu fruto é doce. -Jean-Jacques Rousseau",
  "O gênio é 1% inspiração e 99% transpiração. -Thomas Edison",
  "A vida é o que acontece enquanto você está ocupado fazendo outros planos. -John Lennon",
  "A medida da inteligência é a capacidade de mudar. -Albert Einstein",
  "Não importa o quão devagar você vá, desde que não pare. -Confúcio",
  "O conhecimento é poder. -Francis Bacon",
  "A sorte favorece a mente preparada. -Louis Pasteur",
  "O homem que não lê não tem vantagem sobre o homem que não sabe ler. -Mark Twain",
  "Saber não é o suficiente, devemos aplicar. Querer não é o suficiente, devemos fazer. -Goethe",
  "Nós somos o que fazemos repetidamente. -Aristóteles",
  "A vida é curta, mas a glória pode ser eterna. -Cícero",
  "O sucesso é ir de fracasso em fracasso sem perder o entusiasmo. -Winston Churchill",
  "A imaginação é mais importante que o conhecimento. -Albert Einstein",
  "Vencer a si próprio é a maior das vitórias. -Platão",
  "O segredo da força está na vontade. -Victor Hugo",
  "Nada de grande se cria de repente. -Epiteto",
  "A melhor maneira de prever o futuro é criá-lo. -Peter Drucker",
  "Onde quer que você vá, vá com todo o seu coração. -Confúcio",
  "Tudo o que a mente humana pode conceber e acreditar, ela pode realizar. -Napoleon Hill",
  "A simplicidade é o último grau da sofisticação. -Leonardo da Vinci",
  "Não conte os dias, faça os dias contarem. -Muhammad Ali",
  "Dificuldades reais podem ser superadas; apenas as imaginárias são invencíveis. -Theodore Vail",
  "Nossa maior glória não reside em jamais cair, mas em levantarmo-nos cada vez que caímos. -Oliver Goldsmith",
  "O obstáculo é o caminho. -Marco Aurélio",
  "Seja tão bom que eles não possam te ignorar. -Steve Martin",
  "Tente mover o mundo – o primeiro passo será mover a si mesmo. -Platão",
  "A única maneira de fazer um excelente trabalho é amar o que você faz. -Steve Jobs",
  "A persistência é o caminho do êxito. -Charles Chaplin",
  "Nada é impossível para quem tenta. -Alexandre, o Grande",
  "Aquele que tem um 'porquê' para viver pode suportar quase qualquer 'como'. -Friedrich Nietzsche",
  "O caráter é o destino. -Heráclito",
  "Mantenha seus olhos nas estrelas e seus pés no chão. -Theodore Roosevelt",
  "A coragem é a resistência ao medo, o domínio do medo, e não a ausência dele. -Mark Twain",
  "Tudo o que somos é resultado do que pensamos. -Buda",
  "A vida começa onde termina a sua zona de conforto. -Neale Donald Walsch",
  "O insucesso é apenas uma oportunidade para recomeçar com mais inteligência. -Henry Ford",
  "O futuro pertence àqueles que acreditam na beleza de seus sonhos. -Eleanor Roosevelt",
  "A energia da mente é a essência da vida. -Aristóteles",
  "Não espere; o tempo nunca será 'exatamente certo'. -Napoleon Hill",
  "Aquilo que se faz por amor está sempre além do bem e do mal. -Friedrich Nietzsche",
  "É na crise que nasce a inventividade, as descobertas e as grandes estratégias. -Albert Einstein",
  "Sempre parece impossível até que seja feito. -Nelson Mandela",
  "As raízes da educação são amargas, mas o fruto é doce. -Aristóteles",
  "Quem não se senta para aprender, não se levanta para ensinar. -Provérbio Chinês",
  "A maior riqueza é a saúde. -Virgílio",
  "Qualquer pessoa que para de aprender é velha, seja aos vinte ou aos oitenta anos. -Henry Ford",
  "Se você quer ser feliz, seja. -Léon Tolstói",
  "A saúde é a verdadeira riqueza, não peças de ouro e prata. -Mahatma Gandhi",
  "Para ganhar o que você nunca ganhou, você deve fazer o que nunca fez. -Thomas Jefferson",
  "A sorte é o que acontece quando a preparação encontra a oportunidade. -Sêneca",
  "É mais fácil prevenir do que remediar. -Erasmo de Roterdã",
  "O sábio nunca diz tudo o que pensa, mas pensa sempre tudo o que diz. -Aristóteles",
  "O homem é livre no momento em que deseja ser. -Voltaire",
  "O que você faz hoje pode melhorar todos os seus amanhãs. -Ralph Marston",
  "A disciplina é a alma de um exército. -George Washington",
  "A arte de vencer se aprende nas derrotas. -Simón Bolívar",
  "Não procure por erros, procure por soluções. -Henry Ford",
  "O homem que não tem imaginação não tem asas. -Muhammad Ali",
  "O gênio é a capacidade de enfrentar o que é difícil. -C.G. Jung",
  "Onde não há luta, não há progresso. -Frederick Douglass",
  "Aquele que conquista a si mesmo é o guerreiro mais poderoso. -Lao Tzu",
  "A mente é tudo; o que você pensa, você se torna. -Sócrates",
  "A dúvida é o princípio da sabedoria. -Aristóteles",
  "O que importa não é o que acontece com você, mas como você reage. -Epiteto",
  "Nunca é tarde demais para ser o que você poderia ter sido. -George Eliot",
  "A felicidade não é algo pronto. Ela vem das suas próprias ações. -Dalai Lama",
  "Toda ação humana tem como causa uma dessas sete coisas: acaso, natureza, compulsão, hábito, razão, paixão, desejo. -Aristóteles",
  "A vontade de vencer deve ser maior do que o medo de falhar. -Billie Jean King",
  "Saber o que é correto e não fazê-lo é a falta de coragem. -Confúcio",
  "Ninguém pode fazer você se sentir inferior sem o seu consentimento. -Eleanor Roosevelt",
  "Não erramos por desejar demais, mas por realizar de menos. -Sêneca",
  "O homem nasce para lutar e a sua vida é uma batalha eterna. -Sêneca",
  "Somente aqueles que ousam falhar grandemente podem realizar grandemente. -Robert F. Kennedy",
  "A pressa é a inimiga da perfeição. -Provérbio Popular",
  "Grandes mentes discutem ideias; mentes médias discutem eventos; mentes pequenas discutem pessoas. -Eleanor Roosevelt",
  "A maior aventura que você pode viver é a de viver a vida dos seus sonhos. -Oprah Winfrey",
  "Não é a carga que o quebra, mas a maneira como você a carrega. -Lou Holtz",
  "Os problemas são apenas oportunidades com roupas de trabalho. -Henry Kaiser",
  "A direção é mais importante que a velocidade. -Richard L. Evans",
  "Não encontre defeitos, encontre soluções. -Henry Ford",
  "O segredo da felicidade é a liberdade, e o segredo da liberdade é a coragem. -Tucídides",
  "Age como se o que fizesse fizesse a diferença. E faz. -William James",
  "O trabalho duro vence o talento quando o talento não trabalha duro. -Tim Notke",
  "Tudo o que você sempre quis está do outro lado do medo. -George Addair",
  "A melhor vingança é o sucesso estrondoso. -Frank Sinatra",
  "Não olhe para o relógio; faça o que ele faz. Continue andando. -Sam Levenson",
  "Onde há amor pela arte da medicina, há também amor pela humanidade. -Hipócrates",
  "A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original. -Albert Einstein",
  "O corpo humano é a melhor imagem da alma humana. -Ludwig Wittgenstein",
  "Nada é tão terrível quanto o medo em si. -Francis Bacon",
  "A felicidade reside na alegria da conquista e na emoção do esforço criativo. -Franklin D. Roosevelt",
  "Comece onde você está. Use o que você tem. Faça o que puder. -Arthur Ashe",
  "Vá firme na direção das suas metas, porque o pensamento cria e o desejo atrai. -Johann Wolfgang von Goethe",
  "A vida é curta, a arte é longa, a oportunidade é fugaz. -Hipócrates",
  "O que você faz faz diferença, e você tem que decidir que tipo de diferença você quer fazer. -Jane Goodall",
  "O sucesso não é a chave para a felicidade. A felicidade é a chave para o sucesso. -Albert Schweitzer",
  "As pessoas que são loucas o suficiente para achar que podem mudar o mundo são as que o mudam. -Steve Jobs"
];


function openShareCard(db) {
  const treino = getTodayTreino(db);
  const fichaIds = db.fichas[treino] || [];
  const exercicios = fichaIds.map(id => getExById(db, id)).filter(Boolean);
  const streak = getStreak(db);

  // Calcular Volume e Destaques
  let totalVol = 0;
  let totalCarga = 0;
  const exStats = exercicios.map(ex => {
    const s = parseInt(ex.series) || 0;
    const r = parseInt(ex.repeticoes) || 0;
    const loadVal = parseFloat(String(ex.carga).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const multi = ex.porLado ? 2 : 1;
    const vol = s * r * loadVal * multi;
    totalVol += vol;
    totalCarga += loadVal;
    return { name: ex.nome, vol, carga: formatCarga(ex.carga, ex.porLado, ex.tags) };
  });

  const avgVol = exercicios.length ? (totalCarga / exercicios.length).toFixed(1) : '0.0';

  // Ordenar por volume para pegar os 3 destaques
  const highlights = [...exStats].sort((a, b) => b.vol - a.vol).slice(0, 3);

  document.getElementById('shareDate').textContent = todayLabel().toUpperCase();
  document.getElementById('shareTitle').textContent = `TREINO ${treino}: ${exercicios.length} EXERCÍCIOS`;
  document.getElementById('shareExCount').textContent = exercicios.length;
  document.getElementById('shareVol').textContent = totalVol.toLocaleString('pt-BR');
  document.getElementById('shareAvgVol').textContent = avgVol;
  const shareStreakEl = document.getElementById('shareStreak');
  if (shareStreakEl) {
    if (streak) {
      shareStreakEl.innerHTML = `${streak}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="color:#f97316; margin-left: 2px; display: inline-block; vertical-align: middle;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
    } else {
      shareStreakEl.innerHTML = '0';
    }
  }

  const histHoje = db.historico[today()];
  const durStr = histHoje && histHoje.duracaoTotal ? formatSeconds(histHoje.duracaoTotal) : '--';
  document.getElementById('shareTime').textContent = durStr;

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

function getActiveShareCardInfo() {
  if (document.getElementById('shareCardBadge').style.display !== 'none') {
    return { card: document.getElementById('shareCardBadge'), name: 'conquista' };
  } else if (document.getElementById('shareCardRadar') && document.getElementById('shareCardRadar').style.display !== 'none') {
    return { card: document.getElementById('shareCardRadar'), name: 'radar' };
  } else {
    return { card: document.getElementById('shareCard'), name: 'treino' };
  }
}

function downloadShareImage() {
  const info = getActiveShareCardInfo();
  const card = info.card;
  const btn = document.getElementById('btnDownloadImage');
  const originalBtnText = btn.innerHTML;

  btn.innerHTML = '<span><i class="fas fa-spinner fa-spin"></i></span> GERANDO...';
  btn.disabled = true;

  // html2canvas options for high quality
  html2canvas(card, {
    scale: 2, // Double resolution
    backgroundColor: '#000000',
    useCORS: true,
    logging: false
  }).then(canvas => {
    const link = document.createElement('a');
    const name = info.name;
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

function shareImageNow() {
  const info = getActiveShareCardInfo();
  const card = info.card;
  const btn = document.getElementById('btnShareNow');
  const originalBtnText = btn.innerHTML;

  btn.innerHTML = '<span><i class="fas fa-spinner fa-spin"></i></span> PREPARANDO...';
  btn.disabled = true;

  html2canvas(card, {
    scale: 2,
    backgroundColor: '#000000',
    useCORS: true,
    logging: false
  }).then(canvas => {
    canvas.toBlob(blob => {
      const name = info.name;
      const file = new File([blob], `meu-${name}-${today()}.jpg`, { type: 'image/jpeg' });

      const fallbackDownloadAndCopy = () => {
        // Tenta copiar a imagem para a área de transferência (Ótimo para PC/WhatsApp Web)
        canvas.toBlob(pngBlob => {
          try {
            const item = new ClipboardItem({ 'image/png': pngBlob });
            navigator.clipboard.write([item]).then(() => {
              showToast('Imagem copiada para a área de transferência. Compartilhe com seus amigos!', 'success');
              btn.innerHTML = originalBtnText;
              btn.disabled = false;
            }).catch(() => {
              executarDownloadTradicional();
            });
          } catch (e) {
            executarDownloadTradicional();
          }
        }, 'image/png');
      };

      const executarDownloadTradicional = () => {
        const link = document.createElement('a');
        link.download = file.name;
        link.href = URL.createObjectURL(blob);
        link.click();

        btn.innerHTML = originalBtnText;
        btn.disabled = false;
        showToast('Compartilhamento não suportado. Imagem baixada!', 'info');
      };

      // Tenta usar a Web Share API Nativa
      if (navigator.share) {
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          navigator.share({
            title: 'AcademiaPRO',
            text: '🔥 Confira meu progresso na AcademiaPRO!',
            files: [file]
          }).then(() => {
            btn.innerHTML = originalBtnText;
            btn.disabled = false;
          }).catch(err => {
            console.warn(err);
            if (err.name !== 'AbortError') fallbackDownloadAndCopy();
            else {
              btn.innerHTML = originalBtnText;
              btn.disabled = false;
            }
          });
        } else {
          fallbackDownloadAndCopy();
        }
      } else {
        fallbackDownloadAndCopy();
      }
    }, 'image/jpeg', 0.9);
  }).catch(err => {
    console.error(err);
    btn.innerHTML = originalBtnText;
    btn.disabled = false;
    showToast('Erro ao preparar compartilhamento.', 'error');
  });
}

function shareRadar() {
  document.getElementById('shareRadarDate').textContent = todayLabel().toUpperCase();
  const modeText = currentRadarMode === 'mensal' ? 'MENSAL' : 'TOTAL';
  document.getElementById('shareRadarMode').textContent = `RADAR ${modeText}`;

  // Clona o SVG do radar
  const radarSvg = document.querySelector('#radarChartContainer svg');
  const cloneContainer = document.getElementById('shareRadarCloneContainer');
  cloneContainer.innerHTML = '';
  if (radarSvg) {
    const clone = radarSvg.cloneNode(true);
    clone.style.width = '100%';
    clone.style.maxWidth = '300px';
    clone.style.height = 'auto';
    cloneContainer.appendChild(clone);
  }

  // Prepara o modal ocultando os outros cards
  document.getElementById('shareCard').style.display = 'none';
  if (document.getElementById('shareCardBadge')) document.getElementById('shareCardBadge').style.display = 'none';
  document.getElementById('shareCardRadar').style.display = 'flex';

  openModal('modalShare');
}

// ---- TEMAS ----
const APP_THEMES = {
  purple: { p: '#8b5cf6', pl: '#c084fc', pd: '#6d28d9' },
  green: { p: '#22c55e', pl: '#4ade80', pd: '#16a34a' },
  blue: { p: '#3b82f6', pl: '#60a5fa', pd: '#2563eb' },
  orange: { p: '#f97316', pl: '#fb923c', pd: '#ea580c' },
  red: { p: '#ef4444', pl: '#f87171', pd: '#dc2626' },
  cyan: { p: '#06b6d4', pl: '#22d3ee', pd: '#0891b2' },
  pink: { p: '#ec4899', pl: '#f472b6', pd: '#db2777' },
  amarelo: { p: '#facc15', pl: '#fde68a', pd: '#ca8a04' },
  cinza: { p: '#64748b', pl: '#94a3b8', pd: '#475569' },
  branco: { p: '#ffffff', pl: '#ffffff', pd: '#d1d5db' },
  prata: { p: '#94a3b8', pl: '#cbd5e1', pd: '#64748b' },
  dourado: { p: '#fbbf24', pl: '#fde68a', pd: '#d97706' }
};

function applyAppTheme(themeKey) {
  const theme = APP_THEMES[themeKey];
  if (!theme) return;

  const root = document.documentElement;
  root.style.setProperty('--primary', theme.p);
  root.style.setProperty('--primary-light', theme.pl);
  root.style.setProperty('--primary-dark', theme.pd);
  root.style.setProperty('--primary-rgb', hexToRgb(theme.p));
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
  },
  tonificar: {
    A: ['ex-gluteo-3a', 'ex-abducao-solo', 'ex-supra-ponte', 'ex-b5', 'ex-a3', 'ex-a2', 'ex-banco-abdutor'],
    B: ['ex-extensor', 'ex-leg-180', 'ex-banco-adutor', 'ex-burrinho', 'ex-b2', 'ex-b3', 'ex-infra-solo'],
    ae: { tipo: 'Geral', vel: '---', tempo: '20' }
  },
  hipertrofia_medio: {
    A: ['ex-a2', 'ex-elev-frontal', 'ex-leg-45', 'ex-tric-puller', 'ex-banco-adutor', 'ex-agach-gaiola', 'ex-voo-45', 'ex-infra-prancha'],
    B: ['ex-remad-artic', 'ex-roscamartelo-90', 'ex-b5', 'ex-banco-abdutor', 'ex-burrinho', 'ex-roscamartelo', 'ex-b1', 'ex-ponteventral']
  },
  perda_ponderal_media: {
    A: ['ex-hack', 'ex-extensor', 'ex-remad-artic', 'ex-rosca-direta-barra-livre', 'ex-rosca-direta-cross', 'ex-remada-cavalinho', 'ex-banco-adutor', 'ex-banco-abdutor', 'ex-supra-banco'],
    B: ['ex-mesa-flexora', 'ex-panturrilha-livre', 'ex-flexao-quadril', 'ex-triceps-corda', 'ex-supino-reto', 'ex-desenvolvimento-ombro-halter', 'ex-elev-frontal', 'ex-supra-banco'],
    ae: { tipo: 'Geral', vel: '---', tempo: '20' }
  },
  hipertrofia_medio_ii: {
    A: ['ex-supino-reto-halteres', 'ex-a4', 'ex-a1', 'ex-agach-guiado', 'ex-extensor', 'ex-desenvolvimento-frente', 'ex-triceps-corda', 'ex-triceps-palmar'],
    B: ['ex-puxada-supinada', 'ex-fly-inverso', 'ex-remada-cavalinho', 'ex-b5', 'ex-mesa-flexora', 'ex-rosca-direta-barra-livre', 'ex-b4', 'ex-a8']
  },
  perda_ponderal_media_ii: {
    A: ['ex-leg-45', 'ex-panturrilha-leg-45', 'ex-elevacao-joelho', 'ex-supino-45', 'ex-triceps-testa-barra-h', 'ex-desenvolvimento-barra', 'ex-b6', 'ex-b8'],
    B: ['ex-b5', 'ex-remada-unilateral', 'ex-pull-down', 'ex-roscott-unilateral', 'ex-rosca-direta-cross', 'ex-fly-inverso', 'ex-supra-solo', 'ex-extensao-lombar'],
    ae: { tipo: 'Geral', vel: '---', tempo: '20' }
  }
};

function applyTemplate(db, templateKey) {
  const tpl = TEMPLATES_PRONTOS[templateKey];
  if (!tpl) {
    console.warn('[applyTemplate] Template não encontrado:', templateKey);
    showToast('Template não encontrado: ' + templateKey, 'error');
    return;
  }

  db.fichas.A = [...tpl.A];
  db.fichas.B = [...tpl.B];

  if (tpl.ae) {
    db.aerobicos.A = { ...tpl.ae };
    db.aerobicos.B = { ...tpl.ae };
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
  initTabs(db);
  renderFicha(db);
  renderExercicios(db);
  renderMontar(db);
  renderProgresso(db);
  updateEmptyWorkoutButtons(db);
  initCalculator();

  // Treino selector (A/B...) - Apenas na Ficha do Dia
  document.querySelectorAll('.ficha-header-bar .sel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setTodayTreino(db, btn.dataset.treino);
      renderFicha(db);
      showToast('Treino ' + btn.dataset.treino + ' selecionado!', 'info');
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

  // Removido listener global de .view-btn para evitar conflitos entre abas

  // Novo exercício
  document.getElementById('btnNovoExercicio')?.addEventListener('click', openNewExercicio);

  // Configurar Cardio (Montar Ficha)
  document.getElementById('btnEditAerobico')?.addEventListener('click', () => {
    openAerobicoModal(loadDB());
  });

  // Removido init global de .view-btn (agora tratado em cada render)

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
  document.getElementById('btnShareNow')?.addEventListener('click', () => shareImageNow());
  document.getElementById('btnDownloadImage')?.addEventListener('click', () => downloadShareImage());

  // Upload
  document.getElementById('uploadArea')?.addEventListener('click', () => document.getElementById('uploadInput').click());
  document.getElementById('uploadInput')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Imagem muito grande (máx. 2MB).', 'error'); return; }
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
    const btn = e.target.closest('.btn-note-toggle, .btn-note-toggle-table, .btn-note-toggle-deck');
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

  // Maestria Geral (Deck Footer)
  document.getElementById('btnMaestriaGeral')?.addEventListener('click', () => openMaestriaGeral(loadDB()));
  
  // Coleção de Exercícios (Header Right)
  document.getElementById('btnVerColecao')?.addEventListener('click', () => openColecaoExercicios(loadDB()));

  // Fechar modais
  document.getElementById('btnFecharMaestriaGeral')?.addEventListener('click', () => closeModal('modalMaestriaGeral'));
  document.getElementById('btnFecharMaestriaEx')?.addEventListener('click', () => closeModal('modalMaestriaEx'));
  document.getElementById('btnFecharColecao')?.addEventListener('click', () => closeModal('modalColecaoExercicios'));

  // Filtro na Coleção
  document.getElementById('colecaoSearch')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.colecao-item');
    cards.forEach(card => {
      const match = card.dataset.name.toLowerCase().includes(term);
      card.style.display = match ? 'flex' : 'none';
    });
  });

  // Atualizar widget de maestria no deck footer
  updateDeckMaestriaWidget(db);

  // Iniciar Cronômetro Global
  initGlobalTimer(db);

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
let globalWorkoutInterval = null;

function initGlobalTimer(db) {
  const startTime = localStorage.getItem('workout_start_time');
  const btn = document.getElementById('btnStartWorkout');
  const display = document.getElementById('globalWorkoutTimer');

  if (startTime) {
    if (btn) {
      btn.innerHTML = '<span>⏹️</span> ENCERRAR TREINO';
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
        btn.innerHTML = '<span>⏹️</span> ENCERRAR TREINO';
        btn.classList.add('active');
        if (display) display.style.display = 'flex';
        startInterval();
        showToast('Treino iniciado! Foco total!', 'success');
      } else {
        encerrarTreinoGlobal(db);
      }
    };
  }
}

function startInterval() {
  if (globalWorkoutInterval) clearInterval(globalWorkoutInterval);
  globalWorkoutInterval = setInterval(updateGlobalTimerUI, 1000);
  updateGlobalTimerUI();
}

function updateGlobalTimerUI() {
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

function stopGlobalTimer(db) {
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
    btn.innerHTML = '<span>▶️</span> INICIAR TREINO';
    btn.classList.remove('active');
  }
  if (display) display.style.display = 'none';
  if (globalWorkoutInterval) clearInterval(globalWorkoutInterval);

  renderProgresso(db);
  return true;
}

function encerrarTreinoGlobal(db) {
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
function openCRDetails(db, exId) {
  const ex = getExById(db, exId);
  if (!ex) return;

  const m = document.getElementById('modalCRDetails');
  
  // Header Info
  document.getElementById('crExName').textContent = ex.nome;
  document.getElementById('crExLevel').textContent = "15"; // Baseado na imagem
  document.getElementById('crExLevelLabel').textContent = "15";
  document.getElementById('crExGrupo').textContent = ex.grupoMuscular;
  document.getElementById('crExClasse').textContent = "Aparelho"; // Como solicitado
  
  const imgUrl = ex.imagem || '';
  document.getElementById('crExCardImg').src = imgUrl;
  document.getElementById('crExIllustration').src = imgUrl;
  document.getElementById('crExDescription').textContent = ex.anotacoes || "Um exercício focado em fortalecer o " + ex.grupoMuscular + ". Mantenha a postura correta para melhores resultados!";

  // Maestria Shortcut (Trophy Icon)
  const mBtn = document.getElementById('crExMaestriaIcon');
  mBtn.innerHTML = '';
  const state = getMaestriaState(db, exId);
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

  openModal('modalCRDetails');
}
