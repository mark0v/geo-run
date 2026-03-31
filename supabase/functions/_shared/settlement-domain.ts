import {
  BuildRequest,
  ClearTileRequest,
  SettlementBalances,
  UpgradeRequest,
} from "./contracts.ts";

export type BuildingType =
  | "camp"
  | "workshop"
  | "hut"
  | "well"
  | "storehouse"
  | "watchtower";

export type TileState = "hidden" | "blocked" | "cleared" | "occupied";
export type BuildingState = "planned" | "building" | "complete";
export type QueueActionType = "build" | "upgrade" | "clear_tile";

export interface Cost {
  supplies: number;
  stone: number;
}

export interface BuildingDefinition {
  type: Exclude<BuildingType, "camp">;
  label: string;
  buildCost: Cost;
  buildDurationMinutes: number;
  upgradeCost?: Cost;
  upgradeDurationMinutes?: number;
}

export interface SettlementTileView {
  id: string;
  tileKey: string;
  terrainType: string;
  state: TileState;
}

export interface SettlementBuildingView {
  id: string;
  tileKey: string;
  buildingType: BuildingType;
  level: number;
  state: BuildingState;
  startedAt?: string;
  completedAt?: string;
}

export interface ConstructionQueueItemView {
  id: string;
  actionType: QueueActionType;
  targetType: "building" | "tile";
  targetId: string;
  startedAt: string;
  completeAt: string;
  payload?: Record<string, unknown>;
}

export interface CompletedItemView {
  id: string;
  title: string;
  completedAt: string;
}

export interface SettlementSnapshot {
  settlement: {
    id: string;
    name: string;
    milestoneLevel: number;
    balances: SettlementBalances;
  };
  tiles: SettlementTileView[];
  buildings: SettlementBuildingView[];
  activeQueueItem: ConstructionQueueItemView | null;
  completedItems: CompletedItemView[];
}

interface DomainError {
  code: string;
  message: string;
}

interface DomainSuccess<T> {
  ok: true;
  value: T;
}

interface DomainFailure {
  ok: false;
  error: DomainError;
}

type DomainResult<T> = DomainSuccess<T> | DomainFailure;

const CLEAR_TILE_COST: Cost = {
  supplies: 30,
  stone: 0,
};

export const BUILDING_DEFINITIONS: Record<Exclude<BuildingType, "camp">, BuildingDefinition> = {
  workshop: {
    type: "workshop",
    label: "Workshop",
    buildCost: { supplies: 40, stone: 0 },
    buildDurationMinutes: 60,
    upgradeCost: { supplies: 60, stone: 4 },
    upgradeDurationMinutes: 90,
  },
  hut: {
    type: "hut",
    label: "Hut",
    buildCost: { supplies: 30, stone: 0 },
    buildDurationMinutes: 45,
  },
  well: {
    type: "well",
    label: "Well",
    buildCost: { supplies: 25, stone: 0 },
    buildDurationMinutes: 30,
  },
  storehouse: {
    type: "storehouse",
    label: "Storehouse",
    buildCost: { supplies: 50, stone: 0 },
    buildDurationMinutes: 70,
    upgradeCost: { supplies: 70, stone: 6 },
    upgradeDurationMinutes: 100,
  },
  watchtower: {
    type: "watchtower",
    label: "Watchtower",
    buildCost: { supplies: 60, stone: 0 },
    buildDurationMinutes: 80,
    upgradeCost: { supplies: 80, stone: 8 },
    upgradeDurationMinutes: 110,
  },
};

export function createStarterSettlementSnapshot(): SettlementSnapshot {
  return {
    settlement: {
      id: "settlement-starter",
      name: "New Haven",
      milestoneLevel: 1,
      balances: {
        supplies: 120,
        stone: 6,
      },
    },
    tiles: [
      { id: "tile-0-0", tileKey: "0,0", terrainType: "plains", state: "occupied" },
      { id: "tile-1-0", tileKey: "1,0", terrainType: "plains", state: "cleared" },
      { id: "tile-0-1", tileKey: "0,1", terrainType: "forest-edge", state: "blocked" },
      { id: "tile-1-1", tileKey: "1,1", terrainType: "hill", state: "hidden" },
    ],
    buildings: [
      {
        id: "building-camp",
        tileKey: "0,0",
        buildingType: "camp",
        level: 1,
        state: "complete",
        completedAt: "2026-03-31T08:00:00Z",
      },
    ],
    activeQueueItem: null,
    completedItems: [],
  };
}

