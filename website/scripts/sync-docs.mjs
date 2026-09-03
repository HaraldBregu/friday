import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const sourceRoot = path.resolve(process.env.KUCEDR_DOCS_SOURCE ?? "/Users/haraldbregu/Documents/kucedr/docs");
const outputRoot = path.join(repoRoot, "src/content/docs");

const categories = {
  ai: { label: "AI", order: 70 },
  channels: { label: "Channels", order: 30 },
  connectors: { label: "Connectors", order: 40 },
  data: { label: "Data", order: 80 },
  models: { label: "Models", order: 10 },
  providers: { label: "Providers", order: 20 },
  system: { label: "System", order: 60 },
  tasks: { label: "Tasks", order: 50 },
  ui: { label: "Renderer UI", order: 90 },
};

async function listMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listMarkdownFiles(fullPath);
      }

      return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
    })
  );

  return files.flat().sort((a, b) => a.localeCompare(b));
}

function stripFrontmatter(markdown) {
  return markdown.replace(/^---\n[\s\S]*?\n---\n?/, "");
}

function extractTitle(markdown, sourcePath) {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1].trim();
  }

  return path.basename(sourcePath, ".md").replace(/-/g, " ");
}

function cleanInlineMarkdown(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDescription(markdown) {
  const body = stripFrontmatter(markdown).split("\n");
  let inFence = false;
  let paragraph = [];

  for (const rawLine of body) {
    const line = rawLine.trim();
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }

    if (inFence) {
      continue;
    }

    const shouldSkip =
      !line ||
      line.startsWith("#") ||
      line.startsWith("|") ||
      /^[-*:]+$/.test(line) ||
      /^[-*]\s+/.test(line) ||
      /^\d+\.\s+/.test(line) ||
      line.startsWith(">");

    if (shouldSkip) {
      if (paragraph.length > 0) {
        break;
      }
      continue;
    }

    paragraph.push(line);
  }

  const description = cleanInlineMarkdown(paragraph.join(" "));
  return description.length > 190 ? `${description.slice(0, 187).trim()}...` : description;
}

function categoryFor(sourcePath) {
  const [topLevel] = sourcePath.split("/");
  const config = categories[topLevel];
  return config ?? { label: "Core", order: 0 };
}

function docRouteFromSource(sourcePath) {
  let route = sourcePath.replace(/\.md$/, "");
  route = route.replace(/\/index$/, "");
  return `/docs/${route ? `${route}/` : ""}`;
}

function rewriteMarkdownLinks(markdown, currentSourcePath) {
  const currentDir = path.posix.dirname(currentSourcePath);

  return markdown.replace(/(\[[^\]]+\]\()((?![a-z]+:|#|\/)[^)#\s]+\.md)(#[^)]+)?(\))/gi, (match, start, target, hash = "", end) => {
    const resolvedSource = path.posix.normalize(path.posix.join(currentDir, target));
    return `${start}${docRouteFromSource(resolvedSource)}${hash}${end}`;
  });
}

function stripFirstHeading(markdown) {
  return markdown.replace(/^#\s+.+\n+/, "");
}

function frontmatter(data) {
  return [
    "---",
    `title: ${JSON.stringify(data.title)}`,
    `description: ${JSON.stringify(data.description)}`,
    `category: ${JSON.stringify(data.category)}`,
    `sourcePath: ${JSON.stringify(data.sourcePath)}`,
    `order: ${data.order}`,
    "---",
    "",
  ].join("\n");
}

async function sync() {
  const sourceFiles = await listMarkdownFiles(sourceRoot);

  if (sourceFiles.length === 0) {
    throw new Error(`No markdown files found in ${sourceRoot}`);
  }

  await rm(outputRoot, { recursive: true, force: true });

  for (const sourceFile of sourceFiles) {
    const sourcePath = path.relative(sourceRoot, sourceFile).split(path.sep).join("/");
    const raw = stripFrontmatter(await readFile(sourceFile, "utf8"));
    const title = extractTitle(raw, sourcePath);
    const description = extractDescription(raw);
    const category = categoryFor(sourcePath);
    const outputPath = path.join(outputRoot, sourcePath);
    const body = stripFirstHeading(rewriteMarkdownLinks(raw, sourcePath)).trimStart();

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(
      outputPath,
      `${frontmatter({
        title,
        description,
        category: category.label,
        sourcePath,
        order: category.order,
      })}${body}`,
      "utf8"
    );
  }

  console.log(`Synced ${sourceFiles.length} docs from ${sourceRoot} to ${outputRoot}`);
}

sync().catch((error) => {
  console.error(error);
  process.exit(1);
});
