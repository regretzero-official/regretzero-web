import Link from "next/link";

import { getSajuCharacter } from "@/features/saju-chat/characters";
import { SAJU_DEMO_REVIEWS } from "@/features/saju-report/demo-reviews";
import {
  getLandingBySlug,
  type SajuLandingSlug,
} from "@/features/saju-report/product-landings";
import {
  getCanonicalSectionCount,
  getCanonicalSections,
} from "@/features/saju-report/canonical-sections";
import { getProductCounselors, getSajuProduct } from "@/features/saju-report/products";

import { LandingCounselorChrome } from "./landing-counselor-hero";
import { SAJU_BOTTOM_NAV_PAD, SajuBottomNav } from "./saju-bottom-nav";
import { SajuEntryGate, SajuEntryReplayLink } from "./saju-entry-overlay";
import {
  DemoReviewCard,
  LockIcon,
  SajuBusinessFooter,
  SajuTrustStrip,
} from "./saju-trust";

function LandingBody({ slug }: { slug: SajuLandingSlug }) {
  const landing = getLandingBySlug(slug);
  const product = landing ? getSajuProduct(landing.productId) : null;
  if (!landing || !product) {
    return null;
  }

  const counselors = getProductCounselors(product);
  const totalSections = getCanonicalSectionCount(product.id);
  const sectionTitles = getCanonicalSections(product.id);
  const freeScopeLine = `무료 1장 · 나머지 잠금(${product.shortTitle} ${totalSections}장)`;
  const reviews = SAJU_DEMO_REVIEWS.filter((r) =>
    r.tags.some((t) => t === landing.reviewTag || t === product.characterName),
  );
  const reviewList = reviews.length > 0 ? reviews : SAJU_DEMO_REVIEWS.slice(0, 2);
  const defaultChar = getSajuCharacter(product.characterId);

  return (
    <div className="saju-shell">
      <div className="saju-app mx-auto flex min-h-dvh w-full max-w-[480px] flex-col border-x border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.55)]">
        <header className="saju-header sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/saju" className="text-xs font-semibold text-[#9A9098]">
            ← 사주 허브
          </Link>
          <div className="text-sm font-bold tracking-[-0.03em] text-[#F4F0F2]">
            {product.shortTitle}
          </div>
          <Link
            href="/saju/faq"
            className="text-[11px] font-semibold text-[#9A9098] underline-offset-2 hover:underline"
          >
            FAQ
          </Link>
        </header>

        <main className={`flex-1 space-y-10 ${SAJU_BOTTOM_NAV_PAD}`}>
          <LandingCounselorChrome
            product={product}
            counselors={counselors}
            heroHook={landing.heroHook}
            heroSub={landing.heroSub}
            ctaLabel={landing.ctaLabel}
            freeScopeLine={freeScopeLine}
            footerExtra={
              <>
                <p className="mt-3 text-center text-[11px] text-[#6E666C]">
                  <SajuEntryReplayLink
                    slug={slug}
                    className="underline-offset-2 hover:text-[#FF7A99] hover:underline"
                  />
                </p>
                <div className="mt-4">
                  <SajuTrustStrip />
                </div>
                <p className="mt-3 text-center text-[11px] font-medium text-[#9A9098]">
                  여자의 마음은 여자가 잘 알지
                  <span className="text-[#6E666C]"> · 상담사는 골라요</span>
                </p>
              </>
            }
          >
            {/* 2. Who / deliverables */}
            <section className="px-5">
              <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">
                이런 분께 맞아요
              </h2>
              <ul className="mt-3 space-y-2">
                {landing.whoFor.map((item) => (
                  <li
                    key={item}
                    className="saju-card flex gap-2.5 rounded-[16px] px-3.5 py-3 text-sm leading-5 text-[#B8AEB4]"
                  >
                    <span className="mt-0.5 text-[#FF7A99]" aria-hidden>
                      ·
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h2 className="mt-8 text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">
                이런 걸 받아요
              </h2>
              <p className="mt-1 text-xs text-[#9A9098]">
                {defaultChar?.name ?? product.characterName} 기본 · 상담사 선택 가능 ·{" "}
                {product.priceLabel}
              </p>
              <ul className="mt-3 space-y-2">
                {landing.deliverables.map((item) => (
                  <li
                    key={item}
                    className="saju-card-elevated rounded-[16px] px-3.5 py-3 text-sm leading-5 text-[#D8D0D4]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* 3. Full section outline with locks (canonical titles) */}
            <section className="px-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">
                  점사 {totalSections}장 구성
                </h2>
                <span className="rounded-full border border-[#E8336D]/40 bg-[#E8336D]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#FF7A99]">
                  무료 1장 · 나머지 잠금
                </span>
              </div>
              <div className="mt-3 rounded-[16px] border border-[#E8336D]/30 bg-[#E8336D]/10 px-3.5 py-3">
                <div className="text-[11px] font-bold tracking-[0.06em] text-[#FF7A99]">
                  무료 미리보기
                </div>
                <p className="mt-1 text-sm leading-6 text-[#F4F0F2]">
                  미리보기에서 <strong className="text-[#FF7A99]">한줄 결론</strong>과 첫 장을 먼저 열어요.
                  나머지는 잠금 — 가능성·타이밍을 차분히 짚는 점사예요.
                </p>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#9A9098]">
                번호는 실제 리포트 목차와 같아요. 잠금은 유료 해제 후 열려요.
              </p>
              <ol className="mt-4 space-y-2">
                {sectionTitles.map((title, index) => {
                  const locked = index >= landing.previewUnlockedCount;
                  return (
                    <li
                      key={`${index}-${title}`}
                      className={`flex items-center justify-between gap-3 rounded-[16px] border px-3.5 py-3 text-sm ${
                        locked
                          ? "border-white/8 bg-[#09090B] text-[#6E666C]"
                          : "border-[#E8336D]/25 bg-[#E8336D]/10 text-[#F4F0F2]"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            locked ? "bg-white/5 text-[#9A9098]" : "bg-[#E8336D] text-white"
                          }`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className={`min-w-0 leading-5 ${locked ? "" : "font-semibold"}`}>
                          {title}
                        </span>
                      </span>
                      {locked ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-[#FF7A99]">
                          <LockIcon />
                          잠금
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-bold tracking-wide text-[#FF7A99]">
                          무료
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>

              {landing.curiosity.length > 0 ? (
                <div className="mt-5 saju-card rounded-[20px] px-4 py-4">
                  <div className="text-sm font-semibold text-[#F4F0F2]">이런 가능성이 궁금하다면</div>
                  <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#B8AEB4]">
                    {landing.curiosity.map((q) => (
                      <li key={q}>· {q}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            {/* 4. Reviews */}
            <section className="px-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">후기</h2>
                <span className="rounded-full border border-[#E8336D]/45 bg-[#E8336D]/15 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#FF7A99]">
                  후기
                </span>
              </div>
              <p className="mb-4 text-xs leading-5 text-[#9A9098]">입니다.</p>
              <div className="space-y-3">
                {reviewList.map((r) => (
                  <DemoReviewCard key={r.id} review={r} />
                ))}
              </div>
            </section>

            {/* 6. FAQ / disclaimer */}
            <section className="px-5">
              <div className="mb-3 flex items-end justify-between gap-3">
                <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">자주 묻는 말</h2>
                <Link
                  href="/saju/faq"
                  className="text-[11px] font-semibold text-[#FF7A99] underline-offset-2 hover:underline"
                >
                  전체 FAQ →
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                {landing.faq.map((item) => (
                  <details
                    key={item.q}
                    className="saju-card group rounded-[16px] px-3.5 py-3 open:pb-3.5"
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
              </div>
              <div className="mt-5">
                <SajuBusinessFooter />
              </div>
            </section>

            {/* 7. Back to hub */}
            <section className="px-5">
              <Link
                href="/saju"
                className="flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-[#FF7A99] transition hover:bg-white/8"
              >
                다른 사주 보러 가기 →
              </Link>
            </section>
          </LandingCounselorChrome>
        </main>

        <SajuBottomNav />
      </div>
    </div>
  );
}

export function SajuProductLanding({ slug }: { slug: SajuLandingSlug }) {
  return (
    <SajuEntryGate slug={slug}>
      <LandingBody slug={slug} />
    </SajuEntryGate>
  );
}
