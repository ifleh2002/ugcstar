// Edge Function: invite-user
// Allows an admin to invite a new user by email with a pre-filled role.
// - Verifies the caller via JWT (must have app_metadata.role === 'admin').
// - Uses supabase.auth.admin.inviteUserByEmail to send the invitation email
//   with role & username pre-filled in user_metadata, so the handle_new_user
//   trigger provisions the correct user_profile on first login.

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
      console.error("[invite-user] caller lookup failed:", callerError?.message);
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
      | { email?: string; role?: Role; username?: string }
      | null;
    if (!payload || !payload.email || !payload.role) {
      return jsonResponse(
        { error: "Paramètres manquants (email et role requis)." },
        400,
      );
    }
    const email = payload.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return jsonResponse({ error: "Email invalide." }, 400);
    }
    if (!VALID_ROLES.includes(payload.role)) {
      return jsonResponse(
        {
          error: `Rôle invalide : « ${payload.role} ». Valeurs acceptées : ${VALID_ROLES.join(", ")}.`,
        },
        400,
      );
    }

    const username = payload.username?.trim() || email.split("@")[0];

    // 5. Service-role client for the privileged invite
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 6. Send invitation with role pre-filled in metadata.
    //    The handle_new_user trigger will pick up role & username from
    //    raw_app_meta_data when the account is created on first sign-in.
    const { data: invited, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: "https://ugcstar.vercel.app/auth/activate",
        data: {
          username,
          invited_by: caller.email,
          invited_at: new Date().toISOString(),
        },
      });

    if (inviteError || !invited?.user) {
      console.error("[invite-user] invite failed:", inviteError?.message);
      const message = inviteError?.message ?? "Erreur inconnue";
      // Friendlier wording for the most common failure.
      const friendly = /already (been )?registered|already exists|duplicate/i.test(message)
        ? "Cet email est déjà associé à un compte existant."
        : `Invitation échouée : ${message}`;
      return jsonResponse({ error: friendly }, 400);
    }

    // Roles belong to server-controlled metadata, never user-editable fields.
    const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(invited.user.id, {
      app_metadata: { ...invited.user.app_metadata, role: payload.role },
    });
    if (roleError) return jsonResponse({ error: "Invitation envoyée, attribution du rôle échouée." }, 500);
    const { error: profileError } = await supabaseAdmin.from("user_profiles").upsert({
      id: invited.user.id, email, username, role: payload.role,
    });
    if (profileError) return jsonResponse({ error: "Invitation envoyée, synchronisation du profil échouée." }, 500);

    console.log(
      `[invite-user] admin=${caller.email} invited=${email} role=${payload.role}`,
    );

    return jsonResponse({
      success: true,
      user: {
        id: invited.user.id,
        email: invited.user.email,
        role: payload.role,
        username,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur inconnue";
    console.error("[invite-user] fatal:", msg);
    return jsonResponse({ error: msg }, 500);
  }
});
