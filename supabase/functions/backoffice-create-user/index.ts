import { corsHeaders } from "../_shared/cors.ts";
import { getAnonClient, getServiceClient } from "../_shared/supabase.ts";

type AppRole = "superadmin" | "admin" | "manager" | "staff" | "cashier";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const anon = getAnonClient();
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
      error: callerError,
    } = await anon.auth.getUser(token);

    if (callerError || !caller) throw new Error("Unauthorized");

    const {
      email,
      password,
      first_name,
      last_name,
      role,
      tenant_id,
      establishment_id,
      pos_pin,
    } = await req.json();

    if (!email || !password || !role || !tenant_id) {
      throw new Error("email, password, role and tenant_id are required");
    }

    const db = getServiceClient();

    const { data: callerProfile, error: callerProfileError } = await db
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", caller.id)
      .single();

    if (callerProfileError || !callerProfile) throw new Error("Caller profile not found");

    const isCallerSuperadmin = callerProfile.tenant_id === null;
    const isCallerTenantAdmin =
      callerProfile.tenant_id === tenant_id &&
      (callerProfile.role === "admin" || callerProfile.role === "manager");

    if (!isCallerSuperadmin && !isCallerTenantAdmin) {
      throw new Error("Insufficient permissions to create users for this tenant");
    }

    const { data: createdAuthUser, error: createAuthError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: first_name ?? null,
        last_name: last_name ?? null,
      },
    });

    if (createAuthError || !createdAuthUser?.user) {
      throw new Error(createAuthError?.message ?? "Unable to create auth user");
    }

    const userId = createdAuthUser.user.id;

    const { error: profileError } = await db.from("profiles").insert({
      id: userId,
      tenant_id,
      email,
      first_name: first_name ?? null,
      last_name: last_name ?? null,
      role: role as AppRole,
      establishment_id: establishment_id ?? null,
      pos_pin: pos_pin ?? null,
    });

    if (profileError) {
      await db.auth.admin.deleteUser(userId);
      throw new Error(profileError.message);
    }

    return new Response(
      JSON.stringify({
        user: {
          id: userId,
          email,
          first_name: first_name ?? null,
          last_name: last_name ?? null,
          role,
          tenant_id,
          establishment_id: establishment_id ?? null,
          pos_pin: pos_pin ?? null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
