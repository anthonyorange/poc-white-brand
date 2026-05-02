<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const brand = useBrand()

// Default SEO meta: individual pages override via useSeoMeta().
useSeoMeta({
  titleTemplate: (title) =>
    title ? `${title} — ${brand.config.value.name}` : brand.config.value.name,
  description: () =>
    brand.config.value.texts.heroSubtitle ||
    `${brand.config.value.name} — ${brand.config.value.slogan}`,
  ogType: 'website',
  ogSiteName: () => brand.config.value.name,
  ogLocale: 'fr_FR',
  twitterCard: 'summary_large_image',
})

// Lazy init Auth: only on admin routes, so public visitors never download
// the firebase/auth SDK. SYM-GR-0019.
const route = useRoute()
const { init } = useAuth()

const maybeInitAuth = () => {
  if (route.path.startsWith('/admin')) init()
}

onMounted(() => {
  maybeInitAuth()
})

// Also handle navigating from a public page into /admin without full reload.
watch(
  () => route.path,
  (p) => {
    if (p.startsWith('/admin')) init()
  },
)
</script>
