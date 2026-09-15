import type { Metadata } from "next";

export const SAJU_SITE_NAME = "Regretzero 사주";
export const SAJU_OG_ALT = "Regretzero 사주 · 재회운·속마음 리포트";

/** File-convention route; metadataBase makes this absolute. */
export const SAJU_OG_IMAGE_PATH = "/saju/opengraph-image";

export const sajuOgImage = {
  alt: SAJU_OG_ALT,
  height: 630,
  url: SAJU_OG_IMAGE_PATH,
  width: 1200,
} as const;

export function sajuShareMetadata({
  title,
  description,
  url,
  robots,
}: {
  title: string;
  description: string;
  url: string;
  robots?: Metadata["robots"];
}): Metadata {
  return {
    description,
    openGraph: {
      description,
      images: [sajuOgImage],
      locale: "ko_KR",
      siteName: SAJU_SITE_NAME,
      title,
      type: "website",
      url,
    },
    robots,
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [SAJU_OG_IMAGE_PATH],
      title,
    },
  };
}
