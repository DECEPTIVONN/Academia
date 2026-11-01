/**
 * PlayerProfileModal.tsx — perfil do jogador no estilo Clash Royale (aba Social)
 *
 * Layout da referência (banner com avatar/nome/tag/nível/troféus/status +
 * emblemas → guilda → treinos/ofensiva → troféus → emblemas → ligas → último
 * treino → estatísticas)
 * com as cores do site: painéis escuros glass, acento `--primary` e o banner
 * do próprio perfil (`profile-banner[data-banner]`).
 *
 * Monta via `createPortal(document.body)` (o `.section-strip` é containing
 * block do position: fixed). Os números vêm de `player-profile-data.ts`.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Crown, Flame, Trophy, X } from 'lucide-react';
import { FichaDeck } from '@/features/dashboard/FichaDeck';
import { IDENTITY_EMBLEMS } from '@/features/profile/profile-data';
import { useProfileState } from '@/features/profile/useProfileState';
import { useLocalData } from '@/hooks/useLocalData';
import type { LocalData } from '@/core/db/queries';
import { FlagIcon } from './ligas-icons';
import { PlayerAvatarMedia } from './PlayerAvatar';
import {
  buildPlayerProfile,
  selfPlayerSummary,
  type PlayerProfileView,
  type PlayerSummaryInput,
} from './player-profile-data';
import './player-profile.css';

const NUM = (value: number) => Math.round(value).toLocaleString('pt-BR');

function decimal(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}

function SectionHead({ title }: { title: string }) {
  return (
    <div className="player-profile__section-head">
      <span className="player-profile__head-line" aria-hidden="true" />
      <Crown size={14} className="player-profile__head-crown" aria-hidden="true" />
      <span className="player-profile__head-line" aria-hidden="true" />
      <h3 className="player-profile__section-title">{title}</h3>
    </div>
  );
}

function Avatar({ view }: { view: PlayerProfileView }) {
  return (
    <div className="player-profile__avatar" data-frame={view.avatarFrame || ''}>
      <PlayerAvatarMedia
        photo={view.photo}
        emblemId={view.avatarEmblemId}
        glyph={view.glyph}
        size={68}
      />
    </div>
  );
}

export interface PlayerProfileModalProps {
  player: PlayerSummaryInput;
  onClose: () => void;
}

export function PlayerProfileModal({ player, onClose }: PlayerProfileModalProps) {
  const local = useLocalData();
  const { state: profileState } = useProfileState();
  const [closing, setClosing] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const data = useMemo<LocalData>(
    () => ({
      exercises: local.exercises,
      sheets: local.sheets,
      history: local.history,
      legacy: local.legacy,
    }),
    [local.exercises, local.sheets, local.history, local.legacy],
  );

  const view = useMemo(
    () => buildPlayerProfile(player, data, profileState),
    [player, data, profileState],
  );

  const close = () => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, 200);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing]);

  /* v4.56.14 — o timer de SAÍDA vive fora do efeito acima: com `closing` nas
     dependências, a limpeza do efeito cancelava o próprio `setTimeout` de
     200ms e o modal ficava preso em `.is-closing` (nunca desmontava). */
  useEffect(
    () => () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const badgeEmblems = view.emblems.slice(0, 3);
  const emblemSlots = Array.from({ length: 8 }, (_, index) => view.emblems[index] ?? null);
  const lastWorkout = view.lastWorkout;
  /* Ficha do último treino (define o aeróbico mostrado no rodapé do deck). */
  const lastWorkoutSheet = useMemo(
    () =>
      lastWorkout
        ? local.sheets.find((sheet) => sheet.sheetKey === lastWorkout.sheetKey)
        : undefined,
    [lastWorkout, local.sheets],
  );

  return createPortal(
    <div
      className={`player-profile${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Perfil de ${view.name}`}
      onClick={close}
    >
      <div className="player-profile__panel" onClick={(event) => event.stopPropagation()}>
        <div className="player-profile__topbar">
          <span className="player-profile__topbar-gem" aria-hidden="true">
            <Crown size={16} />
          </span>
          <span className="player-profile__topbar-title">Perfil</span>
          <button type="button" className="player-profile__close" onClick={close} aria-label="Fechar perfil">
            <X size={16} />
          </button>
        </div>

        <div className="player-profile__scroll">
          <div className="player-profile__header">
            <div className="profile-banner player-profile__banner" data-banner={view.banner}>
              <div className="player-profile__hero">
                <Avatar view={view} />
                <div className="player-profile__ident">
                  <h2 className="player-profile__name">{view.name}</h2>
                  <span className="player-profile__tag">{view.tag}</span>
                  <span className="player-profile__meta">
                    <FlagIcon flag={view.flag} size={12} />
                    <span>Nível {view.level}</span>
                    {view.online && (
                      <span className="player-profile__online">
                        <span className="player-profile__online-dot" aria-hidden="true" />
                        On-line
                      </span>
                    )}
                  </span>
                </div>
                <span className="player-profile__trophy-pill">
                  <Trophy size={16} />
                  {NUM(view.monthlyXp)}
                </span>
              </div>
            </div>
            {badgeEmblems.length > 0 && (
              <div className="player-profile__badges">
                {badgeEmblems.map((emblem) => (
                  <span className="player-profile__badge" key={emblem.id} title={emblem.nome}>
                    <span className="player-profile__emblem-icon" aria-hidden="true">
                      {emblem.icon}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="player-profile__duo">
            <div className="player-profile__duo-card">
              <span className="player-profile__duo-label">XP no mês</span>
              <strong className="player-profile__duo-value">{NUM(view.monthlyXp)}</strong>
            </div>
            <div className="player-profile__duo-card">
              <Flame size={16} className="player-profile__duo-icon" aria-hidden="true" />
              <span className="player-profile__duo-label">Ofensiva</span>
              <strong className="player-profile__duo-value">
                {view.streak} {view.streak === 1 ? 'dia' : 'dias'}
              </strong>
            </div>
          </div>

          <section className="player-profile__section player-profile__section--trophies">
            <SectionHead title="Progresso" />
            <div className="player-profile__trophy-row">
              <span className="player-profile__trophy-big" aria-hidden="true">
                <Trophy size={26} />
              </span>
              <strong className="player-profile__trophy-value">{NUM(view.trophies)}</strong>
              <span className="player-profile__arena">XP total</span>
            </div>
          </section>

          {view.emblems.length > 0 && (
          <section className="player-profile__section">
            <SectionHead title="Emblemas" />
            <div className="player-profile__emblem-grid">
              {emblemSlots.map((emblem, index) =>
                emblem ? (
                  <span className="player-profile__emblem" key={`${emblem.id}-${index}`} title={emblem.nome}>
                    <span className="player-profile__emblem-icon" aria-hidden="true">
                      {emblem.icon}
                    </span>
                  </span>
                ) : (
                  <span
                    className="player-profile__emblem player-profile__emblem--empty"
                    key={`empty-${index}`}
                    aria-hidden="true"
                  />
                ),
              )}
            </div>
            <button
              type="button"
              className="player-profile__collection-btn"
              onClick={() => setShowCollection((open) => !open)}
              aria-expanded={showCollection}
            >
              {showCollection ? 'Ocultar coleção' : 'Mostrar coleção'}
              <ChevronDown
                size={14}
                className={`player-profile__collection-chevron${showCollection ? ' is-open' : ''}`}
              />
            </button>
            {showCollection && (
              <div className="player-profile__collection">
                {IDENTITY_EMBLEMS.map((emblem) => (
                  <span className="player-profile__collection-item" key={emblem.id} title={emblem.nome}>
                    <PlayerAvatarMedia emblemId={emblem.id} size={42} />
                    <span className="player-profile__collection-name">{emblem.nome}</span>
                  </span>
                ))}
              </div>
            )}
          </section>
          )}

          <section className="player-profile__section player-profile__section--league">
            <SectionHead title="Ranking global" />
            <p className="player-profile__season">Temporada mensal</p>
            <div className="player-profile__league-current">
              <strong className="player-profile__league-name">
                {view.rank ? `#${view.rank}` : 'Fora do top 50'}
              </strong>
            </div>
            <p className="player-profile__league-hint">
              Posição pelo XP dos treinos concluídos no mês.
            </p>
          </section>

          {view.isSelf && (
          <section className="player-profile__section player-profile__section--workout">
            <SectionHead title="Último treino" />
            {lastWorkout ? (
              <>
                {/* v4.56.14 — mesmo deck Royale da prévia do Início (FichaDeck):
                    linha "TREINO A" + grid de 4 colunas + rodapé de métricas
                    (volume médio de carga · cardio). Só a etiqueta "FICHA DO
                    DIA" fica de fora, porque aqui é o ÚLTIMO treino. */}
                <div className="dash-arena-card dash-ficha-card player-profile__deck-block">
                  <FichaDeck
                    sheet={lastWorkoutSheet}
                    exercises={lastWorkout.exercises}
                    legacy={local.legacy}
                    showMaestria={false}
                    bodyRow="sheet"
                    showSheetTag={false}
                  />
                </div>
              </>
            ) : (
              <p className="player-profile__empty">Nenhum treino registrado ainda.</p>
            )}
          </section>
          )}

          {view.stats && (
          <section className="player-profile__section player-profile__section--stats">
            <SectionHead title="Estatísticas" />
            <div className="player-profile__stats">
              <div className="player-profile__stat">
                <span className="player-profile__stat-label">Treinos</span>
                <strong className="player-profile__stat-value">{NUM(view.stats?.workouts ?? 0)}</strong>
              </div>
              <div className="player-profile__stat">
                <span className="player-profile__stat-label">Total de horas treinadas</span>
                <strong className="player-profile__stat-value">{decimal(view.stats?.hours ?? 0)} h</strong>
              </div>
              <div className="player-profile__stat">
                <span className="player-profile__stat-label">Exercícios feitos</span>
                <strong className="player-profile__stat-value">
                  {NUM(view.stats?.exercisesDone ?? 0)}/{NUM(view.stats?.catalogSize ?? 0)}
                </strong>
              </div>
              <div className="player-profile__stat">
                <span className="player-profile__stat-label">Treino favorito atual</span>
                <strong className="player-profile__stat-value">
                  {view.stats?.favoriteWorkout ?? '—'}
                </strong>
              </div>
            </div>
          </section>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Atalho para o JOGADOR LOCAL: o banner do Início abre este perfil (v4.56.14)
 * em vez do hub de configurações. Resolve nome/XP/nível pelos dados do app.
 */
export function SelfPlayerProfileModal({ onClose }: { onClose: () => void }) {
  const local = useLocalData();
  const { state: profileState } = useProfileState();

  const data = useMemo<LocalData>(
    () => ({
      exercises: local.exercises,
      sheets: local.sheets,
      history: local.history,
      legacy: local.legacy,
    }),
    [local.exercises, local.sheets, local.history, local.legacy],
  );

  const player = useMemo(() => selfPlayerSummary(data, profileState), [data, profileState]);

  return <PlayerProfileModal player={player} onClose={onClose} />;
}
