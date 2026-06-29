import type { HoldingPainReport } from "@/features/pain-of-holding";
import type { AssetOption, ComparisonAssetId } from "@/lib/home-content";
import { formatPercent, type RacePoint } from "@/lib/race-engine";

export type RaceMomentType = "breakaway" | "max_drawdown" | "recovery";
export type RaceMomentTone = "danger" | "lead" | "recovery";

export interface RaceMoment {
  assetId: ComparisonAssetId;
  date: string;
  id: string;
  index: number;
  title: string;
  tone: RaceMomentTone;
  type: RaceMomentType;
  valueLabel: string;
}

interface BuildRaceMomentsInput {
  assets: AssetOption[];
  maxMoments?: number;
  minIndexGap?: number;
  points: RacePoint[];
  reports?: Partial<Record<ComparisonAssetId, HoldingPainReport>>;
  results?: Array<{
    assetId: ComparisonAssetId;
    finalValue: number;
  }>;
}

type RaceMomentCandidate = RaceMoment & {
  priority: number;
};

const BREAKAWAY_RATIO = 1.25;
const MEANINGFUL_DRAWDOWN_PCT = -5;
const DEFAULT_MAX_MOMENTS = 3;
const DEFAULT_MIN_INDEX_GAP = 3;

function getAssetLabel(asset: AssetOption | undefined) {
  return asset?.shortLabel ?? asset?.label ?? "자산";
}

function formatMonth(date: string) {
  const [year, month] = date.split("-");
  return `${year}.${month}`;
}

function formatRatio(value: number) {
  return `${value.toFixed(2).replace(/0$/, "").replace(/\.0$/, "")}배`;
}

function getPointValue(point: RacePoint | undefined, assetId: ComparisonAssetId) {
  return Number(point?.[assetId] ?? 0);
}

function getFinalLeaderAssetId(
  assets: AssetOption[],
  points: RacePoint[],
  results?: BuildRaceMomentsInput["results"],
) {
  const resultLeader = results?.[0]?.assetId;

  if (resultLeader) {
    return resultLeader;
  }

  const finalPoint = points[points.length - 1];
  if (!finalPoint) {
    return null;
  }

  return (
    [...assets].sort(
      (left, right) => getPointValue(finalPoint, right.id) - getPointValue(finalPoint, left.id),
    )[0]?.id ?? null
  );
}

function findPointByIndex(points: RacePoint[], index: number) {
  return points.find((point) => point.index === index) ?? points[index] ?? null;
}

function buildBreakawayMoment({
  assets,
  finalLeaderAssetId,
  points,
}: {
  assets: AssetOption[];
  finalLeaderAssetId: ComparisonAssetId | null;
  points: RacePoint[];
}): RaceMomentCandidate | null {
  if (!finalLeaderAssetId || assets.length < 2) {
    return null;
  }

  const leader = assets.find((asset) => asset.id === finalLeaderAssetId);
  const competitors = assets.filter((asset) => asset.id !== finalLeaderAssetId);

  if (!leader || competitors.length === 0) {
    return null;
  }

  for (const point of points.slice(1)) {
    const leaderValue = getPointValue(point, finalLeaderAssetId);
    const secondValue = Math.max(...competitors.map((asset) => getPointValue(point, asset.id)));

    if (leaderValue <= 0 || secondValue <= 0) {
      continue;
    }

    const ratio = leaderValue / secondValue;
    if (ratio < BREAKAWAY_RATIO) {
      continue;
    }

    return {
      assetId: finalLeaderAssetId,
      date: point.date,
      id: `breakaway-${finalLeaderAssetId}-${point.index}`,
      index: point.index,
      priority: 2,
      title: "격차가 벌어진 순간",
      tone: "lead",
      type: "breakaway",
      valueLabel: `${getAssetLabel(leader)} · ${formatRatio(ratio)}`,
    };
  }

  return null;
}

