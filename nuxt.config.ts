// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-04-03',
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
  ],
  css: ['~/assets/css/tokens.css', '~/assets/css/animations.css'],

  // Public site URL used by @nuxtjs/sitemap and OG tags.
  // Override via NUXT_PUBLIC_SITE_URL at deploy time.
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL ?? 'https://atelieranais-cb8dd.web.app',
    name: "L'Atelier d'Anaïs",
  },

  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? '',
      firebase: {
        apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY ?? '',
        authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
        projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
        storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
        messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
        appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID ?? '',
        measurementId: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
      },
    },
  },

  // Block admin routes from crawlers; allow public pages.
  robots: {
    disallow: ['/admin', '/admin/'],
  },

  // Sitemap excludes admin routes; dynamic product slugs can be added later
  // via a server handler that queries Firestore at build time.
  sitemap: {
    exclude: ['/admin/**'],
  },

  // @nuxt/image: whitelist Firebase Storage + Google user content domains
  // so <NuxtImg> can apply lazy-loading, responsive srcset, and format hints.
  // We don't run an image CDN in this setup, but allowlisting is required by
  // the module; actual serving still goes directly to Firebase Storage URLs.
  image: {
    domains: ['firebasestorage.googleapis.com', 'storage.googleapis.com'],
    format: ['webp', 'avif', 'jpeg'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  nitro: {
    preset: 'firebase',
    firebase: { gen: 2 },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'fr' },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
      meta: [
        { name: 'theme-color', content: '#6b4c7a' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
    },
  },
})
