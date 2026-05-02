// plugins/firebase.client.ts
// Minimal Firebase plugin: init app + Firestore.
// Auth and Storage are lazy-loaded via composables (useFirebaseAuth / useFirebaseStorage)
// to keep the public-page bundle smaller. SYM-GR-0019.
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin(() => {
  const {
    public: { firebase: cfg },
  } = useRuntimeConfig()

  const app: FirebaseApp = getApps().length === 0 ? initializeApp(cfg) : getApps()[0]

  return {
    provide: {
      firebase: {
        app,
        db: getFirestore(app),
      },
    },
  }
})
