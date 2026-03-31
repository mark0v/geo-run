interface UpgradeRequest {
  requestId: string;
  buildingId: string;
}

Deno.serve(async (request) => {
  const body = (await request.json()) as UpgradeRequest;

  return Response.json({
    ok: false,
    function: "actions-upgrade",
    todo: "Validate building, next level, balances, and queue before creating upgrade action.",
    payload: body,
  });
});
