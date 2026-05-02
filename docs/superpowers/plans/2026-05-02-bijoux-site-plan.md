# Site Bijoux de Création — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a white-label jewelry e-commerce site with Nuxt 3 SSR, Firebase, GSAP animations, and an admin back-office.

**Architecture:** Nuxt 3 with Firebase SSR preset — public pages rendered server-side via Cloud Functions for SEO, admin pages client-side only. All brand content lives in `brand.config.ts`, overridable live via Firestore `/config/brand`.

**Tech Stack:** Nuxt 3, Vue 3, TypeScript, Pinia, GSAP + ScrollTrigger, Tailwind CSS v3, Firebase (Firestore, Auth, Storage, Hosting + Cloud Functions v2), Vitest

---

## File Map

```
brand.config.ts                          ← white-label config centrale
nuxt.config.ts                           ← config Nuxt + Firebase preset
tailwind.config.ts                       ← tokens couleurs depuis brand.config
vitest.config.ts                         ← config tests
.env                                     ← clés Firebase (non commité)
.env.example                             ← template .env

assets/css/tokens.css                    ← CSS custom properties
assets/css/animations.css               ← keyframes blobs, float

plugins/firebase.client.ts              ← init Firebase
plugins/gsap.client.ts                  ← init GSAP + ScrollTrigger
plugins/brand-tokens.client.ts          ← injection CSS vars au runtime

composables/useFirebase.ts              ← getters instances Firebase
composables/useBrand.ts                 ← config + override Firestore
composables/useAuth.ts                  ← Firebase Auth
composables/useProducts.ts              ← CRUD produits Firestore
composables/useCart.ts                  ← panier localStorage

components/animations/BlobBackground.vue
components/animations/ParallaxSection.vue
components/animations/FloatWrapper.vue
components/animations/RevealOnScroll.vue
components/animations/CustomCursor.vue

components/layout/AppHeader.vue
components/layout/AppFooter.vue
components/layout/AdminSidebar.vue

components/ui/AppButton.vue
components/ui/ImageGallery.vue

components/jewelry/ProductCard.vue
components/jewelry/ProductGrid.vue
components/jewelry/CategoryFilter.vue

components/admin/ProductForm.vue
components/admin/ImageUploader.vue
components/admin/StatsCard.vue
components/admin/BrandEditor.vue

layouts/default.vue
layouts/admin.vue

middleware/auth.ts

pages/index.vue
pages/catalogue/index.vue
pages/catalogue/[slug].vue
pages/creatrice.vue
pages/contact.vue
pages/panier.vue
pages/admin/login.vue
pages/admin/dashboard.vue
pages/admin/products/index.vue
pages/admin/products/new.vue
pages/admin/products/[id].vue
pages/admin/messages.vue
pages/admin/settings.vue

firebase/firestore.rules
firebase/storage.rules
firebase.json
.firebaserc

tests/setup.ts
tests/composables/useCart.test.ts
tests/composables/useBrand.test.ts
```

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `nuxt.config.ts`, `vitest.config.ts`, `.env.example`, `tsconfig.json`

- [ ] **Step 1: Scaffold le projet Nuxt 3**

```bash
npx nuxi@latest init bijoux-site --packageManager npm
cd bijoux-site
```

- [ ] **Step 2: Installer les dépendances**

```bash
npm install firebase pinia @pinia/nuxt gsap @nuxtjs/tailwindcss
npm install -D vitest @vue/test-utils happy-dom @vitejs/plugin-vue
```

- [ ] **Step 3: Écrire `nuxt.config.ts`**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      firebase: {
        apiKey:            process.env.NUXT_PUBLIC_FIREBASE_API_KEY ?? '',
        authDomain:        process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
        projectId:         process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
        storageBucket:     process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
        messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
        appId:             process.env.NUXT_PUBLIC_FIREBASE_APP_ID ?? '',
        measurementId:     process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
      },
    },
  },
  nitro: {
    preset: 'firebase',
    firebase: { gen: 2 },
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },
})
```

- [ ] **Step 4: Écrire `.env.example`**

```
NUXT_PUBLIC_FIREBASE_API_KEY=
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NUXT_PUBLIC_FIREBASE_PROJECT_ID=
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NUXT_PUBLIC_FIREBASE_APP_ID=
NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

> Le projet Firebase est **atelieranais-cb8dd** — les valeurs réelles sont déjà dans `.env` (non commité).

Copier en `.env` et remplir avec les clés du projet Firebase.

- [ ] **Step 5: Écrire `vitest.config.ts`**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: { '~': resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 6: Écrire `tests/setup.ts`**

```typescript
// tests/setup.ts
import { vi } from 'vitest'
import { ref, computed } from 'vue'

vi.mock('#app', () => ({
  useState: vi.fn((_key: string, init?: () => unknown) => ref(init ? init() : undefined)),
  useNuxtApp: vi.fn(() => ({ $firebase: { db: {}, auth: {}, storage: {} } })),
  useRuntimeConfig: vi.fn(() => ({ public: { firebase: {} } })),
  navigateTo: vi.fn(),
}))
```

- [ ] **Step 7: Écrire `.gitignore`**

```
node_modules/
.output/
.nuxt/
dist/
.env
.firebaserc
*.local
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: scaffold Nuxt 3 project with Firebase SSR preset"
```

---

## Task 2: Brand config + CSS tokens

**Files:**
- Create: `brand.config.ts`, `assets/css/tokens.css`, `assets/css/animations.css`, `tailwind.config.ts`, `composables/useBrand.ts`, `tests/composables/useBrand.test.ts`

- [ ] **Step 1: Écrire le test useBrand (merge config)**

```typescript
// tests/composables/useBrand.test.ts
import { describe, it, expect } from 'vitest'
import { mergeBrandConfig, type BrandConfig } from '~/brand.config'

describe('mergeBrandConfig', () => {
  it('retourne la config par défaut si aucun override', () => {
    const result = mergeBrandConfig({})
    expect(result.name).toBe("L'Atelier d'Anaïs")
    expect(result.colors.primary).toBe('#6b4c7a')
  })

  it('écrase les champs fournis dans l'override', () => {
    const result = mergeBrandConfig({ name: 'Autre Marque' })
    expect(result.name).toBe('Autre Marque')
    expect(result.colors.primary).toBe('#6b4c7a')
  })

  it('fusionne les couleurs partielles', () => {
    const result = mergeBrandConfig({ colors: { primary: '#ff0000' } as BrandConfig['colors'] })
    expect(result.colors.primary).toBe('#ff0000')
    expect(result.colors.secondary).toBe('#a8c4d4')
  })
})
```

- [ ] **Step 2: Lancer le test, vérifier qu'il échoue**

```bash
npx vitest run tests/composables/useBrand.test.ts
```
Attendu : FAIL — `mergeBrandConfig` n'existe pas.

- [ ] **Step 3: Écrire `brand.config.ts`**

```typescript
// brand.config.ts
export interface BrandConfig {
  name: string
  slogan: string
  logo: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
  }
  fonts: { heading: string; body: string }
  social: { instagram: string; facebook: string }
  texts: { heroTitle: string; heroSubtitle: string; aboutSummary: string }
  adminEmail: string
}

export const defaultBrandConfig: BrandConfig = {
  name: "L'Atelier d'Anaïs",
  slogan: "Bijoux d'auteure faits main",
  logo: '/logo.svg',
  colors: {
    primary: '#6b4c7a',
    secondary: '#a8c4d4',
    accent: '#e8c0d8',
    background: '#fdf8ff',
    surface: '#f5e8ff',
  },
  fonts: { heading: 'Cormorant Garamond', body: 'Inter' },
  social: { instagram: '', facebook: '' },
  texts: {
    heroTitle: 'Des bijoux nés de mes mains',
    heroSubtitle: 'Chaque pièce est unique, créée avec intention',
    aboutSummary: "Anaïs crée des bijoux d'auteure depuis 2018, à partir de matériaux soigneusement sélectionnés.",
  },
  adminEmail: '',
}

export function mergeBrandConfig(override: Partial<BrandConfig>): BrandConfig {
  return {
    ...defaultBrandConfig,
    ...override,
    colors: { ...defaultBrandConfig.colors, ...override.colors },
    fonts: { ...defaultBrandConfig.fonts, ...override.fonts },
    social: { ...defaultBrandConfig.social, ...override.social },
    texts: { ...defaultBrandConfig.texts, ...override.texts },
  }
}
```

- [ ] **Step 4: Lancer le test, vérifier qu'il passe**

```bash
npx vitest run tests/composables/useBrand.test.ts
```
Attendu : PASS (3 tests).

- [ ] **Step 5: Écrire `composables/useBrand.ts`**

```typescript
// composables/useBrand.ts
import { doc, getDoc } from 'firebase/firestore'
import { defaultBrandConfig, mergeBrandConfig, type BrandConfig } from '~/brand.config'

export const useBrand = () => {
  const config = useState<BrandConfig>('brand', () => defaultBrandConfig)

  const loadFromFirestore = async () => {
    const { $firebase } = useNuxtApp()
    const snap = await getDoc(doc($firebase.db, 'config', 'brand'))
    if (snap.exists()) {
      config.value = mergeBrandConfig(snap.data() as Partial<BrandConfig>)
    }
  }

  const saveToFirestore = async (data: Partial<BrandConfig>) => {
    const { $firebase } = useNuxtApp()
    const { setDoc } = await import('firebase/firestore')
    await setDoc(doc($firebase.db, 'config', 'brand'), data, { merge: true })
    config.value = mergeBrandConfig(data)
  }

  return { config, loadFromFirestore, saveToFirestore }
}
```

- [ ] **Step 6: Écrire `assets/css/tokens.css`**

```css
/* assets/css/tokens.css */
/* Ces variables sont écrasées au runtime par plugins/brand-tokens.client.ts */
:root {
  --color-primary: #6b4c7a;
  --color-secondary: #a8c4d4;
  --color-accent: #e8c0d8;
  --color-background: #fdf8ff;
  --color-surface: #f5e8ff;
  --font-heading: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'Inter', system-ui, sans-serif;
}
```

- [ ] **Step 7: Écrire `assets/css/animations.css`**

```css
/* assets/css/animations.css */
@keyframes blob-morph {
  0%, 100% { border-radius: 60% 40% 55% 45% / 45% 55% 40% 60%; }
  25%       { border-radius: 45% 55% 40% 60% / 60% 40% 55% 45%; }
  50%       { border-radius: 55% 45% 60% 40% / 40% 60% 45% 55%; }
  75%       { border-radius: 40% 60% 45% 55% / 55% 45% 60% 40%; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes cursor-pulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50%       { transform: scale(1.3); opacity: 0.4; }
}

.animate-blob    { animation: blob-morph 8s ease-in-out infinite; }
.animate-float   { animation: float 4s ease-in-out infinite; }
.animate-fade-up { animation: fade-in-up 0.6s ease forwards; }

@media (prefers-reduced-motion: reduce) {
  .animate-blob, .animate-float, .animate-fade-up { animation: none; }
}
```

- [ ] **Step 8: Écrire `tailwind.config.ts`**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary:    'var(--color-primary)',
        secondary:  'var(--color-secondary)',
        accent:     'var(--color-accent)',
        background: 'var(--color-background)',
        surface:    'var(--color-surface)',
      },
      fontFamily: {
        heading: 'var(--font-heading)',
        body:    'var(--font-body)',
      },
    },
  },
} satisfies Config
```

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: brand config system with CSS tokens and useBrand composable"
```

