"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SAJU_CHARACTERS } from "@/features/saju-chat/characters";
import { emptyBirthForm } from "@/features/saju-report/buildReport";
import { SAJU_DEMO_REVIEWS } from "@/features/saju-report/demo-reviews";
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

import { ReportMarkdown } from "./report-markdown";

function Stars({ n }: { n: number }) {
  return (
    <span className="tracking-tight text-[#FF7A99]" aria-label={`${n}점`}>
      {"★".repeat(n)}
      <span className="text-white/20">{"★".repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

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

function HubLanding({
  onScrollProducts,
}: {
  onScrollProducts: () => void;
}) {
  return (
    <div className="space-y-10 pb-28">
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
          여자의 마음은 여자가 잘 알지—캐릭터가 사주 흐름으로 재회운과 속마음을 길게 풀어드려요.
        </p>
        <p className="mt-2 text-[11px] leading-5 text-[#6E666C]">
          재미·위로용 콘텐츠예요. 실제 예언이나 상담을 대신하지 않아요.
        </p>
        <button
          type="button"
          onClick={onScrollProducts}
          className="saju-cta mt-5 inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold"
        >
          무료로 시작하기
        </button>
      </section>

      <section id="saju-products" className="px-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">어떤 사주가 필요하세요?</h2>
            <p className="mt-1 text-xs text-[#9A9098]">지금 마음에 가장 가까운 걸 골라보세요</p>
          </div>
          <span className="saju-pill rounded-full px-2.5 py-1 text-[10px] font-semibold">
            데모 ₩9,900
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SAJU_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="px-5">
        <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">오늘 밤의 캐릭터</h2>
        <p className="mt-1 text-xs text-[#9A9098]">
          여자 가이드는 여자의 마음을 안에서 알아요. 누가 읽어주길 원하는지에 따라 결이 달라요
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
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold tracking-[-0.04em] text-[#F4F0F2]">후기</h2>
          <span className="rounded-full border border-[#E8336D]/45 bg-[#E8336D]/15 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#FF7A99]">
            예시 후기(데모)
          </span>
        </div>
        <p className="mb-4 text-xs leading-5 text-[#9A9098]">
          아래는 실제 구매 후기가 아닌 <strong className="text-[#D8D0D4]">UI 예시(데모)</strong>
          입니다. 서비스 톤 참고용으로만 봐 주세요.
        </p>
        <div className="space-y-3">
          {SAJU_DEMO_REVIEWS.map((r) => (
            <article
              key={r.id}
              className="saju-card rounded-[20px] px-4 py-4"
            >
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

      <section className="px-5">
        <div className="saju-card-elevated rounded-[22px] px-4 py-4 text-xs leading-5 text-[#9A9098]">
          본 서비스는 오락·위로 목적의 엔터테인먼트입니다. 실제 만세력·점술·의료·법률 조언이
          아니며, 원치 않는 연락·스토킹을 권장하지 않습니다.
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
    <div className="pb-28">
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
        className="mt-5 space-y-4 px-5"
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
              ["birthYear", "년", "1995"],
              ["birthMonth", "월", "3"],
              ["birthDay", "일", "14"],
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
            <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">출생 시간</span>
            <input
              className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
              value={form.birthTime}
              onChange={(e) => patch({ birthTime: e.target.value })}
              placeholder="밤 10시"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">출생 지역</span>
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
            <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">상대 출생년</span>
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
  onBack,
  onUnlock,
}: {
  product: SajuProduct;
  report: SajuReportPayload;
  unlocking: boolean;
  onBack: () => void;
  onUnlock: () => void;
}) {
  const character = SAJU_CHARACTERS.find((c) => c.id === product.characterId);
  const clear = report.previewSections[0];
  const blurred = report.previewSections[1] ?? report.sections[1];

  return (
    <div className="pb-32">
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
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF7A99]">
              무료 미리보기
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-[-0.04em] text-[#F8F4F6]">
              {report.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#D8D0D4]">{report.oneLiner}</p>
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
          <div className="text-sm font-semibold text-[#F4F0F2]">전체 리포트에 포함</div>
          <ul className="mt-2 space-y-1.5 text-sm text-[#B8AEB4]">
            {product.sections.map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-[#9A9098]">
            데모 결제 · 실제 결제 연동 전 · localStorage 잠금 해제
          </p>
          <button
            type="button"
            disabled={unlocking}
            onClick={onUnlock}
            className="saju-cta mt-4 flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold disabled:opacity-50"
          >
            {unlocking
              ? "리포트 생성 중…"
              : `데모로 잠금 해제 (₩${SAJU_REPORT_PRICE.toLocaleString("ko-KR")})`}
          </button>
        </div>
      </div>
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
    <div className="pb-24">
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
        <p className="mt-3 rounded-[16px] border border-[#E8336D]/30 bg-[#E8336D]/10 px-3 py-2 text-sm leading-6 text-[#FF7A99]">
          {report.oneLiner}
        </p>
      </div>

      <div className="mt-5 space-y-4 px-5">
        {report.sections.map((section) => (
          <article key={section.id} className="saju-card rounded-[20px] px-4 py-4">
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
    document.getElementById("saju-products")?.scrollIntoView({ behavior: "smooth" });
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
      setReport(full);
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
            href="/saju/chat"
            className="text-[11px] font-semibold text-[#FF7A99] underline-offset-2 hover:underline"
          >
            캐릭터와 대화(베타)
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
              onBack={() => setStep("form")}
              onUnlock={handleUnlock}
            />
          ) : null}

          {step === "report" && report ? (
            <ReportView report={report} onBackHub={() => setStep("hub")} />
          ) : null}
        </main>

        {step === "hub" ? (
          <div className="saju-footer fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
            <div className="mb-2 flex justify-center">
              <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] font-semibold text-[#FF7A99] backdrop-blur">
                예시 · 지금 보는 중
              </span>
            </div>
            <Link
              href="/saju/reunion"
              className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold"
            >
              재회운 무료로 보기
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
