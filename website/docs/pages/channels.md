# Channels Page

Route: `/channels/`

Source: `src/pages/channels.astro`

## Purpose

The channels page lists Telegram as the supported Kucedr channel today and separates planned adapters from bundled runtime channels. It also explains DM policy modes and the inbound message flow.

## Content Sources

- Channel catalog data comes from `src/data/channels.json`.
- Runtime grouping is computed from each channel's `runtime` value.
- DM labels and inbound-flow copy are defined in `src/pages/channels.astro`.
- Shared UI uses `src/components/CTASection.astro`, `src/components/Icon.astro`, and `src/layouts/Layout.astro`.

## Feature Docs Used

- `/Users/haraldbregu/Documents/kucedr/docs/features/channels.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/connectors.md`

## Notes

The feature docs identify Telegram as the bundled local runtime. Other listed channels are catalog-only until a runtime adapter is registered. Keep the page copy clear that channel accounts, allow-lists, DM policy, delivery targets, and adapter state determine whether a channel can receive and send messages.
