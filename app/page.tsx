"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Map, RotateCcw, Zap, TrendingUp, CheckCircle2 } from "lucide-react";
import {
  ASSETS,
  DEFAULT_ASSET,
  CATEGORIES,
  KRW_INITIAL,
  MONTHS_REGRET,
  TOTAL_MONTHS,
  generateTimeSeries,
  RACE_DURATION_MS,
  AssetGroup,
  ChartPoint,
  START_YEAR,
} from "../src/data/assets";
import RaceChart from "../src/components/RacingChart";
import ImpactItems from "../src/components/ImpactItems";

const KRW = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const QUOTES = [
  { text: "주식 시장은 인내심 없는 사람의 돈을 인내심 있는 사람에게 옮기는 도구이다.", author: "워런 버핏" },
  { text: "투자는 머리가 아니라 엉덩이로 하는 것이다. 위대한 기업과 끝까지 동행하라.", author: "피터 린치" },
  { text: "지능과 에너지는 미래 경제의 핵심입니다. 이 거대한 흐름에 올라타십시오.", author: "일론 머스크" },
];

type Phase = "SEARCH" | "RACING" | "RESULT";
type Mode = "REGRET" | "SINGULARITY";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("SEARCH");
  const [mode, setMode] = useState<Mode>("REGRET");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<AssetGroup | "ALL">("ALL");
  const [selectedTicker, setSelectedTicker] = useState(DEFAULT_ASSET.ticker);
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Animation state
  const [raceProgress, setRaceProgress] = useState(0);

  useEffect(() => {
    if (phase !== "SEARCH") return;
    const timer = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [phase]);

  const selectedAsset = useMemo(
    () => ASSETS.find((a) => a.ticker === selectedTicker) ?? DEFAULT_ASSET,
    [selectedTicker],
  );

  const chartSeries = useMemo(
    () => generateTimeSeries(selectedAsset, mode),
    [selectedAsset, mode],
  );

  const targetMonths = mode === "REGRET" ? MONTHS_REGRET : TOTAL_MONTHS;

  useEffect(() => {
    if (phase !== "RACING") return;

    // In singularity mode, we have more data points, so animation might feel longer if not scaled,
    // but we use the same ms duration to make it fast and exciting.
    let raf = 0;
    const started = performance.now();

    const tick = () => {
      const progress = Math.min(
        (performance.now() - started) / RACE_DURATION_MS,
        1,
      );
      setRaceProgress(progress);

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setPhase("RESULT"), 600);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, selectedTicker, mode]);

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

  const handleSelectAsset = (ticker: string) => {
    setSelectedTicker(ticker);
    setSearchQuery("");
    setRaceProgress(0);
    setPhase("RACING");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setRaceProgress(0);
    setPhase("RACING");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToSearch = () => {
    setPhase("SEARCH");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredAssets = useMemo(() => {
    let filtered = ASSETS;
    if (category !== "ALL") {
      filtered = filtered.filter(a => a.group === category);
    }
    const q = searchQuery.trim().toUpperCase();
    if (q) {
      filtered = filtered.filter(
        (a) => a.ticker.toUpperCase().includes(q) || a.name.toUpperCase().includes(q)
      );
    }
    return filtered;
  }, [searchQuery, category]);

  const displayRoI = ((marker.asset - KRW_INITIAL) / KRW_INITIAL) * 100;
  const yearsPassed = Math.max(marker.year - START_YEAR, 0.01);
  const displayCagr = ((Math.pow(marker.asset / KRW_INITIAL, 1 / yearsPassed)) - 1) * 100;

  // Theme Variables
  const isSingularity = mode === "SINGULARITY";
  const bgTheme = isSingularity ? "bg-[#02050A]" : "bg-[#000000]";
  const accentColor = isSingularity ? "text-[#FFD700]" : "text-[#E31937]";
  const accentBg = isSingularity ? "bg-[#FFD700]" : "bg-[#E31937]";
  const accentBorder = isSingularity ? "border-[#FFD700]/40" : "border-[#E31937]/40";

  return (
    <main className={`flex min-h-screen flex-col items-center ${bgTheme} font-sans text-white transition-colors duration-1000`}>
      <div className="safe-area-pb flex w-full max-w-[430px] flex-1 flex-col pb-[120px] sm:pb-[150px]">
        <AnimatePresence mode="wait">

          {/* SECTION 1: SEARCH & INPUT */}
          {phase === "SEARCH" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col px-5 pt-12"
            >
              <h1 className="mb-2 text-3xl font-black italic tracking-tighter drop-shadow-[0_0_15px_rgba(227,25,55,0.6)]">
                REGRET<span className="text-[#E31937]">ZERO</span> <span className="text-lg text-white/50">v2.0</span>
              </h1>

              <div className="h-[88px] mb-6 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={quoteIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col gap-2"
                  >
                    <p className="text-sm font-semibold leading-relaxed text-zinc-300">
                      "{QUOTES[quoteIdx].text}"
                    </p>
                    <p className="text-[11px] font-bold tracking-widest text-[#FFD700]">
                      - {QUOTES[quoteIdx].author} -
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* V3 Conviction Info Section */}
              <div className="mb-6 rounded-2xl border border-[#222] bg-gradient-to-b from-[#111] to-[#050505] p-5 shadow-2xl">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-white">
                  <TrendingUp className="h-4 w-4 text-[#E31937]" /> 왜 장기 투자인가?
                </h2>
                <div className="flex justify-between items-center text-xs font-bold text-zinc-400 mb-3 pb-3 border-b border-[#333]">
                  <span className="flex flex-col gap-1"><span>현금 가치락</span><span className="text-white text-[10px]">인플레이션 3% 가정</span></span>
                  <span className="text-[#E31937]">매년 -3% 하락</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-zinc-400 pb-2">
                  <span className="flex flex-col gap-1"><span>우량 자산 복리</span><span className="text-white text-[10px]">과거 10년 연평균</span></span>
                  <span className="text-green-500">+10~30% 우상향</span>
                </div>
              </div>

              {/* How to use */}
              <div className="mb-8 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-zinc-500">
                <div className="rounded-xl border border-[#222] bg-[#0A0A0A] py-3 flex flex-col items-center gap-1.5">
                  <Search className="h-4 w-4 text-white" />
                  <span>1. 자산 검색</span>
                </div>
                <div className="rounded-xl border border-[#222] bg-[#0A0A0A] py-3 flex flex-col items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-[#E31937]" />
                  <span>2. 과거 레이스</span>
                </div>
                <div className="rounded-xl border border-[#222] bg-[#0A0A0A] py-3 flex flex-col items-center gap-1.5">
                  <Zap className="h-4 w-4 text-[#FFD700]" />
                  <span>3. 특이점 도약</span>
                </div>
              </div>

              {/* Input Area */}
              <div className="mb-6 rounded-2xl border border-[#222] bg-[#0A0A0A] p-4">
                <div className="mb-3 flex items-center justify-between text-xs font-bold tracking-widest text-zinc-500">
                  <span>가상 투자금</span>
                  <span className="text-white">{KRW.format(KRW_INITIAL)}</span>
                </div>
                <div className="mb-1 flex items-center justify-between text-xs font-bold tracking-widest text-zinc-500">
                  <span>기준 기간</span>
                  <span className="text-white">2016.0 ~ 현재 (10년)</span>
                </div>
              </div>

              {/* Category Filter (Grid Tabs) */}
              <div className="mb-4 grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`col-span-1 rounded-xl py-2.5 text-[10px] font-bold transition-all ${category === cat.value
                      ? "bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                      : "border border-[#333] bg-[#111] text-zinc-400 hover:bg-[#222]"
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative mb-6">
                <div className="flex h-14 items-center gap-3 rounded-2xl border border-[#333] bg-[#111] px-4 focus-within:border-white/50 transition-colors">
                  <Search className="h-5 w-5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="종목명 또는 티커 검색 (예: TSLA)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent font-bold text-white placeholder:text-zinc-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Asset List (Grid Cards) */}
              <div className="grid grid-cols-2 gap-3 pb-6">
                {filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => (
                    <button
                      key={asset.ticker}
                      onClick={() => handleSelectAsset(asset.ticker)}
                      className="group flex flex-col items-start justify-between rounded-2xl border border-[#222] bg-[#080808] p-4 transition-all hover:border-[#E31937]/60 hover:shadow-[0_0_15px_rgba(227,25,55,0.2)] hover:bg-[#111] h-[90px]"
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-black">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] text-white">
                            {asset.ticker.slice(0, 2)}
                          </div>
                          <span>{asset.ticker}</span>
                        </div>
                      </div>
                      <div className="mt-auto w-full flex justify-between items-end">
                        <span className="rounded bg-[#222] px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 group-hover:text-white transition-colors">{asset.group}</span>
                        <span className={`text-[10px] font-bold text-zinc-600 group-hover:${accentColor}`}>
                          선택 〉
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 py-10 text-center text-sm font-medium text-zinc-600">
                    검색 결과가 없습니다.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* SECTION 2 & 3 & 4: RACING STAGE & ANALYSIS */}
          {(phase === "RACING" || phase === "RESULT") && (
            <motion.div
              key="racing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex w-full flex-col pt-6"
            >
              {/* SECTION 2: Precision Visualization Header */}
              <header className="px-5">
                <div className="mb-4 flex items-center justify-between rounded-xl border border-[#222] bg-[#0A0A0A] p-3 shadow-lg">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500">2016 시작 주가</span>
                    <span className="font-mono text-sm font-bold text-zinc-300">${selectedAsset.price10yUsd}</span>
                  </div>
                  <div className="h-6 w-px bg-[#333]"></div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-bold ${accentColor}`}>현재 주가</span>
                    <span className="font-mono text-sm font-black text-white">${selectedAsset.currentUsd.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-4xl font-black tracking-tighter">{selectedAsset.ticker}</h2>
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-bold tracking-widest text-zinc-500">
                      {isSingularity ? "EXPONENTIAL FUTURE SIMULATION" : "10-YEAR HISTORICAL SIMULATION"}
                      {phase === "RESULT" && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                    </p>
                  </div>
                </div>

                {/* Digital Counter Top Stats */}
                <div className="mt-6 flex flex-col gap-1">
                  <div className="flex items-end justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1.5">
                      자산 가치
                      {phase === "RESULT" && (
                        <span className="flex items-center gap-1 bg-[#222] px-1.5 py-0.5 rounded text-[9px]">
                          대비 <span className="text-[#00FFDD]">예금 (+{((marker.asset - marker.bank) / marker.bank * 100).toFixed(1)}%)</span>
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-xs font-bold text-green-400 flex flex-col items-end gap-1">
                      <span>ROI: {displayRoI > 0 ? "+" : ""}{displayRoI.toFixed(2)}%</span>
                      {phase === "RESULT" && <span>CAGR: {displayCagr > 0 ? "+" : ""}{displayCagr.toFixed(2)}%</span>}
                    </span>
                  </div>
                  <div className={`font-mono text-4xl font-black tracking-tighter ${accentColor} drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]`}>
                    {KRW.format(marker.asset)}
                  </div>
                </div>
              </header>

              {/* The Racing Chart */}
              <div className="relative mt-4 flex h-[350px] w-full flex-col px-2">
                <RaceChart
                  series={chartSeries}
                  marker={marker}
                  mode={mode}
                  isFinished={phase === "RESULT"}
                />
              </div>

              <div className="px-5 mt-4">
                {/* SECTION 3: Analysis & Future (Singularity Toggle) */}
                <div className={`mt-2 flex items-center justify-between rounded-2xl border p-4 transition-all duration-500 ${isSingularity ? "border-[#FFD700]/50 bg-[#FFD700]/10" : "border-[#333] bg-[#111]"}`}>
                  <div className="flex flex-col gap-1">
                    <span className={`flex items-center gap-1.5 text-sm font-black ${isSingularity ? "text-[#FFD700]" : "text-white"}`}>
                      <Zap className={`h-4 w-4 ${isSingularity ? "animate-pulse" : ""}`} />
                      특이점 (Singularity) 모드
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400">미래 가치 복리 시뮬레이션 (2026~2045)</span>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => setMode(isSingularity ? "REGRET" : "SINGULARITY")}
                    disabled={phase === "RACING"}
                    className={`relative flex h-7 w-12 items-center rounded-full transition-colors ${phase === "RACING" ? "opacity-50 cursor-not-allowed" : ""} ${isSingularity ? "bg-[#FFD700]" : "bg-[#333]"}`}
                  >
                    <motion.div
                      animate={{ x: isSingularity ? 22 : 4 }}
                      className="h-5 w-5 rounded-full bg-white shadow-md"
                    />
                  </button>
                </div>
              </div>

              {/* SECTION 4: Action Center & Reality Items */}
              {phase === "RESULT" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 flex flex-col gap-8 px-5"
                >
                  {/* AI Report - Singularity mode */}
                  {isSingularity && selectedAsset.oneLiner && (
                    <div className="rounded-2xl border border-[#FFD700]/30 bg-[#FFD700]/5 p-5 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-[#FFD700]">
                        <Zap className="h-4 w-4" /> AI 특이점 리포트
                      </h3>
                      <p className="text-sm font-medium leading-relaxed text-zinc-300">
                        {selectedAsset.oneLiner}
                      </p>
                      <div className="mt-4 border-t border-[#FFD700]/20 pt-4">
                        <p className="font-mono text-xs text-zinc-500 font-bold">Growth Model: V = P · e^(rt)</p>
                      </div>
                    </div>
                  )}

                  {/* Action Center */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleReset}
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#333] bg-[#1A1A1A] py-3.5 text-sm font-bold text-white transition-all hover:bg-[#222] active:scale-95"
                    >
                      <RotateCcw className="h-4 w-4" /> 다시 시뮬레이션
                    </button>
                    <button
                      onClick={handleBackToSearch}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-black transition-all active:scale-95 ${accentBg} shadow-lg`}
                    >
                      <Map className="h-4 w-4" /> 다른 종목 검색
                    </button>
                  </div>

                  {/* Reality Checklist */}
                  <div className="pb-10">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-widest text-zinc-400">
                      <TrendingUp className="h-4 w-4" /> 구매 가능한 현실 체감 리스트
                    </h3>
                    <ImpactItems currentAsset={marker.asset} />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}
