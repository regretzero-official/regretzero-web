export type PeriodKey = "1y" | "3y" | "5y" | "10y" | "max";

export type AssetDefinition = {
  symbol: string;
  name: string;
  shortName: string;
  category: "Stock" | "ETF";
  stooqSymbol: string;
  description: string;
};

export type FeaturedRace = {
  symbol: string;
  kicker: string;
  hook: string;
  feeling: string;
};

export const ALL_PERIODS: Array<{ key: PeriodKey; label: string }> = [
  { key: "1y", label: "1년 전" },
  { key: "3y", label: "3년 전" },
  { key: "5y", label: "5년 전" },
  { key: "10y", label: "10년 전" },
  { key: "max", label: "상장 이후" },
];

export const ASSET_UNIVERSE: AssetDefinition[] = [
  {
    symbol: "NVDA",
    name: "NVIDIA",
    shortName: "엔비디아",
    category: "Stock",
    stooqSymbol: "nvda.us",
    description: "결과는 미쳤고, 중간 과정은 멘탈 테스트에 가깝습니다.",
  },
  {
    symbol: "AAPL",
    name: "Apple",
    shortName: "애플",
    category: "Stock",
    stooqSymbol: "aapl.us",
    description: "너무 익숙해서 놓치기 쉬운데, 지나고 나면 가장 얄밉습니다.",
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    shortName: "마이크로소프트",
    category: "Stock",
    stooqSymbol: "msft.us",
    description: "화려한 한 방 대신, 시간이 갈수록 더 무섭게 벌어지는 종목입니다.",
  },
  {
    symbol: "AMZN",
    name: "Amazon",
    shortName: "아마존",
    category: "Stock",
    stooqSymbol: "amzn.us",
    description: "클라우드와 소비가 겹치면서 길게 보면 체급이 드러나는 자산입니다.",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet",
    shortName: "알파벳",
    category: "Stock",
    stooqSymbol: "googl.us",
    description: "화제성보다 체력으로 설명되는 플랫폼형 대형주입니다.",
  },
  {
    symbol: "META",
    name: "Meta Platforms",
    shortName: "메타",
    category: "Stock",
    stooqSymbol: "meta.us",
    description: "오를 때는 무섭고 빠질 때는 더 시끄러운 플랫폼 대표주입니다.",
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    shortName: "테슬라",
    category: "Stock",
    stooqSymbol: "tsla.us",
    description: "돈보다 심장 박동수가 먼저 기억나는 변동성 대표주입니다.",
  },
  {
    symbol: "BRK-B",
    name: "Berkshire Hathaway B",
    shortName: "버크셔 B",
    category: "Stock",
    stooqSymbol: "brk-b.us",
    description: "조용하지만 묵직하게 복리를 보여주는 비교용 자산입니다.",
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase",
    shortName: "JP모건",
    category: "Stock",
    stooqSymbol: "jpm.us",
    description: "금융 대형주의 체력을 보기 좋은 정석형 종목입니다.",
  },
  {
    symbol: "V",
    name: "Visa",
    shortName: "비자",
    category: "Stock",
    stooqSymbol: "v.us",
    description: "결제 네트워크의 무서운 꾸준함을 숫자로 보여주는 종목입니다.",
  },
  {
    symbol: "COST",
    name: "Costco",
    shortName: "코스트코",
    category: "Stock",
    stooqSymbol: "cost.us",
    description: "조용하지만 시간이 지날수록 무시하기 어려운 소비 강자입니다.",
  },
  {
    symbol: "LLY",
    name: "Eli Lilly",
    shortName: "일라이 릴리",
    category: "Stock",
    stooqSymbol: "lly.us",
    description: "헬스케어 성장 서사가 숫자로 드러난 대표 대형주입니다.",
  },
  {
    symbol: "GLD",
    name: "SPDR Gold Shares",
    shortName: "금",
    category: "ETF",
    stooqSymbol: "gld.us",
    description: "주식을 안 샀다면 금이라도 들고 있었을 때의 기준점입니다.",
  },
  {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF",
    shortName: "S&P500",
    category: "ETF",
    stooqSymbol: "spy.us",
    description: "개별 종목 대신 시장 전체를 샀을 때의 가장 현실적인 비교군입니다.",
  },
  {
    symbol: "QQQ",
    name: "Invesco QQQ Trust",
    shortName: "QQQ",
    category: "ETF",
    stooqSymbol: "qqq.us",
    description: "대형 기술주의 속도를 압축해서 보는 대표 ETF입니다.",
  },
  {
    symbol: "VTI",
    name: "Vanguard Total Stock Market ETF",
    shortName: "미국 전체시장",
    category: "ETF",
    stooqSymbol: "vti.us",
    description: "미국 주식시장 전체를 넓게 담는 기본형 ETF입니다.",
  },
  {
    symbol: "VOO",
    name: "Vanguard S&P 500 ETF",
    shortName: "VOO",
    category: "ETF",
    stooqSymbol: "voo.us",
    description: "S&P500을 저비용으로 추종하는 대표 ETF입니다.",
  },
  {
    symbol: "SCHD",
    name: "Schwab U.S. Dividend Equity ETF",
    shortName: "SCHD",
    category: "ETF",
    stooqSymbol: "schd.us",
    description: "배당 성장주 취향이 실제로 먹혔는지 보기 좋은 ETF입니다.",
  },
  {
    symbol: "SOXX",
    name: "iShares Semiconductor ETF",
    shortName: "반도체 ETF",
    category: "ETF",
    stooqSymbol: "soxx.us",
    description: "반도체 업종의 속도감만 따로 떼어보는 ETF입니다.",
  },
  {
    symbol: "VUG",
    name: "Vanguard Growth ETF",
    shortName: "성장주 ETF",
    category: "ETF",
    stooqSymbol: "vug.us",
    description: "성장주 스타일이 길게 먹혔는지 보기 좋은 ETF입니다.",
  },
  {
    symbol: "IWM",
    name: "iShares Russell 2000 ETF",
    shortName: "중소형주 ETF",
    category: "ETF",
    stooqSymbol: "iwm.us",
    description: "대형주와 중소형주의 온도차를 비교하기 좋은 ETF입니다.",
  },
];

export const FEATURED_RACES: FeaturedRace[] = [
  {
    symbol: "NVDA",
    kicker: "가장 극적",
    hook: "안 샀으면 오래 남고, 샀어도 중간엔 여러 번 털릴 타입",
    feeling: "억울함",
  },
  {
    symbol: "AAPL",
    kicker: "가장 얄밉다",
    hook: "너무 익숙해서 넘기는데, 지나고 보면 제일 많이 곱씹게 됩니다.",
    feeling: "뒤늦은 납득",
  },
  {
    symbol: "SPY",
    kicker: "가장 현실적",
    hook: "화려하진 않아도 결국 덜 후회하는 선택이었는지 확인하는 기준선입니다.",
    feeling: "현실 점검",
  },
];

export function findAsset(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  return ASSET_UNIVERSE.find((asset) => asset.symbol === normalized) ?? null;
}
