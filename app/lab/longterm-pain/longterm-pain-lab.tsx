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
type EmotionTone = "panic" | "recovery" | "sideways" | "temptation" | "underwater";

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
  drawdownPct: number;
  label: string;
  monthlyReturnPct: number;
  note: string;
  tone: EmotionTone;
  totalReturnPct: number;
  value: number;
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
      "글로벌 SUV와 전기차 흐름을 타며 한국 자동차 산업의 체력이 한 단계 올라섰는지 시험하게 만드는 대표주입니다.",
    searchTerms: ["기아", "kia", "000270", "자동차"],
    theme: "자동차",
    ticker: "000270",
  },
  "000660": {
    groups: ["KOSPI"],
    name: "SK하이닉스",
    oneLiner:
      "AI 서버의 심장인 HBM 수요가 폭발할 때, 한국 반도체 대형주가 얼마나 거칠게 재평가되는지 보여줍니다.",
    searchTerms: ["sk하이닉스", "하이닉스", "000660", "반도체"],
    theme: "반도체",
    ticker: "000660",
  },
  "003550": {
    groups: ["KOSPI"],
    name: "LG",
    oneLiner:
      "전자, 화학, 배터리까지 한국 핵심 산업의 DNA를 한 번에 읽게 해주는 밸류업 기대의 대표 지주사입니다.",
    searchTerms: ["lg", "003550", "지주"],
    theme: "지주",
    ticker: "003550",
  },
  "005380": {
    groups: ["KOSPI"],
    name: "현대차",
    oneLiner:
      "전기차 전환과 글로벌 판매 사이클 속에서 가치주와 성장주 사이를 아슬아슬하게 오가는 한국 제조업의 대들보입니다.",
    searchTerms: ["현대차", "현대자동차", "005380", "자동차"],
    theme: "자동차",
    ticker: "005380",
  },
  "005490": {
    groups: ["KOSPI"],
    name: "POSCO홀딩스",
    oneLiner:
      "전통 철강의 현금창출력 위에 2차전지 소재 기대가 얹히며 대형 소재주가 얼마나 요동칠 수 있는지 보여줍니다.",
    searchTerms: ["posco", "포스코", "005490", "소재"],
    theme: "소재",
    ticker: "005490",
  },
  "005930": {
    groups: ["KOSPI"],
    name: "삼성전자",
    oneLiner:
      "한국 주식시장의 자존심이자 기준점입니다. 다만 메모리 사이클의 겨울을 버티는 일은 생각보다 훨씬 외롭습니다.",
    searchTerms: ["삼성전자", "삼성", "005930", "반도체"],
    theme: "반도체",
    ticker: "005930",
  },
  "012450": {
    groups: ["KOSPI"],
    name: "한화에어로스페이스",
    oneLiner:
      "K-방산 수출과 우주항공 기대가 겹치며 한국 시장에서 가장 뜨겁게 불타오른 성장주 중 하나입니다.",
    searchTerms: ["한화에어로스페이스", "한화에어로", "012450", "방산"],
    theme: "방산",
    ticker: "012450",
  },
  "028260": {
    groups: ["KOSPI"],
    name: "삼성물산",
    oneLiner:
      "건설, 상사, 패션, 바이오 지분이 얽혀 있어 한국형 지주사가 갖는 복잡한 프리미엄을 보여줍니다.",
    searchTerms: ["삼성물산", "028260", "지주"],
    theme: "지주",
    ticker: "028260",
  },
  "033780": {
    groups: ["KOSPI"],
    name: "KT&G",
    oneLiner:
      "화려한 성장은 없지만 담배와 인삼이 만드는 단단한 현금흐름과 배당의 안온함을 느끼게 해줍니다.",
    searchTerms: ["kt&g", "케이티앤지", "033780", "배당"],
    theme: "소비재",
    ticker: "033780",
  },
  "034020": {
    groups: ["KOSPI"],
    name: "두산에너빌리티",
    oneLiner:
      "글로벌 원전 부활과 에너지 설비 기대가 커질 때 한국 대형 산업재가 받는 프리미엄과 변동성을 보여줍니다.",
    searchTerms: ["두산에너빌리티", "두산", "034020", "원전"],
    theme: "에너지",
    ticker: "034020",
  },
  "035420": {
    groups: ["KOSPI"],
    name: "NAVER",
    oneLiner:
      "검색과 쇼핑을 쥔 한국 인터넷의 왕자입니다. 글로벌 빅테크 공세 속에서 내수 플랫폼의 가치를 지켜내는 사투를 보여줍니다.",
    searchTerms: ["네이버", "naver", "035420", "플랫폼"],
    theme: "플랫폼",
    ticker: "035420",
  },
  "035720": {
    groups: ["KOSPI"],
    name: "카카오",
    oneLiner:
      "전 국민의 일상을 지배하는 메신저에서 시작된 확장이 대중의 기대와 실망을 얼마나 극단적으로 오갔는지 보여줍니다.",
    searchTerms: ["카카오", "kakao", "035720", "플랫폼"],
    theme: "플랫폼",
    ticker: "035720",
  },
  "055550": {
    groups: ["KOSPI"],
    name: "신한지주",
    oneLiner:
      "안정적 이익과 배당 매력을 주지만, 규제와 경기 흐름에 갇히는 은행주의 한계도 함께 보여줍니다.",
    searchTerms: ["신한지주", "신한", "055550", "금융"],
    theme: "금융",
    ticker: "055550",
  },
  "068270": {
    groups: ["KOSPI"],
    name: "셀트리온",
    oneLiner:
      "바이오시밀러 개척자의 기대와 의심이 한국 바이오 투자자들의 환호와 절망을 어떻게 만들었는지 보여줍니다.",
    searchTerms: ["셀트리온", "068270", "바이오"],
    theme: "바이오",
    ticker: "068270",
  },
  "069500": {
    groups: ["ETF", "KOSPI"],
    name: "KODEX 200",
    oneLiner:
      "대한민국 대표 기업 200개를 통째로 매수해 코스피 장기투자가 얼마나 지루하고 가혹한지 체감시켜 줍니다.",
    searchTerms: ["kodex 200", "코덱스200", "069500", "코스피 etf"],
    theme: "한국지수 ETF",
    ticker: "069500",
  },
  "105560": {
    groups: ["KOSPI"],
    name: "KB금융",
    oneLiner:
      "리딩 금융그룹의 주주환원 매력과 금리 사이클에 따라 움직이는 한국 금융주의 교과서 같은 종목입니다.",
    searchTerms: ["kb금융", "국민은행", "105560", "금융"],
    theme: "금융",
    ticker: "105560",
  },
  "207940": {
    groups: ["KOSPI"],
    name: "삼성바이오로직스",
    oneLiner:
      "글로벌 의약품 생산을 맡는 CMO 강자입니다. 경기와 무관하게 굴러가는 대형 바이오주의 프리미엄을 상징합니다.",
    searchTerms: ["삼성바이오로직스", "삼바", "207940", "바이오"],
    theme: "바이오",
    ticker: "207940",
  },
  "360750": {
    groups: ["ETF", "KOSPI", "S&P500"],
    name: "TIGER 미국S&P500",
    oneLiner:
      "원화로 미국 잔고를 쌓는 대중적인 통로입니다. 한국 투자자가 일상 속에서 미국의 우상향에 동승하는 방법입니다.",
    searchTerms: ["tiger 미국s&p500", "360750", "미국 etf", "s&p500"],
    theme: "미국지수 ETF",
    ticker: "360750",
  },
  aapl: {
    groups: ["Nasdaq100", "S&P500"],
    name: "애플",
    oneLiner:
      "아이폰이라는 일상적 중독을 압도적 현금흐름으로 바꾼 기업입니다. 지루함을 견디면 보상이 따르는 장기투자의 정석입니다.",
    searchTerms: ["애플", "apple", "aapl"],
    theme: "빅테크",
    ticker: "AAPL",
  },
  amd: {
    groups: ["Nasdaq100", "S&P500"],
    name: "AMD",
    oneLiner:
      "반도체 패권 경쟁이 요동칠 때 후발주자의 재평가가 투자자에게 어떤 기쁨과 고통을 주는지 보여줍니다.",
    searchTerms: ["amd", "반도체"],
    theme: "반도체",
    ticker: "AMD",
  },
  amzn: {
    groups: ["Nasdaq100", "S&P500"],
    name: "아마존",
    oneLiner:
      "단순 쇼핑몰이 아니라 클라우드와 물류 인프라를 장악한 거대한 독점 생태계의 힘을 보여줍니다.",
    searchTerms: ["아마존", "amazon", "amzn", "aws"],
    theme: "클라우드",
    ticker: "AMZN",
  },
  avgo: {
    groups: ["Nasdaq100", "S&P500"],
    name: "브로드컴",
    oneLiner:
      "AI 인프라와 네트워크 반도체의 숨은 지배자입니다. 화려하진 않아도 가장 확실하게 현금을 짜내는 기업입니다.",
    searchTerms: ["브로드컴", "broadcom", "avgo"],
    theme: "반도체",
    ticker: "AVGO",
  },
  brkb: {
    groups: ["S&P500"],
    name: "버크셔 해서웨이",
    oneLiner:
      "화려한 기술주 없이도 위대한 자본 배치가 긴 시간 동안 어떻게 복리의 마법을 완성하는지 보여줍니다.",
    searchTerms: ["버크셔", "berkshire", "brkb", "버핏"],
    theme: "복합 지주",
    ticker: "BRK.B",
  },
  btc: {
    groups: ["Coin"],
    name: "비트코인",
    oneLiner:
      "프로그래밍된 희소성이라는 낯선 개념이 대중의 비아냥을 뚫고 가격 자체가 서사가 되는 과정을 보여줍니다.",
    searchTerms: ["비트코인", "bitcoin", "btc"],
    theme: "희소 자산",
    ticker: "BTC",
  },
  cost: {
    groups: ["Nasdaq100", "S&P500"],
    name: "코스트코",
    oneLiner:
      "화려한 기술 대신 멤버십 독점과 가격 신뢰가 얼마나 무서운 고객 충성도를 만드는지 보여주는 소비재 끝판왕입니다.",
    searchTerms: ["코스트코", "costco", "cost"],
    theme: "소비재",
    ticker: "COST",
  },
  eth: {
    groups: ["Coin"],
    name: "이더리움",
    oneLiner:
      "단순 코인을 넘어 가상세계의 금융과 앱이 돌아가는 인프라가 시장에서 어떤 가치를 받는지 시험합니다.",
    searchTerms: ["이더리움", "ethereum", "eth"],
    theme: "스마트계약",
    ticker: "ETH",
  },
  googl: {
    groups: ["Nasdaq100", "S&P500"],
    name: "알파벳",
    oneLiner:
      "구글 검색의 철옹성 같은 독점력 위에 유튜브와 AI라는 엔진을 얹은 거대한 현금흐름 기업입니다.",
    searchTerms: ["알파벳", "구글", "google", "googl"],
    theme: "빅테크",
    ticker: "GOOGL",
  },
  jnj: {
    groups: ["S&P500"],
    name: "존슨앤드존슨",
    oneLiner:
      "유행과 경기가 아무리 바뀌어도 인류의 건강 수요는 쉽게 사라지지 않는다는 방어주의 정석입니다.",
    searchTerms: ["존슨앤드존슨", "jnj", "헬스케어"],
    theme: "헬스케어",
    ticker: "JNJ",
  },
  jpm: {
    groups: ["S&P500"],
    name: "JP모건",
    oneLiner:
      "글로벌 금융 시스템의 강자입니다. 금리와 경기 사이클의 소음 속에서 대형 은행주가 갖는 체력을 보여줍니다.",
    searchTerms: ["jp모건", "jpmorgan", "jpm", "은행"],
    theme: "금융",
    ticker: "JPM",
  },
  ko: {
    groups: ["S&P500"],
    name: "코카콜라",
    oneLiner:
      "성장은 느려 보여도 백 년이 넘는 브랜드 자산이 긴 시간 동안 얼마나 질기고 단단한 복리를 만드는지 증명합니다.",
    searchTerms: ["코카콜라", "coca cola", "ko"],
    theme: "소비재",
    ticker: "KO",
  },
  ma: {
    groups: ["S&P500"],
    name: "마스터카드",
    oneLiner:
      "비자와 함께 글로벌 결제망을 양분하며, 인류의 소비가 늘수록 조용히 통행세를 쌓는 기업입니다.",
    searchTerms: ["마스터카드", "mastercard", "ma"],
    theme: "결제",
    ticker: "MA",
  },
  meta: {
    groups: ["Nasdaq100", "S&P500"],
    name: "메타",
    oneLiner:
      "인류의 시간을 지배하는 플랫폼입니다. 대중의 조롱과 광고 위기를 딛고 주가가 어떻게 부활하는지 보여줍니다.",
    searchTerms: ["메타", "meta", "facebook", "instagram"],
    theme: "플랫폼",
    ticker: "META",
  },
  msft: {
    groups: ["Nasdaq100", "S&P500"],
    name: "마이크로소프트",
    oneLiner:
      "전통 소프트웨어 거인이 클라우드와 AI를 만나 어떻게 가장 트렌디한 성장주로 부활했는지 증명합니다.",
    searchTerms: ["마이크로소프트", "microsoft", "msft"],
    theme: "클라우드",
    ticker: "MSFT",
  },
  nvda: {
    groups: ["Nasdaq100", "S&P500"],
    name: "엔비디아",
    oneLiner:
      "AI 시대의 심장을 파는 기업입니다. 거대한 상상력만큼 계좌를 사정없이 뒤흔드는 변동성의 끝판왕입니다.",
    searchTerms: ["엔비디아", "nvidia", "nvda", "ai"],
    theme: "AI 반도체",
    ticker: "NVDA",
  },
  pg: {
    groups: ["S&P500"],
    name: "P&G",
    oneLiner:
      "면도기, 기저귀, 샴푸처럼 매일 쓰는 생활용품이 하락장에서 얼마나 단단한 방패가 되는지 보여줍니다.",
    searchTerms: ["p&g", "피앤지", "pg", "생활용품"],
    theme: "소비재",
    ticker: "PG",
  },
  qqq: {
    groups: ["ETF", "Nasdaq100"],
    name: "QQQ",
    oneLiner:
      "미국 기술주 엘리트들의 집합소입니다. 화려한 상승의 열매를 먹기 위해 얼마나 매운 변동성을 견뎌야 하는지 알려줍니다.",
    searchTerms: ["qqq", "나스닥", "나스닥100", "etf"],
    theme: "미국지수 ETF",
    ticker: "QQQ",
  },
  soxx: {
    groups: ["ETF", "Nasdaq100"],
    name: "SOXX",
    oneLiner:
      "반도체 산업 전체의 사이클을 한 바퀴에 돌리는 ETF입니다. 업황의 거대한 파도에 내 멘탈을 시험하기 좋습니다.",
    searchTerms: ["soxx", "반도체 etf", "미국 반도체"],
    theme: "반도체 ETF",
    ticker: "SOXX",
  },
  spy: {
    groups: ["ETF", "S&P500"],
    name: "SPY",
    oneLiner:
      "미국 자본주의의 심장 그 자체입니다. 지루해 보이지만 긴 시간 동안 자산가들을 승리로 이끈 출발점입니다.",
    searchTerms: ["spy", "s&p500", "미국지수", "etf"],
    theme: "미국지수 ETF",
    ticker: "SPY",
  },
  tsla: {
    groups: ["Nasdaq100", "S&P500"],
    name: "테슬라",
    oneLiner:
      "전기차, 에너지, 로봇, AI. 이 회사를 무엇으로 정의하느냐에 따라 천국과 지옥을 극단적으로 오가는 종목입니다.",
    searchTerms: ["테슬라", "tesla", "tsla", "전기차"],
    theme: "전기차",
    ticker: "TSLA",
  },
  v: {
    groups: ["S&P500"],
    name: "비자",
    oneLiner:
      "전 세계 사람이 돈을 쓸 때마다 조용히 통행세를 걷는 결제 네트워크의 위력을 보여줍니다.",
    searchTerms: ["비자", "visa", "v", "결제"],
    theme: "결제",
    ticker: "V",
  },
  voo: {
    groups: ["ETF", "S&P500"],
    name: "VOO",
    oneLiner:
      "가장 낮은 비용으로 미국의 우상향에 내 시간을 베팅하는 단순하고 강력한 방법입니다.",
    searchTerms: ["voo", "s&p500", "미국 etf"],
    theme: "미국지수 ETF",
    ticker: "VOO",
  },
  xom: {
    groups: ["S&P500"],
    name: "엑슨모빌",
    oneLiner:
      "국제 유가와 원자재 사이클의 거대한 파도가 오래된 에너지 거인의 주가를 어떻게 들었다 놨다 하는지 보여줍니다.",
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
  { icon: Search, id: "search", label: "탐색" },
  { icon: Radio, id: "live", label: "실험" },
  { icon: Bookmark, id: "saved", label: "기록" },
];

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

