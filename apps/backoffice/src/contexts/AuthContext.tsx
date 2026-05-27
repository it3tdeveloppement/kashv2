import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@kash/supabase";
import type { Profile, AppRole } from "@kash/types";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  /** Currently active tenant ID — use THIS for all management screens, not profile.tenant_id */
  currentTenantId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchTenant: (tenantId: string | null) => void;
  role: AppRole | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TENANT_CONTEXT_KEY = "kash_current_tenant_id";
const AUTH_REQUEST_TIMEOUT_MS = 10_000;

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(new Error("AUTH_TIMEOUT"));
      }, timeoutMs);
    }),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const result = await withTimeout(
        supabase.from("profiles").select("*").eq("id", userId).single() as PromiseLike<{
          data: Profile | null;
          error: unknown;
        }>,
        AUTH_REQUEST_TIMEOUT_MS
      );
      const { data, error } = result;
      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  }, []);

  const resolveCurrentTenantId = useCallback((p: Profile | null): string | null => {
    if (!p) return null;
    if (p.tenant_id !== null) return p.tenant_id;
    return localStorage.getItem(TENANT_CONTEXT_KEY);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrapSession = async () => {
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_REQUEST_TIMEOUT_MS
        );
        if (cancelled) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const p = await loadProfile(session.user.id);
          if (cancelled) return;
          setProfile(p);
          setCurrentTenantId(resolveCurrentTenantId(p));
        }
      } catch {
        if (!cancelled) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setCurrentTenantId(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    bootstrapSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const p = await loadProfile(session.user.id);
          setProfile(p);
          setCurrentTenantId(resolveCurrentTenantId(p));
        } else {
          setProfile(null);
          setCurrentTenantId(null);
        }

        setIsLoading(false);
      }
    );

    const hardStop = setTimeout(() => {
      if (!cancelled) setIsLoading(false);
    }, AUTH_REQUEST_TIMEOUT_MS + 1_500);

    return () => {
      cancelled = true;
      clearTimeout(hardStop);
      subscription.unsubscribe();
    };
  }, [loadProfile, resolveCurrentTenantId]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const switchTenant = useCallback((tenantId: string | null) => {
    if (tenantId) {
      localStorage.setItem(TENANT_CONTEXT_KEY, tenantId);
    } else {
      localStorage.removeItem(TENANT_CONTEXT_KEY);
    }
    setCurrentTenantId(tenantId);
  }, []);

  const isSuperAdmin = profile?.tenant_id === null && !!user;
  const role = profile?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        currentTenantId,
        isLoading,
        isAuthenticated: !!user && !!profile,
        isSuperAdmin,
        signIn,
        signOut,
        switchTenant,
        role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
