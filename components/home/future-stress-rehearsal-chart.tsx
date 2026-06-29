import type { FutureStressEvent } from "@/lib/future-scenario";

interface FutureStressRehearsalChartProps {
  activeIndex: number;
  events: FutureStressEvent[];
  formatKrw: (value: number) => string;
  isComplete: boolean;
  stoppedIndex: number | null;
}

const CHART_WIDTH = 340;
const CHART_HEIGHT = 150;
const CHART_PADDING_X = 22;
const CHART_PADDING_Y = 22;

function getEventTone(event: FutureStressEvent) {
  if (event.id === "final") {
    return {
      fill: "#10b981",
      label: "끝",
      stroke: "#059669",
    };
  }

  if (event.id === "stagnation") {
    return {
      fill: "#f59e0b",
      label: "정체",
      stroke: "#d97706",
    };
  }

  return {
    fill: "#ef4444",
    label: "하락",
    stroke: "#dc2626",
  };
}

function clampIndex(index: number, max: number) {
  return Math.max(0, Math.min(index, max));
}

function buildPath(points: Array<{ x: number; y: number }>) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
}

function formatMonth(month: number) {
  if (month === 120) {
    return "10년";
  }

  if (month % 12 === 0) {
    return `${month / 12}년`;
  }

  return `${month}개월`;
}

export function FutureStressRehearsalChart({
  activeIndex,
  events,
  formatKrw,
  isComplete,
  stoppedIndex,
}: FutureStressRehearsalChartProps) {
  if (events.length === 0) {
    return null;
  }

  const currentIndex = stoppedIndex ?? (isComplete ? events.length - 1 : clampIndex(activeIndex, events.length - 1));
  const activeEvent = events[currentIndex] ?? events[0]!;
  const startValue = Math.max(1, events[0]?.valueBeforeKrw ?? events[0]?.investedKrw ?? 1);
  const chartItems = [
    { id: "start", label: "시작", month: 0, value: startValue },
    ...events.map((event) => ({
      id: event.id,
      label: event.title,
      month: event.month,
      value: Math.max(1, event.valueAfterKrw),
    })),
  ];
  const logValues = chartItems.map((item) => Math.log10(item.value));
  const minLogValue = Math.min(...logValues);
  const maxLogValue = Math.max(...logValues);
  const logRange = Math.max(0.001, maxLogValue - minLogValue);
  const points = chartItems.map((item, index) => {
    const usableWidth = CHART_WIDTH - CHART_PADDING_X * 2;
    const usableHeight = CHART_HEIGHT - CHART_PADDING_Y * 2;
    const x = CHART_PADDING_X + (item.month / 120) * usableWidth;
    const y =
      CHART_HEIGHT -
      CHART_PADDING_Y -
      ((logValues[index]! - minLogValue) / logRange) * usableHeight;

    return { ...item, x, y };
  });
  const fullPath = buildPath(points);
  const visiblePath = buildPath(points.slice(0, currentIndex + 2));
  const activeTone = getEventTone(activeEvent);

  return (
    <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.025] px-3 py-3">
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/34">
            REHEARSAL PATH
          </div>
          <div className="mt-1 text-sm font-semibold text-white">
            다음 10년의 흔들림을 미리 지나갑니다
          </div>
        </div>
        <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-white/56">
          {formatMonth(activeEvent.month)}
        </div>
      </div>

      <svg
        aria-label={`미래 하락장 리허설 경로, 현재 지점은 ${activeEvent.title}`}
        className="mt-3 h-auto w-full overflow-visible"
        role="img"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        <defs>
          <linearGradient id="future-rehearsal-path" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="55%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="future-rehearsal-glow" x="-20%" y="-30%" width="140%" height="160%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {[0.25, 0.5, 0.75].map((ratio) => {
          const y = CHART_PADDING_Y + (CHART_HEIGHT - CHART_PADDING_Y * 2) * ratio;

          return (
            <line
              key={ratio}
              stroke="rgba(148, 163, 184, 0.18)"
              strokeDasharray="4 6"
              strokeWidth="1"
              x1={CHART_PADDING_X}
              x2={CHART_WIDTH - CHART_PADDING_X}
              y1={y}
              y2={y}
            />
          );
        })}

        <path
          d={fullPath}
          fill="none"
          stroke="rgba(148, 163, 184, 0.32)"
          strokeDasharray="5 7"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        <path
          d={visiblePath}
          fill="none"
          filter="url(#future-rehearsal-glow)"
          opacity="0.28"
          stroke="url(#future-rehearsal-path)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="10"
        />
        <path
          d={visiblePath}
          fill="none"
          stroke="url(#future-rehearsal-path)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />

        {points.slice(1).map((point, index) => {
          const event = events[index]!;
          const tone = getEventTone(event);
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex || isComplete;

          return (
            <g key={event.id}>
              <circle
                cx={point.x}
                cy={point.y}
                fill={isPast || isCurrent ? tone.fill : "rgba(148, 163, 184, 0.5)"}
                r={isCurrent ? 7 : 5}
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="2"
              />
              {isCurrent ? (
                <>
                  <line
                    stroke="rgba(96, 165, 250, 0.45)"
                    strokeDasharray="4 5"
                    strokeWidth="1"
                    x1={point.x}
                    x2={point.x}
                    y1={CHART_PADDING_Y}
                    y2={CHART_HEIGHT - CHART_PADDING_Y}
                  />
                  <text
                    fill={activeTone.stroke}
                    fontSize="10"
                    fontWeight="700"
                    textAnchor={point.x > CHART_WIDTH - 90 ? "end" : "start"}
                    x={point.x > CHART_WIDTH - 90 ? point.x - 8 : point.x + 8}
                    y={Math.max(14, point.y - 10)}
                  >
                    {activeTone.label}
                  </text>
                </>
              ) : null}
            </g>
          );
        })}

        <text fill="rgba(100, 116, 139, 0.8)" fontSize="10" fontWeight="600" x={CHART_PADDING_X} y={CHART_HEIGHT - 4}>
          시작
        </text>
        <text
          fill="rgba(100, 116, 139, 0.8)"
          fontSize="10"
          fontWeight="600"
          textAnchor="end"
          x={CHART_WIDTH - CHART_PADDING_X}
          y={CHART_HEIGHT - 4}
        >
          10년
        </text>
      </svg>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {events.map((event, index) => {
          const tone = getEventTone(event);
          const isActive = index === currentIndex;

          return (
            <div
              className={[
                "rounded-[14px] border px-2.5 py-2",
                isActive
                  ? "border-[var(--rz-border-strong)] bg-[var(--rz-accent-soft)]"
                  : "border-white/8 bg-white/[0.025]",
              ].join(" ")}
              key={event.id}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/44">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: tone.fill }}
                />
                {formatMonth(event.month)}
              </div>
              <div className="mt-1 truncate text-xs font-semibold text-white">{event.title}</div>
              <div className="mt-0.5 text-[11px] text-white/44">
                {formatKrw(event.valueAfterKrw)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
