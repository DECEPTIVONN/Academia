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
import type { Exercise, SheetKey } from '@/core/db/schema';
import { useLocalData } from '@/hooks/useLocalData';
import { getMaestriaState } from '@/features/gamification/maestria';
import { useMaestriaUi } from '@/features/gamification/maestria-ui';
import { fadeIn } from '@/lib/animations';
import { showToast } from '@/lib/toast';
import { useTreinosStore, type DeckView } from './treinos-store';
import {
  addFromCollection,
  applyTemplate,
  computeDeckStats,
  DECK_MAX,
  dropCollectionAt,
  mutateSheetIds,
  removeFromDeck,
  swapSlots,
} from './treinos-helpers';
import { DeckActiveSlot, DeckEmptySlot, TreinosCollectionCard } from './cards';

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
  /* Menu ativo do card: estado derivado (letra/vista válidas) — substitui o
     effect de reset do legado sem set-state-in-effect */
  const [menu, setMenu] = useState<{ letter: SheetKey; view: DeckView; idx: number } | null>(null);
  const menuIdx = menu && menu.letter === deckLetter && menu.view === deckView ? menu.idx : null;
  const tplLock = useRef(false);
  const activeGridRef = useRef<HTMLDivElement>(null);
  const collectionGridRef = useRef<HTMLDivElement>(null);

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
      if (!next) return;
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

  /* ── Coleção: clique adicionar (L479–504) ── */
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

  /* ── Templates com lock 500ms (app.js L395–405) ── */
  const onTemplate = async (key: string) => {
    if (tplLock.current) return;
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
      if (ids.length >= DECK_MAX) return;
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
          const exId = card.dataset.id;
          if (targetIndex >= 0 && exId) {
            const next = dropCollectionAt(ids, exId, targetIndex);
            if (next) {
              void mutateSheetIds(deckLetter, () => next).then(() => {
                showToast('Adicionado ao treino!', 'success');
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

    activeGridRef.current
      ?.querySelectorAll<HTMLElement>('#deckActiveGrid .deck-card, #deckActiveGrid .deck-list-item')
      .forEach(bindReorder);
    collectionGridRef.current
      ?.querySelectorAll<HTMLElement>('.collection-card:not(.in-deck)')
      .forEach(bindAdd);

    return () => cleanups.forEach((fn) => fn());
  }, [ids, deckLetter, deckView, collection]);

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
          onCardClick={deckView === 'list' ? undefined : () => toggleMenu(i)}
          onDetails={onOpenCR}
          onEdit={onEdit}
          onMaestria={(e) => useMaestriaUi.getState().openMaestriaEx(e.id)}
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
              <button type="button" className="sel-btn" id="btnDeckMenu" title="Menu">
                {MENU_ICON}
              </button>
            </div>

            <div className="header-center">
              <div className="treino-selector" id="deckLetterTabs">
                {LETTERS.map((letra) => {
                  const isPage1 = PAGE_1.includes(letra);
                  const visible = deckPage === 1 ? isPage1 : !isPage1;
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
              <div className="treino-selector-actions">
                <button type="button" className="sel-btn-switch" id="btnSwitchDeckPage" title="Alternar Páginas" onClick={onSwitchPage}>
                  {SWITCH_PAGE_ICON}
                </button>
              </div>
            </div>

            <div className="header-right">
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
        <div className="deck-active-area" id="deckActiveArea">
          <div
            ref={activeGridRef}
            className={`deck-active-grid${deckView === 'list' ? ' list-view' : ''}${deckView === 'royale' ? ' royale-view' : ''}`}
            id="deckActiveGrid"
            onDragOver={onContainerDragOver}
            onDragLeave={onContainerDragLeave}
            onDrop={onContainerDrop}
          >
            {slots}
          </div>
        </div>

        {/* Footer da área ativa */}
        <div className="deck-footer">
          <div className="footer-stat">
            <div className="deck-volume">
              <div className="volume-drop" />
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
            <div className="footer-stat-label">CARDIO CONFIGURADO</div>
          </div>
        </div>

        {/* Coleção (sempre abaixo) */}
        <div className="collection-area" id="deckCollectionArea">
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
          <div className="collection-grid" id="deckCollectionGrid" ref={collectionGridRef}>
            {collection.map((ex) => (
              <TreinosCollectionCard
                key={ex.id}
                ex={ex}
                already={ids.includes(ex.id)}
                onEdit={onEdit}
                onDel={onDelete}
                onCardClick={onCollectionClick}
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
          SELECIONE SUA CLASSE
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
    </>
  );
};

export default MontarTab;
