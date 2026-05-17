/**
 * Types for PowerSync local SQLite schema.
 * Mirror of the Postgres tables that are synced to devices.
 * All fields are strings in SQLite; typed here for convenience.
 */

export interface SyncedProduct {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: string; // SQLite stores as text
  image_url: string | null;
  is_active: string; // "1" | "0"
  display_order: string;
  available_order_type_codes: string; // JSON string
  product_type: string;
  tags: string; // JSON string
  visible_tenant_ids: string | null; // JSON string
}

export interface SyncedCategory {
  id: string;
  tenant_id: string;
  name: string;
  image_url: string | null;
  color: string | null;
  display_order: string;
  parent_category_id: string | null;
  is_active: string;
}

export interface SyncedCustomizationPhase {
  id: string;
  tenant_id: string;
  name: string;
  selection_type: string;
  min_selections: string;
  max_selections: string | null;
  is_required: string;
  is_active: string;
  enabled_terminal: string;
  enabled_pos: string;
  use_large_buttons: string;
}

export interface SyncedCustomizationOption {
  id: string;
  tenant_id: string;
  phase_id: string;
  name: string;
  price_adjustment: string;
  image_url: string | null;
  is_available: string;
  display_order: string;
  sub_phase_ids: string; // JSON
  disable_phase_ids: string; // JSON
  disable_option_ids: string; // JSON
  is_default: string;
}

export interface SyncedKitchenOrder {
  id: string;
  tenant_id: string;
  transaction_id: string | null;
  order_number: string;
  items: string; // JSON
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  customer_name: string | null;
  order_type: string | null;
  pickup_time: string | null;
  order_source: string | null;
}

export interface SyncedTenantSettings {
  id: string;
  tenant_id: string;
  terminal_welcome_image_url: string | null;
  terminal_welcome_video_url: string | null;
  terminal_primary_color: string | null;
  terminal_background_color: string | null;
  pos_primary_color: string | null;
  pos_background_color: string | null;
  cc_primary_color: string | null;
  default_currency: string | null;
  logo_url: string | null;
  offert_enabled: string;
  loyalty_enabled: string;
  timezone: string;
  business_day_start_hour: string;
}

export type SyncStatus = "connecting" | "connected" | "disconnected" | "syncing";

export interface OfflineQueueEntry {
  id: string;
  type: "pos_transaction" | "terminal_transaction" | "kitchen_status_update";
  payload: unknown;
  created_at: string;
  attempts: number;
  last_error: string | null;
}
