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

export default function FutureScenarioChart({
  data,
}: {
  data: ScenarioChartPoint[];
}) {
  return (
    <div className="h-[280px] w-full rounded-2xl border border-white/10 bg-[#080808] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 6 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: "#71717A", fontSize: 10, fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${Math.floor(Number(value))}`}
          />
          <YAxis
            tick={{ fill: "#71717A", fontSize: 10, fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={formatAxisLabel}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(10,10,10,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
            }}
            formatter={(value, name) => {
              const numeric = typeof value === "number" ? value : Number(value ?? 0);
              const label = name === "conservative" ? "보수" : name === "aggressive" ? "공격" : "기준";
              return [KRW.format(numeric), label];
            }}
            labelFormatter={(label) => `${Math.floor(Number(label))}년`}
          />
          <Legend
            formatter={(value) => (value === "conservative" ? "보수" : value === "aggressive" ? "공격" : "기준")}
            wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }}
          />
          <Line type="monotone" dataKey="conservative" stroke="#9CA3AF" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="base" stroke="#D4AF37" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="aggressive" stroke="#E31937" strokeWidth={2.8} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-1 grid grid-cols-3 text-center text-[10px] font-bold text-zinc-500">
        <span>시작</span>
        <span>현재</span>
        <span>10년 후</span>
      </div>
    </div>
  );
}
