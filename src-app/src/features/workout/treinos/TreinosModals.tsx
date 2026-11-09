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
import {
  getMaestriaState,
  computeMasteryTotals,
  MAESTRIA_CHALLENGES,
} from '@/features/gamification/maestria';
import type { LegacyRaw } from '@/core/db/queries';
import { getSpeedUnitLabel } from '@/lib/app-prefs';
import { useModalPresence } from '@/hooks/useModalPresence';

/* Portal para document.body: o .section-strip tem transform/will-change
   (translateX da navegação de seções) e viraria o containing block do
   position:fixed do .modal-overlay — o modal sairia da viewport.
   Mesmo padrão do SocialFeature.tsx. */
const toBody = (node: React.ReactNode) => createPortal(node, document.body);

const TIER_BY_BADGE = ['none', 'bronze', 'prata', 'ouro'] as const;
const TIER_LABEL = ['Sem maestria', 'Bronze', 'Prata', 'Ouro'] as const;
const MASTERY_MILESTONES = [5, 15, 30, 50, 75, 100, 150, 200, 300];

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
  /* v4.56.22 — opções da lista de cardio da referência (imagens 2 e 3). */
  ['Bicicleta de ar', 'Bicicleta de ar'],
  ['Caminhada', 'Caminhada'],
  ['Caminhada na esteira', 'Caminhada na esteira'],
  ['Ciclismo', 'Ciclismo'],
  ['Ciclismo na ergométrica', 'Ciclismo na ergométrica'],
  ['Corrida', 'Corrida'],
  ['Corrida na esteira', 'Corrida na esteira'],
  ['Escalador vertical', 'Escalador vertical'],
  ['Natação', 'Natação'],
  ['Remada', 'Remada'],
  ['SkiErg', 'SkiErg'],
  ['Stepper', 'Stepper'],
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

/* Imagem do exercício com fallback real: se a URL falhar (404, domínio fora
   do ar, blob inválido) mostra o placeholder em vez do ícone quebrado do
   navegador. v4.73.1 */
const MasteryThumb: React.FC<{ src?: string | null; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="mg-card__ph">
        {MG_PLACEHOLDER_SVG}
        <span className="mg-card__ph-label">Sem imagem</span>
      </div>
    );
  }

  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
};

export const MaestriaGeralModal: React.FC<{
  open: boolean;
  exercises: Exercise[];
  legacy: LegacyRaw | null;
  onClose: () => void;
  onOpenEx: (exId: string) => void;
}> = ({ open, exercises, legacy, onClose, onOpenEx }) => {
  const { totalXP, rank, pct } = computeMasteryTotals(exercises, legacy);
  const mastery = exercises.map((ex) => ({ ex, state: getMaestriaState(legacy, ex.id) }));
  const badgeTotals = [1, 2, 3].map(
    (level) => mastery.filter((m) => m.state.badgeLevel >= level).length
  );
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
        <header className="mg-head">
          <span className="mg-head__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
            </svg>
          </span>
          <div className="mg-head__copy">
            <span className="mg-head__eyebrow">Coleção de maestria</span>
            <h2>Maestria de Exercícios</h2>
            <p>Complete desafios, suba o nível de cada exercício e colecione os emblemas.</p>
          </div>
          <button type="button" className="mg-head__close" id="btnFecharMaestriaGeral" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="mg-scroll">
          <section className="mg-hero">
            <div className="mg-hero__rank">
              <span className="mg-hero__eyebrow">Rank atual</span>
              <strong className="mg-hero__title" id="athleticRankMG">{rank.title}</strong>
              <span className="mg-hero__level" id="athleticLevelMG">Nível {rank.level}</span>
            </div>
            <div className="mg-hero__progress">
              <div className="mg-bar">
                <span className="mg-bar__fill" id="athleticProgressMG" style={{ width: `${pct}%` }} />
              </div>
              <div className="mg-hero__meta">
                <span id="athleticXPMG">{totalXP} pts</span>
                <span>{rank.next} pts para o próximo nível</span>
              </div>
            </div>
          </section>

          <section className="mg-badges" aria-label="Emblemas conquistados">
            {MAESTRIA_CHALLENGES.map((ch, i) => (
              <div className={`mg-badge mg-badge--${ch.badge}`} key={ch.id}>
                <span className="mg-badge__icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ch.icon }} />
                <span className="mg-badge__copy">
                  <strong>{badgeTotals[i]}</strong>
                  <span>{ch.badge === 'bronze' ? 'Bronze' : ch.badge === 'prata' ? 'Prata' : 'Ouro'}</span>
                </span>
                <span className="mg-badge__total">/ {exercises.length}</span>
              </div>
            ))}
          </section>

          <section className="mg-collection">
            <div className="mg-collection__head">
              <h3>Seus exercícios</h3>
              <span>{exercises.length} exercício{exercises.length === 1 ? '' : 's'}</span>
            </div>
            <div className="maestria-geral-grid" id="maestriaGeralGrid">
              {mastery.map(({ ex, state }) => {
                const bc = TIER_BY_BADGE[state.badgeLevel];
                const done = state.badgeLevel >= 3;
                const nextTarget = done
                  ? MASTERY_MILESTONES[MASTERY_MILESTONES.length - 1]
                  : MASTERY_MILESTONES.find((m) => state.totalSessoes < m) ??
                    MASTERY_MILESTONES[MASTERY_MILESTONES.length - 1];
                const progress = done
                  ? 100
                  : Math.min(100, (state.totalSessoes / nextTarget) * 100);
                return (
                  <div
                    className={`royale-card frame-${bc}`}
                    data-id={ex.id}
                    key={ex.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${ex.name} — ${TIER_LABEL[state.badgeLevel]}`}
                    onClick={() => {
                      onClose();
                      onOpenEx(ex.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClose();
                        onOpenEx(ex.id);
                      }
                    }}
                  >
                    <div className="royale-card-inner">
                      {state.badgeLevel > 0 && <div className="royale-diamond" />}
                      <div className="royale-img-container">
                        <MasteryThumb key={ex.imageUrl ?? 'placeholder'} src={ex.imageUrl} alt={ex.name} />
                        <span className={`mg-card__tier mg-card__tier--${bc}`}>{TIER_LABEL[state.badgeLevel]}</span>
                        <div className="mg-card__body">
                          <span className="mg-card__name">{ex.name}</span>
                          <div className="mg-card__progress">
                            <span className="mg-card__bar">
                              <span className="mg-card__bar-fill" style={{ width: `${progress}%` }} />
                            </span>
                            <span className="mg-card__sessions">
                              {done ? 'Maestria plena' : `${state.totalSessoes}/${nextTarget} sessões`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <footer className="maestria-geral-footer">
          <span className="mg-footer-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
              <polyline points="17 11 12 6 7 11" />
              <polyline points="17 18 12 13 7 18" />
            </svg>
          </span>
          <span>Cada desafio completado melhora o emblema de maestria do exercício!</span>
        </footer>
      </div>
    </div>
  );
};
