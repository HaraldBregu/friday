import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const dist = join(root, "dist");
const expectedImages = new Set([
  "/og/kucedr-journal-notes-for-builders.png",
  "/og/kucedr-personal-ai-assistant.png",
]);

async function filesWithin(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? filesWithin(path) : [path];
    }),
  );

  return files.flat();
}

function attribute(tag, name) {
  return tag.match(new RegExp(`${name}="([^"]*)"`, "i"))?.[1];
}

function meta(html, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tag = html.match(new RegExp(`<meta[^>]+(?:name|property)="${escapedKey}"[^>]*>`, "i"))?.[0];
  return tag ? attribute(tag, "content") : undefined;
}

function canonical(html) {
  const tag = html.match(/<link[^>]+rel="canonical"[^>]*>/i)?.[0];
  return tag ? attribute(tag, "href") : undefined;
}

const errors = [];
const imageMetadata = new Map();
const pages = (await filesWithin(dist)).filter((file) => file.endsWith(".html"));

for (const file of pages) {
  const html = await readFile(file, "utf8");
  const label = file.slice(dist.length) || "/index.html";
  const robots = meta(html, "robots");
  const isNoindex = robots?.includes("noindex") ?? false;
  const isRedirect = html.includes('http-equiv="refresh"');
  const image = meta(html, "og:image");

  if (!html.match(/<title>[^<]+<\/title>/i)) errors.push(`${label}: missing title`);
  if (!canonical(html)?.startsWith("https://")) errors.push(`${label}: canonical must be absolute HTTPS`);
  if (!robots) errors.push(`${label}: missing robots metadata`);
  if (isRedirect) {
    if (!isNoindex) errors.push(`${label}: redirect page must be noindex`);
    continue;
  }
  if (!meta(html, "description")) errors.push(`${label}: missing meta description`);
  if (!isNoindex && !robots?.includes("max-image-preview:large")) {
    errors.push(`${label}: indexed page does not allow large image previews`);
  }
  if (!image?.startsWith("https://")) errors.push(`${label}: og:image must be absolute HTTPS`);
  if (meta(html, "og:image:secure_url") !== image) errors.push(`${label}: og:image:secure_url mismatch`);
  if (meta(html, "twitter:image") !== image) errors.push(`${label}: twitter:image mismatch`);
  if (!meta(html, "og:image:alt")) errors.push(`${label}: missing og:image:alt`);
  if (!meta(html, "twitter:image:alt")) errors.push(`${label}: missing twitter:image:alt`);
  if (!isNoindex && !html.includes('"@type":"ImageObject"')) {
    errors.push(`${label}: structured data has no ImageObject`);
  }

  if (!image) continue;
  const imageUrl = new URL(image);
  if (!expectedImages.has(imageUrl.pathname)) errors.push(`${label}: unexpected active social image ${imageUrl.pathname}`);
  const imagePath = join(dist, imageUrl.pathname.replace(/^\//, ""));

  try {
    await stat(imagePath);
    let metadata = imageMetadata.get(imagePath);
    if (!metadata) {
      metadata = await sharp(imagePath).metadata();
      imageMetadata.set(imagePath, metadata);
    }
    if (String(metadata.width) !== meta(html, "og:image:width")) errors.push(`${label}: og:image:width mismatch`);
    if (String(metadata.height) !== meta(html, "og:image:height")) errors.push(`${label}: og:image:height mismatch`);
  } catch {
    errors.push(`${label}: social image is missing from the static output`);
  }
}

const activeOgFiles = (await readdir(join(dist, "og"), { withFileTypes: true }))
  .filter((entry) => entry.isFile())
  .map((entry) => `/og/${entry.name}`);

if (activeOgFiles.length !== expectedImages.size || activeOgFiles.some((file) => !expectedImages.has(file))) {
  errors.push(`expected exactly ${expectedImages.size} active OG files, found: ${activeOgFiles.join(", ")}`);
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`SEO metadata verified for ${pages.length} static pages and ${expectedImages.size} active social images.`);
}
