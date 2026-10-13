# Email OTP — réglages du projet hébergé

Le frontend utilise signInWithOtp, puis verifyOtp({email, token, type: 'email'}).
L’appel signInWithOtp envoie un lien par défaut si le modèle Magic Link affiche ConfirmationURL.

Dans Supabase, projet coghwghshcjaaqrtyvlh :

1. Authentication → Email → Templates (ou Email Templates) → Magic Link.
2. Sujet : Votre code de vérification StarCast.
3. Remplacer le contenu par supabase/templates/magic-link.html et enregistrer. Il contient {{ .Token }} et aucune ConfirmationURL.
4. Authentication → URL Configuration : Site URL = https://ugcstar.vercel.app.
5. Ajouter https://ugcstar.vercel.app/auth/activate aux Redirect URLs et enregistrer.
6. Vérifier la longueur du code OTP : 6 chiffres, conforme au frontend (VITE_AUTH_OTP_LENGTH=6).
7. Demander un nouveau code : les emails déjà envoyés ne changent pas.

Ces réglages du service Auth hébergé ne sont pas appliqués par un push GitHub, une migration SQL ni un déploiement Edge Function. Ils doivent être enregistrés dans le tableau de bord ou via l’API Management avec les droits appropriés.
