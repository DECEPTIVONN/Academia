import { startRestTimer, stopRestTimer } from './secao-ficha.js';
import { renderSelectedEmblems } from './secao-progresso.js';

'use strict';
// =============================================
// ACADEMIA — TREINO.JS
// Fichas de treino com localStorage
// =============================================

export const DB_KEY = 'academia_treino';

// ---- MAESTRIA: Definição dos Desafios (Clash Royale Style) ----
export const MAESTRIA_CHALLENGES = [
  {
    id: 1, badge: 'bronze', label: 'Desafio de Bronze', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:#f97316;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    subDesafios: [
      { id: 1, label: 'Primeiros Passos',   desc: 'Complete este exercício 5 vezes',   target: 5  },
      { id: 2, label: 'Desenvolvendo Força',desc: 'Complete este exercício 15 vezes',  target: 15 },
      { id: 3, label: 'Consistência',       desc: 'Complete este exercício 30 vezes',  target: 30 }
    ]
  },
  {
    id: 2, badge: 'prata', label: 'Desafio de Prata', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:#94a3b8;"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19 19 13"/><path d="M9.5 17.5 21 6V3h-3L6.5 14.5"/><path d="M11 19 5 13"/></svg>`,
    subDesafios: [
      { id: 1, label: 'Dedicado',    desc: 'Complete este exercício 50 vezes',  target: 50  },
      { id: 2, label: 'Veterano',    desc: 'Complete este exercício 75 vezes',  target: 75  },
      { id: 3, label: 'Especialista',desc: 'Complete este exercício 100 vezes', target: 100 }
    ]
  },
  {
    id: 3, badge: 'ouro', label: 'Desafio de Ouro', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:#fbbf24;"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/></svg>`,
    subDesafios: [
      { id: 1, label: 'Elite',         desc: 'Complete este exercício 150 vezes', target: 150 },
      { id: 2, label: 'Lendário',      desc: 'Complete este exercício 200 vezes', target: 200 },
      { id: 3, label: 'Maestria Plena',desc: 'Complete este exercício 300 vezes', target: 300 }
    ]
  }
];

// Estado do Deck Builder (Clash Royale Style)
export let currentDeckLetter = 'A';
export function setCurrentDeckLetter(val) { currentDeckLetter = val; }
export let currentDeckPage = 1;
export function setCurrentDeckPage(val) { currentDeckPage = val; }
export let currentDeckView = 'royale'; // 'royale', 'grid' ou 'list'
export function setCurrentDeckView(val) { currentDeckView = val; }
export let currentExView = 'colecao'; // 'grid' ou 'colecao'
export function setCurrentExView(val) { currentExView = val; }

