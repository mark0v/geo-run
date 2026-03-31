import type { SettlementSnapshot } from "./contracts";

export const mockSettlementSnapshot: SettlementSnapshot = {
  settlement: {
    id: "settlement-starter",
    name: "New Haven",
    milestoneLevel: 1,
    balances: {
      supplies: 120,
      stone: 6,
    },
  },
  tiles: [
    { id: "tile-0-0", tileKey: "0,0", terrainType: "plains", state: "occupied" },
    { id: "tile-1-0", tileKey: "1,0", terrainType: "plains", state: "cleared" },
    { id: "tile-0-1", tileKey: "0,1", terrainType: "forest-edge", state: "blocked" },
    { id: "tile-1-1", tileKey: "1,1", terrainType: "hill", state: "hidden" },
  ],
  buildings: [
    {
      id: "building-camp",
      tileKey: "0,0",
      buildingType: "camp",
      level: 1,
      state: "complete",
      completedAt: "2026-03-31T08:00:00Z",
    },
  ],
  activeQueueItem: null,
  completedItems: [
    {
      id: "completed-1",
      title: "Camp established",
      completedAt: "2026-03-31T08:00:00Z",
    },
  ],
};
