import { ClearTileRequest } from "../_shared/contracts.ts";
import { json, readJson } from "../_shared/http.ts";

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

  return json(200, {
    ok: false,
    function: "actions-clear-tile",
    todo: "Validate tile unlock, balances, and queue before creating clear action.",
    payload: body,
  });
});
