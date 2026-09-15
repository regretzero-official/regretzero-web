import type { Metadata } from "next";

import { SajuProductLanding } from "@/features/saju-report/components/saju-product-landing";

import { sajuShareMetadata } from "../saju-metadata";

export const metadata: Metadata = sajuShareMetadata({
  title: "이별 결정 사주 · 차유리",
  description:
    "이 사람, 붙잡아야 할까 끝내야 할까? 깍쟁이 차유리가 후회 덜한 쪽을 짚어줘요. 참고용이에요.",
  url: "https://www.regretzero.kr/saju/breakup",
  robots: { index: false, follow: false },
});

export default function SajuBreakupLandingPage() {
  return <SajuProductLanding slug="breakup" />;
}
