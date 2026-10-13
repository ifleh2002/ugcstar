import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
export default function Activate() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) setReady(Boolean(data.session)); });
    const { data } = supabase.auth.onAuthStateChange((_, session) => { if (active) setReady(Boolean(session)); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  return <div className="container py-16"><form className="mx-auto max-w-md space-y-5" onSubmit={async event => {
    event.preventDefault();
    if (!ready || password.length < 10 || busy) return;
    if (password !== confirmation) { toast.error("Les mots de passe ne correspondent pas."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Mot de passe enregistré."); nav("/dashboard"); }
  }}><h1 className="font-display text-3xl">Définir mon mot de passe</h1>
  {!ready && <p>Ouvrez le lien d’invitation ou de réinitialisation reçu par email pour continuer.</p>}
  <label className="block">Nouveau mot de passe<input type="password" autoComplete="new-password" minLength={10} required className="mt-2 w-full rounded border p-3" value={password} onChange={event => setPassword(event.target.value)} /></label>
  <label className="block">Confirmer le mot de passe<input type="password" autoComplete="new-password" minLength={10} required className="mt-2 w-full rounded border p-3" value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
  <Link className="text-xs text-primary" to="/auth/forgot-password">Demander un nouveau lien</Link>
  <button className="btn-primary" disabled={!ready || busy}>Enregistrer</button></form></div>;
}
