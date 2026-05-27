import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrencySymbol } from "@kash/ui";
import type { Product } from "@kash/types";
import { useCart } from "../contexts/CartContext";
import { useShop } from "../contexts/ShopContext";

export function ShopPage() {
  const {
    data,
    isLoading,
    error,
    primaryColor,
    backgroundColor,
    buttonColor,
    buttonTextColor,
    currency,
  } = useShop();
  const { items, total, count, addItem, updateItem } = useCart();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();
  const { formatPrice } = useCurrencySymbol(currency);

  const activeCategories = useMemo(
    () => (data?.categories ?? []).filter((category) => category.is_active),
    [data?.categories]
  );

  const visibleProducts = useMemo(() => {
    return (data?.products ?? []).filter((product) => {
      if (!product.is_active || product.status !== "active") return false;
      if (selectedCategoryId && product.category_id !== selectedCategoryId) return false;
      return true;
    });
  }, [data?.products, selectedCategoryId]);

  function handleAddProduct(product: Product) {
    addItem(product);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor }}>
        <div
          className="h-10 w-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: primaryColor, borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6f4]">
        <div className="rounded-xl border border-red-200 bg-white p-6 text-center">
          <p className="text-lg font-semibold text-red-600">Boutique introuvable</p>
          <p className="mt-1 text-sm text-red-400">{error?.message}</p>
        </div>
      </div>
    );
  }

  const settings = data.settings;

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <header
        className="sticky top-0 z-40 border-b shadow-sm"
        style={{ backgroundColor: settings.cc_header_color ?? primaryColor }}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo-kash.svg" alt="Kash" className="h-8 w-auto object-contain" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{data.tenant.name}</p>
              <p className="truncate text-xs text-white/80">Click and Collect</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative rounded-xl px-4 py-2 text-sm font-semibold"
            style={{ backgroundColor: buttonColor, color: buttonTextColor }}
          >
            Panier
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-4">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedCategoryId(null)}
            className="shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold transition"
            style={
              selectedCategoryId === null
                ? { backgroundColor: primaryColor, color: "#000", borderColor: primaryColor }
                : { backgroundColor: "#ffffff", color: "#4b5563", borderColor: "#e5e7eb" }
            }
          >
            Tout
          </button>
          {activeCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategoryId(category.id)}
              className="shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold transition"
              style={
                selectedCategoryId === category.id
                  ? { backgroundColor: primaryColor, color: "#000", borderColor: primaryColor }
                  : { backgroundColor: "#ffffff", color: "#4b5563", borderColor: "#e5e7eb" }
              }
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {visibleProducts.map((product) => {
            const cartItem = items.find(
              (item) => item.product.id === product.id && item.selected_options.length === 0
            );

            return (
              <article
                key={product.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
                style={{ borderColor: settings.cc_border_color ?? undefined }}
              >
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center bg-gray-50 text-3xl">PLAT</div>
                )}

                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="line-clamp-2 text-sm font-semibold text-gray-900">{product.name}</p>
                  {product.description && (
                    <p className="line-clamp-2 text-xs text-gray-500">{product.description}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="text-sm font-bold" style={{ color: primaryColor }}>
                      {formatPrice(product.price)}
                    </span>
                    {cartItem ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateItem(cartItem.id, cartItem.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-600"
                        >
                          -
                        </button>
                        <span className="w-4 text-center text-sm font-bold">{cartItem.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItem(cartItem.id, cartItem.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
                          style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddProduct(product)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold"
                        style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {count > 0 && !cartOpen && (
        <div className="fixed inset-x-4 bottom-6 z-40 mx-auto max-w-md">
          <button
            type="button"
            onClick={() => navigate("checkout")}
            className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-sm font-bold shadow-xl"
            style={{ backgroundColor: buttonColor, color: buttonTextColor }}
          >
            <span className="rounded-full bg-black/10 px-2 py-0.5">{count}</span>
            <span>Commander</span>
            <span>{formatPrice(total)}</span>
          </button>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Fermer panier"
            onClick={() => setCartOpen(false)}
            className="flex-1 bg-black/40"
          />
          <aside className="flex w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-bold">Votre panier</h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="text-2xl leading-none text-gray-400"
              >
                x
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-500">{formatPrice(item.total_price)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 font-bold text-gray-600"
                    >
                      -
                    </button>
                    <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full font-bold"
                      style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t px-5 pb-6 pt-3">
              <div className="mb-3 flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate("checkout");
                }}
                className="w-full rounded-2xl py-4 font-bold"
                style={{ backgroundColor: buttonColor, color: buttonTextColor }}
              >
                Commander
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
