# Technical Architecture v0

## Recommendation

Choose a hybrid architecture:

- mobile reads health data from platform APIs;
- mobile normalizes that data into a cross-platform sync shape;
- backend is authoritative for resource grants and settlement state changes;
- mobile caches settlement state locally for fast opens and resilient UX.

Why this wins:

- it keeps health-provider weirdness out of core game logic;
- it keeps the economy authoritative and debuggable;
- it supports future balance changes without client migrations for every rule
  tweak;
- it is still simple enough for an MVP.

## Architecture options

### Option A: Client-authoritative game logic

Description:
The mobile app reads health data, converts it to resources locally, and updates
settlement state mostly on device, syncing snapshots to backend.

Pros:

- simplest offline story
- fewer backend responsibilities at first
- faster prototyping

Cons:

- hard to trust and audit
- easy to duplicate or corrupt grants
- balance changes become harder
- more platform-specific logic leaks into gameplay

Completeness: 4/10

### Option B: Hybrid client ingestion, server-authoritative economy

Description:
The mobile app reads health data and sends normalized activity summaries to the
backend. The backend awards resources, validates build actions, and persists the
settlement as the source of truth.

Pros:

- clean separation between device APIs and game rules
- easier to explain grants and debug sync issues
- safer for economy and progression integrity
- good long-term base without overbuilding

Cons:

- more backend work up front
- requires sync/reconciliation design
- offline mode is cache-first, not fully authoritative offline

Completeness: 9/10

### Option C: Full raw-data backend ingestion platform

Description:
Treat the backend as a generalized activity platform. Sync rich health data,
store detailed event streams, and support multiple future game experiences from
the same engine.

Pros:

- strongest long-term flexibility
- maximum reuse for future game concepts
- rich analytics potential

Cons:

- classic premature platform move
- expensive to build before one game proves fun
- heavy privacy, storage, and product-complexity cost

Completeness: 6/10

## Recommended MVP system split

### Mobile client

Responsibilities:

- onboarding and permissions
- reading step and floor data from platform health APIs
- local display of settlement state
- caching last-known state for fast app opens
- sending normalized activity sync payloads
- sending player actions like `build`, `upgrade`, and `clear_tile`

Should not own:

- final resource grants
- authoritative settlement mutation
- anti-duplication rules
- game balance logic that will change frequently

### Backend API

Responsibilities:

- player identity and settlement persistence
- ingesting normalized activity syncs
- deduplicating synced activity windows
- converting activity into `Supplies` and `Stone`
- validating player actions against current settlement state
- writing authoritative action and grant logs
- returning current settlement state and pending timers

### Local cache / persistence

Responsibilities:

- last successful settlement snapshot
- pending UI state
- recent sync checkpoint metadata

Should not become:

- a second authoritative game engine

## Data flow

```text
┌─────────────────────┐
│ Apple Health        │
│ Health Connect      │
└─────────┬───────────┘
          │ raw device activity
          v
┌─────────────────────┐
│ Mobile ingestion    │
│ permissions + read  │
└─────────┬───────────┘
          │ normalized activity summary
          v
┌─────────────────────┐
│ Sync payload        │
│ step windows        │
│ floor windows       │
│ source metadata     │
└─────────┬───────────┘
          │ POST /activity-sync
          v
┌─────────────────────┐
│ Backend sync layer  │
│ validate + dedupe   │
└─────────┬───────────┘
          │ accepted activity windows
          v
┌─────────────────────┐
│ Economy engine      │
│ apply conversion    │
│ create grants       │
└─────────┬───────────┘
          │ Supplies / Stone grants
          v
┌─────────────────────┐
│ Settlement domain   │
│ build queue         │
│ tiles + buildings   │
│ player actions      │
└─────────┬───────────┘
          │ state snapshot + events
          v
┌─────────────────────┐
│ Mobile settlement   │
│ view + local cache  │
└─────────────────────┘
```

## Domain model

### Required entities

`Player`

- player id
- platform identity
- timezone
- health sync settings

`Settlement`

- settlement id
- player id
- current milestone
- active construction queue item
- current resource balances

