import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { signPowerSyncJwt } from "../_shared/jwt.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tenant_id } = await req.json();
    if (!tenant_id) throw new Error("tenant_id is required");

    const db = getServiceClient();

    // Fetch tenant + parent
    const { data: tenant, error: tenantErr } = await db
      .from("tenants")
      .select("id, name, slug, parent_tenant_id")
      .eq("id", tenant_id)
      .single();

    if (tenantErr || !tenant) throw new Error("Tenant introuvable");

    const tenantIds = [tenant_id];
    if (tenant.parent_tenant_id) tenantIds.push(tenant.parent_tenant_id);

    // Fetch all catalog data in parallel
    const [settings, parentSettings, products, categories, phases, options, pcps, paymentMethods, orderTypes, establishments] =
      await Promise.all([
        db.from("tenant_settings").select("*").eq("tenant_id", tenant_id).single().then((r) => r.data),
        tenant.parent_tenant_id
          ? db.from("tenant_settings").select("*").eq("tenant_id", tenant.parent_tenant_id).single().then((r) => r.data)
          : Promise.resolve(null),
        db.from("products").select("*").in("tenant_id", tenantIds).eq("is_active", true).eq("status", "active"),
        db.from("categories").select("*").in("tenant_id", tenantIds).eq("is_active", true),
        db.from("customization_phases").select("*").in("tenant_id", tenantIds).eq("is_active", true).eq("enabled_terminal", true),
        db.from("customization_options").select("*").in("tenant_id", tenantIds).eq("is_available", true),
        db.from("product_customization_phases").select("*").in("tenant_id", tenantIds),
        db.from("payment_methods").select("*").in("tenant_id", tenantIds).eq("is_active", true).eq("enabled_terminal", true),
        db.from("order_types").select("*").in("tenant_id", tenantIds).eq("is_active", true).eq("enabled_terminal", true),
        db.from("establishments").select("id").eq("tenant_id", tenant_id).eq("is_active", true).limit(1),
      ]);

    const establishmentId = establishments.data?.[0]?.id ?? null;

    // Issue short-lived kiosk JWT
    const powersyncToken = await signPowerSyncJwt(
      { sub: tenant_id, tenant_id, role: "kiosk" },
      24 * 3600
    );

    return new Response(
      JSON.stringify({
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, establishment_id: establishmentId },
        settings,
        parent_settings: parentSettings,
        products: products.data ?? [],
        categories: categories.data ?? [],
        customization_phases: phases.data ?? [],
        customization_options: options.data ?? [],
        product_customization_phases: pcps.data ?? [],
        payment_methods: paymentMethods.data ?? [],
        order_types: orderTypes.data ?? [],
        powersync_token: powersyncToken,
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
