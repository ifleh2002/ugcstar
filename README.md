# StarCast — Supabase + Vercel

React, TypeScript et Vite. Les comptes utilisent **Supabase Auth** et les données **Supabase PostgreSQL**. Aucun serveur SQLite ni fichier de base de données n’est nécessaire sur Vercel.

Projet Supabase connecté : `https://coghwghshcjaaqrtyvlh.supabase.co`.

## 1. Initialiser la base (une fois)

La clé publishable fournie est une clé publique d’application, pas un accès administrateur à PostgreSQL. Elle ne peut pas exécuter une migration SQL.

1. Ouvrir le projet dans le [dashboard Supabase](https://supabase.com/dashboard/project/coghwghshcjaaqrtyvlh).
2. Ouvrir **SQL Editor → New query**.
3. Copier le contenu **complet** de [`supabase/setup.sql`](supabase/setup.sql), puis cliquer **Run**.

Ce script crée les tables, les règles RLS, les fonctions de création/validation des commandes et les profils fictifs de démonstration. Il peut être réexécuté sans remplacer les profils déjà modifiés.

Le fichier `supabase/migrations/202610080001_starcast.sql` contient le schéma seul ; `supabase/seed.sql` contient les profils fictifs. `supabase/setup.sql` rassemble les deux pour une installation simple.

Si l’interface affiche « La base StarCast n’est pas initialisée », cette étape n’a pas encore été exécutée.

## 2. Déployer via GitHub sur Vercel

1. Dans Vercel, importer **ifleh2002/ugcstar**.
2. Framework : **Vite** ; commande build : `npm run build` ; dossier de sortie : `dist`.
3. Déployer. Le fichier `vercel.json` permet d’ouvrir directement les pages `/stars`, `/connexion`, `/orders/...`, etc.

L’URL Supabase et la clé publishable fournie sont déjà configurées dans `src/lib/supabase.ts`. Elles sont publiques par conception : seules les autorisations RLS et les fonctions PostgreSQL donnent accès aux données. Vous pouvez les remplacer dans les variables d’environnement Vercel :

```
VITE_SUPABASE_URL=https://coghwghshcjaaqrtyvlh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<votre clé publishable>
```

Ne jamais mettre une clé `service_role` ou `sb_secret_...` dans une variable `VITE_*`, un fichier frontend ou le dépôt.

## 3. Configurer les confirmations email

Dans Supabase **Authentication → URL Configuration** :

- **Site URL** : l’adresse de votre site Vercel.
- **Redirect URLs** : ajouter `https://VOTRE-SITE.vercel.app/connexion` et, pour le développement, `http://localhost:8080/connexion`.

Dans **Authentication → Providers**, activer Email. Lorsque la confirmation email est activée, l’inscription affiche un message invitant le client à confirmer son adresse avant sa connexion. Le lien de confirmation revient sur `/connexion`.

Configurer un service SMTP pour les envois de production. Les limites et réglages du service email Supabase restent ceux de votre projet.

## 4. Créer l’administrateur

1. S’inscrire normalement sur le site et confirmer son email.
2. Exécuter cette requête dans le **SQL Editor Supabase**, en remplaçant l’adresse :

```sql
update public.starcast_profiles p
set role = 'admin'
from auth.users u
where p.id = u.id and lower(u.email) = lower('votre-email@example.com');
```

3. Se déconnecter puis se reconnecter, et ouvrir `/admin`.

Le rôle administrateur ne peut pas être choisi à l’inscription, modifié depuis le navigateur ou obtenu via les métadonnées d’un compte. Aucun mot de passe administrateur n’est stocké dans le dépôt.

## Parcours

- `/stars` : photos carrées, audience par réseau, notes, recherche, catégories, tri et favoris locaux.
- `/stars/:id` : détail, tarifs IA/réel, portfolio et avis de commandes livrées.
- `/inscription` : compte client ou star ; `/connexion` : connexion Supabase.
- `/mon-profil` : photo, biographie, réseaux sociaux, consentement IA et soumission à validation.
- `/dashboard` : uniquement les projets du client ou attribués à la star connectée.
- `/orders/:id` : brief, rendu, conversation persistante, révisions, validation et avis.
- `/admin` : projets, suivi manuel des paiements, commissions, export CSV, prix, validation des profils et livraison.

Les sessions sont maintenant gérées par le SDK Supabase dans le navigateur, avec renouvellement automatique. L’ancien mécanisme de cookies du serveur SQLite a été remplacé.

## Protection des données

Tables dédiées : `starcast_profiles`, `starcast_stars`, `starcast_orders`, `starcast_messages`, `starcast_reviews`. Les comptes et mots de passe sont gérés par Supabase Auth.

RLS est activé sur toutes les tables. Les visiteurs voient uniquement les stars publiées et les avis. Le client et la star n’accèdent qu’à leurs projets et messages. L’administration voit tous les projets.

Les écritures directes sur les tables sont interdites à la clé publique et aux utilisateurs. Les changements passent par des fonctions PostgreSQL qui vérifient l’identité, les rôles et les étapes autorisées. Le prix est calculé depuis les tarifs de la base et la commission est figée à la commande. Les mises à jour du workflow verrouillent la ligne pour éviter les validations et révisions concurrentes.

## Production des vidéos

**IA** : produite par la plateforme avec l’image et la voix autorisées de la star. **Réelle** : tournée avec la star, à un tarif strictement supérieur. Les prix sont en euros comme dans le projet initial. Deux révisions sont incluses. Suppléments conservés : durée supérieure à 60 secondes (200 €), voix off (80 €).

Brief → paiement confirmé manuellement → production → lien vidéo HTTPS déposé → validation client → livraison admin. Les avis sont possibles uniquement après livraison, un par commande.

La génération IA automatique, le prestataire de paiement et les virements ne sont pas encore connectés. Les modules Contrats et Screenads initiaux restent des démonstrations. Les liens vidéo nécessitent un stockage vidéo externe ; aucun bucket public n’est créé automatiquement.

## Développement et tests

Node.js 24 ou supérieur :

```bash
npm ci
npm run dev
```

Ouvrir `http://localhost:8080`. Aucun second serveur n’est nécessaire. L’authentification et les données utilisent le projet Supabase connecté.

```bash
npm run check
npm run build
npm run test:db
```

Les tests utilisent un PostgreSQL local embarqué (PGlite) avec un schéma Auth simulé, pas les comptes de votre projet réel. Ils vérifient la migration, sa réexécution, les règles RLS, l’interdiction de devenir admin depuis le navigateur, les tarifs, les commissions, les accès aux projets, les messages, les révisions, la validation, la livraison et les avis.

Les données et comptes SQLite existants ne sont pas importés automatiquement : il faut un export de la base et une procédure dédiée. Les anciens mots de passe ne sont pas compatibles avec Supabase Auth ; les comptes doivent être recréés ou invités.
