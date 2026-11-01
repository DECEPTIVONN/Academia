/**
 * /api/push-dispatch — entrega de notificações com o app FECHADO (v4.67.0)
 *
 * GET  /api/push-dispatch?action=key   → devolve a chave pública VAPID
 * GET  /api/push-dispatch?action=cron  → verifica o que está vencido e envia
 *
 * POR QUE UM ENDPOINT: o agendador do cliente (`features/notifications/
 * scheduler.ts`) só roda com o app aberto. Push de verdade precisa de um
 * servidor que assine as mensagens com a chave privada VAPID e criptografe o
 * corpo por assinatura (Web Push / RFC 8291).
 *
 * SEM DEPENDÊNCIA EXTERNA: a criptografia é feita aqui com `node:crypto`
 * (ECDH P-256, HKDF-SHA256 e AES-128-GCM) e o JWT VAPID com ES256. Isso evita
 * empacotar `web-push` em uma função serverless que só é usada de hora em hora.
 *
 * VARIÁVEIS DE AMBIENTE (Vercel → Settings → Environment Variables):
 *   VAPID_PUBLIC_KEY          chave pública (base64url, 65 bytes)
 *   VAPID_PRIVATE_KEY         chave privada (base64url, 32 bytes)
 *   VAPID_SUBJECT             "mailto:voce@dominio.com"
 *   SUPABASE_URL              https://<projeto>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY service role (só no servidor!)
 *   CRON_SECRET               segredo que autoriza a rota action=cron
 *
 * GERAR AS CHAVES UMA VEZ (guardar em local seguro):
 *   node -e "const c=require('crypto');const e=c.createECDH('prime256v1');
 *   e.generateKeys();console.log('PUBLIC='+e.getPublicKey().toString('base64url'));
 *   console.log('PRIVATE='+e.getPrivateKey().toString('base64url'))"
 *
 * AGENDAMENTO: aponte um cron (Vercel Cron, cron-job.org, GitHub Actions) para
 * `GET /api/push-dispatch?action=cron` a cada 5–15 min, com o header
 * `Authorization: Bearer $CRON_SECRET`. No plano Hobby da Vercel o cron é
 * diário; use um agendador externo para a granularidade de minutos.
 */

import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

/* ── Configuração de produto (espelha scheduler.ts) ── */

const MOTIVATION_HOUR = 12;
const WEEKLY_WARNING_MS = 45 * 60 * 1000;
const MONTHLY_WARNING_MS = 60 * 60 * 1000;
/** Um aviso por chave dentro de 7 dias. */
const SENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ROWS = 5000;

/** Frases do dia (mesmo tom de `features/notifications/messages.ts`). */
const PHRASES = [
  'Cada série conta. Vamos nessa.',
  'A constância vence o talento.',
  'Um treino muda o seu dia.',
  'Seu eu de amanhã agradece.',
  'Disciplina é liberdade.',
  'Comece pequeno, mas comece hoje.',
  'O corpo cobra o que a mente promete.',
  'Progresso, não perfeição.',
];

/* ── Base64url ── */

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const fromB64u = (value) => Buffer.from(String(value ?? ''), 'base64url');

/* ── Criptografia do Web Push (RFC 8291 / aes128gcm) ── */

/** HKDF com um único bloco de saída (basta para 16 e 32 bytes). */
function hkdf(ikm, salt, info, length) {
  const prk = crypto.createHmac('sha256', salt).update(ikm).digest();
  const okm = crypto
    .createHmac('sha256', prk)
    .update(Buffer.concat([info, Buffer.from([0x01])]))
    .digest();
  return okm.subarray(0, length);
}

/**
 * Corpo cifrado de uma notificação. Devolve o payload no formato
 * `aes128gcm` (salt | rs | idlen | chave efêmera | ciphertext+tag).
 */
