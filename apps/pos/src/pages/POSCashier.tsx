import { useState, useMemo } from "react";
import { usePowerSyncQuery, useSyncStatus } from "@kash/sync";
import { SyncStatusIndicator, ProductCard, useCurrencySymbol, safeUUID } from "@kash/ui";
import { usePOSAuth } from "../contexts/POSAuthContext";
import { CartPanel } from "../components/CartPanel";
import { CategoryNav } from "../components/CategoryNav";
import type { CartItem, Product, Category } from "@kash/types";

export function POSCashierPage() {
  const { session, logout } = usePOSAuth();
  const syncStatus = useSyncStatus();
  const { formatPrice } = useCurrencySymbol();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Reads from local PowerSync SQLite (offline-first) ──────────────────────
  const { data: rawCategories } = usePowerSyncQuery<Category>(
    "SELECT * FROM categories WHERE tenant_id = ? AND is_active = 1 ORDER BY display_order",
    [session?.tenant_id ?? ""]
  );

  const { data: rawProducts } = usePowerSyncQuery<Product>(
    `SELECT * FROM products
     WHERE tenant_id = ? AND is_active = 1
     ${selectedCategoryId ? "AND category_id = ?" : ""}
     ORDER BY display_order`,
    selectedCategoryId
      ? [session?.tenant_id ?? "", selectedCategoryId]
      : [session?.tenant_id ?? ""]
  );

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return rawProducts;
    const q = searchQuery.toLowerCase();
    return rawProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [rawProducts, searchQuery]);

  // ── Cart operations ─────────────────────────────────────────────────────────
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.selected_options.length === 0
      );
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total_price: (item.quantity + 1) * item.unit_price,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          id: safeUUID(),
          product,
          quantity: 1,
          unit_price: product.price,
          total_price: product.price,
          selected_options: [],
          notes: null,
          order_type_code: null,
        },
      ];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, quantity: qty, total_price: qty * i.unit_price } : i
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, i) => sum + i.total_price, 0);

  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white overflow-hidden">
      {/* Left: product catalog */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 h-14 border-b border-white/10 flex-shrink-0 bg-[#212121]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-[#97f56d] flex items-center justify-center">
              <span className="text-xs font-black text-black">K</span>
            </div>
            <span className="font-semibold text-sm font-otacos">
              {session?.user.first_name ?? "Caisse"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <SyncStatusIndicator status={syncStatus} showLabel />
            <button
              onClick={logout}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {/* Search + category nav */}
        <div className="flex-shrink-0 bg-[#212121] border-b border-white/10">
          <div className="px-4 py-2">
            <input
              type="text"
              placeholder="Rechercher un produit…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#97f56d]/50"
            />
          </div>
          <CategoryNav
            categories={rawCategories}
            selected={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30">
              <span className="text-4xl mb-3">🍽</span>
              <p className="text-sm">Aucun produit</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currencySymbol="Dhs"
                  variant="pos"
                  onClick={() => addToCart(product)}
                  className="bg-[#2a2a2a] border-white/10 text-white hover:border-[#97f56d]/50"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: cart */}
      <CartPanel
        cart={cart}
        cartTotal={cartTotal}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onClear={clearCart}
        session={session}
        formatPrice={formatPrice}
      />
    </div>
  );
}
