create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null,
  timezone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  player_id uuid unique not null references public.players(id) on delete cascade,
  name text,
  milestone_level int not null default 0,
  supplies_balance int not null default 0,
  stone_balance int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tiles (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references public.settlements(id) on delete cascade,
  tile_key text not null,
  terrain_type text not null,
  state text not null check (state in ('hidden', 'blocked', 'cleared', 'occupied')),
  revealed_at timestamptz,
  cleared_at timestamptz,
  building_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (settlement_id, tile_key)
);

create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references public.settlements(id) on delete cascade,
  tile_id uuid not null references public.tiles(id) on delete cascade,
  building_type text not null,
  level int not null default 1,
  state text not null check (state in ('planned', 'building', 'complete')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.construction_queue_items (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references public.settlements(id) on delete cascade,
  action_type text not null,
  target_type text not null,
  target_id uuid,
  payload jsonb not null default '{}'::jsonb,
  state text not null check (state in ('active', 'resolved', 'cancelled')),
  started_at timestamptz not null,
  complete_at timestamptz not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists construction_queue_items_one_active_per_settlement
  on public.construction_queue_items (settlement_id)
  where state = 'active';

create table if not exists public.activity_sync_windows (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  source_platform text not null,
  source_device_id text,
  window_start timestamptz not null,
  window_end timestamptz not null,
  step_count int not null default 0,
  floor_count int not null default 0,
  client_checkpoint text,
  dedupe_key text not null,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique (player_id, dedupe_key)
);

create table if not exists public.resource_grants (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  settlement_id uuid not null references public.settlements(id) on delete cascade,
  grant_type text not null,
  supplies int not null default 0,
  stone int not null default 0,
  rule_version text not null,
  activity_sync_window_id uuid references public.activity_sync_windows(id) on delete set null,
  grant_date date not null,
  created_at timestamptz not null default now()
);

create unique index if not exists resource_grants_unique_window_rule
  on public.resource_grants (player_id, activity_sync_window_id, rule_version)
  where activity_sync_window_id is not null;

create table if not exists public.player_action_log (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  settlement_id uuid not null references public.settlements(id) on delete cascade,
  action_type text not null,
  request_id text,
  request_payload jsonb not null,
  result_status text not null check (result_status in ('accepted', 'rejected')),
  result_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists players_auth_user_id_idx
  on public.players (auth_user_id);

create index if not exists settlements_player_id_idx
  on public.settlements (player_id);

create index if not exists tiles_settlement_tile_key_idx
  on public.tiles (settlement_id, tile_key);

create index if not exists buildings_settlement_tile_idx
  on public.buildings (settlement_id, tile_id);

create index if not exists activity_sync_windows_player_window_idx
  on public.activity_sync_windows (player_id, window_start, window_end);

create index if not exists resource_grants_player_grant_date_idx
  on public.resource_grants (player_id, grant_date desc);

create index if not exists player_action_log_player_created_at_idx
  on public.player_action_log (player_id, created_at desc);
