import { PRO_ASSET_LIBRARY } from "@/lib/pro-asset-library";

export type Ticker = string;
export type MarketDataTicker = Ticker;
export type ProviderSource = "yahoo-finance";
export type CurrencyCode = "EUR" | "KRW" | "USD";

export interface AssetCatalogItem {
  category: string;
  currency: CurrencyCode;
  description: string;
  displayName: string;
  fact: string;
  provider: ProviderSource;
  ticker: Ticker;
  yahooSymbol: string;
}

interface ProviderDescriptor {
  currency: CurrencyCode;
  displayName: string;
  priceBasis: "adjusted_close" | "close";
  provider: ProviderSource;
  ticker: MarketDataTicker;
  yahooSymbol: string;
}

export interface NormalizedPoint {
  close: number;
  date: string;
}

export interface OhlcPoint {
  close: number;
  date: string;
  high: number;
  low: number;
  open: number;
}

export interface HistoricalStats {
  firstClose: number;
  firstDate: string;
  lastClose: number;
  lastDate: string;
  maxDrawdownDate: string;
  maxDrawdownPct: number;
  returnPct: number;
}

export interface HistoricalSeriesResponse {
  daily: NormalizedPoint[];
  dailyOhlc: OhlcPoint[];
  meta: {
    currency: CurrencyCode;
    priceBasis: "adjusted_close" | "close";
    provider: ProviderSource;
    resolvedEndDate: string;
    resolvedStartDate: string;
    ticker: MarketDataTicker;
  };
  monthly: NormalizedPoint[];
  stats: HistoricalStats;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const YAHOO_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

function createAsset(
  ticker: Ticker,
  displayName: string,
  category: string,
  description: string,
  currency: CurrencyCode,
  yahooSymbol: string,
): AssetCatalogItem {
  return {
    category,
    currency,
    description,
    displayName,
    fact: "Actual historical data",
    provider: "yahoo-finance",
    ticker,
    yahooSymbol,
  };
}

function createDescriptor(
  ticker: MarketDataTicker,
  displayName: string,
  currency: CurrencyCode,
  priceBasis: "adjusted_close" | "close",
  yahooSymbol: string,
): ProviderDescriptor {
  return {
    currency,
    displayName,
    priceBasis,
    provider: "yahoo-finance",
    ticker,
    yahooSymbol,
  };
}

export const LIVE_ASSETS: AssetCatalogItem[] = [
  createAsset("GOLD", "Gold Futures", "safe", "gold futures", "USD", "GC=F"),
  createAsset("USDKRW", "USD/KRW", "safe", "US dollar to KRW", "KRW", "KRW=X"),
  createAsset("QQQ", "QQQ", "us-etf", "US tech ETF", "USD", "QQQ"),
  createAsset("SPY", "SPY", "us-etf", "US market ETF", "USD", "SPY"),
  createAsset("VOO", "VOO", "us-etf", "US large cap ETF", "USD", "VOO"),
  createAsset("VTI", "VTI", "us-etf", "US total market ETF", "USD", "VTI"),
  createAsset("VT", "VT", "us-etf", "global equity ETF", "USD", "VT"),
  createAsset("VXUS", "VXUS", "us-etf", "ex-US equity ETF", "USD", "VXUS"),
  createAsset("IWM", "IWM", "us-etf", "US small cap ETF", "USD", "IWM"),
  createAsset("GLD", "GLD", "us-etf", "gold ETF", "USD", "GLD"),
  createAsset("VNQ", "VNQ", "us-etf", "US REIT ETF", "USD", "VNQ"),
  createAsset("SOXX", "SOXX", "us-etf", "US semiconductor ETF", "USD", "SOXX"),
  createAsset("NVDA", "NVIDIA", "us-stock", "AI semiconductor leader", "USD", "NVDA"),
  createAsset("TSLA", "Tesla", "us-stock", "EV and robotics", "USD", "TSLA"),
  createAsset("AAPL", "Apple", "us-stock", "iPhone maker", "USD", "AAPL"),
  createAsset("MSFT", "Microsoft", "us-stock", "software and AI", "USD", "MSFT"),
  createAsset("AMZN", "Amazon", "us-stock", "commerce and cloud", "USD", "AMZN"),
  createAsset("GOOGL", "Alphabet", "us-stock", "Google holding company", "USD", "GOOGL"),
  createAsset("META", "Meta", "us-stock", "Instagram and Facebook", "USD", "META"),
  createAsset("BRKB", "Berkshire Hathaway", "us-stock", "Warren Buffett holding", "USD", "BRK-B"),
  createAsset("JPM", "JPMorgan", "us-stock", "US large bank", "USD", "JPM"),
  createAsset("JNJ", "Johnson & Johnson", "us-stock", "US healthcare company", "USD", "JNJ"),
  createAsset("V", "Visa", "us-stock", "global payment company", "USD", "V"),
  createAsset("MA", "Mastercard", "us-stock", "global payment company", "USD", "MA"),
  createAsset("COST", "Costco", "us-stock", "warehouse retail company", "USD", "COST"),
  createAsset("PG", "Procter & Gamble", "us-stock", "consumer staples company", "USD", "PG"),
  createAsset("KO", "Coca-Cola", "us-stock", "global beverage company", "USD", "KO"),
  createAsset("XOM", "Exxon Mobil", "us-stock", "energy company", "USD", "XOM"),
  createAsset("AVGO", "Broadcom", "us-stock", "semiconductor and software", "USD", "AVGO"),
  createAsset("AMD", "AMD", "us-stock", "semiconductor company", "USD", "AMD"),
  createAsset("ASML", "ASML", "us-stock", "semiconductor equipment", "USD", "ASML"),
  createAsset("PLTR", "Palantir", "us-stock", "data software", "USD", "PLTR"),
  createAsset("LVMH", "LVMH", "eu-stock", "luxury brand group", "EUR", "MC.PA"),
  createAsset("BTC", "Bitcoin", "crypto", "digital asset", "USD", "BTC-USD"),
  createAsset("ETH", "Ethereum", "crypto", "smart contract asset", "USD", "ETH-USD"),
  createAsset("005930", "Samsung Electronics", "kr-stock", "Korean large cap tech", "KRW", "005930.KS"),
  createAsset("000660", "SK Hynix", "kr-stock", "Korean semiconductor", "KRW", "000660.KS"),
  createAsset("005380", "Hyundai Motor", "kr-stock", "Korean automaker", "KRW", "005380.KS"),
  createAsset("000270", "Kia", "kr-stock", "Korean auto brand", "KRW", "000270.KS"),
  createAsset("035420", "NAVER", "kr-stock", "Korean internet platform", "KRW", "035420.KS"),
  createAsset("035720", "Kakao", "kr-stock", "Korean platform company", "KRW", "035720.KS"),
  createAsset("068270", "Celltrion", "kr-stock", "Korean biotech", "KRW", "068270.KS"),
  createAsset("207940", "Samsung Biologics", "kr-stock", "Korean biotech manufacturer", "KRW", "207940.KS"),
  createAsset("005490", "POSCO Holdings", "kr-stock", "Korean materials company", "KRW", "005490.KS"),
  createAsset("105560", "KB Financial", "kr-stock", "Korean financial holding", "KRW", "105560.KS"),
  createAsset("055550", "Shinhan Financial", "kr-stock", "Korean financial holding", "KRW", "055550.KS"),
  createAsset("033780", "KT&G", "kr-stock", "Korean consumer company", "KRW", "033780.KS"),
  createAsset("012450", "Hanwha Aerospace", "kr-stock", "Korean defense company", "KRW", "012450.KS"),
  createAsset("034020", "Doosan Enerbility", "kr-stock", "Korean power equipment", "KRW", "034020.KS"),
  createAsset("028260", "Samsung C&T", "kr-stock", "Korean holding company", "KRW", "028260.KS"),
  createAsset("003550", "LG Corp", "kr-stock", "Korean holding company", "KRW", "003550.KS"),
  createAsset("069500", "KODEX 200", "kr-etf", "Korean equity ETF", "KRW", "069500.KS"),
  createAsset("360750", "TIGER US S&P500", "kr-etf", "US S&P500 KR ETF", "KRW", "360750.KS"),
];

const DATA_CATALOG: Record<MarketDataTicker, ProviderDescriptor> = {
  GOLD: createDescriptor("GOLD", "Gold Futures", "USD", "close", "GC=F"),
  USDKRW: createDescriptor("USDKRW", "USD/KRW", "KRW", "close", "KRW=X"),
  QQQ: createDescriptor("QQQ", "QQQ", "USD", "adjusted_close", "QQQ"),
  SPY: createDescriptor("SPY", "SPY", "USD", "adjusted_close", "SPY"),
  VOO: createDescriptor("VOO", "VOO", "USD", "adjusted_close", "VOO"),
  VTI: createDescriptor("VTI", "VTI", "USD", "adjusted_close", "VTI"),
  VT: createDescriptor("VT", "VT", "USD", "adjusted_close", "VT"),
  VXUS: createDescriptor("VXUS", "VXUS", "USD", "adjusted_close", "VXUS"),
  IWM: createDescriptor("IWM", "IWM", "USD", "adjusted_close", "IWM"),
  GLD: createDescriptor("GLD", "GLD", "USD", "adjusted_close", "GLD"),
  VNQ: createDescriptor("VNQ", "VNQ", "USD", "adjusted_close", "VNQ"),
  SOXX: createDescriptor("SOXX", "SOXX", "USD", "adjusted_close", "SOXX"),
  NVDA: createDescriptor("NVDA", "NVIDIA", "USD", "adjusted_close", "NVDA"),
  TSLA: createDescriptor("TSLA", "Tesla", "USD", "adjusted_close", "TSLA"),
  AAPL: createDescriptor("AAPL", "Apple", "USD", "adjusted_close", "AAPL"),
  MSFT: createDescriptor("MSFT", "Microsoft", "USD", "adjusted_close", "MSFT"),
  AMZN: createDescriptor("AMZN", "Amazon", "USD", "adjusted_close", "AMZN"),
  GOOGL: createDescriptor("GOOGL", "Alphabet", "USD", "adjusted_close", "GOOGL"),
  META: createDescriptor("META", "Meta", "USD", "adjusted_close", "META"),
  BRKB: createDescriptor("BRKB", "Berkshire Hathaway", "USD", "adjusted_close", "BRK-B"),
  JPM: createDescriptor("JPM", "JPMorgan", "USD", "adjusted_close", "JPM"),
  JNJ: createDescriptor("JNJ", "Johnson & Johnson", "USD", "adjusted_close", "JNJ"),
  V: createDescriptor("V", "Visa", "USD", "adjusted_close", "V"),
  MA: createDescriptor("MA", "Mastercard", "USD", "adjusted_close", "MA"),
  COST: createDescriptor("COST", "Costco", "USD", "adjusted_close", "COST"),
  PG: createDescriptor("PG", "Procter & Gamble", "USD", "adjusted_close", "PG"),
  KO: createDescriptor("KO", "Coca-Cola", "USD", "adjusted_close", "KO"),
  XOM: createDescriptor("XOM", "Exxon Mobil", "USD", "adjusted_close", "XOM"),
  AVGO: createDescriptor("AVGO", "Broadcom", "USD", "adjusted_close", "AVGO"),
  AMD: createDescriptor("AMD", "AMD", "USD", "adjusted_close", "AMD"),
  ASML: createDescriptor("ASML", "ASML", "USD", "adjusted_close", "ASML"),
  PLTR: createDescriptor("PLTR", "Palantir", "USD", "adjusted_close", "PLTR"),
  LVMH: createDescriptor("LVMH", "LVMH", "EUR", "adjusted_close", "MC.PA"),
  BTC: createDescriptor("BTC", "Bitcoin", "USD", "close", "BTC-USD"),
  ETH: createDescriptor("ETH", "Ethereum", "USD", "close", "ETH-USD"),
  "005930": createDescriptor("005930", "Samsung Electronics", "KRW", "adjusted_close", "005930.KS"),
  "000660": createDescriptor("000660", "SK Hynix", "KRW", "adjusted_close", "000660.KS"),
  "005380": createDescriptor("005380", "Hyundai Motor", "KRW", "adjusted_close", "005380.KS"),
  "000270": createDescriptor("000270", "Kia", "KRW", "adjusted_close", "000270.KS"),
  "035420": createDescriptor("035420", "NAVER", "KRW", "adjusted_close", "035420.KS"),
  "035720": createDescriptor("035720", "Kakao", "KRW", "adjusted_close", "035720.KS"),
  "068270": createDescriptor("068270", "Celltrion", "KRW", "adjusted_close", "068270.KS"),
  "207940": createDescriptor("207940", "Samsung Biologics", "KRW", "adjusted_close", "207940.KS"),
  "005490": createDescriptor("005490", "POSCO Holdings", "KRW", "adjusted_close", "005490.KS"),
  "105560": createDescriptor("105560", "KB Financial", "KRW", "adjusted_close", "105560.KS"),
  "055550": createDescriptor("055550", "Shinhan Financial", "KRW", "adjusted_close", "055550.KS"),
  "033780": createDescriptor("033780", "KT&G", "KRW", "adjusted_close", "033780.KS"),
  "012450": createDescriptor("012450", "Hanwha Aerospace", "KRW", "adjusted_close", "012450.KS"),
  "034020": createDescriptor("034020", "Doosan Enerbility", "KRW", "adjusted_close", "034020.KS"),
  "028260": createDescriptor("028260", "Samsung C&T", "KRW", "adjusted_close", "028260.KS"),
  "003550": createDescriptor("003550", "LG Corp", "KRW", "adjusted_close", "003550.KS"),
  "069500": createDescriptor("069500", "KODEX 200", "KRW", "adjusted_close", "069500.KS"),
  "360750": createDescriptor("360750", "TIGER US S&P500", "KRW", "adjusted_close", "360750.KS"),
};

const PROVIDER_CATEGORY_BY_ASSET_CATEGORY = {
  미국ETF: "us-etf",
  미국주식: "us-stock",
  안전자산: "safe",
  코인: "crypto",
  한국ETF: "kr-etf",
  한국주식: "kr-stock",
  부동산: "real-estate",
} as const;

for (const asset of PRO_ASSET_LIBRARY) {
  if (!LIVE_ASSETS.some((existingAsset) => existingAsset.ticker === asset.marketTicker)) {
    LIVE_ASSETS.push(
      createAsset(
        asset.marketTicker,
        asset.label,
        PROVIDER_CATEGORY_BY_ASSET_CATEGORY[asset.category],
        asset.description,
        asset.currency,
        asset.yahooSymbol,
      ),
    );
  }

  DATA_CATALOG[asset.marketTicker] = createDescriptor(
    asset.marketTicker,
    asset.label,
    asset.currency,
    asset.priceBasis ?? "adjusted_close",
    asset.yahooSymbol,
  );
}

export const SUPPORTED_MARKET_TICKERS = Object.keys(DATA_CATALOG) as MarketDataTicker[];

const inMemoryCache = new Map<string, { data: HistoricalSeriesResponse; expiresAt: number }>();

function parseDateString(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

function getDateFormatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  });
}

