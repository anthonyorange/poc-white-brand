<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { init } = useAuth()
const brand = useBrand()

// Default SEO meta: individual pages override via useSeoMeta().
useSeoMeta({
  titleTemplate: (title) => (title ? `${title} — ${brand.config.value.name}` : brand.config.value.name),
  description: () =>
    brand.config.value.texts.heroSubtitle ||
    `${brand.config.value.name} — ${brand.config.value.slogan}`,
  ogType: 'website',
  ogSiteName: () => brand.config.value.name,
  ogLocale: 'fr_FR',
  twitterCard: 'summary_large_image',
})

onMounted(() => init())
</script>
