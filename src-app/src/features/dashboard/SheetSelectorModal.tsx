/**
 * SheetSelectorModal.tsx — Modal seletor de fichas (#modalSeletorFichas)
 * Port 1:1 de componentes/secoes/modais.html (L253-348) + renderDashboardSheet()
 * (JS/treino/secao-dashboard.js): abas Royale A–J, grid 4 colunas de deck-cards,
 * row de aeróbico e footer de métricas (volume / maestria / cardio).
 *
 * v4.30.0: o corpo (grid + aeróbico + rodapé de métricas) saiu para o
 * componente compartilhado `FichaDeck`, reutilizado pela prévia do Início.
 *
 * Nota de paridade: no legado, clicar numa aba regrava a sugestão do dia
 * (db.dashboard.suggestedWorkout + setTodayTreino); aqui a troca é informada
 * via onLetterChange e aplicada pelo DashboardFeature.
 */

import React, { useMemo, useState } from 'react';
import type { Exercise, SheetKey, WorkoutSheet } from '@/core/db/schema';
import { compactIds, SHEET_ORDER, type LegacyRaw } from '@/core/db/queries';
import { FichaDeck } from '@/features/dashboard/FichaDeck';
import { MontarMenuModal } from '@/features/workout/treinos/MontarMenuModal';
import { showToast } from '@/lib/toast';
import { useModalPresence } from '@/hooks/useModalPresence';

interface SheetSelectorModalProps {
  open: boolean;
  onClose: () => void;
  sheets: WorkoutSheet[];
  exercises: Exercise[];
  legacy: LegacyRaw | null;
  /** Ficha ativa (controlada pelo DashboardFeature, que deriva a sugestão do dia). */
  letter: SheetKey;
  onLetterChange?: (letter: SheetKey) => void;
}

export const SheetSelectorModal: React.FC<SheetSelectorModalProps> = ({
  open,
  onClose,
  sheets,
  exercises,
  legacy,
  letter,
  onLetterChange,
}) => {
  const activeLetter = letter;
  /* v4.53.0 — mantém o modal montado durante o fade de saída. */
  const { mounted, closing } = useModalPresence(open);
  /* v4.73.0 — menu de compartilhamento da prévia (Copiar/Guilda/Link). */
  const [menuOpen, setMenuOpen] = useState(false);

  const exerciseMap = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises]
  );

  /** Espelha getAvailableWorkouts: fichas com exercícios OU aeróbico. */
  const available = useMemo(
    () =>
      SHEET_ORDER.filter((letter) => {
        const sheet = sheets.find((s) => s.sheetKey === letter);
        return compactIds(sheet?.exerciseIds).length > 0 || Boolean(sheet?.aerobic?.tipo);
      }),
    [sheets]
  );

  const sheet = sheets.find((s) => s.sheetKey === activeLetter);
  const sheetExercises = useMemo(
    () =>
      (sheet?.exerciseIds ?? [])
        .map((id) => exerciseMap.get(id))
        .filter((e): e is Exercise => Boolean(e)),
    [sheet, exerciseMap]
  );

  const selectTab = (next: SheetKey) => {
    onLetterChange?.(next);
  };

  const cycleWorkout = () => {
    if (available.length === 0) return;
    const idx = available.indexOf(activeLetter);
    const next = available[(idx + 1) % available.length];
    selectTab(next);
  };

  /* ── Ações do menu da prévia (mesmas da aba Minha Ficha) ── */
  const sheetIds = compactIds(sheet?.exerciseIds);

  const copySheet = () => {
    try {
      localStorage.setItem('academia_clipboard_sheet', JSON.stringify(sheetIds));
      showToast('Ficha copiada! Cole na aba Minha Ficha.', 'success');
    } catch {
      showToast('Não foi possível copiar a ficha.', 'error');
    }
  };

  const showInGuild = () => {
    try {
      const shared = {
        id: `shared-${Date.now()}`,
        sheetKey: activeLetter,
        exerciseIds: [...sheetIds],
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

  const copyLink = () => {
    try {
      const payload = btoa(JSON.stringify({ k: activeLetter, ids: [...sheetIds] }));
      const url = `${window.location.origin}/?share=${payload}`;
      if (!navigator.clipboard) throw new Error('clipboard indisponível');
      void navigator.clipboard
        .writeText(url)
        .then(() => showToast('Link copiado!', 'success'))
        .catch(() => showToast('Não foi possível copiar o link.', 'error'));
    } catch {
      showToast('Não foi possível copiar o link.', 'error');
    }
  };

  if (!mounted) return null;

  return (
    <div
      className={`modal-overlay${closing ? ' is-closing' : ''}`}
      id="modalSeletorFichas"
      style={{ display: 'flex' }}
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('modal-overlay')) onClose();
      }}
      aria-hidden={closing}
    >
      <div className="dash-mini-deck">
        {/* Header: menu (compartilhar) + abas A–J + alternar ficha */}
        <div className="dash-mini-deck__header">
          <button
            className="dash-mini-deck__menu-btn"
            id="dashMiniMenuBtn"
            title="Menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width={18} height={18}>
              <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
              <line x1="4" y1="6" x2="20" y2="6" strokeLinecap="round" />
              <line x1="4" y1="18" x2="20" y2="18" strokeLinecap="round" />
            </svg>
          </button>

          <div className="dash-mini-deck__tabs" id="dashSheetTabs">
            {available.map((letter) =>
              letter === activeLetter ? (
                <button key={letter} className="dash-mini-deck__tab active" data-workout={letter} onClick={() => selectTab(letter)}>
                  <svg className="dash-mini-deck__tab-shield" viewBox="0 0 100 115">
                    <path
                      d="M 15 8 L 85 8 L 85 62 L 50 105 L 15 62 Z"
                      fill="rgba(139, 92, 246, 0.18)"
                      stroke="#8b5cf6"
                      strokeWidth="6"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="dash-mini-deck__tab-letter">{letter}</span>
                </button>
              ) : (
                <button key={letter} className="dash-mini-deck__tab" data-workout={letter} onClick={() => selectTab(letter)}>
                  {letter}
                </button>
              )
            )}
          </div>

          <button className="dash-mini-deck__swap-btn" id="dashMiniSwapBtn" title="Alternar Ficha" onClick={cycleWorkout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width={18} height={18}>
              <path d="M4 8h16M16 4l4 4-4 4M20 16H4M8 12l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

        </div>

        {/* Corpo + rodapé de métricas (grid Royale, linha de aeróbico, stats) */}
        <FichaDeck sheet={sheet} exercises={sheetExercises} legacy={legacy} />
      </div>

      {/* Menu de compartilhamento da prévia (mesmo painel do menu da ficha) */}
      <MontarMenuModal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        mode="share"
        anchorId="dashMiniMenuBtn"
        onAddSheet={() => undefined}
        onDeleteSheet={() => undefined}
        onCopySheet={copySheet}
        onPasteSheet={() => undefined}
        onShowInGuild={showInGuild}
        onLink={copyLink}
        canAdd={false}
        canDelete={false}
        hasClipboard={false}
      />
    </div>
  );
};

export default SheetSelectorModal;
