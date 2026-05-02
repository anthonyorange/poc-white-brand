// tests/firestore-rules/firestore-rules.test.ts
//
// Firestore security rules unit tests using @firebase/rules-unit-testing.
//
// Requirements to run:
//   - Java 11+ installed (for the Firebase emulator JVM)
//   - Run the Firestore emulator:
//       npx firebase emulators:start --only firestore
//     OR let the test bootstrap it (we use RulesTestEnvironment which auto-
//     connects to an already-running emulator on localhost:8080).
//
// Run:  npx vitest run tests/firestore-rules
//
// SKIPPED by default in CI (describe.skip) until Java is available on the
// runner. Remove the .skip to enable.

import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing'
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PROJECT_ID = 'demo-rules-tests'

// Skipped until the CI runner provides Java for the emulator.
describe.skip('Firestore rules', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(resolve(__dirname, '../../firebase/firestore.rules'), 'utf-8'),
        host: '127.0.0.1',
        port: 8080,
      },
    })
  })

  afterAll(async () => {
    await testEnv?.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
  })

  // Minimal valid product document payload.
  const validProduct = (slug = 'test-product') => ({
    name: 'Bague test',
    slug,
    description: 'Une belle bague',
    price: 50,
    stock: 5,
    category: 'bagues',
    images: ['https://example.com/a.jpg'],
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  describe('products', () => {
    it('anonymous can read products', async () => {
      // Seed as admin bypass
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'products/test-product'), validProduct())
      })
      const anon = testEnv.unauthenticatedContext().firestore()
      await assertSucceeds(getDoc(doc(anon, 'products/test-product')))
    })

    it('anonymous cannot write products', async () => {
      const anon = testEnv.unauthenticatedContext().firestore()
      await assertFails(setDoc(doc(anon, 'products/hack'), validProduct('hack')))
    })

    it('authenticated non-admin cannot write products', async () => {
      const user = testEnv.authenticatedContext('user1').firestore()
      await assertFails(setDoc(doc(user, 'products/nope'), validProduct('nope')))
    })

    it('admin (custom claim) can create a valid product', async () => {
      const admin = testEnv.authenticatedContext('admin1', { admin: true }).firestore()
      await assertSucceeds(setDoc(doc(admin, 'products/my-ring'), validProduct('my-ring')))
    })

    it('admin cannot create product with slug != doc id', async () => {
      const admin = testEnv.authenticatedContext('admin1', { admin: true }).firestore()
      await assertFails(setDoc(doc(admin, 'products/my-ring'), validProduct('other-slug')))
    })

    it('admin cannot create product with invalid category', async () => {
      const admin = testEnv.authenticatedContext('admin1', { admin: true }).firestore()
      await assertFails(
        setDoc(doc(admin, 'products/bad-cat'), {
          ...validProduct('bad-cat'),
          category: 'tatoos',
        }),
      )
    })

    it('admin cannot set more than 10 images', async () => {
      const admin = testEnv.authenticatedContext('admin1', { admin: true }).firestore()
      const images = Array.from({ length: 11 }, (_, i) => `https://e.com/${i}.jpg`)
      await assertFails(
        setDoc(doc(admin, 'products/too-many'), {
          ...validProduct('too-many'),
          images,
        }),
      )
    })

    it('admin cannot set negative price', async () => {
      const admin = testEnv.authenticatedContext('admin1', { admin: true }).firestore()
      await assertFails(setDoc(doc(admin, 'products/neg'), { ...validProduct('neg'), price: -1 }))
    })
  })

  describe('messages (contact form)', () => {
    const validMessage = () => ({
      name: 'Alice',
      email: 'alice@example.com',
      content: 'Hello, I love your jewelry!',
      createdAt: new Date(),
      read: false,
    })

    it('anonymous can create a valid message', async () => {
      const anon = testEnv.unauthenticatedContext().firestore()
      await assertSucceeds(addDoc(collection(anon, 'messages'), validMessage()))
    })

    it('anonymous cannot create message with read=true (privilege escalation)', async () => {
      const anon = testEnv.unauthenticatedContext().firestore()
      await assertFails(addDoc(collection(anon, 'messages'), { ...validMessage(), read: true }))
    })

    it('anonymous cannot create message with extra fields', async () => {
      const anon = testEnv.unauthenticatedContext().firestore()
      await assertFails(
        addDoc(collection(anon, 'messages'), {
          ...validMessage(),
          isAdmin: true, // trying to inject an extra field
        }),
      )
    })

    it('anonymous cannot create message with invalid email', async () => {
      const anon = testEnv.unauthenticatedContext().firestore()
      await assertFails(
        addDoc(collection(anon, 'messages'), {
          ...validMessage(),
          email: 'not-an-email',
        }),
      )
    })

    it('anonymous cannot create empty message', async () => {
      const anon = testEnv.unauthenticatedContext().firestore()
      await assertFails(addDoc(collection(anon, 'messages'), { ...validMessage(), content: 'hi' }))
    })

    it('anonymous cannot read messages', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await addDoc(collection(ctx.firestore(), 'messages'), validMessage())
      })
      const anon = testEnv.unauthenticatedContext().firestore()
      // @ts-expect-error we don't care about the return type here
      await assertFails(getDoc(doc(anon, 'messages/seeded')))
    })

    it('admin can read and mark as read', async () => {
      let id = ''
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const ref = await addDoc(collection(ctx.firestore(), 'messages'), validMessage())
        id = ref.id
      })
      const admin = testEnv.authenticatedContext('admin1', { admin: true }).firestore()
      await assertSucceeds(getDoc(doc(admin, `messages/${id}`)))
      await assertSucceeds(updateDoc(doc(admin, `messages/${id}`), { read: true }))
    })
  })

  describe('config/brand', () => {
    it('anonymous can read brand config', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'config/brand'), { name: 'Test' })
      })
      const anon = testEnv.unauthenticatedContext().firestore()
      await assertSucceeds(getDoc(doc(anon, 'config/brand')))
    })

    it('non-admin cannot write brand config', async () => {
      const user = testEnv.authenticatedContext('user1').firestore()
      await assertFails(setDoc(doc(user, 'config/brand'), { name: 'Hacked' }))
    })

    it('admin can write brand config', async () => {
      const admin = testEnv.authenticatedContext('admin1', { admin: true }).firestore()
      await assertSucceeds(setDoc(doc(admin, 'config/brand'), { name: 'Legit' }))
    })
  })

  describe('delete', () => {
    it('admin can delete a product', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'products/to-delete'), validProduct('to-delete'))
      })
      const admin = testEnv.authenticatedContext('admin1', { admin: true }).firestore()
      await assertSucceeds(deleteDoc(doc(admin, 'products/to-delete')))
    })

    it('anonymous cannot delete a product', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'products/to-delete'), validProduct('to-delete'))
      })
      const anon = testEnv.unauthenticatedContext().firestore()
      await assertFails(deleteDoc(doc(anon, 'products/to-delete')))
    })
  })
})