function getEmotionTone({
  drawdownPct,
  isAth,
  monthlyReturnPct,
  totalReturnPct,
  value,
  startValue,
}: {
  drawdownPct: number;
  isAth: boolean;
  monthlyReturnPct: number;
  startValue: number;
  totalReturnPct: number;
  value: number;
}): { label: string; tone: EmotionTone } {
  if (monthlyReturnPct <= -15) {
    return { label: "패닉", tone: "panic" };
  }

  if (value < startValue * 0.98) {
    return { label: "지옥", tone: "underwater" };
  }

  if (drawdownPct <= -35) {
    return { label: "지옥", tone: "underwater" };
  }

  if (totalReturnPct >= 100 && monthlyReturnPct >= 4) {
    return { label: "유혹", tone: "temptation" };
  }

  if (isAth && totalReturnPct > 0) {
    return { label: "환호", tone: "recovery" };
  }

  if (Math.abs(monthlyReturnPct) <= 3 && drawdownPct < -5) {
    return { label: "소외감", tone: "sideways" };
  }

  if (monthlyReturnPct >= 8) {
    return { label: "회복", tone: "recovery" };
  }

  return { label: "버티는 달", tone: "sideways" };
}

function getEmotionNote(month: EmotionMonth) {
  if (month.tone === "panic") {
    return `한 달 만에 계좌가 ${formatPct(Math.abs(month.monthlyReturnPct))} 녹아내렸습니다. 지나고 보면 작은 점 하나지만, 당시에는 온 세상 뉴스가 이 자산은 끝났다고 속삭였을 달입니다.`;
  }

  if (month.tone === "underwater") {
    if (month.value >= PRINCIPAL_KRW) {
      return `전고점 대비 ${formatPct(month.drawdownPct)}까지 밀린 달입니다. 수익은 남아 있어도, 이미 번 돈이 증발하는 장면은 원금 손실만큼 사람을 흔듭니다.`;
    }

    return `처음 넣은 원금마저 깨진 달입니다. 이때 장기투자는 멋진 철학이 아니라 당장 집어던지고 싶은 지독한 숙제로 바뀝니다.`;
  }

  if (month.tone === "temptation") {
    return `누적 수익률이 ${formatPct(month.totalReturnPct)}까지 올라왔습니다. 다시 떨어지기 전에 팔고 나중에 싸게 살까 하는 오만이 가장 그럴듯하게 들리는 달입니다.`;
  }

  if (month.tone === "recovery") {
    return `긴 터널을 지나 다시 위로 올라선 달입니다. 이 순간은 예측을 잘한 사람이 아니라, 소음과 유혹을 견디고 시장에 남아 있던 사람에게만 열립니다.`;
  }

  return `기가 막히게 제자리걸음만 반복하는 달입니다. 주변에서 다른 자산으로 돈 벌었다는 소리가 들릴수록 소외감과 지루함이 커집니다.`;
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
  const finalReturnPct = startValue > 0 ? (finalValue / startValue - 1) * 100 : 0;
  let emotionPeak = startValue;
  const rawEmotionMonths = points.map((point, index) => {
    const value = getValue(point, assetId);
    const previousValue = index > 0 ? getValue(points[index - 1]!, assetId) : startValue;
    const monthlyReturnPct = previousValue > 0 ? (value / previousValue - 1) * 100 : 0;
    const nextPeak = Math.max(emotionPeak, value);
    const isAth = value >= nextPeak;
    emotionPeak = nextPeak;
    const drawdownPct = emotionPeak > 0 ? (value / emotionPeak - 1) * 100 : 0;
    const totalReturnPct = startValue > 0 ? (value / startValue - 1) * 100 : 0;
    const emotion = getEmotionTone({
      drawdownPct,
      isAth,
      monthlyReturnPct,
      startValue,
      totalReturnPct,
      value,
    });

    const month: EmotionMonth = {
      date: point.date,
      drawdownPct,
      label: emotion.label,
      monthlyReturnPct,
      note: "",
      tone: emotion.tone,
      totalReturnPct,
      value,
    };

    return {
      ...month,
      note: getEmotionNote(month),
    };
  });
  const emotionMonths = Array.from(
    rawEmotionMonths
      .reduce((map, month) => {
        map.set(month.date.slice(0, 7), month);
        return map;
      }, new Map<string, EmotionMonth>())
      .values(),
  );

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
                  onOpenSearch={() => setActiveBottomTab("search")}
                  onRestart={() => void startRace(selectedAssetId)}
                  raceAssets={raceAssets}
                  raceBuild={raceBuild}
                  raceStatus={raceStatus}
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
        <div className="text-sm font-black tracking-[-0.03em] text-slate-950">레그렛제로</div>
        <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
          장기투자 생존 실험실
        </div>
      </div>
      <div className="rounded-full border border-white bg-white/70 px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">
        100% 실전 데이터
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
      <div className="text-[12px] font-black uppercase tracking-[0.24em] text-blue-500">시뮬레이션 시작</div>
      <h1 className="mt-3 text-[2.3rem] font-black leading-[1.02] tracking-[-0.09em] text-slate-950">
        10년 전 오늘 샀다면,
        <br />
        끝까지 버텼을까요?
      </h1>
      <p className="mt-4 text-[15px] font-semibold leading-7 text-slate-600">
        결과만 보면 투자만큼 쉬운 게 없습니다. 진짜 문제는 그 돈이 불어나는 시간을
        맨몸으로 견뎌내는 일입니다.
      </p>

      <div className="mt-6 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">지금 주목받는 실험</div>
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
            종목 변경
          </button>
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">{selectedMeta.oneLiner}</p>
      </div>

      <button
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-[22px] bg-slate-950 px-5 py-4 text-[15px] font-black text-[#f8fafc] shadow-[0_18px_38px_rgba(15,23,42,0.22)]"
        onClick={onStart}
        type="button"
      >
        원금 1,000만 원으로 시작하기
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
        아직 열리지 않은 미래
      </div>
      <p className="mt-3 text-lg font-black leading-7 tracking-[-0.05em] text-slate-950">
        시뮬레이션을 끝까지 완료해야 결과가 공개됩니다.
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        레그렛제로는 정답을 먼저 보여주지 않습니다. 최종 수익률을 먼저 보면
        나도 벌었겠다는 착각에 빠지기 때문입니다.
      </p>
      <button
        className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
        onClick={onOpenSearch}
        type="button"
      >
        종목 선택하러 가기
      </button>
    </SectionCard>
  );
}

