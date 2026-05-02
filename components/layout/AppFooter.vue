<!-- components/layout/AppFooter.vue -->
<template>
  <footer class="mt-24 py-12 px-6 border-t border-accent/20 bg-surface/50">
    <div class="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <p class="font-heading text-lg text-primary">{{ brand.config.value.name }}</p>
      <p class="font-body text-sm text-primary/50 italic">{{ brand.config.value.slogan }}</p>
      <div class="flex gap-4 text-sm font-body text-primary/60">
        <a
          v-if="igHandle"
          :href="`https://instagram.com/${igHandle}`"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-primary transition-colors"
          >Instagram</a
        >
        <a
          v-if="fbHandle"
          :href="`https://facebook.com/${fbHandle}`"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-primary transition-colors"
          >Facebook</a
        >
      </div>
    </div>
    <p class="text-center font-body text-xs text-primary/30 mt-8">
      © {{ new Date().getFullYear() }} {{ brand.config.value.name }}
    </p>
  </footer>
</template>

<script setup lang="ts">
const brand = useBrand()

// Sanitize social handles to prevent injection via brand config
// (SYM-GR-0003: only allow expected handle shape [A-Za-z0-9._-])
const safeHandle = (h: string) => (/^[A-Za-z0-9._-]{1,40}$/.test(h) ? h : '')

const igHandle = computed(() => safeHandle(brand.config.value.social.instagram))
const fbHandle = computed(() => safeHandle(brand.config.value.social.facebook))
</script>
