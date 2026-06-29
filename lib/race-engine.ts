import {
  FIXED_YEARS,
  INPUT_MAX_AMOUNT,
  assetCatalog,
  type ComparisonAssetId,
} from "@/lib/home-content";
import type { HistoricalSeriesResponse, NormalizedPoint } from "@/lib/market-data";
import {
  buildDepositSyntheticSeries,
  getDepositValueAtDate,
} from "@/lib/deposit-series";
import {
  buildRealEstateProxySeries,
  getRealEstateValueAtDate,
} from "@/lib/seoul-apartment-proxy";

export interface MarketBundle {
  seriesByAsset: Partial<Record<ComparisonAssetId, HistoricalSeriesResponse>>;
  source: "live";
  usdkrw: HistoricalSeriesResponse | null;
}

export interface RacePoint {
  date: string;
  index: number;
  label: string;
  [key: string]: number | string;
}

export interface RaceResult {
  assetId: ComparisonAssetId;
  annualizedReturnMethod?: "cagr" | "none" | "xirr";
  annualizedReturnPct?: number | null;
  cagrPct?: number;
  finalValue: number;
  label: string;
  moneyWeightedReturnPct?: number | null;
  profitKrw?: number;
  rank: number;
  returnOnInvestedPct?: number;
  totalInvestedKrw?: number;
  totalReturnPct: number;
}

export interface RaceBuildResult {
  points: RacePoint[];
  requestedEndDate: string;
  requestedStartDate: string;
  resolvedEndDate: string;
  resolvedStartDate: string;
  results: RaceResult[];
}

export interface PrincipalReferencePoint {
  date: string;
  index: number;
  label: string;
  value: number;
}

export interface SingleAssetSimulationResult extends RaceBuildResult {
  assetId: ComparisonAssetId;
  principalKrw: number;
  principalSeries: PrincipalReferencePoint[];
  result: RaceResult;
}

export interface StartPointResult {
  assetId: ComparisonAssetId;
  cagrPct: number;
  finalValue: number;
  holdingYears: number;
  requestedEndDate: string;
  requestedStartDate: string;
  resolvedEndDate: string;
  resolvedStartDate: string;
  totalReturnPct: number;
}

export interface AssetPricePoint {
  date: string;
  price: number;
}

export type RaceResolution = "daily" | "monthly" | "weekly";

export type InvestmentPlan =
  | {
      mode: "lump-sum";
      principalKrw: number;
    }
  | {
      mode: "monthly";
      monthlyContributionKrw: number;
    };

const numberFormatter = new Intl.NumberFormat("ko-KR");

function formatLocalDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function addMonths(date: Date, monthsToAdd: number) {
  const targetMonth = date.getMonth() + monthsToAdd;
  const firstDayOfTargetMonth = new Date(date.getFullYear(), targetMonth, 1);
  const lastDayOfTargetMonth = new Date(
    firstDayOfTargetMonth.getFullYear(),
    firstDayOfTargetMonth.getMonth() + 1,
    0,
  ).getDate();

  return new Date(
    firstDayOfTargetMonth.getFullYear(),
    firstDayOfTargetMonth.getMonth(),
    Math.min(date.getDate(), lastDayOfTargetMonth),
  );
}

function formatShortMonth(date: string) {
  const [year, month] = date.split("-");
  return `${year.slice(2)}.${month}`;
}

function getElapsedYears(startDate: string, endDate: string) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (365.25 * 24 * 60 * 60 * 1000);
}

function getPointOnOrBefore(points: NormalizedPoint[], targetDate: string) {
  if (!points.length) {
    return null;
  }

  let left = 0;
  let right = points.length - 1;
  let bestIndex = -1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const middleDate = points[middle]!.date;

    if (middleDate <= targetDate) {
      bestIndex = middle;
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  if (bestIndex === -1) {
    return points[0] ?? null;
  }

  return points[bestIndex] ?? null;
}

function getPointOnOrAfter(points: NormalizedPoint[], targetDate: string) {
  if (!points.length) {
    return null;
  }

  let left = 0;
  let right = points.length - 1;
  let bestIndex = points.length;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const middleDate = points[middle]!.date;

    if (middleDate >= targetDate) {
      bestIndex = middle;
      right = middle - 1;
    } else {
      left = middle + 1;
    }
  }

  if (bestIndex >= points.length) {
    return null;
  }

  return points[bestIndex] ?? null;
}

