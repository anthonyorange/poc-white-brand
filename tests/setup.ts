// tests/setup.ts
import { vi } from 'vitest'
import { ref, computed } from 'vue'

// Expose Nuxt auto-imports as globals for the test environment
// so composables that rely on them work without a full Nuxt runtime.
const globalState = new Map<string, any>()

const useState = <T>(key: string, init?: () => T) => {
  if (!globalState.has(key)) {
    globalState.set(key, ref(init ? init() : undefined))
  }
  return globalState.get(key)
}

const useNuxtApp = () => ({ $firebase: { db: {}, auth: {}, storage: {} } })
const useRuntimeConfig = () => ({ public: { firebase: {} } })
const navigateTo = vi.fn()

// @ts-expect-error expose globally for composables
globalThis.useState = useState
// @ts-expect-error
globalThis.useNuxtApp = useNuxtApp
// @ts-expect-error
globalThis.useRuntimeConfig = useRuntimeConfig
// @ts-expect-error
globalThis.navigateTo = navigateTo
// @ts-expect-error
globalThis.computed = computed
// @ts-expect-error
globalThis.ref = ref

// Also mock the #app module for any import references
vi.mock('#app', () => ({
  useState,
  useNuxtApp,
  useRuntimeConfig,
  navigateTo,
}))

// Clear state between tests if needed
export const __clearGlobalState = () => globalState.clear()
