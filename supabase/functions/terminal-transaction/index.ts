import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      tenant_id, establishment_id, items, payment_method, total_amount,
      order_type, customer_id, customer_phone, order_token,
    } = body;

    if (!tenant_id || !items?.length || !payment_method) {
      throw new Error("Paramètres manquants");
    }

    const db = getServiceClient();

    // Generate sequential order number
    const { count } = await db
      .from("pos_transactions")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant_id)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const orderNumber = String((count ?? 0) + 1).padStart(3, "0");
    const transactionId = crypto.randomUUID();

    // Create POS transaction
    const { error: txErr } = await db.from("pos_transactions").insert({
      id: transactionId,
      tenant_id,
      transaction_number: orderNumber,
      subtotal: total_amount,
      tax_amount: 0,
      discount_amount: 0,
      total_amount,
      payment_method,
      status: "completed",
      source: "terminal",
      order_type,
      customer_id: customer_id ?? null,
      customer_phone: customer_phone ?? null,
    });

    if (txErr) throw txErr;

    // Create transaction items
    const itemRows = items.map((item: {
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
    }));

    await db.from("pos_transaction_items").insert(itemRows);

    // Create kitchen order
    const kitchenItems = items.map((item: {
      product_id: string; product_name?: string; quantity: number;
      selected_options: Array<{ option_name: string; phase_id: string }>;
    }) => ({
      product_id: item.product_id,
      product_name: item.product_name ?? item.product_id,
      quantity: item.quantity,
      notes: null,
      options: (item.selected_options ?? []).map((o) => ({
        name: o.phase_id,
        value: o.option_name,
      })),
    }));

    await db.from("kitchen_orders").insert({
      tenant_id,
      transaction_id: transactionId,
      order_number: orderNumber,
      items: kitchenItems,
      status: "pending",
      order_token: order_token ?? crypto.randomUUID(),
      order_type,
      payment_method,
    });

    return new Response(
      JSON.stringify({ transaction_id: transactionId, order_number: orderNumber }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur interne" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
