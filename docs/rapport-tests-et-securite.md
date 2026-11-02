# FitBook – Rapport de tests, de sécurité et de qualité

Projet UAA MI08 · Rapport établi le 2 novembre 2026 · Environnement : Windows, PHP 8.3, Symfony 7.4, MySQL 8.4, Angular 21.

## 1. Synthèse

| Type de test | Outil | Nombre | Résultat |
|---|---|---|---|
| Tests unitaires back-end | PHPUnit 12 | 16 tests, 21 assertions | 16 réussis, 0 échec |
| Tests unitaires front-end | Vitest (Angular) | 3 tests | 3 réussis, 0 échec |
| Tests d'API et d'intégration (HTTP + base MySQL réelle) | Postman / Newman | 83 requêtes, 119 assertions | 119 réussies, 0 échec |
| Contrôle des permissions par rôle | Newman | groupes 03, 06 et 08 | conformes |
| Courbes de stress | script Node (`stress.mjs`) | 5 paliers × 2 routes | 0 erreur sur 493 requêtes, voir §5 |
| Catalogue d'attaques | OWASP Top 10 + attaques courantes | 15 attaques répertoriées + 2 limites notées | 10 testées automatiquement, 4 mitigées par conception, 1 non couverte (HTTPS), voir §4 |

Preuves : `tests/rapport/rapport-newman.html` (rapport complet), captures de la console Newman et PHPUnit.

## 2. Liste des tests

### 2.1 Tests unitaires (back-end – `backend/tests/Unit`)

| Id | Cible | Vérification | Résultat |
|---|---|---|---|
| U-01 à U-09 | `ProcedureCodes::status` | chaque code de procédure (OK, COMPLETE, DEJA_RESERVEE, SEANCE_FERMEE, SEANCE_INTROUVABLE, TROP_TARD, NOTE_INVALIDE, SEANCE_NON_SUIVIE, ERREUR_SQL) donne le bon statut HTTP | réussi |
| U-10 | `ProcedureCodes` | un code inconnu ou nul donne 500 | réussi |
| U-11 | `ProcedureCodes` | seul `OK` est un succès | réussi |
| U-12 | `ProcedureCodes::message` | message lisible pour une séance complète | réussi |
| U-13 | `Utilisateur` | rôle sportif par défaut, e-mail non confirmé, pas de rôle admin | réussi |
| U-14 | `Utilisateur` | le rôle `admin` donne `ROLE_ADMIN` | réussi |
| U-15 | `Utilisateur` | l'identifiant de connexion est l'e-mail | réussi |
| U-16 | `Utilisateur` | le hash du mot de passe n'est jamais sérialisé en clair (session) | réussi |

### 2.2 Tests unitaires (front-end – `frontend/src/app/app.spec.ts`)

| Id | Vérification | Résultat |
|---|---|---|
| F-01 | l'application affiche « FitBook », « Connexion », « S'inscrire » et pas « Déconnexion » sans utilisateur connecté | réussi |
| F-02 | `AuthService` : sportif seulement avec le rôle `sportif` | réussi |
| F-03 | `messageErreur` : message de l'API prioritaire, message dédié si l'API est injoignable | réussi |

### 2.3 Tests d'intégration et d'API (Newman – 83 requêtes)

