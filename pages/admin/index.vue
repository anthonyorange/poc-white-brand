<!-- pages/admin/index.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
await navigateTo('/admin/dashboard')
</script>

<template><div /></template>
