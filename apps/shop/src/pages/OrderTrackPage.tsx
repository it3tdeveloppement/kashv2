import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { callClickCollectTrack } from "@kash/supabase";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente de confirmation",
  confirmed: "Commande confirmée",
  preparing: "En préparation",
  ready: "Prêt à récupérer",
  completed: "Commande récupérée",
  cancelled: "Commande annulée",
};

const STATUS_ICONS: Record<string, string> = {
  pending: "⏳",
  confirmed: "✅",
  preparing: "👨‍🍳",
  ready: "🎉",
  completed: "🏠",
  cancelled: "❌",
};

export function OrderTrackPage() {
  const { orderToken } = useParams<{ orderToken: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["order-track", orderToken],
    queryFn: () => callClickCollectTrack(orderToken!),
    enabled: !!orderToken,
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#97f56d] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-2">⚠️</p>
          <p className="text-gray-600 font-medium">Commande introuvable</p>
        </div>
      </div>
    );
  }

  const status: string = data.status ?? "pending";
  const orderNumber: string = data.order_number ?? "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">{STATUS_ICONS[status] ?? "📦"}</div>
        <p className="text-gray-400 text-sm">Commande #{orderNumber}</p>
        <h1 className="text-xl font-bold text-gray-900 mt-2">
          {STATUS_LABELS[status] ?? "Statut inconnu"}
        </h1>
        <p className="text-gray-400 text-xs mt-4">
          Cette page se rafraîchit automatiquement toutes les 15 secondes.
        </p>
      </div>
    </div>
  );
}
