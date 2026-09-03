# Operators Page

Route: `/operators/`

Source: `src/pages/operators.astro`

## Purpose

The operators page explains Kucedr's major AI operators: the assistant agent, speech-to-text, text-to-speech, image, video, sound, OCR, scheduler, and background task operator surfaces.

## Content Sources

- Page copy, status labels, CTA text, and localized labels come from `getLocaleContent("en")` in `src/i18n.ts`.
- Operator cards are loaded from `src/data/operators.json`.
- Shared UI uses `src/components/CTASection.astro`, `src/components/Icon.astro`, and `src/layouts/Layout.astro`.

## Feature Docs Used

- `/Users/haraldbregu/Documents/kucedr/docs/features/providers-and-models.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/realtime-transcription.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/agents-and-subagents.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/background-tasks.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/cron-scheduled-tasks.md`

## Notes

Use `implemented`, `pending-runtime`, and `placeholder` statuses consistently with the source docs. The provider and model docs say assistant and speech-to-text have local runtime adapters, while several media operators are catalog or settings surfaces until their local runtimes are added.
