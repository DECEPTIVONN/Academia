/**
 * QueueList.tsx — lista compartilhada da fila (v4.41.0)
 *
 * Usada pelo player do treino e pelo mini-player flutuante. Mostra capa,
 * título, artista/origem e duração; tocar em uma linha pula direto para ela.
 */

import { Music2, Radio, Youtube } from 'lucide-react';
import {
  getMusicQueue,
  playQueueAt,
  type MusicState,
} from './audio-engine';
import type { PlaylistItem } from './media-store';

export function formatDuration(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return '';
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function itemSubtitle(item: PlaylistItem): string {
  if (item.artist) return item.artist;
  if (item.kind === 'upload') return 'Sua música';
  if (item.kind === 'site') return 'Trilha do app';
  if (item.kind === 'spotify') return item.sourceTitle || 'Spotify';
  return item.sourceTitle || 'YouTube';
}

function Art({ item }: { item: PlaylistItem }) {
  if (item.thumbnail) {
    return (
      <span className="music-queue__art">
        <img src={item.thumbnail} alt="" loading="lazy" />
      </span>
    );
  }
  return (
    <span className={`music-queue__art music-queue__art--${item.kind}`} aria-hidden="true">
      {item.kind === 'youtube' ? (
        <Youtube size={16} />
      ) : item.kind === 'site' ? (
        <Radio size={16} />
      ) : (
        <Music2 size={16} />
      )}
    </span>
  );
}

export function QueueList({
  state,
  className = '',
  empty = 'Nenhuma faixa na fila.',
}: {
  state: MusicState;
  className?: string;
  empty?: string;
}) {
  const queue = getMusicQueue();
  if (queue.length === 0) {
    return <p className={`music-queue__empty ${className}`.trim()}>{empty}</p>;
  }

  return (
    <ul className={`music-queue ${className}`.trim()} aria-label="Fila de reprodução">
      {queue.map((item, index) => {
        const current = index === state.queueIndex;
        return (
          <li key={item.id} className={current ? 'is-current' : undefined}>
            <button
              type="button"
              className="music-queue__item"
              onClick={() => playQueueAt(index)}
              aria-current={current ? 'true' : undefined}
              title={item.title}
            >
              <Art item={item} />
              <span className="music-queue__meta">
                <span className="music-queue__title">{item.title}</span>
                <span className="music-queue__sub">{itemSubtitle(item)}</span>
              </span>
              {item.durationSec ? (
                <span className="music-queue__dur">{formatDuration(item.durationSec)}</span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
