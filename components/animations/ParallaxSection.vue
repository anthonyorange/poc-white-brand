<!-- components/animations/ParallaxSection.vue -->
<template>
  <div ref="el" class="parallax-wrapper">
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ speed?: number }>()
const el = ref<HTMLElement>()
const { $gsap, $ScrollTrigger } = useNuxtApp()

onMounted(() => {
  if (!el.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (!$gsap) return
  $gsap.to(el.value, {
    yPercent: props.speed ?? -15,
    ease: 'none',
    scrollTrigger: {
      trigger: el.value,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  })
})

onUnmounted(() => {
  $ScrollTrigger?.getAll().forEach((t) => t.kill())
})
</script>

<style scoped>
.parallax-wrapper {
  will-change: transform;
}
</style>
