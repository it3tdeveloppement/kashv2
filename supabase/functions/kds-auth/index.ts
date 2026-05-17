import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { signPowerSyncJwt } from "../_shared/jwt.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tenant_id, token } = await req.json();
    if (!tenant_id || !token) throw new Error("tenant_id and token are required");

    const db = getServiceClient();

    const { data: hw, error } = await db
      .from("kds_hardware_tokens")
      .select("id, tenant_id")
      .eq("tenant_id", tenant_id)
      .eq("token", token)
      .eq("is_active", true)
      .single();

    if (error || !hw) throw new Error("Token KDS invalide");

    // Mark last seen
    await db
      .from("kds_hardware_tokens")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", hw.id);

    const powersyncToken = await signPowerSyncJwt(
      { sub: hw.id, tenant_id, role: "kds" },
      24 * 3600
    );

    return new Response(
      JSON.stringify({ tenant_id, powersync_token: powersyncToken }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur interne" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
