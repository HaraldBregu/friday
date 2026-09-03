---
title: "Provider"
description: "Collega i tuoi provider AI e scegli un modello diverso per chat, voce, immagini, video e audio."
category: "Providers"
locale: "it"
sourcePath: "providers.md"
order: 20
---

Con Kucedr scegli tu quali provider AI usare. Aggiungi le tue chiavi API e configura un provider e un modello diversi per ogni funzione, senza legare tutto a un unico servizio.

| Servizio | Scopo |
| --- | --- |
| Assistente | Il motore della chat e dell'agente. |
| Speech-to-Text | Trascrizione e dettatura. |
| Text-to-Speech | Lettura vocale delle risposte dell'assistente. |
| Text-to-Image | Generazione di immagini. |
| Text-to-Video | Generazione di video. |
| Musica / Audio | Generazione di musica ed effetti sonori. |

Le attività pianificate e gli health check hanno una propria scelta di provider e modello, configurata nelle rispettive pagine delle Impostazioni e non durante la configurazione iniziale.

Il gestore delle chiavi include 24 provider a catalogo. Per ciascuno mostra le funzioni supportate e un link alla pagina dove ottenere la chiave o completare la configurazione: OpenAI, Anthropic, Google, xAI, Mistral, DeepSeek, Qwen, Kimi, Z.ai, MiniMax, ElevenLabs, Deepgram, Cartesia, Black Forest Labs, Midjourney, Kling, Runway, Luma, Stability AI, Ideogram, Pika, Suno, Reka e Perplexity.

## Instradamento della chat

Kucedr usa l'API nativa Anthropic Messages per Anthropic, l'API OpenAI Responses per OpenAI e un percorso Chat Completions compatibile con OpenAI per tutti gli altri provider di chat. Quest'ultimo consente anche di collegare un tuo endpoint compatibile con OpenAI.

| Provider | Modelli |
| --- | --- |
| Anthropic | Claude Opus 4.7; Claude Sonnet 4.6; Claude Haiku 4.5 |
| DeepSeek | DeepSeek V4 Pro; DeepSeek V4 Flash |
| Google | Gemini 3.1 Pro Preview; Gemini 3.1 Flash Lite |
| Kimi | Kimi K2.6; Kimi K2.5; Kimi K2 Thinking |
| MiniMax | MiniMax M2.7; MiniMax M2.5 |
| Mistral | Mistral Large 2512; Mistral Medium 3.5; Devstral 2512 |
| OpenAI | GPT-5.6 Sol, Terra, Luna; GPT-5.5 e 5.5 Pro; GPT-5.4, 5.4 Pro, Mini, Nano |
| Qwen | Qwen3.7 Max; Qwen3.6 Plus; Qwen3.6 Flash |
| Reka | Reka Flash; Reka Edge 2603 |
| xAI | Grok 4.3; Grok Build 0.1 |
| Z.ai | GLM-5.1; GLM-5; GLM-5 Turbo |
| Perplexity | Sonar Deep Research; Sonar Reasoning Pro; Sonar Pro; Sonar |

## Voce

La trascrizione in tempo reale e quella registrata conservano scelte indipendenti. Le Impostazioni filtrano i modelli in base al supporto per trascrizione streaming o batch. L'audio batch è limitato a 64 MiB di input codificato, mentre i blocchi realtime sono limitati a 256 KiB.

| Provider speech-to-text | Modelli | Modalità |
| --- | --- | --- |
| Deepgram | Nova 3; Flux | Nova 3 batch e stream; Flux stream |
| ElevenLabs | Scribe v2; Scribe v2 Realtime | Batch; stream |
| Mistral | Voxtral Mini 2602; Voxtral Mini Transcribe Realtime 2602 | Batch; stream |
| OpenAI | GPT-4o Transcribe; GPT-4o Mini Transcribe; GPT Realtime Whisper | Batch; batch; stream |
| Qwen | Qwen3 ASR Flash Realtime | Stream |
| xAI | xAI STT Batch; xAI STT Streaming | Batch; stream |

