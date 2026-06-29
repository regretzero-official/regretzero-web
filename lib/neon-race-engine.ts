import type { RacePoint } from "@/lib/race-engine";

export type NeonTempoMultiplier = 0.5 | 1 | 3;
export type NeonTempoClassification = "fast-forward" | "normal" | "slow-motion";

export interface NeonRaceTempoSegment {
  classification: NeonTempoClassification;
  fromIndex: number;
  multiplier: NeonTempoMultiplier;
  rankChanged: boolean;
  toIndex: number;
  volatility: number;
}

export interface NeonRankFlashEvent {
  assetId: string;
  durationMs: number;
  pointIndex: number;
}

export interface NeonCameraDomain {
  max: number;
  min: number;
}

export interface NeonPlaybackTimeline {
  cumulativeWeights: number[];
  totalWeight: number;
}

export interface NeonMediaRecorderChoice {
  extension: "mp4" | "webm";
  mimeType: string;
}

export const NEON_RANK_FLASH_DURATION_MS = 500;
export const NEON_RACE_EXPORT_BITRATE = 12_000_000;
export const NEON_CAMERA_LERP_ALPHA = 0.12;

export const NEON_MEDIA_RECORDER_MIME_CANDIDATES: NeonMediaRecorderChoice[] = [
  { extension: "webm", mimeType: "video/webm;codecs=vp9" },
  { extension: "webm", mimeType: "video/webm;codecs=vp8" },
  { extension: "mp4", mimeType: "video/mp4" },
];

const DAILY_VOLATILITY_THRESHOLD = 0.025;
const WEEKLY_VOLATILITY_THRESHOLD = 0.04;
const MONTHLY_VOLATILITY_THRESHOLD = 0.08;

function parseDateMs(date: string) {
  return new Date(`${date}T00:00:00`).getTime();
}

