import { ResolveQueueItemRequest } from "../_shared/contracts.ts";
import { json, readJson } from "../_shared/http.ts";
import { resolveQueueItem } from "../_shared/settlement-domain.ts";
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

  const body = await readJson<ResolveQueueItemRequest>(request);

  if (!body.queueItemId) {
    return json(400, {
      error: "queueItemId is required",
    });
  }

  try {
    const client = getSupabaseAdminClient();
    const authUserId = getActingAuthUserId(request);
    const context = await ensurePlayerSettlement(client, authUserId);
    const snapshot = await loadSettlementSnapshot(client, context.settlementId);
    const resolved = resolveQueueItem(snapshot, body.queueItemId);

    if (!resolved.ok) {
      const rejected = {
        status: "rejected" as const,
        code: resolved.error.code,
        message: resolved.error.message,
      };
      await appendActionLog(
        client,
        context.playerId,
        context.settlementId,
        "resolve_queue_item",
        body,
        rejected,
      );
      return json(200, rejected);
    }

    await persistAcceptedSnapshot(client, snapshot, resolved.value);

    const accepted = {
      status: "accepted" as const,
      message: "Queue item resolved.",
      snapshot: resolved.value,
      transactionRule:
        "construction_queue_items.complete_at/state and buildings.completed_at/state should stay one logical transaction.",
    };
    await appendActionLog(
      client,
      context.playerId,
      context.settlementId,
      "resolve_queue_item",
      body,
      accepted,
    );
    return json(200, accepted);
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Failed to resolve queue item.",
    });
  }
});
