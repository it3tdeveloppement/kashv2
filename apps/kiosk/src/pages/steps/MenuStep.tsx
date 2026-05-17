import { useState, useMemo } from "react";
import type { StepProps } from "../../types/kiosk";
import type { Product, CartItem } from "@kash/types";
import { safeUUID } from "@kash/ui";

const CURRENCY_SYMBOLS: Record<string, string> = {
  MAD: "Dhs",
  EUR: "€",
  USD: "$",
  GBP: "£",
};

export function MenuStep({ state, settings, resolved, dispatch, cartTotal, cartCount }: StepProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const currency = CURRENCY_SYMBOLS[resolved.defaultCurrency] ?? resolved.defaultCurrency;

  const orderTypeCode = state.selectedOrderType?.code ?? null;

  const activeCategories = useMemo(
    () => settings.categories.filter((c) => c.is_active),
    [settings.categories]
  );

  const visibleProducts = useMemo(() => {
    return settings.products.filter((p) => {
      if (!p.is_active || p.status !== "active") return false;
      if (selectedCategoryId && p.category_id !== selectedCategoryId) return false;
      if (orderTypeCode && p.available_order_type_codes.length > 0) {
        if (!p.available_order_type_codes.includes(orderTypeCode)) return false;
      }
      return true;
    });
  }, [settings.products, selectedCategoryId, orderTypeCode]);

  function getProductPhaseCount(productId: string): number {
    return settings.productCustomizationPhases.filter((pcp) => pcp.product_id === productId).length;
  }

  function handleProductTap(product: Product) {
    const hasCustomization = getProductPhaseCount(product.id) > 0;
    if (hasCustomization) {
      dispatch({ type: "SET_PENDING_PRODUCT", product });
    } else {
      const item: CartItem = {
        id: safeUUID(),
        product,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
        selected_options: [],
        notes: null,
        order_type_code: orderTypeCode,
      };
      dispatch({ type: "ADD_TO_CART", item });
    }
  }

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: resolved.backgroundColor }}
    >
      {/* Category pills */}
      <div className="flex gap-3 px-4 py-4 overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className="shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-colors"
          style={
            selectedCategoryId === null
              ? { backgroundColor: resolved.primaryColor, color: "#000" }
              : { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" }
          }
        >
          Tout
        </button>
        {activeCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className="shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-colors"
            style={
              selectedCategoryId === cat.id
                ? { backgroundColor: resolved.primaryColor, color: "#000" }
                : { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" }
            }
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-3 gap-4">
          {visibleProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleProductTap(product)}
              className="flex flex-col rounded-2xl overflow-hidden bg-white/5 border border-white/10 active:scale-95 transition-transform text-left"
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full aspect-square object-contain bg-white/5"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-white/5 text-4xl">
                  🍽️
                </div>
              )}
              <div className="p-3">
                <p className="text-white font-semibold text-sm line-clamp-2">{product.name}</p>
                <p className="font-bold mt-1" style={{ color: resolved.primaryColor }}>
                  {product.price.toFixed(2)} {currency}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart CTA */}
      {cartCount > 0 && (
        <div className="shrink-0 px-4 pb-6 pt-2">
          <button
            onClick={() => dispatch({ type: "SET_STEP", step: "cart" })}
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-lg text-black"
            style={{ backgroundColor: resolved.primaryColor }}
          >
            <span className="bg-black/20 rounded-full px-3 py-1 text-sm">{cartCount}</span>
            <span>Voir le panier</span>
            <span>
              {cartTotal.toFixed(2)} {currency}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
