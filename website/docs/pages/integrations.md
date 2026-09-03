# Integrations Page

Route: `/integrations/`

Source: `src/pages/integrations.astro`

## Purpose

The integrations page presents Kucedr's integration catalog grouped by category. It covers code tools, channels, connectors, data, infrastructure, AI providers, and media-related surfaces.

## Content Sources

- Page copy and CTA copy come from `getLocaleContent("en")` in `src/i18n.ts`.
- Integration cards are loaded from `src/data/integrations.json`.
- Cards render through `src/components/IntegrationCard.astro`.

## Feature Docs Used

- `/Users/haraldbregu/Documents/kucedr/docs/features/connectors.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/channels.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/providers-and-models.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/tooling-and-extensibility.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/plugins-and-agent-harnesses.md`

## Notes

Keep the distinction between local runtime, catalog, provider-hosted, MCP, and plugin-backed integrations. The source feature docs identify Gmail, Google Calendar, Google Drive, and Telegram as local runtime paths, while many other entries are catalog or extension surfaces.
