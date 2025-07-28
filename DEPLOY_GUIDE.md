# 🚀 Guide de Déploiement Render - Board Games Hub

## Étape 1: Préparer le repository GitHub

1. **Créer un repository GitHub** (si pas déjà fait)
2. **Pousser le code** avec toutes les modifications :
   ```bash
   git add .
   git commit -m "Prêt pour déploiement Render"
   git push origin main
   ```

## Étape 2: Créer un compte Render

1. Aller sur https://render.com
2. S'inscrire avec GitHub (recommandé)
3. Autoriser l'accès à vos repositories

## Étape 3: Déployer sur Render

### Option A: Déploiement automatique (Recommandé)

1. **Créer un Blueprint** :

   - Dans le dashboard Render, cliquer "New +"
   - Choisir "Blueprint"
   - Sélectionner votre repository GitHub
   - Render détectera automatiquement `render.yaml`

2. **Configuration automatique** :

   - Render configurera tout selon `render.yaml`
   - Web Service avec Node.js
   - Build et start commands automatiques
   - Variables d'environnement définies

3. **Déploiement** :
   - Cliquer "Apply" pour démarrer
   - Le build prend environ 5-10 minutes
   - URL générée automatiquement

### Option B: Déploiement manuel

1. **Créer un Web Service** :

   - Cliquer "New +" → "Web Service"
   - Connecter votre repository GitHub
   - Sélectionner la branche `main`

2. **Configuration** :

   ```
   Name: board-games-hub
   Region: Frankfurt (ou votre région)
   Branch: main
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Variables d'environnement** :

   - `NODE_ENV` = `production`
   - (PORT est automatique)

4. **Créer le service** et attendre le déploiement

## Étape 4: Vérifier le déploiement

Une fois déployé, votre app sera disponible à une URL comme :
`https://board-games-hub-xxxx.onrender.com`

### Tests à effectuer :

1. ✅ **Page d'accueil** s'affiche correctement
2. ✅ **Créer un salon UNO** fonctionne
3. ✅ **Créer Skyjo Local** fonctionne
4. ✅ **API Health check** : `https://votre-url.onrender.com/health`

## Avantages de Render pour Board Games Hub

- 🚀 **Serveur persistant** : Fini les déconnexions !
- 🔄 **Reconnexion automatique** des joueurs
- 💾 **État maintenu** entre les requêtes
- 🆓 **Plan gratuit** généreux (750h/mois)
- 📈 **Auto-scaling** si besoin
- 🔒 **HTTPS automatique**

## Fonctionnalités disponibles après déploiement

### UNO Multijoueur

- ✅ Parties stables sans déconnexions
- ✅ Synchronisation temps réel
- ✅ Toutes les règles UNO

### Skyjo Multijoueur

- ✅ Parties serveur persistantes
- ✅ Choix des cartes initiales
- ✅ Échanges avec défausse

### Skyjo Offline (Fallback)

- ✅ Mode local si problèmes serveur
- ✅ Sauvegarde localStorage
- ✅ Fonctionnement hors ligne

## Mise à jour de l'application

Pour mettre à jour après modification :

1. **Pousser les changements** :

   ```bash
   git add .
   git commit -m "Mise à jour fonctionnalité"
   git push origin main
   ```

2. **Déploiement automatique** : Render redéploie automatiquement

## Monitoring et Support

- **Dashboard** : https://dashboard.render.com
- **Logs** : Disponibles en temps réel
- **Métriques** : CPU, mémoire, requêtes
- **Status** : https://status.render.com

## Troubleshooting

### Build échoue

- Vérifier que `package.json` est correct
- V��rifier les dépendances dans `dependencies`

### App ne démarre pas

- Vérifier les logs dans le dashboard
- S'assurer que le port est bien configuré

### Parties se déconnectent

- Avec Render, ce problème devrait être résolu !
- Vérifier le statut sur le dashboard

## Coût

- **Plan gratuit** : 750 heures/mois (suffisant pour usage personnel/test)
- **Plan payant** : $7/mois pour unlimited + plus de ressources

---

**🎉 Votre Board Games Hub est maintenant déployé sur Render avec un serveur persistant !**

Les joueurs peuvent maintenant profiter de parties stables sans déconnexions intempestives.
