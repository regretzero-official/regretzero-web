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

export interface TimeMachineRacePoint {
  bank: number;
  dateLabel: string;
  monthIndex: number;
  selected: number;
  spy: number;
  year: number;
}

interface TimeMachineRacingChartProps {
  currentMonthIndex: number;
  data: TimeMachineRacePoint[];
  formatAxisCurrency: (value: number) => string;
  formatCurrency: (value: number) => string;
  selectedColor: string;
  selectedLabel: string;
  startYear: number;
}

function getLineLabel(name: NameType | undefined, selectedLabel: string) {
  if (name === "selected") {
    return selectedLabel;
  }

  if (name === "spy") {
    return "S&P 500 (SPY)";
  }

  return "은행 예금";
}

export default function TimeMachineRacingChart({
  currentMonthIndex,
  data,
  formatAxisCurrency,
  formatCurrency,
  selectedColor,
  selectedLabel,
  startYear,
}: TimeMachineRacingChartProps) {
  const totalMonths = data[data.length - 1]?.monthIndex ?? 120;
  const ticks = Array.from({ length: Math.max(1, Math.floor(totalMonths / 12) + 1) }, (_, index) => index * 12);

  return (
    <ResponsiveContainer height="100%" width="100%">
      <LineChart data={data} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="spyStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#46d8ff" />
            <stop offset="100%" stopColor="#7c9eff" />
          </linearGradient>
          <linearGradient id="bankStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#97a6b6" />
            <stop offset="100%" stopColor="#f17a7a" />
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
          dataKey="monthIndex"
          domain={[0, totalMonths]}
          ticks={ticks}
          tick={{ fill: "rgba(255,255,255,0.58)", fontSize: 12 }}
          tickFormatter={(value) => `${startYear + value / 12}`}
          tickLine={false}
          type="number"
        />

        <YAxis
          axisLine={false}
          tick={{ fill: "rgba(255,255,255,0.58)", fontSize: 12 }}
          tickFormatter={formatAxisCurrency}
          tickLine={false}
          width={60}
        />

        <Tooltip
          contentStyle={{
            background: "rgba(7, 17, 28, 0.96)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
            color: "#ffffff",
          }}
          formatter={(value: ValueType | undefined, name: NameType | undefined) => [
            formatCurrency(typeof value === "number" ? value : 0),
            getLineLabel(name, selectedLabel),
          ]}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.dateLabel ?? ""}
          labelStyle={{ color: "rgba(255,255,255,0.68)" }}
        />

        <ReferenceLine
          ifOverflow="extendDomain"
          stroke="rgba(255,255,255,0.18)"
          strokeDasharray="5 5"
          strokeWidth={2}
          x={currentMonthIndex}
        />

        <Line
          dataKey="bank"
          dot={false}
          isAnimationActive={false}
          name="bank"
          stroke="url(#bankStroke)"
          strokeDasharray="6 5"
          strokeWidth={2.5}
          type="monotone"
        />
        <Line
          dataKey="spy"
          dot={false}
          isAnimationActive={false}
          name="spy"
          stroke="url(#spyStroke)"
          strokeWidth={3}
          type="natural"
        />
        <Line
          dataKey="selected"
          dot={false}
          isAnimationActive={false}
          name="selected"
          stroke={selectedColor}
          strokeWidth={3.5}
          type="natural"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
