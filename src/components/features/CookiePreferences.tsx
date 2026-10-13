import { useState } from "react";
export default function CookiePreferences() {
  const [show,setShow] = useState(() => { try { return !localStorage.getItem('starcast:cookie-preference'); } catch { return true; } });
  const [custom,setCustom] = useState(false);
  const save = (choice:string) => { try { localStorage.setItem('starcast:cookie-preference',choice); } catch {} setShow(false); };
  if (!show) return null;
  return <aside className="sc-cookie" aria-label="Préférences de confidentialité"><strong>Votre confidentialité compte.</strong><p>{custom ? 'Seuls les éléments nécessaires à la connexion et aux préférences sont utilisés. Aucun suivi publicitaire n’est activé.' : 'StarCast utilise le stockage nécessaire à votre session et à vos préférences.'}</p><div><button onClick={() => save('essential')}>Essentiels uniquement</button><button onClick={() => save('essential')} className="sc-cookie-accept">Accepter</button></div><button className="sc-cookie-custom" onClick={() => setCustom(!custom)}>{custom ? 'Retour' : 'Personnaliser'}</button></aside>;
}
