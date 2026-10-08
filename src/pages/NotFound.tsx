import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="label-base">Erreur 404</span>
      <h1 className="mt-4 font-display text-6xl font-semibold tracking-tight md:text-8xl">
        Page introuvable
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        La ressource recherchée n'existe pas ou a été déplacée.
      </p>
      <Link to="/" className="btn-primary mt-8">Retour à l'accueil</Link>
    </div>
  );
}
