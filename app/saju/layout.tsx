import type { Metadata } from "next";

import {
  SAJU_OG_IMAGE_PATH,
  SAJU_SITE_NAME,
  sajuOgImage,
} from "./saju-metadata";

const sajuUrl = "https://www.regretzero.kr/saju";
const sajuTitle = "사주 리포트 · 재회운·속마음·이별 결정";
const sajuDescription =
  "서나리 · 백련 · 차유리 · 한보라 · 이도령 · 한시우 · 강세온의 밤의 사주 상담 리포트. 재회운·상대 속마음·이별 결정·행동 전략. 참고용이에요. 절대 결과가 아니에요.";

export const metadata: Metadata = {
  description: sajuDescription,
  openGraph: {
    description: sajuDescription,
    images: [sajuOgImage],
    locale: "ko_KR",
    siteName: SAJU_SITE_NAME,
    title: sajuTitle,
    type: "website",
    url: sajuUrl,
  },
  title: {
    default: sajuTitle,
    template: `%s | ${SAJU_SITE_NAME}`,
  },
  twitter: {
    card: "summary_large_image",
    description: sajuDescription,
    images: [SAJU_OG_IMAGE_PATH],
    title: sajuTitle,
  },
};

export default function SajuLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
