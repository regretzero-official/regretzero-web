import type { Metadata } from "next";

import { SajuHubApp } from "@/features/saju-report/components/saju-hub-app";

export const metadata: Metadata = {
  title: "사주 리포트 허브 · 재회운·속마음·이별 결정",
  description:
    "서나리 · 백련 · 차유리 · 한보라와 도령 트리오의 긴 사주 리포트. 재회운·상대 속마음·이별 결정·행동 전략. 여자의 마음은 여자가 잘 알지. 엔터테인먼트용이며 실제 예언이 아닙니다.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SajuPage() {
  return <SajuHubApp />;
}
