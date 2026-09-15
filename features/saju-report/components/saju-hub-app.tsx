"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SAJU_CHARACTERS } from "@/features/saju-chat/characters";
import type { SajuCharacterId } from "@/features/saju-chat/types";
import { emptyBirthForm } from "@/features/saju-report/buildReport";
import { formatChartChip } from "@/features/saju-report/manseryeok/formatChart";
import { SAJU_DEMO_REVIEWS } from "@/features/saju-report/demo-reviews";
import { saveSajuReading } from "@/features/saju-report/my-readings";
import {
  getLandingByProductId,
  hubDeepLink,
} from "@/features/saju-report/product-landings";
import {
  HUB_CHARACTER_ORDER,
  HUB_GRID_ITEMS,
  HUB_SHELVES,
  itemsForShelf,
  resolveHubItem,
  type HubCardTone,
  type ResolvedHubCard,
} from "@/features/saju-report/hub-shelves";
import {
  CHARACTER_PRIMARY_PRODUCT,
  SAJU_PRODUCTS,
  SAJU_REPORT_PRICE,
  getSajuProduct,
  resolveProductCounselor,
} from "@/features/saju-report/products";
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

import { getReportBooks } from "@/features/saju-report/report-books";

import { CheckoutSheet } from "./checkout-sheet";
import { GoogleSaveButton } from "./google-save-button";
import { ReportMarkdown } from "./report-markdown";
import { SajuBirthFormView } from "./saju-birth-form";
import { SAJU_BOTTOM_NAV_PAD, SajuBottomNav } from "./saju-bottom-nav";
import { SajuLoadingTheater } from "./saju-loading-theater";
import { SajuUnlockCelebration } from "./saju-unlock-celebration";
import {
  DemoReviewCard,
  LockIcon,
  SajuBusinessFooter,
  SajuCredibilitySection,
  SajuTrustStrip,
} from "./saju-trust";

function ProductCard({
  product,
  faceCharacterId,
  tone = "romantic",
  compact = false,
  cinematic = false,
}: {
  product: SajuProduct;
  /** Portrait counselor — may differ from product default (male faces on hub) */
  faceCharacterId?: SajuCharacterId;
  tone?: HubCardTone;
  compact?: boolean;
  /** Viewport-dominant shelf card — 80%+ image, 1-line overlay */
  cinematic?: boolean;
}) {
  const faceId = faceCharacterId ?? product.characterId;
  const character = SAJU_CHARACTERS.find((c) => c.id === faceId);
  const href = hubDeepLink(product.id, faceId);
  const widthClass = cinematic
    ? "w-[86%] min-w-[280px] max-w-[360px] shrink-0 snap-center"
    : compact
      ? "w-[72%] min-w-[210px] max-w-[260px] shrink-0 snap-center"
      : "";
  const isBright = tone === "bright";
  const toneClass = isBright ? "saju-product-card--bright" : "saju-product-card--romantic";
  const overlayClass = isBright
    ? "bg-gradient-to-t from-[#1a2a28]/55 via-[#e8fff8]/10 to-transparent"
    : "bg-gradient-to-t from-[#120a10]/92 via-[#1a1018]/40 to-transparent";
  const oneLiner = cinematic
    ? product.painPoint
    : product.shortTitle;
  const faceName = character?.name ?? product.characterName;
  const faceSrc =
    isBright && character?.brightPortraitSrc
      ? character.brightPortraitSrc
      : character?.portraitSrc;
  return (
    <Link
      href={href}
      className={`saju-product-card group relative flex flex-col overflow-hidden rounded-[24px] text-left transition active:scale-[0.985] ${toneClass} ${widthClass} ${
        cinematic ? "saju-shelf-card" : ""
      }`}
      style={{
        boxShadow: isBright
          ? `0 16px 40px rgba(94,234,212,0.22), 0 0 28px ${product.accent}18`
          : `0 20px 48px rgba(18,10,16,0.45), 0 0 32px ${product.accent}18`,
      }}
    >
      <div
        className={`relative w-full overflow-hidden ${
          cinematic ? "min-h-[min(72dvh,560px)] flex-1" : "aspect-[3/4]"
        }`}
      >
        {character && faceSrc ? (
          <Image
            alt={faceName}
            className={`object-cover object-top transition duration-500 group-hover:scale-[1.04] ${
              isBright ? "saju-card-face--bright" : "saju-card-face--romantic"
            }`}
            fill
            sizes={cinematic ? "(max-width:480px) 86vw, 360px" : "(max-width:480px) 45vw, 200px"}
            src={faceSrc}
            priority={cinematic}
          />
        ) : null}
        <div className={`pointer-events-none absolute inset-0 ${overlayClass}`} />
        <span
          className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
          style={{ background: product.accent }}
        >
          {product.badge}
        </span>
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
          <div
            className={`text-[1.05rem] font-bold leading-snug tracking-[-0.03em] line-clamp-1 ${
              isBright ? "text-[#1a1e24]" : "text-[#F8F4F6]"
            }`}
          >
            {oneLiner}
          </div>
          <div className={`text-[11px] ${isBright ? "text-[#3a4548]/80" : "text-white/70"}`}>
            {cinematic ? `${product.shortTitle} · ${faceName}` : faceName}
          </div>
          <span className="saju-cta inline-flex min-h-10 w-full items-center justify-center rounded-full px-3 text-xs font-semibold">
            무료로 시작하기
          </span>
        </div>
      </div>
    </Link>
  );
}

