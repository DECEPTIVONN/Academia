/**
 * MusicOverlay.tsx — Interface "Músicas e Playlists" (v4.19.0-music)
 *
 * Overlay fullscreen inspirado nas referências do YouTube Music fixadas:
 *  • Home       — "Escolhas rápidas" (cards) + lista "Músicas";
 *  • Playlists  — grade "Listas de reprodução" com FAB "+", empty state
 *                 "Nenhuma playlist ainda / Criar Playlist";
 *  • Biblioteca — envio de músicas (upload local → IndexedDB), links do
 *                 YouTube/Spotify e playlists externas adicionadas.
 *
 * v4.20.0-music:
 *  • Clique em uma playlist (em QUALQUER aba) ENTRA na página da playlist;
 *  • Long-press (pressionar) numa playlist abre ações: Renomear, Trocar capa,
 *    Usar no treino e Excluir;
 *  • Capa customizável por playlist (imagem reduzida → data URL);
 *  • Badge "No treino" na playlist ativa (seleção de qual toca no treino).
 *
 * v4.21.0-music:
 *  • Transições animadas entre abas e ao entrar na playlist (mu-pane);
 *  • "Escolhas rápidas" = itens FIXADOS (álbuns/músicas) + tile "Fixar";
 *  • Uploads entram automaticamente na playlist "Suas músicas";
 *  • Trilhas do site passam a viver na playlist "Evo Fit";
 *  • Nome atribuível ao adicionar playlist do YouTube/Spotify;
 *  • Teclado Android: bottom-sheets sobem via visualViewport (--mu-kb).
 *
 * Aberto via window.dispatchEvent('academia:open-music'). ESC/X fecham.
 * Cores seguem o padrão v4.8.4-color-standard (fundo #07070b, accent var(--primary)).
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ArrowLeft,
  Disc3,
  Home,
  Image as ImageIcon,
  ListMusic,
  Library,
  Loader2,
  MoreVertical,
  Music2,
  Pause,
  Pencil,
  Pin,
  Play,
  Plus,
  RefreshCw,
  Shuffle,
  Upload,
  Youtube,
  Radio,
  Trash2,
  Check,
  Dumbbell,
  X,
} from 'lucide-react';
import {
  isExternalPlaylistItem,
  parseSpotifyLink,
  parseYouTubeRef,
  pinPlaylistKey,
  pinSiteKey,
  pinTrackKey,
  useLibraryStore,
  type Playlist,
  type PlaylistItem,
  type UploadTrack,
} from './media-store';
import { spotifyEmbedUrl } from './external-music';
import {
  getMusicState,
  playPlaylistFromUi,
  playSiteTrackFromUi,
  togglePlayback,
  type MusicState,
} from './audio-engine';
import { useKeyboardInset } from './useKeyboardInset';
import './music.css';

/* ───────────────────────── Faixas fixas do site ───────────────────────── */

const SITE_TRACKS_UI = [
  {
    id: 'workout' as const,
    title: 'Black Panther: War For Wakanda',
    artist: "Marvel's Avengers Game",
    tint: '#b45309',
  },
  { id: 'missions' as const, title: 'Revenger Phoenix', artist: 'Trilha Evo Fit', tint: '#e11d48' },
];

type Tab = 'home' | 'playlists' | 'biblioteca';

/* v4.22.0 — ordenação da Biblioteca (1 toque = ordem, 2 toques = inverso) */
type SortKey = 'alpha' | 'recent' | 'plays' | 'duration';
const SORT_STORE = 'academia_music_sort_v1';
const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'alpha', label: 'Alfabético' },
  { key: 'recent', label: 'Mais recente' },
  { key: 'plays', label: 'Mais tocado' },
  { key: 'duration', label: 'Maior duração' },
];

interface SortPref {
  key: SortKey;
  dir: 1 | -1;
}

function readSortPref(): SortPref {
  try {
    const raw = localStorage.getItem(SORT_STORE);
    if (raw) {
      const p = JSON.parse(raw) as Partial<SortPref>;
      if (
        (p.key === 'alpha' || p.key === 'recent' || p.key === 'plays' || p.key === 'duration') &&
        (p.dir === 1 || p.dir === -1)
      ) {
        return { key: p.key, dir: p.dir };
      }
    }
  } catch {
    /* storage indisponível */
  }
  return { key: 'recent', dir: 1 };
}

/** Formata segundos → "m:ss" (exibição de duração na Biblioteca). */
function formatDur(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Ordena os uploads conforme a chave/direção escolhidas na Biblioteca. */
function sortTracks(tracks: UploadTrack[], pref: SortPref): UploadTrack[] {
  const list = [...tracks];
  const d = pref.dir;
  switch (pref.key) {
    case 'alpha':
      list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR') * d);
      break;
    case 'recent':
      list.sort((a, b) => (a.addedAt - b.addedAt) * -d);
      break;
    case 'plays':
      list.sort((a, b) => ((a.playCount ?? 0) - (b.playCount ?? 0)) * -d);
      break;
    case 'duration':
      list.sort((a, b) => ((a.durationSec ?? 0) - (b.durationSec ?? 0)) * -d);
      break;
  }
  return list;
}

interface MusicOverlayProps {
  open: boolean;
  onClose: () => void;
}

/* ───────────────────────────── Helpers ───────────────────────────────── */

/** Long-press (pressionar e segurar) que dispara ações sem conflitar com o clique. */
function useLongPress(onLongPress: () => void, onClick?: () => void) {
  const timer = useRef<number | null>(null);
  const fired = useRef(false);
  const sx = useRef(0);
  const sy = useRef(0);

  const cancel = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  return {
    onPointerDown: (e: ReactPointerEvent) => {
      fired.current = false;
      sx.current = e.clientX;
      sy.current = e.clientY;
      timer.current = window.setTimeout(() => {
        fired.current = true;
        onLongPress();
      }, 480);
    },
    onPointerMove: (e: ReactPointerEvent) => {
      if (timer.current == null) return;
      if (Math.abs(e.clientX - sx.current) > 10 || Math.abs(e.clientY - sy.current) > 10) cancel();
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onClick: (e: ReactMouseEvent) => {
      if (fired.current) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        onClick?.();
      }
    },
  };
}

/** Lê uma imagem e a reduz (~320px, JPEG) para usar como capa (data URL pequena). */
function readImageCover(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 320;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('canvas 2d indisponível'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('falha ao carregar imagem'));
    };
    img.src = url;
  });
}

/** Capa da playlist: imagem custom ou ícone fallback. */
function PlaylistArt({ pl, size = 30 }: { pl: Playlist; size?: number }) {
  if (pl.cover) return <img className="mu-cover" src={pl.cover} alt="" />;
  return <ListMusic size={size} />;
}

/* ────────────────────────────── OVERLAY ──────────────────────────────── */