function RaceStage({
  analysis,
  currentPoint,
  onOpenSearch,
  onRestart,
  raceAssets,
  raceBuild,
  raceStatus,
  selectedMeta,
  visibleData,
}: {
  analysis: PainAnalysis | null;
  currentPoint: RacePoint | null;
  onOpenSearch: () => void;
  onRestart: () => void;
  raceAssets: RaceChartAsset[];
  raceBuild: RaceBuildResult | null;
  raceStatus: RaceStatus;
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
            {raceStatus === "racing"
              ? "자산 시뮬레이션 중"
              : raceStatus === "loading"
                ? "10년 전 과거로 이동 중"
                : "시뮬레이션 완료"}
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.07em] text-slate-950">
            {selectedMeta.name} vs 은행 예금 vs 금
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            예금은 복리 기준, 자산과 금은 실제 과거 시장 데이터입니다.
            {raceBuild ? ` 시뮬레이션 구간: ${formatDateRange(raceBuild.resolvedStartDate, raceBuild.resolvedEndDate)}` : ""}
          </p>
        </div>
        <RaceChart
          assets={raceAssets}
          basisLabel="1.0배 = 1,000만원"
          currentPoint={currentPoint}
          data={visibleData}
          fullData={raceBuild?.points ?? []}
          headerSubtitle="최종 결과는 레이스가 끝난 뒤에 공개됩니다."
          headerTitle="한 달 한 달, 내 자산의 실제 흔들림입니다"
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
                잠시만 결과를 가려둡니다
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                마지막 숫자만 보면 투자가 너무 쉬워 보입니다. 지금은 내 계좌가 사정없이 흔들리는
                과정에 집중해 주세요.
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
          <RegretZeroJudgement
            analysis={analysis}
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
      <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-500">타임머신 도착</div>
      <h2 className="mt-3 text-[2rem] font-black leading-[1.08] tracking-[-0.08em] text-slate-950">
        10년 전 {selectedMeta.name}에 넣은
        <br />
        1,000만 원은 {formatKrw(analysis.finalValue)}
      </h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
        중요한 건 이 화려한 숫자가 아닙니다. 사정없이 흔들리는 화면을 보면서도,
        당신은 매도 버튼을 참아낼 수 있었을까요?
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <MetricCard label="은행 예금 대비" value={formatKrw(analysis.bankGap)} />
        <MetricCard label="금 대비" value={formatKrw(analysis.goldGap)} />
        <MetricCard label="누적 수익률" value={formatPct(analysis.assetReturnPct)} />
        <MetricCard label="실전 데이터 기간" value={formatDateRange(analysis.resolvedStartDate, analysis.resolvedEndDate)} />
      </div>
    </SectionCard>
  );
}

