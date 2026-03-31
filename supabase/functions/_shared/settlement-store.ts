import type {
  SettlementActionAcceptedResponse,
  SettlementActionRejectedResponse,
  SettlementSnapshot,
} from "./contracts.ts";
import type { SupabaseAdminClient } from "./supabase.ts";

interface PlayerRow {
  id: string;
  auth_user_id: string;
  timezone: string;
}

interface SettlementRow {
  id: string;
  player_id: string;
  name: string | null;
  milestone_level: number;
  supplies_balance: number;
  stone_balance: number;
}

interface TileRow {
  id: string;
  settlement_id: string;
  tile_key: string;
  terrain_type: string;
  state: "hidden" | "blocked" | "cleared" | "occupied";
  building_id: string | null;
  created_at?: string;
}

interface BuildingRow {
  id: string;
  settlement_id: string;
  tile_id: string;
  building_type: string;
  level: number;
  state: "planned" | "building" | "complete";
  started_at: string | null;
  completed_at: string | null;
  created_at?: string;
}

interface QueueRow {
  id: string;
  settlement_id: string;
  action_type: "build" | "upgrade" | "clear_tile";
  target_type: "building" | "tile";
  target_id: string | null;
  payload: Record<string, unknown> | null;
  state: "active" | "resolved" | "cancelled";
  started_at: string;
  complete_at: string;
  resolved_at: string | null;
  created_at?: string;
}

export interface PlayerSettlementContext {
  playerId: string;
  settlementId: string;
}

const STARTER_SETTLEMENT_NAME = "New Haven";
const STARTER_BALANCES = {
  supplies: 120,
  stone: 6,
};

const STARTER_TILES = [
  {
    tile_key: "0,0",
    terrain_type: "plains",
    state: "occupied",
  },
  {
    tile_key: "1,0",
    terrain_type: "plains",
    state: "cleared",
  },
  {
    tile_key: "0,1",
    terrain_type: "forest-edge",
    state: "blocked",
  },
  {
    tile_key: "1,1",
    terrain_type: "hill",
    state: "hidden",
  },
] as const;

export async function ensurePlayerSettlement(
  client: SupabaseAdminClient,
  authUserId: string,
): Promise<PlayerSettlementContext> {
  const player = await upsertPlayer(client, authUserId);
  const settlement = await upsertSettlement(client, player.id);
  await ensureStarterTiles(client, settlement.id);
  await ensureStarterCamp(client, settlement.id);

  return {
    playerId: player.id,
    settlementId: settlement.id,
  };
}

export async function loadSettlementSnapshotForAuthUser(
  client: SupabaseAdminClient,
  authUserId: string,
): Promise<SettlementSnapshot> {
  const context = await ensurePlayerSettlement(client, authUserId);
  return loadSettlementSnapshot(client, context.settlementId);
}

export async function loadSettlementSnapshot(
  client: SupabaseAdminClient,
  settlementId: string,
): Promise<SettlementSnapshot> {
  const settlement = await requireSingle<SettlementRow>(
    client.from("settlements").select("*").eq("id", settlementId).single(),
    "Failed to load settlement.",
  );
  const tiles = await requireMany<TileRow>(
    client.from("tiles").select("*").eq("settlement_id", settlementId).order("tile_key"),
    "Failed to load settlement tiles.",
  );
  const buildings = await requireMany<BuildingRow>(
    client.from("buildings").select("*").eq("settlement_id", settlementId).order("created_at"),
    "Failed to load settlement buildings.",
  );
  const activeQueueItem = await requireMaybeSingle<QueueRow>(
    client
      .from("construction_queue_items")
      .select("*")
      .eq("settlement_id", settlementId)
      .eq("state", "active")
      .maybeSingle(),
    "Failed to load active queue item.",
  );
  const completedQueueItems = await requireMany<QueueRow>(
    client
      .from("construction_queue_items")
      .select("*")
      .eq("settlement_id", settlementId)
      .eq("state", "resolved")
      .order("resolved_at", { ascending: false })
      .limit(5),
    "Failed to load settlement history.",
  );

  return {
    settlement: {
      id: settlement.id,
      name: settlement.name ?? STARTER_SETTLEMENT_NAME,
      milestoneLevel: settlement.milestone_level,
      balances: {
        supplies: settlement.supplies_balance,
        stone: settlement.stone_balance,
      },
    },
    tiles: tiles.map((tile) => ({
      id: tile.id,
      tileKey: tile.tile_key,
      terrainType: tile.terrain_type,
      state: tile.state,
    })),
    buildings: buildings.map((building) => ({
      id: building.id,
      tileKey: tiles.find((tile) => tile.id === building.tile_id)?.tile_key ?? "unknown",
      buildingType: building.building_type as SettlementSnapshot["buildings"][number]["buildingType"],
      level: building.level,
      state: building.state,
      startedAt: building.started_at ?? undefined,
      completedAt: building.completed_at ?? undefined,
    })),
    activeQueueItem: activeQueueItem
      ? {
          id: activeQueueItem.id,
          actionType: activeQueueItem.action_type,
          targetType: activeQueueItem.target_type,
          targetId: activeQueueItem.target_id ?? "",
          startedAt: activeQueueItem.started_at,
          completeAt: activeQueueItem.complete_at,
        }
      : null,
    completedItems: completedQueueItems.map((item) => ({
      id: item.id,
      title: completionTitle(item.action_type),
      completedAt: item.resolved_at ?? item.complete_at,
    })),
  };
}

