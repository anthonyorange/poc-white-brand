// tests/setup.ts
import { vi } from 'vitest'
import { ref, computed, type Ref } from 'vue'

// Expose Nuxt auto-imports as globals for the test environment
// so composables that rely on them work without a full Nuxt runtime.
const globalState = new Map<string, Ref<unknown>>()

const useState = <T>(key: string, init?: () => T): Ref<T> => {
  if (!globalState.has(key)) {
    globalState.set(key, ref(init ? init() : undefined) as Ref<unknown>)
  }
  return globalState.get(key) as Ref<T>
}

const useNuxtApp = () => ({ $firebase: { db: {}, auth: {}, storage: {} } })
const useRuntimeConfig = () => ({ public: { firebase: {} } })
const navigateTo = vi.fn()

// Expose Nuxt helpers as globals for composables that rely on auto-imports.
// Using `unknown` cast + dedicated globalThis typing instead of @ts-expect-error.
type GlobalNuxt = typeof globalThis & {
  useState: typeof useState
  useNuxtApp: typeof useNuxtApp
  useRuntimeConfig: typeof useRuntimeConfig
  navigateTo: typeof navigateTo
  computed: typeof computed
  ref: typeof ref
}
const g = globalThis as GlobalNuxt
g.useState = useState
g.useNuxtApp = useNuxtApp
g.useRuntimeConfig = useRuntimeConfig
g.navigateTo = navigateTo
g.computed = computed
g.ref = ref

// Also mock the #app module for any import references
vi.mock('#app', () => ({
  useState,
  useNuxtApp,
  useRuntimeConfig,
  navigateTo,
}))

// Clear state between tests if needed
export const __clearGlobalState = () => globalState.clear()
