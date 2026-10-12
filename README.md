# CDC HABITAT — espace recouvrement

Adresse prévue : **https://recouvrement.cdc-habitat.sn**. Application autonome pour les dossiers clients, les versements, les actions, les engagements, le calendrier et les rapports. Le site affiche sa propre page de connexion, avec email et mot de passe. Aucun compte externe n'est nécessaire pour les agents.

## Parcours des comptes

- Deux administrateurs sont prévus : `mndiaye@cdc-habitat.sn` et `bgueye@cdc-habitat.sn`. Chacun reçoit son propre lien d'activation et choisit son mot de passe. L'interface conserve au moins deux administrateurs actifs.
- Depuis **Équipe**, il saisit le nom, l'email et le rôle d'un agent, puis clique sur **Envoyer l'invitation**.
- Un email personnel contient un lien valable 48 heures, à usage unique. L'agent choisit lui-même un mot de passe de 12 caractères au minimum. Le responsable ne voit jamais ce mot de passe.
- Le responsable peut changer un rôle, désactiver/réactiver un compte ou envoyer un nouveau lien pour réinitialiser l'accès. Un compte désactivé perd aussitôt sa session.
- **Administrateur** : équipe, dossiers, versements et recouvrement. **Superviseur** : dossiers et suivi, sans saisie de versement. **Agent** : consultation et actions de recouvrement, sans saisie financière ni administration.

Les mots de passe sont stockés avec un sel aléatoire et PBKDF2-HMAC-SHA256 (600 000 itérations). Les sessions sont des jetons aléatoires dont seule l'empreinte est conservée dans D1, transmis par cookie HttpOnly, Secure et SameSite. Les liens d'invitation ne sont jamais stockés en clair. Les tentatives de connexion par compte sont limitées. Les mutations vérifient l'origine et les droits côté serveur. Les actions réalisées sont attribuées à l'agent connecté.

## Configuration technique avant publication

1. L'administrateur du domaine doit rattacher la zone `cdc-habitat.sn` au compte Cloudflare de l'entreprise. Le domaine personnalisé `recouvrement.cdc-habitat.sn` figure dans `wrangler.jsonc` ; il n'est pas encore publié.
2. Créer D1 : `npx wrangler d1 create cdc-habitat-recouvrement`. Renseigner l'identifiant dans `wrangler.jsonc`.
3. Exécuter, dans l'ordre, les migrations `drizzle/0000_*.sql` à `drizzle/0009_*.sql` avec `npx wrangler d1 execute cdc-habitat-recouvrement --remote --file <fichier>`. La migration 0007 crée le premier compte, 0008 ajoute les mots de passe, sessions et invitations, et 0009 garantit le second administrateur. Faire d'abord l'opération sur une base de test.
4. Configurer un service d'envoi d'emails transactionnels. L'intégration fournie utilise l'API Resend : vérifier un domaine expéditeur de CDC HABITAT auprès de ce service, renseigner `INVITE_FROM` dans `wrangler.jsonc`, puis enregistrer la clé **uniquement comme secret du Worker** : `npx wrangler secret put RESEND_API_KEY`. Ne jamais l'ajouter au code ni au dépôt.
5. Installer les dépendances (`pnpm install --frozen-lockfile`), compiler (`pnpm build`) et déployer avec le compte Cloudflare de CDC HABITAT (`pnpm deploy`). Vérifier le certificat HTTPS et la réponse du domaine personnalisé.
6. Depuis une machine d'administration autorisée, renseigner temporairement `RESEND_API_KEY` et `INVITE_FROM` dans l'environnement local, puis lancer `node scripts/bootstrap-admin.mjs`. Ce script envoie un lien individuel aux **deux** administrateurs, sans afficher les liens ni les mots de passe. Retirer la clé de cet environnement après usage.
7. Tester l'invitation d'un agent, le choix de son mot de passe, la connexion, les droits de chaque rôle, la désactivation et l'impossibilité de consulter `/api/data` sans session. Vérifier que l'email arrive avec un expéditeur CDC HABITAT vérifié.

Aucune invitation réelle n'a été envoyée pendant la préparation de ce paquet. L'envoi dépend du domaine expéditeur vérifié, de la clé d'envoi et du déploiement.

## Reprise de la base existante

`db/import-source.json` contient l'import Excel initial de 423 dossiers avec données personnelles ; ne jamais publier ce fichier dans un dépôt public. Ce fichier ne reprend pas les changements et actions réalisés ensuite sur le site existant. Avant le lancement, sauvegarder et transférer les tables métier de la base actuelle, conserver leurs identifiants, comparer les comptes de lignes et les totaux financiers, puis figer temporairement les saisies pendant la bascule. L'ancien site doit rester privé jusqu'à validation du transfert. Les nouvelles tables de comptes ne doivent pas être remplacées par les comptes de l'ancien hébergement.

## Vérifications locales

Node.js 22.13+, pnpm 11. `node tests/auth.test.mjs` contrôle les mots de passe, sessions et liens d'invitation. `pnpm build` vérifie la compilation. Sans migrations ni clé d'envoi, les invitations échouent de manière explicite et aucune donnée client n'est accessible sans session.
