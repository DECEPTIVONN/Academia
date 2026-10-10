/**
 * search-index.ts — Índice da Busca Geral Unificada (v4.6.0-shell)
 *
 * Monta e consulta o índice de quatro fontes:
 *   • Seções do app (as 5 abas da navegação);
 *   • Exercícios (tabela exercises);
 *   • Fichas A–J (tabela sheets);
 *   • Configurações do hub do Perfil (raiz do HubShell + grupos).
 *
 * Ranking simples e determinístico: match exato → prefixo → substring →
 * keyword; desempate por tipo (seção > config > exercício > ficha) e ordem
 * alfabética. A navegação profunda usa `stack` (ids do HubShell) e/ou
 * `sheetKey`/`exerciseName` interpretados pelo App na hora do pick.
 */

import type { LocalData } from '@/core/db/queries';
import type { SheetKey } from '@/core/db/schema';
import type { SectionType } from '@/components/BottomNav';

export type SearchKind = 'secao' | 'config' | 'exercicio' | 'ficha';

export interface SearchItem {
  /** Chave única do item no índice */
  id: string;
  kind: SearchKind;
  title: string;
  desc: string;
  keywords?: string[];
  /** Seções */
  section?: SectionType;
  /** Configurações/grupos do hub do Perfil (pilha do HubShell) */
  stack?: string[];
  /** Fichas */
  sheetKey?: SheetKey;
  /** Exercícios */
  exerciseName?: string;
}

export interface RankedGroup {
  key: 'secoes' | 'configs' | 'exercicios' | 'fichas';
  items: SearchItem[];
}

export type SearchGroups = Record<'secoes' | 'configs' | 'exercicios' | 'fichas', SearchItem[]> & {
  /** Grupos na ordem de exibição (melhor match primeiro) */
  ordered: RankedGroup[];
};

const SECTIONS: SearchItem[] = [
  { id: 'sec:progresso', kind: 'secao', title: 'Progresso', desc: 'Histórico, gráficos, radar e 1RM', section: 'progresso', keywords: ['evolucao', 'graficos', 'historico', 'radar', 'estatisticas'] },
  { id: 'sec:treinos', kind: 'secao', title: 'Treinos', desc: 'Exercícios, coleção e montar ficha', section: 'treinos', keywords: ['exercicios', 'fichas', 'montar', 'biblioteca'] },
  { id: 'sec:dashboard', kind: 'secao', title: 'Início (Dashboard)', desc: 'Ficha do dia, sugestão e resumo', section: 'dashboard', keywords: ['inicio', 'dashboard', 'home', 'ficha do dia'] },
  { id: 'sec:social', kind: 'secao', title: 'Social', desc: 'Ligas, amigos e guilda', section: 'social', keywords: ['ligas', 'amigos', 'guilda', 'chat', 'ranking'] },
  { id: 'sec:loja', kind: 'secao', title: 'Loja', desc: 'Itens, skins e upgrades', section: 'loja', keywords: ['loja', 'skins', 'itens', 'comprar'] },
];

const CONFIGS: SearchItem[] = [
  { id: 'cfg:seguranca', kind: 'config', title: 'Segurança e Bloqueio', desc: 'Senha do app, biometria, inatividade e wallpaper', stack: ['seguranca'], keywords: ['bloqueio', 'senha', 'pin', 'biometria', 'digital', 'inatividade', 'lock'] },
  { id: 'cfg:cores', kind: 'config', title: 'Cor de Destaque', desc: 'Tema e cor personalizada do app', stack: ['cores'], keywords: ['cor', 'tema', 'custom', 'roxo', 'acento'] },
  { id: 'cfg:exibicao', kind: 'config', title: 'Exibição', desc: 'Navbar, tela cheia automática e timer', stack: ['exibicao'], keywords: ['navbar', 'tela cheia', 'fullscreen', 'timer', 'modo'] },
  { id: 'cfg:notificacoes', kind: 'config', title: 'Notificações', desc: 'Lembrete de treino e avisos', stack: ['notificacoes'], keywords: ['lembrete', 'aviso', 'push', 'treino'] },
  { id: 'cfg:conta', kind: 'config', title: 'Conta', desc: 'Informações, senha, backup e restaurar', stack: ['conta'], keywords: ['conta', 'perfil', 'backup', 'exportar', 'restaurar', 'senha'] },
  { id: 'cfg:perfil', kind: 'config', title: 'Perfil', desc: 'Cartão, ofensivas e medalhas', stack: ['perfil'], keywords: ['cartao', 'ofensivas', 'medalhas', 'amigos'] },
  { id: 'cfg:progressao', kind: 'config', title: 'Progressão', desc: 'Visão geral, nível/XP e conquistas', stack: ['progressao'], keywords: ['nivel', 'xp', 'conquistas', 'progresso'] },
  { id: 'cfg:personalizar', kind: 'config', title: 'Personalizar', desc: 'Identidade, frase, destaque e título', stack: ['personalizar'], keywords: ['identidade', 'frase', 'titulo', 'emoji', 'destaque'] },
];

