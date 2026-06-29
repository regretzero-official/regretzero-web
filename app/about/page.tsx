import type { Metadata } from "next";

import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "RegretZero 소개 | 10년 전 투자 시뮬레이터",
  description:
    "RegretZero는 화려한 최종 수익률만 뽐내는 계산기가 아닙니다. 동일한 자금이 겪어낸 세월의 흔적을 복기하며, 다음 10년을 준비하도록 돕습니다.",
};

export default function AboutPage() {
  return (
    <InfoPage
      closingCta={{
        body: "내가 놓쳤던 자산들의 진짜 기록, 이제 당신의 기준에 맞춰 직접 대조해 보세요.",
        href: "/",
        label: "비교 시작하기",
        points: ["💰 동일한 투자금 기준", "📅 지나온 10년의 세월", "📉 폭락과 인내의 시간"],
        secondaryHref: "/guide",
        secondaryLabel: "사용법 보기",
        title: "이제 직접\n10년을 확인해보세요",
      }}
      description={
        "RegretZero는 화려한 최종 수익률만 뽐내는 계산기가 아닙니다.\n동일한 자금이 겪어낸 세월의 흔적을 복기하며, 당신이 다가올 미래의 10년을 흔들림 없이 준비하도록 돕습니다."
      }
      eyebrow="RegretZero가 보는 것"
      footerExtra={
        <div className="space-y-1">
          <p>
            <span className="font-semibold text-[var(--rz-text-primary)]">CTO:</span> 조규철
          </p>
          <p>
            <span className="font-semibold text-[var(--rz-text-primary)]">광고문의:</span>{" "}
            <a
              className="font-semibold text-[var(--rz-accent)] underline-offset-4 hover:underline"
              href="mailto:regretzero.official@gmail.com"
            >
              regretzero.official@gmail.com
            </a>
          </p>
        </div>
      }
      heroCtaLabel="비교 시작하기"
      notice={{
        body: "표시되는 값은 시장 상황, 환율, 데이터 기준에 따라 실제와 다를 수 있습니다. 정확한 예측보다 과거 흐름을 이해하는 데 초점을 둡니다.",
        title: "정확한 예측보다, 흐름의 이해",
      }}
      sectionEyebrow="PRINCIPLES"
      sectionSubtitle="후회를 자극하기보다, 오래 버틸 기준을 남기는 것이 목표입니다."
      sectionTitle={"RegretZero가\n지키는 원칙"}
      sections={[
        {
          body: "감정적인 확신이나 막연한 예측 대신, 지나간 역사적 가격 흐름과 정밀한 연산 데이터만 투명하게 보여드립니다.",
          eyebrow: "FACT",
          title: "팩트부터 봅니다",
        },
        {
          body: "최종 수익률만 보면 투자는 쉬워 보입니다. 그 달콤함 뒤에 가려진 끝없는 하락과 지루한 회복의 시간을 마주해야 진짜 투자의 무게가 보입니다.",
          eyebrow: "PROCESS",
          title: "과정을 숨기지 않습니다",
        },
        {
          body: "복잡한 금융 티커나 암호 같은 약어 대신, 투자 초보자의 눈높이에 맞춘 쉬운 언어로 먼저 다가갑니다.",
          eyebrow: "BEGINNER",
          title: "초보자를 먼저 생각합니다",
        },
        {
          body: "특정 자산의 매수나 매도를 절대 권유하지 않습니다. 시뮬레이션 결과는 오직 당신만의 투자 기준을 세우기 위한 건강한 참고 자료입니다.",
          eyebrow: "BOUNDARY",
          title: "추천하지 않습니다",
        },
      ]}
      sideSummary={[
        "후회를 기준으로 바꿉니다.",
        "같은 돈의 다른 시간을 보여줍니다.",
        "수익률 뒤의 하락과 회복을 읽습니다.",
        "투자 추천이 아닌 참고 자료입니다.",
      ]}
      summaryCards={[
        {
          body: "그때 샀더라면에서 멈추지 않고, 왜 버티기 어려웠는지 봅니다.",
          title: "후회를 기준으로 바꿉니다",
        },
        {
          body: "마지막 결과보다 중간의 낙폭, 회복, 기다림을 더 선명하게 보여줍니다.",
          title: "과정을 보여줍니다",
        },
        {
          body: "다음 10년을 더 오래 버틸 수 있는 개인의 기준을 만드는 데 집중합니다.",
          title: "다음 결정을 준비합니다",
        },
      ]}
      title={"후회를 기회로 바꾸는 힘,\n나만의 단단한 투자 기준에서 시작됩니다."}
    />
  );
}