---

## Task 3: Firebase plugin + composables

**Files:**
- Create: `plugins/firebase.client.ts`, `plugins/brand-tokens.client.ts`, `composables/useFirebase.ts`, `composables/useAuth.ts`, `composables/useCart.ts`, `tests/composables/useCart.test.ts`

- [ ] **Step 1: Écrire le test useCart**

```typescript
// tests/composables/useCart.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

// Mock Nuxt useState avec un vrai ref Vue
vi.mock('#app', () => ({
  useState: vi.fn((_k: string, init?: () => unknown) => ref(init ? init() : [])),
  useNuxtApp: vi.fn(),
}))

// Mock localStorage
const store: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
})
vi.stubGlobal('import', { meta: { client: false } })

const { useCart } = await import('~/composables/useCart')

describe('useCart', () => {
  let cart: ReturnType<typeof useCart>
  beforeEach(() => { cart = useCart() ; cart.clear() })

  it('ajoute un article', () => {
    cart.add({ productId: '1', name: 'Bague', price: 40, image: '/img.jpg' })
    expect(cart.items.value).toHaveLength(1)
    expect(cart.items.value[0].quantity).toBe(1)
  })

  it('incrémente la quantité si même produit', () => {
    cart.add({ productId: '1', name: 'Bague', price: 40, image: '/img.jpg' })
    cart.add({ productId: '1', name: 'Bague', price: 40, image: '/img.jpg' })
    expect(cart.items.value[0].quantity).toBe(2)
  })

  it('calcule le total', () => {
    cart.add({ productId: '1', name: 'Bague', price: 40, image: '/img.jpg' })
    cart.add({ productId: '2', name: 'Collier', price: 60, image: '/img2.jpg' })
    expect(cart.total.value).toBe(100)
  })

  it('supprime un article', () => {
    cart.add({ productId: '1', name: 'Bague', price: 40, image: '/img.jpg' })
    cart.remove('1')
    expect(cart.items.value).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Lancer le test, vérifier qu'il échoue**

```bash
npx vitest run tests/composables/useCart.test.ts
```
Attendu : FAIL.

- [ ] **Step 3: Écrire `composables/useCart.ts`**

```typescript
// composables/useCart.ts
export interface CartItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
}

export const useCart = () => {
  const items = useState<CartItem[]>('cart', () => [])

  const persist = () => {
    if (import.meta.client) {
      localStorage.setItem('cart', JSON.stringify(items.value))
    }
  }

  const add = (item: Omit<CartItem, 'quantity'>) => {
    const existing = items.value.find(i => i.productId === item.productId)
    if (existing) { existing.quantity++ } else { items.value.push({ ...item, quantity: 1 }) }
    persist()
  }

  const remove = (productId: string) => {
    items.value = items.value.filter(i => i.productId !== productId)
    persist()
  }

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) { remove(productId); return }
    const item = items.value.find(i => i.productId === productId)
    if (item) { item.quantity = qty; persist() }
  }

  const clear = () => { items.value = []; persist() }

  const total = computed(() => items.value.reduce((s, i) => s + i.price * i.quantity, 0))
  const count = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))

  return { items, add, remove, updateQuantity, clear, total, count }
}
```

- [ ] **Step 4: Lancer le test, vérifier qu'il passe**

```bash
npx vitest run tests/composables/useCart.test.ts
```
Attendu : PASS (4 tests).

- [ ] **Step 5: Écrire `plugins/firebase.client.ts`**

```typescript
// plugins/firebase.client.ts
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

export default defineNuxtPlugin(() => {
  const { public: { firebase: cfg } } = useRuntimeConfig()
  const app = getApps().length === 0 ? initializeApp(cfg) : getApps()[0]
  return {
    provide: {
      firebase: {
        app,
        db:      getFirestore(app),
        auth:    getAuth(app),
        storage: getStorage(app),
      },
    },
  }
})
```

- [ ] **Step 6: Écrire `composables/useFirebase.ts`**

```typescript
// composables/useFirebase.ts
import type { Firestore } from 'firebase/firestore'
import type { Auth } from 'firebase/auth'
import type { FirebaseStorage } from 'firebase/storage'

export const useFirestore = (): Firestore => useNuxtApp().$firebase.db as Firestore
export const useFirebaseAuth = (): Auth => useNuxtApp().$firebase.auth as Auth
export const useFirebaseStorage = (): FirebaseStorage => useNuxtApp().$firebase.storage as FirebaseStorage
```

- [ ] **Step 7: Écrire `composables/useAuth.ts`**

```typescript
// composables/useAuth.ts
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'

