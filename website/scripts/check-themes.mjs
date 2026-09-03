import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const collectHtml = (directory) => readdirSync(directory).flatMap((entry) => {
  const path = join(directory, entry);
  return statSync(path).isDirectory() ? collectHtml(path) : path.endsWith(".html") ? [path] : [];
});
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  console.log(`PASS ${message}`);
};

const pages = collectHtml(join(root, "dist")).map((path) => ({
  route: `/${relative(join(root, "dist"), path).replace(/index\.html$/, "").replace(/\.html$/, "")}`,
  html: readFileSync(path, "utf8"),
}));
const interactivePages = pages.filter(({ html }) => !html.includes('http-equiv="refresh"'));
const landingPages = interactivePages.filter(({ html }) => html.includes('class="kucedr-landing-page"'));
const docsPages = interactivePages.filter(({ html }) => /<body class="[^"]*\bdocs-product-page\b/.test(html));
const catalogPages = interactivePages.filter(({ html }) => /<body class="[^"]*\bcatalog-product-page\b/.test(html));

assert(interactivePages.length > 0, "static build contains interactive pages");
assert(interactivePages.every(({ html }) => (html.match(/class="theme-toggle"/g) ?? []).length === 1), "every page renders one theme switch");
assert(interactivePages.every(({ html }) => html.includes("data-theme-color")), "every page exposes a browser theme-color target");
assert(interactivePages.every(({ html }) => html.includes('localStorage.getItem("theme")')), "every page restores a saved theme");
assert(interactivePages.every(({ html }) => html.includes('matchMedia("(prefers-color-scheme: light)")')), "every page follows the system theme by default");
assert(interactivePages.every(({ html }) => html.includes("root.style.colorScheme = theme")), "every page publishes its active color scheme");
assert(interactivePages.every(({ html }) => html.includes('querySelectorAll("[data-theme-toggle]")')), "every page synchronizes all theme controls");
assert(landingPages.length >= 2, "English and Italian landing pages share the themed product shell");
assert(docsPages.length >= 2, "docs index and articles share the themed docs shell");
assert(catalogPages.length >= 3, "provider and integration routes share the themed catalog shell");
assert(landingPages.length + docsPages.length + catalogPages.length === interactivePages.length, "every interactive route uses a current themed shell");

const globalCss = read("src/styles/global.css");
const landingCss = read("src/styles/kucedr-landing.css");
const docsCss = read("src/styles/docs-kucedr.css");
const catalogCss = read("src/styles/catalog-pages.css");

assert(globalCss.includes('[data-theme="light"] {'), "global styles define light semantic tokens");
assert(globalCss.includes("--text-muted: #5f6464") && globalCss.includes("--text-soft: #343838"), "light secondary text uses readable contrast");
assert(globalCss.includes("--red: #b42318") && globalCss.includes("--yellow: #805500"), "light status colors retain readable contrast");
assert(landingCss.includes('[data-theme="light"] .kucedr-landing-page'), "landing styles define a light product palette");
assert(docsCss.includes('[data-theme="light"] .docs-product-page'), "docs styles define a light product palette");
assert(catalogCss.includes('[data-theme="light"] .catalog-product-page'), "catalog styles define a light product palette");
assert(docsCss.includes('[data-theme="light"] .docs-product-page main'), "docs reading surface adapts to light mode");
assert(docsCss.includes('[data-theme="light"] .docs-product-page .site-footer'), "docs footer adapts to light mode");
assert(/@media \(max-width: 680px\)[\s\S]*?\.fr-nav__github \{\s*display: none;/.test(landingCss), "shared mobile navigation avoids crowded actions");

console.log(`Verified light and dark theme support across ${interactivePages.length} static routes.`);
