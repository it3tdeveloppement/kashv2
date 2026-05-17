-- Kash V2 - Initial schema
-- Multi-tenant: parent tenant (brand) -> N child establishments

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE app_role AS ENUM ('superadmin', 'admin', 'manager', 'staff', 'cashier');
CREATE TYPE plan_type AS ENUM ('starter', 'pro', 'enterprise');
CREATE TYPE billing_period AS ENUM ('monthly', 'yearly');
CREATE TYPE product_type AS ENUM ('simple', 'composed', 'ingredient');
CREATE TYPE product_status AS ENUM ('active', 'inactive', 'out_of_stock');
CREATE TYPE selection_type AS ENUM ('single', 'multiple');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE transaction_source AS ENUM ('pos', 'click_collect', 'terminal', 'plateforme', 'glovo', 'kooul', 'external');
CREATE TYPE kds_order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'completed');
CREATE TYPE online_payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE table_status AS ENUM ('free', 'occupied', 'reserved', 'cleaning');
CREATE TYPE table_shape AS ENUM ('square', 'circle', 'rectangle');

-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_tenant_id UUID REFERENCES tenants(id),
  plan plan_type,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenants_parent ON tenants(parent_tenant_id);
CREATE INDEX idx_tenants_slug ON tenants(slug);

-- Establishments
CREATE TABLE establishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  siret TEXT,
  address TEXT,
  city TEXT,
  zip TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  pos_enabled BOOLEAN NOT NULL DEFAULT true,
  terminal_enabled BOOLEAN NOT NULL DEFAULT false,
  kitchen_enabled BOOLEAN NOT NULL DEFAULT false,
  display_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_establishments_tenant ON establishments(tenant_id);

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role app_role NOT NULL DEFAULT 'staff',
  pin_hash TEXT,
  establishment_id UUID REFERENCES establishments(id),
  pos_pin TEXT,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_profiles_pos_pin ON profiles(tenant_id, pos_pin) WHERE pos_pin IS NOT NULL;

-- Tenant settings
CREATE TABLE tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  default_currency TEXT DEFAULT 'MAD',
  pos_primary_color TEXT,
  pos_background_color TEXT,
  terminal_primary_color TEXT,
  terminal_background_color TEXT,
  terminal_welcome_image_url TEXT,
  terminal_welcome_video_url TEXT,
  kitchen_primary_color TEXT,
  kitchen_background_color TEXT,
  cc_primary_color TEXT,
  cc_secondary_color TEXT,
  cc_background_color TEXT,
  cc_text_color TEXT,
  cc_button_color TEXT,
  cc_button_text_color TEXT,
  cc_header_color TEXT,
  cc_footer_color TEXT,
  cc_card_color TEXT,
  cc_card_text_color TEXT,
  cc_accent_color TEXT,
  cc_border_color TEXT,
  cc_input_background TEXT,
  cc_lead_time_minutes INT DEFAULT 20,
  receipt_template TEXT,
  kitchen_ticket_template TEXT,
  card_receipt_template TEXT,
  offert_enabled BOOLEAN NOT NULL DEFAULT true,
  loyalty_enabled BOOLEAN NOT NULL DEFAULT false,
  online_payment_enabled BOOLEAN NOT NULL DEFAULT false,
  timezone TEXT NOT NULL DEFAULT 'Africa/Casablanca',
  business_day_start_hour INT NOT NULL DEFAULT 4,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscription plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL,
  price_yearly NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',
  plan_type plan_type NOT NULL,
  billing_period billing_period NOT NULL DEFAULT 'monthly'
);

-- Modules
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  family_id UUID,
  code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  route TEXT,
  icon TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  show_in_sidebar BOOLEAN NOT NULL DEFAULT true,
  has_write_capability BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(tenant_id, code)
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  image_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  parent_category_id UUID REFERENCES categories(id),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_categories_tenant ON categories(tenant_id);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC,
  sku TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  tax_rate NUMERIC DEFAULT 0,
  product_type product_type NOT NULL DEFAULT 'simple',
  tags TEXT[] DEFAULT '{}',
  display_order INT NOT NULL DEFAULT 0,
  status product_status NOT NULL DEFAULT 'active',
  is_upsell BOOLEAN NOT NULL DEFAULT false,
  is_manufactured_on_site BOOLEAN NOT NULL DEFAULT false,
  available_order_type_codes TEXT[] DEFAULT '{}',
  visible_tenant_ids TEXT[],
  delivery_price NUMERIC,
  price_glovo NUMERIC,
  price_kooul NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Customization phases
CREATE TABLE customization_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  selection_type selection_type NOT NULL DEFAULT 'single',
  min_selections INT NOT NULL DEFAULT 0,
  max_selections INT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_title TEXT,
  enabled_terminal BOOLEAN NOT NULL DEFAULT true,
  enabled_pos BOOLEAN NOT NULL DEFAULT true,
  use_large_buttons BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_cust_phases_tenant ON customization_phases(tenant_id);

-- Customization option groups
CREATE TABLE customization_option_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES customization_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  min_selections INT NOT NULL DEFAULT 0,
  max_selections INT
);

-- Customization options
CREATE TABLE customization_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES customization_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_adjustment NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  product_id UUID REFERENCES products(id),
  sub_phase_ids TEXT[] DEFAULT '{}',
  group_id UUID REFERENCES customization_option_groups(id),
  disable_phase_ids TEXT[] DEFAULT '{}',
  disable_option_ids TEXT[] DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  available_order_type_codes TEXT[] DEFAULT '{}',
  delivery_price NUMERIC,
  price_glovo NUMERIC,
  price_kooul NUMERIC
);

