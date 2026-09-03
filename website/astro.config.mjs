import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const fallbackSiteUrl = "https://kucedr.haraldbregu.com";

function toSiteUrl(value) {
  if (!value) {
    return undefined;
  }

  const withProtocol = /^https?:\/\//.test(value) ? value : `https://${value}`;
  return new URL(withProtocol).toString().replace(/\/$/, "");
}

const siteUrl =
  toSiteUrl(process.env.PUBLIC_SITE_URL) ??
  toSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  toSiteUrl(process.env.VERCEL_URL) ??
  fallbackSiteUrl;

export default defineConfig({
  site: siteUrl,
  output: "static",
  redirects: {
    "/enterprise": "/solutions#enterprise",
    "/education": "/solutions#education",
    "/personal": "/solutions#personal",
  },
  devToolbar: {
    enabled: false,
  },
  integrations: [sitemap()],
});