export function MusicOverlay({ open, onClose }: MusicOverlayProps) {
  const [tab, setTab] = useState<Tab>('home');
  const [state, setState] = useState<MusicState>(() => getMusicState());
  const [openId, setOpenId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<Playlist | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const coverTargetRef = useRef<string | null>(null);
  /* v4.21.0 — teclado Android: altura real do teclado p/ os bottom-sheets */
  const kbInset = useKeyboardInset();

  const {
    playlists,
    hydrate,
    deletePlaylist,
    renamePlaylist,
    setPlaylistCover,
    setActivePlaylist,
    activePlaylistId,
    pinnedQuick,
    togglePin,
  } = useLibraryStore();

  useEffect(() => {
    if (open) hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Estado do motor (mini-player) */
  useEffect(() => {
    if (!open) return undefined;
    const onState = (e: Event) => setState((e as CustomEvent<MusicState>).detail);
    window.addEventListener('academia:music-state', onState);
    return () => window.removeEventListener('academia:music-state', onState);
  }, [open]);

  /* ESC: fecha modal → detalhe → overlay */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (renaming) setRenaming(null);
      else if (menuId) setMenuId(null);
      else if (openId) setOpenId(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, renaming, menuId, openId]);

  const openPlaylist = openId ? (playlists.find((p) => p.id === openId) ?? null) : null;
  const menuPlaylist = menuId ? (playlists.find((p) => p.id === menuId) ?? null) : null;

  const goToTab = (t: Tab) => {
    setOpenId(null);
    setTab(t);
  };

  const openCoverPicker = (plId: string) => {
    coverTargetRef.current = plId;
    coverRef.current?.click();
  };

  const handleCoverFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await readImageCover(file);
      if (coverTargetRef.current) setPlaylistCover(coverTargetRef.current, dataUrl);
    } catch {
      /* ignora falha de leitura */
    }
    coverTargetRef.current = null;
  };

  return (
    <div
      className="mu-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Músicas e Playlists"
      style={{
        ['--mu-kb' as string]: `${kbInset}px`,
        opacity: open ? 1 : 0,
        visibility: open ? 'visible' : 'hidden',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.25s ease, visibility 0.25s ease',
      }}
    >
      <header className="mu-header">
        <button type="button" className="mu-icon-btn" onClick={onClose} aria-label="Fechar">
          <ArrowLeft size={22} />
        </button>
        <div className="mu-header__titles">
          <span className="mu-header__eyebrow">EVO FIT</span>
          <h2 className="mu-header__title">{openPlaylist ? openPlaylist.name : 'Músicas'}</h2>
        </div>
      </header>

      <div className="mu-scroll">
        {/* v4.21.0 — key re-monta a aba/detalhe e dispara a transição CSS */}
        <div
          key={openPlaylist ? `pl-${openPlaylist.id}` : tab}
          className={openPlaylist ? 'mu-pane mu-pane--detail' : 'mu-pane'}
        >
          {openPlaylist ? (
            <PlaylistDetail
              playlist={openPlaylist}
              isWorkout={activePlaylistId === openPlaylist.id}
              onBack={() => setOpenId(null)}
              onSetWorkout={(on) => setActivePlaylist(on ? openPlaylist.id : null)}
              onOpenMenu={() => setMenuId(openPlaylist.id)}
            />
          ) : (
            <>
              {tab === 'home' && (
                <HomeView onOpenPlaylist={setOpenId} onOpenMenu={setMenuId} activePlaylistId={activePlaylistId} />
              )}
              {tab === 'playlists' && (
                <PlaylistsView onOpenPlaylist={setOpenId} onOpenMenu={setMenuId} />
              )}
              {tab === 'biblioteca' && (
                <BibliotecaView onOpenPlaylist={setOpenId} onOpenMenu={setMenuId} />
              )}
            </>
          )}
        </div>
        <div style={{ height: 120 }} />
      </div>

      {/* Mini-player fixo (controle rápido dentro da interface) */}
      <div className="mu-mini">
        <div className="mu-mini__body">
          <div className={`mu-mini__art${state.artwork ? ' mu-mini__art--image' : ''}`}>
            {state.artwork ? <img src={state.artwork} alt="" loading="lazy" /> : <Music2 size={18} />}
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
          {state.playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>

      {/* Bottom nav estilo YouTube Music */}
      <nav className="mu-nav">
        <button
          type="button"
          className={`mu-nav__btn ${tab === 'home' && !openPlaylist ? 'mu-nav__btn--active' : ''}`}
          onClick={() => goToTab('home')}
        >
          <Home size={20} />
          <span>Início</span>
        </button>
        <button
          type="button"
          className={`mu-nav__btn ${tab === 'playlists' && !openPlaylist ? 'mu-nav__btn--active' : ''}`}
          onClick={() => goToTab('playlists')}
        >
          <ListMusic size={20} />
          <span>Listas</span>
        </button>
        <button
          type="button"
          className={`mu-nav__btn ${tab === 'biblioteca' && !openPlaylist ? 'mu-nav__btn--active' : ''}`}
          onClick={() => goToTab('biblioteca')}
        >
          <Library size={20} />
          <span>Biblioteca</span>
        </button>
      </nav>

      {/* Input oculto de capa */}
      <input
        ref={coverRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void handleCoverFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {/* Sheet de ações da playlist (long-press) */}
      {menuPlaylist && (
        <PlaylistActionSheet
          playlist={menuPlaylist}
          isWorkout={activePlaylistId === menuPlaylist.id}
          isPinned={pinnedQuick.includes(pinPlaylistKey(menuPlaylist.id))}
          onClose={() => setMenuId(null)}
          onRename={() => {
            setRenaming(menuPlaylist);
            setMenuId(null);
          }}
          onCover={() => {
            openCoverPicker(menuPlaylist.id);
            setMenuId(null);
          }}
          onSetWorkout={(on) => {
            setActivePlaylist(on ? menuPlaylist.id : null);
            setMenuId(null);
          }}
          onTogglePin={() => {
            togglePin(pinPlaylistKey(menuPlaylist.id));
            setMenuId(null);
          }}
          onDelete={() => {
            deletePlaylist(menuPlaylist.id);
            setMenuId(null);
            setOpenId((cur) => (cur === menuPlaylist.id ? null : cur));
          }}
        />
      )}

      {/* Modal renomear */}
      {renaming && (
        <RenameModal
          playlist={renaming}
          onSave={(name) => {
            renamePlaylist(renaming.id, name);
            setRenaming(null);
          }}
          onClose={() => setRenaming(null)}
        />
      )}
    </div>
  );
}

/* ────────────────────────────── HOME ─────────────────────────────────── */

function HomeView({
  onOpenPlaylist,
  onOpenMenu,
  activePlaylistId,
}: {
  onOpenPlaylist: (id: string) => void;
  onOpenMenu: (id: string) => void;
  activePlaylistId: string | null;
}) {
  const { tracks, externalTracks, playlists, pinnedQuick, togglePin } = useLibraryStore();
  const [picking, setPicking] = useState(false);

  /* v4.22.0 — "playlist oculta" da aba Início: tocar qualquer música daqui
     monta a fila com TODAS as faixas visíveis (site + uploads), começando
     pela escolhida — quando uma termina, a próxima começa sozinha. */
  const homeQueue = useMemo<PlaylistItem[]>(
    () => [
      ...SITE_TRACKS_UI.map((t) => ({
        id: `ui-${t.id}`,
        kind: 'site' as const,
        siteId: t.id,
        title: t.title,
      })),
      ...tracks.map((t) => ({
        id: `ui-${t.id}`,
        kind: 'upload' as const,
        trackId: t.id,
        title: t.name,
      })),
      /* v4.42.0 — links individuais do YouTube também entram na fila oculta. */
      ...externalTracks.map((t) => ({
        id: `ui-ext-${t.id}`,
        kind: 'youtube' as const,
        refId: t.refId,
        refType: 'video' as const,
        title: t.title,
        artist: t.artist,
        thumbnail: t.thumbnail,
        durationSec: t.durationSec,
      })),
    ],
    [tracks, externalTracks],
  );

  const playFromHome = (uiId: string) => {
    const i = homeQueue.findIndex((it) => it.id === uiId);
    if (i < 0) return;
    const rotated = i > 0 ? [...homeQueue.slice(i), ...homeQueue.slice(0, i)] : homeQueue;
    void playPlaylistFromUi(rotated);
  };

  /* Itens FIXADOS nas Escolhas rápidas (álbuns, uploads e faixas do site) */
  const pinnedPlaylists = pinnedQuick
    .filter((k) => k.startsWith('pl:'))
    .map((k) => playlists.find((p) => p.id === k.slice(3)))
    .filter((p): p is Playlist => !!p);
  const pinnedTracks = pinnedQuick
    .filter((k) => k.startsWith('trk:'))
    .map((k) => tracks.find((t) => t.id === k.slice(4)))
    .filter((t): t is UploadTrack => !!t);
  const pinnedSite = pinnedQuick
    .filter((k) => k.startsWith('site:'))
    .map((k) => SITE_TRACKS_UI.find((s) => s.id === k.slice(5)))
    .filter((s): s is (typeof SITE_TRACKS_UI)[number] => !!s);

  return (
    <div className="mu-page">
      <section className="mu-section">
        <div className="mu-section__head">
          <h3 className="mu-section__title">Escolhas rápidas</h3>
          <span className="mu-section__sub">Álbuns e músicas que você fixar</span>
        </div>
        <div className="mu-quick-grid">
          {pinnedSite.map((t) => (
            <button
              key={t.id}
              type="button"
              className="mu-quick-card"
              onClick={() => playFromHome(`ui-${t.id}`)}
            >
              <div
                className="mu-quick-card__art"
                style={{ background: `linear-gradient(135deg, ${t.tint}, #0b0b10)` }}
              >
                <Disc3 size={26} />
              </div>
              <span className="mu-quick-card__name">{t.title}</span>
            </button>
          ))}
          {pinnedPlaylists.map((pl) => (
            <PlaylistQuickCard
              key={pl.id}
              playlist={pl}
              isWorkout={activePlaylistId === pl.id}
              onOpen={() => onOpenPlaylist(pl.id)}
              onMenu={() => onOpenMenu(pl.id)}
            />
          ))}
          {pinnedTracks.map((t) => (
            <button
              key={t.id}
              type="button"
              className="mu-quick-card"
              onClick={() => playFromHome(`ui-${t.id}`)}
            >
              <div className="mu-quick-card__art mu-quick-card__art--pl">
                <Music2 size={26} />
              </div>
              <span className="mu-quick-card__name">{t.name}</span>
            </button>
          ))}
          {/* Tile "+": abre o seletor para fixar álbuns/músicas */}
          <button
            type="button"
            className="mu-quick-card mu-quick-card--add"
            onClick={() => setPicking(true)}
            aria-label="Fixar álbuns e músicas"
          >
            <div className="mu-quick-card__art mu-quick-card__art--add">
              <Plus size={26} />
            </div>
            <span className="mu-quick-card__name">Fixar</span>
          </button>
        </div>
        {pinnedQuick.length === 0 && (
          <p className="mu-note">
            Toque em <strong>Fixar</strong> para escolher álbuns e músicas para as suas escolhas
            rápidas.
          </p>
        )}
      </section>

      <section className="mu-section">
        <div className="mu-section__head">
          <h3 className="mu-section__title">Músicas</h3>
        </div>
        <ul className="mu-list">
          {SITE_TRACKS_UI.map((t) => (
            <SiteTrackRow
              key={t.id}
              track={t}
              isPinned={pinnedQuick.includes(pinSiteKey(t.id))}
              onTogglePin={() => togglePin(pinSiteKey(t.id))}
              onPlay={() => playFromHome(`ui-${t.id}`)}
            />
          ))}
          {tracks.map((t) => (
            <UploadRow
              key={t.id}
              track={t}
              isPinned={pinnedQuick.includes(pinTrackKey(t.id))}
              onTogglePin={() => togglePin(pinTrackKey(t.id))}
              onPlay={() => playFromHome(`ui-${t.id}`)}
            />
          ))}
          {externalTracks.map((t) => {
            const uiId = `ui-ext-${t.id}`;
            const sub = [t.artist || 'YouTube', t.durationSec ? formatDur(t.durationSec) : '']
              .filter(Boolean)
              .join(' • ');
            return (
              <li key={t.id} className="mu-row">
                <button
                  type="button"
                  className="mu-row__main"
                  onClick={() => playFromHome(uiId)}
                  title="Tocar a partir desta faixa"
                >
                  <div className={`mu-row__art ${t.thumbnail ? 'mu-row__art--thumb' : 'mu-row__art--user'}`}>
                    {t.thumbnail ? <img src={t.thumbnail} alt="" loading="lazy" /> : <Youtube size={16} />}
                  </div>
                  <div className="mu-row__meta">
                    <span className="mu-row__title">{t.title}</span>
                    <span className="mu-row__sub">{sub}</span>
                  </div>
                </button>
              </li>
            );
          })}
          {tracks.length === 0 && externalTracks.length === 0 && (
            <li className="mu-note">
              Envie suas próprias músicas na aba Biblioteca para montar playlists de treino.
            </li>
          )}
        </ul>
      </section>

      {picking && <PinPickerModal onClose={() => setPicking(false)} />}
    </div>
  );
}

/** Linha de faixa fixa do site (Evo Fit) — toca e pode ser fixada. */
function SiteTrackRow({
  track,
  isPinned,
  onTogglePin,
  onPlay,
}: {
  track: (typeof SITE_TRACKS_UI)[number];
  isPinned: boolean;
  onTogglePin: () => void;
  /** v4.22.0 — na aba Início a fila oculta assume o clique (padrão: faixa isolada). */
  onPlay?: () => void;
}) {
  return (
    <li className="mu-row">
      <button type="button" className="mu-row__main" onClick={onPlay ?? (() => playSiteTrackFromUi(track.id))}>
        <div className="mu-row__art" style={{ background: `linear-gradient(135deg, ${track.tint}, #0b0b10)` }}>
          <Music2 size={16} />
        </div>
        <div className="mu-row__meta">
          <span className="mu-row__title">{track.title}</span>
          <span className="mu-row__sub">{track.artist} • App</span>
        </div>
      </button>
      <PinButton isPinned={isPinned} onToggle={onTogglePin} label={track.title} />
    </li>
  );
}

/** Botão de fixar/desafixar nas Escolhas rápidas (linhas de música). */
function PinButton({
  isPinned,
  onToggle,
  label,
}: {
  isPinned: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={isPinned ? 'mu-icon-btn mu-icon-btn--sm mu-pin-btn mu-pin-btn--on' : 'mu-icon-btn mu-icon-btn--sm mu-pin-btn'}
      onClick={onToggle}
      aria-pressed={isPinned}
      aria-label={`${isPinned ? 'Desafixar' : 'Fixar'} ${label} nas escolhas rápidas`}
    >
      <Pin size={15} />
    </button>
  );
}

/** Modal de fixar: lista álbuns + faixas com toggle de fixação. */
function PinPickerModal({ onClose }: { onClose: () => void }) {
  const { playlists, tracks, pinnedQuick, togglePin } = useLibraryStore();
  return (
    <div className="mu-modal" onClick={onClose}>
      <div className="mu-modal__panel" onClick={(e) => e.stopPropagation()}>
        <h4 className="mu-modal__title">Fixar nas escolhas rápidas</h4>

        <span className="mu-modal__label">Álbuns</span>
        <ul className="mu-pick-list">
          {playlists.map((pl) => {
            const on = pinnedQuick.includes(pinPlaylistKey(pl.id));
            return (
              <li key={pl.id}>
                <button type="button" className={on ? 'mu-pick mu-pick--on' : 'mu-pick'} onClick={() => togglePin(pinPlaylistKey(pl.id))}>
                  <ListMusic size={15} /> {pl.name}
                  <span className="mu-pick__hint">{on ? 'fixado' : 'fixar'}</span>
                </button>
              </li>
            );
          })}
          {playlists.length === 0 && <li className="mu-note">Nenhuma playlist ainda.</li>}
        </ul>

        <span className="mu-modal__label">Músicas</span>
        <ul className="mu-pick-list">
          {SITE_TRACKS_UI.map((t) => {
            const on = pinnedQuick.includes(pinSiteKey(t.id));
            return (
              <li key={t.id}>
                <button type="button" className={on ? 'mu-pick mu-pick--on' : 'mu-pick'} onClick={() => togglePin(pinSiteKey(t.id))}>
                  <Music2 size={15} /> {t.title}
                  <span className="mu-pick__hint">{on ? 'fixado' : 'fixar'}</span>
                </button>
              </li>
            );
          })}
          {tracks.map((t) => {
            const on = pinnedQuick.includes(pinTrackKey(t.id));
            return (
              <li key={t.id}>
                <button type="button" className={on ? 'mu-pick mu-pick--on' : 'mu-pick'} onClick={() => togglePin(pinTrackKey(t.id))}>
                  <Music2 size={15} /> {t.name}
                  <span className="mu-pick__hint">{on ? 'fixado' : 'fixar'}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mu-modal__actions">
          <button type="button" className="mu-btn" onClick={onClose}>
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

/** Card de playlist nas "Escolhas rápidas" — clique entra, long-press abre ações. */
function PlaylistQuickCard({
  playlist,
  isWorkout,
  onOpen,
  onMenu,
}: {
  playlist: Playlist;
  isWorkout: boolean;
  onOpen: () => void;
  onMenu: () => void;
}) {
  const press = useLongPress(onMenu, onOpen);
  return (
    <button type="button" className="mu-quick-card" {...press}>
      <div className="mu-quick-card__art mu-quick-card__art--pl">
        <PlaylistArt pl={playlist} size={26} />
        {isWorkout && <span className="mu-badge-treino">treino</span>}
      </div>
      <span className="mu-quick-card__name">{playlist.name}</span>
    </button>
  );
}

function UploadRow({
  track,
  isPinned,
  onTogglePin,
  onPlay,
}: {
  track: UploadTrack;
  isPinned?: boolean;
  onTogglePin?: () => void;
  /** v4.22.0 — na aba Início a fila oculta assume o clique (padrão: faixa isolada). */
  onPlay?: () => void;
}) {
  return (
    <li className="mu-row">
      <button
        type="button"
        className="mu-row__main"
        onClick={
          onPlay ??
          (() => void playPlaylistFromUi([{ id: `ui-${track.id}`, kind: 'upload', trackId: track.id, title: track.name }]))
        }
      >
        <div className="mu-row__art mu-row__art--user">
          <Music2 size={16} />
        </div>
        <div className="mu-row__meta">
          <span className="mu-row__title">{track.name}</span>
          <span className="mu-row__sub">{track.artist} • Sua música</span>
        </div>
      </button>
      {onTogglePin && (
        <PinButton isPinned={!!isPinned} onToggle={onTogglePin} label={track.name} />
      )}
    </li>
  );
}

/* ──────────────────────────── PLAYLISTS ──────────────────────────────── */

function PlaylistsView({
  onOpenPlaylist,
  onOpenMenu,
}: {
  onOpenPlaylist: (id: string) => void;
  onOpenMenu: (id: string) => void;
}) {
  const { playlists, createPlaylist, setActivePlaylist, activePlaylistId } = useLibraryStore();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [playlistType, setPlaylistType] = useState<'music' | 'podcast'>('music');
  const kbInset = useKeyboardInset();

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const pl = createPlaylist(trimmed, playlistType);
    setCreating(false);
    setName('');
    setPlaylistType('music');
    onOpenPlaylist(pl.id);
  };

  return (
    <div className="mu-page">
      <section className="mu-section">
        <div className="mu-section__head">
          <h3 className="mu-section__title">Listas de reprodução</h3>
          {playlists.length > 0 && (
            <span className="mu-section__sub">
              {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
              {activePlaylistId ? ' • toque e segure p/ opções' : ''}
            </span>
          )}
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
              <PlaylistGridCard
                key={pl.id}
                playlist={pl}
                isWorkout={activePlaylistId === pl.id}
                onOpen={() => onOpenPlaylist(pl.id)}
                onMenu={() => onOpenMenu(pl.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* FAB "+" — criar playlist */}
      <button
        type="button"
        className="mu-fab"
        onClick={() => setCreating(true)}
        aria-label="Criar playlist"
      >
        <Plus size={26} />
      </button>

      {creating && (
        <div className="mu-modal" onClick={() => setCreating(false)} style={{ paddingBottom: kbInset, alignItems: 'flex-start', paddingTop: '12vh' }}>
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
            <div className="mu-seg" role="group" aria-label="Tipo da playlist">
              <button
                type="button"
                className={`mu-seg__btn ${playlistType === 'music' ? 'mu-seg__btn--active' : ''}`}
                onClick={() => setPlaylistType('music')}
              >
                Música
              </button>
              <button
                type="button"
                className={`mu-seg__btn ${playlistType === 'podcast' ? 'mu-seg__btn--active' : ''}`}
                onClick={() => setPlaylistType('podcast')}
              >
                Podcast
              </button>
            </div>
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

      <button
        type="button"
        className="mu-btn mu-btn--ghost mu-btn--block"
        style={{ marginTop: 4 }}
        onClick={() => setActivePlaylist(null)}
        disabled={!activePlaylistId}
      >
        <Dumbbell size={16} /> Nenhuma playlist no treino (usar faixa do app)
      </button>
    </div>
  );
}

/** Card da grade de playlists — clique entra, long-press abre ações. */
function PlaylistGridCard({
  playlist,
  isWorkout,
  onOpen,
  onMenu,
}: {
  playlist: Playlist;
  isWorkout: boolean;
  onOpen: () => void;
  onMenu: () => void;
}) {
  const press = useLongPress(onMenu, onOpen);
  return (
    <div className="mu-pl-card">
      <button type="button" className="mu-pl-card__open" {...press}>
        <div className="mu-pl-card__art">
          <PlaylistArt pl={playlist} size={30} />
          {isWorkout && <span className="mu-badge-treino">no treino</span>}
        </div>
        <span className="mu-pl-card__name">{playlist.name}</span>
        <span className="mu-pl-card__count">
          {playlist.items.length} {playlist.items.length === 1 ? 'música' : 'músicas'}
        </span>
      </button>
      <button
        type="button"
        className="mu-pl-card__menu"
        onClick={onMenu}
        aria-label="Opções da playlist"
      >
        <MoreVertical size={18} />
      </button>
    </div>
  );
}

/* ─────────────────────── Detalhe da playlist ─────────────────────────── */

function PlaylistDetail({
  playlist,
  isWorkout,
  onBack,
  onSetWorkout,
  onOpenMenu,
}: {
  playlist: Playlist;
  isWorkout: boolean;
  onBack: () => void;
  onSetWorkout: (on: boolean) => void;
  onOpenMenu: () => void;
}) {
  const { tracks, externalTracks, removeItem, addUploadToPlaylist, addExternalLinkToPlaylist, addExternalTrackToPlaylist, expandExternalItem } =
    useLibraryStore();
  const [adding, setAdding] = useState(false);
  const [link, setLink] = useState('');
  const [linkName, setLinkName] = useState('');
  const [linkKind, setLinkKind] = useState<'youtube' | 'spotify'>('youtube');
  const [linkErr, setLinkErr] = useState('');
  const [linkMsg, setLinkMsg] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [addToLibrary, setAddToLibrary] = useState(true);
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [embedItem, setEmbedItem] = useState<PlaylistItem | null>(null);
  const kbInset = useKeyboardInset();

  const finishLink = (result: {
    added: number;
    container: boolean;
    truncated?: boolean;
    error?: string;
  }) => {
    if (result.added > 0) {
      setLink('');
      setLinkName('');
      setLinkMsg(
        result.container
          ? 'Link adicionado como playlist. Não foi possível listar as faixas agora.'
          : `${result.added} ${result.added === 1 ? 'faixa adicionada' : 'faixas adicionadas'}${
              result.truncated ? ' (lista parcial)' : ''
            }.`,
      );
      setLinkErr(result.error || '');
      return;
    }
    if (result.error) {
      setLinkErr(result.error);
      return;
    }
    setLinkMsg(
      result.container
        ? 'Esse link já está na playlist.'
        : 'Essas faixas já estão na playlist.',
    );
    setLink('');
    setLinkName('');
  };

  const addLink = async () => {
    setLinkErr('');
    setLinkMsg('');
    if (linkKind === 'youtube') {
      const parsed = parseYouTubeRef(link);
      if (!parsed) {
        setLinkErr('Link do YouTube inválido.');
        return;
      }
      setLinkBusy(true);
      const result = await addExternalLinkToPlaylist(
        playlist.id,
        'youtube',
        { kind: parsed.kind === 'list' ? 'playlist' : 'video', id: parsed.id },
        linkName.trim() || (parsed.kind === 'list' ? 'Playlist do YouTube' : 'Vídeo do YouTube'),
        addToLibrary,
      );
      setLinkBusy(false);
      finishLink(result);
      return;
    }

    const parsed = parseSpotifyLink(link);
    if (!parsed) {
      setLinkErr('Link do Spotify inválido.');
      return;
    }
    setLinkBusy(true);
    const result = await addExternalLinkToPlaylist(
      playlist.id,
      'spotify',
      { kind: parsed.kind, id: parsed.id },
      linkName.trim() ||
        (parsed.kind === 'track'
          ? 'Faixa do Spotify'
          : parsed.kind === 'album'
            ? 'Álbum do Spotify'
            : 'Playlist do Spotify'),
        addToLibrary,
      );
    setLinkBusy(false);
    finishLink(result);
  };

  const expand = async (item: PlaylistItem) => {
    setLinkErr('');
    setLinkMsg('');
    setExpandingId(item.id);
    const result = await expandExternalItem(playlist.id, item.id);
    setExpandingId(null);
    if (result.added > 0) {
      setLinkMsg(
        `${result.added} ${result.added === 1 ? 'faixa adicionada' : 'faixas adicionadas'}${
          result.truncated ? ' (lista parcial)' : ''
        }.`,
      );
    }
    if (result.error) setLinkErr(result.error);
  };

  const playItem = (item: PlaylistItem, index: number) => {
    if (item.kind === 'spotify') {
      setEmbedItem(item);
      return;
    }
    void playPlaylistFromUi(playlist.items, index);
  };

  const hasPlayable = playlist.items.some((it) => it.kind !== 'spotify');
  const firstSpotify = playlist.items.find((it) => it.kind === 'spotify');
  const playAll = () => {
    if (hasPlayable) void playPlaylistFromUi(playlist.items);
    else if (firstSpotify) setEmbedItem(firstSpotify);
  };
  const shuffleAll = () => {
    const shuffled = [...playlist.items].sort(() => Math.random() - 0.5);
    if (hasPlayable) void playPlaylistFromUi(shuffled);
    else if (firstSpotify) setEmbedItem(firstSpotify);
  };

  const embedKind =
    embedItem?.kind === 'spotify'
      ? embedItem.refType === 'track'
        ? 'track'
        : embedItem.refType === 'album'
          ? 'album'
          : 'playlist'
      : 'playlist';

  const notInPlaylist = useMemo(
    () => tracks.filter((t) => !playlist.items.some((it) => it.kind === 'upload' && it.trackId === t.id)),
    [tracks, playlist.items],
  );
  const notInExternal = useMemo(
    () => externalTracks.filter((t) => !playlist.items.some((it) => it.kind === 'youtube' && it.refId === t.refId)),
    [externalTracks, playlist.items],
  );

  return (
    <div className="mu-page">
      <section className="mu-section">
        <button type="button" className="mu-back" onClick={onBack}>
          <ArrowLeft size={17} /> Voltar
        </button>

        <div className="mu-pl-hero">
          <div className="mu-pl-hero__art">
            <PlaylistArt pl={playlist} size={34} />
          </div>
          <div className="mu-pl-hero__meta">
            <h3 className="mu-pl-hero__name">{playlist.name}</h3>
            <span className="mu-pl-hero__count">
              {playlist.items.length} itens{isWorkout ? ' • usada no treino' : ''}{playlist.type === 'podcast' ? ' • podcast' : ''}
            </span>
          </div>
          <button
            type="button"
            className="mu-icon-btn mu-icon-btn--sm"
            onClick={onOpenMenu}
            aria-label="Opções da playlist"
          >
            <MoreVertical size={18} />
          </button>
        </div>

        <div className="mu-pl-actions">
          <button
            type="button"
            className="mu-btn"
            disabled={playlist.items.length === 0}
            onClick={playAll}
          >
            <Play size={16} /> Tocar
          </button>
          <button
            type="button"
            className="mu-btn mu-btn--ghost"
            disabled={playlist.items.length === 0}
            onClick={shuffleAll}
          >
            <Shuffle size={16} /> Aleatório
          </button>
          <button
            type="button"
            className={`mu-btn ${isWorkout ? 'mu-btn--active' : 'mu-btn--ghost'}`}
            onClick={() => onSetWorkout(!isWorkout)}
            title="Tocar automaticamente durante o treino"
          >
            {isWorkout ? <Check size={16} /> : <Dumbbell size={16} />}
            {isWorkout ? 'Treino ativo' : 'Usar no treino'}
          </button>
        </div>

        {linkMsg && !adding && <p className="mu-note mu-note--ok">{linkMsg}</p>}
        {linkErr && !adding && <p className="mu-err">{linkErr}</p>}
        {playlist.items.some((it) => it.kind === 'spotify') && (
          <p className="mu-note">
            Faixas do Spotify tocam no player embed (toque na faixa). Elas não entram na fila
            automática do treino.
          </p>
        )}

        {playlist.items.length === 0 ? (
          <div className="mu-empty">
            <Music2 size={48} className="mu-empty__icon" />
            <p className="mu-empty__text">Adicione suas músicas abaixo</p>
          </div>
        ) : (
          <ul className="mu-list">
            {playlist.items.map((it, index) => {
              const expandable = isExternalPlaylistItem(it);
              const sourceLabel =
                it.kind === 'upload'
                  ? 'Sua música'
                  : it.kind === 'site'
                    ? 'Trilha do app'
                    : it.kind === 'youtube'
                      ? expandable
                        ? 'Playlist do YouTube'
                        : 'YouTube'
                      : expandable
                        ? it.refType === 'album'
                          ? 'Álbum do Spotify'
                          : 'Playlist do Spotify'
                        : 'Spotify';
              const sub = [
                it.artist || sourceLabel,
                it.durationSec ? formatDur(it.durationSec) : '',
                it.kind === 'spotify' ? 'embed' : '',
              ]
                .filter(Boolean)
                .join(' • ');

              return (
                <li key={it.id} className="mu-row">
                  <button
                    type="button"
                    className="mu-row__main"
                    onClick={() => playItem(it, index)}
                    title={
                      it.kind === 'spotify'
                        ? 'Abrir no player do Spotify'
                        : 'Tocar a partir desta faixa'
                    }
                  >
                    <div
                      className={`mu-row__art ${
                        it.thumbnail ? 'mu-row__art--thumb' : 'mu-row__art--user'
                      }`}
                    >
                      {it.thumbnail ? (
                        <img src={it.thumbnail} alt="" loading="lazy" />
                      ) : it.kind === 'youtube' ? (
                        <Youtube size={16} />
                      ) : it.kind === 'spotify' ? (
                        <Radio size={16} />
                      ) : (
                        <Music2 size={16} />
                      )}
                      {it.kind === 'spotify' && (
                        <span className="mu-row__embed-badge" aria-hidden="true">
                          <Play size={9} />
                        </span>
                      )}
                    </div>
                    <div className="mu-row__meta">
                      <span className="mu-row__title">{it.title}</span>
                      <span className="mu-row__sub">{sub}</span>
                    </div>
                  </button>
                  {expandable && (
                    <button
                      type="button"
                      className="mu-icon-btn mu-icon-btn--sm"
                      onClick={() => void expand(it)}
                      disabled={expandingId !== null}
                      aria-label="Expandir em faixas"
                      title="Expandir em faixas"
                    >
                      {expandingId === it.id ? (
                        <Loader2 size={15} className="mu-spin" />
                      ) : (
                        <RefreshCw size={15} />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    className="mu-icon-btn mu-icon-btn--sm"
                    onClick={() => removeItem(playlist.id, it.id)}
                    aria-label="Remover da playlist"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <button type="button" className="mu-btn mu-btn--block" onClick={() => setAdding(true)}>
          <Plus size={16} /> Adicionar músicas
        </button>
      </section>

      {adding && (
        <div className="mu-modal" onClick={() => setAdding(false)} style={{ paddingBottom: kbInset }}>
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
            {notInExternal.length > 0 && (
              <>
                <span className="mu-modal__label">Músicas do YouTube</span>
                <ul className="mu-pick-list">
                  {notInExternal.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="mu-pick"
                        onClick={() => addExternalTrackToPlaylist(playlist.id, t.id)}
                      >
                        <Youtube size={15} /> {t.title}
                        <span className="mu-pick__hint">adicionar</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <span className="mu-modal__label">Ou cole um link</span>
            <div className="mu-seg">
              <button
                type="button"
                className={`mu-seg__btn ${linkKind === 'youtube' ? 'mu-seg__btn--active' : ''}`}
                onClick={() => setLinkKind('youtube')}
                disabled={linkBusy}
              >
                <Youtube size={15} /> YouTube
              </button>
              <button
                type="button"
                className={`mu-seg__btn ${linkKind === 'spotify' ? 'mu-seg__btn--active' : ''}`}
                onClick={() => setLinkKind('spotify')}
                disabled={linkBusy}
              >
                <Radio size={15} /> Spotify
              </button>
            </div>
            <input
              className="mu-input"
              placeholder="Nome (opcional)"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              disabled={linkBusy}
            />
            <input
              className="mu-input"
              placeholder={
                linkKind === 'youtube'
                  ? 'https://youtube.com/playlist?list=...'
                  : 'https://open.spotify.com/playlist/... (playlist, álbum ou faixa)'
              }
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={linkBusy}
            />
            <p className="mu-note">
              Playlists são expandidas em faixas com capa e duração quando a API responde.
            </p>
            <label className="mu-note" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={addToLibrary} onChange={(e) => setAddToLibrary(e.target.checked)} />
              Adicionar as faixas à biblioteca (disponível em todas as playlists)
            </label>
            {linkMsg && <p className="mu-note mu-note--ok">{linkMsg}</p>}
            {linkErr && <p className="mu-err">{linkErr}</p>}

            <div className="mu-modal__actions">
              <button
                type="button"
                className="mu-btn mu-btn--ghost"
                onClick={() => setAdding(false)}
                disabled={linkBusy}
              >
                Fechar
              </button>
              <button
                type="button"
                className="mu-btn"
                onClick={() => void addLink()}
                disabled={linkBusy || !link.trim()}
              >
                {linkBusy ? (
                  <Loader2 size={16} className="mu-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {linkBusy ? 'Buscando faixas…' : 'Adicionar link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {embedItem && embedItem.kind === 'spotify' && (
        <div
          className="mu-modal mu-modal--embed"
          onClick={() => setEmbedItem(null)}
          style={{ paddingBottom: kbInset }}
        >
          <div
            className="mu-modal__panel mu-modal__panel--embed"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mu-embed__head">
              <div>
                <h4 className="mu-modal__title">{embedItem.title}</h4>
                <p className="mu-note">Reprodução pelo player oficial do Spotify (embed).</p>
              </div>
              <button
                type="button"
                className="mu-icon-btn mu-icon-btn--sm"
                onClick={() => setEmbedItem(null)}
                aria-label="Fechar player do Spotify"
              >
                <X size={16} />
              </button>
            </div>
            <iframe
              title={`Spotify: ${embedItem.title}`}
              className="mu-embed"
              src={spotifyEmbedUrl(embedKind, embedItem.refId)}
              height={embedKind === 'track' ? 152 : 352}
              frameBorder={0}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
            <div className="mu-modal__actions">
              <button type="button" className="mu-btn" onClick={() => setEmbedItem(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────── Sheet de ações + Modal renomear ──────────────────── */

function PlaylistActionSheet({
  playlist,
  isWorkout,
  isPinned,
  onClose,
  onRename,
  onCover,
  onSetWorkout,
  onTogglePin,
  onDelete,
}: {
  playlist: Playlist;
  isWorkout: boolean;
  isPinned: boolean;
  onClose: () => void;
  onRename: () => void;
  onCover: () => void;
  onSetWorkout: (on: boolean) => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mu-modal mu-modal--sheet" onClick={onClose}>
      <div className="mu-modal__panel" onClick={(e) => e.stopPropagation()}>
        <h4 className="mu-modal__title">{playlist.name}</h4>
        <span className="mu-modal__label">
          {playlist.items.length} itens{isWorkout ? ' • no treino' : ''}
        </span>
        <div className="mu-actionsheet">
          <button type="button" className="mu-actionsheet__item" onClick={onRename}>
            <Pencil size={17} /> Renomear
          </button>
          <button type="button" className="mu-actionsheet__item" onClick={onCover}>
            <ImageIcon size={17} /> Trocar capa
          </button>
          <button
            type="button"
            className="mu-actionsheet__item"
            onClick={() => onSetWorkout(!isWorkout)}
          >
            <Dumbbell size={17} /> {isWorkout ? 'Remover do treino' : 'Usar no treino'}
          </button>
          <button type="button" className="mu-actionsheet__item" onClick={onTogglePin}>
            <Pin size={17} />{' '}
            {isPinned ? 'Desafixar das escolhas rápidas' : 'Fixar nas escolhas rápidas'}
          </button>
          <button
            type="button"
            className="mu-actionsheet__item mu-actionsheet__item--danger"
            onClick={onDelete}
          >
            <Trash2 size={17} /> Excluir playlist
          </button>
        </div>
        <div className="mu-modal__actions">
          <button type="button" className="mu-btn mu-btn--ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function RenameModal({
  playlist,
  onSave,
  onClose,
}: {
  playlist: Playlist;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(playlist.name);
  const kbInset = useKeyboardInset();
  return (
    <div className="mu-modal" onClick={onClose} style={{ paddingBottom: kbInset }}>
      <div className="mu-modal__panel" onClick={(e) => e.stopPropagation()}>
        <h4 className="mu-modal__title">Renomear playlist</h4>
        <input
          className="mu-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSave(name)}
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
        />
        <div className="mu-modal__actions">
          <button type="button" className="mu-btn mu-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="mu-btn" onClick={() => name.trim() && onSave(name)}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── BIBLIOTECA ─────────────────────────────── */

function BibliotecaView({
  onOpenPlaylist,
  onOpenMenu,
}: {
  onOpenPlaylist: (id: string) => void;
  onOpenMenu: (id: string) => void;
}) {
  const { tracks, playlists, addUpload, removeTrack, createPlaylist, addExternalLinkToPlaylist, activePlaylistId, pinnedQuick, togglePin } =
    useLibraryStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [linkModal, setLinkModal] = useState<null | 'youtube' | 'spotify'>(null);
  const [link, setLink] = useState('');
  const [linkName, setLinkName] = useState('');
  const [linkErr, setLinkErr] = useState('');
  const [linkNotice, setLinkNotice] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [addToLibrary, setAddToLibrary] = useState(true);
  const [linkTarget, setLinkTarget] = useState<string>('');
  const kbInset = useKeyboardInset();

  /* v4.22.0 — ordenação da Biblioteca (1 toque = ordem, 2 toques = inverso) */
  const [sortPref, setSortPref] = useState<SortPref>(readSortPref);
  const toggleSort = (key: SortKey) => {
    setSortPref((prev) => {
      const next: SortPref = prev.key === key ? { key, dir: (prev.dir === 1 ? -1 : 1) } : { key, dir: 1 };
      try {
        localStorage.setItem(SORT_STORE, JSON.stringify(next));
      } catch {
        /* storage indisponível */
      }
      return next;
    });
  };
  const sortedTracks = useMemo(() => sortTracks(tracks, sortPref), [tracks, sortPref]);

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

  const linkKindIsYoutube = (k: null | 'youtube' | 'spotify') => k !== 'spotify';

  const applyExternal = async (
    kind: 'youtube' | 'spotify',
    ref: { kind: 'video' | 'playlist' | 'track' | 'album'; id: string },
    title: string,
  ) => {
    let target = linkTarget;
    if (!target) {
      const pl = createPlaylist(linkName.trim() || title);
      target = pl.id;
    }
    return addExternalLinkToPlaylist(target, kind, ref, linkName.trim() || title, addToLibrary);
  };

  const addExternalLink = async () => {
    setLinkErr('');
    setLinkNotice('');
    setLinkBusy(true);

    let result: Awaited<ReturnType<typeof applyExternal>>;
    if (linkKindIsYoutube(linkModal)) {
      const parsed = parseYouTubeRef(link);
      if (!parsed) {
        setLinkErr('Link do YouTube inválido.');
        setLinkBusy(false);
        return;
      }
      result = await applyExternal(
        'youtube',
        { kind: parsed.kind === 'list' ? 'playlist' : 'video', id: parsed.id },
        parsed.kind === 'list' ? 'Playlist do YouTube' : 'Vídeo do YouTube',
      );
    } else {
      const parsed = parseSpotifyLink(link);
      if (!parsed) {
        setLinkErr('Link do Spotify inválido.');
        setLinkBusy(false);
        return;
      }
      result = await applyExternal(
        'spotify',
        { kind: parsed.kind, id: parsed.id },
        parsed.kind === 'track'
          ? 'Faixa do Spotify'
          : parsed.kind === 'album'
            ? 'Álbum do Spotify'
            : 'Playlist do Spotify',
      );
    }

    setLinkBusy(false);
    if (result.added > 0) {
      setLinkNotice(
        result.container
          ? 'Link adicionado como playlist. Não foi possível listar as faixas agora.'
          : `${result.added} ${result.added === 1 ? 'faixa adicionada' : 'faixas adicionadas'}${
              result.truncated ? ' (lista parcial)' : ''
            }.`,
      );
      setLink('');
      setLinkName('');
      setLinkModal(null);
      return;
    }
    if (result.error) {
      setLinkErr(result.error);
      return;
    }
    setLinkNotice(
      result.container
        ? 'Esse link já está na playlist.'
        : 'Essas faixas já estão na playlist.',
    );
    setLink('');
    setLinkName('');
    setLinkModal(null);
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

        {linkNotice && (
          <p className="mu-note mu-note--ok" role="status">
            {linkNotice}
          </p>
        )}

        {tracks.length === 0 ? (
          <div className="mu-empty">
            <Upload size={48} className="mu-empty__icon" />
            <p className="mu-empty__text">Nenhuma música enviada ainda</p>
          </div>
        ) : (
          <>
            {/* v4.22.0 — barra de ordenação: 1 toque = ordem, 2 toques = inverso */}
            <div className="mu-sortbar" role="group" aria-label="Ordenar músicas">
              {SORT_OPTIONS.map((opt) => {
                const active = sortPref.key === opt.key;
                const inverted = active && sortPref.dir === -1;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    className={`mu-sortbar__chip${active ? ' mu-sortbar__chip--active' : ''}`}
                    aria-pressed={active}
                    onClick={() => toggleSort(opt.key)}
                  >
                    {opt.label}
                    {active && <span className="mu-sortbar__arrow">{inverted ? '↑' : '↓'}</span>}
                  </button>
                );
              })}
            </div>
            <ul className="mu-list">
              {sortedTracks.map((t) => (
                <li key={t.id} className="mu-row">
                  <button
                    type="button"
                    className="mu-row__main"
                    onClick={() =>
                      void playPlaylistFromUi([
                        {
                          id: `ui-${t.id}`,
                          kind: 'upload',
                          trackId: t.id,
                          title: t.name,
                          artist: t.artist,
                          durationSec: t.durationSec,
                        },
                      ])
                    }
                  >
                    <div className="mu-row__art mu-row__art--user">
                      <Music2 size={16} />
                    </div>
                    <div className="mu-row__meta">
                      <span className="mu-row__title">{t.name}</span>
                      <span className="mu-row__sub">
                        {t.artist}
                        {t.durationSec ? ` • ${formatDur(t.durationSec)}` : ''}
                        {t.playCount ? ` • ${t.playCount}×` : ''}
                      </span>
                    </div>
                  </button>
                <PinButton
                  isPinned={pinnedQuick.includes(pinTrackKey(t.id))}
                  onToggle={() => togglePin(pinTrackKey(t.id))}
                  label={t.name}
                />
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
          </>
        )}
      </section>

      {playlists.length > 0 && (
        <section className="mu-section">
          <div className="mu-section__head">
            <h3 className="mu-section__title">Playlists</h3>
            <span className="mu-section__sub">toque para abrir • segure p/ opções</span>
          </div>
          {/* Álbuns/listas em grade — clique entra, long-press abre ações */}
          <div className="mu-pl-grid">
            {playlists.map((pl) => (
              <PlaylistGridCard
                key={pl.id}
                playlist={pl}
                isWorkout={activePlaylistId === pl.id}
                onOpen={() => onOpenPlaylist(pl.id)}
                onMenu={() => onOpenMenu(pl.id)}
              />
            ))}
          </div>
        </section>
      )}

      {linkModal && (
        <div className="mu-modal" onClick={() => setLinkModal(null)} style={{ paddingBottom: kbInset }}>
          <div className="mu-modal__panel" onClick={(e) => e.stopPropagation()}>
            <h4 className="mu-modal__title">
              {linkKindIsYoutube(linkModal) ? 'Link do YouTube' : 'Link do Spotify'}
            </h4>
            <span className="mu-modal__label">Adicionar em</span>
            <select
              className="mu-input mu-select"
              value={linkTarget}
              onChange={(e) => setLinkTarget(e.target.value)}
              disabled={linkBusy}
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
              placeholder="Nome da playlist (ex.: Treino de Peito)"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              disabled={linkBusy}
            />
            <input
              className="mu-input"
              placeholder={
                linkKindIsYoutube(linkModal)
                  ? 'https://youtube.com/playlist?list=...'
                  : 'https://open.spotify.com/playlist/... (playlist, álbum ou faixa)'
              }
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={linkBusy}
            />
            <p className="mu-note">
              Playlists são expandidas em faixas com capa e duração quando a API responde.
            </p>
            <label className="mu-note" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={addToLibrary} onChange={(e) => setAddToLibrary(e.target.checked)} />
              Adicionar as faixas à biblioteca (disponível em todas as playlists)
            </label>
            {linkErr && <p className="mu-err">{linkErr}</p>}
            <div className="mu-modal__actions">
              <button
                type="button"
                className="mu-btn mu-btn--ghost"
                onClick={() => setLinkModal(null)}
                disabled={linkBusy}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="mu-btn"
                onClick={() => void addExternalLink()}
                disabled={linkBusy || !link.trim()}
              >
                {linkBusy ? <Loader2 size={16} className="mu-spin" /> : <Plus size={16} />}
                {linkBusy ? 'Buscando faixas…' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
