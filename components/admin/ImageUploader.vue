<!-- components/admin/ImageUploader.vue -->
<template>
  <div class="space-y-3">
    <button
      type="button"
      class="focus-ring border-2 border-dashed border-accent/40 rounded-xl p-8 text-center w-full cursor-pointer hover:border-primary/40 transition-colors"
      :aria-label="`Uploader des images (${modelValue.length}/${MAX_IMAGES} actuelles)`"
      @click="fileInput?.click()"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <p class="font-body text-sm text-primary/60">Glisser-déposer ou cliquer pour uploader</p>
      <p class="font-body text-xs text-primary/40 mt-1">JPG, PNG, WebP — max 5 Mo par image</p>
    </button>
    <input
      ref="fileInput"
      type="file"
      :accept="ACCEPTED_TYPES.join(',')"
      multiple
      class="sr-only"
      @change="onFiles"
    />

    <div
      v-if="uploading"
      role="status"
      aria-live="polite"
      class="text-xs font-body text-primary/60 text-center"
    >
      Upload en cours...
    </div>
    <p
      v-if="error"
      role="alert"
      aria-live="assertive"
      class="text-xs font-body text-red-500 text-center"
    >
      {{ error }}
    </p>

    <ul v-if="modelValue.length" class="flex flex-wrap gap-2 list-none p-0">
      <li v-for="(url, i) in modelValue" :key="url" class="relative w-20 h-20">
        <img :src="url" :alt="`Image ${i + 1}`" class="w-full h-full object-cover rounded-lg" />
        <button
          type="button"
          class="focus-ring absolute -top-2 -right-2 w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center"
          :aria-label="`Supprimer l'image ${i + 1}`"
          @click="removeImage(i)"
        >
          <span aria-hidden="true">×</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [urls: string[]] }>()

// SYM-GR-0003: strict client-side validation. The source of truth for size/type
// stays in Storage rules, but we refuse obvious garbage client-side to fail fast.
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MiB
const MAX_IMAGES = 10

const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
const error = ref('')

// Remove path traversal risk in filenames by keeping only basename + safe chars.
const sanitizeFilename = (name: string): string => {
  const base = name.split(/[\\/]/).pop() ?? 'image'
  return base.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80)
}

const validateFile = (file: File): string | null => {
  if (!ACCEPTED_TYPES.includes(file.type)) return `Type non supporté : ${file.name}`
  if (file.size > MAX_SIZE) return `Fichier trop volumineux : ${file.name}`
  if (file.size === 0) return `Fichier vide : ${file.name}`
  return null
}

const upload = async (files: FileList) => {
  error.value = ''
  const currentCount = props.modelValue.length
  if (currentCount + files.length > MAX_IMAGES) {
    error.value = `Maximum ${MAX_IMAGES} images par produit.`
    return
  }

  // Pre-validate everything before starting any upload.
  for (const file of Array.from(files)) {
    const err = validateFile(file)
    if (err) {
      error.value = err
      return
    }
  }

  uploading.value = true
  try {
    const storage = await useFirebaseStorage()
    const urls: string[] = []

    for (const file of Array.from(files)) {
      const safeName = sanitizeFilename(file.name)
      const path = `products/${Date.now()}-${crypto.randomUUID()}-${safeName}`
      const snap = await uploadBytes(storageRef(storage, path), file, {
        contentType: file.type,
      })
      urls.push(await getDownloadURL(snap.ref))
    }

    emit('update:modelValue', [...props.modelValue, ...urls])
  } catch {
    error.value = "Échec de l'upload. Vérifiez votre connexion."
  } finally {
    uploading.value = false
  }
}

const onFiles = (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (files && files.length > 0) upload(files)
  // Reset so same file can be re-selected later
  input.value = ''
}

const onDrop = (e: DragEvent) => {
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    upload(e.dataTransfer.files)
  }
}

const removeImage = (i: number) => {
  const updated = [...props.modelValue]
  updated.splice(i, 1)
  emit('update:modelValue', updated)
}
</script>
