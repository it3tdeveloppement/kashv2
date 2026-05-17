import { useCallback } from "react";
import { safeUUID } from "../lib/utils";

/** Hook wrapper for safeUUID() — use everywhere a UUID is needed in components */
export function useSafeUUID() {
  return useCallback(() => safeUUID(), []);
}
