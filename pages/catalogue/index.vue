<!-- pages/catalogue/index.vue -->
<template>
  <div class="max-w-5xl mx-auto px-6 py-12">
    <RevealOnScroll>
      <h1 class="font-heading text-5xl text-primary text-center mb-4">Collection</h1>
      <p class="font-body text-primary/50 text-center mb-10">{{ products.length }} pièce{{ products.length > 1 ? 's' : '' }}</p>
    </RevealOnScroll>

    <div class="flex justify-center mb-10">
      <CategoryFilter v-model="activeCategory" />
    </div>

    <ProductGrid v-if="filtered.length" :products="filtered" />
    <p v-else class="text-center font-body text-primary/40 py-20">Aucun bijou dans cette catégorie pour le moment.</p>
  </div>
</template>

<script setup lang="ts">
import type { ProductCategory } from '~/composables/useProducts'

const { getAll } = useProducts()
const route = useRoute()
const router = useRouter()
const brand = useBrand()

const VALID_CATS: Array<ProductCategory | 'all'> = ['all', 'bagues', 'colliers', 'bracelets', 'boucles']

// Sanitize query param to prevent reflected values from being used blindly.
// SYM-GR-0003 (input validation).
const parseCategory = (raw: unknown): ProductCategory | 'all' => {
  return VALID_CATS.includes(raw as any) ? (raw as ProductCategory | 'all') : 'all'
}

const activeCategory = ref<ProductCategory | 'all'>(parseCategory(route.query.category))
const products = ref<Awaited<ReturnType<typeof getAll>>>([])

const filtered = computed(() =>
  activeCategory.value === 'all'
    ? products.value
    : products.value.filter(p => p.category === activeCategory.value),
)

onMounted(async () => {
  try {
    products.value = await getAll()
  } catch {
    products.value = []
  }
})

watch(activeCategory, (cat) => {
  router.replace({ query: cat !== 'all' ? { category: cat } : {} })
})

useSeoMeta({
  title: 'Collection — ' + brand.config.value.name,
  description: 'Découvrez tous les bijoux faits main.',
})
</script>
