import { startTransition, useEffect, useState } from "react";
import {
  fetchSettlementSnapshot,
  resolveQueueItem,
  startBuild,
  startClearTile,
  startUpgrade,
  syncActivity,
} from "../../lib/api/client";
import type {
  BuildingType,
  SettlementActionResponse,
  SettlementSnapshot,
} from "../../lib/api/contracts";

interface SettlementSnapshotWebState {
  snapshot: SettlementSnapshot | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  actionMessage: string | null;
  source: "network" | null;
  startBuildAction: (tileKey: string, buildingType: Exclude<BuildingType, "camp">) => Promise<void>;
  startClearTileAction: (tileKey: string) => Promise<void>;
  startUpgradeAction: (buildingId: string) => Promise<void>;
  resolveActiveQueueItemAction: () => Promise<void>;
  syncTodayActivityAction: () => Promise<void>;
}

export function useSettlementSnapshotWeb(): SettlementSnapshotWebState {
  const [state, setState] = useState<
    Omit<
      SettlementSnapshotWebState,
      | "startBuildAction"
      | "startClearTileAction"
      | "startUpgradeAction"
      | "resolveActiveQueueItemAction"
      | "syncTodayActivityAction"
    >
  >({
    snapshot: null,
    isLoading: true,
    isSubmitting: false,
    error: null,
    actionMessage: null,
    source: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const snapshot = await fetchSettlementSnapshot();

        if (!cancelled) {
          startTransition(() => {
            setState({
              snapshot,
              isLoading: false,
              isSubmitting: false,
              error: null,
              actionMessage: null,
              source: "network",
            });
          });
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unknown settlement load error";

          startTransition(() => {
            setState((previous) => ({
              ...previous,
              isLoading: false,
              isSubmitting: false,
              error: message,
            }));
          });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function runAcceptedMutation(run: () => Promise<SettlementActionResponse>): Promise<void> {
    startTransition(() => {
      setState((previous) => ({
        ...previous,
        isSubmitting: true,
        error: null,
        actionMessage: null,
      }));
    });

    try {
      const response = await run();

      if (response.status === "rejected") {
        startTransition(() => {
          setState((previous) => ({
            ...previous,
            isSubmitting: false,
            actionMessage: response.message,
          }));
        });
        return;
      }

      startTransition(() => {
        setState((previous) => ({
          ...previous,
          snapshot: response.snapshot,
          isSubmitting: false,
          error: null,
          actionMessage: response.message,
          source: "network",
        }));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown settlement mutation error";

      startTransition(() => {
        setState((previous) => ({
          ...previous,
          isSubmitting: false,
          error: message,
        }));
      });
    }
  }

  async function startBuildAction(
    tileKey: string,
    buildingType: Exclude<BuildingType, "camp">,
  ): Promise<void> {
    await runAcceptedMutation(() =>
      startBuild({
        requestId: makeRequestId("build"),
        tileKey,
        buildingType,
      }),
    );
  }

  async function startClearTileAction(tileKey: string): Promise<void> {
    await runAcceptedMutation(() =>
      startClearTile({
        requestId: makeRequestId("clear"),
        tileKey,
      }),
    );
  }

  async function startUpgradeAction(buildingId: string): Promise<void> {
    await runAcceptedMutation(() =>
      startUpgrade({
        requestId: makeRequestId("upgrade"),
        buildingId,
      }),
    );
  }

  async function resolveActiveQueueItemAction(): Promise<void> {
    if (!state.snapshot?.activeQueueItem) {
      startTransition(() => {
        setState((previous) => ({
          ...previous,
          actionMessage: "There is no active project to resolve.",
        }));
      });
      return;
    }

    await runAcceptedMutation(() =>
      resolveQueueItem({
        queueItemId: state.snapshot!.activeQueueItem!.id,
      }),
    );
  }

  async function syncTodayActivityAction(): Promise<void> {
    startTransition(() => {
      setState((previous) => ({
        ...previous,
        isSubmitting: true,
        error: null,
        actionMessage: null,
      }));
    });

    try {
      const now = new Date();
      const dayKey = now.toISOString().slice(0, 10);
      const response = await syncActivity({
        windows: [
          {
            windowStart: `${dayKey}T00:00:00Z`,
            windowEnd: `${dayKey}T23:59:59Z`,
            steps: 8400,
            floors: 6,
            sourcePlatform: "ios",
            sourceDeviceId: "mock-device",
            dedupeKey: `mock:${dayKey}:8400:6`,
          },
        ],
        clientCheckpoint: now.toISOString(),
      });

      startTransition(() => {
        setState((previous) => ({
          ...previous,
          snapshot: response.snapshot,
          isSubmitting: false,
          error: null,
          actionMessage:
            response.acceptedWindows > 0
              ? `Synced today: +${response.grants.supplies} Supplies, +${response.grants.stone} Stone.`
              : "Today's activity was already synced.",
          source: "network",
        }));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown activity sync error";

      startTransition(() => {
        setState((previous) => ({
          ...previous,
          isSubmitting: false,
          error: message,
        }));
      });
    }
  }

  return {
    ...state,
    startBuildAction,
    startClearTileAction,
    startUpgradeAction,
    resolveActiveQueueItemAction,
    syncTodayActivityAction,
  };
}

function makeRequestId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}
