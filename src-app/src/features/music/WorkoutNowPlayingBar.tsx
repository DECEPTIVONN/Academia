/**
 * WorkoutNowPlayingBar.tsx — música no rodapé da Ficha (v4.21.0-music)
 *
 * Quando a opção "músicas no treino" está ativa (pref
 * academia_pref_workout_music) OU uma playlist de treino está escolhida, a
 * interface de treino (overlay da Ficha) exibe, no rodapé, a faixa que está
 * tocando — no estilo do mini-player da interface de Músicas — com botões
 * RETROCEDER / PAUSAR / AVANÇAR.
 *
 * Renderizado dentro de .ficha-overlay (position:fixed → a barra ancora no
 * rodapé do overlay da Ficha, acima do conteúdo e abaixo dos modais).
 */

import { useEffect, useState } from 'react';
import { ListMusic, Music2, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import {
  getMusicState,
  nextTrack,
  prevTrack,
  togglePlayback,
  type MusicState,
} from './audio-engine';
import { QueueList } from './QueueList';
import { useLibraryStore } from './media-store';
import { PREF_KEYS, readLS } from '@/features/profile/profile-data';
import './music.css';

export function WorkoutNowPlayingBar() {
  const [state, setState] = useState<MusicState>(() => getMusicState());
  const [queueOpen, setQueueOpen] = useState(false);
  const activePlaylistId = useLibraryStore((s) => s.activePlaylistId);
  const [prefOn, setPrefOn] = useState(() => readLS(PREF_KEYS.workoutMusic) !== 'false');

  /* Estado do motor */
  useEffect(() => {
    const onState = (e: Event) => setState((e as CustomEvent<MusicState>).detail);
    window.addEventListener('academia:music-state', onState);
    return () => window.removeEventListener('academia:music-state', onState);
  }, []);

  /* Pref pode mudar em Configurações durante o treino */
  useEffect(() => {
    const onMusic = () => setPrefOn(readLS(PREF_KEYS.workoutMusic) !== 'false');
    window.addEventListener('academia:music-changed', onMusic);
    return () => window.removeEventListener('academia:music-changed', onMusic);
  }, []);

  /* Visível: música configurada para o treino (faixa do app OU playlist) */
  if (!prefOn && !activePlaylistId) return null;

  const hasQueue = state.queueLength > 0;

  return (
    <>
      {queueOpen && hasQueue && (
        <div className="wnp-queue" role="region" aria-label="Fila do treino">
          <div className="wnp-queue__head">
            <span>
              <ListMusic size={15} /> Fila do treino
            </span>
            <button
              type="button"
              className="wnp-queue__close"
              onClick={() => setQueueOpen(false)}
              aria-label="Fechar fila"
            >
              <X size={15} />
            </button>
          </div>
          <QueueList state={state} />
        </div>
      )}
      <div className="wnp" role="region" aria-label="Música do treino">
        <div className={`wnp__art${state.artwork ? ' wnp__art--image' : ''}`} aria-hidden="true">
          {state.artwork ? <img src={state.artwork} alt="" loading="lazy" /> : <Music2 size={18} />}
        </div>
        <div className="wnp__meta">
          <span className="wnp__title">{state.title || 'Nada tocando'}</span>
          <span className="wnp__artist">
            {state.artist || (activePlaylistId ? 'Sua playlist' : 'Música do app')}
          </span>
        </div>
        <div className="wnp__controls">
          <button
            type="button"
            className={`wnp__btn${queueOpen ? ' wnp__btn--active' : ''}`}
            onClick={() => setQueueOpen((open) => !open)}
            disabled={!hasQueue}
            aria-label="Mostrar fila"
            aria-expanded={queueOpen}
          >
            <ListMusic size={17} />
          </button>
          {state.canPrev && (
            <button type="button" className="wnp__btn" onClick={prevTrack} aria-label="Retroceder">
              <SkipBack size={17} />
            </button>
          )}
          <button
            type="button"
            className="wnp__btn wnp__btn--play"
            onClick={togglePlayback}
            aria-label={state.playing ? 'Pausar' : 'Tocar'}
          >
            {state.playing ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button type="button" className="wnp__btn" onClick={nextTrack} aria-label="Avançar">
            <SkipForward size={17} />
          </button>
        </div>
      </div>
    </>
  );
}

export default WorkoutNowPlayingBar;
