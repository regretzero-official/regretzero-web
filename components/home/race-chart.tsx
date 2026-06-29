"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Download, Maximize2, Minimize2, Video } from "lucide-react";

import { getAssetColor } from "@/lib/asset-colors";
import { assetCatalog } from "@/lib/home-content";
import {
  buildNeonPlaybackTimeline,
  buildNeonTempoSegments,
  chooseNeonMediaRecorderMimeType,
  getNeonVisibleCountForProgress,
  getTargetNeonCameraDomain,
  lerpNeonCameraDomain,
  NEON_CAMERA_LERP_ALPHA,
  NEON_RACE_EXPORT_BITRATE,
  NEON_RANK_FLASH_DURATION_MS,
  type NeonCameraDomain,
  type NeonPlaybackTimeline,
  type NeonRaceTempoSegment,
  type NeonTempoMultiplier,
} from "@/lib/neon-race-engine";
import { formatKrwCompact, type RacePoint } from "@/lib/race-engine";
import type { RaceMoment, RaceMomentTone } from "@/features/chart-race/buildRaceMoments";

export interface RaceChartAsset {
  id: string;
  label: string;
  shortLabel?: string;
}

interface RaceChartProps {
  assets: RaceChartAsset[];
  basisLabel?: string;
  currentPoint: RacePoint | null;
  data: RacePoint[];
  fullData: RacePoint[];
  headerSubtitle?: string;
  headerTitle?: string;
  isLoading: boolean;
  moments?: RaceMoment[];
  onSelectMoment?: (moment: RaceMoment) => void;
  principalKrw: number;
  valueBasis?: "initial" | "invested";
}

interface PlotMetrics {
  height: number;
  width: number;
}

interface NeonRaceAssetVisual {
  asset: RaceChartAsset;
  color: string;
  glow: string;
  label: string;
  logoUrl: string | null;
  ticker: string;
}

interface NeonPoint {
  date: string;
  index: number;
  label: string;
  multiples: Record<string, number>;
  values: Record<string, number>;
}

interface NeonRaceFrameState {
  camera: NeonCameraDomain | null;
  playhead: number;
  rankFlash: Record<string, number>;
  tempoMultiplier: NeonTempoMultiplier;
}

interface NeonRaceExportOptions {
  bitrate: number;
  durationMs: number;
  fps: number;
  height: number;
  width: number;
}

interface RenderModel {
  activeTempo: NeonRaceTempoSegment | null;
  assets: RaceChartAsset[];
  basisLabel: string;
  currentPoint: RacePoint | null;
  fullData: RacePoint[];
  headerTitle: string;
  isShortformMode: boolean;
  normalizedPoints: NeonPoint[];
  playbackTimeline: NeonPlaybackTimeline;
  principalKrw: number;
  tempoSegments: NeonRaceTempoSegment[];
  valueBasis: "initial" | "invested";
  visuals: NeonRaceAssetVisual[];
  visibleCount: number;
}

interface GridCache {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  key: string;
}

interface ExportReplayState {
  durationMs: number;
  startedAt: number;
  stop: () => void;
  stopping: boolean;
}

const NORMAL_EXPORT_DURATION_MS = 14_000;
const SHORTFORM_WIDTH = 1080;
const SHORTFORM_HEIGHT = 1920;
const EXPORT_OPTIONS: NeonRaceExportOptions = {
  bitrate: NEON_RACE_EXPORT_BITRATE,
  durationMs: NORMAL_EXPORT_DURATION_MS,
  fps: 60,
  height: SHORTFORM_HEIGHT,
  width: SHORTFORM_WIDTH,
};