function getResolvablePointOnOrBefore(points: NormalizedPoint[], targetDate: string) {
  if (!points.length || points[0]!.date > targetDate) {
    return null;
  }

  return getPointOnOrBefore(points, targetDate);
}

function getResolvablePointOnOrAfter(points: NormalizedPoint[], targetDate: string) {
  if (!points.length || points[points.length - 1]!.date < targetDate) {
    return null;
  }

  return getPointOnOrAfter(points, targetDate);
}

function maxDate(dates: string[]) {
  return [...dates].sort((left, right) => left.localeCompare(right)).at(-1) ?? dates[0]!;
}

function minDate(dates: string[]) {
  return [...dates].sort((left, right) => left.localeCompare(right))[0]!;
}

function applyPriceSeriesResolution(
  points: AssetPricePoint[],
  resolution: RaceResolution | "auto",
) {
  if (resolution === "auto" || resolution === "daily" || points.length <= 2) {
    return points;
  }

  const resolvedPoints: AssetPricePoint[] = [points[0]!];
  let activeBucketKey = "";
  let lastPointInBucket = points[0]!;
  let lastIncludedDate = points[0]!.date;

  const getBucketKey = (date: string) => {
    if (resolution === "monthly") {
      return date.slice(0, 7);
    }

    const parsedDate = parseDate(date);
    const weekAnchor = new Date(parsedDate.getTime());
    weekAnchor.setDate(parsedDate.getDate() - parsedDate.getDay());
    return formatLocalDate(weekAnchor);
  };

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]!;
    const bucketKey = getBucketKey(point.date);

    if (!activeBucketKey) {
      activeBucketKey = bucketKey;
    }

    if (bucketKey !== activeBucketKey) {
      if (lastPointInBucket.date !== lastIncludedDate) {
        resolvedPoints.push(lastPointInBucket);
        lastIncludedDate = lastPointInBucket.date;
      }
      activeBucketKey = bucketKey;
    }

    lastPointInBucket = point;
  }

  if (lastPointInBucket.date !== lastIncludedDate) {
    resolvedPoints.push(lastPointInBucket);
  }

  return resolvedPoints;
}

function isSyntheticAsset(assetId: ComparisonAssetId) {
  return assetId === "deposit" || assetId === "seoul_apt" || assetId === "gangnam_gu_apt";
}

export function supportsMonthlyContributionAsset(assetId: ComparisonAssetId) {
  return assetId !== "seoul_apt" && assetId !== "gangnam_gu_apt";
}

function getMarketValueAtDate(
  assetId: ComparisonAssetId,
  bundle: MarketBundle,
  principalKrw: number,
  startDate: string,
  currentDate: string,
) {
  const asset = assetCatalog[assetId];

  if (assetId === "deposit") {
    return getDepositValueAtDate(principalKrw, startDate, currentDate);
  }

  if (assetId === "seoul_apt") {
    return getRealEstateValueAtDate(assetId, principalKrw, startDate, currentDate);
  }

  if (assetId === "gangnam_gu_apt") {
    return getRealEstateValueAtDate(assetId, principalKrw, startDate, currentDate);
  }

  if (!asset.marketTicker) {
    return null;
  }

  const series = bundle.seriesByAsset[assetId];
  if (!series) {
    return null;
  }

  const startPoint = getPointOnOrBefore(series.daily, startDate);
  const currentPoint = getPointOnOrBefore(series.daily, currentDate);

  if (!startPoint || !currentPoint) {
    return null;
  }

  const fxSeries = asset.usesUsdFx ? bundle.usdkrw : null;
  const startFx = fxSeries
    ? (getPointOnOrBefore(fxSeries.daily, startDate)?.close ?? null)
    : 1;
  const currentFx = fxSeries
    ? (getPointOnOrBefore(fxSeries.daily, currentDate)?.close ?? null)
    : 1;

  if (!startFx || !currentFx) {
    return null;
  }

  return principalKrw * (currentPoint.close / startPoint.close) * (currentFx / startFx);
}

