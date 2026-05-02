// tests/composables/useBrand.test.ts
import { describe, it, expect } from 'vitest'
import { mergeBrandConfig, type BrandConfig } from '~/brand.config'

describe('mergeBrandConfig', () => {
  it('retourne la config par défaut si aucun override', () => {
    const result = mergeBrandConfig({})
    expect(result.name).toBe("L'Atelier d'Anaïs")
    expect(result.colors.primary).toBe('#6b4c7a')
  })

  it("écrase les champs fournis dans l'override", () => {
    const result = mergeBrandConfig({ name: 'Autre Marque' })
    expect(result.name).toBe('Autre Marque')
    expect(result.colors.primary).toBe('#6b4c7a')
  })

  it('fusionne les couleurs partielles', () => {
    const result = mergeBrandConfig({ colors: { primary: '#ff0000' } as BrandConfig['colors'] })
    expect(result.colors.primary).toBe('#ff0000')
    expect(result.colors.secondary).toBe('#a8c4d4')
  })
})
