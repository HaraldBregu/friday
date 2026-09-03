# Italian Integrations Page

Route: `/it/integrations/`

Source: `src/pages/it/integrations.astro`

## Purpose

The Italian integrations page renders the localized integration catalog grouped by category.

## Content Sources

- Locale is set to `it`.
- Integration copy and page labels come from `getLocaleContent("it")` in `src/i18n.ts`.
- The page structure matches `src/pages/integrations.astro`.
- Cards render through `src/components/IntegrationCard.astro`.

## Feature Docs Used

- `/Users/haraldbregu/Documents/kucedr/docs/features/connectors.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/channels.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/providers-and-models.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/tooling-and-extensibility.md`

## Notes

The localized catalog should preserve the same runtime meaning as English. Do not translate partial or catalog-only features into claims of full local execution.
