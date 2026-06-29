import type { HoldingPainReport } from "@/features/pain-of-holding";
import { formatKrwCompact, formatPercent } from "@/lib/race-engine";

interface WorstMomentCardProps {
  report: HoldingPainReport;
}

function formatKoreanDate(date: string) {
  const [year, month] = date.split("-");
  return `${year}년 ${month}월`;
}

export function WorstMomentCard({ report }: WorstMomentCardProps) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.015] px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">가장 힘들었던 순간</div>
      <div className="mt-2.5 text-sm font-semibold tracking-[-0.02em] text-white">
        {formatKoreanDate(report.worstMoment.date)}
      </div>
      <div className="mt-1.5 text-sm text-white/56">
        전고점 대비 {formatPercent(report.worstMoment.drawdownPct * 100)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
          <div className="text-[11px] text-white/42">줄어든 금액</div>
          <div className="mt-2 font-semibold text-white">
            {formatKrwCompact(report.worstMoment.lossAmount)}
          </div>
        </div>
        <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
          <div className="text-[11px] text-white/42">저점 평가금액</div>
          <div className="mt-2 font-semibold text-white">
            {formatKrwCompact(report.worstMoment.troughValue)}
          </div>
        </div>
      </div>
      <div className="mt-3 text-sm leading-6 text-white/52">{report.worstMoment.recoveryText}</div>
    </div>
  );
}
