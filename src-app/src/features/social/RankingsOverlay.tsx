/**
 * RankingsOverlay.tsx — Rankings do menu do Início (v4.66.0)
 *
 * Duas abas com dados REAIS:
 *   • Jogadores — ranking global do mês (`global_monthly_ranking`), a mesma
 *     janela da liga mensal e a mesma pontuação (XP de treinos concluídos);
 *   • Amigos — seus amigos da nuvem ordenados pelo XP do mês.
 *
 * Sem placeholders, sem clãs/guildas e sem pontuação inventada. Quando a
 * nuvem não está disponível, o overlay mostra o estado honesto (entrar na
 * conta / configurar a nuvem).
 */

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Medal, Trophy, Users } from 'lucide-react';
import { OverlayShell } from './OverlayShell';
import { PlayerAvatarMedia } from './PlayerAvatar';
import { FlagIcon } from './ligas-icons';
import { formatWindowEnd, monthlyLeagueWindow } from './league-window';
import { cloudFriendToItem, rankRowToItem, useSocialCloud } from './useSocialCloud';
import type { FriendItem } from './ligas-data';
import { useModalPresence } from '@/hooks/useModalPresence';
import './rankings.css';

type RankingTab = 'jogadores' | 'amigos';

interface RankRow {
  id: string;
  name: string;
  score: number;
  level: number;
  glyph: FriendItem['avatarGlyph'];
  flag: FriendItem['flag'];
  photo?: string;
  emblemId?: string;
  isSelf?: boolean;
  streak?: number;
}

const TABS: { key: RankingTab; label: string }[] = [
  { key: 'jogadores', label: 'Jogadores' },
  { key: 'amigos', label: 'Amigos' },
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
          {row.flag && <FlagIcon flag={row.flag} size={11} className="rk-row__flag" />}
          {row.isSelf && <span className="rk-row__you">VOCÊ</span>}
        </span>
        <span className="rk-row__meta">
          Nível {row.level}
          {row.streak ? ` · ${row.streak} ${row.streak === 1 ? 'dia' : 'dias'} de ofensiva` : ''}
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

  const cloud = useSocialCloud();
  const monthWindow = useMemo(() => monthlyLeagueWindow(), []);

  /* Carrega/atualiza quando o overlay abre (o XP do usuário é republicado). */
  useEffect(() => {
    if (open) void cloud.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectTab = (next: RankingTab) => {
    if (next === tab) return;
    const from = TABS.findIndex((item) => item.key === tab);
    const to = TABS.findIndex((item) => item.key === next);
    setTabDir(to >= from ? 1 : -1);
    setTab(next);
  };

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

  const playerRows = useMemo<RankRow[]>(
    () =>
      cloud.ranking.map((rankingRow) => {
        const item = rankRowToItem(rankingRow);
        return {
          id: item.id,
          name: item.name,
          score: item.monthlyXp ?? item.trophies,
          level: item.level ?? 1,
          glyph: item.avatarGlyph,
          flag: item.flag,
          photo: item.photo,
          emblemId: item.avatarEmblemId,
          isSelf: rankingRow.isSelf,
          streak: rankingRow.streak,
        };
      }),
    [cloud.ranking],
  );

  const friendRows = useMemo<RankRow[]>(
    () =>
      cloud.accepted
        .map((friend) => {
          const item = cloudFriendToItem(friend);
          return {
            id: item.id,
            name: item.name,
            score: item.monthlyXp ?? 0,
            level: item.level ?? 1,
            glyph: item.avatarGlyph,
            flag: item.flag,
            photo: item.photo,
            emblemId: item.avatarEmblemId,
            isSelf: false,
            streak: friend.streak,
          };
        })
        .sort((a, b) => b.score - a.score),
    [cloud.accepted],
  );

  if (!mounted) return null;

  const rows = tab === 'jogadores' ? playerRows : friendRows;

  const banner =
    tab === 'jogadores'
      ? {
          title: 'Ranking global do mês',
          sub: `XP dos treinos concluídos · fecha em ${formatWindowEnd(monthWindow)}`,
        }
      : { title: 'Ranking de amigos', sub: 'Sua rede pelo XP do mês' };

  const empty =
    !cloud.ready
      ? {
          icon: <Trophy size={30} className="rk-empty__icon" aria-hidden="true" />,
          text:
            cloud.error === 'offline'
              ? 'A nuvem não está configurada neste dispositivo — o ranking precisa de conexão com o servidor.'
              : 'Entre na sua conta para publicar seu XP e disputar o ranking.',
        }
      : tab === 'jogadores'
        ? {
            icon: <Trophy size={30} className="rk-empty__icon" aria-hidden="true" />,
            text: 'Nenhum atleta pontuou neste mês ainda. Conclua um treino para abrir o ranking.',
          }
        : {
            icon: <Users size={30} className="rk-empty__icon" aria-hidden="true" />,
            text: 'Você ainda não tem amigos. Adicione amigos na aba Social para comparar o XP do mês.',
          };

  return (
    <OverlayShell
      title="Rankings"
      subtitle={`Mês atual · até ${formatWindowEnd(monthWindow)}`}
      closing={closing}
      onClose={onClose}
    >
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
            <div className="rk-banner">
              {tab === 'amigos' ? (
                <Users size={24} className="rk-banner__icon" aria-hidden="true" />
              ) : (
                <Trophy size={24} className="rk-banner__icon" aria-hidden="true" />
              )}
              <span className="rk-banner__text">
                <span className="rk-banner__title">{banner.title}</span>
                <span className="rk-banner__sub">{banner.sub}</span>
              </span>
            </div>

            {rows.length === 0 ? (
              <div className="rk-empty">
                {empty.icon}
                <p className="rk-empty__text">{empty.text}</p>
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
