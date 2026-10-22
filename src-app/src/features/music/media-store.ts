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
import {
  fetchExternalList,
  type ExternalListResult,
  type ExternalRefKind,
} from './external-music';

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
  durationSec?: number;
  playCount?: number;
}

/** Faixa externa (YouTube) disponível na biblioteca global (v4.41.x). */
export interface ExternalTrackItem {
  id: string;
  kind: 'youtube';
  refId: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  durationSec?: number;
  addedAt: number;
}

export type SiteTrackId = 'main' | 'workout' | 'result' | 'missions';

/** Metadados opcionais de faixas externas (v4.41.0). Itens antigos seguem válidos. */
export interface PlaylistItemMeta {
  thumbnail?: string;
  durationSec?: number;
  artist?: string;
  /** playlist/album = container expansível; video/track = faixa individual. */
  refType?: ExternalRefKind;
  /** Playlist/álbum de origem, para agrupar e expandir depois. */
  sourceId?: string;
  sourceTitle?: string;
}

type PlaylistItemBase = PlaylistItemMeta & {
  id: string;
  title: string;
};

export type PlaylistItem =
  | (PlaylistItemBase & { kind: 'upload'; trackId: string })
  | (PlaylistItemBase & { kind: 'youtube'; refId: string }) // refId = videoId ou listId
  | (PlaylistItemBase & { kind: 'spotify'; refId: string }) // refId = playlistId/albumId/trackId
  /* v4.21.0 - faixa fixa do site (MAIN/RESULT/Revenger Phoenix/Black Panther)
     vivendo DENTRO de uma playlist (a "Evo Fit" criada por padrão). */
  | (PlaylistItemBase & { kind: 'site'; siteId: SiteTrackId });

export interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
  createdAt: number;
  /** v4.20.0 — capa customizável (data URL de imagem enviada pelo usuário). */
  cover?: string;
  /** v4.41.x — tipo da playlist: música ou podcast. */
  type?: 'music' | 'podcast';
}

export interface MusicLibrary {
  tracks: UploadTrack[];
  externalTracks: ExternalTrackItem[];
  playlists: Playlist[];
  activePlaylistId: string | null;
  /* v4.21.0 — "Escolhas rápidas" = itens FIXADOS pelo usuário.
     Chaves: `pl:<id>` (álbum/playlist), `trk:<id>` (upload),
     `site:<siteId>` (faixa fixa do site). */
  pinnedQuick: string[];
  /** v4.21.0 — migração de seed (Evo Fit + Suas músicas) já aplicada. */
  seeded: boolean;
}

const EMPTY_LIBRARY: MusicLibrary = {
  tracks: [],
  externalTracks: [],
  playlists: [],
  activePlaylistId: null,
  pinnedQuick: [],
  seeded: false,
};

/* ────────────────────── Playlists padrão (seed v4.21.0) ───────────────── */

/** Playlist "Evo Fit" — trilhas fixas do site moram aqui por padrão. */
export const EVO_FIT_ID = 'pl-evo-fit';
/** Playlist "Suas músicas" — recebe automaticamente cada upload do usuário. */
export const SUAS_MUSICAS_ID = 'pl-suas-musicas';

const EVO_FIT_ITEMS: PlaylistItem[] = [
  { id: 'site-item-main', kind: 'site', siteId: 'main', title: 'MAIN' },
  {
    id: 'site-item-workout',
    kind: 'site',
    siteId: 'workout',
    title: 'Black Panther: War For Wakanda',
  },
  { id: 'site-item-missions', kind: 'site', siteId: 'missions', title: 'Revenger Phoenix' },
  { id: 'site-item-result', kind: 'site', siteId: 'result', title: 'RESULT' },
];

