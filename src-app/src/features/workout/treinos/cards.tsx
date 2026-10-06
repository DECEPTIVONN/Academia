/**
 * cards.tsx — Cards da seção Treinos (Fase 4)
 * Port 1:1 de JS/treino/templates.js:
 *   treinosGridCard (L150–177), treinosCollectionCard (L179–218),
 *   deckActiveSlot (L221–284), deckEmptySlot (L289–302).
 * Imagens usam o fallback .premium-placeholder idem legado (onerror).
 */

import React, { useState } from 'react';
import type { Exercise } from '@/core/db/schema';
import { formatCarga, grupoBadgeClass } from '@/core/db/queries';

/* ── Imagem (onerror → .premium-placeholder, idem FichaFeature/legado) ── */

export const ExImg: React.FC<{ ex: Pick<Exercise, 'id' | 'name' | 'imageUrl'> }> = ({
  ex,
}) => {
  const [failed, setFailed] = useState(false);
  if (!ex.imageUrl || failed) {
    return (
      <div className="premium-placeholder">
        <i className="fas fa-dumbbell" />
        <span>EXERCÍCIO</span>
      </div>
    );
  }
  return <img src={ex.imageUrl} alt={ex.name} onError={() => setFailed(true)} />;
};

/** `cargaHtml` de renderExercicios (secao-treinos.js L72) — privado ao módulo. */
function cargaHtml(ex: Exercise): string {
  return ex.load || ex.tags?.includes('Peso do Corpo')
    ? ' | Carga: ' + formatCarga(ex)
    : '';
}

/* ── treinosGridCard (templates.js L150–177) ── */

