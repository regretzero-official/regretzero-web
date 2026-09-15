import type { Metadata } from "next";

import { SajuProductLanding } from "@/features/saju-report/components/saju-product-landing";

import { sajuShareMetadata } from "../saju-metadata";

export const metadata: Metadata = sajuShareMetadata({
  title: "헤어진 진짜 이유 사주 · 서나리",
  description:
    "우리 사이에 다른 사람이 있었을까? 헤어진 진짜 이유는? 점쟁이 서나리가 표면과 속을 따뜻하게 짚어줘요. 참고용이에요.",
  url: "https://www.regretzero.kr/saju/reason",
  robots: { index: false, follow: false },
});

export default function SajuBreakupReasonLandingPage() {
  return <SajuProductLanding slug="reason" />;
}
