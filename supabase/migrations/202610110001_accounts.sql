-- Account roles are stored in auth.users.raw_app_meta_data (server-managed).
-- Run on the configured backend before deploying the Edge Functions.
begin;
create schema if not exists starcast_internal;
revoke all on schema starcast_internal from public, anon;
grant usage on schema starcast_internal to authenticated;
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  email text not null,
  role text not null default 'user' check (role in ('user','creator','collaborator','admin'))
);
create table if not exists public.role_change_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  previous_role text not null,
  new_role text not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);
create or replace function starcast_internal.sync_starcast_account() returns trigger
language plpgsql security definer set search_path = '' as $$
declare trusted_role text;
begin
  trusted_role := new.raw_app_meta_data->>'role';
  if trusted_role is null or trusted_role not in ('user','creator','collaborator','admin') then
    trusted_role := case when new.raw_user_meta_data->>'role' = 'creator' then 'creator' else 'user' end;
    new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', trusted_role);
  end if;
  return new;
end;
$$;
create or replace function starcast_internal.sync_starcast_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_profiles(id, username, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)), coalesce(new.email,''), new.raw_app_meta_data->>'role')
  on conflict (id) do update set username = excluded.username, email = excluded.email, role = excluded.role;
  if to_regclass('public.starcast_profiles') is not null then
    update public.starcast_profiles set role = case new.raw_app_meta_data->>'role' when 'admin' then 'admin' when 'creator' then 'star' else 'client' end where id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists starcast_account_role on auth.users;
create trigger starcast_account_role before insert or update on auth.users for each row execute function starcast_internal.sync_starcast_account();
drop trigger if exists starcast_account_profile on auth.users;
create trigger starcast_account_profile after insert or update on auth.users for each row execute function starcast_internal.sync_starcast_profile();
-- Preserve existing privileges using the original server-controlled profile table.
do $$ begin
  if to_regclass('public.starcast_profiles') is not null then
    update auth.users u set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object('role', case p.role when 'admin' then 'admin' when 'star' then 'creator' else 'user' end)
    from public.starcast_profiles p where p.id = u.id and u.raw_app_meta_data->>'role' is null;
  end if;
end $$;
-- Do not promote existing accounts based on user-editable metadata.
update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  where raw_app_meta_data->>'role' is null or raw_app_meta_data->>'role' not in ('user','creator','collaborator','admin');
insert into public.user_profiles(id,username,email,role)
select id, coalesce(raw_user_meta_data->>'username',split_part(email,'@',1)), coalesce(email,''), raw_app_meta_data->>'role' from auth.users
on conflict(id) do update set username=excluded.username,email=excluded.email,role=excluded.role;
alter table public.user_profiles enable row level security;
alter table public.role_change_logs enable row level security;
-- Reset policies on these account tables so an older policy cannot grant writes.
do $$ declare policy record; begin
  for policy in select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('user_profiles','role_change_logs') loop
    execute format('drop policy %I on %I.%I', policy.policyname,policy.schemaname,policy.tablename);
  end loop;
end $$;
create or replace function starcast_internal.starcast_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from auth.users where id = auth.uid() and raw_app_meta_data->>'role' = 'admin');
$$;
create policy account_read on public.user_profiles for select to authenticated
  using (id = auth.uid() or starcast_internal.starcast_is_admin());
create policy audit_read on public.role_change_logs for select to authenticated
  using (starcast_internal.starcast_is_admin());
revoke all on public.user_profiles, public.role_change_logs from anon, authenticated;
grant select on public.user_profiles, public.role_change_logs to authenticated;
grant all on public.user_profiles, public.role_change_logs to service_role;
revoke all on function starcast_internal.sync_starcast_account(), starcast_internal.sync_starcast_profile(), starcast_internal.starcast_is_admin() from public;
grant execute on function starcast_internal.starcast_is_admin() to authenticated;
create index if not exists role_change_logs_user_id_idx on public.role_change_logs(user_id);
create index if not exists role_change_logs_changed_by_idx on public.role_change_logs(changed_by);
commit;
-- Bootstrap an administrator explicitly, using their verified account UUID:
-- update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb) || '{"role":"admin"}'::jsonb where id = 'UUID';
-- Log out and back in after changing roles.
