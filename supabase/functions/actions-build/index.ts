import { BuildRequest } from "../_shared/contracts.ts";
import { json, readJson } from "../_shared/http.ts";
import { planBuild } from "../_shared/settlement-domain.ts";
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

  const body = await readJson<BuildRequest>(request);

  if (!body.requestId || !body.tileKey || !body.buildingType) {
    return json(400, {
      error: "requestId, tileKey, and buildingType are required",
    });
  }

  try {
    const client = getSupabaseAdminClient();
    const authUserId = getActingAuthUserId(request);
    const context = await ensurePlayerSettlement(client, authUserId);
    const snapshot = await loadSettlementSnapshot(client, context.settlementId);
    const planned = planBuild(snapshot, body);

    if (!planned.ok) {
      const rejected = {
        status: "rejected" as const,
        code: planned.error.code,
        message: planned.error.message,
      };
      await appendActionLog(client, context.playerId, context.settlementId, "build", body, rejected);
      return json(200, rejected);
    }

    await persistAcceptedSnapshot(client, snapshot, planned.value);

    const accepted = {
      status: "accepted" as const,
      message: `${body.buildingType} construction started.`,
      snapshot: planned.value,
    };
    await appendActionLog(client, context.playerId, context.settlementId, "build", body, accepted);
    return json(200, accepted);
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Failed to start construction.",
    });
  }
});
