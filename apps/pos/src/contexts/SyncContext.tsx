import React, { createContext, useContext, useEffect, useState } from "react";
import { initPowerSync, disconnectPowerSync } from "@kash/sync";
import { startQueueProcessor, stopQueueProcessor } from "@kash/sync";
import { usePOSAuth } from "./POSAuthContext";

interface SyncContextValue {
  isReady: boolean;
}

const SyncContext = createContext<SyncContextValue>({ isReady: false });

const POWERSYNC_URL = import.meta.env.VITE_POWERSYNC_URL ?? "";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { session } = usePOSAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!session?.powersync_token || !POWERSYNC_URL) {
      setIsReady(false);
      return;
    }

    setIsReady(false);

    initPowerSync({
      url: POWERSYNC_URL,
      token: session.powersync_token,
    })
      .then(() => {
        setIsReady(true);
        startQueueProcessor(10_000);
      })
      .catch(console.error);

    return () => {
      stopQueueProcessor();
      disconnectPowerSync().catch(console.error);
      setIsReady(false);
    };
  }, [session?.powersync_token]);

  return (
    <SyncContext.Provider value={{ isReady }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextValue {
  return useContext(SyncContext);
}
