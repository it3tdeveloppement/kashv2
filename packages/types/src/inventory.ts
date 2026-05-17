export interface Ingredient {
  id: string;
  tenant_id: string;
  name: string;
  default_unit_id: string | null;
  cost_per_unit: number;
  min_stock_level: number | null;
  current_stock: number;
  allergens: string[];
  storage_location: string | null;
  is_active: boolean;
}

export interface UnitOfMeasure {
  id: string;
  tenant_id: string;
  name: string;
  abbreviation: string;
  type: "weight" | "volume" | "count" | "length";
  conversion_factor: number;
  is_base: boolean;
  is_active: boolean;
}

export interface MercurialeItem {
  id: string;
  tenant_id: string;
  ingredient_id: string | null;
  supplier_id: string;
  purchase_unit_id: string;
  consumption_unit_id: string;
  purchase_price: number;
  currency: string;
  minimum_order_quantity: number | null;
  conversion_factor: number;
  ingredient_name: string;
  image_url: string | null;
  product_type: string | null;
  category_id: string | null;
  min_purchase_quantity: number | null;
  cost_price: number | null;
  packaging_quantity: number | null;
  packaging_unit_id: string | null;
}

export interface Supplier {
  id: string;
  tenant_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  whatsapp_phone: string | null;
  order_email: string | null;
  notify_via_email: boolean;
  notify_via_whatsapp: boolean;
  minimum_purchase_amount: number | null;
  is_active: boolean;
}

export interface Recipe {
  id: string;
  tenant_id: string;
  product_id: string;
  name: string;
  description: string | null;
  yield_percentage: number;
  number_of_portions: number;
  preparation_time: number | null;
  cooking_time: number | null;
  instructions: string | null;
  is_active: boolean;
}

export interface InventoryStockItem {
  id: string;
  tenant_id: string;
  ingredient_id: string;
  location_id: string | null;
  quantity: number;
  unit_id: string;
  lot_number: string | null;
  entry_date: string;
  expiration_date: string | null;
  alert_threshold: number | null;
  status: "available" | "reserved" | "expired";
  mercuriale_item_id: string | null;
}
