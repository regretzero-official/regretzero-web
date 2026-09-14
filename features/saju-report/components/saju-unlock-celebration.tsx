"use client";

import { useEffect, useState } from "react";

import { LockIcon } from "./saju-trust";

type SajuUnlockCelebrationProps = {
  accent?: string;
  sectionTitles: string[];
  onComplete: () => void;
};

const AUTO_MS = 2200;

export function SajuUnlockCelebration({
  accent = "#E8336D",
  sectionTitles,
  onComplete,
}: SajuUnlockCelebrationProps) {
  const [opened, setOpened] = useState(false);
  const preview = sectionTitles.slice(0, 5);

  useEffect(() => {
    const open = window.setTimeout(() => setOpened(true), 180);
    const done = window.setTimeout(onComplete, AUTO_MS);
    return () => {
      window.clearTimeout(open);
      window.clearTimeout(done);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/88 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="잠금 해제 완료"
    >
      <div className="relative mx-4 w-full max-w-[360px] overflow-hidden rounded-[28px] border border-white/12 bg-[#12151C] px-5 py-7 text-center shadow-[0_28px_90px_rgba(0,0,0,0.65)]">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border text-[#FF7A99] transition duration-500 ${
            opened ? "saju-unlock-burst scale-100 border-[#E8336D]/50 bg-[#E8336D]/20" : "scale-90 border-white/15 bg-white/5"
          }`}
          style={opened ? { boxShadow: `0 0 40px ${accent}55` } : undefined}
        >
          <span className={`transition duration-500 ${opened ? "opacity-40 scale-75" : ""}`}>
            <LockIcon />
          </span>
          {opened ? (
            <span className="absolute text-2xl font-black text-[#FF7A99]" aria-hidden>
              ✦
            </span>
          ) : null}
        </div>

        <h2 className="mt-5 text-xl font-black tracking-[-0.04em] text-[#F8F4F6]">
          잠금이 열렸어요
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#B8AEB4]">
          전체 점사 리포트로 이동합니다
        </p>

        <ul className="mt-5 space-y-1.5 text-left">
          {preview.map((title, i) => (
            <li
              key={`${i}-${title}`}
              className={`flex items-center gap-2 rounded-[12px] border px-3 py-2 text-[12px] transition duration-500 ${
                opened
                  ? "saju-lock-flip-open border-[#E8336D]/30 bg-[#E8336D]/10 text-[#F4F0F2]"
                  : "border-white/8 bg-[#09090B] text-[#6E666C]"
              }`}
              style={{ transitionDelay: opened ? `${80 + i * 70}ms` : "0ms" }}
            >
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  opened ? "bg-[#E8336D] text-white" : "bg-white/5 text-[#9A9098]"
                }`}
              >
                {opened ? "✓" : <LockIcon className="h-3 w-3" />}
              </span>
              <span className="line-clamp-1">{title}</span>
            </li>
          ))}
          {sectionTitles.length > preview.length ? (
            <li className="px-1 text-[11px] text-[#9A9098]">
              +{sectionTitles.length - preview.length}장 더
            </li>
          ) : null}
        </ul>

        <button
          type="button"
          onClick={onComplete}
          className="saju-cta mt-6 flex min-h-12 w-full items-center justify-center rounded-full text-sm font-semibold"
        >
          리포트 보기
        </button>
      </div>
    </div>
  );
}
