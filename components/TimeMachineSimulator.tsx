"use client";

import {
  type ComponentType,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  Bitcoin,
  Building2,
  ChevronLeft,
  Coffee,
  Cpu,
  Flame,
  Gem,
  House,
  Landmark,
  Rocket,
  ShoppingBag,
  Sparkles,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";

import {
  LIVE_ASSETS,
  type AssetCatalogItem,
  type CurrencyCode,
  type HistoricalSeriesResponse,
  type MarketDataTicker,
  type Ticker,
} from "@/lib/market-data";

type Step = 1 | 2 | 3;

interface PresetOption {
  amount: number;
  icon: ComponentType<{ className?: string }>;
  id: string;
  label: string;
  subtitle: string;
}

interface AnimatedNumberProps {
  className?: string;
  formatter: (value: number) => string;
  value: number;
}

interface RacePoint {
  elapsedYears: number;
  fullDate: string;
  goldValue: number;
  label: string;
  monthIndex: number;
  selectedDrawdownPct: number;
  selectedValue: number;
  spyValue: number;
}

interface RaceBundle {
  eurKrw: HistoricalSeriesResponse;
  gold: HistoricalSeriesResponse;
  selected: HistoricalSeriesResponse;
  spy: HistoricalSeriesResponse;
  usdKrw: HistoricalSeriesResponse;
}

interface TextInputFieldProps {
  description: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  suffix?: string;
  value: string;
}

interface ValuePoint {
  date: string;
  value: number;
}

interface ValueSeries {
  daily: ValuePoint[];
  monthly: ValuePoint[];
}

interface VisualDefinition {
  color: string;
  glow: string;
  icon: ComponentType<{ className?: string }>;
}

interface DisplayAsset extends AssetCatalogItem, VisualDefinition {}

const TOTAL_DURATION_MS = 30_000;
const INFLATION_RATE = 0.03;
const DEFAULT_PRINCIPAL = 10_000_000;
const MAX_PRINCIPAL = 10_000_000_000;
const numberFormatter = new Intl.NumberFormat("ko-KR");

const PRESET_OPTIONS: PresetOption[] = [
  { amount: 15_000_000, icon: Coffee, id: "coffee", label: "매일 마신 커피값", subtitle: "1,500만 원" },
  { amount: 50_000_000, icon: Banknote, id: "grandeur", label: "신형 그랜저", subtitle: "5,000만 원" },
  { amount: 300_000_000, icon: House, id: "deposit", label: "전세 보증금", subtitle: "3억 원" },
];

const DEFAULT_VISUAL: VisualDefinition = {
  color: "#8fb4ff",
  glow: "rgba(143,180,255,0.24)",
  icon: TrendingUp,
};

const VISUALS: Partial<Record<Ticker, VisualDefinition>> = {
  "000660": { color: "#ff7a92", glow: "rgba(255,122,146,0.28)", icon: Cpu },
  "005930": { color: "#7fd3ff", glow: "rgba(127,211,255,0.28)", icon: Cpu },
  AAPL: { color: "#d8e4ff", glow: "rgba(216,228,255,0.28)", icon: ShoppingBag },
  AMZN: { color: "#ffb570", glow: "rgba(255,181,112,0.28)", icon: ShoppingBag },
  ASML: { color: "#78d8ff", glow: "rgba(120,216,255,0.32)", icon: Sparkles },
  BTC: { color: "#ffb14a", glow: "rgba(255,177,74,0.28)", icon: Bitcoin },
  GLD: { color: "#f5d06f", glow: "rgba(245,208,111,0.28)", icon: Gem },
  LVMH: { color: "#f4e5bc", glow: "rgba(244,229,188,0.22)", icon: Gem },
  MSFT: { color: "#88ffe7", glow: "rgba(136,255,231,0.28)", icon: Landmark },
  NVDA: { color: "#8ef59a", glow: "rgba(142,245,154,0.32)", icon: Cpu },
  PLTR: { color: "#d19cff", glow: "rgba(209,156,255,0.30)", icon: Flame },
  QQQ: { color: "#6ab8ff", glow: "rgba(106,184,255,0.28)", icon: BarChart3 },
  SPY: { color: "#55dcff", glow: "rgba(85,220,255,0.28)", icon: TrendingUp },
  TSLA: { color: "#ff9b7c", glow: "rgba(255,155,124,0.32)", icon: Rocket },
};

const ASSET_OPTIONS: DisplayAsset[] = LIVE_ASSETS.map((asset) => ({
  ...asset,
  ...(VISUALS[asset.ticker] ?? DEFAULT_VISUAL),
}));

const ASSET_MAP = Object.fromEntries(
  ASSET_OPTIONS.map((asset) => [asset.ticker, asset]),
) as Record<Ticker, DisplayAsset>;

const ASSET_GROUPS = [
  { label: "지능 폭발", items: ["NVDA", "TSLA", "ASML", "PLTR"] as Ticker[] },
  { label: "일상 지배", items: ["AAPL", "MSFT", "AMZN", "LVMH"] as Ticker[] },
  { label: "시장/헷지", items: ["SPY", "QQQ", "GLD", "BTC"] as Ticker[] },
  { label: "한국인 대조군", items: ["005930", "000660"] as Ticker[] },
];

const pageVariants = {
  center: { opacity: 1, x: 0 },
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 48 : -48 }),
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -48 : 48 }),
};

