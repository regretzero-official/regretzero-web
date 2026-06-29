"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { pickSyncedMatchup, type SyncedMatchup } from "@/components/SyncEngine";
import type { ComparisonAssetId } from "@/lib/home-content";

export type DynamicTimelineScenario = {
  amountKrw: number;
  assetIds: ComparisonAssetId[];
  investmentMode: "lump-sum" | "monthly";
  label: string;
};

type DynamicLiveTimelineProps = {
  matchups?: SyncedMatchup[];
  onReplayScenario?: (scenario: DynamicTimelineScenario) => void;
};

type TimelineItem = {
  id: string;
  amountLabel: string;
  actor: string;
  headline: string;
  detail: string;
  modeLabel: string;
  valueLabel: string;
  rateLabel: string;
  scenario: DynamicTimelineScenario;
};

const SAFE_SYSTEM_SIGNATURES = [
  "📱 모바일 브라우저로 접속한 개미",
  "🪐 타임머신 #4829호 탑승객",
  "💻 데스크톱 환경에서 분석 중인 개미",
  "👤 익명의 30대 가치투자자",
  "🪐 타임머신 #7361호 탑승객",
  "📱 모바일 환경에서 복기 중인 개미",
  "💻 데스크톱 환경에서 복기 중인 개미",
  "👤 익명의 장기투자 연습생",
  "🪐 타임머신 #9154호 탑승객",
  "📊 익명의 과거 시뮬레이션 방문자",
  "👤 익명의 20대 사회초년생",
  "💻 데스크톱 환경에서 비교 중인 개미",
];

const fallbackMatchups: SyncedMatchup[] = [
  {
    id: "fallback-tsla-nvda",
    assetIds: ["tsla", "nvda"],
    label: "테슬라 vs 엔비디아",
    rank: 1,
    viewers: 1482,
    amountKrw: 1000,
    investmentMode: "lump-sum",
    valueLabel: "3억 5,000만원",
    rateLabel: "+2,950%",
    summary: "성장주 대표 자산의 다른 속도를 봅니다.",
  },
  {
    id: "fallback-btc-deposit",
    assetIds: ["btc", "deposit"],
    label: "비트코인 vs 정기예금",
    rank: 2,
    viewers: 1216,
    amountKrw: 1000,
    investmentMode: "lump-sum",
    valueLabel: "5억 2,000만원",
    rateLabel: "+10,400%",
    summary: "크게 흔들린 길과 안정적인 길을 봅니다.",
  },
  {
    id: "fallback-seoul-qqq",
    assetIds: ["seoul_apt", "qqq"],
    label: "서울 아파트 vs 나스닥100 ETF",
    rank: 3,
    viewers: 1064,
    amountKrw: 30,
    investmentMode: "monthly",
    valueLabel: "8,900만원",
    rateLabel: "+240%",
    summary: "부동산 지수와 미국 기술주 ETF를 비교합니다.",
  },
];

const createSequenceSeed = () => Math.floor(Date.now() / 1000);

