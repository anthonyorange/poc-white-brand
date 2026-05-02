<!-- components/ui/AppButton.vue -->
<template>
  <button
    :class="[
      'inline-flex items-center justify-center gap-2 font-body text-sm transition-all duration-200 disabled:opacity-50',
      variants[variant ?? 'primary'],
    ]"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{ variant?: 'primary' | 'ghost' | 'outline' }>()

const variants = {
  primary: 'bg-primary text-white px-6 py-3 rounded-full hover:opacity-90 shadow-md shadow-primary/20',
  ghost:   'text-primary/70 px-4 py-2 hover:text-primary',
  outline: 'border border-primary text-primary px-6 py-3 rounded-full hover:bg-primary hover:text-white',
}
</script>
