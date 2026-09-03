# Docs Reader Page

Route: `/docs/[...slug]/`

Source: `src/pages/docs/[...slug].astro`

## Purpose

The docs reader renders each public docs content entry as a static page with a category sidebar, metadata, article body, pagination, and table of contents.

## Content Sources

- Generated paths come from every entry in the `docs` content collection.
- Slugs and canonical paths are derived with `docsSlug` and `docsPath` in `src/lib/docs.ts`.
- The article body and headings come from Astro content collection rendering.
- Previous and next links use `compareDocs` ordering.

## Feature Docs Used

- `/Users/haraldbregu/Documents/kucedr/docs/features/index.md`
- Use the matching feature doc for each public docs topic when updating content under `src/content/docs`.

## Notes

Docs entries require `title`, `description`, `category`, `sourcePath`, and `order` frontmatter. The TOC only includes depth 2 and depth 3 headings and is capped at 12 items.
