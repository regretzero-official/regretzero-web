"use client";

import {
  Bookmark,
  ChevronRight,
  Clock3,
  Home,
  LineChart,
  Radio,
  Search,
  ShieldAlert,
  TrendingDown,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { RaceChart, type RaceChartAsset } from "@/components/home/race-chart";
import {
  DEFAULT_AMOUNT,
  assetCatalog,
  assetOrder,
  type ComparisonAssetId,
} from "@/lib/home-content";
import {
  buildRaceData,
  getRequestedDateRange,
  type MarketBundle,
  type RaceBuildResult,
  type RacePoint,
} from "@/lib/race-engine";
import type { HistoricalSeriesResponse, MarketDataTicker } from "@/lib/market-data";

type AssetTab = "all" | "kospi" | "nasdaq100" | "sp500" | "etf" | "coin";
type BottomTab = "home" | "search" | "live" | "saved";
type RaceStatus = "complete" | "idle" | "loading" | "racing";
type RealityAnswer = "buyMore" | "hold" | "sellEarly" | "sellFear";

interface LabAssetMeta {
  groups: string[];
  name: string;
  oneLiner: string;
  searchTerms: string[];
  theme: string;
  ticker: string;
}

interface PainMilestone {
  date: string;
  missedAmount: number;
  multiple: number;
  value: number;
}

interface EmotionMonth {
  date: string;
  label: string;
  note: string;
  tone: "danger" | "neutral" | "success" | "warning";
}

interface PainAnalysis {
  assetReturnPct: number;
  bankGap: number;
  bearMoments: Array<{ date: string; dropPct: number; value: number }>;
  emotionMonths: EmotionMonth[];
  finalValue: number;
  goldGap: number;
  longestRecoveryMonths: number;
  maxDrawdownDate: string;
  maxDrawdownPct: number;
  milestones: PainMilestone[];
  resolvedEndDate: string;
  resolvedStartDate: string;
  startValue: number;
  underATHMonths: number;
  underATHPercent: number;
  underPrincipalMonths: number;
}

const PRINCIPAL_KRW = DEFAULT_AMOUNT;
const RACE_DURATION_MS = 12_000;

const RACE_ASSET_IDS: ComparisonAssetId[] = ["deposit", "gold"];
const CURATED_ASSET_IDS: ComparisonAssetId[] = [
  "nvda",
  "aapl",
  "msft",
  "tsla",
  "googl",
  "meta",
  "amzn",
  "avgo",
  "amd",
  "soxx",
  "qqq",
  "spy",
  "voo",
  "btc",
  "eth",
  "005930",
  "000660",
  "005380",
  "000270",
  "012450",
  "034020",
  "035420",
  "035720",
  "068270",
  "207940",
  "005490",
  "105560",
  "055550",
  "033780",
  "028260",
  "003550",
  "069500",
  "360750",
  "brkb",
  "jpm",
  "jnj",
  "v",
  "ma",
  "cost",
  "pg",
  "ko",
  "xom",
];

const RACE_SHORT_LABELS: Record<string, string> = {
  "000270": "기아",
  "000660": "하이닉스",
  "003550": "LG",
  "005380": "현대차",
  "005490": "POSCO",
  "005930": "삼전",
  "012450": "한화",
  "028260": "물산",
  "033780": "KT&G",
  "034020": "두산",
  "035420": "NAVER",
  "035720": "카카오",
  "055550": "신한",
  "068270": "셀트리온",
  "069500": "KODEX",
  "105560": "KB",
  "207940": "삼바",
  "360750": "TIGER",
};

const ASSET_META: Record<string, LabAssetMeta> = {
  "000270": {
    groups: ["KOSPI"],
    name: "기아",
    oneLiner:
      "전기차와 SUV 흐름을 타며 한국 자동차 산업의 체력이 어떻게 평가받는지 보여주는 대표주입니다.",
    searchTerms: ["기아", "kia", "000270", "자동차"],
    theme: "자동차",
    ticker: "000270",
  },
  "000660": {
    groups: ["KOSPI"],
    name: "SK하이닉스",
    oneLiner:
      "AI 서버에 필요한 고대역폭 메모리 수요가 커질수록 투자자의 시선이 먼저 몰리는 반도체 핵심주입니다.",
    searchTerms: ["sk하이닉스", "하이닉스", "000660", "반도체"],
    theme: "반도체",
    ticker: "000660",
  },
  "003550": {
    groups: ["KOSPI"],
    name: "LG",
    oneLiner:
      "전자, 화학, 배터리 계열사를 묶어 보는 한국 대표 지주사라 시장 분위기를 넓게 읽기 좋습니다.",
    searchTerms: ["lg", "003550", "지주"],
    theme: "지주",
    ticker: "003550",
  },
  "005380": {
    groups: ["KOSPI"],
    name: "현대차",
    oneLiner:
      "전기차, 하이브리드, 글로벌 판매 사이클이 한꺼번에 반영되는 한국 자동차 대표주입니다.",
    searchTerms: ["현대차", "현대자동차", "005380", "자동차"],
    theme: "자동차",
    ticker: "005380",
  },
  "005490": {
    groups: ["KOSPI"],
    name: "POSCO홀딩스",
    oneLiner:
      "철강의 현금창출력과 2차전지 소재 기대가 함께 섞인 한국 소재 대표주입니다.",
    searchTerms: ["posco", "포스코", "005490", "소재"],
    theme: "소재",
    ticker: "005490",
  },
  "005930": {
    groups: ["KOSPI"],
    name: "삼성전자",
    oneLiner:
      "메모리, 파운드리, 스마트기기까지 연결된 한국 주식시장의 가장 익숙한 기준점입니다.",
    searchTerms: ["삼성전자", "삼성", "005930", "반도체"],
    theme: "반도체",
    ticker: "005930",
  },
  "012450": {
    groups: ["KOSPI"],
    name: "한화에어로스페이스",
    oneLiner:
      "방산 수출과 우주항공 기대가 겹치며 최근 한국 성장주 관심을 강하게 끄는 종목입니다.",
    searchTerms: ["한화에어로스페이스", "한화에어로", "012450", "방산"],
    theme: "방산",
    ticker: "012450",
  },
  "028260": {
    groups: ["KOSPI"],
    name: "삼성물산",
    oneLiner:
      "건설, 상사, 바이오 지분 가치가 함께 움직이는 삼성그룹 대표 지주 성격의 종목입니다.",
    searchTerms: ["삼성물산", "028260", "지주"],
    theme: "지주",
    ticker: "028260",
  },
  "033780": {
    groups: ["KOSPI"],
    name: "KT&G",
    oneLiner:
      "큰 폭의 성장보다 꾸준한 현금흐름과 배당 매력을 보고 접근하는 한국 소비재 대표주입니다.",
    searchTerms: ["kt&g", "케이티앤지", "033780", "배당"],
    theme: "소비재",
    ticker: "033780",
  },
  "034020": {
    groups: ["KOSPI"],
    name: "두산에너빌리티",
    oneLiner:
      "원전과 에너지 설비 기대가 커질 때 한국 산업재에서 가장 먼저 언급되는 종목 중 하나입니다.",
    searchTerms: ["두산에너빌리티", "두산", "034020", "원전"],
    theme: "에너지",
    ticker: "034020",
  },
  "035420": {
    groups: ["KOSPI"],
    name: "NAVER",
    oneLiner:
      "검색, 커머스, 콘텐츠, AI가 한 회사 안에 묶인 한국 인터넷 플랫폼의 대표 선수입니다.",
    searchTerms: ["네이버", "naver", "035420", "플랫폼"],
    theme: "플랫폼",
    ticker: "035420",
  },
  "035720": {
    groups: ["KOSPI"],
    name: "카카오",
    oneLiner:
      "국민 메신저에서 금융, 콘텐츠까지 확장한 플랫폼 기업이 기대와 실망을 어떻게 오가는지 보여줍니다.",
    searchTerms: ["카카오", "kakao", "035720", "플랫폼"],
    theme: "플랫폼",
    ticker: "035720",
  },
  "055550": {
    groups: ["KOSPI"],
    name: "신한지주",
    oneLiner:
      "금리와 경기 흐름에 따라 은행주의 안정성과 한계를 함께 보여주는 금융 대표주입니다.",
    searchTerms: ["신한지주", "신한", "055550", "금융"],
    theme: "금융",
    ticker: "055550",
  },
  "068270": {
    groups: ["KOSPI"],
    name: "셀트리온",
    oneLiner:
      "바이오시밀러 기대가 커질 때 한국 바이오 투자심리가 얼마나 뜨겁고 차가워지는지 보여줍니다.",
    searchTerms: ["셀트리온", "068270", "바이오"],
    theme: "바이오",
    ticker: "068270",
  },
  "069500": {
    groups: ["ETF", "KOSPI"],
    name: "KODEX 200",
    oneLiner:
      "한국 대표 기업 묶음을 한 번에 사는 ETF라 코스피 장기투자의 체감을 보기 좋습니다.",
    searchTerms: ["kodex 200", "코덱스200", "069500", "코스피 etf"],
    theme: "한국지수 ETF",
    ticker: "069500",
  },
  "105560": {
    groups: ["KOSPI"],
    name: "KB금융",
    oneLiner:
      "은행, 카드, 증권, 보험을 묶어 금리와 배당 기대를 함께 보는 한국 금융 대표주입니다.",
    searchTerms: ["kb금융", "국민은행", "105560", "금융"],
    theme: "금융",
    ticker: "105560",
  },
  "207940": {
    groups: ["KOSPI"],
    name: "삼성바이오로직스",
    oneLiner:
      "글로벌 의약품 생산 수요가 커질수록 한국 바이오 대형주의 프리미엄을 대표하는 종목입니다.",
    searchTerms: ["삼성바이오로직스", "삼바", "207940", "바이오"],
    theme: "바이오",
    ticker: "207940",
  },
  "360750": {
    groups: ["ETF", "KOSPI", "S&P500"],
    name: "TIGER 미국S&P500",
    oneLiner:
      "원화로 미국 대표 기업에 접근하는 ETF라 한국 투자자가 가장 쉽게 미국 장기투자를 체감할 수 있습니다.",
    searchTerms: ["tiger 미국s&p500", "360750", "미국 etf", "s&p500"],
    theme: "미국지수 ETF",
    ticker: "360750",
  },
  aapl: {
    groups: ["Nasdaq100", "S&P500"],
    name: "애플",
    oneLiner:
      "아이폰이라는 일상적 제품이 거대한 현금흐름과 브랜드 충성도로 바뀌는 힘을 보여줍니다.",
    searchTerms: ["애플", "apple", "aapl"],
    theme: "빅테크",
    ticker: "AAPL",
  },
  amd: {
    groups: ["Nasdaq100", "S&P500"],
    name: "AMD",
    oneLiner:
      "반도체 경쟁 구도가 바뀔 때 후발주자가 얼마나 극적으로 재평가될 수 있는지 보여줍니다.",
    searchTerms: ["amd", "반도체"],
    theme: "반도체",
    ticker: "AMD",
  },
  amzn: {
    groups: ["Nasdaq100", "S&P500"],
    name: "아마존",
    oneLiner:
      "쇼핑 회사처럼 보이지만 클라우드와 물류 체계가 결합된 거대한 현금흐름 기업입니다.",
    searchTerms: ["아마존", "amazon", "amzn", "aws"],
    theme: "클라우드",
    ticker: "AMZN",
  },
  avgo: {
    groups: ["Nasdaq100", "S&P500"],
    name: "브로드컴",
    oneLiner:
      "AI 인프라와 네트워크 반도체가 커질수록 조용히 같이 언급되는 고수익 반도체 기업입니다.",
    searchTerms: ["브로드컴", "broadcom", "avgo"],
    theme: "반도체",
    ticker: "AVGO",
  },
  brkb: {
    groups: ["S&P500"],
    name: "버크셔 해서웨이",
    oneLiner:
      "화려한 기술주가 아니어도 긴 시간 자본 배분이 얼마나 강한 결과를 만들 수 있는지 보여줍니다.",
    searchTerms: ["버크셔", "berkshire", "brkb", "버핏"],
    theme: "복합 지주",
    ticker: "BRK.B",
  },
  btc: {
    groups: ["Coin"],
    name: "비트코인",
    oneLiner:
      "누구도 마음대로 찍어낼 수 없는 희소성에 투자한다는 아이디어가 시장에서 어떻게 가격이 되는지 보여줍니다.",
    searchTerms: ["비트코인", "bitcoin", "btc"],
    theme: "희소 자산",
    ticker: "BTC",
  },
  cost: {
    groups: ["Nasdaq100", "S&P500"],
    name: "코스트코",
    oneLiner:
      "화려한 기술보다 멤버십과 가격 신뢰가 얼마나 강한 사업 모델이 되는지 보여주는 소비재 대표주입니다.",
    searchTerms: ["코스트코", "costco", "cost"],
    theme: "소비재",
    ticker: "COST",
  },
  eth: {
    groups: ["Coin"],
    name: "이더리움",
    oneLiner:
      "디지털 자산이 단순 보관 수단을 넘어 앱과 금융 인프라의 바닥이 될 수 있다는 실험입니다.",
    searchTerms: ["이더리움", "ethereum", "eth"],
    theme: "스마트계약",
    ticker: "ETH",
  },
  googl: {
    groups: ["Nasdaq100", "S&P500"],
    name: "알파벳",
    oneLiner:
      "검색 광고라는 강력한 현금흐름 위에 유튜브, 클라우드, AI 기대가 얹힌 기업입니다.",
    searchTerms: ["알파벳", "구글", "google", "googl"],
    theme: "빅테크",
    ticker: "GOOGL",
  },
  jnj: {
    groups: ["S&P500"],
    name: "존슨앤드존슨",
    oneLiner:
      "경기와 유행이 바뀌어도 헬스케어 수요가 쉽게 사라지지 않는다는 방어적 성격을 보여줍니다.",
    searchTerms: ["존슨앤드존슨", "jnj", "헬스케어"],
    theme: "헬스케어",
    ticker: "JNJ",
  },
  jpm: {
    groups: ["S&P500"],
    name: "JP모건",
    oneLiner:
      "금리, 경기, 금융 시스템에 대한 시장의 믿음이 대형 은행 주가에 어떻게 녹아드는지 보여줍니다.",
    searchTerms: ["jp모건", "jpmorgan", "jpm", "은행"],
    theme: "금융",
    ticker: "JPM",
  },
  ko: {
    groups: ["S&P500"],
    name: "코카콜라",
    oneLiner:
      "성장이 느려 보여도 브랜드와 유통망이 긴 시간 얼마나 질긴 현금흐름을 만드는지 보여줍니다.",
    searchTerms: ["코카콜라", "coca cola", "ko"],
    theme: "소비재",
    ticker: "KO",
  },
  ma: {
    groups: ["S&P500"],
    name: "마스터카드",
    oneLiner:
      "사람들이 돈을 쓸 때마다 결제망이 수수료를 얻는 구조가 얼마나 강한지 보여주는 기업입니다.",
    searchTerms: ["마스터카드", "mastercard", "ma"],
    theme: "결제",
    ticker: "MA",
  },
  meta: {
    groups: ["Nasdaq100", "S&P500"],
    name: "메타",
    oneLiner:
      "사람들의 시간을 붙잡는 플랫폼이 광고와 AI 투자로 다시 평가받는 과정을 보여줍니다.",
    searchTerms: ["메타", "meta", "facebook", "instagram"],
    theme: "플랫폼",
    ticker: "META",
  },
  msft: {
    groups: ["Nasdaq100", "S&P500"],
    name: "마이크로소프트",
    oneLiner:
      "오래된 소프트웨어 회사가 클라우드와 AI를 만나 다시 성장주로 평가받은 사례입니다.",
    searchTerms: ["마이크로소프트", "microsoft", "msft"],
    theme: "클라우드",
    ticker: "MSFT",
  },
  nvda: {
    groups: ["Nasdaq100", "S&P500"],
    name: "엔비디아",
    oneLiner:
      "AI 시대에 모두가 필요한 장비를 파는 회사가 되면서 시장의 상상력을 가장 세게 자극한 종목입니다.",
    searchTerms: ["엔비디아", "nvidia", "nvda", "ai"],
    theme: "AI 반도체",
    ticker: "NVDA",
  },
  pg: {
    groups: ["S&P500"],
    name: "P&G",
    oneLiner:
      "매일 쓰는 생활용품이 얼마나 안정적인 장기 현금흐름이 될 수 있는지 보여주는 방어주입니다.",
    searchTerms: ["p&g", "피앤지", "pg", "생활용품"],
    theme: "소비재",
    ticker: "PG",
  },
  qqq: {
    groups: ["ETF", "Nasdaq100"],
    name: "QQQ",
    oneLiner:
      "나스닥 대표 기업들을 한 번에 담아 기술주 장기투자의 기복과 보상을 동시에 보여주는 ETF입니다.",
    searchTerms: ["qqq", "나스닥", "나스닥100", "etf"],
    theme: "미국지수 ETF",
    ticker: "QQQ",
  },
  soxx: {
    groups: ["ETF", "Nasdaq100"],
    name: "SOXX",
    oneLiner:
      "AI, 서버, 스마트기기 수요가 반도체 산업 전체를 어떻게 흔드는지 한 번에 볼 수 있는 ETF입니다.",
    searchTerms: ["soxx", "반도체 etf", "미국 반도체"],
    theme: "반도체 ETF",
    ticker: "SOXX",
  },
  spy: {
    groups: ["ETF", "S&P500"],
    name: "SPY",
    oneLiner:
      "미국 대표 기업 전체에 분산 투자하는 가장 익숙한 출발점입니다.",
    searchTerms: ["spy", "s&p500", "미국지수", "etf"],
    theme: "미국지수 ETF",
    ticker: "SPY",
  },
  tsla: {
    groups: ["Nasdaq100", "S&P500"],
    name: "테슬라",
    oneLiner:
      "전기차 회사인지, 에너지 회사인지, AI 회사인지에 따라 기대와 실망이 크게 흔들리는 종목입니다.",
    searchTerms: ["테슬라", "tesla", "tsla", "전기차"],
    theme: "전기차",
    ticker: "TSLA",
  },
  v: {
    groups: ["S&P500"],
    name: "비자",
    oneLiner:
      "현금을 덜 쓰고 카드와 디지털 결제가 늘수록 조용히 수수료를 쌓는 결제 네트워크입니다.",
    searchTerms: ["비자", "visa", "v", "결제"],
    theme: "결제",
    ticker: "V",
  },
  voo: {
    groups: ["ETF", "S&P500"],
    name: "VOO",
    oneLiner:
      "낮은 비용으로 S&P500에 장기투자하는 가장 단순한 방법 중 하나입니다.",
    searchTerms: ["voo", "s&p500", "미국 etf"],
    theme: "미국지수 ETF",
    ticker: "VOO",
  },
  xom: {
    groups: ["S&P500"],
    name: "엑슨모빌",
    oneLiner:
      "유가와 에너지 사이클이 오래된 산업 기업의 주가를 얼마나 크게 흔드는지 보여줍니다.",
    searchTerms: ["엑슨모빌", "exxon", "xom", "에너지"],
    theme: "에너지",
    ticker: "XOM",
  },
};

const TAB_OPTIONS: Array<{ id: AssetTab; label: string }> = [
  { id: "all", label: "전체" },
  { id: "kospi", label: "코스피" },
  { id: "nasdaq100", label: "나스닥100" },
  { id: "sp500", label: "S&P500" },
  { id: "etf", label: "ETF" },
  { id: "coin", label: "코인" },
];

const BOTTOM_TABS: Array<{ icon: typeof Home; id: BottomTab; label: string }> = [
  { icon: Home, id: "home", label: "홈" },
  { icon: Search, id: "search", label: "검색" },
  { icon: Radio, id: "live", label: "라이브" },
  { icon: Bookmark, id: "saved", label: "보관함" },
];

const REALITY_FEEDBACK: Record<RealityAnswer, string> = {
  buyMore:
    "그 답을 실제 계좌에서 해냈다면 이미 상위권입니다. 다만 하락의 끝이 보이지 않을 때 더 사는 일은 지식보다 고독을 견디는 일에 가깝습니다.",
  hold:
    "말은 쉽지만, 실제 계좌에서 수천만 원이 사라질 때는 손가락이 먼저 매도 버튼으로 갑니다. 그래서 의지가 아니라 구조가 필요합니다.",
  sellEarly:
    "핵심을 짚었습니다. 많은 사람은 폭락보다 작은 성공을 못 견딥니다. 눈앞의 수익을 확정하려다 더 큰 시간을 팔아버립니다.",
  sellFear:
    "정직한 답입니다. 인간은 손실을 피하도록 설계되어 있습니다. 장기투자가 어려운 건 의지가 약해서가 아니라 본능을 거스르기 때문입니다.",
};

function getMeta(assetId: ComparisonAssetId): LabAssetMeta {
  const asset = assetCatalog[assetId];
  const fallbackName = asset?.label ?? assetId.toUpperCase();

  return (
    ASSET_META[assetId] ?? {
      groups: ["기타"],
      name: fallbackName,
      oneLiner:
        "실제 과거 데이터를 먼저 달려보고, 그 시간이 어떤 감정으로 버텨졌을지 확인해 볼 자산입니다.",
      searchTerms: [assetId, fallbackName],
      theme: "기타",
      ticker: asset?.marketTicker ?? assetId.toUpperCase(),
    }
  );
}

function getRaceShortLabel(assetId: ComparisonAssetId, meta: LabAssetMeta) {
  return RACE_SHORT_LABELS[assetId] ?? meta.ticker;
}

function getLabAssetIds() {
  const curated = CURATED_ASSET_IDS.filter((assetId) => ASSET_META[assetId]);
  const extra = assetOrder.filter((assetId) => {
    if (curated.includes(assetId)) {
      return false;
    }

    const asset = assetCatalog[assetId];
    return Boolean(asset?.isAvailable && asset.marketTicker);
  });

  return [...curated, ...extra];
}

function isSyntheticAsset(assetId: ComparisonAssetId) {
  return assetId === "deposit";
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
    throw new Error("error" in payload && payload.error ? payload.error : "과거 데이터를 불러오지 못했습니다.");
  }

  return payload as HistoricalSeriesResponse;
}