function formatTimestampDate(timestampMs: number, timeZone: string) {
  const parts = getDateFormatter(timeZone).formatToParts(new Date(timestampMs));
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function dedupeOhlcPoints(points: OhlcPoint[]) {
  const deduped = new Map<string, OhlcPoint>();
  for (const point of points) {
    deduped.set(point.date, point);
  }

  return [...deduped.values()].sort((left, right) => left.date.localeCompare(right.date));
}

function sliceToAnchors<T extends { date: string }>(
  points: T[],
  requestedStart: string,
  requestedEnd: string,
) {
  if (points.length === 0) {
    throw new Error("No historical points available.");
  }

  let startIndex = -1;
  let endIndex = -1;

  for (let index = 0; index < points.length; index += 1) {
    if (points[index]!.date <= requestedStart) {
      startIndex = index;
    }
    if (points[index]!.date <= requestedEnd) {
      endIndex = index;
    }
  }

  if (startIndex === -1) {
    startIndex = 0;
  }
  if (endIndex === -1) {
    endIndex = points.length - 1;
  }
  if (endIndex < startIndex) {
    throw new Error("Resolved date range is invalid.");
  }

  return points.slice(startIndex, endIndex + 1);
}

function buildMonthlySeries(points: NormalizedPoint[]) {
  if (points.length <= 2) {
    return points;
  }

  const monthly: NormalizedPoint[] = [points[0]!];
  let lastMonth = points[0]!.date.slice(0, 7);
  let lastPointOfMonth = points[0]!;

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]!;
    const monthKey = point.date.slice(0, 7);

    if (monthKey !== lastMonth) {
      if (monthly[monthly.length - 1]!.date !== lastPointOfMonth.date) {
        monthly.push(lastPointOfMonth);
      }
      lastMonth = monthKey;
    }

    lastPointOfMonth = point;
  }

  if (monthly[monthly.length - 1]!.date !== lastPointOfMonth.date) {
    monthly.push(lastPointOfMonth);
  }

  return monthly;
}

