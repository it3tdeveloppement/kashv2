import { useState } from "react";
import type { StepProps } from "../../types/kiosk";
import type { PaymentMethod } from "@kash/types";
import { callTerminalTransaction } from "@kash/supabase";
import { safeUUID } from "@kash/ui";

const CURRENCY_SYMBOLS: Record<string, string> = {
  MAD: "Dhs",
  EUR: "€",
  USD: "$",
  GBP: "£",
};

export function PaymentStep({ state, settings, resolved, dispatch, cartTotal }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = CURRENCY_SYMBOLS[resolved.defaultCurrency] ?? resolved.defaultCurrency;
  const orderTypeCode = state.selectedOrderType?.code ?? "sur_place";

  const availablePaymentMethods = settings.paymentMethods.filter(
    (pm) =>
      pm.enabled_terminal &&
      pm.is_active &&
      (pm.available_order_type_codes.length === 0 ||
        pm.available_order_type_codes.includes(orderTypeCode))
  );

  async function handlePayment(method: PaymentMethod) {
    setLoading(true);
    setError(null);

    const orderToken = safeUUID();

    try {
      const result = await callTerminalTransaction({
        tenant_id: settings.tenantId,
        establishment_id: settings.establishmentId ?? settings.tenantId,
        items: state.cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          selected_options: item.selected_options,
        })),
        payment_method: method.code,
        total_amount: cartTotal,
        order_type: orderTypeCode,
        customer_id: state.identifiedCustomer?.id,
        customer_phone: state.identifiedCustomer?.phone ?? undefined,
        order_token: orderToken,
      });

      const orderNumber: string =
        result?.order_number ?? result?.orderNumber ?? String(Math.floor(Math.random() * 900) + 100);

      dispatch({ type: "SET_ORDER_RESULT", orderNumber, orderToken });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de paiement. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: resolved.backgroundColor }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-white/10">
        <button
          onClick={() =>
            dispatch({ type: "SET_STEP", step: resolved.loyaltyEnabled ? "loyalty" : "cart" })
          }
          className="text-white/60 hover:text-white text-2xl leading-none"
        >
          ←
        </button>
        <h2 className="text-white font-bold text-xl">Paiement</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
        {/* Total */}
        <div className="text-center">
          <p className="text-white/60 text-lg">Total à payer</p>
          <p className="text-5xl font-black text-white mt-2">
            {cartTotal.toFixed(2)}{" "}
            <span style={{ color: resolved.primaryColor }}>{currency}</span>
          </p>
        </div>

        {/* Customer badge */}
        {state.identifiedCustomer && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10">
            <span className="text-xl">👤</span>
            <div>
              <p className="text-white font-semibold text-sm">
                {state.identifiedCustomer.first_name ?? state.identifiedCustomer.phone}
              </p>
              {state.loyaltyAccount && (
                <p className="text-white/50 text-xs">
                  {state.loyaltyAccount.points_balance ?? 0} points fidélité
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="w-full max-w-md px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Payment methods */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
          {availablePaymentMethods.map((pm) => (
            <button
              key={pm.id}
              onClick={() => handlePayment(pm)}
              disabled={loading}
              className="flex flex-col items-center gap-3 rounded-2xl border-2 border-white/10 bg-white/5 p-8 active:scale-95 transition-all disabled:opacity-50"
            >
              {pm.icon && <span className="text-4xl">{pm.icon}</span>}
              <span className="text-white font-semibold text-lg">{pm.name}</span>
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-white/60">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: resolved.primaryColor, borderTopColor: "transparent" }}
            />
            <span>Traitement en cours…</span>
          </div>
        )}
      </div>
    </div>
  );
}
