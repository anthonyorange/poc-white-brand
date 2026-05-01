# Site Bijoux de Création — Design Spec
*2026-05-02 — L'Atelier d'Anaïs (marque blanche configurable)*

---

## Contexte

Site e-commerce pour la vente et présentation de bijoux faits main. Architecture white-label : tout ce qui est spécifique à une marque vit dans `brand.config.ts`, permettant de reconfigurer le site pour un autre client sans toucher au code.

**Marque initiale :** L'Atelier d'Anaïs
**Catalogue au lancement :** ~20 pièces, 4 catégories (bagues, colliers, bracelets, boucles d'oreilles)
**Paiement :** Stripe intégré en phase 2

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Nuxt 3 + Vue 3 + TypeScript |
| State management | Pinia |
| Animations | GSAP + ScrollTrigger |
| Styles | Tailwind CSS v4 + CSS custom properties |
| Backend | Firebase (Firestore, Auth, Storage, Hosting) |
| Paiement (phase 2) | Stripe |
| Déploiement | Firebase Hosting + Cloud Functions (preset Nuxt Firebase SSR) |

---

## Architecture générale

### Boutique publique (SSR via Firebase Cloud Functions)

Les pages boutique sont rendues côté serveur (SSR) via le preset Nuxt Firebase, qui déploie un Cloud Function pour le rendu. Cela donne un SEO optimal avec des données toujours fraîches depuis Firestore, sans rebuild à chaque modification de produit.

- **Accueil** — storytelling au scroll + mosaïque produits featured
- **Catalogue** — grille filtrables par catégorie
- **Fiche produit** — galerie photos, description, prix, bouton panier
- **La Créatrice** — page about avec histoire et univers
- **Contact** — formulaire → écriture Firestore `/messages`
- **Panier** — client-side uniquement, prêt pour Stripe

### Back-office admin (SPA)

Accessible sur `/admin/*`, entièrement côté client, protégé par Firebase Auth.

- `/admin/login`
- `/admin/dashboard` — statistiques rapides
- `/admin/products` — liste et gestion des produits
- `/admin/products/new` et `/admin/products/[id]` — formulaire CRUD + upload photos
- `/admin/orders` — suivi commandes (phase 2 Stripe)
- `/admin/messages` — messages contact
- `/admin/settings` — édition live de brand.config

---

## Système white-label

### `brand.config.ts`

Fichier de configuration centrale exportant un objet typé :

```ts
export const brandConfig = {
  name: "L'Atelier d'Anaïs",
  slogan: "Bijoux d'auteure faits main",
  logo: "/logo.svg",
  colors: {
    primary: "#6b4c7a",
    secondary: "#a8c4d4",
    accent: "#e8c0d8",
    background: "#fdf8ff",
    surface: "#f5e8ff",
  },
  fonts: {
    heading: "Cormorant Garamond",
    body: "Inter",
  },
  social: {
    instagram: "",
    facebook: "",
  },
  texts: {
    heroTitle: "Des bijoux nés de mes mains",
    heroSubtitle: "Chaque pièce est unique, créée avec intention",
    aboutSummary: "...",
  },
}
```

### Override Firestore

La page `/admin/settings` permet de modifier la config sans redéployer. Les valeurs sont sauvegardées dans Firestore `/config/brand` et écrasent `brand.config.ts` au runtime via le composable `useBrand()`.

### Tokens CSS

`assets/css/tokens.css` est généré au build depuis `brand.config.ts` :

```css
:root {
  --color-primary: #6b4c7a;
  --color-secondary: #a8c4d4;
  --font-heading: "Cormorant Garamond";
  /* ... */
}
```

---

## Données Firestore

```
/products/{id}
  name: string
  slug: string
  description: string
  price: number
  stock: number
  category: "bagues" | "colliers" | "bracelets" | "boucles"
  images: string[]        // URLs Firebase Storage
  featured: boolean
  createdAt: Timestamp
  updatedAt: Timestamp

/orders/{id}              // prêt Stripe, vide phase 1
  items: OrderItem[]
  total: number
  status: "pending" | "paid" | "shipped"
  stripePaymentId: string
  createdAt: Timestamp

/messages/{id}
  name: string
  email: string
  content: string
  createdAt: Timestamp
  read: boolean

/config/brand             // override live de brand.config.ts
  [mêmes champs que brandConfig]
```

### Règles de sécurité

- `products` : lecture publique, écriture admin uniquement (custom claim `admin: true`)
- `orders` / `messages` : écriture publique (création), lecture admin uniquement
- `config/brand` : lecture publique, écriture admin uniquement
- Storage : upload admin uniquement, lecture publique

---

## Système d'animations

Trois couches combinées, toutes respectant `prefers-reduced-motion`.

| Couche | Technologie | Application |
|---|---|---|
| Blobs morphing | CSS keyframes + `border-radius` animé | Fonds de sections, arrière-plans |
| Parallax + révélation | GSAP ScrollTrigger | Produits au scroll, textes décalés |
| Transitions de pages | Nuxt `<Transition>` + GSAP | Navigation entre pages |
| Flottement | CSS `animation: float` | Cards bijoux au hover |
| Curseur personnalisé | Canvas léger | Orbe coloré suivant la souris |

### Composants d'animation

- `<BlobBackground>` — génère des formes morphing en fond de page
- `<ParallaxSection>` — wraps une section avec effet de profondeur au scroll
- `<FloatWrapper>` — applique l'animation de flottement sur son enfant
- `<RevealOnScroll>` — fade-in + slide au passage dans le viewport

---

## Structure des fichiers

```
atelier-anais/
├── brand.config.ts
├── nuxt.config.ts
├── tailwind.config.ts
│
├── assets/
│   └── css/
│       ├── tokens.css           // CSS vars depuis brand.config
│       └── animations.css       // keyframes globales (blobs, float)
│
├── components/
│   ├── ui/                      // Button, Badge, ImageGallery, Modal
│   ├── jewelry/                 // ProductCard, ProductGrid, CategoryFilter, HeroProduct
│   ├── animations/              // BlobBackground, FloatWrapper, ParallaxSection, RevealOnScroll
│   ├── layout/                  // AppHeader, AppFooter, AdminSidebar
│   └── admin/                   // ProductForm, ImageUploader, StatsCard, BrandEditor
│
├── composables/
│   ├── useProducts.ts           // CRUD Firestore produits
│   ├── useBrand.ts              // lecture brand.config + override Firestore
│   ├── useAuth.ts               // Firebase Auth (login, logout, currentUser)
│   └── useCart.ts               // panier localStorage, Stripe-ready
│
├── pages/
│   ├── index.vue
│   ├── catalogue/
│   │   ├── index.vue
│   │   └── [slug].vue
│   ├── creatrice.vue
│   ├── contact.vue
│   ├── panier.vue
│   └── admin/
│       ├── index.vue            // redirect → dashboard
│       ├── login.vue
│       ├── dashboard.vue
│       ├── products/
│       │   ├── index.vue
│       │   ├── new.vue
│       │   └── [id].vue
│       ├── orders.vue
│       ├── messages.vue
│       └── settings.vue
│
├── middleware/
│   └── auth.ts                  // guard sur /admin/*
│
├── plugins/
│   ├── firebase.client.ts       // init Firebase côté client
│   └── gsap.client.ts           // init GSAP + ScrollTrigger
│
└── firebase/
    ├── firestore.rules
    └── storage.rules
```

---

## Direction visuelle

**Style :** Poétique & Coloré — pastels doux (mauves, roses, bleus pâles, verts d'eau), dégradés subtils, typographie serif élégante pour les titres, sans-serif léger pour le corps.

**Page d'accueil :**
1. Section hero — blob morphing en fond, titre animé à l'entrée, CTA "Découvrir la collection"
2. Section storytelling — parallax, histoire de la créatrice, photo avec révélation au scroll
3. Mosaïque featured — grille asymétrique des produits mis en avant, apparition en cascade
4. Section collections — 4 catégories en cards avec hover animé
5. Footer — liens, réseaux sociaux, newsletter (phase 2)

---

## Phases de développement

**Phase 1 (ce spec)**
- Site complet boutique (SSG) + back-office admin
- Firebase Firestore + Auth + Storage + Hosting
- Système white-label + brand.config
- Toutes les animations

**Phase 2**
- Intégration Stripe (paiement, commandes)
- Gestion des commandes admin
- Emails transactionnels (Firebase Extensions ou Resend)
