import type { Metadata } from "next";

import { LongtermPainLab } from "./longterm-pain-lab";

export const metadata: Metadata = {
  title: "장기투자 고통 실험실",
  description:
    "RegretZero의 장기투자 고통, 익절 유혹, 종목 검색, 하단 탭 UX를 검증하는 임시 실험 페이지입니다.",
};

export default function LongtermPainLabPage() {
  return <LongtermPainLab />;
}
