"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SAJU_CHARACTERS } from "@/features/saju-chat/characters";
import { emptyBirthForm } from "@/features/saju-report/buildReport";
import { SAJU_DEMO_REVIEWS } from "@/features/saju-report/demo-reviews";
import { saveSajuReading } from "@/features/saju-report/my-readings";
import { getLandingByProductId } from "@/features/saju-report/product-landings";
import { SAJU_PRODUCTS, SAJU_REPORT_PRICE, getSajuProduct } from "@/features/saju-report/products";
import type {
  SajuBirthForm,
  SajuProduct,
  SajuProductId,
  SajuReportPayload,
  SajuReportStep,
} from "@/features/saju-report/types";
import {
  readSajuReportUnlock,
  unlockSajuReportDemo,
} from "@/features/saju-report/unlock";

import { CheckoutSheet } from "./checkout-sheet";
import { ReportMarkdown } from "./report-markdown";
import { SAJU_BOTTOM_NAV_PAD, SajuBottomNav } from "./saju-bottom-nav";
import {
  DemoReviewCard,
  LockedSectionsPaywall,
  SajuBusinessFooter,
  SajuCredibilitySection,
  SajuTrustStrip,
} from "./saju-trust";

function ProductCard({ product }: { product: SajuProduct }) {
  const character = SAJU_CHARACTERS.find((c) => c.id === product.characterId);
  const landing = getLandingByProductId(product.id);
  const href = landing?.path ?? `/saju?product=${product.id}`;
  return (
    <Link
      href={href}
      className="saju-product-card group flex flex-col overflow-hidden rounded-[22px] text-left transition active:scale-[0.985]"
      style={{ boxShadow: `0 16px 40px rgba(0,0,0,0.45), 0 0 28px ${product.accent}18` }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        {character ? (
          <Image
            alt={product.characterName}
            className="object-cover object-top transition duration-500 group-hover:scale-[1.04]"
            fill
            sizes="(max-width:480px) 45vw, 200px"
            src={character.portraitSrc}
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <span
          className="absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
          style={{ background: product.accent }}
        >
          {product.badge}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="text-[0.95rem] font-bold leading-tight tracking-[-0.03em] text-[#F8F4F6]">
            {product.title}
          </div>
          <div className="mt-0.5 text-[11px] text-white/70">{product.characterName}</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <p className="line-clamp-3 text-[12px] leading-5 text-[#B8AEB4]">{product.painPoint}</p>
        <span className="saju-cta mt-auto inline-flex min-h-10 items-center justify-center rounded-full px-3 text-xs font-semibold">
          자세히 보기
        </span>
      </div>
    </Link>
  );
}

type HubFilter = "all" | "popular" | "new";

const HUB_FILTERS: { id: HubFilter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "popular", label: "인기" },
  { id: "new", label: "신규" },
];

/** Badge → hub tab (BEST/위로 = 인기, 현실/실행 = 신규) */
function productMatchesFilter(product: SajuProduct, filter: HubFilter) {
  if (filter === "all") return true;
  if (filter === "popular") return product.badge === "BEST" || product.badge === "위로";
  return product.badge === "현실" || product.badge === "실행";
}

function HubLanding({
  onScrollProducts,
}: {
  onScrollProducts: () => void;
}) {
  const [filter, setFilter] = useState<HubFilter>("all");
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAJU_PRODUCTS.filter((p) => {
      if (!productMatchesFilter(p, filter)) return false;
      if (!q) return true;
      const hay = `${p.title} ${p.shortTitle} ${p.painPoint} ${p.characterName} ${p.badge}`.toLowerCase();
      return hay.includes(q);
    });
  }, [filter, query]);

  return (
    <div className={`space-y-10 ${SAJU_BOTTOM_NAV_PAD}`}>
      <section className="px-5 pt-6">
        <p className="text-[0.75rem] font-semibold tracking-[0.08em] text-[#FF7A99]">
          재회 · 속마음 · 이별
        </p>
        <h1 className="mt-3 text-[1.85rem] font-black leading-[1.2] tracking-[-0.05em] text-[#F8F4F6]">
          그 사람,
          <br />
          아직 나에게
          <br />
          <span className="text-[#FF7A99]">마음이 남아 있을까?</span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#9A9098]">
          헤어진 뒤에도 밤에 생각날 때.
          서나리·백련·차유리·한보라가 각자 다른 결로, 재회운과 속마음을 길게 상담해줘요.
        </p>
        <button
          type="button"
          onClick={onScrollProducts}
          className="saju-cta mt-5 inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold"
        >
          무료로 시작하기
        </button>
        <div className="mt-5">
          <SajuTrustStrip />
        </div>
      </section>

      <SajuCredibilitySection />


      <section className="px-5" aria-labelledby="saju-heritage">
        <h2 id="saju-heritage" className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">
          해석의 뿌리
        </h2>
        <p className="mt-1 text-xs leading-5 text-[#9A9098]">
          밤에 흔들리는 마음을, 감만으로 위로하지 않아요.
        </p>
        <div className="mt-4 saju-card-elevated rounded-[22px] px-4 py-4">
          <div className="text-[11px] font-bold tracking-[0.14em] text-[#FF7A99]">REGRETZERO MYEONGRI LINE</div>
          <p className="mt-2 text-sm font-bold leading-6 text-[#F4F0F2]">
            자평명리 · 만세력 전통을  디지털로 옮긴 Regretzero 명리 라인
          </p>
          <p className="mt-2 text-[13px] leading-6 text-[#B8AEB4]">
            적천수·자평 계통에서 다뤄 온 일간·십성·합충·대운·세운 문법을
            현대 연애·재회 질문에 맞게 다시 짰어요.
            캐릭터는 말투와 온도를 담당하고, 해석의 뼈대는 명리 라인의 체크를 거쳐요.
          </p>
          <div className="mt-3 grid gap-2">
            <div className="rounded-[14px] border border-white/10 bg-black/20 px-3 py-2.5 text-[12px] leading-5 text-[#B8AEB4]">
              <span className="font-semibold text-[#F4F0F2]">명리 골격</span>
              — 원국·대운·세운으로 ‘남아 있는 마음 / 연락 타이밍’을 구조적으로 읽음
            </div>
            <div className="rounded-[14px] border border-white/10 bg-black/20 px-3 py-2.5 text-[12px] leading-5 text-[#B8AEB4]">
              <span className="font-semibold text-[#F4F0F2]">감수 체크</span>
              — 과장·단정·공포 조장을 걸러 내고, 행동 가이드는 ‘참고’로 명시
            </div>
            <div className="rounded-[14px] border border-white/10 bg-black/20 px-3 py-2.5 text-[12px] leading-5 text-[#B8AEB4]">
              <span className="font-semibold text-[#F4F0F2]">상담 톤</span>
              — 점쟁이·무당·언니·도령 보이스로, 같은 뼈대를 다른 결로 전달
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#6E666C]">
            Regretzero 명리 라인은 브랜드 해석 체계예요. 확정 예언이 아니며, 결정은 본인 몫입니다.
          </p>
        </div>
      </section>

      <section id="products" className="scroll-mt-20 px-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">어떤 사주가 필요하세요?</h2>
            <p className="mt-1 text-xs text-[#9A9098]">지금 마음에 가장 가까운 걸 골라보세요</p>
          </div>
          <span className="saju-pill rounded-full px-2.5 py-1 text-[10px] font-semibold">
            ₩9,900
          </span>
        </div>
        <div className="flex gap-2">
          {HUB_FILTERS.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-9 rounded-full px-3.5 text-xs font-semibold transition ${
                  active
                    ? "bg-[#E8336D] text-white"
                    : "border border-white/10 bg-white/5 text-[#9A9098]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <label className="mt-3 block">
          <span className="sr-only">상품 검색</span>
          <input
            className="saju-input min-h-11 w-full rounded-[14px] px-4 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="상품·캐릭터 검색"
          />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {filteredProducts.length === 0 ? (
          <p className="mt-4 text-center text-sm text-[#9A9098]">
            조건에 맞는 상품이 없어요. 전체 탭을 눌러 보세요.
          </p>
        ) : null}
      </section>

      <section className="px-5">
        <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">오늘 밤의 캐릭터</h2>
        <p className="mt-1 text-xs text-[#9A9098]">
          직감 언니·무당·깍쟁이·아이돌… 누가 옆에 앉아 상담할지에 따라 결이 달라요
        </p>
        <div className="mt-4 flex gap-3 overflow-x-auto saju-scroll-x pb-1">
          {SAJU_CHARACTERS.map((c) => (
            <div
              key={c.id}
              className="saju-char-card relative w-[42%] min-w-[148px] shrink-0 overflow-hidden rounded-[22px]"
            >
              <div className="relative aspect-[3/4] w-full">
                <Image
                  alt={c.name}
                  className="object-cover object-top"
                  fill
                  sizes="160px"
                  src={c.portraitSrc}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  {c.roleLabel ? (
                    <span
                      className="mb-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                      style={{ background: c.accent }}
                    >
                      {c.roleLabel}
                    </span>
                  ) : null}
                  <div className="text-sm font-bold text-[#F8F4F6]">{c.name}</div>
                  <div className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-white/70">
                    {c.tagline}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Link
          href="/saju/chat"
          className="mt-4 flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-[#FF7A99] transition hover:bg-white/8"
        >
          캐릭터와 대화(베타) →
        </Link>
      </section>

      <section className="px-5">
        <div className="mb-4">
          <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">먼저 경험한 분들의 후기</h2>
        </div>
        <div className="space-y-3">
          {SAJU_DEMO_REVIEWS.map((r) => (
            <DemoReviewCard key={r.id} review={r} />
          ))}
        </div>
      </section>

      <section className="px-5">
        <SajuBusinessFooter />
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] font-semibold text-[#9A9098]">
          <Link href="/saju/faq" className="text-[#FF7A99] underline-offset-2 hover:underline">
            FAQ
          </Link>
          <Link href="/saju/chat" className="underline-offset-2 hover:text-[#FF7A99] hover:underline">
            캐릭터와 대화(베타)
          </Link>
          <Link href="/" className="underline-offset-2 hover:text-[#FF7A99] hover:underline">
            홈
          </Link>
        </div>
      </section>
    </div>
  );
}

function BirthFormView({
  product,
  form,
  setForm,
  onBack,
  onSubmit,
  loading,
}: {
  product: SajuProduct;
  form: SajuBirthForm;
  setForm: (next: SajuBirthForm) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const patch = (partial: Partial<SajuBirthForm>) => setForm({ ...form, ...partial });
  const character = SAJU_CHARACTERS.find((c) => c.id === product.characterId);

  return (
    <div className={SAJU_BOTTOM_NAV_PAD}>
      <div className="px-5 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-[#9A9098] hover:text-[#FF7A99]"
        >
          ← 상품으로
        </button>
        <div className="mt-4 flex items-center gap-3">
          {character ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/15">
              <Image
                alt={character.name}
                className="object-cover object-top"
                fill
                sizes="56px"
                src={character.portraitSrc}
              />
            </div>
          ) : null}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF7A99]">
              {product.characterName}
            </div>
            <h1 className="text-xl font-bold tracking-[-0.04em] text-[#F8F4F6]">
              {product.title} 신청
            </h1>
          </div>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#9A9098]">
          출생·고민을 적을수록 리포트가 구체해집니다. 저장되지 않는 데모 입력입니다.
        </p>
      </div>

      <form
        className="mt-5 space-y-4 px-5 pb-8"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">호칭 (선택)</span>
          <input
            className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
            value={form.displayName}
            onChange={(e) => patch({ displayName: e.target.value })}
            placeholder="예: 수진"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">성별</span>
          <div className="flex gap-2">
            {(["여성", "남성", "기타"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => patch({ gender: g })}
                className={`min-h-11 flex-1 rounded-full text-sm font-semibold transition ${
                  form.gender === g
                    ? "bg-[#E8336D] text-white"
                    : "border border-white/10 bg-white/5 text-[#B8AEB4]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["birthYear", "출생 연도", "1995"],
              ["birthMonth", "출생 월", "3"],
              ["birthDay", "출생 일", "14"],
            ] as const
          ).map(([key, label, ph]) => (
            <label key={key} className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">{label}</span>
              <input
                className="saju-input min-h-12 w-full rounded-[14px] px-3 text-sm"
                inputMode="numeric"
                value={form[key]}
                onChange={(e) => patch({ [key]: e.target.value })}
                placeholder={ph}
              />
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">출생 시간 <span className="font-normal text-[#6E666C]">(선택)</span></span>
            <input
              className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
              value={form.birthTime}
              onChange={(e) => patch({ birthTime: e.target.value })}
              placeholder="밤 10시"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">출생 지역 <span className="font-normal text-[#6E666C]">(선택 · 비우면 서울로 읽기)</span></span>
            <input
              className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
              value={form.birthPlace}
              onChange={(e) => patch({ birthPlace: e.target.value })}
              placeholder="서울"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">상대 이름</span>
            <input
              className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
              value={form.partnerName}
              onChange={(e) => patch({ partnerName: e.target.value })}
              placeholder="예: 민재"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">상대 출생 연도 <span className="font-normal text-[#6E666C]">(선택)</span></span>
            <input
              className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
              inputMode="numeric"
              value={form.partnerBirthYear}
              onChange={(e) => patch({ partnerBirthYear: e.target.value })}
              placeholder="1993"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">헤어진 지 (개월)</span>
          <input
            className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
            inputMode="numeric"
            value={form.monthsApart}
            onChange={(e) => patch({ monthsApart: e.target.value })}
            placeholder="3"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">이별 상황</span>
          <input
            className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
            value={form.breakupNote}
            onChange={(e) => patch({ breakupNote: e.target.value })}
            placeholder="서로 지쳐 헤어진 느낌"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">지금 가장 궁금한 것</span>
          <textarea
            className="saju-input min-h-28 w-full resize-none rounded-[14px] px-4 py-3 text-sm"
            value={form.concern}
            onChange={(e) => patch({ concern: e.target.value })}
            placeholder="재회할 수 있을까요? 지금 연락해도 될까요?"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold disabled:opacity-50"
        >
          {loading ? "미리보기 생성 중…" : "무료 미리보기 보기"}
        </button>
      </form>
    </div>
  );
}

function PreviewView({
  product,
  report,
  unlocking,
  checkoutOpen,
  onBack,
  onOpenCheckout,
  onCloseCheckout,
  onConfirmUnlock,
}: {
  product: SajuProduct;
  report: SajuReportPayload;
  unlocking: boolean;
  checkoutOpen: boolean;
  onBack: () => void;
  onOpenCheckout: () => void;
  onCloseCheckout: () => void;
  onConfirmUnlock: () => void;
}) {
  const character = SAJU_CHARACTERS.find((c) => c.id === product.characterId);
  const clear = report.previewSections[0];
  const blurred = report.previewSections[1] ?? report.sections[1];

  return (
    <div className={SAJU_BOTTOM_NAV_PAD}>
      <div className="px-5 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-[#9A9098] hover:text-[#FF7A99]"
        >
          ← 입력 수정
        </button>
        <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10">
          <div className="relative h-36 w-full">
            {character ? (
              <Image
                alt=""
                className="object-cover object-top"
                fill
                sizes="440px"
                src={character.portraitSrc}
                priority
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-[#12151C] via-[#12151C]/50 to-transparent" />
          </div>
          <div className="bg-[#12151C] px-4 pb-4 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF7A99]">
                무료 미리보기
              </div>
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[#9A9098]">
                오락·비예언
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-[-0.04em] text-[#F8F4F6]">
              {report.title}
            </h1>
            <div className="mt-2 text-sm leading-6 text-[#D8D0D4]">
              <ReportMarkdown body={report.oneLiner} />
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[#6E666C]">
              재미·위로용이며 확정 예언이 아닙니다.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4 px-5">
        {clear ? (
          <article className="saju-card rounded-[20px] px-4 py-4">
            <h2 className="text-base font-bold text-[#F4F0F2]">{clear.title}</h2>
            <div className="mt-3">
              <ReportMarkdown body={clear.body.slice(0, 900) + (clear.body.length > 900 ? "…" : "")} />
            </div>
          </article>
        ) : null}

        {blurred ? (
          <article className="relative overflow-hidden rounded-[20px] border border-white/10 bg-[#09090B] px-4 py-4">
            <h2 className="text-base font-bold text-[#F4F0F2]">{blurred.title}</h2>
            <div className="mt-3 select-none blur-[6px]" aria-hidden>
              <ReportMarkdown body={blurred.body.slice(0, 700)} />
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-[#09090B]/75 to-[#09090B]">
              <div className="rounded-full border border-white/15 bg-[#12151C]/95 px-4 py-2 text-sm font-semibold text-[#FF7A99]">
                이어서 잠금 · 전체 리포트
              </div>
            </div>
          </article>
        ) : null}

        <div className="saju-card-elevated rounded-[20px] px-4 py-4">
          <LockedSectionsPaywall
            sections={report.sections.map((s) => s.title)}
            previewUnlockedCount={1}
          />
          <p className="mt-3 text-xs leading-5 text-[#9A9098]">
            잠금 해제 시{" "}
            <strong className="text-[#D8D0D4]">{report.sections.length}개 섹션 · 긴 해석</strong>
            과 내 사주 저장
          </p>
          <button
            type="button"
            disabled={unlocking}
            onClick={onOpenCheckout}
            className="saju-cta mt-4 flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold disabled:opacity-50"
          >
            {unlocking
              ? "리포트 생성 중…"
              : `전체 리포트 잠금 해제 · ₩${SAJU_REPORT_PRICE.toLocaleString("ko-KR")}`}
          </button>
        </div>
      </div>

      {checkoutOpen ? (
        <CheckoutSheet
          product={product}
          unlocking={unlocking}
          onClose={onCloseCheckout}
          onConfirm={onConfirmUnlock}
          sectionCount={report.sections.length}
        />
      ) : null}
    </div>
  );
}

function ReportView({
  report,
  onBackHub,
}: {
  report: SajuReportPayload;
  onBackHub: () => void;
}) {
  const character = SAJU_CHARACTERS.find((c) => c.id === report.characterId);
  return (
    <div className={SAJU_BOTTOM_NAV_PAD}>
      <div className="px-5 pt-4">
        <button
          type="button"
          onClick={onBackHub}
          className="text-sm font-semibold text-[#9A9098] hover:text-[#FF7A99]"
        >
          ← 허브로
        </button>
        <div className="mt-4 flex items-center gap-3">
          {character ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/15">
              <Image
                alt={character.name}
                className="object-cover object-top"
                fill
                sizes="56px"
                src={character.portraitSrc}
              />
            </div>
          ) : null}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF7A99]">
              FULL REPORT · {report.source === "template" ? "템플릿" : report.source.toUpperCase()}
            </div>
            <h1 className="text-xl font-bold tracking-[-0.04em] text-[#F8F4F6]">{report.title}</h1>
          </div>
        </div>
        <div className="mt-3 rounded-[16px] border border-[#E8336D]/30 bg-[#E8336D]/10 px-3 py-2 text-sm leading-6 text-[#FF7A99]">
          <ReportMarkdown body={report.oneLiner} />
        </div>
        <p className="mt-2 text-center text-[11px] text-[#6E666C]">오락·비예언 · 재미·위로용 콘텐츠입니다.</p>
        <nav
          aria-label="리포트 목차"
          className="mt-4 saju-card rounded-[18px] px-4 py-3"
        >
          <div className="text-xs font-bold tracking-[0.04em] text-[#FF7A99]">목차</div>
          <ol className="mt-2 space-y-1.5">
            {report.sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#hub-section-${section.id}`}
                  className="flex gap-2 text-[12px] leading-5 text-[#B8AEB4] hover:text-[#FF7A99]"
                >
                  <span className="shrink-0 font-semibold text-[#6E666C]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="line-clamp-1">{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <p className="mt-3 text-center text-[11px]">
          <Link href="/saju/my" className="font-semibold text-[#FF7A99] underline-offset-2 hover:underline">
            내 사주에서 다시 보기 →
          </Link>
        </p>
      </div>

      <div className="mt-5 space-y-4 px-5">
        {report.sections.map((section) => (
          <article
            key={section.id}
            id={`hub-section-${section.id}`}
            className="saju-card scroll-mt-24 rounded-[20px] px-4 py-4"
          >
            <h2 className="text-base font-bold tracking-[-0.03em] text-[#F4F0F2]">
              {section.title}
            </h2>
            <div className="mt-3">
              <ReportMarkdown body={section.body} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function SajuHubApp({
  initialProductId = null,
}: {
  initialProductId?: SajuProductId | null;
} = {}) {
  const [step, setStep] = useState<SajuReportStep>(initialProductId ? "form" : "hub");
  const [productId, setProductId] = useState<SajuProductId | null>(initialProductId);
  const [form, setForm] = useState<SajuBirthForm>(() => emptyBirthForm());
  const [preview, setPreview] = useState<SajuReportPayload | null>(null);
  const [report, setReport] = useState<SajuReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const product = useMemo(
    () => (productId ? getSajuProduct(productId) : null),
    [productId],
  );

  useEffect(() => {
    const unlocked = readSajuReportUnlock();
    if (unlocked.unlocked && unlocked.productId) {
      // keep unlock flag; user still goes through flow unless report already held
    }
  }, []);

  useEffect(() => {
    if (!initialProductId) return;
    setProductId(initialProductId);
    setStep("form");
  }, [initialProductId]);

  const scrollProducts = useCallback(() => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#products") return;
    requestAnimationFrame(() => {
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const fetchReport = useCallback(
    async (previewOnly: boolean) => {
      if (!productId) return null;
      const res = await fetch("/api/saju/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, form, previewOnly }),
      });
      if (!res.ok) throw new Error("report_failed");
      const data = (await res.json()) as { report: SajuReportPayload };
      return data.report;
    },
    [productId, form],
  );

  const handlePreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchReport(true);
      if (!next) throw new Error("empty");
      setPreview(next);
      setStep("preview");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("미리보기를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, [fetchReport]);

  const handleUnlock = useCallback(async () => {
    if (!productId) return;
    setUnlocking(true);
    setError(null);
    try {
      unlockSajuReportDemo(productId);
      const full = await fetchReport(false);
      if (!full) throw new Error("empty");
      saveSajuReading(full);
      setReport(full);
      setCheckoutOpen(false);
      setStep("report");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("리포트 생성에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setUnlocking(false);
    }
  }, [fetchReport, productId]);

  return (
    <div className="saju-shell">
      <div className="saju-app mx-auto flex min-h-dvh w-full max-w-[480px] flex-col border-x border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.55)]">
        <header className="saju-header sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="text-xs font-semibold text-[#9A9098]">
            돌아가기
          </Link>
          <div className="text-sm font-bold tracking-[-0.03em] text-[#F4F0F2]">밤의 사주</div>
          <Link
            href="/saju/faq"
            className="text-[11px] font-semibold text-[#FF7A99] underline-offset-2 hover:underline"
          >
            FAQ
          </Link>
        </header>

        <main className="flex-1">
          {error ? (
            <div className="mx-5 mt-3 rounded-[14px] border border-[#E8336D]/40 bg-[#E8336D]/15 px-3 py-2 text-sm text-[#FF7A99]">
              {error}
            </div>
          ) : null}

          {step === "hub" ? (
            <HubLanding onScrollProducts={scrollProducts} />
          ) : null}

          {step === "form" && product ? (
            <BirthFormView
              product={product}
              form={form}
              setForm={setForm}
              loading={loading}
              onBack={() => setStep("hub")}
              onSubmit={handlePreview}
            />
          ) : null}

          {step === "preview" && product && preview ? (
            <PreviewView
              product={product}
              report={preview}
              unlocking={unlocking}
              checkoutOpen={checkoutOpen}
              onBack={() => {
                setCheckoutOpen(false);
                setStep("form");
              }}
              onOpenCheckout={() => setCheckoutOpen(true)}
              onCloseCheckout={() => setCheckoutOpen(false)}
              onConfirmUnlock={handleUnlock}
            />
          ) : null}

          {step === "report" && report ? (
            <ReportView report={report} onBackHub={() => setStep("hub")} />
          ) : null}
        </main>

        <SajuBottomNav />
      </div>
    </div>
  );
}