/** Chave de fixação de um álbum (playlist) nas Escolhas rápidas. */
export const pinPlaylistKey = (id: string): string => `pl:${id}`;
/** Chave de fixação de uma música enviada pelo usuário. */
export const pinTrackKey = (id: string): string => `trk:${id}`;
/** Chave de fixação de uma faixa fixa do site. */
export const pinSiteKey = (id: SiteTrackId): string => `site:${id}`;

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
      externalTracks: Array.isArray(parsed.externalTracks) ? parsed.externalTracks : [],
      playlists: Array.isArray(parsed.playlists) ? parsed.playlists : [],
      activePlaylistId: parsed.activePlaylistId ?? null,
      pinnedQuick: Array.isArray(parsed.pinnedQuick) ? parsed.pinnedQuick : [],
      seeded: parsed.seeded === true,
    };
  } catch {
    return { ...EMPTY_LIBRARY };
  }
}

function writeLibrary(lib: MusicLibrary, options?: { silent?: boolean }): void {
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(lib));
  } catch {
    /* storage cheio/indisponível — estado segue em memória */
  }
  if (!options?.silent && typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('academia:music-changed'));
  }
}

/* ───────────────────── Seed v4.21.0 (migração única) ───────────────────── */

/**
 * Primeira hidratação pós-v4.21.0:
 *  • cria a playlist "Evo Fit" com as 4 faixas fixas do site (elas saem das
 *    Escolhas rápidas e passam a viver dentro de uma playlist);
 *  • cria a playlist "Suas músicas" e move para lá todos os uploads já
 *    existentes (novos uploads entram automaticamente em addUpload).
 */
function seedLibrary(lib: MusicLibrary): MusicLibrary {
  if (lib.seeded) return lib;
  let playlists = [...lib.playlists];

  if (!playlists.some((p) => p.id === EVO_FIT_ID)) {
    playlists.push({
      id: EVO_FIT_ID,
      name: 'Evo Fit',
      items: EVO_FIT_ITEMS,
      createdAt: Date.now(),
    });
  }

  let suas = playlists.find((p) => p.id === SUAS_MUSICAS_ID);
  if (!suas) {
    suas = { id: SUAS_MUSICAS_ID, name: 'Suas músicas', items: [], createdAt: Date.now() };
    playlists.push(suas);
  }
  const already = new Set(
    suas.items.filter((it) => it.kind === 'upload').map((it) => (it as { trackId: string }).trackId),
  );
  const missing = lib.tracks.filter((t) => !already.has(t.id));
  if (missing.length > 0) {
    playlists = playlists.map((p) =>
      p.id === SUAS_MUSICAS_ID
        ? {
            ...p,
            items: [
              ...p.items,
              ...missing.map(
                (t) =>
                  ({ id: newId('it'), kind: 'upload', trackId: t.id, title: t.name }) as PlaylistItem,
              ),
            ],
          }
        : p,
    );
  }

  return { ...lib, playlists, seeded: true };
}

/* ───────────────────────────── Store (zustand) ───────────────────────── */

/** v4.22.0 — lê a duração real do arquivo enviado (best-effort). */
function probeAudioDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    let url: string | null = null;
    try {
      url = URL.createObjectURL(file);
      const probe = new Audio();
      const done = (v: number | undefined) => {
        if (url) URL.revokeObjectURL(url);
        resolve(v);
      };
      probe.addEventListener('loadedmetadata', () => {
        const d = probe.duration;
        done(Number.isFinite(d) && d > 0 ? Math.round(d) : undefined);
      }, { once: true });
      probe.addEventListener('error', () => done(undefined), { once: true });
      // Timeout: arquivo quebrado/rede lenta não trava o envio.
      window.setTimeout(() => done(undefined), 6000);
      probe.src = url;
    } catch {
      resolve(undefined);
    }
  });
}

export interface ExternalLinkAddResult {
  added: number;
  /** true = não foi possível listar as faixas e o link virou um container. */
  container: boolean;
  sourceTitle?: string;
  truncated?: boolean;
  error?: string;
}

