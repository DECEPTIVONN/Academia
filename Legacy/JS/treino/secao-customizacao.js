import { loadDB, saveDB } from './db.js';
import { showToast } from './db.js';

// ============================================================
// CATÁLOGOS DE ITENS
// ============================================================

export const BANNERS = [
  { key: 'roxo-neon',   nome: 'Roxo Neon',     unlock: null,                    hint: 'Padrão' },
  { key: 'aurora',      nome: 'Aurora',         unlock: null,                    hint: 'Padrão' },
  { key: 'fogo-eterno', nome: 'Fogo Eterno',    unlock: { tipo: 'streak', val: 7  }, hint: '7 dias seguidos' },
  { key: 'ouro-elite',  nome: 'Ouro Elite',     unlock: { tipo: 'treinos', val: 30 }, hint: '30 treinos' },
  { key: 'ciberespaco', nome: 'Ciberespaço',    unlock: { tipo: 'treinos', val: 50 }, hint: '50 treinos' },
  { key: 'shadow-ops',  nome: 'Shadow Ops',     unlock: { tipo: 'treinos', val: 100 }, hint: '100 treinos' },
  { key: 'aco-frio',    nome: 'Aço Frio',       unlock: { tipo: 'maestria', val: 'prata' }, hint: 'Maestria Prata' },
  { key: 'dragao-ouro', nome: 'Dragão de Ouro', unlock: { tipo: 'maestria', val: 'ouro'  }, hint: 'Maestria Ouro' },
  // Animados (originais)
  { key: 'plasma',      nome: 'Plasma Elétrico',unlock: { tipo: 'treinos', val: 50 },  hint: '50 treinos',      animated: true },
  { key: 'aurora-viva', nome: 'Aurora Viva',    unlock: { tipo: 'streak',  val: 7  },  hint: '7 dias seguidos', animated: true },
  { key: 'vulcao',      nome: 'Vulcão',         unlock: { tipo: 'streak',  val: 30 },  hint: '30 dias',         animated: true },
  { key: 'matrix',      nome: 'Matrix',         unlock: { tipo: 'treinos', val: 100 }, hint: '100 treinos',     animated: true },
  { key: 'nebulosa',    nome: 'Nebulosa',       unlock: { tipo: 'treinos', val: 100 }, hint: '100 treinos',     animated: true },
  // ── Coleção Extra (importados de Banner.html) ──────────────────────────────
  // Tier Padrão Extra
  { key: 'lava-vulcao',      nome: 'Lava Vulcão',     unlock: { tipo: 'streak',  val: 5  }, hint: '5 dias seguidos',  animated: true },
  { key: 'matrix-grid',      nome: 'Matrix Grid',     unlock: { tipo: 'treinos', val: 20 }, hint: '20 treinos',       animated: true },
  { key: 'glacial',          nome: 'Glacial',         unlock: { tipo: 'treinos', val: 15 }, hint: '15 treinos' },
  { key: 'gold-rush',        nome: 'Gold Rush',       unlock: { tipo: 'treinos', val: 30 }, hint: '30 treinos',       animated: true },
  { key: 'titan-core',       nome: 'Titan Core',      unlock: { tipo: 'treinos', val: 10 }, hint: '10 treinos' },
  { key: 'nebulosa-galatica',nome: 'Nebulosa Galáctica', unlock: { tipo: 'treinos', val: 40 }, hint: '40 treinos', animated: true },
  { key: 'stealth-ops-v2',   nome: 'Stealth Ops II',  unlock: { tipo: 'treinos', val: 25 }, hint: '25 treinos',       animated: true },
  // Tier Avançado Extra
  { key: 'cyber-pulse-v2',   nome: 'Cyber Pulse',     unlock: { tipo: 'treinos', val: 45 }, hint: '45 treinos',       animated: true },
  { key: 'solar-flare',      nome: 'Solar Flare',     unlock: { tipo: 'streak',  val: 14 }, hint: '14 dias seguidos', animated: true },
  { key: 'deep-void',        nome: 'Deep Void',       unlock: { tipo: 'treinos', val: 60 }, hint: '60 treinos',       animated: true },
  { key: 'biohazard',        nome: 'Biohazard',       unlock: { tipo: 'treinos', val: 55 }, hint: '55 treinos',       animated: true },
  { key: 'bloodline-v2',     nome: 'Bloodline',       unlock: { tipo: 'streak',  val: 21 }, hint: '21 dias seguidos', animated: true },
  { key: 'starlight',        nome: 'Starlight',       unlock: { tipo: 'treinos', val: 70 }, hint: '70 treinos',       animated: true },
  { key: 'inferno-engine',   nome: 'Inferno Engine',  unlock: { tipo: 'streak',  val: 30 }, hint: '30 dias seguidos', animated: true },
  { key: 'quantum-weaver',   nome: 'Quantum Weaver',  unlock: { tipo: 'treinos', val: 80 }, hint: '80 treinos',       animated: true },
  { key: 'stormbringer',     nome: 'Stormbringer',    unlock: { tipo: 'treinos', val: 75 }, hint: '75 treinos',       animated: true },
  { key: 'void-reaver',      nome: 'Void Reaver',     unlock: { tipo: 'maestria', val: 'prata' }, hint: 'Maestria Prata', animated: true },
  { key: 'emerald-dragon',   nome: 'Emerald Dragon',  unlock: { tipo: 'treinos', val: 90 }, hint: '90 treinos',       animated: true },
  // Tier Master (10 banners premium)
  { key: 'dragon-breath',    nome: 'Dragon Breath',   unlock: { tipo: 'treinos', val: 150 }, hint: '150 treinos',     animated: true, master: true },
  { key: 'neon-samurai',     nome: 'Neon Samurai',    unlock: { tipo: 'streak',  val: 60  }, hint: '60 dias seguidos',animated: true, master: true },
  { key: 'ghost-protocol',   nome: 'Ghost Protocol',  unlock: { tipo: 'treinos', val: 200 }, hint: '200 treinos',     animated: true, master: true },
  { key: 'bloodline-pulse',  nome: 'Bloodline Pulse', unlock: { tipo: 'streak',  val: 90  }, hint: '90 dias seguidos',animated: true, master: true },
  { key: 'solar-eclipse',    nome: 'Solar Eclipse',   unlock: { tipo: 'maestria', val: 'ouro' }, hint: 'Maestria Ouro', animated: true, master: true },
  { key: 'cyber-iris',       nome: 'Cyber Iris',      unlock: { tipo: 'treinos', val: 250 }, hint: '250 treinos',     animated: true, master: true },
  { key: 'frozen-throne',    nome: 'Frozen Throne',   unlock: { tipo: 'treinos', val: 175 }, hint: '175 treinos',     animated: true, master: true },
  { key: 'nuclear-winter',   nome: 'Nuclear Winter',  unlock: { tipo: 'streak',  val: 45  }, hint: '45 dias seguidos',animated: true, master: true },
  { key: 'dimension-warp',   nome: 'Dimension Warp',  unlock: { tipo: 'treinos', val: 300 }, hint: '300 treinos',     animated: true, master: true },
  { key: 'ancient-rune',     nome: 'Ancient Rune',    unlock: { tipo: 'maestria', val: 'ouro' }, hint: 'Maestria Ouro', animated: true, master: true },
  // Variante plasma cônico (animação de rotação com conic-gradient)
  { key: 'plasma-conico',    nome: 'Plasma Cônico',   unlock: { tipo: 'treinos', val: 120 }, hint: '120 treinos',     animated: true, master: true },
];

export const EMBLEMAS = [
  { id: 'novato',        nome: 'Novato',         icon: '🥋', unlock: null },
  { id: 'dedicado',      nome: 'Dedicado',        icon: '💪', unlock: { tipo: 'treinos', val: 10 } },
  { id: 'veterano',      nome: 'Veterano',        icon: '🎖️', unlock: { tipo: 'treinos', val: 30 } },
  { id: 'lendario',      nome: 'Lendário',        icon: '👑', unlock: { tipo: 'treinos', val: 100 } },
  { id: 'chama7',        nome: 'Chama 7',         icon: '🔥', unlock: { tipo: 'streak', val: 7 } },
  { id: 'chama30',       nome: 'Chama Eterna',    icon: '⚡', unlock: { tipo: 'streak', val: 30 } },
  { id: 'forca',         nome: 'Força',           icon: '🏋️', unlock: { tipo: 'xp', val: 100 } },
  { id: 'cardio',        nome: 'Cardio',          icon: '🏃', unlock: { tipo: 'xp', val: 250 } },
  { id: 'bronze',        nome: 'Elite Bronze',    icon: '🥉', unlock: { tipo: 'maestria', val: 'bronze' } },
  { id: 'prata',         nome: 'Elite Prata',     icon: '🥈', unlock: { tipo: 'maestria', val: 'prata' } },
  { id: 'ouro',          nome: 'Elite Ouro',      icon: '🥇', unlock: { tipo: 'maestria', val: 'ouro' } },
  { id: 'academia',      nome: 'Academia PRO',    icon: '🏆', unlock: { tipo: 'treinos', val: 50 } },
  // Animados
  { id: 'chama-eterna-anim', nome: 'Chama Eterna',    icon: '🔥', unlock: { tipo: 'streak', val: 30 }, animated: true, animationType: 'flicker' },
  { id: 'lendario-anim',     nome: 'O Lendário',      icon: '👑', unlock: { tipo: 'treinos', val: 100 }, animated: true, animationType: 'pulse-glow' },
  { id: 'elite-ouro-anim',   nome: 'Maestria Máxima', icon: '🥇', unlock: { tipo: 'maestria', val: 'ouro' }, animated: true, animationType: 'spin-slow' },
  { id: 'prestige-anim',     nome: 'Prestígio',       icon: '⭐', unlock: { tipo: 'treinos', val: 100 }, animated: true, animationType: 'pulse-glow' },
];

