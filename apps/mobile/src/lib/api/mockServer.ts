import type {
  BuildRequest,
  BuildingType,
  ClearTileRequest,
  ResolveQueueItemRequest,
  SettlementActionAcceptedResponse,
  SettlementActionRejectedResponse,
  SettlementSnapshot,
  UpgradeRequest,
} from "./contracts";
import { mockSettlementSnapshot } from "./mock";

interface Cost {
  supplies: number;
  stone: number;
}

interface BuildingDefinition {
  buildCost: Cost;
  buildDurationMinutes: number;
  upgradeCost?: Cost;
  upgradeDurationMinutes?: number;
}

const BUILDING_DEFINITIONS: Record<Exclude<BuildingType, "camp">, BuildingDefinition> = {
  workshop: {
    buildCost: { supplies: 40, stone: 0 },
    buildDurationMinutes: 60,
    upgradeCost: { supplies: 60, stone: 4 },
    upgradeDurationMinutes: 90,
  },
  hut: {
    buildCost: { supplies: 30, stone: 0 },
    buildDurationMinutes: 45,
  },
  well: {
    buildCost: { supplies: 25, stone: 0 },
    buildDurationMinutes: 30,
  },
  storehouse: {
    buildCost: { supplies: 50, stone: 0 },
    buildDurationMinutes: 70,
    upgradeCost: { supplies: 70, stone: 6 },
    upgradeDurationMinutes: 100,
  },
  watchtower: {
    buildCost: { supplies: 60, stone: 0 },
    buildDurationMinutes: 80,
    upgradeCost: { supplies: 80, stone: 8 },
    upgradeDurationMinutes: 110,
  },
};

const CLEAR_TILE_COST: Cost = {
  supplies: 30,
  stone: 0,
};

let currentSnapshot = cloneSnapshot(mockSettlementSnapshot);

export async function getMockSettlementSnapshot(): Promise<SettlementSnapshot> {
  await delay(150);
  return cloneSnapshot(currentSnapshot);
}

export function resetMockSettlementState(): void {
  currentSnapshot = cloneSnapshot(mockSettlementSnapshot);
}

export async function startMockBuild(
  request: BuildRequest,
): Promise<SettlementActionAcceptedResponse | SettlementActionRejectedResponse> {
  await delay(150);

  if (currentSnapshot.activeQueueItem) {
    return reject("ACTIVE_QUEUE_EXISTS", "Only one construction queue item is allowed in MVP.");
  }

  const tile = currentSnapshot.tiles.find((candidate) => candidate.tileKey === request.tileKey);
  if (!tile) {
    return reject("TILE_NOT_FOUND", "The requested tile does not exist.");
  }

  if (tile.state !== "cleared") {
    return reject("INVALID_TILE_STATE", "Buildings can only be placed on cleared tiles.");
  }

  if (currentSnapshot.buildings.some((candidate) => candidate.tileKey === request.tileKey)) {
    return reject("TILE_OCCUPIED", "This tile already has a structure.");
  }

  const definition = BUILDING_DEFINITIONS[request.buildingType];
  if (!hasEnoughResources(currentSnapshot, definition.buildCost)) {
    return reject("INSUFFICIENT_RESOURCES", "Not enough resources for that building.");
  }

  const startedAt = new Date().toISOString();
  const completeAt = addMinutes(new Date(startedAt), definition.buildDurationMinutes).toISOString();
  const buildingId = makeId("building");

  currentSnapshot = {
    ...currentSnapshot,
    settlement: {
      ...currentSnapshot.settlement,
      balances: deductCost(currentSnapshot, definition.buildCost),
    },
    tiles: currentSnapshot.tiles.map((candidate) =>
      candidate.tileKey === request.tileKey ? { ...candidate, state: "occupied" } : candidate,
    ),
    buildings: [
      ...currentSnapshot.buildings,
      {
        id: buildingId,
        tileKey: request.tileKey,
        buildingType: request.buildingType,
        level: 1,
        state: "building",
        startedAt,
      },
    ],
    activeQueueItem: {
      id: makeId("queue"),
      actionType: "build",
      targetType: "building",
      targetId: buildingId,
      startedAt,
      completeAt,
    },
  };

  return accept(`${labelForBuilding(request.buildingType)} construction started.`, currentSnapshot);
}

export async function startMockUpgrade(
  request: UpgradeRequest,
): Promise<SettlementActionAcceptedResponse | SettlementActionRejectedResponse> {
  await delay(150);

  if (currentSnapshot.activeQueueItem) {
    return reject("ACTIVE_QUEUE_EXISTS", "Only one construction queue item is allowed in MVP.");
  }

  const building = currentSnapshot.buildings.find((candidate) => candidate.id === request.buildingId);
  if (!building) {
    return reject("BUILDING_NOT_FOUND", "The requested building does not exist.");
  }

  if (building.state !== "complete") {
    return reject("BUILDING_NOT_READY", "Only completed buildings can be upgraded.");
  }

  if (building.buildingType === "camp") {
    return reject("UPGRADE_NOT_SUPPORTED", "The camp cannot be upgraded in MVP.");
  }

  const definition = BUILDING_DEFINITIONS[building.buildingType];
  if (!definition.upgradeCost || !definition.upgradeDurationMinutes) {
    return reject("UPGRADE_NOT_SUPPORTED", "This building has no upgrade path.");
  }

  if (!hasEnoughResources(currentSnapshot, definition.upgradeCost)) {
    return reject("INSUFFICIENT_RESOURCES", "Not enough resources for that upgrade.");
  }

  const startedAt = new Date().toISOString();
  const completeAt = addMinutes(new Date(startedAt), definition.upgradeDurationMinutes).toISOString();

  currentSnapshot = {
    ...currentSnapshot,
    settlement: {
      ...currentSnapshot.settlement,
      balances: deductCost(currentSnapshot, definition.upgradeCost),
    },
    buildings: currentSnapshot.buildings.map((candidate) =>
      candidate.id === request.buildingId ? { ...candidate, state: "building", startedAt } : candidate,
    ),
    activeQueueItem: {
      id: makeId("queue"),
      actionType: "upgrade",
      targetType: "building",
      targetId: request.buildingId,
      startedAt,
      completeAt,
    },
  };

  return accept(`${labelForBuilding(building.buildingType)} upgrade started.`, currentSnapshot);
}

