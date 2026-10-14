/**
 * MusicOverlay.tsx — Interface "Músicas e Playlists" (v4.19.0-music)
 *
 * Overlay fullscreen inspirado nas referências do YouTube Music fixadas:
 *  • Home       — "Escolhas rápidas" (cards) + lista "Músicas";
 *  • Playlists  — grade "Listas de reprodução" com FAB "+", empty state
 *                 "Nenhuma playlist ainda / Criar Playlist";
 *  • Biblioteca — envio de músicas (upload local → IndexedDB), links do
 *                 YouTube/Spotify e playlists externas adicionadas;
 *  • Mini-player fixo no rodapé (faixa atual + play/pause).
 *
 * Aberto via window.dispatchEvent('academia:open-music') — gatilho do card
 * de Configurações (Exibição). ESC/X fecham.
 *
 * Cores seguem o padrão v4.8.4-color-standard (fundo #07070b, cards #0b0b10,
 * hairlines rgba(255,255,255,0.08), accent var(--primary)).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Disc3,
  Home,
  ListMusic,
  Library,
  MoreVertical,
  Music2,
  Pause,
  Play,
  Plus,
  Shuffle,
  Upload,
  Youtube,
  Radio,
  Trash2,
  Check,
} from 'lucide-react';
import {
  parseSpotifyRef,
  parseYouTubeRef,
  useLibraryStore,
  type Playlist,
  type UploadTrack,
} from './media-store';
import {
  getMusicState,
  playPlaylistFromUi,
  playSiteTrackFromUi,
  togglePlayback,
  type MusicState,
} from './audio-engine';
import './music.css';

/* ───────────────────────── Faixas fixas do site ───────────────────────── */

const SITE_TRACKS_UI = [
  { id: 'main' as const, title: 'MAIN', artist: 'Trilha Evo Fit', tint: '#8b5cf6' },
  {
    id: 'workout' as const,
    title: 'Black Panther: War For Wakanda',
    artist: "Marvel's Avengers Game",
    tint: '#b45309',
  },
  { id: 'result' as const, title: 'RESULT', artist: 'Trilha Evo Fit', tint: '#22c55e' },
  { id: 'missions' as const, title: 'Revenger Phoenix', artist: 'Trilha Evo Fit', tint: '#e11d48' },
];

type Tab = 'home' | 'playlists' | 'biblioteca';

interface MusicOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function MusicOverlay({ open, onClose }: MusicOverlayProps) {
  const [tab, setTab] = useState<Tab>('home');
  const [state, setState] = useState<MusicState>(() => getMusicState());

