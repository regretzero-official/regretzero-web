"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";

import { SAJU_CHARACTERS } from "@/features/saju-chat/characters";
import type { SajuCharacterId } from "@/features/saju-chat/types";
import { getCanonicalSectionCount } from "@/features/saju-report/canonical-sections";
import { FORM_STEPS, type FormStepId } from "@/features/saju-report/form-steps";
import { getProductCounselors } from "@/features/saju-report/products";
import type { SajuBirthForm, SajuProduct } from "@/features/saju-report/types";

import { CounselorSwitcher } from "./counselor-switcher";

const GENDER_CHOICES = ["여성", "남성", "기타"] as const;

const BREAKUP_CHIPS = [
  "서로 마음이 식어 멀어진 느낌이에요",
  "연락이 끊긴 채 끝이 났어요",
  "큰 싸움 끝에 헤어진 것 같아요",
  "상대가 먼저 거리를 뒀어요",
  "아직 이유조차 모르겠어요",
  "다시 이어지고 싶은데 말이 안 나와요",
] as const;

const CONCERN_CHIPS = [
  "그 사람, 아직 나에게 마음이 남아 있을까?",
  "지금 연락해도 될까, 더 멀어질까?",
  "재회가 가능한 타이밍일까?",
  "붙잡아야 할지, 놓아야 할지 모르겠어요",
  "상대 속마음이 궁금해요",
  "내가 너무 늦어 버린 건 아닐까요?",
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

/** Mask free typing into HH:MM when digits are entered. */
function maskBirthTimeInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "모름") return trimmed;
  // Allow plain Korean phrases (오후 2시 등) without forcing mask
  if (/[가-힣]/.test(trimmed)) return raw.slice(0, 24);
  const digits = trimmed.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
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

function StickyNextBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="sticky bottom-0 z-20 -mx-5 mt-6 border-t border-white/8 bg-[#08090d]/92 px-5 pt-3 backdrop-blur-md"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)",
      }}
    >
      {children}
    </div>
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
        onChange={(e) => onChange(maskBirthTimeInput(e.target.value))}
        placeholder={explicitlyUnknown ? "시간 모름" : placeholder}
        disabled={explicitlyUnknown}
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
      />
      <label className="mt-2.5 flex min-h-11 cursor-pointer items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[13px] font-semibold text-[#D8D0D4] transition hover:bg-white/[0.07]">
        <input
          type="checkbox"
          className="h-5 w-5 shrink-0 rounded border-white/20 accent-[#E8336D]"
          checked={explicitlyUnknown}
          onChange={(e) => onChange(e.target.checked ? "모름" : "")}
        />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span>출생 시간을 모르겠어요</span>
          <span className="text-[11px] font-medium text-[#6E666C]">
            체크하면 시주 없이 양력 날짜만으로 볼게요
          </span>
        </span>
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
  yearPlaceholder = "년",
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
      <label className="block min-w-0">
        <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">년</span>
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
              {y}년
            </option>
          ))}
        </select>
      </label>
      <label className="block min-w-0">
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
              {m}월
            </option>
          ))}
        </select>
      </label>
      <label className="block min-w-0">
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
              {d}일
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function SuggestionChips({
  chips,
  value,
  onPick,
  label,
}: {
  chips: readonly string[];
  value: string;
  onPick: (text: string) => void;
  label: string;
}) {
  const isChipSelected = (chip: string) => value.trim() === chip;
  const hasCustom =
    value.trim().length > 0 && !chips.some((c) => c === value.trim());

  return (
    <div className="mt-2">
      <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-[#6E666C]">{label}</p>
      {hasCustom ? (
        <p className="mb-1.5 text-[10px] leading-snug text-[#9A9098]">
          직접 쓴 글이 있어요 · 칩을 누르면 그 문장으로 바뀌어요
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => {
          const active = isChipSelected(chip);
          return (
            <button
              key={chip}
              type="button"
              onClick={() => {
                // One-tap fill: empty or matching chip → set; custom text → confirm replace via toggle-off then set
                if (active) return;
                onPick(chip);
              }}
              className={`rounded-full border px-2.5 py-1.5 text-left text-[11px] font-semibold leading-snug transition ${
                active
                  ? "border-transparent bg-[#E8336D] text-white shadow-[0_6px_18px_rgba(232,51,109,0.28)]"
                  : "border-white/12 bg-white/5 text-[#D8D0D4] hover:border-[#E8336D]/40 hover:bg-[#E8336D]/12 hover:text-[#FF7A99]"
              }`}
            >
              {chip}
            </button>
          );
        })}
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

function monthsError(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (!/^\d+$/.test(t)) return "숫자만 적어 주세요";
  const n = Number(t);
  if (n < MONTHS_MIN || n > MONTHS_MAX) {
    return `${MONTHS_MIN}~${MONTHS_MAX}개월 사이로 적어 주세요`;
  }
  return null;
}

function formatSolarYmd(y: string, m: string, d: string) {
  if (!y && !m && !d) return "미입력";
  return `${y || "????"}년 ${m || "?"}월 ${d || "?"}일`;
}

function formatTimeLabel(t: string) {
  if (t === "모름" || !t.trim()) return "시간 모름";
  return t;
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
  const monthsErr = monthsError(form.monthsApart);
  const situationOk = useMemo(() => {
    return monthsParsed !== null && form.concern.trim().length > 0;
  }, [monthsParsed, form.concern]);

  const nudgeMonths = (delta: number) => {
    const cur = monthsParsed ?? 0;
    const next = Math.min(MONTHS_MAX, Math.max(MONTHS_MIN, cur + delta));
    patch({ monthsApart: String(next) });
  };

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
    <div className="pb-4">
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

      <div className="mt-5 space-y-4 px-5 pb-4">
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
            <div className="flex flex-col gap-3 pt-2">
              {GENDER_CHOICES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => patch({ gender: g })}
                  className={`min-h-[56px] rounded-[18px] text-[1.05rem] font-semibold transition active:scale-[0.99] ${
                    form.gender === g
                      ? "bg-[#E8336D] text-white shadow-[0_10px_28px_rgba(232,51,109,0.35)]"
                      : "border border-white/10 bg-white/5 text-[#D8D0D4] hover:bg-white/8"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <StickyNextBar>
              {!genderOk ? (
                <p className="mb-2 text-center text-[12px] font-semibold text-[#FF7A99]/90">
                  성별을 선택해야 다음으로 갈 수 있어요
                </p>
              ) : (
                <p className="mb-2 text-center text-[11px] text-[#6E666C]">선택됨 · 다음으로 가도 돼요</p>
              )}
              <button
                type="button"
                disabled={!genderOk}
                onClick={goNext}
                className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold disabled:cursor-not-allowed disabled:opacity-35"
              >
                다음 · 기본정보
              </button>
            </StickyNextBar>
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
                지금은 양력 기준으로 봐요 · 최근 연도가 위에 있어요
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

            <StickyNextBar>
              {!basicOk ? (
                <p className="mb-2 text-center text-[12px] font-semibold text-[#FF7A99]/90">
                  양력 생년월일을 모두 골라 주세요
                </p>
              ) : null}
              <button
                type="button"
                disabled={!basicOk}
                onClick={goNext}
                className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold disabled:cursor-not-allowed disabled:opacity-35"
              >
                다음 · 상대 정보
              </button>
            </StickyNextBar>
          </>
        ) : null}

        {step === "partner" ? (
          <>
            <div className="pt-1">
              <h2 className="text-[1.15rem] font-bold tracking-[-0.03em] text-[#F8F4F6]">
                상대를 알려 주세요
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-[#9A9098]">
                아는 만큼만 적어도 돼요. 이름은 비워 둬도 괜찮아요.
              </p>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">상대 이름</span>
              <input
                className="saju-input min-h-12 w-full rounded-[14px] px-4 text-sm"
                value={form.partnerName}
                onChange={(e) => patch({ partnerName: e.target.value })}
                placeholder="민재"
              />
              {!form.partnerName.trim() ? (
                <p className="mt-1.5 text-[11px] text-[#6E666C]">
                  비워 두면 점사에서 「상대」로 불러요
                </p>
              ) : null}
            </label>
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">상대 성별</span>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                {GENDER_CHOICES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() =>
                      patch({ partnerGender: form.partnerGender === g ? "" : g })
                    }
                    className={`min-h-12 flex-1 rounded-[16px] text-sm font-semibold transition ${
                      form.partnerGender === g
                        ? "bg-[#E8336D] text-white shadow-[0_8px_22px_rgba(232,51,109,0.3)]"
                        : "border border-white/10 bg-white/5 text-[#B8AEB4]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-[#9A9098]">상대 출생 · 양력</p>
              <p className="mb-2 text-[11px] leading-5 text-[#6E666C]">선택 · 몰라도 다음으로 갈 수 있어요</p>
              <BirthYmdSelects
                year={form.partnerBirthYear}
                month={form.partnerBirthMonth}
                day={form.partnerBirthDay}
                onYear={(partnerBirthYear) => patch({ partnerBirthYear })}
                onMonth={(partnerBirthMonth) => patch({ partnerBirthMonth })}
                onDay={(partnerBirthDay) => patch({ partnerBirthDay })}
                yearPlaceholder="년(선택)"
              />
            </div>
            <BirthTimeField
              label="상대 출생 시간"
              value={form.partnerBirthTime}
              onChange={(partnerBirthTime) => patch({ partnerBirthTime })}
              placeholder="15:00"
            />
            <StickyNextBar>
              <button
                type="button"
                onClick={goNext}
                className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold"
              >
                다음 · 상황
              </button>
            </StickyNextBar>
          </>
        ) : null}

        {step === "situation" ? (
          <>
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-[#9A9098]">
                헤어진 지 (개월)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="한 달 줄이기"
                  onClick={() => nudgeMonths(-1)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-white/12 bg-white/5 text-lg font-bold text-[#D8D0D4] transition hover:bg-white/10"
                >
                  −
                </button>
                <input
                  className="saju-input min-h-12 w-full rounded-[14px] px-4 text-center text-sm tabular-nums"
                  inputMode="numeric"
                  value={form.monthsApart}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, "");
                    patch({ monthsApart: raw });
                  }}
                  placeholder="직접 입력 · 0~120"
                  required
                  aria-invalid={Boolean(monthsErr)}
                />
                <button
                  type="button"
                  aria-label="한 달 늘리기"
                  onClick={() => nudgeMonths(1)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-white/12 bg-white/5 text-lg font-bold text-[#D8D0D4] transition hover:bg-white/10"
                >
                  +
                </button>
              </div>
              <p
                className={`mt-1.5 text-[11px] ${
                  monthsErr ? "font-semibold text-[#FF7A99]" : "text-[#6E666C]"
                }`}
              >
                {monthsErr
                  ? monthsErr
                  : form.monthsApart.trim()
                    ? `약 ${monthsParsed}개월 · ${MONTHS_MIN}~${MONTHS_MAX} 가능`
                    : "비워 두지 말고, 대략이라도 적어 주세요 (기본값 없음)"}
              </p>
            </div>
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
                value={form.breakupNote}
                label="감정 칩 · 한 번 탭하면 채워져요"
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
                value={form.concern}
                label="마음 프롬프트 · 탭해서 채우기"
                onPick={(text) => patch({ concern: text.slice(0, CONCERN_MAX) })}
              />
              <p className="mt-1 text-right text-[10px] text-[#6E666C]">
                {form.concern.length}/{CONCERN_MAX}
              </p>
            </label>
            <StickyNextBar>
              {!situationOk ? (
                <p className="mb-2 text-center text-[12px] font-semibold text-[#FF7A99]/90">
                  {!form.monthsApart.trim() || monthsErr
                    ? "헤어진 개월 수를 0~120으로 적어 주세요"
                    : "궁금한 것을 적어 주세요"}
                </p>
              ) : null}
              <button
                type="button"
                disabled={!situationOk}
                onClick={goNext}
                className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold disabled:cursor-not-allowed disabled:opacity-35"
              >
                다음 · 확인
              </button>
            </StickyNextBar>
          </>
        ) : null}

        {step === "confirm" ? (
          <>
            <div className="space-y-3">
              <div className="saju-card-elevated rounded-[20px] px-4 py-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold tracking-[0.1em] text-[#FF7A99]">나</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[#B8AEB4]">
                    양력
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#F4F0F2]">
                  {form.displayName || "호칭 미입력"} · {form.gender || "성별 미선택"}
                </p>
                <p className="mt-1.5 text-[13px] leading-6 text-[#D8D0D4]">
                  {formatSolarYmd(form.birthYear, form.birthMonth, form.birthDay)}
                  <span className="mx-1.5 text-[#6E666C]">·</span>
                  <span
                    className={
                      form.birthTime === "모름" || !form.birthTime.trim()
                        ? "font-semibold text-[#FF7A99]/85"
                        : undefined
                    }
                  >
                    {formatTimeLabel(form.birthTime)}
                  </span>
                  {form.birthPlace ? (
                    <>
                      <span className="mx-1.5 text-[#6E666C]">·</span>
                      {form.birthPlace}
                    </>
                  ) : null}
                </p>
              </div>

              <div className="saju-card-elevated rounded-[20px] px-4 py-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold tracking-[0.1em] text-[#FF7A99]">상대</span>
                  {form.partnerBirthYear ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[#B8AEB4]">
                      양력
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[#6E666C]">
                      생일 일부 미입력
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-[#F4F0F2]">
                  {form.partnerName || "이름 미입력 (상대)"}
                  {form.partnerGender ? ` · ${form.partnerGender}` : ""}
                </p>
                <p className="mt-1.5 text-[13px] leading-6 text-[#D8D0D4]">
                  {form.partnerBirthYear
                    ? formatSolarYmd(
                        form.partnerBirthYear,
                        form.partnerBirthMonth,
                        form.partnerBirthDay,
                      )
                    : "생일 미입력"}
                  {form.partnerBirthTime === "모름" || form.partnerBirthTime.trim() ? (
                    <>
                      <span className="mx-1.5 text-[#6E666C]">·</span>
                      <span
                        className={
                          form.partnerBirthTime === "모름"
                            ? "font-semibold text-[#FF7A99]/85"
                            : undefined
                        }
                      >
                        {formatTimeLabel(form.partnerBirthTime)}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>

              <div className="saju-card-elevated rounded-[20px] px-4 py-4">
                <div className="mb-2 text-[11px] font-bold tracking-[0.1em] text-[#FF7A99]">상황</div>
                <p className="text-[13px] leading-6 text-[#D8D0D4]">
                  헤어진 지{" "}
                  <span className="font-semibold text-[#F4F0F2]">
                    {form.monthsApart || "?"}개월
                  </span>
                  {form.breakupNote ? (
                    <>
                      <span className="mx-1.5 text-[#6E666C]">·</span>
                      {form.breakupNote}
                    </>
                  ) : null}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#F4F0F2]">
                  <span className="text-[#9A9098]">궁금한 것 · </span>
                  {form.concern || "—"}
                </p>
              </div>
            </div>
            <p className="text-center text-[11px] leading-5 text-[#9A9098]">{scopeLine}</p>
            <StickyNextBar>
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
                className="mt-2 flex min-h-11 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-[#B8AEB4]"
              >
                처음부터 수정
              </button>
            </StickyNextBar>
          </>
        ) : null}
      </div>
    </div>
  );
}
