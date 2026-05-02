#!/usr/bin/env node
/**
 * tools/set-admin.mjs
 *
 * One-shot CLI to create (or promote) a Firebase Auth user as admin.
 *
 * Usage:
 *   node tools/set-admin.mjs create <email> <password>
 *   node tools/set-admin.mjs promote <email>          # existing user
 *   node tools/set-admin.mjs revoke  <email>          # remove admin claim
 *   node tools/set-admin.mjs whoami  <email>          # show claims
 *
 * Prerequisites:
 *   1. npm i -D firebase-admin     (dev dependency; already installed if
 *                                   you followed the setup)
 *   2. A Firebase service account JSON file placed at:
 *        ./service-account.json    (gitignored — never commit it!)
 *      or point SERVICE_ACCOUNT_PATH env var at a different location.
 *      To download: Firebase Console → ⚙ Project settings → Service
 *      accounts → Generate new private key.
 *
 * Security notes:
 *   - The service account has full admin access to the project. Treat it
 *     like a password. Delete the JSON file as soon as you're done, or
 *     store it in a password manager / vault (SYM-GR-0001, SYM-GR-0002).
 *   - This script is NOT checked into git (see .gitignore).
 *   - The password you pass on the CLI appears in your shell history.
 *     Consider running `history -d $(history 1)` after use (bash) or
 *     using `$env:HISTORY` (PowerShell) to scrub it.
 */

import admin from 'firebase-admin'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { argv, exit } from 'node:process'

const SERVICE_ACCOUNT_PATH = resolve(process.env.SERVICE_ACCOUNT_PATH ?? './service-account.json')

if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(
    `\n❌ Service account JSON not found at ${SERVICE_ACCOUNT_PATH}\n` +
      `   Download one from:\n` +
      `   Firebase Console → ⚙ Project settings → Service accounts → Generate new private key\n` +
      `   and save it as service-account.json at the project root.\n`,
  )
  exit(1)
}

let serviceAccount
try {
  serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'))
} catch (e) {
  console.error(`❌ Could not read service account: ${e.message}`)
  exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const [, , cmd, email, password] = argv

const usage = () => {
  console.log(
    `\nUsage:\n` +
      `  node tools/set-admin.mjs create  <email> <password>   # create user + admin claim\n` +
      `  node tools/set-admin.mjs promote <email>               # claim admin on existing user\n` +
      `  node tools/set-admin.mjs revoke  <email>               # remove admin claim\n` +
      `  node tools/set-admin.mjs whoami  <email>               # show current claims\n`,
  )
}

const getUserByEmail = async (mail) => {
  try {
    return await admin.auth().getUserByEmail(mail)
  } catch (e) {
    if (e.code === 'auth/user-not-found') return null
    throw e
  }
}

const main = async () => {
  if (!cmd || !email) {
    usage()
    exit(1)
  }

  switch (cmd) {
    case 'create': {
      if (!password || password.length < 12) {
        console.error(
          '❌ Password required and must be at least 12 characters (SYM-GR-0019 baseline).',
        )
        exit(1)
      }
      const existing = await getUserByEmail(email)
      if (existing) {
        console.error(`❌ User ${email} already exists (uid=${existing.uid}).`)
        console.error('   Use `promote` instead if you just need the admin claim.')
        exit(1)
      }
      const user = await admin.auth().createUser({
        email,
        password,
        emailVerified: false,
      })
      await admin.auth().setCustomUserClaims(user.uid, { admin: true })
      console.log(`✓ Created user ${email} (uid=${user.uid}) with admin=true`)
      break
    }

    case 'promote': {
      const user = await getUserByEmail(email)
      if (!user) {
        console.error(`❌ User ${email} not found. Create it first.`)
        exit(1)
      }
      // Preserve any other custom claims that might already be set.
      const existingClaims = user.customClaims ?? {}
      await admin.auth().setCustomUserClaims(user.uid, { ...existingClaims, admin: true })
      console.log(`✓ Promoted ${email} (uid=${user.uid}) — admin=true`)
      break
    }

    case 'revoke': {
      const user = await getUserByEmail(email)
      if (!user) {
        console.error(`❌ User ${email} not found.`)
        exit(1)
      }
      const existingClaims = { ...(user.customClaims ?? {}) }
      delete existingClaims.admin
      await admin.auth().setCustomUserClaims(user.uid, existingClaims)
      console.log(`✓ Revoked admin claim for ${email} (uid=${user.uid})`)
      break
    }

    case 'whoami': {
      const user = await getUserByEmail(email)
      if (!user) {
        console.error(`❌ User ${email} not found.`)
        exit(1)
      }
      console.log(
        JSON.stringify(
          {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            disabled: user.disabled,
            customClaims: user.customClaims ?? {},
            creationTime: user.metadata.creationTime,
            lastSignInTime: user.metadata.lastSignInTime,
          },
          null,
          2,
        ),
      )
      break
    }

    default:
      usage()
      exit(1)
  }

  // Reminder: after setting the claim, the client must refresh its ID token
  // (sign out + sign in, or force-refresh) to see the updated claim.
  if (cmd === 'create' || cmd === 'promote') {
    console.log(
      '\nℹ The user must sign out and sign back in for the new claim to take effect ' +
        'client-side (or call getIdToken(true) to force refresh).',
    )
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`)
  exit(1)
})
