# Supabase

Friday uses Supabase for email/password authentication, cloud chat metadata, private file
storage, and per-chat Realtime events. The Supabase client runs only in Electron's main
process. The renderer receives token-free data through validated IPC handlers.

## Configure development

Create an ignored root `.env` file with the hosted project's public client values:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

Do not put `SUPABASE_SECRET_KEY`, service-role keys, JWT signing keys, or database passwords
in the application environment. Friday rejects secret-key prefixes at startup. The JWKS
endpoint is derived by Supabase and does not need a separate application variable.

Packaged builds can inject the same public values at build time:

```dotenv
MAIN_VITE_SUPABASE_URL=https://your-project.supabase.co
MAIN_VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

Friday uses `@supabase/supabase-js`. Do not add `@supabase/server`; that package targets
stateless HTTP servers and Edge Functions, not Electron's persistent main process.

## Run Supabase locally

Docker must be running. Start the local stack and apply the committed migrations:

```sh
npm run supabase:start
npm run supabase:status
```

Run the database policy tests:

```sh
npm run supabase:test
```

Reset the local database after changing migrations, or stop the stack when finished:

```sh
npm run supabase:reset
npm run supabase:stop
```

The local email inbox is available at `http://127.0.0.1:54324`. Authentication redirects
back to the desktop app through `friday://auth/callback`.

## Deploy the schema

The migration in `supabase/migrations` creates the application tables, row-level security
policies, private `user-files` bucket, ownership constraints, and private Realtime policies.
Deploy it with an authenticated Supabase CLI session:

```sh
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Then verify these hosted-project settings in the Supabase dashboard:

1. Add `friday://auth/callback` to the Auth redirect allow list.
2. Keep email/password sign-up enabled and require email confirmation for production.
3. Disable Realtime public-channel access so the migration's private-channel policies apply.
4. Run the application, create an account, confirm its email, and verify sign-in and sign-out.

## Local data boundary

Existing local chats and provider configuration stay on the device. The first signed-in
Supabase account becomes the owner of that local Friday profile; signing into another account
is rejected to prevent accidental cross-account data exposure. Cloud APIs are available for
new synchronization work without replacing the existing S3 or vector-storage providers.

Supabase session and PKCE values are encrypted with Electron `safeStorage`. On systems where
secure encryption is unavailable, Friday keeps the session in memory and requires sign-in
again after restart.
