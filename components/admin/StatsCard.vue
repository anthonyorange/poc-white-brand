<!-- components/admin/StatsCard.vue -->
<template>
  <div class="bg-surface rounded-2xl p-6 border border-accent/20">
    <p class="font-body text-xs text-primary/40 uppercase tracking-wider mb-2">{{ label }}</p>
    <p class="font-heading text-4xl text-primary">{{ value }}</p>
    <p v-if="sub" class="font-body text-xs text-primary/40 mt-1">{{ sub }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string | number; sub?: string }>()
</script>
