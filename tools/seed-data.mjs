#!/usr/bin/env node
/**
 * tools/seed-data.mjs
 *
 * Seed sample products and a default brand config into Firestore for local
 * or preview environments. Safe to re-run: uses deterministic doc IDs
 * (slug-as-id) and --force is required to overwrite existing docs.
 *
 * Usage:
 *   node tools/seed-data.mjs               # create only if missing
 *   node tools/seed-data.mjs --force       # overwrite existing docs
 *   node tools/seed-data.mjs --brand-only  # only seed config/brand
 *   node tools/seed-data.mjs --products-only
 *
 * Prerequisites:
 *   - service-account.json at the project root (gitignored)
 *     Download: Firebase Console → Project settings → Service accounts →
 *     Generate new private key.
 *
 * Notes:
 *   - Images use Unsplash source URLs with specific photo IDs so they remain
 *     stable. In production, replace them with images uploaded to your own
 *     Firebase Storage bucket.
 *   - The script is idempotent by default (skip-if-exists). Destructive
 *     operations require --force to prevent accidents (SYM-GR-0019).
 */

import admin from 'firebase-admin'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { argv, exit } from 'node:process'

const SERVICE_ACCOUNT_PATH = resolve(process.env.SERVICE_ACCOUNT_PATH ?? './service-account.json')

if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(
    `\n❌ Service account JSON not found at ${SERVICE_ACCOUNT_PATH}\n` +
      `   See tools/README.md for download instructions.\n`,
  )
  exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'))),
})

const db = admin.firestore()

const args = new Set(argv.slice(2))
const FORCE = args.has('--force')
const BRAND_ONLY = args.has('--brand-only')
const PRODUCTS_ONLY = args.has('--products-only')

// ---------------------------------------------------------------------------
// Brand config — matches the BrandConfig interface in brand.config.ts
// ---------------------------------------------------------------------------

const brandConfig = {
  name: "L'Atelier d'Anaïs",
  slogan: 'Bijoux faits main en pièces uniques',
  colors: {
    primary: '#6b4c7a',
    secondary: '#a8c4d4',
    accent: '#e8c0d8',
    background: '#fdf8ff',
    surface: '#f5e8ff',
  },
  fonts: {
    heading: 'Cormorant Garamond',
    body: 'Inter',
  },
  texts: {
    heroTitle: 'Des bijoux qui racontent une histoire',
    heroSubtitle:
      'Chaque pièce est façonnée à la main dans mon atelier, avec des matières nobles et une attention particulière aux détails.',
    aboutSummary:
      "Passionnée depuis toujours par l'orfèvrerie, j'ai ouvert mon atelier en 2019 pour donner vie à des créations uniques. Argent 925, or 18 carats, pierres naturelles : chaque matière est choisie avec soin pour sa beauté et sa durabilité.",
  },
  social: {
    instagram: 'atelier.anais.bijoux',
    facebook: '',
  },
}

// ---------------------------------------------------------------------------
// Sample products — slug-as-doc-ID matches useProducts.create() invariant.
// Categories must be in ['bagues', 'colliers', 'bracelets', 'boucles'].
// ---------------------------------------------------------------------------

