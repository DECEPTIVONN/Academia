/**
 * /api/spotify-playlist — lista faixas públicas do Spotify sem segredo (v4.41.0)
 *
 * CÓPIA de compatibilidade para deploy com Root Directory na raiz do repo.
 * A versão publicada pelo projeto Vercel (Root Directory = src-app) é
 * `src-app/api/spotify-playlist.js`; mantenha as duas em sincronia.
 *
 * O embed público do Spotify entrega um __NEXT_DATA__ com a playlist/track.
 * O browser não pode lê-lo por CORS; esta função faz a leitura no servidor e
 * devolve JSON normalizado. Nenhum Client Secret é usado ou armazenado.
 *
 * Uso: GET /api/spotify-playlist?type=playlist|album|track&id=<spotifyId>
 */

const SPOTIFY_ID = /^[A-Za-z0-9]{16,30}$/;
const ALLOWED_TYPES = new Set(['playlist', 'album', 'track']);

function cleanText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function artistsText(entity) {
  if (Array.isArray(entity && entity.artists)) {
    const names = entity.artists
      .map((artist) => cleanText(artist && (artist.name || artist.title)))
      .filter(Boolean);
    if (names.length > 0) return names.join(', ');
  }
  return cleanText(entity && entity.subtitle) || 'Spotify';
}

function coverUrl(entity) {
  const sources = entity && entity.coverArt && entity.coverArt.sources;
  if (Array.isArray(sources)) {
    for (const source of sources) {
      if (source && source.url) return source.url;
    }
  }
  const visual = entity && entity.visualIdentity && entity.visualIdentity.image;
  if (Array.isArray(visual)) {
    for (const image of visual) {
      if (image && image.url) return image.url;
    }
  }
  return undefined;
}

function extractNextData(html) {
  const match = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!match) throw new Error('Spotify não retornou os dados do embed.');
  return JSON.parse(match[1]);
}

function buildResult(entity, requestedType, requestedId) {
  if (!entity || typeof entity !== 'object') {
    throw new Error('Entidade do Spotify não encontrada.');
  }

  const type = cleanText(entity.type) || requestedType;
  const id =
    cleanText(entity.id) ||
    cleanText(entity.uri).split(':').pop() ||
    requestedId;
  const title =
    cleanText(entity.name) ||
    cleanText(entity.title) ||
    (type === 'track' ? 'Faixa do Spotify' : 'Playlist do Spotify');
  const cover = coverUrl(entity);

  if (type === 'track') {
    return {
      source: 'spotify',
      sourceType: 'track',
      sourceId: id,
      title,
      cover,
      tracks: [
        {
          id,
          title,
          artist: artistsText(entity),
          thumbnail: cover,
          durationSec: entity.duration ? Math.round(entity.duration / 1000) : undefined,
          playable: entity.isPlayable !== false,
        },
      ],
      truncated: false,
    };
  }

  const list = Array.isArray(entity.trackList) ? entity.trackList : [];
  const tracks = [];
  const seen = new Set();

  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const uri = cleanText(item.uri);
    const trackId = uri.startsWith('spotify:track:') ? uri.split(':').pop() : '';
    const itemTitle = cleanText(item.title);
    if (!trackId || !itemTitle || seen.has(trackId)) continue;
    if (item.entityType && item.entityType !== 'track') continue;
    seen.add(trackId);
    tracks.push({
      id: trackId,
      title: itemTitle,
      artist: cleanText(item.subtitle) || 'Spotify',
      thumbnail: cover,
      durationSec: item.duration ? Math.round(item.duration / 1000) : undefined,
      playable: item.isPlayable !== false,
    });
  }

  return {
    source: 'spotify',
    sourceType: requestedType,
    sourceId: id,
    title,
    cover,
    tracks,
    /* O embed costuma entregar 50 faixas; o iframe completo continua no Spotify. */
    truncated: list.length >= 50,
  };
}

async function fetchSpotifyEntity(type, id) {
  if (!ALLOWED_TYPES.has(type)) throw new Error('Tipo de Spotify inválido.');
  if (!SPOTIFY_ID.test(id)) throw new Error('ID do Spotify inválido.');

  const url = `https://open.spotify.com/embed/${type}/${id}`;
  const res = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
      accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!res.ok) {
    throw new Error(`Spotify respondeu ${res.status}.`);
  }

  const html = await res.text();
  const nextData = extractNextData(html);
  const entity = nextData?.props?.pageProps?.state?.data?.entity;
  return buildResult(entity, type, id);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Método não permitido.' }));
    return;
  }

  let type = String(req.query?.type || '').toLowerCase();
  let id = String(req.query?.id || '').trim();
  if ((!type || !id) && typeof req.url === 'string') {
    try {
      const parsed = new URL(req.url, 'https://local.invalid');
      type = type || String(parsed.searchParams.get('type') || '').toLowerCase();
      id = id || String(parsed.searchParams.get('id') || '').trim();
    } catch {
      /* usa query */
    }
  }

  try {
    const result = await fetchSpotifyEntity(type, id);
    /* Cache na borda: evita bater no Spotify a cada abertura do player. */
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.statusCode = 200;
    res.end(JSON.stringify(result));
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 502;
    res.end(
      JSON.stringify({
        error:
          err && err.message
            ? err.message
            : 'Não foi possível obter a playlist do Spotify.',
      }),
    );
  }
};

module.exports.fetchSpotifyEntity = fetchSpotifyEntity;
module.exports.buildResult = buildResult;
