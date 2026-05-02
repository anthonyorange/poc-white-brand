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