export const TITULOS = [
  { id: null,              nome: 'Sem Título',         unlock: null },
  { id: 'iniciante',       nome: 'Iniciante',          unlock: null },
  { id: 'forjado',         nome: 'Forjado no Ferro',   unlock: { tipo: 'treinos', val: 10 } },
  { id: 'especialista',    nome: 'Especialista',       unlock: { tipo: 'treinos', val: 30 } },
  { id: 'atleta-elite',    nome: 'Atleta de Elite',    unlock: { tipo: 'treinos', val: 50 } },
  { id: 'lendario-titulo', nome: 'O Lendário',         unlock: { tipo: 'treinos', val: 100 } },
  { id: 'chama-viva',      nome: 'Chama Viva',         unlock: { tipo: 'streak', val: 7 } },
  { id: 'imortal',         nome: 'Imortal',            unlock: { tipo: 'streak', val: 30 } },
];

export const AVATAR_SEEDS = [
  'Deceptivon', 'Warrior', 'Champion', 'Beast',
  'Titan', 'Shadow', 'Nova', 'Apex'
];

export const AVATAR_FRAMES = [
  { key: null,     nome: 'Nenhuma',  classe: 'frame-option--none',   unlock: null },
  { key: 'bronze', nome: 'Bronze',   classe: 'frame-option--bronze', unlock: { tipo: 'maestria', val: 'bronze' } },
  { key: 'prata',  nome: 'Prata',    classe: 'frame-option--prata',  unlock: { tipo: 'maestria', val: 'prata'  } },
  { key: 'ouro',   nome: 'Ouro',     classe: 'frame-option--ouro',   unlock: { tipo: 'maestria', val: 'ouro'   } },
  { key: 'elite',  nome: 'Elite',    classe: 'frame-option--elite',  unlock: { tipo: 'treinos', val: 100      } },
];

export const SPRITESHEET_URL = 'https://lh3.googleusercontent.com/aida/ADBb0ugGBb35O8U8cMn1B6kYQLBaKBsK4WP23L9L0J9_vFIlALkA6Sb7sYb0ntM_Y9y8EFImawkGmtFCVTlHv6ugJ57ECYBdBF59WbuW7A9TcRTXj43AbjvMerA9WxLjh0YxH2SzjWnLo4O1o-Tm6sp7ipGhutyUY9ycCkGyFXw_-FSqjjRWkJ89ecPxDqafgZWzLm1tLhEW6D8t9XX9TtBcPfMFhvK1IiKSQTWKqZ2YvaK-aSwb1Crysi5nWtk';