Il testo per il text-to-speech è obbligatorio e può contenere al massimo 4.096 caratteri. Tutti i sette provider seguenti dispongono di integrazioni funzionanti.

| Provider text-to-speech | Modelli |
| --- | --- |
| Cartesia | Sonic 3.5; Sonic 3 |
| Deepgram | Aura 2 |
| ElevenLabs | Eleven v3; Eleven Multilingual v2; Eleven Flash v2.5 |
| Google | Gemini 3.1 Flash TTS Preview |
| MiniMax | Speech 2.8 HD; Speech 2.8 Turbo |
| Mistral | Voxtral Mini TTS 2603 |
| OpenAI | GPT-4o Mini TTS; TTS-1 HD |

## Provider per immagini, video e audio

| Stato | Immagine |
| --- | --- |
| Disponibile | Black Forest Labs: FLUX.2, FLUX.1 Kontext Pro, FLUX1.1 Pro Ultra |
| Disponibile | Google: Gemini 3.1 Flash Image Preview, Gemini 3 Pro Image Preview |
| Disponibile | Ideogram: 3.0, 2a |
| Disponibile | Luma: Uni 1.1 |
| Disponibile | Qwen: Qwen Image, Qwen Image Edit |
| Disponibile | Stability AI: Stable Image Ultra, Stable Image Core |
| Disponibile | xAI: Grok Imagine Image, Grok Imagine Image Quality |
| Solo catalogo | Midjourney v8.1 e v7. Sono selezionabili, ma il runtime segnala che Midjourney non dispone di un'API pubblica. |

| Stato | Video |
| --- | --- |
| Disponibile | Google: Veo 3.1, Veo 3.1 Fast |
| Disponibile | Kling: 2.5 Turbo, 2.1 Master |
| Disponibile | Luma: Ray 3, Ray 2 |
| Disponibile | MiniMax: Hailuo 2.3, Hailuo 02 |
| Disponibile | Pika: 2.2 |
| Disponibile | Qwen: Wan 2.5 T2V, Wan 2.2 T2V Plus |
| Disponibile | Runway: Gen-4 Turbo, Gen-3 Alpha Turbo |
| Disponibile | xAI: Grok Imagine Video 1.5 |
| Solo catalogo | Midjourney Video v1. È selezionabile, ma non esiste un'API pubblica. |

| Stato | Audio |
| --- | --- |
| Disponibile | ElevenLabs: Eleven Music, ElevenLabs Sound Effects |
| Disponibile | Stability AI: Stable Audio 2.5 |
| Solo catalogo | Google Lyria 3 Pro Preview, Lyria 3 Clip Preview, Lyria Realtime |
| Solo catalogo | Kling Audio |
| Solo catalogo | MiniMax Music 2.6, Music Cover |
| Solo catalogo | Suno v5.5, v4.5 All |

Il catalogo audio presenta sei provider, ma attualmente solo ElevenLabs e Stability AI eseguono le richieste.

Sono presenti a catalogo anche modelli vocali realtime di Google, Luma, Qwen e xAI, ma non esiste un servizio di esecuzione realtime collegato. Al momento l'API vocale di Kucedr è text-to-speech.

## Credenziali

Le chiavi API risiedono nei dati locali di Kucedr e vengono nascoste nell'interfaccia dopo il salvataggio. Le richieste e le credenziali vengono comunque inviate al provider configurato quando necessario per autenticazione ed elaborazione. Consulta [Privacy e sicurezza](/it/docs/privacy) per sapere come vengono archiviati questi file.

## Scegliere i provider

Puoi combinare provider diversi per qualità, costo e velocità: uno per la chat dell'assistente, un altro per la trascrizione e un altro ancora per le immagini. Ogni funzione conserva la propria scelta, quindi modificarne una non cambia le altre.
