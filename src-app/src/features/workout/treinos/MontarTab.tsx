/**
 * MontarTab.tsx — Sub-aba MONTAR TREINO (deck builder) (Fase 4)
 * Port 1:1 de secao-treinos.js: `renderMontar` (L266–317), `renderDeckGrid`
 * (L319–450), `renderDeckCollection` (L452–663 incl. touch ghost), `updateDeckStats`
 * (L665–691), `updateDeckMaestriaWidget` (L823–832) + DOM de treinos.html L187–381
 * + handlers de app.js (btnEditAerobico L155, btnMaestriaGeral L451,
 * templatesGrid com lock 500ms L395–405).
 *
 * Divergência aceita (CHANGELOG v4.0.6-phase4): ficha compacta sem nulls
 * (remoção perde a posição do slot) — ver treinos-helpers.ts.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Exercise, SheetKey } from '@/core/db/schema';
import { useLocalData } from '@/hooks/useLocalData';
import { getCollectionCardsMode, type CollectionCardsMode } from '@/lib/app-prefs';
import { getMaestriaState } from '@/features/gamification/maestria';
import { fadeIn } from '@/lib/animations';
import { showToast } from '@/lib/toast';
import { VolumeKgIcon } from '@/components/VolumeKgIcon';
import { useTreinosStore, type DeckView } from './treinos-store';
import { SHEET_ORDER } from '@/core/db/queries';
import {
  addFromCollection,
  applyTemplate,
  computeDeckStats,
  DECK_MAX,
  deckCount,
  dropCollectionAt,
  mutateSheetIds,
  removeFromDeck,
  replaceAtSlot,
  swapSlots,
} from './treinos-helpers';
import { DeckActiveSlot, DeckEmptySlot, DeckGhostCard, TreinosCollectionCard } from './cards';
import { MontarMenuModal } from './MontarMenuModal';
import { ConfirmModal } from './TreinosModals';

const LETTERS: SheetKey[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const PAGE_1 = ['A', 'B', 'C', 'D', 'E'];

/* ── Ícones do header (treinos.html L193–233) ── */

const MENU_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const SWITCH_PAGE_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 17h16M20 17l-4-4M20 17l-4 4M20 7H4M4 7l4-4M4 7l4 4" />
  </svg>
);

const GRID_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const LIST_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const STAR_ICON_22 = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const CARDIO_ICON_22 = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

/* ── Templates (treinos.html L341–379) ── */

interface TemplateBtn {
  key: string;
  name: string;
  desc: string;
  tonificar?: boolean;
  icon: React.ReactNode;
}

const TPL_ICONS = {
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
      <path d="M12 2a9 9 0 0 0-9 9c0 4.17 2.84 7.67 6.69 8.69L12 22l2.31-2.31C18.16 18.67 21 15.17 21 11a9 9 0 0 0-9-9z" />
      <path d="M12 6v6l3 3" />
    </svg>
  ),
  split: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M2 12h20M4 6l4 6-4 6M20 6l-4 6 4 6" />
    </svg>
  ),
  pushpull: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
      <path d="M5 12h14M12 5l7 7-7 7" />
      <path d="M19 12H5M12 19l-7-7 7-7" opacity=".4" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  bars: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  ),
  boltCircle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  dumbbell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
      <path d="M6.5 6.5h11" />
      <path d="M6.5 17.5h11" />
      <path d="M12 6.5v11" />
      <circle cx="4" cy="12" r="1.5" />
      <circle cx="20" cy="12" r="1.5" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
};

const TEMPLATE_BTNS: TemplateBtn[] = [
  { key: 'hipertrofia_iniciante', name: 'Hipertrofia (Iniciante)', desc: 'Foco em adaptação e técnica básica', icon: TPL_ICONS.bolt },
  { key: 'perda_ponderal', name: 'Perda de Peso (Iniciante)', desc: 'Intensidade para máxima queima calórica', icon: TPL_ICONS.clock },
  { key: 'sup_inf', name: 'Sup/Inf (Iniciante)', desc: 'Divisão equilibrada de membros superiores e inferiores', icon: TPL_ICONS.split },
  { key: 'push_pull', name: 'Push/Pull (Iniciante)', desc: 'Foco em movimentos de empurrar e puxar', icon: TPL_ICONS.pushpull },
  { key: 'tonificar', name: 'Tonificar (Iniciante)', desc: 'Protocolo avançado para definição (3x15)', tonificar: true, icon: TPL_ICONS.star },
  { key: 'hipertrofia_medio', name: 'Hipertrofia (Médio)', desc: '8 exercícios por treino para progressão', icon: TPL_ICONS.bars },
  { key: 'perda_ponderal_media', name: 'Perda Ponderal (Médio)', desc: '8 exercícios + aeróbico para queima calórica', icon: TPL_ICONS.boltCircle },
  { key: 'hipertrofia_medio_ii', name: 'Hipertrofia (Médio) II', desc: '8 exercícios por treino — 6x/semana', icon: TPL_ICONS.dumbbell },
  { key: 'perda_ponderal_media_ii', name: 'Perda Ponderal (Médio) II', desc: "8 exercícios + aeróbico 20' — 6x/semana", icon: TPL_ICONS.heart },
];

