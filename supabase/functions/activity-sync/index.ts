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
import {
  appendActionLog,
  ensurePlayerSettlement,
  loadSettlementSnapshot,
} from "../_shared/settlement-store.ts";
import { getActingAuthUserId, getSupabaseAdminClient } from "../_shared/supabase.ts";

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

  try {
    const client = getSupabaseAdminClient();
    const authUserId = getActingAuthUserId(request);
    const context = await ensurePlayerSettlement(client, authUserId);
    const { accepted, duplicates } = dedupeWindows(body.windows);
    const dedupeKeys = accepted.map((window) => window.dedupeKey);
    const existingRowsResult = dedupeKeys.length
      ? await client
          .from("activity_sync_windows")
          .select("dedupe_key")
          .eq("player_id", context.playerId)
          .in("dedupe_key", dedupeKeys)
      : { data: [], error: null };

    if (existingRowsResult.error) {
      throw new Error(existingRowsResult.error.message);
    }

    const existingKeys = new Set((existingRowsResult.data ?? []).map((row) => row.dedupe_key as string));
    const newWindows = accepted.filter((window) => !existingKeys.has(window.dedupeKey));
    const serverDuplicates = accepted.length - newWindows.length;
    const insertedWindowsResult = newWindows.length
      ? await client
          .from("activity_sync_windows")
          .insert(
            newWindows.map((window) => ({
              player_id: context.playerId,
              source_platform: window.sourcePlatform,
              source_device_id: window.sourceDeviceId ?? null,
              window_start: window.windowStart,
              window_end: window.windowEnd,
              step_count: window.steps,
              floor_count: window.floors ?? 0,
              client_checkpoint: body.clientCheckpoint ?? null,
              dedupe_key: window.dedupeKey,
              raw_payload: window,
            })),
          )
          .select("id, dedupe_key")
      : { data: [], error: null };

    if (insertedWindowsResult.error) {
      throw new Error(insertedWindowsResult.error.message);
    }

    const insertedRows = insertedWindowsResult.data ?? [];
    const grantRows = newWindows.map((window) => {
      const grant = grantForWindow(window);
      const insertedWindow = insertedRows.find((row) => row.dedupe_key === window.dedupeKey);

      return {
        player_id: context.playerId,
        settlement_id: context.settlementId,
        grant_type: "activity_sync",
        supplies: grant.supplies,
        stone: grant.stone,
        rule_version: grant.ruleVersion,
        activity_sync_window_id: insertedWindow?.id ?? null,
        grant_date: window.windowStart.slice(0, 10),
      };
    });

    if (grantRows.length > 0) {
      const grantsInsertResult = await client.from("resource_grants").insert(grantRows);
      if (grantsInsertResult.error) {
        throw new Error(grantsInsertResult.error.message);
      }
    }

    const totals = sumGrants(newWindows.map(grantForWindow));
    const currentSnapshot = await loadSettlementSnapshot(client, context.settlementId);
    const nextBalances = {
      supplies: currentSnapshot.settlement.balances.supplies + totals.supplies,
      stone: currentSnapshot.settlement.balances.stone + totals.stone,
    };

    const settlementUpdateResult = await client
      .from("settlements")
      .update({
        supplies_balance: nextBalances.supplies,
        stone_balance: nextBalances.stone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.settlementId);

    if (settlementUpdateResult.error) {
      throw new Error(settlementUpdateResult.error.message);
    }

    const snapshot = await loadSettlementSnapshot(client, context.settlementId);
    const response: ActivitySyncResponse = {
      acceptedWindows: newWindows.length,
      duplicateWindows: duplicates.length + serverDuplicates,
      grants: totals,
      balances: snapshot.settlement.balances,
      snapshot,
    };

    await appendActionLog(client, context.playerId, context.settlementId, "activity_sync", body, {
      status: "accepted",
      acceptedWindows: response.acceptedWindows,
      duplicateWindows: response.duplicateWindows,
      grants: response.grants,
      balances: response.balances,
    });

    return json(200, response);
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Failed to sync activity.",
    });
  }
});
