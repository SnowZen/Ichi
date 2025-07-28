# Déploiement sur Netlify

## Configuration automatique

Ce projet est configuré pour se déployer automatiquement sur Netlify via https://board-games-hub.netlify.app/

## Paramètres de build

```
Build command: npm run build
Publish directory: dist/spa
Functions directory: netlify/functions
```

## Variables d'environnement

Aucune variable d'environnement n'est requise pour le fonctionnement de base.

## Fonctionnalités

### ✅ UNO

- Fonctionne entièrement avec les fonctions serverless
- Multiplayer en temps réel
- Synchronisation automatique

### ✅ Skyjo (Mode optimisé)

- **Mode offline automatique** sur Netlify pour contourner les limitations serverless
- Sauvegarde locale avec localStorage
- Multiplayer local (même appareil/partage d'écran)
- Règles complètes implémentées

## Optimisations Netlify

1. **Détection automatique** : L'app détecte l'environnement Netlify
2. **Mode offline Skyjo** : Utilisation automatique du mode offline pour Skyjo
3. **Cache optimisé** : Headers HTTP configurés pour les performances
4. **Routing SPA** : Redirections configurées pour React Router
5. **Compression** : Assets optimisés et gzip

## Utilisation recommandée sur Netlify

### Pour UNO

- Utiliser la création de salon normale
- Fonctionnement en mode serveur

### Pour Skyjo

- Cliquer sur "⭐ Créer Skyjo Local (sans serveur)"
- Mode offline garanti sans déconnexions
- Partage du code de salon pour multijoueur

## Structure du projet

```
├── dist/spa/           # Frontend build (publish dir)
├── netlify/
│   └── functions/
│       └── api.ts      # Fonction serverless
├── netlify.toml        # Configuration Netlify
└── public/
    ├── _headers        # Headers HTTP
    └── _redirects      # Redirections SPA
```

## Débogage

Si vous rencontrez des problèmes :

1. **Salons introuvables** : Normal avec les fonctions serverless, utiliser Skyjo Local
2. **Déconnexions fréquentes** : L'app bascule automatiquement en mode offline
3. **Erreurs 404 API** : Les fonctions serverless se réinitialisent, utiliser la sauvegarde locale

L'application est conçue pour fonctionner de manière optimale sur Netlify avec ces adaptations automatiques.
