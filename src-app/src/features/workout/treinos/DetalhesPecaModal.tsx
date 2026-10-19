import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import '@/features/auth/auth-screen.css';
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
    Shield,
    Flame,
    Dumbbell,
    Heart,
    Wand2,
    Sliders,
    Gem,
    Info,
    Smartphone,
    Monitor
} from 'lucide-react';

// ==========================================
// 1. STANDALONE AUDIO SYNTHESIZER (WEB AUDIO API)
// 100% self-contained, no external mp3 files required
// ==========================================
class SoundManager {
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

    playHold() {
        this.initCtx();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.12);
        } catch (e) {
            console.error(e);
        }
    }

    playMove() {
        this.initCtx();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(580, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
        } catch (e) {
            console.error(e);
        }
    }

    playLevelUp() {
        this.initCtx();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            [440, 554.37, 659.25, 880].forEach((freq, idx) => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.07);
                gain.gain.setValueAtTime(0.25, now + idx * 0.07);
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.2);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.07);
                osc.stop(now + idx * 0.07 + 0.22);
            });
        } catch (e) {
            console.error(e);
        }
    }

    playRewardClaim() {
        this.initCtx();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                gain.gain.setValueAtTime(0.18, now + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.26);
            });
        } catch (e) {
            console.error(e);
        }
    }
}

const soundManager = new SoundManager();

// ==========================================
// 2. DATASETS & INTERFACES (EXACT SITE SPEC)
// ==========================================
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L' | 'X';

export interface ExercisePiece {
    id: TetrominoType;
    nome: string;
    rarity: 'Comum' | 'Raro' | 'Epico' | 'Lendario';
    level: number;
    count: number;
    unlocked: boolean;
    type?: string;
}

export interface PieceDetailData {
    type: string;
    lore: string;
    fact: string;
    stats: {
        label: string;
        value: number;
        max: number;
        desc: string;
        icon: string;
    }[];
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

export const TETRA_PIECES: Record<string, { color: string; matrix: number[][] }> = {
    I: {
        color: 'rgb(6, 182, 212)', // Cyan
        matrix: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    },
    O: {
        color: 'rgb(234, 179, 8)', // Yellow
        matrix: [
            [1, 1],
            [1, 1]
        ]
    },
    T: {
        color: 'rgb(168, 85, 247)', // Purple
        matrix: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    S: {
        color: 'rgb(34, 197, 94)', // Green
        matrix: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ]
    },
    Z: {
        color: 'rgb(239, 68, 68)', // Red
        matrix: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ]
    },
    J: {
        color: 'rgb(59, 130, 246)', // Blue
        matrix: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    L: {
        color: 'rgb(249, 115, 22)', // Orange
        matrix: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    X: {
        color: 'rgb(20, 184, 166)', // Teal / Cosmic
        matrix: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0]
        ]
    }
};

export const DETAILS_DATA: Record<string, PieceDetailData> = {
    I: {
        type: 'Linha Reta & Finalizadora',
        lore: 'O lendário bastão ciano. Diz a lenda que ele espera pacientemente nas profundezas da matriz por uma pilha perfeitamente esculpida para desferir o lendário Tetris de 4 linhas.',
        fact: 'Responsável por 99% das vitórias heroicas e 100% das orações dos jogadores quando o poço está na altura máxima.',
        stats: [
            { label: 'Poder de Limpeza', value: 4, max: 4, desc: 'Capaz de limpar 4 linhas simultâneas (o golpe máximo).', icon: '⚡' },
            { label: 'Flexibilidade SRS', value: 20, max: 100, desc: 'Geometria rígida; sofre para entrar em fendas apertadas.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 95, max: 100, desc: 'Acelerador massivo de pontuação de arena.', icon: '💥' }
        ],
        scenarios: {
            favorable: {
                title: 'Poço Aberto de 4 Linhas',
                desc: 'Encaixe perfeito na coluna 10 para acionar o cobiçado Tetris.',
                grid: [
                    [1, 1, 1, 1, 1, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [1, 1, 1, 1, 1, 1, 1, 1, 2]
                ]
            },
            unfavorable: {
                title: 'Terreno Escarpado Irregular',
                desc: 'Superfícies denteadas criam buracos vazios catastróficos ao jogar a peça deitada.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 1, 0, 0, 1, 0, 0, 0],
                    [0, 1, 1, 0, 1, 1, 1, 0, 0],
                    [1, 1, 1, 0, 1, 1, 1, 1, 0],
                    [2, 2, 2, 2, 0, 0, 0, 0, 0],
                    [1, 1, 1, 0, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            }
        }
    },
    O: {
        type: 'Bloco de Sustentação & Nivelador',
        lore: 'O monólito dourado inabalável. Nunca gira, nunca muda, mas oferece a fundação mais sólida de toda a arena.',
        fact: 'É a única peça que mantém exatamente o mesmo formato independentemente das rotações que o jogador tente fazer.',
        stats: [
            { label: 'Poder de Limpeza', value: 2, max: 4, desc: 'Limpa até 2 linhas de forma compacta e segura.', icon: '🛡️' },
            { label: 'Flexibilidade SRS', value: 10, max: 100, desc: 'Imune ao sistema SRS por simetria absoluta.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 50, max: 100, desc: 'Estável e seguro para manter o ritmo sem risco.', icon: '🧱' }
        ],
        scenarios: {
            favorable: {
                title: 'Plataforma Plana 2x2',
                desc: 'Construção nivelada garante sustentação perfeita para o poço.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 2, 2, 0, 0, 0, 0],
                    [0, 0, 0, 2, 2, 0, 0, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0]
                ]
            },
            unfavorable: {
                title: 'Fenda Estreita de 1 Coluna',
                desc: 'Não consegue descer em valas de 1 bloco de largura, bloqueando o jogo.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 2, 2, 0, 0, 0, 0],
                    [0, 0, 0, 2, 2, 0, 0, 0, 0],
                    [1, 1, 1, 0, 1, 1, 1, 1, 0],
                    [1, 1, 1, 0, 1, 1, 1, 1, 0],
                    [1, 1, 1, 0, 1, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0]
                ]
            }
        }
    },
    T: {
        type: 'Versátil & T-Spin Tático',
        lore: 'A queridinha dos mestres de torneio. Sua ponta única permite rodopios milagrosos conhecidos como T-Spin dentro de cavernas seladas.',
        fact: 'Criada para salvar jogadas perdidas, o T-Spin concede mais pontos e lixo para os oponentes do que um Tetris tradicional.',
        stats: [
            { label: 'Poder de Limpeza', value: 3, max: 4, desc: 'Capacidade técnica de T-Spin Double e Triple.', icon: '🌀' },
            { label: 'Flexibilidade SRS', value: 95, max: 100, desc: 'A maior mobilidade de rodopio em cantos de toda a arena.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 90, max: 100, desc: 'Gera bônus crítico ao ser rotacionada no último milissegundo.', icon: '✨' }
        ],
        scenarios: {
            favorable: {
                title: 'Ninho T-Spin Tático',
                desc: 'Entra e gira no ar para preencher o vazio com bônus absurdo.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 1, 0, 0, 0, 0, 0, 0],
                    [0, 0, 1, 0, 1, 0, 0, 0, 0],
                    [0, 1, 1, 2, 1, 1, 0, 0, 0],
                    [1, 1, 2, 2, 2, 1, 1, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0]
                ]
            },
            unfavorable: {
                title: 'Paredão Sem Entalhes',
                desc: 'Desperdiçada se colocada em pisos planos sem criar fendas.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 2, 0, 0, 0, 0, 0],
                    [0, 0, 2, 2, 2, 0, 0, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            }
        }
    },
    S: {
        type: 'Escalador & Transição Diagonais',
        lore: 'Serpente verde que conecta relevos difíceis. Mestre em transições suaves entre alturas desiguais na arena.',
        fact: 'Junto com sua irmã Z, é considerada uma das peças que mais exigem raciocínio espacial avançado para evitar buracos.',
        stats: [
            { label: 'Poder de Limpeza', value: 2, max: 4, desc: 'Limpa 2 linhas enquanto alinha o terreno.', icon: '🐍' },
            { label: 'Flexibilidade SRS', value: 65, max: 100, desc: 'Pode deslizar em degraus inclinados com técnica SRS.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 60, max: 100, desc: 'Excelente estabilizador de ritmo.', icon: '📈' }
        ],
        scenarios: {
            favorable: {
                title: 'Degrau Diagonal Conectivo',
                desc: 'Encaixe natural em escadas para recuperar o alinhamento.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 2, 2, 0, 0, 0, 0],
                    [0, 0, 2, 2, 1, 1, 0, 0, 0],
                    [0, 1, 1, 1, 1, 1, 1, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0]
                ]
            },
            unfavorable: {
                title: 'Poço Reto Fechado',
                desc: 'Tentar forçar a peça S num buraco reto cria 2 vazios permanentes.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 2, 2, 0, 0, 0, 0],
                    [0, 0, 2, 2, 0, 0, 0, 0, 0],
                    [1, 1, 0, 0, 0, 1, 1, 0, 0],
                    [1, 1, 0, 0, 0, 1, 1, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0]
                ]
            }
        }
    },
    Z: {
        type: 'Equilibrador & Reflexo Dinâmico',
        lore: 'O espelho rubro da peça S. Temível quando jogada sem planejamento, mas indispensável para fechar o flanco esquerdo.',
        fact: 'Muitos jogadores profissionais usam o par S/Z em conjunto para formar as chamadas Pirâmides de Ataque rápido.',
        stats: [
            { label: 'Poder de Limpeza', value: 2, max: 4, desc: 'Limpa 2 linhas fechando flancos desiguais.', icon: '⚡' },
            { label: 'Flexibilidade SRS', value: 65, max: 100, desc: 'Permite rotações de emergência em paredes laterais.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 60, max: 100, desc: 'Equilíbrio crucial na pressão da partida.', icon: '🛡️' }
        ],
        scenarios: {
            favorable: {
                title: 'Degrau Invertido Perfeito',
                desc: 'Encaixe milimétrico em encostas voltadas para a esquerda.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 2, 2, 0, 0, 0, 0, 0],
                    [0, 0, 0, 2, 2, 1, 0, 0, 0],
                    [0, 0, 1, 1, 1, 1, 1, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0]
                ]
            },
            unfavorable: {
                title: 'Canto Oposto Bloqueado',
                desc: 'Inserida no ângulo incorreto, isola o fundo e causa transbordo.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 2, 2, 0, 0, 0, 0, 0],
                    [0, 0, 0, 2, 2, 0, 0, 0, 0],
                    [1, 1, 1, 0, 0, 1, 1, 0, 0],
                    [1, 1, 1, 0, 0, 1, 1, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0]
                ]
            }
        }
    },
    J: {
        type: 'Gancho Esquerdo & Defesa',
        lore: 'O gancho azul da sabedoria. Seu perfil angular permite abraçar blocos isolados e consolidar a lateral esquerda do tabuleiro.',
        fact: 'É uma das peças mais flexíveis do jogo clássico, capaz de formar pontes sobre colunas perigosas sem sacrificar altura.',
        stats: [
            { label: 'Poder de Limpeza', value: 3, max: 4, desc: 'Limpa 3 linhas com facilidade usando sua haste vertical.', icon: '⚓' },
            { label: 'Flexibilidade SRS', value: 80, max: 100, desc: 'Excelente rotação sobre saliências de parede.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 75, max: 100, desc: 'Mantém sequências vivas na lateral.', icon: '🌊' }
        ],
        scenarios: {
            favorable: {
                title: 'Encaixe de Canto Esquerdo',
                desc: 'Apoia perfeitamente sua perna contra a parede do tabuleiro.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [2, 0, 0, 0, 0, 0, 0, 0, 0],
                    [2, 2, 2, 0, 0, 0, 0, 0, 0],
                    [1, 1, 1, 1, 1, 1, 0, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0]
                ]
            },
            unfavorable: {
                title: 'Plataforma Elevada Central',
                desc: 'Jogada de cabeça para baixo cria pontes ocas difíceis de cobrir.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 2, 2, 2, 0, 0, 0, 0],
                    [0, 0, 2, 0, 0, 0, 0, 0, 0],
                    [0, 1, 1, 0, 1, 1, 0, 0, 0],
                    [1, 1, 1, 0, 1, 1, 1, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0]
                ]
            }
        }
    },
    L: {
        type: 'Gancho Direito & Ofensivo',
        lore: 'A bota alaranjada da vitória. Gêmea oposta do gancho azul, especialista em selar a coluna 9 antes de preparar o grande ataque.',
        fact: 'Em estratégias de ataque rápido, a peça L é frequentemente usada como o pilar de sustentação para aberturas 4-Wide.',
        stats: [
            { label: 'Poder de Limpeza', value: 3, max: 4, desc: 'Poderosa para aberturas triplas de linha.', icon: '🥾' },
            { label: 'Flexibilidade SRS', value: 80, max: 100, desc: 'Rotaciona com facilidade em cantos direitos.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 75, max: 100, desc: 'Pressão constante de linhas de ataque.', icon: '🔥' }
        ],
        scenarios: {
            favorable: {
                title: 'Fechamento de Flanco Direito',
                desc: 'Protege a penúltima coluna sem invadir o poço principal.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 2, 0],
                    [0, 0, 0, 0, 0, 2, 2, 2, 0],
                    [0, 0, 1, 1, 1, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0]
                ]
            },
            unfavorable: {
                title: 'Inversão em Parede Plana',
                desc: 'Criar buracos no meio do tabuleiro ao invés de usar a borda.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 2, 2, 2, 0, 0, 0, 0],
                    [0, 0, 0, 0, 2, 0, 0, 0, 0],
                    [0, 1, 1, 0, 1, 1, 0, 0, 0],
                    [1, 1, 1, 0, 1, 1, 1, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0]
                ]
            }
        }
    },
    X: {
        type: 'Peça Especial & Destruidor Cósmico',
        lore: 'O pentaminó especial secreto da Arena. Nascida da colisão quântica de blocos estelares, sua forma em cruz detona linhas cinzentas e restabelece a ordem no grid.',
        fact: 'Desbloqueada exclusivamente por guerreiros que atingiram a maestria máxima da Arena de Blocos.',
        stats: [
            { label: 'Poder de Limpeza', value: 4, max: 4, desc: 'Poder de destruição em raio estelar 3x3.', icon: '☄️' },
            { label: 'Flexibilidade SRS', value: 10, max: 100, desc: 'Simetria cósmica de 4 lados perfeitos.', icon: '🔄' },
            { label: 'Multiplicador de Combo', value: 100, max: 100, desc: 'Multiplicador astronômico de finalizações.', icon: '👑' }
        ],
        scenarios: {
            favorable: {
                title: 'Detonação Central em Fenda',
                desc: 'Desce ao núcleo da estrutura para explodir relevos críticos.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 2, 0, 0, 0, 0, 0],
                    [0, 0, 2, 2, 2, 0, 0, 0, 0],
                    [0, 0, 0, 2, 0, 0, 0, 0, 0],
                    [1, 1, 0, 0, 0, 1, 1, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 0]
                ]
            },
            unfavorable: {
                title: 'Chão Plano Sem Conexão',
                desc: 'Em pisos lisos, a cruz apoia somente 1 bloco deixando vazios laterais.',
                grid: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 2, 0, 0, 0, 0, 0],
                    [0, 0, 2, 2, 2, 0, 0, 0, 0],
                    [0, 0, 0, 2, 0, 0, 0, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            }
        }
    }
};