export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const loading = useState<boolean>('auth-loading', () => true)

  const init = () => {
    const auth = useFirebaseAuth()
    onAuthStateChanged(auth, (u) => {
      user.value = u
      loading.value = false
    })
  }

  const login = async (email: string, password: string) => {
    const auth = useFirebaseAuth()
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    const auth = useFirebaseAuth()
    await signOut(auth)
    await navigateTo('/admin/login')
  }

  const isAdmin = computed(() => !!user.value)

  return { user, loading, isAdmin, init, login, logout }
}
```

- [ ] **Step 8: Écrire `plugins/brand-tokens.client.ts`**

```typescript
// plugins/brand-tokens.client.ts
export default defineNuxtPlugin(async () => {
  const { config, loadFromFirestore } = useBrand()
  await loadFromFirestore()

  const root = document.documentElement
  const c = config.value
  root.style.setProperty('--color-primary',    c.colors.primary)
  root.style.setProperty('--color-secondary',  c.colors.secondary)
  root.style.setProperty('--color-accent',     c.colors.accent)
  root.style.setProperty('--color-background', c.colors.background)
  root.style.setProperty('--color-surface',    c.colors.surface)
  root.style.setProperty('--font-heading', `'${c.fonts.heading}', Georgia, serif`)
  root.style.setProperty('--font-body',    `'${c.fonts.body}', system-ui, sans-serif`)
})
```

- [ ] **Step 9: Ajouter les imports CSS dans `nuxt.config.ts`**

Ajouter dans `nuxt.config.ts` :
```typescript
css: ['~/assets/css/tokens.css', '~/assets/css/animations.css'],
```

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: Firebase plugin, useAuth, useCart, brand-tokens plugin"
```

---

## Task 4: GSAP + composants d'animation

**Files:**
- Create: `plugins/gsap.client.ts`, `components/animations/BlobBackground.vue`, `components/animations/ParallaxSection.vue`, `components/animations/FloatWrapper.vue`, `components/animations/RevealOnScroll.vue`, `components/animations/CustomCursor.vue`

- [ ] **Step 1: Écrire `plugins/gsap.client.ts`**

```typescript
// plugins/gsap.client.ts
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

export default defineNuxtPlugin(() => {
  gsap.registerPlugin(ScrollTrigger)
  return { provide: { gsap, ScrollTrigger } }
})
```

- [ ] **Step 2: Écrire `components/animations/BlobBackground.vue`**

```vue
<!-- components/animations/BlobBackground.vue -->
<template>
  <div class="blob-container" aria-hidden="true">
    <div
      v-for="blob in blobs"
      :key="blob.id"
      class="blob animate-blob"
      :style="blob.style"
    />
  </div>
</template>

<script setup lang="ts">
const blobs = [
  {
    id: 1,
    style: {
      width: '400px', height: '400px',
      background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
      top: '-100px', left: '-100px',
      animationDelay: '0s', animationDuration: '10s',
    },
  },
  {
    id: 2,
    style: {
      width: '300px', height: '300px',
      background: 'radial-gradient(circle, var(--color-secondary) 0%, transparent 70%)',
      bottom: '-80px', right: '-80px',
      animationDelay: '-4s', animationDuration: '12s',
    },
  },
  {
    id: 3,
    style: {
      width: '250px', height: '250px',
      background: 'radial-gradient(circle, var(--color-surface) 0%, transparent 70%)',
      top: '40%', right: '10%',
      animationDelay: '-7s', animationDuration: '9s',
    },
  },
]
</script>

<style scoped>
.blob-container {
  position: absolute; inset: 0;
  overflow: hidden; pointer-events: none; z-index: 0;
}
.blob {
  position: absolute; opacity: 0.6;
  filter: blur(40px);
}
</style>
```

- [ ] **Step 3: Écrire `components/animations/RevealOnScroll.vue`**

```vue
<!-- components/animations/RevealOnScroll.vue -->
<template>
  <div ref="el" class="reveal-wrapper">
    <slot />
  </div>
</template>

<script setup lang="ts">
const el = ref<HTMLElement>()
const { $gsap, $ScrollTrigger } = useNuxtApp() as any

onMounted(() => {
  if (!el.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  $gsap.from(el.value, {
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: el.value,
      start: 'top 85%',
      once: true,
    },
  })
})

onUnmounted(() => $ScrollTrigger?.getAll().forEach((t: any) => t.kill()))
</script>
```

- [ ] **Step 4: Écrire `components/animations/ParallaxSection.vue`**

```vue
<!-- components/animations/ParallaxSection.vue -->
<template>
  <div ref="el" class="parallax-wrapper">
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ speed?: number }>()
const el = ref<HTMLElement>()
const { $gsap, $ScrollTrigger } = useNuxtApp() as any

onMounted(() => {
  if (!el.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  $gsap.to(el.value, {
    yPercent: (props.speed ?? -15),
    ease: 'none',
    scrollTrigger: {
      trigger: el.value,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  })
})

onUnmounted(() => $ScrollTrigger?.getAll().forEach((t: any) => t.kill()))
</script>

<style scoped>
.parallax-wrapper { will-change: transform; }
</style>
```

- [ ] **Step 5: Écrire `components/animations/FloatWrapper.vue`**

```vue
<!-- components/animations/FloatWrapper.vue -->
<template>
  <div class="animate-float">
    <slot />
  </div>
</template>
```

- [ ] **Step 6: Écrire `components/animations/CustomCursor.vue`**

```vue
<!-- components/animations/CustomCursor.vue -->
<template>
  <div
    ref="cursor"
    class="custom-cursor"
    :style="{ left: `${x}px`, top: `${y}px` }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
const x = ref(-100)
const y = ref(-100)
const cursor = ref<HTMLElement>()

onMounted(() => {
  window.addEventListener('mousemove', (e) => {
    x.value = e.clientX
    y.value = e.clientY
  })
})
</script>

<style scoped>
.custom-cursor {
  position: fixed;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--color-accent), var(--color-primary));
  opacity: 0.5;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 9999;
  transition: transform 0.1s ease;
  mix-blend-mode: multiply;
  animation: cursor-pulse 2s ease-in-out infinite;
}

@media (pointer: coarse) { .custom-cursor { display: none; } }
</style>
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: GSAP plugin and animation components (blob, parallax, reveal, cursor)"
```

---

## Task 5: Layouts + AppHeader + AppFooter

**Files:**
- Create: `layouts/default.vue`, `layouts/admin.vue`, `components/layout/AppHeader.vue`, `components/layout/AppFooter.vue`, `components/layout/AdminSidebar.vue`, `app.vue`

- [ ] **Step 1: Écrire `app.vue`**

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

- [ ] **Step 2: Écrire `components/layout/AppHeader.vue`**

```vue
<!-- components/layout/AppHeader.vue -->
<template>
  <header class="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-background/80 border-b border-accent/20">
    <NuxtLink to="/" class="font-heading text-xl text-primary tracking-widest">
      {{ brand.config.value.name }}
    </NuxtLink>

    <nav class="hidden md:flex gap-8 font-body text-sm text-primary/70">
      <NuxtLink to="/catalogue" class="hover:text-primary transition-colors">Collection</NuxtLink>
      <NuxtLink to="/creatrice" class="hover:text-primary transition-colors">La Créatrice</NuxtLink>
      <NuxtLink to="/contact" class="hover:text-primary transition-colors">Contact</NuxtLink>
    </nav>

    <NuxtLink to="/panier" class="relative">
      <span class="text-primary text-sm font-body">Panier</span>
      <span
        v-if="cart.count.value > 0"
        class="absolute -top-2 -right-4 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
      >{{ cart.count.value }}</span>
    </NuxtLink>
  </header>
</template>

<script setup lang="ts">
const brand = useBrand()
const cart = useCart()
</script>
```

- [ ] **Step 3: Écrire `components/layout/AppFooter.vue`**

```vue
<!-- components/layout/AppFooter.vue -->
<template>
  <footer class="mt-24 py-12 px-6 border-t border-accent/20 bg-surface/50">
    <div class="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <p class="font-heading text-lg text-primary">{{ brand.config.value.name }}</p>
      <p class="font-body text-sm text-primary/50 italic">{{ brand.config.value.slogan }}</p>
      <div class="flex gap-4 text-sm font-body text-primary/60">
        <a v-if="brand.config.value.social.instagram" :href="`https://instagram.com/${brand.config.value.social.instagram}`" target="_blank" rel="noopener" class="hover:text-primary transition-colors">Instagram</a>
        <a v-if="brand.config.value.social.facebook" :href="`https://facebook.com/${brand.config.value.social.facebook}`" target="_blank" rel="noopener" class="hover:text-primary transition-colors">Facebook</a>
      </div>
    </div>
    <p class="text-center font-body text-xs text-primary/30 mt-8">© {{ new Date().getFullYear() }} {{ brand.config.value.name }}</p>
  </footer>
