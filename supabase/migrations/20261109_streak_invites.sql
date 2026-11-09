-- Migration: convites reais de ofensiva entre amigos (v4.74.0)
-- Execute no SQL Editor do Supabase (ou via supabase db push).
--
-- Um convite só pode ser enviado entre amizades confirmadas. O amigo recebe
-- uma mensagem nas Mensagens do Início e pode aceitar ou recusar; o convite
-- aceito aparece na lista "Ofensivas dos amigos" com a sequência atual.

create table if not exists public.streak_invites (
  id           uuid primary key default gen_random_uuid(),
  inviter      uuid not null references auth.users (id) on delete cascade,
  invitee      uuid not null references auth.users (id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  constraint streak_invites_not_self check (inviter <> invitee)
);

create index if not exists streak_invites_inviter_idx
  on public.streak_invites (inviter, status);
create index if not exists streak_invites_invitee_idx
  on public.streak_invites (invitee, status);

-- Um único convite pendente por par (nos dois sentidos).
create unique index if not exists streak_invites_pending_pair_idx
  on public.streak_invites (least(inviter, invitee), greatest(inviter, invitee))
  where status = 'pending';

alter table public.streak_invites enable row level security;

drop policy if exists "streak_invites_select_own" on public.streak_invites;
create policy "streak_invites_select_own" on public.streak_invites
  for select using (auth.uid() = inviter or auth.uid() = invitee);

/* As mutações passam por funções SECURITY DEFINER: o cliente não escolhe
   remetente/destinatário além dos parâmetros validados. */

create or replace function public.send_streak_invite(p_invitee uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  existing uuid;
  created uuid;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if p_invitee is null or p_invitee = me then
    raise exception 'invalid invitee';
  end if;

  if not exists (
    select 1
      from public.friendships f
     where f.status = 'accepted'
       and (
         (f.requester = me and f.addressee = p_invitee)
         or (f.requester = p_invitee and f.addressee = me)
       )
  ) then
    raise exception 'not friends';
  end if;

  select si.id into existing
    from public.streak_invites si
   where si.status = 'pending'
     and (
       (si.inviter = me and si.invitee = p_invitee)
       or (si.inviter = p_invitee and si.invitee = me)
     )
   limit 1;
  if existing is not null then
    return existing;
  end if;

  insert into public.streak_invites (inviter, invitee)
  values (me, p_invitee)
  returning id into created;

  return created;
end;
$$;

create or replace function public.respond_streak_invite(
  p_invite_id uuid,
  p_accept    boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  next_status text := case when coalesce(p_accept, false) then 'accepted' else 'declined' end;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;

  update public.streak_invites
     set status = next_status,
         responded_at = now()
   where id = p_invite_id
     and invitee = me
     and status = 'pending';

  if not found then
    raise exception 'invite not found';
  end if;
end;
$$;

create or replace function public.cancel_streak_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  delete from public.streak_invites
   where id = p_invite_id
     and inviter = auth.uid()
     and status = 'pending';
end;
$$;

create or replace function public.streak_invites_overview()
returns table (
  id            uuid,
  inviter       uuid,
  invitee       uuid,
  direction     text,
  status        text,
  user_id       uuid,
  username      text,
  display_name  text,
  level         integer,
  streak        integer,
  avatar_emblem text,
  photo         text,
  created_at    timestamptz,
  responded_at  timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  with me as (select auth.uid() as uid)
  select
    si.id,
    si.inviter,
    si.invitee,
    case when si.inviter = me.uid then 'outgoing' else 'incoming' end as direction,
    si.status,
    p.id as user_id,
    p.username,
    coalesce(nullif(trim(p.display_name), ''), p.username) as display_name,
    coalesce(p.level, 1) as level,
    coalesce(p.streak, 0) as streak,
    p.avatar_emblem,
    p.photo,
    si.created_at,
    si.responded_at
  from public.streak_invites si
  cross join me
  join public.profiles p
    on p.id = case when si.inviter = me.uid then si.invitee else si.inviter end
  where me.uid is not null
    and (si.inviter = me.uid or si.invitee = me.uid)
  order by
    case
      when si.status = 'pending' and si.invitee = me.uid then 0
      when si.status = 'accepted' then 1
      when si.status = 'pending' then 2
      else 3
    end,
    coalesce(si.responded_at, si.created_at) desc;
$$;

grant select on public.streak_invites to authenticated;
grant execute on function public.send_streak_invite(uuid) to authenticated;
grant execute on function public.respond_streak_invite(uuid, boolean) to authenticated;
grant execute on function public.cancel_streak_invite(uuid) to authenticated;
grant execute on function public.streak_invites_overview() to authenticated;
