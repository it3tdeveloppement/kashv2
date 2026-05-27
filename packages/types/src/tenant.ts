export type AppRole = "superadmin" | "admin" | "manager" | "staff" | "cashier";
export type PlanType = "starter" | "pro" | "enterprise";
export type BillingPeriod = "monthly" | "yearly";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  parent_tenant_id: string | null;
  plan: PlanType | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Establishment {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  siret: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  pos_enabled: boolean;
  terminal_enabled: boolean;
  kitchen_enabled: boolean;
  display_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  id: string;
  tenant_id: string;
  // Branding
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  default_currency: string | null;
  // POS interface
  pos_primary_color: string | null;
  pos_background_color: string | null;
  // Terminal/Kiosk interface
  terminal_primary_color: string | null;
  terminal_background_color: string | null;
  terminal_welcome_image_url: string | null;
  terminal_welcome_video_url: string | null;
  // Kitchen interface
  kitchen_primary_color: string | null;
  kitchen_background_color: string | null;
  // Click & Collect
  cc_primary_color: string | null;
  cc_secondary_color: string | null;
  cc_background_color: string | null;
  cc_text_color: string | null;
  cc_button_color: string | null;
  cc_button_text_color: string | null;
  cc_header_color: string | null;
  cc_footer_color: string | null;
  cc_card_color: string | null;
  cc_card_text_color: string | null;
  cc_accent_color: string | null;
  cc_border_color: string | null;
  cc_input_background: string | null;
  cc_lead_time_minutes: number | null;
  // Ticket templates
  receipt_template: string | null;
  kitchen_ticket_template: string | null;
  card_receipt_template: string | null;
  // Settings
  offert_enabled: boolean;
  loyalty_enabled: boolean;
  online_payment_enabled: boolean;
  // Misc
  timezone: string;
  business_day_start_hour: number;
  updated_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: AppRole;
  pin_hash: string | null;
  establishment_id: string | null;
  pos_pin: string | null;
  two_factor_enabled: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserTenantAccess {
  id: string;
  user_id: string;
  tenant_id: string;
  role: AppRole;
  is_active: boolean;
  created_at: string;
}

export interface ModuleFamily {
  id: string;
  tenant_id: string;
  name: string;
  display_name: string;
  icon: string | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  tenant_id: string;
  family_id: string | null;
  code: string;
  display_name: string;
  route: string | null;
  icon: string | null;
  display_order: number;
  is_visible: boolean;
  show_in_sidebar: boolean;
  has_write_capability: boolean;
}

export interface TenantModuleAccess {
  id: string;
  tenant_id: string;
  module_id: string;
  is_enabled: boolean;
  propagate_to_children: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserModulePermission {
  id: string;
  user_id: string;
  tenant_id: string;
  module_id: string;
  can_read: boolean;
  can_write: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  is_active: boolean;
  display_order: number;
  features: Record<string, unknown>;
  plan_type: PlanType;
  billing_period: BillingPeriod;
}

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan_id: string | null;
  status: "trialing" | "active" | "past_due" | "cancelled" | string;
  billing_period: BillingPeriod;
  starts_at: string;
  trial_ends_at: string | null;
  current_period_ends_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}