interface LibraryState extends MusicLibrary {
  hydrate: () => void;
  addUpload: (file: File) => Promise<UploadTrack>;
  removeTrack: (trackId: string) => Promise<void>;
  /** v4.22.0 — conta um início de reprodução (ordenar "Mais tocado"). */
  registerPlay: (trackId: string) => void;
  createPlaylist: (name: string, type?: 'music' | 'podcast') => Playlist;
  deletePlaylist: (playlistId: string) => void;
  addUploadToPlaylist: (playlistId: string, trackId: string) => void;
  addExternalToPlaylist: (
    playlistId: string,
    kind: 'youtube' | 'spotify',
    refId: string,
    title: string,
  ) => void;
  addExternalTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeExternalTrack: (trackId: string) => void;
  /**
   * v4.41.0 — resolve um link externo e persiste as faixas individuais.
   * Se a API/embed falhar, mantém o comportamento antigo: adiciona um
   * container (playlist/vídeo) que pode ser expandido depois.
   */
  addExternalLinkToPlaylist: (
    playlistId: string,
    kind: 'youtube' | 'spotify',
    ref: { kind: ExternalRefKind; id: string },
    title: string,
    addToLibrary?: boolean,
  ) => Promise<ExternalLinkAddResult>;
  /** Converte um container antigo (YouTube playlist/Spotify playlist) em faixas. */
  expandExternalItem: (
    playlistId: string,
    itemId: string,
  ) => Promise<ExternalLinkAddResult>;
  removeItem: (playlistId: string, itemId: string) => void;
  setActivePlaylist: (playlistId: string | null) => void;
  /** v4.20.0 */
  renamePlaylist: (playlistId: string, name: string) => void;
  setPlaylistCover: (playlistId: string, cover: string | undefined) => void;
  /** v4.21.0 — fixar/desafixar álbum/música nas Escolhas rápidas */
  togglePin: (key: string) => void;
}

function externalItemKey(item: PlaylistItem): string {
  if (item.kind === 'youtube' || item.kind === 'spotify') {
    return `${item.kind}:${item.refType || (item.kind === 'spotify' ? 'playlist' : 'video')}:${item.refId}`;
  }
  if (item.kind === 'upload') return `upload:${item.trackId}`;
  return `site:${item.siteId}`;
}

function makeExternalItems(kind: 'youtube' | 'spotify', source: ExternalListResult): PlaylistItem[] {
  return source.tracks.map(
    (track) =>
      ({
        id: newId('it'),
        kind,
        refId: track.refId,
        refType: track.refType,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail || source.cover,
        durationSec: track.durationSec,
        sourceId: source.sourceId,
        sourceTitle: source.title,
      }) as PlaylistItem,
  );
}

function makeExternalContainer(
  kind: 'youtube' | 'spotify',
  ref: { kind: ExternalRefKind; id: string },
  title: string,
): PlaylistItem {
  return {
    id: newId('it'),
    kind,
    refId: ref.id,
    refType: ref.kind,
    title: title.trim() || (kind === 'spotify' ? 'Playlist do Spotify' : 'Playlist do YouTube'),
    sourceId: ref.id,
    sourceTitle: title.trim() || undefined,
  } as PlaylistItem;
}

/** Container externo que ainda pode ser expandido em faixas individuais. */
export function isExternalPlaylistItem(item: PlaylistItem): boolean {
  if (item.kind === 'youtube') {
    if (item.refType === 'playlist') return true;
    if (item.refType === 'video') return false;
    return /^(PL|UU|OL|RD|FL)/.test(item.refId);
  }
  if (item.kind === 'spotify') return item.refType !== 'track';
  return false;
}

