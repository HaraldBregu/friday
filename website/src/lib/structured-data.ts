import type { Locale } from "../i18n";
import { socialImageObject } from "./social-images";

interface HomepageStructuredDataInput {
  description: string;
  faqs?: { question: string; answer: string }[];
  featureNames: string[];
  locale: Locale;
  siteBaseUrl: URL;
  tagline: string;
}

const PRODUCT_REPOSITORY_URL = "https://github.com/HaraldBregu/kucedr";
const PRODUCT_DOWNLOAD_URL = `${PRODUCT_REPOSITORY_URL}/releases`;

export function buildHomepageStructuredData({
  description,
  faqs = [],
  featureNames,
  locale,
  siteBaseUrl,
  tagline,
}: HomepageStructuredDataInput) {
  const language = locale === "it" ? "it-IT" : "en";
  const pagePath = locale === "it" ? "/it/" : "/";
  const homepageUrl = new URL(pagePath, siteBaseUrl).toString();
  const organizationId = new URL("/#organization", siteBaseUrl).toString();
  const websiteId = new URL("/#website", siteBaseUrl).toString();
  const applicationId = new URL("/#software-application", siteBaseUrl).toString();
  const primaryImage = socialImageObject("default", siteBaseUrl, locale, homepageUrl);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Kucedr",
        url: new URL("/", siteBaseUrl).toString(),
        logo: new URL("/icon-rounded.png", siteBaseUrl).toString(),
        sameAs: [PRODUCT_REPOSITORY_URL],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: "Kucedr",
        url: new URL("/", siteBaseUrl).toString(),
        inLanguage: ["en", "it"],
        publisher: { "@id": organizationId },
      },
      {
        ...primaryImage,
      },
      {
        "@type": "SoftwareApplication",
        "@id": applicationId,
        name: "Kucedr",
        description,
        url: homepageUrl,
        downloadUrl: PRODUCT_DOWNLOAD_URL,
        applicationCategory: "ProductivityApplication",
        applicationSubCategory: "AI assistant",
        operatingSystem: "macOS, Windows, Linux",
        softwareVersion: "1.0.2 beta",
        inLanguage: ["en", "it"],
        featureList: featureNames,
        image: { "@id": primaryImage["@id"] },
        author: { "@id": organizationId },
      },
      {
        "@type": "WebPage",
        "@id": `${homepageUrl}#webpage`,
        name: `Kucedr - ${tagline}`,
        url: homepageUrl,
        description,
        inLanguage: language,
        isPartOf: { "@id": websiteId },
        about: { "@id": applicationId },
        mainEntity: { "@id": applicationId },
        primaryImageOfPage: { "@id": primaryImage["@id"] },
      },
      ...(faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${homepageUrl}#faq`,
              inLanguage: language,
              isPartOf: { "@id": websiteId },
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
              })),
            },
          ]
        : []),
    ],
  };
}

interface DocStructuredDataInput {
  category: string;
  description: string;
  path: string;
  siteBaseUrl: URL;
  title: string;
  locale?: Locale;
}

export function buildDocStructuredData({
  category,
  description,
  path,
  siteBaseUrl,
  title,
  locale = "en",
}: DocStructuredDataInput) {
  const pageUrl = new URL(path, siteBaseUrl).toString();
  const organizationId = new URL("/#organization", siteBaseUrl).toString();
  const primaryImage = socialImageObject("default", siteBaseUrl, locale, pageUrl);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${pageUrl}#article`,
        headline: title,
        description,
        url: pageUrl,
        inLanguage: locale === "it" ? "it-IT" : "en",
        articleSection: category,
        isPartOf: { "@id": new URL("/#website", siteBaseUrl).toString() },
        author: { "@id": organizationId },
        publisher: { "@id": organizationId },
        image: { "@id": primaryImage["@id"] },
        mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
      },
      primaryImage,
      breadcrumb(
        [
          { name: "Home", path: locale === "it" ? "/it/" : "/" },
          { name: locale === "it" ? "Documentazione" : "Documentation", path: locale === "it" ? "/it/docs" : "/docs" },
          { name: title, path },
        ],
        siteBaseUrl,
      ),
    ],
  };
}

interface BlogPostStructuredDataInput {
  author: string;
  description: string;
  modifiedDate?: Date;
  path: string;
  publishedDate: Date;
  siteBaseUrl: URL;
  tags: string[];
  title: string;
}

export function buildBlogPostStructuredData({
  author,
  description,
  modifiedDate,
  path,
  publishedDate,
  siteBaseUrl,
  tags,
  title,
}: BlogPostStructuredDataInput) {
  const pageUrl = new URL(path, siteBaseUrl).toString();
  const organizationId = new URL("/#organization", siteBaseUrl).toString();
  const primaryImage = socialImageObject("blog", siteBaseUrl, "en", pageUrl);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${pageUrl}#post`,
        headline: title,
        description,
        url: pageUrl,
        inLanguage: "en",
        datePublished: publishedDate.toISOString(),
        dateModified: (modifiedDate ?? publishedDate).toISOString(),
        keywords: tags,
        author: { "@type": "Organization", name: author },
        publisher: { "@id": organizationId },
        mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
        image: { "@id": primaryImage["@id"] },
      },
      primaryImage,
      breadcrumb(
        [
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: title, path },
        ],
        siteBaseUrl,
      ),
    ],
  };
}

function breadcrumb(items: { name: string; path: string }[], siteBaseUrl: URL) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, siteBaseUrl).toString(),
    })),
  };
}
