import { getSupabaseClient } from "../client";

export interface KdsBootData {
  tenant_id: string;
  powersync_token: string;
}

export async function callKdsAuth(tenantId: string, token: string): Promise<KdsBootData> {
  const { data, error } = await getSupabaseClient().functions.invoke<KdsBootData>("kds-auth", {
    body: { tenant_id: tenantId, token },
  });
  if (error) throw error;
  if (!data) throw new Error("No response from kds-auth");
  return data;
}

export async function callUpdateKitchenOrderStatus(
  orderId: string,
  status: string
): Promise<void> {
  const { error } = await getSupabaseClient().functions.invoke("kds-update-status", {
    body: { order_id: orderId, status },
  });
  if (error) throw error;
}
