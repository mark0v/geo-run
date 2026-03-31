import { ClearTileRequest } from "../_shared/contracts.ts";
import { json, readJson } from "../_shared/http.ts";
import { planClearTile } from "../_shared/settlement-domain.ts";
import {
  appendActionLog,
  ensurePlayerSettlement,
  loadSettlementSnapshot,
  persistAcceptedSnapshot,
} from "../_shared/settlement-store.ts";
import { getActingAuthUserId, getSupabaseAdminClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const body = await readJson<ClearTileRequest>(request);

  if (!body.requestId || !body.tileKey) {
    return json(400, {
      error: "requestId and tileKey are required",
    });
  }

  try {
    const client = getSupabaseAdminClient();
    const authUserId = getActingAuthUserId(request);
    const context = await ensurePlayerSettlement(client, authUserId);
    const snapshot = await loadSettlementSnapshot(client, context.settlementId);
    const planned = planClearTile(snapshot, body);

    if (!planned.ok) {
      const rejected = {
        status: "rejected" as const,
        code: planned.error.code,
        message: planned.error.message,
      };
      await appendActionLog(client, context.playerId, context.settlementId, "clear_tile", body, rejected);
      return json(200, rejected);
    }

    await persistAcceptedSnapshot(client, snapshot, planned.value);

    const accepted = {
      status: "accepted" as const,
      message: `Tile ${body.tileKey} clearing started.`,
      snapshot: planned.value,
    };
    await appendActionLog(client, context.playerId, context.settlementId, "clear_tile", body, accepted);
    return json(200, accepted);
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Failed to start tile clearing.",
    });
  }
});
