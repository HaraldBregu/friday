# Supabase

Kucedr uses Supabase for email/password and Google authentication, cloud chat metadata, private file
storage, and per-chat Realtime events. The Supabase client runs only in Electron's main
process. The renderer receives token-free data through validated IPC handlers.

## Configure development

Create an ignored root `.env` file with the hosted project's public client values:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

Do not put `SUPABASE_SECRET_KEY`, service-role keys, JWT signing keys, or database passwords
in the application environment. Kucedr rejects secret-key prefixes at startup. The JWKS
endpoint is derived by Supabase and does not need a separate application variable.

Packaged builds can inject the same public values at build time:

```dotenv
MAIN_VITE_SUPABASE_URL=https://your-project.supabase.co
MAIN_VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

Kucedr uses `@supabase/supabase-js`. Do not add `@supabase/server`; that package targets
stateless HTTP servers and Edge Functions, not Electron's persistent main process.

## Configure Google sign-in

Follow Supabase's [Google Auth guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
to create a **Web application** OAuth client in the Google Auth Platform console. Configure the
`openid`, email, and profile scopes, then add the Supabase callback URL shown on the project's
Google provider page as an authorized redirect URI. Hosted projects normally use:

```text
https://your-project-ref.supabase.co/auth/v1/callback
```

Enable Google in **Supabase Dashboard → Authentication → Providers**, and save the OAuth client ID
and secret there. Keep `kucedr://auth/callback` in Supabase's redirect allow list; Kucedr opens the
Supabase authorization URL in the system browser and exchanges the returned PKCE code in the main
process.

For local Supabase development, Google must instead authorize
`http://127.0.0.1:54321/auth/v1/callback`. Keep the client secret in
`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET`, never in this repository, and add this configuration
to `supabase/config.toml` while testing Google locally:

```toml
[auth.external.google]
enabled = true
client_id = "your-google-web-client-id"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
skip_nonce_check = false
```

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
back to the desktop app through `kucedr://auth/callback`.

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

1. Add `kucedr://auth/callback` to the Auth redirect allow list.
2. Enable the Google provider with its Web OAuth client ID and secret.
3. Keep email/password sign-up enabled and require email confirmation for production.
4. Disable Realtime public-channel access so the migration's private-channel policies apply.
5. Verify email/password and Google sign-in, callback handling, and sign-out in the application.

## Local data boundary

Existing local chats and provider configuration stay on the device. The first signed-in
Supabase account becomes the owner of that local Kucedr profile; signing into another account
is rejected to prevent accidental cross-account data exposure. Cloud folder backups use the
private `user-files` bucket below `<user-id>/backups/`; no storage-provider selection or separate
storage credentials are required. Legacy local storage-provider configuration is left untouched
without migration but is no longer read by the Cloud workflow. Vector-database providers remain
separate because they serve RAG rather than file backup.

Supabase session and PKCE values are encrypted with Electron `safeStorage`. On systems where
secure encryption is unavailable, Kucedr keeps the session in memory and requires sign-in
again after restart.
