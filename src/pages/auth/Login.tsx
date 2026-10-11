import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService, mapSupabaseUser } from "@/lib/authService";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  useEffect(() => {
    if (!loading && user) {
      const dest = from === "/auth/login" || from === "/auth/register" ? "/dashboard" : from;
      nav(user.role === "admin" ? "/admin" : dest, { replace: true });
    }
  }, [user, loading, nav, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email et mot de passe requis.");
      return;
    }
    setSubmitting(true);
    try {
      const u = await authService.signInWithPassword(email.trim(), password);
      const authUser = mapSupabaseUser(u);
      login(authUser);
      toast.success(`Bienvenue ${authUser.username}.`, {
        description: `Connecté en tant que ${authUser.role}.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Identifiants invalides.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container min-h-[80vh] py-12 md:py-16">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <span className="label-base">Espace membre</span>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Bon retour sur StarCast
          </h1>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            Accédez à vos commandes, votre messagerie tripartite, vos contrats signés
            et vos diffusions Screenads.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-sm bg-secondary text-xs text-primary">◼</span>
              <span><strong className="font-semibold">Marques</strong> — suivez vos campagnes et validez les rendus.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-sm bg-secondary text-xs text-primary">★</span>
              <span><strong className="font-semibold">Créateurs</strong> — gérez briefs, livraisons et paiements.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-sm bg-secondary text-xs text-primary">◇</span>
              <span><strong className="font-semibold">Équipe plateforme</strong> — pilotez la relation tripartite.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-sm bg-secondary text-xs text-primary">◆</span>
              <span><strong className="font-semibold">Administrateurs</strong> — supervisez l'écosystème.</span>
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="card-base p-8">
          <h2 className="font-display text-2xl font-semibold">Connexion</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link to="/auth/register" className="font-semibold text-primary hover:underline">
              Créer un compte
            </Link>
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="label-base" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.com"
                className="input-base mt-2"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label-base" htmlFor="password">Mot de passe</label>
                <span className="text-[11px] text-muted-foreground">6 caractères min.</span>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-base mt-2"
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full">
            {submitting ? "Connexion…" : "Se connecter"}
          </button>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            En vous connectant, vous acceptez les CGU StarCast.
          </p>
        </form>
      </div>
    </div>
  );
}