async function loadRaceBuild(assetId: ComparisonAssetId) {
  const selectedAsset = assetCatalog[assetId];

  if (!selectedAsset?.isAvailable || !selectedAsset.marketTicker) {
    throw new Error("아직 실제 데이터 레이스를 지원하지 않는 자산입니다.");
  }

  const dateRange = getRequestedDateRange();
  const assetIds = [assetId, ...RACE_ASSET_IDS];
  const seriesByAsset: MarketBundle["seriesByAsset"] = {};
  const fetchableAssetIds = assetIds.filter((item) => !isSyntheticAsset(item));

  const seriesEntries = await Promise.all(
    fetchableAssetIds.map(async (item) => {
      const ticker = assetCatalog[item]?.marketTicker;
      if (!ticker) {
        return null;
      }

      return [item, await requestHistoricalSeries(ticker, dateRange.start, dateRange.end)] as const;
    }),
  );

  for (const entry of seriesEntries) {
    if (entry) {
      seriesByAsset[entry[0]] = entry[1];
    }
  }

  const needsUsdFx = assetIds.some((item) => assetCatalog[item]?.usesUsdFx);
  const usdkrw = needsUsdFx
    ? await requestHistoricalSeries("USDKRW", dateRange.start, dateRange.end)
    : null;

  const bundle: MarketBundle = {
    seriesByAsset,
    source: "live",
    usdkrw,
  };

  return buildRaceData(assetIds, bundle, PRINCIPAL_KRW, dateRange.start, dateRange.end, "monthly");
}

