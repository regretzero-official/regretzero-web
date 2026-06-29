import type { HoldingPainReport } from "@/features/pain-of-holding";

interface DifficultyCardProps {
  accent: string;
  report: HoldingPainReport;
}

export function DifficultyCard({ accent, report }: DifficultyCardProps) {
  return (
    <div className="surface-card-elevated rounded-[24px] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">버티기 난이도</div>
          <div className="mt-3 text-[2.15rem] font-semibold tracking-[-0.06em] text-white">
            {report.difficulty.score.toFixed(1)}
            <span className="ml-1 text-base text-white/42">/ 10</span>
          </div>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: `${accent}20`, color: accent }}
        >
          {report.difficulty.label}
        </div>
      </div>
      <div className="mt-2 text-sm leading-6 text-white/60">{report.difficulty.explanation}</div>
    </div>
  );
}
