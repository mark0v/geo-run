import { describe, expect, test } from "bun:test";
import {
  dedupeWindows,
  grantForWindow,
  sumGrants,
  validateWindow,
} from "../supabase/functions/_shared/activity-rules.ts";
import type { ActivitySyncWindowInput } from "../supabase/functions/_shared/contracts.ts";

function makeWindow(overrides: Partial<ActivitySyncWindowInput> = {}): ActivitySyncWindowInput {
  return {
    windowStart: "2026-03-31T00:00:00Z",
    windowEnd: "2026-03-31T23:59:59Z",
    steps: 8400,
    floors: 12,
    sourcePlatform: "ios",
    dedupeKey: "window-1",
    ...overrides,
  };
}

describe("activity rules", () => {
  test("grantForWindow converts steps and floors into resources", () => {
    const grant = grantForWindow(makeWindow());

    expect(grant.supplies).toBe(84);
    expect(grant.stone).toBe(12);
    expect(grant.ruleVersion).toBe("2026-03-31-v1");
  });

  test("dedupeWindows keeps first window and marks later duplicates", () => {
    const first = makeWindow({ dedupeKey: "duplicate-key" });
    const second = makeWindow({ dedupeKey: "duplicate-key", steps: 9100 });

    const result = dedupeWindows([first, second]);

    expect(result.accepted).toHaveLength(1);
    expect(result.duplicates).toHaveLength(1);
    expect(result.accepted[0].steps).toBe(8400);
  });

  test("sumGrants totals multiple windows", () => {
    const grants = [
      grantForWindow(makeWindow({ steps: 5000, floors: 3 })),
      grantForWindow(makeWindow({ dedupeKey: "window-2", steps: 4200, floors: 1 })),
    ];

    expect(sumGrants(grants)).toEqual({
      supplies: 92,
      stone: 4,
    });
  });

  test("validateWindow reports malformed payloads", () => {
    const problems = validateWindow(
      makeWindow({
        windowStart: "not-a-date",
        steps: -10,
        floors: -1,
        dedupeKey: "",
      }),
    );

    expect(problems).toContain("windowStart and windowEnd must be valid ISO timestamps");
    expect(problems).toContain("dedupeKey is required");
    expect(problems).toContain("steps must be >= 0");
    expect(problems).toContain("floors must be >= 0");
  });
});