const products = [
  {
    slug: 'bague-nuit-etoilee',
    name: 'Bague Nuit Étoilée',
    description:
      "Une bague en argent 925 ornée d'une pierre de lune taillée en cabochon. Chaque pièce est unique, les reflets varient avec la lumière.\n\nAnneau ajustable.",
    price: 120,
    stock: 3,
    category: 'bagues',
    images: [
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800',
      'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800',
    ],
    featured: true,
  },
  {
    slug: 'bague-pivoine',
    name: 'Bague Pivoine',
    description:
      "Bague en vermeil (argent 925 plaqué or 18k) sertie d'une perle de culture d'eau douce. Délicate et intemporelle.\n\nTaille unique : 54.",
    price: 85,
    stock: 5,
    category: 'bagues',
    images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800'],
    featured: false,
  },
  {
    slug: 'collier-source',
    name: 'Collier Source',
    description:
      'Collier en argent 925 avec pendentif goutte en labradorite. Chaîne ajustable entre 40 et 45 cm.\n\nLes reflets bleus-verts de la labradorite évoquent une source claire au petit matin.',
    price: 160,
    stock: 2,
    category: 'colliers',
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
      'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800',
    ],
    featured: true,
  },
  {
    slug: 'collier-lune-croissant',
    name: 'Collier Lune Croissant',
    description:
      'Un fin collier en or 18 carats avec un pendentif lune. Sobre, à porter tous les jours.\n\nChaîne 42 cm.',
    price: 240,
    stock: 1,
    category: 'colliers',
    images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800'],
    featured: false,
  },
  {
    slug: 'bracelet-jonc-feuille',
    name: 'Bracelet Jonc Feuille',
    description:
      'Jonc ouvert en argent 925 martelé, terminé par deux feuilles ciselées. Ajustable à tous les poignets.',
    price: 95,
    stock: 4,
    category: 'bracelets',
    images: ['https://images.unsplash.com/photo-1616661546394-8e3c3e9a1e6c?w=800'],
    featured: true,
  },
  {
    slug: 'bracelet-tresse',
    name: 'Bracelet Tressé',
    description: 'Trois fils d’argent 925 tressés à la main. Fermoir en T. Longueur 18 cm.',
    price: 70,
    stock: 0, // Épuisé — pour tester l'affichage "Épuisé"
    category: 'bracelets',
    images: ['https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=800'],
    featured: false,
  },
  {
    slug: 'boucles-goutte-de-rosee',
    name: 'Boucles Goutte de Rosée',
    description:
      "Boucles d'oreilles pendantes en argent 925, ornées de petits quartz rose taillés en poire. Tiges clous. Longueur 3 cm.",
    price: 78,
    stock: 6,
    category: 'boucles',
    images: ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800'],
    featured: false,
  },
  {
    slug: 'boucles-puces-lune',
    name: 'Boucles Puces Lune',
    description:
      "Petites puces d'oreilles en or jaune 18 carats en forme de lune. Minimales, élégantes.",
    price: 145,
    stock: 3,
    category: 'boucles',
    images: ['https://images.unsplash.com/photo-1635767582909-345b1c28cff8?w=800'],
    featured: true,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = admin.firestore.FieldValue.serverTimestamp()

const seedBrand = async () => {
  const ref = db.doc('config/brand')
  const existing = await ref.get()
  if (existing.exists && !FORCE) {
    console.log('ℹ config/brand already exists — skipped (use --force to overwrite)')
    return
  }
  await ref.set(brandConfig, { merge: true })
  console.log(`✓ config/brand seeded (name="${brandConfig.name}")`)
}

const seedProducts = async () => {
  let created = 0
  let skipped = 0
  for (const product of products) {
    const ref = db.doc(`products/${product.slug}`)
    const existing = await ref.get()
    if (existing.exists && !FORCE) {
      skipped++
      continue
    }
    await ref.set(
      { ...product, createdAt: now, updatedAt: now },
      { merge: false }, // full overwrite on --force, fresh create otherwise
    )
    created++
    console.log(`✓ products/${product.slug}  (${product.category}, ${product.price}€)`)
  }
  console.log(
    `\nSummary: ${created} product${created > 1 ? 's' : ''} created, ` +
      `${skipped} skipped (already exist — use --force to overwrite).`,
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
  if (BRAND_ONLY && PRODUCTS_ONLY) {
    console.error('❌ Cannot combine --brand-only and --products-only.')
    exit(1)
  }

  console.log(
    `\nSeeding into project: ${admin.app().options.credential.projectId ?? '<unknown>'}\n`,
  )

  if (!PRODUCTS_ONLY) await seedBrand()
  if (!BRAND_ONLY) await seedProducts()

  console.log('\n✨ Done.')
}

main().catch((e) => {
  console.error(`❌ Seeding failed: ${e.message}`)
  exit(1)
})
