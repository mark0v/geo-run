# Engineering Review Input

## Purpose

This document prepares Geo Run for `gstack plan-eng-review`.

The goal is not to over-design a future platform. The goal is to define a safe,
MVP-sized architecture for a mobile frontier settlement builder powered by
real-world activity.

## Product summary

Geo Run is a mobile game where real-world activity becomes in-game progress.

For MVP:

- the player connects phone health data;
- steps become the main progression resource, `Supplies`;
- floors may become a secondary bonus resource, `Stone`;
- the player grows a small frontier outpost over a 7-day arc;
- the evening session is short, decision-driven, and low pressure.

## Core product constraints

- The game must remain fun and complete using steps alone.
- Additional activity sources must deepen the system, not gate the main loop.
- The MVP must avoid punitive systems like decay, destruction, or harsh loss.
- Buildings in MVP are spending targets and progression markers, not passive
  resource generators.
- The architecture should support future gameplay experimentation, but must not
  become a speculative multi-game platform too early.

## MVP scope

### In scope

- iOS and Android mobile app
- Apple Health / HealthKit and Android Health Connect ingestion
- Daily step ingestion
- Optional floor ingestion when available
- Resource conversion into `Supplies` and `Stone`
- Settlement state and progression
- 5 to 6 buildings
- 1 construction queue
- Fog/terrain expansion
- Daily summary and basic milestone flow

### Out of scope

- Combat
- Hero roster or squad systems
- Citizen simulation
- Disaster systems
- Deep randomness/luck systems
- Large world map
- Third and fourth resource currencies
- Multi-game runtime

## Architecture goals

### 1. Keep the activity core separate from the game rules

We likely need at least three conceptual layers:

- `activity ingestion`
- `activity normalization and conversion`
- `game progression and settlement state`

This is the minimum separation needed to avoid hard-coding health APIs directly
into game logic.

### 2. Keep the MVP boring by default

Prefer well-known, easy-to-debug architecture over ambitious systems.

### 3. Support eventual offline-friendly mobile behavior

The player should be able to open the app, see current state, and make progress
decisions without every screen depending on live network round trips.

### 4. Preserve auditability of resource conversion

If a player asks "why did I get this many Supplies today?", the system should be
able to answer from ingested activity records and conversion rules.

## Candidate system boundaries

### Mobile client

Potential responsibilities:

- onboarding and permissions
- reading health data through platform APIs
- showing settlement UI
- caching current game state
- sending activity summaries or raw normalized inputs to backend

### Backend API

Potential responsibilities:

- player account and settlement persistence
- activity ingestion endpoint or sync reconciliation
- daily conversion of activity to game resources
- action validation for build/upgrade/clear commands
- milestone generation

### Data / domain layer

Likely entities:

- `Player`
- `Settlement`
- `Tile`
- `Building`
- `ConstructionQueueItem`
- `ActivitySample` or `ActivitySummary`
- `DailyResourceGrant`
- `PlayerActionLog`

## Key architectural questions

### 1. Where should health data be converted?

Open options:

- convert raw activity to resources on-device, sync only results
- sync raw-ish activity summaries to backend, convert on server
- hybrid model, device reads raw health data and sends normalized summaries,
  backend applies authoritative game conversion

### 2. How should daily progression work?

Open options:

- strictly daily grant based on prior-day totals
- near-real-time updates during the day
- hybrid, with progress visible during the day but finalized in a daily summary

### 3. What is authoritative state?

Open options:

- server-authoritative settlement and economy
- mostly local-first with server reconciliation

### 4. How much event history do we need?

Need enough logging to:

- explain grants
- debug sync mismatches
- prevent accidental double-credit

But not so much that MVP turns into analytics infrastructure.

## Recommended initial direction to review

Use a hybrid model:

- mobile client reads platform health data;
- client normalizes activity into a small cross-platform shape;
- backend is authoritative for conversion into game resources and settlement
  state transitions;
- client caches settlement state locally for fast opens;
- game actions are validated server-side.

This keeps trust, auditability, and future balance changes on the server while
avoiding direct backend dependency on low-level health-provider details.

## Risks to review

- duplicate credit from repeated syncs
- inconsistent behavior across iOS and Android health APIs
- user confusion if floors are missing or unreliable
- over-complicating the economy before validating retention
- building an over-generalized activity platform before proving one game loop

## What the engineering review should answer

- What is the cleanest MVP-safe architecture?
- What should live on device vs backend?
- What entities and state transitions are required?
- What failure modes need to be designed first?
- What tests are mandatory before implementation starts?
- What ASCII diagrams should exist in the plan or code?
