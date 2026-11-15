-- BrandShot Studio — Supabase schema
-- One row per prompt; the full per-prompt JSON lives in `data` (jsonb) so the
-- table can serve the app, analytics, or an API without losing anything.

create table if not exists public.prompts (
  id             text primary key,
  niche          text not null,
  niche_key      text not null,
  name           text not null,
  tagline        text,
  summary        text,
  aspect         text,
  dimensions     text,
  channel_type   text,
  business_moment text,
  best_platforms text,
  keywords       text[] default '{}',
  code_first     boolean default false,
  data_version   text,
  data           jsonb not null,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists prompts_niche_key_idx on public.prompts (niche_key);
create index if not exists prompts_code_first_idx on public.prompts (code_first);
create index if not exists prompts_keywords_idx   on public.prompts using gin (keywords);
create index if not exists prompts_data_idx       on public.prompts using gin (data);

-- Read-only for everyone (the library is gated at the app layer);
-- writes only via the service role.
alter table public.prompts enable row level security;
drop policy if exists "prompts are readable" on public.prompts;
create policy "prompts are readable" on public.prompts for select using (true);