/* ══════════ Ghost / imagem de arraste (v4.58.0) ══════════ */

/**
 * Largura do card do deck no modo GRID — base do ghost do arraste.
 * Na visão em lista os slots ocupam a linha inteira, então a largura vem da
 * coluna do grid do deck (4 colunas, 2 no mobile).
 */
function deckGridCardWidth(grid: HTMLElement | null, view: DeckView): number {
  if (view !== 'list') {
    const slot = grid?.querySelector<HTMLElement>('.deck-slot');
    if (slot?.offsetWidth) return slot.offsetWidth;
  }
  const columns = window.innerWidth <= 850 ? 2 : 4;
  const available = (grid?.clientWidth ?? 0) - 16 * (columns - 1);
  if (available > 0) return Math.max(84, Math.round(available / columns));
  return Math.min(220, Math.round(window.innerWidth * 0.44));
}

/**
 * Imagem do arraste no DESKTOP: monta o MESMO card do deck no modo grid
 * (grupo muscular + imagem + nome + "Séries: s × r"), independente do modo de
 * exibição escolhido em Minha coleção. O nó fica fora da tela e é removido no
 * tick seguinte (o navegador já tirou o snapshot).
 */
function buildDeckDragImage(ex: Exercise, width: number): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'deck-drag-ghost';
  wrap.style.left = '-1000px';
  wrap.style.top = '-1000px';
  wrap.style.width = `${width}px`;
  wrap.style.height = `${Math.round(width * 1.35)}px`;

  const card = document.createElement('div');
  card.className = `deck-card card-${ex.muscleGroup}`;

  const header = document.createElement('div');
  header.className = 'deck-card-header';
  header.textContent = ex.muscleGroup;

  const imgWrap = document.createElement('div');
  imgWrap.className = 'deck-card-img';
  if (ex.imageUrl) {
    const img = document.createElement('img');
    img.src = ex.imageUrl;
    img.alt = ex.name;
    imgWrap.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'premium-placeholder';
    ph.textContent = 'EXERCÍCIO';
    imgWrap.appendChild(ph);
  }

  const info = document.createElement('div');
  info.className = 'deck-card-info';
  const name = document.createElement('div');
  name.className = 'deck-card-name';
  name.textContent = ex.name;
  const level = document.createElement('div');
  level.className = 'deck-card-level';
  level.textContent = `Séries: ${ex.sets} × ${ex.reps}`;
  info.append(name, level);

  card.append(header, imgWrap, info);
  wrap.appendChild(card);
  document.body.appendChild(wrap);
  return wrap;
}

/* ══════════ Componente ══════════ */

interface MontarTabProps {
  onEdit: (ex: Exercise) => void;
  onDelete: (ex: Exercise) => void;
  onOpenCR: (ex: Exercise) => void;
  onOpenMaestriaGeral: () => void;
  onOpenAerobico: () => void;
}