export const IDENTITY_EMBLEMS = [
  { id: 'estrela-alada', nome: 'Estrela Alada', desc: 'Glória celestial reservada aos comandantes aéreos.', type: 'sprite', x: '0%', y: '0%', raridade: 'Raro', corRaridade: '#60a5fa' },
  { id: 'escudo-caveira', nome: 'Escudo Caveira', desc: 'A defesa impenetrável dos imortais.', type: 'sprite', x: '-100%', y: '0%', raridade: 'Raro', corRaridade: '#60a5fa' },
  { id: 'coracao-leao', nome: 'Coração de Leão', desc: 'A bravura indomável dos reis da arena.', type: 'sprite', x: '-200%', y: '0%', raridade: 'Raro', corRaridade: '#60a5fa' },
  { id: 'aguia-dourada', nome: 'Águia Dourada', desc: 'Visão suprema e ataques precisos.', type: 'sprite', x: '0%', y: '-100%', raridade: 'Épico', corRaridade: '#c084fc' },
  { id: 'legado-alpha', nome: 'Legado Alpha', desc: 'O símbolo original dos veteranos do prestígio.', type: 'sprite', x: '-100%', y: '-100%', raridade: 'Épico', corRaridade: '#c084fc' },
  { id: 'vetor-v', nome: 'Vetor V', desc: 'Velocidade e agressividade em estado puro.', type: 'sprite', x: '-200%', y: '-100%', raridade: 'Épico', corRaridade: '#c084fc' },
  { id: 'anjo-morte', nome: 'Anjo da Morte', desc: 'O prenúncio do fim para seus oponentes.', type: 'sprite', x: '0%', y: '-200%', raridade: 'Lendário', corRaridade: '#4ae176' },
  { id: 'estrela-nova', nome: 'Estrela Nova', desc: 'A explosão de poder de um supernova.', type: 'sprite', x: '-100%', y: '-200%', raridade: 'Lendário', corRaridade: '#4ae176' },
  { id: 'lobo-prata', nome: 'Lobo de Prata', desc: 'O caçador solitário que domina a noite.', type: 'sprite', x: '-200%', y: '-200%', raridade: 'Lendário', corRaridade: '#4ae176' },
  { id: 'prestigio-1', nome: 'Prestígio 1', desc: 'Ícone de Prestígio do Multijogador de Legado da Temporada Alpha.', type: 'image', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAVjktoPOvZQLcKfppmWEIL0NdjKHru7-mrq2BO1Y86l2JxMILgtLA9c654mDhxwYINxkBvFl7xtjCrzV2sHvlvm99LJEQD6_RPIZpClicP1pp59LaHAOrD4jBNj6WNd_-SlgP0QS7qSWJHcdAuvShSUadK3RDm2QG8B3OJkKfGIZey-z2VIGF2z1_HAcCoeQODDXSoLj9T5QGvwPt0XCBVZq8-jRPMCnYfdqKFhfBJc_rvKEWRmuPaCpu1xPuoo5L7pYkSNYcqno', raridade: 'Lendário', corRaridade: '#4ae176' },
  { id: 'escudo-aguia', nome: 'Escudo de Águia', desc: 'Protetor dos céus, concedido aos melhores defensores da arena.', type: 'image', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtf4jTKYAGYXPJ7Z-wE30fF314-Pwbrg7gJrf18BMSaK79hGIN7Qi2J0lq0cf-nW0cSu1z8nAq7Z-e6jjThEKvL_GHHCmDTWEbEv82n7EcsdoS72gMu_lViMvG7XShJ_1Bu-ZHKf58G8cDbACWyZhYwVdogGFbl7DCD750toV_NO-of2GB94cXxp_8XBk9Fwp6DicKM_tu2TUCV0sd8doEaRDpY6gs21eZbnT0nemZFIlFugTdAocFWJtoj0k57ppaECNRX4r65gk', raridade: 'Lendário', corRaridade: '#4ae176' },
  { id: 'estrela-honra', nome: 'Estrela de Honra', desc: 'Concedido aos veteranos das primeiras batalhas simuladas.', type: 'image', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHEAJfpIZWgH1umKlvbg59Pp41BdGLOOe8lhKRNj-nnsD5DkIIy30D-nA5-Re98xlGobzOdLU2PGI22xdmLpofZp3teQL8o3CI4-VQs9wI334uxnX1huYBwUjTZerVJMzq43mEbyoBw9iM74jIojuIanroPUzwIQ5o1a-GrUP1aCMQXlhDHNUjawn0lp-fMJfknNsy709tjjqt0amLPIQmYozpE3F_Hja775x3Bf5MuXNhWI_ch75gobs38rKjtdwqRCov1Uxk7ko', raridade: 'Lendário', corRaridade: '#4ae176' },
  { id: 'caveira-alada', nome: 'Caveira Alada', desc: 'Ceifador aéreo, terror dos oponentes na arena.', type: 'image', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSDob9FO6LAhjuTYsBXj8Qp_NNC5RRdCYF5osBDe6eTVdRVXglK8ZCa84lQuXK_xmU_6-oMymbv-TGIB4GVgKnf86Dyd9rsszFo3dKKnmp4Q_VKxBtlfJgmskM92m-V_nSPycm0LR_N294VjBhRhbBiYmr5zVFd6-waOW1R_qpUwWLA9upBq1aUg3e_Cl7goSdAzQq59zzaYltXvjRAQv5u3b6TXtDKrl4U1R5_5BDx-ubUcd59WEwtoDB89Sn8SZge5uhE_ttHkA', raridade: 'Lendário', corRaridade: '#4ae176' },
  { id: 'lobo-alfa', nome: 'Lobo Alfa', desc: 'Marca daqueles que lideram o bando na Arena.', type: 'image', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpQe6fST2xan76hsAPfRQ71DBmXwqoiKRsK57U4O77vji8ec6HJgpoIyqat85I-It_9xysZ-iBwhTNYR3gpVoRQPvsIrKccGgw21m_SaMZc-jxBLtksqbM2HfHeK9RzsF4cj2bCrkNZ01rASFJwJdnOPGYWLhwFLCNU0akcyhkXAAOQY8xvtIHDZ5wB3dIAYfDM-GSJV8Lnt1Df4M4Qb-SjVUajRBCiVmGv-tFVMIuREVoI1uAMzJEWn5yhaXIth-dvcWmSub5_Cc', raridade: 'Lendário', corRaridade: '#4ae176' }
];

// ---- SKINS DE BARRA DE XP/PROGRESSO ----
export const BAR_SKINS = [
  { key: 'default',  nome: 'Padrão',     unlock: null,                            hint: 'Padrão' },
  { key: 'fire',     nome: 'Chama',      unlock: { tipo: 'streak',  val: 7   },   hint: '7 dias seguidos' },
  { key: 'ice',      nome: 'Gelo',       unlock: { tipo: 'treinos', val: 20  },   hint: '20 treinos' },
  { key: 'gold',     nome: 'Ouro Elite', unlock: { tipo: 'treinos', val: 30  },   hint: '30 treinos' },
  { key: 'military', nome: 'Segmentado', unlock: { tipo: 'treinos', val: 40  },   hint: '40 treinos' },
  { key: 'neon',     nome: 'Neon Cyber', unlock: { tipo: 'treinos', val: 35  },   hint: '35 treinos' },
  { key: 'plasma',   nome: 'Plasma',     unlock: { tipo: 'treinos', val: 50  },   hint: '50 treinos' },
  { key: 'biohazard', nome: 'Biohazard',  unlock: { tipo: 'treinos', val: 60  },   hint: '60 treinos' },
  { key: 'solar',    nome: 'Solar',      unlock: { tipo: 'treinos', val: 70  },   hint: '70 treinos' },
  { key: 'carbono',  nome: 'Carbono',    unlock: { tipo: 'treinos', val: 80  },   hint: '80 treinos' },
  { key: 'galaxia',  nome: 'Galáxia',    unlock: { tipo: 'treinos', val: 90  },   hint: '90 treinos' },
  { key: 'elixir',   nome: 'Elixir',     unlock: { tipo: 'treinos', val: 25  },   hint: '25 treinos' },
  { key: 'mercurio', nome: 'Mercúrio',   unlock: { tipo: 'treinos', val: 45  },   hint: '45 treinos' },
  { key: 'radar',    nome: 'Radar',      unlock: { tipo: 'treinos', val: 15  },   hint: '15 treinos' },
  { key: 'matrix',   nome: 'Matrix',     unlock: { tipo: 'treinos', val: 100 },   hint: '100 treinos' },
  { key: 'sobrecarga', nome: 'Sobrecarga', unlock: { tipo: 'streak',  val: 15  },   hint: '15 dias seguidos' },
  { key: 'supernova',  nome: 'Supernova',  unlock: { tipo: 'streak',  val: 30  },   hint: '30 dias seguidos' },
  { key: 'deepvoid',   nome: 'Deep Void',  unlock: { tipo: 'maestria', val: 'ouro' }, hint: 'Maestria Ouro' },
  { key: 'cyberhunter', nome: 'Cyber Hunter', unlock: { tipo: 'treinos', val: 55 }, hint: '55 treinos' },
  { key: 'bloodline',  nome: 'Bloodline',  unlock: { tipo: 'streak',  val: 20  },   hint: '20 dias seguidos' },
  { key: 'bananil',    nome: 'Bananil',    unlock: { tipo: 'treinos', val: 12  },   hint: '12 treinos' },
  { key: 'glacialpeak', nome: 'Glacial Peak', unlock: { tipo: 'treinos', val: 22 },  hint: '22 treinos' },
  { key: 'acidflow',   nome: 'Acid Flow',  unlock: { tipo: 'treinos', val: 32  },   hint: '32 treinos' },
  { key: 'starlight',  nome: 'Starlight',  unlock: { tipo: 'treinos', val: 42  },   hint: '42 treinos' },
  { key: 'magma',      nome: 'Magma',      unlock: { tipo: 'treinos', val: 65  },   hint: '65 treinos' },
  { key: 'onyxshield', nome: 'Onyx Shield', unlock: { tipo: 'treinos', val: 75 },   hint: '75 treinos' },
  { key: 'mercurioliquido', nome: 'Mercúrio Líquido', unlock: { tipo: 'treinos', val: 85 }, hint: '85 treinos' },
  { key: 'neutronpulse', nome: 'Nêutron Pulse', unlock: { tipo: 'treinos', val: 95 }, hint: '95 treinos' },
  { key: 'prismacristalino', nome: 'Prisma Cristalino', unlock: { tipo: 'treinos', val: 105 }, hint: '105 treinos' },
  { key: 'vorticedovazio', nome: 'Vórtice do Vazio', unlock: { tipo: 'maestria', val: 'prata' }, hint: 'Maestria Prata' },
  { key: 'dourado-elite', nome: 'Dourado Elite', unlock: { tipo: 'treinos', val: 110 }, hint: '110 treinos' },
  { key: 'roxo-elite', nome: 'Roxo Elite', unlock: { tipo: 'streak', val: 45 }, hint: '45 dias seguidos' },
  { key: 'diamante-elite', nome: 'Diamante Elite', unlock: { tipo: 'treinos', val: 120 }, hint: '120 treinos' },
];

// ---- SKINS DE CARD DE EXERCÍCIO ----
export const CARD_SKINS = [
  { key: 'default', nome: 'Padrão',      unlock: null,                              hint: 'Padrão' },
  { key: 'neon',    nome: 'Neon Cyber',  unlock: { tipo: 'treinos', val: 20 },      hint: '20 treinos' },
  { key: 'militar', nome: 'Militar',     unlock: { tipo: 'treinos', val: 40 },      hint: '40 treinos' },
  { key: 'ouro',    nome: 'Ouro Elite',  unlock: { tipo: 'maestria', val: 'ouro' }, hint: 'Maestria Ouro' },
  { key: 'gelo',    nome: 'Aço Glacial', unlock: { tipo: 'treinos', val: 30 },      hint: '30 treinos' },
  { key: 'sombra',  nome: 'Shadow',      unlock: { tipo: 'treinos', val: 50 },      hint: '50 treinos' },
];

export const TIMER_SKINS = [
  { key: 'radar',     nome: 'Radar Tático',   unlock: null,                              hint: 'Padrão' },
  { key: 'hourglass', nome: 'Ampulheta',      unlock: { tipo: 'treinos', val: 10 },      hint: '10 treinos' },
  { key: 'cyber',     nome: 'Cyber Relógio',  unlock: { tipo: 'treinos', val: 20 },      hint: '20 treinos' },
  { key: 'arcade',    nome: 'Arcade Bit',     unlock: { tipo: 'treinos', val: 30 },      hint: '30 treinos' },
];

// ---- STATS DA VITRINE ----
export const SHOWCASE_STATS = [
  {
    key: 'streak',
    label: 'Maior Sequência',
    unit: 'dias',
    badge: 'OFENSIVA',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    compute: (db) => {
      const hist = db.historico || {};
      let max = 0, cur = 0;
      const days = Object.keys(hist).sort();
      days.forEach((d, i) => {
        if (hist[d]?.concluido) {
          if (i > 0 && hist[days[i-1]]?.concluido) cur++; else cur = 1;
          if (cur > max) max = cur;
        }
      });
      return max;
    }
  },
  {
    key: 'treinos',
    label: 'Total de Treinos',
    unit: 'sessões',
    badge: 'PROGRESSÃO',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M6 4v16M18 4v16M2 9h4M18 9h4M2 15h4M18 15h4M6 9h12M6 15h12"/></svg>`,
    compute: (db) => Object.values(db.historico || {}).filter(d => d?.concluido).length
  },
  {
    key: 'xp',
    label: 'Total de XP',
    unit: 'XP',
    badge: 'EXPERIÊNCIA',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    compute: (db) => Object.values(db.historico || {}).filter(d => d?.concluido).length * 10
  },
  {
    key: 'maestrias',
    label: 'Maestrias',
    unit: 'conquistas',
    badge: 'MAESTRIA',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
    compute: (db) => {
      const m = db.maestrias || {};
      return Object.values(m).filter(v => (v.nivel || 1) > 1).length;
    }
  },
  {
    key: 'ciclos',
    label: 'Ciclos Completos',
    unit: 'ciclos',
    badge: 'PRESTÍGIO',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
    compute: (db) => db.prestige || 0
  },
];

// ---- FRASES DE ASSINATURA PRESET ----
export const FRASES_PRESET = [
  'O suor de hoje é a força de amanhã.',
  'Sem desculpa, sem limite.',
  'Forjado no ferro, temperado na dor.',
  'A consistência vence o talento todos os dias.',
  'Progresso diário > Perfeição eventual.',
  'Não existe elevador para o sucesso.',
  'O corpo aguenta. É a mente que fraqueja.',
  'Cada rep conta uma nova história.',
  'Seja mais forte que sua melhor desculpa.',
  'A jornada é tão importante quanto o destino.',
];

// ============================================================
// VERIFICAÇÃO DE DESBLOQUEIO
// ============================================================

export function isUnlocked(unlock, db) {
  if (localStorage.getItem('academia_dev_mode') === 'true') return true;
  if (!unlock) return true;
  const hist = db.historico || {};
  const completedDates = Object.keys(hist).filter(d => hist[d].concluido);
  const totalTreinos = completedDates.length;
  const xp = totalTreinos * 10;

  // Streak
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    const key = `${y}-${m}-${day}`;
    if (hist[key] && hist[key].concluido) { streak++; d.setDate(d.getDate()-1); }
    else break;
  }

  switch (unlock.tipo) {
    case 'treinos': return totalTreinos >= unlock.val;
    case 'streak':  return streak >= unlock.val;
    case 'xp':      return xp >= unlock.val;
    case 'maestria': {
      const maestrias = db.maestrias || {};
      const NIVEL_MAP = { bronze: 1, prata: 2, ouro: 3 };
      const nivelReq = NIVEL_MAP[unlock.val] || 1;
      return Object.values(maestrias).some(m => (m.nivel || 1) >= nivelReq);
    }
    default: return false;
  }
}

// ---- Helper: aplica skin de barra diretamente no DOM (garante override mesmo com Tailwind/inline styles) ----
const BAR_SKIN_STYLES = {
  'default': { background: 'linear-gradient(90deg, #dbfcff, #00dbe9)', boxShadow: '0 0 10px rgba(0,219,233,0.3)' },
  'fire':    { background: 'linear-gradient(90deg, #FF4D00, #FFD000)', boxShadow: '0 0 15px #FF4D00' },
  'ice':     { background: 'rgba(0, 240, 255, 0.8)', boxShadow: 'inset 0 0 10px rgba(255,255,255,0.5)' },
  'gold':    { background: 'linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)', boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)' },
  'military':{ background: 'repeating-linear-gradient(90deg, #5b8c5a 0px, #5b8c5a 8px, transparent 8px, transparent 10px)', boxShadow: '' },
  'neon':    { background: 'linear-gradient(90deg, #00f0ff, #a855f7)', boxShadow: '0 0 15px #00f0ff' },
  'plasma':  { background: 'linear-gradient(270deg, #ff506e, #a855f7, #00dbe9)', boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)' },
  'biohazard': { background: '#39FF14', boxShadow: '0 0 12px #39FF14' },
  'solar':   { background: 'radial-gradient(circle, #FFF 0%, #FF8C00 60%)', boxShadow: '0 0 20px #FF8C00' },
  'carbono': { background: 'linear-gradient(90deg, #1b1b1b, #1b1b1b)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)' },
  'galaxia': { background: 'linear-gradient(90deg, #050014, #1a0b2e, #0f0026)', boxShadow: '0 0 15px rgba(75, 0, 130, 0.6)' },
  'elixir':  { background: '#FF00E5', boxShadow: '0 0 15px #FF00E5' },
  'mercurio': { background: 'linear-gradient(180deg, #E0E0E0 0%, #9E9E9E 40%, #424242 50%, #9E9E9E 60%, #F5F5F5 100%)', boxShadow: '0 2px 5px rgba(0,0,0,0.5)' },
  'radar':   { background: 'rgba(0, 255, 0, 0.3)', boxShadow: '0 0 10px rgba(0,255,0,0.5)' },
  'matrix':  { background: '#000', boxShadow: '0 0 15px rgba(0,255,65,0.8), inset 0 0 10px rgba(0,255,65,0.5)' },
  'sobrecarga': { background: '#E0FFFF', boxShadow: '0 0 20px #E0FFFF' },
  'supernova': { background: 'linear-gradient(90deg, #ff8c00, #ffffff, #ff8c00)', boxShadow: '0 0 20px #ff8c00' },
  'deepvoid': { background: 'linear-gradient(90deg, #020014, #0a0f30)', boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)' },
  'cyberhunter': { background: '#00ff7f', boxShadow: '0 0 10px #00ff7f' },
  'bloodline': { background: 'linear-gradient(180deg, #4a0000 0%, #8b0000 50%, #3a0000 100%)', boxShadow: 'inset 0 0 15px #2a0000, 0 0 20px rgba(139, 0, 0, 0.6)' },
  'bananil': { background: 'linear-gradient(90deg, #009739, #FEDD00, #009739)', boxShadow: '0 0 15px rgba(0, 151, 57, 0.6)' },
  'glacialpeak': { background: 'linear-gradient(90deg, #add8e6, #e0ffff, #add8e6)', boxShadow: '0 0 10px #add8e6' },
  'acidflow': { background: 'linear-gradient(90deg, #adff2f, #7fff00)', boxShadow: '0 0 15px #adff2f' },
  'starlight': { background: 'linear-gradient(90deg, #e6e6fa, #ffffff, #e6e6fa)', boxShadow: '0 0 12px #fff' },
  'magma': { background: 'linear-gradient(90deg, #8b0000, #ff4500, #8b0000)', boxShadow: '0 0 15px #ff4500' },
  'onyxshield': { background: 'linear-gradient(135deg, #2a2a2a 0%, #050505 40%, #111 60%, #000 100%)', boxShadow: '0 0 10px rgba(0,0,0,0.8)' },
  'mercurioliquido': { background: 'linear-gradient(90deg, #d3d7cf, #eeeeec, #babdb6, #eeeeec, #d3d7cf)', boxShadow: '0 0 10px rgba(200,200,200,0.5)' },
  'neutronpulse': { background: '#4b0082', boxShadow: '0 0 15px #4b0082' },
  'prismacristalino': { background: 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)', boxShadow: '0 0 10px rgba(255,255,255,0.3)' },
  'vorticedovazio': { background: '#000', boxShadow: '0 0 20px #8a2be2, inset 0 0 15px #8a2be2' },
  'dourado-elite': { background: 'linear-gradient(135deg, #e6c27a 0%, #ffd700 25%, #b8860b 50%, #ffd700 75%, #e6c27a 100%)', boxShadow: '0 0 12px rgba(255, 215, 0, 0.5)' },
  'roxo-elite': { background: '#4b0082', boxShadow: '0 0 20px #8a2be2' },
  'diamante-elite': { background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(220,240,255,0.8) 25%, rgba(255,255,255,1) 50%, rgba(200,230,255,0.9) 75%, rgba(255,255,255,0.9) 100%)', boxShadow: '0 0 15px rgba(255, 255, 255, 0.8)' },
};

export function _applyBarSkinToDOM(skinKey) {
  const style = BAR_SKIN_STYLES[skinKey] || BAR_SKIN_STYLES['default'];
  document.querySelectorAll('.progress-fill, .xp-bar-fill, .cycle-xp-fill').forEach(el => {
    if (style.background) {
      el.style.setProperty('background', style.background, 'important');
      el.style.setProperty('box-shadow', style.boxShadow || 'none', 'important');
    } else {
      // Volta ao padrão: remove override inline e deixa o CSS base agir
      el.style.removeProperty('background');
      el.style.removeProperty('box-shadow');
    }
  });
}

// ============================================================
// APLICAR CUSTOMIZAÇÃO
// ============================================================

export function applyProfileCustomization(db) {
  const pc = db.profileCustomization || {};

  // Banner
  document.querySelectorAll('.profile-banner').forEach(banner => {
    banner.setAttribute('data-banner', pc.banner || 'roxo-neon');
  });

  document.querySelectorAll('.dash-profile-banner-card').forEach(dashBanner => {
    dashBanner.setAttribute('data-banner', pc.banner || 'roxo-neon');
  });

  // Nome e handle
  const nameEl = document.querySelector('.profile-name');
  if (nameEl) nameEl.textContent = pc.nome || 'DECEPTIVON';

  const handleEl = document.querySelector('.profile-handle');
  if (handleEl) {
    const sinceYear = pc.since || '2024';
    handleEl.textContent = `${pc.handle || '@deceptivon'} \u2022 AQUI DESDE ${sinceYear}`;
  }

  // Título
  const tituloEl = document.querySelector('.profile-titulo');
  if (tituloEl) {
    const titulo = TITULOS.find(t => t.id === pc.titulo);
    tituloEl.textContent = titulo && titulo.id ? titulo.nome.toUpperCase() : '';
    tituloEl.style.display = titulo && titulo.id ? '' : 'none';
  }

  // Avatar / Emblem
  document.querySelectorAll('.profile-avatar').forEach(avatarEl => {
    const mainEmblemId = pc.mainEmblem || 'prestigio-1';
    const emblem = IDENTITY_EMBLEMS.find(e => e.id === mainEmblemId);
    const isPulsing = pc.mainEmblemPulse !== false;
    const pulseClass = isPulsing ? 'animate-pulse' : '';
    if (emblem) {
      if (emblem.type === 'sprite') {
        avatarEl.innerHTML = `
          <div class="profile-avatar__emblem-wrapper ${pulseClass}" style="position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 50%; display: flex; align-items: center; justify-content: center; mix-blend-mode: screen;">
            <img src="${SPRITESHEET_URL}" style="position: absolute; max-w: none; width: 300%; height: 300%; left: ${emblem.x}; top: ${emblem.y};">
          </div>
        `;
      } else {
        avatarEl.innerHTML = `
          <div class="profile-avatar__emblem-wrapper ${pulseClass}" style="position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 50%; display: flex; align-items: center; justify-content: center; mix-blend-mode: screen;">
            <img src="${emblem.url}" style="width: 100%; height: 100%; object-fit: contain;">
          </div>
        `;
      }
    } else {
      const seed = pc.avatarSeed || 'Deceptivon';
      avatarEl.innerHTML = `<img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}" alt="Avatar">`;
    }
    avatarEl.setAttribute('data-frame', pc.avatarFrame || '');
  });

  // ---- Feature 10: Skin de Barra de XP ----
  document.body.setAttribute('data-bar-skin', pc.barSkin || 'default');
  _applyBarSkinToDOM(pc.barSkin || 'default');

  // ---- Feature 3: Skin de Card de Exercício ----
  document.body.setAttribute('data-card-skin', pc.cardSkin || 'default');

  // ---- Feature 4: Assinatura no perfil ----
  const assinaturaEl = document.querySelector('.profile-assinatura');
  if (assinaturaEl) {
    const txt = pc.assinatura || '';
    assinaturaEl.textContent = txt ? `\u201c${txt}\u201d` : '';
    assinaturaEl.style.display = txt ? '' : 'none';
  }
}

// ============================================================
// INICIALIZAR ABA DE CUSTOMIZAÇÃO (PERSONALIZAR)
// ============================================================

export function initPersonalizarTab(db) {
  const container = document.getElementById('perf-tab-personalizar');
  if (!container) return;

  // Renderiza elementos nos seus respectivos grids
  const inputNome = container.querySelector('#inputCustomNome');
  const inputHandle = container.querySelector('#inputCustomHandle');
  const inputAssinatura = container.querySelector('#inputCustomAssinatura');

  if (inputNome) inputNome.value = (db.profileCustomization?.nome || 'DECEPTIVON').toUpperCase();
  if (inputHandle) inputHandle.value = db.profileCustomization?.handle || '@deceptivon';
  if (inputAssinatura) inputAssinatura.value = db.profileCustomization?.assinatura || '';

  const frasesPreset = container.querySelector('#frasesPreset');
  if (frasesPreset) frasesPreset.innerHTML = _renderFrasesPreset(db);

  const showcaseGrid = container.querySelector('#showcaseStatList');
  if (showcaseGrid) showcaseGrid.innerHTML = _renderShowcaseStats(db);

  const titleGrid = container.querySelector('#tituloList');
  if (titleGrid) titleGrid.innerHTML = _renderTitulos(db);

  // Associa os eventos aos botões e opções dentro do container
  _bindCustomizacaoEvents(container, db);

  // Associa o botão de salvar da aba (apenas Identidade — demais sub-abas
  // movidas para Treinos > Exercícios usam auto-save em tempo real)
  const btnSaveTab = container.querySelector('#btnSalvarCustomizacaoTab');
  if (btnSaveTab) {
    btnSaveTab.onclick = () => {
      _salvarIdentidadeTab(container, db);
    };
  }
}

// Salva APENAS os campos de Identidade (Nome, Handle, Assinatura, Em Destaque, Título).
// Usado pelo botão SALVAR da aba Personalizar para não sobrescrever
// as customizações (banner/skin/emblema/moldura) gerenciadas agora em
// Treinos > Exercícios com auto-save.
function _salvarIdentidadeTab(container, db) {
  const nomeInput = container.querySelector('#inputCustomNome');
  const handleInput = container.querySelector('#inputCustomHandle');
  const assinaturaInput = container.querySelector('#inputCustomAssinatura');
  const showcaseActive = container.querySelector('.showcase-stat-option--active');
  const tituloActive = container.querySelector('.titulo-option--active');

  const nome = (nomeInput?.value || '').trim().toUpperCase() || 'DECEPTIVON';
  const handle = (handleInput?.value || '').trim() || '@deceptivon';
  const assinatura = (assinaturaInput?.value || '').trim();
  const showcaseStat = showcaseActive ? showcaseActive.dataset.showcase : 'streak';
  const titulo = tituloActive ? (tituloActive.dataset.titulo || null) : null;

  db.profileCustomization = {
    ...(db.profileCustomization || {}),
    nome, handle, assinatura, showcaseStat, titulo,
  };
  saveDB(db);

  // Aplica imediatamente no DOM
  applyProfileCustomization(db);
  renderProfileShowcase(db);

  showToast('Identidade atualizada!', 'success');
}

// ============================================================
// MODAL PRINCIPAL DE CUSTOMIZAÇÃO
// ============================================================

let _currentSlot = 0;

export function openCustomizacaoModal(db) {
  const existing = document.getElementById('modalCustomizacao');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modalCustomizacao';
  overlay.style.cssText = 'display:flex; z-index:9999;';

  overlay.innerHTML = `
    <div class="modal-customizacao">
      <div class="customizacao-modal__header">
        <div>
          <div class="customizacao-modal__title">Personalizar Perfil</div>
          <div class="customizacao-modal__subtitle">Estilo CoD — escolha sua identidade</div>
        </div>
        <button class="customizacao-modal__close" id="btnCloseCustomizacao">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="customizacao-modal__body">

        <!-- NOME E HANDLE -->
        <div class="customizacao-modal__section-title">Identidade</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px;">
          <div>
            <label style="font-size:0.65rem;letter-spacing:1.5px;color:var(--text-secondary);font-weight:700;text-transform:uppercase;display:block;margin-bottom:6px;">Nome de Exibição</label>
            <input id="inputCustomNome" class="profile-name-input" type="text" maxlength="18"
              value="${(db.profileCustomization?.nome || 'DECEPTIVON').toUpperCase()}"
              placeholder="SEU NOME" style="width:100%;max-width:100%;">
          </div>
          <div>
            <label style="font-size:0.65rem;letter-spacing:1.5px;color:var(--text-secondary);font-weight:700;text-transform:uppercase;display:block;margin-bottom:6px;">Handle (@usuário)</label>
            <input id="inputCustomHandle" class="profile-name-input" type="text" maxlength="20"
              value="${db.profileCustomization?.handle || '@deceptivon'}"
              placeholder="@handle" style="width:100%;max-width:100%;">
          </div>
        </div>

        <!-- FRASE DE ASSINATURA -->
        <div class="customizacao-modal__section-title">Frase de Assinatura</div>
        <div style="margin-bottom:24px;">
          <p style="font-size:0.72rem;color:var(--text-tertiary);margin-bottom:10px;">Exibida no seu Share Card e cartão de perfil.</p>
          <input id="inputCustomAssinatura" class="profile-name-input"
            type="text" maxlength="60"
            value="${db.profileCustomization?.assinatura || ''}"
            placeholder="Sua frase motivacional..." style="width:100%;max-width:100%;font-size:0.8rem;font-weight:600;letter-spacing:0.5px;text-transform:none;">
          <div class="frases-preset" id="frasesPreset" style="margin-top:10px;display:flex;flex-direction:column;gap:6px;">
            ${_renderFrasesPreset(db)}
          </div>
        </div>

        <!-- SKIN DE BARRA DE XP -->
        <div class="customizacao-modal__section-title">Estilo das Barras de Progresso</div>
        <div class="bar-skin-grid" id="barSkinGrid">${_renderBarSkins(db)}</div>

        <!-- SKIN DO CRONÔMETRO -->
        <div class="customizacao-modal__section-title">Estilo do Cronômetro</div>
        <div class="bar-skin-grid" id="timerSkinGrid">${_renderTimerSkins(db)}</div>

        <!-- SKIN DE CARD DE EXERCÍCIO -->
        <div class="customizacao-modal__section-title">Skin dos Cards</div>
        <div class="card-skin-grid" id="cardSkinGrid">${_renderCardSkins(db)}</div>

        <!-- VITRINE DE CONQUISTAS -->
        <div class="customizacao-modal__section-title">Em Destaque no Perfil</div>
        <p style="font-size:0.72rem;color:var(--text-tertiary);margin-bottom:12px;">Escolha 1 conquista para exibir no seu cartão.</p>
        <div class="showcase-stat-list" id="showcaseStatList">${_renderShowcaseStats(db)}</div>

        <!-- BANNERS -->
        <div class="customizacao-modal__section-title">Cartão de Visita</div>
        <div class="banner-grid" id="bannerGrid">${_renderBanners(db)}</div>

        <!-- EMBLEMAS -->
        <div class="customizacao-modal__section-title">Emblemas do Perfil</div>
        <p style="font-size:0.72rem;color:var(--text-tertiary);margin-bottom:12px;">Selecione até 3 emblemas para exibir no seu cartão.</p>
        <div class="emblem-gallery" id="emblemGallery">${_renderEmblemas(db)}</div>

        <!-- TÍTULOS -->
        <div class="customizacao-modal__section-title">Título</div>
        <div class="titulo-list" id="tituloList">${_renderTitulos(db)}</div>

        <!-- EMBLEMA DE IDENTIDADE -->
        <div class="customizacao-modal__section-title">Emblema de Identificação</div>
        <div class="emblem-picker-container">
          <div class="emblem-picker__preview-panel">
            <div class="emblem-preview-bento" id="modalIdentityEmblemPreview">
              <!-- Injetado via JS -->
            </div>
          </div>
          <div class="emblem-picker__grid-panel">
            <div class="emblem-picker__grid-header">
              <h3 class="emblem-picker__grid-title" style="margin: 0;">Ícone Legado do Prestígio</h3>
              <div class="emblem-picker__grid-controls" style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                <label class="pulse-toggle-label" style="margin-bottom: 0;">
                  <span>Pulsar</span>
                  <div class="pulse-toggle-switch" id="modalPulseToggleBg">
                    <input type="checkbox" id="modalPulseToggle" checked>
                    <span class="pulse-toggle-dot" id="modalPulseToggleDot"></span>
                  </div>
                </label>
                <span class="emblem-filter-text" style="font-size: 0.65rem; font-weight: 700; color: var(--text-tertiary); letter-spacing: 0.5px; text-transform: uppercase;">Filtra: <span style="color: #c084fc; cursor: pointer;">Todas</span></span>
              </div>
            </div>
            <div class="identity-emblems-grid" id="modalIdentityEmblemGrid">
              <!-- Injetado via JS -->
            </div>
          </div>
        </div>

        <!-- MOLDURA -->
        <div class="customizacao-modal__section-title">Moldura de Avatar</div>
        <div class="frame-grid" id="frameGrid">${_renderFrames(db)}</div>

        <button class="customizacao-modal__save-btn" id="btnSalvarCustomizacao">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13"/><polyline points="7 3 7 8 15 8"/></svg>
          SALVAR ALTERAÇÕES
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Inicializar grids e previews do modal
  const selectedEmblemId = db.profileCustomization?.mainEmblem || 'prestigio-1';
  const isPulsing = db.profileCustomization?.mainEmblemPulse !== false;

  const modalGrid = overlay.querySelector('#modalIdentityEmblemGrid');
  if (modalGrid) modalGrid.innerHTML = _renderIdentityEmblems(db, selectedEmblemId);

  const modalPreview = overlay.querySelector('#modalIdentityEmblemPreview');
  if (modalPreview) {
    const emblem = IDENTITY_EMBLEMS.find(e => e.id === selectedEmblemId);
    modalPreview.innerHTML = _renderIdentityEmblemPreview(emblem, isPulsing);
  }

  const modalPulse = overlay.querySelector('#modalPulseToggle');
  if (modalPulse) {
    modalPulse.checked = isPulsing;
    _updatePulseToggleUI(overlay, isPulsing);
  }

  _bindCustomizacaoEvents(overlay, db);

  // Fechar clicando fora
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ============================================================
// RENDER HELPERS
// ============================================================

export function _renderBanners(db) {
  const current = db.profileCustomization?.banner || 'roxo-neon';

  // Separa banners em 3 grupos para renderizar com cabeçalhos de seção
  const classicos = BANNERS.filter(b => !b.key.match(/^(lava-vulcao|matrix-grid|glacial|gold-rush|titan-core|nebulosa-galatica|stealth-ops-v2|cyber-pulse-v2|solar-flare|deep-void|biohazard|bloodline-v2|starlight|inferno-engine|quantum-weaver|stormbringer|void-reaver|emerald-dragon|dragon-breath|neon-samurai|ghost-protocol|bloodline-pulse|solar-eclipse|cyber-iris|frozen-throne|nuclear-winter|dimension-warp|ancient-rune|plasma-conico)$/));
  const extras   = BANNERS.filter(b => !b.master && b.key.match(/^(lava-vulcao|matrix-grid|glacial|gold-rush|titan-core|nebulosa-galatica|stealth-ops-v2|cyber-pulse-v2|solar-flare|deep-void|biohazard|bloodline-v2|starlight|inferno-engine|quantum-weaver|stormbringer|void-reaver|emerald-dragon)$/));
  const masters  = BANNERS.filter(b => b.master);

  const _cardHtml = b => {
    const unlocked   = isUnlocked(b.unlock, db);
    const active     = b.key === current ? 'banner-option--active' : '';
    const locked     = !unlocked ? 'banner-option--locked' : '';
    const lockIcon   = !unlocked ? `
      <span class="banner-option__lock-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      </span>
      <div class="banner-option__unlock-hint">${b.hint}</div>
    ` : '';
    const animBadge   = b.animated && !b.master ? `<span class="banner-option__anim-badge">ANIMADO</span>` : '';
    const masterBadge = b.master ? `<span class="banner-option__master-badge">MASTER</span>` : '';
    return `<div class="banner-option ${active} ${locked}" data-banner="${b.key}" ${!unlocked ? 'data-locked="true"' : ''}>
      <div class="banner-option__label">${b.nome}</div>
      ${animBadge}${masterBadge}
      ${lockIcon}
    </div>`;
  };

  const _sectionHeader = (label, sublabel = '') => `
    <div style="grid-column:1/-1; margin:8px 0 4px; display:flex; align-items:center; gap:8px;">
      <span style="font-size:0.6rem; font-weight:900; letter-spacing:2px; text-transform:uppercase; color:var(--primary-light); white-space:nowrap;">${label}</span>
      ${sublabel ? `<span style="font-size:0.55rem; color:var(--text-tertiary); font-weight:600;">${sublabel}</span>` : ''}
      <span style="flex:1; height:1px; background:linear-gradient(90deg,rgba(139,92,246,0.3),transparent);"></span>
    </div>`;

  const _masterHeader = () => `
    <div style="grid-column:1/-1; margin:12px 0 4px; display:flex; align-items:center; gap:8px;">
      <span style="font-size:0.6rem; font-weight:900; letter-spacing:2px; text-transform:uppercase; background:linear-gradient(90deg,#f59e0b,#d97706); -webkit-background-clip:text; -webkit-text-fill-color:transparent; white-space:nowrap;">⭐ MASTER</span>
      <span style="flex:1; height:1px; background:linear-gradient(90deg,rgba(245,158,11,0.5),transparent);"></span>
    </div>`;

  return [
    classicos.map(_cardHtml).join(''),
    extras.length ? _sectionHeader('Coleção Extra', `${extras.length} novos banners`) + extras.map(_cardHtml).join('') : '',
    masters.length ? _masterHeader() + masters.map(_cardHtml).join('') : '',
  ].join('');
}


export function _renderEmblemas(db) {
  const selected = db.selectedEmblems || [];
  return EMBLEMAS.map(e => {
    const unlocked = isUnlocked(e.unlock, db);
    const active = selected.includes(e.id) ? 'emblem-gallery__item--active' : '';
    const locked = !unlocked ? 'emblem-gallery__item--locked' : '';
    const lockSvg = !unlocked ? `<span class="emblem-gallery__lock"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></span>` : '';
    const animClass = e.animated ? `emblem-gallery__icon--${e.animationType}` : '';
    return `<div class="emblem-gallery__item ${active} ${locked}" data-emblem="${e.id}" ${!unlocked ? 'data-locked="true"' : ''}>
      <div class="emblem-gallery__icon ${animClass}">${e.icon}</div>
      <div class="emblem-gallery__name">${e.nome}</div>
      ${lockSvg}
    </div>`;
  }).join('');
}

function _renderTitulos(db) {
  const current = db.profileCustomization?.titulo ?? null;
  return TITULOS.map(t => {
    const unlocked = isUnlocked(t.unlock, db);
    const active = t.id === current ? 'titulo-option--active' : '';
    const locked = !unlocked ? 'titulo-option--locked' : '';
    const hint = !unlocked && t.unlock
      ? `<span class="titulo-option__hint">${_unlockHint(t.unlock)}</span>`
      : '';
    return `<div class="titulo-option ${active} ${locked}" data-titulo="${t.id ?? ''}" ${!unlocked ? 'data-locked="true"' : ''}>
      <span class="titulo-option__name">${t.nome}</span>
      ${hint}
    </div>`;
  }).join('');
}

export function _updatePulseToggleUI(container, checked) {
  const bg = container.querySelector('#pulseToggleBg') || container.querySelector('#modalPulseToggleBg');
  const dot = container.querySelector('#pulseToggleDot') || container.querySelector('#modalPulseToggleDot');
  if (bg && dot) {
    if (checked) {
      bg.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';
      bg.style.borderColor = 'var(--primary)';
      dot.style.transform = 'translateX(16px)';
    } else {
      bg.style.backgroundColor = 'var(--background-alt)';
      bg.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      dot.style.transform = 'translateX(0)';
    }
  }
}

export function _renderIdentityEmblems(db, selectedId) {
  return IDENTITY_EMBLEMS.map(e => {
    const active = e.id === selectedId ? 'active' : '';
    let imgHtml = '';
    if (e.type === 'sprite') {
      imgHtml = `<img src="${SPRITESHEET_URL}" style="position:absolute; max-width:none; width:300%; height:300%; top:${e.y}; left:${e.x};" />`;
    } else {
      imgHtml = `<img src="${e.url}" style="max-width:none; width:100%; height:100%; object-fit:contain;" />`;
    }
    return `
      <div class="emblem-card ${active}" data-identity-emblem="${e.id}">
        <div class="holoShine"></div>
        <div style="position:absolute; top:0; left:0; width:24px; height:2px; background:rgba(255,255,255,0.15); z-index:20;"></div>
        <div style="position:absolute; bottom:4px; right:4px; display:flex; gap:2px; z-index:20; opacity:0.4;">
          <div style="width:2px; height:6px; background:#958ea0;"></div>
          <div style="width:2px; height:6px; background:#958ea0;"></div>
          <div style="width:2px; height:6px; background:#958ea0;"></div>
        </div>
        <div class="emblem-card__icon" style="mix-blend-mode:screen;">
          ${imgHtml}
        </div>
      </div>
    `;
  }).join('');
}

export function _renderIdentityEmblemPreview(emblem, isPulsing) {
  if (!emblem) return '';
  const pulseClass = isPulsing ? 'animate-pulse-emblem' : '';
  let imgHtml = '';
  if (emblem.type === 'sprite') {
    imgHtml = `<img alt="Emblema Selecionado" id="previewImage" src="${SPRITESHEET_URL}" style="position:absolute; max-width:none; width:300%; height:300%; left:${emblem.x}; top:${emblem.y};"/>`;
  } else {
    imgHtml = `<img alt="Emblema Selecionado" id="previewImage" src="${emblem.url}" style="width:100%; height:100%; object-fit:contain;"/>`;
  }

  return `
    <!-- Background FX -->
    <div class="emblem-preview-bento__glow"></div>
    <!-- Emblem Image Container -->
    <div class="emblem-preview-bento__inner">
      <div class="emblem-display ${pulseClass}" id="previewImageWrapper" style="mix-blend-mode: screen;">
        ${imgHtml}
      </div>
    </div>
    <!-- Emblem Info -->
    <div class="emblem-preview-bento__info">
      <h3 class="emblem-preview-bento__title" id="previewTitle">${emblem.nome}</h3>
      <p class="emblem-preview-bento__desc" id="previewDesc">${emblem.desc}</p>
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; padding:10px 14px; background:rgba(0,0,0,0.3); border-radius:8px; border:1px solid rgba(255,255,255,0.1); margin-bottom:16px;">
        <span style="font-family:'Rajdhani', sans-serif; font-size:0.75rem; text-transform:uppercase; color:var(--text-tertiary); letter-spacing:1px;">Raridade</span>
        <span id="previewRarity" style="font-family:'Rajdhani', sans-serif; font-size:0.75rem; text-transform:uppercase; color:${emblem.corRaridade}; font-weight:700; letter-spacing:1px;">${emblem.raridade}</span>
      </div>
      <button class="emblem-preview-bento__equip-btn" id="btnEquiparEmblema" type="button">
        Equipar
      </button>
    </div>
  `;
}

export function _renderFrames(db) {
  const current = db.profileCustomization?.avatarFrame ?? null;
  return AVATAR_FRAMES.map(f => {
    const unlocked = isUnlocked(f.unlock, db);
    const active = f.key === current ? 'frame-option--active' : '';
    const locked = !unlocked ? 'frame-option--locked' : '';
    return `<div class="frame-option ${f.classe} ${active} ${locked}" data-frame="${f.key ?? ''}" ${!unlocked ? 'data-locked="true"' : ''}>
      <span class="frame-option__label">${f.nome}</span>
    </div>`;
  }).join('');
}

function _getPreviewStyle(key) {
  const style = BAR_SKIN_STYLES[key];
  if (!style || !style.background) return '';
  let css = `background:${style.background};`;
  if (style.boxShadow) css += `box-shadow:${style.boxShadow};`;
  return css;
}

export function _renderBarSkins(db) {
  const current = db.profileCustomization?.barSkin || 'default';
  return BAR_SKINS.map(s => {
    const unlocked = isUnlocked(s.unlock, db);
    const active = s.key === current ? 'bar-skin-option--active' : '';
    const locked = !unlocked ? 'bar-skin-option--locked' : '';
    const lockHint = !unlocked ? `<span class="bar-skin-option__hint">${s.hint}</span>` : '';
    const lockIcon = !unlocked ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10" style="position:absolute;top:6px;right:6px;opacity:0.6;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>` : '';
    const previewStyle = _getPreviewStyle(s.key);
    return `<div class="bar-skin-option bar-skin-option--${s.key} ${active} ${locked}" data-bar-skin="${s.key}" ${!unlocked ? 'data-locked="true"' : ''}>
      ${lockIcon}
      <div class="bar-skin-option__preview">
        <div class="bar-skin-option__fill-wrapper">
          <div class="bar-skin-option__fill" style="${previewStyle}"></div>
        </div>
      </div>
      <span class="bar-skin-option__label">${s.nome}</span>
      ${lockHint}
    </div>`;
  }).join('');
}

export function _renderTimerSkins(db) {
  const current = db.profileCustomization?.timerSkin || 'radar';
  return TIMER_SKINS.map(s => {
    const unlocked = isUnlocked(s.unlock, db);
    const active = s.key === current ? 'bar-skin-option--active' : '';
    const locked = !unlocked ? 'bar-skin-option--locked' : '';
    const lockHint = !unlocked ? `<span class="bar-skin-option__hint">${s.hint}</span>` : '';
    const lockIcon = !unlocked ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10" style="position:absolute;top:6px;right:6px;opacity:0.6;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>` : '';
    return `<div class="bar-skin-option bar-skin-option--${s.key} ${active} ${locked}" data-timer-skin="${s.key}" ${!unlocked ? 'data-locked="true"' : ''}>
      ${lockIcon}
      <div style="font-weight:700; font-size:0.8rem; text-align:center;">${s.nome}</div>
      ${lockHint}
    </div>`;
  }).join('');
}

function _renderFrasesPreset(db) {
  return FRASES_PRESET.map(f => {
    return `<button class="frase-preset-btn" data-frase="${f}" type="button">${f}</button>`;
  }).join('');
}

export function _renderCardSkins(db) {
  const current = db.profileCustomization?.cardSkin || 'default';
  return CARD_SKINS.map(s => {
    const unlocked = isUnlocked(s.unlock, db);
    const active = s.key === current ? 'card-skin-option--active' : '';
    const locked = !unlocked ? 'card-skin-option--locked' : '';
    const lockIcon = !unlocked ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10" style="position:absolute;top:6px;right:6px;opacity:0.6;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>` : '';
    const hint = !unlocked ? `<span class="card-skin-option__hint">${s.hint}</span>` : '';
    return `<div class="card-skin-option card-skin-option--${s.key} ${active} ${locked}" data-card-skin="${s.key}" ${!unlocked ? 'data-locked="true"' : ''}>
      ${lockIcon}
      <div class="card-skin-option__preview"></div>
      <span class="card-skin-option__label">${s.nome}</span>
      ${hint}
    </div>`;
  }).join('');
}

function _renderShowcaseStats(db) {
  const current = db.profileCustomization?.showcaseStat || 'streak';
  return SHOWCASE_STATS.map(s => {
    const val = s.compute(db);
    const active = s.key === current ? 'showcase-stat-option--active' : '';
    return `<div class="showcase-stat-option ${active}" data-showcase="${s.key}">
      <div class="showcase-stat-option__icon">${s.icon}</div>
      <span class="showcase-stat-option__label">${s.label}</span>
      <span class="showcase-stat-option__value">${val} ${s.unit}</span>
    </div>`;
  }).join('');
}

function _unlockHint(unlock) {
  if (!unlock) return '';
  switch (unlock.tipo) {
    case 'treinos': return `${unlock.val} treinos`;
    case 'streak':  return `${unlock.val} dias`;
    case 'xp':      return `${unlock.val} XP`;
    case 'maestria': return `Maestria ${unlock.val}`;
    default: return '';
  }
}

// ============================================================
// EVENTOS DO MODAL
// ============================================================

function _bindCustomizacaoEvents(overlay, db) {
  // Fechar
  const closeBtn = overlay.querySelector('#btnCloseCustomizacao');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => overlay.remove());
  }

  // Card Skins
  overlay.querySelectorAll('.card-skin-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.locked) { showToast('Desbloqueie este skin primeiro!', 'info'); return; }
      overlay.querySelectorAll('.card-skin-option').forEach(b => b.classList.remove('card-skin-option--active'));
      btn.classList.add('card-skin-option--active');
      document.body.setAttribute('data-card-skin', btn.dataset.cardSkin);
    });
  });

  // Showcase stat
  overlay.querySelectorAll('.showcase-stat-option').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.showcase-stat-option').forEach(b => b.classList.remove('showcase-stat-option--active'));
      btn.classList.add('showcase-stat-option--active');
    });
  });

  // Bar Skins
  overlay.querySelectorAll('.bar-skin-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.locked) { showToast('Desbloqueie este estilo primeiro!', 'info'); return; }
      overlay.querySelectorAll('.bar-skin-option').forEach(b => b.classList.remove('bar-skin-option--active'));
      btn.classList.add('bar-skin-option--active');
      // Preview ao vivo — aplica no body attr E diretamente no DOM
      document.body.setAttribute('data-bar-skin', btn.dataset.barSkin);
      _applyBarSkinToDOM(btn.dataset.barSkin);
    });
  });

  // Frases preset
  overlay.querySelectorAll('.frase-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = overlay.querySelector('#inputCustomAssinatura');
      if (input) input.value = btn.dataset.frase;
    });
  });

  // Banner
  overlay.querySelectorAll('.banner-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.locked) { showToast('Desbloqueie este banner primeiro!', 'info'); return; }
      overlay.querySelectorAll('.banner-option').forEach(b => b.classList.remove('banner-option--active'));
      btn.classList.add('banner-option--active');
    });
  });

  // Emblemas (máx 3)
  overlay.querySelectorAll('.emblem-gallery__item').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.locked) { showToast('Emblem bloqueado!', 'info'); return; }
      const id = btn.dataset.emblem;
      const actives = overlay.querySelectorAll('.emblem-gallery__item--active');
      if (btn.classList.contains('emblem-gallery__item--active')) {
        btn.classList.remove('emblem-gallery__item--active');
      } else {
        if (actives.length >= 3) { showToast('Máximo de 3 emblemas!', 'info'); return; }
        btn.classList.add('emblem-gallery__item--active');
      }
    });
  });

  // Títulos
  overlay.querySelectorAll('.titulo-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.locked) { showToast('Título bloqueado!', 'info'); return; }
      overlay.querySelectorAll('.titulo-option').forEach(t => t.classList.remove('titulo-option--active'));
      btn.classList.add('titulo-option--active');
    });
  });

  // Identity Emblems Selection
  overlay.querySelectorAll('[data-identity-emblem]').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('[data-identity-emblem]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const emblemId = btn.dataset.identityEmblem;
      const emblem = IDENTITY_EMBLEMS.find(e => e.id === emblemId);
      if (emblem) {
        const pulseCheckbox = overlay.querySelector('#pulseToggle') || overlay.querySelector('#modalPulseToggle');
        const isPulsing = pulseCheckbox ? pulseCheckbox.checked : true;
        const previewEl = overlay.querySelector('#identityEmblemPreview') || overlay.querySelector('#modalIdentityEmblemPreview');
        if (previewEl) {
          previewEl.innerHTML = _renderIdentityEmblemPreview(emblem, isPulsing);
          
          const equipBtn = previewEl.querySelector('#btnEquiparEmblema');
          if (equipBtn) {
            equipBtn.addEventListener('click', () => {
              _salvarCustomizacao(overlay, db);
            });
          }
        }
      }
    });
  });

  const initialEquipBtn = overlay.querySelector('#btnEquiparEmblema');
  if (initialEquipBtn) {
    initialEquipBtn.addEventListener('click', () => {
      _salvarCustomizacao(overlay, db);
    });
  }

  const pulseCheckbox = overlay.querySelector('#pulseToggle') || overlay.querySelector('#modalPulseToggle');
  if (pulseCheckbox) {
    pulseCheckbox.addEventListener('change', () => {
      const isChecked = pulseCheckbox.checked;
      _updatePulseToggleUI(overlay, isChecked);
      
      const wrapper = overlay.querySelector('#previewImageWrapper');
      if (wrapper) {
        if (isChecked) {
          wrapper.classList.add('animate-pulse-emblem');
        } else {
          wrapper.classList.remove('animate-pulse-emblem');
        }
      }
    });
  }

  // Molduras
  overlay.querySelectorAll('.frame-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.locked) { showToast('Moldura bloqueada!', 'info'); return; }
      overlay.querySelectorAll('.frame-option').forEach(f => f.classList.remove('frame-option--active'));
      btn.classList.add('frame-option--active');
    });
  });

  // Skins do Cronômetro
  overlay.querySelectorAll('.bar-skin-option[data-timer-skin]').forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.locked) { showToast('Skin de cronômetro bloqueada!', 'warning'); return; }
      overlay.querySelectorAll('.bar-skin-option[data-timer-skin]').forEach(b => b.classList.remove('bar-skin-option--active'));
      btn.classList.add('bar-skin-option--active');
    };
  });

  // Salvar
  const saveBtn = overlay.querySelector('#btnSalvarCustomizacao');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      _salvarCustomizacao(overlay, db);
    });
  }
}

