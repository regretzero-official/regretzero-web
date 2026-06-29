export type RealEstateProxyAssetId = "gangnam_gu_apt" | "seoul_apt";

export interface RealEstateProxyPoint {
  date: string;
  price: number;
}

type ProxySeriesResolution = "daily" | "monthly" | "weekly";

interface AnchorPoint {
  date: string;
  price: number;
}

const REAL_ESTATE_PROXY_ANCHORS: Record<RealEstateProxyAssetId, AnchorPoint[]> = {
  seoul_apt: [
    { date: "2011-08-01", price: 460_000_000 },
    { date: "2012-08-01", price: 445_000_000 },
    { date: "2013-08-01", price: 455_000_000 },
    { date: "2014-08-01", price: 485_000_000 },
    { date: "2015-08-01", price: 520_000_000 },
    { date: "2016-08-01", price: 600_000_000 },
    { date: "2017-08-01", price: 720_000_000 },
    { date: "2018-08-01", price: 900_000_000 },
    { date: "2019-08-01", price: 1_020_000_000 },
    { date: "2020-08-01", price: 1_150_000_000 },
    { date: "2021-08-01", price: 1_350_000_000 },
    { date: "2022-08-01", price: 1_450_000_000 },
    { date: "2023-08-01", price: 1_300_000_000 },
    { date: "2024-08-01", price: 1_340_000_000 },
    { date: "2025-08-01", price: 1_430_000_000 },
    { date: "2026-08-01", price: 1_520_000_000 },
    { date: "2027-08-01", price: 1_600_000_000 },
  ],
  gangnam_gu_apt: [
    { date: "2011-08-01", price: 820_000_000 },
    { date: "2012-08-01", price: 790_000_000 },
    { date: "2013-08-01", price: 810_000_000 },
    { date: "2014-08-01", price: 850_000_000 },
    { date: "2015-08-01", price: 900_000_000 },
    { date: "2016-08-01", price: 1_100_000_000 },
    { date: "2017-08-01", price: 1_350_000_000 },
    { date: "2018-08-01", price: 1_750_000_000 },
    { date: "2019-08-01", price: 2_050_000_000 },
    { date: "2020-08-01", price: 2_350_000_000 },
    { date: "2021-08-01", price: 2_750_000_000 },
    { date: "2022-08-01", price: 3_200_000_000 },
    { date: "2023-08-01", price: 2_950_000_000 },
    { date: "2024-08-01", price: 3_100_000_000 },
    { date: "2025-08-01", price: 3_350_000_000 },
    { date: "2026-08-01", price: 3_550_000_000 },
    { date: "2027-08-01", price: 3_800_000_000 },
  ],
};

function parseDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function formatDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
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

