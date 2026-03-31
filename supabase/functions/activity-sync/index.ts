interface ActivitySyncWindow {
  windowStart: string;
  windowEnd: string;
  steps: number;
  floors?: number;
  sourcePlatform: "ios" | "android";
  sourceDeviceId?: string;
  dedupeKey: string;
}

interface ActivitySyncRequest {
  windows: ActivitySyncWindow[];
  clientCheckpoint?: string;
}

Deno.serve(async (request) => {
  const body = (await request.json()) as ActivitySyncRequest;

  return Response.json({
    ok: false,
    function: "activity-sync",
    todo: "Validate, dedupe, grant resources, update balances transactionally.",
    receivedWindows: body.windows.length,
  });
});
