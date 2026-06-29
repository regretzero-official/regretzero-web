"use client";

import {
  Bookmark,
  ChevronRight,
  Clock3,
  Flame,
  Home,
  LineChart,
  Radio,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  BEAR_MARKET_PAIN_COPY,
  BRAND_SLOGANS,
  BULL_MARKET_TEMPTATION_COPY,
  CRITICAL_MOMENTS_COPY,
  EMOTION_MAP_LABELS,
  NOISE_NOTE_COPY,
  USER_DIAGNOSIS_COPY,
  fillRegretCopyTemplate,
  type EmotionMapLabelKey,
  type RealityDiagnosisOptionKey,
} from "@/lib/regret-copy";

type BottomTab = "home" | "live" | "saved" | "search";
type AssetTab = "all" | "coin" | "etf" | "kospi" | "nasdaq100" | "sp500";
type CoverageType = "listed_since" | "ten_year";

interface LabAsset {
  accent: string;
  coverage: CoverageType;
  description: string;
  firstAvailableDate: string;
  finalMultiple: number;
  groups: string[];
  id: string;
  maxDrawdown: number;
  name: string;
  ticker: string;
  theme: string;
}

interface EmotionMonth {
  date: string;
  label: EmotionMapLabelKey;
  monthlyReturn: number;
  note: string;
  totalReturn: number;
}

const INITIAL_PRINCIPAL = 10_000_000;

