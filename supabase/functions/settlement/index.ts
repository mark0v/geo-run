import { createStarterSettlementSnapshot } from "../_shared/settlement-domain.ts";
import { json } from "../_shared/http.ts";

Deno.serve((request) => {
  if (request.method !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  return json(200, createStarterSettlementSnapshot());
});