export const INITIAL_EXERCISES: ExercisePiece[] = [
    { id: 'I', nome: 'Linha Reta', rarity: 'Comum', level: 9, count: 120, unlocked: true },
    { id: 'O', nome: 'Bloco Quadrado', rarity: 'Comum', level: 8, count: 85, unlocked: true },
    { id: 'T', nome: 'Giro Triplo', rarity: 'Raro', level: 7, count: 42, unlocked: true },
    { id: 'S', nome: 'Serpente Esmeralda', rarity: 'Raro', level: 6, count: 35, unlocked: true },
    { id: 'Z', nome: 'Raio Rubro', rarity: 'Raro', level: 6, count: 28, unlocked: true },
    { id: 'J', nome: 'Gancho Safira', rarity: 'Raro', level: 5, count: 19, unlocked: true },
    { id: 'L', nome: 'Botina Laranja', rarity: 'Raro', level: 5, count: 14, unlocked: true },
    { id: 'X', nome: 'Destruidor Cósmico', rarity: 'Lendario', level: 4, count: 6, unlocked: true }
];

export const INITIAL_MASTERIES: Record<string, any> = {
    I: {
        stars: 2,
        rarity: 'Comum',
        nome: 'Linha Reta',
        domains: [
            {
                id: 1,
                title: "Perfeição de Tetris",
                desc: "Limpe 4 linhas simultâneas para marcar um Tetris com a Peça I.",
                icon: "⚡",
                stages: [
                    { stage: 1, target: 10, current: 10, rewardType: 'gold', rewardValue: 1000, completed: true },
                    { stage: 2, target: 30, current: 30, rewardType: 'gold', rewardValue: 2000, completed: true },
                    { stage: 3, target: 100, current: 48, rewardType: 'gold', rewardValue: 4000, completed: false }
                ]
            },
            {
                id: 2,
                title: "Salvação nas Alturas",
                desc: "Use a Peça I para desobstruir poços que ultrapassaram a linha vermelha.",
                icon: "🛡️",
                stages: [
                    { stage: 1, target: 5, current: 5, rewardType: 'gold', rewardValue: 1500, completed: true },
                    { stage: 2, target: 20, current: 20, rewardType: 'gold', rewardValue: 3000, completed: true },
                    { stage: 3, target: 50, current: 12, rewardType: 'gems', rewardValue: 100, completed: false }
                ]
            },
            {
                id: 3,
                title: "Combo Relâmpago",
                desc: "Mantenha sequências de combo aceleradas utilizando a Peça I deitada.",
                icon: "💥",
                stages: [
                    { stage: 1, target: 5, current: 5, rewardType: 'gems', rewardValue: 50, completed: true },
                    { stage: 2, target: 15, current: 8, rewardType: 'gems', rewardValue: 150, completed: false },
                    { stage: 3, target: 40, current: 0, rewardType: 'gems', rewardValue: 300, completed: false }
                ]
            }
        ]
    },
    T: {
        stars: 3,
        rarity: 'Raro',
        nome: 'Giro Triplo',
        domains: [
            {
                id: 1,
                title: "Mestre do T-Spin",
                desc: "Execute rodopios milagrosos T-Spin em fendas estreitas.",
                icon: "🌀",
                stages: [
                    { stage: 1, target: 10, current: 10, rewardType: 'gold', rewardValue: 2000, completed: true },
                    { stage: 2, target: 25, current: 25, rewardType: 'gold', rewardValue: 4000, completed: true },
                    { stage: 3, target: 80, current: 80, rewardType: 'gold', rewardValue: 6000, completed: true }
                ]
            },
            {
                id: 2,
                title: "Pressão de Arena",
                desc: "Envie linhas de lixo aos oponentes após rotacionar a Peça T.",
                icon: "⚔️",
                stages: [
                    { stage: 1, target: 20, current: 20, rewardType: 'gold', rewardValue: 2500, completed: true },
                    { stage: 2, target: 60, current: 60, rewardType: 'gold', rewardValue: 5000, completed: true },
                    { stage: 3, target: 150, current: 150, rewardType: 'gems', rewardValue: 150, completed: true }
                ]
            },
            {
                id: 3,
                title: "Rei dos Giros",
                desc: "Conclua uma partida inteira pontuando majoritariamente com rotações T.",
                icon: "👑",
                stages: [
                    { stage: 1, target: 5, current: 5, rewardType: 'gems', rewardValue: 100, completed: true },
                    { stage: 2, target: 15, current: 15, rewardType: 'gems', rewardValue: 200, completed: true },
                    { stage: 3, target: 30, current: 30, rewardType: 'gems', rewardValue: 500, completed: true }
                ]
            }
        ]
    },
    O: {
        stars: 1,
        rarity: 'Comum',
        nome: 'Bloco Quadrado',
        domains: [
            {
                id: 1,
                title: "Fundação Inabalável",
                desc: "Preencha depressões planas 2x2 para manter a estabilidade do poço.",
                icon: "📦",
                stages: [
                    { stage: 1, target: 20, current: 20, rewardType: 'gold', rewardValue: 1200, completed: true },
                    { stage: 2, target: 50, current: 35, rewardType: 'gold', rewardValue: 2500, completed: false },
                    { stage: 3, target: 120, current: 0, rewardType: 'gold', rewardValue: 5000, completed: false }
                ]
            },
            {
                id: 2,
                title: "Muro de Proteção",
                desc: "Use a Peça O como bloqueador em defesas de final de arena.",
                icon: "🛡️",
                stages: [
                    { stage: 1, target: 10, current: 4, rewardType: 'gold', rewardValue: 1800, completed: false },
                    { stage: 2, target: 30, current: 0, rewardType: 'gold', rewardValue: 3500, completed: false },
                    { stage: 3, target: 80, current: 0, rewardType: 'gems', rewardValue: 120, completed: false }
                ]
            },
            {
                id: 3,
                title: "Simetria Perfeita",
                desc: "Nivele ambas as pontas da arena com pares de Peças O.",
                icon: "✨",
                stages: [
                    { stage: 1, target: 5, current: 0, rewardType: 'gems', rewardValue: 60, completed: false },
                    { stage: 2, target: 15, current: 0, rewardType: 'gems', rewardValue: 180, completed: false },
                    { stage: 3, target: 45, current: 0, rewardType: 'gems', rewardValue: 350, completed: false }
                ]
            }
        ]
    },
    X: {
        stars: 3,
        rarity: 'Lendario',
        nome: 'Destruidor Cósmico',
        domains: [
            {
                id: 1,
                title: "Impacto Sísmico",
                desc: "Use a Peça X Especial para limpar o grid tático.",
                icon: "☄️",
                stages: [
                    { stage: 1, target: 10, current: 10, rewardType: 'gold', rewardValue: 3500, completed: true },
                    { stage: 2, target: 30, current: 30, rewardType: 'gold', rewardValue: 5500, completed: true },
                    { stage: 3, target: 100, current: 100, rewardType: 'gold', rewardValue: 8000, completed: true }
                ]
            },
            {
                id: 2,
                title: "Coração de Campeão",
                desc: "Conclua treinos de extrema dificuldade com a Peça X no Deck.",
                icon: "❤️",
                stages: [
                    { stage: 1, target: 10, current: 10, rewardType: 'gold', rewardValue: 4500, completed: true },
                    { stage: 2, target: 30, current: 30, rewardType: 'gold', rewardValue: 7500, completed: true },
                    { stage: 3, target: 100, current: 100, rewardType: 'gold', rewardValue: 10000, completed: true }
                ]
            },
            {
                id: 3,
                title: "Estrela Guia",
                desc: "Sopre blocos cinzentos e restabeleça o grid com combos X.",
                icon: "🌟",
                stages: [
                    { stage: 1, target: 5, current: 5, rewardType: 'gems', rewardValue: 150, completed: true },
                    { stage: 2, target: 15, current: 15, rewardType: 'gems', rewardValue: 300, completed: true },
                    { stage: 3, target: 50, current: 50, rewardType: 'gems', rewardValue: 600, completed: true }
                ]
            }
        ]
    }
};