function PainDashboard({ analysis }: { analysis: PainAnalysis }) {
  return (
    <SectionCard>
      <div className="flex items-center gap-2 text-sm font-black text-rose-500">
        <TrendingDown size={18} />
        1. 이 자산이 준 하락의 고통
      </div>
      <div className="mt-4 grid gap-3">
        <MetricCard
          label="계좌가 가장 처참하게 녹아내린 순간"
          value={formatPct(analysis.maxDrawdownPct)}
          warning
        />
        <MetricCard
          label="본전 아래에서 한숨 쉬며 보낸 시간"
          value={`${analysis.underATHMonths}개월`}
          warning
        />
        <MetricCard
          label="원금까지 깨져 망했다고 느꼈을 기간"
          value={`${analysis.underPrincipalMonths}개월`}
          warning={analysis.underPrincipalMonths > 0}
        />
        <MetricCard
          label="물린 뒤 탈출하기까지 가장 긴 기다림"
          value={`${analysis.longestRecoveryMonths}개월`}
          warning
        />
      </div>
      <p className="mt-4 rounded-[22px] bg-slate-950 px-4 py-4 text-sm font-semibold leading-6 text-[#f8fafc]">
        차트는 지나고 보면 아름다운 우상향입니다. 하지만 당신이 보낸 시간의 {analysis.underATHPercent}%는
        고점보다 낮아진 계좌를 보며 지금이라도 팔아야 하나 피눈물 나게 고민했을 구간입니다.
      </p>
    </SectionCard>
  );
}

