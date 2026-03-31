# MVP Spec v0

## 7 Days

### Design rule

Every day should provide one new visible change to the settlement. The player
must feel that real-world movement turns into something concrete and easy to
notice.

### Day 1

- The player opens the game for the first time.
- They see a tiny frontier outpost: one tent, one campfire, and mostly empty
  land.
- The surrounding area is partially covered by fog or unreclaimed terrain.
- They are introduced to the core promise: today's movement builds tomorrow's
  settlement.

### Day 2

- The player places their first meaningful utility structure.
- Recommendation: `Workshop` as the first core build target.
- The outpost now has a stronger silhouette than on day 1.

### Day 3

- The player clears or unlocks the first adjacent land tile.
- Fog retreats or rough terrain is reclaimed.
- The settlement footprint becomes visibly larger.

### Day 4

- The player places a support or living structure.
- Recommendation: `Hut` or `Well`.
- The outpost begins to feel like a settlement rather than a camp.

### Day 5

- The player performs the first upgrade of an existing building.
- The upgraded building changes appearance.
- The player also sees a more ambitious future target: a blocked tile,
  difficult terrain area, or special expansion point that is not yet reachable.

### Day 6

- The player unlocks a second region fragment or terrain context.
- This does not need to be a full biome system yet, but it should suggest that
  the world is larger than the first build area.

### Day 7

- The player reaches a first milestone.
- Show a short recap screen or milestone panel:
  - what was built;
  - how much the settlement expanded;
  - what becomes possible next.
- The goal is to make the player feel they have established a real outpost.

## Resources

### Core principle

The MVP must be fully playable and satisfying using steps alone.

### Primary resource

`Supplies`

- Source: real-world steps
- Purpose: universal construction and progression resource
- Role in MVP: the core input for almost all early actions

This is intentionally broader than "wood" so the economy stays flexible and the
health-to-game conversion remains easier to reason about.

### Secondary resource

`Stone`

- Source: floors or elevation-related activity when available
- Purpose: upgrades, tougher structures, difficult terrain, or selected advanced
  builds
- Role in MVP: bonus depth, not a hard gate for baseline progression

If floors are unavailable, the player should still be able to keep progressing
through the main settlement loop with Supplies alone.

### Not in MVP

- Energy as a third spendable currency
- Luck-based bonus currencies
- Highly specialized biome currencies
- Punitive decay systems

## Buildings

### Building count target

Keep MVP content intentionally narrow:

- 5 to 6 buildable structures
- 2 visible upgrades

### Recommended building set

`Camp`

- Starting structure
- Establishes the initial settlement identity
- Not player-built during normal play; it already exists at start

`Workshop`

- First core functional building
- Helps the outpost feel established and capable of expansion
- Good candidate for the first upgrade moment

`Hut`

- Early living structure
- Makes the settlement feel inhabited without needing animated citizens

`Well`

- Utility / support structure
- Good visual variety and strong frontier flavor

`Storehouse`

- Expands capacity or improves resource handling
- Gives players a practical reason to invest in infrastructure

`Watchtower`

- Territorial structure
- Supports exploration fantasy by revealing or enabling new adjacent land

### Visible upgrades

Upgrade 1:

- `Workshop -> Workshop II`
- New silhouette, added details, ambient animation like smoke or moving parts

Upgrade 2:

- `Storehouse -> Storehouse II` or `Watchtower -> Watchtower II`
- Should clearly signal stronger progression and a more established outpost

### Not in MVP

- Large tech trees
- Citizen classes
- Character roster systems
- Combat structures
- Decoration-heavy content packs

## Screens

### 1. Home / Settlement Screen

Primary screen of the game.

Shows:

- the current outpost;
- buildings under construction;
- newly completed structures;
- fog or blocked adjacent tiles;
- subtle ambient life through visuals, not citizens.

This screen should be the emotional center of the product.

### 2. Daily Summary Panel

Appears when the player opens the app after activity has been imported.

Shows:

- today's steps;
- converted Supplies;
- optional bonus Stone if available;
- a short line connecting real activity to settlement progress.

Example:

`Today you walked 8,400 steps -> +84 Supplies`

### 3. Build / Upgrade Panel

Simple action panel for spending resources.

Allows the player to:

- choose the next structure;
- upgrade an existing building;
- start clearing an adjacent tile.

The player should usually make only 1 to 2 decisions here.

### 4. Completion / Reveal Moment

A lightweight state, modal, or animation that appears when something finishes.

This is critical to the daily reward loop.

It should show:

- the newly completed building or upgrade;
- its visual change;
- the next meaningful option available.

### 5. Milestone Screen

Shown on day 7 or after a meaningful settlement threshold.

Summarizes:

- what has changed this week;
- what the player has established;
- what frontier opportunity is next.

### Screen principles

- Evening session target: 2 to 3 minutes
- One construction queue only
- The player should always understand what changed and what they can do next
- Morning opens are optional bonuses, not mandatory rituals
- In MVP, buildings are spending targets and progression markers, not standalone
  resource generators

## Out of Scope

The following should be explicitly excluded from MVP:

- tactical combat;
- squad systems;
- hero classes;
- citizen simulation;
- disasters that destroy structures;
- progress decay that erases earned value;
- deep randomness or luck systems;
- third and fourth spendable currencies;
- multiple game modes;
- reusable multi-game platform ambitions beyond light architectural separation;
- rich overworld map systems;
- heavy narrative branching.

## MVP Summary

Geo Run MVP is a low-pressure frontier settlement builder where:

- steps generate the main resource;
- the player grows a small outpost over the first 7 days;
- each day creates one visible change;
- the evening ritual is short, clear, and satisfying;
- the product promises continuity, not punishment.
