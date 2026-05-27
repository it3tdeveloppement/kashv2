import React, { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart2,
  BookOpen,
  Building2,
  ChefHat,
  ChevronsUpDown,
  FileText,
  HeadphonesIcon,
  Heart,
  Layers,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  ShieldCheck,
  Truck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { Button, cn } from "@kash/ui";
import { supabase } from "@kash/supabase";
import type { Tenant } from "@kash/types";
import { useAuth } from "../contexts/AuthContext";
import { useModulePermissions } from "../contexts/ModulePermissionsContext";

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Pilotage",
    items: [
      { label: "Tableau de bord", icon: LayoutDashboard, to: "/" },
      { label: "Analyses ventes", icon: BarChart2, to: "/sales-analytics" },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { label: "Produits", icon: ShoppingBag, to: "/products" },
      { label: "Mercuriale", icon: Layers, to: "/mercuriale" },
      { label: "Fiches techniques", icon: ChefHat, to: "/recipes" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Stock", icon: Package, to: "/inventory-stock" },
      { label: "Fournisseurs", icon: Truck, to: "/suppliers" },
      { label: "Commandes achat", icon: ShoppingCart, to: "/purchase-orders" },
      { label: "Receptions", icon: BookOpen, to: "/receptions" },
    ],
  },
  {
    title: "Clients",
    items: [
      { label: "Clients", icon: Users, to: "/customers" },
      { label: "Fidelite", icon: Heart, to: "/loyalty" },
      { label: "Marketing", icon: Megaphone, to: "/marketing-automation" },
    ],
  },
  {
    title: "Finance",
    items: [{ label: "Facturation", icon: FileText, to: "/billing" }],
  },
  {
    title: "RH",
    items: [
      { label: "Employes", icon: UserCheck, to: "/hr/employees" },
      { label: "Planning", icon: LayoutDashboard, to: "/hr/planning" },
      { label: "Pointage", icon: Activity, to: "/hr/timesheets" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Etablissements", icon: Building2, to: "/tenants" },
      { label: "Utilisateurs", icon: Users, to: "/users" },
      { label: "Controle acces", icon: ShieldCheck, to: "/access-control" },
      { label: "Parametres", icon: Settings, to: "/settings" },
      { label: "Monitoring", icon: Activity, to: "/monitoring" },
      { label: "Support", icon: HeadphonesIcon, to: "/support" },
    ],
  },
];

const ROUTE_TITLES: Record<string, string> = {
  "/": "Tableau de bord",
  "/sales-analytics": "Analyses ventes",
  "/products": "Produits",
  "/mercuriale": "Mercuriale",
  "/recipes": "Fiches techniques",
  "/inventory-stock": "Stock",
  "/suppliers": "Fournisseurs",
  "/purchase-orders": "Commandes achat",
  "/receptions": "Receptions",
  "/customers": "Clients",
  "/loyalty": "Fidelite",
  "/marketing-automation": "Marketing",
  "/billing": "Facturation",
  "/hr/employees": "Employes",
  "/hr/planning": "Planning",
  "/hr/timesheets": "Pointage",
  "/tenants": "Etablissements",
  "/users": "Utilisateurs",
  "/access-control": "Controle acces",
  "/settings": "Parametres",
  "/monitoring": "Monitoring",
  "/support": "Support",
};

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

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, signOut, isSuperAdmin, currentTenantId, switchTenant } = useAuth();
  const { canReadModule } = useModulePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: tenantOptions = [] } = useQuery({
    queryKey: ["tenant-context-options", isSuperAdmin],
    queryFn: async () => {
      if (!isSuperAdmin) return [];
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("parent_tenant_id", { nullsFirst: true })
        .order("name");
      if (error) throw error;
      return (data ?? []) as Tenant[];
    },
    enabled: isSuperAdmin,
  });

  const currentPageTitle = ROUTE_TITLES[location.pathname] ?? "Backoffice";
  const selectedTenant = useMemo(
    () => tenantOptions.find((tenant) => tenant.id === currentTenantId),
    [tenantOptions, currentTenantId]
  );
  const visibleGroups = useMemo(() => {
    if (isSuperAdmin || !currentTenantId) return NAV_GROUPS;

    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const moduleCode = ROUTE_MODULE_MAP[item.to];
        if (!moduleCode) return true;
        return canReadModule(moduleCode);
      }),
    })).filter((group) => group.items.length > 0);
  }, [canReadModule, currentTenantId, isSuperAdmin]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <aside
        className={cn(
          "m-2 hidden rounded-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl lg:flex lg:flex-col",
          sidebarOpen ? "w-72" : "w-20"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="/logo-kash.svg"
              alt="Kash"
              className={cn("h-9 w-auto object-contain", !sidebarOpen && "h-8")}
            />
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Kash Backoffice</p>
                <p className="truncate text-[11px] text-sidebar-foreground/60">Restaurant OS</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            className="rounded-md p-1.5 text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {sidebarOpen && isSuperAdmin && (
            <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/45 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/55">
                Contexte multi tenant
              </p>
              <label className="relative block">
                <select
                  value={currentTenantId ?? ""}
                  onChange={(event) => switchTenant(event.target.value || null)}
                  className="h-9 w-full appearance-none rounded-lg border border-sidebar-border bg-sidebar px-2 pr-8 text-xs text-sidebar-foreground outline-none focus:ring-2 focus:ring-sidebar-ring"
                >
                  <option value="">Global superadmin</option>
                  {tenantOptions.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.parent_tenant_id ? "  - " : ""}
                      {tenant.name}
                    </option>
                  ))}
                </select>
                <ChevronsUpDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-sidebar-foreground/50" />
              </label>
            </div>
          )}

          {visibleGroups.map((group) => (
            <div key={group.title}>
              {sidebarOpen && (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
                  {group.title}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isActive &&
                            "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          {sidebarOpen && profile && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/45 px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-black">
                {profile.first_name?.[0] ?? profile.email[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">
                  {(profile.first_name ?? "").trim()} {(profile.last_name ?? "").trim()}
                </p>
                <p className="truncate text-[10px] text-sidebar-foreground/60">
                  {isSuperAdmin ? "Superadmin" : profile.role}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
              "text-sidebar-foreground hover:bg-destructive/15 hover:text-red-200"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Deconnexion</span>}
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="mx-2 mt-2 rounded-2xl border border-border/70 bg-card/85 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((value) => !value)}
              className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Backoffice
              </p>
              <h1 className="truncate text-lg font-semibold text-foreground">{currentPageTitle}</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {selectedTenant && (
                <span className="hidden rounded-lg border border-border bg-muted/80 px-2.5 py-1 text-xs font-medium text-foreground md:inline-flex">
                  {selectedTenant.name}
                </span>
              )}
              {isSuperAdmin && !selectedTenant && (
                <span className="hidden rounded-lg border border-primary/35 bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary md:inline-flex">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Global
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg border-border bg-card"
                onClick={() => navigate("/tenants")}
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Tenants</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-2 pb-2 pt-2">
          <section className="min-h-full rounded-2xl border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
