import { json } from "../_shared/http.ts";
import { loadSettlementSnapshotForAuthUser } from "../_shared/settlement-store.ts";
import { getActingAuthUserId, getSupabaseAdminClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const client = getSupabaseAdminClient();
    const authUserId = getActingAuthUserId(request);
    const snapshot = await loadSettlementSnapshotForAuthUser(client, authUserId);

    return json(200, snapshot);
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Failed to load settlement snapshot.",
    });
  }
});
