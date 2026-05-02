// types/nuxt.d.ts
// Augment NuxtApp with our injected plugins to avoid `as any` at call sites.
import type gsap from 'gsap'
import type ScrollTrigger from 'gsap/ScrollTrigger'
import type { FirebaseApp } from 'firebase/app'
import type { Firestore } from 'firebase/firestore'

declare module '#app' {
  interface NuxtApp {
    $gsap: typeof gsap
    $ScrollTrigger: typeof ScrollTrigger
    // Auth and Storage are NOT provided here. Use useFirebaseAuth() /
    // useFirebaseStorage() composables which lazy-load the SDKs on demand
    // (keeps the public-page bundle smaller).
    $firebase: {
      app: FirebaseApp
      db: Firestore
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