function formatKrw(value: number) {
  if (!Number.isFinite(value)) {
    return "0원";
  }

  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(Math.round(value));

  if (absolute >= 100_000_000) {
    const eok = Math.floor(absolute / 100_000_000);
    const man = Math.floor((absolute % 100_000_000) / 10_000);
    return `${sign}${eok}억${man > 0 ? ` ${man.toLocaleString("ko-KR")}만원` : ""}`;
  }

  if (absolute >= 10_000) {
    return `${sign}${Math.floor(absolute / 10_000).toLocaleString("ko-KR")}만원`;
  }

  return `${sign}${absolute.toLocaleString("ko-KR")}원`;
}

function formatPct(value: number) {
  if (!Number.isFinite(value)) {
    return "0.0%";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatMonth(date: string) {
  return date.slice(0, 7).replace("-", ".");
}

function formatDateRange(start: string, end: string) {
  return `${formatMonth(start)} - ${formatMonth(end)}`;
}

function getValue(point: RacePoint, assetId: ComparisonAssetId) {
  return Number(point[assetId] ?? 0);
}

function buildPainAnalysis(build: RaceBuildResult, assetId: ComparisonAssetId): PainAnalysis | null {
  if (build.points.length < 2) {
    return null;
  }

  const points = build.points;
  const startPoint = points[0]!;
  const finalPoint = points[points.length - 1]!;
  const startValue = getValue(startPoint, assetId);
  const finalValue = getValue(finalPoint, assetId);
  let peak = startValue;
  let maxDrawdownPct = 0;
  let maxDrawdownDate = startPoint.date;
  let underATHMonths = 0;
  let underPrincipalMonths = 0;
  let currentUnderATHStreak = 0;
  let longestRecoveryMonths = 0;
  const monthlyDrops: Array<{ date: string; dropPct: number; value: number }> = [];

  points.forEach((point, index) => {
    const value = getValue(point, assetId);

    if (value >= peak) {
      peak = value;
      longestRecoveryMonths = Math.max(longestRecoveryMonths, currentUnderATHStreak);
      currentUnderATHStreak = 0;
    } else {
      underATHMonths += 1;
      currentUnderATHStreak += 1;
    }

    if (value < startValue) {
      underPrincipalMonths += 1;
    }

    const drawdownPct = peak > 0 ? (value / peak - 1) * 100 : 0;
    if (drawdownPct < maxDrawdownPct) {
      maxDrawdownPct = drawdownPct;
      maxDrawdownDate = point.date;
    }

    if (index > 0) {
      const previous = getValue(points[index - 1]!, assetId);
      const dropPct = previous > 0 ? (value / previous - 1) * 100 : 0;
      monthlyDrops.push({ date: point.date, dropPct, value });
    }
  });

  longestRecoveryMonths = Math.max(longestRecoveryMonths, currentUnderATHStreak);

  const milestones = [2, 5, 10, 20]
    .map((multiple): PainMilestone | null => {
      const point = points.find((item) => getValue(item, assetId) >= startValue * multiple);
      if (!point) {
        return null;
      }

      const value = getValue(point, assetId);
      return {
        date: point.date,
        missedAmount: Math.max(0, finalValue - value),
        multiple,
        value,
      };
    })
    .filter((item): item is PainMilestone => Boolean(item));

  const worstDrops = [...monthlyDrops].sort((left, right) => left.dropPct - right.dropPct).slice(0, 3);
  const firstProfitPoint = points.find((point) => getValue(point, assetId) >= startValue * 1.1);
  const first2xPoint = milestones.find((item) => item.multiple === 2);
  const finalReturnPct = startValue > 0 ? (finalValue / startValue - 1) * 100 : 0;
  const emotionMonths: EmotionMonth[] = [
    ...worstDrops.slice(0, 2).map((item) => ({
      date: item.date,
      label: item.dropPct <= -20 ? "패닉" : "급락",
      note: `한 달 수익률이 ${formatPct(item.dropPct)}까지 밀렸습니다. 지나고 보면 점 하나지만, 당시에는 계좌 앱을 여는 것 자체가 고통이었을 달입니다.`,
      tone: "danger" as const,
    })),
  ];

  if (underPrincipalMonths > 0) {
    const underPrincipalPoint = points.find((point) => getValue(point, assetId) < startValue);
    if (underPrincipalPoint) {
      emotionMonths.push({
        date: underPrincipalPoint.date,
        label: "원금 침식",
        note: "처음 넣은 돈보다 평가금액이 작아졌습니다. 이때 장기투자라는 말은 갑자기 멋진 말이 아니라 버거운 숙제가 됩니다.",
        tone: "warning",
      });
    }
  }

  if (firstProfitPoint) {
    emotionMonths.push({
      date: firstProfitPoint.date,
      label: "첫 수익",
      note: "처음으로 꽤 오른 것처럼 보이는 구간입니다. 이때부터 매도 버튼은 조용히, 하지만 집요하게 눈에 들어옵니다.",
      tone: "success",
    });
  }

  if (first2xPoint) {
    emotionMonths.push({
      date: first2xPoint.date,
      label: "2배 돌파",
      note: "원금이 두 배가 된 순간입니다. 많은 사람은 여기서 천재가 된 기분을 느끼고, 더 큰 시간을 팔아버립니다.",
      tone: "success",
    });
  }

  emotionMonths.push({
    date: finalPoint.date,
    label: "현재",
    note: `결국 ${formatPct(finalReturnPct)}의 결과가 남았습니다. 문제는 이 숫자가 아니라, 이 숫자까지 오는 시간을 버틸 수 있었느냐입니다.`,
    tone: "neutral",
  });

  return {
    assetReturnPct: finalReturnPct,
    bankGap: finalValue - getValue(finalPoint, "deposit"),
    bearMoments: worstDrops,
    emotionMonths,
    finalValue,
    goldGap: finalValue - getValue(finalPoint, "gold"),
    longestRecoveryMonths,
    maxDrawdownDate,
    maxDrawdownPct,
    milestones,
    resolvedEndDate: build.resolvedEndDate,
    resolvedStartDate: build.resolvedStartDate,
    startValue,
    underATHMonths,
    underATHPercent: Math.round((underATHMonths / points.length) * 100),
    underPrincipalMonths,
  };
}

function filterAssetByTab(meta: LabAssetMeta, activeTab: AssetTab) {
  if (activeTab === "all") {
    return true;
  }

  if (activeTab === "kospi") {
    return meta.groups.includes("KOSPI");
  }

  if (activeTab === "nasdaq100") {
    return meta.groups.includes("Nasdaq100");
  }

  if (activeTab === "sp500") {
    return meta.groups.includes("S&P500");
  }

  if (activeTab === "etf") {
    return meta.groups.includes("ETF");
  }

  return meta.groups.includes("Coin");
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function AssetBadge({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">
      {children}
    </span>
  );
}

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${className}`}>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  warning,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className={`rounded-[22px] border px-4 py-4 ${warning ? "border-rose-100 bg-rose-50" : "border-slate-200 bg-slate-50"}`}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={`mt-2 text-xl font-black tracking-[-0.05em] ${warning ? "text-rose-600" : "text-slate-950"}`}>
        {value}
      </div>
    </div>
  );
}

export function LongtermPainLab() {
  const raceSectionRef = useRef<HTMLDivElement | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>("home");
  const [assetTab, setAssetTab] = useState<AssetTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<ComparisonAssetId>("nvda");
  const [searchSelectedAssetId, setSearchSelectedAssetId] = useState<ComparisonAssetId>("nvda");
  const [raceBuild, setRaceBuild] = useState<RaceBuildResult | null>(null);
  const [raceError, setRaceError] = useState("");
  const [raceStatus, setRaceStatus] = useState<RaceStatus>("idle");
  const [visibleCount, setVisibleCount] = useState(0);
  const [realityAnswer, setRealityAnswer] = useState<RealityAnswer | null>(null);
  const [lastCompletedAssetId, setLastCompletedAssetId] = useState<ComparisonAssetId | null>(null);

  const selectedMeta = getMeta(selectedAssetId);
  const currentPoint = raceBuild?.points[Math.max(0, visibleCount - 1)] ?? null;
  const visibleData = raceBuild ? raceBuild.points.slice(0, Math.max(1, visibleCount)) : [];
  const raceAssets = useMemo<RaceChartAsset[]>(
    () => [
      {
        id: selectedAssetId,
        label: selectedMeta.name,
        shortLabel: getRaceShortLabel(selectedAssetId, selectedMeta),
      },
      { id: "deposit", label: "정기예금", shortLabel: "예금" },
      { id: "gold", label: "금", shortLabel: "금" },
    ],
    [selectedAssetId, selectedMeta],
  );
  const analysis = useMemo(
    () => (raceBuild ? buildPainAnalysis(raceBuild, selectedAssetId) : null),
    [raceBuild, selectedAssetId],
  );

  const startRace = useCallback(
    async (assetId?: ComparisonAssetId) => {
      const nextAssetId = assetId ?? selectedAssetId;
      setActiveBottomTab("home");
      setSelectedAssetId(nextAssetId);
      setSearchSelectedAssetId(nextAssetId);
      setRaceBuild(null);
      setRaceError("");
      setRaceStatus("loading");
      setVisibleCount(0);
      setRealityAnswer(null);

      window.requestAnimationFrame(() => {
        raceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      try {
        const build = await loadRaceBuild(nextAssetId);
        setRaceBuild(build);
        setVisibleCount(1);
        setRaceStatus("racing");
      } catch (error) {
        setRaceStatus("idle");
        setRaceError(error instanceof Error ? error.message : "레이스를 시작하지 못했습니다.");
      }
    },
    [selectedAssetId],
  );

  useEffect(() => {
    if (raceStatus !== "racing" || !raceBuild) {
      return;
    }

    let frameId = 0;
    const startedAt = performance.now();

    const tick = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startedAt) / RACE_DURATION_MS);
      const nextCount = Math.max(1, Math.ceil(raceBuild.points.length * progress));
      setVisibleCount(nextCount);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      setVisibleCount(raceBuild.points.length);
      setRaceStatus("complete");
      setLastCompletedAssetId(selectedAssetId);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [raceBuild, raceStatus, selectedAssetId]);

  const labAssetIds = useMemo(() => getLabAssetIds(), []);
  const filteredAssets = useMemo(() => {
    const query = normalizeSearch(searchQuery);

    return labAssetIds
      .map((assetId) => ({ assetId, meta: getMeta(assetId) }))
      .filter(({ meta }) => filterAssetByTab(meta, assetTab))
      .filter(({ meta }) => {
        if (!query) {
          return true;
        }

        return [meta.name, meta.ticker, meta.theme, ...meta.searchTerms]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .slice(0, 80);
  }, [assetTab, labAssetIds, searchQuery]);

  return (
    <div className="rz-light-app min-h-screen bg-[#eef5ff] text-slate-950">
      <main className="mx-auto min-h-screen w-full max-w-[520px] px-4 pb-28 pt-5">
        {activeBottomTab === "home" ? (
          <div className="space-y-5">
            <Header />
            <Hero
              onOpenSearch={() => setActiveBottomTab("search")}
              onStart={() => void startRace()}
              selectedMeta={selectedMeta}
            />
            {raceError ? (
              <div className="rounded-[24px] border border-rose-200 bg-white px-4 py-4 text-sm font-semibold leading-6 text-rose-600">
                {raceError}
              </div>
            ) : null}
            <div ref={raceSectionRef}>
              {raceStatus === "idle" ? (
                <EmptyRaceGuide onOpenSearch={() => setActiveBottomTab("search")} />
              ) : (
                <RaceStage
                  analysis={analysis}
                  currentPoint={currentPoint}
                  onAnswer={setRealityAnswer}
                  onOpenSearch={() => setActiveBottomTab("search")}
                  onRestart={() => void startRace(selectedAssetId)}
                  raceAssets={raceAssets}
                  raceBuild={raceBuild}
                  raceStatus={raceStatus}
                  realityAnswer={realityAnswer}
                  selectedMeta={selectedMeta}
                  visibleData={visibleData}
                />
              )}
            </div>
          </div>
        ) : null}

        {activeBottomTab === "search" ? (
          <AssetSearch
            activeTab={assetTab}
            assets={filteredAssets}
            onSelectAsset={setSearchSelectedAssetId}
            onStartRace={(assetId) => void startRace(assetId)}
            query={searchQuery}
            selectedAssetId={searchSelectedAssetId}
            setActiveTab={setAssetTab}
            setQuery={setSearchQuery}
          />
        ) : null}

        {activeBottomTab === "live" ? <LiveIdeas onStartRace={(assetId) => void startRace(assetId)} /> : null}

        {activeBottomTab === "saved" ? (
          <SavedView
            analysis={analysis}
            lastCompletedAssetId={lastCompletedAssetId}
            onStartRace={(assetId) => void startRace(assetId)}
          />
        ) : null}
      </main>

      <BottomNavigation activeTab={activeBottomTab} onChange={setActiveBottomTab} />
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-black tracking-[-0.03em] text-slate-950">RegretZero</div>
        <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
          Long-term reality lab
        </div>
      </div>
      <div className="rounded-full border border-white bg-white/70 px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">
        실제 데이터
      </div>
    </header>
  );
}

function Hero({
  onOpenSearch,
  onStart,
  selectedMeta,
}: {
  onOpenSearch: () => void;
  onStart: () => void;
  selectedMeta: LabAssetMeta;
}) {
  return (
    <SectionCard className="overflow-hidden">
      <div className="text-[12px] font-black uppercase tracking-[0.24em] text-blue-500">START</div>
      <h1 className="mt-3 text-[2.3rem] font-black leading-[1.02] tracking-[-0.09em] text-slate-950">
        10년 전 샀다면,
        <br />
        나는 끝까지 버텼을까요?
      </h1>
      <p className="mt-4 text-[15px] font-semibold leading-7 text-slate-600">
        수익률 숫자만 보면 쉬워 보입니다. 하지만 진짜 문제는 그 돈이 만들어지는
        시간을 온전히 살아내는 일입니다.
      </p>

      <div className="mt-6 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">오늘의 첫 레이스</div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-black tracking-[-0.06em] text-slate-950">
              {selectedMeta.name}
            </div>
            <div className="mt-1 text-sm font-bold text-slate-500">
              {selectedMeta.ticker} · {selectedMeta.theme}
            </div>
          </div>
          <button
            className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
            onClick={onOpenSearch}
            type="button"
          >
            종목 바꾸기
          </button>
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">{selectedMeta.oneLiner}</p>
      </div>

      <button
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-[22px] bg-slate-950 px-5 py-4 text-[15px] font-black text-[#f8fafc] shadow-[0_18px_38px_rgba(15,23,42,0.22)]"
        onClick={onStart}
        type="button"
      >
        1,000만원으로 차트레이스 시작
        <ChevronRight size={18} />
      </button>
    </SectionCard>
  );
}

function EmptyRaceGuide({ onOpenSearch }: { onOpenSearch: () => void }) {
  return (
    <SectionCard>
      <div className="flex items-center gap-2 text-sm font-black text-slate-500">
        <LineChart size={17} />
        아직 결과는 없습니다
      </div>
      <p className="mt-3 text-lg font-black leading-7 tracking-[-0.05em] text-slate-950">
        먼저 레이스를 돌려야 숫자가 열립니다.
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        리스트에서 수익률을 미리 보여주지 않습니다. 이 서비스의 핵심은 결과표가 아니라,
        그 결과가 만들어지는 시간을 직접 보는 것입니다.
      </p>
      <button
        className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
        onClick={onOpenSearch}
        type="button"
      >
        원하는 종목 먼저 찾기
      </button>
    </SectionCard>
  );
}

function RaceStage({
  analysis,
  currentPoint,
  onAnswer,
  onOpenSearch,
  onRestart,
  raceAssets,
  raceBuild,
  raceStatus,
  realityAnswer,
  selectedMeta,
  visibleData,
}: {
  analysis: PainAnalysis | null;
  currentPoint: RacePoint | null;
  onAnswer: (answer: RealityAnswer) => void;
  onOpenSearch: () => void;
  onRestart: () => void;
  raceAssets: RaceChartAsset[];
  raceBuild: RaceBuildResult | null;
  raceStatus: RaceStatus;
  realityAnswer: RealityAnswer | null;
  selectedMeta: LabAssetMeta;
  visibleData: RacePoint[];
}) {
  const isComplete = raceStatus === "complete" && analysis;

  return (
    <div className="space-y-5">
      <SectionCard className="p-3">
        <div className="px-2 pb-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-blue-500">
            <Clock3 size={15} />
            {raceStatus === "racing" ? "Racing" : raceStatus === "loading" ? "Loading" : "Complete"}
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.07em] text-slate-950">
            {selectedMeta.name} vs 예금 vs 금
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            자산과 금은 실제 과거 데이터, 예금은 고정 복리 기준입니다.
            {raceBuild ? ` 비교 구간은 ${formatDateRange(raceBuild.resolvedStartDate, raceBuild.resolvedEndDate)}입니다.` : ""}
          </p>
        </div>
        <RaceChart
          assets={raceAssets}
          basisLabel="1.0배 = 1,000만원"
          currentPoint={currentPoint}
          data={visibleData}
          fullData={raceBuild?.points ?? []}
          headerSubtitle="결과 해석은 레이스가 끝난 뒤에만 열립니다."
          headerTitle="한 달씩 지나가며 계좌가 흔들립니다"
          isLoading={raceStatus === "loading" || !raceBuild}
          principalKrw={PRINCIPAL_KRW}
        />
      </SectionCard>

      {!isComplete ? (
        <SectionCard>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-950 p-2 text-[#f8fafc]">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-[-0.05em] text-slate-950">
                아직 결론을 보여주지 않습니다
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                장기투자는 마지막 숫자만 보면 너무 쉬워 보입니다. 지금은 그 숫자가 만들어지는 중간의
                흔들림을 먼저 봐야 합니다.
              </p>
            </div>
          </div>
        </SectionCard>
      ) : (
        <>
          <ResultSummary analysis={analysis} selectedMeta={selectedMeta} />
          <PainDashboard analysis={analysis} />
          <TemptationDashboard analysis={analysis} />
          <EmotionMap analysis={analysis} />
          <RealityQuestion
            answer={realityAnswer}
            onAnswer={onAnswer}
            onOpenSearch={onOpenSearch}
            onRestart={onRestart}
          />
        </>
      )}
    </div>
  );
}

function ResultSummary({
  analysis,
  selectedMeta,
}: {
  analysis: PainAnalysis;
  selectedMeta: LabAssetMeta;
}) {
  return (
    <SectionCard>
      <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-500">Race complete</div>
      <h2 className="mt-3 text-[2rem] font-black leading-[1.08] tracking-[-0.08em] text-slate-950">
        {selectedMeta.name}에 넣었다면
        <br />
        지금 {formatKrw(analysis.finalValue)}입니다
      </h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
        문제는 이 돈을 벌었느냐가 아닙니다. 당신이 이 흔들림을 보고도 팔지 않을 수 있었느냐입니다.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <MetricCard label="예금 대비 차이" value={formatKrw(analysis.bankGap)} />
        <MetricCard label="금 대비 차이" value={formatKrw(analysis.goldGap)} />
        <MetricCard label="최종 수익률" value={formatPct(analysis.assetReturnPct)} />
        <MetricCard label="실제 비교 기간" value={formatDateRange(analysis.resolvedStartDate, analysis.resolvedEndDate)} />
      </div>
    </SectionCard>
  );
}

function PainDashboard({ analysis }: { analysis: PainAnalysis }) {
  return (
    <SectionCard>
      <div className="flex items-center gap-2 text-sm font-black text-rose-500">
        <TrendingDown size={18} />
        이 돈을 벌기까지 견뎠어야 할 고통
      </div>
      <div className="mt-4 grid gap-3">
        <MetricCard
          label="계좌가 가장 처참하게 부서진 순간"
          value={formatPct(analysis.maxDrawdownPct)}
          warning
        />
        <MetricCard
          label="전고점 아래에서 한숨 쉬며 보낸 시간"
          value={`${analysis.underATHMonths}개월`}
          warning
        />
        <MetricCard
          label="원금마저 깨져 망했다고 느꼈을 기간"
          value={`${analysis.underPrincipalMonths}개월`}
          warning={analysis.underPrincipalMonths > 0}
        />
        <MetricCard
          label="전고점 회복까지 가장 긴 기다림"
          value={`${analysis.longestRecoveryMonths}개월`}
          warning
        />
      </div>
      <p className="mt-4 rounded-[22px] bg-slate-950 px-4 py-4 text-sm font-semibold leading-6 text-[#f8fafc]">
        차트는 지나고 보면 아름답습니다. 하지만 전체 기간의 {analysis.underATHPercent}%는
        고점보다 낮아진 계좌를 보며 지금이라도 팔아야 하나 고민했을 시간입니다.
      </p>
    </SectionCard>
  );
}

function TemptationDashboard({ analysis }: { analysis: PainAnalysis }) {
  const firstMilestone = analysis.milestones[0];

  return (
    <SectionCard>
      <div className="text-sm font-black text-amber-600">이 돈을 놓칠 뻔했던 익절의 유혹</div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        떨어질 때만 무서운 게 아닙니다. 조금 벌었을 때 이 정도면 됐다며 내리는 순간도 장기투자를 망칩니다.
      </p>
      {analysis.milestones.length ? (
        <div className="mt-4 space-y-3">
          {analysis.milestones.slice(0, 3).map((milestone) => (
            <div
              className="rounded-[22px] border border-amber-100 bg-amber-50 px-4 py-4"
              key={`${milestone.multiple}-${milestone.date}`}
            >
              <div className="text-xs font-black text-amber-700">
                첫 {milestone.multiple}배 달성 · {formatMonth(milestone.date)}
              </div>
              <div className="mt-2 text-lg font-black tracking-[-0.05em] text-slate-950">
                당시 평가금액 {formatKrw(milestone.value)}
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                여기서 줄 때 먹자며 내렸다면 최종 금액 중 {formatKrw(milestone.missedAmount)}을
                눈앞에서 보내야 했습니다.
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold leading-6 text-slate-500">
          이 구간에서는 2배 이상의 익절 유혹보다 버티는 고통이 더 컸습니다. 수익이 크지 않았어도
          긴 시간 마음이 편했다는 뜻은 아닙니다.
        </div>
      )}
      {firstMilestone ? (
        <div className="mt-4 rounded-[22px] bg-slate-950 px-4 py-4 text-sm font-semibold leading-6 text-[#f8fafc]">
          장기투자는 손실을 버티는 일만이 아닙니다. 작은 성공에 조기 만족하지 않는 일이기도 합니다.
        </div>
      ) : null}
    </SectionCard>
  );
}

function EmotionMap({ analysis }: { analysis: PainAnalysis }) {
  return (
    <SectionCard>
      <div className="text-sm font-black text-slate-950">월별 감정 지도</div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        10년은 한 문장이 아니라 수십 번의 흔들림입니다. 아래는 계좌를 열 때마다 마음이 흔들렸을 순간들입니다.
      </p>
      <div className="mt-4 space-y-3">
        {analysis.emotionMonths.slice(0, 6).map((month) => (
          <div
            className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
            key={`${month.date}-${month.label}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-black text-slate-950">{month.label}</div>
              <div className="text-xs font-black text-slate-400">{formatMonth(month.date)}</div>
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{month.note}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function RealityQuestion({
  answer,
  onAnswer,
  onOpenSearch,
  onRestart,
}: {
  answer: RealityAnswer | null;
  onAnswer: (answer: RealityAnswer) => void;
  onOpenSearch: () => void;
  onRestart: () => void;
}) {
  const options: Array<{ id: RealityAnswer; label: string }> = [
    { id: "sellFear", label: "하락할 때 무서워서 중간에 던졌을 것 같다" },
    { id: "sellEarly", label: "오를 때 아까워서 적당히 먹고 팔았을 것 같다" },
    { id: "hold", label: "흔들렸겠지만 끝까지 들고 갔을 것 같다" },
    { id: "buyMore", label: "기회라 생각하고 오히려 더 샀을 것 같다" },
  ];

  return (
    <SectionCard>
      <div className="text-sm font-black text-slate-950">솔직히 고백해 봅시다</div>
      <h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.06em] text-slate-950">
        당신이라면 폭락의 공포와 익절의 유혹을 모두 이겨내고 이 계좌를 지켜낼 수 있었을까요?
      </h3>
      <div className="mt-5 space-y-2">
        {options.map((option) => (
          <button
            className={`w-full rounded-[20px] border px-4 py-4 text-left text-sm font-black leading-6 transition ${
              answer === option.id
                ? "border-slate-950 bg-slate-950 text-[#f8fafc]"
                : "border-slate-200 bg-white text-slate-700"
            }`}
            key={option.id}
            onClick={() => onAnswer(option.id)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      {answer ? (
        <div className="mt-4 rounded-[22px] border border-blue-100 bg-blue-50 px-4 py-4 text-sm font-semibold leading-6 text-slate-700">
          {REALITY_FEEDBACK[answer]}
        </div>
      ) : null}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          className="rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-sm font-black text-slate-700"
          onClick={onRestart}
          type="button"
        >
          다시 보기
        </button>
        <button
          className="rounded-[20px] bg-slate-950 px-4 py-4 text-sm font-black text-[#f8fafc]"
          onClick={onOpenSearch}
          type="button"
        >
          다른 종목 찾기
        </button>
      </div>
    </SectionCard>
  );
}

function AssetSearch({
  activeTab,
  assets,
  onSelectAsset,
  onStartRace,
  query,
  selectedAssetId,
  setActiveTab,
  setQuery,
}: {
  activeTab: AssetTab;
  assets: Array<{ assetId: ComparisonAssetId; meta: LabAssetMeta }>;
  onSelectAsset: (assetId: ComparisonAssetId) => void;
  onStartRace: (assetId: ComparisonAssetId) => void;
  query: string;
  selectedAssetId: ComparisonAssetId;
  setActiveTab: (tab: AssetTab) => void;
  setQuery: (query: string) => void;
}) {
  const selectedMeta = getMeta(selectedAssetId);

  return (
    <div className="space-y-4">
      <Header />
      <SectionCard>
        <div className="text-[12px] font-black uppercase tracking-[0.22em] text-blue-500">Search</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.08em] text-slate-950">
          원하는 종목을 고르고,
          <br />
          직접 레이스를 돌려보세요
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          목록에서는 결과를 숨깁니다. 종목을 고른 뒤 레이스를 봐야 10년의 흔들림이 열립니다.
        </p>
        <label className="mt-5 flex items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
          <Search className="text-slate-400" size={18} />
          <input
            className="w-full bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="엔비디아, 삼성전자, SPY, 비트코인"
            value={query}
          />
        </label>
      </SectionCard>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {TAB_OPTIONS.map((tab) => (
          <button
            className={`shrink-0 rounded-full px-4 py-3 text-sm font-black ${
              activeTab === tab.id
                ? "bg-slate-950 text-[#f8fafc]"
                : "border border-slate-200 bg-white text-slate-500"
            }`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 pb-40">
        {assets.map(({ assetId, meta }) => {
          const isSelected = selectedAssetId === assetId;
          return (
            <button
              className={`w-full rounded-[24px] border bg-white px-4 py-4 text-left shadow-sm transition ${
                isSelected ? "border-slate-950" : "border-slate-200"
              }`}
              key={assetId}
              onClick={() => onSelectAsset(assetId)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-black tracking-[-0.05em] text-slate-950">{meta.name}</div>
                  <div className="mt-1 text-sm font-bold text-slate-500">
                    {meta.ticker} · {meta.theme}
                  </div>
                </div>
                {isSelected ? (
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black text-[#f8fafc]">
                    선택됨
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {meta.groups.slice(0, 3).map((group) => (
                  <AssetBadge key={group}>{group}</AssetBadge>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="fixed bottom-20 left-1/2 z-30 w-full max-w-[520px] -translate-x-1/2 px-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.2)]">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">선택한 종목</div>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-black tracking-[-0.05em] text-slate-950">
                {selectedMeta.name}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-500">
                {selectedMeta.ticker} · {selectedMeta.theme}
              </div>
            </div>
            <button
              className="shrink-0 rounded-full bg-slate-950 px-4 py-3 text-sm font-black text-[#f8fafc]"
              onClick={() => onStartRace(selectedAssetId)}
              type="button"
            >
              레이스
            </button>
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{selectedMeta.oneLiner}</p>
        </div>
      </div>
    </div>
  );
}

function LiveIdeas({ onStartRace }: { onStartRace: (assetId: ComparisonAssetId) => void }) {
  const ideas: Array<{ assetId: ComparisonAssetId; line: string; title: string }> = [
    {
      assetId: "nvda",
      line: "모두가 AI를 말하지만, 실제로 10년을 들고 가는 일은 전혀 다른 문제입니다.",
      title: "AI 반도체의 환호와 공포",
    },
    {
      assetId: "005930",
      line: "가장 익숙한 국민주도 긴 시간은 생각보다 편안하지 않았습니다.",
      title: "삼성전자를 오래 들고 있었다면",
    },
    {
      assetId: "spy",
      line: "분산투자도 하락장을 없애주지는 않습니다. 다만 살아남는 방식을 바꿉니다.",
      title: "시장 전체를 샀을 때의 시간",
    },
  ];

  return (
    <div className="space-y-4">
      <Header />
      <SectionCard>
        <div className="text-[12px] font-black uppercase tracking-[0.22em] text-emerald-500">Live</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.08em] text-slate-950">
          오늘 다시 볼 만한
          <br />
          장기투자 실험
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          매일 바뀌는 추천처럼 보이되, 핵심은 같습니다. 숫자보다 시간을 보게 만드는 레이스입니다.
        </p>
      </SectionCard>
      <div className="space-y-3">
        {ideas.map((idea) => {
          const meta = getMeta(idea.assetId);
          return (
            <button
              className="w-full rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm"
              key={idea.assetId}
              onClick={() => onStartRace(idea.assetId)}
              type="button"
            >
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                {meta.ticker} · {meta.theme}
              </div>
              <div className="mt-2 text-xl font-black tracking-[-0.05em] text-slate-950">
                {idea.title}
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{idea.line}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SavedView({
  analysis,
  lastCompletedAssetId,
  onStartRace,
}: {
  analysis: PainAnalysis | null;
  lastCompletedAssetId: ComparisonAssetId | null;
  onStartRace: (assetId: ComparisonAssetId) => void;
}) {
  const meta = lastCompletedAssetId ? getMeta(lastCompletedAssetId) : null;

  return (
    <div className="space-y-4">
      <Header />
      <SectionCard>
        <div className="text-[12px] font-black uppercase tracking-[0.22em] text-blue-500">Saved</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.08em] text-slate-950">
          내가 버틸 수 있었는지
          <br />
          기록으로 남기는 곳
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          지금은 마지막으로 완료한 레이스만 보여줍니다. 이후에는 종목별 멘탈 기록과 다시 보기 기능으로 확장할 수 있습니다.
        </p>
      </SectionCard>
      {analysis && meta && lastCompletedAssetId ? (
        <SectionCard>
          <div className="text-sm font-black text-slate-500">마지막 완료 레이스</div>
          <div className="mt-2 text-2xl font-black tracking-[-0.06em] text-slate-950">
            {meta.name} · {formatKrw(analysis.finalValue)}
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            최대 낙폭 {formatPct(analysis.maxDrawdownPct)}, 전고점 아래 {analysis.underATHMonths}개월.
            이 숫자는 수익률보다 오래 남는 장기투자의 민낯입니다.
          </p>
          <button
            className="mt-4 rounded-full bg-slate-950 px-4 py-3 text-sm font-black text-[#f8fafc]"
            onClick={() => onStartRace(lastCompletedAssetId)}
            type="button"
          >
            다시 레이스 보기
          </button>
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="text-lg font-black tracking-[-0.05em] text-slate-950">
            아직 저장할 레이스가 없습니다
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            홈에서 레이스를 끝까지 본 뒤, 이곳에서 내가 어떤 구간에 흔들렸을지 다시 확인할 수 있게 만들 예정입니다.
          </p>
        </SectionCard>
      )}
    </div>
  );
}

function BottomNavigation({
  activeTab,
  onChange,
}: {
  activeTab: BottomTab;
  onChange: (tab: BottomTab) => void;
}) {
  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-full max-w-[520px] -translate-x-1/2 px-4">
      <div className="grid grid-cols-4 rounded-[30px] border border-slate-200 bg-white/95 p-2 shadow-[0_18px_55px_rgba(15,23,42,0.16)] backdrop-blur">
        {BOTTOM_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              className={`flex flex-col items-center gap-1 rounded-[22px] px-2 py-2.5 text-[11px] font-black transition ${
                isActive ? "bg-slate-950 text-[#f8fafc]" : "text-slate-400"
              }`}
              data-testid={`lab-bottom-tab-${tab.id}`}
              key={tab.id}
              onClick={() => onChange(tab.id)}
              type="button"
            >
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
