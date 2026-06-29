"use client";

import type { HistoricalSeriesResponse, MarketDataTicker } from "@/lib/market-data";

export async function loadHistoricalOhlc(
  ticker: MarketDataTicker,
  startDate: string,
  endDate: string,
) {
  const url = new URL("/api/historical", window.location.origin);
  url.searchParams.set("ticker", ticker);
  url.searchParams.set("start", startDate);
  url.searchParams.set("end", endDate);

  const response = await fetch(url.toString(), { cache: "no-store" });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorPayload?.error ?? "상세 차트 데이터를 불러오지 못했습니다.");
  }

  return (await response.json()) as HistoricalSeriesResponse;
}
