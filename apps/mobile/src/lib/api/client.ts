import type {
  ActivitySyncRequest,
  ActivitySyncResponse,
  BuildRequest,
  ClearTileRequest,
  ResolveQueueItemRequest,
  SettlementActionResponse,
  SettlementSnapshot,
  UpgradeRequest,
} from "./contracts";
import { apiRuntimeConfig } from "../config/runtime";
import {
  getMockSettlementSnapshot,
  resolveMockQueueItem,
  startMockBuild,
  startMockClearTile,
  startMockUpgrade,
  syncMockActivity,
} from "./mockServer";

const ACTIVITY_SYNC_ENDPOINT = `${apiRuntimeConfig.functionsBaseUrl}/activity-sync`;
const SETTLEMENT_ENDPOINT = `${apiRuntimeConfig.functionsBaseUrl}/settlement`;
const BUILD_ENDPOINT = `${apiRuntimeConfig.functionsBaseUrl}/actions-build`;
const UPGRADE_ENDPOINT = `${apiRuntimeConfig.functionsBaseUrl}/actions-upgrade`;
const CLEAR_TILE_ENDPOINT = `${apiRuntimeConfig.functionsBaseUrl}/actions-clear-tile`;
const RESOLVE_QUEUE_ENDPOINT = `${apiRuntimeConfig.functionsBaseUrl}/internal-resolve-queue-item`;

export async function fetchSettlementSnapshot(): Promise<SettlementSnapshot> {
  if (apiRuntimeConfig.useMockApi) {
    return getMockSettlementSnapshot();
  }

  const response = await fetch(SETTLEMENT_ENDPOINT, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to load settlement snapshot: ${response.status}`);
  }

  return (await response.json()) as SettlementSnapshot;
}

export async function syncActivity(request: ActivitySyncRequest): Promise<ActivitySyncResponse> {
  if (apiRuntimeConfig.useMockApi) {
    return syncMockActivity(request);
  }

  return postJson<ActivitySyncRequest, ActivitySyncResponse>(ACTIVITY_SYNC_ENDPOINT, request);
}

export async function startBuild(request: BuildRequest): Promise<SettlementActionResponse> {
  if (apiRuntimeConfig.useMockApi) {
    return startMockBuild(request);
  }

  return postJson<BuildRequest, SettlementActionResponse>(BUILD_ENDPOINT, request);
}

export async function startUpgrade(request: UpgradeRequest): Promise<SettlementActionResponse> {
  if (apiRuntimeConfig.useMockApi) {
    return startMockUpgrade(request);
  }

  return postJson<UpgradeRequest, SettlementActionResponse>(UPGRADE_ENDPOINT, request);
}

export async function startClearTile(request: ClearTileRequest): Promise<SettlementActionResponse> {
  if (apiRuntimeConfig.useMockApi) {
    return startMockClearTile(request);
  }

  return postJson<ClearTileRequest, SettlementActionResponse>(CLEAR_TILE_ENDPOINT, request);
}

export async function resolveQueueItem(
  request: ResolveQueueItemRequest,
): Promise<SettlementActionResponse> {
  if (apiRuntimeConfig.useMockApi) {
    return resolveMockQueueItem(request);
  }

  return postJson<ResolveQueueItemRequest, SettlementActionResponse>(RESOLVE_QUEUE_ENDPOINT, request);
}

async function postJson<TRequest, TResponse>(url: string, payload: TRequest): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

function authHeaders(): Record<string, string> {
  if (apiRuntimeConfig.useMockApi) {
    return {
      "x-player-auth-user-id": apiRuntimeConfig.demoAuthUserId,
    };
  }

  return {
    Authorization: `Bearer ${apiRuntimeConfig.supabaseAnonKey}`,
    apikey: apiRuntimeConfig.supabaseAnonKey,
    "x-player-auth-user-id": apiRuntimeConfig.demoAuthUserId,
  };
}
