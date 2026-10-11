import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";
import type { AuthUser, UserRole } from "@/types/auth";

const VALID_ROLES: UserRole[] = ["admin", "collaborator", "user", "creator"];

export function mapSupabaseUser(user: User): AuthUser {
  const rawRole = (user.app_metadata?.role as string) || "user";
  const role: UserRole = VALID_ROLES.includes(rawRole as UserRole)
    ? (rawRole as UserRole)
    : "user";
  return {
    id: user.id,
    email: user.email ?? "",
    username:
      user.user_metadata?.username ||
      user.user_metadata?.full_name ||
      (user.email ? user.email.split("@")[0] : "Utilisateur"),
    role,
    avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
  };
}

export const authService = {
  async sendOtp(email: string, role: UserRole, username: string) {
    if (!["user", "creator"].includes(role)) throw new Error("Inscription réservée aux marques et créateurs.");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { role, username },
      },
    });
    if (error) throw error;
  },

  async verifyOtpAndSetPassword(
    email: string,
    token: string,
    password: string,
    role: UserRole,
    username: string,
  ) {
    if (!["user", "creator"].includes(role)) throw new Error("Rôle interdit.");
    if (password.length < 10) throw new Error("Mot de passe de 10 caractères minimum.");
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (verifyError) throw verifyError;
    if (!verifyData.user) throw new Error("Vérification impossible.");

    const { data: updated, error: updateError } = await supabase.auth.updateUser({
      password,
      data: { role, username },
    });
    if (updateError) throw updateError;
    if (!updated.user) throw new Error("Mise à jour impossible.");
    return updated.user;
  },

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error("Connexion impossible.");
    return data.user;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
