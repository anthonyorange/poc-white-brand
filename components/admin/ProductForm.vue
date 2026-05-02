<!-- components/admin/ProductForm.vue -->
<template>
  <form class="space-y-5 max-w-xl" @submit.prevent="onSubmit">
    <div>
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1"
        >Nom</label
      >
      <input
        v-model="form.name"
        required
        maxlength="120"
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary"
        @input="autoSlug"
      />
    </div>

    <div>
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1"
        >Slug URL</label
      >
      <input
        v-model="form.slug"
        required
        maxlength="120"
        pattern="[a-z0-9-]+"
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary"
      />
      <p class="text-xs font-body text-primary/30 mt-1">
        Lettres minuscules, chiffres et tirets uniquement.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1"
          >Prix (€)</label
        >
        <input
          v-model.number="form.price"
          type="number"
          required
          min="0"
          max="100000"
          step="0.01"
          class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary"
        />
      </div>
      <div>
        <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1"
          >Stock</label
        >
        <input
          v-model.number="form.stock"
          type="number"
          required
          min="0"
          max="100000"
          class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary"
        />
      </div>
    </div>

    <div>
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1"
        >Catégorie</label
      >
      <select
        v-model="form.category"
        required
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary"
      >
        <option value="bagues">Bagues</option>
        <option value="colliers">Colliers</option>
        <option value="bracelets">Bracelets</option>
        <option value="boucles">Boucles d'oreilles</option>
      </select>
    </div>

    <div>
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1"
        >Description</label
      >
      <textarea
        v-model="form.description"
        rows="4"
        required
        maxlength="4000"
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary resize-none"
      />
    </div>

    <div>
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-2"
        >Photos</label
      >
      <ImageUploader v-model="form.images" />
    </div>

    <label class="flex items-center gap-3 cursor-pointer">
      <input v-model="form.featured" type="checkbox" class="accent-primary w-4 h-4" />
      <span class="font-body text-sm text-primary/70">Mettre en avant sur l'accueil</span>
    </label>

    <p v-if="error" class="font-body text-sm text-red-400">{{ error }}</p>

    <AppButton type="submit" variant="primary" :disabled="loading">
      {{ loading ? 'Enregistrement...' : (submitLabel ?? 'Enregistrer') }}
    </AppButton>
  </form>
</template>

<script setup lang="ts">
import type { Product, ProductCategory } from '~/composables/useProducts'

const props = defineProps<{
  initial?: Partial<Product>
  submitLabel?: string
  loading?: boolean
}>()
const emit = defineEmits<{ submit: [data: Omit<Product, 'id'>] }>()

const form = reactive<Omit<Product, 'id'>>({
  name: props.initial?.name ?? '',
  slug: props.initial?.slug ?? '',
  description: props.initial?.description ?? '',
  price: props.initial?.price ?? 0,
  stock: props.initial?.stock ?? 1,
  category: (props.initial?.category as ProductCategory) ?? 'bagues',
  images: props.initial?.images ?? [],
  featured: props.initial?.featured ?? false,
})

const error = ref('')

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    // Strip diacritics
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)

const autoSlug = () => {
  // Only auto-fill slug if user hasn't provided an explicit one originally
  if (!props.initial?.slug) {
    form.slug = slugify(form.name)
  }
}

const onSubmit = () => {
  error.value = ''
  // Re-validate before emitting (defense in depth; HTML pattern isn't enough).
  if (!/^[a-z0-9-]{1,120}$/.test(form.slug)) {
    error.value = 'Slug invalide.'
    return
  }
  if (form.price < 0 || form.stock < 0) {
    error.value = 'Prix et stock doivent être positifs.'
    return
  }
  emit('submit', { ...form })
}
</script>
