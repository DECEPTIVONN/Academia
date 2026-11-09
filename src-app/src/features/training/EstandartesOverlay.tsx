/**
 * EstandartesOverlay.tsx — Conquistas de Estandartes do Perfil (v4.73.1)
 *
 * Aberta pelo card "Emblemas" da aba Progresso. Reúne os mesmos estandartes
 * do Personalizar > Estandartes, mas como uma galeria de CONQUISTAS: mostra
 * quantos foram desbloqueados e, ao tocar em um deles, os requisitos exatos
 * (com progresso atual) para liberar o estandarte.
 *
 * Os critérios vêm de `EMBLEMAS[].unlock` e usam exatamente a mesma regra de
 * `isUnlocked` (treinos, ofensiva, XP e maestria), então o que aparece aqui é
 * o que o jogo realmente cobra.
 */

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Award, Check, Lock, X } from 'lucide-react';
import { useModalPresence } from '@/hooks/useModalPresence';
import {
  EMBLEMAS,
  getProfileStats,
  isDevMode,
  isUnlocked,
  type ProfileStats,
  type Unlock,
} from '@/features/profile/profile-data';
import type { LocalData } from '@/core/db/queries';
import './estandartes-achievements.css';

interface EstandartesOverlayProps {
  open: boolean;
  onClose: () => void;
  data: LocalData;
}

interface RequirementInfo {
  label: string;
  current: number;
  target: number;
  unit: string;
  /** Texto curto do que falta (ou do estado disponível). */
  missing: string;
}

const MAESTRIA_LABEL: Record<string, string> = {
  bronze: 'Bronze',
  prata: 'Prata',
  ouro: 'Ouro',
};

const MAESTRIA_LEVEL: Record<string, number> = { bronze: 1, prata: 2, ouro: 3 };

function masteryLevel(maestrias: Record<string, { nivel?: number }>): number {
  return Object.values(maestrias).reduce((max, m) => Math.max(max, m.nivel || 1), 0);
}

function describeRequirement(
  unlock: Unlock | null,
  stats: ProfileStats,
  maestrias: Record<string, { nivel?: number }>
): RequirementInfo {
  if (!unlock) {
    return {
      label: 'Disponível para todos os atletas',
      current: 1,
      target: 1,
      unit: '',
      missing: 'Nenhum requisito — já é seu.',
    };
  }

  switch (unlock.tipo) {
    case 'treinos': {
      const target = Number(unlock.val);
      const missing = Math.max(0, target - stats.totalTreinos);
      return {
        label: `Conclua ${target} treinos`,
        current: stats.totalTreinos,
        target,
        unit: 'treinos',
        missing: missing === 0 ? 'Requisito concluído.' : `Faltam ${missing} treino${missing > 1 ? 's' : ''}.`,
      };
    }
    case 'streak': {
      const target = Number(unlock.val);
      const missing = Math.max(0, target - stats.streak);
      return {
        label: `Alcance ${target} dias de ofensiva`,
        current: stats.streak,
        target,
        unit: 'dias',
        missing: missing === 0 ? 'Requisito concluído.' : `Faltam ${missing} dia${missing > 1 ? 's' : ''} de ofensiva.`,
      };
    }
    case 'xp': {
      const target = Number(unlock.val);
      const missing = Math.max(0, target - stats.xp);
      return {
        label: `Acumule ${target} XP`,
        current: stats.xp,
        target,
        unit: 'XP',
        missing: missing === 0 ? 'Requisito concluído.' : `Faltam ${missing} XP.`,
      };
    }
    case 'maestria': {
      const val = String(unlock.val);
      const tier = MAESTRIA_LABEL[val] ?? val;
      const target = MAESTRIA_LEVEL[val] ?? 1;
      const current = masteryLevel(maestrias);
      const missing = Math.max(0, target - current);
      return {
        label: `Alcance a maestria ${tier} em qualquer exercício`,
        current,
        target,
        unit: 'níveis',
        missing:
          missing === 0
            ? 'Requisito concluído.'
            : `Faltam ${missing} nível${missing > 1 ? 's' : ''} de maestria.`,
      };
    }
    default:
      return {
        label: 'Requisito especial',
        current: 0,
        target: 1,
        unit: '',
        missing: 'Continue treinando para descobrir.',
      };
  }
}

const STATUS_LABEL: Record<string, string> = {
  treinos: 'Treinos concluídos',
  streak: 'Dias de ofensiva',
  xp: 'XP acumulado',
  maestria: 'Nível de maestria',
};

function formatValue(value: number, unlock: Unlock | null): string {
  if (!unlock) return '—';
  if (unlock.tipo === 'xp') return value.toLocaleString('pt-BR');
  return String(value);
}