function encryptPayload(subscription, message) {
  const uaPublic = fromB64u(subscription.keys.p256dh);
  const authSecret = fromB64u(subscription.keys.auth);
  if (uaPublic.length !== 65 || authSecret.length !== 16) {
    throw new Error('invalid-subscription-keys');
  }

  const ephemeral = crypto.createECDH('prime256v1');
  ephemeral.generateKeys();
  const asPublic = ephemeral.getPublicKey(); // 65 bytes, não comprimida
  const sharedSecret = ephemeral.computeSecret(uaPublic);

  const ikm = hkdf(
    sharedSecret,
    authSecret,
    Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]),
    32,
  );

  const salt = crypto.randomBytes(16);
  const cek = hkdf(ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12);

  const recordSize = 4096;
  /* 0x02 = último (e único) registro do conteúdo. */
  const plaintext = Buffer.concat([Buffer.from(JSON.stringify(message)), Buffer.from([0x02])]);

  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);

  const header = Buffer.alloc(21);
  salt.copy(header, 0);
  header.writeUInt32BE(recordSize, 16);
  header.writeUInt8(asPublic.length, 20);

  return Buffer.concat([header, asPublic, ciphertext]);
}

/** Cabeçalhos VAPID (JWT ES256) + criptografia. */
function buildRequest(subscription, message, vapid) {
  const { endpoint } = subscription;
  const audience = new URL(endpoint).origin;

  const jwtHeader = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const jwtPayload = b64u(
    JSON.stringify({
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
      sub: vapid.subject,
    }),
  );
  const unsigned = `${jwtHeader}.${jwtPayload}`;

  const privateKeyBytes = fromB64u(vapid.privateKey);
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.setPrivateKey(privateKeyBytes);
  const publicBytes = ecdh.getPublicKey();

  const key = crypto.createPrivateKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      d: b64u(privateKeyBytes),
      x: b64u(publicBytes.subarray(1, 33)),
      y: b64u(publicBytes.subarray(33, 65)),
    },
    format: 'jwk',
  });

  /* ieee-p1363 = r||s cru (formato do JOSE), sem o envelope DER. */
  const signature = crypto.sign('sha256', Buffer.from(unsigned), {
    key,
    dsaEncoding: 'ieee-p1363',
  });

  return {
    headers: {
      Authorization: `vapid t=${unsigned}.${b64u(signature)}, k=${vapid.publicKey}`,
      TTL: '86400',
      Urgency: 'normal',
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
    },
    body: encryptPayload(subscription, message),
  };
}

/** Envia. Devolve `{ ok, gone }` — `gone` pede remoção da assinatura. */
async function sendPush(subscription, message, vapid) {
  const { headers, body } = buildRequest(subscription, message, vapid);
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers,
    body,
  });

  if (response.ok) return { ok: true, gone: false, status: response.status };
  return {
    ok: false,
    gone: response.status === 404 || response.status === 410,
    status: response.status,
  };
}

/* ── Janelas das ligas (espelham features/social/league-window.ts) ── */

/**
 * Converte o instante real para o "horário local do aparelho" deslocado, para
 * podermos usar os getters UTC como se fossem os locais.
 */
function localNow(nowMs, offsetMin) {
  return new Date(nowMs + offsetMin * 60 * 1000);
}

function weeklyWindow(local) {
  const start = new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), 19, 0, 0, 0),
  );
  start.setUTCDate(start.getUTCDate() - start.getUTCDay()); // 0 = domingo
  if (start.getTime() > local.getTime()) start.setUTCDate(start.getUTCDate() - 7);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  end.setUTCMilliseconds(-1); // domingo 18:59:59.999

  return { start: start.getTime(), end: end.getTime() };
}

function monthlyWindow(local) {
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();

  let start = Date.UTC(year, month, 1, 6, 0, 0, 0);
  if (start > local.getTime()) start = Date.UTC(year, month - 1, 1, 6, 0, 0, 0);

  const startDate = new Date(start);
  const end = Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth() + 1,
    0,
    21,
    0,
    0,
    0,
  );

  return { start, end };
}

/** "Falta 1 h 20 min" (mesmo texto de `formatTimeLeft`). */
function timeLeft(ms) {
  const minutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0 && rest > 0) return `Falta ${hours} h ${rest} min`;
  if (hours > 0) return `Falta ${hours} h`;
  return `Faltam ${rest} min`;
}

function parseTime(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? '').trim());
  if (!match) return { hour: 18, minute: 0 };
  return { hour: Math.min(23, Number(match[1])), minute: Math.min(59, Number(match[2])) };
}