// ==========================================
// 3. HELPER FUNCTIONS MATCHING SITE 1:1
// ==========================================
const getLucideIconForEmoji = (emoji: string) => {
    switch (emoji) {
        case "💥": return Flame;
        case "⚔️": return Dumbbell;
        case "👑": return Award;
        case "📦": return Layers;
        case "🛡️": return Shield;
        case "✨": return Sparkles;
        case "🌀": return Wand2;
        case "📐": return Sliders;
        case "⭐": return Sparkles;
        case "🐍": return Wand2;
        case "⚡": return Flame;
        case "☯️": return Shield;
        case "🏎️": return Flame;
        case "☄️": return Sparkles;
        case "🚨": return Flame;
        case "⚓": return Shield;
        case "🥾": return Dumbbell;
        case "🛹": return Sliders;
        case "🤠": return Award;
        case "🌟": return Sparkles;
        case "❤️": return Heart;
        default: return Sparkles;
    }
};

const renderThreeMasteryIcons = (completedCount: number, sizeClass: string = "w-4 h-4") => {
    return (
        <div className="flex gap-1 justify-center items-center">
            <Award
                className={`${sizeClass} ${completedCount >= 1
                        ? 'text-amber-600 fill-amber-600/10 drop-shadow-[0_1px_3px_rgba(217,119,6,0.35)]'
                        : 'text-slate-600 opacity-40'
                    }`}
            />
            <Trophy
                className={`${sizeClass} ${completedCount >= 2
                        ? 'text-slate-300 fill-slate-300/10 drop-shadow-[0_1px_3px_rgba(148,163,184,0.35)]'
                        : 'text-slate-600 opacity-40'
                    }`}
            />
            <Crown
                className={`${sizeClass} ${completedCount >= 3
                        ? 'text-yellow-400 fill-yellow-400/10 drop-shadow-[0_1px_3px_rgba(250,204,21,0.35)]'
                        : 'text-slate-600 opacity-40'
                    }`}
            />
        </div>
    );
};

