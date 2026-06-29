"use client";

type PremiumFeatureId = "custom-date" | "deeper-analysis";

interface PremiumUpgradeSheetProps {
  feature: PremiumFeatureId;
  onClose: () => void;
  onUnlock: () => void;
}

const FEATURE_COPY: Record<
  PremiumFeatureId,
  {
    body: string;
    eyebrow: string;
    title: string;
  }
> = {
  "custom-date": {
    body: "실제 데이터 기준으로, 원하는 자산을 원하는 날짜부터 원하는 속도로 직접 비교할 수 있어요.",
    eyebrow: "Pro 투자 타임머신",
    title: "원하는 과거 시점으로 직접 돌아가 보세요",
  },
  "deeper-analysis": {
    body: "Pro에서는 100개 이상 자산, 자유 시작 시점, 월봉·주봉·일봉 디테일, 레이스 속도 조절, 시나리오 저장까지 함께 열립니다.",
    eyebrow: "자산·시점 확장",
    title: "대표 20개를 넘어, 더 많은 실험을 직접 해보세요",
  },
};

export function PremiumUpgradeSheet({
  feature,
  onClose,
  onUnlock,
}: PremiumUpgradeSheetProps) {
  const copy = FEATURE_COPY[feature];

  return (
    <div className="fixed inset-0 z-[70] bg-[#08101C]/78 backdrop-blur-sm">
      <div aria-hidden="true" className="absolute inset-0" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[560px] px-4 pb-[calc(env(safe-area-inset-bottom)+14px)]">
        <div className="surface-section relative rounded-[30px] border border-white/8 px-4 py-4 shadow-[0_-18px_60px_rgba(0,0,0,0.42)]">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-white/12" />
          <div className="mt-4 text-[11px] uppercase tracking-[0.22em] text-white/34">
            {copy.eyebrow}
          </div>
          <div className="mt-3 text-[1.55rem] font-semibold tracking-[-0.05em] text-white">
            {copy.title}
          </div>
          <div className="mt-3 text-sm leading-6 text-white/58">{copy.body}</div>
          <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/50">
            무료는 대표 20개 자산의 기본 10년 레이스, Pro는 원하는 날짜와 더 많은 자산으로 반복 실험하는 투자 타임머신이에요.
          </div>
          <div className="mt-6 grid gap-2">
            <button
              className="btn-accent min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
              onClick={onUnlock}
              type="button"
            >
              프리미엄 시작하기
            </button>
            <button
              className="btn-secondary min-h-12 rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition"
              onClick={onClose}
              type="button"
            >
              나중에 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
