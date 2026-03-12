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
  if (!ticker) return NextResponse.json({ error: "ticker is required" }, { status: 400 });

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
    if (!response.ok) return NextResponse.json({ error: "history fetch failed" }, { status: 502 });

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const adjClose: Array<number | null> = result?.indicators?.adjclose?.[0]?.adjclose ?? [];
    const close: Array<number | null> = result?.indicators?.quote?.[0]?.close ?? [];

    const series: Array<{ ts: number; price: number }> = [];
    for (let i = 0; i < timestamps.length; i += 1) {
      const raw = typeof adjClose[i] === "number" ? adjClose[i] : close[i];
      if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
        series.push({ ts: timestamps[i], price: raw });
      }
    }

    if (!series.length) return NextResponse.json({ error: "no history points" }, { status: 502 });
    return NextResponse.json({ ticker, series });
  } catch {
    return NextResponse.json({ error: "network error" }, { status: 502 });
  }
}
