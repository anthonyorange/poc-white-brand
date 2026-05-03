# L'Atelier d'Anaïs — Site vitrine bijoux

Site e-commerce vitrine **Nuxt 3 + Firebase** pour une créatrice de bijoux faits main. Front public en SSR, admin sécurisée pour gérer produits / messages / paramètres de marque.

**Production** : https://atelieranais-cb8dd.web.app
**Repo** : https://github.com/anthonyorange/poc-white-brand

---

## Stack

| Couche | Techno |
|---|---|
| Framework front | **Nuxt 3** (Vue 3, Composition API, SSR) |
| Style | **Tailwind CSS** + CSS variables (tokens de marque dynamiques) |
| Animations | **GSAP** + ScrollTrigger (parallax, reveal, blob backgrounds) |
| Backend | **Firebase** : Firestore, Storage, Auth, App Check (reCAPTCHA v3) |
| SSR runtime | **Cloud Functions Gen 2** (Node 20) via le preset Nitro `firebase` |
| Hosting + CDN | **Firebase Hosting** (headers sécurité, cache immutable sur `/_nuxt/**`) |
| Quality | ESLint (flat config + `@nuxt/eslint`), Prettier, Vitest |
| CI | GitHub Actions (lint + format:check + test + build + `npm audit`) |

---

## Fonctionnalités

### Public
- Page d'accueil (hero, storytelling, produits "featured", catégories)
- Catalogue paginé (12 produits/page) avec filtre par catégorie
- Fiche produit détaillée avec galerie d'images
- Page "La créatrice" (storytelling)
- Formulaire de contact (honeypot anti-bot + rate-limit + validation stricte)
- Panier local (persisté en `localStorage`)
- SEO : `useSeoMeta`, OpenGraph, Twitter cards, sitemap auto, `robots.txt`

### Admin (`/admin/**`)
- Login Firebase Auth (email/password)
- Custom claim `admin: true` requis (vérifié par middleware Nuxt + rules Firestore/Storage)
- Dashboard avec stats
- CRUD produits :
  - Slug utilisé comme doc ID Firestore (URLs uniques et déterministes)
  - Upload d'images vers Firebase Storage (preview locale, progression en direct, MIME allowlist, 5 MiB max, 10 images max)
  - Cascade delete des images Storage quand un produit est supprimé
- Lecture des messages reçus (marquage lu/non lu)
- Éditeur de marque (couleurs, textes, slogan, Instagram)

---

## Architecture

```
pages/
  index.vue                     Home SSR
  catalogue/index.vue           Liste paginée + filtre
  catalogue/[slug].vue          Fiche produit (404 propre si inexistant)
  creatrice.vue, contact.vue, panier.vue
  admin/
    login.vue, dashboard.vue, messages.vue, settings.vue
    products/index.vue, new.vue, [id].vue
components/
  animations/   Blob, Parallax, Reveal, Float, CustomCursor
  layout/       AppHeader, AppFooter, AdminSidebar
  jewelry/      ProductCard, ProductGrid, CategoryFilter
  ui/           AppButton, ImageGallery
  admin/        ImageUploader, ProductForm, BrandEditor, StatsCard
composables/
  useAuth.ts        Firebase Auth + custom claim (lazy SDK import)
  useCart.ts        localStorage-backed cart (tests Vitest)
  useBrand.ts       Brand tokens from Firestore config/brand
  useProducts.ts    CRUD + pagination + Timestamp normalization
  useFirebase.ts    Lazy-loaders for Auth / Storage
plugins/
  firebase.client.ts    Firestore + App Check
  firebase.server.ts    SSR Firestore init
  brand-tokens.client.ts
  gsap.client.ts
middleware/
  auth.ts           /admin gate (waits for auth state settle)
firebase/
  firestore.rules, firestore.indexes.json
  storage.rules, storage.cors.json
tools/
  set-admin.mjs     Create / promote / revoke admin users
  seed-data.mjs     Populate Firestore with demo products
  deploy-rules.mjs  Deploy rules + indexes + CORS via REST API
```

---

## Sécurité

Guardrails appliqués (SYM-GR-* annotés dans le code) :

