import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { POSAuthProvider } from "./contexts/POSAuthContext";
import { SyncProvider } from "./contexts/SyncContext";
import { POSProtectedRoute } from "./components/POSProtectedRoute";

import { POSLoginPage } from "./pages/POSLogin";
import { POSCashierPage } from "./pages/POSCashier";
import { POSMobilePage } from "./pages/POSMobile";
import { POSTableServicePage } from "./pages/POSTableService";

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
        <POSAuthProvider>
          <SyncProvider>
            <Routes>
              <Route path="/pos/login" element={<POSLoginPage />} />

              <Route element={<POSProtectedRoute />}>
                <Route path="/pos/cashier" element={<POSCashierPage />} />
                <Route path="/pos/mobile" element={<POSMobilePage />} />
                <Route path="/pos/tables" element={<POSTableServicePage />} />
              </Route>

              <Route path="*" element={<Navigate to="/pos/login" replace />} />
            </Routes>

            <Toaster richColors position="top-center" />
          </SyncProvider>
        </POSAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