function TemptationDashboard({ analysis }: { analysis: PainAnalysis }) {
  const firstMilestone = analysis.milestones[0];

  return (
    <SectionCard>
      <div className="text-sm font-black text-amber-600">2. 수억 원의 미래를 팔아치울 뻔한 익절의 함정</div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        떨어질 때만 무서운 게 아닙니다. 조금 벌었을 때 이 정도면 됐다며 내리고 싶은 본능이
        장기투자를 가장 확실하게 망칩니다.
      </p>
      {analysis.milestones.length ? (
        <div className="mt-4 space-y-3">
          {analysis.milestones.slice(0, 3).map((milestone) => (
            <div
              className="rounded-[22px] border border-amber-100 bg-amber-50 px-4 py-4"
              key={`${milestone.multiple}-${milestone.date}`}
            >
              <div className="text-xs font-black text-amber-700">
                첫 {milestone.multiple}배 달성의 덫 · {formatMonth(milestone.date)}
              </div>
              <div className="mt-2 text-lg font-black tracking-[-0.05em] text-slate-950">
                당시 자산 가치: {formatKrw(milestone.value)}
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                줄 때 먹자며 이때 내렸다면, 최종 자산의{" "}
                {formatPct((milestone.missedAmount / analysis.finalValue) * 100)}인{" "}
                {formatKrw(milestone.missedAmount)}을 눈앞에서 놓쳤습니다.
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold leading-6 text-slate-500">
          이 자산은 하락의 고통보다 푼돈만 쥐고 탈출하고 싶은 유혹이 더 강한 종목이었습니다.
          마음이 편했던 구간은 단 한 순간도 없습니다.
        </div>
      )}
      {firstMilestone ? (
        <div className="mt-4 rounded-[22px] bg-slate-950 px-4 py-4 text-sm font-semibold leading-6 text-[#f8fafc]">
          장기투자는 하락을 견디는 일만이 아닙니다. 내 자산이 불어날 때 작은 성공에 조기 만족하지 않는 인내이기도 합니다.
        </div>
      ) : null}
    </SectionCard>
  );
}

function getEmotionToneClasses(tone: EmotionTone) {
  if (tone === "panic") {
    return "border-rose-300 bg-rose-500 text-white shadow-[0_8px_18px_rgba(244,63,94,0.22)]";
  }

  if (tone === "underwater") {
    return "border-slate-900 bg-slate-950 text-white shadow-[0_8px_18px_rgba(15,23,42,0.24)]";
  }

  if (tone === "temptation") {
    return "border-amber-300 bg-amber-400 text-slate-950 shadow-[0_8px_18px_rgba(251,191,36,0.2)]";
  }

  if (tone === "recovery") {
    return "border-emerald-300 bg-emerald-400 text-slate-950 shadow-[0_8px_18px_rgba(52,211,153,0.18)]";
  }

  return "border-slate-200 bg-slate-100 text-slate-500";
}

function getEmotionLegendLabel(tone: EmotionTone) {
  if (tone === "panic") {
    return "패닉";
  }

  if (tone === "underwater") {
    return "지옥";
  }

  if (tone === "temptation") {
    return "유혹";
  }

  if (tone === "recovery") {
    return "환호";
  }

  return "소외감";
}

function getEmotionLegendDescription(tone: EmotionTone) {
  if (tone === "panic") {
    return "갑작스러운 폭락";
  }

  if (tone === "underwater") {
    return "원금 훼손 구간";
  }

  if (tone === "temptation") {
    return "조기 익절의 덫";
  }

  if (tone === "recovery") {
    return "신고가 쟁취";
  }

  return "지루한 횡보";
}

function EmotionMap({ analysis }: { analysis: PainAnalysis }) {
  const defaultMonth =
    [...analysis.emotionMonths]
      .filter((month) => month.tone === "panic" || month.tone === "underwater")
      .sort((left, right) => left.monthlyReturnPct - right.monthlyReturnPct)[0] ??
    analysis.emotionMonths.find((month) => month.tone === "temptation") ??
    analysis.emotionMonths[0]!;
  const [selectedDate, setSelectedDate] = useState(defaultMonth.date);

  const selectedMonth =
    analysis.emotionMonths.find((month) => month.date === selectedDate) ?? defaultMonth;
  const years = Array.from(
    analysis.emotionMonths.reduce((map, month) => {
      const year = month.date.slice(0, 4);
      const list = map.get(year) ?? [];
      list.push(month);
      map.set(year, list);
      return map;
    }, new Map<string, EmotionMonth[]>()),
  );

  return (
    <SectionCard>
      <div className="text-sm font-black text-slate-950">3. 한 달 한 달의 멘탈 지도</div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        10년은 한 줄의 선이 아니라 120번 안팎의 심리전입니다. 색상 타일을 눌러, 그달의 계좌가
        당신에게 어떤 감정을 강요했을지 확인해 보세요.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(["panic", "underwater", "temptation", "recovery", "sideways"] as EmotionTone[]).map(
          (tone) => (
            <div className="flex items-center gap-2 rounded-[18px] bg-slate-50 px-3 py-2" key={tone}>
              <span className={`h-3 w-3 rounded-full ${getEmotionToneClasses(tone).split(" ").slice(1, 2).join(" ")}`} />
              <span>
                <span className="block text-[11px] font-black text-slate-600">
                  {getEmotionLegendLabel(tone)}
                </span>
                <span className="block text-[9px] font-bold text-slate-400">
                  {getEmotionLegendDescription(tone)}
                </span>
              </span>
            </div>
          ),
        )}
      </div>

      <div className="mt-5 space-y-4">
        {years.map(([year, months]) => (
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-3 py-3" key={year}>
            <div className="mb-2 text-xs font-black text-slate-400">{year}</div>
            <div className="grid grid-cols-12 gap-1.5">
              {months.map((month) => (
                <button
                  aria-label={`${formatMonth(month.date)} ${month.label}`}
                  className={`h-7 rounded-[9px] border text-[9px] font-black transition ${
                    selectedMonth.date === month.date
                      ? `${getEmotionToneClasses(month.tone)} ring-2 ring-slate-950/20`
                      : getEmotionToneClasses(month.tone)
                  }`}
                  key={month.date}
                  onClick={() => setSelectedDate(month.date)}
                  type="button"
                >
                  {month.date.slice(5, 7)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[26px] border border-slate-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              선택한 달
            </div>
            <div className="mt-1 text-xl font-black tracking-[-0.05em] text-slate-950">
              {formatMonth(selectedMonth.date)} · {selectedMonth.label}
            </div>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-black ${getEmotionToneClasses(selectedMonth.tone)}`}>
            {getEmotionLegendLabel(selectedMonth.tone)}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-[18px] bg-slate-50 px-3 py-3">
            <div className="text-[10px] font-black text-slate-400">한 달</div>
            <div className="mt-1 text-sm font-black text-slate-950">
              {formatPct(selectedMonth.monthlyReturnPct)}
            </div>
          </div>
          <div className="rounded-[18px] bg-slate-50 px-3 py-3">
            <div className="text-[10px] font-black text-slate-400">고점 대비</div>
            <div className="mt-1 text-sm font-black text-slate-950">
              {formatPct(selectedMonth.drawdownPct)}
            </div>
          </div>
          <div className="rounded-[18px] bg-slate-50 px-3 py-3">
            <div className="text-[10px] font-black text-slate-400">평가액</div>
            <div className="mt-1 text-sm font-black text-slate-950">
              {formatKrw(selectedMonth.value)}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">{selectedMonth.note}</p>
      </div>
    </SectionCard>
  );
}

function RegretZeroJudgement({
  analysis,
  onOpenSearch,
  onRestart,
}: {
  analysis: PainAnalysis;
  onOpenSearch: () => void;
  onRestart: () => void;
}) {
  const fearMonth =
    [...analysis.emotionMonths]
      .filter((month) => month.tone === "panic" || month.tone === "underwater")
      .sort((left, right) => left.monthlyReturnPct - right.monthlyReturnPct)[0] ??
    analysis.emotionMonths[0]!;
  const temptation = analysis.milestones[0] ?? null;

  return (
    <SectionCard>
      <div className="text-sm font-black text-slate-950">4. 레그렛제로 생존 진단</div>
      <h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.06em] text-slate-950">
        당신이 가장 흔들렸을 가능성이 높은 순간
      </h3>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
        이제 질문하지 않겠습니다. 데이터가 이미 말해줍니다. 장기투자는 의지 문제가 아니라, 내가
        무너질 구간을 미리 알고 구조를 만드는 문제입니다.
      </p>

      <div className="mt-5 space-y-3">
        <div className="rounded-[24px] border border-rose-100 bg-rose-50 px-4 py-4">
          <div className="text-xs font-black text-rose-500">공포 매도 위험</div>
          <div className="mt-1 text-lg font-black tracking-[-0.05em] text-slate-950">
            {formatMonth(fearMonth.date)} · {formatPct(fearMonth.monthlyReturnPct)}
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            이 달에는 계좌를 열 때마다 팔아야 할 이유가 먼저 보였을 가능성이 큽니다.
          </p>
        </div>

        {temptation ? (
          <div className="rounded-[24px] border border-amber-100 bg-amber-50 px-4 py-4">
            <div className="text-xs font-black text-amber-600">익절 도망 위험</div>
            <div className="mt-1 text-lg font-black tracking-[-0.05em] text-slate-950">
              {formatMonth(temptation.date)} · 첫 {temptation.multiple}배
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              이때 내렸다면 최종 자산 중 {formatKrw(temptation.missedAmount)}을 눈앞에서 놓쳤습니다.
            </p>
          </div>
        ) : null}

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="text-xs font-black text-slate-500">지루함 이탈 위험</div>
          <div className="mt-1 text-lg font-black tracking-[-0.05em] text-slate-950">
            전고점 아래 {analysis.underATHMonths}개월
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            장기투자를 망치는 건 폭락만이 아닙니다. 아무 일도 안 일어나는 것 같은 시간이 더 오래
            사람을 지치게 만듭니다.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          className="rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-sm font-black text-slate-700"
          onClick={onRestart}
          type="button"
        >
          레이스 다시 보기
        </button>
        <button
          className="rounded-[20px] bg-slate-950 px-4 py-4 text-sm font-black text-[#f8fafc]"
          onClick={onOpenSearch}
          type="button"
        >
          다른 자산 도전하기
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
        <div className="text-[12px] font-black uppercase tracking-[0.22em] text-blue-500">자산 탐색</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.08em] text-slate-950">
          실험할 종목을 고르고,
          <br />
          10년의 시간 속으로 들어가 보세요
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          자산 목록에서는 최종 수익률을 보여주지 않습니다. 직접 10년의 흔들림을 목격해야
          투자라는 감각이 열리기 때문입니다.
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
          <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">내가 고른 자산</div>
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
              시뮬레이션
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
      line: "모두가 AI를 찬양하지만, 이 주식도 본전을 못 찾던 시간이 있었습니다.",
      title: "엔비디아: 환호 뒤에 숨은 공포",
    },
    {
      assetId: "005930",
      line: "가장 익숙한 국민주도 10년 내내 마음 편했던 것은 아닙니다.",
      title: "국민주 삼성전자의 진짜 민낯",
    },
    {
      assetId: "spy",
      line: "분산투자는 하락장을 없애주지 않습니다. 다만 살아남는 방식을 바꿉니다.",
      title: "미국 시장 전체에 묻어두었다면",
    },
  ];

  return (
    <div className="space-y-4">
      <Header />
      <SectionCard>
        <div className="text-[12px] font-black uppercase tracking-[0.22em] text-emerald-500">라이브 실험</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.08em] text-slate-950">
          오늘의 실전 멘탈
          <br />
          시뮬레이션 추천
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          매일 새로운 자산으로 멘탈을 점검합니다. 숫자가 아니라 시간의 무게를 견뎌보세요.
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
        <div className="text-[12px] font-black uppercase tracking-[0.22em] text-blue-500">나의 기록</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.08em] text-slate-950">
          내가 흔들렸던
          <br />
          멘탈을 기록하는 곳
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          지금은 직전에 완료한 시뮬레이션만 보관합니다. 이후에는 자산별 멘탈 리포트로 확장할 수 있습니다.
        </p>
      </SectionCard>
      {analysis && meta && lastCompletedAssetId ? (
        <SectionCard>
          <div className="text-sm font-black text-slate-500">최근 시뮬레이션 자산</div>
          <div className="mt-2 text-2xl font-black tracking-[-0.06em] text-slate-950">
            {meta.name} · {formatKrw(analysis.finalValue)}
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            최대 낙폭 {formatPct(analysis.maxDrawdownPct)}, 전고점 아래 {analysis.underATHMonths}개월.
            이 숫자는 수익률 뒤에 숨은 장기투자의 진짜 민낯입니다.
          </p>
          <button
            className="mt-4 rounded-full bg-slate-950 px-4 py-3 text-sm font-black text-[#f8fafc]"
            onClick={() => onStartRace(lastCompletedAssetId)}
            type="button"
          >
            기록 다시 보기
          </button>
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="text-lg font-black tracking-[-0.05em] text-slate-950">
            아직 보관된 기록이 없습니다
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            홈에서 시뮬레이션을 끝까지 완료하면, 어떤 공포와 유혹에 취약했는지 이곳에서 다시 확인할 수 있습니다.
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
