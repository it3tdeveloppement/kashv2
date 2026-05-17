import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "./contexts/CartContext";
import { ShopProvider } from "./contexts/ShopContext";
import { ShopPage } from "./pages/ShopPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderTrackPage } from "./pages/OrderTrackPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Shop routes — all share the same tenant slug + cart state */}
          <Route
            path="/:tenantSlug/*"
            element={
              <ShopProvider>
                <CartProvider>
                  <Routes>
                    <Route index element={<ShopPage />} />
                    <Route path="checkout" element={<CheckoutPage />} />
                    <Route path="order-track/:orderToken" element={<OrderTrackPage />} />
                  </Routes>
                </CartProvider>
              </ShopProvider>
            }
          />

          {/* Root: show a generic landing */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#97f56d] flex items-center justify-center">
                  <span className="text-3xl font-black text-black font-otacos">K</span>
                </div>
                <p className="text-gray-500 text-sm">Accédez via /:tenantSlug</p>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
