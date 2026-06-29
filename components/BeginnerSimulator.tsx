"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useMotionValueEvent, useSpring } from "framer-motion";
import type { RacePoint } from "@/components/SimulationChart";

interface AnimatedNumberProps {
  className?: string;
  formatter: (value: number) => string;
  value: number;
}

interface InputFieldProps {
  helperText: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  suffix: string;
  value: string;
}

interface AssetBoard {
  accent: string;
  gain: number;
  label: string;
  value: number;
}

const MAX_INITIAL_CAPITAL = 10_000_000_000;
const MAX_MONTHLY_SAVING = 5_000_000;
const MAX_DURATION_YEARS = 30;
const INFLATION_RATE = 0.03;
const SP500_REFERENCE_RETURN = 0.12;
const RACE_MONTHS = 120;

const SimulationChart = dynamic(() => import("@/components/SimulationChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-end gap-3 overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
      <div className="h-[18%] flex-1 rounded-t-full bg-[#9aa7b7]/18" />
      <div className="h-[42%] flex-1 rounded-t-full bg-[#ffd66e]/18" />
      <div className="h-[76%] flex-1 rounded-t-full bg-[#4cdcff]/24" />
      <div className="h-[88%] flex-1 rounded-t-full bg-[#ff5ea8]/28" />
    </div>
  ),
});

const numberFormatter = new Intl.NumberFormat("ko-KR");

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatNumberInput(value: number) {
  return numberFormatter.format(Math.max(0, Math.round(value)));
}

function formatKoreanCurrency(value: number) {
  const amount = Math.max(0, Math.round(value));

  if (amount === 0) {
    return "0원";
  }

  const units = [
    { label: "조", value: 1_0000_0000_0000 },
    { label: "억", value: 1_0000_0000 },
    { label: "만", value: 1_0000 },
  ];

  let remainder = amount;
  const parts: string[] = [];

  for (const unit of units) {
    const unitAmount = Math.floor(remainder / unit.value);

    if (unitAmount > 0) {
      parts.push(`${numberFormatter.format(unitAmount)}${unit.label}`);
      remainder %= unit.value;
    }
  }

  if (parts.length === 0 || amount < 10_000) {
    parts.push(`${numberFormatter.format(remainder)}원`);
  } else {
    parts.push("원");
  }

  return parts.join(" ");
}

function formatCompactCurrency(value: number) {
  if (value >= 1_0000_0000_0000) {
    return `${(value / 1_0000_0000_0000).toFixed(1)}조`;
  }

  if (value >= 1_0000_0000) {
    return `${(value / 1_0000_0000).toFixed(value >= 10_0000_0000 ? 0 : 1)}억`;
  }

  if (value >= 1_0000) {
    return `${Math.round(value / 1_0000)}만`;
  }

  return formatNumberInput(value);
}

function parseMoneyInput(value: string, max: number) {
  const digits = parseDigits(value);

  if (!digits) {
    return 0;
  }

  return clamp(Number(digits), 0, max);
}

function parseYearInput(value: string) {
  const digits = parseDigits(value);

  if (!digits) {
    return 1;
  }

  return clamp(Number(digits), 1, MAX_DURATION_YEARS);
}

function formatMoneyField(value: string, max: number) {
  const digits = parseDigits(value);

  if (!digits) {
    return "";
  }

  return formatNumberInput(clamp(Number(digits), 0, max));
}

function formatYearField(value: string) {
  const digits = parseDigits(value);

  if (!digits) {
    return "";
  }

  return String(clamp(Number(digits), 1, MAX_DURATION_YEARS));
}

function calculateCashProjection(
  initialCapital: number,
  monthlySaving: number,
  years: number,
) {
  const nominalValue = initialCapital + monthlySaving * 12 * years;
  return nominalValue / (1 + INFLATION_RATE) ** years;
}

function calculateCompoundProjection(
  initialCapital: number,
  monthlySaving: number,
  years: number,
  annualReturn: number,
) {
  const annualContribution = monthlySaving * 12;
  const growthFactor = (1 + annualReturn) ** years;

  return (
    initialCapital * growthFactor +
    annualContribution * ((growthFactor - 1) / annualReturn)
  );
}