function calculateStats(points: NormalizedPoint[]): HistoricalStats {
  const firstPoint = points[0]!;
  const lastPoint = points[points.length - 1]!;
  let runningPeak = firstPoint.close;
  let maxDrawdownPct = 0;
  let maxDrawdownDate = firstPoint.date;

  for (const point of points) {
    runningPeak = Math.max(runningPeak, point.close);
    const drawdownPct = (point.close / runningPeak - 1) * 100;
    if (drawdownPct < maxDrawdownPct) {
      maxDrawdownPct = drawdownPct;
      maxDrawdownDate = point.date;
    }
  }

  return {
    firstClose: firstPoint.close,
    firstDate: firstPoint.date,
    lastClose: lastPoint.close,
    lastDate: lastPoint.date,
    maxDrawdownDate,
    maxDrawdownPct,
    returnPct: (lastPoint.close / firstPoint.close - 1) * 100,
  };
}

function normalizeSeries(
  descriptor: ProviderDescriptor,
  points: OhlcPoint[],
  requestedStart: string,
  requestedEnd: string,
) {
  const anchoredDailyOhlc = sliceToAnchors(points, requestedStart, requestedEnd);
  const anchoredDaily = anchoredDailyOhlc.map(({ close, date }) => ({ close, date }));
  const monthly = buildMonthlySeries(anchoredDaily);
  const stats = calculateStats(anchoredDaily);

  return {
    daily: anchoredDaily,
    dailyOhlc: anchoredDailyOhlc,
    meta: {
      currency: descriptor.currency,
      priceBasis: descriptor.priceBasis,
      provider: descriptor.provider,
      resolvedEndDate: stats.lastDate,
      resolvedStartDate: stats.firstDate,
      ticker: descriptor.ticker,
    },
    monthly,
    stats,
  } satisfies HistoricalSeriesResponse;
}

