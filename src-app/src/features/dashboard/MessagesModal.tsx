/**
 * MessagesModal.tsx — caixa de Mensagens do menu do Início
 *
 * Referência: o popup "Mensagens" do jogo (lista de cartões com título, tempo
 * relativo e texto). Adaptado ao estilo do site: painel escuro com hairline,
 * acento do tema, ícone por mensagem e ✕ no cabeçalho.
 *
 * As mensagens são placeholders (nada é gravado) — o objetivo é a interface de
 * leitura, aberta pelo item Mensagens do menu do Início.
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Flame, Megaphone, Sparkles, UserPlus, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useModalPresence } from '@/hooks/useModalPresence';
import './messages-modal.css';

interface MessageItem {
  id: string;
  title: string;
  body: string;
  timeAgo: string;
  icon: LucideIcon;
  tone: 'friend' | 'guild' | 'streak' | 'news';
}

const MESSAGES: MessageItem[] = [
  {
    id: 'msg-friend',
    title: 'Amigo adicionado!',
    body: 'Dante aceitou seu pedido de amizade.',
    timeAgo: 'há 18 dias',
    icon: UserPlus,
    tone: 'friend',
  },
  {
    id: 'msg-help',
    title: 'Ajuda necessária!',
    body: 'Você tem fichas de treino sobrando. Sua guilda precisa da sua ajuda para subir no ranking.',
    timeAgo: 'há 19 dias',
    icon: Megaphone,
    tone: 'guild',
  },
  {
    id: 'msg-streak',
    title: 'Ofensiva em risco',
    body: 'Você ainda não treinou hoje. Faça um treino para não perder a sua sequência.',
    timeAgo: 'há 2 horas',
    icon: Flame,
    tone: 'streak',
  },
  {
    id: 'msg-rankings',
    title: 'Novidade no EVO FIT',
    body: 'O ranking de jogadores, clãs e amigos chegou. Confira sua posição no menu do Início.',
    timeAgo: 'há 5 minutos',
    icon: Sparkles,
    tone: 'news',
  },
];

export function MessagesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mounted, closing } = useModalPresence(open);

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
          <span className="msg-head__spacer" aria-hidden="true" />
          <h2 className="msg-title">Mensagens</h2>
          <button type="button" className="msg-close" onClick={onClose} aria-label="Fechar mensagens">
            <X size={18} />
          </button>
        </header>

        <div className="msg-body">
          {MESSAGES.map((message) => {
            const Icon = message.icon;
            return (
              <article key={message.id} className={`msg-card msg-card--${message.tone}`}>
                <div className="msg-card__top">
                  <span className="msg-card__icon" aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <h3 className="msg-card__title">{message.title}</h3>
                  <span className="msg-card__time">{message.timeAgo}</span>
                </div>
                <p className="msg-card__text">{message.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default MessagesModal;