function dateKey(local) {
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  return `${local.getUTCFullYear()}-${month}-${day}`;
}

function phraseFor(dateKeyValue) {
  let hash = 0;
  for (let i = 0; i < dateKeyValue.length; i += 1) {
    hash = (hash * 31 + dateKeyValue.charCodeAt(i)) >>> 0;
  }
  return PHRASES[hash % PHRASES.length];
}

/* ── Dedupe por assinatura ── */

function pruneKeys(keys) {
  const cutoff = Date.now() - SENT_TTL_MS;
  const entries = Object.entries(keys ?? {}).filter(([, at]) => Number(at) >= cutoff);
  entries.sort((a, b) => b[1] - a[1]);
  return Object.fromEntries(entries.slice(0, 12));
}

function wasSent(keys, key) {
  const at = Number((keys ?? {})[key] ?? 0);
  return at > 0 && Date.now() - at < SENT_TTL_MS;
}

/* ── Montagem das mensagens ── */

function buildMessages(row, profile, nowMs) {
  const offset = Number(row.timezone_offset) || 0;
  const local = localNow(nowMs, offset);
  const dayKey = dateKey(local);
  const phrase = phraseFor(dayKey);
  const minutesOfDay = local.getUTCHours() * 60 + local.getUTCMinutes();

  const streak = Number(profile?.streak) || 0;
  const name = String(profile?.display_name || '').trim();
  const hello = name ? `${name}, ` : '';

  const messages = [];
  const keys = row.sent_keys ?? {};

  /* 1) Frase do dia a partir do meio-dia local. */
  if (row.notify_motivation && local.getUTCHours() >= MOTIVATION_HOUR) {
    const key = `motivation:${dayKey}`;
    if (!wasSent(keys, key)) {
      messages.push({
        key,
        payload: {
          kind: 'motivation',
          title: streak > 1 ? `Ofensiva de ${streak} dias 🔥` : 'Um treino muda o seu dia',
          body: `${hello}${phrase} Que tal treinar agora?`,
          tag: 'evofit-motivation',
          url: '/',
        },
      });
    }
  }

  /* 2) Lembrete no horário escolhido. */
  if (row.notify_reminder) {
    const { hour, minute } = parseTime(row.reminder_time);
    const key = `reminder:${dayKey}`;
    if (minutesOfDay >= hour * 60 + minute && !wasSent(keys, key)) {
      messages.push({
        key,
        payload: {
          kind: 'reminder',
          title:
            streak > 1
              ? `Treino das ${row.reminder_time} esperando`
              : `Hora do treino (${row.reminder_time})`,
          body:
            streak > 1
              ? `${streak} dias seguidos. Mantenha a sequência — ${phrase}`
              : `${phrase} Bora começar?`,
          tag: 'evofit-reminder',
          url: '/',
        },
      });
    }
  }

  /* 3) Fim das ligas (semanal 45 min antes, mensal 1 h antes). */
  if (row.notify_leagues) {
    const weekly = weeklyWindow(local);
    const weeklyLeft = weekly.end - local.getTime();
    if (weeklyLeft > 0 && weeklyLeft <= WEEKLY_WARNING_MS) {
      const key = `league-weekly:${new Date(weekly.end).toISOString()}`;
      if (!wasSent(keys, key)) {
        messages.push({
          key,
          payload: {
            kind: 'league',
            title: 'Liga semanal termina em breve',
            body: `${timeLeft(weeklyLeft)}. Garanta seus pontos antes do fechamento.`,
            tag: 'evofit-league-weekly',
            url: '/',
          },
        });
      }
    }

    const monthly = monthlyWindow(local);
    const monthlyLeft = monthly.end - local.getTime();
    if (monthlyLeft > 0 && monthlyLeft <= MONTHLY_WARNING_MS) {
      const key = `league-monthly:${new Date(monthly.end).toISOString()}`;
      if (!wasSent(keys, key)) {
        messages.push({
          key,
          payload: {
            kind: 'league',
            title: 'Liga mensal termina em breve',
            body: `${timeLeft(monthlyLeft)}. Garanta seus pontos antes do fechamento.`,
            tag: 'evofit-league-monthly',
            url: '/',
          },
        });
      }
    }
  }

  return messages;
}

