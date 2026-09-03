import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import site from "../data/site.json";

const slugFor = (id) => id.replace(/\.mdx?$/, "");

export async function GET(context) {
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  return rss({
    title: `${site.name} Blog`,
    description: "Product updates, engineering notes, and integration guides.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${slugFor(post.id)}`,
    })),
  });
}