| Groupe | Scénarios | Résultat |
|---|---|---|
| 00 Santé | API et base MySQL disponibles | réussi |
| 01 Recherche publique | liste des salles validées, filtre ville, filtre discipline, fiche salle (séances, places restantes, avis), salle en attente masquée, salle inexistante (404) | réussi |
| 02 Attaques | injection SQL (2), XSS à l'inscription, mot de passe faible, e-mail invalide, accès sans connexion (2), mauvais mot de passe, corps vide | réussi |
| 03 Inscription | inscription valide, e-mail déjà utilisé (409), connexion refusée avant confirmation, confirmation par lien signé, lien falsifié refusé, connexion, profil, modification du profil, accès admin refusé à un sportif, déconnexion | réussi |
| 04 Réservations | réserver, double réservation refusée, séance complète refusée (capacité), séance inexistante, paramètre invalide, liste, annulation, double annulation | réussi |
| 05 Avis, favoris, contact | avis refusé (séance non suivie, salle ET coach, note hors limites), favoris (ajout, liste, retrait), contact valide, contact refusé par le JSON schema MySQL | réussi |
| 06 Droits par rôle | admin : liste des utilisateurs sans mot de passe, admin ne peut pas réserver, validation invalide refusée ; gestionnaire : ses salles, accès admin refusé | réussi |
| 07 Sauvegardes | journal et message visible | réussi |
| 08 Calendrier et espace coach | calendrier public (période, dates inversées ou invalides refusées) ; espace coach : 401 sans connexion, 403 pour sportif et gestionnaire ; options du formulaire ; séance invalide refusée (champs titre, dates, prix, places) ; discipline d'un autre coach refusée ; création, chevauchement de créneau refusé (409), modification, suppression ; un coach ne peut ni modifier ni supprimer la séance d'un autre (404) ; disponibilités (ajout, liste, refus, retrait) | réussi |

Le jeu de tests est rejouable : deux passages successifs ont donné le même résultat (83/83 requêtes, 119/119 assertions).

## 3. Exigences de la partie 4 – couverture

| Exigence | Réalisation | Preuve |
|---|---|---|
| Tests unitaires | PHPUnit (16) et Vitest (3) | captures |
| Tests d'intégration | Newman sur API + MySQL réels | rapport HTML |
| Tests API Postman / Newman | 83 requêtes | `tests/postman/` |
| Validation des formulaires côté back-end | Symfony Validator (nom, e-mail, mot de passe), JSON schema MySQL pour le contact | tests 02, 03, 05 |
| Contrôle des permissions par rôle | `access_control` + `#[IsGranted]` (sportif, gestionnaire, admin) | groupe 06 |
| Protection des données d'authentification | mots de passe hachés (bcrypt/auto), jamais renvoyés par l'API, hash absent de la session | U-16, test « Aucun mot de passe exposé » |
| Contrôle de capacité des réservations | procédure stockée `sp_reserver_seance` (transaction + verrou de ligne) | groupe 04, code COMPLETE |
| Sauvegardes de la base | `mysqldump` : début, milieu, fin ; journal en base ; message visible dans l'application | `database/backups/` |

## 4. Catalogue des attaques (inspiré de l'OWASP Top 10)

