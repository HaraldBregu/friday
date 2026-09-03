# Kucedr

A desktop AI assistant for macOS. Summon it with Option Space, ask for help, and get back to what you were doing.

The home page is built from Astro components, JSON data, custom CSS, and a small
vanilla JavaScript demo. It intentionally does not use React, Tailwind, or a
client-side UI framework.

## Commands

```sh
bun install
bun run dev
bun run build
bun run preview
```

## Deploying to Vercel

The repository includes `vercel.json` so Vercel can build the static Astro
site with Bun and serve the generated `dist` directory.

Recommended Vercel settings:

- Framework Preset: `Astro`
- Install Command: `bun install --frozen-lockfile`
- Build Command: `bun run build`
- Output Directory: `dist`

Set `PUBLIC_SITE_URL` in Vercel to the final production URL, for example
`https://kucedr.example.com`. If it is not set, the build falls back to Vercel's
deployment URL and then to the placeholder URL in `astro.config.mjs`.

## Project Structure

```txt
public/
  favicon.svg
  og-image.svg
  robots.txt
src/
  components/       Reusable Astro components
  content/blog/     Markdown blog posts
  data/             JSON content for features, integrations, proof, and links
  layouts/          Shared page and blog layouts
  pages/            Static routes and RSS feed
  styles/global.css Custom CSS variables and responsive styling
```

## Customization Notes

- Global colors, spacing, typography, borders, and shadows live in `src/styles/global.css`.
- Reusable content lives in `src/data/*.json`.
- The main landing page content is in `src/data/kucedr-product.json`.
- Blog posts are Markdown files in `src/content/blog`.
- SEO defaults, Open Graph image, canonical URLs, and theme initialization are handled in `src/layouts/Layout.astro`.
- The site is configured for static output in `astro.config.mjs`.
- Optional analytics can be added in `Layout.astro` near the closing `body` tag, then removed without touching page components.
