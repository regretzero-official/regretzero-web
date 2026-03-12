import { NextRequest, NextResponse } from "next/server";

function parseStartDate(start: string | null) {
  if (!start) return new Date("2016-03-01T00:00:00Z");
  const parsed = new Date(`${start}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return new Date("2016-03-01T00:00:00Z");
  return parsed;
}

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  const start = parseStartDate(request.nextUrl.searchParams.get("start"));

  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  const period1 = Math.floor(start.getTime() / 1000);
  const period2 = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker,
  )}?period1=${period1}&period2=${period2}&interval=1mo&events=history`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { "user-agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "history fetch failed" }, { status: 502 });
    }

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

    if (points.length === 0) {
      return NextResponse.json({ error: "no history points" }, { status: 502 });
    }

    const startPoint = points[0];
    const currentPoint = points[points.length - 1];

    return NextResponse.json({
      ticker,
      startPrice: startPoint.price,
      startDate: new Date(startPoint.ts * 1000).toISOString(),
      currentPrice: currentPoint.price,
      currentDate: new Date(currentPoint.ts * 1000).toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "network error" }, { status: 502 });
  }
}
