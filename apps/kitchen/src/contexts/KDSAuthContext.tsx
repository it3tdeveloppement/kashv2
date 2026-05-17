import React, { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { callKdsAuth } from "@kash/supabase";

interface KDSSession {
  tenantId: string;
  powersyncToken: string;
}

interface KDSAuthContextValue {
  session: KDSSession | null;
  isLoading: boolean;
  error: string | null;
}

const KDSAuthContext = createContext<KDSAuthContextValue>({
  session: null,
  isLoading: true,
  error: null,
});

export function KDSAuthProvider({ children }: { children: React.ReactNode }) {
  const { tenantId, token } = useParams<{ tenantId: string; token: string }>();
  const [session, setSession] = useState<KDSSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId || !token) {
      setError("Paramètres manquants");
      setIsLoading(false);
      return;
    }

    callKdsAuth(tenantId, token)
      .then((data) => {
        setSession({ tenantId: data.tenant_id, powersyncToken: data.powersync_token });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Token invalide");
      })
      .finally(() => setIsLoading(false));
  }, [tenantId, token]);

  return (
    <KDSAuthContext.Provider value={{ session, isLoading, error }}>
      {children}
    </KDSAuthContext.Provider>
  );
}

export function useKDSAuth() {
  return useContext(KDSAuthContext);
}
