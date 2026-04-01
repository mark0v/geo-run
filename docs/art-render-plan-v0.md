# Art / Render Plan v0

## Conclusion

The target visual direction is correct:

- top-down
- pixel art
- tile-based world
- readable buildings
- visible land expansion
- strong "this is a game" first impression

This is a better long-term direction than our current abstract settlement scene.

But the important distinction is:

- **visual target** = like the screenshot
- **MVP implementation** = much smaller than the screenshot

If we try to ship the whole screenshot-level world right now, we will spend our time producing art systems instead of validating the product loop.

So the right move is:

**adopt the art direction now, but ship it in a constrained render plan**

## What the screenshot tells us

The screenshot works because:

1. the game state is spatial, not textual
2. buildings feel placed in land, not floating in cards
3. terrain progression is visible
4. the world looks inhabited even when nothing is moving
5. the player reads the scene first and UI second

That is exactly what our current UI still lacks.

## Product fit

This art direction is a good fit for Geo Run because the core loop is not action-heavy.

Our game is:

- a settlement builder
- asynchronous
- low-frequency updates
- progress-driven
- visually accumulative

That means we do **not** need:

- a full realtime engine
- pathfinding
- animated villagers in MVP
- a scrolling camera
- combat systems

That is very good news.

It means a convincing scene is possible without a full game-engine migration.

## Recommendation

### Phase 1 recommendation

For MVP:

- buy a commercial-friendly top-down pixel tileset
- render the settlement scene with image layers / positioned sprites
- keep all UI in standard React Native
- do **not** move to Skia first
- do **not** add PixiJS

This gives us the biggest visual upgrade for the lowest technical risk.

### Why not Skia first

Skia is powerful, but it adds weight and setup cost.

Official Skia docs say:

- Expo supports it
- web uses CanvasKit
- bundle size grows by about `6 MB iOS`, `4 MB Android`, `2.9 MB web`
- Android needs NDK

That is reasonable for a more advanced phase, but unnecessary for our first pixel-art scene.

For Geo Run MVP, image-based rendering is enough because the scene changes only when the game state changes.

## Render architecture

## Layer 0. Game state stays the same

We should **not** rewrite backend/domain logic.

Current game state already gives us what we need:

- tiles
- terrain type
- tile state
- buildings
- building type
- building level
- reveal/completion moments

That is enough to drive pixel-art rendering.

## Layer 1. Scene model

Add a front-end-only scene adapter:

- input: settlement snapshot
- output: renderable scene model

Example output:

```ts
type SceneTile = {
  tileKey: string;
  gridX: number;
  gridY: number;
  terrainSprite: string;
  overlaySprite?: string;
  buildingSprite?: string;
  blocked: boolean;
  highlighted: boolean;
};
```

This adapter is the bridge between domain data and art assets.

It should live entirely on the client.

## Layer 2. Sprite manifest

Create a local asset manifest that maps game concepts to art files.

Example:

```ts
terrain:
  plains -> plains_01.png
  forest-edge -> forest_edge_01.png
  hill -> hill_01.png

buildings:
  camp_lv1 -> camp_01.png
  workshop_lv1 -> workshop_01.png
  workshop_lv2 -> workshop_02.png
  hut_lv1 -> hut_01.png
```

This matters because it lets us swap asset packs later without changing game logic.

## Layer 3. Scene renderer

The renderer should be simple:

- fixed tile grid
- fixed viewport
- no camera movement in MVP
- no pinch zoom
- no drag

Implementation path:

1. background terrain tiles
2. overlays for blocked/fog/highlighted states
3. building sprites
4. optional ambient layer
5. UI overlays on top

This can be done with positioned image elements.

## Visual scope for MVP

We should build a **small believable diorama**, not a full village simulator.

Recommended MVP scene:

- visible grid around `6x4` or `7x5`
- 3 terrain families:
  - plains
  - forest edge
  - hill
- 5 structure families:
  - camp
  - workshop
  - hut
  - well
  - storehouse
- optional watchtower as later visual unlock

No characters required.

Life can be implied through:

- smoke
- lamps
- tilled paths
- fences
- crop patches
- barrels
- wood piles

These should mostly come from the asset pack, not from hand-built code art.

## Art constraints

To keep the scene coherent:

### Tile size

Use source art at:

- `16x16` or `32x32` tiles

Recommendation:

