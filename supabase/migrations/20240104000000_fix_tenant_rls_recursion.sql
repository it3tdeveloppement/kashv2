-- Kash V2 - Fix tenant RLS recursion
-- Supabase/PostgREST returns 500 when a policy recursively reads its own table.

CREATE OR REPLACE FUNCTION get_tenant_parent_id(p_tenant_id UUID)
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT parent_tenant_id
  FROM public.tenants
  WHERE id = p_tenant_id
$$;

CREATE OR REPLACE FUNCTION is_child_of_my_tenant(p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.tenants t
      WHERE t.id = p_tenant_id
        AND t.parent_tenant_id = get_my_tenant_id()
    ),
    false
  )
$$;

CREATE OR REPLACE FUNCTION can_access_tenant(target_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    is_superadmin()
    OR target_tenant_id = get_my_tenant_id()
    OR get_tenant_parent_id(target_tenant_id) = get_my_tenant_id()
    OR target_tenant_id = get_tenant_parent_id(get_my_tenant_id())
    OR EXISTS (
      SELECT 1
      FROM public.user_tenant_access uta
      WHERE uta.user_id = auth.uid()
        AND uta.tenant_id = target_tenant_id
        AND uta.is_active = true
    ),
    false
  )
$$;

CREATE OR REPLACE FUNCTION can_write_tenant(target_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    is_superadmin()
    OR target_tenant_id = get_my_tenant_id()
    OR EXISTS (
      SELECT 1
      FROM public.user_tenant_access uta
      WHERE uta.user_id = auth.uid()
        AND uta.tenant_id = target_tenant_id
        AND uta.is_active = true
        AND uta.role IN ('admin', 'manager')
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

DROP POLICY IF EXISTS "tenants_select" ON tenants;
CREATE POLICY "tenants_select"
  ON tenants FOR SELECT TO authenticated
  USING (can_access_tenant(id));

DROP POLICY IF EXISTS "tenants_update" ON tenants;
CREATE POLICY "tenants_update"
  ON tenants FOR UPDATE TO authenticated
  USING (can_write_tenant(id))
  WITH CHECK (can_write_tenant(id));

DROP POLICY IF EXISTS "establishments_select" ON establishments;
CREATE POLICY "establishments_select"
  ON establishments FOR SELECT TO authenticated
  USING (can_access_tenant(tenant_id));

DROP POLICY IF EXISTS "establishments_write" ON establishments;
CREATE POLICY "establishments_write"
  ON establishments FOR ALL TO authenticated
  USING (can_write_tenant(tenant_id))
  WITH CHECK (can_write_tenant(tenant_id));

DROP POLICY IF EXISTS "tenant_settings_select" ON tenant_settings;
CREATE POLICY "tenant_settings_select"
  ON tenant_settings FOR SELECT TO authenticated
  USING (can_access_tenant(tenant_id));

DROP POLICY IF EXISTS "tenant_settings_write" ON tenant_settings;
CREATE POLICY "tenant_settings_write"
  ON tenant_settings FOR ALL TO authenticated
  USING (can_write_tenant(tenant_id))
  WITH CHECK (can_write_tenant(tenant_id));
