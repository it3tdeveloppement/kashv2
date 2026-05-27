import { Navigate, Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@kash/ui";
import { useAuth } from "../contexts/AuthContext";
import { ModulePermissionsProvider, useModulePermissions } from "../contexts/ModulePermissionsContext";
import { AppLayout } from "./AppLayout";

/**
 * Blocks route render until both user AND profile are loaded.
 * Redirects to /auth if not authenticated.
 */
const ROUTE_MODULE_MAP: Record<string, string> = {
  "/": "dashboard",
  "/sales-analytics": "dashboard",
  "/products": "products",
  "/mercuriale": "products",
  "/recipes": "products",
  "/inventory-stock": "inventory",
  "/suppliers": "inventory",
  "/purchase-orders": "inventory",
  "/receptions": "inventory",
  "/customers": "customers",
  "/loyalty": "customers",
  "/marketing-automation": "customers",
  "/billing": "billing",
  "/hr/employees": "settings",
  "/hr/planning": "settings",
  "/hr/timesheets": "settings",
  "/tenants": "settings",
  "/users": "settings",
  "/access-control": "settings",
  "/settings": "settings",
  "/monitoring": "settings",
  "/support": "settings",
};

export function ProtectedRoute() {
  return (
    <ModulePermissionsProvider>
      <ProtectedRouteInner />
    </ModulePermissionsProvider>
  );
}

function ProtectedRouteInner() {
  const { isAuthenticated, isLoading, currentTenantId, isSuperAdmin } = useAuth();
  const location = useLocation();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const shouldCheckModules = !!currentTenantId && !isSuperAdmin && isAuthenticated;
  const { canReadModule, isLoading: isLoadingModules, isError: isErrorModules } = useModulePermissions();

  useEffect(() => {
    if (isLoading || (shouldCheckModules && isLoadingModules)) {
      setLoadingTimedOut(false);
      const timer = setTimeout(() => setLoadingTimedOut(true), 12_000);
      return () => clearTimeout(timer);
    }
    setLoadingTimedOut(false);
    return;
  }, [isLoading, isLoadingModules, shouldCheckModules]);

  if (loadingTimedOut) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Connexion serveur lente</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Le backoffice n&apos;arrive pas a terminer le chargement. Verifiez Supabase puis relancez.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={() => window.location.reload()}>Recharger</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/auth")}>
              Retour auth
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || (shouldCheckModules && isLoadingModules)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (shouldCheckModules && !isErrorModules) {
    const routeModule = ROUTE_MODULE_MAP[location.pathname];
    if (routeModule && !canReadModule(routeModule)) {
      return <Navigate to="/" replace />;
    }
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
