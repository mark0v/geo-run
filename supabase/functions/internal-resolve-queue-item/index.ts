import { ResolveQueueItemRequest } from "../_shared/contracts.ts";
import { json, readJson } from "../_shared/http.ts";

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

  return json(200, {
    ok: false,
    function: "internal-resolve-queue-item",
    todo: "Resolve queue row and target building/tile state in one transaction.",
    transactionRule:
      "construction_queue_items.complete_at/state and buildings.completed_at/state must resolve atomically.",
    payload: body,
  });
});
