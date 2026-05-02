// tests/setup.ts
import { vi } from 'vitest'
import { ref } from 'vue'

vi.mock('#app', () => ({
  useState: vi.fn((_key: string, init?: () => unknown) => ref(init ? init() : undefined)),
  useNuxtApp: vi.fn(() => ({ $firebase: { db: {}, auth: {}, storage: {} } })),
  useRuntimeConfig: vi.fn(() => ({ public: { firebase: {} } })),
  navigateTo: vi.fn(),
}))