export function planBuild(
  snapshot: SettlementSnapshot,
  request: BuildRequest,
  now = new Date(),
): DomainResult<SettlementSnapshot> {
  if (snapshot.activeQueueItem) {
    return failure("ACTIVE_QUEUE_EXISTS", "Only one construction queue item is allowed in MVP.");
  }

  if (!(request.buildingType in BUILDING_DEFINITIONS)) {
    return failure("UNKNOWN_BUILDING_TYPE", "This building type is not available.");
  }

  const definition = BUILDING_DEFINITIONS[request.buildingType as Exclude<BuildingType, "camp">];
  const tile = snapshot.tiles.find((candidate) => candidate.tileKey === request.tileKey);

  if (!tile) {
    return failure("TILE_NOT_FOUND", "The requested tile does not exist.");
  }

  if (tile.state !== "cleared") {
    return failure("INVALID_TILE_STATE", "Buildings can only be placed on cleared tiles.");
  }

  if (!hasEnoughResources(snapshot.settlement.balances, definition.buildCost)) {
    return failure("INSUFFICIENT_RESOURCES", "Not enough resources for that building.");
  }

  const startedAt = now.toISOString();
  const completeAt = addMinutes(now, definition.buildDurationMinutes).toISOString();
  const buildingId = makeId("building");
  const queueId = makeId("queue");

  return success({
    ...snapshot,
    settlement: {
      ...snapshot.settlement,
      balances: deductCost(snapshot.settlement.balances, definition.buildCost),
    },
    tiles: snapshot.tiles.map((candidate) =>
      candidate.tileKey === request.tileKey ? { ...candidate, state: "occupied" } : candidate,
    ),
    buildings: [
      ...snapshot.buildings,
      {
        id: buildingId,
        tileKey: request.tileKey,
        buildingType: definition.type,
        level: 1,
        state: "building",
        startedAt,
      },
    ],
    activeQueueItem: {
      id: queueId,
      actionType: "build",
      targetType: "building",
      targetId: buildingId,
      startedAt,
      completeAt,
      payload: {
        buildingType: definition.type,
      },
    },
    completedItems: snapshot.completedItems,
  });
}

export function planUpgrade(
  snapshot: SettlementSnapshot,
  request: UpgradeRequest,
  now = new Date(),
): DomainResult<SettlementSnapshot> {
  if (snapshot.activeQueueItem) {
    return failure("ACTIVE_QUEUE_EXISTS", "Only one construction queue item is allowed in MVP.");
  }

  const building = snapshot.buildings.find((candidate) => candidate.id === request.buildingId);

  if (!building) {
    return failure("BUILDING_NOT_FOUND", "The requested building does not exist.");
  }

  if (building.state !== "complete") {
    return failure("BUILDING_NOT_READY", "Only completed buildings can be upgraded.");
  }

  if (building.buildingType === "camp") {
    return failure("UPGRADE_NOT_SUPPORTED", "The camp cannot be upgraded in MVP.");
  }

  const definition = BUILDING_DEFINITIONS[building.buildingType];

  if (!definition.upgradeCost || !definition.upgradeDurationMinutes) {
    return failure("UPGRADE_NOT_SUPPORTED", "This building has no upgrade path.");
  }

  if (!hasEnoughResources(snapshot.settlement.balances, definition.upgradeCost)) {
    return failure("INSUFFICIENT_RESOURCES", "Not enough resources for that upgrade.");
  }

  const startedAt = now.toISOString();
  const completeAt = addMinutes(now, definition.upgradeDurationMinutes).toISOString();

  return success({
    ...snapshot,
    settlement: {
      ...snapshot.settlement,
      balances: deductCost(snapshot.settlement.balances, definition.upgradeCost),
    },
    buildings: snapshot.buildings.map((candidate) =>
      candidate.id === request.buildingId
        ? {
            ...candidate,
            state: "building",
            startedAt,
            completedAt: undefined,
          }
        : candidate,
    ),
    activeQueueItem: {
      id: makeId("queue"),
      actionType: "upgrade",
      targetType: "building",
      targetId: request.buildingId,
      startedAt,
      completeAt,
      payload: {
        nextLevel: building.level + 1,
      },
    },
    completedItems: snapshot.completedItems,
  });
}

