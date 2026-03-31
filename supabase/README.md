# Supabase Backend Skeleton

This directory holds the backend skeleton for the Geo Run MVP.

Planned responsibilities:

- Auth and player identity
- Postgres persistence
- Edge Functions for authoritative mutations
- Migrations for settlement, tiles, buildings, queue items, sync windows, and grants

Included now:

- initial migration in `supabase/migrations/20260331_0001_initial_schema.sql`
- shared TypeScript contracts and activity grant rules in `supabase/functions/_shared/`
- first vertical slice for `activity-sync` request validation, dedupe, and resource grant calculation

Implemented now:

- local `GET /settlement`
- local `POST /activity-sync`
- local `POST /actions/build`
- local `POST /actions/upgrade`
- local `POST /actions/clear-tile`
- local `POST /internal/resolve-queue-item`

## Local development

Use the root scripts:

- `npm run supabase:start`
- `npm run supabase:status`
- `npm run supabase:stop`
- `npm run mobile:start:mock`
- `npm run mobile:start:live`

Notes:

- local Windows setup currently disables Supabase analytics in `config.toml` to
  avoid vector-container conflicts during repeated restarts;
- the local Edge Functions prototype supports `x-player-auth-user-id` so a
  deterministic demo player can be bootstrapped without full auth wiring;
- the Expo app now switches between mock and live edge-function mode via
  `EXPO_PUBLIC_USE_MOCK_API` and related `EXPO_PUBLIC_*` runtime settings;
- mutation persistence is functionally working, but still not wrapped in SQL RPC
  transactions yet.
