import { getSupabaseClient } from "../client";

export async function createTenantWithAdmin(params: {
  name: string;
  slug: string;
  admin_email: string;
  first_name: string;
  last_name: string;
  parent_id?: string;
}) {
  const { data, error } = await getSupabaseClient().rpc("create_tenant_with_admin", {
    name: params.name,
    slug: params.slug,
    admin_email: params.admin_email,
    fn: params.first_name,
    ln: params.last_name,
    parent_id: params.parent_id ?? null,
  });
  if (error) throw error;
  return data;
}

export async function createEstablishmentWithTenant(params: {
  parent_uuid: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  pos_enabled?: boolean;
  terminal_enabled?: boolean;
  kitchen_enabled?: boolean;
  display_enabled?: boolean;
}) {
  const { data, error } = await getSupabaseClient().rpc("create_establishment_with_tenant", {
    parent_uuid: params.parent_uuid,
    name: params.name,
    addr: params.address ?? null,
    phone: params.phone ?? null,
    email: params.email ?? null,
    pos_enabled: params.pos_enabled ?? true,
    terminal_enabled: params.terminal_enabled ?? false,
    kitchen_enabled: params.kitchen_enabled ?? false,
    display_enabled: params.display_enabled ?? false,
  });
  if (error) throw error;
  return data;
}

export async function cloneTenantConfiguration(parentId: string, newId: string) {
  const { data, error } = await getSupabaseClient().rpc("clone_tenant_configuration", {
    parent_id: parentId,
    new_id: newId,
  });
  if (error) throw error;
  return data;
}

export async function deleteTenantCompletely(tenantId: string) {
  const { data, error } = await getSupabaseClient().rpc("delete_tenant_completely", {
    uuid: tenantId,
  });
  if (error) throw error;
  return data;
}