function ProductShelf({
  title,
  subtitle,
  cards,
}: {
  title: string;
  subtitle: string;
  cards: ResolvedHubCard[];
}) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || cards.length === 0) return;
    const card = el.querySelector<HTMLElement>("[data-shelf-card]");
    const cardW = card?.offsetWidth ?? 220;
    const idx = Math.round(el.scrollLeft / Math.max(cardW * 0.85, 1));
    setActive(Math.max(0, Math.min(cards.length - 1, idx)));
  }, [cards.length]);

  return (
    <section className="px-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">{title}</h2>
          <p className="mt-1 text-xs text-[#9A9098]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 pb-0.5" aria-hidden>
          {cards.map((c, i) => (
            <span
              key={`${c.productId}-${c.faceCharacterId}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-4 bg-[#FF7A99]" : "w-1.5 bg-white/25"
              }`}
            />
          ))}
        </div>
      </div>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="saju-scroll-x -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2"
      >
        {cards.map((card) => (
          <div key={`${card.productId}-${card.faceCharacterId}`} data-shelf-card>
            <ProductCard
              product={card.product}
              faceCharacterId={card.faceCharacterId}
              tone={card.tone}
              cinematic
            />
          </div>
        ))}
      </div>
    </section>
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

  const filteredGrid = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HUB_GRID_ITEMS.map(resolveHubItem).filter((card): card is ResolvedHubCard => {
      if (!card) return false;
      const p = card.product;
      if (!productMatchesFilter(p, filter)) return false;
      if (!q) return true;
      const face = SAJU_CHARACTERS.find((c) => c.id === card.faceCharacterId);
      const counselorNames = p.counselorIds
        .map((id) => SAJU_CHARACTERS.find((c) => c.id === id)?.name ?? "")
        .join(" ");
      const hay = `${p.title} ${p.shortTitle} ${p.painPoint} ${p.characterName} ${face?.name ?? ""} ${counselorNames} ${p.badge}`.toLowerCase();
      return hay.includes(q);
    });
  }, [filter, query]);

  const hubCharacters = useMemo(
    () =>
      HUB_CHARACTER_ORDER.map((id) => SAJU_CHARACTERS.find((c) => c.id === id)).filter(
        (c): c is (typeof SAJU_CHARACTERS)[number] => c != null,
      ),
    [],
  );

  return (
    <div className={`space-y-8 pb-[calc(env(safe-area-inset-bottom)+148px)]`}>
      <section className="px-5 pt-5">
        <p className="text-center text-[11px] font-semibold tracking-[0.08em] text-[#FF7A99]">
          밤의 사주
        </p>
        <h1 className="mt-2 text-center text-[1.65rem] font-black leading-[1.2] tracking-[-0.05em] text-[#F8F4F6]">
          그 사람, 아직{" "}
          <span className="text-[#FF7A99]">나를 생각할까?</span>
        </h1>
        <p className="mt-2 text-center text-[12px] leading-5 text-[#9A9098]">
          이미지로 고르고, 무료 미리보기부터 · 로그인 없이
        </p>
        <p className="mt-1.5 text-center text-[11px] font-medium tracking-[-0.01em] text-[#6E666C]">
          이도령·한시우·강세온도 있어요 · 상담사는 골라요
        </p>
        {/* Tiny catalog — interleaved male/female faces */}
        <div className="mt-4 flex justify-center -space-x-2 opacity-80">
          {hubCharacters.slice(0, 5).map((c, i) => (
            <div
              key={c.id}
              className="relative h-9 w-9 overflow-hidden rounded-full border border-[#120E12]"
              style={{ zIndex: 5 - i }}
            >
              <Image
                alt={c.name}
                className="object-cover object-top saju-card-face--bright"
                fill
                sizes="36px"
                src={c.portraitSrc}
              />
            </div>
          ))}
          <span className="flex h-9 items-center pl-2 text-[10px] font-semibold text-[#6E666C]">
            +{Math.max(hubCharacters.length - 5, 0)}
          </span>
        </div>
        <div className="mt-4">
          <SajuTrustStrip />
        </div>
      </section>

      <SajuCredibilitySection />

      <div id="products" className="scroll-mt-20 space-y-8">
        {HUB_SHELVES.map((shelf) => (
          <ProductShelf
            key={shelf.id}
            title={shelf.title}
            subtitle={shelf.subtitle}
            cards={itemsForShelf(shelf)}
          />
        ))}
      </div>

      <section className="px-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">전체 사주</h2>
            <p className="mt-1 text-xs text-[#9A9098]">탭·검색으로 빠르게 찾기</p>
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
          {filteredGrid.map((card) => (
            <ProductCard
              key={`${card.productId}-${card.faceCharacterId}`}
              product={card.product}
              faceCharacterId={card.faceCharacterId}
              tone={card.tone}
            />
          ))}
        </div>
        {filteredGrid.length === 0 ? (
          <p className="mt-4 text-center text-sm text-[#9A9098]">
            조건에 맞는 상품이 없어요. 전체 탭을 눌러 보세요.
          </p>
        ) : null}
      </section>

      <section className="px-5">
        <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">오늘 밤의 캐릭터</h2>
        <div className="mt-4 flex gap-3 overflow-x-auto saju-scroll-x pb-1">
          {hubCharacters.map((c, i) => {
            const productId = CHARACTER_PRIMARY_PRODUCT[c.id];
            const href = hubDeepLink(productId, c.id);
            const tone: HubCardTone = i % 2 === 0 ? "romantic" : "bright";
            return (
              <Link
                key={c.id}
                href={href}
                className={`saju-char-card relative w-[48%] min-w-[168px] shrink-0 overflow-hidden rounded-[22px] transition active:scale-[0.985] ${
                  tone === "bright" ? "saju-product-card--bright" : "saju-product-card--romantic"
                }`}
              >
                <div className="relative aspect-[3/4] w-full">
                  <Image
                    alt={c.name}
                    className={`object-cover object-top ${
                      tone === "bright" ? "saju-card-face--bright" : "saju-card-face--romantic"
                    }`}
                    fill
                    sizes="180px"
                    src={c.portraitSrc}
                  />
                  <div
                    className={`absolute inset-0 ${
                      tone === "bright"
                        ? "bg-gradient-to-t from-[#2a1820]/85 via-[#F23870]/15 to-[#fff5f8]/10"
                        : "bg-gradient-to-t from-[#120a10]/90 via-[#1a1018]/35 to-transparent"
                    }`}
                  />
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
                      {c.hook || c.tagline}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
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

      <div className="saju-sticky-hub-cta fixed bottom-[calc(env(safe-area-inset-bottom)+64px)] left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-4 py-3">
        <button
          type="button"
          onClick={onScrollProducts}
          className="saju-cta flex min-h-12 w-full items-center justify-center rounded-full px-6 text-sm font-semibold shadow-[0_12px_40px_rgba(242,56,112,0.4)]"
        >
          무료로 시작하기
        </button>
      </div>
    </div>
  );
}


function previewBlurLines(body: string, maxLines = 3): string[] {
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#") && !l.startsWith("---"))
    .slice(0, maxLines)
    .map((l) => (l.length > 72 ? `${l.slice(0, 72)}…` : l));
}

function paywallCtaLabel(productId: string): string {
  switch (productId) {
    case "breakup-decision":
      return "나머지 장 열기 — 결정·자존";
    case "breakup-reason":
      return "나머지 장 열기 — 진짜 이유";
    case "reunion-strategy":
      return "나머지 장 열기 — 타이밍·멘트";
    default:
      return "나머지 장 열기 — 속마음·타이밍";
  }
}

/** Next locked chapter teaser: title + blur 2~3 lines only (no full TOC). */
function LockedSectionTeaser({
  title,
  index,
  blurLines,
  moreCount,
}: {
  title: string;
  index: number;
  blurLines: string[];
  moreCount: number;
}) {
  return (
    <div className="space-y-3">
      <article className="relative overflow-hidden rounded-[20px] border border-white/8 bg-[#09090B] px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#D8D0D4]">
            <span className="mr-2 text-[10px] font-bold text-[#FF7A99]">
              {String(index + 1).padStart(2, "0")}
            </span>
            {title}
          </h2>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-[#FF7A99]">
            <LockIcon className="h-3 w-3" />
            잠금
          </span>
        </div>
        <div className="relative mt-3 space-y-2 select-none" aria-hidden>
          {(blurLines.length > 0 ? blurLines : ["····", "····", "····"]).map((line, i) => (
            <p
              key={`${i}-${line.slice(0, 12)}`}
              className="text-[13px] leading-5 text-[#6E666C] blur-[5px]"
            >
              {line}
            </p>
          ))}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#09090B]/35 to-[#09090B]/95" />
        </div>
      </article>
      {moreCount > 0 ? (
        <p className="text-center text-[11px] font-semibold tracking-wide text-[#9A9098]">
          +{moreCount}장 더
        </p>
      ) : null}
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
  const character = SAJU_CHARACTERS.find((c) => c.id === report.characterId);
  const clear = report.previewSections[0] ?? report.sections[0];
  const lockedSections = report.sections.slice(1);
  const nextLocked = lockedSections[0];
  const priceLabel = `₩${SAJU_REPORT_PRICE.toLocaleString("ko-KR")}`;

  return (
    <div className={`${SAJU_BOTTOM_NAV_PAD} pb-[calc(env(safe-area-inset-bottom)+188px)]`}>
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
              <div className="rounded-full border border-[#F23870]/45 bg-[#F23870]/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#FF7A99]">
                무료 01 · 나머지 잠금
              </div>
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[#9A9098]">
                참고용
              </span>
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-[-0.04em] text-[#F8F4F6]">
              {report.title}
            </h1>
            <div className="mt-2 rounded-[14px] border border-[#F23870]/25 bg-[#F23870]/10 px-3 py-2.5 text-sm leading-6 text-[#FF7A99]">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#FF7A99]/80">
                미리보기에서 한줄 결론
              </div>
              <div className="mt-1 text-[#F4F0F2]">
                <ReportMarkdown body={report.oneLiner} />
              </div>
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
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#F4F0F2]">
                <span className="mr-2 text-[10px] font-bold text-[#FF7A99]">01</span>
                {clear.title}
              </h2>
              <span className="shrink-0 rounded-full border border-[#F23870]/35 bg-[#F23870]/12 px-2 py-0.5 text-[10px] font-bold text-[#FF7A99]">
                무료 공개
              </span>
            </div>
            <div className="mt-3">
              <ReportMarkdown body={clear.body} />
            </div>
          </article>
        ) : null}

        {nextLocked ? (
          <LockedSectionTeaser
            title={nextLocked.title}
            index={1}
            blurLines={previewBlurLines(nextLocked.body, 3)}
            moreCount={Math.max(0, lockedSections.length - 1)}
          />
        ) : null}

        <GoogleSaveButton
          hint="미리보기는 로그인 없이 봤어요. 보관함에 남기려면 구글로 저장해요."
        />
      </div>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+64px)] left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-4 pb-2">
        <button
          type="button"
          disabled={unlocking}
          onClick={onOpenCheckout}
          className="saju-cta flex min-h-12 w-full items-center justify-center rounded-full px-4 text-sm font-semibold shadow-[0_12px_40px_rgba(242,56,112,0.35)] disabled:opacity-50"
        >
          {unlocking ? "리포트 생성 중…" : `${paywallCtaLabel(product.id)} · ${priceLabel}`}
        </button>
      </div>

      {checkoutOpen ? (
        <CheckoutSheet
          product={product}
          characterId={report.characterId}
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
  const books = getReportBooks(report.productId, report.sections);
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
        <div className="mt-3 rounded-[16px] border border-[#F23870]/30 bg-[#F23870]/10 px-3 py-2 text-sm leading-6 text-[#FF7A99]">
          <ReportMarkdown body={report.oneLiner} />
        </div>
        <WonGukChip report={report} />
        <p className="mt-2 text-center text-[11px] text-[#6E666C]">원국은 만세력 · 해석은 참고용이에요</p>

        <nav
          aria-label="리포트 목차 · 4권"
          className="mt-4 saju-card rounded-[18px] px-4 py-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold tracking-[0.04em] text-[#FF7A99]">
              목차 · {books.length}권 · {report.sections.length}장
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {books.map((book) => (
              <div key={book.id}>
                <a
                  href={`#hub-book-${book.id}`}
                  className="text-[12px] font-bold text-[#F4F0F2] hover:text-[#FF7A99]"
                >
                  {book.label}
                </a>
                <ol className="mt-1.5 space-y-1 border-l border-white/10 pl-3">
                  {book.sectionIndexes.map((si) => {
                    const section = report.sections[si];
                    if (!section) return null;
                    return (
                      <li key={section.id}>
                        <a
                          href={`#hub-section-${section.id}`}
                          className="flex gap-2 text-[12px] leading-5 text-[#B8AEB4] hover:text-[#FF7A99]"
                        >
                          <span className="shrink-0 font-semibold text-[#6E666C]">
                            {String(si + 1).padStart(2, "0")}
                          </span>
                          <span className="line-clamp-1">{section.title}</span>
                        </a>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        </nav>
        <div className="mt-4">
          <GoogleSaveButton hint="다른 기기에서도 보려면 구글로 저장해요." />
        </div>
        <p className="mt-3 text-center text-[11px]">
          <Link href="/saju/my" className="font-semibold text-[#FF7A99] underline-offset-2 hover:underline">
            내 사주에서 다시 보기 →
          </Link>
        </p>
      </div>

      <div className="mt-5 space-y-6 px-5">
        {books.map((book) => (
          <section key={book.id} id={`hub-book-${book.id}`} className="scroll-mt-24 space-y-4">
            <div className="sticky top-14 z-20 -mx-1 rounded-[14px] border border-[#F23870]/25 bg-[#12151C]/95 px-3 py-2 backdrop-blur">
              <div className="text-[11px] font-bold tracking-[0.08em] text-[#FF7A99]">
                {book.shortLabel}
              </div>
              <div className="text-sm font-bold text-[#F4F0F2]">{book.label}</div>
            </div>
            {book.sectionIndexes.map((si) => {
              const section = report.sections[si];
              if (!section) return null;
              return (
                <article
                  key={section.id}
                  id={`hub-section-${section.id}`}
                  className="saju-card scroll-mt-28 rounded-[20px] px-4 py-4"
                >
                  <h2 className="text-base font-bold tracking-[-0.03em] text-[#F4F0F2]">
                    <span className="mr-2 text-[10px] font-bold text-[#FF7A99]">
                      {String(si + 1).padStart(2, "0")}
                    </span>
                    {section.title}
                  </h2>
                  <div className="mt-3">
                    <ReportMarkdown body={section.body} />
                  </div>
                </article>
              );
            })}
          </section>
        ))}
      </div>

      <section className="mt-8 space-y-3 px-5 pb-4" aria-label="다음에 할 일">
        <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">다음에 할 일</h2>
        <p className="text-xs leading-5 text-[#9A9098]">
          리포트는 내 사주함에 저장돼 있어요. 다른 점사도 이어서 볼 수 있어요.
        </p>
        <Link
          href="/saju/my"
          className="saju-cta flex min-h-12 w-full items-center justify-center rounded-full text-sm font-semibold"
        >
          내 사주함 열기
        </Link>
        <button
          type="button"
          onClick={onBackHub}
          className="flex min-h-11 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-[#FF7A99] transition hover:bg-white/8"
        >
          사주 허브로 돌아가기
        </button>
        <div className="pt-2">
          <div className="mb-2 text-xs font-bold tracking-[0.04em] text-[#FF7A99]">다른 상품</div>
          <div className="saju-scroll-x flex gap-3 overflow-x-auto pb-1">
            {SAJU_PRODUCTS.filter((p) => p.id !== report.productId).map((p) => {
              const landing = getLandingByProductId(p.id);
              const href = landing?.path ?? `/saju?product=${p.id}`;
              return (
                <Link
                  key={p.id}
                  href={href}
                  className="saju-card flex min-w-[150px] max-w-[170px] shrink-0 flex-col rounded-[16px] px-3 py-3 transition active:scale-[0.98]"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9A9098]">
                    {p.badge}
                  </span>
                  <span className="mt-1 text-sm font-bold text-[#F4F0F2]">{p.shortTitle}</span>
                  <span className="mt-2 text-[11px] font-semibold text-[#FF7A99]">무료로 시작하기 →</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export function SajuHubApp({
  initialProductId = null,
  initialCharacterId = null,
}: {
  initialProductId?: SajuProductId | null;
  initialCharacterId?: SajuCharacterId | null;
} = {}) {
  const [step, setStep] = useState<SajuReportStep>(initialProductId ? "form" : "hub");
  const [productId, setProductId] = useState<SajuProductId | null>(initialProductId);
  const [characterId, setCharacterId] = useState<SajuCharacterId | null>(
    initialCharacterId,
  );
  const [form, setForm] = useState<SajuBirthForm>(() => emptyBirthForm());
  const [preview, setPreview] = useState<SajuReportPayload | null>(null);
  const [report, setReport] = useState<SajuReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoadingTheater, setShowLoadingTheater] = useState(false);
  const [loadingReady, setLoadingReady] = useState(false);
  const pendingPreviewRef = useRef<SajuReportPayload | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showUnlockCelebration, setShowUnlockCelebration] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const product = useMemo(
    () => (productId ? getSajuProduct(productId) : null),
    [productId],
  );

  const resolvedCharacterId = useMemo(() => {
    if (!product) return null;
    return resolveProductCounselor(product, characterId ?? product.characterId);
  }, [product, characterId]);

  useEffect(() => {
    const unlocked = readSajuReportUnlock();
    if (unlocked.unlocked && unlocked.productId) {
      // keep unlock flag; user still goes through flow unless report already held
    }
  }, []);

  useEffect(() => {
    if (!initialProductId) return;
    setProductId(initialProductId);
    const nextProduct = getSajuProduct(initialProductId);
    if (nextProduct) {
      setCharacterId(resolveProductCounselor(nextProduct, initialCharacterId));
    }
    setStep("form");
  }, [initialProductId, initialCharacterId]);

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
      if (!productId || !resolvedCharacterId) return null;
      const res = await fetch("/api/saju/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          form,
          previewOnly,
          characterId: resolvedCharacterId,
        }),
      });
      if (!res.ok) throw new Error("report_failed");
      const data = (await res.json()) as { report: SajuReportPayload };
      return data.report;
    },
    [productId, form, resolvedCharacterId],
  );

  const handlePreview = useCallback(async () => {
    setLoading(true);
    setShowLoadingTheater(true);
    setLoadingReady(false);
    pendingPreviewRef.current = null;
    setError(null);
    try {
      const next = await fetchReport(true);
      if (!next) throw new Error("empty");
      pendingPreviewRef.current = next;
      setLoadingReady(true);
    } catch {
      pendingPreviewRef.current = null;
      setShowLoadingTheater(false);
      setLoadingReady(false);
      setLoading(false);
      setError("미리보기를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }, [fetchReport]);

  const finishLoadingTheater = useCallback(() => {
    const next = pendingPreviewRef.current;
    if (!next) return;
    pendingPreviewRef.current = null;
    setPreview(next);
    setShowLoadingTheater(false);
    setLoadingReady(false);
    setLoading(false);
    setStep("preview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
      setShowUnlockCelebration(true);
    } catch {
      setError("리포트 생성에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setUnlocking(false);
    }
  }, [fetchReport, productId]);

  const finishUnlockCelebration = useCallback(() => {
    setShowUnlockCelebration(false);
    setStep("report");
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, []);

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

          {step === "form" && product && resolvedCharacterId ? (
            <SajuBirthFormView
              product={product}
              characterId={resolvedCharacterId}
              onCharacterChange={setCharacterId}
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
        {showLoadingTheater && resolvedCharacterId ? (
          <SajuLoadingTheater
            characterId={resolvedCharacterId}
            accent={product?.accent}
            ready={loadingReady}
            onComplete={finishLoadingTheater}
          />
        ) : null}
        {showUnlockCelebration && report ? (
          <SajuUnlockCelebration
            accent={product?.accent}
            sectionTitles={report.sections.map((s) => s.title)}
            onComplete={finishUnlockCelebration}
          />
        ) : null}
      </div>
    </div>
  );
}
