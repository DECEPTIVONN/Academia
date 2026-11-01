/**
 * MessagesModal.tsx — caixa de Mensagens do menu do Início (v4.67.0)
 *
 * A lista NÃO é mais fixa: vem de `features/notifications/inbox.ts`, que é
 * alimentada por eventos reais (amizade aceita, conquista desbloqueada, fim de
 * liga com treinos na janela, conta reativada). Sem eventos, a tela mostra o
 * estado vazio — nunca histórias inventadas.
 *
 * Ações: tocar num cartão marca como lida, o cabeçalho oferece “marcar todas”
 * e um contador de não lidas aparece no topo enquanto houver pendências.
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCheck,
  Flame,
  Sparkles,
  Trash2,
  Trophy,
  UserPlus,
  UserRoundCheck,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useModalPresence } from '@/hooks/useModalPresence';
import { useInbox } from '@/features/notifications/useInbox';
import {
  clearInbox,
  markAllRead,
  markRead,
  type InboxKind,
  type InboxMessage,
} from '@/features/notifications/inbox';
import './messages-modal.css';

const ICONS: Record<InboxKind, LucideIcon> = {
  friend: UserPlus,
  achievement: Sparkles,
  league: Trophy,
  account: UserRoundCheck,
  streak: Flame,
};

const TONES: Record<InboxKind, string> = {
  friend: 'friend',
  achievement: 'achievement',
  league: 'league',
  account: 'account',
  streak: 'streak',
};

/** "há 2 h" / "agora" / "há 18 dias". */
function relativeTime(at: number): string {
  const diff = Math.max(0, Date.now() - at);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'há 1 mês' : `há ${months} meses`;
}

function MessageCard({ message }: { message: InboxMessage }) {
  const Icon = ICONS[message.kind] ?? Sparkles;
  return (
    <article
      className={`msg-card msg-card--${TONES[message.kind] ?? 'news'}${
        message.read ? '' : ' is-unread'
      }`}
      onClick={() => markRead(message.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          markRead(message.id);
        }
      }}
    >
      <div className="msg-card__top">
        <span className="msg-card__icon" aria-hidden="true">
          <Icon size={16} />
        </span>
        <h3 className="msg-card__title">{message.title}</h3>
        <span className="msg-card__time">{relativeTime(message.at)}</span>
      </div>
      <p className="msg-card__text">{message.body}</p>
    </article>
  );
}

export function MessagesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mounted, closing } = useModalPresence(open);
  const { messages, unread } = useInbox();

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

  if (!mounted) return null;

  return createPortal(
    <div
      className={`msg-overlay${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Mensagens"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="msg-panel">
        <header className="msg-head">
          <span className="msg-head__spacer" aria-hidden="true">
            {unread > 0 && <span className="msg-badge">{unread > 9 ? '9+' : unread}</span>}
          </span>
          <h2 className="msg-title">Mensagens</h2>
          <button type="button" className="msg-close" onClick={onClose} aria-label="Fechar mensagens">
            <X size={18} />
          </button>
        </header>

        <div className="msg-body">
          {messages.length === 0 ? (
            <div className="msg-empty">
              <Sparkles size={22} className="msg-empty__icon" aria-hidden="true" />
              <p className="msg-empty__title">Nada por aqui ainda</p>
              <p className="msg-empty__text">
                Você recebe um aviso quando alguém aceitar sua amizade, desbloquear uma conquista,
                terminar uma liga em que treinou — ou quando sua conta for reativada.
              </p>
            </div>
          ) : (
            messages.map((message) => <MessageCard key={message.id} message={message} />)
          )}
        </div>

        {messages.length > 0 && (
          <footer className="msg-foot">
            <button
              type="button"
              className="msg-action"
              onClick={() => markAllRead()}
              disabled={unread === 0}
            >
              <CheckCheck size={14} />
              Marcar todas como lidas
            </button>
            <button
              type="button"
              className="msg-action msg-action--danger"
              onClick={() => clearInbox()}
            >
              <Trash2 size={14} />
              Limpar
            </button>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default MessagesModal;