function parseMoneyInput(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Math.min(Number(digits), MAX_PRINCIPAL);
}

function formatMoneyInput(value: string | number) {
  const numeric = typeof value === "number" ? value : parseMoneyInput(value);
  if (!numeric) return "";
  return numberFormatter.format(Math.min(numeric, MAX_PRINCIPAL));
}

function formatKoreanCurrency(value: number) {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const absolute = Math.abs(rounded);
  if (absolute < 10_000) return `${sign}${numberFormatter.format(absolute)}원`;

  const eok = Math.floor(absolute / 100_000_000);
  const man = Math.floor((absolute % 100_000_000) / 10_000);
  const parts: string[] = [];

  if (eok > 0) {
    parts.push(`${numberFormatter.format(eok)}억`);
  }
  if (man > 0) {
    parts.push(`${numberFormatter.format(man)}만`);
  }
  if (parts.length === 0) {
    parts.push(numberFormatter.format(absolute));
  }

  return `${sign}${parts.join(" ")} 원`;
}

function formatAxisCurrency(value: number) {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  if (absolute >= 100_000_000) {
    return `${sign}${(absolute / 100_000_000).toFixed(1).replace(/\\.0$/, "")}억`;
  }
  if (absolute >= 10_000) {
    return `${sign}${Math.round(absolute / 10_000)}만`;
  }
  return `${sign}${Math.round(absolute)}`;
}