  const library = useLibraryStore();
  useEffect(() => {
    if (open) library.hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Estado do motor (mini-player) */
  useEffect(() => {
    if (!open) return undefined;
    const onState = (e: Event) => setState((e as CustomEvent<MusicState>).detail);
    window.addEventListener('academia:music-state', onState);
    return () => window.removeEventListener('academia:music-state', onState);
  }, [open]);

  /* ESC/X fecham */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="mu-overlay" role="dialog" aria-modal="true" aria-label="Músicas e Playlists">
      <header className="mu-header">
        <button type="button" className="mu-icon-btn" onClick={onClose} aria-label="Fechar">
          <ArrowLeft size={22} />
        </button>
        <div className="mu-header__titles">
          <span className="mu-header__eyebrow">EVO FIT</span>
          <h2 className="mu-header__title">Músicas</h2>
        </div>
      </header>

      <div className="mu-scroll">
        {tab === 'home' && <HomeView onGoPlaylists={() => setTab('playlists')} />}
        {tab === 'playlists' && <PlaylistsView />}
        {tab === 'biblioteca' && <BibliotecaView />}
        <div style={{ height: 120 }} />
      </div>

      {/* Mini-player */}
      <div className="mu-mini">
        <div className="mu-mini__body">
          <div className="mu-mini__art">
            <Music2 size={18} />
          </div>
          <div className="mu-mini__meta">
            <span className="mu-mini__title">{state.title || 'Nada tocando'}</span>
            <span className="mu-mini__artist">{state.artist || 'Escolha uma música'}</span>
          </div>
        </div>
        <button
          type="button"
          className="mu-mini__play"
          onClick={togglePlayback}
          aria-label={state.playing ? 'Pausar' : 'Tocar'}
        >
          {state.playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
      </div>

      {/* Bottom nav estilo YouTube Music */}
      <nav className="mu-nav">
        <button
          type="button"
          className={`mu-nav__btn ${tab === 'home' ? 'mu-nav__btn--active' : ''}`}
          onClick={() => setTab('home')}
        >
          <Home size={20} />
          <span>Início</span>
        </button>
        <button
          type="button"
          className={`mu-nav__btn ${tab === 'playlists' ? 'mu-nav__btn--active' : ''}`}
          onClick={() => setTab('playlists')}
        >
          <ListMusic size={20} />
          <span>Listas</span>
        </button>
        <button
          type="button"
          className={`mu-nav__btn ${tab === 'biblioteca' ? 'mu-nav__btn--active' : ''}`}
          onClick={() => setTab('biblioteca')}
        >
          <Library size={20} />
          <span>Biblioteca</span>
        </button>
      </nav>
    </div>
  );
}

/* ────────────────────────────── HOME ─────────────────────────────────── */

function HomeView({ onGoPlaylists }: { onGoPlaylists: () => void }) {
  const { tracks, playlists } = useLibraryStore();

  return (
    <div className="mu-page">
      <section className="mu-section">
        <div className="mu-section__head">
          <h3 className="mu-section__title">Escolhas rápidas</h3>
          <span className="mu-section__sub">Trilhas do app e suas playlists</span>
        </div>
        <div className="mu-quick-grid">
          {SITE_TRACKS_UI.map((t) => (
            <button
              key={t.id}
              type="button"
              className="mu-quick-card"
              onClick={() => playSiteTrackFromUi(t.id)}
            >
              <div className="mu-quick-card__art" style={{ background: `linear-gradient(135deg, ${t.tint}, #0b0b10)` }}>
                <Disc3 size={26} />
              </div>
              <span className="mu-quick-card__name">{t.title}</span>
            </button>
          ))}
          {playlists.map((pl) => (
            <button
              key={pl.id}
              type="button"
              className="mu-quick-card"
              onClick={() => {
                if (pl.items.length > 0) void playPlaylistFromUi(pl.items);
                else onGoPlaylists();
              }}
            >
              <div className="mu-quick-card__art mu-quick-card__art--pl">
                <ListMusic size={26} />
              </div>
              <span className="mu-quick-card__name">{pl.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mu-section">
        <div className="mu-section__head">
          <h3 className="mu-section__title">Músicas</h3>
        </div>
        <ul className="mu-list">
          {SITE_TRACKS_UI.map((t) => (
            <li key={t.id} className="mu-row">
              <button type="button" className="mu-row__main" onClick={() => playSiteTrackFromUi(t.id)}>
                <div className="mu-row__art" style={{ background: `linear-gradient(135deg, ${t.tint}, #0b0b10)` }}>
                  <Music2 size={16} />
                </div>
                <div className="mu-row__meta">
                  <span className="mu-row__title">{t.title}</span>
                  <span className="mu-row__sub">{t.artist} • App</span>
                </div>
              </button>
            </li>
          ))}
          {tracks.map((t) => (
            <UploadRow key={t.id} track={t} />
          ))}
          {tracks.length === 0 && (
            <li className="mu-note">
              Envie suas próprias músicas na aba Biblioteca para montar playlists de treino.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function UploadRow({ track }: { track: UploadTrack }) {
  return (
    <li className="mu-row">
      <button
        type="button"
        className="mu-row__main"
        onClick={() => void playPlaylistFromUi([{ id: `ui-${track.id}`, kind: 'upload', trackId: track.id, title: track.name }])}
      >
        <div className="mu-row__art mu-row__art--user">
          <Music2 size={16} />
        </div>
        <div className="mu-row__meta">
          <span className="mu-row__title">{track.name}</span>
          <span className="mu-row__sub">{track.artist} • Sua música</span>
        </div>
      </button>
    </li>
  );
}

/* ──────────────────────────── PLAYLISTS ──────────────────────────────── */

function PlaylistsView() {
  const { playlists, createPlaylist, deletePlaylist, setActivePlaylist, activePlaylistId } =
    useLibraryStore();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [openPl, setOpenPl] = useState<Playlist | null>(null);
  const [menuPl, setMenuPl] = useState<string | null>(null);

  /* Detalhe de playlist aberta (espelha o objeto atualizado do store) */
  const openPlLive = openPl ? playlists.find((p) => p.id === openPl.id) ?? null : null;

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const pl = createPlaylist(trimmed);
    setCreating(false);
    setName('');
    setOpenPl(pl);
  };

  if (openPlLive) {
    return (
      <PlaylistDetail
        playlist={openPlLive}
        isWorkout={activePlaylistId === openPlLive.id}
        onBack={() => setOpenPl(null)}
        onSetWorkout={(on) => setActivePlaylist(on ? openPlLive.id : null)}
      />
    );
  }

  return (
    <div className="mu-page">
      <section className="mu-section">
        <div className="mu-section__head">
          <h3 className="mu-section__title">Listas de reprodução</h3>
        </div>

        {playlists.length === 0 ? (
          <div className="mu-empty">
            <ListMusic size={54} className="mu-empty__icon" />
            <p className="mu-empty__text">Nenhuma playlist ainda</p>
            <button type="button" className="mu-btn" onClick={() => setCreating(true)}>
              Criar Playlist
            </button>
          </div>
        ) : (
          <div className="mu-pl-grid">
            {playlists.map((pl) => (
              <div key={pl.id} className="mu-pl-card">
                <button type="button" className="mu-pl-card__open" onClick={() => setOpenPl(pl)}>
                  <div className="mu-pl-card__art">
                    <ListMusic size={30} />
                  </div>
                  <span className="mu-pl-card__name">{pl.name}</span>
                  <span className="mu-pl-card__count">
                    {pl.items.length} {pl.items.length === 1 ? 'música' : 'músicas'}
                  </span>
                </button>
                <button
                  type="button"
                  className="mu-pl-card__menu"
                  onClick={() => setMenuPl(menuPl === pl.id ? null : pl.id)}
                  aria-label="Opções da playlist"
                >
                  <MoreVertical size={18} />
                </button>
                {menuPl === pl.id && (
                  <div className="mu-menu">
                    <button
                      type="button"
                      className="mu-menu__item mu-menu__item--danger"
                      onClick={() => {
                        deletePlaylist(pl.id);
                        setMenuPl(null);
                      }}
                    >
                      <Trash2 size={15} /> Excluir playlist
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FAB "+" —Criar playlist / YouTube / Spotify */}
      <button
        type="button"
        className="mu-fab"
        onClick={() => setCreating(true)}
        aria-label="Criar playlist"
      >
        <Plus size={26} />
      </button>

      {creating && (
        <div className="mu-modal" onClick={() => setCreating(false)}>
          <div className="mu-modal__panel" onClick={(e) => e.stopPropagation()}>
            <h4 className="mu-modal__title">Criar Playlist</h4>
            <input
              className="mu-input"
              placeholder="Nome da playlist"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className="mu-modal__actions">
              <button type="button" className="mu-btn mu-btn--ghost" onClick={() => setCreating(false)}>
                Cancelar
              </button>
              <button type="button" className="mu-btn" onClick={handleCreate}>
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Detalhe da playlist ─────────────────────────── */

function PlaylistDetail({
  playlist,
  isWorkout,
  onBack,
  onSetWorkout,
}: {
  playlist: Playlist;
  isWorkout: boolean;
  onBack: () => void;
  onSetWorkout: (on: boolean) => void;
}) {
  const { tracks, removeItem, addUploadToPlaylist, addExternalToPlaylist } = useLibraryStore();
  const [adding, setAdding] = useState(false);
  const [link, setLink] = useState('');
  const [linkKind, setLinkKind] = useState<'youtube' | 'spotify'>('youtube');
  const [linkErr, setLinkErr] = useState('');

  const addLink = () => {
    setLinkErr('');
    if (linkKind === 'youtube') {
      const parsed = parseYouTubeRef(link);
      if (!parsed) {
        setLinkErr('Link do YouTube inválido.');
        return;
      }
      addExternalToPlaylist(
        playlist.id,
        'youtube',
        parsed.id,
        parsed.kind === 'list' ? 'Playlist do YouTube' : 'Vídeo do YouTube',
      );
    } else {
      const id = parseSpotifyRef(link);
      if (!id) {
        setLinkErr('Link do Spotify inválido.');
        return;
      }
      addExternalToPlaylist(playlist.id, 'spotify', id, 'Playlist do Spotify');
    }
    setLink('');
  };

  const notInPlaylist = useMemo(
    () => tracks.filter((t) => !playlist.items.some((it) => it.kind === 'upload' && it.trackId === t.id)),
    [tracks, playlist.items],
  );

  return (
    <div className="mu-page">
      <section className="mu-section">
        <button type="button" className="mu-back" onClick={onBack}>
          <ArrowLeft size={17} /> Listas de reprodução
        </button>

        <div className="mu-pl-hero">
          <div className="mu-pl-hero__art">
            <ListMusic size={34} />
          </div>
          <div className="mu-pl-hero__meta">
            <h3 className="mu-pl-hero__name">{playlist.name}</h3>
            <span className="mu-pl-hero__count">{playlist.items.length} itens</span>
          </div>
        </div>

        <div className="mu-pl-actions">
          <button
            type="button"
            className="mu-btn"
            disabled={playlist.items.length === 0}
            onClick={() => void playPlaylistFromUi(playlist.items)}
          >
            <Play size={16} fill="currentColor" /> Tocar
          </button>
          <button
            type="button"
            className="mu-btn mu-btn--ghost"
            disabled={playlist.items.length === 0}
            onClick={() => void playPlaylistFromUi([...playlist.items].sort(() => Math.random() - 0.5))}
          >
            <Shuffle size={16} /> Aleatório
          </button>
          <button
            type="button"
            className={`mu-btn ${isWorkout ? 'mu-btn--active' : 'mu-btn--ghost'}`}
            onClick={() => onSetWorkout(!isWorkout)}
            title="Tocar automaticamente durante o treino"
          >
            {isWorkout ? <Check size={16} /> : <Plus size={16} />}
            {isWorkout ? 'Treino ativo' : 'Usar no treino'}
          </button>
        </div>

        {playlist.items.length === 0 ? (
          <div className="mu-empty">
            <Music2 size={48} className="mu-empty__icon" />
            <p className="mu-empty__text">Adicione suas músicas abaixo</p>
          </div>
        ) : (
          <ul className="mu-list">
            {playlist.items.map((it) => (
              <li key={it.id} className="mu-row">
                <button
                  type="button"
                  className="mu-row__main"
                  onClick={() => void playPlaylistFromUi(playlist.items)}
                >
                  <div className="mu-row__art mu-row__art--user">
                    {it.kind === 'youtube' ? (
                      <Youtube size={16} />
                    ) : it.kind === 'spotify' ? (
                      <Radio size={16} />
                    ) : (
                      <Music2 size={16} />
                    )}
                  </div>
                  <div className="mu-row__meta">
                    <span className="mu-row__title">{it.title}</span>
                    <span className="mu-row__sub">
                      {it.kind === 'upload' ? 'Sua música' : it.kind === 'youtube' ? 'YouTube' : 'Spotify'}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className="mu-icon-btn mu-icon-btn--sm"
                  onClick={() => removeItem(playlist.id, it.id)}
                  aria-label="Remover da playlist"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className="mu-btn mu-btn--block" onClick={() => setAdding(true)}>
          <Plus size={16} /> Adicionar músicas
        </button>
      </section>

      {adding && (
        <div className="mu-modal" onClick={() => setAdding(false)}>
          <div className="mu-modal__panel" onClick={(e) => e.stopPropagation()}>
            <h4 className="mu-modal__title">Adicionar músicas</h4>

            {notInPlaylist.length > 0 ? (
              <>
                <span className="mu-modal__label">Suas músicas</span>
                <ul className="mu-pick-list">
                  {notInPlaylist.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="mu-pick"
                        onClick={() => addUploadToPlaylist(playlist.id, t.id)}
                      >
                        <Music2 size={15} /> {t.name}
                        <span className="mu-pick__hint">adicionar</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mu-note">Todas as suas músicas já estão nesta playlist.</p>
            )}

            <span className="mu-modal__label">Ou cole um link</span>
            <div className="mu-seg">
              <button
                type="button"
                className={`mu-seg__btn ${linkKind === 'youtube' ? 'mu-seg__btn--active' : ''}`}
                onClick={() => setLinkKind('youtube')}
              >
                <Youtube size={15} /> YouTube
              </button>
              <button
                type="button"
                className={`mu-seg__btn ${linkKind === 'spotify' ? 'mu-seg__btn--active' : ''}`}
                onClick={() => setLinkKind('spotify')}
              >
                <Radio size={15} /> Spotify
              </button>
            </div>
            <input
              className="mu-input"
              placeholder={
                linkKind === 'youtube'
                  ? 'https://youtube.com/playlist?list=...'
                  : 'https://open.spotify.com/playlist/...'
              }
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            {linkErr && <p className="mu-err">{linkErr}</p>}

            <div className="mu-modal__actions">
              <button type="button" className="mu-btn mu-btn--ghost" onClick={() => setAdding(false)}>
                Fechar
              </button>
              <button type="button" className="mu-btn" onClick={addLink}>
                Adicionar link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── BIBLIOTECA ─────────────────────────────── */

function BibliotecaView() {
  const { tracks, playlists, addUpload, removeTrack, createPlaylist, addExternalToPlaylist } =
    useLibraryStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [linkModal, setLinkModal] = useState<null | 'youtube' | 'spotify'>(null);
  const [link, setLink] = useState('');
  const [linkErr, setLinkErr] = useState('');
  const [linkTarget, setLinkTarget] = useState<string>('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('audio/')) continue;
        await addUpload(file);
      }
    } finally {
      setBusy(false);
    }
  };

  const addExternalLink = () => {
    setLinkErr('');
    if (linkKindIsYoutube(linkModal)) {
      const parsed = parseYouTubeRef(link);
      if (!parsed) {
        setLinkErr('Link do YouTube inválido.');
        return;
      }
      applyExternal('youtube', parsed.id, parsed.kind === 'list' ? 'Playlist do YouTube' : 'Vídeo do YouTube');
    } else {
      const id = parseSpotifyRef(link);
      if (!id) {
        setLinkErr('Link do Spotify inválido.');
        return;
      }
      applyExternal('spotify', id, 'Playlist do Spotify');
    }
    setLink('');
    setLinkModal(null);
  };

  const linkKindIsYoutube = (k: null | 'youtube' | 'spotify') => k !== 'spotify';

  const applyExternal = (kind: 'youtube' | 'spotify', refId: string, title: string) => {
    // Alvo: playlist existente escolhida OU uma nova criada agora.
    let target = linkTarget;
    if (!target) {
      const pl = createPlaylist(title);
      target = pl.id;
    }
    addExternalToPlaylist(target, kind, refId, title);
  };

  return (
    <div className="mu-page">
      <section className="mu-section">
        <div className="mu-section__head">
          <h3 className="mu-section__title">Todas as músicas</h3>
          <span className="mu-section__sub">{tracks.length} enviadas</span>
        </div>

        <div className="mu-lib-actions">
          <button
            type="button"
            className="mu-btn mu-btn--block"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={16} /> {busy ? 'Enviando…' : 'Enviar músicas'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            multiple
            hidden
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="mu-lib-actions__row">
            <button type="button" className="mu-btn mu-btn--ghost" onClick={() => setLinkModal('youtube')}>
              <Youtube size={16} /> Playlist do YouTube
            </button>
            <button type="button" className="mu-btn mu-btn--ghost" onClick={() => setLinkModal('spotify')}>
              <Radio size={16} /> Playlist do Spotify
            </button>
          </div>
        </div>

        {tracks.length === 0 ? (
          <div className="mu-empty">
            <Upload size={48} className="mu-empty__icon" />
            <p className="mu-empty__text">Nenhuma música enviada ainda</p>
          </div>
        ) : (
          <ul className="mu-list">
            {tracks.map((t) => (
              <li key={t.id} className="mu-row">
                <button
                  type="button"
                  className="mu-row__main"
                  onClick={() =>
                    void playPlaylistFromUi([{ id: `ui-${t.id}`, kind: 'upload', trackId: t.id, title: t.name }])
                  }
                >
                  <div className="mu-row__art mu-row__art--user">
                    <Music2 size={16} />
                  </div>
                  <div className="mu-row__meta">
                    <span className="mu-row__title">{t.name}</span>
                    <span className="mu-row__sub">{t.artist}</span>
                  </div>
                </button>
                <button
                  type="button"
                  className="mu-icon-btn mu-icon-btn--sm"
                  onClick={() => void removeTrack(t.id)}
                  aria-label="Remover música"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {playlists.length > 0 && (
        <section className="mu-section">
          <div className="mu-section__head">
            <h3 className="mu-section__title">Playlists</h3>
          </div>
          <ul className="mu-list">
            {playlists.map((pl) => (
              <li key={pl.id} className="mu-row">
                <div className="mu-row__main">
                  <div className="mu-row__art mu-row__art--pl">
                    <ListMusic size={16} />
                  </div>
                  <div className="mu-row__meta">
                    <span className="mu-row__title">{pl.name}</span>
                    <span className="mu-row__sub">{pl.items.length} itens</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {linkModal && (
        <div className="mu-modal" onClick={() => setLinkModal(null)}>
          <div className="mu-modal__panel" onClick={(e) => e.stopPropagation()}>
            <h4 className="mu-modal__title">
              {linkKindIsYoutube(linkModal) ? 'Playlist do YouTube' : 'Playlist do Spotify'}
            </h4>
            <span className="mu-modal__label">Adicionar em</span>
            <select
              className="mu-input mu-select"
              value={linkTarget}
              onChange={(e) => setLinkTarget(e.target.value)}
            >
              <option value="">— Criar playlist nova —</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              className="mu-input"
              placeholder={
                linkKindIsYoutube(linkModal)
                  ? 'https://youtube.com/playlist?list=...'
                  : 'https://open.spotify.com/playlist/...'
              }
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            {linkErr && <p className="mu-err">{linkErr}</p>}
            <div className="mu-modal__actions">
              <button type="button" className="mu-btn mu-btn--ghost" onClick={() => setLinkModal(null)}>
                Cancelar
              </button>
              <button type="button" className="mu-btn" onClick={addExternalLink}>
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
