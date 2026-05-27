import { useEffect } from "react";
import { ChefHat, CircleDot } from "lucide-react";
import { useKDSAuth } from "../contexts/KDSAuthContext";
import { useSync } from "../contexts/SyncContext";
import { useKitchenOrders } from "../hooks/useKitchenOrders";
import { OrderCard } from "../components/OrderCard";
import { destroyKitchenBroadcast, initKitchenBroadcast } from "../broadcast/kitchenBroadcast";

const COLUMNS = [
  { status: "pending" as const, label: "En attente", color: "#f6b73c" },
  { status: "confirmed" as const, label: "Confirme", color: "#4d9cff" },
  { status: "preparing" as const, label: "Preparation", color: "#ff8f42" },
  { status: "ready" as const, label: "Pret", color: "#97f56d" },
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
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-[#101614]">
        <div className="h-10 w-10 rounded-full border-4 border-[#97f56d] border-t-transparent animate-spin" />
        <p className="text-sm text-white/60">
          {!isReady ? "Synchronisation en cours..." : "Chargement des commandes..."}
        </p>
      </div>
    );
  }

  const totalActive = COLUMNS.reduce((sum, col) => sum + (byStatus.get(col.status)?.length ?? 0), 0);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#101614]">
      <header className="border-b border-white/10 bg-[#18231e] px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo-kash.svg" alt="Kash" className="h-9 w-auto object-contain" />
            <div>
              <p className="text-sm font-semibold text-white">Kash KDS</p>
              <p className="text-xs text-white/50">Cuisine en temps reel</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-white/80">
            <CircleDot className="h-4 w-4 text-[#97f56d]" />
            {totalActive} commande{totalActive > 1 ? "s" : ""} active{totalActive > 1 ? "s" : ""}
          </div>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-2 bg-[#0d1311] p-2 lg:grid-cols-4">
        {COLUMNS.map((column) => {
          const orders = byStatus.get(column.status) ?? [];
          return (
            <section
              key={column.status}
              className="flex min-h-0 flex-col rounded-xl border border-white/10 bg-[#141d19]"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4" style={{ color: column.color }} />
                  <h2 className="text-sm font-semibold" style={{ color: column.color }}>
                    {column.label}
                  </h2>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-black text-black"
                  style={{ backgroundColor: column.color }}
                >
                  {orders.length}
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {orders.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-white/10">
                    <p className="text-xs text-white/35">Aucune commande</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
