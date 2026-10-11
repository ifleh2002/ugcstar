import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
export default function Activate() {
  const [password, setPassword] = useState("");
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
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Mot de passe enregistré."); nav("/dashboard"); }
  }}><h1 className="font-display text-3xl">Activer mon compte</h1>
  {!ready && <p>Ouvrez le lien d’invitation reçu par email pour activer votre session.</p>}
  <label className="block">Nouveau mot de passe<input type="password" autoComplete="new-password" minLength={10} required className="mt-2 w-full rounded border p-3" value={password} onChange={event => setPassword(event.target.value)} /></label>
  <button className="btn-primary" disabled={!ready || busy}>Enregistrer</button></form></div>;
}
