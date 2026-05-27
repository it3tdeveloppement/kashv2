import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

// RS256 private key stored as base64 in Supabase secret POWERSYNC_PRIVATE_KEY
const PRIVATE_KEY_B64 = Deno.env.get("POWERSYNC_PRIVATE_KEY") ?? "";

async function getPrivateKey(): Promise<CryptoKey> {
  const pemString = atob(PRIVATE_KEY_B64);
  // Strip PEM headers and decode
  const pemBody = pemString
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const der = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

export async function signPowerSyncJwt(
  claims: Record<string, unknown>,
  expiresInSeconds = 3600
): Promise<string> {
  const key = await getPrivateKey();
  return create(
    { alg: "RS256", typ: "JWT", kid: "kash-v2" },
    {
      ...claims,
      iss: "kash-v2",
      iat: getNumericDate(0),
      exp: getNumericDate(expiresInSeconds),
    },
    key
  );
}
