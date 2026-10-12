# CDC HABITAT — Suivi clientèle Bambilor

Cette version privée reprend les 423 lignes du fichier fourni. Elle contient 298 clients identifiés et 30 fiches provisoires sans identité. Le regroupement repose uniquement sur les NIN présents. Les noms et coordonnées divergents restent conservés dans les valeurs d’origine de chaque dossier.

## Utilisation

- **Dossiers clients** : rechercher un nom, un téléphone, un NIN ou un lot ; filtrer par programme et situation financière. Cliquer sur le nom pour ouvrir la fiche.
- **Fiche acquéreur** : passer d’une parcelle à l’autre pour un même client ; modifier ses coordonnées ; consulter sa situation, les versements, le suivi et les valeurs Excel d’origine.
- **Nouveau dossier** : saisir l’acquéreur et la parcelle. Si le NIN existe, le dossier est rattaché au client existant. Le nouveau dossier commence avec un cumul nul ; saisir ensuite les versements.
- **Enregistrer un versement** : saisir le montant, la date, le mode de règlement, la référence et la nature « Terrain » ou « Frais administratifs ». Les frais ne réduisent pas le solde du terrain.
- **Suivi** : conserver une note après un appel, une relance ou un rendez-vous.
- **À compléter** : retrouver les informations manquantes et les cas à vérifier.
- **Tableau de bord** : consulter les montants, taux d’encaissement et récapitulatifs par programme.
- **Exporter** : télécharger les résultats filtrés en CSV compatible Excel.
- **Imprimer** : imprimer la fiche ouverte ou l’enregistrer en PDF via le navigateur.
- **Import & contrôle** : vérifier le rapprochement avec les cinq feuilles et les modifications récentes.

## Recouvrement et actions par client

La rubrique **Recouvrement** regroupe les clients ayant un solde positif, les actions ouvertes, les actions du jour, les actions en retard et les engagements de paiement échus à vérifier. Le solde positif par client additionne les soldes positifs de ses parcelles sans compenser les avoirs d’autres lots.

Sur chaque fiche, l’onglet **Recouvrement** regroupe les actions du client pour toutes ses parcelles. L’agent clique sur **Enregistrer une action réalisée** et choisit le canal (appel, email, WhatsApp ou SMS), la date, le résultat et le résumé. Son identité est reprise automatiquement de son compte. Dans cette même saisie, il peut enregistrer un engagement de paiement, prévoir une nouvelle action à une date choisie, ou faire les deux. Chaque tentative reste dans l’historique.

Les actions prévues s’affichent dans le calendrier et peuvent être démarrées, reportées ou annulées avec un motif. Un engagement comporte la date de paiement annoncée, le montant s’il est connu et la parcelle concernée. Une promesse échue reste à vérifier : seul un versement réel enregistré dans la fiche réduit le solde. Les rapports permettent de filtrer les actions et de suivre leur volume par agent.

## Montants et provenance financière

### Historique des échanges

Le compte rendu d’une action réalisée conserve le canal, la réponse du client, le résumé et l’agent identifié. Une relance programmée et un engagement de paiement sont créés depuis cette action, dans la même opération. Une confirmation d’engagement existant évite de compter deux fois le montant promis. Les démarches sont effectuées par les agents ; l’application ne transmet pas automatiquement les relances WhatsApp ou SMS.

Les montants sont stockés en centimes de FCFA pour conserver les fractions figurant dans Excel. Les artefacts binaires des formules sont arrondis au centime. Les totaux de « 15HA 3HA » présentent un écart de 0,01 FCFA entre les sommes des lignes arrondies et le total Excel. Les valeurs brutes et les soldes d’origine restent conservés.

Les historiques de paiement n’étant pas disponibles, les cumuls Excel ne sont pas transformés en paiements individuels datés. L’absence d’échéanciers empêche de qualifier les soldes comme impayés. Les trois dossiers créditeurs importés restent visibles.

## Périmètre de cette version

L’accès est réservé aux comptes individuels actifs : responsable, superviseur et agent. Le responsable invite les collaborateurs par email et gère leurs rôles. Cette version ne comporte pas encore de nouvel import Excel via l’interface, d’échéanciers, de pièces jointes, de modification des prix contractuels ni d’annulation de versement. Les données financières d’origine restent préservées ; vérifier un versement avant validation. L’export CSV n’est pas une sauvegarde intégrale de la base.

## Architecture et vérifications

React/TypeScript, Vinext et base D1 persistante. Tables clients, ventes, paiements, notes, journal et paramètres. Migrations Drizzle. Import initial déterministe, reprenable et protégé contre la duplication. Requêtes préparées, transactions pour les saisies financières, références idempotentes pour les versements et contrôle de version pour les coordonnées.

`node tests/data.test.mjs` vérifie les 423 dossiers, les totaux, l’import répété, les soldes, la séparation des frais, les erreurs de saisie, la modification d’identité, les conflits de version, la création d’un dossier et les notes. `node node_modules/typescript/bin/tsc --noEmit` vérifie les types.
