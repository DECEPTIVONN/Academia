/**
 * default-data.ts — Exercícios pré-cadastrados e Fichas padrão (seed)
 *
 * GERADO a partir do legado `JS/treino/db.js` (DEFAULT_EXERCISES + DEFAULT_FICHAS)
 * na v4.0.1-phase0. Mantém os IDs legados (`ex-a1`…) e os caminhos de GIF
 * (`/assets/exerciciosgif/…`, servidos de `src-app/public/assets/exerciciosgif/`)
 * para preservar compatibilidade com histórico/migração da versão offline.
 *
 * Para editar: altere `JS/treino/db.js` (fonte da verdade) e regenere este arquivo,
 * ou edite conscientemente ambos.
 */

import type { Exercise, WorkoutSheet } from '@/core/db/schema';
import { LOCAL_USER_ID } from '@/core/db/schema';

export const DEFAULT_EXERCISES: Exercise[] = [
  {
    "id": "ex-a1",
    "name": "Supino Articulado",
    "muscleGroup": "Peito",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Supino Articulado.gif",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-a2",
    "name": "Voador",
    "muscleGroup": "Peito",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Fly.webp",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-a3",
    "name": "Supino Vertical",
    "muscleGroup": "Ombros",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Supino Vertical.gif",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-a4",
    "name": "Crucifixo",
    "muscleGroup": "Peito",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Crucifixo.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ],
    "porLado": true
  },
  {
    "id": "ex-a5",
    "name": "Leg Press 45° + Banco Extenso",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Leg Press 180° + Banco Extenso.gif",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-a6",
    "name": "Desenvolvimento Máquina",
    "muscleGroup": "Ombros",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Desenvolvimento Máquina.gif",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-a7",
    "name": "Tríceps Testa + Pull Over",
    "muscleGroup": "Tríceps",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Tríceps Testa + Pull Over.gif",
    "tags": [
      "Isolador",
      "Livre"
    ]
  },
  {
    "id": "ex-a8",
    "name": "Supra Prancha",
    "muscleGroup": "Core",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Supra Prancha.gif",
    "tags": [
      "Isolador",
      "Livre",
      "Peso do Corpo"
    ]
  },
  {
    "id": "ex-b1",
    "name": "Puxada Frente",
    "muscleGroup": "Costas",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Puxada Frente.gif",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-b2",
    "name": "Remada Baixa",
    "muscleGroup": "Costas",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Remada Baixa.gif",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-b3",
    "name": "Puxada Articulada",
    "muscleGroup": "Costas",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Puxada Articulada.gif",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-b4",
    "name": "Elevação Lateral",
    "muscleGroup": "Ombros",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Elevação Lateral.gif",
    "tags": [
      "Isolador",
      "Livre"
    ],
    "porLado": true
  },
  {
    "id": "ex-b5",
    "name": "Banco Flexor",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Banco Flexor.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-b6",
    "name": "Remada Alta",
    "muscleGroup": "Costas",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Remada Alta.gif",
    "tags": [
      "Multiarticular",
      "Livre"
    ]
  },
  {
    "id": "ex-b7",
    "name": "Rosca Scoott",
    "muscleGroup": "Bíceps",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Rosca Scott.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ],
    "porLado": true
  },
  {
    "id": "ex-b8",
    "name": "Infra Paralelo",
    "muscleGroup": "Peito",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Infra Paralelo.gif",
    "tags": [
      "Isolador",
      "Livre",
      "Peso do Corpo"
    ]
  },
  {
    "id": "ex-supra-solo",
    "name": "Supra solo",
    "muscleGroup": "Core",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Supra solo.gif",
    "tags": [
      "Isolador",
      "Livre",
      "Peso do Corpo"
    ]
  },
  {
    "id": "ex-burrinho",
    "name": "Burrinho",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "12",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Burrinho.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-tric-pulley",
    "name": "Tric Pulley + Palmar",
    "muscleGroup": "Tríceps",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Tric Pulley.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-banco-abdutor",
    "name": "Banco Abdutor",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Banco Abdutor.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-agachamento",
    "name": "Agachamento Livre",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 60,
    "imageUrl": "/assets/exerciciosgif/Agachamento.gif",
    "tags": [
      "Multiarticular",
      "Livre"
    ]
  },
  {
    "id": "ex-flexao",
    "name": "Flexão de Braços",
    "muscleGroup": "Peito",
    "sets": 3,
    "reps": "Máx",
    "load": "",
    "rest": 45,
    "imageUrl": "/assets/exerciciosgif/Flexao.gif",
    "tags": [
      "Multiarticular",
      "Peso do Corpo"
    ]
  },
  {
    "id": "ex-panturrilha",
    "name": "Panturrilha em Pé",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Panturrilha.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-gluteo-3a",
    "name": "Glúteo 3 Apoio",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Gluteo 3 Apoios.gif",
    "tags": [
      "Isolador",
      "Peso do Corpo"
    ]
  },
  {
    "id": "ex-abducao-solo",
    "name": "Abdução Solo",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Abducao Solo.gif",
    "tags": [
      "Isolador",
      "Peso do Corpo"
    ]
  },
  {
    "id": "ex-supra-ponte",
    "name": "Supra Solo + Ponte Ventral",
    "muscleGroup": "Core",
    "sets": 3,
    "reps": "15 + 20\"",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Prancha.gif",
    "tags": [
      "Multiarticular",
      "Peso do Corpo"
    ]
  },
  {
    "id": "ex-extensor",
    "name": "Banco Extensor",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Banco Extensor.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-leg-180",
    "name": "Leg Press 180°",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Leg Press 180.gif",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-banco-adutor",
    "name": "Banco Adutor",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Banco Adutor.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-infra-solo",
    "name": "Infra Solo",
    "muscleGroup": "Core",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Infra solo.gif",
    "tags": [
      "Isolador",
      "Peso do Corpo"
    ]
  },
  {
    "id": "ex-elev-frontal",
    "name": "Elevação Frontal",
    "muscleGroup": "Ombros",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Elevação Frontal.webp",
    "tags": [
      "Isolador",
      "Livre"
    ],
    "porLado": true
  },
  {
    "id": "ex-tric-puller",
    "name": "Tríceps Puller",
    "muscleGroup": "Tríceps",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Triceps Puller.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-agach-gaiola",
    "name": "Agachamento Gaiola",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 60,
    "imageUrl": "/assets/exerciciosgif/Agachamento Terra Gaiola.gif",
    "tags": [
      "Multiarticular",
      "Livre"
    ]
  },
  {
    "id": "ex-voo-45",
    "name": "Voo 45°",
    "muscleGroup": "Peito",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Voador 45.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-infra-prancha",
    "name": "Infra Prancha",
    "muscleGroup": "Core",
    "sets": 3,
    "reps": "20",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Infra Prancha.gif",
    "tags": [
      "Isolador",
      "Peso do Corpo"
    ]
  },
  {
    "id": "ex-roscamartelo",
    "name": "Rosca Martelo",
    "muscleGroup": "Bíceps",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Rosca martelo.gif",
    "tags": [
      "Isolador",
      "Livre"
    ]
  },
  {
    "id": "ex-ponteventral",
    "name": "Ponte Ventral",
    "muscleGroup": "Core",
    "sets": 3,
    "reps": "20\"",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Ponte ventral.gif",
    "tags": [
      "Isolador",
      "Peso do Corpo"
    ]
  },
  {
    "id": "ex-remad-artic",
    "name": "Remada Articulada",
    "muscleGroup": "Costas",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Remada articulada.gif",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-leg-45",
    "name": "Leg 45°",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/LEG 45.gif",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-roscamartelo-90",
    "name": "Rosca 90°",
    "muscleGroup": "Bíceps",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Rosca 90.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-hack",
    "name": "HACK",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/HACK.webp",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-rosca-direta-barra-livre",
    "name": "Rosca Direta Barra Livre",
    "muscleGroup": "Bíceps",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Rosca Direta Barra.gif",
    "tags": [
      "Isolador",
      "Livre"
    ]
  },
  {
    "id": "ex-rosca-direta-cross",
    "name": "Rosca Direta Cross",
    "muscleGroup": "Bíceps",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Rosca Direta Cross.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-remada-cavalinho",
    "name": "Remada Cavalinho Máquina",
    "muscleGroup": "Costas",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Remada Cavalinho.gif",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-mesa-flexora",
    "name": "Mesa Flexora",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Mesa Flexora.webp",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-panturrilha-livre",
    "name": "Panturrilha Livre",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Panturrilha Livre.gif",
    "tags": [
      "Isolador",
      "Livre"
    ]
  },
  {
    "id": "ex-flexao-quadril",
    "name": "Flexão de Quadril",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Flexão de quadril.gif",
    "tags": [
      "Isolador",
      "Peso do Corpo"
    ]
  },
  {
    "id": "ex-triceps-corda",
    "name": "Trícepes Corda",
    "muscleGroup": "Tríceps",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Tricepes Corda.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-supino-reto",
    "name": "Supino Reto",
    "muscleGroup": "Peito",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Supino Reto.gif",
    "tags": [
      "Multiarticular",
      "Livre"
    ]
  },
  {
    "id": "ex-desenvolvimento-ombro-halter",
    "name": "Desenvolvimento Ombro com Halter",
    "muscleGroup": "Ombros",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Desenvolvimento Ombro com Halter.gif",
    "tags": [
      "Multiarticular",
      "Livre"
    ]
  },
  {
    "id": "ex-supra-banco",
    "name": "Supra Banco",
    "muscleGroup": "Core",
    "sets": 3,
    "reps": "20",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Supra Banco.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-supino-reto-halteres",
    "name": "Supino Reto com Halteres",
    "muscleGroup": "Peito",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/supino-reto-com-halteres.gif",
    "tags": [
      "Multiarticular",
      "Livre"
    ]
  },
  {
    "id": "ex-agach-guiado",
    "name": "Agachamento Guiado",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Agachamento guiado.gif",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-desenvolvimento-frente",
    "name": "Desenvolvimento Frontal",
    "muscleGroup": "Ombros",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Desenvolvimento Frontal.gif",
    "tags": [
      "Multiarticular",
      "Livre"
    ]
  },
  {
    "id": "ex-triceps-palmar",
    "name": "Triceps Palmar",
    "muscleGroup": "Tríceps",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Triceps Palmar.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-puxada-supinada",
    "name": "Puxada Supinada",
    "muscleGroup": "Costas",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Puxada Supinada.gif",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-fly-inverso",
    "name": "Fly Inverso",
    "muscleGroup": "Costas",
    "sets": 3,
    "reps": "10",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Fly Inverso.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-panturrilha-leg-45",
    "name": "Panturrilha Leg 45°",
    "muscleGroup": "Pernas",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/PANTURRILHA LEG 45°.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-elevacao-joelho",
    "name": "Elevação de Joelho",
    "muscleGroup": "Core",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/ELEVACÃO DE JOELHO.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-supino-45",
    "name": "Supino 45°",
    "muscleGroup": "Peito",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/SUPINO 45°.gif",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-triceps-testa-barra-h",
    "name": "Triceps Testa Barra H",
    "muscleGroup": "Tríceps",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/TRICEPS TESTA BARRA H.gif",
    "tags": [
      "Isolador",
      "Livre"
    ]
  },
  {
    "id": "ex-desenvolvimento-barra",
    "name": "Desenvolvimento Barra",
    "muscleGroup": "Ombros",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/DESENVOLVIMENTO BARRA.gif",
    "tags": [
      "Multiarticular",
      "Livre"
    ]
  },
  {
    "id": "ex-remada-unilateral",
    "name": "Remada Unilateral",
    "muscleGroup": "Costas",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/REMADA UNILATERAL.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  },
  {
    "id": "ex-pull-down",
    "name": "Pull Down",
    "muscleGroup": "Costas",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/PULL DOWN.gif",
    "tags": [
      "Multiarticular",
      "Máquina"
    ]
  },
  {
    "id": "ex-roscott-unilateral",
    "name": "Rosca Scott Unilateral",
    "muscleGroup": "Bíceps",
    "sets": 3,
    "reps": "15",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/ROSCA SCOTT UNILATERAL.gif",
    "tags": [
      "Isolador",
      "Livre"
    ]
  },
  {
    "id": "ex-extensao-lombar",
    "name": "Extensão Lombar",
    "muscleGroup": "Core",
    "sets": 3,
    "reps": "20",
    "load": "",
    "rest": 30,
    "imageUrl": "/assets/exerciciosgif/Extensão Lombar.gif",
    "tags": [
      "Isolador",
      "Máquina"
    ]
  }
];

