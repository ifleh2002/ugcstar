// Edge Function: update-user-role
// Allows an admin to change another user's role.
// - Verifies the caller via JWT (must have app_metadata.role === 'admin').
// - Prevents an admin from modifying their own role (lockout protection).
// - Uses the service role to update auth.users.raw_app_meta_data via the admin API
//   so the role propagates into the user's JWT on next token refresh.
// - Syncs public.user_profiles.role in the same operation.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";
import { corsHeaders } from "../_shared/cors.ts";

const VALID_ROLES = ["admin", "collaborator", "user", "creator"] as const;
type Role = typeof VALID_ROLES[number];

Deno.serve(async (req) => {
  // CORS preflight — must be the first check.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (req.method !== "POST") return jsonResponse({ error: "Méthode non autorisée." }, 405);

    // 1. Extract caller JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Jeton d'authentification manquant." }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    // 2. Verify caller identity via anon client
    const supabaseAuthClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const {
      data: { user: caller },
      error: callerError,
    } = await supabaseAuthClient.auth.getUser(token);
    if (callerError || !caller) {
      console.error("[update-user-role] caller lookup failed:", callerError?.message);
      return jsonResponse({ error: "Session invalide ou expirée." }, 401);
    }

    // 3. Caller must be an admin
    const callerRole = (caller.app_metadata as Record<string, unknown> | null)?.role;
    if (callerRole !== "admin") {
      return jsonResponse(
        { error: "Accès refusé : rôle administrateur requis." },
        403,
      );
    }

    // 4. Parse & validate payload
    const payload = (await req.json().catch(() => null)) as
      | { userId?: string; newRole?: Role }
      | null;
    if (!payload || !payload.userId || !payload.newRole) {
      return jsonResponse(
        { error: "Paramètres manquants (userId, newRole requis)." },
        400,
      );
    }
    if (!VALID_ROLES.includes(payload.newRole)) {
      return jsonResponse(
        {
          error: `Rôle invalide : « ${payload.newRole} ». Valeurs acceptées : ${VALID_ROLES.join(", ")}.`,
        },
        400,
      );
    }
    if (payload.userId === caller.id) {
      return jsonResponse(
        {
          error:
            "Interdit : vous ne pouvez pas modifier votre propre rôle (protection anti-verrouillage).",
        },
        400,
      );
    }

    // 5. Service-role client to perform the privileged update
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 6. Fetch target to preserve existing metadata fields (username, avatar, etc.)
    const { data: targetData, error: fetchError } =
      await supabaseAdmin.auth.admin.getUserById(payload.userId);
    if (fetchError || !targetData.user) {
      console.error("[update-user-role] target lookup failed:", fetchError?.message);
      return jsonResponse(
        { error: `Utilisateur introuvable : ${fetchError?.message ?? "ID inconnu"}` },
        404,
      );
    }
    const currentMetadata =
      (targetData.user.app_metadata as Record<string, unknown> | null) ?? {};
    const previousRole = (currentMetadata.role as string | undefined) ?? "user";

    // 7. Update auth.users metadata → propagates into JWT on next token refresh.
    const { data: updated, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(payload.userId, {
        app_metadata: { ...currentMetadata, role: payload.newRole },
      });
    if (updateError || !updated.user) {
      console.error("[update-user-role] auth update failed:", updateError?.message);
      return jsonResponse(
        {
          error: `Mise à jour de l'authentification échouée : ${updateError?.message ?? "erreur inconnue"}`,
        },
        500,
      );
    }

    // 8. Sync public.user_profiles.role (trigger would also do it, but explicit is safer).
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .update({ role: payload.newRole })
      .eq("id", payload.userId);
    if (profileError) {
      console.error("[update-user-role] profile sync failed:", profileError.message);
    }

    // 9. Audit log — non-fatal if insert fails.
    const { error: logError } = await supabaseAdmin
      .from("role_change_logs")
      .insert({
        user_id: payload.userId,
        previous_role: previousRole,
        new_role: payload.newRole,
        changed_by: caller.id,
      });
    if (logError) {
      console.error("[update-user-role] audit log insert failed:", logError.message);
    }

    console.log(
      `[update-user-role] admin=${caller.email} changed user=${payload.userId} role: ${previousRole} → ${payload.newRole}`,
    );

    return jsonResponse({
      success: true,
      user: {
        id: updated.user.id,
        email: updated.user.email,
        previousRole,
        role: payload.newRole,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur inconnue";
    console.error("[update-user-role] fatal:", msg);
    return jsonResponse({ error: msg }, 500);
  }
});
