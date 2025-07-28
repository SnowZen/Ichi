# Déploiement sur Render

Ce guide vous explique comment déployer Board Games Hub sur Render.

## Prérequis

1. Un compte GitHub avec votre code
2. Un compte Render (gratuit) sur https://render.com

## Méthode 1: Déploiement automatique avec render.yaml

1. **Pousser le code sur GitHub** avec le fichier `render.yaml` inclus
2. **Connecter à Render** :
   - Aller sur https://dashboard.render.com
   - Cliquer "New +" puis "Blueprint"
   - Connecter votre repository GitHub
   - Sélectionner ce repository
3. **Configuration automatique** : Render lira `render.yaml` et configurera tout automatiquement
4. **Déploiement** : Render commencera le build automatiquement

## Méthode 2: Déploiement manuel

1. **Créer un Web Service** :

   - Aller sur https://dashboard.render.com
   - Cliquer "New +" puis "Web Service"
   - Connecter votre repository GitHub

2. **Configuration** :

   - **Name**: board-games-hub
   - **Region**: Frankfurt (ou votre région préférée)
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. **Variables d'environnement** :

   - `NODE_ENV` = `production`
   - `PORT` = (laissez vide, Render le définira automatiquement)

4. **Déployer** : Cliquer "Create Web Service"

## Méthode 3: Déploiement avec Docker

Si vous préférez utiliser Docker :

1. **Créer un Web Service**
2. **Configuration** :
   - **Runtime**: Docker
   - **Dockerfile path**: `./Dockerfile`
3. Le reste de la configuration reste identique

## Configuration post-déploiement

Une fois déployé, votre application sera disponible à l'URL fournie par Render (par exemple : `https://board-games-hub-xxxx.onrender.com`).

### Fonctionnalités disponibles

- ✅ **UNO multijoueur** avec serveur persistant
- ✅ **Skyjo multijoueur** avec serveur persistant
- ✅ **Skyjo offline** comme fallback
- ✅ **Connexions stables** (pas de fonctions serverless)
- ✅ **Reconnexion automatique**

### Avantages de Render vs Netlify

- **Serveur persistant** : Plus de problèmes de déconnexion
- **État maintenu** : Les parties survivent aux rechargements
- **WebSocket ready** : Possibilité d'ajouter des WebSockets plus tard
- **Databases** : Possibilité d'ajouter une base de données PostgreSQL gratuite

## Monitoring

- **Logs** : Accessible via le dashboard Render
- **Métriques** : CPU, RAM, réponses HTTP
- **Health checks** : Endpoint `/health` configuré
- **Auto-redémarrage** : En cas de crash

## Mise à jour

Pour mettre à jour l'application :

1. Pousser les changements sur GitHub
2. Render redéploiera automatiquement

## Support

- Dashboard Render : https://dashboard.render.com
- Documentation : https://render.com/docs
- Status page : https://status.render.com
