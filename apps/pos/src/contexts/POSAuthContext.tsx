import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { callPosAuth } from "@kash/supabase";
import type { PosAuthResult } from "@kash/supabase";

const SESSION_KEY = "kash_pos_session";

interface POSAuthContextValue {
  session: PosAuthResult | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (pin: string, tenantId: string, establishmentId?: string) => Promise<void>;
  logout: () => void;
}

const POSAuthContext = createContext<POSAuthContextValue | null>(null);

export function POSAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<PosAuthResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on boot
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PosAuthResult;
        // Check expiry
        if (new Date(parsed.expires_at) > new Date()) {
          setSession(parsed);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (pin: string, tenantId: string, establishmentId?: string) => {
    const result = await callPosAuth({ pin, tenant_id: tenantId, establishment_id: establishmentId });
    setSession(result);
    localStorage.setItem(SESSION_KEY, JSON.stringify(result));
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <POSAuthContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </POSAuthContext.Provider>
  );
}

export function usePOSAuth(): POSAuthContextValue {
  const ctx = useContext(POSAuthContext);
  if (!ctx) throw new Error("usePOSAuth must be used within POSAuthProvider");
  return ctx;
}
