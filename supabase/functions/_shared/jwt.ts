import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const JWT_SECRET = Deno.env.get("POWERSYNC_JWT_SECRET") ?? "";

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signPowerSyncJwt(
  claims: Record<string, unknown>,
  expiresInSeconds = 3600
): Promise<string> {
  const key = await getKey();
  return create(
    { alg: "HS256", typ: "JWT" },
    {
      ...claims,
      iss: "kash-v2",
      iat: getNumericDate(0),
      exp: getNumericDate(expiresInSeconds),
    },
    key
  );
}
