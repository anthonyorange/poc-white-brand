<!-- components/admin/BrandEditor.vue -->
<template>
  <form class="space-y-6 max-w-lg" @submit.prevent="save">
    <div v-for="field in fields" :key="field.key">
      <label class="font-body text-xs text-primary/50 uppercase tracking-wider block mb-1">{{
        field.label
      }}</label>
      <input
        v-model="form[field.key as keyof typeof form]"
        :type="field.type ?? 'text'"
        :maxlength="field.maxlength ?? 200"
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary"
      />
    </div>

    <div>
      <p class="font-body text-xs text-primary/50 uppercase tracking-wider mb-2">
        Couleur principale
      </p>
      <input
        v-model="form.primaryColor"
        type="color"
        class="w-10 h-10 cursor-pointer rounded border-0"
      />
    </div>

    <p v-if="error" class="font-body text-sm text-red-400">{{ error }}</p>

    <AppButton type="submit" variant="primary" :disabled="saving">
      {{ saving ? 'Enregistrement...' : 'Sauvegarder' }}
    </AppButton>
    <p v-if="saved" class="font-body text-xs text-green-500">Modifications enregistrées ✓</p>
  </form>
</template>

<script setup lang="ts">
const { config, saveToFirestore } = useBrand()
const saving = ref(false)
const saved = ref(false)
const error = ref('')

const form = reactive({
  name: config.value.name,
  slogan: config.value.slogan,
  heroTitle: config.value.texts.heroTitle,
  heroSubtitle: config.value.texts.heroSubtitle,
  aboutSummary: config.value.texts.aboutSummary,
  instagram: config.value.social.instagram,
  primaryColor: config.value.colors.primary,
})

const fields: Array<{ key: keyof typeof form; label: string; type?: string; maxlength?: number }> =
  [
    { key: 'name', label: 'Nom de la marque', maxlength: 80 },
    { key: 'slogan', label: 'Slogan', maxlength: 120 },
    { key: 'heroTitle', label: 'Titre du héros', maxlength: 120 },
    { key: 'heroSubtitle', label: 'Sous-titre du héros', maxlength: 240 },
    { key: 'aboutSummary', label: 'Présentation créatrice', maxlength: 600 },
    { key: 'instagram', label: 'Compte Instagram (handle sans @)', maxlength: 40 },
  ]

// Validate constrained shapes. SYM-GR-0003.
const HANDLE_RE = /^[A-Za-z0-9._-]{0,40}$/
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

const save = async () => {
  error.value = ''
  if (!HANDLE_RE.test(form.instagram)) {
    error.value = 'Handle Instagram invalide.'
    return
  }
  if (!HEX_COLOR_RE.test(form.primaryColor)) {
    error.value = 'Couleur invalide.'
    return
  }

  saving.value = true
  try {
    await saveToFirestore({
      name: form.name,
      slogan: form.slogan,
      texts: {
        heroTitle: form.heroTitle,
        heroSubtitle: form.heroSubtitle,
        aboutSummary: form.aboutSummary,
      },
      social: {
        instagram: form.instagram,
        facebook: config.value.social.facebook,
      },
      colors: { ...config.value.colors, primary: form.primaryColor },
    })
    document.documentElement.style.setProperty('--color-primary', form.primaryColor)
    saved.value = true
    setTimeout(() => {
      saved.value = false
    }, 3000)
  } catch {
    error.value = 'Impossible de sauvegarder.'
  } finally {
    saving.value = false
  }
}
</script>
