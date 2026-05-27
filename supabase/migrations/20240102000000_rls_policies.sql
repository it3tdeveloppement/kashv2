-- =============================================================
-- RLS Policies for Kash V2
-- =============================================================

-- Helper functions (SECURITY DEFINER so they bypass RLS on profiles)

CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT COALESCE((SELECT tenant_id IS NULL FROM public.profiles WHERE id = auth.uid()), false)
$$;

-- =============================================================
-- profiles
-- =============================================================

CREATE POLICY "profiles_select"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_superadmin());

CREATE POLICY "profiles_insert_superadmin"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (is_superadmin());

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR is_superadmin());

CREATE POLICY "profiles_delete_superadmin"
  ON profiles FOR DELETE TO authenticated
  USING (is_superadmin());

-- =============================================================
-- tenants
-- =============================================================

CREATE POLICY "tenants_select"
  ON tenants FOR SELECT TO authenticated
  USING (
    is_superadmin()
    OR id = get_my_tenant_id()
    OR id = (SELECT parent_tenant_id FROM tenants WHERE id = get_my_tenant_id())
    OR parent_tenant_id = get_my_tenant_id()
  );

CREATE POLICY "tenants_insert_superadmin"
  ON tenants FOR INSERT TO authenticated
  WITH CHECK (is_superadmin());

CREATE POLICY "tenants_update"
  ON tenants FOR UPDATE TO authenticated
  USING (is_superadmin() OR id = get_my_tenant_id());

CREATE POLICY "tenants_delete_superadmin"
  ON tenants FOR DELETE TO authenticated
  USING (is_superadmin());

-- =============================================================
-- establishments
-- =============================================================

CREATE POLICY "establishments_select"
  ON establishments FOR SELECT TO authenticated
  USING (
    is_superadmin()
    OR tenant_id = get_my_tenant_id()
    OR tenant_id IN (SELECT id FROM tenants WHERE parent_tenant_id = get_my_tenant_id())
  );

CREATE POLICY "establishments_write"
  ON establishments FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

-- =============================================================
-- tenant_settings
-- =============================================================

CREATE POLICY "tenant_settings_select"
  ON tenant_settings FOR SELECT TO authenticated
  USING (
    is_superadmin()
    OR tenant_id = get_my_tenant_id()
    OR tenant_id = (SELECT parent_tenant_id FROM tenants WHERE id = get_my_tenant_id())
    OR tenant_id IN (SELECT id FROM tenants WHERE parent_tenant_id = get_my_tenant_id())
  );

CREATE POLICY "tenant_settings_write"
  ON tenant_settings FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

-- =============================================================
-- subscription_plans
-- =============================================================

CREATE POLICY "subscription_plans_select"
  ON subscription_plans FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "subscription_plans_write"
  ON subscription_plans FOR ALL TO authenticated
  USING (is_superadmin()) WITH CHECK (is_superadmin());

-- =============================================================
-- modules
-- =============================================================

CREATE POLICY "modules_select"
  ON modules FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "modules_write"
  ON modules FOR ALL TO authenticated
  USING (is_superadmin()) WITH CHECK (is_superadmin());

-- =============================================================
-- categories
-- =============================================================

CREATE POLICY "categories_select"
  ON categories FOR SELECT TO authenticated
  USING (
    is_superadmin()
    OR tenant_id = get_my_tenant_id()
    OR tenant_id = (SELECT parent_tenant_id FROM tenants WHERE id = get_my_tenant_id())
  );

CREATE POLICY "categories_write"
  ON categories FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

-- =============================================================
-- products
-- =============================================================

CREATE POLICY "products_select"
  ON products FOR SELECT TO authenticated
  USING (
    is_superadmin()
    OR tenant_id = get_my_tenant_id()
    OR tenant_id = (SELECT parent_tenant_id FROM tenants WHERE id = get_my_tenant_id())
  );

CREATE POLICY "products_write"
  ON products FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

-- =============================================================
-- customization_phases
-- =============================================================

CREATE POLICY "customization_phases_select"
  ON customization_phases FOR SELECT TO authenticated
  USING (
    is_superadmin()
    OR tenant_id = get_my_tenant_id()
    OR tenant_id = (SELECT parent_tenant_id FROM tenants WHERE id = get_my_tenant_id())
  );

CREATE POLICY "customization_phases_write"
  ON customization_phases FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

-- =============================================================
-- customization_option_groups
-- =============================================================

CREATE POLICY "customization_option_groups_select"
  ON customization_option_groups FOR SELECT TO authenticated
  USING (
    is_superadmin()
    OR tenant_id = get_my_tenant_id()
    OR tenant_id = (SELECT parent_tenant_id FROM tenants WHERE id = get_my_tenant_id())
  );

CREATE POLICY "customization_option_groups_write"
  ON customization_option_groups FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