const LAB_ASSETS: LabAsset[] = [
  {
    accent: "#ef4444",
    coverage: "ten_year",
    description:
      "AI 데이터센터가 커질수록 가장 먼저 이름이 나오는 반도체 대표주입니다. 문제는, 그 사이 하락도 사람을 꽤 세게 흔들었다는 겁니다.",
    finalMultiple: 84.2,
    firstAvailableDate: "1999-01-22",
    groups: ["Nasdaq100", "S&P500"],
    id: "nvda",
    maxDrawdown: -66,
    name: "엔비디아",
    theme: "AI 반도체",
    ticker: "NVDA",
  },
  {
    accent: "#2563eb",
    coverage: "ten_year",
    description:
      "아이폰과 서비스 생태계를 가진 세계 대표 소비자 기술 기업입니다. 너무 익숙해서 오히려 오래 들고 가기 어려운 종목이기도 합니다.",
    finalMultiple: 8.1,
    firstAvailableDate: "1980-12-12",
    groups: ["Nasdaq100", "S&P500"],
    id: "aapl",
    maxDrawdown: -39,
    name: "애플",
    theme: "빅테크",
    ticker: "AAPL",
  },
  {
    accent: "#0ea5e9",
    coverage: "ten_year",
    description:
      "클라우드와 소프트웨어, AI를 모두 잡은 대표 기업입니다. 지루하게 강한 종목도 중간에는 사람을 의심하게 만듭니다.",
    finalMultiple: 11.7,
    firstAvailableDate: "1986-03-13",
    groups: ["Nasdaq100", "S&P500"],
    id: "msft",
    maxDrawdown: -37,
    name: "마이크로소프트",
    theme: "클라우드/AI",
    ticker: "MSFT",
  },
  {
    accent: "#dc2626",
    coverage: "ten_year",
    description:
      "전기차 시대를 상징하는 종목입니다. 크게 오른 만큼, 실제 계좌에서는 멀미가 날 정도로 흔들렸을 가능성이 큽니다.",
    finalMultiple: 22.5,
    firstAvailableDate: "2010-06-29",
    groups: ["Nasdaq100", "S&P500"],
    id: "tsla",
    maxDrawdown: -73,
    name: "테슬라",
    theme: "전기차",
    ticker: "TSLA",
  },
  {
    accent: "#f97316",
    coverage: "ten_year",
    description:
      "광고와 소셜 네트워크, AI 추천 시스템을 가진 플랫폼 기업입니다. 모두가 끝났다고 말한 시간이 지나고 나서야 반전이 보였습니다.",
    finalMultiple: 7.6,
    firstAvailableDate: "2012-05-18",
    groups: ["Nasdaq100", "S&P500"],
    id: "meta",
    maxDrawdown: -76,
    name: "메타",
    theme: "플랫폼/AI",
    ticker: "META",
  },
  {
    accent: "#f59e0b",
    coverage: "ten_year",
    description:
      "AI 서버와 네트워크 반도체 수요가 커질수록 같이 언급되는 기업입니다. 조용히 강한 종목도 견디는 시간은 조용하지 않습니다.",
    finalMultiple: 24.8,
    firstAvailableDate: "2009-08-06",
    groups: ["Nasdaq100", "S&P500"],
    id: "avgo",
    maxDrawdown: -48,
    name: "브로드컴",
    theme: "반도체 인프라",
    ticker: "AVGO",
  },
  {
    accent: "#1d4ed8",
    coverage: "ten_year",
    description:
      "한국 주식시장에서 가장 먼저 떠올리는 대표 기술주입니다. 익숙한 이름이라도 오래 들고 가는 건 전혀 다른 문제입니다.",
    finalMultiple: 2.2,
    firstAvailableDate: "1975-06-11",
    groups: ["KOSPI"],
    id: "samsung-electronics",
    maxDrawdown: -46,
    name: "삼성전자",
    theme: "한국 반도체",
    ticker: "005930",
  },
  {
    accent: "#7c3aed",
    coverage: "ten_year",
    description:
      "AI 서버에 들어가는 고대역폭 메모리 수요가 커질수록 같이 주목받는 한국 반도체 핵심주입니다.",
    finalMultiple: 5.4,
    firstAvailableDate: "1996-12-26",
    groups: ["KOSPI"],
    id: "sk-hynix",
    maxDrawdown: -59,
    name: "SK하이닉스",
    theme: "메모리/HBM",
    ticker: "000660",
  },
  {
    accent: "#16a34a",
    coverage: "listed_since",
    description:
      "전기차 배터리 시장을 대표하는 한국 대형 배터리 기업입니다. 10년 데이터가 없어 상장일부터 계산해야 합니다.",
    finalMultiple: 0.72,
    firstAvailableDate: "2022-01-27",
    groups: ["KOSPI"],
    id: "lg-energy-solution",
    maxDrawdown: -54,
    name: "LG에너지솔루션",
    theme: "배터리",
    ticker: "373220",
  },
  {
    accent: "#0891b2",
    coverage: "ten_year",
    description:
      "한국 자동차 산업의 대표 기업입니다. 좋은 기업이어도 시장이 인정해주기까지 기다리는 시간은 길 수 있습니다.",
    finalMultiple: 2.9,
    firstAvailableDate: "1974-06-28",
    groups: ["KOSPI"],
    id: "hyundai-motor",
    maxDrawdown: -44,
    name: "현대차",
    theme: "자동차",
    ticker: "005380",
  },
  {
    accent: "#10b981",
    coverage: "ten_year",
    description:
      "한국 인터넷 플랫폼 대표 기업입니다. 성장주라는 말이 뜨거울 때와 차가울 때의 온도 차이를 그대로 맞는 종목입니다.",
    finalMultiple: 3.1,
    firstAvailableDate: "2002-10-29",
    groups: ["KOSPI"],
    id: "naver",
    maxDrawdown: -67,
    name: "NAVER",
    theme: "인터넷/플랫폼",
    ticker: "035420",
  },
  {
    accent: "#3b82f6",
    coverage: "ten_year",
    description:
      "미국 대표 기업 500개를 한 번에 담는 가장 쉬운 출발점입니다. 개별 종목보다 덜 흔들려도, 버티는 시간은 여전히 필요합니다.",
    finalMultiple: 3.2,
    firstAvailableDate: "1993-01-29",
    groups: ["ETF", "S&P500"],
    id: "spy",
    maxDrawdown: -34,
    name: "S&P500 ETF",
    theme: "미국지수 ETF",
    ticker: "SPY",
  },
  {
    accent: "#06b6d4",
    coverage: "ten_year",
    description:
      "나스닥100 대표 ETF입니다. 기술주가 강할 때는 달리지만, 금리와 버블 논란 앞에서는 꽤 거칠게 흔들립니다.",
    finalMultiple: 5.1,
    firstAvailableDate: "1999-03-10",
    groups: ["ETF", "Nasdaq100"],
    id: "qqq",
    maxDrawdown: -36,
    name: "나스닥100 ETF",
    theme: "미국기술 ETF",
    ticker: "QQQ",
  },
  {
    accent: "#f7931a",
    coverage: "ten_year",
    description:
      "정부나 기업이 찍어낼 수 없는 희소성에 투자하는 디지털 자산입니다. 수익률보다 먼저, 변동성을 견딜 수 있는지가 문제입니다.",
    finalMultiple: 96.4,
    firstAvailableDate: "2014-09-17",
    groups: ["Coin"],
    id: "btc",
    maxDrawdown: -83,
    name: "비트코인",
    theme: "디지털 희소자산",
    ticker: "BTC",
  },
  {
    accent: "#627eea",
    coverage: "listed_since",
    description:
      "스마트계약과 온체인 생태계의 대표 자산입니다. 10년이 부족한 구간은 상장 이후 기준으로 공시하고 계산해야 합니다.",
    finalMultiple: 48.5,
    firstAvailableDate: "2015-08-07",
    groups: ["Coin"],
    id: "eth",
    maxDrawdown: -82,
    name: "이더리움",
    theme: "스마트계약",
    ticker: "ETH",
  },
];

const ASSET_TABS: Array<{ id: AssetTab; label: string }> = [
  { id: "all", label: "전체" },
  { id: "kospi", label: "코스피" },
  { id: "nasdaq100", label: "Nasdaq100" },
  { id: "sp500", label: "S&P500" },
  { id: "etf", label: "ETF" },
  { id: "coin", label: "코인" },
];

const THEME_FILTERS = ["전체", "AI", "반도체", "자동차", "배터리", "플랫폼", "ETF", "10년 가능", "상장일부터"];

const LIVE_MATCHUPS = [
  {
    id: "ai-memory",
    title: "엔비디아 vs SK하이닉스",
    description: "AI 반도체의 미국 대표와 한국 대표가 같은 10년을 어떻게 지나왔는지 봅니다.",
    assetId: "nvda",
  },
  {
    id: "battery-pain",
    title: "LG에너지솔루션 상장일부터",
    description: "10년 데이터가 없는 종목은 숨기지 않습니다. 상장일부터의 시간을 따로 봅니다.",
    assetId: "lg-energy-solution",
  },
  {
    id: "btc-gold",
    title: "비트코인의 공포 구간",
    description: "큰 수익률 뒤에 숨어 있던 -80%대 하락을 견딜 수 있었는지 묻습니다.",
    assetId: "btc",
  },
];

