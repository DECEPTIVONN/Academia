-- Migration: push real (VAPID), pareamento de uso único e desativação de conta
-- Execute no SQL Editor do Supabase (ou via supabase db push).
--
-- Três blocos independentes:
--   1. push_subscriptions — guarda a assinatura de push do aparelho + o fuso e
--      a preferência de horário, para o endpoint `/api/push-dispatch` decidir
--      o que enviar com o app FECHADO (o agendador local continua existindo
--      como fallback quando não há conta/nuvem).
--   2. pairing_codes — o código do QR deixa de ser um canal público "quem
--      chegou primeiro leva": ele é REVOGADO no servidor quando é usado uma
--      vez (`pairing_claim`), e também expira em 5 minutos.
--   3. profiles.deletion_* — desativação real com cancelamento automático se
--      o usuário entrar de novo em até 30 dias.

/* ═════════════════════════ 1. PUSH (VAPID) ═════════════════════════ */

create table if not exists public.push_subscriptions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  -- `endpoint` identifica o navegador/aparelho; único para permitir upsert.
  endpoint          text not null unique,
  p256dh            text not null,
  auth              text not null,
  /** Fuso do aparelho em minutos a LESTE de UTC (Brasília = -180). */
  timezone_offset   integer not null default 0,
  /** Horário local do lembrete de treino, "HH:MM" (24 h). */
  reminder_time     text not null default '18:00'
                    check (reminder_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  notify_motivation boolean not null default true,
  notify_reminder   boolean not null default true,
  notify_leagues    boolean not null default true,
  /** Dedupe do servidor: {"reminder:2026-11-02": 1762...} (epoch ms). */
  sent_keys         jsonb not null default '{}'::jsonb,
  last_sent_at      timestamptz,
  failures          integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_select_own" on public.push_subscriptions;
create policy "push_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "push_insert_own" on public.push_subscriptions;
create policy "push_insert_own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "push_update_own" on public.push_subscriptions;
create policy "push_update_own" on public.push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "push_delete_own" on public.push_subscriptions;
create policy "push_delete_own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

/* ═════════════════════════ 2. PAREAMENTO (uso único) ═════════════════════════ */

create table if not exists public.pairing_codes (
  code        text primary key
              check (code ~ '^PLN-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '5 minutes'),
  claimed_at  timestamptz,
  claimed_by  uuid references auth.users (id) on delete set null
);

create index if not exists pairing_codes_expires_idx
  on public.pairing_codes (expires_at);

-- Nenhuma policy: a tabela só é tocada pelas funções abaixo (security definer),
-- assim ninguém lista códigos de outros aparelhos.
alter table public.pairing_codes enable row level security;

-- Aparelho SEM sessão registra o código que vai exibir no QR.
create or replace function public.pairing_create(p_code text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code      text := upper(trim(p_code));
  v_expires   timestamptz;
begin
  if v_code !~ '^PLN-[A-Z0-9]{4}-[A-Z0-9]{4}$' then
    raise exception 'invalid pairing code';
  end if;

  -- Faxina barata: códigos vencidos há mais de um dia não servem para nada.
  delete from public.pairing_codes where expires_at < now() - interval '1 day';

  insert into public.pairing_codes (code, expires_at)
  values (v_code, now() + interval '5 minutes')
  on conflict (code) do nothing;

  select expires_at into v_expires
    from public.pairing_codes
   where code = v_code;

  return v_expires;
end;
$$;

-- Aparelho JÁ conectado consome o código. Só a PRIMEIRA chamada recebe
-- 'ok': depois disso o código está revogado (mesmo dentro dos 5 minutos).
-- Devolve 'ok' | 'used' | 'expired' | 'unknown' (código nunca registrado —
-- usado apenas para o modo degradado, quando o aparelho não tinha rede para
-- criar o código no servidor).
create or replace function public.pairing_claim(p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code   text := upper(trim(p_code));
  v_uid    uuid := auth.uid();
  v_status text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  update public.pairing_codes
     set claimed_at = now(),
         claimed_by = v_uid
   where code = v_code
     and claimed_at is null
     and expires_at > now();

  if found then
    return 'ok';
  end if;

  select case
           when c.claimed_at is not null then 'used'
           else 'expired'
         end
    into v_status
    from public.pairing_codes c
   where c.code = v_code;

  return coalesce(v_status, 'unknown');
end;
$$;

-- Status para a tela do QR: 'pending' | 'claimed' | 'expired' | 'unknown'.
create or replace function public.pairing_status(p_code text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
           (select case
                     when c.claimed_at is not null then 'claimed'
                     when c.expires_at <= now() then 'expired'
                     else 'pending'
                   end
              from public.pairing_codes c
             where c.code = upper(trim(p_code))),
           'unknown'
         );
$$;

grant execute on function public.pairing_create(text) to anon, authenticated;
grant execute on function public.pairing_claim(text)  to authenticated;
grant execute on function public.pairing_status(text) to anon, authenticated;

/* ═════════════════════════ 3. DESATIVAÇÃO DE CONTA ═════════════════════════ */

alter table public.profiles
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_effective_at timestamptz,
  add column if not exists deletion_cancelled_at timestamptz,
  add column if not exists deletion_reason       text;

-- Marca a exclusão para daqui a 30 dias. Devolve a data efetiva.
create or replace function public.request_account_deletion(p_reason text default null)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_effective timestamptz;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles
     set deletion_requested_at = now(),
         deletion_effective_at = now() + interval '30 days',
         deletion_cancelled_at = null,
         deletion_reason       = nullif(trim(coalesce(p_reason, '')), ''),
         updated_at            = now()
   where id = v_uid
   returning deletion_effective_at into v_effective;

  if v_effective is null then
    raise exception 'profile not found';
  end if;

  return v_effective;
end;
$$;

-- Cancelamento automático ao entrar de novo. Só vale DENTRO dos 30 dias:
-- depois disso a conta é considerada excluída e o cancelamento é recusado.
create or replace function public.cancel_account_deletion()
returns table (cancelled boolean, requested_at timestamptz, effective_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_requested timestamptz;
  v_effective timestamptz;
  v_ok        boolean := false;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select p.deletion_requested_at, p.deletion_effective_at
    into v_requested, v_effective
    from public.profiles p
   where p.id = v_uid;

  if v_requested is not null and v_effective is not null and v_effective > now() then
    update public.profiles
       set deletion_requested_at = null,
           deletion_effective_at = null,
           deletion_cancelled_at = now(),
           updated_at            = now()
     where id = v_uid;
    v_ok := true;
  end if;

  return query select v_ok, v_requested, v_effective;
end;
$$;

-- Consulta usada pela UI (Configurações → Sua Conta) e no login.
create or replace function public.account_deletion_status()
returns table (
  requested_at timestamptz,
  effective_at timestamptz,
  days_left    integer,
  expired      boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select p.deletion_requested_at,
         p.deletion_effective_at,
         case
           when p.deletion_effective_at is null then null
           else greatest(0, ceil(extract(epoch from (p.deletion_effective_at - now())) / 86400))::integer
         end as days_left,
         coalesce(p.deletion_effective_at <= now(), false) as expired
    from public.profiles p
   where p.id = auth.uid();
$$;

grant execute on function public.request_account_deletion(text) to authenticated;
grant execute on function public.cancel_account_deletion()      to authenticated;
grant execute on function public.account_deletion_status()      to authenticated;
