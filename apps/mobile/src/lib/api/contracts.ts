export interface SettlementBalances {
  supplies: number;
  stone: number;
}

export interface SettlementTile {
  id: string;
  tileKey: string;
  terrainType: string;
  state: "hidden" | "blocked" | "cleared" | "occupied";
}

export interface SettlementBuilding {
  id: string;
  tileKey: string;
  buildingType: string;
  level: number;
  state: "planned" | "building" | "complete";
  startedAt?: string;
  completedAt?: string;
}

export interface ConstructionQueueItem {
  id: string;
  actionType: "build" | "upgrade" | "clear_tile";
  targetType: "building" | "tile";
  targetId: string;
  startedAt: string;
  completeAt: string;
}

export interface CompletedItem {
  id: string;
  title: string;
  completedAt: string;
}

export interface SettlementSnapshot {
  settlement: {
    id: string;
    name: string;
    milestoneLevel: number;
    balances: SettlementBalances;
  };
  tiles: SettlementTile[];
  buildings: SettlementBuilding[];
  activeQueueItem: ConstructionQueueItem | null;
  completedItems: CompletedItem[];
}
