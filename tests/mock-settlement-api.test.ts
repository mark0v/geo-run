import { beforeEach, describe, expect, test } from "bun:test";
import {
  getMockSettlementSnapshot,
  resetMockSettlementState,
  resolveMockQueueItem,
  startMockBuild,
  startMockUpgrade,
  syncMockActivity,
} from "../apps/mobile/src/lib/api/mockServer";

describe("mock settlement api", () => {
  beforeEach(() => {
    resetMockSettlementState();
  });

  test("build then resolve updates the visible snapshot", async () => {
    const build = await startMockBuild({
      requestId: "build-1",
      tileKey: "1,0",
      buildingType: "workshop",
    });

    expect(build.status).toBe("accepted");
    if (build.status !== "accepted") return;

    const resolving = await resolveMockQueueItem({
      queueItemId: build.snapshot.activeQueueItem!.id,
    });

    expect(resolving.status).toBe("accepted");
    if (resolving.status !== "accepted") return;

    const latestSnapshot = await getMockSettlementSnapshot();
    const workshop = latestSnapshot.buildings.find((building) => building.buildingType === "workshop");

    expect(workshop?.state).toBe("complete");
    expect(latestSnapshot.activeQueueItem).toBeNull();
  });

  test("upgrade consumes a finished workshop", async () => {
    const build = await startMockBuild({
      requestId: "build-1",
      tileKey: "1,0",
      buildingType: "workshop",
    });

    expect(build.status).toBe("accepted");
    if (build.status !== "accepted") return;

    await resolveMockQueueItem({
      queueItemId: build.snapshot.activeQueueItem!.id,
    });

    const latestSnapshot = await getMockSettlementSnapshot();
    const workshop = latestSnapshot.buildings.find((building) => building.buildingType === "workshop");
    expect(workshop).toBeDefined();

    const upgrade = await startMockUpgrade({
      requestId: "upgrade-1",
      buildingId: workshop!.id,
    });

    expect(upgrade.status).toBe("accepted");
    if (upgrade.status !== "accepted") return;

    expect(upgrade.snapshot.activeQueueItem?.actionType).toBe("upgrade");
    expect(upgrade.snapshot.settlement.balances.stone).toBe(2);
  });

  test("sync activity grants balances once per dedupe key", async () => {
    const first = await syncMockActivity({
      windows: [
        {
          windowStart: "2026-03-31T00:00:00Z",
          windowEnd: "2026-03-31T23:59:59Z",
          steps: 8400,
          floors: 6,
          sourcePlatform: "ios",
          sourceDeviceId: "device-1",
          dedupeKey: "mock:2026-03-31:8400:6",
        },
      ],
      clientCheckpoint: "2026-03-31T23:59:59Z",
    });

    expect(first.acceptedWindows).toBe(1);
    expect(first.grants.supplies).toBe(84);
    expect(first.balances.supplies).toBe(204);

    const second = await syncMockActivity({
      windows: [
        {
          windowStart: "2026-03-31T00:00:00Z",
          windowEnd: "2026-03-31T23:59:59Z",
          steps: 8400,
          floors: 6,
          sourcePlatform: "ios",
          sourceDeviceId: "device-1",
          dedupeKey: "mock:2026-03-31:8400:6",
        },
      ],
      clientCheckpoint: "2026-03-31T23:59:59Z",
    });

    expect(second.acceptedWindows).toBe(0);
    expect(second.duplicateWindows).toBe(1);
    expect(second.balances.supplies).toBe(204);
  });
});
