"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ScenarioChartPoint = {
  year: number;
  conservative: number;
  base: number;
  aggressive: number;
};

const KRW = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

function formatAxisLabel(value: number) {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
  if (value >= 10_000) return `${Math.round(value / 10_000)}만`;
  return `${Math.round(value)}`;
}

function formatSeriesLabel(value: string) {
  if (value === "conservative") return "보수적";
  if (value === "aggressive") return "공격적";
  return "기준";
}

export default function FutureScenarioChart({
  data,
}: {
  data: ScenarioChartPoint[];
}) {
  return (
    <div className="rounded-[28px] border border-black/8 bg-[linear-gradient(180deg,#fffdf8_0%,#f6f1e6_100%)] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 12, left: -16, bottom: 6 }}>
            <CartesianGrid stroke="rgba(17,17,17,0.08)" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: "#6b6457", fontSize: 11, fontWeight: 700 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Math.floor(Number(value))}년`}
            />
            <YAxis
              tick={{ fill: "#6b6457", fontSize: 11, fontWeight: 700 }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={formatAxisLabel}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(255,255,255,0.96)",
                border: "1px solid rgba(17,17,17,0.08)",
                borderRadius: 18,
                boxShadow: "0 18px 40px rgba(15,23,42,0.10)",
              }}
              formatter={(value, name) => {
                const numeric = typeof value === "number" ? value : Number(value ?? 0);
                return [KRW.format(numeric), formatSeriesLabel(String(name))];
              }}
              labelFormatter={(label) => `${Math.floor(Number(label))}년`}
            />
            <Legend
              formatter={(value) => formatSeriesLabel(String(value))}
              wrapperStyle={{ fontSize: 12, color: "#5d574a", paddingTop: 8 }}
            />
            <Line type="monotone" dataKey="conservative" stroke="#8A8F98" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="base" stroke="#163B74" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="aggressive" stroke="#C57C2A" strokeWidth={2.8} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-3 text-center text-[11px] font-bold text-[#7a705c]">
        <span>시작</span>
        <span>중간 점검</span>
        <span>10년 후</span>
      </div>
    </div>
  );
}