export function planClearTile(
  snapshot: SettlementSnapshot,
  request: ClearTileRequest,
  now = new Date(),
): DomainResult<SettlementSnapshot> {
  if (snapshot.activeQueueItem) {
    return failure("ACTIVE_QUEUE_EXISTS", "Only one construction queue item is allowed in MVP.");
  }

  const tile = snapshot.tiles.find((candidate) => candidate.tileKey === request.tileKey);

  if (!tile) {
    return failure("TILE_NOT_FOUND", "The requested tile does not exist.");
  }

  if (tile.state !== "blocked") {
    return failure("TILE_NOT_BLOCKED", "Only blocked tiles can be cleared.");
  }

  if (!hasEnoughResources(snapshot.settlement.balances, CLEAR_TILE_COST)) {
    return failure("INSUFFICIENT_RESOURCES", "Not enough resources to clear this tile.");
  }

  const startedAt = now.toISOString();
  const completeAt = addMinutes(now, 40).toISOString();

  return success({
    ...snapshot,
    settlement: {
      ...snapshot.settlement,
      balances: deductCost(snapshot.settlement.balances, CLEAR_TILE_COST),
    },
    activeQueueItem: {
      id: makeId("queue"),
      actionType: "clear_tile",
      targetType: "tile",
      targetId: tile.id,
      startedAt,
      completeAt,
    },
    completedItems: snapshot.completedItems,
  });
}

export function resolveQueueItem(
  snapshot: SettlementSnapshot,
  queueItemId: string,
  resolvedAt = new Date(),
): DomainResult<SettlementSnapshot> {
  const queueItem = snapshot.activeQueueItem;

  if (!queueItem || queueItem.id !== queueItemId) {
    return failure("QUEUE_ITEM_NOT_FOUND", "No matching active queue item was found.");
  }

  const completedAt = resolvedAt.toISOString();

  if (queueItem.actionType === "build") {
    return success({
      ...snapshot,
      buildings: snapshot.buildings.map((building) =>
        building.id === queueItem.targetId
          ? {
              ...building,
              state: "complete",
              completedAt,
            }
          : building,
      ),
      activeQueueItem: null,
      completedItems: [
        ...snapshot.completedItems,
        {
          id: makeId("completed"),
          title: "Construction complete",
          completedAt,
        },
      ],
    });
  }

  if (queueItem.actionType === "upgrade") {
    return success({
      ...snapshot,
      buildings: snapshot.buildings.map((building) =>
        building.id === queueItem.targetId
          ? {
              ...building,
              level: Number(queueItem.payload?.nextLevel ?? building.level + 1),
              state: "complete",
              completedAt,
            }
          : building,
      ),
      activeQueueItem: null,
      completedItems: [
        ...snapshot.completedItems,
        {
          id: makeId("completed"),
          title: "Upgrade complete",
          completedAt,
        },
      ],
    });
  }

  return success({
    ...snapshot,
    tiles: snapshot.tiles.map((tile) =>
      tile.id === queueItem.targetId
        ? {
            ...tile,
            state: "cleared",
          }
        : tile,
    ),
    activeQueueItem: null,
    completedItems: [
      ...snapshot.completedItems,
      {
        id: makeId("completed"),
        title: "Tile cleared",
        completedAt,
      },
    ],
  });
}

function success<T>(value: T): DomainSuccess<T> {
  return { ok: true, value };
}

function failure(code: string, message: string): DomainFailure {
  return { ok: false, error: { code, message } };
}

function hasEnoughResources(balances: SettlementBalances, cost: Cost): boolean {
  return balances.supplies >= cost.supplies && balances.stone >= cost.stone;
}

function deductCost(balances: SettlementBalances, cost: Cost): SettlementBalances {
  return {
    supplies: balances.supplies - cost.supplies,
    stone: balances.stone - cost.stone,
  };
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function makeId(_prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  const suffix = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, "0");
  return `00000000-0000-4000-8000-${suffix}${suffix.slice(0, 4)}`;
}
