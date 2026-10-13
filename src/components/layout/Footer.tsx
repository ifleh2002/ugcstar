import { Link } from "react-router-dom";
export default function Footer() {
  const groups = [
    { title: "La plateforme", links: [["/marques","Pour les marques"],["/devenir-createur","Pour les créateurs"],["/tarifs","Tarifs"],["/creators","Nos talents"]] },
    { title: "Ressources", links: [["/blog","Le blog"],["/#faq","Centre d’aide"],["/demo","Réserver une démo"],["/dashboard","Mes projets"]] },
    { title: "Informations", links: [["/informations/confidentialite","Confidentialité"],["/informations/conditions","Conditions d’utilisation"],["/informations/cookies","Gestion des cookies"],["/informations/contact","Nous contacter"]] },
  ];
  return <footer className="sc-footer"><div className="sc-shell"><div className="sc-footer-grid"><div><Link className="sc-footer-logo" to="/" onClick={() => window.scrollTo(0,0)}>StarCast.</Link><p>Des talents. Des idées.<br/>Du contenu qui vous ressemble.</p><Link className="sc-text-link" to="/demo">Parlons de votre projet ↗</Link></div>{groups.map(group => <div key={group.title}><h3>{group.title}</h3>{group.links.map(([url,label]) => <Link key={url} to={url}>{label}</Link>)}</div>)}</div><div className="sc-footer-bottom"><span>© {new Date().getFullYear()} StarCast. Tous droits réservés.</span><span>Création UGC · Vidéos IA et tournages réels</span><span>FR / EUR</span></div><div className="sc-footer-word" aria-hidden>StarCast.</div></div></footer>;
}
