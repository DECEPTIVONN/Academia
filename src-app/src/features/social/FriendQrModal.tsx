/**
 * FriendQrModal.tsx — modal "Adicionar" da aba Amigos.
 *
 * Duas formas de adicionar:
 *  1. QR permanente do usuário + link fixo de convite (não expira — ver
 *     friend-invites.ts).
 *  2. Busca pelo nome/username do jogador (tabela public.profiles), com botão
 *     "Adicionar" por resultado.
 *
 * O visual segue a referência de jogo (cartão escuro, abas em pílula, moldura
 * de QR com cantos destacados), mantendo as cores atuais do app (roxo).
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  CheckIcon,
  PlusIcon,
  QrCodeIcon,
  SearchIcon,
  UsersIcon,
  XIcon,
} from './social-icons';
import { shareNative } from '@/lib/native-share';
import { showToast } from '@/lib/toast';
import { useModalExit } from '@/hooks/useModalPresence';
import { standaloneSound } from './ligas-data';
import { loadAddedFriends, type FriendInvite } from './friend-invites';
import {
  isSearchableQuery,
  PlayerSearchOfflineError,
  sanitizeSearchQuery,
  searchPlayers,
  type PlayerSearchResult,
} from './friend-search';

interface FriendQrModalProps {
  inviteUrl: string;
  name: string;
  /** `user.id` da conta logada — removido dos resultados de busca. */
  selfId?: string | null;
  /** Adiciona o jogador encontrado (o pai mostra o toast e atualiza a lista). */
  onAddPlayer: (invite: FriendInvite) => void;
  onClose: () => void;
  onScan: () => void;
}

type AddPanel = 'qr' | 'buscar';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* tenta o fallback legado abaixo */
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

function initialOf(value: string): string {
  return value.trim().charAt(0).toUpperCase() || 'A';
}

function addedFriendCodes(): Set<string> {
  try {
    return new Set(
      loadAddedFriends()
        .map((friend) => friend.friendCode)
        .filter((code): code is string => Boolean(code)),
    );
  } catch {
    return new Set();
  }
}

