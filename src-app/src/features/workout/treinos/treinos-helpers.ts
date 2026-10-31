/**
 * treinos-helpers.ts — Camada de dados/mutações da seção Treinos (Fase 4)
 * Port de secao-treinos.js (saveExercicio, confirmDeleteExercicio, renderMontar
 * mutações de deck, openAerobicoModal, applyTemplate) + startNewCycle de
 * secao-ficha.js L512–537 sobre as tabelas React (exercises/workoutSheets).
 *
 * Contrato de slots (v4.58.0):
 *  - `WorkoutSheet.exerciseIds` guarda as 8 POSIÇÕES do deck e um slot vazio
 *    é a string vazia `''` (buraco), então o exercício fica exatamente no slot
 *    em que foi solto (1..8) em vez de cair no próximo número livre.
 *  - Quem precisa só da LISTA de exercícios usa `compactIds` (core/db/queries).
 *  - O legado usava nulls nas 8 posições; até a v4.58.x o array era compacto e
 *    a posição do slot se perdia na remoção.
 */

import {
  effectiveAerobic,
  LOCAL_USER_ID,
  type AerobicConfig,
  type Exercise,
  type SheetKey,
  type WorkoutSheet,
} from '@/core/db/schema';
import { emitDbReady, getUserSheets, idb, upsertSheet } from '@/core/db/idb';
import { compactIds, SHEET_ORDER, today, type LocalData } from '@/core/db/queries';
import { patchLegacyState } from '@/core/db/legacy-state';
import { effectiveLoadKg } from '@/lib/suggested-load';
import { showToast } from '@/lib/toast';
import { formatSpeed } from '@/lib/app-prefs';

/* ── Helpers básicos (db.js L373 uid / L387 formatCarga já em queries) ── */

