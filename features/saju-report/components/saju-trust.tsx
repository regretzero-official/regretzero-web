import Link from "next/link";

import type { DemoReview } from "@/features/saju-report/types";

export function LockIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={`shrink-0 text-[#FF7A99] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/** Compact trust strip for hub + product landings */
export function SajuTrustStrip() {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-[14px] border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] leading-5 text-[#9A9098]"
      role="note"
    >
      <span className="font-semibold text-[#D8D0D4]">엔터테인먼트</span>
      <span aria-hidden className="text-white/20">
        ·
      </span>
      <span>미리보기 무료</span>
      <span aria-hidden className="text-white/20">
        ·
      </span>
      <span>본문 유료/데모</span>
      <span aria-hidden className="text-white/20">
        ·
      </span>
      <Link href="/saju/faq" className="font-semibold text-[#FF7A99] underline-offset-2 hover:underline">
        FAQ
      </Link>
    </div>
  );
}

/** Business-ish footer for /saju hub and FAQ */
export function SajuBusinessFooter() {
  return (
    <footer className="saju-card-elevated rounded-[22px] px-4 py-4 text-xs leading-5 text-[#9A9098]">
      <div className="font-semibold text-[#D8D0D4]">Regretzero 사주</div>
      <p className="mt-1.5">
        서비스명: Regretzero 사주 · 문의 조규철:{" "}
        <a
          href="mailto:regretzero.official@gmail.com"
          className="text-[#FF7A99] underline-offset-2 hover:underline"
        >
          regretzero.official@gmail.com
        </a>
      </p>
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
        <Link href="/saju/faq#privacy" className="underline-offset-2 hover:text-[#FF7A99] hover:underline">
          개인정보 안내
        </Link>
        <Link href="/saju/faq#refund" className="underline-offset-2 hover:text-[#FF7A99] hover:underline">
          환불(데모)
        </Link>
        <Link href="/saju/faq#terms" className="underline-offset-2 hover:text-[#FF7A99] hover:underline">
          약관 안내
        </Link>
        <Link href="/saju/faq#what" className="underline-offset-2 hover:text-[#FF7A99] hover:underline">
          서비스 안내
        </Link>
        <Link href="/saju/faq" className="font-semibold text-[#FF7A99] underline-offset-2 hover:underline">
          FAQ
        </Link>
      </div>
      <p className="mt-2.5 text-[11px] text-[#6E666C]">
        오락·위로 목적의 엔터테인먼트입니다. 실제 만세력·점술·의료·법률 조언을 대체하지 않습니다.
      </p>
    </footer>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="tracking-tight text-[#FF7A99]" aria-label={`${n}점`}>
      {"★".repeat(n)}
      <span className="text-white/20">{"★".repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

export function DemoReviewCard({ review }: { review: DemoReview }) {
  return (
    <article className="saju-card rounded-[20px] px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-[#F4F0F2]">{review.maskedName}</div>
        </div>
        <Stars n={review.stars} />
      </div>
      <div className="mt-1 text-[11px] text-[#6E666C]">{review.dateLabel}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {review.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[#FF7A99]"
          >
            {tag}
          </span>
        ))}
        {review.elementChips.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-[#F0A05A]/35 bg-[#F0A05A]/10 px-2 py-0.5 text-[10px] font-semibold text-[#F0A05A]"
          >
            {chip}
          </span>
        ))}
      </div>
      <p className="mt-2.5 text-sm leading-6 text-[#B8AEB4]">{review.body}</p>
    </article>
  );
}

/** Locked section list for preview paywall */
export function LockedSectionsPaywall({
  sections,
  previewUnlockedCount = 1,
}: {
  sections: string[];
  previewUnlockedCount?: number;
}) {
  const total = sections.length;
  const lockedCount = Math.max(0, total - previewUnlockedCount);
  const progressLabel = `미리보기 ${previewUnlockedCount}/${total}`;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="text-sm font-semibold text-[#F4F0F2]">잠긴 섹션 · 전체 리포트</div>
        <div className="rounded-full border border-[#E8336D]/40 bg-[#E8336D]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#FF7A99]">
          {progressLabel}
        </div>
      </div>
      <p className="mt-1.5 text-[11px] leading-5 text-[#9A9098]">
        지금 {previewUnlockedCount}개만 열려 있고, 나머지 {lockedCount}개 제목이 잠겨 있어요. 잠금 해제 시 약 {total}개 섹션 · 긴 해석을 받습니다.
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#E8336D] to-[#FF7A99]"
          style={{ width: `${Math.max(8, (previewUnlockedCount / Math.max(total, 1)) * 100)}%` }}
        />
      </div>
      <ul className="mt-3 max-h-[280px] space-y-1.5 overflow-y-auto pr-0.5">
        {sections.map((title, index) => {
          const locked = index >= previewUnlockedCount;
          return (
            <li
              key={`${index}-${title}`}
              className={`flex items-center justify-between gap-2 rounded-[12px] border px-3 py-2 text-sm ${
                locked
                  ? "border-white/8 bg-[#09090B] text-[#9A9098]"
                  : "border-[#E8336D]/25 bg-[#E8336D]/10 text-[#F4F0F2]"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-bold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={`truncate ${locked ? "" : "font-semibold"}`}>{title}</span>
              </span>
              {locked ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[#FF7A99]">
                  <LockIcon className="h-3 w-3" />
                  잠금
                </span>
              ) : (
                <span className="shrink-0 text-[10px] font-bold text-[#FF7A99]">열림</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