`Tile`

- tile id
- settlement id
- state: hidden / blocked / cleared / occupied
- terrain type

`Building`

- building id
- settlement id
- tile id
- building type
- level
- state: planned / building / complete

`ConstructionQueueItem`

- queue item id
- settlement id
- target type: building / upgrade / clear_tile
- target id or target descriptor
- start time
- completion time
- state

`ActivitySyncWindow`

- sync window id
- player id
- source type
- start and end timestamps
- normalized step count
- normalized floor count
- dedupe fingerprint

`DailyResourceGrant`

- grant id
- player id
- source window ids or calculation reference
- supplies granted
- stone granted
- rule version

`PlayerActionLog`

- action id
- player id
- action type
- payload
- server result
- timestamp

## State transition rules

### Activity sync

```text
new activity window
  -> validate time range
  -> check dedupe fingerprint
  -> accept or reject
  -> convert via current rule version
  -> write resource grant
  -> update settlement balances
```

### Build action

```text
player taps build
  -> backend checks current balances
  -> backend checks tile state
  -> backend checks queue availability
  -> deduct resources
  -> create queue item
  -> mark target as planned/building
```

### Queue completion

```text
time reaches completion
  -> queue item resolves
  -> building or tile state updates
  -> settlement milestone may update
  -> completion event returned on next fetch/open
```

## API surface, MVP-sized

### `POST /activity-sync`

Input:

- normalized activity windows
- device/source metadata
- client sync checkpoint

Output:

- accepted windows
- rejected duplicates
- granted resources
- current balances
- current settlement snapshot

### `GET /settlement`

Returns:

- settlement snapshot
- tiles
- buildings
- active queue item
- balances
- newly completed items

### `POST /actions/build`

### `POST /actions/upgrade`

### `POST /actions/clear-tile`

Returns for each:

- accepted or rejected result
- updated settlement snapshot
- validation message if rejected

## Current implementation notes

- The current edge-function vertical slice supports a seedable demo player via
  the `x-player-auth-user-id` request header. If the header is absent, backend
  code falls back to a deterministic demo UUID so local flows can bootstrap.
- Persistence currently follows one logical mutation boundary per request, but
  it is still implemented as multiple table writes inside the edge function.
  The next hardening step is moving `build`, `upgrade`, `clear_tile`, and
  `resolve_queue_item` into SQL RPC wrappers so queue resolution and building
  state changes become physically transactional, not just logically grouped.

## Edge cases that matter now

### Health-data edge cases

- no floors available on this device
- health permission denied after onboarding
- same activity range synced twice
- delayed health updates from device OS
- timezone boundary causing wrong daily attribution

### Economy edge cases

- player spends resources while another sync is in flight
- duplicate sync creates double grant
- conversion rules change after earlier grants already exist
- player opens app with stale local snapshot

### Construction edge cases

- player starts build, app closes immediately
- queue item finishes while device is offline
- player tries to build on blocked or occupied tile
- player taps action twice rapidly

## Test priorities

### Unit / domain tests

- conversion rule correctness for steps and optional floors
- dedupe logic for activity sync windows
- settlement validation for build/upgrade/clear actions
- queue completion state transitions
- timezone-sensitive daily attribution

### Integration tests

- activity sync -> grant creation -> balance update
- build action -> queue item creation -> settlement snapshot update
- duplicate sync rejection

### Client tests

- permission-denied UX
- missing-floors UX
- stale-cache open followed by refresh
- completion/reveal state after queue resolution

## Performance posture

MVP performance target:

- app open should render from local cache first
- settlement refresh should be lightweight and snapshot-based
- activity sync payloads should stay summary-based, not raw step-event streams

This should be boring. Good.

## What not to build yet

- generalized event sourcing for every future game
- raw health analytics warehouse
- multiplayer economy logic
- server-driven live-ops system
- background simulation of citizens

## Next step

Use this architecture as input to a stricter engineering review of:

- whether the backend should be fully authoritative from day one;
- whether `DailyResourceGrant` should be daily-only or window-based in storage;
- what exact mobile stack and backend stack best fit this MVP.
