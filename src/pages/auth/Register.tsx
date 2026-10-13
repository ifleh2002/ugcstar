import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { authService, mapSupabaseUser } from "@/lib/authService";
import { useAuth } from "@/contexts/AuthContext";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_SYMBOLS,
  type UserRole,
} from "@/types/auth";
import { cn } from "@/lib/utils";

const ROLES: UserRole[] = ["user", "creator"];

export default function Register() {
  const nav = useNavigate();
  const { user, loading, login } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<UserRole>(searchParams.get("role") === "creator" ? "creator" : "user");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && step === 1) nav(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }, [user, loading, nav, step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !username.trim()) {
      toast.error("Email et nom d'affichage requis.");
      return;
    }
    setSubmitting(true);
    try {
      await authService.sendOtp(email.trim(), role, username.trim());
      toast.success(`Code envoyé à ${email}.`, {
        description: "Utilisez le code du dernier email reçu.",
      });
      setStep(2);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Envoi du code impossible.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || resending) return;
    const code = otp.trim();
    if (!/^\d{6,10}$/.test(code)) {
      toast.error("Saisissez le code complet reçu par email (6 à 10 chiffres).");
      return;
    }
    if (password.length < 10) {
      toast.error("Mot de passe trop court (10 caractères minimum).");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setSubmitting(true);
    try {
      const u = await authService.verifyOtpAndSetPassword(
        email.trim(),
        code,
        password,
        role,
        username.trim(),
      );
      const authUser = mapSupabaseUser(u);
      login(authUser);
      nav("/mon-profil", { replace: true });
      toast.success(`Compte créé — bienvenue ${authUser.username}.`, {
        description: `Rôle : ${ROLE_LABELS[authUser.role]}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Code invalide ou expiré.";
      toast.error(msg);
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resending || submitting) return;
    setResending(true);
    try {
      await authService.sendOtp(email.trim(), role, username.trim());
      setOtp("");
      toast.success("Nouveau code envoyé. Utilisez uniquement le dernier email reçu.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Envoi impossible.";
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="container min-h-[80vh] py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Retour à l'accueil
        </Link>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <span className="label-base">Inscription · Étape {step}/2</span>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
              {step === 1 ? "Créez votre compte" : "Vérifiez & sécurisez"}
            </h1>
          </div>
          <Link to="/auth/login" className="text-xs font-semibold text-primary hover:underline whitespace-nowrap">
            J'ai déjà un compte
          </Link>
        </div>

        <div className="mt-6 flex gap-2">
          <div className={cn("h-1 flex-1 rounded-full transition-colors", step >= 1 ? "bg-primary" : "bg-muted")} />
          <div className={cn("h-1 flex-1 rounded-full transition-colors", step >= 2 ? "bg-primary" : "bg-muted")} />
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="mt-8 space-y-7">
            <section>
              <label className="label-base">1 — Choisissez votre rôle</label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {ROLES.map((r) => {
                  const selected = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      aria-pressed={selected}
                      className={cn(
                        "relative flex flex-col rounded-sm border p-4 text-left transition-all",
                        selected
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                          : "border-border bg-background hover:border-foreground/50 hover:bg-muted/40",
                      )}
                    >
                      {selected && (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                          ✓
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xl text-primary">{ROLE_SYMBOLS[r]}</span>
                        <span className="font-display text-base font-semibold">{ROLE_LABELS[r]}</span>
                      </div>
                      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                        {ROLE_DESCRIPTIONS[r]}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Les accès Administrateur et Collaborateur sont attribués par invitation uniquement.
              </p>
            </section>

            <div className="h-px bg-border" />

            <section className="space-y-4">
              <label className="label-base block">2 — Vos informations</label>
              <div>
                <label className="label-base" htmlFor="username">Nom d'affichage</label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={role === "creator" ? "Léa Marchand" : role === "user" ? "Lumi Cosmetics" : "Votre nom complet"}
                  className="input-base mt-2"
                  required
                />
              </div>
              <div>
                <label className="label-base" htmlFor="reg-email">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@domaine.com"
                  className="input-base mt-2"
                  required
                />
              </div>
            </section>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Envoi du code…" : "Recevoir le code par email"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify} className="mt-8 space-y-7">
            <section className="card-base p-5">
              <p className="label-base">Compte en cours de création</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="pill border-primary/30 bg-primary/5 text-primary">
                  {ROLE_SYMBOLS[role]} {ROLE_LABELS[role]}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="font-display font-semibold">{username}</span>
                <span className="text-muted-foreground">·</span>
                <span className="num text-muted-foreground">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-3 text-[11px] font-semibold text-primary hover:underline"
              >
                ← Modifier
              </button>
            </section>

            <section>
              <label className="label-base" htmlFor="registration-otp">Code reçu par email</label>
              <input id="registration-otp" type="text" inputMode="numeric" autoComplete="one-time-code"
                value={otp} maxLength={10} pattern="[0-9]{6,10}" required
                disabled={submitting || resending}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0,10))}
                className="input-base mt-3 h-14 text-center text-2xl tracking-[0.35em]"
                placeholder="Code complet" />
              <p className="mt-2 text-xs text-muted-foreground">Copiez le code complet du dernier email reçu. Un code est à usage unique.</p>
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || submitting}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  {resending ? "Envoi en cours…" : "Renvoyer le code"}
                </button>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <label className="label-base" htmlFor="pwd">Mot de passe</label>
                <input
                  id="pwd"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="10 caractères minimum"
                  className="input-base mt-2"
                  required
                  minLength={10}
                />
              </div>
              <div>
                <label className="label-base" htmlFor="cfm">Confirmer le mot de passe</label>
                <input
                  id="cfm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirmez"
                  className="input-base mt-2"
                  required
                  minLength={10}
                />
              </div>
            </section>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Création du compte…" : "Créer mon compte"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
