import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { signPowerSyncJwt } from "../_shared/jwt.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tenant_id, establishment_id, pin } = await req.json();
    if (!tenant_id || !pin) throw new Error("tenant_id and pin are required");

    const db = getServiceClient();

    // Look up staff member by PIN within the tenant
    const { data: profile, error } = await db
      .from("profiles")
      .select("id, first_name, last_name, role, establishment_id")
      .eq("tenant_id", tenant_id)
      .eq("pos_pin", pin)
      .single();

    if (error || !profile) throw new Error("PIN incorrect ou accès refusé");

    const estId = establishment_id ?? profile.establishment_id;

    // Issue PowerSync JWT with POS claims
    const powersyncToken = await signPowerSyncJwt(
      {
        sub: profile.id,
        user_id: profile.id,
        tenant_id,
        establishment_id: estId,
        role: "pos",
      },
      8 * 3600 // 8h
    );

    // Create session record
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

    await db.from("pos_auth_sessions").insert({
      user_id: profile.id,
      tenant_id,
      establishment_id: estId,
      session_token: sessionToken,
      expires_at: expiresAt,
    });

    return new Response(
      JSON.stringify({
        user: {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role,
        },
        session_token: sessionToken,
        tenant_id,
        establishment_id: estId,
        powersync_token: powersyncToken,
        expires_at: expiresAt,
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
