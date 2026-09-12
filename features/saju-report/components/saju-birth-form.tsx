"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { SAJU_CHARACTERS } from "@/features/saju-chat/characters";
import type { SajuCharacterId } from "@/features/saju-chat/types";
import { getCanonicalSectionCount } from "@/features/saju-report/canonical-sections";
import { FORM_STEPS, type FormStepId } from "@/features/saju-report/form-steps";
import { getProductCounselors } from "@/features/saju-report/products";
import type { SajuBirthForm, SajuProduct } from "@/features/saju-report/types";

import { CounselorSwitcher } from "./counselor-switcher";
import { SAJU_BOTTOM_NAV_PAD } from "./saju-bottom-nav";

const GENDER_CHOICES = ["여성", "남성", "기타"] as const;

const BREAKUP_CHIPS = [
  "서로 지쳐 멀어진 느낌",
  "연락이 끊긴 채 끝났어요",
  "싸움 끝에 헤어진 것 같아요",
  "상대가 먼저 거리를 뒀어요",
  "아직 이유조차 모르겠어요",
] as const;

const CONCERN_CHIPS = [
  "그 사람, 아직 나에게 마음이 남아 있을까?",
  "지금 연락해도 될까, 더 멀어질까?",
  "재회가 가능한 타이밍일까?",
  "붙잡아야 할지, 놓아야 할지 모르겠어요",
  "상대 속마음이 궁금해요",
] as const;

const CONCERN_MAX = 160;
const BREAKUP_MAX = 80;
const MONTHS_MIN = 0;
const MONTHS_MAX = 120;

const BIRTH_YEARS = (() => {
  const now = new Date().getFullYear();
  const years: number[] = [];
  for (let y = now; y >= 1940; y -= 1) years.push(y);
  return years;
})();