CREATE INDEX idx_cust_options_phase ON customization_options(phase_id);
CREATE INDEX idx_cust_options_tenant ON customization_options(tenant_id);

-- Product customization phases (junction)
CREATE TABLE product_customization_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES customization_phases(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 0,
  UNIQUE(product_id, phase_id)
);

CREATE INDEX idx_pcp_product ON product_customization_phases(product_id);

-- Order types
CREATE TABLE order_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  display_order INT NOT NULL DEFAULT 0,
  enabled_pos BOOLEAN NOT NULL DEFAULT true,
  enabled_terminal BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  color TEXT,
  is_offert BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(tenant_id, code)
);

-- Payment methods
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  enabled_pos BOOLEAN NOT NULL DEFAULT true,
  enabled_terminal BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  available_order_type_codes TEXT[] DEFAULT '{}',
  enabled_click_collect BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(tenant_id, code)
);

-- Restaurant zones
CREATE TABLE restaurant_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  floor TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Restaurant tables
CREATE TABLE restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES restaurant_zones(id),
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  status table_status NOT NULL DEFAULT 'free',
  current_order_id UUID,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  pos_x NUMERIC DEFAULT 0,
  pos_y NUMERIC DEFAULT 0,
  shape table_shape NOT NULL DEFAULT 'square'
);

CREATE INDEX idx_tables_tenant ON restaurant_tables(tenant_id);
CREATE INDEX idx_tables_zone ON restaurant_tables(zone_id);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, phone)
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(tenant_id, phone);

-- Loyalty programs
CREATE TABLE loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  points_per_currency NUMERIC NOT NULL DEFAULT 1,
  min_redeem_points INT NOT NULL DEFAULT 100,
  points_value NUMERIC NOT NULL DEFAULT 0.01,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Loyalty accounts
CREATE TABLE loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  points_balance INT NOT NULL DEFAULT 0,
  total_earned INT NOT NULL DEFAULT 0,
  total_redeemed INT NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  UNIQUE(tenant_id, customer_id)
);

CREATE INDEX idx_loyalty_accounts_customer ON loyalty_accounts(customer_id);

-- Loyalty rewards
CREATE TABLE loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  points_cost INT NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value NUMERIC NOT NULL DEFAULT 0,
  product_id UUID REFERENCES products(id),
  image_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- POS sessions
CREATE TABLE pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES establishments(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  session_number TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC,
  total_sales NUMERIC NOT NULL DEFAULT 0,
  total_transactions INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open'
);

CREATE INDEX idx_pos_sessions_tenant ON pos_sessions(tenant_id);

-- POS auth sessions
CREATE TABLE pos_auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES establishments(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  session_token TEXT NOT NULL UNIQUE,
  device_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pos_auth_sessions_token ON pos_auth_sessions(session_token);

-- POS transactions
CREATE TABLE pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES establishments(id),
  session_id UUID REFERENCES pos_sessions(id),
  user_id UUID REFERENCES profiles(id),
  transaction_number TEXT NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  amount_received NUMERIC,
  change_given NUMERIC,
  status transaction_status NOT NULL DEFAULT 'completed',
  notes TEXT,
  source transaction_source NOT NULL DEFAULT 'pos',
  order_type TEXT,
  device_id TEXT,
  customer_id UUID REFERENCES customers(id),
  is_offert BOOLEAN NOT NULL DEFAULT false,
  original_subtotal NUMERIC,
  offert_reason TEXT,
  offert_comment TEXT,
  cancellation_reason TEXT,
  cancellation_comment TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id),
  pager_number TEXT,
  table_id UUID REFERENCES restaurant_tables(id),
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  online_payment_status online_payment_status,
  berexia_uid TEXT,
  berexia_token TEXT,
  paid_at TIMESTAMPTZ,
  external_source TEXT,
  external_reference TEXT,
  order_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_tenant ON pos_transactions(tenant_id);
CREATE INDEX idx_transactions_created ON pos_transactions(tenant_id, created_at DESC);
CREATE INDEX idx_transactions_token ON pos_transactions(order_token) WHERE order_token IS NOT NULL;

-- POS transaction items
CREATE TABLE pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL,
  selected_options JSONB DEFAULT '[]',
  notes TEXT,
  order_type_code TEXT
);

CREATE INDEX idx_transaction_items_tx ON pos_transaction_items(transaction_id);

-- POS transaction payments
CREATE TABLE pos_transaction_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kitchen orders
CREATE TABLE kitchen_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES pos_transactions(id),
  order_number TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  status kds_order_status NOT NULL DEFAULT 'pending',
  priority INT NOT NULL DEFAULT 0,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  customer_name TEXT,
  customer_phone TEXT,
  order_source TEXT,
  order_type TEXT,
  payment_method TEXT,
  pickup_time TIMESTAMPTZ,
  order_token TEXT,
  online_payment_status online_payment_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kitchen_orders_tenant ON kitchen_orders(tenant_id);
CREATE INDEX idx_kitchen_orders_status ON kitchen_orders(tenant_id, status);
CREATE INDEX idx_kitchen_orders_created ON kitchen_orders(tenant_id, created_at DESC);

-- KDS hardware tokens
CREATE TABLE kds_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES establishments(id),
  token TEXT NOT NULL UNIQUE,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kds_tokens_token ON kds_tokens(token);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_establishments_updated_at BEFORE UPDATE ON establishments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tenant_settings_updated_at BEFORE UPDATE ON tenant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pos_transactions_updated_at BEFORE UPDATE ON pos_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_kitchen_orders_updated_at BEFORE UPDATE ON kitchen_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_customization_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transaction_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_tokens ENABLE ROW LEVEL SECURITY;