export function FriendQrModal({
  inviteUrl,
  name,
  selfId,
  onAddPlayer,
  onClose,
  onScan,
}: FriendQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrError, setQrError] = useState(false);
  const [sending, setSending] = useState(false);
  const [manualLink, setManualLink] = useState('');
  const [panel, setPanel] = useState<AddPanel>('qr');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addedCodes, setAddedCodes] = useState<Set<string>>(addedFriendCodes);
  /* v4.53.0 — anima a saída antes de o pai desmontar o modal. */
  const { closing, requestClose } = useModalExit(onClose);

  /* Gera o QR branco sobre fundo transparente (o verde do cartão aparece). */
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(inviteUrl, {
      type: 'image/png',
      width: 560,
      margin: 4,
      errorCorrectionLevel: 'M',
      color: { dark: '#111111', light: '#ffffff' },
    })
      .then((url) => {
        if (alive) setQrDataUrl(url);
      })
      .catch(() => {
        if (alive) setQrError(true);
      });
    return () => {
      alive = false;
    };
  }, [inviteUrl]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [requestClose]);

  /* Busca com debounce: só dispara a partir de 2 caracteres. */
  useEffect(() => {
    if (!isSearchableQuery(query)) return;

    let alive = true;
    const timer = window.setTimeout(() => {
      setSearching(true);
      searchPlayers(query, { excludeId: selfId })
        .then((players) => {
          if (!alive) return;
          setResults(players);
          setSearchError(null);
        })
        .catch((error: unknown) => {
          if (!alive) return;
          setResults([]);
          setSearchError(
            error instanceof PlayerSearchOfflineError
              ? 'Conecte-se à internet para buscar jogadores.'
              : 'Não foi possível buscar agora. Tente novamente.',
          );
        })
        .finally(() => {
          if (alive) setSearching(false);
        });
    }, 350);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [query, selfId]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!isSearchableQuery(value)) {
      setResults([]);
      setSearchError(null);
      setSearching(false);
    }
  };

  const handleSelectPanel = (next: AddPanel) => {
    if (next === panel) return;
    standaloneSound.playMove();
    setPanel(next);
  };

  const handleAddPlayer = (player: PlayerSearchResult) => {
    if (addedCodes.has(player.id)) return;
    standaloneSound.playMove();
    onAddPlayer({
      code: player.id,
      name: player.displayName || player.username || 'Jogador',
    });
    setAddedCodes((current) => {
      const next = new Set(current);
      next.add(player.id);
      return next;
    });
  };

  const handleSendLink = async () => {
    if (sending) return;
    standaloneSound.playMove();
    setSending(true);
    try {
      const result = await shareNative({
        title: 'Amigo no EVO FIT',
        text: `${name} quer ser seu amigo no EVO FIT.`,
        url: inviteUrl,
      });

      if (result === 'shared') {
        showToast('Convite enviado!', 'success');
        return;
      }
      if (result === 'cancelled') return;

      const copied = await copyText(inviteUrl);
      if (copied) {
        setManualLink('');
        showToast('Link de convite copiado!', 'success');
      } else {
        setManualLink(inviteUrl);
        showToast('Copie o link de convite abaixo.', 'info');
      }
    } finally {
      setSending(false);
    }
  };

  const term = sanitizeSearchQuery(query);
  const canSearch = isSearchableQuery(query);

  const resultsContent = (() => {
    if (searching) {
      return <p className="friend-qr__empty">Buscando jogadores…</p>;
    }
    if (searchError) {
      return <p className="friend-qr__empty">{searchError}</p>;
    }
    if (!canSearch) {
      return (
        <p className="friend-qr__empty">
          Digite ao menos 2 letras do nome, @username ou tag do jogador.
        </p>
      );
    }
    if (results.length === 0) {
      return (
        <p className="friend-qr__empty">
          Nenhum jogador encontrado para “{term}”.
        </p>
      );
    }
    return results.map((player) => {
      const added = addedCodes.has(player.id);
      return (
        <div className="friend-qr__result" key={player.id} role="listitem">
          <div className="friend-qr__avatar" aria-hidden="true">
            {initialOf(player.displayName || player.username)}
          </div>
          <div className="friend-qr__result-info">
            <span className="friend-qr__result-name">{player.displayName}</span>
            <span className="friend-qr__result-handle">@{player.username}</span>
          </div>
          <button
            type="button"
            className={`friend-qr__add${added ? ' is-added' : ''}`}
            onClick={() => handleAddPlayer(player)}
            disabled={added}
          >
            {added ? <CheckIcon size={13} /> : <PlusIcon size={13} />}
            {added ? 'Adicionado' : 'Adicionar'}
          </button>
        </div>
      );
    });
  })();

  return createPortal(
    <div
      className={`friend-qr-overlay${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="friend-qr-title"
      onClick={() => requestClose()}
    >
      <div className="friend-qr-card" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="friend-qr__close"
          onClick={() => {
            standaloneSound.playMove();
            requestClose();
          }}
          aria-label="Fechar"
        >
          <XIcon size={18} />
        </button>

        <div className="friend-qr__header">
          <h2 id="friend-qr-title" className="friend-qr__title">
            <UsersIcon size={20} aria-hidden="true" />
            Adicionar Amigos
          </h2>
          <p className="friend-qr__subtitle">
            Compartilhe seu QR Code ou encontre um jogador pelo nome, @username ou tag.
          </p>
        </div>

        <div className="friend-qr__tabs" role="tablist" aria-label="Formas de adicionar">
          <button
            type="button"
            role="tab"
            aria-selected={panel === 'qr'}
            className={`friend-qr__tab${panel === 'qr' ? ' is-active' : ''}`}
            onClick={() => handleSelectPanel('qr')}
          >
            <QrCodeIcon size={15} />
            Meu QR Code
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={panel === 'buscar'}
            className={`friend-qr__tab${panel === 'buscar' ? ' is-active' : ''}`}
            onClick={() => handleSelectPanel('buscar')}
          >
            <SearchIcon size={15} />
            Buscar jogador
          </button>
        </div>

        <div className="friend-qr__body">
          {panel === 'qr' ? (
            <div className="friend-qr__panel friend-qr__panel--qr">
              <div className="friend-qr__code-frame">
                <span className="friend-qr__corner friend-qr__corner--tl" aria-hidden="true" />
                <span className="friend-qr__corner friend-qr__corner--tr" aria-hidden="true" />
                <span className="friend-qr__corner friend-qr__corner--bl" aria-hidden="true" />
                <span className="friend-qr__corner friend-qr__corner--br" aria-hidden="true" />
                <div className="friend-qr__code">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt={`QR Code de convite de ${name}`} draggable={false} />
                  ) : (
                    <div className="friend-qr__placeholder">
                      {qrError ? 'Não foi possível gerar o QR.' : 'Gerando QR…'}
                    </div>
                  )}
                </div>
              </div>

              <div className="friend-qr__nameplate">
                <span className="friend-qr__name">{name}</span>
                <span className="friend-qr__code-label">Código de amigo</span>
              </div>

              <p className="friend-qr__hint">
                Quem escanear este código será adicionado imediatamente à sua lista de amigos.
              </p>
            </div>
          ) : (
            <div className="friend-qr__panel friend-qr__panel--search">
              <div className="friend-qr__search">
                <SearchIcon size={16} />
                <input
                  id="friend-qr-search"
                  type="search"
                  placeholder="Pesquisar por nome, @username ou tag"
                  value={query}
                  maxLength={32}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  onChange={(event) => handleQueryChange(event.target.value)}
                  aria-label="Pesquisar jogador por nome, username ou tag"
                />
                {query.length > 0 && (
                  <button
                    type="button"
                    className="friend-qr__search-clear"
                    onClick={() => handleQueryChange('')}
                    aria-label="Limpar busca"
                  >
                    <XIcon size={14} />
                  </button>
                )}
              </div>

              <div className="friend-qr__results" role="list" aria-live="polite">
                {resultsContent}
              </div>
            </div>
          )}
        </div>

        {panel === 'qr' && (
          <div className="friend-qr__footer">
            <div className="friend-qr__actions">
              <button
                type="button"
                className="friend-qr__action"
                onClick={handleSendLink}
                disabled={sending}
              >
                {sending ? 'Enviando…' : 'Enviar Link'}
              </button>
              <button
                type="button"
                className="friend-qr__action"
                onClick={() => {
                  standaloneSound.playMove();
                  requestClose(onScan);
                }}
              >
                Escanear
              </button>
            </div>

            {manualLink && (
              <div className="friend-qr__manual">
                <label htmlFor="friend-qr-link">Link de convite</label>
                <input
                  id="friend-qr-link"
                  type="text"
                  readOnly
                  value={manualLink}
                  onFocus={(event) => event.currentTarget.select()}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
