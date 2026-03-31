import { describe, expect, test } from "bun:test";
import {
  createStarterSettlementSnapshot,
  planBuild,
  planClearTile,
  planUpgrade,
  resolveQueueItem,
} from "../supabase/functions/_shared/settlement-domain.ts";

describe("settlement domain", () => {
  test("planBuild deducts resources and creates an active queue item", () => {
    const snapshot = createStarterSettlementSnapshot();
    const result = planBuild(
      snapshot,
      {
        requestId: "build-1",
        tileKey: "1,0",
        buildingType: "workshop",
      },
      new Date("2026-03-31T10:00:00Z"),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.settlement.balances.supplies).toBe(80);
    expect(result.value.activeQueueItem?.actionType).toBe("build");
    expect(result.value.buildings.some((building) => building.buildingType === "workshop")).toBe(true);
  });

  test("planBuild rejects if a queue item is already active", () => {
    const starter = createStarterSettlementSnapshot();
    const first = planBuild(starter, {
      requestId: "build-1",
      tileKey: "1,0",
      buildingType: "workshop",
    });

    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = planClearTile(first.value, {
      requestId: "clear-1",
      tileKey: "0,1",
    });

    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe("ACTIVE_QUEUE_EXISTS");
  });

  test("resolveQueueItem completes a building", () => {
    const planned = planBuild(createStarterSettlementSnapshot(), {
      requestId: "build-1",
      tileKey: "1,0",
      buildingType: "workshop",
    });

    expect(planned.ok).toBe(true);
    if (!planned.ok) return;

    const queueId = planned.value.activeQueueItem?.id;
    expect(queueId).toBeDefined();

    const resolved = resolveQueueItem(planned.value, queueId!, new Date("2026-03-31T11:00:00Z"));
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    expect(resolved.value.activeQueueItem).toBeNull();
    expect(resolved.value.buildings.find((building) => building.buildingType === "workshop")?.state).toBe(
      "complete",
    );
  });

  test("planUpgrade upgrades completed buildings only", () => {
    const snapshot = createStarterSettlementSnapshot();
    const built = planBuild(snapshot, {
      requestId: "build-1",
      tileKey: "1,0",
      buildingType: "workshop",
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const resolved = resolveQueueItem(built.value, built.value.activeQueueItem!.id);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    const workshop = resolved.value.buildings.find((building) => building.buildingType === "workshop");
    expect(workshop).toBeDefined();

    const upgraded = planUpgrade(resolved.value, {
      requestId: "upgrade-1",
      buildingId: workshop!.id,
    });
    expect(upgraded.ok).toBe(true);
  });
});
