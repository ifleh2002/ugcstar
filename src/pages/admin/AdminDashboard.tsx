import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, ROLE_SYMBOLS, type UserRole } from "@/types/auth";
import { cn, formatPrice } from "@/lib/utils";
import { CONTRACTS, ORDERS } from "@/lib/mockData";

interface ProfileRow {
  id: string;
  username: string | null;
  email: string;
  role: UserRole;
}

interface RoleChangeLog {
  id: string;
  user_id: string | null;
  previous_role: UserRole;
  new_role: UserRole;
  changed_by: string | null;
  changed_at: string;
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "#d14d2c",
  collaborator: "#8b7355",
  user: "#1a1612",
  creator: "#4a3e35",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [filter, setFilter] = useState<UserRole | "all">("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("user");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [logs, setLogs] = useState<RoleChangeLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, username, email, role")
      .order("role", { ascending: true });
    if (error) {
      toast.error(`Chargement impossible : ${error.message}`);
    } else {
      setUsers((data ?? []) as ProfileRow[]);
    }
    setLoading(false);
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    const { data, error } = await supabase
      .from("role_change_logs")
      .select("id, user_id, previous_role, new_role, changed_by, changed_at")
      .order("changed_at", { ascending: false })
      .limit(50);
    if (error) {
      toast.error(`Historique indisponible : ${error.message}`);
    } else {
      setLogs((data ?? []) as RoleChangeLog[]);
    }
    setLogsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const stats = useMemo(() => {
    const by: Record<UserRole, number> = { admin: 0, collaborator: 0, user: 0, creator: 0 };
    users.forEach((u) => { by[u.role] = (by[u.role] ?? 0) + 1; });
    return by;
  }, [users]);