// Dados padrão
export const DEFAULT_EXERCISES = [
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
  // Novos para Perda Ponderal (média)
  { id: 'ex-hack', nome: 'HACK', grupoMuscular: 'Pernas', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/HACK.webp', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-rosca-direta-barra-livre', nome: 'Rosca Direta Barra Livre', grupoMuscular: 'Bíceps', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Rosca Direta Barra.gif', tags: ['Isolador', 'Livre'] },
  { id: 'ex-rosca-direta-cross', nome: 'Rosca Direta Cross', grupoMuscular: 'Bíceps', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Rosca Direta Cross.gif', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-remada-cavalinho', nome: 'Remada Cavalinho Máquina', grupoMuscular: 'Costas', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Remada Cavalinho.gif', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-mesa-flexora', nome: 'Mesa Flexora', grupoMuscular: 'Pernas', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Mesa Flexora.webp', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-panturrilha-livre', nome: 'Panturrilha Livre', grupoMuscular: 'Pernas', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Panturrilha Livre.gif', tags: ['Isolador', 'Livre'] },
  { id: 'ex-flexao-quadril', nome: 'Flexão de Quadril', grupoMuscular: 'Pernas', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Flexão de quadril.gif', tags: ['Isolador', 'Peso do Corpo'] },
  { id: 'ex-triceps-corda', nome: 'Trícepes Corda', grupoMuscular: 'Tríceps', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Tricepes Corda.gif', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-supino-reto', nome: 'Supino Reto', grupoMuscular: 'Peito', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Supino Reto.gif', tags: ['Multiarticular', 'Livre'] },
  { id: 'ex-desenvolvimento-ombro-halter', nome: 'Desenvolvimento Ombro com Halter', grupoMuscular: 'Ombros', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Desenvolvimento Ombro com Halter.gif', tags: ['Multiarticular', 'Livre'] },
  { id: 'ex-supra-banco', nome: 'Supra Banco', grupoMuscular: 'Core', series: 3, repeticoes: '20', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Supra Banco.gif', tags: ['Isolador', 'Máquina'] },
  // Novos para Hipertrofia (Médio) II
  { id: 'ex-supino-reto-halteres', nome: 'Supino Reto com Halteres', grupoMuscular: 'Peito', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/supino-reto-com-halteres.gif', tags: ['Multiarticular', 'Livre'] },
  { id: 'ex-agach-guiado', nome: 'Agachamento Guiado', grupoMuscular: 'Pernas', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Agachamento guiado.gif', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-desenvolvimento-frente', nome: 'Desenvolvimento Frente', grupoMuscular: 'Ombros', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: null, tags: ['Multiarticular', 'Livre'] },
  { id: 'ex-triceps-palmar', nome: 'Triceps Palmar', grupoMuscular: 'Tríceps', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Tricepes Palmar.gif', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-puxada-supinada', nome: 'Puxada Supinada', grupoMuscular: 'Costas', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Puxada Supinada.gif', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-fly-inverso', nome: 'Fly Inverso', grupoMuscular: 'Costas', series: 3, repeticoes: '10', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/Fly Inverso.gif', tags: ['Isolador', 'Máquina'] },
  // Novos para Perda Ponderal (Médio) II
  { id: 'ex-panturrilha-leg-45', nome: 'Panturrilha Leg 45°', grupoMuscular: 'Pernas', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/PANTURRILHA LEG 45°.gif', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-elevacao-joelho', nome: 'Elevação de Joelho', grupoMuscular: 'Core', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/ELEVACÃO DE JOELHO.gif', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-supino-45', nome: 'Supino 45°', grupoMuscular: 'Peito', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/SUPINO 45°.gif', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-triceps-testa-barra-h', nome: 'Triceps Testa Barra H', grupoMuscular: 'Tríceps', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/TRICEPS TESTA BARRA H.gif', tags: ['Isolador', 'Livre'] },
  { id: 'ex-desenvolvimento-barra', nome: 'Desenvolvimento Barra', grupoMuscular: 'Ombros', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/DESENVOLVIMENTO BARRA.gif', tags: ['Multiarticular', 'Livre'] },
  { id: 'ex-remada-unilateral', nome: 'Remada Unilateral', grupoMuscular: 'Costas', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/REMADA UNILATERAL.gif', tags: ['Isolador', 'Máquina'] },
  { id: 'ex-pull-down', nome: 'Pull Down', grupoMuscular: 'Costas', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/PULL DOWN.gif', tags: ['Multiarticular', 'Máquina'] },
  { id: 'ex-roscott-unilateral', nome: 'Rosca Scott Unilateral', grupoMuscular: 'Bíceps', series: 3, repeticoes: '15', carga: '', descanso: 30, imagem: './Assets/exerciciosgif/ROSCA SCOTT UNILATERAL.gif', tags: ['Isolador', 'Livre'] },
  { id: 'ex-extensao-lombar', nome: 'Extensão Lombar', grupoMuscular: 'Core', series: 3, repeticoes: '20', carga: '', descanso: 30, imagem: null, tags: ['Isolador', 'Máquina'] },
];

export const DEFAULT_FICHAS = {
  A: ['ex-a1', 'ex-a2', 'ex-a5', 'ex-a6', 'ex-a8'],
  B: ['ex-b1', 'ex-b2', 'ex-b5', 'ex-b4', 'ex-b7'],
  C: [], D: [], E: [], F: [], G: [], H: [], I: [], J: []
};

// ---- DB ----
export function loadDB() {
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

    if (!db.dashboard) {
      db.dashboard = {
        suggestedWorkout: null,
        lastSuggestionDate: null,
        widgetMode: 'forja',
        newsRead: []
      };
      updated = true;
    } else {
      if (db.dashboard.suggestedWorkout === undefined) {
        db.dashboard.suggestedWorkout = null;
        updated = true;
      }
      if (db.dashboard.lastSuggestionDate === undefined) {
        db.dashboard.lastSuggestionDate = null;
        updated = true;
      }
      if (db.dashboard.widgetMode === undefined) {
        db.dashboard.widgetMode = 'forja';
        updated = true;
      }
      if (!Array.isArray(db.dashboard.newsRead)) {
        db.dashboard.newsRead = [];
        updated = true;
      }
    }

    if (!db.profileCustomization) {
      db.profileCustomization = {
        nome: 'DECEPTIVON',
        handle: '@deceptivon',
        avatarSeed: 'Deceptivon',
        banner: 'roxo-neon',
        titulo: null,
        avatarFrame: null,
        assinatura: '',
        barSkin: 'default',
        cardSkin: 'default',
        showcaseStat: 'streak',
        mainEmblem: 'prestigio-1',
        mainEmblemPulse: true
      };
      updated = true;
    } else {
      // Migração de campos novos em usuários existentes
      if (db.profileCustomization.assinatura === undefined) {
        db.profileCustomization.assinatura = '';
        updated = true;
      }
      if (db.profileCustomization.barSkin === undefined) {
        db.profileCustomization.barSkin = 'default';
        updated = true;
      }
      if (db.profileCustomization.cardSkin === undefined) {
        db.profileCustomization.cardSkin = 'default';
        updated = true;
      }
      if (db.profileCustomization.showcaseStat === undefined) {
        db.profileCustomization.showcaseStat = 'streak';
        updated = true;
      }
      if (db.profileCustomization.mainEmblem === undefined) {
        db.profileCustomization.mainEmblem = 'prestigio-1';
        updated = true;
      }
      if (db.profileCustomization.mainEmblemPulse === undefined) {
        db.profileCustomization.mainEmblemPulse = true;
        updated = true;
      }
    }

    if (updated) {
      saveDB(db);
    }

    return db;
  } catch (e) { return initDB(); }
}

export function initDB() {
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
    dashboard: {
      suggestedWorkout: null,
      lastSuggestionDate: null,
      widgetMode: 'forja',
      newsRead: []
    },
    maestrias: {},
    profileCustomization: {
      nome: 'DECEPTIVON',
      handle: '@deceptivon',
      avatarSeed: 'Deceptivon',
      banner: 'roxo-neon',
      titulo: null,
      avatarFrame: null,
      assinatura: '',
      barSkin: 'default',
      cardSkin: 'default',
      showcaseStat: 'streak',
      mainEmblem: 'prestigio-1',
      mainEmblemPulse: true
    }
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

export function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// ---- UTILS ----
export function uid() { return 'ex-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7); }

export function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayLabel() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

export function formatCarga(carga, porLado = false, tags = []) {
  if (tags && tags.includes('Peso do Corpo')) return 'Peso do Corpo';
  if (!carga) return '';
  const c = String(carga).trim();
  const label = c.toLowerCase().endsWith('kg') ? c : c + 'kg';
  return porLado ? `${label} cada lado` : label;
}

export function formatSeconds(seconds) {
  if (!seconds) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function determineTreinoDoDia(db) {
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

export function getTodayTreino(db) {
  const t = today();
  if (db.historico[t] && db.historico[t].treino) return db.historico[t].treino;
  return determineTreinoDoDia(db);
}

export function setTodayTreino(db, letra) {
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

export function getChecks(db) {
  const t = today();
  return (db.historico[t] && db.historico[t].checks) ? db.historico[t].checks : [];
}

export function getSeriesDone(db, exId) {
  const t = today();
  if (!db.historico[t]) return [];
  if (!db.historico[t].seriesDone) db.historico[t].seriesDone = {};
  return db.historico[t].seriesDone[exId] || [];
}

export function toggleSeriesSet(db, exId, setIdx) {
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

export function toggleCheck(db, exId) {
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

export function getExById(db, id) { return db.exercicios.find(e => e.id === id); }

export function getStreak(db) {
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

export function grupoBadgeClass(grupo) {
  return 'grupo-badge badge-' + (grupo || '').replace(/[íéóãõê]/g, c => ({ 'í': 'i', 'é': 'e', 'ó': 'o', 'ã': 'a', 'õ': 'o', 'ê': 'e' }[c] || c));
}

export function showToast(msg, type = 'info') {
  const tc = document.getElementById('toastContainer');
  if (!tc) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 350); }, 3000);
}

// ---- RENDER HERO STATS ----
export let currentViewMode = localStorage.getItem('academia_view_mode') || 'grid'; // table ou grid
export function setCurrentViewMode(val) { currentViewMode = val; }

/**
 * Atualiza os stats do Hero (Ficha) e delega o restante para renderProgresso.
 * IMPORTANTE: renderProgresso é a única fonte de verdade para streak, XP e contadores.
 * renderHeroStats apenas atualiza o total de exercícios cadastrados (exclusivo do hero)
 * e importa renderProgresso dinamicamente para evitar dependência circular.
 */
export function renderHeroStats(db) {
  const el = id => document.getElementById(id);
  // Único elemento exclusivo do hero que não está em renderProgresso
  el('statTotalEx') && (el('statTotalEx').textContent = db.exercicios.length);

  // Delegar streak, XP e contadores para renderProgresso (fonte única de verdade)
  // Importação dinâmica para evitar dependência circular db.js <-> secao-progresso.js
  import('./secao-progresso.js').then(({ renderProgresso }) => {
    renderProgresso(db);
  }).catch(() => {
    // Fallback síncrono caso o módulo não esteja disponível (ex: teste isolado)
    const streak = getStreak(db);
    if (el('statStreak')) {
      if (streak) {
        el('statStreak').innerHTML = `${streak}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="color:#f97316; margin-left: 2px; display: inline-block; vertical-align: middle;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
      } else {
        el('statStreak').innerHTML = '0';
      }
    }
    const hist = db.historico || {};
    const completedDates = Object.keys(hist).filter(d => hist[d].concluido);
    const xp = completedDates.length * 10;
    el('profStreak') && (el('profStreak').textContent = streak + (streak === 1 ? ' dia' : ' dias'));
    el('profXp') && (el('profXp').textContent = xp + ' XP');
  });
  renderSelectedEmblems(db);
}

/**
 * Aplica um efeito suave de fade-in (com leve translação vertical) a elementos DOM.
 * Ele reseta a classe utilitária de animação para garantir que o efeito dispare
 * sempre que novos conteúdos forem injetados no DOM.
 */
export function fadeIn(...elements) {
  elements.forEach(el => {
    if (!el) return;
    el.classList.remove('ui-fade-in');
    el.classList.remove('ui-fade-out');
    void el.offsetWidth; // Força reflow no navegador
    el.classList.add('ui-fade-in');

    // Reinicia também a animação dos filhos com entrada escalonada (stagger)
    el.querySelectorAll('.stagger-item').forEach(child => {
      child.style.animation = 'none';
      void child.offsetWidth;
      child.style.animation = '';
    });
  });
}

/**
 * Coordena uma transição de saída e entrada (cross-fade / swap) suave.
 * Aplica a classe fade-out, aguarda a animação terminar, executa a atualização
 * do DOM via callback, e depois faz o fade-in do elemento.
 */
export function fadeSwap(element, updateCallback) {
  if (!element) {
    updateCallback();
    return;
  }
  element.classList.remove('ui-fade-in');
  element.classList.add('ui-fade-out');
  
  // O fade-out dura 0.12s (120ms), aguardamos esse período para trocar o conteúdo
  setTimeout(() => {
    updateCallback();
    element.classList.remove('ui-fade-out');
    fadeIn(element);
  }, 120);
}
