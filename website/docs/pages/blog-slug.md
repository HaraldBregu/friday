# Blog Post Page

Route: `/blog/[slug]/`

Source: `src/pages/blog/[slug].astro`

## Purpose

The blog post page renders each non-draft blog content entry as a static route.

## Content Sources

- Generated paths come from `getCollection("blog", ({ data }) => !data.draft)`.
- Slugs are derived from each content entry id without the Markdown extension.
- Body rendering uses Astro content collection `render(post)`.
- The page is wrapped with `src/layouts/BlogPostLayout.astro`.

## Feature Docs Used

- `/Users/haraldbregu/Documents/kucedr/docs/features/index.md`
- Use the specific feature doc that matches the post topic when editing post content.

## Notes

Every published file in `src/content/blog` becomes a route. Keep frontmatter aligned with the schema in `src/content.config.ts`: `title`, `description`, `pubDate`, optional `updatedDate`, `author`, `tags`, and optional `draft`.
