// composables/useProducts.ts
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore'

export type ProductCategory = 'bagues' | 'colliers' | 'bracelets' | 'boucles'

export interface Product {
  id?: string
  name: string
  slug: string
  description: string
  price: number
  stock: number
  category: ProductCategory
  images: string[]
  featured: boolean
  createdAt?: Date
  updatedAt?: Date
}

export const useProducts = () => {
  const db = useFirestore()

  const getAll = async (): Promise<Product[]> => {
    const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)
  }

  const getByCategory = async (cat: ProductCategory): Promise<Product[]> => {
    const snap = await getDocs(
      query(collection(db, 'products'), where('category', '==', cat), orderBy('createdAt', 'desc')),
    )
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)
  }

  const getBySlug = async (slug: string): Promise<Product | null> => {
    const snap = await getDocs(query(collection(db, 'products'), where('slug', '==', slug)))
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as Product
  }

  const getFeatured = async (): Promise<Product[]> => {
    const snap = await getDocs(query(collection(db, 'products'), where('featured', '==', true)))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)
  }

  const create = async (product: Omit<Product, 'id'>): Promise<string> => {
    const ref = await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return ref.id
  }

  const update = async (id: string, data: Partial<Product>): Promise<void> => {
    await updateDoc(doc(db, 'products', id), { ...data, updatedAt: new Date() })
  }

  const remove = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'products', id))
  }

  return { getAll, getByCategory, getBySlug, getFeatured, create, update, remove }
}
