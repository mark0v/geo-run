import {
  ActivitySyncWindowInput,
  RESOURCE_RULE_VERSION,
  ResourceGrant,
  SettlementBalances,
} from "./contracts.ts";

const SUPPLIES_PER_STEP = 0.01;
const STONE_PER_FLOOR = 1;

export function toSupplies(steps: number): number {
  return Math.max(0, Math.floor(steps * SUPPLIES_PER_STEP));
}

export function toStone(floors: number): number {
  return Math.max(0, Math.floor(floors * STONE_PER_FLOOR));
}

export function grantForWindow(window: ActivitySyncWindowInput): ResourceGrant {
  return {
    supplies: toSupplies(window.steps),
    stone: toStone(window.floors ?? 0),
    ruleVersion: RESOURCE_RULE_VERSION,
  };
}

export function sumGrants(grants: ResourceGrant[]): SettlementBalances {
  return grants.reduce(
    (totals, grant) => ({
      supplies: totals.supplies + grant.supplies,
      stone: totals.stone + grant.stone,
    }),
    { supplies: 0, stone: 0 },
  );
}

export function validateWindow(window: ActivitySyncWindowInput): string[] {
  const problems: string[] = [];

  if (!window.windowStart || !window.windowEnd) {
    problems.push("windowStart and windowEnd are required");
  }

  if (Number.isNaN(Date.parse(window.windowStart)) || Number.isNaN(Date.parse(window.windowEnd))) {
    problems.push("windowStart and windowEnd must be valid ISO timestamps");
  }

  if (!window.dedupeKey) {
    problems.push("dedupeKey is required");
  }

  if (window.steps < 0) {
    problems.push("steps must be >= 0");
  }

  if ((window.floors ?? 0) < 0) {
    problems.push("floors must be >= 0");
  }

  return problems;
}

export function dedupeWindows(windows: ActivitySyncWindowInput[]): {
  accepted: ActivitySyncWindowInput[];
  duplicates: ActivitySyncWindowInput[];
} {
  const seen = new Set<string>();
  const accepted: ActivitySyncWindowInput[] = [];
  const duplicates: ActivitySyncWindowInput[] = [];

  for (const window of windows) {
    if (seen.has(window.dedupeKey)) {
      duplicates.push(window);
      continue;
    }

    seen.add(window.dedupeKey);
    accepted.push(window);
  }

  return { accepted, duplicates };
}
