export type ProductType = "simple" | "composed" | "ingredient";
export type ProductStatus = "active" | "inactive" | "out_of_stock";
export type SelectionType = "single" | "multiple";

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  color: string | null;
  image_url: string | null;
  display_order: number;
  parent_category_id: string | null;
  is_active: boolean;
}

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  cost_price: number | null;
  sku: string | null;
  barcode: string | null;
  stock_quantity: number | null;
  is_active: boolean;
  tax_rate: number;
  image_url: string | null;
  product_type: ProductType;
  tags: string[];
  display_order: number;
  status: ProductStatus;
  is_manufactured_on_site: boolean;
  is_upsell: boolean;
  available_order_type_codes: string[];
  delivery_price: number | null;
  visible_tenant_ids: string[] | null;
  price_glovo: number | null;
  price_kooul: number | null;
  created_at: string;
  updated_at: string;
}

export interface CustomizationPhase {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  selection_type: SelectionType;
  min_selections: number;
  max_selections: number | null;
  is_required: boolean;
  is_active: boolean;
  display_title: string | null;
  enabled_terminal: boolean;
  enabled_pos: boolean;
  use_large_buttons: boolean;
}

export interface CustomizationOption {
  id: string;
  tenant_id: string;
  phase_id: string;
  name: string;
  price_adjustment: number;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
  product_id: string | null;
  sub_phase_ids: string[];
  group_id: string | null;
  disable_phase_ids: string[];
  disable_option_ids: string[];
  is_default: boolean;
  available_order_type_codes: string[];
  delivery_price: number | null;
  price_glovo: number | null;
  price_kooul: number | null;
}

export interface CustomizationOptionGroup {
  id: string;
  tenant_id: string;
  phase_id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  min_selections: number;
  max_selections: number | null;
}

export interface ProductCustomizationPhase {
  id: string;
  tenant_id: string;
  product_id: string;
  phase_id: string;
  display_order: number;
}

export interface OrderType {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  icon: string | null;
  display_order: number;
  enabled_pos: boolean;
  enabled_terminal: boolean;
  is_active: boolean;
  color: string | null;
  is_offert: boolean;
}

export interface PaymentMethod {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  icon: string | null;
  enabled_pos: boolean;
  enabled_terminal: boolean;
  display_order: number;
  is_active: boolean;
  available_order_type_codes: string[];
  enabled_click_collect: boolean;
}

export interface TvaRate {
  id: string;
  tenant_id: string;
  name: string;
  rate: number;
  is_default: boolean;
  is_active: boolean;
}

export interface Currency {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  symbol: string;
  is_default: boolean;
  is_active: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_options: CartItemOption[];
  notes: string | null;
  order_type_code: string | null;
}

export interface CartItemOption {
  phase_id: string;
  option_id: string;
  option_name: string;
  price_adjustment: number;
}