export function buildAssetPriceSeries(
  assetId: ComparisonAssetId,
  bundle: MarketBundle,
  startDate: string,
  endDate: string,
  resolution: RaceResolution | "auto" = "auto",
): AssetPricePoint[] {
  const asset = assetCatalog[assetId];

  if (assetId === "deposit") {
    return buildDepositSyntheticSeries(
      startDate,
      endDate,
      resolution === "auto" ? "monthly" : resolution,
    );
  }

  if (assetId === "seoul_apt") {
    return buildRealEstateProxySeries(
      assetId,
      startDate,
      endDate,
      resolution === "auto" ? "monthly" : resolution,
    );
  }

  if (assetId === "gangnam_gu_apt") {
    return buildRealEstateProxySeries(
      assetId,
      startDate,
      endDate,
      resolution === "auto" ? "monthly" : resolution,
    );
  }

  if (!asset.isAvailable || !asset.marketTicker) {
    throw new Error(`${asset.label}는 현재 수익의 대가 계산을 지원하지 않습니다.`);
  }

  const series = bundle.seriesByAsset[assetId];
  if (!series) {
    throw new Error(`${asset.label}의 실제 시계열 데이터를 불러오지 못했습니다.`);
  }

  const startPoint = getPointOnOrBefore(series.daily, startDate);
  const endPoint = getResolvablePointOnOrBefore(series.daily, endDate);

  if (!startPoint || !endPoint) {
    throw new Error(`${asset.label}의 비교 구간 데이터가 부족합니다.`);
  }

  const rawPoints = [
    startPoint,
    ...series.daily.filter((point) => point.date > startPoint.date && point.date <= endPoint.date),
  ];

  if (rawPoints.at(-1)?.date !== endPoint.date) {
    rawPoints.push(endPoint);
  }

  const convertedPoints = rawPoints.map((point) => {
    const fxPoint = asset.usesUsdFx
      ? getResolvablePointOnOrBefore(bundle.usdkrw?.daily ?? [], point.date)
      : null;

    if (asset.usesUsdFx && !fxPoint) {
      throw new Error(`${asset.label} 환산에 필요한 환율 데이터가 부족합니다.`);
    }

    return {
      date: point.date,
      price: point.close * (fxPoint?.close ?? 1),
    };
  });

  return applyPriceSeriesResolution(
    convertedPoints,
    resolution === "auto" ? "daily" : resolution,
  );
}

export function getRequestedDateRange(referenceDate = new Date()) {
  return getRequestedDateRangeForYears(FIXED_YEARS, referenceDate);
}

export function getRequestedDateRangeForYears(years: number, referenceDate = new Date()) {
  const endDate = new Date(referenceDate);
  const startDate = new Date(referenceDate);
  startDate.setFullYear(referenceDate.getFullYear() - years);

  return {
    end: formatLocalDate(endDate),
    start: formatLocalDate(startDate),
  };
}

export function parseAmountInput(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) {
    return 0;
  }

  return Math.min(Number(digits), INPUT_MAX_AMOUNT);
}

export function floorKrwToManUnit(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const sign = value < 0 ? -1 : 1;
  return sign * Math.floor(Math.abs(value) / 10_000) * 10_000;
}

export function parseManUnitAmountInput(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) {
    return 0;
  }

  return Math.min(Number(digits) * 10_000, INPUT_MAX_AMOUNT);
}

export function formatManUnitAmountInput(value: string | number) {
  const numericValue =
    typeof value === "number" ? floorKrwToManUnit(value) : parseManUnitAmountInput(value);
  if (!numericValue) {
    return "";
  }

  return numberFormatter.format(Math.floor(numericValue / 10_000));
}

export function formatAmountInput(value: string | number) {
  const numericValue = typeof value === "number" ? value : parseAmountInput(value);
  if (!numericValue) {
    return "";
  }

  return numberFormatter.format(numericValue);
}

export function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatDateRange(startDate: string, endDate: string) {
  return `${startDate.replace(/-/g, ".")} - ${endDate.replace(/-/g, ".")}`;
}

export function formatKrwCompact(value: number) {
  const rawAbsolute = Math.abs(Math.trunc(value));
  const flooredValue = floorKrwToManUnit(value);
  const absolute = Math.abs(flooredValue);
  const sign = value < 0 ? "-" : "";

  if (absolute >= 100_000_000) {
    const eok = Math.floor(absolute / 100_000_000);
    const man = Math.floor((absolute % 100_000_000) / 10_000);
    return `${sign}${eok}억${man > 0 ? ` ${numberFormatter.format(man)}만원` : ""}`;
  }

  if (absolute >= 10_000) {
    return `${sign}${numberFormatter.format(Math.floor(absolute / 10_000))}만원`;
  }

  if (rawAbsolute > 0) {
    return `${sign}1만원 미만`;
  }

  return "0만원";
}

