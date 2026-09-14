import type { Metadata } from "next";

import { SajuMyApp } from "@/features/saju-report/components/saju-my-app";

import { sajuShareMetadata } from "../saju-metadata";

export const metadata: Metadata = sajuShareMetadata({
  title: "내 사주 · 잠금 해제한 리포트",
  description:
    "이 기기에 저장된 밤의 사주 리포트 목록. 잠금 해제한 재회운·속마음·이별 결정 리포트를 다시 열어볼 수 있어요.",
  url: "https://www.regretzero.kr/saju/my",
  robots: { index: false, follow: false },
});

export default function SajuMyPage() {
  return <SajuMyApp />;
}
