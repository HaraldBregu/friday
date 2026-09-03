---
title: "Channels"
description: "Reach Kucedr from Telegram and Discord, with per-channel tokens, sender policies, and replies delivered to the originating thread."
category: "Channels"
sourcePath: "channels.md"
order: 40
---

Channels let you talk to Kucedr outside the desktop app. A message arrives, Kucedr runs an agent turn, and the reply goes back through the same channel. Enabled channels with a token start when the app becomes ready.

| Channel | Status | Notes |
| --- | --- | --- |
| Telegram | Available | Long-polling bot for phone or desktop chat. |
| Discord | Available | Bot for servers and direct messages, with threads and reply references. |

## Shared Behavior

- Direct, group or channel, and thread messages are normalized and routed to the agent.
- Replies target the originating chat, message, and thread where the platform supports it.
- Each channel uses its own configured chat provider and model for replies.
- Long replies are split into platform-sized parts, and delivery receipts distinguish sent, partial, and failed delivery.
- `/start` returns a fixed connected greeting. Other slash-prefixed channel messages are ignored.
- All accepted Telegram and Discord messages currently share one fixed bot-session identifier, so channel traffic is not separated per sender.

## Telegram

- Long polling, with pending updates dropped at start.
- Connection, error, and disconnected status events.
- A 60-second health check and exponential reconnect delay from 2 to 60 seconds.
- In-memory duplicate-message protection.
- Replies split at 4,096 characters.
- Start, stop, and restart from the renderer.

## Discord

- Guild, guild-message, direct-message, and message-content intents.
- Bot-authored messages are ignored.
- Threads and reply references are supported.
- Reconnection is handled by discord.js.
- Replies split at 2,000 characters.

## Access Control

Each channel keeps its own enabled state, token, direct-message policy, direct-sender allowlist, group or channel allowlist, and reply model.

- Disabled or tokenless channels reject input, and empty messages are ignored.
- Direct-message policy can be **Allowlist** (the default), **Open**, **Pairing**, or **Deny**.
- Allowlist mode accepts only configured sender IDs.
- An optional group or channel list restricts which route IDs are accepted.

**Partial.** Pairing is not usable yet: the policy always rejects with `pairing_required`, and there is no code-generation or approval flow behind it.

Channel tokens are masked in the interface after saving, but they are stored in ordinary local configuration files. See [Privacy And Security](/docs/privacy).

## Known Gap

The Channels screen shows live runtime status for Telegram only and labels Discord "config only," even though the main process does start Discord when it is enabled and has a token.
