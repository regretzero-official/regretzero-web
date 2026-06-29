"use client";

import type { CriticalMomentExperience } from "@/features/critical-moments/types";

interface HoldReasonMomentsViewProps {
  accent: string;
  experience: CriticalMomentExperience;
  isPremium: boolean;
  onBack: () => void;
  onOpenMoment: (momentId: string, isLocked: boolean, index: number) => void;
  onUnlockPremium: () => void;
}

export function HoldReasonMomentsView({
  accent,
  experience,
  isPremium,
  onBack,
  onOpenMoment,
  onUnlockPremium,
}: HoldReasonMomentsViewProps) {
  return (
    <section className="flex flex-1 flex-col py-6 pb-24">
      <div className="flex items-center justify-between gap-3">
        <button
          className="btn-secondary min-h-11 rounded-full px-4 text-sm font-semibold transition"
          onClick={onBack}
          type="button"
        >
          결과로 돌아가기
        </button>
        <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-white/54">
          {isPremium ? "프리미엄" : "1개 미리 보기"}
        </div>
      </div>

      <div className="surface-section mt-5 rounded-[30px] px-4 py-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">버틸 근거</div>
        <div className="mt-3 text-[1.9rem] font-semibold tracking-[-0.05em] text-white">
          {experience.assetLabel}의 10년을
          <br />
          끝까지 들고 가기 어려웠던 이유
        </div>
        <div className="mt-4 text-sm leading-6 text-white/58">
          {experience.teaser.headline}
        </div>
        <div className="mt-4 grid gap-2">
          {experience.teaser.facts.map((fact) => (
            <div
              key={`${experience.assetId}-${fact}`}
              className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/60"
            >
              {fact}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">가장 힘들었던 구간 한 줄 요약</div>
        <div className="mt-3 text-sm leading-6 text-white/60">
          {experience.teaser.hardestPeriodSummary}
        </div>
      </div>

      {!isPremium ? (
        <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">프리미엄에서 열립니다</div>
          <div className="mt-2 text-sm leading-6 text-white/58">
            무료에서는 첫 번째 고비만 짧게 미리 볼 수 있습니다. 프리미엄에서는 모든 고비와 펀더멘탈, 그 뒤의 흐름까지 전체를 확인할 수 있습니다.
          </div>
          <button
            className="btn-accent mt-4 min-h-12 rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition"
            onClick={onUnlockPremium}
            type="button"
          >
            버틸 근거 전체 보기
          </button>
        </div>
      ) : null}

      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
          이 10년에서 가장 버티기 어려웠던 순간들
        </div>
        <div className="mt-3 grid gap-2">
          {experience.moments.map((moment, index) => {
            const isLocked = !isPremium && index > 0;

            return (
              <button
                key={moment.id}
                className="rounded-[22px] border px-4 py-4 text-left transition"
                onClick={() => onOpenMoment(moment.id, isLocked, index)}
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderColor: isLocked ? "rgba(255,255,255,0.08)" : `${accent}2f`,
                }}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold tracking-[-0.02em] text-white">
                    {moment.shortLabel} · {moment.dateLabel}
                  </div>
                  <div
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{
                      backgroundColor: isLocked ? "rgba(255,255,255,0.06)" : `${accent}18`,
                      color: isLocked ? "rgba(255,255,255,0.58)" : accent,
                    }}
                  >
                    {isLocked ? "프리미엄" : index === 0 && !isPremium ? "미리 보기" : "열기"}
                  </div>
                </div>
                <div className="mt-2 text-sm leading-6 text-white/58">{moment.cardDescription}</div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
