/**
 * RankingsOverlay.tsx — interface de Rankings do menu do Início
 *
 * Segue o desenho da interface de Liga (aba Social): título + ✕ no cabeçalho,
 * abas em pílula, banner "Modo Ranqueado" e linhas com posição / avatar / nome /
 * pontuação. As abas Global/Local da referência foram IGNORADAS (pedido do
 * usuário) — o ranking é único e exibido direto.
 *
 *  • Jogadores — maiores pontuações (placeholders + o jogador local com o XP
 *    real de treinos);
 *  • Clãs — ranking dos MEMBROS da guilda; sem guilda, mostra a mensagem
 *    pedindo para o usuário fazer parte de uma;
 *  • Amigos — ranking dos amigos; sem amigos, mensagem de estado vazio.
 *
 * Usa OverlayShell (mesmo visual dos overlays da aba Social) e monta via
 * portal — o .section-strip (will-change: transform) seria o containing block
 * do position: fixed.
 */

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Medal, Shield, Trophy, Users } from 'lucide-react';
import { OverlayShell } from './OverlayShell';
import { PlayerAvatarMedia } from './PlayerAvatar';
import { FlagIcon } from './ligas-icons';
import { INITIAL_FRIENDS, type AvatarGlyphKey, type FlagKey } from './ligas-data';
import { loadAddedFriends, mergeFriends } from './friend-invites';
import { getGuild, useGuildState, type GuildPlayer } from './guild-data';
import { useLocalData } from '@/hooks/useLocalData';
import { useProfileState } from '@/features/profile/useProfileState';
import { getLevel, getXp } from '@/core/db/queries';
import { useModalPresence } from '@/hooks/useModalPresence';
import './rankings.css';

type RankingTab = 'jogadores' | 'clas' | 'amigos';

interface RankRow {
  id: string;
  name: string;
  score: number;
  level: number;
  guild: string | null;
  glyph: AvatarGlyphKey;
  flag: FlagKey;
  photo?: string;
  emblemId?: string;
  isSelf?: boolean;
  /** Função na guilda (só na aba Clãs). */
  role?: string;
}

const TABS: { key: RankingTab; label: string }[] = [
  { key: 'jogadores', label: 'Jogadores' },
  { key: 'clas', label: 'Clãs' },
  { key: 'amigos', label: 'Amigos' },
];

/* Placeholders do ranking global de jogadores (pontuação fictícia). */
const PLACEHOLDER_PLAYERS: RankRow[] = [
  { id: 'top-1', name: 'Rafa Power', score: 3120, level: 34, guild: 'Academia Masters BR', glyph: 'lion', flag: 'BR', emblemId: 'estrela-honra' },
  { id: 'top-2', name: 'Marina Lifts', score: 2985, level: 31, guild: 'Iron Forge SP', glyph: 'moon', flag: 'BR', emblemId: 'lobo-alfa' },
  { id: 'top-3', name: 'Diego Bulk', score: 2874, level: 29, guild: 'Titan Fitness', glyph: 'flame', flag: 'AR', emblemId: 'escudo-aguia' },
  { id: 'top-4', name: 'Luiza Strong', score: 2741, level: 27, guild: 'Academia Prime', glyph: 'star', flag: 'BR', emblemId: 'prestigio-1' },
  { id: 'top-5', name: 'Thiago Heavy', score: 2658, level: 26, guild: 'Red Star Lift', glyph: 'bolt', flag: 'CL', emblemId: 'estrela-honra' },
  { id: 'top-6', name: 'Ana Progress', score: 2536, level: 24, guild: 'Nordic Kings', glyph: 'shield', flag: 'BR', emblemId: 'escudo-aguia' },
  { id: 'top-7', name: 'Vitor Core', score: 2410, level: 22, guild: null, glyph: 'sword', flag: 'MX', emblemId: 'lobo-alfa' },
  { id: 'top-8', name: 'Bia Volume', score: 2325, level: 21, guild: 'Academia Masters BR', glyph: 'gem', flag: 'BR', emblemId: 'prestigio-1' },
];

