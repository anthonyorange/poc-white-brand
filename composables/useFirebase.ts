// composables/useFirebase.ts
import type { Firestore } from 'firebase/firestore'
import type { Auth } from 'firebase/auth'
import type { FirebaseStorage } from 'firebase/storage'

export const useFirestore = (): Firestore => useNuxtApp().$firebase.db as Firestore
export const useFirebaseAuth = (): Auth => useNuxtApp().$firebase.auth as Auth
export const useFirebaseStorage = (): FirebaseStorage => useNuxtApp().$firebase.storage as FirebaseStorage