/** Monta o índice de exercícios + fichas a partir dos dados locais. */
export function buildDynamicIndex(data: LocalData): SearchItem[] {
  const exercicios: SearchItem[] = data.exercises.map((e) => ({
    id: `ex:${e.id}`,
    kind: 'exercicio' as const,
    title: e.name,
    desc: e.muscleGroup,
    keywords: [e.muscleGroup.toLowerCase()],
    exerciseName: e.name,
  }));

  const fichas: SearchItem[] = data.sheets.map((s) => ({
    id: `ficha:${s.sheetKey}`,
    kind: 'ficha' as const,
    title: `Ficha ${s.sheetKey}`,
    desc: `${s.exerciseIds.length} exercício(s)`,
    keywords: [`ficha ${s.sheetKey.toLowerCase()}`, `treino ${s.sheetKey.toLowerCase()}`],
    sheetKey: s.sheetKey,
  }));

  return [...exercicios, ...fichas];
}

/** Remove acentos/diacríticos (busca "seguranca" encontra "Segurança"). */
function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function scoreItem(item: SearchItem, rawQ: string): number {
  const q = deaccent(rawQ);
  const title = deaccent(item.title);
  if (title === q) return 0;
  if (title.startsWith(q)) return 1;
  if (title.includes(q)) return 2;
  if (deaccent(item.desc ?? '').includes(q)) return 3;
  if ((item.keywords ?? []).some((k) => deaccent(k).includes(q))) return 4;
  return -1;
}

const KIND_ORDER: Record<SearchKind, number> = {
  secao: 0,
  config: 1,
  exercicio: 2,
  ficha: 3,
};

function rank(
  items: SearchItem[],
  q: string,
  limit: number
): { items: SearchItem[]; best: number } {
  const scored = items
    .map((it) => ({ it, s: scoreItem(it, q) }))
    .filter((r) => r.s >= 0)
    .sort(
      (a, b) =>
        a.s - b.s ||
        KIND_ORDER[a.it.kind] - KIND_ORDER[b.it.kind] ||
        a.it.title.localeCompare(b.it.title)
    );
  return {
    items: scored.slice(0, limit).map((r) => r.it),
    best: scored.length ? scored[0].s : Number.MAX_SAFE_INTEGER,
  };
}

/**
 * Consulta o índice. Query vazia → mostra as 5 seções (estado inicial do
 * overlay, para dar contexto em vez de tela em branco).
 *
 * `ordered` traz os grupos já ordenados pelo MELhor match de cada grupo —
 * assim o Enter seleciona o resultado mais relevante (ex.: "supina" com
 * "Supino Reto" antes da seção Treinos), mantendo os itens agrupados.
 */
export function queryIndex(dynamic: SearchItem[], rawQuery: string): SearchGroups {
  const q = rawQuery.trim().toLowerCase();

  if (!q) {
    const groups = {
      secoes: SECTIONS.slice(0, 5),
      configs: [] as SearchItem[],
      exercicios: [] as SearchItem[],
      fichas: [] as SearchItem[],
    };
    return { ...groups, ordered: [{ key: 'secoes' as const, items: groups.secoes }] };
  }

  const rSecoes = rank(SECTIONS, q, 5);
  const rConfigs = rank(CONFIGS, q, 6);
  const rExercicios = rank(
    dynamic.filter((d) => d.kind === 'exercicio'),
    q,
    6
  );
  const rFichas = rank(dynamic.filter((d) => d.kind === 'ficha'), q, 6);

  const groups: Omit<SearchGroups, 'ordered'> = {
    secoes: rSecoes.items,
    configs: rConfigs.items,
    exercicios: rExercicios.items,
    fichas: rFichas.items,
  };

  const ranked = [
    { key: 'secoes' as const, ...rSecoes },
    { key: 'configs' as const, ...rConfigs },
    { key: 'exercicios' as const, ...rExercicios },
    { key: 'fichas' as const, ...rFichas },
  ]
    .filter((g) => g.items.length > 0)
    .sort((a, b) => a.best - b.best)
    .map(({ key, items }) => ({ key, items }));

  return { ...groups, ordered: ranked };
}

/** Achata os grupos preservando a ordem de exibição (para setas do teclado). */
export function flattenGroups(groups: SearchGroups): SearchItem[] {
  return groups.ordered.flatMap((g) => g.items);
}