function formatKrw(value: number) {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue >= 100_000_000) {
    const eok = Math.floor(absValue / 100_000_000);
    const man = Math.round((absValue % 100_000_000) / 10_000);
    return man > 0 ? `${sign}${eok}억 ${man.toLocaleString("ko-KR")}만원` : `${sign}${eok}억원`;
  }

  return `${sign}${Math.round(absValue / 10_000).toLocaleString("ko-KR")}만원`;
}

function formatSignedPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toLocaleString("ko-KR")}%`;
}

function getAssetTabMatch(asset: LabAsset, tab: AssetTab) {
  if (tab === "all") return true;
  if (tab === "kospi") return asset.groups.includes("KOSPI");
  if (tab === "nasdaq100") return asset.groups.includes("Nasdaq100");
  if (tab === "sp500") return asset.groups.includes("S&P500");
  if (tab === "etf") return asset.groups.includes("ETF");
  return asset.groups.includes("Coin");
}

function getCoverageLabel(asset: LabAsset) {
  return asset.coverage === "ten_year" ? "10년 데이터 가능" : "상장일부터 계산";
}

function getObjectParticle(value: string) {
  const lastChar = value.trim().at(-1);
  if (!lastChar) return "를";

  const code = lastChar.charCodeAt(0);
  const hangulStart = 0xac00;
  const hangulEnd = 0xd7a3;

  if (code < hangulStart || code > hangulEnd) {
    return "를";
  }

  return (code - hangulStart) % 28 === 0 ? "를" : "을";
}

function getScenario(asset: LabAsset) {
  const finalValue = Math.round(INITIAL_PRINCIPAL * asset.finalMultiple);
  const underATHPercent = Math.min(78, Math.max(28, Math.round(Math.abs(asset.maxDrawdown) * 0.86)));
  const underATHMonths = Math.round((underATHPercent / 100) * (asset.coverage === "ten_year" ? 120 : 42));
  const underPrincipalMonths = Math.max(0, Math.round(Math.abs(asset.maxDrawdown) / 9));
  const longestRecoveryMonths = Math.max(6, Math.round(Math.abs(asset.maxDrawdown) / 2.1));
  const coverageYears = asset.coverage === "ten_year" ? "10년" : `${asset.firstAvailableDate.slice(0, 4)}년 상장일부터`;
  const milestoneMultiples = [2, 5, 10].filter((multiple) => asset.finalMultiple >= multiple);
  const milestones = milestoneMultiples.map((multiple, index) => {
    const valueAtMilestone = INITIAL_PRINCIPAL * multiple;
    const missedAmount = Math.max(0, finalValue - valueAtMilestone);

    return {
      date:
        asset.coverage === "ten_year"
          ? [`2017.08`, `2020.11`, `2023.05`][index] ?? "2024.01"
          : [`2022.09`, `2023.12`, `2024.05`][index] ?? "상장 이후",
      missedAmount,
      multiple,
      valueAtMilestone,
    };
  });

  const emotionMonths: EmotionMonth[] = [
    {
      date: asset.coverage === "ten_year" ? "2016.03" : "상장 2개월",
      label: "FIRST_PROFIT",
      monthlyReturn: 8,
      note: "처음으로 계좌가 웃어줬습니다. 여기까지는 누구나 장기투자자가 됩니다.",
      totalReturn: 12,
    },
    {
      date: asset.coverage === "ten_year" ? "2018.10" : "상장 7개월",
      label: "SHARP_DROP",
      monthlyReturn: -18,
      note: "계좌를 자주 열어보게 되는 달입니다. 좋은 기업이라는 말이 갑자기 멀어집니다.",
      totalReturn: -9,
    },
    {
      date: asset.coverage === "ten_year" ? "2019.06" : "상장 13개월",
      label: "SIDEWAYS",
      monthlyReturn: 1,
      note: "오르지도 끝나지도 않습니다. 사람을 지치게 만드는 건 폭락보다 이런 시간일 수 있습니다.",
      totalReturn: 4,
    },
    {
      date: asset.coverage === "ten_year" ? "2020.03" : "상장 18개월",
      label: "HELL",
      monthlyReturn: Math.min(-22, Math.round(asset.maxDrawdown / 3)),
      note: "던지고 싶은 달입니다. 차트가 아니라 내 돈이었다면 손이 먼저 움직였을 가능성이 큽니다.",
      totalReturn: -21,
    },
    {
      date: asset.coverage === "ten_year" ? "2021.02" : "상장 24개월",
      label: asset.finalMultiple >= 2 ? "MILESTONE_2X" : "RECOVERING",
      monthlyReturn: 19,
      note: "돈이 불어나기 시작합니다. 그런데 여기서부터는 팔고 싶은 유혹도 같이 커집니다.",
      totalReturn: asset.finalMultiple >= 2 ? 100 : 38,
    },
    {
      date: asset.coverage === "ten_year" ? "2022.06" : "상장 30개월",
      label: "UNDER_PRINCIPAL",
      monthlyReturn: -24,
      note: "내가 넣은 돈보다 작아져 있던 시간입니다. 장기투자라는 말이 갑자기 무겁게 느껴집니다.",
      totalReturn: -13,
    },
    {
      date: asset.coverage === "ten_year" ? "2023.07" : "상장 36개월",
      label: "TEMPTATION",
      monthlyReturn: 27,
      note: "이 정도면 됐다는 말이 가장 그럴듯하게 들립니다. 작은 성공이 더 큰 시간을 팔게 만듭니다.",
      totalReturn: Math.round((asset.finalMultiple * 100) / 3),
    },
    {
      date: asset.coverage === "ten_year" ? "2024.11" : "최근",
      label: "ATH",
      monthlyReturn: 14,
      note: "다시 신고가입니다. 끝까지 남아 있던 사람만 이 장면을 봅니다.",
      totalReturn: Math.round((asset.finalMultiple - 1) * 100),
    },
  ];

  return {
    asset,
    bearMoments: [
      {
        date: asset.coverage === "ten_year" ? "2020.03" : "상장 후 첫 급락",
        dropPct: Math.round(Math.abs(asset.maxDrawdown) * 0.62),
      },
      {
        date: asset.coverage === "ten_year" ? "2022.06" : "상장 후 침체",
        dropPct: Math.round(Math.abs(asset.maxDrawdown) * 0.88),
      },
      {
        date: asset.coverage === "ten_year" ? "2022.10" : "최근 저점",
        dropPct: Math.abs(asset.maxDrawdown),
      },
    ],
    bullMoments: milestones.slice(0, 3),
    coverageYears,
    emotionMonths,
    finalValue,
    longestRecovery: `${longestRecoveryMonths}개월`,
    milestones,
    noiseSummary:
      asset.theme.includes("반도체") || asset.theme.includes("AI")
        ? "AI는 과열이고, 반도체 사이클은 곧 꺾인다는 말이 매일같이 나왔습니다."
        : asset.groups.includes("Coin")
          ? "디지털 자산은 끝났고, 이번에는 정말 회복이 어렵다는 말이 시장을 뒤덮었습니다."
          : "고금리, 경기침체, 성장 둔화 같은 말들이 매일같이 팔아야 할 이유처럼 보였습니다.",
    underATHMonths,
    underATHPercent,
    underPrincipalMonths,
  };
}

function LabSection({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
}) {
  return (
    <section className="rounded-[32px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.07)]">
      {eyebrow ? (
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">{eyebrow}</div>
      ) : null}
      <h2 className="mt-2 text-[24px] font-black leading-[1.15] tracking-[-0.06em] text-slate-950">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "blue" | "green" | "red" | "slate" | "yellow" }) {
  const toneClass = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-rose-200 bg-rose-50 text-rose-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    yellow: "border-amber-200 bg-amber-50 text-amber-700",
  }[tone];

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${toneClass}`}>
      {children}
    </span>
  );
}

