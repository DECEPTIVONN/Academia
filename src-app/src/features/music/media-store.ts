/**
 * media-store.ts — Biblioteca de música do usuário (v4.19.0-music)
 *
 * Duas camadas:
 *  • Blobs de áudio (uploads) → IndexedDB (`academia_media_db`, store
 *    `audio_blobs`) — localStorage não aguenta arquivos grandes;
 *  • Metadados (tracks + playlists + playlist ativa de treino) →
 *    localStorage `academia_music_library_v1` (JSON pequeno).
 *
 * Modelo:
 *  • Track      = música enviada pelo usuário (kind 'upload');
 *  • Playlist   = { id, name, items[] } — item pode ser upload (trackId),
 *                 YouTube (videoId/listId via IFrame API) ou Spotify
 *                 (playlistId via embed — toca só na interface, sem API);
 *  • activePlaylistId = playlist que toca automaticamente no treino
 *                 (null → toca a música de treino do site, se habilitada).
 */

import { create } from 'zustand';

/* ────────────────────────── IndexedDB (blobs) ────────────────────────── */

const DB_NAME = 'academia_media_db';
const DB_VERSION = 1;
const STORE = 'audio_blobs';

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAudioBlob(id: string, blob: Blob): Promise<void> {
  const db = await openMediaDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadAudioBlob(id: string): Promise<Blob | null> {
  const db = await openMediaDB();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}

export async function deleteAudioBlob(id: string): Promise<void> {
  const db = await openMediaDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/* ─────────────────────── Metadados (localStorage) ─────────────────────── */

const LIB_KEY = 'academia_music_library_v1';

export interface UploadTrack {
  id: string;
  name: string;
  artist: string;
  addedAt: number;
  kind: 'upload';
}

export type PlaylistItem =
  | { id: string; kind: 'upload'; trackId: string; title: string }
  | { id: string; kind: 'youtube'; refId: string; title: string } // refId = videoId ou listId
  | { id: string; kind: 'spotify'; refId: string; title: string }; // refId = playlistId

export interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
  createdAt: number;
  /** v4.20.0 — capa customizável (data URL de imagem enviada pelo usuário). */
  cover?: string;
}

export interface MusicLibrary {
  tracks: UploadTrack[];
  playlists: Playlist[];
  activePlaylistId: string | null;
}

const EMPTY_LIBRARY: MusicLibrary = { tracks: [], playlists: [], activePlaylistId: null };

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function readLibrary(): MusicLibrary {
  try {
    const raw = localStorage.getItem(LIB_KEY);
    if (!raw) return { ...EMPTY_LIBRARY };
    const parsed = JSON.parse(raw) as Partial<MusicLibrary>;
    return {
      tracks: Array.isArray(parsed.tracks) ? parsed.tracks : [],
      playlists: Array.isArray(parsed.playlists) ? parsed.playlists : [],
      activePlaylistId: parsed.activePlaylistId ?? null,
    };
  } catch {
    return { ...EMPTY_LIBRARY };
  }
}

function writeLibrary(lib: MusicLibrary): void {
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(lib));
  } catch {
    /* storage cheio/indisponível — estado segue em memória */
  }
}

/* ───────────────────────────── Store (zustand) ───────────────────────── */

interface LibraryState extends MusicLibrary {
  hydrate: () => void;
  addUpload: (file: File) => Promise<UploadTrack>;
  removeTrack: (trackId: string) => Promise<void>;
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  addUploadToPlaylist: (playlistId: string, trackId: string) => void;
  addExternalToPlaylist: (
    playlistId: string,
    kind: 'youtube' | 'spotify',
    refId: string,
    title: string,
  ) => void;
  removeItem: (playlistId: string, itemId: string) => void;
  setActivePlaylist: (playlistId: string | null) => void;
  /** v4.20.0 */
  renamePlaylist: (playlistId: string, name: string) => void;
  setPlaylistCover: (playlistId: string, cover: string | undefined) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  ...EMPTY_LIBRARY,

  hydrate: () => {
    const lib = readLibrary();
    set(lib);
  },

  addUpload: async (file) => {
    const id = newId('trk');
    await saveAudioBlob(id, file);
    const base = file.name.replace(/\.[^.]+$/, '');
    // "Artista - Música" → artist/nome; senão tudo no nome.
    const dash = base.split(' - ');
    const track: UploadTrack = {
      id,
      name: (dash[1] ?? base).trim() || base,
      artist: (dash[0] ?? 'Você').trim() || 'Você',
      addedAt: Date.now(),
      kind: 'upload',
    };
    const cur = readLibrary();
    const lib = { ...cur, tracks: [...cur.tracks, track] };
    writeLibrary(lib);
    set(lib);
    return track;
  },