function createMockRacingData(initialCapital: number, monthlySaving: number, startYear: number) {
  const monthlyInflation = (1 + INFLATION_RATE) ** (1 / 12) - 1;
  const points: RacePoint[] = [];
  let cashNominal = initialCapital;
  let tsla = initialCapital;
  let sp500 = initialCapital;
  let gold = initialCapital;

  for (let month = 1; month <= RACE_MONTHS; month += 1) {
    const cashContribution = monthlySaving;
    const tslaContribution = monthlySaving;
    const spContribution = monthlySaving;
    const goldContribution = monthlySaving;

    const tslaReturn = clamp(
      0.028 +
        Math.sin(month / 2.5) * 0.105 +
        Math.cos(month / 5.9) * 0.045 -
        Math.pow(Math.max(0, Math.sin(month / 8.4 + 0.6)), 8) * 0.26 -
        Math.pow(Math.max(0, Math.sin(month / 17.5 + 1.4)), 12) * 0.18,
      -0.32,
      0.34,
    );

    const spReturn = clamp(
      0.0105 +
        Math.sin(month / 4.4) * 0.028 +
        Math.cos(month / 10.1) * 0.012 -
        Math.pow(Math.max(0, Math.sin(month / 13.2 + 0.3)), 8) * 0.12,
      -0.14,
      0.08,
    );

    const goldReturn = clamp(
      0.0054 +
        Math.sin(month / 6.2) * 0.014 +
        Math.cos(month / 15.4) * 0.009 -
        Math.pow(Math.max(0, Math.sin(month / 18.2 + 1.1)), 10) * 0.055,
      -0.05,
      0.045,
    );

    cashNominal += cashContribution;
    tsla = (tsla + tslaContribution) * (1 + tslaReturn);
    sp500 = (sp500 + spContribution) * (1 + spReturn);
    gold = (gold + goldContribution) * (1 + goldReturn);

    points.push({
      cash: cashNominal / (1 + monthlyInflation) ** month,
      gold,
      month,
      sp500,
      tsla,
      year: startYear + Math.floor((month - 1) / 12),
    });
  }

  return points;
}

function AnimatedNumber({ value, formatter, className }: AnimatedNumberProps) {
  const spring = useSpring(value, {
    stiffness: 120,
    damping: 24,
    mass: 0.8,
  });
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useMotionValueEvent(spring, "change", (latest) => {
    setDisplayValue(Math.round(latest));
  });

  return <span className={className}>{formatter(displayValue)}</span>;
}

function InputField({
  id,
  label,
  helperText,
  value,
  onChange,
  placeholder,
  suffix,
}: InputFieldProps) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur">
      <label className="block text-[1rem] font-semibold text-white/92" htmlFor={id}>
        {label}
      </label>
      <p className="mt-2 text-sm leading-6 text-white/58">{helperText}</p>
      <div className="relative mt-4">
        <input
          className="w-full rounded-[20px] border border-white/12 bg-[#07111a]/88 px-4 py-4 pr-14 text-lg font-semibold text-white outline-none transition placeholder:text-white/22 focus:border-[#4cdcff]/55"
          id={id}
          inputMode="numeric"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-white/36">
          {suffix}
        </span>
      </div>
    </div>
  );
}

