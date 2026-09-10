import type { Metadata } from "next";

import { SajuProductLanding } from "@/features/saju-report/components/saju-product-landing";

export const metadata: Metadata = {
  title: "이별 결정 사주 · 차유리",
  description:
    "이 사람, 붙잡아야 할까 끝내야 할까? 깍쟁이 차유리가 후회 덜한 쪽을 정리해드려요. 엔터테인먼트용이며 실제 예언이 아닙니다.",
  robots: { index: false, follow: false },
};

export default function SajuBreakupLandingPage() {
  return <SajuProductLanding slug="breakup" />;
}
