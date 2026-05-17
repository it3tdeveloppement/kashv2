import type { StepProps } from "../../types/kiosk";

const CURRENCY_SYMBOLS: Record<string, string> = {
  MAD: "Dhs",
  EUR: "€",
  USD: "$",
  GBP: "£",
};

export function CartStep({ state, resolved, dispatch, cartTotal }: StepProps) {
  const currency = CURRENCY_SYMBOLS[resolved.defaultCurrency] ?? resolved.defaultCurrency;

  function handleCheckout() {
    if (resolved.loyaltyEnabled) {
      dispatch({ type: "SET_STEP", step: "loyalty" });
    } else {
      dispatch({ type: "SET_STEP", step: "payment" });
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
          onClick={() => dispatch({ type: "SET_STEP", step: "menu" })}
          className="text-white/60 hover:text-white text-2xl leading-none"
        >
          ←
        </button>
        <h2 className="text-white font-bold text-xl flex-1">Votre commande</h2>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {state.cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/40">
            <span className="text-5xl">🛒</span>
            <p>Votre panier est vide</p>
          </div>
        ) : (
          state.cart.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-4 bg-white/5 rounded-2xl p-4"
            >
              {item.product.image_url && (
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-14 h-14 rounded-xl object-contain bg-white/5 shrink-0"
                />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold">{item.product.name}</p>
                {item.selected_options.length > 0 && (
                  <p className="text-white/40 text-xs mt-0.5 line-clamp-2">
                    {item.selected_options.map((o) => o.option_name).join(", ")}
                  </p>
                )}
                <p className="font-semibold mt-1" style={{ color: resolved.primaryColor }}>
                  {item.total_price.toFixed(2)} {currency}
                </p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() =>
                    dispatch({ type: "UPDATE_CART_ITEM", id: item.id, quantity: item.quantity - 1 })
                  }
                  className="w-9 h-9 rounded-full border border-white/20 text-white flex items-center justify-center text-lg font-bold"
                >
                  −
                </button>
                <span className="text-white font-bold w-4 text-center">{item.quantity}</span>
                <button
                  onClick={() =>
                    dispatch({ type: "UPDATE_CART_ITEM", id: item.id, quantity: item.quantity + 1 })
                  }
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold text-black"
                  style={{ backgroundColor: resolved.primaryColor }}
                >
                  +
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Total + CTA */}
      {state.cart.length > 0 && (
        <div className="shrink-0 px-6 pb-8 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60 text-lg">Total</span>
            <span className="text-white font-bold text-2xl">
              {cartTotal.toFixed(2)} {currency}
            </span>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full py-5 rounded-2xl font-bold text-xl text-black"
            style={{ backgroundColor: resolved.primaryColor }}
          >
            Commander
          </button>
        </div>
      )}
    </div>
  );
}
