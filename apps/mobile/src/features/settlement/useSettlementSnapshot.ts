import { startTransition, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { fetchSettlementSnapshot } from "../../lib/api/client";
import type { SettlementSnapshot } from "../../lib/api/contracts";
import {
  initializeSettlementCache,
  readCachedSettlementSnapshot,
  writeCachedSettlementSnapshot,
} from "../../lib/cache/settlementCache";

interface SettlementSnapshotState {
  snapshot: SettlementSnapshot | null;
  isLoading: boolean;
  error: string | null;
  source: "cache" | "network" | null;
}

export function useSettlementSnapshot(): SettlementSnapshotState {
  const db = useSQLiteContext();
  const [state, setState] = useState<SettlementSnapshotState>({
    snapshot: null,
    isLoading: true,
    error: null,
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
              error: null,
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
              error: null,
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
              error: message,
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

  return state;
}
