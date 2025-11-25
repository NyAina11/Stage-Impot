# Application de Suivi des Contributions Fiscales (ASCF)

Cette application est un système interne de suivi et de gestion des dossiers de paiement des contributions fiscales, conçu pour rationaliser le processus de gestion des impôts.

## Fonctionnalités

*   **Gestion des rôles :** Prise en charge de différents rôles d'utilisateur (Accueil, Gestion, Caisse, Chef de Division) avec des autorisations spécifiques.
*   **Suivi des dossiers :** Suivi des dossiers à travers différents statuts (En attente de calcul, En attente de paiement, Payé, Annulé).
*   **Gestion des paiements :** Enregistrement des paiements avec diverses méthodes (chèque, espèces, virement bancaire).
*   **Détails fiscaux :** Possibilité d'inclure des détails spécifiques pour chaque dossier fiscal.
*   **Journal d'audit :** Enregistrement des actions des utilisateurs pour la traçabilité.
*   **Rapports en temps réel :** Fournit des informations à jour sur l'état du processus de paiement.

## Technologies

*   **Frontend :** React, TypeScript, Vite
*   **Backend :** Node.js, Express.js, bcryptjs, jsonwebtoken
*   **Base de données (développement) :** Fichier JSON (`db.json`)
*   **Serveur Web :** Nginx
*   **Orchestration :** Docker, Docker Compose

## Démarrage du Projet

### Prérequis

Assurez-vous d'avoir installé les éléments suivants sur votre machine :

*   Node.js (version 20 ou supérieure recommandée)
*   npm (normalement inclus avec Node.js)
*   Docker et Docker Compose

### Utilisation avec Docker Compose (Recommandé)

La méthode recommandée pour lancer ce projet est d'utiliser Docker Compose, qui configurera et démarrera à la fois le frontend et le backend dans des conteneurs isolés.

1.  **Construire et démarrer les conteneurs :**

    Depuis le répertoire racine du projet, exécutez la commande suivante :

    ```bash
    docker compose up --build
    ```

    *   `docker compose up` : Démarre les services définis dans `docker-compose.yml`.
    *   `--build` : Construit les images Docker pour le frontend et le backend avant de démarrer les conteneurs (nécessaire lors du premier démarrage ou après des modifications du Dockerfile).

2.  **Accéder à l'application :**

    Une fois les conteneurs en cours d'exécution, ouvrez votre navigateur web et naviguez vers :
    [http://localhost](http://localhost)

    (Le frontend est servi sur le port 80 à l'intérieur du conteneur Nginx, qui est mappé au port 80 de votre machine hôte).

3.  **Identifiants par défaut (pour le premier démarrage) :**

    Les utilisateurs par défaut sont créés si la base de données est vide au démarrage du backend. Le mot de passe pour tous est `password123`.

    *   Nom d'utilisateur : `accueil_user`, Rôle : `Accueil`
    *   Nom d'utilisateur : `gestion_user`, Rôle : `Gestion`
    *   Nom d'utilisateur : `caisse_user`, Rôle : `Caisse`
    *   Nom d'utilisateur : `chef_division_user`, Rôle : `Chef de Division`

### Comment arrêter

Pour arrêter l'application et supprimer les conteneurs, exécutez la commande suivante dans le même répertoire :

```bash
docker compose down
```

Ceci arrêtera et supprimera les conteneurs, mais conservera les images construites. Si vous souhaitez également supprimer les images, ajoutez l'option `--rmi all` (attention, cela supprimera toutes les images créées par Compose pour ce projet).

### Démarrage Manuel (Alternative)

Si vous préférez exécuter le frontend et le backend séparément (par exemple pour le développement sans Docker Compose) :

1.  **Backend :**

    Naviguez vers le répertoire `server` et installez les dépendances, puis démarrez le serveur :

    ```bash
    cd server
    npm install
    npm start
    ```

    Le backend s'exécutera sur `http://localhost:3001`.

2.  **Frontend :**

    Depuis le répertoire racine du projet, installez les dépendances et démarrez le serveur de développement :

    ```bash
    npm install
    npm run dev
    ```

    Le frontend s'exécutera sur `http://localhost:3000` (ou un autre port si 3000 est déjà utilisé). Le proxy dans `vite.config.ts` redirigera les requêtes `/api` vers le backend.

## Structure du Projet

*   `public/` : Fichiers statiques.
*   `src/` : Code source du frontend (React).
    *   `components/` : Composants React réutilisables.
    *   `services/` : Fonctions d'appel API.
    *   `store/` : Gestion de l'état de l'application (Zustand).
    *   `types.ts` : Définitions de types TypeScript.
*   `server/` : Code source du backend (Node.js/Express).
    *   `db.json` : Base de données JSON pour le développement.
    *   `index.js` : Point d'entrée du serveur backend.
*   `Dockerfile.frontend` : Dockerfile pour l'application React.
*   `Dockerfile.backend` : Dockerfile pour l'application Node.js.
*   `nginx.conf` : Configuration Nginx pour le frontend et le proxy inverse.
*   `docker-compose.yml` : Fichier d'orchestration Docker Compose.
*   `package.json` / `package-lock.json` : Dépendances du frontend.
*   `server/package.json` / `server/package-lock.json` : Dépendances du backend.
*   `vite.config.ts` : Configuration Vite.
*   `tsconfig.json` : Configuration TypeScript.

test webhook
