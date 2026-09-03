import type { CollectionEntry } from "astro:content";
import type { Locale } from "../i18n";

export type DocEntry = CollectionEntry<"docs">;

export const categoryIcons: Record<string, string> = {
  AI: "Bot",
  Automation: "Clock",
  Channels: "RadioTower",
  Core: "Layers",
  Data: "Database",
  Extension: "PlugZap",
  Models: "Sparkles",
  Privacy: "ShieldCheck",
  Providers: "Server",
  Product: "BookOpen",
  "Renderer UI": "Monitor",
  System: "Cpu",
  Tasks: "Clock",
};

const categoryLabelsIt: Record<string, string> = {
  Automation: "Automazione",
  Channels: "Canali",
  Extension: "Estensioni",
  Privacy: "Privacy",
  Providers: "Provider",
  Product: "Prodotto",
};

export function docsSlug(sourcePath: string) {
  return sourcePath.replace(/\.mdx?$/, "").replace(/\/index$/, "");
}

export function docsPath(sourcePath: string, locale: Locale = "en") {
  const slug = docsSlug(sourcePath);
  const docsRoot = locale === "it" ? "/it/docs" : "/docs";
  return `${docsRoot}/${slug ? `${slug}/` : ""}`;
}

export function docsForLocale(docs: DocEntry[], locale: Locale) {
  return docs.filter((doc) => doc.data.locale === locale);
}

export function docCategoryLabel(category: string, locale: Locale) {
  return locale === "it" ? categoryLabelsIt[category] ?? category : category;
}

export function categoryId(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function compareDocs(a: DocEntry, b: DocEntry) {
  const categoryOrder = a.data.order - b.data.order;
  if (categoryOrder !== 0) {
    return categoryOrder;
  }

  const categoryName = a.data.category.localeCompare(b.data.category);
  if (categoryName !== 0) {
    return categoryName;
  }

  const aIndex = a.data.sourcePath.endsWith("/index.md") ? 0 : 1;
  const bIndex = b.data.sourcePath.endsWith("/index.md") ? 0 : 1;
  if (aIndex !== bIndex) {
    return aIndex - bIndex;
  }

  return a.data.title.localeCompare(b.data.title);
}

export function groupDocs(docs: DocEntry[]) {
  const groups = new Map<string, DocEntry[]>();

  for (const doc of docs) {
    const group = groups.get(doc.data.category) ?? [];
    group.push(doc);
    groups.set(doc.data.category, group);
  }

  return [...groups.entries()]
    .map(([category, items]) => ({
      category,
      icon: categoryIcons[category] ?? "BookOpen",
      id: categoryId(category),
      order: Math.min(...items.map((item) => item.data.order)),
      items: items.sort(compareDocs),
    }))
    .sort((a, b) => a.order - b.order || a.category.localeCompare(b.category));
}

export function readingTime(body: string) {
  return Math.max(1, Math.ceil(body.trim().split(/\s+/).length / 220));
}
