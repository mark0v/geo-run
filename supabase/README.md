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

The first functions are scaffolded as placeholders so the contract boundaries are
clear before implementation starts.
