import React, { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@kash/supabase";
import { useAuth } from "./AuthContext";

interface ModulePermission {
  enabled: boolean;
  canRead: boolean;
  canWrite: boolean;
}

interface ModulePermissionsContextValue {
  permissions: Record<string, ModulePermission>;
  isLoading: boolean;
  isError: boolean;
  canReadModule: (moduleCode: string) => boolean;
  canWriteModule: (moduleCode: string) => boolean;
}

const ModulePermissionsContext = createContext<ModulePermissionsContextValue | null>(null);

const SUPERADMIN_DEFAULT_MODULES = [
  "dashboard",
  "products",
  "inventory",
  "customers",
  "billing",
  "settings",
  "pos",
  "kiosk",
  "kitchen",
  "shop",
] as const;

export function ModulePermissionsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSuperAdmin, currentTenantId, profile } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["module-permissions", currentTenantId, profile?.id, isSuperAdmin],
    queryFn: async () => {
      if (!isAuthenticated) return {} as Record<string, ModulePermission>;

      if (isSuperAdmin) {
        const out: Record<string, ModulePermission> = {};
        for (const code of SUPERADMIN_DEFAULT_MODULES) {
          out[code] = { enabled: true, canRead: true, canWrite: true };
        }
        return out;
      }

      if (!currentTenantId) return {} as Record<string, ModulePermission>;

      const [modulesResult, tenantAccessResult, userPermResult] = await Promise.all([
        supabase
          .from("modules")
          .select("id, code, has_write_capability")
          .eq("tenant_id", currentTenantId),
        supabase
          .from("tenant_module_access")
          .select("module_id, is_enabled")
          .eq("tenant_id", currentTenantId),
        profile?.id
          ? supabase
              .from("user_module_permissions")
              .select("module_id, can_read, can_write")
              .eq("tenant_id", currentTenantId)
              .eq("user_id", profile.id)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (modulesResult.error) throw modulesResult.error;
      if (tenantAccessResult.error) throw tenantAccessResult.error;
      if (userPermResult.error) throw userPermResult.error;

      const accessByModuleId = new Map(
        (tenantAccessResult.data ?? []).map((row) => [row.module_id, row.is_enabled])
      );
      const userPermByModuleId = new Map(
        (userPermResult.data ?? []).map((row) => [row.module_id, row])
      );

      const out: Record<string, ModulePermission> = {};
      for (const module of modulesResult.data ?? []) {
        const isEnabled = accessByModuleId.get(module.id) ?? true;
        const userPerm = userPermByModuleId.get(module.id);
        const canRead = isEnabled && (userPerm ? userPerm.can_read : true);
        const canWrite = isEnabled && (userPerm ? userPerm.can_write : false);

        out[module.code] = {
          enabled: isEnabled,
          canRead,
          canWrite,
        };
      }

      return out;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });

  const value = useMemo<ModulePermissionsContextValue>(() => {
    const permissions = data ?? {};
    return {
      permissions,
      isLoading,
      isError,
      canReadModule: (moduleCode: string) => permissions[moduleCode]?.canRead ?? false,
      canWriteModule: (moduleCode: string) => permissions[moduleCode]?.canWrite ?? false,
    };
  }, [data, isError, isLoading]);

  return (
    <ModulePermissionsContext.Provider value={value}>
      {children}
    </ModulePermissionsContext.Provider>
  );
}

export function useModulePermissions(): ModulePermissionsContextValue {
  const ctx = useContext(ModulePermissionsContext);
  if (!ctx) {
    throw new Error("useModulePermissions must be used within ModulePermissionsProvider");
  }
  return ctx;
}

