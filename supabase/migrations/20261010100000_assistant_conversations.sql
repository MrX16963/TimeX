create table if not exists public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '' check (char_length(title) <= 100),
  mode text not null default 'chat'
    check (mode in ('chat', 'plan', 'advanced-plan')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

alter table public.assistant_messages
  add column if not exists conversation_id uuid;

alter table public.assistant_messages
  drop constraint if exists assistant_messages_conversation_id_fkey;

alter table public.assistant_messages
  add constraint assistant_messages_conversation_id_fkey
  foreign key (conversation_id, user_id)
  references public.assistant_conversations (id, user_id)
  on delete cascade;

create index if not exists assistant_conversations_user_updated_idx
  on public.assistant_conversations (user_id, updated_at desc);

create index if not exists assistant_messages_conversation_created_idx
  on public.assistant_messages (conversation_id, created_at);

alter table public.assistant_conversations enable row level security;

create policy "Users can manage their own assistant conversations"
  on public.assistant_conversations for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.assistant_conversations to authenticated;

with legacy_users as (
  insert into public.assistant_conversations (user_id, title, mode)
  select user_id, 'المحادثة السابقة', 'chat'
  from public.assistant_messages
  where conversation_id is null
  group by user_id
  returning id, user_id
)
update public.assistant_messages as messages
set conversation_id = legacy.id
from legacy_users as legacy
where messages.user_id = legacy.user_id
  and messages.conversation_id is null;
