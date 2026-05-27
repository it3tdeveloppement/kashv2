import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@kash/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Button, Card, CardContent, useCurrencySymbol } from "@kash/ui";
import {
  Building2,
  ChevronRight,
  ChefHat,
  CreditCard,
  Package,
  ShoppingBag,
  Store,
  TabletSmartphone,
  TrendingUp,
  Users,
} from "lucide-react";

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  totalCustomers: number;
  activeProducts: number;
}

const QUICK_ACCESS = [
  {
    title: "POS Caisse",
    description: "Interface de vente en magasin",
    path: "/pos/login",
    icon: CreditCard,
  },
  {
    title: "Kiosk",
    description: "Parcours commande client",
    path: "/terminal-display",
    icon: TabletSmartphone,
  },
  {
    title: "Cuisine KDS",
    description: "Suivi de production en temps reel",
    path: "/kitchen-display",
    icon: ChefHat,
  },
  {
    title: "Click and Collect",
    description: "Canal e-commerce",
    path: "/shop",
    icon: Store,
  },
] as const;

export function DashboardPage() {
  const { currentTenantId, profile, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { formatPrice } = useCurrencySymbol("MAD");

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", currentTenantId],
    enabled: !!currentTenantId,
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [txResult, customerResult, productResult] = await Promise.all([
        supabase
          .from("pos_transactions")
          .select("total_amount", { count: "exact" })
          .eq("tenant_id", currentTenantId)
          .eq("status", "completed")
          .gte("created_at", today.toISOString()),
        supabase
          .from("customers")
          .select("id", { count: "exact" })
          .eq("tenant_id", currentTenantId),
        supabase
          .from("products")
          .select("id", { count: "exact" })
          .eq("tenant_id", currentTenantId)
          .eq("is_active", true),
      ]);

      const todaySales = (txResult.data ?? []).reduce((sum, tx) => sum + (tx.total_amount ?? 0), 0);

      return {
        todaySales,
        todayTransactions: txResult.count ?? 0,
        totalCustomers: customerResult.count ?? 0,
        activeProducts: productResult.count ?? 0,
      };
    },
  });

  const { data: childTenants = [] } = useQuery({
    queryKey: ["child-tenants", currentTenantId],
    enabled: !!currentTenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, slug, is_active")
        .eq("parent_tenant_id", currentTenantId)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const statCards = useMemo(
    () => [
      {
        title: "Ventes du jour",
        value: formatPrice(stats?.todaySales ?? 0),
        icon: TrendingUp,
      },
      {
        title: "Transactions",
        value: String(stats?.todayTransactions ?? 0),
        icon: ShoppingBag,
      },
      {
        title: "Clients",
        value: String(stats?.totalCustomers ?? 0),
        icon: Users,
      },
      {
        title: "Produits actifs",
        value: String(stats?.activeProducts ?? 0),
        icon: Package,
      },
    ],
    [formatPrice, stats]
  );

  return (
    <div className="space-y-5 p-6">
      <section className="rounded-2xl border border-border/70 bg-gradient-to-r from-[#15392d] via-[#1b4a39] to-[#255d47] p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold leading-tight">Bonjour {profile?.first_name ?? "Equipe"}</h1>
            <p className="max-w-xl text-sm text-white/80">
              Pilotage en temps reel des ventes, du catalogue et de vos etablissements.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="border border-white/20 bg-white/10 text-white hover:bg-white/15">
              {isSuperAdmin ? "Superadmin" : "Tenant"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-white/25 bg-white/10 text-white hover:bg-white/20"
              onClick={() => navigate("/tenants")}
            >
              <Building2 className="h-4 w-4" />
              Gerer tenants
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="rounded-xl border-border/70 bg-card/85 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-xl border border-primary/30 bg-primary/15 p-2.5 text-primary">
                <card.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.title}</p>
                <p className="truncate text-2xl font-semibold text-foreground">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-xl border-border/70 bg-card/85 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Acces rapides plateforme</h2>
              <span className="text-xs text-muted-foreground">Ouverture sur nouvel onglet</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {QUICK_ACCESS.map((item) => (
                <a
                  key={item.title}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl border border-border/70 bg-background/75 p-4 transition hover:border-primary/45 hover:bg-primary/10"
                >
                  <div className="mb-3 inline-flex rounded-lg border border-border bg-card p-2">
                    <item.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  <span className="mt-3 inline-flex items-center text-xs font-medium text-primary">
                    Ouvrir
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/70 bg-card/85 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Etablissements enfants</h2>
              <span className="text-xs text-muted-foreground">{childTenants.length} actif(s)</span>
            </div>

            <div className="space-y-2">
              {childTenants.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Aucun etablissement enfant pour ce tenant.
                </div>
              )}

              {childTenants.map((tenant) => (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => navigate("/tenants")}
                  className="flex w-full items-center gap-3 rounded-lg border border-border/70 bg-background/75 px-3 py-3 text-left transition hover:border-primary/40 hover:bg-primary/10"
                >
                  <div className="rounded-md border border-border bg-card p-2">
                    <Building2 className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{tenant.name}</p>
                    <p className="truncate text-xs text-muted-foreground">/{tenant.slug}</p>
                  </div>
                  <Badge variant={tenant.is_active ? "default" : "secondary"}>
                    {tenant.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
