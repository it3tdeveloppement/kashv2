export type TransactionStatus = "pending" | "completed" | "cancelled";
export type TransactionSource =
  | "pos"
  | "click_collect"
  | "terminal"
  | "plateforme"
  | "glovo"
  | "kooul"
  | "external";
export type OnlinePaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface PosTransaction {
  id: string;
  tenant_id: string;
  session_id: string | null;
  user_id: string | null;
  transaction_number: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  amount_received: number | null;
  change_given: number | null;
  status: TransactionStatus;
  notes: string | null;
  source: TransactionSource;
  order_type: string | null;
  device_id: string | null;
  customer_id: string | null;
  is_offert: boolean;
  original_subtotal: number | null;
  offert_reason: string | null;
  offert_comment: string | null;
  cancellation_reason: string | null;
  cancellation_comment: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  pager_number: string | null;
  table_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  online_payment_status: OnlinePaymentStatus | null;
  berexia_uid: string | null;
  berexia_token: string | null;
  paid_at: string | null;
  external_source: string | null;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface PosTransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_price: number;
  selected_options: Array<{
    phase_id: string;
    option_id: string;
    option_name: string;
    price_adjustment: number;
  }>;
  notes: string | null;
  order_type_code: string | null;
}

export interface PosTransactionPayment {
  id: string;
  tenant_id: string;
  transaction_id: string;
  payment_method: string;
  amount: number;
  created_at: string;
}

export interface PosSession {
  id: string;
  tenant_id: string;
  user_id: string;
  session_number: string;
  start_time: string;
  end_time: string | null;
  opening_balance: number;
  closing_balance: number | null;
  total_sales: number;
  total_transactions: number;
  status: "open" | "closed";
  notes: string | null;
}

export interface PosAuthSession {
  id: string;
  user_id: string;
  tenant_id: string;
  establishment_id: string | null;
  session_token: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export type KdsOrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed";

export interface KitchenOrder {
  id: string;
  tenant_id: string;
  transaction_id: string | null;
  order_number: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    notes: string | null;
    options: Array<{ name: string; value: string }>;
  }>;
  status: KdsOrderStatus;
  priority: number;
  estimated_time: number | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  customer_phone: string | null;
  order_source: TransactionSource | null;
  customer_name: string | null;
  customer_email: string | null;
  pickup_time: string | null;
  order_token: string | null;
  order_type: string | null;
  payment_method: string | null;
  online_payment_status: OnlinePaymentStatus | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantTable {
  id: string;
  tenant_id: string;
  zone_id: string;
  name: string;
  capacity: number;
  status: "free" | "occupied" | "reserved" | "cleaning";
  current_order_id: string | null;
  display_order: number;
  is_active: boolean;
  pos_x: number;
  pos_y: number;
  shape: "square" | "circle" | "rectangle";
}

export interface RestaurantZone {
  id: string;
  tenant_id: string;
  name: string;
  floor: string | null;
  display_order: number;
  is_active: boolean;
}
