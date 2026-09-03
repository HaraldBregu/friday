# Providers Page

Route: `/providers/`

Source: `src/pages/providers.astro`

## Purpose

The providers page lists AI providers and groups them by capability: chat and research, voice, image, video and 3D, and music or audio.

## Content Sources

- Provider catalog data comes from `src/data/providers.json`.
- The page computes capability groups from provider capabilities.
- Shared UI uses `src/components/CTASection.astro`, `src/components/Icon.astro`, and `src/layouts/Layout.astro`.

## Feature Docs Used

- `/Users/haraldbregu/Documents/kucedr/docs/features/providers-and-models.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/realtime-transcription.md`

## Notes

The source feature docs say the assistant runtime has local adapters for Anthropic, OpenAI, Mistral, DeepSeek, Qwen, and OpenAI-compatible fallback providers. Realtime transcription has adapters for OpenAI, Deepgram, ElevenLabs, Mistral, xAI, and Qwen. Media, realtime voice, 3D, OCR, and embedding catalog entries should not be described as complete local runtime unless source support is added.
