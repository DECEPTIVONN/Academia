/**
 * suggested-load.ts — Peso inicial SUGERIDO por exercício (v4.31.0).
 *
 * O legado não sugere cargas: todo exercício nasce com `load: ''` e o usuário
 * define a carga na mão. Aqui derivamos uma sugestão a partir do NOME do
 * exercício (regras por palavra-chave, da mais específica para a mais
 * genérica) e, quando o nome não casa com nenhuma regra, pelo grupo muscular.
 *
 * A sugestão é apenas uma DICA de exibição/tela — NUNCA é gravada no campo
 * `load` do exercício. Quem grava continua sendo o formulário de exercício.
 *
 * Usado em:
 *  - cartões de exercício da ficha (tabela e grid) e da aba Personalizar;
 *  - placeholder do campo "Carga" do formulário de exercício.
 */

/** Normaliza (sem acentos, minúsculo) para comparar com as regras. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Mesma string usada por `formatCarga` para exercícios de peso do corpo. */
const BODY_WEIGHT = 'Peso do Corpo';

/**
 * Regras nome → sugestão. A ORDEM IMPORTA: a primeira que casar vence, então
 * as mais específicas ("supino reto com halteres") vêm antes das genéricas
 * ("supino"). Os regexes são aplicados sobre o nome normalizado (sem acentos).
 */
const NAME_RULES: Array<[RegExp, string]> = [
  /* ── Sem carga externa: core, solo e peso do corpo ── */
  [
    /\b(supra|infra|prancha|ponte ventral|abdominal|extensao lombar|elevacao de joelho|flexao de quadril|flexao de bracos|abducao solo|gluteo \d|elevacao pelvica)\b/,
    BODY_WEIGHT,
  ],
  [/\b(barra fixa|pull up|pullup)\b/, BODY_WEIGHT],

  /* ── Pernas ── */
  [/\bpanturrilha\b/, '50 kg'],
  [/\b(leg press|leg 45|leg 180)\b/, '80 kg'],
  [/\bhack\b/, '40 kg'],
  [/agachamento\s*(gaiola|guiado|smith|maquina)/, '30 kg'],
  [/agachamento\s*(bulgaro|unilateral)/, '10 kg cada lado'],
  [/agachamento/, '20 kg'],
  [/\b(afundo|passada|lunge)\b/, '10 kg cada lado'],
  [/\b(stiff|levantamento terra|terra)\b/, '20 kg'],
  [/\b(flexor|flexora|mesa flexora)\b/, '30 kg'],
  [/\b(extensor|extensora)\b/, '30 kg'],
  [/\b(abdutor|abdutora)\b/, '30 kg'],
  [/\b(adutor|adutora)\b/, '30 kg'],
  [/\bburrinho\b/, '20 kg'],
  [/\bcoice\b/, '10 kg'],

  /* ── Peito ── */
  [/\bsupino\s*(reto|plano)?\s*(com\s*)?halter/, '12 kg cada lado'],
  [/\bsupino\s*(45|inclinado|declinado)/, '25 kg'],
  [/\bsupino\s*(articulado|maquina)/, '30 kg'],
  [/\bsupino\s*(vertical|ombro)/, '25 kg'],
  [/\bsupino/, '30 kg'],
  [/\bcrucifixo\b/, '8 kg cada lado'],
  [/\bvoador\b/, '25 kg'],
  [/\bvoo\s*45|voo\b/, '8 kg cada lado'],

  /* ── Ombros ── */
  [/\belevacao\s*lateral\b/, '6 kg cada lado'],
  [/\belevacao\s*frontal\b/, '6 kg cada lado'],
  [/\bdesenvolvimento\s*(ombro\s*)?(com\s*)?halter/, '10 kg cada lado'],
  [/\bdesenvolvimento\s*(frontal|articulado|maquina)\b/, '20 kg'],
  [/\bdesenvolvimento\s*barra\b/, '15 kg'],
  [/\bdesenvolvimento\b/, '20 kg'],
  [/\bencolhimento\b/, '20 kg cada lado'],

  /* ── Costas ── */
  [/\bremada\s*unilateral\b/, '12 kg cada lado'],
  [/\bremada\s*(cavalinho|maquina)\b/, '25 kg'],
  [/\bremada\s*alta\b/, '20 kg'],
  [/\bremada\b/, '30 kg'],
  [/\bpuxada\b/, '30 kg'],
  [/\bpull\s*down\b/, '30 kg'],
  [/\b(fly inverso|voador inverso|crucifixo inverso)\b/, '6 kg cada lado'],

  /* ── Bíceps ── */
  [/\brosca\s*(scott|scoot|90)\s*unilateral/, '8 kg cada lado'],
  [/\brosca\s*(scott|scoot|90)/, '15 kg'],
  [/\brosca\s*martelo\b/, '12 kg cada lado'],
  [/\brosca\s*direta\s*(cross|pulley|cabo)\b/, '15 kg'],
  [/\brosca\s*(punho|inversa)\b/, '10 kg'],
  [/\brosca\s*direta\b/, '10 kg'],
  [/\brosca\b/, '10 kg'],

  /* ── Tríceps ── */
  [/\b(?:tricep\w*|tric)\s*(testa|frances|franc)/, '15 kg'],
  [/\b(?:tricep\w*|tric)\s*(pulley|puller|pulover|pull over|corda|palmar|coice|banco|maquina)/, '20 kg'],
  [/\b(?:tricep\w*|tric)\b/, '15 kg'],

  /* ── Antebraços ── */
  [/\b(rosca de punho|flexao de punho|punho)\b/, '10 kg'],
  [/\b(farmer|passeio do fazendeiro)\b/, '20 kg cada lado'],
];

/** Fallback por grupo muscular (chaves normalizadas). */
const GROUP_FALLBACK: Record<string, string> = {
  peito: '25 kg',
  costas: '25 kg',
  ombros: '15 kg',
  biceps: '10 kg',
  triceps: '15 kg',
  pernas: '30 kg',
  gluteos: '20 kg',
  antebracos: '10 kg',
  core: BODY_WEIGHT,
};

/**
 * Peso inicial sugerido para um exercício, de acordo com o respectivo nome.
 * Retorna `null` quando não há sugestão (ex.: cardio) ou quando o exercício já
 * é de peso do corpo por TAG — nesse caso `formatCarga` já exibe "Peso do Corpo".
 */
export function getSuggestedLoad(input: {
  name?: string;
  muscleGroup?: string;
  tags?: readonly string[];
}): string | null {
  const name = normalize(input.name ?? '');
  if (!name) return null;
  if (input.tags?.includes('Peso do Corpo')) return null;

  for (const [rule, value] of NAME_RULES) {
    if (rule.test(name)) return value;
  }

  return GROUP_FALLBACK[normalize(input.muscleGroup ?? '')] ?? null;
}

/**
 * Como `getSuggestedLoad`, mas só quando o exercício AINDA NÃO tem carga
 * definida — é o caso de uso das telas (a dica some quando o usuário já
 * escolheu o peso dele).
 */
export function getSuggestedLoadIfMissing(ex: {
  name?: string;
  muscleGroup?: string;
  tags?: readonly string[];
  load?: string | null;
}): string | null {
  if (ex.load) return null;
  return getSuggestedLoad(ex);
}
