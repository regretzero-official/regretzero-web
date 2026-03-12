"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock3, Play, RotateCcw, Search, Sparkles, Zap } from "lucide-react";
import {
  ASSETS,
  CURRENT_YEAR,
  DEFAULT_ASSET,
  FUTURE_END_YEAR,
  generateTimeSeries,
  KRW_INITIAL,
  MONTHS_REGRET,
  START_YEAR,
  TOTAL_MONTHS,
  type Asset,
  type ChartPoint,
} from "../src/data/assets";
import ImpactItems from "../src/components/ImpactItems";
import FutureScenarioChart from "../src/components/FutureScenarioChart";
import RaceChart from "../src/components/RacingChart";
import { formatCompactKrw, formatKrw, formatKrwMainUsdSub } from "../src/lib/formatters";
import {
  ASSET_CLASS_LABELS,
  ASSET_CLASS_REASONS,
  DEFAULT_ALLOCATIONS,
  buildActionPlan,
  simulateFutureScenarios,
  type ScenarioKey,
  type RiskProfile,
} from "../src/lib/futureScenarios";

type Phase = "SEARCH" | "RACING" | "RESULT";
type Mode = "REGRET" | "SINGULARITY";
type PricePoint = { ts: number; price: number };
type UniverseCategory = "ALL" | "CRYPTO" | "US_STOCK" | "KR_STOCK" | "ETF";
type FutureStep = 1 | 2 | 3;

type TimelineEvent = {
  from: number;
  to: number;
  title: string;
  situation: string;
  emotion: string;
  lesson: string;
};

const BASE_RACE_DURATION_MS = 60_000;
const SPEED_OPTIONS = [1, 2] as const;
const GOLD_TICKER = "GLD";
const FX_CACHE_KEY = "regretzero.fx.usdkrw";
const FX_FALLBACK = 1350;
const CONTROL_HEIGHT = "h-12";
const CONTROL_RADIUS = "rounded-2xl";
const CONTROL_BORDER = "border border-white/10";
const HERO_TICKERS = ["BTC", "NVDA", "TSLA", "005930.KS"] as const;
const QUICK_CHIPS = [
  { label: "500만", value: 5_000_000 },
  { label: "1,000만", value: 10_000_000 },
  { label: "3,000만", value: 30_000_000 },
  { label: "1억", value: 100_000_000 },
] as const;
const FUTURE_SCENARIO_LABELS: Record<ScenarioKey, string> = {
  conservative: "보수",
  base: "기준",
  aggressive: "공격",
};

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    from: 2016,
    to: 2018,
    title: "유동성 랠리",
    situation: "성장 자산 선호가 강해지며 상승 속도가 빨라졌습니다.",
    emotion: "남들은 다 벌고 있는 것 같아 조급해집니다.",
    lesson: "흥분할수록 추격 매수보다 원칙이 중요합니다.",
  },
  {
    from: 2018,
    to: 2020,
    title: "긴축 불안",
    situation: "금리와 거시 변수 우려로 조정이 깊어졌습니다.",
    emotion: "지금이라도 팔아야 할 것 같은 공포가 커집니다.",
    lesson: "공포 구간에서 계획 없는 매매는 수익률을 훼손합니다.",
  },
  {
    from: 2020,
    to: 2021.5,
    title: "팬데믹 쇼크",
    situation: "급락 이후 대규모 유동성으로 강한 반등이 나왔습니다.",
    emotion: "가장 무서울 때 행동하는 것이 가장 어렵습니다.",
    lesson: "복리는 공포를 버틴 사람에게 유리합니다.",
  },
  {
    from: 2021.5,
    to: 2023,
    title: "금리 충격",
    situation: "고평가 성장주 중심으로 변동성이 크게 확대됐습니다.",
    emotion: "이미 늦었다는 생각과 포기하고 싶은 마음이 커집니다.",
    lesson: "장기 투자자는 중간의 통증도 견뎌야 합니다.",
  },
  {
    from: 2023,
    to: 2026.2,
    title: "AI 랠리",
    situation: "AI 인프라 중심으로 자금 쏠림이 강해졌습니다.",
    emotion: "같은 시장에서도 격차가 벌어지는 체감이 커집니다.",
    lesson: "앞으로의 10년은 구조적 변화의 수혜 축을 읽는 사람이 유리합니다.",
  },
];

const HERO_NAME_MAP: Record<string, { title: string; subtitle: string }> = {
  BTC: { title: "비트코인", subtitle: "BTC" },
  NVDA: { title: "엔비디아", subtitle: "NVDA" },
  TSLA: { title: "테슬라", subtitle: "TSLA" },
  "005930.KS": { title: "삼성전자", subtitle: "005930.KS" },
};

const CATEGORY_LABELS: Record<UniverseCategory, string> = {
  ALL: "전체",
  CRYPTO: "코인",
  US_STOCK: "미국주식",
  KR_STOCK: "국내주식",
  ETF: "ETF",
};

function toDateLabel(yearFloat: number) {
  const year = Math.floor(yearFloat);
  const month = Math.max(1, Math.min(12, Math.floor((yearFloat - year) * 12) + 1));
  return `${year}.${String(month).padStart(2, "0")}`;
}

function toKrw(value: number, currency: string, fxRate: number) {
  if (!Number.isFinite(value)) return 0;
  return currency === "KRW" ? value : value * fxRate;
}

function toUsdSub(value: number, currency: string, fxRate: number) {
  if (!Number.isFinite(value) || fxRate <= 0) return null;
  return currency === "USD" ? value : value / fxRate;
}

