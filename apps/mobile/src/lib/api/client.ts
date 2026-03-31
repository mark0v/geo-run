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
import {
  getMockSettlementSnapshot,
  resolveMockQueueItem,
  startMockBuild,
  startMockClearTile,
  startMockUpgrade,
  syncMockActivity,
} from "./mockServer";

const USE_MOCK_API = true;
const ACTIVITY_SYNC_ENDPOINT = "http://localhost:54321/functions/v1/activity-sync";
const SETTLEMENT_ENDPOINT = "http://localhost:54321/functions/v1/settlement";
const BUILD_ENDPOINT = "http://localhost:54321/functions/v1/actions-build";
const UPGRADE_ENDPOINT = "http://localhost:54321/functions/v1/actions-upgrade";
const CLEAR_TILE_ENDPOINT = "http://localhost:54321/functions/v1/actions-clear-tile";
const RESOLVE_QUEUE_ENDPOINT = "http://localhost:54321/functions/v1/internal-resolve-queue-item";

export async function fetchSettlementSnapshot(): Promise<SettlementSnapshot> {
  if (USE_MOCK_API) {
    return getMockSettlementSnapshot();
  }

  const response = await fetch(SETTLEMENT_ENDPOINT);

  if (!response.ok) {
    throw new Error(`Failed to load settlement snapshot: ${response.status}`);
  }

  return (await response.json()) as SettlementSnapshot;
}

export async function syncActivity(request: ActivitySyncRequest): Promise<ActivitySyncResponse> {
  if (USE_MOCK_API) {
    return syncMockActivity(request);
  }

  return postJson<ActivitySyncRequest, ActivitySyncResponse>(ACTIVITY_SYNC_ENDPOINT, request);
}

export async function startBuild(request: BuildRequest): Promise<SettlementActionResponse> {
  if (USE_MOCK_API) {
    return startMockBuild(request);
  }

  return postJson<BuildRequest, SettlementActionResponse>(BUILD_ENDPOINT, request);
}

export async function startUpgrade(request: UpgradeRequest): Promise<SettlementActionResponse> {
  if (USE_MOCK_API) {
    return startMockUpgrade(request);
  }

  return postJson<UpgradeRequest, SettlementActionResponse>(UPGRADE_ENDPOINT, request);
}

export async function startClearTile(request: ClearTileRequest): Promise<SettlementActionResponse> {
  if (USE_MOCK_API) {
    return startMockClearTile(request);
  }

  return postJson<ClearTileRequest, SettlementActionResponse>(CLEAR_TILE_ENDPOINT, request);
}

export async function resolveQueueItem(
  request: ResolveQueueItemRequest,
): Promise<SettlementActionResponse> {
  if (USE_MOCK_API) {
    return resolveMockQueueItem(request);
  }

  return postJson<ResolveQueueItemRequest, SettlementActionResponse>(RESOLVE_QUEUE_ENDPOINT, request);
}

async function postJson<TRequest, TResponse>(url: string, payload: TRequest): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as TResponse;
}
