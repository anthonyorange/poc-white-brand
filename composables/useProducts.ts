// composables/useProducts.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
  type QueryConstraint,
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

// Default page size for paginated queries. Firestore charges per read, so
// loading only what's displayed saves $$$.
export const PRODUCTS_PAGE_SIZE = 12

export interface PaginatedProducts {
  items: Product[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
}

export const useProducts = () => {
  const db = useFirestore()

  /**
   * Fetch a page of products.
   * @param cursor  last document from the previous page (for pagination)
   * @param pageSize  number of items to fetch (default PRODUCTS_PAGE_SIZE)
   */
  const getAll = async (
    cursor?: QueryDocumentSnapshot<DocumentData>,
    pageSize: number = PRODUCTS_PAGE_SIZE,
  ): Promise<PaginatedProducts> => {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(pageSize)]
    if (cursor) constraints.push(startAfter(cursor))
    const snap = await getDocs(query(collection(db, 'products'), ...constraints))
    return {
      items: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product),
      lastDoc: snap.docs.at(-1) ?? null,
    }
  }

  const getByCategory = async (
    cat: ProductCategory,
    cursor?: QueryDocumentSnapshot<DocumentData>,
    pageSize: number = PRODUCTS_PAGE_SIZE,
  ): Promise<PaginatedProducts> => {
    const constraints: QueryConstraint[] = [
      where('category', '==', cat),
      orderBy('createdAt', 'desc'),
      limit(pageSize),
    ]
    if (cursor) constraints.push(startAfter(cursor))
    const snap = await getDocs(query(collection(db, 'products'), ...constraints))
    return {
      items: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product),
      lastDoc: snap.docs.at(-1) ?? null,
    }
  }

  /**
   * Products are stored with their slug as the Firestore document ID to
   * guarantee URL uniqueness at write time (rules also enforce slug regex).
   * We can therefore read by slug with a single direct doc fetch (no index).
   */
  const getBySlug = async (slug: string): Promise<Product | null> => {
    const snap = await getDoc(doc(db, 'products', slug))
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Product) : null
  }

  const getFeatured = async (max = 6): Promise<Product[]> => {
    const snap = await getDocs(
      query(
        collection(db, 'products'),
        where('featured', '==', true),
        orderBy('createdAt', 'desc'),
        limit(max),
      ),
    )
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)
  }

  /**
   * Create a new product, using its slug as the Firestore doc ID.
   * Throws if the slug is already taken (SYM-GR-0003 — deterministic URL).
   */
  const create = async (product: Omit<Product, 'id'>): Promise<string> => {
    if (!/^[a-z0-9-]{1,120}$/.test(product.slug)) {
      throw new Error('Slug invalide.')
    }
    const ref = doc(db, 'products', product.slug)
    const existing = await getDoc(ref)
    if (existing.exists()) {
      throw new Error('Ce slug est déjà utilisé, choisissez-en un autre.')
    }
    const now = new Date()
    await setDoc(ref, { ...product, createdAt: now, updatedAt: now })
    return product.slug
  }

  const update = async (id: string, data: Partial<Product>): Promise<void> => {
    // Disallow changing slug on update (would break existing URLs and the
    // doc-ID invariant). Callers must delete+recreate if they really want a
    // new slug.
    if ('slug' in data && data.slug !== id) {
      throw new Error('Le slug (URL) ne peut pas être modifié après création.')
    }
    const { slug: _omit, ...rest } = data
    void _omit
    await updateDoc(doc(db, 'products', id), { ...rest, updatedAt: new Date() })
  }

  /**
   * Delete a product document AND its associated Storage images to avoid
   * orphan files. SYM-GR-0014 (retention), SYM-GR-0008 (secure deletion).
   */
  const remove = async (id: string): Promise<void> => {
    // Fetch the doc first to get image URLs before deleting it.
    const snap = await getDoc(doc(db, 'products', id))
    const imageUrls: string[] = snap.exists() ? ((snap.data().images as string[]) ?? []) : []

    await deleteDoc(doc(db, 'products', id))

    // Best-effort: try to delete Storage objects. A failure here shouldn't
    // block the delete (the doc is already gone); we just log in dev.
    if (imageUrls.length > 0) {
      try {
        const storage = await useFirebaseStorage()
        const { ref: storageRef, deleteObject } = await import('firebase/storage')
        await Promise.allSettled(
          imageUrls.map(async (url) => {
            // Only attempt delete for URLs we recognize (our own Storage bucket).
            // Third-party URLs pasted by admin are ignored — they aren't ours.
            if (!url.includes('firebasestorage.googleapis.com')) return
            const path = extractStoragePath(url)
            if (!path) return
            return deleteObject(storageRef(storage, path))
          }),
        )
      } catch (e) {
        if (import.meta.dev) console.warn('[useProducts] Storage cleanup failed', e)
      }
    }
  }

  return {
    getAll,
    getByCategory,
    getBySlug,
    getFeatured,
    create,
    update,
    remove,
  }
}

/**
 * Extract the object path from a Firebase Storage download URL.
 * Firebase URLs look like:
 *   https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<URL-encoded-path>?alt=...
 */
function extractStoragePath(downloadUrl: string): string | null {
  try {
    const u = new URL(downloadUrl)
    const match = u.pathname.match(/\/o\/(.+)$/)
    if (!match) return null
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}
