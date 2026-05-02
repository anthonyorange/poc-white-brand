#!/usr/bin/env node
/**
 * tools/deploy-rules.mjs
 *
 * Deploy Firestore (and optionally Storage) security rules + Firestore
 * composite indexes without needing the full firebase CLI permissions.
 * Uses the firebaserules.googleapis.com + firestore.googleapis.com REST
 * APIs via google-auth-library + a service account.
 *
 * Why not `firebase deploy`? The CLI tries to verify that the Firestore
 * API is enabled via serviceusage.googleapis.com, which needs a
 * `roles/serviceusage.serviceUsageConsumer` IAM binding that the default
 * firebase-adminsdk service account doesn't have. This script calls the
 * rules + admin APIs directly, which only requires
 * `roles/firebaserules.admin` + `roles/datastore.indexAdmin` (both granted
 * by default to firebase-adminsdk in most projects).
 *
 * Usage:
 *   node tools/deploy-rules.mjs                 # firestore rules + indexes
 *   node tools/deploy-rules.mjs --storage       # also storage rules + CORS
 *   node tools/deploy-rules.mjs --firestore-only
 *   node tools/deploy-rules.mjs --skip-indexes
 *
 * Prerequisites:
 *   - service-account.json at the project root
 *   - firebase/firestore.rules, firebase/storage.rules,
 *     firebase/firestore.indexes.json, firebase/storage.cors.json
 */

import { GoogleAuth } from 'google-auth-library'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { argv, exit } from 'node:process'

const SERVICE_ACCOUNT_PATH = resolve(process.env.SERVICE_ACCOUNT_PATH ?? './service-account.json')

if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`❌ Service account JSON not found at ${SERVICE_ACCOUNT_PATH}`)
  exit(1)
}

const sa = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'))
const projectId = sa.project_id
if (!projectId) {
  console.error('❌ service-account.json is missing "project_id".')
  exit(1)
}

const args = new Set(argv.slice(2))
const DEPLOY_STORAGE = args.has('--storage')
const FIRESTORE_ONLY = args.has('--firestore-only')
const SKIP_INDEXES = args.has('--skip-indexes')

// Two distinct OAuth scopes are needed:
// - cloud-platform covers firebaserules + firestore admin APIs
const auth = new GoogleAuth({
  credentials: sa,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
})
const client = await auth.getClient()

/**
 * Upload a rules file and release it on a target (e.g. "cloud.firestore").
 */
async function deployRules(rulesPath, releaseName, resourcePath) {
  const source = readFileSync(rulesPath, 'utf-8')

  console.log(`\n— Uploading ${rulesPath} to projects/${projectId}...`)
  const rulesetRes = await client.request({
    url: `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
    method: 'POST',
    data: {
      source: {
        files: [{ name: rulesPath.split(/[\\/]/).pop(), content: source }],
      },
    },
  })
  const rulesetName = rulesetRes.data.name
  console.log(`  Ruleset created: ${rulesetName}`)

  const releaseFullName = `projects/${projectId}/releases/${releaseName}`

  try {
    await client.request({
      url: `https://firebaserules.googleapis.com/v1/${releaseFullName}`,
      method: 'PATCH',
      data: { release: { name: releaseFullName, rulesetName } },
    })
    console.log(`  ✓ Released to ${resourcePath}`)
  } catch (e) {
    if (e.response?.status === 404) {
      await client.request({
        url: `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`,
        method: 'POST',
        data: { name: releaseFullName, rulesetName },
      })
      console.log(`  ✓ Created new release for ${resourcePath}`)
    } else {
      throw e
    }
  }
}

/**
 * Deploy Firestore composite indexes defined in firestore.indexes.json.
 * Firestore's admin API creates indexes individually. We don't try to
 * reconcile or delete obsolete indexes automatically — the firebase CLI
 * doesn't do that either by default, so operators can clean up via the
 * Console when needed.
 *
 * API: https://firebase.google.com/docs/firestore/query-data/indexing#manage_indexes
 */
