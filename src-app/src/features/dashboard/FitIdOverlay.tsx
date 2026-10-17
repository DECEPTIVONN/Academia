/**
 * FitIdOverlay.tsx — Tela de identidade "Fit ID" (v4.31.1)
 *
 * Inspirada nas telas do Supercell ID (imagens de referência), adaptada ao
 * contexto do app: avatar + identificação, e 3 abas —
 *   1. Recompensas de Identificação → pontuação (XP), nível e recompensas;
 *   2. Amigos → lista de amigos da aba Social (mesma fonte de dados);
 *   3. Meus Dados ("Jogos Meus" adaptado) → o app conectado + as fichas do
 *      usuário com os treinos concluídos de cada uma.
 *
 * Portal para document.body (mesma causa-raiz dos demais overlays do app).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Exercise, WorkoutHistory, WorkoutSheet } from '@/core/db/schema';
import { SHEET_ORDER, getLevel } from '@/core/db/queries';
import { FRIENDS } from '@/features/social/social-data';
import { showToast } from '@/lib/toast';
import './inicio-menu.css';

const toBody = (node: React.ReactNode) => createPortal(node, document.body);

type FitIdTab = 'rewards' | 'friends' | 'data';

interface FitIdOverlayProps {
  open: boolean;
  onClose: () => void;
  name: string;
  avatarUrl: string;
  /** Título do usuário (customização), se houver. */
  title?: string | null;
  xp: number;
  streak: number;
  sheets: WorkoutSheet[];
  exercises: Exercise[];
  history: WorkoutHistory[];
  onOpenSettings?: () => void;
}

const TABS: { id: FitIdTab; label: string; icon: string }[] = [
  { id: 'rewards', label: 'Recompensas de Identificação', icon: 'workspace_premium' },
  { id: 'friends', label: 'Amigos', icon: 'group' },
  { id: 'data', label: 'Meus Dados', icon: 'badge' },
];

