/**
 * external-music.ts — metadados leves de playlists externas (v4.41.0)
 *
 * YouTube: Data API v3 (playlistItems + videos) usando VITE_YOUTUBE_API_KEY.
 *  • Só buscamos título, thumbnail e duração; NÃO buscamos views/canal.
 *  • Uma playlist é expandida em faixas individuais (vídeos) para entrar na
 *    fila do treino e aparecer com capa em todos os players.
 *
 * Spotify: o embed público é lido por uma função serverless nossa
 *  (`/api/spotify-playlist`). Não usamos Web Playback SDK, não pedimos
 *  Premium e não colocamos Client Secret no frontend/repo/Vercel. O áudio
 *  continua sendo reproduzido pelo iframe oficial do Spotify.
 *
 * Este módulo não importa o media-store (evita ciclo): recebe/ref torna
 * apenas IDs e devolve uma lista normalizada.
 */

export type ExternalRefKind = 'video' | 'playlist' | 'track' | 'album';

export interface ExternalTrack {
  refId: string;
  refType: 'video' | 'track';
  title: string;
  artist?: string;
  thumbnail?: string;
  durationSec?: number;
}

export interface ExternalListResult {
  source: 'youtube' | 'spotify';
  sourceType: ExternalRefKind;
  sourceId: string;
  title: string;
  cover?: string;
  tracks: ExternalTrack[];
  /** A fonte tem mais faixas do que o limite que conseguimos listar. */
  truncated?: boolean;
}

const YT_API = 'https://www.googleapis.com/youtube/v3';
const MAX_YOUTUBE_TRACKS = 200;
const YT_PAGE_SIZE = 50;

function youtubeApiKey(): string {
  return String(import.meta.env.VITE_YOUTUBE_API_KEY || '').trim();
}

interface YtThumbnail {
  url?: string;
}

interface YtPlaylistItem {
  snippet?: {
    title?: string;
    resourceId?: { videoId?: string };
    thumbnails?: Record<string, YtThumbnail | undefined>;
  };
  contentDetails?: { videoId?: string };
}

interface YtPlaylistItemsResponse {
  nextPageToken?: string;
  items?: YtPlaylistItem[];
}

interface YtVideo {
  id?: string;
  snippet?: {
    title?: string;
    thumbnails?: Record<string, YtThumbnail | undefined>;
  };
  contentDetails?: { duration?: string };
}

interface YtVideosResponse {
  items?: YtVideo[];
}

interface YtPlaylistResponse {
  items?: Array<{
    snippet?: {
      title?: string;
      thumbnails?: Record<string, YtThumbnail | undefined>;
    };
  }>;
}

/** Converte ISO-8601 (PT1H2M3S) em segundos. */
export function parseIsoDuration(value?: string): number | undefined {
  if (!value) return undefined;
  const m = value.match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/);
  if (!m) return undefined;
  const days = Number(m[1] || 0);
  const hours = Number(m[2] || 0);
  const minutes = Number(m[3] || 0);
  const seconds = Number(m[4] || 0);
  const total = days * 86400 + hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? Math.round(total) : undefined;
}

function bestThumbnail(
  thumbs: Record<string, YtThumbnail | undefined> | undefined,
  fallbackId?: string,
): string | undefined {
  return (
    thumbs?.maxres?.url ||
    thumbs?.standard?.url ||
    thumbs?.high?.url ||
    thumbs?.medium?.url ||
    thumbs?.default?.url ||
    (fallbackId ? `https://i.ytimg.com/vi/${fallbackId}/mqdefault.jpg` : undefined)
  );
}

