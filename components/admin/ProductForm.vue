<!-- components/admin/ProductForm.vue -->
<template>
  <form class="space-y-5 max-w-xl" @submit.prevent="onSubmit">
    <div>
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1">
        Nom
      </label>
      <input
        v-model="form.name"
        required
        maxlength="120"
        class="focus-ring w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary"
        @input="autoSlug"
      />
    </div>

    <div>
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1">
        Slug URL
      </label>
      <input
        v-model="form.slug"
        required
        maxlength="120"
        pattern="[a-z0-9-]+"
        :disabled="!!props.initial?.slug"
        class="focus-ring w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
      />
      <p class="text-xs font-body text-primary/50 mt-1">
        Lettres minuscules, chiffres et tirets uniquement. Ne peut pas être modifié après création
        (URL du produit).
      </p>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1">
          Prix (€)
        </label>
        <input
          v-model.number="form.price"
          type="number"
          required
          min="0"
          max="100000"
          step="0.01"
          class="focus-ring w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary"
        />
      </div>
      <div>
        <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1">
          Stock
        </label>
        <input
          v-model.number="form.stock"
          type="number"
          required
          min="0"
          max="100000"
          class="focus-ring w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary"
        />
      </div>
    </div>

    <div>
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1">
        Catégorie
      </label>
      <select
        v-model="form.category"
        required
        class="focus-ring w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary"
      >
        <option value="bagues">Bagues</option>
        <option value="colliers">Colliers</option>
        <option value="bracelets">Bracelets</option>
        <option value="boucles">Boucles d'oreilles</option>
      </select>
    </div>

    <div>
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1">
        Description
      </label>
      <textarea
        v-model="form.description"
        rows="4"
        required
        maxlength="4000"
        class="focus-ring w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary resize-none"
      />
    </div>

    <div>
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-2">
        Photos
      </label>
      <ImageUploader ref="uploaderRef" v-model="form.images" />
    </div>

    <label class="flex items-center gap-3 cursor-pointer">
      <input v-model="form.featured" type="checkbox" class="accent-primary w-4 h-4" />
      <span class="font-body text-sm text-primary/70">Mettre en avant sur l'accueil</span>
    </label>

    <p v-if="error" role="alert" aria-live="assertive" class="font-body text-sm text-red-500">
      {{ error }}
    </p>

    <p
      v-if="uploadInProgress"
      role="status"
      aria-live="polite"
      class="font-body text-xs text-primary/70"
    >
      Un upload d'image est en cours — le bouton s'activera une fois terminé.
    </p>

    <AppButton type="submit" variant="primary" :disabled="submitDisabled">
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

// Ref to the uploader component so we can read its `uploading` state and
// block the submit while files are being transferred. Prevents the
// well-known mistake of clicking "Créer" before the upload finishes and
// ending up with a product that has no images (SYM-GR-0019).
const uploaderRef = ref<{ uploading: Ref<boolean> } | null>(null)

const uploadInProgress = computed(() => uploaderRef.value?.uploading.value ?? false)

const submitDisabled = computed(() => !!props.loading || uploadInProgress.value)

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
  if (uploadInProgress.value) {
    error.value = 'Un upload est en cours, merci de patienter.'
    return
  }
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
