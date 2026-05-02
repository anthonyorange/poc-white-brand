<!-- layouts/default.vue -->
<template>
  <div class="min-h-screen bg-background font-body">
    <a href="#main-content" class="skip-link">Aller au contenu</a>
    <CustomCursor />
    <AppHeader />
    <main id="main-content" class="pt-20" tabindex="-1">
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
