---
title: "Providers"
description: "Kucedr is bring-your-own AI: add your own API keys and pick a provider and model independently for every capability."
category: "Providers"
sourcePath: "providers.md"
order: 20
---

Kucedr does not lock you to one built-in model. You connect the providers you want by adding your own API keys, and each capability keeps its own saved selection.

| Model service | Purpose |
| --- | --- |
| Assistant | The chat and agent brain. |
| Speech-to-Text | Transcription and dictation. |
| Text-to-Speech | Spoken assistant replies. |
| Text-to-Image | Image generation. |
| Text-to-Video | Video generation. |
| Music / Audio | Music and sound-effect generation. |

Scheduled work and health checks have their own provider and model selections, configured on their own Settings pages rather than during first-run setup.

The provider key manager carries 24 catalog entries, each with capability labels and a link to that vendor's key or setup page: OpenAI, Anthropic, Google, xAI, Mistral, DeepSeek, Qwen, Kimi, Z.ai, MiniMax, ElevenLabs, Deepgram, Cartesia, Black Forest Labs, Midjourney, Kling, Runway, Luma, Stability AI, Ideogram, Pika, Suno, Reka, and Perplexity.

## Chat Routing

Kucedr uses the native Anthropic Messages API for Anthropic, the OpenAI Responses API for OpenAI, and the OpenAI-compatible Chat Completions path for every other chat provider, which is also how you connect an OpenAI-compatible endpoint of your own.

| Provider | Models |
| --- | --- |
| Anthropic | Claude Opus 4.7; Claude Sonnet 4.6; Claude Haiku 4.5 |
| DeepSeek | DeepSeek V4 Pro; DeepSeek V4 Flash |
| Google | Gemini 3.1 Pro Preview; Gemini 3.1 Flash Lite |
| Kimi | Kimi K2.6; Kimi K2.5; Kimi K2 Thinking |
| MiniMax | MiniMax M2.7; MiniMax M2.5 |
| Mistral | Mistral Large 2512; Mistral Medium 3.5; Devstral 2512 |
| OpenAI | GPT-5.6 Sol, Terra, Luna; GPT-5.5 and 5.5 Pro; GPT-5.4, 5.4 Pro, Mini, Nano |
| Qwen | Qwen3.7 Max; Qwen3.6 Plus; Qwen3.6 Flash |
| Reka | Reka Flash; Reka Edge 2603 |
| xAI | Grok 4.3; Grok Build 0.1 |
| Z.ai | GLM-5.1; GLM-5; GLM-5 Turbo |
| Perplexity | Sonar Deep Research; Sonar Reasoning Pro; Sonar Pro; Sonar |

## Speech

Realtime and recorded transcription keep independent saved selections, and Settings filters models by whether they implement streaming or batch transcription. Batch audio is capped at 64 MiB of encoded input; realtime chunks at 256 KiB.

| Speech-to-text provider | Models | Modes |
| --- | --- | --- |
| Deepgram | Nova 3; Flux | Nova 3 batch and stream; Flux stream |
| ElevenLabs | Scribe v2; Scribe v2 Realtime | Batch; stream |
| Mistral | Voxtral Mini 2602; Voxtral Mini Transcribe Realtime 2602 | Batch; stream |
| OpenAI | GPT-4o Transcribe; GPT-4o Mini Transcribe; GPT Realtime Whisper | Batch; batch; stream |
| Qwen | Qwen3 ASR Flash Realtime | Stream |
| xAI | xAI STT Batch; xAI STT Streaming | Batch; stream |

Text-to-speech input is required and capped at 4,096 characters. All seven providers below have runtime adapters.

| Text-to-speech provider | Models |
| --- | --- |
| Cartesia | Sonic 3.5; Sonic 3 |
| Deepgram | Aura 2 |
| ElevenLabs | Eleven v3; Eleven Multilingual v2; Eleven Flash v2.5 |
| Google | Gemini 3.1 Flash TTS Preview |
| MiniMax | Speech 2.8 HD; Speech 2.8 Turbo |
| Mistral | Voxtral Mini TTS 2603 |
| OpenAI | GPT-4o Mini TTS; TTS-1 HD |

## Media Adapters

| Status | Image |
| --- | --- |
| Available | Black Forest Labs: FLUX.2, FLUX.1 Kontext Pro, FLUX1.1 Pro Ultra |
| Available | Google: Gemini 3.1 Flash Image Preview, Gemini 3 Pro Image Preview |
| Available | Ideogram: 3.0, 2a |
| Available | Luma: Uni 1.1 |
| Available | Qwen: Qwen Image, Qwen Image Edit |
| Available | Stability AI: Stable Image Ultra, Stable Image Core |
| Available | xAI: Grok Imagine Image, Grok Imagine Image Quality |
| Catalog only | Midjourney v8.1 and v7. Selectable, but the runtime reports that Midjourney has no public API |

| Status | Video |
| --- | --- |
| Available | Google: Veo 3.1, Veo 3.1 Fast |
| Available | Kling: 2.5 Turbo, 2.1 Master |
| Available | Luma: Ray 3, Ray 2 |
| Available | MiniMax: Hailuo 2.3, Hailuo 02 |
| Available | Pika: 2.2 |
| Available | Qwen: Wan 2.5 T2V, Wan 2.2 T2V Plus |
| Available | Runway: Gen-4 Turbo, Gen-3 Alpha Turbo |
| Available | xAI: Grok Imagine Video 1.5 |
| Catalog only | Midjourney Video v1. Selectable, but there is no public API |

| Status | Audio |
| --- | --- |
| Available | ElevenLabs: Eleven Music, ElevenLabs Sound Effects |
| Available | Stability AI: Stable Audio 2.5 |
| Catalog only | Google Lyria 3 Pro Preview, Lyria 3 Clip Preview, Lyria Realtime |
| Catalog only | Kling Audio |
| Catalog only | MiniMax Music 2.6, Music Cover |
| Catalog only | Suno v5.5, v4.5 All |

The audio catalog presents six providers, but only ElevenLabs and Stability AI currently execute.

Realtime-voice models are also cataloged for Google, Luma, Qwen, and xAI, but there is no realtime-voice execution service behind them. Kucedr's voice API today is text-to-speech.

## Credentials

API keys live in Kucedr's local application data and are masked in the interface after saving. Requests and credentials still go to the configured provider as required for authentication and inference. See [Privacy And Security](/docs/privacy) for how those files are stored.

## Choosing Providers

Mix providers for quality, cost, and speed: one for assistant chat, another for transcription, another for images. Because every capability keeps its own selection, changing one does not disturb the others.