async function deployIndexes() {
  const file = 'firebase/firestore.indexes.json'
  if (!existsSync(file)) {
    console.log(`\n(ℹ No ${file} found — skipping index deploy.)`)
    return
  }
  const parsed = JSON.parse(readFileSync(file, 'utf-8'))
  const wanted = Array.isArray(parsed.indexes) ? parsed.indexes : []
  if (wanted.length === 0) {
    console.log(`\n(ℹ ${file} has no indexes — skipping.)`)
    return
  }

  console.log(`\n— Deploying ${wanted.length} Firestore composite index(es)...`)

  // List existing indexes once so we can skip duplicates.
  const base =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/collectionGroups`

  const existingByCollection = new Map() // collection -> array of index defs
  for (const def of wanted) {
    if (existingByCollection.has(def.collectionGroup)) continue
    try {
      const list = await client.request({
        url: `${base}/${def.collectionGroup}/indexes`,
        method: 'GET',
      })
      existingByCollection.set(def.collectionGroup, list.data.indexes ?? [])
    } catch (e) {
      if (e.response?.status === 404) {
        existingByCollection.set(def.collectionGroup, [])
      } else {
        throw e
      }
    }
  }

  // Helper: detect whether an equivalent index already exists.
  const matches = (a, b) => {
    if (a.queryScope !== (b.queryScope ?? 'COLLECTION')) return false
    const af = a.fields?.filter((f) => f.fieldPath !== '__name__') ?? []
    const bf = b.fields ?? []
    if (af.length !== bf.length) return false
    return af.every((fa, i) => {
      const fb = bf[i]
      if (fa.fieldPath !== fb.fieldPath) return false
      if (fa.order && fa.order !== fb.order) return false
      if (fa.arrayConfig && fa.arrayConfig !== fb.arrayConfig) return false
      return true
    })
  }

  let created = 0
  let skipped = 0

  for (const def of wanted) {
    const existing = existingByCollection.get(def.collectionGroup) ?? []
    if (existing.some((e) => matches(e, def))) {
      skipped++
      console.log(
        `  ℹ Skipped (already exists): ${def.collectionGroup} (${def.fields.map((f) => `${f.fieldPath} ${f.order ?? f.arrayConfig}`).join(', ')})`,
      )
      continue
    }
    try {
      await client.request({
        url: `${base}/${def.collectionGroup}/indexes`,
        method: 'POST',
        data: {
          queryScope: def.queryScope ?? 'COLLECTION',
          fields: def.fields,
        },
      })
      created++
      console.log(
        `  ✓ Created: ${def.collectionGroup} (${def.fields.map((f) => `${f.fieldPath} ${f.order ?? f.arrayConfig}`).join(', ')})`,
      )
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.message
      // Race: another run may have just created it.
      if (/already exists/i.test(msg)) {
        skipped++
        console.log(`  ℹ Already exists: ${def.collectionGroup}`)
      } else {
        console.error(`  ❌ Failed: ${def.collectionGroup} — ${msg}`)
        throw e
      }
    }
  }

  console.log(`\n  Indexes: ${created} created, ${skipped} skipped.`)
  if (created > 0) {
    console.log(
      '  ⏳ Building indexes takes a few minutes. Watch progress at ' +
        `https://console.firebase.google.com/project/${projectId}/firestore/indexes`,
    )
  }
}

/**
 * Apply the CORS configuration to the Storage bucket so browser-based
 * uploads (firebase/storage Web SDK) don't get blocked by same-origin.
 *
 * The config lives in firebase/storage.cors.json and is a deliberate
 * allowlist of development + Firebase Hosting origins (SYM-GR-0005 TLS,
 * SYM-GR-0019 baseline). No wildcard origin.
 *
 * API: https://cloud.google.com/storage/docs/configuring-cors
 */
async function deployStorageCors() {
  const corsFile = 'firebase/storage.cors.json'
  if (!existsSync(corsFile)) {
    console.log(`\n(ℹ No ${corsFile} found — skipping CORS deploy.)`)
    return
  }
  const parsed = JSON.parse(readFileSync(corsFile, 'utf-8'))
  const wanted = Array.isArray(parsed.cors) ? parsed.cors : []

  const bucket = `${projectId}.firebasestorage.app`
  const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}?fields=cors`

  console.log(`\n— Applying CORS config to bucket ${bucket}...`)
  await client.request({
    url,
    method: 'PATCH',
    data: { cors: wanted },
  })
  console.log(`  ✓ CORS applied (${wanted.length} rule(s))`)
}

const main = async () => {
  if (!FIRESTORE_ONLY) {
    await deployRules('firebase/firestore.rules', 'cloud.firestore', 'Firestore')
  }

  if (!SKIP_INDEXES) {
    await deployIndexes()
  }

  if (DEPLOY_STORAGE) {
    const bucket = `${projectId}.firebasestorage.app`
    await deployRules(
      'firebase/storage.rules',
      `firebase.storage/${bucket}`,
      `Storage bucket ${bucket}`,
    )
    await deployStorageCors()
  }

  console.log('\n✨ Done.')
}

main().catch((e) => {
  const msg = e.response?.data?.error?.message || e.message
  console.error(`\n❌ Deploy failed: ${msg}`)
  if (e.response?.data?.error?.details) {
    console.error(JSON.stringify(e.response.data.error.details, null, 2))
  }
  exit(1)
})