  const handleRoleChange = async (target: ProfileRow, newRole: UserRole) => {
    if (target.role === newRole) return;
    const label = target.username ?? target.email;
    const ok = window.confirm(
      `Changer le rôle de « ${label} »\nde « ${ROLE_LABELS[target.role]} » vers « ${ROLE_LABELS[newRole]} » ?`,
    );
    if (!ok) return;

    setUpdatingId(target.id);
    const { error } = await supabase.functions.invoke("update-user-role", {
      body: { userId: target.id, newRole },
    });

    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const statusCode = error.context?.status ?? 500;
          const textContent = await error.context?.text();
          let detail = textContent;
          try {
            const parsed = textContent ? JSON.parse(textContent) : null;
            if (parsed && typeof parsed.error === "string") detail = parsed.error;
          } catch {
            // keep raw text
          }
          errorMessage = `[${statusCode}] ${detail || error.message || "Erreur inconnue"}`;
        } catch {
          errorMessage = error.message || "Erreur inconnue";
        }
      }
      toast.error("Mise à jour du rôle impossible", { description: errorMessage });
      setUpdatingId(null);
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === target.id ? { ...u, role: newRole } : u)),
    );
    toast.success(`Rôle mis à jour : ${ROLE_LABELS[newRole]}`, {
      description:
        "Le JWT de l'utilisateur sera synchronisé au prochain rafraîchissement de session.",
    });
    setUpdatingId(null);
    fetchLogs();
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Email requis.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email invalide.");
      return;
    }

    setInviteSubmitting(true);
    const { error } = await supabase.functions.invoke("invite-user", {
      body: {
        email,
        role: inviteRole,
        username: inviteUsername.trim() || undefined,
      },
    });

    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const statusCode = error.context?.status ?? 500;
          const textContent = await error.context?.text();
          let detail = textContent;
          try {
            const parsed = textContent ? JSON.parse(textContent) : null;
            if (parsed && typeof parsed.error === "string") detail = parsed.error;
          } catch {
            // keep raw text
          }
          errorMessage = `[${statusCode}] ${detail || error.message || "Erreur inconnue"}`;
        } catch {
          errorMessage = error.message || "Erreur inconnue";
        }
      }
      toast.error("Invitation impossible", { description: errorMessage });
      setInviteSubmitting(false);
      return;
    }

    toast.success(`Invitation envoyée à ${email}`, {
      description: `Rôle pré-rempli : ${ROLE_LABELS[inviteRole]}. L'utilisateur recevra un email avec un lien pour activer son compte.`,
    });
    setInviteEmail("");
    setInviteUsername("");
    setInviteRole("user");
    setInviteSubmitting(false);
    fetchUsers();
  };

  const filtered = useMemo(
    () => (filter === "all" ? users : users.filter((u) => u.role === filter)),
    [users, filter],
  );

  const userById = useMemo(() => {
    const m = new Map<string, ProfileRow>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  const formatLogTimestamp = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const totalRevenue = CONTRACTS.reduce((s, c) => s + c.amount, 0);
  const totalCommission = Math.round(totalRevenue * 0.15);
  const totalOrders = ORDERS.length;
  const roleOrder: UserRole[] = ["admin", "collaborator", "user", "creator"];

  return (
    <div className="container py-10 md:py-14">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="label-base">Console administrateur</span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Pilotage StarCast
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Supervision des comptes, commandes, contrats et commissions plateforme.
            Connecté·e en tant que{" "}
            <span className="font-semibold text-foreground">{user?.username}</span>.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/contracts/analytics" className="btn-outline">↗ Analytics</Link>
          <Link to="/dashboard" className="btn-primary">Vue commandes</Link>
        </div>
      </div>

      {/* KPIs plateforme */}
      <section className="mt-10 grid gap-4 md:grid-cols-4">
        <div className="card-base p-6">
          <p className="label-base">Comptes actifs</p>
          <p className="mt-2 font-display text-4xl font-semibold num">{users.length}</p>
          <p className="mt-2 text-xs text-muted-foreground">Tous rôles confondus</p>
        </div>
        <div className="card-base p-6">
          <p className="label-base">Commandes</p>
          <p className="mt-2 font-display text-4xl font-semibold num">{totalOrders}</p>
          <p className="mt-2 text-xs text-muted-foreground">Toutes périodes</p>
        </div>
        <div className="card-base bg-secondary/40 p-6">
          <p className="label-base">Volume d'affaires</p>
          <p className="mt-2 font-display text-4xl font-semibold num text-primary">
            {formatPrice(totalRevenue)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">TTC</p>
        </div>
        <div className="card-base p-6">
          <p className="label-base">Commission plateforme</p>
          <p className="mt-2 font-display text-4xl font-semibold num">{formatPrice(totalCommission)}</p>
          <p className="mt-2 text-xs text-muted-foreground">15 % appliqués</p>
        </div>
      </section>

      {/* Breakdown par rôle */}
      <section className="mt-6 grid gap-4 md:grid-cols-4">
        {roleOrder.map((r) => (
          <article key={r} className="card-base overflow-hidden">
            <div className="border-l-[3px] p-5" style={{ borderColor: ROLE_COLORS[r] }}>
              <div className="flex items-center justify-between">
                <span className="font-display text-xl" style={{ color: ROLE_COLORS[r] }}>
                  {ROLE_SYMBOLS[r]}
                </span>
                <span className="pill">{r}</span>
              </div>
              <h3 className="mt-3 font-display text-base font-semibold">{ROLE_LABELS[r]}</h3>
              <p
                className="mt-2 font-display text-3xl font-semibold num"
                style={{ color: ROLE_COLORS[r] }}
              >
                {stats[r]}
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* Formulaire d'invitation */}
      <section className="mt-10">
        <div>
          <span className="label-base">Invitation</span>
          <h2 className="mt-1 font-display text-xl font-semibold">
            Inviter un nouvel utilisateur
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            L'utilisateur recevra un email avec un lien d'activation. Le rôle est
            pré-rempli dans <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">user_metadata</code>{' '}
            via <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">supabase.auth.admin.inviteUserByEmail</code>.
          </p>
        </div>

        <form onSubmit={handleInvite} className="mt-5 card-base p-6">
          <div className="grid gap-4 md:grid-cols-[1.6fr_1.4fr_1fr_auto] md:items-end">
            <div>
              <label className="label-base" htmlFor="invite-email">
                Email
              </label>
              <input
                id="invite-email"
                type="email"
                autoComplete="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="nouveau@domaine.com"
                className="input-base mt-2"
                required
                disabled={inviteSubmitting}
              />
            </div>
            <div>
              <label className="label-base" htmlFor="invite-username">
                Nom d'affichage{' '}
                <span className="text-muted-foreground normal-case">(optionnel)</span>
              </label>
              <input
                id="invite-username"
                type="text"
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                placeholder="Camille Martin"
                className="input-base mt-2"
                disabled={inviteSubmitting}
              />
            </div>
            <div>
              <label className="label-base" htmlFor="invite-role">
                Rôle
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                disabled={inviteSubmitting}
                className="mt-2 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm font-semibold focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-wait disabled:opacity-60"
              >
                {roleOrder.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_SYMBOLS[r]} {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={inviteSubmitting}
              className="btn-primary whitespace-nowrap"
            >
              {inviteSubmitting ? "Envoi…" : "✉ Envoyer l'invitation"}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
            <span
              className="rounded-full px-2 py-0.5 font-bold uppercase tracking-wider text-primary-foreground"
              style={{ backgroundColor: ROLE_COLORS[inviteRole] }}
            >
              {ROLE_SYMBOLS[inviteRole]} {ROLE_LABELS[inviteRole]}
            </span>
            <span>sera attribué au moment de l'activation du compte.</span>
          </div>
        </form>
      </section>

      {/* Annuaire */}
      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <span className="label-base">Annuaire</span>
            <h2 className="mt-1 font-display text-xl font-semibold">Comptes utilisateurs</h2>
          </div>
          <span className="label-base num">{filtered.length} affichés</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-sm border px-4 py-2 text-xs font-semibold transition-colors",
              filter === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted",
            )}
          >
            Tous · {users.length}
          </button>
          {roleOrder.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilter(r)}
              className={cn(
                "rounded-sm border px-4 py-2 text-xs font-semibold transition-colors",
                filter === r
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              {ROLE_SYMBOLS[r]} {ROLE_LABELS[r]} · {stats[r]}
            </button>
          ))}
        </div>

        <div className="mt-5 card-base overflow-hidden">
          {loading && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Chargement de l'annuaire…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Aucun compte dans ce filtre.
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <div className="divide-y divide-border">
              {filtered.map((u) => {
                const name = u.username ?? u.email.split("@")[0];
                const initials = name
                  .split(/\s+/)
                  .map((s) => s[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <div
                    key={u.id}
                    className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-primary-foreground"
                        style={{ backgroundColor: ROLE_COLORS[u.role] }}
                      >
                        {initials || "·"}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-base font-semibold">{name}</p>
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground"
                            style={{ backgroundColor: ROLE_COLORS[u.role] }}
                          >
                            {ROLE_SYMBOLS[u.role]} {ROLE_LABELS[u.role]}
                          </span>
                          {u.id === user?.id && (
                            <span className="pill border-primary/40 bg-primary/5 text-primary">
                              Vous
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground num">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {u.id === user?.id ? (
                        <span className="rounded-sm bg-muted px-3 py-1.5 text-[11px] italic text-muted-foreground">
                          Rôle verrouillé (compte courant)
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`role-${u.id}`}
                            className="label-base"
                          >
                            Rôle
                          </label>
                          <select
                            id={`role-${u.id}`}
                            value={u.role}
                            disabled={updatingId === u.id}
                            onChange={(e) =>
                              handleRoleChange(u, e.target.value as UserRole)
                            }
                            className="rounded-sm border border-input bg-background px-3 py-1.5 text-xs font-semibold focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-wait disabled:opacity-60"
                            aria-label={`Changer le rôle de ${u.username ?? u.email}`}
                          >
                            {roleOrder.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_SYMBOLS[r]} {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                          {updatingId === u.id && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                              Sync…
                            </span>
                          )}
                        </div>
                      )}
                      <span className="font-mono text-[10px] text-muted-foreground num">
                        ID · {u.id.slice(0, 8)}…
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Historique des changements de rôle */}
      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="label-base">Audit</span>
            <h2 className="mt-1 font-display text-xl font-semibold">Historique des rôles</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Journal des 50 dernières modifications appliquées via la console.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchLogs()}
            disabled={logsLoading}
            className="btn-outline text-xs"
          >
            {logsLoading ? "Actualisation…" : "↻ Actualiser"}
          </button>
        </div>

        <div className="mt-5 card-base overflow-hidden">
          {logsLoading && logs.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Chargement de l'historique…
            </div>
          )}
          {!logsLoading && logs.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Aucune modification de rôle enregistrée pour l'instant.
            </div>
          )}
          {logs.length > 0 && (
            <div className="divide-y divide-border">
              {logs.map((log) => {
                const target = log.user_id ? userById.get(log.user_id) : null;
                const changer = log.changed_by ? userById.get(log.changed_by) : null;
                const prev = log.previous_role;
                const next = log.new_role;
                return (
                  <div
                    key={log.id}
                    className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-primary-foreground"
                        style={{ backgroundColor: ROLE_COLORS[next] ?? "#1a1612" }}
                      >
                        {ROLE_SYMBOLS[next] ?? "•"}
                      </div>
                      <div>
                        <p className="font-display text-sm font-semibold">
                          {target?.username ?? target?.email ?? (
                            <span className="italic text-muted-foreground">
                              Compte supprimé · {log.user_id?.slice(0, 8) ?? "?"}
                            </span>
                          )}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span
                            className="rounded-full px-2 py-0.5 font-bold uppercase tracking-wider text-primary-foreground"
                            style={{ backgroundColor: ROLE_COLORS[prev] ?? "#1a1612" }}
                          >
                            {ROLE_SYMBOLS[prev] ?? "•"} {ROLE_LABELS[prev] ?? prev}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span
                            className="rounded-full px-2 py-0.5 font-bold uppercase tracking-wider text-primary-foreground"
                            style={{ backgroundColor: ROLE_COLORS[next] ?? "#1a1612" }}
                          >
                            {ROLE_SYMBOLS[next] ?? "•"} {ROLE_LABELS[next] ?? next}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-1 text-[11px] text-muted-foreground md:items-end">
                      <span>
                        Par{" "}
                        <span className="font-semibold text-foreground">
                          {changer?.username ?? changer?.email ?? (
                            <span className="italic">Admin inconnu</span>
                          )}
                        </span>
                      </span>
                      <span className="num">{formatLogTimestamp(log.changed_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
