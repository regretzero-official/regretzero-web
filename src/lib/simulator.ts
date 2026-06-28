import { findAsset, type PeriodKey } from "./assets";

type PricePoint = {
  date: string;
  close: number;
};

type SimulationInput = {
  symbol: string;
  period: PeriodKey;
  amount: number;
  benchmarkSymbol?: string;
};

type SimulationSuccess = {
  status: "success";
  startPrice: number;
  currentPrice: number;
  sharesPurchased: number;
  currentValue: number;
  absoluteReturn: number;
  percentReturn: number;
  benchmarkReturn: number;
  relativePerformance: number;
  maxDrawdown: number;
  insightSummary: string;
  startDate: string;
};

type SimulationError = {
  status: "error";
  message: string;
};

export type SimulationResult = SimulationSuccess | SimulationError;

export async function getSimulation({
  symbol,
  period,
  amount,
  benchmarkSymbol = "SPY",
}: SimulationInput): Promise<SimulationResult> {
  const asset = findAsset(symbol);

  if (!asset) {
    return {
      status: "error",
      message: "지원하지 않는 종목입니다.",
    };
  }

  const benchmark = findAsset(benchmarkSymbol);
  if (!benchmark) {
    return {
      status: "error",
      message: "비교 기준을 준비하지 못했습니다.",
    };
  }

  const [assetSeries, benchmarkSeries] = await Promise.all([
    fetchHistoricalSeries(asset.stooqSymbol),
    fetchHistoricalSeries(benchmark.stooqSymbol),
  ]);

  if (assetSeries.length < 2 || benchmarkSeries.length < 2) {
    return {
      status: "error",
      message: "과거 가격 데이터가 부족해서 계산할 수 없습니다.",
    };
  }

  const assetStartIndex = findStartIndex(assetSeries, period);
  const benchmarkStartIndex = findStartIndex(benchmarkSeries, period);

  if (assetStartIndex < 0 || benchmarkStartIndex < 0) {
    return {
      status: "error",
      message: "선택한 기간을 감당할 만큼 긴 데이터가 없습니다.",
    };
  }

  const assetStartPoint = assetSeries[assetStartIndex];
  const currentPoint = assetSeries[assetSeries.length - 1];
  const benchmarkStartPoint = benchmarkSeries[benchmarkStartIndex];
  const benchmarkCurrent = benchmarkSeries[benchmarkSeries.length - 1];

  if (!assetStartPoint || !currentPoint || !benchmarkStartPoint || !benchmarkCurrent) {
    return {
      status: "error",
      message: "기준 가격을 찾지 못해 레이스를 만들 수 없습니다.",
    };
  }

  const sharesPurchased = amount / assetStartPoint.close;
  const currentValue = sharesPurchased * currentPoint.close;
  const absoluteReturn = currentValue - amount;
  const percentReturn = absoluteReturn / amount;
  const benchmarkReturn = benchmarkCurrent.close / benchmarkStartPoint.close - 1;
  const relativePerformance = percentReturn - benchmarkReturn;
  const maxDrawdown = calculateMaxDrawdown(assetSeries.slice(assetStartIndex));

  return {
    status: "success",
    startPrice: assetStartPoint.close,
    currentPrice: currentPoint.close,
    sharesPurchased,
    currentValue,
    absoluteReturn,
    percentReturn,
    benchmarkReturn,
    relativePerformance,
    maxDrawdown,
    insightSummary: buildInsightSummary({
      symbol: asset.symbol,
      percentReturn,
      benchmarkReturn,
      maxDrawdown,
    }),
    startDate: assetStartPoint.date,
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "percent",
    maximumFractionDigits: 1,
    signDisplay: "always",
  }).format(value);
}

function calculateMaxDrawdown(series: PricePoint[]) {
  if (series.length === 0) {
    return 0;
  }

  let peak = series[0].close;
  let maxDrawdown = 0;

  for (const point of series) {
    if (point.close > peak) {
      peak = point.close;
    }

    const drawdown = point.close / peak - 1;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

function findStartIndex(series: PricePoint[], period: PeriodKey) {
  if (period === "max") {
    return 0;
  }

  const latest = new Date(series[series.length - 1].date);
  const targetDate = new Date(latest);
  const years = Number(period.replace("y", ""));

  targetDate.setFullYear(targetDate.getFullYear() - years);

  return series.findIndex((point) => new Date(point.date) >= targetDate);
}

function buildInsightSummary({
  symbol,
  percentReturn,
  benchmarkReturn,
  maxDrawdown,
}: {
  symbol: string;
  percentReturn: number;
  benchmarkReturn: number;
  maxDrawdown: number;
}) {
  const benchmarkTone =
    percentReturn >= benchmarkReturn
      ? "비교군보다 더 멀리 갔고"
      : "비교군보다 덜 갔지만";
  const drawdownTone =
    maxDrawdown <= -0.4
      ? "중간에 버티기 꽤 힘든 구간이 있었습니다."
      : maxDrawdown <= -0.2
        ? "중간 변동성도 만만하지 않았습니다."
        : "의외로 버티기 쉬운 편이었습니다.";

  return `${symbol}는 같은 기간 ${benchmarkTone} ${drawdownTone}`;
}

async function fetchHistoricalSeries(stooqSymbol: string) {
  const response = await fetch(
    `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol)}&i=d`,
    {
      next: {
        revalidate: 43200,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch ${stooqSymbol}`);
  }

  const csv = await response.text();
  return parseCsv(csv);
}

function parseCsv(csv: string): PricePoint[] {
  const lines = csv.trim().split(/\r?\n/).slice(1);

  return lines
    .map((line) => {
      const [date, , , , close] = line.split(",");
      const parsedClose = Number(close);

      if (!date || Number.isNaN(parsedClose)) {
        return null;
      }

      return {
        date,
        close: parsedClose,
      };
    })
    .filter((point): point is PricePoint => point !== null)
    .sort((left, right) => left.date.localeCompare(right.date));
}
