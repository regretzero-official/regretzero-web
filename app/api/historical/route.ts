import { NextRequest, NextResponse } from "next/server";

import {
  getHistoricalSeries,
  SUPPORTED_MARKET_TICKERS,
  type MarketDataTicker,
} from "@/lib/market-data";

export const runtime = "nodejs";

const MAX_HISTORICAL_RANGE_DAYS = 366 * 55;
const MAX_FUTURE_END_DATE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function isMarketDataTicker(value: string): value is MarketDataTicker {
  return SUPPORTED_MARKET_TICKERS.includes(value as MarketDataTicker);
}

function isDateString(value: string | null): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseStrictDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function validateHistoricalRequestParams({
  end,
  start,
  ticker,
}: {
  end: string | null;
  start: string | null;
  ticker: string | null;
}) {
  if (!ticker || !isMarketDataTicker(ticker)) {
    return { error: "Unsupported ticker.", status: 400 } as const;
  }

  if (!isDateString(start) || !isDateString(end)) {
    return { error: "start and end must be YYYY-MM-DD.", status: 400 } as const;
  }

  const startDate = parseStrictDate(start);
  const endDate = parseStrictDate(end);

  if (!startDate || !endDate) {
    return { error: "start and end must be valid calendar dates.", status: 400 } as const;
  }

  const rangeDays = Math.floor((endDate.getTime() - startDate.getTime()) / DAY_MS);
  if (rangeDays <= 0) {
    return { error: "end must be later than start.", status: 400 } as const;
  }

  if (rangeDays > MAX_HISTORICAL_RANGE_DAYS) {
    return { error: "Requested date range is too large.", status: 400 } as const;
  }

  const latestAllowedEndDate = new Date(Date.now() + MAX_FUTURE_END_DATE_DAYS * DAY_MS);
  if (endDate.getTime() > latestAllowedEndDate.getTime()) {
    return { error: "end is too far in the future.", status: 400 } as const;
  }

  return {
    end,
    start,
    ticker,
  } as const;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const validation = validateHistoricalRequestParams({
    end: searchParams.get("end"),
    start: searchParams.get("start"),
    ticker: searchParams.get("ticker"),
  });

  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  try {
    const data = await getHistoricalSeries(validation.ticker, validation.start, validation.end);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }

    return NextResponse.json(
      {
        error: "Historical data is temporarily unavailable.",
      },
      { status: 503 },
    );
  }
}
