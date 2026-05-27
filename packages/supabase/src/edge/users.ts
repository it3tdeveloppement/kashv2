import { getSupabaseClient } from "../client";

export interface BackofficeCreateUserPayload {
  email: string;
  password: string;
  first_name?: string | null;
  last_name?: string | null;
  role: "admin" | "manager" | "staff" | "cashier";
  tenant_id: string;
  establishment_id?: string | null;
  pos_pin?: string | null;
}

export interface BackofficeCreateUserResult {
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    tenant_id: string;
    establishment_id: string | null;
    pos_pin: string | null;
  };
}

export async function callBackofficeCreateUser(
  payload: BackofficeCreateUserPayload
): Promise<BackofficeCreateUserResult> {
  const { data, error } = await getSupabaseClient().functions.invoke<BackofficeCreateUserResult>(
    "backoffice-create-user",
    { body: payload }
  );
  if (error) throw error;
  if (!data) throw new Error("No response from backoffice-create-user");
  return data;
}

