/**
 * SocialFeature.tsx — aba SOCIAL (conteúdo placeholder de `Ligas.html`)
 *
 * Port da página de referência `Ligas.html` (mock "Tetris Royale") para a
 * seção Social do app, mantendo a MESMA estrutura: header com stats, 3
 * sub-abas (Liga / Amigos / Guilda), banner de temporada, Caminho das Ligas,
 * ranking com filtros, grid de amigos, guilda com chat/membros/doações/guerra
 * e os 3 modais (duelo, adicionar amigo, perfil).
 *
 * Adaptações deliberadas (pedido do usuário, 2026-10-08):
 *  - Tipografia: Rajdhani + escala/tokens do app (títulos em caixa alta com
 *    letter-spacing, cores via var(--*) — nada de system-ui nem hex solto);
 *  - Ícones: todos os emojis do mockup (🏆👥🛡️⚔️🎁…) substituídos por SVG
 *    stroke inline (`social-icons.tsx`, regra do `Diretrizes/Ícones.md`);
 *  - Background: superfícies glass TRANSLÚCIDAS por cima do fundo dinâmico
 *    da arena — o `cr-bg-container` continua visível atrás da aba (o mockup
 *    usava body/card opaco, aqui nada é opaco);
 *  - Textos do "Tetris Royale" renomeados para o vocabulário do app.
 *
 * PLACEHOLDER: abas, filtros, modais, chat e resgates rodam em estado local
 * (sem persistência). As funcionalidades reais (convites, ranking global,
 * doações persistentes, chat online) virão numa fase futura.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { showToast } from '@/lib/toast';
import {
  CHAT_MESSAGES,
  DONATIONS,
  DUEL_MODES,
  FRIENDS,
  GUILD_MEMBERS,
  LEADERBOARD,
  PLAYER_STATS,
  PLAYER_TAG,
  RACE_ROWS,
  TROPHY_STEPS,
  type ChatMessage,
  type DonationRequest,
  type GuildTab,
  type LeaderboardFilter,
  type SocialTab,
  type StepIcon,
} from './social-data';
import {
  BoxIcon,
  CheckIcon,
  CoinsIcon,
  CrownIcon,
  EyeIcon,
  GemIcon,
  GiftIcon,
  InfoIcon,
  LockIcon,
  MapPinIcon,
  PackageIcon,
  PlusIcon,
  SendIcon,
  ShieldIcon,
  SwordsIcon,
  TrophyIcon,
  UsersIcon,
  XIcon,
  ZapIcon,
} from './social-icons';
import './social.css';

type ModalKind = 'duel' | 'addFriend' | 'profile';

interface ProfileInfo {
  name: string;
  trophies: number;
  clan: string;
}

const FILTERS: { key: LeaderboardFilter; label: string }[] = [
  { key: 'global', label: 'Global' },
  { key: 'local', label: 'Brasil' },
  { key: 'amigos', label: 'Amigos' },
];

const GUILD_TABS: { key: GuildTab; label: string }[] = [
  { key: 'chat', label: 'Bate-papo & Treinos' },
  { key: 'membros', label: 'Membros (48)' },
  { key: 'doacoes', label: 'Doação de Itens' },
  { key: 'guerra', label: 'Guerra Semanal' },
];

const fmt = (n: number) => n.toLocaleString('pt-BR');

/** Ícone do passo do Caminho das Ligas. */
function StepIconGlyph({ icon, size = 18 }: { icon: StepIcon; size?: number }) {
  if (icon === 'crown') return <CrownIcon size={size} />;
  if (icon === 'gem') return <GemIcon size={size} />;
  return <BoxIcon size={size} />;
}

