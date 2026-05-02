# Admin tools

Local-only CLI helpers. **Never** commit `service-account.json`.

## Setup (one time)

1. Download a service account JSON from the Firebase Console:
   **⚙ Project settings → Service accounts → Generate new private key**
2. Save it at the project root as `service-account.json`.
   It is gitignored and must stay that way (SYM-GR-0001, SYM-GR-0002).

## Create the first admin

```bash
# Create a brand new user AND give it the admin claim (one shot).
node tools/set-admin.mjs create you@example.com 'a-strong-passphrase-here'
```

Password **must be at least 12 characters** (SYM-GR-0019 baseline).
Avoid special characters that your shell might interpret — wrap the
password in single quotes as above.

## Promote an existing user

If you already created the user via the Firebase Console UI:

```bash
node tools/set-admin.mjs promote you@example.com
```

## Revoke admin

```bash
node tools/set-admin.mjs revoke you@example.com
```

## Inspect a user

```bash
node tools/set-admin.mjs whoami you@example.com
```

Prints UID, email verified state, custom claims, sign-in times.

## After running

The user must **sign out and sign back in** for the new claim to reach
the client (or call `getIdToken(true)` to force refresh). In this app,
`useAuth.init()` refreshes the claim automatically on each
`onAuthStateChanged` event, so a full login cycle is enough.

## Cleanup

Once you're done setting up accounts:

```bash
# Scrub password from shell history (bash/zsh):
history -d $(history 1)

# Delete the service account JSON:
rm service-account.json
```

If you need it again later, regenerate from the Firebase Console.
