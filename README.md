# Application de Suivi des Contributions Fiscales (ASCF)

Cette application web interne permet d'enregistrer, suivre et archiver le processus de paiement des impôts.

## Architecture

L'application est composée de deux services :
- **Frontend** : Application React/Vite (port 3000)
- **Backend** : API Node.js/Express (port 3001)

## Déploiement avec Docker

Cette application est configurée pour fonctionner dans des conteneurs Docker, permettant de tester le projet sans installer les dépendances sur votre machine.

### Prérequis

- [Docker](https://docs.docker.com/get-docker/) installé sur votre machine
- [Docker Compose](https://docs.docker.com/compose/install/) (généralement inclus avec Docker Desktop)

### Comment démarrer l'application

1. **Construire et démarrer les conteneurs avec Docker Compose :**

    Ouvrez votre terminal dans le répertoire racine du projet (où se trouve `docker-compose.yml`) et exécutez la commande suivante :

    ```bash
    docker-compose up -d
    ```

    Cette commande va :
    - Construire les images Docker pour le frontend et le backend
    - Créer et démarrer les conteneurs en mode détaché (`-d`)
    - Configurer le réseau entre les services

2. **Accéder à l'application :**

    Une fois les conteneurs démarrés, ouvrez votre navigateur web et naviguez vers :
    - **Frontend** : [http://localhost:3000](http://localhost:3000)
    - **Backend API** : [http://localhost:3001](http://localhost:3001)

### Comptes utilisateurs par défaut

L'application crée automatiquement des comptes utilisateurs par défaut avec le mot de passe `password123` :

- **Accueil** : `accueil_user`
- **Gestion** : `gestion_user`
- **Caisse** : `caisse_user`
- **Chef de Division** : `chef_division_user`

### Comment arrêter l'application

Pour arrêter l'application, exécutez la commande suivante dans le même répertoire :

```bash
docker-compose down
```

Cette commande arrêtera et supprimera les conteneurs.

### Commandes utiles

```bash
# Voir les logs des services
docker-compose logs -f

# Reconstruire les images
docker-compose up --build

# Arrêter et supprimer les volumes
docker-compose down -v
```

## Développement local (sans Docker)

Si vous préférez installer les dépendances localement :

### Backend
```bash
cd server
npm install
npm start
```

### Frontend
```bash
npm install
npm run dev
```