/* ── Handler ── */

function readEnv() {
  return {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || 'mailto:contato@evofit.app',
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    cronSecret: process.env.CRON_SECRET || '',
  };
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function isAuthorized(req, secret) {
  if (!secret) return false;
  const header = String(req.headers?.authorization || '');
  if (header === `Bearer ${secret}`) return true;

  try {
    const url = new URL(req.url || '/', 'https://local.invalid');
    return url.searchParams.get('secret') === secret;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const env = readEnv();

  let action = '';
  try {
    action = String(new URL(req.url || '/', 'https://local.invalid').searchParams.get('action') || '');
  } catch {
    action = '';
  }

  /* 1) Chave pública — o cliente precisa dela para assinar. */
  if (action === 'key') {
    if (!env.publicKey) {
      send(res, 200, { configured: false, key: null });
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=3600');
    send(res, 200, { configured: true, key: env.publicKey });
    return;
  }

  /* 2) Disparo (cron com segredo). */
  if (action !== 'cron') {
    send(res, 400, { error: 'Use ?action=key ou ?action=cron.' });
    return;
  }

  if (!env.cronSecret) {
    send(res, 500, { error: 'CRON_SECRET não configurado.' });
    return;
  }
  if (!isAuthorized(req, env.cronSecret)) {
    send(res, 401, { error: 'Não autorizado.' });
    return;
  }
  if (!env.publicKey || !env.privateKey) {
    send(res, 500, { error: 'Chaves VAPID não configuradas.' });
    return;
  }
  if (!env.supabaseUrl || !env.serviceRole) {
    send(res, 500, { error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados.' });
    return;
  }

  const supabase = createClient(env.supabaseUrl, env.serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rows, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(MAX_ROWS);

  if (error) {
    send(res, 502, { error: `Falha ao ler assinaturas: ${error.message}` });
    return;
  }

  const nowMs = Date.now();
  const vapid = { publicKey: env.publicKey, privateKey: env.privateKey, subject: env.subject };

  /* Perfis (ofensiva/nome) para personalizar o texto. */
  const userIds = [...new Set((rows ?? []).map((row) => row.user_id))];
  const profiles = new Map();
  if (userIds.length > 0) {
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, username, display_name, streak')
      .in('id', userIds);
    for (const profile of profileRows ?? []) profiles.set(profile.id, profile);
  }

  let sent = 0;
  let removed = 0;
  let failed = 0;
  const details = [];

  for (const row of rows ?? []) {
    const messages = buildMessages(row, profiles.get(row.user_id), nowMs);
    if (messages.length === 0) continue;

    const keys = { ...(row.sent_keys ?? {}) };
    let delivered = 0;

    for (const message of messages) {
      try {
        const result = await sendPush(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          message.payload,
          vapid,
        );

        if (result.ok) {
          keys[message.key] = Date.now();
          sent += 1;
          delivered += 1;
        } else if (result.gone) {
          await supabase.from('push_subscriptions').delete().eq('id', row.id);
          removed += 1;
          break;
        } else {
          failed += 1;
          details.push({ id: row.id, status: result.status });
          break;
        }
      } catch (err) {
        failed += 1;
        details.push({ id: row.id, error: err?.message ?? 'send-failed' });
        break;
      }
    }

    if (delivered > 0) {
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({
          sent_keys: pruneKeys(keys),
          last_sent_at: new Date().toISOString(),
          failures: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      if (updateError) details.push({ id: row.id, error: updateError.message });
    } else if (failed > 0) {
      const nextFailures = Number(row.failures || 0) + 1;
      if (nextFailures > 5) {
        await supabase.from('push_subscriptions').delete().eq('id', row.id);
        removed += 1;
      } else {
        await supabase
          .from('push_subscriptions')
          .update({ failures: nextFailures })
          .eq('id', row.id);
      }
    }
  }

  send(res, 200, {
    ok: true,
    checked: (rows ?? []).length,
    sent,
    removed,
    failed,
    details: details.slice(0, 10),
  });
}

/* Exportados para teste local (`node tools/check-push.mjs`). */
export { encryptPayload, buildRequest, weeklyWindow, monthlyWindow, buildMessages };
