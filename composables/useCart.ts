// composables/useCart.ts
export interface CartItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
}

export const useCart = () => {
  const items = useState<CartItem[]>('cart', () => [])

  const persist = () => {
    if (import.meta.client) {
      localStorage.setItem('cart', JSON.stringify(items.value))
    }
  }

  const add = (item: Omit<CartItem, 'quantity'>) => {
    const existing = items.value.find((i) => i.productId === item.productId)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ ...item, quantity: 1 })
    }
    persist()
  }

  const remove = (productId: string) => {
    items.value = items.value.filter((i) => i.productId !== productId)
    persist()
  }

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      remove(productId)
      return
    }
    const item = items.value.find((i) => i.productId === productId)
    if (item) {
      item.quantity = qty
      persist()
    }
  }

  const clear = () => {
    items.value = []
    persist()
  }

  const total = computed(() => items.value.reduce((s, i) => s + i.price * i.quantity, 0))
  const count = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))

  return { items, add, remove, updateQuantity, clear, total, count }
}