export const DEFAULT_SHEETS: WorkoutSheet[] = [
  {
    "id": "sheet-a",
    "userId": LOCAL_USER_ID,
    "sheetKey": "A",
    "exerciseIds": [
      "ex-a1",
      "ex-a2",
      "ex-a5",
      "ex-a6",
      "ex-a8"
    ],
    "aerobic": null,
    "isArchived": false,
    "updatedAt": new Date().toISOString()
  },
  {
    "id": "sheet-b",
    "userId": LOCAL_USER_ID,
    "sheetKey": "B",
    "exerciseIds": [
      "ex-b1",
      "ex-b2",
      "ex-b5",
      "ex-b4",
      "ex-b7"
    ],
    "aerobic": null,
    "isArchived": false,
    "updatedAt": new Date().toISOString()
  },
  {
    "id": "sheet-c",
    "userId": LOCAL_USER_ID,
    "sheetKey": "C",
    "exerciseIds": [],
    "aerobic": null,
    "isArchived": false,
    "updatedAt": new Date().toISOString()
  },
  {
    "id": "sheet-d",
    "userId": LOCAL_USER_ID,
    "sheetKey": "D",
    "exerciseIds": [],
    "aerobic": null,
    "isArchived": false,
    "updatedAt": new Date().toISOString()
  },
  {
    "id": "sheet-e",
    "userId": LOCAL_USER_ID,
    "sheetKey": "E",
    "exerciseIds": [],
    "aerobic": null,
    "isArchived": false,
    "updatedAt": new Date().toISOString()
  },
  {
    "id": "sheet-f",
    "userId": LOCAL_USER_ID,
    "sheetKey": "F",
    "exerciseIds": [],
    "aerobic": null,
    "isArchived": false,
    "updatedAt": new Date().toISOString()
  },
  {
    "id": "sheet-g",
    "userId": LOCAL_USER_ID,
    "sheetKey": "G",
    "exerciseIds": [],
    "aerobic": null,
    "isArchived": false,
    "updatedAt": new Date().toISOString()
  },
  {
    "id": "sheet-h",
    "userId": LOCAL_USER_ID,
    "sheetKey": "H",
    "exerciseIds": [],
    "aerobic": null,
    "isArchived": false,
    "updatedAt": new Date().toISOString()
  },
  {
    "id": "sheet-i",
    "userId": LOCAL_USER_ID,
    "sheetKey": "I",
    "exerciseIds": [],
    "aerobic": null,
    "isArchived": false,
    "updatedAt": new Date().toISOString()
  },
  {
    "id": "sheet-j",
    "userId": LOCAL_USER_ID,
    "sheetKey": "J",
    "exerciseIds": [],
    "aerobic": null,
    "isArchived": false,
    "updatedAt": new Date().toISOString()
  }
];
