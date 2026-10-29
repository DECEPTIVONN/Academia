/**
 * GuildPanel.tsx — sistema de guildas da aba Social
 *
 * Fluxo (inspirado nos clãs de Clash Royale, com a identidade visual do app):
 *  • sem guilda → estado vazio + barra "Procure ou forme uma nova guilda!";
 *  • busca → lista de guildas, pesquisa avançada e prévia da guilda (entrar);
 *  • criação → nome, emblema (os mesmos emblemas de identidade do site),
 *    descrição, tipo (Aberto/Fechado), troféus necessários e localização,
 *    no formato de linhas "rótulo à esquerda / controle à direita";
 *  • com guilda → o chat fica na sub-aba e o banner do cabeçalho (emblema,
 *    nome e membros) abre os detalhes em modal; a saída também é um modal.
 *
 * Não há doações semanais nem pontuação do clã (cada membro tem seus troféus).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Copy,
  Lock,
  LogOut,
  Search,
  Shield,
  SlidersHorizontal,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { IDENTITY_EMBLEMS } from '@/features/profile/profile-data';
import { showToast } from '@/lib/toast';
import { AvatarGlyph, FlagIcon } from './ligas-icons';
import { standaloneSound } from './ligas-data';
import {
  canJoinGuild,
  createGuild,
  DEFAULT_GUILD_FILTERS,
  filterGuilds,
  getGuild,
  GUILD_BLOCK_LABEL,
  GUILD_LOCATIONS,
  GUILD_MAX_MEMBERS,
  GUILD_TROPHY_STEPS,
  joinGuild,
  leaveGuild,
  useGuildState,
  type Guild,
  type GuildFilters,
  type GuildMember,
  type GuildPlayer,
  type GuildState,
  type GuildType,
} from './guild-data';
import './guild.css';

const NUM = (value: number) => value.toLocaleString('pt-BR');

/* ── Emblema (usa os emblemas de identidade já existentes no site) ── */

export function GuildEmblem({
  emblemId,
  size = 48,
  className,
}: {
  emblemId?: string | null;
  size?: number;
  className?: string;
}) {
  const emblem = IDENTITY_EMBLEMS.find((e) => e.id === emblemId) ?? IDENTITY_EMBLEMS[0];
  return (
    <span
      className={`guild-emblem${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {emblem?.url ? (
        <img src={emblem.url} alt="" draggable={false} loading="lazy" />
      ) : (
        <Shield size={Math.round(size * 0.5)} />
      )}
    </span>
  );
}

/* ── Peças pequenas ── */

function GuildTypeChip({ type }: { type: GuildType }) {
  const open = type === 'Aberto';
  return (
    <span className={`guild-chip guild-chip--${open ? 'open' : 'closed'}`}>
      {open ? <Shield size={10} /> : <Lock size={10} />}
      {type}
    </span>
  );
}

function MemberRow({ member, rank }: { member: GuildMember; rank: number }) {
  return (
    <li className={`guild-member${member.isSelf ? ' guild-member--self' : ''}`}>
      <span className="guild-member__rank">{rank}</span>
      <span className="guild-member__avatar">
        <AvatarGlyph glyph={member.glyph} size={16} />
      </span>
      <span className="guild-member__id">
        <span className="guild-member__name">{member.name}</span>
        <span className="guild-member__meta">
          <span
            className={`guild-member__role guild-member__role--${member.role === 'Líder' ? 'leader' : member.role === 'Ancião' ? 'elder' : 'member'}`}
          >
            {member.role}
          </span>
          <FlagIcon flag={member.flag} size={11} />
          <span>Nível {member.level}</span>
          {member.isSelf && <span className="guild-member__you">VOCÊ</span>}
        </span>
      </span>
      <span className="guild-member__trophies">
        <Trophy size={12} />
        {NUM(member.trophies)}
      </span>
    </li>
  );
}

function copyGuildTag(target: Guild) {
  const tag = `#${target.tag}`;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(tag).then(
      () => showToast(`Tag ${tag} copiada!`, 'success'),
      () => showToast('Não foi possível copiar a tag.', 'error'),
    );
  } else {
    showToast(`Tag da guilda: ${tag}`, 'info');
  }
}

/* ── Casca dos overlays (portal — o .section-strip é containing block) ── */

