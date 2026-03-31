interface BuildRequest {
  requestId: string;
  tileKey: string;
  buildingType: string;
}

Deno.serve(async (request) => {
  const body = (await request.json()) as BuildRequest;

  return Response.json({
    ok: false,
    function: "actions-build",
    todo: "Validate tile, balances, and active queue. Deduct resources and create queue item transactionally.",
    payload: body,
  });
});
