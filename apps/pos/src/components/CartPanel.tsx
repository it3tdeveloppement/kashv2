import { useState } from "react";
import { Trash2, Plus, Minus, ShoppingBag, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { callPosTransaction } from "@kash/supabase";
import type { PosAuthResult } from "@kash/supabase";
import { enqueueOfflineOperation } from "@kash/sync";
import { useSyncStatus } from "@kash/sync";
import { safeUUID } from "@kash/ui";
import type { CartItem } from "@kash/types";

interface CartPanelProps {
  cart: CartItem[];
  cartTotal: number;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  session: PosAuthResult | null;
  formatPrice: (amount: number) => string;
}

export function CartPanel({
  cart,
  cartTotal,
  onUpdateQuantity,
  onRemove,
  onClear,
  session,
  formatPrice,
}: CartPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("cash");
  const syncStatus = useSyncStatus();

  const PAYMENT_METHODS = [
    { code: "cash", label: "Espèces" },
    { code: "card", label: "Carte" },
    { code: "plateforme", label: "Plateforme" },
  ];

  const handleCheckout = async () => {
    if (!cart.length || !session) return;
    setIsSubmitting(true);

    const transactionId = safeUUID();
    const transactionNumber = `POS-${Date.now()}`;

    const payload = {
      session_token: session.session_token,
      transaction: {
        id: transactionId,
        tenant_id: session.tenant_id,
        session_id: null,
        user_id: session.user.id,
        transaction_number: transactionNumber,
        subtotal: cartTotal,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: cartTotal,
        payment_method: selectedPayment,
        amount_received: null,
        change_given: null,
        status: "completed" as const,
        notes: null,
        source: "pos" as const,
        order_type: null,
        device_id: null,
        customer_id: null,
        is_offert: false,
        original_subtotal: null,
        offert_reason: null,
        offert_comment: null,
        cancellation_reason: null,
        cancellation_comment: null,
        cancelled_at: null,
        cancelled_by: null,
        pager_number: null,
        table_id: null,
        customer_name: null,
        customer_phone: null,
        customer_email: null,
        online_payment_status: null,
        berexia_uid: null,
        berexia_token: null,
        paid_at: new Date().toISOString(),
        external_source: null,
        external_reference: null,
      },
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: 0,
        total_price: item.total_price,
        selected_options: item.selected_options,
        notes: item.notes,
        order_type_code: item.order_type_code,
      })),
      payments: [
        {
          tenant_id: session.tenant_id,
          payment_method: selectedPayment,
          amount: cartTotal,
        },
      ],
    };

    try {
      if (syncStatus.isOnline) {
        await callPosTransaction(payload);
        toast.success(`Transaction ${transactionNumber} — ${formatPrice(cartTotal)}`);
      } else {
        // Queue for later when back online
        await enqueueOfflineOperation("pos_transaction", payload);
        toast.success("Commande enregistrée hors ligne — sera synchronisée automatiquement.");
      }
      onClear();
    } catch (err) {
      toast.error("Erreur lors de la transaction. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-80 flex flex-col bg-[#212121] border-l border-white/10 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 text-white">
          <ShoppingBag className="w-4 h-4 text-[#97f56d]" />
          <span className="font-semibold text-sm">Commande</span>
          {cart.length > 0 && (
            <span className="bg-[#97f56d] text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </div>
        {cart.length > 0 && (
          <button
            onClick={onClear}
            className="text-white/30 hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20 text-center">
            <ShoppingBag className="w-10 h-10 mb-3" />
            <p className="text-sm">Panier vide</p>
            <p className="text-xs mt-1">Ajoutez des produits</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 bg-white/5 rounded-lg p-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.product.name}</p>
                <p className="text-xs text-white/50">{formatPrice(item.unit_price)}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <Minus className="w-3 h-3 text-white" />
                </button>
                <span className="text-sm font-bold text-white w-5 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <Plus className="w-3 h-3 text-white" />
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  className="w-6 h-6 rounded-md bg-white/5 hover:bg-red-500/20 flex items-center justify-center ml-0.5"
                >
                  <X className="w-3 h-3 text-white/40 hover:text-red-400" />
                </button>
              </div>
              <span className="text-sm font-bold text-[#97f56d] w-16 text-right flex-shrink-0">
                {formatPrice(item.total_price)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer: total + payment */}
      <div className="border-t border-white/10 p-4 space-y-3 flex-shrink-0">
        {/* Payment method selector */}
        <div className="flex gap-2">
          {PAYMENT_METHODS.map((pm) => (
            <button
              key={pm.code}
              onClick={() => setSelectedPayment(pm.code)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedPayment === pm.code
                  ? "bg-[#97f56d] text-black"
                  : "bg-white/10 text-white/60 hover:bg-white/15"
              }`}
            >
              {pm.label}
            </button>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm">Total</span>
          <span className="text-2xl font-black text-white font-otacos">
            {formatPrice(cartTotal)}
          </span>
        </div>

        {/* Checkout button */}
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || isSubmitting}
          className="w-full h-14 rounded-xl bg-[#97f56d] text-black font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            `Encaisser ${formatPrice(cartTotal)}`
          )}
        </button>
      </div>
    </div>
  );
}