-- =============================================================
-- customization_options
-- =============================================================

CREATE POLICY "customization_options_select"
  ON customization_options FOR SELECT TO authenticated
  USING (
    is_superadmin()
    OR tenant_id = get_my_tenant_id()
    OR tenant_id = (SELECT parent_tenant_id FROM tenants WHERE id = get_my_tenant_id())
  );

CREATE POLICY "customization_options_write"
  ON customization_options FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

-- =============================================================
-- product_customization_phases
-- =============================================================

CREATE POLICY "product_customization_phases_select"
  ON product_customization_phases FOR SELECT TO authenticated
  USING (
    is_superadmin()
    OR tenant_id = get_my_tenant_id()
    OR tenant_id = (SELECT parent_tenant_id FROM tenants WHERE id = get_my_tenant_id())
  );

CREATE POLICY "product_customization_phases_write"
  ON product_customization_phases FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

-- =============================================================
-- order_types
-- =============================================================

CREATE POLICY "order_types_select"
  ON order_types FOR SELECT TO authenticated
  USING (
    is_superadmin()
    OR tenant_id = get_my_tenant_id()
    OR tenant_id = (SELECT parent_tenant_id FROM tenants WHERE id = get_my_tenant_id())
  );

CREATE POLICY "order_types_write"
  ON order_types FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

-- =============================================================
-- payment_methods
-- =============================================================

CREATE POLICY "payment_methods_select"
  ON payment_methods FOR SELECT TO authenticated
  USING (
    is_superadmin()
    OR tenant_id = get_my_tenant_id()
    OR tenant_id = (SELECT parent_tenant_id FROM tenants WHERE id = get_my_tenant_id())
  );

CREATE POLICY "payment_methods_write"
  ON payment_methods FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

-- =============================================================
-- restaurant_zones / restaurant_tables
-- =============================================================

CREATE POLICY "restaurant_zones_select"
  ON restaurant_zones FOR SELECT TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id());

CREATE POLICY "restaurant_zones_write"
  ON restaurant_zones FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

CREATE POLICY "restaurant_tables_select"
  ON restaurant_tables FOR SELECT TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id());

CREATE POLICY "restaurant_tables_write"
  ON restaurant_tables FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

-- =============================================================
-- customers
-- =============================================================

CREATE POLICY "customers_select"
  ON customers FOR SELECT TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id());

CREATE POLICY "customers_write"
  ON customers FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

-- =============================================================
-- loyalty_programs / loyalty_accounts / loyalty_rewards
-- =============================================================

CREATE POLICY "loyalty_programs_all"
  ON loyalty_programs FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

CREATE POLICY "loyalty_accounts_all"
  ON loyalty_accounts FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

CREATE POLICY "loyalty_rewards_all"
  ON loyalty_rewards FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

-- =============================================================
-- pos_sessions / pos_auth_sessions
-- =============================================================

CREATE POLICY "pos_sessions_all"
  ON pos_sessions FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

CREATE POLICY "pos_auth_sessions_all"
  ON pos_auth_sessions FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

-- =============================================================
-- pos_transactions / pos_transaction_items / pos_transaction_payments
-- =============================================================

CREATE POLICY "pos_transactions_all"
  ON pos_transactions FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

CREATE POLICY "pos_transaction_items_all"
  ON pos_transaction_items FOR ALL TO authenticated
  USING (
    is_superadmin()
    OR transaction_id IN (SELECT id FROM pos_transactions WHERE tenant_id = get_my_tenant_id())
  )
  WITH CHECK (
    is_superadmin()
    OR transaction_id IN (SELECT id FROM pos_transactions WHERE tenant_id = get_my_tenant_id())
  );

CREATE POLICY "pos_transaction_payments_all"
  ON pos_transaction_payments FOR ALL TO authenticated
  USING (
    is_superadmin()
    OR transaction_id IN (SELECT id FROM pos_transactions WHERE tenant_id = get_my_tenant_id())
  )
  WITH CHECK (
    is_superadmin()
    OR transaction_id IN (SELECT id FROM pos_transactions WHERE tenant_id = get_my_tenant_id())
  );

-- =============================================================
-- kitchen_orders
-- =============================================================

CREATE POLICY "kitchen_orders_all"
  ON kitchen_orders FOR ALL TO authenticated
  USING (
    is_superadmin()
    OR tenant_id = get_my_tenant_id()
    OR tenant_id IN (SELECT id FROM tenants WHERE parent_tenant_id = get_my_tenant_id())
  )
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());

-- =============================================================
-- kds_tokens
-- =============================================================

CREATE POLICY "kds_tokens_all"
  ON kds_tokens FOR ALL TO authenticated
  USING (is_superadmin() OR tenant_id = get_my_tenant_id())
  WITH CHECK (is_superadmin() OR tenant_id = get_my_tenant_id());
