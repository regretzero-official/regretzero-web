import type { CrisisRange } from "@/features/pain-of-holding";
import type { OhlcPoint } from "@/lib/market-data";

import type { DetailChartSeriesByTimeframe, DetailChartTimeframe } from "@/features/detail-chart/types";

export type CrisisChartMarkerId = "recovery" | "start" | "trough";

export interface CrisisChartMarker {
  color: string;
  date: string;
  id: CrisisChartMarkerId;
  label: string;
  position: "aboveBar" | "belowBar";
  shape: "arrowDown" | "arrowUp" | "circle";
}

function startOfWeek(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  nextDate.setUTCDate(nextDate.getUTCDate() + diff);
  return nextDate.toISOString().slice(0, 10);
}

function startOfMonth(date: Date) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(1);
  return nextDate.toISOString().slice(0, 10);
}

function aggregateOhlc(
  points: OhlcPoint[],
  getBucketKey: (date: Date) => string,
): OhlcPoint[] {
  if (points.length === 0) {
    return [];
  }

  const grouped = new Map<string, OhlcPoint[]>();
  for (const point of points) {
    const key = getBucketKey(new Date(`${point.date}T00:00:00Z`));
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(point);
    } else {
      grouped.set(key, [point]);
    }
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, bucket]) => {
      const first = bucket[0]!;
      const last = bucket[bucket.length - 1]!;

      return {
        close: last.close,
        date: last.date,
        high: Math.max(...bucket.map((point) => point.high)),
        low: Math.min(...bucket.map((point) => point.low)),
        open: first.open,
      };
    });
}

function findFirstIndexOnOrAfter(points: OhlcPoint[], targetDate: string) {
  const index = points.findIndex((point) => point.date >= targetDate);
  return index >= 0 ? index : points.length - 1;
}

function findPointOnOrAfter(points: OhlcPoint[], targetDate: string) {
  if (points.length === 0) {
    return null;
  }

  return points[findFirstIndexOnOrAfter(points, targetDate)] ?? null;
}

export function buildDetailChartSeries(points: OhlcPoint[]): DetailChartSeriesByTimeframe {
  return {
    daily: points,
    monthly: aggregateOhlc(points, startOfMonth),
    weekly: aggregateOhlc(points, startOfWeek),
  };
}

export function buildInitialFocusRange(
  points: OhlcPoint[],
  crisis: CrisisRange,
  timeframe: DetailChartTimeframe,
) {
  if (points.length === 0) {
    return null;
  }

  const startIndex = findFirstIndexOnOrAfter(points, crisis.startDate);
  const anchorDate = crisis.endDate ?? crisis.troughDate;
  const endIndex = findFirstIndexOnOrAfter(points, anchorDate);
  const paddingByTimeframe: Record<DetailChartTimeframe, number> = {
    daily: 45,
    monthly: 12,
    weekly: 28,
  };
  const padding = paddingByTimeframe[timeframe];

  return {
    from: Math.max(0, startIndex - padding),
    to: Math.min(points.length - 1, Math.max(endIndex + padding, startIndex + 8)),
  };
}

export function formatCrisisPeriodLabel(crisis: CrisisRange) {
  const start = crisis.startDate.replace(/-/g, ".");
  const end = (crisis.endDate ?? crisis.troughDate).replace(/-/g, ".");
  const suffix = crisis.endDate ? "고비" : "진행 중인 고비";
  return `${start} ~ ${end} ${suffix}`;
}

export function buildCrisisChartMarkers(
  points: OhlcPoint[],
  crisis: CrisisRange,
): CrisisChartMarker[] {
  const startPoint = findPointOnOrAfter(points, crisis.startDate);
  const troughPoint = findPointOnOrAfter(points, crisis.troughDate);
  const recoveryPoint = crisis.endDate ? findPointOnOrAfter(points, crisis.endDate) : null;
  const markers: CrisisChartMarker[] = [];

  if (startPoint) {
    markers.push({
      color: "#2563EB",
      date: startPoint.date,
      id: "start",
      label: "하락 시작",
      position: "aboveBar",
      shape: "arrowDown",
    });
  }

  if (troughPoint) {
    markers.push({
      color: "#E11D48",
      date: troughPoint.date,
      id: "trough",
      label: "가장 힘든 날",
      position: "belowBar",
      shape: "circle",
    });
  }

  if (recoveryPoint) {
    markers.push({
      color: "#059669",
      date: recoveryPoint.date,
      id: "recovery",
      label: "회복",
      position: "aboveBar",
      shape: "arrowUp",
    });
  }

  return markers;
}