const buildActor = (index: number) => {
  const base = SAFE_SYSTEM_SIGNATURES[index % SAFE_SYSTEM_SIGNATURES.length] ?? SAFE_SYSTEM_SIGNATURES[0]!;
  if (!base.includes("#")) return base;
  const number = 1000 + ((index * 7919 + createSequenceSeed()) % 9000);
  return base.replace(/#\d+/, `#${number}`);
};

const formatScenarioAmount = (matchup: SyncedMatchup) => {
  if (matchup.investmentMode === "monthly") {
    return `월 ${matchup.amountKrw.toLocaleString("ko-KR")}만원 적립식`;
  }
  return `${matchup.amountKrw.toLocaleString("ko-KR")}만원 거치식`;
};

const buildTimelineItem = (matchup: SyncedMatchup, sequence: number): TimelineItem => {
  const actor = buildActor(sequence);
  const investmentLabel = formatScenarioAmount(matchup);
  return {
    id: `${matchup.id}-${sequence}-${Date.now()}`,
    amountLabel: `${matchup.amountKrw.toLocaleString("ko-KR")}만원`,
    actor,
    headline: `${matchup.label} 시뮬레이션 완료`,
    detail: `10년 전 ${matchup.label}에 ${investmentLabel}으로 들어갔다면`,
    modeLabel: matchup.investmentMode === "monthly" ? "매달 적립" : "한 번에 투자",
    valueLabel: matchup.valueLabel,
    rateLabel: matchup.rateLabel,
    scenario: {
      amountKrw: matchup.amountKrw,
      assetIds: matchup.assetIds,
      investmentMode: matchup.investmentMode,
      label: matchup.label,
    },
  };
};

const buildInitialItems = (matchups: SyncedMatchup[]) => {
  const source = matchups.length > 0 ? matchups : fallbackMatchups;
  return source.slice(0, 3).map((matchup, index) => buildTimelineItem(matchup, index + 1));
};

export function DynamicLiveTimeline({ matchups = fallbackMatchups, onReplayScenario }: DynamicLiveTimelineProps) {
  const sourceMatchups = useMemo(() => (matchups.length > 0 ? matchups : fallbackMatchups), [matchups]);
  const [items, setItems] = useState<TimelineItem[]>(() => buildInitialItems(sourceMatchups));
  const sequenceRef = useRef(sourceMatchups.length + 1);
  const [totalRuns, setTotalRuns] = useState(() => {
    const base = 143_698;
    const now = new Date();
    return base + now.getHours() * 137 + now.getMinutes() * 3;
  });

  useEffect(() => {
    const intervalMs = 4200 + Math.floor(Math.random() * 1400);
    const interval = window.setInterval(() => {
      const currentSequence = sequenceRef.current;
      sequenceRef.current = currentSequence + 1;
      const matchup = pickSyncedMatchup(sourceMatchups, currentSequence * 17 + Date.now());
      if (matchup) {
        const nextItem = buildTimelineItem(matchup, currentSequence);
        setItems((currentItems) => [nextItem, ...currentItems].slice(0, 3));
      }
      setTotalRuns((current) => current + 1 + Math.floor(Math.random() * 2));
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [sourceMatchups]);

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-slate-200 !bg-white p-5 !text-slate-950 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] !text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Timeline
          </div>
          <h2 className="text-xl font-black tracking-[-0.04em] !text-slate-950 sm:text-2xl">
            ⚡ 지금 이 순간, 다른 타임머신의 기록
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 !text-slate-600 sm:text-[15px]">
            상단에서 흐르는 매치업을 바탕으로 만든 익명 시뮬레이션 기록입니다.
          </p>
        </div>
        <div className="shrink-0 rounded-full border border-slate-200 !bg-slate-50 px-3 py-2 text-right shadow-sm sm:px-4 sm:py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] !text-slate-500">누적 가동</p>
          <p className="mt-1 text-xs font-black !text-slate-900 sm:text-sm">
            🛸 {totalRuns.toLocaleString("ko-KR")}회
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="rounded-2xl border border-slate-200 !bg-white px-4 py-3 !text-slate-950 shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold !text-slate-500">{item.actor} · 방금 전</p>
                  <h3 className="mt-1 [display:-webkit-box] overflow-hidden text-sm font-bold tracking-tight !text-slate-900 [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                    {item.headline}
                  </h3>
                </div>
                <div className="shrink-0 text-right">
                  <p className="whitespace-nowrap text-base font-extrabold !text-slate-950">{item.valueLabel}</p>
                  <p className="mt-0.5 text-xs font-bold !text-emerald-700">{item.rateLabel}</p>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="[display:-webkit-box] min-w-0 overflow-hidden text-xs font-medium leading-5 !text-slate-600 [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {item.detail}
                </p>
                {onReplayScenario ? (
                  <button
                    type="button"
                    onClick={() => onReplayScenario(item.scenario)}
                    className="shrink-0 rounded-md border border-slate-300 !bg-white px-2 py-1 text-xs font-bold !text-slate-700 transition hover:border-slate-400 hover:!bg-slate-50"
                  >
                    🚀 해보기
                  </button>
                ) : null}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 !bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium !text-slate-500">방식</span>
                  <span className="truncate text-xs font-semibold !text-slate-800">{item.modeLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 !bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium !text-slate-500">금액</span>
                  <span className="truncate text-xs font-semibold !text-slate-800">{item.amountLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 !bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium !text-slate-500">기간</span>
                  <span className="text-xs font-semibold !text-slate-800">10년</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 !bg-emerald-50 px-3 py-2">
                  <span className="text-xs font-medium !text-emerald-900/70">수익률</span>
                  <span className="truncate text-xs font-bold !text-emerald-900">{item.rateLabel}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default DynamicLiveTimeline;
