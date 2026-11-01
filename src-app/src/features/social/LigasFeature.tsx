/**
 * LigasFeature.tsx — aba SOCIAL (v4.66.0)
 *
 * Duas abas, só com dados reais:
 *   • AMIGOS — amizades confirmadas na nuvem (`friendships`) + convites
 *     recebidos/enviados + amigos locais de QR/link (funciona offline);
 *   • RANKING — ranking GLOBAL do mês: mesma janela da liga mensal
 *     (dia 1º 06:00 → último dia 21:00) e pontuação = XP de treinos do mês
 *     publicado por cada conta. Nada é gerado aleatoriamente.
 *
 * Sem conta/nuvem a tela mostra o estado honesto ("entre para competir") e a
 * lista local de amigos por QR continua utilizável.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Calendar,
  Camera,
  Check,
  Plus,
  RefreshCw,
  Trophy,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { AvatarGlyph, FlagIcon } from './ligas-icons';
import { PlayerAvatarMedia } from './PlayerAvatar';
import { FriendQrModal } from './FriendQrModal';
import { QrScannerModal } from './QrScannerModal';
import { MemberPopover } from './MemberPopover';
import { standaloneSound, type FriendItem, type SubTab } from './ligas-data';
import { formatWindowEnd, monthlyLeagueWindow } from './league-window';
import {
  acceptFriendInvite,
  buildFriendInviteUrl,
  clearFriendInviteFromUrl,
  getFriendCode,
  loadAddedFriends,
  mergeFriends,
  readFriendInviteFromUrl,
  type FriendInvite,
} from './friend-invites';
import { cloudFriendToItem, rankRowToItem, useSocialCloud } from './useSocialCloud';
import { localXpSummary } from './social-cloud';
import {
  fallbackLastSeenHours,
  fallbackStreak,
  type PlayerSummaryInput,
} from './player-profile-data';
import { useAuth } from '@/core/auth/use-auth';
import { useProfileState } from '@/features/profile/useProfileState';
import { useLocalData } from '@/hooks/useLocalData';
import { showToast } from '@/lib/toast';
import { getLevel, getXp } from '@/core/db/queries';
import './social.css';

export interface LigasFeatureProps {
  soundEnabled?: boolean;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const XP = (value: number) => Math.max(0, Math.round(value)).toLocaleString('pt-BR');

function rowTone(isSelf: boolean): string {
  return isSelf
    ? 'bg-[rgba(var(--primary-rgb,139,92,246),0.16)] border-[rgba(var(--primary-rgb,139,92,246),0.45)]'
    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700';
}

function rankTone(rank: number): string {
  if (rank === 1) return 'text-amber-300';
  if (rank === 2) return 'text-slate-300';
  if (rank === 3) return 'text-orange-400';
  return 'text-slate-500';
}

/* ── Linha de jogador ── */

function PlayerRow({
  item,
  rank,
  isSelf,
  subtitle,
  onSelect,
  actions,
}: {
  item: FriendItem;
  rank?: number;
  isSelf?: boolean;
  subtitle?: string;
  onSelect?: (item: FriendItem) => void;
  actions?: React.ReactNode;
}) {
  const content = (
    <>
      <span className="flex items-center gap-2.5 min-w-0">
        {typeof rank === 'number' ? (
          <span className={`w-6 shrink-0 text-center text-xs font-black font-mono ${rankTone(rank)}`}>
            {rank}
          </span>
        ) : null}
        <span className="relative shrink-0">
          <PlayerAvatarMedia
            photo={item.photo}
            emblemId={item.avatarEmblemId}
            glyph={item.avatarGlyph}
            size={36}
          />
          {item.online && (
            <span className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950" />
          )}
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="truncate text-[13px] font-black text-white">{item.name}</span>
            {item.flag && <FlagIcon flag={item.flag} size={11} />}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {subtitle ?? `Nível ${item.level ?? 1}`}
            {item.avatarGlyph && (
              <AvatarGlyph glyph={item.avatarGlyph} size={10} className="text-slate-500" />
            )}
          </span>
        </span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        <span className="text-right">
          <span className="block text-[13px] font-black text-white font-mono leading-none">
            {XP(item.trophies)}
          </span>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
            XP no mês
          </span>
        </span>
        {actions}
      </span>
    </>
  );

  const className = `w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all text-left ${rowTone(Boolean(isSelf))}`;

  if (!onSelect) return <div className={className}>{content}</div>;

  return (
    <button type="button" className={`${className} cursor-pointer active:scale-[0.99]`} onClick={() => onSelect(item)}>
      {content}
    </button>
  );
}

/* ── Estado vazio ── */

