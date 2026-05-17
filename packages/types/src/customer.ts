export interface Customer {
  id: string;
  tenant_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string;
  email: string | null;
  birth_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyAccount {
  id: string;
  tenant_id: string;
  customer_id: string;
  points_balance: number;
  total_earned: number;
  total_redeemed: number;
  last_activity_at: string | null;
}

export interface LoyaltyProgram {
  id: string;
  tenant_id: string;
  name: string;
  is_active: boolean;
  points_per_currency: number;
  currency_per_point: number;
  welcome_points: number;
  points_expiration_days: number | null;
  min_points_to_redeem: number;
  terms_conditions: string | null;
}

export interface LoyaltyReward {
  id: string;
  tenant_id: string;
  program_id: string;
  name: string;
  points_cost: number;
  reward_type: "discount" | "product" | "free_item";
  reward_value: number;
  product_id: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  max_redemptions_per_customer: number | null;
}
