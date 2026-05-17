import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@kash/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, Button, Badge } from "@kash/ui";
import { Plus, Search, Edit2, ImageOff, Package } from "lucide-react";
import { Input } from "@kash/ui";
import { toast } from "sonner";
import type { Product, Category } from "@kash/types";

export function ProductsPage() {
  const { currentTenantId } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) return [];
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("tenant_id", currentTenantId)
        .order("display_order");
      return (data ?? []) as Category[];
    },
    enabled: !!currentTenantId,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", currentTenantId, selectedCategory],
    queryFn: async () => {
      if (!currentTenantId) return [];
      let query = supabase
        .from("products")
        .select("*")
        .eq("tenant_id", currentTenantId)
        .order("display_order");

      if (selectedCategory) query = query.eq("category_id", selectedCategory);
      const { data } = await query;
      return (data ?? []) as Product[];
    },
    enabled: !!currentTenantId,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active })
        .eq("id", id)
        .select();
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produit mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-otacos">Produits</h1>
          <p className="text-sm text-muted-foreground">{products.length} produit(s)</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Nouveau produit
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit…"
            className="pl-9"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              !selectedCategory
                ? "bg-primary text-black border-primary"
                : "hover:border-primary/50"
            }`}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedCategory === cat.id
                  ? "bg-primary text-black border-primary"
                  : "hover:border-primary/50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-muted/30 h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((product) => (
            <Card key={product.id} className="overflow-hidden group">
              <div className="relative aspect-square bg-muted/30">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-7 h-7 rounded-md bg-background/90 flex items-center justify-center hover:bg-background shadow-sm">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {!product.is_active && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <Badge variant="secondary">Inactif</Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate">{product.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-primary text-sm">
                    {product.price.toFixed(2)} Dhs
                  </span>
                  <button
                    onClick={() =>
                      toggleActive.mutate({ id: product.id, is_active: !product.is_active })
                    }
                    className={`w-8 h-4 rounded-full transition-colors ${
                      product.is_active ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span className="sr-only">Toggle</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun produit trouvé</p>
        </div>
      )}
    </div>
  );
}
