import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../contexts/ShopContext";
import { useCart } from "../contexts/CartContext";
import type { Product } from "@kash/types";

export function ShopPage() {
  const { data, isLoading, error, primaryColor, backgroundColor, buttonColor, buttonTextColor, currency } = useShop();
  const { items, total, count, addItem, updateItem } = useCart();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();

  const activeCategories = useMemo(
    () => (data?.categories ?? []).filter((c) => c.is_active),
    [data?.categories]
  );

  const visibleProducts = useMemo(() => {
    return (data?.products ?? []).filter((p) => {
      if (!p.is_active || p.status !== "active") return false;
      if (selectedCategoryId && p.category_id !== selectedCategoryId) return false;
      return true;
    });
  }, [data?.products, selectedCategoryId]);

  function handleAddProduct(product: Product) {
    addItem(product);
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor }}
      >
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: primaryColor, borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-2xl mb-2">⚠️</p>
          <p className="text-gray-600 font-medium">Boutique introuvable</p>
          <p className="text-gray-400 text-sm mt-1">{error?.message}</p>
        </div>
      </div>
    );
  }

  const s = data.settings;

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b shadow-sm"
        style={{ backgroundColor: s.cc_header_color ?? primaryColor }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {s.logo_url && (
              <img src={s.logo_url} alt={data.tenant.name} className="h-10 object-contain" />
            )}
            <h1 className="font-bold text-lg text-white">{data.tenant.name}</h1>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: buttonColor, color: buttonTextColor }}
          >
            🛒 Panier
            {count > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Categories */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors"
            style={
              selectedCategoryId === null
                ? { backgroundColor: primaryColor, color: "#000", borderColor: primaryColor }
                : { backgroundColor: "transparent", color: "#666", borderColor: "#e5e7eb" }
            }
          >
            Tout
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors"
              style={
                selectedCategoryId === cat.id
                  ? { backgroundColor: primaryColor, color: "#000", borderColor: primaryColor }
                  : { backgroundColor: "transparent", color: "#666", borderColor: "#e5e7eb" }
              }
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {visibleProducts.map((product) => {
            const cartItem = items.find((i) => i.product.id === product.id && i.selected_options.length === 0);
            return (
              <div
                key={product.id}
                className="flex flex-col rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white"
                style={{ borderColor: s.cc_border_color ?? undefined }}
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full aspect-[4/3] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] flex items-center justify-center bg-gray-50 text-4xl">
                    🍽️
                  </div>
                )}
                <div className="p-3 flex flex-col gap-2">
                  <p className="font-semibold text-sm text-gray-900 line-clamp-2">{product.name}</p>
                  {product.description && (
                    <p className="text-gray-400 text-xs line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold" style={{ color: primaryColor }}>
                      {product.price.toFixed(2)} {currency}
                    </span>
                    {cartItem ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateItem(cartItem.id, cartItem.quantity - 1)}
                          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 font-bold"
                        >
                          −
                        </button>
                        <span className="text-sm font-bold">{cartItem.quantity}</span>
                        <button
                          onClick={() => updateItem(cartItem.id, cartItem.quantity + 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddProduct(product)}
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
                        style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating cart CTA */}
      {count > 0 && !cartOpen && (
        <div className="fixed bottom-6 inset-x-4 max-w-md mx-auto z-40">
          <button
            onClick={() => navigate("checkout")}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold shadow-xl"
            style={{ backgroundColor: buttonColor, color: buttonTextColor }}
          >
            <span className="bg-black/10 rounded-full px-2.5 py-0.5 text-sm">{count}</span>
            <span>Commander</span>
            <span>{total.toFixed(2)} {currency}</span>
          </button>
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-sm bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-bold text-lg">Votre panier</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 text-2xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{item.product.name}</p>
                    <p className="text-sm text-gray-400">{item.total_price.toFixed(2)} {currency}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => updateItem(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center font-bold text-gray-600">−</button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateItem(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: buttonColor, color: buttonTextColor }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-6 pt-3 border-t">
              <div className="flex justify-between font-bold text-lg mb-3">
                <span>Total</span>
                <span>{total.toFixed(2)} {currency}</span>
              </div>
              <button
                onClick={() => { setCartOpen(false); navigate("checkout"); }}
                className="w-full py-4 rounded-2xl font-bold"
                style={{ backgroundColor: buttonColor, color: buttonTextColor }}
              >
                Commander
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
