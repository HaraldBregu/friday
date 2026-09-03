export function GET({ site }) {
  const sitemapUrl = site ? new URL("/sitemap-index.xml", site).toString() : "/sitemap-index.xml";

  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
