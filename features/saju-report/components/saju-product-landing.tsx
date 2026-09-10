import Image from "next/image";
import Link from "next/link";

import { getSajuCharacter } from "@/features/saju-chat/characters";
import { SAJU_DEMO_REVIEWS } from "@/features/saju-report/demo-reviews";
import {
  getLandingBySlug,
  hubDeepLink,
  type SajuLandingSlug,
} from "@/features/saju-report/product-landings";
import { getSajuProduct } from "@/features/saju-report/products";

function Stars({ n }: { n: number }) {
  return (
    <span className="tracking-tight text-[#FF7A99]" aria-label={`${n}점`}>
      {"★".repeat(n)}
      <span className="text-white/20">{"★".repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden
      className="h-3.5 w-3.5 shrink-0 text-[#FF7A99]"
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

export function SajuProductLanding({ slug }: { slug: SajuLandingSlug }) {
  const landing = getLandingBySlug(slug);
  const product = landing ? getSajuProduct(landing.productId) : null;
  if (!landing || !product) {
    return null;
  }

  const character = getSajuCharacter(product.characterId);
  const startHref = hubDeepLink(product.id);
  const reviews = SAJU_DEMO_REVIEWS.filter((r) =>
    r.tags.some((t) => t === landing.reviewTag || t === product.characterName),
  );
  const reviewList = reviews.length > 0 ? reviews : SAJU_DEMO_REVIEWS.slice(0, 2);

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
            href="/"
            className="text-[11px] font-semibold text-[#9A9098] underline-offset-2 hover:underline"
          >
            홈
          </Link>
        </header>

        <main className="flex-1 space-y-10 pb-32">
          {/* 1. Hero */}
          <section className="px-5 pt-5">
            <div className="overflow-hidden rounded-[24px] border border-white/10">
              <div className="relative aspect-[4/5] w-full sm:aspect-[5/6]">
                {character ? (
                  <Image
                    alt={product.characterName}
                    className="object-cover object-top"
                    fill
                    priority
                    sizes="(max-width:480px) 100vw, 480px"
                    src={character.portraitSrc}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-[#12151C] via-[#12151C]/55 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span
                    className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
                    style={{ background: product.accent }}
                  >
                    {product.badge} · {product.characterName}
                    {character?.roleLabel ? ` · ${character.roleLabel}` : ""}
                  </span>
                  <p className="mt-3 text-[0.8rem] font-semibold tracking-[0.04em] text-[#FF7A99]">
                    {product.title}
                  </p>
                  <h1 className="mt-2 text-[1.55rem] font-black leading-[1.25] tracking-[-0.045em] text-[#F8F4F6]">
                    {landing.heroHook}
                  </h1>
                  <p className="mt-2.5 text-sm leading-6 text-[#D8D0D4]">{landing.heroSub}</p>
                  <Link
                    href={startHref}
                    className="saju-cta mt-4 inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold"
                  >
                    {landing.ctaLabel} →
                  </Link>
                </div>
              </div>
            </div>
          </section>

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
              {product.characterName}이 풀어주는 긴 리포트 · {product.priceLabel} 데모
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

          {/* 3. Preview outline with locks */}
          <section className="px-5">
            <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">
              미리보기 구성
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#9A9098]">
              일부는 무료로 열리고, 나머지는 잠금으로 표시돼요.
            </p>
            <ol className="mt-4 space-y-2">
              {product.sections.map((title, index) => {
                const locked = index >= landing.previewUnlockedCount;
                return (
                  <li
                    key={title}
                    className={`flex items-center justify-between gap-3 rounded-[16px] border px-3.5 py-3 text-sm ${
                      locked
                        ? "border-white/8 bg-[#09090B] text-[#6E666C]"
                        : "border-[#E8336D]/25 bg-[#E8336D]/10 text-[#F4F0F2]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                          locked ? "bg-white/5 text-[#9A9098]" : "bg-[#E8336D] text-white"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={locked ? "blur-[0.3px]" : "font-semibold"}>{title}</span>
                    </span>
                    {locked ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-[#FF7A99]">
                        <LockIcon />
                        잠금
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold tracking-wide text-[#FF7A99]">
                        미리보기
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>

            {landing.curiosity.length > 0 ? (
              <div className="mt-5 saju-card rounded-[20px] px-4 py-4">
                <div className="text-sm font-semibold text-[#F4F0F2]">이런 게 궁금하다면</div>
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
                예시 후기(데모)
              </span>
            </div>
            <p className="mb-4 text-xs leading-5 text-[#9A9098]">
              아래는 실제 구매 후기가 아닌 <strong className="text-[#D8D0D4]">UI 예시(데모)</strong>
              입니다.
            </p>
            <div className="space-y-3">
              {reviewList.map((r) => (
                <article key={r.id} className="saju-card rounded-[20px] px-4 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-[#F4F0F2]">{r.maskedName}</div>
                    <Stars n={r.stars} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[#FF7A99]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2.5 text-sm leading-6 text-[#B8AEB4]">{r.body}</p>
                </article>
              ))}
            </div>
          </section>

          {/* 6. FAQ / disclaimer */}
          <section className="px-5">
            <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">자주 묻는 말</h2>
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
            <div className="saju-card-elevated mt-5 rounded-[22px] px-4 py-4 text-xs leading-5 text-[#9A9098]">
              본 서비스는 오락·위로 목적의 엔터테인먼트입니다. 실제 만세력·점술·의료·법률 조언이
              아니며, 원치 않는 연락·스토킹을 권장하지 않습니다.
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
        </main>

        {/* 5. Sticky CTA */}
        <div className="saju-footer fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
          <Link
            href={startHref}
            className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold"
          >
            {landing.ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
