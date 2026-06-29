import { formatPercent } from "@/lib/race-engine";
import type { HoldingPainReport } from "@/features/pain-of-holding";

interface PainSummaryCardProps {
  report: HoldingPainReport;
}

function formatRecoveryPeriod(report: HoldingPainReport) {
  if (report.maxDrawdown.maxDrawdownPct === 0) {
    return "하락 없음";
  }

  if (!report.recovery.recovered) {
    return "미회복";
  }

  if ((report.recovery.recoveryMonths ?? 0) < 1) {
    return "1개월 미만";
  }

  return `${report.recovery.recoveryMonths}개월`;
}

export function PainSummaryCard({ report }: PainSummaryCardProps) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.015] px-3.5 py-3">
      <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">수익의 대가</div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <div className="text-[11px] text-white/42">최대 낙폭</div>
          <div className="mt-1.5 text-sm font-semibold text-white">
            {formatPercent(report.maxDrawdown.maxDrawdownPct * 100)}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-white/42">회복 기간</div>
          <div className="mt-1.5 text-sm font-semibold text-white">{formatRecoveryPeriod(report)}</div>
        </div>
        <div>
          <div className="text-[11px] text-white/42">큰 고비</div>
          <div className="mt-1.5 text-sm font-semibold text-white">{report.crises.crisisCount}번</div>
        </div>
      </div>
    </div>
  );
}
