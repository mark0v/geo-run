# Plan Design Review, Settlement Home v0

## Scores

- Product fantasy: 4/10
- Progress legibility: 7/10
- Daily ritual clarity: 8/10
- Visual hierarchy: 5/10
- Game feel: 3/10

## What keeps it from a 10

The current screen works as a test harness, not as a frontier settlement game.
It exposes the right actions, but the eye lands on text lists instead of on a
settlement that feels like a place.

The three biggest gaps are:

1. The player cannot instantly read the outpost silhouette.
2. Terrain is listed as debug rows instead of shown as a frontier board.
3. Progress is explained, but not dramatized.

## Design direction for the first pass

Use a warm frontier-diorama direction:

- parchment and clay neutrals for the UI shell;
- moss, ash, and ember accents for terrain states;
- one strong hero card that sells "small camp becoming settlement";
- a board-like terrain section where tiles feel spatial, not tabular;
- action cards that read like evening decisions, not admin buttons.

## Concrete changes for v1

- Turn the hero area into a place card with stronger atmosphere.
- Replace the terrain list with a compact 2-column frontier board.
- Merge status into a progress strip: milestone, visible land, structures.
- Reframe actions as "Tonight's move" and "Project in motion".
- Keep buildings and milestones, but make them feel like a settlement ledger.

## Deliberately not in this pass

- animated citizens;
- parallax or full scene illustration;
- custom map rendering;
- richer motion system;
- biome-specific art packs.
