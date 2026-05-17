import { useQuery } from "@tanstack/react-query";
import { supabase } from "@kash/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@kash/ui";
import { ShoppingBag, Users, TrendingUp, Package, Building2 } from "lucide-react";

export function DashboardPage() {
  const { currentTenantId, profile, isSuperAdmin } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [txResult, customerResult, productResult] = await Promise.all([
        supabase
          .from("pos_transactions")
          .select("total_amount, status", { count: "exact" })
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

      const todaySales = (txResult.data ?? []).reduce(
        (sum, tx) => sum + tx.total_amount,
        0
      );

      return {
        todaySales,
        todayTransactions: txResult.count ?? 0,
        totalCustomers: customerResult.count ?? 0,
        activeProducts: productResult.count ?? 0,
      };
    },
    enabled: !!currentTenantId,
  });

  const { data: childTenants } = useQuery({
    queryKey: ["child-tenants", currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) return [];
      const { data } = await supabase
        .from("tenants")
        .select("id, name, slug, is_active")
        .eq("parent_tenant_id", currentTenantId)
        .order("name");
      return data ?? [];
    },
    enabled: !!currentTenantId,
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-otacos text-foreground">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bonjour {profile?.first_name ?? ""}
          {isSuperAdmin && (
            <span className="ml-2 inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
              Superadmin
            </span>
          )}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Ventes du jour"
          value={`${(stats?.todaySales ?? 0).toFixed(2)} Dhs`}
          icon={TrendingUp}
          iconColor="text-primary"
        />
        <KpiCard
          title="Transactions"
          value={String(stats?.todayTransactions ?? 0)}
          icon={ShoppingBag}
          iconColor="text-blue-500"
        />
        <KpiCard
          title="Clients"
          value={String(stats?.totalCustomers ?? 0)}
          icon={Users}
          iconColor="text-violet-500"
        />
        <KpiCard
          title="Produits actifs"
          value={String(stats?.activeProducts ?? 0)}
          icon={Package}
          iconColor="text-orange-500"
        />
      </div>

      {/* Establishments */}
      {childTenants && childTenants.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Établissements ({childTenants.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {childTenants.map((tenant) => (
              <Card key={tenant.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{tenant.name}</p>
                    <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                  </div>
                  <div className="ml-auto">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        tenant.is_active ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accès rapides</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "POS Caisse", href: "/pos/login", icon: "🖥️" },
            { label: "Kiosk", href: "/terminal-display", icon: "📱" },
            { label: "Cuisine (KDS)", href: "/kitchen-display", icon: "🍳" },
            { label: "Click & Collect", href: "/shop", icon: "🛒" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-center"
            >
              <span className="text-2xl">{link.icon}</span>
              <span className="text-xs font-medium text-foreground">{link.label}</span>
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`${iconColor} bg-current/10 rounded-lg p-2.5`} style={{ backgroundColor: "transparent" }}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold text-foreground font-otacos">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
