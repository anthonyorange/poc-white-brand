<!-- components/ui/ImageGallery.vue -->
<template>
  <div class="flex flex-col gap-3">
    <div class="aspect-square rounded-2xl overflow-hidden bg-surface">
      <NuxtImg
        :src="images[active]"
        :alt="alt"
        class="w-full h-full object-cover"
        sizes="sm:100vw md:50vw lg:600px"
        format="webp"
        fit="cover"
        loading="eager"
      />
    </div>
    <div
      v-if="images.length > 1"
      role="tablist"
      :aria-label="`Miniatures ${alt}`"
      class="flex gap-2"
    >
      <button
        v-for="(img, i) in images"
        :key="img"
        type="button"
        role="tab"
        :aria-selected="active === i"
        :aria-label="`Voir image ${i + 1} sur ${images.length}`"
        :class="[
          'focus-ring w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
          active === i ? 'border-primary' : 'border-transparent opacity-60',
        ]"
        @click="active = i"
      >
        <NuxtImg
          :src="img"
          :alt="''"
          class="w-full h-full object-cover"
          width="64"
          height="64"
          format="webp"
          fit="cover"
          loading="lazy"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ images: string[]; alt: string }>()
const active = ref(0)
</script>
