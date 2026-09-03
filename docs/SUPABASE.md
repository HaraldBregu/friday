# Supabase

Friday uses Supabase for email/password and Google authentication, cloud chat metadata, private file
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

## Configure Google sign-in

Follow Supabase's [Google Auth guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
to create a **Web application** OAuth client in the Google Auth Platform console. Configure the
`openid`, email, and profile scopes, then add the Supabase callback URL shown on the project's
Google provider page as an authorized redirect URI. Hosted projects normally use:

```text
https://your-project-ref.supabase.co/auth/v1/callback
```

Enable Google in **Supabase Dashboard → Authentication → Providers**, and save the OAuth client ID
and secret there. Keep `friday://auth/callback` in Supabase's redirect allow list; Friday opens the
Supabase authorization URL in the system browser and exchanges the returned PKCE code in the main
process.

## Hosted API boundary

Friday connects to a preconfigured hosted Supabase project only through
`@supabase/supabase-js` and the public client settings above. This repository does not run a
local Supabase stack, contain migrations or seed data, test database policies, or deploy schema
changes. Configure the hosted project's authentication, tables, storage, Realtime, and access
policies outside this codebase. Never provide the application with database credentials or a
service-role key.

Verify these hosted-project settings in the Supabase dashboard:

1. Add `friday://auth/callback` to the Auth redirect allow list.
2. Enable the Google provider with its Web OAuth client ID and secret.
3. Keep email/password sign-up enabled and require email confirmation for production.
4. Disable Realtime public-channel access so the migration's private-channel policies apply.
5. Verify email/password and Google sign-in, callback handling, and sign-out in the application.

## Local data boundary

Existing local chats and provider configuration stay on the device. The first signed-in
Supabase account becomes the owner of that local Friday profile; signing into another account
is rejected to prevent accidental cross-account data exposure. Cloud folder backups use the
private `user-files` bucket below `<user-id>/backups/`; no storage-provider selection or separate
storage credentials are required. Legacy local storage-provider configuration is left untouched
without migration but is no longer read by the Cloud workflow. Vector-database providers remain
separate because they serve RAG rather than file backup.

Supabase session and PKCE values are encrypted with Electron `safeStorage`. On systems where
secure encryption is unavailable, Friday keeps the session in memory and requires sign-in
again after restart.
