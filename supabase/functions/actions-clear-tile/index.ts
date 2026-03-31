interface ClearTileRequest {
  requestId: string;
  tileKey: string;
}

Deno.serve(async (request) => {
  const body = (await request.json()) as ClearTileRequest;

  return Response.json({
    ok: false,
    function: "actions-clear-tile",
    todo: "Validate tile unlock, balances, and queue before creating clear action.",
    payload: body,
  });
});
