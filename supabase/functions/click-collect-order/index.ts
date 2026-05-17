import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      tenant_id, establishment_id, items, total_amount,
      customer_name, customer_phone, customer_email, notes, pickup_time,
    } = body;

    if (!tenant_id || !items?.length) throw new Error("Paramètres manquants");

    const db = getServiceClient();

    const { count } = await db
      .from("pos_transactions")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant_id)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const orderNumber = String((count ?? 0) + 1).padStart(3, "0");
    const orderToken = crypto.randomUUID();
    const transactionId = crypto.randomUUID();

    const { error: txErr } = await db.from("pos_transactions").insert({
      id: transactionId,
      tenant_id,
      transaction_number: orderNumber,
      subtotal: total_amount,
      tax_amount: 0,
      discount_amount: 0,
      total_amount,
      payment_method: "online",
      status: "pending",
      source: "click_collect",
      order_type: "click_collect",
      customer_name: customer_name ?? null,
      customer_phone: customer_phone ?? null,
      customer_email: customer_email ?? null,
      berexia_token: orderToken,
    });

    if (txErr) throw txErr;

    await db.from("pos_transaction_items").insert(
      items.map((item: {
        product_id: string; quantity: number;
        unit_price: number; total_price: number; selected_options: unknown[];
      }) => ({
        transaction_id: transactionId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: 0,
        total_price: item.total_price,
        selected_options: item.selected_options,
      }))
    );

    // Create kitchen order immediately (payment confirmed separately via webhook)
    await db.from("kitchen_orders").insert({
      tenant_id,
      transaction_id: transactionId,
      order_number: orderNumber,
      items: items.map((item: { product_id: string; quantity: number; selected_options: Array<{ option_name: string; phase_id: string }> }) => ({
        product_id: item.product_id,
        product_name: item.product_id,
        quantity: item.quantity,
        notes: null,
        options: (item.selected_options ?? []).map((o) => ({ name: o.phase_id, value: o.option_name })),
      })),
      status: "pending",
      order_token: orderToken,
      order_type: "click_collect",
      payment_method: "online",
      customer_name: customer_name ?? null,
      customer_phone: customer_phone ?? null,
      pickup_time: pickup_time ?? null,
      notes: notes ?? null,
    });

    return new Response(
      JSON.stringify({
        transaction_id: transactionId,
        order_number: orderNumber,
        order_token: orderToken,
        payment_required: false,
        berexia_token: null,
        berexia_payment_url: null,
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
