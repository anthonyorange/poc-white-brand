# Local admin & seed tools

Local-only CLI helpers. **Never** commit `service-account.json`.

## Setup (one time)

1. Download a service account JSON from the Firebase Console:
   **⚙ Project settings → Service accounts → Generate new private key**
2. Save it at the project root as `service-account.json`.
   It is gitignored and must stay that way (SYM-GR-0001, SYM-GR-0002).

---

## `set-admin.mjs` — manage admin users

### Create the first admin

```bash
# Create a brand new user AND give it the admin claim (one shot).
node tools/set-admin.mjs create you@example.com 'a-strong-passphrase-here'
```

Password **must be at least 12 characters** (SYM-GR-0019 baseline).
Avoid special characters that your shell might interpret — wrap the
password in single quotes as above.

### Promote an existing user

If you already created the user via the Firebase Console UI:

```bash
node tools/set-admin.mjs promote you@example.com
```

### Revoke admin

```bash
node tools/set-admin.mjs revoke you@example.com
```

### Inspect a user

```bash
node tools/set-admin.mjs whoami you@example.com
```

Prints UID, email verified state, custom claims, sign-in times.

### After running

The user must **sign out and sign back in** for the new claim to reach
the client (or call `getIdToken(true)` to force refresh). In this app,
`useAuth.init()` refreshes the claim automatically on each
`onAuthStateChanged` event, so a full login cycle is enough.

---

## `seed-data.mjs` — pre-populate Firestore

Populates Firestore with a default `config/brand` document and 8 sample
products spread across all 4 categories (1–3 featured, 1 out of stock).
Useful for local/preview testing so the UI isn't empty.

### Default (safe) run — create only if missing

```bash
node tools/seed-data.mjs
```

The script is idempotent: docs that already exist are skipped with a
log line. No data is ever destroyed without `--force`.

### Overwrite existing docs

```bash
node tools/seed-data.mjs --force
```

Overwrites `config/brand` and all sample products with their canonical
seed content. Use when you've drifted from the seed and want to reset.

### Partial seeding

```bash
node tools/seed-data.mjs --brand-only      # only config/brand
node tools/seed-data.mjs --products-only   # only the 8 products
```

### Stock images

The seed uses Unsplash URLs (`images.unsplash.com`) to keep the tool
self-contained. These domains are whitelisted in `nuxt.config.ts` and
in the Content-Security-Policy (firebase.json → img-src).

For production, replace seed images with your own uploads to Firebase
Storage, then:
1. Remove `images.unsplash.com` from `nuxt.config.ts` → `image.domains`.
2. Remove `https://images.unsplash.com` from the CSP `img-src`.
This reduces the image-proxy SSRF surface (SYM-GR-0003).

### Required Firestore rules

The seed script runs under Admin SDK privileges, which **bypass**
Firestore rules — you don't need to deploy the rules first.
However, once rules are deployed, the admin user you created via
`set-admin.mjs` can also update/delete these docs through the UI.

---

## Cleanup

Once you're done setting up accounts and seeding:

```bash
# Scrub password from shell history (bash/zsh):
history -d $(history 1)

# Delete the service account JSON:
rm service-account.json
```

If you need it again later, regenerate from the Firebase Console.
