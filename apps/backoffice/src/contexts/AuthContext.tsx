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
  switchTenant: (tenantId: string) => void;
  role: AppRole | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) return null;
    return data as Profile;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const p = await loadProfile(session.user.id);
        setProfile(p);
        // Superadmin has null tenant_id — handle defensively
        setCurrentTenantId(p?.tenant_id ?? null);
      }

      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const p = await loadProfile(session.user.id);
          setProfile(p);
          setCurrentTenantId(p?.tenant_id ?? null);
        } else {
          setProfile(null);
          setCurrentTenantId(null);
        }

        if (event === "INITIAL_SESSION") setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  /** Superadmin context switch — switches currentTenantId without changing profile */
  const switchTenant = useCallback((tenantId: string) => {
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
