import type { Locale } from "../i18n";

export const socialImages = {
  default: {
    path: "/og/kucedr-personal-ai-assistant.png",
    width: 1200,
    height: 630,
    type: "image/png",
    alt: {
      en: "Kucedr desktop AI assistant with connected task panels and flowing violet and blue light.",
      it: "Kucedr, assistente AI desktop, con pannelli operativi connessi e flussi di luce viola e blu.",
    },
  },
  blog: {
    path: "/og/kucedr-journal-notes-for-builders.png",
    width: 1200,
    height: 630,
    type: "image/png",
    alt: {
      en: "Kucedr Journal cover with a luminous editorial workspace and the words Notes for builders.",
      it: "Copertina di Kucedr Journal con uno spazio editoriale luminoso e il testo Notes for builders.",
    },
  },
} as const;

export type SocialImageKey = keyof typeof socialImages;

export function socialImageForPath(path: string, locale: Locale) {
  const knownImage = Object.values(socialImages).find((candidate) => candidate.path === path);
  const image = knownImage ?? { ...socialImages.default, path };

  return {
    ...image,
    alt: image.alt[locale],
  };
}

export function socialImageObject(key: SocialImageKey, siteBaseUrl: URL, locale: Locale, pageUrl: string) {
  const image = socialImages[key];
  const url = new URL(image.path, siteBaseUrl).toString();

  return {
    "@type": "ImageObject",
    "@id": `${pageUrl}#primaryimage`,
    url,
    contentUrl: url,
    width: image.width,
    height: image.height,
    encodingFormat: image.type,
    caption: image.alt[locale],
    inLanguage: locale === "it" ? "it-IT" : "en",
    representativeOfPage: true,
  };
}
