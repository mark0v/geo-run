# Test Plan

Generated from the current `plan-eng-review` direction for Geo Run MVP.

## Affected Pages/Routes

- Mobile home / settlement screen
  Why: this is the emotional center of the product and the first place stale or
  inconsistent state will show up.

- `GET /settlement`
  Why: the client needs one snapshot-oriented read path for the full home
  screen.

- `POST /activity-sync`
  Why: this is where real-world activity becomes game value. If this is wrong,
  the whole product breaks trust.

- `POST /actions/build`
  Why: this is the first meaningful player decision in the MVP.

- `POST /actions/upgrade`
  Why: day 5 progression depends on this path feeling reliable and visible.

- `POST /actions/clear-tile`
  Why: territory expansion is one of the main retention hooks.

- `POST /internal/resolve-queue-item`
  Why: queue resolution is where timers, state transitions, and completion
  moments meet.

## Key Interactions To Verify

- player opens app after activity sync and sees updated balances
- player starts a build and gets exactly one active queue item
- player cannot start a second queue item while one is active
- queue resolution completes the target structure or tile and clears the queue
- player sees a completed-item signal after resolution

## Edge Cases

- duplicate `activity-sync` windows with the same `dedupeKey`
- floors missing entirely from payload
- invalid timestamps in activity windows
- stale client snapshot followed by a fresh settlement fetch
- build request on non-cleared tile
- clear request on already cleared tile
- upgrade request on non-complete building
- queue resolution called for missing queue item
- rapid double tap on build/clear/upgrade actions
- timezone boundaries around day transitions

## Critical Paths

### Activity grant path

```text
client health read
  -> normalized sync windows
  -> dedupe validation
  -> grant calculation
  -> updated balances
```

### Build path

```text
player chooses building
  -> backend validates tile + resources + queue
  -> balances deducted
  -> queue item created
  -> later resolution marks building complete
```

### Territory expansion path

```text
player chooses blocked tile
  -> backend validates clear action
  -> queue item created
  -> later resolution marks tile cleared
```

## Existing Coverage

- `tests/activity-rules.test.ts`
  Covers grant calculation, dedupe, totals, and payload validation.

- `tests/settlement-domain.test.ts`
  Covers build planning, active queue rejection, queue resolution, and upgrade
  planning.

## Gaps To Add Next

- regression tests for clear-tile costs and resolution
- tests for upgrade resolution increasing building level
- tests for settlement snapshot shape returned by `GET /settlement`
- integration tests once Edge Functions persist to Postgres