export async function startMockClearTile(
  request: ClearTileRequest,
): Promise<SettlementActionAcceptedResponse | SettlementActionRejectedResponse> {
  await delay(150);

  if (currentSnapshot.activeQueueItem) {
    return reject("ACTIVE_QUEUE_EXISTS", "Only one construction queue item is allowed in MVP.");
  }

  const tile = currentSnapshot.tiles.find((candidate) => candidate.tileKey === request.tileKey);
  if (!tile) {
    return reject("TILE_NOT_FOUND", "The requested tile does not exist.");
  }

  if (tile.state !== "blocked") {
    return reject("TILE_NOT_BLOCKED", "Only blocked tiles can be cleared.");
  }

  if (!hasEnoughResources(currentSnapshot, CLEAR_TILE_COST)) {
    return reject("INSUFFICIENT_RESOURCES", "Not enough resources to clear this tile.");
  }

  const startedAt = new Date().toISOString();
  const completeAt = addMinutes(new Date(startedAt), 40).toISOString();

  currentSnapshot = {
    ...currentSnapshot,
    settlement: {
      ...currentSnapshot.settlement,
      balances: deductCost(currentSnapshot, CLEAR_TILE_COST),
    },
    activeQueueItem: {
      id: makeId("queue"),
      actionType: "clear_tile",
      targetType: "tile",
      targetId: tile.id,
      startedAt,
      completeAt,
    },
  };

  return accept(`Tile ${request.tileKey} is being cleared.`, currentSnapshot);
}

export async function resolveMockQueueItem(
  request: ResolveQueueItemRequest,
): Promise<SettlementActionAcceptedResponse | SettlementActionRejectedResponse> {
  await delay(150);

  const queueItem = currentSnapshot.activeQueueItem;
  if (!queueItem || queueItem.id !== request.queueItemId) {
    return reject("QUEUE_ITEM_NOT_FOUND", "No matching active queue item was found.");
  }

  const completedAt = new Date().toISOString();

  if (queueItem.actionType === "build") {
    currentSnapshot = {
      ...currentSnapshot,
      buildings: currentSnapshot.buildings.map((building) =>
        building.id === queueItem.targetId ? { ...building, state: "complete", completedAt } : building,
      ),
      activeQueueItem: null,
      completedItems: [
        {
          id: makeId("completed"),
          title: "Construction complete",
          completedAt,
        },
        ...currentSnapshot.completedItems,
      ],
    };

    return accept("Construction finished.", currentSnapshot);
  }

  if (queueItem.actionType === "upgrade") {
    currentSnapshot = {
      ...currentSnapshot,
      buildings: currentSnapshot.buildings.map((building) =>
        building.id === queueItem.targetId
          ? {
              ...building,
              level: building.level + 1,
              state: "complete",
              completedAt,
            }
          : building,
      ),
      activeQueueItem: null,
      completedItems: [
        {
          id: makeId("completed"),
          title: "Upgrade complete",
          completedAt,
        },
        ...currentSnapshot.completedItems,
      ],
    };

    return accept("Upgrade finished.", currentSnapshot);
  }

  currentSnapshot = {
    ...currentSnapshot,
    tiles: currentSnapshot.tiles.map((tile) =>
      tile.id === queueItem.targetId ? { ...tile, state: "cleared" } : tile,
    ),
    activeQueueItem: null,
    completedItems: [
      {
        id: makeId("completed"),
        title: "Tile cleared",
        completedAt,
      },
      ...currentSnapshot.completedItems,
    ],
  };

  return accept("Tile clearing finished.", currentSnapshot);
}

function accept(message: string, snapshot: SettlementSnapshot): SettlementActionAcceptedResponse {
  return {
    status: "accepted",
    message,
    snapshot: cloneSnapshot(snapshot),
  };
}

function reject(code: string, message: string): SettlementActionRejectedResponse {
  return {
    status: "rejected",
    code,
    message,
  };
}

function cloneSnapshot(snapshot: SettlementSnapshot): SettlementSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as SettlementSnapshot;
}

function hasEnoughResources(snapshot: SettlementSnapshot, cost: Cost): boolean {
  return (
    snapshot.settlement.balances.supplies >= cost.supplies &&
    snapshot.settlement.balances.stone >= cost.stone
  );
}

function deductCost(snapshot: SettlementSnapshot, cost: Cost) {
  return {
    supplies: snapshot.settlement.balances.supplies - cost.supplies,
    stone: snapshot.settlement.balances.stone - cost.stone,
  };
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function labelForBuilding(buildingType: Exclude<BuildingType, "camp">): string {
  return {
    workshop: "Workshop",
    hut: "Hut",
    well: "Well",
    storehouse: "Storehouse",
    watchtower: "Watchtower",
  }[buildingType];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
