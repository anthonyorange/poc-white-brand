<!-- components/ui/ImageGallery.vue -->
<template>
  <div class="flex flex-col gap-3">
    <div class="aspect-square rounded-2xl overflow-hidden bg-surface">
      <img :src="images[active]" :alt="alt" class="w-full h-full object-cover" />
    </div>
    <div v-if="images.length > 1" class="flex gap-2">
      <button
        v-for="(img, i) in images"
        :key="i"
        type="button"
        :class="[
          'w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
          active === i ? 'border-primary' : 'border-transparent opacity-60',
        ]"
        @click="active = i"
      >
        <img :src="img" :alt="`${alt} ${i + 1}`" class="w-full h-full object-cover" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ images: string[]; alt: string }>()
const active = ref(0)
</script>
