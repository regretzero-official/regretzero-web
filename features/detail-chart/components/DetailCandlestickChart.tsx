"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  createSeriesMarkers,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
} from "lightweight-charts";

import type { CrisisRange } from "@/features/pain-of-holding";
import type { DetailChartTimeframe } from "@/features/detail-chart/types";
import {
  buildCrisisChartMarkers,
  buildInitialFocusRange,
} from "@/features/detail-chart/utils/buildDetailChartSeries";
import type { OhlcPoint } from "@/lib/market-data";

interface DetailCandlestickChartProps {
  crisis: CrisisRange;
  data: OhlcPoint[];
  disabledReason?: string;
  timeframe: DetailChartTimeframe;
}

function toChartData(points: OhlcPoint[]): CandlestickData[] {
  return points.map((point) => ({
    close: point.close,
    high: point.high,
    low: point.low,
    open: point.open,
    time: point.date,
  }));
}

function toSeriesMarkers(points: OhlcPoint[], crisis: CrisisRange): SeriesMarker<Time>[] {
  return buildCrisisChartMarkers(points, crisis).map((marker, index) => ({
    color: marker.color,
    id: marker.id,
    position: marker.position,
    shape: marker.shape,
    size: 1.35,
    text: `${index + 1}. ${marker.label}`,
    time: marker.date,
  }));
}

export function DetailCandlestickChart({
  crisis,
  data,
  disabledReason,
  timeframe,
}: DetailCandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const chartData = useMemo(() => toChartData(data), [data]);
  const chartMarkers = useMemo(() => toSeriesMarkers(data, crisis), [crisis, data]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const chart = createChart(container, {
      autoSize: true,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#4A6CFF",
          labelBackgroundColor: "#4A6CFF",
          style: LineStyle.Solid,
          width: 1,
        },
        horzLine: {
          color: "rgba(74, 108, 255, 0.24)",
          labelBackgroundColor: "#4A6CFF",
          style: LineStyle.Dotted,
          visible: true,
        },
      },
      grid: {
        horzLines: {
          color: "rgba(120, 138, 169, 0.12)",
        },
        vertLines: {
          color: "rgba(120, 138, 169, 0.08)",
        },
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      handleScroll: {
        horzTouchDrag: true,
        mouseWheel: true,
        pressedMouseMove: true,
        vertTouchDrag: false,
      },
      layout: {
        attributionLogo: false,
        background: {
          color: "#FFFFFF",
          type: ColorType.Solid,
        },
        textColor: "#5E6B85",
      },
      localization: {
        dateFormat: "yyyy-MM-dd",
      },
      rightPriceScale: {
        borderColor: "rgba(120, 138, 169, 0.12)",
      },
      timeScale: {
        borderColor: "rgba(120, 138, 169, 0.12)",
        rightOffset: 6,
        timeVisible: true,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      borderDownColor: "#E66774",
      borderUpColor: "#2563EB",
      downColor: "#F5B7C0",
      priceLineVisible: false,
      upColor: "#D8E6FF",
      wickDownColor: "#D95866",
      wickUpColor: "#2563EB",
    });

    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series, [], {
      autoScale: true,
      zOrder: "top",
    });

    return () => {
      markersRef.current?.detach();
      markersRef.current = null;
      seriesRef.current = null;
      chartRef.current = null;
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) {
      return;
    }

    chartRef.current.applyOptions({
      timeScale: {
        timeVisible: timeframe !== "monthly",
      },
    });
  }, [timeframe]);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || chartData.length === 0) {
      return;
    }

    seriesRef.current.setData(chartData);
    markersRef.current?.setMarkers(chartMarkers);
    const focusRange = buildInitialFocusRange(data, crisis, timeframe);

    if (focusRange) {
      requestAnimationFrame(() => {
        chartRef.current?.timeScale().setVisibleLogicalRange(focusRange);
      });
    }
  }, [chartData, chartMarkers, crisis, data, timeframe]);

  if (disabledReason) {
    return (
      <div className="surface-card rounded-[24px] px-4 py-5 text-sm leading-6 text-white/58">
        {disabledReason}
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-[#fff] p-3 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <div className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-[#fff] shadow-inner shadow-slate-100/80 [&_*]:outline-none">
        <div ref={containerRef} className="h-[360px] w-full bg-[#fff] sm:h-[420px]" />
      </div>
      <div className="grid gap-2 px-1 pt-3 sm:grid-cols-3">
        {buildCrisisChartMarkers(data, crisis).map((marker, index) => (
          <div
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600"
            key={marker.id}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: marker.color }}
            />
            <span className="truncate">
              {index + 1}. {marker.label}
            </span>
          </div>
        ))}
      </div>
      <div className="px-1 pt-3 text-xs leading-5 text-slate-500">
        차트 안의 마커를 따라 전고점, 가장 힘든 날, 회복 지점을 순서대로 보면 이 구간이 더 선명해져요.
        차트는 좌우로 드래그하거나 확대할 수 있습니다.
      </div>
    </div>
  );
}
