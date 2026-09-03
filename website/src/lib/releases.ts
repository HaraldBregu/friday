import releasesData from "../data/releases.json";

export type ReleaseAsset = {
  platform: "macOS" | "Windows" | "Linux";
  architecture: string;
  format: string;
  name: string;
  size: number;
  url: string;
};

export type Release = {
  tag: string;
  name: string;
  publishedAt: string;
  stage: string;
  stageIt: string;
  latest: boolean;
  availability: "release" | "tag";
  commit: string;
  summary: string;
  summaryIt: string;
  highlights: string[];
  highlightsIt: string[];
  githubUrl: string;
  sourceUrl: string;
  compareUrl: string | null;
  assets: ReleaseAsset[];
};

export const releases = releasesData as Release[];

export const formatReleaseDate = (publishedAt: string, style: "long" | "short" = "long", locale: "en" | "it" = "en") => {
  return new Date(publishedAt).toLocaleDateString(locale === "it" ? "it-IT" : "en", {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

export const formatAssetSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export const releasePath = (tag: string) => `/releases/${tag}`;

export const getReleaseCopy = (release: Release, locale: "en" | "it") => ({
  stage: locale === "it" ? release.stageIt : release.stage,
  summary: locale === "it" ? release.summaryIt : release.summary,
  highlights: locale === "it" ? release.highlightsIt : release.highlights,
});
