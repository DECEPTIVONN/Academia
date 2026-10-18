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

/* ============================================================
   CARGA EFETIVA / VOLUME MÉDIO DE CARGA (v4.32.0)
   ============================================================
   O campo `load` é TEXTO livre ("30 kg", "12 kg cada lado", "Peso do
   Corpo"), então o cálculo do "volume médio de carga" precisa de um parse
   explícito — `parseFloat('30 kg')` funciona, mas `parseFloat` de uma string
   vazia devolvia 0 e o rodapé ficava sempre em 0.0 (o seed nunca grava
   `load`; ver v4.31.0). Estas 3 funções são o ÚNICO parse de carga para
   métricas: telas não devem repetir regex/parseFloat.
   ============================================================ */

/** Exercício (ou parte dele) suficiente para o cálculo da carga. */
export interface LoadBearingExercise {
  name?: string;
  muscleGroup?: string;
  tags?: readonly string[];
  load?: string | null;
}

/**
 * Converte a string de carga em kg (número).
 *
 *  - "30 kg"                → 30
 *  - "12,5 kg"              → 12.5
 *  - "12 kg cada lado"      → 24 (o peso vai nos DOIS lados da barra — decisão
 *                             do usuário em v4.32.0)
 *  - "Peso do Corpo" / ""   → 0 (sem carga externa/noção de kg)
 */
export function parseLoadKg(value?: string | null): number {
  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  /* "Peso do Corpo" não tem número — o regex abaixo já devolveria 0; o teste
     explícito deixa a intenção legível (e cobre "Peso do Corpo 10 kg"? não:
     aí o número vence, que é o desejado). */
  if (/peso\s*do\s*corpo/i.test(raw) && !/\d/.test(raw)) return 0;

  const match = raw.replace(',', '.').match(/\d+(?:\.\d+)?/);
  if (!match) return 0;

  const kg = parseFloat(match[0]);
  if (!Number.isFinite(kg)) return 0;
  return /cada\s*lado/i.test(raw) ? kg * 2 : kg;
}

/**
 * Carga EFETIVA (kg) do exercício: a carga SALVA no campo `load` e, quando
 * ele ainda está vazio, a carga SUGERIDA pelo nome/grupo muscular (v4.31.0).
 * É esse número que alimenta o "volume médio de carga" — era exatamente o que
 * faltava: o peso sugerido aparecia na tela mas não entrava na conta.
 */
export function effectiveLoadKg(ex: LoadBearingExercise): number {
  const saved = parseLoadKg(ex.load);
  if (saved > 0) return saved;
  return parseLoadKg(getSuggestedLoad(ex));
}

/**
 * Volume médio de carga (kg) de uma lista de exercícios: média simples das
 * cargas EFETIVAS. Exercícios sem carga externa (peso do corpo/core) entram
 * como 0 — mesma contagem do legado (divide pelo total de exercícios).
 */
export function averageLoadKg(list: readonly LoadBearingExercise[]): number {
  if (list.length === 0) return 0;
  const total = list.reduce((sum, ex) => sum + effectiveLoadKg(ex), 0);
  return total / list.length;
}