- choose `32x32` if we want easier readability on mobile
- render at `2x` scale for a `64x64` effective display tile feel when needed

For our first pass, readability matters more than nostalgia purity.

So I recommend:

**32x32 source assets**

## Scene aspect

The home scene should fit in one phone-first card.

Recommended scene footprint:

- about `300-340px` tall in the first mobile implementation
- wide enough to suggest a village edge, but not so tall that home becomes scroll-heavy again

## Color direction

Important:

If we move to pixel art, the entire UI should follow it.

That means:

- darker earth-based palette
- warm ember highlights
- muted green terrain accents
- fewer pale cream card surfaces

The scene and the surrounding UI must feel like the same product.

## Asset acquisition plan

### Best MVP path

Use a pre-made commercial-friendly pack from itch.io.

Search terms:

- `top down pixel settlement`
- `top down pixel village`
- `farming pixel tileset`
- `rpg town tileset`
- `pixel frontier tileset`

What to look for:

- exterior terrain tiles
- houses / workshop-like buildings
- ground details
- path / fence / foliage support
- license that allows commercial use

Budget expectation:

- roughly `$10-30` for a good starter pack

This is much better than inventing an art pipeline from scratch right now.

### What not to buy first

Do not optimize for:

- animated combat sprites
- huge biome bundles
- character creator sets
- giant world-map kits

We need a settlement pack first.

## Tiled usage

`Tiled` is useful, but we should treat it as optional in v0.

Good use cases later:

- authoring handcrafted layouts
- exporting map layers
- creating scene templates

Not necessary for first render pass if the layout is tiny and programmatic.

For the first implementation, the front-end can place tiles directly from the settlement snapshot.

## Expo implementation plan

## Phase A. Asset-backed scene shell

Goal:

Replace the current abstract scene card with a real pixel-art map card.

Tasks:

- add one asset pack
- create sprite manifest
- create scene adapter
- replace current scene block with positioned sprites
- keep current CTA / chips / progress strip

Result:

The app finally looks like a game.

## Phase B. Tile state readability

Goal:

Make progression readable from the scene.

Tasks:

- blocked tiles use fog/rock/tree overlays
- cleared tiles look buildable
- occupied tiles show actual structures
- reveal/completion highlight gets a visual glow or accent frame

Result:

Players can understand progress by looking at the world.

## Phase C. Build placement feel

Goal:

Make the build flow feel intentional.

Tasks:

- from build picker, choose structure
- highlight eligible placement tile
- show tiny confirmation state
- then start queue

Result:

Building feels like placing part of a town, not submitting a form.

## Phase D. Ambient polish

Only after A-C work.

Possible additions:

- chimney smoke
- torch glow
- water shimmer
- subtle highlight pulse for newly completed building

Still no villagers required.

## Technical recommendation by options

### Option 1. `Image` / positioned sprites

Use:

- React Native / Expo image rendering
- absolute positioning
- sprite manifest

Pros:

- simplest
- no new heavy render engine
- easiest to debug
- enough for MVP

Cons:

- less flexible for effects
- layering gets messy if the scene becomes complex

### Option 2. `React Native Skia`

Use:

- if we outgrow image-based composition
- if we need proper tile batching, effects, masking, fog, glow

Pros:

- powerful
- future-friendly
- good for custom scene rendering

Cons:

- more setup
- heavier web/runtime cost
- not needed yet

### Option 3. `PixiJS / expo-gl`

Do not choose this for MVP.

Reason:

- too much engine complexity
- wrong tradeoff for an async builder

## My final recommendation

For Geo Run:

1. Keep backend and domain model exactly as they are.
2. Buy a pixel-art settlement tileset.
3. Build a client-side `scene adapter + sprite manifest`.
4. Render the first pixel-art settlement scene with positioned images.
5. Only move to Skia if we hit real scene limitations.

That is the highest-leverage path.

It gets us much closer to the screenshot, without paying the full engine cost up front.

## Out of scope for v0

- scrolling map
- free camera
- animated villagers
- pathfinding
- live simulation
- combat
- weather system
- day/night cycle
- Skia migration
- Tiled-authored production pipeline

## Immediate next implementation step

The next concrete engineering/design step should be:

**replace the current scene card with a first asset-backed pixel-art scene using one small purchased tileset**

Not a new screen.
Not more systems.
Just one believable playable-looking home scene.
