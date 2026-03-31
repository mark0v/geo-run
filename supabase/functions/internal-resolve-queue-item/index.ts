interface ResolveQueueItemRequest {
  queueItemId: string;
}

Deno.serve(async (request) => {
  const body = (await request.json()) as ResolveQueueItemRequest;

  return Response.json({
    ok: false,
    function: "internal-resolve-queue-item",
    todo: "Resolve queue row and target building/tile state in one transaction.",
    payload: body,
  });
});
