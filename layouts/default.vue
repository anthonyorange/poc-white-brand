<!-- layouts/default.vue -->
<template>
  <div class="min-h-screen bg-background font-body">
    <CustomCursor />
    <AppHeader />
    <main class="pt-20">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}
body {
  background: var(--color-background);
}
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