const BRAND_DOMAIN_BY_ASSET_ID: Record<string, string> = {
  "000660": "skhynix.com",
  "005380": "hyundai.com",
  "005930": "samsung.com",
  aapl: "apple.com",
  amd: "amd.com",
  amzn: "amazon.com",
  avgo: "broadcom.com",
  btc: "bitcoin.org",
  eth: "ethereum.org",
  googl: "abc.xyz",
  jpm: "jpmorganchase.com",
  meta: "meta.com",
  msft: "microsoft.com",
  nvda: "nvidia.com",
  qqq: "invesco.com",
  schd: "schwabassetmanagement.com",
  smh: "vaneck.com",
  soxl: "direxion.com",
  spy: "ssga.com",
  tqqq: "proshares.com",
  tsla: "tesla.com",
  voo: "vanguard.com",
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : normalized;
  const parsed = Number.parseInt(value, 16);
  const red = (parsed >> 16) & 255;
  const green = (parsed >> 8) & 255;
  const blue = parsed & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function formatCurrentDate(date: string) {
  const [year, month] = date.split("-");
  return `${year}.${month}`;
}

function formatYear(date: string) {
  return date.slice(0, 4);
}

function formatMultiple(value: number, basis: number) {
  const multiple = basis > 0 ? value / basis : 1;

  if (multiple >= 10) {
    return `${multiple.toFixed(1).replace(/\.0$/, "")}배`;
  }

  return `${multiple.toFixed(2).replace(/0$/, "").replace(/\.0$/, "")}배`;
}

function formatNormalizedMultiple(value: number) {
  if (value >= 10) {
    return `${value.toFixed(1).replace(/\.0$/, "")}x`;
  }

  return `${value.toFixed(2).replace(/0$/, "").replace(/\.0$/, "")}x`;
}

function getPointBasis(
  point: RacePoint | null,
  principalKrw: number,
  valueBasis: "initial" | "invested",
) {
  if (valueBasis !== "invested" || !point) {
    return principalKrw;
  }

  const totalInvested = Number(point.totalInvestedKrw ?? 0);
  return totalInvested > 0 ? totalInvested : principalKrw;
}

function getRaceCardLabel(asset: RaceChartAsset) {
  return asset.shortLabel ?? asset.label;
}

function getAssetTicker(asset: RaceChartAsset) {
  const catalogAsset = assetCatalog[asset.id];
  return catalogAsset?.marketTicker ?? asset.shortLabel ?? asset.label;
}

function getBrandfetchLogoUrl(asset: RaceChartAsset) {
  const clientId = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID;
  const domain = BRAND_DOMAIN_BY_ASSET_ID[asset.id];

  if (!clientId || !domain) {
    return null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BRANDFETCH_LOGO_BASE_URL ?? "https://cdn.brandfetch.io";
  const url = new URL(domain, `${baseUrl.replace(/\/$/, "")}/`);
  url.searchParams.set("c", clientId);
  return url.toString();
}

function makeFallbackMark(visual: NeonRaceAssetVisual) {
  const source = visual.ticker || visual.label || visual.asset.id;
  const cleaned = source.replace(/[^0-9A-Za-z가-힣]/g, "");
  return (cleaned || visual.asset.id).slice(0, 4).toUpperCase();
}

function roundRect(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  if ("roundRect" in ctx && typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    return;
  }

  const resolvedRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + resolvedRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, resolvedRadius);
  ctx.arcTo(x + width, y + height, x, y + height, resolvedRadius);
  ctx.arcTo(x, y + height, x, y, resolvedRadius);
  ctx.arcTo(x, y, x + width, y, resolvedRadius);
  ctx.closePath();
}

function getMomentToneStyle(tone: RaceMomentTone) {
  if (tone === "danger") {
    return {
      backgroundColor: "rgba(248,113,113,0.18)",
      borderColor: "rgba(248,113,113,0.42)",
      color: "#fca5a5",
    };
  }

  if (tone === "recovery") {
    return {
      backgroundColor: "rgba(34,197,94,0.18)",
      borderColor: "rgba(34,197,94,0.34)",
      color: "#86efac",
    };
  }

  return {
    backgroundColor: "rgba(96,165,250,0.18)",
    borderColor: "rgba(96,165,250,0.42)",
    color: "#93c5fd",
  };
}

function getTempoLabel(segment: NeonRaceTempoSegment | null) {
  if (!segment) {
    return "LIVE TEMPO";
  }

  if (segment.multiplier === 0.5) {
    return segment.rankChanged ? "RANK FLASH · 0.5x" : "SLOW MOTION · 0.5x";
  }

  if (segment.multiplier === 3) {
    return "FAST FORWARD · 3x";
  }

  return "LIVE TEMPO · 1x";
}

function buildNormalizedPoints({
  assets,
  fullData,
  principalKrw,
  valueBasis,
}: {
  assets: RaceChartAsset[];
  fullData: RacePoint[];
  principalKrw: number;
  valueBasis: "initial" | "invested";
}): NeonPoint[] {
  if (!fullData.length) {
    return [];
  }

  const initialPoint = fullData[0]!;

  return fullData.map((point) => {
    const nextPoint: NeonPoint = {
      date: point.date,
      index: point.index,
      label: point.label,
      multiples: {},
      values: {},
    };

    for (const asset of assets) {
      const actualValue = Number(point[asset.id] ?? principalKrw);
      const baseValue =
        valueBasis === "invested"
          ? getPointBasis(point, principalKrw, valueBasis)
          : Number(initialPoint[asset.id] ?? principalKrw);

      nextPoint.values[asset.id] = actualValue;
      nextPoint.multiples[asset.id] = baseValue > 0 ? actualValue / baseValue : 1;
    }

    return nextPoint;
  });
}

function getRankedSummaries({
  assets,
  currentPoint,
  normalizedPoint,
  principalKrw,
  valueBasis,
  visuals,
}: {
  assets: RaceChartAsset[];
  currentPoint: RacePoint | null;
  normalizedPoint: NeonPoint | null;
  principalKrw: number;
  valueBasis: "initial" | "invested";
  visuals: NeonRaceAssetVisual[];
}) {
  const basis = getPointBasis(currentPoint, principalKrw, valueBasis);
  const summaries = assets.map((asset) => {
    const visual = visuals.find((item) => item.asset.id === asset.id);
    const value = currentPoint ? Number(currentPoint[asset.id] ?? principalKrw) : principalKrw;

    return {
      asset,
      color: visual?.color ?? getAssetColor(asset.id),
      multiple: normalizedPoint?.multiples[asset.id] ?? (basis > 0 ? value / basis : 1),
      rank: 1,
      value,
    };
  });

  return summaries
    .sort((left, right) => right.value - left.value)
    .map((summary, index) => ({
      ...summary,
      rank: index + 1,
    }));
}

function createGridCanvas({
  height,
  pixelRatio,
  shortformScale,
  width,
}: {
  height: number;
  pixelRatio: number;
  shortformScale: number;
  width: number;
}) {
  const backingWidth = Math.max(1, Math.floor(width * pixelRatio));
  const backingHeight = Math.max(1, Math.floor(height * pixelRatio));
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(backingWidth, backingHeight)
      : document.createElement("canvas");

  canvas.width = backingWidth;
  canvas.height = backingHeight;

  const ctx = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!ctx) {
    return canvas;
  }

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  const majorGap = 88 * shortformScale;
  const minorGap = 22 * shortformScale;

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(148,163,184,0.035)";
  ctx.beginPath();
  for (let x = 0; x <= width; x += minorGap) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y <= height; y += minorGap) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(148,163,184,0.075)";
  ctx.beginPath();
  for (let x = 0; x <= width; x += majorGap) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y <= height; y += majorGap) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  const gradient = ctx.createRadialGradient(
    width * 0.72,
    height * 0.16,
    0,
    width * 0.72,
    height * 0.16,
    width * 0.75,
  );
  gradient.addColorStop(0, "rgba(45,212,191,0.16)");
  gradient.addColorStop(0.44, "rgba(37,99,235,0.06)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

function ensureGridCanvas({
  cache,
  height,
  isShortformMode,
  pixelRatio,
  width,
}: {
  cache: MutableRefObject<GridCache | null>;
  height: number;
  isShortformMode: boolean;
  pixelRatio: number;
  width: number;
}) {
  const key = `${width}x${height}@${pixelRatio}:${isShortformMode ? "short" : "wide"}`;

  if (cache.current?.key === key) {
    return cache.current.canvas;
  }

  const shortformScale = isShortformMode ? 2 : 1;
  const canvas = createGridCanvas({ height, pixelRatio, shortformScale, width });
  cache.current = { canvas, key };
  return canvas;
}

function getPlotBounds(width: number, height: number, isShortformMode: boolean) {
  const scale = isShortformMode ? 2 : 1;
  const top = (isShortformMode ? 260 : 112) * scale;
  const left = (isShortformMode ? 54 : 46) * scale;
  const right = (isShortformMode ? 70 : 92) * scale;
  const bottom = (isShortformMode ? 210 : 58) * scale;

  return {
    bottom: Math.max(top + 80, height - bottom),
    left,
    right: Math.max(left + 120, width - right),
    scale,
    top,
  };
}

function pointToCanvas({
  assetId,
  camera,
  index,
  isShortformMode,
  model,
  plot,
}: {
  assetId: string;
  camera: NeonCameraDomain;
  index: number;
  isShortformMode: boolean;
  model: RenderModel;
  plot: ReturnType<typeof getPlotBounds>;
}) {
  const point = model.normalizedPoints[index];
  const total = Math.max(1, model.normalizedPoints.length - 1);
  const progress = total > 0 ? index / total : 0;
  const x = plot.left + (plot.right - plot.left) * progress;
  const rawMultiple = point?.multiples[assetId] ?? 1;
  const minLog = Math.log(Math.max(0.0001, camera.min));
  const maxLog = Math.log(Math.max(camera.min + 0.0001, camera.max));
  const valueLog = Math.log(Math.max(0.0001, rawMultiple));
  const ratio = Math.max(0, Math.min(1, (valueLog - minLog) / (maxLog - minLog)));
  const y = plot.bottom - (plot.bottom - plot.top) * ratio;

  return {
    x,
    y: Number.isFinite(y) ? y : plot.bottom,
    radius: isShortformMode ? 34 : 17,
  };
}

function drawNeonPath({
  assetId,
  camera,
  ctx,
  model,
  plot,
  pointCount,
  visual,
}: {
  assetId: string;
  camera: NeonCameraDomain;
  ctx: CanvasRenderingContext2D;
  model: RenderModel;
  plot: ReturnType<typeof getPlotBounds>;
  pointCount: number;
  visual: NeonRaceAssetVisual;
}) {
  if (pointCount <= 0) {
    return;
  }

  const path = new Path2D();
  for (let index = 0; index < pointCount; index += 1) {
    const { x, y } = pointToCanvas({
      assetId,
      camera,
      index,
      isShortformMode: model.isShortformMode,
      model,
      plot,
    });

    if (index === 0) {
      path.moveTo(x, y);
    } else {
      path.lineTo(x, y);
    }
  }

  const lineScale = model.isShortformMode ? 2 : 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.save();
  ctx.shadowBlur = 34 * lineScale;
  ctx.shadowColor = visual.color;
  ctx.strokeStyle = hexToRgba(visual.color, 0.2);
  ctx.lineWidth = 16 * lineScale;
  ctx.stroke(path);
  ctx.restore();

  ctx.save();
  ctx.shadowBlur = 16 * lineScale;
  ctx.shadowColor = visual.color;
  ctx.strokeStyle = hexToRgba(visual.color, 0.55);
  ctx.lineWidth = 7 * lineScale;
  ctx.stroke(path);
  ctx.restore();

  ctx.save();
  ctx.shadowBlur = 4 * lineScale;
  ctx.shadowColor = "#ffffff";
  ctx.strokeStyle = visual.color;
  ctx.lineWidth = 2.8 * lineScale;
  ctx.stroke(path);
  ctx.restore();
}

function drawEndpoint({
  assetId,
  camera,
  ctx,
  flashStartedAt,
  image,
  model,
  plot,
  pointCount,
  timestamp,
  visual,
}: {
  assetId: string;
  camera: NeonCameraDomain;
  ctx: CanvasRenderingContext2D;
  flashStartedAt: number | undefined;
  image: HTMLImageElement | undefined;
  model: RenderModel;
  plot: ReturnType<typeof getPlotBounds>;
  pointCount: number;
  timestamp: number;
  visual: NeonRaceAssetVisual;
}) {
  if (pointCount <= 0) {
    return;
  }

  const lastIndex = pointCount - 1;
  const { radius, x, y } = pointToCanvas({
    assetId,
    camera,
    index: lastIndex,
    isShortformMode: model.isShortformMode,
    model,
    plot,
  });
  const scale = model.isShortformMode ? 2 : 1;
  const pulseAge = flashStartedAt ? timestamp - flashStartedAt : Number.POSITIVE_INFINITY;

  if (pulseAge < NEON_RANK_FLASH_DURATION_MS) {
    const progress = 1 - pulseAge / NEON_RANK_FLASH_DURATION_MS;
    const flashRadius = radius * (2.2 + (1 - progress) * 1.4);
    const gradient = ctx.createRadialGradient(x, y, radius * 0.2, x, y, flashRadius);
    gradient.addColorStop(0, hexToRgba(visual.color, 0.8 * progress));
    gradient.addColorStop(0.42, hexToRgba(visual.color, 0.28 * progress));
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, flashRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.shadowBlur = 26 * scale;
  ctx.shadowColor = visual.color;
  ctx.fillStyle = "#020617";
  ctx.beginPath();
  ctx.arc(x, y, radius + 5 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();

  if (image) {
    ctx.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
  } else {
    const gradient = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.35, 0, x, y, radius);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.16, hexToRgba(visual.color, 0.92));
    gradient.addColorStop(1, hexToRgba(visual.color, 0.28));
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.fillStyle = "#020617";
    ctx.font = `800 ${Math.max(10, 9 * scale)}px var(--font-sans), sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(makeFallbackMark(visual), x, y + 0.5 * scale);
  }

  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.6 * scale;
  ctx.beginPath();
  ctx.arc(x, y, radius + 1.5 * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = visual.color;
  ctx.lineWidth = 2.2 * scale;
  ctx.beginPath();
  ctx.arc(x, y, radius + 5 * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const value = model.normalizedPoints[lastIndex]?.values[assetId] ?? model.principalKrw;
  const labelWidth = model.isShortformMode ? 330 : 150;
  const labelHeight = model.isShortformMode ? 72 : 38;
  const preferredLabelX = x + radius + 12 * scale;
  const labelX =
    preferredLabelX + labelWidth < plot.right
      ? preferredLabelX
      : Math.max(plot.left, x - radius - 12 * scale - labelWidth);

  ctx.save();
  roundRect(ctx, labelX, y - labelHeight / 2, labelWidth, labelHeight, 16 * scale);
  ctx.fillStyle = "rgba(2,6,23,0.76)";
  ctx.fill();
  ctx.strokeStyle = hexToRgba(visual.color, 0.42);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${model.isShortformMode ? 24 : 12}px var(--font-sans), sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(visual.label, labelX + 12 * scale, y - 4 * scale);
  ctx.fillStyle = "rgba(226,232,240,0.76)";
  ctx.font = `700 ${model.isShortformMode ? 20 : 10}px var(--font-sans), sans-serif`;
  ctx.fillText(formatKrwCompact(value), labelX + 12 * scale, y + 16 * scale);
  ctx.restore();
}

function drawHud({
  ctx,
  model,
  plot,
  pointCount,
}: {
  ctx: CanvasRenderingContext2D;
  model: RenderModel;
  plot: ReturnType<typeof getPlotBounds>;
  pointCount: number;
}) {
  const scale = model.isShortformMode ? 2 : 1;
  const currentPoint = model.fullData[Math.max(0, pointCount - 1)] ?? model.fullData[0];
  const activeTempo = model.tempoSegments[Math.max(0, pointCount - 2)] ?? model.activeTempo;

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(45,212,191,0.86)";
  ctx.font = `800 ${model.isShortformMode ? 25 : 11}px var(--font-sans), sans-serif`;
  ctx.fillText("REGRETZERO NEON RACE", plot.left, 34 * scale);

  ctx.fillStyle = "#ffffff";
  ctx.font = `850 ${model.isShortformMode ? 58 : 24}px var(--font-sans), sans-serif`;
  ctx.fillText(model.headerTitle, plot.left, model.isShortformMode ? 126 : 64);

  ctx.fillStyle = "rgba(226,232,240,0.72)";
  ctx.font = `650 ${model.isShortformMode ? 28 : 12}px var(--font-sans), sans-serif`;
  ctx.fillText(
    currentPoint ? formatCurrentDate(currentPoint.date) : "----.--",
    plot.left,
    model.isShortformMode ? 174 : 88,
  );

  const tempoLabel = getTempoLabel(activeTempo);
  const pillWidth = model.isShortformMode ? 330 : 170;
  const pillHeight = model.isShortformMode ? 54 : 28;
  roundRect(ctx, plot.right - pillWidth, 26 * scale, pillWidth, pillHeight, pillHeight / 2);
  ctx.fillStyle =
    activeTempo?.multiplier === 0.5
      ? "rgba(244,63,94,0.16)"
      : activeTempo?.multiplier === 3
        ? "rgba(45,212,191,0.14)"
        : "rgba(96,165,250,0.14)";
  ctx.fill();
  ctx.strokeStyle =
    activeTempo?.multiplier === 0.5
      ? "rgba(244,63,94,0.42)"
      : activeTempo?.multiplier === 3
        ? "rgba(45,212,191,0.38)"
        : "rgba(96,165,250,0.34)";
  ctx.stroke();
  ctx.fillStyle = "#e2e8f0";
  ctx.font = `800 ${model.isShortformMode ? 20 : 10}px var(--font-sans), sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(tempoLabel, plot.right - pillWidth / 2, 26 * scale + pillHeight / 2 + 4 * scale);
  ctx.restore();
}

function drawAxis({
  camera,
  ctx,
  model,
  plot,
}: {
  camera: NeonCameraDomain;
  ctx: CanvasRenderingContext2D;
  model: RenderModel;
  plot: ReturnType<typeof getPlotBounds>;
}) {
  const scale = model.isShortformMode ? 2 : 1;
  const ticks = [0.7, 1, 1.5, 2, 3, 5, 8, 12, 20, 35, 50].filter(
    (tick) => tick >= camera.min * 0.98 && tick <= camera.max * 1.02,
  );
  const safeTicks = ticks.length ? ticks : [camera.min, 1, camera.max];

  ctx.save();
  ctx.strokeStyle = "rgba(148,163,184,0.09)";
  ctx.fillStyle = "rgba(148,163,184,0.7)";
  ctx.font = `700 ${model.isShortformMode ? 22 : 10}px var(--font-sans), sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  for (const tick of safeTicks) {
    const minLog = Math.log(Math.max(0.0001, camera.min));
    const maxLog = Math.log(Math.max(camera.min + 0.0001, camera.max));
    const ratio = (Math.log(Math.max(0.0001, tick)) - minLog) / (maxLog - minLog);
    const y = plot.bottom - (plot.bottom - plot.top) * ratio;
    ctx.beginPath();
    ctx.moveTo(plot.left, y);
    ctx.lineTo(plot.right, y);
    ctx.stroke();
    ctx.fillText(formatNormalizedMultiple(tick), 8 * scale, y);
  }

  const firstPoint = model.fullData[0];
  const lastPoint = model.fullData[model.fullData.length - 1];
  if (firstPoint && lastPoint) {
    ctx.fillStyle = "rgba(148,163,184,0.62)";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(formatYear(firstPoint.date), plot.left, plot.bottom + 28 * scale);
    ctx.fillText(formatYear(lastPoint.date), plot.right, plot.bottom + 28 * scale);
  }

  ctx.restore();
}

function renderNeonRaceFrame({
  canvas,
  frameState,
  gridCache,
  logoImages,
  model,
  timestamp,
}: {
  canvas: HTMLCanvasElement;
  frameState: MutableRefObject<NeonRaceFrameState>;
  gridCache: MutableRefObject<GridCache | null>;
  logoImages: MutableRefObject<Record<string, HTMLImageElement | undefined>>;
  model: RenderModel;
  timestamp: number;
}) {
  const container = canvas.parentElement;
  if (!container) {
    return;
  }

  const cssWidth = Math.max(1, container.clientWidth);
  const cssHeight = Math.max(1, container.clientHeight);
  const width = model.isShortformMode ? SHORTFORM_WIDTH : cssWidth;
  const height = model.isShortformMode ? SHORTFORM_HEIGHT : cssHeight;
  const pixelRatio = model.isShortformMode
    ? 1
    : Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const backingWidth = Math.floor(width * pixelRatio);
  const backingHeight = Math.floor(height * pixelRatio);

  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth;
    canvas.height = backingHeight;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const gridCanvas = ensureGridCanvas({
    cache: gridCache,
    height,
    isShortformMode: model.isShortformMode,
    pixelRatio,
    width,
  });

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(gridCanvas, 0, 0);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const replay = exportReplayRefGlobal.current;
  let pointCount = model.visibleCount;

  if (replay) {
    const progress = Math.min(1, (timestamp - replay.startedAt) / replay.durationMs);
    pointCount = getNeonVisibleCountForProgress(
      progress,
      model.normalizedPoints.length,
      model.playbackTimeline,
    );

    if (progress >= 1 && !replay.stopping) {
      replay.stopping = true;
      window.setTimeout(replay.stop, 180);
    }
  }

  pointCount = Math.max(1, Math.min(model.normalizedPoints.length, pointCount));
  const visiblePoints = model.normalizedPoints.slice(0, pointCount);
  const cameraTarget = getTargetNeonCameraDomain(
    visiblePoints.flatMap((point) =>
      model.assets.map((asset) => point.multiples[asset.id] ?? 1),
    ),
  );
  const nextCamera = frameState.current.camera
    ? lerpNeonCameraDomain(frameState.current.camera, cameraTarget, NEON_CAMERA_LERP_ALPHA)
    : cameraTarget;
  frameState.current = {
    ...frameState.current,
    camera: nextCamera,
    playhead: pointCount - 1,
    tempoMultiplier: model.tempoSegments[Math.max(0, pointCount - 2)]?.multiplier ?? 1,
  };

  const plot = getPlotBounds(width, height, model.isShortformMode);
  drawAxis({ camera: nextCamera, ctx, model, plot });

  for (const visual of model.visuals) {
    drawNeonPath({
      assetId: visual.asset.id,
      camera: nextCamera,
      ctx,
      model,
      plot,
      pointCount,
      visual,
    });
  }

  for (const visual of model.visuals) {
    drawEndpoint({
      assetId: visual.asset.id,
      camera: nextCamera,
      ctx,
      flashStartedAt: frameState.current.rankFlash[visual.asset.id],
      image: logoImages.current[visual.asset.id],
      model,
      plot,
      pointCount,
      timestamp,
      visual,
    });
  }

  for (const [assetId, startedAt] of Object.entries(frameState.current.rankFlash)) {
    if (timestamp - startedAt > NEON_RANK_FLASH_DURATION_MS) {
      delete frameState.current.rankFlash[assetId];
    }
  }

  drawHud({ ctx, model, plot, pointCount });
}

const exportReplayRefGlobal: { current: ExportReplayState | null } = {
  current: null,
};

export function RaceChart({
  assets,
  basisLabel,
  currentPoint,
  data,
  fullData,
  headerSubtitle,
  headerTitle,
  isLoading,
  moments = [],
  onSelectMoment,
  principalKrw,
  valueBasis = "initial",
}: RaceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const plotRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<RenderModel | null>(null);
  const gridCacheRef = useRef<GridCache | null>(null);
  const logoImagesRef = useRef<Record<string, HTMLImageElement | undefined>>({});
  const loadedLogoUrlsRef = useRef<Record<string, string | null>>({});
  const previousRankOrderRef = useRef<string>("");
  const frameStateRef = useRef<NeonRaceFrameState>({
    camera: null,
    playhead: 0,
    rankFlash: {},
    tempoMultiplier: 1,
  });
  const [plotMetrics, setPlotMetrics] = useState<PlotMetrics>({ height: 0, width: 0 });
  const [isShortformMode, setIsShortformMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingFeedback, setRecordingFeedback] = useState("");
  const [recordingSupported, setRecordingSupported] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setRecordingSupported(
        typeof MediaRecorder !== "undefined" &&
          typeof HTMLCanvasElement !== "undefined" &&
          typeof HTMLCanvasElement.prototype.captureStream === "function",
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const element = plotRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setPlotMetrics({
        height: entry.contentRect.height,
        width: entry.contentRect.width,
      });
      gridCacheRef.current = null;
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const visuals = useMemo<NeonRaceAssetVisual[]>(
    () =>
      assets.map((asset) => {
        const color = getAssetColor(asset.id);
        return {
          asset,
          color,
          glow: hexToRgba(color, 0.2),
          label: getRaceCardLabel(asset),
          logoUrl: getBrandfetchLogoUrl(asset),
          ticker: getAssetTicker(asset),
        };
      }),
    [assets],
  );

  useEffect(() => {
    let cancelled = false;

    for (const visual of visuals) {
      if (!visual.logoUrl || loadedLogoUrlsRef.current[visual.asset.id] === visual.logoUrl) {
        continue;
      }

      loadedLogoUrlsRef.current[visual.asset.id] = visual.logoUrl;
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.onload = () => {
        if (cancelled) {
          return;
        }

        logoImagesRef.current[visual.asset.id] = image;
      };
      image.onerror = () => {
        if (cancelled) {
          return;
        }

        loadedLogoUrlsRef.current[visual.asset.id] = null;
        logoImagesRef.current[visual.asset.id] = undefined;
      };
      image.src = visual.logoUrl;
    }

    return () => {
      cancelled = true;
    };
  }, [visuals]);

  const normalizedPoints = useMemo(
    () =>
      buildNormalizedPoints({
        assets,
        fullData,
        principalKrw,
        valueBasis,
      }),
    [assets, fullData, principalKrw, valueBasis],
  );

  const tempoSegments = useMemo(
    () => buildNeonTempoSegments(fullData, assets.map((asset) => asset.id)),
    [assets, fullData],
  );
  const playbackTimeline = useMemo(
    () => buildNeonPlaybackTimeline(fullData, assets.map((asset) => asset.id)),
    [assets, fullData],
  );
  const visibleCount = Math.max(1, Math.min(fullData.length, data.length || 1));
  const normalizedCurrentPoint = normalizedPoints[Math.max(0, visibleCount - 1)] ?? null;
  const slotSummaries = useMemo(
    () =>
      getRankedSummaries({
        assets,
        currentPoint,
        normalizedPoint: normalizedCurrentPoint,
        principalKrw,
        valueBasis,
        visuals,
      }),
    [assets, currentPoint, normalizedCurrentPoint, principalKrw, valueBasis, visuals],
  );
  const activeTempo = tempoSegments[Math.max(0, visibleCount - 2)] ?? null;
  const basisText = basisLabel ?? `1.0배 = ${formatKrwCompact(principalKrw)}`;
  const resolvedHeaderTitle = headerTitle ?? `${formatKrwCompact(principalKrw)}으로 출발하면`;
  const leaderSummary = slotSummaries[0] ?? null;
  const secondSummary = slotSummaries[1] ?? null;
  const currentBasis = getPointBasis(currentPoint, principalKrw, valueBasis);
  const currentGapLabel =
    leaderSummary && secondSummary
      ? formatMultiple(leaderSummary.value, secondSummary.value)
      : leaderSummary
        ? formatMultiple(leaderSummary.value, currentBasis)
        : "-";
  const currentDate = currentPoint ? formatCurrentDate(currentPoint.date) : "----.--";

  useEffect(() => {
    const rankOrder = slotSummaries.map((summary) => summary.asset.id).join("|");
    const previousRankOrder = previousRankOrderRef.current;

    if (previousRankOrder && previousRankOrder !== rankOrder) {
      const previousRanks = previousRankOrder.split("|");
      const timestamp = performance.now();

      for (const assetId of rankOrder.split("|")) {
        if (previousRanks.indexOf(assetId) !== rankOrder.split("|").indexOf(assetId)) {
          frameStateRef.current.rankFlash[assetId] = timestamp;
        }
      }
    }

    previousRankOrderRef.current = rankOrder;
  }, [slotSummaries]);

  useEffect(() => {
    modelRef.current = {
      activeTempo,
      assets,
      basisLabel: basisText,
      currentPoint,
      fullData,
      headerTitle: resolvedHeaderTitle,
      isShortformMode,
      normalizedPoints,
      playbackTimeline,
      principalKrw,
      tempoSegments,
      valueBasis,
      visuals,
      visibleCount,
    };
  }, [
    activeTempo,
    assets,
    basisText,
    currentPoint,
    fullData,
    isShortformMode,
    normalizedPoints,
    playbackTimeline,
    principalKrw,
    resolvedHeaderTitle,
    tempoSegments,
    valueBasis,
    visibleCount,
    visuals,
  ]);

  useEffect(() => {
    let frameId = 0;

    const tick = (timestamp: number) => {
      const canvas = canvasRef.current;
      const model = modelRef.current;

      if (canvas && model && model.normalizedPoints.length > 0) {
        renderNeonRaceFrame({
          canvas,
          frameState: frameStateRef,
          gridCache: gridCacheRef,
          logoImages: logoImagesRef,
          model,
          timestamp,
        });
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleExportVideo = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !fullData.length || isRecording) {
      return;
    }

    if (
      typeof MediaRecorder === "undefined" ||
      typeof canvas.captureStream !== "function" ||
      typeof MediaRecorder.isTypeSupported !== "function"
    ) {
      setRecordingFeedback("현재 브라우저에서는 영상 저장을 지원하지 않습니다.");
      return;
    }

    const mimeChoice = chooseNeonMediaRecorderMimeType((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType),
    );

    if (!mimeChoice) {
      setRecordingFeedback("저장 가능한 영상 형식을 찾지 못했습니다.");
      return;
    }

    const previousShortformMode = isShortformMode;
    setIsShortformMode(true);
    setIsRecording(true);
    setRecordingFeedback("9:16 레이스 영상을 만드는 중입니다...");

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    try {
      const stream = canvas.captureStream(EXPORT_OPTIONS.fps);
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeChoice.mimeType,
        videoBitsPerSecond: EXPORT_OPTIONS.bitrate,
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        exportReplayRefGlobal.current = null;
        stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(chunks, { type: mimeChoice.mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const leaderId = slotSummaries[0]?.asset.id ?? "race";
        link.download = `regretzero-neon-race-${leaderId}.${mimeChoice.extension}`;
        link.href = url;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
        setIsRecording(false);
        setIsShortformMode(previousShortformMode);
        setRecordingFeedback(
          `${mimeChoice.extension.toUpperCase()} 레이스 영상 저장이 완료됐습니다.`,
        );
      };

      exportReplayRefGlobal.current = {
        durationMs: EXPORT_OPTIONS.durationMs,
        startedAt: performance.now(),
        stop: () => {
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
        },
        stopping: false,
      };
      frameStateRef.current.camera = null;
      recorder.start(250);
    } catch {
      exportReplayRefGlobal.current = null;
      setIsRecording(false);
      setIsShortformMode(previousShortformMode);
      setRecordingFeedback("영상 저장을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }, [fullData.length, isRecording, isShortformMode, slotSummaries]);

  if (isLoading || !fullData.length) {
    return (
      <div className="surface-section flex h-[520px] items-center justify-center rounded-[30px] border-cyan-400/20 bg-black text-sm text-cyan-100/60 shadow-[0_0_70px_rgba(34,211,238,0.14)]">
        레이스 차트를 준비하고 있습니다...
      </div>
    );
  }

  const lastPoint = fullData[fullData.length - 1]!;
  const currentIndex = currentPoint?.index ?? 0;
  const reachedMoments = moments.filter((moment) => moment.index <= currentIndex);

  return (
    <div className="surface-section overflow-hidden rounded-[26px] border-cyan-400/18 bg-black p-3 shadow-[0_0_80px_rgba(34,211,238,0.12)] sm:rounded-[30px] sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300/72">
            실시간 10년 레이스
          </div>
          <div className="mt-1.5 text-[1.08rem] font-semibold tracking-[-0.05em] text-white sm:mt-2 sm:text-[1.45rem]">
            {resolvedHeaderTitle}
          </div>
          <div className="mt-2 hidden text-sm leading-6 text-slate-300/70 sm:block">
            {headerSubtitle ??
              "같은 돈으로 시작해도 시간이 지나며 자산마다 격차가 벌어지는 장면을 보여줍니다."}
          </div>
        </div>

        <div className="hidden grid-cols-2 gap-2 sm:grid sm:min-w-[230px]">
          <button
            aria-pressed={isShortformMode}
            className="btn-secondary inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-3 text-xs font-bold text-white transition"
            onClick={() => {
              setIsShortformMode((value) => !value);
              frameStateRef.current.camera = null;
              gridCacheRef.current = null;
            }}
            type="button"
          >
            {isShortformMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {isShortformMode ? "일반" : "숏폼 9:16"}
          </button>
          <button
            className="btn-accent inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!recordingSupported || isRecording}
            onClick={() => void handleExportVideo()}
            type="button"
          >
            {isRecording ? <Video className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
            {isRecording ? "만드는 중" : "영상 저장"}
          </button>
        </div>
      </div>

      <div
        ref={plotRef}
        className={`surface-plot relative mt-3 overflow-hidden rounded-[24px] border-cyan-400/18 bg-black shadow-[inset_0_0_50px_rgba(34,211,238,0.08)] sm:mt-4 ${
          isShortformMode
            ? "mx-auto aspect-[9/16] h-auto max-h-[76dvh] w-full max-w-[420px]"
            : "h-[300px] sm:h-[430px]"
        }`}
      >
        <canvas
          aria-label="네온 글로우 실시간 차트 레이싱 캔버스"
          className="absolute inset-0 h-full w-full"
          ref={canvasRef}
        />

        {reachedMoments.map((moment) => {
          const toneStyle = getMomentToneStyle(moment.tone);
          const momentRatio = lastPoint.index > 0 ? moment.index / lastPoint.index : 0;
          const momentX = plotMetrics.width > 0 ? Math.max(24, Math.min(plotMetrics.width - 24, plotMetrics.width * momentRatio)) : 24;

          return (
            <button
              aria-label={`${moment.title}: ${moment.valueLabel}`}
              className="absolute bottom-9 z-20 flex -translate-x-1/2 flex-col items-center gap-1"
              key={moment.id}
              onClick={() => onSelectMoment?.(moment)}
              style={{ left: momentX }}
              type="button"
            >
              <span
                className="h-3.5 w-3.5 rounded-full border-2 border-white shadow-[0_0_20px_currentColor]"
                style={{
                  backgroundColor: toneStyle.color,
                  color: toneStyle.color,
                }}
              />
              <span
                className="hidden whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold backdrop-blur-xl sm:block"
                style={toneStyle}
              >
                {moment.title}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-[18px] border border-cyan-300/14 bg-white/[0.035] px-3 py-2.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100/42">
            현재 시점
          </div>
          <div className="mt-1 text-sm font-semibold text-white [font-variant-numeric:tabular-nums]">
            {currentDate}
          </div>
        </div>
        <div className="rounded-[18px] border border-cyan-300/14 bg-white/[0.035] px-3 py-2.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100/42">
            {secondSummary ? "현재 격차" : "현재 배수"}
          </div>
          <div className="mt-1 text-sm font-semibold text-white [font-variant-numeric:tabular-nums]">
            {currentGapLabel}
          </div>
        </div>
        <div className="rounded-[18px] border border-cyan-300/14 bg-white/[0.035] px-3 py-2.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100/42">
            기준
          </div>
          <div className="mt-1 text-sm font-semibold leading-5 text-white">{basisText}</div>
        </div>
      </div>

      <div
        className="mt-3 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, slotSummaries.length)}, minmax(0, 1fr))` }}
      >
        {slotSummaries.map(({ asset, color, multiple, rank, value }) => (
          <div
            className="min-w-0 rounded-[18px] border px-3 py-3 transition"
            key={asset.id}
            style={{
              backgroundColor: rank === 1 ? hexToRgba(color, 0.14) : "rgba(255,255,255,0.032)",
              borderColor: rank === 1 ? hexToRgba(color, 0.46) : "rgba(148,163,184,0.14)",
              boxShadow: rank === 1 ? `0 0 34px ${hexToRgba(color, 0.15)}` : "none",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
                style={{ backgroundColor: hexToRgba(color, 0.2), color }}
              >
                {rank}
              </span>
              <div className="min-w-0 text-sm font-semibold tracking-[-0.03em] text-white">
                {getRaceCardLabel(asset)}
              </div>
            </div>
            <div className="mt-2 text-sm font-bold text-white [font-variant-numeric:tabular-nums]">
              {formatKrwCompact(value)}
            </div>
            <div className="mt-1 text-[11px] text-slate-300/56 [font-variant-numeric:tabular-nums]">
              {formatNormalizedMultiple(multiple)}
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/8">
              <div
                className="h-full rounded-full"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 18px ${hexToRgba(color, 0.6)}`,
                  width: `${Math.min(100, Math.max(14, multiple * 18))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {recordingFeedback ? (
        <div className="mt-3 rounded-[16px] border border-cyan-300/18 bg-cyan-300/8 px-3 py-2 text-center text-xs font-semibold text-cyan-100/76">
          {recordingFeedback}
        </div>
      ) : null}
    </div>
  );
}
