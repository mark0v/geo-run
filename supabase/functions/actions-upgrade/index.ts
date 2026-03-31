import { UpgradeRequest } from "../_shared/contracts.ts";
import { json, readJson } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const body = await readJson<UpgradeRequest>(request);

  if (!body.requestId || !body.buildingId) {
    return json(400, {
      error: "requestId and buildingId are required",
    });
  }

  return json(200, {
    ok: false,
    function: "actions-upgrade",
    todo: "Validate building, next level, balances, and queue before creating upgrade action.",
    payload: body,
  });
});