function toYahooSymbol(ticker: string) {
  if (ticker.endsWith("-USD")) return ticker;
  const cryptoSymbols = new Set([
    "BTC","ETH","SOL","XRP","ADA","DOGE","BNB","AVAX","DOT","LINK","MATIC","TRX","LTC","BCH","ATOM","NEAR","UNI","FIL","AAVE","SUI","APT",
  ]);
  if (cryptoSymbols.has(ticker.toUpperCase())) return `${ticker.toUpperCase()}-USD`;
  return ticker;
}

function getCurrentEvent(year: number) {
  return TIMELINE_EVENTS.find((event) => year >= event.from && year < event.to) ?? TIMELINE_EVENTS[TIMELINE_EVENTS.length - 1];
}

function countFortyPercentDrawdowns(series: ChartPoint[]) {
  if (series.length < 2) return 0;
  let peak = series[0].asset;
  let inDrawdown = false;
  let count = 0;
  for (const point of series) {
    if (point.asset > peak) {
      peak = point.asset;
      inDrawdown = false;
      continue;
    }
    if (peak <= 0) continue;
    const drawdown = (peak - point.asset) / peak;
    if (drawdown >= 0.4 && !inDrawdown) {
      count += 1;
      inDrawdown = true;
    } else if (drawdown < 0.4 && inDrawdown) {
      inDrawdown = false;
    }
  }
  return count;
}

function interpolatePrice(points: PricePoint[], month: number) {
  if (points.length < 2) return null;
  const clamped = Math.max(0, Math.min(month, MONTHS_REGRET));
  const idxFloat = (clamped / MONTHS_REGRET) * (points.length - 1);
  const low = Math.floor(idxFloat);
  const high = Math.min(low + 1, points.length - 1);
  const ratio = idxFloat - low;
  return points[low].price + (points[high].price - points[low].price) * ratio;
}