export function SocialFeature() {
  /* ── Estado de navegação (mockup: switchTab / switchGuildTab / setLeaderboardFilter) ── */
  const [tab, setTab] = useState<SocialTab>('liga');
  const [guildTab, setGuildTab] = useState<GuildTab>('chat');
  const [filter, setFilter] = useState<LeaderboardFilter>('global');

  /* ── Estado demonstrativo local (sem persistência — placeholder) ── */
  const [stats, setStats] = useState(PLAYER_STATS);
  const [claimed, setClaimed] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_MESSAGES);
  const [draft, setDraft] = useState('');
  const [donations, setDonations] = useState<DonationRequest[]>(DONATIONS);

  /* ── Modais (mockup: duelModal / addFriendModal / profileModal) ── */
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [duelTarget, setDuelTarget] = useState('amigo');
  const [duelMode, setDuelMode] = useState('classic');
  const [friendTag, setFriendTag] = useState('');
  const [profile, setProfile] = useState<ProfileInfo | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);

  /* Auto-scroll do chat ao enviar (mockup: container.scrollTop = scrollHeight) */
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  /* ESC fecha o modal aberto */
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setModal(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modal]);

  /* Toast de placeholder: ação real ainda não implementada */
  const soon = (label: string) => showToast(`${label} — funcionalidade em breve!`, 'info');

  /* ── Liga: bônus diário e resgates do Caminho (mockup L1429–1445) ── */
  const claimSeasonBonus = () => {
    setStats((s) => ({ ...s, gold: s.gold + 500 }));
    showToast('Bônus diário resgatado: +500 de Ouro!', 'success');
  };

  const claimMilestone = (id: string) => {
    setClaimed((c) => [...c, id]);
    setStats((s) => ({ ...s, gold: s.gold + 1000, xp: s.xp + 20 }));
    showToast('Recompensa do Caminho das Ligas resgatada!', 'success');
  };

  /* ── Amigos ── */
  const openDuel = (name: string) => {
    setDuelTarget(name);
    setModal('duel');
  };
  const confirmDuel = () => {
    setModal(null);
    soon('Convite de duelo');
  };
  const spectate = (name: string) => soon(`Assistir ao treino de ${name}`);
  const giftAllFriends = () => soon('Presentear todos os amigos');
  const submitAddFriend = () => {
    if (!friendTag.trim()) return;
    setModal(null);
    soon('Pedido de amizade');
  };
  const inspect = (name: string, trophies: number, clan: string) => {
    setProfile({ name, trophies, clan });
    setModal('profile');
  };

  /* ── Guilda: chat local + doações locais ── */
  const sendChat = () => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setMessages((m) => [...m, { author: 'Você', role: 'Colíder', text, time, mine: true }]);
    setDraft('');
  };

  const donate = (id: number) => {
    setDonations((list) =>
      list.map((d) => (d.id === id && d.count < d.max ? { ...d, count: d.count + 1 } : d))
    );
    setStats((s) => ({ ...s, gold: s.gold + 50, xp: s.xp + 5 }));
    showToast('Item doado: +50 de Ouro e +5 XP!', 'success');
  };

  return (
    <div className="treino-container soc-root">
      <div id="section-social" className="main-section soc" role="tabpanel" aria-label="Social">
        {/* ===== Top header (mockup: .top-header) ===== */}
        <header className="soc-header">
          <div className="soc-brand">
            <TrophyIcon size={22} className="soc-brand__icon" />
            <span className="soc-brand__name">Academia Royale</span>
            <span className="soc-badge">Ligas</span>
          </div>
          <div className="soc-stats">
            <div className="soc-pill soc-pill--trophies" title="Seus Troféus">
              <TrophyIcon size={14} />
              <span>{fmt(stats.trophies)}</span>
            </div>
            <div className="soc-pill soc-pill--gold" title="Ouro">
              <CoinsIcon size={14} />
              <span>{fmt(stats.gold)}</span>
            </div>
            <div className="soc-pill soc-pill--xp" title="XP">
              <ZapIcon size={14} />
              <span>{fmt(stats.xp)}</span>
            </div>
          </div>
        </header>

        {/* ===== Sub-abas: Liga / Amigos / Guilda (mockup: .nav-tabs) ===== */}
        <nav className="soc-tabs" role="tablist" aria-label="Seções do social">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'liga'}
            className={`soc-tab${tab === 'liga' ? ' soc-tab--active' : ''}`}
            onClick={() => setTab('liga')}
          >
            <TrophyIcon size={16} />
            <span>Liga</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'amigos'}
            className={`soc-tab${tab === 'amigos' ? ' soc-tab--active' : ''}`}
            onClick={() => setTab('amigos')}
          >
            <UsersIcon size={16} />
            <span>Amigos</span>
            <span className="soc-tab__count">
              {FRIENDS.filter((f) => f.status === 'online').length} online
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'guilda'}
            className={`soc-tab${tab === 'guilda' ? ' soc-tab--active' : ''}`}
            onClick={() => setTab('guilda')}
          >
            <ShieldIcon size={16} />
            <span>Guilda</span>
            <span className="soc-tab__count">48/50</span>
          </button>
        </nav>

        {/* ============================================================
            SUB-ABA 1: LIGA
           ============================================================ */}
        {tab === 'liga' && (
          <div className="soc-panel" role="tabpanel">
            {/* Banner da temporada (mockup: .banner-hero) */}
            <div className="soc-hero">
              <div className="soc-hero__info">
                <h2 className="soc-hero__title">Temporada 14: Forja de Titãs</h2>
                <div className="soc-hero__meta">
                  <span>
                    Termina em:{' '}
                    <strong className="soc-hero__countdown">12d 16h 44m 20s</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Liga Atual: <strong className="soc-hero__league">Santuário de Diamante II</strong>
                  </span>
                </div>
              </div>
              <button type="button" className="soc-btn" onClick={claimSeasonBonus}>
                <GiftIcon size={16} />
                Resgatar Bônus Diário
              </button>
            </div>

            <div className="soc-grid">
              {/* Caminho das Ligas (mockup: .trophy-road-card) */}
              <section className="soc-card">
                <div className="soc-card__title">
                  <span>Caminho das Ligas</span>
                  <span className="soc-card__hint">Próxima recompensa em 80 troféus</span>
                </div>
                <div className="soc-road">
                  {TROPHY_STEPS.map((step) => {
                    const isClaimed = claimed.includes(step.id);
                    const canClaim = step.reached && !isClaimed;
                    const isCurrent =
                      step.trophies <= stats.trophies && step.trophies + 500 > stats.trophies;
                    return (
                      <div
                        key={step.id}
                        className={[
                          'soc-step',
                          isCurrent ? 'soc-step--current' : '',
                          !step.reached ? 'soc-step--locked' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <div className="soc-step__trophies">
                          <TrophyIcon size={13} />
                          {fmt(step.trophies)}
                        </div>
                        <div className="soc-step__badge">
                          <StepIconGlyph icon={step.icon} />
                        </div>
                        <div className="soc-step__info">
                          <div className="soc-step__name">{step.name}</div>
                          <div className="soc-step__reward">{step.reward}</div>
                        </div>
                        {canClaim ? (
                          <button
                            type="button"
                            className="soc-claim"
                            onClick={() => claimMilestone(step.id)}
                          >
                            Resgatar
                          </button>
                        ) : isClaimed ? (
                          <span className="soc-claim soc-claim--done">
                            <CheckIcon size={12} />
                            Resgatado
                          </span>
                        ) : (
                          <span className="soc-step__locked-label">
                            <LockIcon size={12} />
                            Bloqueado
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Classificação (mockup: .leaderboard-card) */}
              <section className="soc-card">
                <div className="soc-card__title">
                  <span>Classificação</span>
                  <span className="soc-card__hint soc-card__hint--gold">Top Mundial</span>
                </div>
                <div className="soc-filters">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={`soc-filter${filter === f.key ? ' soc-filter--active' : ''}`}
                      onClick={() => setFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="soc-rank-list">
                  {LEADERBOARD[filter].map((item) => (
                    <button
                      key={`${filter}-${item.rank}`}
                      type="button"
                      className={`soc-rank${item.isMe ? ' soc-rank--me' : ''}`}
                      onClick={() => inspect(item.name, item.trophies, item.clan)}
                    >
                      <span className={`soc-rank__num soc-rank__num--${item.rank}`}>
                        #{item.rank}
                      </span>
                      <span className="soc-avatar">{item.initials}</span>
                      <span className="soc-rank__details">
                        <span className="soc-rank__name">{item.name}</span>
                        <span className="soc-rank__clan">{item.clan}</span>
                      </span>
                      <span className="soc-rank__trophies">
                        <TrophyIcon size={13} />
                        {fmt(item.trophies)}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ============================================================
            SUB-ABA 2: AMIGOS
           ============================================================ */}
        {tab === 'amigos' && (
          <div className="soc-panel" role="tabpanel">
            <div className="soc-friends-head">
              <div>
                <h2 className="soc-friends__title">Lista de Amizades (18/50)</h2>
                <p className="soc-friends__sub">
                  Desafie amigos para partidas 1v1 ou envie presentes diários.
                </p>
              </div>
              <div className="soc-friends__actions">
                <button
                  type="button"
                  className="soc-btn soc-btn--ghost"
                  onClick={() => setModal('addFriend')}
                >
                  <PlusIcon size={14} />
                  Adicionar Amigo
                </button>
                <button type="button" className="soc-btn" onClick={giftAllFriends}>
                  <GiftIcon size={14} />
                  Presentear Todos (+200 XP)
                </button>
              </div>
            </div>

            <div className="soc-friends">
              {FRIENDS.map((f) => (
                <article className="soc-friend" key={f.id}>
                  <div className="soc-friend__top">
                    <div className="soc-avatar-wrap">
                      <div className="soc-avatar soc-avatar--lg">{f.initials}</div>
                      <span
                        className={`soc-status soc-status--${f.status}`}
                        aria-label={
                          f.status === 'online'
                            ? 'Online'
                            : f.status === 'battle'
                              ? 'Em treino'
                              : 'Offline'
                        }
                      />
                    </div>
                    <div className="soc-friend__info">
                      <div className="soc-friend__name">{f.name}</div>
                      <div className="soc-friend__meta">
                        <span className="soc-friend__trophies">
                          <TrophyIcon size={12} />
                          {fmt(f.trophies)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{f.statusText}</span>
                      </div>
                    </div>
                  </div>
                  <div className="soc-friend__bottom">
                    <button
                      type="button"
                      className="soc-btn soc-btn--duel"
                      onClick={() => openDuel(f.name)}
                    >
                      <SwordsIcon size={14} />
                      Desafiar
                    </button>
                    {f.status === 'battle' ? (
                      <button
                        type="button"
                        className="soc-btn soc-btn--spectate"
                        onClick={() => spectate(f.name)}
                      >
                        <EyeIcon size={14} />
                        Assistir
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="soc-btn soc-btn--ghost"
                        onClick={() => inspect(f.name, f.trophies, 'Amigos')}
                      >
                        Perfil
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
            SUB-ABA 3: GUILDA
           ============================================================ */}
        {tab === 'guilda' && (
          <div className="soc-panel" role="tabpanel">
            {/* Cabeçalho da guilda (mockup: .guild-header) */}
            <div className="soc-guild">
              <div className="soc-guild__crest">
                <ShieldIcon size={34} />
              </div>
              <div className="soc-guild__details">
                <div className="soc-guild__name">
                  Academia Masters BR
                  <span className="soc-badge soc-badge--purple">Nível 12</span>
                </div>
                <p className="soc-guild__desc">
                  Clã competitivo focado na Guerra de Academias semanal e trocas de dicas de
                  treino! Entre no Discord para treinos 2v2 e campeonatos internos.
                </p>
                <div className="soc-guild__tags">
                  <span>
                    <TrophyIcon size={13} /> Troféus do Clã: <strong>48.950</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <UsersIcon size={13} /> Membros: <strong>48/50</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <MapPinIcon size={13} /> Região: <strong>Brasil</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <ShieldIcon size={13} /> Tipo: <strong>Aberto (+4.000 troféus)</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="soc-btn soc-btn--ghost"
                onClick={() => inspect('Academia Masters BR', 48950, 'Região Brasil · 48 Membros')}
              >
                <InfoIcon size={14} />
                Detalhes
              </button>
            </div>

            {/* Pílulas de navegação da guilda (mockup: .guild-nav-pills) */}
            <div className="soc-guild-tabs" role="tablist" aria-label="Seções da guilda">
              {GUILD_TABS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  role="tab"
                  aria-selected={guildTab === g.key}
                  className={`soc-guild-tab${guildTab === g.key ? ' soc-guild-tab--active' : ''}`}
                  onClick={() => setGuildTab(g.key)}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* ---- Guilda: Bate-papo ---- */}
            {guildTab === 'chat' && (
              <div className="soc-chat">
                <div className="soc-chat__msgs" ref={chatRef}>
                  {messages.map((m, i) => (
                    <div className={`soc-msg${m.mine ? ' soc-msg--mine' : ''}`} key={`${m.time}-${i}`}>
                      <div className="soc-msg__author">
                        <span>{m.author}</span>
                        <span className="soc-role">{m.role}</span>
                        <span className="soc-msg__time">{m.time}</span>
                      </div>
                      <div className="soc-msg__text">{m.text}</div>
                    </div>
                  ))}
                </div>
                <div className="soc-chat__bar">
                  <input
                    className="soc-input"
                    type="text"
                    placeholder="Mensagem para o clã..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') sendChat();
                    }}
                    aria-label="Mensagem para o clã"
                  />
                  <button type="button" className="soc-btn" onClick={sendChat}>
                    <SendIcon size={14} />
                    Enviar
                  </button>
                </div>
              </div>
            )}

            {/* ---- Guilda: Membros ---- */}
            {guildTab === 'membros' && (
              <section className="soc-card">
                <div className="soc-card__title">
                  <span>Membros</span>
                  <span className="soc-card__hint">48 / 50</span>
                </div>
                <div className="soc-road">
                  {GUILD_MEMBERS.map((m) => (
                    <div
                      className={`soc-step${m.isMe ? ' soc-step--current' : ''}`}
                      key={m.name}
                    >
                      <div className="soc-step__badge">{m.initials}</div>
                      <div className="soc-step__info">
                        <div className="soc-step__name">
                          {m.name}
                          <span className="soc-role">{m.role}</span>
                        </div>
                        <div className="soc-step__reward">
                          Doações na semana: <strong>{m.donations}</strong> itens
                        </div>
                      </div>
                      <div className="soc-step__trophies soc-step__trophies--auto">
                        <TrophyIcon size={13} />
                        {fmt(m.trophies)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ---- Guilda: Doações ---- */}
            {guildTab === 'doacoes' && (
              <section className="soc-card">
                <div className="soc-card__title">
                  <span>Pedidos de Itens Ativos</span>
                  <button
                    type="button"
                    className="soc-btn soc-btn--sm"
                    onClick={() => soon('Pedido de item')}
                  >
                    <PackageIcon size={13} />
                    Pedir Item
                  </button>
                </div>
                <div className="soc-road">
                  {donations.map((d) => (
                    <div className="soc-step" key={d.id}>
                      <div className="soc-step__badge">
                        <PackageIcon size={18} />
                      </div>
                      <div className="soc-step__info">
                        <div className="soc-step__name">{d.member} pede</div>
                        <div className="soc-step__reward">
                          <strong>{d.item}</strong> — {d.count} / {d.max} doados
                        </div>
                      </div>
                      <button type="button" className="soc-claim" onClick={() => donate(d.id)}>
                        Doar (+5 XP)
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ---- Guilda: Guerra Semanal (mockup: .clan-war-panel) ---- */}
            {guildTab === 'guerra' && (
              <section className="soc-card">
                <div className="soc-card__title">
                  <span>Guerra de Academias — Dia 3 de 5</span>
                  <span className="soc-card__hint soc-card__hint--gold">
                    Premiação: Baú Lendário
                  </span>
                </div>
                <p className="soc-war__lead">
                  Registre treinos para empurrar a equipe da guilda e derrotar as academias
                  adversárias!
                </p>
                <div className="soc-race">
                  {RACE_ROWS.map((row) => (
                    <div className="soc-race__row" key={row.label}>
                      <div className="soc-race__header">
                        <span className={row.mine ? 'soc-race__team soc-race__team--mine' : 'soc-race__team'}>
                          {row.label}
                        </span>
                        <span className="soc-race__points">{row.points}</span>
                      </div>
                      <div className="soc-race__bar">
                        <div
                          className={`soc-race__fill${row.mine ? ' soc-race__fill--mine' : ''}`}
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="soc-war__actions">
                  <button type="button" className="soc-btn" onClick={() => soon('Batalha da Guerra')}>
                    <SwordsIcon size={16} />
                    Entrar na Batalha da Guerra (+800 pts)
                  </button>
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* ================================================================
          MODAIS (mockup: duelModal / addFriendModal / profileModal)
          Portal para document.body: o .section-strip tem transform
          (translateX da navegação de seções) e viraria o containing
          block do position:fixed do .modal-overlay — o modal sairia da
          viewport (medido: left 855 px numa tela de 430 px). Fora do
          strip ele fica fixo na tela, como no legado.
         ================================================================ */}
      {createPortal(
        <>
      {modal === 'duel' && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Desafio amistoso"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="soc-modal">
            <button
              type="button"
              className="soc-modal__close"
              onClick={() => setModal(null)}
              aria-label="Fechar"
            >
              <XIcon size={18} />
            </button>
            <div className="soc-modal__title">
              <SwordsIcon size={18} />
              Desafio Amistoso 1v1
            </div>
            <p className="soc-modal__text">
              Convidando <strong>{duelTarget}</strong> para uma partida!
            </p>
            <label className="soc-modal__label" htmlFor="socDuelMode">
              Modo de Duelo:
            </label>
            <select
              id="socDuelMode"
              className="soc-select"
              value={duelMode}
              onChange={(e) => setDuelMode(e.target.value)}
            >
              {DUEL_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <div className="soc-modal__actions">
              <button type="button" className="soc-btn soc-btn--ghost" onClick={() => setModal(null)}>
                Cancelar
              </button>
              <button type="button" className="soc-btn" onClick={confirmDuel}>
                Enviar Convite
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'addFriend' && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Adicionar amigo"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="soc-modal">
            <button
              type="button"
              className="soc-modal__close"
              onClick={() => setModal(null)}
              aria-label="Fechar"
            >
              <XIcon size={18} />
            </button>
            <div className="soc-modal__title">
              <PlusIcon size={18} />
              Adicionar Novo Amigo
            </div>
            <p className="soc-modal__text">
              Digite a Tag do atleta (ex: <code>#8V99PL2</code>) ou compartilhe seu código de
              convite.
            </p>
            <div className="soc-modal__row">
              <input
                className="soc-input"
                type="text"
                placeholder="#TAG-DO-ATLETA"
                value={friendTag}
                onChange={(e) => setFriendTag(e.target.value)}
                aria-label="Tag do atleta"
              />
              <button type="button" className="soc-btn" onClick={submitAddFriend}>
                Buscar
              </button>
            </div>
            <div className="soc-modal__tag">
              Sua Tag Pessoal: <strong>{PLAYER_TAG}</strong>
            </div>
          </div>
        </div>
      )}

      {modal === 'profile' && profile && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Perfil de ${profile.name}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="soc-modal">
            <button
              type="button"
              className="soc-modal__close"
              onClick={() => setModal(null)}
              aria-label="Fechar"
            >
              <XIcon size={18} />
            </button>
            <div className="soc-modal__title">
              <CrownIcon size={18} />
              {profile.name}
            </div>
            <div className="soc-modal__summary">
              <div>
                Guilda: <strong>{profile.clan}</strong>
              </div>
              <div>
                Troféus Atuais: <strong className="soc-gold">{fmt(profile.trophies)} troféus</strong>
              </div>
              <div>
                Maior Pontuação: <strong>{fmt(profile.trophies + 280)} troféus</strong>
              </div>
            </div>
            <div className="soc-modal__stats">
              <div>
                Vitórias 1v1: <strong>1.284</strong>
              </div>
              <div>
                Séries Concluídas: <strong>3.420</strong>
              </div>
              <div>
                Taxa de Vitória: <strong>68,4%</strong>
              </div>
              <div>
                Guerra de Academias: <strong>94 vitórias</strong>
              </div>
            </div>
          </div>
        </div>
      )}
        </>,
        document.body,
      )}
    </div>
  );
}

export default SocialFeature;
