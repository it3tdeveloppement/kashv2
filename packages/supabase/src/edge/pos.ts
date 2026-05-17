import { getSupabaseClient } from "../client";
import type {
  PosTransaction,
  PosTransactionItem,
  PosTransactionPayment,
  KitchenOrder,
} from "@kash/types";

export interface PosTransactionPayload {
  session_token: string;
  transaction: Omit<PosTransaction, "id" | "created_at" | "updated_at">;
  items: Omit<PosTransactionItem, "id" | "transaction_id">[];
  payments: Omit<PosTransactionPayment, "id" | "transaction_id" | "created_at">[];
}

export interface PosTransactionResult {
  transaction: PosTransaction;
  kitchen_order: KitchenOrder | null;
  order_number: string;
}

export async function callPosTransaction(
  payload: PosTransactionPayload
): Promise<PosTransactionResult> {
  const { data, error } = await getSupabaseClient().functions.invoke<PosTransactionResult>(
    "pos-transaction",
    { body: payload }
  );
  if (error) throw error;
  if (!data) throw new Error("No response from pos-transaction");
  return data;
}

export interface PosDataWritePayload {
  session_token: string;
  action: "update_transaction" | "reprint" | "cancel_transaction";
  transaction_id: string;
  data?: Record<string, unknown>;
}

export async function callPosData<T>(payload: PosDataWritePayload): Promise<T> {
  const { data, error } = await getSupabaseClient().functions.invoke<T>("pos-data", {
    body: payload,
  });
  if (error) throw error;
  if (!data) throw new Error("No response from pos-data");
  return data;
}

export interface PosCustomerPayload {
  session_token: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  tenant_id: string;
}

export async function callPosCustomer(payload: PosCustomerPayload) {
  const { data, error } = await getSupabaseClient().functions.invoke("pos-customer", {
    body: payload,
  });
  if (error) throw error;
  return data;
}

export interface PosAuthPayload {
  pin: string;
  tenant_id: string;
  establishment_id?: string;
  device_id?: string;
}

export interface PosAuthResult {
  session_token: string;
  powersync_token: string;
  user: { id: string; first_name: string | null; last_name: string | null; role: string };
  tenant_id: string;
  establishment_id: string | null;
  expires_at: string;
}

export async function callPosAuth(payload: PosAuthPayload): Promise<PosAuthResult> {
  const { data, error } = await getSupabaseClient().functions.invoke<PosAuthResult>("pos-auth", {
    body: payload,
  });
  if (error) throw error;
  if (!data) throw new Error("No response from pos-auth");
  return data;
}