async function ytJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = youtubeApiKey();
  if (!key) throw new Error('VITE_YOUTUBE_API_KEY não configurada.');

  const url = new URL(`${YT_API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('key', key);

  const res = await fetch(url);
  if (!res.ok) {
    let apiMessage = '';
    let reason = '';
    try {
      const body = (await res.json()) as {
        error?: { message?: string; errors?: Array<{ reason?: string }> };
      };
      apiMessage = body.error?.message || '';
      reason = body.error?.errors?.[0]?.reason || '';
    } catch {
      /* corpo não-JSON */
    }
    if (reason === 'quotaExceeded' || res.status === 429) {
      throw new Error('Limite diário da YouTube API atingido. Tente novamente mais tarde.');
    }
    if (reason === 'keyInvalid' || reason === 'forbidden') {
      throw new Error('A chave da YouTube API foi recusada (verifique restrições de domínio).');
    }
    throw new Error(apiMessage || `YouTube API respondeu ${res.status}.`);
  }
  return (await res.json()) as T;
}

async function fetchPlaylistTitle(
  playlistId: string,
): Promise<{ title?: string; cover?: string }> {
  try {
    const data = await ytJson<YtPlaylistResponse>('playlists', {
      part: 'snippet',
      id: playlistId,
      maxResults: '1',
    });
    const sn = data.items?.[0]?.snippet;
    return {
      title: sn?.title?.trim(),
      cover: bestThumbnail(sn?.thumbnails, playlistId),
    };
  } catch {
    return {};
  }
}

async function fetchVideoDurations(ids: string[]): Promise<Record<string, number | undefined>> {
  const out: Record<string, number | undefined> = {};
  for (let i = 0; i < ids.length; i += YT_PAGE_SIZE) {
    const chunk = ids.slice(i, i + YT_PAGE_SIZE);
    if (chunk.length === 0) continue;
    const data = await ytJson<YtVideosResponse>('videos', {
      part: 'contentDetails',
      id: chunk.join(','),
      maxResults: String(YT_PAGE_SIZE),
    });
    for (const video of data.items || []) {
      if (video.id) out[video.id] = parseIsoDuration(video.contentDetails?.duration);
    }
  }
  return out;
}

export async function fetchYouTubeVideo(videoId: string): Promise<ExternalListResult> {
  const data = await ytJson<YtVideosResponse>('videos', {
    part: 'snippet,contentDetails',
    id: videoId,
    maxResults: '1',
  });
  const video = data.items?.[0];
  if (!video?.snippet?.title) throw new Error('Vídeo do YouTube não encontrado.');

  const track: ExternalTrack = {
    refId: videoId,
    refType: 'video',
    title: video.snippet.title,
    artist: 'YouTube',
    thumbnail: bestThumbnail(video.snippet.thumbnails, videoId),
    durationSec: parseIsoDuration(video.contentDetails?.duration),
  };

  return {
    source: 'youtube',
    sourceType: 'video',
    sourceId: videoId,
    title: track.title,
    cover: track.thumbnail,
    tracks: [track],
  };
}

export async function fetchYouTubePlaylist(playlistId: string): Promise<ExternalListResult> {
  const collected: Array<{
    id: string;
    title: string;
    thumbnail?: string;
  }> = [];
  const seen = new Set<string>();
  let pageToken = '';
  let truncated = false;

  do {
    const data = await ytJson<YtPlaylistItemsResponse>('playlistItems', {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: String(YT_PAGE_SIZE),
      ...(pageToken ? { pageToken } : {}),
    });

    for (const item of data.items || []) {
      const id = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
      const title = item.snippet?.title?.trim();
      if (!id || !title || seen.has(id)) continue;
      if (title === 'Private video' || title === 'Deleted video') continue;
      seen.add(id);
      collected.push({
        id,
        title,
        thumbnail: bestThumbnail(item.snippet?.thumbnails, id),
      });
      if (collected.length >= MAX_YOUTUBE_TRACKS) {
        truncated = true;
        break;
      }
    }

    pageToken = data.nextPageToken || '';
    if (truncated) break;
  } while (pageToken);

  if (collected.length === 0) {
    throw new Error('Nenhuma faixa pública encontrada nessa playlist do YouTube.');
  }

  const durations = await fetchVideoDurations(collected.map((t) => t.id));
  const meta = await fetchPlaylistTitle(playlistId);

  return {
    source: 'youtube',
    sourceType: 'playlist',
    sourceId: playlistId,
    title: meta.title || 'Playlist do YouTube',
    cover: meta.cover || collected[0]?.thumbnail,
    tracks: collected.map((t) => ({
      refId: t.id,
      refType: 'video',
      title: t.title,
      artist: 'YouTube',
      thumbnail: t.thumbnail,
      durationSec: durations[t.id],
    })),
    truncated: truncated || Boolean(pageToken),
  };
}

interface SpotifyProxyTrack {
  id?: string;
  title?: string;
  artist?: string;
  thumbnail?: string;
  durationSec?: number;
  playable?: boolean;
}

interface SpotifyProxyResponse {
  title?: string;
  cover?: string;
  tracks?: SpotifyProxyTrack[];
  truncated?: boolean;
  error?: string;
}

export async function fetchSpotifyExternal(
  kind: 'playlist' | 'album' | 'track',
  id: string,
): Promise<ExternalListResult> {
  const res = await fetch(
    `/api/spotify-playlist?type=${encodeURIComponent(kind)}&id=${encodeURIComponent(id)}`,
    { headers: { accept: 'application/json' } },
  );

  let body: SpotifyProxyResponse | null = null;
  try {
    body = (await res.json()) as SpotifyProxyResponse;
  } catch {
    /* resposta não-JSON */
  }

  if (!res.ok) {
    throw new Error(body?.error || `Não foi possível ler o Spotify (${res.status}).`);
  }

  const tracks = (body?.tracks || [])
    .filter((t) => t.id && t.title && t.playable !== false)
    .map<ExternalTrack>((t) => ({
      refId: String(t.id),
      refType: 'track',
      title: String(t.title),
      artist: t.artist || 'Spotify',
      thumbnail: t.thumbnail || body?.cover,
      durationSec: t.durationSec,
    }));

  if (tracks.length === 0) {
    throw new Error('Nenhuma faixa reproduzível encontrada nesse link do Spotify.');
  }

  return {
    source: 'spotify',
    sourceType: kind,
    sourceId: id,
    title: body?.title || (kind === 'track' ? 'Faixa do Spotify' : 'Playlist do Spotify'),
    cover: body?.cover || tracks[0]?.thumbnail,
    tracks,
    truncated: Boolean(body?.truncated),
  };
}

/** Dispatcher usado pelos fluxos de "adicionar link". */
export async function fetchExternalList(
  source: 'youtube' | 'spotify',
  kind: ExternalRefKind,
  id: string,
): Promise<ExternalListResult> {
  if (source === 'youtube') {
    if (kind === 'playlist') return fetchYouTubePlaylist(id);
    if (kind === 'video') return fetchYouTubeVideo(id);
    throw new Error('Tipo de link do YouTube não suportado.');
  }
  if (kind === 'playlist' || kind === 'album' || kind === 'track') {
    return fetchSpotifyExternal(kind, id);
  }
  throw new Error('Tipo de link do Spotify não suportado.');
}

/** URL oficial do embed (o áudio do Spotify só toca dentro dele). */
export function spotifyEmbedUrl(
  kind: 'playlist' | 'album' | 'track',
  id: string,
): string {
  return `https://open.spotify.com/embed/${kind}/${encodeURIComponent(id)}?utm_source=generator&theme=0`;
}
