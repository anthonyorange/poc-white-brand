<!-- pages/contact.vue -->
<template>
  <div class="max-w-lg mx-auto px-6 py-24">
    <RevealOnScroll>
      <h1 class="font-heading text-5xl text-primary text-center mb-4">Contact</h1>
      <p class="font-body text-primary/50 text-center mb-12">
        Une question, une commande sur mesure ?
      </p>
    </RevealOnScroll>

    <form v-if="!sent" class="flex flex-col gap-5" @submit.prevent="submit">
      <input
        v-model="form.name"
        required
        maxlength="100"
        placeholder="Votre nom"
        autocomplete="name"
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary transition-colors"
      />
      <input
        v-model="form.email"
        type="email"
        required
        maxlength="200"
        placeholder="Votre email"
        autocomplete="email"
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary transition-colors"
      />
      <textarea
        v-model="form.content"
        required
        rows="5"
        maxlength="2000"
        placeholder="Votre message"
        class="w-full border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary transition-colors resize-none"
      />
      <p v-if="error" class="font-body text-sm text-red-400 text-center">{{ error }}</p>
      <AppButton type="submit" variant="primary" :disabled="loading">
        {{ loading ? 'Envoi...' : 'Envoyer' }}
      </AppButton>
      <p class="text-center font-body text-xs text-primary/30">
        En envoyant ce formulaire, vous acceptez que votre email soit utilisé uniquement pour vous
        répondre (SYM-GR-0003).
      </p>
    </form>

    <div v-else class="text-center py-12">
      <p class="font-heading text-2xl text-primary mb-3">Message envoyé ✨</p>
      <p class="font-body text-primary/50">Je vous réponds très vite.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { addDoc, collection } from 'firebase/firestore'

const db = useFirestore()
const form = reactive({ name: '', email: '', content: '' })
const sent = ref(false)
const loading = ref(false)
const error = ref('')

// Very basic but defense-in-depth validation; real validation is in Firestore rules
// (SYM-GR-0003, SYM-GR-0019). Client validation prevents obvious trash submissions.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Lightweight client-side rate limit to deter casual spam (not a security control).
const LAST_SUBMIT_KEY = 'contact:lastSubmit'
const MIN_INTERVAL_MS = 10_000

const submit = async () => {
  error.value = ''
  const name = form.name.trim()
  const email = form.email.trim()
  const content = form.content.trim()

  if (name.length < 2 || name.length > 100) {
    error.value = 'Nom invalide.'
    return
  }
  if (!EMAIL_RE.test(email) || email.length > 200) {
    error.value = 'Email invalide.'
    return
  }
  if (content.length < 5 || content.length > 2000) {
    error.value = 'Message trop court ou trop long.'
    return
  }

  if (import.meta.client) {
    const last = Number(localStorage.getItem(LAST_SUBMIT_KEY) ?? 0)
    if (Date.now() - last < MIN_INTERVAL_MS) {
      error.value = 'Merci de patienter quelques secondes avant de renvoyer un message.'
      return
    }
  }

  loading.value = true
  try {
    await addDoc(collection(db, 'messages'), {
      name,
      email,
      content,
      createdAt: new Date(),
      read: false,
    })
    if (import.meta.client) {
      localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now()))
    }
    sent.value = true
  } catch {
    // Don't leak backend error details to end-users. SYM-GR-0010.
    error.value = "Impossible d'envoyer le message pour l'instant."
  } finally {
    loading.value = false
  }
}
</script>
