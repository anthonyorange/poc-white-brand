<!-- pages/creatrice.vue -->
<template>
  <div>
    <section class="relative py-32 px-6 overflow-hidden">
      <BlobBackground />
      <div class="relative z-10 max-w-2xl mx-auto text-center">
        <RevealOnScroll>
          <h1 class="font-heading text-6xl text-primary mb-6">La Créatrice</h1>
          <p class="font-body text-primary/60 leading-relaxed text-lg">
            {{ brand.config.value.texts.aboutSummary }}
          </p>
        </RevealOnScroll>
      </div>
    </section>

    <section class="py-24 px-6 max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
      <RevealOnScroll>
        <div class="aspect-square rounded-3xl bg-gradient-to-br from-accent/40 to-secondary/30" />
      </RevealOnScroll>
      <RevealOnScroll>
        <h2 class="font-heading text-3xl text-primary mb-6">Mon atelier, mon univers</h2>
        <p class="font-body text-primary/60 leading-relaxed">
          Chaque bijou naît d'une intention, d'une matière qui me parle, d'un geste répété jusqu'à
          la perfection. Je travaille avec des métaux précieux et des pierres naturelles, en petites
          séries ou en pièces uniques.
        </p>
      </RevealOnScroll>
    </section>
  </div>
</template>

<script setup lang="ts">
const brand = useBrand()
useSeoMeta({ title: `La Créatrice — ${brand.config.value.name}` })
</script>
