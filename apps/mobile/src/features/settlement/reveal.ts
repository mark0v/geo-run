import type { BuildingType, SettlementSnapshot } from "../../lib/api/contracts";

export interface SettlementRevealMoment {
  id: string;
  title: string;
  body: string;
  tileKey?: string;
  buildingId?: string;
}

export function deriveRevealMoment(
  previousSnapshot: SettlementSnapshot | null,
  nextSnapshot: SettlementSnapshot,
): SettlementRevealMoment | null {
  if (!previousSnapshot) {
    return null;
  }

  const buildingReveal = getBuildingReveal(previousSnapshot, nextSnapshot);
  if (buildingReveal) {
    return buildingReveal;
  }

  const tileReveal = getTileReveal(previousSnapshot, nextSnapshot);
  if (tileReveal) {
    return tileReveal;
  }

  const newCompletedItem = nextSnapshot.completedItems.find(
    (item) => !previousSnapshot.completedItems.some((previous) => previous.id === item.id),
  );

  if (newCompletedItem) {
    return {
      id: `completed:${newCompletedItem.id}`,
      title: newCompletedItem.title,
      body: "The outpost recorded a new milestone. Its history is starting to take shape.",
    };
  }

  return null;
}

function getBuildingReveal(
  previousSnapshot: SettlementSnapshot,
  nextSnapshot: SettlementSnapshot,
): SettlementRevealMoment | null {
  for (const nextBuilding of nextSnapshot.buildings) {
    const previousBuilding = previousSnapshot.buildings.find((building) => building.id === nextBuilding.id);

    if (!previousBuilding && nextBuilding.state === "complete") {
      return {
        id: `building:new:${nextBuilding.id}`,
        title: `${formatBuildingName(nextBuilding.buildingType)} completed`,
        body: "A new structure has taken root and changed the silhouette of the outpost.",
        tileKey: nextBuilding.tileKey,
        buildingId: nextBuilding.id,
      };
    }

    if (!previousBuilding) {
      continue;
    }

    if (nextBuilding.level > previousBuilding.level && nextBuilding.state === "complete") {
      return {
        id: `building:upgrade:${nextBuilding.id}:${nextBuilding.level}`,
        title: `${formatBuildingName(nextBuilding.buildingType)} upgraded`,
        body: "The settlement pushed past its previous form. This place now feels more permanent.",
        tileKey: nextBuilding.tileKey,
        buildingId: nextBuilding.id,
      };
    }

    if (previousBuilding.state !== "complete" && nextBuilding.state === "complete") {
      return {
        id: `building:complete:${nextBuilding.id}:${nextBuilding.level}`,
        title: `${formatBuildingName(nextBuilding.buildingType)} completed`,
        body: "Construction is done. The frontier now has one more finished anchor point.",
        tileKey: nextBuilding.tileKey,
        buildingId: nextBuilding.id,
      };
    }
  }

  return null;
}

function getTileReveal(
  previousSnapshot: SettlementSnapshot,
  nextSnapshot: SettlementSnapshot,
): SettlementRevealMoment | null {
  for (const nextTile of nextSnapshot.tiles) {
    const previousTile = previousSnapshot.tiles.find((tile) => tile.id === nextTile.id);

    if (!previousTile) {
      continue;
    }

    if (previousTile.state === "blocked" && nextTile.state === "cleared") {
      return {
        id: `tile:clear:${nextTile.id}`,
        title: "New land cleared",
        body: `Tile ${nextTile.tileKey} is now ready for the next structure. The frontier just widened.`,
        tileKey: nextTile.tileKey,
      };
    }

    if (previousTile.state === "hidden" && nextTile.state !== "hidden") {
      return {
        id: `tile:reveal:${nextTile.id}`,
        title: "Fresh ground revealed",
        body: `A new section of ${nextTile.terrainType.replace("-", " ")} has come into view.`,
        tileKey: nextTile.tileKey,
      };
    }
  }

  return null;
}

function formatBuildingName(buildingType: BuildingType): string {
  return buildingType.replace("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
