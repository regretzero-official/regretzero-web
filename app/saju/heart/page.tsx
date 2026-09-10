import type { Metadata } from "next";

import { SajuProductLanding } from "@/features/saju-report/components/saju-product-landing";

export const metadata: Metadata = {
  title: "상대 속마음 사주 · 서나리",
  description:
    "연락 없는 그 사람, 속마음은 뭘까요? 점쟁이 서나리가 거리감과 남은 마음을 짚어줘요. 재미·위로용 콘텐츠예요.",
  robots: { index: false, follow: false },
};

export default function SajuHeartLandingPage() {
  return <SajuProductLanding slug="heart" />;
}