function daysInMonth(year: number, month: number) {
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

function freePreviewScopeLine(product: SajuProduct) {
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
  placeholder = "예: 14:30 또는 오후 2시",
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
        inputMode="text"
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

function BirthYmdSelects({
  year,
  month,
  day,
  onYear,
  onMonth,
  onDay,
  yearPlaceholder = "연도",
}: {
  year: string;
  month: string;
  day: string;
  onYear: (v: string) => void;
  onMonth: (v: string) => void;
  onDay: (v: string) => void;
  yearPlaceholder?: string;
}) {
  const yNum = parseInt(year, 10) || 0;
  const mNum = parseInt(month, 10) || 0;
  const maxDay = daysInMonth(yNum || 2000, mNum || 1);
  const dayNum = parseInt(day, 10);

  const selectClass =
    "saju-input min-h-12 w-full appearance-none rounded-[14px] px-3 text-sm text-[#F4F0F2]";

  return (
    <div className="grid grid-cols-3 gap-2">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">연도</span>
        <select
          className={selectClass}
          value={year}
          onChange={(e) => {
            onYear(e.target.value);
            const nextMax = daysInMonth(parseInt(e.target.value, 10) || 2000, mNum || 1);
            if (dayNum > nextMax) onDay(String(nextMax));
          }}
          aria-label={yearPlaceholder}
        >
          <option value="">{yearPlaceholder}</option>
          {BIRTH_YEARS.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">월</span>
        <select
          className={selectClass}
          value={month}
          onChange={(e) => {
            onMonth(e.target.value);
            const nextMax = daysInMonth(yNum || 2000, parseInt(e.target.value, 10) || 1);
            if (dayNum > nextMax) onDay(String(nextMax));
          }}
          aria-label="월"
        >
          <option value="">월</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={String(m)}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">일</span>
        <select
          className={selectClass}
          value={day}
          onChange={(e) => onDay(e.target.value)}
          aria-label="일"
        >
          <option value="">일</option>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={String(d)}>
              {d}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function SuggestionChips({
  chips,
  onPick,
  label,
}: {
  chips: readonly string[];
  onPick: (text: string) => void;
  label: string;
}) {
  return (
    <div className="mt-2">
      <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-[#6E666C]">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onPick(chip)}
            className="rounded-full border border-white/12 bg-white/5 px-2.5 py-1.5 text-left text-[11px] font-semibold leading-snug text-[#D8D0D4] transition hover:border-[#E8336D]/40 hover:bg-[#E8336D]/12 hover:text-[#FF7A99]"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

function parseMonthsApart(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isInteger(n)) return null;
  if (n < MONTHS_MIN || n > MONTHS_MAX) return null;
  return n;
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
  const [step, setStep] = useState<FormStepId>("gender");
  const patch = (partial: Partial<SajuBirthForm>) => setForm({ ...form, ...partial });
  const counselors = getProductCounselors(product);
  const character = SAJU_CHARACTERS.find((c) => c.id === characterId);
  const scopeLine = freePreviewScopeLine(product);

  const genderOk = form.gender === "여성" || form.gender === "남성" || form.gender === "기타";

  const basicOk = useMemo(() => {
    const y = parseInt(form.birthYear, 10);
    const m = parseInt(form.birthMonth, 10);
    const d = parseInt(form.birthDay, 10);
    if (!Number.isFinite(y) || y < 1940 || y > new Date().getFullYear()) return false;
    if (!Number.isFinite(m) || m < 1 || m > 12) return false;
    const maxD = daysInMonth(y, m);
    if (!Number.isFinite(d) || d < 1 || d > maxD) return false;
    return true;
  }, [form.birthYear, form.birthMonth, form.birthDay]);

  const monthsParsed = parseMonthsApart(form.monthsApart);
  const situationOk = useMemo(() => {
    return monthsParsed !== null && form.concern.trim().length > 0;
  }, [monthsParsed, form.concern]);

  const goNext = () => {
    if (step === "gender") setStep("basic");
    else if (step === "basic") setStep("partner");
    else if (step === "partner") setStep("situation");
    else if (step === "situation") setStep("confirm");
  };

  const goPrev = () => {
    if (step === "basic") setStep("gender");
    else if (step === "partner") setStep("basic");
    else if (step === "situation") setStep("partner");
    else if (step === "confirm") setStep("situation");
    else onBack();
  };

  const backLabel =
    step === "gender" ? "상품으로" : step === "basic" ? "이전 · 성별" : "이전";

  return (
    <div className={SAJU_BOTTOM_NAV_PAD}>
      <div className="saju-header sticky top-12 z-30 border-b border-white/5 px-5 pb-3 pt-3">
        <button
          type="button"
          onClick={goPrev}
          className="text-sm font-semibold text-[#9A9098] hover:text-[#FF7A99]"
        >
          ← {backLabel}
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
        {step !== "gender" ? (
          <>
            <CounselorSwitcher
              counselors={counselors}
              selectedId={characterId}
              size="sm"
              onSelect={(id) => onCharacterChange(id as SajuCharacterId)}
            />
            <p className="text-sm leading-6 text-[#9A9098]">
              로그인 없이 바로 적을 수 있어요. 생년월일과 상황을 자세히 적을수록 해석이 더 구체해져요.
            </p>
          </>
        ) : null}
      </div>

      <div className="mt-5 space-y-4 px-5 pb-8">
        {step === "gender" ? (
          <>
            <div className="pt-2">
              <h2 className="text-[1.35rem] font-bold tracking-[-0.03em] text-[#F8F4F6]">
                나의 성별을 알려주세요
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#9A9098]">
                성별에 따라 대운의 시기가 달라져요
              </p>
            </div>
            <div className="flex flex-col gap-2.5 pt-2">
              {GENDER_CHOICES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => patch({ gender: g })}
                  className={`min-h-14 rounded-[16px] text-base font-semibold transition ${
                    form.gender === g
                      ? "bg-[#E8336D] text-white shadow-[0_10px_28px_rgba(232,51,109,0.35)]"
                      : "border border-white/10 bg-white/5 text-[#D8D0D4] hover:bg-white/8"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <p className="text-center text-[11px] text-[#6E666C]">
              선택하기 전에는 다음으로 갈 수 없어요
            </p>
            <button
              type="button"
              disabled={!genderOk}
              onClick={goNext}
              className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold disabled:opacity-40"
            >
              다음 · 기본정보
            </button>
          </>
        ) : null}

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
              <p className="mb-1 text-xs font-semibold text-[#9A9098]">내 출생 · 양력</p>
              <p className="mb-2 text-[11px] leading-5 text-[#6E666C]">
                지금은 양력 기준으로 봐요
              </p>
              <BirthYmdSelects
                year={form.birthYear}
                month={form.birthMonth}
                day={form.birthDay}
                onYear={(birthYear) => patch({ birthYear })}
                onMonth={(birthMonth) => patch({ birthMonth })}
                onDay={(birthDay) => patch({ birthDay })}
              />
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
                {GENDER_CHOICES.map((g) => (
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
            <div>
              <p className="mb-2 text-xs font-semibold text-[#9A9098]">상대 출생 · 양력</p>
              <BirthYmdSelects
                year={form.partnerBirthYear}
                month={form.partnerBirthMonth}
                day={form.partnerBirthDay}
                onYear={(partnerBirthYear) => patch({ partnerBirthYear })}
                onMonth={(partnerBirthMonth) => patch({ partnerBirthMonth })}
                onDay={(partnerBirthDay) => patch({ partnerBirthDay })}
                yearPlaceholder="연도(선택)"
              />
            </div>
            <BirthTimeField
              label="상대 출생 시간"
              value={form.partnerBirthTime}
              onChange={(partnerBirthTime) => patch({ partnerBirthTime })}
              placeholder="예: 15:00 또는 모름"
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
              <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">
                헤어진 지 (개월)
              </span>
              <input
                className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
                inputMode="numeric"
                value={form.monthsApart}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, "");
                  patch({ monthsApart: raw });
                }}
                placeholder="직접 입력 · 0~120"
                required
              />
              <p className="mt-1.5 text-[11px] text-[#6E666C]">
                {monthsParsed === null && form.monthsApart.trim()
                  ? `${MONTHS_MIN}~${MONTHS_MAX} 사이 숫자로 적어 주세요`
                  : "비워 두지 말고, 대략이라도 적어 주세요 (기본값 없음)"}
              </p>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">이별 상황</span>
              <input
                className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
                value={form.breakupNote}
                maxLength={BREAKUP_MAX}
                onChange={(e) => patch({ breakupNote: e.target.value.slice(0, BREAKUP_MAX) })}
                placeholder="짧게 적어도 돼요"
              />
              <SuggestionChips
                chips={BREAKUP_CHIPS}
                label="탭해서 채우기"
                onPick={(text) => patch({ breakupNote: text.slice(0, BREAKUP_MAX) })}
              />
              <p className="mt-1 text-right text-[10px] text-[#6E666C]">
                {form.breakupNote.length}/{BREAKUP_MAX}
              </p>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">
                지금 가장 궁금한 것
              </span>
              <textarea
                className="saju-input min-h-28 w-full resize-none rounded-[14px] px-4 py-3 text-sm"
                value={form.concern}
                maxLength={CONCERN_MAX}
                onChange={(e) => patch({ concern: e.target.value.slice(0, CONCERN_MAX) })}
                placeholder="그 사람, 아직 나에게 마음이 남아 있을까?"
                required
              />
              <SuggestionChips
                chips={CONCERN_CHIPS}
                label="감정 프롬프트 · 탭해서 채우기"
                onPick={(text) => patch({ concern: text.slice(0, CONCERN_MAX) })}
              />
              <p className="mt-1 text-right text-[10px] text-[#6E666C]">
                {form.concern.length}/{CONCERN_MAX}
              </p>
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
                {form.displayName || "호칭 미입력"} · {form.gender || "성별 미선택"} · 양력{" "}
                {form.birthYear || "????"}.{form.birthMonth || "?"}.{form.birthDay || "?"} ·{" "}
                {form.birthTime === "모름" || !form.birthTime.trim()
                  ? "시간 모름"
                  : form.birthTime}
                {form.birthPlace ? ` · ${form.birthPlace}` : ""}
              </p>
              <p>
                <span className="text-[#9A9098]">상대 · </span>
                {form.partnerName || "이름 미입력"}
                {form.partnerGender ? ` · ${form.partnerGender}` : ""}
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
              disabled={loading || !genderOk || !basicOk || !situationOk}
              onClick={onSubmit}
              className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold disabled:opacity-50"
            >
              {loading ? "점사 준비 중…" : "무료 미리보기 보기"}
            </button>
            <button
              type="button"
              onClick={() => setStep("gender")}
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