const rankTone = (rank: number) =>
  rank === 1 ? 'is-first' : rank === 2 ? 'is-second' : rank === 3 ? 'is-third' : '';

function RankRowView({ row, rank }: { row: RankRow; rank: number }) {
  return (
    <li className={`rk-row${row.isSelf ? ' is-self' : ''}`}>
      <span className={`rk-row__rank ${rankTone(rank)}`}>{rank}</span>
      <span className="rk-row__avatar">
        <PlayerAvatarMedia
          photo={row.photo}
          emblemId={row.emblemId}
          glyph={row.glyph}
          size={34}
        />
      </span>
      <span className="rk-row__body">
        <span className="rk-row__name">
          <span className="rk-row__name-text">{row.name}</span>
          <FlagIcon flag={row.flag} size={11} className="rk-row__flag" />
          {row.isSelf && <span className="rk-row__you">VOCÊ</span>}
        </span>
        <span className="rk-row__meta">
          {row.role
            ? `${row.role} · Nível ${row.level}`
            : `Nível ${row.level}${row.guild ? ` · ${row.guild}` : ' · Sem guilda'}`}
        </span>
      </span>
      <span className="rk-row__score">
        <Medal size={15} className="rk-row__medal" aria-hidden="true" />
        {row.score.toLocaleString('pt-BR')}
      </span>
    </li>
  );
}

interface RankingsOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function RankingsOverlay({ open, onClose }: RankingsOverlayProps) {
  const [tab, setTab] = useState<RankingTab>('jogadores');
  /* Direção do slide entre as sub-abas: 1 = próxima (entra pela direita),
     -1 = anterior (entra pela esquerda). */
  const [tabDir, setTabDir] = useState(1);
  const { mounted, closing } = useModalPresence(open);

  const selectTab = (next: RankingTab) => {
    if (next === tab) return;
    const from = TABS.findIndex((item) => item.key === tab);
    const to = TABS.findIndex((item) => item.key === next);
    setTabDir(to >= from ? 1 : -1);
    setTab(next);
  };

  const { history } = useLocalData();
  const { state: profileState } = useProfileState();

  /* Esc fecha + trava o scroll do body (padrão dos overlays do app). */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const displayName = profileState?.customization?.nome?.trim() || 'Atleta';
  const playerXp = useMemo(() => getXp(history), [history]);
  const playerLevel = useMemo(() => getLevel(playerXp), [playerXp]);

  const guildPlayer = useMemo<GuildPlayer>(
    () => ({
      name: displayName,
      trophies: playerXp,
      level: playerLevel,
      glyph: 'crown',
      flag: 'BR',
      photo: profileState?.customization?.photo,
      avatarEmblemId: profileState?.customization?.mainEmblem,
    }),
    [displayName, playerXp, playerLevel, profileState?.customization?.photo, profileState?.customization?.mainEmblem],
  );
  const guildState = useGuildState(guildPlayer);
  const myGuild = getGuild(guildState);

  const selfRow: RankRow = useMemo(
    () => ({
      id: 'self',
      name: displayName,
      score: playerXp,
      level: playerLevel,
      guild: myGuild?.name ?? null,
      glyph: 'crown',
      flag: 'BR',
      photo: profileState?.customization?.photo,
      emblemId: profileState?.customization?.mainEmblem,
      isSelf: true,
    }),
    [displayName, playerXp, playerLevel, myGuild?.name, profileState?.customization?.photo, profileState?.customization?.mainEmblem],
  );

  /* Jogadores: placeholders + o jogador local, ordenados pela pontuação. */
  const playerRows = useMemo(
    () => [...PLACEHOLDER_PLAYERS, selfRow].sort((a, b) => b.score - a.score),
    [selfRow],
  );

  /* Clãs: apenas os membros da guilda do usuário. */
  const guildRows = useMemo<RankRow[]>(() => {
    if (!myGuild) return [];
    return myGuild.members
      .map((member) => ({
        id: `guild-${member.id}`,
        name: member.name,
        score: member.trophies,
        level: member.level,
        guild: myGuild.name,
        glyph: member.glyph,
        flag: member.flag,
        photo: member.photo,
        emblemId: member.avatarEmblemId,
        isSelf: member.isSelf || member.name === displayName,
        role: member.role,
      }))
      .sort((a, b) => b.score - a.score);
  }, [myGuild, displayName]);

