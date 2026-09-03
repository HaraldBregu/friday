# RSS Endpoint

Route: `/rss.xml`

Source: `src/pages/rss.xml.js`

## Purpose

The RSS endpoint publishes non-draft blog posts as a feed.

## Content Sources

- Feed generation uses `@astrojs/rss`.
- Posts come from the `blog` content collection and are filtered to exclude drafts.
- Items use post title, description, publication date, and `/blog/[slug]` link.
- Feed title uses `src/data/site.json`.

## Feature Docs Used

- None directly. Blog posts should independently cite or align with the relevant feature docs when they discuss product support.

## Notes

The endpoint depends on `context.site`. Keep `astro.config.mjs` configured for the production site so feed links are absolute and valid.
