// types/nuxt.d.ts
// Augment NuxtApp with our injected plugins to avoid `as any` at call sites.
import type gsap from 'gsap'
import type ScrollTrigger from 'gsap/ScrollTrigger'
import type { FirebaseApp } from 'firebase/app'
import type { Firestore } from 'firebase/firestore'
import type { Auth } from 'firebase/auth'
import type { FirebaseStorage } from 'firebase/storage'

declare module '#app' {
  interface NuxtApp {
    $gsap: typeof gsap
    $ScrollTrigger: typeof ScrollTrigger
    $firebase: {
      app: FirebaseApp
      db: Firestore
      auth: Auth
      storage: FirebaseStorage
    }
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $gsap: typeof gsap
    $ScrollTrigger: typeof ScrollTrigger
  }
}

export {}
