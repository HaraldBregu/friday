# Start Page Flow

The start page is Friday's single entry point for first-run onboarding and incomplete assistant
configuration. It should keep the user on `/start` until Friday has a stored assistant provider and
model, then open `/home`.

## Flow at a glance

```text
Open Friday
  -> Welcome
  -> Account or local-only mode
  -> Check assistant configuration
       -> complete: Home
       -> incomplete: Model API keys
            -> Search Engine
            -> Object Storage
            -> Vector Databases
            -> Assistant setup
            -> verify configuration
            -> Home
```

The footer presents seven visible stages: **Welcome**, **Account**, **Model**, **Search**,
**Storage**, **Database**, and **Models**. Configuration checks happen between stages and do not
add another progress item.

## Entry and routing

- `/`, `/auth`, `/setup`, and `/config` should resolve to `/start`.
- An application route should redirect to `/start` while onboarding is incomplete.
- Every onboarding stage should remain on `/start`; changing a stage must not add browser history.
- A ready user who opens an onboarding route should be redirected to `/home`.
- While Friday checks readiness from an application route, it should show a neutral loading surface
  instead of briefly rendering protected application content.

## Stage requirements

| Stage    | Expected action                                      | Required to continue |
| -------- | ---------------------------------------------------- | -------------------- |
| Welcome  | Start the onboarding flow                            | Yes                  |
| Account  | Sign in, create an account, or continue local-only   | No account required  |
| Model    | Save an API key for a catalog model provider        | Yes                  |
| Search   | Connect a web-search provider                        | No                   |
| Storage  | Configure catalog or custom S3-compatible storage   | No                   |
| Database | Connect a vector database                            | No                   |
| Models   | Select the primary assistant provider and model      | Assistant only       |

### 1. Welcome

The first stage should introduce Friday and provide one primary **Get started** action. While the
authentication state is unresolved, that action should be disabled and labeled **Checking your
session…**.

Selecting **Get started** records that onboarding has started for the current renderer session. If
the user is already signed in, Friday can skip Account and check the assistant configuration
immediately.

### 2. Account

The Account stage should default to sign-in and also support account creation, email confirmation,
confirmation-email resend, password-reset requests, and password recovery.

An account is optional. Outside password recovery, the footer should provide:

- **Back**, which returns to Welcome;
- **Skip and continue**, which uses Friday in local-only mode for the current session.

If Supabase is not configured, the page should explain which environment variables are missing
while leaving Back and local-only continuation available. Password recovery should take priority
over the normal flow and hide the footer Back and Skip actions until recovery is complete.

After a successful sign-in or local-only continuation, Friday should check the stored assistant
configuration. A stored assistant provider and model ID count as complete and lead directly to
Home. An incomplete configuration begins the Model stage.

### 3. Model API keys

The Model stage should list catalog model providers. Each provider card should support opening the
provider's API setup page, connecting, saving, cancelling, and replacing a key. Saved keys should
be masked.

**Continue** should only advance when at least one catalog model provider has a non-empty saved API
key. A value typed into a card but not saved does not satisfy the requirement. If validation or
provider loading fails, the user should remain on this stage and see an inline error.

### 4. Search Engine

The Search stage should let the user save a supported search-provider API key. Search is optional,
so **Continue** should remain available without a configured provider.

### 5. Object Storage

The Storage stage should support catalog and custom S3-compatible storage configuration. Storage
is optional during onboarding.

### 6. Vector Databases

The Database stage should let the user connect a supported vector database. A database is optional
during onboarding.

### 7. Assistant setup

The final stage should load existing selections and available models, then show these configuration
rows in order:

1. Model
2. Realtime conversation
3. Voice
4. Transcription
5. Image
6. Audio
7. Video
8. Search Engine

Only the primary **Model** selection is required. **Finish** should stay disabled while model data
is loading, while configuration is saving, or until the primary assistant selection is valid.
Voice and Transcription selections may save when changed; Finish should save every valid selected
service. Task and Health check models are configured later from Settings and should not appear as
editable rows here.

Search Engine should only allow selection among search providers connected earlier or in Settings.
Voice, transcription, realtime conversation, search, and generated-media models remain optional.

## Back, completion, and errors

- Back from a setup stage should move to the preceding setup stage.
- Back from Model should return a local-only user to Account so they can sign in. For other users,
  it should return to Welcome.
- Controls that can repeat a save should be disabled while that save is running.
- Save, load, and verification failures should keep the user on the current stage and show an
  accessible inline error.
- Finish should save the selected services and recheck the required assistant provider and model.
  A successful check should navigate to `/home`; a failed check should keep the user on `/start`.

Setup completeness checks for the presence of a stored assistant provider and model ID. It does
not test provider credentials or make a model request. Provider and service configuration should
remain editable later in Settings.

## Session behavior

The onboarding-started flag and local-only choice should use session storage. They should survive a
renderer refresh within the session without becoming durable account preferences. Provider keys,
model selections, and other completed configuration use their existing application stores.

If secure authentication persistence is unavailable and authentication falls back to memory, the
Account stage should tell the user that the signed-in session will not persist after restart.

## Implementation reference

- [Route gate](../../src/renderer/src/auth/Gate.tsx)
- [Onboarding state](../../src/renderer/src/contexts/OnboardingProvider.tsx)
- [Start page](../../src/renderer/src/pages/start/StartPage.tsx)
- [Step definitions](../../src/renderer/src/pages/start/setupConstants.ts)
- [Authentication behavior](../../src/renderer/src/pages/start/components/AuthStep.tsx)
- [Start-flow tests](../../tests/unit/renderer/auth-gate.test.tsx)
- [Model-step tests](../../tests/unit/renderer/setup-models-step.test.tsx)
