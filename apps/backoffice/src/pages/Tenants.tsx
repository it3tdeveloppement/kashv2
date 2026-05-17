import { useQuery } from "@tanstack/react-query";
import { supabase } from "@kash/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, Button, Badge } from "@kash/ui";
import { Plus, Building2 } from "lucide-react";
import type { Tenant } from "@kash/types";

export function TenantsPage() {
  const { currentTenantId } = useAuth();

  const { data: children = [] } = useQuery({
    queryKey: ["child-tenants-full", currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) return [];
      const { data } = await supabase
        .from("tenants")
        .select("*")
        .eq("parent_tenant_id", currentTenantId)
        .order("name");
      return (data ?? []) as Tenant[];
    },
    enabled: !!currentTenantId,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-otacos">Établissements</h1>
          <p className="text-sm text-muted-foreground">{children.length} établissement(s)</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Nouvel établissement
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.map((tenant) => (
          <Card key={tenant.id} className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <Badge variant={tenant.is_active ? "default" : "secondary"}>
                  {tenant.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>
              <h3 className="font-semibold text-foreground">{tenant.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">/{tenant.slug}</p>

              <div className="flex gap-2 mt-4">
                <span className="text-xs bg-muted px-2 py-0.5 rounded">POS</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded">Kiosk</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded">KDS</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add new card */}
        <button className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 p-8 hover:border-primary/40 hover:bg-primary/5 transition-all">
          <Plus className="w-8 h-8 text-muted-foreground/40" />
          <span className="text-sm text-muted-foreground">Ajouter un établissement</span>
        </button>
      </div>
    </div>
  );
}