export default function BeginnerSimulator() {
  const raceSectionRef = useRef<HTMLDivElement | null>(null);
  const currentYear = new Date().getFullYear();
  const raceStartYear = currentYear - 10;

  const [initialCapitalInput, setInitialCapitalInput] = useState("10,000,000");
  const [monthlySavingInput, setMonthlySavingInput] = useState("300,000");
  const [durationYearsInput, setDurationYearsInput] = useState("10");
  const [isRaceVisible, setIsRaceVisible] = useState(false);
  const [raceStep, setRaceStep] = useState(0);
  const [raceRunId, setRaceRunId] = useState(0);

  const initialCapital = parseMoneyInput(initialCapitalInput, MAX_INITIAL_CAPITAL);
  const monthlySaving = parseMoneyInput(monthlySavingInput, MAX_MONTHLY_SAVING);
  const durationYears = parseYearInput(durationYearsInput);

  const projectionCash = useMemo(
    () => calculateCashProjection(initialCapital, monthlySaving, durationYears),
    [durationYears, initialCapital, monthlySaving],
  );
  const projectionSp500 = useMemo(
    () =>
      calculateCompoundProjection(
        initialCapital,
        monthlySaving,
        durationYears,
        SP500_REFERENCE_RETURN,
      ),
    [durationYears, initialCapital, monthlySaving],
  );

  const racingData = useMemo(
    () => createMockRacingData(initialCapital, monthlySaving, raceStartYear),
    [initialCapital, monthlySaving, raceStartYear],
  );

  const visibleData = racingData.slice(0, Math.max(raceStep, 0));
  const currentPoint = visibleData[visibleData.length - 1] ?? racingData[0];
  const investedSoFar = initialCapital + monthlySaving * (currentPoint?.month ?? 0);

  const boardValues: AssetBoard[] = currentPoint
    ? [
        {
          accent: "from-[#ff5ea8] to-[#ff8b5d]",
          gain: currentPoint.tsla - investedSoFar,
          label: "테슬라 TSLA",
          value: currentPoint.tsla,
        },
        {
          accent: "from-[#4cdcff] to-[#63b4ff]",
          gain: currentPoint.sp500 - investedSoFar,
          label: "S&P 500",
          value: currentPoint.sp500,
        },
        {
          accent: "from-[#ffd66e] to-[#ffb357]",
          gain: currentPoint.gold - investedSoFar,
          label: "금 Gold",
          value: currentPoint.gold,
        },
        {
          accent: "from-[#9aa7b7] to-[#ff8f8f]",
          gain: currentPoint.cash - investedSoFar,
          label: "은행 현금",
          value: currentPoint.cash,
        },
      ]
    : [];

  const bestBoard = boardValues.reduce<AssetBoard | null>((best, current) => {
    if (!best || current.gain > best.gain) {
      return current;
    }

    return best;
  }, null);

  useEffect(() => {
    if (!isRaceVisible || raceStep <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setRaceStep((previous) => {
        if (previous >= racingData.length) {
          window.clearInterval(interval);
          return previous;
        }

        return previous + 1;
      });
    }, 80);

    return () => window.clearInterval(interval);
  }, [isRaceVisible, raceRunId, raceStep, racingData.length]);

  const handleRaceStart = () => {
    setIsRaceVisible(true);
    setRaceStep(1);
    setRaceRunId((previous) => previous + 1);

    requestAnimationFrame(() => {
      raceSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-[#07111a] px-4 py-5 text-white shadow-[0_40px_120px_rgba(0,0,0,0.35)] [word-break:keep-all] sm:px-6 sm:py-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(76,220,255,0.18),_transparent_34%),radial-gradient(circle_at_80%_16%,_rgba(255,214,110,0.16),_transparent_24%),radial-gradient(circle_at_18%_74%,_rgba(255,94,168,0.14),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(7,17,26,0.98))]" />
      <div className="pointer-events-none absolute left-[-4rem] top-16 h-60 w-60 rounded-full bg-[#4cdcff]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-3rem] top-24 h-60 w-60 rounded-full bg-[#ff5ea8]/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4cdcff] shadow-[0_0_18px_rgba(76,220,255,0.85)]" />
            <span className="text-sm font-semibold tracking-[0.18em] text-white/70 uppercase">
              Regret Zero
            </span>
          </div>
          <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold text-white/62">
            2016년부터 10년 레이스
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <div className="space-y-5">
            <div className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[#ffd66e] uppercase">
              10Y Return Racing
            </div>

            <div className="space-y-4">
              <h1 className="max-w-[15ch] font-[family-name:var(--font-display)] text-[2.55rem] leading-[0.94] tracking-[-0.045em] sm:text-[3.75rem]">
                10년 전 엔비디아에
                <br />
                1,000만 원을 묻어두었다면
                <br />
                지금 얼마일까요?
              </h1>
              <p className="max-w-[34rem] text-[1rem] leading-7 text-white/70 sm:text-[1.05rem]">
                이제는 진부한 경고 대신, 숫자가 직접 말하게 해요. 입력은
                쉽고, 차트는 빠르고, 결과는 냉정하게 보여줘요.
              </p>
            </div>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.3)] sm:p-6"
              initial={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <p className="text-sm font-semibold tracking-[0.12em] text-[#4cdcff] uppercase">
                Quick Reality Check
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/8 bg-[#08111a]/80 p-4">
                  <p className="text-sm font-semibold text-white/72">
                    {durationYears}년 동안 은행에 두면
                  </p>
                  <div className="mt-3 text-[1.15rem] font-bold leading-8 text-[#ff9f9f] sm:text-[1.4rem]">
                    <AnimatedNumber
                      formatter={formatKoreanCurrency}
                      value={projectionCash}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/42">
                    연 3% 물가상승을 반영한 실질 구매력 기준이에요.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/8 bg-[#08111a]/80 p-4">
                  <p className="text-sm font-semibold text-white/72">
                    같은 시간을 S&amp;P 500처럼 굴리면
                  </p>
                  <div className="mt-3 text-[1.15rem] font-bold leading-8 text-[#7ee3ff] sm:text-[1.4rem]">
                    <AnimatedNumber
                      formatter={formatKoreanCurrency}
                      value={projectionSp500}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    S&amp;P 500 과거 10년 수익률 12% 기준 단순 복리 모델이에요.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="space-y-4">
            <InputField
              helperText="현재 은행 예금에 가만히 방치되어 있는 여유 자금을 입력해 주세요."
              id="initialCapital"
              label="은행에 잠자는 내 돈 (초기 자본금)"
              onChange={(value) => setInitialCapitalInput(formatMoneyField(value, MAX_INITIAL_CAPITAL))}
              placeholder="예: 10,000,000"
              suffix="원"
              value={initialCapitalInput}
            />

            <InputField
              helperText="커피값, 외식비 등을 아껴 매달 '적금처럼' 추가로 투자할 수 있는 금액이에요. 이 작은 돈이 복리 엔진의 핵심 연료가 돼요."
              id="monthlySaving"
              label="매월 아낄 수 있는 돈 (월 적립금)"
              onChange={(value) => setMonthlySavingInput(formatMoneyField(value, MAX_MONTHLY_SAVING))}
              placeholder="예: 300,000"
              suffix="원"
              value={monthlySavingInput}
            />

            <InputField
              helperText="돈을 빼지 않고 묻어둘 수 있는 시간이에요. 복리(Compound Interest)는 이자에 이자가 붙어 눈덩이처럼 불어나는 구조예요. 시간이 길수록 힘이 커져요."
              id="durationYears"
              label="기다릴 수 있는 시간 (투자 기간)"
              onChange={(value) => setDurationYearsInput(formatYearField(value))}
              placeholder="예: 10"
              suffix="년"
              value={durationYearsInput}
            />
          </div>
        </div>

        <div className="mt-6">
          <motion.button
            className="inline-flex min-h-14 w-full items-center justify-center rounded-[24px] border border-[#ffe19d]/24 bg-[linear-gradient(135deg,#ffd66e_0%,#ff8b5d_44%,#4cdcff_100%)] px-5 text-center text-[1rem] font-extrabold leading-6 text-[#07111a] shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
            onClick={handleRaceStart}
            transition={{ duration: 0.2, ease: "easeOut" }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
          >
            내 돈 녹아내리는 것 막기 (10년 전으로 돌아가기)
          </motion.button>
        </div>

        <AnimatePresence initial={false}>
          {isRaceVisible ? (
            <motion.section
              animate={{ height: "auto", opacity: 1, marginTop: 24 }}
              className="overflow-hidden"
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              ref={raceSectionRef}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 shadow-[0_30px_100px_rgba(0,0,0,0.3)] sm:p-6">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold tracking-[0.12em] text-[#ffd66e] uppercase">
                      Racing Chart
                    </p>
                    <h2 className="mt-2 font-[family-name:var(--font-display)] text-[2rem] leading-[0.98] tracking-[-0.035em] sm:text-[2.7rem]">
                      같은 돈, 다른 자산,
                      <br />
                      완전히 다른 결말.
                    </h2>
                    <p className="mt-3 max-w-[36rem] text-sm leading-6 text-white/60">
                      아래 레이스는 지난 10년을 닮은 가상 월별 데이터를 순차적으로
                      재생해요. 테슬라는 크게 흔들리고, S&amp;P 500은
                      꾸준히 올라가며, 금은 느리지만 버텨요.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-[#07111a]/80 px-4 py-3 text-left shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
                    <p className="text-xs font-semibold tracking-[0.16em] text-[#4cdcff] uppercase">
                      전광판
                    </p>
                    <div className="mt-2 text-[2rem] font-black leading-none text-white sm:text-[2.5rem]">
                      {currentPoint?.year ?? raceStartYear}년
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white/56">
                      현재 기준 최대 수익금
                    </p>
                    <div className="mt-2 text-lg font-bold text-[#ffd66e] sm:text-xl">
                      <AnimatedNumber
                        formatter={formatKoreanCurrency}
                        value={Math.max(bestBoard?.gain ?? 0, 0)}
                      />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/46">
                      {bestBoard?.label ?? "레이스 대기 중"}가 가장 앞서 달리는
                      중이에요.
                    </p>
                  </div>
                </div>

                <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#ff5ea8_0%,#ffd66e_48%,#4cdcff_100%)]"
                    style={{
                      width: `${(Math.max(raceStep, 1) / racingData.length) * 100}%`,
                    }}
                  />
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="h-[360px] rounded-[30px] border border-white/8 bg-[#07111a]/84 p-4 sm:h-[430px]">
                    <SimulationChart
                      currentMonth={currentPoint?.month ?? 1}
                      data={visibleData.length > 0 ? visibleData : racingData.slice(0, 1)}
                      formatAxisCurrency={formatCompactCurrency}
                      formatCurrency={formatKoreanCurrency}
                      startYear={raceStartYear}
                    />
                  </div>

                  <div className="grid gap-4">
                    {boardValues.map((asset) => (
                      <div
                        key={asset.label}
                        className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`h-3 w-3 rounded-full bg-gradient-to-r ${asset.accent}`}
                            />
                            <span className="text-sm font-semibold text-white/84">
                              {asset.label}
                            </span>
                          </div>
                          <span
                            className={`rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold ${
                              asset.gain >= 0 ? "text-[#7fe3ff]" : "text-[#ff9f9f]"
                            }`}
                          >
                            {asset.gain >= 0 ? "+" : ""}
                            {formatCompactCurrency(asset.gain)}
                          </span>
                        </div>
                        <div className="mt-3 text-[1.15rem] font-bold text-white sm:text-[1.35rem]">
                          <AnimatedNumber
                            formatter={formatKoreanCurrency}
                            value={asset.value}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