interface OverlayShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onBack?: () => void;
  footer?: React.ReactNode;
  nested?: boolean;
  dialog?: boolean;
  /** Clique no backdrop fecha o overlay. Padrão: true (só vale para `nested`). */
  backdropClose?: boolean;
  children: React.ReactNode;
}

function OverlayShell({
  title,
  subtitle,
  onClose,
  onBack,
  footer,
  nested,
  dialog,
  backdropClose = true,
  children,
}: OverlayShellProps) {
  return createPortal(
    <div
      className={`guild-overlay${nested ? ' guild-overlay--nested' : ''}${dialog ? ' guild-overlay--dialog' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={nested && backdropClose ? onClose : undefined}
    >
      <div className="guild-overlay__panel" onClick={(event) => event.stopPropagation()}>
        <div className="guild-overlay__head">
          {onBack ? (
            <button
              type="button"
              className="guild-overlay__icon-btn"
              onClick={onBack}
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <span className="guild-overlay__spacer" />
          )}
          <div className="guild-overlay__titles">
            <h2 className="guild-overlay__title">{title}</h2>
            {subtitle && <p className="guild-overlay__subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="guild-overlay__icon-btn guild-overlay__icon-btn--close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="guild-overlay__body">{children}</div>
        {footer && <div className="guild-overlay__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ── Seletor de valor (◀ valor ▶), como na referência dos clãs ── */

function GuildStepper({
  label,
  children,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
}: {
  label: string;
  children: React.ReactNode;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <div className="guild-step">
      <button
        type="button"
        className="guild-step__btn"
        aria-label={`${label}: opção anterior`}
        disabled={prevDisabled}
        onClick={() => {
          standaloneSound.playMove();
          onPrev();
        }}
      >
        <ChevronLeft size={16} />
      </button>
      <span className="guild-step__value">{children}</span>
      <button
        type="button"
        className="guild-step__btn"
        aria-label={`${label}: próxima opção`}
        disabled={nextDisabled}
        onClick={() => {
          standaloneSound.playMove();
          onNext();
        }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ── Selecionar emblema ── */

function GuildEmblemPicker({
  selected,
  onPick,
  onClose,
}: {
  selected: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <OverlayShell title="Selecionar emblema" nested onClose={onClose}>
      <div className="guild-emblem-grid">
        {IDENTITY_EMBLEMS.map((emblem) => (
          <button
            key={emblem.id}
            type="button"
            className={`guild-emblem-option${emblem.id === selected ? ' is-selected' : ''}`}
            onClick={() => {
              standaloneSound.playMove();
              onPick(emblem.id);
            }}
          >
            <GuildEmblem emblemId={emblem.id} size={62} />
            <span className="guild-emblem-option__name">{emblem.nome}</span>
          </button>
        ))}
      </div>
    </OverlayShell>
  );
}

/* ── Criar guilda ── */

function GuildCreate({
  player,
  onClose,
  onCreated,
}: {
  player: GuildPlayer;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emblemId, setEmblemId] = useState(IDENTITY_EMBLEMS[0]?.id ?? 'prestigio-1');
  const [type, setType] = useState<GuildType>('Aberto');
  const [requiredIndex, setRequiredIndex] = useState(0);
  const [location, setLocation] = useState(GUILD_LOCATIONS[0]);
  const [emblemOpen, setEmblemOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draft = {
    name,
    description,
    emblemId,
    type,
    requiredTrophies: GUILD_TROPHY_STEPS[requiredIndex],
    location,
  };
  const canSubmit = name.trim().length >= 2 && name.trim().length <= 20;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      if (emblemOpen) {
        setEmblemOpen(false);
        return;
      }
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [emblemOpen, onClose]);

  const handleSubmit = () => {
    const result = createGuild(draft, player);
    if (result.ok) {
      standaloneSound.playLevelUp();
      showToast('Guilda criada! Você é o líder.', 'success');
      setEmblemOpen(false);
      onCreated();
      return;
    }
    if (result.reason === 'exists') setError('Já existe uma guilda com esse nome. Escolha outro.');
    else if (result.reason === 'name') setError('O nome precisa ter entre 2 e 20 caracteres.');
    else if (result.reason === 'joined') setError('Você já faz parte de uma guilda.');
    else setError('Não foi possível criar a guilda agora. Tente novamente.');
  };

  return (
    <>
      <OverlayShell
        title="Crie a sua própria guilda"
        subtitle="Defina quem entra e lidere o time junto com os seus amigos."
        nested
        backdropClose={false}
        onClose={onClose}
        footer={
          <div className="guild-create__footer">
            {error && <p className="guild-create__error">{error}</p>}
            <button
              type="button"
              className="guild-btn guild-btn--primary guild-btn--wide"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              Criar guilda
            </button>
          </div>
        }
      >
        <div className="guild-form">
          <div className="guild-form__row">
            <label className="guild-form__label" htmlFor="guildName">
              Nome
            </label>
            <input
              id="guildName"
              type="text"
              className="guild-input"
              value={name}
              maxLength={20}
              placeholder="Nome da guilda"
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
            />
          </div>

          <div className="guild-form__row">
            <span className="guild-form__label">Emblema</span>
            <div className="guild-form__control guild-form__control--row">
              <GuildEmblem emblemId={emblemId} size={46} />
              <button
                type="button"
                className="guild-btn guild-btn--blue guild-btn--sm"
                onClick={() => {
                  standaloneSound.playMove();
                  setEmblemOpen(true);
                }}
              >
                Procurar
              </button>
            </div>
          </div>

          <div className="guild-form__row guild-form__row--top">
            <label className="guild-form__label" htmlFor="guildDescription">
              Descrição
            </label>
            <div className="guild-form__control">
              <textarea
                id="guildDescription"
                className="guild-input guild-textarea"
                value={description}
                maxLength={80}
                rows={3}
                placeholder="Conte como a sua guilda treina"
                onChange={(event) => setDescription(event.target.value)}
              />
              <span className="guild-form__hint">{description.length}/80</span>
            </div>
          </div>

          <div className="guild-form__row">
            <span className="guild-form__label">Tipo</span>
            <GuildStepper
              label="Tipo"
              onPrev={() => setType('Aberto')}
              onNext={() => setType('Fechado')}
              prevDisabled={type === 'Aberto'}
              nextDisabled={type === 'Fechado'}
            >
              {type === 'Aberto' ? <Shield size={12} /> : <Lock size={12} />}
              {type}
            </GuildStepper>
          </div>

          <div className="guild-form__row">
            <span className="guild-form__label">Troféus necessários</span>
            <GuildStepper
              label="Troféus necessários"
              onPrev={() => setRequiredIndex((index) => Math.max(0, index - 1))}
              onNext={() =>
                setRequiredIndex((index) => Math.min(GUILD_TROPHY_STEPS.length - 1, index + 1))
              }
              prevDisabled={requiredIndex === 0}
              nextDisabled={requiredIndex === GUILD_TROPHY_STEPS.length - 1}
            >
              <Trophy size={11} />
              {NUM(GUILD_TROPHY_STEPS[requiredIndex])}
            </GuildStepper>
          </div>

          <div className="guild-form__row">
            <label className="guild-form__label" htmlFor="guildLocation">
              Localização
            </label>
            <select
              id="guildLocation"
              className="guild-input guild-select"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            >
              {GUILD_LOCATIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </OverlayShell>

      {emblemOpen && (
        <GuildEmblemPicker
          selected={emblemId}
          onPick={(id) => {
            setEmblemId(id);
            setEmblemOpen(false);
          }}
          onClose={() => setEmblemOpen(false)}
        />
      )}
    </>
  );
}

/* ── Detalhes da guilda (modal aberto pelo banner do cabeçalho) ── */

function GuildDetail({
  guild,
  onClose,
  onLeave,
}: {
  guild: Guild;
  onClose: () => void;
  onLeave: () => void;
}) {
  const members = useMemo(
    () => [...guild.members].sort((a, b) => b.trophies - a.trophies),
    [guild.members],
  );

  return (
    <OverlayShell title="Guilda" onClose={onClose}>
      <div className="guild-detail">
        <div className="guild-detail__head">
          <GuildEmblem emblemId={guild.emblemId} size={72} />
          <div className="guild-detail__identity">
            <h3 className="guild-detail__name">{guild.name}</h3>
            <button
              type="button"
              className="guild-tag"
              onClick={() => copyGuildTag(guild)}
              title="Copiar tag da guilda"
            >
              #{guild.tag}
              <Copy size={11} />
            </button>
          </div>
        </div>

        <p className="guild-detail__desc">{guild.description || 'Sem descrição.'}</p>

        <div className="guild-stats">
          <div className="guild-stat">
            <span className="guild-stat__label">Localização</span>
            <span className="guild-stat__value">{guild.location}</span>
          </div>
          <div className="guild-stat">
            <span className="guild-stat__label">Troféus necessários</span>
            <span className="guild-stat__value">{NUM(guild.requiredTrophies)}</span>
          </div>
          <div className="guild-stat">
            <span className="guild-stat__label">Tipo</span>
            <span className="guild-stat__value">
              <GuildTypeChip type={guild.type} />
            </span>
          </div>
        </div>

        <div className="guild-members-head">
          <span className="guild-members-head__count">
            <Users size={14} />
            Membros {guild.members.length}/{GUILD_MAX_MEMBERS}
          </span>
          <button
            type="button"
            className="guild-leave"
            onClick={() => {
              standaloneSound.playMove();
              onLeave();
            }}
          >
            <LogOut size={13} />
            Sair
          </button>
        </div>

        <ul className="guild-members guild-members--detail">
          {members.map((member, index) => (
            <MemberRow key={member.id} member={member} rank={index + 1} />
          ))}
        </ul>
      </div>
    </OverlayShell>
  );
}

/* ── Confirmação de saída (modal pequeno, como na referência) ── */

function GuildLeaveDialog({
  guild,
  onClose,
  onConfirm,
}: {
  guild: Guild;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <OverlayShell
      title="Sair da guilda?"
      nested
      dialog
      onClose={onClose}
      footer={
        <div className="guild-confirm__actions">
          <button type="button" className="guild-btn guild-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="guild-btn guild-btn--danger"
            onClick={() => {
              standaloneSound.playMove();
              onConfirm();
            }}
          >
            Sair
          </button>
        </div>
      }
    >
      <p className="guild-confirm__question">Quer mesmo sair?</p>
      <p className="guild-confirm__text">
        Você vai sair de <strong>{guild.name}</strong>. Pode entrar em outra guilda quando quiser.
      </p>
    </OverlayShell>
  );
}

/* ── Pesquisa / prévia da guilda ── */

function GuildBrowser({
  player,
  state,
  onClose,
  onCreate,
  onJoined,
}: {
  player: GuildPlayer;
  state: GuildState;
  onClose: () => void;
  onCreate: () => void;
  onJoined: () => void;
}) {
  const [query, setQuery] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [filters, setFilters] = useState<GuildFilters>(DEFAULT_GUILD_FILTERS);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const preview = previewId ? state.guilds.find((guild) => guild.id === previewId) ?? null : null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      if (previewId) setPreviewId(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewId, onClose]);

  const results = useMemo(
    () => filterGuilds(state, query, filters, player),
    [state, query, filters, player],
  );

  if (preview) {
    const block = canJoinGuild(preview, state, player);
    const isMine = state.joinedId === preview.id;
    const members = [...preview.members].sort((a, b) => b.trophies - a.trophies);

    return (
      <OverlayShell
        title="Guilda"
        onClose={onClose}
        onBack={() => setPreviewId(null)}
        footer={
          <div className="guild-detail__footer">
            {!isMine && block && <p className="guild-detail__hint">{GUILD_BLOCK_LABEL[block]}</p>}
            {isMine ? (
              <button
                type="button"
                className="guild-btn guild-btn--danger guild-btn--wide"
                onClick={() => {
                  standaloneSound.playMove();
                  leaveGuild();
                  showToast(`Você saiu da guilda ${preview.name}.`, 'info');
                  onJoined();
                }}
              >
                <LogOut size={14} />
                Sair da guilda
              </button>
            ) : (
              <button
                type="button"
                className="guild-btn guild-btn--join guild-btn--wide"
                disabled={!!block}
                onClick={() => {
                  const result = joinGuild(preview.id, player);
                  if (result.ok) {
                    standaloneSound.playLevelUp();
                    showToast(`Você entrou na guilda ${preview.name}!`, 'success');
                    onJoined();
                  } else if (result.reason) {
                    showToast(GUILD_BLOCK_LABEL[result.reason], 'error');
                  }
                }}
              >
                Entrar
              </button>
            )}
          </div>
        }
      >
        <div className="guild-detail">
          <div className="guild-detail__head">
            <GuildEmblem emblemId={preview.emblemId} size={62} />
            <div className="guild-detail__identity">
              <h3 className="guild-detail__name">{preview.name}</h3>
              <span className="guild-tag guild-tag--static">#{preview.tag}</span>
            </div>
          </div>

          <p className="guild-detail__desc">{preview.description || 'Sem descrição.'}</p>

          <div className="guild-stats">
            <div className="guild-stat">
              <span className="guild-stat__label">Localização</span>
              <span className="guild-stat__value">{preview.location}</span>
            </div>
            <div className="guild-stat">
              <span className="guild-stat__label">Troféus necessários</span>
              <span className="guild-stat__value">{NUM(preview.requiredTrophies)}</span>
            </div>
            <div className="guild-stat">
              <span className="guild-stat__label">Tipo</span>
              <span className="guild-stat__value">
                <GuildTypeChip type={preview.type} />
              </span>
            </div>
          </div>

          <div className="guild-members-head">
            <span className="guild-members-head__count">
              <Users size={14} />
              Membros {preview.members.length}/{GUILD_MAX_MEMBERS}
            </span>
          </div>

          <ul className="guild-members guild-members--detail">
            {members.map((member, index) => (
              <MemberRow key={member.id} member={member} rank={index + 1} />
            ))}
          </ul>
        </div>
      </OverlayShell>
    );
  }

  return (
    <OverlayShell
      title="Pesquisa de guilda"
      onClose={onClose}
      footer={
        <button
          type="button"
          className="guild-btn guild-btn--primary guild-btn--wide"
          onClick={() => {
            standaloneSound.playMove();
            onCreate();
          }}
        >
          Criar novo
        </button>
      }
    >
      <div className="guild-search">
        <Search size={15} className="guild-search__icon" />
        <input
          type="search"
          className="guild-input guild-search__input"
          placeholder="Nome da guilda, tag da guilda..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar guilda"
        />
      </div>

      <button
        type="button"
        className={`guild-adv-btn${advanced ? ' is-active' : ''}`}
        onClick={() => {
          standaloneSound.playMove();
          setAdvanced((value) => !value);
        }}
      >
        <SlidersHorizontal size={14} />
        Pesquisa avançada
        <span className="guild-adv-btn__state">{advanced ? 'Ocultar' : 'Mostrar'}</span>
      </button>

      {advanced && (
        <div className="guild-adv">
          <div className="guild-filter-row">
            <span className="guild-filter-row__label">Membros</span>
            <div className="guild-stepper">
              <button
                type="button"
                className="guild-stepper__btn"
                aria-label="Diminuir mínimo de membros"
                onClick={() =>
                  setFilters((f) => ({ ...f, minMembers: Math.max(1, f.minMembers - 5) }))
                }
              >
                <ChevronLeft size={14} />
              </button>
              <span className="guild-stepper__value">
                {filters.minMembers}–{filters.maxMembers}
              </span>
              <button
                type="button"
                className="guild-stepper__btn"
                aria-label="Aumentar máximo de membros"
                onClick={() =>
                  setFilters((f) => ({ ...f, maxMembers: Math.min(50, f.maxMembers + 5) }))
                }
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="guild-filter-row">
            <span className="guild-filter-row__label">Máx. de troféus</span>
            <div className="guild-stepper">
              <button
                type="button"
                className="guild-stepper__btn"
                aria-label="Diminuir troféus necessários"
                onClick={() =>
                  setFilters((f) => {
                    const index = GUILD_TROPHY_STEPS.indexOf(f.maxRequired);
                    return { ...f, maxRequired: GUILD_TROPHY_STEPS[Math.max(0, index - 1)] ?? 0 };
                  })
                }
              >
                <ChevronLeft size={14} />
              </button>
              <span className="guild-stepper__value">{NUM(filters.maxRequired)}</span>
              <button
                type="button"
                className="guild-stepper__btn"
                aria-label="Aumentar troféus necessários"
                onClick={() =>
                  setFilters((f) => {
                    const index = GUILD_TROPHY_STEPS.indexOf(f.maxRequired);
                    return {
                      ...f,
                      maxRequired:
                        GUILD_TROPHY_STEPS[Math.min(GUILD_TROPHY_STEPS.length - 1, index + 1)],
                    };
                  })
                }
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="guild-filter-row">
            <span className="guild-filter-row__label">Tipo</span>
            <div className="guild-segment guild-segment--compact">
              {(['Todos', 'Aberto', 'Fechado'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`guild-segment__btn${filters.type === option ? ' is-active' : ''}`}
                  onClick={() => setFilters((f) => ({ ...f, type: option }))}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="guild-filter-row">
            <span className="guild-filter-row__label">Localização</span>
            <select
              className="guild-input guild-select guild-select--compact"
              value={filters.location}
              onChange={(event) => setFilters((f) => ({ ...f, location: event.target.value }))}
              aria-label="Localização da guilda"
            >
              <option value="Qualquer">Qualquer</option>
              {GUILD_LOCATIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="guild-filter-row">
            <span className="guild-filter-row__label">Apenas guildas que posso entrar</span>
            <button
              type="button"
              className={`guild-toggle${filters.joinableOnly ? ' is-on' : ''}`}
              onClick={() => setFilters((f) => ({ ...f, joinableOnly: !f.joinableOnly }))}
              aria-pressed={filters.joinableOnly}
            >
              {filters.joinableOnly ? 'Sim' : 'Não'}
            </button>
          </div>
        </div>
      )}

      <div className="guild-results">
        {results.length === 0 ? (
          <p className="guild-results__empty">
            Nenhuma guilda encontrada com esses filtros. Ajuste a busca ou crie a sua.
          </p>
        ) : (
          results.map((guild) => (
            <button
              key={guild.id}
              type="button"
              className="guild-row"
              onClick={() => {
                standaloneSound.playMove();
                setPreviewId(guild.id);
              }}
            >
              <GuildEmblem emblemId={guild.emblemId} size={40} />
              <span className="guild-row__main">
                <span className="guild-row__name">{guild.name}</span>
                <span className="guild-row__meta">
                  <GuildTypeChip type={guild.type} />
                  <span className="guild-chip">{guild.location}</span>
                </span>
              </span>
              <span className="guild-row__stats">
                <span className="guild-row__stat">
                  <Users size={12} />
                  {guild.members.length}/{GUILD_MAX_MEMBERS}
                </span>
                <span className="guild-row__stat" title="Troféus necessários">
                  <Trophy size={12} />
                  {NUM(guild.requiredTrophies)}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </OverlayShell>
  );
}

/* ── Painel da guilda (conteúdo da sub-aba Guilda) ── */

export function GuildPanel({
  player,
  chat,
  detailsOpen = false,
  onCloseDetails,
}: {
  player: GuildPlayer;
  chat?: React.ReactNode;
  detailsOpen?: boolean;
  onCloseDetails?: () => void;
}) {
  const state = useGuildState(player);
  const guild = getGuild(state);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const closeDetails = onCloseDetails ?? (() => {});

  const overlays = (
    <>
      {browserOpen && (
        <GuildBrowser
          player={player}
          state={state}
          onClose={() => setBrowserOpen(false)}
          onCreate={() => {
            setBrowserOpen(false);
            setCreateOpen(true);
          }}
          onJoined={() => setBrowserOpen(false)}
        />
      )}
      {createOpen && (
        <GuildCreate
          player={player}
          onClose={() => setCreateOpen(false)}
          onCreated={() => setCreateOpen(false)}
        />
      )}
      {guild && detailsOpen && (
        <GuildDetail
          guild={guild}
          onClose={closeDetails}
          onLeave={() => setLeaveOpen(true)}
        />
      )}
      {guild && leaveOpen && (
        <GuildLeaveDialog
          guild={guild}
          onClose={() => setLeaveOpen(false)}
          onConfirm={() => {
            leaveGuild();
            showToast(`Você saiu da guilda ${guild.name}.`, 'info');
            setLeaveOpen(false);
            closeDetails();
          }}
        />
      )}
    </>
  );

  if (!guild) {
    return (
      <div className="guild-panel">
        <div className="guild-empty">
          <span className="guild-empty__glow" aria-hidden="true" />
          <GuildEmblem size={104} />
          <h3 className="guild-empty__title">Guilda</h3>
          <p className="guild-empty__text">
            Entre em uma guilda para treinar junto, compartilhar fichas e disputar as ligas com o
            seu time!
          </p>
        </div>

        <button
          type="button"
          className="guild-cta-bar"
          onClick={() => {
            standaloneSound.playMove();
            setBrowserOpen(true);
          }}
        >
          <span className="guild-cta-bar__label">Procure ou forme uma nova guilda!</span>
          <span className="guild-cta-bar__cta">Mostrar</span>
        </button>

        {overlays}
      </div>
    );
  }

  return (
    <div className="guild-panel">
      {chat && <div className="guild-chat">{chat}</div>}
      {overlays}
    </div>
  );
}

export default GuildPanel;
