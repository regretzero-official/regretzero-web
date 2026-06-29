import { NextRequest, NextResponse } from "next/server";
import assetData from "../../../src/data/curated_asset_universe.json";

type AssetItem = {
  Category: string;
  Name: string;
  Ticker: string;
  "One-liner": string;
  Market: string;
  Theme: string;
  Priority: number;
};

type Snapshot = {
  startPrice: number;
  currentPrice: number;
};

const BANK_RATE = 0.025;
const CONCURRENCY = 8;

function normalizeTicker(item: AssetItem) {
  if (item.Category === "Crypto" && !item.Ticker.includes("-")) {
    return `${item.Ticker}-USD`;
  }
  return item.Ticker;
}

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function shiftYears(date: Date, years: number) {
  return new Date(Date.UTC(date.getUTCFullYear() + years, date.getUTCMonth(), 1));
}

function monthsBetween(start: Date, end: Date) {
  return (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
}

async function fetchSnapshot(ticker: string, startDate: Date): Promise<Snapshot | null> {
  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker,
  )}?period1=${period1}&period2=${period2}&interval=1mo&events=history`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { "user-agent": "Mozilla/5.0" },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const adjClose: Array<number | null> = result?.indicators?.adjclose?.[0]?.adjclose ?? [];
    const close: Array<number | null> = result?.indicators?.quote?.[0]?.close ?? [];

    const points: Array<{ ts: number; price: number }> = [];
    for (let i = 0; i < timestamps.length; i += 1) {
      const raw = typeof adjClose[i] === "number" ? adjClose[i] : close[i];
      if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
        points.push({ ts: timestamps[i], price: raw });
      }
    }

    if (!points.length) return null;

    return {
      startPrice: points[0].price,
      currentPrice: points[points.length - 1].price,
    };
  } catch {
    return null;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
) {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function runWorker() {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()));
  return results;
}

export async function GET(request: NextRequest) {
  const amountParam = Number(request.nextUrl.searchParams.get("amount") ?? 10_000_000);
  const amount = Number.isFinite(amountParam) && amountParam > 0 ? amountParam : 10_000_000;

  const endDate = monthStart(new Date());
  const startDate = shiftYears(endDate, -10);
  const months = Math.max(1, monthsBetween(startDate, endDate));
  const bankResult = amount * Math.pow(1 + BANK_RATE / 12, months);
  const goldSnapshot = await fetchSnapshot("GLD", startDate);
  const goldResult = goldSnapshot
    ? amount * (goldSnapshot.currentPrice / goldSnapshot.startPrice)
    : null;

  const rows = await mapWithConcurrency(assetData as AssetItem[], CONCURRENCY, async (item) => {
    const snapshot = await fetchSnapshot(normalizeTicker(item), startDate);

    if (!snapshot) {
      return {
        category: item.Category,
        name: item.Name,
        ticker: item.Ticker,
        oneLiner: item["One-liner"],
        market: item.Market,
        theme: item.Theme,
        priority: item.Priority,
        resultKrw: null,
        bankGapKrw: null,
        goldGapKrw: null,
        available: false,
      };
    }

    const resultKrw = amount * (snapshot.currentPrice / snapshot.startPrice);
    return {
      category: item.Category,
      name: item.Name,
      ticker: item.Ticker,
      oneLiner: item["One-liner"],
      market: item.Market,
      theme: item.Theme,
      priority: item.Priority,
      resultKrw,
      bankGapKrw: resultKrw - bankResult,
      goldGapKrw: goldResult === null ? null : resultKrw - goldResult,
      available: true,
    };
  });

  return NextResponse.json({
    amount,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    count: rows.length,
    rows,
  });
}