function median(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle]!;
  }

  return (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function inferVolatilityThreshold(points: Array<Pick<RacePoint, "date">>) {
  const dayDiffs: number[] = [];

  for (let index = 1; index < points.length; index += 1) {
    const previousTime = parseDateMs(points[index - 1]!.date);
    const currentTime = parseDateMs(points[index]!.date);
    const diffDays = (currentTime - previousTime) / (24 * 60 * 60 * 1000);

    if (Number.isFinite(diffDays) && diffDays > 0) {
      dayDiffs.push(diffDays);
    }
  }

  const medianDays = median(dayDiffs);

  if (medianDays <= 3) {
    return DAILY_VOLATILITY_THRESHOLD;
  }

  if (medianDays <= 10) {
    return WEEKLY_VOLATILITY_THRESHOLD;
  }

  return MONTHLY_VOLATILITY_THRESHOLD;
}

export function rankAssetIdsAtPoint(point: RacePoint, assetIds: string[]) {
  return [...assetIds].sort(
    (left, right) => Number(point[right] ?? 0) - Number(point[left] ?? 0),
  );
}

export function analyzeNeonTempoSegment({
  assetIds,
  currentPoint,
  previousPoint,
  threshold,
}: {
  assetIds: string[];
  currentPoint: RacePoint;
  previousPoint: RacePoint;
  threshold: number;
}): Pick<NeonRaceTempoSegment, "classification" | "multiplier" | "rankChanged" | "volatility"> {
  const previousRanks = rankAssetIdsAtPoint(previousPoint, assetIds);
  const currentRanks = rankAssetIdsAtPoint(currentPoint, assetIds);
  let maxChange = 0;
  let totalChange = 0;
  let measuredAssetCount = 0;

  for (const assetId of assetIds) {
    const previousValue = Number(previousPoint[assetId] ?? 0);
    const currentValue = Number(currentPoint[assetId] ?? 0);

    if (previousValue <= 0 || currentValue <= 0) {
      continue;
    }

    const relativeChange = Math.abs(currentValue / previousValue - 1);
    maxChange = Math.max(maxChange, relativeChange);
    totalChange += relativeChange;
    measuredAssetCount += 1;
  }

  const rankChanged = assetIds.some(
    (assetId) => previousRanks.indexOf(assetId) !== currentRanks.indexOf(assetId),
  );
  const averageChange = measuredAssetCount > 0 ? totalChange / measuredAssetCount : 0;
  const volatility = Math.max(maxChange, averageChange);

  if (rankChanged || volatility >= threshold) {
    return {
      classification: "slow-motion",
      multiplier: 0.5,
      rankChanged,
      volatility,
    };
  }

  if (volatility <= threshold * 0.18 && averageChange <= threshold * 0.16) {
    return {
      classification: "fast-forward",
      multiplier: 3,
      rankChanged: false,
      volatility,
    };
  }

  return {
    classification: "normal",
    multiplier: 1,
    rankChanged: false,
    volatility,
  };
}

export function buildNeonTempoSegments(
  points: RacePoint[],
  assetIds: string[],
  threshold = inferVolatilityThreshold(points),
): NeonRaceTempoSegment[] {
  if (points.length <= 1) {
    return [];
  }

  const segments: NeonRaceTempoSegment[] = [];

  for (let index = 1; index < points.length; index += 1) {
    const analyzed = analyzeNeonTempoSegment({
      assetIds,
      currentPoint: points[index]!,
      previousPoint: points[index - 1]!,
      threshold,
    });

    segments.push({
      ...analyzed,
      fromIndex: index - 1,
      toIndex: index,
    });
  }

  return segments;
}

export function buildNeonRankFlashEvents(
  points: RacePoint[],
  assetIds: string[],
  durationMs = NEON_RANK_FLASH_DURATION_MS,
): NeonRankFlashEvent[] {
  const events: NeonRankFlashEvent[] = [];

  for (let index = 1; index < points.length; index += 1) {
    const previousRanks = rankAssetIdsAtPoint(points[index - 1]!, assetIds);
    const currentRanks = rankAssetIdsAtPoint(points[index]!, assetIds);

    for (const assetId of assetIds) {
      if (previousRanks.indexOf(assetId) !== currentRanks.indexOf(assetId)) {
        events.push({
          assetId,
          durationMs,
          pointIndex: index,
        });
      }
    }
  }

  return events;
}

export function buildNeonPlaybackTimeline(
  points: RacePoint[],
  assetIds: string[],
): NeonPlaybackTimeline {
  if (points.length <= 1) {
    return {
      cumulativeWeights: [0],
      totalWeight: 1,
    };
  }

  const segments = buildNeonTempoSegments(points, assetIds);
  const cumulativeWeights = [0];
  let runningWeight = 0;

  for (const segment of segments) {
    runningWeight += 1 / segment.multiplier;
    cumulativeWeights.push(runningWeight);
  }

  return {
    cumulativeWeights,
    totalWeight: Math.max(runningWeight, 1),
  };
}

export function getNeonVisibleCountForProgress(
  progress: number,
  totalPoints: number,
  timeline: NeonPlaybackTimeline,
) {
  if (totalPoints <= 1) {
    return 1;
  }

  if (progress <= 0) {
    return 1;
  }

  if (progress >= 1) {
    return totalPoints;
  }

  const targetWeight = timeline.totalWeight * progress;
  const { cumulativeWeights } = timeline;
  let lowerBound = 0;
  let upperBound = cumulativeWeights.length - 1;

  while (lowerBound < upperBound) {
    const middle = Math.floor((lowerBound + upperBound) / 2);

    if (cumulativeWeights[middle]! < targetWeight) {
      lowerBound = middle + 1;
    } else {
      upperBound = middle;
    }
  }

  return Math.max(2, Math.min(totalPoints, lowerBound + 1));
}

export function getTargetNeonCameraDomain(values: number[]): NeonCameraDomain {
  const validValues = values.filter((value) => Number.isFinite(value) && value > 0);

  if (!validValues.length) {
    return { max: 1.6, min: 0.55 };
  }

  const rawMin = Math.min(...validValues);
  const rawMax = Math.max(...validValues);
  const min = Math.max(0.55, rawMin * 0.82);
  const max = Math.max(1.25, rawMax * 1.15);

  if (max / min < 1.35) {
    const center = Math.sqrt(min * max);
    return {
      max: center * 1.18,
      min: Math.max(0.55, center / 1.18),
    };
  }

  return { max, min };
}

export function lerpNeonCameraDomain(
  current: NeonCameraDomain,
  target: NeonCameraDomain,
  alpha = NEON_CAMERA_LERP_ALPHA,
): NeonCameraDomain {
  return {
    max: current.max + (target.max - current.max) * alpha,
    min: current.min + (target.min - current.min) * alpha,
  };
}

export function chooseNeonMediaRecorderMimeType(
  isTypeSupported: (mimeType: string) => boolean,
): NeonMediaRecorderChoice | null {
  return (
    NEON_MEDIA_RECORDER_MIME_CANDIDATES.find((candidate) =>
      isTypeSupported(candidate.mimeType),
    ) ?? null
  );
}