export function uid(): string {
  return 'ex-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

/** Parse numérico de carga (saveExercicio L214: remove não-dígitos, troca vírgula). */
export function parseCargaNum(carga: string): number {
  const n = parseFloat(carga.replace(/[^\d.,]/g, '').replace(',', '.'));
  return Number.isNaN(n) ? NaN : n;
}

/* ── Fichas (sheets) ── */

function defaultSheet(letter: SheetKey): WorkoutSheet {
  return {
    userId: LOCAL_USER_ID,
    sheetKey: letter,
    exerciseIds: [],
    /* v4.31.0 — o cardio padrão (10 min/esteira/3 km/h) NÃO é gravado: ele é
       aplicado na leitura (`effectiveAerobic`). Gravar aqui faria `fichas
       vazias` passarem por "prontas" (getAvailableWorkouts/determineNextTreino
       consideram aeróbico como conteúdo). */
    aerobic: null,
    isArchived: false,
    updatedAt: new Date().toISOString(),
  };
}

/** Lê a ficha atual (ou cria a default em memória). */
export async function getSheet(letter: SheetKey): Promise<WorkoutSheet> {
  const sheets = await getUserSheets(LOCAL_USER_ID);
  return sheets.find((s) => s.sheetKey === letter) ?? defaultSheet(letter);
}

/** Aplica uma mutação sobre os exerciseIds da ficha, persiste e emite db-ready. */
export async function mutateSheetIds(
  letter: SheetKey,
  mut: (ids: string[]) => string[]
): Promise<string[]> {
  const sheet = await getSheet(letter);
  const ids = mut([...sheet.exerciseIds]);
  await upsertSheet({
    ...sheet,
    exerciseIds: ids,
    updatedAt: new Date().toISOString(),
  });
  emitDbReady();
  return ids;
}

/** Grava o aeróbico da ficha (openAerobicoModal L1082–1095). */
export async function saveSheetAerobic(
  letter: SheetKey,
  ae: AerobicConfig
): Promise<void> {
  const sheet = await getSheet(letter);
  await upsertSheet({
    ...sheet,
    aerobic: ae,
    updatedAt: new Date().toISOString(),
  });
  emitDbReady();
}

/* ── Deck: regras de slots ── */

export const DECK_MAX = 8;

/** Valor de um SLOT VAZIO do deck (a posição 1..8 é preservada). */
export const EMPTY_SLOT = '';

/** Quantos exercícios o deck realmente tem (ignora slots vazios). */
export function deckCount(ids: string[]): number {
  return compactIds(ids).length;
}

/** Remove buracos do fim do array (posições sobrando não precisam existir). */
function trimSlots(ids: string[]): string[] {
  const next = [...ids];
  while (next.length > 0 && !next[next.length - 1]) next.pop();
  return next;
}

/**
 * Insere `exId` na posição `idx`, empurrando os seguintes para a direita SEM
 * perder exercícios: o que sair da 8ª posição vai para o primeiro slot vazio.
 */
function insertAtSlot(ids: string[], idx: number, exId: string): string[] | null {
  const next = [...ids];
  while (next.length <= idx) next.push(EMPTY_SLOT);
  next.splice(idx, 0, exId);
  if (next.length > DECK_MAX) {
    const overflow = next.splice(DECK_MAX).filter(Boolean);
    for (const id of overflow) {
      const hole = next.findIndex((value) => !value);
      if (hole < 0) return null;
      next[hole] = id;
    }
  }
  return next;
}

/** Clique no card da coleção: ocupa o primeiro slot vazio (ou o fim) se < 8. */
export function addFromCollection(ids: string[], exId: string): string[] | null {
  if (ids.includes(exId)) return null;
  if (deckCount(ids) >= DECK_MAX) return null;
  const hole = ids.findIndex((value) => !value);
  if (hole >= 0) {
    const next = [...ids];
    next[hole] = exId;
    return next;
  }
  return [...ids, exId];
}

/**
 * Drop da coleção no slot `target` (0–7): o exercício OCUPA o slot solto
 * (posições anteriores podem ficar vazias), em vez de cair no próximo número
 * livre. Slot ocupado → insere antes (empurra os seguintes).
 */
export function dropCollectionAt(
  ids: string[],
  exId: string,
  target: number
): string[] | null {
  const next = ids.filter((i) => i !== exId);
  if (deckCount(next) >= DECK_MAX) return null;
  const t = Math.max(0, Math.min(target, DECK_MAX - 1));

  if (t >= next.length || !next[t]) {
    const slots = [...next];
    while (slots.length < t) slots.push(EMPTY_SLOT);
    if (slots.length === t) slots.push(exId);
    else slots[t] = exId;
    return slots;
  }
  return insertAtSlot(next, t, exId);
}

/** Reordenar grid→grid (L379–383): troca source↔target (aceita slots vazios). */
export function swapSlots(
  ids: string[],
  source: number,
  target: number
): string[] | null {
  if (source < 0 || source >= DECK_MAX || target < 0 || target >= DECK_MAX) {
    return null;
  }
  if (source >= ids.length && target >= ids.length) return null;
  const next = [...ids];
  while (next.length <= Math.max(source, target)) next.push(EMPTY_SLOT);
  const temp = next[target];
  next[target] = next[source];
  next[source] = temp;
  return trimSlots(next);
}

/** Remover do deck (L431–448): o slot fica VAZIO e os demais não se movem. */
export function removeFromDeck(ids: string[], exId: string): string[] {
  return trimSlots(ids.map((id) => (id === exId ? EMPTY_SLOT : id)));
}

/* ── Exercícios ── */

/** confirmDeleteExercicio (L242–262): remove exercício + limpa de todas as fichas. */
export async function deleteExerciseRecord(exId: string): Promise<void> {
  await idb.exercises.delete(exId);
  const sheets = await getUserSheets(LOCAL_USER_ID);
  for (const sheet of sheets) {
    if (sheet.exerciseIds.includes(exId)) {
      await upsertSheet({
        ...sheet,
        /* v4.58.0 — o slot do exercício apagado fica vazio: as posições dos
           outros exercícios do deck não mudam. */
        exerciseIds: removeFromDeck(sheet.exerciseIds, exId),
        updatedAt: new Date().toISOString(),
      });
    }
  }
  emitDbReady();
}

/** Grava (novo/editado) exercício com histórico de carga (saveExercicio L189–240). */
export async function saveExerciseRecord(
  ex: Exercise,
  isNew: boolean
): Promise<string> {
  await idb.exercises.put(ex);
  emitDbReady();
  return isNew ? 'Exercício cadastrado!' : 'Exercício atualizado!';
}

/** Monta o histórico de carga ao salvar (L211–232). Retorna toastMsg extra. */
export function buildHistorico(
  prev: Exercise['historicoCargas'],
  carga: string,
  prevLoad: string | undefined,
  isEdit: boolean
): { historicoCargas: Exercise['historicoCargas']; recordToast: string | null } {
  const hist = [...(prev ?? [])];
  let recordToast: string | null = null;

  if (isEdit) {
    const isNewLoad = Boolean(carga) && carga !== prevLoad;
    if (isNewLoad) {
      const numCarga = parseCargaNum(carga);
      if (!Number.isNaN(numCarga)) {
        const lastVal = hist.length > 0 ? hist[hist.length - 1].valor : 0;
        if (numCarga > lastVal && lastVal > 0) {
          recordToast = `📈 RECORDE! Nova carga máxima: ${carga}! O monstro tá saindo da jaula!`;
        }
        hist.push({ data: today(), valor: numCarga, label: carga });
        if (hist.length > 15) hist.shift();
      }
    }
  } else if (carga) {
    const numCarga = parseCargaNum(carga);
    if (!Number.isNaN(numCarga)) {
      hist.push({ data: today(), valor: numCarga, label: carga });
    }
  }

  return { historicoCargas: hist, recordToast };
}

/* ── Ciclo (secao-ficha.js L512–537 startNewCycle) ── */

/**
 * Arquiva o ciclo atual (snapshot das fichas React) e reinicia contadores.
 * Diferença do legado: o snapshot vem das `sheets` (fonte de verdade React),
 * não do `db.fichas` bruto (stale após a migração).
 */
export async function startNewCycle(
  data: LocalData,
  reason: string
): Promise<void> {
  const fichas: Record<string, string[]> = {};
  const aerobicos: Record<string, AerobicConfig | null> = {};
  for (const key of SHEET_ORDER) {
    const sheet = data.sheets.find((s) => s.sheetKey === key);
    fichas[key] = sheet?.exerciseIds ?? [];
    aerobicos[key] = sheet?.aerobic ?? null;
  }

  const legacy = data.legacy;
  const archive = {
    data: today(),
    reason,
    fichas,
    aerobicos,
    workoutsDone: legacy?.currentFichaWorkouts ?? 0,
    breakdown: { ...(legacy?.currentCycleBreakdown ?? {}) },
  };
  const fichasArquivadas = Array.isArray(legacy?.fichasArquivadas)
    ? [...legacy.fichasArquivadas]
    : [];

  fichasArquivadas.push(archive);

  await patchLegacyState({
    fichasArquivadas,
    currentFichaWorkouts: 0,
    currentCycleBreakdown: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
    currentCycleStartDate: today(),
    cycleEvents: {
      ...(legacy?.cycleEvents ?? {}),
      [today()]: reason === 'Ciclo Concluído' ? 'Novo Ciclo' : 'Ciclo Alterado Manualmente',
    },
  });

  window.setTimeout(() => {
    showToast(`🔱 ${reason.toUpperCase()}! Iniciando nova contagem.`, 'success');
  }, 1000);
}

/* ── Templates (secao-treinos.js L1160–1228) ── */

export interface ProntoTemplate {
  A: string[];
  B: string[];
  ae?: AerobicConfig;
}

export const TEMPLATES_PRONTOS: Record<string, ProntoTemplate> = {
  hipertrofia_iniciante: {
    A: ['ex-a1', 'ex-a2', 'ex-a5', 'ex-a6', 'ex-a8'],
    B: ['ex-b1', 'ex-b2', 'ex-b5', 'ex-b4', 'ex-b7'],
  },
  perda_ponderal: {
    A: ['ex-a1', 'ex-a2', 'ex-a3', 'ex-a4', 'ex-a5', 'ex-a6', 'ex-tric-pulley', 'ex-supra-solo'],
    B: ['ex-b1', 'ex-b2', 'ex-b3', 'ex-b4', 'ex-b5', 'ex-burrinho', 'ex-b7', 'ex-supra-solo'],
    ae: { tipo: 'Esteira', vel: '5.0', tempo: '20' },
  },
  sup_inf: {
    A: ['ex-a1', 'ex-a2', 'ex-b1', 'ex-b2', 'ex-a6'],
    B: ['ex-a5', 'ex-b5', 'ex-a8', 'ex-b8'],
  },
  push_pull: {
    A: ['ex-a1', 'ex-a2', 'ex-a6', 'ex-a7'],
    B: ['ex-b1', 'ex-b2', 'ex-b7', 'ex-b8'],
  },
  tonificar: {
    A: ['ex-gluteo-3a', 'ex-abducao-solo', 'ex-supra-ponte', 'ex-b5', 'ex-a3', 'ex-a2', 'ex-banco-abdutor'],
    B: ['ex-extensor', 'ex-leg-180', 'ex-banco-adutor', 'ex-burrinho', 'ex-b2', 'ex-b3', 'ex-infra-solo'],
    ae: { tipo: 'Geral', vel: '---', tempo: '20' },
  },
  hipertrofia_medio: {
    A: ['ex-a2', 'ex-elev-frontal', 'ex-leg-45', 'ex-tric-puller', 'ex-banco-adutor', 'ex-agach-gaiola', 'ex-voo-45', 'ex-infra-prancha'],
    B: ['ex-remad-artic', 'ex-roscamartelo-90', 'ex-b5', 'ex-banco-abdutor', 'ex-burrinho', 'ex-roscamartelo', 'ex-b1', 'ex-ponteventral'],
  },
  perda_ponderal_media: {
    A: ['ex-hack', 'ex-extensor', 'ex-remad-artic', 'ex-rosca-direta-barra-livre', 'ex-rosca-direta-cross', 'ex-remada-cavalinho', 'ex-banco-adutor', 'ex-banco-abdutor', 'ex-supra-banco'],
    B: ['ex-mesa-flexora', 'ex-panturrilha-livre', 'ex-flexao-quadril', 'ex-triceps-corda', 'ex-supino-reto', 'ex-desenvolvimento-ombro-halter', 'ex-elev-frontal', 'ex-supra-banco'],
    ae: { tipo: 'Geral', vel: '---', tempo: '20' },
  },
  hipertrofia_medio_ii: {
    A: ['ex-supino-reto-halteres', 'ex-a4', 'ex-a1', 'ex-agach-guiado', 'ex-extensor', 'ex-desenvolvimento-frente', 'ex-triceps-corda', 'ex-triceps-palmar'],
    B: ['ex-puxada-supinada', 'ex-fly-inverso', 'ex-remada-cavalinho', 'ex-b5', 'ex-mesa-flexora', 'ex-rosca-direta-barra-livre', 'ex-b4', 'ex-a8'],
  },
  perda_ponderal_media_ii: {
    A: ['ex-leg-45', 'ex-panturrilha-leg-45', 'ex-elevacao-joelho', 'ex-supino-45', 'ex-triceps-testa-barra-h', 'ex-desenvolvimento-barra', 'ex-b6', 'ex-b8'],
    B: ['ex-b5', 'ex-remada-unilateral', 'ex-pull-down', 'ex-roscott-unilateral', 'ex-rosca-direta-cross', 'ex-fly-inverso', 'ex-supra-solo', 'ex-extensao-lombar'],
    ae: { tipo: 'Geral', vel: '---', tempo: '20' },
  },
};

/**
 * applyTemplate (L1203–1228): grava fichas A/B + aeróbicos, chama startNewCycle
 * e mostra toast de sucesso. Ordem idêntica ao legado (o snapshot do ciclo é
 * gravado JÁ com as fichas do template — paridade com o legado).
 */
export async function applyTemplate(
  data: LocalData,
  templateKey: string
): Promise<boolean> {
  const tpl = TEMPLATES_PRONTOS[templateKey];
  if (!tpl) {
    showToast('Template não encontrado: ' + templateKey, 'error');
    return false;
  }

  const sheetA = await getSheet('A');
  const sheetB = await getSheet('B');
  await upsertSheet({
    ...sheetA,
    exerciseIds: [...tpl.A],
    aerobic: tpl.ae ? { ...tpl.ae } : null,
    updatedAt: new Date().toISOString(),
  });
  await upsertSheet({
    ...sheetB,
    exerciseIds: [...tpl.B],
    aerobic: tpl.ae ? { ...tpl.ae } : null,
    updatedAt: new Date().toISOString(),
  });

  // Recarrega para que o snapshot do ciclo veja as fichas já atualizadas
  const fresh: LocalData = {
    ...data,
    sheets: await getUserSheets(LOCAL_USER_ID),
  };
  await startNewCycle(fresh, 'Template Aplicado');
  emitDbReady();
  showToast('Template aplicado com sucesso!', 'success');
  return true;
}

/** updateDeckStats (L665–691): volume médio + cardio do letter atual. */
export function computeDeckStats(
  ids: string[],
  exercises: Exercise[],
  aerobic: AerobicConfig | null | undefined
): { avg: string; cardioMain: string; cardioSub: string } {
  const map = new Map(exercises.map((e) => [e.id, e]));
  const list = ids.map((id) => map.get(id)).filter((e): e is Exercise => Boolean(e));

  /* v4.32.0 — carga EFETIVA: a salva (`load`) ou, se ainda não definida, a
     SUGERIDA pelo nome/grupo (v4.31.0). Antes o legado/React lia só o campo
     salvo, que o seed nunca preenche, e o rodapé ficava em 0.0. */
  let totalCarga = 0;
  list.forEach((ex) => {
    totalCarga += effectiveLoadKg(ex);
  });
  const avg = list.length ? (totalCarga / list.length).toFixed(1) : '0.0';

  /* v4.31.0 — ficha com exercícios usa o cardio padrão (10 min/esteira/3 km/h)
     quando não há aeróbico configurado; deck vazio segue "Configurar Cardio". */
  const ae = list.length > 0 ? effectiveAerobic(aerobic) : aerobic;
  let cardioMain = '--';
  let cardioSub = 'Configurar Cardio';
  if (ae && ae.tipo) {
    cardioMain = ae.tempo ? `${ae.tempo}min` : '--';
    cardioSub = `${ae.tipo}${ae.vel ? ' • ' + formatSpeed(ae.vel) : ''}`;
  }

  return { avg, cardioMain, cardioSub };
}