- **Firestore rules** : `admin == true` custom claim requis pour tout write. Shape stricte enforced (slug regex + égalité slug/id, bornes prix/stock, category allowlist, images ≤ 10, description ≤ 4000).
- **Storage rules** : deny-by-default. `products/**` : public read + admin-only write avec MIME allowlist (jpeg/png/webp) + 5 MiB cap.
- **Messages contact** : validation serveur (email regex, longueurs, `read == false` forcé, `keys().hasOnly()` anti privilege-injection) + honeypot client + rate-limit.
- **CORS Storage** : allowlist explicite d'origines (localhost dev + `*.web.app` + `*.firebaseapp.com`).
- **Headers HTTP** (firebase.json) : CSP stricte, HSTS 1 an + preload, X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff, Referrer-Policy strict-origin, Permissions-Policy restrictif, COOP, CORP.
- **Auth anti-enumeration** : login error générique, admin claim re-vérifié à chaque `onAuthStateChanged`.
- **Bundle** : `firebase/auth` et `firebase/storage` lazy-loaded (chunk séparé non téléchargé sur les pages publiques).
- **CI** : `npm audit --audit-level=high` comme gate PR. 0 vuln high/critical.

---

## Setup local

### Prérequis

- Node 20+ (Node 22 recommandé à partir de fin 2026)
- npm
- Projet Firebase avec Firestore + Auth + Storage activés
- Pour les outils admin : un **service account JSON** du projet Firebase

### Installation

```bash
npm install
cp .env.example .env
# Remplir .env avec les valeurs du projet Firebase
```

Les variables attendues (voir `.env.example`) :

```
NUXT_PUBLIC_FIREBASE_API_KEY
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NUXT_PUBLIC_FIREBASE_PROJECT_ID
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NUXT_PUBLIC_FIREBASE_APP_ID
NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID   # optionnel
NUXT_PUBLIC_SITE_URL                  # ex. https://atelieranais-cb8dd.web.app
NUXT_PUBLIC_RECAPTCHA_SITE_KEY        # optionnel, active App Check
```

Trouver ces valeurs :
**Firebase Console → ⚙ Project settings → General → Your apps → Web app → Config**

### Dev server

```bash
npm run dev
# http://localhost:3000
```

### Tests + qualité

```bash
npm run lint              # ESLint
npm run format:check      # Prettier (en mode check)
npm run format            # Prettier (write)
npm test                  # Vitest unit tests (7 tests)
npm run test:rules        # Firestore rules tests (nécessite Java + Firebase emulator)
```

### Build production

```bash
npm run build
# output: .output/public (static) + .output/server (SSR function)
```

---

## Outils admin CLI

Tous les scripts de `tools/` utilisent **Firebase Admin SDK** et nécessitent un **service account JSON** à la racine du projet :

1. Firebase Console → ⚙ **Project settings → Service accounts → Generate new private key**
2. Sauvegarder en tant que `./service-account.json` (déjà dans `.gitignore`)
3. **Supprimer** le fichier après usage (`rm service-account.json`)

### `tools/set-admin.mjs` — gérer les admins

```bash
# Créer un nouvel admin (user + custom claim)
node tools/set-admin.mjs create admin@example.com 'MotDePasseFort12+'

# Promouvoir un user existant
node tools/set-admin.mjs promote admin@example.com

# Retirer le claim admin
node tools/set-admin.mjs revoke admin@example.com

# Inspecter un user
node tools/set-admin.mjs whoami admin@example.com
```

Mot de passe min. 12 caractères. Après création, l'user doit se déconnecter/reconnecter pour que le claim soit pris en compte.

### `tools/seed-data.mjs` — peupler Firestore

```bash
node tools/seed-data.mjs               # crée uniquement si absent (idempotent)
node tools/seed-data.mjs --force       # écrase tout
node tools/seed-data.mjs --brand-only  # seulement config/brand
node tools/seed-data.mjs --products-only
```

Seed : 1 document `config/brand` + 8 produits répartis sur les 4 catégories.

### `tools/deploy-rules.mjs` — déployer rules, indexes, CORS

```bash
node tools/deploy-rules.mjs                 # Firestore rules + indexes
node tools/deploy-rules.mjs --storage       # ajoute Storage rules + CORS
node tools/deploy-rules.mjs --firestore-only --storage   # Storage seul
node tools/deploy-rules.mjs --skip-indexes
```

Alternative au CLI `firebase deploy` (qui nécessite `serviceusage.serviceUsageConsumer` sur le SA). Ce script parle directement aux APIs `firebaserules.googleapis.com` + `firestore.googleapis.com` + `storage.googleapis.com`.

---

## Déploiement en production

### Prérequis Firebase (setup initial, une seule fois)

**1. Plan Blaze** (pay-as-you-go) requis pour Cloud Functions Gen 2. Les free tiers couvrent largement un site vitrine (2M invocations/mois, 10 GB Hosting/mois).

**2. APIs GCP à activer** (Console Cloud → APIs & Services → Library) :
- `cloudfunctions.googleapis.com`
- `cloudbuild.googleapis.com`
- `artifactregistry.googleapis.com`
- `run.googleapis.com`
- `eventarc.googleapis.com`
- `firebaseextensions.googleapis.com`
- `cloudbilling.googleapis.com`

