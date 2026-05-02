// plugins/firebase.server.ts
// Server-side Firebase initialization for SSR reads (Firestore only).
//
// NOTE: We use the Web SDK here, which works in Node but isn't optimal for
// Cloud Functions cold starts. For a production-grade SSR with per-request
// auth (e.g. personalized content), switch to firebase-admin with a service
// account. See TODO below.
//
// TODO(phase2): Replace with firebase-admin + service account credentials
// (mounted as env var JSON or via Application Default Credentials on Cloud
// Functions). That allows:
//   - bypassing Firestore rules for trusted reads
//   - reading documents that aren't publicly readable
//   - skipping the JS SDK init cost per request
//
// SYM-GR-0004: while this plugin has DB access, it only exposes `db` (no
// auth/storage on the server), and Firestore rules still enforce that only
// public-readable docs can be fetched anonymously.
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin(() => {
  const {
    public: { firebase: cfg },
  } = useRuntimeConfig()

  // Guard against misconfigured/empty runtime config (e.g. CI build).
  if (!cfg?.projectId) {
    return {
      provide: {
        firebase: {
          app: null as unknown as FirebaseApp,
          // Fake db: any call on it will throw; useAsyncData consumers handle
          // the rejection gracefully.
          db: null as unknown as ReturnType<typeof getFirestore>,
        },
      },
    }
  }

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
