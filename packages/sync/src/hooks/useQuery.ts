import { useState, useEffect } from "react";
import { getPowerSyncDb } from "../client";

/**
 * Reactive SQL query against the local PowerSync SQLite database.
 * Re-renders automatically when underlying data changes via db.watch().
 */
export function usePowerSyncQuery<T = Record<string, unknown>>(
  sql: string,
  parameters?: unknown[]
): { data: T[]; isLoading: boolean; error: Error | null } {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Stable serialization for dep comparison
  const paramsKey = parameters ? JSON.stringify(parameters) : "";

  useEffect(() => {
    let cancelled = false;

    let db: ReturnType<typeof getPowerSyncDb>;
    try {
      db = getPowerSyncDb();
    } catch (e) {
      setIsLoading(false);
      setError(e instanceof Error ? e : new Error(String(e)));
      return;
    }

    async function run() {
      try {
        for await (const result of db.watch(sql, parameters ?? [])) {
          if (cancelled) break;
          // PowerSync ResultSet exposes rows._array
          const rows = (result as { rows?: { _array?: T[] } }).rows?._array ?? [];
          setData(Array.isArray(rows) ? rows : []);
          setIsLoading(false);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setIsLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sql, paramsKey]);

  return { data, isLoading, error };
}

/**
 * One-shot SQL query (not reactive). Useful for reads in event handlers.
 */
export async function execQuery<T = Record<string, unknown>>(
  sql: string,
  parameters?: unknown[]
): Promise<T[]> {
  const db = getPowerSyncDb();
  return db.getAll<T>(sql, parameters);
}

export async function execQueryOne<T = Record<string, unknown>>(
  sql: string,
  parameters?: unknown[]
): Promise<T | null> {
  const db = getPowerSyncDb();
  return db.getOptional<T>(sql, parameters);
}
