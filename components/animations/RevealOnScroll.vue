<!-- components/animations/RevealOnScroll.vue -->
<template>
  <div ref="el" class="reveal-wrapper">
    <slot />
  </div>
</template>

<script setup lang="ts">
const el = ref<HTMLElement>()
const { $gsap, $ScrollTrigger } = useNuxtApp()

onMounted(() => {
  if (!el.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (!$gsap) return
  $gsap.from(el.value, {
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: el.value,
      start: 'top 85%',
      once: true,
    },
  })
})

onUnmounted(() => {
  $ScrollTrigger?.getAll().forEach((t) => t.kill())
})
</script>