function _salvarCustomizacao(overlay, db) {
  const cardSkinActive = overlay.querySelector('.card-skin-option--active');
  const cardSkin = cardSkinActive ? cardSkinActive.dataset.cardSkin : 'default';

  const showcaseActive = overlay.querySelector('.showcase-stat-option--active');
  const showcaseStat = showcaseActive ? showcaseActive.dataset.showcase : 'streak';

  const assinatura = (overlay.querySelector('#inputCustomAssinatura')?.value || '').trim();

  const barSkinActive = overlay.querySelector('.bar-skin-option[data-bar-skin].bar-skin-option--active');
  const barSkin = barSkinActive ? barSkinActive.dataset.barSkin : 'default';

  const timerSkinActive = overlay.querySelector('.bar-skin-option[data-timer-skin].bar-skin-option--active');
  const timerSkin = timerSkinActive ? timerSkinActive.dataset.timerSkin : 'radar';

  const nome = overlay.querySelector('#inputCustomNome').value.trim().toUpperCase() || 'DECEPTIVON';
  const handle = overlay.querySelector('#inputCustomHandle').value.trim() || '@deceptivon';

  const bannerActive = overlay.querySelector('.banner-option--active');
  const banner = bannerActive ? bannerActive.dataset.banner : 'roxo-neon';

  const emblemas = [...overlay.querySelectorAll('.emblem-gallery__item--active')].map(e => e.dataset.emblem);

  const tituloActive = overlay.querySelector('.titulo-option--active');
  const titulo = tituloActive ? (tituloActive.dataset.titulo || null) : null;

  const mainEmblemActive = overlay.querySelector('[data-identity-emblem].active');
  const mainEmblem = mainEmblemActive ? mainEmblemActive.dataset.identityEmblem : 'prestigio-1';

  const pulseCheckbox = overlay.querySelector('#pulseToggle') || overlay.querySelector('#modalPulseToggle');
  const mainEmblemPulse = pulseCheckbox ? pulseCheckbox.checked : true;

  const frameActive = overlay.querySelector('.frame-option--active');
  const avatarFrame = frameActive ? (frameActive.dataset.frame || null) : null;

  // Salva no DB
  db.profileCustomization = { ...db.profileCustomization, nome, handle, banner, titulo, avatarFrame, assinatura, barSkin, timerSkin, cardSkin, showcaseStat, mainEmblem, mainEmblemPulse };
  db.selectedEmblems = emblemas;
  saveDB(db);
  
  // Atualizar DOM Body Attributes
  document.body.dataset.barSkin = barSkin;
  document.body.dataset.cardSkin = cardSkin;
  localStorage.setItem('timerStyle', timerSkin);

  // Aplica imediatamente
  applyProfileCustomization(db);

  // Atualiza emblemas no perfil
  _renderProfileEmblems(db);
  renderProfileShowcase(db);

  if (overlay.classList.contains('modal-overlay')) {
    overlay.remove();
  } else {
    initPersonalizarTab(db);
  }
  showToast('Perfil atualizado!', 'success');
}

