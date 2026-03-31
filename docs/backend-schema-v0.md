# Backend Schema v0

## Goal

Define a boring, MVP-safe backend data model for Geo Run.

This schema is designed for:

- one player -> one settlement;
- server-authoritative economy;
- auditable activity syncs;
- idempotent resource grants;
- simple build/upgrade/clear-tile actions.

It is not designed for:

- multiplayer;
- generalized event sourcing;
- multiple games sharing one runtime.

## Design principles

- Keep writes explicit.
- Keep grants explainable.
- Keep dedupe cheap.
- Keep settlement reads snapshot-friendly.

## Core tables

### `players`

Purpose:

- app-level player identity
- maps auth user to game profile

Suggested columns:

- `id uuid primary key`
- `auth_user_id uuid unique not null`
- `timezone text not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Notes:

- `auth_user_id` should map to Supabase Auth user id.
- Store timezone explicitly. Daily reward attribution gets weird fast without it.

### `settlements`

Purpose:

- main player game state root

Suggested columns:

- `id uuid primary key`
- `player_id uuid unique not null references players(id)`
- `name text null`
- `milestone_level int not null default 0`
- `supplies_balance int not null default 0`
- `stone_balance int not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Notes:

- For MVP, one player owns one settlement.
- Resource balances can live here for fast reads.

### `tiles`

Purpose:

- land state around the settlement

Suggested columns:

- `id uuid primary key`
- `settlement_id uuid not null references settlements(id)`
- `tile_key text not null`
- `terrain_type text not null`
- `state text not null`
- `revealed_at timestamptz null`
- `cleared_at timestamptz null`
- `building_id uuid null`

Constraints:

- unique `(settlement_id, tile_key)`
- `state` in `('hidden','blocked','cleared','occupied')`

Notes:

- `tile_key` can be a simple grid identifier like `0,0`, `0,1`.
- Avoid spatial complexity in MVP.

### `buildings`

Purpose:

- structures placed on tiles

Suggested columns:

