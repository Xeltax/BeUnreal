# BeUnreal - 4HYBD

Membres du groupe :
- Bosquet Ewen
- Goudal Mathieu
- Honore Clément

## Présentation

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
   Pour l'application Ionic, vous devrez configurer le fichier [.env](BeUnreal/.env) de la façon suivante :
```
VITE_USERS_URL=http://<votre_ipv4>:3000
VITE_MESSAGES_URL=http://<votre_ipv4>:3001
VITE_MEDIAS_URL=http://<votre_ipv4>:3002
```
   Pour le service medias, vous devrez configurer la variable d'environnement `MINIO_HOST` de cette façon : `MINIO_HOST=http://<votre_ipv4>:9000`. Sans cela, les images ne seront pas visible sur l'application mobile.
2. Configurez Capacitor pour être compatible avec Android.
   Vous devrez modifier les fichiers suivants
   - [capacitor.config.ts](BeUnreal/capacitor.config.ts)
     Remplacez dans `url` par `http://<votre_ipv4>:5173`
     Remplacez dans `allowNavigation` par `['<votre_ipv4>']`
   - [vite.config.ts](BeUnreal/vite.config.ts)
     Remplacez dans `host` par `<votre_ipv4>`
   - [network_security_config.xml](BeUnreal/android/app/src/main/res/xml/network_security_config.xml)
     Remplacez dans la balise `<domain ...>192.168.1.100</domain>` par `<domain ...><votre_ipv4></domain>`

Vous pouvez maintenant exécuter la commande suivante à la racine du projet Ionic :
```bash
ionic cap sync android
```

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

6. Application mobile :
```bash
cd BeUnreal
ionic cap open android
```
Lorsque Android Studio sera ouvert, connectez votre téléphone ou un émulateur et lancez l'application

L'application est compatible avec les plateformes IOs et Android. Android Studio est nécessaire pour utiliser l'application en mode développement.

### Ports par défaut
- Service Utilisateurs : 3000
- Service Messages : 3001
- Service Media : 3002
- Application Frontend : 5173