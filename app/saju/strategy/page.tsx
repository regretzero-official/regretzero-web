import type { Metadata } from "next";

import { SajuProductLanding } from "@/features/saju-report/components/saju-product-landing";

export const metadata: Metadata = {
  title: "재회 행동 전략 · 한보라",
  description:
    "지금 연락해도 될까? 아이돌 한보라가 재접근 타이밍과 첫 문장까지 짚어줘요. 참고용이에요.",
  robots: { index: false, follow: false },
};

export default function SajuStrategyLandingPage() {
  return <SajuProductLanding slug="strategy" />;
}
