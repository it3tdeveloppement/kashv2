import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingBag, Users, BarChart2, Settings,
  Building2, Package, ShoppingCart, Truck, ChefHat, BookOpen,
  FileText, UserCheck, Heart, Megaphone, Activity, HeadphonesIcon,
  Layers, LogOut, Menu, X,
} from "lucide-react";
import { cn } from "@kash/ui";
import { useAuth } from "../contexts/AuthContext";

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
  badge?: string;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Vue d'ensemble",
    items: [
      { label: "Tableau de bord", icon: LayoutDashboard, to: "/" },
      { label: "Analytiques ventes", icon: BarChart2, to: "/sales-analytics" },
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
    title: "Opérations",
    items: [
      { label: "Stock", icon: Package, to: "/inventory-stock" },
      { label: "Fournisseurs", icon: Truck, to: "/suppliers" },
      { label: "Commandes achat", icon: ShoppingCart, to: "/purchase-orders" },
      { label: "Réceptions", icon: BookOpen, to: "/receptions" },
    ],
  },
  {
    title: "Clients",
    items: [
      { label: "Clients", icon: Users, to: "/customers" },
      { label: "Fidélité", icon: Heart, to: "/loyalty" },
      { label: "Marketing", icon: Megaphone, to: "/marketing-automation" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Facturation", icon: FileText, to: "/billing" },
    ],
  },
  {
    title: "RH",
    items: [
      { label: "Employés", icon: UserCheck, to: "/hr/employees" },
      { label: "Planning", icon: LayoutDashboard, to: "/hr/planning" },
      { label: "Pointage", icon: Activity, to: "/hr/timesheets" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Établissements", icon: Building2, to: "/tenants" },
      { label: "Paramètres", icon: Settings, to: "/settings" },
      { label: "Monitoring", icon: Activity, to: "/monitoring" },
      { label: "Support", icon: HeadphonesIcon, to: "/support" },
    ],
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, signOut, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r bg-sidebar transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border flex-shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-xs font-black text-black">K</span>
              </div>
              <span className="font-bold text-sidebar-foreground font-otacos">Kash</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground ml-auto"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              {sidebarOpen && (
                <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  {group.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors",
                          "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isActive &&
                            "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground font-medium"
                        )
                      }
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 flex-shrink-0">
          {sidebarOpen && profile && (
            <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-black">
                  {profile.first_name?.[0] ?? profile.email[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {profile.first_name} {profile.last_name}
                </p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">
                  {isSuperAdmin ? "Superadmin" : profile.role}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm",
              "text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