  /* Amigos: INITIAL_FRIENDS + amigos adicionados por QR/link. */
  const [friends, setFriends] = useState(() => mergeFriends(loadAddedFriends(), INITIAL_FRIENDS));
  useEffect(() => {
    const reload = () => setFriends(mergeFriends(loadAddedFriends(), INITIAL_FRIENDS));
    window.addEventListener('academia:friends-updated', reload);
    window.addEventListener('academia:friends-changed', reload);
    return () => {
      window.removeEventListener('academia:friends-updated', reload);
      window.removeEventListener('academia:friends-changed', reload);
    };
  }, []);

  const friendRows = useMemo<RankRow[]>(
    () =>
      friends
        .map((friend) => ({
          id: `friend-${friend.id}`,
          name: friend.name,
          score: friend.trophies,
          level: friend.level ?? 1,
          guild: friend.clan,
          glyph: friend.avatarGlyph ?? 'crown',
          flag: friend.flag ?? 'BR',
          photo: friend.photo,
          emblemId: friend.avatarEmblemId,
          isSelf: false,
        }))
        .sort((a, b) => b.score - a.score),
    [friends],
  );

  if (!mounted) return null;

  const rows =
    tab === 'jogadores' ? playerRows : tab === 'clas' ? guildRows : friendRows;

  const banner =
    tab === 'jogadores'
      ? { title: 'Modo Ranqueado', sub: 'As maiores pontuações do EVO FIT' }
      : tab === 'clas'
        ? {
            title: myGuild?.name ?? 'Ranking da Guilda',
            sub: myGuild
              ? `Membros de ${myGuild.name} por pontuação`
              : 'Entre em uma guilda para disputar o ranking interno',
          }
        : { title: 'Ranking de Amigos', sub: 'Sua rede por pontuação' };

  return (
    <OverlayShell title="Rankings" subtitle="Temporada atual" closing={closing} onClose={onClose}>
      <div className="rk-root">
        <div className="rk-tabs" role="tablist" aria-label="Categorias do ranking">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              className={`rk-tab${tab === item.key ? ' is-active' : ''}`}
              data-rank-tab={item.key}
              onClick={() => selectTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            className="rk-panel"
            initial={{ opacity: 0, x: tabDir * 26 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: tabDir * -26 }}
            transition={{ duration: 0.22, ease: [0.25, 0.8, 0.25, 1] }}
          >
            <div className={`rk-banner${tab === 'clas' && !myGuild ? ' rk-banner--muted' : ''}`}>
              {tab === 'clas' ? (
                <Shield size={24} className="rk-banner__icon" aria-hidden="true" />
              ) : tab === 'amigos' ? (
                <Users size={24} className="rk-banner__icon" aria-hidden="true" />
              ) : (
                <Trophy size={24} className="rk-banner__icon" aria-hidden="true" />
              )}
              <span className="rk-banner__text">
                <span className="rk-banner__title">{banner.title}</span>
                <span className="rk-banner__sub">{banner.sub}</span>
              </span>
            </div>

            {tab === 'clas' && !myGuild ? (
              <div className="rk-empty">
                <Shield size={30} className="rk-empty__icon" aria-hidden="true" />
                <p className="rk-empty__text">
                  Você precisa fazer parte de uma guilda para ver o ranking da guilda.
                </p>
              </div>
            ) : tab === 'amigos' && rows.length === 0 ? (
              <div className="rk-empty">
                <Users size={30} className="rk-empty__icon" aria-hidden="true" />
                <p className="rk-empty__text">
                  Você ainda não tem amigos. Adicione amigos para ver o ranking.
                </p>
              </div>
            ) : (
              <ol className="rk-list">
                {rows.map((row, index) => (
                  <RankRowView key={row.id} row={row} rank={index + 1} />
                ))}
              </ol>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </OverlayShell>
  );
}

export default RankingsOverlay;
