/**
 * useInbox.ts — estado reativo da Caixa de Mensagens (v4.67.0)
 *
 * Lê a lista de `inbox.ts` e revalida em qualquer evento
 * `academia:inbox-changed` (disparado por cada mensagem gravada, leitura ou
 * limpeza), inclusive vindo de outra aba via `storage`.
 */

import { useEffect, useState } from 'react';
import { INBOX_EVENT, listMessages, unreadCount, type InboxMessage } from './inbox';

export interface UseInboxResult {
  messages: InboxMessage[];
  unread: number;
}

export function useInbox(): UseInboxResult {
  const [state, setState] = useState<UseInboxResult>(() => ({
    messages: listMessages(),
    unread: unreadCount(),
  }));

  useEffect(() => {
    const refresh = () => setState({ messages: listMessages(), unread: unreadCount() });

    window.addEventListener(INBOX_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(INBOX_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return state;
}
