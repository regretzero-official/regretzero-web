import {
  assetCatalog,
  selectableAssetIds,
  type ComparisonAssetId,
} from "@/lib/home-content";

export type InvestmentModeForFeed = "lump-sum" | "monthly";

export type SyncedMatchup = {
  id: string;
  assetIds: [ComparisonAssetId, ComparisonAssetId];
  label: string;
  rank: number;
  viewers: number;
  amountKrw: number;
  investmentMode: InvestmentModeForFeed;
  valueLabel: string;
  rateLabel: string;
  summary: string;
};

type MatchupSeed = {
  id: string;
  assetIds: [ComparisonAssetId, ComparisonAssetId];
  label?: string;
  summary?: string;
};

const availableIdSet = new Set<ComparisonAssetId>(selectableAssetIds);

const readableAssetLabels: Record<string, string> = {
  "000660": "SK하이닉스",
  "000270": "기아",
  "003550": "LG",
  "005380": "현대차",
  "005490": "POSCO홀딩스",
  "005930": "삼성전자",
  "012450": "한화에어로스페이스",
  "028260": "삼성물산",
  "033780": "KT&G",
  "034020": "두산에너빌리티",
  "035420": "네이버",
  "035720": "카카오",
  "055550": "신한지주",
  "068270": "셀트리온",
  "069500": "KODEX 200",
  "105560": "KB금융",
  "207940": "삼성바이오로직스",
  aapl: "애플",
  amd: "AMD",
  amzn: "아마존",
  avgo: "브로드컴",
  botz: "로봇·AI ETF",
  brkb: "버크셔 해서웨이",
  btc: "비트코인",
  cost: "코스트코",
  deposit: "정기예금",
  eth: "이더리움",
  gangnam_gu_apt: "강남 아파트 지수",
  gld: "금 ETF",
  gold: "금",
  googl: "알파벳",
  iwm: "미국 소형주 ETF",
  jepi: "JEPI",
  jepq: "JEPQ",
  jnj: "존슨앤드존슨",
  jpm: "JP모건",
  ko: "코카콜라",
  ma: "마스터카드",
  meta: "메타",
  msft: "마이크로소프트",
  nvda: "엔비디아",
  pg: "P&G",
  pltr: "팔란티어",
  qqq: "나스닥100 ETF",
  qtum: "양자컴퓨터 ETF",
  schd: "미국 배당 ETF",
  seoul_apt: "서울 아파트 지수",
  silver: "은",
  slv: "은 ETF",
  smh: "반도체 ETF",
  soxl: "SOXL",
  soxx: "SOXX",
  spy: "S&P500 ETF",
  tqqq: "TQQQ",
  tsla: "테슬라",
  v: "비자",
  vnq: "미국 리츠 ETF",
  voo: "S&P500 ETF",
  vt: "전세계 주식 ETF",
  vti: "미국 전체시장 ETF",
  vxus: "미국 제외 글로벌 ETF",
  xle: "미국 에너지 ETF",
  xom: "엑슨모빌",
};

const getAssetLabel = (assetId: ComparisonAssetId) => {
  const asset = assetCatalog[assetId];
  return readableAssetLabels[assetId] ?? asset?.shortLabel ?? asset?.label ?? assetId;
};

const getAssetShortLabel = (assetId: ComparisonAssetId) =>
  getAssetLabel(assetId).replace(/\s*\([^)]*\)/g, "").replace("미국 ", "").trim();

const getPairLabel = ([left, right]: [ComparisonAssetId, ComparisonAssetId]) =>
  `${getAssetShortLabel(left)} vs ${getAssetShortLabel(right)}`;

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleWithSeed = <T,>(items: T[], seedKey: string) => {
  const random = createSeededRandom(hashString(seedKey));
  const cloned = [...items];
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }
  return cloned;
};

const curatedMatchups: MatchupSeed[] = [
  {
    id: "tsla-vs-nvda",
    assetIds: ["tsla", "nvda"],
    summary: "전기차 성장주와 AI 반도체 대표주의 속도 차이를 봅니다.",
  },
  {
    id: "btc-vs-deposit",
    assetIds: ["btc", "deposit"],
    summary: "가장 크게 흔들린 길과 가장 안정적인 길을 나란히 봅니다.",
  },
  {
    id: "seoul-apt-vs-qqq",
    assetIds: ["seoul_apt", "qqq"],
    summary: "서울 아파트 흐름과 미국 기술주 ETF를 비교합니다.",
  },
  {
    id: "soxl-vs-qqq",
    assetIds: ["soxl", "qqq"],
    summary: "레버리지 ETF와 대표 기술주 ETF의 차이를 봅니다.",
  },
  {
    id: "nvda-vs-sk-hynix",
    assetIds: ["nvda", "000660"],
    summary: "미국 AI 반도체와 한국 메모리 대표주의 10년을 봅니다.",
  },
  {
    id: "tesla-vs-hyundai",
    assetIds: ["tsla", "005380"],
    summary: "전기차 성장주와 완성차 대표 기업의 길을 비교합니다.",
  },
  {
    id: "gold-vs-btc",
    assetIds: ["gold", "btc"],
    summary: "오래된 안전자산과 디지털 자산의 10년을 봅니다.",
  },
  {
    id: "samsung-vs-deposit",
    assetIds: ["005930", "deposit"],
    summary: "가장 익숙한 한국 주식과 안정 기준을 비교합니다.",
  },
  {
    id: "voo-vs-qqq",
    assetIds: ["voo", "qqq"],
    summary: "미국 대표 대형주 ETF와 기술주 중심 ETF를 비교합니다.",
  },
  {
    id: "gangnam-vs-qqq",
    assetIds: ["gangnam_gu_apt", "qqq"],
    summary: "강남 아파트 지수와 미국 기술주 ETF의 길을 봅니다.",
  },
  {
    id: "smh-vs-soxx",
    assetIds: ["smh", "soxx"],
    summary: "반도체 ETF끼리 다른 흐름을 비교합니다.",
  },
  {
    id: "aapl-vs-msft",
    assetIds: ["aapl", "msft"],
    summary: "미국 대표 빅테크의 장기 흐름을 나란히 봅니다.",
  },
  {
    id: "eth-vs-btc",
    assetIds: ["eth", "btc"],
    summary: "대표 코인 두 자산의 변동성과 회복을 봅니다.",
  },
  {
    id: "silver-vs-gold",
    assetIds: ["silver", "gold"],
    summary: "은과 금, 두 실물자산의 속도 차이를 봅니다.",
  },
  {
    id: "xle-vs-qqq",
    assetIds: ["xle", "qqq"],
    summary: "에너지와 기술주 중심 ETF의 10년을 비교합니다.",
  },
];