</template>

<script setup lang="ts">
const brand = useBrand()
</script>
```

- [ ] **Step 4: Écrire `layouts/default.vue`**

```vue
<!-- layouts/default.vue -->
<template>
  <div class="min-h-screen bg-background font-body">
    <CustomCursor />
    <AppHeader />
    <main class="pt-20">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<style>
* { box-sizing: border-box; }
body { background: var(--color-background); }
.page-enter-active, .page-leave-active { transition: opacity 0.4s ease, transform 0.4s ease; }
.page-enter-from { opacity: 0; transform: translateY(12px); }
.page-leave-to   { opacity: 0; transform: translateY(-12px); }
</style>
```

- [ ] **Step 5: Écrire `components/layout/AdminSidebar.vue`**

```vue
<!-- components/layout/AdminSidebar.vue -->
<template>
  <aside class="w-56 min-h-screen bg-surface border-r border-accent/20 flex flex-col py-8 px-4 gap-2">
    <p class="font-heading text-primary text-lg mb-6 px-2">Admin</p>
    <NuxtLink v-for="link in links" :key="link.to" :to="link.to"
      class="px-3 py-2 rounded-lg font-body text-sm text-primary/70 hover:bg-accent/20 hover:text-primary transition-colors"
      active-class="bg-accent/30 text-primary font-medium"
    >{{ link.label }}</NuxtLink>
    <div class="flex-1" />
    <button @click="auth.logout()" class="px-3 py-2 text-sm font-body text-primary/40 hover:text-primary transition-colors text-left">
      Déconnexion
    </button>
  </aside>
</template>

<script setup lang="ts">
const auth = useAuth()
const links = [
  { to: '/admin/dashboard',  label: 'Dashboard' },
  { to: '/admin/products',   label: 'Produits' },
  { to: '/admin/messages',   label: 'Messages' },
  { to: '/admin/settings',   label: 'Paramètres' },
]
</script>
```

- [ ] **Step 6: Écrire `layouts/admin.vue`**

```vue
<!-- layouts/admin.vue -->
<template>
  <div class="flex min-h-screen bg-background font-body">
    <AdminSidebar />
    <main class="flex-1 p-8">
      <slot />
    </main>
  </div>
</template>
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: layouts, AppHeader, AppFooter, AdminSidebar"
```

---

## Task 6: useProducts + composants produits

**Files:**
- Create: `composables/useProducts.ts`, `components/jewelry/ProductCard.vue`, `components/jewelry/ProductGrid.vue`, `components/jewelry/CategoryFilter.vue`, `components/ui/AppButton.vue`

- [ ] **Step 1: Écrire `composables/useProducts.ts`**

```typescript
// composables/useProducts.ts
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy,
} from 'firebase/firestore'

export type ProductCategory = 'bagues' | 'colliers' | 'bracelets' | 'boucles'

export interface Product {
  id?: string
  name: string
  slug: string
  description: string
  price: number
  stock: number
  category: ProductCategory
  images: string[]
  featured: boolean
  createdAt?: Date
  updatedAt?: Date
}

export const useProducts = () => {
  const db = useFirestore()

  const getAll = async (): Promise<Product[]> => {
    const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))
  }

  const getByCategory = async (cat: ProductCategory): Promise<Product[]> => {
    const snap = await getDocs(query(collection(db, 'products'), where('category', '==', cat), orderBy('createdAt', 'desc')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))
  }

  const getBySlug = async (slug: string): Promise<Product | null> => {
    const snap = await getDocs(query(collection(db, 'products'), where('slug', '==', slug)))
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as Product
  }

  const getFeatured = async (): Promise<Product[]> => {
    const snap = await getDocs(query(collection(db, 'products'), where('featured', '==', true)))
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))
  }

  const create = async (product: Omit<Product, 'id'>): Promise<string> => {
    const ref = await addDoc(collection(db, 'products'), { ...product, createdAt: new Date(), updatedAt: new Date() })
    return ref.id
  }

  const update = async (id: string, data: Partial<Product>): Promise<void> => {
    await updateDoc(doc(db, 'products', id), { ...data, updatedAt: new Date() })
  }

  const remove = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'products', id))
  }

  return { getAll, getByCategory, getBySlug, getFeatured, create, update, remove }
}
```

- [ ] **Step 2: Écrire `components/ui/AppButton.vue`**

```vue
<!-- components/ui/AppButton.vue -->
<template>
  <button
    :class="[
      'inline-flex items-center justify-center gap-2 font-body text-sm transition-all duration-200 disabled:opacity-50',
      variants[variant],
    ]"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{ variant?: 'primary' | 'ghost' | 'outline' }>()

const variants = {
  primary: 'bg-primary text-white px-6 py-3 rounded-full hover:opacity-90 shadow-md shadow-primary/20',
  ghost:   'text-primary/70 px-4 py-2 hover:text-primary',
  outline: 'border border-primary text-primary px-6 py-3 rounded-full hover:bg-primary hover:text-white',
}
</script>
```

- [ ] **Step 3: Écrire `components/jewelry/ProductCard.vue`**

```vue
<!-- components/jewelry/ProductCard.vue -->
<template>
  <NuxtLink :to="`/catalogue/${product.slug}`" class="group block">
    <FloatWrapper>
      <div class="relative overflow-hidden rounded-2xl bg-surface aspect-square mb-3">
        <img
          v-if="product.images[0]"
          :src="product.images[0]"
          :alt="product.name"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-primary/20 text-4xl">◇</div>
        <span v-if="product.stock === 0"
          class="absolute top-3 right-3 bg-white/90 text-primary/60 text-xs px-2 py-1 rounded-full font-body"
        >Épuisé</span>
      </div>
    </FloatWrapper>
    <h3 class="font-heading text-primary text-lg leading-tight">{{ product.name }}</h3>
    <p class="font-body text-primary/60 text-sm mt-1">{{ product.price }} €</p>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
defineProps<{ product: Product }>()
</script>
```

- [ ] **Step 4: Écrire `components/jewelry/CategoryFilter.vue`**

```vue
<!-- components/jewelry/CategoryFilter.vue -->
<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="cat in categories"
      :key="cat.value"
      @click="$emit('update:modelValue', cat.value)"
      :class="[
        'px-4 py-1.5 rounded-full text-sm font-body transition-all',
        modelValue === cat.value
          ? 'bg-primary text-white'
          : 'border border-primary/30 text-primary/60 hover:border-primary hover:text-primary',
      ]"
    >{{ cat.label }}</button>
  </div>
</template>

<script setup lang="ts">
import type { ProductCategory } from '~/composables/useProducts'

defineProps<{ modelValue: ProductCategory | 'all' }>()
defineEmits<{ 'update:modelValue': [val: ProductCategory | 'all'] }>()

const categories = [
  { value: 'all',       label: 'Tout voir' },
  { value: 'bagues',    label: 'Bagues' },
  { value: 'colliers',  label: 'Colliers' },
  { value: 'bracelets', label: 'Bracelets' },
  { value: 'boucles',   label: 'Boucles d\'oreilles' },
]
</script>
```

- [ ] **Step 5: Écrire `components/jewelry/ProductGrid.vue`**

```vue
<!-- components/jewelry/ProductGrid.vue -->
<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    <RevealOnScroll v-for="product in products" :key="product.id">
      <ProductCard :product="product" />
    </RevealOnScroll>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
