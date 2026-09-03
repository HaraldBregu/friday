# Community Page

Route: `/community/`

Source: `src/pages/community.astro`

## Purpose

The community page is a contribution and project participation surface. It explains the community values, links to social or project destinations, and closes with a CTA.

## Content Sources

- Page title, description, hero copy, card copy, and CTA copy come from `getLocaleContent("en")` in `src/i18n.ts`.
- External links come from `src/data/social-links.json`.
- Shared UI uses `src/components/CTASection.astro`, `src/components/Icon.astro`, and `src/layouts/Layout.astro`.

## Feature Docs Used

- `/Users/haraldbregu/Documents/kucedr/docs/features/index.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/plugins-and-agent-harnesses.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/tooling-and-extensibility.md`

## Notes

Community copy should stay aligned with documented extension surfaces: plugins, MCP, skills, local tools, and provider or channel contribution paths. Do not imply runtime completeness where a feature doc marks a surface as partial or catalog-only.
