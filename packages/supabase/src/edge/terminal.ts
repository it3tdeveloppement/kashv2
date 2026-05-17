import { getSupabaseClient } from "../client";
import type { Product, Category, CustomizationPhase, CustomizationOption, ProductCustomizationPhase, TenantSettings, PaymentMethod, OrderType } from "@kash/types";

export interface TerminalBootData {
  tenant: { id: string; name: string; slug: string; establishment_id: string | null };
  settings: TenantSettings;
  parent_settings: TenantSettings | null;
  products: Product[];
  categories: Category[];
  customization_phases: CustomizationPhase[];
  customization_options: CustomizationOption[];
  product_customization_phases: ProductCustomizationPhase[];
  payment_methods: PaymentMethod[];
  order_types: OrderType[];
  powersync_token: string;
}

export async function callTerminalData(tenantId: string): Promise<TerminalBootData> {
  const { data, error } = await getSupabaseClient().functions.invoke<TerminalBootData>(
    "terminal-data",
    { body: { tenant_id: tenantId } }
  );
  if (error) throw error;
  if (!data) throw new Error("No response from terminal-data");
  return data;
}

export interface TerminalTransactionPayload {
  tenant_id: string;
  establishment_id: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    selected_options: Array<{ phase_id: string; option_id: string; option_name: string; price_adjustment: number }>;
  }>;
  payment_method: string;
  total_amount: number;
  order_type: string;
  customer_id?: string;
  customer_phone?: string;
  order_token: string;
}

export async function callTerminalTransaction(payload: TerminalTransactionPayload) {
  const { data, error } = await getSupabaseClient().functions.invoke(
    "terminal-transaction",
    { body: payload }
  );
  if (error) throw error;
  return data;
}