defineProps<{ products: Product[] }>()
</script>
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: useProducts composable and jewelry components"
```

---

## Task 7: Page d'accueil

**Files:**
- Create: `pages/index.vue`

- [ ] **Step 1: Écrire `pages/index.vue`**

```vue
<!-- pages/index.vue -->
<template>
  <div>
    <!-- HERO -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden">
      <BlobBackground />
      <div class="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <RevealOnScroll>
          <p class="font-body text-sm tracking-widest text-primary/50 uppercase mb-4">{{ brand.config.value.slogan }}</p>
          <h1 class="font-heading text-5xl md:text-7xl text-primary leading-tight mb-6">
            {{ brand.config.value.texts.heroTitle }}
          </h1>
          <p class="font-body text-lg text-primary/60 mb-10">{{ brand.config.value.texts.heroSubtitle }}</p>
          <AppButton variant="primary" @click="navigateTo('/catalogue')">Découvrir la collection</AppButton>
        </RevealOnScroll>
      </div>
    </section>

    <!-- STORYTELLING -->
    <section class="py-24 px-6 max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
      <ParallaxSection :speed="-10">
        <div class="aspect-square rounded-3xl bg-surface overflow-hidden">
          <img v-if="heroImage" :src="heroImage" alt="La créatrice" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full bg-gradient-to-br from-accent/40 to-secondary/30" />
        </div>
      </ParallaxSection>
      <RevealOnScroll>
        <p class="font-body text-xs tracking-widest text-primary/40 uppercase mb-3">La créatrice</p>
        <h2 class="font-heading text-4xl text-primary mb-6">Une histoire de mains et de matières</h2>
        <p class="font-body text-primary/60 leading-relaxed mb-8">{{ brand.config.value.texts.aboutSummary }}</p>
        <AppButton variant="outline" @click="navigateTo('/creatrice')">En savoir plus</AppButton>
      </RevealOnScroll>
    </section>

    <!-- MOSAÏQUE PRODUITS FEATURED -->
    <section class="py-16 px-6 max-w-5xl mx-auto">
      <RevealOnScroll>
        <h2 class="font-heading text-3xl text-primary text-center mb-12">Pièces du moment</h2>
      </RevealOnScroll>
      <div v-if="featured.length" class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <RevealOnScroll
          v-for="(product, i) in featured"
          :key="product.id"
          :class="{ 'md:col-span-2 md:row-span-2': i === 0 }"
        >
          <ProductCard :product="product" class="h-full" />
        </RevealOnScroll>
      </div>
      <div class="text-center mt-12">
        <AppButton variant="ghost" @click="navigateTo('/catalogue')">Voir toute la collection →</AppButton>
      </div>
    </section>

    <!-- CATÉGORIES -->
    <section class="py-16 px-6 bg-surface/50">
      <div class="max-w-5xl mx-auto">
        <RevealOnScroll>
          <h2 class="font-heading text-3xl text-primary text-center mb-12">Collections</h2>
        </RevealOnScroll>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RevealOnScroll v-for="cat in categories" :key="cat.slug">
            <NuxtLink :to="`/catalogue?category=${cat.slug}`"
              class="group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br cursor-pointer"
              :class="cat.gradient"
            >
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <span class="text-3xl">{{ cat.icon }}</span>
                <span class="font-heading text-lg text-primary">{{ cat.name }}</span>
              </div>
            </NuxtLink>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const brand = useBrand()
const { getFeatured } = useProducts()
const featured = ref<Awaited<ReturnType<typeof getFeatured>>>([])
const heroImage = ref('')

const categories = [
  { name: 'Bagues',    slug: 'bagues',    icon: '💍', gradient: 'from-accent/30 to-surface' },
  { name: 'Colliers',  slug: 'colliers',  icon: '📿', gradient: 'from-secondary/30 to-surface' },
  { name: 'Bracelets', slug: 'bracelets', icon: '✨', gradient: 'from-primary/10 to-surface' },
  { name: "Boucles",   slug: 'boucles',   icon: '⭐', gradient: 'from-accent/20 to-secondary/20' },
]

onMounted(async () => {
  featured.value = await getFeatured()
})
</script>
```

- [ ] **Step 2: Vérifier visuellement**

```bash
npm run dev
```
Ouvrir http://localhost:3000 — vérifier : hero avec blobs, section storytelling, mosaïque produits (vide si Firebase pas encore peuplé), 4 catégories.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: homepage with hero, storytelling, featured mosaic, categories"
```

---

## Task 8: Catalogue + fiche produit

**Files:**
- Create: `pages/catalogue/index.vue`, `pages/catalogue/[slug].vue`, `components/ui/ImageGallery.vue`

- [ ] **Step 1: Écrire `components/ui/ImageGallery.vue`**

```vue
<!-- components/ui/ImageGallery.vue -->
<template>
  <div class="flex flex-col gap-3">
    <div class="aspect-square rounded-2xl overflow-hidden bg-surface">
      <img :src="images[active]" :alt="alt" class="w-full h-full object-cover" />
    </div>
    <div v-if="images.length > 1" class="flex gap-2">
      <button
        v-for="(img, i) in images" :key="i"
        @click="active = i"
        :class="['w-16 h-16 rounded-lg overflow-hidden border-2 transition-all', active === i ? 'border-primary' : 'border-transparent opacity-60']"
      >
        <img :src="img" :alt="`${alt} ${i + 1}`" class="w-full h-full object-cover" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ images: string[]; alt: string }>()
const active = ref(0)
</script>
```

- [ ] **Step 2: Écrire `pages/catalogue/index.vue`**

```vue
<!-- pages/catalogue/index.vue -->
<template>
  <div class="max-w-5xl mx-auto px-6 py-12">
    <RevealOnScroll>
      <h1 class="font-heading text-5xl text-primary text-center mb-4">Collection</h1>
      <p class="font-body text-primary/50 text-center mb-10">{{ products.length }} pièce{{ products.length > 1 ? 's' : '' }}</p>
    </RevealOnScroll>

    <div class="flex justify-center mb-10">
      <CategoryFilter v-model="activeCategory" />
    </div>

    <ProductGrid v-if="filtered.length" :products="filtered" />
    <p v-else class="text-center font-body text-primary/40 py-20">Aucun bijou dans cette catégorie pour le moment.</p>
  </div>
</template>

<script setup lang="ts">
import type { ProductCategory } from '~/composables/useProducts'

const { getAll, getByCategory } = useProducts()
const route = useRoute()

const activeCategory = ref<ProductCategory | 'all'>(
  (route.query.category as ProductCategory) ?? 'all'
)
const products = ref<Awaited<ReturnType<typeof getAll>>>([])

const filtered = computed(() =>
  activeCategory.value === 'all'
    ? products.value
    : products.value.filter(p => p.category === activeCategory.value)
)

onMounted(async () => { products.value = await getAll() })
watch(activeCategory, (cat) => {
  useRouter().replace({ query: cat !== 'all' ? { category: cat } : {} })
})

useSeoMeta({
  title: 'Collection — ' + useBrand().config.value.name,
  description: 'Découvrez tous les bijoux faits main.',
})
</script>
```

- [ ] **Step 3: Écrire `pages/catalogue/[slug].vue`**

```vue
<!-- pages/catalogue/[slug].vue -->
<template>
  <div v-if="product" class="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-16 items-start">
    <ImageGallery :images="product.images" :alt="product.name" />

    <div class="sticky top-24">
      <p class="font-body text-xs tracking-widest text-primary/40 uppercase mb-2">{{ categoryLabel }}</p>
      <h1 class="font-heading text-4xl text-primary mb-4">{{ product.name }}</h1>
      <p class="font-heading text-2xl text-primary mb-6">{{ product.price }} €</p>
      <p class="font-body text-primary/60 leading-relaxed mb-8">{{ product.description }}</p>

      <div v-if="product.stock > 0">
        <AppButton variant="primary" class="w-full" @click="addToCart">Ajouter au panier</AppButton>
        <p class="text-center font-body text-xs text-primary/40 mt-3">{{ product.stock }} en stock</p>
      </div>
      <p v-else class="text-center font-body text-primary/40 py-4 border border-primary/20 rounded-full">Épuisé</p>
    </div>
  </div>
  <div v-else class="text-center py-32 font-body text-primary/40">Produit introuvable.</div>
</template>

<script setup lang="ts">
const route = useRoute()
const { getBySlug } = useProducts()
const { add } = useCart()
const brand = useBrand()

const product = await getBySlug(route.params.slug as string)

const categoryLabel: Record<string, string> = {
  bagues: 'Bagues', colliers: 'Colliers', bracelets: 'Bracelets', boucles: "Boucles d'oreilles",
}

const addToCart = () => {
  if (!product) return
  add({ productId: product.id!, name: product.name, price: product.price, image: product.images[0] ?? '' })
}

if (product) {
  useSeoMeta({
    title: `${product.name} — ${brand.config.value.name}`,
    description: product.description,
    ogImage: product.images[0],
  })
}
</script>
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: catalogue and product detail pages with ImageGallery"
```

