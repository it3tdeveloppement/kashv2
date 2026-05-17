import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      tenant_id, session_id, user_id, items, payment_method, total_amount,
      amount_received, order_type, is_offert, offert_reason, offert_comment,
      table_id, pager_number, customer_id, customer_name, customer_phone,
    } = body;

    if (!tenant_id || !items?.length || !payment_method) {
      throw new Error("Paramètres manquants");
    }

    const db = getServiceClient();

    const { count } = await db
      .from("pos_transactions")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant_id)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const orderNumber = String((count ?? 0) + 1).padStart(3, "0");
    const transactionId = crypto.randomUUID();

    const subtotal = total_amount;
    const changeGiven = amount_received != null ? Math.max(0, amount_received - total_amount) : null;

    const { error: txErr } = await db.from("pos_transactions").insert({
      id: transactionId,
      tenant_id,
      session_id: session_id ?? null,
      user_id: user_id ?? null,
      transaction_number: orderNumber,
      subtotal,
      tax_amount: 0,
      discount_amount: 0,
      total_amount,
      payment_method,
      amount_received: amount_received ?? null,
      change_given: changeGiven,
      status: "completed",
      source: "pos",
      order_type: order_type ?? null,
      is_offert: is_offert ?? false,
      original_subtotal: is_offert ? subtotal : null,
      offert_reason: offert_reason ?? null,
      offert_comment: offert_comment ?? null,
      table_id: table_id ?? null,
      pager_number: pager_number ?? null,
      customer_id: customer_id ?? null,
      customer_name: customer_name ?? null,
      customer_phone: customer_phone ?? null,
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
        selected_options: item.selected_options ?? [],
        order_type_code: order_type ?? null,
      }))
    );

    // Create kitchen order
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
      order_type: order_type ?? null,
      payment_method,
      customer_name: customer_name ?? null,
      customer_phone: customer_phone ?? null,
    });

    return new Response(
      JSON.stringify({ transaction_id: transactionId, order_number: orderNumber, change_given: changeGiven }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur interne" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