function formatNativePrice(value: number, currency: CurrencyCode) {
  return new Intl.NumberFormat("ko-KR", {
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatDateDots(date: Date | string) {
  const baseDate = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  return `${baseDate.getFullYear()}.${String(baseDate.getMonth() + 1).padStart(2, "0")}.${String(baseDate.getDate()).padStart(2, "0")}`;
}

function formatMonthLabel(dateString: string) {
  const [year, month] = dateString.split("-");
  return `${year}.${month}`;
}

function getDateAnchor() {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setFullYear(endDate.getFullYear() - 10);

  return {
    endDate,
    endLabel: formatDateDots(endDate),
    endParam: [
      endDate.getFullYear(),
      String(endDate.getMonth() + 1).padStart(2, "0"),
      String(endDate.getDate()).padStart(2, "0"),
    ].join("-"),
    startDate,
    startLabel: formatDateDots(startDate),
    startParam: [
      startDate.getFullYear(),
      String(startDate.getMonth() + 1).padStart(2, "0"),
      String(startDate.getDate()).padStart(2, "0"),
    ].join("-"),
  };
}

function getElapsedYears(startDate: string, currentDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const current = new Date(`${currentDate}T00:00:00`);
  const diffMs = current.getTime() - start.getTime();
  return Math.max(0, diffMs / (365.25 * 24 * 60 * 60 * 1000));
}

function getPointOnOrBefore<T extends { date: string }>(points: T[], targetDate: string) {
  if (!points.length) return null;

  let left = 0;
  let right = points.length - 1;
  let bestIndex = -1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const middleDate = points[middle]!.date;

    if (middleDate <= targetDate) {
      bestIndex = middle;
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  if (bestIndex === -1) {
    return points[0] ?? null;
  }

  return points[bestIndex] ?? null;
}

function getFxSeries(currency: CurrencyCode, bundle: RaceBundle) {
  if (currency === "USD") return bundle.usdKrw;
  if (currency === "EUR") return bundle.eurKrw;
  return null;
}

function buildValueSeries(
  series: HistoricalSeriesResponse,
  principalKrw: number,
  fxSeries: HistoricalSeriesResponse | null,
): ValueSeries {
  const startFx = fxSeries
    ? (getPointOnOrBefore(fxSeries.daily, series.stats.firstDate)?.close ?? fxSeries.stats.firstClose)
    : 1;

  const convertPoint = (date: string, close: number) => {
    const fxRate = fxSeries
      ? (getPointOnOrBefore(fxSeries.daily, date)?.close ?? fxSeries.stats.lastClose)
      : 1;

    return {
      date,
      value: principalKrw * (close / series.stats.firstClose) * (fxRate / startFx),
    };
  };

  return {
    daily: series.daily.map((point) => convertPoint(point.date, point.close)),
    monthly: series.monthly.map((point) => convertPoint(point.date, point.close)),
  };
}

function buildRacePoints(bundle: RaceBundle, principalKrw: number) {
  const selectedFx = getFxSeries(bundle.selected.meta.currency, bundle);
  const spyFx = getFxSeries(bundle.spy.meta.currency, bundle);
  const goldFx = getFxSeries(bundle.gold.meta.currency, bundle);

  const selectedValues = buildValueSeries(bundle.selected, principalKrw, selectedFx);
  const spyValues = buildValueSeries(bundle.spy, principalKrw, spyFx);
  const goldValues = buildValueSeries(bundle.gold, principalKrw, goldFx);

  let runningPeak = bundle.selected.stats.firstClose;

  return bundle.selected.monthly.flatMap((selectedPoint, index) => {
    const selectedValuePoint = getPointOnOrBefore(selectedValues.monthly, selectedPoint.date);
    const spyValuePoint = getPointOnOrBefore(spyValues.monthly, selectedPoint.date);
    const goldValuePoint = getPointOnOrBefore(goldValues.monthly, selectedPoint.date);

    if (!selectedValuePoint || !spyValuePoint || !goldValuePoint) {
      return [];
    }

    runningPeak = Math.max(runningPeak, selectedPoint.close);
    const selectedDrawdownPct = (selectedPoint.close / runningPeak - 1) * 100;

    return [
      {
        elapsedYears: getElapsedYears(bundle.selected.stats.firstDate, selectedPoint.date),
        fullDate: formatDateDots(selectedPoint.date),
        goldValue: goldValuePoint.value,
        label: formatMonthLabel(selectedPoint.date),
        monthIndex: index + 1,
        selectedDrawdownPct,
        selectedValue: selectedValuePoint.value,
        spyValue: spyValuePoint.value,
      } satisfies RacePoint,
    ];
  });
}

function applyInflationAdjustment(value: number, elapsedYears: number, isInflationAdjusted: boolean) {
  if (!isInflationAdjusted) return value;
  return value / Math.pow(1 + INFLATION_RATE, elapsedYears);
}

function AnimatedNumber({ className, formatter, value }: AnimatedNumberProps) {
  const motionValue = useMotionValue(value);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const unsubscribe = motionValue.on("change", (latest) => setDisplayValue(latest));
    return () => unsubscribe();
  }, [motionValue]);

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.72, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [motionValue, value]);

  return <span className={className}>{formatter(displayValue)}</span>;
}

function TextInputField({ description, label, onChange, placeholder, suffix, value }: TextInputFieldProps) {
  return (
    <label className="block rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <span className="mb-2 block text-sm font-medium tracking-[-0.02em] text-white/78">{label}</span>
      <span className="mb-4 block text-sm leading-6 text-white/50">{description}</span>
      <div className="flex items-end gap-3">
        <input
          className="min-w-0 flex-1 border-0 bg-transparent text-[2rem] font-semibold tracking-[-0.05em] text-white outline-none placeholder:text-white/18"
          inputMode="numeric"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
        {suffix ? <span className="pb-2 text-sm font-medium text-white/48">{suffix}</span> : null}
      </div>
    </label>
  );
}

function RaceChart({
  data,
  goldColor,
  selectedColor,
  spyColor,
}: {
  data: RacePoint[];
  goldColor: string;
  selectedColor: string;
  spyColor: string;
}) {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <LineChart data={data} margin={{ bottom: 18, left: 10, right: 12, top: 12 }}>
        <defs>
          <linearGradient id="selectedGlow" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={selectedColor} stopOpacity={0.36} />
            <stop offset="100%" stopColor={selectedColor} stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="spyGlow" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={spyColor} stopOpacity={0.32} />
            <stop offset="100%" stopColor={spyColor} stopOpacity={0.08} />
          </linearGradient>
          <linearGradient id="goldGlow" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={goldColor} stopOpacity={0.28} />
            <stop offset="100%" stopColor={goldColor} stopOpacity={0.06} />
          </linearGradient>
        </defs>
        <XAxis
          axisLine={false}
          dataKey="label"
          interval="preserveStartEnd"
          minTickGap={24}
          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
          tickLine={false}
          tickMargin={10}
        />
        <YAxis
          axisLine={false}
          domain={[(minValue: number) => Math.max(0, minValue * 0.86), (maxValue: number) => maxValue * 1.08]}
          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
          tickFormatter={(value: number) => formatAxisCurrency(value)}
          tickLine={false}
          tickMargin={8}
          width={58}
        />
        <Line dataKey="goldValue" dot={false} isAnimationActive={false} stroke="url(#goldGlow)" strokeLinecap="round" strokeWidth={8} type="monotone" />
        <Line dataKey="spyValue" dot={false} isAnimationActive={false} stroke="url(#spyGlow)" strokeLinecap="round" strokeWidth={9} type="monotone" />
        <Line dataKey="selectedValue" dot={false} isAnimationActive={false} stroke="url(#selectedGlow)" strokeLinecap="round" strokeWidth={11} type="monotone" />
        <Line dataKey="goldValue" dot={false} isAnimationActive={false} stroke={goldColor} strokeLinecap="round" strokeWidth={2.25} type="monotone" />
        <Line dataKey="spyValue" dot={false} isAnimationActive={false} stroke={spyColor} strokeLinecap="round" strokeWidth={2.75} type="monotone" />
        <Line dataKey="selectedValue" dot={false} isAnimationActive={false} stroke={selectedColor} strokeLinecap="round" strokeWidth={3.5} type="monotone" />
      </LineChart>
    </ResponsiveContainer>
  );
}

