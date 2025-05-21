# BeUnreal - 4HYBD

BeUnreal est une application mobile inspirée de BeReal permettant aux utilisateurs de partager des photos et des vidéos de manière authentique avec leurs amis.

## Fonctionnalités

### Authentification & Profil
- Inscription et connexion des utilisateurs
- Gestion du profil utilisateur (photo, bio, etc.)
- Système de session sécurisé (JWT)

### Social
- Système d'amis (ajout, suppression, blocage)
- Gestion des demandes d'amitié
- Recherche d'utilisateurs
- Messagerie instantanée entre amis
- Conversations de groupe

### Média & Géolocalisation
- Capture et partage de photos/vidéos
- Stories publiques géolocalisées
- Visualisation des stories sur une carte
- Exploration des contenus à proximité

### Technique
- Architecture microservices (3 services : utilisateurs, messages, médias)
- Communication en temps réel (WebSocket)
- Stockage des médias avec MinIO
- Base de données PostgreSQL

## Installation et Déploiement

### Prérequis
- Node.js (v14+)
- PostgreSQL
- MinIO Server
- npm ou yarn

### Configuration

1. Configuration des variables d'environnement :
   Créer un fichier `.env` dans chaque service avec les variables appropriées (Les fichiers sont déjà fournis et pré-configurés).

### Installation

1. Lancement de la base de données et MinIO :
   La configuration des services externes est déjà pré-configurés avec une configuration docker compose.
```bash
docker compose up -d
```

2. Service Utilisateurs :
```bash
cd service-user
npm install
npm run dev
```

3. Service Messages :
```bash
cd service-message
npm install
npm run dev
```

3. Service Media :
```bash
cd service-media
npm install
npm run dev
```

5. Application Frontend :
```bash
cd BeUnreal
npm install
npm run dev
```

Une fois tous les services lancés, vous pouvez vous rendre sur le site web http://localhost:5173.
L'application est compatible avec les plateformes IOs et Android. Android Studio est nécessaire pour utiliser l'application en mode développement.

### Ports par défaut
- Service Utilisateurs : 3000
- Service Messages : 3001
- Service Media : 3002
- Application Frontend : 5173