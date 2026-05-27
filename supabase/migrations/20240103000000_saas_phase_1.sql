-- Kash V2 - SaaS foundation tables
-- Adds cross-tenant access, module access, subscriptions, and tenant helpers.

CREATE TABLE IF NOT EXISTS module_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  icon TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS user_tenant_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'staff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS tenant_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  propagate_to_children BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, module_id)
);

CREATE TABLE IF NOT EXISTS user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  can_read BOOLEAN NOT NULL DEFAULT true,
  can_write BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id, module_id)
);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trialing',
  billing_period billing_period NOT NULL DEFAULT 'monthly',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_ends_at TIMESTAMPTZ,
  current_period_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_user_tenant_access_user ON user_tenant_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_access_tenant ON user_tenant_access(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_module_access_tenant ON tenant_module_access(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_user_tenant ON user_module_permissions(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);

ALTER TABLE module_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenant_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION can_access_tenant(target_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT
    is_superadmin()
    OR target_tenant_id = get_my_tenant_id()
    OR target_tenant_id IN (
      SELECT uta.tenant_id
      FROM public.user_tenant_access uta
      WHERE uta.user_id = auth.uid()
        AND uta.is_active = true
    )
    OR target_tenant_id IN (
      SELECT t.id
      FROM public.tenants t
      WHERE t.parent_tenant_id = get_my_tenant_id()
    )
$$;

CREATE OR REPLACE FUNCTION can_write_tenant(target_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT
    is_superadmin()
    OR target_tenant_id = get_my_tenant_id()
    OR target_tenant_id IN (
      SELECT uta.tenant_id
      FROM public.user_tenant_access uta
      WHERE uta.user_id = auth.uid()
        AND uta.is_active = true
        AND uta.role IN ('admin', 'manager')
    )
$$;

CREATE OR REPLACE FUNCTION can_write_module(p_module_code TEXT)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    is_superadmin()
    OR EXISTS (
      SELECT 1
      FROM public.user_module_permissions ump
      JOIN public.modules m ON m.id = ump.module_id
      WHERE ump.user_id = auth.uid()
        AND ump.tenant_id = get_my_tenant_id()
        AND m.code = p_module_code
        AND ump.can_write = true
    ),
    false
  )
$$;

CREATE OR REPLACE FUNCTION bootstrap_superadmin(
  p_email TEXT,
  p_full_name TEXT DEFAULT 'Kash Superadmin'
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE tenant_id IS NULL) THEN
    RAISE EXCEPTION 'A superadmin profile already exists';
  END IF;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(p_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No auth user found for email %', p_email;
  END IF;

  INSERT INTO public.profiles (
    id,
    tenant_id,
    email,
    first_name,
    last_name,
    role
  )
  VALUES (
    v_user_id,
    NULL,
    lower(p_email),
    p_full_name,
    NULL,
    'superadmin'
  )
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = NULL,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = 'superadmin';

  RETURN v_user_id;
END;
$$;

DROP POLICY IF EXISTS "module_families_select" ON module_families;
CREATE POLICY "module_families_select"
  ON module_families FOR SELECT TO authenticated
  USING (can_access_tenant(tenant_id));

DROP POLICY IF EXISTS "module_families_write" ON module_families;
CREATE POLICY "module_families_write"
  ON module_families FOR ALL TO authenticated
  USING (can_write_tenant(tenant_id))
  WITH CHECK (can_write_tenant(tenant_id));

DROP POLICY IF EXISTS "user_tenant_access_select" ON user_tenant_access;
CREATE POLICY "user_tenant_access_select"
  ON user_tenant_access FOR SELECT TO authenticated
  USING (is_superadmin() OR user_id = auth.uid() OR can_access_tenant(tenant_id));

DROP POLICY IF EXISTS "user_tenant_access_write" ON user_tenant_access;
CREATE POLICY "user_tenant_access_write"
  ON user_tenant_access FOR ALL TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

DROP POLICY IF EXISTS "tenant_module_access_select" ON tenant_module_access;
CREATE POLICY "tenant_module_access_select"
  ON tenant_module_access FOR SELECT TO authenticated
  USING (can_access_tenant(tenant_id));

DROP POLICY IF EXISTS "tenant_module_access_write" ON tenant_module_access;
CREATE POLICY "tenant_module_access_write"
  ON tenant_module_access FOR ALL TO authenticated
  USING (can_write_tenant(tenant_id))
  WITH CHECK (can_write_tenant(tenant_id));

DROP POLICY IF EXISTS "user_module_permissions_select" ON user_module_permissions;
CREATE POLICY "user_module_permissions_select"
  ON user_module_permissions FOR SELECT TO authenticated
  USING (is_superadmin() OR user_id = auth.uid() OR can_access_tenant(tenant_id));

DROP POLICY IF EXISTS "user_module_permissions_write" ON user_module_permissions;
CREATE POLICY "user_module_permissions_write"
  ON user_module_permissions FOR ALL TO authenticated
  USING (is_superadmin() OR can_write_tenant(tenant_id))
  WITH CHECK (is_superadmin() OR can_write_tenant(tenant_id));

DROP POLICY IF EXISTS "tenant_subscriptions_select" ON tenant_subscriptions;
CREATE POLICY "tenant_subscriptions_select"
  ON tenant_subscriptions FOR SELECT TO authenticated
  USING (is_superadmin() OR can_access_tenant(tenant_id));

DROP POLICY IF EXISTS "tenant_subscriptions_write" ON tenant_subscriptions;
CREATE POLICY "tenant_subscriptions_write"
  ON tenant_subscriptions FOR ALL TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());
