# Blog Index Page

Route: `/blog/`

Source: `src/pages/blog/index.astro`

## Purpose

The blog index lists published product updates, engineering notes, and integration guides in reverse chronological order.

## Content Sources

- Blog entries come from the `blog` content collection in `src/content/blog`.
- Draft posts are filtered out with `!data.draft`.
- Metadata schema is defined in `src/content.config.ts`.
- Reading time is computed from each post body at roughly 220 words per minute.

## Feature Docs Used

- `/Users/haraldbregu/Documents/kucedr/docs/features/index.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/connectors.md`
- `/Users/haraldbregu/Documents/kucedr/docs/features/tooling-and-extensibility.md`

## Notes

Use blog posts for narrative updates, not as the source of truth for runtime support. When a post mentions a feature, verify status against the feature docs and public docs content before changing page copy.
