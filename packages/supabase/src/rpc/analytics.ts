import { getSupabaseClient } from "../client";

export interface DailySalesStat {
  date: string;
  total_sales: number;
  transaction_count: number;
  average_basket: number;
}

export interface FoodCostStat {
  product_id: string;
  product_name: string;
  total_revenue: number;
  total_cost: number;
  food_cost_percentage: number;
}

export async function getDailySalesDashboard(
  tenantIds: string[],
  startDate: string,
  endDate: string,
  establishmentIds?: string[]
): Promise<DailySalesStat[]> {
  const { data, error } = await getSupabaseClient().rpc("get_daily_sales_dashboard", {
    p_tenant_ids: tenantIds,
    p_start_date: startDate,
    p_end_date: endDate,
    p_establishment_ids: establishmentIds ?? [],
  });
  if (error) throw error;
  return data ?? [];
}

export async function getHourlySalesDashboard(
  tenantIds: string[],
  startDate: string,
  endDate: string
) {
  const { data, error } = await getSupabaseClient().rpc("get_hourly_sales_dashboard", {
    p_tenant_ids: tenantIds,
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getFoodCostStats(
  tenantId: string,
  startDate: string,
  endDate: string,
  establishmentIds: string[] = []
): Promise<FoodCostStat[]> {
  const { data, error } = await getSupabaseClient().rpc("get_food_cost_stats", {
    p_tenant_id: tenantId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_establishment_ids: establishmentIds,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getOrderTypeBreakdown(
  tenantIds: string[],
  startDate: string,
  endDate: string
) {
  const { data, error } = await getSupabaseClient().rpc("get_order_type_breakdown", {
    p_tenant_ids: tenantIds,
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getCancellationSummary(
  tenantIds: string[],
  startDate: string,
  endDate: string
) {
  const { data, error } = await getSupabaseClient().rpc("get_cancellation_summary", {
    p_tenant_ids: tenantIds,
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
  return data ?? [];
}
