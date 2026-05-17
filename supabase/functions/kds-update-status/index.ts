import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { order_id, status } = await req.json();
    if (!order_id || !status) throw new Error("order_id and status are required");

    const VALID = ["pending", "confirmed", "preparing", "ready", "completed"];
    if (!VALID.includes(status)) throw new Error("Statut invalide");

    const db = getServiceClient();

    const updates: Record<string, unknown> = { status };
    if (status === "preparing") updates.started_at = new Date().toISOString();
    if (status === "completed") updates.completed_at = new Date().toISOString();

    const { error } = await db
      .from("kitchen_orders")
      .update(updates)
      .eq("id", order_id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur interne" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
