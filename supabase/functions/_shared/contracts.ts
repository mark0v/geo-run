export const RESOURCE_RULE_VERSION = "2026-03-31-v1";

export type SourcePlatform = "ios" | "android";

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

export interface ResourceGrant {
  supplies: number;
  stone: number;
  ruleVersion: string;
}

export interface ActivitySyncResponse {
  acceptedWindows: number;
  duplicateWindows: number;
  grants: {
    supplies: number;
    stone: number;
  };
  balances: {
    supplies: number;
    stone: number;
  };
}

export interface BuildRequest {
  requestId: string;
  tileKey: string;
  buildingType: string;
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

export interface SettlementBalances {
  supplies: number;
  stone: number;
}