const renderCardTetromino = (type: string, activeSkin: string = 'neon') => {
    const info = TETRA_PIECES[type];
    if (!info) return null;

    let pieceColor = info.color;
    if (activeSkin === 'gameboy') {
        pieceColor = 'rgb(34, 197, 94)';
    } else if (activeSkin === 'lava') {
        pieceColor = 'rgb(239, 68, 68)';
    } else if (activeSkin === 'holographic') {
        pieceColor = 'rgb(6, 182, 212)';
    }

    const cellSize = 'w-5 h-5 rounded-md sm:w-6 sm:h-6';
    const gridGap = 'gap-1';

    return (
        <div className="flex items-center justify-center w-full h-full transform hover:scale-110 transition-transform duration-300">
            <div className={`flex flex-col ${gridGap}`}>
                {info.matrix.map((row, rIdx) => (
                    <div key={rIdx} className={`flex ${gridGap} justify-center`}>
                        {row.map((cell, cIdx) => (
                            <div
                                key={cIdx}
                                className={`${cellSize}`}
                                style={{
                                    backgroundColor: cell === 1 ? pieceColor : 'transparent',
                                    opacity: cell === 1 ? 1 : 0,
                                    boxShadow: cell === 1 ? `0 4px 12px ${pieceColor}af, inset 0 0 4px rgba(255, 255, 255, 0.4)` : 'none',
                                    border: cell === 1 ? `1px solid rgba(255, 255, 255, 0.3)` : 'none'
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ==========================================
// 4. MAIN STANDALONE PIECE DETAILS COMPONENT
// ==========================================
export interface DetalhesPecaStandaloneProps {
    initialPieceId?: TetrominoType;
    isOpen?: boolean;
    onClose?: () => void;
    gold?: number;
    onUpdateGold?: (amount: number) => void;
}

export const DetalhesPecaStandalone: React.FC<DetalhesPecaStandaloneProps> = ({
    initialPieceId = 'I',
    isOpen = true,
    onClose = () => { },
    gold: initialGold = 12500,
    onUpdateGold
}) => {
    // State
    const [selectedPieceId, setSelectedPieceId] = useState<TetrominoType>(initialPieceId);
    const [exercises, setExercises] = useState<ExercisePiece[]>(INITIAL_EXERCISES);
    const [profileGold, setProfileGold] = useState<number>(initialGold);
    const [cardMasteries, setCardMasteries] = useState<Record<string, any>>(INITIAL_MASTERIES);

    // Modal states matching TabCollection.tsx
    const [detailSlide, setDetailSlide] = useState<number>(0);
    const [slideDirection, setSlideDirection] = useState<number>(0);
    const [replayPhase, setReplayPhase] = useState<'fav-spawn' | 'fav-settle' | 'unfav-spawn' | 'unfav-settle'>('fav-spawn');
    const [isPieceSkinSelectorOpen, setIsPieceSkinSelectorOpen] = useState<boolean>(false);
    const [pieceSkins, setPieceSkins] = useState<Record<string, string>>({
        I: 'neon',
        O: 'neon',
        T: 'neon',
        S: 'neon',
        Z: 'neon',
        J: 'neon',
        L: 'neon',
        X: 'neon'
    });
    const [selectedMasteryCard, setSelectedMasteryCard] = useState<string | null>(null);
    const [showGeneralMasteriesModal, setShowGeneralMasteriesModal] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const [touchStartX, setTouchStartX] = useState<number>(0);
    const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');

    // Active piece data
    const ex = exercises.find(e => e.id === selectedPieceId) || exercises[0];
    const details = DETAILS_DATA[ex.id] || DETAILS_DATA['I'];
    const pieceColor = TETRA_PIECES[ex.id]?.color || '#06b6d4';
    const currentLvl = ex.level;
    const masteryProgress = cardMasteries[ex.id] || { stars: 0, domains: [] };

    // Toast trigger
    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(msg);
        setToastType(type);
        setTimeout(() => {
            setToastMessage(null);
        }, 2500);
    };

    // Replay Phase Looper (Matches TabCollection.tsx exactly)
    useEffect(() => {
        if (detailSlide !== 0) return;

        let timer: NodeJS.Timeout;
        if (replayPhase === 'fav-spawn') {
            timer = setTimeout(() => setReplayPhase('fav-settle'), 2000);
        } else if (replayPhase === 'fav-settle') {
            timer = setTimeout(() => setReplayPhase('unfav-spawn'), 3000);
        } else if (replayPhase === 'unfav-spawn') {
            timer = setTimeout(() => setReplayPhase('unfav-settle'), 2000);
        } else if (replayPhase === 'unfav-settle') {
            timer = setTimeout(() => setReplayPhase('fav-spawn'), 3000);
        }

        return () => clearTimeout(timer);
    }, [detailSlide, replayPhase]);

    // Touch Swipe Handlers for Replay Carousel
    const handleDetailTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
    };

    const handleDetailTouchEnd = (e: React.TouchEvent) => {
        const endX = e.changedTouches[0].clientX;
        const diff = touchStartX - endX;
        if (Math.abs(diff) > 40) {
            if (diff > 0) {
                changeSlide((detailSlide + 1) % 3);
            } else {
                changeSlide((detailSlide - 1 + 3) % 3);
            }
        }
    };

    const changeSlide = (newIndex: number) => {
        if (newIndex === detailSlide) return;
        soundManager.playMove();
        setSlideDirection(newIndex > detailSlide ? 1 : -1);
        setDetailSlide(newIndex);
    };

    const onUpgradeCard = (pieceId: TetrominoType, cost: number) => {
        if (profileGold < cost) {
            soundManager.playHold();
            showToast('Moedas insuficientes!', 'error');
            return;
        }
        const newGold = profileGold - cost;
        setProfileGold(newGold);
        if (onUpdateGold) onUpdateGold(newGold);

        setExercises(prev => prev.map(p => {
            if (p.id === pieceId) {
                return { ...p, level: p.level + 1 };
            }
            return p;
        }));
    };

    const handleAdvanceTask = (cardId: string, domainId: number) => {
        setCardMasteries(prev => {
            const card = { ...prev[cardId] };
            if (!card || !card.domains) return prev;

            const newDomains = card.domains.map((dom: any) => {
                if (dom.id !== domainId) return dom;
                const newStages = dom.stages.map((stg: any) => {
                    if (!stg.completed) {
                        const nextVal = Math.min(stg.target, stg.current + 5);
                        const isFinished = nextVal >= stg.target;
                        if (isFinished) {
                            soundManager.playRewardClaim();
                            showToast(`Estágio ${stg.stage} dominado! Recompensa concedida!`, 'success');
                            if (stg.rewardType === 'gold') {
                                setProfileGold(g => g + stg.rewardValue);
                            }
                        }
                        return { ...stg, current: nextVal, completed: isFinished };
                    }
                    return stg;
                });
                return { ...dom, stages: newStages };
            });

            const totalStars = newDomains.filter((d: any) => d.stages.every((s: any) => s.completed)).length;
            return {
                ...prev,
                [cardId]: { ...card, domains: newDomains, stars: totalStars }
            };
        });
    };

    if (!isOpen) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-950 text-white min-h-[400px]">
                <button
                    onClick={() => {
                        soundManager.playHold();
                        onClose();
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-bold uppercase tracking-wider text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                    Abrir Detalhes da Peça
                </button>
            </div>
        );
    }

    const renderTetrominoBlock = (type: string, size: 'small' | 'large' | 'clash' = 'large') => {
        const info = TETRA_PIECES[type];
        if (!info) return null;

        let activeColor = info.color;
        const skin = pieceSkins[type] || 'neon';
        if (skin === 'gameboy') {
            activeColor = 'rgb(34, 197, 94)';
        } else if (skin === 'lava') {
            activeColor = 'rgb(239, 68, 68)';
        } else if (skin === 'holographic') {
            activeColor = 'rgb(6, 182, 212)';
        }

        const cellSize = size === 'small' ? 'w-2 h-2 rounded-sm' : size === 'clash' ? 'w-6 h-6 rounded-md sm:w-7 sm:h-7' : 'w-4 h-4 rounded-md';
        const gridGap = size === 'clash' ? 'gap-1' : 'gap-[2px]';

        if (size === 'clash') {
            return (
                <div className="flex items-center justify-center w-full h-full transform hover:scale-110 transition-transform duration-300">
                    <div className={`flex flex-col ${gridGap}`}>
                        {info.matrix.map((row, rIdx) => (
                            <div key={rIdx} className={`flex ${gridGap} justify-center`}>
                                {row.map((cell, cIdx) => (
                                    <div
                                        key={cIdx}
                                        className={`${cellSize}`}
                                        style={{
                                            backgroundColor: cell === 1 ? activeColor : 'transparent',
                                            opacity: cell === 1 ? 1 : 0,
                                            boxShadow: cell === 1 ? `0 0 15px ${activeColor}, inset 0 0 6px rgba(255, 255, 255, 0.6)` : 'none',
                                            border: cell === 1 ? `1.5px solid rgba(255, 255, 255, 0.4)` : 'none'
                                        }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="p-1.5 rounded-xl bg-[#080515]/95 border border-indigo-950/70 flex shadow-inner shrink-0 items-center justify-center w-16 h-16">
                <div className={`flex flex-col ${gridGap}`}>
                    {info.matrix.map((row, rIdx) => (
                        <div key={rIdx} className={`flex ${gridGap} justify-center`}>
                            {row.map((cell, cIdx) => (
                                <div
                                    key={cIdx}
                                    className={`${cellSize}`}
                                    style={{
                                        backgroundColor: cell === 1 ? activeColor : 'transparent',
                                        opacity: cell === 1 ? 1 : 0,
                                        boxShadow: cell === 1 ? `0 0 10px ${activeColor}af, inset 0 0 3px rgba(255, 255, 255, 0.4)` : 'none',
                                        border: cell === 1 ? `1px solid rgba(255, 255, 255, 0.3)` : 'none'
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start p-4 text-white relative font-sans select-none overflow-x-hidden">

            {/* ==================== STANDALONE TEST BAR & CONTROLS ==================== */}
            <header className="w-full max-w-4xl bg-slate-900/90 border border-violet-500/30 rounded-2xl p-3 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-xl z-20">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-violet-400 animate-pulse" />
                    <h1 className="text-xs font-black uppercase tracking-widest text-slate-200">
                        Referência Standalone: Detalhes da Peça & Maestria (1:1 do Site)
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {/* Gold Display */}
                    <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-xl border border-amber-500/30">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-mono font-bold text-amber-200">{profileGold.toLocaleString()}</span>
                    </div>

                    {/* Viewport switch: Desktop / Mobile frame */}
                    <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setViewportMode('desktop')}
                            className={`p-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold uppercase transition-all ${viewportMode === 'desktop' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                            title="Visão Desktop"
                        >
                            <Monitor className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setViewportMode('mobile')}
                            className={`p-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold uppercase transition-all ${viewportMode === 'mobile' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                            title="Visão Mobile"
                        >
                            <Smartphone className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* General Mastery Overview Trigger */}
                    <button
                        onClick={() => {
                            soundManager.playHold();
                            setShowGeneralMasteriesModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                        <Trophy className="w-3.5 h-3.5 text-slate-950" />
                        Maestria Geral
                    </button>
                </div>

                {/* Piece Selection Strip */}
                <div className="w-full flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800/80 no-scrollbar">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                        Selecione a Peça:
                    </span>
                    {exercises.map((p) => {
                        const isSel = p.id === selectedPieceId;
                        return (
                            <button
                                key={p.id}
                                onClick={() => {
                                    soundManager.playMove();
                                    setSelectedPieceId(p.id);
                                    setDetailSlide(0);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase transition-all cursor-pointer shrink-0 border ${isSel
                                        ? 'bg-violet-600/30 border-violet-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                                    }`}
                            >
                                <span>{p.id}</span>
                                <span className="text-[9px] text-slate-400 font-normal">({p.rarity})</span>
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* ============================================================== */}
            {/* 5. CARD DETAILS OVERLAY MODAL (1:1 IMPLEMENTATION FROM SITE) */}
            {/* ============================================================== */}
            <div className={`w-full flex items-center justify-center transition-all duration-300 ${viewportMode === 'mobile' ? 'max-w-[390px] border-4 border-slate-800 rounded-[3rem] p-3 shadow-2xl bg-slate-950' : 'max-w-xl'}`}>
                <div className="relative w-full flex items-center justify-center p-4">

                    {/* Box container */}
                    <motion.div
                        initial={{ scale: 0.95, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        onTouchStart={handleDetailTouchStart}
                        onTouchEnd={handleDetailTouchEnd}
                        className="relative max-w-[420px] w-full bg-gradient-to-b from-[#1a1136] via-[#100a26] to-[#080514] border-2 border-[#a855f7]/60 rounded-[2.2rem] p-5 pt-12 shadow-[0_0_40px_rgba(168,85,247,0.3)] flex flex-col justify-between overflow-visible"
                    >
                        {/* Floating 3D Tetromino header pop-out */}
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-28 rounded-3xl bg-[#140a24] border-2 border-[#a855f7] shadow-[0_0_30px_rgba(168,85,247,0.5)] flex items-center justify-center z-50 transform hover:scale-105 hover:rotate-3 transition-transform duration-300">
                            <div className="w-16 h-16 flex items-center justify-center">
                                {renderTetrominoBlock(ex.id, 'clash')}
                            </div>
                        </div>

                        {/* Close Button at top-right */}
                        <button
                            onClick={() => {
                                soundManager.playHold();
                                onClose();
                            }}
                            className="absolute top-4 right-4 w-7 h-7 bg-black/40 hover:bg-black/60 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer z-50 active:scale-90"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Title & Level Info */}
                        <div className="text-center mt-3">
                            <h3 className="text-[17px] font-black uppercase tracking-widest text-white mt-1 drop-shadow-md">
                                {ex.nome}
                            </h3>
                            <p className="text-[10px] font-mono font-bold text-violet-400 tracking-wider">
                                NÍVEL {currentLvl}
                            </p>
                        </div>

                        {/* Rarity & Type Tags + Mastery Block */}
                        <div className="flex items-stretch justify-between w-full mt-4 gap-3 px-1">
                            {/* RARIDADE Pill */}
                            <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-[#50358c]/45 shadow-[0_4px_10px_rgba(0,0,0,0.5)] h-12 bg-[#140e2a] select-none">
                                <div className="h-[16px] bg-gradient-to-r from-fuchsia-500/70 to-purple-500/70 flex items-center justify-center px-1">
                                    <span className="text-[7.5px] font-black text-white/90 uppercase tracking-widest leading-none">RARIDADE</span>
                                </div>
                                <div className="flex-1 flex items-center justify-center bg-[#0d0722] px-1">
                                    <span className="text-[10.5px] font-black text-white uppercase tracking-wide leading-none">
                                        {ex.rarity === 'Epico' ? 'Épica' : ex.rarity === 'Lendario' ? 'Lendária' : ex.rarity === 'Comum' ? 'Comum' : 'Rara'}
                                    </span>
                                </div>
                            </div>

                            {/* TIPO Pill */}
                            <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-[#50358c]/45 shadow-[0_4px_10px_rgba(0,0,0,0.5)] h-12 bg-[#140e2a] select-none">
                                <div className="h-[16px] bg-gradient-to-r from-fuchsia-500/70 to-purple-500/70 flex items-center justify-center px-1">
                                    <span className="text-[7.5px] font-black text-white/90 uppercase tracking-widest leading-none">TIPO</span>
                                </div>
                                <div className="flex-1 flex items-center justify-center bg-[#0d0722] px-1">
                                    <span className="text-[10.5px] font-black text-white uppercase tracking-wide leading-none truncate max-w-[105px] px-1" title={details.type}>
                                        {details.type ? (details.type.includes(' & ') ? details.type.split(' & ')[0] : details.type) : 'Peça'}
                                    </span>
                                </div>
                            </div>

                            {/* MAESTRIA Square Icon Button */}
                            <div
                                onClick={() => {
                                    soundManager.playHold();
                                    setSelectedMasteryCard(ex.id);
                                }}
                                className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#251749] to-[#0a0518] border-2 border-amber-500/80 p-0.5 shadow-[0_4px_12px_rgba(245,158,11,0.25),_inset_0_1px_3px_rgba(255,255,255,0.15)] flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0 relative group"
                                title={`Maestria: Nível ${masteryProgress.stars}`}
                            >
                                {/* Mastery Emblem Icon */}
                                <Award className="w-7 h-7 text-amber-400 fill-amber-500/10 drop-shadow-[0_2px_6px_rgba(245,158,11,0.35)]" />

                                {/* Floating Tooltip displaying details on hover */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-[#0d0920] border-2 border-yellow-500/80 px-2 py-1.5 rounded-lg shadow-2xl text-center min-w-[95px] pointer-events-none z-50">
                                    <span className="text-[7.5px] font-black text-yellow-400 uppercase tracking-wider">Maestria</span>
                                    <div className="flex gap-0.5 my-0.5">
                                        {[1, 2, 3].map((star) => (
                                            <span key={star} className={`text-[8px] leading-none ${star <= masteryProgress.stars ? 'text-[#ffb703]' : 'text-slate-600'}`}>
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-[6px] font-mono font-bold text-slate-300">Nível {masteryProgress.stars}</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Body with slide page (Favorable/Unfavorable, Stats, Lore) */}
                        <div
                            className="bg-[#05030e]/95 border border-indigo-950/60 rounded-2.5xl p-3.5 min-h-[305px] flex flex-col justify-between mt-3.5 relative overflow-hidden"
                        >
                            <AnimatePresence mode="wait" custom={slideDirection}>
                                <motion.div
                                    key={detailSlide}
                                    custom={slideDirection}
                                    variants={{
                                        enter: (dir: number) => ({
                                            x: dir > 0 ? 100 : -100,
                                            opacity: 0
                                        }),
                                        center: {
                                            x: 0,
                                            opacity: 1
                                        },
                                        exit: (dir: number) => ({
                                            x: dir < 0 ? 100 : -100,
                                            opacity: 0
                                        })
                                    }}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: 'spring', stiffness: 350, damping: 30 },
                                        opacity: { duration: 0.15 }
                                    }}
                                    className="flex-1 flex flex-col justify-between w-full h-full"
                                >
                                    {/* Page 0: Gameplay / Replay Arena Simulation */}
                                    {detailSlide === 0 && (
                                        <div className="flex-1 flex flex-col justify-center items-center">
                                            {(() => {
                                                const isFavorable = replayPhase.startsWith('fav');
                                                const isSpawning = replayPhase.endsWith('spawn');
                                                const scenario = isFavorable ? details.scenarios.favorable : details.scenarios.unfavorable;

                                                // Dynamically pad the original 7x9 grid to a more spacious 9x13 grid
                                                const originalGrid = scenario.grid;
                                                const paddedColsGrid = originalGrid.map(row => [0, 0, ...row, 0, 0]);
                                                const newRow = Array(13).fill(0);
                                                const grid = [
                                                    [...newRow],
                                                    [...newRow],
                                                    ...paddedColsGrid
                                                ];

                                                // Find the minimum row index containing the active piece (cell === 2)
                                                let minR = 0;
                                                for (let r = 0; r < grid.length; r++) {
                                                    if (grid[r].includes(2)) {
                                                        minR = r;
                                                        break;
                                                    }
                                                }

                                                // Determine the piece's skin-specific color inside the details modal
                                                let activeColor = pieceColor;
                                                const activeSkin = pieceSkins[ex.id] || 'neon';
                                                if (activeSkin === 'gameboy') {
                                                    activeColor = 'rgb(34, 197, 94)';
                                                } else if (activeSkin === 'lava') {
                                                    activeColor = 'rgb(239, 68, 68)';
                                                } else if (activeSkin === 'holographic') {
                                                    activeColor = 'rgb(6, 182, 212)';
                                                }

                                                return (
                                                    <div
                                                        className={`w-full flex-1 flex flex-col items-center justify-center rounded-2xl border-2 p-3 transition-all duration-500 ${isFavorable
                                                                ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)] bg-[#070b08]/90'
                                                                : 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)] bg-[#0d0707]/90'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-center w-full mb-2 px-1">
                                                            <span className={`text-[8.5px] font-black uppercase tracking-widest ${isFavorable ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                {scenario.title}
                                                            </span>
                                                            <span className="text-[7.5px] text-slate-400 font-medium">
                                                                {isFavorable ? 'Sucesso absoluto' : 'Risco de obstrução'}
                                                            </span>
                                                        </div>

                                                        {/* Simulated Arena Grid - Expanded to 13 columns, 9 rows */}
                                                        <div
                                                            className="grid gap-[4px] p-2.5 rounded-2xl bg-[#04020a] border border-indigo-950/60 shadow-inner flex items-center justify-center shrink-0"
                                                            style={{
                                                                gridTemplateColumns: 'repeat(13, 24px)',
                                                                gridTemplateRows: 'repeat(9, 24px)'
                                                            }}
                                                        >
                                                            {grid.map((row, rIdx) =>
                                                                row.map((cell, cIdx) => {
                                                                    let customStyle: React.CSSProperties = {};
                                                                    if (cell === 1) {
                                                                        customStyle = { backgroundColor: '#334155', opacity: 0.8, borderRadius: '4px' };
                                                                    } else if (cell === 2) {
                                                                        const spawnTranslate = minR > 0 ? -minR * 28 : -40;
                                                                        customStyle = {
                                                                            backgroundColor: activeColor,
                                                                            boxShadow: `0 0 10px ${activeColor}, inset 0 0 4px rgba(255, 255, 255, 0.8)`,
                                                                            border: '2px solid rgba(255, 255, 255, 0.6)',
                                                                            borderRadius: '4px',
                                                                            transform: isSpawning ? `translateY(${spawnTranslate}px)` : 'translateY(0)',
                                                                            opacity: isSpawning ? 0.85 : 1,
                                                                            transition: isSpawning ? 'none' : 'transform 0.9s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease'
                                                                        };
                                                                    }
                                                                    return (
                                                                        <div
                                                                            key={`${rIdx}-${cIdx}`}
                                                                            className={`rounded-[4px] transition-all duration-300 ${cell === 0 ? 'bg-indigo-950/15' : ''}`}
                                                                            style={{ width: '24px', height: '24px', ...customStyle }}
                                                                        />
                                                                    );
                                                                })
                                                            )}
                                                        </div>

                                                        <p className="text-[8px] text-slate-300 leading-snug text-center mt-2 pl-1 pr-1 font-medium">
                                                            {scenario.desc}
                                                        </p>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {/* Page 1: Statistics / Atributos */}
                                    {detailSlide === 1 && (
                                        <div className="flex-1 flex flex-col justify-center gap-2">
                                            <h4 className="text-[8.5px] font-black text-violet-400 uppercase tracking-widest pl-0.5">Estatísticas</h4>
                                            <div className="space-y-1.5">
                                                {(() => {
                                                    return details.stats.map((originalStat) => {
                                                        const stat = { ...originalStat };
                                                        const labelLower = stat.label.toLowerCase();

                                                        if (labelLower === 'poder de limpeza') {
                                                            stat.label = 'Quadrados';
                                                            stat.icon = '⬜';
                                                            const numSquares = ex.id === 'X' ? 5 : 4;
                                                            stat.value = numSquares;
                                                            stat.max = 5;
                                                            stat.desc = `Esta peça possui exatamente ${numSquares} quadrados conectados em sua estrutura básica.`;
                                                        } else if (labelLower === 'flexibilidade srs') {
                                                            let numPositions = 2;
                                                            if (ex.id === 'L' || ex.id === 'J' || ex.id === 'T') {
                                                                numPositions = 4;
                                                            } else if (ex.id === 'O' || ex.id === 'X') {
                                                                numPositions = 1;
                                                            }

                                                            if (numPositions === 4) {
                                                                stat.desc = `Possui 4 possibilidades/posições diferentes ao rotacionar (as peças L, J e T possuem muitas posições diferentes).`;
                                                            } else if (numPositions === 2) {
                                                                stat.desc = `Possui apenas 2 posições diferentes ao rotacionar (vertical e horizontal).`;
                                                            } else {
                                                                stat.desc = `Possui apenas 1 única posição ao rotacionar (simetria perfeita).`;
                                                            }
                                                        } else if (labelLower === 'multiplicador de combo') {
                                                            stat.label = 'Versatilidade';
                                                            stat.icon = '🧩';
                                                            if (ex.id === 'I') {
                                                                stat.desc = `Extremamente útil para abrir colunas obstruídas e realizar finalizações de até 4 linhas simultâneas.`;
                                                            } else if (ex.id === 'O') {
                                                                stat.desc = `Perfeita para preencher depressões de tamanho 2x2 e manter a estabilidade horizontal da Arena.`;
                                                            } else if (ex.id === 'T') {
                                                                stat.desc = `Altamente útil para encaixes táticos (T-Spin) em fendas fechadas com bônus incríveis de pontos.`;
                                                            } else if (ex.id === 'S' || ex.id === 'Z') {
                                                                stat.desc = `Ideal para transições suaves de altura, conexões diagonais e nivelamento de ladeiras.`;
                                                            } else if (ex.id === 'J' || ex.id === 'L') {
                                                                stat.desc = `Excelente para preencher cantos vazios e contornar fendas de relevo irregular nas laterais.`;
                                                            } else {
                                                                stat.desc = `A melhor peça de salvamento tático, detonando blocos de lixo cinzas em situações críticas.`;
                                                            }
                                                        }
                                                        return stat;
                                                    });
                                                })().map((stat, sIdx) => {
                                                    let valueDisplay = `${stat.value}/${stat.max}`;
                                                    if (stat.label === 'Quadrados') {
                                                        valueDisplay = `${stat.value}`;
                                                    } else if (stat.label === 'Flexibilidade SRS') {
                                                        if (stat.value <= 20) valueDisplay = 'Baixa';
                                                        else if (stat.value <= 65) valueDisplay = 'Média';
                                                        else if (stat.value <= 85) valueDisplay = 'Alta';
                                                        else valueDisplay = 'Muito alta';
                                                    } else if (stat.label === 'Versatilidade') {
                                                        if (stat.value <= 50) valueDisplay = 'Baixa';
                                                        else if (stat.value <= 65) valueDisplay = 'Média';
                                                        else if (stat.value <= 85) valueDisplay = 'Alta';
                                                        else valueDisplay = 'Muito alta';
                                                    }

                                                    return (
                                                        <div key={sIdx} className="space-y-0.5">
                                                            <div className="flex justify-between items-center text-[8.5px]">
                                                                <span className="text-slate-300 font-bold flex items-center gap-1">
                                                                    <span className="text-[10px]">{stat.icon}</span>
                                                                    <span>{stat.label}</span>
                                                                </span>
                                                                <span className="font-mono font-black text-white">{valueDisplay}</span>
                                                            </div>
                                                            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                                                <div
                                                                    className="h-full rounded-full transition-all duration-500"
                                                                    style={{
                                                                        width: `${(stat.value / stat.max) * 100}%`,
                                                                        backgroundColor: pieceColor,
                                                                        boxShadow: `0 0 8px ${pieceColor}`
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="block text-[7.5px] text-slate-400 font-medium leading-none pl-1">
                                                                {stat.desc}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Page 2: Lore / Trivia / Curiosidades */}
                                    {detailSlide === 2 && (
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-1 text-[8.5px] font-black text-[#a855f7] uppercase tracking-widest">
                                                    <span>🔮</span>
                                                    <span>Origem & Segredos</span>
                                                </div>
                                                <p className="italic text-[9.5px] text-slate-300 leading-normal font-medium bg-[#140a24]/40 p-2 rounded-xl border border-indigo-950">
                                                    "{details.lore}"
                                                </p>
                                            </div>

                                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-2 mt-2 flex items-start gap-1.5">
                                                <span className="text-[11px] leading-none shrink-0">💡</span>
                                                <div className="space-y-0.5">
                                                    <span className="block text-[7.5px] font-black text-amber-400 uppercase tracking-wider">Você sabia?</span>
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
                            {[0, 1, 2].map((idx) => (
                                <button
                                    key={idx}
                                    onClick={() => changeSlide(idx)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${detailSlide === idx
                                            ? 'bg-[#a855f7] scale-130 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                                            : 'bg-slate-700 hover:bg-slate-600'
                                        }`}
                                    title={`Página ${idx + 1}`}
                                />
                            ))}
                        </div>

                        {/* Individual Skins & Coins Upgrade Control Row */}
                        <div className="flex gap-2.5 mt-3 select-none">
                            {/* Skin Selector Icon Button (Just an Icon) */}
                            <button
                                onClick={() => {
                                    setIsPieceSkinSelectorOpen(true);
                                    soundManager.playMove();
                                }}
                                className="w-12 h-12 rounded-2xl bg-[#090615]/80 hover:bg-[#140e2a] border-2 border-[#a855f7]/50 hover:border-[#a855f7] flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-[0_3px_0_#4c1d95] shrink-0 relative group"
                                title="Mudar Visual da Peça"
                            >
                                <Palette className="w-5.5 h-5.5 text-violet-400 group-hover:text-violet-300 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" />

                                {/* Active skin colored dot indicator */}
                                {(() => {
                                    const currentSkin = pieceSkins[ex.id] || 'neon';
                                    const skinColorMap: Record<string, string> = {
                                        neon: 'bg-indigo-500',
                                        gameboy: 'bg-emerald-500',
                                        lava: 'bg-red-500',
                                        holographic: 'bg-cyan-400'
                                    };
                                    return (
                                        <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${skinColorMap[currentSkin] || 'bg-indigo-500'} border border-white/25`} />
                                    );
                                })()}
                            </button>

                            {/* Coins Upgrade Button */}
                            {(() => {
                                const upgradeCost = Math.round(50 * Math.pow(1.5, currentLvl));
                                const canUpgrade = profileGold >= upgradeCost;

                                return (
                                    <button
                                        onClick={() => {
                                            if (canUpgrade) {
                                                soundManager.playLevelUp();
                                                onUpgradeCard(ex.id, upgradeCost);
                                                showToast(`Melhorou a peça ${ex.nome} para o nível ${currentLvl + 1}!`, 'success');
                                            } else {
                                                soundManager.playHold();
                                                showToast('Moedas insuficientes!', 'error');
                                            }
                                        }}
                                        className={`flex-1 flex flex-col justify-center items-center py-2 px-3 rounded-2xl cursor-pointer transition-all active:translate-y-0.5 shadow-md border ${canUpgrade
                                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 border-yellow-400 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_3px_0_#b45309]'
                                                : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-65 shadow-none cursor-not-allowed'
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
                                );
                            })()}
                        </div>

                        {/* Interface de Skins Overlay */}
                        <AnimatePresence>
                            {isPieceSkinSelectorOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 15 }}
                                    className="absolute inset-0 bg-[#0c0822]/98 backdrop-blur-md z-[60] p-5 flex flex-col justify-between border-2 border-[#a855f7]/60 rounded-[2.2rem]"
                                >
                                    <div>
                                        {/* Header */}
                                        <div className="flex justify-between items-center border-b border-indigo-950/60 pb-3 mt-1">
                                            <div className="flex items-center gap-2">
                                                <Palette className="w-5 h-5 text-violet-400" />
                                                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                                                    Visuais Desbloqueados
                                                </h4>
                                            </div>
                                            <button
                                                onClick={() => setIsPieceSkinSelectorOpen(false)}
                                                className="text-slate-400 hover:text-white font-bold text-xs uppercase cursor-pointer transition-colors"
                                            >
                                                Fechar
                                            </button>
                                        </div>

                                        {/* List of Unlocked Skins */}
                                        <div className="space-y-2.5 mt-4 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                                            {(() => {
                                                const skinsList = [
                                                    { id: 'neon', name: 'Neon Padrão', desc: 'Brilho laser futurista original.', color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' },
                                                    { id: 'gameboy', name: 'Retro Gameboy', desc: 'Pixel verde clássico nostálgico dos anos 80.', color: '#15803d', glow: 'rgba(21, 128, 61, 0.4)' },
                                                    { id: 'lava', name: 'Lava Vulcânica', desc: 'Fluorescente com brilhos de magma.', color: '#b91c1c', glow: 'rgba(185, 28, 28, 0.4)' },
                                                    { id: 'holographic', name: 'Holográfico Elite', desc: 'Prismático futurista refinado brilhante.', color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' }
                                                ];

                                                return (
                                                    <>
                                                        {skinsList.map(sk => {
                                                            const isSelected = (pieceSkins[ex.id] || 'neon') === sk.id;

                                                            return (
                                                                <div
                                                                    key={sk.id}
                                                                    onClick={() => {
                                                                        setPieceSkins(prev => ({ ...prev, [ex.id]: sk.id }));
                                                                        soundManager.playMove();
                                                                        showToast(`Visual ${sk.name} aplicado!`, 'success');
                                                                    }}
                                                                    className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                                                                            ? 'border-violet-500 bg-violet-950/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                                                                            : 'border-indigo-950/40 hover:border-indigo-900 bg-slate-950/30'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-2.5">
                                                                        {/* Small Colored Preview Block */}
                                                                        <div
                                                                            className="w-7 h-7 rounded-lg border border-white/25 flex items-center justify-center shrink-0"
                                                                            style={{
                                                                                backgroundColor: sk.color,
                                                                                boxShadow: `0 0 8px ${sk.glow}`
                                                                            }}
                                                                        >
                                                                            <span className="text-white text-[9px] font-black">{ex.id}</span>
                                                                        </div>

                                                                        <div className="text-left">
                                                                            <span className="block text-[9.5px] font-black text-white uppercase tracking-wide">
                                                                                {sk.name}
                                                                            </span>
                                                                            <span className="block text-[7px] text-slate-400 leading-tight">
                                                                                {sk.desc}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="shrink-0">
                                                                        {isSelected ? (
                                                                            <span className="bg-violet-500/15 text-violet-400 text-[6.5px] font-black uppercase px-2 py-0.5 rounded-full border border-violet-500/30">
                                                                                Equipado
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-slate-400 text-[6.5px] font-bold uppercase hover:text-white">
                                                                                Equipar
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setIsPieceSkinSelectorOpen(false)}
                                        className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-[0_3px_0_#4c1d95] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center cursor-pointer mt-3"
                                    >
                                        Confirmar
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </motion.div>
                </div>
            </div>

            {/* ============================================================== */}
            {/* 6. GENERAL MASTERY OVERVIEW MODAL (1:1 IMPLEMENTATION) */}
            {/* ============================================================== */}
            <AnimatePresence>
                {showGeneralMasteriesModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center pt-12 pb-6 px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 cursor-pointer"
                            onClick={() => setShowGeneralMasteriesModal(false)}
                        />

                        <motion.div
                            initial={{ scale: 0.92, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.92, y: 20 }}
                            className="relative z-50 w-full max-w-lg bg-slate-900/95 backdrop-blur-xl border-2 border-indigo-500/40 rounded-[2.5rem] shadow-[0_24px_60px_rgba(0,0,0,0.95)] pt-8 pb-7 px-6 text-white max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col justify-between animate-fadeIn"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3.5 mb-4 select-none relative w-full">
                                <span className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                    <Trophy className="w-5 h-5 text-indigo-400 fill-indigo-400/10" /> Maestria Geral
                                </span>
                                <button
                                    onClick={() => {
                                        soundManager.playHold();
                                        setShowGeneralMasteriesModal(false);
                                    }}
                                    className="w-8 h-8 rounded-xl bg-gradient-to-b from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 border-2 border-b-4 border-red-900 text-white font-black flex items-center justify-center cursor-pointer shadow-md transition-all hover:scale-105 active:scale-95 active:border-b-2"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Subtitle / Stars summary */}
                            <div className="text-center mt-2 mb-5 space-y-1">
                                <div className="inline-flex items-center gap-1.5 bg-slate-950/60 border border-indigo-500/15 px-3 py-1 rounded-full">
                                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                                    <span className="text-[11px] font-black text-slate-200 font-mono">
                                        {Object.values(cardMasteries).reduce((acc: number, cur: any) => acc + (cur.stars || 0), 0)} / 24 DOMÍNIOS CONCLUÍDOS
                                    </span>
                                </div>
                                <p className="text-[9.5px] text-slate-300 font-medium max-w-sm mx-auto leading-normal pt-1">
                                    Conclua as tarefas de cada peça para evoluir suas estrelas de maestria e faturar tesouros de ouro e gemas!
                                </p>
                            </div>

                            {/* Grid of Tetromino Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {exercises.map((cardItem) => {
                                    const cardId = cardItem.id;
                                    const card = cardMasteries[cardId] || { stars: 0, rarity: cardItem.rarity, nome: cardItem.nome };
                                    const isAllCompleted = card.stars >= 3;

                                    return (
                                        <div
                                            key={cardId}
                                            onClick={() => {
                                                soundManager.playHold();
                                                setSelectedMasteryCard(cardId);
                                            }}
                                            className={`relative transform hover:scale-[1.03] transition-all duration-200 cursor-pointer rounded-2xl border flex flex-col justify-between overflow-hidden h-40 ${card.rarity === 'Lendario'
                                                    ? 'border-amber-500/30 bg-slate-950/60 shadow-[0_0_12px_rgba(245,158,11,0.08)]'
                                                    : card.rarity === 'Epico'
                                                        ? 'border-purple-500/30 bg-slate-950/60 shadow-[0_0_12px_rgba(168,85,247,0.08)]'
                                                        : card.rarity === 'Raro'
                                                            ? 'border-blue-500/30 bg-slate-950/60 shadow-[0_0_12px_rgba(59,130,246,0.08)]'
                                                            : 'border-slate-800/80 bg-slate-950/60'
                                                }`}
                                        >
                                            {/* Rarity Header */}
                                            <div className={`text-[7.5px] uppercase py-0.5 tracking-widest text-center bg-black/35 font-black ${card.rarity === 'Lendario' ? 'text-amber-400' : card.rarity === 'Epico' ? 'text-purple-400' : card.rarity === 'Raro' ? 'text-blue-400' : 'text-slate-400'
                                                }`}>
                                                {card.rarity}
                                            </div>

                                            {/* Card Image Block */}
                                            <div className="flex-1 bg-slate-950/40 flex items-center justify-center p-3 min-h-[70px] relative">
                                                <div className="relative z-10 w-full h-full flex items-center justify-center">
                                                    {renderCardTetromino(cardId, pieceSkins[cardId] || 'neon')}
                                                </div>
                                            </div>

                                            {/* Info Block */}
                                            <div className="p-2 bg-slate-950/90 text-center flex flex-col gap-1 rounded-b-xl border-t border-indigo-950/50 shrink-0">
                                                <div className="text-[10px] font-black uppercase text-slate-100 truncate">
                                                    Peça {cardId}
                                                </div>

                                                {/* Stars */}
                                                {renderThreeMasteryIcons(card.stars || 0, "w-3 h-3")}

                                                {/* Completed tag */}
                                                <div className="text-[7px] font-extrabold uppercase mt-0.5">
                                                    {isAllCompleted ? (
                                                        <span className="text-amber-400">👑 MAXIMIZADA</span>
                                                    ) : (
                                                        <span className="text-slate-400 font-medium">Em progresso</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ============================================================== */}
            {/* 7. INDIVIDUAL MASTERY MODAL (1:1 IMPLEMENTATION) */}
            {/* ============================================================== */}
            <AnimatePresence>
                {selectedMasteryCard && (() => {
                    const cardId = selectedMasteryCard;
                    const card = cardMasteries[cardId] || cardMasteries['I'];
                    if (!card) return null;

                    return (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center pt-12 pb-6 px-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/90 backdrop-blur-md z-40 cursor-pointer"
                                onClick={() => setSelectedMasteryCard(null)}
                            />

                            <motion.div
                                initial={{ scale: 0.92, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.92, y: 20 }}
                                className="relative z-50 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-2 border-indigo-500/40 rounded-[2.5rem] shadow-[0_24px_60px_rgba(0,0,0,0.95)] pt-8 pb-7 px-6 text-white min-h-[85vh] max-h-[94vh] overflow-y-auto no-scrollbar flex flex-col justify-between animate-fadeIn"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div>
                                    {/* Header */}
                                    <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3.5 mb-4 select-none relative w-full">
                                        <span className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                            <Award className="w-5 h-5 text-indigo-400 fill-indigo-400/10" /> Maestria Individual
                                        </span>
                                        <button
                                            onClick={() => {
                                                soundManager.playHold();
                                                setSelectedMasteryCard(null);
                                            }}
                                            className="w-8 h-8 rounded-xl bg-gradient-to-b from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 border-2 border-b-4 border-red-900 text-white font-black flex items-center justify-center cursor-pointer shadow-md transition-all hover:scale-105 active:scale-95 active:border-b-2"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Top layout showing Card & Title */}
                                    <div className="flex items-center gap-4 mt-2 mb-6 select-none bg-[#111322]/90 p-4 rounded-2xl border border-slate-800/80 shadow-inner text-left">
                                        {/* The Piece Card with responsive style */}
                                        <div className="w-20 h-24 rounded-2xl border border-slate-800 bg-[#07080f] flex flex-col justify-between overflow-hidden relative p-1 shrink-0">
                                            <div className="text-[6px] font-black uppercase tracking-wider text-slate-300 text-center py-0.5 bg-black/10">
                                                {card.rarity}
                                            </div>
                                            <div className="flex-1 bg-slate-950/80 flex items-center justify-center p-1.5 rounded-md">
                                                {renderCardTetromino(cardId, pieceSkins[cardId] || 'neon')}
                                            </div>
                                            <div className="bg-black/30 py-0.5 text-center">
                                                <span className="text-[8px] font-black tracking-wide text-white uppercase">
                                                    Peça {cardId}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Text block: name, description and stars */}
                                        <div className="flex-1">
                                            <span className="text-[8px] font-black text-[#38bdf8] uppercase tracking-widest">DOMÍNIO ATIVO</span>
                                            <h4 className="text-sm font-black text-white uppercase tracking-wide leading-tight mt-0.5">
                                                {card.nome}
                                            </h4>

                                            {/* Stars */}
                                            <div className="flex justify-start mt-2">
                                                {renderThreeMasteryIcons(card.stars || 0, "w-5 h-5")}
                                            </div>

                                            <div className="text-[8px] text-slate-400 font-mono mt-1 font-bold">
                                                {card.stars || 0}/3 domínios dominados
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vertically Listed 3 Domains with gap-4 */}
                                    <div className="flex flex-col gap-4 relative">
                                        {card.domains && card.domains.map((dom: any, dIdx: number) => {
                                            const isUnlocked = dIdx === 0 || (card.domains[dIdx - 1] && card.domains[dIdx - 1].stages && card.domains[dIdx - 1].stages.every((stg: any) => stg.completed));
                                            const isFullyCompleted = dom.stages && dom.stages.every((stg: any) => stg.completed);

                                            const activeStageIndex = dom.stages ? dom.stages.findIndex((stg: any) => !stg.completed) : -1;
                                            const activeStage = dom.stages && activeStageIndex !== -1 ? dom.stages[activeStageIndex] : null;
                                            const isProgress = isUnlocked && !isFullyCompleted && activeStage;
                                            const activePercent = activeStage ? Math.round((activeStage.current / activeStage.target) * 100) : 0;

                                            return (
                                                <div key={dom.id} className="relative">
                                                    {/* Locked State */}
                                                    {!isUnlocked && (
                                                        <div className="bg-slate-950/40 border border-indigo-950/50 rounded-2xl p-4 flex items-center gap-3 text-slate-500 opacity-60 text-left">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/30 flex items-center justify-center text-slate-500 shrink-0">
                                                                <Lock className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1 text-left">
                                                                <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block">Domínio {dom.id}</span>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase leading-none mt-0.5 block">{dom.title}</span>
                                                                <span className="text-[7.5px] font-bold text-slate-500 leading-normal mt-0.5 block">Complete as tarefas do domínio anterior para desbloquear esta maestria.</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Completed State */}
                                                    {isUnlocked && isFullyCompleted && (
                                                        <div className="bg-gradient-to-r from-[#0d221c]/90 via-[#061713]/80 to-[#030c11]/90 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden text-slate-200 text-left">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                                                                    {(() => {
                                                                        const IconComp = getLucideIconForEmoji(dom.icon);
                                                                        return <IconComp className="w-5.5 h-5.5" />;
                                                                    })()}
                                                                </div>
                                                                <div className="text-left">
                                                                    <div className="text-[8px] font-extrabold text-emerald-400/80 uppercase tracking-widest leading-none">Domínio {dom.id} - COMPLETO</div>
                                                                    <div className="text-[10.5px] font-black uppercase tracking-wide leading-none mt-1 text-emerald-100">
                                                                        {dom.title}
                                                                    </div>
                                                                    <div className="text-[8.5px] text-slate-400 font-medium leading-normal mt-1 max-w-[210px]">
                                                                        {dom.desc}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col items-center justify-center text-center shrink-0 min-w-[50px]">
                                                                <span className="text-[7.5px] font-black text-emerald-400 tracking-wider">MÁXIMO</span>
                                                                <div className="mt-1">
                                                                    {dom.id === 1 ? (
                                                                        <Award className="w-6 h-6 text-amber-600 fill-amber-600/10 drop-shadow-[0_2px_4px_rgba(217,119,6,0.35)]" />
                                                                    ) : dom.id === 2 ? (
                                                                        <Trophy className="w-6 h-6 text-slate-300 fill-slate-300/10 drop-shadow-[0_2px_4px_rgba(148,163,184,0.35)]" />
                                                                    ) : (
                                                                        <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400/10 drop-shadow-[0_2px_4px_rgba(250,204,21,0.35)]" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Progress / Active State */}
                                                    {isProgress && activeStage && (
                                                        <div className="bg-[#120a22]/90 border border-indigo-500/30 rounded-2xl p-5 flex flex-col gap-3 shadow-xl relative overflow-hidden text-slate-100 text-left">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center text-[#38bdf8] shadow-inner shrink-0">
                                                                        {(() => {
                                                                            const IconComp = getLucideIconForEmoji(dom.icon);
                                                                            return <IconComp className="w-5.5 h-5.5" />;
                                                                        })()}
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <div className="text-[8px] font-black text-indigo-300 uppercase tracking-wider leading-none">Domínio {dom.id} - Estágio {activeStage.stage}/3</div>
                                                                        <div className="text-[10.5px] font-black uppercase tracking-wide leading-none text-white mt-1">
                                                                            {dom.title}
                                                                        </div>
                                                                        <p className="text-[8.5px] text-slate-300 font-medium leading-normal mt-0.5 max-w-[210px]">
                                                                            {dom.desc}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Stage indicator display */}
                                                                <div className="flex flex-col items-center justify-center bg-indigo-950/60 px-2.5 py-1 rounded-xl border border-indigo-500/20 shrink-0 select-none">
                                                                    <span className="text-[6.5px] font-black text-indigo-300 uppercase">ESTÁGIO</span>
                                                                    <span className="text-sm font-black text-[#38bdf8] leading-none">{activeStage.stage}</span>
                                                                </div>
                                                            </div>

                                                            {/* Progress bar and simulated training action */}
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-[8px] text-slate-400 font-bold font-mono">
                                                                    <span>PROGRESSO</span>
                                                                    <span className="text-indigo-300">{activeStage.current}/{activeStage.target} ({activePercent}%)</span>
                                                                </div>
                                                                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-indigo-950/40">
                                                                    <div
                                                                        className="bg-gradient-to-r from-[#38bdf8] to-indigo-500 h-full transition-all duration-300 border-r border-cyan-400"
                                                                        style={{ width: `${activePercent}%` }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-indigo-950/40">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-[9px] font-bold text-slate-400">Recompensa:</span>
                                                                    <span className="text-[9.5px] font-extrabold flex items-center gap-1 bg-indigo-950/55 px-2 py-0.5 rounded-md text-indigo-200 border border-indigo-500/20 shadow-inner">
                                                                        {activeStage.rewardType === 'gold' ? (
                                                                            <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-500/10 shrink-0 animate-pulse" />
                                                                        ) : (
                                                                            <Gem className="w-3.5 h-3.5 text-[#38bdf8] fill-[#38bdf8]/10 shrink-0 animate-pulse" />
                                                                        )}
                                                                        {activeStage.rewardValue}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        soundManager.playHold();
                                                                        handleAdvanceTask(cardId, dom.id);
                                                                    }}
                                                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-[8px] uppercase py-1.5 px-3.5 rounded-xl border border-indigo-400/30 shadow-md active:scale-95 transition-all cursor-pointer"
                                                                >
                                                                    + Simular Treino
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Bottom Shield Info Banner */}
                                <div className="bg-[#111322]/80 border border-slate-800/80 py-3.5 px-4 rounded-2xl flex flex-col items-center justify-center gap-2 mt-5 text-slate-300 text-[10px] font-medium leading-relaxed shadow-lg text-center relative select-none">
                                    <Info className="w-5 h-5 text-[#38bdf8] shrink-0" />
                                    <span className="max-w-[280px] text-[9.5px] text-slate-300 font-medium text-center">
                                        Cada tarefa de domínio completada garante melhorias no emblema de domínio e recursos valiosos!
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                    );
                })()}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 border ${toastType === 'success'
                                ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
                                : 'bg-rose-950/95 border-rose-500 text-rose-200'
                            }`}
                    >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default DetalhesPecaStandalone;