function BottomNav({
  activeTab,
  setActiveTab,
}: {
  activeTab: BottomTab;
  setActiveTab: (tab: BottomTab) => void;
}) {
  const items = [
    { Icon: Home, id: "home" as const, label: "홈" },
    { Icon: Search, id: "search" as const, label: "검색" },
    { Icon: Radio, id: "live" as const, label: "라이브" },
    { Icon: Bookmark, id: "saved" as const, label: "보관함" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="mx-auto grid max-w-[480px] grid-cols-4 gap-1 rounded-[28px] border border-slate-200/90 bg-white/92 p-1.5 shadow-[0_-18px_44px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
        {items.map(({ Icon, id, label }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[22px] text-[11px] font-black transition ${
                isActive ? "bg-slate-950 text-[#f8fafc] shadow-[0_12px_24px_rgba(15,23,42,0.18)]" : "text-slate-400"
              }`}
              data-testid={`lab-bottom-tab-${id}`}
              onClick={() => setActiveTab(id)}
              type="button"
            >
              <Icon className="h-4 w-4" strokeWidth={2.2} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function ResultHero({ asset }: { asset: LabAsset }) {
  const scenario = getScenario(asset);
  const startLabel = asset.coverage === "ten_year" ? "10년 전" : `${asset.firstAvailableDate} 상장일`;

  return (
    <div className="overflow-hidden rounded-[36px] border border-slate-200 bg-[#111827] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-[#bfdbfe]">REGRETZERO LAB</div>
          <h1 className="mt-4 text-[36px] font-black leading-[0.98] tracking-[-0.08em] text-[#f8fafc]">
            {startLabel}
            <br />
            {asset.name}{getObjectParticle(asset.name)} 샀다면
          </h1>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/12 px-3 py-2 text-right">
          <div className="text-[10px] text-[#cbd5e1]">실험 자산</div>
          <div className="mt-1 text-sm font-black text-[#f8fafc]">{asset.ticker}</div>
        </div>
      </div>

      <div className="mt-8 rounded-[28px] bg-white p-4 text-slate-950">
        <div className="text-[12px] font-bold text-slate-500">1,000만 원의 마지막 장면</div>
        <div className="mt-1 text-[40px] font-black tracking-[-0.08em]">{formatKrw(scenario.finalValue)}</div>
        <p className="mt-3 text-[15px] font-bold leading-6 text-slate-700">
          결과만 보면 쉬워 보입니다. 문제는, 당신이 이 길을 끝까지 들고 갈 수 있었냐는 겁니다.
        </p>
      </div>

      <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4">
        <div className="text-sm font-bold leading-6 text-[#f8fafc]">{BRAND_SLOGANS.sellLowSellHigh}</div>
      </div>
    </div>
  );
}

function PainDashboard({ asset }: { asset: LabAsset }) {
  const scenario = getScenario(asset);
  const metrics = [
    {
      Icon: TrendingDown,
      label: "최대 하락",
      text: fillRegretCopyTemplate(BEAR_MARKET_PAIN_COPY.metrics.maxDrawdown, {
        maxDrawdown: scenario.asset.maxDrawdown,
      }),
      value: `${scenario.asset.maxDrawdown}%`,
    },
    {
      Icon: Clock3,
      label: "전고점 아래",
      text: fillRegretCopyTemplate(BEAR_MARKET_PAIN_COPY.metrics.underATHMonths, {
        underATHMonths: scenario.underATHMonths,
      }),
      value: `${scenario.underATHMonths}개월`,
    },
    {
      Icon: ShieldAlert,
      label: "회복 대기",
      text: fillRegretCopyTemplate(BEAR_MARKET_PAIN_COPY.metrics.longestRecovery, {
        longestRecovery: scenario.longestRecovery,
      }),
      value: scenario.longestRecovery,
    },
    {
      Icon: Flame,
      label: "원금 침식",
      text: fillRegretCopyTemplate(BEAR_MARKET_PAIN_COPY.metrics.underPrincipal, {
        underPrincipal: scenario.underPrincipalMonths,
      }),
      value: `${scenario.underPrincipalMonths}개월`,
    },
  ];

  return (
    <LabSection eyebrow="BEAR MARKET PAIN" title={BEAR_MARKET_PAIN_COPY.title}>
      <p className="mt-3 text-[15px] font-semibold leading-6 text-slate-600">
        {fillRegretCopyTemplate(BEAR_MARKET_PAIN_COPY.summary, {
          underATHPercent: scenario.underATHPercent,
        })}
      </p>
      <div className="mt-5 grid gap-3">
        {metrics.map(({ Icon, label, text, value }) => (
          <div key={label} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <div className="text-[12px] font-black text-slate-500">{label}</div>
                  <div className="mt-1 text-[14px] font-bold leading-5 text-slate-800">{text}</div>
                </div>
              </div>
              <div className="shrink-0 text-right text-[22px] font-black tracking-[-0.06em] text-rose-600">
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[22px] bg-slate-950 p-4 text-sm font-bold leading-6 text-[#f8fafc]">
        전고점 아래와 원금 아래는 다릅니다. 이 화면은 둘을 섞지 않습니다. 전자는 마음의 피로,
        후자는 진짜 공포에 가깝습니다.
      </div>
    </LabSection>
  );
}

function TemptationDashboard({ asset }: { asset: LabAsset }) {
  const scenario = getScenario(asset);

  return (
    <LabSection eyebrow="BULL MARKET TEMPTATION" title={BULL_MARKET_TEMPTATION_COPY.title}>
      <p className="mt-3 text-[15px] font-semibold leading-6 text-slate-600">
        {BULL_MARKET_TEMPTATION_COPY.subtitle}
      </p>
      {scenario.milestones.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {scenario.milestones.map((milestone) => (
            <div
              key={milestone.multiple}
              className="rounded-[26px] border border-amber-200 bg-[linear-gradient(135deg,#fffbeb_0%,#ffffff_62%)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[12px] font-black text-amber-700">
                    처음으로 {milestone.multiple}배가 된 날
                  </div>
                  <div className="mt-1 text-[24px] font-black tracking-[-0.06em] text-slate-950">
                    {milestone.date}
                  </div>
                </div>
                <Pill tone="yellow">{formatKrw(milestone.valueAtMilestone)}</Pill>
              </div>
              <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
                {fillRegretCopyTemplate(BULL_MARKET_TEMPTATION_COPY.metrics.sellPointDetail, {
                  milestoneAmount: formatKrw(milestone.valueAtMilestone),
                  missedAmount: formatKrw(milestone.missedAmount),
                })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-600">
          이 종목은 아직 2배 지점에 닿지 못한 설정입니다. 여기서는 익절 유혹보다 버티기 고통이 먼저
          보입니다.
        </div>
      )}
    </LabSection>
  );
}

function EmotionMap({ asset }: { asset: LabAsset }) {
  const scenario = getScenario(asset);
  const toneByLabel: Record<EmotionMapLabelKey, string> = {
    ATH: "border-emerald-200 bg-emerald-50 text-emerald-700",
    FIRST_PROFIT: "border-blue-200 bg-blue-50 text-blue-700",
    HELL: "border-rose-200 bg-rose-50 text-rose-700",
    HYPER: "border-orange-200 bg-orange-50 text-orange-700",
    MILESTONE_2X: "border-amber-200 bg-amber-50 text-amber-700",
    RECOVERING: "border-cyan-200 bg-cyan-50 text-cyan-700",
    SHARP_DROP: "border-red-200 bg-red-50 text-red-700",
    SIDEWAYS: "border-slate-200 bg-slate-50 text-slate-600",
    TEMPTATION: "border-yellow-200 bg-yellow-50 text-yellow-700",
    UNDER_PRINCIPAL: "border-zinc-300 bg-zinc-100 text-zinc-800",
  };

  return (
    <LabSection eyebrow="MONTHLY EMOTION MAP" title="3. 한 달 한 달, 당신을 흔들었을 감정 지도">
      <p className="mt-3 text-[15px] font-semibold leading-6 text-slate-600">
        월별 데이터는 표가 아니라 감정 지도로 봅니다. 최종 수익률보다 어려운 건, 이 달들을 실제로
        지나가는 일이니까요.
      </p>
      <div className="mt-5 grid gap-3">
        {scenario.emotionMonths.map((month) => (
          <article key={`${month.date}-${month.label}`} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[12px] font-black text-slate-400">{month.date}</div>
                <div className="mt-1 text-lg font-black tracking-[-0.04em] text-slate-950">
                  {EMOTION_MAP_LABELS[month.label]}
                </div>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[12px] font-black ${toneByLabel[month.label]}`}>
                {formatSignedPercent(month.monthlyReturn)}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{month.note}</p>
          </article>
        ))}
      </div>
    </LabSection>
  );
}

