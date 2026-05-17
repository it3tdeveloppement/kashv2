import { useEffect } from "react";
import { useKDSAuth } from "../contexts/KDSAuthContext";
import { useSync } from "../contexts/SyncContext";
import { useKitchenOrders } from "../hooks/useKitchenOrders";
import { OrderCard } from "../components/OrderCard";
import { initKitchenBroadcast, destroyKitchenBroadcast } from "../broadcast/kitchenBroadcast";

const COLUMNS = [
  { status: "pending" as const, label: "En attente", color: "#f59e0b" },
  { status: "confirmed" as const, label: "Confirmé", color: "#3b82f6" },
  { status: "preparing" as const, label: "En préparation", color: "#f97316" },
  { status: "ready" as const, label: "Prêt", color: "#97f56d" },
];

export function KDSDisplay() {
  const { session } = useKDSAuth();
  const { isReady } = useSync();
  const { byStatus, isLoading } = useKitchenOrders(session?.tenantId ?? "");

  useEffect(() => {
    initKitchenBroadcast();
    return () => destroyKitchenBroadcast();
  }, []);

  if (!isReady || isLoading) {
    return (
      <div className="fixed inset-0 bg-[#111111] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#97f56d] border-t-transparent animate-spin" />
        <p className="text-white/40 text-sm">
          {!isReady ? "Synchronisation en cours…" : "Chargement des commandes…"}
        </p>
      </div>
    );
  }

  const totalActive = COLUMNS.reduce((sum, col) => sum + (byStatus.get(col.status)?.length ?? 0), 0);

  return (
    <div className="fixed inset-0 bg-[#111111] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#97f56d] flex items-center justify-center">
            <span className="text-black font-black text-sm font-otacos">K</span>
          </div>
          <span className="text-white font-bold">Kash KDS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-sm">{totalActive} commande{totalActive !== 1 ? "s" : ""} active{totalActive !== 1 ? "s" : ""}</span>
          <div className="w-2 h-2 rounded-full bg-[#97f56d] animate-pulse" />
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 grid grid-cols-4 gap-px bg-white/5 overflow-hidden">
        {COLUMNS.map((col) => {
          const orders = byStatus.get(col.status) ?? [];
          return (
            <div key={col.status} className="flex flex-col bg-[#111111] overflow-hidden">
              {/* Column header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: col.color + "44" }}
              >
                <span className="font-bold text-sm" style={{ color: col.color }}>
                  {col.label}
                </span>
                {orders.length > 0 && (
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded-full text-black"
                    style={{ backgroundColor: col.color }}
                  >
                    {orders.length}
                  </span>
                )}
              </div>

              {/* Orders */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {orders.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/20 text-sm">Aucune commande</p>
                  </div>
                ) : (
                  orders.map((order) => <OrderCard key={order.id} order={order} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
