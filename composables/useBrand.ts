// composables/useBrand.ts
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { defaultBrandConfig, mergeBrandConfig, type BrandConfig } from '~/brand.config'

export const useBrand = () => {
  const config = useState<BrandConfig>('brand', () => defaultBrandConfig)

  const loadFromFirestore = async () => {
    const { $firebase } = useNuxtApp()
    const snap = await getDoc(doc($firebase.db, 'config', 'brand'))
    if (snap.exists()) {
      config.value = mergeBrandConfig(snap.data() as Partial<BrandConfig>)
    }
  }

  const saveToFirestore = async (data: Partial<BrandConfig>) => {
    const { $firebase } = useNuxtApp()
    await setDoc(doc($firebase.db, 'config', 'brand'), data, { merge: true })
    config.value = mergeBrandConfig(data)
  }

  return { config, loadFromFirestore, saveToFirestore }
}
