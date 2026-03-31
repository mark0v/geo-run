import { BuildRequest } from "../_shared/contracts.ts";
import { json, readJson } from "../_shared/http.ts";

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

  return json(200, {
    ok: false,
    function: "actions-build",
    todo: "Validate tile, balances, and active queue. Deduct resources and create queue item transactionally.",
    payload: body,
  });
});
