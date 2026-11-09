/**
 * FriendStreaksPanel.tsx — Ofensivas dos amigos (v4.74.0)
 *
 * Convites reais entre amizades confirmadas:
 *   • convite recebido → Aceitar / Recusar (também nas Mensagens do Início);
 *   • convite enviado  → cancelar enquanto estiver pendente;
 *   • convite aceito   → a sequência atual do amigo aparece na lista.
 *
 * Não existe convite fictício: sem nuvem/sessão a tela explica que a
 * funcionalidade precisa de conexão e mantém o restante do app offline.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Flame, Plus, Send, ShieldCheck, UserPlus, X } from 'lucide-react';
import { showToast } from '@/lib/toast';
import {
  fetchFriends,
  isSocialCloudAvailable,
  type CloudFriend,
} from './social-cloud';
import {
  cancelStreakInvite,
  fetchStreakInvites,
  respondStreakInvite,
  sendStreakInvite,
  STREAK_INVITES_EVENT,
  type StreakInvite,
} from './streak-invites';
import './friend-streaks.css';

const MAX_SLOTS = 5;

function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'A';
}

function FriendAvatar({
  name,
  photo,
  size = 42,
}: {
  name: string;
  photo?: string;
  size?: number;
}) {
  return (
    <span className="fsp-avatar" style={{ width: size, height: size }}>
      {photo ? <img src={photo} alt="" referrerPolicy="no-referrer" /> : initials(name)}
    </span>
  );
}

function errorMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : '';
  if (/not friends/i.test(text)) return 'Vocês precisam ser amigos para enviar o convite.';
  if (/not authenticated/i.test(text)) return 'Entre na sua conta para convidar amigos.';
  if (/not found/i.test(text)) return 'Este convite não está mais disponível.';
  return 'Não foi possível concluir. Verifique sua conexão e tente de novo.';
}

export function FriendStreaksPanel() {
  const [invites, setInvites] = useState<StreakInvite[]>([]);
  const [friends, setFriends] = useState<CloudFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'offline' | 'auth' | 'failed' | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSocialCloudAvailable) {
      setError('offline');
      setLoading(false);
      return;
    }
    try {
      const [inviteRows, friendRows] = await Promise.all([
        fetchStreakInvites(),
        fetchFriends().catch(() => [] as CloudFriend[]),
      ]);
      setInvites(inviteRows);
      setFriends(friendRows);
      setError(null);
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      setError(
        name === 'SocialCloudOfflineError'
          ? 'offline'
          : name === 'SocialCloudAuthError'
            ? 'auth'
            : 'failed',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Sincronização com a nuvem: o estado vem da resposta.
    // eslint-disable-next-line react/set-state-in-effect
    void refresh();
    const onRefresh = () => void refresh();
    window.addEventListener(STREAK_INVITES_EVENT, onRefresh);
    window.addEventListener('academia:friends-changed', onRefresh);
    return () => {
      window.removeEventListener(STREAK_INVITES_EVENT, onRefresh);
      window.removeEventListener('academia:friends-changed', onRefresh);
    };
  }, [refresh]);

  const acceptedFriends = useMemo(
    () => friends.filter((friend) => friend.state === 'accepted'),
    [friends],
  );

  const activeInvites = useMemo(
    () =>
      invites.filter(
        (invite) =>
          invite.status === 'accepted' ||
          (invite.status === 'pending' && invite.direction === 'incoming') ||
          (invite.status === 'pending' && invite.direction === 'outgoing'),
      ),
    [invites],
  );

  const invitedIds = useMemo(
    () => new Set(activeInvites.map((invite) => invite.userId)),
    [activeInvites],
  );

  const candidates = useMemo(
    () => acceptedFriends.filter((friend) => !invitedIds.has(friend.id)),
    [acceptedFriends, invitedIds],
  );

  const acceptedCount = acceptedInvitesCount(activeInvites);
  const emptySlots = Math.max(0, MAX_SLOTS - activeInvites.length);

  const runAction = async (
    key: string,
    action: () => Promise<unknown>,
    success: string,
  ) => {
    if (busyId) return;
    setBusyId(key);
    try {
      await action();
      showToast(success, 'success');
      await refresh();
    } catch (err) {
      showToast(errorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const invite = (friend: CloudFriend) =>
    runAction(
      `invite:${friend.id}`,
      () => sendStreakInvite(friend.id),
      `Convite enviado para ${friend.name}!`,
    );

  if (!isSocialCloudAvailable) {
    return (
      <div className="fsp-empty-state">
        <span className="fsp-empty-state__icon">
          <Flame size={24} />
        </span>
        <h3>Ofensivas dos amigos</h3>
        <p>
          Convites de ofensiva precisam da nuvem configurada e de uma conta conectada.
          Seus treinos continuam salvos no aparelho normalmente.
        </p>
      </div>
    );
  }

  return (
    <div className="friend-streaks-panel">
      <section className="fsp-hero">
        <div className="fsp-hero__glow" aria-hidden="true" />
        <div className="fsp-hero__copy">
          <span className="fsp-hero__eyebrow">Sequência em dupla</span>
          <h3 className="fsp-hero__title">Ofensivas dos amigos</h3>
          <p className="fsp-hero__desc">
            Convide amigos para manter a ofensiva junto. Eles recebem o convite nas
            Mensagens do Início e podem aceitar ou recusar.
          </p>
        </div>
        <div className="fsp-hero__art" aria-hidden="true">
          <span className="fsp-hero__avatar fsp-hero__avatar--back">A</span>
          <span className="fsp-hero__avatar fsp-hero__avatar--front">V</span>
          <span className="fsp-hero__flame">
            <Flame size={26} />
          </span>
        </div>
        <div className="fsp-hero__stats">
          <span>
            <strong>{acceptedCount}</strong>
            <small>duplas ativas</small>
          </span>
          <span>
            <strong>{activeInvites.filter((i) => i.status === 'pending').length}</strong>
            <small>pendentes</small>
          </span>
        </div>
      </section>

      <div className="fsp-section-head">
        <div>
          <span className="fsp-section-head__eyebrow">Sua lista</span>
          <h4 className="fsp-section-head__title">Duplas de ofensiva</h4>
        </div>
        <button
          type="button"
          className="fsp-edit"
          onClick={() => setPickerOpen((value) => !value)}
        >
          {pickerOpen ? 'FECHAR' : 'EDITAR'}
        </button>
      </div>

      {loading ? (
        <div className="fsp-loading">
          <i />
          Carregando convites…
        </div>
      ) : error ? (
        <div className="fsp-notice">
          <ShieldCheck size={17} />
          <div>
            <strong>
              {error === 'offline'
                ? 'Sem conexão com a nuvem'
                : error === 'auth'
                  ? 'Entre na sua conta'
                  : 'Não foi possível carregar os convites'}
            </strong>
            <p>
              {error === 'offline'
                ? 'Os convites de ofensiva ficam no servidor. Seus treinos e a ofensiva pessoal continuam salvos no aparelho.'
                : 'Tente novamente em instantes. O restante do Perfil continua funcionando.'}
            </p>
            <button type="button" className="fsp-retry" onClick={() => void refresh()}>
              Tentar novamente
            </button>
          </div>
        </div>
      ) : (
        <div className="fsp-list">
          {activeInvites.map((item) => {
            const pending = item.status === 'pending';
            const incoming = item.direction === 'incoming';
            return (
              <article
                key={item.id}
                className={`fsp-row${item.status === 'accepted' ? ' is-accepted' : ''}${
                  pending ? ' is-pending' : ''
                }`}
              >
                <FriendAvatar name={item.name} photo={item.photo} />
                <div className="fsp-row__body">
                  <div className="fsp-row__name-line">
                    <strong>{item.name}</strong>
                    {item.username && <span>@{item.username}</span>}
                  </div>
                  <span className="fsp-row__status">
                    {item.status === 'accepted' ? (
                      <>
                        <Flame size={12} /> {item.streak} {item.streak === 1 ? 'dia' : 'dias'} de
                        ofensiva
                      </>
                    ) : incoming ? (
                      'Convite recebido · aceite ou recuse'
                    ) : (
                      'Convite enviado · aguardando resposta'
                    )}
                  </span>
                </div>

                {item.status === 'accepted' ? (
                  <span className="fsp-status-pill is-active">
                    <Check size={12} /> Ativa
                  </span>
                ) : incoming ? (
                  <div className="fsp-row__actions">
                    <button
                      type="button"
                      className="fsp-accept"
                      disabled={busyId !== null}
                      onClick={() =>
                        void runAction(
                          `accept:${item.id}`,
                          () => respondStreakInvite(item.id, true),
                          `Ofensiva com ${item.name} ativada!`,
                        )
                      }
                    >
                      <Check size={13} /> Aceitar
                    </button>
                    <button
                      type="button"
                      className="fsp-decline"
                      disabled={busyId !== null}
                      onClick={() =>
                        void runAction(
                          `decline:${item.id}`,
                          () => respondStreakInvite(item.id, false),
                          'Convite recusado.',
                        )
                      }
                    >
                      <X size={13} /> Recusar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="fsp-cancel"
                    disabled={busyId !== null}
                    onClick={() =>
                      void runAction(
                        `cancel:${item.id}`,
                        () => cancelStreakInvite(item.id),
                        'Convite cancelado.',
                      )
                    }
                  >
                    Cancelar
                  </button>
                )}
              </article>
            );
          })}

          {Array.from({ length: emptySlots }).map((_, index) => (
            <button
              key={`slot-${index}`}
              type="button"
              className="fsp-slot"
              onClick={() => setPickerOpen(true)}
            >
              <span className="fsp-slot__plus">
                <Plus size={17} />
              </span>
              <span className="fsp-slot__copy">
                <strong>Convidar amigo</strong>
                <small>
                  {acceptedFriends.length === 0
                    ? 'Adicione amigos no Social primeiro'
                    : 'Escolha um amigo para manter a sequência'}
                </small>
              </span>
              <Send size={14} className="fsp-slot__send" />
            </button>
          ))}

          {activeInvites.length === 0 && emptySlots === 0 && (
            <p className="fsp-list__empty">Todos os espaços estão ocupados.</p>
          )}
        </div>
      )}

      {pickerOpen && (
        <section className="fsp-picker" id="streakFriendPicker">
          <div className="fsp-picker__head">
            <div>
              <span className="fsp-picker__eyebrow">Amigos disponíveis</span>
              <h4>Quem você quer convidar?</h4>
            </div>
            <button
              type="button"
              className="fsp-picker__close"
              onClick={() => setPickerOpen(false)}
              aria-label="Fechar lista de amigos"
            >
              <X size={16} />
            </button>
          </div>

          {candidates.length === 0 ? (
            <div className="fsp-picker__empty">
              <UserPlus size={20} />
              <p>
                {acceptedFriends.length === 0
                  ? 'Nenhuma amizade confirmada ainda. Adicione amigos na aba Social e volte aqui.'
                  : 'Todos os seus amigos já têm um convite pendente ou ativo.'}
              </p>
            </div>
          ) : (
            <div className="fsp-picker__list">
              {candidates.map((friend) => (
                <div className="fsp-picker__friend" key={friend.id}>
                  <FriendAvatar name={friend.name} photo={friend.photo} size={38} />
                  <div className="fsp-picker__friend-copy">
                    <strong>{friend.name}</strong>
                    <span>
                      <Flame size={11} /> {friend.streak} {friend.streak === 1 ? 'dia' : 'dias'} ·
                      nível {friend.level}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="fsp-picker__send"
                    disabled={busyId !== null}
                    onClick={() => void invite(friend)}
                  >
                    <Send size={13} /> Convidar
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function acceptedInvitesCount(invites: StreakInvite[]): number {
  return invites.filter((invite) => invite.status === 'accepted').length;
}

export default FriendStreaksPanel;
