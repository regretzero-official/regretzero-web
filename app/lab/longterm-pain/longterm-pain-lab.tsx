"use client";

import {
  Bookmark,
  ChevronRight,
  Clock3,
  Home,
  LineChart,
  Radio,
  Search,
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
type RaceViewMode = "auto" | "manual";
type EmotionTone = "panic" | "recovery" | "sideways" | "temptation" | "underwater";
type EmotionEventType =
  | "breakout"
  | "crash"
  | "deepDrawdown"
  | "firstProfit"
  | "milestone"
  | "pullback"
  | "quiet"
  | "recovery"
  | "sideways"
  | "surge"
  | "underPrincipal";

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
  chainLabel: string | null;
  chainMonths: number;
  criticalZone: boolean;
  date: string;
  drawdownPct: number;
  eventType: EmotionEventType;
  futureMasked: boolean;
  impulseLabel: string;
  label: string;
  marker: string;
  missedAmount: number;
  mindLine: string;
  monthIndex: number;
  monthlyChangeKrw: number;
  monthlyReturnPct: number;
  note: string;
  noiseLine: string;
  peakBreakout: boolean;
  peakWaitMonths: number;
  previousValue: number;
  tangibleLine: string;
  tone: EmotionTone;
  totalReturnPct: number;
  value: number;
  verdict: string;
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

type RaceEventTone = "danger" | "neutral" | "recovery" | "temptation";

interface RaceEventStop {
  date: string;
  description: string;
  id: string;
  index: number;
  moneyLabel: string;
  title: string;
  tone: RaceEventTone;
}

const PRINCIPAL_KRW = DEFAULT_AMOUNT;
const RACE_ACTIVE_DURATION_MS = 20_000;
const RACE_EVENT_PAUSE_MS = 5_500;

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
  { icon: Search, id: "search", label: "자산" },
  { icon: Radio, id: "live", label: "오늘" },
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

function formatMultiple(value: number) {
  if (!Number.isFinite(value)) {
    return "0.0배";
  }

  return `${value.toLocaleString("ko-KR", {
    maximumFractionDigits: value >= 10 ? 1 : 2,
    minimumFractionDigits: value >= 10 ? 1 : 2,
  })}배`;
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

function getEmotionEvent({
  drawdownPct,
  isAth,
  isBreakout,
  monthlyReturnPct,
  peakWaitMonths,
  previousValue,
  totalReturnPct,
  value,
  startValue,
}: {
  drawdownPct: number;
  isAth: boolean;
  isBreakout: boolean;
  monthlyReturnPct: number;
  peakWaitMonths: number;
  previousValue: number;
  startValue: number;
  totalReturnPct: number;
  value: number;
}): {
  eventType: EmotionEventType;
  impulseLabel: string;
  label: string;
  marker: string;
  tone: EmotionTone;
} {
  if (monthlyReturnPct <= -15) {
    return {
      eventType: "crash",
      impulseLabel: "무서워서 팔고 싶은 달",
      label: "폭락",
      marker: "▼",
      tone: "panic",
    };
  }

  if (value < startValue * 0.98) {
    return {
      eventType: "underPrincipal",
      impulseLabel: "도망치고 싶은 달",
      label: "원금 붕괴",
      marker: "●",
      tone: "underwater",
    };
  }

  if (drawdownPct <= -35) {
    return {
      eventType: "deepDrawdown",
      impulseLabel: "번 돈을 지키고 싶은 달",
      label: "장기 물림",
      marker: "●",
      tone: "underwater",
    };
  }

  if (isBreakout && peakWaitMonths >= 2) {
    return {
      eventType: "breakout",
      impulseLabel: "탈출하고 싶은 달",
      label: "전고점 돌파",
      marker: "↗",
      tone: "recovery",
    };
  }

  if (previousValue < startValue && value >= startValue) {
    return {
      eventType: "firstProfit",
      impulseLabel: "본전 찾고 나가고 싶은 달",
      label: "첫 수익",
      marker: "+",
      tone: "recovery",
    };
  }

  if (previousValue < startValue * 10 && value >= startValue * 10) {
    return {
      eventType: "milestone",
      impulseLabel: "인생 수익을 확정하고 싶은 달",
      label: "10배의 유혹",
      marker: "★",
      tone: "temptation",
    };
  }

  if (previousValue < startValue * 5 && value >= startValue * 5) {
    return {
      eventType: "milestone",
      impulseLabel: "먹고 튀고 싶은 달",
      label: "5배의 유혹",
      marker: "★",
      tone: "temptation",
    };
  }

  if (previousValue < startValue * 2 && value >= startValue * 2) {
    return {
      eventType: "milestone",
      impulseLabel: "수익을 지키고 싶은 달",
      label: "2배의 유혹",
      marker: "★",
      tone: "temptation",
    };
  }

  if (monthlyReturnPct >= 25 || (totalReturnPct >= 100 && monthlyReturnPct >= 15)) {
    return {
      eventType: "surge",
      impulseLabel: "오늘 팔면 승자 같아지는 달",
      label: "폭등",
      marker: "▲",
      tone: "temptation",
    };
  }

  if (monthlyReturnPct <= -8 && totalReturnPct > 20) {
    return {
      eventType: "pullback",
      impulseLabel: "수익 반납이 아까운 달",
      label: "수익 반납",
      marker: "↓",
      tone: "panic",
    };
  }

  if (isAth && totalReturnPct > 0) {
    return {
      eventType: "recovery",
      impulseLabel: "환호하면서도 불안한 달",
      label: "신고가",
      marker: "●",
      tone: "recovery",
    };
  }

  if (Math.abs(monthlyReturnPct) <= 3 && drawdownPct < -5) {
    return {
      eventType: "sideways",
      impulseLabel: "지루해서 갈아타고 싶은 달",
      label: "횡보",
      marker: "~",
      tone: "sideways",
    };
  }

  if (monthlyReturnPct >= 8) {
    return {
      eventType: "recovery",
      impulseLabel: "다시 희망이 보이는 달",
      label: "회복",
      marker: "↑",
      tone: "recovery",
    };
  }

  return {
    eventType: "quiet",
    impulseLabel: "아무 일도 없어 의심되는 달",
    label: "버티는 달",
    marker: "",
    tone: "sideways",
  };
}

function getEmotionMindLine(month: EmotionMonth) {
  if (month.eventType === "breakout") {
    return "드디어 살아났다. 이제 본전 찾았으니 그만할까?";
  }

  if (month.eventType === "crash") {
    return "역시 고점에 물렸구나. 더 늦기 전에 손절해야 하나?";
  }

  if (month.eventType === "underPrincipal") {
    return "원금까지 깨졌네. 장기투자 같은 말은 다 허상 아닐까?";
  }

  if (month.eventType === "deepDrawdown") {
    return "수익은 남아 있는데, 왜 이렇게 진 것 같은 기분이 들지?";
  }

  if (month.eventType === "firstProfit") {
    return "겨우 본전 넘었다. 이번엔 욕심내지 말고 빠질까?";
  }

  if (month.eventType === "milestone") {
    return "이 정도면 인생 수익 아닌가? 여기서 팔면 최소한 이긴 거잖아.";
  }

  if (month.eventType === "surge") {
    return "오늘 팔면 승자 아닐까? 이 상승이 계속될 리 없잖아.";
  }

  if (month.eventType === "pullback") {
    return "번 돈이 사라지고 있다. 지금이라도 챙겨야 하나?";
  }

  if (month.eventType === "recovery") {
    return "드디어 분위기가 돌아왔다. 그런데 또 꺾이면 어떡하지?";
  }

  if (month.eventType === "sideways") {
    return "다른 건 다 오르는 것 같은데, 왜 이것만 제자리일까?";
  }

  return "아무 일도 없네. 이걸 계속 들고 있는 게 맞나?";
}

function getTangibleValueLabel(amount: number) {
  const absoluteAmount = Math.abs(amount);

  if (absoluteAmount >= 1_000_000_000) {
    return "서울 아파트 전세금급";
  }

  if (absoluteAmount >= 300_000_000) {
    return "수도권 전세 보증금급";
  }

  if (absoluteAmount >= 100_000_000) {
    return "아파트 계약금급";
  }

  if (absoluteAmount >= 50_000_000) {
    return "국산 대형차 한 대 값";
  }

  if (absoluteAmount >= 20_000_000) {
    return "중형차 한 대 값";
  }

  if (absoluteAmount >= 10_000_000) {
    return "월급 몇 달치";
  }

  if (absoluteAmount >= 3_000_000) {
    return "생활비 몇 달치";
  }

  return "무시하기 어려운 현금";
}

function getTangibleLine(month: EmotionMonth) {
  if (month.monthlyChangeKrw < -1_000_000) {
    return `이번 달에만 ${formatKrw(Math.abs(month.monthlyChangeKrw))}이 사라졌습니다. 계좌에서 빠져나간 돈은 ${getTangibleValueLabel(month.monthlyChangeKrw)}에 가깝습니다.`;
  }

  if (
    (month.eventType === "milestone" || month.eventType === "surge" || month.eventType === "breakout") &&
    month.missedAmount > 1_000_000
  ) {
    return `이 달에 팔았다면 이후 ${formatKrw(month.missedAmount)}을 놓칩니다. ${getTangibleValueLabel(month.missedAmount)}를 눈앞에서 보낸 규모입니다.`;
  }

  if (month.monthlyChangeKrw > 1_000_000) {
    return `이번 달에만 ${formatKrw(month.monthlyChangeKrw)}이 불어났습니다. 갑자기 ${getTangibleValueLabel(month.monthlyChangeKrw)}이 생긴 듯한 착각을 부르는 달입니다.`;
  }

  return "숫자는 작아 보여도, 이런 달이 반복되면 사람은 결국 더 자극적인 선택을 찾게 됩니다.";
}

function getNoiseLine(month: EmotionMonth) {
  if (month.eventType === "crash" || month.eventType === "underPrincipal") {
    return "뉴스는 침체를 말하고, 주변 사람은 현금이 답이라고 말합니다. 내 계좌만 틀린 선택처럼 보이는 달입니다.";
  }

  if (month.eventType === "deepDrawdown" || month.eventType === "pullback") {
    return "옆 사람은 이미 익절했다며 편하게 예금 넣었다고 말합니다. 남은 사람만 바보가 된 것 같은 달입니다.";
  }

  if (month.eventType === "milestone" || month.eventType === "surge") {
    return "주변에서는 줄 때 먹으라는 말이 가장 그럴듯하게 들립니다. 수익을 지키고 싶은 마음이 장기 수익을 밀어냅니다.";
  }

  if (month.eventType === "sideways" || month.eventType === "quiet") {
    return "세상은 다른 테마로 축제 분위기인데 내 자산만 제자리입니다. 소외감은 조용하지만 꽤 치명적입니다.";
  }

  if (month.eventType === "breakout" || month.eventType === "firstProfit") {
    return "주변에서는 드디어 탈출할 기회라고 말합니다. 오래 물린 사람일수록 이 조언이 가장 달콤하게 들립니다.";
  }

  return "분위기는 좋아졌지만 확신은 없습니다. 상승장에서도 사람은 계속 팔아야 할 이유를 찾습니다.";
}

function getCriticalChainKind(month: EmotionMonth) {
  if (
    month.eventType === "crash" ||
    month.eventType === "deepDrawdown" ||
    month.eventType === "pullback" ||
    month.eventType === "underPrincipal"
  ) {
    return "pain";
  }

  if (month.eventType === "milestone" || month.eventType === "surge" || month.eventType === "breakout") {
    return "temptation";
  }

  if (month.eventType === "quiet" || month.eventType === "sideways") {
    return "stagnation";
  }

  return "normal";
}

function getCriticalChainLabel(kind: string, months: number) {
  if (kind === "pain") {
    return `${months}개월 연속 멘탈 타격`;
  }

  if (kind === "temptation") {
    return `${months}개월 연속 익절 유혹`;
  }

  if (kind === "stagnation") {
    return `${months}개월 연속 소외감`;
  }

  return null;
}

function applyCriticalChains(months: EmotionMonth[]) {
  const enriched = months.map((month) => ({ ...month }));
  let start = 0;

  while (start < enriched.length) {
    const kind = getCriticalChainKind(enriched[start]!);
    let end = start + 1;

    while (end < enriched.length && getCriticalChainKind(enriched[end]!) === kind) {
      end += 1;
    }

    const runLength = end - start;
    const chainLabel = kind !== "normal" && runLength >= 3 ? getCriticalChainLabel(kind, runLength) : null;

    if (chainLabel) {
      for (let index = start; index < end; index += 1) {
        enriched[index] = {
          ...enriched[index]!,
          chainLabel,
          chainMonths: runLength,
          criticalZone: true,
        };
      }
    }

    start = end;
  }

  return enriched;
}

function getEmotionVerdict(month: EmotionMonth) {
  if (month.eventType === "breakout") {
    return `전고점 회복까지 ${month.peakWaitMonths}개월이 걸렸습니다. 많은 사람은 이 순간을 승리로 착각하고, 진짜 장기 수익이 시작되기 전에 계좌를 닫습니다.`;
  }

  if (month.eventType === "crash") {
    return `계좌에 찍힌 손실액이 커질수록 이성은 마비됩니다. 이 구간을 버티는 건 의지가 아니라 앱을 지워버리는 시스템입니다.`;
  }

  if (month.eventType === "underPrincipal") {
    return "이 달을 버티는 건 의지보다 구조의 문제입니다. 계좌 앱을 지우고 자동이체만 남기는 사람이 오히려 더 오래 살아남습니다.";
  }

  if (month.eventType === "deepDrawdown") {
    return `전고점 대비 ${formatPct(month.drawdownPct)}까지 밀렸습니다. 수익은 남아 있어도, 이미 번 돈이 사라지는 장면은 원금 손실만큼 사람을 흔듭니다.`;
  }

  if (month.eventType === "firstProfit") {
    return "본전 회복은 축하할 일이지만 동시에 가장 위험한 탈출 신호입니다. 여기서 나가면 고통은 끝나지만 복리도 함께 끝납니다.";
  }

  if (month.eventType === "milestone") {
    return `단지 수익을 확정 짓고 마음 편해지고 싶다는 이유로 내렸다면, 이 계좌가 더 큰 괴물이 되는 장면을 밖에서 지켜봐야 했습니다.`;
  }

  if (month.eventType === "surge") {
    return `한 달 수익률만 ${formatPct(month.monthlyReturnPct)}입니다. 이런 달일수록 내가 천재가 된 것 같지만, 대부분의 조기 매도는 바로 이 착각에서 시작됩니다.`;
  }

  if (month.eventType === "pullback") {
    return "수익을 잃는 고통은 손실만큼 날카롭습니다. 장기투자는 돈을 버는 순간에도 계속 흔들립니다.";
  }

  if (month.eventType === "recovery") {
    return `긴 터널을 지나 다시 위로 올라선 달입니다. 이 순간은 예측을 잘한 사람이 아니라, 소음과 유혹을 견디고 시장에 남아 있던 사람에게만 열립니다.`;
  }

  if (month.eventType === "sideways") {
    return "폭락보다 무서운 게 소외감입니다. 남들이 돈 벌 때 내 자산만 멈춰 있으면 갈아타고 싶어집니다. 그리고 이상하게 내가 팔자마자 랠리가 시작됩니다.";
  }

  return "조용한 달도 장기투자의 일부입니다. 아무 일도 없어 보이는 시간이 쌓여야, 나중에 한 번의 큰 움직임을 온전히 가져갈 수 있습니다.";
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
  let monthsSinceEmotionPeak = 0;
  const rawEmotionMonths = points.map((point, index) => {
    const value = getValue(point, assetId);
    const previousValue = index > 0 ? getValue(points[index - 1]!, assetId) : startValue;
    const monthlyReturnPct = previousValue > 0 ? (value / previousValue - 1) * 100 : 0;
    const previousPeak = emotionPeak;
    const previousPeakWaitMonths = monthsSinceEmotionPeak;
    const isBreakout = index > 0 && previousPeakWaitMonths > 0 && value > previousPeak * 1.005;
    const isAth = value >= previousPeak;

    if (isAth) {
      emotionPeak = value;
      monthsSinceEmotionPeak = 0;
    } else {
      monthsSinceEmotionPeak += 1;
    }

    const drawdownPct = emotionPeak > 0 ? (value / emotionPeak - 1) * 100 : 0;
    const totalReturnPct = startValue > 0 ? (value / startValue - 1) * 100 : 0;
    const emotion = getEmotionEvent({
      drawdownPct,
      isAth,
      isBreakout,
      monthlyReturnPct,
      peakWaitMonths: previousPeakWaitMonths,
      previousValue,
      startValue,
      totalReturnPct,
      value,
    });

    const month: EmotionMonth = {
      chainLabel: null,
      chainMonths: 0,
      criticalZone: false,
      date: point.date,
      drawdownPct,
      eventType: emotion.eventType,
      futureMasked: false,
      impulseLabel: emotion.impulseLabel,
      label: emotion.label,
      marker: emotion.marker,
      missedAmount: Math.max(0, finalValue - value),
      mindLine: "",
      monthIndex: index,
      monthlyChangeKrw: value - previousValue,
      monthlyReturnPct,
      note: "",
      noiseLine: "",
      peakBreakout: isBreakout,
      peakWaitMonths: previousPeakWaitMonths,
      previousValue,
      tangibleLine: "",
      tone: emotion.tone,
      totalReturnPct,
      value,
      verdict: "",
    };
    const verdict = getEmotionVerdict(month);
    const tangibleLine = getTangibleLine(month);
    const noiseLine = getNoiseLine(month);

    return {
      ...month,
      mindLine: getEmotionMindLine(month),
      note: verdict,
      noiseLine,
      tangibleLine,
      verdict,
    };
  });
  const dedupedEmotionMonths = Array.from(
    rawEmotionMonths
      .reduce((map, month) => {
        map.set(month.date.slice(0, 7), month);
        return map;
      }, new Map<string, EmotionMonth>())
      .values(),
  );
  const emotionMonths = applyCriticalChains(dedupedEmotionMonths);

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

function getEventTone(month: EmotionMonth): RaceEventTone {
  if (month.tone === "panic" || month.tone === "underwater") {
    return "danger";
  }

  if (month.tone === "temptation") {
    return "temptation";
  }

  if (month.tone === "recovery") {
    return "recovery";
  }

  return "neutral";
}

function buildRaceEventStops(analysis: PainAnalysis | null): RaceEventStop[] {
  if (!analysis) {
    return [];
  }

  const stops = new Map<string, RaceEventStop>();
  const addStop = (month: EmotionMonth | undefined, fallbackTitle?: string) => {
    if (!month || stops.has(month.date)) {
      return;
    }

    const isDrop = month.monthlyChangeKrw < 0;
    const absChange = Math.abs(month.monthlyChangeKrw);
    stops.set(month.date, {
      date: month.date,
      description:
        month.eventType === "milestone"
          ? "여기서 팔면 이미 이긴 것처럼 보입니다. 하지만 장기투자의 가장 큰 유혹은 바로 작은 성공입니다."
          : month.eventType === "breakout"
            ? "드디어 고점을 되찾은 달입니다. 많은 사람은 이 순간 고통이 끝났다며 계좌를 닫습니다."
            : isDrop
              ? "벌었다고 믿었던 돈이 계좌에서 빠져나가는 장면입니다. 숫자는 지나가도 감정은 오래 남습니다."
              : "계좌가 좋아지는 달에도 마음은 편하지 않습니다. 올라갈수록 팔고 싶은 이유도 커집니다.",
      id: `race-stop-${month.date}`,
      index: month.monthIndex,
      moneyLabel: isDrop
        ? `${formatKrw(absChange)} 사라짐`
        : month.totalReturnPct >= 100
          ? `원금 대비 ${formatMultiple(month.value / PRINCIPAL_KRW)}`
          : `${formatKrw(absChange)} 증가`,
      title: fallbackTitle ?? month.label,
      tone: getEventTone(month),
    });
  };

  const byDate = new Map(analysis.emotionMonths.map((month) => [month.date, month] as const));
  const firstTwoX = analysis.milestones.find((milestone) => milestone.multiple === 2);
  const firstFiveX = analysis.milestones.find((milestone) => milestone.multiple === 5);
  const worstMonth = [...analysis.emotionMonths].sort(
    (left, right) => left.monthlyReturnPct - right.monthlyReturnPct,
  )[0];
  const biggestDrawdown = [...analysis.emotionMonths].sort(
    (left, right) => left.drawdownPct - right.drawdownPct,
  )[0];
  const bestMonth = [...analysis.emotionMonths].sort(
    (left, right) => right.monthlyReturnPct - left.monthlyReturnPct,
  )[0];
  const breakout = analysis.emotionMonths.find((month) => month.eventType === "breakout");
  const criticalChain = [...analysis.emotionMonths]
    .filter((month) => month.criticalZone)
    .sort((left, right) => right.chainMonths - left.chainMonths)[0];

  addStop(firstTwoX ? byDate.get(firstTwoX.date) : undefined, "첫 2배의 유혹");
  addStop(firstFiveX ? byDate.get(firstFiveX.date) : undefined, "첫 5배의 유혹");
  addStop(worstMonth, "최악의 한 달");
  addStop(biggestDrawdown, "고점 대비 가장 아픈 달");
  addStop(criticalChain, "연속으로 흔들린 구간");
  addStop(breakout, "전고점 재돌파");
  addStop(bestMonth, "가장 크게 오른 달");

  return [...stops.values()]
    .filter((stop) => stop.index > 0)
    .sort((left, right) => left.index - right.index)
    .slice(0, 5);
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
  const skipRacePauseRef = useRef<string | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>("home");
  const [assetTab, setAssetTab] = useState<AssetTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<ComparisonAssetId>("nvda");
  const [searchSelectedAssetId, setSearchSelectedAssetId] = useState<ComparisonAssetId>("nvda");
  const [raceBuild, setRaceBuild] = useState<RaceBuildResult | null>(null);
  const [raceError, setRaceError] = useState("");
  const [raceStatus, setRaceStatus] = useState<RaceStatus>("idle");
  const [raceViewMode, setRaceViewMode] = useState<RaceViewMode>("auto");
  const [visibleCount, setVisibleCount] = useState(0);
  const [autoStartIndex, setAutoStartIndex] = useState(0);
  const [raceFurthestIndex, setRaceFurthestIndex] = useState(0);
  const [lastCompletedAssetId, setLastCompletedAssetId] = useState<ComparisonAssetId | null>(null);
  const [activeRaceEventId, setActiveRaceEventId] = useState<string | null>(null);
  const [raceCheckpointProgress, setRaceCheckpointProgress] = useState(0);

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
  const raceEventStops = useMemo(() => buildRaceEventStops(analysis), [analysis]);
  const activeRaceEvent = useMemo(
    () => raceEventStops.find((stop) => stop.id === activeRaceEventId) ?? null,
    [activeRaceEventId, raceEventStops],
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
      setRaceViewMode("auto");
      setVisibleCount(0);
      setAutoStartIndex(0);
      setRaceFurthestIndex(0);
      setActiveRaceEventId(null);
      setRaceCheckpointProgress(0);
      skipRacePauseRef.current = null;

      window.requestAnimationFrame(() => {
        raceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      try {
        const build = await loadRaceBuild(nextAssetId);
        setRaceBuild(build);
        setVisibleCount(1);
        setRaceFurthestIndex(0);
        setRaceStatus("racing");
      } catch (error) {
        setRaceStatus("idle");
        setRaceError(error instanceof Error ? error.message : "레이스를 시작하지 못했습니다.");
      }
    },
    [selectedAssetId],
  );

  useEffect(() => {
    if (raceStatus !== "racing" || raceViewMode !== "auto" || !raceBuild) {
      return;
    }

    let frameId = 0;
    const startedAt = performance.now();
    let skippedPauseMs = 0;
    const lastPointIndex = Math.max(1, raceBuild.points.length - 1);
    const startIndex = Math.min(Math.max(0, autoStartIndex), lastPointIndex);
    const startActiveMs = (startIndex / lastPointIndex) * RACE_ACTIVE_DURATION_MS;
    const eventStops = raceEventStops.filter(
      (stop) => stop.index > startIndex && stop.index < raceBuild.points.length - 1,
    );
    const totalPauseMs = eventStops.length * RACE_EVENT_PAUSE_MS;
    const totalDurationMs = Math.max(0, RACE_ACTIVE_DURATION_MS - startActiveMs) + totalPauseMs;

    const tick = (timestamp: number) => {
      const rawElapsed = Math.max(0, timestamp - startedAt);
      let elapsed = rawElapsed + skippedPauseMs;
      let consumedPauseMs = 0;
      let activeElapsedMs = startActiveMs + elapsed;
      let pausedEvent: RaceEventStop | null = null;
      let checkpointProgress = 0;

      for (const stop of eventStops) {
        const stopTimeMs = (stop.index / lastPointIndex) * RACE_ACTIVE_DURATION_MS;
        const pauseStartMs = stopTimeMs - startActiveMs + consumedPauseMs;
        const pauseEndMs = pauseStartMs + RACE_EVENT_PAUSE_MS;

        if (elapsed < pauseStartMs) {
          break;
        }

        if (elapsed >= pauseStartMs && elapsed < pauseEndMs) {
          if (skipRacePauseRef.current === stop.id) {
            skippedPauseMs += pauseEndMs - elapsed;
            skipRacePauseRef.current = null;
            elapsed = rawElapsed + skippedPauseMs;
            consumedPauseMs += RACE_EVENT_PAUSE_MS;
            activeElapsedMs = startActiveMs + elapsed - consumedPauseMs;
            continue;
          }

          activeElapsedMs = stopTimeMs;
          pausedEvent = stop;
          checkpointProgress = ((elapsed - pauseStartMs) / RACE_EVENT_PAUSE_MS) * 100;
          break;
        }

        consumedPauseMs += RACE_EVENT_PAUSE_MS;
        activeElapsedMs = startActiveMs + elapsed - consumedPauseMs;
      }

      const progress = Math.min(1, activeElapsedMs / RACE_ACTIVE_DURATION_MS);
      const nextIndex = Math.min(lastPointIndex, Math.round(lastPointIndex * progress));
      setVisibleCount(nextIndex + 1);
      setRaceFurthestIndex((previousIndex) => Math.max(previousIndex, nextIndex));
      setActiveRaceEventId(pausedEvent?.id ?? null);
      setRaceCheckpointProgress(Math.min(100, Math.max(0, checkpointProgress)));

      if (elapsed < totalDurationMs) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      setVisibleCount(raceBuild.points.length);
      setRaceFurthestIndex(lastPointIndex);
      setActiveRaceEventId(null);
      setRaceCheckpointProgress(0);
      setRaceStatus("complete");
      setLastCompletedAssetId(selectedAssetId);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [autoStartIndex, raceBuild, raceEventStops, raceStatus, raceViewMode, selectedAssetId]);

  const continueRaceFromCheckpoint = useCallback((eventId: string) => {
    skipRacePauseRef.current = eventId;
    setActiveRaceEventId(null);
    setRaceCheckpointProgress(0);
  }, []);

  const enterManualExplore = useCallback(() => {
    skipRacePauseRef.current = null;
    setRaceViewMode("manual");
    setActiveRaceEventId(null);
    setRaceCheckpointProgress(0);
  }, []);

  const seekRaceIndex = useCallback(
    (index: number) => {
      if (!raceBuild) {
        return;
      }

      const lastIndex = Math.max(0, raceBuild.points.length - 1);
      const allowedMaxIndex = raceStatus === "complete" ? lastIndex : Math.min(raceFurthestIndex, lastIndex);
      const nextIndex = Math.min(allowedMaxIndex, Math.max(0, Math.round(index)));
      skipRacePauseRef.current = null;
      setRaceViewMode("manual");
      setActiveRaceEventId(null);
      setRaceCheckpointProgress(0);
      setVisibleCount(nextIndex + 1);
    },
    [raceBuild, raceFurthestIndex, raceStatus],
  );

  const resumeAutoRace = useCallback(() => {
    if (!raceBuild) {
      return;
    }

    const lastIndex = Math.max(0, raceBuild.points.length - 1);
    const currentIndex = Math.min(lastIndex, Math.max(0, visibleCount - 1));
    const startIndex = currentIndex >= lastIndex ? 0 : currentIndex;

    skipRacePauseRef.current = null;
    setActiveRaceEventId(null);
    setRaceCheckpointProgress(0);
    setAutoStartIndex(startIndex);
    setVisibleCount(startIndex + 1);
    setRaceViewMode("auto");
    setRaceStatus("racing");
  }, [raceBuild, visibleCount]);

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
                <EmptyRaceGuide />
              ) : (
                <RaceStage
                  activeRaceEvent={activeRaceEvent}
                  analysis={analysis}
                  currentPoint={currentPoint}
                  checkpointProgressPct={raceCheckpointProgress}
                  onContinueCheckpoint={continueRaceFromCheckpoint}
                  onEnterManualExplore={enterManualExplore}
                  onOpenSearch={() => setActiveBottomTab("search")}
                  onRestart={() => void startRace(selectedAssetId)}
                  onResumeAutoRace={resumeAutoRace}
                  onSeekRaceIndex={seekRaceIndex}
                  raceAssets={raceAssets}
                  raceBuild={raceBuild}
                  raceEventStops={raceEventStops}
                  raceFurthestIndex={raceFurthestIndex}
                  raceStatus={raceStatus}
                  raceViewMode={raceViewMode}
                  selectedAssetId={selectedAssetId}
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
  onStart,
  selectedMeta,
}: {
  onStart: () => void;
  selectedMeta: LabAssetMeta;
}) {
  return (
    <SectionCard className="overflow-hidden p-5">
      <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-600">
        1,000만 원 · 실제 10년 데이터
      </div>
      <h1 className="mt-3 text-[2.25rem] font-black leading-[1.02] tracking-[-0.09em] text-slate-950">
        샀다면 얼마였고,
        <br />
        버틸 수 있었을까?
      </h1>
      <p className="mt-3 text-[15px] font-semibold leading-7 text-slate-600">
        과거 수익률만 보여주지 않습니다. 그 돈이 불어나는 동안 계좌가 얼마나 흔들렸는지까지
        같이 봅니다.
      </p>

      <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">오늘의 기본 실험</div>
            <div className="text-2xl font-black tracking-[-0.06em] text-slate-950">
              {selectedMeta.name}
            </div>
            <div className="mt-1 text-sm font-bold text-slate-500">
              {selectedMeta.ticker} · {selectedMeta.theme}
            </div>
          </div>
          <div className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-500 shadow-sm">
            기본값
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{selectedMeta.oneLiner}</p>
      </div>

      <button
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[22px] bg-slate-950 px-5 py-4 text-[15px] font-black text-[#f8fafc] shadow-[0_18px_38px_rgba(15,23,42,0.22)]"
        onClick={onStart}
        type="button"
      >
        10년 레이스 시작하기
        <ChevronRight size={18} />
      </button>
      <p className="mt-3 text-center text-xs font-bold text-slate-400">
        다른 종목은 하단 자산 탭에서 고를 수 있습니다.
      </p>
    </SectionCard>
  );
}

function EmptyRaceGuide() {
  return (
    <SectionCard>
      <div className="flex items-center gap-2 text-sm font-black text-slate-500">
        <LineChart size={17} />
        결과는 아직 잠겨 있습니다
      </div>
      <p className="mt-3 text-lg font-black leading-7 tracking-[-0.05em] text-slate-950">
        먼저 10년 레이스를 끝까지 달려야 합니다.
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        최종 수익률을 먼저 보면 나도 벌었겠다는 착각에 빠집니다. 레그렛제로는 결과보다
        흔들리는 시간을 먼저 보여줍니다.
      </p>
      <div className="mt-4 rounded-[20px] bg-slate-50 px-4 py-3 text-xs font-black text-slate-500">
        다른 종목은 하단 자산 탭에서 선택합니다.
      </div>
    </SectionCard>
  );
}

function RaceStage({
  activeRaceEvent,
  analysis,
  checkpointProgressPct,
  currentPoint,
  onContinueCheckpoint,
  onEnterManualExplore,
  onOpenSearch,
  onRestart,
  onResumeAutoRace,
  onSeekRaceIndex,
  raceAssets,
  raceBuild,
  raceEventStops,
  raceFurthestIndex,
  raceStatus,
  raceViewMode,
  selectedAssetId,
  selectedMeta,
  visibleData,
}: {
  activeRaceEvent: RaceEventStop | null;
  analysis: PainAnalysis | null;
  checkpointProgressPct: number;
  currentPoint: RacePoint | null;
  onContinueCheckpoint: (eventId: string) => void;
  onEnterManualExplore: () => void;
  onOpenSearch: () => void;
  onRestart: () => void;
  onResumeAutoRace: () => void;
  onSeekRaceIndex: (index: number) => void;
  raceAssets: RaceChartAsset[];
  raceBuild: RaceBuildResult | null;
  raceEventStops: RaceEventStop[];
  raceFurthestIndex: number;
  raceStatus: RaceStatus;
  raceViewMode: RaceViewMode;
  selectedAssetId: ComparisonAssetId;
  selectedMeta: LabAssetMeta;
  visibleData: RacePoint[];
}) {
  const isComplete = raceStatus === "complete" && analysis;
  const selectedValue = currentPoint ? getValue(currentPoint, selectedAssetId) : PRINCIPAL_KRW;
  const previousPoint = visibleData.length > 1 ? visibleData[visibleData.length - 2]! : null;
  const previousValue = previousPoint ? getValue(previousPoint, selectedAssetId) : selectedValue;
  const monthlyChangeKrw = selectedValue - previousValue;
  const monthlyReturnPct = previousValue > 0 ? (selectedValue / previousValue - 1) * 100 : 0;
  const currentIndex = currentPoint?.index ?? 0;
  const visiblePeak = raceBuild
    ? raceBuild.points
        .slice(0, Math.max(1, currentIndex + 1))
        .reduce((peak, point) => Math.max(peak, getValue(point, selectedAssetId)), PRINCIPAL_KRW)
    : PRINCIPAL_KRW;
  const drawdownFromPeak = selectedValue - visiblePeak;
  const progressPct =
    raceBuild && raceBuild.points.length > 1
      ? Math.min(100, Math.max(0, (currentIndex / (raceBuild.points.length - 1)) * 100))
      : 0;
  const currentDate = currentPoint?.date ?? raceBuild?.resolvedStartDate ?? "";

  return (
    <div className="space-y-5">
      <SectionCard className="p-3">
        <RaceTimeRail
          currentDate={currentDate}
          eventCount={raceEventStops.length}
          isPaused={Boolean(activeRaceEvent)}
          progressPct={progressPct}
          raceStatus={raceStatus}
          raceViewMode={raceViewMode}
          rangeLabel={raceBuild ? formatDateRange(raceBuild.resolvedStartDate, raceBuild.resolvedEndDate) : ""}
          selectedName={selectedMeta.name}
        />
        <RaceExploreControls
          currentIndex={currentIndex}
          currentPoint={currentPoint}
          onEnterManualExplore={onEnterManualExplore}
          onResumeAutoRace={onResumeAutoRace}
          onSeekRaceIndex={onSeekRaceIndex}
          raceBuild={raceBuild}
          raceEventStops={raceEventStops}
          raceFurthestIndex={raceFurthestIndex}
          raceStatus={raceStatus}
          raceViewMode={raceViewMode}
        />
        <div className="relative">
          <RaceChart
            assets={raceAssets}
            basisLabel="1.0배 = 1,000만원"
            checkpointActive={Boolean(activeRaceEvent)}
            compact
            currentPoint={currentPoint}
            data={visibleData}
            fullData={raceBuild?.points ?? []}
            headerSubtitle=""
            headerTitle=""
            isLoading={raceStatus === "loading" || !raceBuild}
            principalKrw={PRINCIPAL_KRW}
          />
          {activeRaceEvent ? (
            <>
              <div className="pointer-events-none absolute inset-2 z-[8] rounded-[22px] bg-slate-950/16 backdrop-blur-[1px]" />
              <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full border border-amber-200 bg-white/92 px-3 py-1.5 text-[11px] font-black text-amber-700 shadow-[0_10px_24px_rgba(15,23,42,0.14)]">
                체크포인트 · {formatMonth(activeRaceEvent.date)}
              </div>
            </>
          ) : null}
        </div>
        <RaceAccountPulseCard
          activeEvent={activeRaceEvent}
          checkpointProgressPct={checkpointProgressPct}
          currentDate={currentDate}
          drawdownFromPeak={drawdownFromPeak}
          monthlyChangeKrw={monthlyChangeKrw}
          onContinueCheckpoint={onContinueCheckpoint}
          monthlyReturnPct={monthlyReturnPct}
          raceStatus={raceStatus}
          raceViewMode={raceViewMode}
          selectedMeta={selectedMeta}
          value={selectedValue}
          visiblePeak={visiblePeak}
        />
      </SectionCard>

      {isComplete ? (
        <>
          <ResultSummary analysis={analysis} selectedMeta={selectedMeta} />
          <PainDashboard analysis={analysis} />
          <TemptationDashboard analysis={analysis} />
          <EmotionMap
            analysis={analysis}
            key={`${analysis.resolvedStartDate}-${analysis.resolvedEndDate}-${Math.round(analysis.finalValue)}`}
          />
          <RegretZeroJudgement
            analysis={analysis}
            onOpenSearch={onOpenSearch}
            onRestart={onRestart}
          />
        </>
      ) : null}
    </div>
  );
}

function RaceExploreControls({
  currentIndex,
  currentPoint,
  onEnterManualExplore,
  onResumeAutoRace,
  onSeekRaceIndex,
  raceBuild,
  raceEventStops,
  raceFurthestIndex,
  raceStatus,
  raceViewMode,
}: {
  currentIndex: number;
  currentPoint: RacePoint | null;
  onEnterManualExplore: () => void;
  onResumeAutoRace: () => void;
  onSeekRaceIndex: (index: number) => void;
  raceBuild: RaceBuildResult | null;
  raceEventStops: RaceEventStop[];
  raceFurthestIndex: number;
  raceStatus: RaceStatus;
  raceViewMode: RaceViewMode;
}) {
  if (!raceBuild || raceStatus === "loading") {
    return null;
  }

  const lastIndex = Math.max(0, raceBuild.points.length - 1);
  const availableMaxIndex = raceStatus === "complete" ? lastIndex : Math.min(raceFurthestIndex, lastIndex);
  const safeCurrentIndex = Math.min(currentIndex, availableMaxIndex);
  const previousEvent = [...raceEventStops].reverse().find((event) => event.index < safeCurrentIndex) ?? null;
  const nextEvent =
    raceEventStops.find((event) => event.index > safeCurrentIndex && event.index <= availableMaxIndex) ?? null;
  const currentMonthLabel = currentPoint ? formatMonth(currentPoint.date) : formatMonth(raceBuild.resolvedStartDate);
  const currentPositionLabel = `${Math.min(safeCurrentIndex + 1, raceBuild.points.length)} / ${raceBuild.points.length}개월`;
  const isManual = raceViewMode === "manual";
  const helperText =
    raceStatus === "complete"
      ? "완주한 뒤에는 전체 10년을 마음대로 훑어볼 수 있습니다. 어디서 흔들렸을지 하나씩 눌러보세요."
      : "아직 보지 않은 미래는 열어두지 않습니다. 지나간 달만 되감아 보면서 그 순간의 계좌를 다시 확인하세요.";

  return (
    <div className="mb-3 rounded-[22px] border border-slate-200 bg-white px-3.5 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div className="grid grid-cols-2 gap-2 rounded-[18px] bg-slate-100 p-1">
        <button
          className={`rounded-[15px] px-3 py-2 text-xs font-black transition ${
            !isManual ? "bg-slate-950 text-[#f8fafc] shadow-sm" : "text-slate-500"
          }`}
          onClick={onResumeAutoRace}
          type="button"
        >
          자동 감상
        </button>
        <button
          className={`rounded-[15px] px-3 py-2 text-xs font-black transition ${
            isManual ? "bg-slate-950 text-[#f8fafc] shadow-sm" : "text-slate-500"
          }`}
          onClick={onEnterManualExplore}
          type="button"
        >
          직접 탐색
        </button>
      </div>

      {isManual ? (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-500">
                직접 탐색 중
              </div>
              <div className="mt-1 text-lg font-black tracking-[-0.06em] text-slate-950">
                {currentMonthLabel}
              </div>
            </div>
            <div className="rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-500">
              {currentPositionLabel}
            </div>
          </div>

          <input
            aria-label="월별 레이스 지점 선택"
            className="mt-3 w-full accent-slate-950"
            max={availableMaxIndex}
            min={0}
            onChange={(event) => onSeekRaceIndex(Number(event.currentTarget.value))}
            onInput={(event) => onSeekRaceIndex(Number(event.currentTarget.value))}
            type="range"
            value={safeCurrentIndex}
          />

          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              className="rounded-[17px] border border-slate-200 bg-slate-50 px-2 py-2.5 text-[11px] font-black text-slate-600 disabled:opacity-35"
              disabled={!previousEvent}
              onClick={() => previousEvent && onSeekRaceIndex(previousEvent.index)}
              type="button"
            >
              이전 장면
            </button>
            <button
              className="rounded-[17px] bg-slate-950 px-2 py-2.5 text-[11px] font-black text-[#f8fafc] shadow-sm"
              onClick={onResumeAutoRace}
              type="button"
            >
              여기서 재생
            </button>
            <button
              className="rounded-[17px] border border-slate-200 bg-slate-50 px-2 py-2.5 text-[11px] font-black text-slate-600 disabled:opacity-35"
              disabled={!nextEvent}
              onClick={() => nextEvent && onSeekRaceIndex(nextEvent.index)}
              type="button"
            >
              다음 장면
            </button>
          </div>

          <div className="mt-3 rounded-[17px] bg-slate-50 px-3 py-2 text-[11px] font-bold leading-5 text-slate-500">
            {helperText}
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-[18px] bg-slate-50 px-3 py-2.5">
          <div className="text-[11px] font-bold leading-5 text-slate-500">
            지나간 달을 다시 보고 싶으면 직접 탐색으로 멈출 수 있습니다.
          </div>
          <button
            className="shrink-0 rounded-[15px] bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm"
            onClick={onEnterManualExplore}
            type="button"
          >
            멈춰보기
          </button>
        </div>
      )}
    </div>
  );
}

function RaceTimeRail({
  currentDate,
  eventCount,
  isPaused,
  progressPct,
  raceStatus,
  raceViewMode,
  rangeLabel,
  selectedName,
}: {
  currentDate: string;
  eventCount: number;
  isPaused: boolean;
  progressPct: number;
  raceStatus: RaceStatus;
  raceViewMode: RaceViewMode;
  rangeLabel: string;
  selectedName: string;
}) {
  const statusLabel =
    raceViewMode === "manual"
      ? "직접 탐색 중"
      : raceStatus === "loading"
      ? "과거 데이터 불러오는 중"
      : raceStatus === "complete"
        ? "레이스 완료"
        : isPaused
          ? "중요 장면 정지"
          : "레이스 진행 중";

  return (
    <div className="mb-3 rounded-[22px] border border-slate-200 bg-white px-3.5 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-blue-500">
            <Clock3 size={14} />
            {statusLabel}
          </div>
          <div className="mt-1 truncate text-lg font-black tracking-[-0.06em] text-slate-950">
            {selectedName} 10년 레이스
          </div>
          <div className="mt-0.5 text-[11px] font-bold text-slate-400">
            {rangeLabel || "실제 월별 데이터 기준"} · 중요 장면 {eventCount}번 정지
          </div>
        </div>
        <div className="shrink-0 rounded-[18px] bg-slate-950 px-3 py-2 text-right text-[#f8fafc] shadow-sm">
          <div className="text-[10px] font-black text-white/45">현재 시점</div>
          <div className="mt-0.5 text-sm font-black tracking-[-0.04em]">
            {currentDate ? formatMonth(currentDate) : "--"}
          </div>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isPaused ? "bg-amber-400" : "bg-blue-500"
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

function RaceAccountPulseCard({
  activeEvent,
  checkpointProgressPct,
  currentDate,
  drawdownFromPeak,
  monthlyChangeKrw,
  onContinueCheckpoint,
  monthlyReturnPct,
  raceStatus,
  raceViewMode,
  selectedMeta,
  value,
  visiblePeak,
}: {
  activeEvent: RaceEventStop | null;
  checkpointProgressPct: number;
  currentDate: string;
  drawdownFromPeak: number;
  monthlyChangeKrw: number;
  onContinueCheckpoint: (eventId: string) => void;
  monthlyReturnPct: number;
  raceStatus: RaceStatus;
  raceViewMode: RaceViewMode;
  selectedMeta: LabAssetMeta;
  value: number;
  visiblePeak: number;
}) {
  const isLoading = raceStatus === "loading";
  const isManual = raceViewMode === "manual";
  const isComplete = raceStatus === "complete" && !isManual;
  const isCheckpoint = Boolean(activeEvent);
  const isDrop = monthlyChangeKrw < 0;
  const isTemptation = value >= PRINCIPAL_KRW * 2 || monthlyReturnPct >= 12;
  const tone: RaceEventTone = activeEvent?.tone ?? (isComplete ? "recovery" : isDrop ? "danger" : isTemptation ? "temptation" : "neutral");
  const toneClass = getRacePulseToneClasses(tone);
  const title = activeEvent
    ? activeEvent.title
    : isLoading
      ? "10년 전 가격을 불러오는 중"
      : isManual
        ? isDrop
          ? "직접 고른 하락 구간"
          : isTemptation
            ? "직접 고른 익절 유혹 구간"
            : "선택한 달의 계좌 상태"
      : isComplete
        ? "레이스가 끝났습니다"
      : isDrop
        ? "돈이 사라지는 달"
        : isTemptation
          ? "팔고 싶은 수익 구간"
          : "계좌가 흔들리는 중";
  const moneyLabel = activeEvent
    ? activeEvent.moneyLabel
    : isLoading
      ? "잠시만 기다려 주세요"
      : isComplete
        ? formatKrw(value)
      : isDrop
        ? `${formatKrw(Math.abs(monthlyChangeKrw))} 사라짐`
        : isTemptation
          ? `원금 대비 ${formatMultiple(value / PRINCIPAL_KRW)}`
          : `${formatKrw(Math.abs(monthlyChangeKrw))} 움직임`;
  const description = activeEvent
    ? activeEvent.description
    : isLoading
      ? "결과를 먼저 보여주지 않고, 실제 월별 흐름부터 준비합니다."
      : isManual
        ? "슬라이더로 고른 월입니다. 이 시점의 평가금액과 흔들림을 따로 확인합니다."
      : isComplete
        ? "최종 금액은 아래 표로 정리했습니다. 이제 중요한 건 이 결과를 얻기까지 버텼어야 할 시간입니다."
      : isDrop
        ? "방금 전까지 벌었다고 믿었던 돈이 계좌에서 빠져나가는 중입니다."
        : isTemptation
          ? "여기서 팔면 이긴 것처럼 보입니다. 그래서 더 위험합니다."
          : "최종 결과보다 어려운 건 이 흔들림을 한 달씩 살아내는 일입니다.";

  return (
    <div
      className={`mt-3 border px-4 transition-all duration-300 ${
        isCheckpoint
          ? `rounded-[30px] border-2 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.16)] ${toneClass.container}`
          : `rounded-[24px] py-4 ${toneClass.container}`
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-[11px] font-black uppercase tracking-[0.18em] ${toneClass.eyebrow}`}>
            {isCheckpoint ? "이 장면은 그냥 지나가지 않습니다" : currentDate ? formatMonth(currentDate) : "레이스 준비"}
          </div>
          <h3
            className={`mt-1 font-black leading-tight tracking-[-0.06em] text-slate-950 ${
              isCheckpoint ? "text-2xl" : "text-xl"
            }`}
          >
            {title}
          </h3>
        </div>
        <div className={`rounded-full px-3 py-1.5 text-xs font-black ${toneClass.badge}`}>
          {activeEvent ? "정지" : isManual ? "탐색" : isComplete ? "완료" : isDrop ? "하락" : isTemptation ? "유혹" : "진행"}
        </div>
      </div>
      <div
        className={`mt-3 font-black leading-none tracking-[-0.08em] ${toneClass.value} ${
          isCheckpoint ? "text-[2.25rem]" : "text-[1.75rem]"
        }`}
      >
        {moneyLabel}
      </div>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
        {description}
      </p>
      {activeEvent ? (
        <div className="mt-4 rounded-[22px] border border-slate-200 bg-white px-3 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-black leading-5 text-slate-500">
              잠시 후 자동으로 이어집니다. 지금 이해했다면 바로 넘겨도 됩니다.
            </div>
            <button
              className="shrink-0 rounded-[16px] bg-slate-950 px-4 py-2.5 text-xs font-black text-[#f8fafc] shadow-[0_10px_24px_rgba(15,23,42,0.18)] active:scale-95"
              onClick={() => onContinueCheckpoint(activeEvent.id)}
              type="button"
            >
              계속 달리기
            </button>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-950 transition-[width] duration-100"
              style={{ width: `${checkpointProgressPct}%` }}
            />
          </div>
        </div>
      ) : null}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <RacePulseMetric label="평가금액" value={formatKrw(value)} />
        <RacePulseMetric label="이번 달" value={formatPct(monthlyReturnPct)} warning={monthlyChangeKrw < 0} />
        <RacePulseMetric
          label="고점 대비"
          value={drawdownFromPeak < 0 ? `-${formatKrw(Math.abs(drawdownFromPeak))}` : formatKrw(Math.max(visiblePeak - value, 0))}
          warning={drawdownFromPeak < 0}
        />
      </div>
      {!activeEvent ? (
        <div className="mt-3 rounded-[18px] bg-white/68 px-3 py-2 text-[11px] font-bold leading-5 text-slate-500">
          {selectedMeta.name}, 금은 실제 과거 데이터 기준입니다. 예금은 연 3.04% 복리 기준으로 비교합니다.
        </div>
      ) : null}
    </div>
  );
}

function RacePulseMetric({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="rounded-[17px] bg-white/78 px-2.5 py-2 shadow-sm">
      <div className="text-[10px] font-black text-slate-400">{label}</div>
      <div className={`mt-1 truncate text-xs font-black tracking-[-0.03em] ${warning ? "text-rose-600" : "text-slate-950"}`}>
        {value}
      </div>
    </div>
  );
}

function getRacePulseToneClasses(tone: RaceEventTone) {
  if (tone === "danger") {
    return {
      badge: "bg-rose-100 text-rose-700",
      container: "border-rose-100 bg-rose-50",
      eyebrow: "text-rose-500",
      value: "text-rose-600",
    };
  }

  if (tone === "temptation") {
    return {
      badge: "bg-amber-100 text-amber-700",
      container: "border-amber-100 bg-amber-50",
      eyebrow: "text-amber-600",
      value: "text-amber-700",
    };
  }

  if (tone === "recovery") {
    return {
      badge: "bg-emerald-100 text-emerald-700",
      container: "border-emerald-100 bg-emerald-50",
      eyebrow: "text-emerald-600",
      value: "text-emerald-700",
    };
  }

  return {
    badge: "bg-slate-100 text-slate-600",
    container: "border-slate-200 bg-slate-50",
    eyebrow: "text-blue-500",
    value: "text-slate-950",
  };
}

function ResultSummary({
  analysis,
  selectedMeta,
}: {
  analysis: PainAnalysis;
  selectedMeta: LabAssetMeta;
}) {
  const depositValue = analysis.finalValue - analysis.bankGap;
  const goldValue = analysis.finalValue - analysis.goldGap;
  const rows = [
    {
      badge: "선택 자산",
      label: selectedMeta.name,
      multiple: analysis.finalValue / PRINCIPAL_KRW,
      tone: "primary",
      value: analysis.finalValue,
    },
    {
      badge: "기준선",
      label: "정기예금",
      multiple: depositValue / PRINCIPAL_KRW,
      tone: "muted",
      value: depositValue,
    },
    {
      badge: "보조 기준",
      label: "금",
      multiple: goldValue / PRINCIPAL_KRW,
      tone: "gold",
      value: goldValue,
    },
  ]
    .sort((left, right) => right.value - left.value)
    .map((row, index) => ({ ...row, rank: `${index + 1}위` }));

  return (
    <SectionCard className="overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-500">결과 리포트</div>
        <div className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-500">
          {formatDateRange(analysis.resolvedStartDate, analysis.resolvedEndDate)}
        </div>
      </div>
      <h2 className="mt-3 text-[2.05rem] font-black leading-[1.05] tracking-[-0.08em] text-slate-950">
        1,000만 원이
        <br />
        {formatKrw(analysis.finalValue)}
      </h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
        돈은 이렇게 불어났습니다. 이제부터 봐야 할 건 이 숫자를 얻기까지 버텼어야 할 시간입니다.
      </p>

      <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50">
        <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
          <span>비교 대상</span>
          <span>최종 금액</span>
        </div>
        <div className="divide-y divide-slate-200">
          {rows.map((row) => (
            <div
              className={`grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 ${
                row.tone === "primary"
                  ? "bg-slate-950"
                  : row.tone === "gold"
                    ? "bg-amber-50 text-slate-950"
                    : "bg-white text-slate-950"
              }`}
              key={row.label}
            >
              <div>
                <div
                  className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${
                    row.tone === "primary"
                      ? "bg-white/12 text-slate-200"
                      : row.tone === "gold"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {row.rank} · {row.badge}
                </div>
                <div
                  className={`mt-2 text-base font-black tracking-[-0.04em] ${
                    row.tone === "primary" ? "" : "text-slate-950"
                  }`}
                  style={row.tone === "primary" ? { color: "#f8fafc" } : undefined}
                >
                  {row.label}
                </div>
                <div className={`mt-1 text-xs font-bold ${row.tone === "primary" ? "text-slate-300" : "text-slate-500"}`}>
                  원금 대비 {formatMultiple(row.multiple)}
                </div>
              </div>
              <div
                className={`text-right text-lg font-black tracking-[-0.05em] ${
                  row.tone === "primary" ? "" : "text-slate-950"
                }`}
                style={row.tone === "primary" ? { color: "#f8fafc" } : undefined}
              >
                {formatKrw(row.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-[22px] border border-blue-100 bg-blue-50 px-3 py-3">
          <div className="text-[11px] font-black text-blue-500">예금보다 더 남은 돈</div>
          <div className="mt-1 text-lg font-black tracking-[-0.05em] text-slate-950">
            {formatKrw(analysis.bankGap)}
          </div>
        </div>
        <div className="rounded-[22px] border border-amber-100 bg-amber-50 px-3 py-3">
          <div className="text-[11px] font-black text-amber-600">금보다 더 남은 돈</div>
          <div className="mt-1 text-lg font-black tracking-[-0.05em] text-slate-950">
            {formatKrw(analysis.goldGap)}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-[22px] bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
        누적 수익률 {formatPct(analysis.assetReturnPct)}
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
    return "border-rose-200 bg-rose-100 text-rose-700 shadow-[0_8px_18px_rgba(244,63,94,0.12)]";
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

function getEmotionHighlightTitle(month: EmotionMonth) {
  if (month.criticalZone) {
    return "연속으로 멘탈이 흔들린 구간";
  }

  if (month.eventType === "milestone") {
    return `첫 ${formatMultiple(month.value / PRINCIPAL_KRW)}의 익절 유혹`;
  }

  if (month.peakBreakout) {
    return "드디어 전고점을 다시 뚫은 달";
  }

  if (month.eventType === "crash" || month.eventType === "deepDrawdown") {
    return "가장 포기하고 싶었을 달";
  }

  if (month.eventType === "surge") {
    return "가장 팔고 싶게 오른 달";
  }

  if (month.eventType === "sideways") {
    return "지루함이 제일 위험했던 달";
  }

  return month.label;
}

function getEmotionImpactLine(month: EmotionMonth) {
  if (month.monthlyChangeKrw < 0) {
    return `이번 달에만 ${formatKrw(Math.abs(month.monthlyChangeKrw))} 증발`;
  }

  if (month.totalReturnPct >= 100 && month.missedAmount > 0) {
    return `여기서 팔았다면 ${formatKrw(month.missedAmount)}을 놓침`;
  }

  if (month.peakBreakout) {
    return `고점 회복까지 ${month.peakWaitMonths}개월을 버팀`;
  }

  return `한 달 변동률 ${formatPct(month.monthlyReturnPct)}`;
}

function buildMentalReplayHighlights(analysis: PainAnalysis) {
  const months = analysis.emotionMonths;
  const byDate = new Map(months.map((month) => [month.date, month] as const));
  const selected = new Map<string, EmotionMonth>();
  const add = (month: EmotionMonth | undefined) => {
    if (!month || selected.has(month.date)) {
      return;
    }

    selected.set(month.date, month);
  };

  add([...months].sort((left, right) => left.monthlyReturnPct - right.monthlyReturnPct)[0]);
  add([...months].sort((left, right) => left.drawdownPct - right.drawdownPct)[0]);
  add(analysis.milestones[0] ? byDate.get(analysis.milestones[0].date) : undefined);
  add(months.find((month) => month.peakBreakout));
  add([...months].filter((month) => month.criticalZone).sort((left, right) => right.chainMonths - left.chainMonths)[0]);
  add([...months].sort((left, right) => right.monthlyReturnPct - left.monthlyReturnPct)[0]);

  if (selected.size < 5) {
    [...months]
      .sort((left, right) => {
        const leftScore = Math.abs(left.monthlyReturnPct) + Math.abs(left.drawdownPct) + left.totalReturnPct / 20;
        const rightScore = Math.abs(right.monthlyReturnPct) + Math.abs(right.drawdownPct) + right.totalReturnPct / 20;
        return rightScore - leftScore;
      })
      .forEach(add);
  }

  return [...selected.values()].slice(0, 5);
}

function EmotionMap({ analysis }: { analysis: PainAnalysis }) {
  const highlightMonths = useMemo(() => buildMentalReplayHighlights(analysis), [analysis]);
  const defaultMonth = highlightMonths[0] ?? analysis.emotionMonths[0]!;
  const [selectedDate, setSelectedDate] = useState(defaultMonth.date);
  const [selectedDetailOpen, setSelectedDetailOpen] = useState(false);
  const [showFullMap, setShowFullMap] = useState(false);

  const selectedMonth =
    analysis.emotionMonths.find((month) => month.date === selectedDate) ?? defaultMonth;
  const worstMonth = [...analysis.emotionMonths].sort(
    (left, right) => left.monthlyReturnPct - right.monthlyReturnPct,
  )[0]!;
  const bestMonth = [...analysis.emotionMonths].sort(
    (left, right) => right.monthlyReturnPct - left.monthlyReturnPct,
  )[0]!;
  const motionScore = Math.max(Math.abs(worstMonth.monthlyReturnPct), Math.abs(bestMonth.monthlyReturnPct));
  const motionLabel = motionScore >= 35 ? "극심" : motionScore >= 20 ? "매우 높음" : "높음";
  const years = Array.from(
    analysis.emotionMonths.reduce((map, month) => {
      const year = month.date.slice(0, 4);
      const list = map.get(year) ?? [];
      list.push(month);
      map.set(year, list);
      return map;
    }, new Map<string, EmotionMonth[]>()),
  );
  const toneCounts = analysis.emotionMonths.reduce(
    (counts, month) => {
      counts[month.tone] += 1;
      return counts;
    },
    {
      panic: 0,
      recovery: 0,
      sideways: 0,
      temptation: 0,
      underwater: 0,
    } satisfies Record<EmotionTone, number>,
  );

  return (
    <SectionCard className="pb-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-500">멘탈 리플레이</div>
          <h2 className="mt-2 text-2xl font-black leading-tight tracking-[-0.07em] text-slate-950">
            먼저 봐야 할
            <br />
            위험한 5개월
          </h2>
        </div>
        <div className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-500">
          TOP 5
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
        전체 120개월을 다 보기 전에, 실제로 손이 매도 버튼으로 갔을 법한 달부터 짚어봅니다.
      </p>

      <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              계좌 멀미 지수
            </div>
            <div className="mt-1 text-2xl font-black tracking-[-0.06em] text-slate-950">{motionLabel}</div>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">
            {formatMonth(worstMonth.date)} · {formatPct(worstMonth.monthlyReturnPct)}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
          <div className="rounded-[18px] bg-white px-3 py-2 text-slate-950 shadow-sm">
            <div className="text-[11px] font-black text-slate-500">최악의 한 달</div>
            <div className="mt-1 text-lg font-black text-rose-600">
              {formatPct(worstMonth.monthlyReturnPct)}
            </div>
            <div className="mt-1 text-[10px] font-bold text-slate-400">{formatMonth(worstMonth.date)}</div>
          </div>
          <div className="rounded-[18px] bg-white px-3 py-2 text-slate-950 shadow-sm">
            <div className="text-[11px] font-black text-slate-500">최고의 한 달</div>
            <div className="mt-1 text-lg font-black text-emerald-600">
              {formatPct(bestMonth.monthlyReturnPct)}
            </div>
            <div className="mt-1 text-[10px] font-bold text-slate-400">{formatMonth(bestMonth.date)}</div>
          </div>
        </div>
      </div>

      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(["panic", "underwater", "temptation", "recovery", "sideways"] as EmotionTone[]).map(
          (tone) => (
            <div className="flex min-w-[132px] items-center gap-2 rounded-[18px] bg-slate-50 px-3 py-2" key={tone}>
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

      <div className="mt-4 grid grid-cols-5 gap-1.5 rounded-[22px] bg-slate-50 px-3 py-3">
        {(["panic", "underwater", "temptation", "recovery", "sideways"] as EmotionTone[]).map((tone) => (
          <div className="text-center" key={tone}>
            <div className={`mx-auto h-3 w-3 rounded-full border ${getEmotionToneClasses(tone)}`} />
            <div className="mt-1 text-[10px] font-black text-slate-500">{getEmotionLegendLabel(tone)}</div>
            <div className="text-[10px] font-black text-slate-950">{toneCounts[tone]}개월</div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        {highlightMonths.map((month, index) => {
          const isSelected = selectedMonth.date === month.date && selectedDetailOpen;

          return (
            <div className="space-y-2.5" key={month.date}>
              <button
                className={`w-full rounded-[22px] border bg-white px-3.5 py-3 text-left transition active:scale-[0.99] ${
                  isSelected ? "border-slate-950 shadow-[0_12px_30px_rgba(15,23,42,0.12)]" : "border-slate-200"
                }`}
                onClick={() => {
                  setSelectedDate(month.date);
                  setSelectedDetailOpen(true);
                }}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      {index + 1}번 장면 · {formatMonth(month.date)}
                    </div>
                    <div className="mt-1 text-base font-black leading-5 tracking-[-0.04em] text-slate-950">
                      {getEmotionHighlightTitle(month)}
                    </div>
                    <div className="mt-1 text-xs font-bold leading-5 text-slate-500">
                      {getEmotionImpactLine(month)}
                    </div>
                  </div>
                  <div className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${getEmotionToneClasses(month.tone)}`}>
                    {month.marker || getEmotionLegendLabel(month.tone)}
                  </div>
                </div>
              </button>
              {isSelected && !showFullMap ? (
                <SelectedEmotionMonthCard
                  isOpen
                  onToggle={() => setSelectedDetailOpen(false)}
                  selectedMonth={selectedMonth}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <button
        className="mt-4 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm"
        onClick={() => setShowFullMap((open) => !open)}
        type="button"
      >
        {showFullMap ? "전체 120개월 지도 접기" : "전체 120개월 지도 펼치기"}
      </button>

      {showFullMap ? (
        <div className="mt-5 space-y-4">
          {years.map(([year, months]) => (
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-3 py-3" key={year}>
              <div className="mb-2 text-xs font-black text-slate-400">{year}</div>
              <div className="grid grid-cols-12 gap-1.5">
                {months.map((month) => {
                  const isSelected = selectedMonth.date === month.date;

                  return (
                    <button
                      aria-label={`${formatMonth(month.date)} ${month.label} ${month.impulseLabel}`}
                      className={`relative flex h-8 items-center justify-center rounded-[10px] border text-[9px] font-black transition active:scale-95 ${
                        isSelected ? `${getEmotionToneClasses(month.tone)} ring-2 ring-slate-950/25` : getEmotionToneClasses(month.tone)
                      } ${month.criticalZone ? "outline outline-2 outline-offset-1 outline-rose-300/70" : ""}`}
                      key={month.date}
                      onClick={() => {
                        setSelectedDate(month.date);
                        setSelectedDetailOpen(true);
                      }}
                      type="button"
                    >
                      <span>{month.date.slice(5, 7)}</span>
                      {month.marker || month.criticalZone ? (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] font-black text-slate-950 shadow-sm">
                          {month.criticalZone ? "⚡" : month.marker}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {months.some((month) => month.date === selectedMonth.date) && selectedDetailOpen ? (
                <SelectedEmotionMonthCard
                  isOpen
                  onToggle={() => setSelectedDetailOpen(false)}
                  selectedMonth={selectedMonth}
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}

function SelectedEmotionMonthCard({
  isOpen,
  onToggle,
  selectedMonth,
}: {
  isOpen: boolean;
  onToggle: () => void;
  selectedMonth: EmotionMonth;
}) {
  return (
    <div className="mt-4 rounded-[26px] border border-slate-200 bg-white px-3.5 py-3.5 shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">선택한 달</div>
          <div className="mt-1 text-lg font-black tracking-[-0.05em] text-slate-950">
            {formatMonth(selectedMonth.date)} · {selectedMonth.label}
          </div>
        </div>
        <div className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${getEmotionToneClasses(selectedMonth.tone)}`}>
          {selectedMonth.marker || getEmotionLegendLabel(selectedMonth.tone)}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-800">
          {selectedMonth.impulseLabel}
        </div>
        {selectedMonth.peakBreakout ? (
          <div className="inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-700">
            ↗ 전고점까지 {selectedMonth.peakWaitMonths}개월
          </div>
        ) : null}
        {selectedMonth.chainLabel ? (
          <div className="inline-flex rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700">
            ⚡ {selectedMonth.chainLabel}
          </div>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1">
        <div className="rounded-[15px] bg-slate-50 px-1.5 py-1.5">
          <div className="text-[9px] font-black text-slate-400">평가액</div>
          <div className="mt-1 text-[10px] font-black leading-4 text-slate-950">
            {formatKrw(selectedMonth.value)}
          </div>
        </div>
        <div className="rounded-[15px] bg-slate-50 px-1.5 py-1.5">
          <div className="text-[9px] font-black text-slate-400">한 달</div>
          <div className="mt-1 text-[10px] font-black leading-4 text-slate-950">
            {formatPct(selectedMonth.monthlyReturnPct)}
          </div>
        </div>
        <div className="rounded-[15px] bg-slate-50 px-1.5 py-1.5">
          <div className="text-[9px] font-black text-slate-400">원금</div>
          <div className="mt-1 text-[10px] font-black leading-4 text-slate-950">
            {formatPct(selectedMonth.totalReturnPct)}
          </div>
        </div>
        <div className="rounded-[15px] bg-slate-50 px-1.5 py-1.5">
          <div className="text-[9px] font-black text-slate-400">고점</div>
          <div className="mt-1 text-[10px] font-black leading-4 text-slate-950">
            {formatPct(selectedMonth.drawdownPct)}
          </div>
        </div>
      </div>
      <div className="mt-2 rounded-[18px] bg-amber-50 px-3 py-2">
        <p className="text-sm font-black leading-5 text-slate-900">“{selectedMonth.mindLine}”</p>
      </div>
      <button
        className="mt-2 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black text-slate-600"
        onClick={onToggle}
        type="button"
      >
        {isOpen ? "자세히 닫기" : "그 달의 진짜 압박 보기"}
      </button>
      {isOpen ? (
        <div className="mt-3 space-y-2">
          <div className="rounded-[18px] bg-rose-50 px-3 py-2 text-xs font-bold leading-5 text-rose-700">
            <span className="font-black">이 달의 숫자 </span>
            {selectedMonth.tangibleLine}
          </div>
          <div className="rounded-[18px] bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
            <span className="font-black text-slate-950">주변 소음 </span>
            {selectedMonth.noiseLine}
          </div>
          <div className="rounded-[18px] bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
            <span className="font-black text-slate-950">판정 </span>
            {selectedMonth.verdict}
          </div>
        </div>
      ) : null}
    </div>
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
