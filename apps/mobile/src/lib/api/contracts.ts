export type BuildingType = "camp" | "workshop" | "hut" | "well" | "storehouse" | "watchtower";
export type QueueActionType = "build" | "upgrade" | "clear_tile";
export type SourcePlatform = "ios" | "android";

export interface SettlementBalances {
  supplies: number;
  stone: number;
}

export interface SettlementTile {
  id: string;
  tileKey: string;
  terrainType: string;
  state: "hidden" | "blocked" | "cleared" | "occupied";
}

export interface SettlementBuilding {
  id: string;
  tileKey: string;
  buildingType: BuildingType;
  level: number;
  state: "planned" | "building" | "complete";
  startedAt?: string;
  completedAt?: string;
}

export interface ConstructionQueueItem {
  id: string;
  actionType: QueueActionType;
  targetType: "building" | "tile";
  targetId: string;
  startedAt: string;
  completeAt: string;
}

export interface CompletedItem {
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
  tiles: SettlementTile[];
  buildings: SettlementBuilding[];
  activeQueueItem: ConstructionQueueItem | null;
  completedItems: CompletedItem[];
}

export interface ActivitySyncWindowInput {
  windowStart: string;
  windowEnd: string;
  steps: number;
  floors?: number;
  sourcePlatform: SourcePlatform;
  sourceDeviceId?: string;
  dedupeKey: string;
}

export interface ActivitySyncRequest {
  windows: ActivitySyncWindowInput[];
  clientCheckpoint?: string;
}

export interface ActivitySyncResponse {
  acceptedWindows: number;
  duplicateWindows: number;
  grants: SettlementBalances;
  balances: SettlementBalances;
  snapshot: SettlementSnapshot;
}

export interface BuildRequest {
  requestId: string;
  tileKey: string;
  buildingType: Exclude<BuildingType, "camp">;
}

export interface UpgradeRequest {
  requestId: string;
  buildingId: string;
}

export interface ClearTileRequest {
  requestId: string;
  tileKey: string;
}

export interface ResolveQueueItemRequest {
  queueItemId: string;
}

export interface SettlementActionAcceptedResponse {
  status: "accepted";
  message: string;
  snapshot: SettlementSnapshot;
}

export interface SettlementActionRejectedResponse {
  status: "rejected";
  code: string;
  message: string;
}

export type SettlementActionResponse =
  | SettlementActionAcceptedResponse
  | SettlementActionRejectedResponse;
