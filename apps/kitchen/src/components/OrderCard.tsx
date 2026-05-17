import type { KitchenOrder, KdsOrderStatus } from "@kash/types";
import { callUpdateKitchenOrderStatus } from "@kash/supabase";
import { broadcastStatusChange } from "../broadcast/kitchenBroadcast";

const STATUS_LABELS: Record<KdsOrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  preparing: "En préparation",
  ready: "Prêt",
  completed: "Terminé",
};

const STATUS_COLORS: Record<KdsOrderStatus, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  preparing: "#f97316",
  ready: "#97f56d",
  completed: "#6b7280",
};

const NEXT_STATUS: Partial<Record<KdsOrderStatus, KdsOrderStatus>> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "completed",
};

const NEXT_LABEL: Partial<Record<KdsOrderStatus, string>> = {
  pending: "Confirmer",
  confirmed: "Commencer",
  preparing: "Prêt",
  ready: "Terminé",
};

interface OrderCardProps {
  order: KitchenOrder;
  onStatusChange?: (orderId: string, status: KdsOrderStatus) => void;
}

function elapsedMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const elapsed = elapsedMinutes(order.created_at);
  const isUrgent = elapsed > 15;
  const nextStatus = NEXT_STATUS[order.status as KdsOrderStatus];
  const statusColor = STATUS_COLORS[order.status as KdsOrderStatus] ?? "#6b7280";

  async function handleAdvance() {
    if (!nextStatus) return;
    try {
      await callUpdateKitchenOrderStatus(order.id, nextStatus);
      broadcastStatusChange(order.id, nextStatus);
      onStatusChange?.(order.id, nextStatus);
    } catch (err) {
      console.error("Failed to update order status", err);
    }
  }

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden border-2"
      style={{ borderColor: statusColor }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: statusColor + "22" }}>
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-xl">#{order.order_number}</span>
          {order.order_type && (
            <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
              {order.order_type}
            </span>
          )}
        </div>
        <div className="text-right">
          <span
            className={["text-sm font-semibold", isUrgent ? "text-red-400" : "text-white/60"].join(" ")}
          >
            {elapsed}min
          </span>
          <div className="text-xs font-medium mt-0.5" style={{ color: statusColor }}>
            {STATUS_LABELS[order.status as KdsOrderStatus]}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 px-4 py-3 space-y-2 bg-white/5">
        {order.items.map((item, idx) => (
          <div key={idx}>
            <div className="flex items-start gap-2">
              <span
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-black"
                style={{ backgroundColor: "#97f56d" }}
              >
                {item.quantity}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-snug">{item.product_name}</p>
                {item.options.length > 0 && (
                  <p className="text-white/40 text-xs mt-0.5">
                    {item.options.map((o) => o.value).join(", ")}
                  </p>
                )}
                {item.notes && (
                  <p className="text-yellow-400/80 text-xs mt-0.5 italic">{item.notes}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {order.notes && (
          <p className="text-yellow-300/70 text-xs border-t border-white/10 pt-2 mt-2 italic">
            Note: {order.notes}
          </p>
        )}
      </div>

      {/* Action */}
      {nextStatus && (
        <button
          onClick={handleAdvance}
          className="w-full py-3 font-bold text-sm text-black transition-opacity active:opacity-70"
          style={{ backgroundColor: STATUS_COLORS[nextStatus] }}
        >
          {NEXT_LABEL[order.status as KdsOrderStatus]}
        </button>
      )}
    </div>
  );
}
