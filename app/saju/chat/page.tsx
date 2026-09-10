import type { Metadata } from "next";

import { SajuChatApp } from "@/features/saju-chat/components/saju-chat-app";

export const metadata: Metadata = {
  title: "캐릭터와 대화(베타) · 사주 캐릭터 채팅",
  description:
    "서나리 · 백련 · 차유리 · 한보라 · 이도령 · 한시우 · 강세온과 나누는 재회운·속마음·이별 감성 채팅(베타). 여자의 마음은 여자가 잘 알지. 엔터테인먼트용이며 실제 예언이 아닙니다.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SajuChatPage() {
  return <SajuChatApp />;
}
