# Tools Page

Route: `/tools/`

Source: `src/pages/tools.astro`

## Purpose

The tools page documents the local agent tool surface and dynamic extension tools exposed by Kucedr when policy and runtime configuration allow them.

## Content Sources

- Local tool cards come from `src/data/tools.json`.
- Dynamic tool copy is defined in `src/pages/tools.astro`.
- Shared UI uses `src/components/CTASection.astro`, `src/components/Icon.astro`, and `src/layouts/Layout.astro`.

## Feature Docs Used

- `/Users/haraldbregu/Documents/kucedr/docs/features/tooling-and-extensibility.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/browser-automation.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/skills.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/plugins-and-agent-harnesses.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/connectors.md`

## Notes

The tool count and selection rules should stay tied to the local registry described in the feature docs: file tools, shell/process tools, web tools, browser automation, cron, task, and runtime materialized connector, plugin, MCP, LSP, or client-hosted tools. Keep approval, policy, ranking, loop detection, and per-turn cap language intact.
