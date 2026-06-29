import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

export interface RacePoint {
  cash: number;
  gold: number;
  month: number;
  sp500: number;
  tsla: number;
  year: number;
}

interface SimulationChartProps {
  currentMonth: number;
  data: RacePoint[];
  formatAxisCurrency: (value: number) => string;
  formatCurrency: (value: number) => string;
  startYear: number;
}

function formatAssetName(name: NameType | undefined) {
  switch (name) {
    case "cash":
      return "은행 현금";
    case "tsla":
      return "테슬라 TSLA";
    case "sp500":
      return "S&P 500";
    case "gold":
      return "금 Gold";
    default:
      return "자산";
  }
}

export default function SimulationChart({
  currentMonth,
  data,
  formatAxisCurrency,
  formatCurrency,
  startYear,
}: SimulationChartProps) {
  const totalMonths = data[data.length - 1]?.month ?? 120;
  const yearTicks = Array.from({ length: Math.max(1, totalMonths / 12) }, (_, index) => (index + 1) * 12);

  return (
    <ResponsiveContainer height="100%" width="100%">
      <LineChart data={data} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
        <defs>
          <linearGradient id="cashStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#8da0ae" />
            <stop offset="100%" stopColor="#ff8f8f" />
          </linearGradient>
          <linearGradient id="tslaStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ff5ea8" />
            <stop offset="100%" stopColor="#ff8b5d" />
          </linearGradient>
          <linearGradient id="spStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#4cdcff" />
            <stop offset="100%" stopColor="#63b4ff" />
          </linearGradient>
          <linearGradient id="goldStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ffd66e" />
            <stop offset="100%" stopColor="#ffb357" />
          </linearGradient>
        </defs>

        <CartesianGrid
          stroke="rgba(255,255,255,0.08)"
          strokeDasharray="3 4"
          vertical={false}
        />

        <XAxis
          allowDecimals={false}
          axisLine={false}
          dataKey="month"
          domain={[1, totalMonths]}
          ticks={yearTicks}
          tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }}
          tickFormatter={(value) => `${startYear + value / 12 - 1}`}
          tickLine={false}
          type="number"
        />

        <YAxis
          axisLine={false}
          tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }}
          tickFormatter={formatAxisCurrency}
          tickLine={false}
          width={56}
        />

        <Tooltip
          contentStyle={{
            background: "rgba(9, 17, 28, 0.96)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.28)",
            color: "#ffffff",
          }}
          formatter={(value: ValueType | undefined, name: NameType | undefined) => [
            formatCurrency(typeof value === "number" ? value : 0),
            formatAssetName(name),
          ]}
          labelFormatter={(value) => {
            const month = Number(value);
            const year = startYear + Math.floor((month - 1) / 12);
            const monthInYear = ((month - 1) % 12) + 1;
            return `${year}년 ${monthInYear}월`;
          }}
          labelStyle={{ color: "rgba(255,255,255,0.68)" }}
        />

        <ReferenceLine
          ifOverflow="hidden"
          stroke="rgba(255,255,255,0.22)"
          strokeDasharray="5 5"
          strokeWidth={2}
          x={currentMonth}
        />

        <Line
          dataKey="cash"
          dot={false}
          isAnimationActive={false}
          name="cash"
          stroke="url(#cashStroke)"
          strokeDasharray="6 5"
          strokeWidth={2.5}
          type="monotone"
        />
        <Line
          dataKey="tsla"
          dot={false}
          isAnimationActive={false}
          name="tsla"
          stroke="url(#tslaStroke)"
          strokeWidth={3.5}
          type="natural"
        />
        <Line
          dataKey="sp500"
          dot={false}
          isAnimationActive={false}
          name="sp500"
          stroke="url(#spStroke)"
          strokeWidth={3}
          type="natural"
        />
        <Line
          dataKey="gold"
          dot={false}
          isAnimationActive={false}
          name="gold"
          stroke="url(#goldStroke)"
          strokeWidth={3}
          type="natural"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