---

## Task 9: Pages secondaires (créatrice, contact, panier)

**Files:**
- Create: `pages/creatrice.vue`, `pages/contact.vue`, `pages/panier.vue`

- [ ] **Step 1: Écrire `pages/creatrice.vue`**

```vue
<!-- pages/creatrice.vue -->
<template>
  <div>
    <section class="relative py-32 px-6 overflow-hidden">
      <BlobBackground />
      <div class="relative z-10 max-w-2xl mx-auto text-center">
        <RevealOnScroll>
          <h1 class="font-heading text-6xl text-primary mb-6">La Créatrice</h1>
          <p class="font-body text-primary/60 leading-relaxed text-lg">{{ brand.config.value.texts.aboutSummary }}</p>
        </RevealOnScroll>
      </div>
    </section>

    <section class="py-24 px-6 max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
      <RevealOnScroll>
        <div class="aspect-square rounded-3xl bg-gradient-to-br from-accent/40 to-secondary/30" />
      </RevealOnScroll>
      <RevealOnScroll>
        <h2 class="font-heading text-3xl text-primary mb-6">Mon atelier, mon univers</h2>
        <p class="font-body text-primary/60 leading-relaxed">
          Chaque bijou naît d'une intention, d'une matière qui me parle, d'un geste répété jusqu'à
          la perfection. Je travaille avec des métaux précieux et des pierres naturelles,
          en petites séries ou en pièces uniques.
        </p>
      </RevealOnScroll>
    </section>
  </div>
</template>

<script setup lang="ts">
const brand = useBrand()
useSeoMeta({ title: `La Créatrice — ${brand.config.value.name}` })
</script>
```

- [ ] **Step 2: Écrire `pages/contact.vue`**

```vue
<!-- pages/contact.vue -->
<template>
  <div class="max-w-lg mx-auto px-6 py-24">
    <RevealOnScroll>
      <h1 class="font-heading text-5xl text-primary text-center mb-4">Contact</h1>
      <p class="font-body text-primary/50 text-center mb-12">Une question, une commande sur mesure ?</p>
    </RevealOnScroll>

    <form v-if="!sent" @submit.prevent="submit" class="flex flex-col gap-5">
      <input v-model="form.name" required placeholder="Votre nom"
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary transition-colors" />
      <input v-model="form.email" type="email" required placeholder="Votre email"
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary transition-colors" />
      <textarea v-model="form.content" required placeholder="Votre message" rows="5"
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary transition-colors resize-none" />
      <AppButton type="submit" variant="primary" :disabled="loading">
        {{ loading ? 'Envoi...' : 'Envoyer' }}
      </AppButton>
    </form>

    <div v-else class="text-center py-12">
      <p class="font-heading text-2xl text-primary mb-3">Message envoyé ✨</p>
      <p class="font-body text-primary/50">Je vous réponds très vite.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { addDoc, collection } from 'firebase/firestore'

const db = useFirestore()
const form = reactive({ name: '', email: '', content: '' })
const sent = ref(false)
const loading = ref(false)

const submit = async () => {
  loading.value = true
  await addDoc(collection(db, 'messages'), { ...form, createdAt: new Date(), read: false })
  sent.value = true
  loading.value = false
}
</script>
```

- [ ] **Step 3: Écrire `pages/panier.vue`**

```vue
<!-- pages/panier.vue -->
<template>
  <div class="max-w-2xl mx-auto px-6 py-24">
    <h1 class="font-heading text-5xl text-primary mb-12 text-center">Panier</h1>

    <div v-if="cart.items.value.length === 0" class="text-center py-20">
      <p class="font-body text-primary/40 mb-6">Votre panier est vide.</p>
      <AppButton variant="outline" @click="navigateTo('/catalogue')">Voir la collection</AppButton>
    </div>

    <div v-else>
      <div v-for="item in cart.items.value" :key="item.productId"
        class="flex items-center gap-4 py-4 border-b border-accent/20"
      >
        <img :src="item.image" :alt="item.name" class="w-16 h-16 rounded-xl object-cover bg-surface" />
        <div class="flex-1">
          <p class="font-body text-primary font-medium">{{ item.name }}</p>
          <p class="font-body text-primary/50 text-sm">{{ item.price }} €</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="cart.updateQuantity(item.productId, item.quantity - 1)" class="w-7 h-7 rounded-full border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">−</button>
          <span class="font-body text-sm w-4 text-center">{{ item.quantity }}</span>
          <button @click="cart.updateQuantity(item.productId, item.quantity + 1)" class="w-7 h-7 rounded-full border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">+</button>
        </div>
        <button @click="cart.remove(item.productId)" class="text-primary/30 hover:text-primary/70 text-lg ml-2">×</button>
      </div>

      <div class="flex justify-between items-center mt-8 pt-4">
        <p class="font-body text-primary/50">Total</p>
        <p class="font-heading text-2xl text-primary">{{ cart.total.value }} €</p>
      </div>

      <AppButton variant="primary" class="w-full mt-6" disabled>
        Passer commande (bientôt disponible)
      </AppButton>
      <p class="text-center font-body text-xs text-primary/30 mt-3">Paiement Stripe disponible prochainement</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const cart = useCart()
</script>
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: creatrice, contact, and cart pages"
```

---

## Task 10: Admin auth + middleware

**Files:**
- Create: `middleware/auth.ts`, `pages/admin/login.vue`, mettre à jour `composables/useAuth.ts` pour init dans `app.vue`

- [ ] **Step 1: Écrire `middleware/auth.ts`**

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/admin')) return
  if (to.path === '/admin/login') return

  const { user, loading } = useAuth()

  if (import.meta.client && !loading.value && !user.value) {
    return navigateTo('/admin/login')
  }
})
```

- [ ] **Step 2: Mettre à jour `app.vue` pour init auth**

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { init } = useAuth()
onMounted(() => init())
</script>
```

- [ ] **Step 3: Écrire `pages/admin/login.vue`**

```vue
<!-- pages/admin/login.vue -->
<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-6">
    <div class="w-full max-w-sm">
      <div class="text-center mb-10">
        <p class="font-heading text-3xl text-primary">Administration</p>
        <p class="font-body text-sm text-primary/40 mt-2">{{ brand.config.value.name }}</p>
      </div>
      <form @submit.prevent="submit" class="flex flex-col gap-4">
        <input v-model="email" type="email" required placeholder="Email"
          class="border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary transition-colors" />
        <input v-model="password" type="password" required placeholder="Mot de passe"
          class="border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary transition-colors" />
        <p v-if="error" class="text-red-400 text-xs font-body text-center">{{ error }}</p>
        <AppButton type="submit" variant="primary" :disabled="loading">
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </AppButton>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const brand = useBrand()
const { login, user } = useAuth()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

watch(user, (u) => { if (u) navigateTo('/admin/dashboard') })

const submit = async () => {
  loading.value = true
  error.value = ''
  try {
    await login(email.value, password.value)
    await navigateTo('/admin/dashboard')
  } catch {
    error.value = 'Email ou mot de passe incorrect.'
  } finally {
    loading.value = false
  }
}
</script>
```

- [ ] **Step 4: Écrire `pages/admin/index.vue`** (redirect)

```vue
<!-- pages/admin/index.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
await navigateTo('/admin/dashboard')
</script>
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: admin auth middleware and login page"
```

---

## Task 11: Admin — gestion produits

**Files:**
- Create: `components/admin/ImageUploader.vue`, `components/admin/ProductForm.vue`, `pages/admin/products/index.vue`, `pages/admin/products/new.vue`, `pages/admin/products/[id].vue`

- [ ] **Step 1: Écrire `components/admin/ImageUploader.vue`**

