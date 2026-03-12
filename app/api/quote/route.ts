import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker,
  )}?range=1d&interval=1m`;

  try {
    const response = await fetch(yahooUrl, {
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "quote fetch failed" }, { status: 502 });
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;
    const close = result?.indicators?.quote?.[0]?.close;
    const timestamps = result?.timestamp;

    const fallbackPrice = Number(meta?.regularMarketPrice);
    const lastValidClose = Array.isArray(close)
      ? [...close].reverse().find((value) => typeof value === "number" && Number.isFinite(value))
      : null;
    const price = typeof lastValidClose === "number" ? lastValidClose : fallbackPrice;

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "invalid quote" }, { status: 502 });
    }

    const lastTs = Array.isArray(timestamps) ? timestamps[timestamps.length - 1] : null;
    const iso = typeof lastTs === "number" ? new Date(lastTs * 1000).toISOString() : null;

    return NextResponse.json({
      ticker,
      price,
      currency: meta?.currency ?? "USD",
      asOf: iso,
    });
  } catch {
    return NextResponse.json({ error: "network error" }, { status: 502 });
  }
}
