<!-- layouts/admin.vue -->
<template>
  <div class="flex min-h-screen bg-background font-body">
    <AdminSidebar />
    <main class="flex-1 p-8">
      <slot />
    </main>
  </div>
</template>
