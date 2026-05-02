<!-- components/animations/BlobBackground.vue -->
<template>
  <div class="blob-container" aria-hidden="true">
    <div
      v-for="blob in blobs"
      :key="blob.id"
      class="blob animate-blob"
      :style="blob.style"
    />
  </div>
</template>

<script setup lang="ts">
const blobs = [
  {
    id: 1,
    style: {
      width: '400px', height: '400px',
      background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
      top: '-100px', left: '-100px',
      animationDelay: '0s', animationDuration: '10s',
    },
  },
  {
    id: 2,
    style: {
      width: '300px', height: '300px',
      background: 'radial-gradient(circle, var(--color-secondary) 0%, transparent 70%)',
      bottom: '-80px', right: '-80px',
      animationDelay: '-4s', animationDuration: '12s',
    },
  },
  {
    id: 3,
    style: {
      width: '250px', height: '250px',
      background: 'radial-gradient(circle, var(--color-surface) 0%, transparent 70%)',
      top: '40%', right: '10%',
      animationDelay: '-7s', animationDuration: '9s',
    },
  },
]
</script>

<style scoped>
.blob-container {
  position: absolute; inset: 0;
  overflow: hidden; pointer-events: none; z-index: 0;
}
.blob {
  position: absolute; opacity: 0.6;
  filter: blur(40px);
}
</style>
