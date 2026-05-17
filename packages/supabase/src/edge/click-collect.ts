import { getSupabaseClient } from "../client";
import type {
  Product, Category, CustomizationPhase, CustomizationOption,
  ProductCustomizationPhase, OrderType, TenantSettings,
} from "@kash/types";

export interface ClickCollectShopData {
  tenant: { id: string; name: string; slug: string };
  establishment: { id: string; name: string; slug: string } | null;
  settings: TenantSettings;
  products: Product[];
  categories: Category[];
  customization_phases: CustomizationPhase[];
  customization_options: CustomizationOption[];
  product_customization_phases: ProductCustomizationPhase[];
  order_types: OrderType[];
}

export interface ClickCollectOrderPayload {
  tenant_id: string;
  establishment_id: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    selected_options: Array<{ phase_id: string; option_id: string; option_name: string; price_adjustment: number }>;
  }>;
  total_amount: number;
  order_type: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  pickup_time: string | null;
  notes: string | null;
}

export interface ClickCollectOrderResult {
  transaction_id: string;
  order_number: string;
  order_token: string;
  payment_required: boolean;
  berexia_token: string | null;
  berexia_payment_url: string | null;
}

export async function callClickCollectOrder(
  payload: ClickCollectOrderPayload
): Promise<ClickCollectOrderResult> {
  const { data, error } = await getSupabaseClient().functions.invoke<ClickCollectOrderResult>(
    "click-collect-order",
    { body: payload }
  );
  if (error) throw error;
  if (!data) throw new Error("No response from click-collect-order");
  return data;
}

export async function callClickCollectData(
  tenantSlug: string,
  establishmentSlug?: string
): Promise<ClickCollectShopData> {
  const { data, error } = await getSupabaseClient().functions.invoke<ClickCollectShopData>(
    "click-collect-data",
    { body: { tenant_slug: tenantSlug, establishment_slug: establishmentSlug } }
  );
  if (error) throw error;
  if (!data) throw new Error("No response from click-collect-data");
  return data;
}

export async function callClickCollectTrack(orderToken: string) {
  const { data, error } = await getSupabaseClient().functions.invoke("click-collect-track", {
    body: { order_token: orderToken },
  });
  if (error) throw error;
  return data;
}
