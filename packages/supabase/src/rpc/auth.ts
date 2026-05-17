import { getSupabaseClient } from "../client";
import type { AppRole } from "@kash/types";

export async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  const { data, error } = await getSupabaseClient().rpc("has_role", {
    _user_id: userId,
    _role: role,
  });
  if (error) throw error;
  return data ?? false;
}

export async function getCurrentUserRole(): Promise<AppRole | null> {
  const { data, error } = await getSupabaseClient().rpc("get_current_user_role");
  if (error) throw error;
  return data;
}

export async function getCurrentUserTenant(): Promise<string | null> {
  const { data, error } = await getSupabaseClient().rpc("get_current_user_tenant");
  if (error) throw error;
  return data;
}

export async function canWriteModule(moduleCode: string): Promise<boolean> {
  const { data, error } = await getSupabaseClient().rpc("can_write_module", {
    p_module_code: moduleCode,
  });
  if (error) throw error;
  return data ?? false;
}

export async function getAllowedModuleCodes(): Promise<string[]> {
  const { data, error } = await getSupabaseClient().rpc("get_allowed_module_codes");
  if (error) throw error;
  return data ?? [];
}
