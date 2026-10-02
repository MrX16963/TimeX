alter table public.assistant_messages
  add column if not exists sources jsonb not null default '[]'::jsonb;

alter table public.assistant_messages
  add constraint assistant_messages_sources_valid
  check (
    pg_column_size(sources) <= 12000
    and case
      when jsonb_typeof(sources) = 'array' then jsonb_array_length(sources) <= 5
      else false
    end
  );
