// plugins/firebase.client.ts
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

export default defineNuxtPlugin(() => {
  const {
    public: { firebase: cfg },
  } = useRuntimeConfig()
  const app = getApps().length === 0 ? initializeApp(cfg) : getApps()[0]
  return {
    provide: {
      firebase: {
        app,
        db: getFirestore(app),
        auth: getAuth(app),
        storage: getStorage(app),
      },
    },
  }
})
