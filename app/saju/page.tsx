import type { Metadata } from "next";

import { SajuChatApp } from "@/features/saju-chat/components/saju-chat-app";

export const metadata: Metadata = {
  title: "사주 캐릭터 채팅",
  description:
    "이도령 · 한시우 · 강세온과 나누는 가벼운 연애·재회 감성 채팅. 엔터테인먼트용이며 실제 예언이 아닙니다.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SajuPage() {
  return <SajuChatApp />;
}
