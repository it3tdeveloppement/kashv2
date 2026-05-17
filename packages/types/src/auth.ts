import type { AppRole } from "./tenant";

export interface BackofficeUser {
  id: string;
  email: string;
  tenant_id: string | null;
  role: AppRole;
  first_name: string | null;
  last_name: string | null;
  two_factor_enabled: boolean;
}

/**
 * JWT claims issued by pos-auth edge function.
 * Used by PowerSync to scope sync rules per device.
 */
export interface PosJwtClaims {
  sub: string;
  user_id: string;
  tenant_id: string;
  establishment_id: string | null;
  role: "pos";
  session_token: string;
  exp: number;
  iat: number;
}

/**
 * JWT claims for kiosk terminals (no human user).
 * Issued by terminal-data edge function.
 */
export interface KioskJwtClaims {
  sub: string;
  tenant_id: string;
  establishment_id: string;
  role: "kiosk";
  exp: number;
  iat: number;
}

/**
 * JWT claims for KDS hardware displays.
 */
export interface KdsJwtClaims {
  sub: string;
  tenant_id: string;
  establishment_id: string | null;
  role: "kds";
  token: string;
  exp: number;
  iat: number;
}

export interface TwoFactorChannel {
  id: string;
  user_id: string;
  channel: "email" | "sms" | "whatsapp";
  contact: string;
  is_verified: boolean;
  is_primary: boolean;
  created_at: string;
}

export interface PosLoginPayload {
  pin: string;
  tenant_id: string;
  establishment_id?: string;
  device_id?: string;
}

export interface PosLoginResponse {
  session_token: string;
  powersync_token: string;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    role: AppRole;
  };
  tenant_id: string;
  establishment_id: string | null;
  expires_at: string;
}