export const TreinosGridCard: React.FC<{
  ex: Exercise;
  onEdit: (ex: Exercise) => void;
  onDel: (ex: Exercise) => void;
}> = ({ ex, onEdit, onDel }) => (
  <div className="ex-card" data-id={ex.id}>
    <div className="ex-card-img">
      <ExImg ex={ex} />
    </div>
    <div className="ex-card-body">
      <div className="ex-card-name">{ex.name}</div>
      <div className="ex-card-meta">
        <span className={grupoBadgeClass(ex.muscleGroup)}>{ex.muscleGroup}</span>
        <span className="ex-card-vol">
          {ex.sets}×{ex.reps}
          {cargaHtml(ex)}
        </span>
      </div>
      <div className="ex-card-actions">
        <button
          type="button"
          className="btn-ex-edit"
          data-id={ex.id}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(ex);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width={14}
            height={14}
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>{' '}
          Editar
        </button>
        <button
          type="button"
          className="btn-ex-del"
          data-id={ex.id}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          onClick={(e) => {
            e.stopPropagation();
            onDel(ex);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width={14}
            height={14}
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>{' '}
          Excluir
        </button>
      </div>
    </div>
  </div>
);

/* ── treinosCollectionCard (templates.js L179–218) ── */

export const TreinosCollectionCard: React.FC<{
  ex: Exercise;
  already: boolean;
  menuActive?: boolean;
  onEdit: (ex: Exercise) => void;
  onDel: (ex: Exercise) => void;
  onCardClick: (ex: Exercise) => void;
}> = ({ ex, already, menuActive, onEdit, onDel, onCardClick }) => (
  <div
    className={`deck-card collection-card card-${ex.muscleGroup}${already ? ' in-deck' : ''}${menuActive ? ' menu-active' : ''}`}
    data-id={ex.id}
    draggable={!already}
    onDragStart={(e) => e.dataTransfer.setData('text/plain', ex.id)}
    onClick={() => onCardClick(ex)}
  >
    <div className="deck-card-header">{ex.muscleGroup}</div>
    <div className="deck-card-img">
      <ExImg ex={ex} />
    </div>
    <div className="deck-card-info">
      <div className="deck-card-name">{ex.name}</div>
      <div
        className="deck-card-level-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          width: '100%',
        }}
      >
        <span className="deck-card-level">{ex.sets} séries</span>
        <button
          type="button"
          className="btn-ex-edit btn-ex-edit-inline"
          data-id={ex.id}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px',
            cursor: 'pointer',
            color: 'var(--primary-light)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          title="Editar exercício"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(ex);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            width={12}
            height={12}
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
      </div>
    </div>
    <div className="deck-card-menu">
      <div className="menu-actions-wrap">
        <button
          type="button"
          className="btn-card-action btn-ex-edit"
          data-id={ex.id}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(ex);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width={14}
            height={14}
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>{' '}
          Editar
        </button>
        <button
          type="button"
          className="btn-card-action btn-ex-del"
          data-id={ex.id}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          onClick={(e) => {
            e.stopPropagation();
            onDel(ex);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width={14}
            height={14}
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>{' '}
          Excluir
        </button>
      </div>
    </div>
  </div>
);

/* ── deckActiveSlot (templates.js L221–284) ── */

const SLOT_MENU_ICONS = {
  search: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={14}
      height={14}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  pencil: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={14}
      height={14}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  star: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={14}
      height={14}
      style={{ marginRight: '4px' }}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  close: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={14}
      height={14}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
};

export const DeckActiveSlot: React.FC<{
  ex: Exercise;
  index: number;
  view: 'grid' | 'list' | 'royale';
  menuActive?: boolean;
  onCardClick?: () => void;
  onDetails: (ex: Exercise) => void;
  onEdit: (ex: Exercise) => void;
  onMaestria: (ex: Exercise) => void;
  onRemove: (ex: Exercise) => void;
  onDragStartSource: (e: React.DragEvent, index: number) => void;
}> = ({ ex, index, view, menuActive, onCardClick, onDetails, onEdit, onMaestria, onRemove, onDragStartSource }) => {
  const dragProps = {
    draggable: true,
    onDragStart: (e: React.DragEvent) => onDragStartSource(e, index),
  };

  if (view === 'list') {
    return (
      <div className="deck-slot list-slot" data-index={index}>
        <div className={`deck-list-item card-${ex.muscleGroup}`} data-id={ex.id} {...dragProps}>
          <div className="dli-img">
            <ExImg ex={ex} />
          </div>
          <div className="dli-info">
            <div className="dli-name">{ex.name}</div>
            <div className="dli-meta">
              {ex.muscleGroup} • {ex.sets}×{ex.reps}
            </div>
          </div>
          <div className="dli-actions">
            <button
              type="button"
              className="btn-card-action btn-card-details"
              data-id={ex.id}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(ex);
              }}
            >
              {SLOT_MENU_ICONS.pencil}
            </button>
            <button
              type="button"
              className="btn-card-action btn-card-remove"
              data-id={ex.id}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(ex);
              }}
            >
              {SLOT_MENU_ICONS.close}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="deck-slot" data-index={index}>
      <div
        className={`deck-card card-${ex.muscleGroup}${menuActive ? ' menu-active' : ''}`}
        data-id={ex.id}
        onClick={onCardClick}
        {...dragProps}
      >
        <div className="deck-card-header">{ex.muscleGroup}</div>
        <div className="deck-card-img">
          <ExImg ex={ex} />
        </div>
        <div className="deck-card-info">
          <div className="deck-card-name">{ex.name}</div>
          <div className="deck-card-level">
            Séries: {ex.sets} × {ex.reps}
          </div>
        </div>
        <div className="deck-card-menu">
          <button
            type="button"
            className="btn-card-action btn-card-details-cr"
            data-id={ex.id}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            onClick={(e) => {
              e.stopPropagation();
              onDetails(ex);
            }}
          >
            {SLOT_MENU_ICONS.search} Detalhes
          </button>
          <button
            type="button"
            className="btn-card-action btn-card-details"
            data-id={ex.id}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(ex);
            }}
          >
            {SLOT_MENU_ICONS.pencil} Edição
          </button>
          <button
            type="button"
            className="btn-card-action btn-card-maestria-mini"
            data-id={ex.id}
            onClick={(e) => {
              e.stopPropagation();
              onMaestria(ex);
            }}
          >
            {SLOT_MENU_ICONS.star} Maestria
          </button>
          <button
            type="button"
            className="btn-card-action btn-card-remove"
            data-id={ex.id}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(ex);
            }}
          >
            {SLOT_MENU_ICONS.close} Remover
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── deckEmptySlot (templates.js L287–302) ── */

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export const DeckEmptySlot: React.FC<{
  index: number;
  view: 'grid' | 'list' | 'royale';
}> = ({ index, view }) => (
  <div className={`deck-slot${view === 'list' ? ' list-slot' : ''}`} data-index={index}>
    <div className="deck-slot-empty-ph">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        width={28}
        height={28}
      >
        <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11" />
        <circle cx="4" cy="12" r="1.5" />
        <circle cx="20" cy="12" r="1.5" />
      </svg>
      <span className="deck-slot-roman">{ROMAN_NUMERALS[index] || index + 1}</span>
    </div>
  </div>
);