function getUniverseCategory(asset: Asset): UniverseCategory {
  if (asset.ticker.endsWith(".KS")) return "KR_STOCK";
  if (["SPY", "QQQ", "SOXX", "VTI", "VOO", "GLD", "ARKK", "SMH", "TLT", "BITO"].includes(asset.ticker)) return "ETF";
  if (/^(BTC|ETH|SOL|XRP|ADA|DOGE|BNB|AVAX|DOT|LINK|MATIC|TRX|LTC|BCH|ATOM|NEAR|UNI|FIL|AAVE|SUI|APT)$/.test(asset.ticker)) return "CRYPTO";
  return "US_STOCK";
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("SEARCH");
  const [mode, setMode] = useState<Mode>("REGRET");
  const [investmentAmount, setInvestmentAmount] = useState(KRW_INITIAL);
  const [investmentInput, setInvestmentInput] = useState(KRW_INITIAL.toLocaleString("en-US"));
  const [selectedTicker, setSelectedTicker] = useState<string>("NVDA");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMoreAssets, setShowMoreAssets] = useState(false);
  const [universeCategory, setUniverseCategory] = useState<UniverseCategory>("ALL");
  const [raceProgress, setRaceProgress] = useState(0);
  const [speed, setSpeed] = useState<(typeof SPEED_OPTIONS)[number]>(1);
  const speedRef = useRef(speed);
  const [fxRate, setFxRate] = useState(FX_FALLBACK);
  const [livePriceUsd, setLivePriceUsd] = useState<number | null>(null);
  const [marketCurrency, setMarketCurrency] = useState<string>("USD");
  const [livePriceAt, setLivePriceAt] = useState<string | null>(null);
  const [historicalStartUsd, setHistoricalStartUsd] = useState<number | null>(null);
  const [historicalCurrentUsd, setHistoricalCurrentUsd] = useState<number | null>(null);
  const [historicalStartAt, setHistoricalStartAt] = useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<PricePoint[]>([]);
  const [goldLiveUsd, setGoldLiveUsd] = useState<number | null>(null);
  const [goldSeries, setGoldSeries] = useState<PricePoint[]>([]);
  const [futureStep, setFutureStep] = useState<FutureStep>(1);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("BALANCED");
  const [monthlyContribution, setMonthlyContribution] = useState(500_000);
  const [futureYears, setFutureYears] = useState(10);
  const [selectedFutureScenario, setSelectedFutureScenario] = useState<ScenarioKey>("base");

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(FX_CACHE_KEY);
      if (!cached) return;
      const parsed = Number(cached);
      if (Number.isFinite(parsed) && parsed > 0) setFxRate(parsed);
    } catch {}
  }, []);

  const selectedAsset = useMemo(() => ASSETS.find((asset) => asset.ticker === selectedTicker) ?? DEFAULT_ASSET, [selectedTicker]);
  const heroAssets = useMemo(
    () => HERO_TICKERS.map((ticker) => {
      const asset = ASSETS.find((entry) => entry.ticker === ticker) ?? DEFAULT_ASSET;
      const display = HERO_NAME_MAP[ticker] ?? { title: asset.name, subtitle: asset.ticker };
      return { ...asset, display };
    }),
    [],
  );

  const universeAssets = useMemo(() => {
    const query = searchQuery.trim().toUpperCase();
    return ASSETS.filter((asset) => {
      const categoryMatch = universeCategory === "ALL" || getUniverseCategory(asset) === universeCategory;
      const queryMatch = !query || asset.ticker.toUpperCase().includes(query) || asset.name.toUpperCase().includes(query);
      return categoryMatch && queryMatch;
    }).slice(0, 60);
  }, [searchQuery, universeCategory]);

  const splitAdjustedStartUsd = useMemo(() => {
    if (historicalStartUsd && historicalCurrentUsd && livePriceUsd && historicalCurrentUsd > 0) {
      return historicalStartUsd * (livePriceUsd / historicalCurrentUsd);
    }
    return historicalStartUsd ?? selectedAsset.price10yUsd;
  }, [historicalCurrentUsd, historicalStartUsd, livePriceUsd, selectedAsset.price10yUsd]);

  const effectiveAsset = useMemo(() => {
    const currentPrice = livePriceUsd ?? historicalCurrentUsd ?? selectedAsset.currentUsd;
    return { ...selectedAsset, price10yUsd: splitAdjustedStartUsd, currentUsd: currentPrice };
  }, [historicalCurrentUsd, livePriceUsd, selectedAsset, splitAdjustedStartUsd]);

  const targetMonths = mode === "REGRET" ? MONTHS_REGRET : TOTAL_MONTHS;
  const chartSeries = useMemo(() => {
    const fallback = generateTimeSeries(effectiveAsset, mode).map((point) => {
      const multiplier = investmentAmount / KRW_INITIAL;
      return { ...point, asset: point.asset * multiplier, bank: point.bank * multiplier };
    });
    if (selectedSeries.length < 2) return fallback;

    const firstAsset = selectedSeries[0].price;
    const lastAsset = selectedSeries[selectedSeries.length - 1].price;
    const firstGold = goldSeries[0]?.price ?? 0;
    const lastGold = goldSeries[goldSeries.length - 1]?.price ?? 0;
    const monthlyFutureGrowth = 0.03 / 12;

    const points: ChartPoint[] = [];
    for (let month = 0; month <= targetMonths; month += 1) {
      const year = START_YEAR + month / 12;
      const isFuture = month > MONTHS_REGRET;
      let assetValue = investmentAmount;
      let benchmarkValue = investmentAmount;

      if (month <= MONTHS_REGRET) {
        const selectedPrice = interpolatePrice(selectedSeries, month);
        if (selectedPrice && firstAsset > 0) assetValue = investmentAmount * (selectedPrice / firstAsset);
        const goldPrice = interpolatePrice(goldSeries, month);
        if (goldPrice && firstGold > 0) benchmarkValue = investmentAmount * (goldPrice / firstGold);
      } else {
        const projectedMonths = month - MONTHS_REGRET;
        const pastAssetEnd = firstAsset > 0 ? investmentAmount * (lastAsset / firstAsset) : investmentAmount;
        const pastGoldEnd = firstGold > 0 ? investmentAmount * (lastGold / firstGold) : investmentAmount;
        assetValue = pastAssetEnd * Math.pow(1 + monthlyFutureGrowth, projectedMonths);
        benchmarkValue = pastGoldEnd * Math.pow(1 + monthlyFutureGrowth, projectedMonths);
      }

      points.push({ month, year, asset: assetValue, bank: benchmarkValue, isFuture });
    }
    return points;
  }, [effectiveAsset, goldSeries, investmentAmount, mode, selectedSeries, targetMonths]);

  const futureAllocation = useMemo(() => DEFAULT_ALLOCATIONS[riskProfile], [riskProfile]);
  const futureInputs = useMemo(
    () => ({
      initialKrw: Math.max(1_000_000, investmentAmount),
      monthlyKrw: Math.max(0, monthlyContribution),
      years: Math.max(1, Math.min(20, futureYears)),
      riskProfile,
    }),
    [futureYears, investmentAmount, monthlyContribution, riskProfile],
  );
  const futureResults = useMemo(
    () => simulateFutureScenarios(futureInputs, futureAllocation),
    [futureAllocation, futureInputs],
  );
  const selectedFutureResult = useMemo(
    () => futureResults.find((item) => item.scenario === selectedFutureScenario) ?? futureResults[1],
    [futureResults, selectedFutureScenario],
  );
  const futureActionPlan = useMemo(
    () => buildActionPlan(futureInputs, selectedFutureScenario),
    [futureInputs, selectedFutureScenario],
  );
  const futureChartData = useMemo(() => {
    if (futureResults.length !== 3) return [];
    const months = futureResults[0].path.length;
    return Array.from({ length: months }, (_, index) => ({
      year: CURRENT_YEAR + index / 12,
      conservative: futureResults[0].path[index],
      base: futureResults[1].path[index],
      aggressive: futureResults[2].path[index],
    }));
  }, [futureResults]);

  const finalPast = chartSeries[MONTHS_REGRET] ?? chartSeries[chartSeries.length - 1];
  const exampleAsset = useMemo(() => ASSETS.find((asset) => asset.ticker === "NVDA") ?? DEFAULT_ASSET, []);
  const exampleSeries = useMemo(() => generateTimeSeries(exampleAsset, "REGRET"), [exampleAsset]);
  const exampleFinal = exampleSeries[MONTHS_REGRET] ?? exampleSeries[exampleSeries.length - 1];
  const exampleValue = exampleFinal.asset;
  const exampleGap = exampleFinal.asset - exampleFinal.bank;

  useEffect(() => {
    if (phase !== "RACING" || mode === "SINGULARITY") return;
    let raf = 0;
    const startedAt = performance.now();
    const tick = () => {
      const duration = BASE_RACE_DURATION_MS / speedRef.current;
      const progress = Math.min((performance.now() - startedAt) / duration, 1);
      setRaceProgress(progress);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setPhase("RESULT"), 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, mode, selectedTicker]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function loadMarketContext() {
      setLivePriceUsd(null);
      setMarketCurrency("USD");
      setLivePriceAt(null);
      setHistoricalStartUsd(null);
      setHistoricalCurrentUsd(null);
      setHistoricalStartAt(null);
      try {
        const symbol = toYahooSymbol(selectedTicker);
        const response = await fetch(`/api/market-context?ticker=${encodeURIComponent(symbol)}&start=2016-03-01`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok || cancelled) return;
        const payload = await response.json();
        if (cancelled) return;
        if (typeof payload?.quote?.price === "number" && payload.quote.price > 0) {
          setLivePriceUsd(payload.quote.price);
          if (typeof payload?.quote?.currency === "string") {
            setMarketCurrency(payload.quote.currency.toUpperCase());
          }
          setLivePriceAt(payload.quote.asOf ?? null);
        }
        if (typeof payload?.snapshot?.startPrice === "number" && payload.snapshot.startPrice > 0) {
          setHistoricalStartUsd(payload.snapshot.startPrice);
          setHistoricalCurrentUsd(payload.snapshot.currentPrice ?? null);
          setHistoricalStartAt(payload.snapshot.startDate ?? null);
        }
        if (typeof payload?.fx?.usdKrw === "number" && payload.fx.usdKrw > 0) {
          setFxRate(payload.fx.usdKrw);
          try {
            localStorage.setItem(FX_CACHE_KEY, String(payload.fx.usdKrw));
          } catch {}
        }
      } catch {}
    }
    loadMarketContext();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedTicker]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function loadSelectedSeries() {
      setSelectedSeries([]);
      try {
        const symbol = toYahooSymbol(selectedTicker);
        const response = await fetch(`/api/history-series?ticker=${encodeURIComponent(symbol)}&start=2016-03-01`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok || cancelled) return;
        const payload = await response.json();
        if (!Array.isArray(payload?.series) || cancelled) return;
        const points = payload.series
          .filter((point: any) => typeof point?.ts === "number" && typeof point?.price === "number")
          .map((point: any) => ({ ts: point.ts, price: Number(point.price) }))
          .filter((point: PricePoint) => Number.isFinite(point.price) && point.price > 0);
        setSelectedSeries(points);
      } catch {}
    }
    loadSelectedSeries();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedTicker]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function loadGoldData() {
      try {
        const [seriesRes, quoteRes] = await Promise.all([
          fetch(`/api/history-series?ticker=${encodeURIComponent(GOLD_TICKER)}&start=2016-03-01`, {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch(`/api/quote?ticker=${encodeURIComponent(GOLD_TICKER)}`, {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);
        if (cancelled) return;
        if (seriesRes.ok) {
          const payload = await seriesRes.json();
          if (Array.isArray(payload?.series)) {
            setGoldSeries(
              payload.series
                .filter((point: any) => typeof point?.ts === "number" && typeof point?.price === "number")
                .map((point: any) => ({ ts: point.ts, price: point.price })),
            );
          }
        }
        if (quoteRes.ok) {
          const payload = await quoteRes.json();
          if (typeof payload?.price === "number" && payload.price > 0) setGoldLiveUsd(payload.price);
        }
      } catch {}
    }
    loadGoldData();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const marker = useMemo(() => {
    const floatIndex = raceProgress * targetMonths;
    const low = Math.floor(floatIndex);
    const high = Math.min(low + 1, targetMonths);
    const ratio = floatIndex - low;
    const p0 = chartSeries[low] ?? chartSeries[0];
    const p1 = chartSeries[high] ?? p0;
    return {
      month: floatIndex,
      year: p0.year + (p1.year - p0.year) * ratio,
      bank: p0.bank + (p1.bank - p0.bank) * ratio,
      asset: p0.asset + (p1.asset - p0.asset) * ratio,
      isFuture: p0.isFuture,
    };
  }, [chartSeries, raceProgress, targetMonths]);

  const simulatedPriceNowUsd = useMemo(() => {
    const multiplier = marker.asset / Math.max(investmentAmount, 1);
    return effectiveAsset.price10yUsd * multiplier;
  }, [effectiveAsset.price10yUsd, investmentAmount, marker.asset]);
  const simulatedPriceNowKrw = toKrw(simulatedPriceNowUsd, marketCurrency, fxRate);
  const simulatedPriceNowUsdSub = toUsdSub(simulatedPriceNowUsd, marketCurrency, fxRate);
  const startPriceKrw = toKrw(splitAdjustedStartUsd, marketCurrency, fxRate);
  const startPriceUsdSub = toUsdSub(splitAdjustedStartUsd, marketCurrency, fxRate);
  const livePriceKrw = toKrw(livePriceUsd ?? simulatedPriceNowUsd, marketCurrency, fxRate);
  const livePriceUsdSub = toUsdSub(livePriceUsd ?? simulatedPriceNowUsd, marketCurrency, fxRate);

  const drawdown40Count = useMemo(() => {
    const maxIndex = phase === "RESULT" ? targetMonths : Math.min(Math.floor(marker.month), targetMonths);
    return countFortyPercentDrawdowns(chartSeries.slice(0, Math.max(2, maxIndex + 1)));
  }, [chartSeries, marker.month, phase, targetMonths]);

  const valueNow = phase === "SEARCH" ? finalPast.asset : marker.asset;
  const benchNow = phase === "SEARCH" ? finalPast.bank : marker.bank;
  const gapNow = valueNow - benchNow;
  const yearsPassed = Math.max((phase === "SEARCH" ? finalPast.year : marker.year) - START_YEAR, 0.01);
  const roi = ((valueNow - investmentAmount) / investmentAmount) * 100;
  const cagr = (Math.pow(valueNow / investmentAmount, 1 / yearsPassed) - 1) * 100;
  const eventNow = getCurrentEvent(marker.year);
  const chartEvents = TIMELINE_EVENTS.map((event) => ({ year: event.from, label: event.title }));

  const applyAmount = (amount: number) => {
    const safeAmount = Math.max(1_000_000, Math.round(amount || KRW_INITIAL));
    setInvestmentAmount(safeAmount);
    setInvestmentInput(safeAmount.toLocaleString("en-US"));
  };

  const startRace = (nextMode: Mode) => {
    setMode(nextMode);
    setRaceProgress(0);
    if (nextMode === "SINGULARITY") {
      setFutureStep(1);
      setSelectedFutureScenario("base");
    }
    setPhase("RACING");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#040404] text-white">
      <div className="mx-auto w-full max-w-[460px] px-5 pb-24 pt-8">
        <AnimatePresence mode="wait">
          {phase === "SEARCH" ? (
            <motion.div key="search" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="space-y-6">
              <section className="rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(110,13,28,0.55),_transparent_38%),linear-gradient(180deg,#100b0c_0%,#050505_62%)] px-6 pb-6 pt-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-zinc-300">
                  <Sparkles className="h-3.5 w-3.5 text-[#FFD700]" />
                  10년 투자 심리 재생기
                </div>
                <div className="mt-5 space-y-3">
                  <h1 className="max-w-[12ch] text-[36px] font-black leading-[1.02] tracking-[-0.06em] text-white">
                    그때 샀다면,
                    <br />
                    지금 나는 얼마나 달라졌을까
                  </h1>
                  <p className="max-w-[28ch] text-[15px] leading-7 text-zinc-300">
                    10년 전 1,000만 원으로 비트코인, 엔비디아, 테슬라, 삼성전자를 샀다면 오늘 얼마가 됐는지 금(GLD)과 비교해 바로 확인합니다.
                  </p>
                </div>
              </section>

              <section className="rounded-[28px] border border-[#FFD700]/15 bg-[linear-gradient(180deg,rgba(255,215,0,0.08),rgba(255,215,0,0.02))] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
                <p className="text-[10px] font-black tracking-[0.2em] text-[#D7B764]">SHOCK PREVIEW</p>
                <h2 className="mt-2 text-[20px] font-black leading-tight text-white">2016년 1,000만 원을 엔비디아에 넣었다면</h2>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className={`${CONTROL_RADIUS} border border-white/10 bg-black/25 p-3`}>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-zinc-500">지금 가치</p>
                    <p className="mt-1 text-lg font-black text-white">{formatCompactKrw(exampleValue)}</p>
                  </div>
                  <div className={`${CONTROL_RADIUS} border border-[#FFD700]/20 bg-black/25 p-3`}>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-zinc-500">금(GLD) 대비</p>
                    <p className="mt-1 text-lg font-black text-[#FFD700]">{formatCompactKrw(exampleGap)}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-[30px] border border-white/10 bg-[#090909] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.34)]">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500">INVESTMENT INPUT</p>
                    <p className="mt-2 text-sm font-bold text-zinc-200">투자금</p>
                    <div className={`mt-2 flex ${CONTROL_HEIGHT} items-center ${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#111214] px-4`}>
                      <span className="mr-2 text-sm font-black text-zinc-500">₩</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={investmentInput}
                        onChange={(event) => {
                          const digits = event.target.value.replace(/[^\d]/g, "");
                          if (!digits) {
                            setInvestmentInput("");
                            setInvestmentAmount(0);
                            return;
                          }
                          const numeric = Number(digits);
                          if (!Number.isFinite(numeric)) return;
                          setInvestmentAmount(numeric);
                          setInvestmentInput(numeric.toLocaleString("en-US"));
                        }}
                        onBlur={() => applyAmount(investmentAmount)}
                        className="w-full bg-transparent text-[18px] font-black tracking-tight text-white outline-none"
                      />
                    </div>
                    <p className="mt-2 text-[12px] font-medium text-zinc-500">예: 10,000,000 / 100,000,000</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {QUICK_CHIPS.map((chip) => (
                        <button key={chip.value} onClick={() => applyAmount(chip.value)} className={`${CONTROL_HEIGHT} ${CONTROL_RADIUS} border px-3 text-[15px] font-black transition-colors ${investmentAmount === chip.value ? "border-[#E31937] bg-[#E31937] text-white" : "border-white/10 bg-white/5 text-zinc-200"}`}>
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500">REPRESENTATIVE ASSETS</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {heroAssets.map((asset) => (
                        <button key={asset.ticker} onClick={() => setSelectedTicker(asset.ticker)} className={`rounded-[22px] border p-4 text-left transition-colors ${selectedTicker === asset.ticker ? "border-[#FFD700]/45 bg-[linear-gradient(180deg,rgba(255,215,0,0.12),rgba(255,215,0,0.04))]" : "border-white/10 bg-[#111113]"}`}>
                          <p className="text-[18px] font-black leading-5 text-white">{asset.display.title}</p>
                          <p className="mt-2 text-[12px] font-bold tracking-[0.08em] text-zinc-500">{asset.display.subtitle}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button onClick={() => startRace("REGRET")} className={`${CONTROL_HEIGHT} w-full ${CONTROL_RADIUS} bg-[#E31937] px-4 text-[15px] font-black text-white`}>
                      <span className="inline-flex items-center gap-2 whitespace-nowrap"><Play className="h-4 w-4" />타임머신 시작</span>
                    </button>
                    <button onClick={() => startRace("SINGULARITY")} className={`${CONTROL_HEIGHT} w-full ${CONTROL_RADIUS} border border-[#FFD700]/40 bg-[linear-gradient(180deg,rgba(255,215,0,0.08),rgba(255,215,0,0.02))] px-4 text-[15px] font-black text-[#FFD700]`}>
                      <span className="inline-flex items-center gap-2 whitespace-nowrap"><Zap className="h-4 w-4" />앞으로의 10년 전략 보기</span>
                    </button>
                  </div>

                  <button onClick={() => setShowMoreAssets((prev) => !prev)} className={`${CONTROL_HEIGHT} w-full ${CONTROL_RADIUS} ${CONTROL_BORDER} bg-white/5 px-4 text-[15px] font-bold text-white`}>
                    전체 자산 보기
                  </button>
                </div>
              </section>

              {showMoreAssets ? (
                <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#0d0d0e_0%,#080808_100%)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.18em] text-zinc-500"><Search className="h-4 w-4" />자산 유니버스</div>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">전체 자산 중에서 직접 골라 바로 시뮬레이션을 시작할 수 있습니다.</p>
                  <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="이름 또는 티커 검색" className={`mt-4 flex ${CONTROL_HEIGHT} w-full items-center ${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#111214] px-4 text-sm font-bold text-white outline-none placeholder:text-zinc-600`} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(Object.keys(CATEGORY_LABELS) as UniverseCategory[]).map((category) => (
                      <button key={category} onClick={() => setUniverseCategory(category)} className={`h-9 rounded-full px-3 text-[12px] font-black transition-colors ${universeCategory === category ? "bg-[#FFD700] text-black" : "border border-white/10 bg-white/5 text-zinc-300"}`}>
                        {CATEGORY_LABELS[category]}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {universeAssets.map((asset) => (
                      <button key={asset.ticker} onClick={() => setSelectedTicker(asset.ticker)} className={`rounded-[22px] border p-3 text-left ${selectedTicker === asset.ticker ? "border-[#E31937]/50 bg-[#18090d]" : "border-white/10 bg-[#111113]"}`}>
                        <p className="text-[15px] font-black leading-5 text-white">{asset.name}</p>
                        <p className="mt-1 text-[11px] font-bold text-zinc-500">{asset.ticker}</p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    <button onClick={() => startRace("REGRET")} className={`${CONTROL_HEIGHT} w-full ${CONTROL_RADIUS} bg-[#E31937] px-4 text-[15px] font-black text-white`}>선택한 자산으로 시작</button>
                    <button onClick={() => startRace("SINGULARITY")} className={`${CONTROL_HEIGHT} w-full ${CONTROL_RADIUS} border border-[#FFD700]/40 bg-[linear-gradient(180deg,rgba(255,215,0,0.08),rgba(255,215,0,0.02))] px-4 text-[15px] font-black text-[#FFD700]`}>선택한 자산 미래 10년 보기</button>
                  </div>
                </section>
              ) : null}
            </motion.div>
          ) : mode === "SINGULARITY" ? (
            <motion.div key="future" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#111111_0%,#060606_100%)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.22em] text-zinc-500">앞으로의 10년 전략 보기</p>
                    <h2 className="mt-2 text-[28px] font-black leading-tight text-white">{selectedAsset.name}</h2>
                    <p className="mt-1 text-[11px] font-bold text-zinc-500">{selectedAsset.ticker}</p>
                  </div>
                  <button onClick={() => setPhase("SEARCH")} className={`h-10 rounded-full ${CONTROL_BORDER} bg-white/5 px-3 text-xs font-bold text-white`}>처음으로</button>
                </div>
                <div className="mt-4 rounded-2xl border border-[#FFD700]/25 bg-[#120F08] px-4 py-3 text-[12px] font-bold text-[#FFE39C]">
                  이 결과는 확정 예측이 아닌 시나리오 학습 도구입니다.
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((step) => (
                    <button
                      key={step}
                      onClick={() => setFutureStep(step as FutureStep)}
                      className={`h-10 rounded-xl border text-xs font-black ${futureStep === step ? "border-[#E31937] bg-[#E31937] text-white" : "border-white/10 bg-white/5 text-zinc-300"}`}
                    >
                      {step}단계
                    </button>
                  ))}
                </div>
              </section>

              {futureStep === 1 ? (
                <section className="rounded-[28px] border border-white/10 bg-[#0A0A0A] p-5">
                  <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500">1단계 · 목표 선택</p>
                  <h3 className="mt-2 text-lg font-black text-white">당신의 투자 성향을 선택하세요</h3>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {([
                      { key: "GROWTH", label: "성장", desc: "수익률 우선" },
                      { key: "BALANCED", label: "균형", desc: "리스크 균형" },
                      { key: "DEFENSIVE", label: "방어", desc: "낙폭 관리" },
                    ] as const).map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setRiskProfile(item.key)}
                        className={`rounded-2xl border p-3 text-left ${riskProfile === item.key ? "border-[#FFD700]/40 bg-[#17130A]" : "border-white/10 bg-[#111113]"}`}
                      >
                        <p className="text-base font-black text-white">{item.label}</p>
                        <p className="mt-1 text-[11px] font-bold text-zinc-500">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setFutureStep(2)} className={`${CONTROL_HEIGHT} mt-4 w-full ${CONTROL_RADIUS} bg-[#E31937] px-4 text-[15px] font-black text-white`}>다음 단계</button>
                </section>
              ) : null}

              {futureStep === 2 ? (
                <section className="rounded-[28px] border border-white/10 bg-[#0A0A0A] p-5 space-y-4">
                  <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500">2단계 · 투자 설정</p>
                  <div>
                    <p className="text-sm font-bold text-zinc-200">초기 금액</p>
                    <div className={`mt-2 flex ${CONTROL_HEIGHT} items-center ${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#111214] px-4`}>
                      <span className="mr-2 text-sm font-black text-zinc-500">₩</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={investmentAmount.toLocaleString("ko-KR")}
                        onChange={(event) => {
                          const digits = event.target.value.replace(/[^\d]/g, "");
                          setInvestmentAmount(Number(digits || 0));
                          setInvestmentInput(Number(digits || 0).toLocaleString("ko-KR"));
                        }}
                        className="w-full bg-transparent text-[18px] font-black tracking-tight text-white outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-200">월 적립금</p>
                    <div className={`mt-2 flex ${CONTROL_HEIGHT} items-center ${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#111214] px-4`}>
                      <span className="mr-2 text-sm font-black text-zinc-500">₩</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={monthlyContribution.toLocaleString("ko-KR")}
                        onChange={(event) => {
                          const digits = event.target.value.replace(/[^\d]/g, "");
                          setMonthlyContribution(Number(digits || 0));
                        }}
                        className="w-full bg-transparent text-[18px] font-black tracking-tight text-white outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-200">기간 (년)</p>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {[5, 10, 15, 20].map((year) => (
                        <button key={year} onClick={() => setFutureYears(year)} className={`h-10 rounded-xl border text-sm font-black ${futureYears === year ? "border-[#FFD700]/50 bg-[#17130A] text-[#FFD700]" : "border-white/10 bg-white/5 text-zinc-300"}`}>{year}년</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setFutureStep(3)} className={`${CONTROL_HEIGHT} w-full ${CONTROL_RADIUS} bg-[#E31937] px-4 text-[15px] font-black text-white`}>3트랙 결과 보기</button>
                </section>
              ) : null}

              {futureStep === 3 ? (
                <section className="space-y-4 pb-8">
                  <section className="rounded-[28px] border border-white/10 bg-[#0A0A0A] p-5">
                    <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500">3단계 · 10년 시나리오 결과</p>
                    <FutureScenarioChart data={futureChartData} />
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {futureResults.map((item) => (
                        <button
                          key={item.scenario}
                          onClick={() => setSelectedFutureScenario(item.scenario)}
                          className={`rounded-xl border p-3 text-left ${selectedFutureScenario === item.scenario ? "border-[#E31937]/45 bg-[#190A0E]" : "border-white/10 bg-[#111]"}`}
                        >
                          <p className="text-xs font-black text-zinc-400">{FUTURE_SCENARIO_LABELS[item.scenario]}</p>
                          <p className="mt-1 text-sm font-black text-white">{formatCompactKrw(item.terminalKrw)}</p>
                          <p className="mt-1 text-[10px] font-bold text-zinc-500">MDD {Math.round(item.maxDrawdown * 100)}%</p>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 rounded-2xl border border-[#FFD700]/25 bg-[#11100A] p-3">
                      <p className="text-[11px] font-bold text-zinc-400">기준 시나리오 중심 요약</p>
                      <p className="mt-1 text-base font-black text-[#FFD700]">{formatCompactKrw(selectedFutureResult?.terminalKrw ?? 0)}</p>
                      <p className="mt-1 text-xs text-zinc-300">
                        연복리 범위 {selectedFutureResult?.cagrRange[0].toFixed(1)}% ~ {selectedFutureResult?.cagrRange[1].toFixed(1)}% ·
                        회복기간 약 {selectedFutureResult?.recoveryMonths}개월
                      </p>
                    </div>
                  </section>

                  <section className="rounded-[28px] border border-white/10 bg-[#0A0A0A] p-5">
                    <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500">90일 액션 플랜</p>
                    <div className="mt-3 space-y-2">
                      {futureActionPlan.weeks.map((week) => (
                        <div key={week.window} className="rounded-2xl border border-white/10 bg-[#111] p-3">
                          <p className="text-xs font-black text-[#FFD700]">{week.window}</p>
                          <p className="mt-1 text-sm font-black text-white">{week.title}</p>
                          {week.rules.map((rule) => (
                            <p key={rule} className="mt-1 text-xs text-zinc-300">• {rule}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[28px] border border-white/10 bg-[#0A0A0A] p-5">
                    <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500">왜 아직 늦지 않았는가</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {(Object.keys(ASSET_CLASS_LABELS) as Array<keyof typeof ASSET_CLASS_LABELS>).map((key) => (
                        <div key={key} className="rounded-2xl border border-white/10 bg-[#111] p-3">
                          <p className="text-sm font-black text-white">{ASSET_CLASS_LABELS[key]}</p>
                          <p className="mt-1 text-[11px] leading-5 text-zinc-400">{ASSET_CLASS_REASONS[key]}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setFutureStep(1)} className={`flex ${CONTROL_HEIGHT} items-center justify-center gap-2 ${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#131313] text-sm font-bold text-white`}><RotateCcw className="h-4 w-4" />다시 설계</button>
                    <button onClick={() => setPhase("SEARCH")} className={`flex ${CONTROL_HEIGHT} items-center justify-center ${CONTROL_RADIUS} bg-[#E31937] text-sm font-bold text-white`}>다른 자산</button>
                  </div>
                </section>
              ) : null}
            </motion.div>
          ) : (
            <motion.div key="race" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#111111_0%,#060606_100%)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.22em] text-zinc-500">{mode === "REGRET" ? "과거 10년 타임머신" : "미래 10년 시뮬레이션"}</p>
                    <h2 className="mt-2 text-[28px] font-black leading-tight text-white">{selectedAsset.name}</h2>
                    <p className="mt-1 text-[11px] font-bold text-zinc-500">{selectedAsset.ticker}</p>
                  </div>
                  <button onClick={() => setPhase("SEARCH")} className={`h-10 rounded-full ${CONTROL_BORDER} bg-white/5 px-3 text-xs font-bold text-white`}>처음으로</button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className={`${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#101010] p-3`}><p className="text-[10px] text-zinc-500">시작일</p><p className="mt-1 text-sm font-black text-white">{historicalStartAt ? historicalStartAt.slice(0, 7).replace("-", ".") : "2016.03"}</p></div>
                  <div className={`${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#101010] p-3`}><p className="text-[10px] text-zinc-500">현재 재생</p><p className="mt-1 text-sm font-black text-white">{toDateLabel(marker.year)}</p></div>
                  <div className={`${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#101010] p-3`}><p className="text-[10px] text-zinc-500">종료일</p><p className="mt-1 text-sm font-black text-white">{mode === "REGRET" ? "2026.03" : `${FUTURE_END_YEAR}.03`}</p></div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className={`${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#0E0E0E] p-3`}><p className="text-[10px] text-zinc-500">시작 가격</p><p className="mt-1 text-sm font-black text-white">{formatKrwMainUsdSub(startPriceKrw, startPriceUsdSub)}</p></div>
                  <div className={`${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#0E0E0E] p-3`}><p className="text-[10px] text-zinc-500">현재 실제가</p><p className="mt-1 text-sm font-black text-white">{formatKrwMainUsdSub(livePriceKrw, livePriceUsdSub)}</p></div>
                  <div className={`${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#0E0E0E] p-3`}><p className="text-[10px] text-zinc-500">내 투자금</p><p className="mt-1 text-sm font-black text-white">{formatCompactKrw(marker.asset)}</p></div>
                  <div className={`${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#0E0E0E] p-3`}><p className="text-[10px] text-zinc-500">금(GLD) 대비</p><p className="mt-1 text-sm font-black text-[#FFD700]">{formatCompactKrw(marker.asset - marker.bank)}</p></div>
                </div>
                <div className="mt-2 rounded-xl border border-[#FFD700]/20 bg-[#12100A] p-3"><p className="text-[10px] text-zinc-500">MAX PAIN METRIC</p><p className="mt-1 text-sm font-black text-[#FFD700]">전고점 대비 -40% 이상 하락 진입: {drawdown40Count}회</p></div>
                <div className={`mt-2 flex items-center justify-between ${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#0E0E0E] p-3`}>
                  <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.15em] text-zinc-500"><Clock3 className="h-4 w-4" />재생 속도</div>
                  <div className="flex items-center gap-2">
                    {SPEED_OPTIONS.map((value) => (
                      <button key={value} onClick={() => setSpeed(value)} className={`h-9 rounded-full px-3 text-xs font-black ${speed === value ? "bg-[#FFD700] text-black" : "border border-white/10 bg-white/5 text-zinc-300"}`}>{value}x</button>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-zinc-500">{livePriceAt ? `실시간 시세 기준: ${livePriceAt} UTC` : "실시간 시세 연결 중"} | 자산 통화: {marketCurrency} | 금 현재가: {goldLiveUsd ? formatKrwMainUsdSub(goldLiveUsd * fxRate, goldLiveUsd) : "-"} | 환율: {fxRate.toFixed(2)}</p>
              </section>
              <section className="rounded-[28px] border border-white/10 bg-[#090909] p-3">
                <div className="h-[370px]">
                  <RaceChart series={chartSeries} marker={marker} mode={mode} isFinished={phase === "RESULT"} events={chartEvents} assetPriceUsd={simulatedPriceNowUsdSub ?? undefined} assetPriceKrw={simulatedPriceNowKrw} benchmarkLabel="금(GLD)" labelSafePadding={0.1} />
                </div>
              </section>
              <section className="rounded-[16px] border border-white/10 bg-[#0A0A0A] px-4 py-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-zinc-500">시작</p>
                    <p className="mt-1 text-xs font-bold text-white">2016.03</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500">현재</p>
                    <p className="mt-1 text-xs font-bold text-white">{toDateLabel(marker.year)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500">종료</p>
                    <p className="mt-1 text-xs font-bold text-white">{mode === "REGRET" ? "2026.03" : `${FUTURE_END_YEAR}.03`}</p>
                  </div>
                </div>
              </section>
              <section className="rounded-[28px] border border-white/10 bg-[#0A0A0A] p-5">
                <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500">투자 심리 레이어</p>
                <h3 className="mt-2 text-lg font-black text-white">{eventNow.title}</h3>
                <p className="mt-3 text-sm text-zinc-300">상황: {eventNow.situation}</p>
                <p className="mt-2 text-sm text-[#FFD7DF]">감정: {eventNow.emotion}</p>
                <p className="mt-2 text-sm text-[#FFE39C]">교훈: {eventNow.lesson}</p>
              </section>
              {phase === "RESULT" ? (
                <section className="space-y-4 pb-8">
                  <div className="rounded-[28px] border border-white/10 bg-[#0A0A0A] p-5">
                    <h3 className="text-xl font-black text-white">결과 요약</h3>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className={`${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#111] p-3`}><p className="text-[10px] text-zinc-500">선택 자산</p><p className="mt-1 text-lg font-black text-white">{formatCompactKrw(valueNow)}</p></div>
                      <div className={`${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#111] p-3`}><p className="text-[10px] text-zinc-500">금(GLD)</p><p className="mt-1 text-lg font-black text-white">{formatCompactKrw(benchNow)}</p></div>
                      <div className={`${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#111] p-3`}><p className="text-[10px] text-zinc-500">차이</p><p className="mt-1 text-lg font-black text-[#FFD700]">{formatCompactKrw(gapNow)}</p></div>
                      <div className={`${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#111] p-3`}><p className="text-[10px] text-zinc-500">ROI / CAGR</p><p className="mt-1 text-lg font-black text-white">{roi.toFixed(1)}% / {cagr.toFixed(1)}%</p></div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-zinc-300">과거는 끝났지만 앞으로의 10년은 남아 있습니다. 이번에는 후회가 아니라 준비로 이어가면 됩니다.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => startRace("REGRET")} className={`flex ${CONTROL_HEIGHT} items-center justify-center gap-2 ${CONTROL_RADIUS} ${CONTROL_BORDER} bg-[#131313] text-sm font-bold text-white`}><RotateCcw className="h-4 w-4" />다시 보기</button>
                    <button onClick={() => { setShowMoreAssets(true); setPhase("SEARCH"); }} className={`flex ${CONTROL_HEIGHT} items-center justify-center ${CONTROL_RADIUS} bg-[#E31937] text-sm font-bold text-white`}>다른 자산</button>
                  </div>
                  <ImpactItems currentAsset={valueNow} />
                </section>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