```vue
<!-- components/admin/ImageUploader.vue -->
<template>
  <div class="space-y-3">
    <div
      class="border-2 border-dashed border-accent/40 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
      @click="fileInput?.click()"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <p class="font-body text-sm text-primary/40">Glisser-déposer ou cliquer pour uploader</p>
      <p class="font-body text-xs text-primary/30 mt-1">JPG, PNG, WebP — max 5MB</p>
    </div>
    <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFiles" />

    <div v-if="uploading" class="text-xs font-body text-primary/50 text-center">Upload en cours...</div>

    <div v-if="modelValue.length" class="flex flex-wrap gap-2">
      <div v-for="(url, i) in modelValue" :key="url" class="relative w-20 h-20">
        <img :src="url" :alt="`Image ${i+1}`" class="w-full h-full object-cover rounded-lg" />
        <button @click="removeImage(i)"
          class="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center"
        >×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [urls: string[]] }>()

const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)

const upload = async (files: FileList) => {
  uploading.value = true
  const storage = useFirebaseStorage()
  const urls: string[] = []

  for (const file of Array.from(files)) {
    const path = `products/${Date.now()}-${file.name.replace(/\s/g, '-')}`
    const snap = await uploadBytes(storageRef(storage, path), file)
    urls.push(await getDownloadURL(snap.ref))
  }

  emit('update:modelValue', [...props.modelValue, ...urls])
  uploading.value = false
}

const onFiles = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files) upload(files)
}

const onDrop = (e: DragEvent) => {
  if (e.dataTransfer?.files) upload(e.dataTransfer.files)
}

const removeImage = (i: number) => {
  const updated = [...props.modelValue]
  updated.splice(i, 1)
  emit('update:modelValue', updated)
}
</script>
```

- [ ] **Step 2: Écrire `components/admin/ProductForm.vue`**

```vue
<!-- components/admin/ProductForm.vue -->
<template>
  <form @submit.prevent="$emit('submit', form)" class="space-y-5 max-w-xl">
    <div>
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1">Nom</label>
      <input v-model="form.name" required @input="autoSlug"
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary" />
    </div>

    <div>
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1">Slug URL</label>
      <input v-model="form.slug" required
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary" />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1">Prix (€)</label>
        <input v-model.number="form.price" type="number" required min="0" step="0.01"
          class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary" />
      </div>
      <div>
        <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1">Stock</label>
        <input v-model.number="form.stock" type="number" required min="0"
          class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary" />
      </div>
    </div>

    <div>
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1">Catégorie</label>
      <select v-model="form.category" required
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary"
      >
        <option value="bagues">Bagues</option>
        <option value="colliers">Colliers</option>
        <option value="bracelets">Bracelets</option>
        <option value="boucles">Boucles d'oreilles</option>
      </select>
    </div>

    <div>
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1">Description</label>
      <textarea v-model="form.description" rows="4" required
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary resize-none" />
    </div>

    <div>
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-2">Photos</label>
      <ImageUploader v-model="form.images" />
    </div>

    <label class="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" v-model="form.featured" class="accent-primary w-4 h-4" />
      <span class="font-body text-sm text-primary/70">Mettre en avant sur l'accueil</span>
    </label>

    <AppButton type="submit" variant="primary" :disabled="loading">
      {{ loading ? 'Enregistrement...' : submitLabel }}
    </AppButton>
  </form>
</template>

<script setup lang="ts">
import type { Product } from '~/composables/useProducts'

const props = defineProps<{
  initial?: Partial<Product>
  submitLabel?: string
  loading?: boolean
}>()
defineEmits<{ submit: [data: Omit<Product, 'id'>] }>()

const form = reactive<Omit<Product, 'id'>>({
  name: props.initial?.name ?? '',
  slug: props.initial?.slug ?? '',
  description: props.initial?.description ?? '',
  price: props.initial?.price ?? 0,
  stock: props.initial?.stock ?? 1,
  category: props.initial?.category ?? 'bagues',
  images: props.initial?.images ?? [],
  featured: props.initial?.featured ?? false,
})

const autoSlug = () => {
  if (!props.initial?.slug) {
    form.slug = form.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }
}
</script>
```

- [ ] **Step 3: Écrire `pages/admin/products/index.vue`**

```vue
<!-- pages/admin/products/index.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="font-heading text-3xl text-primary">Produits</h1>
      <AppButton variant="primary" @click="navigateTo('/admin/products/new')">+ Nouveau produit</AppButton>
    </div>

    <div class="divide-y divide-accent/20">
      <div v-for="p in products" :key="p.id" class="flex items-center gap-4 py-4">
        <img :src="p.images[0]" :alt="p.name" class="w-14 h-14 rounded-lg object-cover bg-surface" />
        <div class="flex-1">
          <p class="font-body text-primary font-medium">{{ p.name }}</p>
          <p class="font-body text-sm text-primary/40">{{ p.category }} · {{ p.price }} €</p>
        </div>
        <span v-if="p.featured" class="text-xs font-body text-primary/40 border border-primary/20 rounded-full px-2 py-0.5">Featured</span>
        <span :class="p.stock > 0 ? 'text-green-500' : 'text-red-400'" class="text-xs font-body">
          {{ p.stock > 0 ? `${p.stock} en stock` : 'Épuisé' }}
        </span>
        <AppButton variant="ghost" @click="navigateTo(`/admin/products/${p.id}`)">Modifier</AppButton>
        <button @click="deleteProduct(p.id!)" class="text-primary/30 hover:text-red-400 transition-colors font-body text-sm">Supprimer</button>
      </div>
    </div>

    <p v-if="products.length === 0" class="text-center font-body text-primary/30 py-16">Aucun produit. Créez-en un !</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { getAll, remove } = useProducts()
const products = ref<Awaited<ReturnType<typeof getAll>>>([])

onMounted(async () => { products.value = await getAll() })

const deleteProduct = async (id: string) => {
  if (!confirm('Supprimer ce produit ?')) return
  await remove(id)
  products.value = products.value.filter(p => p.id !== id)
}
</script>
```

- [ ] **Step 4: Écrire `pages/admin/products/new.vue`**

```vue
<!-- pages/admin/products/new.vue -->
<template>
  <div>
    <h1 class="font-heading text-3xl text-primary mb-8">Nouveau produit</h1>
    <ProductForm submit-label="Créer le produit" :loading="loading" @submit="create" />
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { create: createProduct } = useProducts()
const loading = ref(false)

const create = async (data: Omit<Product, 'id'>) => {
  loading.value = true
  await createProduct(data)
  loading.value = false
  await navigateTo('/admin/products')
}
</script>
```

- [ ] **Step 5: Écrire `pages/admin/products/[id].vue`**

```vue
<!-- pages/admin/products/[id].vue -->
<template>
  <div v-if="product">
    <h1 class="font-heading text-3xl text-primary mb-8">Modifier — {{ product.name }}</h1>
    <ProductForm :initial="product" submit-label="Enregistrer" :loading="loading" @submit="save" />
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const { getAll, update } = useProducts()
const loading = ref(false)
const products = await getAll()
const product = products.find(p => p.id === route.params.id)

const save = async (data: Omit<Product, 'id'>) => {
  loading.value = true
  await update(route.params.id as string, data)
  loading.value = false
  await navigateTo('/admin/products')
}
</script>
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: admin product management — list, create, edit with image upload"
```

---

## Task 12: Admin — dashboard, messages, settings

**Files:**
- Create: `components/admin/StatsCard.vue`, `components/admin/BrandEditor.vue`, `pages/admin/dashboard.vue`, `pages/admin/messages.vue`, `pages/admin/settings.vue`

- [ ] **Step 1: Écrire `components/admin/StatsCard.vue`**

```vue
<!-- components/admin/StatsCard.vue -->
<template>
  <div class="bg-surface rounded-2xl p-6 border border-accent/20">
    <p class="font-body text-xs text-primary/40 uppercase tracking-wider mb-2">{{ label }}</p>
    <p class="font-heading text-4xl text-primary">{{ value }}</p>
    <p v-if="sub" class="font-body text-xs text-primary/40 mt-1">{{ sub }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string | number; sub?: string }>()
</script>
```

- [ ] **Step 2: Écrire `pages/admin/dashboard.vue`**

