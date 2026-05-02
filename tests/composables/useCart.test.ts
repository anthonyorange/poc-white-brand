// tests/composables/useCart.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { __clearGlobalState } from '../setup'

// Mock localStorage for the persist() call (import.meta.client is false in tests)
const store: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v
  },
})

const { useCart } = await import('~/composables/useCart')

describe('useCart', () => {
  let cart: ReturnType<typeof useCart>
  beforeEach(() => {
    __clearGlobalState()
    cart = useCart()
    cart.clear()
  })

  it('ajoute un article', () => {
    cart.add({ productId: '1', name: 'Bague', price: 40, image: '/img.jpg' })
    expect(cart.items.value).toHaveLength(1)
    expect(cart.items.value[0].quantity).toBe(1)
  })

  it('incrémente la quantité si même produit', () => {
    cart.add({ productId: '1', name: 'Bague', price: 40, image: '/img.jpg' })
    cart.add({ productId: '1', name: 'Bague', price: 40, image: '/img.jpg' })
    expect(cart.items.value[0].quantity).toBe(2)
  })

  it('calcule le total', () => {
    cart.add({ productId: '1', name: 'Bague', price: 40, image: '/img.jpg' })
    cart.add({ productId: '2', name: 'Collier', price: 60, image: '/img2.jpg' })
    expect(cart.total.value).toBe(100)
  })

  it('supprime un article', () => {
    cart.add({ productId: '1', name: 'Bague', price: 40, image: '/img.jpg' })
    cart.remove('1')
    expect(cart.items.value).toHaveLength(0)
  })
})
