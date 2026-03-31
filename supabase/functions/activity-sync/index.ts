import {
  ActivitySyncRequest,
  ActivitySyncResponse,
} from "../_shared/contracts.ts";
import {
  dedupeWindows,
  grantForWindow,
  sumGrants,
  validateWindow,
} from "../_shared/activity-rules.ts";
import { json, readJson } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const body = await readJson<ActivitySyncRequest>(request);

  if (!Array.isArray(body.windows) || body.windows.length === 0) {
    return json(400, { error: "windows must be a non-empty array" });
  }

  const validationProblems = body.windows.flatMap((window, index) =>
    validateWindow(window).map((problem) => `windows[${index}]: ${problem}`),
  );

  if (validationProblems.length > 0) {
    return json(400, { error: "invalid activity sync payload", details: validationProblems });
  }

  const { accepted, duplicates } = dedupeWindows(body.windows);
  const grants = accepted.map(grantForWindow);
  const balances = sumGrants(grants);

  const response: ActivitySyncResponse = {
    acceptedWindows: accepted.length,
    duplicateWindows: duplicates.length,
    grants: balances,
    balances,
  };

  return json(200, {
    ...response,
    note: "Prototype response only. Next step is transactional persistence in Postgres.",
  });
});
