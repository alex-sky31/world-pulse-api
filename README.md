# World Pulse API

API backend standalone pour le dashboard [World Pulse](https://github.com/alex-sky31/world-pulse).

Ce dépôt expose les endpoints `/api/*` consommés par le frontend React. Il tourne avec **Express** et **TypeScript** (Node.js) et peut être déployé indépendamment du frontend (Vercel, Netlify, etc.).

## Prérequis

- [Node.js](https://nodejs.org/) 20+

## Installation

```bash
git clone https://github.com/alex-sky31/world-pulse-api.git
cd world-pulse-api
npm install
cp .env.example .env
```

Éditez `.env` et ajoutez votre clé OpenRouter si vous voulez les données IA :

```
OPENROUTER_API_KEY=sk-or-v1-...
```

## Lancer en développement

```bash
npm run dev
```

L'API écoute sur `http://localhost:3000` par défaut.

## Connecter le frontend World Pulse

Le frontend appelle `fetch('/api/...')`. En dev, configurez un **proxy Vite** dans le repo `world-pulse` (`vite.config.ts`) :

```typescript
export default defineConfig({
  // ...
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
```

Ensuite, lancez les deux en parallèle :

```bash
# Terminal 1 — API
cd world-pulse-api && npm run dev

# Terminal 2 — Frontend
cd world-pulse && npm run dev
```

Le frontend garde `fetch('/api/...')` sans modification.

### Production

Déployez l'API sur Railway ou Fly.io, puis configurez le frontend pour pointer vers l'URL de l'API :

- **Option A** : proxy / rewrite côté hébergeur frontend
- **Option B** : variable `VITE_API_URL=https://votre-api.railway.app` dans le frontend

## Endpoints

Toutes les routes acceptent **GET, POST, PATCH, PUT**. Réponses JSON avec `Cache-Control: no-store`.

| Route | Description | Cache serveur |
|-------|-------------|---------------|
| `GET /health` | Health check | — |
| `GET /api/markets/crypto` | Prix crypto (BTC, ETH, SOL, BNB) | 45s |
| `GET /api/markets/fx` | Taux de change | 30s |
| `GET /api/markets/commodities` | Matières premières | 30s |
| `GET /api/markets/movers` | Top movers crypto + actions | 30s |
| `GET /api/markets/calendar` | Calendrier économique | 1h |
| `GET /api/news/world` | Actualités monde (RSS) | 5 min |
| `GET /api/news/tech` | Actualités tech (RSS) | 5 min |
| `GET /api/infra/datacenters` | Datacenters cloud (liste statique) | — |
| `GET /api/ai/models` | Classements modèles IA (OpenRouter) | 1h |

### Tester avec curl

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/markets/crypto
curl http://localhost:3000/api/news/world
curl http://localhost:3000/api/infra/datacenters
curl http://localhost:3000/api/ai/models
```

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | `3000` | Port d'écoute |
| `CORS_ORIGIN` | `http://localhost:5173` | Origine autorisée (frontend Vite) |
| `OPENROUTER_API_KEY` | — | Clé API OpenRouter (requis pour `/api/ai/models`) |

Le fichier `.env` à la racine est chargé automatiquement au démarrage.

## Scripts

```bash
npm run dev        # Développement avec rechargement auto
npm start          # Production
npm run typecheck  # Vérification TypeScript
```

## Déploiement

**Railway** (recommandé) :

1. Créez un nouveau projet Railway
2. Connectez ce dépôt GitHub
3. Railway détecte Node.js automatiquement
4. Ajoutez `OPENROUTER_API_KEY` dans les variables d'environnement
5. Définissez `CORS_ORIGIN` sur l'URL de votre frontend (ex. `https://world-pulse.vercel.app`)

**Fly.io** :

```bash
fly launch
fly secrets set OPENROUTER_API_KEY=sk-or-v1-...
fly deploy
```

> Vercel n'est pas idéal pour ce type d'API long-running. Préférez Railway ou Fly.io.

## Structure du projet

```
src/
  index.ts          # Point d'entrée Express
  http.ts           # Helpers HTTP
  ai/               # Modèles IA (OpenRouter)
    route.ts
    service.ts
    constant.ts
    schema.ts
  markets/          # Marchés (Yahoo, TradingView)
    route.ts
    service.ts
    constant.ts
    schema.ts
  infra/            # Infrastructure cloud (datacenters)
    route.ts
    service.ts
    constant.ts
    schema.ts
    datacenters.json
  news/             # Actualités (RSS)
    route.ts
    service.ts
    constant.ts
    schema.ts
  types/            # Contrats JSON partagés avec le frontend
```

## Erreurs

| Code | Corps |
|------|-------|
| `404` | `{ "error": "Not found" }` |
| `502` | `{ "error": "<message>" }` — échec fetch externe |
| `503` | `{ "error": "Set OPENROUTER_API_KEY..." }` — clé manquante |
