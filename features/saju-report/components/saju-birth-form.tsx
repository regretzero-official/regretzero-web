"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { SAJU_CHARACTERS } from "@/features/saju-chat/characters";
import type { SajuCharacterId } from "@/features/saju-chat/types";
import { getCanonicalSectionCount } from "@/features/saju-report/canonical-sections";
import { getProductCounselors } from "@/features/saju-report/products";
import type { SajuBirthForm, SajuProduct } from "@/features/saju-report/types";

import { CounselorSwitcher } from "./counselor-switcher";
import { SAJU_BOTTOM_NAV_PAD } from "./saju-bottom-nav";

const FORM_STEPS = [
  { id: "basic", label: "기본정보" },
  { id: "partner", label: "상대" },
  { id: "situation", label: "상황" },
  { id: "confirm", label: "확인" },
] as const;

type FormStepId = (typeof FORM_STEPS)[number]["id"];

function freePreviewScopeLine(product: SajuProduct, freeCount = 1) {
  const total = getCanonicalSectionCount(product.id);
  return `무료 1장 · 나머지 잠금(${product.shortTitle} ${total}장)`;
}

function FormStepper({ step }: { step: FormStepId }) {
  const index = FORM_STEPS.findIndex((s) => s.id === step);
  return (
    <nav aria-label="입력 단계" className="mt-3">
      <ol className="flex items-center gap-1">
        {FORM_STEPS.map((s, i) => {
          const active = i === index;
          const done = i < index;
          return (
            <li key={s.id} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-center gap-1">
                <span
                  className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    active
                      ? "bg-[#E8336D] text-white"
                      : done
                        ? "bg-[#E8336D]/35 text-[#FF7A99]"
                        : "bg-white/8 text-[#6E666C]"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
              </div>
              <span
                className={`truncate text-[10px] font-semibold ${
                  active ? "text-[#F4F0F2]" : "text-[#6E666C]"
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#E8336D] to-[#FF7A99] transition-[width] duration-300"
          style={{ width: `${((index + 1) / FORM_STEPS.length) * 100}%` }}
        />
      </div>
    </nav>
  );
}

function BirthTimeField({
  label,
  value,
  onChange,
  placeholder = "14:30",
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const explicitlyUnknown = value === "모름";

  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">{label}</span>
      <input
        className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm disabled:opacity-45"
        value={explicitlyUnknown ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={explicitlyUnknown ? "시간 모름" : placeholder}
        disabled={explicitlyUnknown}
        inputMode="numeric"
        aria-label={label}
      />
      <label className="mt-2 flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-[#B8AEB4]">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-white/20 accent-[#E8336D]"
          checked={explicitlyUnknown}
          onChange={(e) => onChange(e.target.checked ? "모름" : "")}
        />
        <span>출생 시간 모름</span>
        <span className="font-medium text-[#6E666C]">· 시주 없이 볼게요</span>
      </label>
    </div>
  );
}

export function SajuBirthFormView({
  product,
  characterId,
  onCharacterChange,
  form,
  setForm,
  onBack,
  onSubmit,
  loading,
}: {
  product: SajuProduct;
  characterId: SajuCharacterId;
  onCharacterChange: (id: SajuCharacterId) => void;
  form: SajuBirthForm;
  setForm: (next: SajuBirthForm) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const [step, setStep] = useState<FormStepId>("basic");
  const patch = (partial: Partial<SajuBirthForm>) => setForm({ ...form, ...partial });
  const counselors = getProductCounselors(product);
  const character = SAJU_CHARACTERS.find((c) => c.id === characterId);
  const scopeLine = freePreviewScopeLine(product, 1);

  const basicOk = useMemo(() => {
    return (
      form.birthYear.trim().length >= 4 &&
      form.birthMonth.trim().length > 0 &&
      form.birthDay.trim().length > 0
    );
  }, [form.birthYear, form.birthMonth, form.birthDay]);

  const situationOk = useMemo(() => {
    return form.monthsApart.trim().length > 0 && form.concern.trim().length > 0;
  }, [form.monthsApart, form.concern]);

  const goNext = () => {
    if (step === "basic") setStep("partner");
    else if (step === "partner") setStep("situation");
    else if (step === "situation") setStep("confirm");
  };

  const goPrev = () => {
    if (step === "partner") setStep("basic");
    else if (step === "situation") setStep("partner");
    else if (step === "confirm") setStep("situation");
    else onBack();
  };

  return (
    <div className={SAJU_BOTTOM_NAV_PAD}>
      <div className="saju-header sticky top-12 z-30 border-b border-white/5 px-5 pb-3 pt-3">
        <button
          type="button"
          onClick={goPrev}
          className="text-sm font-semibold text-[#9A9098] hover:text-[#FF7A99]"
        >
          ← {step === "basic" ? "상품으로" : "이전"}
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
              <span>{character?.name ?? product.characterName}</span>
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
        <FormStepper step={step} />
      </div>

      <div className="space-y-3 px-5 pt-3">
        <CounselorSwitcher
          counselors={counselors}
          selectedId={characterId}
          size="sm"
          onSelect={(id) => onCharacterChange(id as SajuCharacterId)}
        />
        <p className="text-sm leading-6 text-[#9A9098]">
          로그인 없이 바로 적을 수 있어요. 생년월일과 상황을 자세히 적을수록 해석이 더 구체해져요.
        </p>
      </div>

      <div className="mt-5 space-y-4 px-5 pb-8">
        {step === "basic" ? (
          <>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">호칭</span>
              <input
                className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
                value={form.displayName}
                onChange={(e) => patch({ displayName: e.target.value })}
                placeholder="수진"
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

            <div>
              <p className="mb-2 text-xs font-semibold text-[#9A9098]">내 출생 · 양력</p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["birthYear", "연도", "1992"],
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
                      required
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <BirthTimeField
                label="출생 시간"
                value={form.birthTime}
                onChange={(birthTime) => patch({ birthTime })}
              />
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

            <button
              type="button"
              disabled={!basicOk}
              onClick={goNext}
              className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold disabled:opacity-40"
            >
              다음 · 상대 정보
            </button>
          </>
        ) : null}

        {step === "partner" ? (
          <>
            <p className="text-xs font-semibold text-[#9A9098]">상대 출생 · 아는 만큼만</p>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">상대 이름</span>
              <input
                className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
                value={form.partnerName}
                onChange={(e) => patch({ partnerName: e.target.value })}
                placeholder="민재"
              />
            </label>
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">상대 성별</span>
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
                  ["partnerBirthYear", "연도", "1993"],
                  ["partnerBirthMonth", "월", "7"],
                  ["partnerBirthDay", "일", "21"],
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
            <BirthTimeField
              label="상대 출생 시간"
              value={form.partnerBirthTime}
              onChange={(partnerBirthTime) => patch({ partnerBirthTime })}
              placeholder="15:00"
            />
            <button
              type="button"
              onClick={goNext}
              className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold"
            >
              다음 · 상황
            </button>
          </>
        ) : null}

        {step === "situation" ? (
          <>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">헤어진 지 (개월)</span>
              <input
                className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
                inputMode="numeric"
                value={form.monthsApart}
                onChange={(e) => patch({ monthsApart: e.target.value })}
                placeholder="3"
                required
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
                placeholder="그 사람, 아직 나에게 마음이 남아 있을까?"
                required
              />
            </label>
            <button
              type="button"
              disabled={!situationOk}
              onClick={goNext}
              className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold disabled:opacity-40"
            >
              다음 · 확인
            </button>
          </>
        ) : null}

        {step === "confirm" ? (
          <>
            <div className="saju-card-elevated space-y-3 rounded-[20px] px-4 py-4 text-sm leading-6 text-[#D8D0D4]">
              <div className="text-xs font-bold tracking-[0.08em] text-[#FF7A99]">입력 확인</div>
              <p>
                <span className="text-[#9A9098]">나 · </span>
                {form.displayName || "호칭 미입력"} · {form.gender} ·{" "}
                {form.birthYear || "????"}.{form.birthMonth || "?"}.{form.birthDay || "?"} ·{" "}
                {form.birthTime === "모름" || !form.birthTime.trim()
                  ? "시간 모름"
                  : form.birthTime}
                {form.birthPlace ? ` · ${form.birthPlace}` : ""}
              </p>
              <p>
                <span className="text-[#9A9098]">상대 · </span>
                {form.partnerName || "이름 미입력"}
                {form.partnerBirthYear
                  ? ` · ${form.partnerBirthYear}.${form.partnerBirthMonth || "?"}.${form.partnerBirthDay || "?"}`
                  : " · 생일 일부 미입력"}
                {form.partnerBirthTime === "모름"
                  ? " · 시간 모름"
                  : form.partnerBirthTime
                    ? ` · ${form.partnerBirthTime}`
                    : ""}
              </p>
              <p>
                <span className="text-[#9A9098]">상황 · </span>
                헤어진 지 {form.monthsApart || "?"}개월
                {form.breakupNote ? ` · ${form.breakupNote}` : ""}
              </p>
              <p className="text-[#F4F0F2]">
                <span className="text-[#9A9098]">궁금한 것 · </span>
                {form.concern || "—"}
              </p>
            </div>
            <p className="text-center text-[11px] leading-5 text-[#9A9098]">{scopeLine}</p>
            <button
              type="button"
              disabled={loading || !basicOk || !situationOk}
              onClick={onSubmit}
              className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold disabled:opacity-50"
            >
              {loading ? "점사 준비 중…" : "무료 미리보기 보기"}
            </button>
            <button
              type="button"
              onClick={() => setStep("basic")}
              className="flex min-h-11 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-[#B8AEB4]"
            >
              처음부터 수정
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