export const FitIdOverlay: React.FC<FitIdOverlayProps> = ({
  open,
  onClose,
  name,
  avatarUrl,
  title,
  xp,
  streak,
  sheets,
  exercises,
  history,
  onOpenSettings,
}) => {
  const [tab, setTab] = useState<FitIdTab>('rewards');

  /* Volta para a 1ª aba a cada abertura (padrão "adjusting state when props
     change" — mesmo usado no MissionsOverlay). */
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setTab('rewards');
  }

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const level = getLevel(xp);
  const treinos = useMemo(() => history.filter((h) => h.completed).length, [history]);

  /* Treinos concluídos por ficha (mesma leitura do getCycleStats: completedKeys
     quando existe, senão a letra do dia quando `completed`). */
  const treinosPorFicha = useMemo(() => {
    const map: Record<string, number> = {};
    for (const key of SHEET_ORDER) map[key] = 0;
    for (const row of history) {
      const keys = row.completedKeys?.length
        ? row.completedKeys
        : row.completed && row.sheetKey
          ? [row.sheetKey]
          : [];
      for (const key of keys) if (key in map) map[key] += 1;
    }
    return map;
  }, [history]);

  const exerciseCount = useMemo(() => {
    const map = new Map(exercises.map((e) => [e.id, e]));
    return (sheet: WorkoutSheet) =>
      (sheet.exerciseIds ?? []).filter((id) => map.has(id)).length;
  }, [exercises]);

  const fichas = useMemo(
    () => sheets.filter((s) => (s.exerciseIds?.length ?? 0) > 0),
    [sheets]
  );

  const online = FRIENDS.filter((f) => f.status !== 'offline').length;

  if (!open) return null;

  const identity = [title ? title : null, `Ofensiva ${streak} ${streak === 1 ? 'dia' : 'dias'}`]
    .filter(Boolean)
    .join(' · ');

  return toBody(
    <div className="fitid-overlay" role="dialog" aria-modal="true" aria-label="Fit ID">
      <div className="fitid-shell">
        <header className="fitid-head">
          <button
            type="button"
            className="fitid-head__btn"
            aria-label="Configurações"
            title="Configurações"
            onClick={() => onOpenSettings?.()}
          >
            <span className="material-symbols-outlined">settings</span>
          </button>

          <div className="fitid-ident">
            <div className="fitid-ident__avatar">
              <img src={avatarUrl} alt="" />
            </div>
            <span className="fitid-ident__chip">Fit ID</span>
            <h2 className="fitid-ident__name">{name}</h2>
            <span className="fitid-ident__sub">{identity}</span>
          </div>

          <button type="button" className="fitid-head__btn" aria-label="Fechar" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="fitid-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              type="button"
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`fitid-tab${tab === t.id ? ' active' : ''}`}
              data-fitid-tab={t.id}
              onClick={() => setTab(t.id)}
            >
              <span className="material-symbols-outlined">{t.icon}</span>
              {t.label}
              {t.id === 'friends' && online > 0 && <span className="fitid-tab__dot" />}
            </button>
          ))}
        </div>

        <main className="fitid-body">
          {tab === 'rewards' && (
            <>
              {/* Cartão de identificação (pontuação total + nível) */}
              <section className="fitid-card fitid-card--hero">
                <div className="fitid-hero__brand">
                  <span className="material-symbols-outlined">shield</span>
                  Evo Fit
                </div>
                <div className="fitid-hero__row">
                  <span className="fitid-hero__name">{name}</span>
                  <span className="fitid-badge">Conectado</span>
                </div>
                <div className="fitid-hero__score">
                  <span className="fitid-hero__score-label">Pontuação total</span>
                  <span className="fitid-hero__score-val">
                    {xp}
                    <small>PTS</small>
                  </span>
                </div>
              </section>

              {/* Recompensas (placeholder: gancho das conquistas do app) */}
              <section
                className="fitid-card fitid-card--cta"
                onClick={() => showToast('Recompensas de identificação — em breve.', 'info')}
              >
                <span className="material-symbols-outlined">redeem</span>
                <div>
                  <h4>Junte pontos e ganha prêmios</h4>
                  <p>
                    Complete treinos, mantenha a ofensiva acesa e suba de nível para desbloquear
                    recompensas exclusivas.
                  </p>
                </div>
                <span className="material-symbols-outlined">chevron_right</span>
              </section>

              <div className="fitid-stats">
                <div className="fitid-stat">
                  <span className="fitid-stat__val">{treinos}</span>
                  <span className="fitid-stat__label">Treinos</span>
                </div>
                <div className="fitid-stat">
                  <span className="fitid-stat__val">{streak}</span>
                  <span className="fitid-stat__label">Ofensiva</span>
                </div>
                <div className="fitid-stat">
                  <span className="fitid-stat__val">{level}</span>
                  <span className="fitid-stat__label">Nível</span>
                </div>
              </div>
            </>
          )}

          {tab === 'friends' && (
            <>
              <div className="fitid-section-head">
                <h3 className="fitid-section-title">Lista de amigos ({FRIENDS.length})</h3>
                <span className="fitid-online">{online} online</span>
              </div>

              <div className="fitid-list">
                {FRIENDS.map((f) => (
                  <div className="fitid-row" key={f.id}>
                    <span className="fitid-row__avatar" data-status={f.status}>
                      {f.initials}
                    </span>
                    <div className="fitid-row__text">
                      <span className="fitid-row__name">{f.name}</span>
                      <span className="fitid-row__sub">{f.statusText}</span>
                    </div>
                    <div className="fitid-row__value">
                      <strong>{f.trophies}</strong>
                      <span>Troféus</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="fitid-cta"
                onClick={() => showToast('Adicionar amigo — em breve.', 'info')}
              >
                <span className="material-symbols-outlined">person_add</span>
                Adicionar amigo
              </button>
            </>
          )}

          {tab === 'data' && (
            <>
              <div className="fitid-section-head">
                <h3 className="fitid-section-title">Minhas fichas ({fichas.length})</h3>
              </div>

              <div className="fitid-list">
                {/* O app "conectado" (linha em destaque, como o jogo ativo) */}
                <div className="fitid-row fitid-row--active">
                  <span className="fitid-row__badge">EF</span>
                  <div className="fitid-row__text">
                    <span className="fitid-row__name">Evo Fit</span>
                    <span className="fitid-row__sub">Fit ID · Nível {level}</span>
                  </div>
                  <div className="fitid-row__value">
                    <strong>{xp}</strong>
                    <span>Xp</span>
                  </div>
                </div>

                {fichas.length === 0 ? (
                  <div className="fitid-card">
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#8a8a9c' }}>
                      Nenhuma ficha montada ainda. Monte um treino na aba <b>Treinos</b>.
                    </p>
                  </div>
                ) : (
                  fichas.map((s) => {
                    const n = exerciseCount(s);
                    const feitos = treinosPorFicha[s.sheetKey] ?? 0;
                    return (
                      <div className="fitid-row" key={s.sheetKey}>
                        <span className="fitid-row__badge">{s.sheetKey}</span>
                        <div className="fitid-row__text">
                          <span className="fitid-row__name">Ficha {s.sheetKey}</span>
                          <span className="fitid-row__sub">
                            {n} {n === 1 ? 'exercício' : 'exercícios'}
                            {s.aerobic?.tipo ? ` · ${s.aerobic.tipo}` : ''}
                          </span>
                        </div>
                        <div className="fitid-row__value">
                          <strong>{feitos}</strong>
                          <span>Treinos</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                className="fitid-cta"
                onClick={() => showToast('Exportar Fit ID — em breve.', 'info')}
              >
                <span className="material-symbols-outlined">share</span>
                Compartilhar Fit ID
              </button>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default FitIdOverlay;
