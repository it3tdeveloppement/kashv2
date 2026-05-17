import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { order_token } = await req.json();
    if (!order_token) throw new Error("order_token is required");

    const db = getServiceClient();

    const { data: order, error } = await db
      .from("kitchen_orders")
      .select("id, order_number, status, created_at, pickup_time, estimated_time")
      .eq("order_token", order_token)
      .single();

    if (error || !order) throw new Error("Commande introuvable");

    return new Response(JSON.stringify(order), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur interne" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
