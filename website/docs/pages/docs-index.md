# Docs Index Page

Route: `/docs/`

Source: `src/pages/docs/index.astro`

## Purpose

The docs index is the public documentation landing page. It groups the `docs` content collection by category and links to section guides plus individual docs entries.

## Content Sources

- Docs entries come from `src/content/docs`.
- Content collection schema is defined in `src/content.config.ts`.
- Grouping, sorting, category ids, icons, and docs paths come from `src/lib/docs.ts`.
- Cards render through `src/components/DocCard.astro`.

## Feature Docs Used

- `/Users/haraldbregu/Documents/kucedr/docs/features/index.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/providers-and-models.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/channels.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/connectors.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/tooling-and-extensibility.md`

## Notes

The page advertises docs as synced static Astro content. When adding docs categories or changing order, update the content frontmatter and `src/lib/docs.ts` category icon map together.