// ============================================================
// RENDERIZAR EMBLEMAS NO CARTÃO DE PERFIL
// ============================================================

export function _renderProfileEmblems(db) {
  const container = document.getElementById('profileEmblems');
  if (!container) return;
  const selected = db.selectedEmblems || [];
  const slots = [0, 1, 2];
  container.innerHTML = slots.map(i => {
    const embId = selected[i];
    const emb = embId ? EMBLEMAS.find(e => e.id === embId) : null;
    if (emb) {
      const animClass = emb.animated ? `emblem-gallery__icon--${emb.animationType}` : '';
      return `<div class="emblem-slot" data-slot="${i}" style="display:flex;align-items:center;justify-content:center;font-size:1.4rem;" title="${emb.nome}">
        <div class="emblem-gallery__icon ${animClass}">${emb.icon}</div>
      </div>`;
    }
    return `<div class="emblem-slot empty" data-slot="${i}"></div>`;
  }).join('');
}

// ============================================================
// RENDERIZAR VITRINE DE CONQUISTAS (FEATURE 7)
// ============================================================

export function renderProfileShowcase(db) {
  const container = document.getElementById('profileShowcase');
  if (!container) return;

  const showcaseStat = db.profileCustomization?.showcaseStat || 'streak';
  const statDef = SHOWCASE_STATS.find(s => s.key === showcaseStat);

  if (!statDef) {
    container.style.display = 'none';
    return;
  }

  const val = statDef.compute(db);

  container.innerHTML = `
    <div class="showcase-card__icon">${statDef.icon}</div>
    <div class="showcase-card__info">
      <div class="showcase-card__label">${statDef.label}</div>
      <div class="showcase-card__value">${val}<span class="showcase-card__unit">${statDef.unit}</span></div>
    </div>
    <div class="showcase-card__badge">${statDef.badge}    </div>
  `;
  container.style.display = 'flex';
}