function buildMaxDrawdownMoment({
  assets,
  points,
  reports,
}: {
  assets: AssetOption[];
  points: RacePoint[];
  reports: Partial<Record<ComparisonAssetId, HoldingPainReport>>;
}): RaceMomentCandidate | null {
  const candidate = assets
    .map((asset) => ({
      asset,
      report: reports[asset.id],
    }))
    .filter((entry): entry is { asset: AssetOption; report: HoldingPainReport } =>
      Boolean(entry.report),
    )
    .sort(
      (left, right) =>
        left.report.maxDrawdown.maxDrawdownPct - right.report.maxDrawdown.maxDrawdownPct,
    )[0];

  if (!candidate || candidate.report.maxDrawdown.maxDrawdownPct > MEANINGFUL_DRAWDOWN_PCT) {
    return null;
  }

  const point = findPointByIndex(points, candidate.report.maxDrawdown.troughIndex);
  if (!point) {
    return null;
  }

  return {
    assetId: candidate.asset.id,
    date: point.date,
    id: `max-drawdown-${candidate.asset.id}-${point.index}`,
    index: point.index,
    priority: 3,
    title: "가장 깊게 흔들린 순간",
    tone: "danger",
    type: "max_drawdown",
    valueLabel: `${getAssetLabel(candidate.asset)} · ${formatPercent(
      candidate.report.maxDrawdown.maxDrawdownPct,
    )}`,
  };
}

function buildRecoveryMoment({
  assets,
  finalLeaderAssetId,
  points,
  reports,
}: {
  assets: AssetOption[];
  finalLeaderAssetId: ComparisonAssetId | null;
  points: RacePoint[];
  reports: Partial<Record<ComparisonAssetId, HoldingPainReport>>;
}): RaceMomentCandidate | null {
  if (!finalLeaderAssetId) {
    return null;
  }

  const leader = assets.find((asset) => asset.id === finalLeaderAssetId);
  const report = reports[finalLeaderAssetId];

  if (
    !leader ||
    !report ||
    !report.recovery.recovered ||
    report.recovery.recoveryIndex === null ||
    report.recovery.recoveryIndex <= report.maxDrawdown.troughIndex ||
    report.maxDrawdown.maxDrawdownPct > MEANINGFUL_DRAWDOWN_PCT
  ) {
    return null;
  }

  const point = findPointByIndex(points, report.recovery.recoveryIndex);
  if (!point) {
    return null;
  }

  return {
    assetId: leader.id,
    date: point.date,
    id: `recovery-${leader.id}-${point.index}`,
    index: point.index,
    priority: 1,
    title: "전고점 회복",
    tone: "recovery",
    type: "recovery",
    valueLabel: `${getAssetLabel(leader)} · ${formatMonth(point.date)}`,
  };
}

function removeNearbyDuplicates(
  candidates: RaceMomentCandidate[],
  minIndexGap: number,
) {
  const selected: RaceMomentCandidate[] = [];

  for (const candidate of [...candidates].sort((left, right) => right.priority - left.priority)) {
    const hasNearbyMoment = selected.some(
      (selectedMoment) => Math.abs(selectedMoment.index - candidate.index) < minIndexGap,
    );

    if (!hasNearbyMoment) {
      selected.push(candidate);
    }
  }

  return selected;
}

export function buildRaceMoments({
  assets,
  maxMoments = DEFAULT_MAX_MOMENTS,
  minIndexGap = DEFAULT_MIN_INDEX_GAP,
  points,
  reports = {},
  results,
}: BuildRaceMomentsInput): RaceMoment[] {
  if (assets.length === 0 || points.length < 2) {
    return [];
  }

  const finalLeaderAssetId = getFinalLeaderAssetId(assets, points, results);
  const candidates = [
    buildBreakawayMoment({ assets, finalLeaderAssetId, points }),
    buildMaxDrawdownMoment({ assets, points, reports }),
    buildRecoveryMoment({ assets, finalLeaderAssetId, points, reports }),
  ].filter((moment): moment is RaceMomentCandidate => Boolean(moment));

  return removeNearbyDuplicates(candidates, minIndexGap)
    .sort((left, right) => left.index - right.index)
    .slice(0, maxMoments)
    .map((candidate) => ({
      assetId: candidate.assetId,
      date: candidate.date,
      id: candidate.id,
      index: candidate.index,
      title: candidate.title,
      tone: candidate.tone,
      type: candidate.type,
      valueLabel: candidate.valueLabel,
    }));
}