function externalItemSourceKind(item: PlaylistItem): ExternalRefKind | null {
  if (item.kind === 'youtube') {
    if (item.refType === 'playlist') return 'playlist';
    if (item.refType === 'video') return 'video';
    return /^(PL|UU|OL|RD|FL)/.test(item.refId) ? 'playlist' : 'video';
  }
  if (item.kind === 'spotify') {
    if (item.refType === 'track') return 'track';
    if (item.refType === 'album') return 'album';
    return 'playlist';
  }
  return null;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  ...EMPTY_LIBRARY,

  hydrate: () => {
    const seeded = seedLibrary(readLibrary());
    writeLibrary(seeded, { silent: true });
    set(seeded);
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
      durationSec: await probeAudioDuration(file), // v4.22.0
    };
    const cur = seedLibrary(readLibrary());
    const item: PlaylistItem = {
      id: newId('it'),
      kind: 'upload',
      trackId: id,
      title: track.name,
      artist: track.artist,
      durationSec: track.durationSec,
    };
    const lib: MusicLibrary = {
      ...cur,
      tracks: [...cur.tracks, track],
      /* v4.21.0 — todo upload entra automaticamente em "Suas músicas" */
      playlists: cur.playlists.map((p) =>
        p.id === SUAS_MUSICAS_ID ? { ...p, items: [...p.items, item] } : p,
      ),
    };
    writeLibrary(lib);
    set(lib);
    return track;
  },

  removeTrack: async (trackId) => {
    const cur = readLibrary();
    // Apenas tenta deletar blob local para tracks upload; faixas YouTube são apenas referências
    const trackFromDB = cur.tracks.find((t) => t.id === trackId);
    if (trackFromDB?.kind === 'upload') {
      await deleteAudioBlob(trackId);
    }
    const lib: MusicLibrary = {
      ...cur,
      tracks: cur.tracks.filter((t) => t.id !== trackId),
      playlists: cur.playlists.map((p) => ({
        ...p,
        items: p.items.filter((it) => !((it.kind === 'upload' && it.trackId === trackId) || (it.kind === 'youtube' && it.refId === trackId))),
      })),
      pinnedQuick: cur.pinnedQuick.filter((k) => k !== pinTrackKey(trackId)),
    };
    if (lib.activePlaylistId && !lib.playlists.some((p) => p.id === lib.activePlaylistId)) {
      lib.activePlaylistId = null;
    }
    writeLibrary(lib);
    set(lib);
  },

  /* v4.22.0 — cada início de reprodução soma 1 (usado por "Mais tocado"). */
  registerPlay: (trackId) => {
    const cur = seedLibrary(readLibrary());
    let touched = false;
    const tracks = cur.tracks.map((t) => {
      if (t.id !== trackId) return t;
      touched = true;
      return { ...t, playCount: (t.playCount ?? 0) + 1 };
    });
    if (!touched) return;
    const lib = { ...cur, tracks };
    writeLibrary(lib);
    set(lib);
  },

  createPlaylist: (name, type = 'music') => {
    const cur = readLibrary();
    const pl: Playlist = {
      id: newId('pl'),
      name: name.trim() || 'Nova playlist',
      items: [],
      createdAt: Date.now(),
      type,
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
      pinnedQuick: cur.pinnedQuick.filter((k) => k !== pinPlaylistKey(playlistId)),
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
                {
                  id: newId('it'),
                  kind: 'upload',
                  trackId,
                  title: track.name,
                  artist: track.artist,
                  durationSec: track.durationSec,
                } as PlaylistItem,
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

  /* v4.41.0 — link externo: tenta expandir em faixas; se falhar, container. */
  addExternalLinkToPlaylist: async (playlistId, kind, ref, title, addToLibrary = true) => {
    let source: ExternalListResult | null = null;
    let error = '';
    try {
      source = await fetchExternalList(kind, ref.kind, ref.id);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Não foi possível buscar as faixas.';
    }

    const cur = readLibrary();
    const playlist = cur.playlists.find((p) => p.id === playlistId);
    if (!playlist) {
      return { added: 0, container: false, error: 'Playlist não encontrada.' };
    }

    const candidates = source
      ? makeExternalItems(kind, source)
      : [makeExternalContainer(kind, ref, title)];
    const existing = new Set(playlist.items.map(externalItemKey));
    const fresh = candidates.filter((item) => !existing.has(externalItemKey(item)));
    const items = [...playlist.items, ...fresh];

    // Músicas individuais do YouTube (link de vídeo) também entram em
    // "Suas músicas", espelhando o comportamento dos uploads.
    const isVideoRef = ref.kind === 'video' || source?.sourceType === 'video';
    const singleVideo = kind === 'youtube' && isVideoRef;

    // Disponibiliza as faixas externas na biblioteca global (como músicas upadas),
    // para que possam ser adicionadas em qualquer playlist.
    let externalTracks = cur.externalTracks || [];
    if (addToLibrary && kind === 'youtube' && (source || isVideoRef)) {
      const sourceTracks = source?.tracks ?? [
        { refId: ref.id, refType: 'video' as const, title: title.trim() || 'Vídeo do YouTube' },
      ];
      const existingExt = new Set(externalTracks.map((t) => t.refId));
      const newExt = sourceTracks
        .filter((t) => t.refId && !existingExt.has(t.refId))
        .map((t) => ({
          id: newId('ext'),
          kind: 'youtube' as const,
          refId: t.refId,
          title: t.title,
          artist: t.artist,
          thumbnail: t.thumbnail || source?.cover,
          durationSec: t.durationSec,
          addedAt: Date.now(),
        }));
      if (newExt.length > 0) externalTracks = [...externalTracks, ...newExt];
    }

    const lib: MusicLibrary = {
      ...cur,
      externalTracks,
      playlists: cur.playlists.map((p) => {
        if (p.id === playlistId) return { ...p, items };
        // Músicas individuais do YouTube (vídeo) também aparecem em
        // "Suas músicas" (espelha uploads).
        if (singleVideo && addToLibrary && p.id === SUAS_MUSICAS_ID) {
          const existingSuas = new Set(p.items.map(externalItemKey));
          const toAdd = fresh.filter((it) => !existingSuas.has(externalItemKey(it)));
          if (toAdd.length === 0) return p;
          return { ...p, items: [...p.items, ...toAdd] };
        }
        return p;
      }),
    };
    writeLibrary(lib);
    set(lib);

    return {
      added: fresh.length,
      container: !source,
      sourceTitle: source?.title,
      truncated: source?.truncated,
      error: error || undefined,
    };
  },

  /* v4.41.0 — expande um container antigo no lugar, preservando a ordem. */
  expandExternalItem: async (playlistId, itemId) => {
    const cur = readLibrary();
    const playlist = cur.playlists.find((p) => p.id === playlistId);
    const item = playlist?.items.find((it) => it.id === itemId);
    if (!playlist || !item || (item.kind !== 'youtube' && item.kind !== 'spotify')) {
      return { added: 0, container: true, error: 'Item externo não encontrado.' };
    }

    const sourceKind = externalItemSourceKind(item);
    if (sourceKind !== 'playlist' && sourceKind !== 'album') {
      return { added: 0, container: true, error: 'Este item já é uma faixa individual.' };
    }

    let source: ExternalListResult;
    try {
      source = await fetchExternalList(item.kind, sourceKind, item.refId);
    } catch (e) {
      return {
        added: 0,
        container: true,
        error: e instanceof Error ? e.message : 'Não foi possível expandir este item.',
      };
    }

    const candidates = makeExternalItems(item.kind, source);
    const existing = new Set(
      playlist.items.filter((it) => it.id !== itemId).map(externalItemKey),
    );
    const fresh = candidates.filter((it) => !existing.has(externalItemKey(it)));
    if (fresh.length === 0) {
      // As faixas já existem: remove o container para não deixar uma
      // "playlist única" duplicada na fila do treino.
      const items = playlist.items.filter((it) => it.id !== itemId);
      const lib: MusicLibrary = {
        ...cur,
        playlists: cur.playlists.map((p) => (p.id === playlistId ? { ...p, items } : p)),
      };
      writeLibrary(lib);
      set(lib);
      return {
        added: 0,
        container: false,
        sourceTitle: source.title,
        truncated: source.truncated,
        error: 'As faixas desse item já estavam na playlist.',
      };
    }

    const idx = playlist.items.findIndex((it) => it.id === itemId);
    const items = [
      ...playlist.items.slice(0, idx),
      ...fresh,
      ...playlist.items.slice(idx + 1),
    ];
    const lib: MusicLibrary = {
      ...cur,
      playlists: cur.playlists.map((p) => (p.id === playlistId ? { ...p, items } : p)),
    };
    writeLibrary(lib);
    set(lib);

    return {
      added: fresh.length,
      container: false,
      sourceTitle: source.title,
      truncated: source.truncated,
    };
  },

  addExternalTrackToPlaylist: (playlistId, trackId) => {
    const cur = readLibrary();
    const playlist = cur.playlists.find((p) => p.id === playlistId);
    const track = cur.externalTracks.find((t) => t.id === trackId);
    if (!playlist || !track) return;
    const item: PlaylistItem = {
      id: newId('it'),
      kind: 'youtube',
      refId: track.refId,
      refType: 'video',
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      durationSec: track.durationSec,
      sourceTitle: track.title,
    };
    const existing = new Set(playlist.items.map(externalItemKey));
    if (existing.has(externalItemKey(item))) return;
    const items = [...playlist.items, item];
    const lib: MusicLibrary = {
      ...cur,
      playlists: cur.playlists.map((p) => (p.id === playlistId ? { ...p, items } : p)),
    };
    writeLibrary(lib);
    set(lib);
  },

  removeExternalTrack: (trackId) => {
    const cur = readLibrary();
    const lib: MusicLibrary = {
      ...cur,
      externalTracks: cur.externalTracks.filter((t) => t.id !== trackId),
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('academia:workout-playlist-changed', { detail: playlistId }),
      );
    }
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

  /* v4.21.0 — fixar/desafixar um álbum ou música nas Escolhas rápidas */
  togglePin: (key) => {
    const cur = readLibrary();
    const has = cur.pinnedQuick.includes(key);
    const lib: MusicLibrary = {
      ...cur,
      pinnedQuick: has ? cur.pinnedQuick.filter((k) => k !== key) : [...cur.pinnedQuick, key],
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
      const playlist = u.pathname.match(/^\/playlist\/([^/?#]+)/);
      if (playlist) return { kind: 'list', id: playlist[1] };
      const video = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/);
      if (video) return { kind: 'video', id: video[1] };
    }
    return null;
  } catch {
    return null;
  }
}

export type SpotifyRef = { kind: 'playlist' | 'album' | 'track'; id: string };

/** Aceita open.spotify.com/(playlist|album|track)/<id>, URI spotify:... e ID colado. */
export function parseSpotifyLink(url: string): SpotifyRef | null {
  const raw = url.trim();
  const uri = raw.match(/^spotify:(playlist|album|track):([A-Za-z0-9]+)$/i);
  if (uri) {
    return { kind: uri[1].toLowerCase() as SpotifyRef['kind'], id: uri[2] };
  }
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, '');
    if (host !== 'open.spotify.com') return null;
    const m = u.pathname.match(/\/(playlist|album|track)\/([A-Za-z0-9]+)/);
    return m ? { kind: m[1] as SpotifyRef['kind'], id: m[2] } : null;
  } catch {
    // Aceita também só o ID colado (22 chars alfanuméricos do Spotify)
    return /^[A-Za-z0-9]{16,30}$/.test(raw) ? { kind: 'playlist', id: raw } : null;
  }
}

/** Compatibilidade com chamadas antigas (retorna só o ID). */
export function parseSpotifyRef(url: string): string | null {
  return parseSpotifyLink(url)?.id ?? null;
}