export function EstandartesOverlay({ open, onClose, data }: EstandartesOverlayProps) {
  const { mounted, closing } = useModalPresence(open);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stats = useMemo(() => getProfileStats(data), [data]);
  const maestrias = useMemo(
    () => (data.legacy?.maestrias ?? {}) as Record<string, { nivel?: number }>,
    [data.legacy]
  );
  const devMode = isDevMode();

  /* Fecha a folha de detalhes junto com o overlay. */
  const handleClose = () => {
    setSelectedId(null);
    onClose();
  };

  const cards = useMemo(
    () =>
      EMBLEMAS.map((emb) => ({
        emb,
        unlocked: isUnlocked(emb.unlock, stats, devMode, maestrias),
        req: describeRequirement(emb.unlock, stats, maestrias),
      })),
    [stats, devMode, maestrias]
  );

  const unlocked = cards.filter((c) => c.unlocked);
  const locked = cards.filter((c) => !c.unlocked);
  const pct = cards.length > 0 ? Math.round((unlocked.length / cards.length) * 100) : 0;
  const selected = cards.find((c) => c.emb.id === selectedId) ?? null;

  if (!mounted) return null;

  const renderCard = (card: (typeof cards)[number]) => {
    const anim = card.emb.animated ? ` est-card__icon--${card.emb.animationType ?? 'pulse-glow'}` : '';
    return (
      <button
        type="button"
        key={card.emb.id}
        className={`est-card${card.unlocked ? ' is-unlocked' : ' is-locked'}`}
        onClick={() => setSelectedId(card.emb.id)}
        aria-label={`${card.emb.nome} — ${card.unlocked ? 'conquistado' : 'bloqueado'}`}
      >
        <span className="est-card__badge">
          {card.unlocked ? <Check size={11} aria-hidden="true" /> : <Lock size={11} aria-hidden="true" />}
        </span>
        <span className="est-card__icon-wrap">
          <span
            className={`est-card__icon${anim}`}
            dangerouslySetInnerHTML={{ __html: card.emb.icon }}
          />
        </span>
        <span className="est-card__name">{card.emb.nome}</span>
        <span className="est-card__state">{card.unlocked ? 'Conquistado' : 'Bloqueado'}</span>
      </button>
    );
  };

  return createPortal(
    <div
      className={`est-root${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Estandartes do Perfil"
    >
      <header className="est-head">
        <button type="button" className="est-icon-btn" onClick={handleClose} aria-label="Voltar">
          <X size={20} />
        </button>
        <h2 className="est-head__title">Estandartes</h2>
        <span className="est-chip" title={`${unlocked.length} de ${cards.length} desbloqueados`}>
          <Award size={14} aria-hidden="true" />
          {unlocked.length}/{cards.length}
        </span>
      </header>

      <div className="est-scroll">
        <section className="est-hero">
            <span className="est-hero__emblem" aria-hidden="true">
              <Award size={30} />
            </span>
            <span className="est-hero__eyebrow">Conquistas do perfil</span>
            <h3 className="est-hero__title">
              {unlocked.length} de {cards.length} estandartes
            </h3>
            <p className="est-hero__text">
              Cada estandarte conta um marco da sua jornada. Toque em um deles para ver
              exatamente o que falta para desbloquear.
            </p>
            <div className="est-progress" aria-hidden="true">
              <span className="est-progress__fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="est-hero__foot">
              <span>{pct}% da coleção</span>
              <span>{cards.length - unlocked.length} bloqueado{cards.length - unlocked.length === 1 ? '' : 's'}</span>
            </div>
        </section>

        {unlocked.length > 0 && (
          <section className="est-section">
            <div className="est-section__head">
              <h3>Conquistados</h3>
              <span className="est-section__count">{unlocked.length}</span>
            </div>
            <div className="est-grid">{unlocked.map(renderCard)}</div>
          </section>
        )}

        {locked.length > 0 && (
          <section className="est-section">
            <div className="est-section__head">
              <h3>Bloqueados</h3>
              <span className="est-section__count">{locked.length}</span>
            </div>
            <div className="est-grid">{locked.map(renderCard)}</div>
          </section>
        )}
      </div>

      {selected && (
        <div
          className="est-sheet"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          <div className="est-sheet__panel" role="dialog" aria-modal="true" aria-label={selected.emb.nome}>
            <button
              type="button"
              className="est-sheet__close"
              aria-label="Fechar detalhes"
              onClick={() => setSelectedId(null)}
            >
              <X size={18} />
            </button>

            <span className={`est-sheet__icon${selected.unlocked ? ' is-unlocked' : ''}`}>
              <span
                className={selected.emb.animated ? `est-card__icon--${selected.emb.animationType ?? 'pulse-glow'}` : ''}
                dangerouslySetInnerHTML={{ __html: selected.emb.icon }}
              />
            </span>

            <span className={`est-sheet__status${selected.unlocked ? ' is-unlocked' : ''}`}>
              {selected.unlocked ? (
                <>
                  <Check size={12} aria-hidden="true" /> Conquistado
                </>
              ) : (
                <>
                  <Lock size={12} aria-hidden="true" /> Bloqueado
                </>
              )}
            </span>

            <h3 className="est-sheet__title">{selected.emb.nome}</h3>
            <p className="est-sheet__desc">{selected.req.label}</p>

            <div className="est-sheet__progress">
              <span
                className={`est-sheet__progress-fill${selected.unlocked ? ' is-done' : ''}`}
                style={{
                  width: `${Math.min(100, selected.req.target > 0 ? (selected.req.current / selected.req.target) * 100 : 0)}%`,
                }}
              />
            </div>
            <div className="est-sheet__meta">
              <span>{STATUS_LABEL[selected.emb.unlock?.tipo ?? ''] ?? 'Disponível'}</span>
              <strong>
                {formatValue(selected.req.current, selected.emb.unlock)} /{' '}
                {formatValue(selected.req.target, selected.emb.unlock)}
              </strong>
            </div>

            <p className={`est-sheet__hint${selected.unlocked ? ' is-done' : ''}`}>
              {selected.unlocked
                ? 'Você já pode equipar este estandarte em Personalizar › Estandartes.'
                : selected.req.missing}
            </p>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export default EstandartesOverlay;