| N° | Attaque | Protection mise en place | Vérification | Statut |
|---|---|---|---|---|
| 1 | Injection SQL (A03) | requêtes préparées (DBAL) ; paramètres liés ; filtre `LIKE` échappé | groupe 02 : charge `' OR '1'='1` et `DROP TABLE` : 0 résultat, table intacte | **testée** |
| 2 | XSS stocké (A03) | validation stricte des noms (lettres uniquement) ; échappement automatique d'Angular ; CSP `default-src 'none'` côté API | groupe 02 : `<script>` refusé (422) | **testée** |
| 3 | Contrôle d'accès défaillant (A01) | rôles Symfony + `access_control` | groupe 06 : sportif, gestionnaire, admin (403) | **testée** |
| 4 | Accès sans authentification (A01/A07) | pare-feu : 401 JSON sur toute route privée | groupe 02 : `/api/me` et `/api/reservations` renvoient 401 | **testée** |
| 5 | Élévation de privilège par mass assignment (A04) | rôle jamais lu depuis la requête ; imposé à `sportif` | test 03 : inscription avec `"role":"admin"`, connexion : rôle `sportif` | **testée** |
| 6 | Falsification de lien (A08) | lien de confirmation signé (HMAC) avec expiration d'une heure | test 03 : lien falsifié refusé (400) | **testée** |
| 7 | Mots de passe faibles (A07) | 10 caractères minimum, lettre + chiffre ; hachage | groupe 02 : mot de passe `court` refusé (422) | **testée** |
| 8 | Contournement de la confirmation e-mail (A07) | `UserChecker` refuse les comptes non confirmés | test 03 : connexion refusée avant confirmation | **testée** |
| 9 | Données invalides / formulaire contourné (A03) | validation serveur ; JSON schema MySQL ; contraintes `CHECK` et clés étrangères | tests 02, 05 (contact refusé) | **testée** |
| 10 | Fuite de données sensibles (A02) | aucune colonne de mot de passe dans les réponses ; sérialisation sans hash | test « Aucun mot de passe exposé » | **testée** |
| 11 | Force brute sur la connexion (A07) | `login_throttling` : 5 essais par 15 minutes | configuré, non démontré par un test automatique | mitigée |
| 12 | CSRF (A01) | cookie de session `SameSite=Lax` (valeur par défaut de Symfony, à confirmer dans les outils du navigateur) ; API JSON uniquement | non testé automatiquement | mitigée |
| 13 | Surcharge de la base / double réservation (A04) | transaction + verrou de ligne dans la procédure stockée | groupe 04 (capacité) ; test de charge §5 (0 erreur) | mitigée |
| 14 | Clickjacking / sniffing (A05) | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` | implémentation en code, non testée automatiquement | mitigée |
| 15 | Écoute du réseau (A02) | HTTPS | **non couverte** : application testée en HTTP local, déploiement distant non réalisé | non couverte |
| – | Énumération des comptes (A07) | l'inscription indique « e-mail déjà utilisé » | limite connue, acceptée pour ce projet | non couverte |
| – | Dépendances vulnérables (A06) | `npm audit` : 16 alertes modérées, toutes dans les outils de développement Angular ; `composer` : aucune alerte | à surveiller | à surveiller |

Bilan : 15 attaques répertoriées, dont 10 vérifiées par un test automatique, 4 mitigées par conception sans test dédié, 1 non couverte (HTTPS).

## 5. Courbes de stress (test de charge)

Outil : script `tests/stress/stress.mjs` (Node, `fetch` simultanés). Environnement : serveur PHP intégré (`php -S`, un seul processus), Symfony en mode développement, MySQL 8.4 local. Paliers de 1, 5, 10, 20 et 50 utilisateurs simultanés, 8 secondes par palier. Résultats bruts : `tests/stress/resultats.csv` et `resultats.json`. Courbes : `tests/stress/courbes-stress.png`.

| Utilisateurs | Liste des salles : moyenne / 95e centile | Fiche d'une salle : moyenne / 95e centile | Débit |
|---|---|---|---|
| 1 | 253 ms / 306 ms | 249 ms / 299 ms | 4,0 req/s |
| 5 | 1 156 ms / 1 320 ms | 1 170 ms / 1 302 ms | 4,0 à 4,1 req/s |
| 10 | 2 185 ms / 2 505 ms | 2 210 ms / 2 527 ms | 4,0 à 4,1 req/s |
| 20 | 3 989 ms / 4 902 ms | 3 952 ms / 4 900 ms | 4,1 req/s |
| 50 | 8 446 ms / 12 028 ms | 8 477 ms / 12 173 ms | 4,1 à 4,2 req/s |

Lecture des résultats :
- Aucune erreur sur 493 requêtes : l'application tient la charge, elle devient seulement plus lente.
- Le débit plafonne à environ 4 requêtes par seconde dès le premier utilisateur : le serveur intégré de PHP traite une requête à la fois (environ 250 ms par requête en mode développement).
- Le temps de réponse augmente donc de façon linéaire avec le nombre d'utilisateurs, car les requêtes font la queue.
- Limite : ces mesures ne représentent pas la production. Avec plusieurs processus (PHP-FPM), le cache d'opcodes et Symfony en mode production, le débit serait nettement supérieur. Cette mesure n'a pas été réalisée.

## 6. Limites et suite

- Courbes de stress mesurées uniquement sur le serveur de développement ; à refaire sur un serveur de production.
- Déploiement distant sécurisé (HTTPS, base distante) : non réalisé.
- Les données de test (comptes `@fitbook.test`) ne doivent jamais être utilisées en production.
- Les tests de force brute et de CSRF sont les prochaines vérifications à automatiser.
