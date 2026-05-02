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
  Timestamp,
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
  // Use the doc ID (slug) as an opaque cursor for startAfter(), instead of
  // returning a non-serializable QueryDocumentSnapshot. This keeps SSR
  // payloads devalue-friendly.
  lastDocId: string | null
}

/**
 * Convert Firestore Timestamp fields on a raw product doc to JS Date objects.
 * devalue (used by Nuxt useAsyncData payload transport) can serialize Date
 * but not the Firestore Timestamp class — leaving it unchanged caused SSR
 * to throw "Cannot stringify arbitrary non-POJOs" and silently returned
 * empty lists on the client.
 *
 * SYM-GR-0010: annotated because the normalization also strips any
 * unexpected prototype-carrying class instance the SDK might hand us.
 */
function normalizeProduct(raw: DocumentData & { id?: string }): Product {
  const toDate = (v: unknown): Date | undefined => {
    if (!v) return undefined
    if (v instanceof Timestamp) return v.toDate()
    if (v instanceof Date) return v
    // Firestore JSON serialized form { seconds, nanoseconds }
    if (
      typeof v === 'object' &&
      v !== null &&
      'seconds' in (v as Record<string, unknown>) &&
      typeof (v as { seconds: unknown }).seconds === 'number'
    ) {
      return new Date((v as { seconds: number }).seconds * 1000)
    }
    return undefined
  }

  return {
    id: raw.id,
    name: String(raw.name ?? ''),
    slug: String(raw.slug ?? ''),
    description: String(raw.description ?? ''),
    price: Number(raw.price ?? 0),
    stock: Number(raw.stock ?? 0),
    category: raw.category as ProductCategory,
    images: Array.isArray(raw.images) ? raw.images.map(String) : [],
    featured: Boolean(raw.featured),
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
  }
}

export const useProducts = () => {
  const db = useFirestore()

  // Resolve an opaque cursor (doc ID) back to a snapshot for startAfter().
  const resolveCursor = async (
    cursorId: string,
  ): Promise<QueryDocumentSnapshot<DocumentData> | null> => {
    const s = await getDoc(doc(db, 'products', cursorId))
    return s.exists() ? (s as unknown as QueryDocumentSnapshot<DocumentData>) : null
  }

  /**
   * Fetch a page of products.
   * @param cursorId  doc id of the last item from the previous page
   * @param pageSize  number of items to fetch (default PRODUCTS_PAGE_SIZE)
   */
  const getAll = async (
    cursorId?: string,
    pageSize: number = PRODUCTS_PAGE_SIZE,
  ): Promise<PaginatedProducts> => {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(pageSize)]
    if (cursorId) {
      const cursor = await resolveCursor(cursorId)
      if (cursor) constraints.push(startAfter(cursor))
    }
    const snap = await getDocs(query(collection(db, 'products'), ...constraints))
    const lastDoc = snap.docs.at(-1)
    return {
      items: snap.docs.map((d) => normalizeProduct({ id: d.id, ...d.data() })),
      lastDocId: lastDoc?.id ?? null,
    }
  }

  const getByCategory = async (
    cat: ProductCategory,
    cursorId?: string,
    pageSize: number = PRODUCTS_PAGE_SIZE,
  ): Promise<PaginatedProducts> => {
    const constraints: QueryConstraint[] = [
      where('category', '==', cat),
      orderBy('createdAt', 'desc'),
      limit(pageSize),
    ]
    if (cursorId) {
      const cursor = await resolveCursor(cursorId)
      if (cursor) constraints.push(startAfter(cursor))
    }
    const snap = await getDocs(query(collection(db, 'products'), ...constraints))
    const lastDoc = snap.docs.at(-1)
    return {
      items: snap.docs.map((d) => normalizeProduct({ id: d.id, ...d.data() })),
      lastDocId: lastDoc?.id ?? null,
    }
  }

  /**
   * Products are stored with their slug as the Firestore document ID to
   * guarantee URL uniqueness at write time (rules also enforce slug regex).
   * We can therefore read by slug with a single direct doc fetch (no index).
   */
  const getBySlug = async (slug: string): Promise<Product | null> => {
    const snap = await getDoc(doc(db, 'products', slug))
    return snap.exists() ? normalizeProduct({ id: snap.id, ...snap.data() }) : null
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
    return snap.docs.map((d) => normalizeProduct({ id: d.id, ...d.data() }))
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
