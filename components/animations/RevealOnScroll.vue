<!-- components/animations/RevealOnScroll.vue -->
<template>
  <div ref="el" class="reveal-wrapper">
    <slot />
  </div>
</template>

<script setup lang="ts">
const el = ref<HTMLElement>()
const nuxtApp = useNuxtApp() as any

onMounted(() => {
  if (!el.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const $gsap = nuxtApp.$gsap
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
  const $ScrollTrigger = nuxtApp.$ScrollTrigger
  $ScrollTrigger?.getAll().forEach((t: any) => t.kill())
})
</script>