export function formatAxisCurrency(value: number) {
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(1).replace(/\.0$/, "")}억`;
  }

  if (value >= 10_000) {
    return `${Math.floor(value / 10_000)}만`;
  }

  if (value > 0) {
    return "1만 미만";
  }

  return "0";
}

function buildMonthlyContributionDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  let cursor = parseDate(startDate);

  while (true) {
    const nextDate = formatLocalDate(cursor);

    if (nextDate >= endDate) {
      break;
    }

    dates.push(nextDate);
    cursor = addMonths(cursor, 1);
  }

  return dates;
}

function getTotalInvestedAtDate(
  contributionDates: string[],
  monthlyContributionKrw: number,
  currentDate: string,
) {
  return contributionDates.filter((date) => date <= currentDate).length * monthlyContributionKrw;
}

interface CashFlow {
  amount: number;
  date: string;
}

function calculateMoneyWeightedReturnPct(cashFlows: CashFlow[]) {
  if (
    cashFlows.length < 2 ||
    !cashFlows.some((flow) => flow.amount < 0) ||
    !cashFlows.some((flow) => flow.amount > 0)
  ) {
    return null;
  }

  const orderedFlows = [...cashFlows].sort((left, right) => left.date.localeCompare(right.date));
  const firstDate = orderedFlows[0]!.date;

  function netPresentValue(rate: number) {
    return orderedFlows.reduce((sum, flow) => {
      const years = getElapsedYears(firstDate, flow.date);
      return sum + flow.amount / Math.pow(1 + rate, years);
    }, 0);
  }

  let low = -0.999999;
  let high = 1;
  let lowValue = netPresentValue(low);
  let highValue = netPresentValue(high);

  while (lowValue * highValue > 0 && high < 1_000) {
    high *= 2;
    highValue = netPresentValue(high);
  }

  if (!Number.isFinite(lowValue) || !Number.isFinite(highValue) || lowValue * highValue > 0) {
    return null;
  }

  for (let iteration = 0; iteration < 100; iteration += 1) {
    const middle = (low + high) / 2;
    const middleValue = netPresentValue(middle);

    if (Math.abs(middleValue) < 0.0001) {
      return middle * 100;
    }

    if (lowValue * middleValue <= 0) {
      high = middle;
      highValue = middleValue;
    } else {
      low = middle;
      lowValue = middleValue;
    }
  }

  return ((low + high) / 2) * 100;
}

function getMonthlyContributionValueAtDate(
  assetId: ComparisonAssetId,
  bundle: MarketBundle,
  monthlyContributionKrw: number,
  contributionDates: string[],
  currentDate: string,
) {
  let totalValue = 0;

  for (const contributionDate of contributionDates) {
    if (contributionDate > currentDate) {
      continue;
    }

    const contributionValue = getMarketValueAtDate(
      assetId,
      bundle,
      monthlyContributionKrw,
      contributionDate,
      currentDate,
    );

    if (contributionValue === null) {
      return null;
    }

    totalValue += contributionValue;
  }

  return totalValue;
}

export function buildRaceData(
  assetIds: ComparisonAssetId[],
  bundle: MarketBundle,
  principalKrw: number,
  requestedStartDate: string,
  requestedEndDate: string,
  resolution: RaceResolution = "monthly",
): RaceBuildResult {
  const selectedAssets = assetIds.map((assetId) => assetCatalog[assetId]);
  const invalidAsset = selectedAssets.find(
    (asset) =>
      !asset.isAvailable ||
      (!asset.marketTicker && !isSyntheticAsset(asset.id)),
  );

  if (invalidAsset) {
    throw new Error(`${invalidAsset.label}는 현재 실데이터 기준으로만 노출됩니다.`);
  }

  const needsUsdFx = assetIds.some((assetId) => assetCatalog[assetId].usesUsdFx);
  if (needsUsdFx && !bundle.usdkrw) {
    throw new Error("USD/KRW 환율 데이터를 불러오지 못했습니다.");
  }

  const resolvedStartCandidates = assetIds.map((assetId) => {
    if (isSyntheticAsset(assetId)) {
      return requestedStartDate;
    }

    const series = bundle.seriesByAsset[assetId];
    const point = series ? getResolvablePointOnOrAfter(series.daily, requestedStartDate) : null;
    return point?.date ?? null;
  });
  const resolvedEndCandidates = assetIds.map((assetId) => {
    if (isSyntheticAsset(assetId)) {
      return requestedEndDate;
    }

    const series = bundle.seriesByAsset[assetId];
    const point = series
      ? getResolvablePointOnOrBefore(series.daily, requestedEndDate)
      : null;
    return point?.date ?? null;
  });

  if (needsUsdFx) {
    resolvedStartCandidates.push(
      bundle.usdkrw ? getResolvablePointOnOrAfter(bundle.usdkrw.daily, requestedStartDate)?.date ?? null : null,
    );
    resolvedEndCandidates.push(
      bundle.usdkrw ? getResolvablePointOnOrBefore(bundle.usdkrw.daily, requestedEndDate)?.date ?? null : null,
    );
  }

  if (resolvedStartCandidates.some((date) => !date) || resolvedEndCandidates.some((date) => !date)) {
    throw new Error("요청한 시작 시점에 비교 가능한 실제 데이터가 부족합니다.");
  }

  const commonStartDate = maxDate(resolvedStartCandidates.filter((date): date is string => Boolean(date)));
  const commonEndDate = minDate(resolvedEndCandidates.filter((date): date is string => Boolean(date)));

  const timeline = Array.from(
    new Set([
      commonStartDate,
      commonEndDate,
      ...assetIds.flatMap((assetId) =>
        buildAssetPriceSeries(
          assetId,
          bundle,
          commonStartDate,
          commonEndDate,
          resolution,
        ).map((point) => point.date),
      ),
    ]),
  )
    .filter((date) => date >= commonStartDate && date <= commonEndDate)
    .sort((left, right) => left.localeCompare(right));

  const points = timeline.flatMap((date, index) => {
    const point: RacePoint = {
      date,
      index,
      label: formatShortMonth(date),
    };

    for (const assetId of assetIds) {
      const value = getMarketValueAtDate(assetId, bundle, principalKrw, commonStartDate, date);
      if (value === null) {
        return [];
      }

      point[assetId] = value;
    }

    return [point];
  });

  if (!points.length) {
    throw new Error("비교 가능한 실제 데이터가 부족합니다.");
  }

  const finalPoint = points[points.length - 1]!;
  const totalYears = Math.max(1 / 365.25, getElapsedYears(commonStartDate, commonEndDate));

  const results = assetIds
    .map((assetId) => ({
      assetId,
      finalValue: Number(finalPoint[assetId]),
      label: assetCatalog[assetId].label,
    }))
    .sort((left, right) => right.finalValue - left.finalValue)
    .map((result, index) => ({
      ...result,
      annualizedReturnMethod: "cagr" as const,
      annualizedReturnPct: (Math.pow(result.finalValue / principalKrw, 1 / totalYears) - 1) * 100,
      cagrPct: (Math.pow(result.finalValue / principalKrw, 1 / totalYears) - 1) * 100,
      rank: index + 1,
      totalReturnPct: (result.finalValue / principalKrw - 1) * 100,
    }));

  return {
    points,
    requestedEndDate,
    requestedStartDate,
    resolvedEndDate: commonEndDate,
    resolvedStartDate: commonStartDate,
    results,
  };
}

export function buildSingleAssetSimulation(
  assetId: ComparisonAssetId,
  bundle: MarketBundle,
  principalKrw: number,
  requestedStartDate: string,
  requestedEndDate: string,
  resolution: RaceResolution = "monthly",
): SingleAssetSimulationResult {
  const build = buildRaceData(
    [assetId],
    bundle,
    principalKrw,
    requestedStartDate,
    requestedEndDate,
    resolution,
  );
  const result = build.results[0];

  if (!result) {
    throw new Error("단일 종목 결과를 계산하지 못했습니다.");
  }

  return {
    ...build,
    assetId,
    principalKrw,
    principalSeries: build.points.map((point) => ({
      date: point.date,
      index: point.index,
      label: point.label,
      value: principalKrw,
    })),
    result,
  };
}

export function buildMonthlyContributionRaceData(
  assetIds: ComparisonAssetId[],
  bundle: MarketBundle,
  monthlyContributionKrw: number,
  requestedStartDate: string,
  requestedEndDate: string,
): RaceBuildResult {
  const unsupportedAsset = assetIds
    .map((assetId) => assetCatalog[assetId])
    .find((asset) => !supportsMonthlyContributionAsset(asset.id));

  if (unsupportedAsset) {
    throw new Error("적립식은 예금, 주식, ETF, 금, 코인부터 지원합니다.");
  }

  const selectedAssets = assetIds.map((assetId) => assetCatalog[assetId]);
  const invalidAsset = selectedAssets.find(
    (asset) =>
      !asset.isAvailable ||
      (!asset.marketTicker && !isSyntheticAsset(asset.id)),
  );

  if (invalidAsset) {
    throw new Error(`${invalidAsset.label}은 현재 적립식 비교를 지원하지 않습니다.`);
  }

  const needsUsdFx = assetIds.some((assetId) => assetCatalog[assetId].usesUsdFx);
  if (needsUsdFx && !bundle.usdkrw) {
    throw new Error("USD/KRW 환율 데이터를 불러오지 못했습니다.");
  }

  const resolvedStartCandidates = assetIds.map((assetId) => {
    if (isSyntheticAsset(assetId)) {
      return requestedStartDate;
    }

    const series = bundle.seriesByAsset[assetId];
    const point = series ? getResolvablePointOnOrAfter(series.daily, requestedStartDate) : null;
    return point?.date ?? null;
  });
  const resolvedEndCandidates = assetIds.map((assetId) => {
    if (isSyntheticAsset(assetId)) {
      return requestedEndDate;
    }

    const series = bundle.seriesByAsset[assetId];
    const point = series
      ? getResolvablePointOnOrBefore(series.daily, requestedEndDate)
      : null;
    return point?.date ?? null;
  });

  if (needsUsdFx) {
    resolvedStartCandidates.push(
      bundle.usdkrw ? getResolvablePointOnOrAfter(bundle.usdkrw.daily, requestedStartDate)?.date ?? null : null,
    );
    resolvedEndCandidates.push(
      bundle.usdkrw ? getResolvablePointOnOrBefore(bundle.usdkrw.daily, requestedEndDate)?.date ?? null : null,
    );
  }

  if (resolvedStartCandidates.some((date) => !date) || resolvedEndCandidates.some((date) => !date)) {
    throw new Error("요청한 구간에 적립식 비교가 가능한 데이터가 부족합니다.");
  }

  const commonStartDate = maxDate(resolvedStartCandidates.filter((date): date is string => Boolean(date)));
  const commonEndDate = minDate(resolvedEndCandidates.filter((date): date is string => Boolean(date)));
  const contributionDates = buildMonthlyContributionDates(commonStartDate, commonEndDate);

  if (!contributionDates.length) {
    throw new Error("적립식 비교에는 최소 한 번 이상의 납입 구간이 필요합니다.");
  }

  const timeline = Array.from(
    new Set([
      commonStartDate,
      commonEndDate,
      ...contributionDates,
      ...assetIds.flatMap((assetId) =>
        buildAssetPriceSeries(
          assetId,
          bundle,
          commonStartDate,
          commonEndDate,
          "monthly",
        ).map((point) => point.date),
      ),
    ]),
  )
    .filter((date) => date >= commonStartDate && date <= commonEndDate)
    .sort((left, right) => left.localeCompare(right));

  const points = timeline.flatMap((date, index) => {
    const totalInvestedKrw = getTotalInvestedAtDate(
      contributionDates,
      monthlyContributionKrw,
      date,
    );

    if (totalInvestedKrw <= 0) {
      return [];
    }

    const point: RacePoint = {
      date,
      index,
      label: formatShortMonth(date),
      totalInvestedKrw,
    };

    for (const assetId of assetIds) {
      const value = getMonthlyContributionValueAtDate(
        assetId,
        bundle,
        monthlyContributionKrw,
        contributionDates,
        date,
      );

      if (value === null) {
        return [];
      }

      point[assetId] = value;
    }

    return [point];
  });

  if (!points.length) {
    throw new Error("적립식 비교가 가능한 데이터가 부족합니다.");
  }

  const finalPoint = points[points.length - 1]!;
  const totalInvestedKrw = Number(finalPoint.totalInvestedKrw);

  const results = assetIds
    .map((assetId) => {
      const finalValue = Number(finalPoint[assetId]);
      const profitKrw = finalValue - totalInvestedKrw;
      const returnOnInvestedPct = (finalValue / totalInvestedKrw - 1) * 100;
      const moneyWeightedReturnPct = calculateMoneyWeightedReturnPct([
        ...contributionDates.map((date) => ({
          amount: -monthlyContributionKrw,
          date,
        })),
        {
          amount: finalValue,
          date: commonEndDate,
        },
      ]);

      return {
        annualizedReturnMethod: moneyWeightedReturnPct === null ? "none" as const : "xirr" as const,
        annualizedReturnPct: moneyWeightedReturnPct,
        assetId,
        finalValue,
        label: assetCatalog[assetId].label,
        moneyWeightedReturnPct,
        profitKrw,
        returnOnInvestedPct,
        totalInvestedKrw,
        totalReturnPct: returnOnInvestedPct,
      };
    })
    .sort((left, right) => right.finalValue - left.finalValue)
    .map((result, index) => ({
      ...result,
      rank: index + 1,
    }));

  return {
    points,
    requestedEndDate,
    requestedStartDate,
    resolvedEndDate: commonEndDate,
    resolvedStartDate: commonStartDate,
    results,
  };
}

export function buildStartPointResult(
  assetId: ComparisonAssetId,
  bundle: MarketBundle,
  principalKrw: number,
  requestedStartDate: string,
  requestedEndDate: string,
): StartPointResult {
  const asset = assetCatalog[assetId];
  if (!asset.isAvailable || (!asset.marketTicker && !isSyntheticAsset(assetId))) {
    throw new Error(`${asset.label}는 현재 시작지점 비교를 지원하지 않습니다.`);
  }

  if (isSyntheticAsset(assetId)) {
    const finalValue =
      getMarketValueAtDate(assetId, bundle, principalKrw, requestedStartDate, requestedEndDate) ??
      principalKrw;
    const holdingYears = Math.max(1 / 365.25, getElapsedYears(requestedStartDate, requestedEndDate));

    return {
      assetId,
      cagrPct: (Math.pow(finalValue / principalKrw, 1 / holdingYears) - 1) * 100,
      finalValue,
      holdingYears,
      requestedEndDate,
      requestedStartDate,
      resolvedEndDate: requestedEndDate,
      resolvedStartDate: requestedStartDate,
      totalReturnPct: (finalValue / principalKrw - 1) * 100,
    };
  }

  const series = bundle.seriesByAsset[assetId];
  if (!series) {
    throw new Error(`${asset.label}의 실제 시계열 데이터를 불러오지 못했습니다.`);
  }

  const startPoint = getResolvablePointOnOrAfter(series.daily, requestedStartDate);
  const endPoint = getResolvablePointOnOrBefore(series.daily, requestedEndDate);
  if (!startPoint || !endPoint) {
    throw new Error(`${asset.label}는 요청한 시작 시점까지 비교할 데이터가 부족합니다.`);
  }

  const fxSeries = asset.usesUsdFx ? bundle.usdkrw : null;
  const startFx = fxSeries ? getResolvablePointOnOrAfter(fxSeries.daily, requestedStartDate) : null;
  const endFx = fxSeries ? getResolvablePointOnOrBefore(fxSeries.daily, requestedEndDate) : null;

  if (fxSeries && (!startFx || !endFx)) {
    throw new Error(`${asset.label} 환산에 필요한 환율 데이터가 부족합니다.`);
  }

  const startValue = principalKrw;
  const finalValue =
    principalKrw *
    (endPoint.close / startPoint.close) *
    ((endFx?.close ?? 1) / (startFx?.close ?? 1));
  const holdingYears = Math.max(1 / 365.25, getElapsedYears(startPoint.date, endPoint.date));

  return {
    assetId,
    cagrPct: (Math.pow(finalValue / startValue, 1 / holdingYears) - 1) * 100,
    finalValue,
    holdingYears,
    requestedEndDate,
    requestedStartDate,
    resolvedEndDate: endPoint.date,
    resolvedStartDate: startPoint.date,
    totalReturnPct: (finalValue / startValue - 1) * 100,
  };
}
