<!-- components/admin/ImageUploader.vue -->
<template>
  <div class="space-y-3">
    <!-- Using a <label> + hidden native <input type=file> is the most
         reliable way to trigger the file picker across browsers. Clicking
         the label behaves like clicking the input directly (no programmatic
         .click() dance, no browser heuristics about "invisible" inputs). -->
    <label
      for="image-uploader-input"
      class="focus-ring border-2 border-dashed border-accent/40 rounded-xl p-8 text-center w-full block cursor-pointer hover:border-primary/40 transition-colors"
      :aria-label="`Uploader des images (${modelValue.length}/${MAX_IMAGES} actuelles)`"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <p class="font-body text-sm text-primary/60">Glisser-déposer ou cliquer pour uploader</p>
      <p class="font-body text-xs text-primary/40 mt-1">JPG, PNG, WebP — max 5 Mo par image</p>
    </label>
    <input
      id="image-uploader-input"
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
      class="text-xs font-body text-primary/70 text-center"
    >
      Upload en cours... ({{ pending.length }} fichier{{ pending.length > 1 ? 's' : '' }})
    </div>
    <p
      v-if="error"
      role="alert"
      aria-live="assertive"
      class="text-xs font-body text-red-500 text-center"
    >
      {{ error }}
    </p>

    <ul v-if="modelValue.length || pending.length" class="flex flex-wrap gap-2 list-none p-0">
      <!-- Persisted uploaded images -->
      <li v-for="(url, i) in modelValue" :key="`ok-${url}`" class="relative w-20 h-20">
        <img
          :src="url"
          :alt="`Image ${i + 1}`"
          class="w-full h-full object-cover rounded-lg"
          @error="onImgLoadError(url)"
        />
        <button
          type="button"
          class="focus-ring absolute -top-2 -right-2 w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center"
          :aria-label="`Supprimer l'image ${i + 1}`"
          @click="removeImage(i)"
        >
          <span aria-hidden="true">×</span>
        </button>
      </li>
      <!-- Pending uploads (local blob preview) -->
      <li
        v-for="p in pending"
        :key="`pending-${p.id}`"
        class="relative w-20 h-20"
        aria-label="Upload en cours"
      >
        <img
          :src="p.blobUrl"
          :alt="p.name"
          class="w-full h-full object-cover rounded-lg opacity-60"
        />
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-white text-xs bg-black/60 px-2 py-0.5 rounded">
            {{ p.progress }}%
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [urls: string[]] }>()

// SYM-GR-0003: strict client-side validation. The source of truth for size/type
// stays in Storage rules, but we refuse obvious garbage client-side to fail fast.
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MiB
const MAX_IMAGES = 10

interface PendingUpload {
  id: string
  name: string
  blobUrl: string
  progress: number
}

const uploading = ref(false)
const error = ref('')
const pending = ref<PendingUpload[]>([])

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

// Map Firebase Storage error code → user message (SYM-GR-0010 curated).
const storageErrorMessage = (code: string): string => {
  switch (code) {
    case 'storage/unauthorized':
      return 'Upload refusé par Firebase Storage. Déconnectez-vous et reconnectez-vous pour rafraîchir votre session admin, puis réessayez.'
    case 'storage/canceled':
      return 'Upload annulé.'
    case 'storage/retry-limit-exceeded':
      return 'Trop de tentatives. Vérifiez votre connexion et la config CORS du bucket, puis réessayez.'
    case 'storage/quota-exceeded':
      return "Quota Storage dépassé — contactez l'administrateur Firebase."
    case 'storage/unknown':
      return "Échec de l'upload (erreur réseau ou CORS). Ouvrez la console navigateur pour les détails."
    default:
      return code
        ? `Échec de l'upload (${code}). Vérifiez votre connexion et rechargez la page.`
        : "Échec de l'upload. Vérifiez votre connexion."
  }
}

const upload = async (files: FileList) => {
  error.value = ''
  const currentCount = props.modelValue.length + pending.value.length
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

  // Create local previews IMMEDIATELY (synchronously) so admins see a
  // thumbnail even while firebase/storage SDK is still loading. This is
  // especially important on the first upload of a session, where the
  // dynamic import of firebase/storage can take several seconds.
  // SYM-GR-0019 UX baseline.
  const items: Array<PendingUpload & { file: File }> = Array.from(files).map((file) => ({
    id: crypto.randomUUID(),
    name: file.name,
    blobUrl: URL.createObjectURL(file),
    progress: 0,
    file,
  }))
  for (const it of items) {
    pending.value.push({ id: it.id, name: it.name, blobUrl: it.blobUrl, progress: 0 })
  }

  try {
    const storage = await useFirebaseStorage()
    const uploadedUrls: string[] = []

    // Upload items sequentially to keep the UI feedback simple.
    for (const item of items) {
      try {
        const safeName = sanitizeFilename(item.name)
        const path = `products/${Date.now()}-${crypto.randomUUID()}-${safeName}`
        const task = uploadBytesResumable(storageRef(storage, path), item.file, {
          contentType: item.file.type,
        })

        // Live progress so the admin doesn't wonder if something is happening.
        task.on('state_changed', (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
          const pendingItem = pending.value.find((p) => p.id === item.id)
          if (pendingItem) pendingItem.progress = pct
        })

        const snap = await task
        uploadedUrls.push(await getDownloadURL(snap.ref))
      } finally {
        URL.revokeObjectURL(item.blobUrl)
        pending.value = pending.value.filter((p) => p.id !== item.id)
      }
    }

    if (uploadedUrls.length > 0) {
      emit('update:modelValue', [...props.modelValue, ...uploadedUrls])
    }
  } catch (e) {
    const code = (e as { code?: string })?.code ?? ''
    error.value = storageErrorMessage(code)
    if (import.meta.dev) console.error('[ImageUploader] upload failed:', e)
    // On failure, clean up any still-pending blobs to avoid a zombie UI.
    for (const it of items) {
      if (pending.value.find((p) => p.id === it.id)) {
        URL.revokeObjectURL(it.blobUrl)
        pending.value = pending.value.filter((p) => p.id !== it.id)
      }
    }
  } finally {
    uploading.value = false
  }
}

// Surface broken image URLs stored in Firestore (e.g. from a failed older
// upload where only the URL was stored but Storage has no file).
const onImgLoadError = (url: string) => {
  if (import.meta.dev) console.warn('[ImageUploader] Image failed to load:', url)
}

const onFiles = (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (import.meta.dev) {
    console.log(
      '[ImageUploader] onFiles:',
      files?.length ?? 0,
      'file(s) selected',
      files ? Array.from(files).map((f) => `${f.name} (${f.type}, ${f.size}B)`) : [],
    )
  }
  if (files && files.length > 0) upload(files)
  // Reset so the same file can be re-selected later.
  input.value = ''
}

const onDrop = (e: DragEvent) => {
  if (import.meta.dev) {
    console.log('[ImageUploader] onDrop:', e.dataTransfer?.files?.length ?? 0, 'file(s)')
  }
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    upload(e.dataTransfer.files)
  }
}

const removeImage = (i: number) => {
  const updated = [...props.modelValue]
  updated.splice(i, 1)
  emit('update:modelValue', updated)
}

// Expose `uploading` so parent forms can disable their submit button while
// an upload is in progress (prevents creating a product without images).
defineExpose({ uploading })
</script>
