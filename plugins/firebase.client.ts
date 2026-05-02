// plugins/firebase.client.ts
// Minimal Firebase plugin: init app + Firestore + App Check.
// Auth and Storage are lazy-loaded via composables (useFirebaseAuth / useFirebaseStorage)
// to keep the public-page bundle smaller. SYM-GR-0019.
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin(async () => {
  const {
    public: { firebase: cfg, recaptchaSiteKey },
  } = useRuntimeConfig()

  const app: FirebaseApp = getApps().length === 0 ? initializeApp(cfg) : getApps()[0]

  // Firebase App Check: attests that requests originate from our legitimate
  // web app (not a bot scripting the SDK). Requires a reCAPTCHA v3 site key
  // created in the Firebase console: Project Settings → App Check → Web apps.
  // Without a site key, App Check stays off and we degrade gracefully —
  // Firestore/Storage rules remain the last line of defense.
  // SYM-GR-0019 (defense in depth), SYM-GR-0020 (Leak/Compromise).
  if (recaptchaSiteKey) {
    try {
      const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check')
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey as string),
        isTokenAutoRefreshEnabled: true,
      })
    } catch (e) {
      // A misconfigured site key shouldn't crash the app; log in dev only.
      if (import.meta.dev) console.warn('[AppCheck] init failed', e)
    }
  }

  return {
    provide: {
      firebase: {
        app,
        db: getFirestore(app),
      },
    },
  }
})
