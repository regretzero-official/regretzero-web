"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Archive,
  HelpCircle,
  Info,
  Rocket,
  Search,
  Swords,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AdSlot } from "@/components/ad-slot";
import {
  DynamicLiveTimeline,
  type DynamicTimelineScenario,
} from "@/components/DynamicLiveTimeline";
import {
  buildSyncedMatchupDeck,
  type SyncedMatchup,
} from "@/components/SyncEngine";
import { DetailChartScreen } from "@/features/detail-chart/components/DetailChartScreen";
import type { DetailChartContext } from "@/features/detail-chart/types";
import { formatCrisisPeriodLabel } from "@/features/detail-chart/utils/buildDetailChartSeries";
import { ControlledAppMenu } from "@/components/app-menu";
import { NoProfitTimetableCard } from "@/components/home/no-profit-timetable-card";
import { ProStartExplorerChart } from "@/components/home/pro-start-explorer-chart";
import { RaceChart, type RaceChartAsset } from "@/components/home/race-chart";
import {
  buildRaceMoments,
  type RaceMoment,
} from "@/features/chart-race/buildRaceMoments";
import {
  buildHoldingPainReport,
  type DifficultyLabel,
  type HoldingPainReport,
} from "@/features/pain-of-holding";
import {
  getComparisonSlotColor,
  getComparisonSlotGlow,
} from "@/lib/asset-colors";
import { trackAnalyticsEvent } from "@/lib/analytics";
import {
  MIN_COMPARISON_ASSETS,
  applyPresetSelection as normalizePresetSelection,
  canStartComparison,
} from "@/lib/comparison-selection";
import {
  DEFAULT_AMOUNT,
  RACE_DURATION_MS,
  amountPresets,
  assetCatalog,
  assetOrder,
  defaultSelectedAssetIds,
  freePlanAssetIds,
  trustNotes,
  trustSummary,
  type AssetOption,
  type ComparisonAssetId,
} from "@/lib/home-content";
import {
  buildAssetPriceSeries,
  buildMonthlyContributionRaceData,
  buildRaceData,
  buildSingleAssetSimulation,
  formatManUnitAmountInput,
  formatKrwCompact,
  formatPercent,
  getRequestedDateRange,
  getRequestedDateRangeForYears,
  parseManUnitAmountInput,
  supportsMonthlyContributionAsset,
  type AssetPricePoint,
  type MarketBundle,
  type RaceResolution,
  type RacePoint,
  type SingleAssetSimulationResult,
} from "@/lib/race-engine";
import type { HistoricalSeriesResponse, MarketDataTicker } from "@/lib/market-data";
import {
  readSavedAssetCombos,
  readSavedFutureScenarios,
  readSavedScenarios,
  readSavedTimelineRecords,
  saveAssetCombo,
  saveScenario,
  saveTimelineRecord,
  saveToHistory,
  type RaceSpeed,
  type SavedAssetCombo,
  type SavedFutureScenario,
  type SavedScenario,
  type SavedTimelineRecord,
} from "@/lib/time-machine-storage";
import {
  buildNoProfitTimetable,
  buildNoProfitTimetableShareText,
  formatNoProfitDuration,
  type NoProfitTimetable,
} from "@/features/no-profit-timetable/buildNoProfitTimetable";
import {
  buildNeonPlaybackTimeline,
  getNeonVisibleCountForProgress,
  type NeonPlaybackTimeline,
} from "@/lib/neon-race-engine";

type FlowStep =
  | "amount"
  | "assets"
  | "detail-chart"
  | "difficulty"
  | "intro"
  | "race"
  | "result"
  | "saved"
  | "solo"
  | "start-point";
type RaceStatus = "complete" | "idle" | "loading" | "paused" | "racing";
type AmountMode = "custom" | "preset";
type InvestmentMode = "lump-sum" | "monthly";
type PrimaryNavKey = "assets" | "compare" | "more" | "saved";
type SoloFlowStep = "amount" | "pick" | "race" | "result";
type SoloHorizonMode = "recent10y" | "since-listing";
type HomeScenarioMode = "compare" | "solo";

const SOLO_PRINCIPAL_ASSET_ID = "__solo_principal__";
const SOLO_PRINCIPAL_RACE_ASSET: RaceChartAsset = {
  id: SOLO_PRINCIPAL_ASSET_ID,
  label: "예금 기준",
  shortLabel: "예금",
};
const SOLO_DEPOSIT_BENCHMARK_ANNUAL_RATE = 0.029;

interface ReferralCardCopy {
  badge: string;
  benefit: string;
  fomo: string;
  name: string;
  url: string;
}

const REFERRAL_LINKS = {
  // 토스증권 계좌 개설 및 주식 선물 이벤트 공식 모바일 딥링크 규격
  TOSS_SECURITIES:
    process.env.NEXT_PUBLIC_REFERRAL_TOSS_SECURITIES_URL ??
    "https://toss.im/_m/securities_account_open?ref=MOCK_PARTNER_ID",
  // 글로벌 1위 코인 거래소 바이낸스 공식 레퍼럴 회원가입 규격
  BINANCE_CRYPTO:
    process.env.NEXT_PUBLIC_REFERRAL_BINANCE_CRYPTO_URL ??
    "https://accounts.binance.com/register?ref=MOCK_REFERRAL_CODE",
  // 메이저 가상자산 선물거래소 바이비트 공식 초대 규격
  BYBIT_CRYPTO:
    process.env.NEXT_PUBLIC_REFERRAL_BYBIT_CRYPTO_URL ??
    "https://www.bybit.com/invite?ref=MOCK_INVITE_CODE",
} as const;

const REFERRAL_DEFAULT_URL =
  process.env.NEXT_PUBLIC_REFERRAL_DEFAULT_URL ?? REFERRAL_LINKS.TOSS_SECURITIES;
const REFERRAL_STOCK_URL = process.env.NEXT_PUBLIC_REFERRAL_STOCK_URL ?? REFERRAL_LINKS.TOSS_SECURITIES;
const REFERRAL_CRYPTO_URL =
  process.env.NEXT_PUBLIC_REFERRAL_CRYPTO_URL ?? REFERRAL_LINKS.BINANCE_CRYPTO;
const REFERRAL_ETF_URL = process.env.NEXT_PUBLIC_REFERRAL_ETF_URL ?? REFERRAL_STOCK_URL;

const REFERRAL_DEFAULT: ReferralCardCopy = {
  badge: "NEXT 10 YEARS",
  benefit:
    "RegretZero는 매수 추천을 하지 않습니다. 다만 실제로 시작한다면 수수료, 환율, 자동 적립 같은 조건부터 차분히 비교해보세요.",
  fomo:
    "지나간 타이밍은 바꿀 수 없지만, 다음 10년을 준비하는 방식은 오늘부터 바꿀 수 있습니다.",
  name: "금융 혜택",
  url: REFERRAL_DEFAULT_URL,
};

const REFERRAL_MAP: Partial<Record<ComparisonAssetId, ReferralCardCopy>> = {
  aapl: {
    badge: "US STOCKS",
    benefit:
      "해외 주식은 종목만큼 환율과 거래 비용도 중요합니다. 시작 전 수수료와 소수점 투자 혜택을 먼저 비교해보세요.",
    fomo:
      "Apple처럼 오래 볼 자산일수록 매수 버튼보다 먼저 확인할 것은 수수료와 환율, 그리고 내가 계속 들고 갈 조건입니다.",
    name: "해외 주식",
    url: REFERRAL_STOCK_URL,
  },
  btc: {
    badge: "CRYPTO ACCESS",
    benefit:
      "디지털 자산은 변동성이 큰 만큼 거래 수수료, 보관 방식, 입출금 조건을 먼저 확인하는 것이 중요합니다.",
    fomo:
      "비트코인의 지난 기록은 강렬했지만, 다음 선택은 수익률보다 감당 가능한 변동성부터 봐야 합니다.",
    name: "디지털 자산",
    url: REFERRAL_CRYPTO_URL,
  },
  eth: {
    badge: "CRYPTO ACCESS",
    benefit:
      "디지털 자산은 변동성이 큰 만큼 거래 수수료, 보관 방식, 입출금 조건을 먼저 확인하는 것이 중요합니다.",
    fomo:
      "이더리움의 지난 기록은 흥미롭지만, 앞으로의 선택은 내가 버틸 수 있는 조건에서 시작해야 합니다.",
    name: "디지털 자산",
    url: REFERRAL_CRYPTO_URL,
  },
  msft: {
    badge: "US STOCKS",
    benefit:
      "해외 주식은 종목만큼 환율과 거래 비용도 중요합니다. 시작 전 수수료와 소수점 투자 혜택을 먼저 비교해보세요.",
    fomo:
      "Microsoft처럼 긴 호흡의 자산은 타이밍보다 오래 이어갈 투자 환경이 먼저입니다.",
    name: "해외 주식",
    url: REFERRAL_STOCK_URL,
  },
  nvda: {
    badge: "US STOCKS",
    benefit:
      "해외 주식은 종목만큼 환율과 거래 비용도 중요합니다. 시작 전 수수료와 소수점 투자 혜택을 먼저 비교해보세요.",
    fomo:
      "NVIDIA의 지난 10년은 강렬했지만, 다음 10년은 내가 꾸준히 실행할 수 있는 환경부터 만들어야 합니다.",
    name: "해외 주식",
    url: REFERRAL_STOCK_URL,
  },
  qqq: {
    badge: "ETF START",
    benefit:
      "ETF는 여러 기업을 한 번에 담는 방식입니다. 정기 적립, 환율, 수수료 조건을 비교하면 시작 부담을 줄일 수 있습니다.",
    fomo:
      "나스닥100 ETF처럼 오래 보는 자산은 타이밍보다 꾸준히 이어갈 수 있는 구조가 더 중요합니다.",
    name: "ETF",
    url: REFERRAL_ETF_URL,
  },
  smh: {
    badge: "ETF START",
    benefit:
      "테마 ETF는 업종 흐름을 한 번에 볼 수 있지만 변동성도 큽니다. 거래 비용과 적립 방식부터 확인해보세요.",
    fomo:
      "반도체 ETF의 지난 흐름은 컸지만, 다음 선택은 흔들림을 감당할 수 있는 방식이어야 합니다.",
    name: "ETF",
    url: REFERRAL_ETF_URL,
  },
  soxl: {
    badge: "HIGH VOLATILITY",
    benefit:
      "레버리지 ETF는 손익 변동이 매우 큽니다. 실제 투자 전 상품 구조와 수수료, 장기 보유 리스크를 반드시 확인하세요.",
    fomo:
      "SOXL처럼 움직임이 큰 상품은 기대수익보다 먼저, 하락장에서 줄일 금액과 멈출 기준을 정해야 합니다.",
    name: "레버리지 ETF",
    url: REFERRAL_ETF_URL,
  },
  tsla: {
    badge: "US STOCKS",
    benefit:
      "해외 주식은 종목만큼 환율과 거래 비용도 중요합니다. 시작 전 수수료와 소수점 투자 혜택을 먼저 비교해보세요.",
    fomo:
      "Tesla의 지난 기회는 지나갔지만, 다음 10년을 준비하는 습관은 지금부터 만들 수 있습니다.",
    name: "해외 주식",
    url: REFERRAL_STOCK_URL,
  },
};

function getReferralCardData(assetId: ComparisonAssetId | null | undefined) {
  return (assetId ? REFERRAL_MAP[assetId] : null) ?? REFERRAL_DEFAULT;
}

function ReferralCtaCard({
  copy,
  onMissingUrl,
  placement,
}: {
  copy: ReferralCardCopy;
  onMissingUrl: () => void;
  placement: "receipt" | "volatility";
}) {
  const title =
    placement === "receipt"
      ? "다음 10년을 시작하기 전 확인할 조건"
      : "흔들림을 나눠 담는 적립식 체크포인트";
  const helper =
    placement === "receipt"
      ? "지난 결과는 기록으로 남기고, 다음 선택은 수수료와 환율, 적립 조건부터 차분히 확인해보세요."
      : "크게 움직인 자산일수록 한 번에 맞히기보다 수수료, 환율, 적립 방식을 먼저 비교해보세요.";

  return (
    <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-100 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600">
            {copy.badge}
          </div>
          <div className="mt-2 text-[1.08rem] font-bold leading-7 tracking-[-0.04em] text-slate-950">
            {title}
          </div>
          <div className="mt-2 text-sm font-semibold leading-6 text-slate-800">{copy.fomo}</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">{copy.benefit}</div>
          <div className="mt-2 text-xs leading-5 text-slate-400">{helper}</div>
        </div>
        <div className="hidden rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-500 sm:block">
          제휴
        </div>
      </div>
      <a
        aria-label={`${copy.name} 제휴 혜택 확인하기`}
        className="mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-slate-950 px-5 text-center text-sm font-bold tracking-[-0.02em] text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800"
        href={copy.url}
        onClick={(event) => {
          if (copy.url && copy.url !== "#") {
            return;
          }

          event.preventDefault();
          onMissingUrl();
        }}
        rel="noopener noreferrer sponsored"
        target="_blank"
      >
        {copy.name} 혜택 확인하기
      </a>
      <div className="mt-3 text-[11px] leading-5 text-slate-400">
        광고·제휴 링크가 포함될 수 있습니다. 과거 기록은 미래 수익을 보장하지 않으며,
        실제 투자 판단은 본인 책임입니다.
      </div>
    </div>
  );
}

function buildOgShareUrl({
  assetLabel,
  finalValueLabel,
  gapLabel,
  investedLabel,
  waitingMonths,
}: {
  assetLabel: string;
  finalValueLabel: string;
  gapLabel: string;
  investedLabel: string;
  waitingMonths: number;
}) {
  const url = new URL(window.location.href);
  url.searchParams.set("ogAsset", assetLabel);
  url.searchParams.set("ogAmount", investedLabel);
  url.searchParams.set("ogFinal", finalValueLabel);
  url.searchParams.set("ogGap", gapLabel);
  url.searchParams.set("ogWait", `${waitingMonths}`);
  url.searchParams.set("utm_source", "share");
  url.searchParams.set("utm_medium", "result_card");
  return url.toString();
}

function calculateSoloDepositBenchmarkValue(
  principalKrw: number,
  startDate: Date | string,
  pointDate: Date | string,
) {
  const startTime = new Date(startDate).getTime();
  const pointTime = new Date(pointDate).getTime();
  const elapsedMs = Math.max(0, pointTime - startTime);
  const years = elapsedMs / (365.25 * 24 * 60 * 60 * 1000);
  return principalKrw * Math.pow(1 + SOLO_DEPOSIT_BENCHMARK_ANNUAL_RATE, years);
}

interface HomeScenario {
  assetIds: ComparisonAssetId[];
  badge: string;
  description: string;
  mode: HomeScenarioMode;
  title: string;
}
type AssetFilterId =
  | "all"
  | "popular"
  | "etf"
  | "ai-semi"
  | "energy"
  | "future-tech"
  | "us-stock"
  | "kr-stock"
  | "other";
type PremiumFeatureId = "custom-date" | "deeper-analysis";

type WeightedPlaybackTimeline = NeonPlaybackTimeline;

interface StartDateAdjustmentNotice {
  body: string;
  detail: string;
  title: string;
}

interface StepHeaderProps {
  description: string;
  onBack?: () => void;
  step: 1 | 2 | 3 | 4;
  title: string;
}

const ASSET_FILTERS: Array<{
  id: AssetFilterId;
  label: string;
  matches: (asset: AssetOption) => boolean;
}> = [
  {
    id: "all",
    label: "전체",
    matches: () => true,
  },
  {
    id: "popular",
    label: "인기",
    matches: (asset) => POPULAR_BROWSER_ASSET_SET.has(asset.id),
  },
  {
    id: "etf",
    label: "ETF",
    matches: (asset) => POPULAR_ETF_BROWSER_ASSET_SET.has(asset.id),
  },
  {
    id: "ai-semi",
    label: "AI·반도체",
    matches: (asset) => AI_SEMI_BROWSER_ASSET_SET.has(asset.id),
  },
  {
    id: "energy",
    label: "전력·에너지",
    matches: (asset) => ENERGY_BROWSER_ASSET_SET.has(asset.id),
  },
  {
    id: "future-tech",
    label: "로봇·양자",
    matches: (asset) => ROBOTICS_QUANTUM_BROWSER_ASSET_SET.has(asset.id),
  },
  {
    id: "us-stock",
    label: "미국",
    matches: (asset) => asset.category === "미국주식",
  },
  {
    id: "kr-stock",
    label: "한국",
    matches: (asset) => asset.category === "한국주식",
  },
  {
    id: "other",
    label: "기타",
    matches: (asset) =>
      asset.category === "안전자산" ||
      asset.category === "부동산" ||
      asset.category === "코인",
  },
];

const FREE_PLAN_ASSET_SET = new Set<ComparisonAssetId>(freePlanAssetIds);
const POPULAR_ETF_BROWSER_ASSET_IDS: ComparisonAssetId[] = [
  "qqq",
  "voo",
  "soxl",
  "tqqq",
  "schd",
  "smh",
  "133690",
  "091160",
];
const POPULAR_ETF_BROWSER_ASSET_SET = new Set<ComparisonAssetId>(
  POPULAR_ETF_BROWSER_ASSET_IDS,
);
const POPULAR_BROWSER_ASSET_IDS: ComparisonAssetId[] = [
  "deposit",
  "seoul_apt",
  "gangnam_gu_apt",
  "gold",
  "silver",
  "btc",
  "nvda",
  "tsla",
  "aapl",
  "msft",
  "tsm",
  "asml",
  "avgo",
  "amd",
  "pltr",
  "ionq",
  "ceg",
  "vst",
  "005930",
  "000660",
  "042700",
  "403870",
  "058470",
  "095340",
  "009150",
  "091160",
  "133690",
  "005380",
  "035420",
  "277810",
  "010120",
  "267260",
  "012450",
  "034020",
  "006400",
  "003670",
  "098460",
  "090360",
  "qqq",
  "voo",
  "soxl",
  "tqqq",
  "schd",
  "smh",
  "133690",
  "091160",
];
const POPULAR_BROWSER_ASSET_SET = new Set<ComparisonAssetId>(POPULAR_BROWSER_ASSET_IDS);
const POPULAR_BROWSER_PREVIEW_LIMIT = 18;
const AI_SEMI_BROWSER_ASSET_IDS: ComparisonAssetId[] = [
  "nvda",
  "avgo",
  "amd",
  "tsm",
  "asml",
  "arm",
  "mu",
  "mrvl",
  "lrcx",
  "klac",
  "amat",
  "qcom",
  "intc",
  "smci",
  "pltr",
  "snow",
  "crwd",
  "msft",
  "googl",
  "meta",
  "005930",
  "000660",
  "042700",
  "403870",
  "058470",
  "095340",
  "000990",
  "009150",
  "091160",
  "133690",
];
const ENERGY_BROWSER_ASSET_IDS: ComparisonAssetId[] = [
  "xom",
  "cvx",
  "cop",
  "ceg",
  "nee",
  "vst",
  "fslr",
  "015760",
  "034020",
  "010120",
  "267260",
  "009830",
  "051910",
  "006400",
  "003670",
];
const ROBOTICS_QUANTUM_BROWSER_ASSET_IDS: ComparisonAssetId[] = [
  "isrg",
  "rok",
  "ter",
  "ionq",
  "rgti",
  "qbts",
  "ibm",
  "277810",
  "090360",
  "098460",
  "079550",
  "064350",
];
const AI_SEMI_BROWSER_ASSET_SET = new Set<ComparisonAssetId>(AI_SEMI_BROWSER_ASSET_IDS);
const ENERGY_BROWSER_ASSET_SET = new Set<ComparisonAssetId>(ENERGY_BROWSER_ASSET_IDS);
const ROBOTICS_QUANTUM_BROWSER_ASSET_SET = new Set<ComparisonAssetId>(
  ROBOTICS_QUANTUM_BROWSER_ASSET_IDS,
);
const PRO_DISCOVERY_ASSET_IDS: ComparisonAssetId[] = [
  "tsll",
  "nvdl",
  "upro",
  "pltr",
  "051910",
  "006400",
  "086790",
  "133690",
];
const ASSET_BROWSER_SECTION_DEFS: Array<{
  helper: string;
  id: string;
  matches: (asset: AssetOption) => boolean;
  title: string;
}> = [
  {
    id: "ai-semi",
    title: "AI·반도체",
    helper: "칩, 장비, 메모리까지.",
    matches: (asset) => AI_SEMI_BROWSER_ASSET_SET.has(asset.id),
  },
  {
    id: "future-tech",
    title: "로봇·자동화·양자",
    helper: "작지만 크게 흔들리는 미래 기술.",
    matches: (asset) => ROBOTICS_QUANTUM_BROWSER_ASSET_SET.has(asset.id),
  },
  {
    id: "energy",
    title: "전력·에너지",
    helper: "AI 시대의 전력과 에너지.",
    matches: (asset) => ENERGY_BROWSER_ASSET_SET.has(asset.id),
  },
  {
    id: "us-stocks",
    title: "미국 인기 주식",
    helper: "많이 찾는 미국 주식.",
    matches: (asset) => asset.category === "미국주식",
  },
  {
    id: "kr-stocks",
    title: "한국 대표 주식",
    helper: "익숙한 한국 주식.",
    matches: (asset) => asset.category === "한국주식",
  },
  {
    id: "etf",
    title: "대표 ETF만 모아보기",
    helper: "처음엔 QQQ, VOO, SOXL처럼 익숙한 이름만 봐도 충분합니다.",
    matches: (asset) => POPULAR_ETF_BROWSER_ASSET_SET.has(asset.id),
  },
  {
    id: "safe-assets",
    title: "안전자산",
    helper: "비교의 기준이 되는 자산.",
    matches: (asset) => asset.category === "안전자산",
  },
  {
    id: "real-estate",
    title: "부동산 / 프록시",
    helper: "평균 흐름으로 만든 비교값.",
    matches: (asset) => asset.category === "부동산",
  },
  {
    id: "coin",
    title: "코인",
    helper: "크게 오르고 크게 흔들립니다.",
    matches: (asset) => asset.category === "코인",
  },
];

const RACE_SPEED_OPTIONS: Array<{
  durationMs: number;
  id: RaceSpeed;
  label: string;
}> = [
  { durationMs: 36_000, id: "slow", label: "0.5x" },
  { durationMs: 18_000, id: "normal", label: "1x" },
  { durationMs: 9_000, id: "fast", label: "2x" },
  { durationMs: 4_500, id: "very_fast", label: "4x" },
  { durationMs: 200, id: "instant", label: "즉시 결과" },
];

const RACE_RESOLUTION_OPTIONS: Array<{ id: RaceResolution; label: string }> = [
  { id: "monthly", label: "월봉" },
  { id: "weekly", label: "주봉" },
  { id: "daily", label: "일봉" },
];

const START_POINT_SPEED_OPTIONS = RACE_SPEED_OPTIONS.filter(
  (option) => option.id === "normal" || option.id === "instant",
);

const RACE_PLAYBACK_SPEED_OPTIONS = RACE_SPEED_OPTIONS.filter(
  (option) => option.id !== "instant",
);

const HOME_DIRECT_PICK_ASSET_COUNT = 12;
const HOME_DIRECT_PICK_CORE_ASSET_IDS: ComparisonAssetId[] = ["deposit", "gold", "btc"];
const HOME_DIRECT_PICK_STOCK_TARGET = 6;
const HOME_DIRECT_PICK_BENCHMARK_TARGET = 1;
const HOME_DIRECT_PICK_ETF_TARGET = 2;

const HOME_DIRECT_PICK_FALLBACK_ASSET_IDS: ComparisonAssetId[] = [
  "deposit",
  "gold",
  "btc",
  "silver",
  "seoul_apt",
  "nvda",
  "tsla",
  "aapl",
  "msft",
  "005930",
  "000660",
  "qqq",
];

const HOME_DIRECT_PICK_DAILY_POOL_IDS: ComparisonAssetId[] = [
  "deposit",
  "gold",
  "silver",
  "seoul_apt",
  "gangnam_gu_apt",
  "btc",
  "qqq",
  "voo",
  "soxl",
  "tqqq",
  "schd",
  "smh",
  "nvda",
  "tsla",
  "aapl",
  "msft",
  "pltr",
  "ceg",
  "vst",
  "ionq",
  "005930",
  "000660",
  "005380",
  "035420",
  "277810",
  "010120",
  "267260",
  "042700",
  "403870",
  "058470",
  "095340",
  "091160",
  "133690",
];

const SOLO_QUICK_ASSET_IDS: ComparisonAssetId[] = [
  "005930",
  "nvda",
  "tsla",
  "btc",
  "000660",
  "aapl",
  "msft",
  "gold",
  "seoul_apt",
  "qqq",
  "soxl",
  "silver",
];

const HOME_FLOW_COPY = {
  allAssetsHint: "삼성전자, 엔비디아, 비트코인처럼 종목명을 바로 검색할 수 있습니다.",
  amountDescription: "두 자산을 같은 출발선에 세웁니다.",
  amountTitle: "기본은 1,000만원입니다",
  assetDescription: "비교하고 싶은 이름 두 개만 고르면 됩니다.",
  assetTitle: "비교할 자산을 골라주세요",
  beginnerDescription: "처음이라면 흐름부터 빠르게 잡아드릴게요.",
  beginnerTitle: "처음이라면 여기부터",
  emptySelection: "아직 고른 자산이 없습니다.",
  heroDescription: "같은 돈의 10년 차이를 네온 레이스로 돌려봅니다.",
  heroEyebrow: "REGRETZERO",
  heroTitle: "그때 샀다면,\n지금 어디쯤일까요?",
  heroCta: "10년 전으로 돌려보기",
  quickAssetDescription: "머릿속에 떠오른 자산부터 골라보세요.",
  quickAssetTitle: "어떤 10년을 돌려볼까요?",
  raceDescription: "승자는 마지막에 보입니다. 진짜 힌트는 격차가 벌어진 구간에 있습니다.",
  raceTitle: "격차가 벌어진 장면",
  recommendedDescription: "처음엔 익숙한 조합이 가장 빠릅니다.",
  recommendedTitle: "10년 전으로 돌려보는 대표 비교",
  resultDescription: "마지막 금액과 그 사이의 하락 구간을 함께 봅니다.",
  resultTitle: "끝까지 들고 갔다면",
} as const;

const INTRO_FLOW_POINTS = [
  { label: "1", text: "궁금한 종목 하나 선택" },
  { label: "2", text: "예금 기준과 10년 레이스" },
  { label: "3", text: "놓친 수익과 버틴 구간 확인" },
] as const;

const MAIN_COMPARISON_ASSET_LIMIT = MIN_COMPARISON_ASSETS;

const DEFAULT_MONTHLY_CONTRIBUTION = 300_000;

const MONTHLY_CONTRIBUTION_PRESETS = [
  { label: "10만원", value: 100_000 },
  { label: "30만원", value: 300_000 },
  { label: "50만원", value: 500_000 },
  { label: "100만원", value: 1_000_000 },
] as const;

const AD_SUPPORTED_ACCESS = {
  isPremium: true,
  unlockedAt: "ad-supported",
} as const;

const HOME_PRIMARY_SCENARIOS: HomeScenario[] = [
  {
    assetIds: ["nvda"],
    badge: "🇺🇸 AI 대표주",
    description: "은행에 뒀다면 어땠을지 10년 기록으로 비교",
    mode: "solo",
    title: "엔비디아",
  },
  {
    assetIds: ["btc"],
    badge: "₿ 디지털 자산",
    description: "정기예금과 나란히 놓고 보는 비트코인의 10년",
    mode: "solo",
    title: "비트코인",
  },
  {
    assetIds: ["tsla"],
    badge: "🇺🇸 전기차",
    description: "뜨거웠던 전기차 주식의 10년을 예금과 비교",
    mode: "solo",
    title: "테슬라",
  },
  {
    assetIds: ["005930"],
    badge: "🇰🇷 대표 주식",
    description: "국민주 삼성전자를 예금 기준과 나란히 비교",
    mode: "solo",
    title: "삼성전자",
  },
  {
    assetIds: ["nvda", "000660"],
    badge: "AI 반도체",
    description: "AI 대표주와 한국 반도체 대장이 만든 10년 격차를 봅니다.",
    mode: "compare",
    title: "엔비디아 vs SK하이닉스",
  },
  {
    assetIds: ["tsla", "005380"],
    badge: "전기차",
    description: "전기차 시대를 통과한 두 회사의 속도를 비교합니다.",
    mode: "compare",
    title: "테슬라 vs 현대차",
  },
  {
    assetIds: ["soxl", "qqq"],
    badge: "레버리지",
    description: "더 세게 오른 만큼 더 거칠게 흔들렸는지 확인합니다.",
    mode: "compare",
    title: "SOXL vs QQQ",
  },
  {
    assetIds: ["btc", "gold"],
    badge: "금 vs 코인",
    description: "디지털 금과 진짜 금은 같은 10년을 어떻게 보냈을까요?",
    mode: "compare",
    title: "비트코인 vs 금",
  },
  {
    assetIds: ["seoul_apt", "qqq"],
    badge: "부동산 vs 미국주식",
    description: "서울 아파트와 미국 기술주 ETF를 같은 돈으로 맞붙입니다.",
    mode: "compare",
    title: "서울 아파트 vs 미국 기술주 ETF",
  },
];

const HOME_SOLO_THEME_PACKS: HomeScenario[][] = [
  [
    {
      assetIds: ["nvda"],
      badge: "서학개미의 눈물",
      description: "AI 대표주가 예금과 얼마나 다른 속도로 달렸는지 봅니다.",
      mode: "solo",
      title: "엔비디아",
    },
    {
      assetIds: ["tsla"],
      badge: "서학개미의 눈물",
      description: "테슬라의 질주와 급제동이 함께 보이는 10년입니다.",
      mode: "solo",
      title: "테슬라",
    },
    {
      assetIds: ["aapl"],
      badge: "서학개미의 눈물",
      description: "애플을 예금 기준 옆에 놓고 10년 격차를 확인합니다.",
      mode: "solo",
      title: "애플",
    },
    {
      assetIds: ["msft"],
      badge: "서학개미의 눈물",
      description: "마이크로소프트가 조용히 벌려온 차이를 확인합니다.",
      mode: "solo",
      title: "마이크로소프트",
    },
  ],
  [
    {
      assetIds: ["btc"],
      badge: "디지털 자산의 역사",
      description: "비트코인의 거친 10년을 예금 기준 옆에 놓고 봅니다.",
      mode: "solo",
      title: "비트코인",
    },
    {
      assetIds: ["eth"],
      badge: "디지털 자산의 역사",
      description: "이더리움의 급등락이 실제 금액으로 어떻게 남았는지 봅니다.",
      mode: "solo",
      title: "이더리움",
    },
    {
      assetIds: ["soxl"],
      badge: "디지털 자산의 역사",
      description: "초고변동 ETF가 만든 짜릿한 상승과 깊은 낙폭을 봅니다.",
      mode: "solo",
      title: "SOXL",
    },
    {
      assetIds: ["tqqq"],
      badge: "디지털 자산의 역사",
      description: "나스닥 3배 ETF가 남긴 보상과 대가를 같이 봅니다.",
      mode: "solo",
      title: "TQQQ",
    },
  ],
  [
    {
      assetIds: ["005930"],
      badge: "국장 주주의 인내",
      description: "삼성전자를 예금과 나란히 놓고 10년을 확인합니다.",
      mode: "solo",
      title: "삼성전자",
    },
    {
      assetIds: ["000660"],
      badge: "국장 주주의 인내",
      description: "SK하이닉스가 반도체 사이클을 어떻게 통과했는지 봅니다.",
      mode: "solo",
      title: "SK하이닉스",
    },
    {
      assetIds: ["005380"],
      badge: "국장 주주의 인내",
      description: "현대차가 회복과 성장을 거쳐 만든 결과를 봅니다.",
      mode: "solo",
      title: "현대차",
    },
    {
      assetIds: ["035420"],
      badge: "국장 주주의 인내",
      description: "네이버의 성장 뒤에 따라온 긴 조정까지 확인합니다.",
      mode: "solo",
      title: "네이버",
    },
  ],
  [
    {
      assetIds: ["gold"],
      badge: "안전 자산의 역습",
      description: "금이 예금보다 더 나은 피난처였는지 확인합니다.",
      mode: "solo",
      title: "금",
    },
    {
      assetIds: ["silver"],
      badge: "안전 자산의 역습",
      description: "은의 실물자산 매력과 변동성을 함께 봅니다.",
      mode: "solo",
      title: "은",
    },
    {
      assetIds: ["seoul_apt"],
      badge: "안전 자산의 역습",
      description: "서울 아파트 평균 가격이 만든 10년 궤적을 봅니다.",
      mode: "solo",
      title: "서울 아파트 지수",
    },
    {
      assetIds: ["gangnam_gu_apt"],
      badge: "안전 자산의 역습",
      description: "강남 아파트 평균이 서울 평균과 달랐던 지점을 봅니다.",
      mode: "solo",
      title: "강남 아파트 지수",
    },
  ],
];

const HOME_SOLO_SCENARIOS = HOME_SOLO_THEME_PACKS[0]!;

const HOME_RIVAL_SCENARIOS = HOME_PRIMARY_SCENARIOS.filter(
  (scenario) => scenario.mode === "compare",
);

function shuffleHomeSoloScenarios(currentScenarios: HomeScenario[]) {
  const currentKey = currentScenarios.map((scenario) => scenario.title).join("|");
  const nextPacks = HOME_SOLO_THEME_PACKS.filter(
    (pack) => pack.map((scenario) => scenario.title).join("|") !== currentKey,
  );
  const source = nextPacks.length > 0 ? nextPacks : HOME_SOLO_THEME_PACKS;
  const selectedPack = source[Math.floor(Math.random() * source.length)] ?? HOME_SOLO_THEME_PACKS[0]!;

  return selectedPack;
}

function pickRandomHomeSoloScenarios() {
  return HOME_SOLO_THEME_PACKS[Math.floor(Math.random() * HOME_SOLO_THEME_PACKS.length)] ?? HOME_SOLO_SCENARIOS;
}

const DESKTOP_RECOMMENDED_COMPARISONS: Array<{
  assetIds: ComparisonAssetId[];
  badge: string;
  ctaLabel: string;
  description: string;
  title: string;
}> = [
  {
    assetIds: ["deposit", "qqq"],
    badge: "안전과 성장",
    ctaLabel: "바로 시작",
    description: "안정과 성장의 온도 차이가 가장 선명한 조합입니다.",
    title: "예금 vs 미국 기술주 ETF",
  },
  {
    assetIds: ["005930", "000660"],
    badge: "한국 반도체",
    ctaLabel: "바로 시작",
    description: "국내 반도체 대표주 두 곳의 10년을 비교합니다.",
    title: "삼성전자 vs SK하이닉스",
  },
  {
    assetIds: ["tsla", "nvda"],
    badge: "시장의 주도권",
    ctaLabel: "바로 시작",
    description: "전기차에서 AI로 넘어간 시장의 주도권을 봅니다.",
    title: "테슬라 vs 엔비디아",
  },
  {
    assetIds: ["nvda", "000660"],
    badge: "AI 반도체",
    ctaLabel: "바로 시작",
    description: "AI 반도체와 메모리 반도체가 만든 격차를 봅니다.",
    title: "엔비디아 vs SK하이닉스",
  },
  {
    assetIds: ["voo", "qqq"],
    badge: "미국 시장",
    ctaLabel: "바로 시작",
    description: "미국 전체 시장과 기술주 시장이 다른 속도로 달린 구간을 봅니다.",
    title: "S&P500 ETF vs 나스닥100 ETF",
  },
  {
    assetIds: ["seoul_apt", "qqq"],
    badge: "부동산 vs 미국주식",
    ctaLabel: "바로 시작",
    description: "서울 아파트 평균과 미국 기술주의 체감 격차를 봅니다.",
    title: "서울 아파트 vs 나스닥100 ETF",
  },
  {
    assetIds: ["gangnam_gu_apt", "005930"],
    badge: "익숙한 한국 자산",
    ctaLabel: "바로 시작",
    description: "강남 아파트 평균과 삼성전자의 10년을 같은 금액으로 맞춥니다.",
    title: "강남구 아파트 vs 삼성전자",
  },
  {
    assetIds: ["gold", "btc"],
    badge: "고변동 자산",
    ctaLabel: "바로 시작",
    description: "크게 오른 자산이 얼마나 크게 흔들렸는지 봅니다.",
    title: "금 vs 비트코인",
  },
  {
    assetIds: ["gold", "silver"],
    badge: "실물자산",
    ctaLabel: "바로 시작",
    description: "같은 귀금속도 움직임은 다릅니다.",
    title: "금 vs 은",
  },
  {
    assetIds: ["tsla", "005380"],
    badge: "전기차 성장주",
    ctaLabel: "바로 시작",
    description: "테슬라와 현대차가 같은 시대를 얼마나 다르게 지났는지 봅니다.",
    title: "테슬라 vs 현대차",
  },
  {
    assetIds: ["xle", "ceg"],
    badge: "전력·에너지",
    ctaLabel: "바로 시작",
    description: "에너지 업종과 전력 인프라가 다른 속도로 움직인 구간을 봅니다.",
    title: "미국 에너지 ETF vs 전력 인프라 기업",
  },
  {
    assetIds: ["botz", "qtum"],
    badge: "미래 테마",
    ctaLabel: "바로 시작",
    description: "로봇·AI와 양자컴퓨팅 테마의 변동성을 봅니다.",
    title: "로봇·AI ETF vs 양자컴퓨팅 ETF",
  },
  {
    assetIds: ["005930", "qqq"],
    badge: "한국 대표",
    ctaLabel: "바로 시작",
    description: "삼성전자와 미국 기술주 ETF의 10년을 비교합니다.",
    title: "삼성전자 vs 미국 기술주 ETF",
  },
  {
    assetIds: ["035420", "035720"],
    badge: "한국 플랫폼",
    ctaLabel: "바로 시작",
    description: "네이버와 카카오의 같은 기간을 비교합니다.",
    title: "네이버 vs 카카오",
  },
  {
    assetIds: ["spy", "voo"],
    badge: "S&P500 ETF",
    ctaLabel: "바로 시작",
    description: "같은 S&P500이라도 실제 금액 차이를 확인합니다.",
    title: "SPY vs VOO",
  },
  {
    assetIds: ["qqq", "qqqm"],
    badge: "나스닥 100",
    ctaLabel: "바로 시작",
    description: "같은 나스닥100을 따라가는 대표 ETF 두 개입니다.",
    title: "QQQ vs QQQM",
  },
  {
    assetIds: ["qqq", "tqqq"],
    badge: "레버리지 ETF",
    ctaLabel: "바로 시작",
    description: "나스닥100과 3배 레버리지가 같은 상승장을 얼마나 다르게 탄지 봅니다.",
    title: "QQQ vs TQQQ",
  },
  {
    assetIds: ["soxx", "soxl"],
    badge: "반도체 3배",
    ctaLabel: "바로 시작",
    description: "반도체 ETF와 3배 레버리지의 보상과 낙폭을 봅니다.",
    title: "SOXX vs SOXL",
  },
  {
    assetIds: ["smh", "soxx"],
    badge: "AI 반도체",
    ctaLabel: "바로 시작",
    description: "대표 반도체 ETF 두 개가 만든 실제 금액 격차를 봅니다.",
    title: "SMH vs SOXX",
  },
  {
    assetIds: ["voo", "schd"],
    badge: "배당·인컴",
    ctaLabel: "바로 시작",
    description: "시장 대표 ETF와 배당 ETF의 결이 어떻게 다른지 봅니다.",
    title: "VOO vs SCHD",
  },
  {
    assetIds: ["jepq", "schd"],
    badge: "배당·인컴",
    ctaLabel: "바로 시작",
    description: "월배당 인컴과 배당 성장 ETF의 결을 비교합니다.",
    title: "JEPQ vs SCHD",
  },
  {
    assetIds: ["jepi", "jepq"],
    badge: "배당·인컴",
    ctaLabel: "바로 시작",
    description: "월배당 ETF도 담는 자산에 따라 흐름이 달라집니다.",
    title: "JEPI vs JEPQ",
  },
  {
    assetIds: ["slv", "gld"],
    badge: "실물자산",
    ctaLabel: "바로 시작",
    description: "금과 은 ETF가 얼마나 다르게 흔들렸는지 봅니다.",
    title: "SLV vs GLD",
  },
  {
    assetIds: ["silver", "slv"],
    badge: "실물자산",
    ctaLabel: "바로 시작",
    description: "은 가격과 은 ETF가 실제로 얼마나 비슷했는지 봅니다.",
    title: "은 vs SLV",
  },
  {
    assetIds: ["silver", "btc"],
    badge: "고변동 자산",
    ctaLabel: "바로 시작",
    description: "실물자산과 디지털 자산의 극단적인 온도 차를 확인합니다.",
    title: "은 vs 비트코인",
  },
  {
    assetIds: ["tsla", "btc"],
    badge: "레버리지 ETF",
    ctaLabel: "바로 시작",
    description: "가장 많이 회자되는 고변동 자산 두 개를 비교합니다.",
    title: "테슬라 vs 비트코인",
  },
  {
    assetIds: ["seoul_apt", "voo"],
    badge: "부동산 vs 미국주식",
    ctaLabel: "바로 시작",
    description: "서울 아파트와 미국 대표 시장의 10년입니다.",
    title: "서울 아파트 vs S&P500 ETF",
  },
  {
    assetIds: ["gangnam_gu_apt", "qqq"],
    badge: "부동산 vs 미국주식",
    ctaLabel: "바로 시작",
    description: "강남구 아파트와 나스닥100 ETF의 체감 격차를 봅니다.",
    title: "강남구 아파트 vs 나스닥100 ETF",
  },
  {
    assetIds: ["gangnam_gu_apt", "seoul_apt"],
    badge: "부동산",
    ctaLabel: "바로 시작",
    description: "같은 부동산이라도 지역에 따라 속도가 달라집니다.",
    title: "강남구 아파트 vs 서울 아파트",
  },
  {
    assetIds: ["nvda", "soxl"],
    badge: "AI 반도체",
    ctaLabel: "바로 시작",
    description: "엔비디아 단일 종목과 반도체 3배 ETF를 비교합니다.",
    title: "엔비디아 vs SOXL",
  },
  {
    assetIds: ["nvda", "smh"],
    badge: "AI 반도체",
    ctaLabel: "바로 시작",
    description: "대표 AI 주식과 반도체 ETF가 달린 속도를 비교합니다.",
    title: "엔비디아 vs SMH",
  },
  {
    assetIds: ["tsla", "tqqq"],
    badge: "고변동 자산",
    ctaLabel: "바로 시작",
    description: "개별 성장주와 레버리지 ETF의 흔들림을 비교합니다.",
    title: "테슬라 vs TQQQ",
  },
  {
    assetIds: ["btc", "tqqq"],
    badge: "고변동 자산",
    ctaLabel: "바로 시작",
    description: "코인과 레버리지 ETF 중 무엇이 더 거칠었는지 봅니다.",
    title: "비트코인 vs TQQQ",
  },
  {
    assetIds: ["btc", "soxl"],
    badge: "고변동 자산",
    ctaLabel: "바로 시작",
    description: "대표 디지털 자산과 반도체 3배 ETF의 대결입니다.",
    title: "비트코인 vs SOXL",
  },
  {
    assetIds: ["005930", "133690"],
    badge: "한국 대표",
    ctaLabel: "바로 시작",
    description: "삼성전자와 국내 상장 나스닥100 ETF를 비교합니다.",
    title: "삼성전자 vs TIGER 미국나스닥100",
  },
  {
    assetIds: ["000660", "091160"],
    badge: "한국 반도체",
    ctaLabel: "바로 시작",
    description: "SK하이닉스와 한국 반도체 ETF의 체감 격차를 봅니다.",
    title: "SK하이닉스 vs KODEX 반도체",
  },
  {
    assetIds: ["005930", "091160"],
    badge: "한국 반도체",
    ctaLabel: "바로 시작",
    description: "삼성전자 단일 종목과 반도체 ETF가 만든 격차를 봅니다.",
    title: "삼성전자 vs KODEX 반도체",
  },
  {
    assetIds: ["069500", "133690"],
    badge: "한국 대표",
    ctaLabel: "바로 시작",
    description: "한국 대표 지수와 국내 상장 미국 나스닥 ETF입니다.",
    title: "KODEX 200 vs TIGER 미국나스닥100",
  },
  {
    assetIds: ["277810", "botz"],
    badge: "로봇·양자",
    ctaLabel: "바로 시작",
    description: "한국 로봇 성장주와 글로벌 로봇 ETF를 비교합니다.",
    title: "레인보우로보틱스 vs BOTZ",
  },
  {
    assetIds: ["ionq", "qtum"],
    badge: "로봇·양자",
    ctaLabel: "바로 시작",
    description: "양자컴퓨팅 개별주와 테마 ETF의 변동성을 봅니다.",
    title: "IonQ vs QTUM",
  },
  {
    assetIds: ["ceg", "xle"],
    badge: "전력·에너지",
    ctaLabel: "바로 시작",
    description: "AI 전력 수요 테마와 전통 에너지 ETF를 비교합니다.",
    title: "Constellation Energy vs XLE",
  },
  {
    assetIds: ["vst", "ceg"],
    badge: "AI 전력",
    ctaLabel: "바로 시작",
    description: "전력 인프라 대표 성장주 두 개가 달린 속도를 봅니다.",
    title: "Vistra vs Constellation Energy",
  },
  {
    assetIds: ["tsll", "tsla"],
    badge: "레버리지 ETF",
    ctaLabel: "바로 시작",
    description: "테슬라 주식과 2배 ETF가 만든 낙폭 격차를 봅니다.",
    title: "TSLL vs Tesla",
  },
  {
    assetIds: ["nvdl", "nvda"],
    badge: "레버리지 ETF",
    ctaLabel: "바로 시작",
    description: "엔비디아 주식과 엔비디아 2배 ETF의 변동성입니다.",
    title: "NVDL vs NVIDIA",
  },
];

function buildRivalScenarioPool() {
  const seenKeys = new Set<string>();
  const baseScenarios: HomeScenario[] = [
    ...HOME_RIVAL_SCENARIOS,
    ...DESKTOP_RECOMMENDED_COMPARISONS.map((comparison) => ({
      assetIds: comparison.assetIds,
      badge: comparison.badge,
      description: comparison.description,
      mode: "compare" as const,
      title: comparison.title,
    })),
  ];

  return baseScenarios.filter((scenario) => {
    const key = `${scenario.title}:${scenario.assetIds.join(",")}`;
    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return scenario.assetIds.length >= MIN_COMPARISON_ASSETS;
  });
}

const HOME_RIVAL_SCENARIO_POOL = buildRivalScenarioPool();

function shuffleHomeRivalScenarios(currentScenarios: HomeScenario[]) {
  const currentKeys = new Set(currentScenarios.map((scenario) => scenario.title));
  const freshCandidates = HOME_RIVAL_SCENARIO_POOL.filter(
    (scenario) => !currentKeys.has(scenario.title),
  );
  const source = freshCandidates.length >= 4 ? freshCandidates : HOME_RIVAL_SCENARIO_POOL;
  const shuffled = [...source].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, 4);
}

type RecommendedComparisonCategoryId =
  | "ai-semi"
  | "all"
  | "future"
  | "kr-assets"
  | "real-assets"
  | "stable-growth"
  | "us-market"
  | "volatile";

const RECOMMENDED_COMPARISON_CATEGORIES: Array<{
  badges: string[];
  id: RecommendedComparisonCategoryId;
  label: string;
}> = [
  { id: "all", label: "전체", badges: [] },
  {
    id: "stable-growth",
    label: "안정·성장",
    badges: ["안전과 성장", "S&P500 ETF", "배당·인컴", "나스닥 100"],
  },
  {
    id: "ai-semi",
    label: "AI·반도체",
    badges: ["AI 반도체", "한국 반도체", "반도체 3배", "AI 전력"],
  },
  {
    id: "us-market",
    label: "미국 시장",
    badges: ["미국 시장", "시장의 주도권", "S&P500 ETF", "나스닥 100", "배당·인컴"],
  },
  {
    id: "kr-assets",
    label: "한국 대표",
    badges: ["가장 익숙한 후회", "익숙한 한국 자산", "한국 반도체", "한국 플랫폼", "한국 대표"],
  },
  {
    id: "real-assets",
    label: "부동산·실물",
    badges: ["부동산 vs 미국주식", "익숙한 한국 자산", "실물자산", "부동산"],
  },
  {
    id: "volatile",
    label: "고변동",
    badges: ["고변동 자산", "전기차 성장주", "레버리지 ETF", "반도체 3배"],
  },
  { id: "future", label: "미래 테마", badges: ["미래 테마", "전력·에너지", "로봇·양자", "AI 전력"] },
];

function getRecommendedComparisonCategory(categoryId: RecommendedComparisonCategoryId) {
  return (
    RECOMMENDED_COMPARISON_CATEGORIES.find((category) => category.id === categoryId) ??
    RECOMMENDED_COMPARISON_CATEGORIES[0]
  );
}

function matchesRecommendedComparisonCategory(
  comparison: (typeof DESKTOP_RECOMMENDED_COMPARISONS)[number],
  categoryId: RecommendedComparisonCategoryId,
) {
  if (categoryId === "all") {
    return true;
  }

  return getRecommendedComparisonCategory(categoryId).badges.includes(comparison.badge);
}

const HOME_LEARNING_LINKS = [
  {
    detail: "ETF는 여러 주식이나 자산을 한 번에 담은 상장 펀드입니다. 한 종목을 고르기 어렵거나 시장 전체 흐름을 보고 싶을 때 자주 씁니다.",
    description: "여러 자산을 한 번에 담은 상장 펀드입니다.",
    example: "개별 종목보다 넓은 시장 흐름을 볼 때 유용합니다.",
    href: "/guide#etf",
    id: "etf",
    title: "ETF란?",
  },
  {
    detail: "QQQ는 나스닥100을 따라가는 대표 ETF입니다. 애플, 마이크로소프트, 엔비디아 같은 미국 대형 기술주의 흐름을 볼 때 많이 씁니다.",
    description: "미국 기술주 100개 흐름을 볼 때 자주 쓰는 ETF입니다.",
    example: "처음 보는 분께는 ‘미국 기술주 묶음’이라고 이해하면 충분합니다.",
    href: "/guide#qqq",
    id: "qqq",
    title: "미국 기술주 ETF(QQQ)란?",
  },
  {
    detail: "최대 낙폭은 고점에서 저점까지 얼마나 밀렸는지를 보여주는 비율입니다. 마지막 수익률만 보면 놓치기 쉬운 계좌의 압박을 보여줍니다.",
    description: "고점에서 저점까지 가장 크게 밀린 비율입니다.",
    example: "수익률보다 먼저 봐야 할 위험 지표입니다.",
    href: "/guide#max-drawdown",
    id: "max-drawdown",
    title: "최대 낙폭이 중요한 이유",
  },
  {
    detail: "회복 기간은 크게 떨어진 뒤 이전 고점을 다시 넘기까지 걸린 시간입니다. 같은 수익률이라도 회복 기간이 길면 실제 체감 난이도는 훨씬 높아집니다.",
    description: "떨어진 뒤 다시 고점까지 돌아오는 데 걸린 시간입니다.",
    example: "수익률보다 ‘얼마나 오래 기다렸는지’를 볼 때 중요합니다.",
    href: "/guide#holding-difficulty",
    id: "recovery-period",
    title: "회복 기간이란?",
  },
  {
    detail: "적립식은 매달 같은 금액을 꾸준히 넣는 방식입니다. 한 번에 사는 것보다 속도는 느릴 수 있지만, 가격이 흔들릴 때도 계속 모아가는 감각을 볼 수 있습니다.",
    description: "매달 같은 금액을 넣는 투자 방식입니다.",
    example: "월급에서 남는 돈을 매달 넣는 사람에게 더 익숙한 방식입니다.",
    href: "/guide#monthly",
    id: "monthly-contribution",
    title: "적립식이란?",
  },
] as const;

const BEGINNER_GUIDE_STEPS = [
  {
    body: "RegretZero는 미래를 맞히는 곳이 아닙니다. 10년 전 같은 돈이 어디에 있었는지 되감아보는 시뮬레이터예요.",
    label: "개념",
    title: "10년 전으로 돌아가 봅니다",
  },
  {
    body: "예금, 금, 삼성전자, 테슬라처럼 익숙한 자산 두 개를 고르면 됩니다. 어려운 종목명을 몰라도 시작할 수 있어요.",
    label: "1",
    title: "두 자산을 고르세요",
  },
  {
    body: "같은 금액으로 시작했을 때 마지막 금액, 중간 하락, 회복까지 같이 보여드립니다.",
    label: "2",
    title: "같은 돈으로 비교해요",
  },
  {
    body: "결과만 보면 쉬워 보입니다. 그래서 RegretZero는 10년 동안 기다려야 했던 시간까지 같이 보여줘요.",
    label: "3",
    title: "돈보다 과정을 봅니다",
  },
] as const;

const BEGINNER_GUIDE_BOARD_SECTIONS = [
  {
    id: "concept",
    label: "개념",
    title: "이 사이트는 뭐예요?",
    summary: "10년 전 같은 돈의 결과를 보는 시뮬레이터예요.",
  },
  {
    id: "steps",
    label: "사용법",
    title: "어떻게 시작해요?",
    summary: "두 자산을 고르고, 금액을 정하면 바로 레이스가 시작돼요.",
  },
  {
    id: "terms",
    label: "용어",
    title: "용어가 어려워요?",
    summary: "ETF, QQQ, 최대 낙폭처럼 헷갈리는 말만 짧게 풀어드려요.",
  },
] as const;

function isSyntheticComparisonAsset(assetId: ComparisonAssetId) {
  return assetId === "deposit" || assetId === "seoul_apt" || assetId === "gangnam_gu_apt";
}

function hasApproximationNotice(asset: AssetOption) {
  return Boolean(asset.approximationNotice);
}

function isRealEstateAsset(asset: AssetOption) {
  return asset.category === "부동산";
}

function supportsDetailChartMode(asset: AssetOption) {
  return (
    asset.category === "미국ETF" ||
    asset.category === "미국주식" ||
    asset.category === "한국ETF" ||
    asset.category === "한국주식" ||
    asset.category === "코인"
  );
}

function normalizeMainComparisonSelection(assetIds: ComparisonAssetId[]) {
  return normalizePresetSelection(assetIds).slice(0, MAIN_COMPARISON_ASSET_LIMIT);
}

function canAddAnotherMainAsset(assetIds: ComparisonAssetId[]) {
  return normalizeMainComparisonSelection(assetIds).length < MAIN_COMPARISON_ASSET_LIMIT;
}

function isMainComparisonSelectionFull(assetIds: ComparisonAssetId[]) {
  return normalizeMainComparisonSelection(assetIds).length >= MAIN_COMPARISON_ASSET_LIMIT;
}

function toggleMainComparisonAssetInQueue(
  currentAssetIds: ComparisonAssetId[],
  assetId: ComparisonAssetId,
) {
  const currentMainAssetIds = normalizeMainComparisonSelection(currentAssetIds);

  if (currentMainAssetIds.includes(assetId)) {
    return {
      nextAssetIds: currentMainAssetIds.filter((currentAssetId) => currentAssetId !== assetId),
      removedAssetId: assetId,
      type: "removed" as const,
    };
  }

  if (currentMainAssetIds.length < MAIN_COMPARISON_ASSET_LIMIT) {
    return {
      nextAssetIds: [...currentMainAssetIds, assetId],
      removedAssetId: null,
      type: "added" as const,
    };
  }

  const [removedAssetId, ...remainingAssetIds] = currentMainAssetIds;

  return {
    nextAssetIds: [...remainingAssetIds, assetId],
    removedAssetId: removedAssetId ?? null,
    type: "replaced" as const,
  };
}

function getSelectedQueueLabel(asset: AssetOption) {
  return isRealEstateAsset(asset) ? `${asset.label} (근사값 적용)` : asset.label;
}

function getSelectedQueueSummary(asset: AssetOption) {
  return asset.selectedSummary ?? asset.description;
}

function getResultCardAssetLabel(asset: AssetOption) {
  if (isRealEstateAsset(asset)) {
    return `${asset.label} (근사값)`;
  }

  if (asset.id === "deposit") {
    return `${asset.label} (가정값)`;
  }

  return asset.label;
}

function getHomeIntroAssetLabel(asset: AssetOption) {
  if (asset.id === "aapl") {
    return "애플";
  }

  if (asset.id === "nvda") {
    return "엔비디아";
  }

  if (asset.id === "tsla") {
    return "테슬라";
  }

  if (asset.id === "qqq") {
    return "나스닥 100 ETF (QQQ)";
  }

  return asset.label;
}

function getHomeIntroSelectedLabel(asset: AssetOption) {
  if (asset.id === "aapl") {
    return "애플";
  }

  if (asset.id === "nvda") {
    return "엔비디아";
  }

  if (asset.id === "tsla") {
    return "테슬라";
  }

  if (asset.id === "qqq") {
    return "나스닥 100 ETF (QQQ)";
  }

  return getSelectedQueueLabel(asset);
}

function getHomeIntroSelectedDescription(asset: AssetOption) {
  if (asset.id === "deposit") {
    return "연 2.7% 복리 가정";
  }

  if (asset.id === "005930") {
    return "한국 대표 기업";
  }

  if (asset.id === "aapl") {
    return "미국 대표 기업";
  }

  if (asset.id === "nvda") {
    return "AI 반도체 대표 기업";
  }

  if (asset.id === "tsla") {
    return "전기차·AI 성장주";
  }

  if (asset.id === "qqq") {
    return "미국 기술주 중심 ETF";
  }

  if (asset.id === "gangnam_gu_apt") {
    return "강남구 상승 체감 반영";
  }

  if (asset.id === "gold") {
    return "대표 안전자산";
  }

  if (asset.id === "000660") {
    return "한국 대표 반도체 기업";
  }

  return getSelectedQueueSummary(asset);
}

function getDirectPickAssetBadge(asset: AssetOption) {
  if (asset.id === "deposit") {
    return "안전자산";
  }

  if (asset.id === "gold" || asset.id === "silver") {
    return "실물자산";
  }

  if (asset.id === "btc" || asset.id === "eth") {
    return "코인";
  }

  if (isRealEstateAsset(asset)) {
    return "부동산";
  }

  if (POPULAR_ETF_BROWSER_ASSET_SET.has(asset.id) || asset.label.includes("ETF")) {
    return asset.usesUsdFx ? "미국 ETF" : "한국 ETF";
  }

  if (asset.usesUsdFx) {
    return "미국 주식";
  }

  return asset.assetTypeBadge ?? asset.category;
}

function getComparisonAssetIdsLabel(assetIds: ComparisonAssetId[]) {
  return assetIds
    .map((assetId) => assetCatalog[assetId]?.shortLabel ?? assetCatalog[assetId]?.label ?? assetId)
    .join(" vs ");
}

function getKstDateSeedKey(now = new Date()) {
  const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kstDate.toISOString().slice(0, 10);
}

function getSeededHash(seedKey: string) {
  let hash = 2166136261;

  for (let index = 0; index < seedKey.length; index += 1) {
    hash ^= seedKey.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seedKey: string) {
  let state = getSeededHash(seedKey) || 1;

  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seedKey: string) {
  const random = createSeededRandom(seedKey);
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
  }

  return shuffled;
}

function isEtfAsset(asset: AssetOption | undefined) {
  return asset?.category === "미국ETF" || asset?.category === "한국ETF";
}

function isIndividualStockAsset(asset: AssetOption | undefined) {
  return asset?.category === "미국주식" || asset?.category === "한국주식";
}

function appendUniqueAssetIds(
  target: ComparisonAssetId[],
  candidates: ComparisonAssetId[],
  limit: number,
) {
  for (const assetId of candidates) {
    if (target.length >= limit) {
      break;
    }

    if (!target.includes(assetId)) {
      target.push(assetId);
    }
  }
}

function buildDailyDirectPickAssetIds(seedKey = getKstDateSeedKey()) {
  const uniquePool = Array.from(new Set(HOME_DIRECT_PICK_DAILY_POOL_IDS)).filter((assetId) => {
    const asset = assetCatalog[assetId];
    return Boolean(asset?.isAvailable && FREE_PLAN_ASSET_SET.has(assetId));
  });

  const picked = HOME_DIRECT_PICK_CORE_ASSET_IDS.filter((assetId) => uniquePool.includes(assetId));
  const coreAssetIdSet = new Set<ComparisonAssetId>(picked);
  const randomPool = uniquePool.filter((assetId) => !coreAssetIdSet.has(assetId));
  const stockPool = randomPool.filter((assetId) => isIndividualStockAsset(assetCatalog[assetId]));
  const etfPool = randomPool.filter((assetId) => isEtfAsset(assetCatalog[assetId]));
  const benchmarkPool = randomPool.filter((assetId) => {
    const asset = assetCatalog[assetId];
    return !isIndividualStockAsset(asset) && !isEtfAsset(asset);
  });

  appendUniqueAssetIds(
    picked,
    seededShuffle(stockPool, `direct-pick:stocks:${seedKey}`).slice(0, HOME_DIRECT_PICK_STOCK_TARGET),
    HOME_DIRECT_PICK_ASSET_COUNT,
  );
  appendUniqueAssetIds(
    picked,
    seededShuffle(benchmarkPool, `direct-pick:benchmarks:${seedKey}`).slice(
      0,
      HOME_DIRECT_PICK_BENCHMARK_TARGET,
    ),
    HOME_DIRECT_PICK_ASSET_COUNT,
  );
  appendUniqueAssetIds(
    picked,
    seededShuffle(etfPool, `direct-pick:etfs:${seedKey}`).slice(0, HOME_DIRECT_PICK_ETF_TARGET),
    HOME_DIRECT_PICK_ASSET_COUNT,
  );

  const fallback = HOME_DIRECT_PICK_FALLBACK_ASSET_IDS.filter(
    (assetId) => assetCatalog[assetId]?.isAvailable && !picked.includes(assetId),
  );
  appendUniqueAssetIds(picked, fallback, HOME_DIRECT_PICK_ASSET_COUNT);

  if (picked.length >= HOME_DIRECT_PICK_ASSET_COUNT) {
    return picked;
  }

  appendUniqueAssetIds(
    picked,
    seededShuffle(randomPool, `direct-pick:fallback:${seedKey}`),
    HOME_DIRECT_PICK_ASSET_COUNT,
  );

  return picked.slice(0, HOME_DIRECT_PICK_ASSET_COUNT);
}

const ASSET_BROWSER_LABEL_OVERRIDES: Partial<Record<ComparisonAssetId, string>> = {
  "000660": "SK하이닉스",
  "003670": "포스코퓨처엠",
  "000990": "DB하이텍",
  "005930": "삼성전자",
  "006400": "삼성SDI",
  "009150": "삼성전기",
  "010120": "LS ELECTRIC",
  "015760": "한국전력",
  "017670": "SK텔레콤",
  "018260": "삼성SDS",
  "042700": "한미반도체",
  "051910": "LG화학",
  "058470": "리노공업",
  "066570": "LG전자",
  "079550": "LIG넥스원",
  "086790": "하나금융지주",
  "090360": "로보스타",
  "091160": "KODEX 반도체 ETF",
  "095340": "ISC",
  "098460": "고영",
  "102110": "TIGER 200 ETF",
  "133690": "TIGER 미국나스닥100 ETF",
  "196170": "알테오젠",
  "229200": "KODEX KOSDAQ150 ETF",
  "267260": "HD현대일렉트릭",
  "277810": "레인보우로보틱스",
  "403870": "HPSP",
  aapl: "Apple",
  amd: "AMD",
  amzn: "Amazon",
  arm: "ARM",
  asml: "ASML",
  avgo: "Broadcom",
  botz: "로봇·AI ETF (BOTZ)",
  btc: "비트코인",
  ceg: "Constellation Energy",
  crwd: "CrowdStrike",
  deposit: "예금",
  eth: "이더리움",
  fslr: "First Solar",
  gangnam_gu_apt: "강남구 아파트",
  gold: "금",
  ivv: "미국 S&P500 ETF (IVV)",
  jepi: "미국 월배당 ETF (JEPI)",
  ionq: "IonQ",
  isrg: "Intuitive Surgical",
  klac: "KLA",
  lrcx: "Lam Research",
  meta: "Meta",
  mrvl: "Marvell",
  msft: "Microsoft",
  mu: "Micron",
  nee: "NextEra Energy",
  nvda: "NVIDIA",
  pltr: "Palantir",
  qbts: "D-Wave Quantum",
  qqq: "나스닥 100 ETF (QQQ)",
  qqqm: "나스닥 100 ETF (QQQM)",
  qtum: "양자컴퓨팅 ETF (QTUM)",
  rgti: "Rigetti",
  rok: "Rockwell Automation",
  seoul_apt: "서울 아파트",
  silver: "은",
  smci: "Super Micro Computer",
  smh: "미국 반도체 ETF (SMH)",
  snow: "Snowflake",
  spy: "미국 S&P500 ETF (SPY)",
  ter: "Teradyne",
  tsla: "Tesla",
  tsm: "TSMC",
  voo: "미국 S&P500 ETF (VOO)",
  vti: "미국 전체 주식 ETF (VTI)",
  vst: "Vistra",
  xle: "미국 에너지 ETF (XLE)",
  xlu: "미국 유틸리티 ETF (XLU)",
};

const ASSET_BROWSER_DESCRIPTION_OVERRIDES: Partial<Record<ComparisonAssetId, string>> = {
  "000990": "시스템 반도체 파운드리 기업",
  "000660": "메모리 반도체 대표 성장주",
  "003670": "배터리 소재 대표 기업",
  "005930": "한국 대표 대형주",
  "006400": "한국 대표 배터리 기업",
  "009150": "MLCC·전자부품 대표 기업",
  "010120": "전력기기·자동화 대표 기업",
  "015760": "한국 대표 전력 공기업",
  "017670": "한국 대표 통신 기업",
  "018260": "클라우드·IT서비스 대표 기업",
  "042700": "AI 반도체 장비 대표 기업",
  "069500": "국내 대표 지수 ETF",
  "058470": "반도체 테스트 소켓 대표 기업",
  "079550": "방산·첨단 무기체계 대표 기업",
  "086790": "한국 대표 금융지주",
  "090360": "산업용 로봇·자동화 기업",
  "091160": "한국 반도체 대표 ETF",
  "095340": "반도체 테스트 소켓 기업",
  "098460": "검사장비·스마트팩토리 기업",
  "102110": "한국 대표 지수 ETF",
  "133690": "미국 나스닥100 추종 ETF",
  "196170": "바이오 플랫폼 성장주",
  "229200": "코스닥 대표 지수 ETF",
  "267260": "전력기기·변압기 대표 기업",
  "277810": "한국 협동로봇 대표 성장주",
  "403870": "반도체 장비 성장주",
  aapl: "아이폰으로 유명한 미국 대표 기업",
  amd: "AI·반도체 대표 성장주",
  amzn: "미국 대표 커머스·클라우드 기업",
  arm: "반도체 설계 IP 대표 기업",
  asml: "첨단 반도체 장비 대표 기업",
  avgo: "AI 인프라·반도체 대표 기업",
  botz: "로봇과 AI 기업을 담은 ETF",
  btc: "대표적인 디지털 자산",
  ceg: "원전·전력 인프라 대표 기업",
  crwd: "클라우드 보안 대표 기업",
  deposit: "원금 손실 위험이 낮은 기준 비교 자산",
  eth: "스마트계약 대표 코인",
  fslr: "미국 태양광 대표 기업",
  gangnam_gu_apt: "강남구 상승 체감을 반영한 부동산 비교값",
  gold: "대표적인 안전자산",
  ivv: "미국 S&P500 대표 ETF",
  jepi: "월배당 중심 인컴 ETF",
  ionq: "양자컴퓨터 대표 성장주",
  isrg: "수술 로봇 대표 기업",
  klac: "반도체 검사·계측 장비 기업",
  lrcx: "반도체 공정 장비 대표 기업",
  meta: "플랫폼·AI 대표 대형 기술주",
  mrvl: "데이터센터 반도체 성장주",
  msft: "클라우드·AI 대표 대형주",
  mu: "미국 대표 메모리 반도체 기업",
  nee: "유틸리티·재생에너지 대표 기업",
  nvda: "AI 반도체 대표 기업",
  pltr: "AI·데이터 분석 소프트웨어 기업",
  qbts: "양자컴퓨팅 하드웨어 기업",
  qqq: "미국 나스닥 100 대표 ETF",
  qqqm: "나스닥100 저비용 ETF",
  qtum: "양자컴퓨팅 테마 ETF",
  rgti: "양자컴퓨터 고변동 성장주",
  rok: "산업 자동화 대표 기업",
  seoul_apt: "서울 상승 체감을 반영한 부동산 비교값",
  silver: "금보다 변동성이 큰 대표 귀금속 자산",
  smci: "AI 서버 인프라 성장주",
  smh: "미국 반도체 대표 ETF",
  snow: "데이터 클라우드 소프트웨어 기업",
  spy: "미국 S&P500 대표 ETF",
  ter: "반도체 테스트·자동화 기업",
  tsla: "전기차·AI 대표 성장주",
  tsm: "글로벌 파운드리 대표 기업",
  usd: "달러 흐름을 보는 비교 자산",
  voo: "미국 S&P500 대표 ETF",
  vti: "미국 전체 주식시장 ETF",
  vst: "AI 전력 수요 테마 기업",
  xle: "미국 에너지 업종 ETF",
  xlu: "미국 유틸리티 업종 ETF",
};

function getAssetBrowserLabel(asset: AssetOption) {
  return ASSET_BROWSER_LABEL_OVERRIDES[asset.id] ?? asset.label;
}

function getAssetBrowserDescription(asset: AssetOption) {
  const override = ASSET_BROWSER_DESCRIPTION_OVERRIDES[asset.id];
  if (override) {
    return override;
  }

  const amountInfoLine = getAmountInfoFallbackLine(asset);
  if (amountInfoLine) {
    return amountInfoLine.replace(/[.]?입니다[.]?$/, "").trim();
  }

  if (isRealEstateAsset(asset)) {
    return `${asset.description}을 반영한 비교 자산`;
  }

  return asset.description;
}

function getAssetBrowserCategoryLabel(asset: AssetOption) {
  if (asset.id === "deposit") {
    return "기준 비교 자산";
  }

  if (isRealEstateAsset(asset)) {
    return "부동산 프록시";
  }

  if (asset.category === "미국ETF" || asset.category === "한국ETF") {
    return "ETF";
  }

  return asset.category;
}

function getAssetBrowserTickerLabel(asset: AssetOption) {
  return asset.marketTicker ?? asset.shortLabel ?? asset.id.toUpperCase();
}

function normalizeAssetSearchQuery(query: string) {
  return query.trim().toLowerCase();
}

function assetMatchesSearch(asset: AssetOption, query: string) {
  if (!query) {
    return true;
  }

  const normalizedQuery = normalizeAssetSearchQuery(query);
  const searchSource = [
    asset.id,
    asset.label,
    asset.shortLabel,
    asset.marketTicker,
    getAssetBrowserLabel(asset),
    getAssetBrowserDescription(asset),
    getAssetBrowserCategoryLabel(asset),
    ...asset.searchTerms,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchSource.includes(normalizedQuery);
}

function getAmountInfoText(asset: AssetOption) {
  return asset.amountInfo ?? `${asset.label}: ${asset.description}입니다.`;
}

const RESULT_INFO_FALLBACKS: Partial<Record<ComparisonAssetId, string[]>> = {
  "000660": [
    "한국 대표 메모리 반도체 기업입니다.",
    "메모리 업황과 AI 서버 수요의 영향을 크게 받는 자산입니다.",
  ],
  aapl: [
    "아이폰으로 유명한 미국 대표 기업입니다.",
    "하드웨어와 서비스 생태계가 함께 성장하는 자산입니다.",
  ],
  btc: [
    "대표적인 디지털 자산입니다.",
    "상승 가능성과 큰 변동성을 함께 가진 자산입니다.",
  ],
  deposit: [
    "연 2.7% 복리 가정 기준의 비교 자산입니다.",
    "변동성은 낮지만 장기 기대수익도 제한적인 편입니다.",
  ],
  gangnam_gu_apt: [
    "강남구 상승 체감을 반영한 비교값입니다.",
    "실제 개별 아파트 가격과는 차이가 있을 수 있습니다.",
  ],
  gold: [
    "대표적인 안전자산입니다.",
    "위기 국면에서 방어 자산으로 자주 언급됩니다.",
  ],
  nvda: [
    "AI 반도체 대표 기업입니다.",
    "데이터센터와 GPU 수요 기대가 크게 반영되는 자산입니다.",
  ],
  qqq: [
    "미국 기술주 중심 ETF입니다.",
    "대형 기술주의 장기 흐름을 넓게 담는 자산입니다.",
  ],
  tsla: [
    "미국 전기차·AI 성장주입니다.",
    "상승폭이 클 수 있지만 변동성도 큰 자산입니다.",
  ],
};

function getAmountInfoFallbackLine(asset: AssetOption) {
  if (!asset.amountInfo) {
    return null;
  }

  const prefix = `${asset.label}: `;
  return asset.amountInfo.startsWith(prefix) ? asset.amountInfo.slice(prefix.length) : asset.amountInfo;
}

function getResultInfoLines(asset: AssetOption) {
  if (asset.resultInfoLines && asset.resultInfoLines.length > 0) {
    return asset.resultInfoLines;
  }

  const amountInfoLine = getAmountInfoFallbackLine(asset);
  if (amountInfoLine) {
    return [amountInfoLine];
  }

  const mappedFallback = RESULT_INFO_FALLBACKS[asset.id];
  if (mappedFallback) {
    return mappedFallback;
  }

  if (isRealEstateAsset(asset)) {
    return [
      `${asset.description} 비교값입니다.`,
      "실제 개별 매물 가격이 아닌 평균 흐름 기반 비교입니다.",
    ];
  }

  return [`${asset.description}입니다.`];
}

function isFreePlanAsset(assetId: ComparisonAssetId) {
  return FREE_PLAN_ASSET_SET.has(assetId);
}

function getRaceDurationForSpeed(speed: RaceSpeed) {
  return RACE_SPEED_OPTIONS.find((option) => option.id === speed)?.durationMs ?? RACE_DURATION_MS;
}

function formatDateLabel(date: string) {
  return date.replace(/-/g, ".");
}

function formatSavedDateLabel(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return formatLocalSavedDate(parsedDate);
}

function formatLocalSavedDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join(".");
}

function normalizeDateDraftInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 4) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function isCompleteDateInput(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidInputDate(date: string) {
  if (!isCompleteDateInput(date)) {
    return false;
  }

  const parsed = parseLocalDate(date);
  return Number.isFinite(parsed.getTime()) && formatInputDate(parsed) === date;
}

function parseLocalDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function formatInputDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getDateDiffDays(startDate: string, endDate: string) {
  const start = parseLocalDate(startDate).getTime();
  const end = parseLocalDate(endDate).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }

  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function getApproxMonthDiff(startDate: string, endDate: string) {
  return Math.max(0, Math.round(getDateDiffDays(startDate, endDate) / 30.4375));
}

function formatApproxPeriodLabel(months: number) {
  if (months <= 0) {
    return "1개월 미만";
  }

  if (months < 12) {
    return `약 ${months}개월`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  return remainingMonths > 0
    ? `약 ${years}년 ${remainingMonths}개월`
    : `약 ${years}년`;
}

function shiftDateByMonths(date: string, monthOffset: number) {
  const nextDate = parseLocalDate(date);
  nextDate.setMonth(nextDate.getMonth() + monthOffset);
  return formatInputDate(nextDate);
}

function clampDate(date: string, minDate: string, maxDate: string) {
  if (date < minDate) {
    return minDate;
  }

  if (date > maxDate) {
    return maxDate;
  }

  return date;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let nextY = y;

  words.forEach((word, index) => {
    const testLine = line ? `${line} ${word}` : word;
    const isLastWord = index === words.length - 1;

    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, nextY);
      line = word;
      nextY += lineHeight;
      return;
    }

    line = testLine;

    if (isLastWord) {
      ctx.fillText(line, x, nextY);
    }
  });
}

function formatKrwExact(value: number) {
  return formatKrwCompact(value);
}

function formatMetricPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatMetricMultiple(value: number) {
  return `${value.toFixed(1)}x`;
}

function formatKoreanMultiple(value: number) {
  return `${value.toFixed(1)}배`;
}

function formatRecoverySentence(recovered: boolean, recoveryMonths: number | null) {
  if (!recovered) {
    return "이전 고점은 아직 회복하지 못했습니다";
  }

  if (recoveryMonths === null || recoveryMonths <= 0) {
    return "빠르게 이전 고점을 회복했습니다";
  }

  if (recoveryMonths < 12) {
    return `${recoveryMonths}개월 만에 이전 고점을 회복했습니다`;
  }

  const years = Math.floor(recoveryMonths / 12);
  const months = recoveryMonths % 12;
  const monthText = months > 0 ? ` ${months}개월` : "";
  return `${years}년${monthText} 만에 이전 고점을 회복했습니다`;
}

function formatRecoveryNounPhrase(recovered: boolean, recoveryMonths: number | null) {
  if (!recovered) {
    return "아직 회복하지 못한 구간";
  }

  if (recoveryMonths === null || recoveryMonths <= 0) {
    return "빠른 회복";
  }

  if (recoveryMonths < 12) {
    return `${recoveryMonths}개월의 회복 기간`;
  }

  const years = Math.floor(recoveryMonths / 12);
  const months = recoveryMonths % 12;
  const monthText = months > 0 ? ` ${months}개월` : "";
  return `${years}년${monthText}의 회복 기간`;
}

function buildResultOneLineCopy({
  assetLabel,
  finalValueLabel,
  isMonthlyInvestmentMode,
  maxDrawdownPct,
  multiple,
  recovered,
  recoveryMonths,
}: {
  assetLabel: string;
  finalValueLabel: string;
  isMonthlyInvestmentMode: boolean;
  maxDrawdownPct: number | null;
  multiple: number | null;
  recovered: boolean | null;
  recoveryMonths: number | null;
}) {
  const drawdownAbs = Math.abs(maxDrawdownPct ?? 0);
  const drawdownText = maxDrawdownPct === null ? "" : `${drawdownAbs.toFixed(1)}%`;
  const recoveryText =
    recovered === null ? "" : formatRecoveryNounPhrase(recovered, recoveryMonths);

  if (isMonthlyInvestmentMode) {
    if (maxDrawdownPct === null || drawdownAbs < 10) {
      return `${assetLabel}는 ${finalValueLabel}까지 불어났습니다. 크게 흔들리지 않은 구간에서도, 성과를 만든 건 납입을 멈추지 않은 꾸준함이었습니다.`;
    }

    if (drawdownAbs >= 45) {
      return `${assetLabel}는 ${finalValueLabel}까지 불어났지만, 한때는 ${drawdownText}까지 밀렸습니다. 매달 넣어도 이런 구간은 그대로 지나야 합니다.`;
    }

    return `${assetLabel}는 ${finalValueLabel}까지 불어났습니다. ${drawdownText} 하락에도 매달 같은 기준을 유지했을 때 나온 결과입니다.`;
  }

  if (multiple !== null && multiple < 1) {
    return `${assetLabel}는 끝까지 들고 있어도 원금 아래였습니다. 이번 비교에서는 더 버는 것보다 덜 잃는 선택이 더 현실적인 기준이었습니다.`;
  }

  if (maxDrawdownPct === null || drawdownAbs < 10) {
    return `${assetLabel}는 ${multiple ? formatKoreanMultiple(multiple) : finalValueLabel}가 되었습니다. 큰 폭락보다 조용히 벌어진 격차가 더 눈에 띕니다.`;
  }

  if (drawdownAbs >= 60) {
    return `${assetLabel}는 ${multiple ? formatKoreanMultiple(multiple) : finalValueLabel}가 되었지만, 중간에는 ${drawdownText}까지 밀렸습니다. 멋진 최종 숫자 뒤에 이런 시간이 있었습니다.`;
  }

  if (drawdownAbs >= 45) {
    return `${assetLabel}는 ${multiple ? formatKoreanMultiple(multiple) : finalValueLabel}가 되었습니다. 다만 그 사이에는 ${drawdownText} 하락과 ${recoveryText}가 있었습니다.`;
  }

  if (drawdownAbs >= 25) {
    return `${assetLabel}는 ${multiple ? formatKoreanMultiple(multiple) : finalValueLabel}가 되었습니다. 중간에 ${drawdownText}까지 빠졌다는 사실을 빼면, 이 결과는 너무 쉽게 보입니다.`;
  }

  return `${assetLabel}는 ${multiple ? formatKoreanMultiple(multiple) : finalValueLabel}가 되었습니다. 큰 한 방보다 꾸준히 앞서간 시간이 차이를 만들었습니다.`;
}

function buildResultInsightCopy({
  assetLabel,
  difficultyLabel,
  isMonthlyInvestmentMode,
  maxDrawdownPct,
  multiple,
  recovered,
  recoveryMonths,
}: {
  assetLabel: string;
  difficultyLabel: DifficultyLabel | null;
  isMonthlyInvestmentMode: boolean;
  maxDrawdownPct: number | null;
  multiple: number | null;
  recovered: boolean | null;
  recoveryMonths: number | null;
}) {
  const drawdownAbs = Math.abs(maxDrawdownPct ?? 0);
  const drawdownText = maxDrawdownPct === null ? "" : `${drawdownAbs.toFixed(1)}%`;

  if (isMonthlyInvestmentMode) {
    if (drawdownAbs >= 40) {
      return "적립식은 매수 타이밍 부담을 줄여주지만 하락장을 없애주지는 않습니다. 성과는 흔들리는 달에도 계획을 계속 살려둘 때 만들어집니다.";
    }

    return "적립식의 핵심은 최고점을 맞히는 일이 아니라 계속 넣을 수 있는 금액을 정하는 일입니다. 오래 반복할 수 있어야 결과도 남습니다.";
  }

  if (multiple !== null && multiple < 1) {
    return "오래 들고 있었다고 항상 보상받는 것은 아닙니다. 무엇을 살지와 어디까지 견딜 수 있는지를 같이 봐야 합니다.";
  }

  if (recovered === false) {
    return `${assetLabel}는 아직 이전 고점을 회복하지 못했습니다. 낙관보다 먼저 필요한 건 이 기다림을 감당할 기준입니다.`;
  }

  if (drawdownAbs >= 60) {
    return `${drawdownText} 하락은 결과를 알고 봐도 무거운 숫자입니다. 최종 수익보다 더 현실적인 질문은 그 구간을 지나고도 계좌를 지킬 수 있었는지입니다.`;
  }

  if (drawdownAbs >= 45) {
    return `${assetLabel}의 결과는 컸지만 과정은 거칠었습니다. ${formatRecoverySentence(true, recoveryMonths)}. 이 기다림까지 포함해야 10년이 제대로 보입니다.`;
  }

  if (drawdownAbs >= 25) {
    return `${drawdownText} 하락은 실제 계좌에서는 가볍지 않습니다. 마지막 순위보다 중요한 건 그 구간에서 손을 놓지 않았을지입니다.`;
  }

  if (difficultyLabel === "쉬움") {
    return "이번 비교는 큰 폭락보다 속도 차이가 더 잘 보입니다. 처음 보는 사용자에게도 자산마다 돈이 불어나는 방식이 다르다는 점이 선명합니다.";
  }

  return "마지막 금액만으로는 10년을 설명할 수 없습니다. RegretZero는 그 금액까지 가는 동안 지나야 했던 구간을 함께 보여줍니다.";
}

function formatNativePrice(value: number, currency: "EUR" | "KRW" | "USD") {
  if (currency === "USD") {
    return `$${value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`;
  }

  if (currency === "EUR") {
    return `€${value.toLocaleString("de-DE", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`;
  }

  const hasDecimals = Math.abs(value - Math.round(value)) > 0.001;
  return `₩${value.toLocaleString("ko-KR", {
    maximumFractionDigits: hasDecimals ? 2 : 0,
    minimumFractionDigits: hasDecimals ? 2 : 0,
  })}`;
}

function findPointOnOrBefore<T extends { date: string }>(points: T[], targetDate: string) {
  let bestMatch: T | null = null;

  for (const point of points) {
    if (point.date <= targetDate) {
      bestMatch = point;
      continue;
    }

    break;
  }

  return bestMatch ?? points[0] ?? null;
}

function findPointOnOrAfter<T extends { date: string }>(points: T[], targetDate: string) {
  for (const point of points) {
    if (point.date >= targetDate) {
      return point;
    }
  }

  return null;
}

function buildPlaybackTimeline(
  points: RacePoint[],
  assetIds: ComparisonAssetId[],
): WeightedPlaybackTimeline {
  return buildNeonPlaybackTimeline(points, assetIds);
}

function getVisibleCountForProgress(
  progress: number,
  totalPoints: number,
  timeline: WeightedPlaybackTimeline,
) {
  return getNeonVisibleCountForProgress(progress, totalPoints, timeline);
}

function getProgressForRacePointIndex(
  points: RacePoint[],
  pointIndex: number,
  timeline: WeightedPlaybackTimeline,
) {
  const timelineIndex = points.findIndex((point) => point.index === pointIndex);

  if (timelineIndex <= 0) {
    return 0;
  }

  if (timelineIndex >= points.length - 1) {
    return 1;
  }

  return Math.max(
    0,
    Math.min(1, (timeline.cumulativeWeights[timelineIndex] ?? 0) / timeline.totalWeight),
  );
}

function StepHeader({ description, onBack, step, title }: StepHeaderProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        {onBack ? (
          <button
            className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-sm text-white/72 transition hover:bg-white/[0.06]"
            onClick={onBack}
            type="button"
          >
            이전
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((dot) => (
            <span
              key={dot}
              className={`h-1.5 rounded-full transition ${
                dot <= step ? "w-5 bg-white" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      <h2 className="mt-5 text-[1.65rem] font-semibold tracking-[-0.05em] text-white sm:mt-6 sm:text-[1.9rem]">
        {title}
      </h2>
      <p className="mt-2 max-w-[30ch] text-[13px] leading-6 text-white/60 sm:mt-3 sm:text-sm">
        {description}
      </p>
    </div>
  );
}

function DataStartNotice({ notice }: { notice: StartDateAdjustmentNotice | null }) {
  if (!notice) {
    return null;
  }

  return (
    <div className="rounded-[20px] border border-[#8fb7ff]/20 bg-[#8fb7ff]/10 px-4 py-3 text-sm leading-6 text-white/68">
      <div className="font-semibold tracking-[-0.03em] text-white">{notice.title}</div>
      <div className="mt-1">{notice.body}</div>
      <div className="mt-1 text-[12px] leading-5 text-white/46">{notice.detail}</div>
    </div>
  );
}

function BeginnerGuideLinks({ compact = false }: { compact?: boolean }) {
  const [expandedId, setExpandedId] = useState<(typeof HOME_LEARNING_LINKS)[number]["id"] | null>(
    null,
  );

  return (
    <div className="grid gap-2">
      {HOME_LEARNING_LINKS.map((item) => {
        const isExpanded = expandedId === item.id;

        return (
          <article
            className={`rounded-[18px] border px-4 transition ${
              isExpanded
                ? "border-[var(--rz-border-strong)] bg-[var(--rz-accent-soft)]"
                : "border-white/8 bg-white/[0.025] hover:bg-white/[0.05]"
            } ${compact ? "py-3" : "py-3.5"}`}
            key={item.id}
          >
            <button
              aria-expanded={isExpanded}
              className="flex w-full items-center justify-between gap-3 text-left"
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              type="button"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-[-0.03em] text-white">
                  {item.title}
                </div>
                <div className="mt-1 text-xs leading-5 text-white/48">
                  {item.description}
                </div>
              </div>
              <div className="shrink-0 rounded-full border border-[var(--rz-border-strong)] px-3 py-1 text-xs font-semibold text-[var(--rz-accent)]">
                {isExpanded ? "닫기" : "보기"}
              </div>
            </button>

            {isExpanded ? (
              <div className="mt-3 rounded-[16px] border border-white/8 bg-black/[0.08] px-4 py-3 animate-[fade-in_160ms_ease-out]">
                <p className="text-xs leading-6 text-white/68">{item.detail}</p>
                <p className="mt-2 rounded-2xl bg-[var(--rz-accent-soft)] px-3 py-2 text-xs leading-5 text-[var(--rz-accent)]">
                  {item.example}
                </p>
                <Link
                  className="mt-3 inline-flex text-xs font-semibold text-white/72 underline-offset-4 hover:text-white hover:underline"
                  href={item.href}
                >
                  가이드에서 자세히 보기
                </Link>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function BeginnerGuideBoard({
  compact = false,
  onStartExample,
}: {
  compact?: boolean;
  onStartExample?: () => void;
}) {
  const [activeSectionId, setActiveSectionId] = useState<
    (typeof BEGINNER_GUIDE_BOARD_SECTIONS)[number]["id"] | null
  >(null);

  const activeSection = BEGINNER_GUIDE_BOARD_SECTIONS.find(
    (section) => section.id === activeSectionId,
  );

  return (
    <div className="rounded-[24px] border border-[var(--rz-border-strong)] bg-white/[0.025] p-3">
      <div className="flex items-start justify-between gap-3 px-1 py-1">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--rz-accent)]">
            Beginner Guide
          </div>
          <div className="mt-1 text-lg font-semibold tracking-[-0.05em] text-white">
            처음이라면 30초만 보고 시작하세요
          </div>
          <p className="mt-1 text-xs leading-5 text-white/50">
            필요한 설명만 눌러서 펼쳐볼 수 있어요.
          </p>
        </div>
        <Link
          className="shrink-0 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[var(--rz-accent)] transition hover:bg-white/[0.07]"
          href="/guide"
        >
          전체 보기
        </Link>
      </div>

      <div className="mt-3 grid gap-2">
        {BEGINNER_GUIDE_BOARD_SECTIONS.map((section) => {
          const isActive = activeSectionId === section.id;

          return (
            <button
              aria-expanded={isActive}
              className={`flex w-full items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition ${
                isActive
                  ? "border-[var(--rz-border-strong)] bg-[var(--rz-accent-soft)]"
                  : "border-white/8 bg-white/[0.025] hover:bg-white/[0.05]"
              }`}
              key={section.id}
              onClick={() => setActiveSectionId(isActive ? null : section.id)}
              type="button"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border text-[11px] font-semibold ${
                  isActive
                    ? "border-[var(--rz-border-strong)] bg-white/80 text-[var(--rz-accent)]"
                    : "border-white/8 bg-white/[0.04] text-white/46"
                }`}
              >
                {section.label}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold tracking-[-0.03em] text-white">
                  {section.title}
                </span>
                <span className="mt-1 block text-xs leading-5 text-white/50">
                  {section.summary}
                </span>
              </span>
              <span className="shrink-0 text-lg leading-none text-[var(--rz-accent)]">
                {isActive ? "−" : "+"}
              </span>
            </button>
          );
        })}
      </div>

      {activeSection ? (
        <div className="mt-3 rounded-[20px] border border-white/8 bg-black/[0.08] px-4 py-4 animate-[fade-in_160ms_ease-out]">
          {activeSection.id === "concept" ? (
            <div>
              <div className="text-sm font-semibold tracking-[-0.03em] text-white">
                <strong className="font-semibold text-white">10년 전</strong>으로 돌아가{" "}
                <strong className="font-semibold text-white">같은 돈</strong>의 결과를 봅니다.
              </div>
              <p className="mt-2 text-xs leading-6 text-white/58">
                RegretZero는 미래를 맞히는 곳이 아니라, 자산마다 달랐던{" "}
                <strong className="font-semibold text-white">하락과 회복</strong>을 되감아보는
                시뮬레이터예요.
              </p>
            </div>
          ) : null}

          {activeSection.id === "steps" ? (
            <div className="grid gap-3">
              <div className={`grid gap-2 ${compact ? "" : "sm:grid-cols-3"}`}>
                {BEGINNER_GUIDE_STEPS.slice(1).map((step) => (
                  <div
                    className="rounded-[16px] border border-white/8 bg-white/[0.025] px-3 py-3"
                    key={step.title}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--rz-border-strong)] bg-[var(--rz-accent-soft)] text-[10px] font-semibold text-[var(--rz-accent)]">
                        {step.label}
                      </span>
                      <span className="text-xs font-semibold tracking-[-0.03em] text-white">
                        {step.title}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/52">{step.body}</p>
                  </div>
                ))}
              </div>
              {onStartExample ? (
                <div className="rounded-[22px] border border-white/8 bg-white/[0.025] p-3">
                  <IntroGuidedTutorial onStartExample={onStartExample} />
                </div>
              ) : null}
            </div>
          ) : null}

          {activeSection.id === "terms" ? (
            <div>
              <div className="mb-3 text-xs leading-5 text-white/58">
                <strong className="font-semibold text-white">ETF</strong>나{" "}
                <strong className="font-semibold text-white">최대 낙폭</strong>처럼 헷갈리는 말만
                짧게 정리했어요.
              </div>
              <BeginnerGuideLinks compact={compact} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RecommendedComparisonList({
  initialLimit,
  onSelect,
}: {
  initialLimit: number;
  onSelect: (assetIds: ComparisonAssetId[]) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategoryId, setActiveCategoryId] =
    useState<RecommendedComparisonCategoryId>("all");
  const filteredComparisons = DESKTOP_RECOMMENDED_COMPARISONS.filter((comparison) =>
    matchesRecommendedComparisonCategory(comparison, activeCategoryId),
  );
  const visibleComparisons = isExpanded
    ? filteredComparisons
    : filteredComparisons.slice(0, initialLimit);
  const hiddenCount = filteredComparisons.length - visibleComparisons.length;

  return (
    <div>
      <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {RECOMMENDED_COMPARISON_CATEGORIES.map((category) => {
          const isActive = category.id === activeCategoryId;

          return (
            <button
              key={category.id}
              className={`min-h-9 shrink-0 whitespace-nowrap rounded-full border transition ${
                isActive
                  ? "border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                  : "border-slate-300 bg-white px-3 text-xs font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900"
              }`}
              onClick={() => {
                setActiveCategoryId(category.id);
                setIsExpanded(false);
              }}
              type="button"
            >
              {category.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3">
        {visibleComparisons.map((comparison) => (
          <button
            className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]"
            key={comparison.title}
            onClick={() => onSelect(comparison.assetIds)}
            type="button"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold tracking-[-0.01em] text-[var(--rz-accent)]">
                {comparison.badge}
              </div>
              <div className="rounded-full border border-[var(--rz-border-strong)] bg-[var(--rz-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--rz-accent)]">
                {comparison.ctaLabel}
              </div>
            </div>
            <div className="mt-2 text-sm font-semibold leading-5 tracking-[-0.02em] text-white">
              {comparison.title}
            </div>
            <div className="mt-2 text-xs leading-5 text-white/54">
              {comparison.description}
            </div>
          </button>
        ))}
      </div>

      {filteredComparisons.length > initialLimit ? (
        <button
          className="mt-3 min-h-11 w-full rounded-full border border-white/8 bg-white/[0.025] px-4 text-sm font-semibold text-white/64 transition hover:bg-white/[0.05] hover:text-white"
          onClick={() => setIsExpanded((previous) => !previous)}
          type="button"
        >
          {isExpanded ? "접기" : `${hiddenCount}개 더 보기`}
        </button>
      ) : null}
    </div>
  );
}

function HomeScenarioGrid({
  onSelect,
  scenarios = HOME_PRIMARY_SCENARIOS,
  twoColumnOnWide = false,
}: {
  onSelect: (scenario: HomeScenario) => void;
  scenarios?: HomeScenario[];
  twoColumnOnWide?: boolean;
}) {
  return (
    <div className={`grid grid-cols-2 gap-2.5 ${twoColumnOnWide ? "xl:grid-cols-2" : ""}`}>
      {scenarios.map((scenario) => {
        const isSolo = scenario.mode === "solo";
        const actionLabel = isSolo ? "예금 기준 추적" : "맞대결";

        return (
          <button
            className="group relative min-h-[104px] overflow-hidden rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3.5 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.06] hover:shadow-[0_18px_40px_rgba(15,23,42,0.14)]"
            key={`${scenario.mode}-${scenario.title}`}
            onClick={() => onSelect(scenario)}
            type="button"
          >
            <div className="flex h-full flex-col justify-between gap-3">
              <div>
                <div className="line-clamp-1 text-[10px] font-semibold tracking-[-0.01em] text-white/44">
                  {scenario.badge}
                </div>
                <div className="mt-2 break-keep text-[1.02rem] font-semibold leading-5 tracking-[-0.045em] text-white">
                  {scenario.title}
                </div>
                <div className="mt-2 line-clamp-2 text-[11px] leading-4 text-white/48">
                  {scenario.description}
                </div>
              </div>
              <div className="flex items-center justify-start gap-2">
                <div className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-white/46">
                  {actionLabel}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TrendRankingTicker({
  matchups,
  onSelect,
}: {
  matchups: SyncedMatchup[];
  onSelect?: (assetIds: ComparisonAssetId[]) => void;
}) {
  const visibleMatchups = matchups.length > 0 ? matchups : buildSyncedMatchupDeck(10);
  const marqueeChips = [...visibleMatchups, ...visibleMatchups];

  return (
    <div aria-label="오늘 많이 돌려본 매치업" className="overflow-hidden">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        오늘 많이 돌려본 매치업
      </div>
      <div className="rounded-[18px] border border-slate-200 bg-white/70 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="rz-marquee-track flex w-max gap-2 px-2">
          {marqueeChips.map((chip, index) => (
            <button
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold tracking-[-0.02em] text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
              key={`${chip.id}-${index}`}
              onClick={() => onSelect?.(chip.assetIds)}
              type="button"
            >
              {chip.rank}위 {chip.label} · 오늘 {chip.viewers.toLocaleString("ko-KR")}명이 확인
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function IntroGuidedTutorial({
  onStartExample,
}: {
  onStartExample: () => void;
}) {
  const steps = [
    {
      id: "pick",
      label: "고르기",
      title: "두 자산을 고릅니다",
      body: "처음이라면 차이가 잘 보이는 조합부터 시작해도 됩니다.",
    },
    {
      id: "amount",
      label: "넣기",
      title: "같은 돈으로 출발합니다",
      body: "두 자산 모두 같은 시작금액으로 과거에 넣었다고 봅니다.",
    },
    {
      id: "result",
      label: "읽기",
      title: "돈과 시간을 같이 봅니다",
      body: "최종 금액만 보지 않고, 하락과 회복까지 함께 읽습니다.",
    },
  ] as const;
  const [activeStepId, setActiveStepId] = useState<(typeof steps)[number]["id"]>("pick");
  const activeIndex = steps.findIndex((step) => step.id === activeStepId);
  const activeStep = steps[activeIndex] ?? steps[0]!;
  const nextStep = steps[Math.min(activeIndex + 1, steps.length - 1)]!;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--rz-accent)]">
            30초 튜토리얼
          </div>
          <div className="mt-2 text-xl font-semibold tracking-[-0.055em] text-[var(--rz-text-primary)]">
            눌러보면 바로 이해돼요
          </div>
          <div className="mt-1 text-sm leading-6 text-[var(--rz-text-secondary)]">
            예금과 미국 기술주 ETF로 선택부터 결과까지 짧게 체험합니다.
          </div>
        </div>
        <div className="rounded-full border border-[var(--rz-border)] bg-[var(--rz-surface-card-elevated)] px-3 py-1 text-[11px] text-[var(--rz-text-secondary)]">
          {activeIndex + 1} / 3
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 rounded-[18px] border border-[var(--rz-border)] bg-[var(--rz-surface-card-elevated)] p-1.5">
        {steps.map((step) => {
          const isActive = activeStepId === step.id;
          return (
            <button
              className={`min-h-10 rounded-[15px] px-2 text-[11px] font-semibold tracking-[-0.02em] transition ${
                isActive
                  ? "bg-[var(--rz-accent)] text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)]"
                  : "text-white/48 hover:bg-white/[0.05] hover:text-white/72"
              }`}
              key={step.id}
              onClick={() => setActiveStepId(step.id)}
              type="button"
            >
              {step.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-[24px] border border-[var(--rz-border)] bg-[var(--rz-surface-card-elevated)] p-3.5">
        {activeStep.id === "pick" ? (
          <div className="grid grid-cols-2 gap-2">
            {[
              ["예금", "기준"],
              ["미국 기술주 ETF", "성장"],
            ].map(([title, description], index) => (
              <div
                className="min-h-[92px] rounded-[18px] border px-3 py-3"
                key={title}
                style={{
                  backgroundColor: getComparisonSlotGlow(index, 0.12),
                  borderColor: `${getComparisonSlotColor(index)}55`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{
                      backgroundColor: `${getComparisonSlotColor(index)}22`,
                      color: getComparisonSlotColor(index),
                    }}
                  >
                    {index + 1}
                  </div>
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-[var(--rz-text-secondary)]">
                    {description}
                  </span>
                </div>
                <div className="mt-3 break-keep text-sm font-semibold tracking-[-0.035em] text-[var(--rz-text-primary)]">
                  {title}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {activeStep.id === "amount" ? (
          <div className="rounded-[18px] border border-[var(--rz-border-strong)] bg-[var(--rz-accent-soft)] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[var(--rz-accent)]">시작 금액</div>
                <div className="mt-1 text-[2rem] font-semibold tracking-[-0.065em] text-[var(--rz-text-primary)]">
                  1,000만원
                </div>
              </div>
              <div className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-[var(--rz-text-secondary)]">
                같은 출발선
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/70">
              <div className="h-2 w-full rounded-full bg-[var(--rz-accent)]" />
            </div>
          </div>
        ) : null}

        {activeStep.id === "result" ? (
          <div className="grid grid-cols-3 gap-2">
            {[
              ["최종 금액", "돈"],
              ["최대 낙폭", "하락"],
              ["회복 기간", "시간"],
            ].map(([title, badge]) => (
              <div
                className="min-h-[88px] rounded-[18px] border border-[var(--rz-border)] bg-white/70 px-3 py-3"
                key={title}
              >
                <div className="text-[10px] font-semibold text-[var(--rz-accent)]">{badge}</div>
                <div className="mt-2 break-keep text-[13px] font-semibold leading-4 tracking-[-0.03em] text-[var(--rz-text-primary)]">
                  {title}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-[22px] border border-[var(--rz-border)] bg-white/55 px-4 py-3">
        <div className="text-base font-semibold tracking-[-0.04em] text-[var(--rz-text-primary)]">
          {activeStep.title}
        </div>
        <div className="mt-1 text-sm leading-6 text-[var(--rz-text-secondary)]">{activeStep.body}</div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-2 sm:grid-cols-2">
        <button
          className="btn-accent min-h-12 rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition"
          onClick={onStartExample}
          type="button"
        >
          예시로 바로 시작
        </button>
        <button
          className="btn-secondary min-h-12 rounded-full px-3 text-sm font-semibold text-[var(--rz-accent)] transition sm:px-5"
          onClick={() => setActiveStepId(activeStep.id === "result" ? "pick" : nextStep.id)}
          type="button"
        >
          {activeStep.id === "result" ? "처음부터 보기" : "다음 보기"}
        </button>
      </div>
    </div>
  );
}

function SoloAssetGrid({
  assets,
  onSelect,
  selectedAssetId,
}: {
  assets: AssetOption[];
  onSelect: (assetId: ComparisonAssetId) => void;
  selectedAssetId: ComparisonAssetId | null;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {assets.map((asset) => {
        const isSelected = selectedAssetId === asset.id;

        return (
          <button
            aria-pressed={isSelected}
            className="min-h-[76px] rounded-[18px] border px-2.5 py-2.5 text-left transition hover:bg-white/[0.045]"
            key={asset.id}
            onClick={() => onSelect(asset.id)}
            style={{
              backgroundColor: isSelected
                ? getComparisonSlotGlow(0, 0.14)
                : "rgba(255,255,255,0.025)",
              borderColor: isSelected ? `${getComparisonSlotColor(0)}66` : "rgba(255,255,255,0.08)",
            }}
            type="button"
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/36">
                {getDirectPickAssetBadge(asset)}
              </span>
              {isSelected ? (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--rz-accent-soft)] text-[10px] font-semibold text-[var(--rz-accent)]">
                  1
                </span>
              ) : null}
            </div>
            <div className="mt-2 break-keep text-[13px] font-semibold leading-4 tracking-[-0.035em] text-white">
              {asset.shortLabel ?? asset.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DirectPickAssetGrid({
  assets,
  className = "",
  onAssetToggle,
  selectedAssetIds,
}: {
  assets: AssetOption[];
  className?: string;
  onAssetToggle: (assetId: ComparisonAssetId) => void;
  selectedAssetIds: ComparisonAssetId[];
}) {
  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {assets.map((asset) => {
        const selectedIndex = selectedAssetIds.indexOf(asset.id);
        const isSelected = selectedIndex >= 0;
        const slotColor = isSelected ? getComparisonSlotColor(selectedIndex) : null;
        const slotGlow = isSelected ? getComparisonSlotGlow(selectedIndex, 0.14) : null;

        return (
          <button
            key={asset.id}
            aria-pressed={isSelected}
            className="min-h-[72px] rounded-[18px] border px-2.5 py-2.5 text-left transition hover:bg-white/[0.045]"
            onClick={() => onAssetToggle(asset.id)}
            style={{
              backgroundColor: isSelected
                ? slotGlow ?? "rgba(255,255,255,0.03)"
                : "rgba(255,255,255,0.025)",
              borderColor: isSelected ? `${slotColor}66` : "rgba(255,255,255,0.08)",
            }}
            type="button"
          >
            <div className="flex min-h-5 items-start justify-between gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/36">
                {getDirectPickAssetBadge(asset)}
              </span>
              {isSelected ? (
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                  style={{
                    backgroundColor: `${slotColor}22`,
                    color: slotColor ?? "#ffffff",
                  }}
                >
                  {selectedIndex + 1}
                </span>
              ) : null}
            </div>
            <div className="mt-2 break-keep text-[13px] font-semibold leading-4 tracking-[-0.035em] text-white">
              {asset.shortLabel ?? asset.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface PrimaryNavigationProps {
  activeKey: PrimaryNavKey | null;
  canContinue: boolean;
  onAssets: () => void;
  onCompare: () => void;
  onContinue: () => void;
  onMore: () => void;
  onSaved: () => void;
}

function getPrimaryNavButtonClass(isActive: boolean, variant: "desktop" | "mobile") {
  if (variant === "desktop") {
    return `min-h-10 rounded-full px-4 text-sm font-semibold tracking-[-0.02em] transition ${
      isActive
        ? "bg-indigo-50/70 text-indigo-600 shadow-[0_10px_28px_rgba(79,70,229,0.12)]"
        : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
    }`;
  }

  return `flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-0.5 text-[10px] font-semibold tracking-[-0.04em] transition ${
    isActive
      ? "text-indigo-600"
      : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
  }`;
}

function DesktopPrimaryNav({
  activeKey,
  canContinue,
  onAssets,
  onCompare,
  onContinue,
  onMore,
  onSaved,
}: PrimaryNavigationProps) {
  const navItems: Array<{
    Icon: LucideIcon;
    key: PrimaryNavKey;
    label: string;
    onClick: () => void;
  }> = [
    { Icon: Rocket, key: "compare", label: "그 종목 파보기", onClick: onCompare },
    { Icon: Swords, key: "assets", label: "라이벌 대결", onClick: onAssets },
    { Icon: Archive, key: "saved", label: "내 보관함", onClick: onSaved },
    { Icon: Info, key: "more", label: "서비스 안내", onClick: onMore },
  ];

  return (
    <nav
      aria-label="주요 메뉴"
      className="flex items-center gap-1 rounded-full border border-[var(--rz-border)] bg-white/70 p-1 text-sm shadow-[0_12px_38px_rgba(15,23,42,0.08)] backdrop-blur-xl"
    >
      {navItems.map((item) => {
        const isActive = activeKey === item.key;
        const Icon = item.Icon;

        return (
          <button
            aria-current={isActive ? "page" : undefined}
            className={`${getPrimaryNavButtonClass(isActive, "desktop")} inline-flex items-center gap-2`}
            key={item.key}
            onClick={item.onClick}
            type="button"
          >
            <Icon
              aria-hidden="true"
              className={isActive ? "h-4 w-4 text-indigo-600" : "h-4 w-4 text-slate-400"}
              strokeWidth={1.5}
            />
            {item.label}
          </button>
        );
      })}
      {canContinue ? (
        <button
          className="btn-accent ml-1 min-h-10 rounded-full px-4 text-sm font-semibold transition"
          onClick={onContinue}
          type="button"
        >
          이 자산으로 계속
        </button>
      ) : null}
    </nav>
  );
}

function BottomPrimaryNav({
  activeKey,
  onAssets,
  onCompare,
  onMore,
  onSaved,
}: Omit<PrimaryNavigationProps, "canContinue" | "onContinue">) {
  const navItems: Array<{
    Icon: LucideIcon;
    key: PrimaryNavKey;
    label: string;
    onClick: () => void;
  }> = [
    { Icon: Rocket, key: "compare", label: "그 종목", onClick: onCompare },
    { Icon: Search, key: "assets", label: "검색", onClick: onAssets },
    { Icon: Archive, key: "saved", label: "보관함", onClick: onSaved },
    { Icon: Info, key: "more", label: "안내", onClick: onMore },
  ];

  return (
    <nav
      aria-label="하단 주요 메뉴"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)]"
    >
      <div className="surface-floating pointer-events-auto mx-auto flex w-full max-w-[460px] gap-1 rounded-[26px] border border-white/8 p-1.5 shadow-[0_-18px_52px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:max-w-[520px]">
        {navItems.map((item) => {
          const isActive = activeKey === item.key;
          const Icon = item.Icon;

          return (
            <button
              aria-current={isActive ? "page" : undefined}
              className={getPrimaryNavButtonClass(isActive, "mobile")}
              key={item.key}
              onClick={item.onClick}
              type="button"
            >
              <Icon
                aria-hidden="true"
                className={`h-4 w-4 rounded-[12px] p-0.5 ${
                  isActive ? "bg-indigo-50/70 text-indigo-600" : "text-slate-400"
                }`}
                strokeWidth={1.5}
              />
              <span className={isActive ? "whitespace-nowrap text-indigo-600 font-bold" : "whitespace-nowrap text-slate-400"}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function ComplianceNotice({
  className = "",
  compact = false,
  variant = "dark",
}: {
  className?: string;
  compact?: boolean;
  variant?: "dark" | "light";
}) {
  const isLight = variant === "light";

  return (
    <div
      className={`rounded-[20px] border px-4 py-3 text-xs leading-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)] ${
        isLight
          ? "border-[var(--rz-border)] bg-white/90 text-slate-600"
          : "border-sky-200/25 bg-slate-950/72 text-slate-100/82 shadow-[0_16px_42px_rgba(15,23,42,0.26)]"
      } ${className}`}
    >
      <span
        className={`font-semibold ${isLight ? "text-[var(--rz-text-primary)]" : "text-white"}`}
      >
        투자 권유가 아닌 과거 시뮬레이션입니다.
      </span>
      {compact ? " " : <br />}
      과거 기록은 미래 수익을 보장하지 않으며, 실제 투자 판단은 본인 책임입니다.
    </div>
  );
}

function MetricLabel({
  children,
  help,
}: {
  children: ReactNode;
  help?: string;
}) {
  return (
    <div className="relative flex items-center gap-1.5 overflow-visible text-[11px] text-white/42">
      <span>{children}</span>
      {help ? (
        <details className="group relative inline-flex overflow-visible">
          <summary
            aria-label="지표 설명 보기"
            className="flex h-5 w-5 cursor-pointer list-none items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-white/62 transition hover:border-white/24 hover:bg-white/10 hover:text-white"
          >
            <HelpCircle aria-hidden="true" className="h-3.5 w-3.5" />
          </summary>
          <div className="absolute left-0 top-6 z-50 min-w-[200px] rounded-xl border border-slate-100 bg-white p-3 text-xs leading-5 text-slate-800 shadow-2xl pointer-events-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            {help}
          </div>
        </details>
      ) : null}
    </div>
  );
}

interface DesktopHomeDashboardProps {
  activeMenuIntent: string | null;
  activePrimaryNavKey: PrimaryNavKey | null;
  canContinueFromAssetSelection: boolean;
  dailyDirectPickAssets: AssetOption[];
  featuredRivalScenarios: HomeScenario[];
  featuredSoloScenarios: HomeScenario[];
  goToAllAssets: () => void;
  goToAmount: () => void;
  goToHome: () => void;
  goToExamples: () => void;
  goToSavedRecords: () => void;
  isMenuOpen: boolean;
  onAssetToggle: (assetId: ComparisonAssetId) => void;
  onMoreMenuOpen: () => void;
  onMenuOpenChange: (open: boolean) => void;
  onPresetBrowserOpen: () => void;
  onRivalScenarioShuffle: () => void;
  onScenarioStart: (scenario: HomeScenario) => void;
  onSoloScenarioShuffle: () => void;
  onTimelineScenarioReplay: (scenario: DynamicTimelineScenario) => void;
  rivalScenarioShuffleKey: number;
  selectedAssetIds: ComparisonAssetId[];
  selectedAssets: AssetOption[];
  syncedMatchups: SyncedMatchup[];
}

function DesktopHomeDashboard({
  activeMenuIntent,
  activePrimaryNavKey,
  canContinueFromAssetSelection,
  dailyDirectPickAssets,
  featuredRivalScenarios,
  featuredSoloScenarios,
  goToAllAssets,
  goToAmount,
  goToHome,
  goToExamples,
  goToSavedRecords,
  isMenuOpen,
  onAssetToggle,
  onMoreMenuOpen,
  onMenuOpenChange,
  onPresetBrowserOpen,
  onRivalScenarioShuffle,
  onScenarioStart,
  onSoloScenarioShuffle,
  onTimelineScenarioReplay,
  rivalScenarioShuffleKey,
  selectedAssetIds,
  selectedAssets,
  syncedMatchups,
}: DesktopHomeDashboardProps) {
  const selectedSummaryLabel = selectedAssets
    .map((asset) => getHomeIntroAssetLabel(asset))
    .join(" · ");

  return (
    <section className="hidden min-h-dvh px-6 py-5 lg:block xl:px-8 xl:py-6">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <ControlledAppMenu
            activeMenuIntent={activeMenuIntent}
            isOpen={isMenuOpen}
            onHomeClick={goToHome}
            onOpenChange={onMenuOpenChange}
            variant="light"
          />
          <button
            className="text-lg font-semibold tracking-[-0.04em] text-[var(--rz-text-primary)]"
            onClick={goToHome}
            type="button"
          >
            RegretZero
          </button>
        </div>
        <DesktopPrimaryNav
          activeKey={activePrimaryNavKey}
          canContinue={canContinueFromAssetSelection}
          onAssets={goToAllAssets}
          onCompare={goToExamples}
          onContinue={goToAmount}
          onMore={onMoreMenuOpen}
          onSaved={goToSavedRecords}
        />
      </header>

      <section className="mx-auto w-full max-w-5xl space-y-8 py-8">
        <div className="text-center">
          <div className="mx-auto max-w-3xl px-1 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--rz-text-muted)]">
              REGRETZERO
            </div>
            <h1 className="mx-auto mt-3 max-w-[720px] text-[3.2rem] font-semibold leading-[0.96] tracking-[-0.08em] text-[var(--rz-text-primary)] xl:text-[4rem]">
              그때 샀다면,
              <br />
              지금 어디쯤일까요?
            </h1>
            <p className="mx-auto mt-5 max-w-[620px] text-base leading-7 text-[var(--rz-text-secondary)] xl:text-lg xl:leading-8">
              <strong className="font-semibold text-[var(--rz-text-primary)]">같은 돈</strong>의 10년 차이와{" "}
              <strong className="font-semibold text-[var(--rz-text-primary)]">낙폭과 회복</strong>까지 함께 봅니다.
            </p>
            <ComplianceNotice className="mx-auto mt-5 max-w-[680px] text-left" variant="light" />
            <div className="mx-auto mt-4 max-w-[760px] text-left">
              <TrendRankingTicker
                matchups={syncedMatchups}
                onSelect={(assetIds) =>
                  onScenarioStart({
                    assetIds,
                    badge: "오늘의 매치업",
                    description: "오늘 많이 돌려본 조합입니다.",
                    mode: "compare",
                    title: getComparisonAssetIdsLabel(assetIds),
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="surface-card rounded-[34px] px-6 py-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38">
                직접 선택
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.055em] text-white">
                원하는 자산을 직접 고르기
              </div>
              <div className="mt-2 max-w-[42rem] text-sm leading-6 text-white/56">
                많이 찾는 대표 자산 12개를 먼저 모았습니다. 두 개를 고르면 바로 금액 단계로 이어집니다.
              </div>
            </div>
            <button
              className="btn-secondary min-h-11 shrink-0 rounded-full px-5 text-sm font-semibold text-[var(--rz-text-primary)] transition"
              onClick={goToAllAssets}
              type="button"
            >
              전체 종목 검색
            </button>
          </div>

          <DirectPickAssetGrid
            assets={dailyDirectPickAssets}
            className="mt-5 sm:grid-cols-4 xl:grid-cols-6"
            onAssetToggle={onAssetToggle}
            selectedAssetIds={selectedAssetIds}
          />

          <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-[-0.03em] text-white">
                  {canContinueFromAssetSelection ? selectedSummaryLabel : "선택 대기 중"}
                </div>
                <div className="mt-1 text-xs leading-5 text-white/46">
                  {canContinueFromAssetSelection
                    ? selectedAssetIds.length === 1
                      ? "하나만 골라도 정기예금 기준으로 먼저 볼 수 있습니다."
                      : "이제 금액만 정하면 10년 기록을 볼 수 있습니다."
                    : "위에서 자산 두 개를 고르면 여기에 담깁니다."}
                </div>
              </div>
              {canContinueFromAssetSelection ? (
                <button
                  className="btn-accent min-h-11 shrink-0 rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition"
                  onClick={goToAmount}
                  type="button"
                >
                  {selectedAssetIds.length === 1 ? "이 종목으로 금액 정하기" : "선택한 종목으로 계속"}
                </button>
              ) : (
                <div className="shrink-0 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/42">
                  {selectedAssetIds.length}/2
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="surface-card rounded-[30px] px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--rz-accent)]">
                  START
                </div>
                <div className="mt-2 text-xl font-semibold tracking-[-0.05em] text-white">
                  인기 종목 하나만 보기
                </div>
                <div className="mt-1 text-sm leading-6 text-white/54">
                  익숙한 자산 하나를 눌러 정기예금 흐름과 비교해보세요.
                </div>
              </div>
              <button
                className="shrink-0 rounded-full border border-white/14 bg-white/[0.08] px-4 py-2 text-sm font-bold text-white transition hover:bg-white/[0.12]"
                onClick={onSoloScenarioShuffle}
                type="button"
              >
                🔄 다른 자산 보기
              </button>
            </div>
            <div className="mt-5">
              <HomeScenarioGrid
                onSelect={onScenarioStart}
                scenarios={featuredSoloScenarios}
                twoColumnOnWide
              />
            </div>
          </div>

          <div className="surface-card rounded-[30px] px-5 py-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--rz-accent)]">
                  MATCH
                </div>
                <div className="mt-2 text-xl font-semibold tracking-[-0.05em] text-white">
                  라이벌 수익 대결
                </div>
                <div className="mt-1 text-sm leading-6 text-white/54">
                  비교가 선명한 대표 조합 네 개를 먼저 보여드립니다.
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  className="rounded-full border border-white/14 bg-white/[0.08] px-4 py-2 text-sm font-bold text-white transition hover:bg-white/[0.12]"
                  onClick={onRivalScenarioShuffle}
                  type="button"
                >
                  🔄 다른 매치 보기
                </button>
                <button
                  className="border-b border-white pb-0.5 text-sm font-bold text-white transition hover:text-white/78"
                  onClick={onPresetBrowserOpen}
                  type="button"
                >
                  전체 보기
                </button>
              </div>
            </div>
            <div
              className="animate-[rz-map-fade_180ms_ease-out]"
              key={`desktop-rivals-${rivalScenarioShuffleKey}`}
            >
              <HomeScenarioGrid
                onSelect={onScenarioStart}
                scenarios={featuredRivalScenarios}
                twoColumnOnWide
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <DynamicLiveTimeline
            matchups={syncedMatchups}
            onReplayScenario={onTimelineScenarioReplay}
          />
          <AdSlot
            className="min-h-[90px]"
            label="홈 광고"
            placement="home-desktop-context"
            slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT}
          />
        </div>
      </section>
    </section>
  );
}

async function requestHistoricalSeries(
  ticker: MarketDataTicker,
  startDate: string,
  endDate: string,
) {
  const url = new URL("/api/historical", window.location.origin);
  url.searchParams.set("ticker", ticker);
  url.searchParams.set("start", startDate);
  url.searchParams.set("end", endDate);

  const response = await fetch(url.toString(), { cache: "no-store" });
  const payload = (await response.json()) as HistoricalSeriesResponse | { error?: string };

  if (!response.ok) {
    throw new Error("error" in payload && payload.error ? payload.error : "historical fetch failed");
  }

  return payload as HistoricalSeriesResponse;
}

export function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuIntent = searchParams.get("menu");
  const [flowStep, setFlowStep] = useState<FlowStep>("intro");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<ComparisonAssetId[]>(
    defaultSelectedAssetIds,
  );
  const [assetToast, setAssetToast] = useState("");
  const [activeAssetFilter, setActiveAssetFilter] = useState<AssetFilterId>("all");
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const [, setIsAssetFilterExpanded] = useState(false);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [assetPickerReturnStep, setAssetPickerReturnStep] = useState<FlowStep>("intro");
  const [isPresetBrowserOpen, setIsPresetBrowserOpen] = useState(false);
  const [dailyDirectPickAssetIds, setDailyDirectPickAssetIds] = useState<ComparisonAssetId[]>(
    HOME_DIRECT_PICK_FALLBACK_ASSET_IDS,
  );
  const [featuredSoloScenarios, setFeaturedSoloScenarios] = useState<HomeScenario[]>(
    HOME_SOLO_SCENARIOS.slice(0, 4),
  );
  const [featuredRivalScenarios, setFeaturedRivalScenarios] = useState<HomeScenario[]>(
    HOME_RIVAL_SCENARIO_POOL.slice(0, 4),
  );
  const [rivalScenarioShuffleKey, setRivalScenarioShuffleKey] = useState(0);
  const [syncedMatchups] = useState<SyncedMatchup[]>(() => buildSyncedMatchupDeck(10));
  const premiumAccess = AD_SUPPORTED_ACCESS;
  const [customStartDate, setCustomStartDate] = useState(() => getRequestedDateRange().start);
  const [customStartDateInput, setCustomStartDateInput] = useState(() => getRequestedDateRange().start);
  const [detailChartContext, setDetailChartContext] = useState<DetailChartContext | null>(null);
  const [activeStartDateRange, setActiveStartDateRange] = useState(() => ({
    end: getRequestedDateRange().end,
    isPremiumCustom: false,
    label: "오늘 기준 10년 비교",
    start: getRequestedDateRange().start,
  }));
  const [raceSpeed, setRaceSpeed] = useState<RaceSpeed>("normal");
  const [raceResolution, setRaceResolution] = useState<RaceResolution>("monthly");
  const [startPointChartResolution, setStartPointChartResolution] = useState<RaceResolution>("monthly");
  const [amountInput, setAmountInput] = useState(formatManUnitAmountInput(DEFAULT_AMOUNT));
  const [activePreset, setActivePreset] = useState(DEFAULT_AMOUNT);
  const [amountMode, setAmountMode] = useState<AmountMode>("preset");
  const [isCustomAmountOpen, setIsCustomAmountOpen] = useState(false);
  const [investmentMode, setInvestmentMode] = useState<InvestmentMode>("lump-sum");
  const [monthlyContributionInput, setMonthlyContributionInput] = useState(
    formatManUnitAmountInput(DEFAULT_MONTHLY_CONTRIBUTION),
  );
  const [activeMonthlyContributionPreset, setActiveMonthlyContributionPreset] = useState(
    DEFAULT_MONTHLY_CONTRIBUTION,
  );
  const [monthlyContributionMode, setMonthlyContributionMode] = useState<AmountMode>("preset");
  const [isCustomMonthlyContributionOpen, setIsCustomMonthlyContributionOpen] = useState(false);
  const [isAmountAssetInfoOpen, setIsAmountAssetInfoOpen] = useState(false);
  const [marketBundle, setMarketBundle] = useState<MarketBundle | null>(null);
  const [isMarketLoading, setIsMarketLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [raceStatus, setRaceStatus] = useState<RaceStatus>("idle");
  const [visibleCount, setVisibleCount] = useState(1);
  const [expandedResultAssetIds, setExpandedResultAssetIds] = useState<ComparisonAssetId[]>([]);
  const [shareFeedback, setShareFeedback] = useState("");
  const [savedAssetCombos, setSavedAssetCombos] = useState<SavedAssetCombo[]>([]);
  const [savedFutureScenarios, setSavedFutureScenarios] = useState<SavedFutureScenario[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [savedTimelineRecords, setSavedTimelineRecords] = useState<SavedTimelineRecord[]>([]);
  const [timeMachineFeedback, setTimeMachineFeedback] = useState("");
  const [soloFlowStep, setSoloFlowStep] = useState<SoloFlowStep>("pick");
  const [soloAssetId, setSoloAssetId] = useState<ComparisonAssetId | null>(null);
  const [soloAmountInput, setSoloAmountInput] = useState(formatManUnitAmountInput(DEFAULT_AMOUNT));
  const [soloHorizonMode, setSoloHorizonMode] = useState<SoloHorizonMode>("recent10y");
  const [soloMarketBundle, setSoloMarketBundle] = useState<MarketBundle | null>(null);
  const [isSoloMarketLoading, setIsSoloMarketLoading] = useState(false);
  const [soloLoadError, setSoloLoadError] = useState("");
  const [soloRaceStatus, setSoloRaceStatus] = useState<RaceStatus>("idle");
  const [soloVisibleCount, setSoloVisibleCount] = useState(1);

  const animationFrameRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const soloAnimationFrameRef = useRef<number | null>(null);
  const soloProgressRef = useRef(0);
  const hasTrackedHomeViewRef = useRef(false);
  const handledMenuIntentRef = useRef<string | null>(null);
  const lastTimelineRecordKeyRef = useRef<string | null>(null);
  const customStartPickerRef = useRef<HTMLInputElement | null>(null);
  const customAmountInputRef = useRef<HTMLInputElement | null>(null);
  const customMonthlyContributionInputRef = useRef<HTMLInputElement | null>(null);
  const raceDateRange = useMemo(() => getRequestedDateRange(), []);
  const extendedDateRange = useMemo(() => getRequestedDateRangeForYears(50), []);
  const soloRequestedDateRange = useMemo(
    () =>
      soloHorizonMode === "since-listing"
        ? {
            end: raceDateRange.end,
            label: "상장일부터 홀딩",
            start: extendedDateRange.start,
          }
        : {
            end: raceDateRange.end,
            label: "최근 10년 복리 대조",
            start: raceDateRange.start,
          },
    [extendedDateRange.start, raceDateRange.end, raceDateRange.start, soloHorizonMode],
  );

  useEffect(() => {
    setDailyDirectPickAssetIds(buildDailyDirectPickAssetIds());
    setFeaturedSoloScenarios(pickRandomHomeSoloScenarios());
  }, []);

  function shuffleFeaturedSoloScenarios() {
    setFeaturedSoloScenarios((currentScenarios) =>
      shuffleHomeSoloScenarios(currentScenarios),
    );
  }

  function shuffleFeaturedRivalScenarios() {
    setFeaturedRivalScenarios((currentScenarios) =>
      shuffleHomeRivalScenarios(currentScenarios),
    );
    setRivalScenarioShuffleKey((currentKey) => currentKey + 1);
  }

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const selectedAssets = useMemo(
    () => selectedAssetIds.map((assetId) => assetCatalog[assetId]),
    [selectedAssetIds],
  );
  const detailChartAsset = detailChartContext ? assetCatalog[detailChartContext.assetId] : null;
  const selectedApproximationAssets = useMemo(
    () => selectedAssets.filter((asset) => hasApproximationNotice(asset)),
    [selectedAssets],
  );
  const selectedAssetSlots = useMemo(
    () =>
      Array.from(
        { length: MAIN_COMPARISON_ASSET_LIMIT },
        (_, index) => selectedAssets[index] ?? null,
      ),
    [selectedAssets],
  );
  const selectedAssetSlotMetaById = useMemo(
    () =>
      Object.fromEntries(
        selectedAssetIds.map((assetId, index) => [
          assetId,
          {
            color: getComparisonSlotColor(index),
            glow: getComparisonSlotGlow(index, 0.16),
            slot: index + 1,
          },
        ]),
      ) as Record<
        ComparisonAssetId,
        {
          color: string;
          glow: string;
          slot: number;
        }
      >,
    [selectedAssetIds],
  );
  const dailyDirectPickAssets = useMemo(
    () => dailyDirectPickAssetIds.map((assetId) => assetCatalog[assetId]).filter(Boolean),
    [dailyDirectPickAssetIds],
  );
  const soloQuickAssets = useMemo(
    () => SOLO_QUICK_ASSET_IDS.map((assetId) => assetCatalog[assetId]).filter(Boolean),
    [],
  );
  const amountValue = parseManUnitAmountInput(amountInput) || DEFAULT_AMOUNT;
  const soloAmountValue = parseManUnitAmountInput(soloAmountInput) || DEFAULT_AMOUNT;
  const formattedSoloAmountValue = formatKrwCompact(soloAmountValue);
  const soloAsset = soloAssetId ? assetCatalog[soloAssetId] : null;
  const isCustomActive = amountMode === "custom";
  const formattedAmountValue = formatKrwCompact(amountValue);
  const monthlyContributionValue =
    parseManUnitAmountInput(monthlyContributionInput) || DEFAULT_MONTHLY_CONTRIBUTION;
  const isMonthlyContributionCustomActive = monthlyContributionMode === "custom";
  const formattedMonthlyContributionValue = formatKrwCompact(monthlyContributionValue);
  const isMonthlyInvestmentMode = investmentMode === "monthly";
  const monthlyContributionUnsupportedAssets = selectedAssetIds.filter(
    (assetId) => !supportsMonthlyContributionAsset(assetId),
  );
  const monthlyContributionUnsupportedMessage =
    isMonthlyInvestmentMode && monthlyContributionUnsupportedAssets.length > 0
      ? "적립식은 예금, 주식, ETF, 금, 코인부터 지원합니다."
      : "";
  const activeInvestmentAmountValue = isMonthlyInvestmentMode
    ? monthlyContributionValue
    : amountValue;
  const formattedActiveInvestmentAmountValue = isMonthlyInvestmentMode
    ? formattedMonthlyContributionValue
    : formattedAmountValue;
  const realEstateSelectionNotice =
    selectedApproximationAssets.length > 0
      ? "부동산 자산은 실제 개별 매물 가격이 아닌 평균 흐름 기반 비교값입니다."
      : "";
  const normalizedAssetSearchQuery = useMemo(
    () => normalizeAssetSearchQuery(assetSearchQuery),
    [assetSearchQuery],
  );
  const activeBrowserFilter =
    ASSET_FILTERS.find((filter) => filter.id === activeAssetFilter) ?? ASSET_FILTERS[0]!;
  const assetBrowserFilterChips = useMemo(() => ASSET_FILTERS, []);
  const availableBrowserAssetIds = useMemo(
    () => (premiumAccess.isPremium ? assetOrder : assetOrder.filter((assetId) => isFreePlanAsset(assetId))),
    [premiumAccess.isPremium],
  );
  const availableBrowserAssetIdSet = useMemo(
    () => new Set<ComparisonAssetId>(availableBrowserAssetIds),
    [availableBrowserAssetIds],
  );
  const popularBrowserAssetIds = useMemo(() => {
    if (activeAssetFilter !== "all" && activeAssetFilter !== "popular") {
      return [] as ComparisonAssetId[];
    }

    return POPULAR_BROWSER_ASSET_IDS.filter((assetId) => {
      if (!availableBrowserAssetIdSet.has(assetId)) {
        return false;
      }

      const asset = assetCatalog[assetId];
      return assetMatchesSearch(asset, normalizedAssetSearchQuery);
    });
  }, [activeAssetFilter, availableBrowserAssetIdSet, normalizedAssetSearchQuery]);
  const shouldLimitPopularPreview =
    activeAssetFilter === "all" && normalizedAssetSearchQuery.length === 0;
  const displayedPopularBrowserAssetIds = shouldLimitPopularPreview
    ? popularBrowserAssetIds.slice(0, POPULAR_BROWSER_PREVIEW_LIMIT)
    : popularBrowserAssetIds;
  const hiddenPopularBrowserAssetCount = Math.max(
    0,
    popularBrowserAssetIds.length - displayedPopularBrowserAssetIds.length,
  );
  const assetBrowserSections = useMemo(() => {
    if (activeAssetFilter === "popular") {
      return [] as Array<{
        helper: string;
        id: string;
        assetIds: ComparisonAssetId[];
        title: string;
      }>;
    }

    const seenAssetIds = new Set<ComparisonAssetId>(
      activeAssetFilter === "all" ? displayedPopularBrowserAssetIds : [],
    );

    return ASSET_BROWSER_SECTION_DEFS.map((section) => {
      const assetIds = availableBrowserAssetIds.filter((assetId) => {
        if (seenAssetIds.has(assetId)) {
          return false;
        }

        if (!availableBrowserAssetIdSet.has(assetId)) {
          return false;
        }

        const asset = assetCatalog[assetId];

        if (!section.matches(asset)) {
          return false;
        }

      if (activeAssetFilter !== "all" && !activeBrowserFilter.matches(asset)) {
        return false;
      }

        return assetMatchesSearch(asset, normalizedAssetSearchQuery);
      });

      assetIds.forEach((assetId) => seenAssetIds.add(assetId));

      return {
        ...section,
        assetIds,
      };
    }).filter((section) => section.assetIds.length > 0);
  }, [
    activeAssetFilter,
    activeBrowserFilter,
    availableBrowserAssetIds,
    availableBrowserAssetIdSet,
    displayedPopularBrowserAssetIds,
    normalizedAssetSearchQuery,
  ]);
  const directSearchAssetIds = useMemo(() => {
    if (!normalizedAssetSearchQuery) {
      return [] as ComparisonAssetId[];
    }

    const sectionAssetIdSet = new Set<ComparisonAssetId>(
      [
        ...displayedPopularBrowserAssetIds,
        ...assetBrowserSections.flatMap((section) => section.assetIds),
      ],
    );

    return availableBrowserAssetIds.filter((assetId) => {
      if (sectionAssetIdSet.has(assetId)) {
        return false;
      }

      const asset = assetCatalog[assetId];

      if (
        activeAssetFilter !== "all" &&
        activeAssetFilter !== "popular" &&
        !activeBrowserFilter.matches(asset)
      ) {
        return false;
      }

      return assetMatchesSearch(asset, normalizedAssetSearchQuery);
    });
  }, [
    activeAssetFilter,
    activeBrowserFilter,
    assetBrowserSections,
    availableBrowserAssetIds,
    displayedPopularBrowserAssetIds,
    normalizedAssetSearchQuery,
  ]);
  const browserVisibleAssetCount = useMemo(
    () =>
      new Set<ComparisonAssetId>([
        ...displayedPopularBrowserAssetIds,
        ...assetBrowserSections.flatMap((section) => section.assetIds),
        ...directSearchAssetIds,
      ]).size,
    [assetBrowserSections, directSearchAssetIds, displayedPopularBrowserAssetIds],
  );
  const proDiscoveryAssetIds = useMemo(
    () =>
      PRO_DISCOVERY_ASSET_IDS.filter((assetId) => {
        const asset = assetCatalog[assetId];
        if (!asset || isFreePlanAsset(assetId)) {
          return false;
        }

        return assetMatchesSearch(asset, normalizedAssetSearchQuery);
      }),
    [normalizedAssetSearchQuery],
  );
  const shouldShowProDiscoverySection =
    !premiumAccess.isPremium &&
    proDiscoveryAssetIds.length > 0 &&
    (activeAssetFilter === "all" || normalizedAssetSearchQuery.length > 0);
  const effectiveRaceResolution = premiumAccess.isPremium ? raceResolution : "monthly";
  const raceDurationMs = getRaceDurationForSpeed(raceSpeed);

  const raceBuildState = useMemo(() => {
    if (!marketBundle || !canStartComparison(selectedAssetIds)) {
      return { build: null, error: "" };
    }

    if (monthlyContributionUnsupportedMessage) {
      return { build: null, error: monthlyContributionUnsupportedMessage };
    }

    try {
      return {
        build: isMonthlyInvestmentMode
          ? buildMonthlyContributionRaceData(
              selectedAssetIds,
              marketBundle,
              monthlyContributionValue,
              activeStartDateRange.start,
              activeStartDateRange.end,
            )
          : buildRaceData(
              selectedAssetIds,
              marketBundle,
              amountValue,
              activeStartDateRange.start,
              activeStartDateRange.end,
              effectiveRaceResolution,
            ),
        error: "",
      };
    } catch (error) {
      return {
        build: null,
        error: error instanceof Error ? error.message : "비교 데이터를 계산하지 못했습니다.",
      };
    }
  }, [
    activeStartDateRange.end,
    activeStartDateRange.start,
    amountValue,
    effectiveRaceResolution,
    isMonthlyInvestmentMode,
    marketBundle,
    monthlyContributionUnsupportedMessage,
    monthlyContributionValue,
    selectedAssetIds,
  ]);

  const raceBuild = raceBuildState.build;
  const calculationError = raceBuildState.error;
  const soloSimulationState = useMemo(() => {
    if (!soloAssetId || !soloMarketBundle) {
      return { error: "", simulation: null as SingleAssetSimulationResult | null };
    }

    try {
      return {
        error: "",
        simulation: buildSingleAssetSimulation(
          soloAssetId,
          soloMarketBundle,
          soloAmountValue,
          soloRequestedDateRange.start,
          soloRequestedDateRange.end,
          "monthly",
        ),
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "한 종목 결과를 계산하지 못했습니다.",
        simulation: null as SingleAssetSimulationResult | null,
      };
    }
  }, [
    soloAmountValue,
    soloAssetId,
    soloMarketBundle,
    soloRequestedDateRange.end,
    soloRequestedDateRange.start,
  ]);
  const soloSimulation = soloSimulationState.simulation;
  const soloCalculationError = soloSimulationState.error;
  const soloHoldingPainReport = useMemo(() => {
    if (!soloAssetId || !soloSimulation) {
      return null;
    }

    try {
      const initialValue = Number(soloSimulation.points[0]?.[soloAssetId] ?? soloAmountValue);
      return buildHoldingPainReport({
        initialAmount: initialValue > 0 ? initialValue : soloAmountValue,
        priceSeries: soloSimulation.points.map((point) => ({
          date: point.date,
          price: Number(point[soloAssetId] ?? soloAmountValue),
        })),
      });
    } catch {
      return null;
    }
  }, [soloAmountValue, soloAssetId, soloSimulation]);
  const soloRaceAssets = useMemo<RaceChartAsset[]>(
    () => (soloAsset ? [soloAsset, SOLO_PRINCIPAL_RACE_ASSET] : []),
    [soloAsset],
  );
  const soloRaceFullData = useMemo(() => {
    if (!soloSimulation) {
      return [] as RacePoint[];
    }

    return soloSimulation.points.map((point) => ({
      ...point,
      [SOLO_PRINCIPAL_ASSET_ID]: calculateSoloDepositBenchmarkValue(
        soloAmountValue,
        soloSimulation.resolvedStartDate,
        point.date,
      ),
    }));
  }, [soloAmountValue, soloSimulation]);
  const soloRaceVisibleData = useMemo(
    () =>
      soloRaceFullData.slice(
        0,
        Math.max(1, Math.min(soloVisibleCount, soloRaceFullData.length)),
      ),
    [soloRaceFullData, soloVisibleCount],
  );
  const soloCurrentPoint =
    soloRaceVisibleData[soloRaceVisibleData.length - 1] ?? soloRaceFullData[0] ?? null;
  const soloStartDateAdjustmentNotice = useMemo(() => {
    if (!soloAsset || !soloSimulation || soloSimulation.resolvedStartDate <= soloSimulation.requestedStartDate) {
      return "";
    }

    const adjustmentDays = getDateDiffDays(
      soloSimulation.requestedStartDate,
      soloSimulation.resolvedStartDate,
    );

    if (adjustmentDays < 60) {
      return "";
    }

    return `${soloAsset.shortLabel ?? soloAsset.label} 데이터가 ${formatDateLabel(
      soloSimulation.resolvedStartDate,
    )}부터 있어, 그 시점부터 계산했습니다.`;
  }, [soloAsset, soloSimulation]);
  const soloResultMetrics = useMemo(() => {
    if (!soloAssetId || !soloAsset || !soloMarketBundle || !soloSimulation || !soloHoldingPainReport) {
      return null;
    }

    try {
      const priceSeries = buildAssetPriceSeries(
        soloAssetId,
        soloMarketBundle,
        soloSimulation.resolvedStartDate,
        soloSimulation.resolvedEndDate,
      );
      const startPoint = priceSeries[0];
      const endPoint = priceSeries[priceSeries.length - 1];

      if (!startPoint || !endPoint) {
        return null;
      }

      const marketSeries = soloMarketBundle.seriesByAsset[soloAssetId];
      const startNativePoint = marketSeries
        ? findPointOnOrBefore(marketSeries.daily, soloSimulation.resolvedStartDate)
        : null;
      const endNativePoint = marketSeries
        ? findPointOnOrBefore(marketSeries.daily, soloSimulation.resolvedEndDate)
        : null;
      const finalValue = soloSimulation.result.finalValue;
      const profitKrw = finalValue - soloAmountValue;
      const totalReturnPct = soloSimulation.result.totalReturnPct;
      const multiple = finalValue / soloAmountValue;

      const startPriceLabel = isRealEstateAsset(soloAsset)
        ? "시작 기준 시세"
        : soloAsset.id === "deposit"
          ? "시작 기준값"
          : "시작 가격";
      const endPriceLabel = isRealEstateAsset(soloAsset)
        ? "종료 기준 시세"
        : soloAsset.id === "deposit"
          ? "종료 기준값"
          : "종료 가격";
      const startPriceValue =
        soloAsset.id === "deposit"
          ? `${startPoint.price.toFixed(2)}배 기준`
          : isRealEstateAsset(soloAsset)
            ? formatKrwExact(startPoint.price)
            : formatNativePrice(
                startNativePoint?.close ?? startPoint.price,
                marketSeries?.meta.currency ?? "KRW",
              );
      const endPriceValue =
        soloAsset.id === "deposit"
          ? `${endPoint.price.toFixed(2)}배 기준`
          : isRealEstateAsset(soloAsset)
            ? formatKrwExact(endPoint.price)
            : formatNativePrice(
                endNativePoint?.close ?? endPoint.price,
                marketSeries?.meta.currency ?? "KRW",
              );

      return {
        annualizedReturnPct:
          soloSimulation.result.annualizedReturnPct ??
          soloSimulation.result.cagrPct ??
          null,
        appliedEndDate: soloSimulation.resolvedEndDate,
        appliedStartDate: soloSimulation.resolvedStartDate,
        currencyNote:
          soloAsset.usesUsdFx
            ? "현지 통화 가격을 당시 환율로 원화 환산했습니다."
            : isRealEstateAsset(soloAsset)
              ? "실제 개별 매물이 아닌 평균 흐름 기반 비교값입니다."
              : soloAsset.id === "deposit"
                ? "예금은 시중 은행 정기예금 기준(복리 연 2.7%~3.1% 흐름)의 비교 기준값입니다."
                : "",
        displayLabel: getResultCardAssetLabel(soloAsset),
        endPriceLabel,
        endPriceValue,
        finalValue,
        hardshipCount: soloHoldingPainReport.crises.crisisCount,
        investmentAmount: soloAmountValue,
        maxDrawdownPct: soloHoldingPainReport.maxDrawdown.maxDrawdownPct,
        multiple,
        profitKrw,
        requestedStartDate: soloSimulation.requestedStartDate,
        startPriceLabel,
        startPriceValue,
        totalReturnPct,
      };
    } catch {
      return null;
    }
  }, [
    soloAmountValue,
    soloAsset,
    soloAssetId,
    soloHoldingPainReport,
    soloMarketBundle,
    soloSimulation,
  ]);
  const soloNoProfitTimetable = useMemo(() => {
    if (!soloAsset || !soloHoldingPainReport || !soloResultMetrics) {
      return null;
    }

    return buildNoProfitTimetable({
      assetLabel: soloResultMetrics.displayLabel ?? soloAsset.shortLabel ?? soloAsset.label,
      initialAmount: soloResultMetrics.investmentAmount,
      valueSeries: soloHoldingPainReport.valueSeries,
    });
  }, [soloAsset, soloHoldingPainReport, soloResultMetrics]);
  const soloNoProfitShareText = soloNoProfitTimetable
    ? buildNoProfitTimetableShareText(soloNoProfitTimetable)
    : "";
  const soloCrisisEntries = useMemo(
    () =>
      soloHoldingPainReport?.crises.crises.map((crisis, index) => ({
        crisis,
        index,
        label: formatCrisisPeriodLabel(crisis),
      })) ?? [],
    [soloHoldingPainReport],
  );
  const soloCanOpenDetailChart =
    soloAsset != null && supportsDetailChartMode(soloAsset) && Boolean(soloAsset.marketTicker);
  const isSoloResultInfoOpen =
    soloAssetId != null && expandedResultAssetIds.includes(soloAssetId);
  const soloRecoveryLabel = soloHoldingPainReport
    ? soloHoldingPainReport.recovery.recovered
      ? `${soloHoldingPainReport.recovery.recoveryMonths ?? 0}개월`
      : "아직 미회복"
    : "데이터 없음";
  const startDateAdjustmentNotice = useMemo<StartDateAdjustmentNotice | null>(() => {
    if (!raceBuild || raceBuild.resolvedStartDate <= raceBuild.requestedStartDate) {
      return null;
    }

    const adjustmentDays = getDateDiffDays(raceBuild.requestedStartDate, raceBuild.resolvedStartDate);

    // 주말/휴장일 같은 짧은 보정은 결과 카드 안에서만 다루고,
    // 상장일이나 데이터 시작일 때문에 기간이 크게 줄어든 경우만 앞에서 알려줍니다.
    if (adjustmentDays < 60) {
      return null;
    }

    const affectedAssetLabels = selectedAssetIds.flatMap((assetId) => {
      const asset = assetCatalog[assetId];
      const series = marketBundle?.seriesByAsset[assetId];
      const firstDate = series?.stats.firstDate ?? series?.daily[0]?.date;

      if (!asset?.marketTicker || !firstDate) {
        return [];
      }

      if (firstDate > raceBuild.requestedStartDate && firstDate <= raceBuild.resolvedStartDate) {
        return [asset.shortLabel ?? asset.label];
      }

      return [];
    });
    const visibleAffectedLabels = affectedAssetLabels.slice(0, 2);
    const affectedLabel =
      visibleAffectedLabels.length > 0
        ? `${visibleAffectedLabels.join(" · ")}${
            affectedAssetLabels.length > visibleAffectedLabels.length
              ? ` 외 ${affectedAssetLabels.length - visibleAffectedLabels.length}개`
              : ""
          }`
        : "선택한 자산";
    const periodLabel = formatApproxPeriodLabel(
      getApproxMonthDiff(raceBuild.resolvedStartDate, raceBuild.resolvedEndDate),
    );

    return {
      title: "10년 전체 데이터가 없어 가능한 구간부터 봅니다",
      body: `${affectedLabel} 데이터가 ${formatDateLabel(raceBuild.resolvedStartDate)}부터 있어, 이번 비교는 ${periodLabel} 흐름으로 계산해요.`,
      detail: isMonthlyInvestmentMode
        ? "적립식도 이 날짜부터 매달 넣은 것으로 봅니다."
        : "시작 금액은 이 날짜에 한 번 넣은 것으로 봅니다.",
    };
  }, [isMonthlyInvestmentMode, marketBundle, raceBuild, selectedAssetIds]);
  const resultRows = useMemo(() => raceBuild?.results ?? [], [raceBuild]);
  const holdingPainReports = useMemo(() => {
    if (!raceBuild) {
      return {} as Partial<Record<ComparisonAssetId, HoldingPainReport>>;
    }

    const reports = selectedAssetIds.flatMap((assetId) => {
      try {
        const initialValue = Number(
          raceBuild.points[0]?.[assetId] ?? activeInvestmentAmountValue,
        );
        const priceSeries = raceBuild.points.map((point) => ({
          date: point.date,
          price: Number(point[assetId] ?? activeInvestmentAmountValue),
        }));

        return [
          [
            assetId,
            buildHoldingPainReport({
              initialAmount: initialValue > 0 ? initialValue : activeInvestmentAmountValue,
              priceSeries,
            }),
          ] as const,
        ];
      } catch {
        return [];
      }
    });

    return Object.fromEntries(reports) as Partial<Record<ComparisonAssetId, HoldingPainReport>>;
  }, [activeInvestmentAmountValue, raceBuild, selectedAssetIds]);
  const raceMoments = useMemo(
    () =>
      raceBuild
        ? buildRaceMoments({
            assets: selectedAssets,
            points: raceBuild.points,
            reports: holdingPainReports,
            results: resultRows,
          })
        : [],
    [holdingPainReports, raceBuild, resultRows, selectedAssets],
  );
  const playbackTimeline = useMemo(
    () => (raceBuild ? buildPlaybackTimeline(raceBuild.points, selectedAssetIds) : null),
    [raceBuild, selectedAssetIds],
  );
  const soloPlaybackTimeline = useMemo(
    () =>
      soloRaceFullData.length > 0 && soloRaceAssets.length > 0
        ? buildPlaybackTimeline(
            soloRaceFullData,
            soloRaceAssets.map((asset) => asset.id),
          )
        : null,
    [soloRaceAssets, soloRaceFullData],
  );

  const visibleData = useMemo(() => {
    if (flowStep !== "race" || !raceBuild) {
      return [];
    }

    return raceBuild.points.slice(0, visibleCount);
  }, [flowStep, raceBuild, visibleCount]);

  const currentPoint = visibleData[visibleData.length - 1] ?? raceBuild?.points[0] ?? null;
  const customStartPreviewState = useMemo(() => {
    if (!marketBundle || !canStartComparison(selectedAssetIds)) {
      return { build: null, error: "" };
    }

    if (monthlyContributionUnsupportedMessage) {
      return { build: null, error: monthlyContributionUnsupportedMessage };
    }

    try {
      return {
        build: isMonthlyInvestmentMode
          ? buildMonthlyContributionRaceData(
              selectedAssetIds,
              marketBundle,
              monthlyContributionValue,
              customStartDate,
              raceDateRange.end,
            )
          : buildRaceData(
              selectedAssetIds,
              marketBundle,
              amountValue,
              customStartDate,
              raceDateRange.end,
              effectiveRaceResolution,
            ),
        error: "",
      };
    } catch (error) {
      return {
        build: null,
        error: error instanceof Error ? error.message : "원하는 시점의 비교를 준비하지 못했습니다.",
      };
    }
  }, [
    amountValue,
    customStartDate,
    effectiveRaceResolution,
    isMonthlyInvestmentMode,
    marketBundle,
    monthlyContributionUnsupportedMessage,
    monthlyContributionValue,
    raceDateRange.end,
    selectedAssetIds,
  ]);
  const customStartPreview = customStartPreviewState.build;
  const customStartError = customStartPreviewState.error;
  const isCustomStartInputValid = isValidInputDate(customStartDateInput);
  const hasCustomStartInputDraft = customStartDateInput !== customStartDate;
  const customStartSummarySelectedDate = isCustomStartInputValid
    ? formatDateLabel(customStartDateInput)
    : hasCustomStartInputDraft
      ? "날짜를 입력 중입니다"
      : formatDateLabel(customStartDate);
  const customStartSummaryAppliedDate =
    isCustomStartInputValid && customStartPreview
      ? formatDateLabel(customStartPreview.resolvedStartDate)
      : "-";
  const customStartSummaryEndDate =
    isCustomStartInputValid && customStartPreview
      ? formatDateLabel(customStartPreview.resolvedEndDate)
      : "-";
  const hasAdjustedCustomStartDate =
    isCustomStartInputValid &&
    customStartPreview?.resolvedStartDate != null &&
    customStartPreview.resolvedStartDate !== customStartDateInput;
  const customStartDateAdjustmentMessage = hasAdjustedCustomStartDate && customStartPreview
    ? `선택한 자산들의 공통 데이터 시작일이 ${formatDateLabel(customStartPreview.resolvedStartDate)}라 그날부터 비교합니다.`
    : "";
  const proExplorerAsset = selectedAssets[0] ?? null;
  const proExplorerSeries = useMemo(() => {
    if (!marketBundle || !proExplorerAsset) {
      return [] as AssetPricePoint[];
    }

    const explorerWindow =
      startPointChartResolution === "monthly"
        ? {
            end: raceDateRange.end,
            start: extendedDateRange.start,
          }
        : startPointChartResolution === "weekly"
          ? {
              end: clampDate(shiftDateByMonths(customStartDate, 24), extendedDateRange.start, raceDateRange.end),
              start: clampDate(shiftDateByMonths(customStartDate, -24), extendedDateRange.start, raceDateRange.end),
            }
          : {
              end: clampDate(shiftDateByMonths(customStartDate, 6), extendedDateRange.start, raceDateRange.end),
              start: clampDate(shiftDateByMonths(customStartDate, -6), extendedDateRange.start, raceDateRange.end),
            };

    try {
      return buildAssetPriceSeries(
        proExplorerAsset.id,
        marketBundle,
        explorerWindow.start,
        explorerWindow.end,
        startPointChartResolution,
      );
    } catch {
      return [] as AssetPricePoint[];
    }
  }, [
    extendedDateRange.start,
    marketBundle,
    proExplorerAsset,
    raceDateRange.end,
    customStartDate,
    startPointChartResolution,
  ]);
  const selectedExplorerPoint = useMemo(
    () => findPointOnOrAfter(proExplorerSeries, customStartDate),
    [customStartDate, proExplorerSeries],
  );
  const resultAssetMetrics = useMemo(() => {
    if (!marketBundle || !raceBuild) {
      return {} as Record<
        ComparisonAssetId,
        {
          appliedEndDate: string;
          appliedStartDate: string;
          annualizedReturnMethod: "cagr" | "none" | "xirr";
          annualizedReturnPct: number | null;
          cagrPct: number | null;
          currencyNote: string;
          displayLabel: string;
          endPriceLabel: string;
          endPriceValue: string;
          finalValue: number;
          hardshipCount: number;
          investmentAmount: number;
          maxDrawdownPct: number;
          multiple: number;
          profitKrw: number;
          returnOnInvestedPct: number;
          requestedStartDate: string;
          startPriceLabel: string;
          startPriceValue: string;
          totalInvestedKrw: number;
          totalReturnPct: number;
        }
      >;
    }

    const details = selectedAssetIds.flatMap((assetId) => {
      const asset = assetCatalog[assetId];
      const report = holdingPainReports[assetId];
      const raceResult = resultRows.find((row) => row.assetId === assetId);

      if (!report || !raceResult) {
        return [];
      }

      try {
        const priceSeries = buildAssetPriceSeries(
          assetId,
          marketBundle,
          raceBuild.resolvedStartDate,
          raceBuild.resolvedEndDate,
        );
        const startPoint = priceSeries[0];
        const endPoint = priceSeries[priceSeries.length - 1];

        if (!startPoint || !endPoint) {
          return [];
        }

        const marketSeries = marketBundle.seriesByAsset[assetId];
        const startNativePoint = marketSeries
          ? findPointOnOrBefore(marketSeries.daily, raceBuild.resolvedStartDate)
          : null;
        const endNativePoint = marketSeries
          ? findPointOnOrBefore(marketSeries.daily, raceBuild.resolvedEndDate)
          : null;
        const totalInvestedKrw = raceResult.totalInvestedKrw ?? amountValue;
        const profitKrw = raceResult.profitKrw ?? (raceResult.finalValue - totalInvestedKrw);
        const returnOnInvestedPct =
          raceResult.returnOnInvestedPct ?? raceResult.totalReturnPct;
        const multiplier = raceResult.finalValue / totalInvestedKrw;

        const startPriceLabel = isRealEstateAsset(asset)
          ? "시작 기준 시세"
          : asset.id === "deposit"
            ? "시작 기준값"
            : "시작 가격";
        const endPriceLabel = isRealEstateAsset(asset)
          ? "종료 기준 시세"
          : asset.id === "deposit"
            ? "종료 기준값"
            : "종료 가격";
        const startPriceValue =
          asset.id === "deposit"
            ? `${startPoint.price.toFixed(2)}배 기준`
            : isRealEstateAsset(asset)
              ? formatKrwExact(startPoint.price)
              : formatNativePrice(
                  startNativePoint?.close ?? startPoint.price,
                  marketSeries?.meta.currency ?? "KRW",
                );
        const endPriceValue =
          asset.id === "deposit"
            ? `${endPoint.price.toFixed(2)}배 기준`
            : isRealEstateAsset(asset)
              ? formatKrwExact(endPoint.price)
              : formatNativePrice(
                  endNativePoint?.close ?? endPoint.price,
                  marketSeries?.meta.currency ?? "KRW",
                );

        return [
          [
            assetId,
            {
              appliedEndDate: raceBuild.resolvedEndDate,
              appliedStartDate: raceBuild.resolvedStartDate,
              annualizedReturnMethod:
                raceResult.annualizedReturnMethod ??
                (raceResult.cagrPct != null ? "cagr" : "none"),
              annualizedReturnPct:
                raceResult.annualizedReturnPct ??
                raceResult.moneyWeightedReturnPct ??
                raceResult.cagrPct ??
                null,
              cagrPct: raceResult.cagrPct ?? null,
              currencyNote:
                asset.usesUsdFx
                  ? "현지 통화 가격을 당시 환율로 원화 환산했습니다."
                  : isRealEstateAsset(asset)
                    ? "실제 개별 매물이 아닌 평균 흐름 기반 비교값입니다."
                    : asset.id === "deposit"
                      ? "예금은 시중 은행 정기예금 기준(복리 연 2.7%~3.1% 흐름)의 비교 기준값입니다."
                      : "",
              displayLabel: getResultCardAssetLabel(asset),
              endPriceLabel,
              endPriceValue,
              finalValue: raceResult.finalValue,
              hardshipCount: report.crises.crisisCount,
              investmentAmount: totalInvestedKrw,
              maxDrawdownPct: report.maxDrawdown.maxDrawdownPct,
              multiple: multiplier,
              profitKrw,
              returnOnInvestedPct,
              requestedStartDate: raceBuild.requestedStartDate,
              startPriceLabel,
              startPriceValue,
              totalInvestedKrw,
              totalReturnPct: returnOnInvestedPct,
            },
          ] as const,
        ];
      } catch {
        return [];
      }
    });

    return Object.fromEntries(details) as Record<
      ComparisonAssetId,
      {
        appliedEndDate: string;
        appliedStartDate: string;
        annualizedReturnMethod: "cagr" | "none" | "xirr";
        annualizedReturnPct: number | null;
        cagrPct: number | null;
        currencyNote: string;
        displayLabel: string;
        endPriceLabel: string;
        endPriceValue: string;
        finalValue: number;
        hardshipCount: number;
        investmentAmount: number;
        maxDrawdownPct: number;
        multiple: number;
        profitKrw: number;
        returnOnInvestedPct: number;
        requestedStartDate: string;
        startPriceLabel: string;
        startPriceValue: string;
        totalInvestedKrw: number;
        totalReturnPct: number;
      }
    >;
  }, [amountValue, holdingPainReports, marketBundle, raceBuild, resultRows, selectedAssetIds]);
  const canContinueFromAssetSelection = selectedAssetIds.length > 0;
  const isAssetSelectionFull = isMainComparisonSelectionFull(selectedAssetIds);
  const amountStepError = loadError || calculationError;
  const visibleAmountPresets = isMonthlyInvestmentMode
    ? MONTHLY_CONTRIBUTION_PRESETS
    : amountPresets.filter((preset) => preset.value === DEFAULT_AMOUNT);
  const amountPrimaryCtaLabel = isMarketLoading
    ? "데이터 준비 중..."
    : isMonthlyInvestmentMode
      ? `월 ${formattedMonthlyContributionValue}으로 레이스 시작`
      : `${formattedAmountValue}으로 레이스 시작`;
  const assetPickerSummary = selectedAssets
    .map((asset) => asset.shortLabel ?? asset.label)
    .join(" · ");
  const assetPickerSelectionCountLabel = `선택한 종목 ${selectedAssetIds.length} / ${MAIN_COMPARISON_ASSET_LIMIT}`;
  const assetPickerBottomDescription =
    selectedAssetIds.length === 0
      ? "검색하거나 목록에서 종목을 하나 누르세요"
      : selectedAssetIds.length === 1
        ? "금액만 정하면 예금 기준과 바로 달립니다"
        : `${assetPickerSummary} 맞대결 준비 완료`;
  const assetPickerPrimaryLabel =
    selectedAssetIds.length === 0
      ? "종목을 선택해주세요"
    : selectedAssetIds.length === 1
        ? "금액 정하고 레이스 준비"
        : "이 조합으로 금액 정하기";
  const assetPickerSearchStatusLabel =
    selectedAssetIds.length === 0
      ? "종목을 누르면 아래에 레이스 준비 버튼이 열립니다"
      : selectedAssetIds.length === 1
        ? "한 종목만 선택하면 예금 기준과 비교합니다"
        : "두 종목을 같은 금액으로 비교합니다";
  const raceCompletionSummary = useMemo(() => {
    const leader = resultRows[0];

    if (!leader) {
      return null;
    }

    const metrics = resultAssetMetrics[leader.assetId];
    const report = holdingPainReports[leader.assetId];

    return {
      assetId: leader.assetId,
      assetLabel: metrics?.displayLabel ?? leader.label,
      difficultyLabel: report?.difficulty.label ?? null,
      finalValueLabel: formatKrwExact(metrics?.finalValue ?? leader.finalValue),
      maxDrawdownPct: metrics?.maxDrawdownPct ?? report?.maxDrawdown.maxDrawdownPct ?? null,
      maxDrawdownLabel: metrics ? formatMetricPercent(metrics.maxDrawdownPct) : "데이터 없음",
      multiple: metrics?.multiple ?? null,
      multiplierLabel: metrics ? formatMetricMultiple(metrics.multiple) : "-",
      recovered: report?.recovery.recovered ?? null,
      recoveryMonths: report?.recovery.recoveryMonths ?? null,
      recoveryLabel: report
        ? report.recovery.recovered
          ? `${report.recovery.recoveryMonths ?? 0}개월`
          : "아직 미회복"
        : "데이터 없음",
    };
  }, [holdingPainReports, resultAssetMetrics, resultRows]);
  const resultOneLineCopy = raceCompletionSummary
    ? buildResultOneLineCopy({
        assetLabel: raceCompletionSummary.assetLabel,
        finalValueLabel: raceCompletionSummary.finalValueLabel,
        isMonthlyInvestmentMode,
        maxDrawdownPct: raceCompletionSummary.maxDrawdownPct,
        multiple: raceCompletionSummary.multiple,
        recovered: raceCompletionSummary.recovered,
        recoveryMonths: raceCompletionSummary.recoveryMonths,
      })
    : "";
  const isPremiumCustomScenario = activeStartDateRange.isPremiumCustom;
  const showDesktopHomeDashboard = false;
  const shouldShowDesktopTopNav = false;
  const primaryNavActiveKey: PrimaryNavKey | null = isMenuOpen
    ? "more"
    : isPresetBrowserOpen
      ? "compare"
      : showAllAssets || flowStep === "assets"
        ? "assets"
        : flowStep === "saved"
          ? "saved"
        : flowStep === "solo"
          ? "compare"
        : flowStep === "difficulty"
          ? "more"
          : flowStep === "start-point"
            ? "more"
            : flowStep === "intro"
              ? "compare"
              : null;
  const shouldShowBottomPrimaryNav =
    (flowStep === "intro" ||
      flowStep === "saved") &&
    !showAllAssets &&
    !isPresetBrowserOpen &&
    !isMenuOpen;
  const shouldReserveMobileActionSpace =
    shouldShowBottomPrimaryNav || flowStep === "assets" || flowStep === "amount";
  const mobileBottomPaddingClass =
    flowStep === "result"
      ? "pb-[calc(env(safe-area-inset-bottom)+5rem)]"
      : shouldReserveMobileActionSpace
        ? "pb-[calc(env(safe-area-inset-bottom)+9.5rem)]"
        : "pb-6";
  const resultHeroRangeLabel = raceBuild
    ? `${formatDateLabel(raceBuild.resolvedStartDate)} - ${formatDateLabel(raceBuild.resolvedEndDate)}`
    : "결과를 준비하고 있습니다";
  const raceStepTitle = isPremiumCustomScenario
    ? "선택한 날부터 봅니다"
    : isMonthlyInvestmentMode
      ? "매달 넣은 돈의 궤적"
      : HOME_FLOW_COPY.raceTitle;
  const raceStepDescription =
    isPremiumCustomScenario && raceBuild
      ? `${formatDateLabel(raceBuild.resolvedStartDate)} - ${formatDateLabel(raceBuild.resolvedEndDate)}`
      : isMonthlyInvestmentMode
        ? "총 납입액 대비 평가금액이 어떻게 움직였는지 봅니다."
        : HOME_FLOW_COPY.raceDescription;
  const raceRangeLabel = raceBuild
    ? `${formatDateLabel(raceBuild.resolvedStartDate)}부터 ${formatDateLabel(raceBuild.resolvedEndDate)}까지`
    : "레이스를 준비하고 있습니다.";
  const raceProgressPercent = raceBuild?.points.length
    ? Math.min(100, Math.max(0, Math.round((visibleData.length / raceBuild.points.length) * 100)))
    : 0;
  const raceCurrentDateLabel = currentPoint
    ? formatDateLabel(currentPoint.date)
    : raceBuild
      ? formatDateLabel(raceBuild.resolvedStartDate)
      : "대기 중";
  const raceStatusLabel =
    isMarketLoading || raceStatus === "loading"
      ? "데이터 준비 중"
      : raceStatus === "complete"
        ? "레이스 완료"
        : raceStatus === "paused"
          ? "일시정지됨"
          : raceStatus === "racing"
            ? "레이스 진행 중"
            : "출발 대기";
  const raceStatusGuide =
    raceStatus === "complete"
      ? "레이스가 끝났습니다. 이제 최종 결과를 숫자로 확인하세요."
      : raceStatus === "paused"
        ? "잠시 멈췄습니다. 재생을 누르면 이어서 달립니다."
        : raceStatus === "racing"
          ? "차트가 끝까지 달리면 결과 버튼이 열립니다."
          : "데이터를 준비하면 자동으로 레이스가 시작됩니다.";
  const resultHeroTitle = isMonthlyInvestmentMode
    ? "꾸준히 넣었다면"
    : HOME_FLOW_COPY.resultTitle;
  const resultInsightCopy = isMonthlyInvestmentMode
    ? raceCompletionSummary
      ? buildResultInsightCopy({
          assetLabel: raceCompletionSummary.assetLabel,
          difficultyLabel: raceCompletionSummary.difficultyLabel,
          isMonthlyInvestmentMode,
          maxDrawdownPct: raceCompletionSummary.maxDrawdownPct,
          multiple: raceCompletionSummary.multiple,
          recovered: raceCompletionSummary.recovered,
          recoveryMonths: raceCompletionSummary.recoveryMonths,
        })
      : "적립식 결과는 최종 금액보다 납입을 멈추지 않았다는 점이 중요합니다."
    : raceCompletionSummary
      ? buildResultInsightCopy({
          assetLabel: raceCompletionSummary.assetLabel,
          difficultyLabel: raceCompletionSummary.difficultyLabel,
          isMonthlyInvestmentMode,
          maxDrawdownPct: raceCompletionSummary.maxDrawdownPct,
          multiple: raceCompletionSummary.multiple,
          recovered: raceCompletionSummary.recovered,
          recoveryMonths: raceCompletionSummary.recoveryMonths,
        })
      : HOME_FLOW_COPY.resultDescription;
  const resultReferralAssetId = raceCompletionSummary?.assetId ?? resultRows[0]?.assetId;
  const resultReferralAsset = resultReferralAssetId ? assetCatalog[resultReferralAssetId] : null;
  const resultReferralMetrics = resultReferralAssetId
    ? resultAssetMetrics[resultReferralAssetId]
    : null;
  const depositMetrics = resultAssetMetrics.deposit;
  const annualizedGapPct =
    resultReferralMetrics?.annualizedReturnPct != null && depositMetrics?.annualizedReturnPct != null
      ? resultReferralMetrics.annualizedReturnPct - depositMetrics.annualizedReturnPct
      : null;
  const totalReturnGapPct =
    resultReferralMetrics && depositMetrics
      ? resultReferralMetrics.totalReturnPct - depositMetrics.totalReturnPct
      : null;
  const referralGapLabel =
    annualizedGapPct != null
      ? `연평균 ${formatMetricPercent(annualizedGapPct)}`
      : totalReturnGapPct != null
        ? `총수익률 ${formatMetricPercent(totalReturnGapPct)}`
        : "장기 흐름";
  const resultReferralBase = getReferralCardData(resultReferralAssetId);
  const resultReferral: ReferralCardCopy =
    resultReferralAsset?.category === "코인"
      ? {
          ...resultReferralBase,
          benefit:
            "디지털 자산은 한 번에 맞히는 것보다 수수료, 보관 방식, 자동 적립 조건을 먼저 정리하는 것이 중요합니다.",
          fomo:
            "다음 선택은 한 번에 맞히는 게임보다, 감당 가능한 금액과 주기로 나누는 구조에서 시작하는 편이 현실적입니다.",
        }
      : {
          ...resultReferralBase,
          benefit:
            "다음 10년을 준비한다면 수수료, 환율, 소수점 투자, 자동 적립 조건을 먼저 비교해보세요.",
          fomo: `정기예금 대비 ${referralGapLabel} 차이를 봤다면, 다음 선택은 기대감보다 조건 확인에서 시작하는 게 좋습니다.`,
        };

  useEffect(() => {
    if (flowStep !== "result" || !raceCompletionSummary || selectedAssetIds.length < 2) {
      return;
    }

    const recordKey = `compare:${selectedAssetIds.join(",")}:${investmentMode}:${activeInvestmentAmountValue}:${raceCompletionSummary.finalValueLabel}`;

    if (lastTimelineRecordKeyRef.current === recordKey) {
      return;
    }

    lastTimelineRecordKeyRef.current = recordKey;

    saveTimelineRecord({
      amountLabel: formattedActiveInvestmentAmountValue,
      assetIds: selectedAssetIds,
      label: getComparisonAssetIdsLabel(selectedAssetIds),
      resultLabel: raceCompletionSummary.finalValueLabel,
      summary: `${raceCompletionSummary.assetLabel}가 앞섰고, 최대 낙폭은 ${raceCompletionSummary.maxDrawdownLabel}였습니다.`,
      type: "compare",
    });
    setSavedTimelineRecords(readSavedTimelineRecords());
  }, [
    activeInvestmentAmountValue,
    flowStep,
    formattedActiveInvestmentAmountValue,
    investmentMode,
    raceCompletionSummary,
    selectedAssetIds,
  ]);

  useEffect(() => {
    if (flowStep !== "solo" || soloFlowStep !== "result" || !soloAssetId || !soloResultMetrics) {
      return;
    }

    const recordKey = `solo:${soloAssetId}:${soloAmountValue}:${soloResultMetrics.finalValue}`;

    if (lastTimelineRecordKeyRef.current === recordKey) {
      return;
    }

    lastTimelineRecordKeyRef.current = recordKey;

    saveTimelineRecord({
      amountLabel: formattedSoloAmountValue,
      assetIds: [soloAssetId],
      label: `${soloResultMetrics.displayLabel} vs 정기예금 기준`,
      resultLabel: formatKrwExact(soloResultMetrics.finalValue),
      summary: `정기예금 기준과 비교해 ${formatMetricMultiple(soloResultMetrics.multiple)}까지 벌어졌습니다.`,
      type: "solo",
    });
    setSavedTimelineRecords(readSavedTimelineRecords());
  }, [
    flowStep,
    formattedSoloAmountValue,
    soloAmountValue,
    soloAssetId,
    soloFlowStep,
    soloResultMetrics,
  ]);

  const noProfitTimetable = useMemo(() => {
    if (!raceCompletionSummary) {
      return null;
    }

    const report = holdingPainReports[raceCompletionSummary.assetId];
    const metrics = resultAssetMetrics[raceCompletionSummary.assetId];

    if (!report || !metrics) {
      return null;
    }

    return buildNoProfitTimetable({
      assetLabel: raceCompletionSummary.assetLabel,
      initialAmount: metrics.totalInvestedKrw,
      valueSeries: report.valueSeries,
    });
  }, [holdingPainReports, raceCompletionSummary, resultAssetMetrics]);
  const noProfitShareText = noProfitTimetable
    ? buildNoProfitTimetableShareText(noProfitTimetable)
    : "";
  const noProfitTimetableOptions = useMemo(() => {
    const options: Array<{
      id: string;
      label: string;
      timetable: NoProfitTimetable;
    }> = [];

    resultRows.forEach((result) => {
      const report = holdingPainReports[result.assetId];
      const metrics = resultAssetMetrics[result.assetId];

      if (!report || !metrics) {
        return;
      }

      const timetable = buildNoProfitTimetable({
        assetLabel: metrics.displayLabel ?? result.label,
        initialAmount: metrics.totalInvestedKrw,
        valueSeries: report.valueSeries,
      });

      if (!timetable) {
        return;
      }

      options.push({
        id: result.assetId,
        label: metrics.displayLabel ?? result.label,
        timetable,
      });
    });

    return options;
  }, [holdingPainReports, resultAssetMetrics, resultRows]);
  const holdingDifficultySummaries = useMemo(() => {
    return selectedAssets
      .map((asset, index) => {
        const report = holdingPainReports[asset.id];
        const result = resultRows.find((row) => row.assetId === asset.id) ?? null;
        const metrics = resultAssetMetrics[asset.id] ?? null;
        const slotMeta = selectedAssetSlotMetaById[asset.id];

        return {
          asset,
          assetColor: slotMeta?.color ?? getComparisonSlotColor(index),
          index,
          metrics,
          report,
          result,
          score: report?.difficulty.score ?? -1,
        };
      })
      .filter((item) => item.report && item.metrics);
  }, [holdingPainReports, resultAssetMetrics, resultRows, selectedAssetSlotMetaById, selectedAssets]);
  const hardestHoldingAsset = useMemo(() => {
    return [...holdingDifficultySummaries].sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const rightDrawdown = Math.abs(right.report?.maxDrawdown.maxDrawdownPct ?? 0);
      const leftDrawdown = Math.abs(left.report?.maxDrawdown.maxDrawdownPct ?? 0);
      return rightDrawdown - leftDrawdown;
    })[0] ?? null;
  }, [holdingDifficultySummaries]);
  const difficultyNoProfitTimetable = useMemo(() => {
    if (!hardestHoldingAsset?.report || !hardestHoldingAsset.metrics) {
      return null;
    }

    return buildNoProfitTimetable({
      assetLabel:
        hardestHoldingAsset.metrics.displayLabel ??
        hardestHoldingAsset.asset.shortLabel ??
        hardestHoldingAsset.asset.label,
      initialAmount: hardestHoldingAsset.metrics.totalInvestedKrw,
      valueSeries: hardestHoldingAsset.report.valueSeries,
    });
  }, [hardestHoldingAsset]);
  const hardestCrisisEntries = useMemo(() => {
    return [...(hardestHoldingAsset?.report?.crises.crises ?? [])]
      .sort((left, right) => left.maxDrawdownPct - right.maxDrawdownPct)
      .slice(0, 3);
  }, [hardestHoldingAsset]);
  const difficultyNoProfitShareText = difficultyNoProfitTimetable
    ? buildNoProfitTimetableShareText(difficultyNoProfitTimetable)
    : "";
  const resultNextExperimentBody = isPremiumCustomScenario
    ? "시작일만 바꿔도 장면이 확 달라집니다."
    : "시작점을 바꾸면 전혀 다른 장면이 나올 수 있습니다.";
  const raceCompleteSubtitle = isPremiumCustomScenario
    ? "선택한 날부터 본 결과"
    : isMonthlyInvestmentMode
      ? "총 납입액과 최종 금액의 차이"
      : "격차가 벌어진 자리";
  const resultTrustSummary = isMonthlyInvestmentMode
    ? "매월 첫 비교 가능일 납입 · 총 납입액 기준 수익률 · 예금은 정기예금 기준(복리 연 2.7%~3.1% 흐름)"
    : isPremiumCustomScenario
    ? "실제 과거 데이터 기준 · 서울/강남구 아파트 비교 지원 · 예금은 정기예금 기준(복리 연 2.7%~3.1% 흐름)"
    : trustSummary;
  const resultTrustNotes = isPremiumCustomScenario
    ? trustNotes.filter((note) => !note.includes("10년"))
    : trustNotes;
function clearTimers() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  function clearSoloTimers() {
    if (soloAnimationFrameRef.current) {
      cancelAnimationFrame(soloAnimationFrameRef.current);
      soloAnimationFrameRef.current = null;
    }
  }

  function resetRacePlayback() {
    clearTimers();
    progressRef.current = 0;
    setVisibleCount(1);
    setRaceStatus("idle");
  }

  function resetSoloRacePlayback() {
    clearSoloTimers();
    soloProgressRef.current = 0;
    setSoloVisibleCount(1);
    setSoloRaceStatus("idle");
  }

  useEffect(() => {
    return () => {
      clearTimers();
      clearSoloTimers();
    };
  }, []);

  useEffect(() => {
    setSavedAssetCombos(readSavedAssetCombos());
    setSavedFutureScenarios(readSavedFutureScenarios());
    setSavedScenarios(readSavedScenarios());
  }, []);

  useEffect(() => {
    if (hasTrackedHomeViewRef.current) {
      return;
    }

    hasTrackedHomeViewRef.current = true;
    trackAnalyticsEvent("view_home", {
      selectedCount: selectedAssetIds.length,
    });
  }, [selectedAssetIds.length]);

  useEffect(() => {
    if (flowStep !== "result" || !raceBuild) {
      return;
    }

    trackAnalyticsEvent("view_result", {
      customStartDate: activeStartDateRange.isPremiumCustom ? activeStartDateRange.start : null,
      isPremium: premiumAccess.isPremium,
      selectedCount: selectedAssetIds.length,
    });
  }, [
    activeStartDateRange.isPremiumCustom,
    activeStartDateRange.start,
    flowStep,
    premiumAccess.isPremium,
    raceBuild,
    selectedAssetIds.length,
  ]);

  useEffect(() => {
    if (!assetToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAssetToast("");
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [assetToast]);

  useEffect(() => {
    if (!shareFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShareFeedback("");
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [shareFeedback]);

  useEffect(() => {
    if (!timeMachineFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTimeMachineFeedback("");
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [timeMachineFeedback]);

  useEffect(() => {
    setCustomStartDateInput(customStartDate);
  }, [customStartDate]);

  useEffect(() => {
    if (!isCustomAmountOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      customAmountInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isCustomAmountOpen]);

  useEffect(() => {
    if (!isCustomMonthlyContributionOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      customMonthlyContributionInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isCustomMonthlyContributionOpen]);

  useEffect(() => {
    if (!showAllAssets) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveAssetFilter("all");
        setAssetSearchQuery("");
        setIsAssetFilterExpanded(false);
        setShowAllAssets(false);
        setFlowStep(assetPickerReturnStep);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [assetPickerReturnStep, showAllAssets]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [flowStep]);

  useEffect(() => {
    if (flowStep !== "solo") {
      return;
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [flowStep, soloFlowStep]);

  useEffect(() => {
    let isCancelled = false;

    async function loadMarketBundle() {
      clearTimers();
      setVisibleCount(1);
      setRaceStatus("idle");

      if (!canStartComparison(selectedAssetIds)) {
        setMarketBundle(null);
        setLoadError("");
        setIsMarketLoading(false);
        return;
      }

      setIsMarketLoading(true);
      setLoadError("");

      try {
        const unsupportedAsset = selectedAssetIds.find((assetId) => {
          const asset = assetCatalog[assetId];
          return !asset.isAvailable || (!asset.marketTicker && !isSyntheticComparisonAsset(asset.id));
        });

        if (unsupportedAsset) {
          throw new Error(`${assetCatalog[unsupportedAsset].label} 데이터가 아직 준비되지 않았습니다.`);
        }

        const marketEntries = selectedAssetIds.flatMap((assetId) => {
          const asset = assetCatalog[assetId];

          if (!asset.isAvailable || !asset.marketTicker) {
            return [];
          }

          return [{ assetId, ticker: asset.marketTicker, usesUsdFx: Boolean(asset.usesUsdFx) }];
        });

        const uniqueTickers = [...new Set(marketEntries.map((entry) => entry.ticker))];
        const needsUsdFx = marketEntries.some((entry) => entry.usesUsdFx);
        const tickerPairs = await Promise.all(
          uniqueTickers.map(async (ticker) => {
            const series = await requestHistoricalSeries(
              ticker,
              extendedDateRange.start,
              extendedDateRange.end,
            );
            return [ticker, series] as const;
          }),
        );
        const usdkrw = needsUsdFx
          ? await requestHistoricalSeries(
              "USDKRW",
              extendedDateRange.start,
              extendedDateRange.end,
            )
          : null;

        if (isCancelled) {
          return;
        }

        const seriesByTicker = new Map<MarketDataTicker, HistoricalSeriesResponse>(tickerPairs);
        const seriesByAsset: Partial<Record<ComparisonAssetId, HistoricalSeriesResponse>> = {};

        for (const entry of marketEntries) {
          const series = seriesByTicker.get(entry.ticker);
          if (!series) {
            throw new Error(`${assetCatalog[entry.assetId].label} 데이터를 불러오지 못했습니다.`);
          }

          seriesByAsset[entry.assetId] = series;
        }

        setMarketBundle({
          seriesByAsset,
          source: "live",
          usdkrw,
        });
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setMarketBundle(null);
        setLoadError(
          error instanceof Error
            ? error.message
            : "실제 과거 데이터를 불러오지 못했습니다.",
        );
      } finally {
        if (!isCancelled) {
          setIsMarketLoading(false);
        }
      }
    }

    void loadMarketBundle();

    return () => {
      isCancelled = true;
    };
  }, [extendedDateRange.end, extendedDateRange.start, selectedAssetIds]);

  useEffect(() => {
    let isCancelled = false;

    async function loadSoloMarketBundle() {
      if (!soloAssetId) {
        setSoloMarketBundle(null);
        setSoloLoadError("");
        setIsSoloMarketLoading(false);
        return;
      }

      const asset = assetCatalog[soloAssetId];
      setIsSoloMarketLoading(true);
      setSoloLoadError("");

      try {
        if (!asset.isAvailable || (!asset.marketTicker && !isSyntheticComparisonAsset(asset.id))) {
          throw new Error(`${asset.label} 데이터가 아직 준비되지 않았습니다.`);
        }

        if (isSyntheticComparisonAsset(asset.id)) {
          if (!isCancelled) {
            setSoloMarketBundle({
              seriesByAsset: {},
              source: "live",
              usdkrw: null,
            });
          }
          return;
        }

        if (!asset.marketTicker) {
          throw new Error(`${asset.label} 데이터를 불러오지 못했습니다.`);
        }

        const series = await requestHistoricalSeries(
          asset.marketTicker,
          extendedDateRange.start,
          extendedDateRange.end,
        );
        const usdkrw = asset.usesUsdFx
          ? await requestHistoricalSeries(
              "USDKRW",
              extendedDateRange.start,
              extendedDateRange.end,
            )
          : null;

        if (isCancelled) {
          return;
        }

        setSoloMarketBundle({
          seriesByAsset: {
            [soloAssetId]: series,
          },
          source: "live",
          usdkrw,
        });
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setSoloMarketBundle(null);
        setSoloLoadError(
          error instanceof Error
            ? error.message
            : "한 종목 데이터를 불러오지 못했습니다.",
        );
      } finally {
        if (!isCancelled) {
          setIsSoloMarketLoading(false);
        }
      }
    }

    void loadSoloMarketBundle();

    return () => {
      isCancelled = true;
    };
  }, [extendedDateRange.end, extendedDateRange.start, soloAssetId]);

  useEffect(() => {
    if (flowStep !== "race") {
      return;
    }

    if (isMarketLoading || !raceBuild) {
      setRaceStatus("loading");
      return;
    }

    if (raceStatus === "idle") {
      progressRef.current = 0;
      setVisibleCount(1);
      setRaceStatus("racing");
    }
  }, [flowStep, isMarketLoading, raceBuild, raceStatus]);

  useEffect(() => {
    if (flowStep !== "race" || raceStatus !== "racing" || !raceBuild || !playbackTimeline) {
      return;
    }

    const totalPoints = raceBuild.points.length;
    const startedAt = performance.now() - progressRef.current * raceDurationMs;

    const tick = (timestamp: number) => {
      const nextProgress = Math.min(1, (timestamp - startedAt) / raceDurationMs);
      const nextVisibleCount = getVisibleCountForProgress(
        nextProgress,
        totalPoints,
        playbackTimeline,
      );

      progressRef.current = nextProgress;
      setVisibleCount(nextVisibleCount);

      if (nextProgress >= 1) {
        setRaceStatus("complete");
        animationFrameRef.current = null;
        return;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [flowStep, playbackTimeline, raceBuild, raceDurationMs, raceStatus]);

  useEffect(() => {
    if (flowStep !== "solo" || soloFlowStep !== "race") {
      return;
    }

    if (isSoloMarketLoading || !soloSimulation) {
      setSoloRaceStatus("loading");
      return;
    }

    if (soloRaceStatus === "idle" || soloRaceStatus === "loading") {
      soloProgressRef.current = 0;
      setSoloVisibleCount(1);
      setSoloRaceStatus("racing");
    }
  }, [flowStep, isSoloMarketLoading, soloFlowStep, soloRaceStatus, soloSimulation]);

  useEffect(() => {
    if (
      flowStep !== "solo" ||
      soloFlowStep !== "race" ||
      soloRaceStatus !== "racing" ||
      !soloSimulation ||
      !soloPlaybackTimeline
    ) {
      return;
    }

    const totalPoints = soloRaceFullData.length;
    const startedAt = performance.now() - soloProgressRef.current * raceDurationMs;

    const tick = (timestamp: number) => {
      const nextProgress = Math.min(1, (timestamp - startedAt) / raceDurationMs);
      const nextVisibleCount = getVisibleCountForProgress(
        nextProgress,
        totalPoints,
        soloPlaybackTimeline,
      );

      soloProgressRef.current = nextProgress;
      setSoloVisibleCount(nextVisibleCount);

      if (nextProgress >= 1) {
        setSoloRaceStatus("complete");
        soloAnimationFrameRef.current = null;
        return;
      }

      soloAnimationFrameRef.current = requestAnimationFrame(tick);
    };

    soloAnimationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (soloAnimationFrameRef.current) {
        cancelAnimationFrame(soloAnimationFrameRef.current);
        soloAnimationFrameRef.current = null;
      }
    };
  }, [
    flowStep,
    raceDurationMs,
    soloFlowStep,
    soloPlaybackTimeline,
    soloRaceFullData.length,
    soloRaceStatus,
    soloSimulation,
  ]);

  function handleAssetToggle(assetId: ComparisonAssetId) {
  handleHomepageAssetToggle(assetId);
}

function handleRemoveSelectedAsset(assetId: ComparisonAssetId) {
  handleHomepageAssetToggle(assetId);
}

function handleHomepageAssetToggle(assetId: ComparisonAssetId) {
    const asset = assetCatalog[assetId];
    if (!asset.isAvailable) {
      return;
    }

    if (!premiumAccess.isPremium && !isFreePlanAsset(assetId)) {
      openPremiumPrompt("deeper-analysis");
      setTimeMachineFeedback("이 자산은 아직 비교 준비 중입니다.");
      return;
    }

    setActiveStartDateRange({
      end: raceDateRange.end,
      isPremiumCustom: false,
      label: "오늘 기준 10년 비교",
      start: raceDateRange.start,
    });
    const selectionChange = toggleMainComparisonAssetInQueue(selectedAssetIds, assetId);
    setSelectedAssetIds(selectionChange.nextAssetIds);

    if (selectionChange.type === "removed" || selectionChange.type === "added") {
      setAssetToast("");
      return;
    }

    if (selectionChange.type === "replaced") {
      setAssetToast("");
    }
  }

  function handlePresetClick(value: number) {
    resetRacePlayback();
    setInvestmentMode("lump-sum");
    setAmountMode("preset");
    setActivePreset(value);
    setAmountInput(formatManUnitAmountInput(value));
    setIsCustomAmountOpen(false);
  }

  function handleInvestmentModeChange(nextMode: InvestmentMode) {
    resetRacePlayback();
    setInvestmentMode(nextMode);
  }

  function handleCustomAmountToggle() {
    resetRacePlayback();
    setInvestmentMode("lump-sum");
    setIsCustomAmountOpen((previous) => !previous);
    setAmountMode("custom");
    setActivePreset(0);
  }

  function handleAmountInputChange(value: string) {
    resetRacePlayback();
    const numericValue = parseManUnitAmountInput(value);
    setAmountMode("custom");
    setAmountInput(formatManUnitAmountInput(value));
    setActivePreset(0);
    if (numericValue > 0) {
      setIsCustomAmountOpen(true);
    }
  }

  function handleMonthlyContributionPresetClick(value: number) {
    resetRacePlayback();
    setInvestmentMode("monthly");
    setMonthlyContributionMode("preset");
    setActiveMonthlyContributionPreset(value);
    setMonthlyContributionInput(formatManUnitAmountInput(value));
    setIsCustomMonthlyContributionOpen(false);
  }

  function handleCustomMonthlyContributionToggle() {
    resetRacePlayback();
    setInvestmentMode("monthly");
    setIsCustomMonthlyContributionOpen((previous) => !previous);
    setMonthlyContributionMode("custom");
    setActiveMonthlyContributionPreset(0);
  }

  function handleMonthlyContributionInputChange(value: string) {
    resetRacePlayback();
    const numericValue = parseManUnitAmountInput(value);
    setInvestmentMode("monthly");
    setMonthlyContributionMode("custom");
    setMonthlyContributionInput(formatManUnitAmountInput(value));
    setActiveMonthlyContributionPreset(0);
    if (numericValue > 0) {
      setIsCustomMonthlyContributionOpen(true);
    }
  }

  function goToAssets() {
    resetRacePlayback();
    setIsMenuOpen(false);
    setActiveAssetFilter("all");
    setAssetSearchQuery("");
    setIsAssetFilterExpanded(false);
    setShowAllAssets(false);
    setFlowStep("assets");
  }

  function goToAllAssets() {
    resetRacePlayback();
    resetSoloRacePlayback();
    setSelectedAssetIds([]);
    setAssetToast("");
    setSoloAssetId(null);
    setSoloFlowStep("pick");
    setIsMenuOpen(false);
    setActiveAssetFilter("all");
    setAssetSearchQuery("");
    setIsAssetFilterExpanded(false);
    setAssetPickerReturnStep("intro");
    setShowAllAssets(true);
    setFlowStep("assets");
  }

  function goToCompareBuilder() {
    resetRacePlayback();
    resetSoloRacePlayback();
    setSelectedAssetIds([]);
    setAssetToast("");
    setSoloAssetId(null);
    setSoloFlowStep("pick");
    setIsMenuOpen(false);
    setActiveAssetFilter("all");
    setAssetSearchQuery("");
    setIsAssetFilterExpanded(false);
    setAssetPickerReturnStep("intro");
    setShowAllAssets(false);
    setFlowStep("assets");
  }

  function goToSoloBuilder() {
    resetRacePlayback();
    resetSoloRacePlayback();
    setSelectedAssetIds([]);
    setAssetToast("");
    setSoloAssetId(null);
    setSoloFlowStep("pick");
    setSoloHorizonMode("recent10y");
    setSoloAmountInput(formatManUnitAmountInput(DEFAULT_AMOUNT));
    setSoloLoadError("");
    setIsMenuOpen(false);
    setActiveAssetFilter("all");
    setAssetSearchQuery("");
    setIsAssetFilterExpanded(false);
    setShowAllAssets(false);
    setIsPresetBrowserOpen(false);
    setDetailChartContext(null);
    setFlowStep("solo");
  }

  function goToRecommendedComparisons() {
    resetRacePlayback();
    setIsMenuOpen(false);
    setIsPresetBrowserOpen(false);
    setActiveAssetFilter("all");
    setAssetSearchQuery("");
    setIsAssetFilterExpanded(false);
    setShowAllAssets(false);
    setFlowStep("intro");
    setIsPresetBrowserOpen(true);
  }

  function handleSoloAssetSelect(assetId: ComparisonAssetId) {
    const asset = assetCatalog[assetId];
    if (!asset.isAvailable) {
      return;
    }

    if (!premiumAccess.isPremium && !isFreePlanAsset(assetId)) {
      openPremiumPrompt("deeper-analysis");
      setTimeMachineFeedback("이 자산은 아직 준비 중입니다.");
      return;
    }

    resetRacePlayback();
    resetSoloRacePlayback();
    setSoloAssetId(assetId);
    setSoloHorizonMode("recent10y");
    setSoloFlowStep("amount");
    setFlowStep("solo");
  }

  function handleSoloAmountPresetClick(value: number) {
    setSoloAmountInput(formatManUnitAmountInput(value));
  }

  function handleSoloAmountInputChange(value: string) {
    setSoloAmountInput(formatManUnitAmountInput(value));
  }

  function goToSoloRace() {
    if (!soloAssetId || isSoloMarketLoading || soloLoadError || soloCalculationError) {
      return;
    }

    resetSoloRacePlayback();
    setSoloFlowStep("race");
  }

  function goToSoloResult() {
    if (!soloAssetId || isSoloMarketLoading || soloLoadError || soloCalculationError) {
      return;
    }

    setSoloFlowStep("result");
  }

  function resetSoloFlow() {
    resetRacePlayback();
    resetSoloRacePlayback();
    setSoloAssetId(null);
    setSoloAmountInput(formatManUnitAmountInput(DEFAULT_AMOUNT));
    setSoloHorizonMode("recent10y");
    setSoloFlowStep("pick");
    setFlowStep("solo");
  }

  function compareFromSolo() {
    if (!soloAssetId) {
      goToAssets();
      return;
    }

    resetRacePlayback();
    resetSoloRacePlayback();
    setSelectedAssetIds([soloAssetId]);
    setAssetToast("비교할 자산을 하나 더 골라주세요");
    setFlowStep("assets");
  }

  function goToSavedRecords() {
    resetRacePlayback();
    setIsMenuOpen(false);
    setShowAllAssets(false);
    setIsPresetBrowserOpen(false);
    setSavedAssetCombos(readSavedAssetCombos());
    setSavedFutureScenarios(readSavedFutureScenarios());
    setSavedScenarios(readSavedScenarios());
    setSavedTimelineRecords(readSavedTimelineRecords());
    setFlowStep("saved");
  }

  function openMoreMenu() {
    setIsPresetBrowserOpen(false);
    setIsMenuOpen(true);
  }

  function openAssetPicker() {
    setActiveAssetFilter("all");
    setAssetSearchQuery("");
    setIsAssetFilterExpanded(false);
    setAssetPickerReturnStep("assets");
    setShowAllAssets(true);
  }

  function handleAssetFilterChange(nextFilter: AssetFilterId) {
    setActiveAssetFilter(nextFilter);
  }

  function closeAssetPicker() {
    setActiveAssetFilter("all");
    setAssetSearchQuery("");
    setIsAssetFilterExpanded(false);
    setShowAllAssets(false);
    setFlowStep(assetPickerReturnStep);
  }

  function continueFromAssetPicker() {
    if (selectedAssetIds.length === 0) {
      return;
    }

    setActiveAssetFilter("all");
    setAssetSearchQuery("");
    setIsAssetFilterExpanded(false);
    setShowAllAssets(false);
    goToAmount();
  }

  function applyPresetSelection(assetIds: ComparisonAssetId[], nextStep: FlowStep) {
    if (!premiumAccess.isPremium && assetIds.some((assetId) => !isFreePlanAsset(assetId))) {
      openPremiumPrompt("deeper-analysis");
    setTimeMachineFeedback("이 조합에는 아직 준비 중인 자산이 포함되어 있습니다.");
      return;
    }

    resetRacePlayback();
    setSelectedAssetIds(normalizeMainComparisonSelection(assetIds));
    setActiveStartDateRange({
      end: raceDateRange.end,
      isPremiumCustom: false,
      label: "오늘 기준 10년 비교",
      start: raceDateRange.start,
    });
    setActiveAssetFilter("all");
    setAssetSearchQuery("");
    setIsAssetFilterExpanded(false);
    setShowAllAssets(false);
    setFlowStep(nextStep);
  }

  function applyDesktopRecommendedComparison(assetIds: ComparisonAssetId[]) {
    applyPresetSelection(assetIds, "amount");
    setIsPresetBrowserOpen(false);
    setAssetToast(`${getComparisonAssetIdsLabel(assetIds)} 비교가 준비됐습니다`);
  }

  function startHomeScenario(scenario: HomeScenario) {
    setIsMenuOpen(false);
    setIsPresetBrowserOpen(false);
    setShowAllAssets(false);

    if (scenario.mode === "solo") {
      const assetId = scenario.assetIds[0];
      if (!assetId) {
        return;
      }

      const asset = assetCatalog[assetId];

      if (!asset?.isAvailable) {
        return;
      }

      if (!premiumAccess.isPremium && !isFreePlanAsset(assetId)) {
        openPremiumPrompt("deeper-analysis");
        setTimeMachineFeedback("이 자산은 아직 준비 중입니다.");
        return;
      }

      resetRacePlayback();
      resetSoloRacePlayback();
      setSoloAssetId(assetId);
      setSoloFlowStep("amount");
      setSoloHorizonMode("recent10y");
      setSoloAmountInput(formatManUnitAmountInput(DEFAULT_AMOUNT));
      setSelectedAssetIds([]);
      setDetailChartContext(null);
      setFlowStep("solo");
      setAssetToast(
        `${asset.shortLabel ?? asset.label} 집중 분석이 준비됐습니다`,
      );
      return;
    }

    applyPresetSelection(scenario.assetIds, "amount");
    setAssetToast(`${getComparisonAssetIdsLabel(scenario.assetIds)} 비교가 준비됐습니다`);
  }

  function startTimelineScenario(scenario: DynamicTimelineScenario) {
    const availableAssetIds = scenario.assetIds.filter((assetId) => assetCatalog[assetId]?.isAvailable);

    if (!canStartComparison(availableAssetIds)) {
      setAssetToast("이 조합은 아직 비교할 수 없습니다.");
      return;
    }

    if (
      !premiumAccess.isPremium &&
      availableAssetIds.some((assetId) => !isFreePlanAsset(assetId))
    ) {
      openPremiumPrompt("deeper-analysis");
      setTimeMachineFeedback("이 조합에는 아직 준비 중인 자산이 포함되어 있습니다.");
      return;
    }

    resetRacePlayback();
    resetSoloRacePlayback();
    setSoloAssetId(null);
    setSoloFlowStep("pick");
    setSelectedAssetIds(normalizeMainComparisonSelection(availableAssetIds));
    setActiveStartDateRange({
      end: raceDateRange.end,
      isPremiumCustom: false,
      label: "오늘 기준 10년 비교",
      start: raceDateRange.start,
    });
    setActiveAssetFilter("all");
    setAssetSearchQuery("");
    setIsAssetFilterExpanded(false);
    setShowAllAssets(false);
    setIsMenuOpen(false);
    setIsPresetBrowserOpen(false);
    setDetailChartContext(null);

    if (scenario.investmentMode === "monthly") {
      setInvestmentMode("monthly");
      setMonthlyContributionMode("custom");
      setActiveMonthlyContributionPreset(0);
      setMonthlyContributionInput(formatManUnitAmountInput(scenario.amountKrw));
      setIsCustomMonthlyContributionOpen(false);
    } else {
      setInvestmentMode("lump-sum");
      setAmountMode("custom");
      setActivePreset(0);
      setAmountInput(formatManUnitAmountInput(scenario.amountKrw));
      setIsCustomAmountOpen(false);
    }

    setFlowStep("amount");
    setAssetToast(`${scenario.label} 시나리오가 준비됐습니다`);
  }

  function startTutorialExample() {
    applyPresetSelection(["deposit", "qqq"], "amount");
    setIsPresetBrowserOpen(false);
    setAssetToast("예금과 미국 기술주 ETF로 먼저 체험해볼 수 있습니다");
  }

  function closePresetBrowser() {
    setIsPresetBrowserOpen(false);
  }

  function goToAmount() {
    resetRacePlayback();
    if (selectedAssetIds.length === 1) {
      const assetId = selectedAssetIds[0];
      const asset = assetId ? assetCatalog[assetId] : null;

      if (!assetId || !asset?.isAvailable) {
        return;
      }

      if (!premiumAccess.isPremium && !isFreePlanAsset(assetId)) {
        openPremiumPrompt("deeper-analysis");
        setTimeMachineFeedback("이 자산은 아직 준비 중입니다.");
        return;
      }

      resetSoloRacePlayback();
      setSoloAssetId(null);
      setSoloFlowStep("pick");
      setSelectedAssetIds(normalizeMainComparisonSelection([assetId, "deposit"]));
      setInvestmentMode("lump-sum");
      setAmountMode(amountValue === DEFAULT_AMOUNT ? "preset" : "custom");
      setActivePreset(amountValue === DEFAULT_AMOUNT ? DEFAULT_AMOUNT : 0);
      setAmountInput(formatManUnitAmountInput(amountValue || DEFAULT_AMOUNT));
      setIsCustomAmountOpen(false);
      setDetailChartContext(null);
      setIsMenuOpen(false);
      setIsAmountAssetInfoOpen(false);
      setFlowStep("amount");
      setAssetToast(`${asset.shortLabel ?? asset.label}과 정기예금 기준 비교가 준비됐습니다`);
      return;
    }

    if (!canStartComparison(selectedAssetIds)) {
      return;
    }
    setDetailChartContext(null);
    setIsMenuOpen(false);
    setIsAmountAssetInfoOpen(false);
    setFlowStep("amount");
  }

  function goToHome() {
    resetRacePlayback();
    handledMenuIntentRef.current = null;
    router.replace("/", { scroll: false });
    setSelectedAssetIds([]);
    setAssetToast("");
    setDetailChartContext(null);
    setIsMenuOpen(false);
    setActiveAssetFilter("all");
    setAssetSearchQuery("");
    setIsAssetFilterExpanded(false);
    setShowAllAssets(false);
    setIsPresetBrowserOpen(false);
    setAssetPickerReturnStep("intro");
    setCustomStartDate(raceDateRange.start);
    setCustomStartDateInput(raceDateRange.start);
    setActiveStartDateRange({
      end: raceDateRange.end,
      isPremiumCustom: false,
      label: "오늘 기준 10년 비교",
      start: raceDateRange.start,
    });
    setRaceSpeed("normal");
    setRaceResolution("monthly");
    setStartPointChartResolution("monthly");
    setAmountInput(formatManUnitAmountInput(DEFAULT_AMOUNT));
    setActivePreset(DEFAULT_AMOUNT);
    setAmountMode("preset");
    setIsCustomAmountOpen(false);
    setInvestmentMode("lump-sum");
    setMonthlyContributionInput(formatManUnitAmountInput(DEFAULT_MONTHLY_CONTRIBUTION));
    setActiveMonthlyContributionPreset(DEFAULT_MONTHLY_CONTRIBUTION);
    setMonthlyContributionMode("preset");
    setIsCustomMonthlyContributionOpen(false);
    setIsAmountAssetInfoOpen(false);
    setExpandedResultAssetIds([]);
    setShareFeedback("");
    setTimeMachineFeedback("");
    resetSoloRacePlayback();
    setSoloFlowStep("pick");
    setSoloAssetId(null);
    setSoloHorizonMode("recent10y");
    setSoloAmountInput(formatManUnitAmountInput(DEFAULT_AMOUNT));
    setSoloLoadError("");
    setFlowStep("intro");
  }

  function goToRaceWithRange(nextRange: typeof activeStartDateRange) {
    resetRacePlayback();
    setExpandedResultAssetIds([]);
    if (!premiumAccess.isPremium && !nextRange.isPremiumCustom) {
      trackAnalyticsEvent("start_free_race", {
        resolution: effectiveRaceResolution,
        selectedCount: selectedAssetIds.length,
      });
    }
    trackAnalyticsEvent("start_comparison", {
      isPremiumCustom: nextRange.isPremiumCustom,
      resolution: effectiveRaceResolution,
      selectedCount: selectedAssetIds.length,
      speed: raceSpeed,
      startDate: nextRange.start,
    });
    setFlowStep("race");
  }

  function goToRace() {
    goToRaceWithRange(activeStartDateRange);
  }

  function handlePauseRace() {
    clearTimers();
    setRaceStatus("paused");
  }

  function handlePlayRace() {
    if (!raceBuild) {
      return;
    }

    setRaceStatus("racing");
  }

  function handleRestartRace() {
    if (!raceBuild) {
      return;
    }

    clearTimers();
    progressRef.current = 0;
    setVisibleCount(1);
    setRaceStatus("racing");
  }

  function handlePauseSoloRace() {
    clearSoloTimers();
    setSoloRaceStatus("paused");
  }

  function handlePlaySoloRace() {
    if (!soloSimulation) {
      return;
    }

    setSoloRaceStatus("racing");
  }

  function handleRestartSoloRace() {
    if (!soloSimulation) {
      return;
    }

    clearSoloTimers();
    soloProgressRef.current = 0;
    setSoloVisibleCount(1);
    setSoloRaceStatus("racing");
  }

  function handleSelectRaceMoment(moment: RaceMoment) {
    if (!raceBuild || !playbackTimeline) {
      return;
    }

    const pointIndex = raceBuild.points.findIndex((point) => point.index === moment.index);
    if (pointIndex < 0) {
      return;
    }

    clearTimers();
    setVisibleCount(Math.min(raceBuild.points.length, pointIndex + 1));
    progressRef.current = getProgressForRacePointIndex(
      raceBuild.points,
      moment.index,
      playbackTimeline,
    );
    setRaceStatus("paused");
  }

  function restartFromAssets() {
    resetRacePlayback();
    setDetailChartContext(null);
    setActiveAssetFilter("all");
    setAssetSearchQuery("");
    setIsAssetFilterExpanded(false);
    setActiveStartDateRange({
      end: raceDateRange.end,
      isPremiumCustom: false,
      label: "오늘 기준 10년 비교",
      start: raceDateRange.start,
    });
    setExpandedResultAssetIds([]);
    setIsAmountAssetInfoOpen(false);
    setShowAllAssets(false);
    setStartPointChartResolution("monthly");
    setFlowStep("assets");
  }

  function openResultAssetSearch() {
    setIsMenuOpen(false);
    setActiveAssetFilter("all");
    setAssetSearchQuery("");
    setIsAssetFilterExpanded(false);
    setAssetPickerReturnStep("result");
    setShowAllAssets(true);
    setFlowStep("assets");
    setAssetToast("다른 종목을 누르면 같은 금액으로 다시 비교할 수 있습니다");
  }

  function openStartPointPicker() {
    setIsMenuOpen(false);
    trackAnalyticsEvent("open_start_point_picker", {
      selectedCount: selectedAssetIds.length,
    });

    setCustomStartDate(activeStartDateRange.start);
    setCustomStartDateInput(activeStartDateRange.start);
    if (raceSpeed !== "instant") {
      setRaceSpeed("normal");
    }
    setRaceResolution("monthly");
    setStartPointChartResolution("monthly");
    setFlowStep("start-point");
  }

  function applySavedAssetCombo(combo: SavedAssetCombo) {
    const nextAssetIds = normalizeMainComparisonSelection(
      combo.assetIds.filter((assetId) => assetCatalog[assetId]?.isAvailable),
    );

    if (!canStartComparison(nextAssetIds)) {
      setTimeMachineFeedback("저장한 자산 중 지금 비교할 수 없는 자산이 있습니다.");
      return;
    }

    resetRacePlayback();
    setSelectedAssetIds(nextAssetIds);
    setActiveStartDateRange({
      end: raceDateRange.end,
      isPremiumCustom: false,
      label: "오늘 기준 10년 비교",
      start: raceDateRange.start,
    });
    setInvestmentMode("lump-sum");
    setFlowStep("amount");
    setTimeMachineFeedback("저장한 자산 조합을 불러왔습니다.");
  }

  function applySavedScenario(scenario: SavedScenario) {
    const nextAssetIds = normalizeMainComparisonSelection(
      scenario.assetIds.filter((assetId) => assetCatalog[assetId]?.isAvailable),
    );

    if (!canStartComparison(nextAssetIds)) {
      setTimeMachineFeedback("저장한 시나리오의 자산을 지금 비교할 수 없습니다.");
      return;
    }

    resetRacePlayback();
    setSelectedAssetIds(nextAssetIds);
    setAmountInput(formatManUnitAmountInput(scenario.amount));
    setAmountMode("custom");
    setActivePreset(scenario.amount);
    setIsCustomAmountOpen(true);
    setInvestmentMode("lump-sum");
    setRaceSpeed(scenario.speed);
    setRaceResolution(scenario.resolution);
    setStartPointChartResolution(scenario.resolution);
    setCustomStartDate(scenario.startDate);
    setCustomStartDateInput(scenario.startDate);
    setActiveStartDateRange({
      end: raceDateRange.end,
      isPremiumCustom: true,
      label: `${formatDateLabel(scenario.startDate)}부터 비교`,
      start: scenario.startDate,
    });
    setFlowStep("amount");
    setTimeMachineFeedback("저장한 시나리오를 불러왔습니다.");
  }

  useEffect(() => {
    if (!menuIntent) {
      handledMenuIntentRef.current = null;
      return;
    }

    if (pathname !== "/") {
      return;
    }

    const intentKey = `${pathname}:${menuIntent}`;
    if (handledMenuIntentRef.current === intentKey) {
      return;
    }

    handledMenuIntentRef.current = intentKey;

    function resetPlaybackForMenuIntent() {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (soloAnimationFrameRef.current) {
        cancelAnimationFrame(soloAnimationFrameRef.current);
        soloAnimationFrameRef.current = null;
      }
      progressRef.current = 0;
      soloProgressRef.current = 0;
      setVisibleCount(1);
      setRaceStatus("idle");
      setSoloVisibleCount(1);
      setSoloRaceStatus("idle");
    }

    if (menuIntent === "assets") {
      resetPlaybackForMenuIntent();
      setIsMenuOpen(false);
      setActiveAssetFilter("all");
      setAssetSearchQuery("");
      setIsAssetFilterExpanded(false);
      setAssetPickerReturnStep("intro");
      setShowAllAssets(true);
      setFlowStep("assets");
    } else if (menuIntent === "recommended") {
      resetPlaybackForMenuIntent();
      setIsMenuOpen(false);
      setActiveAssetFilter("all");
      setAssetSearchQuery("");
      setIsAssetFilterExpanded(false);
      setShowAllAssets(false);
      setFlowStep("intro");
      setIsPresetBrowserOpen(true);
      setAssetToast("추천 비교에서 바로 시작할 수 있습니다");
    } else if (menuIntent === "solo") {
      resetPlaybackForMenuIntent();
      setIsMenuOpen(false);
      setIsPresetBrowserOpen(false);
      setShowAllAssets(false);
      setActiveAssetFilter("all");
      setAssetSearchQuery("");
      setIsAssetFilterExpanded(false);
      setSoloFlowStep("pick");
      setFlowStep("solo");
      setAssetToast("한 종목만 먼저 되돌려볼 수 있습니다");
    } else if (menuIntent === "start-point") {
      resetPlaybackForMenuIntent();
      setIsMenuOpen(false);
      setIsPresetBrowserOpen(false);
      setShowAllAssets(false);
      setActiveAssetFilter("all");
      setAssetSearchQuery("");
      setIsAssetFilterExpanded(false);
      trackAnalyticsEvent("open_start_point_picker", {
        selectedCount: selectedAssetIds.length,
      });

      if (!canStartComparison(selectedAssetIds)) {
        const starterAssets: ComparisonAssetId[] = ["deposit", "qqq"];
        setSelectedAssetIds(starterAssets);
        setAssetToast("예금과 미국 기술주 ETF로 먼저 열었습니다");
      }

      setCustomStartDate(activeStartDateRange.start);
      setCustomStartDateInput(activeStartDateRange.start);
      if (raceSpeed !== "instant") {
        setRaceSpeed("normal");
      }
      setRaceResolution("monthly");
      setStartPointChartResolution("monthly");
      setFlowStep("start-point");
    } else if (menuIntent === "difficulty") {
      resetPlaybackForMenuIntent();
      setIsMenuOpen(false);
      setIsPresetBrowserOpen(false);
      setShowAllAssets(false);
      setActiveAssetFilter("all");
      setAssetSearchQuery("");
      setIsAssetFilterExpanded(false);
      trackAnalyticsEvent("open_holding_difficulty", {
        selectedCount: selectedAssetIds.length,
      });

      if (!canStartComparison(selectedAssetIds)) {
        setAssetToast("먼저 비교를 시작하면 고비 구간을 볼 수 있습니다");
      }

      setFlowStep("difficulty");
    } else if (menuIntent === "saved") {
      setIsMenuOpen(false);
      setShowAllAssets(false);
      setIsPresetBrowserOpen(false);
      setSavedAssetCombos(readSavedAssetCombos());
      setSavedFutureScenarios(readSavedFutureScenarios());
      setSavedScenarios(readSavedScenarios());
      setSavedTimelineRecords(readSavedTimelineRecords());
      setFlowStep("saved");
    }

  }, [
    activeStartDateRange.start,
    flowStep,
    menuIntent,
    pathname,
    raceBuild,
    raceStatus,
    raceSpeed,
    resultRows.length,
    selectedAssetIds,
    selectedAssetIds.length,
  ]);

  function openDetailChartForCrisis(
    asset: AssetOption,
    crisisLabel: string,
    crisis: HoldingPainReport["crises"]["crises"][number],
  ) {
    if (!asset.marketTicker || !raceBuild || !supportsDetailChartMode(asset)) {
      return;
    }

    setDetailChartContext({
      assetId: asset.id,
      assetLabel: asset.shortLabel ?? asset.label,
      crisis,
      crisisLabel,
      marketTicker: asset.marketTicker,
      raceEndDate: raceBuild.resolvedEndDate,
      raceStartDate: raceBuild.resolvedStartDate,
    });
    setFlowStep("detail-chart");
  }

  function closeDetailChart() {
    setFlowStep("result");
  }

  function handleCustomDateInput(nextDate: string) {
    setCustomStartDateInput(nextDate);

    if (!isValidInputDate(nextDate)) {
      return;
    }

    setCustomStartDate(nextDate);
    trackAnalyticsEvent("input_custom_date", {
      selectedCount: selectedAssetIds.length,
      startDate: nextDate,
    });
  }

  function handleCustomDateTextInput(nextValue: string) {
    const normalizedValue = normalizeDateDraftInput(nextValue);
    setCustomStartDateInput(normalizedValue);

    if (!isValidInputDate(normalizedValue)) {
      return;
    }

    setCustomStartDate(normalizedValue);
    trackAnalyticsEvent("input_custom_date", {
      selectedCount: selectedAssetIds.length,
      startDate: normalizedValue,
    });
  }

  function handleCustomDateInputBlur() {
    if (isValidInputDate(customStartDateInput)) {
      return;
    }

    setCustomStartDateInput(customStartDate);
  }

  function openCustomDatePicker() {
    const input = customStartPickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;

    if (!input) {
      return;
    }

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  function handleSelectChartDate(nextDate: string) {
    setCustomStartDate(nextDate);
    setCustomStartDateInput(nextDate);
    trackAnalyticsEvent("jump_to_chart_date", {
      selectedCount: selectedAssetIds.length,
      startDate: nextDate,
    });
  }

  function handleChangeRaceSpeed(nextSpeed: RaceSpeed) {
    setRaceSpeed(nextSpeed);
    trackAnalyticsEvent("change_race_speed", {
      speed: nextSpeed,
    });
  }

  function handleChangeRaceResolution(nextResolution: RaceResolution) {
    setStartPointChartResolution(nextResolution);
    trackAnalyticsEvent("change_chart_resolution", {
      resolution: nextResolution,
    });
  }

  function handleSaveAssetCombo() {
    if (!selectedAssetIds.length) {
      setTimeMachineFeedback("저장할 자산을 먼저 골라주세요.");
      return;
    }

    saveAssetCombo({
      assetIds: selectedAssetIds,
      label: selectedAssets.map((asset) => asset.shortLabel ?? asset.label).join(" · "),
    });
    setSavedAssetCombos(readSavedAssetCombos());
    setTimeMachineFeedback("현재 자산 조합을 저장했습니다.");
    trackAnalyticsEvent("save_asset_combo", {
      assetCount: selectedAssetIds.length,
    });
  }

  function handleSaveScenario() {
    const scenarioPreview = flowStep === "start-point" ? customStartPreview : raceBuild;

    if (!scenarioPreview) {
      setTimeMachineFeedback("저장할 시나리오가 아직 없습니다.");
      return;
    }

    saveScenario({
      amount: amountValue,
      assetIds: selectedAssetIds,
      label: `${selectedAssets.map((asset) => asset.shortLabel ?? asset.label).join(" · ")} · ${scenarioPreview.resolvedStartDate}`,
      resolution: effectiveRaceResolution,
      speed: raceSpeed,
      startDate: scenarioPreview.resolvedStartDate,
    });
    setSavedScenarios(readSavedScenarios());
    setTimeMachineFeedback("현재 시나리오를 저장했습니다.");
    trackAnalyticsEvent("save_scenario", {
      assetCount: selectedAssetIds.length,
      resolution: effectiveRaceResolution,
      startDate: scenarioPreview.resolvedStartDate,
    });
  }

  function handleSaveResult() {
    if (flowStep === "solo" && soloFlowStep === "result" && soloAssetId && soloResultMetrics) {
      const label = `${soloResultMetrics.displayLabel} vs 정기예금 기준`;
      const resultLabel = formatKrwExact(soloResultMetrics.finalValue);

      saveTimelineRecord({
        amountLabel: formattedSoloAmountValue,
        assetIds: [soloAssetId],
        label,
        resultLabel,
        summary: `정기예금 기준과 비교해 ${formatMetricMultiple(soloResultMetrics.multiple)}까지 벌어졌습니다.`,
        type: "solo",
      });
      saveToHistory({
        amount: soloAmountValue,
        assetA: soloAssetId,
        assetB: "deposit-benchmark",
        cagr: soloResultMetrics.annualizedReturnPct,
        finalValue: soloResultMetrics.finalValue,
        investmentType: "solo",
        label,
        mdd: soloResultMetrics.maxDrawdownPct,
        resultLabel,
        source: "result-save",
      });
      setSavedTimelineRecords(readSavedTimelineRecords());
      setShareFeedback("결과를 기록 탭에 저장했습니다.");
      trackAnalyticsEvent("save_result", {
        assetCount: 1,
        type: "solo",
      });
      return;
    }

    if (!raceCompletionSummary || selectedAssetIds.length === 0) {
      setShareFeedback("저장할 결과가 아직 없습니다.");
      return;
    }

    const leaderMetrics = resultAssetMetrics[raceCompletionSummary.assetId];
    const label = getComparisonAssetIdsLabel(selectedAssetIds);

    saveTimelineRecord({
      amountLabel: formattedActiveInvestmentAmountValue,
      assetIds: selectedAssetIds,
      label,
      resultLabel: raceCompletionSummary.finalValueLabel,
      summary: `${raceCompletionSummary.assetLabel}가 앞섰고, 최대 낙폭은 ${raceCompletionSummary.maxDrawdownLabel}였습니다.`,
      type: selectedAssetIds.length > 1 ? "compare" : "solo",
    });
    saveToHistory({
      amount: activeInvestmentAmountValue,
      assetA: selectedAssetIds[0] ?? null,
      assetB: selectedAssetIds[1] ?? "deposit-benchmark",
      cagr: leaderMetrics?.annualizedReturnPct ?? null,
      finalValue: leaderMetrics?.finalValue ?? null,
      investmentType: investmentMode,
      label,
      mdd: raceCompletionSummary.maxDrawdownPct,
      resultLabel: raceCompletionSummary.finalValueLabel,
      source: "result-save",
    });
    setSavedTimelineRecords(readSavedTimelineRecords());
    setShareFeedback("결과를 기록 탭에 저장했습니다.");
    trackAnalyticsEvent("save_result", {
      assetCount: selectedAssetIds.length,
      type: selectedAssetIds.length > 1 ? "compare" : "solo",
    });
  }

  function openPremiumPrompt(feature: PremiumFeatureId) {
    setIsMenuOpen(false);
    trackAnalyticsEvent("click_ad_supported_feature", {
      feature,
      flowStep,
    });
    setTimeMachineFeedback("이 기능은 광고 기반 무료 기능으로 전환했습니다.");
  }

  async function shareOrCopy({
    copiedMessage,
    errorMessage,
    text,
    title,
    url = window.location.href,
  }: {
    copiedMessage: string;
    errorMessage: string;
    text: string;
    title: string;
    url?: string;
  }) {
    const shareData: ShareData = { text, title, url };

    try {
      if (
        typeof navigator.share === "function" &&
        (!navigator.canShare || navigator.canShare(shareData))
      ) {
        await navigator.share(shareData);
        setShareFeedback("공유창을 열었습니다.");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShareFeedback(copiedMessage);
        return;
      }

      throw new Error("share-unavailable");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setShareFeedback("공유를 취소했습니다.");
        return;
      }

      setShareFeedback(errorMessage);
    }
  }

  async function handleShareResult() {
    if (!raceBuild || !resultRows.length) {
      return;
    }

    const lead = resultRows[0]!;
    const amountLabel = formatKrwCompact(lead.finalValue);
    const leadTimetable =
      noProfitTimetableOptions.find((option) => option.id === lead.assetId)?.timetable ??
      noProfitTimetable;
    const depositResult = resultRows.find((row) => row.assetId === "deposit");
    const investedKrw = lead.totalInvestedKrw ?? activeInvestmentAmountValue;
    const finalGapKrw = depositResult ? lead.finalValue - depositResult.finalValue : lead.finalValue - investedKrw;
    const waitingMonths = leadTimetable?.belowHighMonths ?? 0;
    const summary = `아... 10년 전 ${lead.label} 샀으면 내 자산 ${amountLabel} 됐었네... ${formatPercent(
      lead.totalReturnPct,
    )} 대박 스코어 뒤에 숨겨진 가혹했던 ${waitingMonths}개월의 기다림 지도 지금 직접 확인해봐. 너라면 버텼을까?\n투자 권유가 아닌 과거 시뮬레이션입니다.`;
    const shareUrl = buildOgShareUrl({
      assetLabel: lead.label,
      finalValueLabel: amountLabel,
      gapLabel: formatKrwExact(finalGapKrw),
      investedLabel: formatKrwExact(investedKrw),
      waitingMonths,
    });

    await shareOrCopy({
      copiedMessage: "결과 링크와 요약을 복사했습니다.",
      errorMessage: "결과 공유를 완료하지 못했습니다.",
      text: summary,
      title: `RegretZero · ${lead.label} 10년 결과`,
      url: shareUrl,
    });
  }

  async function handleDownloadRegretReceipt() {
    if (!raceBuild || !resultRows.length) {
      return;
    }

    const lead = resultRows[0]!;
    const leadTimetable =
      noProfitTimetableOptions.find((option) => option.id === lead.assetId)?.timetable ??
      noProfitTimetable;
    const depositResult = resultRows.find((row) => row.assetId === "deposit");
    const investedKrw = lead.totalInvestedKrw ?? amountValue;
    const finalGapKrw = depositResult ? lead.finalValue - depositResult.finalValue : lead.finalValue - investedKrw;
    const waitingMonths = leadTimetable?.belowHighMonths ?? 0;
    const darkMonths = leadTimetable?.belowPrincipalMonths ?? 0;
    const canvas = document.createElement("canvas");
    const isMobileViewport = window.matchMedia?.("(max-width: 767px)").matches ?? false;
    const scale = isMobileViewport ? 1.5 : Math.max(1.5, Math.min(window.devicePixelRatio || 2, 2));
    const width = 720;
    const height = 1120;
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setShareFeedback("요약 이미지를 만들지 못했습니다.");
      return;
    }

    ctx.scale(scale, scale);
    ctx.fillStyle = "#f4f7fb";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 48, 44, width - 96, height - 88, 32);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.font = "700 24px monospace";
    ctx.fillText("REGRETZERO SUMMARY", 84, 104);

    ctx.fillStyle = "#dbe3ef";
    for (let index = 0; index < 32; index += 1) {
      const x = 84 + index * 16;
      const barHeight = 34 + ((index * 13) % 34);
      ctx.fillRect(x, 134, index % 3 === 0 ? 8 : 5, barHeight);
    }

    ctx.fillStyle = "#64748b";
    ctx.font = "500 20px sans-serif";
    ctx.fillText("10년 투자 타임머신 결과", 84, 232);

    ctx.fillStyle = "#0f172a";
    ctx.font = "800 42px sans-serif";
    wrapCanvasText(ctx, `${lead.label}의 10년`, 84, 294, width - 168, 54);

    const rows = [
      ["총 투입 원금", formatKrwExact(investedKrw)],
      ["최종 평가금액", formatKrwExact(lead.finalValue)],
      ["총 수익률", formatPercent(lead.totalReturnPct)],
      ["고점 아래 있었던 시간", formatNoProfitDuration(waitingMonths)],
      ["원금 아래 있었던 시간", formatNoProfitDuration(darkMonths)],
      [depositResult ? "정기예금 대비 격차" : "원금 대비 격차", formatKrwExact(finalGapKrw)],
    ];

    let y = 438;
    rows.forEach(([label, value]) => {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 18px sans-serif";
      ctx.fillText(label, 84, y);
      ctx.fillStyle = "#0f172a";
      ctx.font = "800 30px sans-serif";
      ctx.fillText(value, 84, y + 42);
      y += 98;
    });

    ctx.strokeStyle = "#e2e8f0";
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    ctx.moveTo(84, 944);
    ctx.lineTo(width - 84, 944);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#475569";
    ctx.font = "600 19px sans-serif";
    wrapCanvasText(
      ctx,
      "최종 금액만 보면 쉬워 보입니다. 이 카드에는 그 사이 버텨야 했던 시간까지 함께 남깁니다.",
      84,
      990,
      width - 168,
      30,
    );

    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 16px sans-serif";
    ctx.fillText("투자 권유가 아닌 과거 시뮬레이션입니다.", 84, 1064);

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `regretzero-${lead.assetId}-receipt.png`;
    link.href = dataUrl;
    link.click();
    setShareFeedback("10년 결과 요약 이미지를 저장했습니다.");
  }

  async function handleShareNoProfitTimetable(activeTimetable?: NoProfitTimetable) {
    const shareText = activeTimetable
      ? buildNoProfitTimetableShareText(activeTimetable)
      : noProfitShareText;

    if (!shareText) {
      return;
    }

    await shareOrCopy({
      copiedMessage: "10년 기다림 지도를 복사했습니다.",
      errorMessage: "지도 공유를 완료하지 못했습니다.",
      text: shareText,
      title: "RegretZero 10년 기다림 지도",
    });
  }

  async function handleShareSoloNoProfitTimetable(activeTimetable?: NoProfitTimetable) {
    const shareText = activeTimetable
      ? buildNoProfitTimetableShareText(activeTimetable)
      : soloNoProfitShareText;

    if (!shareText) {
      return;
    }

    await shareOrCopy({
      copiedMessage: "10년 기다림 지도를 복사했습니다.",
      errorMessage: "지도 공유를 완료하지 못했습니다.",
      text: shareText,
      title: "RegretZero 10년 기다림 지도",
    });
  }

  async function handleShareDifficultyNoProfitTimetable(activeTimetable?: NoProfitTimetable) {
    const shareText = activeTimetable
      ? buildNoProfitTimetableShareText(activeTimetable)
      : difficultyNoProfitShareText;

    if (!shareText) {
      return;
    }

    await shareOrCopy({
      copiedMessage: "버티기 지도를 복사했습니다.",
      errorMessage: "버티기 공유를 완료하지 못했습니다.",
      text: shareText,
      title: "RegretZero 버티기",
    });
  }

  function applyCustomStartComparison() {
    if (!customStartPreview) {
      return;
    }

    trackAnalyticsEvent("start_race_from_selected_date", {
      resolution: effectiveRaceResolution,
      speed: raceSpeed,
      startDate: customStartPreview.resolvedStartDate,
    });

    const nextRange = {
      end: raceDateRange.end,
      isPremiumCustom: true,
      label: `${customStartPreview.resolvedStartDate.replace(/-/g, ".")}부터 비교`,
      start: customStartDate,
    };

    setActiveStartDateRange(nextRange);
    goToRaceWithRange(nextRange);
  }

  function toggleAmountAssetInfo() {
    setIsAmountAssetInfoOpen((previous) => !previous);
  }

  function toggleResultAssetInfo(assetId: ComparisonAssetId) {
    setExpandedResultAssetIds((previous) =>
      previous.includes(assetId)
        ? previous.filter((currentAssetId) => currentAssetId !== assetId)
        : [...previous, assetId],
    );
  }

  function renderAssetBrowserItem(
    assetId: ComparisonAssetId,
    options?: {
      locked?: boolean;
    },
  ) {
    const asset = assetCatalog[assetId];
    const isLocked = options?.locked ?? false;
    const selectedIndex = selectedAssetIds.indexOf(assetId);
    const isSelected = selectedIndex >= 0;
    const isDisabled = !asset.isAvailable && !isLocked;
    const slotColor = isSelected ? getComparisonSlotColor(selectedIndex) : null;
    const slotGlow = isSelected ? getComparisonSlotGlow(selectedIndex, 0.14) : null;
    const tickerLabel = getAssetBrowserTickerLabel(asset);
    const categoryLabel = getAssetBrowserCategoryLabel(asset);
    const actionLabel = isLocked
      ? "준비 중"
      : isDisabled
        ? "비교 불가"
        : isSelected
          ? `선택됨 ${selectedIndex + 1}`
          : canAddAnotherMainAsset(selectedAssetIds)
            ? "선택"
            : "누르면 교체";

    return (
      <button
        key={`${isLocked ? "locked" : "asset"}-${assetId}`}
        aria-pressed={isLocked ? undefined : isSelected}
        className="surface-card min-h-[88px] rounded-[22px] px-4 py-3.5 text-left transition active:scale-[0.99] disabled:cursor-not-allowed"
        disabled={isDisabled}
        onClick={() => {
          if (isLocked) {
            openPremiumPrompt("deeper-analysis");
            return;
          }

          handleAssetToggle(assetId);
        }}
        style={{
          backgroundColor: isSelected ? slotGlow ?? "var(--rz-surface-card)" : "var(--rz-surface-card)",
          borderColor: isSelected ? `${slotColor}CC` : "var(--rz-border)",
          opacity: isDisabled ? 0.52 : 1,
          boxShadow: isSelected
            ? `0 0 0 1px ${slotColor}55, 0 16px 34px rgba(0,0,0,0.18)`
            : "var(--rz-shadow-card)",
        }}
        type="button"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <div className="truncate text-[15px] font-semibold tracking-[-0.03em] text-white">
                {getAssetBrowserLabel(asset)}
              </div>
              {isSelected ? (
                <div
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: `${slotColor}20`,
                    color: slotColor ?? "var(--rz-accent)",
                  }}
                >
                  {selectedIndex + 1}번
                </div>
              ) : null}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-white/8 bg-white/[0.025] px-2.5 py-1 text-[11px] font-semibold text-white/52">
                {tickerLabel}
              </span>
              <span className="rounded-full border border-white/8 bg-white/[0.025] px-2.5 py-1 text-[11px] text-white/42">
                {categoryLabel}
              </span>
            </div>
            <div className="mt-2 line-clamp-2 text-xs leading-5 text-white/54">
              {getAssetBrowserDescription(asset)}
            </div>
          </div>

          <div
            className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold"
            style={{
              backgroundColor: isLocked
                ? "var(--rz-accent-soft)"
                : isSelected
                  ? `${slotColor}20`
                  : "rgba(255,255,255,0.04)",
              color: isLocked
                ? "var(--rz-accent)"
                : isSelected
                  ? slotColor ?? "var(--rz-text-primary)"
                  : isDisabled
                    ? "rgba(148,163,184,0.5)"
                    : "var(--rz-text-muted)",
            }}
          >
            {actionLabel}
          </div>
        </div>
      </button>
    );
  }

  return (
    <main className="rz-neon-app min-h-dvh bg-transparent text-white">
      {showDesktopHomeDashboard ? (
        <DesktopHomeDashboard
          activeMenuIntent={menuIntent}
          activePrimaryNavKey={primaryNavActiveKey}
          canContinueFromAssetSelection={canContinueFromAssetSelection}
          dailyDirectPickAssets={dailyDirectPickAssets}
          featuredRivalScenarios={featuredRivalScenarios}
          featuredSoloScenarios={featuredSoloScenarios}
          goToAllAssets={goToCompareBuilder}
          goToAmount={goToAmount}
          goToHome={goToHome}
          goToExamples={goToSoloBuilder}
          goToSavedRecords={goToSavedRecords}
          isMenuOpen={isMenuOpen}
          onAssetToggle={handleAssetToggle}
          onMoreMenuOpen={openMoreMenu}
          onMenuOpenChange={setIsMenuOpen}
          onPresetBrowserOpen={goToRecommendedComparisons}
          onRivalScenarioShuffle={shuffleFeaturedRivalScenarios}
          onScenarioStart={startHomeScenario}
          onSoloScenarioShuffle={shuffleFeaturedSoloScenarios}
          onTimelineScenarioReplay={startTimelineScenario}
          rivalScenarioShuffleKey={rivalScenarioShuffleKey}
          selectedAssetIds={selectedAssetIds}
          selectedAssets={selectedAssets}
          syncedMatchups={syncedMatchups}
        />
      ) : null}

      {shouldShowDesktopTopNav ? (
        <div className="hidden px-6 pt-5 lg:block xl:px-8 xl:pt-6">
          <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6">
            <button
              className="text-lg font-semibold tracking-[-0.04em] text-[var(--rz-text-primary)]"
              onClick={goToHome}
              type="button"
            >
              RegretZero
            </button>
            <DesktopPrimaryNav
              activeKey={primaryNavActiveKey}
              canContinue={canContinueFromAssetSelection && flowStep !== "amount"}
              onAssets={goToCompareBuilder}
              onCompare={goToSoloBuilder}
              onContinue={goToAmount}
              onMore={openMoreMenu}
              onSaved={goToSavedRecords}
            />
          </header>
        </div>
      ) : null}

      <div
        className={`rz-mobile-shell mx-auto flex min-h-dvh w-full max-w-[460px] flex-col px-5 pt-4 sm:max-w-[520px] ${mobileBottomPaddingClass}`}
      >
        <header className="relative flex items-center justify-between">
          {shouldShowBottomPrimaryNav ? (
            <div aria-hidden="true" className="h-11 w-11" />
          ) : (
            <ControlledAppMenu
              activeMenuIntent={menuIntent}
              isOpen={isMenuOpen}
              onHomeClick={goToHome}
              onOpenChange={setIsMenuOpen}
            />
          )}
          <button
            aria-label="RegretZero 초기 화면으로 이동"
            className="absolute left-1/2 -translate-x-1/2 rounded-full px-3 py-2 text-base font-semibold tracking-[-0.03em] text-white transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
            onClick={goToHome}
            type="button"
          >
            RegretZero
          </button>
          <div className="w-11" />
        </header>

        <div className="flex flex-1 flex-col">
          {flowStep === "intro" ? (
            <section className="flex flex-1 flex-col py-2 pb-8">
              <div className="space-y-3.5">
                <div className="px-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/36">
                    10년 투자 타임머신
                  </div>
                  <h1 className="mt-2 text-[2.15rem] font-semibold leading-[1.04] tracking-[-0.075em] text-white">
                    10년 전 샀다면,
                    <br />
                    지금 얼마였을까요?
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-white/56">
                    투자 지식이 없어도 괜찮습니다. 종목 하나를 고르면{" "}
                    <strong className="font-semibold text-white">예금 기준</strong>과 나란히 달려서,
                    놓친 돈과 버텨야 했던 시간을 보여드립니다.
                  </p>
                  <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-[18px] border border-white/8 bg-white/[0.025]">
                    {INTRO_FLOW_POINTS.map((point) => (
                      <div className="border-r border-white/8 px-2.5 py-2.5 last:border-r-0" key={point.label}>
                        <div className="text-[11px] font-bold text-[var(--rz-accent)]">{point.label}</div>
                        <div className="mt-1 text-[11px] font-medium leading-4 text-white/68">{point.text}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="surface-card rounded-[26px] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--rz-accent)]">
                        빠른 시작
                      </div>
                      <div className="mt-1.5 text-lg font-semibold tracking-[-0.05em] text-white">
                        먼저 하나만 돌려보세요
                      </div>
                      <div className="mt-1 text-xs leading-5 text-white/56">
                        복잡한 설정 없이 익숙한 종목 하나로 바로 시작합니다.
                      </div>
                    </div>
                    <button
                      className="shrink-0 rounded-full border border-white/14 bg-white/[0.08] px-4 py-2 text-sm font-bold text-white transition hover:bg-white/[0.12]"
                      onClick={shuffleFeaturedSoloScenarios}
                      type="button"
                    >
                      바꾸기
                    </button>
                  </div>
                  <div className="mt-4">
                    {featuredSoloScenarios.slice(0, 1).map((scenario) => (
                      <button
                        className="group w-full rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-2.5 text-left transition hover:bg-white/[0.06]"
                        key={`${scenario.mode}-${scenario.title}`}
                        onClick={() => startHomeScenario(scenario)}
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-[11px] font-semibold tracking-[-0.01em] text-[var(--rz-accent)]">
                            {scenario.badge}
                          </div>
                          <div className="rounded-full border border-[var(--rz-border-strong)] bg-[var(--rz-accent-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--rz-accent)]">
                            지금 보기
                          </div>
                        </div>
                        <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">
                          {scenario.title}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-white/54">
                          {scenario.description}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2">
                    <button
                      className="btn-accent min-h-11 w-full rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition"
                      onClick={goToAllAssets}
                      type="button"
                    >
                      전체 종목 검색
                    </button>
                    <button
                      className="btn-secondary min-h-10 w-full rounded-full px-5 text-sm font-semibold tracking-[-0.02em] text-[var(--rz-accent)] transition"
                      onClick={goToSoloBuilder}
                      type="button"
                    >
                      목록에서 직접 고르기
                    </button>
                  </div>
                </div>

                <ComplianceNotice compact />

                <details className="surface-card rounded-[24px] px-4 py-4">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold tracking-[-0.03em] text-white">
                          더 비교해보고 싶다면
                        </div>
                        <div className="mt-1 text-xs leading-5 text-white/46">
                          라이벌 매치업과 오늘 많이 돌려본 기록을 펼쳐보세요.
                        </div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-bold text-white/68">
                        펼치기
                      </div>
                    </div>
                  </summary>

                  <div className="mt-4 border-t border-white/8 pt-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold tracking-[-0.03em] text-white">
                          라이벌 매치업
                        </div>
                        <div className="mt-1 text-xs leading-5 text-white/46">
                          많이 비교하는 조합만 빠르게 모았습니다.
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          className="rounded-full border border-white/14 bg-white/[0.08] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/[0.12]"
                          onClick={shuffleFeaturedRivalScenarios}
                          type="button"
                        >
                          바꾸기
                        </button>
                        <button
                          className="border-b border-white pb-0.5 text-xs font-bold text-white transition hover:text-white/78"
                          onClick={goToRecommendedComparisons}
                          type="button"
                        >
                          전체
                        </button>
                      </div>
                    </div>
                    <div
                      className="animate-[rz-map-fade_180ms_ease-out]"
                      key={`mobile-rivals-${rivalScenarioShuffleKey}`}
                    >
                      <HomeScenarioGrid
                        onSelect={startHomeScenario}
                        scenarios={featuredRivalScenarios.slice(0, 2)}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <TrendRankingTicker
                      matchups={syncedMatchups}
                      onSelect={(assetIds) =>
                        startHomeScenario({
                          assetIds,
                          badge: "오늘의 매치업",
                          description: "오늘 많이 돌려본 조합입니다.",
                          mode: "compare",
                          title: getComparisonAssetIdsLabel(assetIds),
                        })
                      }
                    />
                  </div>

                  <div className="mt-4">
                    <DynamicLiveTimeline
                      matchups={syncedMatchups}
                      onReplayScenario={startTimelineScenario}
                    />
                  </div>
                </details>
              </div>
            </section>
          ) : null}

          {flowStep === "solo" ? (
            <section className="flex flex-1 flex-col py-6 pb-10">
              {soloFlowStep === "pick" ? (
                <>
                  <StepHeader
                    description="한 종목을 예금 기준 옆에 놓고 10년을 먼저 돌려봅니다."
                    onBack={goToHome}
                    step={1}
                    title="한 종목만 골라보세요"
                  />
                  <div className="surface-card mt-7 rounded-[26px] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/34">
                          SOLO REWIND
                        </div>
                        <div className="mt-2 text-lg font-semibold tracking-[-0.05em] text-white">
                          먼저 돌려볼 자산을 골라주세요
                        </div>
                        <div className="mt-1 text-sm leading-6 text-white/54">
                          다른 종목과 붙이기 전에{" "}
                          <strong className="text-white">정기예금 기준</strong>부터 확인합니다.
                        </div>
                      </div>
                      <div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] text-white/54">
                        1개 선택
                      </div>
                    </div>
                    <SoloAssetGrid
                      assets={soloQuickAssets}
                      onSelect={handleSoloAssetSelect}
                      selectedAssetId={soloAssetId}
                    />
                  </div>
                  <button
                    className="btn-secondary mt-4 min-h-12 rounded-full px-5 text-sm font-semibold text-[var(--rz-accent)] transition"
                    onClick={goToAllAssets}
                    type="button"
                  >
                    전체 종목 검색으로 찾기
                  </button>
                </>
              ) : null}

              {soloFlowStep === "amount" && soloAsset ? (
                <>
                  <StepHeader
                    description={`${soloAsset.shortLabel ?? soloAsset.label}에 넣었다고 가정할 금액을 정합니다. 예금 기준과 바로 비교됩니다.`}
                    onBack={() => setSoloFlowStep("pick")}
                    step={2}
                    title="얼마를 넣었다고 볼까요?"
                  />
                  <div className="surface-card mt-7 rounded-[26px] p-4">
                    <div className="rounded-[22px] border border-[var(--rz-border)] bg-[var(--rz-surface-card-elevated)] px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--rz-text-muted)]">
                        선택한 자산
                      </div>
                      <div className="mt-2 text-xl font-semibold tracking-[-0.05em] text-[var(--rz-text-primary)]">
                        {getHomeIntroSelectedLabel(soloAsset)}
                      </div>
                      <div className="mt-1 text-sm leading-6 text-[var(--rz-text-secondary)]">
                        {getHomeIntroSelectedDescription(soloAsset)}
                      </div>
                    </div>

                    <div className="mt-4 rounded-[22px] border border-[var(--rz-border)] bg-white/80 p-2 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                      <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--rz-text-muted)]">
                        분석 범위
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            body: "예금 복리 기준과 최근 10년을 맞춰 봅니다.",
                            id: "recent10y" as const,
                            title: "최근 10년 복리 대조",
                          },
                          {
                            body: "첫 데이터가 있는 날부터 끝까지 보유한 기준입니다.",
                            id: "since-listing" as const,
                            title: "상장 이후 홀딩",
                          },
                        ].map((option) => {
                          const isActive = soloHorizonMode === option.id;

                          return (
                            <button
                              className={`min-h-[86px] rounded-[18px] border-2 px-3 py-3 text-left transition ${
                                isActive
                                  ? "!border-slate-900 !bg-white !text-slate-950 shadow-[0_12px_28px_rgba(15,23,42,0.08)] ring-4 ring-slate-100"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                              key={option.id}
                              onClick={() => {
                                resetSoloRacePlayback();
                                setSoloHorizonMode(option.id);
                              }}
                              type="button"
                            >
                              <span className="block text-sm font-extrabold tracking-[-0.03em]">
                                {option.title}
                              </span>
                              <span className="mt-1 block text-xs font-medium leading-5 opacity-85">
                                {option.body}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {amountPresets.map((preset) => (
                        <button
                          className={`min-h-12 rounded-[18px] border px-3 text-sm font-semibold tracking-[-0.03em] transition ${
                            soloAmountValue === preset.value
                              ? "border-[var(--rz-accent)] bg-[var(--rz-accent-soft)] text-[var(--rz-accent)]"
                              : "border-[var(--rz-border)] bg-[var(--rz-surface-card-elevated)] text-[var(--rz-text-primary)] hover:border-[var(--rz-border-strong)] hover:bg-[var(--rz-accent-soft)]"
                          }`}
                          key={`solo-preset-${preset.value}`}
                          onClick={() => handleSoloAmountPresetClick(preset.value)}
                          type="button"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <label className="mt-4 block rounded-[22px] border border-[var(--rz-border)] bg-[var(--rz-surface-card-elevated)] px-4 py-3">
                      <span className="text-xs font-medium text-[var(--rz-text-muted)]">직접 입력</span>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tracking-[-0.05em] text-[var(--rz-text-primary)] outline-none placeholder:text-[var(--rz-text-subtle)]"
                          inputMode="numeric"
                          onChange={(event) => handleSoloAmountInputChange(event.target.value)}
                          placeholder="1,000"
                          value={soloAmountInput}
                        />
                        <span className="shrink-0 text-sm font-semibold text-[var(--rz-text-secondary)]">만원</span>
                      </div>
                    </label>

                    {(soloLoadError || soloCalculationError) ? (
                      <div className="mt-4 rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">
                        {soloLoadError || soloCalculationError}
                      </div>
                    ) : null}

                    <button
                      className="btn-accent mt-5 min-h-13 w-full rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition disabled:cursor-wait disabled:bg-white/12 disabled:text-white/40"
                      disabled={isSoloMarketLoading || Boolean(soloLoadError || soloCalculationError)}
                      onClick={goToSoloRace}
                      type="button"
                    >
                      {isSoloMarketLoading
                        ? "데이터 준비 중..."
                        : `${formattedSoloAmountValue}으로 레이스 시작`}
                    </button>
                  </div>
                </>
              ) : null}

              {soloFlowStep === "race" ? (
                <>
                  <StepHeader
                    description="예금 기준과 선택 자산의 격차가 언제 벌어졌는지 레이스로 봅니다."
                    onBack={() => {
                      resetSoloRacePlayback();
                      setSoloFlowStep("amount");
                    }}
                    step={3}
                    title={
                      soloAsset
                        ? `${soloAsset.shortLabel ?? soloAsset.label} · ${soloRequestedDateRange.label}`
                        : "한 종목 레이스"
                    }
                  />
                  {soloAsset && soloSimulation ? (
                    <div className="mt-7 space-y-4">
                      <RaceChart
                        assets={soloRaceAssets}
                        basisLabel="시중 은행 정기예금 기준 (복리 연 2.7%~3.1% 흐름)"
                        currentPoint={soloCurrentPoint}
                        data={soloRaceVisibleData}
                        fullData={soloRaceFullData}
                        headerSubtitle={`${soloRequestedDateRange.label} 기준으로 예금과 선택 자산을 같은 출발선에 놓습니다.`}
                        headerTitle={`${formattedSoloAmountValue}으로 출발하면`}
                        isLoading={isSoloMarketLoading || !soloSimulation || soloRaceStatus === "loading"}
                        principalKrw={soloAmountValue}
                      />

                      <div className="surface-card rounded-[26px] p-4">
                        <div className="grid grid-cols-2 gap-2">
                          {soloRaceStatus === "complete" ? (
                            <button
                              className="btn-accent min-h-12 rounded-full px-5 text-sm font-semibold transition"
                              onClick={goToSoloResult}
                              type="button"
                            >
                              결과 보기
                            </button>
                          ) : (
                            <button
                              className="btn-secondary min-h-12 rounded-full px-5 text-sm font-semibold text-[var(--rz-text-primary)] transition"
                              onClick={soloRaceStatus === "racing" ? handlePauseSoloRace : handlePlaySoloRace}
                              type="button"
                            >
                              {soloRaceStatus === "racing" ? "일시정지" : "재생"}
                            </button>
                          )}
                          <button
                            className="btn-secondary min-h-12 rounded-full px-5 text-sm font-semibold text-[var(--rz-text-primary)] transition"
                            onClick={handleRestartSoloRace}
                            type="button"
                          >
                            다시보기
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-white/36">
                            배속
                          </div>
                          <div className="grid flex-1 grid-cols-4 gap-1.5">
                            {RACE_PLAYBACK_SPEED_OPTIONS.map((option) => {
                              const isActive = option.id === raceSpeed;

                              return (
                                <button
                                  key={`solo-speed-${option.id}`}
                                  aria-pressed={isActive}
                                  className={`min-h-9 rounded-full border px-2 text-xs font-semibold transition ${
                                    isActive
                                      ? "border-white/24 bg-white text-slate-950"
                                      : "border-white/8 bg-white/[0.03] text-white/58 hover:bg-white/[0.06] hover:text-white/76"
                                  }`}
                                  onClick={() => handleChangeRaceSpeed(option.id)}
                                  type="button"
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="mt-3 text-center text-xs leading-5 text-[var(--rz-text-muted)]">
                          레이스가 끝나면 수익률, 최대 낙폭, 회복 기간까지 바로 이어집니다.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="surface-card mt-7 rounded-[26px] p-5 text-sm leading-6 text-[var(--rz-text-secondary)]">
                      {isSoloMarketLoading
                        ? "레이스 데이터를 준비하고 있습니다."
                        : soloLoadError || soloCalculationError || "레이스를 준비하지 못했습니다."}
                    </div>
                  )}
                </>
              ) : null}

              {soloFlowStep === "result" ? (
                <>
                  <StepHeader
                    description="한 종목의 흐름을 시중 은행 정기예금 흐름과 비교합니다."
                    onBack={() => {
                      resetSoloRacePlayback();
                      setSoloFlowStep("race");
                    }}
                    step={4}
                    title={
                      soloAsset
                        ? `${soloAsset.shortLabel ?? soloAsset.label} · ${soloRequestedDateRange.label}`
                        : "한 종목 결과"
                    }
                  />
                  <ComplianceNotice className="mt-4" />
                  {soloAsset && soloSimulation && soloHoldingPainReport && soloResultMetrics ? (
                    <div className="mt-7 space-y-5">
                      <div className="surface-card rounded-[28px] px-4 py-4">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                          한 줄 결론
                        </div>
                        <div className="mt-2 text-[1.15rem] font-semibold leading-7 tracking-[-0.04em] text-white">
                          {buildResultOneLineCopy({
                            assetLabel: soloResultMetrics.displayLabel,
                            finalValueLabel: formatKrwExact(soloResultMetrics.finalValue),
                            isMonthlyInvestmentMode: false,
                            maxDrawdownPct: soloResultMetrics.maxDrawdownPct,
                            multiple: soloResultMetrics.multiple,
                            recovered: soloHoldingPainReport.recovery.recovered,
                            recoveryMonths: soloHoldingPainReport.recovery.recoveryMonths,
                          })}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/38">최종 금액</div>
                            <div className="mt-2 font-semibold text-white">
                              {formatKrwExact(soloResultMetrics.finalValue)}
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/38">투입금 대비</div>
                            <div className="mt-2 font-semibold text-white">
                              {formatMetricMultiple(soloResultMetrics.multiple)}
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <MetricLabel help="고점에서 저점까지 가장 크게 밀린 비율입니다. 수익률보다 버티기 난이도를 보여주는 값이에요.">
                              최대 낙폭
                            </MetricLabel>
                            <div className="mt-2 font-semibold text-white">
                              {formatMetricPercent(soloResultMetrics.maxDrawdownPct)}
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <MetricLabel help="크게 떨어진 뒤 이전 고점을 다시 넘기까지 걸린 시간입니다.">
                              회복 기간
                            </MetricLabel>
                            <div className="mt-2 font-semibold text-white">{soloRecoveryLabel}</div>
                          </div>
                        </div>
                      </div>

                      <div className="surface-card rounded-[26px] px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs uppercase tracking-[0.22em] text-[var(--rz-accent)]">
                              선택 자산
                            </div>
                            <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">
                              {soloResultMetrics.displayLabel}
                            </div>
                          </div>
                          <div className="h-2.5 w-2.5 rounded-full bg-[var(--rz-accent)]" />
                        </div>

                        {soloStartDateAdjustmentNotice ? (
                          <div className="mt-4 rounded-[18px] border border-[var(--rz-border-strong)] bg-[var(--rz-accent-soft)] px-3 py-3 text-sm leading-6 text-[var(--rz-accent)]">
                            {soloStartDateAdjustmentNotice}
                          </div>
                        ) : null}

                        <div className="mt-5 text-[1.45rem] font-semibold tracking-[-0.05em] text-white">
                          {formatKrwExact(soloResultMetrics.finalValue)}
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/42">총 수익률</div>
                            <div className="mt-2 font-semibold text-white">
                              {formatMetricPercent(soloResultMetrics.totalReturnPct)}
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/42">최종 배수</div>
                            <div className="mt-2 font-semibold text-white">
                              {formatMetricMultiple(soloResultMetrics.multiple)}
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <MetricLabel help="처음 넣은 돈이 매년 같은 속도로 자랐다고 가정했을 때의 연평균 성장률입니다.">
                              CAGR
                            </MetricLabel>
                            <div className="mt-2 font-semibold text-white">
                              {soloResultMetrics.annualizedReturnPct === null
                                ? "-"
                                : formatMetricPercent(soloResultMetrics.annualizedReturnPct)}
                            </div>
                            <div className="mt-1 text-[11px] leading-4 text-white/36">
                              연복리 기준 연평균 성장률입니다.
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/42">실제 적용 시작일</div>
                            <div className="mt-2 font-semibold text-white">
                              {formatDateLabel(soloResultMetrics.appliedStartDate)}
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/42">종료 날짜</div>
                            <div className="mt-2 font-semibold text-white">
                              {formatDateLabel(soloResultMetrics.appliedEndDate)}
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/42">{soloResultMetrics.startPriceLabel}</div>
                            <div className="mt-2 font-semibold text-white">
                              {soloResultMetrics.startPriceValue}
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/42">{soloResultMetrics.endPriceLabel}</div>
                            <div className="mt-2 font-semibold text-white">
                              {soloResultMetrics.endPriceValue}
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/42">투입 금액</div>
                            <div className="mt-2 font-semibold text-white">
                              {formatKrwExact(soloResultMetrics.investmentAmount)}
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/42">수익</div>
                            <div className="mt-2 font-semibold text-white">
                              {formatKrwExact(soloResultMetrics.profitKrw)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <button
                            className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-white/72 transition hover:bg-white/[0.06]"
                            onClick={() => toggleResultAssetInfo(soloAsset.id)}
                            type="button"
                          >
                            {isSoloResultInfoOpen ? "자산 설명 닫기" : "자산 설명 보기"}
                          </button>
                        </div>
                        {isSoloResultInfoOpen ? (
                          <div className="mt-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
                            <div className="grid gap-1.5 text-sm leading-6 text-white/56">
                              {getResultInfoLines(soloAsset).slice(0, 3).map((line) => (
                                <div key={`${soloAsset.id}-${line}`}>{line}</div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <MetricLabel help="고점에서 저점까지 가장 크게 밀린 비율입니다. 결과가 커 보여도 이 구간을 지나야 했습니다.">
                              최대 낙폭
                            </MetricLabel>
                            <div className="mt-2 font-semibold text-white">
                              {formatMetricPercent(soloResultMetrics.maxDrawdownPct)}
                            </div>
                            <div className="mt-1 text-[11px] leading-4 text-white/36">
                              시작 후 최고점에서 가장 크게 밀린 폭입니다.
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <MetricLabel help="직전 고점 대비 30% 이상 하락한 구간 수입니다.">
                              고비 횟수
                            </MetricLabel>
                            <div className="mt-2 font-semibold text-white">
                              {Math.round(soloResultMetrics.hardshipCount)}회
                            </div>
                            <div className="mt-1 text-[11px] leading-4 text-white/36">
                              직전 고점 대비 30% 이상 하락한 구간 수입니다.
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <MetricLabel help="하락 후 이전 고점을 다시 넘어서기까지 기다린 시간입니다.">
                              회복 기간
                            </MetricLabel>
                            <div className="mt-2 font-semibold text-white">{soloRecoveryLabel}</div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/42">버티기 난이도</div>
                            <div className="mt-2 font-semibold text-white">
                              {soloHoldingPainReport.difficulty.label}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-white/34">
                            가장 힘들었던 구간
                          </div>
                          <div className="mt-2 text-sm font-semibold text-white">
                            {formatDateLabel(soloHoldingPainReport.worstMoment.date)} · 전고점 대비{" "}
                            {formatMetricPercent(soloHoldingPainReport.worstMoment.drawdownPct)}
                          </div>
                          <div className="mt-2 text-sm leading-6 text-white/56">
                            {soloHoldingPainReport.difficulty.explanation}
                          </div>
                        </div>

                        {soloCrisisEntries.length > 0 ? (
                          <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-3">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-white/34">
                              주요 고비
                            </div>
                            <div className="mt-3 space-y-3">
                              {soloCrisisEntries.map(({ crisis, index, label }) => (
                                <div
                                  key={`${soloAsset.id}-${crisis.startDate}-${crisis.troughDate}`}
                                  className="rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-3"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-[11px] text-white/42">고비 {index + 1}</div>
                                      <div className="mt-1 text-sm font-semibold text-white">{label}</div>
                                      <div className="mt-1 text-xs leading-5 text-white/44">
                                        최대 낙폭 {formatMetricPercent(crisis.maxDrawdownPct)}
                                      </div>
                                    </div>
                                    {soloCanOpenDetailChart ? (
                                      <button
                                        className="btn-secondary min-h-10 rounded-full px-4 text-sm font-semibold transition"
                                        onClick={() => openDetailChartForCrisis(soloAsset, label, crisis)}
                                        type="button"
                                      >
                                        이 구간 자세히 보기
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {soloResultMetrics.currencyNote ? (
                          <div className="mt-3 text-sm leading-6 text-white/46">
                            {soloResultMetrics.currencyNote}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/50">
                        고비 횟수는 직전 고점 대비 30% 이상 하락한 구간 수입니다.
                      </div>

                      {soloNoProfitTimetable ? (
                        <NoProfitTimetableCard
                          formatKrw={formatKrwCompact}
                          onShare={(activeTimetable) =>
                            void handleShareSoloNoProfitTimetable(activeTimetable)
                          }
                          timetable={soloNoProfitTimetable}
                        />
                      ) : null}

                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          className="btn-accent min-h-12 rounded-full px-5 text-sm font-semibold transition"
                          onClick={compareFromSolo}
                          type="button"
                        >
                          다른 자산과 비교
                        </button>
                        <button
                          className="btn-secondary min-h-12 rounded-full px-5 text-sm font-semibold text-[var(--rz-accent)] transition"
                          onClick={resetSoloFlow}
                          type="button"
                        >
                          한 번 더 보기
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="surface-card mt-7 rounded-[26px] p-5 text-sm leading-6 text-white/58">
                      {isSoloMarketLoading
                        ? "데이터를 준비하고 있습니다."
                        : soloLoadError || soloCalculationError || "결과를 준비하지 못했습니다."}
                    </div>
                  )}
                </>
              ) : null}
            </section>
          ) : null}

          {flowStep === "assets" ? (
            <section className="flex flex-1 flex-col py-6 pb-40">
              <StepHeader
                description={HOME_FLOW_COPY.assetDescription}
                onBack={() => setFlowStep("intro")}
                step={1}
                title={HOME_FLOW_COPY.assetTitle}
              />

              <div className="surface-card mt-8 rounded-[26px] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">선택한 자산</div>
                    <div className="mt-2 text-sm text-white/56">
                      {selectedAssetIds.length >= MIN_COMPARISON_ASSETS
                      ? "출발선이 준비됐습니다."
                        : "두 개만 고르면 됩니다."}
                    </div>
                  </div>
                  <div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-white/56">
                    {selectedAssetIds.length} / {MAIN_COMPARISON_ASSET_LIMIT} 선택
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  {selectedAssetSlots.map((asset, index) =>
                    asset ? (
                      <button
                        key={asset.id}
                        className="flex items-center gap-3 rounded-[18px] border px-3 py-2.5 text-left transition"
                        onClick={() => handleRemoveSelectedAsset(asset.id)}
                        style={{
                          backgroundColor: getComparisonSlotGlow(index, 0.14),
                          borderColor: `${getComparisonSlotColor(index)}66`,
                          boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
                        }}
                        type="button"
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${getComparisonSlotColor(index)}24`,
                            color: getComparisonSlotColor(index),
                          }}
                        >
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold tracking-[-0.03em] text-white">
                            {getSelectedQueueLabel(asset)}
                          </div>
                          <div className="mt-1 truncate text-[12px] text-white/48">
                            {getSelectedQueueSummary(asset)}
                          </div>
                        </div>
                        <div className="text-[11px] text-white/40">제거</div>
                      </button>
                    ) : (
                      <div
                        key={`asset-step-empty-slot-${index + 1}`}
                        className="flex items-center gap-3 rounded-[18px] border border-dashed border-white/10 bg-white/[0.02] px-3 py-2.5"
                        style={{
                          borderColor: `${getComparisonSlotColor(index)}20`,
                        }}
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${getComparisonSlotColor(index)}16`,
                            color: getComparisonSlotColor(index),
                          }}
                        >
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-white/38">비어 있음</div>
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[12px] leading-5 text-white/48">
                      새로 고르면 먼저 담은 자산이 교체됩니다.
                    </div>
                    <div className="mt-1 text-[11px] text-white/40">{HOME_FLOW_COPY.allAssetsHint}</div>
                  </div>
                  {!isAssetSelectionFull ? (
                    <button
                      className="min-h-11 shrink-0 rounded-full border border-[var(--rz-border-strong)] bg-[var(--rz-accent-soft)] px-4 text-sm font-semibold text-[var(--rz-accent)] transition hover:brightness-105"
                      onClick={openAssetPicker}
                      type="button"
                    >
                      전체 종목 검색
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                      빠른 선택
                    </div>
                    <div className="mt-2 text-sm text-white/56">
                      익숙한 이름부터 바로 담아보세요.
                    </div>
                  </div>
                  <button
                    className="rounded-full border border-[var(--rz-border-strong)] bg-[var(--rz-accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--rz-accent)] transition hover:brightness-105"
                    onClick={openAssetPicker}
                    type="button"
                  >
                    전체 종목 검색
                  </button>
                </div>

                <DirectPickAssetGrid
                  assets={dailyDirectPickAssets}
                  className="mt-4 sm:grid-cols-4"
                  onAssetToggle={handleAssetToggle}
                  selectedAssetIds={selectedAssetIds}
                />
              </div>

              <div className="mt-6 grid gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                      {HOME_FLOW_COPY.recommendedTitle}
                    </div>
                    <div className="mt-2 text-sm text-white/56">
                      {HOME_FLOW_COPY.recommendedDescription}
                    </div>
                  </div>
                  <div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-white/56">
                    2개 자산
                  </div>
                </div>

                <button
                  className="btn-secondary min-h-12 w-full rounded-full px-5 text-sm font-semibold text-[var(--rz-accent)] transition"
                  onClick={goToRecommendedComparisons}
                  type="button"
                >
                  프리셋 목록 열기
                </button>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
                <BeginnerGuideBoard compact onStartExample={startTutorialExample} />
                <AdSlot
                  className="mt-4 min-h-[90px]"
                  label="홈 광고"
                  placement="home-mobile-guide"
                  slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT}
                />
              </div>

              <div className="mt-auto pt-8">
                <div className="text-sm text-white/48">
                  {!canContinueFromAssetSelection
                    ? "궁금한 자산을 고르면 바로 출발할 수 있습니다."
                    : selectedAssetIds.length === 1
                      ? "하나만 골라도 예금 기준으로 먼저 볼 수 있습니다."
                    : isAssetSelectionFull
                      ? "두 자산이 같은 출발선에 섰습니다."
                      : "지금 출발하거나, 다른 자산으로 바꿀 수 있습니다."}
                </div>
              </div>
            </section>
          ) : null}

          {flowStep === "amount" ? (
            <section className="flex flex-1 flex-col py-4 pb-40">
              <StepHeader
                description="금액만 정하면 바로 10년 레이스를 시작합니다."
                onBack={goToAssets}
                step={2}
                title="금액만 정하세요"
              />

              <div className="surface-card mt-4 rounded-[22px] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                      선택한 종목
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedAssets.map((asset, index) => (
                        <div
                          key={asset.id}
                          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold text-white"
                          style={{
                            backgroundColor: getComparisonSlotGlow(index, 0.12),
                            borderColor: `${getComparisonSlotColor(index)}38`,
                          }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: getComparisonSlotColor(index) }}
                          />
                          <span>{asset.shortLabel ?? asset.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    className="shrink-0 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-white/72 transition hover:bg-white/[0.06]"
                    onClick={toggleAmountAssetInfo}
                    type="button"
                  >
                    {isAmountAssetInfoOpen ? "닫기" : "설명"}
                  </button>
                </div>
                <div className="mt-2 text-xs leading-5 text-white/50">
                  {activeStartDateRange.isPremiumCustom
                    ? `${formatDateLabel(raceBuild?.resolvedStartDate ?? activeStartDateRange.start)}부터 봅니다.`
                    : isMonthlyInvestmentMode
                      ? "매달 같은 금액을 쌓아가는 기준입니다."
                      : "같은 금액으로 10년을 비교합니다."}
                </div>
                {realEstateSelectionNotice ? (
                  <div className="mt-2 text-xs leading-5 text-white/48">
                    {realEstateSelectionNotice}
                  </div>
                ) : null}
                {startDateAdjustmentNotice ? (
                  <div className="mt-3">
                    <DataStartNotice notice={startDateAdjustmentNotice} />
                  </div>
                ) : null}
                {isAmountAssetInfoOpen ? (
                  <div className="mt-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
                    <div className="grid gap-2 text-sm leading-6 text-white/56">
                      {selectedAssets.map((asset) => (
                        <div key={`amount-info-${asset.id}`}>
                          <span className="font-medium text-white">{asset.label}</span>
                          <span className="text-white/56">: {getAmountInfoText(asset).replace(`${asset.label}: `, "")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                    {isMonthlyInvestmentMode ? "월 납입 금액" : "시작 금액"}
                  </div>
                  <div className="mt-2 text-base font-semibold tracking-[-0.03em] text-white">
                    {isMonthlyInvestmentMode ? "매달 얼마씩 넣을까요?" : HOME_FLOW_COPY.amountTitle}
                  </div>
                </div>
                <div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-white/54">
                  원화 기준
                </div>
              </div>

              <div className={`mt-3 grid gap-2.5 ${isMonthlyInvestmentMode ? "grid-cols-2" : "grid-cols-1"}`}>
                {visibleAmountPresets.map((preset) => {
                  const isActive = isMonthlyInvestmentMode
                    ? monthlyContributionMode === "preset" &&
                      activeMonthlyContributionPreset === preset.value
                    : amountMode === "preset" && activePreset === preset.value;

                  return (
                    <button
                      key={preset.value}
                      aria-pressed={isActive}
                      className="min-h-[78px] rounded-[20px] border px-3.5 py-3 text-left transition"
                      onClick={() =>
                        isMonthlyInvestmentMode
                          ? handleMonthlyContributionPresetClick(preset.value)
                          : handlePresetClick(preset.value)
                      }
                      style={{
                        backgroundColor: isActive
                          ? "var(--rz-surface-card-elevated)"
                          : "var(--rz-surface-card)",
                        borderColor: isActive
                          ? "var(--rz-border-strong)"
                          : "var(--rz-border)",
                        boxShadow: isActive ? "0 0 0 1px rgba(96,165,250,0.18)" : "var(--rz-shadow-card)",
                      }}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                          {isMonthlyInvestmentMode ? "월 납입" : "금액"}
                        </div>
                        <div
                          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{
                            backgroundColor: isActive ? "var(--rz-accent-soft)" : "rgba(255,255,255,0.04)",
                            color: isActive ? "var(--rz-accent)" : "rgba(148,163,184,0.82)",
                          }}
                        >
                          {isActive ? "선택됨" : isMonthlyInvestmentMode ? "빠른 선택" : "기본 금액"}
                        </div>
                      </div>
                      <div className="mt-3 text-[1.08rem] tracking-[-0.04em] text-white" style={{ fontWeight: isActive ? 700 : 600 }}>
                        {preset.label}
                      </div>
                      <div className="mt-1.5 text-[11px] text-white/50">
                        {isActive
                          ? isMonthlyInvestmentMode
                            ? "매달 이 금액으로 출발"
                            : "기본 금액으로 출발"
                          : "선택하기"}
                      </div>
                    </button>
                  );
                })}
                <div
                  className={`${isMonthlyInvestmentMode ? "col-span-2" : ""} min-h-[78px] rounded-[20px] border px-3.5 py-3 text-left transition`}
                  role="group"
                  style={{
                    backgroundColor: isMonthlyInvestmentMode
                      ? isMonthlyContributionCustomActive
                        ? "var(--rz-surface-card-elevated)"
                        : "var(--rz-surface-card)"
                      : isCustomActive
                      ? "var(--rz-surface-card-elevated)"
                      : "var(--rz-surface-card)",
                    borderColor: isMonthlyInvestmentMode
                      ? isMonthlyContributionCustomActive
                        ? "var(--rz-border-strong)"
                        : "var(--rz-border)"
                      : isCustomActive
                      ? "var(--rz-border-strong)"
                      : "var(--rz-border)",
                    boxShadow: (
                      isMonthlyInvestmentMode
                        ? isMonthlyContributionCustomActive
                        : isCustomActive
                    )
                      ? "0 0 0 1px rgba(96,165,250,0.18)"
                      : "var(--rz-shadow-card)",
                  }}
                >
                  <button
                    aria-expanded={
                      isMonthlyInvestmentMode
                        ? isCustomMonthlyContributionOpen
                        : isCustomAmountOpen
                    }
                    aria-pressed={
                      isMonthlyInvestmentMode
                        ? isMonthlyContributionCustomActive
                        : isCustomActive
                    }
                    className="w-full text-left"
                    onClick={
                      isMonthlyInvestmentMode
                        ? handleCustomMonthlyContributionToggle
                        : handleCustomAmountToggle
                    }
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                        {isMonthlyInvestmentMode ? "월 납입" : "금액"}
                      </div>
                      <div
                        className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          backgroundColor: (
                            isMonthlyInvestmentMode
                              ? isMonthlyContributionCustomActive
                              : isCustomActive
                          )
                            ? "var(--rz-accent-soft)"
                            : "rgba(255,255,255,0.04)",
                          color: (
                            isMonthlyInvestmentMode
                              ? isMonthlyContributionCustomActive
                              : isCustomActive
                          )
                            ? "var(--rz-accent)"
                            : "rgba(148,163,184,0.82)",
                        }}
                      >
                        {(isMonthlyInvestmentMode
                          ? isMonthlyContributionCustomActive
                          : isCustomActive)
                          ? "선택됨"
                          : "직접"}
                      </div>
                    </div>
                    <div className="mt-2 text-[1.08rem] font-semibold tracking-[-0.04em] text-white">
                      직접 입력
                    </div>
                    {!(isMonthlyInvestmentMode
                      ? isCustomMonthlyContributionOpen
                      : isCustomAmountOpen) ? (
                      <div className="mt-1.5 text-xs text-white/56">
                        {isMonthlyInvestmentMode
                          ? "매달 넣을 금액을 직접 입력"
                          : "원하는 금액을 직접 입력"}
                      </div>
                    ) : null}
                  </button>

                  {(isMonthlyInvestmentMode
                    ? isCustomMonthlyContributionOpen
                    : isCustomAmountOpen) ? (
                    <label className="mt-4 block border-t border-white/8 pt-4">
                      <div className="flex items-end gap-2">
                        <input
                          ref={
                            isMonthlyInvestmentMode
                              ? customMonthlyContributionInputRef
                              : customAmountInputRef
                          }
                          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[1.7rem] font-semibold tracking-[-0.05em] text-white outline-none placeholder:text-white/18"
                          inputMode="numeric"
                          onChange={(event) =>
                            isMonthlyInvestmentMode
                              ? handleMonthlyContributionInputChange(event.target.value)
                              : handleAmountInputChange(event.target.value)
                          }
                          placeholder={isMonthlyInvestmentMode ? "예: 30" : "예: 5,000"}
                          type="text"
                          value={isMonthlyInvestmentMode ? monthlyContributionInput : amountInput}
                        />
                        <span className="pb-1 text-sm font-semibold text-white/42">만원</span>
                      </div>
                      <div className="mt-3 text-sm text-white/58">
                        {(isMonthlyInvestmentMode ? monthlyContributionInput : amountInput)
                          ? `현재 ${formattedActiveInvestmentAmountValue}`
                          : "만원 단위로 입력하면 바로 적용됩니다"}
                      </div>
                    </label>
                  ) : null}
                </div>
              </div>

              <details className="surface-card mt-4 rounded-[22px] px-4 py-3">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold tracking-[-0.03em] text-white">
                        투자 방식
                      </div>
                      <div className="mt-1 text-xs text-white/48">
                        현재 {isMonthlyInvestmentMode ? "매달 적립" : "한 번에 투자"} 기준입니다.
                      </div>
                    </div>
                    <div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-white/56">
                      변경
                    </div>
                  </div>
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/8 pt-3">
                  {([
                    {
                      description: "처음에 한 번 넣고 끝까지 봅니다.",
                      id: "lump-sum",
                      label: "한 번에 투자",
                    },
                    {
                      description: "매달 같은 금액을 꾸준히 넣습니다.",
                      id: "monthly",
                      label: "매달 적립",
                    },
                  ] as const).map((mode) => {
                    const isActive = investmentMode === mode.id;

                    return (
                      <button
                        key={mode.id}
                        aria-pressed={isActive}
                        className="rounded-[18px] border px-3 py-2.5 text-left transition"
                        onClick={() => handleInvestmentModeChange(mode.id)}
                        style={{
                          backgroundColor: isActive
                            ? "var(--rz-surface-card-elevated)"
                            : "rgba(255,255,255,0.02)",
                          borderColor: isActive
                            ? "var(--rz-border-strong)"
                            : "rgba(255,255,255,0.08)",
                          boxShadow: isActive ? "0 0 0 1px rgba(96,165,250,0.16)" : "none",
                        }}
                        type="button"
                      >
                        <div className="text-sm font-semibold tracking-[-0.03em] text-white">
                          {mode.label}
                        </div>
                        <div className="mt-1 text-[11px] leading-4 text-white/48">
                          {mode.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {monthlyContributionUnsupportedMessage ? (
                  <div className="mt-3 rounded-[18px] border border-[#ffbc96]/20 bg-[#ffbc96]/8 px-4 py-3 text-sm leading-6 text-[#ffbc96]">
                    {monthlyContributionUnsupportedMessage}
                  </div>
                ) : null}
              </details>

              {amountStepError ? (
                <div className="mt-4 rounded-[18px] border border-[#ffbc96]/20 bg-[#ffbc96]/8 px-4 py-3 text-sm leading-6 text-[#ffbc96]">
                  {amountStepError}
                </div>
              ) : null}

              <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-3 text-xs leading-5 text-white/48">
                {isMonthlyInvestmentMode
                  ? "매월 같은 금액을 넣었다고 가정합니다."
                  : "모든 자산은 같은 금액, 같은 시작점으로 계산합니다."}
              </div>
            </section>
          ) : null}

          {flowStep === "race" ? (
            <section className="flex flex-1 flex-col py-6 pb-8">
              <StepHeader
                description={raceStepDescription}
                onBack={goToAmount}
                step={3}
                title={raceStepTitle}
              />

              <div className="surface-card mt-4 rounded-[22px] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                      {raceStatusLabel}
                    </div>
                    <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">
                      {raceCurrentDateLabel}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-white/52">
                      {raceStatusGuide}
                    </div>
                  </div>
                  <div className="shrink-0 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[var(--rz-accent)]">
                    {raceProgressPercent}%
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--rz-accent),var(--rz-positive))] transition-[width] duration-300"
                    style={{ width: `${raceProgressPercent}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] leading-4 text-white/42">
                  {raceRangeLabel}
                </div>
              </div>

              {startDateAdjustmentNotice ? (
                <div className="mt-3">
                  <DataStartNotice notice={startDateAdjustmentNotice} />
                </div>
              ) : null}

              <div className="mt-3">
                <RaceChart
                  assets={selectedAssets}
                  basisLabel={isMonthlyInvestmentMode ? "기준 = 총 납입액" : undefined}
                  currentPoint={currentPoint}
                  data={visibleData}
                  fullData={raceBuild?.points ?? []}
                  headerSubtitle={
                    isMonthlyInvestmentMode
                      ? "매달 같은 금액을 넣었을 때 평가금액이 어떻게 달라졌는지 봅니다."
                      : undefined
                  }
                  headerTitle={
                    isMonthlyInvestmentMode
                      ? `월 ${formattedMonthlyContributionValue}씩 넣었다면`
                      : undefined
                  }
                  isLoading={isMarketLoading || !raceBuild || raceStatus === "loading"}
                  moments={raceMoments}
                  onSelectMoment={handleSelectRaceMoment}
                  principalKrw={isMonthlyInvestmentMode ? monthlyContributionValue : amountValue}
                  valueBasis={isMonthlyInvestmentMode ? "invested" : "initial"}
                />
              </div>

              {raceStatus === "complete" ? (
                <div className="surface-card mt-4 rounded-[24px] px-4 py-4 animate-[fade-in_220ms_ease-out]">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-white/34">
                    결과 준비 완료
                  </div>
                  <div className="mt-2 text-[1.2rem] font-semibold tracking-[-0.05em] text-white">
                    이제 숫자로 확인하세요
                  </div>
                  <div className="mt-1 text-sm leading-6 text-white/54">{raceCompleteSubtitle}</div>

                  <button
                    className="btn-accent mt-4 min-h-[54px] w-full rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
                    onClick={() => setFlowStep("result")}
                    type="button"
                  >
                    최종 결과 보기
                  </button>

                  {raceCompletionSummary ? (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-3">
                        <div className="text-[11px] text-white/38">1위</div>
                        <div className="mt-2 truncate text-sm font-semibold text-white">
                          {raceCompletionSummary.assetLabel}
                        </div>
                      </div>
                      <div className="rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-3">
                        <div className="text-[11px] text-white/38">성과</div>
                        <div className="mt-2 text-sm font-semibold text-white">
                          {raceCompletionSummary.multiplierLabel}
                        </div>
                      </div>
                      <div className="rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-3">
                        <div className="text-[11px] text-white/38">낙폭</div>
                        <div className="mt-2 text-sm font-semibold text-white">
                          {raceCompletionSummary.maxDrawdownLabel}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      className="btn-secondary min-h-11 rounded-full px-4 text-sm font-semibold tracking-[-0.02em] transition"
                      onClick={openStartPointPicker}
                      type="button"
                    >
                      시점 바꾸기
                    </button>
                    <button
                      className="btn-secondary min-h-11 rounded-full px-4 text-sm font-semibold tracking-[-0.02em] transition"
                      onClick={handleRestartRace}
                      type="button"
                    >
                      다시보기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold tracking-[-0.03em] text-white">
                        레이스를 보는 중입니다
                      </div>
                      <div className="mt-1 text-xs text-white/46">
                        중간에 멈추거나 처음부터 다시 볼 수 있습니다.
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {raceStatus === "racing" || raceStatus === "paused" ? (
                        <button
                          className="btn-secondary min-h-11 rounded-full px-4 text-sm font-semibold transition"
                          onClick={raceStatus === "racing" ? handlePauseRace : handlePlayRace}
                          type="button"
                        >
                          {raceStatus === "racing" ? "일시정지" : "재생"}
                        </button>
                      ) : (
                        <button
                          className="btn-secondary min-h-11 rounded-full px-4 text-sm font-semibold text-white/34"
                          disabled
                          type="button"
                        >
                          재생
                        </button>
                      )}
                      <button
                        className="btn-secondary min-h-11 rounded-full px-4 text-sm font-semibold transition"
                        onClick={handleRestartRace}
                        type="button"
                      >
                        다시보기
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/36">
                      배속
                    </div>
                    <div className="grid flex-1 grid-cols-4 gap-1.5">
                      {RACE_PLAYBACK_SPEED_OPTIONS.map((option) => {
                        const isActive = option.id === raceSpeed;

                        return (
                          <button
                            key={option.id}
                            aria-pressed={isActive}
                            className={`min-h-9 rounded-full border px-2 text-xs font-semibold transition ${
                              isActive
                                ? "border-white/24 bg-white text-slate-950"
                                : "border-white/8 bg-white/[0.03] text-white/58 hover:bg-white/[0.06] hover:text-white/76"
                            }`}
                            onClick={() => handleChangeRaceSpeed(option.id)}
                            type="button"
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </section>
          ) : null}

          {flowStep === "difficulty" ? (
            <section className="flex flex-1 flex-col py-6 pb-28">
              <StepHeader
                description="마지막 금액만으로는 보이지 않는 하락 구간을 봅니다."
                onBack={() => setFlowStep("intro")}
                step={3}
                title="버티기"
              />

              <div className="surface-card mt-6 rounded-[28px] px-4 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                      HOLDING DIFFICULTY
                    </div>
                    <div className="mt-2 text-[1.35rem] font-semibold tracking-[-0.05em] text-white">
                      10년 수익률보다 어려운 건 중간을 버티는 일입니다
                    </div>
                  </div>
                  <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/54">
                    {selectedAssetIds.length}개 자산
                  </div>
                </div>
                <div className="mt-3 text-sm leading-6 text-white/56">
                  끝까지 들고 갔을 때의 금액뿐 아니라, 중간에 얼마나 오래
                  계좌가 흔들렸는지 함께 봅니다.
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                    <div className="text-[11px] text-white/42">기간</div>
                    <div className="mt-2 font-semibold text-white">
                      {raceBuild
                        ? `${formatDateLabel(raceBuild.resolvedStartDate)}부터`
                        : "10년 기준"}
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                    <div className="text-[11px] text-white/42">방식</div>
                    <div className="mt-2 font-semibold text-white">
                      {isMonthlyInvestmentMode ? "매달 적립" : "한 번에 투자"}
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                    <div className="text-[11px] text-white/42">기준 금액</div>
                    <div className="mt-2 font-semibold text-white">
                      {isMonthlyInvestmentMode
                        ? `월 ${formatKrwCompact(monthlyContributionValue)}`
                        : formatKrwCompact(amountValue)}
                    </div>
                  </div>
                </div>
              </div>

              {!canStartComparison(selectedAssetIds) ? (
                <div className="surface-card mt-4 rounded-[26px] px-4 py-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                    SAMPLE
                  </div>
                  <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">
                    대표 비교로 먼저 체험해보세요
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/52">
                    낙폭과 회복은 실제 결과와 함께 볼 때 더 선명합니다. 익숙한 조합으로
                    먼저 체감해보세요.
                  </p>
                  <div className="mt-5 grid gap-3">
                    {[
                      {
                        assetIds: ["deposit", "005930"] as ComparisonAssetId[],
                        body: "안정적인 기준과 한국 대표 주식의 시간을 비교합니다.",
                        title: "예금 vs 삼성전자",
                      },
                      {
                        assetIds: ["deposit", "qqq"] as ComparisonAssetId[],
                        body: "은행에 둔 돈과 미국 기술주 ETF가 만든 격차를 봅니다.",
                        title: "예금 vs 미국 기술주 ETF",
                      },
                      {
                        assetIds: ["gold", "btc"] as ComparisonAssetId[],
                        body: "안전자산과 고변동 자산의 기다림을 비교합니다.",
                        title: "금 vs 비트코인",
                      },
                    ].map((sample) => (
                      <button
                        className="rounded-[20px] border border-white/8 bg-white/[0.025] px-4 py-4 text-left transition hover:bg-white/[0.05]"
                        key={sample.title}
                        onClick={() => applyDesktopRecommendedComparison(sample.assetIds)}
                        type="button"
                      >
                        <span className="block text-sm font-semibold tracking-[-0.02em] text-white">
                          {sample.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-white/48">
                          {sample.body}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <button
                      className="btn-accent min-h-12 rounded-full px-5 text-sm font-semibold"
                      onClick={() => applyDesktopRecommendedComparison(["deposit", "005930"])}
                      type="button"
                    >
                      대표 비교로 버티기 보기
                    </button>
                    <button
                      className="btn-secondary min-h-12 rounded-full px-5 text-sm font-semibold text-[var(--rz-accent)]"
                      onClick={goToAllAssets}
                      type="button"
                    >
                      자산 직접 고르기
                    </button>
                  </div>
                </div>
              ) : isMarketLoading ? (
                <div className="surface-card mt-4 rounded-[24px] px-4 py-8 text-center text-sm leading-6 text-white/52">
                  10년 동안의 흔들림을 계산하고 있습니다.
                </div>
              ) : amountStepError ? (
                <div className="surface-card mt-4 rounded-[24px] border border-amber-300/20 bg-amber-300/10 px-4 py-4 text-sm leading-6 text-amber-100/80">
                  {amountStepError}
                </div>
              ) : raceBuild && hardestHoldingAsset?.report && hardestHoldingAsset.metrics ? (
                (() => {
                  const focus = hardestHoldingAsset;
                  const report = focus.report!;
                  const metrics = focus.metrics!;
                  const assetLabel =
                    metrics.displayLabel ?? focus.asset.shortLabel ?? focus.asset.label;
                  const recoveryLabel = report.recovery.recovered
                    ? `${report.recovery.recoveryMonths ?? 0}개월`
                    : "아직 미회복";
                  const longestNoNewHighLabel = difficultyNoProfitTimetable
                    ? formatNoProfitDuration(difficultyNoProfitTimetable.longestNoNewHighMonths)
                    : "계산 중";
                  const focusRankLabel = focus.result ? `${focus.result.rank}위` : "분석";
                  const otherAssets = holdingDifficultySummaries.filter(
                    (item) => item.asset.id !== focus.asset.id,
                  );

                  return (
                    <div className="mt-4 space-y-4">
                      <div className="surface-card rounded-[28px] px-4 py-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div
                              className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                              style={{ color: focus.assetColor }}
                            >
                              가장 버티기 어려웠던 자산
                            </div>
                            <div className="mt-2 text-xl font-semibold tracking-[-0.055em] text-white">
                              {assetLabel}는 최종 금액보다 중간 구간이 더 거칠었습니다
                            </div>
                          </div>
                          <div
                            className="rounded-full border px-3 py-1.5 text-[11px] font-semibold"
                            style={{
                              backgroundColor: `${focus.assetColor}14`,
                              borderColor: `${focus.assetColor}40`,
                              color: focus.assetColor,
                            }}
                          >
                            {focusRankLabel}
                          </div>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-white/56">
                          {report.difficulty.explanation}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/42">버티기 난이도</div>
                            <div className="mt-2 font-semibold text-white">
                              {report.difficulty.label}
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/42">최대 낙폭</div>
                            <div className="mt-2 font-semibold text-white">
                              {formatMetricPercent(report.maxDrawdown.maxDrawdownPct)}
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/42">회복까지</div>
                            <div className="mt-2 font-semibold text-white">{recoveryLabel}</div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/42">최장 무신고가</div>
                            <div className="mt-2 font-semibold text-white">
                              {longestNoNewHighLabel}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.025] px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-white/34">
                            ANALYST NOTE
                          </div>
                          <div className="mt-2 text-sm leading-6 text-white/58">
                            최종 평가금액은 {formatKrwExact(metrics.finalValue)}입니다. 다만
                            그 숫자 앞에는 {formatMetricPercent(report.maxDrawdown.maxDrawdownPct)} 하락과
                            {recoveryLabel}의 회복 구간이 있었습니다.
                          </div>
                        </div>
                      </div>

                      {difficultyNoProfitTimetable ? (
                        <NoProfitTimetableCard
                          formatKrw={formatKrwCompact}
                          onShare={(activeTimetable) =>
                            void handleShareDifficultyNoProfitTimetable(activeTimetable)
                          }
                          timetable={difficultyNoProfitTimetable}
                        />
                      ) : null}

                      <div className="surface-card rounded-[26px] px-4 py-5">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                          HARD MOMENTS
                        </div>
                        <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">
                          가장 힘든 3구간
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/52">
                          얼마나 떨어졌고, 얼마나 기다렸고, 무엇이 힘들었는지만 짧게 봅니다.
                        </p>

                        {hardestCrisisEntries.length > 0 ? (
                          <div className="mt-4 grid gap-3">
                            {hardestCrisisEntries.map((crisis, crisisIndex) => {
                              const canOpenDetailChart = supportsDetailChartMode(focus.asset);

                              return (
                                <article
                                  className="rounded-[20px] border border-white/8 bg-white/[0.025] px-4 py-4"
                                  key={`${focus.asset.id}-${crisis.startDate}-${crisis.troughDate}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="text-[11px] text-white/38">
                                        고비 {crisisIndex + 1}
                                      </div>
                                      <div className="mt-1 text-sm font-semibold text-white">
                                        {formatCrisisPeriodLabel(crisis)}
                                      </div>
                                    </div>
                                    <div className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-xs font-semibold text-rose-100">
                                      {formatMetricPercent(crisis.maxDrawdownPct)}
                                    </div>
                                  </div>
                                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                                    <div className="rounded-[14px] border border-white/8 bg-white/[0.02] px-3 py-3">
                                      <div className="text-[11px] text-white/38">얼마나 떨어졌나</div>
                                      <div className="mt-1 font-semibold text-white">
                                        {formatMetricPercent(crisis.maxDrawdownPct)}
                                      </div>
                                    </div>
                                    <div className="rounded-[14px] border border-white/8 bg-white/[0.02] px-3 py-3">
                                      <div className="text-[11px] text-white/38">얼마나 기다렸나</div>
                                      <div className="mt-1 font-semibold text-white">
                                        {crisis.endDate
                                          ? formatApproxPeriodLabel(
                                              getApproxMonthDiff(crisis.startDate, crisis.endDate),
                                            )
                                          : "아직 회복 전"}
                                      </div>
                                    </div>
                                    <div className="rounded-[14px] border border-white/8 bg-white/[0.02] px-3 py-3">
                                      <div className="text-[11px] text-white/38">무엇이 힘든가</div>
                                      <div className="mt-1 font-semibold text-white">
                                        {crisis.recoveredToNearHigh ? "기다림" : "미회복"}
                                      </div>
                                    </div>
                                  </div>
                                  {canOpenDetailChart ? (
                                    <button
                                      className="btn-secondary mt-3 min-h-10 rounded-full px-4 text-sm font-semibold tracking-[-0.02em] transition"
                                      onClick={() =>
                                        openDetailChartForCrisis(
                                          focus.asset,
                                          formatCrisisPeriodLabel(crisis),
                                          crisis,
                                        )
                                      }
                                      type="button"
                                    >
                                      차트로 고비 보기
                                    </button>
                                  ) : null}
                                </article>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-4 text-sm leading-6 text-white/50">
                            30% 이상 크게 밀린 독립 구간은 잡히지 않았습니다. 이 경우에는
                            깊은 하락보다 지루한 기다림을 중심으로 보면 됩니다.
                          </div>
                        )}
                      </div>

                      {otherAssets.length > 0 ? (
                        <details className="surface-card rounded-[24px] px-4 py-4">
                          <summary className="cursor-pointer text-sm font-semibold tracking-[-0.02em] text-white">
                            다른 자산의 버티기
                          </summary>
                          <div className="mt-4 grid gap-2">
                            {otherAssets.map((item) => (
                              <div
                                className="rounded-[16px] border border-white/8 bg-white/[0.025] px-3 py-3 text-sm"
                                key={item.asset.id}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="font-semibold text-white">
                                      {item.metrics?.displayLabel ??
                                        item.asset.shortLabel ??
                                        item.asset.label}
                                    </div>
                                    <div className="mt-1 text-xs text-white/46">
                                      최대 낙폭{" "}
                                      {formatMetricPercent(
                                        item.report?.maxDrawdown.maxDrawdownPct ?? 0,
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-sm font-semibold text-white/70">
                                    {item.report?.difficulty.label}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      ) : null}

                      <div className="grid gap-2">
                        <button
                          className="btn-accent min-h-12 rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition"
                          onClick={goToRace}
                          type="button"
                        >
                          레이스로 다시 보기
                        </button>
                        <button
                          className="btn-secondary min-h-12 rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition"
                          onClick={goToAssets}
                          type="button"
                        >
                          다른 자산과 비교
                        </button>
                        <button
                          className="btn-secondary min-h-12 rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition"
                          onClick={() => void handleShareResult()}
                          type="button"
                        >
                          결과 공유
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : null}
            </section>
          ) : null}

          {flowStep === "saved" ? (
            <section className="flex flex-1 flex-col py-6 pb-28">
              <StepHeader
                description="저장해둔 조합과 시나리오를 다시 불러와요."
                onBack={() => setFlowStep("intro")}
                step={1}
                title="저장한 기록"
              />

              <div className="surface-card mt-6 rounded-[24px] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                      SAVED
                    </div>
                    <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">
                      다시 볼 만한 비교
                    </div>
                  </div>
                  <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/54">
                    {savedScenarios.length +
                      savedAssetCombos.length +
                      savedFutureScenarios.length +
                      savedTimelineRecords.length}
                    개
                  </div>
                </div>
                <div className="mt-3 text-sm leading-6 text-white/52">
                  저장은 이 브라우저에만 남아요. 다른 기기에서도 이어가려면 결과 공유 링크를 함께 남겨두세요.
                </div>
              </div>

              {savedTimelineRecords.length > 0 ? (
                <section className="mt-5">
                  <div className="px-1 text-[11px] uppercase tracking-[0.22em] text-[var(--rz-accent)]">
                    🪐 내 타임머신 기록
                  </div>
                  <div className="mt-3 grid gap-3">
                    {savedTimelineRecords.map((record) => (
                      <article
                        className="rounded-[24px] border border-amber-300/24 bg-amber-200/10 px-4 py-4 text-left shadow-[0_16px_46px_rgba(245,158,11,0.08)]"
                        key={record.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-base font-semibold tracking-[-0.04em] text-white">
                              {record.label}
                            </div>
                            <div className="mt-2 text-sm leading-6 text-white/58">
                              {record.amountLabel} · 결과 {record.resultLabel}
                            </div>
                            <div className="mt-1 text-xs leading-5 text-white/42">
                              {record.summary}
                            </div>
                            <div className="mt-2 text-[11px] text-white/36">
                              기록일 {formatSavedDateLabel(record.createdAt)}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full border border-amber-300/26 bg-amber-300/12 px-3 py-1.5 text-[11px] font-semibold text-amber-100">
                            {record.type === "solo" ? "한 종목" : "비교"}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="mt-5">
                <DynamicLiveTimeline
                  matchups={syncedMatchups}
                  onReplayScenario={startTimelineScenario}
                />
              </div>

              {savedScenarios.length === 0 &&
              savedAssetCombos.length === 0 &&
              savedFutureScenarios.length === 0 &&
              savedTimelineRecords.length === 0 ? (
                <div className="surface-card mt-4 rounded-[24px] px-4 py-8 text-center">
                  <div className="text-base font-semibold tracking-[-0.04em] text-white">
                    아직 저장한 기록이 없습니다
                  </div>
                  <div className="mt-2 text-sm leading-6 text-white/50">
                    결과 화면에서 자산 조합이나 시나리오를 저장하면 여기에 모여요.
                  </div>
                  <button
                    className="btn-accent mt-5 min-h-12 rounded-full px-5 text-sm font-semibold"
                    onClick={goToAssets}
                    type="button"
                  >
                    비교하러 가기
                  </button>
                </div>
              ) : null}

              {savedFutureScenarios.length > 0 ? (
                <section className="mt-5">
                  <div className="px-1 text-[11px] uppercase tracking-[0.22em] text-white/34">
                    저장한 미래 시나리오
                  </div>
                  <div className="mt-3 grid gap-3">
                    {savedFutureScenarios.map((scenario) => {
                      const assetLabel = scenario.assetIds
                        .map((assetId) => assetCatalog[assetId]?.shortLabel ?? assetCatalog[assetId]?.label)
                        .filter(Boolean)
                        .join(" · ");

                      return (
                        <article
                          className="surface-card rounded-[22px] px-4 py-4 text-left"
                          key={scenario.id}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-base font-semibold tracking-[-0.04em] text-white">
                                {formatKrwCompact(scenario.initialKrw)} + 월 {formatKrwCompact(scenario.monthlyKrw)}
                              </div>
                              <div className="mt-2 text-sm leading-6 text-white/52">
                                {assetLabel || "저장한 시나리오"} · {scenario.years}년 가정
                              </div>
                              <div className="mt-2 grid gap-1 text-xs leading-5 text-white/42">
                                {scenario.resultsSummary.map((summary) => (
                                  <div key={`${scenario.id}-${summary}`}>{summary}</div>
                                ))}
                              </div>
                              <div className="mt-1 text-xs text-white/38">
                                저장일 {formatSavedDateLabel(scenario.createdAt)}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-white/58">
                              미래
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {savedScenarios.length > 0 ? (
                <section className="mt-5">
                  <div className="px-1 text-[11px] uppercase tracking-[0.22em] text-white/34">
                    저장한 시나리오
                  </div>
                  <div className="mt-3 grid gap-3">
                    {savedScenarios.map((scenario) => {
                      const assetLabel = scenario.assetIds
                        .map((assetId) => assetCatalog[assetId]?.shortLabel ?? assetCatalog[assetId]?.label)
                        .filter(Boolean)
                        .join(" · ");

                      return (
                        <button
                          className="surface-card rounded-[22px] px-4 py-4 text-left transition hover:bg-white/[0.06]"
                          key={scenario.id}
                          onClick={() => applySavedScenario(scenario)}
                          type="button"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-base font-semibold tracking-[-0.04em] text-white">
                                {scenario.label}
                              </div>
                              <div className="mt-2 text-sm leading-6 text-white/52">
                                {assetLabel} · {formatKrwCompact(scenario.amount)} · {formatDateLabel(scenario.startDate)} 시작
                              </div>
                              <div className="mt-1 text-xs text-white/38">
                                저장일 {formatSavedDateLabel(scenario.createdAt)}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-white/58">
                              불러오기
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {savedAssetCombos.length > 0 ? (
                <section className="mt-5">
                  <div className="px-1 text-[11px] uppercase tracking-[0.22em] text-white/34">
                    저장한 자산 조합
                  </div>
                  <div className="mt-3 grid gap-3">
                    {savedAssetCombos.map((combo) => {
                      const assetLabel = combo.assetIds
                        .map((assetId) => assetCatalog[assetId]?.shortLabel ?? assetCatalog[assetId]?.label)
                        .filter(Boolean)
                        .join(" · ");

                      return (
                        <button
                          className="surface-card rounded-[22px] px-4 py-4 text-left transition hover:bg-white/[0.06]"
                          key={combo.id}
                          onClick={() => applySavedAssetCombo(combo)}
                          type="button"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-base font-semibold tracking-[-0.04em] text-white">
                                {combo.label}
                              </div>
                              <div className="mt-2 text-sm leading-6 text-white/52">
                                {assetLabel || "저장한 자산 조합"}
                              </div>
                              <div className="mt-1 text-xs text-white/38">
                                저장일 {formatSavedDateLabel(combo.createdAt)}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-white/58">
                              불러오기
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {timeMachineFeedback ? (
                <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
                  {timeMachineFeedback}
                </div>
              ) : null}
            </section>
          ) : null}

          {flowStep === "start-point" ? (
            <section className="flex flex-1 flex-col py-6 pb-28">
              <StepHeader
                description="원하는 시작 날짜를 고르면 그날부터 다시 레이스합니다."
                onBack={() =>
                  setFlowStep(resultRows.length > 0 && raceStatus === "complete" ? "result" : "amount")
                }
                step={4}
                title="어느 날부터 다시 볼까요?"
              />

              <div className="surface-card mt-6 rounded-[24px] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] tracking-[0.12em] text-white/34">날짜 선택</div>
                    <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">
                      다시 볼 시작 날짜를 고르세요
                    </div>
                  </div>
                  <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/54">
                    {selectedAssets.map((asset) => asset.shortLabel ?? asset.label).join(" · ")}
                  </div>
                </div>
                <div className="relative mt-4 flex items-center gap-2">
                  <label className="block min-w-0 flex-1">
                    <input
                      aria-invalid={!isCustomStartInputValid && hasCustomStartInputDraft}
                      className="w-full rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-base font-medium text-white outline-none placeholder:text-white/26"
                      inputMode="numeric"
                      onBlur={handleCustomDateInputBlur}
                      onChange={(event) => handleCustomDateTextInput(event.target.value)}
                      placeholder="YYYY-MM-DD"
                      style={{
                        borderColor:
                          !isCustomStartInputValid && hasCustomStartInputDraft
                            ? "rgba(245, 158, 11, 0.38)"
                            : undefined,
                      }}
                      type="text"
                      value={customStartDateInput}
                    />
                  </label>
                  <button
                    className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/72 transition hover:bg-white/[0.06]"
                    onClick={openCustomDatePicker}
                    type="button"
                  >
                    달력 선택
                  </button>
                  <input
                    className="pointer-events-none absolute h-0 w-0 opacity-0"
                    max={raceDateRange.end}
                    min={extendedDateRange.start}
                    onChange={(event) => handleCustomDateInput(event.target.value)}
                    ref={customStartPickerRef}
                    tabIndex={-1}
                    type="date"
                    value={customStartDate}
                  />
                </div>
                <div className="mt-3 text-sm leading-6 text-white/44">
                  휴장일이면 다음 거래일로 자동 맞춰집니다
                </div>
                {!isCustomStartInputValid && hasCustomStartInputDraft ? (
                  <div className="mt-2 text-xs leading-5 text-white/40">
                    날짜를 모두 입력하면 실제 적용 시작일을 바로 보여줍니다.
                  </div>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                    <div className="text-[11px] text-white/42">선택 날짜</div>
                    <div className="mt-2 font-semibold text-white">
                      {customStartSummarySelectedDate}
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                    <div className="text-[11px] text-white/42">실제 적용 시작일</div>
                    <div className="mt-2 font-semibold text-white">
                      {customStartSummaryAppliedDate}
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                    <div className="text-[11px] text-white/42">비교 종료일</div>
                    <div className="mt-2 font-semibold text-white">
                      {customStartSummaryEndDate}
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                    <div className="text-[11px] text-white/42">비교 자산</div>
                    <div className="mt-2 font-semibold text-white">
                      {selectedAssets.map((asset) => asset.shortLabel ?? asset.label).join(", ")}
                    </div>
                  </div>
                </div>
                {customStartDateAdjustmentMessage ? (
                  <div className="mt-3 rounded-[16px] border border-[var(--rz-border-strong)] bg-[var(--rz-accent-soft)] px-3 py-3 text-sm leading-6 text-[var(--rz-accent)]">
                    {customStartDateAdjustmentMessage}
                  </div>
                ) : null}
              </div>

              <div className="surface-card mt-4 rounded-[24px] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] tracking-[0.12em] text-white/34">차트로 날짜 맞추기</div>
                    <div className="mt-2 text-sm leading-6 text-white/56">
                      차트에서 시작점을 더 정밀하게 맞출 수 있습니다.
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {RACE_RESOLUTION_OPTIONS.map((option) => {
                      const isActive = option.id === startPointChartResolution;

                      return (
                        <button
                        key={option.id}
                        className="rounded-full border px-3 py-1.5 text-[11px] transition"
                        onClick={() => handleChangeRaceResolution(option.id)}
                        aria-label={`${option.label} 확대`}
                        style={{
                          backgroundColor: isActive ? "var(--rz-accent-soft)" : "rgba(255,255,255,0.72)",
                          borderColor: isActive ? "var(--rz-border-strong)" : "rgba(148,163,184,0.22)",
                          color: isActive ? "var(--rz-accent)" : "rgba(51,65,85,0.72)",
                        }}
                          type="button"
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4">
                  <ProStartExplorerChart
                    accent={
                      selectedAssetSlotMetaById[proExplorerAsset?.id ?? selectedAssetIds[0] ?? "deposit"]?.color ??
                      "#6AB8FF"
                    }
                    assetLabel={proExplorerAsset ? getHomeIntroAssetLabel(proExplorerAsset) : "선택 자산"}
                    onSelectDate={handleSelectChartDate}
                    resolution={startPointChartResolution}
                    selectedDate={selectedExplorerPoint?.date ?? customStartDate}
                    series={proExplorerSeries}
                  />
                </div>
                <div className="mt-3 text-sm leading-6 text-white/48">차트를 누르면 선택 날짜가 바로 바뀝니다.</div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 px-1">
                <div>
                  <div className="text-[11px] tracking-[0.12em] text-white/34">재생 방식</div>
                  <div className="mt-1 text-xs leading-5 text-white/48">
                    1x로 따라가거나, 바로 결과만 볼 수 있습니다.
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {START_POINT_SPEED_OPTIONS.map((option) => {
                    const isActive = option.id === raceSpeed;

                    return (
                      <button
                        key={option.id}
                        className="rounded-full border px-3 py-2 text-[12px] font-medium transition"
                        onClick={() => handleChangeRaceSpeed(option.id)}
                        style={{
                          backgroundColor: isActive ? "var(--rz-accent-soft)" : "rgba(255,255,255,0.78)",
                          borderColor: isActive ? "var(--rz-border-strong)" : "rgba(148,163,184,0.22)",
                          color: isActive ? "var(--rz-accent)" : "rgba(30,41,59,0.78)",
                        }}
                        type="button"
                        >
                          {option.label}
                        </button>
                    );
                  })}
                </div>
              </div>

              {isCustomStartInputValid && customStartError ? (
                <div className="mt-4 rounded-[18px] border border-[#ffbc96]/20 bg-[#ffbc96]/8 px-4 py-3 text-sm leading-6 text-[#ffbc96]">
                  {customStartError}
                </div>
              ) : null}

              <div className="mt-6 grid gap-2">
                <button
                  className="btn-accent min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/34"
                  disabled={!customStartPreview || !isCustomStartInputValid}
                  onClick={applyCustomStartComparison}
                  type="button"
                >
                  이 시점으로 다시 레이스
                </button>
              </div>

              {timeMachineFeedback ? (
                <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
                  {timeMachineFeedback}
                </div>
              ) : null}

              <details className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.02] px-4 py-3">
                <summary className="cursor-pointer list-none text-sm text-white/50">
                  저장하기
                </summary>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    className="min-h-11 rounded-full border border-white/8 bg-transparent px-4 text-sm text-white/62 transition hover:bg-white/[0.04]"
                    onClick={handleSaveAssetCombo}
                    type="button"
                  >
                    현재 자산 조합 저장
                  </button>
                  <button
                    className="min-h-11 rounded-full border border-white/8 bg-transparent px-4 text-sm text-white/62 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:text-white/28"
                    disabled={!isCustomStartInputValid || !customStartPreview}
                    onClick={handleSaveScenario}
                    type="button"
                  >
                    현재 시나리오 저장
                  </button>
                </div>
              </details>
            </section>
          ) : null}

          {flowStep === "detail-chart" && detailChartContext && detailChartAsset ? (
            <DetailChartScreen
              asset={detailChartAsset}
              context={detailChartContext}
              onBack={closeDetailChart}
            />
          ) : null}

          {flowStep === "result" ? (
            <section className="flex flex-1 flex-col py-6">
              <div className="flex items-center justify-between gap-3">
                <button
                  className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-sm text-white/72 transition hover:bg-white/[0.06]"
                  onClick={goToAmount}
                  type="button"
                >
                  이전
                </button>

                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((dot) => (
                    <span
                      key={dot}
                      className={`h-1.5 rounded-full transition ${dot <= 4 ? "w-5 bg-white" : "w-1.5 bg-white/20"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">RESULT</div>
                <div className="mt-3 text-[1.55rem] font-semibold tracking-[-0.05em] text-white">
                  {resultHeroTitle}
                </div>
                <div className="mt-2 text-sm leading-6 text-white/56">
                  {resultHeroRangeLabel}
                </div>
              </div>

              <ComplianceNotice className="mt-4" />

              {startDateAdjustmentNotice ? (
                <div className="mt-4">
                  <DataStartNotice notice={startDateAdjustmentNotice} />
                </div>
              ) : null}

              {raceCompletionSummary ? (
                <div className="surface-card mt-5 rounded-[26px] px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/34">
                    한 줄 결론
                  </div>
                  <div className="mt-2 text-[1.15rem] font-semibold leading-7 tracking-[-0.04em] text-white">
                    {resultOneLineCopy}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                      <div className="text-[11px] text-white/38">최종 승자</div>
                      <div className="mt-2 font-semibold text-white">{raceCompletionSummary.assetLabel}</div>
                    </div>
                    <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                      <div className="text-[11px] text-white/38">최종 금액</div>
                      <div className="mt-2 font-semibold text-white">{raceCompletionSummary.finalValueLabel}</div>
                    </div>
                    <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                      <MetricLabel help="고점에서 저점까지 가장 크게 밀린 비율입니다. 끝까지 갔을 때의 결과만 보면 놓치기 쉬운 구간이에요.">
                        최대 낙폭
                      </MetricLabel>
                      <div className="mt-2 font-semibold text-white">{raceCompletionSummary.maxDrawdownLabel}</div>
                    </div>
                    <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                      <MetricLabel help="크게 떨어진 뒤 이전 고점을 다시 넘기까지 걸린 시간입니다.">
                        회복 기간
                      </MetricLabel>
                      <div className="mt-2 font-semibold text-white">{raceCompletionSummary.recoveryLabel}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <button
                      className="btn-accent min-h-12 rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition"
                      onClick={openResultAssetSearch}
                      type="button"
                    >
                      전체 종목 검색으로 다시 보기
                    </button>
                    <button
                      className="btn-secondary min-h-11 rounded-full px-4 text-sm font-semibold tracking-[-0.02em] transition"
                      onClick={() => void handleShareResult()}
                      type="button"
                    >
                      결과 공유
                    </button>
                  </div>
                </div>
              ) : null}

              {raceCompletionSummary ? (
                <ReferralCtaCard
                  copy={resultReferral}
                  onMissingUrl={() => setShareFeedback("레퍼럴 링크가 아직 설정되지 않았습니다.")}
                  placement="receipt"
                />
              ) : null}

              <details className="surface-card mt-6 rounded-[24px] px-4 py-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold tracking-[-0.03em] text-white">
                        상세 데이터 보기
                      </div>
                      <div className="mt-1 text-xs leading-5 text-white/48">
                        수익률, 시작 가격, 고비 구간은 여기에서 확인합니다.
                      </div>
                    </div>
                    <div className="shrink-0 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-white/56">
                      펼치기
                    </div>
                  </div>
                </summary>

                <div className="mt-4 space-y-4">
                  {resultRows.map((result) => {
                  const resultSlotMeta = selectedAssetSlotMetaById[result.assetId];
                  const resultSlotIndex = resultSlotMeta ? resultSlotMeta.slot - 1 : -1;
                  const assetColor = resultSlotMeta?.color ?? "#6AB8FF";
                  const resultAsset = assetCatalog[result.assetId];
                  const holdingPainReport = holdingPainReports[result.assetId];
                  const resultMetrics = resultAssetMetrics[result.assetId];
                  const isResultInfoOpen = expandedResultAssetIds.includes(result.assetId);
                  const recoveryLabel = holdingPainReport
                    ? holdingPainReport.recovery.recovered
                      ? `${holdingPainReport.recovery.recoveryMonths ?? 0}개월`
                      : "아직 미회복"
                    : "데이터 없음";
                  const hardestMomentLabel = holdingPainReport
                    ? `${formatDateLabel(holdingPainReport.worstMoment.date)} · 전고점 대비 ${formatMetricPercent(holdingPainReport.worstMoment.drawdownPct)}`
                    : "";
                  const canOpenDetailChart =
                    supportsDetailChartMode(resultAsset) && Boolean(resultAsset.marketTicker);
                  const crisisEntries =
                    holdingPainReport?.crises.crises.map((crisis, index) => ({
                      crisis,
                      index,
                      label: formatCrisisPeriodLabel(crisis),
                    })) ?? [];
                  const isAdjustedStartDate = resultMetrics
                    ? resultMetrics.requestedStartDate !== resultMetrics.appliedStartDate
                    : false;
                  const annualizedReturnMethod =
                    resultMetrics?.annualizedReturnMethod ??
                    (result.cagrPct != null ? "cagr" : "none");
                  const annualizedReturnValue =
                    resultMetrics?.annualizedReturnPct ??
                    result.moneyWeightedReturnPct ??
                    result.cagrPct ??
                    null;
                  const annualizedReturnLabel = isMonthlyInvestmentMode
                    ? annualizedReturnMethod === "xirr"
                      ? "XIRR"
                      : "누적 수익률"
                    : "CAGR";
                  const annualizedReturnDescription = isMonthlyInvestmentMode
                    ? annualizedReturnMethod === "xirr"
                      ? "납입 시점을 반영한 연환산 수익률입니다."
                      : "XIRR 계산이 어려워 누적 수익률만 표시합니다."
                    : "연복리 기준 연평균 성장률입니다.";
                  const annualizedReturnDisplay =
                    annualizedReturnValue === null
                      ? formatMetricPercent(resultMetrics?.totalReturnPct ?? result.totalReturnPct)
                      : formatMetricPercent(annualizedReturnValue);

                  return (
                    <div key={result.assetId} className="surface-card rounded-[26px] px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            {resultSlotIndex >= 0 ? (
                              <div
                                className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium"
                                style={{
                                  borderColor: `${assetColor}40`,
                                  backgroundColor: `${assetColor}14`,
                                  color: assetColor,
                                }}
                              >
                                <span
                                  className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold"
                                  style={{
                                    backgroundColor: `${assetColor}24`,
                                    color: assetColor,
                                  }}
                                >
                                  {resultSlotIndex + 1}
                                </span>
                                선택 자산
                              </div>
                            ) : null}
                            <div
                              className="text-xs uppercase tracking-[0.22em]"
                              style={{ color: assetColor }}
                            >
                              {result.rank}위
                            </div>
                          </div>
                          <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">
                            {resultMetrics?.displayLabel ?? result.label}
                          </div>
                        </div>
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: assetColor }}
                        />
                      </div>

                      <div className="mt-5 text-[1.45rem] font-semibold tracking-[-0.05em] text-white">
                        {formatKrwExact(resultMetrics?.finalValue ?? result.finalValue)}
                      </div>

                      {isAdjustedStartDate && resultMetrics ? (
                        <div className="mt-3 rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3 text-sm leading-6 text-white/50">
                          선택한 시작일 {formatDateLabel(resultMetrics.requestedStartDate)}은 거래일이 아니거나 공통 데이터가 없어,
                          {formatDateLabel(resultMetrics.appliedStartDate)}부터 계산했습니다.
                        </div>
                      ) : null}

                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                          <div className="text-[11px] text-white/42">
                            {isMonthlyInvestmentMode ? "수익률" : "총 수익률"}
                          </div>
                          <div className="mt-2 font-semibold text-white">
                            {formatMetricPercent(resultMetrics?.totalReturnPct ?? result.totalReturnPct)}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                          <div className="text-[11px] text-white/42">
                            {isMonthlyInvestmentMode ? "평가/납입" : "최종 배수"}
                          </div>
                          <div className="mt-2 font-semibold text-white">
                            {formatMetricMultiple(
                              resultMetrics?.multiple ??
                                ((result.finalValue / (result.totalInvestedKrw ?? amountValue)) || 0),
                            )}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                          <MetricLabel
                            help={
                              isMonthlyInvestmentMode
                                ? "매달 돈을 넣은 시점까지 고려해 수익률을 봅니다. XIRR이 없을 때는 총 납입액 대비 누적 수익률로 표시합니다."
                                : "처음 넣은 돈이 매년 같은 속도로 자랐다고 가정했을 때의 연평균 성장률입니다."
                            }
                          >
                            {annualizedReturnLabel}
                          </MetricLabel>
                          <div className="mt-2 font-semibold text-white">
                            {annualizedReturnDisplay}
                          </div>
                          <div className="mt-1 text-[11px] leading-4 text-white/36">
                            {annualizedReturnDescription}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                          <div className="text-[11px] text-white/42">실제 적용 시작일</div>
                          <div className="mt-2 font-semibold text-white">
                            {resultMetrics ? formatDateLabel(resultMetrics.appliedStartDate) : "-"}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                          <div className="text-[11px] text-white/42">종료 날짜</div>
                          <div className="mt-2 font-semibold text-white">
                            {resultMetrics ? formatDateLabel(resultMetrics.appliedEndDate) : "-"}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                          <div className="text-[11px] text-white/42">{resultMetrics?.startPriceLabel ?? "시작 가격"}</div>
                          <div className="mt-2 font-semibold text-white">
                            {resultMetrics?.startPriceValue ?? "-"}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                          <div className="text-[11px] text-white/42">{resultMetrics?.endPriceLabel ?? "종료 가격"}</div>
                          <div className="mt-2 font-semibold text-white">
                            {resultMetrics?.endPriceValue ?? "-"}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                          <div className="text-[11px] text-white/42">
                            {isMonthlyInvestmentMode ? "총 납입액" : "투입 금액"}
                          </div>
                          <div className="mt-2 font-semibold text-white">
                            {formatKrwExact(resultMetrics?.investmentAmount ?? amountValue)}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                          <div className="text-[11px] text-white/42">최종 평가액</div>
                          <div className="mt-2 font-semibold text-white">
                            {formatKrwExact(resultMetrics?.finalValue ?? result.finalValue)}
                          </div>
                        </div>
                        {isMonthlyInvestmentMode ? (
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/42">수익</div>
                            <div className="mt-2 font-semibold text-white">
                              {formatKrwExact(
                                resultMetrics?.profitKrw ??
                                  (result.finalValue - (result.totalInvestedKrw ?? amountValue)),
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <button
                          className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-white/72 transition hover:bg-white/[0.06]"
                          onClick={() => toggleResultAssetInfo(result.assetId)}
                          type="button"
                        >
                          {isResultInfoOpen ? "자산 설명 닫기" : "자산 설명 보기"}
                        </button>
                      </div>
                      {isResultInfoOpen ? (
                        <div className="mt-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
                          <div className="grid gap-1.5 text-sm leading-6 text-white/56">
                            {getResultInfoLines(resultAsset).slice(0, 3).map((line) => (
                              <div key={`${result.assetId}-${line}`}>{line}</div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {holdingPainReport ? (
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <MetricLabel help="고점에서 저점까지 가장 크게 밀린 비율입니다. 끝까지 보유하기가 얼마나 어려웠는지 보여주는 값이에요.">
                              최대 낙폭
                            </MetricLabel>
                            <div className="mt-2 font-semibold text-white">
                              {formatMetricPercent(resultMetrics?.maxDrawdownPct ?? holdingPainReport.maxDrawdown.maxDrawdownPct)}
                            </div>
                            <div className="mt-1 text-[11px] leading-4 text-white/36">
                              시작 후 최고점에서 가장 크게 밀린 폭입니다.
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <MetricLabel help="직전 고점 대비 30% 이상 하락한 독립 구간 수입니다.">
                              고비 횟수
                            </MetricLabel>
                            <div className="mt-2 font-semibold text-white">
                              {Math.round(resultMetrics?.hardshipCount ?? 0)}회
                            </div>
                            <div className="mt-1 text-[11px] leading-4 text-white/36">
                              직전 고점 대비 30% 이상 하락한 독립 구간 수입니다.
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <MetricLabel help="하락 후 이전 고점을 다시 넘어서기까지 기다린 시간입니다.">
                              회복 기간
                            </MetricLabel>
                            <div className="mt-2 font-semibold text-white">{recoveryLabel}</div>
                          </div>
                          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
                            <div className="text-[11px] text-white/42">버티기 난이도</div>
                            <div className="mt-2 font-semibold text-white">
                              {holdingPainReport.difficulty.label}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {holdingPainReport ? (
                        <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-white/34">
                            가장 힘들었던 구간
                          </div>
                          <div className="mt-2 text-sm font-semibold text-white">{hardestMomentLabel}</div>
                          <div className="mt-2 text-sm leading-6 text-white/56">
                            {holdingPainReport.difficulty.explanation}
                          </div>
                        </div>
                      ) : null}

                      {crisisEntries.length > 0 ? (
                        <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-white/34">
                            주요 고비
                          </div>
                          <div className="mt-3 space-y-3">
                            {crisisEntries.map(({ crisis, index, label }) => (
                              <div
                                key={`${result.assetId}-${crisis.startDate}-${crisis.troughDate}`}
                                className="rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-[11px] text-white/42">고비 {index + 1}</div>
                                    <div className="mt-1 text-sm font-semibold text-white">{label}</div>
                                    <div className="mt-1 text-xs leading-5 text-white/44">
                                      최대 낙폭 {formatMetricPercent(crisis.maxDrawdownPct)}
                                    </div>
                                  </div>
                                  {canOpenDetailChart ? (
                                    <button
                                      className="btn-secondary min-h-10 rounded-full px-4 text-sm font-semibold transition"
                                      onClick={() =>
                                        openDetailChartForCrisis(resultAsset, label, crisis)
                                      }
                                      type="button"
                                    >
                                      이 구간 자세히 보기
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                          {!canOpenDetailChart ? (
                            <div className="mt-3 text-xs leading-5 text-white/42">
                              이 자산은 아직 일봉·주봉·월봉 상세 차트를 볼 수 없습니다.
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {resultMetrics?.currencyNote ? (
                        <div className="mt-3 text-sm leading-6 text-white/46">{resultMetrics.currencyNote}</div>
                      ) : null}
                    </div>
                  );
                })}
                </div>

                <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/50">
                  고비 횟수는 직전 고점 대비 30% 이상 하락한 구간 수입니다.
                </div>
              </details>

              <div className="mt-6 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="text-sm leading-6 text-white/60">
                  {resultInsightCopy}
                </div>
              </div>

              <AdSlot
                className="mt-5 min-h-[96px]"
                label="결과 광고"
                placement="result-after-summary"
                slot={process.env.NEXT_PUBLIC_ADSENSE_RESULT_SLOT}
              />

              {noProfitTimetable ? (
                <NoProfitTimetableCard
                  formatKrw={formatKrwCompact}
                  onShare={(activeTimetable) => void handleShareNoProfitTimetable(activeTimetable)}
                  timetable={noProfitTimetable}
                  timetables={noProfitTimetableOptions}
                />
              ) : null}

              <ReferralCtaCard
                copy={resultReferral}
                onMissingUrl={() => setShareFeedback("레퍼럴 링크가 아직 설정되지 않았습니다.")}
                placement="volatility"
              />

              <div className="surface-card mt-5 rounded-[24px] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">ANOTHER START</div>
                    <div className="mt-2 text-[1.05rem] font-semibold tracking-[-0.04em] text-white">
                      시작점을 바꾸면 완전히 다른 장면이 나옵니다
                    </div>
                    <div className="mt-2 text-sm leading-6 text-white/56">
                      {resultNextExperimentBody}
                    </div>
                  </div>
                  <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/52">
                    다시 보기
                  </div>
                </div>
                <button
                  className="btn-secondary mt-4 min-h-12 rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition"
                  onClick={openStartPointPicker}
                  type="button"
                >
                  시작점 바꿔보기
                </button>
              </div>

              <div className="mt-6 grid gap-2">
                <button
                  className="btn-accent min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
                  onClick={openResultAssetSearch}
                  type="button"
                >
                  전체 종목 검색으로 다시 보기
                </button>
                <button
                  className="btn-secondary min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
                  onClick={restartFromAssets}
                  type="button"
                >
                  선택 화면으로 돌아가기
                </button>
                <button
                  className="btn-secondary min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
                  onClick={() => void handleShareResult()}
                  type="button"
                >
                  결과 공유
                </button>
                <button
                  className="btn-secondary min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
                  onClick={handleSaveResult}
                  type="button"
                >
                  결과 저장
                </button>
                <button
                  className="btn-secondary min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
                  onClick={() => void handleDownloadRegretReceipt()}
                  type="button"
                >
                  요약 이미지 저장
                </button>
              </div>

              {shareFeedback ? (
                <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
                  {shareFeedback}
                </div>
              ) : null}

              <details className="surface-card mt-6 rounded-[20px] px-4 py-3">
                <summary className="cursor-pointer list-none text-[11px] leading-5 text-white/48">
                  {resultTrustSummary}
                </summary>
                <div className="mt-3 grid gap-2 text-[11px] leading-5 text-white/42">
                  {resultTrustNotes.map((note) => (
                    <div key={note}>{note}</div>
                  ))}
                </div>
              </details>
            </section>
          ) : null}
        </div>
      </div>
      {shouldShowBottomPrimaryNav ? (
        <BottomPrimaryNav
          activeKey={primaryNavActiveKey}
          onAssets={goToAllAssets}
          onCompare={goToSoloBuilder}
          onMore={openMoreMenu}
          onSaved={goToSavedRecords}
        />
      ) : null}

      {flowStep === "assets" && !showAllAssets ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-5 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <div className="mx-auto w-full max-w-[460px] sm:max-w-[520px]">
            <div className="surface-floating pointer-events-auto rounded-[28px] p-3 backdrop-blur-xl animate-[fade-in_220ms_ease-out]">
              <div className="px-2 pb-2 text-center text-[11px] text-white/46">
                {canContinueFromAssetSelection
                  ? `${selectedAssets.map((asset) => asset.shortLabel ?? asset.label).join(" · ")} 준비됨`
                  : "궁금한 자산을 골라주세요"}
              </div>
              <div className="px-2 pb-2 text-center text-[11px] text-white/34">
                {canContinueFromAssetSelection
                  ? selectedAssetIds.length === 1
                    ? "정기예금 기준과 먼저 비교해요"
                    : "같은 돈이 지나온 시간"
                  : "하나만 골라도 다음 단계로 넘어가요"}
              </div>
              <button
                className="btn-accent min-h-14 w-full rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/34"
                disabled={!canContinueFromAssetSelection}
                onClick={goToAmount}
                type="button"
              >
                {canContinueFromAssetSelection
                  ? selectedAssetIds.length === 1
                    ? "이 종목으로 금액 정하기"
                    : "선택한 종목으로 금액 정하기"
                  : "종목을 선택해주세요"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {flowStep === "amount" ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-5 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <div className="mx-auto w-full max-w-[460px] sm:max-w-[520px]">
            <div className="surface-floating pointer-events-auto rounded-[28px] p-3 backdrop-blur-xl animate-[fade-in_220ms_ease-out]">
              <div className="px-2 pb-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-white/34">현재 설정 금액</div>
                <div className="mt-2 text-[1.4rem] font-semibold tracking-[-0.05em] text-white">
                  {isMonthlyInvestmentMode
                    ? `월 ${formattedMonthlyContributionValue}`
                    : formattedAmountValue}
                </div>
                <div className="mt-1 text-sm text-white/48">
                  {activeStartDateRange.isPremiumCustom
                    ? `${formatDateLabel(raceBuild?.resolvedStartDate ?? activeStartDateRange.start)}부터 봅니다`
                    : isMonthlyInvestmentMode
                      ? "매달 같은 금액을 넣습니다."
                      : "기본 1,000만원 또는 직접 입력으로 시작합니다."}
                </div>
              </div>
              <button
                className="btn-accent min-h-14 w-full rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/34"
                disabled={isMarketLoading || !raceBuild || Boolean(amountStepError)}
                onClick={goToRace}
                type="button"
              >
                {amountPrimaryCtaLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPresetBrowserOpen ? (
        <div className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.88)] backdrop-blur-sm">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            onClick={closePresetBrowser}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] w-full max-w-[520px] flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
            <div className="surface-section relative flex min-h-0 flex-col rounded-[28px] border border-white/8 px-4 py-4 shadow-[0_-16px_60px_rgba(0,0,0,0.32)]">
              <div className="mx-auto h-1.5 w-12 shrink-0 rounded-full bg-white/12" />
              <div className="mt-4 flex shrink-0 items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                    역사가 증명한 10년의 기록
                  </div>
                  <div className="mt-2 text-lg font-semibold tracking-[-0.05em] text-white">
                    궁금한 대결을 먼저 열어보세요
                  </div>
                  <div className="mt-1 text-sm leading-6 text-white/56">
                    ETF, 부동산, 반도체, 레버리지까지 많이 찾는 조합을 모았습니다.
                  </div>
                </div>
                <button
                  className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/68 transition hover:bg-white/[0.06]"
                  onClick={closePresetBrowser}
                  type="button"
                >
                  닫기
                </button>
              </div>

              <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                <RecommendedComparisonList
                  initialLimit={999}
                  onSelect={applyDesktopRecommendedComparison}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {flowStep === "assets" && showAllAssets ? (
        <div className="fixed inset-0 z-50 h-dvh overflow-hidden bg-black">
          <div className="mx-auto flex h-dvh w-full max-w-[520px] flex-col overflow-hidden px-4 pt-[calc(env(safe-area-inset-top)+8px)]">
            <div className="shrink-0 border-b border-white/8 bg-black/95 pb-3 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <button
                  className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/68 transition hover:bg-white/[0.06]"
                  onClick={closeAssetPicker}
                  type="button"
                >
                  닫기
                </button>
                <div className="min-w-0 text-center">
                  <div className="hidden text-[11px] font-semibold tracking-[0.24em] text-[var(--rz-text-muted)]">
                    ASSET BROWSER
                  </div>
                  <div className="text-sm font-semibold tracking-[-0.03em] text-white">
                    전체 종목 검색
                  </div>
                </div>
                <div className="w-11" />
              </div>

              <div className="mt-2">
                <div className="px-1 text-[12px] leading-5 text-white/46">
                  {HOME_FLOW_COPY.allAssetsHint}
                </div>
                <div className="surface-card mt-2 flex min-h-[48px] items-center gap-3 rounded-[18px] px-4 py-3">
                  <div className="text-[13px] font-medium text-[var(--rz-text-secondary)]">종목</div>
                  <input
                    aria-label="전체 종목 검색"
                    className="min-w-0 flex-1 bg-transparent text-sm text-[var(--rz-text-primary)] outline-none placeholder:text-[var(--rz-text-muted)]"
                    inputMode="search"
                    onChange={(event) => {
                      const nextQuery = event.target.value;
                      setAssetSearchQuery(nextQuery);
                      if (nextQuery.trim()) {
                        setActiveAssetFilter("all");
                      }
                    }}
                    placeholder="예: 삼성전자, 엔비디아, BTC"
                    type="search"
                    value={assetSearchQuery}
                  />
                  {assetSearchQuery ? (
                    <button
                      className="rounded-full border border-white/8 bg-white/[0.02] px-3 py-1.5 text-[11px] font-medium text-white/54 transition hover:bg-white/[0.05]"
                      onClick={() => setAssetSearchQuery("")}
                      type="button"
                    >
                      지우기
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {assetBrowserFilterChips.map((filter) => {
                  const isActive = filter.id === activeAssetFilter;

                  return (
                    <button
                      key={filter.id}
                      className="min-h-[34px] shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium whitespace-nowrap transition"
                      onClick={() => handleAssetFilterChange(filter.id)}
                      style={{
                        backgroundColor: isActive
                          ? "var(--rz-accent-soft)"
                          : "var(--rz-surface-card)",
                        borderColor: isActive
                          ? "var(--rz-border-strong)"
                          : "var(--rz-border)",
                        color: isActive ? "var(--rz-accent)" : "var(--rz-text-secondary)",
                      }}
                      type="button"
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-1 px-1">
                <div className="flex items-center justify-between gap-3 text-[11px] leading-4 text-white/46">
                  <span>
                    {normalizedAssetSearchQuery
                      ? `검색 결과 ${browserVisibleAssetCount}개`
                      : activeAssetFilter === "popular"
                        ? "많이 찾는 이름입니다."
                        : "테마를 넘기고, 아래에서 고르세요."}
                  </span>
                  <span className="shrink-0 text-[var(--rz-accent)]">
                    {selectedAssetIds.length} / {MAIN_COMPARISON_ASSET_LIMIT} 선택
                  </span>
                </div>
              </div>

              <div className="mt-2 rounded-[18px] border border-white/8 bg-white/[0.025] px-3 py-2">
                <div className="text-[11px] font-medium text-white/44">{assetPickerSearchStatusLabel}</div>
                <div className="mt-1 flex min-h-7 flex-wrap gap-1.5">
                  {selectedAssets.length > 0 ? (
                    selectedAssets.map((asset, index) => (
                      <button
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-white/[0.06]"
                        key={`asset-picker-selected-${asset.id}`}
                        onClick={() => handleRemoveSelectedAsset(asset.id)}
                        style={{
                          backgroundColor: getComparisonSlotGlow(index, 0.16),
                          borderColor: `${getComparisonSlotColor(index)}66`,
                        }}
                        type="button"
                      >
                        <span>{asset.shortLabel ?? asset.label}</span>
                        <span className="text-white/46">삭제</span>
                      </button>
                    ))
                  ) : (
                    <div className="flex items-center text-[12px] text-white/34">
                      아직 선택한 종목이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2">
              <div className="space-y-4 pb-3">
                {displayedPopularBrowserAssetIds.length > 0 ? (
                  <section>
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold tracking-[-0.03em] text-white">
                          지금 많이 보는 자산
                        </div>
                        <div className="mt-1 text-[11px] leading-4 text-white/48">
                          많이 찾는 이름입니다.
                        </div>
                      </div>
                      <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] text-white/48">
                        {displayedPopularBrowserAssetIds.length}개
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {displayedPopularBrowserAssetIds.map((assetId) => renderAssetBrowserItem(assetId))}
                    </div>
                    {hiddenPopularBrowserAssetCount > 0 ? (
                      <button
                        className="mt-3 min-h-11 w-full rounded-full border border-[var(--rz-border)] bg-[var(--rz-surface-card)] px-4 text-sm font-semibold text-[var(--rz-text-secondary)] transition hover:bg-[var(--rz-surface-card-elevated)]"
                        onClick={() => handleAssetFilterChange("popular")}
                        type="button"
                      >
                        {hiddenPopularBrowserAssetCount}개 더 보기
                      </button>
                    ) : null}
                  </section>
                ) : null}

                {assetBrowserSections.map((section) => (
                  <section key={section.id}>
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold tracking-[-0.03em] text-white">
                          {section.title}
                        </div>
                        <div className="mt-1 text-[11px] leading-4 text-white/48">
                          {section.helper}
                        </div>
                      </div>
                      <div className="text-[11px] text-white/40">{section.assetIds.length}개</div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {section.assetIds.map((assetId) => renderAssetBrowserItem(assetId))}
                    </div>
                  </section>
                ))}

                {directSearchAssetIds.length > 0 ? (
                  <section>
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold tracking-[-0.03em] text-white">
                          검색 결과
                        </div>
                        <div className="mt-1 text-[11px] leading-4 text-white/48">
                          검색어와 맞는 자산입니다.
                        </div>
                      </div>
                      <div className="text-[11px] text-white/40">{directSearchAssetIds.length}개</div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {directSearchAssetIds.map((assetId) => renderAssetBrowserItem(assetId))}
                    </div>
                  </section>
                ) : null}

                {shouldShowProDiscoverySection ? (
                  <section className="surface-card rounded-[24px] border-[var(--rz-border-strong)] bg-[var(--rz-accent-soft)] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold tracking-[-0.03em] text-white">
                          곧 추가될 자산
                        </div>
                        <div className="mt-1 text-xs leading-5 text-white/52">
                          더 많은 자산을 광고 기반 무료 기능으로 열어둘 예정입니다.
                        </div>
                      </div>
                      <button
                        className="rounded-full border border-[var(--rz-border-strong)] bg-white px-3 py-2 text-[11px] font-semibold text-[var(--rz-accent)] transition hover:brightness-105"
                        onClick={() => openPremiumPrompt("deeper-analysis")}
                        type="button"
                      >
                        준비 중인 자산 보기
                      </button>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {proDiscoveryAssetIds.map((assetId) =>
                        renderAssetBrowserItem(assetId, { locked: true }),
                      )}
                    </div>
                  </section>
                ) : null}

                {browserVisibleAssetCount === 0 && !shouldShowProDiscoverySection ? (
                  <div className="surface-card rounded-[24px] px-4 py-8 text-center">
                    <div className="text-sm font-semibold text-white">찾는 자산이 없습니다</div>
                    <div className="mt-2 text-xs leading-5 text-white/48">
                      검색어를 줄이거나 전체를 선택하세요.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 border-t border-white/8 bg-black/[0.92] pt-2 pb-[calc(env(safe-area-inset-bottom)+10px)] backdrop-blur">
              <div className="surface-floating mx-auto w-full rounded-[24px] border border-white/8 p-3 backdrop-blur-xl">
                {selectedAssets.length > 0 ? (
                  <div className="mb-2 grid gap-1.5">
                    {selectedAssets.map((asset, index) => (
                      <div
                        className="flex items-center justify-between gap-3 rounded-[16px] border px-3 py-2"
                        key={`asset-picker-bottom-${asset.id}`}
                        style={{
                          backgroundColor: getComparisonSlotGlow(index, 0.12),
                          borderColor: `${getComparisonSlotColor(index)}42`,
                        }}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold tracking-[-0.03em] text-white">
                            {index + 1}. {asset.shortLabel ?? asset.label}
                          </div>
                          <div className="mt-0.5 text-[11px] text-white/42">
                            {getAssetBrowserTickerLabel(asset)} · {getAssetBrowserCategoryLabel(asset)}
                          </div>
                        </div>
                        <button
                          className="shrink-0 rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/56"
                          onClick={() => handleRemoveSelectedAsset(asset.id)}
                          type="button"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="px-1 pb-2 text-center">
                  <div className="text-[11px] font-semibold text-white/72">
                    {assetPickerSelectionCountLabel}
                  </div>
                  <div className="mt-0.5 text-[12px] text-white/52">
                    {assetPickerBottomDescription}
                  </div>
                </div>
                <button
                  className="btn-accent min-h-12 w-full rounded-full px-4 text-sm font-semibold tracking-[-0.02em] transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/34"
                  disabled={!canContinueFromAssetSelection}
                  onClick={continueFromAssetPicker}
                  type="button"
                >
                  {assetPickerPrimaryLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {flowStep === "assets" && assetToast ? (
        <div
          className="pointer-events-none fixed inset-x-0 z-50 px-8 transition-[bottom] duration-300 ease-out"
          style={{
            bottom: "calc(env(safe-area-inset-bottom) + 120px)",
          }}
        >
          <div className="surface-floating mx-auto w-fit max-w-full rounded-full px-4 py-2 text-sm text-white backdrop-blur-xl animate-[fade-in_180ms_ease-out]">
            {assetToast}
          </div>
        </div>
      ) : null}

    </main>
  );
}