**3. Rôles IAM** sur le service account `firebase-adminsdk-*` (pour les scripts `tools/*`) :
- `roles/firebaserules.admin`
- `roles/datastore.indexAdmin`
- `roles/serviceusage.serviceUsageConsumer`
- `roles/cloudfunctions.admin`
- `roles/run.admin`
- `roles/iam.serviceAccountUser`
- `roles/iam.serviceAccountTokenCreator`

Après le setup initial, on peut restreindre aux deux premiers pour les déploiements récurrents de rules/indexes.

**4. Rules, indexes, CORS** (depuis une machine avec `service-account.json`) :

```bash
node tools/deploy-rules.mjs --storage
```

**5. CORS du bucket** : inclus automatiquement via `--storage`. Si le domaine de prod change (ex. domaine custom), éditer `firebase/storage.cors.json` et redéployer.

### Déploiement continu

```bash
# 1. Build
rm -rf .output
NUXT_PUBLIC_SITE_URL=https://atelieranais-cb8dd.web.app npm run build

# 2. Installer les deps du bundle Functions (requis par le CLI)
cd .output/server && npm install --omit=dev && cd ../..

# 3. Déployer Hosting + Functions
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
  npx firebase deploy --only functions,hosting \
  --project atelieranais-cb8dd --non-interactive
```

### Vérifications post-déploiement

```bash
# Tous les headers sécurité
curl -sI https://atelieranais-cb8dd.web.app/ | grep -iE "content-security|strict-transport|x-frame|x-content-type|referrer|permissions|cross-origin"

# Smoke test
curl -s -o /dev/null -w "/: %{http_code}\n" https://atelieranais-cb8dd.web.app/
curl -s -o /dev/null -w "/catalogue: %{http_code}\n" https://atelieranais-cb8dd.web.app/catalogue

# robots.txt (doit être 'Disallow: /admin' en prod, pas 'Disallow: /')
curl -s https://atelieranais-cb8dd.web.app/robots.txt
```

---

## Firestore rules & indexes

### Structure des collections

```
products/{slug}
  name, slug, description, price, stock, category, images[], featured, createdAt, updatedAt
config/brand
  name, slogan, colors, fonts, texts, social
messages/{autoId}
  name, email, content, createdAt, read
```

### Indexes composites

Déclarés dans `firebase/firestore.indexes.json` :
- `products (category ASC, createdAt DESC)` — pour le filtre catalogue par catégorie
- `products (featured ASC, createdAt DESC)` — pour la section "featured" de la home

---

## Dépannage

### Upload refusé avec `storage/unauthorized`
Le token ID du navigateur n'a pas encore le claim `admin`. **Déconnexion → reconnexion** sur `/admin/login`.

### Catalogue vide malgré des produits en base
Vérifier que les indexes Firestore sont `READY`:

```bash
node -e "const admin = require('firebase-admin'); admin.initializeApp({credential: admin.credential.cert(require('./service-account.json'))}); admin.firestore().collection('products').where('category', '==', 'bagues').orderBy('createdAt', 'desc').get().then(s => console.log('OK:', s.size)).catch(e => console.error('INDEX MISSING:', e.message));"
```

Si erreur `FAILED_PRECONDITION`, rejouer `node tools/deploy-rules.mjs`.

### Deploy Functions : "Permission denied enabling X API"
APIs manquantes — les activer dans la Console GCP (liens dans la section "Prérequis Firebase").

### Deploy Functions : "Missing permission cloudfunctions.functions.setIamPolicy"
Rôle IAM manquant sur le SA. Ajouter **Cloud Functions Admin** (`roles/cloudfunctions.admin`).

### `npm run dev` crash après avoir ajouté/retiré un module Nuxt
Purger le cache : `rm -rf .nuxt .output && npm run dev`.

---

## Roadmap / pistes phase 2

- **Paiement** : intégration Stripe sur `/panier`
- **Rétention messages** : Cloud Function nightly pour supprimer messages > N mois (SYM-GR-0014)
- **RGPD self-service** : endpoint pour suppression sur demande (SYM-GR-0008)
- **Optim images** : Firebase Extension "Resize Images" (srcset responsive)
- **Tests E2E** : Playwright sur parcours clés
- **Migration Node 22** : avant octobre 2026 (Node 20 deprecation)
- **Domaine custom** : ajouter dans Firebase Hosting + mettre à jour `storage.cors.json`

---

## Licence

Projet privé. Tous droits réservés.
