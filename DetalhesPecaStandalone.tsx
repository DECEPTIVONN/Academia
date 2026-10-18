import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    X,
    Palette,
    Coins,
    Award,
    Trophy,
    Crown,
    Sparkles,
    Lock,
    Layers,
    Zap,
    Shield,
    ChevronRight,
    ChevronLeft,
    Smartphone,
    Monitor,
    RotateCcw,
    Check,
    Flame,
    Dumbbell,
    Sliders,
    Info
} from 'lucide-react';

// ============================================================================
// 1. TIPOS & MODELOS DE DADOS (STANDALONE)
// ============================================================================

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L' | 'X';

export interface PieceExercise {
    id: TetrominoType;
    nome: string;
    rarity: 'Comum' | 'Raro' | 'Epico' | 'Lendario';
    blocos: number;
    anotacoes: string;
}

export interface PieceDetailsData {
    type: string;
    description: string;
    lore: string;
    fact: string;
    stats: { label: string; value: number; max: number; desc: string; icon: string }[];
    scenarios: {
        favorable: {
            title: string;
            desc: string;
            grid: number[][];
        };
        unfavorable: {
            title: string;
            desc: string;
            grid: number[][];
        };
    };
}

// ============================================================================
// 2. SISTEMA DE ÁUDIO WEB AUDIO API STANDALONE (ZERO ARQUIVOS EXTERNOS)
// ============================================================================

class DetalhesSoundEffects {
    private ctx: AudioContext | null = null;

    private initCtx() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
        }
    }

    playMove() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.05);
        } catch { }
    }

    playHold() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
        } catch { }
    }

    playLevelUp() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            [440, 554.37, 659.25, 880].forEach((freq, idx) => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                gain.gain.setValueAtTime(0.18, now + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.28);
            });
        } catch { }
    }
}

const sfx = new DetalhesSoundEffects();

// ============================================================================
// 3. BASE DE CONHECIMENTO COMPLETA DE TODAS AS 8 PEÇAS
// ============================================================================

export const TETRA_PIECES: Record<TetrominoType, { matrix: number[][]; color: string }> = {
    I: { matrix: [[1, 1, 1, 1]], color: '#22d3ee' },
    O: { matrix: [[1, 1], [1, 1]], color: '#fbbf24' },
    T: { matrix: [[0, 1, 0], [1, 1, 1]], color: '#c084fc' },
    S: { matrix: [[0, 1, 1], [1, 1, 0]], color: '#4ade80' },
    Z: { matrix: [[1, 1, 0], [0, 1, 1]], color: '#f87171' },
    J: { matrix: [[1, 0, 0], [1, 1, 1]], color: '#60a5fa' },
    L: { matrix: [[0, 0, 1], [1, 1, 1]], color: '#fb923c' },
    X: { matrix: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], color: '#f43f5e' }
};

export const PIECES_CATALOG: PieceExercise[] = [
    { id: 'I', nome: 'Peça I (Tetraminó)', rarity: 'Lendario', blocos: 4, anotacoes: 'Perfeita para pontuação máxima limpando 4 linhas de uma só vez!' },
    { id: 'O', nome: 'Peça O (Tetraminó)', rarity: 'Comum', blocos: 4, anotacoes: 'Fácil estabilidade, excelente para preencher grandes vãos.' },
    { id: 'T', nome: 'Peça T (Tetraminó)', rarity: 'Raro', blocos: 4, anotacoes: 'Ideal para táticas complexas de T-Spin nos cantos fechados.' },
    { id: 'S', nome: 'Peça S (Tetraminó)', rarity: 'Comum', blocos: 4, anotacoes: 'Curva para a direita, requer cuidado no posicionamento.' },
    { id: 'Z', nome: 'Peça Z (Tetraminó)', rarity: 'Comum', blocos: 4, anotacoes: 'Curva para a esquerda, excelente para encaixes dinâmicos.' },
    { id: 'J', nome: 'Peça J (Tetraminó)', rarity: 'Raro', blocos: 4, anotacoes: 'Excelente para limpar a lateral esquerda da arena.' },
    { id: 'L', nome: 'Peça L (Tetraminó)', rarity: 'Raro', blocos: 4, anotacoes: 'Ideal para limpar e preencher a lateral direita.' },
    { id: 'X', nome: 'Peça X (Mística)', rarity: 'Lendario', blocos: 5, anotacoes: 'Peça secreta em cruz com poder supremo de desintegração!' }
];

