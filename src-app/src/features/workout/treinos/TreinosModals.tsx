/**
 * TreinosModals.tsx — Modais da seção Treinos (Fase 4)
 * Ports:
 *  - modalConfirm (modais.html L350–361 + confirmDeleteExercicio L242–262)
 *  - modalImage (modais.html L376–382 + app.js L338–345)
 *  - modalAerobico (modais.html L914–950 + openAerobicoModal L1070–1096)
 *  - modalCRDetails (modais.html L952–1031 + secao-ficha.js openCRDetails L1107–1263)
 *  - modalMaestriaGeral (modais.html L741–789 + openMaestriaGeral L834–875)
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { AerobicConfig, Exercise, SheetKey } from '@/core/db/schema';
import { DEFAULT_AEROBIC } from '@/core/db/schema';
import { getMaestriaState, computeMasteryTotals } from '@/features/gamification/maestria';
import type { LegacyRaw } from '@/core/db/queries';
import { getSpeedUnitLabel } from '@/lib/app-prefs';
import { useModalPresence } from '@/hooks/useModalPresence';

/* Portal para document.body: o .section-strip tem transform/will-change
   (translateX da navegação de seções) e viraria o containing block do
   position:fixed do .modal-overlay — o modal sairia da viewport.
   Mesmo padrão do SocialFeature.tsx. */
const toBody = (node: React.ReactNode) => createPortal(node, document.body);

const TIER_BY_BADGE = ['none', 'bronze', 'prata', 'ouro'] as const;

/* ══ modalConfirm ══ */