  removeTrack: async (trackId) => {
    await deleteAudioBlob(trackId);
    const cur = readLibrary();
    const lib: MusicLibrary = {
      ...cur,
      tracks: cur.tracks.filter((t) => t.id !== trackId),
      playlists: cur.playlists.map((p) => ({
        ...p,
        items: p.items.filter((it) => !(it.kind === 'upload' && it.trackId === trackId)),
      })),
    };
    if (lib.activePlaylistId && !lib.playlists.some((p) => p.id === lib.activePlaylistId)) {
      lib.activePlaylistId = null;
    }
    writeLibrary(lib);
    set(lib);
  },

  createPlaylist: (name) => {
    const cur = readLibrary();
    const pl: Playlist = {
      id: newId('pl'),
      name: name.trim() || 'Nova playlist',
      items: [],
      createdAt: Date.now(),
    };
    const lib = { ...cur, playlists: [...cur.playlists, pl] };
    writeLibrary(lib);
    set(lib);
    return pl;
  },

  deletePlaylist: (playlistId) => {
    const cur = readLibrary();
    const lib: MusicLibrary = {
      ...cur,
      playlists: cur.playlists.filter((p) => p.id !== playlistId),
      activePlaylistId: cur.activePlaylistId === playlistId ? null : cur.activePlaylistId,
    };
    writeLibrary(lib);
    set(lib);
  },

  addUploadToPlaylist: (playlistId, trackId) => {
    const cur = readLibrary();
    const track = cur.tracks.find((t) => t.id === trackId);
    if (!track) return;
    const lib: MusicLibrary = {
      ...cur,
      playlists: cur.playlists.map((p) =>
        p.id === playlistId
          ? {
              ...p,
              items: [
                ...p.items,
                { id: newId('it'), kind: 'upload', trackId, title: track.name } as PlaylistItem,
              ],
            }
          : p,
      ),
    };
    writeLibrary(lib);
    set(lib);
  },

  addExternalToPlaylist: (playlistId, kind, refId, title) => {
    const cur = readLibrary();
    const lib: MusicLibrary = {
      ...cur,
      playlists: cur.playlists.map((p) =>
        p.id === playlistId
          ? {
              ...p,
              items: [
                ...p.items,
                { id: newId('it'), kind, refId, title: title.trim() || refId } as PlaylistItem,
              ],
            }
          : p,
      ),
    };
    writeLibrary(lib);
    set(lib);
  },

  removeItem: (playlistId, itemId) => {
    const cur = readLibrary();
    const lib: MusicLibrary = {
      ...cur,
      playlists: cur.playlists.map((p) =>
        p.id === playlistId ? { ...p, items: p.items.filter((it) => it.id !== itemId) } : p,
      ),
    };
    writeLibrary(lib);
    set(lib);
  },

  setActivePlaylist: (playlistId) => {
    const cur = readLibrary();
    const lib = { ...cur, activePlaylistId: playlistId };
    writeLibrary(lib);
    set(lib);
  },

  /* v4.20.0 — renomear e trocar a capa da playlist */
  renamePlaylist: (playlistId, name) => {
    const cur = readLibrary();
    const trimmed = name.trim();
    if (!trimmed) return;
    const lib: MusicLibrary = {
      ...cur,
      playlists: cur.playlists.map((p) => (p.id === playlistId ? { ...p, name: trimmed } : p)),
    };
    writeLibrary(lib);
    set(lib);
  },

  setPlaylistCover: (playlistId, cover) => {
    const cur = readLibrary();
    const lib: MusicLibrary = {
      ...cur,
      playlists: cur.playlists.map((p) => (p.id === playlistId ? { ...p, cover } : p)),
    };
    writeLibrary(lib);
    set(lib);
  },
}));

/* ──────────────────────── Helpers de links externos ──────────────────── */

/** Extrai videoId/listId de URLs do YouTube (watch?v=, youtu.be, playlist?list=, shorts). */
export function parseYouTubeRef(url: string): { kind: 'video' | 'list'; id: string } | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return id ? { kind: 'video', id } : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = u.searchParams.get('v');
      if (v) return { kind: 'video', id: v };
      const list = u.searchParams.get('list');
      if (list) return { kind: 'list', id: list };
      const m = u.pathname.match(/^\/(?:playlist|shorts|embed)\/(.+)$/);
      if (m) return { kind: 'video', id: m[1] };
    }
    return null;
  } catch {
    return null;
  }
}

/** Extrai playlistId de URLs do Spotify (open.spotify.com/playlist/<id>). */
export function parseSpotifyRef(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, '');
    if (host !== 'open.spotify.com') return null;
    const m = u.pathname.match(/\/playlist\/([A-Za-z0-9]+)/);
    return m ? m[1] : null;
  } catch {
    // Aceita também só o ID colado (22 chars alfanuméricos do Spotify)
    const raw = url.trim();
    return /^[A-Za-z0-9]{16,30}$/.test(raw) ? raw : null;
  }
}