function addDays(date: Date, daysToAdd: number) {
  return new Date(date.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
}

function interpolatePrice(
  previousPoint: AnchorPoint,
  nextPoint: AnchorPoint,
  targetDate: string,
) {
  const previousDate = parseDate(previousPoint.date).getTime();
  const nextDate = parseDate(nextPoint.date).getTime();
  const currentDate = parseDate(targetDate).getTime();

  if (nextDate <= previousDate) {
    return previousPoint.price;
  }

  const progress = Math.min(
    1,
    Math.max(0, (currentDate - previousDate) / (nextDate - previousDate)),
  );

  return previousPoint.price + (nextPoint.price - previousPoint.price) * progress;
}

function getAnchorSeries(assetId: RealEstateProxyAssetId) {
  return REAL_ESTATE_PROXY_ANCHORS[assetId];
}

export function getRealEstateProxyAnchors(assetId: RealEstateProxyAssetId) {
  return [...getAnchorSeries(assetId)];
}

export function getRealEstateProxyPriceAtDate(
  assetId: RealEstateProxyAssetId,
  targetDate: string,
) {
  const anchors = getAnchorSeries(assetId);

  if (targetDate <= anchors[0]!.date) {
    return anchors[0]!.price;
  }

  for (let index = 0; index < anchors.length - 1; index += 1) {
    const previousPoint = anchors[index]!;
    const nextPoint = anchors[index + 1]!;

    if (targetDate <= nextPoint.date) {
      return interpolatePrice(previousPoint, nextPoint, targetDate);
    }
  }

  return anchors[anchors.length - 1]!.price;
}

export function buildRealEstateProxySeries(
  assetId: RealEstateProxyAssetId,
  startDate: string,
  endDate: string,
  resolution: ProxySeriesResolution = "monthly",
): RealEstateProxyPoint[] {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (end.getTime() <= start.getTime()) {
    return [{ date: startDate, price: getRealEstateProxyPriceAtDate(assetId, startDate) }];
  }

  const points: RealEstateProxyPoint[] = [];
  const addedDates = new Set<string>();

  const pushPoint = (date: string) => {
    if (addedDates.has(date)) {
      return;
    }

    points.push({
      date,
      price: getRealEstateProxyPriceAtDate(assetId, date),
    });
    addedDates.add(date);
  };

  pushPoint(startDate);

  let cursor = start;
  while (true) {
    cursor =
      resolution === "daily"
        ? addDays(cursor, 1)
        : resolution === "weekly"
          ? addDays(cursor, 7)
          : addMonths(cursor, 1);
    const nextDate = formatDate(cursor);

    if (nextDate >= endDate) {
      break;
    }

    pushPoint(nextDate);
  }

  pushPoint(endDate);

  return points;
}

export function getRealEstateGrowthFactor(
  assetId: RealEstateProxyAssetId,
  startDate: string,
  endDate: string,
) {
  const diffMs = parseDate(endDate).getTime() - parseDate(startDate).getTime();
  if (diffMs <= 0) {
    return 1;
  }

  const startPrice = getRealEstateProxyPriceAtDate(assetId, startDate);
  const endPrice = getRealEstateProxyPriceAtDate(assetId, endDate);

  if (!startPrice) {
    return 1;
  }

  return endPrice / startPrice;
}

export function getRealEstateValueAtDate(
  assetId: RealEstateProxyAssetId,
  principalKrw: number,
  startDate: string,
  currentDate: string,
) {
  return principalKrw * getRealEstateGrowthFactor(assetId, startDate, currentDate);
}

// Development guard so Seoul and Gangnam-gu cannot silently collapse into one path again.
(() => {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const validationAssetIds: RealEstateProxyAssetId[] = ["seoul_apt", "gangnam_gu_apt"];

  if (new Set(validationAssetIds).size !== validationAssetIds.length) {
    throw new Error("서울 아파트와 강남구 아파트가 동일한 내부 키를 사용하고 있습니다.");
  }

  const seoulAnchors = REAL_ESTATE_PROXY_ANCHORS.seoul_apt;
  const gangnamGuAnchors = REAL_ESTATE_PROXY_ANCHORS.gangnam_gu_apt;

  const sameLength = seoulAnchors.length === gangnamGuAnchors.length;
  const sameSeries = sameLength
    && seoulAnchors.every((anchor, index) => {
      const other = gangnamGuAnchors[index];
      return other && anchor.date === other.date && anchor.price === other.price;
    });

  if (sameSeries) {
    throw new Error("서울 아파트와 강남구 아파트 비교 시계열이 동일하게 설정되어 있습니다.");
  }

  const validationStartDate = "2015-08-01";
  const validationEndDate = "2025-08-01";
  const seoulGrowthFactor = getRealEstateGrowthFactor("seoul_apt", validationStartDate, validationEndDate);
  const gangnamGuGrowthFactor = getRealEstateGrowthFactor("gangnam_gu_apt", validationStartDate, validationEndDate);
  const seoulTotalReturnPct = (seoulGrowthFactor - 1) * 100;
  const gangnamGuTotalReturnPct = (gangnamGuGrowthFactor - 1) * 100;
  const seoulCagrPct = (Math.pow(seoulGrowthFactor, 1 / 10) - 1) * 100;
  const gangnamGuCagrPct = (Math.pow(gangnamGuGrowthFactor, 1 / 10) - 1) * 100;

  if (Math.abs(seoulTotalReturnPct - gangnamGuTotalReturnPct) < 0.000001) {
    throw new Error("서울 아파트와 강남구 아파트의 10년 총수익률이 동일하게 설정되어 있습니다.");
  }

  if (Math.abs(seoulCagrPct - gangnamGuCagrPct) < 0.000001) {
    throw new Error("서울 아파트와 강남구 아파트의 CAGR이 동일하게 설정되어 있습니다.");
  }

  const principalKrw = 300_000_000;
  const seoulFinalAmount = principalKrw * seoulGrowthFactor;
  const gangnamGuFinalAmount = principalKrw * gangnamGuGrowthFactor;
  const finalAmountGap = Math.abs(gangnamGuFinalAmount - seoulFinalAmount);

  if (Math.abs(seoulFinalAmount - gangnamGuFinalAmount) < 0.000001) {
    throw new Error("서울 아파트와 강남구 아파트의 3억원 시뮬레이션 결과가 동일하게 설정되어 있습니다.");
  }

  if (finalAmountGap < 200_000_000) {
    throw new Error("서울 아파트와 강남구 아파트의 3억원 시뮬레이션 결과 차이가 너무 작습니다.");
  }
})();
