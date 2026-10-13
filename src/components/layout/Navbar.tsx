import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ArrowUpRight, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/types/auth";
export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState(false);
  const nav = useNavigate();
  const links = [["/marques", "Pour les marques"], ["/devenir-createur", "Pour les créateurs"], ["/tarifs", "Tarifs"], ["/blog", "Blog"]];
  const close = () => { setOpen(false); setAccount(false); };
  return <header className="sc-header"><div className="sc-shell sc-nav">
    <Link to="/" className="sc-logo" onClick={() => { close(); window.scrollTo(0,0); }} aria-label="StarCast accueil">StarCast<span>.</span></Link>
    <nav aria-label="Menu principal" className="sc-desktop-nav">{links.map(([url,label]) => <NavLink key={url} to={url}>{label}</NavLink>)}</nav>
    <div className="sc-nav-actions"><Link className="sc-demo-link" to="/demo">Réserver une démo <ArrowUpRight size={14}/></Link>
    {user ? <div className="sc-account"><button className="sc-account-button" onClick={() => setAccount(!account)} aria-expanded={account}>{user.username} <ChevronDown size={14}/></button>
      {account && <div className="sc-account-menu"><span>{ROLE_LABELS[user.role]}</span>{[["/mon-profil","Mon profil"],["/dashboard","Mes projets"],["/contracts","Mes contrats"],...(user.role === "admin" ? [["/admin","Administration"]] : [])].map(([url,label]) => <Link key={url} to={url} onClick={close}>{label}</Link>)}<button onClick={async () => { await logout(); close(); nav('/'); }}>Déconnexion</button></div>}
    </div> : <><Link to="/auth/login" className="sc-login-link">Connexion</Link><Link to="/auth/register" className="sc-button sc-button-small">S’inscrire <ArrowUpRight size={14}/></Link></>}
    <button className="sc-mobile-toggle" onClick={() => setOpen(!open)} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open}>{open ? <X/> : <Menu/>}</button></div>
    </div>{open && <nav className="sc-mobile-nav" aria-label="Menu mobile">{[...links,["/creators","Explorer les créateurs"],["/demo","Réserver une démo"],...(user ? [["/mon-profil","Mon profil"],["/dashboard","Mes projets"]] : [["/auth/login","Connexion"],["/auth/register","S’inscrire"]])].map(([url,label]) => <Link key={url} to={url} onClick={close}>{label}<ArrowUpRight size={16}/></Link>)}</nav>}</header>;
}
