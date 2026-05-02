// composables/useFirebase.ts
// Lazy-load Firebase Auth and Storage SDKs on demand.
// Only Firestore is always loaded (via plugins/firebase.client.ts).
// This keeps the public-page bundle smaller by ~100-150 KB gzipped.
import type { Firestore } from 'firebase/firestore'
import type { Auth } from 'firebase/auth'
import type { FirebaseStorage } from 'firebase/storage'

export const useFirestore = (): Firestore => useNuxtApp().$firebase.db

// Memoized instances (singletons across calls).
let _auth: Auth | null = null
let _storage: FirebaseStorage | null = null

export const useFirebaseAuth = async (): Promise<Auth> => {
  if (_auth) return _auth
  const { getAuth } = await import('firebase/auth')
  _auth = getAuth(useNuxtApp().$firebase.app)
  return _auth
}

export const useFirebaseStorage = async (): Promise<FirebaseStorage> => {
  if (_storage) return _storage
  const { getStorage } = await import('firebase/storage')
  _storage = getStorage(useNuxtApp().$firebase.app)
  return _storage
}
