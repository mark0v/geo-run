# Stack Selection v0

## Recommendation

Choose this stack for MVP:

- **Client:** Expo + React Native + TypeScript
- **Navigation:** Expo Router
- **Native development mode:** Expo development builds, not Expo Go
- **Local persistence/cache:** Expo SQLite
- **Backend platform:** Supabase
- **Database:** Postgres on Supabase
- **Auth:** Supabase Auth
- **Authoritative game mutations:** Supabase Edge Functions
- **Distribution/builds:** EAS Build

This is the boring choice. That's why it is good.

## Why this stack

### 1. React Native should use a framework

React Native's own docs recommend using a framework for new apps, and call out
Expo specifically. That matters here because this product already has enough
hard problems in health integrations, game state, and economy rules. We do not
need to invent routing, native dependency wiring, and mobile tooling at the same
time.

### 2. We need native code access for health integrations

This app will read Apple Health / HealthKit and Android Health Connect data.
Expo Go is not enough for that class of app. Expo's docs are clear: if you need
libraries with native code, you need a development build or your own native
app. So the right Expo posture is:

- use Expo as the framework;
- use development builds from day one;
- avoid pretending this is an Expo Go-only app.

### 3. Health APIs fit a client-read, server-authoritative model

Apple's HealthKit docs focus on device-side permissioned reads, queries, and
long-running update patterns. Android Health Connect similarly provides app-side
read access, compatibility checks, and sync functionality. That reinforces our
earlier architectural direction:

- read health data on device;
- normalize on device;
- send normalized summaries to backend;
- apply game-economy grants on the server.

### 4. Supabase is enough backend for this MVP

For this product, we need:

- auth;
- Postgres persistence;
- safe row-level access;
- lightweight server endpoints for sync and actions;
- no custom infra theater.

Supabase gives us:

- managed Postgres;
- Auth;
- REST and database access patterns;
- Row Level Security;
- TypeScript-first Edge Functions for lightweight server logic.

That is enough for the MVP loop without standing up a custom Node service too
early.

## Options considered

### Option A: Expo + Supabase

Summary:
Use Expo for the app, Expo development builds for native integrations, Supabase
for auth/database, and Edge Functions for authoritative action endpoints.

Pros:

- fastest path to a real mobile product
- one TypeScript-heavy workflow on the app side and server endpoints
- managed Postgres without building backend plumbing from scratch
- easy internal build and distribution path with EAS Build

Cons:

- Edge Functions are not a forever answer if simulation grows much heavier
- some backend logic will live in Deno-style TypeScript, not Node
- requires discipline to keep business logic out of the client

Completeness: 9/10

### Option B: Expo + custom Node API + Postgres

Summary:
Use Expo on client, but run a separate backend service such as Fastify or Nest
with a hosted Postgres database.

Pros:

- maximum control over backend design
- familiar Node runtime everywhere outside mobile
- easier escape hatch if server logic becomes complex quickly

Cons:

- more infra and deployment work immediately
- auth, DB access, and operational glue all become our responsibility
- more moving parts before proving one game loop

Completeness: 8/10

### Option C: Bare React Native + custom backend

Summary:
Skip Expo as a framework and manage native projects directly from the start.

Pros:

- full native control
- no Expo abstractions

Cons:

- higher setup and maintenance burden
- unnecessary complexity for MVP
- solves problems we do not have yet

Completeness: 5/10

## Recommended architecture with this stack

```text
┌───────────────────────────┐
│ Expo / React Native app   │
│ TypeScript + Expo Router  │
└─────────────┬─────────────┘
              │
              │ native health reads
              v
┌───────────────────────────┐
│ HealthKit / Health Connect│
└─────────────┬─────────────┘
              │
              │ normalized activity summaries
              v
┌───────────────────────────┐
│ Supabase Edge Functions   │
│ sync + validate + grant   │
└─────────────┬─────────────┘
              │
              │ writes / reads
              v
┌───────────────────────────┐
│ Supabase Postgres         │
│ settlement + grants       │
└─────────────┬─────────────┘
              │
              │ authenticated reads
              v
┌───────────────────────────┐
│ Expo app local cache      │
│ via Expo SQLite           │
└───────────────────────────┘
```

## What each layer should own

### Expo / React Native client

- onboarding
- permissions
- health reads
- settlement rendering
- local caching
- optimistic UI only where safe

Should not own:

- final resource grants
- anti-duplication logic
- authoritative build validation

### Supabase Edge Functions

- `POST /activity-sync`
- `POST /actions/build`
- `POST /actions/upgrade`
- `POST /actions/clear-tile`

These endpoints should be:

- short-lived;
- idempotent where needed;
- authoritative for mutations.

Implementation rule:

- keep business logic in plain TypeScript with minimal external dependencies

Why:

- Supabase Edge Functions run on the Deno runtime
- some npm packages may be awkward, unsupported, or not worth the friction for
  core game logic
- MVP game rules should stay small, explicit, and portable

### Supabase Postgres

- players
- settlements
- tiles
- buildings
- queue items
- activity sync windows
- resource grants
- action log

### Supabase Auth + RLS

- identify the player
- ensure players can only read/write their own settlement data
- keep browser/mobile DB access safe where direct access is used

## Important implementation notes

### Expo mode

Do not build this assuming Expo Go.

Use:

- Expo framework
- development builds
- EAS Build for internal testing and store builds

### Health sync shape

Do not send raw low-level health event streams unless forced later.

Start with normalized windows like:

- time range
- step total
- floor total
- source metadata
- checkpoint / dedupe key

### Backend mutation style

Reads can be simple.

Writes should be explicit function calls, not arbitrary client-side table
updates. This is a game economy. The mutation boundary matters.

## Risks with this stack

- if Edge Functions begin carrying too much domain logic, they may need to be
  replaced by a dedicated backend later;
- if local cache gets too smart, it can accidentally become a second game
  engine;
- if floors are unreliable across devices, UX and schema need to treat them as
  optional from the start.
- if we depend on Node-centric packages inside Edge Functions, Deno/runtime
  friction can slow delivery for no good reason.

## Decision

Start with:

- Expo + React Native + TypeScript
- Expo Router
- Expo development builds
- Expo SQLite
- Supabase Auth
- Supabase Postgres
- Supabase Edge Functions
- EAS Build

Revisit only after the MVP loop is live and we know where the real bottleneck
is.
