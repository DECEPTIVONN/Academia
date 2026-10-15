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
import { Music2, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { getMusicState, nextTrack, prevTrack, togglePlayback, type MusicState } from './audio-engine';
import { useLibraryStore } from './media-store';
import { PREF_KEYS, readLS } from '@/features/profile/profile-data';
import './music.css';

export function WorkoutNowPlayingBar() {
  const [state, setState] = useState<MusicState>(() => getMusicState());
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

  return (
    <div className="wnp" role="region" aria-label="Música do treino">
      <div className="wnp__art" aria-hidden="true">
        <Music2 size={18} />
      </div>
      <div className="wnp__meta">
        <span className="wnp__title">{state.title || 'Nada tocando'}</span>
        <span className="wnp__artist">
          {state.artist || (activePlaylistId ? 'Sua playlist' : 'Música do app')}
        </span>
      </div>
      <div className="wnp__controls">
        {state.canPrev && (
          <button type="button" className="wnp__btn" onClick={prevTrack} aria-label="Retroceder">
            <SkipBack size={17} fill="currentColor" />
          </button>
        )}
        <button
          type="button"
          className="wnp__btn wnp__btn--play"
          onClick={togglePlayback}
          aria-label={state.playing ? 'Pausar' : 'Tocar'}
        >
          {state.playing ? (
            <Pause size={17} fill="currentColor" />
          ) : (
            <Play size={17} fill="currentColor" />
          )}
        </button>
        <button type="button" className="wnp__btn" onClick={nextTrack} aria-label="Avançar">
          <SkipForward size={17} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}

export default WorkoutNowPlayingBar;
