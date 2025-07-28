# 🎲 Board Games Hub

Application multijoueur de jeux de société en ligne avec UNO et Skyjo.

## 🎮 Jeux disponibles

- **🎯 UNO** : Jeu de cartes classique multijoueur (2-4 joueurs)
- **⭐ Skyjo** : Jeu de stratégie et mémoire (2-8 joueurs)

## 🚀 Démarrage rapide

### Développement local

```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm run dev

# Ouverture dans le navigateur
# http://localhost:8080
```

### Production

```bash
# Build pour la production
npm run build

# Démarrage en production
npm start
```

## 📦 Déploiement

### Render (Recommandé)

Render offre un serveur persistant, idéal pour les jeux multijoueurs.

1. **Automatique** : Pusher le code sur GitHub avec `render.yaml`
2. **Manuel** : Suivre le guide dans [RENDER_DEPLOY.md](./RENDER_DEPLOY.md)

**Avantages de Render** :

- ✅ Serveur persistant (pas de déconnexions)
- ✅ État de jeu maintenu
- ✅ Reconnexion automatique
- ✅ Plan gratuit généreux

### Autres plateformes

- **Heroku** : Compatible avec les mêmes configurations
- **Railway** : Alternative moderne à Heroku
- **DigitalOcean App Platform** : Avec le Dockerfile inclus

## 🛠 Structure du projet

```
├── client/                 # Frontend React + TypeScript
│   ├── components/        # Composants réutilisables
│   ├── pages/            # Pages principales
│   └── hooks/            # Hooks personnalisés
├── server/               # Backend Express
│   └── routes/          # Routes API
├── shared/              # Types partagés client/serveur
└── dist/               # Build de production
```

## 🎯 Fonctionnalités

### UNO

- ✅ Règles complètes (cartes +2, +4, wild, etc.)
- ✅ Bouton UNO et contre-UNO
- ✅ Gestion des couleurs wild
- ✅ Conditions de victoire

### Skyjo

- ✅ Phase d'initialisation (choix de 2 cartes)
- ✅ Échange avec pile de défausse
- ✅ Suppression de colonnes identiques
- ✅ Scoring avec règle de doublement
- ✅ Mode offline comme fallback

### Multijoueur

- ✅ Création/join de salons avec codes
- ✅ Synchronisation temps réel
- ✅ Reconnexion automatique
- ✅ Système de heartbeat

## 🔧 Technologies

- **Frontend** : React 18, TypeScript, TailwindCSS, Vite
- **Backend** : Node.js, Express, TypeScript
- **Déploiement** : Render, Docker ready
- **Architecture** : Full-stack avec serveur persistant

## 📋 Scripts disponibles

```bash
npm run dev          # Développement avec hot reload
npm run build        # Build production (client + serveur)
npm run start        # Démarrage production
npm run test         # Tests unitaires
npm run typecheck    # Vérification TypeScript
npm run format.fix   # Formatage du code
```

## 🌐 API Endpoints

### Salons

- `POST /api/rooms` - Créer un salon
- `POST /api/rooms/:id/join` - Rejoindre un salon
- `GET /api/rooms/:id` - Récupérer info salon
- `POST /api/rooms/:id/leave` - Quitter un salon

### UNO

- `POST /api/rooms/:id/start` - Démarrer partie
- `POST /api/rooms/:id/play` - Jouer une carte
- `POST /api/rooms/:id/draw` - Piocher
- `POST /api/rooms/:id/uno` - Appeler UNO

### Skyjo

- `POST /api/rooms/:id/skyjo/reveal` - Révéler carte
- `POST /api/rooms/:id/skyjo/draw` - Piocher
- `POST /api/rooms/:id/skyjo/take-discard` - Prendre défausse
- `POST /api/rooms/:id/skyjo/exchange` - Échanger carte

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amélioration`)
3. Commiter (`git commit -m 'Ajouter fonctionnalité'`)
4. Pusher (`git push origin feature/amélioration`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.
