import { describe, expect, it } from "vitest";

import { buildCrisisDetailInsight } from "@/features/detail-chart/utils/buildCrisisDetailInsight";
import type { CrisisRange } from "@/features/pain-of-holding";

const recoveredCrisis: CrisisRange = {
  endDate: "2023-06-30",
  endIndex: 18,
  maxDrawdownPct: -31.2,
  recoveredToNearHigh: true,
  startDate: "2022-12-30",
  startIndex: 0,
  troughDate: "2023-03-31",
  troughIndex: 9,
};

describe("buildCrisisDetailInsight", () => {
  it("explains a recovered crisis with drawdown, recovery, and timeline", () => {
    const insight = buildCrisisDetailInsight(recoveredCrisis, "엔비디아", "2026-05-08");

    expect(insight.summary).toContain("엔비디아");
    expect(insight.summary).toContain("31.2%");
    expect(insight.drawdownLabel).toBe("31.2%");
    expect(insight.recoveryLabel).toBe("3개월 뒤 회복");
    expect(insight.totalDurationLabel).toBe("6개월");
    expect(insight.timeline).toEqual([
      expect.objectContaining({ id: "start", valueLabel: "전고점" }),
      expect.objectContaining({ id: "trough", valueLabel: "-31.2%" }),
      expect.objectContaining({ id: "recovery", dateLabel: "2023.06.30" }),
    ]);
  });

  it("makes unrecovered crises explicit instead of implying recovery", () => {
    const insight = buildCrisisDetailInsight(
      {
        ...recoveredCrisis,
        endDate: null,
        endIndex: null,
        recoveredToNearHigh: false,
      },
      "QQQ",
      "2026-05-08",
    );

    expect(insight.summary).toContain("아직 전고점을 회복하지 못했습니다");
    expect(insight.recoveryLabel).toBe("아직 회복 전");
    expect(insight.timeline[2]).toEqual(
      expect.objectContaining({
        dateLabel: "미회복",
        tone: "danger",
        valueLabel: "아직 회복 전",
      }),
    );
  });
});
