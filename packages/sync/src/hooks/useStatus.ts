import { useEffect, useState } from "react";
import { getPowerSyncDb } from "../client";
import type { SyncStatus } from "@kash/types";

export interface SyncStatusState {
  status: SyncStatus;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  hasSynced: boolean;
}

export function useSyncStatus(): SyncStatusState {
  const [state, setState] = useState<SyncStatusState>({
    status: "connecting",
    isOnline: false,
    isSyncing: false,
    lastSyncedAt: null,
    hasSynced: false,
  });

  useEffect(() => {
    let db: ReturnType<typeof getPowerSyncDb>;
    try {
      db = getPowerSyncDb();
    } catch {
      return;
    }

    const unsubscribe = db.registerListener({
      statusChanged: (syncStatus) => {
        setState({
          status: syncStatus.connected
            ? syncStatus.dataFlowStatus?.uploading || syncStatus.dataFlowStatus?.downloading
              ? "syncing"
              : "connected"
            : "disconnected",
          isOnline: syncStatus.connected,
          isSyncing:
            (syncStatus.dataFlowStatus?.uploading ||
              syncStatus.dataFlowStatus?.downloading) ??
            false,
          lastSyncedAt: syncStatus.lastSyncedAt ?? null,
          hasSynced: syncStatus.hasSynced ?? false,
        });
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}
