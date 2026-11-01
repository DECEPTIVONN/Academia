/**
 * /api/account-purge — exclusão definitiva das contas desativadas (v4.67.0)
 *
 * GET /api/account-purge?action=cron   (Authorization: Bearer $CRON_SECRET)
 *
 * Fluxo da desativação (Configurações → Sua Conta):
 *   1. o usuário pede a desativação → `request_account_deletion()` marca
 *      `deletion_effective_at = now() + 30 dias`;
 *   2. se ele entrar de novo dentro dos 30 dias, `cancel_account_deletion()`
 *      (chamada no login) reativa a conta;
 *   3. passados os 30 dias, ESTE endpoint apaga a conta de verdade: o
 *      `auth.admin.deleteUser()` remove o usuário e o `on delete cascade`
 *      limpa profiles, friendships, push_subscriptions e o restante.
 *
 * Agende com o mesmo cron do push (diário basta). Sem execução do cron nada é
 * apagado — a conta fica apenas marcada, o que é seguro.
 */

import { createClient } from '@supabase/supabase-js';

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function isAuthorized(req, secret) {
  if (!secret) return false;
  if (String(req.headers?.authorization || '') === `Bearer ${secret}`) return true;
  try {
    return new URL(req.url || '/', 'https://local.invalid').searchParams.get('secret') === secret;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const cronSecret = process.env.CRON_SECRET || '';

  let action = '';
  try {
    action = String(new URL(req.url || '/', 'https://local.invalid').searchParams.get('action') || '');
  } catch {
    action = '';
  }

  if (action !== 'cron') {
    send(res, 400, { error: 'Use ?action=cron.' });
    return;
  }
  if (!cronSecret) {
    send(res, 500, { error: 'CRON_SECRET não configurado.' });
    return;
  }
  if (!isAuthorized(req, cronSecret)) {
    send(res, 401, { error: 'Não autorizado.' });
    return;
  }
  if (!url || !serviceRole) {
    send(res, 500, { error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados.' });
    return;
  }

  const supabase = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: due, error } = await supabase
    .from('profiles')
    .select('id, deletion_effective_at')
    .not('deletion_effective_at', 'is', null)
    .lte('deletion_effective_at', new Date().toISOString())
    .limit(200);

  if (error) {
    send(res, 502, { error: `Falha ao ler contas: ${error.message}` });
    return;
  }

  const purged = [];
  const failures = [];

  for (const row of due ?? []) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(row.id);
    if (deleteError) failures.push({ id: row.id, error: deleteError.message });
    else purged.push(row.id);
  }

  send(res, 200, { ok: true, due: (due ?? []).length, purged: purged.length, failures });
}