async function fetchYahooSeries(
  descriptor: ProviderDescriptor,
  requestedStart: string,
  requestedEnd: string,
) {
  const bufferedStart = addDays(parseDateString(requestedStart), -35);
  const bufferedEnd = addDays(parseDateString(requestedEnd), 7);
  const url = new URL(`${YAHOO_URL}/${descriptor.yahooSymbol}`);

  url.searchParams.set("includeAdjustedClose", "true");
  url.searchParams.set("interval", "1d");
  url.searchParams.set("period1", String(Math.floor(bufferedStart.getTime() / 1000)));
  url.searchParams.set("period2", String(Math.floor(bufferedEnd.getTime() / 1000)));

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "RegretZero/1.0",
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as {
    chart?: {
      error?: { description?: string };
      result?: Array<{
        indicators?: {
          adjclose?: Array<{ adjclose?: Array<number | null> }>;
          quote?: Array<{
            close?: Array<number | null>;
            high?: Array<number | null>;
            low?: Array<number | null>;
            open?: Array<number | null>;
          }>;
        };
        meta?: { exchangeTimezoneName?: string };
        timestamp?: number[];
      }>;
    };
  };

  const result = payload.chart?.result?.[0];
  if (!result) {
    throw new Error(
      payload.chart?.error?.description ??
        `Yahoo Finance returned no result for ${descriptor.ticker}.`,
    );
  }

  const timestamps = result.timestamp ?? [];
  const quoteHighs = result.indicators?.quote?.[0]?.high ?? [];
  const quoteLows = result.indicators?.quote?.[0]?.low ?? [];
  const quoteOpens = result.indicators?.quote?.[0]?.open ?? [];
  const quoteCloses = result.indicators?.quote?.[0]?.close ?? [];
  const adjustedCloses = result.indicators?.adjclose?.[0]?.adjclose ?? [];
  const timeZone = result.meta?.exchangeTimezoneName ?? "UTC";

  const points = dedupeOhlcPoints(
    timestamps.flatMap((timestamp, index) => {
      const adjustedClose = adjustedCloses[index];
      const rawHigh = quoteHighs[index];
      const rawLow = quoteLows[index];
      const rawOpen = quoteOpens[index];
      const rawClose = quoteCloses[index];
      const hasAdjustedClose = Number.isFinite(adjustedClose) && adjustedClose != null;
      const close =
        descriptor.priceBasis === "adjusted_close" && hasAdjustedClose
          ? adjustedClose
          : rawClose;
      const adjustmentFactor =
        descriptor.priceBasis === "adjusted_close" &&
        hasAdjustedClose &&
        Number.isFinite(rawClose) &&
        rawClose != null &&
        rawClose > 0
          ? adjustedClose / rawClose
          : 1;
      const open =
        Number.isFinite(rawOpen) && rawOpen != null && rawOpen > 0 ? rawOpen * adjustmentFactor : null;
      const high =
        Number.isFinite(rawHigh) && rawHigh != null && rawHigh > 0 ? rawHigh * adjustmentFactor : null;
      const low =
        Number.isFinite(rawLow) && rawLow != null && rawLow > 0 ? rawLow * adjustmentFactor : null;

      if (
        !Number.isFinite(close) ||
        close === null ||
        close <= 0 ||
        !Number.isFinite(open) ||
        open === null ||
        open <= 0 ||
        !Number.isFinite(high) ||
        high === null ||
        high <= 0 ||
        !Number.isFinite(low) ||
        low === null ||
        low <= 0
      ) {
        return [];
      }

      return [
        {
          close,
          date: formatTimestampDate(timestamp * 1000, timeZone),
          high,
          low,
          open,
        },
      ];
    }),
  );

  if (points.length === 0) {
    throw new Error(`No usable historical points for ${descriptor.ticker}.`);
  }

  return normalizeSeries(descriptor, points, requestedStart, requestedEnd);
}

export function getAssetCatalogItem(ticker: Ticker) {
  return LIVE_ASSETS.find((asset) => asset.ticker === ticker) ?? null;
}

export async function getHistoricalSeries(
  ticker: MarketDataTicker,
  requestedStart: string,
  requestedEnd: string,
) {
  const descriptor = DATA_CATALOG[ticker];
  if (!descriptor) {
    throw new Error(`Unsupported ticker: ${ticker}`);
  }

  const cacheKey = `${ticker}:${requestedStart}:${requestedEnd}`;
  const cached = inMemoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const data = await fetchYahooSeries(descriptor, requestedStart, requestedEnd);
  inMemoryCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return data;
}
