import React, { createContext, useContext, useEffect, useState } from "react";
import { initPowerSync, disconnectPowerSync } from "@kash/sync";
import { useKDSAuth } from "./KDSAuthContext";

interface SyncContextValue {
  isReady: boolean;
}

const SyncContext = createContext<SyncContextValue>({ isReady: false });

const POWERSYNC_URL = import.meta.env.VITE_POWERSYNC_URL ?? "";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { session } = useKDSAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!session?.powersyncToken || !POWERSYNC_URL) {
      setIsReady(false);
      return;
    }

    setIsReady(false);

    initPowerSync({ url: POWERSYNC_URL, token: session.powersyncToken })
      .then(() => setIsReady(true))
      .catch(console.error);

    return () => {
      disconnectPowerSync().catch(console.error);
      setIsReady(false);
    };
  }, [session?.powersyncToken]);

  return <SyncContext.Provider value={{ isReady }}>{children}</SyncContext.Provider>;
}

export function useSync() {
  return useContext(SyncContext);
}
