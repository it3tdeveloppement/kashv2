import { getSupabaseClient } from "../client";

export async function callPreLogin2faCheck(email: string, password: string) {
  const { data, error } = await getSupabaseClient().functions.invoke("pre-login-2fa-check", {
    body: { email, password },
  });
  if (error) throw error;
  return data as { requires_2fa: boolean; user_id: string; channels: string[] };
}

export async function callSend2faCode(userId: string, channel: "email" | "sms" | "whatsapp") {
  const { data, error } = await getSupabaseClient().functions.invoke("send-2fa-code", {
    body: { user_id: userId, channel },
  });
  if (error) throw error;
  return data as { sent: boolean };
}

export async function callVerify2faCode(userId: string, code: string) {
  const { data, error } = await getSupabaseClient().functions.invoke("verify-2fa-code", {
    body: { user_id: userId, code },
  });
  if (error) throw error;
  return data as { valid: boolean; session: unknown };
}

export async function callLoyaltyPortalAuth(
  tenantSlug: string,
  phone: string,
  code?: string
) {
  const { data, error } = await getSupabaseClient().functions.invoke("loyalty-portal-auth", {
    body: { tenant_slug: tenantSlug, phone, code },
  });
  if (error) throw error;
  return data;
}