function CriticalMoments({ asset }: { asset: LabAsset }) {
  const scenario = getScenario(asset);

  return (
    <div className="grid gap-4">
      <LabSection eyebrow="DARK MOMENTS" title={CRITICAL_MOMENTS_COPY.bearTop3Title}>
        <div className="mt-4 grid gap-3">
          {scenario.bearMoments.map((moment, index) => (
            <div key={`${moment.date}-${moment.dropPct}`} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[12px] font-black text-slate-500">{index + 1}위</div>
              <div className="mt-1 text-lg font-black tracking-[-0.04em] text-slate-950">{moment.date}</div>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                {fillRegretCopyTemplate(CRITICAL_MOMENTS_COPY.bearDetail, {
                  date: moment.date,
                  dropPct: `-${moment.dropPct}%`,
                  rank: index + 1,
                })}
              </p>
            </div>
          ))}
        </div>
      </LabSection>

      <LabSection eyebrow="SELL TOO EARLY" title={CRITICAL_MOMENTS_COPY.bullTop3Title}>
        <div className="mt-4 grid gap-3">
          {scenario.bullMoments.length > 0 ? (
            scenario.bullMoments.map((moment, index) => (
              <div key={`${moment.date}-${moment.multiple}`} className="rounded-[22px] border border-amber-200 bg-amber-50 p-4">
                <div className="text-[12px] font-black text-amber-700">{index + 1}위</div>
                <div className="mt-1 text-lg font-black tracking-[-0.04em] text-slate-950">
                  {moment.multiple}배 달성 · {moment.date}
                </div>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                  {fillRegretCopyTemplate(CRITICAL_MOMENTS_COPY.bullDetail, {
                    currentValue: formatKrw(moment.valueAtMilestone),
                    date: moment.date,
                    multiple: moment.multiple,
                    principal: formatKrw(INITIAL_PRINCIPAL),
                    rank: index + 1,
                  })}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-600">
              아직 익절 유혹보다 손실 공포가 더 큰 종목입니다. 이런 종목도 숨기지 않고 그대로 보여줘야
              합니다.
            </div>
          )}
        </div>
      </LabSection>
    </div>
  );
}

function NoiseNote({ asset }: { asset: LabAsset }) {
  const scenario = getScenario(asset);
  const year = asset.coverage === "ten_year" ? "2022" : asset.firstAvailableDate.slice(0, 4);

  return (
    <LabSection eyebrow="THE NOISE" title={NOISE_NOTE_COPY.title}>
      <p className="mt-3 text-[15px] font-semibold leading-6 text-slate-600">
        {fillRegretCopyTemplate(NOISE_NOTE_COPY.subtitle, { year })}
      </p>
      <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-950 p-5 text-[#f8fafc]">
        <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#94a3b8]">시장 분위기</div>
        <blockquote className="mt-3 text-[21px] font-black leading-8 tracking-[-0.05em]">
          “{scenario.noiseSummary}”
        </blockquote>
      </div>
      <p className="mt-4 text-sm font-bold leading-6 text-slate-700">{NOISE_NOTE_COPY.conclusion}</p>
    </LabSection>
  );
}

function Diagnosis() {
  const [answer, setAnswer] = useState<RealityDiagnosisOptionKey | null>(null);

  return (
    <LabSection eyebrow="REALITY CHECK" title="마지막 질문">
      <p className="mt-3 text-[18px] font-black leading-7 tracking-[-0.04em] text-slate-950">
        {USER_DIAGNOSIS_COPY.question}
      </p>
      <div className="mt-5 grid gap-2">
        {(Object.keys(USER_DIAGNOSIS_COPY.options) as RealityDiagnosisOptionKey[]).map((key) => (
          <button
            key={key}
            className={`rounded-[24px] border p-4 text-left text-sm font-black leading-6 transition ${
              answer === key
                ? "border-slate-950 bg-slate-950 text-[#f8fafc] shadow-[0_16px_30px_rgba(15,23,42,0.16)]"
                : "border-slate-200 bg-white text-slate-700"
            }`}
            onClick={() => setAnswer(key)}
            type="button"
          >
            {USER_DIAGNOSIS_COPY.options[key]}
          </button>
        ))}
      </div>
      {answer ? (
        <div className="mt-4 rounded-[26px] border border-blue-200 bg-blue-50 p-4">
          <div className="text-[12px] font-black text-blue-700">진단</div>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-800">{USER_DIAGNOSIS_COPY.feedback[answer]}</p>
          <button className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black text-[#f8fafc]" type="button">
            {USER_DIAGNOSIS_COPY.nextActionTitle}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </LabSection>
  );
}

function SearchTab({
  onRunAsset,
  selectedAsset,
}: {
  onRunAsset: (asset: LabAsset) => void;
  selectedAsset: LabAsset;
}) {
  const [assetTab, setAssetTab] = useState<AssetTab>("all");
  const [query, setQuery] = useState("");
  const [themeFilter, setThemeFilter] = useState("전체");
  const [focusedAsset, setFocusedAsset] = useState<LabAsset | null>(selectedAsset);

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return LAB_ASSETS.filter((asset) => {
      if (!getAssetTabMatch(asset, assetTab)) return false;
      if (themeFilter === "10년 가능" && asset.coverage !== "ten_year") return false;
      if (themeFilter === "상장일부터" && asset.coverage !== "listed_since") return false;
      if (
        themeFilter !== "전체" &&
        themeFilter !== "10년 가능" &&
        themeFilter !== "상장일부터" &&
        !asset.theme.toLowerCase().includes(themeFilter.toLowerCase()) &&
        !asset.groups.some((group) => group.toLowerCase().includes(themeFilter.toLowerCase()))
      ) {
        return false;
      }

      if (!normalizedQuery) return true;

      return [
        asset.name,
        asset.ticker,
        asset.theme,
        ...asset.groups,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [assetTab, query, themeFilter]);

  const activeDetail = focusedAsset ?? filteredAssets[0] ?? selectedAsset;

  return (
    <main className="px-4 pb-32 pt-5">
      <div className="mx-auto max-w-[520px]">
        <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.07)]">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">SEARCH</div>
          <h1 className="mt-2 text-[32px] font-black leading-[1.02] tracking-[-0.08em] text-slate-950">
            원하는 종목을 찾고,
            <br />
            직접 레이스를 돌립니다.
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            코스피, Nasdaq100, S&P500은 결과표가 아닙니다. 여기서는 수익률을 미리 까지 않고,
            레이스할 후보만 고릅니다.
          </p>
          <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              className="min-w-0 flex-1 bg-transparent text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="삼성전자, NVDA, 005930 검색"
              type="search"
              value={query}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ASSET_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-black transition ${
                assetTab === tab.id ? "border-slate-950 bg-slate-950 text-[#f8fafc]" : "border-slate-200 bg-white text-slate-500"
              }`}
              onClick={() => setAssetTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {THEME_FILTERS.map((filter) => (
            <button
              key={filter}
              className={`min-h-9 shrink-0 rounded-full border px-3 text-[12px] font-black transition ${
                themeFilter === filter ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500"
              }`}
              onClick={() => setThemeFilter(filter)}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          {filteredAssets.map((asset) => (
            <button
              key={asset.id}
              className={`rounded-[26px] border bg-white p-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition ${
                activeDetail.id === asset.id ? "border-slate-950" : "border-slate-200"
              }`}
              onClick={() => setFocusedAsset(asset)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: asset.accent }} />
                    <span className="text-lg font-black tracking-[-0.05em] text-slate-950">{asset.name}</span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-500">
                    {asset.ticker} · {asset.theme}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {asset.groups.map((group) => (
                      <Pill key={group}>{group}</Pill>
                    ))}
                    <Pill tone={asset.coverage === "ten_year" ? "green" : "yellow"}>{getCoverageLabel(asset)}</Pill>
                  </div>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300" />
              </div>
            </button>
          ))}
        </div>

        <div className="sticky bottom-[92px] mt-4 rounded-[30px] border border-slate-200 bg-white/95 p-4 shadow-[0_-16px_44px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[12px] font-black text-blue-600">선택한 종목</div>
              <div className="mt-1 text-xl font-black tracking-[-0.05em] text-slate-950">
                {activeDetail.name} <span className="text-slate-400">{activeDetail.ticker}</span>
              </div>
            </div>
            <Pill tone={activeDetail.coverage === "ten_year" ? "green" : "yellow"}>{getCoverageLabel(activeDetail)}</Pill>
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{activeDetail.description}</p>
          <button
            className="mt-4 min-h-12 w-full rounded-full bg-slate-950 px-5 text-sm font-black text-[#f8fafc]"
            onClick={() => onRunAsset(activeDetail)}
            type="button"
          >
            {activeDetail.coverage === "ten_year" ? "이 종목으로 레이스 보기" : "상장일부터 레이스 보기"}
          </button>
        </div>
      </div>
    </main>
  );
}

function HomeTab({ asset, onOpenSearch }: { asset: LabAsset; onOpenSearch: () => void }) {
  return (
    <main className="px-4 pb-32 pt-5">
      <div className="mx-auto grid max-w-[520px] gap-4">
        <ResultHero asset={asset} />
        <div className="grid grid-cols-2 gap-3">
          <button
            className="rounded-[26px] border border-blue-200 bg-blue-50 p-4 text-left"
            onClick={onOpenSearch}
            type="button"
          >
            <Search className="h-5 w-5 text-blue-600" />
            <div className="mt-3 text-lg font-black tracking-[-0.05em] text-slate-950">전체 종목 검색</div>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
              코스피 · Nasdaq100 · S&P500 방향의 공식 입구
            </p>
          </button>
          <div className="rounded-[26px] border border-slate-200 bg-white p-4">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <div className="mt-3 text-lg font-black tracking-[-0.05em] text-slate-950">오늘의 질문</div>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
              당신은 무서워서 팔았을까, 아까워서 팔았을까?
            </p>
          </div>
        </div>
        <PainDashboard asset={asset} />
        <TemptationDashboard asset={asset} />
        <EmotionMap asset={asset} />
        <CriticalMoments asset={asset} />
        <NoiseNote asset={asset} />
        <Diagnosis />
      </div>
    </main>
  );
}

function LiveTab({ onRunAsset }: { onRunAsset: (asset: LabAsset) => void }) {
  return (
    <main className="px-4 pb-32 pt-5">
      <div className="mx-auto max-w-[520px]">
        <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.07)]">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">LIVE</div>
          <h1 className="mt-2 text-[32px] font-black leading-[1.02] tracking-[-0.08em] text-slate-950">
            지금 사람들이
            <br />
            돌려보는 후회 레이스
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            라이브 탭은 읽는 곳이 아닙니다. 남들이 궁금해한 조합을 눌러 바로 레이스로 들어가는
            입구입니다.
          </p>
        </div>
        <div className="mt-4 grid gap-3">
          {LIVE_MATCHUPS.map((matchup, index) => {
            const asset = LAB_ASSETS.find((item) => item.id === matchup.assetId) ?? LAB_ASSETS[0]!;

            return (
              <button
                key={matchup.id}
                className="rounded-[28px] border border-slate-200 bg-white p-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                onClick={() => onRunAsset(asset)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-black text-blue-600">방금 전 #{index + 1}</div>
                    <div className="mt-1 text-xl font-black tracking-[-0.05em] text-slate-950">
                      {matchup.title}
                    </div>
                  </div>
                  <LineChart className="h-5 w-5 text-slate-300" />
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{matchup.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <Pill tone={asset.coverage === "ten_year" ? "green" : "yellow"}>{getCoverageLabel(asset)}</Pill>
                  <span className="text-sm font-black text-slate-950">나도 보기</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function SavedTab({ asset }: { asset: LabAsset }) {
  const scenario = getScenario(asset);

  return (
    <main className="px-4 pb-32 pt-5">
      <div className="mx-auto max-w-[520px]">
        <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.07)]">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">ARCHIVE</div>
          <h1 className="mt-2 text-[32px] font-black leading-[1.02] tracking-[-0.08em] text-slate-950">
            내가 본 고통을
            <br />
            다시 꺼내보는 곳
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            보관함은 단순 저장소가 아닙니다. 내가 언제 무너질 사람인지, 언제 너무 빨리 팔 사람인지
            다시 확인하는 기록장입니다.
          </p>
        </div>
        <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[12px] font-black text-slate-400">최근 저장한 레이스</div>
              <div className="mt-1 text-xl font-black tracking-[-0.05em] text-slate-950">
                {asset.name} · {scenario.coverageYears}
              </div>
            </div>
            <Bookmark className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[20px] bg-slate-50 p-3">
              <div className="text-[11px] font-black text-slate-400">최종 금액</div>
              <div className="mt-1 text-lg font-black tracking-[-0.05em] text-slate-950">
                {formatKrw(scenario.finalValue)}
              </div>
            </div>
            <div className="rounded-[20px] bg-rose-50 p-3">
              <div className="text-[11px] font-black text-rose-500">최대 하락</div>
              <div className="mt-1 text-lg font-black tracking-[-0.05em] text-rose-600">
                {asset.maxDrawdown}%
              </div>
            </div>
          </div>
          <button className="mt-4 min-h-12 w-full rounded-full bg-slate-950 px-5 text-sm font-black text-[#f8fafc]" type="button">
            저장 기능은 여기서 확장
          </button>
        </div>
      </div>
    </main>
  );
}

export function LongtermPainLab() {
  const [activeTab, setActiveTab] = useState<BottomTab>("home");
  const [selectedAssetId, setSelectedAssetId] = useState("nvda");
  const selectedAsset = LAB_ASSETS.find((asset) => asset.id === selectedAssetId) ?? LAB_ASSETS[0]!;

  function runAsset(asset: LabAsset) {
    setSelectedAssetId(asset.id);
    setActiveTab("home");
    window.scrollTo({ behavior: "smooth", top: 0 });
  }

  return (
    <div className="rz-light-app min-h-screen bg-[#eef4fb] text-slate-950">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.18),transparent_58%)]" />
      <div className="relative">
        {activeTab === "home" ? <HomeTab asset={selectedAsset} onOpenSearch={() => setActiveTab("search")} /> : null}
        {activeTab === "search" ? <SearchTab onRunAsset={runAsset} selectedAsset={selectedAsset} /> : null}
        {activeTab === "live" ? <LiveTab onRunAsset={runAsset} /> : null}
        {activeTab === "saved" ? <SavedTab asset={selectedAsset} /> : null}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
