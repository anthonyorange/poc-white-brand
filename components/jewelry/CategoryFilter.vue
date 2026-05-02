<!-- components/jewelry/CategoryFilter.vue -->
<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="cat in categories"
      :key="cat.value"
      type="button"
      :class="[
        'px-4 py-1.5 rounded-full text-sm font-body transition-all',
        modelValue === cat.value
          ? 'bg-primary text-white'
          : 'border border-primary/30 text-primary/60 hover:border-primary hover:text-primary',
      ]"
      @click="$emit('update:modelValue', cat.value)"
    >{{ cat.label }}</button>
  </div>
</template>

<script setup lang="ts">
import type { ProductCategory } from '~/composables/useProducts'

defineProps<{ modelValue: ProductCategory | 'all' }>()
defineEmits<{ 'update:modelValue': [val: ProductCategory | 'all'] }>()

const categories: { value: ProductCategory | 'all'; label: string }[] = [
  { value: 'all',       label: 'Tout voir' },
  { value: 'bagues',    label: 'Bagues' },
  { value: 'colliers',  label: 'Colliers' },
  { value: 'bracelets', label: 'Bracelets' },
  { value: 'boucles',   label: "Boucles d'oreilles" },
]
</script>