- `id uuid primary key`
- `settlement_id uuid not null references settlements(id)`
- `tile_id uuid not null references tiles(id)`
- `building_type text not null`
- `level int not null default 1`
- `state text not null`
- `started_at timestamptz null`
- `completed_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- `state` in `('planned','building','complete')`

Notes:

- Do not store game-economy logic in this table.
- This is state, not rules.

### `construction_queue_items`

Purpose:

- one active timed action at a time

Suggested columns:

- `id uuid primary key`
- `settlement_id uuid not null references settlements(id)`
- `action_type text not null`
- `target_type text not null`
- `target_id uuid null`
- `payload jsonb not null default '{}'::jsonb`
- `state text not null`
- `started_at timestamptz not null`
- `complete_at timestamptz not null`
- `resolved_at timestamptz null`
- `created_at timestamptz not null default now()`

Constraints:

- `state` in `('active','resolved','cancelled')`

Recommended invariant:

- only one `active` queue item per settlement

Implementation note:

- enforce with partial unique index on `(settlement_id)` where `state = 'active'`
- queue resolution must update both the queue row and target game state in one
  transaction

### `activity_sync_windows`

Purpose:

- normalized health activity synced from device

Suggested columns:

- `id uuid primary key`
- `player_id uuid not null references players(id)`
- `source_platform text not null`
- `source_device_id text null`
- `window_start timestamptz not null`
- `window_end timestamptz not null`
- `step_count int not null default 0`
- `floor_count int not null default 0`
- `client_checkpoint text null`
- `dedupe_key text not null`
- `raw_payload jsonb null`
- `created_at timestamptz not null default now()`

Constraints:

- unique `(player_id, dedupe_key)`

Notes:

- `raw_payload` is optional. Keep only if needed for debugging.
- The normalized columns are the real contract for MVP.

### `resource_grants`

Purpose:

- auditable record of why resources were awarded

Suggested columns:

- `id uuid primary key`
- `player_id uuid not null references players(id)`
- `settlement_id uuid not null references settlements(id)`
- `grant_type text not null`
- `supplies int not null default 0`
- `stone int not null default 0`
- `rule_version text not null`
- `activity_sync_window_id uuid null references activity_sync_windows(id)`
- `grant_date date not null`
- `created_at timestamptz not null default now()`

Constraints:

- unique `(player_id, activity_sync_window_id, rule_version)` where
  `activity_sync_window_id is not null`

Notes:

- This table is the answer to "why did I get these resources?"

### `player_action_log`

Purpose:

- track authoritative game mutations

Suggested columns:

- `id uuid primary key`
- `player_id uuid not null references players(id)`
- `settlement_id uuid not null references settlements(id)`
- `action_type text not null`
- `request_id text null`
- `request_payload jsonb not null`
- `result_status text not null`
- `result_payload jsonb null`
- `created_at timestamptz not null default now()`

Constraints:

- `result_status` in `('accepted','rejected')`

Notes:

- Useful for debugging duplicate taps and state mismatch.
- `request_id` can support idempotency from client actions.

## Optional helper tables

These are not required on day one, but are reasonable if the implementation
benefits from them.

### `building_definitions`

- building type
- base cost
- build duration
- upgrade path metadata

This can also live in server code or config for MVP.

### `tile_unlock_rules`

- terrain type
- cost profile
- requirements

Again, config is probably enough at first.

## Read model strategy

For MVP, the app needs one cheap primary read:

`GET /settlement`

That endpoint should return a composed snapshot:

- settlement balances
- visible tiles
- buildings
- active queue item
- newly completed items
- optional current milestone metadata

Do not make the app assemble its home screen from six unrelated endpoints.

## Mutation boundaries

### 1. `POST /activity-sync`

Responsibilities:

- validate auth and player ownership
- validate time window shape
- compute `dedupe_key`
- upsert or reject duplicate window
- calculate resources using current rule version
- write `resource_grants`
- update settlement balances transactionally

### 2. `POST /actions/build`

Responsibilities:

- verify target tile exists and is valid
- verify no active conflicting queue item
- verify sufficient balances
- deduct balances
- create building in `planned/building`
- create queue item
- log action

### 3. `POST /actions/upgrade`

Responsibilities:

- verify building exists and is complete
- verify next level is valid
- verify sufficient balances
- create queue item or immediate state transition depending on rules

### 4. `POST /actions/clear-tile`

Responsibilities:

- verify tile is unlockable
- verify cost
- verify queue availability
- create queue item

### 5. `POST /internal/resolve-queue-item`

Responsibilities:

- load the active queue item
- verify it is due for completion
- update the queue row to `resolved`
- update the target building or tile state
- write `completed_at` on the building when relevant
- update milestone state if needed

This must happen in one transaction.

## Transaction rules

Use database transactions for:

- sync window insert + grant creation + balance update
- action validation + balance deduction + queue item creation
- queue resolution + building/tile update + milestone update

If any of those split across multiple non-transactional writes, bugs will get
stupid fast.

Queue-resolution rule:

- when a build or upgrade finishes, `construction_queue_items.complete_at`,
  `construction_queue_items.state`, `buildings.state`, and `buildings.completed_at`
  must be resolved as one atomic operation, not separate requests.

## Idempotency rules

### Activity sync idempotency

Primary rule:

- one normalized activity window should only generate grants once

Mechanism:

- stable `dedupe_key`
- unique constraint in `activity_sync_windows`
- unique grant constraint in `resource_grants`

### Action idempotency

Primary rule:

- rapid double taps should not create two builds

Mechanism:

- client-generated `request_id`
- action log uniqueness if needed
- active queue invariant at settlement level

## Indexes that matter

Recommended indexes:

- `players(auth_user_id)`
- `settlements(player_id)`
- `tiles(settlement_id, tile_key)`
- `buildings(settlement_id, tile_id)`
- `construction_queue_items(settlement_id)` with partial index on active rows
- `activity_sync_windows(player_id, window_start, window_end)`
- `activity_sync_windows(player_id, dedupe_key)` unique
- `resource_grants(player_id, grant_date desc)`
- `player_action_log(player_id, created_at desc)`

## RLS posture

Browser/mobile-facing tables should have RLS.

Safe default:

- players can read their own `players` row
- players can read their own `settlements`, `tiles`, `buildings`,
  `construction_queue_items`, `resource_grants`
- direct writes from client should be minimal or zero for economy tables

Recommendation:

- client reads can use RLS-protected access
- game mutations should go through Edge Functions with service-side validation

## Failure modes to design now

- duplicate sync windows
- stale client snapshot after balances change
- queue item completes while player is offline
- floors unavailable on some devices
- timezone shifts around midnight
- partial action write causing balance loss without queue creation

## Schema summary

This is enough for MVP:

- `players`
- `settlements`
- `tiles`
- `buildings`
- `construction_queue_items`
- `activity_sync_windows`
- `resource_grants`
- `player_action_log`

Small. Explainable. Good.
