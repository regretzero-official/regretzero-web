"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SAJU_CHARACTERS } from "@/features/saju-chat/characters";
import { emptyBirthForm } from "@/features/saju-report/buildReport";
import { formatChartChip } from "@/features/saju-report/manseryeok/formatChart";
import { SAJU_DEMO_REVIEWS } from "@/features/saju-report/demo-reviews";
import { saveSajuReading } from "@/features/saju-report/my-readings";
import { getLandingByProductId } from "@/features/saju-report/product-landings";
import { getCanonicalSectionCount } from "@/features/saju-report/canonical-sections";
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
      <div className="relative aspect-[3/4] w-full overflow-hidden">
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
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-[11px] leading-4 text-[#B8AEB4]">{product.painPoint}</p>
        <span className="saju-cta mt-auto inline-flex min-h-9 items-center justify-center rounded-full px-3 text-xs font-semibold">
          자세히 보기
        </span>
      </div>
    </Link>
  );
}


function WonGukChip({ report }: { report: SajuReportPayload }) {
  if (!report.chart) return null;
  const c = report.chart;
  const hour = c.pillars.hour?.korean ?? "시주미상";
  return (
    <div
      className="mt-3 rounded-[14px] border border-[#F0A05A]/35 bg-[#F0A05A]/10 px-3 py-2.5"
      aria-label="만세력 원국"
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F0A05A]">
        원국 · 만세력
      </div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {[
          ["년", c.pillars.year.korean],
          ["월", c.pillars.month.korean],
          ["일", c.pillars.day.korean],
          ["시", hour],
        ].map(([k, v]) => (
          <span
            key={k}
            className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[11px] font-semibold text-[#F8F4F6]"
          >
            {k} {v}
          </span>
        ))}
        <span className="rounded-full border border-[#FF7A99]/40 bg-[#E8336D]/20 px-2 py-0.5 text-[11px] font-bold text-[#FF7A99]">
          일간 {c.dayMaster}
        </span>
      </div>
      <p className="mt-1.5 text-[10px] leading-4 text-[#9A9098]">{formatChartChip(c)}</p>
    </div>
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
    <div className={`space-y-8 ${SAJU_BOTTOM_NAV_PAD}`}>
      <section className="px-5 pt-5">
        {/* image-first: large portrait stack before copy */}
        <div className="flex justify-center -space-x-6">
          {SAJU_CHARACTERS.filter((c) =>
            ["seo-nari", "baek-ryeon", "cha-yuri", "han-bora"].includes(c.id),
          ).map((c, i) => (
            <div
              key={c.id}
              className="relative h-[148px] w-[118px] overflow-hidden rounded-[22px] border-2 border-[#120E12] shadow-[0_12px_32px_rgba(0,0,0,0.55)]"
              style={{ zIndex: 4 - i }}
            >
              <Image
                alt={c.name}
                className="object-cover object-top"
                fill
                sizes="118px"
                src={c.portraitSrc}
                priority={i < 2}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] font-semibold text-[#B8AEB4]">
          서나리 · 백련 · 차유리 · 한보라
        </p>
        <h1 className="mt-4 text-center text-[1.55rem] font-black leading-[1.2] tracking-[-0.05em] text-[#F8F4F6]">
          그 사람, 아직{" "}
          <span className="text-[#FF7A99]">나를 생각할까?</span>
        </h1>

        <button
          type="button"
          onClick={onScrollProducts}
          className="saju-cta mt-5 flex min-h-12 w-full items-center justify-center rounded-full px-6 text-sm font-semibold"
        >
          무료로 시작하기
        </button>
        <div className="mt-3">
          <SajuTrustStrip />
        </div>
      </section>

      <SajuCredibilitySection />

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
        <div className="mt-4 flex gap-3 overflow-x-auto saju-scroll-x pb-1">
          {SAJU_CHARACTERS.map((c) => (
            <div
              key={c.id}
              className="saju-char-card relative w-[48%] min-w-[168px] shrink-0 overflow-hidden rounded-[22px]"
            >
              <div className="relative aspect-[3/4] w-full">
                <Image
                  alt={c.name}
                  className="object-cover object-top"
                  fill
                  sizes="180px"
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
                  <div className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-white/70">
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
          캐릭터와 대화 →
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
            캐릭터와 대화
          </Link>
          <Link href="/" className="underline-offset-2 hover:text-[#FF7A99] hover:underline">
            홈
          </Link>
        </div>
      </section>
    </div>
  );
}


function FieldReqBadge({ required }: { required: boolean }) {
  return required ? (
    <span className="ml-1 rounded-full bg-[#E8336D]/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#FF7A99]">
      필수
    </span>
  ) : (
    <span className="ml-1 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#6E666C]">
      선택
    </span>
  );
}

function freePreviewScopeLine(product: SajuProduct, freeCount = 1) {
  const total = getCanonicalSectionCount(product.id);
  return `미리보기 ${freeCount}개 섹션 무료 · 나머지 잠금(${product.shortTitle} ${total}장)`;
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
  const scopeLine = freePreviewScopeLine(product, 1);

  return (
    <div className={SAJU_BOTTOM_NAV_PAD}>
      <div className="saju-header sticky top-12 z-30 border-b border-white/5 px-5 pb-3 pt-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-[#9A9098] hover:text-[#FF7A99]"
        >
          ← 상품으로
        </button>
        <div className="mt-3 flex items-center gap-3">
          {character ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/15">
              <Image
                alt={character.name}
                className="object-cover object-top"
                fill
                sizes="48px"
                src={character.portraitSrc}
              />
            </div>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#FF7A99]">
              <span>{product.characterName}</span>
              {character?.roleLabel ? (
                <span className="rounded-full border border-[#FF7A99]/35 bg-[#E8336D]/15 px-1.5 py-0.5 tracking-[0.08em] text-[#FF7A99]">
                  {character.roleLabel}
                </span>
              ) : null}
            </div>
            <h1 className="truncate text-lg font-bold tracking-[-0.04em] text-[#F8F4F6]">
              {product.title} 입력하기
            </h1>
          </div>
        </div>
      </div>

      <div className="px-5 pt-3">
        <p className="text-sm leading-6 text-[#9A9098]">
          생년월일과 지금 상황을 자세히 적을수록, 해석이 더 구체해져요. 결과는 공개되지 않으며, 잠금 해제 후 이 기기 「내 사주」에 남길 수 있어요.
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
          <span className="mb-1.5 flex flex-wrap items-center text-xs font-semibold text-[#9A9098]">
            호칭
            <FieldReqBadge required={false} />
          </span>
          <input
            className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
            value={form.displayName}
            onChange={(e) => patch({ displayName: e.target.value })}
            placeholder="예: 수진"
          />
        </label>

        <div>
          <span className="mb-1.5 flex flex-wrap items-center text-xs font-semibold text-[#9A9098]">
            성별
            <FieldReqBadge required={false} />
            <span className="ml-1 font-normal text-[#6E666C]">· 대운 참고</span>
          </span>
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

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#9A9098]">내 출생</span>
            <span className="rounded-full border border-[#F0A05A]/40 bg-[#F0A05A]/12 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#F0A05A]">
              입력은 양력 기준이에요
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["birthYear", "출생 연도", "1992"],
                ["birthMonth", "출생 월", "1–12"],
                ["birthDay", "출생 일", "1–31"],
              ] as const
            ).map(([key, label, ph]) => (
              <label key={key} className="block">
                <span className="mb-1.5 flex flex-wrap items-center text-xs font-semibold text-[#9A9098]">
                  {label}
                  <FieldReqBadge required />
                </span>
                <input
                  className="saju-input min-h-12 w-full rounded-[14px] px-3 text-sm"
                  inputMode="numeric"
                  value={form[key]}
                  onChange={(e) => patch({ [key]: e.target.value })}
                  placeholder={ph}
                  required
                />
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1.5 flex flex-wrap items-center text-xs font-semibold text-[#9A9098]">
              출생 시간
              <FieldReqBadge required={false} />
            </span>
            <input
              className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
              value={form.birthTime}
              onChange={(e) => patch({ birthTime: e.target.value })}
              placeholder="14:30 또는 오후 2시 / 모름"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex flex-wrap items-center text-xs font-semibold text-[#9A9098]">
              출생 지역
              <FieldReqBadge required={false} />
            </span>
            <input
              className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
              value={form.birthPlace}
              onChange={(e) => patch({ birthPlace: e.target.value })}
              placeholder="비우면 서울"
            />
          </label>
        </div>

        <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3 space-y-3">
          <p className="text-[11px] leading-5 text-[#6E666C]">
            상대 정보는 전부 선택이에요. 연도만 있어도 연주 비교가 되고, 월·일(+시간)까지 있으면 「두 사람의 사주 원국 비교」가 더 깊어져요.
          </p>
          <label className="block">
            <span className="mb-1.5 flex flex-wrap items-center text-xs font-semibold text-[#9A9098]">
              상대 이름
              <FieldReqBadge required={false} />
            </span>
            <input
              className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
              value={form.partnerName}
              onChange={(e) => patch({ partnerName: e.target.value })}
              placeholder="예: 민재"
            />
          </label>
          <div>
            <span className="mb-1.5 flex flex-wrap items-center text-xs font-semibold text-[#9A9098]">
              상대 성별
              <FieldReqBadge required={false} />
              <span className="ml-1 font-normal text-[#6E666C]">· 대운 준비용</span>
            </span>
            <div className="flex gap-2">
              {(["여성", "남성", "기타"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() =>
                    patch({ partnerGender: form.partnerGender === g ? "" : g })
                  }
                  className={`min-h-10 flex-1 rounded-full text-xs font-semibold transition ${
                    form.partnerGender === g
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
                ["partnerBirthYear", "상대 연도", "1993"],
                ["partnerBirthMonth", "상대 월", "1–12"],
                ["partnerBirthDay", "상대 일", "1–31"],
              ] as const
            ).map(([key, label, ph]) => (
              <label key={key} className="block">
                <span className="mb-1.5 flex flex-wrap items-center text-xs font-semibold text-[#9A9098]">
                  {label}
                  <FieldReqBadge required={false} />
                </span>
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
          <label className="block">
            <span className="mb-1.5 flex flex-wrap items-center text-xs font-semibold text-[#9A9098]">
              상대 출생 시간
              <FieldReqBadge required={false} />
            </span>
            <input
              className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
              value={form.partnerBirthTime}
              onChange={(e) => patch({ partnerBirthTime: e.target.value })}
              placeholder="14:30 또는 오후 2시 / 모름"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 flex flex-wrap items-center text-xs font-semibold text-[#9A9098]">
            헤어진 지 (개월)
            <FieldReqBadge required />
          </span>
          <input
            className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
            inputMode="numeric"
            value={form.monthsApart}
            onChange={(e) => patch({ monthsApart: e.target.value })}
            placeholder="예: 3"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex flex-wrap items-center text-xs font-semibold text-[#9A9098]">
            이별 상황
            <FieldReqBadge required={false} />
          </span>
          <input
            className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
            value={form.breakupNote}
            onChange={(e) => patch({ breakupNote: e.target.value })}
            placeholder="서로 지쳐 헤어진 느낌"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex flex-wrap items-center text-xs font-semibold text-[#9A9098]">
            지금 가장 궁금한 것
            <FieldReqBadge required />
          </span>
          <textarea
            className="saju-input min-h-28 w-full resize-none rounded-[14px] px-4 py-3 text-sm"
            value={form.concern}
            onChange={(e) => patch({ concern: e.target.value })}
            placeholder="재회할 수 있을까요? 지금 연락해도 될까요?"
            required
          />
        </label>

        <div className="space-y-2 pt-1">
          <p className="text-center text-[11px] leading-5 text-[#9A9098]">{scopeLine}</p>
          <button
            type="submit"
            disabled={loading}
            className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold disabled:opacity-50"
          >
            {loading ? "미리보기 생성 중…" : "무료 미리보기 보기"}
          </button>
        </div>
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
                참고용
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-[-0.04em] text-[#F8F4F6]">
              {report.title}
            </h1>
            <div className="mt-2 text-sm leading-6 text-[#D8D0D4]">
              <ReportMarkdown body={report.oneLiner} />
            </div>
            <WonGukChip report={report} />
            <p className="mt-2 text-[11px] leading-5 text-[#6E666C]">
              원국은 만세력 · 해석은 참고용이에요
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
        <WonGukChip report={report} />
        <p className="mt-2 text-center text-[11px] text-[#6E666C]">원국은 만세력 · 해석은 참고용이에요</p>
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
