import { json, readJson } from "../_shared/http.ts";
import {
  ensurePlayerSettlement,
  loadSettlementSnapshot,
} from "../_shared/settlement-store.ts";
import { getActingAuthUserId, getSupabaseAdminClient } from "../_shared/supabase.ts";

interface DemoResetRequest {
  seed?: boolean;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const body = await readJson<DemoResetRequest>(request);
    const client = getSupabaseAdminClient();
    const authUserId = getActingAuthUserId(request);

    const { error } = await client.from("players").delete().eq("auth_user_id", authUserId);

    if (error) {
      throw new Error(error.message);
    }

    if (body.seed === false) {
      return json(200, {
        status: "reset",
        authUserId,
      });
    }

    const context = await ensurePlayerSettlement(client, authUserId);
    const snapshot = await loadSettlementSnapshot(client, context.settlementId);

    return json(200, {
      status: "reset",
      authUserId,
      snapshot,
    });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Failed to reset demo player.",
    });
  }
});
