create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{"tasks":[],"notes":[],"plans":[],"points":0,"theme":"light","language":"ar"}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_workspaces_data_size check (pg_column_size(data) <= 2000000)
);

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 8000),
  created_at timestamptz not null default now()
);

create index if not exists assistant_messages_user_created_idx
  on public.assistant_messages (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.user_workspaces enable row level security;
alter table public.assistant_messages enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can read their own workspace"
  on public.user_workspaces for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own workspace"
  on public.user_workspaces for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own workspace"
  on public.user_workspaces for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can read their own assistant messages"
  on public.assistant_messages for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own assistant messages"
  on public.assistant_messages for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and char_length(content) between 1 and 8000
  );

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', ''), 100)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.user_workspaces to authenticated;
grant select, insert on public.assistant_messages to authenticated;
revoke all on public.profiles, public.user_workspaces, public.assistant_messages from anon;