export async function persistAcceptedSnapshot(
  client: SupabaseAdminClient,
  previousSnapshot: SettlementSnapshot,
  nextSnapshot: SettlementSnapshot,
): Promise<void> {
  await requireNoData(
    client
      .from("settlements")
      .update({
        name: nextSnapshot.settlement.name,
        milestone_level: nextSnapshot.settlement.milestoneLevel,
        supplies_balance: nextSnapshot.settlement.balances.supplies,
        stone_balance: nextSnapshot.settlement.balances.stone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", nextSnapshot.settlement.id),
    "Failed to update settlement balances.",
  );

  await persistTileDiffs(client, previousSnapshot, nextSnapshot);
  await persistBuildingDiffs(client, previousSnapshot, nextSnapshot);
  await persistQueueDiff(client, previousSnapshot, nextSnapshot);
}

export async function appendActionLog(
  client: SupabaseAdminClient,
  playerId: string,
  settlementId: string,
  actionType: string,
  requestPayload: unknown,
  result:
    | SettlementActionAcceptedResponse
    | SettlementActionRejectedResponse
    | { status: "accepted" | "rejected"; [key: string]: unknown },
): Promise<void> {
  const requestId =
    typeof requestPayload === "object" &&
    requestPayload !== null &&
    "requestId" in requestPayload &&
    typeof requestPayload.requestId === "string"
      ? requestPayload.requestId
      : null;

  await requireNoData(
    client.from("player_action_log").insert({
      player_id: playerId,
      settlement_id: settlementId,
      action_type: actionType,
      request_id: requestId,
      request_payload: requestPayload,
      result_status: result.status,
      result_payload: result,
    }),
    "Failed to append action log.",
  );
}

function completionTitle(actionType: QueueRow["action_type"]): string {
  return {
    build: "Construction complete",
    upgrade: "Upgrade complete",
    clear_tile: "Tile cleared",
  }[actionType];
}

async function upsertPlayer(
  client: SupabaseAdminClient,
  authUserId: string,
): Promise<PlayerRow> {
  return requireSingle<PlayerRow>(
    client
      .from("players")
      .upsert(
        {
          auth_user_id: authUserId,
          timezone: "Europe/Kiev",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "auth_user_id" },
      )
      .select("*")
      .single(),
    "Failed to create or fetch player.",
  );
}

async function upsertSettlement(
  client: SupabaseAdminClient,
  playerId: string,
): Promise<SettlementRow> {
  const existing = await requireMaybeSingle<SettlementRow>(
    client
      .from("settlements")
      .select("*")
      .eq("player_id", playerId)
      .maybeSingle(),
    "Failed to inspect existing settlement.",
  );

  if (existing) {
    return existing;
  }

  return requireSingle<SettlementRow>(
    client
      .from("settlements")
      .insert({
        player_id: playerId,
        name: STARTER_SETTLEMENT_NAME,
        milestone_level: 1,
        supplies_balance: STARTER_BALANCES.supplies,
        stone_balance: STARTER_BALANCES.stone,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single(),
    "Failed to create or fetch settlement.",
  );
}

async function ensureStarterTiles(
  client: SupabaseAdminClient,
  settlementId: string,
): Promise<void> {
  const existingTiles = await requireMany<TileRow>(
    client.from("tiles").select("*").eq("settlement_id", settlementId),
    "Failed to inspect starter tiles.",
  );

  if (existingTiles.length > 0) {
    return;
  }

  await requireNoData(
    client.from("tiles").insert(
      STARTER_TILES.map((tile) => ({
        settlement_id: settlementId,
        ...tile,
      })),
    ),
    "Failed to seed starter tiles.",
  );
}

async function ensureStarterCamp(
  client: SupabaseAdminClient,
  settlementId: string,
): Promise<void> {
  const existingBuildings = await requireMany<BuildingRow>(
    client.from("buildings").select("*").eq("settlement_id", settlementId),
    "Failed to inspect starter buildings.",
  );

  if (existingBuildings.length > 0) {
    return;
  }

  const occupiedTile = await requireSingle<TileRow>(
    client
      .from("tiles")
      .select("*")
      .eq("settlement_id", settlementId)
      .eq("tile_key", "0,0")
      .single(),
    "Failed to find the starter camp tile.",
  );

  const camp = await requireSingle<Pick<BuildingRow, "id">>(
    client
      .from("buildings")
      .insert({
        settlement_id: settlementId,
        tile_id: occupiedTile.id,
        building_type: "camp",
        level: 1,
        state: "complete",
        completed_at: new Date("2026-03-31T08:00:00Z").toISOString(),
      })
      .select("id")
      .single(),
    "Failed to seed starter camp.",
  );

  await requireNoData(
    client
      .from("tiles")
      .update({
        building_id: camp.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", occupiedTile.id),
    "Failed to attach starter camp to occupied tile.",
  );
}

async function persistTileDiffs(
  client: SupabaseAdminClient,
  previousSnapshot: SettlementSnapshot,
  nextSnapshot: SettlementSnapshot,
): Promise<void> {
  for (const nextTile of nextSnapshot.tiles) {
    const previousTile = previousSnapshot.tiles.find((candidate) => candidate.id === nextTile.id);
    if (!previousTile) {
      continue;
    }

    if (previousTile.state === nextTile.state) {
      continue;
    }

    const buildingOnTile = nextSnapshot.buildings.find((building) => building.tileKey === nextTile.tileKey);

    await requireNoData(
      client
        .from("tiles")
        .update({
          state: nextTile.state,
          building_id: buildingOnTile?.id ?? null,
          cleared_at: nextTile.state === "cleared" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", nextTile.id),
      `Failed to update tile ${nextTile.id}.`,
    );
  }
}

async function persistBuildingDiffs(
  client: SupabaseAdminClient,
  previousSnapshot: SettlementSnapshot,
  nextSnapshot: SettlementSnapshot,
): Promise<void> {
  for (const nextBuilding of nextSnapshot.buildings) {
    const previousBuilding = previousSnapshot.buildings.find(
      (candidate) => candidate.id === nextBuilding.id,
    );

    if (!previousBuilding) {
      const tile = nextSnapshot.tiles.find((candidate) => candidate.tileKey === nextBuilding.tileKey);
      if (!tile) {
        throw new Error(`Missing tile for building ${nextBuilding.id}.`);
      }

      await requireNoData(
        client.from("buildings").insert({
          id: nextBuilding.id,
          settlement_id: nextSnapshot.settlement.id,
          tile_id: tile.id,
          building_type: nextBuilding.buildingType,
          level: nextBuilding.level,
          state: nextBuilding.state,
          started_at: nextBuilding.startedAt ?? null,
          completed_at: nextBuilding.completedAt ?? null,
        }),
        `Failed to insert building ${nextBuilding.id}.`,
      );

      await requireNoData(
        client
          .from("tiles")
          .update({
            building_id: nextBuilding.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tile.id),
        `Failed to attach building ${nextBuilding.id} to tile ${tile.id}.`,
      );

      continue;
    }

    if (
      previousBuilding.level === nextBuilding.level &&
      previousBuilding.state === nextBuilding.state &&
      previousBuilding.startedAt === nextBuilding.startedAt &&
      previousBuilding.completedAt === nextBuilding.completedAt
    ) {
      continue;
    }

    await requireNoData(
      client
        .from("buildings")
        .update({
          level: nextBuilding.level,
          state: nextBuilding.state,
          started_at: nextBuilding.startedAt ?? null,
          completed_at: nextBuilding.completedAt ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", nextBuilding.id),
      `Failed to update building ${nextBuilding.id}.`,
    );
  }
}

async function persistQueueDiff(
  client: SupabaseAdminClient,
  previousSnapshot: SettlementSnapshot,
  nextSnapshot: SettlementSnapshot,
): Promise<void> {
  const previousQueue = previousSnapshot.activeQueueItem;
  const nextQueue = nextSnapshot.activeQueueItem;

  if (!previousQueue && nextQueue) {
    await requireNoData(
      client.from("construction_queue_items").insert({
        id: nextQueue.id,
        settlement_id: nextSnapshot.settlement.id,
        action_type: nextQueue.actionType,
        target_type: nextQueue.targetType,
        target_id: nextQueue.targetId,
        payload: {},
        state: "active",
        started_at: nextQueue.startedAt,
        complete_at: nextQueue.completeAt,
      }),
      `Failed to create queue item ${nextQueue.id}.`,
    );
    return;
  }

  if (previousQueue && !nextQueue) {
    const completion = nextSnapshot.completedItems[0];

    await requireNoData(
      client
        .from("construction_queue_items")
        .update({
          state: "resolved",
          resolved_at: completion?.completedAt ?? new Date().toISOString(),
        })
        .eq("id", previousQueue.id),
      `Failed to resolve queue item ${previousQueue.id}.`,
    );
  }
}

async function requireSingle<T>(
  promise: PromiseLike<{ data: T | null; error: { message: string } | null }>,
  fallbackMessage: string,
): Promise<T> {
  const { data, error } = await promise;
  if (error || !data) {
    throw new Error(error?.message ?? fallbackMessage);
  }

  return data;
}

async function requireMaybeSingle<T>(
  promise: PromiseLike<{ data: T | null; error: { message: string } | null }>,
  fallbackMessage: string,
): Promise<T | null> {
  const { data, error } = await promise;
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }

  return data;
}

async function requireMany<T>(
  promise: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  fallbackMessage: string,
): Promise<T[]> {
  const { data, error } = await promise;
  if (error || !data) {
    throw new Error(error?.message ?? fallbackMessage);
  }

  return data;
}

async function requireNoData(
  promise: PromiseLike<{ error: { message: string } | null }>,
  fallbackMessage: string,
): Promise<void> {
  const { error } = await promise;
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}
