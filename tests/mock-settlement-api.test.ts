import { beforeEach, describe, expect, test } from "bun:test";
import {
  getMockSettlementSnapshot,
  resetMockSettlementState,
  resolveMockQueueItem,
  startMockBuild,
  startMockUpgrade,
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
});
