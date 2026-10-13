import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
export default function ForgotPassword() {
 const [email,setEmail]=useState("");
 const [busy,setBusy]=useState(false);
 const [sent,setSent]=useState(false);
 const [error,setError]=useState("");
 return <div className="container py-16"><form className="card-base mx-auto max-w-md space-y-5 p-8" onSubmit={async event=>{
  event.preventDefault(); if(busy)return;
  setBusy(true);setError("");
  try {
   const {error}=await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:"https://ugcstar.vercel.app/auth/activate"});
   if(error)throw error;
   setSent(true);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }}>
 <Link className="text-xs text-primary" to="/auth/login">← Retour à la connexion</Link>
 <h1 className="text-3xl font-bold">Mot de passe oublié</h1>
 {sent ? <div role="status"><p className="text-sm leading-relaxed">Si un compte correspond à cette adresse, un email de réinitialisation vous a été envoyé. Vérifiez aussi les spams.</p><p className="mt-3 text-xs text-muted-foreground">Ouvrez le lien dans le même navigateur pour définir votre nouveau mot de passe.</p></div>:<>
 <p className="text-sm text-muted-foreground">Indiquez l’email de votre compte StarCast pour recevoir un lien de réinitialisation.</p>
 <label className="block text-xs font-semibold">Adresse email<input required type="email" autoComplete="email" className="input-base mt-2" value={email} onChange={e=>setEmail(e.target.value)}/></label>
 {error&&<p role="alert" className="text-sm text-red-600">{error}</p>}
 <button type="submit" className="sc-button w-full" disabled={busy}>{busy?"Envoi en cours…":"Recevoir le lien"}</button>
 </>}
 </form></div>;
}