// Reverte customizações que não foram desbloqueadas naturalmente
export function checkAndRevertLockedCustomizations(db) {
  const pc = db.profileCustomization || {};
  
  // Temporariamente forçar dev mode como falso para verificar desbloqueio natural
  const originalDevMode = localStorage.getItem('academia_dev_mode');
  localStorage.setItem('academia_dev_mode', 'false');

  try {
    // Banner
    if (pc.banner) {
      const b = BANNERS.find(x => x.key === pc.banner);
      if (b && !isUnlocked(b.unlock, db)) {
        pc.banner = 'roxo-neon';
      }
    }
    // Title
    if (pc.titulo) {
      const t = TITULOS.find(x => x.id === pc.titulo);
      if (t && !isUnlocked(t.unlock, db)) {
        pc.titulo = null;
      }
    }
    // Avatar frame
    if (pc.avatarFrame) {
      const f = AVATAR_FRAMES.find(x => x.key === pc.avatarFrame);
      if (f && !isUnlocked(f.unlock, db)) {
        pc.avatarFrame = null;
      }
    }
    // Bar skin
    if (pc.barSkin) {
      const s = BAR_SKINS.find(x => x.key === pc.barSkin);
      if (s && !isUnlocked(s.unlock, db)) {
        pc.barSkin = 'default';
        document.body.dataset.barSkin = 'default';
      }
    }
    // Card skin
    if (pc.cardSkin) {
      const s = CARD_SKINS.find(x => x.key === pc.cardSkin);
      if (s && !isUnlocked(s.unlock, db)) {
        pc.cardSkin = 'default';
        document.body.dataset.cardSkin = 'default';
      }
    }
    // Timer skin
    if (pc.timerSkin) {
      const s = TIMER_SKINS.find(x => x.key === pc.timerSkin);
      if (s && !isUnlocked(s.unlock, db)) {
        pc.timerSkin = 'radar';
        localStorage.setItem('timerStyle', 'radar');
      }
    }
    // Selected Emblems
    if (db.selectedEmblems) {
      db.selectedEmblems = db.selectedEmblems.filter(embId => {
        const e = EMBLEMAS.find(x => x.id === embId);
        return !e || isUnlocked(e.unlock, db);
      });
    }
  } finally {
    // Restaurar o valor original do dev mode
    localStorage.setItem('academia_dev_mode', originalDevMode);
  }

  db.profileCustomization = pc;
  saveDB(db);
  applyProfileCustomization(db);
}
