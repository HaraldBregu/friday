# Italian Community Page

Route: `/it/community/`

Source: `src/pages/it/community.astro`

## Purpose

The Italian community page renders localized project participation copy and shared social links.

## Content Sources

- Locale is set to `it`.
- Page copy comes from `getLocaleContent("it")` in `src/i18n.ts`.
- Social links are shared from `src/data/social-links.json`.
- The page structure matches `src/pages/community.astro`.

## Feature Docs Used

- `/Users/haraldbregu/Documents/kucedr/docs/features/index.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/plugins-and-agent-harnesses.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/tooling-and-extensibility.md`

## Notes

Shared links are not localized in the page file. If social labels or destinations need localization, update the data strategy instead of hardcoding locale-specific links here.