export const MontarTab: React.FC<MontarTabProps> = ({
  onEdit,
  onDelete,
  onOpenCR,
  onOpenMaestriaGeral,
  onOpenAerobico,
}) => {
  const data = useLocalData();
  const {
    deckLetter,
    deckPage,
    deckView,
    deckSearch,
    setDeckLetter,
    setDeckPage,
    setDeckView,
    setDeckSearch,
  } = useTreinosStore();

  const sheet = data.sheets.find((s) => s.sheetKey === deckLetter);
  const ids = useMemo(() => sheet?.exerciseIds ?? [], [sheet]);
  const aerobic = sheet?.aerobic ?? null;

  const exMap = useMemo(() => new Map(data.exercises.map((e) => [e.id, e])), [data.exercises]);
  const stats = useMemo(() => computeDeckStats(ids, data.exercises, aerobic), [ids, data.exercises, aerobic]);

  const maestriaFull = useMemo(
    () => data.exercises.filter((ex) => getMaestriaState(data.legacy, ex.id).badgeLevel > 0).length,
    [data.exercises, data.legacy]
  );

  const collection = useMemo(() => {
    const q = deckSearch.trim().toLowerCase();
    if (!q) return data.exercises;
    return data.exercises.filter(
      (e) => e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q)
    );
  }, [data.exercises, deckSearch]);

  /* Estado visual */
  const [dragOver, setDragOver] = useState<number | null>(null);

  /* v4.58.0 — modo de exibição da MINHA COLEÇÃO (Configurações → Preferências
     do App): 'padrao' = grade compacta; 'deck' = cards do grid do deck. */
  const [collectionCards, setCollectionCardsState] = useState<CollectionCardsMode>(
    () => getCollectionCardsMode()
  );
  useEffect(() => {
    const sync = () => setCollectionCardsState(getCollectionCardsMode());
    window.addEventListener('academia:prefs-changed', sync);
    return () => window.removeEventListener('academia:prefs-changed', sync);
  }, []);
  const deckCards = collectionCards === 'deck';

  /* v4.58.0 — ghost do arraste: card do DECK (modo grid) seguindo o dedo, em
     vez de um clone do card da coleção. */
  const [dragGhost, setDragGhost] = useState<{ ex: Exercise; x: number; y: number; w: number } | null>(
    null
  );
  const ghostPos = useRef({ x: 0, y: 0 });
  const ghostRaf = useRef<number | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);

  /* Fichas desbloqueadas (A/B inicialmente; até J) */
  const [unlockedSheets, setUnlockedSheets] = useState<SheetKey[]>(() => {
    try {
      const raw = localStorage.getItem('academia_unlocked_sheets');
      return raw ? (JSON.parse(raw) as SheetKey[]) : (['A', 'B'] as SheetKey[]);
    } catch {
      return ['A', 'B'] as SheetKey[];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('academia_unlocked_sheets', JSON.stringify(unlockedSheets));
    } catch {
      /* ignore */
    }
  }, [unlockedSheets]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDeleteSheet, setConfirmDeleteSheet] = useState(false);
  const [clipboardSheet, setClipboardSheet] = useState<string[] | null>(null);
  /* Menu ativo do card: estado derivado (letra/vista válidas) — substitui o
     effect de reset do legado sem set-state-in-effect */
  const [menu, setMenu] = useState<{ letter: SheetKey; view: DeckView; idx: number } | null>(null);
  const menuIdx = menu && menu.letter === deckLetter && menu.view === deckView ? menu.idx : null;
  /* v4.72.3 — Coleção no modo deck: o TOQUE abre o menu do card (Detalhes /
     Adicionar ao deck), então tocar num exercício não o adiciona mais ao
     treino sem intenção. */
  const [collectionMenuId, setCollectionMenuId] = useState<string | null>(null);
  /* v4.72.3 — deck cheio + "Adicionar ao deck": guarda o exercício que vai
     tomar o lugar de um dos 8 (o usuário escolhe qual). A letra vai junto para
     trocar de ficha invalidar a pendência sem set-state dentro de effect. */
  const [replace, setReplace] = useState<{ letter: SheetKey; id: string } | null>(null);
  const replaceTarget = replace && replace.letter === deckLetter ? replace.id : null;
  const replaceEx = replaceTarget ? exMap.get(replaceTarget) : undefined;
  const tplLock = useRef(false);
  const [confirmTemplateKey, setConfirmTemplateKey] = useState<string | null>(null);
  const activeGridRef = useRef<HTMLDivElement>(null);
  const collectionGridRef = useRef<HTMLDivElement>(null);
  const deckAreaRef = useRef<HTMLDivElement>(null);
  const collectionAreaRef = useRef<HTMLDivElement>(null);

  /* fadeIn no grid ativo (renderDeckGrid L449) */
  useEffect(() => {
    fadeIn(activeGridRef.current);
  }, [ids, deckView]);

  /* Classe .drag-over imperativa nos slots (paridade com Ondragover legado) */
  useEffect(() => {
    const slots = activeGridRef.current?.querySelectorAll<HTMLElement>('.deck-slot');
    slots?.forEach((s, i) => s.classList.toggle('drag-over', i === dragOver));
  }, [dragOver, ids, deckView]);

  /* ── Header: paginação + letras (renderMontar L278–301) ── */
  const onSwitchPage = () => setDeckPage(deckPage === 1 ? 2 : 1);
  /* v4.56.17 — o botão de páginas só aparece com 5+ fichas e quando existe
     pelo menos uma ficha na página 2 (senão a troca abriria uma página vazia). */
  const page2Sheets = unlockedSheets.filter((letra) => !PAGE_1.includes(letra));
  const canSwitchPage = unlockedSheets.length >= 5 && page2Sheets.length > 0;
  const activeDeckPage = canSwitchPage ? deckPage : 1;

  const onClickGridView = () => {
    if (deckView === 'grid') setDeckView('royale');
    else if (deckView === 'royale') setDeckView('grid');
    else setDeckView('grid');
  };

  /* ── Slots: DnD desktop (renderDeckGrid L357–397) ── */
  const onSlotDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('sourceIndex', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onSlotDrop = async (e: React.DragEvent, target: number) => {
    e.preventDefault();
    setDragOver(null);
    const sourceIndex = e.dataTransfer.getData('sourceIndex');
    const exId = e.dataTransfer.getData('text/plain');

    if (sourceIndex !== '') {
      const next = swapSlots(ids, parseInt(sourceIndex, 10), target);
      if (!next) return;
      await mutateSheetIds(deckLetter, () => next);
      showToast('Treino atualizado!', 'success');
    } else if (exId) {
      const next = dropCollectionAt(ids, exId, target);
      if (!next) {
        showToast(`Máximo de ${DECK_MAX} exercícios atingido!`, 'error');
        return;
      }
      await mutateSheetIds(deckLetter, () => next);
      showToast('Treino atualizado!', 'success');
    }
  };

  /* ── Menu do card (grid/royale) (L401–410) ── */
  const toggleMenu = (index: number) => {
    setMenu((cur) =>
      cur && cur.letter === deckLetter && cur.view === deckView && cur.idx === index
        ? null
        : { letter: deckLetter, view: deckView, idx: index }
    );
  };

  const onRemoveSlot = async (ex: Exercise) => {
    await mutateSheetIds(deckLetter, (cur) => removeFromDeck(cur, ex.id));
    showToast('Removido do treino!', 'info');
  };

  /* ── Menu da ficha ── */
  const canAddSheet = unlockedSheets.length < SHEET_ORDER.length;
  const canDeleteSheet = unlockedSheets.length > 2 && unlockedSheets.includes(deckLetter);
  const hasClipboard =
    clipboardSheet !== null ||
    (() => {
      try {
        const raw = localStorage.getItem('academia_clipboard_sheet');
        return !!raw && JSON.parse(raw).length > 0;
      } catch {
        return false;
      }
    })();

  const onAddSheet = () => {
    const next = SHEET_ORDER.find((k) => !unlockedSheets.includes(k));
    if (!next) {
      showToast('Limite de fichas (J) atingido.', 'info');
      return;
    }
    setUnlockedSheets((prev) => [...prev, next]);
    setDeckLetter(next);
    showToast(`Ficha ${next} adicionada!`, 'success');
  };
  const onDeleteSheet = () => {
    if (!canDeleteSheet) {
      showToast('Não é possível excluir esta ficha.', 'info');
      return;
    }
    setConfirmDeleteSheet(true);
  };
  const confirmDeleteSheetNow = async () => {
    setConfirmDeleteSheet(false);
    await mutateSheetIds(deckLetter, () => []);
    setUnlockedSheets((prev) => prev.filter((k) => k !== deckLetter));
    const remaining = unlockedSheets.filter((k) => k !== deckLetter);
    setDeckLetter(remaining[0] ?? 'A');
    showToast('Ficha excluída.', 'info');
  };
  const onCopySheet = async () => {
    setClipboardSheet([...ids]);
    showToast('Ficha copiada!', 'success');
  };
  const onPasteSheet = async () => {
    let data = clipboardSheet;
    if (!data) {
      try {
        const raw = localStorage.getItem('academia_clipboard_sheet');
        if (raw) data = JSON.parse(raw) as string[];
      } catch {
        data = null;
      }
    }
    if (!data || data.length === 0) {
      showToast('Nenhuma ficha copiada.', 'info');
      return;
    }
    await mutateSheetIds(deckLetter, () => [...data!]);
    showToast('Ficha colada!', 'success');
  };
  const onShowInGuild = () => {
    try {
      const shared = {
        id: `shared-${Date.now()}`,
        sheetKey: deckLetter,
        exerciseIds: [...ids],
        author: 'Você',
        timestamp: Date.now(),
      };
      const raw = localStorage.getItem('academia_guild_shared');
      const list = raw ? (JSON.parse(raw) as unknown[]) : [];
      list.unshift(shared);
      localStorage.setItem('academia_guild_shared', JSON.stringify(list.slice(0, 20)));
      window.dispatchEvent(new CustomEvent('academia:guild-shared-updated'));
      showToast('Ficha enviada para a guilda!', 'success');
    } catch {
      showToast('Não foi possível enviar para a guilda.', 'error');
    }
  };
  const onLink = () => {
    try {
      const payload = btoa(JSON.stringify({ k: deckLetter, ids: [...ids] }));
      const url = `${window.location.origin}/?share=${payload}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
      }
      showToast('Link copiado!', 'success');
    } catch {
      showToast('Não foi possível copiar o link.', 'error');
    }
  };

  /* ── Coleção: arraste no desktop com a imagem do card do deck ── */
  const onCollectionDragStart = (e: React.DragEvent, ex: Exercise) => {
    e.dataTransfer.setData('text/plain', ex.id);
    e.dataTransfer.effectAllowed = 'copyMove';
    try {
      const image = buildDeckDragImage(ex, deckGridCardWidth(activeGridRef.current, deckView));
      e.dataTransfer.setDragImage(image, image.offsetWidth / 2, image.offsetHeight / 2);
      window.setTimeout(() => image.remove(), 0);
    } catch {
      /* navegador sem setDragImage */
    }
  };

  /* ── Coleção: clique adicionar (L479–504) — modo compacto ── */
  const onCollectionClick = async (ex: Exercise) => {
    if (ids.includes(ex.id)) return;
    const next = addFromCollection(ids, ex.id);
    if (!next) {
      showToast(`Máximo de ${DECK_MAX} exercícios atingido!`, 'error');
      return;
    }
    await mutateSheetIds(deckLetter, () => next);
    showToast('Adicionado ao treino!', 'success');
  };

  /* v4.72.3 — modo deck da coleção: o toque abre/fecha o menu do card. */
  const toggleCollectionMenu = (ex: Exercise) => {
    setCollectionMenuId((cur) => (cur === ex.id ? null : ex.id));
  };

  /* v4.72.3 — botão "Adicionar ao deck": com o deck cheio o exercício fica
     pendente e o próximo toque num exercício do deck define quem sai. */
  const onCollectionAdd = async (ex: Exercise) => {
    setCollectionMenuId(null);
    if (ids.includes(ex.id)) {
      showToast('Este exercício já está no treino.', 'info');
      return;
    }
    if (deckCount(ids) >= DECK_MAX) {
      setReplace({ letter: deckLetter, id: ex.id });
      showToast('Deck cheio: toque no exercício que será substituído.', 'info');
      return;
    }
    const next = addFromCollection(ids, ex.id);
    if (!next) {
      showToast(`Máximo de ${DECK_MAX} exercícios atingido!`, 'error');
      return;
    }
    await mutateSheetIds(deckLetter, () => next);
    showToast('Adicionado ao treino!', 'success');
  };

  /* v4.72.3 — conclui a troca no slot tocado. */
  const onReplaceSlot = async (index: number) => {
    if (!replaceTarget) return;
    const incoming = replaceEx?.name ?? 'Novo exercício';
    const outgoing = ids[index] ? exMap.get(ids[index])?.name ?? 'exercício' : null;
    const next = replaceAtSlot(ids, replaceTarget, index);
    if (!next) return;
    setReplace(null);
    await mutateSheetIds(deckLetter, () => next);
    showToast(outgoing ? `${outgoing} saiu: entrou ${incoming}.` : 'Exercício adicionado!', 'success');
    /* Escolhido quem sai, a pendência acaba: volta para a coleção normal. */
    window.requestAnimationFrame(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      collectionAreaRef.current?.scrollIntoView({
        behavior: reduce ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  };

  /* v4.72.4 — deck cheio: rola até o deck para escolher quem é substituído. */
  useEffect(() => {
    if (!replaceTarget) return;
    const raf = window.requestAnimationFrame(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      deckAreaRef.current?.scrollIntoView({
        behavior: reduce ? 'auto' : 'smooth',
        block: 'start',
      });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [replaceTarget]);

  /* ESC cancela a troca; trocar de ficha também. */
  useEffect(() => {
    if (!replaceTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setReplace(null);
      showToast('Troca cancelada.', 'info');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [replaceTarget]);

  /* O menu da coleção fecha ao tocar fora do card. */
  useEffect(() => {
    if (!collectionMenuId) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.collection-deck--deck')) return;
      setCollectionMenuId(null);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [collectionMenuId]);

  /* ── Templates com lock 500ms (app.js L395–405) ── */
  const onTemplate = (key: string) => {
    if (tplLock.current) return;
    setConfirmTemplateKey(key);
  };

  const applyConfirmedTemplate = async () => {
    if (!confirmTemplateKey) return;
    const key = confirmTemplateKey;
    setConfirmTemplateKey(null);
    tplLock.current = true;
    window.setTimeout(() => {
      tplLock.current = false;
    }, 500);
    await applyTemplate(data, key);
  };

  /* ── Touch ghost drag (renderDeckCollection L507–660) ── */
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const bindReorder = (card: HTMLElement) => {
      let ghost: HTMLElement | null = null;
      let pressTimer: number | null = null;
      let isDragging = false;

      const onTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        pressTimer = window.setTimeout(() => {
          isDragging = true;
          ghost = card.cloneNode(true) as HTMLElement;
          ghost.style.position = 'fixed';
          ghost.style.width = card.offsetWidth + 'px';
          ghost.style.height = card.offsetHeight + 'px';
          ghost.style.opacity = '0.8';
          ghost.style.pointerEvents = 'none';
          ghost.style.zIndex = '9999';
          ghost.style.left = touch.clientX - card.offsetWidth / 2 + 'px';
          ghost.style.top = touch.clientY - card.offsetHeight / 2 + 'px';
          document.body.appendChild(ghost);
          card.classList.add('dragging');
          if (navigator.vibrate) navigator.vibrate(50);
        }, 250);
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!isDragging) {
          if (pressTimer !== null) window.clearTimeout(pressTimer);
          return;
        }
        e.preventDefault();
        const touch = e.touches[0];
        if (ghost) {
          ghost.style.left = touch.clientX - ghost.offsetWidth / 2 + 'px';
          ghost.style.top = touch.clientY - ghost.offsetHeight / 2 + 'px';
        }
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const slot = target ? target.closest<HTMLElement>('.deck-slot') : null;
        document
          .querySelectorAll('#deckActiveGrid .deck-slot')
          .forEach((s) => s.classList.toggle('drag-over', s === slot));
      };

      const onTouchEnd = (e: TouchEvent) => {
        if (pressTimer !== null) window.clearTimeout(pressTimer);
        if (!isDragging) return;
        isDragging = false;
        card.classList.remove('dragging');
        const touch = e.changedTouches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const slot = target ? target.closest<HTMLElement>('.deck-slot') : null;

        if (slot) {
          const targetIndex = parseInt(slot.dataset.index || '-1', 10);
          const sourceSlot = card.closest<HTMLElement>('.deck-slot');
          const sourceIndex = parseInt(sourceSlot?.dataset.index || '-1', 10);
          if (targetIndex >= 0 && sourceIndex >= 0) {
            const next = swapSlots(ids, sourceIndex, targetIndex);
            if (next) {
              void mutateSheetIds(deckLetter, () => next).then(() => {
                showToast('Ordem alterada!', 'success');
              });
            }
          }
        }

        ghost?.remove();
        ghost = null;
        document
          .querySelectorAll('#deckActiveGrid .deck-slot')
          .forEach((s) => s.classList.remove('drag-over'));
      };

      card.addEventListener('touchstart', onTouchStart, { passive: true });
      card.addEventListener('touchmove', onTouchMove, { passive: false });
      card.addEventListener('touchend', onTouchEnd);
      cleanups.push(() => {
        if (pressTimer !== null) window.clearTimeout(pressTimer);
        card.removeEventListener('touchstart', onTouchStart);
        card.removeEventListener('touchmove', onTouchMove);
        card.removeEventListener('touchend', onTouchEnd);
        ghost?.remove();
      });
    };

    const bindAdd = (card: HTMLElement) => {
      if (deckCount(ids) >= DECK_MAX) return;
      let pressTimer: number | null = null;
      let isDragging = false;
      let ghostW = 0;

      /* Largura de referência = card do deck no modo grid (o ghost é o MESMO
         card do deck, independente do modo da Minha coleção). */
      const measureGhost = () => deckGridCardWidth(activeGridRef.current, deckView);

      /* Posição atualizada direto no DOM (sem re-render por frame). */
      const moveGhost = (clientX: number, clientY: number) => {
        ghostPos.current = { x: clientX - ghostW / 2, y: clientY - (ghostW * 1.35) / 2 };
        if (ghostRaf.current !== null) return;
        ghostRaf.current = window.requestAnimationFrame(() => {
          ghostRaf.current = null;
          const el = ghostRef.current;
          if (!el) return;
          el.style.left = `${ghostPos.current.x}px`;
          el.style.top = `${ghostPos.current.y}px`;
        });
      };

      const onTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        pressTimer = window.setTimeout(() => {
          const exId = card.dataset.id;
          const ex = exId ? exMap.get(exId) : undefined;
          if (!ex) return;
          isDragging = true;
          ghostW = measureGhost();
          ghostPos.current = {
            x: touch.clientX - ghostW / 2,
            y: touch.clientY - (ghostW * 1.35) / 2,
          };
          setDragGhost({ ex, x: ghostPos.current.x, y: ghostPos.current.y, w: ghostW });
          card.classList.add('dragging');
          if (navigator.vibrate) navigator.vibrate(50);
        }, 250);
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!isDragging) {
          if (pressTimer !== null) window.clearTimeout(pressTimer);
          return;
        }
        e.preventDefault();
        const touch = e.touches[0];
        moveGhost(touch.clientX, touch.clientY);
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const slot = target ? target.closest<HTMLElement>('.deck-slot') : null;
        document
          .querySelectorAll('#deckActiveGrid .deck-slot')
          .forEach((s) => s.classList.toggle('drag-over', s === slot));
      };

      const onTouchEnd = (e: TouchEvent) => {
        if (pressTimer !== null) window.clearTimeout(pressTimer);
        if (!isDragging) return;
        isDragging = false;
        card.classList.remove('dragging');
        setDragGhost(null);
        const touch = e.changedTouches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const slot = target ? target.closest<HTMLElement>('.deck-slot') : null;

        if (slot) {
          const targetIndex = parseInt(slot.dataset.index || '-1', 10);
          const exId = card.dataset.id;
          if (targetIndex >= 0 && exId) {
            const next = dropCollectionAt(ids, exId, targetIndex);
            if (next) {
              void mutateSheetIds(deckLetter, () => next).then(() => {
                showToast('Adicionado ao treino!', 'success');
              });
            } else {
              showToast(`Máximo de ${DECK_MAX} exercícios atingido!`, 'error');
            }
          }
        }

        document
          .querySelectorAll('#deckActiveGrid .deck-slot')
          .forEach((s) => s.classList.remove('drag-over'));
      };

      card.addEventListener('touchstart', onTouchStart, { passive: true });
      card.addEventListener('touchmove', onTouchMove, { passive: false });
      card.addEventListener('touchend', onTouchEnd);
      cleanups.push(() => {
        if (pressTimer !== null) window.clearTimeout(pressTimer);
        card.removeEventListener('touchstart', onTouchStart);
        card.removeEventListener('touchmove', onTouchMove);
        card.removeEventListener('touchend', onTouchEnd);
      });
    };

    activeGridRef.current
      ?.querySelectorAll<HTMLElement>('#deckActiveGrid .deck-card, #deckActiveGrid .deck-list-item')
      .forEach(bindReorder);
    collectionGridRef.current
      ?.querySelectorAll<HTMLElement>('.collection-card:not(.in-deck)')
      .forEach(bindAdd);

    return () => {
      cleanups.forEach((fn) => fn());
      if (ghostRaf.current !== null) {
        window.cancelAnimationFrame(ghostRaf.current);
        ghostRaf.current = null;
      }
    };
  }, [ids, deckLetter, deckView, collection, exMap]);

  /* ── Slots do grid ativo (8 fixos) ── */
  const slots: React.ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const ex = ids[i] ? exMap.get(ids[i]) : undefined;
    slots.push(
      ex ? (
        <DeckActiveSlot
          key={`slot-${i}`}
          ex={ex}
          index={i}
          view={deckView}
          menuActive={menuIdx === i}
          onCardClick={
            deckView === 'list'
              ? undefined
              : replaceTarget
                ? () => void onReplaceSlot(i)
                : () => toggleMenu(i)
          }
          onDetails={onOpenCR}
          onRemove={onRemoveSlot}
          onDragStartSource={onSlotDragStart}
        />
      ) : (
        <DeckEmptySlot key={`slot-${i}`} index={i} view={deckView} />
      )
    );
  }

  /* Slots precisam receber drop: envolvemos cada slot via handler no container */
  const onContainerDragOver = (e: React.DragEvent) => {
    const slot = (e.target as HTMLElement).closest<HTMLElement>('.deck-slot');
    if (!slot) return;
    e.preventDefault();
    const idx = parseInt(slot.dataset.index || '-1', 10);
    if (idx >= 0) setDragOver(idx);
  };

  const onContainerDrop = (e: React.DragEvent) => {
    const slot = (e.target as HTMLElement).closest<HTMLElement>('.deck-slot');
    if (!slot) return;
    const idx = parseInt(slot.dataset.index || '-1', 10);
    if (idx >= 0) void onSlotDrop(e, idx);
  };

  const onContainerDragLeave = (e: React.DragEvent) => {
    const slot = (e.target as HTMLElement).closest<HTMLElement>('.deck-slot');
    if (slot) setDragOver(null);
  };

  return (
    <>
      <div className="deck-builder-container">
        {/* Header com seletor de letras paginado */}
        <div className="deck-header">
          <div className="deck-header-top">
            <div className="header-left">
              <button type="button" className="sel-btn" id="btnDeckMenu" title="Menu" onClick={() => setMenuOpen(true)}>
                {MENU_ICON}
              </button>
            </div>

            <div className="header-center">
              <div className="treino-selector" id="deckLetterTabs">
                {LETTERS.filter((l) => unlockedSheets.includes(l)).map((letra) => {
                  const isPage1 = PAGE_1.includes(letra);
                  const visible = activeDeckPage === 1 ? isPage1 : !isPage1;
                  return (
                    <button
                      type="button"
                      key={letra}
                      className={`sel-btn${letra === deckLetter ? ' active' : ''}`}
                      data-letra={letra}
                      style={{ display: visible ? 'flex' : 'none' }}
                      onClick={() => setDeckLetter(letra)}
                    >
                      {letra}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="header-right">
              <div className="treino-selector-actions">
                {canSwitchPage && (
                  <button type="button" className="sel-btn-switch" id="btnSwitchDeckPage" title="Alternar Páginas" onClick={onSwitchPage}>
                    {SWITCH_PAGE_ICON}
                  </button>
                )}
              </div>
              <span className="switch-label" />
              <div className="view-selector">
                <button
                  type="button"
                  className={`view-btn${deckView !== 'list' ? ' active' : ''}`}
                  id="btnDeckGridView"
                  title="Grid View"
                  onClick={onClickGridView}
                >
                  {GRID_ICON}
                </button>
                <button
                  type="button"
                  className={`view-btn${deckView === 'list' ? ' active' : ''}`}
                  id="btnDeckListView"
                  title="List View"
                  onClick={() => setDeckView('list')}
                >
                  {LIST_ICON}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Área ativa: 8 slots fixos */}
        <div className="deck-active-area" id="deckActiveArea" ref={deckAreaRef}>
          <div
            ref={activeGridRef}
            className={`deck-active-grid${deckView === 'list' ? ' list-view' : ''}${deckView === 'royale' ? ' royale-view' : ''}${replaceTarget ? ' is-replacing' : ''}`}
            id="deckActiveGrid"
            onDragOver={onContainerDragOver}
            onDragLeave={onContainerDragLeave}
            onDrop={onContainerDrop}
          >
            {slots}
          </div>

          {/* v4.72.4 — deck cheio: o exercício escolhido na coleção fica em
              destaque ABAIXO do deck, e o toque num exercício do deck define
              quem é substituído (como na referência do Clash Royale). */}
          {replaceTarget && replaceEx && (
            <div className="deck-replace-panel" id="deckReplaceBar">
              <div className="deck-replace-preview">
                <DeckGhostCard ex={replaceEx} />
              </div>
              <div className="deck-replace-copy">
                <span className="deck-replace-title">
                  Selecione o exercício a ser substituído
                </span>
                <span className="deck-replace-desc">
                  <b>{replaceEx.name}</b> entra no lugar do exercício que você tocar.
                </span>
              </div>
              <button
                type="button"
                className="deck-replace-cancel"
                onClick={() => setReplace(null)}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Footer da área ativa */}
        <div className="deck-footer">
          <div className="footer-stat">
            <div className="deck-volume">
              {/* v4.32.0 — prato de peso "KG" no lugar do triângulo .volume-drop */}
              <VolumeKgIcon className="volume-kg-icon" size={24} />
              <span className="volume-val" id="deckAvgVolume">
                {stats.avg}
              </span>
            </div>
            <div className="footer-stat-label">VOLUME MÉDIO DE CARGA</div>
          </div>

          <div className="footer-stat clickable" id="btnMaestriaGeral" title="Maestria dos Exercícios" onClick={onOpenMaestriaGeral}>
            <div className="deck-maestria-widget">
              <div className="maestria-widget-icon">{STAR_ICON_22}</div>
              <div className="maestria-widget-info">
                <span className="maestria-widget-count" id="deckMaestriaCount">
                  {maestriaFull}/{data.exercises.length}
                </span>
                <span className="maestria-widget-sub">Emblemas</span>
              </div>
            </div>
            <div className="footer-stat-label">MAESTRIA</div>
          </div>

          <div className="footer-stat clickable" id="btnEditAerobico" onClick={onOpenAerobico}>
            <div className="deck-cardio">
              <div className="cardio-icon">{CARDIO_ICON_22}</div>
              <div className="cardio-info">
                <span className="cardio-val" id="deckCardioMain">
                  {stats.cardioMain}
                </span>
                <span className="cardio-sub" id="deckCardioSub">
                  {stats.cardioSub}
                </span>
              </div>
            </div>
            <div className="footer-stat-label">CARDIO</div>
          </div>
        </div>

        {/* Coleção (sempre abaixo) */}
        <div className="collection-area" id="deckCollectionArea" ref={collectionAreaRef}>
          <div className="collection-header">
            <h3>MINHA COLEÇÃO</h3>
            <div style={{ display: 'flex', gap: 15 }}>
              <input
                type="text"
                id="deckCollectionSearch"
                placeholder="Filtrar exercícios..."
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: '#fff',
                  padding: '8px 15px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: 200,
                }}
                value={deckSearch}
                onChange={(e) => setDeckSearch(e.target.value)}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(0,0,0,0.2)',
                  padding: '5px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span
                  id="deckCollectionCount"
                  style={{ color: 'var(--primary-light)', fontSize: '0.9rem', fontWeight: 800 }}
                >
                  {collection.length}/{data.exercises.length}
                </span>
              </div>
            </div>
          </div>
          <div
            className={`collection-grid${deckCards ? ' collection-grid--deck' : ''}`}
            id="deckCollectionGrid"
            ref={collectionGridRef}
          >
            {collection.map((ex) => (
              <TreinosCollectionCard
                key={ex.id}
                ex={ex}
                already={ids.includes(ex.id)}
                deck={deckCards}
                onDragStart={onCollectionDragStart}
                onEdit={onEdit}
                onDel={onDelete}
                onDetails={onOpenCR}
                menuActive={deckCards && collectionMenuId === ex.id}
                onAdd={onCollectionAdd}
                onCardClick={deckCards ? toggleCollectionMenu : onCollectionClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Templates rápidos */}
      <div
        className="timer-settings"
        style={{ marginTop: 25, background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <h3
          style={{
            fontSize: '0.85rem',
            letterSpacing: '2px',
            color: 'var(--primary-light)',
            marginBottom: 15,
            opacity: 0.8,
          }}
        >
          SELECIONE SUA FICHA
        </h3>
        <div className="templates-grid" id="templatesGrid">
          {TEMPLATE_BTNS.map((t) => (
            <button
              type="button"
              key={t.key}
              className={`btn-template${t.tonificar ? ' tpl-tonificar' : ''}`}
              data-template={t.key}
              onClick={() => void onTemplate(t.key)}
            >
              <span className="tpl-icon">{t.icon}</span>
              <span className="tpl-name">{t.name}</span>
              <span className="tpl-desc">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ghost do arraste (card do deck no modo grid seguindo o dedo) */}
      {dragGhost &&
        createPortal(
          <div
            ref={ghostRef}
            className="deck-drag-ghost"
            style={{ left: dragGhost.x, top: dragGhost.y, width: dragGhost.w }}
          >
            <DeckGhostCard ex={dragGhost.ex} />
          </div>,
          document.body
        )}

      <MontarMenuModal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAddSheet={onAddSheet}
        onDeleteSheet={onDeleteSheet}
        onCopySheet={onCopySheet}
        onPasteSheet={onPasteSheet}
        onShowInGuild={onShowInGuild}
        onLink={onLink}
        canAdd={canAddSheet}
        canDelete={canDeleteSheet}
        hasClipboard={hasClipboard}
      />
      <ConfirmModal
        open={confirmDeleteSheet}
        title="Excluir ficha?"
        msg={`A ficha ${deckLetter} será limpa e removida da lista.`}
        onYes={() => void confirmDeleteSheetNow()}
        onNo={() => setConfirmDeleteSheet(false)}
      />
      <ConfirmModal
        open={confirmTemplateKey !== null}
        title="Alterar ficha?"
        msg="Deseja realmente alterar a ficha com o modelo selecionado? As alterações atuais serão substituídas."
        onYes={() => void applyConfirmedTemplate()}
        onNo={() => setConfirmTemplateKey(null)}
      />
    </>
  );
};

export default MontarTab;
