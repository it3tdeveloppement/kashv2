import { useState, useCallback } from "react";
import type { Tenant } from "@kash/types";

interface UseChildTenantsResult {
  selectedTenantIds: string[];
  toggleTenant: (id: string) => void;
  selectAll: (tenants: Tenant[]) => void;
  clearAll: () => void;
  /** Array to pass to analytics RPCs (includes parent if selected) */
  analyticsIds: string[];
}

/**
 * Multi-tenant selector for analytics dashboards.
 * Analytics RPCs take p_tenant_ids uuid[] — this hook manages that selection.
 */
export function useChildTenants(
  parentTenantId: string,
  initialIds: string[] = []
): UseChildTenantsResult {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialIds.length > 0 ? initialIds : [parentTenantId]
  );

  const toggleTenant = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((tenants: Tenant[]) => {
    setSelectedIds([parentTenantId, ...tenants.map((t) => t.id)]);
  }, [parentTenantId]);

  const clearAll = useCallback(() => {
    setSelectedIds([parentTenantId]);
  }, [parentTenantId]);

  return {
    selectedTenantIds: selectedIds,
    toggleTenant,
    selectAll,
    clearAll,
    analyticsIds: selectedIds.length > 0 ? selectedIds : [parentTenantId],
  };
}