export const ConfirmModal: React.FC<{
  open: boolean;
  title: string;
  msg: string;
  onYes: () => void;
  onNo: () => void;
}> = ({ open, title, msg, onYes, onNo }) => {
  return toBody(
    <div
      className="modal-overlay"
      id="modalConfirm"
      style={{
        display: 'flex',
        opacity: open ? 1 : 0,
        visibility: open ? 'visible' : 'hidden',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.2s ease, visibility 0.2s ease',
      }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onNo();
      }}
    >
      <div className="modal-confirm">
        <div className="confirm-icon">⚠️</div>
        <h3 id="confirmTitle">{title}</h3>
        <p id="confirmMsg">{msg}</p>
        <div className="confirm-actions">
          <button type="button" className="btn btn-secondary" id="btnConfirmNo" onClick={onNo}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" id="btnConfirmYes" onClick={onYes}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══ modalImage ══ */

export const ImageModal: React.FC<{ open: boolean; src: string; onClose: () => void }> = ({
  open,
  src,
  onClose,
}) => {
  return toBody(
    <div
      className="modal-overlay"
      id="modalImage"
      style={{
        display: 'flex',
        opacity: open ? 1 : 0,
        visibility: open ? 'visible' : 'hidden',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.2s ease, visibility 0.2s ease',
      }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-image-container">
        <button type="button" className="modal-close-btn image-close-btn" id="btnFecharImage" aria-label="Fechar" onClick={onClose}>
          ✕
        </button>
        <img id="enlargedImage" src={src} alt="Ampliada" className="enlarged-img" />
      </div>
    </div>
  );
};

/* ══ modalAerobico ══ */

const AE_OPTIONS = [
  ['', 'Selecione...'],
  ['Nenhum', 'Nenhum'],
  ['Esteira', 'Esteira'],
  ['Bicicleta', 'Bicicleta'],
  ['Elíptico', 'Elíptico'],
  ['Corda', 'Pular Corda'],
  ['Escada', 'Escada'],
  ['Corrida de Rua', 'Corrida de Rua'],
  ['Remo', 'Remo Ergométrico'],
  ['Outro', 'Outro Cardio'],
] as const;

export const AerobicoModal: React.FC<{
  open: boolean;
  letter: SheetKey;
  aerobic: AerobicConfig | null;
  onClose: () => void;
  onSave: (ae: AerobicConfig) => void;
}> = ({ open, letter, aerobic, onClose, onSave }) => {
  /* openAerobicoModal (L1070–1080): pré-preenche ao abrir — remontagem via `key`.
     v4.31.0 — sem cardio configurado, abre já com o PADRÃO do app (10 min de
     esteira a 3 km/h); campo vazio na ficha não deixa o formulário em branco. */
  const [tipo, setTipo] = useState(() => aerobic?.tipo || DEFAULT_AEROBIC.tipo);
  const [vel, setVel] = useState(() => aerobic?.vel || DEFAULT_AEROBIC.vel);
  const [tempo, setTempo] = useState(() => aerobic?.tempo || DEFAULT_AEROBIC.tempo);
  /* v4.53.0 — mantém montado durante o fade de saída. */
  const { mounted, closing } = useModalPresence(open);

  if (!mounted) return null;

  return toBody(
    <div
      className={`modal-overlay${closing ? ' is-closing' : ''}`}
      id="modalAerobico"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-form">
        <div className="modal-form-header">
          <h3 id="modalAeTitulo">{`Configurar Cardio - Treino ${letter}`}</h3>
          <button type="button" className="modal-close-btn" aria-label="Fechar" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="form-group" style={{ marginTop: 15 }}>
          <label htmlFor="inputAeTipo">Tipo de Exercício *</label>
          <select
            id="inputAeTipo"
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 12,
              background: '#111',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              outline: 'none',
              appearance: 'none',
            }}
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            {AE_OPTIONS.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row form-row--2" style={{ marginTop: 15 }}>
          <div className="form-group">
            <label htmlFor="inputAeTempo">Duração (min) *</label>
            <input
              type="number"
              id="inputAeTempo"
              placeholder="Ex: 20"
              min={1}
              max={180}
              value={tempo}
              onChange={(e) => setTempo(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="inputAeVel">Velocidade Média ({getSpeedUnitLabel()})</label>
            <input type="text" id="inputAeVel" placeholder="Ex: 8.5" value={vel} onChange={(e) => setVel(e.target.value)} />
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: 25 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            id="btnSalvarAerobico"
            onClick={() => onSave({ tipo, vel, tempo })}
          >
            Salvar Cardio
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══ modalMaestriaGeral ══ */

const MG_PLACEHOLDER_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={24} height={24}>
    <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11" />
    <circle cx="4" cy="12" r="1.5" />
    <circle cx="20" cy="12" r="1.5" />
  </svg>
);

export const MaestriaGeralModal: React.FC<{
  open: boolean;
  exercises: Exercise[];
  legacy: LegacyRaw | null;
  onClose: () => void;
  onOpenEx: (exId: string) => void;
}> = ({ open, exercises, legacy, onClose, onOpenEx }) => {
  const { totalXP, rank, pct } = computeMasteryTotals(exercises, legacy);
  /* v4.56.16 — mantém montado durante o fade de saída (.is-closing). */
  const { mounted, closing } = useModalPresence(open);

  if (!mounted) return null;

  return toBody(
    <div
      className={`modal-overlay${closing ? ' is-closing' : ''}`}
      id="modalMaestriaGeral"
      style={{ display: 'flex' }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="maestria-geral-container">
        <div className="maestria-geral-header">
          <div className="maestria-geral-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mg-title-icon" style={{ display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={20} height={20} style={{ color: 'var(--primary)' }}>
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
              </svg>
            </span>
            <h2>Maestria de Exercícios</h2>
          </div>
          <button type="button" className="modal-close-btn" id="btnFecharMaestriaGeral" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="maestria-geral-sub">
          Complete desafios para evoluir a maestria de cada exercício e ganhar emblemas!
        </p>

        <div
          className="colecao-athletic-stats"
          style={{ margin: '0 40px 20px 40px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 15, background: 'rgba(0,0,0,0.2)' }}
        >
          <div className="athletic-level-info">
            <span className="athletic-rank-label" id="athleticRankMG">
              {rank.title}
            </span>
            <span className="athletic-level-val" id="athleticLevelMG">{`Maestria Nível ${rank.level}`}</span>
          </div>
          <div className="athletic-progress-container">
            <div className="athletic-progress-bar">
              <div className="athletic-progress-fill" id="athleticProgressMG" style={{ width: `${pct}%` }} />
              <div className="athletic-shine" />
            </div>
            <span className="athletic-xp-text" id="athleticXPMG">{`${totalXP} / ${rank.next} PTS`}</span>
          </div>
        </div>

        <div className="maestria-geral-grid" id="maestriaGeralGrid">
          {exercises.map((ex) => {
            const state = getMaestriaState(legacy, ex.id);
            const bc = TIER_BY_BADGE[state.badgeLevel];
            return (
              <div
                className={`royale-card frame-${bc}`}
                data-id={ex.id}
                key={ex.id}
                onClick={() => {
                  onClose();
                  onOpenEx(ex.id);
                }}
              >
                <div className="royale-card-inner">
                  {state.badgeLevel > 0 && <div className="royale-diamond" />}
                  <div className="royale-img-container">
                    {ex.imageUrl ? (
                      <img src={ex.imageUrl} alt={ex.name} />
                    ) : (
                      <div className="m-card-img-ph" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {MG_PLACEHOLDER_SVG}
                      </div>
                    )}
                    <div className={`royale-level-pill pill-${bc}`}>
                      <span className="pill-text">{ex.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="maestria-geral-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span className="mg-footer-icon" style={{ display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={16} height={16} style={{ color: 'var(--primary-light)' }}>
              <polyline points="17 11 12 6 7 11" />
              <polyline points="17 18 12 13 7 18" />
            </svg>
          </span>
          <span>Cada desafio completado melhora o emblema de maestria do exercício!</span>
        </div>
      </div>
    </div>
  );
};
