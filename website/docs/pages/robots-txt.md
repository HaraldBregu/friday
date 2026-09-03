# Robots Endpoint

Route: `/robots.txt`

Source: `src/pages/robots.txt.js`

## Purpose

The robots endpoint emits crawler instructions for the static site.

## Content Sources

- The endpoint allows all user agents.
- The sitemap URL is built from Astro `site` when available, otherwise it falls back to `/sitemap-index.xml`.
- The response content type is `text/plain; charset=utf-8`.

## Feature Docs Used

- None directly. This endpoint supports site indexing.

## Notes

If `astro.config.mjs` site settings change, verify the generated sitemap URL still points at the public canonical host.