function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 px-4 text-center rounded-2xl border border-dashed border-slate-700/70">
      <span className="text-slate-500">{icon}</span>
      <div>
        <p className="text-sm font-black text-white">{title}</p>
        <p className="text-xs font-semibold text-slate-400 leading-relaxed mt-1 max-w-[38ch]">{desc}</p>
      </div>
      {action}
    </div>
  );
}

/* ── Aba ── */

export function LigasFeature({ soundEnabled = true }: LigasFeatureProps) {
  useEffect(() => {
    standaloneSound.enabled = soundEnabled;
  }, [soundEnabled]);

  const { user } = useAuth();
  const { state: profileState } = useProfileState();
  const { history } = useLocalData();
  const cloud = useSocialCloud();

  const [subTab, setSubTab] = useState<SubTab>('amigos');
  const [localFriends, setLocalFriends] = useState<FriendItem[]>(() => loadAddedFriends());
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSummaryInput | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const displayName = useMemo(() => {
    const name = profileState?.customization?.nome?.trim() || 'Atleta';
    return name.slice(0, 24) || 'Atleta';
  }, [profileState?.customization?.nome]);

  const localXp = useMemo(() => localXpSummary(history), [history]);
  const playerLevel = useMemo(() => getLevel(getXp(history)), [history]);
  const monthWindow = useMemo(() => monthlyLeagueWindow(), []);
  const friendCode = useMemo(() => getFriendCode(user?.id ?? null), [user?.id]);
  const inviteUrl = useMemo(
    () => buildFriendInviteUrl(friendCode, displayName),
    [friendCode, displayName],
  );

  /* Amigos reais da nuvem + amigos locais (QR/link, funcionam offline). */
  const friendItems = useMemo(
    () => mergeFriends(cloud.accepted.map(cloudFriendToItem), localFriends),
    [cloud.accepted, localFriends],
  );

  const selfRank = cloud.self?.position ?? null;

  useEffect(() => {
    const reload = () => setLocalFriends(loadAddedFriends());
    window.addEventListener('academia:friends-changed', reload);
    window.addEventListener('academia:friends-updated', reload);
    return () => {
      window.removeEventListener('academia:friends-changed', reload);
      window.removeEventListener('academia:friends-updated', reload);
    };
  }, []);

  /* ── Convites ── */

  const applyInvite = useCallback(
    (invite: FriendInvite) => {
      const result = acceptFriendInvite(invite, friendCode);
      setLocalFriends(loadAddedFriends());

      if (result.status === 'self') {
        showToast('Esse é o seu próprio QR Code de amigo.', 'info');
        return;
      }
      if (result.status === 'invalid') {
        showToast('Convite de amizade inválido.', 'error');
        return;
      }

      /* Código de conta (uuid) com nuvem ativa: cria o convite de verdade,
         que o outro lado aceita em Amigos → convites recebidos. */
      if (cloud.ready && UUID_RE.test(invite.code)) {
        void cloud
          .request(invite.code)
          .then((status) => {
            if (status === 'exists') showToast(`${invite.name} já está na sua lista.`, 'info');
            else showToast(`Convite enviado para ${invite.name}.`, 'success');
          })
          .catch(() => showToast(`${invite.name} adicionado neste aparelho.`, 'info'));
        return;
      }

      showToast(`${result.friend?.name ?? invite.name} foi adicionado aos seus amigos!`, 'success');
    },
    [cloud, friendCode],
  );

  useEffect(() => {
    const invite = readFriendInviteFromUrl();
    if (!invite) return;
    // A URL é uma fonte externa: o convite precisa hidratar o estado uma vez.
    // eslint-disable-next-line react/set-state-in-effect
    applyInvite(invite);
    clearFriendInviteFromUrl();
  }, [applyInvite]);

  const handleAccept = async (id: string, name: string) => {
    setBusyId(id);
    try {
      await cloud.accept(id);
      standaloneSound.playLevelUp();
      showToast(`${name} agora é seu amigo!`, 'success');
    } catch {
      showToast('Não foi possível aceitar o convite agora.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    setBusyId(id);
    try {
      await cloud.remove(id);
      showToast(`${name} foi removido dos amigos.`, 'info');
    } catch {
      showToast('Não foi possível remover agora.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  /* ── Popover do jogador ── */

  const openPlayer = (item: FriendItem) => {
    standaloneSound.playMove();
    setSelectedPlayer({
      id: item.id,
      name: item.name,
      kind: 'amigo',
      isSelf: item.id === user?.id,
      trophies: item.trophies,
      monthlyXp: item.monthlyXp ?? item.trophies,
      rank: typeof item.rank === 'number' && item.rank > 0 ? item.rank : null,
      level: item.level,
      flag: item.flag,
      glyph: item.avatarGlyph,
      photo: item.id === user?.id ? profileState?.customization?.photo : item.photo,
      avatarEmblemId:
        item.id === user?.id ? profileState?.customization?.mainEmblem : item.avatarEmblemId,
      online: item.online,
      lastSeenHours: item.lastSeenHours ?? fallbackLastSeenHours(`${item.id}:${item.name}`, item.online),
      streak: item.streak ?? fallbackStreak(`${item.id}:${item.name}`),
    });
  };

  /* ── Header ── */

  const header = (
    <div className="p-4 bg-gradient-to-r from-[rgba(var(--primary-rgb,139,92,246),0.25)] via-slate-900/60 to-slate-950/70 backdrop-blur border border-[rgba(var(--primary-rgb,139,92,246),0.3)] rounded-2xl shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] ligas-text-accent">
            Ranking global · mês
          </p>
          <h4 className="text-lg font-black text-white uppercase tracking-tight leading-none mt-1 truncate">
            {XP(localXp.monthlyXp)} XP
          </h4>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">
            {selfRank ? `#${selfRank} no ranking global` : 'Publique um treino para entrar no ranking'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-full text-[10px] font-black ligas-text-accent font-mono uppercase">
            <Calendar size={12} />
            até {formatWindowEnd(monthWindow)}
          </span>
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 mt-1.5">
            Nível {playerLevel} · ofensiva {localXp.streak}
          </p>
        </div>
      </div>
    </div>
  );

  /* ── Amigos ── */

  const amigosContent = (
    <div className="space-y-4">
      {cloud.incoming.length > 0 && (
        <section className="soc-friend-group" aria-label="Convites de amizade">
          <div className="soc-friend-group__head">
            <span className="soc-friend-group__title">
              <Users size={12} aria-hidden="true" />
              Convites recebidos
            </span>
            <span className="soc-friend-group__count">{cloud.incoming.length}</span>
          </div>
          {cloud.incoming.map((friend) => (
            <PlayerRow
              key={`in-${friend.id}`}
              item={cloudFriendToItem(friend)}
              subtitle={`Quer treinar com você · Nível ${friend.level}`}
              actions={
                <span className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === friend.id}
                    onClick={() => void handleAccept(friend.id, friend.name)}
                    className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer disabled:opacity-50"
                    title="Aceitar convite"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={busyId === friend.id}
                    onClick={() => void handleRemove(friend.id, friend.name)}
                    className="p-2 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-300 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer disabled:opacity-50"
                    title="Recusar convite"
                  >
                    <X size={13} />
                  </button>
                </span>
              }
            />
          ))}
        </section>
      )}

      <section className="soc-friend-group" aria-label="Seus amigos">
        <div className="soc-friend-group__head">
          <span className="soc-friend-group__title">
            <Trophy size={12} className="text-amber-400" aria-hidden="true" />
            Classificação dos amigos
          </span>
          <span className="soc-friend-group__count">{friendItems.length}</span>
        </div>

        {friendItems.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="Nenhum amigo ainda"
            desc="Use o QR Code de amigo ou busque pelo @username para convidar quem treina com você."
          />
        ) : (
          friendItems.map((item, index) => {
            const cloudFriend = cloud.accepted.find((friend) => friend.id === item.id);
            return (
              <PlayerRow
                key={item.id}
                item={item}
                rank={index + 1}
                isSelf={item.id === user?.id}
                onSelect={openPlayer}
                actions={
                  cloudFriend ? (
                    <button
                      type="button"
                      disabled={busyId === cloudFriend.id}
                      onClick={() => void handleRemove(cloudFriend.id, cloudFriend.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                      title="Remover amigo"
                    >
                      <Trash2 size={13} />
                    </button>
                  ) : undefined
                }
              />
            );
          })
        )}
      </section>

      {cloud.outgoing.length > 0 && (
        <section className="soc-friend-group" aria-label="Convites enviados">
          <div className="soc-friend-group__head">
            <span className="soc-friend-group__title">Convites enviados</span>
            <span className="soc-friend-group__count">{cloud.outgoing.length}</span>
          </div>
          {cloud.outgoing.map((friend) => (
            <PlayerRow
              key={`out-${friend.id}`}
              item={cloudFriendToItem(friend)}
              subtitle="Aguardando aceite"
              actions={
                <button
                  type="button"
                  disabled={busyId === friend.id}
                  onClick={() => void handleRemove(friend.id, friend.name)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                  title="Cancelar convite"
                >
                  <X size={13} />
                </button>
              }
            />
          ))}
        </section>
      )}

      <div className="flex gap-2.5">
        <button
          onClick={() => {
            standaloneSound.playMove();
            setShowAddFriendModal(true);
          }}
          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md border-b-4 border-emerald-700 active:border-b-0 active:translate-y-[2px]"
        >
          <Plus size={14} />
          Adicionar amigos
        </button>
        <button
          onClick={() => {
            standaloneSound.playMove();
            setShowScanner(true);
          }}
          className="p-3 ligas-btn-primary rounded-2xl flex items-center justify-center transition-all cursor-pointer border-b-4 border-[var(--primary-dark)] active:border-b-0 active:translate-y-[2px]"
          title="Escanear QR Code"
          aria-label="Escanear QR Code de amigo"
        >
          <Camera size={16} />
        </button>
      </div>
    </div>
  );

  /* ── Ranking global ── */

  const rankingContent = (
    <div className="space-y-4">
      {!cloud.ready ? (
        <EmptyState
          icon={<Trophy size={22} />}
          title="Ranking global disponível com conta"
          desc={
            cloud.error === 'offline'
              ? 'A nuvem não está configurada neste dispositivo. Seus dados locais continuam salvos; o ranking exige conexão com o servidor.'
              : 'Entre na sua conta para publicar o XP do mês e disputar o ranking global com todos os atletas.'
          }
        />
      ) : cloud.ranking.length === 0 ? (
        <EmptyState
          icon={<Trophy size={22} />}
          title="Sem pontuação neste mês"
          desc="Assim que você e outros atletas concluírem treinos, o ranking do mês aparece aqui. Sua pontuação já é enviada automaticamente."
          action={
            <button
              type="button"
              onClick={() => void cloud.refresh()}
              className="px-4 py-2 ligas-btn-primary rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={12} /> Atualizar
            </button>
          }
        />
      ) : (
        <section className="soc-friend-group" aria-label="Ranking global do mês">
          <div className="soc-friend-group__head">
            <span className="soc-friend-group__title">
              <Trophy size={12} className="text-amber-400" aria-hidden="true" />
              Top do mês
            </span>
            <button
              type="button"
              onClick={() => void cloud.refresh()}
              className="text-[9px] font-black uppercase tracking-wider text-slate-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <RefreshCw size={10} className={cloud.loading ? 'animate-spin' : ''} /> Atualizar
            </button>
          </div>

          {cloud.ranking.map((row) => (
            <PlayerRow
              key={row.id}
              item={rankRowToItem(row)}
              rank={row.position}
              isSelf={row.isSelf}
              subtitle={
                row.streak > 0 ? `Nível ${row.level} · ${row.streak} dias` : `Nível ${row.level}`
              }
              onSelect={openPlayer}
            />
          ))}

          {cloud.self && cloud.self.position > cloud.ranking.length && (
            <div className="pt-1">
              <PlayerRow
                item={rankRowToItem(cloud.self)}
                rank={cloud.self.position}
                isSelf
                subtitle={`Nível ${cloud.self.level}`}
                onSelect={openPlayer}
              />
            </div>
          )}
        </section>
      )}

      <p className="text-[10px] font-semibold text-slate-500 leading-relaxed px-1">
        Pontuação = XP dos treinos concluídos no mês (10 XP por treino). A temporada fecha em{' '}
        {formatWindowEnd(monthWindow)}.
      </p>
    </div>
  );

  /* ── Render ── */

  return (
    <div className="treino-container soc-root">
      <div id="section-social" className="main-section soc ligas-root" role="tabpanel" aria-label="Social">
        {header}

        <div className="flex gap-1.5 p-1.5 my-3 bg-[rgba(20,16,36,0.75)] backdrop-blur border border-[rgba(var(--primary-rgb,139,92,246),0.2)] rounded-2xl select-none shadow-lg">
          {(
            [
              { tab: 'amigos' as SubTab, label: 'Amigos', icon: <Users size={14} /> },
              { tab: 'ranking' as SubTab, label: 'Ranking', icon: <Trophy size={14} /> },
            ]
          ).map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => {
                standaloneSound.playMove();
                setSubTab(item.tab);
              }}
              className={`flex-1 py-2 px-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                subTab === item.tab
                  ? 'ligas-gradient text-white shadow-md border border-[rgba(var(--primary-rgb,139,92,246),0.4)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={subTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="min-h-0"
          >
            {subTab === 'amigos' ? amigosContent : rankingContent}
          </motion.div>
        </AnimatePresence>

        {selectedPlayer && (
          <MemberPopover
            player={selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
          />
        )}

        {showAddFriendModal && (
          <FriendQrModal
            inviteUrl={inviteUrl}
            name={displayName}
            selfId={user?.id ?? null}
            onAddPlayer={(invite) => applyInvite(invite)}
            onClose={() => setShowAddFriendModal(false)}
            onScan={() => {
              setShowAddFriendModal(false);
              setShowScanner(true);
            }}
          />
        )}

        {showScanner && (
          <QrScannerModal
            onClose={() => setShowScanner(false)}
            onInvite={(invite) => {
              applyInvite(invite);
              setShowScanner(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default LigasFeature;
