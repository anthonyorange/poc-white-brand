// brand.config.ts
export interface BrandConfig {
  name: string
  slogan: string
  logo: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
  }
  fonts: { heading: string; body: string }
  social: { instagram: string; facebook: string }
  texts: { heroTitle: string; heroSubtitle: string; aboutSummary: string }
  adminEmail: string
}

export const defaultBrandConfig: BrandConfig = {
  name: "L'Atelier d'Anaïs",
  slogan: "Bijoux d'auteure faits main",
  logo: '/logo.svg',
  colors: {
    primary: '#6b4c7a',
    secondary: '#a8c4d4',
    accent: '#e8c0d8',
    background: '#fdf8ff',
    surface: '#f5e8ff',
  },
  fonts: { heading: 'Cormorant Garamond', body: 'Inter' },
  social: { instagram: '', facebook: '' },
  texts: {
    heroTitle: 'Des bijoux nés de mes mains',
    heroSubtitle: 'Chaque pièce est unique, créée avec intention',
    aboutSummary:
      "Anaïs crée des bijoux d'auteure depuis 2018, à partir de matériaux soigneusement sélectionnés.",
  },
  adminEmail: '',
}

export function mergeBrandConfig(override: Partial<BrandConfig>): BrandConfig {
  return {
    ...defaultBrandConfig,
    ...override,
    colors: { ...defaultBrandConfig.colors, ...override.colors },
    fonts: { ...defaultBrandConfig.fonts, ...override.fonts },
    social: { ...defaultBrandConfig.social, ...override.social },
    texts: { ...defaultBrandConfig.texts, ...override.texts },
  }
}
