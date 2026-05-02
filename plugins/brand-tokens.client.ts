// plugins/brand-tokens.client.ts
export default defineNuxtPlugin(async () => {
  const { config, loadFromFirestore } = useBrand()
  try {
    await loadFromFirestore()
  } catch {
    // Silent fallback to default config; avoid leaking Firestore errors
    // to the client console. SYM-GR-0010
    if (import.meta.dev) console.warn('[brand] using default config')
  }

  const root = document.documentElement
  const c = config.value
  root.style.setProperty('--color-primary', c.colors.primary)
  root.style.setProperty('--color-secondary', c.colors.secondary)
  root.style.setProperty('--color-accent', c.colors.accent)
  root.style.setProperty('--color-background', c.colors.background)
  root.style.setProperty('--color-surface', c.colors.surface)
  root.style.setProperty('--font-heading', `'${c.fonts.heading}', Georgia, serif`)
  root.style.setProperty('--font-body', `'${c.fonts.body}', system-ui, sans-serif`)
})
