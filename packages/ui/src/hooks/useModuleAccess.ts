import { useCallback } from "react";

interface ModuleAccess {
  canRead: boolean;
  canWrite: boolean;
}

/**
 * Hook for checking module-level access in the backoffice.
 * Reads from the module permissions context (provided by apps/backoffice).
 * Falls back to false for safety.
 */
export function useModuleAccess(
  moduleCode: string,
  permissions: Record<string, ModuleAccess> = {}
): ModuleAccess {
  return permissions[moduleCode] ?? { canRead: false, canWrite: false };
}

export function useCanWriteModule(
  moduleCode: string,
  permissions: Record<string, ModuleAccess> = {}
): boolean {
  return useCallback(
    () => permissions[moduleCode]?.canWrite ?? false,
    [moduleCode, permissions]
  )();
}
