import { useMemo } from "react";
import { usePowerSyncQuery } from "@kash/sync";
import type { KitchenOrder, KdsOrderStatus } from "@kash/types";

const ACTIVE_STATUSES: KdsOrderStatus[] = ["pending", "confirmed", "preparing", "ready"];

export function useKitchenOrders(tenantId: string) {
  const { data: rows, isLoading } = usePowerSyncQuery<KitchenOrder>(
    `SELECT * FROM kitchen_orders
     WHERE tenant_id = ?
       AND status IN ('pending', 'confirmed', 'preparing', 'ready')
       AND created_at > datetime('now', '-24 hours')
     ORDER BY priority DESC, created_at ASC`,
    [tenantId]
  );

  const orders = useMemo((): KitchenOrder[] => {
    if (!rows) return [];
    return rows.map((row) => ({
      ...row,
      items: typeof row.items === "string" ? JSON.parse(row.items) : row.items,
    }));
  }, [rows]);

  const byStatus = useMemo(() => {
    const map = new Map<KdsOrderStatus, KitchenOrder[]>();
    ACTIVE_STATUSES.forEach((s) => map.set(s, []));
    orders.forEach((o) => {
      const bucket = map.get(o.status as KdsOrderStatus);
      if (bucket) bucket.push(o);
    });
    return map;
  }, [orders]);

  return { orders, byStatus, isLoading };
}