const matchupGroups: ComparisonAssetId[][] = [
  ["deposit", "gold", "silver", "btc", "eth"],
  ["nvda", "tsla", "aapl", "msft", "meta", "googl", "amd", "avgo", "pltr"],
  ["qqq", "voo", "spy", "soxl", "tqqq", "smh", "soxx", "schd", "jepi", "jepq"],
  ["005930", "000660", "005380", "000270", "035420", "035720", "068270", "207940"],
  ["seoul_apt", "gangnam_gu_apt", "xle", "gld", "slv", "botz", "qtum", "vnq"],
];

const isAvailablePair = (assetIds: [ComparisonAssetId, ComparisonAssetId]) =>
  assetIds.every((assetId) => availableIdSet.has(assetId));

const buildGeneratedMatchups = () => {
  const generated: MatchupSeed[] = [];

  for (let groupIndex = 0; groupIndex < matchupGroups.length; groupIndex += 1) {
    const currentGroup = matchupGroups[groupIndex]!.filter((assetId) => availableIdSet.has(assetId));
    const nextGroup = matchupGroups[(groupIndex + 1) % matchupGroups.length]!.filter((assetId) =>
      availableIdSet.has(assetId),
    );

    currentGroup.forEach((left, leftIndex) => {
      nextGroup.forEach((right, rightIndex) => {
        if (left === right) return;
        generated.push({
          id: `${left}-vs-${right}-${leftIndex}-${rightIndex}`,
          assetIds: [left, right],
        });
      });
    });
  }

  return generated;
};

const dedupeMatchups = (items: MatchupSeed[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!isAvailablePair(item.assetIds)) return false;
    const key = [...item.assetIds].sort().join("__");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const MASTER_MATCHUP_POOL: MatchupSeed[] = dedupeMatchups([
  ...curatedMatchups,
  ...buildGeneratedMatchups(),
]);

const amountPool = [100, 300, 500, 1000, 3000, 5000];

const buildValueLabel = (rate: number, amountKrw: number, mode: InvestmentModeForFeed) => {
  const invested = mode === "monthly" ? amountKrw * 120 : amountKrw;
  const finalValue = Math.max(invested * (1 + rate / 100), invested);
  if (finalValue >= 10000) {
    const eok = Math.floor(finalValue / 10000);
    const man = Math.round(finalValue % 10000);
    return man > 0 ? `${eok}억 ${man.toLocaleString("ko-KR")}만원` : `${eok}억원`;
  }
  return `${Math.round(finalValue).toLocaleString("ko-KR")}만원`;
};

const buildSyncedMatchup = (seed: MatchupSeed, index: number, seedKey: string): SyncedMatchup => {
  const random = createSeededRandom(hashString(`${seedKey}-${seed.id}-${index}`));
  const investmentMode: InvestmentModeForFeed = random() > 0.7 ? "monthly" : "lump-sum";
  const amountKrw = amountPool[Math.floor(random() * amountPool.length)] ?? 1000;
  const rate = Math.round(180 + random() * 9200);
  const viewers = 420 + Math.round(random() * 4200);
  const label = seed.label ?? getPairLabel(seed.assetIds);

  return {
    id: seed.id,
    assetIds: seed.assetIds,
    label,
    rank: index + 1,
    viewers,
    amountKrw,
    investmentMode,
    valueLabel: buildValueLabel(rate, amountKrw, investmentMode),
    rateLabel: `+${rate.toLocaleString("ko-KR")}%`,
    summary: seed.summary ?? `${label}의 지난 흐름과 흔들림을 같이 봅니다.`,
  };
};

export const getHourlyMatchupSeed = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  return `${year}-${month}-${day}-${hour}`;
};

export const buildSyncedMatchupDeck = (count = 10, seed = getHourlyMatchupSeed()) =>
  shuffleWithSeed(MASTER_MATCHUP_POOL, seed)
    .slice(0, count)
    .map((matchup, index) => buildSyncedMatchup(matchup, index, seed));

export const pickSyncedMatchup = (matchups: SyncedMatchup[], seed: number) => {
  if (matchups.length === 0) return null;
  const random = createSeededRandom(seed);
  return matchups[Math.floor(random() * matchups.length)] ?? matchups[0] ?? null;
};