```vue
<!-- pages/admin/dashboard.vue -->
<template>
  <div>
    <h1 class="font-heading text-3xl text-primary mb-8">Dashboard</h1>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
      <StatsCard label="Produits" :value="stats.products" />
      <StatsCard label="Dont featured" :value="stats.featured" />
      <StatsCard label="Messages" :value="stats.messages" sub="non lus" />
      <StatsCard label="Commandes" value="—" sub="phase 2" />
    </div>
    <div class="flex gap-3">
      <AppButton variant="outline" @click="navigateTo('/admin/products/new')">+ Nouveau produit</AppButton>
      <AppButton variant="ghost" @click="navigateTo('/admin/messages')">Voir les messages</AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getDocs, collection, query, where } from 'firebase/firestore'
definePageMeta({ layout: 'admin', middleware: 'auth' })

const db = useFirestore()
const stats = reactive({ products: 0, featured: 0, messages: 0 })

onMounted(async () => {
  const [allProducts, featuredProducts, unreadMessages] = await Promise.all([
    getDocs(collection(db, 'products')),
    getDocs(query(collection(db, 'products'), where('featured', '==', true))),
    getDocs(query(collection(db, 'messages'), where('read', '==', false))),
  ])
  stats.products = allProducts.size
  stats.featured = featuredProducts.size
  stats.messages = unreadMessages.size
})
</script>
```

- [ ] **Step 3: Écrire `pages/admin/messages.vue`**

```vue
<!-- pages/admin/messages.vue -->
<template>
  <div>
    <h1 class="font-heading text-3xl text-primary mb-8">Messages</h1>
    <div class="divide-y divide-accent/20">
      <div v-for="msg in messages" :key="msg.id"
        :class="['py-5 cursor-pointer hover:bg-surface/50 px-3 rounded-xl transition-colors', !msg.read && 'bg-surface/30']"
        @click="markRead(msg)"
      >
        <div class="flex justify-between items-start mb-1">
          <p class="font-body font-medium text-primary">{{ msg.name }}</p>
          <p class="font-body text-xs text-primary/30">{{ formatDate(msg.createdAt) }}</p>
        </div>
        <p class="font-body text-xs text-primary/40 mb-2">{{ msg.email }}</p>
        <p class="font-body text-sm text-primary/70">{{ msg.content }}</p>
      </div>
    </div>
    <p v-if="messages.length === 0" class="text-center font-body text-primary/30 py-16">Aucun message.</p>
  </div>
</template>

<script setup lang="ts">
import { getDocs, collection, orderBy, query, updateDoc, doc } from 'firebase/firestore'
definePageMeta({ layout: 'admin', middleware: 'auth' })

const db = useFirestore()
const messages = ref<any[]>([])

onMounted(async () => {
  const snap = await getDocs(query(collection(db, 'messages'), orderBy('createdAt', 'desc')))
  messages.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
})

const markRead = async (msg: any) => {
  if (msg.read) return
  await updateDoc(doc(db, 'messages', msg.id), { read: true })
  msg.read = true
}

const formatDate = (ts: any) => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
</script>
```

- [ ] **Step 4: Écrire `components/admin/BrandEditor.vue`**

```vue
<!-- components/admin/BrandEditor.vue -->
<template>
  <form @submit.prevent="save" class="space-y-6 max-w-lg">
    <div v-for="field in fields" :key="field.key">
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1">{{ field.label }}</label>
      <input
        v-model="form[field.key as keyof typeof form]"
        :type="field.type ?? 'text'"
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary"
      />
    </div>

    <div>
      <p class="font-body text-xs text-primary/50 uppercase tracking-wider mb-2">Couleur principale</p>
      <input type="color" v-model="form.primaryColor" class="w-10 h-10 cursor-pointer rounded border-0" />
    </div>

    <AppButton type="submit" variant="primary" :disabled="saving">
      {{ saving ? 'Enregistrement...' : 'Sauvegarder' }}
    </AppButton>
    <p v-if="saved" class="font-body text-xs text-green-500">Modifications enregistrées ✓</p>
  </form>
</template>

<script setup lang="ts">
const { config, saveToFirestore } = useBrand()
const saving = ref(false)
const saved = ref(false)

const form = reactive({
  name:         config.value.name,
  slogan:       config.value.slogan,
  heroTitle:    config.value.texts.heroTitle,
  heroSubtitle: config.value.texts.heroSubtitle,
  aboutSummary: config.value.texts.aboutSummary,
  instagram:    config.value.social.instagram,
  primaryColor: config.value.colors.primary,
})

const fields = [
  { key: 'name',         label: 'Nom de la marque' },
  { key: 'slogan',       label: 'Slogan' },
  { key: 'heroTitle',    label: 'Titre du héros' },
  { key: 'heroSubtitle', label: 'Sous-titre du héros' },
  { key: 'aboutSummary', label: 'Présentation créatrice' },
  { key: 'instagram',    label: 'Compte Instagram' },
]

const save = async () => {
  saving.value = true
  await saveToFirestore({
    name: form.name,
    slogan: form.slogan,
    texts: { heroTitle: form.heroTitle, heroSubtitle: form.heroSubtitle, aboutSummary: form.aboutSummary },
    social: { instagram: form.instagram, facebook: config.value.social.facebook },
    colors: { ...config.value.colors, primary: form.primaryColor },
  })
  document.documentElement.style.setProperty('--color-primary', form.primaryColor)
  saving.value = false
  saved.value = true
  setTimeout(() => { saved.value = false }, 3000)
}
</script>
```

- [ ] **Step 5: Écrire `pages/admin/settings.vue`**

```vue
<!-- pages/admin/settings.vue -->
<template>
  <div>
    <h1 class="font-heading text-3xl text-primary mb-8">Paramètres de la marque</h1>
    <BrandEditor />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
</script>
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: admin dashboard, messages, and brand settings editor"
```

---

## Task 13: Firebase rules + déploiement

**Files:**
- Create: `firebase/firestore.rules`, `firebase/storage.rules`, `firebase.json`, `.firebaserc`

- [ ] **Step 1: Écrire `firebase/firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Produits : lecture publique, écriture admin uniquement
    match /products/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Config marque : lecture publique, écriture admin
    match /config/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Messages : création publique, lecture/écriture admin
    match /messages/{id} {
      allow create: if request.resource.data.keys().hasAll(['name', 'email', 'content', 'createdAt', 'read'])
        && request.resource.data.name is string
        && request.resource.data.email is string
        && request.resource.data.content is string;
      allow read, update: if request.auth != null;
    }

    // Commandes : création publique (phase 2 Stripe), lecture admin
    match /orders/{id} {
      allow create: if true;
      allow read, update: if request.auth != null;
    }
  }
}
```

- [ ] **Step 2: Écrire `firebase/storage.rules`**

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

- [ ] **Step 3: Écrire `firebase.json`**

```json
{
  "hosting": {
    "public": ".output/public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "function": "server" }
    ]
  },
  "functions": {
    "source": ".output/server",
    "runtime": "nodejs20"
  },
  "firestore": {
    "rules": "firebase/firestore.rules"
  },
  "storage": {
    "rules": "firebase/storage.rules"
  }
}
```

- [ ] **Step 4: Créer le projet Firebase**

Dans la console Firebase (console.firebase.google.com) :
1. Créer un nouveau projet
2. Activer Firestore (mode production)
3. Activer Authentication → Email/Password
4. Activer Storage
5. Créer un utilisateur admin dans Authentication → Users
6. Copier les clés SDK dans `.env`

- [ ] **Step 5: Installer Firebase CLI et déployer les règles**

```bash
npm install -g firebase-tools
firebase login
firebase init   # sélectionner Firestore, Storage, Hosting, Functions
firebase deploy --only firestore:rules,storage
```

- [ ] **Step 6: Build et déploiement complet**

```bash
npm run build
firebase deploy
```

Attendu : URL Firebase Hosting retournée en sortie.

- [ ] **Step 7: Commit final**

```bash
git add firebase.json firebase/ .firebaserc
git commit -m "feat: Firebase rules and deployment config"
```

---

## Checklist de vérification finale

- [ ] `npm run dev` — site accessible sur http://localhost:3000
- [ ] Accueil : blobs visibles, parallax au scroll, produits featured
- [ ] Catalogue : filtre par catégorie fonctionnel
- [ ] Fiche produit : galerie photos, ajout panier
- [ ] Panier : total calculé, quantités modifiables
- [ ] `/admin/login` : connexion Firebase Auth
- [ ] `/admin/products` : CRUD produits avec upload photos
- [ ] `/admin/settings` : changement du nom de marque répercuté en live
- [ ] `/admin/messages` : messages contact lisibles
- [ ] `npm run test` : 7 tests passants (useBrand + useCart)
