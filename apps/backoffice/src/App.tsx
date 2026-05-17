import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Pages
import { AuthPage } from "./pages/Auth";
import { DashboardPage } from "./pages/Dashboard";
import { TenantsPage } from "./pages/Tenants";
import { ProductsPage } from "./pages/Products";
import { SettingsPage } from "./pages/Settings";
import { SalesAnalyticsPage } from "./pages/SalesAnalytics";
import { CustomersPage } from "./pages/Customers";
import { LoyaltyPage } from "./pages/Loyalty";
import { InventoryPage } from "./pages/Inventory";
import { SuppliersPage } from "./pages/Suppliers";
import { PurchaseOrdersPage } from "./pages/PurchaseOrders";
import { ReceptionsPage } from "./pages/Receptions";
import { RecipesPage } from "./pages/Recipes";
import { MercurialePage } from "./pages/Mercuriale";
import { BillingPage } from "./pages/Billing";
import { HrEmployeesPage } from "./pages/HR/Employees";
import { HrPlanningPage } from "./pages/HR/Planning";
import { HrTimesheetsPage } from "./pages/HR/Timesheets";
import { MarketingPage } from "./pages/Marketing";
import { MonitoringPage } from "./pages/Monitoring";
import { SupportPage } from "./pages/Support";
import { NotFoundPage } from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 min
      gcTime: 10 * 60 * 1000,         // 10 min
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected backoffice routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tenants" element={<TenantsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/sales-analytics" element={<SalesAnalyticsPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/loyalty" element={<LoyaltyPage />} />
              <Route path="/inventory-stock" element={<InventoryPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="/receptions" element={<ReceptionsPage />} />
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/mercuriale" element={<MercurialePage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/hr/employees" element={<HrEmployeesPage />} />
              <Route path="/hr/planning" element={<HrPlanningPage />} />
              <Route path="/hr/timesheets" element={<HrTimesheetsPage />} />
              <Route path="/marketing-automation" element={<MarketingPage />} />
              <Route path="/monitoring" element={<MonitoringPage />} />
              <Route path="/support" element={<SupportPage />} />
            </Route>

            {/* Fallbacks */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>

          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
