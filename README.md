# CDC HABITAT — espace recouvrement

Adresse prévue : **https://recouvrement.cdc-habitat.sn**. Application autonome pour les dossiers clients, les versements, les actions, les engagements, le calendrier et les rapports. Le site affiche sa propre page de connexion, avec email et mot de passe. Aucun compte externe n'est nécessaire pour les agents.

## Parcours des comptes

- Deux administrateurs sont prévus : `mndiaye@cdc-habitat.sn` et `bgueye@cdc-habitat.sn`. Chacun reçoit son propre lien d'activation et choisit son mot de passe. L'interface conserve au moins deux administrateurs actifs.
- Depuis **Équipe**, un administrateur saisit le nom, l'email et le rôle d'un agent, puis clique sur **Envoyer l'invitation**.
- Un email personnel contient un lien valable 48 heures, à usage unique. L'agent choisit lui-même un mot de passe de 12 caractères au minimum. Le responsable ne voit jamais ce mot de passe.
- Depuis la connexion, un collaborateur peut demander un lien de récupération par email. Ce lien à usage unique est valable 30 minutes. Les demandes sont limitées à trois par compte et par heure, sans révéler si une adresse est enregistrée.
- Le responsable peut changer un rôle, désactiver/réactiver un compte ou envoyer un nouveau lien pour réinitialiser l'accès. Un compte désactivé perd aussitôt sa session.
- **Administrateur** : équipe, dossiers, versements et recouvrement. **Superviseur** : dossiers et suivi, sans saisie de versement. **Agent** : consultation et actions de recouvrement, sans saisie financière ni administration.

Les mots de passe sont stockés avec un sel aléatoire et PBKDF2-HMAC-SHA256 (600 000 itérations). Les sessions sont des jetons aléatoires dont seule l'empreinte est conservée dans PostgreSQL, transmis par cookie HttpOnly, Secure et SameSite. Les liens d'invitation ne sont jamais stockés en clair. Les tentatives de connexion par compte sont limitées. Les mutations vérifient l'origine et les droits côté serveur. Les actions réalisées sont attribuées à l'agent connecté.

## Déploiement Vercel et Neon

1. Créer un projet PostgreSQL sur [Neon](https://neon.com/) et récupérer une chaîne de connexion (`DATABASE_URL`). Garder cette valeur secrète.
2. Importer le dépôt GitHub dans [Vercel](https://vercel.com/). Le projet utilise Next.js natif ; Vercel détecte automatiquement le framework. Configurer Node.js 22 ou plus récent.
3. Dans les variables d'environnement Vercel de l'environnement **Production**, renseigner `DATABASE_URL`, `APP_ORIGIN=https://recouvrement.cdc-habitat.sn`, `INVITE_FROM` (adresse d'expédition vérifiée chez Resend) et `RESEND_API_KEY` (clé secrète Resend). Ne jamais enregistrer la clé dans le code ou le dépôt.
4. Dans un environnement disposant de `DATABASE_URL`, lancer `pnpm install --frozen-lockfile`, puis `pnpm db:migrate` pour créer les tables PostgreSQL. Les migrations PostgreSQL de production se trouvent dans `drizzle/neon/`. Les fichiers SQL à la racine de `drizzle/` sont l'historique SQLite conservé pour les tests locaux.
5. Pour appliquer les migrations depuis GitHub Actions, ajouter également `DATABASE_URL` dans **Settings → Secrets and variables → Actions → New repository secret**. Ne jamais mettre sa valeur dans le dépôt ou dans un message. Après la fusion du workflow dans la branche par défaut, aller dans **Actions → Migrate Neon database**, choisir `main` et lancer **Run workflow**. Attendre la réussite de la migration, puis déclencher ou vérifier le redéploiement de production sur Vercel.
6. Ajouter `recouvrement.cdc-habitat.sn` aux domaines du projet Vercel et faire configurer par l'administrateur du domaine les enregistrements DNS indiqués par Vercel. Cloudflare n'est plus requis pour l'hébergement ; le fournisseur DNS peut rester indépendant.
7. Déployer depuis l'intégration Git Vercel (ou avec `vercel --prod`). Vercel lance `pnpm build` et déploie l'application. Vérifier HTTPS et la réponse du domaine personnalisé.
8. Depuis un environnement autorisé avec `DATABASE_URL`, `APP_ORIGIN`, `RESEND_API_KEY` et `INVITE_FROM` renseignés, lancer `node scripts/bootstrap-admin.mjs`. Le script crée les deux comptes administrateurs s'ils n'existent pas et envoie leurs liens individuels sans afficher les liens ni les mots de passe.
9. Tester l'invitation d'un agent, le choix de son mot de passe, la connexion, les droits de chaque rôle, la désactivation et l'impossibilité de consulter `/api/data` sans session. Vérifier que l'email arrive avec un expéditeur CDC HABITAT vérifié.

Aucune invitation réelle n'a été envoyée pendant la préparation de ce paquet. L'envoi dépend du domaine expéditeur vérifié, de la clé d'envoi et du déploiement.

## Reprise des données

`db/import-source.json` contient l'import Excel initial de 423 dossiers avec données personnelles ; ne jamais publier ce fichier dans un dépôt public. Ce fichier ne reprend pas les changements et actions réalisés ensuite sur l'ancien site. Avant la bascule, sauvegarder l'ancienne base, transférer les tables métier vers Neon en conservant leurs identifiants et relations, comparer les nombres de lignes et les totaux financiers, puis figer temporairement les saisies. Si les données ont déjà été transférées, marquer l'import initial comme effectué dans `settings` avant la première consultation de `/api/data`, afin d'éviter l'ajout de dossiers obsolètes du fichier Excel. L'ancien site doit rester privé jusqu'à validation du transfert. Les comptes et sessions de l'ancien hébergement ne doivent pas remplacer les nouveaux comptes applicatifs.

## Vérifications locales

Node.js 22.13+, pnpm 11. `node tests/auth.test.mjs` contrôle les mots de passe, sessions et liens d'invitation. `node tests/data.test.mjs` contrôle les dossiers, montants, mutations, actions de recouvrement et engagements. `node tests/neon.test.mjs` contrôle l'adaptateur SQL PostgreSQL et ses transactions. `pnpm lint` et `pnpm build` vérifient le code. Les routes de données et d'authentification nécessitent une base PostgreSQL Neon configurée. Appliquer les nouvelles migrations Neon (`pnpm db:migrate`) avant de déployer les changements du schéma.
