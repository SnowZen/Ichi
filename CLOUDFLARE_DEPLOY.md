# Déploiement sur Cloudflare Pages

Ce guide vous explique comment déployer l'application Board Games Hub sur Cloudflare Pages.

## Prérequis

1. Un compte Cloudflare
2. Node.js installé localement
3. Le CLI Wrangler installé (`npm install -g wrangler`)

## Configuration locale

1. **Installer les dépendances :**
   ```bash
   npm install
   ```

2. **Se connecter à Cloudflare :**
   ```bash
   npx wrangler login
   ```

3. **Tester localement :**
   ```bash
   npm run pages:dev
   ```

## Déploiement automatique

### Via le dashboard Cloudflare Pages

1. Allez sur [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sélectionnez **Pages** dans le menu latéral
3. Cliquez sur **Create a project**
4. Connectez votre repository GitHub/GitLab
5. Configurez les paramètres de build :
   - **Build command**: `npm run pages:build`
   - **Build output directory**: `dist/spa`
   - **Root directory**: `/` (racine du projet)
   - **Node.js version**: `18` ou `20`

### Variables d'environnement

Si nécessaire, ajoutez les variables d'environnement dans l'onglet **Settings** > **Environment variables** :
- `NODE_VERSION`: `18`

## Déploiement manuel

Pour déployer manuellement depuis votre machine locale :

```bash
npm run pages:deploy
```

## Fonctionnalités

✅ **Incluses dans cette configuration :**
- API serverless avec Cloudflare Functions
- Routing SPA automatique
- Headers de sécurité
- CORS configuré
- Cache optimisé

✅ **Avantages de Cloudflare Pages :**
- Edge computing global
- CDN ultra-rapide
- SSL automatique
- Protection DDoS
- Analytics intégrés
- Déploiements atomiques

## Structure des fichiers

```
├── functions/
│   ├── api/
│   │   └── [[path]].ts          # API handler pour Cloudflare Functions
│   └── types.d.ts               # Types TypeScript pour Functions
├── _headers                     # Headers HTTP pour Cloudflare Pages
├── _redirects                   # Règles de redirection
├── wrangler.toml               # Configuration Wrangler
└── dist/spa/                   # Build output (généré automatiquement)
```

## Différences avec Netlify

- **Functions**: Cloudflare utilise des Workers au lieu de Functions Netlify
- **Routing**: Les redirects sont gérés via `_redirects` au lieu de `netlify.toml`
- **Headers**: Configuration via `_headers` au lieu de `netlify.toml`
- **Performance**: Edge computing global vs régional

## Dépannage

### Problème de build
```bash
# Nettoyer et reconstruire
rm -rf dist/ node_modules/
npm install
npm run build
```

### Problème de Functions
- Vérifiez que le fichier `functions/api/[[path]].ts` existe
- Les logs sont disponibles dans le dashboard Cloudflare

### Problème de CORS
- Les headers CORS sont configurés dans `_headers`
- Vérifiez que les domaines sont autorisés

## URL de l'application

Une fois déployée, votre application sera disponible sur :
- `https://your-project-name.pages.dev`
- Votre domaine custom si configuré

## Monitoring

- Dashboard Cloudflare : Analytics et métriques
- Workers Analytics : Performance des Functions
- Real User Monitoring : Expérience utilisateur
