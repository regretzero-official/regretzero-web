import type { Metadata } from "next";

import { SajuProductLanding } from "@/features/saju-report/components/saju-product-landing";

export const metadata: Metadata = {
  title: "재회운 사주 · 백련",
  description:
    "그 사람, 아직 나에게 마음이 남아 있을까? 무당 백련이 재회 가능성과 타이밍을 짚어줘요. 참고용이에요.",
  robots: { index: false, follow: false },
};

export default function SajuReunionLandingPage() {
  return <SajuProductLanding slug="reunion" />;
}
