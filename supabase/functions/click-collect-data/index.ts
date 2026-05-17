import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tenant_slug } = await req.json();
    if (!tenant_slug) throw new Error("tenant_slug is required");

    const db = getServiceClient();

    const { data: tenant, error: tenantErr } = await db
      .from("tenants")
      .select("id, name, slug, parent_tenant_id")
      .eq("slug", tenant_slug)
      .eq("is_active", true)
      .single();

    if (tenantErr || !tenant) throw new Error("Boutique introuvable");

    const tenantIds = [tenant.id];
    if (tenant.parent_tenant_id) tenantIds.push(tenant.parent_tenant_id);

    const [settings, parentSettings, products, categories, phases, options, pcps, orderTypes, establishment] =
      await Promise.all([
        db.from("tenant_settings").select("*").eq("tenant_id", tenant.id).single().then((r) => r.data),
        tenant.parent_tenant_id
          ? db.from("tenant_settings").select("*").eq("tenant_id", tenant.parent_tenant_id).single().then((r) => r.data)
          : Promise.resolve(null),
        db.from("products").select("*").in("tenant_id", tenantIds).eq("is_active", true).eq("status", "active"),
        db.from("categories").select("*").in("tenant_id", tenantIds).eq("is_active", true),
        db.from("customization_phases").select("*").in("tenant_id", tenantIds).eq("is_active", true),
        db.from("customization_options").select("*").in("tenant_id", tenantIds).eq("is_available", true),
        db.from("product_customization_phases").select("*").in("tenant_id", tenantIds),
        db.from("order_types").select("*").in("tenant_id", tenantIds).eq("is_active", true),
        db.from("establishments").select("id, name, slug:city").eq("tenant_id", tenant.id).eq("is_active", true).limit(1),
      ]);

    const mergedSettings = { ...parentSettings, ...settings };

    return new Response(
      JSON.stringify({
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
        establishment: establishment.data?.[0] ?? null,
        settings: mergedSettings,
        products: products.data ?? [],
        categories: categories.data ?? [],
        customization_phases: phases.data ?? [],
        customization_options: options.data ?? [],
        product_customization_phases: pcps.data ?? [],
        order_types: orderTypes.data ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur interne" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