export const DETAILS_DATA: Record<TetrominoType, PieceDetailsData> = {
    I: {
        type: 'Ataque & Finalizadora',
        description: 'A peça mais cobiçada para pontuação máxima. Consegue limpar até 4 linhas de uma vez!',
        lore: 'Forjada em cristais ciano ultra-puros nos confins da Arena de Blocos, a lenda diz que ela aguarda pacientemente até que o grid clame por sua salvação de 4 linhas simultâneas.',
        fact: 'Limpar 4 linhas de uma vez com ela é chamado de "TETRIS" e envia a quantidade máxima de lixo para o adversário!',
        stats: [
            { label: 'Poder de Limpeza', value: 100, max: 100, desc: 'Capacidade máxima de eliminar linhas em massa.', icon: '⚡' },
            { label: 'Flexibilidade SRS', value: 65, max: 100, desc: 'Dificuldade de rotacionar em espaços apertados.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 90, max: 100, desc: 'Multiplica a pontuação de combos em sequência.', icon: '🔥' },
            { label: 'Controle de Lixo', value: 95, max: 100, desc: 'Excelente para limpar lixo enviado pelo adversário.', icon: '🛡️' }
        ],
        scenarios: {
            favorable: {
                title: 'Cenário Ideal 🟢',
                desc: 'Encaixe vertical direto em um poço de largura 1 para limpar 4 linhas simultaneamente e ganhar bônus máximo.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [1, 1, 1, 1, 1, 1, 1, 1, 2]
                ]
            },
            unfavorable: {
                title: 'Cenário de Risco 🔴',
                desc: 'Colocar a peça horizontalmente sobre pilhas irregulares cria túneis profundos impossíveis de preencher.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 2, 2, 2, 2, 0, 0, 0],
                    [0, 1, 0, 1, 0, 1, 0, 1, 0],
                    [1, 1, 0, 1, 1, 1, 0, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            }
        }
    },
    O: {
        type: 'Defesa & Estabilidade',
        description: 'Quadrada, sólida e inabalável. Não rotaciona, facilitando o encaixe plano e seguro.',
        lore: 'Nascida como um bloco de concreto magnético na fundição real, a Peça O ignora solenemente comandos de rotação, preferindo a pura estabilidade horizontal.',
        fact: 'Ela é a única peça do jogo que possui 100% de simetria rotacional, o que significa que rotacioná-la não altera seu formato.',
        stats: [
            { label: 'Poder de Limpeza', value: 40, max: 100, desc: 'Baixo impacto em limpezas individuais de linha.', icon: '⚡' },
            { label: 'Flexibilidade SRS', value: 10, max: 100, desc: 'Praticamente nula pois não rotaciona.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 50, max: 100, desc: 'Estável, mas sem grandes multiplicadores.', icon: '🔥' },
            { label: 'Controle de Lixo', value: 85, max: 100, desc: 'Excelente para tapar grandes buracos abertos.', icon: '🛡️' }
        ],
        scenarios: {
            favorable: {
                title: 'Cenário Ideal 🟢',
                desc: 'Nivela superfícies planas ou preenche depressões quadradas de tamanho 2x2 de forma extremamente limpa.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [1, 1, 1, 2, 2, 1, 1, 1, 1],
                    [1, 1, 1, 2, 2, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            },
            unfavorable: {
                title: 'Cenário de Risco 🔴',
                desc: 'Se colocada sobre uma coluna pontiaguda de 1 bloco de largura, ela cobrirá buracos vazios em ambos os lados.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 2, 2, 0, 0, 0, 0],
                    [0, 0, 0, 2, 2, 0, 0, 0, 0],
                    [0, 0, 0, 1, 1, 0, 0, 0, 0],
                    [1, 1, 1, 0, 0, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            }
        }
    },
    T: {
        type: 'Especial & Giro Tático',
        description: 'A rainha dos giros táticos (T-Spin). Consegue encaixar em fendas fechadas e conceder bônus incríveis.',
        lore: 'Considerada a peça favorita dos mestres profissionais da Arena. Sua forma trifacetada permite que ela contorne as leis da física por meio do sistema SRS.',
        fact: 'Realizar um "T-Spin Double" limpa apenas duas linhas, mas envia a mesma quantidade de lixo de um Tetris de 4 linhas!',
        stats: [
            { label: 'Poder de Limpeza', value: 85, max: 100, desc: 'Poderoso bônus ao usar técnicas de T-Spin.', icon: '⚡' },
            { label: 'Flexibilidade SRS', value: 100, max: 100, desc: 'Capacidade máxima de realizar giros especiais.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 95, max: 100, desc: 'Bônus incríveis de pontuação tática.', icon: '🔥' },
            { label: 'Controle de Lixo', value: 70, max: 100, desc: 'Requer setups específicos de grid.', icon: '🛡️' }
        ],
        scenarios: {
            favorable: {
                title: 'Cenário Ideal 🟢',
                desc: 'Ao entrar em uma fenda com cobertura e girar no último segundo, realiza um T-Spin e ganha bônus massivo.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [1, 1, 1, 1, 0, 1, 1, 1, 1],
                    [1, 1, 1, 2, 2, 2, 1, 1, 1],
                    [1, 1, 1, 1, 2, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            },
            unfavorable: {
                title: 'Cenário de Risco 🔴',
                desc: 'Jogar a Peça T em uma superfície totalmente plana deixará cantos "ocos" que dificultam os próximos encaixes.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 2, 0, 0, 0, 0],
                    [0, 0, 0, 2, 2, 2, 0, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            }
        }
    },
    S: {
        type: 'Suporte & Encaixe Direito',
        description: 'Peça curva inclinada para a direita. Ótima para transições suaves de altura e escadarias.',
        lore: 'Uma engrenagem viva que se esgueira pela grama da Arena. Ela prefere encostas e ladeiras que se erguem em direção ao céu do lado direito.',
        fact: 'Muitos jogadores iniciantes travam o jogo por acumular Peças S e Z incorretamente, criando lacunas vazias irreparáveis.',
        stats: [
            { label: 'Poder de Limpeza', value: 50, max: 100, desc: 'Média capacidade de limpeza.', icon: '⚡' },
            { label: 'Flexibilidade SRS', value: 60, max: 100, desc: 'Pode realizar alguns giros sutis na parede.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 60, max: 100, desc: 'Bom suporte para manter combos ativos.', icon: '🔥' },
            { label: 'Controle de Lixo', value: 75, max: 100, desc: 'Útil para ajustar superfícies desniveladas.', icon: '🛡️' }
        ],
        scenarios: {
            favorable: {
                title: 'Cenário Ideal 🟢',
                desc: 'Adapta-se perfeitamente a superfícies em formato de degrau que sobem para o lado direito do tabuleiro.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 2, 2, 1, 1, 1],
                    [0, 0, 0, 2, 2, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            },
            unfavorable: {
                title: 'Cenário de Risco 🔴',
                desc: 'Colocar a peça sobre uma vala plana ou um poço vertical direto de largura 1 bloqueia a entrada e gera lixo.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 2, 2, 0, 0, 0, 0, 0],
                    [0, 2, 2, 0, 0, 0, 0, 0, 0],
                    [1, 1, 0, 1, 1, 1, 1, 1, 1],
                    [1, 1, 0, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            }
        }
    },
    Z: {
        type: 'Suporte & Encaixe Esquerdo',
        description: 'Peça curva inclinada para a esquerda. Ideal para superfícies que sobem para o lado esquerdo.',
        lore: 'O reflexo incandescente e rebelde de sua irmã S. Vestida em vermelho escarlate, ela exige raciocínio rápido para não criar vazios insolúveis.',
        fact: 'No jargão profissional de Tetris, as peças S e Z são chamadas de "cobrinhas" e são as que mais punem hesitações.',
        stats: [
            { label: 'Poder de Limpeza', value: 50, max: 100, desc: 'Média capacidade de limpeza.', icon: '⚡' },
            { label: 'Flexibilidade SRS', value: 60, max: 100, desc: 'Pode realizar alguns giros sutis na parede.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 60, max: 100, desc: 'Bom suporte para manter combos ativos.', icon: '🔥' },
            { label: 'Controle de Lixo', value: 75, max: 100, desc: 'Ajusta desnivelamentos de inclinação esquerda.', icon: '🛡️' }
        ],
        scenarios: {
            favorable: {
                title: 'Cenário Ideal 🟢',
                desc: 'Encaixa perfeitamente em superfícies de degrau que sobem em direção ao lado esquerdo do tabuleiro.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [1, 1, 1, 2, 2, 0, 0, 0, 0],
                    [1, 1, 1, 1, 2, 2, 0, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            },
            unfavorable: {
                title: 'Cenário de Risco 🔴',
                desc: 'Soltá-la horizontalmente sobre uma coluna plana de 2 blocos criará lacunas vazias na parte inferior lateral.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 2, 2, 0, 0, 0, 0],
                    [0, 0, 0, 0, 2, 2, 0, 0, 0],
                    [0, 0, 1, 1, 1, 0, 0, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            }
        }
    },
    J: {
        type: 'Versatilidade & Gancho',
        description: 'Excelente para limpar cantos e bordas esquerdas, contornando blocos desalinhados.',
        lore: 'Sua forma de gancho esquerdo permite que ela se agarre à parede esquerda da Arena, trazendo ordem de volta a tabuleiros caóticos.',
        fact: 'Ela forma um par simétrico com a Peça L. Juntas, elas são as mais flexíveis para preencher laterais.',
        stats: [
            { label: 'Poder de Limpeza', value: 75, max: 100, desc: 'Excelente capacidade de realizar limpezas duplas ou triplas.', icon: '⚡' },
            { label: 'Flexibilidade SRS', value: 80, max: 100, desc: 'Alta versatilidade e facilidade de rotação.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 75, max: 100, desc: 'Excelente para prolongar sequências de pontos.', icon: '🔥' },
            { label: 'Controle de Lixo', value: 80, max: 100, desc: 'Ótima para alcançar fendas de parede esquerda.', icon: '🛡️' }
        ],
        scenarios: {
            favorable: {
                title: 'Cenário Ideal 🟢',
                desc: 'Com o gancho posicionado rente à borda esquerda, preenche as colunas vazias sem obstruir o centro.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [2, 0, 0, 0, 0, 0, 0, 0, 0],
                    [2, 2, 2, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            },
            unfavorable: {
                title: 'Cenário de Risco 🔴',
                desc: 'Se rotacionada incorretamente na lateral direita, ela cria um "overhang" que impede a descida de peças futuras.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 2, 2, 2],
                    [0, 0, 0, 0, 0, 0, 0, 0, 2],
                    [1, 1, 1, 1, 1, 1, 1, 0, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            }
        }
    },
    L: {
        type: 'Versatilidade & Gancho',
        description: 'Excelente para limpar cantos e bordas direitas, contornando blocos desalinhados.',
        lore: 'O braço direito da simetria na Arena. Seu gancho voltado para a direita é perfeito para manter as colunas laterais niveladas e estáveis.',
        fact: 'Conhecida como "L-Orange", ela é vital para preencher o canto direito enquanto os jogadores criam um poço de Tetris na esquerda.',
        stats: [
            { label: 'Poder de Limpeza', value: 75, max: 100, desc: 'Excelente capacidade de realizar limpezas duplas ou triplas.', icon: '⚡' },
            { label: 'Flexibilidade SRS', value: 80, max: 100, desc: 'Alta versatilidade e facilidade de rotação.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 75, max: 100, desc: 'Excelente para prolongar sequências de pontos.', icon: '🔥' },
            { label: 'Controle de Lixo', value: 80, max: 100, desc: 'Excelente para resgates rápidos de canto direito.', icon: '🛡️' }
        ],
        scenarios: {
            favorable: {
                title: 'Cenário Ideal 🟢',
                desc: 'Encaixa o gancho perfeitamente no canto inferior direito, completando e limpando até 2 linhas de uma vez.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 2],
                    [1, 1, 1, 1, 1, 1, 2, 2, 2],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            },
            unfavorable: {
                title: 'Cenário de Risco 🔴',
                desc: 'Usá-la de cabeça para baixo no meio do grid sem suporte sólido cria um enorme túnel oco de 2 de largura.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 2, 2, 2, 0, 0, 0],
                    [0, 0, 0, 2, 0, 0, 0, 0, 0],
                    [1, 1, 0, 0, 0, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            }
        }
    },
    X: {
        type: 'Destruição & Feitiço',
        description: 'Uma peça mística em formato de cruz. Detona blocos adjacentes ao ser colocada.',
        lore: 'Uma peça lendária proibida em torneios tradicionais por seu imenso poder destrutivo. Capaz de obliterar lixo em segundos.',
        fact: 'Ela não limpa linhas por preenchimento tradicional; sua colocação aciona um feitiço de desintegração de blocos!',
        stats: [
            { label: 'Poder de Limpeza', value: 95, max: 100, desc: 'Eliminação imediata de blocos em formato de cruz.', icon: '⚡' },
            { label: 'Flexibilidade SRS', value: 50, max: 100, desc: 'Não precisa de muito giro devido ao seu formato simétrico.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 70, max: 100, desc: 'Auxilia na manutenção de sequências de combos desesperadas.', icon: '🔥' },
            { label: 'Controle de Lixo', value: 100, max: 100, desc: 'A melhor peça para sair de situações de morte iminente.', icon: '🛡️' }
        ],
        scenarios: {
            favorable: {
                title: 'Cenário Ideal 🟢',
                desc: 'Coloque a Peça X no centro de uma parede caótica de lixo para detonar múltiplos blocos cinzas e reabrir o tabuleiro.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [1, 1, 1, 0, 2, 0, 1, 1, 1],
                    [1, 1, 1, 2, 2, 2, 1, 1, 1],
                    [1, 1, 1, 0, 2, 0, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            },
            unfavorable: {
                title: 'Cenário de Risco 🔴',
                desc: 'Usar a peça quando o tabuleiro está quase limpo destrói suas próprias fileiras perfeitamente construídas para combo.',
                grid: [
                    [0, 0, 0, 0, 2, 0, 0, 0, 0],
                    [0, 0, 0, 2, 2, 2, 0, 0, 0],
                    [0, 0, 0, 0, 2, 0, 0, 0, 0],
                    [2, 2, 2, 2, 2, 2, 2, 2, 2],
                    [2, 2, 2, 2, 2, 2, 2, 2, 2],
                    [2, 2, 2, 2, 2, 2, 2, 2, 2],
                    [2, 2, 2, 2, 2, 2, 2, 2, 2]
                ]
            }
        }
    }
};

// ============================================================================
// 4. COMPONENTE MODAL DE DETALHES DA PEÇA
// ============================================================================

export interface DetalhesPecaModalProps {
    exercise: PieceExercise;
    cardLevel?: number;
    playerGold?: number;
    onUpgrade?: (newLevel: number, goldSpent: number) => void;
    onClose?: () => void;
}

export function DetalhesPecaModal({
    exercise,
    cardLevel = 7,
    playerGold = 50739,
    onUpgrade,
    onClose
}: DetalhesPecaModalProps) {
    const [detailSlide, setDetailSlide] = useState<number>(0);
    const [slideDirection, setSlideDirection] = useState<number>(0);
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

    // Card Level & Gold state
    const [currentLevel, setCurrentLevel] = useState<number>(cardLevel);
    const [gold, setGold] = useState<number>(playerGold);

    // Piece skins state
    const [isSkinSelectorOpen, setIsSkinSelectorOpen] = useState<boolean>(false);
    const [currentSkin, setCurrentSkin] = useState<string>('neon');

    // Mastery Modal state
    const [isMasteryOpen, setIsMasteryOpen] = useState<boolean>(false);
    const [masteryStars, setMasteryStars] = useState<number>(2);

    // Replay Phase Simulation State
    const [replayPhase, setReplayPhase] = useState<'fav_spawn' | 'fav_fall' | 'fav_landed' | 'unfav_spawn' | 'unfav_fall' | 'unfav_landed'>('fav_spawn');

    const details = DETAILS_DATA[exercise.id] || DETAILS_DATA['I'];
    const pieceColor = TETRA_PIECES[exercise.id]?.color || '#c084fc';

    // Skin color overrides
    let activeBlockColor = pieceColor;
    if (currentSkin === 'gameboy') activeBlockColor = 'rgb(34, 197, 94)';
    else if (currentSkin === 'lava') activeBlockColor = 'rgb(239, 68, 68)';
    else if (currentSkin === 'holographic') activeBlockColor = 'rgb(6, 182, 212)';

    // Slide navigation
    const changeSlide = (newSlide: number) => {
        sfx.playMove();
        setSlideDirection(newSlide > detailSlide ? 1 : -1);
        setDetailSlide(newSlide);
    };

    // Touch Swipe handlers for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart) return;
        const diffX = touchStart.x - e.changedTouches[0].clientX;
        const diffY = touchStart.y - e.changedTouches[0].clientY;
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
            if (diffX > 0 && detailSlide < 2) {
                changeSlide(detailSlide + 1);
            } else if (diffX < 0 && detailSlide > 0) {
                changeSlide(detailSlide - 1);
            }
        }
        setTouchStart(null);
    };

    // Replay Loop Animation
    useEffect(() => {
        if (detailSlide !== 0) return;
        let timer: NodeJS.Timeout;

        const runReplayLoop = () => {
            setReplayPhase('fav_spawn');
            timer = setTimeout(() => {
                setReplayPhase('fav_fall');
                timer = setTimeout(() => {
                    setReplayPhase('fav_landed');
                    timer = setTimeout(() => {
                        setReplayPhase('unfav_spawn');
                        timer = setTimeout(() => {
                            setReplayPhase('unfav_fall');
                            timer = setTimeout(() => {
                                setReplayPhase('unfav_landed');
                                timer = setTimeout(runReplayLoop, 2200);
                            }, 600);
                        }, 800);
                    }, 2000);
                }, 600);
            }, 800);
        };

        runReplayLoop();
        return () => clearTimeout(timer);
    }, [detailSlide]);

    // Upgrade calculation
    const upgradeCost = Math.round(50 * Math.pow(1.5, currentLevel));
    const canUpgrade = gold >= upgradeCost;

    const handleUpgradeCard = () => {
        if (!canUpgrade) {
            sfx.playHold();
            return;
        }
        sfx.playLevelUp();
        setGold(prev => prev - upgradeCost);
        setCurrentLevel(prev => prev + 1);
        if (onUpgrade) onUpgrade(currentLevel + 1, upgradeCost);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md select-none">
            <div className="absolute inset-0" onClick={onClose} />

            {/* Main Dialog Box */}
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="relative max-w-[420px] w-full bg-gradient-to-b from-[#1a1136] via-[#100a26] to-[#080514] border-2 border-[#a855f7]/60 rounded-[2.2rem] p-5 pt-12 shadow-[0_0_40px_rgba(168,85,247,0.3)] flex flex-col justify-between overflow-visible"
                onClick={e => e.stopPropagation()}
            >
                {/* Floating 3D Tetromino Pop-out Header */}
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-28 rounded-3xl bg-[#140a24] border-2 border-[#a855f7] shadow-[0_0_30px_rgba(168,85,247,0.5)] flex items-center justify-center z-50 transform hover:scale-105 hover:rotate-3 transition-transform duration-300">
                    <div className="flex flex-col gap-1 items-center justify-center">
                        {TETRA_PIECES[exercise.id].matrix.map((row, rIdx) => (
                            <div key={rIdx} className="flex gap-1">
                                {row.map((cell, cIdx) => (
                                    <div
                                        key={cIdx}
                                        className="w-5 h-5 rounded-md"
                                        style={{
                                            backgroundColor: cell === 1 ? activeBlockColor : 'transparent',
                                            opacity: cell === 1 ? 1 : 0,
                                            boxShadow: cell === 1 ? `0 0 12px ${activeBlockColor}, inset 0 0 4px rgba(255, 255, 255, 0.6)` : 'none',
                                            border: cell === 1 ? '1.5px solid rgba(255, 255, 255, 0.4)' : 'none'
                                        }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Close Button at top-right */}
                {onClose && (
                    <button
                        onClick={() => {
                            sfx.playHold();
                            onClose();
                        }}
                        className="absolute top-4 right-4 w-7 h-7 bg-black/40 hover:bg-black/60 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer z-50 active:scale-90"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                {/* Title & Level Info */}
                <div className="text-center mt-3">
                    <h3 className="text-[17px] font-black uppercase tracking-widest text-white mt-1 drop-shadow-md">
                        {exercise.nome}
                    </h3>
                    <p className="text-[10px] font-mono font-bold text-violet-400 tracking-wider">
                        NÍVEL {currentLevel}
                    </p>
                </div>

                {/* Rarity & Type Pills + Mastery Button */}
                <div className="flex items-stretch justify-between w-full mt-4 gap-3 px-1">
                    {/* RARIDADE Pill */}
                    <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-[#50358c]/45 shadow-[0_4px_10px_rgba(0,0,0,0.5)] h-12 bg-[#140e2a] select-none">
                        <div className="h-[16px] bg-gradient-to-r from-fuchsia-500/70 to-purple-500/70 flex items-center justify-center px-1">
                            <span className="text-[7.5px] font-black text-white/90 uppercase tracking-widest leading-none">
                                RARIDADE
                            </span>
                        </div>
                        <div className="flex-1 flex items-center justify-center bg-[#0d0722] px-1">
                            <span className="text-[10.5px] font-black text-white uppercase tracking-wide leading-none">
                                {exercise.rarity === 'Epico' ? 'Épica' : exercise.rarity === 'Lendario' ? 'Lendária' : exercise.rarity === 'Comum' ? 'Comum' : 'Rara'}
                            </span>
                        </div>
                    </div>

                    {/* TIPO Pill */}
                    <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-[#50358c]/45 shadow-[0_4px_10px_rgba(0,0,0,0.5)] h-12 bg-[#140e2a] select-none">
                        <div className="h-[16px] bg-gradient-to-r from-fuchsia-500/70 to-purple-500/70 flex items-center justify-center px-1">
                            <span className="text-[7.5px] font-black text-white/90 uppercase tracking-widest leading-none">
                                TIPO
                            </span>
                        </div>
                        <div className="flex-1 flex items-center justify-center bg-[#0d0722] px-1">
                            <span className="text-[10.5px] font-black text-white uppercase tracking-wide leading-none truncate max-w-[105px] px-1" title={details.type}>
                                {details.type.includes('&') ? details.type.split('&')[0].trim() : details.type}
                            </span>
                        </div>
                    </div>

                    {/* MAESTRIA Square Icon Button */}
                    <div
                        onClick={() => {
                            sfx.playHold();
                            setIsMasteryOpen(true);
                        }}
                        className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#251749] to-[#0a0518] border-2 border-amber-500/80 p-0.5 shadow-[0_4px_12px_rgba(245,158,11,0.25),_inset_0_1px_3px_rgba(255,255,255,0.15)] flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0 relative group"
                        title={`Maestria: Nível ${masteryStars}`}
                    >
                        <Award className="w-7 h-7 text-amber-400 fill-amber-500/10 drop-shadow-[0_2px_6px_rgba(245,158,11,0.35)]" />

                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-[#0d0920] border-2 border-yellow-500/80 px-2 py-1.5 rounded-lg shadow-2xl text-center min-w-[95px] pointer-events-none z-50">
                            <span className="text-[7.5px] font-black text-yellow-400 uppercase tracking-wider">Maestria</span>
                            <div className="flex gap-0.5 my-0.5">
                                {[1, 2, 3].map(star => (
                                    <span key={star} className={`text-[8px] leading-none ${star <= masteryStars ? 'text-[#ffb703]' : 'text-slate-600'}`}>
                                        ★
                                    </span>
                                ))}
                            </div>
                            <span className="text-[6px] font-mono font-bold text-slate-300">Nível {masteryStars}</span>
                        </div>
                    </div>
                </div>

                {/* ==================================================================== */}
                {/* CAROUSEL BODY CONTAINER (3 SLIDES) */}
                {/* ==================================================================== */}
                <div className="bg-[#05030e]/95 border border-indigo-950/60 rounded-2.5xl p-3.5 min-h-[305px] flex flex-col justify-between mt-3.5 relative overflow-hidden">
                    <AnimatePresence mode="wait" custom={slideDirection}>
                        <motion.div
                            key={detailSlide}
                            custom={slideDirection}
                            variants={{
                                enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
                                center: { x: 0, opacity: 1 },
                                exit: (dir: number) => ({ x: dir < 0 ? 100 : -100, opacity: 0 })
                            }}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ x: { type: 'spring', stiffness: 350, damping: 30 }, opacity: { duration: 0.15 } }}
                            className="flex-1 flex flex-col justify-between w-full h-full"
                        >
                            {/* SLIDE 0: GAMEPLAY ARENA REPLAY SIMULATION */}
                            {detailSlide === 0 && (
                                <div className="flex-1 flex flex-col justify-center items-center">
                                    {(() => {
                                        const isFavorable = replayPhase.startsWith('fav');
                                        const isSpawning = replayPhase.endsWith('spawn');
                                        const scenario = isFavorable ? details.scenarios.favorable : details.scenarios.unfavorable;

                                        const originalGrid = scenario.grid;
                                        const paddedColsGrid = originalGrid.map(row => [0, 0, ...row, 0, 0]);
                                        const newRow = Array(13).fill(0);
                                        const grid = [[...newRow], [...newRow], ...paddedColsGrid];

                                        let minR = 0;
                                        for (let r = 0; r < grid.length; r++) {
                                            if (grid[r].includes(2)) {
                                                minR = r;
                                                break;
                                            }
                                        }

                                        return (
                                            <div
                                                className={`w-full flex-1 flex flex-col items-center justify-center rounded-2xl border-2 p-2.5 transition-all duration-500 ${isFavorable
                                                        ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)] bg-[#070b08]/90'
                                                        : 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)] bg-[#0d0707]/90'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center w-full mb-1.5 px-1">
                                                    <span className={`text-[8.5px] font-black uppercase tracking-widest ${isFavorable ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {scenario.title}
                                                    </span>
                                                    <span className="text-[7.5px] text-slate-400 font-medium">
                                                        {isFavorable ? 'Sucesso absoluto' : 'Risco de obstrução'}
                                                    </span>
                                                </div>

                                                {/* Simulated Arena Grid (13 cols x 9 rows) */}
                                                <div
                                                    className="grid gap-[3px] p-2 rounded-2xl bg-[#04020a] border border-indigo-950/60 shadow-inner flex items-center justify-center shrink-0"
                                                    style={{
                                                        gridTemplateColumns: 'repeat(13, 20px)',
                                                        gridTemplateRows: 'repeat(9, 20px)'
                                                    }}
                                                >
                                                    {grid.map((row, rIdx) =>
                                                        row.map((cell, cIdx) => {
                                                            let customStyle: React.CSSProperties = {};
                                                            if (cell === 1) {
                                                                customStyle = { backgroundColor: '#334155', opacity: 0.8, borderRadius: '4px' };
                                                            } else if (cell === 2) {
                                                                const spawnTranslate = minR > 0 ? -minR * 24 : -35;
                                                                customStyle = {
                                                                    backgroundColor: activeBlockColor,
                                                                    boxShadow: `0 0 10px ${activeBlockColor}, inset 0 0 4px rgba(255, 255, 255, 0.8)`,
                                                                    border: '1.5px solid rgba(255, 255, 255, 0.6)',
                                                                    borderRadius: '4px',
                                                                    transform: isSpawning ? `translateY(${spawnTranslate}px)` : 'translateY(0)',
                                                                    opacity: isSpawning ? 0.85 : 1,
                                                                    transition: isSpawning ? 'none' : 'transform 0.9s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease'
                                                                };
                                                            }
                                                            return (
                                                                <div
                                                                    key={`${rIdx}-${cIdx}`}
                                                                    className={`rounded-[3px] transition-all duration-300 ${cell === 0 ? 'bg-indigo-950/15' : ''}`}
                                                                    style={{ width: '20px', height: '20px', ...customStyle }}
                                                                />
                                                            );
                                                        })
                                                    )}
                                                </div>

                                                <p className="text-[7.5px] text-slate-300 leading-snug text-center mt-2 px-1 font-medium">
                                                    {scenario.desc}
                                                </p>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* SLIDE 1: ATRIBUTOS & ESTATÍSTICAS */}
                            {detailSlide === 1 && (
                                <div className="flex-1 flex flex-col justify-center gap-2">
                                    <h4 className="text-[8.5px] font-black text-violet-400 uppercase tracking-widest pl-0.5">
                                        Estatísticas de Combate
                                    </h4>
                                    <div className="space-y-2">
                                        {details.stats.map((stat, sIdx) => {
                                            return (
                                                <div key={sIdx} className="space-y-0.5">
                                                    <div className="flex justify-between items-center text-[8.5px]">
                                                        <span className="text-slate-300 font-bold flex items-center gap-1">
                                                            <span>{stat.icon}</span>
                                                            <span>{stat.label}</span>
                                                        </span>
                                                        <span className="font-mono font-black text-white">{stat.value}/{stat.max}</span>
                                                    </div>
                                                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${(stat.value / stat.max) * 100}%`,
                                                                backgroundColor: activeBlockColor,
                                                                boxShadow: `0 0 8px ${activeBlockColor}`
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="block text-[7px] text-slate-400 font-medium leading-none pl-1">
                                                        {stat.desc}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* SLIDE 2: ORIGEM & LORE & CURIOSIDADES */}
                            {detailSlide === 2 && (
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1 text-[8.5px] font-black text-[#a855f7] uppercase tracking-widest">
                                            <span>🔮</span>
                                            <span>Origem & Segredos da Peça</span>
                                        </div>
                                        <p className="italic text-[9.5px] text-slate-300 leading-normal font-medium bg-[#140a24]/50 p-2.5 rounded-xl border border-indigo-950">
                                            "{details.lore}"
                                        </p>
                                    </div>

                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 mt-2 flex items-start gap-2">
                                        <span className="text-sm shrink-0">💡</span>
                                        <div className="space-y-0.5">
                                            <span className="block text-[8px] font-black text-amber-400 uppercase tracking-wider">
                                                Você Sabia?
                                            </span>
                                            <p className="text-[8px] text-amber-200/90 leading-tight">
                                                {details.fact}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Interactive Dots Navigator */}
                <div className="flex justify-center gap-2.5 mt-3 select-none">
                    {[0, 1, 2].map(idx => (
                        <button
                            key={idx}
                            onClick={() => changeSlide(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${detailSlide === idx
                                    ? 'bg-[#a855f7] scale-125 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                                    : 'bg-slate-700 hover:bg-slate-600'
                                }`}
                            title={`Página ${idx + 1}`}
                        />
                    ))}
                </div>

                {/* Bottom Actions Row: Skin Selector + Coins Upgrade */}
                <div className="flex gap-2.5 mt-3 select-none">
                    {/* Skin Selector Icon Button */}
                    <button
                        onClick={() => {
                            sfx.playMove();
                            setIsSkinSelectorOpen(true);
                        }}
                        className="w-12 h-12 rounded-2xl bg-[#090615]/80 hover:bg-[#140e2a] border-2 border-[#a855f7]/50 hover:border-[#a855f7] flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-[0_3px_0_#4c1d95] shrink-0 relative group"
                        title="Mudar Visual da Peça"
                    >
                        <Palette className="w-5.5 h-5.5 text-violet-400 group-hover:text-violet-300 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-white/30" style={{ backgroundColor: activeBlockColor }} />
                    </button>

                    {/* Upgrade Button */}
                    <button
                        onClick={handleUpgradeCard}
                        disabled={!canUpgrade}
                        className={`flex-1 flex flex-col justify-center items-center py-2 px-3 rounded-2xl transition-all border ${canUpgrade
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 border-yellow-400 text-slate-950 shadow-[0_3px_0_#b45309] active:translate-y-0.5 cursor-pointer hover:from-amber-400'
                                : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-65 cursor-not-allowed'
                            }`}
                    >
                        <span className="text-[7.5px] font-black uppercase tracking-wider flex items-center gap-1 leading-none">
                            <Coins className="w-3 h-3 text-amber-500" /> Melodia de Nível
                        </span>
                        <div className="flex items-center gap-1 mt-1 font-mono font-black text-xs leading-none">
                            <span>{upgradeCost.toLocaleString()}</span>
                            <span>🪙</span>
                        </div>
                    </button>
                </div>

                {/* ==================================================================== */}
                {/* SKINS SELECTOR OVERLAY DRAWER */}
                {/* ==================================================================== */}
                <AnimatePresence>
                    {isSkinSelectorOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 15 }}
                            className="absolute inset-0 bg-[#0c0822]/98 backdrop-blur-md z-60 p-5 flex flex-col justify-between border-2 border-[#a855f7]/60 rounded-[2.2rem]"
                        >
                            <div>
                                <div className="flex justify-between items-center border-b border-indigo-950/60 pb-3 mt-1">
                                    <div className="flex items-center gap-2">
                                        <Palette className="w-5 h-5 text-violet-400" />
                                        <h4 className="text-xs font-black text-white uppercase tracking-wider">
                                            Visuais da Peça
                                        </h4>
                                    </div>
                                    <button
                                        onClick={() => setIsSkinSelectorOpen(false)}
                                        className="text-slate-400 hover:text-white font-bold text-xs uppercase cursor-pointer"
                                    >
                                        Fechar
                                    </button>
                                </div>

                                <div className="space-y-2 mt-4">
                                    {[
                                        { id: 'neon', name: 'Neon Padrão', desc: 'Brilho laser original da Arena.', color: '#8b5cf6' },
                                        { id: 'gameboy', name: 'Retro Gameboy', desc: 'Pixel verde nostálgico dos anos 80.', color: '#15803d' },
                                        { id: 'lava', name: 'Lava Vulcânica', desc: 'Fluorescente com magma ardente.', color: '#b91c1c' },
                                        { id: 'holographic', name: 'Holográfico Elite', desc: 'Prismático futurista brilhante.', color: '#06b6d4' }
                                    ].map(sk => {
                                        const isSelected = currentSkin === sk.id;
                                        return (
                                            <div
                                                key={sk.id}
                                                onClick={() => {
                                                    sfx.playMove();
                                                    setCurrentSkin(sk.id);
                                                }}
                                                className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                                                        ? 'border-violet-500 bg-violet-950/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                                                        : 'border-indigo-950/40 hover:border-indigo-900 bg-slate-950/30'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div
                                                        className="w-7 h-7 rounded-lg border border-white/25 flex items-center justify-center font-black text-white text-xs shadow-sm"
                                                        style={{ backgroundColor: sk.color }}
                                                    >
                                                        {exercise.id}
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="block text-[10px] font-black text-white uppercase">
                                                            {sk.name}
                                                        </span>
                                                        <span className="block text-[7.5px] text-slate-400">
                                                            {sk.desc}
                                                        </span>
                                                    </div>
                                                </div>

                                                {isSelected ? (
                                                    <span className="bg-violet-500/20 text-violet-300 text-[7px] font-black uppercase px-2 py-0.5 rounded-full border border-violet-500/40">
                                                        Equipado
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-[7px] font-bold uppercase hover:text-white">
                                                        Equipar
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                onClick={() => setIsSkinSelectorOpen(false)}
                                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md cursor-pointer transition-transform active:scale-95"
                            >
                                Confirmar Visual
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ==================================================================== */}
                {/* MASTERY DETAILS OVERLAY MODAL */}
                {/* ==================================================================== */}
                <AnimatePresence>
                    {isMasteryOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 bg-[#090516]/98 backdrop-blur-md z-60 p-5 flex flex-col justify-between border-2 border-amber-500/70 rounded-[2.2rem]"
                        >
                            <div>
                                <div className="flex justify-between items-center border-b border-amber-500/30 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-amber-400" />
                                        <h4 className="text-xs font-black text-white uppercase tracking-wider">
                                            Maestria da Peça {exercise.id}
                                        </h4>
                                    </div>
                                    <button
                                        onClick={() => setIsMasteryOpen(false)}
                                        className="text-slate-400 hover:text-white font-bold text-xs uppercase cursor-pointer"
                                    >
                                        Fechar
                                    </button>
                                </div>

                                <div className="space-y-3 mt-4">
                                    {[
                                        { level: 1, title: 'Domínio Básico', desc: 'Destrua 50 linhas com esta peça.', reward: '1.000 Ouro', done: true },
                                        { level: 2, title: 'Domínio Tático', desc: 'Realize 20 combos de pontuação rápida.', reward: '25 Gemas', done: masteryStars >= 2 },
                                        { level: 3, title: 'Mestre Supremo', desc: 'Vença 10 duelos competitivos.', reward: 'Super Baú Mágico', done: masteryStars >= 3 }
                                    ].map(task => (
                                        <div
                                            key={task.level}
                                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${task.done
                                                    ? 'bg-amber-950/30 border-amber-500/50 text-white'
                                                    : 'bg-slate-950/40 border-slate-800 text-slate-400'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${task.done ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                                    ★{task.level}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black">{task.title}</p>
                                                    <p className="text-[8px] text-slate-400">{task.desc}</p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <span className="text-[8px] font-bold text-amber-300 block">{task.reward}</span>
                                                {task.done ? (
                                                    <span className="text-[7.5px] font-bold text-emerald-400">Concluído ✓</span>
                                                ) : (
                                                    <span className="text-[7.5px] font-bold text-slate-500">Em progresso</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    sfx.playLevelUp();
                                    setIsMasteryOpen(false);
                                }}
                                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md cursor-pointer"
                            >
                                Voltar aos Detalhes
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

// ============================================================================
// 5. WRAPPER STANDALONE COM CONTROLES DE PREVIEW E SELETOR DE PEÇAS
// ============================================================================

export default function DetalhesPecaStandalone() {
    const [selectedPieceId, setSelectedPieceId] = useState<TetrominoType>('I');
    const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [cardLevel, setCardLevel] = useState<number>(7);
    const [gold, setGold] = useState<number>(50739);

    const currentExercise = PIECES_CATALOG.find(p => p.id === selectedPieceId) || PIECES_CATALOG[0];

    const handleReset = () => {
        sfx.playMove();
        setSelectedPieceId('I');
        setCardLevel(7);
        setGold(50739);
    };

    return (
        <div className="min-h-screen bg-[#06030c] text-slate-100 flex flex-col font-sans select-none">
            {/* Top Standalone Bar */}
            <header className="bg-slate-950 border-b border-indigo-950 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-violet-400 flex items-center justify-center text-slate-950 font-black text-xs">
                        🧩
                    </div>
                    <div>
                        <h1 className="text-sm font-black uppercase text-white tracking-wider">
                            Interface Standalone: Detalhes da Peça
                        </h1>
                        <p className="text-[11px] text-violet-300">
                            Visualizador 3D, Simulação de Replay da Arena, Estatísticas, Lore, Skins e Maestria
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Piece Selector Buttons */}
                    <div className="hidden md:flex bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
                        {PIECES_CATALOG.map(p => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    sfx.playMove();
                                    setSelectedPieceId(p.id);
                                    setIsOpen(true);
                                }}
                                className={`w-7 h-7 rounded-lg font-black text-xs transition-colors cursor-pointer ${selectedPieceId === p.id
                                        ? 'bg-violet-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {p.id}
                            </button>
                        ))}
                    </div>

                    {/* Viewport switch */}
                    <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
                        <button
                            onClick={() => setViewportMode('desktop')}
                            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${viewportMode === 'desktop' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Monitor className="w-3.5 h-3.5" />
                            <span>Desktop</span>
                        </button>
                        <button
                            onClick={() => setViewportMode('mobile')}
                            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${viewportMode === 'mobile' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Mobile</span>
                        </button>
                    </div>

                    <button
                        onClick={handleReset}
                        title="Resetar dados"
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setIsOpen(prev => !prev)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer transition-transform active:scale-95"
                    >
                        {isOpen ? 'Fechar Modal' : 'Abrir Peça'}
                    </button>
                </div>
            </header>

            {/* Main Preview Playground */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:20px_20px]" />

                {viewportMode === 'mobile' ? (
                    // Mobile Mockup Frame
                    <div className="w-[390px] h-[780px] bg-slate-950 border-4 border-slate-800 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-full z-50 flex items-center justify-center">
                            <div className="w-10 h-1 bg-slate-700 rounded-full" />
                        </div>

                        <div className="flex-1 w-full h-full relative overflow-hidden pt-6">
                            {isOpen && (
                                <DetalhesPecaModal
                                    exercise={currentExercise}
                                    cardLevel={cardLevel}
                                    playerGold={gold}
                                    onUpgrade={(newLevel, spent) => {
                                        setCardLevel(newLevel);
                                        setGold(prev => prev - spent);
                                    }}
                                    onClose={() => setIsOpen(false)}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    // Desktop View
                    <div className="w-full h-full flex items-center justify-center">
                        {isOpen ? (
                            <DetalhesPecaModal
                                exercise={currentExercise}
                                cardLevel={cardLevel}
                                playerGold={gold}
                                onUpgrade={(newLevel, spent) => {
                                    setCardLevel(newLevel);
                                    setGold(prev => prev - spent);
                                }}
                                onClose={() => setIsOpen(false)}
                            />
                        ) : (
                            <div className="text-center p-8 bg-slate-900/60 border border-violet-950 rounded-3xl max-w-md">
                                <Palette className="w-12 h-12 text-violet-400 mx-auto mb-3" />
                                <h3 className="text-lg font-black uppercase text-white mb-1">
                                    Detalhes da Peça Fechado
                                </h3>
                                <p className="text-xs text-slate-400 mb-4">
                                    Selecione uma peça para inspecionar seus atributos e simulação de replay da arena:
                                </p>
                                <div className="flex justify-center gap-1.5 mb-4">
                                    {PIECES_CATALOG.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedPieceId(p.id);
                                                setIsOpen(true);
                                            }}
                                            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-violet-600 text-white font-black text-xs cursor-pointer transition-colors"
                                        >
                                            {p.id}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
