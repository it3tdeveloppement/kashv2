import { getSupabaseClient } from "../client";

export async function getDataSourceTenantId(): Promise<string | null> {
  const { data, error } = await getSupabaseClient().rpc("get_data_source_tenant_id");
  if (error) throw error;
  return data;
}

export async function getNextOrderNumber(tenantId: string): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc("get_next_order_number", {
    tenant_uuid: tenantId,
  });
  if (error) throw error;
  return data;
}

export async function generateReceiptNumber(tenantId: string): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc("generate_receipt_number", {
    tenant_uuid: tenantId,
  });
  if (error) throw error;
  return data;
}

export async function calculateRecipeCost(recipeId: string): Promise<number> {
  const { data, error } = await getSupabaseClient().rpc("calculate_recipe_cost", {
    recipe_uuid: recipeId,
  });
  if (error) throw error;
  return data ?? 0;
}
