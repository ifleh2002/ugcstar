# StarCast — vidéos IA & tournages réels

Version enrichie du projet joint. React, TypeScript, Vite, Tailwind ; serveur Node.js 24 avec SQLite intégré.

## Démarrage (Windows, macOS ou Linux)

1. Installer Node.js **24 ou supérieur**.
2. Décompresser cette archive, ouvrir un terminal dans son dossier et exécuter `npm ci`.
3. Copier `.env.example` vers `.env`. Renseigner `ADMIN_EMAIL` et un `ADMIN_PASSWORD` personnel d’au moins 12 caractères. Ne jamais exposer ce fichier.
4. Exécuter `npm run server`.
5. Dans un second terminal, exécuter `npm run dev` et ouvrir **http://localhost:8080**.

Pour utiliser le build : `npm run build`, puis `npm start`, et ouvrir **http://127.0.0.1:3001**. Le serveur sert l’interface et l’API. Ne pas utiliser un hébergement statique seul : l’authentification exige le serveur.

Le premier démarrage avec les variables administrateur crée le compte administrateur. Modifier la variable ensuite ne change pas un compte existant. Il n’y a pas de mot de passe admin universel ou affiché dans le navigateur.

## Parcours disponibles

- `/stars` : fiches avec photos carrées, audiences par réseau, étoiles, prix IA/réel, recherche, catégories, tri et favoris locaux.
- `/stars/:id` : biographie, langues, portfolio, audiences, tarifs, délais et avis de commandes livrées.
- `/inscription` : inscription client ou star ; les stars doivent fournir leur profil social et leur autorisation.
- `/connexion` : connexion ; session HttpOnly côté serveur.
- `/mon-profil` : la star renseigne photo, biographie et audiences, puis soumet à nouveau son profil à validation. Elle peut retirer son autorisation IA pour les prochaines commandes.
- `/dashboard` : uniquement les projets du client ou ceux attribués à la star connectée.
- `/orders/:id` : brief, rendu vidéo, conversation persistante, révisions, validation et avis après livraison.
- `/admin` : projets, confirmation des paiements, commissions, export CSV, tarifs par star et type de vidéo, validation des profils, dépôt du lien vidéo et livraison.

## Modèle de production et prix

**Vidéo IA** : StarCast crée et monte la vidéo ; la star autorise l’utilisation de son image et de sa voix. **Vidéo réelle** : tournage avec la star, organisé par StarCast, à un tarif strictement supérieur. Le choix est explicite avant la commande.

Les prix initiaux restent en euros, comme dans le projet fourni. Les tarifs et audiences des profils initiaux sont fictifs. L’administration fixe un tarif IA, un tarif réel et un pourcentage de commission par star. Les suppléments durée supérieure à 60 secondes (200 €) et voix off (80 €) sont conservés. Le serveur calcule le montant et fige la commission à la commande ; les futures modifications de tarifs ne changent pas les commandes existantes.

Le net affiché est le montant après commission, pas une rémunération automatiquement virée à la star. Les frais de production, taxes et reversements restent à définir selon le modèle commercial.

## Validation et livraison

Brief reçu → paiement confirmé → production → rendu déposé en HTTPS → validation client → livraison admin. Le client peut demander deux cycles de révisions ; l’administration ne peut pas livrer avant sa validation. La star peut consulter ses projets et participer à la conversation ; seul le client valide son rendu.

Les évaluations réelles sont réservées au client après livraison, une par commande. Elles remplacent les notes de démonstration dans la fiche dès qu’il existe un avis réel.

## Ce qui reste à connecter

- **Génération IA** : aucun service vidéo IA ni aucune clé n’était fourni. Le workflow de production existe, mais aucune vidéo n’est générée automatiquement. L’équipe dépose un lien vidéo HTTPS. Ajouter un adaptateur serveur pour le fournisseur retenu, sa file de travaux et ses retours de traitement.
- **Paiements** : suivi et confirmation manuelle, sans encaissement, remboursement bancaire ou virement automatique. Un prestataire et des webhooks vérifiés sont nécessaires.
- **Contrats et Screenads** : modules initiaux conservés et signalés comme démonstration. Ils ne sont pas synchronisés avec les nouveaux projets. Aucune signature électronique réelle n’est intégrée.
- **Mise en production** : proxy HTTPS avec `COOKIE_SECURE=true`, sauvegardes SQLite, stockage sécurisé des vidéos, contrôle des droits image/voix et accords contractuels, vérification email et récupération de mot de passe à ajouter.

Les photos initiales utilisent des liens externes ; elles nécessitent Internet. Les favoris restent dans le navigateur. Le lien de livraison ouvre la vidéo ; son téléchargement dépend des droits du stockage vidéo.

## Vérification

`npm run check` : TypeScript.

`npm run build` : compilation.

`npm run test:api` : tests avec une base temporaire : inscription, absence de promotion admin, authentification, cloisonnement des projets, prix IA/réel calculés côté serveur, commissions figées, paiement requis, validation, révisions, livraison, messages, avis et autorisation IA.

La base réelle est dans `data/starcast.sqlite`, exclue de l’archive et du dépôt. Les secrets et les sessions ne sont jamais stockés dans le code frontend. Un nouvel administrateur se crée uniquement par configuration serveur.
