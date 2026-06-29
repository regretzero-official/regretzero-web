"use client";

import {
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";

type HistoryPoint = {
  ts: number;
  price: number;
};

type ReplayPoint = {
  label: string;
  assetValue: number;
  goldValue: number;
};

type Props = {
  symbol: string;
  amount: number;
  startDate: string;
  assetLabel?: string;
};

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function toMonthKey(ts: number) {
  const date = new Date(ts * 1000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  return `${year}.${month}`;
}

function formatAxis(value: number) {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `$${Math.round(value / 1_000)}k`;
  }

  return `$${Math.round(value)}`;
}

function buildReplaySeries(
  assetSeries: HistoryPoint[],
  goldSeries: HistoryPoint[],
  amount: number,
) {
  const assetMap = new Map(assetSeries.map((point) => [toMonthKey(point.ts), point.price]));
  const goldMap = new Map(goldSeries.map((point) => [toMonthKey(point.ts), point.price]));
  const sharedKeys = [...assetMap.keys()]
    .filter((key) => goldMap.has(key))
    .sort((left, right) => left.localeCompare(right));

  if (sharedKeys.length < 2) {
    return [];
  }

  const assetBase = assetMap.get(sharedKeys[0]);
  const goldBase = goldMap.get(sharedKeys[0]);

  if (!assetBase || !goldBase) {
    return [];
  }

  return sharedKeys.map((key) => ({
    label: formatMonthLabel(key),
    assetValue: amount * ((assetMap.get(key) ?? assetBase) / assetBase),
    goldValue: amount * ((goldMap.get(key) ?? goldBase) / goldBase),
  }));
}

async function fetchHistory(ticker: string, startDate: string) {
  const response = await fetch(
    `/api/history-series?ticker=${encodeURIComponent(ticker)}&start=${startDate}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("history fetch failed");
  }

  const payload = (await response.json()) as { series?: HistoryPoint[] };
  return payload.series ?? [];
}

export default function AssetRaceReplay({
  symbol,
  amount,
  startDate,
  assetLabel,
}: Props) {
  const [series, setSeries] = useState<ReplayPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);
    setSeries([]);
    setProgress(1);
    setIsPlaying(true);

    void (async () => {
      try {
        const [assetHistory, goldHistory] = await Promise.all([
          fetchHistory(symbol, startDate),
          fetchHistory("GLD", startDate),
        ]);
        const nextSeries = buildReplaySeries(assetHistory, goldHistory, amount);

        if (!cancelled) {
          startTransition(() => {
            setSeries(nextSeries);
            setIsLoading(false);

            if (nextSeries.length === 0) {
              setError("이 구간은 레이스를 만들 데이터가 부족합니다.");
              setIsPlaying(false);
            }
          });
        }
      } catch {
        if (!cancelled) {
          setError("레이스 데이터를 불러오지 못했습니다.");
          setIsLoading(false);
          setIsPlaying(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [amount, startDate, symbol]);

  const stopPlayback = useEffectEvent(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  });

  const startPlayback = useEffectEvent(() => {
    stopPlayback();

    if (series.length <= 1) {
      return;
    }

    timerRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= series.length) {
          stopPlayback();
          setIsPlaying(false);
          return current;
        }

        return current + 1;
      });
    }, 90);
  });

  useEffect(() => {
    if (!isPlaying || series.length <= 1) {
      stopPlayback();
      return;
    }

    startPlayback();
    return stopPlayback;
  }, [isPlaying, series.length]);

  const visibleSeries = useMemo(
    () => (series.length ? series.slice(0, progress) : []),
    [progress, series],
  );
  const currentPoint = visibleSeries[visibleSeries.length - 1];
  const finalPoint = series[series.length - 1];
  const yMax = Math.max(
    ...visibleSeries.flatMap((point) => [point.assetValue, point.goldValue]),
    amount,
  );
  const assetWins = finalPoint ? finalPoint.assetValue >= finalPoint.goldValue : false;
  const displayLabel = assetLabel ?? symbol;

  return (
    <section className="race-showcase">
      <div className="race-header">
        <div>
          <p className="race-kicker">대표 장면</p>
          <h3 className="race-title">
            {displayLabel} vs 금
          </h3>
          <p className="race-copy">
            같은 돈으로 출발시키면, 어떤 자산이 실제로 더 멀리 갔는지 말보다 빨리 보입니다.
          </p>
        </div>

        <div className="race-actions">
          <span
            className={`race-badge ${finalPoint ? (assetWins ? "is-win" : "is-loss") : ""}`}
          >
            {finalPoint ? (assetWins ? `${displayLabel} 우세` : "금 우세") : "비교 중"}
          </span>
          <button
            type="button"
            onClick={() => {
              if (progress >= series.length) {
                setProgress(1);
              }
              setIsPlaying((current) => !current);
            }}
            className="race-toggle"
          >
            {isPlaying ? "재생 멈춤" : progress >= series.length ? "처음부터 보기" : "계속 보기"}
          </button>
        </div>
      </div>

      <div className="race-stats">
        <ValueCard
          label={displayLabel}
          value={currentPoint ? USD.format(currentPoint.assetValue) : "..."}
          tone="asset"
        />
        <ValueCard
          label="금"
          value={currentPoint ? USD.format(currentPoint.goldValue) : "..."}
          tone="gold"
        />
        <ValueCard
          label="현재 시점"
          value={currentPoint?.label ?? "준비 중"}
          tone="neutral"
        />
      </div>

      <div className="race-chart-shell">
        {isLoading ? (
          <div className="race-loading">
            <div className="race-loading-bars" />
            <p>레이스를 준비하는 중입니다.</p>
          </div>
        ) : error ? (
          <div className="race-error">{error}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={visibleSeries}
              margin={{ top: 16, right: 10, left: -18, bottom: 4 }}
            >
              <XAxis
                dataKey="label"
                minTickGap={18}
                tick={{ fill: "rgba(255,255,255,0.64)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, yMax * 1.08]}
                tickFormatter={formatAxis}
                tick={{ fill: "rgba(255,255,255,0.64)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={68}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(17, 20, 18, 0.96)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 18,
                  color: "#ffffff",
                }}
                formatter={(value, name) => [
                  USD.format(Number(value)),
                  name === "assetValue" ? displayLabel : "금",
                ]}
              />
              <Line
                type="monotone"
                dataKey="assetValue"
                stroke="#e2b35b"
                strokeWidth={4}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="goldValue"
                stroke="#7ed1c1"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
              {currentPoint ? (
                <>
                  <ReferenceDot
                    x={currentPoint.label}
                    y={currentPoint.assetValue}
                    r={5}
                    fill="#e2b35b"
                    stroke="none"
                  />
                  <ReferenceDot
                    x={currentPoint.label}
                    y={currentPoint.goldValue}
                    r={5}
                    fill="#7ed1c1"
                    stroke="none"
                  />
                </>
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function ValueCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "asset" | "gold" | "neutral";
}) {
  return (
    <div className={`race-value race-value-${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
