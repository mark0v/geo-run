# Mobile Design Direction v0

## What changed

The current settlement screen is good enough for logic testing.
It is not good enough as a mobile game screen.

Right now the UI still behaves like a control panel:

- too much text before emotion
- too many rectangular sections competing for attention
- the settlement exists as data, not as a place
- the player reads the screen instead of feeling the outpost

The reference in [geo_run_settlement_home.html](C:\Users\nuc\Downloads\geo_run_settlement_home.html) is much closer to the right direction.

Not because it is visually finished.
Because it already does the important thing:

- one phone-sized composition
- one scene as the emotional center
- compact resources
- clear progress
- one main evening action
- day-to-day comparison as a feeling of growth

That is the right starting point.

## Design Thesis

This should feel like a quiet mobile settlement game, not a dashboard.

The player opens the app and immediately understands:

1. what this place looks like now
2. what changed since last time
3. what the one best next move is

Everything else is secondary.

## What we should take from the reference

### 1. Scene-first layout

The settlement must live in one compact illustrated scene near the top of the screen.
This scene is the emotional center of the product.

It should show:

- campfire / core base
- visible structures
- fog or locked edges
- a sense of horizon and frontier

The current board is useful, but it still reads like cards in a grid.
The reference is better because it feels like one place.

### 2. Compact resource header

Resources should be small, always visible, and game-like.

Good pattern:

- settlement name
- 2 resource chips
- maybe one status chip like `Queue active`

Bad pattern:

- large summary cards taking over the top half of the screen

### 3. Progress as momentum

Progress should not be explained in paragraphs.
It should be understood in one glance:

- stage label
- progress bar
- milestone copy

The player should feel "I am on day 3 of something growing", not "I am reading an admin report."

### 4. One action at a time

The reference gets this right.
There is one main action in the lower area.

That matches our product well:

- collect movement
- place a build
- clear land
- resolve project

One main CTA.
Everything else secondary.

## What we should NOT copy directly

### 1. Day tabs as primary product UI

`Day 1 / Day 3 / Day 5 / Day 7` works as a concept demo.
It is not the real navigation model.

In the real app, those states should become:

- current live settlement
- milestone log
- optional recap flow

### 2. Static miniature grid under the scene

The little territory boxes are useful, but they feel more abstract than the scene above.
For the real app, we should merge "territory understanding" and "place feeling" more tightly.

### 3. One long vertical stack of everything

The phone reference is much better than our current shell, but still a bit too literal.
We should compress the home screen harder.

Home should not try to explain the whole game.

## Mobile Home Screen v1

This is the screen we should design toward first.

### Section order

1. Top bar
2. Scene card
3. Milestone/progress strip
4. Current project or reveal card
5. Primary evening action
6. Small secondary shortcuts

### 1. Top bar

Content:

- settlement name
- Supplies chip
- Stone chip
- optional queue chip

Purpose:

- instant orientation
- no wasted vertical space

### 2. Scene card

This is the heart of the screen.

Visual ingredients:

- dusk/night frontier palette
- camp at center
- structures appear physically in the scene
- fog or blocked regions at edges
- subtle depth layers: sky, ridge, ground, silhouette

This card should answer:
"What does my outpost look like right now?"

### 3. Milestone/progress strip

Compact row under the scene:

- current milestone text
- progress fraction or stage
- short bar

Example:

- `Workshop standing`
- `2 / 6`
- orange fill bar

### 4. Current project or reveal card

This area changes based on state.

If something is in progress:

- building name
- ready in `6h`
- small note about what it unlocks

If something just completed:

- celebratory title
- short flavor line
- maybe tiny highlight glow

This block should feel alive, not administrative.

### 5. Primary evening action

One large button only.

Examples:

- `Collect today's movement`
- `Place workshop`
- `Clear new land`
- `Finish construction`

This is the behavioral anchor of the product.

### 6. Small secondary shortcuts

Below the main action, 2-3 quiet links/buttons:

- open build menu
- view milestones
- inspect territory

These must never overpower the main ritual.

## Screen Architecture for MVP

We do not need many screens.
We need a few good ones.

### Screen 1. Home / Settlement

This is the primary screen.
Open app -> land here every time.

Responsibilities:

- show current settlement
- show progress
- show current/recent change
- present one best next action

This is the most important screen in the whole app.

### Screen 2. Build Picker

Likely a bottom sheet, not a full screen at first.

Shows:

- available build options
- cost
- why it matters
- tile/location selection if needed

This should feel like choosing the next shape of the outpost, not opening a spreadsheet.

### Screen 3. Territory / Expansion Detail

This can start as a lightweight sub-screen or modal.

Shows:

- blocked vs cleared land
- what expansion unlocks
- what the next frontier target is

This is where the player understands where to push next.

### Screen 4. Project Complete / Reveal

This does not need to be a separate route.
It can be a transient state layered over Home.

Shows:

- what just completed
- visual change in scene
- one follow-up action

This matters a lot for game feel.

### Screen 5. Milestones / Settlement Log

Simple history screen.

Shows:

- completed structures
- named milestones
- maybe day-based recap later

This gives memory to the settlement.

## Visual Direction

### Mood

Quiet frontier at dusk.
Warm firelight against dark earth.
Not bright cartoon farm.
Not grim survival game.

Target feeling:

- calm
- intimate
- small but meaningful progress
- the place remembers you

### Palette

Core colors:

- deep earth brown
- soot black
- parchment beige
- ember orange
- muted moss green
- stone sage

Use orange rarely and meaningfully:

- progress
- firelight
- primary action
- completion highlights

### Shape language

- rounded rectangles for UI chrome
- soft corners, not sharp strategy-game panels
- scene itself more organic than the surrounding UI

### Typography

We should eventually move away from generic sans-only UI.

Recommended split:

- serif or semi-serif display for settlement name and milestone moments
- clean sans for UI labels and buttons

That contrast will help it feel more like a game and less like a productivity app.

## Responsive Rules

### Mobile first

The phone layout is the source of truth.
Desktop preview is just a development convenience.

### Mobile behavior

- the scene should dominate the first screenful
- no two-column dashboard layout on phone
- cards should compress vertically
- side information becomes stacked strips or sheets

### Desktop preview behavior

Desktop can widen the scene and show more breathing room, but it should still read like a phone-born interface, not a SaaS control panel.

## What already exists

- real settlement/home logic
- live backend flow
- frontier board renderer
- completion feedback system
- action hierarchy with one recommended move

So this is not a pure concept phase anymore.
We already have working mechanics.
The design work should now reshape presentation, not re-invent flow.

## Not in scope for this pass

- animated citizens
- full isometric art
- biome-specific illustration sets
- combat UI
- inventory UI
- deep meta-navigation
- monetization surfaces

## Recommendation

Next we should do one focused design implementation pass:

1. replace the current home layout with a real mobile-first scene card
2. compress resources/progress into a tighter game header
3. turn build/territory/milestones into secondary surfaces instead of equal sections
4. keep the same game logic underneath

That gets us from "working shell" to "first believable mobile game screen."
