# Version corrigée du ZIP

- Gravity Gallery sous le menu, photos conservées dont public/star-1.png.
- Build Vite/SWC, utilitaire cn() avec clsx/tailwind-merge, dépendances Matter et configuration Vercel.
- Inscription publique limitée à marque/créateur, mot de passe de 10 caractères minimum.
- Code email de 6 chiffres par défaut ; VITE_AUTH_OTP_LENGTH peut être adapté à la configuration réelle du serveur (6 à 10).
- Privilèges lus dans app_metadata ; fonctions serveur vérifiant les rôles non modifiables par l'utilisateur.
- Migration fournie pour user_profiles et role_change_logs, avec politiques RLS et synchronisation des comptes.
- Les clients peuvent interagir ; Screenads et statistiques réservés à l'équipe.
- Invitation avec page d'activation et création de mot de passe.
- Export de véritables PDF ; suppression des promesses de certification de signature et d'horodatage tiers.
- Signatures locales séparées par compte.

## Installation

1. npm ci
2. npm run check
3. npm run build
4. Exécuter supabase/migrations/202610110001_accounts.sql sur le backend configuré.
5. Attribuer le premier rôle admin depuis SQL ou une API d'administration de confiance, jamais depuis l'inscription.
6. Déployer les fonctions invite-user et update-user-role ; définir SITE_URL sur le domaine du site et autoriser /auth/activate dans les URLs de redirection.
7. Vérifier le modèle email OTP (le code doit être inclus) et sa longueur côté fournisseur.
8. Configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans Vercel. La configuration Onspace du fichier envoyé est conservée.

## Limites conservées et affichées

Le ZIP est une démonstration pour le catalogue, commandes, messages, contrats et revenus. Ces données ne sont pas reliées aux tables de production. Les actions de commande et validation sont explicitement annoncées comme simulations. Les comptes utilisent le backend configuré. Les signatures sont locales à l'appareil, sans archivage centralisé. L'intégration de paiements, la génération effective de vidéo IA et les tarifs IA/réel du dépôt GitHub ne sont pas importés automatiquement.

Le dépôt GitHub existant n'est pas remplacé par cette archive.
