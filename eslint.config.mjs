// eslint.config.mjs
// Nuxt 3 flat config. The @nuxt/eslint module auto-generates most rules.
// We extend with Prettier to avoid stylistic conflicts.
import withNuxt from './.nuxt/eslint.config.mjs'
import prettier from 'eslint-config-prettier'

export default withNuxt(
  {
    rules: {
      // Allow single-word component names in pages/layouts (Nuxt convention)
      'vue/multi-word-component-names': 'off',
      // Allow named exports without default for composables
      'import/no-unresolved': 'off',
    },
  },
  prettier,
)
