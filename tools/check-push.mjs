#!/usr/bin/env node
/**
 * check-push — valida a criptografia do endpoint de push no próprio Node.
 *
 * Por que existe: `api/push-dispatch.js` implementa a RFC 8291 na mão (sem
 * `web-push`). Um erro de salt/HKDF/aad não quebra o build — aparece como
 * "push silencioso que nunca chega". Este script faz o caminho completo:
 *
 *   1. gera um par de chaves de "usuário" (como o navegador faz);
 *   2. chama `buildRequest` do endpoint (cifra + assina o JWT VAPID);
 *   3. DESCRIPTOGRAFA o corpo como o navegador faria e compara o JSON;
 *   4. confere o JWT VAPID (assinatura ES256 e claims aud/exp/sub);
 *   5. confere as janelas de liga contra as datas oficiais.
 *
 * Uso: node tools/check-push.mjs      (0 = tudo certo)
 */

import crypto from 'node:crypto';

const { buildRequest } = await import('../src-app/api/push-dispatch.js');

/* ── Chaves ── */

/** Par VAPID do "servidor" (o mesmo formato do env). */
function vapidKeypair() {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  return {
    publicKey: ecdh.getPublicKey().toString('base64url'),
    privateKey: ecdh.getPrivateKey().toString('base64url'),
    subject: 'mailto:teste@evofit.app',
  };
}

/** Par do navegador + auth secret (subscription). */
function browserSubscription() {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  const auth = crypto.randomBytes(16);
  return {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
    keys: {
      p256dh: ecdh.getPublicKey().toString('base64url'),
      auth: auth.toString('base64url'),
    },
    _private: ecdh.getPrivateKey(),
    _auth: auth,
  };
}

/* ── Decifra como o navegador ── */

function hkdf(ikm, salt, info, length) {
  const prk = crypto.createHmac('sha256', salt).update(ikm).digest();
  return crypto
    .createHmac('sha256', prk)
    .update(Buffer.concat([info, Buffer.from([0x01])]))
    .digest()
    .subarray(0, length);
}

function decrypt(body, subscription, serverPublic) {
  const salt = body.subarray(0, 16);
  const recordSize = body.readUInt32BE(16);
  const idLength = body.readUInt8(20);
  const keyId = body.subarray(21, 21 + idLength);
  const ciphertext = body.subarray(21 + idLength);

  if (recordSize !== 4096) throw new Error(`record size inesperado: ${recordSize}`);
  if (keyId.length !== 65) throw new Error('chave efêmera não tem 65 bytes');
  if (keyId.toString('base64url') !== serverPublic.toString('base64url')) {
    throw new Error('keyid difere da chave efêmera do cabeçalho');
  }

  const uaPublic = Buffer.from(subscription.keys.p256dh, 'base64url');
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.setPrivateKey(subscription._private);
  const shared = ecdh.computeSecret(keyId);

  const ikm = hkdf(
    shared,
    subscription._auth,
    Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, keyId]),
    32,
  );
  const cek = hkdf(ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12);

  const tag = ciphertext.subarray(ciphertext.length - 16);
  const data = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = crypto.createDecipheriv('aes-128-gcm', cek, nonce);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]);

  /* 0x02 = último registro: remove o padding à direita. */
  const end = plain.lastIndexOf(0x02);
  return plain.subarray(0, end).toString('utf8');
}

/* ── Verificação ── */

let failures = 0;
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ok  ${label}`);
    return;
  }
  failures += 1;
  console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
}

const vapid = vapidKeypair();
const subscription = browserSubscription();
const payload = {
  kind: 'reminder',
  title: 'Hora do treino (18:00)',
  body: 'A constância vence o talento. Bora começar?',
  tag: 'evofit-reminder',
  url: '/',
};

console.log('1) Cifra + JWT VAPID');
const request = buildRequest(subscription, payload, vapid);
check('Authorization é vapid t=…, k=…', /^vapid t=.+, k=[\w-]+$/.test(request.headers.Authorization));
check('Content-Encoding aes128gcm', request.headers['Content-Encoding'] === 'aes128gcm');
check('TTL presente', request.headers.TTL === '86400');

console.log('2) Descriptografia (lado do navegador)');
const authHeader = request.headers.Authorization;
const jwt = authHeader.slice('vapid t='.length, authHeader.indexOf(', k='));
const parts = jwt.split('.');
check('JWT tem 3 partes', parts.length === 3, `${parts.length}`);

const serverPublic = Buffer.from(parts[0], 'base64url');
const header = JSON.parse(serverPublic.toString('utf8'));
check('header {typ:JWT, alg:ES256}', header.typ === 'JWT' && header.alg === 'ES256');

const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
check('aud = origem do endpoint', claims.aud === 'https://fcm.googleapis.com');
check('sub = VAPID_SUBJECT', claims.sub === vapid.subject);
check('exp no futuro', claims.exp > Date.now() / 1000);

const signatureOk = crypto.verify(
  'sha256',
  Buffer.from(`${parts[0]}.${parts[1]}`),
  {
    key: crypto.createPublicKey({
      key: {
        kty: 'EC',
        crv: 'P-256',
        x: Buffer.from(vapid.publicKey, 'base64url').subarray(1, 33).toString('base64url'),
        y: Buffer.from(vapid.publicKey, 'base64url').subarray(33, 65).toString('base64url'),
      },
      format: 'jwk',
    }),
    dsaEncoding: 'ieee-p1363',
  },
  Buffer.from(parts[2], 'base64url'),
);
check('assinatura ES256 válida', signatureOk);

/* A chave efêmera vai no bit k= do cabeçalho? Não: o `k` é a VAPID pública.
   A chave efêmera está no corpo (keyid). Usamos a do corpo: */
const decoded = decrypt(request.body, subscription, request.body.subarray(21, 86));
const parsed = JSON.parse(decoded);
check('payload idêntico ao enviado', parsed.title === payload.title && parsed.body === payload.body);
check('kind/tag/url preservados', parsed.kind === 'reminder' && parsed.tag === 'evofit-reminder' && parsed.url === '/');

console.log('3) Janelas das ligas');
const { weeklyWindow, monthlyWindow } = await import('../src-app/api/push-dispatch.js');
const sunday = new Date(Date.UTC(2026, 10, 1, 20, 0, 0)); // domingo 1º/nov 20:00 UTC
const weekly = weeklyWindow(sunday);
const weeklyStart = new Date(weekly.start);
check('semanal começa domingo 19:00', weeklyStart.getUTCDay() === 0 && weeklyStart.getUTCHours() === 19);
check('semanal dura 7 dias', weekly.end - weekly.start === 7 * 86400000 - 1);

const midMonth = new Date(Date.UTC(2026, 10, 15, 12, 0, 0));
const monthly = monthlyWindow(midMonth);
const monthStart = new Date(monthly.start);
const monthEnd = new Date(monthly.end);
check('mensal começa dia 1º às 06:00', monthStart.getUTCDate() === 1 && monthStart.getUTCHours() === 6);
check('mensal termina no último dia às 21:00', monthEnd.getUTCDate() === 30 && monthEnd.getUTCHours() === 21);

console.log(failures === 0 ? '\ncheck-push: OK' : `\ncheck-push: ${failures} falha(s)`);
process.exit(failures === 0 ? 0 : 1);
