-- Migration: ranking global mensal + amizades reais (v4.66.0)
-- Execute no SQL Editor do Supabase (ou via supabase db push).
--
-- Contexto: o app guarda o histórico de treinos no aparelho (IndexedDB).
-- Para o ranking global não ser fictício, cada conta PUBLICA um resumo do
-- próprio XP (RPC publish_monthly_xp) e lê o ranking pela janela mensal da
-- liga (RPC global_monthly_ranking). Nada é gerado aleatoriamente aqui.

/* ─────────────────────────── Perfis: XP e presença ─────────────────────────── */

alter table public.profiles
  add column if not exists total_xp       integer     not null default 0,
  add column if not exists monthly_xp     integer     not null default 0,
  add column if not exists xp_period      text,
  add column if not exists streak         integer     not null default 0,
  add column if not exists level          integer     not null default 1,
  add column if not exists avatar_emblem  text,
  add column if not exists photo          text,
  add column if not exists last_seen      timestamptz not null default now();

create index if not exists profiles_monthly_ranking_idx
  on public.profiles (xp_period, monthly_xp desc, updated_at desc);

/* ─────────────────────────── Amizades ─────────────────────────── */

create table if not exists public.friendships (
  requester    uuid not null references auth.users (id) on delete cascade,
  addressee    uuid not null references auth.users (id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  primary key (requester, addressee),
  constraint friendships_not_self check (requester <> addressee)
);

create index if not exists friendships_addressee_idx on public.friendships (addressee, status);
create index if not exists friendships_requester_idx on public.friendships (requester, status);

alter table public.friendships enable row level security;

drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own" on public.friendships
  for select using (auth.uid() = requester or auth.uid() = addressee);

drop policy if exists "friendships_insert_own" on public.friendships;
create policy "friendships_insert_own" on public.friendships
  for insert with check (auth.uid() = requester);

drop policy if exists "friendships_update_addressee" on public.friendships;
create policy "friendships_update_addressee" on public.friendships
  for update using (auth.uid() = addressee) with check (auth.uid() = addressee);

drop policy if exists "friendships_delete_own" on public.friendships;
create policy "friendships_delete_own" on public.friendships
  for delete using (auth.uid() = requester or auth.uid() = addressee);

/* ─────────────────────────── Publicação do XP ─────────────────────────── */

-- O cliente calcula o XP da janela mensal da liga a partir do histórico local
-- e publica o próprio resumo. Só a própria conta pode escrever (auth.uid()).
create or replace function public.publish_monthly_xp(
  p_period     text,
  p_monthly_xp integer,
  p_total_xp   integer,
  p_streak     integer,
  p_level      integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles
     set monthly_xp    = greatest(coalesce(p_monthly_xp, 0), 0),
         xp_period     = nullif(trim(coalesce(p_period, '')), ''),
         total_xp      = greatest(coalesce(p_total_xp, 0), 0),
         streak        = greatest(coalesce(p_streak, 0), 0),
         level         = greatest(coalesce(p_level, 1), 1),
         updated_at    = now(),
         last_seen     = now()
   where id = auth.uid();

  if not found then
    raise exception 'profile not found';
  end if;
end;
$$;

/* ─────────────────────────── Ranking global mensal ─────────────────────────── */

create or replace function public.global_monthly_ranking(
  p_period text,
  p_limit  integer default 50
)
returns table (
  position      bigint,
  id            uuid,
  username      text,
  display_name  text,
  monthly_xp    integer,
  level         integer,
  streak        integer,
  avatar_emblem text,
  photo         text,
  is_self       boolean
)
language sql
security definer
set search_path = public
stable
as $$
  with ranked as (
    select
      row_number() over (order by p.monthly_xp desc, p.updated_at asc) as position,
      p.id,
      p.username,
      coalesce(nullif(trim(p.display_name), ''), p.username) as display_name,
      p.monthly_xp,
      p.level,
      p.streak,
      p.avatar_emblem,
      p.photo,
      (p.id = auth.uid()) as is_self
    from public.profiles p
    where p.xp_period = p_period
      and p.monthly_xp > 0
  )
  select *
    from ranked
   order by position
   limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

/* ─────────────────────────── Lista de amigos ─────────────────────────── */

-- 'accepted' = amizade confirmada; 'incoming' = convite recebido; 'outgoing' = enviado.
create or replace function public.friends_overview()
returns table (
  user_id       uuid,
  username      text,
  display_name  text,
  monthly_xp    integer,
  total_xp      integer,
  level         integer,
  streak        integer,
  avatar_emblem text,
  photo         text,
  state         text,
  since         timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  with me as (select auth.uid() as uid)
  select
    p.id as user_id,
    p.username,
    coalesce(nullif(trim(p.display_name), ''), p.username) as display_name,
    coalesce(p.monthly_xp, 0) as monthly_xp,
    coalesce(p.total_xp, 0) as total_xp,
    coalesce(p.level, 1) as level,
    coalesce(p.streak, 0) as streak,
    p.avatar_emblem,
    p.photo,
    case
      when f.status = 'accepted' then 'accepted'
      when f.requester = me.uid then 'outgoing'
      else 'incoming'
    end as state,
    coalesce(f.responded_at, f.created_at) as since
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester = me.uid then f.addressee else f.requester end
  cross join me
  where me.uid is not null
    and (f.requester = me.uid or f.addressee = me.uid)
  order by
    case
      when f.status = 'accepted' then 0
      when f.requester = me.uid then 2
      else 1
    end,
    coalesce(p.monthly_xp, 0) desc,
    coalesce(f.responded_at, f.created_at) desc;
$$;

grant execute on function public.publish_monthly_xp(text, integer, integer, integer, integer) to authenticated;
grant execute on function public.global_monthly_ranking(text, integer) to authenticated;
grant execute on function public.friends_overview() to authenticated;
