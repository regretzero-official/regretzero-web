import type { Metadata } from "next";
import Link from "next/link";

import { SajuBottomNav } from "@/features/saju-report/components/saju-bottom-nav";
import { SajuBusinessFooter } from "@/features/saju-report/components/saju-trust";
import { SAJU_FAQ_ITEMS } from "@/features/saju-report/faq";
import { SAJU_PRODUCT_LANDINGS } from "@/features/saju-report/product-landings";

export const metadata: Metadata = {
  title: "사주 FAQ · 자주 묻는 말",
  description:
    "밤의 사주 서비스 안내. 엔터테인먼트 목적, 무료 미리보기와 잠금 해제, 개인정보·환불 안내.",
  robots: { index: false, follow: false },
};

export default function SajuFaqPage() {
  return (
    <div className="saju-shell">
      <div className="saju-app mx-auto flex min-h-dvh w-full max-w-[480px] flex-col border-x border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.55)]">
        <header className="saju-header sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/saju" className="text-xs font-semibold text-[#9A9098]">
            ← 사주 허브
          </Link>
          <div className="text-sm font-bold tracking-[-0.03em] text-[#F4F0F2]">FAQ</div>
          <Link
            href="/"
            className="text-[11px] font-semibold text-[#9A9098] underline-offset-2 hover:underline"
          >
            홈
          </Link>
        </header>

        <main className="flex-1 space-y-8 px-5 pb-[calc(env(safe-area-inset-bottom)+88px)] pt-6">
          <section>
            <p className="text-[0.75rem] font-semibold tracking-[0.08em] text-[#FF7A99]">
              자주 묻는 말
            </p>
            <h1 className="mt-2 text-[1.65rem] font-black leading-[1.25] tracking-[-0.045em] text-[#F8F4F6]">
              밤의 사주,
              <br />
              궁금한 점부터
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#9A9098]">
              서비스 성격·미리보기·결제·개인정보·환불을 짧게 정리했어요.
            </p>
          </section>

          <section className="space-y-2">
            {SAJU_FAQ_ITEMS.map((item) => (
              <details
                key={item.id}
                id={item.id}
                className="saju-card group scroll-mt-20 rounded-[16px] px-3.5 py-3 open:pb-3.5"
                open={item.id === "what"}
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-[#F4F0F2] [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-2">
                    {item.q}
                    <span className="text-[#9A9098] transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-6 text-[#B8AEB4]">{item.a}</p>
              </details>
            ))}
          </section>

          <section>
            <h2 className="text-base font-bold tracking-[-0.03em] text-[#F4F0F2]">상품 바로가기</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {SAJU_PRODUCT_LANDINGS.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={l.path}
                    className="flex min-h-11 items-center justify-center rounded-[14px] border border-white/10 bg-white/5 px-3 text-center text-xs font-semibold text-[#FF7A99] transition hover:bg-white/8"
                  >
                    {l.reviewTag}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="saju-card-elevated rounded-[22px] px-4 py-4 text-xs leading-5 text-[#9A9098]">
            원국은 만세력으로 계산하고, 해석·조언은 오락·위로용 엔터테인먼트입니다. 확정
            예언·의료·법률을 대체하지 않으며, 원치 않는 연락·스토킹을 권장하지 않습니다. 지금은{" "}
            <strong className="text-[#D8D0D4]">실제 청구 없이</strong> 전체 결과를 열어볼 수 있어요.
          </section>

          <section>
            <SajuBusinessFooter />
          </section>
        </main>
        <SajuBottomNav />
      </div>
    </div>
  );
}
