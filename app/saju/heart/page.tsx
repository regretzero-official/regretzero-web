import type { Metadata } from "next";

import { SajuProductLanding } from "@/features/saju-report/components/saju-product-landing";

import { sajuShareMetadata } from "../saju-metadata";

export const metadata: Metadata = sajuShareMetadata({
  title: "상대 속마음 사주 · 서나리",
  description:
    "연락 없는 그 사람, 속마음은 뭘까요? 상담사 서나리가 거리감과 남은 마음을 짚어줘요. 참고용이에요.",
  url: "https://www.regretzero.kr/saju/heart",
  robots: { index: false, follow: false },
});

export default function SajuHeartLandingPage() {
  return <SajuProductLanding slug="heart" />;
}
