<!-- pages/admin/settings.vue -->
<template>
  <div>
    <h1 class="font-heading text-3xl text-primary mb-8">Paramètres de la marque</h1>
    <BrandEditor />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
</script>
