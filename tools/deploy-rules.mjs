#!/usr/bin/env node
/**
 * tools/deploy-rules.mjs
 *
 * Deploy Firestore (and optionally Storage) security rules without needing
 * the full firebase CLI permissions. Uses the firebaserules.googleapis.com
 * REST API via google-auth-library + a service account.
 *
 * Why not `firebase deploy`? The CLI tries to verify that the Firestore API
 * is enabled via serviceusage.googleapis.com, which needs a
 * `roles/serviceusage.serviceUsageConsumer` IAM binding that the default
 * firebase-adminsdk service account doesn't have. This script calls the
 * rules API directly, which only requires `roles/firebaserules.admin`
 * (granted by default to firebase-adminsdk in most projects).
 *
 * Usage:
 *   node tools/deploy-rules.mjs                 # deploy firestore only
 *   node tools/deploy-rules.mjs --storage       # also deploy storage rules
 *   node tools/deploy-rules.mjs --firestore-only
 *
 * Prerequisites:
 *   - service-account.json at the project root
 *   - firestore.rules and storage.rules present in firebase/
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

const auth = new GoogleAuth({
  credentials: sa,
  scopes: ['https://www.googleapis.com/auth/firebase'],
})
const client = await auth.getClient()

/**
 * Upload a rules file and release it on a target (e.g. "cloud.firestore").
 * API ref: https://firebase.google.com/docs/reference/rules/rest
 */
async function deployRules(rulesPath, releaseName, resourcePath) {
  const source = readFileSync(rulesPath, 'utf-8')

  // 1. Create a new ruleset
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

  // 2. Update (or create) a release pointing to the new ruleset
  const releaseFullName = `projects/${projectId}/releases/${releaseName}`

  try {
    await client.request({
      url: `https://firebaserules.googleapis.com/v1/${releaseFullName}`,
      method: 'PATCH',
      data: {
        release: { name: releaseFullName, rulesetName },
      },
    })
    console.log(`  ✓ Released to ${resourcePath}`)
  } catch (e) {
    // If the release doesn't exist yet, create it.
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

const main = async () => {
  if (!FIRESTORE_ONLY) {
    // Firestore release name is "cloud.firestore"
    await deployRules('firebase/firestore.rules', 'cloud.firestore', 'Firestore')
  }

  if (DEPLOY_STORAGE) {
    // Storage release name is "firebase.storage/<bucket>"
    // Default bucket is <projectId>.appspot.com
    const bucket = `${projectId}.firebasestorage.app`
    await deployRules(
      'firebase/storage.rules',
      `firebase.storage/${bucket}`,
      `Storage bucket ${bucket}`,
    )
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