async function requestHistoricalSeries(ticker: MarketDataTicker, start: string, end: string) {
  const url = new URL("/api/historical", window.location.origin);
  url.searchParams.set("ticker", ticker);
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);

  const response = await fetch(url.toString(), { cache: "no-store" });
  const payload = (await response.json()) as HistoricalSeriesResponse | { error?: string };

  if (!response.ok) {
    throw new Error("error" in payload && payload.error ? payload.error : "실데이터를 불러오지 못했어요.");
  }

  return payload as HistoricalSeriesResponse;
}

export default function TimeMachineSimulator() {
  const dateAnchor = useMemo(() => getDateAnchor(), []);
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [principalInput, setPrincipalInput] = useState(formatMoneyInput(DEFAULT_PRINCIPAL));
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<Ticker | null>("NVDA");
  const [raceBundle, setRaceBundle] = useState<RaceBundle | null>(null);
  const [isRaceLoading, setIsRaceLoading] = useState(false);
  const [raceError, setRaceError] = useState("");
  const [isRacing, setIsRacing] = useState(true);
  const [visibleCount, setVisibleCount] = useState(1);
  const [raceVersion, setRaceVersion] = useState(0);
  const [shareMessage, setShareMessage] = useState("");
  const [panicFlash, setPanicFlash] = useState(false);
  const [panicMessage, setPanicMessage] = useState("");
  const [isInflationAdjusted, setIsInflationAdjusted] = useState(false);

  const visibleCountRef = useRef(1);
  const lastPanicLabelRef = useRef("");
  const panicTimerRef = useRef<number | null>(null);

  const principalValue = useMemo(() => parseMoneyInput(principalInput), [principalInput]);
  const selectedAsset = selectedTicker ? ASSET_MAP[selectedTicker] : null;

  useEffect(() => {
    return () => {
      if (panicTimerRef.current) {
        window.clearTimeout(panicTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (step !== 3 || !selectedTicker) return;

    let isCancelled = false;

    async function loadRaceBundle() {
      const selectedTickerValue = selectedTicker;
      if (!selectedTickerValue) return;

      setIsRaceLoading(true);
      setRaceError("");
      setRaceBundle(null);
      setIsRacing(true);
      setVisibleCount(1);
      visibleCountRef.current = 1;
      setShareMessage("");
      setIsInflationAdjusted(false);

      try {
        const requestTickers = [
          selectedTickerValue,
          "SPY",
          "GLD",
          "USDKRW",
          "EURKRW",
        ] as const;

        const uniqueTickers = [...new Set(requestTickers)];
        const results = await Promise.all(
          uniqueTickers.map(async (ticker) => [
            ticker,
            await requestHistoricalSeries(ticker, dateAnchor.startParam, dateAnchor.endParam),
          ]),
        );

        if (isCancelled) return;

        const resultMap = Object.fromEntries(results) as Record<(typeof uniqueTickers)[number], HistoricalSeriesResponse>;
        setRaceBundle({
          eurKrw: resultMap.EURKRW,
          gold: resultMap.GLD,
          selected: resultMap[selectedTickerValue],
          spy: resultMap.SPY,
          usdKrw: resultMap.USDKRW,
        });
      } catch (error) {
        if (isCancelled) return;
        setRaceError(error instanceof Error ? error.message : "실데이터를 불러오는 중 문제가 생겼어요.");
        setIsRacing(false);
      } finally {
        if (!isCancelled) {
          setIsRaceLoading(false);
        }
      }
    }

    void loadRaceBundle();

    return () => {
      isCancelled = true;
    };
  }, [dateAnchor.endParam, dateAnchor.startParam, selectedTicker, step]);

  const raceData = useMemo(() => {
    if (!raceBundle || principalValue <= 0) {
      return [] as RacePoint[];
    }

    return buildRacePoints(raceBundle, principalValue);
  }, [principalValue, raceBundle]);

  useEffect(() => {
    if (step !== 3 || !raceData.length || isRaceLoading || raceError) {
      return;
    }

    if (!isRacing) {
      visibleCountRef.current = raceData.length;
      setVisibleCount(raceData.length);
      return;
    }

    visibleCountRef.current = 1;
    setVisibleCount(1);
    lastPanicLabelRef.current = "";
    setPanicFlash(false);
    setPanicMessage("");

    const intervalMs = Math.max(120, Math.round(TOTAL_DURATION_MS / raceData.length));
    const timer = window.setInterval(() => {
      const nextCount = visibleCountRef.current + 1;
      visibleCountRef.current = nextCount;

      if (nextCount >= raceData.length) {
        setVisibleCount(raceData.length);
        setIsRacing(false);
        window.clearInterval(timer);
        return;
      }

      setVisibleCount(nextCount);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isRaceLoading, isRacing, raceData, raceError, raceVersion, step]);

  const displayedRaceData = useMemo(
    () =>
      raceData.map((point) => ({
        ...point,
        goldValue: applyInflationAdjustment(point.goldValue, point.elapsedYears, isInflationAdjusted),
        selectedValue: applyInflationAdjustment(point.selectedValue, point.elapsedYears, isInflationAdjusted),
        spyValue: applyInflationAdjustment(point.spyValue, point.elapsedYears, isInflationAdjusted),
      })),
    [isInflationAdjusted, raceData],
  );

  const visibleRaceData = useMemo(
    () => displayedRaceData.slice(0, Math.max(1, visibleCount)),
    [displayedRaceData, visibleCount],
  );

  const currentPoint = visibleRaceData[visibleRaceData.length - 1] ?? null;
  const finalPoint = displayedRaceData[displayedRaceData.length - 1] ?? null;
  const selectedSeries = raceBundle?.selected ?? null;
  const hasShortHistory = selectedSeries ? selectedSeries.meta.resolvedStartDate > dateAnchor.startParam : false;
  const selectedProfit = finalPoint ? finalPoint.selectedValue - principalValue : 0;
  const spyGap = finalPoint ? finalPoint.selectedValue - finalPoint.spyValue : 0;
  const goldGap = finalPoint ? finalPoint.selectedValue - finalPoint.goldValue : 0;
  const resultReturn = principalValue > 0 && finalPoint ? (selectedProfit / principalValue) * 100 : 0;
  const deepestDrawdown = selectedSeries?.stats.maxDrawdownPct ?? 0;

  useEffect(() => {
    if (!isRacing || !currentPoint) {
      return;
    }

    if (currentPoint.selectedDrawdownPct > -20 || currentPoint.label === lastPanicLabelRef.current) {
      return;
    }

    lastPanicLabelRef.current = currentPoint.label;
    setPanicFlash(true);

    const warning =
      currentPoint.selectedDrawdownPct <= -45
        ? "자산이 반 토막 가까이 빠졌어요. 여기서 팔면 회복 구간은 지나가 버려요."
        : "지금은 견디기 가장 어려운 구간이에요. 숫자보다 마음이 먼저 흔들릴 수 있어요.";

    setPanicMessage(warning);

    if (panicTimerRef.current) {
      window.clearTimeout(panicTimerRef.current);
    }

    panicTimerRef.current = window.setTimeout(() => {
      setPanicFlash(false);
      setPanicMessage("");
    }, 1_200);
  }, [currentPoint, isRacing]);

  const receiptLead = useMemo(() => {
    if (!selectedAsset || !finalPoint || !selectedSeries) return "";
    return `${selectedSeries.meta.resolvedStartDate}에 ${selectedAsset.displayName}에 ${formatKoreanCurrency(principalValue)}을 묻어두었다면, ${selectedSeries.meta.resolvedEndDate} 기준 ${formatKoreanCurrency(finalPoint.selectedValue)}이 됐어요.`;
  }, [finalPoint, principalValue, selectedAsset, selectedSeries]);

  const currentProfit = currentPoint ? currentPoint.selectedValue - principalValue : 0;

  function handleBackStep() {
    setDirection(-1);
    setShareMessage("");
    setStep((previousStep) => (previousStep === 1 ? 1 : ((previousStep - 1) as Step)));
  }

  function handleNextStep() {
    if (principalValue <= 0) return;
    setDirection(1);
    setStep(2);
  }

  function startRace() {
    if (!selectedTicker) return;
    setDirection(1);
    setShareMessage("");
    setStep(3);
    setRaceVersion((previous) => previous + 1);
  }

  function replayRace() {
    if (!raceData.length) return;
    setIsInflationAdjusted(false);
    setIsRacing(true);
    setRaceVersion((previous) => previous + 1);
  }

  function retryRace() {
    if (!selectedTicker) return;
    setRaceVersion((previous) => previous + 1);
    setStep(3);
  }

  function skipRace() {
    if (!raceData.length) return;
    visibleCountRef.current = raceData.length;
    setVisibleCount(raceData.length);
    setPanicFlash(false);
    setPanicMessage("");
    setIsRacing(false);
  }

  async function handleShare() {
    if (!selectedAsset || !finalPoint || !selectedSeries) return;

    const shareText = [
      `${selectedSeries.meta.resolvedStartDate}에 ${selectedAsset.displayName}에 ${formatKoreanCurrency(principalValue)}을 넣었다면`,
      `${selectedSeries.meta.resolvedEndDate}에는 ${formatKoreanCurrency(finalPoint.selectedValue)}이 됐어요.`,
      `S&P 500과의 차이는 ${formatKoreanCurrency(spyGap)}예요.`,
      "아직 남은 10년은 RegretZero에서 먼저 살펴보세요.",
    ].join(" ");

    try {
      const shareNavigator = navigator as Navigator & {
        clipboard?: Clipboard;
        share?: (data: ShareData) => Promise<void>;
      };

      if (typeof shareNavigator.share === "function") {
        await shareNavigator.share({ text: shareText, title: "RegretZero" });
      } else if (shareNavigator.clipboard) {
        await shareNavigator.clipboard.writeText(shareText);
      } else {
        throw new Error("공유 기능을 사용할 수 없어요.");
      }

      setShareMessage("공유 문구를 준비했어요.");
    } catch {
      setShareMessage("공유를 취소했어요.");
    }
  }

  const fixedAction =
    step === 1
      ? { disabled: principalValue <= 0, icon: ArrowRight, label: "다음으로", onClick: handleNextStep }
      : step === 2
        ? { disabled: !selectedTicker, icon: Rocket, label: "🚀 10년 전 오늘로 돌아가기", onClick: startRace }
        : step === 3 && raceError
          ? { disabled: false, icon: ArrowRight, label: "다시 불러오기", onClick: retryRace }
          : step === 3 && isRacing
            ? { disabled: raceData.length === 0, icon: ArrowRight, label: "스킵 ⏭️", onClick: skipRace }
            : step === 3 && !isRacing
              ? { disabled: !selectedAsset || !finalPoint, icon: BarChart3, label: "🧾 나의 후회 영수증 발급 (공유하기)", onClick: () => { void handleShare(); } }
              : null;

  const FixedActionIcon = fixedAction?.icon;

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-[#0a0a0a] text-white" style={{ wordBreak: "keep-all" }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(68,151,255,0.16),transparent_34%),radial-gradient(circle_at_80%_100%,rgba(133,255,143,0.12),transparent_28%)]" />

      <AnimatePresence>
        {panicFlash ? (
          <motion.div
            animate={{ opacity: [0, 1, 0.45, 0] }}
            className="pointer-events-none absolute inset-0 z-30 border border-red-400/70 shadow-[0_0_0_1px_rgba(248,113,113,0.5),0_0_90px_rgba(248,113,113,0.24)_inset]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          />
        ) : null}
      </AnimatePresence>

      <header className="shrink-0 p-4">
        <div className="mx-auto flex w-full max-w-[480px] items-center justify-between">
          <button
            className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/78 transition ${step === 1 ? "pointer-events-none opacity-0" : "opacity-100"}`}
            onClick={handleBackStep}
            type="button"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <Image
            alt="RegretZero"
            className="h-8 w-auto object-contain"
            height={32}
            priority
            src="/image/Regretzero.png"
            width={150}
          />
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/56">
            Step {step}/3
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="mx-auto w-full max-w-[480px]">
          <AnimatePresence custom={direction} mode="wait">
            {step === 1 ? (
              <motion.div
                key="step-1"
                animate="center"
                className="px-5 pb-8"
                custom={direction}
                exit="exit"
                initial="enter"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                variants={pageVariants}
              >
                <div className="mt-8 flex flex-col items-center text-center">
                  <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/62">
                    <Flame className="h-3.5 w-3.5 text-[#ffb347]" />
                    오늘 기준 10년 전으로 돌아가요
                  </span>
                  <h1 className="max-w-[10ch] text-[2.35rem] font-semibold leading-[1.06] tracking-[-0.07em] text-white">
                    10년 전 오늘,
                    <br />
                    얼마를 묻어둘까요?
                  </h1>
                  <p className="mt-4 max-w-[28ch] text-sm leading-6 text-white/55">
                    지난 10년의 흐름을 보고, 남은 10년을 준비할 기준을 찾아요.
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  <TextInputField
                    description="오늘 기준 10년 전, 이 돈을 그대로 자산에 넣었다고 가정해요."
                    label="초기 원금"
                    onChange={(value) => {
                      setPrincipalInput(formatMoneyInput(value));
                      setSelectedPresetId(null);
                    }}
                    placeholder="예: 10,000,000"
                    suffix="원"
                    value={principalInput}
                  />

                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/74">
                      <Banknote className="h-4 w-4 text-[#7ee0ff]" />
                      일상의 기회비용
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {PRESET_OPTIONS.map((preset) => {
                        const Icon = preset.icon;
                        const isActive = selectedPresetId === preset.id;

                        return (
                          <button
                            key={preset.id}
                            className={`inline-flex min-h-14 items-center gap-3 rounded-full border px-4 py-3 text-left transition ${isActive ? "border-[#7ee0ff]/50 bg-[#7ee0ff]/14 shadow-[0_14px_32px_rgba(25,146,255,0.18)]" : "border-white/10 bg-black/20 hover:border-white/16 hover:bg-white/[0.06]"}`}
                            onClick={() => {
                              setPrincipalInput(formatMoneyInput(preset.amount));
                              setSelectedPresetId(preset.id);
                            }}
                            type="button"
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08]">
                              <Icon className="h-4.5 w-4.5 text-white/82" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{preset.label}</div>
                              <div className="text-xs text-white/50">{preset.subtitle}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
            {step === 2 ? (
              <motion.div
                key="step-2"
                animate="center"
                className="px-5 pb-8"
                custom={direction}
                exit="exit"
                initial="enter"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                variants={pageVariants}
              >
                <div className="pb-4 pt-5">
                  <h2 className="text-[2rem] font-semibold leading-[1.08] tracking-[-0.06em] text-white">
                    어떤 자산을
                    <br />
                    타고 갈까요?
                  </h2>
                  <p className="mt-3 max-w-[28ch] text-sm leading-6 text-white/55">
                    실제 일봉 데이터를 기준으로, 지난 10년이 가장 강하게 말해주는 자산만 남겼어요.
                  </p>
                </div>

                <div className="space-y-5 pr-1">
                  {ASSET_GROUPS.map((group) => (
                    <div key={group.label}>
                      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/38">
                        {group.label}
                      </div>
                      <div className="space-y-3">
                        {group.items.map((ticker) => {
                          const asset = ASSET_MAP[ticker];
                          const Icon = asset.icon;
                          const isActive = selectedTicker === ticker;

                          return (
                            <button
                              key={ticker}
                              className={`w-full rounded-[26px] border px-4 py-4 text-left transition ${isActive ? "border-white/18 bg-white/[0.11] shadow-[0_20px_44px_rgba(0,0,0,0.24)]" : "border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.06]"}`}
                              onClick={() => setSelectedTicker(ticker)}
                              type="button"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10" style={{ backgroundColor: asset.glow }}>
                                  <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <div className="text-base font-semibold tracking-[-0.03em] text-white">
                                        {asset.displayName}
                                      </div>
                                      <div className="mt-1 text-xs text-white/42">{asset.ticker}</div>
                                    </div>
                                    <div className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ backgroundColor: `${asset.color}18`, color: asset.color }}>
                                      {asset.fact}
                                    </div>
                                  </div>
                                  <div className="mt-3 text-sm leading-6 text-white/56">{asset.description}</div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.02] px-4 py-4 text-sm leading-6 text-white/48">
                    <div className="flex items-center gap-2 text-white/68">
                      <Building2 className="h-4 w-4 text-[#92ffcb]" />
                      서울 강남 아파트 실거래 데이터 버전은 현재 정교화 중이에요.
                    </div>
                    <div className="mt-2">v1에서는 실제 일봉 데이터가 안정적인 자산만 먼저 공개해요.</div>
                  </div>
                </div>
              </motion.div>
            ) : null}
            {step === 3 ? (
              <motion.div
                key="step-3"
                animate="center"
                className="px-5 pb-8"
                custom={direction}
                exit="exit"
                initial="enter"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                variants={pageVariants}
              >
                <div className="pb-4 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/38">Time Machine Racing</div>
                      <h2 className="mt-2 text-[1.72rem] font-semibold leading-[1.1] tracking-[-0.06em] text-white">
                        {dateAnchor.startLabel}부터
                        <br />
                        {dateAnchor.endLabel}까지
                      </h2>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/58">
                      {selectedAsset?.displayName ?? "선택 자산"}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/35">현재 연도 / 월</div>
                      <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">
                        {currentPoint?.label ?? "레이스 준비 중"}
                      </div>
                      <div className="mt-1 text-xs text-white/42">
                        {currentPoint?.fullDate ?? dateAnchor.startLabel}
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/35">현재 수익금</div>
                      <AnimatedNumber
                        className="mt-2 block text-lg font-semibold tracking-[-0.04em] text-white"
                        formatter={formatKoreanCurrency}
                        value={currentProfit}
                      />
                      <div className="mt-1 text-xs text-white/42">원화 환산 기준</div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 backdrop-blur-xl">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-white/35">실데이터 레이싱 차트</div>
                        <div className="mt-1 text-sm text-white/50">
                          실제 일봉 데이터를 월별 체크포인트로 압축해 재생해요. 차트는 초기 원금이 지금 얼마가 됐는지 원화 기준으로 비교해요.
                        </div>
                        <div className="mt-2 text-[11px] text-white/38">
                          Y축: 투자 가치(원화 환산) · X축: 시간(년/월)
                        </div>
                        {hasShortHistory ? (
                          <div className="mt-2 text-[11px] text-[#ffbe96]">
                            이 자산은 10년 전체 이력이 없어 {selectedSeries?.meta.resolvedStartDate}부터의 실제 데이터만 재생해요.
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ backgroundColor: `${selectedAsset?.color ?? "#82f7cc"}18`, color: selectedAsset?.color ?? "#82f7cc" }}>
                          {selectedAsset?.ticker ?? "ASSET"}
                        </span>
                        <span className="rounded-full bg-[#56dcff14] px-2.5 py-1 text-[11px] font-medium text-[#56dcff]">S&amp;P 500</span>
                        <span className="rounded-full bg-[#f5d06f14] px-2.5 py-1 text-[11px] font-medium text-[#f5d06f]">Gold</span>
                      </div>
                    </div>

                    <div className="relative h-[400px] w-full shrink-0 md:h-[520px]">
                      {isRaceLoading ? (
                        <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-white/12 bg-black/20 text-sm text-white/46">
                          10년 실데이터를 불러오는 중이에요...
                        </div>
                      ) : raceError ? (
                        <div className="flex h-full flex-col items-center justify-center rounded-[24px] border border-dashed border-red-400/20 bg-[#170607] px-6 text-center">
                          <TriangleAlert className="h-6 w-6 text-red-300" />
                          <div className="mt-4 text-base font-semibold text-white">현재 데이터 공급이 불안정해요</div>
                          <div className="mt-2 text-sm leading-6 text-white/52">{raceError}</div>
                        </div>
                      ) : (
                        <>
                          <RaceChart
                            data={visibleRaceData}
                            goldColor="#f5d06f"
                            selectedColor={selectedAsset?.color ?? "#82f7cc"}
                            spyColor="#56dcff"
                          />
                          <AnimatePresence>
                            {panicMessage ? (
                              <motion.div
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute left-3 top-3 max-w-[74%] rounded-2xl border border-red-400/30 bg-[#200708]/90 px-4 py-3 text-sm font-medium leading-6 text-red-100 shadow-[0_20px_50px_rgba(123,19,19,0.3)]"
                                exit={{ opacity: 0, y: -10 }}
                                initial={{ opacity: 0, y: -10 }}
                              >
                                <div className="flex items-start gap-2">
                                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                                  <span>{panicMessage}</span>
                                </div>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </>
                      )}
                    </div>

                    {isRacing || isRaceLoading || raceError ? null : (
                      <motion.div animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3" initial={{ opacity: 0, y: 16 }}>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${isInflationAdjusted ? "border-[#ff9c6e]/35 bg-[#ff9c6e]/12 text-[#ffbe96]" : "border-white/10 bg-white/[0.04] text-white/58"}`}
                            onClick={() => setIsInflationAdjusted((previous) => !previous)}
                            type="button"
                          >
                            <Flame className="h-3.5 w-3.5" />
                            🔥 인플레이션 반영 (실질 구매력)
                          </button>
                          <button
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/60"
                            onClick={replayRace}
                            type="button"
                          >
                            다시 보기
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">10년 전 가격 → 현재 가격</div>
                            <div className="mt-2 text-base font-semibold tracking-[-0.04em] text-white">
                              {selectedSeries ? formatNativePrice(selectedSeries.stats.firstClose, selectedSeries.meta.currency) : "—"}
                              <span className="mx-2 text-white/28">→</span>
                              {selectedSeries ? formatNativePrice(selectedSeries.stats.lastClose, selectedSeries.meta.currency) : "—"}
                            </div>
                            <div className="mt-1 text-xs text-white/48">
                              {selectedSeries?.meta.priceBasis === "adjusted_close" ? "실제 일봉 수정종가 기준" : "실제 일봉 종가 기준"}
                            </div>
                          </div>

                          <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">수익금 요약</div>
                            <div className="mt-2 text-base font-semibold tracking-[-0.04em] text-white">{formatKoreanCurrency(selectedProfit)}</div>
                            <div className="mt-1 text-xs text-white/48">
                              총 수익률 {formatPercent(resultReturn)}
                              {isInflationAdjusted ? " · 실질 구매력 반영" : " · 명목 기준"}
                            </div>
                          </div>

                          <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">S&amp;P 500 비교</div>
                            <div className="mt-2 text-base font-semibold tracking-[-0.04em] text-white">{formatKoreanCurrency(spyGap)}</div>
                            <div className="mt-1 text-xs text-white/48">같은 돈을 SPY에 넣었을 때와 벌어진 차이</div>
                          </div>

                          <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Gold 비교</div>
                            <div className="mt-2 text-base font-semibold tracking-[-0.04em] text-white">{formatKoreanCurrency(goldGap)}</div>
                            <div className="mt-1 text-xs text-white/48">같은 돈을 금에 넣었을 때와 벌어진 차이</div>
                          </div>

                          <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">최대 낙폭</div>
                            <div className="mt-2 text-base font-semibold tracking-[-0.04em] text-white">{formatPercent(deepestDrawdown)}</div>
                            <div className="mt-1 text-xs text-white/48">
                              실제 일봉 기준 가장 깊었던 하락 시점: {selectedSeries?.stats.maxDrawdownDate ?? "—"}
                            </div>
                          </div>

                          <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">데이터 기준</div>
                            <div className="mt-2 text-sm leading-6 text-white/62">
                              {selectedSeries ? `${selectedSeries.meta.provider} · ${selectedSeries.meta.resolvedStartDate} ~ ${selectedSeries.meta.resolvedEndDate}` : "—"}
                            </div>
                            <div className="mt-1 text-xs text-white/48">벤치마크 비교는 실제 일봉 데이터와 원화 환산 기준으로 계산했어요.</div>
                          </div>
                        </div>

                        <div className="rounded-[20px] border border-white/8 bg-black/20 p-4 text-sm leading-7 text-white/58">
                          {receiptLead}
                        </div>

                        {shareMessage ? <div className="text-center text-xs text-white/45">{shareMessage}</div> : null}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      {fixedAction && FixedActionIcon ? (
        <div className="shrink-0 fixed bottom-0 left-0 z-50 w-full bg-gradient-to-t from-black to-transparent p-4">
          <div className="mx-auto max-w-[480px]">
            <button
              className={`flex w-full items-center justify-center gap-2 rounded-[24px] px-5 py-4 text-base font-semibold tracking-[-0.03em] transition ${fixedAction.disabled ? "cursor-not-allowed bg-white/[0.08] text-white/32" : "bg-[#7ee0ff] text-[#04101a] shadow-[0_20px_60px_rgba(126,224,255,0.28)]"}`}
              disabled={fixedAction.disabled}
              onClick={fixedAction.onClick}
              type="button"
            >
              <FixedActionIcon className="h-4 w-4" />
              {fixedAction.label}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
