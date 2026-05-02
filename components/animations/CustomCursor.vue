<!-- components/animations/CustomCursor.vue -->
<template>
  <div
    ref="cursor"
    class="custom-cursor"
    :style="{ left: `${x}px`, top: `${y}px` }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
const x = ref(-100)
const y = ref(-100)
const cursor = ref<HTMLElement>()

const onMove = (e: MouseEvent) => {
  x.value = e.clientX
  y.value = e.clientY
}

onMounted(() => {
  window.addEventListener('mousemove', onMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMove)
})
</script>

<style scoped>
.custom-cursor {
  position: fixed;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--color-accent), var(--color-primary));
  opacity: 0.5;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 9999;
  transition: transform 0.1s ease;
  mix-blend-mode: multiply;
  animation: cursor-pulse 2s ease-in-out infinite;
}

@media (pointer: coarse) {
  .custom-cursor {
    display: none;
  }
}
</style>
