import { startTransition, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import {
  fetchSettlementSnapshot,
  resolveQueueItem,
  startBuild,
  startClearTile,
  startUpgrade,
} from "../../lib/api/client";
import type {
  BuildingType,
  SettlementSnapshot,
  SettlementActionResponse,
} from "../../lib/api/contracts";
import {
  initializeSettlementCache,
  readCachedSettlementSnapshot,
  writeCachedSettlementSnapshot,
} from "../../lib/cache/settlementCache";

interface SettlementSnapshotState {
  snapshot: SettlementSnapshot | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  actionMessage: string | null;
  source: "cache" | "network" | null;
  startBuildAction: (tileKey: string, buildingType: Exclude<BuildingType, "camp">) => Promise<void>;
  startClearTileAction: (tileKey: string) => Promise<void>;
  startUpgradeAction: (buildingId: string) => Promise<void>;
  resolveActiveQueueItemAction: () => Promise<void>;
}

export function useSettlementSnapshot(): SettlementSnapshotState {
  const db = useSQLiteContext();
  const [state, setState] = useState<Omit<SettlementSnapshotState, "startBuildAction" | "startClearTileAction" | "startUpgradeAction" | "resolveActiveQueueItemAction">>({
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
        await initializeSettlementCache(db);

        const cachedSnapshot = await readCachedSettlementSnapshot(db);

        if (!cancelled && cachedSnapshot) {
          startTransition(() => {
            setState({
              snapshot: cachedSnapshot,
              isLoading: true,
              isSubmitting: false,
              error: null,
              actionMessage: null,
              source: "cache",
            });
          });
        }

        const remoteSnapshot = await fetchSettlementSnapshot();
        await writeCachedSettlementSnapshot(db, remoteSnapshot);

        if (!cancelled) {
          startTransition(() => {
            setState({
              snapshot: remoteSnapshot,
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
              snapshot: previous.snapshot,
              isLoading: false,
              isSubmitting: false,
              error: message,
              actionMessage: previous.actionMessage,
              source: previous.source,
            }));
          });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [db]);

  async function runAcceptedMutation(
    run: () => Promise<SettlementActionResponse>,
  ): Promise<void> {
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

      await writeCachedSettlementSnapshot(db, response.snapshot);

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

  return {
    ...state,
    startBuildAction,
    startClearTileAction,
    startUpgradeAction,
    resolveActiveQueueItemAction,
  };
}

function makeRequestId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}
