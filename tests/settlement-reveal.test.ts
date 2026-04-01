import { describe, expect, test } from "bun:test";
import { mockSettlementSnapshot } from "../apps/mobile/src/lib/api/mock";
import { deriveRevealMoment } from "../apps/mobile/src/features/settlement/reveal";
import type { SettlementSnapshot } from "../apps/mobile/src/lib/api/contracts";

describe("settlement reveal", () => {
  test("detects completed workshop after queue resolve", () => {
    const previousSnapshot: SettlementSnapshot = {
      ...mockSettlementSnapshot,
      buildings: [
        ...mockSettlementSnapshot.buildings,
        {
          id: "building-workshop",
          tileKey: "1,0",
          buildingType: "workshop",
          level: 1,
          state: "building",
          startedAt: "2026-04-01T08:00:00Z",
        },
      ],
      activeQueueItem: {
        id: "queue-1",
        actionType: "build",
        targetType: "building",
        targetId: "building-workshop",
        startedAt: "2026-04-01T08:00:00Z",
        completeAt: "2026-04-01T08:10:00Z",
      },
    };

    const nextSnapshot: SettlementSnapshot = {
      ...previousSnapshot,
      buildings: previousSnapshot.buildings.map((building) =>
        building.id === "building-workshop"
          ? {
              ...building,
              state: "complete",
              completedAt: "2026-04-01T08:10:00Z",
            }
          : building,
      ),
      activeQueueItem: null,
      completedItems: [
        {
          id: "completed-2",
          title: "Workshop completed",
          completedAt: "2026-04-01T08:10:00Z",
        },
        ...previousSnapshot.completedItems,
      ],
    };

    const reveal = deriveRevealMoment(previousSnapshot, nextSnapshot);

    expect(reveal).not.toBeNull();
    expect(reveal?.title).toBe("Workshop completed");
    expect(reveal?.tileKey).toBe("1,0");
  });

  test("detects newly cleared tile after resolve", () => {
    const previousSnapshot: SettlementSnapshot = {
      ...mockSettlementSnapshot,
      activeQueueItem: {
        id: "queue-clear",
        actionType: "clear_tile",
        targetType: "tile",
        targetId: "tile-0-1",
        startedAt: "2026-04-01T08:00:00Z",
        completeAt: "2026-04-01T08:10:00Z",
      },
    };

    const nextSnapshot: SettlementSnapshot = {
      ...previousSnapshot,
      tiles: previousSnapshot.tiles.map((tile) =>
        tile.id === "tile-0-1"
          ? {
              ...tile,
              state: "cleared",
            }
          : tile,
      ),
      activeQueueItem: null,
    };

    const reveal = deriveRevealMoment(previousSnapshot, nextSnapshot);

    expect(reveal).not.toBeNull();
    expect(reveal?.title).toBe("New land cleared");
    expect(reveal?.tileKey).toBe("0,1");
  });
});
