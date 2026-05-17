import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { KioskBootstrap } from "./pages/KioskBootstrap";
import { OrderConfirmationPage } from "./pages/OrderConfirmation";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* /terminal-display/:tenantId — boots sync then renders KioskFlow */}
        <Route path="/terminal-display/:tenantId" element={<KioskBootstrap />} />
        <Route
          path="/terminal-display/:tenantId/order-confirmation/:orderNumber"
          element={<OrderConfirmationPage />}
        />
        {/* Default: show instructions */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-black flex items-center justify-center text-white/40 text-sm">
              Accédez via /terminal-display/:tenantId
            </div>
          }
        />
      </Routes>
      <Toaster richColors position="top-center" />
    </BrowserRouter>
  );
}
